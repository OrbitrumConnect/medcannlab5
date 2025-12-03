-- =====================================================
-- 📊 SCRIPT DE SEED - DADOS DE TESTE COMPLETOS
-- =====================================================
-- MedCannLab 3.0 - Dados para desenvolvimento e testes
-- Data: Janeiro 2025
-- 
-- IMPORTANTE: Execute apenas em ambiente de desenvolvimento/teste
-- =====================================================

-- =====================================================
-- 1. LIMPAR DADOS DE TESTE EXISTENTES (OPCIONAL)
-- =====================================================
-- Descomente as linhas abaixo se quiser limpar dados antigos
/*
DELETE FROM notifications WHERE user_id IN (SELECT id FROM auth.users WHERE email LIKE '%test%');
DELETE FROM clinical_integration;
DELETE FROM noa_interaction_logs;
DELETE FROM imre_semantic_blocks;
DELETE FROM imre_semantic_context;
DELETE FROM imre_assessments;
DELETE FROM clinical_assessments;
DELETE FROM patient_prescriptions;
DELETE FROM appointments;
*/

-- =====================================================
-- 2. VERIFICAR/CRIAR USUÁRIOS DE TESTE
-- =====================================================
-- Nota: Usuários devem ser criados via interface de autenticação
-- Este script assume que os usuários já existem

-- =====================================================
-- 3. INSERIR AGENDAMENTOS DE TESTE
-- =====================================================
-- Buscar IDs de usuários existentes
DO $$
DECLARE
    admin_user_id UUID;
    prof_user_id UUID;
    patient_user_id UUID;
BEGIN
    -- Buscar IDs (ajuste os emails conforme necessário)
    SELECT id INTO admin_user_id FROM auth.users WHERE email = 'rrvalenca@gmail.com' LIMIT 1;
    SELECT id INTO prof_user_id FROM auth.users WHERE email = 'eduardoscfaveret@gmail.com' LIMIT 1;
    SELECT id INTO patient_user_id FROM auth.users WHERE email LIKE '%patient%' OR type = 'patient' LIMIT 1;

    -- Inserir agendamentos se IDs encontrados
    IF admin_user_id IS NOT NULL AND patient_user_id IS NOT NULL THEN
        INSERT INTO appointments (
            patient_id,
            professional_id,
            title,
            description,
            appointment_date,
            duration,
            status,
            type,
            is_remote
        ) VALUES
        (
            patient_user_id,
            admin_user_id,
            'Consulta de Acompanhamento',
            'Avaliação clínica com protocolo IMRE',
            NOW() + INTERVAL '2 days',
            60,
            'scheduled',
            'consultation',
            true
        ),
        (
            patient_user_id,
            admin_user_id,
            'Consulta de Retorno',
            'Acompanhamento do tratamento',
            NOW() + INTERVAL '7 days',
            30,
            'scheduled',
            'follow_up',
            false
        )
        ON CONFLICT DO NOTHING;
    END IF;
END $$;

-- =====================================================
-- 4. INSERIR AVALIAÇÕES IMRE DE TESTE
-- =====================================================
DO $$
DECLARE
    test_user_id UUID;
    test_patient_id UUID;
    assessment_id UUID;
BEGIN
    -- Buscar usuário de teste
    SELECT id INTO test_user_id FROM auth.users WHERE email LIKE '%test%' OR type = 'patient' LIMIT 1;
    SELECT id INTO test_patient_id FROM auth.users WHERE type = 'patient' LIMIT 1;

    IF test_user_id IS NOT NULL THEN
        -- Inserir avaliação IMRE de teste
        INSERT INTO imre_assessments (
            user_id,
            patient_id,
            assessment_type,
            triaxial_data,
            semantic_context,
            emotional_indicators,
            cognitive_patterns,
            behavioral_markers,
            completion_status,
            session_duration,
            clinical_notes
        ) VALUES (
            test_user_id,
            test_patient_id,
            'triaxial',
            '{
                "emotional": {
                    "intensity": 7,
                    "valence": 6,
                    "arousal": 5,
                    "stability": 8
                },
                "cognitive": {
                    "attention": 7,
                    "memory": 6,
                    "executive": 7,
                    "processing": 6
                },
                "behavioral": {
                    "activity": 6,
                    "social": 7,
                    "adaptive": 8,
                    "regulatory": 7
                }
            }'::jsonb,
            '{
                "main_complaint": "Dor crônica e insônia",
                "symptoms": ["dor", "insônia", "ansiedade"],
                "duration": "6 meses"
            }'::jsonb,
            '{"anxiety": 7, "depression": 5, "stress": 6}'::jsonb,
            '{"attention_deficit": 3, "memory_issues": 2}'::jsonb,
            '{"social_withdrawal": 4, "activity_reduction": 5}'::jsonb,
            'completed',
            45,
            'Avaliação clínica inicial concluída. Paciente apresenta dor crônica e insônia há 6 meses. Recomenda-se protocolo de cannabis medicinal.'
        ) RETURNING id INTO assessment_id;

        -- Inserir blocos semânticos de teste
        IF assessment_id IS NOT NULL THEN
            INSERT INTO imre_semantic_blocks (
                assessment_id,
                block_number,
                block_type,
                semantic_content,
                emotional_weight,
                cognitive_complexity,
                behavioral_impact,
                confidence_score
            ) VALUES
            (
                assessment_id,
                1,
                'queixa_principal',
                '{"content": "Dor crônica no joelho direito", "intensity": 7}'::jsonb,
                0.7,
                0.5,
                0.6,
                0.85
            ),
            (
                assessment_id,
                2,
                'sintomas',
                '{"symptoms": ["dor", "insônia", "ansiedade"], "severity": "moderate"}'::jsonb,
                0.6,
                0.4,
                0.7,
                0.80
            )
            ON CONFLICT DO NOTHING;
        END IF;
    END IF;
