-- =====================================================
-- V1.9.612 — Tabela clinical_reported_signals ("Sinais do Relato")
-- =====================================================
-- Sidecar DOR + SONO + ANSIEDADE — os 3 sinais mais frequentes no relato (dor=74%,
-- ansiedade=40%, sono=38% dos 151 reports) e as 3 indicações centrais da cannabis.
-- FILOSOFIA (Pedro 07/06): NÃO é "indicação" nem "sugestão" do app — é a fala/semântica
-- do PRÓPRIO paciente, captada e repassada ao médico (paciente → app → pro). MIMRE.
-- Z2: sinaliza o que o paciente RELATOU, não prescreve.
--
-- Espelho de clinical_neuro_signals (V1.9.611). Populada pela Edge report-signal-extractor.
-- ZERO REGRESSÃO: tabela NOVA, aditiva. RLS = médico via appointments OR admin.
-- =====================================================

CREATE TABLE IF NOT EXISTS public.clinical_reported_signals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid NOT NULL,
  report_id text REFERENCES public.clinical_reports(id) ON DELETE CASCADE,  -- clinical_reports.id é TEXT
  dominio text NOT NULL CHECK (dominio IN ('DOR', 'SONO', 'ANSIEDADE')),
  subcategoria text NOT NULL,
  fala_literal text NOT NULL,
  confianca integer NOT NULL CHECK (confianca BETWEEN 0 AND 100),
  sujeito text DEFAULT 'proprio_paciente',
  ambiguidade_clinica boolean DEFAULT false,
  source_text text,
  model text DEFAULT 'gpt-4o-mini',
  parser_version text DEFAULT 'V1.9.612',
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'archived')),
  reviewed_by uuid,
  reviewed_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- Idempotência: índice COMPLETO (lição V1.9.590) + catch 23505 no .insert
CREATE UNIQUE INDEX IF NOT EXISTS uq_reported_signal_dedup
  ON public.clinical_reported_signals (report_id, dominio, subcategoria, md5(fala_literal));

CREATE INDEX IF NOT EXISTS idx_reported_signals_patient ON public.clinical_reported_signals (patient_id);
CREATE INDEX IF NOT EXISTS idx_reported_signals_report ON public.clinical_reported_signals (report_id);
CREATE INDEX IF NOT EXISTS idx_reported_signals_status ON public.clinical_reported_signals (status);

ALTER TABLE public.clinical_reported_signals ENABLE ROW LEVEL SECURITY;

-- RLS apertada (espelho neuro V1.9.611): profissional SELECT + UPDATE (revisar via
-- status), SEM INSERT/DELETE (Edge insere via service_role). admin ALL.
CREATE POLICY reported_sig_professional_select ON public.clinical_reported_signals
  FOR SELECT TO public
  USING ((EXISTS (SELECT 1 FROM public.appointments a WHERE a.patient_id = clinical_reported_signals.patient_id AND a.professional_id = auth.uid())) OR public.is_admin());

CREATE POLICY reported_sig_professional_update ON public.clinical_reported_signals
  FOR UPDATE TO public
  USING ((EXISTS (SELECT 1 FROM public.appointments a WHERE a.patient_id = clinical_reported_signals.patient_id AND a.professional_id = auth.uid())) OR public.is_admin())
  WITH CHECK ((EXISTS (SELECT 1 FROM public.appointments a WHERE a.patient_id = clinical_reported_signals.patient_id AND a.professional_id = auth.uid())) OR public.is_admin());

CREATE POLICY reported_sig_admin_all ON public.clinical_reported_signals
  FOR ALL TO public USING (public.is_admin()) WITH CHECK (public.is_admin());

COMMENT ON TABLE public.clinical_reported_signals IS
  'Sinais do Relato (DOR/SONO/ANSIEDADE) V1.9.612 — fala espontânea do paciente captada do report consolidado pela Edge report-signal-extractor (GPT-4o-mini). NÃO é indicação/sugestão do app (paciente→app→pro, MIMRE). Z2: sinaliza, não prescreve. Card live default; flag reported_signals kill-switch.';
