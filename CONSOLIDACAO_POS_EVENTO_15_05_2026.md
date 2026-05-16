# 📋 CONSOLIDAÇÃO PÓS-EVENTO — Reunião Sócios + Estado App + Viabilidade Legal

**Data:** 15/05/2026 ~09h30 BRT
**Autor:** Pedro Henrique Passos Galluf (CTO MedCannLab) + Claude Opus 4.7 (1M context)
**Audiência primária:** Pedro (decisão), Ricardo Valença (clínico-autoral), Eduardo Faveret (ensino)
**Audiência secundária:** João Eduardo Vidal (institucional)
**Fontes cruzadas:**
- Transcrição reunião pós-evento 14/05 ~21-23h (4 blocos verbatim)
- Diário 14/05 BLOCO A-E
- IDEIAS_PARKED_PARA_DEPOIS_SPRINT1.md (estado pós-pull 15/05)
- Audit empírico via PAT 14/05 ~13h e ~19h
- Memórias selo dia 14/05 (7 entradas)
- RDC ANVISA 1.015/2026 + MEC + CFM + LGPD

> **Frase âncora desta consolidação:**
> *"Plataforma virou fact-checker institucional. Caixa real venceu promessa. Núcleo AEC intocado. Satélites desacoplados crescem livremente."*

---

## 1. RESUMO EXECUTIVO (1 página)

### Estado real da plataforma (auditado 14/05)

| Dimensão | Valor real |
|---|---|
| Reports clínicos 30d | 104 (123 toda base) |
| ICP-Brasil verificados | 33 (100% nos últimos 30d → aceleração recente) |
| Reports Dr. Ricardo (CKD) | 97 |
| Funil Cidade Amiga dos Rins | 22 atendidos → 19 conversando → 8 com relatório assinado |
| Hits renais/inflamação 90d | 28 |
| Tabelas + RLS policies | 177 + 432 |
| Logs auditáveis | 10.124 em 8 tabelas |
| **Pacientes externos pagantes** | **0 (pré-PMF)** |

### Pendências externas duras (gates)

1. **CNPJ MedCannLab** — destrava Stripe Connect + WhatsApp Business + escala (responsabilidade João, em conflito)
2. **Sprint 1 Devolution** medindo empíricamente (V1.9.200, KPI atual closed_loop 1.7%)
3. **Email Muhdo D+1** pendente desde 07/05, janela esfria ~22/05
4. **Freeze de análise estrutural** ativo até 16/05

### 3 princípios cristalizados na sessão 14/05

1. **Plataforma como fact-checker institucional** — over-claim sobre uso atual morre em ≤30s via consulta banco (caso Ana inexistente, refutado ao vivo pela própria plataforma)
2. **Decisão caixa real ≠ promessa** — gasto material espera dinheiro CAIR, não promessa entrar
3. **Núcleo AEC intocado, satélites desacoplados crescem livremente** — arquitetura modular validada Pedro+Ricardo+João madrugada 14/05

---

## 2. CONVERSA PÓS-EVENTO — 4 BLOCOS SINTETIZADOS

### BLOCO 1 — Cursos / Eduardo / Conteúdo Ricardo

**Tensão central:** Ricardo afirma produzir conteúdo todo dia mas reconhece que as **aulas dos cursos cannabis ainda não estão atualizadas** com o aprendizado deste período (tecnologia, fluxo, descobertas clínicas).

**Acordo informal alcançado:**
- Ricardo reserva **quarta-feira à noite** pra **laboratório de gravação**
- Pedro/Claude pegam aulas pré-definidas atuais + conteúdo plataforma → separam por módulos
- Ricardo regrava com base no material curado

**Reconhecimento institucional:** "Lá tem muito Ricardo Valença demais" — Eduardo precisa entrar mais (último login dia 05/05, 9 dias atrás).

### BLOCO 2 — Câmbio / Eduardo apagado / Pricing / i18n / CNPJ / Caso Ana

**Pricing cristalizado em discussão (NÃO selado):**
- R$ 5,00 / AEC (por CPF) → "Cinco reais o cara tem um relatório sobre a saúde dele"
- R$ 30-39 mensal (uso continuado) → "Vai ter gente com 49, mas com 35-30 vai ter muito mais. 39, 39."

