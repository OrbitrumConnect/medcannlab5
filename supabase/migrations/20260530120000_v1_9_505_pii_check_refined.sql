-- V1.9.505 — Refinar regex PII em run_sgq_health_checks (Tier 1 ITEM 5 DIARIO_30)
-- ============================================================
-- Objetivo: eliminar falso positivo de "Análise Holística" + similares que
-- V1.9.503 gerou no smoke inicial 29/05 ~23h. DIARIO_30 §B.3 propôs:
--   (a) 3+ palavras capitalizadas em sequência (mais especifico que 2)
--   (b) exclude list de termos técnicos comuns (Análise/Síndrome/etc)
--   (c) severidade WARNING (heurística) em vez de CRITICAL (false alarm)
--
-- Detector continua heurístico — nota "requires_manual_review" no JSONB
-- deixa claro que match pede investigação humana, nao bloqueio automático.
--
-- Migration AÇÃO: CREATE OR REPLACE FUNCTION (idempotente; tabela
-- system_health_alerts + cron sgq-health-checks-daily V1.9.503 intactos).

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

  -- Check 2 REFINADO V1.9.505: PII em rationalities (heurística melhorada)
  -- Mudancas vs V1.9.503:
  --   (a) 3 palavras capitalizadas em sequencia (era 2 = muito permissivo)
  --   (b) Exclude list de termos tecnicos clinicos comuns
  --   (c) Severidade warning (era critical = falso alarme honesto)
  --   (d) Nota requires_manual_review explicita
  SELECT COUNT(*) INTO v_pii_violations
  FROM public.clinical_rationalities cr
  WHERE cr.created_at > now() - interval '72 hours'
    AND cr.assessment NOT LIKE '%Paciente #%'
    AND cr.assessment !~* 'o\(a\)? paciente|^paciente '
    -- (a) 3+ palavras capitalizadas em sequencia (mais especifico que 2)
    AND cr.assessment ~* '\m[A-Z][a-z]+\s+[A-Z][a-z]+\s+[A-Z][a-z]+\M'
    -- (b) Exclude list de termos tecnicos clinicos comuns (case-insensitive,
    --     PostgreSQL POSIX permite alternancia mas nao lookahead negativo,
    --     entao usamos NOT match contra padrao de termos isolados ou compostos)
    AND cr.assessment !~* '\m(Analise\s+(Holistica|Vetorial|Integrativa|Clinica)|Sindrome\s+(Metabolica|Nefrotica|Cushing)|Sistema\s+(Nervoso|Endocrino|Cardiovascular|Respiratorio|Renal|Digestivo|Imunologico|Reprodutor|Tegumentar|Musculoesqueletico|Urinario)|Metodo\s+AEC|Escola\s+Clinica|Recomendacoes\s+Integrativas|Consulta\s+Inicial|Relatorio\s+Clinico|Diagnostico\s+Diferencial|Tratamento\s+Integrativo|Terapia\s+Cannabis|Abordagem\s+Holistica|Medicina\s+Integrativa|Cannabidiol\s+Isolado|Cannabis\s+Medicinal|Conduta\s+Clinica|Consideracoes\s+(Integrativas|Eticas)|Protocolo\s+(CBD|AEC)|Estudo\s+(Clinico|Cientifico)|Historico\s+(Patologico|Familiar)|Avaliacao\s+(Inicial|Integrativa|Clinica)|Doenca\s+Renal|Dor\s+(Cronica|Aguda|Neuropatica)|Saude\s+Mental|Bem\s+Estar|Qualidade\s+de\s+Vida|Servico\s+Social)\M';

  IF v_pii_violations > 0 THEN
    INSERT INTO public.system_health_alerts (check_name, severity, expected_value, actual_value, details)
    VALUES (
      'PII', 'warning', '0', v_pii_violations::text,
      jsonb_build_object(
        'description', 'PII potencial em rationalities recentes (heuristica 3+ palavras capitalizadas)',
        'window_hours', 72,
        'requires_manual_review', true,
        'note', 'V1.9.505 refinou regex pra reduzir falsos positivos. Match pede investigacao humana antes de tratar como vazamento real.',
        'detector_version', 'V1.9.505'
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

  -- Check 5: Reports com signed_at NOT NULL mas signature_hash IS NULL (cobertura ICP)
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
    'detector_version', 'V1.9.505',
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

-- Smoke validation V1.9.505 (deve retornar pii_violations menor OU igual ao V1.9.503)
SELECT public.run_sgq_health_checks() AS smoke_v1_9_505;
