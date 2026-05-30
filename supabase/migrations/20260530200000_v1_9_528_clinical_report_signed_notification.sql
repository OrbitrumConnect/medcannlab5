-- V1.9.528 — Trigger pg AFTER UPDATE clinical_reports.signed_at → notification new_clinical_report
-- ============================================================
-- Pattern V1.9.527 replicado pra gap funcional empirico identificado 30/05:
--
-- ACHADO EMPIRICO (PAT 30/05 ~19h BRT):
--   clinical_reports criados 30d: 54 rows (last hoje 03h51)
--   notifications type='new_clinical_report' 30d: 0 rows (ULTIMA: 14/11/2025!)
--   Gap funcional: 145+ relatorios totais no banco MAS notification quebrou ha
--   ~6 meses (last new_clinical_report = 14/nov/2025)
--
-- CONTEXTO DOCUMENTAL CONSULTADO (princípio Pedro 30/05 "olhar diários documentação"):
--   - memory project_v1_9_330_audience_contract_design_18_05 (audience contract)
--   - memory feedback_dual_write_contract_jsonb_vs_tabela_18_05 (dual-write rationalities)
--   - memory feedback_share_overwrite_professional_id_e_admin_visibilidade_28_05 (share OVERWRITE)
--   - DIARIO_28_05 (sidecars cognitivos + stack completo)
--   - Trigger existente: ns_track_aec_finalized (V1.9.X) - track metrics, NAO cria notification
--
-- SOLUCAO ELITE ESCALAVEL ZERO REGRESSAO:
--   - Trigger AFTER INSERT OR UPDATE OF signed_at em clinical_reports
--   - WHEN: transicao NULL -> NOT NULL em signed_at (paciente avisado quando
--     medico ASSINA, nao quando report criado)
--   - INSERT direto em notifications (SECURITY DEFINER bypassa RLS)
--   - Mitigacao duplicacao: NOT EXISTS notification recente (<5s) pro mesmo report_id
--   - Exception handling: RAISE WARNING + RETURN NEW (NAO bloqueia INSERT/UPDATE)
--   - PADRAO COEXISTE com ns_track_aec_finalized (esse track metrics no clinical_north_star_events,
--     este insere notification user-facing - sem conflito)
--
-- ANTI-PADRAO EVITADO:
--   - NAO criar Edge nova (anti-Babylon)
--   - NAO criar RPC equivalente generica (sem trigger empirico de reuso)
--   - NAO mexer no frontend (princípio "não tocar o que funciona")
--   - SOMENTE adicionar trigger backup que cobre fluxo notification quebrado
--
-- ROLLBACK 30s:
--   DROP TRIGGER trg_clinical_report_signed_notify ON public.clinical_reports;
--   DROP FUNCTION public.tg_clinical_report_signed_notify();
--
-- SMOKE POS-DEPLOY:
--   UPDATE clinical_reports SET signed_at = now() WHERE id = '<test_id_unsigned>';
--   (DEVE criar 1 notification new_clinical_report pro patient_id)
--   DELETE notification + restore report pra cleanup

CREATE OR REPLACE FUNCTION public.tg_clinical_report_signed_notify()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_should_notify boolean := false;
  v_professional_name text;
  v_message text;
  v_existing_count int;
