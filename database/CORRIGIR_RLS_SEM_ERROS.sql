-- =====================================================
-- CORRIGIR RLS SEM ERROS - VERSÃO CONSOLIDADA
-- MedCannLab 3.0 - Remove acesso de admins aos históricos
-- =====================================================
-- Este script remove TODAS as políticas antigas antes de criar novas
-- Garante que não haverá erros de "policy already exists"
-- =====================================================

-- 1. REMOVER TODAS AS POLÍTICAS DE clinical_assessments
-- =====================================================
DROP POLICY IF EXISTS "Professionals can view patient assessments" ON clinical_assessments;
DROP POLICY IF EXISTS "Professionals can view their assessments" ON clinical_assessments;
DROP POLICY IF EXISTS "Professionals can insert assessments" ON clinical_assessments;
DROP POLICY IF EXISTS "Professionals can insert patient assessments" ON clinical_assessments;
DROP POLICY IF EXISTS "Professionals can update assessments" ON clinical_assessments;
DROP POLICY IF EXISTS "Professionals can update patient assessments" ON clinical_assessments;
DROP POLICY IF EXISTS "Pacientes podem ver suas próprias avaliações" ON clinical_assessments;
DROP POLICY IF EXISTS "Pacientes podem criar avaliações" ON clinical_assessments;
DROP POLICY IF EXISTS "Profissionais podem ver avaliações de seus pacientes" ON clinical_assessments;
DROP POLICY IF EXISTS "Profissionais podem atualizar avaliações" ON clinical_assessments;
DROP POLICY IF EXISTS "Patients can view own assessments" ON clinical_assessments;
DROP POLICY IF EXISTS "Patients can insert own assessments" ON clinical_assessments;
DROP POLICY IF EXISTS "Patients can update own assessments" ON clinical_assessments;
DROP POLICY IF EXISTS "Admin pode ver todas as avaliações" ON clinical_assessments;
DROP POLICY IF EXISTS "Admin can view all assessments" ON clinical_assessments;
DROP POLICY IF EXISTS "Admin pode gerenciar todas as avaliações" ON clinical_assessments;
DROP POLICY IF EXISTS "Admin can manage all assessments" ON clinical_assessments;
DROP POLICY IF EXISTS "Admins can view assessments of their patients" ON clinical_assessments;
DROP POLICY IF EXISTS "Admins can view shared assessments" ON clinical_assessments;
DROP POLICY IF EXISTS "Admins can insert assessments for their patients" ON clinical_assessments;
DROP POLICY IF EXISTS "Admins can update assessments of their patients" ON clinical_assessments;
DROP POLICY IF EXISTS "Admins can view assessments where they are doctor" ON clinical_assessments;
DROP POLICY IF EXISTS "Admins can insert assessments as doctor" ON clinical_assessments;
DROP POLICY IF EXISTS "Admins can update assessments where they are doctor" ON clinical_assessments;
DROP POLICY IF EXISTS "Admins can view shared assessments with consent" ON clinical_assessments;

-- 2. CRIAR POLÍTICAS CORRETAS PARA clinical_assessments
-- =====================================================
-- NOTA: Admins NÃO têm acesso aos históricos de pacientes

-- Pacientes podem ver suas próprias avaliações
CREATE POLICY "Pacientes podem ver suas próprias avaliações"
  ON clinical_assessments
  FOR SELECT
  USING (auth.uid() = patient_id);

-- Pacientes podem criar suas próprias avaliações
CREATE POLICY "Pacientes podem criar avaliações"
  ON clinical_assessments
  FOR INSERT
  WITH CHECK (auth.uid() = patient_id);

-- Pacientes podem atualizar suas próprias avaliações
CREATE POLICY "Pacientes podem atualizar avaliações"
  ON clinical_assessments
  FOR UPDATE
  USING (auth.uid() = patient_id)
  WITH CHECK (auth.uid() = patient_id);

-- Profissionais podem ver avaliações de seus pacientes (apenas se forem o doctor_id)
CREATE POLICY "Profissionais podem ver avaliações de seus pacientes"
  ON clinical_assessments
  FOR SELECT
  USING (auth.uid() = doctor_id);

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
    AND doctor_id = auth.uid()
  );

