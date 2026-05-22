---
name: Ricardo 19/05 — validação Fórum + 2 features novas solicitadas + proposta chat pesquisa Pedro
description: Conversa WhatsApp Ricardo+Pedro 19/05 ~13h ativou triggers parqueados. Ricardo pediu EXPLÍCITAMENTE 2 features novas (envio de artigos + convidar colegas pro Fórum) e confirmou pipeline Casos Similares → Literatura → Fórum como ambiente de pesquisa institucional (com ponto de interrogação pendente). Trigger ativado: `audit_forum_3_bloqueios_pre_publicacao_18_05` deixa de ser parqueado e vira pré-requisito urgente. Pedro propôs durante conversa: chat assistente de pesquisa não-diretivo + BYO-LLM como economia. Material B GPT externo enviado por Pedro é re-cunhagem útil pra comunicação externa (tabela bipartite "médicos vs IA"), não princípio MASTER novo.
type: project
originSessionId: 6742fef8-9d20-43d8-a8d8-8853df0c89e9
---

# Ricardo 19/05 Fórum Validation + Features Solicitadas

## Origem (19/05/2026 ~13h BRT — WhatsApp)

Pedro estava no terminal de pesquisa do MedCannLab e brincou com Ricardo sobre as abas. Ricardo respondeu antes do almoço com declaração programática sobre o Fórum.

## Material A — falas literais (peso máximo)

### Ricardo (Dr. Ricardo Valença, +55 21 98728-3734)

> *"temos que premitir o envio de artigos e tazer os outros coelgas para a conversa e discussão de casos. Vou almoçar a já volto. No fórum tazemos o relatório do paciente e apresentamos o caso clínico. Cada um dá a sua opinião"*

> *"é um local pra fazer pesquisa. é isso?"* ← **pergunta interrogativa pendente** (não declaração afirmativa, validar pós-almoço)

> *"rsrsrs"* (reagindo à brincadeira inicial de Pedro)

### Pedro Henrique Passos Galluf

Confirmação do fluxo proposto:
> *"exato! pra trazer o caso clinico proficional pode usar aba casos similares para buscar esse caso ! depois usar literatura para validar buscar docs pesquisa etc!"*

Proposta NOVA (chat assistente de pesquisa não-diretivo):
> *"por isso talvez um chat q leia os docs troca mensagens envolova melhor o pro no caso sem influenciar indicar nada! coisas asim como praticamente noa faz no aec mais ali na pesquisa! ai ele leva para o forum anonimado para debate entre conselhores e pessoas do forum ja com todo conteudo q ele pode levar!?"*

Plantando BYO-LLM com Ricardo:
> *"tava pensando mais ai fica caro pra gente... tipo se noa pudece acessar esses dados do pubmed cruzar entregar melhor analise mais gpt ja faz isso na real ja cruza e busca mais fora da aec claro num ambiente de pesquisa por isso pensei q se usuario usar o propio gpt nao sai tao caro... mais no nosso ambiente controlado tudo etc"*

## Triggers ATIVADOS por esta conversa

### 1. `audit_forum_3_bloqueios_pre_publicacao_18_05` — deixa de ser parqueado

Ontem (18/05 noite) Pedro decidiu NÃO codar Fórum até resolver 3 bloqueios. Ricardo HOJE pediu publicação de caso → trigger ativado:

| Bloqueio | Estado | Por que vira urgente HOJE |
|---|---|---|
| RLS `noa_clinical_cases` aberto (`SELECT USING (true)`) — LGPD art. 11 violado | 🔴 P0 | Ricardo quer publicar caso → fix obrigatório antes |
| Pseudonimização fraca (só `patient_initials`, padrão HIPAA exige 18 identificadores) | 🟡 P1 | Ricardo quer levar "relatório do paciente" pseudonimizado |
| Consent NFT V1.9.311 não cobre "discussão fórum" | 🟡 P1 | Sem consent específico, levar caso ao fórum = violação LGPD |

### 2. Memory `audit_back_v1_9_368_bugs_descobertos_18_05` — Casos Similares conectada

Pedro confirmou empíricamente que Casos Similares é **entrada legítima** pra fluxo de pesquisa institucional. Não é só feature isolada — é parte de pipeline.

### 3. Memory `feedback_pesquisa_materializacao_tese_ricardo_nao_drift_19_05`

Cristalizado 19/05 noite que Pesquisa últimos 2 dias = materialização tese Ricardo. Conversa de hoje **confirma 8/8 pontos do áudio Uber 19/05**:

