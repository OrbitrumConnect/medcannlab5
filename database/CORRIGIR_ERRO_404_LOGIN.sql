-- =====================================================
-- CORRIGIR ERRO 404 NOT_FOUND NO LOGIN
-- =====================================================
-- Execute este script no Supabase SQL Editor
-- Este script garante que a tabela users existe e tem políticas RLS corretas

-- 1. CRIAR TABELA USERS SE NÃO EXISTIR
-- =====================================================
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('patient', 'professional', 'student', 'admin', 'paciente', 'profissional', 'aluno')),
  crm TEXT,
  cro TEXT,
  avatar_url TEXT,
  phone TEXT,
  address TEXT,
  blood_type TEXT,
  allergies TEXT[],
  medications TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. ADICIONAR COLUNAS FALTANTES SE A TABELA JÁ EXISTIR
-- =====================================================
DO $$ 
BEGIN
  -- Adicionar colunas que podem não existir
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'avatar_url') THEN
    ALTER TABLE users ADD COLUMN avatar_url TEXT;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'phone') THEN
    ALTER TABLE users ADD COLUMN phone TEXT;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'address') THEN
    ALTER TABLE users ADD COLUMN address TEXT;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'blood_type') THEN
    ALTER TABLE users ADD COLUMN blood_type TEXT;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'allergies') THEN
    ALTER TABLE users ADD COLUMN allergies TEXT[];
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'medications') THEN
    ALTER TABLE users ADD COLUMN medications TEXT[];
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'updated_at') THEN
    ALTER TABLE users ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
  END IF;
END $$;

-- 3. HABILITAR RLS
-- =====================================================
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- 4. REMOVER POLÍTICAS ANTIGAS SE EXISTIREM
-- =====================================================
DROP POLICY IF EXISTS "Users can view own profile" ON users;
DROP POLICY IF EXISTS "Users can update own profile" ON users;
DROP POLICY IF EXISTS "Users can insert own profile" ON users;
DROP POLICY IF EXISTS "Anyone can view users" ON users;
DROP POLICY IF EXISTS "Authenticated users can view users" ON users;
DROP POLICY IF EXISTS "Users can view all users" ON users;
DROP POLICY IF EXISTS "Admins can manage all users" ON users;

-- 5. CRIAR POLÍTICAS RLS CORRETAS
-- =====================================================

-- Política: Usuários autenticados podem ver todos os usuários
CREATE POLICY "Authenticated users can view users"
  ON users FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- Política: Usuários podem ver seu próprio perfil
CREATE POLICY "Users can view own profile"
  ON users FOR SELECT
  USING (auth.uid() = id);

-- Política: Usuários podem inserir seu próprio perfil
CREATE POLICY "Users can insert own profile"
  ON users FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Política: Usuários podem atualizar seu próprio perfil
CREATE POLICY "Users can update own profile"
  ON users FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Política: Admins podem fazer tudo
CREATE POLICY "Admins can manage all users"
  ON users FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() 
      AND type IN ('admin', 'Admin')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() 
      AND type IN ('admin', 'Admin')
    )
  );

-- 6. CRIAR ÍNDICES PARA PERFORMANCE
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_type ON users(type);
CREATE INDEX IF NOT EXISTS idx_users_id ON users(id);

-- 7. FUNÇÃO PARA ATUALIZAR updated_at AUTOMATICAMENTE
-- =====================================================
CREATE OR REPLACE FUNCTION update_users_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 8. TRIGGER PARA ATUALIZAR updated_at
-- =====================================================
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_users_updated_at();

-- 9. VERIFICAR SE A TABELA FOI CRIADA CORRETAMENTE
-- =====================================================
SELECT 
  'Tabela users criada/verificada' as status,
  COUNT(*) as total_users
FROM users;

-- 10. VERIFICAR POLÍTICAS RLS
-- =====================================================
SELECT 
  policyname,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'users'
ORDER BY policyname;

-- Status: Tabela users configurada
-- - Tabela criada/verificada
-- - RLS habilitado
-- - Políticas configuradas
-- - Índices criados
-- - Trigger de updated_at configurado

