# MedCannLab 3.0 — Inventário SGQ Preliminar para Feedback Exploratório de Auditor ANVISA

**Versão**: Auditor External Review v1.0
**Data**: 27/05/2026
**Tipo de documento**: Inventário preliminar interno para feedback exploratório
**Status regulatório**: Pré-petição formal SaMD

---

## 📬 Carta de apresentação

Prezado(a) auditor(a),

A MedCannLab é uma HealthTech/EdTech brasileira de Cannabis Medicinal em desenvolvimento desde meados de 2025, atualmente em fase **pré-PMF** (Product-Market Fit) com testes internos predominantes e baseline mínimo de pacientes externos reais.

Este documento é **INVENTÁRIO PRELIMINAR INTERNO** preparado para solicitar **feedback exploratório** do(a) auditor(a). NÃO constitui:

- ❌ Dossiê técnico formal aceito pela ANVISA
- ❌ Petição formal SaMD protocolada
- ❌ Declaração de conformidade ISO 13485 / IEC 62304 / ISO 14971
- ❌ Material institucional público

Solicitamos apenas **avaliação preliminar** sobre 6 pontos:

1. A matéria-prima documental SGQ orgânico cobre adequadamente os requisitos ISO 13485 base?
2. O caminho **Modelo C híbrido** (módulos clínicos certificados separadamente dos administrativos/educacionais) é regulatoriamente viável?
3. A estimativa interna de cronograma 6-9 meses + custo R$ 60-120K para conversão formato regulatório é realista?
4. Os 3 gaps Supabase identificados (região AWS us-east-1, PITR desabilitado, pgaudit não instalado) são bloqueadores hard ou soft?
5. A manobra arquitetural **Z2 contida** (não-decisional) pode posicionar módulos clínicos em **Classe Ia** em vez de Classe IIb-III?
6. Recomendações de perfil de Responsável Técnico ANVISA tipicamente aceito para SaMD em saúde digital cannabis medicinal?

Toda informação aqui é **confidencial** e sujeita a acordo de não-divulgação (NDA) se aplicável. Identificadores pessoais de pacientes, sócios e UUIDs internos foram **sanitizados** nesta versão.

Agradecemos antecipadamente o tempo e a expertise.

— Equipe MedCannLab (tech lead + sócio-médico + sócio-institucional)

---

## 1️⃣ Quem é a MedCannLab — contexto institucional

### Estrutura societária (4 sócios)

- **Sócio Tech Lead**: orquestração engenharia, plataforma, COS Kernel V5.0
- **Sócio-Médico Nefrologia/CKD**: criador do método AEC (Avaliação Estrutural Clínica), responsável clínico, autor da Constituição V1.9.388-A.3
- **Sócio-Acadêmico Neurologia**: coordenador eixo Ensino, TRL
- **Sócio-Institucional**: relações governo/regulatório/parcerias (gatilho destrava CNPJ — atualmente pendente)

### Arquitetura por 3 eixos

| Eixo | Função |
|---|---|
| Clínica | AEC + Relatório assinado ICP-Brasil + Agendamento + Telemedicina |
| Ensino | Cursos + Biblioteca + Trilhas TRL (Technology Readiness Level) |
| Pesquisa | Fórum de casos clínicos + Nôa Matrix Z2 (chat estrutural não-diretivo) |

### Stack tecnológica
- Frontend: React 18 + TypeScript + Vite + Vercel
- Backend: Supabase (PostgreSQL + Edge Functions Deno + Auth + RLS + Storage)
- IA Chat: OpenAI gpt-4o-2024-08-06 (configuração não-decisional Z2 estrutural)
- Assinatura digital: ICP-Brasil PBAD AD-RB v2.4 CONFORME ITI

### Estado atual (snapshot 27/05/2026)

