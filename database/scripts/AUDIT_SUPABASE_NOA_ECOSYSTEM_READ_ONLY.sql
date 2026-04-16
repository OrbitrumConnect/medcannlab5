-- =============================================================================
-- AUDITORIA (SÓ LEITURA) — ecossistema Nôa / IA e tabelas “irmãs”
-- Supabase SQL Editor. Não altera dados.
--
-- Alinhado ao schema onde:
--   • noa_interaction_logs usa coluna "timestamp" (nome = palavra reservada → aspas)
--   • documents usa "isLinkedToAI" e "aiRelevance" (camelCase)
--   • Legado IMRE/nefro: pacientes.id (varchar) vs users.id (uuid) — não misturar JOINs
-- =============================================================================

-- 1) Inventário rápido — contagens
SELECT 'noa_memories' AS tabela, COUNT(*)::bigint AS n FROM public.noa_memories
UNION ALL SELECT 'noa_articles', COUNT(*) FROM public.noa_articles
UNION ALL SELECT 'noa_clinical_cases', COUNT(*) FROM public.noa_clinical_cases
UNION ALL SELECT 'noa_lessons', COUNT(*) FROM public.noa_lessons
UNION ALL SELECT 'noa_interaction_logs', COUNT(*) FROM public.noa_interaction_logs
UNION ALL SELECT 'noa_logs', COUNT(*) FROM public.noa_logs
UNION ALL SELECT 'noa_pending_actions', COUNT(*) FROM public.noa_pending_actions
UNION ALL SELECT 'patient_medical_records (chat)', COUNT(*) FROM public.patient_medical_records WHERE record_type = 'chat_interaction'
UNION ALL SELECT 'ai_chat_interactions', COUNT(*) FROM public.ai_chat_interactions
UNION ALL SELECT 'ai_chat_history', COUNT(*) FROM public.ai_chat_history
UNION ALL SELECT 'aec_assessment_state', COUNT(*) FROM public.aec_assessment_state
UNION ALL SELECT 'base_conhecimento', COUNT(*) FROM public.base_conhecimento
UNION ALL SELECT 'interacoes_ia (legado pacientes)', COUNT(*) FROM public.interacoes_ia
UNION ALL SELECT 'pacientes (legado varchar id)', COUNT(*) FROM public.pacientes
UNION ALL SELECT 'users (auth perfil)', COUNT(*) FROM public.users;

-- 2) noa_memories — distribuição por tipo e linhas sem user_id (RLS / dono)
SELECT type, COUNT(*)::bigint AS n
FROM public.noa_memories
GROUP BY type
ORDER BY n DESC;

SELECT COUNT(*)::bigint AS memories_sem_user_id
FROM public.noa_memories
WHERE user_id IS NULL;

-- 3) noa_pending_actions — status (pending | consumed | cancelled | expired)
SELECT status, COUNT(*)::bigint AS n
FROM public.noa_pending_actions
GROUP BY status
ORDER BY n DESC;

-- 4) noa_interaction_logs — colunas oficiais do schema (sem created_at)
SELECT
  id,
  user_id,
  session_id,
  interaction_type,
  success,
  error_message,
  "timestamp"
FROM public.noa_interaction_logs
ORDER BY "timestamp" DESC NULLS LAST
LIMIT 20;

-- 5) documents — biblioteca / RAG (camelCase no Postgres)
SELECT
  COUNT(*)::bigint AS total_documents,
  COUNT(*) FILTER (WHERE COALESCE("isLinkedToAI", false))::bigint AS linked_ai,
  ROUND(AVG(COALESCE("aiRelevance", 0))::numeric, 3) AS avg_ai_relevance
FROM public.documents;

-- 6) documents — fora do RAG da IA (isLinkedToAI = false ou null)
SELECT
  id,
  title,
  category,
  COALESCE("isLinkedToAI", false) AS is_linked,
  COALESCE("aiRelevance", 0) AS ai_relevance,
  COALESCE(is_curated, false) AS is_curated,
  created_at
FROM public.documents
WHERE NOT COALESCE("isLinkedToAI", false)
ORDER BY created_at DESC NULLS LAST;

-- 7) documents — cauda de baixa relevância (ligados à IA, ajuste o limiar se quiseres)
SELECT COUNT(*)::bigint AS n_linked_com_relevance_baixa
FROM public.documents
WHERE COALESCE("isLinkedToAI", false)
  AND COALESCE("aiRelevance", 0) < 0.5;

SELECT
  id,
  title,
  category,
  "aiRelevance" AS ai_relevance,
  COALESCE(is_curated, false) AS is_curated,
  created_at
FROM public.documents
WHERE COALESCE("isLinkedToAI", false)
ORDER BY COALESCE("aiRelevance", 0) ASC NULLS FIRST, created_at DESC NULLS LAST
LIMIT 30;

-- 8) documents — heurística de PROVÁVEL teste/ruído (relevância 0 + títulos típicos de demo)
--    Ajusta os ILIKE ao teu vocabulário. Só leitura.
--    Para desligar estes do RAG (sem apagar): FIX_DOCUMENTS_UNLINK_DEMO_TITLES_FROM_AI.sql
SELECT COUNT(*)::bigint AS n_provavel_teste
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

SELECT id, title, category, created_at
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
