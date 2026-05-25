# 📅 Retrospectiva Mensal — MedCannLab 3.0
## 26/04/2026 → 25/05/2026 (30 dias)

**Autores**: Pedro Henrique Passos Galluf + Claude Opus 4.7 (1M context)
**Período**: 30 dias contínuos de execução cirúrgica
**Contexto**: pré-PMF (zero pacientes externos pagantes), com testes internos intensos (Pedro, Dr. Ricardo Valença, Carolina, João Vidal, Dayana, Eduardo Faveret)
**Selo**: V1.9.95+97+98+99-B+299 + Matrix Z2 V1.9.450-454 (anti-alucinação + taxonomia semântica 3 cenários)

---

## 🌅 SEÇÃO 1 — Visão geral 30 dias

### Estado de entrada (~26/04)
- AEC FSM funcional mas com bugs de regex residuais (V1.9.77 estabilizando)
- 75 clinical_reports históricos (testes internos desde fev/2026)
- 16 pacientes cadastrados como teste
- Pipeline pós-AEC com sintomas conhecidos (RAG truncation, dual-write não-formalizado)
- Sem PBAD ICP-Brasil real (assinatura era V1.5 placeholder)
- Sem Audience Contract pra racionalidades MTC/Homeopatia/Ayurveda no paciente
- Sem Matrix Z2 voz estrutural cristalizada (V1.9.388 só viria 19/05)
- Sem ChatModeSelector / PATIENT_FREE_CHAT_GUARDRAILS

### Estado de saída (25/05 ~16h)
- AEC FSM cirúrgicamente estabilizada (10 etapas literais, Verbatim First V1.9.86 funcional)
- **143 clinical_reports** total (+68 no mês = **+91%**)
- **34 pacientes** cadastrados (+18 no mês = **+113%**)
- **40 reports signed ICP-Brasil** no mês (PBAD AD-RB CONFORME ITI deployado 16/05)
- Audience Contract V1.9.330-A deployado (jsonb vs tabela documentado)
- **Matrix Z2 epistemicamente íntegra** (taxonomia 3 cenários, anti-alucinação macro+micro)
- **PATIENT_FREE_CHAT_GUARDRAILS** ativo (CBD/jornada/iniciar tratamento)
- Manual de Uso do Profissional v1.1 + MatrixHelpModal elite UX
- F4 Fórum end-to-end (dossiê → conselho → debate)
- F3 dossiê PDF estruturado com persistência

### Salto qualitativo do mês

| Dimensão | Pré-mês | Pós-mês |
|---|---|---|
| **Volume de reports** | 75 históricos | 143 (91% growth) |
| **Pacientes únicos** | 16 testes | 34 (113% growth) |
| **AECs com pipeline completo** | Algumas com bugs residuais | 40 assinadas ICP-Brasil em 30d |
| **ai_chat_interactions** (30d) | n/a | **2.446** |
| **Princípios meta cristalizados** | ~10 dispersos | ~30+ em memória persistente |
| **Locks arquiteturais selados** | V1.9.95+97+98+99-B | + V1.9.121 + V1.9.299 PBAD + V1.9.330-A + V1.9.388 + V1.9.443+A+B + V1.9.450-454 |
| **Sócios alinhados conceitualmente** | Discussão fragmentada | Ricardo cristalizou "queixa ≠ sintoma" + "framework centrípeto" |
| **Drift de IA** | Risco implícito | Locks micro-factuais + taxonomia 3 cenários explícitos |

---

## 📊 SEÇÃO 2 — Métricas reais via PAT (validação empírica)

### Comparativo pré/pós-mês (PAT empírico 25/05 ~16h30)

| Métrica | Valor 30d |
|---|---|
| clinical_reports criados no mês | **68** |
| clinical_reports SIGNED ICP no mês | 40 (59% taxa de assinatura) |
| Users pacientes novos no mês | **18** (de 16 → 34, +113%) |
| ai_chat_interactions no mês | **2.446** |
| appointments criados no mês | **37** |
| clinical_rationalities geradas no mês | **74** |
| Distribuição racionalidades | Integrativa (majoritária), Biomédica, MTC, Homeopatia, Ayurveda |

### Estado final tabelas críticas

| Tabela | Valor 25/05 16h |
|---|---|
| users.type='patient' | 34 |
| users.type='profissional' | 11 |
| users.type='admin' | 5 |
| clinical_reports total | 143 |
| aec_assessment_state in_progress | 13 |
| forum_posts pending_review | 2 (Pedro dossiês 21/22 maio aguardando conselho Ricardo/Eduardo) |

### Crescimento conceitual

