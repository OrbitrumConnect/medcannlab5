-- Criar tabela forum_posts para armazenar debates do fórum
CREATE TABLE IF NOT EXISTS forum_posts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
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

-- Adicionar colunas que podem não existir (se a tabela já foi criada sem elas)
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
END $$;

-- Criar índice para busca rápida
CREATE INDEX IF NOT EXISTS idx_forum_posts_category ON forum_posts(category);
CREATE INDEX IF NOT EXISTS idx_forum_posts_author ON forum_posts(author_id);
CREATE INDEX IF NOT EXISTS idx_forum_posts_created ON forum_posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_forum_posts_active ON forum_posts(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_forum_posts_pinned ON forum_posts(is_pinned) WHERE is_pinned = true;

-- Função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_forum_posts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para atualizar updated_at (remover se existir antes de criar)
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

-- RLS Policies
ALTER TABLE forum_posts ENABLE ROW LEVEL SECURITY;

-- Remover políticas existentes se houver
DROP POLICY IF EXISTS "Users can view posts based on allowed_roles" ON forum_posts;
DROP POLICY IF EXISTS "Users can create posts based on post_roles" ON forum_posts;
DROP POLICY IF EXISTS "Authors and admins can update posts" ON forum_posts;
DROP POLICY IF EXISTS "Only admins can delete posts" ON forum_posts;

-- Política: Usuários podem ver posts baseado em allowed_roles
-- Nota: Esta política assume que a coluna allowed_roles existe (adicionada no bloco DO acima)
CREATE POLICY "Users can view posts based on allowed_roles"
  ON forum_posts FOR SELECT
  USING (
    -- Admin pode ver tudo
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND type = 'admin')
    OR
    -- Se allowed_roles está vazio/null, todos podem ver
    (COALESCE(forum_posts.allowed_roles, '{}') = '{}' OR array_length(forum_posts.allowed_roles, 1) IS NULL)
    OR
    -- Verificar se o tipo do usuário está em allowed_roles
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() 
      AND type = ANY(COALESCE(forum_posts.allowed_roles, ARRAY[]::TEXT[]))
    )
  );

-- Política: Usuários podem criar posts se seu tipo está em post_roles ou são admin
CREATE POLICY "Users can create posts based on post_roles"
  ON forum_posts FOR INSERT
  WITH CHECK (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND type = 'admin')
    OR
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() 
      AND type IN ('profissional', 'admin')
    )
  );

-- Política: Autores podem atualizar seus próprios posts, admins podem atualizar qualquer post
CREATE POLICY "Authors and admins can update posts"
  ON forum_posts FOR UPDATE
  USING (
    forum_posts.author_id = auth.uid()
    OR
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND type = 'admin')
  );

-- Política: Apenas admins podem deletar posts
CREATE POLICY "Only admins can delete posts"
  ON forum_posts FOR DELETE
  USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND type = 'admin')
  );

-- Função RPC para popular debates iniciais (executar manualmente se necessário)
CREATE OR REPLACE FUNCTION populate_initial_forum_posts()
RETURNS void AS $$
DECLARE
  admin_user_id UUID;
BEGIN
  -- Buscar um usuário admin para ser autor dos posts iniciais
  SELECT id INTO admin_user_id FROM users WHERE type = 'admin' LIMIT 1;
  
  IF admin_user_id IS NULL THEN
    RAISE EXCEPTION 'Nenhum usuário admin encontrado';
  END IF;

  -- Inserir debates iniciais apenas se não existirem
  INSERT INTO forum_posts (
    title, content, description, author_id, author_name, author_avatar,
    category, tags, is_pinned, is_hot, is_active, is_password_protected,
    allowed_roles, post_roles, participants_count, views_count, replies_count,
    votes_up, votes_down, slug
  ) VALUES
  (
    'CBD vs THC: Qual é mais eficaz para dor crônica?',
    'Discussão sobre a eficácia comparativa entre CBD e THC no tratamento da dor crônica, baseada em evidências clínicas recentes.',
    'Discussão sobre a eficácia comparativa entre CBD e THC no tratamento da dor crônica, baseada em evidências clínicas recentes.',
    admin_user_id,
    'Dr. João Silva',
    'JS',
    'Cannabis Medicinal',
    ARRAY['CBD', 'THC', 'Dor Crônica', 'Cannabis'],
    true,
    true,
    true,
    false,
    ARRAY['admin', 'profissional', 'aluno'],
    ARRAY['admin', 'profissional'],
    24,
    156,
    18,
    15,
    3,
    generate_forum_post_slug('CBD vs THC: Qual é mais eficaz para dor crônica?')
  ),
  (
    'Protocolo de dosagem para pacientes idosos com cannabis',
    'Compartilhamento de protocolos seguros para dosagem de cannabis em pacientes da terceira idade.',
    'Compartilhamento de protocolos seguros para dosagem de cannabis em pacientes da terceira idade.',
    admin_user_id,
    'Dra. Maria Santos',
    'MS',
    'Protocolos',
    ARRAY['Dosagem', 'Idosos', 'Protocolo', 'Segurança'],
    false,
    false,
    false,
    true,
    ARRAY['admin', 'profissional'],
    ARRAY['admin', 'profissional'],
    18,
    89,
    12,
    22,
    1,
    generate_forum_post_slug('Protocolo de dosagem para pacientes idosos com cannabis')
  ),
  (
    'Interações medicamentosas com cannabis: Casos reais',
    'Análise de casos reais de interações medicamentosas com cannabis e estratégias de prevenção.',
    'Análise de casos reais de interações medicamentosas com cannabis e estratégias de prevenção.',
    admin_user_id,
    'Dr. Pedro Costa',
    'PC',
    'Farmacologia',
    ARRAY['Interações', 'Farmacologia', 'Casos Reais', 'Segurança'],
    false,
    true,
    true,
    false,
    ARRAY['admin', 'profissional', 'aluno'],
    ARRAY['admin', 'profissional'],
    31,
    203,
    25,
    28,
    2,
    generate_forum_post_slug('Interações medicamentosas com cannabis: Casos reais')
  )
  ON CONFLICT (slug) DO NOTHING;
END;
$$ LANGUAGE plpgsql;

-- Comentários
COMMENT ON TABLE forum_posts IS 'Tabela para armazenar debates e postagens do fórum profissional';
COMMENT ON COLUMN forum_posts.allowed_roles IS 'Array de tipos de usuários que podem visualizar o post';
COMMENT ON COLUMN forum_posts.post_roles IS 'Array de tipos de usuários que podem postar no debate';

