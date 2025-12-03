-- =====================================================
-- PRÉ-REQUISITOS PARA MODO DEV VIVO
-- Execute este script ANTES de CREATE_DEV_VIVO_TABLES.sql
-- MedCannLab 3.0 - Desenvolvimento em Tempo Real
-- =====================================================

-- 1. ADICIONAR COLUNA flag_admin À TABELA users
-- =====================================================
DO $$
BEGIN
  -- Verificar se a coluna já existe
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'users' 
      AND column_name = 'flag_admin'
      AND table_schema = 'public'
  ) THEN
    -- Adicionar coluna
    ALTER TABLE users 
    ADD COLUMN flag_admin BOOLEAN DEFAULT false NOT NULL;
    
    RAISE NOTICE '✅ Coluna flag_admin adicionada à tabela users';
  ELSE
    RAISE NOTICE 'ℹ️ Coluna flag_admin já existe';
  END IF;
END $$;

-- 2. ATUALIZAR flag_admin PARA USUÁRIOS ADMIN EXISTENTES
-- =====================================================
UPDATE users
SET flag_admin = true
WHERE type = 'admin'
  AND (flag_admin IS NULL OR flag_admin = false);

-- 3. CRIAR ÍNDICE PARA PERFORMANCE
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_users_flag_admin ON users(flag_admin) WHERE flag_admin = true;

-- 4. ADICIONAR COMENTÁRIO
-- =====================================================
COMMENT ON COLUMN users.flag_admin IS 'Flag que indica se o usuário tem permissões de administrador para usar Modo Dev Vivo e outras funcionalidades avançadas';

-- 5. VERIFICAR RESULTADO
-- =====================================================
SELECT 
  '✅ Pré-requisitos configurados!' as status,
  COUNT(*) FILTER (WHERE type = 'admin' AND flag_admin = true) as admins_com_flag,
  COUNT(*) FILTER (WHERE type = 'admin') as total_admins
FROM users;

-- 6. MOSTRAR ADMINS CONFIGURADOS
-- =====================================================
SELECT 
  id,
  name,
  email,
  type,
  flag_admin,
  created_at
FROM users
WHERE type = 'admin'
ORDER BY created_at DESC;

-- =====================================================
-- PRÉ-REQUISITOS CONCLUÍDOS!
-- =====================================================
-- Agora você pode executar CREATE_DEV_VIVO_TABLES.sql
-- sem erros relacionados a flag_admin

