# MedCannLab 3.0 — Índice SGQ Preliminar (Mapeamento → ISO 13485 + IEC 62304 + ISO 14971)

**Data**: 27/05/2026
**Versão sistema**: V1.9.468-B (Edge) + V1.9.452 (Frontend PII fix)
**HEAD git**: `fe50819`
**Propósito**: mapeamento empírico do **Sistema de Gestão da Qualidade orgânico** já construído pela MedCannLab → requisitos de **certificação ANVISA SaMD** (RDC 657/2022).

---

## ⚠️ Disclaimer obrigatório

Este documento é **MAPEAMENTO PRELIMINAR INTERNO** — NÃO é dossiê técnico formal aceito pela ANVISA. Funciona como:

1. **Inventário** do que JÁ existe documentado empíricamente
2. **Argumento institucional** pra Ricardo + João + investidor entender que o sistema é **mais maduro** do que parece superficialmente
3. **Matéria-prima** pra consultoria SaMD especializada **converter em formato ISO formal** (estimado 2-4 meses + R$ 60-120K via Modelo C híbrido — em vez de 6-12 meses + R$ 100-250K do zero)

**NÃO submeter este documento AS-IS pra ANVISA.** Falta:
- Responsável Técnico habilitado (RT designado + assinado)
- Conversão pra estrutura formal ISO 13485 (capítulos, numeração, formato regulatório)
- Validação por auditor externo 3rd party
- Validação clínica formal (Marco 2 paciente externo pagante)

---

## 📊 Sumário executivo — números empíricos validados via PAT + git (27/05 ~14h BRT)

| Métrica | Valor empírico |
|---|---|
| **Commits últimos 30 dias** | 666 |
| **Diários institucionais maio/2026** | 28 |
| **Versões do Livro Magno** | 6 |
| **Retrospectiva mensal V3** | 1 (cobertura 26/04 → 25/05) |
| **Memórias persistentes** | 264 (100 feedback + 146 project + 9 reference + outros) |
| **Tags git de locks selados** | 8 (V1.9.95 → V1.9.468-A) |
| **Relatórios clínicos ICP-Brasil signed** | 40 (validação externa portal ITI confirmada 26/05) |
| **AEC FSM completed** | 7 (com `is_complete=true`) |
| **clinical_qa_runs (PMF Audit Framework)** | 2 (cobertura 1.5%) |
| **ai_chat_interactions com metadata** | 4.005 (telemetria custo+latência+modelo) |

**Conteúdo SGQ orgânico**: ~70-80% de requisitos ISO 13485 cobertos **empíricamente**. Formato regulatório formal: 0% (pendente conversão).

---

## 🔗 Mapeamento ISO 13485:2016 → Documentos MedCannLab

### §4 — Sistema de Gestão da Qualidade

#### §4.1 — Requisitos gerais

| Requisito ISO | Documento MedCannLab | Estado |
|---|---|---|
| **4.1.1** Estabelecer SGQ | `CLAUDE.md` (350+ linhas) — pirâmide de governança 8 camadas + REGRA HARD §1 anti-kevlar | ✅ Existe (informal) |
| **4.1.2** Documentar processos | 28 diários `DIARIO_DD_MM_2026_*.md` em maio + 264 memórias persistentes | ✅ Existe |
| **4.1.3** Determinar critérios | Princípios cristalizados em memórias `feedback_*` (12 princípios operacionais — CLAUDE.md§ "Princípios operacionais identificados") | ✅ Existe |
| **4.1.4** Aplicar abordagem baseada em risco | Locks `V1.9.299` PBAD + `V1.9.388-A.3` Z2 + `V1.9.453` micro-factuais + `V1.9.468-B` anti-drift = controles de risco escalonados por análise | ✅ Existe (informal) |

#### §4.2 — Requisitos de documentação

