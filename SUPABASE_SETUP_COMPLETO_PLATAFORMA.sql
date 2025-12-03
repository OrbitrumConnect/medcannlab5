-- =====================================================
-- 🏥 MEDCANLAB 3.0 - SETUP COMPLETO DO SUPABASE
-- =====================================================
-- Script completo para configurar TODAS as funcionalidades da plataforma
-- Baseado no Documento Mestre e análise do código
-- Execute este script no Supabase SQL Editor
-- =====================================================

-- =====================================================
-- PARTE 1: TABELAS PRINCIPAIS
-- =====================================================

-- 1. PROFILES (Perfis de usuários - compatível com auth.users)
-- =====================================================
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  name TEXT,
  type TEXT CHECK (type IN ('patient', 'professional', 'student', 'admin')),
  crm TEXT,
  cro TEXT,
  avatar_url TEXT,
  phone TEXT,
  address TEXT,
  blood_type TEXT,
  allergies TEXT[],
  medications TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. DOCUMENTS (Biblioteca de documentos)
-- =====================================================
CREATE TABLE IF NOT EXISTS documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  content TEXT,
  summary TEXT,
  file_url TEXT,
  file_type TEXT,
  file_size INTEGER,
  author TEXT,
  category TEXT,
  target_audience TEXT[] DEFAULT '{}',
  tags TEXT[] DEFAULT '{}',
  keywords TEXT[] DEFAULT '{}',
  medical_terms TEXT[] DEFAULT '{}',
  isLinkedToAI BOOLEAN DEFAULT false,
  aiRelevance DECIMAL(3,2) DEFAULT 0.5,
  embeddings JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. IMRE_ASSESSMENTS (Avaliações IMRE Triaxial)
-- =====================================================
CREATE TABLE IF NOT EXISTS imre_assessments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  patient_id UUID,
  assessment_type VARCHAR(50) DEFAULT 'triaxial',
  triaxial_data JSONB NOT NULL DEFAULT '{}'::jsonb,
  semantic_context JSONB NOT NULL DEFAULT '{}'::jsonb,
  emotional_indicators JSONB,
  cognitive_patterns JSONB,
  behavioral_markers JSONB,
  assessment_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  session_duration INTEGER,
  completion_status VARCHAR(20) DEFAULT 'in_progress' CHECK (completion_status IN ('in_progress', 'completed', 'abandoned')),
  clinical_notes TEXT,
  risk_factors JSONB,
  therapeutic_goals JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. CLINICAL_ASSESSMENTS (Avaliações clínicas)
-- =====================================================
CREATE TABLE IF NOT EXISTS clinical_assessments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL,
  doctor_id UUID REFERENCES auth.users(id),
  assessment_type TEXT DEFAULT 'IMRE',
  data JSONB NOT NULL DEFAULT '{}'::jsonb,
  status TEXT DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'completed', 'reviewed')),
  clinical_report TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. CLINICAL_REPORTS (Relatórios clínicos)
-- =====================================================
CREATE TABLE IF NOT EXISTS clinical_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL,
  professional_id UUID REFERENCES auth.users(id),
  assessment_id UUID REFERENCES clinical_assessments(id),
  report_data JSONB NOT NULL DEFAULT '{}'::jsonb,
  report_type TEXT DEFAULT 'IMRE',
  status TEXT DEFAULT 'generated' CHECK (status IN ('generated', 'reviewed', 'shared')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. APPOINTMENTS (Agendamentos)
-- =====================================================
CREATE TABLE IF NOT EXISTS appointments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL,
  professional_id UUID REFERENCES auth.users(id),
  appointment_date TIMESTAMP WITH TIME ZONE NOT NULL,
  duration_minutes INTEGER DEFAULT 60,
  status TEXT DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'completed', 'cancelled', 'no_show')),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. NOTIFICATIONS (Notificações)
-- =====================================================
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT DEFAULT 'info' CHECK (type IN ('info', 'warning', 'success', 'error')),
  is_read BOOLEAN DEFAULT false,
  link TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Garantir que a coluna is_read existe (caso a tabela já exista sem ela)
DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'notifications') THEN
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'notifications' 
      AND column_name = 'is_read'
    ) THEN
      ALTER TABLE notifications ADD COLUMN is_read BOOLEAN DEFAULT false;
    END IF;
  END IF;
END $$;

