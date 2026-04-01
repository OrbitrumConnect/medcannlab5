-- =====================================================
-- S3/C1: Estado AEC no Supabase (sai do localStorage)
-- =====================================================

CREATE TABLE IF NOT EXISTS public.aec_assessment_state (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    phase text NOT NULL DEFAULT 'INITIAL_GREETING',
    data jsonb NOT NULL DEFAULT '{}',
    current_question_index int NOT NULL DEFAULT 0,
    waiting_for_more boolean NOT NULL DEFAULT false,
    interrupted_from_phase text,
    started_at timestamptz NOT NULL DEFAULT now(),
    last_update timestamptz NOT NULL DEFAULT now(),
    created_at timestamptz NOT NULL DEFAULT now(),
    UNIQUE(user_id) -- apenas 1 estado ativo por paciente
);

-- RLS: paciente acessa apenas seu próprio estado
ALTER TABLE public.aec_assessment_state ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Paciente vê próprio estado AEC"
ON public.aec_assessment_state FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Paciente cria próprio estado AEC"
ON public.aec_assessment_state FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Paciente atualiza próprio estado AEC"
ON public.aec_assessment_state FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Paciente deleta próprio estado AEC"
ON public.aec_assessment_state FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- Trigger para atualizar last_update automaticamente
CREATE OR REPLACE FUNCTION public.update_aec_last_update()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    NEW.last_update = now();
    RETURN NEW;
END;
$$;

CREATE TRIGGER trg_aec_state_last_update
BEFORE UPDATE ON public.aec_assessment_state
FOR EACH ROW
EXECUTE FUNCTION public.update_aec_last_update();