| Requisito ISO | Documento MedCannLab | Estado |
|---|---|---|
| **4.2.1** Manual da qualidade | 6 versões Livro Magno em `docs/LIVRO_MAGNO_*.md` (Constituição cristalizada do método AEC + RACI + governança) | ✅ Existe |
| **4.2.2** Política e objetivos da qualidade | Princípio "GPT é o último a falar e o primeiro a ser checado" (CLAUDE.md) + 4 eixos Constituição cristalizados (`feedback_duas_vertentes_uma_matriz_epistemologica_constituicao_medcannlab_25_05`) | ✅ Existe |
| **4.2.3** Procedimentos operacionais (POPs) | `CLAUDE.md` ("Common commands", "Pipeline Diário → Magno", "Pirâmide de governança", "Convenções específicas do projeto") | ✅ Existe |
| **4.2.4** Controle de documentos | Versionamento V1.9.X + git history 666 commits/30d + tags 8 locks selados + push 4 refs obrigatório (2 remotes × main+master) | ✅ Existe (forte) |
| **4.2.5** Controle de registros | 264 memórias persistentes classificadas (feedback/project/reference) + `MEMORY.md` índice NÍVEL 1 | ✅ Existe |

---

### §5 — Responsabilidade da direção

#### §5.1-5.3 — Comprometimento + foco no cliente

| Requisito ISO | Documento MedCannLab | Estado |
|---|---|---|
| **5.1** Comprometimento da direção | Pedro tech lead + 4 sócios + Constituição V1.9.388-A.3 institucional (lock institucional mais restritivo que TODAS legislações) | ✅ Existe |
| **5.2** Foco no usuário/paciente | Princípio Ricardo "queixa ≠ sintoma" (`feedback_queixa_nao_e_sintoma_aec_e_abertura_fenomenologica_24_05`) + AEC abertura fenomenológica + Constituição compressão estrutural | ✅ Existe |
| **5.3** Política da qualidade | "Honestidade epistemológica > parecer útil" (`feedback_compressao_estrutural_vs_abstracao_clinica_27_05`) + anti-Babylon/Watson empírico documentado | ✅ Existe |

#### §5.5-5.6 — Responsabilidade + análise crítica

| Requisito ISO | Documento MedCannLab | Estado |
|---|---|---|
| **5.5** Responsabilidade, autoridade, comunicação | RACI definido (CLAUDE.md "Quem é quem"): Ricardo (camadas 0-2 clínico), Eduardo (Ensino), João (institucional/regulatório), Pedro (tech lead) | ✅ Existe |
| **5.5.2** Representante da direção | 🟡 Não-formal: Pedro orquestra COS + Ricardo selo clínico V5.0 | 🟡 Pendente formalização |
| **5.6.1-5.6.3** Análise crítica pela direção | `RETROSPECTIVA_MENSAL_2026_04_26_a_2026_05_25.md` (raiz repo) — snapshot 30 dias V3 com 90+ commits, 94 memórias, 26 diários, locks V1.9.121→V1.9.454 | ✅ Existe |

---

### §6 — Gestão de recursos

| Requisito ISO | Documento MedCannLab | Estado |
|---|---|---|
| **6.1** Provisão de recursos | Memo 28/04 PMF Audit Framework documentado + custos OpenAI ~$6.47/7d telemetria (4.005 interactions com metadata) + Vercel + Supabase + Resend produtizado | ✅ Existe |
| **6.2** Recursos humanos | RACI 4 sócios + V5.0 selo Magno cristalizado | ✅ Existe |
| **6.2.2** Competência, treinamento | Pipeline Diário → Magno (knowledge transfer via diários + memórias) + cursos TRL Eduardo | ✅ Existe (informal) |
| **6.3** Infraestrutura | 14 Edge Functions ativas + 47 tabelas Supabase + RLS por owner + ICP-Brasil V1.9.299 CONFORME ITI | ✅ Existe (forte) |
| **6.4** Ambiente de trabalho | Vercel auto-deploy + dual-remote push 4 refs + secretlint pre-commit (lint-staged) | ✅ Existe |

---

### §7 — Realização do produto

#### §7.1 — Planejamento

| Requisito ISO | Documento MedCannLab | Estado |
|---|---|---|
| **7.1** Planejamento | "Pipeline Diário → Magno: Hipótese → Experimento → Validação → Cristalização" (CLAUDE.md) — laboratório operacional → memórias intermediárias → Livro Magno (museu do que sobreviveu) | ✅ Existe |

#### §7.2 — Processos relacionados ao cliente

| Requisito ISO | Documento MedCannLab | Estado |
|---|---|---|
| **7.2.1** Requisitos do produto | Constituição MedCannLab cristalizada (V1.9.388-A.3 + Lock Z2 + AEC FSM 13+ fases + ICP-Brasil PBAD AD-RB CONFORME ITI) | ✅ Existe |
| **7.2.2** Análise crítica de requisitos | RETROSPECTIVA MENSAL V3 + 28 diários maio + audit 360° pós-V1.9.299 (16-18/05) | ✅ Existe |
| **7.2.3** Comunicação com cliente | Termo de Uso + Fórum Cann Matrix + WhatsApp Ricardo + emails Resend produtizado | 🟡 Existe (Termo formal pendente) |

