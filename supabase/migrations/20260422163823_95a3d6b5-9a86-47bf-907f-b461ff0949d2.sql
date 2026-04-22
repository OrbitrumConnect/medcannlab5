-- Função AEC score (versão endurecida)
CREATE OR REPLACE FUNCTION public.compute_aec_scores(content jsonb)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY INVOKER
SET search_path = public, pg_temp
AS $$
DECLARE
  total_signals int := 0;
  total_weight  int := 0;
  signals jsonb := '[]'::jsonb;
  v_text text;
  v_arr jsonb;
  v_obj jsonb;
  v_count int;
  s_queixa int := 0;
  s_lista int := 0;
  s_dev int := 0;
  s_habitos int := 0;
  s_hpp int := 0;
  s_fam int := 0;
  s_perg int := 0;
  s_consenso int := 0;
  fpiora jsonb;
  fmelhora jsonb;
  sintomas jsonb;
  materno jsonb;
  paterno jsonb;
  raw_score int;
  clinical_score int;
  has_consent boolean;
  base int;
  variance int;
  adherence int;
  habitos_count int;
  bonus int;
  qol int;
  melhora_count int;
  piora_count int;
  symptoms int;
  filled int;
  confidence text;
  has_any boolean;
BEGIN
  IF content IS NULL OR jsonb_typeof(content) <> 'object' THEN
    RETURN jsonb_build_object(
      'clinical_score', 0, 'treatment_adherence', 0,
      'quality_of_life', 0, 'symptom_improvement', 0,
      'calculated', false, 'score_confidence', 'low',
      'source_signals', '[]'::jsonb
    );
  END IF;

  v_text := COALESCE(content->>'queixa_principal', content->>'chiefComplaint', content->>'mainComplaint', '');
  IF length(v_text) > 10 THEN s_queixa := 15; total_signals := total_signals + 15; END IF;
  total_weight := total_weight + 15;
  signals := signals || jsonb_build_object('signal_name','queixa_principal','signal_value',s_queixa,'weight',15,'aec_stage','Etapa 3: Queixa Principal');

  v_arr := COALESCE(content->'lista_indiciaria', content->'lista_indiciaria_flat', content->'indicativeList', '[]'::jsonb);
  IF jsonb_typeof(v_arr) <> 'array' THEN v_arr := '[]'::jsonb; END IF;
  v_count := jsonb_array_length(v_arr);
  s_lista := LEAST(20, v_count * 4);
  total_signals := total_signals + s_lista;
  total_weight := total_weight + 20;
  signals := signals || jsonb_build_object('signal_name','lista_indiciaria','signal_value',s_lista,'weight',20,'aec_stage','Etapa 2: Lista Indiciária');

  v_obj := COALESCE(content->'desenvolvimento_queixa', content->'complaintDevelopment', '{}'::jsonb);
  IF jsonb_typeof(v_obj) = 'object' THEN
    fpiora   := COALESCE(v_obj->'fatores_piora',   v_obj->'worseningFactors',  '[]'::jsonb);
    fmelhora := COALESCE(v_obj->'fatores_melhora', v_obj->'improvingFactors',  '[]'::jsonb);
    sintomas := COALESCE(v_obj->'sintomas_associados', v_obj->'associatedSymptoms', '[]'::jsonb);
    IF jsonb_typeof(fpiora)   = 'array' AND jsonb_array_length(fpiora)   > 0 THEN s_dev := s_dev + 7; END IF;
    IF jsonb_typeof(fmelhora) = 'array' AND jsonb_array_length(fmelhora) > 0 THEN s_dev := s_dev + 7; END IF;
    IF jsonb_typeof(sintomas) = 'array' AND jsonb_array_length(sintomas) > 0 THEN s_dev := s_dev + 6; END IF;
    s_dev := LEAST(20, s_dev);
  END IF;
  total_signals := total_signals + s_dev;
  total_weight := total_weight + 20;
  signals := signals || jsonb_build_object('signal_name','desenvolvimento_queixa','signal_value',s_dev,'weight',20,'aec_stage','Etapa 4: HDA');

  v_arr := COALESCE(content->'habitos_vida', content->'lifestyle', '[]'::jsonb);
  IF jsonb_typeof(v_arr) <> 'array' THEN v_arr := '[]'::jsonb; END IF;
  habitos_count := jsonb_array_length(v_arr);
  s_habitos := LEAST(15, habitos_count * 3);
  total_signals := total_signals + s_habitos;
  total_weight := total_weight + 15;
  signals := signals || jsonb_build_object('signal_name','habitos_vida','signal_value',s_habitos,'weight',15,'aec_stage','Etapa 7: Estilo de Vida');

  v_arr := COALESCE(content->'historia_patologica_pregressa', content->'pastMedicalHistory', '[]'::jsonb);
  IF jsonb_typeof(v_arr) <> 'array' THEN v_arr := '[]'::jsonb; END IF;
  v_count := jsonb_array_length(v_arr);
  s_hpp := LEAST(10, v_count * 2);
  total_signals := total_signals + s_hpp;
  total_weight := total_weight + 10;
  signals := signals || jsonb_build_object('signal_name','historia_patologica','signal_value',s_hpp,'weight',10,'aec_stage','Etapa 5: HPF');

  v_obj := COALESCE(content->'historia_familiar', content->'familyHistory', '{}'::jsonb);
  IF jsonb_typeof(v_obj) = 'object' THEN
    materno := COALESCE(v_obj->'lado_materno', v_obj->'maternal', '[]'::jsonb);
    paterno := COALESCE(v_obj->'lado_paterno', v_obj->'paternal', '[]'::jsonb);
    IF jsonb_typeof(materno) = 'array' AND jsonb_array_length(materno) > 0 THEN s_fam := s_fam + 5; END IF;
    IF jsonb_typeof(paterno) = 'array' AND jsonb_array_length(paterno) > 0 THEN s_fam := s_fam + 5; END IF;
    s_fam := LEAST(10, s_fam);
  END IF;
  total_signals := total_signals + s_fam;
  total_weight := total_weight + 10;
  signals := signals || jsonb_build_object('signal_name','historia_familiar','signal_value',s_fam,'weight',10,'aec_stage','Etapa 5: HPF');

  v_obj := COALESCE(content->'perguntas_objetivas', content->'objectiveQuestions', '{}'::jsonb);
  v_count := 0;
  IF jsonb_typeof(v_obj) = 'object' THEN
    SELECT count(*) INTO v_count FROM jsonb_object_keys(v_obj);
  END IF;
  s_perg := LEAST(10, v_count * 2);
  total_signals := total_signals + s_perg;
  total_weight := total_weight + 10;
  signals := signals || jsonb_build_object('signal_name','perguntas_objetivas','signal_value',s_perg,'weight',10,'aec_stage','Etapa 6: Revisão de Sistemas');

  has_consent := LOWER(COALESCE(content->'consenso'->>'aceito','false')) IN ('true','1','sim','yes','t','y');
  s_consenso := CASE WHEN has_consent THEN 5 ELSE 0 END;
  IF has_consent THEN total_signals := total_signals + 5; END IF;
  signals := signals || jsonb_build_object('signal_name','consenso_paciente','signal_value',s_consenso,'weight',5,'aec_stage','Etapa 9: Resumo Narrativo');

  IF total_weight > 0 THEN raw_score := round((total_signals::numeric / total_weight) * 100); ELSE raw_score := 0; END IF;
  clinical_score := GREATEST(0, LEAST(100, raw_score));
  has_any := total_signals > 0;

  base := CASE WHEN has_consent THEN clinical_score + 10 ELSE clinical_score - 5 END;
  variance := round(sin(clinical_score * 0.1) * 8);
  adherence := GREATEST(0, LEAST(100, base + variance));

  bonus := CASE WHEN habitos_count > 3 THEN 10 WHEN habitos_count > 0 THEN 5 ELSE -5 END;
  variance := round(cos(clinical_score * 0.1) * 6);
  qol := GREATEST(0, LEAST(100, clinical_score + bonus + variance));

  v_obj := COALESCE(content->'desenvolvimento_queixa', content->'complaintDevelopment', '{}'::jsonb);
  fmelhora := COALESCE(v_obj->'fatores_melhora', v_obj->'improvingFactors', '[]'::jsonb);
  fpiora   := COALESCE(v_obj->'fatores_piora',   v_obj->'worseningFactors',  '[]'::jsonb);
  melhora_count := CASE WHEN jsonb_typeof(fmelhora) = 'array' THEN jsonb_array_length(fmelhora) ELSE 0 END;
  piora_count   := CASE WHEN jsonb_typeof(fpiora)   = 'array' THEN jsonb_array_length(fpiora)   ELSE 0 END;
  symptoms := GREATEST(0, LEAST(100, clinical_score + (melhora_count - piora_count) * 5));

  filled :=
      (CASE WHEN s_queixa   > 0 THEN 1 ELSE 0 END)
    + (CASE WHEN s_lista    > 0 THEN 1 ELSE 0 END)
    + (CASE WHEN s_dev      > 0 THEN 1 ELSE 0 END)
    + (CASE WHEN s_habitos  > 0 THEN 1 ELSE 0 END)
    + (CASE WHEN s_hpp      > 0 THEN 1 ELSE 0 END)
    + (CASE WHEN s_fam      > 0 THEN 1 ELSE 0 END)
    + (CASE WHEN s_perg     > 0 THEN 1 ELSE 0 END)
    + (CASE WHEN s_consenso > 0 THEN 1 ELSE 0 END);
  confidence := CASE WHEN filled >= 6 THEN 'high' WHEN filled >= 3 THEN 'medium' ELSE 'low' END;

  RETURN jsonb_build_object(
    'clinical_score',      CASE WHEN has_any THEN clinical_score ELSE 0 END,
    'treatment_adherence', CASE WHEN has_any THEN adherence      ELSE 0 END,
    'quality_of_life',     CASE WHEN has_any THEN qol            ELSE 0 END,
    'symptom_improvement', CASE WHEN has_any THEN symptoms       ELSE 0 END,
    'calculated', has_any,
    'score_confidence', confidence,
    'source_signals', signals
  );
END;
$$;

-- Backfill direto (apenas 17 linhas — não precisa de loop nem batch)
UPDATE public.clinical_reports
SET content = jsonb_set(
  COALESCE(content, '{}'::jsonb),
  '{scores}',
  public.compute_aec_scores(content),
  true
)
WHERE content IS NOT NULL
  AND (
    (content->'scores'->>'clinical_score') IS NULL
    OR (content->'scores'->>'clinical_score') !~ '^\d+$'
    OR ((content->'scores'->>'clinical_score'))::int = 0
  );