- Período de operação: ~7-8 meses
- 4 sócios + 11 profissionais cadastrados + ~30 pacientes (predominantemente testes internos)
- Pacientes externos pagantes: **0** (pré-PMF declarado)
- ~140 commits estruturados/mês com versionamento V1.9.X explícito
- Pipeline ICP-Brasil produzindo relatórios clínicos assinados validados externamente

---

## 2️⃣ Números empíricos — SGQ orgânico mensurado

Validação empírica via Management API + git log em 27/05 ~14h BRT.

| Métrica institucional | Valor |
|---|---|
| **Commits últimos 30 dias** | 666 |
| **Diários institucionais maio/2026** | 28 (formato DIARIO_DD_MM_AAAA_*.md) |
| **Versões consolidadas do Livro Magno (Constituição)** | 6 |
| **Retrospectiva mensal estruturada** | 1 (cobertura 26/04 → 25/05) |
| **Memórias persistentes classificadas** | 264 (feedback / project / reference) |
| **Tags git de "locks selados"** (milestones de governança) | 8 |
| **Relatórios clínicos assinados ICP-Brasil** | 40 |
| **Validação externa por terceiro neutro (gov.br)** | ✅ Portal `validar.iti.gov.br` 26/05/2026 |
| **Auditoria PMF Audit Framework executada** | 2 (cobertura inicial 1.5% — em expansão) |
| **Interações IA com metadata estruturado** (custo, latência, modelo, tokens) | 4.005 |
| **Tabelas com Row Level Security ativo** | **141 / 141 (100%)** |

---

## 3️⃣ Mapeamento empírico SGQ → ISO 13485:2016

A MedCannLab construiu **organicamente** um Sistema de Gestão da Qualidade ao longo de 7-8 meses de desenvolvimento. O conteúdo SGQ existe em formato **não-regulatório** (markdown, git, memórias persistentes) e cobre aproximadamente **70-80% dos requisitos ISO 13485:2016** segundo nossa autoavaliação empírica preliminar.

### §4 Sistema de Gestão da Qualidade

| Requisito ISO 13485 | Documento MedCannLab equivalente | Maturidade |
|---|---|---|
| 4.1.1 Estabelecer SGQ | `CLAUDE.md` — pirâmide de governança 8 camadas + REGRA HARD §1 anti-kevlar | ✅ Existe (informal) |
| 4.1.2 Documentar processos | 28 diários do mês + 264 memórias persistentes | ✅ Existe |
| 4.1.3 Determinar critérios | 12 princípios operacionais cristalizados em memórias `feedback_*` | ✅ Existe |
| 4.1.4 Abordagem baseada em risco | Locks técnicos escalonados por análise empírica (5 gerações) | ✅ Existe (informal) |
| 4.2.1 Manual da qualidade | 6 versões consolidadas do "Livro Magno" (Constituição cristalizada) | ✅ Existe |
| 4.2.2 Política e objetivos | Princípio nuclear: *"GPT é o último a falar e o primeiro a ser checado"* + 4 eixos epistemológicos cristalizados | ✅ Existe |
| 4.2.3 POPs (procedimentos operacionais) | `CLAUDE.md` (≥350 linhas) com Common commands + Pipeline Diário→Magno + Convenções | ✅ Existe |
| 4.2.4 Controle de documentos | Versionamento V1.9.X + git history + 8 tags milestones + dual-remote push (2 remotes × 2 branches) | ✅ **Forte** |
| 4.2.5 Controle de registros | 264 memórias classificadas + índice `MEMORY.md` Nível 1 | ✅ Existe |

### §5 Responsabilidade da Direção

