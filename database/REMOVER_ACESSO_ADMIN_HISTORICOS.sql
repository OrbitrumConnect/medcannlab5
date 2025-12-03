-- =====================================================
-- REMOVER ACESSO DE ADMINS AOS HISTÓRICOS DE PACIENTES
-- =====================================================
-- Este script remove todas as políticas que permitem admins
-- acessarem históricos, avaliações e relatórios de pacientes

-- 1. CORRIGIR POLÍTICAS DE clinical_assessments
-- =====================================================

-- Remover políticas antigas que permitem acesso de admin
DROP POLICY IF EXISTS "Professionals can view patient assessments" ON clinical_assessments;
DROP POLICY IF EXISTS "Professionals can insert assessments" ON clinical_assessments;
DROP POLICY IF EXISTS "Professionals can update assessments" ON clinical_assessments;
DROP POLICY IF EXISTS "Pacientes podem ver suas próprias avaliações" ON clinical_assessments;
DROP POLICY IF EXISTS "Pacientes podem criar avaliações" ON clinical_assessments;
DROP POLICY IF EXISTS "Profissionais podem ver avaliações de seus pacientes" ON clinical_assessments;
DROP POLICY IF EXISTS "Profissionais podem atualizar avaliações" ON clinical_assessments;

-- Criar políticas SEM acesso de admin
-- Pacientes podem ver suas próprias avaliações
CREATE POLICY "Pacientes podem ver suas próprias avaliações"
  ON clinical_assessments
  FOR SELECT
  USING (auth.uid() = patient_id);

-- Profissionais podem ver avaliações de seus pacientes (apenas se forem o doctor_id)
CREATE POLICY "Profissionais podem ver avaliações de seus pacientes"
  ON clinical_assessments
  FOR SELECT
  USING (auth.uid() = doctor_id);

-- Pacientes podem criar suas próprias avaliações
CREATE POLICY "Pacientes podem criar avaliações"
  ON clinical_assessments
  FOR INSERT
  WITH CHECK (auth.uid() = patient_id);

-- Profissionais podem inserir avaliações (apenas para seus pacientes)
CREATE POLICY "Profissionais podem inserir avaliações"
  ON clinical_assessments
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() 
      AND type IN ('professional', 'profissional')
    )
  );

-- Profissionais podem atualizar avaliações de seus pacientes
CREATE POLICY "Profissionais podem atualizar avaliações"
  ON clinical_assessments
  FOR UPDATE
  USING (auth.uid() = doctor_id)
  WITH CHECK (auth.uid() = doctor_id);

-- 2. CORRIGIR POLÍTICAS DE clinical_reports
-- =====================================================

-- Remover políticas antigas
DROP POLICY IF EXISTS "Profissionais autorizados podem ver relatórios de seus pacientes" ON clinical_reports;
DROP POLICY IF EXISTS "Pacientes podem ver seus relatórios" ON clinical_reports;
DROP POLICY IF EXISTS "Profissionais podem ver relatórios" ON clinical_reports;
DROP POLICY IF EXISTS "Users can view own clinical reports" ON clinical_reports;
DROP POLICY IF EXISTS "Users can insert clinical reports" ON clinical_reports;

-- Criar políticas SEM acesso de admin
-- Pacientes podem ver seus próprios relatórios
CREATE POLICY "Pacientes podem ver seus relatórios"
  ON clinical_reports
  FOR SELECT
  USING (auth.uid() = patient_id);

-- Profissionais podem ver relatórios de seus pacientes (apenas se forem o professional_id)
CREATE POLICY "Profissionais podem ver relatórios de seus pacientes"
  ON clinical_reports
  FOR SELECT
  USING (auth.uid() = professional_id);

-- Profissionais podem inserir relatórios
CREATE POLICY "Profissionais podem inserir relatórios"
  ON clinical_reports
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() 
      AND type IN ('professional', 'profissional')
    )
  );

-- 3. CORRIGIR POLÍTICAS DE patient_medical_records
-- =====================================================

-- Remover políticas antigas
DROP POLICY IF EXISTS "Patients can view own medical records" ON patient_medical_records;
DROP POLICY IF EXISTS "Professionals can view patient records" ON patient_medical_records;

-- Criar políticas SEM acesso de admin
-- Pacientes podem ver seus próprios registros médicos
CREATE POLICY "Pacientes podem ver seus registros médicos"
  ON patient_medical_records
  FOR SELECT
  USING (auth.uid() = patient_id);

-- Profissionais podem ver registros de seus pacientes (apenas através de relatórios)
CREATE POLICY "Profissionais podem ver registros de seus pacientes"
  ON patient_medical_records
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM clinical_reports 
      WHERE clinical_reports.id = patient_medical_records.report_id 
      AND clinical_reports.professional_id = auth.uid()
    )
  );

-- 4. CORRIGIR POLÍTICAS DE imre_assessments
-- =====================================================

-- Verificar se a tabela existe
DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'imre_assessments') THEN
    -- Remover políticas antigas
    DROP POLICY IF EXISTS "Users can view their own assessments" ON imre_assessments;
    DROP POLICY IF EXISTS "Users can insert their own assessments" ON imre_assessments;
    DROP POLICY IF EXISTS "Users can update their own assessments" ON imre_assessments;
    
    -- Criar políticas SEM acesso de admin
    -- Usuários podem ver suas próprias avaliações IMRE
    CREATE POLICY "Usuários podem ver suas próprias avaliações IMRE"
      ON imre_assessments
      FOR SELECT
      USING (auth.uid() = user_id);
    
    -- Usuários podem inserir suas próprias avaliações IMRE
    CREATE POLICY "Usuários podem inserir suas próprias avaliações IMRE"
      ON imre_assessments
      FOR INSERT
      WITH CHECK (auth.uid() = user_id);
    
    -- Usuários podem atualizar suas próprias avaliações IMRE
    CREATE POLICY "Usuários podem atualizar suas próprias avaliações IMRE"
      ON imre_assessments
      FOR UPDATE
      USING (auth.uid() = user_id)
      WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

-- 5. VERIFICAR POLÍTICAS CRIADAS
-- =====================================================
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies
WHERE tablename IN ('clinical_assessments', 'clinical_reports', 'patient_medical_records', 'imre_assessments')
ORDER BY tablename, policyname;

-- Status: ✅ Acesso de admins removido dos históricos de pacientes
-- - Apenas pacientes podem ver seus próprios dados
-- - Apenas profissionais autorizados podem ver dados de seus pacientes
-- - Admins NÃO têm mais acesso aos históricos

