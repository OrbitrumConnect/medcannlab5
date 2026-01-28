-- ==============================================================================
-- CORREÇÃO DE RLS PARA PROFISSIONAIS (Permitir acesso aos Pacientes Vinculados)
-- ==============================================================================

-- 1. Permitir que Profissionais vejam o PERFIL (users) dos seus pacientes
DROP POLICY IF EXISTS "Professionals can view assigned patients" ON users;

CREATE POLICY "Professionals can view assigned patients" ON users
FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM appointments a
        WHERE a.professional_id = auth.uid()
        AND a.patient_id = users.id
    )
    OR
    EXISTS (
        SELECT 1 FROM clinical_assessments ca
        WHERE ca.doctor_id = auth.uid()
        AND ca.patient_id = users.id
    )
);

-- 2. Permitir que Profissionais vejam PRONTUÁRIOS (patient_medical_records)
DROP POLICY IF EXISTS "Professionals can view assigned medical records" ON patient_medical_records;

CREATE POLICY "Professionals can view assigned medical records" ON patient_medical_records
FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM appointments a
        WHERE a.professional_id = auth.uid()
        AND a.patient_id = patient_medical_records.patient_id
    )
);

-- 3. Permitir que Profissionais vejam TRANSAÇÕES (transactions) se necessário
-- (Opcional, adicione se precisar ver pagamentos do paciente)

-- 4. Garantir que Admins continuem vendo tudo (Reforço)
DROP POLICY IF EXISTS "Admin can view all users" ON users;
CREATE POLICY "Admin can view all users" ON users
FOR SELECT USING (
    (SELECT raw_user_meta_data->>'type' FROM auth.users WHERE id = auth.uid()) IN ('admin', 'master', 'gestor')
);

-- RAISE NOTICE '✅ Permissões de Profissional atualizadas com sucesso!';
SELECT '✅ Permissões de Profissional atualizadas com sucesso!' as status;
