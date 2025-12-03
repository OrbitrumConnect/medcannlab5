-- =====================================================
-- CORRIGIR RLS PARA clinical_assessments
-- =====================================================
-- Permite que profissionais e admins insiram avaliações
-- Verifica tanto a tabela profiles quanto users

-- Remover políticas antigas
DROP POLICY IF EXISTS "Professionals can insert assessments" ON clinical_assessments;
DROP POLICY IF EXISTS "Professionals can view their assessments" ON clinical_assessments;
DROP POLICY IF EXISTS "Professionals can view patient assessments" ON clinical_assessments;
DROP POLICY IF EXISTS "Professionals can update assessments" ON clinical_assessments;
DROP POLICY IF EXISTS "Pacientes podem criar avaliações" ON clinical_assessments;
DROP POLICY IF EXISTS "Profissionais podem ver avaliações de seus pacientes" ON clinical_assessments;
DROP POLICY IF EXISTS "Profissionais podem atualizar avaliações" ON clinical_assessments;

-- Política de SELECT: Profissionais podem ver avaliações de seus pacientes
-- NOTA: Admins NÃO têm acesso aos históricos de pacientes
CREATE POLICY "Professionals can view patient assessments" ON clinical_assessments 
  FOR SELECT USING (
    -- Profissional pode ver se é o doctor_id
    auth.uid() = doctor_id OR
    -- Paciente pode ver suas próprias avaliações
    auth.uid() = patient_id
    -- Admins NÃO têm acesso
  );

-- Política de INSERT: Profissionais podem inserir avaliações
-- NOTA: Admins NÃO podem inserir avaliações
CREATE POLICY "Professionals can insert assessments" ON clinical_assessments 
  FOR INSERT WITH CHECK (
    -- Verifica se é profissional na tabela profiles
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND type = 'professional'
    ) OR
    -- Verifica se é profissional na tabela users
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() 
      AND type IN ('professional', 'profissional')
    ) OR
    -- Paciente pode criar suas próprias avaliações
    auth.uid() = patient_id
  );

-- Política de UPDATE: Profissionais podem atualizar avaliações de seus pacientes
-- NOTA: Admins NÃO podem atualizar avaliações
CREATE POLICY "Professionals can update assessments" ON clinical_assessments 
  FOR UPDATE USING (
    -- Profissional pode atualizar se é o doctor_id
    auth.uid() = doctor_id OR
    -- Paciente pode atualizar suas próprias avaliações
    auth.uid() = patient_id
    -- Admins NÃO têm acesso
  )
  WITH CHECK (
    auth.uid() = doctor_id OR
    auth.uid() = patient_id
  );

-- Comentários
COMMENT ON POLICY "Professionals can view patient assessments" ON clinical_assessments IS 
  'Permite que profissionais vejam avaliações de seus pacientes e pacientes vejam suas próprias avaliações. Admins NÃO têm acesso.';

COMMENT ON POLICY "Professionals can insert assessments" ON clinical_assessments IS 
  'Permite que profissionais e pacientes insiram avaliações clínicas. Admins NÃO podem inserir.';

COMMENT ON POLICY "Professionals can update assessments" ON clinical_assessments IS 
  'Permite que profissionais atualizem avaliações de seus pacientes e pacientes atualizem suas próprias avaliações. Admins NÃO têm acesso.';

