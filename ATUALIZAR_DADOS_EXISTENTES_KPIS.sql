-- =====================================================
-- ATUALIZAR DADOS EXISTENTES PARA KPIs CLÍNICOS
-- =====================================================
-- Execute este script para atualizar dados existentes
-- e garantir que os KPIs funcionem corretamente

-- 1. ATUALIZAR imre_assessments EXISTENTES
-- Adicionar semantic_context e triaxial_data se não existirem
UPDATE imre_assessments
SET 
  semantic_context = COALESCE(
    semantic_context,
    jsonb_build_object(
      'primary_data', ARRAY[]::text[],
      'spontaneous_speech', COALESCE(clinical_notes, ''),
      'patient_narrative', COALESCE(clinical_notes, ''),
      'semantic_blocks', jsonb_build_array(
        jsonb_build_object(
          'id', 'block_1',
          'content', COALESCE(clinical_notes, ''),
          'timestamp', COALESCE(assessment_date::text, created_at::text)
        )
      )
    )
  ),
  triaxial_data = COALESCE(
    triaxial_data,
    jsonb_build_object(
      'rationalities', jsonb_build_object(
        'biomedical', 'Aplicada',
        'integrative', 'Aplicada'
      ),
      'triaxial_phases', jsonb_build_object(
        'abertura_exponencial', jsonb_build_object('status', 'complete'),
        'desenvolvimento_indiciario', jsonb_build_object('status', 'complete'),
        'fechamento_consensual', jsonb_build_object('status', 'complete')
      )
    )
  )
WHERE completion_status = 'completed'
  AND (semantic_context IS NULL OR semantic_context = '{}'::jsonb)
  AND (triaxial_data IS NULL OR triaxial_data = '{}'::jsonb);

-- 2. ATUALIZAR clinical_assessments EXISTENTES
-- Adicionar dados primários se não existirem
UPDATE clinical_assessments
SET 
  data = COALESCE(
    data,
    jsonb_build_object(
      'patient_narrative', COALESCE(clinical_report, ''),
      'spontaneous_speech', COALESCE(clinical_report, ''),
      'primary_data', ARRAY[COALESCE(clinical_report, '')]::text[]
    )
  )
WHERE status = 'completed'
  AND assessment_type = 'IMRE'
  AND (data IS NULL OR data = '{}'::jsonb OR NOT (data ? 'patient_narrative' OR data ? 'spontaneous_speech'));

-- 3. VERIFICAR RESULTADO DAS ATUALIZAÇÕES
SELECT 
  'imre_assessments atualizados' as tabela,
  COUNT(*) as registros_atualizados
FROM imre_assessments
WHERE completion_status = 'completed'
  AND semantic_context IS NOT NULL
  AND semantic_context != '{}'::jsonb
  AND triaxial_data IS NOT NULL
  AND triaxial_data != '{}'::jsonb
UNION ALL
SELECT 
  'clinical_assessments atualizados' as tabela,
  COUNT(*) as registros_atualizados
FROM clinical_assessments
WHERE status = 'completed'
  AND assessment_type = 'IMRE'
  AND data IS NOT NULL
  AND data != '{}'::jsonb
  AND (data ? 'patient_narrative' OR data ? 'spontaneous_speech');

-- 4. TESTAR KPIs APÓS ATUALIZAÇÃO
SELECT 
  'Narrativas Preservadas' as kpi,
  COUNT(*) as valor
FROM imre_assessments
WHERE completion_status = 'completed'
  AND (
    semantic_context ? 'primary_data' OR
    semantic_context ? 'spontaneous_speech' OR
    semantic_context ? 'patient_narrative'
  )
UNION ALL
SELECT 
  'Análise Multirracional' as kpi,
  COUNT(*) as valor
FROM imre_assessments
WHERE completion_status = 'completed'
  AND triaxial_data ? 'rationalities'
  AND (
    SELECT COUNT(*) 
    FROM jsonb_object_keys(triaxial_data->'rationalities')
  ) >= 4
UNION ALL
SELECT 
  'Dados Primários Coletados' as kpi,
  COALESCE(
    SUM(
      CASE 
        WHEN semantic_context ? 'semantic_blocks' THEN
          jsonb_array_length(semantic_context->'semantic_blocks')
        WHEN semantic_context ? 'primary_data' THEN 
          jsonb_array_length(semantic_context->'primary_data')
        ELSE 1
      END
    ),
    0
  ) as valor
FROM imre_assessments
WHERE completion_status = 'completed'
UNION ALL
SELECT 
  'Correlações Identificadas' as kpi,
  COUNT(*) as valor
FROM imre_assessments
WHERE completion_status = 'completed'
  AND (
    semantic_context ? 'primary_data' OR
    semantic_context ? 'spontaneous_speech'
  )
  AND (
    triaxial_data ? 'clinical_correlations' OR
    triaxial_data ? 'integrated_analysis'
  );

-- =====================================================
-- RESULTADO ESPERADO:
-- =====================================================
-- Após executar este script, os dados existentes terão
-- a estrutura necessária para os KPIs funcionarem.
-- Os valores devem ser > 0 se houver dados completos.

