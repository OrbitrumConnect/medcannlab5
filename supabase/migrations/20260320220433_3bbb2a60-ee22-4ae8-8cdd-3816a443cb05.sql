-- Drop função antiga (parâmetro era p_slot_time, agora é p_start_time)
DROP FUNCTION IF EXISTS public.book_appointment_atomic(uuid, uuid, timestamptz, text, text);

-- Recriar com fix de timezone (sem AT TIME ZONE 'UTC')
CREATE OR REPLACE FUNCTION public.book_appointment_atomic(
    p_patient_id UUID,
    p_professional_id UUID,
    p_start_time TIMESTAMPTZ,
    p_type TEXT,
    p_notes TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_appt_id UUID;
    v_lock_key BIGINT;
    v_conflict_count INTEGER;
BEGIN
    -- FIX: TIMESTAMPTZ já armazena em UTC internamente
    -- NÃO usar "AT TIME ZONE 'UTC'" que causava shift de -3h no Brasil
    
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

    INSERT INTO public.appointments (
        patient_id, professional_id, appointment_date, status, title, description
    ) VALUES (
        p_patient_id, p_professional_id, p_start_time, 'scheduled', 'Consulta ' || p_type, p_notes
    ) RETURNING id INTO v_appt_id;

    INSERT INTO public.scheduling_audit_log (actor_id, action, professional_id, start_time, status)
    VALUES (auth.uid(), 'BOOK_ATTEMPT', p_professional_id, p_start_time, 'SUCCESS');

    RETURN v_appt_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.book_appointment_atomic TO authenticated;
GRANT EXECUTE ON FUNCTION public.book_appointment_atomic TO service_role;