-- Garantir que a coluna is_read existe (caso a tabela já exista sem ela)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'notifications' 
    AND column_name = 'is_read'
  ) THEN
    ALTER TABLE notifications ADD COLUMN is_read BOOLEAN DEFAULT false;
  END IF;
END $$;

-- 8. CHAT_MESSAGES (Mensagens do chat global)
-- =====================================================
CREATE TABLE IF NOT EXISTS chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  message_content TEXT,
  channel_id UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 9. FORUM_POSTS (Posts do fórum)
-- =====================================================
CREATE TABLE IF NOT EXISTS forum_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  category TEXT,
  tags TEXT[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 10. FORUM_COMMENTS (Comentários do fórum)
-- =====================================================
CREATE TABLE IF NOT EXISTS forum_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID REFERENCES forum_posts(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 11. FORUM_LIKES (Likes do fórum)
-- =====================================================
CREATE TABLE IF NOT EXISTS forum_likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID REFERENCES forum_posts(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(post_id, user_id)
);

-- 12. FORUM_VIEWS (Visualizações do fórum)
-- =====================================================
CREATE TABLE IF NOT EXISTS forum_views (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID REFERENCES forum_posts(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(post_id, user_id)
);

-- 13. COURSE_MODULES (Módulos de cursos)
-- =====================================================
CREATE TABLE IF NOT EXISTS course_modules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID,
  title TEXT NOT NULL,
  description TEXT,
  content TEXT,
  lesson_content TEXT,
  order_index INTEGER DEFAULT 0,
  duration_hours INTEGER DEFAULT 0,
  is_locked BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 14. COURSES (Cursos)
-- =====================================================
CREATE TABLE IF NOT EXISTS courses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  instructor_id UUID REFERENCES auth.users(id),
  duration_hours INTEGER DEFAULT 0,
  price DECIMAL(10,2) DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 15. COURSE_ENROLLMENTS (Inscrições em cursos)
-- =====================================================
CREATE TABLE IF NOT EXISTS course_enrollments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
  progress_percentage INTEGER DEFAULT 0 CHECK (progress_percentage >= 0 AND progress_percentage <= 100),
  status TEXT DEFAULT 'enrolled' CHECK (status IN ('enrolled', 'completed', 'dropped')),
  enrolled_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE,
  UNIQUE(user_id, course_id)
);

-- 16. TRANSACTIONS (Transações financeiras)
-- =====================================================
CREATE TABLE IF NOT EXISTS transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  amount DECIMAL(10,2) NOT NULL CHECK (amount > 0),
  currency VARCHAR(3) DEFAULT 'BRL',
  description TEXT,
  type VARCHAR(50) NOT NULL CHECK (type IN ('payment', 'refund', 'subscription', 'bonus')),
  status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'cancelled')),
  payment_method VARCHAR(50),
  payment_id TEXT,
  gateway_response JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 17. USER_PROFILES (Perfis com gamificação)
-- =====================================================
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  name TEXT,
  avatar_url TEXT,
  bio TEXT,
  specialty TEXT,
  crm TEXT,
  cro TEXT,
  points INTEGER DEFAULT 0,
  level INTEGER DEFAULT 1,
  achievements TEXT[] DEFAULT '{}',
  badges TEXT[] DEFAULT '{}',
  last_activity TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  total_sessions INTEGER DEFAULT 0,
  total_time_spent INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 18. PATIENT_PRESCRIPTIONS (Prescrições)
-- =====================================================
CREATE TABLE IF NOT EXISTS patient_prescriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL,
  professional_id UUID REFERENCES auth.users(id),
  prescription_data JSONB NOT NULL DEFAULT '{}'::jsonb,
  rationality TEXT[] DEFAULT '{}',
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'cancelled')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 19. MODERATOR_REQUESTS (Solicitações de moderação)
-- =====================================================
CREATE TABLE IF NOT EXISTS moderator_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  message_id UUID,
  reason TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 20. USER_MUTES (Usuários silenciados)
-- =====================================================
CREATE TABLE IF NOT EXISTS user_mutes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  muted_until TIMESTAMP WITH TIME ZONE,
  reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 21. USER_INTERACTIONS (Interações dos usuários)
-- =====================================================
CREATE TABLE IF NOT EXISTS user_interactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  text_raw TEXT NOT NULL,
  context JSONB,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 22. SEMANTIC_ANALYSIS (Análise semântica)
