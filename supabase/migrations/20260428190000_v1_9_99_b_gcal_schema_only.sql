-- Migration: V1.9.99-B — gcal infraestrutura BANCO ONLY (FASE 1)
-- Data: 28/04/2026 ~19h BRT
--
-- Contexto: feature Google Calendar integration foi DESENHADA em 16/04
-- (sprint_1_gcal_setup.sql na raiz) mas nunca aplicada por causa do
-- desvio kevlar 16/04. Edges google-auth + sync-gcal estão deployadas
-- (v17 ACTIVE) mas sem tabelas → falham silenciosamente.
--
-- Audit empírico 28/04: 100% confirmado que diário bate com Supabase.
-- Veredito GPT review: "primeiro corpo, depois ligar, depois endurecer borda"
--
-- ESTA MIGRATION (FASE 1 mínima):
--   ✅ Cria tabelas + colunas + function + trigger (com guard)
--   ❌ NÃO altera verify_jwt das Edges
--   ❌ NÃO cria cron sync-gcal
--   ❌ NÃO toca OAuth flow / frontend
--
-- Resultado: "sistema invisível seguro" — infra pronta mas sem canal
-- de ativação. Trigger criado mas inerte (guard EXISTS impede enqueue
-- quando médico não tem integração).
--
-- FASE 2 (próxima sessão): Edge fixes + cron + OAuth UI + verify_jwt.

BEGIN;

-- ────────────────────────────────────────────────────────────────────
-- 1. TABELA professional_integrations (cofre OAuth)
-- ────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.professional_integrations (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  professional_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  provider        text NOT NULL DEFAULT 'google',
  access_token    text NOT NULL,   -- criptografado AES-GCM (_shared/crypto.ts)
  refresh_token   text NOT NULL,   -- criptografado AES-GCM
  expiry_date     timestamp with time zone NOT NULL,
  created_at      timestamp with time zone DEFAULT now(),
  updated_at      timestamp with time zone DEFAULT now(),
  UNIQUE (professional_id, provider)  -- 1 integração por (médico, provider)
);

CREATE INDEX IF NOT EXISTS idx_prof_integrations_professional_id
  ON public.professional_integrations(professional_id);

ALTER TABLE public.professional_integrations ENABLE ROW LEVEL SECURITY;

-- RLS: cada médico gerencia apenas suas próprias integrações
-- Edge Functions usam service_role (bypassa RLS — sync server-side)
DO $$ BEGIN
  CREATE POLICY "Medicos gerenciam suas integracoes"
    ON public.professional_integrations
    FOR ALL
    USING (auth.uid() = professional_id);
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- ────────────────────────────────────────────────────────────────────
-- 2. AJUSTE appointments (idempotência + log de sync gcal)
-- ────────────────────────────────────────────────────────────────────
-- meeting_url JÁ EXISTE (descoberto no audit empírico 28/04) — IF NOT EXISTS cobre
ALTER TABLE public.appointments ADD COLUMN IF NOT EXISTS gcal_event_id text;
ALTER TABLE public.appointments ADD COLUMN IF NOT EXISTS meeting_url text;
ALTER TABLE public.appointments ADD COLUMN IF NOT EXISTS gcal_last_sync_at timestamp with time zone;
ALTER TABLE public.appointments ADD COLUMN IF NOT EXISTS gcal_sync_status text DEFAULT 'pending';

-- ────────────────────────────────────────────────────────────────────
-- 3. TABELA integration_jobs (outbox pattern)
-- ────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.integration_jobs (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type         text NOT NULL,    -- 'gcal_sync' (futuros: outras integrações)
  payload      jsonb NOT NULL,
  status       text DEFAULT 'pending',  -- pending / processing / done / error
  retries      int DEFAULT 0,
  last_error   text,
  next_run_at  timestamp with time zone DEFAULT now(),
  created_at   timestamp with time zone DEFAULT now(),
  updated_at   timestamp with time zone DEFAULT now()
);

-- Index parcial otimiza query de sweep (cron pega só pending+due)
CREATE INDEX IF NOT EXISTS idx_integration_jobs_pending_due
  ON public.integration_jobs(next_run_at)
  WHERE status = 'pending';

ALTER TABLE public.integration_jobs ENABLE ROW LEVEL SECURITY;