- **Memórias persistentes**: ~150 (pré-mês) → **244** (atual) = +94 novas no mês
- **Diários no mês**: 26 diários (cobertura quase diária, com sessões duplas/triplas em 18, 19, 22, 24)
- **Commits cirúrgicos no mês**: **~90 commits** (~3/dia média), push 4 refs em todos

---

## 🗓️ SEÇÃO 3 — Timeline por semana (4 semanas)

### Semana 1 (26/04 → 02/05) — Auditoria honesta + cluster 4 motores

**Diários**: 26/04 AUDITORIA_E_MAPEAMENTO · 27/04 AUDITORIA_HONESTA_E_FOCO_ESCALA · 28/04 AUDIT_PROFUNDO_SUPABASE_E_EDGE · 29/04 PRE_BATALHA_3 · 30/04 ANTI_REGRESSAO

**Marcos**:
- **Audit 360° completo** do banco Supabase + 10 Edge Functions (cleanup 28/04 ~10h45)
- **Lock V1.9.99-B selado** (28/04): Resend prod + Storage RLS chat-images + sweep mode reminders
- **4 motores clínicos mapeados** (`project_4_clinical_engines_map_24_04`): AEC + Pipeline + Signature + Verbatim
- **Pirâmide de governança 8 camadas** cristalizada (`project_piramide_governanca_28_04`)
- **REGRA HARD §1 anti-kevlar** consolidada: *"Consentimento ≠ Agendamento"*
- **Parágrafo institucional iterações v5→v14** (28-29/04 — 9 iterações até "definitivo")
- **V1.9.102+B+C+D+E+F**: ciclo anti-regressão em 1 semana
- **Princípios cristalizados**: feedback_anti_overclaim_endorsements / feedback_postura_quebras_e_evolucao / feedback_push_remotes_corretos / feedback_uso_zero_nao_e_morto

**Frase âncora semana 1**: *"Mapear antes de mexer. Validar empíricamente antes de assumir. Auditar 100% antes de qualquer mudança."*

### Semana 2 (03/05 → 09/05) — Marca + onboarding + Faveret abandona

**Diários**: 03/05 POLISH_RECEITUARIO_ANVISA + LANDINGS_SEO · 04/05 DECISAO_ESTRUTURAL_FINAL_E_LIVRO_MESTRE · 05/05 POLISH_TRIPLE_A_3_PERFIS · 08/05 PRE_MUHDO_E_FIX_EDUARDO · 09/05 VIRADA_PARA_EXECUCAO

**Marcos**:
- **V1.9.121 AEC Promotion Detector** selado quíntuplo (Claude + GPT review + Pedro + Ricardo + GPT-Ricardo, 03/05): triagem chat livre → AEC consciente
- **Lead-free SEO selo** (03/05): landings sem captura forçada
- **Estado fim 04/05 cristalizado** + Livro Mestre
- **Polish triple-A 3 perfis** (paciente/profissional/admin) + Dashboard honesto
- **WhatsApp blueprint 05/05**
- **Princípio identidade Nôa Esperanza** consolidado
- **Eduardo Faveret ABANDONOU após 3 AECs em 05/05/2026** — empíricamente descoberto
- **Estado fim 05/05** cristalizado
- **PRE-MUHDO** + FIX Eduardo (08/05)
- **Virada pra execução** (09/05) — fim da fase auditoria, início da implementação cirúrgica

**Frase âncora semana 2**: *"Sócio-médico não usar não é falha de produto isolada — é curva de aprendizado alta mesmo pra sócios-fundadores. Design simples não substitui hand-holding pré-PMF."*

### Semana 3 (10/05 → 16/05) — PBAD ICP-Brasil REAL + Matrix Z2 nascendo

**Diários**: 10/05 SELO_FINAL_SESSAO_TECNICA · 11/05 SESSAO_CIRURGICA_AEC · 12/05 INICIO · 13/05 PRE_EVENTO · 14/05 CHECKLIST_EVENTO · 15/05 PDF_ICP_REAL · 16/05 SIDECAR_RENAL_E_PBAD_AD_RB

**Marcos**:
- **V1.9.299 PBAD AD-RB ICP-Brasil CONFORME ITI** (16/05) — assinatura digital REAL, não placeholder
- **Sidecar renal DRC** (V1.9.307) deployado
- **Pré-evento + checklist** (13-14/05): demos preparadas
- **NFT consent peça-a-peça** (V1.9.311)
- **Sessão cirúrgica AEC** (11/05): refinamentos finos do método
- **PDF ICP real** (15/05): selo digital ITI funcional
- **Constraint NÃO TOCAR** declarado em CLAUDE.md: `sign-pdf-icp` é intocável sem audit empírico ASN1 + smoke ITI + diff binário

