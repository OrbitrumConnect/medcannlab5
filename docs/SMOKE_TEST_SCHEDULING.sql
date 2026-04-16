-- ==============================================================================
-- 🧪 MEDCANNLAB 5.0 - SMOKE TEST: AEC + SCHEDULING FLOW
-- Objetivo: Validar o pulso vital do sistema (Integridade de Agendamento)
-- Instruções: Execute no SQL Editor do Supabase. Este script cria um cenário de teste
-- e o limpa ao final, reportando sucessos ou falhas.
-- ==============================================================================

DO $$
DECLARE
    v_patient_id uuid;
    v_doctor_id  uuid;
    v_test_date  date := CURRENT_DATE + interval '1 day';
    v_appt_id    uuid;
    v_slots_count integer;
BEGIN
    RAISE NOTICE '🚀 INICIANDO TESTE DE FUMAÇA (SMOKE TEST)...';

    -- 0. BUSCA DINÂMICA DE USUÁRIOS REAIS (Garante que FK não quebre)
    SELECT id INTO v_doctor_id FROM public.users WHERE type IN ('profissional', 'professional', 'admin', 'master') LIMIT 1;
    SELECT id INTO v_patient_id FROM public.users WHERE type IN ('paciente', 'patient') LIMIT 1;

    IF v_doctor_id IS NULL OR v_patient_id IS NULL THEN
        RAISE EXCEPTION '❌ FALHA: Não foi possível encontrar um médico e um paciente na tabela users para realizar o teste.';
    END IF;

    RAISE NOTICE '🔍 Usando Médico ID: % e Paciente ID: % para o teste.', v_doctor_id, v_patient_id;

    -- 1. SETUP DE CENÁRIO (Disponibilidade Mock para Amanhã às 10:00)
    -- Limpa resíduos de testes anteriores
    DELETE FROM public.appointments WHERE patient_id = v_patient_id OR professional_id = v_doctor_id;
    DELETE FROM public.professional_availability WHERE professional_id = v_doctor_id;

    INSERT INTO public.professional_availability (professional_id, day_of_week, start_time, end_time, slot_duration)
    VALUES (v_doctor_id, EXTRACT(DOW FROM v_test_date)::integer, '09:00', '12:00', 30);
    
    RAISE NOTICE '✅ CENÁRIO 1: Disponibilidade de 30 min criada para Dr. Mock.';

    -- 2. TESTE DE BUSCA DE SLOTS (get_available_slots_v3)
    SELECT COUNT(*) INTO v_slots_count 
    FROM public.get_available_slots_v3(v_doctor_id, v_test_date, v_test_date);

    IF v_slots_count = 0 THEN
        RAISE EXCEPTION '❌ FALHA: A função get_available_slots_v3 não retornou horários disponíveis.';
    ELSE
        RAISE NOTICE '✅ CENÁRIO 2: get_available_slots_v3 retornou % slots disponíveis.', v_slots_count;
    END IF;

    -- 3. TESTE DE AGENDAMENTO ATÔMICO (book_appointment_atomic)
    -- Tenta agendar para às 10:00 de amanhã
    BEGIN
        v_appt_id := public.book_appointment_atomic(
            v_patient_id, 
            v_doctor_id, 
            (v_test_date + time '10:00')::timestamptz, 
            'SMOKE_TEST', 
            'Notas de teste de fumaça'
        );
        RAISE NOTICE '✅ CENÁRIO 3: Agendamento realizado com sucesso! ID: %', v_appt_id;
    EXCEPTION WHEN OTHERS THEN
        RAISE EXCEPTION '❌ FALHA: Erro ao executar book_appointment_atomic: %', SQLERRM;
    END;

    -- 4. TESTE DE CONFLITO (Double Booking Protection)
    BEGIN
        PERFORM public.book_appointment_atomic(
            v_patient_id, 
            v_doctor_id, 
            (v_test_date + time '10:00')::timestamptz, 
            'SMOKE_TEST_FAIL'
        );
        RAISE EXCEPTION '❌ FALHA: O sistema permitiu Double Booking no mesmo horário!';
    EXCEPTION WHEN OTHERS THEN
        IF SQLERRM LIKE '%Slot no longer available%' THEN
            RAISE NOTICE '✅ CENÁRIO 4: Bloqueio de Double Booking funcionando perfeitamente.';
        ELSE
            RAISE EXCEPTION '❌ FALHA: Erro inesperado no teste de conflito: %', SQLERRM;
        END IF;
    END;

    -- 5. CLEANUP
    DELETE FROM public.appointments WHERE id = v_appt_id;
    DELETE FROM public.professional_availability WHERE professional_id = v_doctor_id;
    
    RAISE NOTICE '🏁 SMOKE TEST CONCLUÍDO COM SUCESSO! O motor de agendamento está em paridade com a produção.';
END $$;
