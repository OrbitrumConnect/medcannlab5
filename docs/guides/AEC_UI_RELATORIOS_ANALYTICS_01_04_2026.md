# AEC, relatórios, analytics — selamento técnico (01/04/2026)

**Objetivo:** registrar o que mudou no código, **como era antes**, **problemas**, **por que** corrigimos e **como** resolvemos — para IA e humanos retomarem sem reabrir o fio inteiro do chat.

**Referências cruzadas:** `DIARIO_01_04_2026.md` (§6+), `docs/TIMELINE_LIVRO_MAGNO_DIARIOS_CONSOLIDADO.md` §6.8 / §7, `docs/LIVRO_MAGNO_DIARIO_UNIFICADO.md` (entrada 01/04/2026).

---

## 1. Resumo executivo

| Área | Sintoma (antes) | Correção (depois) |
|------|-----------------|---------------------|
| Chat Nôa | Botões duplicados (mesmos `app_commands` + `buttonCommands`) | Uma fonte + dedupe por `type`+`target` |
| Fluxo AEC | `INTERRUPTED` + conclusão empilhavam comandos; consentimento sem tag fiável | `else if`; texto de encerramento + `[ASSESSMENT_COMPLETED]` no consentimento; fase `INTERRUPTED` explícita |
| Relatórios UI | Texto RAG `[CONTEXTO CRÍTICO…]` nos campos persistidos | `stripPlatformInjectionNoise` reforçado + aplicação em **todo** o pipeline de exibição/download em `ClinicalReports.tsx` |
| Analytics KPI | “+62%” parecia ganho clínico; era só `atual − anterior` | Rótulo **pts**; tooltip; ícone **ℹ** no título “Indicadores de Saúde” |
| Modal histórico | “Não especificada” com JSON AEC cheio | `getAecReportModalPayload()` mapeia `queixa_principal`, lista indiciária, desenvolvimento, HPP, etc. |
| **Finalize / relatório vazio com conversa cheia** | Core só extraía da conversa se faltasse queixa **e** lista; JSON “fino” saltava extração → consenso pendente com 21 msgs no modal | `tradevision-core` `finalize_assessment`: também extrai quando há queixa/lista mas **sem** corpo clínico (HDA/HPP) **e** sem perguntas objetivas preenchidas (`contentStructurallyThin`); histórico até **120** interações |

---

## 1.1 Segurança e limites (finalize + extração GPT)

- **Isolamento:** o histórico vem de `ai_chat_interactions` com `.eq('user_id', assessmentData.patient_id)` — não cruza pacientes.
- **Quando corre:** só se `contentIsEmpty` **ou** `contentStructurallyThin` (definição no código: sem desenvolvimento/HPP úteis **e** sem `perguntas_objetivas` com valores). Relatórios já bem preenchidos no JSON **não** são substituídos por este gatilho.
- **Risco residual:** como qualquer extração por LLM, erros ou omissões são possíveis; o prompt exige não inventar dados. **Relatórios já gravados antes do deploy** não são atualizados sozinhos — só **novas** finalizações após deploy da Edge.
- **Operação:** após alterar `tradevision-core`, é necessário **`supabase functions deploy tradevision-core`** (ou pipeline equivalente) para produção.

---

## 2. Ficheiros alterados (lista de trabalho)

| Ficheiro | O quê |
|----------|--------|
| `src/components/NoaConversationalInterface.tsx` | Deixou de concatenar `metadata.app_commands` com `buttonCommands` quando redundantes; dedupe |
| `src/lib/noaResidentAI.ts` | `isCompleted` vs `aecInterruptedThisTurn` em **else if** para não duplicar pacotes de comando |
| `src/lib/clinicalAssessmentFlow.ts` | Consentimento (sim): encerramento + tag; `INTERRUPTED` com retomar vs orientação; `wantsRestart` sem bloquear fase pausada; precedência `&&`/`||` em deteção “retomar avaliação”; `stripPlatformInjectionNoise` com múltiplas passagens + bloco sem `[FIM DO CONTEXTO]` |
| `src/components/ClinicalReports.tsx` | Helpers `stripClinical` / listas; mapagem de relatórios, modal, download e conversa com limpeza; lista indiciária item a item |
| `src/components/PatientAnalytics.tsx` | `getScoreChange` → **pts** e `typeof previous === 'number'`; botão Info + `title`; `getAecReportModalPayload` + modal e cópia e linha do histórico |
| `supabase/functions/tradevision-core/index.ts` | `finalize_assessment`: `shouldExtractFromChat = contentIsEmpty \|\| contentStructurallyThin`; limite de mensagens para extração **120** |

