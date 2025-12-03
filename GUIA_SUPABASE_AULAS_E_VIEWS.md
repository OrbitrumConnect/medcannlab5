# 📋 Guia: O que fazer no Supabase

## 🎯 Scripts que DEVEM ser executados

### 1. **CRIAR_VIEWS_CORRIGIDO.sql** ⚠️ PRIORITÁRIO
Este script cria as views e funções RPC que estão faltando e causando erros 404/400:

**O que faz:**
- Cria a função RPC `get_unread_notifications_count` (para notificações não lidas)
- Cria a view `v_doctor_dashboard_kpis` (KPIs do dashboard do médico)
- Cria a view `v_next_appointments` (próximos agendamentos)

**Como executar:**
1. Abra o Supabase Dashboard
2. Vá em **SQL Editor**
3. Abra o arquivo `CRIAR_VIEWS_CORRIGIDO.sql`
4. Copie e cole todo o conteúdo
5. Clique em **Run** ou pressione `Ctrl+Enter`

**Importante:** Este script já faz limpeza automática de views antigas antes de criar novas.

---

### 2. **CRIAR_TABELA_LESSON_CONTENT.sql** (NOVO)
Este script cria a tabela para armazenar o conteúdo das aulas:

**O que faz:**
- Cria a tabela `lesson_content` para armazenar conteúdo de aulas
- Permite que professores editem e salvem conteúdo de aulas
- Suporta markdown e HTML

**Como executar:**
1. Execute o script `CRIAR_TABELA_LESSON_CONTENT.sql` no SQL Editor
2. Verifique se a tabela foi criada corretamente

---

## ✅ Verificações após executar os scripts

### Verificar se as views foram criadas:
```sql
-- Verificar views criadas
SELECT viewname 
FROM pg_views 
WHERE schemaname = 'public' 
AND viewname IN ('v_doctor_dashboard_kpis', 'v_next_appointments');
```

### Verificar se a função RPC foi criada:
```sql
-- Verificar função RPC
SELECT routine_name 
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name = 'get_unread_notifications_count';
```

### Verificar se a tabela lesson_content foi criada:
```sql
-- Verificar tabela
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name = 'lesson_content';
```

---

## 🔧 Scripts opcionais (se necessário)

### Se houver erros de RLS (Row Level Security):
Execute `FIX_RLS_DOCUMENTS_TABLE.sql` se houver problemas ao fazer upload de documentos.

### Se houver erros com notificações:
Execute `CORRIGIR_RLS_IMRE_NOTIFICATIONS.sql` se houver problemas com notificações.

---

## 📝 Ordem recomendada de execução:

1. ✅ **CRIAR_VIEWS_CORRIGIDO.sql** (resolve erros 404/400)
2. ✅ **CRIAR_TABELA_LESSON_CONTENT.sql** (para funcionalidade de aulas)
3. ⚠️ Outros scripts apenas se houver erros específicos

---

## 🚨 Erros comuns e soluções:

### Erro: "column recipient_id does not exist"
**Solução:** Execute `CRIAR_VIEWS_CORRIGIDO.sql` novamente. Ele limpa views antigas.

### Erro: "view v_doctor_dashboard_kpis does not exist" (404)
**Solução:** Execute `CRIAR_VIEWS_CORRIGIDO.sql`.

### Erro: "function get_unread_notifications_count does not exist" (404)
**Solução:** Execute `CRIAR_VIEWS_CORRIGIDO.sql`.

### Erro ao salvar conteúdo de aula
**Solução:** Execute `CRIAR_TABELA_LESSON_CONTENT.sql`.

---

## 📞 Suporte

Se após executar os scripts ainda houver erros, verifique:
1. Se você tem permissões de administrador no Supabase
2. Se o RLS está configurado corretamente
3. Se as tabelas base (appointments, notifications, etc.) existem

