# 🧠 Protocolo de Ativação - Modo Dev Vivo

## 📘 Nome Oficial do Módulo

**GPT Dev Vivo – Núcleo de Alteração Assistida em Tempo Real**

---

## 🎯 Função no Ecossistema

Prover alterações controladas em tempo real na estrutura da plataforma Nôa Esperanza, com:
- ✅ Verificação de integridade
- ✅ Diagnóstico em tempo real
- ✅ Rollback automático
- ✅ Assinatura epistêmica
- ✅ Rastreabilidade completa

---

## 🔑 Código de Ativação Simbólico

### Comando Principal
```
"Olá, Nôa. Modo Dev Vivo aqui."
```

### Comandos Alternativos
```
"ativar modo dev vivo"
"ativar dev vivo"
"modo desenvolvedor"
"dev mode on"
"ativar desenvolvimento em tempo real"
```

---

## 🪪 Vínculo de NFT

### NFT Soulbound de Desenvolvimento Responsável

**Especificações:**
- **Blockchain**: Polygon
- **Plataforma**: Zora
- **Tipo**: Soulbound (não transferível)
- **Nome**: "Dev Vivo – Código Vivo com Rastro Ético"
- **Metadata**: Hash de integridade técnica + perfil do desenvolvedor

**Vinculação:**
- NFT vinculado ao perfil do desenvolvedor (Léo ou outro)
- Cada mudança pode referenciar o NFT
- Validação de integridade via hash do NFT

---

## ✅ Checklist de Conformidade com Documento Mestre

| Item | Requisito | Status |
|------|-----------|--------|
| 🔑 **Autenticação** | Supabase Token + flag_admin | ✅ |
| 📜 **Registro de alterações** | Tabela dev_vivo_changes com assinatura SHA-256 | ✅ |
| 🕊️ **Conformidade LGPD** | Tabela dev_vivo_audit, ações auditáveis | ✅ |
| ♻️ **Reversibilidade** | Comando natural de rollback | ✅ |
| 📊 **Diagnóstico ativo** | Props, estado, rota, erros, conexão Supabase | ✅ |
| 🧠 **Inteligência clínica e ética** | Compatível com GPT Narrativo e Jurídico | ✅ |
| 🧬 **Rastreabilidade** | Registro de sessões com expiração e RLS | ✅ |

---

## 🚀 Etapas de Implementação

### Etapa 1 – Validação e Registro na Plataforma

#### 1.1 Executar SQL
```sql
-- Executar no Supabase SQL Editor
-- Arquivo: database/CREATE_DEV_VIVO_TABLES.sql
```

#### 1.2 Validar Geração de Logs
```sql
-- Testar criação de sessão
SELECT create_dev_vivo_session(
  auth.uid(),
  'supabase_token_aqui',
  60  -- expira em 60 minutos
);

-- Verificar logs
SELECT * FROM dev_vivo_changes
ORDER BY created_at DESC
LIMIT 10;
```

#### 1.3 Testar Rollback
```sql
-- Criar mudança de teste
SELECT register_dev_vivo_change(
  'session_id_aqui',
  'update',
  'src/test.tsx',
  'old content',
  'new content',
  'Teste de rollback'
);

-- Reverter mudança
SELECT rollback_dev_vivo_change(
  'change_id_aqui',
  'Teste de rollback manual'
);
```

**Checklist Etapa 1:**
- [ ] SQL executado com sucesso
- [ ] Tabelas criadas
- [ ] Funções RPC funcionando
- [ ] RLS policies ativas
- [ ] Logs sendo gerados
- [ ] Rollback testado

---

### Etapa 2 – Integração como Módulo GPT

#### 2.1 Criar GPTDevVivo.ts
```typescript
// src/lib/devVivo/GPTDevVivo.ts
export class GPTDevVivo {
  // Integração com árvore de GPTs do Documento Mestre
  // Comandos naturais processados
  // Validação de segurança
  // Aplicação de mudanças
}
```

#### 2.2 Comandos Naturais

**Ativação:**
```
"ativar modo dev vivo"
→ Valida autenticação
→ Cria sessão
→ Retorna: "✅ Modo Dev Vivo ativado"
```

**Diagnóstico:**
```
"mostrar diagnóstico técnico"
→ Coleta informações do sistema
→ Retorna: DevVivoDiagnostics
```

**Rollback:**
```
"rollback da última alteração"
→ Busca última mudança
→ Reverte automaticamente
→ Retorna: "✅ Mudança revertida"
```

**Registro:**
```
"registrar alteração com assinatura simbólica"
→ Cria mudança
→ Gera assinatura SHA-256
→ Registra no banco
→ Retorna: "✅ Alteração registrada"
```

**Checklist Etapa 2:**
- [ ] GPTDevVivo.ts criado
- [ ] Integração com Documento Mestre
- [ ] Comandos naturais processados
- [ ] Validação de segurança
- [ ] Feedback em tempo real

---

### Etapa 3 – Registro Simbólico e Jurídico

#### 3.1 Adendo ao Documento Mestre

**Título:** "Camada Técnica Dev Vivo – Alteração Ética em Tempo Real"

**Conteúdo:**
- Definição do módulo
- Protocolo de ativação
- Código de ativação simbólico
- Vínculo de NFT
- Conformidade LGPD
- Rastreabilidade

#### 3.2 Criar NFT Simbólico

**Especificações:**
- **Nome**: "Dev Vivo – Código Vivo com Rastro Ético"
- **Descrição**: NFT Soulbound representando compromisso com desenvolvimento responsável
- **Metadata**:
  ```json
  {
    "name": "Dev Vivo – Código Vivo com Rastro Ético",
    "description": "NFT Soulbound de Desenvolvimento Responsável",
    "attributes": [
      {
        "trait_type": "Integridade",
        "value": "SHA-256"
      },
      {
        "trait_type": "Rastreabilidade",
        "value": "Completa"
      },
      {
        "trait_type": "Conformidade",
        "value": "LGPD"
      }
    ],
    "developer": "Léo",
    "platform": "Nôa Esperanza",
    "blockchain": "Polygon",
    "standard": "ERC-721"
  }
  ```

#### 3.3 Validação com GPT Jurídico

**Validações Necessárias:**
- [ ] Conformidade LGPD
- [ ] Termos de uso atualizados
- [ ] Política de privacidade revisada
- [ ] Consentimento explícito documentado
- [ ] Base legal identificada
- [ ] Retenção de dados definida

**Checklist Etapa 3:**
- [ ] Adendo ao Documento Mestre redigido
- [ ] NFT criado na Polygon via Zora
- [ ] NFT vinculado ao perfil
- [ ] Validação jurídica realizada
- [ ] Publicação institucional aprovada

---

## 🌿 Considerações Simbólicas

Na Nôa Esperanza, a alteração em tempo real não é improviso, é **escuta viva com rastreabilidade**.

Cada linha alterada carrega a responsabilidade de um gesto técnico e simbólico auditável, como no curso **Arte da Entrevista Clínica**: o que se escuta e se transforma deve ser registrado, devolvido e validado — com presença, ética e método.

---

## 📋 Próximos Passos Imediatos

1. **Executar SQL** no Supabase
2. **Criar GPTDevVivo.ts** com integração
3. **Implementar comandos naturais** em noaResidentAI.ts
4. **Criar NFT** na Polygon via Zora
5. **Validar com GPT Jurídico** (JUR-001)
6. **Atualizar Documento Mestre**

---

**Status**: 📋 Protocolo Definido - Aguardando Implementação  
**Versão**: 1.0.0  
**Data**: Janeiro 2025

