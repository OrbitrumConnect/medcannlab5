-- ==============================================================================
-- CORREÇÃO FINAL DE LOOP INFINITO RLS (CLINICAL_ASSESSMENTS)
-- ==============================================================================
-- O erro persiste porque a tabela 'users' consulta 'clinical_assessments'.
-- Se 'clinical_assessments' consultar 'users', o ciclo continua.
-- Vamos corrigir TODOS os pontos possíveis.

-- 1. Corrigir CLINICAL_ASSESSMENTS (Admin Check via auth.users)
DROP POLICY IF EXISTS "Admin can view all clinical assessments" ON clinical_assessments;
DROP POLICY IF EXISTS "Admins can view all assessments" ON clinical_assessments;

CREATE POLICY "Admin can view all clinical assessments" ON clinical_assessments
FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM auth.users
        WHERE id = auth.uid() 
        AND (raw_user_meta_data->>'type' IN ('admin', 'master', 'gestor'))
    )
);

-- 2. Garantir que APPOINTMENTS está correto (Reaplicando para certeza)
DROP POLICY IF EXISTS "Admin can view all appointments" ON appointments;

CREATE POLICY "Admin can view all appointments" ON appointments
FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM auth.users
        WHERE id = auth.uid() 
        AND (raw_user_meta_data->>'type' IN ('admin', 'master', 'gestor'))
    )
);

-- 3. Garantir que USERS está correto
DROP POLICY IF EXISTS "Admin can view all users" ON users;

CREATE POLICY "Admin can view all users" ON users
FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM auth.users
        WHERE id = auth.uid() 
        AND (raw_user_meta_data->>'type' IN ('admin', 'master', 'gestor'))
    )
);

-- 4. Corrigir VISIBILIDADE DOS PACIENTES (RLS mais eficiente para profissionais)
-- Removendo a query complexa se possível, mas mantendo a lógica necessária.
-- A política abaixo é segura SE appointments/assessments não consultarem users.
-- Como corrigimos acima, deve funcionar agora.

SELECT '✅ Correção Final Aplicada: Clinical Assessments e Appointments isolados de Users.' as status;
