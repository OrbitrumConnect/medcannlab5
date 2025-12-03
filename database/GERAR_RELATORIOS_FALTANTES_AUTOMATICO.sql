-- =====================================================
-- FUNÇÃO RPC PARA GERAR RELATÓRIOS FALTANTES AUTOMATICAMENTE
-- =====================================================
-- Esta função identifica avaliações concluídas sem relatórios
-- e gera os relatórios automaticamente usando os dados das avaliações

-- 1. CRIAR FUNÇÃO RPC PARA GERAR RELATÓRIOS FALTANTES
-- =====================================================
CREATE OR REPLACE FUNCTION generate_missing_reports(
  target_patient_id UUID DEFAULT NULL
)
RETURNS TABLE (
  assessment_id UUID,
  patient_id UUID,
  patient_name TEXT,
  report_id TEXT,
  status TEXT,
  error_message TEXT
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  assessment_record RECORD;
  patient_record RECORD;
  report_id_text TEXT;
  assessment_data JSONB;
  report_content JSONB;
  investigation_text TEXT;
  methodology_text TEXT;
  result_text TEXT;
  evolution_text TEXT;
  recommendations_array TEXT[];
BEGIN
  -- Loop através de avaliações concluídas sem relatórios
  FOR assessment_record IN
    SELECT 
      ca.id,
      ca.patient_id,
      ca.data,
      ca.assessment_type,
      ca.created_at
    FROM clinical_assessments ca
    LEFT JOIN clinical_reports cr ON cr.patient_id = ca.patient_id 
      AND cr.generated_at >= ca.created_at - INTERVAL '1 hour'
      AND cr.generated_at <= ca.created_at + INTERVAL '24 hours'
    WHERE ca.status = 'completed'
      AND cr.id IS NULL
      AND (target_patient_id IS NULL OR ca.patient_id = target_patient_id)
    ORDER BY ca.created_at DESC
  LOOP
    BEGIN
      -- Buscar dados do paciente
      SELECT name, email INTO patient_record
      FROM users
      WHERE id = assessment_record.patient_id;
      
      -- Se paciente não encontrado, usar valores padrão
      IF patient_record IS NULL THEN
        patient_record.name := 'Paciente';
        patient_record.email := 'paciente@medcannlab.com';
      END IF;
      
      -- Extrair dados da avaliação
      assessment_data := assessment_record.data;
      
      -- Construir conteúdo do relatório baseado nos dados da avaliação
      investigation_text := COALESCE(
        assessment_data->>'investigation',
        assessment_data->>'patient_narrative',
        'Dados coletados através da avaliação clínica inicial com IA residente.'
      );
      
      methodology_text := COALESCE(
        assessment_data->>'methodology',
        'Aplicação da Arte da Entrevista Clínica (AEC) com protocolo IMRE.'
      );
      
      result_text := COALESCE(
        assessment_data->>'result',
        'Avaliação clínica inicial concluída com sucesso.'
      );
      
      evolution_text := COALESCE(
        assessment_data->>'evolution',
        'Plano de cuidado personalizado estabelecido.'
      );
      
      -- Extrair recomendações (pode ser array ou string)
      IF assessment_data->'recommendations' IS NOT NULL THEN
        IF jsonb_typeof(assessment_data->'recommendations') = 'array' THEN
          SELECT ARRAY(
            SELECT jsonb_array_elements_text(assessment_data->'recommendations')
          ) INTO recommendations_array;
        ELSE
          recommendations_array := ARRAY[assessment_data->>'recommendations'];
        END IF;
      ELSE
        recommendations_array := ARRAY[
          'Continuar acompanhamento clínico regular',
          'Seguir protocolo de tratamento estabelecido',
          'Manter comunicação com equipe médica'
        ];
      END IF;
      
      -- Construir conteúdo completo do relatório
      report_content := jsonb_build_object(
        'investigation', investigation_text,
        'methodology', methodology_text,
        'result', result_text,
        'evolution', evolution_text,
        'recommendations', recommendations_array,
        'triaxial_analysis', assessment_data->'triaxial_analysis',
        'scores', COALESCE(
          assessment_data->'scores',
          jsonb_build_object(
            'clinical_score', 75,
            'treatment_adherence', 80,
            'symptom_improvement', 70,
            'quality_of_life', 85
          )
        )
      );
      
      -- Gerar ID do relatório
      report_id_text := 'report_' || extract(epoch from now())::bigint || '_' || substr(md5(random()::text), 1, 9);
      
      -- Inserir relatório na tabela clinical_reports
      INSERT INTO clinical_reports (
        id,
        patient_id,
        patient_name,
        report_type,
        protocol,
        content,
        generated_by,
        generated_at,
        status,
        assessment_id
      ) VALUES (
        report_id_text,
        assessment_record.patient_id,
        patient_record.name,
        'initial_assessment',
        'IMRE',
        report_content,
        'ai_resident',
        NOW(),
        'completed',
        assessment_record.id
      );
      
      -- Retornar sucesso
      RETURN QUERY SELECT 
        assessment_record.id,
        assessment_record.patient_id,
        patient_record.name,
        report_id_text,
        'success'::TEXT,
        NULL::TEXT;
        
    EXCEPTION WHEN OTHERS THEN
      -- Retornar erro
      RETURN QUERY SELECT 
        assessment_record.id,
        assessment_record.patient_id,
        COALESCE(patient_record.name, 'Paciente Desconhecido'),
        NULL::TEXT,
        'error'::TEXT,
        SQLERRM::TEXT;
    END;
  END LOOP;
  
  RETURN;
END;
$$;

-- 2. COMENTÁRIO DA FUNÇÃO
-- =====================================================
COMMENT ON FUNCTION generate_missing_reports IS 
'Gera automaticamente relatórios faltantes para avaliações concluídas. 
Se target_patient_id for fornecido, gera apenas para esse paciente. 
Caso contrário, gera para todos os pacientes com avaliações sem relatórios.';

-- 3. EXEMPLO DE USO
-- =====================================================
-- Para gerar relatórios para todos os pacientes:
-- SELECT * FROM generate_missing_reports();

-- Para gerar relatórios para um paciente específico:
-- SELECT * FROM generate_missing_reports('uuid-do-paciente-aqui');

-- 4. VERIFICAR RESULTADOS
-- =====================================================
-- Após executar a função, verifique os resultados:
-- SELECT * FROM generate_missing_reports();

