-- =============================================================================
-- BACKFILL EM LARGA ESCALA — limpar [CONTEXTO CRÍTICO … FIM DO CONTEXTO] em
-- patient_medical_records (record_type = 'chat_interaction')
--
-- QUANDO USAR
--   • Novos utilizadores / novas conversas: o app já grava limpo (strip no código).
--   • Este script serve para CORRIGIR HISTÓRICO já gravado antes da correção,
--     em todos os pacientes ou só num paciente (ex.: Pedro).
--
-- ESCOPO (escolha no WHERE do UPDATE, secção marcada):
--   A) Todos os utilizadores: qualquer linha de chat ainda “suja”.
--   B) Um paciente: acrescente AND patient_id = '<uuid>' (ex. Pedro abaixo).
--
-- Rode sempre as queries de PREVIEW antes do BEGIN. Alinhado a
-- stripPlatformInjectionNoise (clinicalAssessmentFlow.ts): aplica a
-- user_message e ai_response em record_data.
-- =============================================================================

-- --- PREVIEW (só leitura) -----------------------------------------------------

-- Contagem global de linhas a tratar (resposta e/ou mensagem)
SELECT
  COUNT(*)::bigint AS linhas_a_corrigir
FROM public.patient_medical_records
WHERE record_type = 'chat_interaction'
  AND (
    (record_data->>'ai_response') IS NOT NULL
      AND (record_data->>'ai_response') ILIKE '%CONTEXTO CRÍTICO%'
    OR (record_data->>'user_message') IS NOT NULL
      AND (record_data->>'user_message') ILIKE '%CONTEXTO CRÍTICO%'
  );

-- Amostra de ids (últimas 50)
SELECT
  id,
  patient_id,
  created_at,
  left(record_data->>'ai_response', 80) AS ai_snip
FROM public.patient_medical_records
WHERE record_type = 'chat_interaction'
  AND (
    (record_data->>'ai_response') ILIKE '%CONTEXTO CRÍTICO%'
    OR (record_data->>'user_message') ILIKE '%CONTEXTO CRÍTICO%'
  )
ORDER BY created_at DESC
LIMIT 50;

-- Opcional: só Pedro (ajuste o UUID se necessário)
-- SELECT COUNT(*) FROM public.patient_medical_records
-- WHERE record_type = 'chat_interaction'
--   AND patient_id = 'd5e01ead-2f7e-4958-95e9-50dd66a7c5f9'::uuid
--   AND ( ... mesmo filtro CONTEXTO ... );

-- --- ESCRITA (execute o bloco inteiro de uma vez) ---------------------------

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
WHERE pmr.record_type = 'chat_interaction'
  AND (
    (pmr.record_data->>'ai_response') IS NOT NULL
      AND (pmr.record_data->>'ai_response') ILIKE '%CONTEXTO CRÍTICO%'
    OR (pmr.record_data->>'user_message') IS NOT NULL
      AND (pmr.record_data->>'user_message') ILIKE '%CONTEXTO CRÍTICO%'
  )
  -- Escopo: descomente UMA opção:
  -- (A) todos os pacientes — nada a acrescentar
  -- (B) só um paciente, ex. Pedro:
  -- AND pmr.patient_id = 'd5e01ead-2f7e-4958-95e9-50dd66a7c5f9'::uuid
;

-- Verificação: contagens devem ser 0
SELECT
  COUNT(*)::bigint AS ainda_sujas
FROM public.patient_medical_records
WHERE record_type = 'chat_interaction'
  AND (
    (record_data->>'ai_response') ILIKE '%CONTEXTO CRÍTICO%'
    OR (record_data->>'user_message') ILIKE '%CONTEXTO CRÍTICO%'
  );

DROP FUNCTION IF EXISTS medcannlab_strip_rag_blocks_sql(text);

COMMIT;

-- Se algo correr mal: ROLLBACK; antes do COMMIT.
