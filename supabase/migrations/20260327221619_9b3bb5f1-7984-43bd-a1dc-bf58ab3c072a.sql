-- Backfill Carolina's report: link professional and trigger KPI re-calculation
UPDATE clinical_reports 
SET 
  professional_id = '2135f0c0-eb5a-43b1-bc00-5f8dfea13561',
  professional_name = 'Dr. Ricardo Valença',
  doctor_id = '2135f0c0-eb5a-43b1-bc00-5f8dfea13561',
  shared_with = ARRAY['2135f0c0-eb5a-43b1-bc00-5f8dfea13561'::uuid],
  updated_at = NOW()
WHERE id = '00ade581-858e-496f-8167-743848b68d3f'
  AND patient_id = '5c98c123-83f9-4e66-9fb7-3f05a5431cc0';