| Ponto Ricardo (áudio Uber) | Materialização (V1.9.354+) | Validado conversa 13h? |
|---|---|---|
| Lago de dados primários | Casos Similares lê `clinical_reports` | ✅ Sim |
| Sem ChatGPT generalista | Verbatim First V1.9.86 + toggle GPT opt-in | ✅ Sim |
| Apoio à decisão. Decisão humana | "Cada um dá sua opinião" | ✅ Confirmação direta |
| Queixas literais entre aspas | V1.9.375-A blockquote queixa | ✅ Pipeline congruente |
| Cosmologia | V1.9.375-A banner ALPHA | (implícito) |

## 2 Features NOVAS pedidas explicitamente por Ricardo

### Feature A — Envio de artigos

**Quem pediu**: Ricardo literal: *"permitir o envio de artigos"*

**O que é**: Médico anexa PDF/link de artigo científico ao caso clínico ou diretamente ao Fórum.

**Estado hoje**: ❌ Não existe. `forum_posts` table existe mas vazia, sem schema pra anexos.

**Caminho técnico (parqueado)**:
- Reusar bucket `documents` (storage) — já existe
- Coluna `attachment_url` em `forum_posts` OU tabela `forum_attachments` separada
- UI upload em `ForumCasosClinicos.tsx` (1143 linhas existente)
- Princípio polir-não-inventar: reusar pattern `CertificateManagement.tsx` (upload de credencial sensível)

### Feature B — Convidar colegas pro Fórum

**Quem pediu**: Ricardo literal: *"trazer os outros colegas para a conversa e discussão de casos"*

**O que é**: Sistema de invite — médico convida colega que vira participante do Fórum.

**Estado hoje**: ❌ Não existe. `forum_posts` aberto a qualquer autenticado (bug RLS bloqueante).

**Caminho técnico (parqueado)**:
- Tabela `forum_invites` (id/inviter_id/email_invited/status pending|accepted)
- RBAC: invite só por `role='profissional'` ativo
- Email via Resend (já configurado V1.9.99-B)
- Aceitar invite cria/promove user pra membro Fórum

## Proposta NOVA Pedro (validar com Ricardo depois)

### Chat assistente de pesquisa NÃO-diretivo

**Quem propôs**: Pedro durante conversa.

**O que é**: Chat dentro do Terminal de Pesquisa que **lê os docs** (Literatura PubMed + Casos Similares + Base de Conhecimento) e **conversa com profissional sem induzir/indicar**. Diferente da Nôa AEC porque:

| Dimensão | Nôa AEC (existente) | Chat Pesquisa (proposto) |
|---|---|---|
| Função | Conduz fluxo clínico | Estrutura raciocínio |
| State AEC | Sim (FSM) | NÃO (stateless) |
| Verbatim First | Sim (hard lock por fase) | NÃO (livre conversação) |
| Persiste em prontuário? | Sim | NÃO (memória de sessão) |
| Princípio aplicável | REGRA HARD §1 + Verbatim | `feedback_limitar_autoridade_computacional_19_05` Z3 ("apoio à decisão") |
| Pode induzir conduta? | NÃO (Verbatim trava) | NÃO (prompt rígido + audit) |

**Pré-requisito técnico**: Flag `bypassFSM=true` do V1.9.376 (memory `feedback_state_pollution_noa_core_reutilizado_19_05`). Implementação parqueada — esse seria o **primeiro caller legítimo** dela.

**Status decisão**: Ricardo NÃO opinou nessa proposta durante a conversa (silencioso). **Confirmar pós-almoço** antes de codar.

### Condição crítica operacional do chat pesquisa (checklist de design)

Aplicação concreta dos princípios Z3/Z4 (`feedback_limitar_autoridade_computacional_19_05`) ao design do prompt:

| ❌ PROIBIDO (Z3/Z4) | ✅ PERMITIDO (Z1/Z2) |
|---|---|
| "Qual sua hipótese diagnóstica?" | "Liste as perguntas que esse caso levanta" |
| "Recomendo X tratamento" | "Compare as racionalidades aplicadas a este caso" |
| "A melhor abordagem é..." | "Quais papers desta busca são mais recentes?" |
| "Sintetize decisão clínica" | "Há divergência entre Caso A e Caso B? Em que dimensão?" |
| "Inferir diagnóstico" | "Agrupe os casos por padrão temporal observável" |
| "Sugerir conduta" | "Quais perguntas o médico ainda não fez sobre esse caso?" |

**Operacional**: o chat só:
1. **Compara** (Caso A vs Caso B na mesma dimensão)
2. **Estrutura** (organiza inputs em categorias auditáveis)
3. **Aponta divergência** (sem opinar qual está certa)
4. **Cita papers** (com fonte rastreável PubMed)
5. **Faz perguntas estruturadas** (sem implicar resposta)
6. **Agrupa** (por critério explícito, não inferido)
7. **Recupera histórico** (sem interpretar)

