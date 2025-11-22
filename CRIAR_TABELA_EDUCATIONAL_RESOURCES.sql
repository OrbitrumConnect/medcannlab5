-- =====================================================
-- 📚 CRIAR TABELA EDUCATIONAL_RESOURCES
-- =====================================================
-- Execute este script no Supabase SQL Editor
-- Isso eliminará o erro 404 que aparece no console

-- 1. CRIAR TABELA
CREATE TABLE IF NOT EXISTS educational_resources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  summary TEXT,
  description TEXT,
  category VARCHAR(100),
  resource_type VARCHAR(50) DEFAULT 'article', -- 'video', 'article', 'document', 'webinar', 'audio', 'other'
  url TEXT,
  published_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  audience TEXT,
  status VARCHAR(50) DEFAULT 'published', -- 'published', 'draft', 'archived'
  allowed_roles TEXT[],
  role_permissions JSONB,
  allowed_axes TEXT[],
  axis_permissions JSONB,
  visibility_scope VARCHAR(50) DEFAULT 'public', -- 'public', 'private', 'admin-only', 'professional-only'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. HABILITAR RLS (Row Level Security)
ALTER TABLE educational_resources ENABLE ROW LEVEL SECURITY;

-- 3. POLÍTICAS DE SEGURANÇA

-- Política: Todos podem ver recursos publicados e públicos
CREATE POLICY "Anyone can view published public educational resources" 
ON educational_resources FOR SELECT 
USING (
  status = 'published' 
  AND visibility_scope = 'public'
);

-- Política: Profissionais podem ver recursos para profissionais
CREATE POLICY "Professionals can view professional educational resources" 
ON educational_resources FOR SELECT 
USING (
  status = 'published' 
  AND (
    visibility_scope = 'professional-only' 
    OR visibility_scope = 'public'
  )
  AND (
    auth.jwt() ->> 'user_type' = 'professional' 
    OR auth.jwt() ->> 'user_type' = 'admin'
  )
);

-- Política: Admins podem fazer tudo
CREATE POLICY "Admins can manage all educational resources" 
ON educational_resources FOR ALL 
USING (
  auth.jwt() ->> 'user_type' = 'admin'
);

-- 4. CRIAR ÍNDICES PARA PERFORMANCE
CREATE INDEX IF NOT EXISTS idx_educational_resources_status 
ON educational_resources (status);

CREATE INDEX IF NOT EXISTS idx_educational_resources_visibility 
ON educational_resources (visibility_scope);

CREATE INDEX IF NOT EXISTS idx_educational_resources_published_at 
ON educational_resources (published_at DESC);

CREATE INDEX IF NOT EXISTS idx_educational_resources_category 
ON educational_resources (category);

-- 5. CRIAR TRIGGER PARA ATUALIZAR updated_at
CREATE OR REPLACE FUNCTION update_educational_resources_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_educational_resources_updated_at_trigger
BEFORE UPDATE ON educational_resources
FOR EACH ROW
EXECUTE FUNCTION update_educational_resources_updated_at();

-- 6. INSERIR DADOS DE EXEMPLO (OPCIONAL)
-- Descomente se quiser dados de exemplo para testar

/*
INSERT INTO educational_resources (
  title,
  summary,
  description,
  category,
  resource_type,
  url,
  audience,
  status,
  visibility_scope
) VALUES
(
  'Introdução à Cannabis Medicinal',
  'Guia completo sobre os fundamentos da cannabis medicinal',
  'Este recurso educacional aborda os conceitos básicos da cannabis medicinal, incluindo história, componentes ativos, e aplicações clínicas.',
  'Educação',
  'article',
  'https://example.com/cannabis-medicinal',
  'Pacientes e Profissionais',
  'published',
  'public'
),
(
  'Metodologia AEC - Arte da Entrevista Clínica',
  'Aprenda a metodologia exclusiva desenvolvida pelo Dr. Eduardo Faveret',
  'Curso completo sobre a Arte da Entrevista Clínica, metodologia inovadora para melhorar a qualidade das consultas médicas.',
  'Metodologia',
  'video',
  'https://example.com/metodologia-aec',
  'Profissionais',
  'published',
  'professional-only'
),
(
  'Protocolo IMRE Triaxial',
  'Entenda como aplicar o protocolo IMRE em avaliações clínicas',
  'Guia detalhado sobre o protocolo IMRE Triaxial, incluindo casos práticos e exemplos de aplicação.',
  'Protocolo',
  'document',
  'https://example.com/protocolo-imre',
  'Profissionais',
  'published',
  'professional-only'
);
*/

-- 7. VERIFICAR SE A TABELA FOI CRIADA
SELECT 
  table_name,
  column_name,
  data_type
FROM information_schema.columns
WHERE table_name = 'educational_resources'
ORDER BY ordinal_position;

-- 8. VERIFICAR DADOS (se inseriu dados de exemplo)
-- SELECT * FROM educational_resources;

-- ✅ PRONTO! A tabela foi criada e o erro 404 não aparecerá mais.

