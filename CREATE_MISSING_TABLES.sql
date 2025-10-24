-- =====================================================
-- 🔧 CRIAR TABELAS QUE FALTAM PARA MEDCANLAB
-- =====================================================
-- Execute este script para criar as tabelas necessárias

-- 1. CRIAR TABELA DE CANAIS DE CHAT
CREATE TABLE IF NOT EXISTS channels (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  type TEXT DEFAULT 'public' CHECK (type IN ('public', 'private')),
  created_by UUID,
  members_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. CRIAR TABELA DE MENSAGENS
CREATE TABLE IF NOT EXISTS messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  channel_id UUID REFERENCES channels(id),
  user_id UUID,
  content TEXT NOT NULL,
  type TEXT DEFAULT 'text' CHECK (type IN ('text', 'image', 'file', 'document')),
  reactions JSONB DEFAULT '{}',
  is_pinned BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. CRIAR TABELA DE DEBATES/FÓRUM
CREATE TABLE IF NOT EXISTS debates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  author_id UUID,
  category TEXT,
  tags TEXT[],
  is_active BOOLEAN DEFAULT true,
  is_password_protected BOOLEAN DEFAULT false,
  password TEXT,
  participants_count INTEGER DEFAULT 0,
  views INTEGER DEFAULT 0,
  votes JSONB DEFAULT '{"up": 0, "down": 0}',
  is_pinned BOOLEAN DEFAULT false,
  is_hot BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. CRIAR TABELA DE AMIZADES
CREATE TABLE IF NOT EXISTS friendships (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  requester_id UUID,
  addressee_id UUID,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'blocked')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(requester_id, addressee_id)
);

-- 5. CRIAR TABELA DE CHAT PRIVADO MÉDICO-PACIENTE
CREATE TABLE IF NOT EXISTS private_chats (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  doctor_id UUID,
  patient_id UUID,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(doctor_id, patient_id)
);

-- 6. CRIAR TABELA DE MENSAGENS PRIVADAS
CREATE TABLE IF NOT EXISTS private_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  chat_id UUID REFERENCES private_chats(id),
  sender_id UUID,
  content TEXT NOT NULL,
  type TEXT DEFAULT 'text' CHECK (type IN ('text', 'image', 'file', 'document')),
  attachments JSONB DEFAULT '[]',
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. CRIAR TABELA DE CURSOS
CREATE TABLE IF NOT EXISTS courses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT,
  level TEXT CHECK (level IN ('beginner', 'intermediate', 'advanced')),
  duration INTEGER, -- em minutos
  price DECIMAL(10,2) DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 8. CRIAR TABELA DE INSCRIÇÕES EM CURSOS
CREATE TABLE IF NOT EXISTS course_enrollments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  course_id UUID REFERENCES courses(id),
  user_id UUID,
  progress DECIMAL(5,2) DEFAULT 0,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(course_id, user_id)
);

-- 9. CRIAR TABELA DE AVALIAÇÕES CLÍNICAS
CREATE TABLE IF NOT EXISTS clinical_assessments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_id UUID,
  doctor_id UUID,
  assessment_type TEXT, -- IMRE, AEC, etc
  data JSONB,
  status TEXT DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'completed', 'reviewed')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 10. CRIAR TABELA DE DOCUMENTOS (Chat IA)
CREATE TABLE IF NOT EXISTS documents (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  summary TEXT,
  keywords TEXT[] DEFAULT '{}',
  medical_terms TEXT[] DEFAULT '{}',
  embeddings JSONB,
  file_url TEXT,
  file_type TEXT,
  file_size INTEGER,
  uploaded_by UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 11. CRIAR TABELA DE SESSÕES DE CHAT IA
CREATE TABLE IF NOT EXISTS chat_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID,
  context_docs UUID[] DEFAULT '{}',
  messages JSONB DEFAULT '[]',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 12. CRIAR TABELA DE INTERAÇÕES NOA
CREATE TABLE IF NOT EXISTS user_interactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL,
  text_raw TEXT NOT NULL,
  context JSONB,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 13. CRIAR TABELA DE ANÁLISE SEMÂNTICA
CREATE TABLE IF NOT EXISTS semantic_analysis (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  chat_id UUID REFERENCES user_interactions(id) ON DELETE CASCADE,
  topics TEXT[],
  emotions TEXT,
  biomedical_terms TEXT[],
  interpretations TEXT,
  confidence DECIMAL(3,2) DEFAULT 0.5,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 14. CRIAR TABELA DE SOLICITAÇÕES DE MODERAÇÃO
CREATE TABLE IF NOT EXISTS moderator_requests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID,
  reason TEXT NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined')),
  admin_response TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 15. CRIAR TABELA DE USUÁRIOS SILENCIADOS
CREATE TABLE IF NOT EXISTS user_mutes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID,
  muted_by UUID,
  reason TEXT,
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 16. CRIAR TABELA DE MENSAGENS DE CHAT GLOBAL
CREATE TABLE IF NOT EXISTS chat_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID,
  content TEXT NOT NULL,
  channel TEXT DEFAULT 'general',
  is_pinned BOOLEAN DEFAULT false,
  is_deleted BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 17. CRIAR TABELA DE PERFIS (SE NÃO EXISTIR)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID,
  name TEXT,
  email TEXT,
  type TEXT CHECK (type IN ('patient', 'professional', 'student', 'admin')),
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 18. INSERIR DADOS INICIAIS
INSERT INTO channels (name, description, type) VALUES
('Geral', 'Canal geral para discussões', 'public'),
('Cannabis Medicinal', 'Discussões sobre cannabis medicinal', 'public'),
('Casos Clínicos', 'Discussão de casos complexos', 'public'),
('Pesquisa', 'Pesquisas e estudos recentes', 'public'),
('Suporte', 'Suporte técnico e ajuda', 'private');

-- 19. INSERIR CURSOS INICIAIS
INSERT INTO courses (title, description, category, level, duration, price) VALUES
('Arte da Entrevista Clínica', 'Curso completo sobre técnicas de entrevista clínica', 'Clínica', 'intermediate', 120, 299.90),
('Pós-Graduação Cannabis Medicinal', 'Especialização em cannabis medicinal', 'Especialização', 'advanced', 480, 2999.90),
('Sistema IMRE Triaxial', 'Metodologia IMRE para avaliação clínica', 'Metodologia', 'intermediate', 90, 199.90),
('Introdução à Cannabis Medicinal', 'Curso introdutório sobre cannabis medicinal', 'Introdução', 'beginner', 60, 99.90);

-- 20. VERIFICAR SE TUDO FOI CRIADO
SELECT 
    'TABELAS CRIADAS COM SUCESSO!' as status,
    (SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public') as total_tables;
