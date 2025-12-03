# 🔐 Verificação de Credenciais e Segurança - Modo Dev Vivo

## ⚠️ Questões Críticas de Segurança

### 1. **Credenciais Supabase e Configuração**

#### ✅ O que está implementado:
- Estrutura de tabelas com RLS (Row Level Security)
- Funções RPC com `SECURITY DEFINER` para controle de acesso
- Validação de `flag_admin` em todas as operações

#### ⚠️ O que precisa ser verificado:

**A. Credenciais Supabase no Backend**
```typescript
// Verificar se existe arquivo de configuração
// src/lib/supabase.ts ou .env

// Deve conter:
SUPABASE_URL=your-project-url
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key (apenas para admin)
```

**B. Configuração do Assistant**
```typescript
// Verificar se o assistant tem acesso às credenciais
// Isso deve ser configurado no ambiente de deployment
// NÃO deve estar hardcoded no código
```

**Checklist de Verificação:**
- [ ] Variáveis de ambiente configuradas
- [ ] Service Role Key protegido (apenas admin)
- [ ] Anon Key usado no frontend
- [ ] Credenciais não commitadas no Git
- [ ] Rotação de chaves implementada

---

### 2. **Permissões, Autenticação e Context-Switch**

#### ✅ O que está implementado:
- Tabela `dev_vivo_sessions` com validação de usuário
- Função `create_dev_vivo_session()` valida `flag_admin`
- RLS policies restringem acesso apenas a admins
- Sessões com expiração automática

#### ⚠️ O que precisa ser verificado:

**A. Autenticação do Usuário**
```sql
-- Verificar se usuário tem flag_admin
SELECT id, name, email, type, flag_admin
FROM users
WHERE id = auth.uid()
  AND type = 'admin'
  AND flag_admin = true;
```

**B. Context-Switch (Mudança de Contexto)**
```typescript
// Verificar se o assistant mantém contexto do usuário
// Cada requisição deve incluir:
interface DevVivoRequest {
  sessionId: string
  userId: string
  supabaseToken: string
  // ... outros dados
}
```

**C. Controle de Acesso (RLS)**
```sql
-- Verificar políticas RLS ativas
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies
WHERE tablename LIKE 'dev_vivo%';
```

**Checklist de Verificação:**
- [ ] RLS habilitado em todas as tabelas dev_vivo_*
- [ ] Políticas restringem acesso apenas ao próprio usuário admin
- [ ] Sessões expiram automaticamente
- [ ] Tokens são validados em cada requisição
- [ ] Context-switch preserva identidade do usuário

---

### 3. **Integração Frontend/Backend**

#### ✅ O que está implementado:
- Tipos TypeScript definidos
- Estrutura de API endpoints planejada
- Componente de painel planejado

#### ⚠️ O que precisa ser verificado:

**A. Backend Rodando**
```bash
# Verificar se há serviço backend rodando
# Pode ser:
# - API Routes do Next.js
# - Servidor Node.js separado
# - Edge Functions do Supabase
```

**B. Redirecionamento de Requisições**
```typescript
// Verificar se requisições do chat são redirecionadas
// Exemplo de fluxo:
Chat UI → API Route → OpenAI → Supabase
```

**C. Ambiente de Execução**
```typescript
// Verificar variáveis de ambiente
process.env.OPENAI_API_KEY
process.env.SUPABASE_URL
process.env.SUPABASE_SERVICE_ROLE_KEY
```

**Checklist de Verificação:**
- [ ] Backend configurado e rodando
- [ ] API endpoints acessíveis
- [ ] Requisições do chat redirecionadas corretamente
- [ ] Ambiente de produção configurado
- [ ] Logs de requisições funcionando

---

## 🛡️ Segurança e LGPD

### 1. **Políticas LGPD Implementadas**

#### ✅ O que está implementado:
- Tabela `dev_vivo_audit` para auditoria
- Assinaturas digitais (SHA-256) em todas as mudanças
- Logs de todas as ações (create, read, update, delete)
- RLS restringindo acesso

#### ⚠️ O que precisa ser verificado:

**A. Consentimento e Finalidade**
```typescript
// Verificar se há consentimento explícito
interface LGPDCompliance {
  consentimento: boolean
  finalidade: string
  baseLegal: string
  retencao: number // dias
  compartilhamento: boolean
}
```

**B. Pseudonimização**
```sql
-- Verificar se dados pessoais são pseudonimizados
-- Em dev_vivo_audit, user_id pode ser pseudonimizado
```

