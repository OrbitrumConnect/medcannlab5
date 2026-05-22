---
name: V1.9.388 Matrix snapshot — voz Z2 + PubMed reuso + bypass NoaResidentAI
description: Snapshot técnico completo Nôa Matrix V1.9.388-A.x deployada 19/05 — 10 commits cirúrgicos, estado 95% funcional, falta apenas deploy Edge V1.9.388-A.5
type: project
originSessionId: 6742fef8-9d20-43d8-a8d8-8853df0c89e9
---
## Estado em 19/05/2026 (Pedro session noite)

**Nôa Matrix** = chat Z2 estrutural não-diretivo no Terminal de Pesquisa.
Eixo: organiza corpus marcado pelo médico (casos, racionalidades, papers PubMed, notas) e debate estruturalmente sem prescrever conduta.

## 10 commits Matrix em 19/05

| Commit | Versão | Mudança | Camada | Deploy |
|---|---|---|---|---|
| 6adc1c3 | V1.9.385 | RESEARCH_PROMPT endurecido (palavras banidas, voc preferido, dim longitudinal) | Edge | ✅ |
| 62698e3 | V1.9.386 | Botão ✕ ocultar card NoaMatrixView | FE | ✅ |
| c10a12d | V1.9.387 | Anti-tique GPT (cedo demais — virou Bloomberg seco) | Edge | ✅ |
| 79969c8 | V1.9.388-A | RAG acervo Z2 + Doc #A1 label + bloco ACERVO no prompt | Edge | ✅ |
| cb9c1d3 | V1.9.388-A.1 | **Bypass NoaResidentAI** — useResearchChat chama Edge direto | FE | ✅ |
| 0426c50 | V1.9.388-A.2 | Strip `[TRIGGER_ACTION]` em research mode | Edge | ✅ |
| e033268 | V1.9.388-A.3 | gpt-4o-mini → gpt-4o-2024-08-06 full + voz intelectual + PubMed UI reuso | Edge+FE | ✅ |
| be8b6d2 | V1.9.388-A.4 | Não re-injetar attachedContext em turnos conversacionais (useRef) | FE | ✅ |
| 7b7b76d | V1.9.388-A.5 | Guard `isResearchMode` em DOC_LIST/DOC_COUNT handlers | Edge | ⏳ aguarda deploy |

## Princípio arquitetural cristalizado

Ver memory `feedback_z2_nao_e_burrice_voz_intelectual_19_05`.

## Métrica empírica (log Edge produção)

| Métrica | Pré-V1.9.388-A.1 | V1.9.388-A.3+A.4 |
|---|---|---|
| Tokens médio/turno | ~29.000 | ~5.000 |
| Redução | — | **83%** |
| Model research | gpt-4o-mini | **gpt-4o-2024-08-06** |
| State pollution | Sim (NoaResidentAI pipeline) | Não (Edge direto) |
| AEC_DATA_INSUFFICIENT errors | Frequente | Zero |
| Voz | Burra/loop estrutural | Intelectual conversacional Z2 |
| `[Noa] Intencao detectada` | Disparava em research | Pulado |
| `generateAIReport bloqueado` | Aparecia em todo turno | Zero |
| History | 20 globais sem filtro | 0-6 local Matrix |

## Causa raiz dos 4 bugs corrigidos hoje

1. **State pollution** (V1.9.388-A.1) — useResearchChat usava NoaResidentAI.processMessage que executava pipeline completa (intent classifier + platform actions + RAG local + Assistant API) antes de chegar no Edge. History "sem filtro de sessão" = mensagens globais do usuário poluíam.

2. **Voz robótica** (V1.9.388-A.3) — gpt-4o-mini forçado em V1.9.379-B + RESEARCH_PROMPT V1.9.387 "Bloomberg seco" travaram capacidade conversacional. Mini violava proibições literais sob carga. Erro arquitetural meu confundindo Z2 clínica com Z2 conversacional.

3. **Re-análise em loop** (V1.9.388-A.4) — `attachedContext` reinjetava em CADA mensagem. Modelo obediente re-analisava o corpus completo a cada turno, ignorando que era follow-up conversacional.

4. **DOC_LIST falso disparo** (V1.9.388-A.5) — Handler de listagem de documentos da Nôa clínica disparava quando médico falava "analise esses documentos" no Matrix. Bypass `shouldBypassInterceptors` não cobria `isResearchMode`.

## Componentes vivos pós-V1.9.388

