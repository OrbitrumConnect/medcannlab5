# Engineering Rules — MedCannLab

> Regras de engenharia que sobrevivem ao projeto. Sempre que houver dúvida arquitetural, consultar este arquivo.
>
> Origem: lições consolidadas em 25-26/04/2026 após esgotamento de quota OpenAI por payload inflado.

---

## REGRA #1 — LLM como último recurso, não primeiro

**Nenhuma chamada ao LLM (OpenAI, etc.) pode ocorrer se a resposta puder ser determinada por estado + regras locais.**

### NÃO chama LLM (Camada 1 — determinística):
- Saudações iniciais ("Olá", "Bom dia")
- Frases verbatim do protocolo IMRE/AEC (já existem em `clinicalAssessmentFlow.ts`)
- Transições de fase determinísticas (FSM client-side)
- Detecção de intent simples (regex em `tradevision-core`)
- Roteamento de comando (NAVIGATE_*, TRIGGER_*)
- Respostas a confirmações curtas ("sim", "não", "ok")

### Camada 2 — processamento estruturado (sem LLM):
- Parsing de queixas (NLP local)
- Vector search (RAG puro, sem geração)
- Cruzamento de dados (regras determinísticas)

### CHAMA LLM (Camada 3 — inferência cara):
- Análise clínica nuançada
- Geração de relatório final
- Follow-up adaptativo de queixa
- Racionalidade clínica (já gated por role em V1.9.49)
- Resposta livre fora de protocolo

### Princípio operacional
> *"Se a resposta já existe no sistema, chamar LLM é bug, não feature."*

### Anti-pattern detectado em prod (25/04/2026)
Log do Edge Function mostrou `[AEC] Roteiro Selado (verbatim): fase= COMPLAINT_DETAILS` seguido de chamada à OpenAI. Sistema **sabia** a frase mas pagava GPT pra "personalizar". Custo direto: ~30k tokens/turno desnecessário.

---

## REGRA #2 — Payload com cap explícito (whitelist > truncate)

**Nenhum objeto dinâmico entra no system prompt sem passar por whitelist de campos.**

### ❌ ERRADO (anti-pattern V1.9.55→V1.9.71):
```ts
{ role: "system", content: systemPrompt + ... + JSON.stringify(patientData) }
```

### ✅ CORRETO (V1.9.72+):
```ts
const safePatientData = {
  user: { id: patientData?.user?.id, name: patientData?.user?.name },
  intent: patientData?.intent,
  aec: patientData?.assessmentContext ? {
    phase: patientData.assessmentContext.phase,
    queixa_principal: patientData.assessmentContext.queixa_principal,
    top_sintomas: patientData.assessmentContext.lista_indiciaria?.slice(0, 3)
  } : null
}
{ role: "system", content: systemPrompt + ... + JSON.stringify(safePatientData) }
```

### Por que whitelist > cap (slice)
- **Cap (slice):** corta string genérica → pode quebrar JSON, perde sentido
- **Whitelist:** controla estrutura → previsível, testável, expansível

### Caps numéricos secundários (pra defesa em profundidade)
- `safeReasoningContext` (RAG): 60.000 chars (V1.9.61 ✅)
- `aecSnapshot`: 5.000 chars
- `conversationHistory`: 10 mensagens (não tempo)
- `patientData` whitelist: < 2.000 chars

### Telemetria obrigatória
Toda mudança em payload precisa ser medida via `noa_logs.interaction_type='payload_size'`:
```sql
SELECT
  AVG((payload->>'estimated_tokens')::int) AS media,
  MAX((payload->>'estimated_tokens')::int) AS pico,
  COUNT(*) FILTER (WHERE (payload->>'estimated_tokens')::int > 30000) AS risco
FROM noa_logs WHERE interaction_type = 'payload_size_v1_9_72'
  AND created_at > now() - interval '24 hours';
```

Meta: média < 15k tokens, zero requests > 30k.

---

## REGRA #3 — Fail-open em routing clínico

