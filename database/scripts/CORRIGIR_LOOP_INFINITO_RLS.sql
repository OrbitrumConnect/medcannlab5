-- ==============================================================================
-- CORREÇÃO CRÍTICA: QUEBRA DE LOOP INFINITO DE RLS (ERRO 500)
-- ==============================================================================
-- Problema: A tabela 'users' consulta 'appointments' (para ver vínculos)
-- E a tabela 'appointments' consulta 'users' (para ver se é admin)
-- Isso cria um ciclo infinito.
-- Solução: Usar auth.users para verificar se é Admin, evitando consultar public.users.

-- 1. Corrigir Policy de APPOINTMENTS
DROP POLICY IF EXISTS "Admin can view all appointments" ON appointments;

CREATE POLICY "Admin can view all appointments" ON appointments
FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM auth.users
        WHERE id = auth.uid() 
        AND (raw_user_meta_data->>'type' IN ('admin', 'master', 'gestor'))
    )
);

-- 2. Corrigir Policy de USERS (Só para garantir)
DROP POLICY IF EXISTS "Admin can view all users" ON users;
CREATE POLICY "Admin can view all users" ON users
FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM auth.users
        WHERE id = auth.uid() 
        AND (raw_user_meta_data->>'type' IN ('admin', 'master', 'gestor'))
    )
);

-- 3. Corrigir Policy de PATIENT_MEDICAL_RECORDS (Segurança Extra)
DROP POLICY IF EXISTS "Admin can view all medical records" ON patient_medical_records;
CREATE POLICY "Admin can view all medical records" ON patient_medical_records
FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM auth.users
        WHERE id = auth.uid() 
        AND (raw_user_meta_data->>'type' IN ('admin', 'master', 'gestor'))
    )
);

SELECT '✅ Loop de RLS quebrado com sucesso. Admin checks movidos para auth.users.' as status;
