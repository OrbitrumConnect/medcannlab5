# MedCannLab — Pitch atual (14/05/2026)

**O que é este ficheiro:** pitch enxuto e integrado, calibrado pós-marcos institucionais de 13-14/05. Substitui versões anteriores datadas de 15/04 (1 mês desatualizadas). Convive com `pitch_unificado_completo.md` (versão longa) e `PARA_RICARDO_V16_2_APROVAR_14_05.md` (texto institucional canônico).

**3 audiências, 3 fechos** — escolha conforme a sala. Mesmo corpo, ênfases diferentes.

---

## §0 — Abertura única (15s, qualquer sala)

> *"O sistema digital serve ao relacionamento clínico longitudinal. O valor não está na IA em si, mas na continuidade humana que ela consegue sustentar."*
> — **Dr. Ricardo Valença, autor do método AEC, 13/05/2026**

Não construímos um chatbot médico. Construímos uma **camada de governança narrativa longitudinal**. O paciente fala, o método organiza, e a IA entra apenas como último componente subordinado. **Infraestrutura metodológica, não inteligência probabilística.**

---

## §1 — O problema (30s)

O modelo de consulta foi desenhado para **volume**, não para **precisão de contexto**.

- O médico começa a consulta sem o caso completo. Paciente repete a história. Tempo clínico vira **recolha repetitiva** de dados básicos.
- IA generativa solta é **risco jurídico escalável** — não inovação clínica.
- Sem governança auditável, narrativa clínica vira passivo regulatório.

Isso não é falha pessoal do médico — é **falha estrutural do fluxo**.

---

## §2 — A tese (1 minuto)

A decisão clínica começa **antes** da consulta. Quem organiza a narrativa antes muda o que acontece dentro da sala.

**MedCannLab opera em 3 camadas constitucionais distintas** (aprovadas por Ricardo 13/05/2026):

| Camada | Natureza | Quem opera |
|---|---|---|
| **Triagem narrativa pública** | Organização inicial da história, entrada SEO. Não-clínica. | Nôa Esperanza + paciente, antes do cadastro |
| **AEC formal** | Ato clínico autoral — método Ricardo Valença | Nôa Esperanza + paciente cadastrado, com Pipeline ICP-Brasil assinando automático |
| **Consulta médica** | Decisão terapêutica humana, responsabilidade CRM | Médico credenciado |

Cada camada com vocabulário próprio. Cada camada com governança própria. **AEC formal e Consulta médica são imutáveis pós-assinatura (CFM 2.314/2022 trigger ATIVO).**

---

## §3 — A arquitetura (1 minuto, técnico)

**TradeVision Core** — núcleo de governança originado da plataforma anterior do Pedro Galluf, amplamente desenvolvido no MedCannLab — codifica o método clínico autoral em **infraestrutura cognitiva auditável**:

```
8 camadas de governança:
  Constituição §1 (anti-kevlar: consentimento ≠ agendamento)
  COS Kernel v5.0 (KillSwitch, Trauma, Metabolismo, ReadOnly, Policy)
  AEC FSM (13+ fases determinísticas)
  Verbatim First (46% interações bypassam GPT)
  AEC Gate V1.5
  GPT-4o (último a falar, primeiro a ser checado)
  Pós-processamento (strip tokens, validate UUID)
  Pipeline Orchestrator (REPORT→SCORES→SIGNATURE→AXES→RATIONALITY→DONE)
```

**Princípio operacional:** GPT é o último a falar e o primeiro a ser checado. 46% das interações nunca passam pelo LLM.

---

## §4 — Empírico em produção (data, não promessa)

