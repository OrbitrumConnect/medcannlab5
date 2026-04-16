-- =============================================================================
-- AUDITORIA (SÓ LEITURA) — RAG / blocos [CONTEXTO CRÍTICO …] em prontuário chat
-- Tabela: public.patient_medical_records
-- Uso: Supabase SQL Editor (role com SELECT na tabela). Não altera dados.
-- =============================================================================

-- 1) Resumo: quantas linhas de chat e quantas com “vazamento” de marcador RAG na resposta IA
WITH base AS (
  SELECT
    id,
    patient_id,
    created_at,
    record_data,
    (record_data->>'ai_response') AS ai_resp,
    (record_data->>'user_message') AS usr_msg
  FROM public.patient_medical_records
  WHERE record_type = 'chat_interaction'
)
SELECT
  COUNT(*)::bigint AS total_chat_rows,
  COUNT(*) FILTER (
    WHERE ai_resp IS NOT NULL
      AND ai_resp ILIKE '%CONTEXTO CRÍTICO%'
  )::bigint AS ai_response_com_contexto_critico,
  COUNT(*) FILTER (
    WHERE usr_msg IS NOT NULL
      AND usr_msg ILIKE '%CONTEXTO CRÍTICO%'
  )::bigint AS user_message_com_contexto_critico,
  ROUND(
    100.0 * COUNT(*) FILTER (WHERE ai_resp IS NOT NULL AND ai_resp ILIKE '%CONTEXTO CRÍTICO%')
    / NULLIF(COUNT(*), 0),
    2
  ) AS pct_ai_com_contexto
FROM base;

-- 2) Amostra de IDs para inspeção manual (últimas 30 linhas “sujas” na resposta IA)
SELECT
  id,
  patient_id,
  created_at,
  left(record_data->>'ai_response', 120) AS ai_snippet
FROM public.patient_medical_records
WHERE record_type = 'chat_interaction'
  AND (record_data->>'ai_response') ILIKE '%CONTEXTO CRÍTICO%'
ORDER BY created_at DESC
LIMIT 30;

-- 3) Opcional: mesma ideia em ai_chat_interactions (se existir linhas)
SELECT
  COUNT(*)::bigint AS total_rows,
  COUNT(*) FILTER (
    WHERE ai_response IS NOT NULL AND ai_response ILIKE '%CONTEXTO CRÍTICO%'
  )::bigint AS ai_com_contexto
FROM public.ai_chat_interactions;
