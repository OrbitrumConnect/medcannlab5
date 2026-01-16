-- UPGRADE ENGINE FOR MED-CANN LAB KPIs (TradeVision Core Integration)
-- Objetivo: Preencher as lacunas das Camadas Semântica e Clínica que hoje estão zeradas.
-- CORREÇÃO: Ajuste de nomes de colunas (sender_id) e tipos de usuário (patient).

-- 1. Tabela de Métricas Diárias (Snapshots para Histórico)
CREATE TABLE IF NOT EXISTS kpi_daily_snapshots (
    date DATE PRIMARY KEY DEFAULT CURRENT_DATE,
    
    -- Camada Administrativa
    total_active_patients INT DEFAULT 0,
    total_protocols_completed INT DEFAULT 0,
    
    -- Camada Semântica
    avg_engagement_score NUMERIC(5,2) DEFAULT 0,
    avg_sentiment_score NUMERIC(5,2) DEFAULT 0,
    treatment_adherence_rate NUMERIC(5,2) DEFAULT 0,
    
    -- Camada Clínica
    active_wearables_count INT DEFAULT 0,
    epilepsy_episodes_today INT DEFAULT 0,
    symptom_improvement_rate NUMERIC(5,2) DEFAULT 0,
    
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. View Avançada para o Dashboard
CREATE OR REPLACE VIEW v_dashboard_advanced_kpis AS
WITH appointments_stats AS (
    SELECT 
        COUNT(*) as total_appointments,
        COUNT(*) FILTER (WHERE status = 'completed') as completed_appointments
    FROM appointments
),
patients_stats AS (
    SELECT COUNT(*) as total_patients 
    FROM users 
    WHERE type = 'patient'  -- Corrigido de 'paciente' para 'patient'
),
chat_stats AS (
    -- Simulação de engajamento baseada em mensagens recentes
    SELECT 
        COUNT(DISTINCT sender_id) as active_chat_users, -- Corrigido de related_user_id para sender_id
        COUNT(*) as total_messages
    FROM chat_messages 
    WHERE created_at > NOW() - INTERVAL '7 days'
)
SELECT 
    -- ADM
    p.total_patients as total_users,
    a.completed_appointments as total_protocols_completed,
    
    -- SEMANTICA (Proxy Calculation)
    CASE WHEN p.total_patients > 0 
         THEN ROUND((c.active_chat_users::numeric / p.total_patients::numeric) * 100, 2)
         ELSE 0 
    END as engagement_rate,
    
    -- Placeholder para dados futuros
    0 as sentiment_score, 
    0 as treatment_adherence,
    0 as active_wearables,
    0 as symptom_improvement_rate,
    a.total_appointments

FROM patients_stats p, appointments_stats a, chat_stats c;

-- 3. Função para Inserir Dados Reais de IA
CREATE OR REPLACE FUNCTION update_semantic_kpi(score_sentiment numeric, score_engagement numeric)
RETURNS void AS $$
BEGIN
    INSERT INTO kpi_daily_snapshots (date, avg_sentiment_score, avg_engagement_score)
    VALUES (CURRENT_DATE, score_sentiment, score_engagement)
    ON CONFLICT (date) DO UPDATE SET 
        avg_sentiment_score = (kpi_daily_snapshots.avg_sentiment_score + EXCLUDED.avg_sentiment_score) / 2,
        updated_at = NOW();
END;
$$ LANGUAGE plpgsql;
