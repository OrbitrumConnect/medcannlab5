# ✅ Checklist de Finalização do App - 100%

**Objetivo**: Completar apenas o que já existe, sem inventar nada novo

---

## 🎯 PRIORIDADE 1: Tabelas Faltantes no Banco de Dados

### 1.1 Tabela `educational_resources` ❌

**Status**: Referenciada no código mas não existe no banco  
**Arquivo que usa**: `src/pages/PatientDashboard.tsx`  
**Impacto**: Erro 404 no console (já tratado, mas ideal criar a tabela)

**O que fazer**:
```sql
-- Criar tabela educational_resources
CREATE TABLE IF NOT EXISTS educational_resources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  summary TEXT,
  description TEXT,
  category VARCHAR(100),
  resource_type VARCHAR(50), -- 'video', 'article', 'document', 'webinar', 'audio', 'other'
  url TEXT,
  published_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  audience TEXT,
  status VARCHAR(50) DEFAULT 'published', -- 'published', 'draft', 'archived'
  allowed_roles TEXT[],
  role_permissions JSONB,
  allowed_axes TEXT[],
  axis_permissions JSONB,
  visibility_scope VARCHAR(50) DEFAULT 'public', -- 'public', 'private', 'admin-only', 'professional-only'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Habilitar RLS
ALTER TABLE educational_resources ENABLE ROW LEVEL SECURITY;

-- Política básica: todos podem ver recursos publicados
CREATE POLICY "Anyone can view published educational resources" 
ON educational_resources FOR SELECT 
USING (status = 'published' AND visibility_scope = 'public');
```

**Tempo estimado**: 5 minutos

---

## 🎯 PRIORIDADE 2: Funcionalidades com TODO no Código

### 2.1 Calcular Progresso por Módulo ❌

**Arquivo**: `src/pages/AlunoDashboard.tsx` (linha 423)  
**Status**: TODO comentado no código

**Código atual**:
```typescript
progress: 0, // TODO: Calcular progresso por módulo
```

**O que fazer**:
- Implementar cálculo de progresso baseado em:
  - Lições completadas vs total de lições
  - Módulos completados vs total de módulos
  - Avaliações realizadas

**Tempo estimado**: 30 minutos

### 2.2 Adicionar Lições ❌

**Arquivo**: `src/pages/AlunoDashboard.tsx` (linha 426)  
**Status**: TODO comentado no código

**Código atual**:
```typescript
lessons: [] // TODO: Adicionar lições
```

**O que fazer**:
- Buscar lições da tabela `course_modules` ou `lessons` (se existir)
- Ou criar estrutura de lições se não existir

**Tempo estimado**: 20 minutos

### 2.3 Calcular Estatísticas Mensais ❌

**Arquivo**: `src/pages/ProfessionalScheduling.tsx` (linha 196)  
**Status**: TODO comentado no código

**Código atual**:
```typescript
monthlyStats: [], // TODO: Calcular estatísticas mensais
specialtyStats: [], // TODO: Calcular estatísticas por especialidade
timeSlotStats: [] // TODO: Calcular estatísticas por horário
```

**O que fazer**:
- Buscar dados de agendamentos da tabela `appointments` ou `schedules`
- Agrupar por mês, especialidade e horário
- Calcular estatísticas (total, confirmados, cancelados, etc.)

**Tempo estimado**: 45 minutos

---

## 🎯 PRIORIDADE 3: Tabelas Referenciadas mas Não Criadas

### 3.1 Verificar/Criar Tabelas do Fórum ⚠️

**Tabelas referenciadas**:
- `forum_posts` ✅ (existe, já corrigido query de `user_id` para `author_id`)
- `forum_comments` ⚠️ (usada em `ForumCasosClinicos.tsx` linha 180)
- `forum_likes` ⚠️ (usada em `ForumCasosClinicos.tsx` linha 184)
- `forum_views` ⚠️ (usada em `ForumCasosClinicos.tsx` linha 188)

**Arquivos que usam**:
- `src/pages/ForumCasosClinicos.tsx` (linhas 179-189)
- `src/pages/DebateRoom.tsx`

