-- First remove ai_assessment_scores referencing reports that will be deleted
DELETE FROM ai_assessment_scores
WHERE assessment_id IN (
  SELECT id FROM (
    SELECT id,
      ROW_NUMBER() OVER (PARTITION BY patient_id, patient_name ORDER BY created_at DESC) as rn
    FROM clinical_reports
  ) ranked WHERE rn > 1
);

-- Now deduplicate clinical_reports keeping only the most recent per patient
DELETE FROM clinical_reports
WHERE id IN (
  SELECT id FROM (
    SELECT id,
      ROW_NUMBER() OVER (PARTITION BY patient_id, patient_name ORDER BY created_at DESC) as rn
    FROM clinical_reports
  ) ranked WHERE rn > 1
);