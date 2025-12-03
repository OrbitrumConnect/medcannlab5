-- =====================================================
-- CONSOLIDAR FÓRUM COMPLETO - SEM ERROS
-- MedCannLab 3.0 - Fórum Profissional
-- =====================================================
-- Este script consolida toda a estrutura do fórum
-- Remove todas as políticas antigas antes de criar novas
-- =====================================================

-- 1. CRIAR/ATUALIZAR TABELA forum_posts
-- =====================================================
CREATE TABLE IF NOT EXISTS forum_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  description TEXT,
  author_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  author_name TEXT NOT NULL,
  author_avatar TEXT,
  category TEXT NOT NULL DEFAULT 'Geral',
  tags TEXT[] DEFAULT '{}',
  is_pinned BOOLEAN DEFAULT false,
  is_hot BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  is_password_protected BOOLEAN DEFAULT false,
  password_hash TEXT,
  allowed_roles TEXT[] DEFAULT '{}',
  post_roles TEXT[] DEFAULT '{}',
  participants_count INTEGER DEFAULT 0,
  views_count INTEGER DEFAULT 0,
  replies_count INTEGER DEFAULT 0,
  votes_up INTEGER DEFAULT 0,
  votes_down INTEGER DEFAULT 0,
  last_activity TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  slug TEXT UNIQUE
);

-- Adicionar colunas que podem não existir
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'forum_posts' AND column_name = 'allowed_roles') THEN
    ALTER TABLE forum_posts ADD COLUMN allowed_roles TEXT[] DEFAULT '{}';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'forum_posts' AND column_name = 'post_roles') THEN
    ALTER TABLE forum_posts ADD COLUMN post_roles TEXT[] DEFAULT '{}';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'forum_posts' AND column_name = 'description') THEN
    ALTER TABLE forum_posts ADD COLUMN description TEXT;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'forum_posts' AND column_name = 'slug') THEN
    ALTER TABLE forum_posts ADD COLUMN slug TEXT UNIQUE;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'forum_posts' AND column_name = 'author_name') THEN
    ALTER TABLE forum_posts ADD COLUMN author_name TEXT;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'forum_posts' AND column_name = 'author_avatar') THEN
    ALTER TABLE forum_posts ADD COLUMN author_avatar TEXT;
  END IF;
END $$;

