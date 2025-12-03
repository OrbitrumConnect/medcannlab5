-- =====================================================
-- ATUALIZAÇÃO SUPABASE - KPIs CLÍNICOS E FUNCIONALIDADES
-- =====================================================
-- Execute este script no Supabase SQL Editor após as últimas modificações
-- Data: 2025-01-XX
-- 
-- Este script garante que:
-- 1. Tabelas necessárias existem e têm os campos corretos
-- 2. Índices estão criados para performance dos KPIs
-- 3. Permissões RLS estão configuradas corretamente
-- 4. Funções auxiliares estão disponíveis

-- =====================================================
-- 1. VERIFICAR E CRIAR TABELAS NECESSÁRIAS
-- =====================================================

-- Garantir que imre_assessments existe com campos necessários
DO $$
BEGIN
  -- Verificar se a tabela existe
  IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'imre_assessments') THEN
    CREATE TABLE imre_assessments (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
      patient_id UUID,
      assessment_type VARCHAR(50) NOT NULL DEFAULT 'triaxial',
      
      -- Dados do Sistema IMRE Triaxial
      triaxial_data JSONB NOT NULL DEFAULT '{}'::jsonb,
      semantic_context JSONB NOT NULL DEFAULT '{}'::jsonb,
      emotional_indicators JSONB,
      cognitive_patterns JSONB,
      behavioral_markers JSONB,
      
      -- Metadados da avaliação
      assessment_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      session_duration INTEGER,
      completion_status VARCHAR(20) DEFAULT 'in_progress',
      
      -- Contexto clínico
      clinical_notes TEXT,
      risk_factors JSONB,
      therapeutic_goals JSONB,
      
      -- Timestamps
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      
      CONSTRAINT valid_completion_status CHECK (completion_status IN ('in_progress', 'completed', 'abandoned'))
    );
  ELSE
    -- Garantir que campos JSONB existem e têm defaults
    -- Verificar e adicionar triaxial_data se não existir
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = 'public' 
                   AND table_name = 'imre_assessments' 
                   AND column_name = 'triaxial_data') THEN
      ALTER TABLE imre_assessments ADD COLUMN triaxial_data JSONB NOT NULL DEFAULT '{}'::jsonb;
    ELSE
      ALTER TABLE imre_assessments ALTER COLUMN triaxial_data SET DEFAULT '{}'::jsonb;
    END IF;
    
    -- Verificar e adicionar semantic_context se não existir
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = 'public' 
                   AND table_name = 'imre_assessments' 
                   AND column_name = 'semantic_context') THEN
      ALTER TABLE imre_assessments ADD COLUMN semantic_context JSONB NOT NULL DEFAULT '{}'::jsonb;
    ELSE
      ALTER TABLE imre_assessments ALTER COLUMN semantic_context SET DEFAULT '{}'::jsonb;
    END IF;
  END IF;
END $$;

-- Garantir que clinical_assessments existe
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'clinical_assessments') THEN
    CREATE TABLE clinical_assessments (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      patient_id UUID NOT NULL,
      doctor_id UUID,
      assessment_type TEXT NOT NULL DEFAULT 'IMRE',
      data JSONB NOT NULL DEFAULT '{}'::jsonb,
      status TEXT DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'completed', 'reviewed')),
      clinical_report TEXT,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
  ELSE
    -- Verificar e adicionar campo data se não existir
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = 'public' 
                   AND table_name = 'clinical_assessments' 
                   AND column_name = 'data') THEN
      ALTER TABLE clinical_assessments ADD COLUMN data JSONB NOT NULL DEFAULT '{}'::jsonb;
    ELSE
      -- Garantir que campo data tem default
      ALTER TABLE clinical_assessments 
        ALTER COLUMN data SET DEFAULT '{}'::jsonb;
    END IF;
    
    -- Verificar e adicionar outros campos se não existirem
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = 'public' 
                   AND table_name = 'clinical_assessments' 
                   AND column_name = 'assessment_type') THEN
      ALTER TABLE clinical_assessments ADD COLUMN assessment_type TEXT NOT NULL DEFAULT 'IMRE';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = 'public' 
                   AND table_name = 'clinical_assessments' 
                   AND column_name = 'status') THEN
      ALTER TABLE clinical_assessments ADD COLUMN status TEXT DEFAULT 'in_progress';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = 'public' 
                   AND table_name = 'clinical_assessments' 
                   AND column_name = 'updated_at') THEN
      ALTER TABLE clinical_assessments ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
    END IF;
    
    -- Verificar e adicionar patient_id se não existir
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = 'public' 
                   AND table_name = 'clinical_assessments' 
                   AND column_name = 'patient_id') THEN
      ALTER TABLE clinical_assessments ADD COLUMN patient_id UUID;
    END IF;
    
    -- Verificar e adicionar doctor_id se não existir
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = 'public' 
                   AND table_name = 'clinical_assessments' 
                   AND column_name = 'doctor_id') THEN
      ALTER TABLE clinical_assessments ADD COLUMN doctor_id UUID;
    END IF;
  END IF;
