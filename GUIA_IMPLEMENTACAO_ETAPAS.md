# 🚀 Guia de Implementação - Etapas Pendentes

## 📋 Status das Etapas

| Etapa | Status | Ação Necessária |
|-------|--------|-----------------|
| Variáveis de ambiente | ✅ **Criado** | Configurar .env no ambiente |
| Backend funcional (APIs) | ✅ **Criado** | Integrar endpoints no servidor |
| Integração com Nôa | ✅ **Criado** | Adicionar import em noaResidentAI.ts |
| Teste em produção | ⚠️ **Pendente** | Executar teste completo |

---

## ✅ Etapa 1: Variáveis de Ambiente

### Arquivo Criado:
- ✅ `.env.dev-vivo.example` - Template de variáveis

### Como Configurar:

1. **Copiar template:**
```bash
cp .env.dev-vivo.example .env.local
```

2. **Preencher valores:**
```bash
# Editar .env.local
SUPABASE_URL=https://https://supabase.com/dashboard/project/itdjkfubfzmvmuxxjoae
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
OPENAI_API_KEY=sk-...
```

3. **Verificar no código:**
```typescript
// src/lib/supabase.ts deve usar:
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY
```

**Checklist:**
- [ ] Arquivo .env.local criado
- [ ] Valores preenchidos
- [ ] Variáveis acessíveis no código
- [ ] Service Role Key protegido

---

## ✅ Etapa 2: Backend Funcional (APIs)

### Arquivos Criados:
- ✅ `src/api/devVivo/routes.ts` - Endpoints da API

### Como Integrar:

#### Opção A: Next.js API Routes
```typescript
// pages/api/admin/dev-vivo/update-code.ts
import { updateCode } from '../../../api/devVivo/routes'
import { getServerSession } from 'next-auth'

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const session = await getServerSession(req, res)
  if (!session?.user?.id) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  const result = await updateCode(req.body, session.user.id)
  return res.status(200).json(result)
}
```

#### Opção B: Servidor Node.js Separado
```typescript
// server/routes/dev-vivo.ts
import express from 'express'
import { updateCode, getDiagnostics, rollback } from '../api/devVivo/routes'

const router = express.Router()

router.post('/update-code', async (req, res) => {
  const userId = req.user?.id
  if (!userId) return res.status(401).json({ error: 'Unauthorized' })
  
  const result = await updateCode(req.body, userId)
  res.json(result)
})

export default router
```

#### Opção C: Supabase Edge Functions
```typescript
// supabase/functions/dev-vivo-update-code/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { updateCode } from '../../api/devVivo/routes.ts'

serve(async (req) => {
  const { userId, ...body } = await req.json()
  const result = await updateCode(body, userId)
  return new Response(JSON.stringify(result), {
    headers: { 'Content-Type': 'application/json' }
  })
})
```

**Checklist:**
- [ ] Endpoints criados no servidor
- [ ] Autenticação implementada
- [ ] Validação de flag_admin funcionando
- [ ] Testes de endpoints realizados

---

## ✅ Etapa 3: Integração com Nôa

### Arquivos Criados:
- ✅ `src/lib/devVivo/integrationNoa.ts` - Processamento de comandos

### Como Integrar:

1. **Adicionar import em noaResidentAI.ts:**
```typescript
// No início do arquivo
import { processDevVivoCommand } from './devVivo/integrationNoa'
```

2. **Adicionar no processMessage:**
```typescript
// Em src/lib/noaResidentAI.ts, função processMessage
async processMessage(userMessage: string, userId?: string, userEmail?: string, userType?: string): Promise<AIResponse> {
  // ... código existente ...

  // Adicionar ANTES do processamento normal:
  const devVivoResponse = await processDevVivoCommand(userMessage, userId, userEmail)
  if (devVivoResponse) {
    return devVivoResponse
  }

  // ... resto do código ...
}
```

**Checklist:**
- [ ] Import adicionado
- [ ] processDevVivoCommand chamado em processMessage
- [ ] Comandos sendo processados
- [ ] Respostas sendo retornadas

---

## ⚠️ Etapa 4: Teste em Produção

### Script de Teste Criado:
- ✅ `test-dev-vivo.md` - Guia de testes

### Como Testar:

1. **Ativar Modo Dev Vivo:**
```
Usuário: "ativar dev vivo"
Esperado: "✅ Modo Dev Vivo ativado com sucesso!"
```

2. **Verificar Diagnóstico:**
```
Usuário: "mostrar diagnóstico"
Esperado: Informações do sistema (rota, componente, erros, etc.)
```

3. **Verificar Histórico:**
```
Usuário: "histórico de mudanças"
Esperado: Lista de mudanças (pode estar vazia inicialmente)
```

4. **Testar Rollback:**
```
Usuário: "rollback última mudança"
Esperado: Confirmação de rollback ou mensagem de "nenhuma mudança"
```

5. **Desativar:**
```
Usuário: "desativar dev vivo"
Esperado: "✅ Modo Dev Vivo desativado com sucesso!"
```

### Monitoramento:

1. **Verificar Logs no Supabase:**
```sql
-- Ver sessões criadas
SELECT * FROM dev_vivo_sessions
ORDER BY created_at DESC
LIMIT 5;

-- Ver mudanças registradas
SELECT * FROM dev_vivo_changes
ORDER BY created_at DESC
LIMIT 10;

-- Ver auditoria
SELECT * FROM dev_vivo_audit
ORDER BY created_at DESC
LIMIT 10;
```

2. **Verificar Console do Navegador:**
- Abrir DevTools (F12)
- Verificar logs de erro
- Verificar chamadas de API

**Checklist:**
- [ ] Ativação funcionando
- [ ] Diagnóstico retornando dados
- [ ] Histórico sendo exibido
- [ ] Rollback funcionando (se houver mudanças)
- [ ] Desativação funcionando
- [ ] Logs sendo gerados no banco

---

## 🎯 Próximos Passos Imediatos

1. **Configurar .env:**
   ```bash
   cp .env.dev-vivo.example .env.local
   # Editar valores
   ```

2. **Executar SQL no Supabase:**
   ```sql
   -- Executar: database/CREATE_DEV_VIVO_TABLES.sql
   ```

3. **Integrar endpoints no servidor:**
   - Escolher opção (Next.js, Node.js, ou Edge Functions)
   - Criar rotas
   - Testar

4. **Adicionar import em noaResidentAI.ts:**
   ```typescript
   import { processDevVivoCommand } from './devVivo/integrationNoa'
   ```

5. **Testar em produção:**
   - Ativar modo
   - Testar comandos
   - Verificar logs

---

## 📊 Resumo

| Item | Status | Arquivo |
|------|--------|---------|
| Variáveis de ambiente | ✅ Template criado | `.env.dev-vivo.example` |
| Backend APIs | ✅ Código criado | `src/api/devVivo/routes.ts` |
| Integração Nôa | ✅ Código criado | `src/lib/devVivo/integrationNoa.ts` |
| Teste | ⚠️ Aguardando | Executar após integração |

---

**Status**: ✅ **Código Pronto - Aguardando Integração**  
**Próximo Passo**: Configurar .env e integrar endpoints

