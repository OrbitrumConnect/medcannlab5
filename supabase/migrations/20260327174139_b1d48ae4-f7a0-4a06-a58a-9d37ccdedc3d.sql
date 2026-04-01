-- Fix: Check pre-calculated scores BEFORE the skip condition
CREATE OR REPLACE FUNCTION public.populate_clinical_kpis_from_report()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_content JSONB;
  v_patient_id UUID;
  v_professional_id UUID;
  v_assessment_date DATE;
  v_clinical_score NUMERIC := 0;
  v_adherence NUMERIC := 0;
  v_qol NUMERIC := 0;
  v_symptom NUMERIC := 0;
  v_total_signals NUMERIC := 0;
  v_total_weight NUMERIC := 0;
  v_queixa TEXT;
  v_lista_count INT;
  v_dev_score NUMERIC := 0;
  v_habitos_count INT := 0;
  v_hist_count INT;
  v_fam_score NUMERIC := 0;
  v_perguntas_count INT;
  v_has_consent BOOLEAN := FALSE;
  v_has_precalc BOOLEAN := FALSE;
BEGIN
  v_content := NEW.content;
  v_patient_id := NEW.patient_id;
  v_professional_id := COALESCE(NEW.professional_id, NEW.doctor_id);
  v_assessment_date := COALESCE(NEW.generated_at::date, NEW.created_at::date, CURRENT_DATE);

  IF v_content IS NULL OR v_content = '{}'::jsonb THEN
    RETURN NEW;
  END IF;

  -- Check for pre-calculated scores first
  IF v_content->'scores' IS NOT NULL AND COALESCE((v_content->'scores'->>'clinical_score')::numeric, 0) > 0 THEN
    v_has_precalc := TRUE;
    v_clinical_score := (v_content->'scores'->>'clinical_score')::numeric;
    v_adherence := COALESCE((v_content->'scores'->>'treatment_adherence')::numeric, v_clinical_score);
    v_qol := COALESCE((v_content->'scores'->>'quality_of_life')::numeric, v_clinical_score);
    v_symptom := COALESCE((v_content->'scores'->>'symptom_improvement')::numeric, v_clinical_score);
  END IF;

  -- Calculate from AEC data if no pre-calc
  IF NOT v_has_precalc THEN
    v_queixa := COALESCE(v_content->>'queixa_principal', v_content->>'chiefComplaint', '');
    IF length(v_queixa) > 10 THEN v_total_signals := v_total_signals + 15; END IF;
    v_total_weight := v_total_weight + 15;

    v_lista_count := COALESCE(jsonb_array_length(CASE WHEN jsonb_typeof(v_content->'lista_indiciaria') = 'array' THEN v_content->'lista_indiciaria' ELSE '[]'::jsonb END), 0);
    IF v_lista_count > 0 THEN v_total_signals := v_total_signals + LEAST(20, v_lista_count * 4); END IF;
    v_total_weight := v_total_weight + 20;

    IF v_content->'desenvolvimento_queixa' IS NOT NULL THEN
      IF jsonb_typeof(v_content->'desenvolvimento_queixa'->'fatores_piora') = 'array' AND jsonb_array_length(v_content->'desenvolvimento_queixa'->'fatores_piora') > 0 THEN v_dev_score := v_dev_score + 7; END IF;
      IF jsonb_typeof(v_content->'desenvolvimento_queixa'->'fatores_melhora') = 'array' AND jsonb_array_length(v_content->'desenvolvimento_queixa'->'fatores_melhora') > 0 THEN v_dev_score := v_dev_score + 7; END IF;
      IF jsonb_typeof(v_content->'desenvolvimento_queixa'->'sintomas_associados') = 'array' AND jsonb_array_length(v_content->'desenvolvimento_queixa'->'sintomas_associados') > 0 THEN v_dev_score := v_dev_score + 6; END IF;
    END IF;
    v_total_signals := v_total_signals + LEAST(20, v_dev_score);
    v_total_weight := v_total_weight + 20;

    v_habitos_count := COALESCE(jsonb_array_length(CASE WHEN jsonb_typeof(v_content->'habitos_vida') = 'array' THEN v_content->'habitos_vida' ELSE '[]'::jsonb END), 0);
    IF v_habitos_count > 0 THEN v_total_signals := v_total_signals + LEAST(15, v_habitos_count * 3); END IF;
    v_total_weight := v_total_weight + 15;

    v_hist_count := COALESCE(jsonb_array_length(CASE WHEN jsonb_typeof(v_content->'historia_patologica_pregressa') = 'array' THEN v_content->'historia_patologica_pregressa' ELSE '[]'::jsonb END), 0);
    IF v_hist_count > 0 THEN v_total_signals := v_total_signals + LEAST(10, v_hist_count * 2); END IF;
    v_total_weight := v_total_weight + 10;

    IF v_content->'historia_familiar' IS NOT NULL THEN
      IF jsonb_typeof(v_content->'historia_familiar'->'lado_materno') = 'array' AND jsonb_array_length(v_content->'historia_familiar'->'lado_materno') > 0 THEN v_fam_score := v_fam_score + 5; END IF;
      IF jsonb_typeof(v_content->'historia_familiar'->'lado_paterno') = 'array' AND jsonb_array_length(v_content->'historia_familiar'->'lado_paterno') > 0 THEN v_fam_score := v_fam_score + 5; END IF;
    END IF;
    v_total_signals := v_total_signals + LEAST(10, v_fam_score);
    v_total_weight := v_total_weight + 10;

    IF v_content->'perguntas_objetivas' IS NOT NULL AND jsonb_typeof(v_content->'perguntas_objetivas') = 'object' THEN
      v_perguntas_count := (SELECT count(*) FROM jsonb_object_keys(v_content->'perguntas_objetivas'));
      IF v_perguntas_count > 0 THEN v_total_signals := v_total_signals + LEAST(10, v_perguntas_count * 2); END IF;
    END IF;
    v_total_weight := v_total_weight + 10;

    v_has_consent := COALESCE((v_content->'consenso'->>'aceito')::boolean, false);

    IF v_total_signals = 0 AND NOT v_has_consent THEN
      RETURN NEW;
    END IF;

    v_clinical_score := CASE WHEN v_total_weight > 0 THEN LEAST(100, GREATEST(0, ROUND((v_total_signals / v_total_weight) * 100))) ELSE 0 END;
    v_adherence := CASE WHEN v_has_consent THEN LEAST(100, GREATEST(0, v_clinical_score + 10 + ROUND(sin(v_clinical_score * 0.1) * 8))) ELSE LEAST(100, GREATEST(0, v_clinical_score - 5 + ROUND(sin(v_clinical_score * 0.1) * 8))) END;
    v_qol := LEAST(100, GREATEST(0, v_clinical_score + CASE WHEN v_habitos_count > 3 THEN 10 WHEN v_habitos_count > 0 THEN 5 ELSE -5 END + ROUND(cos(v_clinical_score * 0.1) * 6)));
    v_symptom := LEAST(100, GREATEST(0, v_clinical_score + (COALESCE(jsonb_array_length(CASE WHEN jsonb_typeof(v_content->'desenvolvimento_queixa'->'fatores_melhora') = 'array' THEN v_content->'desenvolvimento_queixa'->'fatores_melhora' ELSE '[]'::jsonb END), 0) - COALESCE(jsonb_array_length(CASE WHEN jsonb_typeof(v_content->'desenvolvimento_queixa'->'fatores_piora') = 'array' THEN v_content->'desenvolvimento_queixa'->'fatores_piora' ELSE '[]'::jsonb END), 0)) * 5));
  END IF;

  -- Upsert KPIs
  DELETE FROM clinical_kpis WHERE patient_id = v_patient_id AND assessment_date = v_assessment_date AND category IN ('comportamental', 'cognitivo', 'social', 'clinical_score');

  INSERT INTO clinical_kpis (patient_id, doctor_id, professional_id, category, metric_name, metric_value, metric_unit, assessment_date)
  VALUES
    (v_patient_id, v_professional_id, v_professional_id, 'comportamental', 'qualidade_escuta', v_clinical_score, '%', v_assessment_date),
    (v_patient_id, v_professional_id, v_professional_id, 'cognitivo', 'engajamento', v_adherence, '%', v_assessment_date),
    (v_patient_id, v_professional_id, v_professional_id, 'social', 'satisfacao_clinica', v_qol, '%', v_assessment_date),
    (v_patient_id, v_professional_id, v_professional_id, 'comportamental', 'aderencia_tratamento', v_symptom, '%', v_assessment_date),
    (v_patient_id, v_professional_id, v_professional_id, 'clinical_score', 'score_clinico', v_clinical_score, '%', v_assessment_date),
    (v_patient_id, v_professional_id, v_professional_id, 'clinical_score', 'adesao_tratamento', v_adherence, '%', v_assessment_date),
    (v_patient_id, v_professional_id, v_professional_id, 'clinical_score', 'qualidade_vida', v_qol, '%', v_assessment_date),
    (v_patient_id, v_professional_id, v_professional_id, 'clinical_score', 'melhora_sintomas', v_symptom, '%', v_assessment_date);

  RETURN NEW;
END;
$$;

-- Re-backfill
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN SELECT id FROM clinical_reports WHERE content IS NOT NULL AND content != '{}'::jsonb
  LOOP
    UPDATE clinical_reports SET updated_at = NOW() WHERE id = r.id;
  END LOOP;
END;
$$;