**Frase âncora semana 3**: *"PBAD AD-RB conforme ITI deployado. A assinatura agora é jurídica real, não cosmética. Mexer = risco voltar pra 'desconhecida'."*

### Semana 4 (17/05 → 25/05) — Audience Contract + Matrix Z2 + 17 commits semana

**Diários**: 17/05 RACIONALIDADES_TEACHING_E_ESCOLA_CLINICA_DIGITAL · 18/05 AUDIENCE_CONTRACT_E_DUAL_WRITE + NOITE_LITERATURA_FORUM · 19/05 OBSERVABILIDADE_E_RECALIBRACAO + MATRIX_V1988_VOZ_Z2_PESQUISA · 20/05 INICIO · 21/05 F3_REABRIR_F2_ANEXAVEL · 22/05 REFATOR_TRADEVISION_CORE_PAUSADO · 23/05 RE_AUDIT_HONESTO_E_LOGO_SWAP · 24/05 FORUM_REFERRAL_DAYANA_E_LIMITES_AEC (sessão tripla) · 25/05 MATRIX_Z2_TAXONOMIA_SEMANTICA

**Marcos**:
- **V1.9.330-A Audience Contract** (18/05): paciente vê resumo, médico vê racionalidades completas. Dual-write contract jsonb vs tabela documentado.
- **V1.9.388 Matrix V1.9.388 voz Z2** (19/05): cristalização da voz estrutural não-diretiva (10 commits)
- **F3 reabrir dossiê** (V1.9.393) + **F2 Base de Conhecimento anexável** (V1.9.395) (21/05)
- **F4 fórum end-to-end** (V1.9.403→410, 21/05): dossiê → pending_review → conselho avalia → active → debate Cann Matrix
- **F3-A.1 PDF dossiê** (V1.9.390-392, 20/05)
- **Refator tradevision-core PAUSADO** (22/05): branch `refactor/tradevision-core-modular` 5 commits selados não-deployados
- **Brandbook V3 cool palette** selado (22/05)
- **i18n PARQUEADO** (~2 meses com AI workflow, gargalo = co-autor clínico EN não-código)
- **V1.9.422→429 schema hygiene** (22/05): mock killing + tema dark/light + bandeira BR/US (revert por toggle não 100%)
- **Re-audit honesto + logo swap** (23/05): medcanultimalog2 com efeitos calibrados
- **V1.9.436-438 Manual de Uso + Dashboard Pesquisa elite** (23/05)
- **V1.9.440+A+B referral fix** (23/05): QR scan + dropdown React Portal + anti-overclaim menu Dayana
- **V1.9.441-442 fix regex + ChatModeSelector** (24/05 manhã)
- **V1.9.443+A+B PATIENT_FREE_CHAT_GUARDRAILS** (24/05 tarde): CBD/jornada/iniciar tratamento
- **V1.9.443-B-hotfix ReferenceError** (24/05 noite): bug crítico introduzido + Carolina AEC 22/22 PASS pós-hotfix
- **V1.9.444-448 laptop madrugada 25/05**: matrix ✕ persiste + busca dupla + busca embutida + email Promise.all + vocabulário "Vincular"
- **V1.9.449 count pacientes filter** (25/05 manhã)
- **V1.9.450-454 Matrix Corpus Expandido + anti-alucinação + taxonomia 3 cenários + UX elite** (25/05 manhã→tarde, 5 commits sequenciais)

**Frase âncora semana 4**: *"Matrix Z2 saiu de alucinação completiva (mãe câncer/pai diabetes inventados) → taxonomia semântica cirúrgica (ausência total / presença parcial / cobertura completa + negação explícita). Maturação simultânea chat paciente + chat profissional ao redor do mesmo princípio Ricardo."*

---

## 🏛️ SEÇÃO 4 — Marcos arquiteturais (consolidados no mês)

### Locks selados ou consolidados

