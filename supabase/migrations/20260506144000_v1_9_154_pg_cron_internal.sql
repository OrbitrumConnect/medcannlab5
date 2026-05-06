-- ==============================================================================
-- V1.9.154 — pg_cron interno (LIGAÇÃO 4 de 6 + BÔNUS)
-- ==============================================================================
--
-- Substitui GitHub Actions cron (latência 40-49 min em horário de pico)
-- por pg_cron interno do Supabase (executa NO HORÁRIO marcado, latência <30s).
--
-- DESCOBERTA EMPÍRICA 06/05/2026 ~11:30 BRT:
--   Cron GitHub Actions sub-perfomando há semanas.
--   Maria 12h consulta JAMAIS receberia lembrete 1h por gap de 47 min entre runs.
--   Janela 1h tem só 10 min de tolerância (lowerBound=55 / upperBound=65).
--
-- Solução: pg_cron interno + Supabase Vault pra SERVICE_ROLE_KEY.
--
-- 2 jobs criados:
--   1. video-call-reminders-5min (a cada 5 min)
--      → invoca Edge function via net.http_post
--      → Authorization Bearer lido de vault.decrypted_secrets
--   2. monthly-closing-medcannlab (dia 1 do mês, 03:00 UTC = 00h BRT)
--      → SELECT public.process_monthly_closing()
--      → recalcula ranking_history + tier_label de TODOS os médicos
--      → ativa marketplace tier-based real (STANDARD → ELITE/GOLD/SILVER)
--
-- Aplicado empíricamente 06/05/2026 ~11:25 BRT via PAT Pedro.
-- Validado: pg_cron rodou às 11:30:00 BRT, status=succeeded ✓.
-- ==============================================================================

-- 1. Extensão pg_cron (idempotente)
CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA pg_catalog;

-- 2. Vault: armazenar SERVICE_ROLE_KEY pra cron usar (idempotente)
-- NOTA: Migration NÃO inclui a chave em texto plano. Aplicar manualmente no Studio
-- ou via PAT antes desta migration:
--
--   SELECT vault.create_secret(
--     '<SERVICE_ROLE_JWT>',
--     'service_role_for_cron',
--     'Service role JWT used by pg_cron jobs to invoke Edge Functions internally'
--   );
--
-- Esta migration assume que o secret já existe no Vault.
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM vault.secrets WHERE name = 'service_role_for_cron') THEN
        RAISE NOTICE 'AVISO: secret "service_role_for_cron" não existe no Vault. Crie manualmente antes de aplicar esta migration. Job video-call-reminders-5min vai falhar até secret existir.';
    END IF;
END $$;

-- 3. Job 1: video-call-reminders sweep a cada 5 min
SELECT cron.unschedule('video-call-reminders-5min')
WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'video-call-reminders-5min');

SELECT cron.schedule(
    'video-call-reminders-5min',
    '*/5 * * * *',
    $$
    SELECT net.http_post(
        url := 'https://itdjkfubfzmvmuxxjoae.supabase.co/functions/v1/video-call-reminders',
        headers := jsonb_build_object(
            'Authorization', 'Bearer ' || (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'service_role_for_cron' LIMIT 1),
            'Content-Type', 'application/json'
        ),
        body := '{}'::jsonb
    );
    $$
);

-- 4. Job 2: process_monthly_closing dia 1 do mês 00h BRT (03h UTC)
SELECT cron.unschedule('monthly-closing-medcannlab')
WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'monthly-closing-medcannlab');

SELECT cron.schedule(
    'monthly-closing-medcannlab',
    '0 3 1 * *',
    $$SELECT public.process_monthly_closing()$$
);

-- 5. Validação final
DO $$
DECLARE
    v_jobs INT;
BEGIN
    SELECT count(*) INTO v_jobs FROM cron.job
    WHERE jobname IN ('video-call-reminders-5min', 'monthly-closing-medcannlab');

    IF v_jobs <> 2 THEN
        RAISE EXCEPTION 'V1.9.154: esperava 2 jobs, encontrou %', v_jobs;
    END IF;

    RAISE NOTICE 'V1.9.154 OK: % jobs ativos em pg_cron', v_jobs;
END $$;