| Requisito ISO | Documento equivalente | Maturidade |
|---|---|---|
| 5.1 Comprometimento da direção | 4 sócios + Constituição institucional V1.9.388-A.3 (mais restritiva que CFM/LGPD/AI Act/FDA/WMA) | ✅ Existe |
| 5.2 Foco no paciente | Princípio sócio-médico: *"queixa ≠ sintoma"* + AEC abertura fenomenológica | ✅ Existe |
| 5.3 Política da qualidade | *"Honestidade epistemológica > parecer útil"* (princípio cristalizado anti-Babylon Health/Watson Health pattern) | ✅ Existe |
| 5.5 Responsabilidades RACI | Definição explícita 4 sócios + áreas no `CLAUDE.md` | ✅ Existe |
| 5.5.2 Representante da direção formal | 🟡 Não-formalizado (operação informal entre tech lead + sócio-médico) | 🟡 Pendente |
| 5.6 Análise crítica pela direção | Retrospectiva mensal estruturada (90+ commits, 94 memórias, locks selados) | ✅ Existe |

### §6 Gestão de Recursos

| Requisito ISO | Documento equivalente | Maturidade |
|---|---|---|
| 6.1 Provisão de recursos | Memo Audit Framework documentado + telemetria custos OpenAI ~$6,50/7d + infraestrutura Vercel/Supabase produtizada | ✅ Existe |
| 6.2 Recursos humanos | RACI 4 sócios + cursos TRL (eixo Ensino) | ✅ Existe |
| 6.3 Infraestrutura | 14 Edge Functions ativas + 141 tabelas com RLS 100% + ICP-Brasil PBAD AD-RB CONFORME ITI | ✅ **Forte** |
| 6.4 Ambiente de trabalho | Vercel auto-deploy + lint-staged pre-commit + secretlint | ✅ Existe |

### §7 Realização do Produto

| Requisito ISO | Documento equivalente | Maturidade |
|---|---|---|
| 7.1 Planejamento | Pipeline "Hipótese → Experimento → Validação → Cristalização" formalizado em `CLAUDE.md` | ✅ Existe |
| 7.2 Processos cliente | Constituição V1.9.388-A.3 + Z2 estrutural não-decisional + ICP-Brasil PBAD validado | ✅ Existe |
| 7.3.1 Planejamento de projeto | Versionamento V1.9.X + sub-letras (V1.9.97-A/B/C) + 8 tags locks | ✅ Existe |
| 7.3.2 Entradas de projeto | Material A documentado + áudios sócio-médico transcritos + memórias `feedback_*` | ✅ Existe |
| 7.3.3 Saídas de projeto | 666 commits/30d + 40 relatórios ICP signed + 4.005 interactions com metadata | ✅ Existe |
| 7.3.4 Análise crítica | PMF Audit Framework (2 execuções formais + processo em consolidação) + diários por bloco com frase âncora | 🟡 Cobertura em expansão |
| 7.3.5 Verificação | Smoke tests empíricos documentados em diários (5/5 PASS curto + FAIL prolongado capturado e corrigido em mesmo dia) | ✅ Existe |
| 7.3.6 Validação clínica | 🔴 **GAP REAL**: 0 paciente externo pagante; 1 paciente externa real confirmada com 3 racionalidades (em acompanhamento sócio-médico) | 🔴 **GAP** |
| 7.3.7 Controle de mudanças | git + V1.9.X + tags + co-author obrigatório nos commits | ✅ **Forte** |
| 7.5.1 Controle de produção | Smoke pré-commit obrigatório formalizado em memory específica | ✅ Existe |
| 7.5.5 Preservação | RLS 141/141 + buckets fechados + rastreabilidade criptográfica ICP-Brasil | ✅ Existe |
| 7.5.8 Identificação | Pseudonimização "Paciente #XXXXXX" + sanitização defensiva PII em camada de IA | ✅ Existe (V1.9.452) |
| 7.5.9 Rastreabilidade | git history + ICP-Brasil signed hash + dual-write contract documentado | ✅ **Forte** |

### §8 Medição, Análise e Melhoria

