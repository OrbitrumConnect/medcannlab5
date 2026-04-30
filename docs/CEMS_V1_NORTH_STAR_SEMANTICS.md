# CEMS v1 — Clinical Event & Metrics Spec (North Star)

**Status:** Aguardando validação clínica do Dr. Ricardo Valença.
**Data:** 30/04/2026
**Autoria técnica:** Pedro Henrique Passos Galluf (CTO) com Claude Opus 4.7
**Decisão clínica pendente:** Dr. Ricardo Valença (criador do método AEC)

---

## Por que este documento existe

A FASE 1 (V1.9.100) e FASE 2.1+2.2 (V1.9.101) já estão **aplicadas em produção** com semântica clínica simples (não-ambígua):

- ✅ `aec_finalized` = `clinical_reports.signed_at IS NOT NULL` (assinatura digital concluída)
- ✅ `patient_followup_scheduled` = `INSERT em appointments` (agendamento criado)

Para os **4 eventos restantes**, cada definição técnica determina **o que conta como decisão médica observável**. Sem alinhamento clínico explícito, hooks em frontend ficam amarrados a interpretações que podem precisar de retrabalho. Por isso este documento **bloqueia FASE 2.3 e 2.4** até validação Ricardo.

---

## Eventos já em produção (referência)

### ✅ aec_finalized
```
DEFINIÇÃO ATUAL: clinical_reports.signed_at populado (NULL → NOT NULL)
GATILHO:         trigger SQL trg_ns_aec_finalized_insert/update (V1.9.101)
SIGNIFICADO:     método AEC executado integralmente até assinatura digital
EXCLUSÕES:       reports incompletos, reports sem assinatura, reports legacy
FALLBACK:        nenhum — sem signed_at não é AEC finalizada
```

### ✅ patient_followup_scheduled
```
DEFINIÇÃO ATUAL: AFTER INSERT em appointments
GATILHO:         trigger SQL trg_ns_followup_scheduled (V1.9.101)
SIGNIFICADO:     paciente engajou em continuidade de cuidado
EXCLUSÕES:       — (qualquer agendamento conta no momento)
FALLBACK:        nenhum
QUESTÃO ABERTA:  apenas appointments com type='consultation' deveriam contar?
                 Ou retornos administrativos (ex: 're-receita') também?
                 → DECISÃO PARA CEMS v1.1
```

---

## Eventos pendentes — escolher 1 opção em cada

### 🔴 physician_review_started

**O que define "atenção médica iniciada" no sistema?**

| Opção | Disparo | Implicação | Recomendação técnica |
|---|---|---|---|
| **A** | Abrir dashboard `/profissional/dashboard` | Conta tempo "olhando lista de relatórios" | ❌ ruído alto (médico abre dashboard pra agenda, mensagens, etc) |
| **B** | Abrir página de relatório específico (`/relatorios/:id`) | Médico clicou no relatório pra ler | 🟡 razoável, mas pode ser scroll rápido |
| **C** | Abrir modal/view do relatório AEC + carregar dados | Confirmação de leitura ativa | 🟢 **mais limpo** |
| **D** | Médico começa a editar 1º campo | Decisão deliberada de revisão | 🟡 perde quem só lê e aprova sem editar |
| **E** | API GET `/api/reports/:id/details` (com tempo > 3s) | Backend determinístico | 🟡 difícil distinguir browse vs revisão |

**Recomendação preliminar Claude:** **C**. Captura o evento exato em que o médico abriu o relatório clínico para revisão, sem capturar navegação superficial.

**Decisão Ricardo:** [ ] A   [ ] B   [ ] C   [ ] D   [ ] E   [ ] outra: __________

---

### 🔴 physician_review_ended

**O que define "decisão clínica concluída"?**

| Opção | Disparo | Implicação | Recomendação técnica |
|---|---|---|---|
| **A** | Click em "Aprovar" / "Salvar" | Decisão deliberada do médico | 🟢 **mais explícito** |
| **B** | Fechar modal / sair da página | Inclui aprovação implícita | 🟡 pode ser "saí pra ver outra coisa" (= não revisou) |
| **C** | Última edição + N segundos sem ação | Heurística de "estou pensando" | 🔴 frágil, depende de timer |
| **D** | Mudança em `clinical_reports.review_status` (draft → reviewed) | DB-driven, não UX | 🟢 **mais robusto** se o sistema atualiza esse campo |
| **E** | Combinação: A OU D (qualquer um dispara) | Cobre 2 caminhos | 🟢 mais resiliente |

**Recomendação preliminar Claude:** **D ou E**. Usar `review_status` como source of truth se o sistema atualiza esse campo (precisa verificar se hoje atualiza). Senão, **A** explícito.

**Decisão Ricardo:** [ ] A   [ ] B   [ ] C   [ ] D   [ ] E   [ ] outra: __________

**Pergunta técnica complementar:** o que acontece com `clinical_reports.review_status` hoje? É populado automaticamente ou manualmente? Pedro precisa confirmar antes de Ricardo decidir entre **A** vs **D** vs **E**.

---

### 🔴 physician_override

**O que conta como "discordância significativa do médico" em relação ao relatório AEC?**

