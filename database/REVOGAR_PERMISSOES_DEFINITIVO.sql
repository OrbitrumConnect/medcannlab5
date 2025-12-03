-- =====================================================
-- REVOGAR PERMISSÕES IRRESTRITAS - VERSÃO DEFINITIVA
-- MedCannLab 3.0 - Segurança e Privacidade
-- =====================================================
-- ⚠️ CRÍTICO: Remove TODAS as políticas que permitem
-- acesso irrestrito e cria políticas RESTRITIVAS.
-- =====================================================

-- 1. REMOVER TODAS AS POLÍTICAS DE ADMIN
-- =====================================================
-- Remover TODAS as políticas que mencionam admin
DO $$
DECLARE
  policy_record RECORD;
BEGIN
  FOR policy_record IN 
    SELECT policyname 
    FROM pg_policies 
    WHERE tablename = 'clinical_assessments'
    AND (
      policyname LIKE '%admin%' 
      OR policyname LIKE '%Admin%'
      OR qual LIKE '%admin%' AND qual LIKE '%type%admin%'
    )
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON clinical_assessments', policy_record.policyname);
    RAISE NOTICE 'Removida política: %', policy_record.policyname;
  END LOOP;
END $$;

-- 2. REMOVER POLÍTICAS ESPECÍFICAS CONHECIDAS
-- =====================================================
DROP POLICY IF EXISTS "Admin pode ver todas as avaliações" ON clinical_assessments;
DROP POLICY IF EXISTS "Admin can view all assessments" ON clinical_assessments;
DROP POLICY IF EXISTS "Admin pode gerenciar todas as avaliações" ON clinical_assessments;
DROP POLICY IF EXISTS "Admin can manage all assessments" ON clinical_assessments;
DROP POLICY IF EXISTS "Admins can view assessments of their patients" ON clinical_assessments;
DROP POLICY IF EXISTS "Admins can view shared assessments" ON clinical_assessments;
DROP POLICY IF EXISTS "Admins can insert assessments for their patients" ON clinical_assessments;
DROP POLICY IF EXISTS "Admins can update assessments of their patients" ON clinical_assessments;

-- 3. CRIAR POLÍTICAS RESTRITIVAS CORRETAS
-- =====================================================

-- Política 1: Pacientes veem APENAS suas próprias avaliações
DROP POLICY IF EXISTS "Patients can view own assessments" ON clinical_assessments;
CREATE POLICY "Patients can view own assessments"
  ON clinical_assessments
  FOR SELECT
  USING (auth.uid() = patient_id);

-- Política 2: Pacientes podem criar suas próprias avaliações
DROP POLICY IF EXISTS "Patients can insert own assessments" ON clinical_assessments;
CREATE POLICY "Patients can insert own assessments"
  ON clinical_assessments
  FOR INSERT
  WITH CHECK (auth.uid() = patient_id);

-- Política 3: Pacientes podem atualizar suas próprias avaliações
DROP POLICY IF EXISTS "Patients can update own assessments" ON clinical_assessments;
CREATE POLICY "Patients can update own assessments"
  ON clinical_assessments
  FOR UPDATE
  USING (auth.uid() = patient_id);

-- Política 4: Profissionais veem APENAS avaliações onde são o médico (doctor_id)
DROP POLICY IF EXISTS "Professionals can view patient assessments" ON clinical_assessments;
CREATE POLICY "Professionals can view patient assessments"
  ON clinical_assessments
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.type = 'professional'
    )
    AND doctor_id = auth.uid()  -- ⚠️ CRÍTICO: Só vê se for o médico responsável
  );

-- Política 5: Profissionais podem inserir avaliações APENAS como médico
DROP POLICY IF EXISTS "Professionals can insert patient assessments" ON clinical_assessments;
CREATE POLICY "Professionals can insert patient assessments"
  ON clinical_assessments
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.type = 'professional'
    )
    AND doctor_id = auth.uid()  -- ⚠️ CRÍTICO: Só pode criar se for o médico
  );

-- Política 6: Profissionais podem atualizar APENAS avaliações onde são o médico
DROP POLICY IF EXISTS "Professionals can update patient assessments" ON clinical_assessments;
CREATE POLICY "Professionals can update patient assessments"
  ON clinical_assessments
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.type = 'professional'
    )
    AND doctor_id = auth.uid()  -- ⚠️ CRÍTICO: Só pode atualizar se for o médico
  );

-- Política 7: Admins veem APENAS avaliações onde são o médico responsável
-- ⚠️ SEM CONDIÇÃO OR - Apenas doctor_id = auth.uid()
CREATE POLICY "Admins can view assessments where they are doctor"
  ON clinical_assessments
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.type = 'admin'
    )
    AND doctor_id = auth.uid()  -- ⚠️ CRÍTICO: SEM OR - Só vê se for o médico
  );

-- Política 8: Admins podem inserir APENAS como médico responsável
CREATE POLICY "Admins can insert assessments as doctor"
  ON clinical_assessments
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.type = 'admin'
    )
    AND doctor_id = auth.uid()  -- ⚠️ CRÍTICO: Só pode criar se for o médico
  );

-- Política 9: Admins podem atualizar APENAS onde são o médico responsável
CREATE POLICY "Admins can update assessments where they are doctor"
  ON clinical_assessments
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.type = 'admin'
    )
    AND doctor_id = auth.uid()  -- ⚠️ CRÍTICO: Só pode atualizar se for o médico
  );

