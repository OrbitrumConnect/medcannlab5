# 📋 Ordem de Execução dos Scripts SQL

## ⚠️ IMPORTANTE: Execute na ordem correta!

### 1. **PRIMEIRO: Pré-requisitos**
```sql
-- Execute: database/PRE_REQUISITOS_DEV_VIVO.sql
```
**O que faz:**
- Adiciona coluna `flag_admin` à tabela `users`
- Atualiza usuários admin existentes
- Cria índices

**Por que primeiro:**
- O script `CREATE_DEV_VIVO_TABLES.sql` precisa que `users.flag_admin` exista

---

### 2. **SEGUNDO: Tabelas do Modo Dev Vivo**
```sql
-- Execute: database/CREATE_DEV_VIVO_TABLES.sql
```
**O que faz:**
- Cria todas as tabelas do Modo Dev Vivo
- Cria funções RPC
- Configura RLS policies

**Por que segundo:**
- Depende dos pré-requisitos

---

## 🚀 Execução Rápida

### Opção 1: Executar Separadamente

1. **No Supabase SQL Editor:**
   ```sql
   -- Copiar e colar: PRE_REQUISITOS_DEV_VIVO.sql
   -- Executar
   ```

2. **Verificar resultado:**
   - Deve mostrar: "✅ Pré-requisitos configurados!"
   - Deve listar admins com `flag_admin = true`

3. **Executar segundo script:**
   ```sql
   -- Copiar e colar: CREATE_DEV_VIVO_TABLES.sql
   -- Executar
   ```

### Opção 2: Script Combinado

Se preferir, você pode executar tudo de uma vez:

```sql
-- 1. Pré-requisitos
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'users' AND column_name = 'flag_admin'
  ) THEN
    ALTER TABLE users ADD COLUMN flag_admin BOOLEAN DEFAULT false NOT NULL;
  END IF;
END $$;

UPDATE users SET flag_admin = true WHERE type = 'admin';
CREATE INDEX IF NOT EXISTS idx_users_flag_admin ON users(flag_admin) WHERE flag_admin = true;

-- 2. Depois execute CREATE_DEV_VIVO_TABLES.sql normalmente
```

---

## ✅ Verificação

Após executar ambos os scripts, verifique:

```sql
-- 1. Verificar se flag_admin existe
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'users' AND column_name = 'flag_admin';

-- 2. Verificar admins configurados
SELECT id, name, email, type, flag_admin 
FROM users 
WHERE type = 'admin';

-- 3. Verificar tabelas criadas
SELECT table_name 
FROM information_schema.tables 
WHERE table_name LIKE 'dev_vivo%';

-- 4. Verificar funções RPC
SELECT routine_name 
FROM information_schema.routines 
WHERE routine_name LIKE '%dev_vivo%';
```

---

## 🐛 Troubleshooting

### Erro: "column users.flag_admin does not exist"
**Solução:** Execute `PRE_REQUISITOS_DEV_VIVO.sql` primeiro

### Erro: "relation users does not exist"
**Solução:** Verifique se a tabela `users` existe no schema `public`

### Erro: "permission denied"
**Solução:** Verifique se você tem permissões de administrador no Supabase

---

**Ordem Correta:**
1. ✅ `PRE_REQUISITOS_DEV_VIVO.sql`
2. ✅ `CREATE_DEV_VIVO_TABLES.sql`