---

## 3. Antes vs depois (por tema)

### 3.1 Botões duplicados no chat

- **Antes:** UI fazia `[...app_commands, ...buttonCommands]`; o hook já repetia parte do mesmo conjunto → **duas fileiras** de “Ver relatório / Painel / Agendamentos”.
- **Por que:** duas fontes para a mesma semântica.
- **Como:** usar uma lista canónica + dedupe normalizado (`type` + `target`).

### 3.2 Avaliação interrompida vs finalizada

- **Antes:** Mensagens e comandos podiam sobrepor-se; consentimento às vezes não levava a tag que o cliente usa para `finalize_assessment`.
- **Por que:** fluxo `INTERRUPTED` caía em ramos genéricos; dois `if` seguidos para completed e interrupted.
- **Como:** ramo `INTERRUPTED` dedicado; `else if` entre completed e interrupted; consentimento “sim” inclui texto selado + `[ASSESSMENT_COMPLETED]` conforme roteiro.

### 3.3 Relatórios com “lixo” RAG

- **Antes:** Injeção de documentos no prompt era copiada para respostas e **gravada** em `queixa_principal`, listas, etc.; a UI só limpava um campo.
- **Por que:** persistência espelhava texto do modelo sem filtrar blocos de contexto.
- **Como:** regex iterada + remoção de sufixo sem fechamento; **strip** em histórico agregado, modal `rawContent`, download, conversa, racionalidades.

### 3.4 Analytics “subiu 60% numa avaliação”

- **Antes:** `diff = current - previous` mostrado como `+diff%` → leitura errada (**pontos** na escala 0–100, não variação percentual).
- **Por que:** label enganosa; relatório anterior com score baixo vs novo completo.
- **Como:** `+X pts`; tooltip no selo; ícone **ℹ** com explicação no cabeçalho da secção.

### 3.5 Modal “Relatório Clínico” vazio

- **Antes:** Leitura só de `mainComplaint`, `history`, `recommendations` (legado IMRE).
- **Por que:** relatórios AEC usam chaves em PT (`queixa_principal`, `lista_indiciaria`, …).
- **Como:** `getAecReportModalPayload(content)` constrói queixa, histórico narrativo e blocos de investigação a partir da estrutura AEC (+ strip).

---

## 4. Estado atual esperado (pós-patch)

- Paciente vê **um** conjunto coerente de ações após interrupção/conclusão.
- **Meus relatórios** e **download** não exibem blocos `[CONTEXTO CRÍTICO…]` (dados antigos no DB continuam lá; a **vista** limpa).
- **Indicadores de Saúde** comunicam **pontos vs relatório anterior**, com ajuda contextual.
- **Histórico de Avaliações** → modal mostra conteúdo AEC quando existir no JSON.

---

## 5. O que ainda não é garantido pelo patch

- **Qualidade clínica** da queixa principal se o utilizador só disse “apenas” — isso é dado capturado, não mágica de UI.
- **Relatório vazio no DB** (finalização sem gravar `content`) continua vazio até corrigir pipeline de `finalize_assessment` / Core.
- **Deploy:** alterações são no repo; produção só reflete após build/deploy.

---

## 6. Verificação rápida (smoke)

1. Completar ou interromper AEC → sem botões duplicados.  
2. Abrir **Meus Relatórios Clínicos** → queixa/lista sem blocos RAG visíveis (registos antigos sujos).  
3. **Analytics** → selos com **pts**; hover no **ℹ**.  
4. Clicar item no **Histórico de Avaliações** → queixa/histórico preenchidos se `content` tiver campos AEC.

---

*Documento selado em 01/04/2026. Sem credenciais.*
