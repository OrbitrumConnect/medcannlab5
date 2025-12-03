-- =====================================================
-- TESTE FINAL DE SEGURANÇA - CLINICAL_ASSESSMENTS
-- MedCannLab 3.0 - Verificação Definitiva
-- =====================================================

-- Execute este teste como ADMIN para verificar se as políticas estão corretas

-- 1. TESTE PRINCIPAL: Admin não deve ver todas as avaliações
-- =====================================================
SELECT 
  'Teste Principal de Segurança' as teste,
  COUNT(*) as total_assessments_no_sistema,
  COUNT(*) FILTER (WHERE doctor_id = auth.uid()) as assessments_onde_admin_e_medico,
  COUNT(*) FILTER (WHERE patient_id = auth.uid()) as assessments_do_admin_como_paciente,
  COUNT(*) FILTER (WHERE doctor_id IS NULL) as assessments_sem_medico,
  COUNT(*) FILTER (WHERE doctor_id != auth.uid() AND patient_id != auth.uid() AND doctor_id IS NOT NULL) as assessments_nao_acessiveis,
  CASE 
    -- Se há avaliações não acessíveis, está seguro
    WHEN COUNT(*) FILTER (WHERE doctor_id != auth.uid() AND patient_id != auth.uid() AND doctor_id IS NOT NULL) > 0
    THEN '✅ SEGURO - Admin não vê todas as avaliações'
    -- Se todas as avaliações são do admin como médico, também está seguro
    WHEN COUNT(*) FILTER (WHERE doctor_id = auth.uid()) = COUNT(*) FILTER (WHERE doctor_id IS NOT NULL)
    THEN '✅ SEGURO - Admin só vê suas avaliações como médico'
    -- Se não há avaliações no sistema
    WHEN COUNT(*) = 0
    THEN 'ℹ️ Nenhuma avaliação no sistema'
    -- Caso contrário, há problema
    ELSE '🔴 PROBLEMA - Admin pode estar vendo todas as avaliações'
  END as resultado_seguranca
FROM clinical_assessments;

-- 2. VERIFICAR POLÍTICAS ATIVAS
-- =====================================================
SELECT 
  'Políticas Ativas' as info,
  policyname,
  cmd,
  CASE 
    WHEN qual LIKE '%doctor_id = auth.uid()%' AND qual NOT LIKE '%OR%' THEN '✅ Restritiva'
    WHEN qual LIKE '%patient_id = auth.uid()%' THEN '✅ Restritiva'
    WHEN qual LIKE '%admin%' AND qual LIKE '%OR%' THEN '🔴 PERIGOSA - Condição OR'
    WHEN qual LIKE '%admin%' AND qual NOT LIKE '%doctor_id%' THEN '🔴 PERIGOSA - Sem restrição'
    ELSE 'ℹ️ Verificar'
  END as status
FROM pg_policies
WHERE tablename = 'clinical_assessments'
ORDER BY 
  CASE 
    WHEN qual LIKE '%OR%' AND qual LIKE '%admin%' THEN 1
    WHEN qual LIKE '%admin%' AND qual NOT LIKE '%doctor_id%' THEN 2
    ELSE 3
  END;

-- 3. VERIFICAR SE HÁ POLÍTICAS PERIGOSAS
-- =====================================================
SELECT 
  'Políticas Perigosas Encontradas' as alerta,
  COUNT(*) as quantidade
FROM pg_policies
WHERE tablename = 'clinical_assessments'
AND (
  (qual LIKE '%admin%' AND qual LIKE '%OR%')
  OR
  (qual LIKE '%admin%' AND qual NOT LIKE '%doctor_id%' AND qual NOT LIKE '%shared%')
);

-- 4. DETALHAMENTO DAS AVALIAÇÕES
-- =====================================================
SELECT 
  'Detalhamento' as info,
  COUNT(*) as total,
  COUNT(*) FILTER (WHERE doctor_id = auth.uid()) as admin_e_medico,
  COUNT(*) FILTER (WHERE patient_id = auth.uid()) as admin_e_paciente,
  COUNT(*) FILTER (WHERE doctor_id IS NULL) as sem_medico,
  COUNT(*) FILTER (WHERE doctor_id != auth.uid() AND patient_id != auth.uid()) as outras
FROM clinical_assessments;

-- 5. VERIFICAR AVALIAÇÕES QUE ADMIN NÃO DEVE VER
-- =====================================================
SELECT 
  id,
  patient_id,
  doctor_id,
  status,
  created_at,
  CASE 
    WHEN doctor_id = auth.uid() THEN '✅ Acessível - Admin é médico'
    WHEN patient_id = auth.uid() THEN '✅ Acessível - Admin é paciente'
    WHEN doctor_id IS NULL THEN '⚠️ Sem médico - Só paciente vê'
    ELSE '🔒 NÃO Acessível - Outro médico/paciente'
  END as status_acesso
FROM clinical_assessments
ORDER BY created_at DESC
LIMIT 20;

-- =====================================================
-- INTERPRETAÇÃO DOS RESULTADOS
-- =====================================================
-- ✅ Se "assessments_nao_acessiveis" > 0: SEGURO
-- ✅ Se todas são do admin como médico: SEGURO
-- 🔴 Se admin vê todas: PROBLEMA - Executar REVOGAR_PERMISSOES_DEFINITIVO.sql
-- =====================================================

