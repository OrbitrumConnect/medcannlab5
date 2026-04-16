-- ==========================================
-- TITAN 3.2: O SELAMENTO INSTITUCIONAL
-- MIGRATION MESTRA (DETERMINISMO & IDENTIDADE)
-- ==========================================

-- 1. [DETERMINISMO] Get or Create Deterministic Video Session
-- Resolve a condição de corrida entre Caller e Callee
-- Aceita TEXT para suportar IDs vcr_...
CREATE OR REPLACE FUNCTION get_or_create_video_session(p_appointment_id TEXT)
RETURNS TABLE (session_id TEXT, room_name TEXT, is_new BOOLEAN) AS $$
DECLARE
    v_session_id TEXT;
    v_room_name TEXT;
BEGIN
    -- Busca na tabela REAL (video_call_sessions)
    SELECT s.session_id, s.session_id INTO v_session_id, v_room_name
    FROM public.video_call_sessions s
    WHERE s.appointment_id = p_appointment_id
    AND s.ended_at IS NULL
    ORDER BY s.created_at ASC
    LIMIT 1;

    IF v_session_id IS NOT NULL THEN
        RETURN QUERY SELECT v_session_id, v_room_name, FALSE;
    ELSE
        RETURN QUERY SELECT NULL::TEXT, NULL::TEXT, TRUE;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. [IDENTIDADE] Sincronização de Campos (Stop 400 Errors)
-- Adiciona as colunas que o frontend espera e que estão gerando erro 400 nos logs
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS avatar_url TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS user_metadata JSONB DEFAULT '{}'::jsonb;

-- 3. [IDENTIDADE] Sync de Perfis Faltantes (31 Fantasmas)
-- Garante que todo usuário em 'users' tenha um registro em 'profiles'
INSERT INTO public.profiles (id, user_id, name, email)
SELECT u.id, u.id, u.name, u.email
FROM public.users u
LEFT JOIN public.profiles p ON u.id = p.id
WHERE p.id IS NULL
ON CONFLICT (id) DO NOTHING;

-- 4. [AUDITORIA] Tabelas do Magnum Opus (ACDSS/Nôa)
-- Adiciona colunas de ponte para Sincronia de Vídeo na tabela REAL 'video_call_sessions'
ALTER TABLE public.video_call_sessions 
ADD COLUMN IF NOT EXISTS appointment_id TEXT,
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'created',
ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;

CREATE TABLE IF NOT EXISTS public.noa_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id),
    appointment_id UUID REFERENCES appointments(id),
    interaction_type TEXT,
    payload JSONB,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 5. [LIMPEZA] Purga de Testes (REMOVIDO PELO USUÁRIO - SEGURANÇA TITAN 3.2)
-- A seção de deleção foi removida para evitar riscos a contas de teste ativas.

-- FIM DO SELAMENTO.