### Frontend
- [src/hooks/useResearchChat.ts](src/hooks/useResearchChat.ts) — hook stateless server, chama Edge direto via `supabase.functions.invoke('tradevision-core')`, history local apenas
- [src/components/NoaMatrixView.tsx](src/components/NoaMatrixView.tsx) — layout 2 colunas (cards anexáveis + ResearchChat), tipo `pubmed-article` reusa `pubmedService.ts` V1.9.369
- [src/components/ResearchChat.tsx](src/components/ResearchChat.tsx) — UI minimalista emerald/purple/amber, avatar Nôa estático
- [src/components/PatientFocusView.tsx](src/components/PatientFocusView.tsx) — botão "Nôa Matrix" no header (trigger contextual Terminal Atendimento → Matrix)

### Edge tradevision-core
- Linha ~1880: `const isResearchMode = ui_context?.bypassFSM === true || ui_context?.source === 'research_chat'`
- Linha 2879: `shouldBypassInterceptors += isResearchMode` (V1.9.388-A.5)
- Linha 2891: `if isDocCountRequest && !isResearchMode` (V1.9.388-A.5)
- Linha 4860: knowledgeBlock branch research mode com label "Doc #A1" (V1.9.388-A)
- Linha 4974: bloco "ACERVO BASE DE CONHECIMENTO" no RESEARCH_PROMPT (V1.9.388-A)
- Linha 5067: bloco "VOZ INTELECTUAL Z2" no RESEARCH_PROMPT (V1.9.388-A.3, refactor cirúrgico do "VOZ INSTITUCIONAL CIRÚRGICA")
- Linha 5126: `systemPrompt = isResearchMode ? RESEARCH_PROMPT : ...`
- Linha 5834: `effectiveChatModel = CHAT_MODEL` (V1.9.388-A.3 — full em research mode)
- Linha 6885: `finalText` strip `[TRIGGER_ACTION]` em research mode (V1.9.388-A.2)

## Validação empírica final (logs Edge 19/05 ~22h-23h BRT)

```
✅ mode: "RESEARCH (Nôa Matrix)"
✅ model: "gpt-4o-2024-08-06"
✅ historyLength: 0 → 2 → 4 (progredindo local)
✅ tokensUsed: 4673 → 5042 → 5488
✅ [RAG research] 2 artigos encontrados
✅ snippet pós-A.4: "[contexto atualizado pelo medico — material foi alterado...]"
```

Trecho-prova voz intelectual Z2 (turno 3):
> "Vamos estruturar a análise com base no material que você marcou..."
> "Os papers marcados não parecem ter uma conexão direta com as queixas do paciente #6ACF, mas podem oferecer insights sobre metodologias diagnósticas ou efeitos de medicamentos que podem ser relevantes dependendo do contexto clínico."
> "Há alguma conexão entre os papers marcados e as queixas do paciente que você gostaria de explorar mais a fundo?"

Z2 mantido (não prescreveu, não diagnosticou, não categorizou por doença) + voz conversacional (perguntas de volta, dúvida própria, debate honesto) = princípio Z2 intelectual confirmado.

## O que NÃO foi tocado (Locks preservados)

- AEC FSM (`clinicalAssessmentFlow.ts`)
- Pipeline Orchestrator (REPORT→SCORES→SIGNATURE→AXES→RATIONALITY)
- Verbatim First (V1.9.86)
- AEC Gate V1.5 (V1.9.95)
- REGRA HARD §1 (Consentimento ≠ Agendamento)
- Lock V1.9.299 PBAD AD-RB ICP-Brasil ITI
- COS Kernel v5.0 (`cos_kernel.ts` + `cos_engine.ts`)
- NoaResidentAI (continua intacto pra outros chats: Esperanza clínica, AEC, Admin, Teaching)
- CLINICAL_PROMPT + TEACHING_PROMPT
- DocList/DocCount handlers em chats não-research (V1.9.388-A.5 só afeta `isResearchMode=true`)

## Próximos passos (parqueados)

- **Imediato**: deploy Edge V1.9.388-A.5 — `npx supabase functions deploy tradevision-core --project-ref itdjkfubfzmvmuxxjoae --no-verify-jwt`
- **V1.9.388-A.6 (opcional)**: keywords RAG extraindo da pergunta real (não dos cabeçalhos do contexto) — empírico `keywords: [contexto, atualizado, pelo, médico, material]` é lixo
- **Visão final eixo Pesquisa**: 4 features (F1 auto-ativação / F2 function calling / F3 dossiê / F4 fórum publicação) — ver memory `project_visao_final_eixo_pesquisa_19_05`