END $$;

-- =====================================================
-- 5. INSERIR NOTIFICAÇÕES DE TESTE
-- =====================================================
DO $$
DECLARE
    test_user_id UUID;
BEGIN
    SELECT id INTO test_user_id FROM auth.users WHERE type = 'professional' OR type = 'admin' LIMIT 1;

    IF test_user_id IS NOT NULL THEN
        INSERT INTO notifications (
            user_id,
            title,
            message,
            type,
            priority,
            related_type,
            is_read
        ) VALUES
        (
            test_user_id,
            'Nova Avaliação IMRE Concluída',
            'Uma nova avaliação clínica foi concluída e está aguardando sua revisão.',
            'clinical',
            'high',
            'assessment',
            false
        ),
        (
            test_user_id,
            'Novo Relatório Disponível',
            'Relatório clínico do paciente está disponível para visualização.',
            'report',
            'normal',
            'report',
            false
        ),
        (
            test_user_id,
            'Lembrete de Agendamento',
            'Você tem uma consulta agendada para amanhã às 14:00.',
            'appointment',
            'normal',
            'appointment',
            false
        )
        ON CONFLICT DO NOTHING;
    END IF;
END $$;

-- =====================================================
-- 6. INSERIR PRESCRIÇÕES DE TESTE
-- =====================================================
DO $$
DECLARE
    test_prof_id UUID;
    test_patient_id UUID;
    template_id UUID;
BEGIN
    SELECT id INTO test_prof_id FROM auth.users WHERE type = 'professional' LIMIT 1;
    SELECT id INTO test_patient_id FROM auth.users WHERE type = 'patient' LIMIT 1;
    SELECT id INTO template_id FROM integrative_prescription_templates LIMIT 1;

    IF test_prof_id IS NOT NULL AND test_patient_id IS NOT NULL THEN
        INSERT INTO patient_prescriptions (
            patient_id,
            professional_id,
            title,
            summary,
            rationality,
            dosage,
            frequency,
            duration,
            instructions,
            status,
            template_id
        ) VALUES
        (
            test_patient_id,
            test_prof_id,
            'Prescrição de CBD para Dor Crônica',
            'Protocolo de CBD para tratamento de dor crônica e insônia',
            'biomedical',
            'CBD 20mg',
            '2x ao dia',
            '30 dias',
            'Tomar 1 cápsula pela manhã e 1 antes de dormir. Acompanhar evolução semanalmente.',
            'active',
            template_id
        )
        ON CONFLICT DO NOTHING;
    END IF;
END $$;

-- =====================================================
-- 7. INSERIR RELATÓRIOS CLÍNICOS DE TESTE
-- =====================================================
DO $$
DECLARE
    test_patient_id UUID;
    test_prof_id UUID;
BEGIN
    SELECT id INTO test_patient_id FROM auth.users WHERE type = 'patient' LIMIT 1;
    SELECT id INTO test_prof_id FROM auth.users WHERE type = 'professional' LIMIT 1;

    IF test_patient_id IS NOT NULL AND test_prof_id IS NOT NULL THEN
        INSERT INTO clinical_reports (
            patient_id,
            doctor_id,
            report_type,
            protocol,
            content,
            generated_by,
            status
        ) VALUES
        (
            test_patient_id,
            test_prof_id,
            'initial_assessment',
            'IMRE',
            '{
                "investigation": "Paciente apresenta dor crônica no joelho direito há 6 meses, associada a insônia e ansiedade.",
                "methodology": "Avaliação clínica inicial utilizando protocolo IMRE triaxial.",
                "result": "Identificados fatores emocionais, cognitivos e comportamentais relacionados à condição.",
                "evolution": "Plano terapêutico estabelecido com foco em cannabis medicinal.",
                "recommendations": [
                    "Iniciar protocolo de CBD",
                    "Acompanhamento semanal",
                    "Monitoramento de efeitos colaterais"
                ]
            }'::jsonb,
            'ai_resident',
            'completed'
        )
        ON CONFLICT DO NOTHING;
    END IF;
END $$;

-- =====================================================
-- 8. VERIFICAÇÃO FINAL
-- =====================================================
DO $$
DECLARE
    appointments_count INTEGER;
    assessments_count INTEGER;
    notifications_count INTEGER;
    prescriptions_count INTEGER;
    reports_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO appointments_count FROM appointments;
    SELECT COUNT(*) INTO assessments_count FROM imre_assessments;
    SELECT COUNT(*) INTO notifications_count FROM notifications;
    SELECT COUNT(*) INTO prescriptions_count FROM patient_prescriptions;
    SELECT COUNT(*) INTO reports_count FROM clinical_reports;

    RAISE NOTICE '✅ Dados de teste inseridos:';
    RAISE NOTICE '   - Agendamentos: %', appointments_count;
    RAISE NOTICE '   - Avaliações IMRE: %', assessments_count;
    RAISE NOTICE '   - Notificações: %', notifications_count;
    RAISE NOTICE '   - Prescrições: %', prescriptions_count;
    RAISE NOTICE '   - Relatórios: %', reports_count;
END $$;

-- =====================================================
-- STATUS FINAL
-- =====================================================
-- ✅ Script de seed completo
-- - Agendamentos de teste
-- - Avaliações IMRE de exemplo
-- - Notificações de teste
-- - Prescrições de exemplo
-- - Relatórios clínicos de teste
-- =====================================================