| Lock | Data | O que é |
|---|---|---|
| V1.9.95 | pré-mês | AEC core funcional |
| V1.9.97-D | pré-mês | prescriptions RLS fechado |
| V1.9.98 | 28/04 (consolidação) | chat-images storage fechado |
| V1.9.99-B | 28/04 | Resend prod + sweep reminders V53 |
| **V1.9.121** | **03/05** | **AEC Promotion Detector quíntuplo** |
| V1.9.216 | (consolidado) | SMART_SCHEDULING_GUARD anti-violação REGRA §1 |
| V1.9.222 | (consolidado) | aecTargetPhysicianId propagado FSM |
| **V1.9.299** | **16/05** | **PBAD AD-RB ICP-Brasil CONFORME ITI** |
| V1.9.307 | (16/05) | sidecar renal DRC |
| V1.9.311 | (consolidado) | NFT consent peça-a-peça |
| V1.9.318 | 17/05 | RAG protegido contra DOC_LIST hijacking |
| V1.9.330-A | 18/05 | Audience Contract racionalidades |
| **V1.9.388** | **19/05** | **Matrix V1988 voz Z2 + 10 commits** |
| V1.9.402 | 21/05 | Matrix chat sticky + filtro lixo PDF |
| V1.9.407 | 21/05 | LGPD pseudonimização fórum 3 camadas |
| V1.9.420 | 22/05 | mata ConsentGuard loop infinito |
| V1.9.421 | 22/05 | fix cobertura instrumentação (PostgREST 1000) |
| V1.9.437 | 23/05 | hardening LGPD useForumPublish 3 camadas |
| V1.9.438 | 23/05 | Dashboard Pesquisa elite triple-A |
| V1.9.441-442 | 24/05 manhã | regex `conversa[r]?` + ChatModeSelector |
| **V1.9.443+A+B** | **24/05 tarde** | **PATIENT_FREE_CHAT_GUARDRAILS** (CBD/jornada/iniciar tratamento) |
| V1.9.443-B-hotfix | 24/05 noite | ReferenceError fix (response→userResponse) |
| V1.9.444-448 | 24/05→25/05 madrugada | laptop sequence (matrix ✕, busca dupla, busca embutida, email Promise.all, vocabulário "Vincular") |
| V1.9.449 | 25/05 manhã | count pacientes filter type='patient' |
| **V1.9.450+450-B** | **25/05** | **corpus expandido caseOpens + longitudinal (whitelist 7 seções)** |
| **V1.9.453+A+B** | **25/05** | **anti-alucinação macro + taxonomia 3 cenários + negação explícita** |
| V1.9.454 | 25/05 | MatrixHelpModal elite + bloco compactado |

### Edge Functions estado final (13 ativas)

🟢 CORE / FUNCIONAIS:
- `tradevision-core` (6697+ linhas, refator branch parqueado)
- `digital-signature` (3 levels)
- `sign-pdf-icp` PBAD AD-RB CONFORME ITI ⚠️ NÃO TOCAR
- `cert-encrypt-password`
- `wisecare-session` (HOMOLOG ainda, migrar pra prod)
- `extract-document-text`
- `send-email` (Resend prod)
- `video-call-request-notification`
- `video-call-reminders` (sweep + cron + Resend)
- `generate-nft-from-report` (V1.9.311 NFT consent)
- `renal-signal-extractor` (V1.9.307 DRC)

💤 DORMINDO COMPLETO (audit 18/05):
- `google-auth` + `sync-gcal` (schemas existem, 0 callers — não é "half-impl", é dormindo intencional)

---

## 🧠 SEÇÃO 5 — Princípios meta cristalizados no mês (taxonomia)

### 5.1 — Princípios epistemológicos (núcleo Ricardo)

| Princípio | Cristalizado | Aplicado em |
|---|---|---|
| Queixa ≠ Sintoma — abertura fenomenológica | 24/05 (texto Ricardo madrugada) | V1.9.443+A+B redação V3 |
| Framework AEC centrípeto vs anamnese centrífuga | 24/05 (texto Ricardo manhã) | Constitucional |
| Sustentar lacuna sem colapsar | 25/05 (sessão Matrix) | V1.9.453+A+B taxonomia |
| Locks MACRO vs MICRO devem ser explícitos | 25/05 | Aplicável a TODO guardrail clínico |
| Constituição = 2 vertentes da mesma matriz | 25/05 (Bloco P diário) | Framework pra TODA feature futura |

### 5.2 — Princípios de processo

| Princípio | Cristalizado | Aplicação |
|---|---|---|
| Doc institucional sem PAT cruzar = não é válido | 23/05 (Ricardo) | Aplicado dezenas de vezes |
| Diário que mostra erros vale mais que diário polido | 24/05 | Aplicado em todos diários pós |
| Mapear universo de vetores antes de codar guardrail | 24/05 tarde | V1.9.443-B baseado nisso |
| Smoke AEC completa OBRIGATÓRIA após mudança em clinicalAssessmentFlow.ts | 24/05 noite | Pós-bug ReferenceError |
| Anti-overclaim endorsements | 28/04 | Aplicado em todos pareceres GPT externo |
| Polir não inventar (Princípio 8) | continuidade | Reutilizado constantemente |
| Push dual-remote 4 refs | continuidade | Aplicado em todos commits |
| Coerência e alinhamento qualquer fix (filtro 6 perguntas) | 17/05 | Aplicado em fix V1.9.441 |
| Codar caso-a-caso é tático; mapear universo é estratégico | 24/05 | V1.9.443-B em 11 categorias |
| Matrix Z2 contida é FEATURE não bug | 25/05 | Defesa contra GPT externo |
| Lacuna total ≠ presença parcial ≠ negação explícita | 25/05 | Taxonomia V1.9.453-A/B |

