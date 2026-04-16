-- ====================================================================
-- SCRIPT DE DESBLOQUEIO DE RLS (ROW LEVEL SECURITY)
-- Objetivo: Permitir que "Profissionais" cadastrem "Pacientes"
-- ====================================================================

-- 1. Permitir que o profissional insira o paciente na tabela global de usuários
DROP POLICY IF EXISTS "Permitir profissionais cadastrarem pacientes" ON public.users;
CREATE POLICY "Permitir profissionais cadastrarem pacientes" 
ON public.users
FOR INSERT 
TO authenticated 
WITH CHECK (
  -- O tipo do usuário a ser inserido tem que ser pacote/patient
  type IN ('paciente', 'patient', 'Paciente', 'Patient')
);

-- 2. Permitir que o profissional assinale a role de 'paciente' em user_roles
DROP POLICY IF EXISTS "Permitir profissionais delegarem role paciente" ON public.user_roles;
CREATE POLICY "Permitir profissionais delegarem role paciente" 
ON public.user_roles
FOR INSERT 
TO authenticated 
WITH CHECK (
  role IN ('paciente', 'patient', 'Paciente', 'Patient')
);

-- 3. Certificar que a inserção primária na clínica passe
DROP POLICY IF EXISTS "Permitir profissional iniciar anamnese" ON public.clinical_assessments;
CREATE POLICY "Permitir profissional iniciar anamnese" 
ON public.clinical_assessments
FOR INSERT 
TO authenticated 
WITH CHECK (
  doctor_id = auth.uid() OR doctor_id IS NOT NULL
);

-- 4. Permitir que o agendamento invisível de vinculo (Step 4) passe
DROP POLICY IF EXISTS "Permitir profissional agendar paciente" ON public.appointments;
CREATE POLICY "Permitir profissional agendar paciente" 
ON public.appointments
FOR INSERT 
TO authenticated 
WITH CHECK (
  professional_id = auth.uid() OR doctor_id = auth.uid()
);
