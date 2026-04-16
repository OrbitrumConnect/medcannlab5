-- ============================================================================
-- 🧹 SPRINT 0: LIMPEZA DE DADOS & ENGINE DE AGENDA MEDCANNLAB PRIME
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. CORREÇÃO DE PROFISSIONAIS E PACIENTES (TIPAGEM)
-- ----------------------------------------------------------------------------
UPDATE public.users 
SET type = 'professional' 
WHERE type IN ('profissional', 'médico', 'medico');

UPDATE public.users 
SET type = 'patient' 
WHERE type = 'paciente' OR type IS NULL;

-- ----------------------------------------------------------------------------
-- 2. HABILITAR EXTENSÃO DE RANGE DO POSTGRES
-- ----------------------------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS btree_gist;

-- ----------------------------------------------------------------------------
-- 3. CRIAR CONCEITO DE SLOT DE TEMPO EXPLÍCITO
-- ----------------------------------------------------------------------------
ALTER TABLE public.appointments ADD COLUMN IF NOT EXISTS slot_start timestamptz;
ALTER TABLE public.appointments ADD COLUMN IF NOT EXISTS slot_end timestamptz;

UPDATE public.appointments 
SET slot_start = appointment_date,
    slot_end = appointment_date + (COALESCE(duration, 60) * interval '1 minute')
WHERE slot_start IS NULL;

-- ----------------------------------------------------------------------------
-- 4. GATILHO PARA SEMPRE POPULAR SLOT_START E SLOT_END (Retrocompatibilidade)
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION compute_appointment_slots()
RETURNS trigger AS $$
BEGIN
  NEW.slot_start = NEW.appointment_date;
  NEW.slot_end = NEW.appointment_date + (COALESCE(NEW.duration, 60) * interval '1 minute');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_compute_slots ON public.appointments;

CREATE TRIGGER trigger_compute_slots
BEFORE INSERT OR UPDATE ON public.appointments
FOR EACH ROW
EXECUTE FUNCTION compute_appointment_slots();

-- ----------------------------------------------------------------------------
-- 5. FAXINA INTELIGENTE EM SOBREPOSIÇÕES REAIS (COM DESEMPATE MESTRE)
-- A alteração mágica: Lida com inserts criados no MESMO milissegundo de teste,
-- utilizando o próprio ID (uuid) para desempatar e garantir que um vença.
-- Sem DELETAR o dado, porque saúde não apaga prontuário.
-- ----------------------------------------------------------------------------
WITH conflitos AS (
  SELECT a1.id
  FROM public.appointments a1
  JOIN public.appointments a2
    ON a1.professional_id = a2.professional_id
   AND a1.id <> a2.id
   AND tstzrange(a1.slot_start, a1.slot_end) && tstzrange(a2.slot_start, a2.slot_end)
   AND (
     a1.created_at > a2.created_at OR 
     (a1.created_at = a2.created_at AND a1.id > a2.id)
   )
  WHERE a1.status = 'scheduled'
    AND a2.status = 'scheduled'
)
UPDATE public.appointments
SET status = 'cancelled',
    notes = 'Cancelado via faxina de interseção extrema (Desempate por ID)'
WHERE id IN (SELECT id FROM conflitos);

-- ----------------------------------------------------------------------------
-- 6. ÍNDICE AUXILIAR DE PERFORMANCE (LEITURA RÁPIDA)
-- ----------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_appointments_professional_time
ON public.appointments (professional_id, slot_start, slot_end);

-- ----------------------------------------------------------------------------
-- 7. O CADEADO DE EXCLUSÃO CIRÚRGICA (TRAVA GIST)
-- Impede interseção de intervalos em nível de Banco.
-- ----------------------------------------------------------------------------
ALTER TABLE public.appointments DROP CONSTRAINT IF EXISTS no_overlapping_appointments;

ALTER TABLE public.appointments 
ADD CONSTRAINT no_overlapping_appointments 
EXCLUDE USING gist (
  professional_id WITH =, 
  tstzrange(slot_start, slot_end) WITH &&
)
WHERE (status = 'scheduled');

-- MEDCANNLAB BLINDADO. 🚀
