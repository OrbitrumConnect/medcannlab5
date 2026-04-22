
-- =============================================================
-- FIX 1: Trigger só popula slots se não foram informados
-- =============================================================
CREATE OR REPLACE FUNCTION public.compute_appointment_slots()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  -- Só calcula automaticamente se quem chamou não informou slot custom.
  -- Isso permite encaixes manuais, telemedicina com janela diferente, etc.
  IF NEW.slot_start IS NULL THEN
    NEW.slot_start := NEW.appointment_date;
  END IF;

  IF NEW.slot_end IS NULL THEN
    NEW.slot_end := NEW.appointment_date
      + (COALESCE(NEW.duration, 60) * interval '1 minute');
  END IF;

  RETURN NEW;
END;
$$;

-- =============================================================
-- FIX 2 + 3: Constraint blindada contra NULL + range explícito '[)'
-- =============================================================
ALTER TABLE public.appointments
  DROP CONSTRAINT IF EXISTS no_overlapping_appointments;

ALTER TABLE public.appointments
  ADD CONSTRAINT no_overlapping_appointments
  EXCLUDE USING gist (
    professional_id WITH =,
    tstzrange(slot_start, slot_end, '[)') WITH &&
  )
  WHERE (
    status = 'scheduled'
    AND slot_start IS NOT NULL
    AND slot_end IS NOT NULL
  );

-- =============================================================
-- FIX 4: Índice btree redundante removido
-- (o EXCLUDE constraint já cria índice GIST otimizado para overlap)
-- =============================================================
DROP INDEX IF EXISTS public.idx_appointments_professional_time;
