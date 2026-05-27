# Diário 26/05/2026 — Sincronização repo + V1.9.456 longitudinal + Reunião 4 sócios (Eduardo engajando + TEA design)

**Autores**: Pedro Henrique Passos Galluf + Claude Opus 4.7 (1M context)
**Estado entrada do dia**: HEAD `0160434` (V1.9.448 vocabulário "Vincular" laptop 25/05 madrugada) — desktop tinha 9 commits à frente (V1.9.449→454 + retrospectiva V3 + diário 25/05 Bloco R+S+T)
**Estado saída do dia**: HEAD ~`eea38f5` (V1.9.456) + retrospectiva V3 absorvida + sincronização cross-machine resolvida + reunião 4 sócios cristalizada
**Sessão**: 26/05 manhã/tarde/noite (sessão contínua longa) — Pedro foi pra casa ao final

---

## 🌅 BLOCO A — Sincronização repo + audit pós-handoff

Pedro retornou no laptop OneDrive depois de 4 dias no desktop. Audit empírico:
- HEAD local: `0160434` (V1.9.448 — meu trabalho 24-25/05 madrugada)
- HEAD remoto: `c2bc3a1` (10 commits à frente — Pedro trabalhou no desktop)
- 10 commits novos: V1.9.449→454 + diários 25/05 (Matrix Z2 + Bloco R+S+T) + retrospectiva mensal V3 (2338 linhas)

Decidi puxar — fast-forward limpo, zero conflito (commits linearizados).

### A.1 — Trabalho do desktop absorvido

| Versão | Entrega |
|---|---|
| V1.9.449 | `getAllPatients` filtra `type='patient'` — Ricardo 48→34 reais (resolve P0 do diário 24/05) |
| V1.9.450 | Corpus expandido Matrix Z2 pseudonimizado (`casePseudonymization.ts` ~230 linhas, whitelist 7 seções) |
| V1.9.453 | Anti-alucinação completiva (lock micro-factual no RESEARCH_PROMPT — pós bug Matrix alucinou 6 dados clínicos) |
| V1.9.453-A | Taxonomia 3 cenários (ausência total / presença parcial / cobertura completa) |
| V1.9.453-B | Negação explícita ≠ campo ausente |
| V1.9.454 | MatrixHelpModal elite (modal denso 6 seções) |

### A.2 — Retrospectiva mensal V3 absorvida

Documento 2338 linhas (`RETROSPECTIVA_MENSAL_2026_04_26_a_2026_05_25.md`) — leitura integral. Síntese consolidada em `project_retrospectiva_mensal_26_04_a_25_05_2026.md` (snapshot ponteiro).

**Marcos do mês**:
- 90 commits cirúrgicos · 26 diários · 94 memórias novas
- Reports 75 → 143 (+91%)
- Pacientes 16 → 34 (+113%)
- 40 reports ICP REAL no mês
- Constituição MedCannLab cristalizada = 2 vertentes (chat paciente + Matrix profissional) + 4 eixos comuns

---

## 📚 BLOCO B — Cristalização 13 memórias críticas (gap mês)

Audit revelou 13 memórias mencionadas em diários/retrospectiva mas AUSENTES do repo `docs/memorias/`. Pedro autorizou criação.

### B.1 — 9 memórias do diário 25/05

| # | Memória | Origem |
|---|---|---|
| 1 | `feedback_count_pacientes_v1_9_449_e_gaps_function_calling_v1_9_450_25_05` | BLOCO B+O |
| 2 | `feedback_matrix_z2_contida_e_feature_nao_bug_e_gpt_externo_pode_sugerir_anti_constituicao_25_05` | BLOCO C+O |
| 3 | `feedback_locks_macro_vs_micro_matrix_alucinacao_completiva_25_05` | BLOCO F+G+H+I |
| 4 | `feedback_qr_code_embedded_pdf_gap_caso_joao_guimaraes_25_05` | BLOCO S |
| 5 | `project_v1_9_455_qr_code_embedded_pdf_design_25_05` | BLOCO S |
| 6 | `feedback_lock_v1_9_299_pbad_protege_modificacao_pos_assinatura_25_05` | BLOCO S |
| 7 | `feedback_paciente_externo_real_estressa_arquitetura_25_05` | BLOCO S |
| 8 | ⭐⭐ `feedback_duas_vertentes_uma_matriz_epistemologica_constituicao_medcannlab_25_05` | BLOCO P (META) |
| 9 | `project_retrospectiva_mensal_26_04_a_25_05_2026` | BLOCO R (snapshot) |

### B.2 — 4 memórias pivotais 24/05 + 23/05 (da retrospectiva)

| # | Memória |
|---|---|
| 10 | `feedback_queixa_nao_e_sintoma_aec_e_abertura_fenomenologica_24_05` |
| 11 | `feedback_aec_como_repelente_natural_de_demanda_fora_escopo_24_05` |
| 12 | `feedback_smoke_aec_completa_obrigatoria_pos_clinicalassessmentflow_mudanca_24_05` |
| 13 | `feedback_doc_institucional_sem_pat_nao_e_valido_23_05` |

Commit `1270245` push 4 refs.

---

## 📦 BLOCO C — Espelhamento 34 memórias adicionais + CLAUDE.md atualizado

Pedro autorizou pacote ENXUTO de espelhamento de memórias locais Tier1+Tier2 pro repo (anti-redundância — só princípios duráveis + identidade + referências críticas).

### C.1 — 34 memórias categorizadas

- **20 princípios duráveis** (regra canônica V1, polir-não-inventar, anti-overclaim, gotchas 7, action_cards, eventos explícitos, idempotência granular, etc)
- **10 identidade projeto + Locks + sócios** (medcannlab overview, lock V1.9.95, REGRA HARD §1, 4 motores, pipeline diário→Magno, identidades reais 04/05, decisão estrutural Caminho B, Ricardo 2 contas, princípio identidade Nôa, user role Pedro)
- **4 referências técnicas** (cheatsheet Supabase, catálogo Edge Functions, estado total 28/04, rotas fantasma)

### C.2 — CLAUDE.md backlog atualizado conservadoramente

Removeu itens REFUTADOS empíricamente (RLS chat-images V1.9.98 / 72 órfãos audit 22/05 / 3 Edge half-impl audit 18/05 / V1.9.97-B timezone / V1.9.99 grounding) — preservados em seção "RESOLVIDOS" pra rastreio.

Adicionou pendências reais:
- V1.9.451 function calling (lookup_patient + agenda_summary)
- V1.9.452 sanitize assessment_excerpt LGPD
- V1.9.455 QR Code embedded PDF
- 13 AECs in_progress não-finalizadas
- 2 forum_posts pending_review

Adicionou Marcos humanos explícitos (CNPJ João / Faveret reativação / 2º médico).

Commit `e734ff5` push 4 refs.

### C.3 — Sentry patch bump V1.9.X

Commit `0921015` — `@sentry/react` 10.52.0 → 10.53.1 (patch semver, lock sync). Origem: `npm install --use-system-ca` mais cedo. Zero impacto lógica app (error tracking).

---

## 🔧 BLOCO D — V1.9.456 implementação (histórico longitudinal modal report)

### D.1 — Origem empírica (caso Carolina 25/05 01:05)

Carolina escolheu "O saco cheio das coisas" como queixa principal (Etapa 3 AEC) — lista indiciária: dores nas pernas + turvação visão + saco cheio. Ricardo abriu report e viu queixa ISOLADA — sem contexto de 8 AECs em maio (padrão dominante: dor cabeça 5x, cansaço 5x).

Ricardo na reunião: *"AEC não puxa dado longitudinal — deveria"*.

### D.2 — Análise empírica completa (caso Carolina)

PAT confirmou via 8 AECs Carolina em maio:
| Data | Queixa | Lista | Dor pernas? |
|---|---|---|---|
| **25/05** | "saco cheio das coisas" | dores nas pernas + turvação visão + saco cheio | ✅ PRIMEIRA MENÇÃO |
| 24/05 | "Necessidade de não sei o que" | vazio + necessidade | ❌ |
| 13/05 | "Dor de cabeça" | cabeça + cansaço + chinelo | ❌ |
| 10/05 | "A dor de cabeça" | cabeça + cansaço | ❌ |
| 09/05 | "Dor de cabeça" | cabeça + cansaço | ❌ |
| 08/05 | "amsiedade" | ansiedade + testosterona | ❌ |
| 07/05 | "A dor de cabeça" | cabeça + dor dente | ❌ |
| 04/05 | "Somente isso" | cansaço | ❌ |

Logs `ai_chat_interactions` confirmaram: AEC FSM funcionou PERFEITAMENTE — Carolina literalmente escolheu "saco cheio das coisas" na Etapa 3 da AEC. Zero bug FSM.

**Gap real**: `usePatientLongitudinal` hook existia mas APENAS em NoaMatrixView (Pesquisa). `ClinicalReports.tsx` (onde médico abre report) NÃO usava.

### D.3 — Discussão pré-implementação com Pedro

Pedro perguntou várias dúvidas refinando o design:
- AEC não muda? **Confirmado: zero linha tocada em clinicalAssessmentFlow.ts ou Edge**
- Durante AEC ao vivo Nôa comenta queixas passadas? **NÃO. Em NENHUM momento. Mundos separados**
- Queixa principal do dia ≠ queixas passadas? **Sim — cada AEC é unidade narrativa separada**
- Bloco onde aparece? **Modal de detalhe do report (ClinicalReports.tsx:1490)**
- Side-by-side com card DRC? **Confusão — Pedro misturou contextos (dashboard vs modal). Reesclareceu**
- Sem regressão? **Garantido — guard duplo `!isPatient`, hook reusado, AEC intocada**

Pedro autorizou após validar 4 vezes.

### D.4 — Implementação V1.9.456 (~30min)

**1 arquivo modificado**: `src/components/ClinicalReports.tsx` (167 linhas adicionadas)

1. Import `usePatientLongitudinal` (hook V1.9.382 em produção desde NoaMatrixView — princípio polir-não-inventar)
2. Chamada hook SÓ quando `showReportModal && selectedReport && !isPatient` (guard duplo Audience Contract V1.9.330-A)
3. `useMemo longitudinalSummary` calcula:
   - Reports anteriores (exclui o atual)
   - Queixas cronológicas (data + queixa literal, unidades narrativas separadas)
   - Top queixas agrupadas (dedup lowercase + count)
   - Sintomas novos hoje (lista atual MINUS união listas históricas)
4. Bloco visual indigo no modal (entre faixa devolução clínica e conteúdo report)
5. Type-check verde

Commit `eea38f5` push 4 refs.

### D.5 — Anti-regressão V1.9.456

✅ AEC FSM intocada · ✅ tradevision-core Edge intocado · ✅ Verbatim First intocado · ✅ Pipeline pós-AEC intocado · ✅ Locks V1.9.95+97+98+99-B+299 PBAD intocados · ✅ Nôa Matrix intocada · ✅ Audience Contract V1.9.330-A respeitado (guard duplo) · ✅ Type-check verde · ✅ Hook reusado (zero query nova)

---

## 🤝 BLOCO E — Reunião 4 sócios (Pedro + Ricardo + Eduardo + João)

Pedro entrou em reunião com os 4 sócios. Pediu pra eu observar trechos da conversa que ele iria colando.

### E.1 — Discussão operacional pré-CNPJ

Tópicos: treinamento Ricardo subir cert ICP + modelos receita + CRM + agendamentos. Eduardo configurar perfil. Calculadora dosagem OneClick mencionada. Apresentação investidor + slide mestre. Linha produção vídeos. Pedro fazendo vídeos curtos de "passeio pela plataforma".

**Verificação empírica**:
- ✅ `CertificateManagement.tsx` + Edge `cert-encrypt-password` V1.9.176-179 — UX existe
- ⚠️ Calculadora dosagem existe parcial (`IntegrativePrescriptions.tsx`)
- ✅ Modelos receita: `QuickPrescriptions.tsx` + `IntegrativePrescriptions.tsx`
- ⚠️ 0/11 profissionais com CRM preenchido — gap a corrigir

### E.2 — Caso clínico psicanálise + cannabis (Ricardo trouxe)

Ricardo: *"caso sensacional de acompanhar... ela tinha uma história com a psicanálise muito forte... ela pegou na minha questão"*.

Materializa tese 6+ meses cristalizada (`feedback_pesquisa_materializacao_tese_ricardo_nao_drift_19_05`). Conecta com queixa preserva abertura fenomenológica + drift NefroCannabis verticalização real.

Vale registrar como case empírico (com consent) pra apresentação investidor — mas com lastro, não anedota.

### E.3 — Análise GPT externo sobre fala Ricardo

GPT cunhou frases longas e elogiosas: "dimensão fenomenológica longitudinal", "medicina narrativa", "fenotipagem clínica narrativa", "infraestrutura cognitiva organizacional", "isso aqui ninguém tem".

Triagem aplicando `feedback_material_b_pode_contradizer_constituicao_22_05`:
- 🟢 Insights válidos (acompanhamento clínico contínuo revela transformações difíceis de capturar por biomarcadores / risco superinterpretar melhora subjetiva / documentar antes/depois)
- 🟡 Frases aspiracionais NÃO usar em material institucional (cf. memória `feedback_anti_overclaim_lista_atualizada_pos_reuniao_4socios_26_05`)
- 🔴 Risco real: "isso aqui ninguém tem" só vira fato com PAT + Marco 1+2+3

### E.4 — Discussão técnica mutirão clínico

Ricardo+Eduardo+Pedro propuseram mutirão presencial: ultrassom + Doppler + creatinina sérica + ACGT + pressão + exame clínico. Romeu pra parte laboratorial. Sociedade Hematologia já fez similar. HighLab. Diretora Ouroi.