**Anti-padrão exato a evitar**: chat pesquisa começar com palavras gatilho ("recomendo", "sugiro", "indica-se", "a melhor abordagem", "hipótese provável") = invade camada errada e perde diferencial arquitetural. Audit periódico do prompt obrigatório.

**Atrito intencional** no fluxo:
- Médico marca mensagens relevantes manualmente ("anexar ao dossiê do fórum")
- Pipeline anonimização aplica 18 identificadores HIPAA
- Médico revisa dossiê pseudonimizado antes de publicar
- Médico escreve apresentação clínica do caso (não a IA)
- Confirmação explícita "Publicar no fórum" (1 click NÃO basta)

Sem atrito → vira co-piloto disfarçado → autonomia técnica vira clínica de facto.

## CHECKLIST FASE 1 (V1.9.379) — Implementação Opção A autorizada 19/05 noite

Pedro autorizou após audit empírico A vs B + 6 análises GPT externas iterativas (Material B saturação detectada por Pedro mesmo, aplicação prática do anti-dialeto-paralelo cristalizado horas antes).

### Decisão arquitetural

**Fase 1 = Opção A** (reusar `tradevision-core` com `bypassFSM=true`).
**Fase 2 = Opção B** (Edge dedicada `pesquisa-chat`) parqueada como standby.

Trigger pra migrar A→B:
- Médico não-Ricardo usar >3 sessões/semana
- OU custo Chat Pesquisa > 20% custo OpenAI mensal
- OU desperdício CLINICAL_PROMPT > R$ 100/mês
- OU feature nova exige Edge dedicada

### 8 modificações backend `tradevision-core/index.ts`

| # | Linha aprox | Modificação |
|---|---|---|
| B.1 | 290 (`processMessage`) | Detectar `uiContext.bypassFSM === true` (uiContext já existe) |
| B.2 | 321-323 | Skip `clinicalAssessmentFlow.ensureLoaded` quando bypassFSM |
| B.3 | 4899 | Adicionar 3º case `RESEARCH_PROMPT` |
| B.4 | nova const | `RESEARCH_PROMPT` ~3k chars Z2 restritivo |
| B.5 | 5251-5253 | Skip Phase Lock injection quando bypassFSM |
| B.6 | 5605 | Forçar `gpt-4o-mini` quando bypassFSM (não envar) |
| B.7 | metadata persistência | `metadata.simbologia = '🧪 Chat Pesquisa'` |
| B.8 | pós-GPT | Quality gate Failsafe bloqueia lixo |

### 4 modificações frontend

- `src/hooks/useResearchChat.ts` (NOVO) — isolado de `useMedCannLabConversation`
- `src/components/ResearchChat.tsx` (NOVO) — UI dedicada
- `src/pages/AdminCasosSimilares.tsx` (MODIFICAR) — seção "🧪 Chat Pesquisa"
- `src/lib/noaResidentAI.ts:290` (MODIFICAR) — passar `uiContext` adiante

### 5 gates não-negociáveis

| Gate | Onde |
|---|---|
| G.1 bypassFSM impede FSM AEC | Backend B.2 |
| G.2 RESEARCH_PROMPT Z2 restritivo (sem "recomendo/sugiro/melhor") | Backend B.4 |
| G.3 Simbologia `🧪 Chat Pesquisa` separa métricas | Backend B.7 |
| G.4 Quality gate Failsafe | Backend B.8 |
| G.5 Atrito intencional UX (médico marca msg manualmente) | Frontend |

### 7 smoke tests obrigatórios

| # | Teste | Critério |
|---|---|---|
| T.1 | Chat pesquisa aberto | FSM AEC não carrega |
| T.2 | 10 turnos | Zero stub `clinical_report` criado |
| T.3 | Audit 5 respostas | Nenhuma palavra gatilho |
| T.4 | 20 turnos | Custo < $0.01/turn |
| T.5 | OpenAI 429 | Mensagem amigável, sem lixo persistido |
| T.6 | Painel V1.9.374-A | `🧪 Chat Pesquisa` métricas separadas |
| T.7 | Levar ao fórum | Atrito explícito + pseudonimização |

### Ordem de implementação (4 commits)

```
V1.9.379-A — bypassFSM core (B.1, B.2, B.5) + T.1 smoke
V1.9.379-B — RESEARCH_PROMPT + mini + simbologia (B.3-B.8) + T.3, T.5
V1.9.379-C — Frontend hook + componente (F.1, F.2, F.4)
V1.9.379-D — Frontend integration + UX atrito + smoke completo
```

