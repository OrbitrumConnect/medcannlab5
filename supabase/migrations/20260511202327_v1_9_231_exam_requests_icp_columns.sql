-- V1.9.231 — Adiciona colunas ICP-Brasil em patient_exam_requests
-- Data: 11/05/2026 20:23 BRT
--
-- Contexto: Auditoria empirica via PAT (11/05) revelou patient_exam_requests
-- com 13 docs (100% draft, 0 assinadas) e schema sem ICP-Brasil real:
--   • Tinha apenas: signature_token, signed_pdf_url, signed_at (simples)
--   • Faltava: digital_signature, signature_certificate, iti_validation_code,
--     iti_qr_code, iti_validation_url, document_level, signature_timestamp
--
-- Ricardo 11/05: ICP-Brasil aplica a TODOS docs medicos (laudos + atestados +
-- solicitacao de exames + prescricoes), nao apenas prescricoes. Atestado e
-- prescricao ja vivem em cfm_prescriptions (com ICP). Exam_requests era o
-- unico doc clinico medico-emitido SEM ICP-Brasil completo.
--
-- Esta migration espelha as 7 colunas ICP do cfm_prescriptions em
-- patient_exam_requests. Edge digital-signature sera refatorado (V1.9.231.3)
-- para aceitar document_type = 'exam_request' e popular essas colunas.
--
-- Anti-regressao:
--   • Todas colunas nullable + sem default → 13 docs existentes intactos
--   • Colunas legacy (signature_token, signed_pdf_url, signed_at) preservadas
--   • IF NOT EXISTS em cada ADD COLUMN → re-rodar nao quebra
--   • Edge cfm_prescriptions intocado (fluxo atual de 43 prescricoes preservado)

ALTER TABLE public.patient_exam_requests
  ADD COLUMN IF NOT EXISTS digital_signature      text;

ALTER TABLE public.patient_exam_requests
  ADD COLUMN IF NOT EXISTS signature_certificate  text;

ALTER TABLE public.patient_exam_requests
  ADD COLUMN IF NOT EXISTS signature_timestamp    timestamp with time zone;

ALTER TABLE public.patient_exam_requests
  ADD COLUMN IF NOT EXISTS iti_validation_code    text;

ALTER TABLE public.patient_exam_requests
  ADD COLUMN IF NOT EXISTS iti_validation_url     text;

ALTER TABLE public.patient_exam_requests
  ADD COLUMN IF NOT EXISTS iti_qr_code            text;

ALTER TABLE public.patient_exam_requests
  ADD COLUMN IF NOT EXISTS document_level         text;

-- Validacao: zero linha tocada (so adicionou colunas com NULL default)
DO $$
DECLARE
  v_total int;
BEGIN
  SELECT COUNT(*) INTO v_total FROM public.patient_exam_requests;
  RAISE NOTICE '[V1.9.231] patient_exam_requests: % rows preservadas, 7 colunas ICP adicionadas', v_total;
END $$;

COMMENT ON COLUMN public.patient_exam_requests.digital_signature IS
  'V1.9.231 — Assinatura PKCS#7 ICP-Brasil em base64 (gerada por Edge digital-signature)';
COMMENT ON COLUMN public.patient_exam_requests.iti_validation_code IS
  'V1.9.231 — Codigo ITI-XXXXXXXX derivado do hash do PKCS#7 (auditavel via gov.br/iti)';
