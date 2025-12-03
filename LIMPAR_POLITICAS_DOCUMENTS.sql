-- =====================================================
-- 🧹 LIMPEZA E PADRONIZAÇÃO DE POLÍTICAS RLS - documents
-- =====================================================
-- Este script remove políticas duplicadas e conflitantes
-- e mantém apenas as políticas corretas para authenticated users
-- =====================================================

-- 1. Remover TODAS as políticas existentes (vamos recriar apenas as necessárias)
DROP POLICY IF EXISTS "Authenticated users can view documents" ON documents;
DROP POLICY IF EXISTS "Authenticated users can insert documents" ON documents;
DROP POLICY IF EXISTS "Authenticated users can update documents" ON documents;
DROP POLICY IF EXISTS "Authenticated users can delete documents" ON documents;
DROP POLICY IF EXISTS "Users can view documents" ON documents;
DROP POLICY IF EXISTS "Users can insert documents" ON documents;
DROP POLICY IF EXISTS "Users can update own documents" ON documents;

-- 2. Garantir que RLS está habilitado
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;

-- 3. Criar políticas padronizadas apenas para authenticated users

-- SELECT: Usuários autenticados podem ver todos os documentos
CREATE POLICY "Authenticated users can view documents"
ON documents
FOR SELECT
TO authenticated
USING (true);

-- INSERT: Usuários autenticados podem inserir documentos
CREATE POLICY "Authenticated users can insert documents"
ON documents
FOR INSERT
TO authenticated
WITH CHECK (true);

-- UPDATE: Usuários autenticados podem atualizar documentos
CREATE POLICY "Authenticated users can update documents"
ON documents
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

-- DELETE: Usuários autenticados podem deletar documentos
CREATE POLICY "Authenticated users can delete documents"
ON documents
FOR DELETE
TO authenticated
USING (true);

-- 4. Verificar políticas criadas
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
WHERE tablename = 'documents'
ORDER BY cmd, policyname;

-- 5. Mensagem de sucesso
DO $$
BEGIN
  RAISE NOTICE '✅ Políticas RLS da tabela documents limpas e padronizadas!';
  RAISE NOTICE '📋 Total de políticas criadas: 4 (SELECT, INSERT, UPDATE, DELETE)';
  RAISE NOTICE '👥 Apenas usuários authenticated têm acesso';
END $$;

