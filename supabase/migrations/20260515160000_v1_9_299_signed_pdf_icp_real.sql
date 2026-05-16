-- ==============================================================================
-- V1.9.299 — PDF assinado ICP-Brasil REAL (embedded /Sig dictionary)
-- ==============================================================================
--
-- Contexto (15/05/2026 BLOCO P): Ricardo tentou validar prescrição em
-- validar.iti.gov.br e não foi reconhecida. Diagnóstico (Pedro+Claude):
--   • Edge digital-signature gera PKCS#7 sobre JSON do documento, não sobre PDF
--   • Frontend Prescriptions.tsx imprime PKCS#7 como TEXTO visível, não embeda
--     em /Sig dictionary conforme PDF spec ISO 32000-1 §12.8
--   • Validadores ICP-Brasil varrem /Sig → não acham → respondem "sem assinatura"
--
-- Solução (Opção A aprovada Pedro 15/05 ~11h45):
--   • Nova edge sign-pdf-icp gera PDF programático + embeda PKCS#7 detached
--   • Coluna signed_pdf_url paralela ao fluxo atual (zero regressão)
--   • Bucket signed_documents privado + RLS owner-only
--   • Edge digital-signature INTACTA (continua gerando trilha de auditoria)
--
-- Anti-regressão:
--   • Coluna nullable → 45 prescriptions + 17 exam_requests antigos = signed_pdf_url=null
--   • UI só mostra botão "Baixar PDF assinado" quando signed_pdf_url ≠ null
--   • Bucket separado dos buckets existentes (documents, certificates, chat-images)
--   • RLS via JOIN com tabelas (padrão V1.9.98 chat-images)
-- ==============================================================================

-- 1) Coluna signed_pdf_url em cfm_prescriptions
-- (patient_exam_requests JÁ TEM a coluna desde V1.9.231)
ALTER TABLE public.cfm_prescriptions
  ADD COLUMN IF NOT EXISTS signed_pdf_url text;

COMMENT ON COLUMN public.cfm_prescriptions.signed_pdf_url IS
  'V1.9.299 — Path no bucket signed_documents do PDF com /Sig dictionary embedded ICP-Brasil. NULL = doc antigo (pré-V1.9.299) ou ainda não processado pela edge sign-pdf-icp.';

-- 2) Bucket signed_documents — privado, signed URLs only
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('signed_documents', 'signed_documents', false, 10485760, ARRAY['application/pdf'])
ON CONFLICT (id) DO NOTHING;

-- 3) RLS policies do bucket signed_documents
-- 3a) Service role escreve (edge faz upload)
-- Service role já bypassa RLS por padrão — não precisa policy explícita

-- 3b) Paciente lê PDF dos próprios documentos
DROP POLICY IF EXISTS "signed_docs_patient_read" ON storage.objects;
CREATE POLICY "signed_docs_patient_read" ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'signed_documents'
  AND (
    EXISTS (
      SELECT 1 FROM public.cfm_prescriptions p
      WHERE 'prescriptions/' || p.id::text || '.pdf' = name
      AND p.patient_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM public.patient_exam_requests e
      WHERE 'exam_requests/' || e.id::text || '.pdf' = name
      AND e.patient_id = auth.uid()
    )
  )
);

-- 3c) Profissional emissor lê PDF dos documentos que assinou
DROP POLICY IF EXISTS "signed_docs_professional_read" ON storage.objects;
CREATE POLICY "signed_docs_professional_read" ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'signed_documents'
  AND (
    EXISTS (
      SELECT 1 FROM public.cfm_prescriptions p
      WHERE 'prescriptions/' || p.id::text || '.pdf' = name
      AND p.professional_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM public.patient_exam_requests e
      WHERE 'exam_requests/' || e.id::text || '.pdf' = name
      AND e.professional_id = auth.uid()
    )
  )
);

-- 3d) Admin lê tudo (auditoria + suporte)
DROP POLICY IF EXISTS "signed_docs_admin_read" ON storage.objects;
CREATE POLICY "signed_docs_admin_read" ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'signed_documents'
  AND public.is_admin()
);

-- 3e) IMUTABILIDADE — ninguém (exceto service_role via edge) pode UPDATE/DELETE
-- Razão: artefato jurídico assinado, qualquer mutação invalida cadeia ICP-Brasil.
-- Service role bypassa RLS então a edge sign-pdf-icp continua podendo (re)gravar
-- em caso de erro/retry, mas usuários autenticados NUNCA podem.
DROP POLICY IF EXISTS "signed_docs_immutable_no_update" ON storage.objects;
CREATE POLICY "signed_docs_immutable_no_update" ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id != 'signed_documents')
WITH CHECK (bucket_id != 'signed_documents');

DROP POLICY IF EXISTS "signed_docs_immutable_no_delete" ON storage.objects;
CREATE POLICY "signed_docs_immutable_no_delete" ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id != 'signed_documents');

DROP POLICY IF EXISTS "signed_docs_no_authenticated_insert" ON storage.objects;
CREATE POLICY "signed_docs_no_authenticated_insert" ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id != 'signed_documents');
-- INSERT direto por user autenticado é bloqueado. Service role da edge bypassa
-- RLS e pode gravar normalmente.

-- 4) Índice para queries "pendentes de geração de PDF assinado"
CREATE INDEX IF NOT EXISTS idx_cfm_prescriptions_signed_pdf_pending
  ON public.cfm_prescriptions(id)
  WHERE status = 'signed' AND signed_pdf_url IS NULL;

CREATE INDEX IF NOT EXISTS idx_patient_exam_requests_signed_pdf_pending
  ON public.patient_exam_requests(id)
  WHERE status = 'signed' AND signed_pdf_url IS NULL;

-- 5) Auditoria — view consolidada do estado ICP-Brasil real (PDF embedded vs JSON-only)
CREATE OR REPLACE VIEW public.v_icp_pdf_status AS
SELECT
  'prescription'::text AS doc_type,
  id,
  status,
  digital_signature IS NOT NULL AS has_pkcs7_json,
  signed_pdf_url IS NOT NULL AS has_signed_pdf_icp,
  signature_timestamp,
  professional_id,
  patient_id
FROM public.cfm_prescriptions
WHERE status IN ('signed', 'sent', 'validated')
UNION ALL
SELECT
  'exam_request'::text AS doc_type,
  id,
  status,
  digital_signature IS NOT NULL AS has_pkcs7_json,
  signed_pdf_url IS NOT NULL AS has_signed_pdf_icp,
  signature_timestamp,
  professional_id,
  patient_id
FROM public.patient_exam_requests
WHERE status IN ('signed', 'sent', 'validated');

COMMENT ON VIEW public.v_icp_pdf_status IS
  'V1.9.299 — KPI ICP-Brasil real: has_pkcs7_json=PKCS#7 sobre JSON (V1.9.176, auditoria interna), has_signed_pdf_icp=PDF com /Sig embedded validável externamente em validar.iti.gov.br (V1.9.299+).';

GRANT SELECT ON public.v_icp_pdf_status TO authenticated;
