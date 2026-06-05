-- V1.9.590: índices de idempotência da importação PARCIAIS → COMPLETOS (achado do piloto e2e 05/06).
--
-- PROBLEMA (pego no piloto e2e da Edge bulk-import-emr): os índices do V1.9.587 eram PARCIAIS
-- (`WHERE source_external_id IS NOT NULL`). O `supabase-js .upsert({ onConflict: 'source_external_id' })`
-- gera `ON CONFLICT (source_external_id)` SEM o predicado WHERE → o Postgres não casa a cláusula com
-- um índice parcial e lança: "there is no unique or exclusion constraint matching the ON CONFLICT
-- specification". Resultado: TODO insert de filho (patient_medical_records/documents) falhava no import.
--
-- CORREÇÃO: índice unique COMPLETO (sem WHERE). Em coluna NULLABLE o Postgres trata NULLs como
-- DISTINTOS (NULLS DISTINCT, padrão) → linhas NATIVAS (source_external_id IS NULL) continuam podendo
-- coexistir sem colisão, e o ON CONFLICT do supabase-js passa a casar. Ganha-se idempotência real.
--
-- SEGURANÇA (anti-regressão): import nunca rodou em produção → 100% das linhas têm source_external_id
-- NULL hoje → criar o índice completo é seguro (nenhum valor não-nulo p/ colidir). Aditivo + reversível.
-- Validado no piloto e2e 05/06: 3 runs do mesmo lote → 2 pacientes / 3 filhos estáveis (sem duplicar).

DROP INDEX IF EXISTS public.uq_users_source_ext;
DROP INDEX IF EXISTS public.uq_pmr_source_ext;
DROP INDEX IF EXISTS public.uq_pdoc_source_ext;

CREATE UNIQUE INDEX IF NOT EXISTS uq_users_source_ext ON public.users (source_external_id);
CREATE UNIQUE INDEX IF NOT EXISTS uq_pmr_source_ext ON public.patient_medical_records (source_external_id);
CREATE UNIQUE INDEX IF NOT EXISTS uq_pdoc_source_ext ON public.patient_documents (source_external_id);
