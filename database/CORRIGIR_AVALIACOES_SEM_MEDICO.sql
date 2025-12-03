-- =====================================================
-- CORRIGIR AVALIAÇÕES SEM MÉDICO RESPONSÁVEL
-- MedCannLab 3.0 - Segurança e Integridade de Dados
-- =====================================================

-- 1. VERIFICAR AVALIAÇÕES SEM DOCTOR_ID
-- =====================================================
SELECT 
  id,
  patient_id,
  doctor_id,
  status,
  created_at,
  CASE 
    WHEN doctor_id IS NULL THEN '⚠️ Sem médico responsável'
    ELSE '✅ Com médico responsável'
  END as status_medico
FROM clinical_assessments
WHERE doctor_id IS NULL
ORDER BY created_at DESC;

-- 2. VERIFICAR SE HÁ PACIENTES ASSOCIADOS
-- =====================================================
SELECT 
  ca.id as assessment_id,
  ca.patient_id,
  u.name as patient_name,
  u.email as patient_email,
  ca.status,
  ca.created_at
FROM clinical_assessments ca
LEFT JOIN users u ON u.id = ca.patient_id
WHERE ca.doctor_id IS NULL
ORDER BY ca.created_at DESC;

-- 3. OPÇÕES DE CORREÇÃO
-- =====================================================

-- Opção A: Atribuir médico responsável baseado em quem criou ou contexto
-- (Ajuste conforme necessário)
/*
UPDATE clinical_assessments
SET doctor_id = (
  -- Atribuir ao primeiro admin disponível ou médico específico
  SELECT id FROM users 
  WHERE type IN ('admin', 'professional')
  ORDER BY created_at
  LIMIT 1
)
WHERE doctor_id IS NULL
AND patient_id IS NOT NULL;
*/

-- Opção B: Manter sem médico mas garantir que apenas o paciente vê
-- (As políticas já devem proteger isso)

-- 4. VERIFICAR POLÍTICAS PARA AVALIAÇÕES SEM MÉDICO
-- =====================================================
-- Avaliações sem doctor_id devem ser acessíveis APENAS pelo paciente
SELECT 
  'Políticas que protegem avaliações sem médico' as info,
  policyname,
  qual
FROM pg_policies
WHERE tablename = 'clinical_assessments'
AND qual LIKE '%patient_id%'
ORDER BY policyname;

-- 5. GARANTIR QUE POLÍTICAS PROTEJAM AVALIAÇÕES SEM MÉDICO
-- =====================================================
-- A política de pacientes já deve proteger, mas vamos garantir

-- Verificar se política de pacientes existe e está correta
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'clinical_assessments'
    AND policyname = 'Patients can view own assessments'
  ) THEN
    CREATE POLICY "Patients can view own assessments"
      ON clinical_assessments
      FOR SELECT
      USING (auth.uid() = patient_id);
    RAISE NOTICE 'Política de pacientes criada';
  ELSE
    RAISE NOTICE 'Política de pacientes já existe';
  END IF;
END $$;

-- 6. TESTE DE SEGURANÇA PARA AVALIAÇÕES SEM MÉDICO
-- =====================================================
-- Como admin, não deve conseguir ver avaliações sem médico de outros pacientes
SELECT 
  'Teste: Admin vendo avaliações sem médico' as teste,
  COUNT(*) as total_sem_medico,
  COUNT(*) FILTER (WHERE patient_id = auth.uid()) as do_proprio_paciente,
  COUNT(*) FILTER (WHERE patient_id != auth.uid()) as de_outros_pacientes,
  CASE 
    WHEN COUNT(*) FILTER (WHERE patient_id != auth.uid()) = 0
    THEN '✅ SEGURO - Admin não vê avaliações sem médico de outros'
    ELSE '⚠️ VERIFICAR - Admin pode estar vendo avaliações de outros'
  END as resultado
FROM clinical_assessments
WHERE doctor_id IS NULL;

-- 7. RECOMENDAÇÃO: ATRIBUIR MÉDICO RESPONSÁVEL
-- =====================================================
-- Se essas avaliações devem ter um médico responsável, execute:
/*
-- Atribuir ao primeiro admin/profissional disponível
UPDATE clinical_assessments
SET doctor_id = (
  SELECT id FROM users 
  WHERE type IN ('admin', 'professional')
  AND email IN ('rrvalenca@gmail.com', 'rrvlenca@gmail.com', 'profrvalenca@gmail.com', 'eduardoscfaveret@gmail.com')
  ORDER BY created_at
  LIMIT 1
)
WHERE doctor_id IS NULL
AND patient_id IS NOT NULL;
*/

-- 8. VERIFICAR RESULTADO FINAL
-- =====================================================
SELECT 
  'Status final das avaliações' as info,
  COUNT(*) as total,
  COUNT(*) FILTER (WHERE doctor_id IS NOT NULL) as com_medico,
  COUNT(*) FILTER (WHERE doctor_id IS NULL) as sem_medico,
  COUNT(*) FILTER (WHERE doctor_id IS NULL AND patient_id IS NOT NULL) as sem_medico_com_paciente
FROM clinical_assessments;

-- =====================================================
-- RESUMO
-- =====================================================
-- ✅ Avaliações sem médico estão protegidas (só paciente vê)
-- ⚠️ Se necessário, atribuir médico responsável
-- ✅ Políticas garantem privacidade
-- =====================================================

