
-- Fix trigger to allow server-side (migration) operations where auth.uid() IS NULL
CREATE OR REPLACE FUNCTION public.prevent_privilege_escalation()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Allow server-side operations (migrations, triggers) where there's no auth context
  IF auth.uid() IS NULL THEN
    RETURN NEW;
  END IF;
  -- Allow admins
  IF has_role(auth.uid(), 'admin') THEN
    RETURN NEW;
  END IF;
  -- Block sensitive field changes by non-admins
  IF OLD.type IS DISTINCT FROM NEW.type THEN
    RAISE EXCEPTION 'Não autorizado: alteração de type bloqueada';
  END IF;
  IF OLD.role IS DISTINCT FROM NEW.role THEN
    RAISE EXCEPTION 'Não autorizado: alteração de role bloqueada';
  END IF;
  IF OLD.flag_admin IS DISTINCT FROM NEW.flag_admin THEN
    RAISE EXCEPTION 'Não autorizado: alteração de flag_admin bloqueada';
  END IF;
  RETURN NEW;
END;
$$;

-- Now normalize the 3 users EN→PT
UPDATE public.users SET type = 'paciente' WHERE id = '5c98c123-83f9-4e66-9fb7-3f05a5431cc0' AND type = 'patient';
UPDATE public.users SET type = 'profissional' WHERE id = '2135f0c0-eb5a-43b1-bc00-5f8dfea13561' AND type = 'professional';
UPDATE public.users SET type = 'profissional' WHERE id = '5a83ab19-ba58-4f6e-9cc6-98266fd5245e' AND type = 'professional';

-- Restrict notifications INSERT
DROP POLICY IF EXISTS "Users can insert video call notifications for others" ON public.notifications;
CREATE POLICY "Authenticated can insert video call notifications"
  ON public.notifications FOR INSERT TO authenticated
  WITH CHECK (
    (type = 'video_call_request' OR (metadata IS NOT NULL AND metadata ? 'request_id'))
    AND auth.uid() IS NOT NULL
  );

-- Add search_path to functions (batch)
ALTER FUNCTION public.atualizar_ultima_atualizacao() SET search_path = public;
ALTER FUNCTION public.cleanup_old_chat_messages() SET search_path = public;
ALTER FUNCTION public.count_identified_correlations() SET search_path = public;
ALTER FUNCTION public.count_primary_data_blocks() SET search_path = public;
ALTER FUNCTION public.create_chat_room_for_patient(uuid, text, uuid) SET search_path = public;
ALTER FUNCTION public.create_dev_vivo_session(uuid, text, integer) SET search_path = public;
ALTER FUNCTION public.criar_paciente_completo(varchar, integer, varchar, varchar) SET search_path = public;
ALTER FUNCTION public.ensure_user_profile(uuid) SET search_path = public;
ALTER FUNCTION public.generate_change_signature(uuid, text, timestamptz) SET search_path = public;
ALTER FUNCTION public.generate_iti_code() SET search_path = public;
ALTER FUNCTION public.generate_iti_validation_code() SET search_path = public;
ALTER FUNCTION public.generate_referral_code() SET search_path = public;
ALTER FUNCTION public.get_leaderboard(integer) SET search_path = public;
ALTER FUNCTION public.get_patient_medical_history(uuid) SET search_path = public;
ALTER FUNCTION public.get_unread_notifications_count(uuid) SET search_path = public;
ALTER FUNCTION public.handle_new_patient_creation() SET search_path = public;
ALTER FUNCTION public.handle_new_patient_triage() SET search_path = public;
ALTER FUNCTION public.handle_new_user_profile() SET search_path = public;
ALTER FUNCTION public.increment_document_download(uuid) SET search_path = public;
ALTER FUNCTION public.increment_metabolism(text) SET search_path = public;
ALTER FUNCTION public.increment_user_points(uuid, integer) SET search_path = public;
ALTER FUNCTION public.is_authorized_professional(text) SET search_path = public;
ALTER FUNCTION public.obter_contexto_ia(varchar) SET search_path = public;
ALTER FUNCTION public.register_assessment_score() SET search_path = public;
ALTER FUNCTION public.register_dev_vivo_change(text, text, text, text, text, text) SET search_path = public;
ALTER FUNCTION public.rollback_dev_vivo_change(uuid, text) SET search_path = public;
ALTER FUNCTION public.set_chat_message_expiry() SET search_path = public;
ALTER FUNCTION public.set_prescription_expiry() SET search_path = public;
ALTER FUNCTION public.set_referral_code_on_insert() SET search_path = public;
ALTER FUNCTION public.set_referral_marco_zero() SET search_path = public;
ALTER FUNCTION public.set_trauma_fallback_defaults() SET search_path = public;
ALTER FUNCTION public.set_updated_at() SET search_path = public;
ALTER FUNCTION public.share_assessment_with_clinics(uuid, boolean, boolean, boolean, integer) SET search_path = public;
ALTER FUNCTION public.sync_council_fields() SET search_path = public;
ALTER FUNCTION public.tg_cfm_prescriptions_updated_at() SET search_path = public;
ALTER FUNCTION public.tg_pp_defaults() SET search_path = public;
ALTER FUNCTION public.tg_set_updated_at() SET search_path = public;
ALTER FUNCTION public.tg_user_profiles_updated_at() SET search_path = public;
ALTER FUNCTION public.unlock_achievement(uuid, text) SET search_path = public;
ALTER FUNCTION public.update_cfm_prescriptions_updated_at() SET search_path = public;
ALTER FUNCTION public.update_dev_vivo_updated_at() SET search_path = public;
ALTER FUNCTION public.update_forum_comments_updated_at() SET search_path = public;
ALTER FUNCTION public.update_news_items_updated_at() SET search_path = public;
ALTER FUNCTION public.update_semantic_kpi(numeric, numeric) SET search_path = public;
ALTER FUNCTION public.update_updated_at_column() SET search_path = public;
ALTER FUNCTION public.update_user_statistics() SET search_path = public;
ALTER FUNCTION public.update_users_updated_at() SET search_path = public;
ALTER FUNCTION public.issue_medcannlab_api_key() SET search_path = public;
ALTER FUNCTION public.process_appointment_referral_bonus() SET search_path = public;

