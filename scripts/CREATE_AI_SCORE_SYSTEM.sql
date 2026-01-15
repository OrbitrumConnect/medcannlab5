-- Sistema de Score e Tracking de Qualidade da IA
-- Para monitorar performance e identificar problemas

-- Tabela para rastrear scores de avaliações
CREATE TABLE IF NOT EXISTS public.ai_assessment_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assessment_id TEXT REFERENCES public.clinical_reports(id),
  patient_id UUID REFERENCES auth.users(id), -- Renomeado de user_id para clareza semântica
  completed BOOLEAN NOT NULL DEFAULT false,
  phases_completed INTEGER NOT NULL DEFAULT 0,
  total_phases INTEGER NOT NULL DEFAULT 10,
  score NUMERIC NOT NULL DEFAULT 0, -- +1.5 se completo, -1.0 se travou
  stuck_at_phase TEXT, -- Onde travou (se travou)
  completion_time_seconds INTEGER, -- Quanto tempo levou
  error_message TEXT, -- Se houve erro
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index para queries rápidas
CREATE INDEX IF NOT EXISTS idx_ai_assessment_scores_patient_id ON public.ai_assessment_scores(patient_id);
CREATE INDEX IF NOT EXISTS idx_ai_assessment_scores_created_at ON public.ai_assessment_scores(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_assessment_scores_completed ON public.ai_assessment_scores(completed);

-- View para analytics agregados
CREATE OR REPLACE VIEW public.v_ai_quality_metrics AS
SELECT
  DATE(created_at) as date,
  COUNT(*) as total_assessments,
  SUM(CASE WHEN completed THEN 1 ELSE 0 END) as completed_assessments,
  SUM(CASE WHEN NOT completed THEN 1 ELSE 0 END) as stuck_assessments,
  ROUND(AVG(CASE WHEN completed THEN score ELSE 0 END)::numeric, 2) as avg_score,
  SUM(score) as total_score,
  ROUND((SUM(CASE WHEN completed THEN 1 ELSE 0 END)::numeric / NULLIF(COUNT(*)::numeric, 0)) * 100, 2) as completion_rate,
  ARRAY_AGG(DISTINCT stuck_at_phase) FILTER (WHERE stuck_at_phase IS NOT NULL) as common_stuck_phases
FROM public.ai_assessment_scores
GROUP BY DATE(created_at)
ORDER BY DATE(created_at) DESC;

-- Função para registrar score automaticamente
CREATE OR REPLACE FUNCTION public.register_assessment_score()
RETURNS TRIGGER AS $$
BEGIN
  -- Quando um clinical_report é criado com status completed
  IF NEW.status = 'completed' THEN
    INSERT INTO public.ai_assessment_scores (
      assessment_id,
      user_id,
      completed,
      phases_completed,
      total_phases,
      score,
      completion_time_seconds,
      metadata
    ) VALUES (
      NEW.id,
      NEW.patient_id, -- usando patient_id como user_id
      true,
      10, -- protocolo AEC tem 10 fases
      10,
      1.5, -- +1.5 por completar
      EXTRACT(EPOCH FROM (NOW() - NEW.generated_at))::INTEGER,
      jsonb_build_object(
        'protocol', NEW.protocol,
        'report_type', NEW.report_type
      )
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para auto-registro de scores
DROP TRIGGER IF EXISTS trigger_assessment_score ON public.clinical_reports;
CREATE TRIGGER trigger_assessment_score
  AFTER INSERT OR UPDATE ON public.clinical_reports
  FOR EACH ROW
  EXECUTE FUNCTION public.register_assessment_score();

-- RLS Policies
ALTER TABLE public.ai_assessment_scores ENABLE ROW LEVEL SECURITY;

-- Admins podem ver tudo
CREATE POLICY "Admins can view all scores"
  ON public.ai_assessment_scores
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
      AND users.type = 'admin'
    )
  );

-- Usuários podem ver seus próprios scores
CREATE POLICY "Users can view own scores"
  ON public.ai_assessment_scores
  FOR SELECT
  USING (patient_id = auth.uid());

COMMENT ON TABLE public.ai_assessment_scores IS 'Rastreamento de qualidade e performance da IA Nôa - Score: +1.5 se completo, -1.0 se travou';
COMMENT ON VIEW public.v_ai_quality_metrics IS 'Métricas agregadas de qualidade da IA por dia';
