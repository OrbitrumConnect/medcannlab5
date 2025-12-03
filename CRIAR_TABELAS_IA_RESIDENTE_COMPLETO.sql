-- =====================================================
-- 🏥 MEDCANLAB 3.0 - TABELAS PARA IA RESIDENTE
-- =====================================================
-- Execute este script no Supabase SQL Editor
-- Este script cria todas as tabelas necessárias para a IA Residente funcionar completamente

-- =====================================================
-- 1. TABELA: PRONTUÁRIO ELETRÔNICO DO PACIENTE
-- =====================================================
CREATE TABLE IF NOT EXISTS patient_medical_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  professional_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  record_type TEXT NOT NULL CHECK (record_type IN (
    'chat_interaction',
    'assessment',
    'evolution',
    'prescription',
    'document',
    'appointment',
    'note',
    'test_result',
    'image'
  )),
  record_data JSONB NOT NULL,
  title TEXT,
  summary TEXT,
  tags TEXT[] DEFAULT '{}',
  is_important BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_patient_medical_records_patient_id ON patient_medical_records(patient_id);
CREATE INDEX IF NOT EXISTS idx_patient_medical_records_type ON patient_medical_records(record_type);
CREATE INDEX IF NOT EXISTS idx_patient_medical_records_created_at ON patient_medical_records(created_at DESC);

-- =====================================================
-- 2. TABELA: LOG DE ATIVIDADE DO USUÁRIO
-- =====================================================
CREATE TABLE IF NOT EXISTS user_activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  activity_type TEXT NOT NULL CHECK (activity_type IN (
    'login',
    'logout',
    'page_view',
    'chat_message',
    'assessment_started',
    'assessment_completed',
    'document_uploaded',
    'prescription_issued',
    'appointment_scheduled',
    'profile_updated'
  )),
  activity_data JSONB,
  ip_address TEXT,
  user_agent TEXT,
  session_id UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_activity_logs_user_id ON user_activity_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_user_activity_logs_type ON user_activity_logs(activity_type);
CREATE INDEX IF NOT EXISTS idx_user_activity_logs_created_at ON user_activity_logs(created_at DESC);