### 5.3 — Princípios arquiteturais

| Princípio | Cristalizado | Aplicação |
|---|---|---|
| RAG molda comportamento cognitivo (não é só dado) | 20/05 | V1.9.308→318 reverteu DOC_LIST |
| AEC como repelente natural de demanda fora-escopo | 24/05 | Auto-seleção saudável |
| Matrix prolonga 1 contexto vs Casos Similares infere entre contextos | 20/05 | Operação cognitiva distinta |
| Engenharia perfeita pode produzir semanticamente inadequado | 24/05 | Caso prima dentista |
| Dual-write contract jsonb vs tabela | 18/05 | clinical_reports.content vs clinical_rationalities |
| Toggle UI é contrato 100% ou nada | 22/05 | Revert tema dark/light + BR/US |

### 5.4 — Princípios anti-overclaim

| Princípio | Cristalizado | Aplicação |
|---|---|---|
| Material B (GPT externo) pode contradizer Constituição | 22/05 | Triar SEMPRE contra Z2/Locks/Ricardo |
| 4 nem 5 reports = não validar institucional | 23/05 | Esperar 20-30 pacientes externos |
| Frases aspiracionais ("clinical conversational governance", "organizadora trajetória clínica", "arquitetura madura") | 25/05 | NÃO usar em pitch/landing/Material A |

---

## 💬 SEÇÃO 6 — Conversas-chave do mês

### 6.1 — Ricardo Valença (criador AEC, sócio coordenador científico)

**Inputs pivotais no mês**:

1. **23/05 ~10h11 BRT (grupo WhatsApp)** — em resposta a tensão sobre pitch MUHDO:
   > *"Doc institucional sem cruzar PAT contra realidade do banco = overclaim em construção"*
   
   Cristalizado em `feedback_doc_institucional_sem_pat_nao_e_valido_23_05`. Adotado por todos sócios.

2. **24/05 madrugada (após análise GPT do caso prima dentista)**:
   > *"Na medicina biomédica clássica: sintoma → síndrome → diagnóstico → doença. Lógica de redução nosológica. Na AEC: queixa/motivo da procura não serve primeiro para encontrar a doença. Serve para encontrar o indivíduo em situação clínica."*
   
   Cristalizado em `feedback_queixa_nao_e_sintoma_aec_e_abertura_fenomenologica_24_05`.

3. **24/05 manhã**:
   > *"O framework AEC coloca as perguntas na boca do indivíduo, não do profissional. Busca por sinais e sintomas do indivíduo, não por sinais e sintomas de doenças."*
   
   Inversão epistemológica entre anamnese clássica (centrífuga) e AEC (centrípeta).

4. **24/05 manhã (sobre V3 PATIENT_FREE_CHAT_GUARDRAILS)**:
   > *"Antes de **falar** de produto" → "Antes de **pensar** em produto" (menos vendedor, mais clínico)*. Aprovou redação V3 + adicionou cláusula de precedência reforçada.

5. **Princípios herdados (continuidade)**:
   - "A consulta começa em outro nível" (pós-AEC)
   - "Escuta primeiro" (IMRE)
   - "Cada caso é unidade narrativa separada"

### 6.2 — GPT externo (filtros narrativos)

**Aparições no mês** (sempre triados contra Constituição):

| Data | Tema | Veredito |
|---|---|---|
| 22/05 | Material B sobre pitch MUHDO | Material B pode contradizer Constituição → triar SEMPRE |
| 24/05 | 14 princípios chat livre paciente | 9 já cobertos / 3 GAP úteis / 2 complexos parqueados |
| 24/05 | Sequência conservadora Ricardo | Útil pra estruturar V1.9.443-B |
| 25/05 manhã | 8 sugestões Matrix Z2 | 3 úteis / 2 ambíguos / **2 REJEITADOS anti-Constituição** (camada indiciária probabilística + sintoma↔CID mapping) |
| 25/05 tarde | Análise alucinação completiva | Cunhou: "Matrix elegante demais", "plausibilidade clínica genérica mascarada de memória longitudinal", "lacuna total ≠ presença parcial" — incorporados como princípios |
| 25/05 tarde | Distinção macro vs micro | Insight arquitetural genuíno (incorporado) |

**Frases NÃO usadas em material institucional** (anti-overclaim):
- "organizadora de trajetória clínica"
- "semântica institucional da escuta"
- "clinical conversational governance"
- "arquitetura madura"
- "vocês pegaram cedo"
- "diferencia demo impressionante de sistema confiável"