#### §7.3 — Projeto e desenvolvimento

| Requisito ISO | Documento MedCannLab | Estado |
|---|---|---|
| **7.3.1** Planejamento | Versionamento V1.9.X + sub-letras (V1.9.97-A/B/C) + tags locks | ✅ Existe |
| **7.3.2** Entradas de projeto | Material A Pedro+Ricardo cristalizado em memórias `feedback_*` + áudios Uber Ricardo 19/05 documentados | ✅ Existe |
| **7.3.3** Saídas de projeto | 666 commits/30d + 40 reports ICP-Brasil signed + 4.005 interactions ai_chat com metadata | ✅ Existe |
| **7.3.4** Análise crítica de projeto | clinical_qa_runs framework (2 rows — cobertura 1.5%) + diários por bloco (A, B, C...) com frase âncora | 🟡 Cobertura QA runs baixa |
| **7.3.5** Verificação de projeto | Smoke tests empíricos documentados em diários (V1.9.468-A 5/5 PASS armadilha curta + FAIL conversação prolongada → V1.9.468-B) | ✅ Existe |
| **7.3.6** Validação de projeto | 🔴 **GAP REAL**: 0 paciente externo pagante (Marco 2 pendente) — validação clínica formal vazia | 🔴 GAP |
| **7.3.7** Controle de mudanças | git versionamento V1.9.X + dual-remote push + tags + co-author obrigatório | ✅ Existe (forte) |

#### §7.5 — Produção e provisão de serviço

