-- ====================================================================
-- SCRIPT DE ENGENHARIA DE RLS E COMPLIANCE DEFINITIVO (NÍVEL HOSPITALAR)
-- Arquitetura "Envelope Vazio": Médico Insere (INSERT), Paciente Preenche (UPDATE)
-- ====================================================================

-- 1. Criação de Paciente Segura (users): SÓ profissionais logados podem injetar.
DROP POLICY IF EXISTS "Permitir profissionais cadastrarem pacientes" ON public.users;
DROP POLICY IF EXISTS "Profissional cria paciente" ON public.users;

CREATE POLICY "Profissional cria paciente"
ON public.users
FOR INSERT
TO authenticated
WITH CHECK (
  type = 'paciente'
  AND EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = auth.uid()
    AND ur.role = 'profissional'::app_role
  )
);

-- 2. Inserção de Cargo Segura (user_roles): SÓ profissionais injetam a role.
DROP POLICY IF EXISTS "Permitir profissionais delegarem role paciente" ON public.user_roles;
DROP POLICY IF EXISTS "Profissional pode criar paciente" ON public.user_roles;
DROP POLICY IF EXISTS "Profissional assinala cargo paciente" ON public.user_roles;

CREATE POLICY "Profissional assinala cargo paciente"
ON public.user_roles
FOR INSERT
TO authenticated
WITH CHECK (
  role = 'paciente'::app_role
  AND EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = auth.uid()
    AND ur.role = 'profissional'::app_role
  )
);

-- 3. Anamnese (clinical_assessments): Separação de Responsabilidades (LGPD/CFM)
DROP POLICY IF EXISTS "Permitir profissional iniciar anamnese" ON public.clinical_assessments;
DROP POLICY IF EXISTS "Paciente cria sua propria avaliacao" ON public.clinical_assessments;
DROP POLICY IF EXISTS "Permitir inicio ou autopreenchimento de avaliacao" ON public.clinical_assessments;
DROP POLICY IF EXISTS "Medico cria envelope vazio" ON public.clinical_assessments;
DROP POLICY IF EXISTS "Paciente preenche avaliacao" ON public.clinical_assessments;

-- A: Médico cria o envelope vazio (INSERT)
CREATE POLICY "Medico cria envelope vazio"
ON public.clinical_assessments
FOR INSERT
TO authenticated
WITH CHECK (
  doctor_id = auth.uid()
  AND status = 'pending'
  AND patient_id IS NOT NULL
);

-- B: Paciente preenche os dados do seu próprio envelope (UPDATE)
CREATE POLICY "Paciente preenche avaliacao"
ON public.clinical_assessments
FOR UPDATE
TO authenticated
USING (
  patient_id = auth.uid()
)
WITH CHECK (
  patient_id = auth.uid()
);

-- C: O médico (e apenas ele) visualiza os reports delegados a ele (SELECT)
DROP POLICY IF EXISTS "Medico visualiza avaliacoes do seu portifolio" ON public.clinical_assessments;

CREATE POLICY "Medico visualiza avaliacoes do seu portifolio"
ON public.clinical_assessments
FOR SELECT
TO authenticated
USING (
  doctor_id = auth.uid() 
  OR 
  EXISTS (
    SELECT 1 FROM appointments a
    WHERE a.patient_id = clinical_assessments.patient_id
    AND a.professional_id = auth.uid()
  )
);