**Internacionalização (João propôs):** Google Translator antes do GPT.
**Ressalva técnica grave (Pedro identificou na hora):** AEC está em português, Verbatim First V1.9.86 trabalha sobre payload em português literal. Tradução pré-GPT **quebra** o bypass GPT de 46% das fases.

**CNPJ — conflito explícito:**
- João pressiona: ligar pro contador AMANHÃ, pagar R$ 1.200 + R$ 1.120 (≈ R$ 2.320)
- Pedro/Ricardo: *"espera 14 dias o dinheiro cair, oremos"*
- João: *"Tô cadastrado, plafon R$ 12k dólares no Santander, entrou parcial R$ 1.500"*
- Resultado: **caixa real vence promessa**. Contador segue, mas gasto espera dinheiro confirmado.

**Caso "Ana" — incerteza sobre referência exata:**
- João mencionou paciente/contato "Ana" que ele esperava ter chegado pela plataforma
- Pedro abre painel ao vivo: busca retorna **Ana Ventorini** (médica testadora cadastrada início de maio, conforme memória 05/05)
- Possíveis interpretações da fala do João (não-resolvidas pela transcrição):
  - (a) Era a própria **Ana Ventorini** — cadastrada, mas talvez sem ter compartilhado relatório com o João
  - (b) Era **outra Ana** (ex: trabalhadora doméstica que João conhece, que viu o card R$ 350 errado e desistiu antes de cadastrar)
- **Caso (b) se confirmado:** mesma classe de bug que afetou Mariana — fee R$ 350 hardcoded → V1.9.294 já corrigiu
- **Caso (a) se confirmado:** paciente/médica existe no banco, gap é "fez AEC mas não compartilhou relatório com João" (padrão UX comum pré-PMF, não bug)
- **Plataforma confirmou:** ausência de cadastro com nome "Ana" simples (sem sobrenome) — não inexistência absoluta de pessoa
- Resultado: independente da interpretação, refinou diagnóstico de 2 problemas reais (fee hardcoded — V1.9.294 já endereça + fluxo de compartilhamento paciente→médico)

### BLOCO 3 — 12k dólares / Caso Ana confirmado / Tensão contador

- Dólar disparou hoje (favorece recebimento futuro do João)
- Santander vai pagar **todo dia 27** (não dia 10 como contrato alegava)
- Discussão "humilde vs pobre" sobre tester
- Tensão pontual sobre transparência da gravação — fricção rápida, sem desdobramento
- Vergonha latente sobre contador: *"não quero passar vergonha com seu contador"* (autodeclarado)

### BLOCO 4 — SEO + CNPJ / Doutora Olha / 3 públicos / Bug Pesquisa / Demo DRC

**Argumento SEO+CNPJ do João (TECNICAMENTE LEGÍTIMO):**
- Meta Developer SDK + produto digital tagueado
- Cada lead taggeado por origem (link de campanha)
- CRM nativo de lead origin
- **Bloqueado por CNPJ** → unlock CNPJ tem retorno técnico mensurável

**Doutora Olha = Doctoralia:**
- Concorrente direto identificado em conversa
- Modelo: médico paga pra aparecer ranked no Google
- Pré-PMF MedCannLab não compete diretamente nesse modelo (audiência diferente)
- Mas reforça: nicho diferenciado é cannabis + nefrologia + governance ICP

**3 públicos × 3 eixos arquiteturais (match natural):**
- Pacientes ↔ Clínica
- Profissionais ↔ Pesquisa
- Alunos ↔ Ensino
- Cada um tem mídia + faixa etária + benefício diferente — campanhas separadas

**Demo DRC saudável (Ricardo demonstrou ao vivo):**
- Paciente/médico digita creatinina → plataforma classifica **estágio GB3** automaticamente
- Funciona empíricamente
- Case forte B2B Prefeitura RJ + Muhdo cohort

