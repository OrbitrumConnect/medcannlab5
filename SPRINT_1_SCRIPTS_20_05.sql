-- ╔═══════════════════════════════════════════════════════════════════╗
-- ║ SPRINT 1 — 4 scripts cirúrgicos                                    ║
-- ║ Pedro 20/05/2026 ~12h00 BRT                                        ║
-- ║                                                                     ║
-- ║ Execute no SQL Editor Supabase (sql.supabase.com)                  ║
-- ║ OU via Management API com PAT                                       ║
-- ╚═══════════════════════════════════════════════════════════════════╝


-- ═══════════════════════════════════════════════════════════════════
-- ITEM 1 — chat_messages_legacy ADD COMMENT (10min, P1)
-- ═══════════════════════════════════════════════════════════════════
-- Memory: CLAUDE.md gotchas — "Tabela chat_messages_legacy (15 rows) tem nome enganoso —
-- é a CANÔNICA hoje. chat_messages (vazia) é shell planejada."
-- Objetivo: evitar novo dev/Claude dropar legacy achando que pode

COMMENT ON TABLE public.chat_messages_legacy IS
  'CANÔNICA — apesar do nome "legacy", é a tabela em uso para mensagens de chat. '
  'chat_messages (sem sufixo) é shell planejada vazia. NÃO DROPAR esta tabela. '
  'Cristalizado em CLAUDE.md gotchas + audit Sprint 1 20/05/2026.';

COMMENT ON TABLE public.chat_messages IS
  'SHELL planejada VAZIA — chat_messages_legacy é a canônica em uso. '
  'Esta tabela existe pra futura migração mas tem 0 rows. NÃO use esta tabela. '
  'Use chat_messages_legacy. Cristalizado audit Sprint 1 20/05/2026.';

-- Verificação pós-execução:
-- SELECT obj_description('public.chat_messages_legacy'::regclass);
-- SELECT obj_description('public.chat_messages'::regclass);


-- ═══════════════════════════════════════════════════════════════════
-- ITEM 2 — DISCOVERY: 2 views SECURITY DEFINER remanescentes (P0 segurança)
-- ═══════════════════════════════════════════════════════════════════
-- Memory: feedback_debitos_tecnicos_parecer_fiscal_01_04_pendentes_18_05
-- Objetivo: identificar quais views ainda usam SECURITY DEFINER pra recriar com INVOKER
-- NOTA: PARECER FISCAL 01/04 disse "SECURITY DEFAULT" mas terminologia Postgres é DEFINER

-- 2.1 — Lista TODAS as views e suas options
SELECT
  c.relname AS view_name,
  CASE WHEN 'security_definer=true' = ANY(c.reloptions) THEN 'DEFINER ⚠️'
       WHEN 'security_invoker=true' = ANY(c.reloptions) THEN 'INVOKER ✓'
       ELSE 'DEFAULT (DEFINER pré-PG15)'
  END AS security_mode,
  c.reloptions,
  pg_get_viewdef(c.oid, true) AS definition_preview
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE c.relkind = 'v'
  AND n.nspname = 'public'
ORDER BY view_name;

-- 2.2 — Após identificar 2 views remanescentes, recriar com SECURITY INVOKER:
-- ALTER VIEW public.<view_name> SET (security_invoker = true);
--
-- Exemplo (substituir <view_name>):
-- ALTER VIEW public.v_clinical_cycle_health SET (security_invoker = true);


-- ═══════════════════════════════════════════════════════════════════
-- ITEM 3 — 72 files órfãos bucket documents (LGPD compliance, P1)
-- ═══════════════════════════════════════════════════════════════════
-- Memory: CLAUDE.md gotchas + audit_v1_9_307_299_311_312_estado_real_pos_deploy_16_05

-- 3.1 — DISCOVERY: lista files no bucket documents cujos owners não existem mais
SELECT
  o.id,
  o.name,
  o.bucket_id,
  o.owner,
  o.metadata->>'size' AS size_bytes,
  o.created_at,
  CASE WHEN u.id IS NULL THEN 'ÓRFÃO ⚠️' ELSE 'OK' END AS status
FROM storage.objects o
LEFT JOIN auth.users u ON u.id = o.owner
WHERE o.bucket_id = 'documents'
ORDER BY status DESC, o.created_at DESC;

-- 3.2 — CONTAGEM rápida pra confirmar memory dizia 72:
SELECT
  COUNT(*) FILTER (WHERE u.id IS NULL) AS orfaos,
  COUNT(*) FILTER (WHERE u.id IS NOT NULL) AS validos,
  SUM((o.metadata->>'size')::bigint) FILTER (WHERE u.id IS NULL) AS bytes_orfaos
FROM storage.objects o
LEFT JOIN auth.users u ON u.id = o.owner
WHERE o.bucket_id = 'documents';

-- 3.3 — DELETE órfãos (DESCOMENTAR APÓS revisar 3.1 e confirmar contagem 3.2)
-- ATENÇÃO: ação destrutiva. Backup do nome+conteúdo antes de executar.
--
-- DELETE FROM storage.objects o
-- USING (
--   SELECT o2.id FROM storage.objects o2
--   LEFT JOIN auth.users u ON u.id = o2.owner
--   WHERE o2.bucket_id = 'documents'
--     AND u.id IS NULL
-- ) candidates
-- WHERE o.id = candidates.id;