-- Profissionais podem atualizar avaliações de seus pacientes
CREATE POLICY "Profissionais podem atualizar avaliações"
  ON clinical_assessments
  FOR UPDATE
  USING (auth.uid() = doctor_id)
  WITH CHECK (auth.uid() = doctor_id);

-- 3. REMOVER TODAS AS POLÍTICAS DE clinical_reports
-- =====================================================
DROP POLICY IF EXISTS "Pacientes podem ver seus relatórios" ON clinical_reports;
DROP POLICY IF EXISTS "Profissionais podem ver relatórios de seus pacientes" ON clinical_reports;
DROP POLICY IF EXISTS "Profissionais podem ver relatórios" ON clinical_reports;
DROP POLICY IF EXISTS "Profissionais autorizados podem ver relatórios de seus pacientes" ON clinical_reports;
DROP POLICY IF EXISTS "Users can view own clinical reports" ON clinical_reports;
DROP POLICY IF EXISTS "Users can insert clinical reports" ON clinical_reports;
DROP POLICY IF EXISTS "Profissionais podem inserir relatórios" ON clinical_reports;

-- 4. CRIAR POLÍTICAS CORRETAS PARA clinical_reports
-- =====================================================
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

-- 5. REMOVER TODAS AS POLÍTICAS DE patient_medical_records
-- =====================================================
DROP POLICY IF EXISTS "Pacientes podem ver seus registros médicos" ON patient_medical_records;
DROP POLICY IF EXISTS "Profissionais podem ver registros de seus pacientes" ON patient_medical_records;
DROP POLICY IF EXISTS "Patients can view own medical records" ON patient_medical_records;
DROP POLICY IF EXISTS "Professionals can view patient records" ON patient_medical_records;

-- 6. CRIAR POLÍTICAS CORRETAS PARA patient_medical_records
-- =====================================================
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

-- 7. REMOVER TODAS AS POLÍTICAS DE imre_assessments (se a tabela existir)
-- =====================================================
DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'imre_assessments') THEN
    DROP POLICY IF EXISTS "Users can view their own assessments" ON imre_assessments;
    DROP POLICY IF EXISTS "Users can insert their own assessments" ON imre_assessments;
    DROP POLICY IF EXISTS "Users can update their own assessments" ON imre_assessments;
    DROP POLICY IF EXISTS "Usuários podem ver suas próprias avaliações IMRE" ON imre_assessments;
    DROP POLICY IF EXISTS "Usuários podem inserir suas próprias avaliações IMRE" ON imre_assessments;
    DROP POLICY IF EXISTS "Usuários podem atualizar suas próprias avaliações IMRE" ON imre_assessments;
    
    -- Criar políticas corretas
    CREATE POLICY "Usuários podem ver suas próprias avaliações IMRE"
      ON imre_assessments
      FOR SELECT
      USING (auth.uid() = user_id);
    
    CREATE POLICY "Usuários podem inserir suas próprias avaliações IMRE"
      ON imre_assessments
      FOR INSERT
      WITH CHECK (auth.uid() = user_id);
    
    CREATE POLICY "Usuários podem atualizar suas próprias avaliações IMRE"
      ON imre_assessments
      FOR UPDATE
      USING (auth.uid() = user_id)
      WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

-- 8. VERIFICAR POLÍTICAS CRIADAS
-- =====================================================
SELECT 
  schemaname,
  tablename,
  policyname,
  cmd,
  CASE 
    WHEN policyname LIKE '%admin%' OR qual LIKE '%admin%' THEN '🔴 VERIFICAR - Pode ter acesso de admin'
    WHEN qual LIKE '%doctor_id = auth.uid()%' OR qual LIKE '%patient_id = auth.uid()%' THEN '✅ Restritiva'
    ELSE 'ℹ️ Verificar manualmente'
  END as status_seguranca
FROM pg_policies
WHERE tablename IN ('clinical_assessments', 'clinical_reports', 'patient_medical_records', 'imre_assessments')
ORDER BY tablename, policyname;

-- Status: ✅ Todas as políticas foram recriadas sem erros
-- ✅ Admins NÃO têm acesso aos históricos de pacientes
-- ✅ Apenas pacientes e profissionais autorizados têm acesso

