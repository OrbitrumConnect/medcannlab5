-- SEED DATA FOR MED-CANN LAB (TRADEVISION DEMO)
-- Objetivo: Popular o sistema com dados iniciais para validar o Dashboard de KPIs.
-- Execute este script APÓS o UPGRADE_KPI_ENGINE.sql

-- 1. Inserir um Snapshot Histórico (Ontem)
INSERT INTO kpi_daily_snapshots (date, total_active_patients, total_protocols_completed, avg_engagement_score, avg_sentiment_score, treatment_adherence_rate, active_wearables_count, symptom_improvement_rate)
VALUES 
(CURRENT_DATE - INTERVAL '1 day', 120, 45, 78.5, 8.2, 85.0, 12, 15.4)
ON CONFLICT (date) DO NOTHING;

-- 2. Inserir um Snapshot Histórico (Hoje - Parcial)
INSERT INTO kpi_daily_snapshots (date, total_active_patients, total_protocols_completed, avg_engagement_score, avg_sentiment_score, treatment_adherence_rate, active_wearables_count, symptom_improvement_rate)
VALUES 
(CURRENT_DATE, 122, 47, 82.1, 9.0, 92.5, 15, 22.1)
ON CONFLICT (date) DO NOTHING;

-- 3. Garantir que existam inputs para a View Realtime (Simulação)
-- Se não houver chats recentes, a view vai retornar 0 para engajamento.

-- (Opcional) Simular chats recentes se a tabela permitir e não violar FKs
-- INSERT INTO chat_messages ... (Comentado para segurança, pois depende de IDs reais de usuários)

-- NOTA: Como a view 'v_dashboard_advanced_kpis' lê de tabelas reais (appointments, users), 
-- se o seu banco estiver vazio, o dashboard mostrará zeros no 'Realtime'.
-- Mas os gráficos históricos (que leem de kpi_daily_snapshots) mostrarão os dados acima.
