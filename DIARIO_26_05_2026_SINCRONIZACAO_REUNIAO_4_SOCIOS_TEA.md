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

## 🎯 BLOCO J — Frase âncora do dia

> *"O dia começou com sincronização (10 commits desktop puxados + retrospectiva V3 2338 linhas absorvida) e terminou com Marco 3 destravando empíricamente — Eduardo voltou tecnicamente engajado com pergunta concreta sobre Joaninha autista. V1.9.456 implementado em ~30min cobrindo 50% da necessidade neuro sem código de sidecar. Ricardo cristalizou semântica relacional sujeito da frase ('meu filho morde tudo' ≠ cuidador agressivo) — padrão repicável pra todo sidecar futuro de sintomas REFERIDOS. Pedro segurou risco capacidade pré-beta. AEC FSM intocada em TODAS as decisões. Modo operacional > modo institucional. 4 commits cirúrgicos + 5 memórias nível 1 cristalizadas + diário consolidado + sync cross-machine resolvido."*

— Sessão 26/05 encerrada (Pedro indo pra casa). Próxima sessão entra com contexto integral via MEMORY.md atualizado + esta documentação + retrospectiva V3 + 18 memórias 23-26/05 cristalizadas.