| Requisito ISO | Documento equivalente | Maturidade |
|---|---|---|
| 8.2.1 Feedback | Fórum Cann Matrix + 100 memórias `feedback_*` classificadas | ✅ Existe |
| 8.2.2 Auditoria interna | PMF Audit Framework formal — score 0-100 + 4 dimensões (green/yellow/orange/red blindspots) | 🟡 Cobertura 1.5% (em expansão) |
| 8.2.3 Monitoramento de processos | 4.005 interactions com metadata + telemetria sustentável | ✅ Existe |
| 8.2.4 Monitoramento de produto | 40 relatórios ICP signed + telemetria + commits estruturados | ✅ Existe |
| 8.3 Controle de produto não-conforme | Memórias `feedback_*` documentam bugs identificados (3 históricos relevantes) | ✅ Existe |
| 8.4 Análise de dados | Retrospectiva mensal V3 + 28 diários + auditoria pós-lock crítico 360° | ✅ Existe |
| 8.5.2 Ações corretivas | Commits fix(...) com versionamento + memory de bug fix + princípio "polir-não-inventar" | ✅ Existe |
| 8.5.3 Ações preventivas | 5 gerações de locks técnicos + smoke obrigatório pré-commit | ✅ Existe |

**Cobertura estimada ISO 13485**: ~70-80% do conteúdo presente em formato não-regulatório.
**Gap principal**: §7.3.6 Validação Clínica formal (depende Marco 2 paciente externo pagante).

---

## 4️⃣ Mapeamento IEC 62304:2006 (Ciclo de Vida Software)

### Proposta de classificação

A MedCannLab opera modelo **híbrido modular**:

- **Módulos clínicos** (AEC FSM + Sidecar Renal + Racionalidades + Relatórios assinados) → propostos como **Classe B / SaMD Ia ANVISA** (manobra arquitetural Z2 contida — vide §6)
- **Módulos administrativos/educacionais** (Fórum + Cursos + Agendamento + Documentação clínica) → propostos como **Classe A / não-SaMD** (sem inferência clínica direta)

### Mapeamento dos requisitos

