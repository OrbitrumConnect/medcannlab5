-- =====================================================
-- VERIFICAR ESTRUTURA DOS DADOS PARA KPIs CLÍNICOS
-- =====================================================
-- Execute este script para verificar se os dados existentes
-- têm a estrutura necessária para os KPIs funcionarem

-- 1. VERIFICAR ESTRUTURA DOS DADOS EM imre_assessments
SELECT 
  id,
  completion_status,
  triaxial_data,
  semantic_context,
  -- Verificar se tem dados primários preservados
  CASE 
    WHEN semantic_context ? 'primary_data' THEN '✅ Tem primary_data'
    WHEN semantic_context ? 'spontaneous_speech' THEN '✅ Tem spontaneous_speech'
    WHEN semantic_context ? 'patient_narrative' THEN '✅ Tem patient_narrative'
    ELSE '❌ Sem dados primários'
  END as dados_primarios,
  -- Verificar se tem análise multirracional
  CASE 
    WHEN triaxial_data ? 'rationalities' THEN 
      '✅ Tem ' || jsonb_object_keys(triaxial_data->'rationalities')::text || ' racionalidades'
    ELSE '❌ Sem racionalidades'
  END as racionalidades,
  -- Verificar se tem correlações
  CASE 
    WHEN triaxial_data ? 'clinical_correlations' THEN '✅ Tem correlações clínicas'
    WHEN triaxial_data ? 'integrated_analysis' THEN '✅ Tem análise integrada'
    ELSE '❌ Sem correlações'
  END as correlacoes,
  created_at
FROM imre_assessments
ORDER BY created_at DESC
LIMIT 10;

-- 2. VERIFICAR ESTRUTURA DOS DADOS EM clinical_assessments
SELECT 
  id,
  status,
  assessment_type,
  data,
  -- Verificar se tem dados primários preservados
  CASE 
    WHEN data ? 'patient_narrative' THEN '✅ Tem patient_narrative'
    WHEN data ? 'spontaneous_speech' THEN '✅ Tem spontaneous_speech'
    WHEN data ? 'primary_data' THEN '✅ Tem primary_data'
    WHEN data ? 'investigation' THEN '✅ Tem investigation'
    ELSE '❌ Sem dados primários'
  END as dados_primarios,
  created_at
FROM clinical_assessments
ORDER BY created_at DESC
LIMIT 10;

-- 3. TESTAR CÁLCULO DOS KPIs COM DADOS REAIS
SELECT 
  'Narrativas Preservadas (imre_assessments)' as kpi,
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
  'Análise Multirracional (imre_assessments)' as kpi,
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
  'Dados Primários Coletados (imre_assessments)' as kpi,
  COALESCE(
    SUM(
      CASE 
        WHEN semantic_context ? 'semantic_blocks' THEN
          jsonb_array_length(semantic_context->'semantic_blocks')
        WHEN semantic_context ? 'primary_data' THEN 1
        ELSE 0
      END
    ),
    0
  ) as valor
FROM imre_assessments
WHERE completion_status = 'completed'
UNION ALL
SELECT 
  'Correlações Identificadas (imre_assessments)' as kpi,
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
  )
UNION ALL
SELECT 
  'Narrativas Preservadas (clinical_assessments)' as kpi,
  COUNT(*) as valor
FROM clinical_assessments
WHERE status = 'completed'
  AND assessment_type = 'IMRE'
  AND (
    data ? 'patient_narrative' OR
    data ? 'spontaneous_speech' OR
    data ? 'primary_data'
  );

-- 4. VERIFICAR EXEMPLO DE DADOS COMPLETOS (se houver)
SELECT 
  'Exemplo de triaxial_data completo' as tipo,
  triaxial_data
FROM imre_assessments
WHERE triaxial_data ? 'rationalities'
LIMIT 1;

SELECT 
  'Exemplo de semantic_context completo' as tipo,
  semantic_context
FROM imre_assessments
WHERE semantic_context ? 'primary_data' OR semantic_context ? 'spontaneous_speech'
LIMIT 1;

-- =====================================================
-- INTERPRETAÇÃO DOS RESULTADOS:
-- =====================================================
-- Se os KPIs retornarem 0:
-- 1. Os dados podem não ter a estrutura esperada
-- 2. Os campos podem estar vazios ou null
-- 3. Os dados podem precisar ser atualizados para incluir os campos necessários
--
-- Para corrigir:
-- - Garantir que as avaliações IMRE salvem semantic_context e triaxial_data
-- - Verificar se o código de geração de relatórios está preenchendo esses campos
-- - Atualizar dados existentes se necessário

