# 📋 INSTRUÇÕES: Executar Script SQL para IA Residente

## ⚠️ IMPORTANTE: Erro Comum

Se você recebeu o erro:
```
Error: Failed to run sql query: ERROR: 42601: syntax error at or near "{" LINE 1: import { supabase } from './supabase'
```

**Isso significa que você tentou executar um arquivo TypeScript/JavaScript no SQL Editor.**

## ✅ SOLUÇÃO

1. **Abra o Supabase Dashboard**
2. **Vá para SQL Editor**
3. **Abra o arquivo:** `CRIAR_TABELAS_IA_RESIDENTE_COMPLETO.sql`
4. **Copie TODO o conteúdo do arquivo**
5. **Cole no SQL Editor do Supabase**
6. **Clique em "Run" ou pressione Ctrl+Enter**

## 📝 O que o script faz

O script `CRIAR_TABELAS_IA_RESIDENTE_COMPLETO.sql` cria:

1. ✅ **`patient_medical_records`** - Prontuário eletrônico completo
2. ✅ **`user_activity_logs`** - Log de atividades dos usuários
3. ✅ **`user_statistics`** - Estatísticas agregadas (cache)
4. ✅ **`ai_saved_documents`** - Documentos salvos pela IA
5. ✅ **`patient_insights`** - Insights gerados para pacientes
6. ✅ **`ai_chat_interactions`** - Histórico completo de chat
7. ✅ **Funções RPC** para acessar dados administrativos
8. ✅ **Políticas RLS** para segurança

## 🎯 Após executar o script

A IA Residente poderá:
- ✅ Salvar conversas no prontuário do paciente
- ✅ Acessar dados administrativos reais (estatísticas, atividades)
- ✅ Salvar documentos gerados
- ✅ Gerar insights úteis para o paciente
- ✅ Registrar atividades dos usuários em tempo real

## 🔍 Verificar se funcionou

Após executar, verifique no Supabase:
1. Vá em **Table Editor**
2. Você deve ver as novas tabelas listadas
3. Teste inserindo um registro manualmente para verificar RLS

