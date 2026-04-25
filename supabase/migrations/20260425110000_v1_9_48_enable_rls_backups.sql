-- V1.9.48 — ENABLE RLS em 3 tabelas backup que estavam acessíveis por anon
--
-- Contexto:
--   Auditoria de RLS em 25/04/2026 detectou 3 backups com `relrowsecurity=false`
--   e zero policies — qualquer chamada com anon_key conseguia ler:
--     - clinical_reports_content_backup_24_04 (64 rows — backup pré V1.9.25)
--     - documents_backup_23_04_2026 (458 rows — biblioteca antiga)
--     - generated_slides_archive (412 rows — slides arquivados V1.9.12)
--
--   Padrão da V1.9.39 (clinical_reports_consent_backup_v1_9_39): backup com
--   ENABLE RLS e zero policies = apenas service_role acessa via PostgREST.
--   Dado preservado para rollback, sem exposição.
--
-- Ação:
--   ENABLE ROW LEVEL SECURITY nas 3 tabelas. Sem criar policies.
--   Resultado: PostgREST nega leitura via anon/authenticated.
--   Nada a perder porque são dados históricos para rollback eventual.
--
-- Observação: este fix foi aplicado primeiro via Management API em 25/04/2026
-- (idempotente — ALTER TABLE é seguro re-executar). Migration arquivada para
-- rastreabilidade.

ALTER TABLE clinical_reports_content_backup_24_04 ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents_backup_23_04_2026 ENABLE ROW LEVEL SECURITY;
ALTER TABLE generated_slides_archive ENABLE ROW LEVEL SECURITY;

-- Validação
DO $$
DECLARE
  desprotegidas INTEGER;
BEGIN
  SELECT COUNT(*) INTO desprotegidas
  FROM pg_class c
  JOIN pg_namespace n ON n.oid = c.relnamespace
  WHERE n.nspname = 'public'
    AND c.relname IN ('clinical_reports_content_backup_24_04','documents_backup_23_04_2026','generated_slides_archive')
    AND c.relrowsecurity = false;

  IF desprotegidas > 0 THEN
    RAISE EXCEPTION '[V1.9.48] % backup(s) ainda sem RLS habilitada', desprotegidas;
  END IF;
  RAISE NOTICE '[V1.9.48] 3 backups com RLS habilitada — somente service_role pode ler';
END $$;
