-- V1.9.503 — Tabela system_health_alerts + 5 queries cron Nivel 1 SGQ
-- ============================================================
-- Implementacao Nivel 1 automacao SGQ pos-recomendacao Claude2/GPT 29/05.
-- Pre-Marco 1: SO 5 queries SQL gravando em fila auditavel (nao push notification).
-- Anti-Babylon: nao cria alerta sem ator pra responder.
-- Bandwidth Pedro = bandwidth alertas. Revisar quando senta.
--
-- Pos-Marco 1 + 2o dev: pode evoluir pra roteamento Slack/Discord/WhatsApp.

-- 1. Tabela de fila auditavel de alertas
CREATE TABLE IF NOT EXISTS public.system_health_alerts (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  check_name text NOT NULL,           -- 'RLS' / 'PII' / 'CRON' / 'AEC_ORFAS' / 'ICP_COVERAGE'
  severity text NOT NULL CHECK (severity IN ('critical', 'warning', 'info')),
  expected_value text,                -- valor esperado (ex: '0' rows)
  actual_value text,                  -- valor observado
  details jsonb,                      -- contexto rico
  status text DEFAULT 'open' CHECK (status IN ('open', 'acknowledged', 'resolved', 'dismissed')),
  acknowledged_by uuid REFERENCES public.users(id),
  acknowledged_at timestamp with time zone,
  resolved_at timestamp with time zone,
  resolution_notes text,
  created_at timestamp with time zone DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_system_health_alerts_status_severity
  ON public.system_health_alerts (status, severity, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_system_health_alerts_check_name
  ON public.system_health_alerts (check_name, created_at DESC);

ALTER TABLE public.system_health_alerts ENABLE ROW LEVEL SECURITY;

-- RLS: apenas admin pode ler/manipular
DROP POLICY IF EXISTS "Admins can SELECT system_health_alerts" ON public.system_health_alerts;
CREATE POLICY "Admins can SELECT system_health_alerts"
  ON public.system_health_alerts
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users WHERE id = auth.uid() AND type = 'admin'
    )
  );

DROP POLICY IF EXISTS "Admins can UPDATE system_health_alerts" ON public.system_health_alerts;
CREATE POLICY "Admins can UPDATE system_health_alerts"
  ON public.system_health_alerts
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users WHERE id = auth.uid() AND type = 'admin'
    )
  );

-- Service role pode INSERT (pra cron jobs)
DROP POLICY IF EXISTS "Service role can INSERT system_health_alerts" ON public.system_health_alerts;
CREATE POLICY "Service role can INSERT system_health_alerts"
  ON public.system_health_alerts
  FOR INSERT
  TO service_role
  WITH CHECK (true);

-- 2. Function que executa os 5 health checks Nivel 1
CREATE OR REPLACE FUNCTION public.run_sgq_health_checks()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_rls_violations int;
  v_pii_violations int;
  v_aec_orfas int;
  v_cron_failures int;
  v_icp_uncovered int;
  v_alerts_created int := 0;
