# 🎯 Modo Dev Vivo - Estrutura Completa

## 📋 Visão Geral

Sistema que permite à IA residente (Nôa) fazer alterações em tempo real no código enquanto o sistema está rodando, com autenticação, logs e reversão.

---

## 🏗️ Arquitetura

```
┌─────────────────────────────────────────────────────────┐
│                    Nôa Dev Mode                         │
│  (Ativado via comando: "ativar dev vivo")              │
└─────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────┐
│              Painel de Diagnóstico                      │
│  • Rota atual                                           │
│  • Props e estado                                        │
│  • Erros recentes                                        │
│  • Dados vinculados                                     │
└─────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────┐
│         API Endpoints (/admin/dev-vivo/*)               │
│  • POST /admin/dev-vivo/update-code                     │
│  • POST /admin/dev-vivo/patch-function                 │
│  • GET  /admin/dev-vivo/diagnostics                     │
│  • POST /admin/dev-vivo/rollback                        │
└─────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────┐
│         Sistema de Logs e Reversão                      │
│  • Tabela: dev_vivo_changes                             │
│  • Logs assinados                                       │
│  • Rollback automático                                  │
└─────────────────────────────────────────────────────────┘
```

---

## 🧠 Componente 1: Nôa Dev Mode

### Ativação
```typescript
// Comando especial para ativar
"ativar dev vivo"
"modo desenvolvedor"
"dev mode on"
```

### Funcionalidades
- ✅ Autenticação via Supabase Token
- ✅ Validação de privilégios (flag_admin=true)
- ✅ Painel de diagnóstico em tempo real
- ✅ Ações permitidas via comandos naturais

---

## 📋 Componente 2: Painel de Diagnóstico

### Informações Exibidas
```typescript
interface DevVivoDiagnostics {
  // Rota e Navegação
  currentRoute: string
  routeParams: Record<string, any>
  queryParams: Record<string, any>
  
  // Componente Atual
  currentComponent: string
  componentProps: Record<string, any>
  componentState: Record<string, any>
  
  // Erros e Warnings
  recentErrors: ErrorLog[]
  recentWarnings: WarningLog[]
  
  // Dados Vinculados
  supabaseConnections: ConnectionStatus[]
  apiCalls: APICall[]
  realtimeSubscriptions: Subscription[]
  
  // Performance
  renderTime: number
  memoryUsage: number
  networkLatency: number
}
```

---

## 🛠️ Componente 3: Ações Permitidas

### Tipos de Arquivos
- ✅ `.tsx` - Componentes React
- ✅ `.ts` - Lógica TypeScript
- ✅ `.sql` - Scripts de banco de dados
- ✅ `.md` - Documentação

### Operações
- ✅ Criar arquivo
- ✅ Modificar arquivo
- ✅ Deletar arquivo
- ✅ Aplicar patch em função
- ✅ Atualizar componente

---

## 🪪 Componente 4: Autenticação

### Fluxo de Autenticação
```typescript
interface DevVivoAuth {
  // Token Supabase
  supabaseToken: string
  
  // Validação
  userId: string
  userType: 'admin' | 'professional' | 'aluno' | 'paciente'
  flagAdmin: boolean
  
  // Permissões
  canModifyCode: boolean
  canModifyDatabase: boolean
  canAccessRealData: boolean
  
  // Sessão
  sessionId: string
  expiresAt: Date
}
```

### Validação
```sql
-- Verificar se usuário tem permissão
SELECT 
  id,
  type,
  flag_admin,
  email
FROM users
WHERE id = auth.uid()
  AND type = 'admin'
  AND flag_admin = true;
```

---

## 📡 Componente 5: API Endpoints

### 1. Atualizar Código
```typescript
POST /admin/dev-vivo/update-code
Body: {
  filePath: string
  content: string
  changeType: 'create' | 'update' | 'delete'
  reason: string
}
```

### 2. Aplicar Patch em Função
```typescript
POST /admin/dev-vivo/patch-function
Body: {
  filePath: string
  functionName: string
  patch: string  // Código da função modificada
  reason: string
}
```

### 3. Obter Diagnóstico
```typescript
GET /admin/dev-vivo/diagnostics
Response: DevVivoDiagnostics
```

### 4. Reverter Mudança
```typescript
POST /admin/dev-vivo/rollback
Body: {
  changeId: string
  reason: string
}
```

---

## 📝 Componente 6: Sistema de Logs

