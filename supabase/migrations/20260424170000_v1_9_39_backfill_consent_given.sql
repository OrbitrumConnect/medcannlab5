-- V1.9.39 — Backfill de consent_given em reports com consent no jsonb
--
-- Contexto:
--   V1.9.1 (22-23/04/2026) adicionou `consent_given` e `consent_at` como
--   colunas dedicadas em `clinical_reports`, espelhando o que já vinha em
--   `content.consenso.aceito` no jsonb. A coluna nasceu com DEFAULT false.
--
--   Auditoria de 24/04/2026 (pós V1.9.38, LGPD gate reordenado) revelou
--   que 27 reports criados antes da V1.9.1 têm `content.consenso.aceito='true'`
--   no jsonb (consent efetivamente dado pelo paciente) mas ficaram com
--   `consent_given=false` por não terem passado pelo pipeline que popula
--   a coluna. Outros 30 reports são pré-consent-gate legítimos (fase do
--   produto onde consent não era obrigatório) — NÃO são alvo deste backfill.
--
-- Objetivo:
--   Fazer a coluna-espelho refletir o que o jsonb já declara. Nenhum dado
--   novo é criado — apenas sincroniza duas representações do mesmo fato.
--
-- Segurança:
--   - WHERE rigoroso: só afeta linhas onde o jsonb tem 'true' E a coluna está false.
--   - Preserva `consent_at` existente (COALESCE); se era NULL, usa `created_at`
--     como melhor-esforço (timestamp do próprio report).
--   - Idempotente: rodar 2x não altera nada (WHERE já pega só o grupo alvo).
--   - Reversível via snapshot feito na mesma transação.

BEGIN;

-- Snapshot defensivo (drop se já existir para permitir re-execução)
DROP TABLE IF EXISTS clinical_reports_consent_backup_v1_9_39;

CREATE TABLE clinical_reports_consent_backup_v1_9_39 AS
SELECT id, consent_given, consent_at, created_at
FROM clinical_reports
WHERE consent_given = false
  AND content -> 'consenso' ->> 'aceito' = 'true';

-- Verificação pré-execução (deve retornar 27 conforme auditoria)
DO $$
DECLARE
  target_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO target_count FROM clinical_reports_consent_backup_v1_9_39;
  RAISE NOTICE '[V1.9.39] Reports alvo do backfill: %', target_count;

  IF target_count = 0 THEN
    RAISE NOTICE '[V1.9.39] Nenhum report elegível — migration já executada ou estado já coerente.';
  END IF;
END $$;

-- Backfill propriamente dito
UPDATE clinical_reports
SET
  consent_given = true,
  consent_at    = COALESCE(consent_at, created_at)
WHERE
  consent_given = false
  AND content -> 'consenso' ->> 'aceito' = 'true';

-- Verificação pós-execução
DO $$
DECLARE
  remaining_inconsistent INTEGER;
  now_consistent INTEGER;
BEGIN
  SELECT COUNT(*) INTO remaining_inconsistent
  FROM clinical_reports
  WHERE consent_given = false AND content -> 'consenso' ->> 'aceito' = 'true';

  SELECT COUNT(*) INTO now_consistent
  FROM clinical_reports
  WHERE consent_given = true AND content -> 'consenso' ->> 'aceito' = 'true';

  RAISE NOTICE '[V1.9.39] Pós-backfill — inconsistentes restantes: % (esperado 0), total coerente true/true: %',
    remaining_inconsistent, now_consistent;

  IF remaining_inconsistent > 0 THEN
    RAISE EXCEPTION '[V1.9.39] Backfill deixou % linhas inconsistentes — abortando transação', remaining_inconsistent;
  END IF;
END $$;

COMMIT;

-- Rollback manual (se necessário — fora desta migration):
-- BEGIN;
-- UPDATE clinical_reports cr
-- SET consent_given = b.consent_given, consent_at = b.consent_at
-- FROM clinical_reports_consent_backup_v1_9_39 b
-- WHERE cr.id = b.id;
-- COMMIT;
