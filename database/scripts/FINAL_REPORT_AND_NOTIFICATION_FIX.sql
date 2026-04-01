-- ====================================================================
-- FINAL REPORT AND NOTIFICATION FIX V3 - MEDCANNLAB (2026)
-- ====================================================================

-- 1. FIX CLINICAL REPORTS STATUS CONSTRAINT
-- Ensure ALL possible report statuses are allowed.
DO $$ 
BEGIN 
    IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'clinical_reports_status_check' AND conrelid = 'public.clinical_reports'::regclass) THEN 
        ALTER TABLE public.clinical_reports DROP CONSTRAINT clinical_reports_status_check; 
    END IF; 
END $$;

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
    'active', 
    'draft', 
    'reviewed'
));

-- 2. REDEFINE RPC FUNCTION FOR SHARING
-- Fixed UUID type mismatch for user_id in notifications table.
CREATE OR REPLACE FUNCTION share_report_with_doctors(
  p_report_id TEXT, 
  p_patient_id UUID, 
  p_doctor_ids UUID[]
)
RETURNS JSONB AS $$
DECLARE 
  v_doctor_id UUID;
BEGIN
  -- Verify ownership/existence
  IF NOT EXISTS (
    SELECT 1 FROM clinical_reports 
    WHERE id::TEXT = p_report_id AND (patient_id = p_patient_id OR patient_id::TEXT = p_patient_id::TEXT)
  ) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Relatório não encontrado ou permissão negada');
  END IF;

  -- Update report status to 'shared'
  UPDATE clinical_reports SET 
    shared_with = p_doctor_ids, 
    shared_at = NOW(), 
    shared_by = p_patient_id,
    status = 'shared', 
    updated_at = NOW()
  WHERE id::TEXT = p_report_id;
  
  -- Create notifications for doctors using 'is_read' and correct UUID type
  FOR v_doctor_id IN SELECT unnest(p_doctor_ids) LOOP
    INSERT INTO notifications (
      id, 
      type, 
      title, 
      message, 
      data, 
      user_id, -- Table expects UUID
      user_type, 
      is_read, 
      created_at
    )
    VALUES (
      gen_random_uuid()::TEXT, 
      'report_shared', 
      'Novo Relatório Compartilhado', 
      'Um paciente compartilhou um relatório clínico com você.', 
      jsonb_build_object('report_id', p_report_id, 'patient_id', p_patient_id), 
      v_doctor_id, -- v_doctor_id is already UUID
      'professional', 
      false, 
      NOW()
    )
    ON CONFLICT (id) DO NOTHING;
  END LOOP;

  RETURN jsonb_build_object('success', true, 'message', 'Relatório compartilhado com sucesso');
END; $$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. PERMISSIONS
GRANT EXECUTE ON FUNCTION share_report_with_doctors(TEXT, UUID, UUID[]) TO authenticated;
GRANT EXECUTE ON FUNCTION share_report_with_doctors(TEXT, UUID, UUID[]) TO service_role;
GRANT EXECUTE ON FUNCTION share_report_with_doctors(TEXT, UUID, UUID[]) TO anon;
