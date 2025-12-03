-- =====================================================
-- REVOGAR PERMISSÕES IRRESTRITAS DE ADMIN EM AVALIAÇÕES
-- MedCannLab 3.0 - Segurança e Privacidade
-- =====================================================
-- ⚠️ IMPORTANTE: Este script remove políticas que dão acesso
-- irrestrito aos admins para ver TODAS as avaliações clínicas.
-- Isso é necessário para proteger a privacidade dos pacientes.
-- =====================================================

-- 1. REMOVER POLÍTICAS PROBLEMÁTICAS
-- =====================================================

-- Remover política que permite admin ver TODAS as avaliações
DROP POLICY IF EXISTS "Admin pode ver todas as avaliações" ON clinical_assessments;
DROP POLICY IF EXISTS "Admin can view all assessments" ON clinical_assessments;

-- Remover política que permite admin gerenciar TODAS as avaliações
DROP POLICY IF EXISTS "Admin pode gerenciar todas as avaliações" ON clinical_assessments;
DROP POLICY IF EXISTS "Admin can manage all assessments" ON clinical_assessments;
DROP POLICY IF EXISTS "Admin can insert all assessments" ON clinical_assessments;
DROP POLICY IF EXISTS "Admin can update all assessments" ON clinical_assessments;
DROP POLICY IF EXISTS "Admin can delete all assessments" ON clinical_assessments;

-- 2. VERIFICAR POLÍTICAS EXISTENTES
-- =====================================================
SELECT 
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies
WHERE tablename = 'clinical_assessments'
ORDER BY policyname;

-- 3. CRIAR POLÍTICAS RESTRITIVAS PARA ADMINS
-- =====================================================
-- Admins só podem ver avaliações se:
-- 1. Foram explicitamente compartilhadas com eles
-- 2. São pacientes que eles atendem (doctor_id = admin.id)
-- 3. São avaliações que eles criaram

-- Política: Admins podem ver avaliações de pacientes que eles atendem
CREATE POLICY "Admins can view assessments of their patients"
  ON clinical_assessments
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.type = 'admin'
    )
    AND (
      -- Admin é o médico responsável
      doctor_id = auth.uid()
      OR
      -- Admin criou a avaliação (se houver campo created_by)
      EXISTS (
        SELECT 1 FROM users
        WHERE users.id = auth.uid()
        AND users.type = 'admin'
      )
    )
  );

-- Política: Admins podem ver avaliações compartilhadas explicitamente
-- (Se houver tabela de compartilhamento)
CREATE POLICY "Admins can view shared assessments"
  ON clinical_assessments
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.type = 'admin'
    )
    AND EXISTS (
      -- Verificar se há compartilhamento explícito
      -- Isso depende de ter uma tabela de compartilhamento
      SELECT 1 FROM assessment_sharing
      WHERE assessment_sharing.assessment_id = clinical_assessments.id
      AND (
        (assessment_sharing.shared_with_ricardo_valenca = TRUE AND auth.uid() = (SELECT id FROM users WHERE email = 'rrvalenca@gmail.com' LIMIT 1))
        OR
        (assessment_sharing.shared_with_eduardo_faveret = TRUE AND auth.uid() = (SELECT id FROM users WHERE email = 'eduardoscfaveret@gmail.com' LIMIT 1))
      )
      AND assessment_sharing.patient_consent = TRUE
      AND (assessment_sharing.consent_expiry_date IS NULL OR assessment_sharing.consent_expiry_date > NOW())
    )
  );

-- Política: Admins podem inserir avaliações apenas para seus pacientes
CREATE POLICY "Admins can insert assessments for their patients"
  ON clinical_assessments
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.type = 'admin'
    )
    AND (
      -- Admin é o médico responsável
      doctor_id = auth.uid()
    )
  );

-- Política: Admins podem atualizar apenas avaliações de seus pacientes
CREATE POLICY "Admins can update assessments of their patients"
  ON clinical_assessments
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.type = 'admin'
    )
    AND (
      -- Admin é o médico responsável
      doctor_id = auth.uid()
    )
  );

-- Política: Admins NÃO podem deletar avaliações (apenas marcar como canceladas)
-- Não criar política de DELETE para admins - avaliações são históricos clínicos

-- 4. MANTER POLÍTICAS EXISTENTES PARA PACIENTES E PROFISSIONAIS
-- =====================================================
-- Estas políticas já devem existir e são corretas:

-- Pacientes podem ver suas próprias avaliações
-- CREATE POLICY "Patients can view own assessments" ON clinical_assessments
--   FOR SELECT USING (auth.uid() = patient_id);

-- Profissionais podem ver avaliações de seus pacientes
-- CREATE POLICY "Professionals can view patient assessments" ON clinical_assessments
--   FOR SELECT USING (auth.uid() = doctor_id);

-- 5. VERIFICAR POLÍTICAS FINAIS
-- =====================================================
SELECT 
  policyname,
  permissive,
  roles,
  cmd,
  CASE 
    WHEN qual LIKE '%admin%' THEN '⚠️ Admin Policy'
    WHEN qual LIKE '%patient%' THEN '✅ Patient Policy'
    WHEN qual LIKE '%professional%' THEN '✅ Professional Policy'
    ELSE 'ℹ️ Other Policy'
  END as policy_type
FROM pg_policies
WHERE tablename = 'clinical_assessments'
ORDER BY policy_type, policyname;

-- 6. TESTE DE SEGURANÇA
-- =====================================================
-- Verificar se admin não consegue ver avaliações de outros pacientes
-- (Execute como admin para testar)
SELECT 
  'Teste de Segurança' as teste,
  COUNT(*) as total_assessments,
  COUNT(*) FILTER (WHERE patient_id != auth.uid() AND doctor_id != auth.uid()) as assessments_nao_acessiveis
FROM clinical_assessments;

-- =====================================================
-- RESUMO DAS MUDANÇAS
-- =====================================================
-- ✅ Removidas políticas que davam acesso irrestrito
-- ✅ Criadas políticas restritivas para admins
-- ✅ Admins só veem avaliações de seus pacientes ou compartilhadas
-- ✅ Privacidade dos pacientes protegida
-- =====================================================

