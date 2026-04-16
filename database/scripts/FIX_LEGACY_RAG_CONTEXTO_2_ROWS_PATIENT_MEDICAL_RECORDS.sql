-- =============================================================================
-- BACKFILL CIRÚRGICO (2 linhas por ID) — não é “só Pedro”: filtra por id exato da
-- auditoria. Paciente de referência: Pedro (d5e01ead-2f7e-4958-95e9-50dd66a7c5f9).
--
-- Quando usar
--   • Correção mínima e auditável (duas linhas conhecidas).
--
-- Para limpar TODO o histórico de chat sujo (todos os utilizadores ou só um
-- paciente por patient_id), use em vez disso:
--   FIX_LEGACY_RAG_CONTEXTO_ALL_CHAT_INTERACTIONS.sql
--
-- Nota: novas conversas já gravam sem ruído (strip no app). Isto é legado em BD.
--
-- IDs (auditoria 2026-04): ~00:34–00:36 UTC
--   f68ea544-3d3b-4c06-8f5f-552a2dc1e71b
--   1bd5f3ae-b485-459e-9f7a-73433240a87e
--
-- Alinhado a stripPlatformInjectionNoise (clinicalAssessmentFlow.ts).
-- Rode PREVIEW primeiro; execute o bloco BEGIN…COMMIT de uma vez.
-- =============================================================================

-- (Opcional) só leitura antes de alterar:
-- SELECT id, (record_data->>'ai_response') ILIKE '%CONTEXTO CRÍTICO%' AS sujo
-- FROM public.patient_medical_records
-- WHERE id IN (
--   'f68ea544-3d3b-4c06-8f5f-552a2dc1e71b'::uuid,
--   '1bd5f3ae-b485-459e-9f7a-73433240a87e'::uuid
-- );

BEGIN;

CREATE OR REPLACE FUNCTION medcannlab_strip_rag_blocks_sql(t text)
RETURNS text
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
  s text;
  prev text;
BEGIN
  s := COALESCE(t, '');
  LOOP
    prev := s;
    s := regexp_replace(s, '\[CONTEXTO CRÍTICO DE DOCUMENTOS[\s\S]*?\[FIM DO CONTEXTO\]', '', 'gi');
    s := regexp_replace(s, '\[CONTEXTO CRITICO DE DOCUMENTOS[\s\S]*?\[FIM DO CONTEXTO\]', '', 'gi');
    EXIT WHEN s = prev;
  END LOOP;
  s := regexp_replace(s, '\[CONTEXTO CR[ÍI]TICO DE DOCUMENTOS[\s\S]*$', '', 'i');
  s := regexp_replace(s, E'\n{3,}', E'\n\n', 'g');
  RETURN trim(both from s);
END;
$$;

UPDATE public.patient_medical_records AS pmr
SET
  record_data = jsonb_set(
    jsonb_set(
      pmr.record_data,
      '{user_message}',
      to_jsonb(medcannlab_strip_rag_blocks_sql(COALESCE(pmr.record_data->>'user_message', '')))
    ),
    '{ai_response}',
    to_jsonb(medcannlab_strip_rag_blocks_sql(COALESCE(pmr.record_data->>'ai_response', '')))
  ),
  updated_at = now()
WHERE pmr.id IN (
  'f68ea544-3d3b-4c06-8f5f-552a2dc1e71b'::uuid,
  '1bd5f3ae-b485-459e-9f7a-73433240a87e'::uuid
)
  AND pmr.record_type = 'chat_interaction';

-- Verificação: ambos false em ai_response e user_message
SELECT
  id,
  (record_data->>'ai_response') ILIKE '%CONTEXTO CRÍTICO%' AS ai_ainda_sujo,
  (record_data->>'user_message') ILIKE '%CONTEXTO CRÍTICO%' AS usr_ainda_sujo
FROM public.patient_medical_records
WHERE id IN (
  'f68ea544-3d3b-4c06-8f5f-552a2dc1e71b'::uuid,
  '1bd5f3ae-b485-459e-9f7a-73433240a87e'::uuid
);

DROP FUNCTION IF EXISTS medcannlab_strip_rag_blocks_sql(text);

COMMIT;

-- Se algo correr mal: ROLLBACK; antes do COMMIT.