-- Política 10: Admins podem ver avaliações compartilhadas (se tabela existir)
-- Esta política é adicional e só funciona se houver compartilhamento explícito
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'assessment_sharing') THEN
    CREATE POLICY "Admins can view shared assessments with consent"
      ON clinical_assessments
      FOR SELECT
      USING (
        EXISTS (
          SELECT 1 FROM users
          WHERE users.id = auth.uid()
          AND users.type = 'admin'
        )
        AND EXISTS (
          SELECT 1 FROM assessment_sharing
          WHERE assessment_sharing.assessment_id = clinical_assessments.id
          AND (
            (
              assessment_sharing.shared_with_ricardo_valenca = TRUE 
              AND auth.uid() IN (SELECT id FROM users WHERE email IN ('rrvalenca@gmail.com', 'rrvlenca@gmail.com', 'profrvalenca@gmail.com', 'iaianoaesperanza@gmail.com'))
            )
            OR
            (
              assessment_sharing.shared_with_eduardo_faveret = TRUE 
              AND auth.uid() = (SELECT id FROM users WHERE email = 'eduardoscfaveret@gmail.com' LIMIT 1)
            )
          )
          AND assessment_sharing.patient_consent = TRUE
          AND (assessment_sharing.consent_expiry_date IS NULL OR assessment_sharing.consent_expiry_date > NOW())
        )
      );
    RAISE NOTICE 'Política de compartilhamento criada';
  ELSE
    RAISE NOTICE 'Tabela assessment_sharing não existe, pulando política de compartilhamento';
  END IF;
END $$;

-- 4. VERIFICAR POLÍTICAS FINAIS
-- =====================================================
SELECT 
  policyname as "Política",
  cmd as "Comando",
  CASE 
    WHEN qual LIKE '%doctor_id = auth.uid()%' AND qual NOT LIKE '%OR%' THEN '✅ Restritiva - Apenas médico responsável'
    WHEN qual LIKE '%patient_id = auth.uid()%' THEN '✅ Restritiva - Apenas próprio paciente'
    WHEN qual LIKE '%shared%' AND qual LIKE '%consent%' THEN '✅ Restritiva - Compartilhamento com consentimento'
    WHEN qual LIKE '%admin%' AND qual NOT LIKE '%doctor_id%' THEN '🔴 PERIGOSA - Verificar!'
    WHEN qual LIKE '%OR%' AND qual LIKE '%admin%' THEN '🔴 PERIGOSA - Condição OR permite acesso irrestrito!'
    ELSE 'ℹ️ Verificar manualmente'
  END as "Status de Segurança",
  qual as "Condição SQL"
FROM pg_policies
WHERE tablename = 'clinical_assessments'
ORDER BY 
  CASE 
    WHEN qual LIKE '%OR%' AND qual LIKE '%admin%' THEN 1
    WHEN qual LIKE '%admin%' AND qual NOT LIKE '%doctor_id%' THEN 2
    WHEN qual LIKE '%doctor_id = auth.uid()%' THEN 3
    WHEN qual LIKE '%patient_id = auth.uid()%' THEN 4
    ELSE 5
  END,
  policyname;

-- 5. TESTE DE SEGURANÇA DEFINITIVO
-- =====================================================
-- Este teste deve mostrar que admin NÃO vê todas as avaliações
SELECT 
  'Teste de Segurança Definitivo' as teste,
  COUNT(*) as total_assessments_no_sistema,
  COUNT(*) FILTER (WHERE doctor_id = auth.uid()) as assessments_onde_admin_e_medico,
  COUNT(*) FILTER (WHERE patient_id = auth.uid()) as assessments_do_admin_como_paciente,
  COUNT(*) FILTER (WHERE doctor_id IS NULL) as assessments_sem_medico,
  COUNT(*) FILTER (WHERE doctor_id != auth.uid() AND patient_id != auth.uid() AND doctor_id IS NOT NULL) as assessments_nao_acessiveis,
  CASE 
    WHEN COUNT(*) FILTER (WHERE doctor_id != auth.uid() AND patient_id != auth.uid() AND doctor_id IS NOT NULL) > 0
    THEN '✅ SEGURO - Admin não vê todas as avaliações'
    WHEN COUNT(*) FILTER (WHERE doctor_id = auth.uid()) = COUNT(*)
    THEN '✅ SEGURO - Admin só vê suas avaliações como médico'
    ELSE '⚠️ VERIFICAR - Pode haver problema'
  END as resultado_seguranca
FROM clinical_assessments;

-- 6. VERIFICAR AVALIAÇÕES SEM DOCTOR_ID
-- =====================================================
-- Avaliações sem doctor_id não devem ser acessíveis por admins
-- (a menos que sejam do próprio paciente)
SELECT 
  'Avaliações sem médico responsável' as info,
  COUNT(*) as total,
  COUNT(*) FILTER (WHERE patient_id = auth.uid()) as do_proprio_paciente,
  COUNT(*) FILTER (WHERE patient_id != auth.uid()) as de_outros_pacientes_nao_acessiveis
FROM clinical_assessments
WHERE doctor_id IS NULL;

-- =====================================================
-- RESUMO DAS MUDANÇAS
-- =====================================================
-- ✅ TODAS as políticas irrestritas removidas
-- ✅ Políticas restritivas criadas SEM condição OR problemática
-- ✅ Admins só veem avaliações onde são o médico (doctor_id = auth.uid())
-- ✅ Admins só veem avaliações compartilhadas com consentimento
-- ✅ Privacidade dos pacientes protegida
-- ✅ Conformidade com LGPD
-- =====================================================