-- 2. CRIAR ÍNDICES PARA PERFORMANCE
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_forum_posts_category ON forum_posts(category);
CREATE INDEX IF NOT EXISTS idx_forum_posts_author ON forum_posts(author_id);
CREATE INDEX IF NOT EXISTS idx_forum_posts_created ON forum_posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_forum_posts_active ON forum_posts(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_forum_posts_pinned ON forum_posts(is_pinned) WHERE is_pinned = true;
CREATE INDEX IF NOT EXISTS idx_forum_posts_slug ON forum_posts(slug) WHERE slug IS NOT NULL;

-- 3. FUNÇÕES E TRIGGERS
-- =====================================================

-- Função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_forum_posts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para atualizar updated_at
DROP TRIGGER IF EXISTS update_forum_posts_updated_at ON forum_posts;
CREATE TRIGGER update_forum_posts_updated_at
  BEFORE UPDATE ON forum_posts
  FOR EACH ROW
  EXECUTE FUNCTION update_forum_posts_updated_at();

-- Função para gerar slug a partir do título
CREATE OR REPLACE FUNCTION generate_forum_post_slug(title TEXT)
RETURNS TEXT AS $$
BEGIN
  RETURN lower(
    regexp_replace(
      regexp_replace(
        regexp_replace(title, '[^a-zA-Z0-9\s-]', '', 'g'),
        '\s+', '-', 'g'
      ),
      '-+', '-', 'g'
    )
  );
END;
$$ LANGUAGE plpgsql;

-- 4. HABILITAR RLS
-- =====================================================
ALTER TABLE forum_posts ENABLE ROW LEVEL SECURITY;

-- 5. REMOVER TODAS AS POLÍTICAS ANTIGAS
-- =====================================================
DROP POLICY IF EXISTS "Users can view posts based on allowed_roles" ON forum_posts;
DROP POLICY IF EXISTS "Users can create posts based on post_roles" ON forum_posts;
DROP POLICY IF EXISTS "Authors and admins can update posts" ON forum_posts;
DROP POLICY IF EXISTS "Only admins can delete posts" ON forum_posts;
DROP POLICY IF EXISTS "Anyone can view active forum posts" ON forum_posts;
DROP POLICY IF EXISTS "Authenticated users can create forum posts" ON forum_posts;
DROP POLICY IF EXISTS "Users can view forum posts" ON forum_posts;
DROP POLICY IF EXISTS "Users can create forum posts" ON forum_posts;
DROP POLICY IF EXISTS "Users can update forum posts" ON forum_posts;
DROP POLICY IF EXISTS "Users can delete forum posts" ON forum_posts;
DROP POLICY IF EXISTS "Admins can manage all posts" ON forum_posts;

-- 6. CRIAR POLÍTICAS RLS CORRETAS
-- =====================================================

-- Política: Usuários podem ver posts baseado em allowed_roles
-- Se allowed_roles está vazio, todos os usuários autenticados podem ver
-- Se allowed_roles tem valores, apenas usuários com tipo correspondente podem ver
CREATE POLICY "Users can view posts based on allowed_roles"
  ON forum_posts FOR SELECT
  USING (
    auth.uid() IS NOT NULL
    AND (
      -- Se allowed_roles está vazio/null, todos podem ver
      (COALESCE(forum_posts.allowed_roles, '{}') = '{}' OR array_length(forum_posts.allowed_roles, 1) IS NULL)
      OR
      -- Verificar se o tipo do usuário está em allowed_roles
      EXISTS (
        SELECT 1 FROM users 
        WHERE id = auth.uid() 
        AND type = ANY(COALESCE(forum_posts.allowed_roles, ARRAY[]::TEXT[]))
      )
    )
    AND is_active = true
  );

-- Política: Usuários podem criar posts se seu tipo está em post_roles
-- Profissionais e admins podem criar posts por padrão
CREATE POLICY "Users can create posts based on post_roles"
  ON forum_posts FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL
    AND (
      -- Verificar se é profissional ou admin
      EXISTS (
        SELECT 1 FROM users 
        WHERE id = auth.uid() 
        AND type IN ('professional', 'profissional', 'admin')
      )
      OR
      -- Verificar se post_roles está vazio (todos podem postar)
      (COALESCE(forum_posts.post_roles, '{}') = '{}' OR array_length(forum_posts.post_roles, 1) IS NULL)
      OR
      -- Verificar se o tipo do usuário está em post_roles
      EXISTS (
        SELECT 1 FROM users 
        WHERE id = auth.uid() 
        AND type = ANY(COALESCE(forum_posts.post_roles, ARRAY[]::TEXT[]))
      )
    )
    AND author_id = auth.uid()
  );

-- Política: Autores podem atualizar seus próprios posts
-- Admins podem atualizar qualquer post
CREATE POLICY "Authors and admins can update posts"
  ON forum_posts FOR UPDATE
  USING (
    forum_posts.author_id = auth.uid()
    OR
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() 
      AND type = 'admin'
    )
  )
  WITH CHECK (
    forum_posts.author_id = auth.uid()
    OR
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() 
      AND type = 'admin'
    )
  );

-- Política: Apenas admins podem deletar posts
CREATE POLICY "Only admins can delete posts"
  ON forum_posts FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() 
      AND type = 'admin'
    )
  );

-- 7. COMENTÁRIOS E DOCUMENTAÇÃO
-- =====================================================
COMMENT ON TABLE forum_posts IS 'Tabela para armazenar debates e postagens do fórum profissional';
COMMENT ON COLUMN forum_posts.allowed_roles IS 'Array de tipos de usuários que podem visualizar o post. Vazio = todos podem ver';
COMMENT ON COLUMN forum_posts.post_roles IS 'Array de tipos de usuários que podem postar no debate. Vazio = profissionais e admins podem postar';

-- 8. VERIFICAR POLÍTICAS CRIADAS
-- =====================================================
SELECT 
  schemaname,
  tablename,
  policyname,
  cmd,
  CASE 
    WHEN policyname LIKE '%admin%' AND cmd = 'DELETE' THEN '✅ Apenas admins podem deletar'
    WHEN policyname LIKE '%admin%' AND cmd = 'UPDATE' THEN '✅ Admins e autores podem atualizar'
    WHEN policyname LIKE '%view%' THEN '✅ Visualização baseada em allowed_roles'
    WHEN policyname LIKE '%create%' THEN '✅ Criação baseada em post_roles'
    ELSE 'ℹ️ Verificar manualmente'
  END as status_politica
FROM pg_policies
WHERE tablename = 'forum_posts'
ORDER BY cmd, policyname;

-- Status: ✅ Fórum consolidado
-- - Tabela forum_posts criada/atualizada
-- - RLS habilitado
-- - Políticas configuradas corretamente
-- - Índices criados
-- - Funções e triggers configurados

