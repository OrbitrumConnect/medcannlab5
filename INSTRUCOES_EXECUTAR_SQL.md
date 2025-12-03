# 📋 INSTRUÇÕES: Como Executar o Script SQL no Supabase

## ⚠️ IMPORTANTE

O erro que você está vendo é porque as políticas RLS (Row Level Security) do Supabase estão bloqueando a criação de salas de chat. **Você PRECISA executar o script SQL no Supabase para corrigir isso.**

## 🚀 PASSO A PASSO

### 1. Acesse o Supabase Dashboard
- Vá para: https://supabase.com/dashboard
- Faça login na sua conta
- Selecione o projeto **medcanlab3.0** (ou o nome do seu projeto)

### 2. Abra o SQL Editor
- No menu lateral esquerdo, clique em **"SQL Editor"**
- Ou acesse diretamente: https://supabase.com/dashboard/project/[SEU_PROJECT_ID]/sql/new

### 3. Execute o Script
- Abra o arquivo `CORRIGIR_RLS_CHAT_SIMPLES.sql` que está na raiz do projeto
- **COPIE TODO O CONTEÚDO** do arquivo
- **COLE no SQL Editor** do Supabase
- Clique no botão **"Run"** ou pressione `Ctrl+Enter` (Windows) / `Cmd+Enter` (Mac)

### 4. Verifique se Funcionou
- Você deve ver mensagens de sucesso no console
- Deve aparecer uma tabela mostrando as políticas criadas
- Se houver erros, leia as mensagens de erro

### 5. Teste no App
- **Recarregue a página** do chat no navegador (F5 ou Ctrl+R)
- Tente criar uma sala clicando em "Maria Souza" novamente
- **Deve funcionar agora!**

## 🔍 SE AINDA NÃO FUNCIONAR

### Verificar se o Script Foi Executado
Execute esta query no SQL Editor para ver as políticas atuais:

```sql
SELECT 
    tablename,
    policyname,
    cmd
FROM pg_policies 
WHERE tablename IN ('chat_rooms', 'chat_participants')
ORDER BY tablename, policyname;
```

Você deve ver políticas com nomes como:
- `chat_rooms_select_simple`
- `chat_rooms_insert_simple`
- `chat_participants_select_simple`
- `chat_participants_insert_simple`

### Verificar Tipo do Usuário
Execute esta query para verificar seu tipo de usuário:

```sql
SELECT 
    email,
    raw_user_meta_data->>'type' as tipo,
    id
FROM auth.users 
WHERE email = 'seu-email@exemplo.com';
```

Se o tipo não estiver correto, execute:

```sql
UPDATE auth.users 
SET raw_user_meta_data = jsonb_set(
    COALESCE(raw_user_meta_data, '{}'::jsonb),
    '{type}', 
    '"profissional"'::jsonb
)
WHERE email = 'seu-email@exemplo.com';
```

## 📞 PRECISA DE AJUDA?

Se ainda não funcionar após executar o script:
1. Tire um print da tela do SQL Editor mostrando os erros (se houver)
2. Tire um print da tabela de políticas (resultado da query de verificação)
3. Envie essas imagens para que eu possa ajudar melhor

