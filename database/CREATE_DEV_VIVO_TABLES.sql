-- =====================================================
-- TABELAS PARA MODO DEV VIVO
-- MedCannLab 3.0 - Desenvolvimento em Tempo Real
-- =====================================================
-- ⚠️ IMPORTANTE: Execute PRE_REQUISITOS_DEV_VIVO.sql ANTES deste script!
-- =====================================================

-- 0. VERIFICAR PRÉ-REQUISITOS
-- =====================================================
DO $$
BEGIN
  -- Verificar se flag_admin existe
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'users' 
      AND column_name = 'flag_admin'
      AND table_schema = 'public'
  ) THEN
    RAISE EXCEPTION 'ERRO: Coluna flag_admin não existe na tabela users. Execute PRE_REQUISITOS_DEV_VIVO.sql primeiro!';
  END IF;
END $$;

-- 1. TABELA DE MUDANÇAS
-- =====================================================
CREATE TABLE IF NOT EXISTS dev_vivo_changes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  session_id TEXT NOT NULL,
  change_type TEXT NOT NULL CHECK (change_type IN ('create', 'update', 'delete', 'patch')),
  file_path TEXT NOT NULL,
  old_content TEXT,
  new_content TEXT,
  reason TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'applied', 'rolled_back', 'failed')),
  applied_at TIMESTAMP WITH TIME ZONE,
  rolled_back_at TIMESTAMP WITH TIME ZONE,
  rollback_reason TEXT,
  signature TEXT, -- Assinatura digital SHA-256
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_dev_vivo_changes_user_id ON dev_vivo_changes(user_id);
CREATE INDEX IF NOT EXISTS idx_dev_vivo_changes_session_id ON dev_vivo_changes(session_id);
CREATE INDEX IF NOT EXISTS idx_dev_vivo_changes_status ON dev_vivo_changes(status);
CREATE INDEX IF NOT EXISTS idx_dev_vivo_changes_file_path ON dev_vivo_changes(file_path);
CREATE INDEX IF NOT EXISTS idx_dev_vivo_changes_created_at ON dev_vivo_changes(created_at DESC);

-- 2. TABELA DE SESSÕES DEV VIVO
-- =====================================================
CREATE TABLE IF NOT EXISTS dev_vivo_sessions (
  id TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  supabase_token TEXT NOT NULL,
  flag_admin BOOLEAN DEFAULT false,
  can_modify_code BOOLEAN DEFAULT false,
  can_modify_database BOOLEAN DEFAULT false,
  can_access_real_data BOOLEAN DEFAULT false,
  current_route TEXT,
  current_component TEXT,
  is_active BOOLEAN DEFAULT true,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_dev_vivo_sessions_user_id ON dev_vivo_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_dev_vivo_sessions_is_active ON dev_vivo_sessions(is_active);
CREATE INDEX IF NOT EXISTS idx_dev_vivo_sessions_expires_at ON dev_vivo_sessions(expires_at);

-- 3. TABELA DE AUDITORIA LGPD
-- =====================================================
CREATE TABLE IF NOT EXISTS dev_vivo_audit (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  change_id UUID REFERENCES dev_vivo_changes(id),
  action TEXT NOT NULL CHECK (action IN ('create', 'read', 'update', 'delete')),
  data_type TEXT CHECK (data_type IN ('user_data', 'code', 'config', 'database')),
  user_id UUID REFERENCES auth.users(id),
  ip_address INET,
  user_agent TEXT,
  request_body JSONB,
  response_status INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_dev_vivo_audit_change_id ON dev_vivo_audit(change_id);
CREATE INDEX IF NOT EXISTS idx_dev_vivo_audit_user_id ON dev_vivo_audit(user_id);
CREATE INDEX IF NOT EXISTS idx_dev_vivo_audit_created_at ON dev_vivo_audit(created_at DESC);

-- 4. TABELA DE DIAGNÓSTICOS
-- =====================================================
CREATE TABLE IF NOT EXISTS dev_vivo_diagnostics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id TEXT NOT NULL,
  current_route TEXT,
  route_params JSONB,
  query_params JSONB,
  current_component TEXT,
  component_props JSONB,
  component_state JSONB,
  recent_errors JSONB,
  recent_warnings JSONB,
  supabase_connections JSONB,
  api_calls JSONB,
  realtime_subscriptions JSONB,
  render_time NUMERIC,
  memory_usage NUMERIC,
  network_latency NUMERIC,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_dev_vivo_diagnostics_session_id ON dev_vivo_diagnostics(session_id);
CREATE INDEX IF NOT EXISTS idx_dev_vivo_diagnostics_created_at ON dev_vivo_diagnostics(created_at DESC);

-- 5. RLS (Row Level Security)
-- =====================================================
ALTER TABLE dev_vivo_changes ENABLE ROW LEVEL SECURITY;
ALTER TABLE dev_vivo_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE dev_vivo_audit ENABLE ROW LEVEL SECURITY;
ALTER TABLE dev_vivo_diagnostics ENABLE ROW LEVEL SECURITY;

-- Políticas: Apenas admins podem ver suas próprias mudanças
CREATE POLICY "Admins can view their own changes"
  ON dev_vivo_changes
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.type = 'admin'
      AND users.flag_admin = true
    )
    AND user_id = auth.uid()
  );