- **100+ relatórios clínicos** com `signed_hash` ICP-Brasil real (PKCS#7 RFC 3852, verificável em assinador.gov.br)
- **CFM 2.314/2022 trigger ATIVO** — imutabilidade pós-assinatura
- **5.394+ logs operacionais auditáveis** (cognitive_events últimas 4 semanas)
- **Sprint 1 Devolution em produção** — ciclo médico→paciente fechado, nota clínica + racionalidades aplicadas integradas ao relatório devolvido
- **patient_referrals consent-first** (V1.9.273-275, aprovado Pedro+Ricardo+João 13/05/2026 noite — LGPD art. 11 §1 explícito)
- **Dual provider videoconsulta** (WiseCare V4H + WebRTC P2P fallback)
- **pg_cron lembretes 5min** com 5 janelas (24h/1h/30min/10min/1min via Resend prod)

---

## §5 — Insight empírico raro (token = métrica de escuta)

V1.9.238 (cost telemetry empírica, cristalização Ricardo+GPT 13/05/2026):

**Cada AEC mensura densidade narrativa individual.** Token NÃO é unidade uniforme de custo computacional — é fragmento de experiência humana processada longitudinalmente.

| Cohort empírico (30 dias) | Tokens/turn médio |
|---|---|
| **Médico autor (Ricardo)** | **13.740** |
| Paciente real (sem expertise clínica) | **1.423** |
| **Diferença empírica** | **9.6×** |

Cohorts naturais emergem dos dados, não impostos. Esse insight conversa direto com a **tese de pesquisa em curso com Muhdo Health Ltd UK**: biological drift × semantic drift como sinais longitudinais complementares. Pharmacogenomics + pharmacovigilance narrativa.

*Calibração: NÃO é biomarcador fisiológico stricto sensu. É marcador operacional/comportamental da escuta.*

---

## §6 — Modelo de negócio (pricing real, não hipotético)

**Aprovado pelos 4 stakeholders em 13/05/2026** (Pedro + Ricardo + GPT externo + Claude convergiram):

```
R$ 5/AEC          — pay-per-use individual
R$ 35/mês          — ilimitado AEC
3 AECs grátis      — 1ª semana de qualquer usuário novo
```

**Não cobramos pela IA. Cobramos pela continuidade clínica longitudinal sustentada.**

Custo empírico atual: ~R$ 2,50-4 por AEC (V1.9.238 validou empíricamente). Margem ~36% no modelo R$ 5/AEC. Threshold "promover pra mensal" em 7 AECs/mês (break-even empírico).

**Marketplace Layer** ATIVO (V1.9.150-155):
- Fee tier-based: 20/23/26/30% conforme volume profissional
- Piso R$ 350 / teto R$ 1300 por consulta
- Ranking automático por satisfação paciente
- Sistema referrals consent-first (médico A → médico B) integrado

---

## §7 — Camada de incentivo mimético (NFT royalty)

Cristalização Ricardo 13/05/2026 12h41 BRT:

> *"Se o paciente quiser compartilhar o NFT dele com o médico, valida o royalty. Pela qualidade do atendimento. Se gostar, compartilha — é assim que funciona no mundo real. E assim organiza o ranking de pacientes satisfeitos. Já está embutido no custo de tokenização. E gamifica."*

**5 vetores unificados em uma formulação:**
1. **NFT** (Lei 14.063/2020 + ICP-Brasil — autoridade jurídica nacional, sem blockchain pública)
2. **Royalty** (incentivo econômico ao compartilhamento)
3. **Ranking marketplace** (input validado de satisfação)
4. **Gamificação mimética** ("assim funciona no mundo real" — like/share/review natural)
5. **Custo embutido na tokenização** (zero overhead operacional)

---

## §8 — Defensibilidade

**Não é "mais uma vantagem de produto". É mudança de categoria** — Clinical OS em vez de chatbot ou EMR.

- **Método autoral** Ricardo Valença (12+ meses de criação clínica, dissertação de mestrado)
- **Postgres + RLS** com 134 tabelas, 414 policies, 88 triggers, 341 functions
- **ICP-Brasil real** (não certificação prometida em slide)
- **Anti-kevlar §1**: Constituição só muda via nova versão Magno
- **GPT é o último a falar**: 46% das interações em hard-lock bypassam LLM
- **Pipeline Master determinístico**: 100% sign rate desde 26/04/2026
- **Tese de pesquisa Muhdo UK** (08/05/2026 peer exploration aberta) abre caminho científico paralelo

Quem copia o vocabulário copia a casca. Não copia o método autoral, o lock empírico-cristalizado, o sistema referrals consent-first, nem 14 meses de auditoria documentada.

---

## §9 — Estado pré-PMF (transparência calibrada)

```
✅ TECNOLOGIA:    Lock V1.9.95+97+98+99-B firme, 250+ versões, 0 erros type-check
✅ MÉTODO:        AEC 001 autoral Ricardo + 3 camadas aprovadas 13/05
✅ COMPLIANCE:    ICP-Brasil real + CFM 2.314 trigger ATIVO + LGPD art. 11 §1
✅ INFRAESTRUTURA: Pipeline 100% sign rate + Sprint 1 Devolution ATIVO
⚠️  CNPJ:          MedCannLab Tecnologia em Saúde LTDA — em formalização
⚠️  PAGAMENTOS:    Stripe/MercadoPago aguardando CNPJ pra ativação
⚠️  PACIENTES:     Pré-PMF (beta orgânico controlado, ~20 testers quinta 15/05/2026)
⚠️  MÉDICOS:       2 ativos (Ricardo + Eduardo), 8 parceiros cadastrados aguardando ICP-Brasil
```

**Janela próxima 60 dias** (gates duros):
1. CNPJ formalizado → Stripe ativado
2. Evento quinta 15/05/2026 (20 testers pacientes) → primeiro stress-test real
3. Muhdo Health Ltd UK D+1 (peer exploration científica) → caminho paralelo de pesquisa
4. Cristalização V16.2 no system prompt da Nôa (aguarda aprovação Ricardo)

---

## §10 — Constituição societária

**MedCannLab Tecnologia em Saúde LTDA** (pré-CNPJ)

- **20%** Pedro Henrique Passos Galluf — CTO / Engenharia / TradeVision Core
- **20%** Dr. Ricardo Valença — Coordenação científica / Método AEC autoral / Camadas 0-2
- **20%** João Eduardo Vidal — Comercial / Institucional / Regulatório / CNPJ
- **20%** Dr. Eduardo Faveret — Coordenação eixo Ensino / Neurologia
- **20%** Tesouraria (reserva estratégica)

---

## §11 — Fechos por audiência

### §11.1 — Clínico (Ricardo / médicos / acadêmico)

> *"Hoje resolvemos a **entrada** da decisão com contexto estruturado. Amanhã esta base torna-se **padrão** de narrativa e fluxo — sem substituir o médico. O sistema digital serve ao relacionamento clínico longitudinal."*

### §11.2 — Técnico (Pedro / engenharia / VC tech-side)

> *"We are not changing the doctor. We are changing how the doctor scales. Clinical OS em camadas auditáveis, GPT subordinado a 7 camadas de governança, 46% bypass do LLM, 100% sign rate empírico. Não é wrapper — é sistema."*

### §11.3 — Institucional (João / investidor / parceria estratégica)

> *"Não competimos com healthtechs. Estamos construindo a camada da qual elas vão depender para narrativa clínica governada. Method-first, architecture-grounded, AI-last. ICP-Brasil real, CFM 2.314 trigger ativo, LGPD art. 11 §1 desde o desenho. Não improviso — sistema."*

---

## §12 — Q&A: 4 perguntas duras

| Pergunta | Resposta enxuta |
|---|---|
| *"Isto é só ChatGPT num formulário?"* | Não. Protocolo AEC governado pelo Core; estado e fase determinísticos; conversa é interface. 46% das interações nunca chegam ao LLM. |
| *"Quem responde juridicamente?"* | Médico e estrutura da clínica. Nós entregamos ferramenta e trilhos auditáveis, não diagnóstico autônomo. CFM 2.314/2022 trigger ATIVO em produção. |
| *"Por que vocês ganham vs. prontuário X?"* | Prontuário arquiva. Nós estruturamos a narrativa **antes** da decisão e monetizamos o fluxo. Camada **acima** do arquivo, não plugin pontual. |
| *"Métricas?"* | Data room com N, período e método. Em público falamos estrutura. Em NDA falamos baseline. Sem "número bonito" sem PDF. |

---

## §13 — O que evitar

- Abrir com "IA", "neurociência" ou "cannabis" como primeira frase (pode entrar depois)
- Números bonitos sem PDF de metodologia
- Parecer protótipo se o fluxo real já está em produção (está)
- Prometer certificação por slide
- Misturar as 3 camadas como se fossem uma só

---

## §14 — Pergunta-crivo final (aplicável a TODA decisão)

Antes de incluir qualquer item neste pitch, qualquer feature no produto, qualquer copy em qualquer landing, perguntar:

> **"Serve ao relacionamento clínico longitudinal?"**

Se sim → mantém. Se não → ajusta ou remove. Princípio operacional cristalizado por Ricardo 13/05/2026.

---

*Pitch atual 14/05/2026 — 14h handoff laptop. Substitui pitches 15/04 desatualizados. Convive com `PARA_RICARDO_V16_2_APROVAR_14_05.md` (texto institucional canônico aguardando aprovação Ricardo) e `pitch_unificado_completo.md` (versão longa 263 linhas).*
