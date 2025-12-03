-- =====================================================
-- 🔧 CORREÇÃO RLS - IMRE_ASSESSMENTS E NOTIFICATIONS
-- =====================================================
-- Execute este script para corrigir os erros 403 e 400
-- =====================================================

-- =====================================================
-- PARTE 1: CORRIGIR NOTIFICATIONS (Erro 400)
-- =====================================================

-- Garantir que a coluna is_read existe
DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'notifications') THEN
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'notifications' 
      AND column_name = 'is_read'
    ) THEN
      ALTER TABLE notifications ADD COLUMN is_read BOOLEAN DEFAULT false;
    END IF;
  END IF;
END $$;

-- =====================================================
-- PARTE 2: CORRIGIR POLÍTICAS RLS IMRE_ASSESSMENTS (Erro 403)
-- =====================================================

-- Remover políticas antigas e criar novas
DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'imre_assessments') THEN
    -- Remover TODAS as políticas antigas (incluindo a que estava causando erro)
    DROP POLICY IF EXISTS "Users can view own assessments" ON imre_assessments;
    DROP POLICY IF EXISTS "Users can insert own assessments" ON imre_assessments;
    DROP POLICY IF EXISTS "Users can update own assessments" ON imre_assessments;
    DROP POLICY IF EXISTS "Users can delete own assessments" ON imre_assessments;
    DROP POLICY IF EXISTS "Professionals can view patient assessments" ON imre_assessments;
    DROP POLICY IF EXISTS "Authenticated users can view assessments" ON imre_assessments;
    DROP POLICY IF EXISTS "Authenticated users can insert assessments" ON imre_assessments;
    DROP POLICY IF EXISTS "Authenticated users can update assessments" ON imre_assessments;
    
    -- Verificar se a coluna user_id existe
    IF EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'imre_assessments' 
      AND column_name = 'user_id'
    ) THEN
      -- Criar políticas que permitem acesso baseado em user_id
      CREATE POLICY "Users can view own assessments" 
      ON imre_assessments 
      FOR SELECT 
      USING (auth.uid() = user_id);
      
      CREATE POLICY "Users can insert own assessments" 
      ON imre_assessments 
      FOR INSERT 
      WITH CHECK (auth.uid() = user_id);
      
      CREATE POLICY "Users can update own assessments" 
      ON imre_assessments 
      FOR UPDATE 
      USING (auth.uid() = user_id)
      WITH CHECK (auth.uid() = user_id);
      
      -- Permitir que profissionais vejam avaliações de seus pacientes
      CREATE POLICY "Professionals can view patient assessments" 
      ON imre_assessments 
      FOR SELECT 
      USING (
        EXISTS (
          SELECT 1 FROM profiles 
          WHERE id = auth.uid() 
          AND type IN ('professional', 'admin')
        )
      );
    ELSE
      -- Se não tem user_id, criar política mais permissiva temporariamente
      CREATE POLICY "Authenticated users can view assessments" 
      ON imre_assessments 
      FOR SELECT 
      TO authenticated 
      USING (true);
      
      CREATE POLICY "Authenticated users can insert assessments" 
      ON imre_assessments 
      FOR INSERT 
      TO authenticated 
      WITH CHECK (true);
      
      CREATE POLICY "Authenticated users can update assessments" 
      ON imre_assessments 
      FOR UPDATE 
      TO authenticated 
      USING (true)
      WITH CHECK (true);
    END IF;
  END IF;
END $$;

-- =====================================================
-- PARTE 3: CORRIGIR POLÍTICAS RLS NOTIFICATIONS (Erro 400)
-- =====================================================

-- Remover políticas antigas e criar novas
DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'notifications') THEN
    -- Remover TODAS as políticas antigas
    DROP POLICY IF EXISTS "Users can view own notifications" ON notifications;
    DROP POLICY IF EXISTS "Users can update own notifications" ON notifications;
    DROP POLICY IF EXISTS "Users can insert own notifications" ON notifications;
    DROP POLICY IF EXISTS "System can insert notifications" ON notifications;
    DROP POLICY IF EXISTS "Authenticated users can view notifications" ON notifications;
    DROP POLICY IF EXISTS "Authenticated users can insert notifications" ON notifications;
    DROP POLICY IF EXISTS "Authenticated users can update notifications" ON notifications;
    
    -- Verificar se a coluna user_id existe
    IF EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'notifications' 
      AND column_name = 'user_id'
    ) THEN
      -- Criar políticas que permitem acesso baseado em user_id
      CREATE POLICY "Users can view own notifications" 
      ON notifications 
      FOR SELECT 
      USING (auth.uid() = user_id);
      
      CREATE POLICY "Users can update own notifications" 
      ON notifications 
      FOR UPDATE 
      USING (auth.uid() = user_id)
      WITH CHECK (auth.uid() = user_id);
      
      CREATE POLICY "Users can insert own notifications" 
      ON notifications 
      FOR INSERT 
      WITH CHECK (auth.uid() = user_id);
      
      -- Permitir que sistema insira notificações (para admins)
      CREATE POLICY "System can insert notifications" 
      ON notifications 
      FOR INSERT 
      WITH CHECK (
        EXISTS (
          SELECT 1 FROM profiles 
          WHERE id = auth.uid() 
          AND type = 'admin'
        )
      );
    ELSE
      -- Se não tem user_id, criar política mais permissiva temporariamente
      CREATE POLICY "Authenticated users can view notifications" 
      ON notifications 
      FOR SELECT 
      TO authenticated 
      USING (true);
      
      CREATE POLICY "Authenticated users can insert notifications" 
      ON notifications 
      FOR INSERT 
      TO authenticated 
      WITH CHECK (true);
      
      CREATE POLICY "Authenticated users can update notifications" 
      ON notifications 
      FOR UPDATE 
      TO authenticated 
      USING (true)
      WITH CHECK (true);
    END IF;
  END IF;
END $$;

-- =====================================================
-- PARTE 4: VERIFICAÇÃO
-- =====================================================

-- Verificar políticas criadas para imre_assessments
SELECT 
  'Políticas RLS imre_assessments:' as status,
  policyname,
  cmd
FROM pg_policies
WHERE schemaname = 'public'
AND tablename = 'imre_assessments'
ORDER BY policyname;

-- Verificar políticas criadas para notifications
SELECT 
  'Políticas RLS notifications:' as status,
  policyname,
  cmd
FROM pg_policies
WHERE schemaname = 'public'
AND tablename = 'notifications'
ORDER BY policyname;

-- Verificar se coluna is_read existe
SELECT 
  'Coluna is_read em notifications:' as status,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'notifications' 
      AND column_name = 'is_read'
    ) THEN 'EXISTE ✅'
    ELSE 'NÃO EXISTE ❌'
  END as status_coluna;

-- Verificar se coluna user_id existe em imre_assessments
SELECT 
  'Coluna user_id em imre_assessments:' as status,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'imre_assessments' 
      AND column_name = 'user_id'
    ) THEN 'EXISTE ✅'
    ELSE 'NÃO EXISTE ❌'
  END as status_coluna;

-- =====================================================
-- FIM DO SCRIPT
-- =====================================================

