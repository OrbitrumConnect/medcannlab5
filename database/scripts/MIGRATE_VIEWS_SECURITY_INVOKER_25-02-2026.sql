-- =====================================================
-- 🛡️ MIGRAÇÃO: 30 Views SECURITY DEFINER → SECURITY INVOKER
-- =====================================================
-- Data: 25/02/2026
-- Motivo: Views com SECURITY DEFINER executam com permissões do CRIADOR,
--         bypassando completamente as políticas de RLS.
--         Com SECURITY INVOKER, as views respeitam as permissões do usuário logado.
--
-- IMPORTANTE: Após esta migração, as views vão respeitar RLS.
--             Se alguma view parar de retornar dados, é porque o RLS está
--             corretamente bloqueando acesso não autorizado.
--
-- Seguro para reexecução.
-- =====================================================

-- =====================================================
-- 1) VIEWS DE DASHBOARD/KPI (seguras para INVOKER)
-- =====================================================
ALTER VIEW public.v_kpi_basic SET (security_invoker = on);
ALTER VIEW public.v_dashboard_advanced_kpis SET (security_invoker = on);
ALTER VIEW public.v_doctor_dashboard_kpis SET (security_invoker = on);
ALTER VIEW public.v_attendance_kpis_today SET (security_invoker = on);
ALTER VIEW public.v_ai_quality_metrics SET (security_invoker = on);

-- =====================================================
-- 2) VIEWS DE AGENDAMENTO (seguras para INVOKER)
-- =====================================================
ALTER VIEW public.v_appointments_json SET (security_invoker = on);
ALTER VIEW public.v_appointments_unified SET (security_invoker = on);
ALTER VIEW public.v_next_appointments SET (security_invoker = on);

-- =====================================================
-- 3) VIEWS DE CHAT (seguras — já usam is_chat_room_member)
-- =====================================================
ALTER VIEW public.v_chat_inbox SET (security_invoker = on);
ALTER VIEW public.v_chat_user_profiles SET (security_invoker = on);
ALTER VIEW public.v_unread_messages_kpi SET (security_invoker = on);

-- =====================================================
-- 4) VIEWS DE PACIENTE/CLÍNICO
-- =====================================================
ALTER VIEW public.v_clinical_reports SET (security_invoker = on);
ALTER VIEW public.v_paciente_completo SET (security_invoker = on);
ALTER VIEW public.v_contexto_longitudinal SET (security_invoker = on);
ALTER VIEW public.v_interacoes_recentes SET (security_invoker = on);
ALTER VIEW public.v_patient_prescriptions SET (security_invoker = on);
ALTER VIEW public.v_patient_renal_profile SET (security_invoker = on);
ALTER VIEW public.v_renal_monitoring_kpis SET (security_invoker = on);
ALTER VIEW public.v_renal_trend SET (security_invoker = on);
ALTER VIEW public.v_scope_patients SET (security_invoker = on);

-- =====================================================
-- 5) VIEWS DE ASSESSMENTS (compartilhamento)
-- =====================================================
ALTER VIEW public.patient_assessments SET (security_invoker = on);
ALTER VIEW public.eduardo_shared_assessments SET (security_invoker = on);
ALTER VIEW public.ricardo_shared_assessments SET (security_invoker = on);

-- =====================================================
-- 6) VIEWS DE ASSINATURA E PAGAMENTO
-- =====================================================
ALTER VIEW public.active_subscriptions SET (security_invoker = on);
ALTER VIEW public.v_checkout_with_points SET (security_invoker = on);

-- =====================================================
-- 7) VIEWS DE USUÁRIO
-- =====================================================
ALTER VIEW public.users_compatible SET (security_invoker = on);
ALTER VIEW public.v_user_points_balance SET (security_invoker = on);
ALTER VIEW public.view_current_ranking_live SET (security_invoker = on);
ALTER VIEW public.v_prescriptions_queue SET (security_invoker = on);

-- =====================================================
-- 8) VIEW CRÍTICA: v_auth_activity (EXPÕE auth.users!)
-- =====================================================
-- Esta view SELECT direto de auth.users — RISCO DE SEGURANÇA
-- Opção 1: Converter para SECURITY INVOKER (vai bloquear acesso via RLS)
-- Opção 2: Recriar sem auth.users (usando public.users apenas)
-- Aplicando Opção 1 por segurança:
ALTER VIEW public.v_auth_activity SET (security_invoker = on);

-- =====================================================
-- VERIFICAÇÃO
-- =====================================================
-- Após executar, verificar com:
-- SELECT schemaname, viewname, definition 
-- FROM pg_views 
-- WHERE schemaname = 'public' 
-- AND viewname LIKE 'v_%'
-- ORDER BY viewname;

-- Verificar que SECURITY INVOKER está ativo:
-- SELECT c.relname, c.relkind, 
--        CASE WHEN c.reloptions @> ARRAY['security_invoker=on'] THEN 'INVOKER' ELSE 'DEFINER' END as security
-- FROM pg_class c
-- JOIN pg_namespace n ON n.oid = c.relnamespace
-- WHERE n.nspname = 'public' AND c.relkind = 'v'
-- ORDER BY c.relname;
