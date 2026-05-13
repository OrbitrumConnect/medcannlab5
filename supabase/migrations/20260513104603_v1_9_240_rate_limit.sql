-- V1.9.240 — Rate limit infra (B1 do plano lead_free SEO 03/05)
-- Data: 13/05/2026 ~10h45 BRT
--
-- Contexto: Edge `tradevision-core` ja recebe trafego de bots/scanners
-- (logs mostram '[SECURITY V1.9.59] Request sem JWT valido — rejeitando').
-- Pre-evento quinta 15/05 (~20 testers) + pre-SEO publico: precisa proteger
-- custo (~$0.015/turn empirico V1.9.238) contra spam/loop.
--
-- Stack: Supabase tabela + RPC atomica (Principio 8 — polir nao inventar
-- com Redis). Latencia 30-50ms aceitavel perto de inferencia GPT 5-7s.
--
-- 5 ajustes pre-selar (GPT externo 13/05):
--   1. updated_at na tabela bucket
--   2. remaining no retorno RPC
--   3. Jitter no Retry-After (Edge)
--   4. Indices em expires_at e events.created_at
--   5. Sanitize x-forwarded-for (Edge)

-- ====================================================================
-- A) BUCKETS (estado atual por key)
-- ====================================================================
CREATE TABLE IF NOT EXISTS public.rate_limit_buckets (
  key          text PRIMARY KEY,
  count        int  NOT NULL DEFAULT 1,
  window_start timestamptz NOT NULL DEFAULT now(),
  expires_at   timestamptz NOT NULL,
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now() -- AJUSTE 1: debug operacional
);

-- AJUSTE 4: indice em expires_at pra cleanup escalar
CREATE INDEX IF NOT EXISTS idx_rate_limit_buckets_expires_at
  ON public.rate_limit_buckets(expires_at);

ALTER TABLE public.rate_limit_buckets ENABLE ROW LEVEL SECURITY;
-- Sem policies = bloqueado pra todos exceto service_role (Edge usa service)

COMMENT ON TABLE public.rate_limit_buckets IS
  'V1.9.240: token buckets rate limit. key formato "user:UUID:reason" ou "ip:IP:reason". '
  'Edge tradevision-core consulta via RPC rate_limit_check.';

-- ====================================================================
-- B) EVENTS (log de bloqueios — dataset de abuso futuro)
-- ====================================================================
CREATE TABLE IF NOT EXISTS public.rate_limit_events (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      uuid,
  ip           text,
  bucket_key   text NOT NULL,
  reason       text NOT NULL,    -- 'minute_limit' / 'quarter_limit' / 'daily_limit'
  count        int  NOT NULL,
  limit_value  int  NOT NULL,
  endpoint     text NOT NULL DEFAULT 'tradevision-core',
  created_at   timestamptz NOT NULL DEFAULT now()
);

-- AJUSTE 4: indice descendente pra analytics recente
CREATE INDEX IF NOT EXISTS idx_rate_limit_events_created_at
  ON public.rate_limit_events(created_at DESC);

ALTER TABLE public.rate_limit_events ENABLE ROW LEVEL SECURITY;

COMMENT ON TABLE public.rate_limit_events IS
  'V1.9.240: dataset de abuso. Cada row = 1 bloqueio. Base pra score adaptativo pos-PMF.';

-- ====================================================================
-- C) RPC ATOMICA pra check + increment
-- ====================================================================
CREATE OR REPLACE FUNCTION public.rate_limit_check(
  p_key             text,
  p_window_seconds  int,
  p_max_count       int
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_count          int;
  v_window_expires timestamptz;
  v_allowed        boolean;
  v_remaining      int;
  v_retry_after    int;
BEGIN
  -- UPSERT atomico: reset window se expirado, senao incrementa
  INSERT INTO public.rate_limit_buckets (key, count, window_start, expires_at)
  VALUES (p_key, 1, now(), now() + (p_window_seconds || ' seconds')::interval)
  ON CONFLICT (key) DO UPDATE SET
    count = CASE
      WHEN public.rate_limit_buckets.expires_at <= now() THEN 1
      ELSE public.rate_limit_buckets.count + 1
    END,
    window_start = CASE
      WHEN public.rate_limit_buckets.expires_at <= now() THEN now()
      ELSE public.rate_limit_buckets.window_start
    END,
    expires_at = CASE
      WHEN public.rate_limit_buckets.expires_at <= now() THEN now() + (p_window_seconds || ' seconds')::interval
      ELSE public.rate_limit_buckets.expires_at
    END,
    updated_at = now() -- AJUSTE 1
  RETURNING count, expires_at INTO v_count, v_window_expires;

  v_allowed     := v_count <= p_max_count;
  v_remaining   := GREATEST(0, p_max_count - v_count); -- AJUSTE 2
  v_retry_after := CASE
    WHEN v_allowed THEN 0
    ELSE GREATEST(1, EXTRACT(EPOCH FROM (v_window_expires - now()))::int)
  END;

  RETURN jsonb_build_object(
    'allowed',             v_allowed,
    'count',               v_count,
    'limit',               p_max_count,
    'remaining',           v_remaining,        -- AJUSTE 2
    'retry_after_seconds', v_retry_after
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.rate_limit_check(text, int, int) TO service_role;

COMMENT ON FUNCTION public.rate_limit_check(text, int, int) IS
  'V1.9.240: rate limit atomic via UPSERT + ON CONFLICT. Retorna jsonb com '
  'allowed/count/limit/remaining/retry_after_seconds. Race-free.';

-- ====================================================================
-- D) CLEANUP periodico (pg_cron pode chamar)
-- ====================================================================
CREATE OR REPLACE FUNCTION public.rate_limit_cleanup()
RETURNS int
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_deleted int;
BEGIN
  DELETE FROM public.rate_limit_buckets
   WHERE expires_at < now() - interval '1 day';
  GET DIAGNOSTICS v_deleted = ROW_COUNT;
  RETURN v_deleted;
END;
$$;

GRANT EXECUTE ON FUNCTION public.rate_limit_cleanup() TO service_role;

COMMENT ON FUNCTION public.rate_limit_cleanup() IS
  'V1.9.240: deleta buckets expirados >1 dia. Pode ser chamado por pg_cron.';

-- ====================================================================
-- VALIDACAO
-- ====================================================================
DO $$
BEGIN
  RAISE NOTICE '[V1.9.240] rate_limit_buckets + rate_limit_events + RPC criados';
END $$;
