# 🔧 Correção Passo a Passo: Relatórios Compartilhados

## 📋 Diagnóstico Inicial

Você executou uma query e recebeu "Success. No rows returned". Isso significa que:

1. ✅ A query foi executada com sucesso
2. ❌ Não há dados retornados

---

## 🔍 Passo 1: Verificar o que está faltando

Execute o script de diagnóstico:

**Arquivo**: `database/DIAGNOSTICO_RELATORIOS_COMPARTILHADOS.sql`

Este script verifica:
- ✅ Se a função RPC existe
- ✅ Se as colunas de compartilhamento existem
- ✅ Se há relatórios no banco
- ✅ Se há notificações
- ✅ Se há relatórios compartilhados

---

## 🛠️ Passo 2: Corrigir o que está faltando

### Cenário A: Função RPC não existe

**Sintoma**: Query 1 retorna vazio

**Solução**: Execute o script completo:
```sql
-- Execute no Supabase SQL Editor
-- Arquivo: ADICIONAR_COMPARTILHAMENTO_RELATORIOS.sql
```

### Cenário B: Colunas não existem

**Sintoma**: Query 2 não mostra `shared_with`, `shared_at`, `shared_by`

**Solução**: Execute apenas a parte de adicionar colunas:
```sql
-- Adicionar colunas de compartilhamento
ALTER TABLE clinical_reports 
ADD COLUMN IF NOT EXISTS shared_with UUID[] DEFAULT ARRAY[]::UUID[];

ALTER TABLE clinical_reports 
ADD COLUMN IF NOT EXISTS shared_at TIMESTAMP WITH TIME ZONE;

ALTER TABLE clinical_reports 
ADD COLUMN IF NOT EXISTS shared_by UUID REFERENCES auth.users(id);
```

### Cenário C: Há notificação mas não há relatório compartilhado

**Sintoma**: Query 5 mostra notificação, mas Query 4 não mostra relatório

**Solução**: O compartilhamento não foi executado. Você precisa:

1. **Verificar se a função de compartilhamento existe**:
```sql
SELECT routine_name 
FROM information_schema.routines 
WHERE routine_name = 'share_report_with_doctors';
```

2. **Se não existir, execute**:
```sql
-- Do arquivo ADICIONAR_COMPARTILHAMENTO_RELATORIOS.sql
-- Copie a função share_report_with_doctors
```

3. **Compartilhar o relatório manualmente** (se necessário):
```sql
-- Substitua os valores pelos corretos
SELECT share_report_with_doctors(
  'ID_DO_RELATORIO',  -- report_id
  'ID_DO_PACIENTE'::UUID,  -- patient_id
  ARRAY['ID_DO_MEDICO'::UUID]  -- doctor_ids
);
```

---

## 🎯 Passo 3: Testar o Compartilhamento

### Opção 1: Via Interface (Recomendado)

1. Faça login como **paciente**
2. Vá em "Meus Relatórios"
3. Clique em "Compartilhar" no relatório
4. Selecione o médico (Dr. Eduardo Faveret ou Dr. Ricardo Valença)
5. Clique em "Compartilhar"

### Opção 2: Via SQL (Para Teste)

```sql
-- 1. Encontrar um relatório para compartilhar
SELECT id, patient_id, patient_name, status
FROM clinical_reports
WHERE status = 'completed'
LIMIT 1;

-- 2. Encontrar o ID do médico
SELECT id, name, email
FROM users
WHERE email IN ('eduardoscfaveret@gmail.com', 'rrvalenca@gmail.com')
  AND user_type IN ('professional', 'admin');

-- 3. Compartilhar o relatório
-- Substitua pelos IDs reais encontrados acima
SELECT share_report_with_doctors(
  'ID_RELATORIO_AQUI',  -- do passo 1
  'ID_PACIENTE_AQUI'::UUID,  -- do passo 1
  ARRAY['ID_MEDICO_AQUI'::UUID]  -- do passo 2
);
```

---

## ✅ Passo 4: Verificar se Funcionou

Execute novamente o diagnóstico:

```sql
-- Verificar relatórios compartilhados
SELECT 
  id,
  patient_name,
  shared_with,
  shared_at,
  status
FROM clinical_reports
WHERE shared_with IS NOT NULL
  AND array_length(shared_with, 1) > 0;
```

**Resultado esperado**: Deve retornar pelo menos 1 linha

---

## 🐛 Problemas Comuns

### Problema 1: "function share_report_with_doctors does not exist"

**Solução**: Execute o script `ADICIONAR_COMPARTILHAMENTO_RELATORIOS.sql` completo

### Problema 2: "column shared_with does not exist"

**Solução**: Execute apenas a parte de adicionar colunas (Cenário B acima)

### Problema 3: "permission denied for table clinical_reports"

**Solução**: Verifique as políticas RLS:
```sql
SELECT * FROM pg_policies WHERE tablename = 'clinical_reports';
```

### Problema 4: Notificação existe mas relatório não aparece

**Solução**: 
1. Verifique se o `user_id` da notificação está em `shared_with`
2. Verifique se o `report_id` na notificação existe na tabela
3. Execute a query 7 do diagnóstico para ver a discrepância

---

## 📞 Próximos Passos

1. ✅ Execute o diagnóstico
2. ✅ Identifique o que está faltando
3. ✅ Execute a correção apropriada
4. ✅ Teste o compartilhamento
5. ✅ Verifique se aparece na interface

---

**Status**: 🔄 Em Diagnóstico  
**Última atualização**: Janeiro 2025