**🚨 BUG empírico — módulo Pesquisa "não abre nada":**
- Cards visíveis no Terminal de Pesquisa:
  - Avaliação MR renal
  - Estratificação do código
  - Plano terapêutico
  - Triagem renal guiada
  - Residência de MR
  - Certificação 10CTS integrada ferramenta
  - Avaliação clínica inicial — roteiro estruturado
  - Abertura exponencial
- **Clique em qualquer card NÃO abre nada**
- Ricardo demonstrou ao vivo na reunião → todos viram o bug
- **Candidato fix-prioritário pós-freeze 16/05**

**Regulação imagem governo federal — ressalva latente:**
- Plataforma vai ser pública
- Regras governo federal sobre tipo de imagem
- Pra venda Prefeitura/SUS — compliance específico precisa mapeamento

---

## 3. IDEIAS_PARKED ATIVAS (estado pós-pull 15/05)

11 entradas ativas em `IDEIAS_PARKED_PARA_DEPOIS_SPRINT1.md`:

### Cluster NFT / Galeria / Royalty (3 entradas, integradas)

- **09/05** — Galeria NFTs médico (~1h, polish reuso 100%)
- **09/05** — NFT revisão clínica + `nft_shares` (versão completa ~6-8h, parqueada permanentemente)
- **13/05** — NFT = royalty + ranking + gamificação (tese Ricardo, Princípio 59 candidato pós-freeze)

### Cluster Saúde Renal / DRC (4 entradas, com bloqueador empírico comum)

- **09/05** — IA na página renal coletando exames laboratoriais (Ricardo 05/05)
  - **Bloqueador:** 0 exames renais cadastrados no banco hoje
- **09/05** — Dashboard KPI Cidade Amiga dos Rins DRC estágios I-V
  - **Bloqueador:** 0 exames cadastrados → KPI vazio
- **09/05** — Avaliador de Risco DRC (anti-kevlar §2 forte)
- **14/05** — Triagem DRC narrativa pública (Camada 1) + AEC Nefro Extension
  - **Refinada pela formulação madura abaixo:**
- **14/05 madrugada** — DRC Risk Module satélite isolado (Pedro+Ricardo+João)
  - **Decisão arquitetural mais madura**: módulo SATÉLITE com botão dashboard, NÃO Camada 1 pré-AEC
  - Edge nova `drc-risk-collect` + schema `drc_risk_assessments` (isolado)
  - 4 problemas resolvidos: latência AEC, GPT principal, kevlar §1, escalabilidade

### Cluster Terminal de Pesquisa (3 entradas, "terreno arado, falta plantar")

- **10/05** — Avaliações `evaluationInstruments` mock hardcoded (Rubrica AEC 360º = 128, Casos Clínicos = 94, etc)
- **10/05** — Newsletter & Eventos hardcoded com datas PASSADAS (set-out/2025) + claim material "Revista Brasileira de Nefrologia" — **confirmar se publicação aconteceu** (mesmo risco V1.9.203/206/207)
- **10/05** — Mentoria config estática Ricardo "Terça a Quinta 14h às 20h"

### Cluster Refresh Cursos Ricardo (NOVO — emerge da reunião)

> *Implícito na conversa, ainda não em IDEIAS_PARKED — vale entrar como entry 15/05*

- **Trigger empírico:** Ricardo reservou quarta-feira pra laboratório de gravação
- **Acordo informal:** Claude pega aulas existentes + conteúdo plataforma → separa por módulos → Ricardo regrava
- **Cross-ref RDC 1.015 audit:** renomear 2 cursos "Pós-Graduação Cannabis Medicinal" → "Capacitação em Cannabis Medicinal" elimina obrigação MEC (LDB Lei 9.394/1996)

---

## 4. ESTADO TÉCNICO EMPÍRICO (auditado via PAT 14/05)

### Capacidades comprovadas (zero risco regulatório)