| Opção | Disparo | Implicação |
|---|---|---|
| **A** | Qualquer edição em qualquer campo | Inclui "corrigir vírgula" — ruído enorme |
| **B** | Edição que muda > N caracteres em algum campo | N a definir (ex: 50 chars, 100 chars?) |
| **C** | Edição em campos clínicos críticos (lista a definir) | Define "campos críticos" |
| **D** | Mudança em campos específicos validáveis: diagnóstico / dose / risco / conduta | Mais limpo clinicamente |
| **E** | Combinação: B + D (mais que N chars EM campo crítico) | Mais robusto |

**Lista de campos críticos (Opção D ou E)** — Ricardo decide quais entram:

| Campo do relatório | Crítico? | Justificativa clínica |
|---|---|---|
| Diagnóstico / impressão clínica | [ ] sim [ ] não | |
| Conduta sugerida | [ ] sim [ ] não | |
| Posologia / dose | [ ] sim [ ] não | |
| Classificação de risco | [ ] sim [ ] não | |
| Lista indiciária | [ ] sim [ ] não | |
| Anamnese (queixa principal) | [ ] sim [ ] não | |
| História patológica pregressa | [ ] sim [ ] não | |
| Plano terapêutico | [ ] sim [ ] não | |
| Recomendações de exames | [ ] sim [ ] não | |
| Texto livre / notas | [ ] sim [ ] não | |

**Recomendação preliminar Claude:** **D**. Mais simples de implementar, mais legível clinicamente, e Ricardo decide a lista de campos críticos com base no método AEC.

**Decisão Ricardo:** [ ] A   [ ] B   [ ] C   [ ] D   [ ] E   [ ] outra: __________

---

### 🔴 patient_returned_spontaneous

**O que conta como "retorno espontâneo do paciente"?**

| Opção | Disparo | Implicação |
|---|---|---|
| **A** | Qualquer mensagem em `chat_messages` após AEC | Inclui "oi tudo bem" — ruído |
| **B** | Mensagem em `chat_messages` com conteúdo clínico (palavras-chave) | Subjetivo, pode falhar |
| **C** | Agendamento criado pelo paciente (não pelo sistema) | Concreto, mas perde retornos via chat |
| **D** | Qualquer interação ATIVA: chat OR agendamento OR consulta concluída | Mais inclusivo |
| **E** | Combinação D mas excluindo se o sistema disparou prompt nas últimas 24h | Mais limpo (anti-falso-positivo) |

**Janela temporal:**
- [ ] 7 dias (engajamento agudo)
- [ ] 14 dias (curto prazo)
- [ ] 30 dias (médio — recomendação atual North Star)
- [ ] 60 dias (longo)
- [ ] outra: __________

**Tipo de janela:**
- [ ] Corridos (calendário)
- [ ] Úteis (Seg–Sex)

**Recomendação preliminar Claude:** **E + 30 dias corridos**. Captura intenção real do paciente sem contar respostas a prompts do sistema (anti-Hawthorne effect).

**Decisão Ricardo:** [ ] A   [ ] B   [ ] C   [ ] D   [ ] E   [ ] outra: __________
**Janela:** [ ] 7d  [ ] 14d  [ ] 30d  [ ] 60d
**Tipo:**   [ ] corridos  [ ] úteis

---

## Próximos passos após validação Ricardo

1. Pedro encaminha CEMS v1 ao Dr. Ricardo Valença para validação clínica
2. Ricardo marca opções escolhidas + comentários se necessário
3. Pedro/Claude criam CEMS v1.1 com decisões finais
4. FASE 2.3 implementação (frontend hooks com semântica clara)
5. FASE 2.4 implementação (cron Edge Function com semântica clara)
6. Smoke test E2E + 1º paciente externo com instrumentação completa

## Critério de "CEMS validado"

CEMS v1 está validado quando:
- [ ] 4 eventos pendentes têm 1 opção escolhida cada
- [ ] `physician_override` tem lista de campos críticos definida (se Opção D ou E)
- [ ] `patient_returned_spontaneous` tem janela e tipo definidos
- [ ] Ricardo deu OK explícito por escrito (WhatsApp ou e-mail)

Sem todos os 4 acima, **bloqueio mantido em FASE 2.3 e 2.4**.

---

## Princípios aplicados

```
🛑 Instrumentação ANTES do teste — feedback_instrumentacao_antes_do_teste.md
   Hooks com semântica ambígua = coleta de ruído.
   "Métrica é coleta. Instrumentação é PROJETO de aprendizado."

🛑 Anti-superestimação — recusar definições "óbvias" quando há 5 opções
   válidas. Pular para a 1ª que aparece = retrabalho garantido.

🛑 Anti-substituição silenciosa (P10) — definição técnica não pode
   substituir definição clínica. Esta é decisão de Ricardo, não Pedro
   nem Claude.

🟢 Lock V1.9.95+97+98+99-B preservado — esta pausa NÃO toca em
   nenhum código. É só documento de decisão.
```

---

## Frase âncora

> *"M1 e time_to_followup ativos em prod. M2/M3/patient_returned PAUSADOS
> aguardando semântica clínica do Ricardo. Definir UX antes de codar UX
> = anti-retrabalho. Hooks com semântica ambígua = coleta de ruído.
> Decisão clínica não terceirizada para Claude nem Pedro."*
