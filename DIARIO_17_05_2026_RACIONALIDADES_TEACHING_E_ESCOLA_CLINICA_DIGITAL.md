# 📓 Diário 17/05/2026 — Racionalidades Resolvidas + Teaching Mode Isolado + Tese Escola Clínica Digital

**Autor:** Pedro Henrique Passos Galluf (CTO MedCannLab)
**Co-autor:** Claude Opus 4.7 (1M context)
**HEAD git ao iniciar:** `d6f1dc0` (V1.9.315 prescriptions friendly labels + URL fictícia ITI)
**HEAD git ao encerrar:** `a48a188` (V1.9.323-A2 — teaching strict sticky vs navigation)
**Commits do dia:** 10 (V1.9.316 → V1.9.323-A2) + 1 empty commit Vercel rebuild
**Lock CORE intocado:** V1.9.95 + V1.9.97 + V1.9.98 + V1.9.99-B + **V1.9.299 PBAD CONFORME** (selado 16/05)
**Frase âncora do dia:** *"4 fixes errados antes de achar smart_trigger linha 3135 ensinaram que grep `buildCandidatesListText` antes de tudo vale ouro. Tese 'Escola Clínica Digital' cristalizada. Teaching isolado operacionalmente. Comentários históricos = camada de defesa epistemológica."*

---

## 📚 Capítulos anteriores (resumo)

### 13/05 — Pré-evento ~20 testers (DIARIO_13_05_2026_PRE_EVENTO.md)
- 9 versões em 36h (V1.9.228 → V1.9.237), 5 exceções legítimas ao freeze
- **Marco constitucional Ricardo (3 camadas)**: triagem narrativa pública / AEC formal / consulta humana — desbloqueia Camada 1 sem violar anti-kevlar §1
- **Frase âncora institucional Ricardo**: *"O sistema digital serve ao relacionamento clínico longitudinal. O valor não está na IA em si, mas na continuidade humana que ela consegue sustentar."*
- V1.9.238 token = métrica operacional de escuta longitudinal (Ricardo 13.740 tok/turn vs Cristiano 1.423 = 9,6×)

### 14/05 — D-1 evento (DIARIO_14_05_2026_CHECKLIST_EVENTO.md)
- Checklist 100% pronto pra ~20 amigos quinta 20h
- AEC + Pipeline + Devolução médico + NFT Galeria + Solicitação Exames + Equipe Clínica todos validados
- V1.9.277-279 fixes mobile/laptop (paddingBottom safe-area + chat scroll laptops pequenos + header chat compactado)

