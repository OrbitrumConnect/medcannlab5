# 📘 Guia de Execução - Setup Completo Supabase

## 🎯 Objetivo

Este guia explica como executar o script SQL completo para configurar TODAS as funcionalidades da plataforma MedCannLab 3.0 no Supabase.

## 📋 Pré-requisitos

- Acesso ao Supabase Dashboard
- Permissões de administrador no projeto
- Conexão estável com a internet

## 🚀 Passo a Passo

### 1. Acessar o Supabase Dashboard

1. Acesse: https://app.supabase.com
2. Faça login na sua conta
3. Selecione o projeto **MedCannLab**

### 2. Abrir o SQL Editor

1. No menu lateral esquerdo, clique em **SQL Editor**
2. Clique no botão **New query** (ou use o atalho `Ctrl+N`)

### 3. Executar o Script

1. Abra o arquivo `SUPABASE_SETUP_COMPLETO_PLATAFORMA.sql` (na raiz do projeto)
2. **Copie TODO o conteúdo** do arquivo
3. **Cole no SQL Editor** do Supabase
4. Clique no botão **Run** (ou pressione `Ctrl+Enter`)

### 4. Aguardar Execução

- O script pode levar alguns minutos para executar completamente
- Você verá mensagens de sucesso para cada seção
- No final, verá uma tabela com o resumo:
  - Total de tabelas criadas
  - Total de políticas RLS criadas
  - Total de índices criados

### 5. Verificar Resultado

Após a execução, você deve ver:

```
✅ Tabelas criadas: 22
✅ Políticas RLS criadas: [número]
✅ Índices criados: [número]
```

## 📊 O que o Script Cria

### Tabelas Principais (22 tabelas)

1. ✅ `profiles` - Perfis de usuários
2. ✅ `documents` - Biblioteca de documentos
3. ✅ `imre_assessments` - Avaliações IMRE Triaxial
4. ✅ `clinical_assessments` - Avaliações clínicas
5. ✅ `clinical_reports` - Relatórios clínicos
6. ✅ `appointments` - Agendamentos
7. ✅ `notifications` - Notificações
8. ✅ `chat_messages` - Mensagens do chat
9. ✅ `forum_posts` - Posts do fórum
10. ✅ `forum_comments` - Comentários do fórum
11. ✅ `forum_likes` - Likes do fórum
12. ✅ `forum_views` - Visualizações do fórum
13. ✅ `course_modules` - Módulos de cursos
14. ✅ `courses` - Cursos
15. ✅ `course_enrollments` - Inscrições em cursos
16. ✅ `transactions` - Transações financeiras
17. ✅ `user_profiles` - Perfis com gamificação
18. ✅ `patient_prescriptions` - Prescrições
19. ✅ `moderator_requests` - Solicitações de moderação
20. ✅ `user_mutes` - Usuários silenciados
21. ✅ `user_interactions` - Interações dos usuários
22. ✅ `semantic_analysis` - Análise semântica

### Políticas RLS

- ✅ Políticas de acesso baseadas em tipo de usuário
- ✅ Profissionais podem ver seus pacientes
- ✅ Pacientes podem ver apenas seus dados
- ✅ Admin tem acesso completo
- ✅ Usuários autenticados podem inserir/atualizar seus próprios dados

### Índices

- ✅ Índices para performance em todas as tabelas principais
- ✅ Índices GIN para campos JSONB
- ✅ Índices para campos de busca frequente

### Funções Auxiliares

- ✅ `count_preserved_narratives()` - Conta narrativas preservadas
- ✅ `count_multirational_analyses()` - Conta análises multirracionais
- ✅ `count_primary_data_blocks()` - Conta blocos de dados primários
- ✅ `count_identified_correlations()` - Conta correlações identificadas

### Views

- ✅ `v_kpi_basic` - KPIs básicos do dashboard
- ✅ `v_next_appointments` - Próximos agendamentos

## ⚠️ Possíveis Erros e Soluções

### Erro: "relation already exists"

**Solução**: O script usa `CREATE TABLE IF NOT EXISTS`, então isso não deve acontecer. Se acontecer, significa que a tabela já existe e está tudo bem.

### Erro: "permission denied"

**Solução**: Verifique se você tem permissões de administrador no projeto Supabase.

### Erro: "syntax error"

**Solução**: Certifique-se de copiar TODO o conteúdo do arquivo, sem cortes ou modificações.

### Erro: "policy already exists"

**Solução**: O script usa `DROP POLICY IF EXISTS` antes de criar, então isso não deve acontecer. Se acontecer, execute apenas a parte de políticas RLS novamente.

## ✅ Verificação Pós-Execução

Após executar o script, teste as seguintes funcionalidades:

1. **Upload de Documentos**
   - Tente fazer upload de um documento
   - Deve funcionar sem erro 403

2. **Criar Perfil**
   - Faça login na plataforma
   - Verifique se o perfil é criado automaticamente

3. **Criar Agendamento**
   - Tente criar um agendamento
   - Deve funcionar corretamente

4. **Acessar Dashboard**
   - Verifique se os KPIs aparecem
   - Deve mostrar dados (mesmo que zero)

5. **Fórum**
   - Tente criar um post no fórum
   - Deve funcionar sem erros

## 📝 Notas Importantes

- ⚠️ **Não execute o script múltiplas vezes** - ele é idempotente, mas pode gerar mensagens de erro desnecessárias
- ⚠️ **Faça backup** antes de executar se você já tem dados importantes
- ✅ O script é **seguro** - usa `IF NOT EXISTS` e `DROP IF EXISTS` para evitar conflitos
- ✅ Todas as políticas RLS estão configuradas para segurança adequada

## 🆘 Suporte

Se encontrar problemas:

1. Verifique os logs no Supabase Dashboard → Logs → Postgres Logs
2. Verifique se todas as tabelas foram criadas: `SELECT * FROM pg_tables WHERE schemaname = 'public'`
3. Verifique se as políticas RLS estão ativas: `SELECT * FROM pg_policies WHERE schemaname = 'public'`

## 🎉 Próximos Passos

Após executar o script com sucesso:

1. ✅ Teste todas as funcionalidades da plataforma
2. ✅ Configure dados iniciais (cursos, módulos, etc.)
3. ✅ Crie usuários de teste
4. ✅ Verifique se os dashboards estão funcionando

---

**Status**: ✅ Script pronto para execução  
**Tempo estimado**: 2-5 minutos  
**Impacto**: Configura todas as funcionalidades da plataforma