-- Políticas: Apenas admins podem criar mudanças
CREATE POLICY "Admins can create changes"
  ON dev_vivo_changes
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.type = 'admin'
      AND users.flag_admin = true
    )
    AND user_id = auth.uid()
  );

-- Políticas: Apenas admins podem ver suas próprias sessões
CREATE POLICY "Admins can view their own sessions"
  ON dev_vivo_sessions
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.type = 'admin'
      AND users.flag_admin = true
    )
    AND user_id = auth.uid()
  );

-- Políticas: Apenas admins podem criar sessões
CREATE POLICY "Admins can create sessions"
  ON dev_vivo_sessions
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.type = 'admin'
      AND users.flag_admin = true
    )
    AND user_id = auth.uid()
  );

-- Políticas: Apenas admins podem ver auditoria
CREATE POLICY "Admins can view audit logs"
  ON dev_vivo_audit
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.type = 'admin'
      AND users.flag_admin = true
    )
  );

-- Políticas: Apenas admins podem ver diagnósticos
CREATE POLICY "Admins can view diagnostics"
  ON dev_vivo_diagnostics
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.type = 'admin'
      AND users.flag_admin = true
    )
  );

-- 6. FUNÇÕES ÚTEIS
-- =====================================================

-- Função para gerar assinatura digital
CREATE OR REPLACE FUNCTION generate_change_signature(
  p_user_id UUID,
  p_content TEXT,
  p_timestamp TIMESTAMP WITH TIME ZONE
)
RETURNS TEXT AS $$
BEGIN
  RETURN encode(
    digest(
      p_user_id::TEXT || p_content || p_timestamp::TEXT,
      'sha256'
    ),
    'hex'
  );
END;
$$ LANGUAGE plpgsql;

-- Função para criar sessão dev vivo
CREATE OR REPLACE FUNCTION create_dev_vivo_session(
  p_user_id UUID,
  p_supabase_token TEXT,
  p_expires_in_minutes INTEGER DEFAULT 60
)
RETURNS TEXT AS $$
DECLARE
  v_session_id TEXT;
  v_flag_admin BOOLEAN;