BEGIN
  -- Check 1: RLS coverage (toda tabela publica deve ter RLS ON)
  SELECT COUNT(*) INTO v_rls_violations
  FROM pg_class c
  JOIN pg_namespace n ON n.oid = c.relnamespace
  WHERE n.nspname = 'public'
    AND c.relkind = 'r'
    AND NOT c.relrowsecurity;

  IF v_rls_violations > 0 THEN
    INSERT INTO public.system_health_alerts (check_name, severity, expected_value, actual_value, details)
    VALUES (
      'RLS', 'critical', '0', v_rls_violations::text,
      jsonb_build_object(
        'description', 'Tabela(s) publica(s) sem RLS habilitado',
        'query', 'SELECT relname FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace WHERE n.nspname = ''public'' AND c.relkind = ''r'' AND NOT c.relrowsecurity'
      )
    );
    v_alerts_created := v_alerts_created + 1;
  END IF;

  -- Check 2: PII em rationalities (assessment com nome real nao-pseudonimizado)
  -- Verifica se ha rationality recente (>72h) sem padrao "Paciente #" e sem genericos OK
  SELECT COUNT(*) INTO v_pii_violations
  FROM public.clinical_rationalities cr
  WHERE cr.created_at > now() - interval '72 hours'
    AND cr.assessment NOT LIKE '%Paciente #%'
    AND cr.assessment !~* 'o\(a\)? paciente|^paciente '
    AND cr.assessment ~* '[A-Z][a-z]+ [A-Z][a-z]+';  -- 2 palavras capitalizadas = provavel nome

  IF v_pii_violations > 0 THEN
    INSERT INTO public.system_health_alerts (check_name, severity, expected_value, actual_value, details)
    VALUES (
      'PII', 'critical', '0', v_pii_violations::text,
      jsonb_build_object(
        'description', 'PII potencial em rationalities recentes (72h) sem pseudonimo nem generico',
        'window_hours', 72,
        'note', 'Detector pode ter falso positivo - revisar manualmente'
      )
    );
    v_alerts_created := v_alerts_created + 1;
  END IF;

  -- Check 3: AECs orfas em INTERRUPTED ha mais de 7 dias
  SELECT COUNT(*) INTO v_aec_orfas
  FROM public.aec_assessment_state
  WHERE phase = 'INTERRUPTED'
    AND is_complete = false
    AND invalidated_at IS NULL
    AND last_update < now() - interval '7 days';

  IF v_aec_orfas > 5 THEN
    INSERT INTO public.system_health_alerts (check_name, severity, expected_value, actual_value, details)
    VALUES (
      'AEC_ORFAS', 'warning', '<=5', v_aec_orfas::text,
      jsonb_build_object(
        'description', 'AECs INTERRUPTED orfas ha mais de 7 dias',
        'threshold', 5,
        'ui_path', '/profissional/dashboard - InterruptedAECsCard'
      )
    );
    v_alerts_created := v_alerts_created + 1;
  END IF;

  -- Check 4: Cron jobs com falhas nas ultimas 24h
  SELECT COUNT(*) INTO v_cron_failures
  FROM cron.job_run_details
  WHERE start_time > now() - interval '24 hours'
    AND status != 'succeeded';

  IF v_cron_failures > 0 THEN
    INSERT INTO public.system_health_alerts (check_name, severity, expected_value, actual_value, details)
    VALUES (
      'CRON', 'warning', '0', v_cron_failures::text,
      jsonb_build_object(
        'description', 'Cron jobs com falhas nas ultimas 24h',
        'window_hours', 24
      )
    );
    v_alerts_created := v_alerts_created + 1;
  END IF;

  -- Check 5: Reports com status='signed' mas sem signature_hash (cobertura ICP)
  SELECT COUNT(*) INTO v_icp_uncovered
  FROM public.clinical_reports
  WHERE status IN ('completed', 'shared')
    AND signed_at IS NOT NULL
    AND signature_hash IS NULL;

  IF v_icp_uncovered > 0 THEN
    INSERT INTO public.system_health_alerts (check_name, severity, expected_value, actual_value, details)
    VALUES (
      'ICP_COVERAGE', 'warning', '0', v_icp_uncovered::text,
      jsonb_build_object(
        'description', 'Reports marcados signed_at mas sem signature_hash',
        'note', 'Verificar Edge sign-pdf-icp e Lock V1.9.299'
      )
    );
    v_alerts_created := v_alerts_created + 1;
  END IF;

  RETURN jsonb_build_object(
    'run_at', now(),
    'rls_violations', v_rls_violations,
    'pii_violations', v_pii_violations,
    'aec_orfas', v_aec_orfas,
    'cron_failures', v_cron_failures,
    'icp_uncovered', v_icp_uncovered,
    'alerts_created', v_alerts_created
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.run_sgq_health_checks() TO authenticated, service_role;

-- 3. Cron schedule diario 06h BRT (09h UTC)
-- Schedule: '0 9 * * *' = todo dia as 09h UTC (= 06h BRT)
SELECT cron.unschedule('sgq-health-checks-daily')
  WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'sgq-health-checks-daily');

SELECT cron.schedule(
  'sgq-health-checks-daily',
  '0 9 * * *',
  $$ SELECT public.run_sgq_health_checks(); $$
);

-- Smoke validation
SELECT public.run_sgq_health_checks() AS smoke_result;