-- =====================================================
CREATE TABLE IF NOT EXISTS semantic_analysis (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chat_id UUID REFERENCES user_interactions(id) ON DELETE CASCADE,
  topics TEXT[],
  emotions TEXT,
  biomedical_terms TEXT[],
  interpretations TEXT,
  confidence DECIMAL(3,2) DEFAULT 0.5,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- PARTE 2: ÍNDICES PARA PERFORMANCE
-- =====================================================

-- Índices para documents (verifica se colunas existem)
DO $$
BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'documents') THEN
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'documents' AND column_name = 'category') THEN
            CREATE INDEX IF NOT EXISTS idx_documents_category ON documents(category);
        END IF;
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'documents' AND column_name = 'isLinkedToAI') THEN
            CREATE INDEX IF NOT EXISTS idx_documents_isLinkedToAI ON documents("isLinkedToAI");
        END IF;
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'documents' AND column_name = 'created_at') THEN
            CREATE INDEX IF NOT EXISTS idx_documents_created_at ON documents(created_at DESC);
        END IF;
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'documents' AND column_name = 'tags') THEN
            CREATE INDEX IF NOT EXISTS idx_documents_tags ON documents USING GIN(tags);
        END IF;
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'documents' AND column_name = 'keywords') THEN
            CREATE INDEX IF NOT EXISTS idx_documents_keywords ON documents USING GIN(keywords);
        END IF;
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'documents' AND column_name = 'target_audience') THEN
            CREATE INDEX IF NOT EXISTS idx_documents_target_audience ON documents USING GIN(target_audience);
        END IF;
    END IF;
END $$;

-- Índices para imre_assessments (verifica se colunas existem)
DO $$
BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'imre_assessments') THEN
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'imre_assessments' AND column_name = 'user_id') THEN
            CREATE INDEX IF NOT EXISTS idx_imre_user_id ON imre_assessments(user_id);
        END IF;
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'imre_assessments' AND column_name = 'patient_id') THEN
            CREATE INDEX IF NOT EXISTS idx_imre_patient_id ON imre_assessments(patient_id);
        END IF;
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'imre_assessments' AND column_name = 'completion_status') THEN
            CREATE INDEX IF NOT EXISTS idx_imre_completion_status ON imre_assessments(completion_status);
        END IF;
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'imre_assessments' AND column_name = 'triaxial_data') THEN
            CREATE INDEX IF NOT EXISTS idx_imre_triaxial_data ON imre_assessments USING GIN(triaxial_data);
        END IF;
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'imre_assessments' AND column_name = 'semantic_context') THEN
            CREATE INDEX IF NOT EXISTS idx_imre_semantic_context ON imre_assessments USING GIN(semantic_context);
        END IF;
    END IF;
END $$;

-- Índices para clinical_assessments (verifica se colunas existem)
DO $$
BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'clinical_assessments') THEN
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'clinical_assessments' AND column_name = 'patient_id') THEN
            CREATE INDEX IF NOT EXISTS idx_clinical_patient_id ON clinical_assessments(patient_id);
        END IF;
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'clinical_assessments' AND column_name = 'doctor_id') THEN
            CREATE INDEX IF NOT EXISTS idx_clinical_doctor_id ON clinical_assessments(doctor_id);
        END IF;
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'clinical_assessments' AND column_name = 'status') THEN
            CREATE INDEX IF NOT EXISTS idx_clinical_status ON clinical_assessments(status);
        END IF;
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'clinical_assessments' AND column_name = 'data') THEN
            CREATE INDEX IF NOT EXISTS idx_clinical_data ON clinical_assessments USING GIN(data);
        END IF;
    END IF;
END $$;

-- Índices para appointments (verifica se colunas existem)
DO $$
BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'appointments') THEN
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'appointments' AND column_name = 'patient_id') THEN
            CREATE INDEX IF NOT EXISTS idx_appointments_patient_id ON appointments(patient_id);
        END IF;
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'appointments' AND column_name = 'professional_id') THEN
            CREATE INDEX IF NOT EXISTS idx_appointments_professional_id ON appointments(professional_id);
        END IF;
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'appointments' AND column_name = 'appointment_date') THEN
            CREATE INDEX IF NOT EXISTS idx_appointments_date ON appointments(appointment_date);
        END IF;
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'appointments' AND column_name = 'status') THEN
            CREATE INDEX IF NOT EXISTS idx_appointments_status ON appointments(status);
        END IF;
    END IF;