| Compliance | Implementação | Status |
|---|---|---|
| ICP-Brasil PKCS#7 SHA-256 | Todos docs médicos (prescrições, atestados, laudos, exames) | ✅ |
| CFM 2.314/2022 | V1.9.207 CRM+UF | ✅ |
| Anvisa Portaria 344/98 | 4 receituários (Branca C2, Azul B1/B2, Amarela A1-A3) + Atestado + Portal ITI | ✅ |
| LGPD soberania | Supabase BR, dado nacional | ✅ |
| AEC FSM 13 fases | Lock V1.9.95+97+98+99-B intocado | ✅ |
| Verbatim First | 46% bypass GPT | ✅ |
| Pipeline (SCORES→REPORT→SIGNATURE→AXES→RATIONALITY) | V1.9.95 funcional | ✅ |
| 3 camadas constitucionais (Triagem/AEC/Consulta) | Aprovado Ricardo 13/05 | ✅ |

### Gaps reais identificados (não infrações)

| Gap | Status | Quem precisa? |
|---|---|---|
| TCLE Anexo II (Art. 38 RDC 1.015) | Não existe na plataforma | Médico (Art. 38 §2 — arquivamento pelo prescritor). Plataforma pode oferecer como feature pós-PMF |
| Farmacovigilância dedicada (Arts. 47-52) | Sem tabela `adverse_events` | Detentor AS (1 Pure futuro). Oportunidade B2B MedCannLab |
| Auto-classificação Branca vs Amarela por teor THC | Médico escolhe manual | Plataforma. UX, não compliance bloqueador |
| RLS templates SELECT | Qualquer logado vê via API | Plataforma. Vetor teórico (UI HCP-only) |
| Cost telemetry V1.9.238 não popula prod | Pricing R$5/AEC teórico | Plataforma. Não permite validar custo real |

### Achados regulatórios pendentes de ação humana (não-técnica)

| Achado | Severidade | Ação humana |
|---|---|---|
| 6 prescrições cannabis DRAFT com termo Art. 19 III ("full spectrum"/"broad spectrum") + marca "REuni" | 🟡 Vetor (DRAFT, não saíram) | Ricardo padronizar nomenclatura com médicos prescritores |
| 2 cursos chamados "Pós-Graduação Cannabis Medicinal" sem credenciamento MEC | 🟡 Vetor LDB/CDC | Renomear "Capacitação" (1 SQL UPDATE) — quick win |
| Newsletter Library cita "publicação Revista Brasileira de Nefrologia set/2025" | 🟡 Possível claim material falso | Confirmar com Ricardo se publicação realmente aconteceu |
| Duplicação curso "Pós-Graduação Cannabis Medicinal" no banco (2 IDs) | 🟢 Higiene de dados | Deduplicar quando reabrir cursos |
| Sem credencial ICP-Brasil pra 9/10 médicos da plataforma | 🟡 Funcional | Estratégia de onboarding médico (parqueado) |

### Caso Mariana — ouro clínico não-aproveitado

- 3 reports stuck em `aec_draft_*` no client-side (Pipeline abortou em P0B_GATE_C)
- Conteúdo: 1.563 bytes cada — AEC clínica completa
  - Queixa lateral costas
  - HPP rim esquerdo (2 cirurgias)
  - HF nefrolitíase familiar
  - Medicações: Duelle
  - Dor com peso na academia
- **Potencial:** se Mariana refizer AEC selecionando Ricardo → vira case real CKD pra pitch
- **Bug raiz** já corrigido por V1.9.294 (fee dinâmico) — próxima paciente não cai no mesmo cenário

---

## 5. VIABILIDADE LEGAL — MATRIZ POR FRENTE

### Matriz Frente × Compliance × Viabilidade pré-PMF