### Tabela de Logs
```sql
CREATE TABLE dev_vivo_changes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  session_id TEXT NOT NULL,
  change_type TEXT NOT NULL, -- 'create', 'update', 'delete', 'patch'
  file_path TEXT NOT NULL,
  old_content TEXT,
  new_content TEXT,
  reason TEXT,
  status TEXT DEFAULT 'pending', -- 'pending', 'applied', 'rolled_back', 'failed'
  applied_at TIMESTAMP WITH TIME ZONE,
  rolled_back_at TIMESTAMP WITH TIME ZONE,
  rollback_reason TEXT,
  signature TEXT, -- Assinatura digital para LGPD
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices
CREATE INDEX idx_dev_vivo_changes_user_id ON dev_vivo_changes(user_id);
CREATE INDEX idx_dev_vivo_changes_session_id ON dev_vivo_changes(session_id);
CREATE INDEX idx_dev_vivo_changes_status ON dev_vivo_changes(status);
CREATE INDEX idx_dev_vivo_changes_file_path ON dev_vivo_changes(file_path);
```

### Logs Assinados
```typescript
interface SignedChange {
  changeId: string
  userId: string
  timestamp: Date
  signature: string  // Hash SHA-256 do conteúdo + userId + timestamp
  content: string
}
```

---

## 🔐 Componente 7: Segurança e LGPD

### Restrições
```typescript
interface SecurityRules {
  // Apenas admins podem usar
  requiresAdmin: true
  
  // Dados reais apenas com flag explícita
  realDataAccess: {
    requiresFlag: 'flag_admin'
    requiresLog: true
    requiresSignature: true
  }
  
  // Arquivos protegidos
  protectedFiles: [
    'src/lib/supabase.ts',  // Credenciais
    '.env',                 // Variáveis de ambiente
    'package.json'          // Dependências críticas
  ]
  
  // Validação de código
  codeValidation: {
    noEval: true
    noFunctionConstructor: true
    noDangerousImports: true
  }
}
```

### Auditoria LGPD
```sql
CREATE TABLE dev_vivo_audit (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  change_id UUID REFERENCES dev_vivo_changes(id),
  action TEXT NOT NULL, -- 'create', 'read', 'update', 'delete'
  data_type TEXT, -- 'user_data', 'code', 'config'
  user_id UUID REFERENCES auth.users(id),
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

---

## 🚀 Implementação

### Fase 1: Estrutura Base
- [ ] Criar tabelas de logs
- [ ] Criar API endpoints
- [ ] Criar componente de autenticação

### Fase 2: Painel de Diagnóstico
- [ ] Criar componente DevVivoPanel
- [ ] Integrar com React DevTools
- [ ] Mostrar informações em tempo real

### Fase 3: Integração com Nôa
- [ ] Adicionar comandos de ativação
- [ ] Processar comandos de modificação
- [ ] Validar e aplicar mudanças

### Fase 4: Segurança
- [ ] Implementar validação de código
- [ ] Adicionar assinaturas digitais
- [ ] Criar sistema de auditoria

---

## 📊 Exemplo de Uso

### Ativação
```
Usuário: "ativar dev vivo"
Nôa: "✅ Modo Dev Vivo ativado. Autenticado como admin."
```

### Diagnóstico
```
Usuário: "mostrar diagnóstico da página atual"
Nôa: "📋 Diagnóstico:
- Rota: /app/clinica/profissional/dashboard
- Componente: ProfessionalDashboard
- Props: { user: {...}, patients: [...] }
- Erros: 0
- Warnings: 2"
```

### Modificação
```
Usuário: "corrigir o erro de loading no componente ClinicalReports"
Nôa: "🔧 Aplicando correção...
✅ Arquivo atualizado: src/components/ClinicalReports.tsx
📝 Mudança logada: change_12345"
```

### Reversão
```
Usuário: "reverter última mudança"
Nôa: "⏪ Revertendo mudança change_12345...
✅ Mudança revertida com sucesso."
```

---

## 🎯 Próximos Passos

1. **Criar estrutura de banco de dados**
2. **Implementar API endpoints**
3. **Criar componente de painel**
4. **Integrar com Nôa**
5. **Adicionar segurança e auditoria**

---

**Status**: 📋 Proposta  
**Prioridade**: Alta  
**Complexidade**: Alta  
**Tempo Estimado**: 2-3 semanas

