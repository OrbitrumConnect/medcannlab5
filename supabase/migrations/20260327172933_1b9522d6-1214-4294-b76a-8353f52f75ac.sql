-- Remove 4 orphan appointments (patient_id exists in auth.users but NOT in public.users)
-- All 4 are already cancelled so no data loss
DELETE FROM appointments WHERE patient_id = '46dd5787-fdec-4064-94ef-9ffcc73d64d1';

-- Also remove the cancelled appointment from Pedro admin (89821783) as it was a test
DELETE FROM appointments WHERE id = '89821783-1aa7-459e-ab93-7d495d918f18' AND status = 'cancelled';