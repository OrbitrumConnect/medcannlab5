-- =====================================================
-- 🔧 CRIAÇÃO DE VIEWS E FUNÇÕES FALTANTES (VERSÃO CORRIGIDA)
-- =====================================================
-- Execute este script para criar as views e funções
-- que estão sendo usadas pelo código mas não existem no Supabase
--
-- ⚠️ Este script força a remoção de views antigas antes de criar novas
-- =====================================================

-- =====================================================
-- LIMPEZA INICIAL: Remover views antigas que podem ter erro
-- =====================================================

-- Forçar remoção de views antigas
DO $$
BEGIN
  -- Remover v_doctor_dashboard_kpis se existir
  IF EXISTS (
    SELECT 1 FROM pg_views 
    WHERE schemaname = 'public' 
    AND viewname = 'v_doctor_dashboard_kpis'
  ) THEN
    DROP VIEW IF EXISTS v_doctor_dashboard_kpis CASCADE;
    RAISE NOTICE 'View v_doctor_dashboard_kpis removida';
  END IF;
  
  -- Remover v_next_appointments se existir
  IF EXISTS (
    SELECT 1 FROM pg_views 
    WHERE schemaname = 'public' 
    AND viewname = 'v_next_appointments'
  ) THEN
    DROP VIEW IF EXISTS v_next_appointments CASCADE;
    RAISE NOTICE 'View v_next_appointments removida';
  END IF;
END $$;

-- Garantir remoção com DROP adicional
DROP VIEW IF EXISTS v_doctor_dashboard_kpis CASCADE;
DROP VIEW IF EXISTS v_next_appointments CASCADE;

-- =====================================================
-- PARTE 1: FUNÇÃO RPC get_unread_notifications_count
-- =====================================================

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

-- Comentário na função
COMMENT ON FUNCTION get_unread_notifications_count(UUID) IS 
  'Retorna o número de notificações não lidas para um usuário específico';

-- =====================================================
-- PARTE 2: VIEW v_doctor_dashboard_kpis (CORRIGIDA)
-- =====================================================

-- Criar view com KPIs do dashboard do médico
-- IMPORTANTE: Não usa recipient_id nem is_read de chat_messages
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
  
  -- Mensagens não lidas: usar 0 como placeholder
  -- A tabela chat_messages não tem recipient_id nem is_read
  0::INTEGER as unread_messages;

-- Comentário na view
COMMENT ON VIEW v_doctor_dashboard_kpis IS 
  'KPIs do dashboard do médico: agendamentos de hoje, próximos 24h, mensagens não lidas, etc.';

-- =====================================================
-- PARTE 3: VIEW v_next_appointments (CORRIGIDA)
-- =====================================================

-- Criar view corrigida com colunas esperadas pelo código
CREATE VIEW v_next_appointments AS
SELECT 
  a.id,
  a.appointment_date as appt_at,  -- Nome da coluna esperada pelo código
  a.patient_id,
  a.professional_id,
  CASE 
    WHEN a.status = 'scheduled' THEN 'scheduled'
    WHEN a.status = 'confirmed' THEN 'confirmed'
    WHEN a.status = 'waiting' THEN 'waiting'
    WHEN a.status = 'completed' THEN 'completed'
    WHEN a.status = 'cancelled' THEN 'cancelled'
    ELSE COALESCE(a.status, 'scheduled')
  END as status_norm,  -- Nome da coluna esperada pelo código
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

-- Comentário na view
COMMENT ON VIEW v_next_appointments IS 
  'Próximos agendamentos com informações normalizadas para o dashboard';

-- =====================================================
-- PARTE 4: VERIFICAÇÃO
-- =====================================================

-- Verificar se a função foi criada
SELECT 
  'Função RPC criada:' as status,
  proname as function_name,
  pg_get_function_arguments(oid) as arguments
FROM pg_proc
WHERE proname = 'get_unread_notifications_count'
AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public');

-- Verificar se as views foram criadas
SELECT 
  'Views criadas:' as status,
  table_name
FROM information_schema.views
WHERE table_schema = 'public'
AND table_name IN ('v_doctor_dashboard_kpis', 'v_next_appointments')
ORDER BY table_name;

-- Testar a view v_doctor_dashboard_kpis (deve retornar sem erro)
SELECT * FROM v_doctor_dashboard_kpis LIMIT 1;

-- Testar a view v_next_appointments (deve retornar sem erro)
SELECT * FROM v_next_appointments LIMIT 5;

-- =====================================================
-- FIM DO SCRIPT
-- =====================================================
-- ✅ Função RPC get_unread_notifications_count criada
-- ✅ View v_doctor_dashboard_kpis criada (SEM recipient_id)
-- ✅ View v_next_appointments criada e corrigida
-- =====================================================