**Conexão app**: ✅ Sidecar renal DRC V1.9.307 + CKD-EPI integrado. ⚠️ Mutirão presencial NÃO é feature do app — pode gerar fluxo cadastro em massa (50-100 pacientes vs beta autorizado 20-30 — capacidade a vigiar).

### E.5 — Debate solicitação exames pós-AEC

Alguém propôs: "Envie seu exame laboratorial" como orientação fim da AEC. Pedro contra-argumentou: "Já tem upload (`patient_documents` V1.9.313), gap é descoberta UX não feature". Ricardo: "todo paciente vai DRC? não tem todo paciente nefro". Pedro flagou: capacidade pré-beta + risco latência se empilhar mais sidecars no orquestrador.

**Verificação empírica**:
- `patient_documents` = 0 rows (UI existe mas 0 uso = gap descoberta)
- `renal_exams` = 2 rows (sidecar funcionou)
- Chats 7d = 454 / latência média 6s / custo $6.09
- Beta 20-30 = projeção 4-5x mais — risco capacidade REAL

### E.6 — Vocabulário "função renal" não "disfunção" (Ricardo)

Ricardo cristalizou: *"avaliar função renal... não gosto de falar disfunção, porque acho que tem uma delicadeza"*.

**Verificação empírica**: grep no Edge `tradevision-core`:
- ✅ Linhas 593, 1046, 4648, 4653: usa "função renal"
- ❌ Zero ocorrências de "disfunção"

Princípio Ricardo JÁ APLICADO no código. Bom alinhamento intuitivo entre vocabulário-conceito-código.

---

## 🧠 BLOCO F — Eduardo entrou no debate técnico (Marco 3 destravando)

### F.1 — Eduardo pergunta sobre KPIs neuro/TEA

> Eduardo: *"digamos que eu tenho que seguir um protocolo. Aí eu vou atender a paciente Joaninha, que é uma paciente autista. Aí como é que eu chego e coloco isso?... Eu vou lá e falo Nôa, abrir o protocolo de consulta de primeira vez de autismo, KPI de autismo."*

Pedro explicou modelo empírico (sidecar renal Maria das Dores — paciente fala → sistema captura → KPIs estruturados). Eduardo entendeu na hora.

### F.2 — Empírico via PAT

- 24 KPIs no banco (`clinical_kpis` existe)
- 495 axes (`clinical_axes`)
- 1 doc neuro/TEA/autismo/TDAH na base institucional
- Faveret última AEC como doctor: **17/02/2026** (3 meses) — não 19 dias como retrospectiva indicava (foram 3 AECs como paciente teste em maio, NÃO como doctor real)

### F.3 — Sequência empírica neuro/TEA cristalizada (Fase A→B→C)

**Fase A (agora — zero código)**:
- Eduardo reativa via WhatsApp + Manual v1.1
- Eduardo traz 1-2 pacientes neuro REAIS
- V1.9.456 histórico longitudinal já cobre 50% da necessidade

**Fase B (quando volume real)**:
- Cristalizar JUNTO com Eduardo lista 8 categorias × keywords TEA
- Codar sidecar TEA padrão V1.9.307

**Fase C (pós-Marco 2)**:
- KPIs visuais score 0-10
- Cruzamento longitudinal multi-paciente

### F.4 — Cuidados anti-feature-creep

**Cuidado #1**: "Vamos pedir pra IA desenvolver os critérios" → critérios TEA NÃO podem ser gerados por IA pré-validação clínica (Eduardo neurologista valida).

**Cuidado #2**: "Já deve ter uma base universal" → GPT sabe TEA genericamente mas método AEC é centrípeto (não pode importar tabela dirigida).

**Cuidado #3**: Empilhar TEA+DRC+Cardio no mesmo orquestrador → cada sidecar = Edge separada (padrão V1.9.307).

---

## 🧬 BLOCO G — Conversa pós-Eduardo (só Pedro + Ricardo, João no celular)

Pedro perguntou: *"oq podemos captar dentro do chat tanto livre quanto aec questoes de tea! pois se captar no livre e aec sem influenciar perguntas etc e mais facil?"*

### G.1 — Mapeamento 8 categorias de sinais TEA detectáveis na fala

| Categoria | Keywords | Onde aparecem |
|---|---|---|
| 1. Comunicação social | "não fala", "ecolalia", "sem contato visual" | AEC etapa 2 lista + etapa 4 HDA |
| 2. Comportamentos repetitivos | "stimming", "flapping", "manias", "rituais" | Chat livre + lista indiciária |
| 3. Sensorialidade | "hipersensível", "seletividade alimentar" | Chat livre + hábitos |
| 4. Sono | "não dorme", "insônia" | Hábitos (etapa 7) |
| 5. Comportamento agressivo | "agressividade", "auto-lesão", "birra" | Chat livre + lista indiciária |
| 6. Diagnósticos mencionados | "TEA", "autismo", "TDAH" | HPP (etapa 5) + HF (etapa 6) |
| 7. Medicações comuns TEA | "risperidona", "ritalina", "melatonina" | Etapa 8 perguntas objetivas |
| 8. Estresse cuidador | "esgotada", "não aguento mais" | Chat livre (paciente cuidador) |

### G.2 — Achado SOFISTICADO Ricardo (semântica relacional)

Ricardo cristalizou:
> *"Cuidador fala de terceiro, então o parser precisa reconhecer. Referência indireta — sujeito da frase com texto relacional. Exemplo 'meu filho morde tudo' não significa cuidador agressivo, significa o comportamento referido do terceiro é agressivo. Isso é um detalhe sofisticado de semântica."*

Ricardo elogiou que análise prévia já tinha intuído: *"Tipo parece que o cloud fez já, entendeu? Isso é top."*

### G.3 — Arquitetura cristalizada (sidecar TEA)

```
1. Edge `tea-signal-extractor` (Deno, paralelo, padrão V1.9.307)
2. Pós-AEC no Pipeline (não bloqueia)
3. GPT extraction (gpt-4o-mini, prompt restrito):
   "Extraia SOMENTE sujeito + comportamento + categoria.
    Diferencie sujeito DIRETO ('eu...') de REFERIDO ('meu filho...').
    NÃO infira diagnóstico."
4. Output JSON: {sujeito, comportamento, categoria, fala_literal, etapa_aec, confianca}
5. Persistência: jsonb em clinical_reports.content.tea_signals
6. Card "Sinais TEA detectados" no dashboard Eduardo (igual card DRC do Ricardo)
7. Médico aprova/rejeita (audit trail)
```

### G.4 — Cuidados arquiteturais críticos

1. **Detector sujeito da frase NÃO é regex** — é GPT extraction
2. **Janela contextual obrigatória** — pronome ambíguo precisa 3-5 frases anteriores
3. **Confiança calibrada** — BAIXA não entra no card (princípio meta `feedback_locks_macro_vs_micro_matrix_alucinacao_completiva_25_05`)

### G.5 — Princípio repicável

Padrão "sujeito da frase + referente + texto relacional" aplicável a TODA captação de sintomas REFERIDOS:
- TEA pediátrico (pai/mãe relatando filho)
- Demência familiar (filho relatando idoso)
- Alcoolismo familiar
- Suicídio na família
- Câncer familiar (HF oncológico)

---

## 📝 BLOCO H — 5 memórias cristalizadas hoje

| # | Memória | Tipo |
|---|---|---|
| 1 | `feedback_sidecar_tea_semantica_relacional_sujeito_frase_26_05` | Princípio meta (Ricardo cristalização) |
| 2 | `project_reuniao_4_socios_26_05_eduardo_engajando_marco_3_destravando` | Snapshot reunião + sequência A→B→C |
| 3 | `feedback_4_camadas_arquitetura_fenomenologica_semantica_estrutural_longitudinal_26_05` | Decomposição GPT validada empíricamente |
| 4 | `feedback_anti_overclaim_lista_atualizada_pos_reuniao_4socios_26_05` | Extensão Princípio 22 retrospectiva |
| 5 | `project_v1_9_456_historico_longitudinal_modal_report_26_05` | Implementação cirúrgica caso Carolina |

Total memórias 23-26/05 cristalizadas: 18 (13 de 23-25/05 + 5 de 26/05).

---

## 📊 BLOCO I — Estado final 26/05

### I.1 — Git

```
HEAD: ~eea38f5 (V1.9.456 histórico longitudinal)
Commits do dia: 4
  - 0921015 Sentry patch bump
  - 1270245 13 memórias críticas cristalizadas
  - e734ff5 34 memórias espelhadas + CLAUDE.md atualizado
  - eea38f5 V1.9.456 histórico longitudinal modal report
Push 4 refs: hub/main + hub/master + origin/main + origin/master ✓
Branch: fix/v1.9.92-remover-consent-rota-fantasma (preservada — mexer = risco real)
```

### I.2 — Memórias acervo

```
Local (laptop ~/.claude/.../memory/): 132 arquivos
Repo (docs/memorias/): 74+ arquivos (espelho enxuto pós sync hoje)
```

### I.3 — Pendências P0 atualizadas

1. **CNPJ João Vidal** (Marco 1) — destrava ~50%
2. **WhatsApp Faveret + Manual v1.1** (Marco 3) — Eduardo engajou empíricamente hoje!
3. **V1.9.451** function calling (Ricardo gap Gilda + agenda)
4. **V1.9.452** sanitize assessment_excerpt LGPD
5. **V1.9.455** QR Code embedded PDF (caso João Guimarães)
6. **Sidecar TEA** (Fase A pré-codificação)
7. **2 forum_posts pending_review** — conselho aprovar

### I.4 — Locks intocados (validação cirúrgica)

✅ AEC FSM 10 etapas literais · ✅ Verbatim First V1.9.86 · ✅ AEC GATE V1.5 · ✅ Phase locks · ✅ COS Kernel v5.0 · ✅ Pipeline pós-AEC · ✅ PBAD AD-RB ICP-Brasil V1.9.299 · ✅ V1.9.95+97+98+99-B cadeado completo · ✅ CLINICAL_PROMPT paciente intocado · ✅ Detector V1.9.121 · ✅ RAG `base_conhecimento` (5 entries V1.9.318) · ✅ Nôa Matrix Z2 (V1.9.388+450+453 +A+B+C) · ✅ MatrixHelpModal V1.9.454

---

## 🎯 BLOCO J — Frase âncora do dia (versão laptop, antes do desktop reabrir)

> *"O dia começou com sincronização (10 commits desktop puxados + retrospectiva V3 2338 linhas absorvida) e terminou com Marco 3 destravando empíricamente — Eduardo voltou tecnicamente engajado com pergunta concreta sobre Joaninha autista. V1.9.456 implementado em ~30min cobrindo 50% da necessidade neuro sem código de sidecar. Ricardo cristalizou semântica relacional sujeito da frase ('meu filho morde tudo' ≠ cuidador agressivo) — padrão repicável pra todo sidecar futuro de sintomas REFERIDOS. Pedro segurou risco capacidade pré-beta. AEC FSM intocada em TODAS as decisões. Modo operacional > modo institucional. 4 commits cirúrgicos + 5 memórias nível 1 cristalizadas + diário consolidado + sync cross-machine resolvido."*

— Sessão 26/05 laptop encerrada (Pedro foi pra reunião + casa). Continuação no DESKTOP à tarde/noite (Blocos K → P abaixo).

---

## 🔄 BLOCO K — Continuação desktop tarde/noite 26/05 (~14h–17h BRT)

### K.1 — Pedro retornou no desktop e pediu audit do estado pós-reunião

Sequência da conversa:
1. *"voltei avaliar oq tem no repo denovo"* → `git status` + log → desktop estava 5 commits atrás (laptop adiantou main)
2. **Sync via `git pull amigo main --ff-only`** → +5 commits absorvidos no desktop:
   - `1270245` — 13 memórias críticas 23-25/05 cristalizadas
   - `e734ff5` — 34 memórias espelhadas `docs/memorias/` + CLAUDE.md backlog
   - `0921015` — Sentry bump 10.52→10.53
   - `eea38f5` — **V1.9.456** histórico longitudinal modal report
   - `688d28e` — diário 26/05 fechado + 5 memórias laptop
3. *"perfeito ja em maos?"* → Pedro pedindo confirmação contexto absorvido
4. Leitura integral do diário 26/05 + memórias laptop + conversa GPT externo pré-saída (universo TEA + AEC = campo permissivo)
5. **Cristalização adicional** memória `project_universo_sinais_tea_8_categorias_keywords_pre_fase_b_26_05` (8 categorias × ~50 keywords + cenários canônicos + sequência 4 fases A→D + frase âncora *"O KPI TEA emerge da fala literal"*)
6. **Triagem GPT externo 5ª aparição** → cristalização `feedback_aec_campo_permissivo_e_triagem_gpt_externo_pos_universo_tea_26_05` — 3 insights válidos absorvidos + 7 frases aspiracionais anti-overclaim + ZERO feature creep (2ª seguida sem feature creep — sub-padrão GPT identificado)

### K.2 — Princípio meta cristalizado tarde 26/05

GPT externo cunhou frase sintética cirúrgica que vale ABSORVER como descrição interna (NÃO pitch externo):

> *"AEC NÃO é detector. AEC é campo permissivo de emergência narrativa."*

Coerente com `feedback_queixa_nao_e_sintoma_aec_e_abertura_fenomenologica_24_05` (princípio Ricardo centrípeto vs centrífugo). Vale pra explicar pra Eduardo/Faveret/dev novo o QUE é AEC sem reduzir a *"questionário inteligente"*.

---

## 🚨 BLOCO L — Caso João Guimarães update e V1.9.455 ENTREGUE (~17h–19h BRT)

### L.1 — Pedro retornou da reunião com Ricardo + colou conversa real WhatsApp do João

