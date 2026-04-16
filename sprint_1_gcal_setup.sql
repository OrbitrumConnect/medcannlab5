-- ============================================================================
-- 🚀 SPRINT 1: GOOGLE CALENDAR MULTIPESSOAL E FILA ISOLADA
-- ============================================================================
-- Execute este script completo no seu "SQL Editor" do Supabase.

-- ----------------------------------------------------------------------------
-- 1. TABELA DE CREDENCIAIS OAUTH (COFRE)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.professional_integrations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  professional_id uuid REFERENCES public.users(id) ON DELETE CASCADE,
  provider text NOT NULL DEFAULT 'google',
  access_token text NOT NULL, -- Guardado via Crypto Nativo Deno
  refresh_token text NOT NULL, -- Guardado via Crypto Nativo Deno
  expiry_date timestamp with time zone NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Segurança Extrema: Apenas o próprio médico pode ler/apagar sua conexão. Edge Functions lidam nos panos de fundo como `service_role`.
ALTER TABLE public.professional_integrations ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "Medicos gerenciam suas integracoes"
    ON public.professional_integrations
    FOR ALL
    USING (auth.uid() = professional_id);
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- ----------------------------------------------------------------------------
-- 2. AJUSTE NA TABELA DE AGENDAMENTOS (IDEMPOTÊNCIA E LOG)
-- ----------------------------------------------------------------------------
-- Adiciona colunas se elas não existirem
ALTER TABLE public.appointments ADD COLUMN IF NOT EXISTS gcal_event_id text;
ALTER TABLE public.appointments ADD COLUMN IF NOT EXISTS meeting_url text;
ALTER TABLE public.appointments ADD COLUMN IF NOT EXISTS gcal_last_sync_at timestamp with time zone;
ALTER TABLE public.appointments ADD COLUMN IF NOT EXISTS gcal_sync_status text DEFAULT 'pending';

-- ----------------------------------------------------------------------------
-- 3. FILA DE PROCESSAMENTO (OUTBOX PATTERN / JOBS)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.integration_jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type text NOT NULL, -- 'gcal_sync'
  payload jsonb NOT NULL,
  status text DEFAULT 'pending', -- 'pending', 'processing', 'done', 'error'
  retries int DEFAULT 0,
  last_error text,
  next_run_at timestamp with time zone DEFAULT now(), -- Vital para o Backoff de Erros
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- ----------------------------------------------------------------------------
-- 4. TRIGGER INTELIGENTE DE CAPTAÇÃO
-- ----------------------------------------------------------------------------
-- Função que joga a "Ficha de Trabalho" na fila assim que a UI salva a consulta
CREATE OR REPLACE FUNCTION enqueue_gcal_job()
RETURNS trigger AS $$
BEGIN
  -- Se foi RECÉM criado, agenda o Job
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.integration_jobs (type, payload)
    VALUES (
      'gcal_sync',
      jsonb_build_object(
        'appointment_id', NEW.id,
        'action', 'create_or_update'
      )
    );
  
  -- Se o horário mudou ou a consulta foi cancelada, agenda o Job com prioridade
  ELSIF TG_OP = 'UPDATE' THEN
    -- Manda a ordem (Edge lida com os deletes ou patches no calendário)
    IF NEW.status = 'cancelled' OR NEW.appointment_date IS DISTINCT FROM OLD.appointment_date THEN
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
$$ LANGUAGE plpgsql;

-- O Gatilho no banco (Se já existir dropa pra atualizar a lógica)
DROP TRIGGER IF EXISTS trigger_enqueue_gcal ON public.appointments;

CREATE TRIGGER trigger_enqueue_gcal
AFTER INSERT OR UPDATE ON public.appointments
FOR EACH ROW
EXECUTE FUNCTION enqueue_gcal_job();

-- FIM DA PREPARAÇÃO DE BANCO DE DADOS. 🚀