| Cláusula IEC 62304 | Documento MedCannLab | Estado |
|---|---|---|
| 5.1 Planejamento de desenvolvimento | Pipeline Diário → Magno + V1.9.X | ✅ Existe |
| 5.2 Análise de requisitos | Memórias `project_*` (146 entries) com decisões arquiteturais | ✅ Existe |
| 5.3 Projeto arquitetural | Pirâmide 8 camadas + Constituição cristalizada | ✅ Existe |
| 5.4 Projeto detalhado | Commits cirúrgicos com sub-letras + co-author | ✅ Existe |
| 5.5 Implementação | 666 commits/30d com mensagens estruturadas | ✅ Existe |
| 5.6 Integração e testes | Smoke documentado + PMF Audit Framework | 🟡 Cobertura em expansão |
| 5.7 Validação do sistema | 🔴 **GAP**: zero paciente externo pagante | 🔴 GAP |
| 5.8 Liberação de software | 8 tags git + push 4 refs obrigatório + deploy documentado via PAT | ✅ **Forte** |
| 6.1-6.3 Manutenção | Memórias + 28 diários cobrem evolução mensal | ✅ Existe |
| 7 Gestão de risco do software | 5 locks técnicos escalonados + memory regulatória multi-camada | ✅ Existe |
| 8 Gestão de configuração | git + tags + branches feature/* | ✅ **Forte** |
| 9 Resolução de problemas | Bug fixes commit-a-commit + memórias `feedback_*` | ✅ Existe |

---

## 5️⃣ Análise de Risco — Mapeamento ISO 14971:2019

A MedCannLab implementou **5 gerações de locks técnicos** como controles de risco escalonados, cada um cristalizando aprendizado empírico anterior:

### Gerações de locks (controles de risco)

| Lock | Risco identificado | Controle implementado | Verificação empírica |
|---|---|---|---|
| **PBAD AD-RB ICP-Brasil** | Assinatura digital fraudulenta de receituário/laudo clínico | Algoritmo CONFORME ITI v2.4 + chain ICP embedded | ✅ Validado externamente por terceiro neutro (portal `validar.iti.gov.br` em 26/05/2026) — 40 relatórios assinados |
| **Z2 Estrutural Não-Decisional** | IA inferir conduta clínica/diagnóstico (padrão Babylon Health / Watson Health) | Lock institucional não-decisional + vocabulário Z2 forçado + proibições explícitas | ✅ 5/5 PASS smoke armadilha curta empírico recente |
| **Locks Micro-Factuais** | IA preencher lacunas com plausibilidade clínica genérica ("alucinação completiva") | 3 cenários A/B/C + anti-drift por pressão conversacional + regra semântica meta | ✅ Cristalizado após smoke empírico que expôs 6 dados inventados |
| **Anti-Drift Conversacional Prolongado** | Lock Z2 degradar em conversação prolongada (turnos 6+) | TURN-DECAY LOCK + ANTI-EXPANSÃO em follow-ups + IDs reais obrigatórios + 12 palavras-gateway banidas | 🟡 Deployed, smoke prolongado em sequência |
| **Sanitização PII Defensiva** | Nome real de paciente vazar em campos textuais (LGPD) | Helper de sanitização aplicado em camada de persistência dual-write | ✅ Smoke unit 4/4 PASS — taxa novos saves de 88,5% → 0% |

### Princípio meta-arquitetural anti-risco

A MedCannLab cristalizou recentemente uma **fronteira epistemológica nuclear**:

| ✅ Compressão Estrutural PERMITIDA | ❌ Abstração Clínica PROIBIDA |
|---|---|
| Preserva narrativa original do paciente | Projeta categoria clínica que paciente não disse |
| Agrupa o que está LITERALMENTE no corpus | Mapeia queixa → mecanismo fisiopatológico |
| Linguagem fenomenológica | Linguagem categórica biomédica |

**Pergunta-gatilho aplicada a cada resposta de IA**: *"Estou agrupando o que o paciente disse, ou projetando categoria clínica que ele NÃO disse?"*

Esta fronteira **reduz a classificação de risco SaMD** de potencialmente Classe IIb-III (apoio à decisão clínica) para **Classe Ia** (puramente estrutural não-decisional). Esta é a **manobra arquitetural central** da MedCannLab.

---

## 6️⃣ Gaps reais reconhecidos (anti-overclaim)

| Gap | Impacto regulatório | Plano de fechamento estimado |
|---|---|---|
| **CNPJ ativo MedCannLab** | Sem PJ = ANVISA não recebe petição formal | Pendente decisão sócio-institucional |
| **Responsável Técnico ANVISA designado** | Pré-requisito SaMD obrigatório | Pós-CNPJ + habilitação |
| **Validação clínica formal** | 1 paciente externa real (3 racionalidades) — base muito escassa | Marco 2: integrar 5-10 pacientes externos pagantes ao framework PMF Audit |
| **Conversão formato ISO 13485 regulatório** | Conteúdo existe; formato formal não | Consultoria SaMD especializada 2-4 meses |
| **Auditoria externa independente** | Validação 3rd party do SGQ orgânico | Pós-consultoria de conversão |
| **DPO (Data Protection Officer) formal** | LGPD: empresa que trata dados sensíveis de saúde requer DPO | Pós-CNPJ |
| **Termo de Uso formal CFM 2.314 + LGPD Art. 33** | Disclosure formal sobre uso de IA + transferência internacional de dados | Pré-Marco 2 (advogado especialista) |
| **Backfill de PII em dados históricos** | Sanitização defensiva cobre apenas novos saves | Identificados ~3-4 registros de pacientes externos a sanitizar (volume baixo) |
| **Bug em transição de estado FSM** (caso específico) | 3 sessões marcadas como `INTERRUPTED` quando deveriam ser `COMPLETED` | Fix técnico parqueado (~30 min) |
| **Cobertura PMF Audit Framework 1,5%** | Framework existe + processo em consolidação | Cadência mínima cristalizada: 1 audit/versão clínica + 1 quinzenal |
| **3 gaps Supabase identificados** | Vide §7 abaixo | Custo $25/mês + ~2h dev + advogado |

---

## 7️⃣ Infraestrutura Supabase — análise honesta de compliance

### O que está bem (defensável)

| Critério | Estado |
|---|---|
| Encryption at rest (AES-256) | ✅ Default todos projetos |
| Encryption in transit (TLS 1.3) | ✅ Default |
| Row Level Security (RLS) | ✅ **141 / 141 tabelas (100%)** |
| Backups diários físicos (WAL-G) | ✅ 8 dias consecutivos confirmados |
| `pgcrypto` (criptografia colunar) | ✅ Instalado |
| `pg_cron` (jobs auditáveis) | ✅ Instalado |
| Conformidade corporativa Supabase | ✅ SOC 2 Type II + ISO 27001 + HIPAA-ready (BAA disponível em plano Team+) |

### 3 gaps críticos identificados (auditor pode validar)

#### Gap 1 — Região AWS `us-east-1` (Virginia, EUA)

- Dados de pacientes brasileiros hospedados nos EUA
- LGPD Art. 33 permite transferência internacional **mediante base legal específica + cláusulas contratuais padrão + declaração no Termo de Uso**
- Risco residual: Cloud Act US (requisição de dados pelo governo americano)

**Mitigações disponíveis**:
- A) Manter US + cláusulas contratuais + Termo formal explicitando transferência (rápido, advogado validar)
- B) Migrar projeto para região `sa-east-1` São Paulo (suportada pelo Supabase; 4-8h de trabalho, $0 adicional)

#### Gap 2 — PITR (Point-in-Time Recovery) desabilitado

- Confirmado via API: `pitr_enabled: false`
- Sem PITR = recovery apenas para backup mais recente (até 24h de perda de dados)
- LGPD/SaMD: incidente de corrupção/vazamento entre backups = perda granular impossível

**Mitigação**: Plano Supabase Pro ($25/mês) habilita PITR de 7 dias automaticamente. Custo trivial vs benefício regulatório.

#### Gap 3 — `pgaudit` não instalado

- Sem audit log formal de operações sensíveis (UPDATE/DELETE em tabelas críticas)
- LGPD Art. 37 exige registro de operações de tratamento de dados
- SaMD ISO 13485 §4.2.5: rastreabilidade é requisito

**Mitigação**: Instalação direta da extensão (1-2h de configuração).

---

## 8️⃣ Diferencial vs pleiteantes SaMD típicas

| Critério institucional | Pleiteante média Classe IIa | MedCannLab |
|---|---|---|
| Histórico git estruturado | README + commits vagos | **666 commits/30d** com versionamento V1.9.X + co-author + 8 tags locks |
| Diários de decisão técnico-arquitetural | Notion bagunçado | **28 diários/mês** com frase âncora + Pipeline Hipótese→Experimento→Validação→Cristalização |
| Memórias institucionais persistentes | Inexistente | **264 memórias classificadas** (feedback / project / reference) |
| Constituição cristalizada | Documentação ad-hoc | **6 versões do Livro Magno** + 12 princípios operacionais cristalizados |
| Análise crítica pela direção | Reunião mensal informal | **Retrospectiva mensal V3** estruturada (90+ commits, 94 memórias) |
| Validação criptográfica de outputs clínicos | Frequentemente ausente | **ICP-Brasil PBAD AD-RB CONFORME ITI** validado externamente por gov.br |
| Análise de risco formal | Slide com 3 riscos | **5 gerações de locks técnicos** escalonados com smoke empírico documentando regressões |
| Telemetria de custos operacionais | Sem visibilidade | **4.005 interactions com metadata** completo (custo + latência + modelo + tokens) |
| Wedge competitivo regulatório | "IA decisão clínica" (padrão Babylon) | **Z2 contida não-decisional** = Classe Ia (manobra arquitetural defensável) |

Pleiteantes Classe IIa típicas frequentemente chegam à ANVISA **sem SGQ documentado**. A MedCannLab chega com **SGQ orgânico cristalizado** em git + memórias + diários + Livro Magno. Esta diferença é o argumento central para **Modelo C híbrido** com cronograma e custo reduzidos.

---

## 9️⃣ Roadmap proposto — Modelo C híbrido

### Sequência condicionada à destrava do CNPJ

#### Fase 1 (mês 1-2) — Preparação institucional

1. Designar Responsável Técnico ANVISA habilitado (qualificação a validar)
2. Contratar consultoria SaMD especializada
3. Apresentar matérias-primas existentes + Livro Magno + retrospectiva mensal + memórias
4. Validação ANVISA informal sobre escopo proposto

#### Fase 2 (mês 2-4) — Conversão formato

1. Conversão das matérias-primas → estrutura ISO 13485 formal numerada
2. Capítulos: Manual da Qualidade + Política + POPs + Análise de Risco
3. Aprovação interna pelos 4 sócios
4. Pentest cibersegurança 3rd party (locks técnicos confirmados)
5. Fechar 3 gaps Supabase (Pro plan + pgaudit + Termo)

#### Fase 3 (mês 4-6) — Validação clínica

1. Marco 2: integrar 5-10 pacientes externos pagantes formalmente
2. Aumentar cobertura PMF Audit Framework (cadência mínima cristalizada)
3. Backfill PII residual (volume baixo)
4. Fechar bug FSM identificado

#### Fase 4 (mês 6-9) — Petição ANVISA

1. Auditoria 3rd party ISO 13485 independente
2. Protocolar petição formal Modelo C híbrido:
   - Módulos clínicos = Classe Ia/IIa (com manobra Z2 contida)
   - Módulos administrativos = não-SaMD
3. Iteração técnica conforme demandas ANVISA

### Estimativa interna preliminar

- **Tempo**: 6-9 meses pós-CNPJ
- **Custo**: R$ 60-120K (consultoria + auditoria + pentest + advogado + taxas)
- **Razão da estimativa reduzida**: matéria-prima existe largamente; consultoria converte formato em vez de construir do zero

**Solicitamos feedback do(a) auditor(a) sobre realismo desta estimativa.**

---

## 🔟 Anti-padrão crítico declarado — matéria-prima ≠ certificação

A MedCannLab declara explicitamente:

> Este inventário **NÃO significa que a empresa esteja certificada ou em vias formais de certificação SaMD**. Significa que possui **conteúdo SGQ orgânico mais maduro** do que pleiteantes típicas Classe IIa observadas no mercado.

Falta:

1. Roupa formal regulatória (ISO 13485 formato + capítulos + numeração oficial)
2. Auditor externo 3rd party validar conteúdo independentemente
3. Responsável Técnico ANVISA habilitado assinar formalmente
4. Validação clínica empírica robusta (Marco 2)
5. Petição protocolada + iteração técnica com ANVISA

### Aprendizado anti-padrão Babylon Health / Watson Health

Casos públicos relevantes:

- **Babylon Health**: $4.2B → 0 (vendida por fração; falência operacional; barrada por reguladores em vários países UE/UK por inferência clínica opaca)
- **IBM Watson Health**: $5B → $1B (vendida pelo IBM em 2022; promessa "IA + biomarcadores + medicina personalizada" sem entrega clínica equivalente)

Padrão comum: **overclaim institucional** + IA decisional/diagnóstica opaca + ausência de fronteira epistemológica fenomenológica.

A Constituição V1.9.388-A.3 da MedCannLab foi explicitamente desenhada para evitar esse padrão. **Z2 contida não é falta de inteligência — é integridade arquitetural.**

---

## 1️⃣1️⃣ Perguntas específicas para o(a) auditor(a)

Solicitamos avaliação preliminar exploratória sobre:

1. **Cobertura do conteúdo SGQ orgânico** (~70-80% autoestimado) é razoável vs requisitos ISO 13485 base, ou está super/subestimado?

2. **Modelo C híbrido** (módulos clínicos certificados separadamente dos administrativos/educacionais) é precedente regulatório aceitável pela ANVISA ou rota incomum?

3. **Estimativa 6-9 meses + R$ 60-120K** para conversão formato + auditoria + validação é realista, otimista ou conservadora?

4. **3 gaps Supabase** (região US + PITR off + pgaudit) são bloqueadores hard (impedem petição) ou soft (mitigáveis com Termo formal + cláusulas contratuais)?

5. **Manobra Z2 contida** (não-decisional estrutural) é argumento defensável para classificação **Classe Ia** dos módulos clínicos, ou ANVISA enquadraria Classe IIb-III mesmo assim?

6. **Perfil típico de Responsável Técnico ANVISA** aceito para SaMD em saúde digital com Cannabis Medicinal: registro CFM em alguma especialidade específica? Mestrado/doutorado obrigatório? Sugestões?

7. **Cadência PMF Audit Framework** (autoavaliação interna estruturada) — quantas execuções formais ANVISA tipicamente espera no dossiê pré-petição? 12? 24? 50?

8. **Validação clínica Marco 2** — quantos pacientes externos pagantes formalmente acompanhados por quanto tempo é o mínimo aceitável tipicamente pela ANVISA?

---

## 1️⃣2️⃣ Disclaimers finais obrigatórios

⚠️ **Este documento é confidencial.** Solicita-se acordo de não-divulgação (NDA) se aplicável ao contexto da consulta.

⚠️ **Informações empíricas com data específica** (27/05/2026 ~14h BRT). Números podem variar em alguns dias devido ao desenvolvimento ativo (~140 commits/semana).

⚠️ **Identificadores pessoais sanitizados** (nomes de pacientes, sócios, UUIDs, emails). Versão internamente identificada existe em paralelo.

⚠️ **Não constitui petição formal SaMD.** Solicita-se apenas feedback exploratório.

⚠️ **Validações jurídicas pendentes**: números regulatórios e datas citados são aproximações; advogado especialista em saúde digital + LGPD + RDC 657/2022 deve validar antes de uso institucional formal.

⚠️ **Equipe técnica disponível** para esclarecimentos, demonstrações práticas, ou acesso supervisionado a artefatos referenciados.

---

## 🪶 Conclusão executiva

A MedCannLab é uma HealthTech pré-PMF brasileira com **engenharia institucional notavelmente madura** vs a média de pleiteantes SaMD Classe IIa. A Constituição V1.9.388-A.3 explicitamente desenhada como **anti-padrão Babylon/Watson** posiciona os módulos clínicos como **estrutural não-decisional** (Classe Ia potencial).

O caminho proposto **Modelo C híbrido** com cronograma reduzido (6-9 meses) e custo razoável (R$ 60-120K) depende fundamentalmente de:

1. **Destrava do CNPJ** (Marco 1, pendente decisão sócio-institucional)
2. **Designação de Responsável Técnico** habilitado
3. **Validação clínica empírica** com Marco 2 paciente externo pagante

**Solicitamos feedback exploratório qualificado para refinar o roadmap.**

Agradecemos antecipadamente. Permaneçamos à disposição para esclarecimentos.

---

*Documento preparado em 27/05/2026 ~16h BRT por equipe técnica interna MedCannLab para feedback exploratório de auditor ANVISA. Identificadores pessoais sanitizados. Versão interna detalhada disponível mediante NDA.*

*Plataforma MedCannLab 3.0 · Constituição V1.9.388-A.3 · ICP-Brasil PBAD AD-RB CONFORME ITI · Sistema cognitivo Z2 estrutural não-decisional · LGPD pseudonimização aplicada*
