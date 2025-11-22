-- =====================================================
-- 🔐 CONFIGURAR RLS PARA SEPARAÇÃO DE PACIENTES POR PROFISSIONAL
-- =====================================================
-- Execute este script no Supabase SQL Editor
-- Este script garante que cada profissional veja apenas seus próprios pacientes

-- =====================================================
-- 1. VERIFICAR SE A TABELA EXISTE
-- =====================================================
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name = 'clinical_assessments';

-- =====================================================
-- 2. HABILITAR RLS (se ainda não estiver habilitado)
-- =====================================================
ALTER TABLE clinical_assessments ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- 3. REMOVER POLÍTICAS ANTIGAS (se existirem)
-- =====================================================
DROP POLICY IF EXISTS "Pacientes podem ver suas próprias avaliações" ON clinical_assessments;
DROP POLICY IF EXISTS "Pacientes podem criar avaliações" ON clinical_assessments;
DROP POLICY IF EXISTS "Profissionais podem ver avaliações de seus pacientes" ON clinical_assessments;
DROP POLICY IF EXISTS "Profissionais podem atualizar avaliações" ON clinical_assessments;
DROP POLICY IF EXISTS "Admin pode ver todas as avaliações" ON clinical_assessments;
DROP POLICY IF EXISTS "Users can view own assessments" ON clinical_assessments;
DROP POLICY IF EXISTS "Professionals can view patient assessments" ON clinical_assessments;
DROP POLICY IF EXISTS "Admin can view all assessments" ON clinical_assessments;

-- =====================================================
-- 4. CRIAR POLÍTICAS RLS CORRETAS
-- =====================================================

-- 4.1. Pacientes podem ver suas próprias avaliações
CREATE POLICY "Pacientes podem ver suas próprias avaliações"
  ON clinical_assessments
  FOR SELECT
  USING (
    auth.uid() = patient_id
  );

-- 4.2. Pacientes podem criar suas próprias avaliações
CREATE POLICY "Pacientes podem criar avaliações"
  ON clinical_assessments
  FOR INSERT
  WITH CHECK (
    auth.uid() = patient_id
  );

-- 4.3. Pacientes podem atualizar suas próprias avaliações
CREATE POLICY "Pacientes podem atualizar suas avaliações"
  ON clinical_assessments
  FOR UPDATE
  USING (
    auth.uid() = patient_id
  )
  WITH CHECK (
    auth.uid() = patient_id
  );

-- 4.4. Profissionais podem ver avaliações de seus pacientes
-- IMPORTANTE: Esta política garante que profissionais vejam APENAS avaliações onde eles são o doctor_id
CREATE POLICY "Profissionais podem ver avaliações de seus pacientes"
  ON clinical_assessments
  FOR SELECT
  USING (
    auth.uid() = doctor_id
  );

-- 4.5. Profissionais podem atualizar avaliações de seus pacientes
CREATE POLICY "Profissionais podem atualizar avaliações de seus pacientes"
  ON clinical_assessments
  FOR UPDATE
  USING (
    auth.uid() = doctor_id
  )
  WITH CHECK (
    auth.uid() = doctor_id
  );

-- 4.6. Profissionais podem inserir avaliações (quando criam para um paciente)
CREATE POLICY "Profissionais podem inserir avaliações"
  ON clinical_assessments
  FOR INSERT
  WITH CHECK (
    auth.uid() = doctor_id
  );

-- 4.7. Admin pode ver TODAS as avaliações
CREATE POLICY "Admin pode ver todas as avaliações"
  ON clinical_assessments
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.type = 'admin'
    )
  );

-- 4.8. Admin pode inserir/atualizar/deletar qualquer avaliação
CREATE POLICY "Admin pode gerenciar todas as avaliações"
  ON clinical_assessments
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.type = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.type = 'admin'
    )
  );

-- =====================================================
-- 5. VERIFICAR ÍNDICES (para performance)
-- =====================================================
-- Criar índices se não existirem
CREATE INDEX IF NOT EXISTS idx_clinical_assessments_patient_id ON clinical_assessments(patient_id);
CREATE INDEX IF NOT EXISTS idx_clinical_assessments_doctor_id ON clinical_assessments(doctor_id);
CREATE INDEX IF NOT EXISTS idx_clinical_assessments_status ON clinical_assessments(status);
CREATE INDEX IF NOT EXISTS idx_clinical_assessments_created_at ON clinical_assessments(created_at);

-- =====================================================
-- 6. VERIFICAR POLÍTICAS CRIADAS
-- =====================================================
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'clinical_assessments'
ORDER BY policyname;

-- =====================================================
-- 7. TESTAR POLÍTICAS (opcional - descomente para testar)
-- =====================================================
-- Para testar, você pode executar:
-- 
-- -- Como profissional (substitua 'PROFESSIONAL_USER_ID' pelo ID real)
-- SET LOCAL role authenticated;
-- SET LOCAL request.jwt.claim.sub = 'PROFESSIONAL_USER_ID';
-- SELECT COUNT(*) FROM clinical_assessments; -- Deve retornar apenas avaliações onde doctor_id = PROFESSIONAL_USER_ID
--
-- -- Como admin (substitua 'ADMIN_USER_ID' pelo ID real)
-- SET LOCAL role authenticated;
-- SET LOCAL request.jwt.claim.sub = 'ADMIN_USER_ID';
-- SELECT COUNT(*) FROM clinical_assessments; -- Deve retornar TODAS as avaliações

-- =====================================================
-- ✅ CONCLUSÃO
-- =====================================================
-- Após executar este script:
-- 1. ✅ Profissionais verão APENAS pacientes onde doctor_id = seu ID
-- 2. ✅ Pacientes verão APENAS suas próprias avaliações
-- 3. ✅ Admin verá TODAS as avaliações
-- 4. ✅ RLS está habilitado e funcionando corretamente
-- 5. ✅ Índices criados para melhor performance