END $$;

-- Índices para notifications (verifica se colunas existem)
DO $$
BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'notifications') THEN
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'notifications' AND column_name = 'user_id') THEN
            CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
        END IF;
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'notifications' AND column_name = 'is_read') THEN
            CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);
        END IF;
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'notifications' AND column_name = 'created_at') THEN
            CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);
        END IF;
    END IF;
END $$;

-- Índices para forum (verifica se colunas existem)
DO $$
BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'forum_posts') THEN
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'forum_posts' AND column_name = 'user_id') THEN
            CREATE INDEX IF NOT EXISTS idx_forum_posts_user_id ON forum_posts(user_id);
        END IF;
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'forum_posts' AND column_name = 'category') THEN
            CREATE INDEX IF NOT EXISTS idx_forum_posts_category ON forum_posts(category);
        END IF;
    END IF;
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'forum_comments') THEN
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'forum_comments' AND column_name = 'post_id') THEN
            CREATE INDEX IF NOT EXISTS idx_forum_comments_post_id ON forum_comments(post_id);
        END IF;
    END IF;
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'forum_likes') THEN
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'forum_likes' AND column_name = 'post_id') THEN
            CREATE INDEX IF NOT EXISTS idx_forum_likes_post_id ON forum_likes(post_id);
        END IF;
    END IF;
END $$;

-- Índices para courses (verifica se colunas existem)
DO $$
BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'course_enrollments') THEN
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'course_enrollments' AND column_name = 'user_id') THEN
            CREATE INDEX IF NOT EXISTS idx_course_enrollments_user_id ON course_enrollments(user_id);
        END IF;
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'course_enrollments' AND column_name = 'course_id') THEN
            CREATE INDEX IF NOT EXISTS idx_course_enrollments_course_id ON course_enrollments(course_id);
        END IF;
    END IF;
END $$;

-- =====================================================
-- PARTE 3: TRIGGERS PARA UPDATED_AT
-- =====================================================

-- Função para atualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Aplicar triggers em todas as tabelas com updated_at
DO $$
DECLARE
    tbl RECORD;
BEGIN
    FOR tbl IN 
        SELECT tablename FROM pg_tables 
        WHERE schemaname = 'public' 
        AND tablename IN (
            'profiles', 'documents', 'imre_assessments', 'clinical_assessments',
            'clinical_reports', 'appointments', 'course_modules', 'courses',
            'transactions', 'user_profiles', 'patient_prescriptions', 'forum_posts',
            'forum_comments'
        )
    LOOP
        EXECUTE format('
            DROP TRIGGER IF EXISTS update_%s_updated_at ON %I;
            CREATE TRIGGER update_%s_updated_at
                BEFORE UPDATE ON %I
                FOR EACH ROW
                EXECUTE FUNCTION update_updated_at_column();
        ', tbl.tablename, tbl.tablename, tbl.tablename, tbl.tablename);
    END LOOP;
END $$;

-- =====================================================
-- PARTE 4: POLÍTICAS RLS (ROW LEVEL SECURITY)
-- =====================================================

-- Habilitar RLS em todas as tabelas (apenas se existirem)
DO $$
DECLARE
    tbl RECORD;
BEGIN
    FOR tbl IN 
        SELECT tablename FROM pg_tables 
        WHERE schemaname = 'public' 
        AND tablename IN (
            'profiles', 'documents', 'imre_assessments', 'clinical_assessments',
            'clinical_reports', 'appointments', 'notifications', 'chat_messages',
            'forum_posts', 'forum_comments', 'forum_likes', 'forum_views',
            'course_modules', 'courses', 'course_enrollments', 'transactions',
            'user_profiles', 'patient_prescriptions'
        )
    LOOP
        EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', tbl.tablename);
    END LOOP;
END $$;

-- Políticas para PROFILES (usa id, não user_id)
DO $$
BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'profiles') THEN
        DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
        CREATE POLICY "Users can view own profile" ON profiles FOR SELECT USING (auth.uid() = id);

        DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
        CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);

        DROP POLICY IF EXISTS "Authenticated users can insert profile" ON profiles;
        CREATE POLICY "Authenticated users can insert profile" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);
    END IF;
END $$;

