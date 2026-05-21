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

## 🎯 Frase âncora do dia

> *"Loop do eixo Pesquisa fechado e validado empíricamente: anexar (F2) → estruturar em conversa → fechar dossiê (F3) → reabrir (V1.9.393). A Matrix passou um teste de 5 turnos — suaviza na primeira passada, mas corrige limpo sob desafio e admite o que não sabe. A conversa É a mitigação. 4 commits cirúrgicos, smoke empírico em cada um, zero regressão."*

— Dia 21/05/2026 · V1.9.393→396 · eixo Pesquisa validado · 1 memória nível 1