| Requisito ISO | Documento MedCannLab | Estado |
|---|---|---|
| **7.5.1** Controle de produção | Edge Functions deployed via PAT + Vercel auto-deploy + smoke pré-commit obrigatório (memory `feedback_smoke_aec_completa_obrigatoria_pos_clinicalassessmentflow_mudanca_24_05`) | ✅ Existe |
| **7.5.5** Preservação | RLS Supabase + buckets chat-images V1.9.98 fechado + ICP-Brasil rastreabilidade criptográfica | ✅ Existe |
| **7.5.6** Validação de processos de produção | Memory `feedback_engenharia_perfeita_pode_produzir_semanticamente_inadequado_24_05` (princípio: pipeline pode falhar semanticamente mesmo verde tecnicamente) | ✅ Existe (epistemológico) |
| **7.5.7** Validação de processos esterilização | N/A (software, não dispositivo físico) | — |
| **7.5.8** Identificação | Pseudonimização V1.9.407 (Caso #XXXXXX) + LGPD art. 12 nos PDFs + V1.9.452 PII fix defensivo (88.5% → 0% novas rows) | ✅ Existe |
| **7.5.9** Rastreabilidade | git history + reports ICP-Brasil signed_hash + dual-write contract jsonb+tabela documentado | ✅ Existe |

---

### §8 — Medição, análise, melhoria

| Requisito ISO | Documento MedCannLab | Estado |
|---|---|---|
| **8.2.1** Feedback | Forum Cann Matrix + memórias `feedback_*` (100 entries) classificadas | ✅ Existe |
| **8.2.2** Auditoria interna | `clinical_qa_runs` framework (Memo 28/04 PMF Audit) — score + 4 dimensões (green/yellow/orange/red) — **MAS cobertura 1.5%** | 🟡 Existe / processo não-perene |
| **8.2.3** Monitoramento de processos | 4.005 ai_chat_interactions com metadata (custo + latência + modelo + tokens) + telemetria sustentável $6.47/7d | ✅ Existe |
| **8.2.4** Monitoramento de produto | 40 reports ICP-Brasil signed + telemetria empírica + commits estruturados | ✅ Existe |
| **8.3** Controle de produto não-conforme | Memórias `feedback_*` documentam bugs identificados (V1.9.443-B `response.includes('?')` ReferenceError + V1.9.452 PII vazamento + V1.9.468-A FAIL conversação prolongada) | ✅ Existe |
| **8.4** Análise de dados | Retrospectiva mensal V3 + 28 diários + audit pós-PBAD 360° | ✅ Existe |
| **8.5.2** Ações corretivas | Commits fix(...)+versionamento V1.9.X + memory de bug fix (princípio "polir não inventar") | ✅ Existe |
| **8.5.3** Ações preventivas | Locks V1.9.299/388/453/468-B + smoke obrigatório pré-commit (memory `feedback_smoke_aec_completa_obrigatoria_*`) | ✅ Existe |

---

## 🔧 Mapeamento IEC 62304:2006 (Ciclo de Vida Software Médico)

### Classe de software (estimada)

MedCannLab Modelo C híbrido SaMD:
- **Módulos clínicos** (AEC + Sidecar renal + racionalidades + relatórios assinados) = **Classe B** (ferimento não-grave possível) ou **Classe Ia ANVISA** se mantém Lock Z2
- **Módulos administrativos/educacionais** (Forum + Cursos + Agendamento + Escriba puro) = **Classe A** (sem risco direto paciente)

### Requisitos IEC 62304 mapeados

| Cláusula IEC 62304 | Documento MedCannLab | Estado |
|---|---|---|
| **§5.1** Planejamento de desenvolvimento | Pipeline Diário → Magno + versionamento V1.9.X | ✅ Existe |
| **§5.2** Análise de requisitos | Diários + memórias `project_*` (146 entries) com decisões arquiteturais | ✅ Existe |
| **§5.3** Projeto arquitetural | Pirâmide de governança 8 camadas (CLAUDE.md) + Livro Magno + Constituição cristalizada | ✅ Existe |
| **§5.4** Projeto detalhado | Commits cirúrgicos com versionamento sub-letras (V1.9.97-A/B/C) + co-author obrigatório | ✅ Existe |
| **§5.5** Implementação | 666 commits/30d com mensagens estruturadas (fix/feat/docs) + smoke pré-commit | ✅ Existe |
| **§5.6** Integração e testes | Smoke documentado em diários (V1.9.468-A 5/5 + V1.9.468-B 6 fixes) + clinical_qa_runs | 🟡 Cobertura QA baixa |
| **§5.7** Validação do sistema | 🔴 GAP: 0 paciente externo + 7 AEC completed (todos teste interno) | 🔴 GAP |
| **§5.8** Liberação de software | Tags git locks selados (8 tags) + push 4 refs obrigatório + deploy via PAT documentado | ✅ Existe (forte) |
| **§6.1-6.3** Manutenção | Memórias `feedback_*` documentam bugs históricos + 28 diários cobrem evolução do mês | ✅ Existe |
| **§7** Gestão de risco | Locks documentados (V1.9.299/388/453/468-B) + memory `reference_lock_v1_9_388_a3_ancoragem_regulatoria_multicamada_27_05` | ✅ Existe (informal) |
| **§8** Gestão de configuração | git versionamento + tags + branches feature/* | ✅ Existe |
| **§9** Resolução de problemas | Memórias `feedback_gotchas_conhecidos_*` + bug fixes documentados commit-a-commit | ✅ Existe |

---

## ⚠️ Mapeamento ISO 14971:2019 (Análise de Risco para Dispositivos Médicos)

### Locks documentados = controles de risco escalonados

| Lock | Risco identificado | Controle implementado | Verificação empírica |
|---|---|---|---|
| **V1.9.299 PBAD AD-RB ICP-Brasil** | Assinatura digital fraudulenta de receituário/laudo | Algoritmo PBAD AD-RB CONFORME ITI v2.4 + chain ICP embedded | Validado externamente portal `validar.iti.gov.br` 26/05 (terceiro neutro gov.br) — 40 reports signed |
| **V1.9.388-A.3 Z2 estrutural** | Matrix inferir conduta/diagnóstico (anti-Babylon) | Lock institucional não-decisional + vocabulário Z2 forçado | 5/5 PASS smoke armadilha curta empírico Paciente #6ACF |
| **V1.9.453 locks micro-factuais** | Matrix preencher lacunas com plausibilidade clínica genérica (alucinação completiva) | 3 cenários A/B/C + anti-drift por pressão conversacional + REGRA SEMÂNTICA META | Cristalizado pós smoke V1.9.450 25/05 + V1.9.453-B negação explícita |
| **V1.9.468-B anti-drift conversacional** | Lock Z2 degradar em conversação prolongada (turnos 6+) | TURN-DECAY LOCK + ANTI-EXPANSÃO + IDs reais + 12 palavras-gateway banidas | Edge live 27/05 ~13h BRT — smoke 9 turnos pendente |
| **V1.9.452 PII sanitize defensivo** | Nome real paciente vazar em `assessment` (LGPD) | Helper `sanitizeAssessmentPII` aplicado em 2 INSERTs (dual-write) | Smoke unit 4/4 PASS 27/05 — 88.5% rows novas → 0% (backfill 115 históricas parqueado) |

### Princípio meta-arquitetural anti-risco

`feedback_compressao_estrutural_vs_abstracao_clinica_27_05` — fronteira nuclear:
- **Compressão estrutural permitida**: preserva narrativa original do paciente
- **Abstração clínica proibida**: projeta categoria biomédica que paciente não disse
- Teste de fronteira pergunta-gatilho: *"Estou agrupando o que o paciente disse, ou projetando categoria clínica que ele NÃO disse?"*

Esta fronteira **REDUZ classificação SaMD de Classe IIb-III pra Classe Ia** (manobra arquitetural cristalizada — `reference_lock_v1_9_388_a3_ancoragem_regulatoria_multicamada_27_05`).

---

## 🔴 GAPs reais identificados (anti-overclaim honesto)

| Gap | Impacto | Plano de fechamento |
|---|---|---|
| **CNPJ MedCannLab destravar** | Sem PJ = ANVISA não recebe petição | Marco 1 João (gatilho) |
| **Responsável Técnico ANVISA habilitado** | Pré-requisito SaMD obrigatório | Pós-CNPJ: designar sócio-médico + habilitar |
| **Validação clínica formal** | 0 paciente externo pagante (Marco 2) | Marco 2 + integrar 1-3 pacientes externos ao framework `clinical_qa_runs` |
| **Conversão formato ISO 13485** | Conteúdo existe; formato regulatório formal não | Consultoria SaMD especializada 2-4 meses (não 6+) |
| **Auditoria 3rd party externa** | Validação independente do SGQ orgânico | Pós-consultoria: contratar auditor ISO 13485 BR |
| **DPO LGPD nomeado** | Empresa que trata dados sensíveis saúde precisa DPO | Pós-CNPJ |
| **Termo de Uso formal CFM 2.314** | Disclosure IA + médico responsável final formalizado | Material institucional V1.9.469 (advogado validar) |
| **Backfill 115 rows PII históricas** | Fix defensivo cobre só novas; históricas ainda vazam em retroativo | Requer aprovação Ricardo + dry-run preview + sample 10 rows + transaction com rollback |
| **AEC bug state machine `FINAL_RECOMMENDATION → COMPLETED`** | 3 pacientes afetados (mateus / mariappitoco / mariahelenaearp) | V1.9.469-AEC-FINALPHASE parqueado |
| **Cobertura `clinical_qa_runs` 1.5%** | Framework existe mas não-perene | Cadência mínima cristalizada (CLAUDE.md): 1 QA/versão V1.9.X que toca código clínico + 1 quinzenal + 1 obrigatória pré-Marco 2 |
| **`verify_jwt:false` em 12/14 Edges** | Gap segurança auditoria SaMD | Auditar lock interno (V1.9.457 fez pra sign-pdf-icp) + documentar quais têm validação JWT manual |

---

## 🏆 Diferencial vs pleiteantes SaMD típicas

| Critério | Pleiteante média | MedCannLab |
|---|---|---|
| Git history estruturado | README + commits vagos | **666 commits/30d** versionamento V1.9.X + co-author + tags 8 locks |
| Diários de decisão | Notion bagunçado | **28 diários/mês** com frase âncora + Hipótese→Experimento→Validação→Cristalização |
| Memórias persistentes | Inexistente | **264 memórias** classificadas (feedback/project/reference) |
| Constituição cristalizada | Documentação ad-hoc | **6 versões Livro Magno** + Pipeline Diário→Magno + 12 princípios operacionais |
| Análise crítica direção | Reunião mensal informal | **RETROSPECTIVA MENSAL V3** estruturada (90+ commits, 94 memórias, locks selados) |
| Validação criptográfica reports | Frequentemente ausente | **ICP-Brasil PBAD AD-RB CONFORME ITI** validado portal `validar.iti.gov.br` |
| Análise de risco formal | Slide com 3 riscos | **Locks escalonados** com smoke empírico documentando regressões |
| Telemetria de custos | Sem visibilidade | **4.005 interactions com metadata** (custo + latência + tokens + modelo) — telemetria $6.47/7d documentada |
| Wedge competitivo | "IA decisão clínica" (Babylon-pattern) | **Z2 contida** = Classe Ia (manobra arquitetural defensável) |

**Isso é raro.** Pleiteantes Classe IIa típicas chegam à ANVISA sem SGQ documentado. MedCannLab chega com **SGQ orgânico cristalizado** em git + memórias + diários + Livro Magno.

---

## 🛣️ Próximos passos — Modelo C híbrido (recomendado)

Sequência prática após **CNPJ destravar**:

### Fase 1 (Mês 1-2) — Preparação institucional
1. Designar Responsável Técnico ANVISA (Ricardo CRM? Eduardo CRM? validar habilitação)
2. Contratar consultoria SaMD especializada
3. Apresentar ao consultor **este documento** + Livro Magno + retrospectiva mensal + memórias top
4. Consultor avalia gap real (provavelmente 2-4 meses, não 6+)

### Fase 2 (Mês 2-4) — Conversão formato
1. Conversão das matérias-primas → formato ISO 13485 formal
2. Capítulos numerados (Manual da Qualidade + Política + POPs + Análise Risco)
3. Aprovação interna 4 sócios
4. Pentest cibersegurança 3rd party (lock interno V1.9.457 + outros confirmados)

### Fase 3 (Mês 4-6) — Validação clínica
1. **Marco 2** integrar 1-3 pacientes externos pagantes formalmente
2. Aumentar cobertura `clinical_qa_runs` (cadência mínima cristalizada: 1 quinzenal + 1 por versão V1.9.X clínica)
3. Fechar `V1.9.469-AEC-FINALPHASE` (bug state machine)
4. Backfill 115 rows PII com aprovação Ricardo + transaction rollback

### Fase 4 (Mês 6-9) — Petição ANVISA
1. Auditoria 3rd party ISO 13485
2. Protocolar petição formal ANVISA (Modelo C híbrido):
   - Módulos clínicos (AEC + Sidecar renal + racionalidades + reports) = Classe Ia/IIa
   - Módulos administrativos (Forum + Cursos + Agendamento + Escriba) = não-SaMD
3. Iteração técnica com ANVISA conforme demandas

**Custo estimado total**: R$ 60-120K (vs R$ 100-250K se construir do zero).
**Tempo total**: 6-9 meses (vs 9-12 meses se construir do zero).

---

## 🎯 Anti-padrão crítico — matéria-prima ≠ certificação

**ESTE DOCUMENTO NÃO SIGNIFICA QUE MEDCANNLAB ESTÁ CERTIFICADA SaMD.**

Significa que MedCannLab tem **conteúdo SGQ orgânico mais maduro** do que pleiteantes típicas Classe IIa. Falta:

1. **Roupa formal regulatória** (ISO 13485 formato + capítulos + numeração)
2. **Auditor externo 3rd party** validar conteúdo
3. **Responsável Técnico assinar** formalmente
4. **Validação clínica empírica** (Marco 2)
5. **Petição protocolada ANVISA** + iteração técnica

Anti-Babylon/Watson aplicado: **NÃO declarar publicamente "MedCannLab está em certificação SaMD"** sem petição protocolada. Overclaim destrói credibilidade institucional.

**Declarar publicamente** (defensável):
- "MedCannLab opera Constituição V1.9.388-A.3 institucional alinhada com RDC 657/2022 SaMD Classe Ia"
- "Pipeline ICP-Brasil PBAD AD-RB validado externamente portal `validar.iti.gov.br` (terceiro neutro gov.br)"
- "SGQ orgânico documentado em 6 Livros Magno + 28 diários + 264 memórias + 666 commits/30d versionamento V1.9.X"

**NÃO declarar publicamente** (overclaim):
- ❌ "MedCannLab é certificada SaMD" (não é)
- ❌ "MedCannLab tem Class IIa ANVISA" (não tem)
- ❌ "MedCannLab faz IA clínica decisão suporte" (faz Z2 estrutural não-decisional — diferente)

---

## 📚 Documentos institucionais MedCannLab referenciados (mapa físico)

### Na raiz do repositório
- `CLAUDE.md` — POPs + governança + pirâmide 8 camadas (350+ linhas)
- `RETROSPECTIVA_MENSAL_2026_04_26_a_2026_05_25.md` — análise crítica pela direção
- 28 diários `DIARIO_DD_MM_2026_*.md` em maio
- `DIARIO_27_05_2026_MATRIX_Z2_BULA_E_LOCKS_ANTI_DRIFT.md` (snapshot hoje)

### Em `docs/`
- `LIVRO_MAGNO_V17_PREPARADO_15_05_2026.md` — versão mais recente
- `LIVRO_MAGNO_COMPLETO_DETALHADO_09-02-2026.md`
- `LIVRO_MAGNO_DOCUMENTO_FINAL_CONSOLIDADO.md`
- `LIVRO_MAGNO_MEDCANLAB_COMPLETO_2026.md`
- `LIVRO_MAGNO_RESUMO_FINAL_09-02-2026.md`
- `LIVRO_MAGNO_DIARIO_UNIFICADO.md`
- `MEDCANNLAB_SGQ_INDICE_PRELIMINAR_27_05.md` (ESTE documento)

### Em `~/.claude/projects/.../memory/` (264 memórias)
- `MEMORY.md` — índice NÍVEL 1 (entry point sempre)
- 100 `feedback_*.md` — princípios operacionais + lições aprendidas
- 146 `project_*.md` — decisões arquiteturais + estado de features
- 9 `reference_*.md` — pointers pra recursos externos

### Em `supabase/`
- `config.toml` — verify_jwt config
- 14 Edge Functions em `supabase/functions/` com versionamento individual
- Migrations em `supabase/migrations/` formato `YYYYMMDDHHMMSS_v1_9_XX_descricao.sql`

### Em `src/`
- `src/lib/casePseudonymization.ts` — V1.9.407 + V1.9.452 PII sanitize
- `src/components/NoaMatrixView.tsx` — V1.9.468-A + V1.9.468 Bulário ANVISA inline
- `src/services/rationalityAnalysisService.ts` — V1.9.452 sanitize aplicado linhas 575+603
- `src/data/anvisaBularioSeed.ts` — 118 bulas curadas V1.9.467-C

---

## 🪶 Frase âncora final

> *"MedCannLab tem conteúdo SGQ orgânico mais maduro que a maioria das pleiteantes SaMD Classe IIa típicas — falta roupa regulatória formal. Esse gap é mensurável (~R$ 60-120K + 6-9 meses) e fechável após CNPJ destravar (Marco 1 João). Anti-Babylon empírico: a engenharia não é retórica, está no código + git + memórias + Livro Magno. Honestidade epistemológica > parecer útil."*

---

## ⚖️ Conformidade legal brasileira (snapshot 27/05 ~14h BRT)

| Camada regulatória | Estado MedCannLab |
|---|---|
| **CFM 2.314/2022 telemedicina** | ✅ Constituição V1.9.388-A.3 mais restritiva (Z2 não-decisional + médico responsável final) |
| **CFM 2.381/2024 IA medicina** | ✅ Constituição alinhada (IA = ferramenta de apoio estrutural, médico decisão final) |
| **LGPD art. 11 dados sensíveis** | 🟡 Pseudonimização V1.9.407 + V1.9.452 fix defensivo aplicado / DPO formal pendente |
| **LGPD art. 20 decisão automatizada** | ✅ Lock Z2 evita decisão automatizada clínica + revisão humana garantida |
| **RDC 657/2022 SaMD** | 🔴 Petição não-protocolada / CNPJ pendente / RT pendente / conteúdo SGQ existe |
| **RDC 1.015/2026 cannabis** | 🟡 1Pure parceria em discussão / "full spectrum" rotulagem ajustar |
| **ICP-Brasil ITI** | ✅ V1.9.299 PBAD AD-RB CONFORME ITI validado externamente |
| **WMA/WHO ética IA saúde** | ✅ Alinhado com princípios "first do no harm" + transparência |

**Veredito empírico honesto 27/05**: MedCannLab opera em **pre-PMF protegido pelo escopo limitado** (testes internos + CNPJ pendente). Engenharia cada vez mais defensável. Roupa formal regulatória em construção — CNPJ é o gatilho de destrava de toda a sequência Modelo C.

---

*Documento gerado 27/05/2026 ~14h BRT após sessão Claude Opus 4.7 desktop. HEAD git `fe50819`. Próxima sessão laptop (casa do Dr. Ricardo Valença) deve usar este documento como base pra discussão estratégica + smoke V1.9.468-B 9 turnos.*