-- Políticas para DOCUMENTS
DROP POLICY IF EXISTS "Authenticated users can view documents" ON documents;
CREATE POLICY "Authenticated users can view documents" ON documents FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Authenticated users can insert documents" ON documents;
CREATE POLICY "Authenticated users can insert documents" ON documents FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "Authenticated users can update documents" ON documents;
CREATE POLICY "Authenticated users can update documents" ON documents FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Authenticated users can delete documents" ON documents;
CREATE POLICY "Authenticated users can delete documents" ON documents FOR DELETE TO authenticated USING (true);

-- Políticas para IMRE_ASSESSMENTS (verifica se coluna user_id existe)
DO $$
BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'imre_assessments') THEN
        -- Remover todas as políticas antigas primeiro
        DROP POLICY IF EXISTS "Users can view own assessments" ON imre_assessments;
        DROP POLICY IF EXISTS "Users can insert own assessments" ON imre_assessments;
        DROP POLICY IF EXISTS "Users can update own assessments" ON imre_assessments;
        DROP POLICY IF EXISTS "Professionals can view patient assessments" ON imre_assessments;
        DROP POLICY IF EXISTS "Authenticated users can view assessments" ON imre_assessments;
        DROP POLICY IF EXISTS "Authenticated users can insert assessments" ON imre_assessments;
        DROP POLICY IF EXISTS "Authenticated users can update assessments" ON imre_assessments;
        
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'imre_assessments' AND column_name = 'user_id') THEN
            -- Política para usuários verem suas próprias avaliações
            CREATE POLICY "Users can view own assessments" 
            ON imre_assessments 
            FOR SELECT 
            USING (auth.uid() = user_id);

            -- Política para usuários inserirem suas próprias avaliações
            CREATE POLICY "Users can insert own assessments" 
            ON imre_assessments 
            FOR INSERT 
            WITH CHECK (auth.uid() = user_id);

            -- Política para usuários atualizarem suas próprias avaliações
            CREATE POLICY "Users can update own assessments" 
            ON imre_assessments 
            FOR UPDATE 
            USING (auth.uid() = user_id)
            WITH CHECK (auth.uid() = user_id);
            
            -- Política para profissionais verem avaliações de seus pacientes
            CREATE POLICY "Professionals can view patient assessments" 
            ON imre_assessments 
            FOR SELECT 
            USING (
                EXISTS (
                    SELECT 1 FROM profiles 
                    WHERE id = auth.uid() 
                    AND type IN ('professional', 'admin')
                )
            );
        ELSE
            -- Se não tem user_id, permitir acesso autenticado (temporário)
            CREATE POLICY "Authenticated users can view assessments" 
            ON imre_assessments 
            FOR SELECT 
            TO authenticated 
            USING (true);
            
            CREATE POLICY "Authenticated users can insert assessments" 
            ON imre_assessments 
            FOR INSERT 
            TO authenticated 
            WITH CHECK (true);
            
            CREATE POLICY "Authenticated users can update assessments" 
            ON imre_assessments 
            FOR UPDATE 
            TO authenticated 
            USING (true)
            WITH CHECK (true);
        END IF;
    END IF;
END $$;

-- Políticas para CLINICAL_ASSESSMENTS
DROP POLICY IF EXISTS "Professionals can view their assessments" ON clinical_assessments;
CREATE POLICY "Professionals can view their assessments" ON clinical_assessments FOR SELECT USING (
  auth.uid() = doctor_id OR 
  auth.uid() = patient_id OR
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND type = 'admin')
);

DROP POLICY IF EXISTS "Professionals can insert assessments" ON clinical_assessments;
CREATE POLICY "Professionals can insert assessments" ON clinical_assessments FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND type IN ('professional', 'admin'))
);

-- Políticas para CLINICAL_REPORTS
DROP POLICY IF EXISTS "Users can view relevant reports" ON clinical_reports;
CREATE POLICY "Users can view relevant reports" ON clinical_reports FOR SELECT USING (
  auth.uid() = professional_id OR 
  auth.uid() = patient_id OR
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND type = 'admin')
);

-- Políticas para APPOINTMENTS
DROP POLICY IF EXISTS "Users can view relevant appointments" ON appointments;
CREATE POLICY "Users can view relevant appointments" ON appointments FOR SELECT USING (
  auth.uid() = patient_id OR 
  auth.uid() = professional_id OR
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND type = 'admin')
);

