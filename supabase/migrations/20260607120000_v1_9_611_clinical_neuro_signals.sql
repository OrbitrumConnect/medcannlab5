-- =====================================================
-- V1.9.611 — Tabela clinical_neuro_signals (Sidecar Neuro Fase D)
-- =====================================================
-- Espelho arquitetural do renal_inline_suggestions (V1.9.307), porém a fonte é
-- o RELATÓRIO consolidado (clinical_reports.content), não a captation mid-AEC —
-- decisão Pedro 07/06: report é 1:1 com a AEC, consent já dado, sem o problema
-- de escopo do chat (session_id per-turno). Populada pela Edge neuro-signal-extractor.
--
-- ZERO REGRESSÃO: tabela NOVA, aditiva. Nada lê dela ainda (card hardcoded
-- continua até GO Eduardo / Fase B). RLS espelha o renal (médico via appointments
-- OR admin). Service role (Edge) escreve bypassa RLS.
--
-- DUAL-WRITE: por ora SÓ tabela (canônica analytics/card profissional). A
-- projeção jsonb em clinical_reports.content.neuro_signals fica DEFERIDA até
-- existir um leitor (anti-divergência prematura — checklist dual-write 18/05:
-- não criar 2ª fonte sem reader). Paciente NÃO vê sinais neuro (target hidden).
-- =====================================================

CREATE TABLE IF NOT EXISTS public.clinical_neuro_signals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid NOT NULL,
  report_id text REFERENCES public.clinical_reports(id) ON DELETE CASCADE,  -- clinical_reports.id é TEXT (gotcha empírico 07/06)
  transtorno text NOT NULL CHECK (transtorno IN ('TEA', 'TOD', 'TDAH', 'EPILEPSIA')),
  subcategoria text NOT NULL,
  fala_literal text NOT NULL,
  confianca integer NOT NULL CHECK (confianca BETWEEN 0 AND 100),
  sujeito text DEFAULT 'proprio_paciente',
  ambiguidade_clinica boolean DEFAULT false,
  source_text text,
  model text DEFAULT 'gpt-4o-mini',
  parser_version text DEFAULT 'V1.9.611',
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'archived')),
  reviewed_by uuid,
  reviewed_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- Idempotência: mesma fala/categoria do mesmo report não duplica.
-- Índice COMPLETO (não-parcial) — supabase-js .insert + catch 23505 (lição V1.9.590).
CREATE UNIQUE INDEX IF NOT EXISTS uq_neuro_signal_dedup
  ON public.clinical_neuro_signals (report_id, transtorno, subcategoria, md5(fala_literal));

CREATE INDEX IF NOT EXISTS idx_neuro_signals_patient ON public.clinical_neuro_signals (patient_id);
CREATE INDEX IF NOT EXISTS idx_neuro_signals_report ON public.clinical_neuro_signals (report_id);
CREATE INDEX IF NOT EXISTS idx_neuro_signals_status ON public.clinical_neuro_signals (status);

ALTER TABLE public.clinical_neuro_signals ENABLE ROW LEVEL SECURITY;

-- RLS appointment-based (igual renal V1.9.307), mas APERTADA pós-review GPT/Claude:
-- profissional só SELECT (ver) + UPDATE (revisar/aprovar/arquivar via status) — SEM
-- INSERT/DELETE (Edge insere via service_role que bypassa RLS; archive cobre remoção).
-- NÃO filtra por especialidade — é por appointment (qualquer médico com appointment
-- com o paciente vê; especialidade seria camada extra futura).
CREATE POLICY neuro_sugg_professional_select ON public.clinical_neuro_signals
  FOR SELECT TO public
  USING ((EXISTS (SELECT 1 FROM public.appointments a WHERE a.patient_id = clinical_neuro_signals.patient_id AND a.professional_id = auth.uid())) OR public.is_admin());

CREATE POLICY neuro_sugg_professional_update ON public.clinical_neuro_signals
  FOR UPDATE TO public
  USING ((EXISTS (SELECT 1 FROM public.appointments a WHERE a.patient_id = clinical_neuro_signals.patient_id AND a.professional_id = auth.uid())) OR public.is_admin())
  WITH CHECK ((EXISTS (SELECT 1 FROM public.appointments a WHERE a.patient_id = clinical_neuro_signals.patient_id AND a.professional_id = auth.uid())) OR public.is_admin());

CREATE POLICY neuro_sugg_admin_all ON public.clinical_neuro_signals
  FOR ALL TO public USING (public.is_admin()) WITH CHECK (public.is_admin());

-- Drift LIMITADO: o prompt da Edge enumera as categorias (soft-enum). Hard-enum
-- (neuro_signal_subcategories) fica pra V1.9.612 quando Eduardo validar lista canônica.
COMMENT ON COLUMN public.clinical_neuro_signals.subcategoria IS
  'Categoria livre V1.9.611. Drift LIMITADO pelo prompt-enum da Edge. Hard-enum em V1.9.612 (Fase B Eduardo).';

-- ESCOPO: TEA/TOD/TDAH + EPILEPSIA (V1.9.611-C — Pedro: Gisele é caso neuro real;
-- app já tem KPI "Episódios Epilepsia 30d"). TOC/ansiedade isolada ficam fora por design.
-- Eduardo valida categorias na Fase B. Edge só emite esses 4 → CHECK nunca quebra.
COMMENT ON TABLE public.clinical_neuro_signals IS
  'Sidecar Neuro (TEA/TOD/TDAH) V1.9.611 — sinais extraídos do report consolidado pela Edge neuro-signal-extractor (GPT-4o-mini, deployada+validada 07/06: reproduz audit manual Eduardo). Z2: sinaliza, não diagnostica. Pipeline PROVADO E2E (idempotência ok). Só o CARD live aguarda GO Eduardo (Fase B); a tabela JÁ é operacional (flag-gated, OFF default).';
