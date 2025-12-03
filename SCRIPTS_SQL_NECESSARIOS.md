# 📋 SCRIPTS SQL NECESSÁRIOS PARA FUNCIONALIDADES FUNCIONAREM

## 🎯 RESUMO

Muitas funcionalidades **precisam de scripts SQL no Supabase** para funcionar completamente. Esta lista mostra **exatamente o que precisa ser executado**.

---

## ✅ **SCRIPTS JÁ CRIADOS (PRECISAM SER EXECUTADOS)**

### 1. **Chat Clínico - Criar Salas** ⚠️ **URGENTE**
- **Arquivo:** `CRIAR_FUNCAO_RPC_APENAS.sql`
- **O que faz:** Cria função RPC que contorna RLS para criar salas de chat
- **Status:** Script criado, **AGUARDANDO EXECUÇÃO**
- **Impacto:** Sem isso, profissionais não conseguem criar salas para pacientes

**Como executar:**
1. Abra Supabase Dashboard → SQL Editor
2. Copie conteúdo de `CRIAR_FUNCAO_RPC_APENAS.sql`
3. Cole e execute
4. Teste criando uma sala de chat

---

### 2. **Views e Funções RPC Faltantes**
- **Arquivo:** `CRIAR_VIEWS_E_FUNCOES_FALTANTES.sql` ou `CRIAR_VIEWS_CORRIGIDO.sql`
- **O que faz:** Cria views e funções RPC necessárias para dashboards e notificações
- **Status:** Script criado, **AGUARDANDO EXECUÇÃO**
- **Impacto:** KPIs podem não funcionar, notificações podem falhar

**Views criadas:**
- `v_doctor_dashboard_kpis` - KPIs do dashboard profissional
- `v_next_appointments` - Próximos agendamentos
- `v_chat_inbox` - Inbox de chat

**Funções RPC criadas:**
- `get_unread_notifications_count()` - Contagem de notificações não lidas
- `get_chat_inbox()` - Lista de salas de chat do usuário
- `get_chat_user_profiles()` - Perfis dos participantes do chat

---

### 3. **RLS para Chat Rooms e Participants**
- **Arquivo:** `CORRIGIR_RLS_CHAT_SIMPLES.sql`
- **O que faz:** Cria políticas RLS permissivas para chat
- **Status:** Script criado, **JÁ EXECUTADO** (políticas existem)
- **Nota:** Se ainda há erro, executar `CRIAR_FUNCAO_RPC_APENAS.sql` resolve

---

### 4. **Tabela de Conteúdo de Aulas**
- **Arquivo:** `CRIAR_TABELA_LESSON_CONTENT.sql`
- **O que faz:** Cria tabela para editar conteúdo de aulas
- **Status:** Script criado, **AGUARDANDO EXECUÇÃO**
- **Impacto:** Edição de aulas pode não salvar no banco

---

### 5. **RLS para Documents**
- **Arquivo:** `LIMPAR_POLITICAS_DOCUMENTS.sql`
- **O que faz:** Limpa e padroniza políticas RLS da tabela `documents`
- **Status:** Script criado, **AGUARDANDO EXECUÇÃO**
- **Impacto:** Upload de documentos pode falhar com erro 403

---

### 6. **RLS para Clinical Assessments**
- **Arquivo:** `CORRIGIR_RLS_CLINICAL_ASSESSMENTS.sql`
- **O que faz:** Corrige políticas RLS para profissionais criarem avaliações
- **Status:** Script criado, **AGUARDANDO EXECUÇÃO**
- **Impacto:** Profissionais podem não conseguir salvar avaliações

---

## ❌ **SCRIPTS QUE PRECISAM SER CRIADOS**

### 1. **Tabelas para Gamificação**
**O que precisa:**
```sql
-- Tabela de pontos dos usuários
CREATE TABLE user_points (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  points INTEGER DEFAULT 0,
  level INTEGER DEFAULT 1,
  total_points INTEGER DEFAULT 0,
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Tabela de conquistas
CREATE TABLE achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  points INTEGER,
  category TEXT,
  rarity TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Tabela de conquistas desbloqueadas
CREATE TABLE user_achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  achievement_id UUID REFERENCES achievements(id),
  unlocked_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, achievement_id)
);
```