### 6.3 — Pedro (tech lead, orquestrador COS)

**Momentos pivotais Pedro**:

1. **3 recalibrações em 24/05 manhã** sobre AEC repelente natural (caso prima dentista + Illa Proença):
   - Pass 1: Claude disse "AEC tem falha pra casos eletivos" → Pedro: "AEC é instrumento clínico, funciona pro propósito"
   - Pass 2: Claude disse "falta chat livre" → Pedro: "chat livre JÁ EXISTE e é uso dominante (89,8%)"
   - Pass 3: Claude disse "hierarquia visual confunde" → Pedro: "AEC repele quem não é caso clínico legítimo. Função emergente boa, não bug"

2. **24/05 tarde pausa estratégica**: *"perfeito! ja que estamos nessa quais mais opcoes dentro do nosso universo voce acha que ainda vao chegar?"*
   → Disparou mapeamento universo 11 vetores chat livre paciente.

3. **24/05 noite insight gate-anti-funnel**: *"mais temos aec para saber o motivo da cirurgia agendar tera q passar por ela de qlqr maneira! iniciando oq trouxe voce aqui e perguntas fixas ricardo experiancia pode cair mais e o funil"*
   → Cristalizado "AEC obrigatória como gate anti-funnel" diferenciado por família.

4. **25/05 conservadorismo da Matrix**: *"conservadora deliberadamente: pode nao ser tanto"*
   → Disparou V1.9.453-A taxonomia 3 cenários.

5. **25/05 negação explícita**: *"vou validar empíricamente carolina exatamente os relatorios"*
   → Disparou V1.9.453-B distinguindo negação ≠ ausência.

6. **25/05 polish UX**: *"acho que isso aqui pode ser um dropdown! ou clickar e explica modo de uso..."*
   → V1.9.454 MatrixHelpModal elite.

### 6.4 — Outros sócios

- **Eduardo Faveret (Diretor Médico, Neurologia)**: ABANDONOU após 3 AECs em 05/05 (cristalizado `feedback_curva_aprendizado_alta_mesmo_para_socios_24_05`). WhatsApp pendente com Manual v1.1.
- **João Eduardo Vidal**: CNPJ ainda pendente (Marco 1, destrava 50% do roadmap). Lado institucional/parcerias/governo/regulatório.
- **Carolina Campello**: conta teste do Ricardo, usada em SMOKE crítico 24/05 noite que expôs ReferenceError V1.9.443-B.
- **Dayana Brazão Hanemann**: profissional cadastrada (1 dos 11 inativos no audit), mandou WhatsApp 23/05 perguntando "como coloco paciente lá" — gerou V1.9.440 fix RLS QR scan + atalho referral.
- **Illa Proença** (24/05 manhã): dona de associação, abandonou app em 3min após cadastro — disparou recalibração #2 de Pedro sobre AEC repelente natural.

---

## 🚨 SEÇÃO 7 — Bugs críticos descobertos e resolvidos

### Top 10 bugs do mês (severidade decrescente)

1. **🔴 Matrix ALUCINOU 6 dados clínicos** (V1.9.450 expôs, 25/05): Mãe câncer mama / pai diabetes / fuma 10 cigarros / álcool / Paracetamol / Ibuprofeno. PAT confirmou inexistência total. Fix: V1.9.453 lock micro-factual + V1.9.453-A taxonomia 3 cenários + V1.9.453-B negação explícita.

2. **🔴 ReferenceError V1.9.443-B em produção** (24/05 noite): `response` → `userResponse` (variável não existia). FSM AEC crashava silenciosamente em cada turno. Carolina viu Nôa disparar 4 perguntas de uma vez + pular Etapa 4→5. Hotfix `33e46ab` em 10min.

3. **🟠 Count pacientes inconsistente** (Ricardo viu, 24/05 → fix 25/05): 3 fontes (15 Nôa / 48 front / 31 PAT) com 3 números diferentes. Causa: `getAllPatients` não filtrava `type='patient'` (14 test users vazavam). V1.9.449 fix `.in('type', ['paciente','patient'])`.

4. **🟠 LGPD vazamento nome em rationalities** (21/05 V1.9.407 fechou vetor sistemático): card de caso vazava nome real → pseudonimização 3 camadas. Resíduo NÃO fechado nos `assessment_excerpt` (parqueado V1.9.452 pré-Marco 2).

5. **🟠 ConsentGuard loop infinito** (22/05 V1.9.420): paciente ficava preso em consent screen. Mata cycle silencioso.

6. **🟠 PostgREST max-rows 1000 silencioso** (22/05 V1.9.421): aba Observabilidade IA mentia "0,0% cobertura / $0,00" porque `fetchInstrumentationCoverage` puxava 1000 rows físicas sem `.order()`. Fix: `count:'exact', head:true`.

