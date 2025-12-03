-- =====================================================
-- CORRIGIR RELATÓRIO FALTANTE PARA JOÃO EDUARDO VIDAL
-- =====================================================
-- Este script verifica se há avaliações do João Eduardo Vidal
-- sem relatórios correspondentes e fornece informações para correção

-- 1. BUSCAR PACIENTE JOÃO EDUARDO VIDAL
-- =====================================================
SELECT 
  id,
  name,
  email,
  type,
  created_at
FROM users
WHERE name ILIKE '%João Eduardo%' 
   OR name ILIKE '%Joao Eduardo%' 
   OR name ILIKE '%Vidal%'
   OR (name ILIKE '%João%' AND name ILIKE '%Eduardo%')
ORDER BY created_at DESC;

-- 2. VERIFICAR AVALIAÇÕES DO JOÃO EDUARDO VIDAL
-- =====================================================
SELECT 
  ca.id as assessment_id,
  ca.patient_id,
  u.name as patient_name,
  ca.status,
  ca.assessment_type,
  ca.created_at as assessment_date,
  ca.data->>'investigation' as investigation_preview,
  ca.data->>'methodology' as methodology_preview,
  ca.data->>'result' as result_preview,
  ca.data->>'evolution' as evolution_preview
FROM clinical_assessments ca
JOIN users u ON u.id = ca.patient_id
WHERE ca.status = 'completed'
  AND (u.name ILIKE '%João Eduardo%' 
       OR u.name ILIKE '%Joao Eduardo%' 
       OR u.name ILIKE '%Vidal%'
       OR (u.name ILIKE '%João%' AND u.name ILIKE '%Eduardo%'))
ORDER BY ca.created_at DESC;

-- 3. VERIFICAR SE HÁ RELATÓRIOS PARA ESSAS AVALIAÇÕES
-- =====================================================
SELECT 
  ca.id as assessment_id,
  ca.patient_id,
  u.name as patient_name,
  ca.created_at as assessment_date,
  CASE 
    WHEN cr.id IS NULL THEN '❌ SEM RELATÓRIO - PRECISA GERAR'
    ELSE '✅ COM RELATÓRIO'
  END as status_relatorio,
  cr.id as report_id,
  cr.generated_at as report_date
FROM clinical_assessments ca
JOIN users u ON u.id = ca.patient_id
LEFT JOIN clinical_reports cr ON cr.patient_id = ca.patient_id 
  AND cr.generated_at >= ca.created_at - INTERVAL '1 hour'
  AND cr.generated_at <= ca.created_at + INTERVAL '24 hours'
WHERE ca.status = 'completed'
  AND (u.name ILIKE '%João Eduardo%' 
       OR u.name ILIKE '%Joao Eduardo%' 
       OR u.name ILIKE '%Vidal%'
       OR (u.name ILIKE '%João%' AND u.name ILIKE '%Eduardo%'))
ORDER BY ca.created_at DESC;

-- 4. INSTRUÇÕES PARA CORREÇÃO
-- =====================================================
-- Se houver avaliações sem relatórios, execute o seguinte:
-- 
-- 1. Identifique o patient_id do João Eduardo Vidal
-- 2. Chame a função checkAndGenerateMissingReports() do noaResidentAI
--    passando o patient_id como parâmetro
-- 3. Ou use a interface da IA para solicitar a geração do relatório
--
-- Exemplo de chamada via código:
-- const noaAI = new NoaResidentAI()
-- await noaAI.checkAndGenerateMissingReports('patient_id_aqui')

