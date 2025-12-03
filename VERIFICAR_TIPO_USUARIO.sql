-- =====================================================
-- 🔍 VERIFICAR TIPO DO USUÁRIO ATUAL
-- =====================================================
-- Execute este script para verificar seu tipo de usuário

SELECT 
    id,
    email,
    raw_user_meta_data->>'type' as tipo_metadata,
    raw_user_meta_data->>'name' as nome,
    created_at
FROM auth.users 
WHERE id = auth.uid();

-- Verificar também nas tabelas profiles e users
SELECT 
    'profiles' as tabela,
    id,
    type,
    name
FROM profiles 
WHERE id = auth.uid()
UNION ALL
SELECT 
    'users' as tabela,
    id::text,
    type,
    name
FROM users 
WHERE id::text = auth.uid()::text;