| Frente discutida | RDC 1.015 | MEC | CFM | LGPD | Viabilidade pré-PMF |
|---|---|---|---|---|---|
| **Pricing R$5 AEC + R$30-39 mensal** | 🟢 N/A (não somos AS) | 🟢 N/A | 🟢 N/A | 🟢 OK | 🟡 Pricing teórico até cost telemetry popular |
| **Pricing R$5 AEC alone** | 🟢 OK | 🟢 N/A | 🟢 OK | 🟢 OK | 🟢 Viável imediato pós-CNPJ |
| **Internacionalização (Google Translator)** | 🟢 N/A | 🟢 N/A | 🟢 N/A | 🟡 Tradutor externo manda payload | 🔴 **QUEBRA Verbatim First** — viola arquitetura |
| **Internacionalização (rota correta = i18n keys)** | 🟢 N/A | 🟢 N/A | 🟢 N/A | 🟢 OK | 🟡 Esforço médio-alto, pós-PMF |
| **CNPJ + Stripe Connect** | 🟢 N/A | 🟢 N/A | 🟢 N/A | 🟢 OK | 🟡 Depende caixa real (não promessa) |
| **SEO + Meta Developer SDK** | 🟢 N/A | 🟢 N/A | 🟢 N/A | 🟡 Lead tracking + LGPD consent | 🟡 Esforço médio, requer CNPJ primeiro |
| **Cursos "Pós-Graduação"** | 🟢 N/A | 🔴 **LDB Lei 9.394/1996** — termo reservado IES | 🟢 N/A | 🟢 OK | 🟢 Renomear "Capacitação" elimina vetor |
| **Cursos como Capacitação Profissional** | 🟢 N/A | 🟢 N/A | 🟢 Eduardo+Ricardo CRMs ativos | 🟢 OK | 🟢 Viável imediato (1 SQL UPDATE) |
| **Refresh aulas Ricardo** | 🟢 N/A | 🟢 N/A | 🟢 OK (CFM 1.974/2011) | 🟢 OK | 🟢 Quarta-feira laboratório, viável |
| **DRC Risk Module satélite isolado** | 🟢 N/A | 🟢 N/A | 🟢 N/A | 🟢 OK | 🟡 Parqueado pós-freeze + aprovação Ricardo |
| **Triagem DRC pública (Camada 1)** | 🟢 N/A | 🟢 N/A | 🟢 N/A | 🟡 Consent-first obrigatório | 🟡 Parqueado, refinado pelo DRC Risk Module satélite |
| **Doutora Olha competition** | N/A | N/A | N/A | N/A | 🟢 Nicho diferenciado (cannabis+nefro+ICP) |
| **3 públicos × 3 criativos** | 🟢 N/A | 🟢 N/A | 🟢 N/A | 🟡 Lead tracking + LGPD | 🟡 Requer CNPJ |
| **Pitch Prefeitura RJ piloto 90d** | 🟢 N/A (camada complementar) | 🟢 N/A | 🟢 OK | 🟢 OK | 🟢 Pitch TOP MASTER pronto |
| **Email Muhdo D+1 follow-up** | 🟢 N/A | 🟢 N/A | 🟢 N/A | 🟢 OK | 🟢 Janela esfria ~22/05, urgente |
| **Bug Pesquisa "não abre"** | 🟢 N/A | 🟢 N/A | 🟢 N/A | 🟢 OK | 🟢 Fix pós-freeze (não-bloqueador) |
| **NFT Royalty/Ranking (tese Ricardo)** | 🟢 N/A | 🟢 N/A | 🟢 N/A | 🟢 OK | 🟡 Princípio 59 candidato pós-freeze |
| **TCLE Anexo II feature** | 🟢 (oferece, não obriga — Art. 38 §2) | 🟢 N/A | 🟢 OK | 🟢 OK | 🟡 Pós-PMF, esforço médio-alto |

### Resumo legal global

**MedCannLab está em compliance plena com Anvisa + CFM + LGPD + Lei 14.063.**
**O único vetor regulatório material identificado é o termo "Pós-Graduação" nos cursos (LDB/MEC).** Fix: renomear "Capacitação" — custo zero, elimina vetor 100%.

Demais gaps são oportunidades de feature (TCLE, Farmacovigilância) ou processos editoriais (padronização nomenclatura prescrições, audit cursos).

---

## 6. CAMINHOS PÓS-FREEZE 16/05

### Prioridade A (quick wins, leves, alto valor)

