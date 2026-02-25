-- ==============================================================================
-- SOFT DELETE HARDENING (HOSPITAL GRADE SECURITY V2)
-- ==============================================================================
-- Description:
-- Adds 'deleted_at', 'deleted_by', and 'delete_reason' for full traceability.
-- Implements a secure whitelist-based function for logical deletion.
-- Updates RLS policies and link functions to enforce clinical data integrity.
-- ==============================================================================

-- 1. ADD AUDIT COLUMNS
-- ==============================================================================
DO $$ 
BEGIN 
    -- clinical_assessments
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'clinical_assessments' AND column_name = 'deleted_at') THEN
        ALTER TABLE clinical_assessments ADD COLUMN deleted_at timestamptz DEFAULT NULL;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'clinical_assessments' AND column_name = 'deleted_by') THEN
        ALTER TABLE clinical_assessments ADD COLUMN deleted_by uuid REFERENCES auth.users(id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'clinical_assessments' AND column_name = 'delete_reason') THEN
        ALTER TABLE clinical_assessments ADD COLUMN delete_reason text;
    END IF;

    -- appointments
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'appointments' AND column_name = 'deleted_at') THEN
        ALTER TABLE appointments ADD COLUMN deleted_at timestamptz DEFAULT NULL;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'appointments' AND column_name = 'deleted_by') THEN
        ALTER TABLE appointments ADD COLUMN deleted_by uuid REFERENCES auth.users(id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'appointments' AND column_name = 'delete_reason') THEN
        ALTER TABLE appointments ADD COLUMN delete_reason text;
    END IF;

    -- cfm_prescriptions (canonical table)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'cfm_prescriptions' AND column_name = 'deleted_at') THEN
        ALTER TABLE cfm_prescriptions ADD COLUMN deleted_at timestamptz DEFAULT NULL;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'cfm_prescriptions' AND column_name = 'deleted_by') THEN
        ALTER TABLE cfm_prescriptions ADD COLUMN deleted_by uuid REFERENCES auth.users(id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'cfm_prescriptions' AND column_name = 'delete_reason') THEN
        ALTER TABLE cfm_prescriptions ADD COLUMN delete_reason text;
    END IF;
END $$;

-- 2. SECURE SOFT DELETE FUNCTION (PRODUCTION GRADE)
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.soft_delete_record(
    p_table_name text,
    p_record_id uuid,
    p_reason text DEFAULT 'Not specified'
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_user_id uuid;
BEGIN
    -- 1. Safe Auth Resolution
    v_user_id := auth.uid();
    
    -- 2. Whitelist Protection
    IF p_table_name NOT IN (
        'clinical_assessments',
        'appointments',
        'cfm_prescriptions'
    ) THEN
        RAISE EXCEPTION 'Table % is not authorized for soft delete via this interface.', p_table_name;
    END IF;

    -- 3. Execute with Parameter Binding (Prevent Injection)
    EXECUTE format(
        'UPDATE %I SET 
            deleted_at = now(), 
            deleted_by = $1, 
            delete_reason = $2 
         WHERE id = $3 AND deleted_at IS NULL',
        p_table_name
    )
    USING v_user_id, p_reason, p_record_id;

    RETURN FOUND;
END;
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION public.soft_delete_record(text, uuid, text) TO authenticated;

-- 3. UPDATE VINCULO FUNCTION (EXCLUDE DELETED)
-- ==============================================================================
-- Atualiza a função de vínculo profissional-paciente para ignorar registros deletados.

CREATE OR REPLACE FUNCTION public.check_professional_patient_link(target_patient_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER 
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1 FROM appointments a
        WHERE a.professional_id = auth.uid()
        AND a.patient_id = target_patient_id
        AND a.deleted_at IS NULL
    )
    OR
    EXISTS (
        SELECT 1 FROM clinical_assessments ca
        WHERE ca.doctor_id = auth.uid()
        AND ca.patient_id = target_patient_id
        AND ca.deleted_at IS NULL
    );
$$;

-- 4. PARTIAL INDEXES FOR PERFORMANCE
-- ==============================================================================
CREATE INDEX IF NOT EXISTS idx_clinical_assessments_active ON clinical_assessments (patient_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_appointments_active ON appointments (patient_id, professional_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_cfm_prescriptions_active ON cfm_prescriptions (patient_id) WHERE deleted_at IS NULL;

-- 5. UPDATE RLS POLICIES (EXCLUDE DELETED)
-- ==============================================================================

-- APPOINTMENTS
DROP POLICY IF EXISTS "Admin can view all appointments" ON appointments;
CREATE POLICY "Admin can view all appointments" ON appointments FOR SELECT USING (
    (auth.jwt() -> 'user_metadata' ->> 'type') IN ('admin', 'master', 'gestor') AND deleted_at IS NULL
);
DROP POLICY IF EXISTS "Professionals can view own appointments" ON appointments;
CREATE POLICY "Professionals can view own appointments" ON appointments FOR SELECT USING (
    (professional_id = auth.uid() OR doctor_id = auth.uid()) AND deleted_at IS NULL
);
DROP POLICY IF EXISTS "Patients can view own appointments" ON appointments;
CREATE POLICY "Patients can view own appointments" ON appointments FOR SELECT USING (
    patient_id = auth.uid() AND deleted_at IS NULL
);

-- CLINICAL_ASSESSMENTS
DROP POLICY IF EXISTS "Admin can view all clinical assessments" ON clinical_assessments;
CREATE POLICY "Admin can view all clinical assessments" ON clinical_assessments FOR SELECT USING (
    (auth.jwt() -> 'user_metadata' ->> 'type') IN ('admin', 'master', 'gestor') AND deleted_at IS NULL
);
DROP POLICY IF EXISTS "Professionals can view own assessments" ON clinical_assessments;
CREATE POLICY "Professionals can view own assessments" ON clinical_assessments FOR SELECT USING (
    doctor_id = auth.uid() AND deleted_at IS NULL
);
DROP POLICY IF EXISTS "Patients can view own assessments" ON clinical_assessments;
CREATE POLICY "Patients can view own assessments" ON clinical_assessments FOR SELECT USING (
    patient_id = auth.uid() AND deleted_at IS NULL
);

-- CFM_PRESCRIPTIONS
DROP POLICY IF EXISTS "Profissionais podem ver suas prescrições" ON cfm_prescriptions;
CREATE POLICY "Profissionais podem ver suas prescrições" ON cfm_prescriptions FOR SELECT USING (
    auth.uid() = professional_id AND deleted_at IS NULL
);
DROP POLICY IF EXISTS "Pacientes podem ver suas prescrições" ON cfm_prescriptions;
CREATE POLICY "Pacientes podem ver suas prescrições" ON cfm_prescriptions FOR SELECT USING (
    auth.uid() = patient_id AND deleted_at IS NULL
);

-- 6. HUDSON RELOAD
-- ==============================================================================
NOTIFY pgrst, 'reload schema';
