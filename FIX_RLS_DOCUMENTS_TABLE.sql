-- Script para corrigir políticas RLS da tabela documents
-- Execute este script no Supabase SQL Editor

-- 1. Verificar se RLS está habilitado
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;

-- 2. Remover políticas antigas se existirem (opcional - comente se não quiser remover)
-- DROP POLICY IF EXISTS "Allow all operations on documents" ON documents;
-- DROP POLICY IF EXISTS "Public documents are viewable by everyone" ON documents;
-- DROP POLICY IF EXISTS "Authenticated users can insert documents" ON documents;
-- DROP POLICY IF EXISTS "Authenticated users can update documents" ON documents;
-- DROP POLICY IF EXISTS "Authenticated users can delete documents" ON documents;

-- 3. Remover políticas antigas se existirem e criar novas políticas RLS

-- Política para SELECT: Usuários autenticados podem ver todos os documentos
DROP POLICY IF EXISTS "Authenticated users can view documents" ON documents;
CREATE POLICY "Authenticated users can view documents"
ON documents
FOR SELECT
TO authenticated
USING (true);

-- Política para INSERT: Usuários autenticados podem inserir documentos
DROP POLICY IF EXISTS "Authenticated users can insert documents" ON documents;
CREATE POLICY "Authenticated users can insert documents"
ON documents
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Política para UPDATE: Usuários autenticados podem atualizar documentos
DROP POLICY IF EXISTS "Authenticated users can update documents" ON documents;
CREATE POLICY "Authenticated users can update documents"
ON documents
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

-- Política para DELETE: Usuários autenticados podem deletar documentos
DROP POLICY IF EXISTS "Authenticated users can delete documents" ON documents;
CREATE POLICY "Authenticated users can delete documents"
ON documents
FOR DELETE
TO authenticated
USING (true);

-- 4. Verificar se a tabela documents tem todas as colunas necessárias
DO $$
BEGIN
  -- Adicionar colunas se não existirem
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'documents' AND column_name = 'file_url') THEN
    ALTER TABLE documents ADD COLUMN file_url TEXT;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'documents' AND column_name = 'file_type') THEN
    ALTER TABLE documents ADD COLUMN file_type TEXT;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'documents' AND column_name = 'file_size') THEN
    ALTER TABLE documents ADD COLUMN file_size INTEGER;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'documents' AND column_name = 'author') THEN
    ALTER TABLE documents ADD COLUMN author TEXT;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'documents' AND column_name = 'category') THEN
    ALTER TABLE documents ADD COLUMN category TEXT;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'documents' AND column_name = 'target_audience') THEN
    ALTER TABLE documents ADD COLUMN target_audience TEXT[] DEFAULT '{}';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'documents' AND column_name = 'tags') THEN
    ALTER TABLE documents ADD COLUMN tags TEXT[] DEFAULT '{}';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'documents' AND column_name = 'isLinkedToAI') THEN
    ALTER TABLE documents ADD COLUMN "isLinkedToAI" BOOLEAN DEFAULT false;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'documents' AND column_name = 'aiRelevance') THEN
    ALTER TABLE documents ADD COLUMN "aiRelevance" DECIMAL(3,2) DEFAULT 0.5;
  END IF;
  
  -- Garantir que content pode ser vazio (para documentos que serão processados depois)
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'documents' AND column_name = 'content' AND is_nullable = 'NO') THEN
    ALTER TABLE documents ALTER COLUMN content DROP NOT NULL;
  END IF;
END $$;

-- 5. Criar índices para melhorar performance
CREATE INDEX IF NOT EXISTS idx_documents_category ON documents(category);
CREATE INDEX IF NOT EXISTS idx_documents_isLinkedToAI ON documents("isLinkedToAI");
CREATE INDEX IF NOT EXISTS idx_documents_created_at ON documents(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_documents_tags ON documents USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_documents_keywords ON documents USING GIN(keywords);
CREATE INDEX IF NOT EXISTS idx_documents_target_audience ON documents USING GIN(target_audience);

-- 6. Verificar políticas criadas
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
ORDER BY policyname;

