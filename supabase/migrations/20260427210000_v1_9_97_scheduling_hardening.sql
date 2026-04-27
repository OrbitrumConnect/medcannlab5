-- V1.9.97 — Scheduling hardening (3 fixes em 1 migration)
-- Aplicado em 27/04/2026 ~21h BRT após audit horizontal RLS + investigação
-- do bug "agendamento Carolina não persistiu" (scheduling_audit_log vazio).
--
-- FIXES:
-- A) src/components/NoaConversationalInterface.tsx — parsing handleBooking
--    (commit no front, NÃO neste arquivo SQL — apenas referenciado)
-- B) RPC book_appointment_atomic — rejeita slot no passado (defesa em runtime)
-- C) RPC get_available_slots_v3 — filtra slots passados antes de retornar
-- D) RLS prescriptions — fecha vulnerabilidade ALL aberta pra paciente
--    (separa em INSERT/UPDATE/DELETE específicos por role)
--
-- Validação pré-aplicação:
-- - Front NÃO usa from('prescriptions') em INSERT/UPDATE/DELETE — confirmado via grep
-- - Bookings existentes não afetados pelos fixes B/C (só novos)
-- - chat-images não tocado nesta migration (precisa decisão arquitetural)
-- - timezone na agenda não tocado nesta migration (precisa decisão arquitetural)

-- ============================================================
-- V1.9.97-C — get_available_slots_v3: filtrar slots passados
-- ============================================================
CREATE OR REPLACE FUNCTION public.get_available_slots_v3(
    p_professional_id uuid,
    p_start_date date,
    p_end_date date
)
RETURNS TABLE(slot_start timestamp with time zone, slot_end timestamp with time zone, rule_id uuid, is_available boolean)
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
    RETURN QUERY
    WITH availability AS (
        SELECT
            (d + pa.start_time)::TIMESTAMPTZ as base_start,
            (d + pa.end_time)::TIMESTAMPTZ as base_end,
            pa.slot_duration,
            COALESCE(pa.slot_interval_minutes, pa.slot_duration) as effective_interval
        FROM generate_series(p_start_date, p_end_date, '1 day'::interval) d
        JOIN professional_availability pa ON pa.professional_id = p_professional_id
        WHERE pa.day_of_week = EXTRACT(DOW FROM d)::INTEGER AND pa.is_active = true
    ),
    raw_slots AS (
        SELECT
            generate_series(base_start, base_end - (slot_duration || ' minutes')::interval, (effective_interval || ' minutes')::interval) as s_start,
            slot_duration
        FROM availability
    )
    SELECT s_start, s_start + (slot_duration || ' minutes')::interval, NULL::UUID, TRUE
    FROM raw_slots rs
    WHERE rs.s_start > now()  -- V1.9.97-C: filtra slots no passado
      AND NOT EXISTS (
        SELECT 1 FROM time_blocks tb
        WHERE tb.professional_id = p_professional_id
          AND (tb.start_at, tb.end_at) OVERLAPS (rs.s_start, rs.s_start + (rs.slot_duration || ' minutes')::interval)
      )
      AND NOT EXISTS (
        SELECT 1 FROM appointments a
        WHERE a.professional_id = p_professional_id
          AND a.status IN ('scheduled', 'confirmed')
          AND (a.appointment_date, a.appointment_date + (rs.slot_duration || ' minutes')::interval) OVERLAPS (rs.s_start, rs.s_start + (rs.slot_duration || ' minutes')::interval)
      );
END;
$function$;

-- ============================================================
-- V1.9.97-C — book_appointment_atomic: rejeitar slot no passado
-- ============================================================
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
BEGIN
    -- V1.9.97-C: defesa em profundidade — rejeita booking retroativo
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

    INSERT INTO public.appointments (
        patient_id, professional_id, appointment_date, status, title, description
    ) VALUES (
        p_patient_id, p_professional_id, p_start_time, 'scheduled', 'Consulta ' || p_type, p_notes
    ) RETURNING id INTO v_appt_id;

    INSERT INTO public.scheduling_audit_log (actor_id, action, professional_id, start_time, status)
    VALUES (auth.uid(), 'BOOK_ATTEMPT', p_professional_id, p_start_time, 'SUCCESS');

    RETURN v_appt_id;
END;
$function$;

-- ============================================================
-- V1.9.97-D — RLS prescriptions: fecha vulnerabilidade ALL aberta
-- ============================================================
-- ANTES: policy "Profissionais gerenciam prescricoes vinculadas" tinha cmd=ALL
-- com qual: (auth.uid() = patient_id) OR admin OR (profissional vinculado).
-- A primeira condição permitia paciente fazer INSERT/UPDATE/DELETE em prescrições
-- onde ele era patient_id — risco CFM direto (automedicação registrada).
--
-- DEPOIS: separa em policies cmd-específicas. Paciente continua vendo próprias
-- prescrições (SELECT preservado), mas só profissional vinculado ou admin
-- pode INSERT/UPDATE. DELETE só admin.
--
-- Validado: front NÃO usa from('prescriptions') em INSERT/UPDATE/DELETE.
-- Modificações reais usam patient_prescriptions e cfm_prescriptions.

DROP POLICY IF EXISTS "Profissionais gerenciam prescricoes vinculadas" ON public.prescriptions;

CREATE POLICY "Apenas profissional vinculado ou admin insere prescricao"
ON public.prescriptions
FOR INSERT
TO authenticated
WITH CHECK (
    has_role(auth.uid(), 'admin'::app_role)
    OR (has_role(auth.uid(), 'profissional'::app_role) AND check_professional_patient_link(patient_id))
);

CREATE POLICY "Apenas profissional vinculado ou admin atualiza prescricao"
ON public.prescriptions
FOR UPDATE
TO authenticated
USING (
    has_role(auth.uid(), 'admin'::app_role)
    OR (has_role(auth.uid(), 'profissional'::app_role) AND check_professional_patient_link(patient_id))
)
WITH CHECK (
    has_role(auth.uid(), 'admin'::app_role)
    OR (has_role(auth.uid(), 'profissional'::app_role) AND check_professional_patient_link(patient_id))
);

CREATE POLICY "Apenas admin deleta prescricao"
ON public.prescriptions
FOR DELETE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- Policy "Pacientes veem suas prescricoes" (SELECT auth.uid() = patient_id)
-- preservada — paciente continua vendo próprias prescrições.
