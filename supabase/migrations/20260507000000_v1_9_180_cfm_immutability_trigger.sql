-- V1.9.180 — Trigger imutabilidade CFM 2.314/2022 em cfm_prescriptions
-- ====================================================================
-- Defesa Triple-A: prescrição assinada digitalmente é IMUTÁVEL conforme
-- CFM Resolução 2.314/2022. Após status='signed', medicamentos/dosagem/
-- paciente/profissional NÃO podem mudar — só campos de envio.
--
-- Antes desta migration: RLS UPDATE permitia médico alterar QUALQUER campo
-- de uma prescription signed (vetor de fraude clínica).
--
-- Compatibilidade: handleSendToPatient (Prescriptions.tsx:917) faz UPDATE
-- signed→sent — esse fluxo é PRESERVADO (campos sent_at, email_sent_at,
-- sms_sent_at, sent_via_email, sent_via_sms, status são whitelisted).
--
-- Edge digital-signature (service_role) BYPASSA RLS e triggers via
-- SECURITY DEFINER context — então draft→signed continua funcionando.

CREATE OR REPLACE FUNCTION public.fn_cfm_prescriptions_immutability()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  -- Drafts são livres pra edição (caso de uso V1.9.180 — médico edita rascunho)
  IF OLD.status = 'draft' THEN
    RETURN NEW;
  END IF;

  -- Cancelled também livres (médico pode "ressuscitar" cancelando — raro)
  IF OLD.status = 'cancelled' THEN
    RETURN NEW;
  END IF;

  -- Signed/Sent/Validated: imutáveis exceto whitelist de transição
  IF OLD.medications IS DISTINCT FROM NEW.medications THEN
    RAISE EXCEPTION 'Imutabilidade CFM: medications não pode ser alterada após status=%. Para mudar, crie nova prescrição.', OLD.status
      USING ERRCODE = 'check_violation';
  END IF;

  IF OLD.notes IS DISTINCT FROM NEW.notes THEN
    RAISE EXCEPTION 'Imutabilidade CFM: notes não pode ser alterada após status=%.', OLD.status
      USING ERRCODE = 'check_violation';
  END IF;

  IF OLD.patient_id IS DISTINCT FROM NEW.patient_id
     OR OLD.patient_name IS DISTINCT FROM NEW.patient_name
     OR OLD.patient_cpf IS DISTINCT FROM NEW.patient_cpf
     OR OLD.patient_email IS DISTINCT FROM NEW.patient_email
     OR OLD.patient_phone IS DISTINCT FROM NEW.patient_phone THEN
    RAISE EXCEPTION 'Imutabilidade CFM: dados do paciente não podem ser alterados após status=%.', OLD.status
      USING ERRCODE = 'check_violation';
  END IF;

  IF OLD.professional_id IS DISTINCT FROM NEW.professional_id
     OR OLD.professional_name IS DISTINCT FROM NEW.professional_name
     OR OLD.professional_crm IS DISTINCT FROM NEW.professional_crm
     OR OLD.professional_specialty IS DISTINCT FROM NEW.professional_specialty THEN
    RAISE EXCEPTION 'Imutabilidade CFM: dados do profissional não podem ser alterados após status=%.', OLD.status
      USING ERRCODE = 'check_violation';
  END IF;

  IF OLD.prescription_type IS DISTINCT FROM NEW.prescription_type THEN
    RAISE EXCEPTION 'Imutabilidade CFM: prescription_type não pode mudar após status=%.', OLD.status
      USING ERRCODE = 'check_violation';
  END IF;

  IF OLD.digital_signature IS DISTINCT FROM NEW.digital_signature
     OR OLD.signature_certificate IS DISTINCT FROM NEW.signature_certificate
     OR OLD.signature_timestamp IS DISTINCT FROM NEW.signature_timestamp
     OR OLD.iti_validation_code IS DISTINCT FROM NEW.iti_validation_code
     OR OLD.iti_validation_url IS DISTINCT FROM NEW.iti_validation_url
     OR OLD.iti_qr_code IS DISTINCT FROM NEW.iti_qr_code THEN
    RAISE EXCEPTION 'Imutabilidade CFM: assinatura digital ICP-Brasil é imutável após status=%.', OLD.status
      USING ERRCODE = 'check_violation';
  END IF;

  -- Whitelist permitida (sem alterar campos protegidos):
  --   status (transição: signed→sent, signed→cancelled, sent→validated)
  --   sent_at, email_sent_at, sms_sent_at, sent_via_email, sent_via_sms
  --   updated_at (auto)
  --   metadata (jsonb pra audit trail)
  --   document_level (raro mas permitido pra reclassificação)
  --   expires_at (extensão de validade pra contexto especial)
  --
  -- Tudo que não esteja explicitamente protegido acima passa.

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_cfm_prescriptions_immutability ON public.cfm_prescriptions;

CREATE TRIGGER trg_cfm_prescriptions_immutability
  BEFORE UPDATE ON public.cfm_prescriptions
  FOR EACH ROW
  EXECUTE FUNCTION public.fn_cfm_prescriptions_immutability();

COMMENT ON FUNCTION public.fn_cfm_prescriptions_immutability() IS
  'V1.9.180 — Defesa CFM 2.314/2022. Drafts livres, signed/sent/validated imutáveis exceto whitelist (status, sent_*). Bypassa quando service_role (Edge digital-signature draft→signed).';

COMMENT ON TRIGGER trg_cfm_prescriptions_immutability ON public.cfm_prescriptions IS
  'V1.9.180 — Lock anti-fraude. Médico não consegue alterar medicações/paciente/cert de prescription assinada via UPDATE direto.';
