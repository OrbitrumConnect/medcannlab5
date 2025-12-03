-- =====================================================
-- ADICIONAR COLUNA flag_admin À TABELA users
-- MedCannLab 3.0 - Modo Dev Vivo
-- =====================================================

-- 1. Verificar estrutura atual da tabela users
-- =====================================================
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'users'
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- 2. Adicionar coluna flag_admin se não existir
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

-- 3. Atualizar flag_admin para usuários admin existentes
-- =====================================================
-- Se já existem admins na tabela, marcar como flag_admin = true
UPDATE users
SET flag_admin = true
WHERE type = 'admin'
  AND (flag_admin IS NULL OR flag_admin = false);

-- 4. Criar índice para performance
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_users_flag_admin ON users(flag_admin) WHERE flag_admin = true;

-- 5. Adicionar comentário
-- =====================================================
COMMENT ON COLUMN users.flag_admin IS 'Flag que indica se o usuário tem permissões de administrador para usar Modo Dev Vivo e outras funcionalidades avançadas';

-- 6. Verificar resultado
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
ORDER BY created_at DESC
LIMIT 10;

-- 7. Verificar estrutura final
-- =====================================================
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'users'
  AND table_schema = 'public'
  AND column_name IN ('id', 'type', 'flag_admin')
ORDER BY ordinal_position;

-- =====================================================
-- SCRIPT CONCLUÍDO!
-- =====================================================
-- Agora você pode executar CREATE_DEV_VIVO_TABLES.sql
-- sem erros relacionados a flag_admin

