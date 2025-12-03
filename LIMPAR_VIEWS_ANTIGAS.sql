-- =====================================================
-- 🧹 LIMPAR VIEWS ANTIGAS COM ERROS
-- =====================================================
-- Execute este script PRIMEIRO para remover views antigas
-- que podem ter sido criadas com erros
-- =====================================================

-- Remover view v_doctor_dashboard_kpis se existir (pode ter erro)
DROP VIEW IF EXISTS v_doctor_dashboard_kpis CASCADE;

-- Remover view v_next_appointments se existir (pode ter erro)
DROP VIEW IF EXISTS v_next_appointments CASCADE;

-- Verificar se foram removidas
SELECT 
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM pg_views 
      WHERE schemaname = 'public' 
      AND viewname = 'v_doctor_dashboard_kpis'
    ) THEN '❌ View v_doctor_dashboard_kpis ainda existe'
    ELSE '✅ View v_doctor_dashboard_kpis removida'
  END as status_v_doctor_dashboard_kpis,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM pg_views 
      WHERE schemaname = 'public' 
      AND viewname = 'v_next_appointments'
    ) THEN '❌ View v_next_appointments ainda existe'
    ELSE '✅ View v_next_appointments removida'
  END as status_v_next_appointments;

-- =====================================================
-- FIM DO SCRIPT DE LIMPEZA
-- =====================================================
-- Após executar este script, execute o CRIAR_VIEWS_E_FUNCOES_FALTANTES.sql
-- =====================================================

