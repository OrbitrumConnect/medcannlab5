-- V1.9.516 — Check 6 AEC pending followup >5d (input Ricardo+Pedro 30/05 ~13h30)
-- ============================================================
-- Trigger empirico: Ricardo trouxe via Pedro que ciclo clinico natural AEC eh
-- 4-5 dias. Calibrado pra 5d (Pedro recalibrou 3-4 → 4-5). Cron lembrete
-- automatico pro medico responsavel quando AEC ATIVA (nao-INTERRUPTED, nao-completa)
-- nao tem update ha 5 dias.
--
-- Anti-padrao evitado: codar 30d catastrofico (chute inicial Claude). Janela
-- clinica real eh 4-5d porque paciente perde ritmo de avaliacao.
--
-- Estrategia ANTI-BABYLON-RECALIBRADA (Pedro 30/05 ~14h "ficar parqueando nao
-- adianta precisamos agilizar"): NAO criar cron novo NEM tabela nova. ADICIONAR
-- Check 6 em run_sgq_health_checks() existente (V1.9.503/505) que ja roda
-- diario 06h BRT. Custo dev: ~30min (reuso integral).
--
-- Funcionamento:
--   1. Query identifica AECs ativas em qualquer fase (exceto INTERRUPTED/COMPLETED/
--      FINAL_RECOMMENDATION) com last_update < now() - interval '5 days'
--   2. Se >0 AECs encontradas: INSERT em system_health_alerts severidade=warning
--   3. details JSONB inclui: count + ui_path + ricardo_input_45d (rastreabilidade)
--   4. Cron sgq-health-checks-daily 06h BRT processa automatico
--   5. Admin ve em /admin/ai-governance OR via card SGQ Health futuro
--
-- Empirico HOJE (30/05 ~14h PAT): 1 AEC ativa COMPLAINT_DETAILS recente (<5d)
-- → smoke pos-deploy deve retornar 0 alerts (funcao silenciosa funcionando).
-- Quando Marco 2 chegar + AEC paciente externo passar 5d sem update → alerta
-- automatico ANTES do medico esquecer.

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
  v_aec_pending_followup int;
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

  -- Check 2 REFINADO V1.9.505: PII em rationalities (heuristica 3+ palavras + exclude list)
  SELECT COUNT(*) INTO v_pii_violations
  FROM public.clinical_rationalities cr
  WHERE cr.created_at > now() - interval '72 hours'
    AND cr.assessment NOT LIKE '%Paciente #%'
    AND cr.assessment !~* 'o\(a\)? paciente|^paciente '
    AND cr.assessment ~* '\m[A-Z][a-z]+\s+[A-Z][a-z]+\s+[A-Z][a-z]+\M'
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

  -- Check 3: AECs orfas em INTERRUPTED ha mais de 7 dias (agregado)
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

  -- Check 6 NOVO V1.9.516: AECs ATIVAS pendentes followup >5 dias (lembrete clinico)
  -- Input Ricardo via Pedro 30/05: janela clinica natural AEC = 4-5 dias.
  -- AEC ativa (nao-INTERRUPTED, nao-completa, nao-final) sem update >5d = paciente
  -- perdeu ritmo + medico precisa decidir check-in proativo (whatsapp/lembrete/etc).
  SELECT COUNT(*) INTO v_aec_pending_followup
  FROM public.aec_assessment_state
  WHERE phase NOT IN ('INTERRUPTED', 'COMPLETED', 'FINAL_RECOMMENDATION', 'REPORT', 'CONSENSUS')
    AND is_complete = false
    AND invalidated_at IS NULL
    AND last_update < now() - interval '5 days';

  IF v_aec_pending_followup > 0 THEN
    INSERT INTO public.system_health_alerts (check_name, severity, expected_value, actual_value, details)
    VALUES (
      'AEC_PENDING_FOLLOWUP_5D', 'warning', '0', v_aec_pending_followup::text,
      jsonb_build_object(
        'description', 'AECs ativas (nao-INTERRUPTED) sem update >5 dias — medico decide check-in proativo',
        'threshold_days', 5,
        'ricardo_input', 'Janela clinica natural AEC 4-5 dias (cristalizado 30/05 via Pedro)',
        'action_path', 'Medico abre Dashboard Profissional + revisa lista pacientes AEC ativa + manda whatsapp/email pra retomar fluxo',
        'note', 'V1.9.516 anti-Babylon-recalibrado: protege Marco 2 ANTES de paciente externo pagante reclamar',
        'detector_version', 'V1.9.516'
      )
    );
    v_alerts_created := v_alerts_created + 1;
  END IF;

  RETURN jsonb_build_object(
    'run_at', now(),
    'detector_version', 'V1.9.516',
    'rls_violations', v_rls_violations,
    'pii_violations', v_pii_violations,
    'aec_orfas', v_aec_orfas,
    'aec_pending_followup_5d', v_aec_pending_followup,
    'cron_failures', v_cron_failures,
    'icp_uncovered', v_icp_uncovered,
    'alerts_created', v_alerts_created
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.run_sgq_health_checks() TO authenticated, service_role;

-- Smoke validation V1.9.516 (deve retornar aec_pending_followup_5d=0 hoje
-- pois unica AEC ativa COMPLAINT_DETAILS eh recente <5d)
SELECT public.run_sgq_health_checks() AS smoke_v1_9_516;