-- RLS: jobs são internos (Edge Functions usam service_role).
-- Admins podem ver pra debugging.
DO $$ BEGIN
  CREATE POLICY "Admins veem todos jobs"
    ON public.integration_jobs
    FOR SELECT
    USING (is_admin());
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- ────────────────────────────────────────────────────────────────────
-- 4. FUNCTION enqueue_gcal_job (COM GUARD anti-fila-suja)
-- ────────────────────────────────────────────────────────────────────
-- Diferença vs sprint_1.sql original (16/04):
--   sprint_1 criava JOB pra TODO appointment INSERT/UPDATE
--   → fila enchia de jobs falhando pra médicos sem integração Google
--
-- V1.9.99-B adiciona guard EXISTS professional_integrations:
--   só enfileira se médico TEM integração Google ativa
--   → fila limpa, jobs só pra quem tem fluxo conectado
CREATE OR REPLACE FUNCTION public.enqueue_gcal_job()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- GUARD: só enfileirar se médico tem integração Google ativa
  -- Evita fila com 5x retries por médico sem Google conectado
  IF NEW.professional_id IS NULL THEN
    RETURN NEW;  -- appointment sem médico → ignora
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM public.professional_integrations
    WHERE professional_id = NEW.professional_id
      AND provider = 'google'
  ) THEN
    RETURN NEW;  -- médico não tem Google conectado → ignora silenciosamente
  END IF;

  -- INSERT: agenda criação
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.integration_jobs (type, payload)
    VALUES (
      'gcal_sync',
      jsonb_build_object(
        'appointment_id', NEW.id,
        'action', 'create_or_update'
      )
    );

  -- UPDATE: só re-enfileirar se status='cancelled' OU horário mudou
  ELSIF TG_OP = 'UPDATE' THEN
    IF NEW.status = 'cancelled'
       OR NEW.appointment_date IS DISTINCT FROM OLD.appointment_date
       OR NEW.slot_start IS DISTINCT FROM OLD.slot_start
       OR NEW.slot_end IS DISTINCT FROM OLD.slot_end
    THEN
      INSERT INTO public.integration_jobs (type, payload)
      VALUES (
        'gcal_sync',
        jsonb_build_object(
          'appointment_id', NEW.id,
          'action', CASE WHEN NEW.status = 'cancelled' THEN 'delete' ELSE 'patch' END
        )
      );
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

-- ────────────────────────────────────────────────────────────────────
-- 5. TRIGGER em appointments
-- ────────────────────────────────────────────────────────────────────
-- Comportamento esperado AGORA (sem médicos com integração):
--   - Trigger dispara em todo INSERT/UPDATE de appointments
--   - Guard EXISTS retorna NEW imediatamente (zero jobs criados)
--   - Zero impacto operacional
--
-- Quando primeiro médico conectar Google (FASE 2):
--   - Trigger automaticamente passa a enfileirar para ele
--   - Cron sync-gcal (FASE 2) processa fila
DROP TRIGGER IF EXISTS trigger_enqueue_gcal ON public.appointments;

CREATE TRIGGER trigger_enqueue_gcal
  AFTER INSERT OR UPDATE ON public.appointments
  FOR EACH ROW
  EXECUTE FUNCTION public.enqueue_gcal_job();

COMMIT;

-- ────────────────────────────────────────────────────────────────────
-- SMOKE TESTS POST-APLICAÇÃO (rodar separadamente):
-- ────────────────────────────────────────────────────────────────────
-- 1. Tabelas existem:
--    SELECT table_name FROM information_schema.tables
--     WHERE table_schema='public'
--       AND table_name IN ('professional_integrations', 'integration_jobs');
--    Esperado: 2 rows
--
-- 2. Colunas appointments existem:
--    SELECT column_name FROM information_schema.columns
--     WHERE table_schema='public' AND table_name='appointments'
--       AND column_name IN ('gcal_event_id', 'gcal_last_sync_at',
--                            'gcal_sync_status', 'meeting_url');
--    Esperado: 4 rows
--
-- 3. Function + trigger existem:
--    SELECT proname FROM pg_proc WHERE proname='enqueue_gcal_job';
--    SELECT trigger_name FROM information_schema.triggers
--     WHERE event_object_table='appointments' AND trigger_name='trigger_enqueue_gcal';
--    Esperado: 1 row cada
--
-- 4. CRÍTICO — guard funciona (zero jobs criados pra médico sem integração):
--    BEGIN;
--    INSERT INTO public.appointments (patient_id, professional_id, doctor_id, title,
--      appointment_date, status, type, is_remote)
--    VALUES ('d5e01ead-...', '2135f0c0-...', '2135f0c0-...',
--      'SMOKE V1.9.99-B GUARD', now() + interval '1h', 'scheduled', 'consultation', true);
--    SELECT COUNT(*) FROM public.integration_jobs;  -- Esperado: 0 (Ricardo não tem Google)
--    ROLLBACK;
