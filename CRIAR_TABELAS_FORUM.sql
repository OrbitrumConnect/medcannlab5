-- =====================================================
-- 💬 CRIAR TABELAS DO FÓRUM
-- =====================================================
-- Execute este script no Supabase SQL Editor
-- Isso permitirá que o fórum de casos clínicos funcione completamente

-- 1. TABELA: FORUM_COMMENTS (Comentários)
-- =====================================================
CREATE TABLE IF NOT EXISTS forum_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES forum_posts(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. TABELA: FORUM_LIKES (Curtidas)
-- =====================================================
CREATE TABLE IF NOT EXISTS forum_likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES forum_posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(post_id, user_id) -- Um usuário só pode curtir uma vez
);

-- 3. TABELA: FORUM_VIEWS (Visualizações)
-- =====================================================
CREATE TABLE IF NOT EXISTS forum_views (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES forum_posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  viewed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(post_id, user_id) -- Contar apenas uma visualização por usuário
);

-- 4. HABILITAR RLS (Row Level Security)
-- =====================================================
ALTER TABLE forum_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE forum_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE forum_views ENABLE ROW LEVEL SECURITY;

-- 5. POLÍTICAS DE SEGURANÇA - FORUM_COMMENTS
-- =====================================================

-- Todos podem ver comentários
CREATE POLICY "Anyone can view forum comments" 
ON forum_comments FOR SELECT 
USING (true);

-- Usuários autenticados podem criar comentários
CREATE POLICY "Authenticated users can create forum comments" 
ON forum_comments FOR INSERT 
WITH CHECK (auth.uid() = author_id);

-- Apenas o autor pode editar seu comentário
CREATE POLICY "Authors can update their own comments" 
ON forum_comments FOR UPDATE 
USING (auth.uid() = author_id);

-- Apenas o autor ou admin pode deletar comentário
CREATE POLICY "Authors and admins can delete comments" 
ON forum_comments FOR DELETE 
USING (
  auth.uid() = author_id 
  OR EXISTS (
    SELECT 1 FROM users 
    WHERE users.id = auth.uid() 
    AND users.type = 'admin'
  )
);

-- 6. POLÍTICAS DE SEGURANÇA - FORUM_LIKES
-- =====================================================

-- Todos podem ver curtidas
CREATE POLICY "Anyone can view forum likes" 
ON forum_likes FOR SELECT 
USING (true);

-- Usuários autenticados podem curtir posts
CREATE POLICY "Authenticated users can like posts" 
ON forum_likes FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Usuários podem remover sua própria curtida
CREATE POLICY "Users can unlike their own likes" 
ON forum_likes FOR DELETE 
USING (auth.uid() = user_id);

-- 7. POLÍTICAS DE SEGURANÇA - FORUM_VIEWS
-- =====================================================

-- Todos podem ver visualizações (estatísticas)
CREATE POLICY "Anyone can view forum views" 
ON forum_views FOR SELECT 
USING (true);

-- Usuários autenticados podem registrar visualizações
CREATE POLICY "Authenticated users can track views" 
ON forum_views FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- 8. CRIAR ÍNDICES PARA PERFORMANCE
-- =====================================================

-- Índices para forum_comments
CREATE INDEX IF NOT EXISTS idx_forum_comments_post_id 
ON forum_comments (post_id);

CREATE INDEX IF NOT EXISTS idx_forum_comments_author_id 
ON forum_comments (author_id);

CREATE INDEX IF NOT EXISTS idx_forum_comments_created_at 
ON forum_comments (created_at DESC);

-- Índices para forum_likes
CREATE INDEX IF NOT EXISTS idx_forum_likes_post_id 
ON forum_likes (post_id);

CREATE INDEX IF NOT EXISTS idx_forum_likes_user_id 
ON forum_likes (user_id);

-- Índices para forum_views
CREATE INDEX IF NOT EXISTS idx_forum_views_post_id 
ON forum_views (post_id);

CREATE INDEX IF NOT EXISTS idx_forum_views_user_id 
ON forum_views (user_id);

-- 9. CRIAR TRIGGERS PARA ATUALIZAR updated_at
-- =====================================================

-- Trigger para forum_comments
CREATE OR REPLACE FUNCTION update_forum_comments_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_forum_comments_updated_at_trigger
BEFORE UPDATE ON forum_comments
FOR EACH ROW
EXECUTE FUNCTION update_forum_comments_updated_at();

-- 10. VERIFICAR SE AS TABELAS FORAM CRIADAS
-- =====================================================
SELECT 
  table_name,
  column_name,
  data_type
FROM information_schema.columns
WHERE table_name IN ('forum_comments', 'forum_likes', 'forum_views')
ORDER BY table_name, ordinal_position;

-- ✅ PRONTO! As tabelas do fórum foram criadas e o fórum funcionará completamente.