END $$;

-- =====================================================
-- 2. CRIAR ÍNDICES PARA PERFORMANCE DOS KPIs
-- =====================================================

-- Índices para imre_assessments
CREATE INDEX IF NOT EXISTS idx_imre_assessments_completion_status 
  ON imre_assessments(completion_status) 
  WHERE completion_status = 'completed';

CREATE INDEX IF NOT EXISTS idx_imre_assessments_user_id 
  ON imre_assessments(user_id);

CREATE INDEX IF NOT EXISTS idx_imre_assessments_patient_id 
  ON imre_assessments(patient_id);

CREATE INDEX IF NOT EXISTS idx_imre_assessments_created_at 
  ON imre_assessments(created_at DESC);

-- Índices GIN para busca em campos JSONB (importante para KPIs)
CREATE INDEX IF NOT EXISTS idx_imre_assessments_semantic_context_gin 
  ON imre_assessments USING GIN (semantic_context);

CREATE INDEX IF NOT EXISTS idx_imre_assessments_triaxial_data_gin 
  ON imre_assessments USING GIN (triaxial_data);

-- Índices para clinical_assessments
CREATE INDEX IF NOT EXISTS idx_clinical_assessments_status 
  ON clinical_assessments(status) 
  WHERE status = 'completed';

CREATE INDEX IF NOT EXISTS idx_clinical_assessments_assessment_type 
  ON clinical_assessments(assessment_type) 
  WHERE assessment_type = 'IMRE';

CREATE INDEX IF NOT EXISTS idx_clinical_assessments_data_gin 
  ON clinical_assessments USING GIN (data);

-- =====================================================
-- 3. CONFIGURAR ROW LEVEL SECURITY (RLS)
-- =====================================================

-- Habilitar RLS nas tabelas
ALTER TABLE imre_assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE clinical_assessments ENABLE ROW LEVEL SECURITY;

-- Políticas para imre_assessments
DO $$
BEGIN
  -- Remover políticas antigas se existirem
  DROP POLICY IF EXISTS "Users can view their own assessments" ON imre_assessments;
  DROP POLICY IF EXISTS "Users can create assessments" ON imre_assessments;
  DROP POLICY IF EXISTS "Professionals can view patient assessments" ON imre_assessments;
END $$;

-- Criar novas políticas
CREATE POLICY "Users can view their own assessments"
  ON imre_assessments
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create assessments"
  ON imre_assessments
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own assessments"
  ON imre_assessments
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Professionals can view patient assessments"
  ON imre_assessments
  FOR SELECT
  USING (
    -- Verificar metadados do auth.users (fonte mais confiável)
    -- Permite acesso se o usuário tiver tipo profissional ou admin nos metadados
    (
      SELECT COALESCE(
        raw_user_meta_data->>'type',
        raw_user_meta_data->>'user_type',
        raw_user_meta_data->>'role'
      ) IN ('professional', 'admin', 'profissional')
      FROM auth.users
      WHERE id = auth.uid()
    )
  );

-- Políticas para clinical_assessments (se não existirem)
-- Remover políticas antigas primeiro
DROP POLICY IF EXISTS "Pacientes podem ver suas próprias avaliações" ON clinical_assessments;
DROP POLICY IF EXISTS "Profissionais podem ver avaliações de seus pacientes" ON clinical_assessments;
DROP POLICY IF EXISTS "Pacientes podem criar avaliações" ON clinical_assessments;
DROP POLICY IF EXISTS "Profissionais podem atualizar avaliações" ON clinical_assessments;

-- Criar políticas apenas se as colunas existirem
DO $$
BEGIN
  -- Verificar se patient_id existe antes de criar política
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'clinical_assessments' 
    AND column_name = 'patient_id'
  ) THEN
    CREATE POLICY "Pacientes podem ver suas próprias avaliações"
      ON clinical_assessments
      FOR SELECT
      USING (auth.uid() = patient_id);

    CREATE POLICY "Pacientes podem criar avaliações"
      ON clinical_assessments
      FOR INSERT
      WITH CHECK (auth.uid() = patient_id);
  END IF;

  -- Verificar se doctor_id existe antes de criar política
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'clinical_assessments' 
    AND column_name = 'doctor_id'
  ) THEN
    CREATE POLICY "Profissionais podem ver avaliações de seus pacientes"
      ON clinical_assessments
      FOR SELECT
      USING (auth.uid() = doctor_id);

    CREATE POLICY "Profissionais podem atualizar avaliações"
      ON clinical_assessments
      FOR UPDATE
      USING (auth.uid() = doctor_id);
  END IF;
END $$;

-- =====================================================
-- 4. FUNÇÕES AUXILIARES PARA KPIs
-- =====================================================

-- Função para contar narrativas preservadas
CREATE OR REPLACE FUNCTION count_preserved_narratives()
RETURNS INTEGER AS $$
DECLARE
  count_result INTEGER;
