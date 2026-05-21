# Diário 21/05/2026 — F3 reabrir dossiê + F2 Base de Conhecimento anexável

**Autores**: Pedro Henrique Passos Galluf + Claude Opus 4.7 (1M context)
**Estado entrada do dia**: Diário 20 fechado no commit `4ed0803` (V1.9.392 F3-A.2). Sessão da noite 20→21 continuou DEPOIS do diário 20 ser commitado — 4 itens ficaram fora dele (capturados no Bloco A abaixo).
**Sessão**: 21/05 ~09h BRT — Pedro retoma no desktop, pergunta o que faltou do diário 20.

---

## 🌅 BLOCO A — O que ficou fora do DIARIO_20 (itens da noite 20→21)

O diário 20 foi commitado (`4ed0803`) documentando até V1.9.392. A sessão continuou depois. 4 itens não entraram e foram recuperados hoje:

1. **Análise da reunião Ricardo + João** — transcrição de áudio (conversa mente/corpo/biologia/homeopatia/escuta clínica) + análises GPT externas + um "DOCUMENTO-MESTRE" de 17 seções. Filtro Material A/B/C aplicado.
2. **Achado de segurança P0 — `noa_clinical_cases`** (ver Bloco C).
3. **Auditoria empírica das 3 features** propostas (reabrir dossiê / base conhecimento anexável / marcador de exame) — ver Bloco D.
4. **V1.9.393 implementado mas não commitado** na noite — commitado hoje (Bloco E).

## 🗣 BLOCO B — Reunião Ricardo + João: o que é útil

Conversa longa, ~80% reflexão filosófica + ~20% sinal operacional. Filtro:

- **Material A (decisões reais)**: Casos Similares = superfície de texto, não inferência (Ricardo confirmou na voz dele); sequência conservadora indivíduo→médico→coletivo; consentimento de publicação ≠ consentimento de visualização (gate novo pro F4); pseudonimização `#C0F4` confirmada.
- **Material B (DOCUMENTO-MESTRE GPT)**: bom como índice, mas inflou o P0 (ver Bloco C). Anti-padrão: GPT externo transforma reflexão em spec. Não virou backlog.
- **Material C (conversa filosófica)**: posicionamento/pitch, não feature. Confirma a tese do Ricardo de 6 meses (`project_drift_nefro_cannabis`). Zero código.
- **Feature nova real**: marcador rápido na leitura de exame (queixa literal do Ricardo: "vejo algo no exame, não tenho onde anotar, o dado se perde"). Parqueada — ver Bloco D.
- **Caução afiada (Material B mas válida)**: "nunca concluir nada também é ruim — vira coach filosófico". Bate com `feedback_z2_nao_e_burrice`.

## 🔴 BLOCO C — Achado P0: `noa_clinical_cases` RLS `SELECT USING (true)`

DOCUMENTO-MESTRE alegou "P0 crítico, violação LGPD em curso, risco jurídico severo". **Verificado empíricamente via PAT** — calibração:

| Alegação GPT | Realidade |
|---|---|
| `SELECT USING (true)` | ✅ CONFIRMADO — policy `noa_clinical_cases_select` tem `qual = true` |
| RLS desligada | ❌ Falso — RLS está ON; INSERT/UPDATE/DELETE já restritos a admin+profissional |
| "violação LGPD em curso" | ⚠️ Exagero — tabela tem **0 linhas**, sem vazamento hoje |

**Veredito: 🟠, não 🔴.** Defeito real (qualquer logado leria tudo) mas arma descarregada — vira 🔴 no instante em que o F4 fórum popular a tabela. **É bloqueador de pré-requisito do F4**, não emergência. Fix mínimo: `USING (true)` → `has_role(admin) OR has_role(profissional)`; fix definitivo nasce com o workflow editorial do F4 (SELECT gated por status).

## 🔎 BLOCO D — Audit das 3 features + decisão

Auditadas empíricamente (banco via PAT + código):

| Feature | Audit | Decisão |
|---|---|---|
| **F3 reabrir dossiê** | snapshot já tem `content.messages`; 2 dossiês salvos (uso real) | 🟢 fazer (V1.9.393) |
| **F2 base conhecimento anexável** | `KnowledgeBaseIntegration` já existe; ~42 docs; padrão PubMed replicável | 🟢 fazer (V1.9.395) |
| **Marcador de exame** | `patient_documents` 0 rows, `renal_exams` 1 row — sem substrato vivo | ❄️ parquear (gatilho: uploads reais) |

