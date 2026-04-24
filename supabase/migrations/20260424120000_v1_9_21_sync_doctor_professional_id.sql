-- V1.9.21 — Sync trigger doctor_id ↔ professional_id
--
-- Contexto: tabelas appointments, clinical_reports, clinical_kpis têm duas
-- colunas legadas representando o mesmo conceito (doctor_id e professional_id).
-- Padrão moderno usa professional_id; doctor_id é legado mantido por
-- retrocompatibilidade com código antigo.
--
-- Bug V1.9.13 (04/2026) mostrou como a divergência quebra silenciosamente:
-- frontend escrevia em professional_id, trigger de monetização lia doctor_id
-- (NULL) → violation de NOT NULL em wallet_transactions.professional_id.
--
-- Esta migration:
-- 1. Backfill controlado: preenche ambas colunas sempre que uma estiver NULL
--    ou quando divergirem.
-- 2. Instala função sync_doctor_professional_id com 3 casos:
--    a) ambos NULL → deixa passar
--    b) apenas um preenchido → copia para o outro
--    c) ambos preenchidos e divergentes → professional_id manda, RAISE LOG
-- 3. Aplica 3 triggers BEFORE INSERT/UPDATE nas tabelas afetadas.
--
-- Validado em prod 2026-04-24 com 3 cenários:
--   T1 (só prof_id) → doctor_id preenchido ✓
--   T2 (só doctor_id) → professional_id preenchido ✓
--   T3 (divergentes A vs B) → ambos viraram B (professional_id) ✓
--
-- Reversível via: DROP TRIGGER ... + DROP FUNCTION sync_doctor_professional_id.

-- 1. Backfill
UPDATE public.appointments
   SET professional_id = COALESCE(professional_id, doctor_id),
       doctor_id = COALESCE(doctor_id, professional_id)
 WHERE professional_id IS NULL
    OR doctor_id IS NULL
    OR professional_id <> doctor_id;

UPDATE public.clinical_reports
   SET professional_id = COALESCE(professional_id, doctor_id),
       doctor_id = COALESCE(doctor_id, professional_id)
 WHERE professional_id IS NULL
    OR doctor_id IS NULL
    OR professional_id <> doctor_id;

UPDATE public.clinical_kpis
   SET professional_id = COALESCE(professional_id, doctor_id),
       doctor_id = COALESCE(doctor_id, professional_id)
 WHERE professional_id IS NULL
    OR doctor_id IS NULL
    OR professional_id <> doctor_id;

-- 2. Função
CREATE OR REPLACE FUNCTION public.sync_doctor_professional_id()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $fn$
BEGIN
  -- Caso 1: ambos NULL — não inventa dado.
  IF NEW.doctor_id IS NULL AND NEW.professional_id IS NULL THEN
    RETURN NEW;
  END IF;

  -- Caso 2: apenas um preenchido — copia para o outro.
  IF NEW.doctor_id IS NULL THEN
    NEW.doctor_id := NEW.professional_id;
  ELSIF NEW.professional_id IS NULL THEN
    NEW.professional_id := NEW.doctor_id;

  -- Caso 3: ambos preenchidos e divergentes — professional_id é fonte de verdade.
  -- RAISE LOG para observabilidade (aparece em Postgres logs sem virar alerta).
  ELSIF NEW.doctor_id <> NEW.professional_id THEN
    RAISE LOG 'sync_doctor_professional_id: divergence on %.% (doctor_id=%, professional_id=%). Forcing professional_id as source of truth.',
      TG_TABLE_SCHEMA, TG_TABLE_NAME, NEW.doctor_id, NEW.professional_id;
    NEW.doctor_id := NEW.professional_id;
  END IF;

  RETURN NEW;
END;
$fn$;

-- 3. Triggers
DROP TRIGGER IF EXISTS sync_ids_appointments ON public.appointments;
CREATE TRIGGER sync_ids_appointments
  BEFORE INSERT OR UPDATE ON public.appointments
  FOR EACH ROW EXECUTE FUNCTION public.sync_doctor_professional_id();

DROP TRIGGER IF EXISTS sync_ids_clinical_reports ON public.clinical_reports;
CREATE TRIGGER sync_ids_clinical_reports
  BEFORE INSERT OR UPDATE ON public.clinical_reports
  FOR EACH ROW EXECUTE FUNCTION public.sync_doctor_professional_id();

DROP TRIGGER IF EXISTS sync_ids_clinical_kpis ON public.clinical_kpis;
CREATE TRIGGER sync_ids_clinical_kpis
  BEFORE INSERT OR UPDATE ON public.clinical_kpis
  FOR EACH ROW EXECUTE FUNCTION public.sync_doctor_professional_id();