Cada commit: type-check + push 4 refs + smoke isolado antes do próximo.

### Estratégia rollback

Cada commit isolado = rollback granular via `git revert <hash>`:
- Reverter V1.9.379-D mantém backend funcionando
- Reverter V1.9.379-C+D mantém só backend (frontend offline)
- Reverter A+B+C+D restaura HEAD `9333988` (pré-Fase 1)

Lock V1.9.95+97+98+99-B+299 intocado em qualquer cenário.

### 5 decisões humanas pendentes ANTES de V1.9.379-A começar

| Decisão | Quem |
|---|---|
| Conteúdo RESEARCH_PROMPT (~3k chars literal) | Pedro + Ricardo aprovar |
| Inputs anexáveis Fase 1 (Casos + Literatura + KB?) | Pedro |
| UX (tab vs modal vs sidebar) | Pedro |
| Simbologia oficial (`🧪` confirma?) | Pedro |
| Threshold quality gate Failsafe | Pedro |

Sem essas 5 decisões resolvidas, V1.9.379-A não começa. Princípio `feedback_arquitetura_de_confianca_antes_de_feature_delivery_18_05`.

### BYO-LLM plantado com Ricardo

Pedro disse: *"se usuario usar o propio gpt nao sai tao caro"*. Ricardo NÃO respondeu explicitamente.

**Status**: trigger BYO-LLM (`project_byo_llm_arquitetura_parqueada_19_05`) continua parqueado. Aceito Ricardo não-validado, mas Pedro plantou semente. Observar próxima conversa.

## Material B GPT externo (interpretação enviada por Pedro — re-cunhagem útil)

Pedro enviou texto GPT externo durante a conversa que cunha pipeline:
> *"Paciente → AEC → Relatório → Casos Similares → Literatura → Fórum → Pesquisa institucional"*

**Análise honesta**:

| Dimensão | Avaliação |
|---|---|
| Re-cunhagem? | ✅ Sim — "ambiente de raciocínio clínico auditável", "sistema operacional clínico multiagente", "camada operacional soberana" já em memórias/pitch desde 03/02 |
| Inventa arquitetura nova? | ❌ Não |
| Útil pra Conselho Técnico? | ✅ Sim — vocabulário pronto pra comunicação externa |
| Justifica cunhar princípio MASTER? | ❌ Não — anti-padrão `feedback_polir_nao_inventar` |

**Única contribuição operacional realmente útil**: tabela bipartite

```
Médicos  → discutem, discordam, anexam artigos, comparam, revisam, produzem pesquisa
IA       → estrutura, organiza, resume, busca literatura, encontra padrões, navegação cognitiva
```

Vale capturar como **referência pra pitch/apresentação externa**, NÃO como princípio doutrinário.

## Coisas que NÃO devem virar princípio MASTER (anti-padrão evitado)

| Tentação retórica GPT externo | Por que NÃO cunhar |
|---|---|
| "Sistema começa a virar ambiente de raciocínio clínico auditável" | Antigravity 03/02 + pitch 14/05 já têm vocabulário — não é "começando" |
| "Multiagente humano+IA" | Hoje 1 IA. Multiagente requer Ricardo+Eduardo+colegas ATIVOS — Marco 3 pendente |
| "Pesquisa institucional longitudinal" | TESE conceitual ≠ produto vivo (`feedback_pesquisa_materializacao_tese_ricardo_nao_drift_19_05`) |
| "Coordenação coletiva" | Aspirada, não atingida — Fórum tem 0 rows |
| "Doctor replacement vs ferramenta subordinada" | Boa síntese visual mas re-formula `feedback_viabilidade_tecnica_vs_legitimidade_epistemologica_18_05` |

Aplicação direta de `feedback_material_a_b_c_separacao_19_05`: re-cunhagem precipitada = inflação de autoridade alheia.

## Sequência Conservadora Ricardo confirmada empíricamente

A conversa de Ricardo materializa a sequência cristalizada em `feedback_pesquisa_materializacao_tese_ricardo_nao_drift_19_05`:

```
indivíduo → próprio médico → coletivo institucional
   ↓             ↓                    ↓
paciente    profissional         conselheiros
   ↓             ↓                    ↓
AEC      Casos Similares          Fórum
         + Literatura           (pseudonimizado)
         + chat assistente
           (proposta)
```

**8/8 pontos do áudio Uber Ricardo 19/05 manhã têm reificação direta confirmada por esta conversa de 13h**.

## Pergunta interrogativa Ricardo pendente

