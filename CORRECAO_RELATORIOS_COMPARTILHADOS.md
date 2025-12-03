# 🔧 Correção: Relatórios Compartilhados Não Aparecem

## 🐛 Problema Identificado

**Sintoma**: Notificação de relatório compartilhado aparece, mas o relatório não aparece na seção "Relatórios da Avaliação Clínica Inicial".

**Causa Raiz**: 
1. A busca estava usando `status = 'shared'` mas alguns relatórios podem ter status diferente
2. A comparação de IDs entre `shared_with` (array UUID[]) e `user.id` (string) não estava funcionando corretamente
3. A função RPC `get_shared_reports_for_doctor` não estava sendo utilizada

---

## ✅ Solução Implementada

### 1. **Uso da Função RPC (Prioritário)**
- Agora tenta usar `get_shared_reports_for_doctor()` primeiro
- Mais eficiente e garante que os relatórios compartilhados sejam encontrados

### 2. **Fallback com Busca Manual Melhorada**
- Se a RPC não funcionar, usa busca manual
- Remove filtro rígido de `status = 'shared'`
- Busca todos os relatórios com `shared_with` preenchido
- Compara IDs convertendo ambos para string

### 3. **Logs de Debug**
- Adiciona logs para identificar problemas
- Mostra quantos relatórios foram encontrados
- Indica quando um relatório compartilhado é encontrado

---

## 📝 Mudanças no Código

**Arquivo**: `src/components/ClinicalReports.tsx`

### Antes:
```typescript
const { data: allReports } = await supabase
  .from('clinical_reports')
  .select('*')
  .eq('status', 'shared')  // ❌ Muito restritivo
  .order('shared_at', { ascending: false })

const sharedReports = allReports?.filter(report => {
  const sharedWith = report.shared_with || []
  return Array.isArray(sharedWith) && sharedWith.includes(user?.id)  // ❌ Comparação pode falhar
}) || []
```

### Depois:
```typescript
// 1. Tentar RPC primeiro
const { data: rpcReports } = await supabase.rpc('get_shared_reports_for_doctor', {
  p_doctor_id: user.id
})

// 2. Fallback: busca manual melhorada
const { data: allReports } = await supabase
  .from('clinical_reports')
  .select('*')
  .not('shared_with', 'is', null)  // ✅ Busca todos com shared_with preenchido
  .order('shared_at', { ascending: false })

const sharedReports = allReports?.filter(report => {
  const sharedWith = report.shared_with || []
  if (!Array.isArray(sharedWith)) return false
  
  // ✅ Comparação segura convertendo para string
  const userIdStr = user.id.toString()
  return sharedWith.some((id: any) => id?.toString() === userIdStr)
}) || []
```

---

## 🔍 Como Verificar se Está Funcionando

### 1. **Verificar no Console do Navegador**
Abra o DevTools (F12) e vá na aba Console. Você deve ver:
```
✅ Relatório compartilhado encontrado: { reportId: '...', patientName: '...', ... }
📊 Total de relatórios encontrados: X, compartilhados com este médico: Y
```

### 2. **Verificar no Banco de Dados**
Execute no Supabase SQL Editor:
```sql
-- Ver relatórios compartilhados
SELECT 
  id,
  patient_name,
  status,
  shared_with,
  shared_at,
  shared_by
FROM clinical_reports
WHERE shared_with IS NOT NULL
  AND array_length(shared_with, 1) > 0
ORDER BY shared_at DESC;
```

### 3. **Verificar Notificações**
```sql
-- Ver notificações de relatórios compartilhados
SELECT 
  id,
  type,
  title,
  message,
  data->>'report_id' as report_id,
  user_id,
  created_at,
  read
FROM notifications
WHERE type = 'report_shared'
ORDER BY created_at DESC;
```

---

## 🚨 Possíveis Problemas Restantes

### 1. **Função RPC Não Existe**
**Solução**: Execute o script `ADICIONAR_COMPARTILHAMENTO_RELATORIOS.sql` no Supabase

### 2. **RLS Bloqueando Acesso**
**Solução**: Verifique se as políticas RLS estão corretas:
```sql
-- Ver políticas RLS
SELECT * FROM pg_policies 
WHERE tablename = 'clinical_reports';
```

### 3. **IDs Não Correspondem**
**Solução**: Verifique se o `user.id` na notificação corresponde ao ID em `shared_with`:
```sql
-- Comparar IDs
SELECT 
  n.user_id as notification_user_id,
  cr.shared_with,
  n.data->>'report_id' as report_id
FROM notifications n
JOIN clinical_reports cr ON cr.id = n.data->>'report_id'
WHERE n.type = 'report_shared';
```

---

## 📋 Checklist de Verificação

- [ ] Função RPC `get_shared_reports_for_doctor` existe no Supabase
- [ ] Colunas `shared_with`, `shared_at`, `shared_by` existem na tabela `clinical_reports`
- [ ] Políticas RLS permitem que médicos vejam relatórios compartilhados
- [ ] Notificação foi criada com `type = 'report_shared'`
- [ ] Relatório tem `shared_with` preenchido com o ID do médico
- [ ] Console do navegador mostra logs de debug

---

## 🎯 Próximos Passos

1. **Testar o compartilhamento**:
   - Paciente compartilha relatório
   - Verificar se notificação é criada
   - Verificar se relatório aparece na seção

2. **Monitorar logs**:
   - Verificar console do navegador
   - Verificar logs do Supabase

3. **Melhorar UX**:
   - Adicionar indicador visual quando não há relatórios
   - Mostrar mensagem se RPC não estiver disponível
   - Adicionar botão de refresh manual

---

**Status**: ✅ Corrigido  
**Data**: Janeiro 2025  
**Versão**: 1.1.0

