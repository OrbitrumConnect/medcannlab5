-- Migration: Restore Legacy Video Call Quality Logs Columns
-- Description: Adiciona as colunas necessárias para o código da WiseCare funcionar na tabela original.

DO $$ 
BEGIN 
    -- Adicionar provider
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='video_call_quality_logs' AND column_name='provider') THEN
        ALTER TABLE public.video_call_quality_logs ADD COLUMN provider text;
    END IF;

    -- Adicionar room_id
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='video_call_quality_logs' AND column_name='room_id') THEN
        ALTER TABLE public.video_call_quality_logs ADD COLUMN room_id text;
    END IF;

    -- Adicionar appointment_id (Sincronia Titan)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='video_call_quality_logs' AND column_name='appointment_id') THEN
        ALTER TABLE public.video_call_quality_logs ADD COLUMN appointment_id text;
    END IF;

    -- Adicionar status
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='video_call_quality_logs' AND column_name='status') THEN
        ALTER TABLE public.video_call_quality_logs ADD COLUMN status text;
    END IF;

    -- Adicionar metadata
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='video_call_quality_logs' AND column_name='metadata') THEN
        ALTER TABLE public.video_call_quality_logs ADD COLUMN metadata jsonb;
    END IF;
END $$;

-- Garantir índices para performance
CREATE INDEX IF NOT EXISTS idx_vcql_appointment_id ON public.video_call_quality_logs(appointment_id);
CREATE INDEX IF NOT EXISTS idx_vcql_session_id ON public.video_call_quality_logs(session_id);