-- ═══════════════════════════════════════════════════════════════════
-- ITEM 4 — AUDIT empírico V1.9.307 Sidecar Renal (P3 drift técnico)
-- ═══════════════════════════════════════════════════════════════════
-- Memory: audit_v1_9_307_299_311_312_estado_real_pos_deploy_16_05
-- Tese parqueada: "0 aprovações em 8h pós-deploy" — confirmar com 30+ dias de dado

-- 4.1 — Adoção total desde deploy 16/05
SELECT
  COUNT(*) AS total_sugestoes_renais,
  COUNT(DISTINCT patient_id) AS pacientes_afetados,
  COUNT(*) FILTER (WHERE physician_approved IS TRUE) AS aprovadas,
  COUNT(*) FILTER (WHERE physician_approved IS FALSE) AS rejeitadas,
  COUNT(*) FILTER (WHERE physician_approved IS NULL) AS pendentes_revisao,
  ROUND(100.0 * COUNT(*) FILTER (WHERE physician_approved IS TRUE) / NULLIF(COUNT(*), 0), 1) AS taxa_aprovacao_pct
FROM public.renal_inline_suggestions
WHERE created_at >= '2026-05-16';

-- 4.2 — Distribuição temporal (por dia)
SELECT
  DATE(created_at) AS dia,
  COUNT(*) AS sugestoes,
  COUNT(*) FILTER (WHERE physician_approved IS TRUE) AS aprovadas,
  COUNT(*) FILTER (WHERE physician_approved IS NULL) AS pendentes
FROM public.renal_inline_suggestions
WHERE created_at >= '2026-05-16'
GROUP BY 1
ORDER BY 1 DESC;

-- 4.3 — Quem é o médico que aprovou (se houve)
SELECT
  physician_id,
  COUNT(*) AS total_aprovacoes,
  MIN(created_at) AS primeira_aprovacao,
  MAX(created_at) AS ultima_aprovacao
FROM public.renal_inline_suggestions
WHERE physician_approved = TRUE
GROUP BY physician_id;


-- ═══════════════════════════════════════════════════════════════════
-- ITEM 5 — AUDIT empírico V1.9.311 NFT Gallery (P3 drift técnico)
-- ═══════════════════════════════════════════════════════════════════
-- Memory: audit_v1_9_307_299_311_312_estado_real_pos_deploy_16_05 + project_v1_9_311_nft_consent_pattern_16_05
-- Tese parqueada: "1/12 PBAD adoção" — confirmar com dado fresh

-- 5.1 — Pacientes que aceitaram visualização clínica (allow_clinical_view = true)
SELECT
  COUNT(*) AS total_nfts,
  COUNT(DISTINCT patient_id) AS pacientes_com_nft,
  COUNT(*) FILTER (WHERE allow_clinical_view = TRUE) AS liberados_pra_medico,
  COUNT(*) FILTER (WHERE allow_clinical_view = FALSE OR allow_clinical_view IS NULL) AS bloqueados
FROM public.clinical_consent_nfts
WHERE created_at >= '2026-05-16';

-- 5.2 — Distribuição por status temporal
SELECT
  DATE(created_at) AS dia,
  COUNT(*) AS nfts_emitidos,
  COUNT(*) FILTER (WHERE allow_clinical_view = TRUE) AS liberados
FROM public.clinical_consent_nfts
WHERE created_at >= '2026-05-16'
GROUP BY 1
ORDER BY 1 DESC;

-- 5.3 — Médicos com acesso à galeria de pacientes
-- (se tabela diferente, adjust)
SELECT
  COUNT(DISTINCT n.patient_id) AS pacientes_visíveis_galeria,
  COUNT(DISTINCT r.doctor_id) AS medicos_envolvidos
FROM public.clinical_consent_nfts n
JOIN public.clinical_reports r ON r.id = n.report_id
WHERE n.allow_clinical_view = TRUE
  AND n.created_at >= '2026-05-16';


-- ═══════════════════════════════════════════════════════════════════
-- BÔNUS — AUDIT consolidado pós-execução (verificar progresso Sprint 1)
-- ═══════════════════════════════════════════════════════════════════

-- B.1 — Verificar que comments foram aplicados (ITEM 1)
SELECT
  c.relname AS table_name,
  obj_description(c.oid) AS comment
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public'
  AND c.relname IN ('chat_messages_legacy', 'chat_messages');

-- B.2 — Confirmar zero views ainda em SECURITY DEFINER (ITEM 2)
SELECT COUNT(*) AS views_com_definer_ainda
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE c.relkind = 'v'
  AND n.nspname = 'public'
  AND 'security_definer=true' = ANY(c.reloptions);

-- B.3 — Confirmar zero órfãos bucket documents (ITEM 3, pós-DELETE)
SELECT COUNT(*) AS orfaos_remanescentes
FROM storage.objects o
LEFT JOIN auth.users u ON u.id = o.owner
WHERE o.bucket_id = 'documents'
  AND u.id IS NULL;