**Estrutura esperada** (baseado no código):
```sql
-- Tabela forum_comments
CREATE TABLE IF NOT EXISTS forum_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES forum_posts(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES users(id),
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela forum_likes
CREATE TABLE IF NOT EXISTS forum_likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES forum_posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(post_id, user_id)
);

-- Tabela forum_views
CREATE TABLE IF NOT EXISTS forum_views (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES forum_posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id),
  viewed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(post_id, user_id)
);
```

**O que fazer**:
1. Verificar se as tabelas existem no Supabase
2. Se não existirem, criar conforme estrutura acima
3. Habilitar RLS e criar políticas básicas

**Tempo estimado**: 20 minutos

---

## 🎯 PRIORIDADE 4: Tratamento de Erros Melhorado

### 4.1 Suprimir Erro 404 do Console ⚠️

**Status**: Erro tratado no código, mas ainda aparece no console do navegador  
**Causa**: Supabase loga antes do nosso código tratar

**O que fazer**:
- Adicionar interceptor de requisições para suprimir erros 404 esperados
- Ou aceitar que o erro aparece no console (comportamento do Supabase)

**Tempo estimado**: 10 minutos (opcional)

---

## 🎯 PRIORIDADE 5: Validações e Testes

### 5.1 Testar Todas as Rotas Protegidas ✅

**Status**: Parece estar funcionando, mas validar:
- [ ] Admin pode acessar todas as rotas
- [ ] Profissional acessa apenas rotas permitidas
- [ ] Paciente acessa apenas rotas permitidas
- [ ] Aluno acessa apenas rotas permitidas

**Tempo estimado**: 30 minutos

### 5.2 Validar Queries do Supabase ✅

**Status**: Verificar se todas as queries estão corretas:
- [ ] Todas usam nomes de colunas corretos
- [ ] Todas têm tratamento de erro
- [ ] Todas respeitam RLS

**Tempo estimado**: 20 minutos

---

## 📋 Checklist Completo

### Banco de Dados
- [ ] Criar tabela `educational_resources`
- [ ] Verificar e criar tabelas do fórum (`forum_comments`, `forum_likes`, `forum_views`)
- [ ] Validar que todas as tabelas referenciadas existem

### Funcionalidades
- [ ] Implementar cálculo de progresso por módulo (AlunoDashboard)
- [ ] Adicionar busca de lições (AlunoDashboard)
- [ ] Implementar estatísticas mensais (ProfessionalScheduling)
- [ ] Implementar estatísticas por especialidade (ProfessionalScheduling)
- [ ] Implementar estatísticas por horário (ProfessionalScheduling)

### Validações
- [ ] Testar todas as rotas protegidas
- [ ] Validar todas as queries do Supabase
- [ ] Verificar tratamento de erros em todas as chamadas

### Otimizações (Opcional)
- [ ] Suprimir erros 404 esperados no console
- [ ] Adicionar loading states onde faltam
- [ ] Melhorar mensagens de erro para o usuário

---

## ⏱️ Tempo Total Estimado

- **Prioridade 1**: 5 minutos
- **Prioridade 2**: 95 minutos (1h35min)
- **Prioridade 3**: 15 minutos
- **Prioridade 4**: 10 minutos (opcional)
- **Prioridade 5**: 50 minutos

**Total**: ~2h45min para finalizar 100%

---

## 🚀 Ordem de Execução Recomendada

1. **Primeiro** (5 min): Criar tabela `educational_resources`
2. **Segundo** (15 min): Verificar/criar tabelas do fórum
3. **Terceiro** (95 min): Implementar TODOs do código
4. **Quarto** (50 min): Validar e testar tudo
5. **Quinto** (10 min - opcional): Otimizações finais

---

## 📝 Notas Importantes

### O que NÃO fazer:
- ❌ Não criar novas funcionalidades
- ❌ Não adicionar features que não existem no código
- ❌ Não modificar funcionalidades existentes que já funcionam

### O que fazer:
- ✅ Completar apenas o que está marcado como TODO
- ✅ Criar apenas tabelas que são referenciadas no código
- ✅ Corrigir apenas bugs conhecidos
- ✅ Validar o que já existe

---

**Status Atual**: ~85% completo  
**Após finalização**: 100% completo

