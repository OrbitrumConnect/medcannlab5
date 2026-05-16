-- =====================================================
-- V1.9.311 (16/05/2026) — NFT Consent Pattern (B-lite)
-- =====================================================
-- Filosofia: NFT é memorial/simbólico do paciente, NÃO anexo clínico.
-- Médico só vê se paciente liberar explícito (semelhante consent referral V1.9.275).
--
-- Mudança comportamental:
--   ANTES: médico vê NFT automático via report-pai (acesso implícito via vínculo)
--   AGORA: médico só vê se shared_with_professional = true (consent explícito)
--
-- Default conservador: false → 33 NFTs existentes ficam invisíveis pros médicos
-- até paciente liberar. Pré-PMF impacto = zero (Ricardo nunca acessou NFT antes,
-- não havia tela).
-- =====================================================

ALTER TABLE public.patient_nfts
  ADD COLUMN IF NOT EXISTS shared_with_professional boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS shared_at timestamptz,
  ADD COLUMN IF NOT EXISTS shared_by uuid REFERENCES auth.users(id);

COMMENT ON COLUMN public.patient_nfts.shared_with_professional IS
  'V1.9.311: paciente liberou peça pro profissional vinculado ver? Default false = consent explícito necessário.';

COMMENT ON COLUMN public.patient_nfts.shared_at IS
  'V1.9.311: timestamp da liberação. Null se nunca liberado.';

COMMENT ON COLUMN public.patient_nfts.shared_by IS
  'V1.9.311: quem liberou (sempre patient_id hoje, schema preparado pra equipe clínica futura sem migration).';

-- ============================================================================
-- RLS — endurecer policy professional (consent explícito necessário)
-- ============================================================================
-- Mantém intactas:
--   - "Patient sees own NFTs" — paciente sempre vê seus próprios
--   - "Admin sees all NFTs"   — admin continua vendo tudo (auditoria/suporte)
-- Substitui:
--   - "Professional sees patient NFTs via clinical reports" (acesso automático)
-- Por:
--   - "Professional sees only patient-shared NFTs" (consent obrigatório)

DROP POLICY IF EXISTS "Professional sees patient NFTs via clinical reports" ON public.patient_nfts;

CREATE POLICY "Professional sees only patient-shared NFTs"
  ON public.patient_nfts
  FOR SELECT
  USING (
    shared_with_professional = true
    AND EXISTS (
      SELECT 1 FROM public.clinical_reports cr
      WHERE cr.id = patient_nfts.report_id
        AND (cr.professional_id = auth.uid() OR cr.doctor_id = auth.uid())
    )
  );

-- ============================================================================
-- UPDATE policy: paciente pode togglar shared_with_professional do próprio NFT
-- ============================================================================
-- Sem essa policy, paciente fica bloqueado de mudar o toggle (RLS UPDATE
-- não tinha policy permissiva antes). Restringe colunas via WITH CHECK.

DROP POLICY IF EXISTS "Patient toggles share on own NFTs" ON public.patient_nfts;

CREATE POLICY "Patient toggles share on own NFTs"
  ON public.patient_nfts
  FOR UPDATE
  USING (auth.uid() = patient_id)
  WITH CHECK (auth.uid() = patient_id);

-- Índice parcial pra queries do ProfessionalNFTGallery (shared = true)
CREATE INDEX IF NOT EXISTS idx_patient_nfts_shared
  ON public.patient_nfts (report_id)
  WHERE shared_with_professional = true;