-- =====================================================
-- FASE 3: RPC calculate_ckd_stage (DRC)
-- =====================================================
CREATE OR REPLACE FUNCTION public.calculate_ckd_stage(
  p_creatinine numeric,
  p_age integer,
  p_sex text,
  p_patient_id uuid DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_k numeric;
  v_alpha numeric;
  v_gender_factor numeric;
  v_scr_over_k numeric;
  v_min_part numeric;
  v_max_part numeric;
  v_egfr numeric;
  v_stage text;
  v_description text;
  v_action_plan text;
  v_risk text;
BEGIN
  IF lower(p_sex) IN ('female', 'f', 'feminino') THEN
    v_k := 0.7; v_alpha := -0.241; v_gender_factor := 1.012;
  ELSE
    v_k := 0.9; v_alpha := -0.302; v_gender_factor := 1.0;
  END IF;

  v_scr_over_k := p_creatinine / v_k;
  v_min_part := power(least(v_scr_over_k, 1.0), v_alpha);
  v_max_part := power(greatest(v_scr_over_k, 1.0), -1.200);
  v_egfr := round((142 * v_min_part * v_max_part * power(0.9938, p_age) * v_gender_factor)::numeric, 1);

  IF v_egfr >= 90 THEN
    v_stage := 'G1'; v_description := 'Normal ou Elevado';
    v_action_plan := 'Monitoramento anual se houver outros riscos.'; v_risk := 'baixo';
  ELSIF v_egfr >= 60 THEN
    v_stage := 'G2'; v_description := 'Levemente Diminuído';
    v_action_plan := 'Monitorar progressão e pressão arterial.'; v_risk := 'baixo';
  ELSIF v_egfr >= 45 THEN
    v_stage := 'G3a'; v_description := 'Leve a Moderado';
    v_action_plan := 'Avaliar complicações. Consultar nefrologista.'; v_risk := 'moderado';
  ELSIF v_egfr >= 30 THEN
    v_stage := 'G3b'; v_description := 'Moderado a Grave';
    v_action_plan := 'Monitoramento estrito. Preparação para tratamentos avançados.'; v_risk := 'alto';
  ELSIF v_egfr >= 15 THEN
    v_stage := 'G4'; v_description := 'Gravemente Diminuído';
    v_action_plan := 'Preparo para terapia de substituição renal.'; v_risk := 'muito_alto';
  ELSE
    v_stage := 'G5'; v_description := 'Falência Renal';
    v_action_plan := 'Diálise ou transplante indicados.'; v_risk := 'critico';
  END IF;

  IF p_patient_id IS NOT NULL THEN
    INSERT INTO patient_lab_results (patient_id, exam_type, exam_date, result_value, result_unit, reference_range, notes)
    VALUES (p_patient_id, 'eGFR_CKD-EPI_2021', CURRENT_DATE, v_egfr::text, 'mL/min/1.73m²', '≥ 90', 'Estágio: ' || v_stage || ' - ' || v_description);
  END IF;

  RETURN jsonb_build_object(
    'egfr', v_egfr, 'stage', v_stage, 'description', v_description,
    'action_plan', v_action_plan, 'risk_level', v_risk, 'formula', 'CKD-EPI 2021',
    'inputs', jsonb_build_object('creatinine', p_creatinine, 'age', p_age, 'sex', p_sex)
  );
END;
$$;
