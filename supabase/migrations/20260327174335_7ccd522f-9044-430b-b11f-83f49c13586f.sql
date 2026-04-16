-- Fix backfill to skip records with invalid FK references
CREATE OR REPLACE FUNCTION public.backfill_clinical_kpis()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
SET row_security TO 'off'
AS $$
DECLARE
  r RECORD;
  v_content JSONB;
  v_patient_id UUID;
  v_professional_id UUID;
  v_assessment_date DATE;
  v_clinical_score NUMERIC;
  v_adherence NUMERIC;
  v_qol NUMERIC;
  v_symptom NUMERIC;
  v_total_signals NUMERIC;
  v_total_weight NUMERIC;
  v_lista_count INT;
BEGIN
  FOR r IN 
    SELECT cr.* FROM clinical_reports cr
    JOIN users u ON u.id = cr.patient_id
    WHERE cr.content IS NOT NULL AND cr.content != '{}'::jsonb
  LOOP
    v_content := r.content;
    v_patient_id := r.patient_id;
    v_professional_id := COALESCE(r.professional_id, r.doctor_id);
    v_assessment_date := COALESCE(r.generated_at::date, r.created_at::date, CURRENT_DATE);
    v_clinical_score := 0;
    v_adherence := 0;
    v_qol := 0;
    v_symptom := 0;
    v_total_signals := 0;
    v_total_weight := 0;

    IF v_content->'scores' IS NOT NULL AND COALESCE((v_content->'scores'->>'clinical_score')::numeric, 0) > 0 THEN
      v_clinical_score := (v_content->'scores'->>'clinical_score')::numeric;
      v_adherence := COALESCE((v_content->'scores'->>'treatment_adherence')::numeric, v_clinical_score);
      v_qol := COALESCE((v_content->'scores'->>'quality_of_life')::numeric, v_clinical_score);
      v_symptom := COALESCE((v_content->'scores'->>'symptom_improvement')::numeric, v_clinical_score);
    ELSE
      IF length(COALESCE(v_content->>'queixa_principal', '')) > 10 THEN v_total_signals := v_total_signals + 15; END IF;
      v_total_weight := v_total_weight + 15;

      v_lista_count := COALESCE(jsonb_array_length(CASE WHEN jsonb_typeof(v_content->'lista_indiciaria') = 'array' THEN v_content->'lista_indiciaria' ELSE '[]'::jsonb END), 0);
      IF v_lista_count > 0 THEN v_total_signals := v_total_signals + LEAST(20, v_lista_count * 4); END IF;
      v_total_weight := v_total_weight + 20 + 15 + 10 + 10 + 10;

      IF v_total_signals = 0 THEN CONTINUE; END IF;

      v_clinical_score := LEAST(100, GREATEST(0, ROUND((v_total_signals / v_total_weight) * 100)));
      v_adherence := LEAST(100, GREATEST(0, v_clinical_score - 5));
      v_qol := LEAST(100, GREATEST(0, v_clinical_score - 5));
      v_symptom := v_clinical_score;
    END IF;

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
  END LOOP;
END;
$$;

SELECT backfill_clinical_kpis();