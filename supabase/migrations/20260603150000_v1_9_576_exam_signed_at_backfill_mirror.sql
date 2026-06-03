-- V1.9.576: patient_exam_requests.signed_at backfill + trigger espelho (gap auditabilidade).
-- Gap-analysis 02/06: "signed_at NULL em 25/25 exames". Investigacao empirica 03/06:
--   13 exames status='signed' tem signature_timestamp + digital_signature + signed_pdf_url,
--   mas signed_at NULL (coluna redundante nunca espelhada). 12 sao draft (NULL correto).
--   O frontend (PatientExamRequestsCard) usa signature_timestamp, nao signed_at.
-- Fix zero-risco SEM tocar a Edge de assinatura (lock V1.9.299 PBAD intocado):
--   1. Backfill signed_at = signature_timestamp nos assinados.
--   2. Trigger BEFORE INS/UPD espelha signature_timestamp -> signed_at (consistencia futura).

-- 1) Backfill (13 rows)
UPDATE public.patient_exam_requests
SET signed_at = signature_timestamp
WHERE signed_at IS NULL AND signature_timestamp IS NOT NULL;

-- 2) Trigger espelho (aditivo, nunca bloqueia, nao toca o fluxo de assinatura)
CREATE OR REPLACE FUNCTION public.mirror_exam_signed_at()
RETURNS trigger
LANGUAGE plpgsql
AS $fn$
BEGIN
  IF NEW.signature_timestamp IS NOT NULL AND NEW.signed_at IS NULL THEN
    NEW.signed_at := NEW.signature_timestamp;
  END IF;
  RETURN NEW;
END;
$fn$;

DROP TRIGGER IF EXISTS trg_mirror_exam_signed_at ON public.patient_exam_requests;
CREATE TRIGGER trg_mirror_exam_signed_at
  BEFORE INSERT OR UPDATE OF signature_timestamp, signed_at ON public.patient_exam_requests
  FOR EACH ROW EXECUTE FUNCTION public.mirror_exam_signed_at();
