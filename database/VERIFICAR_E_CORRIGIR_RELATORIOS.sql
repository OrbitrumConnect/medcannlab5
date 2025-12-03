-- =====================================================
-- VERIFICAR E CORRIGIR: Relatórios Compartilhados
-- Execute este script para verificar o que está faltando
-- =====================================================

-- 1. VERIFICAR SE A FUNÇÃO RPC EXISTE
-- =====================================================
SELECT 
  'Função RPC get_shared_reports_for_doctor' as verificacao,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM information_schema.routines 
      WHERE routine_name = 'get_shared_reports_for_doctor'
    ) THEN '✅ EXISTE'
    ELSE '❌ NÃO EXISTE - Execute ADICIONAR_COMPARTILHAMENTO_RELATORIOS.sql'
  END as status;

SELECT 
  'Função RPC share_report_with_doctors' as verificacao,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM information_schema.routines 
      WHERE routine_name = 'share_report_with_doctors'
    ) THEN '✅ EXISTE'
    ELSE '❌ NÃO EXISTE - Execute ADICIONAR_COMPARTILHAMENTO_RELATORIOS.sql'
  END as status;

-- 2. VERIFICAR RELATÓRIOS NO BANCO
-- =====================================================
SELECT 
  'Total de relatórios' as metric,
  COUNT(*) as valor
FROM clinical_reports;

SELECT 
  'Relatórios com shared_with preenchido' as metric,
  COUNT(*) as valor
FROM clinical_reports
WHERE shared_with IS NOT NULL
  AND array_length(shared_with, 1) > 0;

SELECT 
  'Relatórios com status = shared' as metric,
  COUNT(*) as valor
FROM clinical_reports
WHERE status = 'shared';

-- 3. VERIFICAR NOTIFICAÇÕES
-- =====================================================
SELECT 
  'Notificações de relatórios compartilhados' as metric,
  COUNT(*) as valor
FROM notifications
WHERE type = 'report_shared';

-- 4. VER RELATÓRIOS COMPARTILHADOS (SE HOUVER)
-- =====================================================
SELECT 
  id,
  patient_name,
  status,
  shared_with,
  shared_at,
  shared_by,
  created_at
FROM clinical_reports
WHERE shared_with IS NOT NULL
  AND array_length(shared_with, 1) > 0
ORDER BY shared_at DESC NULLS LAST
LIMIT 5;

-- 5. VER NOTIFICAÇÕES RECENTES
-- =====================================================
SELECT 
  id,
  type,
  title,
  message,
  data->>'report_id' as report_id,
  user_id,
  created_at,
  read
FROM notifications
WHERE type = 'report_shared'
ORDER BY created_at DESC
LIMIT 5;

-- 6. VERIFICAR SE HÁ NOTIFICAÇÃO SEM RELATÓRIO COMPARTILHADO
-- =====================================================
SELECT 
  n.id as notification_id,
  n.data->>'report_id' as report_id,
  n.user_id as notified_user_id,
  n.created_at as notification_date,
  cr.id as report_exists,
  cr.shared_with,
  cr.status as report_status,
  CASE 
    WHEN cr.id IS NULL THEN '❌ Relatório não existe'
    WHEN cr.shared_with IS NULL THEN '❌ Relatório não tem shared_with'
    WHEN NOT (n.user_id::uuid = ANY(cr.shared_with)) THEN '❌ User ID não está em shared_with'
    ELSE '✅ Tudo OK'
  END as diagnostico
FROM notifications n
LEFT JOIN clinical_reports cr ON cr.id = n.data->>'report_id'
WHERE n.type = 'report_shared'
ORDER BY n.created_at DESC
LIMIT 10;

-- =====================================================
-- SE AS FUNÇÕES NÃO EXISTIREM, EXECUTE O SCRIPT ABAIXO
-- =====================================================

-- CRIAR FUNÇÃO get_shared_reports_for_doctor (SE NÃO EXISTIR)
-- =====================================================
CREATE OR REPLACE FUNCTION get_shared_reports_for_doctor(
  p_doctor_id UUID
)
RETURNS TABLE (
  id TEXT,
  patient_id TEXT,
  patient_name TEXT,
  report_type TEXT,
  protocol TEXT,
  status TEXT,
  shared_at TIMESTAMP WITH TIME ZONE,
  generated_at TIMESTAMP WITH TIME ZONE,
  content JSONB
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    cr.id,
    cr.patient_id::TEXT,
    cr.patient_name,
    cr.report_type,
    cr.protocol,
    cr.status,
    cr.shared_at,
    cr.generated_at,
    cr.content
  FROM clinical_reports cr
  WHERE p_doctor_id = ANY(cr.shared_with)
    AND cr.shared_with IS NOT NULL
    AND array_length(cr.shared_with, 1) > 0
  ORDER BY cr.shared_at DESC NULLS LAST, cr.generated_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- CRIAR FUNÇÃO share_report_with_doctors (SE NÃO EXISTIR)
-- =====================================================
CREATE OR REPLACE FUNCTION share_report_with_doctors(
  p_report_id TEXT,
  p_patient_id UUID,
  p_doctor_ids UUID[]
)
RETURNS JSONB AS $$
DECLARE
  v_result JSONB;
  v_doctor_id UUID;
  v_doctor_name TEXT;
BEGIN
  -- Verificar se o relatório existe e pertence ao paciente
  IF NOT EXISTS (
    SELECT 1 FROM clinical_reports 
    WHERE id = p_report_id AND patient_id = p_patient_id
  ) THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Relatório não encontrado ou não pertence ao paciente'
    );
  END IF;

  -- Atualizar relatório com médicos compartilhados
  UPDATE clinical_reports
  SET 
    shared_with = p_doctor_ids,
    shared_at = NOW(),
    shared_by = p_patient_id,
    status = CASE WHEN status = 'completed' THEN 'shared' ELSE status END,
    updated_at = NOW()
  WHERE id = p_report_id AND patient_id = p_patient_id;

  -- Criar notificações para os médicos
  FOR v_doctor_id IN SELECT unnest(p_doctor_ids)
  LOOP
    SELECT name INTO v_doctor_name 
    FROM users 
    WHERE id = v_doctor_id;
    
    INSERT INTO notifications (
      id,
      type,
      title,
      message,
      data,
      user_id,
      user_type,
      created_at,
      read
    ) VALUES (
      gen_random_uuid()::TEXT,
      'report_shared',
      'Novo Relatório Compartilhado',
      COALESCE(
        (SELECT patient_name FROM clinical_reports WHERE id = p_report_id),
        'Um paciente'
      ) || ' compartilhou uma avaliação clínica inicial com você.',
      jsonb_build_object(
        'report_id', p_report_id,
        'patient_id', p_patient_id,
        'shared_at', NOW()
      ),
      v_doctor_id::TEXT,
      'professional',
      NOW(),
      false
    )
    ON CONFLICT (id) DO NOTHING;
  END LOOP;

  RETURN jsonb_build_object(
    'success', true,
    'report_id', p_report_id,
    'shared_with', p_doctor_ids,
    'shared_at', NOW(),
    'message', 'Relatório compartilhado com sucesso'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- VERIFICAÇÃO FINAL
-- =====================================================
SELECT 
  '✅ Script executado com sucesso!' as status,
  'Verifique os resultados acima' as proximo_passo;

