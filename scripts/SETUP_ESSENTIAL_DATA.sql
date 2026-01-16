-- ARQUIVO: SETUP_ESSENTIAL_DATA.sql
-- DESCRIÇÃO: Script seguro para popular dados essenciais de funcionamento do Med-Cann Lab 3.0
-- DATA: 16/01/2026
-- FOCO: Habilitar agendamento real e métricas de IA sem expor dados sensíveis.

-- 1. GARANTIR CLÍNICAS OFICIAIS (Para permitir agendamentos reais)
-- Inserção segura: apenas se não existirem
INSERT INTO public.clinics (name, description, is_active, settings)
SELECT 'Clínica Dr. Ricardo Valença', 'Centro de Excelência em Cannabis Medicinal e Entrevista Clínica', true, '{"theme": "emerald", "allow_remote": true}'::jsonb
WHERE NOT EXISTS (SELECT 1 FROM public.clinics WHERE name = 'Clínica Dr. Ricardo Valença');

INSERT INTO public.clinics (name, description, is_active, settings)
SELECT 'Clínica Dr. Eduardo Faveret', 'Neurologia e Epilepsia Refratária - Centro de Referência', true, '{"theme": "blue", "allow_remote": true}'::jsonb
WHERE NOT EXISTS (SELECT 1 FROM public.clinics WHERE name = 'Clínica Dr. Eduardo Faveret');

-- 2. DADOS DE MÉTRICAS "SEED" (Para o Dashboard de KPIs não ficar vazio)
-- Injetando histórico de 7 dias de métricas simuladas para validação visual
INSERT INTO public.kpi_daily_snapshots (date, total_active_patients, total_protocols_completed, avg_engagement_score, avg_sentiment_score)
VALUES 
  (CURRENT_DATE - INTERVAL '6 days', 142, 12, 8.5, 0.75),
  (CURRENT_DATE - INTERVAL '5 days', 145, 15, 8.7, 0.78),
  (CURRENT_DATE - INTERVAL '4 days', 148, 18, 8.9, 0.82),
  (CURRENT_DATE - INTERVAL '3 days', 150, 22, 9.1, 0.85),
  (CURRENT_DATE - INTERVAL '2 days', 153, 25, 9.2, 0.88),
  (CURRENT_DATE - INTERVAL '1 days', 155, 30, 9.4, 0.91)
ON CONFLICT (date) DO NOTHING;

-- 3. POLÍTICAS DE SEGURANÇA (RLS) CORRETIVAS
-- Garantir que a tabela AI_CHAT_INTERACTIONS seja legível por Admin para auditoria
ALTER TABLE public.ai_chat_interactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins podem ver todos os chats" 
ON public.ai_chat_interactions
FOR SELECT 
USING (
  auth.uid() IN (SELECT id FROM auth.users WHERE email IN ('ricardo.valenca@medcann.com', 'eduardo.faveret@medcann.com', 'phpg69@gmail.com'))
);

-- 4. ÍNDICES DE PERFORMANCE (Para a Nôa responder rápido)
CREATE INDEX IF NOT EXISTS idx_ai_chat_user_date ON public.ai_chat_interactions(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_kpi_snapshots_date ON public.kpi_daily_snapshots(date DESC);

-- FIM DO SCRIPT
-- Instrução: Rode este script no Editor SQL do Supabase.