BEGIN
  SELECT COUNT(*) INTO count_result
  FROM imre_assessments
  WHERE completion_status = 'completed'
    AND (
      semantic_context ? 'primary_data' OR
      semantic_context ? 'spontaneous_speech' OR
      semantic_context ? 'patient_narrative'
    );
  
  RETURN count_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para contar análises multirracionais
CREATE OR REPLACE FUNCTION count_multirational_analyses()
RETURNS INTEGER AS $$
DECLARE
  count_result INTEGER;
BEGIN
  SELECT COUNT(*) INTO count_result
  FROM imre_assessments
  WHERE completion_status = 'completed'
    AND triaxial_data ? 'rationalities'
    AND (
      SELECT COUNT(*) 
      FROM jsonb_object_keys(triaxial_data->'rationalities')
    ) >= 4;
  
  RETURN count_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para contar dados primários coletados
CREATE OR REPLACE FUNCTION count_primary_data_blocks()
RETURNS INTEGER AS $$
DECLARE
  count_result INTEGER;
BEGIN
  SELECT COALESCE(
    SUM(
      CASE 
        WHEN semantic_context ? 'semantic_blocks' THEN
          jsonb_array_length(semantic_context->'semantic_blocks')
        WHEN semantic_context ? 'primary_data' THEN 1
        ELSE 0
      END
    ),
    0
  ) INTO count_result
  FROM imre_assessments
  WHERE completion_status = 'completed';
  
  RETURN count_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para contar correlações identificadas
CREATE OR REPLACE FUNCTION count_identified_correlations()
RETURNS INTEGER AS $$
DECLARE
  count_result INTEGER;
BEGIN
  SELECT COUNT(*) INTO count_result
  FROM imre_assessments
  WHERE completion_status = 'completed'
    AND (
      semantic_context ? 'primary_data' OR
      semantic_context ? 'spontaneous_speech'
    )
    AND (
      triaxial_data ? 'clinical_correlations' OR
      triaxial_data ? 'integrated_analysis'
    );
  
  RETURN count_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 5. TRIGGER PARA ATUALIZAR updated_at AUTOMATICAMENTE
-- =====================================================

-- Função para atualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para imre_assessments
DROP TRIGGER IF EXISTS update_imre_assessments_updated_at ON imre_assessments;
CREATE TRIGGER update_imre_assessments_updated_at
  BEFORE UPDATE ON imre_assessments
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger para clinical_assessments
DROP TRIGGER IF EXISTS update_clinical_assessments_updated_at ON clinical_assessments;
CREATE TRIGGER update_clinical_assessments_updated_at
  BEFORE UPDATE ON clinical_assessments
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- 6. VERIFICAÇÕES E VALIDAÇÕES
-- =====================================================

-- Verificar se as tabelas foram criadas corretamente
DO $$
DECLARE
  table_exists BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT FROM pg_tables 
    WHERE schemaname = 'public' 
    AND tablename = 'imre_assessments'
  ) INTO table_exists;
  
  IF NOT table_exists THEN
    RAISE EXCEPTION 'Tabela imre_assessments não foi criada!';
  END IF;
  
  SELECT EXISTS (
    SELECT FROM pg_tables 
    WHERE schemaname = 'public' 
    AND tablename = 'clinical_assessments'
  ) INTO table_exists;
  
  IF NOT table_exists THEN
    RAISE EXCEPTION 'Tabela clinical_assessments não foi criada!';
  END IF;
  
  RAISE NOTICE '✅ Todas as tabelas foram verificadas com sucesso!';
END $$;

-- Verificar índices
DO $$
DECLARE
  index_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO index_count
  FROM pg_indexes
  WHERE schemaname = 'public'
    AND tablename = 'imre_assessments';
  
  RAISE NOTICE '✅ Índices criados para imre_assessments: %', index_count;
END $$;

-- =====================================================
-- 7. COMENTÁRIOS E DOCUMENTAÇÃO
-- =====================================================

COMMENT ON TABLE imre_assessments IS 'Avaliações IMRE Triaxial - Armazena dados primários preservados e análises multirracionais';
COMMENT ON COLUMN imre_assessments.semantic_context IS 'Contexto semântico com dados primários (primary_data, spontaneous_speech, patient_narrative)';
COMMENT ON COLUMN imre_assessments.triaxial_data IS 'Dados triaxiais com racionalidades médicas e correlações clínicas';

COMMENT ON TABLE clinical_assessments IS 'Avaliações clínicas gerais - Complementa dados do IMRE';
COMMENT ON COLUMN clinical_assessments.data IS 'Dados da avaliação em JSONB (pode conter patient_narrative, spontaneous_speech, primary_data)';

-- =====================================================
-- FIM DO SCRIPT
-- =====================================================
-- 
-- PRÓXIMOS PASSOS:
-- 1. Execute este script no Supabase SQL Editor
-- 2. Verifique se não há erros
-- 3. Teste os KPIs no dashboard
-- 4. Se necessário, ajuste as políticas RLS conforme suas necessidades de segurança