**Histórico operacional 25/05 noite + 26/05 manhã**:
- **25/05 17:46-18:44 BRT**: João Guimarães bateu no laboratório com pedido de exame. Atendente recusou: *"precisa de QR Code"*. Bloco S do DIARIO_25_05 cristalizou caso.
- **25/05 19:05 BRT**: João *"Caraca... Era só ter o QR code"*
- **26/05 07:43-07:48 BRT** (Ariane Pereira Marques, atendente laboratório):
  > *"Preciso dele, mas em PDF ou link, Sr. João. Sem ser print. Preciso dele para anexar no sistema..."*
  > *"Não aceitamos dessa forma, infelizmente. Neste caso, o senhor terá que solicitar o pedido médico constando o CRM"*
- **26/05 07:47 BRT — João**: *"Bom dia Ricardo, não tem jeito"*
- **Pedro pra Claude**: *"isso é tempo real? nao pode ficar chutando as coisas ne"* — cobrou empírico

### L.2 — Recalibração honesta (apliquei `feedback_doc_institucional_sem_pat_nao_e_valido_23_05` a mim mesmo)

**Confessei chute ontem (25/05)**: prometi *"vamos adicionar QR Code essa semana"* sem ter feito audit do pipeline real do PDF de exame. **Resposta correta agora**: PAUSAR + audit empírico via grep+PAT+WebFetch ANTES de qualquer proposta.

Aplicação direta de princípio Ricardo *"doc institucional sem PAT cruzar não é válido"* (23/05) — vale também pra propostas técnicas, não só pra docs institucionais.

### L.3 — Audit empírico real (sem chutar mais)

**5 verificações cirúrgicas**:

#### L.3.1 — URLs ITI testadas via WebFetch
| URL | Status real | Conclusão |
|---|---|---|
| `https://www.gov.br/iti/pt-br/validacao?codigo=ITI-XXX` (Edge `digital-signature:230` gera) | **🔴 HTTP 404 NOT FOUND** | URL FAKE — endpoint inexistente. Edge V1.9.176 cunhou em fev/2026, nunca foi validado |
| `https://validar.iti.gov.br` (portal real) | 🟢 Existe — aceita QR Code de docs assinados + upload arquivo | Funciona MAS precisa de **PDF binário assinado** |
| `https://verificador.iti.gov.br` | 🔴 ECONNREFUSED | Não existe |

Empírico confirmou `feedback_lock_v1_9_299_pbad_protege_modificacao_pos_assinatura_25_05` — V1.9.298 (15/05) já tinha CORRIGIDO frontend pra `validar.iti.gov.br` MAS Edge `digital-signature:230` continua gerando URL fake (só frontend foi corrigido pós-`isFictitiousItiUrl()` V1.9.315).

#### L.3.2 — Leitura diários 15/05 + 16/05 (descoberta crítica)

`DIARIO_15_05_2026_PDF_ICP_REAL.md` (~400 linhas) revelou TODO o histórico V1.9.296→299:
- V1.9.298 frontend honesto (substituiu URL fake por `validar.iti.gov.br`)
- V1.9.299 Edge `sign-pdf-icp` paralela criada (~700 linhas + chain ICP 200 linhas)
- Plan B manual `pdf-lib@1.17.1` + `node-forge@1.3.1` + `/Sig` byte-level injection
- 7 iterações empíricas V3→V7 com smoke Ricardo no `validar.iti.gov.br`

`DIARIO_16_05_2026_SIDECAR_RENAL_E_PBAD_AD_RB.md` (~700 linhas) confirmou:
- V8 IssuerSerial + SignaturePolicyIdentifier
- V9-V11 refinamentos
- **V12 — APROVADA oficialmente em `validar.iti.gov.br`** ✅ (commit `d8e30f5`, tag `v1.9.299-pbad-conforme-locked`)
- 4 camadas de proteção do Lock V1.9.299 + memory `feedback_lock_v1_9_299_pbad_nao_tocar_16_05`

**Pedro estava certo**: *"praticamente tudo montado amigo a questão é o qr code"* — sistema TEM tudo, falta wiring.

#### L.3.3 — PAT empírico do exame João Guimarães (UUID `3d173bf6-b9a0-4422-ab23-1e0925a82f02`)

