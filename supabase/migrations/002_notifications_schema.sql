-- =====================================================
-- 🔔 SISTEMA DE NOTIFICAÇÕES - MEDCANLAB 3.0
-- =====================================================
-- Sistema completo de notificações em tempo real
-- Data: Janeiro 2025

-- =====================================================
-- 1. TABELA PRINCIPAL: NOTIFICATIONS
-- =====================================================
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  
  -- Conteúdo da notificação
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  type VARCHAR(50) NOT NULL DEFAULT 'info', -- 'info', 'success', 'warning', 'error', 'clinical', 'prescription', 'report'
  
  -- Dados relacionados
  related_type VARCHAR(50), -- 'assessment', 'prescription', 'report', 'appointment', 'message'
  related_id UUID,
  action_url TEXT, -- URL para ação relacionada
  
  -- Status
  is_read BOOLEAN DEFAULT false,
  read_at TIMESTAMP WITH TIME ZONE,
  
  -- Prioridade
  priority VARCHAR(20) DEFAULT 'normal', -- 'low', 'normal', 'high', 'urgent'
  
  -- Metadados
  metadata JSONB,
  expires_at TIMESTAMP WITH TIME ZONE,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT valid_type CHECK (type IN ('info', 'success', 'warning', 'error', 'clinical', 'prescription', 'report', 'appointment', 'message')),
  CONSTRAINT valid_priority CHECK (priority IN ('low', 'normal', 'high', 'urgent'))
);

-- =====================================================
-- ÍNDICES PARA PERFORMANCE
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(type);
CREATE INDEX IF NOT EXISTS idx_notifications_priority ON notifications(priority);
CREATE INDEX IF NOT EXISTS idx_notifications_related ON notifications(related_type, related_id);
CREATE INDEX IF NOT EXISTS idx_notifications_unread ON notifications(user_id, is_read) WHERE is_read = false;

-- Índice composto para queries comuns
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread ON notifications(user_id, created_at DESC) WHERE is_read = false;

-- =====================================================
-- TRIGGERS
-- =====================================================

-- Função para atualizar updated_at
CREATE OR REPLACE FUNCTION update_notifications_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_notifications_updated_at ON notifications;
CREATE TRIGGER update_notifications_updated_at
    BEFORE UPDATE ON notifications
    FOR EACH ROW EXECUTE FUNCTION update_notifications_updated_at();

-- Função para marcar como lida automaticamente
CREATE OR REPLACE FUNCTION mark_notification_read()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.is_read = true AND OLD.is_read = false THEN
        NEW.read_at = NOW();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS mark_notification_read ON notifications;
CREATE TRIGGER mark_notification_read
    BEFORE UPDATE ON notifications
    FOR EACH ROW EXECUTE FUNCTION mark_notification_read();

-- =====================================================
-- RLS (ROW LEVEL SECURITY)
-- =====================================================

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Políticas RLS
DROP POLICY IF EXISTS "Users can view their own notifications" ON notifications;
CREATE POLICY "Users can view their own notifications" ON notifications
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own notifications" ON notifications;
CREATE POLICY "Users can insert their own notifications" ON notifications
    FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own notifications" ON notifications;
CREATE POLICY "Users can update their own notifications" ON notifications
    FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "System can insert notifications for any user" ON notifications;
-- Política especial para o sistema inserir notificações (usando service role)
-- Esta política permite inserção via service role key
CREATE POLICY "System can insert notifications for any user" ON notifications
    FOR INSERT WITH CHECK (true); -- Service role bypassa RLS

-- =====================================================
-- FUNÇÕES AUXILIARES
-- =====================================================

-- Função para contar notificações não lidas
CREATE OR REPLACE FUNCTION get_unread_notifications_count(user_uuid UUID)
RETURNS INTEGER AS $$
DECLARE
    unread_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO unread_count
    FROM notifications
    WHERE user_id = user_uuid
    AND is_read = false
    AND (expires_at IS NULL OR expires_at > NOW());
    
    RETURN COALESCE(unread_count, 0);
END;
$$ LANGUAGE plpgsql;

-- Função para marcar todas como lidas
CREATE OR REPLACE FUNCTION mark_all_notifications_read(user_uuid UUID)
RETURNS INTEGER AS $$
DECLARE
    updated_count INTEGER;
BEGIN
    UPDATE notifications
    SET is_read = true,
        read_at = NOW()
    WHERE user_id = user_uuid
    AND is_read = false;
    
    GET DIAGNOSTICS updated_count = ROW_COUNT;
    RETURN updated_count;
END;
$$ LANGUAGE plpgsql;

-- Função para limpar notificações expiradas
CREATE OR REPLACE FUNCTION cleanup_expired_notifications()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM notifications
    WHERE expires_at IS NOT NULL
    AND expires_at < NOW()
    AND is_read = true;
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- VIEWS
-- =====================================================

-- View: Notificações recentes não lidas
CREATE OR REPLACE VIEW recent_unread_notifications AS
SELECT 
    id,
    user_id,
    title,
    message,
    type,
    priority,
    related_type,
    related_id,
    action_url,
    created_at
FROM notifications
WHERE is_read = false
AND (expires_at IS NULL OR expires_at > NOW())
ORDER BY 
    CASE priority
        WHEN 'urgent' THEN 1
        WHEN 'high' THEN 2
        WHEN 'normal' THEN 3
        WHEN 'low' THEN 4
    END,
    created_at DESC;

-- =====================================================
-- HABILITAR TEMPO REAL
-- =====================================================

-- Adicionar tabela ao Supabase Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;

-- =====================================================
-- COMENTÁRIOS
-- =====================================================

COMMENT ON TABLE notifications IS 'Sistema de notificações em tempo real do MedCannLab 3.0';
COMMENT ON FUNCTION get_unread_notifications_count IS 'Retorna o número de notificações não lidas para um usuário';
COMMENT ON FUNCTION mark_all_notifications_read IS 'Marca todas as notificações de um usuário como lidas';
COMMENT ON FUNCTION cleanup_expired_notifications IS 'Remove notificações expiradas e já lidas';

-- =====================================================
-- VERIFICAÇÃO FINAL
-- =====================================================

DO $$
DECLARE
    table_exists BOOLEAN;
BEGIN
    SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_schema = 'public'
        AND table_name = 'notifications'
    ) INTO table_exists;
    
    IF table_exists THEN
        RAISE NOTICE '✅ Tabela notifications criada com sucesso!';
    ELSE
        RAISE WARNING '⚠️ Tabela notifications não foi criada';
    END IF;
END $$;

-- =====================================================
-- STATUS FINAL
-- =====================================================
-- ✅ Sistema de Notificações Completo
-- - Tabela notifications criada
-- - RLS configurado
-- - Índices otimizados
-- - Triggers implementados
-- - Funções auxiliares criadas
-- - Views para consulta
-- - Tempo real habilitado
-- =====================================================

