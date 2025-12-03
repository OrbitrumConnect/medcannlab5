# 🔧 Guia para Corrigir Upload de Documentos (Erro 403)

## Problema Identificado

O erro `403` ao fazer upload de documentos indica que as políticas RLS (Row Level Security) da tabela `documents` não estão configuradas corretamente para permitir que usuários autenticados insiram documentos.

## Solução

Execute o script SQL `FIX_RLS_DOCUMENTS_TABLE.sql` no Supabase SQL Editor para corrigir as políticas de segurança.

### Passos:

1. **Acesse o Supabase Dashboard**
   - Vá para: https://app.supabase.com
   - Selecione seu projeto

2. **Abra o SQL Editor**
   - No menu lateral, clique em "SQL Editor"
   - Clique em "New query"

3. **Execute o Script**
   - Abra o arquivo `FIX_RLS_DOCUMENTS_TABLE.sql` que foi criado na raiz do projeto
   - Copie todo o conteúdo do arquivo
   - Cole no SQL Editor do Supabase
   - Clique em "Run" ou pressione `Ctrl+Enter` (Windows) / `Cmd+Enter` (Mac)

4. **Verificar Execução**
   - O script deve executar sem erros
   - Você verá uma mensagem de sucesso
   - Uma tabela será exibida mostrando as políticas criadas

### O que o Script Faz:

✅ Habilita RLS na tabela `documents`  
✅ Cria políticas para SELECT (visualizar documentos)  
✅ Cria políticas para INSERT (inserir documentos)  
✅ Cria políticas para UPDATE (atualizar documentos)  
✅ Cria políticas para DELETE (deletar documentos)  
✅ Adiciona colunas faltantes na tabela `documents`  
✅ Cria índices para melhorar performance  

### Após Executar o Script:

1. **Teste o Upload Novamente**
   - Tente fazer upload de um documento pela interface
   - O erro 403 não deve mais aparecer
   - O documento deve ser salvo corretamente

2. **Verificar no Console**
   - Abra o console do navegador (F12)
   - Procure por mensagens de sucesso:
     - `✅ Documento salvo no banco:`
     - `✅ Metadata salva!`
     - `✅ Lista de documentos atualizada após upload`

### Se Ainda Houver Problemas:

1. **Verificar Autenticação**
   - Certifique-se de que está logado na plataforma
   - Tente fazer logout e login novamente

2. **Verificar Políticas**
   - No Supabase Dashboard, vá em "Authentication" > "Policies"
   - Verifique se as políticas da tabela `documents` estão listadas

3. **Verificar Logs**
   - No Supabase Dashboard, vá em "Logs" > "Postgres Logs"
   - Procure por erros relacionados à tabela `documents`

4. **Contatar Suporte**
   - Se o problema persistir, compartilhe:
     - Mensagem de erro completa do console
     - Screenshot das políticas RLS no Supabase
     - Logs do Supabase relacionados ao erro

## Arquivos Modificados

- ✅ `src/pages/Library.tsx` - Adicionada verificação de autenticação e melhor tratamento de erros
- ✅ `src/components/NoaConversationalInterface.tsx` - Adicionada verificação de autenticação e melhor tratamento de erros
- ✅ `src/contexts/NoaPlatformContext.tsx` - Corrigido erro `.catch is not a function`
- ✅ `FIX_RLS_DOCUMENTS_TABLE.sql` - Script SQL para corrigir políticas RLS

## Status

🟡 **Aguardando execução do script SQL no Supabase**

Após executar o script, o upload de documentos deve funcionar corretamente.

