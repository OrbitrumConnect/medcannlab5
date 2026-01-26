-- =====================================================
-- AUTOMAÇÃO DE TRIAGEM DE PACIENTES (ONBOARDING)
-- Objetivo: Garantir que novos pacientes sejam vinculados automaticamente
-- Data: 28/01/2026
-- =====================================================

-- 1. Função para Vincular Paciente na Criação
CREATE OR REPLACE FUNCTION public.handle_new_patient_triage()
RETURNS TRIGGER AS $$
DECLARE
    v_admin_doctor_id UUID;
BEGIN
    -- Verificar se é um paciente
    IF NEW.type <> 'patient' THEN
        RETURN NEW;
    END IF;

    -- Buscar o ID do Dr. Ricardo (Admin) ou Eduardo para ser o "Triador"
    -- Tenta encontrar pelo email, senão pega qualquer admin/profissional
    SELECT id INTO v_admin_doctor_id
    FROM auth.users
    WHERE email IN ('rrvalenca@gmail.com', 'eduardoscfaveret@gmail.com')
    LIMIT 1;

    -- Se não encontrar específico, pega o primeiro profissional disponível
    IF v_admin_doctor_id IS NULL THEN
        SELECT id INTO v_admin_doctor_id
        FROM public.users
        WHERE type IN ('professional', 'admin')
        LIMIT 1;
    END IF;

    -- Se ainda assim não tiver (banco vazio), não faz nada
    IF v_admin_doctor_id IS NULL THEN
        RETURN NEW;
    END IF;

    -- 1. Criar um registro inicial na tabela de avaliações (para aparecer na lista de pacientes)
    -- Isso garante que o paciente apareça no dashboard do médico como "Novo / A Classificar"
    INSERT INTO public.clinical_assessments (
        patient_id,
        doctor_id,
        assessment_type,
        status,
        data
    ) VALUES (
        NEW.id,
        v_admin_doctor_id,
        'TRIAGE', -- Tipo especial de triagem
        'in_progress',
        jsonb_build_object(
            'name', NEW.name,
            'email', NEW.email,
            'status', 'Aguardando Triagem',
            'triage_date', NOW()
        )
    );

    -- 2. Criar notificação para o médico triador
    INSERT INTO public.notifications (
        user_id,
        title,
        message,
        type,
        action_url
    ) VALUES (
        v_admin_doctor_id,
        'Novo Paciente Cadastrado',
        'O paciente ' || NEW.name || ' acabou de se cadastrar e aguarda triagem.',
        'system',
        '/app/clinica/profissional/pacientes?status=triage'
    );

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Criar Trigger na tabela public.users
-- (Assumindo que public.users é a tabela espelho de auth.users usada pelo app)
DROP TRIGGER IF EXISTS on_patient_created_triage ON public.users;
CREATE TRIGGER on_patient_created_triage
    AFTER INSERT ON public.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_patient_triage();

-- 3. Mensagem de Sucesso
DO $$
BEGIN
    RAISE NOTICE '✅ Automação de Triagem instalada com sucesso.';
END $$;
