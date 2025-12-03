-- =====================================================
-- VERIFICAÇÃO COMPLETA DE SEGURANÇA
-- MedCannLab 3.0 - Teste Definitivo
-- =====================================================

-- 1. TESTE PRINCIPAL: Quantas avaliações o admin vê?
-- =====================================================
-- Execute como ADMIN logado
SELECT 
  'Teste Principal' as tipo_teste,
  COUNT(*) as total_que_admin_ve,
  (SELECT COUNT(*) FROM clinical_assessments) as total_no_sistema,
  CASE 
    WHEN COUNT(*) < (SELECT COUNT(*) FROM clinical_assessments) 
    THEN '✅ SEGURO - Admin não vê todas'
    WHEN COUNT(*) = (SELECT COUNT(*) FROM clinical_assessments)
    THEN '🔴 PROBLEMA - Admin vê TODAS as avaliações!'
    ELSE 'ℹ️ Verificar'
  END as resultado
FROM clinical_assessments;

-- 2. DETALHAMENTO: O que o admin vê?
-- =====================================================
SELECT 
  'Detalhamento do que admin vê' as info,
  COUNT(*) FILTER (WHERE doctor_id = auth.uid()) as onde_admin_e_medico,
  COUNT(*) FILTER (WHERE patient_id = auth.uid()) as onde_admin_e_paciente,
  COUNT(*) FILTER (WHERE doctor_id IS NULL) as sem_medico,
  COUNT(*) FILTER (WHERE doctor_id != auth.uid() AND patient_id != auth.uid() AND doctor_id IS NOT NULL) as de_outros
FROM clinical_assessments;

-- 3. VERIFICAR TODAS AS POLÍTICAS ATIVAS
-- =====================================================
SELECT 
  policyname as "Nome da Política",
  cmd as "Comando (SELECT/INSERT/UPDATE)",
  CASE 
    WHEN qual LIKE '%doctor_id = auth.uid()%' AND qual NOT LIKE '%OR%' THEN '✅ Restritiva'
    WHEN qual LIKE '%patient_id = auth.uid()%' THEN '✅ Restritiva'
    WHEN qual LIKE '%shared%' AND qual LIKE '%consent%' THEN '✅ Restritiva - Compartilhamento'
    WHEN qual LIKE '%admin%' AND qual LIKE '%OR%' THEN '🔴 PERIGOSA - Condição OR'
    WHEN qual LIKE '%admin%' AND qual NOT LIKE '%doctor_id%' AND qual NOT LIKE '%shared%' THEN '🔴 PERIGOSA - Sem restrição'
    WHEN qual LIKE '%TRUE%' AND qual LIKE '%admin%' THEN '🔴 PERIGOSA - Permite tudo'
    ELSE 'ℹ️ Verificar manualmente'
  END as "Status",
  qual as "Condição SQL"
FROM pg_policies
WHERE tablename = 'clinical_assessments'
ORDER BY 
  CASE 
    WHEN qual LIKE '%OR%' AND qual LIKE '%admin%' THEN 1
    WHEN qual LIKE '%TRUE%' AND qual LIKE '%admin%' THEN 2
    WHEN qual LIKE '%admin%' AND qual NOT LIKE '%doctor_id%' THEN 3
    ELSE 4
  END;

-- 4. CONTAR POLÍTICAS POR TIPO
-- =====================================================
SELECT 
  CASE 
    WHEN qual LIKE '%doctor_id = auth.uid()%' AND qual NOT LIKE '%OR%' THEN '✅ Restritiva - Médico próprio'
    WHEN qual LIKE '%patient_id = auth.uid()%' THEN '✅ Restritiva - Paciente próprio'
    WHEN qual LIKE '%shared%' THEN '✅ Restritiva - Compartilhamento'
    WHEN qual LIKE '%admin%' AND qual LIKE '%OR%' THEN '🔴 PERIGOSA - OR'
    WHEN qual LIKE '%admin%' AND qual NOT LIKE '%doctor_id%' THEN '🔴 PERIGOSA - Sem restrição'
    ELSE 'ℹ️ Outras'
  END as tipo_politica,
  COUNT(*) as quantidade,
  STRING_AGG(policyname, ', ') as politicas
FROM pg_policies
WHERE tablename = 'clinical_assessments'
GROUP BY 
  CASE 
    WHEN qual LIKE '%doctor_id = auth.uid()%' AND qual NOT LIKE '%OR%' THEN '✅ Restritiva - Médico próprio'
    WHEN qual LIKE '%patient_id = auth.uid()%' THEN '✅ Restritiva - Paciente próprio'
    WHEN qual LIKE '%shared%' THEN '✅ Restritiva - Compartilhamento'
    WHEN qual LIKE '%admin%' AND qual LIKE '%OR%' THEN '🔴 PERIGOSA - OR'
    WHEN qual LIKE '%admin%' AND qual NOT LIKE '%doctor_id%' THEN '🔴 PERIGOSA - Sem restrição'
    ELSE 'ℹ️ Outras'
  END
ORDER BY 
  CASE 
    WHEN CASE 
      WHEN qual LIKE '%doctor_id = auth.uid()%' AND qual NOT LIKE '%OR%' THEN '✅ Restritiva - Médico próprio'
      WHEN qual LIKE '%patient_id = auth.uid()%' THEN '✅ Restritiva - Paciente próprio'
      WHEN qual LIKE '%shared%' THEN '✅ Restritiva - Compartilhamento'
      WHEN qual LIKE '%admin%' AND qual LIKE '%OR%' THEN '🔴 PERIGOSA - OR'
      WHEN qual LIKE '%admin%' AND qual NOT LIKE '%doctor_id%' THEN '🔴 PERIGOSA - Sem restrição'
      ELSE 'ℹ️ Outras'
    END LIKE '%🔴%' THEN 1
    ELSE 2
  END;

-- 5. TESTE ESPECÍFICO: Admin vendo avaliações de outros
-- =====================================================
SELECT 
  'Avaliações que admin NÃO deveria ver' as teste,
  COUNT(*) as quantidade,
  CASE 
    WHEN COUNT(*) = 0 THEN '⚠️ Admin pode estar vendo todas (verificar políticas)'
    ELSE '✅ Admin não vê essas avaliações (correto)'
  END as resultado
FROM clinical_assessments
WHERE doctor_id != auth.uid() 
  AND patient_id != auth.uid() 
  AND doctor_id IS NOT NULL;

-- 6. LISTAR AVALIAÇÕES INDIVIDUALMENTE
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
    ELSE '🔒 NÃO deveria ser acessível'
  END as status_acesso_esperado
FROM clinical_assessments
ORDER BY created_at DESC;

-- =====================================================
-- INTERPRETAÇÃO
-- =====================================================
-- Se "total_que_admin_ve" < "total_no_sistema": ✅ SEGURO
-- Se "total_que_admin_ve" = "total_no_sistema": 🔴 PROBLEMA
-- Se "de_outros" > 0: ✅ SEGURO (admin não vê)
-- Se "de_outros" = 0 mas há avaliações de outros: 🔴 PROBLEMA
-- =====================================================

