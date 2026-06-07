-- =====================================================
-- V1.9.613 — Tabela clinical_cannabis_signals ("Cannabis no Relato")
-- =====================================================
-- Captura a RELAÇÃO do paciente com a cannabis na FALA dele: VONTADE (intenção/
-- curiosidade/substituir), USO (atual/prévio), RECEIO (medo/barreira). Autonomia
-- do paciente trazida ao médico — sem card, some. Poucos hoje, alto valor + cresce.
-- FILOSOFIA (Pedro 07/06): é o que o PACIENTE expressou, não indicação do app. MIMRE.
-- Z2: sinaliza a fala, não prescreve. Fase 2: cruzar com prescrições (adesão→eficácia).
--
-- Espelho de clinical_reported_signals (V1.9.612). Edge cannabis-relato-extractor.
-- ZERO REGRESSÃO: tabela NOVA, aditiva. RLS = médico via appointments OR admin.
-- =====================================================

CREATE TABLE IF NOT EXISTS public.clinical_cannabis_signals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid NOT NULL,
  report_id text REFERENCES public.clinical_reports(id) ON DELETE CASCADE,
  dominio text NOT NULL CHECK (dominio IN ('VONTADE', 'USO', 'RECEIO')),
  subcategoria text NOT NULL,
  fala_literal text NOT NULL,
  confianca integer NOT NULL CHECK (confianca BETWEEN 0 AND 100),
  sujeito text DEFAULT 'proprio_paciente',
  ambiguidade_clinica boolean DEFAULT false,
  source_text text,
  model text DEFAULT 'gpt-4o-mini',
  parser_version text DEFAULT 'V1.9.613',
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'archived')),
  reviewed_by uuid,
  reviewed_at timestamptz,
  created_at timestamptz DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_cannabis_signal_dedup
  ON public.clinical_cannabis_signals (report_id, dominio, subcategoria, md5(fala_literal));

CREATE INDEX IF NOT EXISTS idx_cannabis_signals_patient ON public.clinical_cannabis_signals (patient_id);
CREATE INDEX IF NOT EXISTS idx_cannabis_signals_report ON public.clinical_cannabis_signals (report_id);
CREATE INDEX IF NOT EXISTS idx_cannabis_signals_status ON public.clinical_cannabis_signals (status);

ALTER TABLE public.clinical_cannabis_signals ENABLE ROW LEVEL SECURITY;

CREATE POLICY cannabis_sig_professional_select ON public.clinical_cannabis_signals
  FOR SELECT TO public
  USING ((EXISTS (SELECT 1 FROM public.appointments a WHERE a.patient_id = clinical_cannabis_signals.patient_id AND a.professional_id = auth.uid())) OR public.is_admin());

CREATE POLICY cannabis_sig_professional_update ON public.clinical_cannabis_signals
  FOR UPDATE TO public
  USING ((EXISTS (SELECT 1 FROM public.appointments a WHERE a.patient_id = clinical_cannabis_signals.patient_id AND a.professional_id = auth.uid())) OR public.is_admin())
  WITH CHECK ((EXISTS (SELECT 1 FROM public.appointments a WHERE a.patient_id = clinical_cannabis_signals.patient_id AND a.professional_id = auth.uid())) OR public.is_admin());

CREATE POLICY cannabis_sig_admin_all ON public.clinical_cannabis_signals
  FOR ALL TO public USING (public.is_admin()) WITH CHECK (public.is_admin());

COMMENT ON TABLE public.clinical_cannabis_signals IS
  'Cannabis no Relato (VONTADE/USO/RECEIO) V1.9.613 — relação do paciente com a cannabis na fala dele, captada do report pela Edge cannabis-relato-extractor. NÃO é indicação do app (paciente→app→pro, MIMRE). Z2: sinaliza, não prescreve. Fase 2: cruzar com prescrições p/ adesão→eficácia.';