-- =====================================================
-- 3. TABELA: ESTATÍSTICAS DO USUÁRIO (CACHE)
-- =====================================================
CREATE TABLE IF NOT EXISTS user_statistics (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  total_logins INTEGER DEFAULT 0,
  total_chat_messages INTEGER DEFAULT 0,
  total_assessments INTEGER DEFAULT 0,
  total_appointments INTEGER DEFAULT 0,
  total_documents_uploaded INTEGER DEFAULT 0,
  last_login_at TIMESTAMP WITH TIME ZONE,
  last_activity_at TIMESTAMP WITH TIME ZONE,
  experience_points INTEGER DEFAULT 0,
  level INTEGER DEFAULT 1,
  streak_days INTEGER DEFAULT 0,
  last_streak_date DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 4. TABELA: DOCUMENTOS SALVOS PELA IA
-- =====================================================
CREATE TABLE IF NOT EXISTS ai_saved_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  patient_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  document_type TEXT NOT NULL CHECK (document_type IN (
    'assessment_report',
    'clinical_note',
    'prescription',
    'summary',
    'insight',
    'recommendation',
    'analysis'
  )),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  summary TEXT,
  metadata JSONB,
  file_url TEXT,
  file_type TEXT,
  is_shared_with_patient BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ai_saved_documents_user_id ON ai_saved_documents(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_saved_documents_patient_id ON ai_saved_documents(patient_id);
CREATE INDEX IF NOT EXISTS idx_ai_saved_documents_type ON ai_saved_documents(document_type);

-- =====================================================
-- 5. TABELA: INSIGHTS GERADOS PARA O PACIENTE
-- =====================================================
CREATE TABLE IF NOT EXISTS patient_insights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  insight_type TEXT NOT NULL CHECK (insight_type IN (
    'health_trend',
    'medication_adherence',
    'symptom_pattern',
    'lifestyle_recommendation',
    'treatment_effectiveness',
    'risk_alert',
    'achievement',
    'milestone'
  )),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  data JSONB,
  priority TEXT DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  is_read BOOLEAN DEFAULT false,
  is_archived BOOLEAN DEFAULT false,
  generated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_patient_insights_patient_id ON patient_insights(patient_id);
CREATE INDEX IF NOT EXISTS idx_patient_insights_type ON patient_insights(insight_type);
CREATE INDEX IF NOT EXISTS idx_patient_insights_read ON patient_insights(is_read, is_archived);

-- =====================================================
-- 6. TABELA: INTERAÇÕES DE CHAT COM IA (HISTÓRICO COMPLETO)
-- =====================================================
CREATE TABLE IF NOT EXISTS ai_chat_interactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  patient_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  session_id UUID,
  user_message TEXT NOT NULL,
  ai_response TEXT NOT NULL,
  intent TEXT,
  confidence DECIMAL(3,2),
  processing_time INTEGER, -- em milissegundos
  metadata JSONB,
  saved_to_medical_record BOOLEAN DEFAULT false,
  medical_record_id UUID REFERENCES patient_medical_records(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ai_chat_interactions_user_id ON ai_chat_interactions(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_chat_interactions_patient_id ON ai_chat_interactions(patient_id);
CREATE INDEX IF NOT EXISTS idx_ai_chat_interactions_session_id ON ai_chat_interactions(session_id);
CREATE INDEX IF NOT EXISTS idx_ai_chat_interactions_created_at ON ai_chat_interactions(created_at DESC);

-- =====================================================
-- 7. HABILITAR RLS EM TODAS AS TABELAS
-- =====================================================
ALTER TABLE patient_medical_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_statistics ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_saved_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE patient_insights ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_chat_interactions ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- 8. POLÍTICAS RLS PARA patient_medical_records
-- =====================================================
DROP POLICY IF EXISTS "Pacientes veem seus próprios registros" ON patient_medical_records;
CREATE POLICY "Pacientes veem seus próprios registros" ON patient_medical_records
  FOR SELECT USING (patient_id = auth.uid());

DROP POLICY IF EXISTS "Profissionais veem registros de seus pacientes" ON patient_medical_records;
CREATE POLICY "Profissionais veem registros de seus pacientes" ON patient_medical_records
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND (auth.users.raw_user_meta_data->>'type' = 'profissional' 
           OR auth.users.raw_user_meta_data->>'type' = 'professional'
           OR auth.users.raw_user_meta_data->>'type' = 'admin')
    )
  );

DROP POLICY IF EXISTS "IA pode inserir registros" ON patient_medical_records;
CREATE POLICY "IA pode inserir registros" ON patient_medical_records
  FOR INSERT WITH CHECK (true); -- Permitir inserção (será validado no código)

DROP POLICY IF EXISTS "Profissionais podem atualizar registros" ON patient_medical_records;
CREATE POLICY "Profissionais podem atualizar registros" ON patient_medical_records
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND (auth.users.raw_user_meta_data->>'type' = 'profissional' 
           OR auth.users.raw_user_meta_data->>'type' = 'professional'
           OR auth.users.raw_user_meta_data->>'type' = 'admin')
    )
  );

-- =====================================================
-- 9. POLÍTICAS RLS PARA user_activity_logs
-- =====================================================
DROP POLICY IF EXISTS "Usuários veem seus próprios logs" ON user_activity_logs;
CREATE POLICY "Usuários veem seus próprios logs" ON user_activity_logs
  FOR SELECT USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Usuários podem inserir seus próprios logs" ON user_activity_logs;
CREATE POLICY "Usuários podem inserir seus próprios logs" ON user_activity_logs
  FOR INSERT WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Admins veem todos os logs" ON user_activity_logs;
CREATE POLICY "Admins veem todos os logs" ON user_activity_logs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND (auth.users.raw_user_meta_data->>'type' = 'admin'
           OR auth.users.email = 'rrvalenca@gmail.com')
    )
  );

-- =====================================================
-- 10. POLÍTICAS RLS PARA user_statistics
-- =====================================================
DROP POLICY IF EXISTS "Usuários veem suas próprias estatísticas" ON user_statistics;
CREATE POLICY "Usuários veem suas próprias estatísticas" ON user_statistics
  FOR SELECT USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Sistema pode atualizar estatísticas" ON user_statistics;
CREATE POLICY "Sistema pode atualizar estatísticas" ON user_statistics
  FOR UPDATE USING (true); -- Permitir atualização (será validado no código)

-- =====================================================
-- 11. POLÍTICAS RLS PARA ai_saved_documents
-- =====================================================
DROP POLICY IF EXISTS "Usuários veem documentos relacionados" ON ai_saved_documents;
CREATE POLICY "Usuários veem documentos relacionados" ON ai_saved_documents
  FOR SELECT USING (
    user_id = auth.uid() 
    OR (patient_id = auth.uid() AND is_shared_with_patient = true)
    OR EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND (auth.users.raw_user_meta_data->>'type' = 'profissional' 
           OR auth.users.raw_user_meta_data->>'type' = 'professional'
           OR auth.users.raw_user_meta_data->>'type' = 'admin')
    )
  );