DROP POLICY IF EXISTS "Professionals can insert appointments" ON appointments;
CREATE POLICY "Professionals can insert appointments" ON appointments FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND type IN ('professional', 'admin'))
);

-- Políticas para NOTIFICATIONS (verifica se coluna user_id existe)
DO $$
BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'notifications') THEN
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'notifications' AND column_name = 'user_id') THEN
            DROP POLICY IF EXISTS "Users can view own notifications" ON notifications;
            CREATE POLICY "Users can view own notifications" ON notifications FOR SELECT USING (auth.uid() = user_id);

            DROP POLICY IF EXISTS "Users can update own notifications" ON notifications;
            CREATE POLICY "Users can update own notifications" ON notifications FOR UPDATE USING (auth.uid() = user_id);
        END IF;
    END IF;
END $$;

-- Políticas para CHAT_MESSAGES (verifica se coluna user_id existe)
DO $$
BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'chat_messages') THEN
        DROP POLICY IF EXISTS "Authenticated users can view messages" ON chat_messages;
        CREATE POLICY "Authenticated users can view messages" ON chat_messages FOR SELECT TO authenticated USING (true);

        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'chat_messages' AND column_name = 'user_id') THEN
            DROP POLICY IF EXISTS "Authenticated users can insert messages" ON chat_messages;
            CREATE POLICY "Authenticated users can insert messages" ON chat_messages FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
        END IF;
    END IF;
END $$;

-- Políticas para FORUM (verifica se colunas user_id existem)
DO $$
BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'forum_posts') THEN
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'forum_posts' AND column_name = 'user_id') THEN
            DROP POLICY IF EXISTS "Authenticated users can view forum posts" ON forum_posts;
            CREATE POLICY "Authenticated users can view forum posts" ON forum_posts FOR SELECT TO authenticated USING (true);

            DROP POLICY IF EXISTS "Authenticated users can insert forum posts" ON forum_posts;
            CREATE POLICY "Authenticated users can insert forum posts" ON forum_posts FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

            DROP POLICY IF EXISTS "Users can update own forum posts" ON forum_posts;
            CREATE POLICY "Users can update own forum posts" ON forum_posts FOR UPDATE USING (auth.uid() = user_id);
        END IF;
    END IF;

    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'forum_comments') THEN
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'forum_comments' AND column_name = 'user_id') THEN
            DROP POLICY IF EXISTS "Authenticated users can view forum comments" ON forum_comments;
            CREATE POLICY "Authenticated users can view forum comments" ON forum_comments FOR SELECT TO authenticated USING (true);

            DROP POLICY IF EXISTS "Authenticated users can insert forum comments" ON forum_comments;
            CREATE POLICY "Authenticated users can insert forum comments" ON forum_comments FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
        END IF;
    END IF;
END $$;

-- Políticas para COURSES (verifica se colunas existem)
DO $$
BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'courses') THEN
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'courses' AND column_name = 'is_active') THEN
            DROP POLICY IF EXISTS "Authenticated users can view active courses" ON courses;
            CREATE POLICY "Authenticated users can view active courses" ON courses FOR SELECT TO authenticated USING (is_active = true);
        ELSE
            DROP POLICY IF EXISTS "Authenticated users can view courses" ON courses;
            CREATE POLICY "Authenticated users can view courses" ON courses FOR SELECT TO authenticated USING (true);
        END IF;
    END IF;

    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'course_enrollments') THEN
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'course_enrollments' AND column_name = 'user_id') THEN
            DROP POLICY IF EXISTS "Users can view own enrollments" ON course_enrollments;
            CREATE POLICY "Users can view own enrollments" ON course_enrollments FOR SELECT USING (auth.uid() = user_id);

            DROP POLICY IF EXISTS "Users can enroll in courses" ON course_enrollments;
            CREATE POLICY "Users can enroll in courses" ON course_enrollments FOR INSERT WITH CHECK (auth.uid() = user_id);
        END IF;
    END IF;
END $$;

-- Políticas para TRANSACTIONS (verifica se coluna user_id existe)
DO $$
BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'transactions') THEN
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'transactions' AND column_name = 'user_id') THEN
            DROP POLICY IF EXISTS "Users can view own transactions" ON transactions;
            CREATE POLICY "Users can view own transactions" ON transactions FOR SELECT USING (auth.uid() = user_id);
        END IF;
    END IF;
