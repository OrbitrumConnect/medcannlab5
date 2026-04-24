-- V1.9.25 — Backfill: desaninhar estrutura de clinical_reports.content
--
-- Contexto: commit 7a7e33a (23/04) mudou o backend para salvar o payload de
-- finalize_assessment em content.raw.content.* em vez de content.* direto.
-- V1.9.20 restaurou o padrão pré-refactor (content.lista_indiciaria,
-- content.identificacao, content.consenso no topo) para reports NOVOS.
-- Este migration faz o backfill dos 33 reports de 22-23/04 que nasceram
-- aninhados, promovendo os campos clínicos para o topo de content.
--
-- Pré-execução (2026-04-24):
--   64 reports total
--   16 com lista_indiciaria direto (formato moderno / pré-refactor)
--   33 com lista_indiciaria em content.raw.content.* (pós-refactor 22-23/04)
--   15 com estrutura legacy (só scores ou IMRE antigo — não elegíveis)
--
-- Pós-execução validado em 2026-04-24:
--   49/64 com lista_indiciaria direto (+33 backfilled)
--   45/64 preservaram content.raw, content.structured, content.metadata
--   15 legacy permanecem como estavam (sem dado estruturado a promover)
--
-- Backup completo da coluna antes do UPDATE:
--   clinical_reports_content_backup_24_04 (64 rows com content_before)
--
-- Rollback completo se necessário:
--   UPDATE clinical_reports cr
--     SET content = b.content_before
--   FROM clinical_reports_content_backup_24_04 b
--   WHERE cr.id = b.id;

-- 1. Backup completo da coluna content (todas 64 rows, não só as backfilled)
CREATE TABLE IF NOT EXISTS clinical_reports_content_backup_24_04 AS
SELECT id, content AS content_before, now() AS backed_up_at
FROM clinical_reports;

-- 2. Backfill: desaninhar content.raw.content.* para content.*
--    ORDEM DO MERGE é intencional:
--    - (content->'raw'->'content') fornece os campos BASE (clínicos estruturados)
--    - || content sobrescreve (preserva structured/raw/metadata do topo)
--    Resultado: lista_indiciaria, identificacao, consenso, queixa_principal
--    sobem para o topo sem apagar os campos que já estavam lá.
UPDATE clinical_reports
SET content = (content->'raw'->'content') || content
WHERE content->'raw'->'content' IS NOT NULL
  AND jsonb_typeof(content->'raw'->'content') = 'object'
  AND NOT (content ? 'lista_indiciaria');
