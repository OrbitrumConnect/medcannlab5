---
name: Visão final eixo Pesquisa — relatório → Matrix → dossiê → fórum
description: Visão arquitetural completa do eixo Pesquisa cristalizada Pedro 19/05 — jornada relatório clínico → conversa Matrix → dossiê médico → fórum/tese, mapeando o que existe vs 4 features faltantes
type: project
originSessionId: 6742fef8-9d20-43d8-a8d8-8853df0c89e9
---
## A visão (Pedro 19/05 noite, pós V1.9.388-A.4)

> "automaticamente apos o relatorio chat ficar noamatrix disposta a trocar
> ideia sobre o assunto buscar novos docs do pub caso proficional peça ou
> da base de conhecimento cruzar com relatorio e ir evoluindo seria
> isso...para no final ele fechar um relatorio dele para o forum opcao de
> salvar a conversa estrutura tudo para forum tese etc e ai ele segue
> aceita salva pdf etc ou abre um chamado para uma sala no forum e o
> desenho final do app!"

## Jornada completa do eixo Pesquisa

```
Landing → Cadastro → Nôa Esperança → AEC paciente → Relatório clínico assinado ICP
                                                              ↓
                                                  [AUTO-ATIVAÇÃO Matrix] (F1)
                                                              ↓
                Matrix conversa Z2 ←──── PubMed sob demanda (F2) ←──── Base Conhecimento
                          ↓                                                ↑
                Médico debate, cruza, evolui iterativamente
                          ↓
                  [FECHAR COMO DOSSIÊ] (F3)
                          ↓
                  ┌───────┼──────────────┐
                  ↓       ↓              ↓
                 PDF   Fórum sala (F4)  Draft tese
```

## Why
Pedro descreveu como "o desenho final do app". É o fechamento do círculo pesquisa: médico SAI do atendimento, REFLETE estruturadamente sobre o caso, FECHA produto epistemológico, ABRE para comunidade. Cada etapa preserva Z2 sem cruzar linha clínica.

Conexão Sequência Conservadora Ricardo (memory `feedback_pesquisa_materializacao_tese_ricardo_nao_drift_19_05`): indivíduo (relatório) → médico (dossiê) → coletivo (fórum) materializa empíricamente a tese cristalizada em 6+ meses documentais.

## How to apply
Quando trabalhar em qualquer feature do eixo Pesquisa, **sempre situar onde está na jornada**. Não evoluir feature isolada — pensar como ela se conecta com a etapa anterior/posterior.

## O que JÁ existe (8 peças prontas)

1. ✅ AEC paciente + relatório clínico assinado ICP (Locks V1.9.95+V1.9.299)
2. ✅ Botão "Nôa Matrix" no PatientFocusView — trigger contextual (V1.9.382)
3. ✅ `usePatientLongitudinal` hook pré-carrega relatórios + racionalidades
4. ✅ Matrix conversa Z2 com voz intelectual (V1.9.388-A.3/A.4 — memory dedicada)
5. ✅ PubMed UI anexável (V1.9.388-A.3 — reuso `pubmedService.ts` V1.9.369)
6. ✅ Base de Conhecimento citável Doc #A1 (V1.9.388-A)
7. ✅ Casos Similares marcáveis (V1.9.364+)
8. ✅ Tab "Fórum de Casos Clínicos" existe (mas precisa publicação ativa — F4)

## O que FALTA (4 features pra fechar a visão)

### F1. Auto-ativação Matrix pós-relatório
- **O quê**: Banner/toast no PatientFocusView após assinatura ICP: "Quer estruturar reflexão deste caso na Nôa Matrix?" → leva direto com `patientId` pré-carregado
- **Hoje**: médico precisa clicar botão "Nôa Matrix" no header — sem trigger automático
- **Complexidade**: Baixa — adicionar componente Toast/Banner condicional (após `report.status === 'signed'`)
- **Trigger pra implementar**: próxima sessão Pesquisa
- **Risco arquitetural**: zero — apenas UX layer no PatientFocusView

### F2. Function calling PubMed/KB no chat (Matrix invoca)
- **O quê**: Médico fala "busca pubmed sobre dor neuropática" → Matrix invoca `searchPubMed` direto via function calling do gpt-4o → resultados entram no contexto da resposta
- **Hoje**: médico precisa abrir UI lateral, digitar, clicar "+ anexar"
- **Complexidade**: Média — function calling no Edge tradevision-core
  - Definir functions: `search_pubmed(term, retmax)`, `search_knowledge_base(query)`
  - Loop de tool execution antes de gerar resposta final
  - Garantir Z2 mantido no system prompt
- **Trigger pra implementar**: após F1 + F3 (fluxo end-to-end completo primeiro)
- **Risco arquitetural**: precisa cuidado — function calling adiciona latência e custo, e modelo pode chamar functions especulativamente. Mitigação: prompt diz "use PubMed APENAS quando médico explicitamente pedir busca por evidência externa".

