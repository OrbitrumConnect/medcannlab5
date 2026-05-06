-- ==============================================================================
-- V1.9.152 — book_appointment_atomic lê consultation_fee_default (LIGAÇÃO 2 de 6)
-- ==============================================================================
--
-- Antes: appointments.price ficava NULL → trigger tg_appointment_to_transaction
--        usava fallback R$ 200 fixo pra TODOS os médicos.
-- Depois: lê users.consultation_fee_default do profissional e seta price.
--
-- Camadas existentes (INTOCÁVEIS):
--   ✅ Lock advisory transaction (V1.9.97-C)
--   ✅ Double-booking protection
--   ✅ scheduling_audit_log
--   ✅ Status='scheduled' default
--
-- Aplicado empíricamente em produção 06/05/2026 ~11:35 BRT via PAT Pedro.
-- Validado: appointment R$ 700 → trigger gerou wallet_tx amount=700 ✓.
-- ==============================================================================

CREATE OR REPLACE FUNCTION public.book_appointment_atomic(
    p_patient_id uuid,
    p_professional_id uuid,
    p_start_time timestamp with time zone,
    p_type text,
    p_notes text DEFAULT NULL::text
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'extensions'
AS $function$
DECLARE
    v_appt_id UUID;
    v_lock_key BIGINT;
    v_conflict_count INTEGER;
    v_fee NUMERIC(12,2);  -- V1.9.152: preço lido de users.consultation_fee_default
BEGIN
    IF p_start_time <= now() THEN
        RAISE EXCEPTION 'Slot inválido: horário já passou (V1.9.97-C)';
    END IF;

    v_lock_key := ('x' || substr(encode(digest(p_professional_id::text || p_start_time::text, 'sha256'), 'hex'), 1, 16))::bit(64)::bigint;
    PERFORM pg_advisory_xact_lock(v_lock_key);

    SELECT COUNT(*) INTO v_conflict_count
    FROM public.appointments
    WHERE professional_id = p_professional_id
      AND appointment_date = p_start_time
      AND status IN ('scheduled', 'confirmed');

    IF v_conflict_count > 0 THEN
        RAISE EXCEPTION 'Slot no longer available (Double Booking Protection)';
    END IF;

    -- V1.9.152: lê preço configurado pelo profissional (NULL se não definido)
    SELECT consultation_fee_default INTO v_fee
    FROM public.users
    WHERE id = p_professional_id;

    INSERT INTO public.appointments (
        patient_id, professional_id, appointment_date, status, title, description, price
    ) VALUES (
        p_patient_id, p_professional_id, p_start_time, 'scheduled', 'Consulta ' || p_type, p_notes, v_fee
    ) RETURNING id INTO v_appt_id;

    INSERT INTO public.scheduling_audit_log (actor_id, action, professional_id, start_time, status)
    VALUES (auth.uid(), 'BOOK_ATTEMPT', p_professional_id, p_start_time, 'SUCCESS');

    RETURN v_appt_id;
END;
$function$;