END $$;

-- Políticas para USER_PROFILES (verifica se coluna user_id existe)
DO $$
BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'user_profiles') THEN
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'user_profiles' AND column_name = 'user_id') THEN
            DROP POLICY IF EXISTS "Users can view own profile" ON user_profiles;
            CREATE POLICY "Users can view own profile" ON user_profiles FOR SELECT USING (auth.uid() = user_id);

            DROP POLICY IF EXISTS "Users can update own profile" ON user_profiles;
            CREATE POLICY "Users can update own profile" ON user_profiles FOR UPDATE USING (auth.uid() = user_id);
        END IF;
    END IF;
END $$;

-- Políticas para PATIENT_PRESCRIPTIONS
DROP POLICY IF EXISTS "Users can view relevant prescriptions" ON patient_prescriptions;
CREATE POLICY "Users can view relevant prescriptions" ON patient_prescriptions FOR SELECT USING (
  auth.uid() = patient_id OR 
  auth.uid() = professional_id OR
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND type = 'admin')
);

-- =====================================================
-- PARTE 5: FUNÇÕES AUXILIARES PARA KPIs
-- =====================================================

-- Função: Contar narrativas preservadas
CREATE OR REPLACE FUNCTION count_preserved_narratives()
RETURNS INTEGER AS $$
BEGIN
  RETURN (
    SELECT COUNT(*)::INTEGER
    FROM imre_assessments
    WHERE completion_status = 'completed'
    AND semantic_context IS NOT NULL
    AND semantic_context != '{}'::jsonb
    AND (semantic_context->>'preserved_narrative')::boolean = true
  );
END;
$$ LANGUAGE plpgsql;

-- Função: Contar análises multirracionais
CREATE OR REPLACE FUNCTION count_multirational_analyses()
RETURNS INTEGER AS $$
BEGIN
  RETURN (
    SELECT COUNT(*)::INTEGER
    FROM imre_assessments
    WHERE completion_status = 'completed'
    AND triaxial_data IS NOT NULL
    AND jsonb_array_length(COALESCE(triaxial_data->'rationalities', '[]'::jsonb)) >= 4
  );
END;
$$ LANGUAGE plpgsql;

-- Função: Contar blocos de dados primários
CREATE OR REPLACE FUNCTION count_primary_data_blocks()
RETURNS INTEGER AS $$
BEGIN
  RETURN (
    SELECT COALESCE(SUM(
      jsonb_array_length(COALESCE(semantic_context->'semantic_blocks', '[]'::jsonb))
    ), 0)::INTEGER
    FROM imre_assessments
    WHERE completion_status = 'completed'
  );
END;
$$ LANGUAGE plpgsql;

-- Função: Contar correlações identificadas
CREATE OR REPLACE FUNCTION count_identified_correlations()
RETURNS INTEGER AS $$
BEGIN
  RETURN (
    SELECT COUNT(*)::INTEGER
    FROM imre_assessments
    WHERE completion_status = 'completed'
    AND triaxial_data IS NOT NULL
    AND (triaxial_data->>'has_correlations')::boolean = true
  );
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- PARTE 6: FUNÇÕES RPC E VIEWS PARA DASHBOARDS
-- =====================================================