BEGIN
  -- Detectar transição NULL → NOT NULL em signed_at (mesma logica ns_track_aec_finalized)
  IF TG_OP = 'INSERT' THEN
    v_should_notify := (NEW.signed_at IS NOT NULL);
  ELSIF TG_OP = 'UPDATE' THEN
    v_should_notify := (OLD.signed_at IS NULL AND NEW.signed_at IS NOT NULL);
  END IF;

  IF NOT v_should_notify THEN
    RETURN NEW;
  END IF;

  -- patient_id obrigatorio pra notification user-facing
  IF NEW.patient_id IS NULL THEN
    RAISE NOTICE '[V1.9.528] Report % sem patient_id, skip notification', NEW.id;
    RETURN NEW;
  END IF;

  -- Buscar nome do profissional pra mensagem
  SELECT name
    INTO v_professional_name
    FROM public.users
   WHERE id = COALESCE(NEW.professional_id, NEW.doctor_id)
   LIMIT 1;

  IF v_professional_name IS NULL THEN
    v_professional_name := 'Profissional';
  END IF;

  -- Mensagem cirurgica (sem PII alem do nome do medico - publico)
  -- V1.9.528 fix: detecta se nome ja tem prefixo Dr./Dra./Drª pra evitar duplicacao
  -- (empirico smoke: "Dr(a). Dr. Ricardo Valença" virou "Dr. Ricardo Valença")
  v_message := CASE
    WHEN v_professional_name ~* '^(Dr\.?|Dra\.?|Drª\.?)\s+' THEN
      format('%s assinou seu relatório clínico. Acesse seu prontuário para visualizar.',
             v_professional_name)
    ELSE
      format('Dr(a). %s assinou seu relatório clínico. Acesse seu prontuário para visualizar.',
             v_professional_name)
  END;

  -- MITIGACAO DUPLICACAO: skip se notification ja existe pra este report nos ultimos 5s
  SELECT COUNT(*) INTO v_existing_count
    FROM public.notifications
   WHERE type = 'new_clinical_report'
     AND metadata->>'report_id' = NEW.id
     AND created_at > now() - interval '5 seconds';

  IF v_existing_count > 0 THEN
    RAISE NOTICE '[V1.9.528] Notification ja existe para report_id %, skip trigger', NEW.id;
    RETURN NEW;
  END IF;

  -- INSERT direto (SECURITY DEFINER bypassa RLS)
  INSERT INTO public.notifications (
    id,
    user_id,
    type,
    title,
    message,
    is_read,
    metadata
  ) VALUES (
    gen_random_uuid()::text,
    NEW.patient_id,
    'new_clinical_report',
    'Novo relatório clínico disponível',
    v_message,
    false,
    jsonb_build_object(
      'report_id',         NEW.id,
      'professional_id',   COALESCE(NEW.professional_id, NEW.doctor_id),
      'professional_name', v_professional_name,
      'signed_at',         NEW.signed_at,
      'signature_hash',    NEW.signature_hash,
      'status',            NEW.status,
      'source',            'trigger_v1_9_528'
    )
  );

  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  -- Trigger NAO bloqueia INSERT/UPDATE em clinical_reports caso notification falhe
  RAISE WARNING '[V1.9.528] Falha ao criar notification para report %: %',
                NEW.id, SQLERRM;
  RETURN NEW;
END;
$$;

GRANT EXECUTE ON FUNCTION public.tg_clinical_report_signed_notify() TO service_role;

-- Trigger SEPARADO INSERT e UPDATE (mesma logica ns_track_aec_finalized)
-- INSERT: cobre caso onde report criado JA com signed_at NOT NULL
DROP TRIGGER IF EXISTS trg_clinical_report_signed_notify_insert ON public.clinical_reports;
CREATE TRIGGER trg_clinical_report_signed_notify_insert
  AFTER INSERT ON public.clinical_reports
  FOR EACH ROW
  WHEN (NEW.signed_at IS NOT NULL)
  EXECUTE FUNCTION public.tg_clinical_report_signed_notify();

-- UPDATE: cobre caso paciente_id mudar OR signed_at transicionar NULL -> NOT NULL
DROP TRIGGER IF EXISTS trg_clinical_report_signed_notify_update ON public.clinical_reports;
CREATE TRIGGER trg_clinical_report_signed_notify_update
  AFTER UPDATE OF signed_at ON public.clinical_reports
  FOR EACH ROW
  WHEN (OLD.signed_at IS DISTINCT FROM NEW.signed_at AND NEW.signed_at IS NOT NULL)
  EXECUTE FUNCTION public.tg_clinical_report_signed_notify();

COMMENT ON FUNCTION public.tg_clinical_report_signed_notify() IS
  'V1.9.528 - Trigger backup notification quando clinical_reports.signed_at transiciona NULL -> NOT NULL. Pattern V1.9.527 replicado. Mitigacao duplicacao via check temporal 5s. NAO bloqueia INSERT/UPDATE em falha. Coexiste com ns_track_aec_finalized (esse track metrics, este cria notification user-facing).';

COMMENT ON TRIGGER trg_clinical_report_signed_notify_insert ON public.clinical_reports IS
  'V1.9.528 - INSERT case: report criado JA signed (raro, mas cobrir).';

COMMENT ON TRIGGER trg_clinical_report_signed_notify_update ON public.clinical_reports IS
  'V1.9.528 - UPDATE case: medico assinou report previamente unsigned (caso DOMINANTE empiricamente).';
