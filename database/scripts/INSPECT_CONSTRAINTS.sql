-- Inspect constraints on clinical_reports
SELECT 
    conname as constraint_name,
    pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conrelid = 'public.clinical_reports'::regclass;