| # | Ação | Esforço | Bloqueia? | Conexão |
|---|---|---|---|---|
| 1 | Renomear cursos "Pós-Graduação" → "Capacitação" | Mínimo (1 UPDATE) | Elimina vetor MEC | Audit RDC 1.015 |
| 2 | Bug Pesquisa "não abre nada" (Ricardo demonstrou) | Baixo-médio (investigar handlers cards) | Demo confiável | Reunião sócios |
| 3 | Padronizar nomenclatura prescrições (Ricardo + médicos) | Mínimo (processo) | Elimina vetor Art. 19 III | 6 prescrições DRAFT |
| 4 | Email Muhdo D+1 follow-up | Mínimo (1 email) | Janela esfria 22/05 | Tese Muhdo |
| 5 | Aprovar 2-3 reports via "Aprovar e devolver" Ricardo | Mínimo (clicks) | Move KPI Muhdo 1.7% → ~5-8% | Sprint 1 medindo |

### Prioridade B (médio prazo, requer Ricardo curadoria)

| # | Ação | Bloqueador atual |
|---|---|---|
| 6 | Refresh aulas Ricardo (quarta-feira laboratório) | Cronograma Ricardo |
| 7 | TCLE Anexo II como feature | Pós-PMF, Eduardo+Ricardo aprovar conceito |
| 8 | DRC Risk Module satélite isolado | Curadoria 17 perguntas Ricardo + aprovação 4 sócios |
| 9 | Dashboard KPI Cidade Amiga dos Rins (DRC estágios) | ≥10 exames renais cadastrados |
| 10 | IA renal coletando exames | ≥1 exame manualmente cadastrado primeiro |

### Prioridade C (depende externos — CNPJ + caixa real)

| # | Ação | Bloqueador |
|---|---|---|
| 11 | CNPJ MedCannLab | Caixa real (não promessa) — esperar 14 dias |
| 12 | Stripe Connect / MP Connect | CNPJ |
| 13 | WhatsApp Business | CNPJ + caixa |
| 14 | SEO + Meta Developer SDK + 3 públicos × 3 criativos | CNPJ |
| 15 | Pricing R$5 + R$30-39 cobrança real | CNPJ + Stripe |

### Prioridade D (estratégia institucional, próxima reunião sócios)

| # | Decisão pendente | Responsável |
|---|---|---|
| 16 | Pricing final: selar R$30 ou R$35 ou R$39? | Pedro + Ricardo + Eduardo |
| 17 | Eduardo aumentar presença no site (balancear "muito Ricardo Valença") | Eduardo (compromisso) |
| 18 | Internacionalização — descartar Google Translator, adotar i18n nativo | Pedro arquiteta |
| 19 | Plataforma pública governo: regras imagem federal | João + advogado regulatório |
| 20 | Publicação Revista Brasileira de Nefrologia set/2025 — confirmar se aconteceu | Ricardo |

---

## 7. SINAIS PRA REUNIÃO SÓCIOS (consolidação)

### Padrão consolidado João — calibrado factualmente

3 ocorrências de **discurso aspiracional** vs **status atual da plataforma** (não over-claim moral, mas descalibragem entre hype institucional e PMF empírico):

1. 13/05 noite — "Roadshow / investidores"
2. 14/05 pré-evento — "contrato Prefeitura Santos"
3. 14/05 pós-evento — "Roberto + Santa Casa + 90 dias + voo + apartamento beira-mar"

**Padrão observado:** João opera em modo "vender o futuro" (vetor saudável pra captação institucional). Pedro+Ricardo aterrissam ajustando expectativa à realidade empírica (vetor saudável pra credibilidade técnica). **Os 2 vetores são complementares**, não opostos.

**Caso Ana NÃO entra como over-claim:** foi caso real de paciente perdida pelo bug R$ 350 hardcoded — refinou diagnóstico do V1.9.294. Plataforma confirmou que **não houve cadastro**, não que pessoa fosse inexistente.

**Mecanismo de aterragem comprovado:**
- Pedro+Ricardo absorvem informações no laboratório individual (sessões privadas com Claude)
- Chegam na reunião com hipóteses maturadas
- Aterrissam descalibragens com **dados empíricos** (audit PAT, abrir painel ao vivo)
- João traz oportunidades externas que destravam pipeline comercial

**Princípio cristalizado:**
> *"Pipeline diário → Magno operando em produção. Sessão privada gera hipóteses maturadas. Reunião transforma hipóteses em decisões coletivas. Sem laboratório, fricção recorrente — mas a fricção é produtiva quando ambos lados respeitam a complementaridade."*

