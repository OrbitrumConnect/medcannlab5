-- =====================================================
-- FIX: share_report_with_doctors RPC
-- =====================================================

CREATE OR REPLACE FUNCTION share_report_with_doctors(
  p_report_id TEXT,
  p_patient_id UUID,
  p_doctor_ids UUID[]
)
RETURNS JSONB AS $$
DECLARE
  v_result JSONB;
  v_doctor_id UUID;
  v_doctor_name TEXT;
BEGIN
  -- 1. Check if report exists and matches patient_id
  -- We cast patient_id to TEXT to match clinical_reports.patient_id if it is text
  IF NOT EXISTS (
    SELECT 1 FROM clinical_reports 
    WHERE id = p_report_id AND patient_id = p_patient_id::TEXT
  ) THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Relatório não encontrado ou não pertence ao paciente'
    );
  END IF;

  -- 2. Update the report
  UPDATE clinical_reports
  SET 
    shared_with = p_doctor_ids,
    shared_at = NOW(),
    shared_by = p_patient_id,
    updated_at = NOW()
  WHERE id = p_report_id AND patient_id = p_patient_id::TEXT;

  -- 3. Create notifications for doctors
  FOR v_doctor_id IN SELECT unnest(p_doctor_ids)
  LOOP
    INSERT INTO notifications (
      id,
      type,
      title,
      message,
      data,
      user_id,
      user_type,
      created_at,
      read
    ) VALUES (
      gen_random_uuid()::TEXT,
      'report_shared',
      'Novo Relatório Compartilhado',
      'O paciente compartilhou um relatório com você.',
      jsonb_build_object(
        'report_id', p_report_id,
        'patient_id', p_patient_id,
        'shared_at', NOW()
      ),
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

-- Grant access
GRANT EXECUTE ON FUNCTION share_report_with_doctors(TEXT, UUID, UUID[]) TO authenticated;
GRANT EXECUTE ON FUNCTION share_report_with_doctors(TEXT, UUID, UUID[]) TO service_role;
