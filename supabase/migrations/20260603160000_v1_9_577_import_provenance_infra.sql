-- V1.9.577: Infra de PROVENIÊNCIA p/ "Migração de Base Clínica" (#2 da fundação).
-- Feature de plataforma (qualquer profissional migra sua base de outro EMR), validada
-- com export real do Eduardo (1.629 pacientes). Ver docs/MIGRACAO_BASE_CLINICA_SPEC.md.
--
-- Esta migração NÃO importa dado nenhum — só cria a CAPACIDADE de rastrear origem:
--   • import_batches: 1 row por importação (quem, qual sistema de origem, status, contagens)
--   • import_batch_id + source_external_id nas 5 tabelas reais que recebem dados importados
--     - import_batch_id IS NULL  => dado NATIVO (gerado na MedCannLab)
--     - import_batch_id NOT NULL => dado IMPORTADO (e de qual batch/sistema)
--     - source_external_id       => Id original no EMR de origem (dedup/idempotência)
--
-- Para que serve a proveniência (decisões já tomadas):
--   1. Isolar do pipeline de IA (Matrix Z2/RAG/chat só lê WHERE import_batch_id IS NULL)
--   2. Não inflar métricas públicas (landing/avaliações contam só nativo)
--   3. Dedup/idempotência (re-subir o mesmo ZIP não duplica — chave source_external_id)
--   4. Audit LGPD (rastrear o que veio de fora, de quem, quando)
--
-- AVALIAÇÃO DE SCHEMA (anti-regressão, 03/06):
--   • Aditiva pura: colunas NULLABLE sem default + tabela nova + RLS nova + índices IF NOT EXISTS.
--     0 rewrite, rows existentes ficam NULL (= nativo). Smoke: users 53/53 NULL, reports 150 intactos.
--   • patient_doctors é VIEW (derivada de appointments) — NÃO recebe coluna aqui. Confirma o
--     gap #1: não há tabela de VÍNCULO gravável; visibilidade do paciente importado exigirá
--     TABELA NOVA (patient_doctors não serve). Tratado no #1 (migração futura).

CREATE TABLE IF NOT EXISTS public.import_batches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  professional_id uuid NOT NULL,
  source_system text,            -- 'ninsaude' | 'iclinic' | 'clinica_nas_nuvens' | 'csv_custom' | ...
  filename text,
  status text NOT NULL DEFAULT 'pending',  -- pending | analyzing | previewed | importing | done | failed
  total_patients integer DEFAULT 0,
  total_records integer DEFAULT 0,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.import_batches ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "import_batches owner or admin" ON public.import_batches;
CREATE POLICY "import_batches owner or admin" ON public.import_batches
  FOR ALL TO public
  USING (is_admin() OR professional_id = auth.uid())
  WITH CHECK (is_admin() OR professional_id = auth.uid());

-- Proveniência nas 5 tabelas REAIS (patient_doctors é view → fora)
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS import_batch_id uuid REFERENCES public.import_batches(id);
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS source_external_id text;
ALTER TABLE public.patient_medical_records ADD COLUMN IF NOT EXISTS import_batch_id uuid REFERENCES public.import_batches(id);
ALTER TABLE public.patient_medical_records ADD COLUMN IF NOT EXISTS source_external_id text;
ALTER TABLE public.cfm_prescriptions ADD COLUMN IF NOT EXISTS import_batch_id uuid REFERENCES public.import_batches(id);
ALTER TABLE public.cfm_prescriptions ADD COLUMN IF NOT EXISTS source_external_id text;
ALTER TABLE public.patient_exam_requests ADD COLUMN IF NOT EXISTS import_batch_id uuid REFERENCES public.import_batches(id);
ALTER TABLE public.patient_exam_requests ADD COLUMN IF NOT EXISTS source_external_id text;
ALTER TABLE public.patient_documents ADD COLUMN IF NOT EXISTS import_batch_id uuid REFERENCES public.import_batches(id);
ALTER TABLE public.patient_documents ADD COLUMN IF NOT EXISTS source_external_id text;

CREATE INDEX IF NOT EXISTS idx_users_import ON public.users(import_batch_id);
CREATE INDEX IF NOT EXISTS idx_users_source_ext ON public.users(source_external_id);
CREATE INDEX IF NOT EXISTS idx_pmr_import ON public.patient_medical_records(import_batch_id);
CREATE INDEX IF NOT EXISTS idx_cfm_import ON public.cfm_prescriptions(import_batch_id);
CREATE INDEX IF NOT EXISTS idx_pexam_import ON public.patient_exam_requests(import_batch_id);
CREATE INDEX IF NOT EXISTS idx_pdoc_import ON public.patient_documents(import_batch_id);