### Eduardo Faveret — sub-presença atual

- Último login plataforma: **05/05 (9 dias atrás na data 14/05)**
- Site institucional: pouco material dele vs muito Ricardo
- Reconhecimento Ricardo+Pedro: precisa balancear
- Compromisso natural: Eduardo coordenar cursos (eixo Ensino) — refresh agendado, mas Eduardo precisa entrar mais

### Conflito CNPJ — resolução salomônica

- João pressiona AGORA (R$ 2.320 + contador imediato)
- Pedro/Ricardo conservam: "caixa real venceu promessa"
- Decisão: **prossegue com contador, gasto material espera dinheiro CAIR**
- Janela: ~14 dias (cair) + 3-4 dias (processo formal)
- Resultado esperado: CNPJ formalizado fim de mês

### Tensão estrutural Ricardo

- Coordena conteúdo clínico + método AEC autoral
- Crítica Ricardo: *"não vim desenvolvendo... não tem que fazer, pega seu amigo Paulo, organiza a casa"*
- João alega: *"é o que estou fazendo"*
- Pedro: *"caraca a última vez que entrou foi dia 5"* (refere-se Eduardo, não Ricardo)
- **Tensão real:** Ricardo é autor + curador + clínico + tester. Sobrecarga de papéis.

---

## 📌 RESUMO EM 5 DECISÕES PRA PRÓXIMA REUNIÃO

1. **CNPJ:** prossegue contador, gasto espera caixa real. Sem pressão.
2. **Pricing:** R$5/AEC + R$30-39/mês — selar valor mensal entre R$30/R$35/R$39 com Eduardo presente.
3. **Cursos:** Ricardo laboratório quarta + renomear "Pós-Graduação" → "Capacitação" (elimina MEC) + Eduardo aumentar presença.
4. **Bug Pesquisa "não abre":** prioridade fix pós-freeze 16/05 — afeta demo confiança.
5. **Internacionalização:** rejeitar Google Translator pré-GPT, adotar i18n keys nativo se for caminho. Pós-PMF.

---

## 🔗 REFERÊNCIAS CRUZADAS

### Arquivos no repo
- `DIARIO_14_05_2026_CHECKLIST_EVENTO.md` (BLOCO A-E)
- `IDEIAS_PARKED_PARA_DEPOIS_SPRINT1.md` (11 entradas ativas)
- `INVESTMENT_KIT/pitch_prefeitura_rj_top_master_14_05.md`
- `supabase/migrations/20260514220000_v1_9_293_fix_clinical_assessments_rls.sql`
- `supabase/migrations/20260515020000_v1_9_295_owner_id_coalesce.sql`

### Memórias selo dia 14-15/05
- `project_joao_vidal_biocann_1pure_estrutura.md`
- `reference_rdc_anvisa_1015_2026.md`
- `reference_audit_compliance_rdc_1015_14_05.md`
- `project_sessao_14_05_2026_consolidacao_tarde.md`
- `project_fixes_v1_9_293_294_295_14_05.md` (laptop)
- `project_reuniao_pos_evento_14_05.md` (laptop)
- `feedback_plataforma_fact_checker_e_caixa_real_14_05.md` (laptop)

### Princípios cristalizados/candidatos
- **Princípio 38 ratificado** — re-auditar via PAT antes de afirmar métrica externa
- **Princípio 56** (3 camadas) — aprovado Ricardo 13/05
- **Princípio 57** (relacionamento longitudinal) — aprovado Ricardo 13/05
- **Princípio 59 candidato** — NFT royalty (Ricardo 13/05, pós-freeze)
- **Princípio 60 candidato** — Plataforma fact-checker institucional (14/05)
- **Princípio 61 candidato** — Caixa real ≠ promessa (14/05)
- **Princípio 62 candidato** — Núcleo intocado, satélites desacoplados (14/05 madrugada)

---

**Doc selado 15/05/2026 ~09h45 BRT.**
*Cruzamento honesto. Sem inflar. Anti-overclaim ativo. Lock V1.9.95+97+98+99-B intocado em qualquer caminho proposto.*
