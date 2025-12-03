-- =====================================================
-- 📚 CRIAÇÃO DA TABELA DE CONTEÚDO DE AULAS
-- =====================================================
-- Execute este script no Supabase SQL Editor
-- para criar a tabela que armazena o conteúdo das aulas
-- =====================================================

-- Criar tabela para armazenar conteúdo de aulas
CREATE TABLE IF NOT EXISTS lesson_content (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  module_id TEXT NOT NULL,
  lesson_id TEXT NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL DEFAULT '',
  content_type TEXT DEFAULT 'markdown' CHECK (content_type IN ('markdown', 'html', 'text')),
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(module_id, lesson_id)
);

-- Criar índice para buscas rápidas
CREATE INDEX IF NOT EXISTS idx_lesson_content_module_lesson 
ON lesson_content(module_id, lesson_id);

CREATE INDEX IF NOT EXISTS idx_lesson_content_created_by 
ON lesson_content(created_by);

CREATE INDEX IF NOT EXISTS idx_lesson_content_updated_at 
ON lesson_content(updated_at DESC);

-- Criar função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_lesson_content_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Criar trigger para atualizar updated_at
DROP TRIGGER IF EXISTS trigger_update_lesson_content_updated_at ON lesson_content;
CREATE TRIGGER trigger_update_lesson_content_updated_at
  BEFORE UPDATE ON lesson_content
  FOR EACH ROW
  EXECUTE FUNCTION update_lesson_content_updated_at();

-- Habilitar RLS (Row Level Security)
ALTER TABLE lesson_content ENABLE ROW LEVEL SECURITY;

-- Remover políticas antigas se existirem (para evitar conflitos)
DROP POLICY IF EXISTS "Authenticated users can view lesson content" ON lesson_content;
DROP POLICY IF EXISTS "Authenticated users can insert lesson content" ON lesson_content;
DROP POLICY IF EXISTS "Authenticated users can update lesson content" ON lesson_content;
DROP POLICY IF EXISTS "Only admins can delete lesson content" ON lesson_content;

-- Política: Usuários autenticados podem visualizar conteúdo de aulas
CREATE POLICY "Authenticated users can view lesson content"
ON lesson_content
FOR SELECT
TO authenticated
USING (true);

-- Política: Usuários autenticados podem inserir conteúdo de aulas
CREATE POLICY "Authenticated users can insert lesson content"
ON lesson_content
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Política: Usuários autenticados podem atualizar conteúdo de aulas
CREATE POLICY "Authenticated users can update lesson content"
ON lesson_content
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

-- Política: Apenas admins podem deletar conteúdo de aulas
CREATE POLICY "Only admins can delete lesson content"
ON lesson_content
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
    AND type = 'admin'
  )
);

-- Comentários nas colunas
COMMENT ON TABLE lesson_content IS 'Armazena o conteúdo das aulas dos cursos';
COMMENT ON COLUMN lesson_content.module_id IS 'ID do módulo do curso (ex: "1", "2")';
COMMENT ON COLUMN lesson_content.lesson_id IS 'ID da aula dentro do módulo (ex: "1-1", "1-2")';
COMMENT ON COLUMN lesson_content.content IS 'Conteúdo da aula em markdown, HTML ou texto';
COMMENT ON COLUMN lesson_content.content_type IS 'Tipo de conteúdo: markdown, html ou text';

-- Verificar se a tabela foi criada corretamente
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'lesson_content'
  ) THEN
    RAISE NOTICE '✅ Tabela lesson_content criada com sucesso!';
  ELSE
    RAISE EXCEPTION '❌ Erro ao criar tabela lesson_content';
  END IF;
END $$;