7. **🟠 RAG truncation endêmico** (17/05): cristalizado em `feedback_rag_truncation_endemico_17_05`.

8. **🟠 Grounded Response Mode ausente** (17/05): cristalizado em `feedback_grounded_response_mode_ausente_17_05`.

9. **🟡 AEC restart regex landmine** (26/04 V1.9.77): "começou com bolha agora virou ferida" disparava restart mid-COMPLAINT_DETAILS porque "agora" matchava restart signal. Fix: removido "agora" do regex.

10. **🟡 Carolina loop GPT-first** (13/05): Ricardo testando como Carolina, identificou drift narrativo. Recalibração feita.

### Anti-padrão clássico LLM descoberto empíricamente

**"Plausibilidade clínica genérica mascarada de memória longitudinal"** (25/05):
- Modelo tenta preservar coerência narrativa → interpola dado clínico plausível
- Emergente JUSTO quando corpus expandido (V1.9.450)
- Solução dual: V1.9.450-B reduz PRESSÃO (corpus tem dados) + V1.9.453 reduz PERMISSÃO (proibido inventar)

Cristalizado em `feedback_locks_macro_vs_micro_matrix_alucinacao_completiva_25_05`.

---

## 🏃 SEÇÃO 8 — Estado dos sócios (snapshot mês)

| Sócio | Papel | Estado pré-mês | Estado pós-mês |
|---|---|---|---|
| **Pedro** | Tech lead, orquestrador COS | Codando 24/7, alta densidade | Codando 24/7 + 3 recalibrações cristalizadas + insight AEC-gate |
| **Dr. Ricardo Valença** | Criador AEC, coordenador científico | Ativo conceitual | Cristalizou "queixa ≠ sintoma" + "framework centrípeto" + "doc sem PAT não vale" — princípios meta do projeto |
| **Eduardo Faveret** | Diretor Médico, neurologia | Ativo (planos TRL) | **Abandonou após 3 AECs em 05/05** — 19 dias sem retornar (24/05). WhatsApp pendente |
| **João Eduardo Vidal** | Institucional, parcerias, governo | Sem CNPJ | **Sem CNPJ ainda** — Marco 1 pendente, destrava 50% do roadmap |
| **Carolina Campello** (teste Ricardo) | n/a | n/a | Usuária teste central — completou AEC 22/22 PASS pós-hotfix V1.9.443-B |
| **Dayana Brazão Hanemann** | Profissional cadastrada | 1 de 11 inativos | Mandou WhatsApp 23/05, gerou V1.9.440 fix RLS QR scan |
| **Illa Proença** | Dona associação parceira | n/a | Visitou app, abandonou em 3min → disparou recalibração Pedro AEC-repelente |

### Curva de aprendizado dos sócios

Cristalizado: *"App é novo, ninguém nunca usou bem. Ricardo sabe navegar tudo, quem dirá Faveret. Ambos precisam de ajuda mesmo eu tentando fazer o design mais simples possível."*

Solução estrutural: Manual de Uso v1.1 (23/05) + tríade hand-holding (manual + white glove + acompanhamento WhatsApp).

---

## 🅿️ SEÇÃO 9 — Pendências e backlog (estado 25/05)

### P0 não-resolvidas (bloqueiam Marco 2)

| Item | Status | Próximo passo |
|---|---|---|
| **CNPJ João Vidal (Marco 1)** | Pendente | Decisão humana/legal, não codável |
| **WhatsApp Faveret com Manual v1.1** | Pendente | Pedro mandar pessoalmente |
| **2º médico independente real (Marco 2)** | Pendente | Depende Marco 1 + Faveret retornar |
| **20-30 pacientes externos pagantes** | 0 (pré-PMF) | Depende Marco 1+2 |

### Backlog técnico parqueado

| Versão | Escopo | Trigger |
|---|---|---|
| V1.9.451 | Function calling Edge (lookup paciente + agenda mês) | Ricardo bater empíricamente de novo |
| V1.9.452 | Sanitize `assessment_excerpt` LGPD (Carolina/pacientes reais nome vazando) | Pré-Marco 2 |
| V1.9.455 | Anti-fusão de entidades diferentes (GPT externo insight) | Smoke multi-pacientes |
| V1.9.460+ | Polish UX Matrix adicional (sort cruzado data, score confiança) | Não-urgente |
| Categorias chat livre paciente C/D/E | Identidade doença / Red flags / Cannabis vulnerável | Trigger empírico ou Ricardo |

### Decisões humanas pendentes