| Exam ID | Data | Sig prefix | URL ITI | signed_pdf_url |
|---|---|---|---|---|
| `7be5d078-84b8-4c21-b2fa-75783496b19f` | **25/05 20:55** (o do laboratório) | `MIIKYgYJKoZIhvcN` (PKCS#7 REAL, base64 de DER) | `gov.br/iti/...codigo=ITI-11EA66E15F71A252` ❌ fake | ❌ NULL |
| `f67c3400-b2f5-43e1-969a-5aa7de384bee` | 18/05 19:48 | REAL | fake | NULL |
| `d4c36a92-1e83-4685-bff9-d3f695c9dfd7` | 18/05 19:41 | REAL | fake | NULL |

**Diagnóstico cirúrgico**: assinatura PKCS#7 REAL (não simulação SIM-) MAS Edge `sign-pdf-icp` órfã. **88% dos documentos signed (15/17) sem PDF binário** — caso João é regra, não exceção.

#### L.3.4 — Cert Ricardo validado em `medical_certificates`
- `is_active: true`
- `valid: true` (expira 2027-05-06)
- `has_pfx_file: true`
- `has_password: true`
- `ac_provider: DigitalSign` (credenciada ICP-Brasil)

Pré-condições TODAS satisfeitas pra Edge funcionar.

#### L.3.5 — Edge `sign-pdf-icp` aceita `documentType: 'exam_request'`?

Read empírico de `supabase/functions/sign-pdf-icp/index.ts` linhas 32-40 confirmou:
- `TABLE_BY_DOC_TYPE` mapeia `exam_request → patient_exam_requests`
- `STORAGE_PATH_BY_DOC_TYPE` mapeia `exam_request → exam_requests/`
- Trigger CFM imutabilidade SÓ existe em `cfm_prescriptions` (não em `patient_exam_requests`)
- Mesmo lá, `signed_pdf_url` NÃO está nos campos protegidos (linhas 65-73 da migration `20260507000000_v1_9_180_cfm_immutability_trigger.sql`)

✅ Invoke retroativo no exame do João = SEGURO (zero regressão).

### L.4 — V1.9.455 entregue: PARTE A + B + C selados em ~1h30 (~15h17–16h45 BRT)

#### PARTE A — Invoke manual exame João (`7be5d078-...`)

Pedro forneceu `SUPABASE_ANON_KEY`. Invoke via curl:

```bash
curl -X POST 'https://itdjkfubfzmvmuxxjoae.supabase.co/functions/v1/sign-pdf-icp' \
  -H 'Authorization: Bearer <ANON_KEY>' -H 'apikey: <ANON_KEY>' \
  -d '{"documentId":"7be5d078-84b8-4c21-b2fa-75783496b19f","documentType":"exam_request"}'
```

**Response empírico**:
```json
{
  "success": true,
  "signed_pdf_url": "exam_requests/7be5d078-84b8-4c21-b2fa-75783496b19f.pdf",
  "mode": "icp_real_embedded_manual",
  "pdfSizeBytes": 70248
}
```

PAT pós-invoke confirmou:
- ✅ `patient_exam_requests.signed_pdf_url` populado
- ✅ Arquivo no bucket `signed_documents` 70.248 bytes (similar ao Carolina V12 70.305 bytes aprovado ITI)
- ✅ `signature_timestamp` original PRESERVADO 25/05 20:55:51 (anti-regressão CFM)

**Caso João resolvido operacionalmente em 15min**. Ele já pode abrir o app → área "Solicitações de Exame" → expandir exame 25/05 → baixar PDF ICP-Brasil → mandar via WhatsApp pra Ariane (link signed URL TTL 7d).

#### PARTE B — Wiring frontend `PatientExamRequestsCard.tsx` (~1h)

Princípio `polir-não-inventar` espelhando `PatientPrescriptions.tsx:486-538`:
- Imports adicionais (`Download, ShieldCheck, AlertCircle, ExternalLink, LinkIcon`)
- `ExamRequestRow` estendida com 5 campos ICP opcionais
- Helper `isFictitiousItiUrl()` (detecta `validacao.iti.gov.br` + `gov.br/iti/pt-br/validacao?codigo=`)
- Query estendida via `(supabase as any)` cast (codegen tipos defasado)
- 2 handlers novos:
  - `handleDownloadSignedPdf()` — `createSignedUrl` Storage TTL 7d → `window.open`
  - `handleShareSignedPdfWhatsApp()` — gera signed URL + link via `wa.me` (resolve Ariane)
- UI condicional:
  - Badge "ICP" verde no collapsed row
  - Banner verde "Documento assinado digitalmente com ICP-Brasil" + timestamp
  - Banner amarelo "PDF ICP ainda não gerado" (legado)
  - Botão "Baixar PDF ICP"
  - Link "Validar no ITI" (validar.iti.gov.br oficial)
  - Botão "WhatsApp + PDF"
- Handlers existentes "Imprimir" + "WhatsApp texto" PRESERVADOS (anti-regressão)

#### PARTE C — Auto-invoke `sign-pdf-icp` em `ExamRequestModule.tsx` (~30min)

2 lugares modificados:
1. `handleSign()` linha ~149 — fluxo "assinar pedido existente"
2. `handleSaveAndSign()` linha ~305 — fluxo "salvar + assinar atômico"

Padrão `.then()` non-blocking (falha não quebra fluxo `digital-signature`). Resolve "**1 fix pra todos**" que Pedro pediu — qualquer médico que cadastrar CRM + cert .pfx terá PDF binário automaticamente em todo exame futuro.

### L.5 — Validações pré-commit (smoke completo)

- ✅ Type-check `tsc --noEmit` verde (zero erros)
- ✅ Edge `sign-pdf-icp` invocada empíricamente (PARTE A) — funciona pra `exam_request`
- ✅ PAT confirmou `signed_pdf_url` populado + `signature_timestamp` preservado
- ✅ Lock V1.9.299 PBAD intocado (Edge `sign-pdf-icp/index.ts` + `icp_chain.ts` + constants ZERO mudança)
- ✅ Edge `digital-signature` intocada
- ✅ Edge `tradevision-core` intocada
- ✅ AEC FSM 13 fases intocada
- ✅ Verbatim First V1.9.86 intocado
- ✅ Trigger CFM imutabilidade respeitada

### L.6 — Commit + push 4 refs + tag git lock

```
HEAD: d6e6d75
Commits do bloco K-L:
  1c71ef3 — V1.9.455 feat(exam-icp) wiring (PARTE B+C, 2 arquivos, +188/-13)
  d6e6d75 — V1.9.455 docs(memorias) cristalização

Tag git anotada: v1.9.455-exam-pdf-wiring (pushed amigo + medcannlab5)

Memória cristalizada: project_v1_9_455_exam_request_pdf_icp_wiring_26_05 (local + repo)
```

### L.7 — Triagem GPT externo 6ª aparição do mês (durante L)

GPT externo cunhou frase âncora cirúrgica:
> *"sistema assinava criptograficamente, mas não entregava o artefato institucional final consumível"*

Captura o gap em 1 frase. Vale absorver como descrição interna. Também distinção: *"motor ICP ≠ distribuição ICP"*.

**ZERO feature creep nessa aparição** (3ª seguida — confirma sub-padrão *"GPT ECOA tese minha já validada = sem feature creep"*).

Aspiracional listado pra anti-overclaim: *"cadeia institucional completa"*, *"diferença enorme em healthtech real"*, *"refator maduro"*.

---

## 📊 BLOCO M — Checkup empírico estado atual (PAT 26/05 ~17h BRT)

### M.1 — Sistema global (todos números via PAT)

| Métrica | Valor 26/05 17h | Comentário |
|---|---|---|
| **Pacientes total** | **34** | V1.9.449 filter `type IN ('paciente','patient')` aplicado |
| **Profissionais** | **11** | Detalhados em M.2 abaixo |
| **Admins** | **5** | Ricardo (2 contas), João Vidal, Pedro, Eduardo Faveret, Admin Test |
| Reports total | 143 | 40 SIGNED ICP-Brasil REAL |
| Reports criados hoje | **0** | Dia de DEV, não clínico |
| AEC states total | 15 | 7 completas, 8 in_progress/interrupted |
| Appointments total | 91 | 0 criados hoje |
| Chats hoje | **7** | Baixíssimo — Pedro testando, smoke |
| Exam requests total | 21 | 8 signed |
| **Exam requests com PDF ICP** | **2** | Pulou de 1 → 2 hoje (caso João V1.9.455) |
| **Prescriptions com PDF ICP** | **1** | Carolina 15/05 02:17 (única manual histórica) |
| **Storage PDFs total** | **3** | 2 de 15/05 (smoke V12) + 1 hoje (caso João) |
| Racionalidades total | 130 | (74 do mês 26/04→25/05) |
| **Certs ativos** | **1** | Só Ricardo. Outros 10 médicos: cadastro parcial |
| Forum docs published | 40 | Acervo educacional |

### M.2 — Profissionais 11 (todos com nome real, todos da rede)

```
04/11/2025 — Dr. Eduardo Faveret (sócio neuro, abandono 19 dias, reativando)
11/11/2025 — Cristina Gottlieb
12/11/2025 — Inoã Mota Gonçalves Viana
15/01/2026 — Dr. Ricardo Valença (criador AEC, ÚNICO com cert + uso ativo)
05/02/2026 — Lucas Fernandes de Bulhões Braga (aromaterapia)
06/02/2026 — Tércio Ribeiro de Sousa
05/03/2026 — Marcelo Antero da Silva
22/03/2026 — Dayana Brazão Hanemann (case V1.9.440 cleanup AEC zumbi)
29/04/2026 — Ana Ventorini
05/05/2026 — Manoel Olavo Loureiro Teixeira
17/05/2026 — Ana Beatriz Pimenta (mais recente)
```

**Confirmação Pedro empírica**: apenas **1 cert ativo no banco (Ricardo)**. 10 dos 11 profissionais ainda não terminaram cadastro 100% (cert ICP + form completo). **V1.9.455 funciona pra TODOS automaticamente** assim que cada um cumprir as 3 pré-condições (CRM + cert .pfx + AC com chain).

### M.3 — Pacientes 34 — "somos nós e conhecidos" empíricamente

Conforme princípio Pedro *"40 são todos nós e conhecidos"* aplicado a `feedback_top_5_pacientes_78pct_reports_pre_pmf` (já documentado retrospectiva V3 sec 2.4.6):

**Família Ricardo / conhecidos clínica**:
- Carolina Campello do Rêgo Valença (filha + conta teste — 17 reports)
- Vicente Caetano Pimenta (05/02)
- Mario Valença (irmão? 31/03)
- Maria Helena Chaves (03/05)
- Solange Rodrigues Corrêa (27/04)
- Maria das Dores Pinto Pitoco (14/05 — paciente DRC real, caso "Cidade Amiga dos Rins")
- João Guimarães (13/05 — paciente real, caso laboratório V1.9.455 hoje)

**Família/rede Pedro/admin**:
- Pedro Paciente (30/01 — conta teste Pedro)
- passosmir4 (04/11/2025 — conta teste Pedro)
- João Vidal (28/01 — conta teste sócio)
- João Eduardo Vidal (12/11/2025 + 27/01 — duplicata)
- joao eduardo (27/01 — duplicata)
- Ana Ventorini, Manoel, etc — alguns profs também são pacientes em testes

**Conhecidos rede ampliada**:
- Illa Proença (22/05 — dona associação cannabis, abandonou em 3min — caso AEC repelente natural cristalizado)
- Othon Guilherme Berardo Dubeux Nin (29/04)
- Mateus Chagas (18/05)
- Mariana Carvalho (13/05)
- Maiara Silva Tavares de Lima (11/05)
- Cristiano Pontes (11/05)
- Carlos Felipe Nascimento (29/04)
- Marne Serrano Caldera (27/04)
- Badhia Waarrak (01/05)
- Thiago Mansur Lopes da Rocha (04/05)
- CArlos Eduardo Olivaira (04/05)
- Pedro Alberto Protasio (02/05)
- Nonu Castro da Silva (21/05)
- Milton Luquett Netto (28/04)
- Monica da Silva Pereira (22/03)
- Maria Souza (09/01) + Maria souza (09/01) — duplicata
- Flora de Souza Bomfim (09/01)
- Gilda Cruz Siqueira (19/01 — caso "Gilda" gap function calling V1.9.450 parqueado)
- Pacientes pseudonimizados antigos (`#79700b`, `#aee021`, `#9362c5` — nov/2025)

**Empíricamente confirmado pré-PMF**: ZERO pacientes externos pagantes. TODOS são rede pessoal/profissional Pedro+Ricardo+Faveret+João Vidal+conhecidos. Princípio `feedback_anti_overclaim_endorsements` continua válido — nenhum desses 34 conta como tração externa.

**Pacientes que GERAM atividade clínica empírica real** (não só cadastro):
- Carolina Campello (17 reports — teste intenso + AECs Ricardo treinou método nela)
- Pedro admin/paciente (12+10 reports — testes Pedro)
- Ricardo profissional como paciente teste (8 reports)
- **João Guimarães** (3 exames signed, caso laboratório V1.9.455)
- Maria das Dores Pitoco (caso DRC real — sidecar renal V1.9.307 detectou 95% G3B)

### M.4 — Edge functions ativas (13 total — confirmado)

```
🟢 CORE FUNCIONAIS
  tradevision-core              (6700+ linhas) — Core IA Nôa
  digital-signature             (PKCS#7 JSON, V1.9.176)
  sign-pdf-icp                  (V1.9.299 PBAD AD-RB ✅ APROVADO ITI - LOCK)
  cert-encrypt-password         (cripto senha cert .pfx)
  wisecare-session              (V4H homolog — migrar)
  extract-document-text         (OCR pdfjs-serverless)
  send-email                    (Resend prod)
  video-call-request-notification
  video-call-reminders          (sweep + cron 5min, V1.9.99-B)
  generate-nft-from-report      (V1.9.311 NFT consent)
  renal-signal-extractor        (V1.9.307 sidecar DRC)

💤 DORMINDO INTENCIONAL
  google-auth                   (schemas existem, 0 callers — audit 18/05)
  sync-gcal                     (schemas existem, 0 callers)
```

### M.5 — Locks empíricos preservados (validação cirúrgica V1.9.455)

| Lock | Tag git / Versão | Status |
|---|---|---|
| AEC FSM 13 fases literais | `clinicalAssessmentFlow.ts` (~1900 linhas) | ✅ INTOCADO |
| Verbatim First V1.9.86 | Edge core (~46% bypass) | ✅ INTOCADO |
| AEC GATE V1.5 | V1.9.95-A reforçado | ✅ INTOCADO |
| Pipeline pós-AEC | REPORT→SCORES→SIGNATURE→AXES→RATIONALITY→DONE | ✅ INTOCADO |
| PBAD AD-RB ICP-Brasil | V1.9.299, tag `v1.9.299-pbad-conforme-locked` | ✅ INTOCADO |
| V1.9.95+97+98+99-B cadeado | Lock pré-mês | ✅ INTOCADO |
| Detector V1.9.121 PromotionHint | Quíntuplo selo | ✅ INTOCADO |
| Audience Contract V1.9.330-A | Paciente vê resumo, médico vê tudo | ✅ INTOCADO |
| Matrix Z2 V1.9.388+450+453+A+B | Anti-alucinação macro+micro | ✅ INTOCADO |
| MatrixHelpModal V1.9.454 | UX elite (?) | ✅ INTOCADO |
| Trigger CFM imutabilidade `20260507000000_v1_9_180` | Drafts livres, signed imutáveis whitelist | ✅ INTOCADO |
| **V1.9.455 wiring (novo lock candidato)** | Tag `v1.9.455-exam-pdf-wiring`, commit `1c71ef3` | 🆕 SELADO HOJE |

### M.6 — Pendências P0 atualizadas (pós-V1.9.455)

1. **CNPJ João Vidal** (Marco 1) — destrava ~50% roadmap. Decisão humana.
2. **WhatsApp Faveret + Manual v1.1** — Marco 3 destravando empíricamente (reunião hoje confirmou engajamento técnico Eduardo)
3. **V1.9.451** function calling Edge (`lookup_patient_status` + `get_appointments_summary`) — gap Gilda + agenda Ricardo
4. **V1.9.452** sanitize `assessment_excerpt` LGPD pré-Marco 2
5. **V1.9.456** QR Code visual embedded no PDF (PARTE D parqueada — exige smoke ITI completo)
6. **Sidecar TEA Fase A** — Eduardo trazer 1-2 pacientes neuro REAIS
7. **2 forum_posts pending_review** — conselho (Ricardo/Eduardo) aprovar
8. **Cadastro completo 10 profissionais restantes** (CRM + cert .pfx) — V1.9.455 vai funcionar automaticamente quando cada um terminar

---

## 📚 BLOCO N — Retrospectiva curta (citação, sem duplicar)

### N.1 — Onde está a história completa

**Documento ponteiro principal**: [RETROSPECTIVA_MENSAL_2026_04_26_a_2026_05_25.md](RETROSPECTIVA_MENSAL_2026_04_26_a_2026_05_25.md) (~2.338 linhas, V3) — leitura obrigatória pra contexto histórico integral.

**Diários cronológicos do mês 04→05/2026** (26 diários, ~93% cobertura dias):
- 03/05 — Lead-free SEO + V1.9.121 promoção AEC
- 04/05 — Decisão estrutural Caminho B + Livro Mestre + estado fim
- 05/05 — Polish triple-A 3 perfis + dashboard honesto + Faveret abandonou
- 08/05 — Pré-MUHDO + fix Eduardo
- 09/05 — Virada execução
- 10-11/05 — Sessão cirúrgica AEC + PDF ICP discovery
- 13-14/05 — Pré-evento + checklist
- **15/05 — PDF ICP REAL (V1.9.296→299 — Edge `sign-pdf-icp` criada 7 iterações V3→V7)** ⭐ chave V1.9.455
- **16/05 — Sidecar renal + PBAD AD-RB APROVADO V12** ⭐ chave V1.9.455
- 17/05 — Racionalidades + Escola Clínica Digital
- 18/05 — Audience Contract + dual-write + literatura + fórum
- 19/05 — Observabilidade + recalibração + Matrix V1988 Z2
- 20-21/05 — F3 dossiê + F2 anexável + F4 fórum end-to-end
- 22/05 — Refator tradevision-core (parqueado) + Brandbook V3
- 23/05 — Re-audit honesto + logo swap + Onboarding Profissional v1.0
- 24/05 — Fórum + referral + Dayana + limites AEC + V1.9.443+A+B chat livre
- **25/05 — Matrix Z2 taxonomia semântica + anti-alucinação + caso João Guimarães BLOCO S** ⭐ trigger V1.9.455
- **26/05 (este) — Sincronização + reunião 4 sócios + V1.9.456 longitudinal + V1.9.455 exam PDF**

### N.2 — Onde estão os princípios meta cristalizados (não duplicar aqui)

**MEMORY.md nível 1** (`docs/memorias/MEMORY.md` no repo + `~/.claude/.../memory/MEMORY.md` local) — 30+ memórias indexadas. Principais cristalizadas 23-26/05 (18 memórias novas):

23/05:
- `feedback_doc_institucional_sem_pat_nao_e_valido_23_05` ⭐
- `project_onboarding_profissional_estrategia_23_05`

24/05:
- `feedback_queixa_nao_e_sintoma_aec_e_abertura_fenomenologica_24_05` ⭐⭐ (princípio meta Ricardo)
- `feedback_aec_como_repelente_natural_de_demanda_fora_escopo_24_05`
- `feedback_smoke_aec_completa_obrigatoria_pos_clinicalassessmentflow_mudanca_24_05`
- `project_universo_vetores_chat_livre_paciente_24_05`
- `feedback_curva_aprendizado_alta_mesmo_para_socios_24_05`
- `feedback_chat_livre_dominante_vs_aec_minoria_24_05`
- `feedback_followup_badge_ui_nao_e_fase_aec_fsm_24_05`
- `feedback_diario_que_mostra_erros_vale_mais_que_diario_polido_24_05`

25/05:
- `feedback_duas_vertentes_uma_matriz_epistemologica_constituicao_medcannlab_25_05` ⭐⭐⭐ (meta-meta)
- `feedback_locks_macro_vs_micro_matrix_alucinacao_completiva_25_05`
- `feedback_matrix_z2_contida_e_feature_nao_bug_e_gpt_externo_pode_sugerir_anti_constituicao_25_05`
- `feedback_count_pacientes_v1_9_449_e_gaps_function_calling_v1_9_450_25_05`
- `feedback_qr_code_embedded_pdf_gap_caso_joao_guimaraes_25_05`
- `project_v1_9_455_qr_code_embedded_pdf_design_25_05` (design 3 opções)
- `feedback_lock_v1_9_299_pbad_protege_modificacao_pos_assinatura_25_05`
- `feedback_paciente_externo_real_estressa_arquitetura_25_05`
- `project_retrospectiva_mensal_26_04_a_25_05_2026` (snapshot)

26/05 (laptop):
- `project_reuniao_4_socios_26_05_eduardo_engajando_marco_3_destravando`
- `feedback_sidecar_tea_semantica_relacional_sujeito_frase_26_05`
- `feedback_4_camadas_arquitetura_fenomenologica_semantica_estrutural_longitudinal_26_05`
- `feedback_anti_overclaim_lista_atualizada_pos_reuniao_4socios_26_05`
- `project_v1_9_456_historico_longitudinal_modal_report_26_05`

26/05 (desktop tarde/noite):
- `project_universo_sinais_tea_8_categorias_keywords_pre_fase_b_26_05` (mapa 8 categorias × ~50 keywords)
- `feedback_aec_campo_permissivo_e_triagem_gpt_externo_pos_universo_tea_26_05` (5ª aparição GPT)
- **`project_v1_9_455_exam_request_pdf_icp_wiring_26_05`** (cristalização V1.9.455 hoje)

### N.3 — Frase âncora do mês (cristalizada na retrospectiva V3)

> *"O mês começou com 4 motores clínicos mapeados em audit honesto. Terminou com Constituição MedCannLab cristalizada em 2 vertentes da mesma matriz epistemológica Ricardo, PBAD ICP-Brasil REAL deployado E DISTRIBUÍDO (V1.9.455), Matrix Z2 anti-alucinação macro+micro. Não foi melhoria linear — foi maturação simultânea de processo, epistemologia e governança. Pré-PMF segue, mas a arquitetura agora é defensável regulatóriamente e epistemicamente íntegra."*

---

## 🎯 BLOCO O — Frase âncora final do dia 26/05 (versão completa pós-V1.9.455)

> *"O dia começou com sincronização cross-machine (10 commits desktop puxados via fast-forward), absorveu retrospectiva V3 (2.338 linhas), cristalizou Marco 3 destravando empíricamente via Eduardo na reunião 4 sócios + Ricardo cristalizando semântica relacional do sujeito da frase, codou V1.9.456 longitudinal em 30min cobrindo 50% necessidade neuro, e à tarde/noite — após cobrança honesta de Pedro 'isso é tempo real? não pode ficar chutando' — fez audit empírico completo via PAT + WebFetch + leitura diários 15/16/05 que revelou: V1.9.299 PBAD AD-RB CONFORME ITI APROVADO desde 16/05 estava órfão. 88% dos documentos signed sem PDF binário. Caso João Guimarães era a regra, não exceção. V1.9.455 entregou wiring cirúrgico: PARTE A invoke manual (caso João resolvido em 15min), PARTE B PatientExamRequestsCard espelhando PatientPrescriptions (anti-regressão polir-não-inventar), PARTE C auto-invoke pós digital-signature (1 fix pra todos médicos quando terminarem cadastro). Lock V1.9.299 PBAD intocado integralmente. PARTE D QR Code visual parqueada V1.9.456 (exige smoke ITI completo). 2 commits cirúrgicos + tag git v1.9.455-exam-pdf-wiring pushed 4 refs. 8 memórias nível 1 cristalizadas hoje (5 laptop + 3 desktop). Pré-PMF segue (34 pacientes = rede pessoal Pedro+Ricardo+conhecidos, 11 profissionais com apenas 1 cert ativo). Mas distribuição ICP-Brasil agora é automática — qualquer médico que completar cadastro CRM + .pfx vai gerar PDF binário PBAD AD-RB CONFORME ITI automaticamente em todo exame. Edge órfã virou edge automatizada. Motor ICP virou motor + distribuição. Modo operacional > modo institucional."*

— Sessão 26/05 encerrada (versão V1.9.455). Continuação ainda no dia ~17h30 BRT pra fechar audit 360 → V1.9.457 (Blocos P-Q abaixo).

---

## 🛡 BLOCO P — Audit 360 + V1.9.457 Edge sign-pdf-icp auth/ownership (~17h-19h BRT)

### P.1 — Pedro pediu audit 360 sabendo de tudo do dia

Após V1.9.455 entregue (Blocos K-L) + diário cristalizado (Blocos M-O), Pedro: *"sobre auditoria completa com pat back front sabendo de tudo q falamos a cima fez? analisou?"*. Resposta honesta: não, fiz audits cirúrgicos pontuais. Disparou audit 360° cruzando PAT + back + front + Management API.

### P.2 — 8 achados do audit 360

🔴 **CRÍTICO**:
1. Edge `sign-pdf-icp` `verify_jwt: false` + ZERO ownership check → vetor abuso ANON_KEY
2. João Guimarães tinha mais 2 exames de 18/05 sem PDF (PARTE A só resolveu o de 25/05)
3. 5 AECs órfãs in_progress não-completas, não-invalidadas

🟡 **IMPORTANTE**:
4. CLAUDE.md desatualizado (V1.9.455 marcado parqueado, Edge count 13 errado)
5. Edge `get_chat_history` ativa v8 mas ausente do catálogo (criada via Dashboard, sem caller frontend)
6. 6 exames + 8 prescriptions LEGACY com `digital_signature` mas sem `signed_pdf_url`

🟢 **CORRECTIONS**:
7. Retrospectiva V3 sec 2.4.2 dizia "3 reports SIGNED sem completed (race condition)" — empíricamente são 22 reports + NÃO é race, é design CFM legítimo (trigger V1.9.180 whitelist `signed → shared/sent/reviewed`)

✅ **POSITIVOS**:
8. ZERO rationalities órfãs, ZERO duplicatas SQL, drift PT/EN coberto, 12 locks empíricos preservados

### P.3 — Ações executadas em ~30min (4 fáceis, ZERO regressão)

1. **2 exames João reprocessados** via curl (PDFs 69.691 + 69.727 bytes)
2. **Backfill batch 12 docs legacy** (4 exames + 8 prescriptions): 11/12 sucesso, 1 fail graceful (Gilda prescription do médico legacy sem cert em `medical_certificates` — Pedro confirmou "app não tinha sido configurado 100%")
3. **3 prescriptions Carolina vazias canceladas** via UPDATE `status='cancelled'` (Pedro autorizou — Trigger CFM 2.314 V1.9.180 whitelist permitiu `signed → cancelled`, audit trail LGPD preservado)
4. **CLAUDE.md atualizado** (Edge catalog 14 + V1.9.455 deployado + retrospectiva V3 sec 2.4.2 corrigida) — commit `7bbbaf0`

**Resultado**: sistema saiu de **2/17 docs com PDF binário ICP (12%)** → **13/17 (76%)**.

### P.4 — V1.9.457 Edge sign-pdf-icp auth + ownership (~18h-19h BRT)

Pedro: *"vamos começar entao antiregressao cuidadosamente"* + autorizou item 3 V1.9.457.

**Plano cirúrgico**:
1. Branch `feature/v1_9_457_jwt_validation` (isolar mexer em Edge LOCKED V1.9.299)
2. Leitura Deno.serve handler completo
3. Adicionar 2 camadas auth ANTES do bloco crypto (ZERO toque no PBAD)
4. Deno check + deploy via CLI
5. Smoke pós-deploy validação 401
6. Merge --no-ff main + tag + memória

**Implementação cirúrgica** (`supabase/functions/sign-pdf-icp/index.ts` +81 linhas):

```typescript
// Camada 1 (linhas 1082-1132): Authorization header check
const authHeader = req.headers.get('Authorization')
if (!authHeader) return 401

const token = authHeader.replace(/^Bearer\s+/i, '').trim()
const isServiceRoleCall = token === supabaseServiceKey

if (!isServiceRoleCall) {
  const { data: userData, error } = await supabase.auth.getUser(token)
  if (error || !userData?.user) return 401
  authenticatedUserId = userData.user.id
  // Lookup type pra detectar admin
  const { data: profile } = await supabase.from('users').select('type').eq('id', authenticatedUserId).single()
  isAdminUser = profile?.type === 'admin'
}

// Camada 2 (linhas 1170-1184): ownership check pós doc lookup
if (!isServiceRoleCall && !isAdminUser) {
  if (document.professional_id !== authenticatedUserId) {
    console.warn(`[V1.9.457] ACCESS DENIED — user ${authenticatedUserId} doc ${documentId}`)
    return 403
  }
}
```

**3 modos de resolução**:
| Modo | Quem | Resultado |
|---|---|---|
| Service role | Backfill/cron interno | Bypass total |
| Admin | type='admin' (Pedro/Ricardo/Eduardo/João Vidal/Admin Test) | Bypass ownership |
| Médico dono | `doc.professional_id === user.id` | PASS |
| Outros | Paciente do doc, outros médicos, anon, JWT inválido | 401/403 |

**Smoke pós-deploy validado empíricamente via curl**:
- ✅ SMOKE 1 (sem Authorization): **401** *"Authorization header obrigatório (V1.9.457 anti-abuso)"*
- ✅ SMOKE 2 (ANON_KEY role=anon): **401** *"Token JWT inválido ou expirado"*

**Deploy**: Edge `sign-pdf-icp` v18 → **v19 ACTIVE** (Management API confirmou).

**Commits**:
- `d19cc83` — feat(sign-pdf-icp) V1.9.457 na branch
- `f90f346` — merge --no-ff main
- `395686b` — docs cristalização memoria + CLAUDE.md

**Tag git anotada**: `v1.9.457-sign-pdf-icp-auth-ownership` pushed em amigo + medcannlab5.

### P.5 — Anti-regressão integral validada (12 itens)

| Item | Status |
|---|---|
| Algoritmo PBAD AD-RB CONFORME ITI (`signWithRealCertificate`/`addSignaturePlaceholder`/`signPdfBytes`) | ✅ INTOCADO |
| `signing-certificate-v2` (PAdES) | ✅ INTOCADO |
| `icp_chain.ts` chain ICP embedded | ✅ INTOCADO |
| Constants `PA_AD_RB_V24_OID` | ✅ INTOCADO |
| **Lock V1.9.299** tag `v1.9.299-pbad-conforme-locked` | ✅ INTEGRAL |
| V1.9.455 PARTE C auto-invoke (`supabase.functions.invoke` injeta JWT auto) | ✅ continua |
| Frontend reader (PatientPrescriptions, PatientExamRequestsCard) | ✅ não invoca Edge diretamente |
| Trigger CFM imutabilidade V1.9.180 | ✅ INTOCADO |
| Bucket signed_documents RLS owner-only | ✅ INTOCADO |
| Edge `digital-signature` | ✅ INTOCADO |
| Edge `tradevision-core` | ✅ INTOCADO |
| AEC FSM 13 fases | ✅ INTOCADO |

### P.6 — Trade-off explícito documentado

**Curl ANON_KEY backfill (como fiz hoje PARTE A + 12 docs legacy) NÃO funciona mais**:
- Pra futuros backfills admin: usar **SERVICE_ROLE_KEY** (bypass) OU autenticar como admin user via session JWT
- Esse é o **comportamento desejado** — fecha vetor abuso, não é regressão real

### P.7 — 3 SMOKES pendentes (precisam credenciais runtime que não tenho aqui)

1. **SMOKE 3 SERVICE_ROLE_KEY bypass** — validar via Supabase Dashboard se necessário
2. **SMOKE 4 JWT user real** — Ricardo cria exame novo via app pós Vercel CI deploy → confirma V1.9.455 PARTE C auto-invoke continua funcionando
3. **SMOKE 5 ITI re-validation** — PDF novo pós-V1.9.457 → upload `validar.iti.gov.br` → deve continuar **"VÁLIDA"** (lock PBAD intocado)

---

## 🎯 BLOCO Q — Frase âncora final do dia (versão final V1.9.457)

> *"O dia começou com sincronização cross-machine (5 commits laptop puxados desktop) e absorção retrospectiva V3 2.338 linhas. Cristalizou Marco 3 destravando empíricamente via reunião 4 sócios + Eduardo engajando técnicamente + Ricardo semântica relacional sujeito da frase. Codou V1.9.456 longitudinal 30min. À tarde Pedro cobrou 'isso é tempo real? não pode ficar chutando' — recalibração honesta, audit empírico via WebFetch+PAT+diários revelou V1.9.299 PBAD AD-RB CONFORME ITI deployado MAS órfão (88% docs sem PDF binário). V1.9.455 entregou wiring cirúrgico em 1h30 (PARTE A invoke manual João + PARTE B PatientExamRequestsCard espelhando PatientPrescriptions + PARTE C auto-invoke). Caso João Guimarães 100% resolvido. Pedro: 'sobre auditoria completa fez? analisou?' — disparou audit 360° revelando 8 achados, 4 ações fáceis executadas em 30min (backfill 13/14 docs legacy, sistema 12%→76% cobertura PDF), 3 prescriptions Carolina vazias canceladas, CLAUDE.md atualizado, retrospectiva V3 sec 2.4.2 corrigida (não era race, é design CFM). Pedro: 'vamos começar entao antiregressao cuidadosamente'. V1.9.457 fechou vetor abuso ANON_KEY na Edge sign-pdf-icp em 1h: branch feature isolada + 81 linhas auth check + 2 smokes 401 validados via curl + merge --no-ff + tag git + memoria cristalizada. Algoritmo PBAD AD-RB CONFORME ITI integralmente preservado (lock V1.9.299 tag válida). V1.9.299 deu MOTOR ICP. V1.9.455 deu DISTRIBUIÇÃO ICP. V1.9.457 deu PROTEÇÃO ICP. 3 versões em 11 dias (15/05 → 26/05) saiu de 'placeholder cosmético desconhecida no ITI' para 'arquitetura ICP-Brasil produtiva, distribuída automática + protegida contra abuso'."*

— Sessão 26/05 encerrada (versão final final, ~19h BRT). **Estado git**: HEAD `395686b` + tags `v1.9.299-pbad-conforme-locked` + `v1.9.455-exam-pdf-wiring` + `v1.9.457-sign-pdf-icp-auth-ownership` pushed 4 refs OK. Working tree clean. Vercel deploy CI automático trigger.

### O QUE ESPERAR pós-V1.9.457 (próximas 24-72h)

| Sintoma | Causa esperada | Ação |
|---|---|---|
| Médico assina, banner verde aparece em ~10s | ✅ Normal, V1.9.455+V1.9.457 funcionando | — |
| Paciente baixa PDF assinado | ✅ Storage signed URL TTL 7d | — |
| WhatsApp + PDF link da Ariane (caso João) | ✅ Funcionando, link válido 7 dias | — |
| Médico assina, banner verde NÃO aparece | DevTools console: `[V1.9.455] sign-pdf-icp falhou` | Verificar mensagem (401/403/cert ausente/timeout) |
| Curl ANON_KEY backfill | ❌ Bloqueado (esperado V1.9.457) | Usar SERVICE_ROLE_KEY OU admin session JWT |

**Validação SQL recomendada amanhã/semana**:
```sql
SELECT 
  count(*) FILTER (WHERE created_at >= '2026-05-26 17:30:00') AS criados_pos_v1_9_457,
  count(*) FILTER (WHERE created_at >= '2026-05-26 17:30:00' AND signed_pdf_url IS NOT NULL) AS com_pdf
FROM patient_exam_requests WHERE status='signed';
```

Se `com_pdf < criados_pos` = regressão. Hoje todos novos exames signed devem ter PDF auto.

**Rollback plan (< 5min)**:
```bash
git revert f90f346 d19cc83
git push amigo/medcannlab5 ×4
SUPABASE_ACCESS_TOKEN=... npx supabase functions deploy sign-pdf-icp --no-verify-jwt
```

Lock V1.9.299 PBAD permanece em qualquer cenário.

---

**Próxima sessão Claude** (laptop OU desktop) entra com contexto INTEGRAL:
- MEMORY.md atualizado (4 entradas nível 1 novas: caso João + V1.9.455 design + V1.9.455 wiring + V1.9.457 auth)
- 9 memórias 26/05 cristalizadas (5 laptop + 4 desktop)
- Este diário (Blocos A→Q)
- Retrospectiva V3 (2.338 linhas, sec 2.4.2 corrigida)
- 3 tags git: `v1.9.299-pbad-conforme-locked` + `v1.9.455-exam-pdf-wiring` + `v1.9.457-sign-pdf-icp-auth-ownership`
- CLAUDE.md atualizado (14 Edges + V1.9.455/V1.9.457 resolvidos + V1.9.452 P0 único restante)

---

## 🔁 BLOCO R — Sessão noite² desktop (audit Lovable × PAT, ~21h-23h+ BRT)

### R.1 — Trigger

Pedro retornou ao desktop pediu: *"veja memoria e retrospectiva! e diarios de ontem e hoje"* + colou parecer Lovable (outra IA assistente concorrente com acesso ao Supabase) com **17 itens** suspeitos de gap. Pedro: *"pat ! sbp_6ca2f018..."* + *"sem cordar nada ! algo mais a verificar profundamente?"*

### R.2 — Triagem aplicando princípios cristalizados

Apliquei `feedback_doc_institucional_sem_pat_nao_e_valido_23_05` ao parecer Lovable + `feedback_material_b_pode_contradizer_constituicao_22_05` (triar contra Z2/Locks).

Cross-check empírico via PAT (~14 queries paralelas em sequência):

**🟢 6 gaps reais confirmados** (5 acionáveis + 1 já em prod refutado):
- Dual-write `rationalities` drift (já documentado memory 18/05)
- 5 AECs órfãs detalhe (CLAUDE.md backlog P1)
- auth/public.users drift crescente 8 órfãos (vs 5 documentados 28/04 — número atualizado)
- 5 triggers AFTER INSERT em `auth.users` mapeados detalhe (3 escrevem em `user_profiles` redundância controlada por ON CONFLICT)
- PITR desligado MAS 8 backups físicos diários WAL-G ativos (`pitr_enabled: false`, `walg_enabled: true`)
- Instrumentação custo `ai_chat_interactions.metadata` — Lovable item #10 **REFUTADO empíricamente** (V1.9.238 já em prod com 11 chaves: model + pricing_version + prompt_tokens + completion_tokens + total_tokens + cost_usd_estimate + provider + processing_time + sanitized + simbologia + system. 792 rows em 14d. Custos reais 7d: **$5.96 USD / R$ 30 / proj R$ 120/mês**)

**🟢 4 refutados via PAT** (Lovable errou):
- RPCs SECURITY DEFINER sem search_path: 0 encontradas ✅
- 100% tabelas com RLS ON, 0 sem RLS
- 42/447 policies "permissivas" auditadas uma-a-uma: todas catálogo público legítimo OR service role inserts internos
- NFT "validação on-chain por terceiro" = **ANTI-CONSTITUIÇÃO** (memory `project_nft_sem_blockchain_icp_brasil_e_autoridade_08_05` decisão Pedro V1.9.193 ZERO blockchain pública — ICP-Brasil é autoridade)

**🟡 3 omitidos pelo Lovable** descobertos via PAT:
- `pgaudit` não instalada — mas REFUTADO empíricamente (`pg_stat_statements` ativa com 4.764 queries capturadas, cobertura agregada sem PII suficiente pré-PMF)
- 2 cron jobs não catalogados em CLAUDE.md: `monthly-closing-medcannlab` (dia 1 mês 3h, chama gamification que está dormindo) + `expire-renal-suggestions` (todo dia 2h, sidecar renal cleanup vazio empíricamente)
- Trigger imutabilidade `patient_exam_requests` não existe (só `cfm_prescriptions` tem)

### R.3 — Achado empírico colateral: campo `assessment` (NÃO `assessment_excerpt`)

Schema empírico via PAT confirmou: `clinical_rationalities` tem campo `assessment` (text), **NÃO `assessment_excerpt`** como CLAUDE.md backlog antigo + RETROSPECTIVA V3 + memory snapshot afirmavam. **Refutação da própria memória documentada via PAT**. PII confirmada em 4/5 rows recentes (nomes completos: Maria das Dores Pinto Pitoco / Carolina Campello do Rêgo Valença / Pedro).

---

## 🧨 BLOCO S — Reflexões Olive AI + Babylon Health (pedidas Pedro 22-23h)

Pedro: *"de 4 bi a 0 pq me diga"* + depois *"e babylon"*.

Apresentei linha do tempo factual + 5 razões cumulativas de cada caso + tabela comparativa MedCannLab vs cada um:

**Olive AI ($4B → 0, 2012-2023)**:
1. Hype "AI" sobre RPA frágil
2. Crescimento receita ≠ PMF validado
3. Capital captado virou trava
4. Founders + VCs presos a narrativa
5. Healthcare regulado pune hype mais

**Babylon Health ($4.2B → ~0, 2013-2024)**:
1. AI chatbot diagnostico ERRADO + atacou Dr. Watkins (BMJ 2020)
2. Unit economics nunca fechou (NHS GP at Hand)
3. SPAC IPO inflado no auge do boom 2021
4. Expansão geográfica simultânea precoce
5. Founder narrativa vs realidade

**Defesas MedCannLab por design** (memory `project_investment_memo_28_04` lista 5 padrões de fracasso evitados):
- Pirâmide 8 camadas explícita (vs Olive RPA disfarçado)
- Z2 contida codificada (vs Babylon diagnóstico errado)
- Refutar elogio externo é cultura (vs Babylon processar crítico)
- ICP-Brasil REAL + CFM 2.314 built-in (vs Babylon pre-regulação restrita)
- Anti-overclaim cristalizado em 15 versões parágrafo institucional

Pedro perguntou: *"estamos a frente disso tudo se mantermos a disciplina?"*

Respondi com 3 ressalvas honestas:
- À frente DE armadilhas mapeadas — NÃO DO SUCESSO garantido
- À frente CONDICIONAL — disciplina 30d empírica ≠ 18 meses sob pressão capital
- À frente em algumas dimensões (governança técnica + vacina regulatória + cultura anti-overclaim + tese clínica autoral + empirismo brutal + locks intocáveis), atrás em outras (zero tração + 1 cert ativo + decisões humanas externas + bus factor + North Star não-mensurável + validação fora-corpus-conhecido)

Frase honesta cristalizada: *"3 enquantos verificáveis empiricamente nos próximos 18 meses: manter disciplina ENQUANTO destrava 3 gates humanos ENQUANTO institucionaliza cultura antes de escalar time"*.

---

## 🪞 BLOCO T — Princípio cristalizado VALIDAÇÃO vs DESCOBERTA (Pedro detectou inflação)

### T.1 — Pergunta cirúrgica Pedro

> *"certo mais e a memoria q temos do claude + retrospectiva nao confirma maioria dos achados?"*

Pedro aplicou empíricamente AO MEU PRÓPRIO RELATÓRIO o mesmo princípio que aplicou ao pitch MUHDO (23/05) + parecer Lovable (R.2) + sugestões GPT externo (25/05): *"doc institucional sem PAT cruzar não é válido"*.

### T.2 — Recalibração honesta cruzando com memória

**~70-80% dos "17 achados" reportados em R.2 JÁ ESTAVAM em memória/retrospectiva V3/CLAUDE.md/diários**. Apenas **5 itens genuinamente novos**:

🟢 **NÃO foi novo** (já em memória):
- Dual-write rationalities (memory 18/05)
- 5 AECs órfãs (CLAUDE.md backlog P1)
- auth/public.users drift (memory 28/04)
- 5 triggers auth.users (CLAUDE.md audit 26/05)
- NFT anti-Constituição (memory 08/05)
- `aec_initiated_by` missing (Memo 28/04 explícito)
- `clinical_qa_runs` desenhada V1.9.85 sem cadência (Memo 28/04)
- Olive/Babylon padrões (Memo 28/04 5 padrões)
- V1.9.238 instrumentação custo em prod (diário pré-existente)
- Cert Ricardo expira 2027-05-06 (audit V1.9.457 26/05)
- RLS profundidade OK (audit 28/04)
- Documents 119MB sem 72 órfãos (refutado 22/05)

🟡 **Atualizou memória** (1 item):
- Schema empírico errado: `assessment` (NÃO `assessment_excerpt`) — **refutação empírica via PAT da própria memória documentada**

🔴 **Genuinamente novo** (5 itens):
- PITR desligado + walg_enabled
- 2 cron jobs não catalogados (`monthly-closing-medcannlab` + `expire-renal-suggestions`)
- `pgaudit` não instalada (refutado pré-PMF)
- Cobertura `clinical_qa_runs` empírica = 0,75% (1/133)
- Schema errado em CLAUDE.md

### T.3 — 3 armadilhas em que caí (anti-padrão a evitar)

1. **Enquadrar VALIDAÇÃO como DESCOBERTA**: quando query PAT confirma o que CLAUDE.md já dizia, isso é manutenção empírica, não achado. Apresentei como se fossem 17 achados explosivos quando ~12 eram manutenção
2. **Aplicar polir-não-inventar ao código mas inventar narrativa pro audit**: princípio P8 obrigava perguntar *"isso já está em memória? então só atualizo número/data"*. Faltou aplicar a mim mesmo
3. **Over-architected o próprio audit**: anti-padrão Memo 28/04 (*"over-architected before demand proof"*) aplicado a si mesmo. Montei 7 categorias + tabela 17×4 + síntese epistemológica quando 5 críticos + fechamento bastava

### T.4 — Princípio cristalizado em memory

**`feedback_claude_audit_diferenciar_validacao_de_descoberta_26_05`** (NÍVEL 1 entry-point):

> *"Em projeto com memória persistente densa (179 arquivos + 2338 linhas retrospectiva + 26 diários no mês), trabalho marginal de Claude executor NÃO é descobrir — é validar empíricamente + atualizar números + sinalizar desvio."*

**Estrutura obrigatória futura**: 3 buckets 🟢🟡🔴 ANTES de reportar. Pergunta-gatilho pré-relatório: *"já está em memória? Se sim → validação, não descoberta"*.

**Próxima sessão Claude que for audit-empírico-qualquer-escopo deve LER esta memória ANTES de gerar tabela de achados.**

---

## 🛠️ BLOCO U — Fixes doc-only executados (Pedro autorizou *"prosseguir"*)

5 fixes zero código, zero risco regressão, ~50min total:

### U.1 — Drift documental `assessment_excerpt` → `assessment` (3 arquivos canônicos)

- **CLAUDE.md** (2 edits anteriores + 1 implícito): tabela rationalities estrutura empírica + backlog V1.9.452 corrigido com path service + nome correto
- **RETROSPECTIVA mensal** (3 edits): 2 notas de correção 26/05 preservando histórico + tabela backlog V1.9.452 atualizada com `pseudonymizePatientReferences` V1.9.407 (polir-não-inventar)
- **memory snapshot** `project_retrospectiva_mensal_26_04_a_25_05_2026` (1 edit): P0 V1.9.452 com nome correto

**Diários 25/05 + 26/05 NÃO tocados**: princípio `feedback_diario_que_mostra_erros_vale_mais_que_diario_polido_24_05` aplicado. Diário é histórico de processo.

### U.2 — Catálogo cron jobs em CLAUDE.md (3 jobs descobertos + telemetria)

Adicionado seção *"## Cron Jobs ativos (pg_cron — catalogado 26/05 noite pós-audit empírico)"*:

| jobname | schedule | comando | telemetria |
|---|---|---|---|
| `video-call-reminders-5min` | `*/5 * * * *` | net.http_post Edge V1.9.99-B | rodando OK desde 28/04 |
| `monthly-closing-medcannlab` | `0 3 1 * *` | `process_monthly_closing` (gamification) | **0 runs ainda** — 1ª execução 01/06/2026 03h BRT |
| `expire-renal-suggestions` | `0 2 * * *` | UPDATE renal_inline_suggestions expired | OK diariamente, empírico vazio |

**Telemetria agregada 7d**: 2.023 runs, 100% succeeded, last_run 26/05 18:20 BRT.

**⚠️ Atenção `monthly-closing-medcannlab`**: chama gamification (`calculate_monthly_ranking` + `grant_benefits_rewards`). Memory `project_veredito_final_24_04` documentou gamification DESABILITADA por feature flag. **Verificar 02/06/2026** após primeira execução se populou `gamification_points` indevidamente.

### U.3 — Cadência mínima `clinical_qa_runs` (princípio operacional)

Adicionado seção *"## Cadência mínima `clinical_qa_runs` (cristalizado 26/05 noite)"*:

**Cobertura empírica via PAT**: 1 row / 133 reports assináveis = **0,75%**. Última execução 27/04. Framework existe mas **não virou processo**.

**Cadência mínima proposta**:
1. 1 QA run por nova V1.9.X que toca código clínico (AEC FSM / Pipeline / Verbatim / signature / RAG)
2. 1 QA run quinzenal num report aleatório (rotação Claude/Pedro/Ricardo)
3. 1 QA run **OBRIGATÓRIA pré-Marco 2** em report do 1º paciente externo

**Custo**: ~1h30min por run × 2/mês = 3h/mês overhead. Pré-PMF aceitável.

**Trigger pra cristalizar como `feedback`**: 2ª run rodar empíricamente (anti-cristalização-prematura).

### U.4 — Memory `feedback_claude_audit_diferenciar_validacao_de_descoberta_26_05` cristalizada

NÍVEL 1 entry-point. Detalhe em BLOCO T.

### U.5 — MEMORY.md atualizado

Título atualizado pra refletir noite² + audit Lovable × PAT + drift documental fix.

---

## 🏛️ BLOCO V — MARCO EMPÍRICO: Validação ITI externa Pedro Paciente APROVADA (~22h-23h BRT)

### V.1 — Pedro testou empíricamente fluxo V1.9.455 PARTE B

Mandou 2 screenshots + 1 PDF + output portal ITI.

**Screenshot 1 — "Minhas Prescrições" Pedro Paciente** (`medcannlab.com.br/app/clinica/paciente/dashboard?section=minhas-prescricoes`):
- Exame `e4c97a53` 16/05/2026 16:47 expandido
- Badge "ICP" verde ✅
- Selo *"Documento assinado digitalmente com ICP-Brasil. Validade jurídica plena (CFM 2.314/2022 + Lei 14.063/2020). PDF PBAD AD-RB conforme ITI."*
- 4 botões V1.9.455 PARTE B: **Baixar PDF ICP** + **Validar no ITI** + **WhatsApp + PDF** + **Imprimir**
- Tooltip mostrou `https://validar.iti.gov.br` (URL REAL, não fake) ✅

Pedro: *"ja 1 imagem confirmando o trigger iti direcinou para la para eu validar"*.

### V.2 — Upload no portal ITI oficial = APROVADO ✓

Pedro fez download via "Baixar PDF ICP" → upload em `validar.iti.gov.br`:

```
✅ ASSINATURA APROVADA

Nome arquivo: e4c97a53-e98d-40b1-b194-cd116ed64ff9.pdf
Hash: 1294eeed578a1802a4a7a82a771bc1607f3e1404fb7c788e18d8567f842c7515
Data validação: 26/05/2026 16:59:16 BRT

Assinado por: RICARDO VALENCA SERVICOS DE SAUDE LTDA
CNPJ: 46.329.856/0001-06
CPF representante: ***.194.248-**
Nº série cert. emitente: 0x568d6f51e2dc47a80d2816e06b56a81b6c4d371a
Data assinatura: 26/05/2026 13:10:50 BRT
```

### V.3 — Cruzamento empírico via PAT (anti-overclaim)

| Campo portal ITI | Bate com banco? |
|---|---|
| ID arquivo `e4c97a53` | ✅ `patient_exam_requests.id` |
| Assinante RICARDO VALENCA SERVICOS DE SAUDE LTDA | ✅ `medical_certificates.ac_provider: DigitalSign` cert ativo |
| CNPJ 46.329.856/0001-06 | ✅ Ricardo PJ regularizado |
| Data 26/05 13:10:50 BRT | ✅ backfill V1.9.455 PARTE A 26/05 tarde |

### V.4 — Marco arquitetural (1ª validação por terceiro neutro)

**4 marcos em 11 dias** (15/05 → 26/05):
- V1.9.299 (motor) → algoritmo PBAD AD-RB aprovado V12 16/05 (cert Carolina, smoke interno)
- V1.9.455 (distribuição) → wiring frontend 26/05 tarde + backfill 11/12 docs legacy
- V1.9.457 (proteção) → vetor abuso ANON_KEY fechado 26/05 noite
- **26/05 noite² → validação EXTERNA POR TERCEIRO NEUTRO oficial gov.br** ✅

**Discrepância timing detectada**: diário 26/05 Bloco L.4 documentou backfill *"~15h17-16h45 BRT"* MAS assinatura ITI mostra 13:10:50. 2h de diferença. Princípio cristalizado em memory marco: **timestamps de operações empíricas devem vir de fonte autoritativa (banco/log Edge), não memória do operador**.

Memory cristalizada: `project_marco_empirico_validacao_iti_externa_pedro_paciente_26_05` (NÍVEL 1 entry-point).

---

## 🔍 BLOCO W — V1.9.456 QR Code re-confirmado necessário (Pedro reconheceu empíricamente)

### W.1 — Pedro fechou loop empíricamente

> *"ok acho que sim qr code ainda necessario no pdf amigo..."*

**CONFIRMA empíricamente** princípio cristalizado 25/05 em `feedback_paciente_externo_real_estressa_arquitetura_25_05`: *"validação jurídica ≠ validação operacional"*.

Hoje validou os 2 lados:
- ✅ Jurídica ICP-Brasil: portal ITI APROVOU (16:59:16 BRT)
- ❌ Operacional QR Code visual: AINDA falta no binário (gap V1.9.456)

### W.2 — V1.9.456 parqueado aguarda 3 decisões humanas (não código)

Memory `project_v1_9_455_qr_code_embedded_pdf_design_25_05` tem 3 opções A/B/C parqueadas:

| Opção | Risco lock V1.9.299 | Tempo |
|---|---|---|
| **A** Mexer dentro de `sign-pdf-icp` | 🔴 ALTO (quebra lock PBAD) | 4-8h + auditoria pesada |
| **B** 2 PDFs separados | 🟢 ZERO | 2-3h, UX pior |
| **C** Desenhar QR ANTES de assinar (upstream) | 🟡 MÉDIO | 3-5h + smoke obrigatório (RECOMENDADO) |

**3 perguntas pra Pedro+Ricardo conversarem antes de codar**:
1. QR aponta pra `validar.iti.gov.br` (oficial) OU portal próprio MedCannLab?
2. Texto humano ao lado ("Para validar: escaneie ou acesse...")?
3. Posição no PDF (rodapé / topo / canto)?

**NÃO codar até decisão humana** — princípio anti-especulação `feedback_count_pacientes_v1_9_449_e_gaps_function_calling_v1_9_450_25_05`.

---

## 📋 BLOCO X — Pipeline patient_documents (gap empírico parqueado)

### X.1 — Pedro perguntou empíricamente sobre fluxo upload → prof

Screenshot 2 — "Meus Exames" do paciente Pedro Paciente: tela vazia *"Nenhum exame ainda"* + botão "Adicionar primeiro exame".

Pedro: *"ja nessa outra aba ali ele sobe exames correto?! caso suba exames de sangue ou qlqr outro tipo de exame da para puxar os dados e expelhar oq e interessante preciso rrisco estc ja no terminal de atendimeneto no visao geral do prontuario do pro ficniional e os mais tops no dashboard do pro?"*

Tradução: paciente sobe exame externo → sistema OCR/parse → reflete em Visão Geral Prontuário Prof + Dashboard Prof?

### X.2 — Audit empírico via PAT + Grep

**🟢 Existe (schema PRONTO)**:
- Tabela `patient_documents` (17 cols rico: file_path + mime_type + category + metadata jsonb + clinical_note + shared_with_professional + uploaded_by_role)
- Tabela `patient_lab_results` (USER-DEFINED enum test_type + value + reference_range_min/max + is_abnormal boolean)
- Edge `extract-document-text` v59 deployada
- Frontend isolado: `PatientMyExams.tsx` + `ProfessionalPatientFiles.tsx`
- Bucket Storage `patient_documents` (20MB limit)
- Pattern replicável: sidecar renal V1.9.307

**🔴 NÃO existe (gap empírico)**:
- `patient_documents`: 0 rows
- `patient_lab_results`: 0 rows
- 0 triggers em `patient_documents`
- Edge `extract-document-text` NÃO está wired ao upload
- Frontend `PatientMyExams.tsx` + `ProfessionalPatientFiles.tsx` ISOLADOS
- Sem integração com `RiskCockpit.tsx` nem dashboard prof

### X.3 — PARQUEADO pré-PMF (regra de ouro Memo 28/04)

3 razões honestas:
1. 0 rows = construir pra fluxo zero = especulação
2. Trigger empírico não materializou (Ricardo/Faveret/Eduardo não pediram)
3. Sidecar TEA tem prioridade (Eduardo engajou 26/05 sobre Joaninha autista)

**3 triggers explícitos pra desparquear**:
- Ricardo subir exame Maria das Dores Pitoco + pedir empíricamente
- 1º paciente externo Marco 2 subir laudo
- Eduardo trazer paciente neuro real com 5+ exames passados

**Risco crítico ativação**: OCR errado popular `patient_lab_results` com valor errado → `RiskCockpit` falso alarme = anti-padrão Babylon Health 2020. **Mitigação obrigatória**: validação humana pré-INSERT (card mostrar "Sugestão IA — confirmar?" não escrever direto).

Memory cristalizada: `project_pipeline_patient_documents_ocr_lab_results_parqueado_26_05` (NÍVEL 1 entry-point).

---

## 🎯 BLOCO Y — Frase âncora versão final final final (pós sessão noite²)

> *"O dia começou com sincronização cross-machine (10 commits desktop puxados via fast-forward laptop), absorveu retrospectiva V3 2.338 linhas, cristalizou Marco 3 destravando via reunião 4 sócios + Eduardo engajando + Ricardo semântica relacional do sujeito da frase, codou V1.9.456 longitudinal 30min, V1.9.455 wiring exam PDF ICP em 1h30, V1.9.457 proteção ANON_KEY em 1h, audit 360° com 4 ações fáceis em 30min (sistema 12%→76% PDF binário). À noite² Pedro disparou audit Lovable × PAT (17 itens cross-check) + apresentação Olive/Babylon comparativa + 'estamos à frente?' calibrado em 3 ressalvas honestas — então perguntou 'memoria + retrospectiva nao confirma maioria dos achados?' detectando empíricamente que ~70-80% dos meus 'achados' já estavam em memória/retrospectiva V3/CLAUDE.md/diários. Princípio meta cristalizado: 'IA não descobre — valida, atualiza, sinaliza desvio'. Estrutura obrigatória 3 buckets 🟢🟡🔴 pré-relatório. 5 fixes doc-only executados (drift assessment_excerpt → assessment + 2 cron jobs catalogados + cadência clinical_qa_runs + memory princípio audit + MEMORY.md atualizado). Pedro testou empíricamente V1.9.455 PARTE B + V1.9.299 PBAD via portal `validar.iti.gov.br` oficial gov.br → APROVADO ✓ (hash 1294eeed..., RICARDO VALENCA SERVICOS DE SAUDE LTDA CNPJ 46.329.856, ass. 26/05 13:10:50 BRT). **1ª VALIDAÇÃO POR TERCEIRO NEUTRO** do MedCannLab — 4º marco em 11 dias (motor + distribuição + proteção + validação externa). Pedro reconheceu empíricamente 'qr code ainda necessario no pdf' confirmando princípio 25/05 'validação jurídica ≠ operacional' — V1.9.456 parqueado aguardando 3 decisões humanas A/B/C + URL + posição. Pipeline `patient_documents` → OCR → `patient_lab_results` → KPI prof MAPEADO empíricamente: schema PRONTO mas pipeline 0% wired (0 rows + 0 triggers), parqueado com 3 triggers explícitos. Sessão noite² fechou com 3 memórias NÍVEL 1 novas: marco ITI + pipeline parqueado + princípio audit diferenciar validação/descoberta. CLAUDE.md atualizado com cron jobs + cadência clinical_qa_runs + drift formula correta. Pedro: 'documentar tudo diario e memoria oq preicsar vou jogar um lol por hora' — execução autônoma."*

— Sessão 26/05 noite² encerrada (~23h+ BRT, versão FINAL definitiva). **Estado git pré-commit**: 3 arquivos modificados (CLAUDE.md + RETROSPECTIVA + memory snapshot) + 3 memórias pessoais novas (NÍVEL 1) + MEMORY.md atualizado. Push 4 refs pendente. **Validação por terceiro neutro CONFIRMADA**.

### O QUE ESPERAR pós sessão noite²

| Sintoma | Causa | Ação |
|---|---|---|
| Pedro volta do LoL e quer ler diário | ✅ Blocos R-Y documentados honestamente | Ler de R em diante |
| Marco 2 paciente externo subir exame em "Meus Exames" | 🔴 PIPELINE NÃO ATIVO — fica em `patient_documents` sem OCR | Trigger desparquear sidecar laboratorial |
| Laboratório do João Guimarães recusa PDF de novo (sem QR) | Esperado — V1.9.456 parqueado | Pedro+Ricardo decidirem 3 perguntas A/B/C |
| 01/06 03h BRT cron `monthly-closing-medcannlab` rodar | 1ª execução prevista | Verificar 02/06 se gamification populou indevidamente |
| Próxima sessão Claude rodar audit empírico | Memory `feedback_claude_audit_diferenciar...` ditará estrutura 3 buckets | Esperado |

**Próxima sessão Claude entra com contexto INTEGRAL pós-noite²**:
- MEMORY.md atualizado (3 novas entradas NÍVEL 1: marco ITI + pipeline parqueado + princípio audit)
- 12 memórias 26/05 cristalizadas (5 laptop + 4 desktop tarde + 3 noite²)
- Este diário (Blocos A→Y)
- Retrospectiva V3 (drift documental corrigido)
- 3 tags git intactas
- CLAUDE.md atualizado (cron jobs + cadência clinical_qa_runs + drift formula)

---

## 🤖 BLOCO Z — Audit Lovable IA paralela mexeu em types.ts (pós-commit 4a47886, ~22h30 BRT)

### Z.1 — Achado empírico pós-push

Após commit `4a47886` + push 4 refs, push REJEITADO: remote tinha 2 commits novos não-locais (`367d5c8` + `39528a9`). Investigação empírica via `git fetch` + `git show --stat`:

- `367d5c8` "Changes" (Lovable bot, 17:33 UTC = 14:33 BRT)
- `39528a9` "Auditou Supabase 360° completo" (Lovable merge commit, 17:38 UTC, `X-Lovable-Edit-ID: edt-d5d43657-...`)

**Diff empírico**: APENAS `src/integrations/supabase/types.ts` (+1498/-138). Regeneração automática dos tipos TypeScript espelhando schema atual do Supabase. ZERO Edge functions, ZERO migrations, ZERO locks core (sign-pdf-icp / tradevision-core / clinicalAssessmentFlow / cos_engine / cert-encrypt / digital-signature) tocados.

### Z.2 — Resolução: rebase clean

`git pull amigo main --rebase` → rebase sem conflito (arquivos disjuntos). Commit local renomeado `3a32706` → `4a47886`. Push 4 refs OK após rebase.

### Z.3 — Reação Pedro

> *"falei para ele nao mexer em nada ele mexeu? kkk enfim aqui e a fonte da verdade nao ele.."*

Princípio implícito que Pedro afirmou:

> *"Em projeto com múltiplas IAs colaborando (Claude executor + Lovable + GPT externos), fonte de verdade é hierárquica: banco + migrations + Edges + locks + diários/memórias (autoritativos) → types.ts codegen + dashboards (derivados). Toda divergência entre IAs resolve consultando a fonte autoritativa via PAT, nunca o derivado."*

**Atualização ~01h BRT 27/05 (princípio diário-mostra-erros aplicado)**: eu marquei aqui *"não cristalizar em memory — esperar 2ª evidência"*. Pedro deu 2ª evidência **em ~5min** afirmando empíricamente: *"normal nao e a 1 vez que rola auditoria lovable e nao fica top 100%! e temos que checar rsrs"*. Cristalização justificada AGORA, não depois — memory `feedback_lovable_audit_nao_fica_100pct_sempre_checar_via_pat_26_05` criada como NÍVEL 1 entry-point. **Lição honesta**: anti-cristalização-prematura é princípio válido contra inflação narrativa MAS quando operador humano com 6+ meses contexto afirma *"não é a 1ª vez"*, 2ª evidência é a própria afirmação dele — não esperar replicação técnica que pode levar semanas.

### Z.4 — Validação empírica que sustenta o princípio

| Camada | Lovable tocou? |
|---|---|
| Supabase banco (schema/dados) | NÃO ✅ |
| Migrations versionadas | NÃO ✅ |
| Edge Functions | NÃO ✅ |
| Locks selados (V1.9.299 + V1.9.455 + V1.9.457 + AEC FSM + Verbatim) | NÃO ✅ |
| CLAUDE.md + diários + memórias | NÃO ✅ |
| **`src/integrations/supabase/types.ts` (derivado codegen)** | **SIM** — só este |

**Conclusão honesta**: Lovable só "limpou os pratos" — não trocou as receitas. Princípio "fonte da verdade aqui" empíricamente verdade hoje. **Vigiar quando Lovable tentar criar migration/Edge** — aí precisaria defesa institucional explícita (CI block, branch protection).

---

## 🎨 BLOCO AA — V1.9.458 ChatModeSelector CTAs translúcidos high-tech (~23h30 BRT)

### AA.1 — Trigger Pedro

Screenshot modal "Como você quer interagir com a Nôa?" (componente `ChatModeSelector.tsx` V1.9.442 do 24/05). Feedback Pedro:

> *"acho que aqui os triggers podem ser mais opacos nao tao brilhantes sabe mais sofisticado! esse card mal consigo ler a 2 opcao"*

### AA.2 — Diagnóstico empírico

| Elemento | Estado anterior | Problema |
|---|---|---|
| Botão AEC (esq) | `linear-gradient(#00C853 → #00A845)` + boxShadow rgba(0,200,83,**0.3**) | Verde-regenerativo saturado FULL + texto branco = consumer flash |
| Botão Chat Livre (dir) | `linear-gradient(#4FE0C1 → #00E5B2)` + boxShadow rgba(79,224,193,**0.3**) | Ciano saturado FULL + texto branco = baixo contraste ("mal consigo ler") |

### AA.3 — Princípios violados

- Brandbook V3 22/05 (paleta cool **calibrada**, não saturada FULL)
- `feedback_recusa_correta_vale_mais_que_resposta_22_05`: *"em healthtech, não-resposta é integridade visível — visual deve refletir sofisticação, não consumer flash"*

### AA.4 — Fix cirúrgico aplicado (V1.9.458, commit `166fb4b`)

Pattern translúcido high-tech (fundo translúcido + border + texto colorido):

```diff
- background: 'linear-gradient(135deg, #00C853 0%, #00A845 100%)',
- boxShadow: '0 4px 14px rgba(0, 200, 83, 0.3)',
- className: text-white
+ background: 'rgba(0, 200, 83, 0.10)',
+ border: '1px solid rgba(0, 200, 83, 0.45)',
+ color: '#00E5B2',  // verde-vital — alto contraste sobre fundo translúcido escuro
+ boxShadow: 'inset 0 0 16px rgba(0, 200, 83, 0.06)',
+ className: group-hover:bg-[rgba(0,200,83,0.18)] (hover progressivo)
```

Mesma transformação no botão Chat Livre (ciano #4FE0C1 família).

### AA.5 — Reação Pedro pós-edit (princípio diário-mostra-erros)

Eu propus diff inline e PERGUNTEI "codifico ou ajusta?" em vez de executar direto. Pedro:

> *"faltou commit apenas meu pc desligou ver se ta tudoi ok"*

PC do Pedro desligou ANTES do commit (edit persistiu no disco mas não virou commit). Recalibração: "ok/pode/perfeito" = seguir com a recomendação (princípio `feedback_pedro_nao_usar_card_de_escolha`). Aplicado tardiamente — commit `166fb4b` + push 4 refs após retomada.

**Anti-padrão a evitar futuro**: quando Pedro mostra screenshot + feedback empírico + propõe melhoria implícita, executar com diff inline visível **+ commitar direto**. Pedido de autorização inline é excesso de fricção. Princípio cristalizado.

---

## 🎨 BLOCO AB — V1.9.459 + V1.9.460 Agendamentos UX (~00h-01h BRT 27/05)

### AB.1 — V1.9.459 Triggers azuis Tier 2 → unificados verde-vital translúcido (commit `ae7df08`)

**Feedback Pedro** (screenshot `/paciente/agendamentos`):

> *"os triggers azuis podem ficar iguais aqui tbm verde? sabe veja como esta da pra dar um tapa mais high tech?"*

**Estado empírico anterior**:
- Tier 1 Eduardo: `bg-emerald-600/90 hover:bg-emerald-500` (verde-esmeralda saturado)
- Tier 1 Ricardo: `bg-primary-600/90 hover:bg-primary-500` (verde-primary saturado)
- Tier 2 Parceiros: `bg-cyan-600/90 hover:bg-cyan-500` (ciano saturado — "azul" pra Pedro)

**Histórico** (linha 122-124): V1.9.111-A já unificou Tier 2 em 1 cor única (antes era "discoteca" 5 cores). V1.9.459 deu **próximo passo**: unifica Tier 1+2 em verde-vital translúcido sofisticado.

**Fix cirúrgico** (5 edits):
1. Eduardo buttonClasses → translúcido `rgba(0,229,178,0.10)` + border + texto `#00E5B2`
2. Ricardo buttonClasses → mesmo
3. PARTNER_ACCENT buttonClasses → mesmo (Pedro pediu "iguais verde")
4. Remove `text-white` hardcoded no JSX linha 1373 (card)
5. Remove `text-white` hardcoded no JSX linha 2135 (profile modal)

**Diferenciação Tier 1 vs Tier 2 PRESERVADA** via outros sinais semânticos (cor do CTA não era único sinal):
- Estrela ⭐ amber-400 fill + badge "OFICIAL" / "SEU MÉDICO" (Tier 1)
- Header "Equipe Oficial MedCannLab" amber-400 vs "Profissionais Parceiros" cyan-400
- Posicionamento (Tier 1 sempre no topo)
- Badge "🆕 NOVO" (Tier 2 sem rating real)

**Princípio aplicado**: polir-não-inventar (pattern V1.9.458 ChatModeSelector reutilizado).

### AB.2 — V1.9.460 Conteúdo da aba ~20% mais compacto (commit `8bcffa7`)

**Feedback Pedro**:

> *"acho que o conteudo dessa aba pode diminuir total tbm uns 20% para caber mais na tela"*

**7 ajustes cirúrgicos de spacing/sizing** (zero estrutura HTML tocada):

| Elemento | Antes | Depois | Ganho vertical |
|---|---|---|---|
| Container card | `p-4 md:p-6` | `p-3 md:p-4` | ~16px |
| Header título | `text-lg md:text-xl` + ícone w-5/6 | `text-base md:text-lg` + w-4/5 | ~8px |
| Header descrição | `text-sm mt-1` | `text-xs mt-0.5` | ~4px |
| Busca/filtros | `gap-3 mb-4` | `gap-2 mb-3` | ~8px |
| Tier 1 → Tier 2 | `mb-6` | `mb-4` | ~8px |
| Headers Tier | `text-xs mb-3` + Star w-3.5 | `text-[11px] mb-2` + w-3 | ~4px |
| Grid gap cards | `gap-3` | `gap-2` | ~4px |
| Card padding | `p-3 gap-2.5` | `p-2.5 gap-2` | ~4-6px |
| Avatar card | `w-9 h-9` + Stethoscope w-3.5 | `w-8 h-8` + w-3 | ~4px |
| Excerpt margin | `mt-1.5` | `mt-1` | ~2px |

**Estimativa total**: ~60-80px vertical compactado = ~15-20% real (depende viewport).

**NÃO TOCADO** (preservação):
- Botões CTA (V1.9.458 + V1.9.459 acabados de polish)
- Badges Oficial / 🆕 NOVO / SEU MÉDICO
- DotPagination
- Lógica/data binding
- Calendar + Próximas Consultas (cards embaixo)

### AB.3 — Princípios aplicados nos 3 commits UX noite²

| Princípio | Aplicação |
|---|---|
| `project_marca_medcannlab_brandbook_v3_22_05` | Paleta cool preservada (verde-vital + ciano-cognitivo + verde-regenerativo) — só intensidade ajustada |
| `feedback_recusa_correta_vale_mais_que_resposta_22_05` | Sofisticação médica > consumer flash |
| `feedback_polir_nao_inventar` | V1.9.458 pattern reutilizado em V1.9.459. V1.9.460 ajustou spacing dentro de classes Tailwind existentes |
| `feedback_pedro_nao_usar_card_de_escolha` | Após PC desligar antes do commit, princípio reaplicado: feedback Pedro = executar direto, não perguntar inline |

---

## 🎯 BLOCO AC — Frase âncora versão FINAL FINAL FINAL FINAL (pós V1.9.460)

> *"Sessão noite² 26/05 começou com audit Lovable × PAT 17 itens (cross-check empírico revelou ~70-80% confirmavam memória / 5 genuinamente novos) → cristalizou princípio meta 'IA executora em projeto com memória persistente densa não descobre — valida, atualiza, sinaliza desvio' (memory `feedback_claude_audit_diferenciar_validacao_de_descoberta_26_05`). Pedro testou portal `validar.iti.gov.br` oficial gov.br → APROVADO ✓ assinatura PBAD do PDF Pedro Paciente (1ª validação por terceiro neutro do MedCannLab, memory `project_marco_empirico_validacao_iti_externa_pedro_paciente_26_05`). 5 fixes doc-only executados + pipeline `patient_documents`→OCR→`lab_results` mapeado e parqueado com 3 triggers explícitos (memory `project_pipeline_patient_documents_ocr_lab_results_parqueado_26_05`). Push commit `4a47886` rejeitado: Lovable IA paralela tinha mexido em `src/integrations/supabase/types.ts` (codegen do schema, ZERO Edges/migrations/locks). Rebase clean, princípio implícito Pedro 'aqui é a fonte da verdade, não ele' validado empíricamente (Lovable só toca artefato derivado). Pedro voltou pós-LoL pedindo 3 polishes UX: (1) V1.9.458 ChatModeSelector CTAs translúcidos high-tech 'mais sofisticado'; (2) V1.9.459 Agendamentos triggers Tier 1+2 unificados verde-vital translúcido (V1.9.111-A unificou Tier 2 → V1.9.459 unifica Tier 1+2 mantendo hierarquia semântica via estrela/header/posição); (3) V1.9.460 conteúdo aba Agendamentos ~15-20% mais compacto via 7 ajustes spacing/sizing cirúrgicos. Lock V1.9.299 PBAD INTOCADO. Zero código clínico tocado. 4 commits do dia (V1.9.455+457 ICP + docs noite² + V1.9.458+459+460 UX) + 1 rebase Lovable absorvido. Estado git: HEAD `8bcffa7` em main+master ambos remotes. Constituição MedCannLab inteira preservada: arquitetura técnica + epistemologia codificada + disciplina cultural + agora vacina visual (sofisticação médica vs consumer flash) cristalizada em pattern translúcido reutilizável."*

— Sessão 26/05 noite² encerrada (versão FINAL FINAL FINAL FINAL, ~01h+ BRT 27/05). **Push 4 refs OK em todas as branches**. Vercel CI vai auto-deployar UX polish em ~2-3min. Working tree clean (`deno.lock` untracked persistente — herança refator parqueado 22/05).

### O QUE ESPERAR pós V1.9.458+459+460 (próximas 24-72h)

| Onde | O que muda visual |
|---|---|
| Modal "Como você quer interagir com a Nôa?" | CTAs translúcidos verde/ciano com border + texto colorido legível |
| `/paciente/agendamentos` Tier 1 (Eduardo + Ricardo) | Botões "Vincular / Agendar consulta" verde-vital translúcido sofisticado |
| `/paciente/agendamentos` Tier 2 (9 Parceiros) | Mesma cor verde-vital translúcido (não mais ciano) — uniformidade |
| `/paciente/agendamentos` layout geral | ~60-80px vertical economizado (mais cards/calendar visíveis sem scroll) |
| Tier 1 vs Tier 2 ainda distinguíveis? | ✅ via estrela ⭐ amber + header amber/cyan + badge "OFICIAL"/"NOVO" + posição |

**Próxima sessão Claude entra com**:
- 12 memórias 26/05 (5 laptop + 4 desktop tarde + 3 noite²) + ainda 3 NÍVEL 1 entry-points
- Este diário (Blocos A→AC, ~26 blocos total — sessão mais longa documentada do mês)
- 7 commits push 4 refs em 26/05 (V1.9.455+456+457 ICP-Brasil + docs noite² + V1.9.458+459+460 UX polish)
- Princípio meta cristalizado VALIDAÇÃO vs DESCOBERTA será aplicado por padrão
