-- V1.9.583: colunas de aceite do Termo de Responsabilidade pela Importação de Dados
-- (camada operacional do #5 da Migração de Base Clínica — ver docs/MIGRACAO_BASE_CLINICA_SPEC.md).
--
-- O checkbox do termo é EVIDÊNCIA operacional (médico declara base legal + responsabilidade),
-- NÃO substitui a documentação jurídica (DPA/Termos de Uso — esses vêm com CNPJ + advogado).
-- Estas colunas gravam o aceite por lote de importação, com versionamento e auditoria.
--
-- Aditivo puro em tabela VAZIA (import_batches 0 rows) → impossível regredir.

ALTER TABLE public.import_batches ADD COLUMN IF NOT EXISTS terms_accepted boolean NOT NULL DEFAULT false;
ALTER TABLE public.import_batches ADD COLUMN IF NOT EXISTS terms_accepted_at timestamptz;
ALTER TABLE public.import_batches ADD COLUMN IF NOT EXISTS terms_version text;       -- versão do termo aceito (ex: '2026-06-04.v1')
ALTER TABLE public.import_batches ADD COLUMN IF NOT EXISTS terms_hash text;          -- hash SHA-256 do texto do termo na hora do aceite
ALTER TABLE public.import_batches ADD COLUMN IF NOT EXISTS accepted_ip text;         -- IP do profissional no aceite (auditoria)
ALTER TABLE public.import_batches ADD COLUMN IF NOT EXISTS accepted_user_agent text; -- user-agent no aceite (auditoria)
