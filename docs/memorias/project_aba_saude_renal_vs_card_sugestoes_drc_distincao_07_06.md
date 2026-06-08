---
name: project_aba_saude_renal_vs_card_sugestoes_drc_distincao_07_06
description: "Distincao arquitetural CRITICA: Aba 'Saude Renal' do prontuario (RenalFunctionModule, input MANUAL do medico) e DIFERENTE do Card 'Sugestoes DRC' do dashboard (RenalSuggestionsCard, AUTO-extraido pelo Sidecar V1.9.307). Pedro confundiu 07/06 noite achando que V1.9.622+623 (mexer na aba) tinha sumido o card do dashboard. Sao componentes DIFERENTES com fontes de dado DIFERENTES. Cravar mental model pra evitar repeticao."
type: project
---

# Distinção arquitetural: Aba "Saúde Renal" ≠ Card "Sugestões DRC"

## Os 2 componentes (e por que CONFUNDE)

| Aspecto | Aba "Saúde Renal" | Card "Sugestões DRC" |
|---|---|---|
| **Componente React** | `RenalFunctionModule.tsx` | `RenalSuggestionsCard.tsx` + wrapper Elite gated |
| **Localização UI** | Prontuário paciente → tab no terminal | Dashboard professional → grid Sidecars Cognitivos |
| **Quem opera** | Médico (input manual) | Médico (revisa sugestões auto) |
| **Fonte de dado** | Input direto (Cr + A/Cr + data) | Auto-extraído da FALA do paciente em AEC (Sidecar V1.9.307) |
| **Workflow** | Médico digita → calcula CKD-EPI → grava `renal_exams` | Sidecar regex parser → `renal_inline_suggestions` pending → médico aprova → vira `renal_exams` |
| **Edge Function** | Nenhuma específica (só RPC `calculate_ckd_stage`) | `renal-signal-extractor` v4 + cron V1.9.610 (15min) |
| **Tabela primária** | `renal_exams` (escreve direto) | `renal_inline_suggestions` (intermediária) + `renal_exams` (pós aprovação) |
| **Comportamento sem dados** | Empty state "Selecione um paciente" / "Nenhum exame registrado" | Pré-V1.9.624: `return null` (SUMIA). Pós-V1.9.624: empty state padrão |

## Caso empírico V1.9.624 (confusão Pedro)

**07/06 ~22h30 BRT** — Pedro tirou screenshot do grid Sidecars Cognitivos e perguntou:
> "ixi o card saiu daqui amigo?! nao era pra ter removido esse card aqui sabia ne?! o renal saude renal e uma aba o card aqui era outra coisa amigao"

**Causa real**:
- V1.9.622+623 mexeu na ABA Saúde Renal (RenalFunctionModule — input ureia→A/Cr + fontes)
- V1.9.624 fixou o CARD Sugestões DRC (assimetria empty state) — mas Pedro pensou que tinha sido sumida pela mudança da aba

**Por que confundiu**:
- Ambos têm "renal" no nome
- Ambos lidam com DRC
- Ambos mostram eGFR + estágio G
- Mas são caminhos arquiteturalmente DIFERENTES

## Mental model cravado (pra próxima)

```
PRONTUÁRIO (1 paciente por vez)
├── Tab "Saúde Renal" (RenalFunctionModule)
│   └── Input MANUAL médico
│       └── Cr + A/Cr → calcula CKD-EPI → grava renal_exams
│
DASHBOARD PROFESSIONAL (TODOS pacientes)
└── Grid "Sidecars Cognitivos"
    ├── Card "Sugestões DRC" (RenalSuggestionsCard ou Elite)
    │   └── Sidecar V1.9.307 auto-extrai da FALA
    │       └── Sugestão pending → médico aprova → vira renal_exams
    ├── Card "Sugestões Neuro" (NeuroSuggestionsCardReal)
    ├── Card "Sinais do Relato" (ReportedSignalsCardReal)
    └── Card "Cannabis no Relato" (CannabisRelatoCardReal)
```

## Convergência (onde se encontram)

- **Tabela `renal_exams`** = destino comum dos 2 caminhos
- **Função `calculateEGFR` + `classifyStage`** = lógica CKD-EPI 2021 compartilhada
- **eGFR + A/Cr** = mesmas métricas, fontes diferentes

## Regra pra mexer (anti-confusão)

**Antes de qualquer commit que envolva "renal", responder mentalmente**:
1. Estou mexendo na ABA (input médico) ou no CARD (sugestão auto)?
2. A mudança afeta o OUTRO componente? (provavelmente não — são desacoplados)
3. Se mudei só um, **explicitar no commit message** qual componente foi tocado

## Going-forward (lições)

### Pra mim (Claude)
- **NUNCA** descrever mudança como "Saúde Renal melhorada" — ambíguo, gera confusão
- Sempre dizer: "ABA Saúde Renal (RenalFunctionModule)" ou "CARD Sugestões DRC (RenalSuggestionsCard)"
- Em changelog/commit message, separar componentes

### Pra Pedro
- Quando flagar bug visual, indicar caminho UI: "Dashboard → grid Sidecars → card X" OU "Prontuário → tab Y"
- Reduz tempo de diagnóstico (eu pulo direto pro componente certo)

## Conexões

- `feedback_auditar_componente_inteiro_antes_de_touch_07_06`
- `project_4_sidecars_cognitivos_arquitetura_unica_07_06` (4 sidecars dashboard)
- `feedback_anti_padrao_apagar_funcao_sem_antecipar_07_06` (comunicação proativa)
- V1.9.307 Sidecar Renal original (Edge + tabela suggestions)
- V1.9.622-625 mudanças desta semana

## Frase ancora

> *"07/06 noite — distincao arquitetural cravada: ABA 'Saude Renal' (RenalFunctionModule, input MANUAL medico, prontuario tab) é DIFERENTE de CARD 'Sugestoes DRC' (RenalSuggestionsCard, AUTO-extraido Sidecar V1.9.307, dashboard grid). Pedro confundiu V1.9.622+623 (aba) com sumico do card V1.9.624. Ambos sao 'renal', ambos sao 'DRC', ambos mostram eGFR — MAS caminhos arquiteturais distintos. Going-forward: SEMPRE explicitar qual componente em commit/changelog. Mental model: prontuario=ABA / dashboard=CARD."*