DROP POLICY IF EXISTS "IA pode salvar documentos" ON ai_saved_documents;
CREATE POLICY "IA pode salvar documentos" ON ai_saved_documents
  FOR INSERT WITH CHECK (true); -- Permitir inserção (será validado no código)

-- =====================================================
-- 12. POLÍTICAS RLS PARA patient_insights
-- =====================================================
DROP POLICY IF EXISTS "Pacientes veem seus próprios insights" ON patient_insights;
CREATE POLICY "Pacientes veem seus próprios insights" ON patient_insights
  FOR SELECT USING (patient_id = auth.uid());

DROP POLICY IF EXISTS "Pacientes podem atualizar leitura de insights" ON patient_insights;
CREATE POLICY "Pacientes podem atualizar leitura de insights" ON patient_insights
  FOR UPDATE USING (patient_id = auth.uid());

DROP POLICY IF EXISTS "IA pode criar insights" ON patient_insights;
CREATE POLICY "IA pode criar insights" ON patient_insights
  FOR INSERT WITH CHECK (true); -- Permitir inserção (será validado no código)

-- =====================================================
-- 13. POLÍTICAS RLS PARA ai_chat_interactions
-- =====================================================
DROP POLICY IF EXISTS "Usuários veem suas próprias interações" ON ai_chat_interactions;
CREATE POLICY "Usuários veem suas próprias interações" ON ai_chat_interactions
  FOR SELECT USING (user_id = auth.uid() OR patient_id = auth.uid());

DROP POLICY IF EXISTS "IA pode salvar interações" ON ai_chat_interactions;
CREATE POLICY "IA pode salvar interações" ON ai_chat_interactions
  FOR INSERT WITH CHECK (true); -- Permitir inserção (será validado no código)

-- =====================================================
-- 14. FUNÇÕES RPC PARA ACESSO A DADOS ADMINISTRATIVOS
-- =====================================================

-- Função para obter estatísticas do usuário
CREATE OR REPLACE FUNCTION get_user_statistics(p_user_id UUID)
RETURNS JSONB AS $$
DECLARE
  stats JSONB;
BEGIN
  SELECT jsonb_build_object(
    'total_logins', COALESCE(us.total_logins, 0),
    'total_chat_messages', COALESCE(us.total_chat_messages, 0),
    'total_assessments', COALESCE(us.total_assessments, 0),
    'total_appointments', COALESCE(us.total_appointments, 0),
    'total_documents_uploaded', COALESCE(us.total_documents_uploaded, 0),
    'last_login_at', us.last_login_at,
    'last_activity_at', us.last_activity_at,
    'experience_points', COALESCE(us.experience_points, 0),
    'level', COALESCE(us.level, 1),
    'streak_days', COALESCE(us.streak_days, 0),
    'recent_activities', (
      SELECT jsonb_agg(jsonb_build_object(
        'type', activity_type,
        'data', activity_data,
        'created_at', created_at
      ))
      FROM (
        SELECT activity_type, activity_data, created_at
        FROM user_activity_logs
        WHERE user_id = p_user_id
        ORDER BY created_at DESC
        LIMIT 10
      ) recent_activities
    )
  ) INTO stats
  FROM user_statistics us
  WHERE us.user_id = p_user_id;
  
  RETURN COALESCE(stats, '{}'::jsonb);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para obter estatísticas da plataforma (admin)
CREATE OR REPLACE FUNCTION get_platform_statistics()
RETURNS JSONB AS $$
DECLARE
  stats JSONB;
BEGIN
  SELECT jsonb_build_object(
    'total_users', (SELECT COUNT(*) FROM auth.users),
    'active_users_today', (
      SELECT COUNT(DISTINCT user_id)
      FROM user_activity_logs
      WHERE created_at >= CURRENT_DATE
    ),
    'total_chat_messages', (
      SELECT COUNT(*)
      FROM ai_chat_interactions
    ),
    'total_assessments', (
      SELECT COUNT(*)
      FROM imre_assessments
      WHERE completion_status = 'completed'
    ),
    'total_medical_records', (
      SELECT COUNT(*)
      FROM patient_medical_records
    ),
    'total_insights_generated', (
      SELECT COUNT(*)
      FROM patient_insights
    ),
    'platform_health', 'healthy'
  ) INTO stats;
  
  RETURN COALESCE(stats, '{}'::jsonb);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para obter histórico médico do paciente