### F3. Fechar como dossiê (cristalização do produto epistemológico)
- **O quê**: Botão "Fechar como dossiê" no ResearchChat → estrutura conversa + cards anexados + papers PubMed citados em 3 saídas:
  - (a) **PDF do médico** (relatório próprio com voz dele, distinto do relatório clínico do paciente)
  - (b) **Submissão pra sala do Fórum** (cria sala dedicada do caso, pré-popula com dossiê)
  - (c) **Draft de tese/artigo** (formato Markdown ou DOCX exportável)
- **Hoje**: conversa fica só no chat state (perdida ao fechar tab)
- **Complexidade**: Maior das 4 — schema novo + UI + export pipeline
  - Schema: `physician_research_dossier` (id, physician_id, patient_id?, chat_messages jsonb, attached_cards jsonb, attached_papers jsonb, generated_at, format)
  - UI: botão + modal de escolha (PDF / Fórum / Tese) + preview
  - Pipeline export: render template → upload Storage → URL retorno
  - Submissão fórum: depende de F4 (publicação ativa)
- **Trigger pra implementar**: depois de F1 (fluxo end-to-end mesmo sem F2)
- **Risco arquitetural**: precisa decisão LGPD — dossiê do médico contém PHI do paciente? Se sim, mesmas regras de `clinical_reports` (RLS médico vinculado, audit log). Se anonimizado (pseudonym `#6ACF`), regras mais leves.

### F4. Fórum publicação ativa (destrava Ricardo)
- **O quê**: Resolver os 3 bloqueios técnicos identificados em memory `audit_forum_3_bloqueios_pre_publicacao_18_05` pra permitir Ricardo publicar primeiro caso conforme pedido em memory `project_ricardo_19_05_forum_validation_features_solicitadas`
- **Hoje**: Tab "Fórum" existe na UI mas publicação não fecha o ciclo
- **Complexidade**: Média — 3 bloqueios mapeados na memory dedicada
- **Trigger pra implementar**: Ricardo confirmar caso real pra publicar (sinal forte: ele pediu em WhatsApp 19/05 ~13h)
- **Risco arquitetural**: baixo — bloqueios são técnicos identificados, não decisões em aberto

## Ordem pragmática sugerida

| Prioridade | Feature | Justificativa |
|---|---|---|
| **P0** | F1 + F3 | Fluxo end-to-end completo (mesmo sem function calling). Médico faz relatório → Matrix → fecha dossiê PDF. Já é uma vitória de produto observável. |
| **P1** | F4 | Destrava Ricardo (gatilho humano explícito 19/05) + materializa "coletivo" da Sequência Conservadora |
| **P2** | F2 | Quality-of-life — médico não precisa abrir UI lateral. Não bloqueia jornada. |

## Conexão com BYO-LLM (memory `project_byo_llm_arquitetura_parqueada_19_05`)

Quando BYO-LLM ativar, o fluxo completo continua igual:
- LLM Router escolhe provider (OpenAI default ou médico-config)
- **MESMO RESEARCH_PROMPT V1.9.388-A.3** injetado independente do provider
- Z2 preservado porque prompt rege comportamento, não provider
- Tier 1 (gpt-4o full / claude-sonnet) → comportamento de hoje
- Tier 2 (gpt-4o-mini / claude-haiku) → degrada parcialmente em fidelidade ao prompt
- Tier 3 (gpt-3.5 / gemini-flash) → degrada mais, aceitar como experimentação

Dossiê (F3) pode ter **assinatura ICP do médico** quando ele fechar — legitimidade institucional pra apresentar em fórum ou tese, mesmo que o conteúdo seja "reflexão estruturada", não "decisão clínica".

## Ensino — gargalo paralelo (NÃO técnico)

Eixo Ensino tem infraestrutura (TRL tables, course schemas) mas falta **conteúdo dos cursos do Ricardo**. Pedro 19/05: "ensino falta cursos de ricardo por isso to aqui na pesquisa polindo".

Não é gargalo técnico — é conteúdo humano. Quando Ricardo (ou Eduardo) priorizar criar cursos, ativar TRL existente.

## Frase âncora Pedro 19/05

> "passando por todos os eixos desde landing page a criacao de noa eixo
> clinico ensino e pesquisa agora! ensino falta cursos de ricardo por isso
> to aqui na pesquisa polindo e estrurutando com essa visao"

> "eixo pesquisa não é tab. é jornada: relatório → matrix conversa →
> dossiê médico → fórum sala. cada etapa preserva Z2 estrutural sem
> cruzar linha clínica."

## Memorias relacionadas
- `feedback_z2_nao_e_burrice_voz_intelectual_19_05` — princípio Z2
- `project_v1_9_388_matrix_voz_z2_pubmed_19_05` — snapshot técnico V1.9.388
- `project_ricardo_19_05_forum_validation_features_solicitadas` — gatilho humano F4
- `audit_forum_3_bloqueios_pre_publicacao_18_05` — bloqueios técnicos F4
- `project_byo_llm_arquitetura_parqueada_19_05` — compat futura
- `feedback_pesquisa_materializacao_tese_ricardo_nao_drift_19_05` — Sequência Conservadora
