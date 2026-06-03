-- V1.9.578: tabela de VÍNCULO explícito médico↔paciente (#1 da fundação Migração de Base Clínica).
-- Resolve o gap: paciente importado (sem consulta/avaliação) era INVISÍVEL na lista do médico,
-- porque getAllPatients (adminPermissions.ts) deriva a lista de clinical_assessments+appointments,
-- e patient_doctors é VIEW (derivada de appointments) — não dá pra gravar vínculo nela.
--
-- Esta tabela permite vincular um paciente a um profissional SEM exigir consulta/AEC prévia
-- (caso do import: cria 1 link por paciente importado → médico passa a ver no prontuário).
-- getAllPatients agora faz UNION (assessments + appointments + patient_professional_links).
--
-- ANTI-REGRESSÃO (examinado empíricamente 03/06):
--   • Tabela NOVA, nasce VAZIA → UNION adiciona 0 hoje. Prova: Ricardo vê 50 ANTES e 50 DEPOIS.
--   • getAllPatients: query do link é NÃO-BLOQUEANTE (se falhar, lista segue de assessments+appointments).
--   • Fluxo normal INTOCADO: paciente que faz AEC vincula via assessment; que marca consulta via appointment.
--   • Aditiva pura (tabela + RLS + índices). Locks 8 intocados.

CREATE TABLE IF NOT EXISTS public.patient_professional_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid NOT NULL,
  professional_id uuid NOT NULL,
  relationship text NOT NULL DEFAULT 'care',   -- care | imported | referral
  source text,                                  -- 'import' | 'manual' | ...
  import_batch_id uuid REFERENCES public.import_batches(id),
  source_external_id text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (patient_id, professional_id)
);

ALTER TABLE public.patient_professional_links ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "ppl owner prof patient admin" ON public.patient_professional_links;
CREATE POLICY "ppl owner prof patient admin" ON public.patient_professional_links
  FOR ALL TO public
  USING (is_admin() OR professional_id = auth.uid() OR patient_id = auth.uid())
  WITH CHECK (is_admin() OR professional_id = auth.uid());

CREATE INDEX IF NOT EXISTS idx_ppl_professional ON public.patient_professional_links(professional_id);
CREATE INDEX IF NOT EXISTS idx_ppl_patient ON public.patient_professional_links(patient_id);
CREATE INDEX IF NOT EXISTS idx_ppl_import ON public.patient_professional_links(import_batch_id);
