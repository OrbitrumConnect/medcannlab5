-- =====================================================
-- GERAR RELATÓRIOS FALTANTES PARA PACIENTES ESPECÍFICOS
-- =====================================================
-- Este script gera relatórios para os pacientes identificados
-- com avaliações sem relatórios

-- 1. BUSCAR IDs DOS PACIENTES
-- =====================================================
SELECT 
  u.id as patient_id,
  u.name as patient_name,
  u.email as patient_email,
  COUNT(ca.id) as assessments_sem_relatorio
FROM clinical_assessments ca
JOIN users u ON u.id = ca.patient_id
LEFT JOIN clinical_reports cr ON cr.patient_id = ca.patient_id 
  AND cr.generated_at >= ca.created_at - INTERVAL '1 hour'
  AND cr.generated_at <= ca.created_at + INTERVAL '24 hours'
WHERE ca.status = 'completed'
  AND cr.id IS NULL
GROUP BY u.id, u.name, u.email
ORDER BY assessments_sem_relatorio DESC;

-- 2. GERAR RELATÓRIOS PARA TODOS OS PACIENTES
-- =====================================================
-- Execute a função RPC para gerar todos os relatórios faltantes:
SELECT * FROM generate_missing_reports();

-- 3. VERIFICAR RESULTADOS
-- =====================================================
-- Após executar, verifique se os relatórios foram criados:
SELECT 
  cr.id as report_id,
  cr.patient_name,
  cr.generated_at,
  cr.status,
  ca.id as assessment_id,
  ca.created_at as assessment_date
FROM clinical_reports cr
JOIN clinical_assessments ca ON ca.id = cr.assessment_id
WHERE cr.generated_at >= NOW() - INTERVAL '1 hour'
ORDER BY cr.generated_at DESC;

-- 4. GERAR RELATÓRIOS PARA PACIENTES ESPECÍFICOS
-- =====================================================
-- Maria Souza (3 avaliações)
-- SELECT * FROM generate_missing_reports(
--   (SELECT id FROM users WHERE email = 'graca11souza@gmail.com' LIMIT 1)
-- );

-- Dr. Ricardo Valença - profrvalenca@gmail.com (2 avaliações)
-- SELECT * FROM generate_missing_reports(
--   (SELECT id FROM users WHERE email = 'profrvalenca@gmail.com' LIMIT 1)
-- );

-- Paulo Gonçalves (2 avaliações)
-- SELECT * FROM generate_missing_reports(
--   (SELECT id FROM users WHERE email = 'paulo.goncalves@test.com' LIMIT 1)
-- );

-- João Eduardo Vidal (1 avaliação)
-- SELECT * FROM generate_missing_reports(
--   (SELECT id FROM users WHERE email = 'cbdrepremium@gmail.com' LIMIT 1)
-- );

-- Dr. Ricardo Valença - rrvalenca@gmail.com (1 avaliação)
-- SELECT * FROM generate_missing_reports(
--   (SELECT id FROM users WHERE email = 'rrvalenca@gmail.com' LIMIT 1)
-- );

-- aluno (1 avaliação)
-- SELECT * FROM generate_missing_reports(
--   (SELECT id FROM users WHERE email = 'consultoriodosvalenca@gmail.com' LIMIT 1)
-- );

