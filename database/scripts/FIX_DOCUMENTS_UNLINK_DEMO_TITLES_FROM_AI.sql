-- =============================================================================
-- OPCIONAL — tirar do RAG da IA documentos com títulos típicos de teste/demo
-- (mesma heurística da secção 8 de AUDIT_SUPABASE_NOA_ECOSYSTEM_READ_ONLY.sql)
--
-- O que faz: UPDATE apenas "isLinkedToAI" = false + updated_at. NÃO apaga linhas.
-- O que não mexe: resto dos ~450 docs; PDFs/protocolos que não batem nos ILIKE.
--
-- Fluxo: 1) corre PREVIEW abaixo; 2) se a lista for a desejada, corre o bloco BEGIN…COMMIT.
-- =============================================================================

-- --- PREVIEW (só leitura) — deve coincidir com a secção 8 do script de auditoria

SELECT id, title, category, "aiRelevance", created_at
FROM public.documents
WHERE COALESCE("isLinkedToAI", false)
  AND COALESCE("aiRelevance", 0) = 0
  AND (
    title ILIKE '%biblioteca compartilhada%'
    OR title ILIKE '%verifique a biblioteca%'
    OR title ILIKE '%nivelamento%'
    OR title ILIKE '%supabase influencia%'
    OR title ILIKE '%como o supabase%'
  )
ORDER BY created_at DESC;

-- --- ESCRITA (só depois de rever o PREVIEW)

BEGIN;

UPDATE public.documents
SET
  "isLinkedToAI" = false,
  updated_at = now()
WHERE COALESCE("isLinkedToAI", false)
  AND COALESCE("aiRelevance", 0) = 0
  AND (
    title ILIKE '%biblioteca compartilhada%'
    OR title ILIKE '%verifique a biblioteca%'
    OR title ILIKE '%nivelamento%'
    OR title ILIKE '%supabase influencia%'
    OR title ILIKE '%como o supabase%'
  );

-- Verificação: deve ser 0
SELECT COUNT(*)::bigint AS ainda_ligados_demo_heuristica
FROM public.documents
WHERE COALESCE("isLinkedToAI", false)
  AND COALESCE("aiRelevance", 0) = 0
  AND (
    title ILIKE '%biblioteca compartilhada%'
    OR title ILIKE '%verifique a biblioteca%'
    OR title ILIKE '%nivelamento%'
    OR title ILIKE '%supabase influencia%'
    OR title ILIKE '%como o supabase%'
  );

COMMIT;

-- Antes do COMMIT, se a contagem não for o esperado: ROLLBACK;