> *"é um local pra fazer pesquisa. é isso?"*

**Atenção crítica**: frase com **ponto de interrogação**. Ricardo NÃO está totalmente alinhado com "Fórum como ambiente de pesquisa institucional" — está **validando se entendeu**. Tratar como afirmação cega seria Material A com pressa.

**Trigger pendente**: confirmação explícita pós-almoço de Ricardo: "Sim, Fórum é local de pesquisa institucional, certo?" — pergunta interrogativa precisa virar afirmativa antes de cunhar isso como tese consolidada.

## Prioridades operacionais decorrentes

### Tier 1 — Resolver 3 bloqueios Fórum (urgente, Ricardo pediu)

| Item | Memory base | Risco fix |
|---|---|---|
| Fix RLS `noa_clinical_cases` (P0) | `audit_forum_3_bloqueios_pre_publicacao_18_05` | Pequeno, isolado |
| Pseudonimização forte (P1) | Mesma memory | Médio — schema novo |
| Consent NFT estendido "discussão fórum" (P1) | Mesma memory | Médio — depende advogado |

### Tier 2 — Features novas Ricardo

| Feature | Pré-requisito | Estado |
|---|---|---|
| Envio de artigos | Bucket `documents` ou novo + schema `forum_attachments` | Parqueado |
| Convidar colegas | `forum_invites` + email Resend | Parqueado |
| Threading opiniões | `forum_comments` table já existe (vazia) | Reativar UI |

### Tier 3 — Proposta Pedro (validar com Ricardo antes)

| Item | Status |
|---|---|
| Chat assistente de pesquisa não-diretivo | Aguardando Ricardo confirmar pós-almoço |
| Decisão Edge dedicada vs flag `bypassFSM` no Core | Parqueado até GO |
| BYO-LLM | Plantado, sem aceite explícito Ricardo |

## Decisões humanas pendentes (não-código)

- **Ricardo pós-almoço 19/05**: confirmar "Fórum = local de pesquisa institucional" (pergunta interrogativa virar afirmativa)
- **Ricardo**: opinar sobre chat assistente de pesquisa (Pedro propôs, Ricardo silencioso)
- **Ricardo**: opinar sobre BYO-LLM (Pedro plantou, Ricardo silencioso)
- **Pedro + João + advogado**: termo NFT específico pra "discussão Fórum"
- **Pedro + Ricardo**: pseudonimização padrão HIPAA 18 identificadores OU padrão clínico próprio?

## Memórias correlatas

- `audit_forum_3_bloqueios_pre_publicacao_18_05` — trigger ATIVADO por esta conversa
- `feedback_pesquisa_materializacao_tese_ricardo_nao_drift_19_05` — 8/8 pontos confirmados
- `feedback_state_pollution_noa_core_reutilizado_19_05` — flag `bypassFSM` é pré-requisito chat pesquisa
- `feedback_limitar_autoridade_computacional_19_05` — Z3 aplicado a chat pesquisa não-diretivo
- `feedback_material_a_b_c_separacao_19_05` — Ricardo+Pedro = Material A puro; GPT externo = B re-cunhador
- `project_byo_llm_arquitetura_parqueada_19_05` — Pedro plantou tema com Ricardo, sem aceite
- `feedback_polir_nao_inventar` — re-cunhagem GPT externo NÃO vira princípio MASTER novo
- `feedback_publicacao_nao_e_exploracao_interna_18_05` — Fórum (publicação) ≠ Casos Similares (exploração)
- `feedback_arquitetura_de_confianca_antes_de_feature_delivery_18_05` — 3 bloqueios pré-publicação não-negociáveis

## Frase âncora

> *"Conversa WhatsApp Ricardo+Pedro 19/05 ~13h ativou empíricamente 3 triggers parqueados (Fórum bloqueios + Casos Similares como entrada de pipeline + BYO-LLM plantado), confirmou 8/8 pontos áudio Uber 19/05, e Ricardo pediu 2 features NOVAS (envio de artigos + convidar colegas). Pedro propôs 1 feature inédita (chat assistente de pesquisa não-diretivo) que aguarda opinião Ricardo. Pergunta interrogativa Ricardo ('é um local pra fazer pesquisa, é isso?') precisa virar afirmativa antes de cunhar tese consolidada. Material B GPT externo (tabela bipartite médicos/IA) é re-cunhagem útil pra comunicação externa, NÃO princípio MASTER novo. Sequência Conservadora indivíduo→médico→coletivo materializada empíricamente."*

— Cristalizado 19/05/2026 noite após sessão técnica V1.9.376 + V1.9.324-B + V1.9.377 + audit empírico Fórum via PAT.