Refinamento GPT aceito: modelo de 2 modos pro reabrir (Revisar/Continuar). Refinamento GPT do F2 aceito: anexar excerpt, não doc bruto inteiro.

## 🔄 BLOCO E — V1.9.393: F3 reabrir dossiê (modo 2 camadas)

Commit `5ed2fc4`. 3 arquivos: `useResearchChat.ts` + `ResearchChat.tsx` + `NoaMatrixView.tsx`.

- `loadSession()` novo no hook + **fix de staleness de closure** (`messages` incluído nas deps de `sendMessage` — sem isso "Continuar pesquisa" mandaria histórico errado pro Edge).
- 3 modos de sessão: `live` (normal) / `review` (só-leitura, snapshot imutável) / `continue` (sessão derivada editável).
- Painel "Meus Dossiês": cada dossiê ganha 👁 Revisar + ⑂ Continuar.
- Sem regressão: dossiê nunca é mutado (`saveDossier` só faz INSERT); modo `live` idêntico ao anterior.
- **Testado empíricamente por Pedro: Revisar/Continuar OK.**

## 🟡 BLOCO F — V1.9.394: aviso experimental Casos Similares recolhível

Commit `ad25b0e`. `AdminCasosSimilares.tsx`. O banner ALPHA (5 parágrafos) ocupava tela toda no mobile / meia tela no desktop. Agora recolhível: colapsado por padrão com a **linha crítica de segurança sempre visível** ("não use pra decisão clínica"); detalhe completo a um toque. Conteúdo integral preservado — continua válido (a Matrix NÃO estende o Casos Similares; operações cognitivas distintas).

## 🟢 BLOCO G — V1.9.395: F2 Base de Conhecimento anexável

Commit `9b63b1b`. `NoaMatrixView.tsx` + `dossierExport.ts`. Painel "Base de Conhecimento" no Terminal de Pesquisa espelhando o PubMed: o médico escolhe docs internos do acervo pra Matrix usar como contexto, junto ou não com papers.

- Reusa `KnowledgeBaseIntegration.getAllDocuments()` — zero query nova.
- Lazy load on expand; filtro client-side; exclui `cases_lgpd_quarantine`.
- Doc grande entra **truncado** (8k chars ≈ 2k tokens) — protege o TOKEN MGMT do Edge.
- **Anexo MANUAL bounded — não é RAG automático.** Migração `documents → base_conhecimento` continua vetada (`feedback_rag_molda_comportamento_cognitivo`).
- `CTX_LABEL` corrigiu rótulos de contexto enviados ao Edge.

## 🧪 BLOCO H — Teste empírico Matrix: 5 turnos + achado do viés de suavização

