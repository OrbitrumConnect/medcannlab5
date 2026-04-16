-- Expand the category check constraint to allow 'clinical_score' and 'neurologico'
ALTER TABLE clinical_kpis DROP CONSTRAINT clinical_kpis_category_check;
ALTER TABLE clinical_kpis ADD CONSTRAINT clinical_kpis_category_check 
  CHECK (category = ANY (ARRAY['comportamental','cognitivo','social','fisico','emocional','clinical_score','neurologico','semantic']));

-- Now backfill existing reports by touching them to fire the trigger
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