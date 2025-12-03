# 🔗 Instruções: Integração Modo Dev Vivo com Nôa

## 📝 Passo a Passo

### 1. Adicionar Import

No arquivo `src/lib/noaResidentAI.ts`, adicione no início (junto com os outros imports):

```typescript
// Adicionar após os outros imports
import { processDevVivoCommand } from './devVivo/integrationNoa'
```

### 2. Adicionar Processamento no processMessage

Na função `processMessage` (linha ~275), adicione **ANTES** de qualquer outro processamento:

```typescript
async processMessage(userMessage: string, userId?: string, userEmail?: string, userType?: string): Promise<AIResponse> {
  if (this.isProcessing) {
    console.log('⏳ IA já está processando, aguardando...')
    return this.createResponse('Aguarde, estou processando sua mensagem anterior...', 0.5)
  }

  this.isProcessing = true
  
  // Remover emojis da mensagem do usuário antes de processar
  let cleanedMessage = this.removeEmojis(userMessage)
  console.log('🤖 [NoaResidentAI] Processando mensagem:', cleanedMessage.substring(0, 100) + '...')

  try {
    // 🔥 NOVO: Processar comandos do Modo Dev Vivo (PRIORIDADE MÁXIMA)
    // Adicionar ANTES de qualquer outro processamento
    const devVivoResponse = await processDevVivoCommand(cleanedMessage, userId, userEmail)
    if (devVivoResponse) {
      console.log('✅ Comando Dev Vivo processado:', devVivoResponse.type)
      this.isProcessing = false
      return devVivoResponse
    }

    // Ler dados da plataforma em tempo real (agora busca dados reais do Supabase)
    const platformData = await this.getPlatformData()
    // ... resto do código continua igual ...
```

### 3. Localização Exata

A integração deve ser adicionada **logo após** a linha:
```typescript
let cleanedMessage = this.removeEmojis(userMessage)
```

E **antes** de:
```typescript
// Ler dados da plataforma em tempo real
const platformData = await this.getPlatformData()
```

### 4. Código Completo para Adicionar

```typescript
// 🔥 NOVO: Processar comandos do Modo Dev Vivo (PRIORIDADE MÁXIMA)
// Adicionar ANTES de qualquer outro processamento
const devVivoResponse = await processDevVivoCommand(cleanedMessage, userId, userEmail)
if (devVivoResponse) {
  console.log('✅ Comando Dev Vivo processado:', devVivoResponse.type)
  this.isProcessing = false
  this.saveToMemory(cleanedMessage, devVivoResponse, userId)
  return devVivoResponse
}
```

---

## ✅ Verificação

Após adicionar o código:

1. **Verificar imports:**
   - Deve ter: `import { processDevVivoCommand } from './devVivo/integrationNoa'`

2. **Verificar processamento:**
   - Comando "ativar dev vivo" deve ser processado
   - Resposta deve ser retornada antes de qualquer outro processamento

3. **Testar:**
   - Digite: "ativar dev vivo"
   - Deve retornar: "✅ Modo Dev Vivo ativado com sucesso!"

---

## 🐛 Troubleshooting

### Erro: "Cannot find module './devVivo/integrationNoa'"
- Verificar se o arquivo existe: `src/lib/devVivo/integrationNoa.ts`
- Verificar caminho do import

### Erro: "processDevVivoCommand is not a function"
- Verificar se a função está exportada corretamente
- Verificar se o import está correto

### Comando não está sendo processado
- Verificar se o código foi adicionado no local correto
- Verificar console para logs de debug

---

**Status**: ⚠️ **Aguardando Integração Manual**  
**Arquivo**: `src/lib/noaResidentAI.ts` (linha ~285)