Pedro testou o F2 (anexou 2 docs) e fizemos um teste interativo de **5 turnos** (caso dor no pé #6ACF, 4 datas). Claude no papel de médico, Pedro colando na Matrix.

| Turno | Teste | Resultado |
|---|---|---|
| 1 | Leitura longitudinal | ✅ fez — mas suavizou ("irradiação se mantém") |
| 2 | Aceitar correção + auto-audit | ✅ aceitou limpo, auto-audit honesto |
| 3 | Padrão real × artefato lexical + admitir limite | ✅✅ nomeou a distinção sozinha + admitiu o limite |
| 4 | Método concreto (anti-vago) | ✅ 5 categorias acionáveis |
| 5 | Síntese carregando a incerteza | ✅ incerteza sobreviveu ao resumo |

**Achado cristalizado** (memory `feedback_matrix_vies_suavizacao_primeira_passada_21_05`): a Matrix tem **viés de suavização de primeira-passada** — declara padrão mais forte do que o corpus sustenta. MAS corrige limpo sob desafio, faz auto-audit honesto e admite limites — nunca fabrica certeza falsa. Mitigação = formato conversacional. Refinamento parqueado: `RESEARCH_PROMPT` exigir denominador explícito ("2 de 4 datas"). Não bloqueia beta 20-30.

## 📄 BLOCO I — Smoke do dossiê PDF + V1.9.396 polish

Pedro fechou a sessão como dossiê (PDF 10 páginas). Smoke confirmou o loop **F2 anexar → conversa → F3 fechar → V1.9.393 reabrir** de ponta a ponta. 3 achados → **V1.9.396** (commit `0880231`):

- 🟠 Rodapé do PDF dizia "sem persistência server-side nesta versão F3-A.1" — imprecisão factual (F3-A.2 já persiste). Corrigido.
- 🟡 Filtro F2 deixava passar doc com `content` = placeholder de extração falha. Novo `usableDocText()` ignora placeholders conhecidos.
- 🟡 §1 do dossiê renomeado pra incluir "Documentos".
- ⏸ Parqueado (feature, não polish): **F3-A.3 curadoria semântica** — o dossiê inclui tudo que foi marcado sem filtro de relevância (smoke mostrou 2 papers de oncologia num caso de dor no pé). Confirmado como roadmap.

## 🧬 BLOCO J — Memórias, estado e handoff

### Memória cristalizada hoje
- `feedback_matrix_vies_suavizacao_primeira_passada_21_05` (nível 1) — viés de suavização da Matrix.

### Commits do dia (HEAD `0880231`)
```
0880231  V1.9.396  polish dossiê (rodapé real + filtro placeholder)
9b63b1b  V1.9.395  F2 Base de Conhecimento anexável
ad25b0e  V1.9.394  aviso Casos Similares recolhível
5ed2fc4  V1.9.393  F3 reabrir dossiê (modo 2 camadas)
```
Todos push 4 refs (amigo + medcannlab5 × main + master). Frontend deploya via Vercel.

### Estado das features do eixo Pesquisa
- ✅ F1 auto-ativação (V1.9.389-B)
- ✅ F2 Base de Conhecimento anexável (V1.9.395) — **validado empíricamente no teste de 5 turnos**
- ✅ F3-A.1 PDF (V1.9.390) + F3-A.2 persistência (V1.9.392) + F3 reabrir (V1.9.393)
- ⏸ F3-A.3 curadoria semântica de papers — parqueado, confirmado real pelo smoke
- ⏸ F3-A.4 síntese editorial vs transcript — parqueado
- ⏸ F4 fórum publicação — parqueado; **pré-requisito: corrigir RLS `noa_clinical_cases` (Bloco C)**

### Parqueado / próximos
1. **Fix RLS `noa_clinical_cases`** antes do F4 (Bloco C — 🟠)
2. **F4** schema fórum + UI + workflow editorial (design no diário 20)
3. **Refinamento RESEARCH_PROMPT** — denominador explícito (mata o viés de suavização)
4. Marcador de exame — quando `patient_documents` tiver uso real
5. F3-A.3 curadoria semântica de papers

### Avisos críticos
- ⚠️ NÃO migrar `documents → base_conhecimento` (regressão V1.9.308)
- ⚠️ NÃO mexer em sign-pdf-icp / icp_chain.ts sem auditoria (Lock V1.9.299)
- ⚠️ `noa_clinical_cases` SELECT aberto — corrigir antes do F4
- ✅ PAT Management API: Pedro fornece quando pedir (sessão-scoped, não persiste)

---

## 🔠 BLOCO K — Tarde: legibilidade + a saga do dossiê (V1.9.397→402)

### K.1 — Legibilidade e polish
- **V1.9.397** (`e129957`) — chat da Nôa Matrix com letra maior (pedido do Ricardo, que não enxerga bem). Escopado só ao `ResearchChat`: mensagens 12→14px, metadados 10→11px.
- **V1.9.398** (`41b91c5`) — dossiê PDF **condensa** os docs da Base de Conhecimento (eram parede de 8k chars de texto acadêmico que enterrava a conversa). Trecho de 600 chars + nota. Contexto da Matrix inalterado.
- **V1.9.399** (`48a3398`) — nota de honestidade sob a §1 do dossiê: *"Material que o médico marcou como contexto. Nem todo item é necessariamente invocado na §3."*

### K.2 — A saga do dossiê reaberto (V1.9.400 → 401)
- **V1.9.400** (`26d3339`) — re-fechar um dossiê reaberto preservava §1/§2 vindo do snapshot original (o reabrir V1.9.393 traz só a conversa).
- **Smoke empírico**: vários PDFs saíram em branco mesmo com V1.9.400. Diagnóstico via PAT (`physician_research_dossiers`): **NÃO era bug do V1.9.400** — o usuário reabria dossiês **vazios**. A lista é ordenada por recência → cada re-fechar criava um vazio mais novo que subia ao topo e enterrava o bom. Ciclo vicioso.
- **V1.9.401** (`84bd44b`) — fix definitivo: re-fechar sessão reaberta **sem continuar a conversa** (mesma contagem de mensagens) só re-exporta o PDF, **não duplica** o dossiê.
- **V1.9.402** (`2851cc3`) — (1) chat **sticky** (some de vista quando os painéis PubMed/Base expandem); (2) filtro de **lixo binário de PDF** — o doc "Cannabis Exposure..." entrou anexável com conteúdo = tabela xref crua (`endobj xref 0000000016 00000 n...`); `looksLikePdfBinary()` detecta a assinatura.

### K.3 — Lição
"0 rows" pode ser "ninguém usou" OU "ninguém consegue usar". E um artefato que se cria a cada ação + lista por recência = se a ação for repetível sem mudança, gera lixo que se auto-promove. V1.9.401 quebrou esse padrão.

## 🏛 BLOCO L — Avaliação do Fórum + Plano F4

### L.1 — Audit do subsistema fórum (PAT + front + back)
- **3 componentes** tocam `forum_posts`: `ForumCasosClinicos` (tab), `ChatGlobal` (Fórum Cann Matrix, `/app/chat`), `DebateRoom` (detalhe).
- **2 com schema quebrado** — cada um escreve colunas-fantasma diferentes. Bucket `forum-attachments` **não existe**.
- `forum_posts` é a **espinha compartilhada** — o ChatGlobal já converte linhas de `forum_posts` em debates.
- Infra de **ranking já existe** (`ranking_history`, `view_current_ranking_live`).
- Tudo **0 rows** → reforma é a mais segura do app.

### L.2 — Caminho B + Plano F4
Pedro confirmou o **Caminho B**: o dossiê é a fonte; um trigger o envia ao fórum; cai na análise do conselho; vira debate no Cann Matrix. `forum_posts.status` é o trilho. Papéis: **Casos Clínicos = curadoria/conselho/ranking · Cann Matrix = debate**.

**`PLANO_F4_FORUM_CANN_MATRIX_21_05.md`** escrito e commitado (`36c7027`) — 5 fases (F4.0 consent+RLS / F4.1 schema / F4.2 UI+trigger / F4.3 workflow conselho / F4.4 ranking). **F4 NÃO foi codado** — o plano aguarda aprovação + 2 decisões humanas (modelo de consent · quem é o conselho).

## 📋 BLOCO M — Estado de fechamento do dia

### Commits do dia (HEAD `2851cc3`)
```
2851cc3  V1.9.402  chat sticky + filtro lixo binário PDF
84bd44b  V1.9.401  re-fechar dossiê reaberto sem mudança não duplica
26d3339  V1.9.400  re-fechar dossiê reaberto preserva §1/§2
36c7027  docs      PLANO F4 fórum
0880231  V1.9.396  polish dossiê (rodapé + filtro placeholder)
48a3398  V1.9.399  nota honestidade §1
41b91c5  V1.9.398  dossiê condensa docs da Base
ad25b0e  V1.9.394  aviso Casos Similares recolhível
9b63b1b  V1.9.395  F2 Base de Conhecimento anexável
e129957  V1.9.397  legibilidade chat Matrix
5ed2fc4  V1.9.393  F3 reabrir dossiê
b819117  docs      DIARIO_21
```
**10 commits de código (V1.9.393→402) + 2 de docs.** Todos type-check + smoke + push 4 refs.

### Memórias cristalizadas hoje
- `feedback_matrix_vies_suavizacao_primeira_passada_21_05` (nível 1)
- `project_f4_forum_plano_e_audit_21_05` (nível 1) — audit fórum + plano F4

### Próximo passo
F4 — aprovar o `PLANO_F4` + as 2 decisões humanas. Começar pela F4.0 (fix RLS órfã `noa_clinical_cases` + decidir consent).

---

## 🎯 Frase âncora do dia

> *"Eixo Pesquisa validado de ponta a ponta — anexar (F2) → conversa Z2 → dossiê (F3) → reabrir (V1.9.393). A Matrix passou 5 turnos de escrutínio. O dossiê passou por uma saga de PDFs em branco que o audit empírico desmascarou: não era bug, era o usuário reabrindo dossiês vazios — V1.9.401 matou o ciclo. E o Fórum foi auditado e planejado (Caminho B): não se constrói do zero, se desentorta. 10 commits cirúrgicos, smoke em cada um, zero regressão."*

— Dia 21/05/2026 · V1.9.393→402 + Plano F4 · eixo Pesquisa validado · 2 memórias nível 1