CREATE OR REPLACE FUNCTION get_patient_medical_history(p_patient_id UUID)
RETURNS JSONB AS $$
DECLARE
  history JSONB;
BEGIN
  SELECT jsonb_build_object(
    'medical_records', (
      SELECT jsonb_agg(jsonb_build_object(
        'id', id,
        'type', record_type,
        'title', title,
        'summary', summary,
        'data', record_data,
        'created_at', created_at
      ))
      FROM (
        SELECT id, record_type, title, summary, record_data, created_at
        FROM patient_medical_records
        WHERE patient_id = p_patient_id
        ORDER BY created_at DESC
      ) medical_records
    ),
    'insights', (
      SELECT jsonb_agg(jsonb_build_object(
        'id', id,
        'type', insight_type,
        'title', title,
        'description', description,
        'priority', priority,
        'is_read', is_read,
        'generated_at', generated_at
      ))
      FROM (
        SELECT id, insight_type, title, description, priority, is_read, generated_at
        FROM patient_insights
        WHERE patient_id = p_patient_id AND is_archived = false
        ORDER BY generated_at DESC
      ) insights
    ),
    'recent_chat_interactions', (
      SELECT jsonb_agg(jsonb_build_object(
        'user_message', user_message,
        'ai_response', ai_response,
        'created_at', created_at
      ))
      FROM (
        SELECT user_message, ai_response, created_at
        FROM ai_chat_interactions
        WHERE patient_id = p_patient_id
        ORDER BY created_at DESC
        LIMIT 20
      ) recent_chat
    )
  ) INTO history;
  
  RETURN COALESCE(history, '{}'::jsonb);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 15. TRIGGERS PARA ATUALIZAR ESTATÍSTICAS AUTOMATICAMENTE
-- =====================================================

-- Trigger para atualizar estatísticas quando há nova atividade
CREATE OR REPLACE FUNCTION update_user_statistics()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO user_statistics (user_id, last_activity_at, updated_at)
  VALUES (NEW.user_id, NOW(), NOW())
  ON CONFLICT (user_id) DO UPDATE SET
    last_activity_at = NOW(),
    updated_at = NOW();
  
  -- Atualizar contadores baseado no tipo de atividade
  IF NEW.activity_type = 'login' THEN
    UPDATE user_statistics
    SET total_logins = total_logins + 1,
        last_login_at = NOW(),
        updated_at = NOW()
    WHERE user_id = NEW.user_id;
  ELSIF NEW.activity_type = 'chat_message' THEN
    UPDATE user_statistics
    SET total_chat_messages = total_chat_messages + 1,
        updated_at = NOW()
    WHERE user_id = NEW.user_id;
  ELSIF NEW.activity_type = 'assessment_completed' THEN
    UPDATE user_statistics
    SET total_assessments = total_assessments + 1,
        updated_at = NOW()
    WHERE user_id = NEW.user_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_user_statistics ON user_activity_logs;
CREATE TRIGGER trigger_update_user_statistics
  AFTER INSERT ON user_activity_logs
  FOR EACH ROW
  EXECUTE FUNCTION update_user_statistics();

-- =====================================================
-- 16. COMENTÁRIOS E DOCUMENTAÇÃO
-- =====================================================
COMMENT ON TABLE patient_medical_records IS 'Prontuário eletrônico completo do paciente - todas as interações clínicas';
COMMENT ON TABLE user_activity_logs IS 'Log de todas as atividades dos usuários na plataforma';
COMMENT ON TABLE user_statistics IS 'Estatísticas agregadas dos usuários (cache para performance)';
COMMENT ON TABLE ai_saved_documents IS 'Documentos salvos pela IA Residente';
COMMENT ON TABLE patient_insights IS 'Insights e recomendações gerados pela IA para o paciente';
COMMENT ON TABLE ai_chat_interactions IS 'Histórico completo de todas as interações de chat com a IA';

-- =====================================================
-- ✅ SCRIPT CONCLUÍDO
-- =====================================================
-- Execute este script no Supabase SQL Editor
-- Após executar, a IA Residente terá acesso completo para:
-- 1. Salvar conversas no prontuário do paciente
-- 2. Acessar dados administrativos reais
-- 3. Salvar documentos
-- 4. Gerar insights úteis para o paciente
-- 5. Registrar atividades dos usuários