**Quando router está em dúvida sobre Camada 2 vs Camada 3, sempre escolher Camada 3 (LLM).**

### Por quê
Perda de qualidade clínica custa mais que tokens. Resposta robotizada num momento que pedia nuance = paciente percebe, perde confiança, sistema vira "chatbot".

### Implementação
```ts
function shouldUseDeterministic(payload): boolean {
  // Critérios EXPLÍCITOS (whitelist de quando NÃO chamar LLM):
  if (payload.message.match(/^(oi|olá|tudo bem|bom dia|boa tarde|boa noite)\s*[!?.]?$/i)) return true
  if (payload.aec.phase === 'INITIAL_GREETING' && payload.history.length === 0) return true
  if (payload.intent === 'NAVIGATION_ONLY' && payload.command_match.confidence > 0.95) return true
  // ...lista exaustiva de casos triviais...

  // FAIL-OPEN: qualquer coisa fora dessa lista vai pra LLM
  return false
}
```

### Anti-pattern a evitar
```ts
// ❌ ERRADO — opaque heurística
function needsLLM(payload): boolean {
  return payload.complexity > 0.7  // o quê é complexity? como medir?
}
```

---

## REGRA #4 — Telemetria antes de comportamento

**Toda nova camada de routing precisa ter log mensurável antes de virar default.**

### Fluxo obrigatório
1. **Implementar** nova lógica em modo passivo (loga decisão, mas executa o caminho antigo)
2. **Validar** 24-48h em prod com SQL agregado
3. **Se métricas batem expectativa** → ativar como default
4. **Se desviam** → ajustar lógica antes de ativar

### Padrão V1.9.66 ISM Fase 1 (referência)
```ts
// Fase 1: aditivo, só loga
await supabaseClient.from('noa_logs').insert({
  user_id, interaction_type: 'ism_state_observed', payload: { ... }
})
// Comportamento NÃO muda — sistema continua igual
// Validação: 48h depois, query confirma schema cobre casos reais
// Fase 2: SÓ ENTÃO Core respeita o estado
```

### Anti-pattern a evitar
Aplicar fix arquitetural sem dado real. Em 25/04 cometi esse erro 2 vezes (cluster IMRE refutado contra types.ts stale; "OFFLINE label" sem checar trauma_log primeiro).

---

## REGRA #5 — `institutional_trauma_log` é fonte de verdade pra falha de IA

**Antes de chutar "bug de UI/label", consultar `institutional_trauma_log` últimas 6h.**

### Query padrão
```sql
SELECT created_at, severity, LEFT(metadata->>'error', 100) AS err
FROM institutional_trauma_log
WHERE reason ILIKE '%Brain Disconnect%'
  AND created_at > now() - interval '6 hours'
ORDER BY created_at DESC LIMIT 10;
```

### Tipos de erro a reconhecer imediatamente
- `429 insufficient_quota` → quota OpenAI esgotada (billing)
- `429 rate_limit_exceeded` → rate limit (não billing)
- `400 maximum context length` → payload overflow (regressão de cap)
- `timeout` → infra/network
- `500 internal_server_error` → OpenAI side

---

## Histórico de regras (lições registradas)

- **REGRA #1** — após log de prod 25/04 mostrar GPT chamado pra dizer frase verbatim do protocolo
- **REGRA #2** — após V1.9.55 restaurar `patientData` sem cap, contribuindo pra esgotamento de quota
- **REGRA #3** — antes de router 3-camadas (V1.9.7x+) entrar em produção
- **REGRA #4** — após 2 retratações em 25/04 (cluster IMRE + OFFLINE label) por afirmar sem validar
- **REGRA #5** — após chutar "bug de label" quando era quota esgotada (Pedro tinha conhecimento histórico que eu ignorei)

---

*Atualizar este arquivo sempre que uma nova lição arquitetural emergir. Toda regra adicionada deve ter histórico (incidente que originou) e exemplo concreto.*
