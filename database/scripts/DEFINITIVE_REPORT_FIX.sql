-- =====================================================
-- DEFINITIVE FIX FOR CLINICAL_REPORTS CONSTRAINTS
-- =====================================================

-- 1. Drop the restrictive check constraint
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'clinical_reports_status_check' 
        AND conrelid = 'public.clinical_reports'::regclass
    ) THEN
        ALTER TABLE public.clinical_reports DROP CONSTRAINT clinical_reports_status_check;
    END IF;
END $$;

-- 2. Add a more permissive constraint that includes all current and future clinical statuses
-- statuses: generated, completed, shared, initial_assessment, nft_minted, saved_to_records
ALTER TABLE public.clinical_reports 
ADD CONSTRAINT clinical_reports_status_check 
CHECK (status IN (
    'generated', 
    'completed', 
    'shared', 
    'initial_assessment', 
    'nft_minted', 
    'saved_to_records',
    'pending',
    'archived'
));

-- 3. Ensure the RPC function uses these statuses correctly
CREATE OR REPLACE FUNCTION share_report_with_doctors(
  p_report_id TEXT,
  p_patient_id UUID,
  p_doctor_ids UUID[]
)
RETURNS JSONB AS $$
DECLARE
  v_doctor_id UUID;
BEGIN
  -- We use id::TEXT to handle both UUID and TEXT ID formats if they exist across environments
  IF NOT EXISTS (
    SELECT 1 FROM clinical_reports 
    WHERE id::TEXT = p_report_id AND (patient_id = p_patient_id OR patient_id::TEXT = p_patient_id::TEXT)
  ) THEN
    RETURN jsonb_build_object(
      'success', false, 
      'error', 'Relatório não encontrado ou permissão negada (Report ID: ' || p_report_id || ')'
    );
  END IF;

  UPDATE clinical_reports
  SET 
    shared_with = p_doctor_ids,
    shared_at = NOW(),
    shared_by = p_patient_id,
    -- Transition status to 'shared'
    status = 'shared',
    updated_at = NOW()
  WHERE id::TEXT = p_report_id;

  -- Notifications
  FOR v_doctor_id IN SELECT unnest(p_doctor_ids)
  LOOP
    INSERT INTO notifications (
      id, type, title, message, data, user_id, user_type, created_at, read
    ) VALUES (
      gen_random_uuid()::TEXT,
      'report_shared',
      'Novo Relatório Compartilhado',
      'O paciente compartilhou um relatório com você.',
      jsonb_build_object('report_id', p_report_id, 'patient_id', p_patient_id),
      v_doctor_id::TEXT,
      'professional',
      NOW(),
      false
    )
    ON CONFLICT (id) DO NOTHING;
  END LOOP;

  RETURN jsonb_build_object(
    'success', true,
    'message', 'Relatório compartilhado com sucesso'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION share_report_with_doctors(TEXT, UUID, UUID[]) TO authenticated;
GRANT EXECUTE ON FUNCTION share_report_with_doctors(TEXT, UUID, UUID[]) TO service_role;
