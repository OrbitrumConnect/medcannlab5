# ⚡ COMANDOS RÁPIDOS SQL
## MedCannLab 3.0 - Queries de Verificação
**Use estas queries para verificar rapidamente após executar migrações**

---

## 🔍 **VERIFICAÇÃO RÁPIDA (1 query)**

```sql
-- Ver todas as tabelas criadas
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND (
    table_name LIKE 'imre%' 
    OR table_name = 'notifications'
)
ORDER BY table_name;
```

**Resultado esperado:** 6 tabelas

---

## ✅ **VERIFICAR RLS**

```sql
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN (
    'imre_assessments',
    'imre_semantic_blocks',
    'imre_semantic_context',
    'noa_interaction_logs',
    'clinical_integration',
    'notifications'
);
```

**Resultado esperado:** Todas com `rowsecurity = true`

---

## 📊 **CONTAR TABELAS**

```sql
SELECT COUNT(*) as total_tabelas
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND (
    table_name LIKE 'imre%' 
    OR table_name = 'notifications'
);
```

**Resultado esperado:** `total_tabelas = 6`

---

## 🔧 **VERIFICAR POLÍTICAS RLS**

```sql
SELECT tablename, policyname, cmd
FROM pg_policies
WHERE schemaname = 'public'
AND tablename IN (
    'imre_assessments',
    'imre_semantic_blocks',
    'imre_semantic_context',
    'noa_interaction_logs',
    'clinical_integration',
    'notifications'
)
ORDER BY tablename, policyname;
```

**Resultado esperado:** Várias políticas listadas

---

## 📈 **VERIFICAR ÍNDICES**

```sql
SELECT tablename, indexname
FROM pg_indexes
WHERE schemaname = 'public'
AND tablename IN (
    'imre_assessments',
    'imre_semantic_blocks',
    'imre_semantic_context',
    'noa_interaction_logs',
    'clinical_integration',
    'notifications'
)
ORDER BY tablename, indexname;
```

**Resultado esperado:** Vários índices criados

---

## 🎯 **TESTE RÁPIDO DE INSERÇÃO**

```sql
-- Teste rápido (substitua USER_ID pelo seu ID)
DO $$
DECLARE
    test_user_id UUID;
    test_id UUID;
BEGIN
    -- Buscar um usuário
    SELECT id INTO test_user_id FROM auth.users LIMIT 1;
    
    IF test_user_id IS NULL THEN
        RAISE NOTICE 'Nenhum usuário encontrado';
        RETURN;
    END IF;
    
    -- Testar inserção em notifications
    INSERT INTO notifications (
        user_id,
        title,
        message,
        type
    ) VALUES (
        test_user_id,
        'Teste',
        'Notificação de teste',
        'info'
    ) RETURNING id INTO test_id;
    
    RAISE NOTICE '✅ Teste OK! ID: %', test_id;
    
    -- Limpar
    DELETE FROM notifications WHERE id = test_id;
    RAISE NOTICE '✅ Teste removido';
    
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE '❌ Erro: %', SQLERRM;
END $$;
```

**Resultado esperado:** `✅ Teste OK!`

---

## 🚨 **SE PRECISAR RECRIAR (CUIDADO!)**

```sql
-- ⚠️ ATENÇÃO: Isso apaga TODOS os dados!
-- Use apenas se realmente precisar recriar

DROP TABLE IF EXISTS notifications CASCADE;
DROP TABLE IF EXISTS clinical_integration CASCADE;
DROP TABLE IF EXISTS noa_interaction_logs CASCADE;
DROP TABLE IF EXISTS imre_semantic_context CASCADE;
DROP TABLE IF EXISTS imre_semantic_blocks CASCADE;
DROP TABLE IF EXISTS imre_assessments CASCADE;
```

**⚠️ Só execute se realmente precisar recriar tudo!**

---

## ✅ **CHECKLIST RÁPIDO**

Execute a primeira query acima e verifique:

- [ ] Mostra 6 tabelas = ✅ Sucesso!
- [ ] Mostra menos de 6 = ⚠️ Verificar qual falta
- [ ] Mostra 0 tabelas = ❌ Migrações não executadas

---

**Use estas queries para verificação rápida após executar migrações!**

