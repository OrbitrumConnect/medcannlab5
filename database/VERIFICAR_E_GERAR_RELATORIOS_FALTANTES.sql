-- =====================================================
-- VERIFICAR E GERAR RELATÓRIOS FALTANTES
-- =====================================================
-- Este script verifica avaliações concluídas sem relatórios correspondentes
-- e identifica casos que precisam de correção

-- 1. VERIFICAR AVALIAÇÕES DO JOÃO EDUARDO VIDAL
-- =====================================================
SELECT 
  ca.id as assessment_id,
  ca.patient_id,
  u.name as patient_name,
  u.email as patient_email,
  ca.status as assessment_status,
  ca.assessment_type,
  ca.created_at as assessment_created_at,
  ca.updated_at as assessment_updated_at,
  CASE 
    WHEN cr.id IS NULL THEN '❌ SEM RELATÓRIO'
    ELSE '✅ COM RELATÓRIO'
  END as report_status,
  cr.id as report_id,
  cr.generated_at as report_generated_at
FROM clinical_assessments ca
LEFT JOIN users u ON u.id = ca.patient_id
LEFT JOIN clinical_reports cr ON cr.patient_id = ca.patient_id 
  AND cr.generated_at >= ca.created_at - INTERVAL '1 hour'
  AND cr.generated_at <= ca.created_at + INTERVAL '24 hours'
WHERE ca.status = 'completed'
  AND (u.name ILIKE '%João Eduardo%' OR u.name ILIKE '%Joao Eduardo%' OR u.name ILIKE '%Vidal%')
ORDER BY ca.created_at DESC;

-- 2. VERIFICAR TODAS AS AVALIAÇÕES SEM RELATÓRIOS
-- =====================================================
SELECT 
  ca.id as assessment_id,
  ca.patient_id,
  u.name as patient_name,
  u.email as patient_email,
  ca.status as assessment_status,
  ca.assessment_type,
  ca.created_at as assessment_created_at,
  '❌ SEM RELATÓRIO' as report_status
FROM clinical_assessments ca
LEFT JOIN users u ON u.id = ca.patient_id
LEFT JOIN clinical_reports cr ON cr.patient_id = ca.patient_id 
  AND cr.generated_at >= ca.created_at - INTERVAL '1 hour'
  AND cr.generated_at <= ca.created_at + INTERVAL '24 hours'
WHERE ca.status = 'completed'
  AND cr.id IS NULL
ORDER BY ca.created_at DESC;

-- 3. CONTAR AVALIAÇÕES SEM RELATÓRIOS POR PACIENTE
-- =====================================================
SELECT 
  u.name as patient_name,
  u.email as patient_email,
  COUNT(ca.id) as assessments_sem_relatorio,
  MAX(ca.created_at) as ultima_avaliacao
FROM clinical_assessments ca
LEFT JOIN users u ON u.id = ca.patient_id
LEFT JOIN clinical_reports cr ON cr.patient_id = ca.patient_id 
  AND cr.generated_at >= ca.created_at - INTERVAL '1 hour'
  AND cr.generated_at <= ca.created_at + INTERVAL '24 hours'
WHERE ca.status = 'completed'
  AND cr.id IS NULL
GROUP BY u.id, u.name, u.email
ORDER BY assessments_sem_relatorio DESC, ultima_avaliacao DESC;

