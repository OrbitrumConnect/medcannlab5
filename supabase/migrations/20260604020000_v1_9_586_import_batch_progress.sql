-- V1.9.586: colunas de PROGRESSO/STATUS em import_batches (Fase 1 do marco "Edge assíncrona").
-- Pré-requisito pra execução em chunks com progresso + falha parcial (pontos do GPT 04/06):
--   status (já existia, text): pending | running | partial | failed | done
--   processed_count: quantos pacientes já processados (progresso = processed_count / total_patients)
--   error_count + error_log (jsonb): observabilidade — quantos erros + qual registro causou
--   started_at / finished_at: janela de execução
--
-- Aditivo puro em tabela VAZIA (import_batches 0 rows) → impossível regredir.
-- NOTA: o índice UNIQUE de idempotência de filhos (source_external_id) fica pra a Fase 2 (Edge),
-- porque exige namespacing por profissional/source (EMRs colidem Ids) — decisão coerente com a Edge.

ALTER TABLE public.import_batches ADD COLUMN IF NOT EXISTS processed_count integer NOT NULL DEFAULT 0;
ALTER TABLE public.import_batches ADD COLUMN IF NOT EXISTS error_count integer NOT NULL DEFAULT 0;
ALTER TABLE public.import_batches ADD COLUMN IF NOT EXISTS error_log jsonb;       -- [{source_external_id, etapa, erro}]
ALTER TABLE public.import_batches ADD COLUMN IF NOT EXISTS started_at timestamptz;
ALTER TABLE public.import_batches ADD COLUMN IF NOT EXISTS finished_at timestamptz;
