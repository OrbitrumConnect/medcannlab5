-- V1.9.587: índices UNIQUE de idempotência da importação (Fase 2 — Edge).
-- Re-rodar o mesmo ZIP NÃO duplica: insert com ON CONFLICT (source_external_id) DO NOTHING.
-- source_external_id é NAMESPACED na Edge por profissional (`${professionalId}::${rawId}`) →
-- sem colisão entre EMRs diferentes (que reusam Ids "p1","p2") + idempotente pro mesmo médico.
-- PARCIAL (WHERE NOT NULL): só vale pra rows IMPORTADAS; nativas (source_external_id NULL) ignoradas.
-- Aditivo: 0 rows com source_external_id não-nulo hoje (import nunca rodou) → criação segura.

CREATE UNIQUE INDEX IF NOT EXISTS uq_users_source_ext
  ON public.users (source_external_id) WHERE source_external_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS uq_pmr_source_ext
  ON public.patient_medical_records (source_external_id) WHERE source_external_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS uq_pdoc_source_ext
  ON public.patient_documents (source_external_id) WHERE source_external_id IS NOT NULL;