**C. Direitos do Titular**
```typescript
// Implementar endpoints para:
// - Acesso aos dados
// - Correção
// - Exclusão
// - Portabilidade
```

**Checklist de Verificação:**
- [ ] Consentimento explícito obtido
- [ ] Finalidade documentada
- [ ] Base legal identificada
- [ ] Retenção de dados definida
- [ ] Direitos do titular implementados
- [ ] Pseudonimização quando aplicável

---

### 2. **Validação de Integridade**

#### ✅ O que está implementado:
- Função `generate_change_signature()` para assinaturas
- Hash SHA-256 de conteúdo + userId + timestamp
- Verificação de assinatura antes de aplicar mudanças

#### ⚠️ O que precisa ser verificado:

**A. Validação de Código**
```typescript
// Verificar se código não contém:
// - eval()
// - Function constructor
// - Imports perigosos
// - Acesso a sistema de arquivos
```

**B. Arquivos Protegidos**
```typescript
const PROTECTED_FILES = [
  'src/lib/supabase.ts',
  '.env',
  'package.json',
  'vite.config.ts',
  // ... outros
]
```

**Checklist de Verificação:**
- [ ] Validação de código implementada
- [ ] Arquivos protegidos listados
- [ ] Bloqueio de operações perigosas
- [ ] Verificação de assinatura antes de aplicar
- [ ] Rollback automático em caso de erro

---

## 📊 Dashboards e Monitoramento

### 1. **Power BI / Supabase**

#### ⚠️ O que precisa ser verificado:

**A. Conexão Supabase → Power BI**
```sql
-- Verificar se há views criadas para Power BI
CREATE VIEW dev_vivo_metrics AS
SELECT 
  DATE(created_at) as date,
  change_type,
  status,
  COUNT(*) as total_changes
FROM dev_vivo_changes
GROUP BY DATE(created_at), change_type, status;
```

**B. Métricas Importantes**
- Total de mudanças por dia
- Taxa de rollback
- Tempo médio de aplicação
- Erros por tipo
- Usuários ativos

---

### 2. **GPTs Especializados**

#### ⚠️ O que precisa ser verificado:

**A. Integração com GPT Narrativo**
```typescript
// Verificar se mudanças são documentadas
// no estilo narrativo da Nôa
```

**B. Integração com GPT Jurídico**
```typescript
// Verificar conformidade LGPD
// Validar com GPT Jurídico (JUR-001)
```

---

## 🗂️ NFT Soulbound

### 1. **Registro de Integridade Técnica**

#### ⚠️ O que precisa ser verificado:

**A. Criação do NFT**
- [ ] NFT criado na Polygon via Zora
- [ ] Vinculado ao perfil do desenvolvedor
- [ ] Metadata contém hash de integridade
- [ ] Soulbound (não transferível)

**B. Validação de Integridade**
```typescript
// Cada mudança deve incluir referência ao NFT
interface ChangeWithNFT {
  changeId: string
  nftTokenId: string
  nftHash: string
  developerProfile: string
}
```

---

## 📘 Protocolo Institucional

### 1. **Documento Mestre**

#### ⚠️ O que precisa ser verificado:

**A. Adendo ao Documento Mestre**
- [ ] Seção "Camada Técnica Dev Vivo" criada
- [ ] Protocolo de ativação documentado
- [ ] Código de ativação simbólico definido
- [ ] Vínculo de NFT documentado

**B. Conformidade com GPT Jurídico**
- [ ] Validação LGPD realizada
- [ ] Publicação institucional aprovada
- [ ] Termos de uso atualizados

---

## ✅ Checklist Final de Conformidade

### Autenticação e Segurança
- [ ] Credenciais Supabase configuradas
- [ ] Service Role Key protegido
- [ ] RLS habilitado e testado
- [ ] Sessões com expiração funcionando
- [ ] Validação de flag_admin em todas as operações

### LGPD e Auditoria
- [ ] Tabela de auditoria criada
- [ ] Logs de todas as ações funcionando
- [ ] Assinaturas digitais sendo geradas
- [ ] Consentimento e finalidade documentados
- [ ] Direitos do titular implementados

### Integração
- [ ] Backend configurado e rodando
- [ ] API endpoints funcionando
- [ ] Frontend integrado
- [ ] Nôa reconhece comandos
- [ ] Diagnóstico funcionando

### Documentação
- [ ] Documento Mestre atualizado
- [ ] Protocolo de ativação documentado
- [ ] NFT criado e vinculado
- [ ] Conformidade jurídica validada

---

**Status**: 🔄 Aguardando Verificação  
**Próximo Passo**: Executar checklist de verificação