-- Função RPC: Contar notificações não lidas
CREATE OR REPLACE FUNCTION get_unread_notifications_count(user_uuid UUID)
RETURNS INTEGER AS $$
BEGIN
  RETURN (
    SELECT COUNT(*)::INTEGER
    FROM notifications
    WHERE user_id = user_uuid
    AND (is_read = false OR is_read IS NULL)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- View: KPIs básicos (remove view antiga se existir e cria nova)
DROP VIEW IF EXISTS v_kpi_basic CASCADE;
CREATE VIEW v_kpi_basic AS
SELECT 
  (SELECT COUNT(*) FROM profiles WHERE type = 'patient') as total_patients,
  (SELECT COUNT(*) FROM imre_assessments WHERE completion_status = 'completed') as completed_assessments,
  (SELECT COUNT(*) FROM appointments WHERE status = 'scheduled') as scheduled_appointments,
  (SELECT COUNT(*) FROM documents WHERE "isLinkedToAI" = true) as ai_linked_documents;

-- View: KPIs do dashboard do médico
DROP VIEW IF EXISTS v_doctor_dashboard_kpis CASCADE;
CREATE VIEW v_doctor_dashboard_kpis AS
SELECT 
  -- Agendamentos de hoje
  (SELECT COUNT(*) 
   FROM appointments 
   WHERE DATE(appointment_date) = CURRENT_DATE
   AND status IN ('scheduled', 'confirmed'))::INTEGER as total_today,
  
  -- Agendamentos confirmados hoje
  (SELECT COUNT(*) 
   FROM appointments 
   WHERE DATE(appointment_date) = CURRENT_DATE
   AND status = 'confirmed')::INTEGER as confirmed_today,
  
  -- Pacientes na sala de espera hoje
  (SELECT COUNT(*) 
   FROM appointments 
   WHERE DATE(appointment_date) = CURRENT_DATE
   AND status = 'waiting')::INTEGER as waiting_room_today,
  
  -- Agendamentos completados hoje
  (SELECT COUNT(*) 
   FROM appointments 
   WHERE DATE(appointment_date) = CURRENT_DATE
   AND status = 'completed')::INTEGER as completed_today,
  
  -- Próximos 24 horas
  (SELECT COUNT(*) 
   FROM appointments 
   WHERE appointment_date >= NOW()
   AND appointment_date <= NOW() + INTERVAL '24 hours'
   AND status IN ('scheduled', 'confirmed'))::INTEGER as next_24h,
  
  -- Próximos agendamentos (futuros)
  (SELECT COUNT(*) 
   FROM appointments 
   WHERE appointment_date > NOW()
   AND status IN ('scheduled', 'confirmed'))::INTEGER as upcoming,
  
  -- Mensagens não lidas (a tabela chat_messages não tem recipient_id nem is_read)
  -- Usar 0 como placeholder até implementar sistema de mensagens diretas
  0::INTEGER as unread_messages;

-- View: Próximos agendamentos (remove view antiga se existir e cria nova)
DROP VIEW IF EXISTS v_next_appointments CASCADE;
CREATE VIEW v_next_appointments AS
SELECT 
  a.id,
  a.appointment_date as appt_at,  -- Nome esperado pelo código
  a.patient_id,
  a.professional_id,
  CASE 
    WHEN a.status = 'scheduled' THEN 'scheduled'
    WHEN a.status = 'confirmed' THEN 'confirmed'
    WHEN a.status = 'waiting' THEN 'waiting'
    WHEN a.status = 'completed' THEN 'completed'
    WHEN a.status = 'cancelled' THEN 'cancelled'
    ELSE COALESCE(a.status, 'scheduled')
  END as status_norm,  -- Nome esperado pelo código
  a.title,
  a.description,
  a.duration,
  a.type,
  a.location,
  a.is_remote,
  a.meeting_url,
  p.name as patient_name,
  p.email as patient_email,
  prof.name as professional_name
FROM appointments a
LEFT JOIN profiles p ON a.patient_id = p.id
LEFT JOIN profiles prof ON a.professional_id = prof.id
WHERE a.appointment_date >= NOW()
ORDER BY a.appointment_date ASC;

-- =====================================================
-- PARTE 7: VERIFICAÇÃO FINAL
-- =====================================================

-- Verificar tabelas criadas
SELECT 
  'Tabelas criadas:' as status,
  COUNT(*) as total
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN (
  'profiles', 'documents', 'imre_assessments', 'clinical_assessments',
  'clinical_reports', 'appointments', 'notifications', 'chat_messages',
  'forum_posts', 'forum_comments', 'forum_likes', 'forum_views',
  'course_modules', 'courses', 'course_enrollments', 'transactions',
  'user_profiles', 'patient_prescriptions', 'moderator_requests',
  'user_mutes', 'user_interactions', 'semantic_analysis'
);

-- Verificar políticas RLS criadas
SELECT 
  'Políticas RLS criadas:' as status,
  COUNT(*) as total
FROM pg_policies
WHERE schemaname = 'public';

-- Verificar índices criados
SELECT 
  'Índices criados:' as status,
  COUNT(*) as total
FROM pg_indexes
WHERE schemaname = 'public'
AND indexname LIKE 'idx_%';

-- =====================================================
-- FIM DO SCRIPT
-- =====================================================
-- ✅ Todas as tabelas, políticas RLS, índices e funções foram criados
-- ✅ A plataforma está pronta para uso completo
-- =====================================================