### 15/05 — Pós-evento + PDF ICP REAL (DIARIO_15_05_2026_PDF_ICP_REAL.md)
- V1.9.296 (JWT detection) + V1.9.297 (heartbeat 60s) + V1.9.298 (UI ICP honesta — removeu URL `validacao.iti.gov.br` fictícia)
- Pergunta crítica Ricardo: *"esse certificado q gera valid no ITI?"* → diagnóstico 25+ docs assinados via `digital-signature` (V1.9.176) sofrem mesmo problema (PKCS#7 sobre JSON, não embedded `/Sig` no PDF)
- Decisão Pedro: Opção A — edge nova `sign-pdf-icp` paralela, zero regressão
- 5 iterações V3→V7 ICP-Brasil, V7 deployada aguardando smoke ITI

### 16/05 — Sidecar Renal + PBAD CONFORME (DIARIO_16_05_2026_SIDECAR_RENAL_E_PBAD_AD_RB.md)
- **Manhã**: V1.9.307 sidecar renal (extrai creatinina/proteinúria da anamnese, calcula CKD-EPI 2021, sugere com aprovação humana). 8 salvaguardas GPT aplicadas. Sidecar paralelo, AEC FSM 100% intocada
- **Tarde**: V1.9.299→V12 iterações PBAD AD-RB ICP-Brasil — 7 iterações em 1 dia, validador ITI oficial 16h31: "Aprovado" + 6/6 atributos Valid. Tag `v1.9.299-pbad-conforme-locked`
- **Noite**: V1.9.310 Clinical Cockpit Mode + V1.9.311 NFT Consent + V1.9.312 Activity Timeline + V1.9.312-B LGPD admin fix + V1.9.313 Meus Exames + V1.9.314 PatientQuickActions + V1.9.315 prescriptions
- **Estado herdado HOJE**: tag `v1.9.299-pbad-conforme-locked`, sidecar renal pending aprovação Maria, racionalidades NÃO testadas empíricamente

---

## ⏱️ Timeline cronológica 17/05

### 🌅 BLOCO A — Madrugada (00h-02h): Racionalidades quebradas + 4 fixes errados

**Trigger empírico Ricardo via Pedro**: testou racionalidades de Maria das Dores ontem noite (16/05 23h01-23h20) e Nôa devolveu:
> *"Você deseja abrir qual documento? 1) A dama de stairway to heaven foi ao médico..."*

Em vez de análise clínica estruturada. 5 racionalidades viraram lixo no banco (`clinical_rationalities`).

**Diagnóstico empírico inicial**:
- [tradevision-core/index.ts:4542](supabase/functions/tradevision-core/index.ts#L4542): keyword `[DOCUMENT_LIST]` inclui `"avaliação clínica"`, `"avaliação renal"`, `"avaliação nefrológica"`
- Prompt da racionalidade biomédica começa com *"Analise este relatório clínico do ponto de vista biomédico..."* → casa com keyword → GPT emite `[DOCUMENT_LIST]` → devolve lista PDFs

**V1.9.316 (01h04)** — bypass DOCUMENT_LIST quando tag `[RATIONALITY_ANALYSIS_MODE]` presente no payload. 3 mudanças cirúrgicas. AEC intocada.

**V1.9.317 (08h51)** — frontend bypass platform actions em racionalidade. Descoberta colateral: 9 reports placeholder vazios existem desde nov/2025 (Pedro+Ricardo+Eduardo+João testando AEC viraram patient_id). Pedro **proibiu deletar** — são pegadas históricas legítimas.

### 🌄 BLOCO B — Manhã (09h-12h): Os 4 fixes errados antes da causa raiz

**Empírico**: mesmo após V1.9.316+317, bug persistiu. Investigação revelou:

**V1.9.318 (09h12)** — revert V1.9.308 RAG híbrido. Hipótese inicial: PDFs no contexto faziam GPT classificar erroneamente. **Resultado**: zero impacto. Bug continuou.

**V1.9.319 (09h20)** — regex robusto no Core detectando prompt fixo `/Analise este relatório clínico do ponto de vista/i`. **Resultado**: ainda não pegou. Bug continuou.

**Audit profundo via PAT + grep revelou o erro arquitetural meu**: V1.9.316/317/318/319 todos atuavam **DEPOIS do GPT** (no bloco DOCUMENT_LIST trigger linha 6283). Mas o curto-circuito real acontecia **ANTES do GPT** no **smart_trigger linha 3135**:

```ts
if (!isAnalyzeOpenDocRequest && (isDocRequest || isDocListRequest)
    && !shouldBypassInterceptors && patientData?.user?.id) {
    // → buildCandidatesListText → "Você deseja abrir qual documento?"
    // → RETORNA antes de chamar GPT
}
```

**A causa real**: `detectDocumentRequest(norm)` (linha 540) retornava `true` porque texto longo da racionalidade tinha "ver", "buscar", "consultar" + "documento", "protocolo", "material". Curto-circuitava ANTES do GPT.

### 🎯 BLOCO C — V1.9.320 (09h24): Causa raiz finalmente

**Fix cirúrgico** linha 2840:
```ts
const shouldBypassInterceptors = isAecActive
    || isClinicalAssessmentStart
    || isRationalityAnalysisMessage;  // ← NOVO
```

A variável `shouldBypassInterceptors` JÁ existia (silenciava smart_trigger durante AEC). Estendido aditivamente. ZERO toque AEC.

**Validação empírica Pedro 10h12**: Maria das Dores → Análise Biomédica retornou perfeito:
> *"ANÁLISE CLÍNICA BIOMÉDICA: MARIA DAS DORES PINTO PITOCO. SÍNTESE CLÍNICA: ... 3 DIAGNÓSTICOS DIFERENCIAIS: 1. Síndrome Nefrótica (proteinúria 1924 mg/g — dado real V1.9.303 retrofix), 2. Progressão DRC, 3. ICC. JUSTIFICATIVA... EXAMES (Biópsia + Eco + Urina)... CONDUTA 3 TEMPOS... INTERAÇÕES (CBD x medicamentos renais + Prelone x hiperglicemia)... REFERÊNCIAS LITERATURA... RODAPÉ CRM/LGPD."*

Análise usou dado REAL da Maria reconstruído via V1.9.303 retrofix ontem (proteinúria 1924).

**Lição cristalizada**: antes de propor fix, fazer `grep buildCandidatesListText` (e similares) pra ver TODOS os call sites. Eu vi 2 dos 3 e perdi 4 versões.

### 🧹 BLOCO D — Limpeza empírica (11h-12h): 10 lixos + 81 reports backfill

**Audit via PAT** revelou:
- 10 racionalidades bugadas em `clinical_rationalities` (5 Maria + 5 Mariana Carvalho)
- **81 reports** com row em `clinical_rationalities` mas jsonb `content.rationalities` vazio
- Pedro questionou: "ela existia até ontem? ou antes disso?" — auditoria confirmou bug **PRÉ-EXISTENTE** (primeiro lixo era de 15/05 16h33, antes mesmo de V1.9.308)

**Decisões Pedro**:
1. Deletar 10 lixos (são respostas factualmente erradas, não histórico de teste) — ✅ feito
2. NÃO deletar 9 reports placeholder vazios (pegadas históricas de testes Pedro+Ricardo+João+Eduardo) — ✅ respeitado
3. Backfill jsonb dos 81 reports — ✅ feito via UPDATE atomic

**Resultado backfill**: 81/81 reports reconciliados. UI volta a mostrar "X de 5 racionalidades aplicadas" corretamente. Sem isso, médico abriria relatório, veria "0 racionalidades" e clicaria de novo, gerando duplicatas.

### 💰 BLOCO E — V1.9.321 (12h23): Founders fantasmas + cost_usd

Pós-audit profundo identificou 2 P0 triviais:

**Founders fantasmas**: lista hardcoded no Core tinha 7 emails, mas auditoria `auth.users` mostrou que **4 NUNCA foram cadastrados**:
- `eduardo.faveret@medcannlab.com` ❌
- `eduardo@medcannlab.com` ❌
- `joao@medcannlab.com` ❌
- `jeduardo@gmail.com` ❌

Risco ativo hoje: zero. Risco latente: se alguém criar conta com qualquer um deles → elevation automática a `master`. **Defesa em profundidade trivial**: remover.

**cost_usd no noa_logs**: V1.9.238 (13/05) implementou cost observability em `ai_chat_interactions.metadata.cost_usd_estimate`, mas o dual-write falhava em 97% dos casos (65/1995 chats com cost populado). `noa_logs` é o canal AUDITORIA PRIMÁRIA. Adicionado `cost_usd` + `tokens_input` + `tokens_output` + `pricing_version` no payload. Garante observabilidade econômica confiável.

**Descoberta econômica do dia**: ~$55/mês em OpenAI hoje (11.1M tokens/30d). Plano R$99 ≈ $20. **Déficit $35/médico ativo**. Pricing precisa revisão pré-1º pagante externo.

### 📂 BLOCO F — V1.9.322 (12h37): Doc count promete e cumpre

Pedro testou no chat livre:
- "quantos documentos temos na base?" → Nôa: *"Temos 44 documentos. Você pode pedir pelo número (ex.: 1, 2, 3), pelo nome..."*
- "2" → Nôa: *"Entendi. Para abrir um documento, me diga qual documento você quer (nome/tema)..."*

**Bug UX-copy mismatch pré-existente desde commit a4c706c** (origem do arquivo): handler `isDocCountRequest` promete "pode pedir pelo número" mas NÃO cria `pending_action` implícita. Pedro: *"regressao no chat livre antes puxava docs aqui"*.

**Fix V1.9.322**: ao responder count, JÁ criar pending_action com top 5 docs. Reusa lógica do smart_trigger linha 3135. TTL 3min. Agora "2" funciona direto. Falha silenciosa se INSERT pending falhar (degradação graciosa).

### 🏛️ BLOCO G — Tarde: Tese Escola Clínica Digital cristalizada (Ricardo + GPT + Claude)

Pedro abriu conversa filosófica via WhatsApp com Ricardo após bugs corrigidos. Ricardo trouxe **fundação epistemológica** que sustenta produto inteiro:

> *"o médico quem se responsabiliza pela interpretação"*
>
> *"camada extra que coloca o decoder fora da coleta de dados"*
>
> *"estamos fazendo o que um colega faria: pesquisar sobre os dados para avaliar o caso"*
>
> *"a camada de racionalidades é um bônus"*

**Insight chave Ricardo**: separação AEC (encoder, coleta autoral autêntica) vs Racionalidades (decoder, interpretação) é arquitetural — **anti-kevlar §1 traduzido**. Foi exatamente o que protegeu hoje: bug das racionalidades NÃO atingiu AEC FSM em momento nenhum.

**Validação empírica não-percebida**: Ricardo contou que já tinha pedido o eco pra filha da Maria ANTES da análise da IA. Análise IA detectou Síndrome Nefrótica (óbvio, proteinúria alta), mas Ricardo já sabia que precisava fração de ejeção (dado **dinâmico** que IA não tem). **IA complementou sem substituir. Médico continuou no comando**. Design dele rodando ao vivo.

**Insight Pedro sobre pricing**: Ricardo decidiu *"racionalidades extras são serviço PREMIUM incluído no plano R$99"*. Tradução business: *"é busca na nossa base de dados primários dos pacientes"*. Não vendem "análise por racionalidade" — vendem **acesso privilegiado a raciocínio multi-racional sobre anamnese AEC autoral**. Anamnese é o ativo proprietário. Multi-racionalidade é multiplicador de valor por médico.

**Conversa com GPT externo** (Pedro mediando) validou e ampliou:
- *"OpenAI API paga ≠ ChatGPT público"* — dados não treinam por padrão desde mar/2023, DPA disponível, ZDR opcional Enterprise
- Forcing function anti-âncora: *"o que descartaria esta hipótese?"* — anti-viés cognitivo cirúrgico
- *"o RAG não é fonte de conhecimento — é mecanismo de identidade institucional"*

**Insight Pedro mais profundo**: hash do NFT (V1.9.311 patient_nfts já tem `signature_hash`) pode servir como **identificador pseudonimizado** enviado ao GPT:
- Pseudonimização (remove nome) + NFT hash (rastreabilidade criptográfica) = **ZERO PII + MÁXIMA auditabilidade**
- Reduz risco LGPD ~85% sem perder qualidade clínica

**Tese arquitetural cristalizada — 5 camadas Escola Clínica Digital**:

```
Camada 1 — ANAMNESE AUTORAL (AEC) ✅ Sólido
Camada 2 — DECODER MULTI-RACIONAL ✅ Tecnicamente pronto
Camada 3 — CONSELHEIROS EDITORIAIS ⚠️ DÍVIDA (Hylton Luz pra homeopatia mencionado; MTC/Ayurveda vazios)
Camada 4 — REVISÃO MÉDICA + RASTREIO ⚠️ Falta endossamento explícito
Camada 5 — PSEUDONIMIZAÇÃO + NFT HASH ✅ Peça pronta (V1.9.311), só usar
```

**Frase âncora cristalizada (Claude)**:
> *"MedCannLab não compete com o conhecimento médico do GPT. Compete com a falta de governança clínica do mercado. O RAG mais valioso não é o que repete o que GPT já sabe — é o que codifica a regra específica que SÓ a equipe de vocês tem. Protocolo, não enciclopédia."*

### 🔬 BLOCO H — Fim tarde: Audit profundo 5 camadas (descobertas inesperadas)

Pedro: *"vamos verificar tudo no app que faz parte do que falamos como estamos oq mudaria!"*

Audit via PAT revelou **5 descobertas brutais** que a memória da manhã não tinha:

1. **Anomalia 90 integrative DECIFRADA** (não é bug): 97% (87/90) são testes internos Carolina+Pedro+João. Apenas 3/90 (3%) uso clínico real (Mariana hoje + Cristiano 11/05 + Dr. Ricardo hoje). Custo overhead ~$4.35.

2. **Custo OpenAI ~$55/mês HOJE vs R$99 plano = déficit -$35/médico ativo**. Pricing precisa revisão pré-1º pagante.

3. **Sincronia jsonb-tabela quebrada em 81 reports** — regressão histórica (não causada pela limpeza de hoje madrugada que só tocou 3). UI mostrava "0 racionalidades" mesmo com dados na tabela. **Backfill executado ~14h**: 81/81 reports reconciliados.

4. **Founders fantasmas — 0 cadastrados em auth.users** (risco ativo zero, defesa em profundidade trivial).

5. **V1.9.238 cost_usd NULL em 1995 chats** — instrumentação cega. Resolvido via V1.9.321.

**Métricas empíricas calibração**: 1 médico ativo (Ricardo) + 30 pacientes teste + 17/68 AECs completas (25%). Sistema saudável pra estágio.

### 🎭 BLOCO I — Final tarde/noite: Teaching mode isolation (V1.9.323-A + A2)

Pedro testou simulação:
> *"vamos fazer um teste de nivelamento?"*

Sessão 8 turns: Pedro condutor + Nôa Patient Paula (DRC). Conduziu AEC completa. Logs Supabase revelaram **2 bugs arquiteturais reais**:

**Bug Arquitetural #1 — Persistência fraca de TEACHING**:
- Turn 1 "nivelamento" → TEACHING ON
- Turns 2-20 (sem keyword) → TEACHING **DESLIGOU SILENCIOSAMENTE**
- Logs: `[PERSONA SELECTED] mode: CLINICAL (Doctor Noa)` em todos turns 2-20
- GPT continuou roleplay **só porque histórico tinha contexto**
- Infraestrutura backend em CLINICAL + persona GPT em TEACHING = vazamento

**Bug Arquitetural #2 — Pipeline orchestrator não checa TEACHING**:
- Linha 6099 só checa `aiResponse?.includes('[ASSESSMENT_COMPLETED]')`
- Em simulação Pedro: ORCHESTRATOR disparou pipeline real com effectiveUserId do admin como patient_id
- CONSENT_GATE salvou (0 drafts falsos criados) — **sorte arquitetural, não defesa intencional**

**Solução V1.9.323-A (12h57)** — 5 mudanças cirúrgicas:
1. `conversationState.ts` ganha campo `teaching_mode_persistent: boolean`
2. `noaResidentAI.ts` ganha Map sticky TTL 30min + método detection
3. tradevision-core:4851 — `isTeachingMode` OR conversation_state
4. tradevision-core:6099 — pipeline guard `&& !isTeachingMode`
5. tradevision-core:5940 — scheduling trigger guard `&& !isTeachingMode`

**Validação empírica Pedro 13h04-13h09**: simulação 8 turns com Patient Paula sustentou TEACHING em TODOS turns válidos. **Bug arquitetural #1 RESOLVIDO**. Mas turn final "obrigado! logo mais agendarei sua consulta!" flippou para CLINICAL — `isNavigationRequest` desligou teaching porque "agend**arei**" contém "agenda".

**V1.9.323-A2 (13h19)** — sub-patch coerência (1 linha):
```ts
if (isNavigationRequest && ismState?.teaching_mode_persistent !== true) {
    isTeachingMode = false
}
```

Estado persistente declarado vence heurística lexical per-turn. **Auditoria empírica confirmou** que `isNavigationRequest` controla APENAS persona (linha 4882) — VIP triggers reais e GPT tags `[NAVIGATE_*]` funcionam independente. Logo blindar persona vs heurística lexical é seguro.

**Conversa Pedro+GPT+Claude sobre Opção B.2** (FSM TEACHING paralela ao AEC):
- B.1 (reusar `clinical_assessments` com flag `simulation_mode`) — ❌ DESCARTADA (risco regressão silenciosa: 14 refs no Core + 7 frontend)
- B.2 (tabela `teaching_sessions` SEPARADA + `teachingSessionFlow.ts`) — ✅ VIÁVEL FUTURAMENTE quando trigger ocorrer
- Edge function nova? NÃO pra core (manter padrão AEC), SIM pra `simulation-grader` (pós-monetização aluno)

**Triggers de ativação B.2 explícitos**:
1. 2º médico (Faveret) começar a usar TEACHING regularmente
2. Decisão de pricing pra alunos/residentes
3. Relato empírico de "draft falso de aluno"

**Reflexão GPT validada por Pedro**:
> *"A = fix operacional. B.2 = formalização arquitetural futura. é provavelmente o melhor equilíbrio possível hoje. Vocês não estão dizendo: 'um dia refatoramos'."*

### 📝 BLOCO J — Noite: Debate comentários inline (decisão MANTER histórico)

GPT externo propôs reduzir comentários longos no Core (manter inline curto, mover história pra changelog/ADR/memória). Argumento abstrato correto.

**Pedro duvidou**: *"todo core talvez tenha tipo de comentario assim? e ruim? riscos de tirar etc? diga"*

**Audit empírico revelou**:

| Arquivo | Linhas totais | Comentários | % |
|---|---|---|---|
| `tradevision-core/index.ts` | 6.690 | 1.157 | **17%** |
| `clinicalAssessmentFlow.ts` | 1.861 | 345 | **19%** |
| `rationalityAnalysisService.ts` | 639 | 107 | **17%** |

**Densidade CONSISTENTE ~17-19%**. Não é peculiaridade do Core. **76 referências `[V1.9.X]`** só no Core. Mais de 20 blocos de comentário >5 linhas.

**Exemplo concreto V1.9.109 cleanup_pass (linha 1365)**: 22 linhas documentam Bug C empírico + Fix B2 + **FAIL-SAFE em 4 camadas** + Lock V1.9.95 preservado. Tirar = próxima IA/dev "limpa" achando redundante. Reintroduz bug C.

**Riscos reais de refatorar agressivamente identificados**:
- 🔴 Perder documentação de invariantes intocáveis (PBAD ICP-Brasil compliance)
- 🔴 Perder rationale de fail-safes em camadas (anti-regressão futura)
- 🟡 Perder rastreabilidade compliance regulatório (CFM, LGPD)
- 🔴 Próxima IA/dev removendo lógica "redundante" sem contexto

**Decisão Pedro**: *"ok entendi vamos manter como esta"*. Caminho C escolhido (atual como está, regra diferencial pra código novo V1.9.324+).

**Insight meta cristalizado**:
> *"Em healthtech regulada com 1 sócio técnico + IA executora, comentários históricos no Core são camada de defesa epistemológica anti-regressão. Padrão genérico 'comentário curto inline, história em ADR' não se aplica diretamente — precisa filtro por tipo (invariante/fail-safe/compliance mantém inline; cronologia/discussão move pra memória)."*

### 🌙 BLOCO K — Fechamento: Estado final + memórias cristalizadas

**Total do dia**:
- **10 commits** (V1.9.316 → V1.9.323-A2)
- **1 empty commit** (Vercel force rebuild — discutirei abaixo)
- **6 memórias novas cristalizadas**
- **1 backfill SQL** (81 reports reconciliados)
- **Multiple deploys edge** tradevision-core (V1.9.316/318/319/320/321/322/323-A/323-A2)

**Memórias cristalizadas hoje** (em `~/.claude/projects/.../memory/`):
1. `project_arquitetura_escola_clinica_digital_17_05.md` — TESE DE PRODUTO 5 camadas
2. `audit_profundo_5_camadas_17_05.md` — 5 descobertas empíricas via PAT
3. `feedback_teaching_mode_vazamento_camadas_17_05.md` — 2 bugs arquiteturais + V1.9.323-A patch + B.2 mapeada
4. `project_lgpd_payload_racionalidade_divida_tecnica_17_05.md` — pré-1º pagante P0
5. `feedback_comentarios_inline_codebase_17_05.md` — decisão manter histórico
6. (Outras complementares atualizadas)

**Sub-incidente Vercel**: bundle prod ficou cacheado `1Kkl_7Aq` por horas após V1.9.316/317 commits. Empty commit `da7705f` (09h06) forçou rebuild. Validação empírica: Pedro abriu dashboard Vercel, confirmou commit `080dcb9` Ready. Mesmo assim bundle continuou antigo — só **V1.9.320 no edge** (independente de Vercel) destravou racionalidade pra Ricardo.

**Lição arquitetural sobre Vercel build cache**: assets JS são cacheados agressivamente pelo Vercel. Auto-deploy on push pode pular rebuild se cache considera "sem mudança significativa". **Solução manual**: forçar via dashboard "Redeploy sem Build Cache" OU empty commit.

---

## 🎯 Estado herdado pra AMANHÃ (18/05)

### Lock CORE preservado
- AEC FSM 13 fases ✅
- Verbatim First V1.9.86 ✅
- Pipeline V1.9.95+97+98+99-B ✅
- PBAD CONFORME V1.9.299 (tag `v1.9.299-pbad-conforme-locked`) ✅
- Sidecar Renal V1.9.307 ✅
- NFT Consent V1.9.311 ✅

### O que está deployado e funcionando empíricamente
- ✅ V1.9.316-322 (racionalidade resolvida, founders limpos, cost_usd observável, doc count promete+cumpre)
- ✅ V1.9.323-A + A2 (teaching mode isolado operacionalmente — 8/8 turns sticky validado)
- ✅ Backfill 81 reports jsonb (UI mostra racionalidades corretamente)

### Pendências P0 (pré-1º pagante externo) — roadmap cristalizado em memórias
- OpenAI Enterprise + ZDR
- Pseudonimização nome → NFT signature_hash
- Endossamento médico em `clinical_rationalities`
- Decisão pricing R$99 → R$149 OU rate limit calibrado
- Recrutar conselheiros editoriais (Hylton Luz formal pra homeopatia + buscar MTC/Ayurveda)

### Pendências P1 com triggers explícitos
- **V1.9.323-B.2** (FSM TEACHING paralela): ativar quando Faveret/aluno externo regular OU plano educacional
- Rate limit V1.9.240 audit + calibrar
- Fix raiz `saveAnalysisToReport` (evitar dessincronia jsonb-tabela voltar)

### Reflexões humanas do dia

**Pedro corrigiu Claude múltiplas vezes** com humildade técnica recíproca:
- Quando insisti em V1.9.308 como suspeito → Pedro: *"acho que o erro surgiu apos esse commit!"* (estava 80% certo)
- Quando propus DELETE 9 reports placeholder → Pedro: *"reverter commit de 21 horas perde trabalho em outras areas nao?"* (auditoria mostrou: bug pré-existente 6 meses, drafts são testes históricos válidos)
- Quando propus refatorar comentários do Core → Pedro: *"todo core talvez tenha tipo de comentario assim?"* (auditoria mostrou: padrão consistente 17-19%, defesa epistemológica)
- Quando GPT recomendou strict sticky → Pedro: *"gpt falou porem temos triggers de navegacao! ele nao sabe ne?!"* (auditoria mostrou: `isNavigationRequest` controla SÓ persona, VIP triggers funcionam independente)

**Padrão recorrente**: GPT/Claude propõem em PRINCÍPIO correto + Pedro audita empíricamente + decisão calibrada pro contexto MedCannLab específico.

**Frase Pedro mais marcante do dia**:
> *"isso aqui e serio"* (antes de aplicar V1.9.323-A)

Esta frase resume a postura: aplicar fix com **triple-check** sempre. Nunca tocar AEC FSM. Auditar antes de mexer.

**Frase Ricardo mais marcante do dia** (via Pedro):
> *"a camada de racionalidades é um bônus de nosso sistema. Já está ali e mostrando que as palavras do paciente podem ser analisadas do ponto de vista de outras cosmologias e não apenas a biomédica ou homeopática. Vamos sempre lidar com o paciente no mundo. ele tem acesso a muios produtos de outras racionalidades que chegama até ele por diversos canais de omunicação. E nós temos que saber acompanhar, se posicionar..."*

Esta é a tese de produto inteira em uma frase. O paciente brasileiro mistura CBD + acupuntura + alopático + chá da vó + reza. Médico precisa de ferramentas pra **dialogar com mundo plural**, não pra negar.

---

## 📊 Métricas operacionais do dia

| Métrica | Valor |
|---|---|
| Commits | 11 (10 features + 1 empty) |
| Deploys edge | 8 (tradevision-core V1.9.316/318/319/320/321/322/323-A/323-A2) |
| Memórias cristalizadas | 6 novas |
| Backfills SQL | 1 (81 reports jsonb) |
| Lixos limpos do banco | 10 rows clinical_rationalities + 11 chaves jsonb |
| Bugs encontrados | 6 (DOCUMENT_LIST + jsonb dessincronia + founders fantasmas + cost_usd NULL + 2 teaching arquiteturais) |
| Bugs resolvidos | 6/6 ✅ |
| AEC FSM tocado | **ZERO** |
| Lock V1.9.95 violado | **ZERO** |
| Custo OpenAI estimado dia | ~$2-3 USD (1 médico ativo + testes) |

---

## 🎬 Frase âncora final do dia 17/05 (manhã)

> *"4 fixes errados (V1.9.316→319) atacaram o lugar errado antes do V1.9.320 acertar a causa raiz (smart_trigger linha 3135). Humildade técnica aprendida: antes de propor fix, mapear TODOS call sites do código suspeito. Tese 'Escola Clínica Digital' cristalizada com 5 camadas (AEC autoral + Decoder multi-racional + Conselheiros editoriais + Revisão médica + NFT hash pseudonimização). Teaching mode operacionalmente isolado via V1.9.323-A+A2 com triggers explícitos pra B.2 futuro. Comentários históricos no Core mantidos como camada de defesa epistemológica anti-regressão. Sistema estável, memórias densas, próxima sessão começa de outro patamar."*

— Pedro Henrique Passos Galluf + Claude Opus 4.7, 17/05/2026, encerrando ~16h após início madrugada.

---

## 🌅 BLOCO L — Auditoria prontuário + 3 fixes cirúrgicos (17/05 tarde, 14h-16h)

Sessão tarde focada em **auditoria de superfície do prontuário profissional** (PatientsManagement.tsx) — Pedro+Ricardo testando empíricamente abas que prometiam função mas eram placeholder estático. Padrão recorrente identificado:

> **"abas com placeholder hardcoded herdado de era pré-Claude pago"** — não bug operacional, mas **bug estrutural latente** que vira operacional quando paciente real com dados densos abre a tela.

### Sequência de descobertas

#### L.1 — Fluxo de exames mapeado (médico↔paciente)

Auditoria empírica completa:

| Direção | Status | Evidência |
|---|---|---|
| Médico → paciente (solicitação) | ✅ FUNCIONA | 18 patient_exam_requests, 5 ICP-signed |
| Paciente recebe | ✅ FUNCIONA | PatientExamRequestsCard autônomo |
| Paciente sobe resultado (Meus Exames V1.9.313) | 🟡 INFRA / 0 USO | 0 patient_documents |
| Médico vê uploads do paciente | 🪦 PLACEHOLDER | Aba "Arquivos" texto estático |

Identificado: 8 telas reusando ExamRequestModule via 2 contextos (Prontuário aba Exames + Modal "Solicitar Exame" do QuickPrescriptions). Princípio polir-não-inventar bem aplicado historicamente.

**Falha empírica do Pedro logado**: tela "Minhas Prescrições" mostrava 0 solicitações, mas Pedro **estava em conta `passosmir4@gmail.com`** (`df6cee2d`) que tem 0 registros. As 5 solicitações estão em `casualmusic2021@gmail.com` (`d5e01ead` — "Pedro Paciente"). RLS funcionando corretamente, isolamento de contas teste preservado.

#### L.2 — V1.9.326: Médico anexa exames ao prontuário

Aba "Arquivos" do Terminal Profissional tinha `handleUploadFiles` **quebrado em 3 camadas** desde sempre:

1. Bucket `medical-files` **NÃO EXISTE** (só `chat-images`, `documents`, `patient_documents`, `signed_documents`)
2. Path malformado: `patient - files / ${uuid}/...` (espaços literais!)
3. Zero INSERT em tabela — só upload pro vazio

Toast linha 1342 admitia honestamente: *"Verifique se o bucket 'medical-files' existe"* — defesa que provava feature nunca funcionou.

**Decisão de produto (Ricardo perguntou + Pedro confirmou opção A)**:
- Reusar V1.9.313 (`patient_documents`) com colunas aditivas + RLS estendida
- Doc anexado pelo médico = **imutável pro paciente** (paciente só visualiza)
- Paciente só edita/deleta o que ELE subiu
- Alinhado CFM 2.314 (prontuário sob responsabilidade médica)

**Implementação**:
- Migration aditiva: `+uploaded_by uuid`, `+uploaded_by_role text CHECK ('patient','professional')`, `+clinical_note text`
- 6 policies novas separando paciente/médico
- 3 storage policies bucket `patient_documents` pro médico vinculado
- Componente `ProfessionalPatientFiles.tsx` (espelha PatientMyExams modo médico) com:
  - Filtro origem (médico/paciente) + categoria
  - Campo `clinical_note` opcional no upload
  - Notificação automática ao paciente
  - Badge visual (🩺 médico / 👤 paciente)
- Substituição do placeholder em [PatientsManagement.tsx:2305](src/pages/PatientsManagement.tsx#L2305)
- `handleUploadFiles` legado removido

Commit `0c6a0fd`. Type-check zero erros.

#### L.3 — V1.9.327: Aba "Gráficos" vira "Linha do tempo clínica"

Mesmo padrão da aba files: placeholder hardcoded "Nenhum gráfico disponível" enquanto Carolina (37 reports + 11 prescrições + 16 appointments = 68 eventos) abria tela mentirosamente vazia.

**Pedro escolheu opção B** após análise valor/custo (rejeitou A=instalar recharts, C=scores AEC, D=eGFR trend porque triggers não ativaram):

- Resolve "vazio mentiroso" imediatamente
- **Zero nova dependência** (sem recharts/d3/chart.js)
- Modela camada semântica temporal que vira fundação pra chart real depois
- Reusa padrão Tailwind/lucide existente

**Implementação `PatientClinicalTimeline.tsx`**:
- 4 queries paralelas (reports + prescrições + appointments + exam_requests)
- Agrupamento mensal client-side (`Map<monthKey, MonthBucket>`)
- Cards por mês com contadores granulares + barra densidade proporcional ao pico + último evento
- Pico de atividade destacado âmbar + badge "Mais recente" cyan
- Empty/loading/error states honestos
- Nota arquitetural rodapé: gráficos quantitativos virão com série longitudinal

**Empírico Carolina (4 meses)**:
- Mai/2026: 25 eventos
- **Abr/2026: 34 (PICO)** — 29 reports concentrados
- Mar/2026: 6 eventos
- Fev/2026: 1 evento

Commit `a262247`. Type-check zero erros.

**Insight arquitetural cristalizado**: separar **camada semântica** (`MonthBucket[]`) de **rendering** (cards/charts) economiza 80% do trabalho quando trocar B→A futuro. "Modelagem temporal antes de visualização" — Pedro reformulou bem na análise dele.

#### L.4 — V1.9.328: NUMERIC overflow destrava aprovação DRC do Ricardo

**Bug operacional ativo**: Ricardo tentou aprovar sugestão DRC de Maria das Dores Pinto Pitoco 2× (manhã + 15:29 BRT). Ambas falharam silenciosamente. Card permanecia "pending". Ricardo: *"Fiz bem mais cedo e enviei log. Agora fiz novamente."*

**Diagnóstico errado primeiro**: hipotetizei `window.confirm()` bloqueado / popup blocker. Pedro reproduziu como admin e capturou screenshot REAL:

> "Erro ao aprovar: **numeric field overflow**"

`window.confirm()` funcionou perfeito (OK + Cancelar visíveis no screenshot 1). O erro vinha do banco.

**Causa raiz — inconsistência de schema entre tabelas que conversam**:

| Tabela | Coluna | Precisão | Max |
|---|---|---|---|
| `renal_inline_suggestions` | `proteinuria_acr_mg_g` | NUMERIC(8,2) | 999.999,99 ✅ |
| `renal_exams` | `proteinuria` | NUMERIC(5,2) | 999,99 ❌ |

Maria tem A/Cr=1924 mg/g (proteinúria nefrótica franca — clínico real). Cabia na sugestão, estourava na aprovação. RPC ia até INSERT em `renal_exams` e morria com PG 22003.

**Fix aplicado via PAT**: `ALTER COLUMN proteinuria TYPE numeric(8,2)` (espelha precisão da tabela fonte). Zero risco — só amplia precisão, dados antigos válidos. Princípio polir-não-inventar: tabelas que conversam num fluxo precisam ter schemas compatíveis.

**Auditoria preventiva** das demais NUMERIC em `renal_exams`:
- `creatinine` NUMERIC(5,2) → 999,99 mg/dL ✅ (IRA extrema ~15)
- `urea` NUMERIC(5,2) → 999,99 mg/dL ✅ (extremo ~300)
- `egfr` NUMERIC(5,1) → 9999,9 ✅ (sempre <200)
- `proteinuria` ❌ era único problema

Commit `51989e0`. Migration aditiva em `supabase/migrations/`.

#### L.5 — Lição cristalizada: bug diagnóstico humilde

Esta sessão produziu **2 diagnósticos errados antes do certo** (igual padrão V1.9.316→319 da manhã):

1. **"Ricardo não clicou"** → falso (ele tentou 2x explícito)
2. **"window.confirm() bloqueado"** → falso (popup funcionou perfeito)
3. **"NUMERIC overflow"** → CERTO (validado empíricamente via PAT)

Padrão da iteração diagnóstica:
- Cada hipótese errada custou ~3 minutos
- Pedro forneceu screenshot decisivo (devtools com erro literal)
- Screenshot > narrativa textual pra debug remoto
- **Anti-padrão evitado**: codar fix preventivo (substituir window.confirm) **antes** de validar a hipótese — teria deployed UX nova sem resolver bug raiz

### Métricas L (tarde 17/05)

| Métrica | Valor |
|---|---|
| Commits | 3 (V1.9.326 + V1.9.327 + V1.9.328) |
| Migrations aplicadas | 2 (patient_documents extended + renal_exams.proteinuria) |
| Componentes novos | 2 (ProfessionalPatientFiles + PatientClinicalTimeline) |
| Placeholders eliminados | 2 (aba Arquivos + aba Gráficos) |
| Handlers quebrados removidos | 1 (handleUploadFiles legado) |
| Bugs operacionais corrigidos | 1 (NUMERIC overflow Ricardo bloqueado) |
| Decisões de produto novas | 1 (opção A: doc médico imutável pro paciente, CFM 2.314) |
| AEC FSM tocado | **ZERO** |
| Lock V1.9.95 violado | **ZERO** |
| chart libraries instaladas | **ZERO** (recharts/d3 evitados por design) |
| Diagnósticos errados antes do certo | 2 (Ricardo não clicou + window.confirm) |

### Tabela calibrada de classes de feature (atualização L)

| Feature | Antes (manhã) | Depois (tarde) | Classe |
|---|---|---|---|
| Aba Arquivos Profissional | 🪦 placeholder estático | 🟡 infra completa, aguardando 1º uso real | Infra→adoção |
| Aba Gráficos Profissional | 🪦 placeholder estático | 🟢 timeline funcional, Carolina renderiza 4 meses | Infra ativa |
| Aprovação DRC V1.9.307 | 🔴 quebrada silenciosamente (Ricardo bloqueado) | 🟢 destravada, aguardando Ricardo tentar 3ª vez | Operacional |
| Anexar exames médico→paciente | ❌ inexistente | 🟡 deployada V1.9.326, aguardando smoke Ricardo | Infra→adoção |

---

## 🎬 Frase âncora final do dia 17/05 (tarde+noite)

> *"Padrão herdado pré-Claude pago: 'aba que mente'. Botão visual sem handler real, ou handler com bucket inexistente, ou frontend correto + banco com schema estreito. 3 commits cirúrgicos hoje à tarde (V1.9.326 anexar arquivos + V1.9.327 timeline narrativa + V1.9.328 NUMERIC fix) limparam débito acumulado sem tocar AEC/Lock/Pipeline. Lição meta: cada placeholder estático no Terminal Profissional é uma promessa não cumprida — auditar todas, deletar ou implementar. Não deixar metade. E mais importante: **diagnóstico humilde** — quando primeira hipótese parece óbvia (window.confirm), pedir screenshot do erro real antes de codar fix. Pedro entregou screenshot decisivo às 15:33, fix foi cirúrgico ALTER COLUMN em vez de refatoração ampla."*

— Pedro Henrique Passos Galluf + Claude Opus 4.7, 17/05/2026 tarde, encerrando ~16h05 após bloco L.
