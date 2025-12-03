# Guia de Execução - Views e Funções Faltantes

## Problema Identificado

O código está tentando usar views e funções RPC que não existem no Supabase, causando erros 404 e 400:

1. ❌ `get_unread_notifications_count` - Função RPC não existe (404)
2. ❌ `v_doctor_dashboard_kpis` - View não existe (404)
3. ❌ `v_next_appointments` - View existe mas com colunas incorretas (400)

## Solução

Execute o script SQL `CRIAR_VIEWS_E_FUNCOES_FALTANTES.sql` no Supabase SQL Editor.

## Passos para Execução

### 1. Acessar o Supabase SQL Editor

1. Acesse o [Supabase Dashboard](https://app.supabase.com)
2. Selecione seu projeto
3. No menu lateral, clique em **SQL Editor**

### 2. Executar o Script

1. Clique em **New Query**
2. Cole o conteúdo completo do arquivo `CRIAR_VIEWS_E_FUNCOES_FALTANTES.sql`
3. Clique em **Run** (ou pressione `Ctrl+Enter`)

### 3. Verificar a Execução

O script inclui verificações automáticas no final. Você deve ver:

- ✅ Função RPC criada: `get_unread_notifications_count`
- ✅ Views criadas: `v_doctor_dashboard_kpis` e `v_next_appointments`
- ✅ Resultados de teste das views

## O que o Script Faz

### 1. Função RPC `get_unread_notifications_count`
- Recebe um UUID de usuário
- Retorna o número de notificações não lidas desse usuário
- Usa `SECURITY DEFINER` para garantir acesso adequado

### 2. View `v_doctor_dashboard_kpis`
- Agrega KPIs do dashboard do médico:
  - `total_today`: Total de agendamentos hoje
  - `confirmed_today`: Agendamentos confirmados hoje
  - `waiting_room_today`: Pacientes na sala de espera
  - `completed_today`: Agendamentos completados hoje
  - `next_24h`: Próximos 24 horas
  - `upcoming`: Próximos agendamentos futuros
  - `unread_messages`: Mensagens não lidas

### 3. View `v_next_appointments` (Corrigida)
- Lista próximos agendamentos
- Usa `appt_at` ao invés de `appointment_date` (como esperado pelo código)
- Usa `status_norm` ao invés de `status` (normalizado)
- Inclui informações do paciente e profissional

## Após a Execução

Após executar o script com sucesso:

1. ✅ Os erros 404 e 400 devem desaparecer
2. ✅ O dashboard deve carregar os KPIs corretamente
3. ✅ Os agendamentos devem aparecer na lista
4. ✅ O contador de notificações não lidas deve funcionar

## Troubleshooting

### Erro: "function already exists"
- O script usa `CREATE OR REPLACE`, então isso não deve acontecer
- Se acontecer, execute `DROP FUNCTION IF EXISTS get_unread_notifications_count(UUID);` antes

### Erro: "view already exists"
- O script usa `DROP VIEW IF EXISTS ... CASCADE`, então isso não deve acontecer
- Se acontecer, o script já remove a view antiga antes de criar a nova

### Erro: "column does not exist"
- Verifique se a tabela `appointments` tem as colunas esperadas
- Verifique se a tabela `notifications` tem a coluna `is_read`
- Verifique se a tabela `chat_messages` existe

### Views retornam dados vazios
- Isso é normal se não houver dados nas tabelas base
- As views funcionarão corretamente quando houver dados

## Notas Importantes

- ⚠️ O script usa `SECURITY DEFINER` na função RPC para garantir acesso adequado
- ⚠️ As views herdam as políticas RLS das tabelas base
- ⚠️ Se você modificou a estrutura das tabelas, pode precisar ajustar o script

## Próximos Passos

Após executar o script:

1. Recarregue a página do dashboard
2. Verifique se os erros desapareceram do console
3. Verifique se os KPIs estão sendo exibidos corretamente
4. Teste a funcionalidade de agendamentos