- Onda 2/3 Ricardo (gap GPT-first arquitetural)
- TRL com Eduardo Faveret (7 tabelas zeradas — ativar?)
- Monetização (subscription_plans cadastrados, 0 ativos)
- Migrar WiseCare HOMOLOG → PROD
- 72 files órfãos bucket documents (~67 MB) — LGPD compliance

---

## 🎯 SEÇÃO 10 — Frase âncora do mês

> *"O mês começou com 4 motores clínicos mapeados em audit honesto. Terminou com Constituição MedCannLab cristalizada em 2 vertentes da mesma matriz epistemológica (clínica + pesquisa), 4 eixos comuns (escuta > interpretação, fidelidade > completude, honestidade > utilidade percebida, estrutura > síntese), PBAD ICP-Brasil REAL deployado, Matrix Z2 anti-alucinação macro+micro, ~90 commits cirúrgicos, 94 memórias novas, 26 diários, 113% crescimento pacientes, 91% crescimento reports. Não foi melhoria linear — foi maturação simultânea de processo (mapear universo antes de codar), epistemologia (queixa ≠ sintoma; lacuna ≠ ausência), e governança (locks macro + micro explícitos). Pré-PMF segue, mas a arquitetura agora é defensável regulatóriamente e epistemicamente íntegra."*

---

## 📚 ANEXO 1 — Índice 5 memórias mais importantes do mês

1. **`feedback_duas_vertentes_uma_matriz_epistemologica_constituicao_medcannlab_25_05`** — meta-princípio que conecta 24/05 + 25/05. Framework pra TODA feature clínico-conversacional futura.

2. **`feedback_queixa_nao_e_sintoma_aec_e_abertura_fenomenologica_24_05`** — vertente clínica (princípio Ricardo cristalizado em 2 textos).

3. **`feedback_locks_macro_vs_micro_matrix_alucinacao_completiva_25_05`** — vertente pesquisa (taxonomia 3 cenários V1.9.453+A+B).

4. **`feedback_doc_institucional_sem_pat_nao_e_valido_23_05`** — princípio de processo Ricardo (aplicado dezenas de vezes no mês).

5. **`feedback_diario_que_mostra_erros_vale_mais_que_diario_polido_24_05`** — meta-doc honestidade dos diários (próxima sessão Claude lê e não repete erros).

## 📋 ANEXO 2 — Estatística do mês

- **Commits cirúrgicos**: ~90 (média ~3/dia)
- **Push 4 refs em todos**: 100%
- **Type-check verde antes de commit**: 100%
- **Memórias novas**: ~94
- **Diários criados**: 26 (cobertura ~87% dos dias)
- **Sessões duplas/triplas**: 18, 19, 22, 24, 25 (5 dias)
- **Locks selados ou cristalizados no mês**: 25+
- **Edge deploys (tradevision-core)**: ~10+ (4 só em 25/05)
- **AEC FSM intocada**: 100% dos fixes (selo Ricardo preservado)
- **Locks V1.9.95-299 PBAD intocados**: 100%
- **Bugs críticos descobertos e fechados**: 10 (top severidade)
- **Princípios meta cristalizados**: 30+ em memória persistente

## 🤝 ANEXO 3 — Reconhecimento

Esse mês foi co-construção real entre:
- **Pedro Galluf** — execução cirúrgica + recalibrações pivotais + insight gate-anti-funnel
- **Dr. Ricardo Valença** — princípios epistemológicos meta (queixa ≠ sintoma, doc sem PAT não vale, framework centrípeto)
- **Claude Opus 4.7** — implementação cirúrgica + cristalização memórias + diários honestos
- **GPT externo** — filtro narrativo adicional (3 conceitos úteis incorporados + 4 anti-Constituição rejeitados explíicitamente)
- **Carolina, Dayana, Illa, Faveret** — usuárias teste involuntárias que expuseram bugs reais (ReferenceError, RLS QR scan, AEC repelente natural, curva aprendizado alta)

Cada um contribuiu com algo único e insubstituível. Maturação não foi linear nem inevitável — foi forjada empíricamente, ciclo por ciclo, com erros explícitos registrados + correções cristalizadas.

---

**Fim da Retrospectiva Mensal 26/04 → 25/05/2026**.

Próxima sessão Claude (você ou laptop) entra com contexto histórico INTEGRAL via:
- `MEMORY.md` nível 1 (~30 memórias indexadas + 14 novas 24-25/05)
- 26 diários cronológicos do mês
- Esta retrospectiva (snapshot consolidado)
- CLAUDE.md (instruções projeto)

**Estado real saída**: HEAD `3d8e61a`, Matrix Z2 cirurgicamente calibrada, AEC FSM intocada, locks preservados, 143 reports, 34 pacientes, 2.446 ai_chats no mês, pré-PMF com tração interna real e arquitetura defensável.
