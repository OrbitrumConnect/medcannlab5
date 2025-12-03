-- Tabela para armazenar notícias da plataforma
-- MedCannLab 3.0 - Sistema de Gestão de Notícias

CREATE TABLE IF NOT EXISTS news_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  summary TEXT NOT NULL,
  content TEXT,
  category TEXT NOT NULL CHECK (category IN (
    'cannabis-medicinal',
    'pesquisa-clinica',
    'metodologia-aec',
    'regulamentacao',
    'nefrologia',
    'clinica',
    'pesquisa',
    'farmacologia'
  )),
  author TEXT NOT NULL,
  date DATE NOT NULL,
  read_time TEXT,
  impact TEXT CHECK (impact IN ('high', 'medium', 'low')),
  source TEXT,
  url TEXT,
  tags TEXT[] DEFAULT '{}',
  image_url TEXT,
  published BOOLEAN DEFAULT false,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_news_items_category ON news_items(category);
CREATE INDEX IF NOT EXISTS idx_news_items_date ON news_items(date DESC);
CREATE INDEX IF NOT EXISTS idx_news_items_published ON news_items(published);
CREATE INDEX IF NOT EXISTS idx_news_items_created_by ON news_items(created_by);

-- RLS (Row Level Security)
ALTER TABLE news_items ENABLE ROW LEVEL SECURITY;

-- Política: Todos podem ler notícias publicadas
CREATE POLICY "Anyone can read published news"
  ON news_items
  FOR SELECT
  USING (published = true);

-- Política: Apenas admins e profissionais podem criar/editar/excluir
CREATE POLICY "Admins and professionals can manage news"
  ON news_items
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND (users.type = 'admin' OR users.type = 'profissional')
    )
  );

-- Função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_news_items_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para atualizar updated_at
CREATE TRIGGER update_news_items_updated_at
  BEFORE UPDATE ON news_items
  FOR EACH ROW
  EXECUTE FUNCTION update_news_items_updated_at();

-- Comentários
COMMENT ON TABLE news_items IS 'Tabela para armazenar notícias e atualizações da plataforma MedCannLab';
COMMENT ON COLUMN news_items.category IS 'Categoria da notícia: cannabis-medicinal, pesquisa-clinica, metodologia-aec, regulamentacao, etc.';
COMMENT ON COLUMN news_items.published IS 'Se a notícia está publicada (true) ou em rascunho (false)';