BEGIN
  -- Verificar se usuário é admin
  SELECT flag_admin INTO v_flag_admin
  FROM users
  WHERE id = p_user_id
    AND type = 'admin';
  
  IF NOT v_flag_admin THEN
    RAISE EXCEPTION 'Apenas administradores podem usar Modo Dev Vivo';
  END IF;
  
  -- Gerar ID de sessão
  v_session_id := gen_random_uuid()::TEXT;
  
  -- Criar sessão
  INSERT INTO dev_vivo_sessions (
    id,
    user_id,
    supabase_token,
    flag_admin,
    can_modify_code,
    can_modify_database,
    can_access_real_data,
    expires_at
  ) VALUES (
    v_session_id,
    p_user_id,
    p_supabase_token,
    v_flag_admin,
    true,
    true,
    false, -- Por padrão, não acessa dados reais
    NOW() + (p_expires_in_minutes || ' minutes')::INTERVAL
  );
  
  RETURN v_session_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para registrar mudança
CREATE OR REPLACE FUNCTION register_dev_vivo_change(
  p_session_id TEXT,
  p_change_type TEXT,
  p_file_path TEXT,
  p_old_content TEXT,
  p_new_content TEXT,
  p_reason TEXT
)
RETURNS UUID AS $$
DECLARE
  v_user_id UUID;
  v_change_id UUID;
  v_signature TEXT;
BEGIN
  -- Obter user_id da sessão
  SELECT user_id INTO v_user_id
  FROM dev_vivo_sessions
  WHERE id = p_session_id
    AND is_active = true
    AND expires_at > NOW();
  
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Sessão inválida ou expirada';
  END IF;
  
  -- Gerar ID da mudança
  v_change_id := gen_random_uuid();
  
  -- Gerar assinatura
  v_signature := generate_change_signature(
    v_user_id,
    COALESCE(p_new_content, p_old_content, ''),
    NOW()
  );
  
  -- Registrar mudança
  INSERT INTO dev_vivo_changes (
    id,
    user_id,
    session_id,
    change_type,
    file_path,
    old_content,
    new_content,
    reason,
    signature
  ) VALUES (
    v_change_id,
    v_user_id,
    p_session_id,
    p_change_type,
    p_file_path,
    p_old_content,
    p_new_content,
    p_reason,
    v_signature
  );
  
  RETURN v_change_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para reverter mudança
CREATE OR REPLACE FUNCTION rollback_dev_vivo_change(
  p_change_id UUID,
  p_rollback_reason TEXT
)
RETURNS BOOLEAN AS $$
DECLARE
  v_change RECORD;
BEGIN
  -- Buscar mudança
  SELECT * INTO v_change
  FROM dev_vivo_changes
  WHERE id = p_change_id;
  
  IF v_change IS NULL THEN
    RAISE EXCEPTION 'Mudança não encontrada';
  END IF;
  
  IF v_change.status = 'rolled_back' THEN
    RAISE EXCEPTION 'Mudança já foi revertida';
  END IF;
  
  -- Marcar como revertida
  UPDATE dev_vivo_changes
  SET 
    status = 'rolled_back',
    rolled_back_at = NOW(),
    rollback_reason = p_rollback_reason,
    updated_at = NOW()
  WHERE id = p_change_id;
  
  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. TRIGGERS
-- =====================================================

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_dev_vivo_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_dev_vivo_changes_updated_at
  BEFORE UPDATE ON dev_vivo_changes
  FOR EACH ROW
  EXECUTE FUNCTION update_dev_vivo_updated_at();

CREATE TRIGGER update_dev_vivo_sessions_updated_at
  BEFORE UPDATE ON dev_vivo_sessions
  FOR EACH ROW
  EXECUTE FUNCTION update_dev_vivo_updated_at();

-- 8. COMENTÁRIOS
-- =====================================================
COMMENT ON TABLE dev_vivo_changes IS 'Registro de todas as mudanças feitas via Modo Dev Vivo';
COMMENT ON TABLE dev_vivo_sessions IS 'Sessões ativas do Modo Dev Vivo';
COMMENT ON TABLE dev_vivo_audit IS 'Auditoria LGPD de todas as ações do Modo Dev Vivo';
COMMENT ON TABLE dev_vivo_diagnostics IS 'Diagnósticos em tempo real do sistema';

-- =====================================================
-- SCRIPT CONCLUÍDO!
-- =====================================================

