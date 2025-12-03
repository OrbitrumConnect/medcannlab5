-- =====================================================
-- 📋 ADICIONAR CAMPOS DE CONSELHO PROFISSIONAL
-- =====================================================
-- Este script adiciona campos para identificar diferentes
-- categorias profissionais através do número do conselho
-- =====================================================

DO $$
BEGIN
    RAISE NOTICE '🔧 Adicionando campos de conselho profissional...';
END $$;

-- =====================================================
-- 1. ADICIONAR CAMPO PARA TIPO DE CONSELHO
-- =====================================================
-- Exemplos: CRM, CFN, CRP, CRF, etc.
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' 
        AND column_name = 'council_type'
    ) THEN
        ALTER TABLE users ADD COLUMN council_type TEXT;
        RAISE NOTICE '✅ Coluna council_type adicionada';
    ELSE
        RAISE NOTICE 'ℹ️ Coluna council_type já existe';
    END IF;
END $$;

-- =====================================================
-- 2. ADICIONAR CAMPO GENÉRICO PARA NÚMERO DO CONSELHO
-- =====================================================
-- Este campo será usado para armazenar o número do conselho
-- independente do tipo (CRM, CFN, etc.)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' 
        AND column_name = 'council_number'
    ) THEN
        ALTER TABLE users ADD COLUMN council_number TEXT;
        RAISE NOTICE '✅ Coluna council_number adicionada';
    ELSE
        RAISE NOTICE 'ℹ️ Coluna council_number já existe';
    END IF;
END $$;

-- =====================================================
-- 3. ADICIONAR CAMPO PARA ESTADO DO CONSELHO (OPCIONAL)
-- =====================================================
-- Para conselhos regionais (CRM, CFN, etc.)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' 
        AND column_name = 'council_state'
    ) THEN
        ALTER TABLE users ADD COLUMN council_state TEXT;
        RAISE NOTICE '✅ Coluna council_state adicionada';
    ELSE
        RAISE NOTICE 'ℹ️ Coluna council_state já existe';
    END IF;
END $$;

-- =====================================================
-- 4. MANTER COMPATIBILIDADE COM CRM E CRO
-- =====================================================
-- Os campos CRM e CRO continuam existindo para compatibilidade
-- Mas agora podemos usar council_type + council_number

-- Criar função para popular campos legados quando council_type = 'CRM' ou 'CRO'
CREATE OR REPLACE FUNCTION sync_council_fields()
RETURNS TRIGGER AS $$
BEGIN
    -- Se council_type for CRM, popular campo crm
    IF NEW.council_type = 'CRM' AND NEW.council_number IS NOT NULL THEN
        NEW.crm = NEW.council_number;
    END IF;
    
    -- Se council_type for CRO, popular campo cro
    IF NEW.council_type = 'CRO' AND NEW.council_number IS NOT NULL THEN
        NEW.cro = NEW.council_number;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Criar trigger para sincronizar automaticamente
DROP TRIGGER IF EXISTS sync_council_fields_trigger ON users;
CREATE TRIGGER sync_council_fields_trigger
    BEFORE INSERT OR UPDATE ON users
    FOR EACH ROW
    WHEN (NEW.council_type IS NOT NULL AND NEW.council_number IS NOT NULL)
    EXECUTE FUNCTION sync_council_fields();

-- =====================================================
-- 5. VERIFICAÇÃO FINAL
-- =====================================================
DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '═══════════════════════════════════════════════════════════';
    RAISE NOTICE '📊 CAMPOS DE CONSELHO PROFISSIONAL';
    RAISE NOTICE '═══════════════════════════════════════════════════════════';
    RAISE NOTICE '✅ Campos disponíveis:';
    RAISE NOTICE '   - council_type: Tipo do conselho (CRM, CFN, CRP, CRF, etc.)';
    RAISE NOTICE '   - council_number: Número do registro no conselho';
    RAISE NOTICE '   - council_state: Estado do conselho (para conselhos regionais)';
    RAISE NOTICE '   - crm: Campo legado (sincronizado automaticamente se council_type = CRM)';
    RAISE NOTICE '   - cro: Campo legado (sincronizado automaticamente se council_type = CRO)';
    RAISE NOTICE '';
    RAISE NOTICE '📋 Tipos de conselho suportados:';
    RAISE NOTICE '   - CRM: Conselho Regional de Medicina';
    RAISE NOTICE '   - CFN: Conselho Federal de Nutrição';
    RAISE NOTICE '   - CRP: Conselho Regional de Psicologia';
    RAISE NOTICE '   - CRF: Conselho Regional de Farmácia';
    RAISE NOTICE '   - CRO: Conselho Regional de Odontologia';
    RAISE NOTICE '   - E outros conforme necessário';
    RAISE NOTICE '═══════════════════════════════════════════════════════════';
END $$;

-- Mostrar estrutura final
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'users' 
  AND column_name IN ('crm', 'cro', 'council_type', 'council_number', 'council_state')
ORDER BY 
    CASE column_name
        WHEN 'council_type' THEN 1
        WHEN 'council_number' THEN 2
        WHEN 'council_state' THEN 3
        WHEN 'crm' THEN 4
        WHEN 'cro' THEN 5
    END;

