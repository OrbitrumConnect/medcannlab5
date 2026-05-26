---
name: Smoke AEC COMPLETA obrigatória após qualquer mudança em clinicalAssessmentFlow.ts
description: Bug V1.9.443-B introduzido por mim (Claude) em 24/05 noite — ReferenceError em produção, Carolina pegou em ~10min. Hotfix em 10min. Princípio meta cristalizado: type-check NÃO substitui smoke runtime FSM. Toda mudança em clinicalAssessmentFlow.ts exige smoke completo das 10 etapas AEC ANTES de commit
type: feedback
originSessionId: 4a984140-7091-42ce-a9d3-75298afef276
---
# Smoke AEC COMPLETA obrigatória após mudança em clinicalAssessmentFlow.ts

**Rule**: Toda mudança em `src/lib/clinicalAssessmentFlow.ts` exige smoke com AEC COMPLETA (etapa 1 → etapa 10) ANTES de commit, NÃO importa quão 'cirúrgica' pareça a mudança. **type-check NÃO substitui smoke de runtime FSM**.

**Why** — Bug paradigmático V1.9.443-B (24/05 noite):

Carolina (conta teste do Ricardo) tentou fazer AEC ~17:14 BRT. Pedro mandou print: Nôa disparou 4 perguntas de uma vez na Etapa 4 + pulou pra Etapa 5 sem fechar Etapa 4.

**Sintoma visível ao paciente**:
- Etapa 4 HDA esperada: *"Onde você sente essa sensação?"* (UMA pergunta)
- Etapa 4 HDA real: *"Onde você sente essa sensação? Quando ela começou? Como ela se manifesta? O que melhora ou piora essa sensação?"* (QUATRO perguntas)
- Pulou Etapa 5 (HPP) sem confirmar fechamento Etapa 4

**Investigação via logs Edge**:
```
17:14:54.369  Erro ao processar fluxo AEC:
17:15:55.870  Erro ao processar fluxo AEC:
...
17:17:37.691  Erro ao processar fluxo AEC: ReferenceError: response is not defined
    at ClinicalAssessmentFlow.processResponse (index.BVlNu7Wu.js:191:12636)
```

**Causa raiz** (auto-acusação minha honesta):
- V1.9.443-B Fix B adicionou guard `isInterrogativeDoubt` em `clinicalAssessmentFlow.ts:755`
- Usei `response.includes('?')` — **variável `response` NÃO EXISTE** nesse escopo
- Parâmetro real do método é `userResponse` (linha 590)
- TypeScript NÃO pegou (nome ambíguo aceito como variável global)
- `processResponse()` crashou a CADA turno AEC
- Try/catch externo capturou e logou silencioso
- FSM AEC não avançou as fases (state fossilizado)
- GPT-4o continuou respondendo "de cabeça" usando protocolo do CLINICAL_PROMPT (memorizado) mas violou regras "uma pergunta por vez" + "esperar paciente encerrar Etapa antes de avançar"

**Por que escapou do smoke V1.9.443+A+B**: smoke do Pedro (13:14-13:20) foi **100% chat livre** — ele expressamente disse *"nao iniciei nem pedi agendamento nem aec"*. **AEC FSM ficou como ponto cego do smoke**.

## Hotfix em 10min

Commit `33e46ab`: `response.includes('?')` → `userResponse.includes('?')`. type-check verde. Push 4 refs URGENTE.

## Validação pós-hotfix (PAT)

Carolina re-testou ~21:25 BRT. PAT puxou **22 interações consecutivas** (21:25-21:30:54 BRT) sem nenhum `Erro ao processar fluxo AEC`. **Todas as 10 etapas literais respeitadas**. Pipeline completo disparou (REPORT 46b626a5 + SIGNATURE hash `5882d567e3220c2d...` + AXES + RATIONALITY + DB SAVED). Pipeline latência: 31.357ms.

## Checklist obrigatório pós-mudança em clinicalAssessmentFlow.ts

Antes de commit:
1. ✅ `npm run type-check` (verde) — necessário mas INSUFICIENTE
2. ✅ Smoke runtime AEC: iniciar sessão, percorrer Etapas 1→10 com prints de cada turno
3. ✅ Validar via PAT: `aec_assessment_state` evolui (phase muda turn-a-turn, não fica em mesmo state)
4. ✅ Validar via PAT: `ai_chat_interactions` SEM `Erro ao processar fluxo AEC` nos últimos N turnos
5. ✅ Validar Pipeline pós-AEC dispara (REPORT criado + SIGNATURE + AXES + RATIONALITY + DONE)

Sem os 5, NÃO commit. Mesmo se type-check verde.

## Variáveis ambíguas — anti-padrão

JavaScript/TypeScript permite usar nomes de variáveis globais (`response`, `Response`, `event`) como variável local sem erro de type-check. Em refactors rápidos, fácil cair nesse erro. **Convenção**: nomes de parâmetros explícitos em `clinicalAssessmentFlow.ts` (ex: `userResponse`, `patientMessage`) ao invés de nomes ambíguos.

## Princípio meta-cristalizado

Bug ReferenceError é a forma mais barata de demonstrar princípio crítico: **frameworks de tipo NÃO detectam todo bug runtime**. Especialmente em código FSM clínico que processa estado complexo turn-a-turn, runtime smoke é insubstituível.

## How to apply

- TODO PR/commit que toque `clinicalAssessmentFlow.ts` ou Edge `tradevision-core` em qualquer prompt FSM precisa smoke completo das 10 etapas
- Smoke "parcial" (chat livre, ou só 1-2 etapas) NÃO substitui smoke completo
- Convenção pra próxima sessão Claude: ANTES de commit em arquivo FSM, declarar smoke completo executado + PAT validado
- Aplicável também: `tradevision-core/index.ts` (CLINICAL_PROMPT + RESEARCH_PROMPT), `noaResidentAI.ts`, `aecGate.ts`

## Cristalizado

Diário 24/05 BLOCO S (sessão noite, pós-bug Carolina). Retrospectiva mensal Princípio 9 + Bug #2 (Seção 4). Princípio meta de processo PIVOTAL — aplicável a TODA mudança futura em código clínico FSM.
