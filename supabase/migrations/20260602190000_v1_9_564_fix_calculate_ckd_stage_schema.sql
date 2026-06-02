-- V1.9.564 — fix calculate_ckd_stage: INSERT desalinhado com o schema real de patient_lab_results
--
-- BUG (gap-analysis 02/06, docs/CONFORMIDADE_REGULATORIA_GAP_ANALYSIS.md §3.6):
--   O INSERT usava colunas INEXISTENTES (exam_type / exam_date / result_value / result_unit /
--   reference_range) — schema real = test_type(enum) / value(numeric) / unit / reference_range_min /
--   measured_at. Além disso a função era STABLE mas executa INSERT (contradição). Resultado: quando
--   chamada com p_patient_id, a INSERT dava erro → patient_lab_results ficou com 0 rows (nunca gravou).
--
-- ZERO REGRESSÃO: o caller (src/components/RenalFunctionModule.tsx:227-236) salva no renal_exams
--   (path primário, intacto) e chama este RPC como secundário DENTRO de try/catch que engole o erro
--   (console.warn). Hoje falha-e-é-ignorado; com o fix passa a gravar corretamente. O cálculo eGFR
--   (CKD-EPI 2021) e o RETURN jsonb permanecem idênticos.
--
-- MELHORA: patient_lab_results passa a registrar o eGFR (test_type='gfr_ckd_epi') — habilita dados
--   renais reais (base para FHIR Observation / interoperabilidade).

CREATE OR REPLACE FUNCTION public.calculate_ckd_stage(p_creatinine numeric, p_age integer, p_sex text, p_patient_id uuid DEFAULT NULL::uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 VOLATILE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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

  -- INSERT corrigido p/ o schema real de patient_lab_results (era exam_type/exam_date/result_value/... inexistentes).
  -- is_abnormal/created_by omitidos de propósito (sem asserção clínica adicional; o médico interpreta o estágio).
  IF p_patient_id IS NOT NULL THEN
    INSERT INTO patient_lab_results (patient_id, test_type, value, unit, reference_range_min, measured_at, notes)
    VALUES (p_patient_id, 'gfr_ckd_epi', v_egfr, 'mL/min/1.73m²', 90, now(), 'Estágio: ' || v_stage || ' - ' || v_description);
  END IF;

  RETURN jsonb_build_object(
    'egfr', v_egfr, 'stage', v_stage, 'description', v_description,
    'action_plan', v_action_plan, 'risk_level', v_risk, 'formula', 'CKD-EPI 2021',
    'inputs', jsonb_build_object('creatinine', p_creatinine, 'age', p_age, 'sex', p_sex)
  );
END;
$function$;