---

### 2. **Tabelas para Financeiro**
**O que precisa:**
```sql
-- Tabela de transações
CREATE TABLE transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  doctor_id UUID REFERENCES auth.users(id),
  type TEXT, -- 'consultation', 'fee', 'subscription'
  amount DECIMAL(10,2),
  description TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Tabela de planos de assinatura
CREATE TABLE subscription_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  monthly_price DECIMAL(10,2),
  consultation_discount INTEGER,
  features JSONB,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Tabela de assinaturas de usuários
CREATE TABLE user_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  plan_id UUID REFERENCES subscription_plans(id),
  status TEXT DEFAULT 'active', -- 'active', 'cancelled', 'expired'
  started_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);
```

---

### 3. **Tabelas para Pesquisa**
**O que precisa:**
```sql
-- Tabela de estudos de pesquisa
CREATE TABLE research_studies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  status TEXT, -- 'Em Andamento', 'Análise', 'Concluído'
  progress INTEGER DEFAULT 0,
  start_date DATE,
  end_date DATE,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Tabela de participantes de estudos
CREATE TABLE study_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  study_id UUID REFERENCES research_studies(id),
  user_id UUID REFERENCES auth.users(id),
  joined_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(study_id, user_id)
);
```

---

## 📋 **CHECKLIST DE EXECUÇÃO**

### **URGENTE (Bloqueiam funcionalidades principais):**
- [ ] Executar `CRIAR_FUNCAO_RPC_APENAS.sql` - **Chat Clínico**
- [ ] Executar `CRIAR_VIEWS_E_FUNCOES_FALTANTES.sql` - **KPIs e Notificações**
- [ ] Executar `LIMPAR_POLITICAS_DOCUMENTS.sql` - **Upload de Documentos**
- [ ] Executar `CORRIGIR_RLS_CLINICAL_ASSESSMENTS.sql` - **Avaliações Clínicas**

### **IMPORTANTE (Melhoram funcionalidades):**
- [ ] Executar `CRIAR_TABELA_LESSON_CONTENT.sql` - **Edição de Aulas**
- [ ] Criar tabelas para Gamificação (script acima)
- [ ] Criar tabelas para Financeiro (script acima)

### **DESEJÁVEL (Adicionam novas funcionalidades):**
- [ ] Criar tabelas para Pesquisa (script acima)
- [ ] Configurar servidor WebRTC para videochamadas
- [ ] Integrar gateway de pagamento

---

## 🎯 **ORDEM RECOMENDADA DE EXECUÇÃO**

1. **PRIMEIRO:** `CRIAR_FUNCAO_RPC_APENAS.sql` (resolve chat clínico)
2. **SEGUNDO:** `CRIAR_VIEWS_E_FUNCOES_FALTANTES.sql` (resolve KPIs)
3. **TERCEIRO:** `LIMPAR_POLITICAS_DOCUMENTS.sql` (resolve upload)
4. **QUARTO:** `CORRIGIR_RLS_CLINICAL_ASSESSMENTS.sql` (resolve avaliações)
5. **DEPOIS:** Criar tabelas para funcionalidades novas (gamificação, financeiro, pesquisa)

---

## 💡 **COMO VERIFICAR SE FUNCIONOU**

Após executar cada script:

1. **Chat Clínico:**
   - Tentar criar sala clicando em um paciente
   - Deve funcionar sem erro de RLS

2. **KPIs:**
   - Acessar dashboard profissional
   - KPIs devem aparecer (não zero)

3. **Upload de Documentos:**
   - Tentar fazer upload
   - Não deve dar erro 403

4. **Avaliações:**
   - Profissional tentar salvar avaliação
   - Deve funcionar sem erro de RLS

