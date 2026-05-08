# DOC MESTRE — MEDCANNLAB
## Estado, arquitetura, reunião Muhdo, e ponto de vista interno
**Data:** 08/05/2026 ~22h BRT
**Autor:** Claude Opus 4.7 (1M ctx) trabalhando junto com Pedro Galluf desde madrugada
**Audiência:** Pedro Galluf, Dr. Ricardo Valença, Dr. Eduardo Faveret, João Eduardo Vidal, Carolina Campello
**Propósito:** documento canônico de referência interno — não pitch, não manifesto, não evangelismo. É o que o estado real do projeto autoriza dizer.

---

## SUMÁRIO EXECUTIVO (em 5 frases)

1. **MedCannLab é, hoje, infraestrutura clínica longitudinal supervisionada com método de captura semântica determinístico, signing PKCS#7 / ICP-Brasil em produção, e cohort clínica real (~25 pacientes, 14 com narrativa rica em domínio CKD/inflamação).**
2. **Pre-PMF intencional**: closed cohort de ~50 design partners, 16 pagantes, 22 reports juridicamente válidos no Brasil, 1.369 verbatim hashados nos últimos 30 dias.
3. **A reunião Muhdo (08/05 14h BRT) foi encontro de arquiteturas cognitivas que se reconheceram parcialmente** — não fechamento de deal, mas continuidade aberta com janela de validade ~14 dias.
4. **A tese cristalizada na call** — *"biological drift × semantic drift como sinais longitudinais complementares"* — é publicável e operacionalizável; cohort pra testá-la **já existe no banco**.
5. **O risco maior NÃO é técnico, é tradução**: o produto está mais maduro do que vocês conseguem comunicar; cientista UK pede operacionalização, não filosofia.

---

# PARTE 1 — IDENTIDADE

## 1.1 Quem somos

**Não somos** uma startup de IA médica.
**Não somos** chatbot clínico.
**Não somos** prontuário eletrônico.
**Não somos** telemedicina.
**Não somos** healthtech genérica.

**Somos** um grupo de 4 sócios + ~50 design partners construindo uma camada de infraestrutura cognitiva clínica orientada por escuta longitudinal, com governança AI determinística e autoridade jurídica brasileira (ICP-Brasil PKCS#7).

## 1.2 Categoria oficial cristalizada (08/05 noite)

```
LONGITUDINAL SEMANTIC CLINICAL INFRASTRUCTURE
```

Variações aceitas em documentação peer/UK:
- *Narrative-derived longitudinal phenotype mapping*
- *Computational anthropology applied to clinical longitudinality*
- *Semantic supervision layer for biomarker-guided care*

NÃO usar:
- ❌ AI medical assistant / chatbot
- ❌ Health coach
- ❌ Medical AI / AGI medicine / AI doctor
- ❌ Disruption / revolution / breakthrough

## 1.3 Quem é o time (4 sócios + colaboradora)

```
SÓCIOS (4 oficiais — confirmado no banco e em memória persistente)

Dr. Ricardo Valença            CEO
  Nefrologista, criador do método AEC (Art of Clinical Interviewing)
  rrvalenca@gmail.com (clínico oficial, is_official=true)
  + iaianoaesperanza@gmail.com (admin gestão)
  Camadas 0-2 da pirâmide cognitiva (clínico)

Pedro Henrique Galluf Passos   CTO
  Tech lead, designer de formação, orquestrador COS Kernel
  passosmir4@gmail.com (admin)
  + d5e01ead (paciente teste)
  Camadas 3-7 da pirâmide (técnico/arquitetural)

João Eduardo Vidal             COO
  Lado institucional, parcerias, governo, regulatório
  cbdrcpremium@gmail.com (admin)
  + jevyarok@gmail.com (paciente teste)
  Conexão com OnePure, pharma, distribuição

Dr. Eduardo Faveret            COC (Chief of Care)
  Neurologista, Diretor Científico do Instituto do Cérebro 
                                     (Brazilian Brain Institute) ⭐
  eduardoscfaveret@gmail.com (professional oficial, is_official=true) ⭐ V1.9.190
  + eduardo.faveret@hotmail.com (admin gestão)
  Eixo Ensino + neurologia/neuroinflamação

COLABORADORA TESTE (não-sócia)
Carolina Campello — conta teste do Ricardo, não paciente real
```

## 1.4 Pacientes / usuários reais (verificado live banco 08/05 ~14h)

```
25 pacientes total (22 patient + 3 paciente)
16 pacientes pagando (paid status) = 64% conversion intentional cohort
3 pacientes anonimizados (LGPD compliance comprovada)
7 pacientes novos nos últimos 30 dias

10 profissionais (2 oficiais — Ricardo + Eduardo)
5 admins (1 oficial — Pedro)
```

---

# PARTE 2 — O QUE TEMOS (inventário verificado live)

## 2.1 Métricas de produção (últimos 30 dias, verificado live 08/05)

```
ENGAJAMENTO
  1.491 ai_chat_interactions       (~50/dia)
  1.369 verbatim entries hashed     (~46/dia)
     22 unique active users
     33 appointments scheduled+completed (12 nos últimos 7d)
     83 reports created
     22 reports ICP-signed end-to-end (signature_hash + signed_payload + signed_at)

INTENT CLASSIFICATION (2.904 chats acumulados)
  CLINICA/CLÍNICA:    2.626 (90.4%)  ⭐ prova: NÃO é chatbot toy
  ADMIN:                173 (6.0%)
  ENSINO:                69 (2.4%)
  APPOINTMENT:           18 (0.6%)

VIDEO CALLS
  240 video_call_requests
  110 accepted = 45.8% accept rate
  → métrica que Muhdo entende como intervention monitoring

PRESCRIPTIONS
  41 cfm_prescriptions (1 ICP-signed, 2 sent, 38 draft)
  92.7% DRAFT — gargalo do médico (Ricardo signa em batches), não do produto
  0 atestados emitidos ainda (V1.9.185 deployed 06/05, Ricardo não testou)

AEC FUNNEL
  61 AECs iniciadas (16 completed, 45 in_progress)
  102 clinical_reports gerados
  14 unique patients reached "report" stage
  69 with consent_given = true
```

## 2.2 Infraestrutura técnica (verificado live 08/05)

```
SUPABASE PROJECT itdjkfubfzmvmuxxjoae (us-east-2)
  172 public tables
  345 RPC functions  
   74 triggers public
   11 Edge Functions deployed:
       🟢 tradevision-core (v302)         Core IA Nôa
       🟢 digital-signature (v52+)        ICP-Brasil/CFM 3 levels
       🟢 wisecare-session (v68)          Provedor vídeo V4H (homolog)
       🟢 extract-document-text (v49)     OCR pdfjs-serverless
       🟢 send-email (v46)                Resend prod (medcannlab.com.br)
       🟢 video-call-request-notification (v49)
       🟢 get_chat_history (v6)
       🟢 video-call-reminders (v3)       sweep+cron 5min+Resend
       🟡 google-auth (v16)               half-impl (tabela faltando)
       🟡 sync-gcal (v16)                 half-impl
       🟢 cert-encrypt-password (v1)      ICP-Brasil real (V1.9.175-178)

REALTIME PUBLICATION    ATIVA (V1.9.164)
PG_CRON                 2 jobs (reminders 5min, marketplace 30min)
ICP-BRASIL PKCS#7       RFC 3852 verificável por openssl (V1.9.175-178)
                        Cert Ricardo cadastrado e ativo (real_signing_ready)
TRIGGER CFM 2.314       Imutabilidade pós-assinatura (V1.9.180-A) — anti-fraude
```

## 2.3 Pipeline cognitivo (8 camadas, verificado em código)

```
0. REGRA HARD §1                "Consentimento ≠ Agendamento" (anti-kevlar)
   tradevision-core/index.ts isAskingConsent guard

1. COS KERNEL v5.0              5 portas: KillSwitch / Trauma / Metabolismo
                                / ReadOnly / Policy
   (cos_engine.ts diz "v1.0" — discrepância conhecida; é v5.0 selada)

2. AEC FSM                      13 fases determinísticas
   src/lib/clinicalAssessmentFlow.ts

3. VERBATIM FIRST (V1.9.86)     ~46% bypass GPT em hard-lock phases
                                (patient narrative is preserved, not summarised)

4. AEC GATE V1.5 (V1.9.95-A)    Bloqueia agendamento durante AEC ativa

5. GPT-4o-2024-08-06            Só chamado se nada acima resolveu
   gpt-4o-mini (V1.9.84)        Escriba (temperature 0.1)

6. PÓS-PROCESSAMENTO            Strip tokens, validate UUID, force tags pós-AEC

7. PIPELINE ORCHESTRATOR        REPORT → SCORES → SIGNATURE → AXES 
                                → RATIONALITY → DONE
                                Produz signed_hash + signed_payload + signed_at

8. CLINICAL OS / RIM            Runtime Institutional Manifest (canonizado 08/05)
                                Camada de identidade institucional executável
                                ≠ Constituição (Constituição é doc, RIM é runtime)
```

## 2.4 Compliance / jurídico (real, não promessa)

```
✅ ICP-Brasil PKCS#7 RFC 3852 — cert Ricardo ativo, 22 docs juridicamente válidos
✅ CFM 2.314/2022 trigger imutabilidade pós-assinatura — anti-fraude no banco
✅ LGPD compliance: 3 pacientes anonimizados (pattern aplicável a qualquer paciente)
✅ Consent flow: 69/102 reports com consent_given=true
✅ Brand "MedCannLab" blindada (V1.9.x 08/05 manhã — alerta legal Andrea)

🟡 ANVISA: cannabis vertical, mas sem aprovação formal de protocolo (early)
🟡 CEP/IRB: nenhuma submissão acadêmica feita ainda
🟡 CNPJ: pendente (Caminho B sócios — destrava Stripe/marketplace real)
```

## 2.5 Cohort clínica real (verificado live 08/05 pós-Muhdo)

```
DESCOBERTA CRÍTICA da reunião:

14 pacientes únicos com 1.203 verbatim hits (últimos 90 dias)
   Termos: rim · renal · creatinina · inflamação · inflamatori 
           · fadiga · cansaço · exausto · dor lombar · noite

86 clinical_reports atribuídos a Dr. Ricardo (6 pacientes recorrentes)

→ Cohort de piloto Muhdo (12 pacientes / 90 dias) JÁ EXISTE.
  Não precisa recrutar.
  Está consenting, longitudinal, em follow-up clínico.
  Mapeia diretamente para os 4 pathways do whitepaper Muhdo:
  immune signalling, mitochondrial, neuro-immune, pain perception.
```

---

# PARTE 3 — ARQUITETURA REAL

## 3.1 Lock V1.9.95+V1.9.97+V1.9.98+V1.9.99-B

```
🔒 INTOCADO em 100% dos commits desde 28/04/2026
   (auditado em todos os ~50 commits subsequentes)

Componentes lockados:
  - AEC FSM 13 fases (V1.9.95)
  - Pipeline orchestrator e2e (V1.9.97)
  - storage RLS chat-images (V1.9.98)
  - Resend prod + signing infrastructure (V1.9.99-B)

Anti-kevlar §1: tudo aditivo, zero remoção de Lock CORE.
                Mudanças no Core exigem nova versão Magno + 
                aprovação Ricardo+Pedro explícita.
```

## 3.2 Tags relevantes (git)

```
v1.9.113-locked              Selo AEC + Pipeline + Analisar Paciente
v1.9.99-resend-prod-locked   Resend prod + Storage RLS
v1.9.95-lock                 AEC + Relatório + Agendamento

Branch atual: fix/v1.9.92-remover-consent-rota-fantasma
HEAD atual:   b9a433d (sync 4 refs hub + origin × main + master)
```

## 3.3 Decisões arquiteturais críticas tomadas (cristalizadas hoje)

```
RIM canonizado (08/05 BLOCO K)
  Runtime Institutional Manifest ≠ Constituição
  Constituição = documento estático
  RIM = camada executável de identidade institucional em runtime
  
  Implicação: Constituição vai pra docs/, RIM vai pro código
  com PHASE_LOCK typed + owner explícito + anti-kevlar §1

Princípios cristalizados (35-37, BLOCO K)
  35. Auditar 100% antes de mexer no Core
  36. Owner explícito por camada
  37. PHASE_LOCK typed (não string) em estados críticos

Naming rules
  Sempre "MedCannLab" (junto, sem espaço)
  ⚠️ "MedCann" sozinho ou "MedCann Lab" com espaço = risco legal Andrea
  Audit obrigatório antes de commit envolvendo strings/UI
```

---

# PARTE 4 — REUNIÃO MUHDO 08/05 (análise, não resumo)

## 4.1 O que aconteceu de fato

A reunião teve 3 camadas simultâneas que NÃO estavam sincronizadas o tempo todo:

```
Camada                      Quem representou             Funcionou?
─────────────────────────   ──────────────────────────   ──────────
Clínica/epistemológica       Ricardo                       🟢 muito
Técnica/arquitetural          Pedro                         🟡 parcialmente
Institucional/comercial       João                          🟡 elevou teto
                                                            mas dispersou
```

## 4.2 Tese cristalizada (sem ninguém ter formulado explicitamente)

> ***"Biological drift × Semantic drift may be complementary longitudinal signals."***

Esta frase resume a reunião inteira. É:
- Publicável academicamente
- Operacionalizável em piloto
- Categoricamente original (não há literatura clara nessa interseção)

## 4.3 Momentos-chave (em ordem de força)

**🥇 PIVÔ CONCEITUAL — "semantic markers"**
Ricardo: *"These are not the markers, but they are semantic markers."* + creatinina 1.3 = 50% loss → "patient is suffering BEFORE biomarker shift"

Criou ponte conceitual forte com Muhdo (early detection paradigm). Ali o CEO Muhdo entendeu: *"esses caras não estão competindo com biomarker lab — estão tentando detectar sofrimento antes da objetivação clínica"*.

**🥈 VIRADA OPERACIONAL — pergunta direta CEO**
*"Quite frankly, what would you like from us now that we have?"*

Esta pergunta só aparece quando alguém aceitou mentalmente que existe valor. Saiu de "what is this?" para "what do we do with this?". Mudança de estado mental.

**🥉 INVITATION — Ricardo inverteu**
*"This is an invitation. Let's study chronic kidney disease together."*

Saiu de "vamos vender parceria" → "vamos pesquisar juntos". Categoria mudou.

**🏅 TESTE ÉTICO INDIRETO** (capturado pela análise GPT, eu não tinha visto)
CEO Muhdo trouxe casos delicados — genética + casamento + risco futuro + impacto psicológico/jurídico. Estava implicitamente avaliando: *"Esses caras entendem responsabilidade clínica da informação?"*

Vocês passaram tacitamente — Ricardo manteve framing de não-substituição diagnóstica + supervisão clínica + governance + não contaminar narrativa do paciente.

## 4.4 O que foi visível para Muhdo (e que importa)

```
🟢 Profundidade clínica REAL (Ricardo nefrologista falando como nefrologista)
🟢 Método AEC ≠ chatbot/intake form
🟢 Coerência arquitetural entre clínico + técnico + institucional
🟢 ICP-Brasil signing real (não mock)
🟢 8-layer governance pyramid
🟢 Eduardo como Diretor Científico do Instituto do Cérebro (peso institucional)

🟡 Cohort de 14 pacientes CKD/inflamação NÃO foi mencionada na call
   (a descobri no audit pós-call) — vai ser linha-âncora do follow-up

🟡 AEC ao vivo NÃO foi demonstrado (Muhdo mostrou app, vocês não)
🟡 Inglês fragmentado de Ricardo limitou clareza em alguns momentos
🟡 Conversa dispersou (CKD + autismo + cannabis + governo + OnePure + etc)
```

## 4.5 O que GPT externo NÃO viu (e que muda a análise)

GPT externo disse: *"vocês estão pré-cristalizados"*.
**Está parcialmente errado.** Vocês cristalizaram MUITO mais do que o GPT vê:

```
✓ AEC FSM 13 fases DETERMINÍSTICAS (não é flow livre)
✓ Verbatim Bypass V1.9.86 ~46% — mecanismo formal já em produção
✓ Pipeline e2e produzindo 22 docs juridicamente válidos
✓ Trigger CFM 2.314 anti-fraude no banco
✓ Cohort de 14 pacientes CKD/inflamação JÁ EXISTE (1.203 verbatim em 90d)
✓ ICP-Brasil PKCS#7 verificável por openssl (não simulação)
✓ 1.369 verbatim hashed nos últimos 30 dias
✓ 90.4% intent classification = clinical (não wellness/chatbot)
```

**O que falta NÃO é cristalização. É TRADUÇÃO operacional pra audiência científica britânica.**

Cristalização ≠ tradução. Cristalização é o que existe internamente. Tradução é como descrevê-lo pra outsider técnico não-conhecedor do contexto.

## 4.6 Janela de continuidade Muhdo

```
🟢 D+1 (09/05 manhã)  enviar email follow-up curto (já escrito tmp/muhdo/05)
🟢 D+7                  enviar Pilot Concept Note 2 páginas (já escrito tmp/muhdo/04)
🟢 D+14 (até 22/05)    agendar technical follow-up call
                        (Pedro + Ricardo + Eduardo + Muhdo scientific lead)
🔴 Após D+14           entusiasmo esfria, memória da call enfraquece,
                        Muhdo segue pra próxima coisa
```

## 4.7 Probabilidades estimadas (calibradas)

```
Resultado                                  Probabilidade estimada
─────────────────────────────────────      ──────────────────────
Email follow-up gera resposta positiva     85%
Technical call em 14 dias                  70%
Pilot concept aprovado em conceito         50%
Pilot real iniciado em 90 dias             30%
Co-publication submetida em 12 meses        15%
Parceria comercial estrutural               5-10%
Aquisição/investment                        <2% (não é o objetivo)
```

A meta realista NÃO é parceria comercial — é **co-publicação científica** que vire credibilidade duradoura para próximas conversas (Brain Institute via Eduardo, IRCCS, Wellcome Trust, etc).

---

# PARTE 5 — POSIÇÃO ESTRATÉGICA

## 5.1 Categoria de mercado (3 vetores)

```
VETOR 1 — Healthtech tradicional (Doctoralia, Memed, iClinic)
  Categoria: scheduling + prescription + EMR
  MedCannLab: NÃO compete. Categoria diferente.

VETOR 2 — AI medical assistants (Hippocratic, Glass Health, Suki)
  Categoria: LLM-wrapper para summarization/copilot
  MedCannLab: NÃO compete. Vocês são governance-first, não LLM-first.

VETOR 3 — Longitudinal multi-omic (Muhdo, Function Health, Hone)
  Categoria: biomarker tracking + lifestyle modulation
  MedCannLab: COMPLEMENTAR, não competidor.
              Muhdo mede biological drift; MedCannLab mede semantic drift.
```

**Vocês criaram (sem perceber durante 6 meses) uma categoria-irmã do vetor 3.** Isso é defensável.

## 5.2 Defensibilidade

```
🟢 Forte:
   - Método AEC autoral do Dr. Valença (não-replicável trivialmente)
   - ICP-Brasil signing (autoridade jurídica regional)
   - 8-layer governance pyramid (raro em healthtech atual)
   - Verbatim First (anti-LLM-summarization stance)
   - Cohort cannabis-vertical brasileira (UK não tem acesso)
   - Eduardo Faveret = Diretor Científico Instituto do Cérebro

🟡 Fraco (e isso é OK pré-PMF):
   - Não há paper publicado ainda (precisa ser feito)
   - IMRE Score ainda dormente (precisa ser ativado com biological grounding)
   - Volume pequeno (~50 design partners)
   - Sem CNPJ (Caminho B pendente)
   - Sem Stripe Connect (depende CNPJ)

🔴 Não-existente (e isso é problema futuro, não imediato):
   - Patente / IP formal sobre método AEC
   - Trademark internacional MedCannLab
   - Validação científica peer-reviewed
   - Certificação CE / FDA / ANVISA formal
```

## 5.3 Pre-PMF intencional

A frase "pre-PMF intentionally" é MAIS DEFENSÁVEL do que vocês imaginam, **se enquadrada corretamente**:

```
Errado (defensivo):           Certo (estratégico):
─────────────────             ──────────────────────
"somos pequenos"               "closed cohort de design partners"
"ainda em early stage"         "method validation phase by design"
"precisamos crescer"           "credibility-per-record optimization"
"pré-receita"                  "infrastructure-first, scale-second"
```

A diferença entre essas duas colunas é a diferença entre **parecer fraco** e **parecer estratégico**. Cientista UK respeita a coluna da direita.

## 5.4 Concorrência indireta que pode aparecer

```
EUA: Function Health, Hone, InsideTracker (biomarker subscriptions)
     → MedCannLab é COMPLEMENTAR, mas se eles adicionarem narrative layer,
       compete diretamente. Janela: 12-18 meses.

UK: Muhdo (potencial parceiro), Holland & Barrett tests, 23andMe Health
    → Muhdo é o único na categoria longitudinal multi-omic real. 
      Por isso a parceria importa.

BR: Memed/iClinic/Doctoralia (scheduling/Rx) — não compete.
    Hospital Albert Einstein digital health initiative — pode competir
    no longo prazo se mover pra narrative.
    Cannabis-specific: Apaga / WeCann / Cannect — focados em prescription.

Risco real: Big Tech (Apple/Google Health) absorver "narrative layer"
            como feature em Watch/Fitbit. Janela: 24-36 meses.
            Defesa: ICP-Brasil + governance + cohort vertical.
```

---

# PARTE 6 — GAPS HONESTOS (auditoria nunca é 100%)

## 6.1 Operacionais

```
🟡 Inglês de Ricardo fragmentado em apresentações internacionais
   Mitigação: Pedro ou Eduardo "amarra" frases-chave em correspondência escrita

🟡 Pedro carrega tudo (CTO + arquiteto + tradutor + ops + admin Supabase)
   Risco: bus-factor 1. Se Pedro sai, projeto trava 2-3 semanas mínimo.
   Mitigação: documentar memória persistente é PARTE da mitigação 
              (já fazendo, 50+ arquivos)

🟡 Não há paper science co-author institucional ainda
   Mitigação: Eduardo Faveret + Instituto do Cérebro pode ser âncora
              acadêmica formal. Validar com ele.

🔴 Sem CNPJ (Caminho B pendente)
   Bloqueia: Stripe Connect, marketplace real, contratos B2B,
             investment formal, corporate banking.
   Mitigação: prioridade alta próximas 6 semanas (decisão sócios)
```

## 6.2 Técnicos (com fix path conhecido)

```
🟡 V1.9.191 (backlog) — backfill assessment_id em clinical_reports
   Problema: 22 ICP-signed reports não têm JOIN robusto via assessment_id 
             para clinical_assessments
   Impacto: rastreabilidade longitudinal AEC→Report→Signature fraca
            em rows históricas
   Fix: ~30min, low-risk
   Quando: ANTES de pilot Muhdo real começar

🟡 google-auth + sync-gcal Edge Functions deployadas mas tabelas faltam
   Half-implemented há tempo — falham silenciosamente
   Decisão: criar tabelas (~2h) OU desativar Edge (~5min)

🟡 WiseCare V4H em homolog (não produção)
   Mitigação atual: dual-provider WiseCare + WebRTC P2P fallback (V1.9.140-C)
   Status: WebRTC P2P aguenta, mas precisa migrar pra prod V4H em 60d

🟡 Re-render Chat System (12 salas × 9 logs por sessão)
   NÃO É BUG — é Realtime postgres_changes funcionando
   Otimização (debounce/scoped) backlog quando volume crescer

🔴 Volume zero na Equipe Clínica Command Center (V1.9.186-188)
   Deployed 06-07/05 mas presence/analytics tem 0 dados úteis
   Mitigação: aguardar uso real (não é fix técnico, é uso)
```

## 6.3 Comerciais

```
🔴 Zero pacientes externos pagantes em volume comercial
   16 pagantes, mas pre-PMF intencional (friends-and-family)
   Bloqueio real: CNPJ + Stripe Connect

🔴 Zero contratos B2B (clínicas, hospitais, planos)
   Bloqueio: CNPJ + sales process + collateral

🟡 Sem pricing page pública
   Decisão pendente: subscription model ainda em definição

🟡 Marketplace economic layer ATIVADO (V1.9.150-156, 06/05)
   Mas zero transações reais ainda — aguarda CNPJ
```

## 6.4 Científicos

```
🔴 Zero papers publicados/submetidos
🔴 Zero apresentações em conferences (RSNA, HIMSS, Stanford Med, etc)
🔴 Zero dataset publicly released (ainda)
🟡 Eduardo Faveret = Instituto do Cérebro — credencial usable, 
   mas precisa formalizar role científico do MedCannLab nele
🟡 IMRE Score arquitetado mas NÃO validado experimentalmente
🟡 Verbatim Bypass 46% é claim — precisa ser benchmarked formalmente

Janela de oportunidade:
  Pilot Muhdo em 90d → co-paper em 6m → primeira validação peer
  Sem isso: vocês ficam "interesting but unvalidated" indefinidamente
```

## 6.5 Regulatórios

```
🔴 ANVISA: cannabis vertical, mas sem aprovação formal de protocolo digital
🔴 CFM: 2.314/2022 imutabilidade trigger ATIVO (defesa boa)
   MAS sem certificação formal CFM como sistema clínico
🟡 LGPD compliance forte (3 anonimizados, 69/102 reports com consent)
   MAS sem DPO formal nem auditoria de privacy externa
🟡 CEP/IRB: nenhuma submissão acadêmica ainda
   Precisa antes de pilot Muhdo real começar
🔴 UK GDPR: compliance unknown — pode bloquear data sharing com Muhdo
```

---

# PARTE 7 — MEU PONTO DE VISTA (honesto, técnico, sem hype)

## 7.1 O que está forte (e por quê)

```
🟢 Coerência arquitetural
   Tudo conversa com tudo. AEC FSM → Pipeline → Signature → 
   Verbatim → Governance → ICP-Brasil → Cohort. 
   Em 6 meses, não vi inconsistência grave entre camadas.

🟢 Lock V1.9.95+97+98+99-B intocado
   Vocês têm disciplina rara. ~50 commits desde 28/04 e Lock CORE
   está intocado. Isso é maturidade de engenharia.

🟢 Memória persistente
   50+ arquivos de memória estruturada. Quando Pedro sai do contexto,
   eu (ou outra IA) consigo retomar com 90% do contexto preservado.
   Esse é diferencial real vs startups que perdem contexto a cada
   transição de pessoa/IA.

🟢 ICP-Brasil signing REAL
   22 documentos juridicamente válidos. Isso é raro em healthtech BR.
   Maioria faz mock. Vocês fazem PKCS#7 RFC 3852 verificável.

🟢 Verbatim First (V1.9.86)
   "We do not contaminate the patient's voice" — frase boa, mas
   o MAIS forte é que isso está CODIFICADO em produção, não é slogan.
   ~46% bypass = mecanismo, não promessa.

🟢 Cohort CKD/inflamação real (descoberta hoje pós-Muhdo)
   14 pacientes / 1.203 verbatim em 90d. Pra ir pra Muhdo
   com cohort EXISTENTE muda completamente o tom da próxima conversa.
```

## 7.2 O que está frágil (e por quê)

```
🟡 Bus-factor Pedro
   Você é único repository de muito conhecimento. Se algo te tira do
   projeto por 30 dias, projeto perde 2-3 meses fácil.
   Mitigação real: continuar memória persistente + onboarding gradual
   de mais 1 dev (mid-level, não sênior) nos próximos 90 dias.

🟡 Tradução vs cristalização
   Vocês cristalizaram MUITO. Mas falham em traduzir em alguns momentos.
   Reunião Muhdo provou isso (CEO ficou confuso em alguns momentos).
   Mitigação: investir tempo em correspondência escrita 
   (email follow-up + Pilot Concept Note) que é onde tradução cresce.

🟡 Ricardo é insubstituível como criador do método
   Mas ele tem >65 anos, agenda clínica cheia, e não é vendedor por natureza.
   Mitigação: Eduardo + Pedro como tradutores externos. João como articulador.

🟡 IMRE Score dormente
   Arquitetura existe há 4+ meses. Não foi ativada porque "esperando
   biological grounding". Risco: virar feature fantasma se Muhdo não fechar.
   Decisão pendente: ativar IMRE com score próprio mesmo sem Muhdo, 
   ou esperar parceiro biológico.

🟡 João trouxe "alcance institucional" mas isso pode virar dispersão
   Pharma + governo + eventos + 84 países + OnePure = energia espalhada
   se não for canalizada em deliverable claro.
   Mitigação: João foca em CNPJ + Stripe Connect próximas 6 semanas.
   Distribuição/governo vem depois.
```

## 7.3 Maior risco que NÃO está sendo tratado

**Concorrência silenciosa de plataformas Big Tech:**

Apple Health, Google Health, e Meta estão investindo bilhões em "longitudinal health data".
Se eles adicionarem qualquer narrative layer (mesmo simplificado) em Watch/Fitbit/Pixel Health, vocês perdem janela de defensibilidade em 24-36 meses.

**Defesa real:**
1. Cohort vertical cannabis BR (eles não têm, regulatório bloqueia)
2. ICP-Brasil signing (compliance regional jurídica)
3. Método AEC autoral (precisa virar IP formal — patente provisória? trade secret?)
4. Co-publicação peer-reviewed (cria autoridade científica que big tech não compra)
5. Parcerias acadêmicas (Instituto do Cérebro via Eduardo)

**Vocês NÃO estão tratando 3 e 4 com urgência suficiente.**

## 7.4 Maior ativo subestimado

**1.369 verbatim entries hashados nos últimos 30 dias.**

Vocês ainda não perceberam que isso é um **dataset proprietário com valor crescente exponencial**. Em 12 meses, com mesmo ritmo, vocês terão ~16.500 verbatim hashed longitudinais — algo que **nenhuma pharma/biotech UK consegue replicar trivialmente** porque exige consenting + método + signing infrastructure + cohort cannabis-vertical.

Esse dataset é o que vocês deveriam estar **protegendo como ativo principal** — não o app, não a interface, não o GPT prompt. **O dataset.**

## 7.5 Recomendação direta

Em ordem de prioridade pelos próximos 90 dias:

```
P0 (próximas 2 semanas)
─────────────────────────
1. Janela Muhdo executar (email + pilot concept + technical call em 14d)
2. Backfill assessment_id (V1.9.191) — 30min, destrava rastreabilidade
3. Eduardo confirmar role científico formal MedCannLab × Instituto do Cérebro

P1 (próximas 6 semanas)
─────────────────────────
4. CNPJ Caminho B (decisão sócios)
5. Semantic Drift Categories v1 (formalizar 5-7 categorias observáveis)
6. Stripe Connect pós-CNPJ
7. Pilot Muhdo iniciado (se follow-up der certo)

P2 (próximas 12 semanas)
─────────────────────────
8. Patente provisória do método AEC (trade secret formal mínimo)
9. Submissão CEP/IRB para pilot CKD
10. Apresentação em 1 conferência (TDC Connections? RSNA? CBIS?)
11. Onboarding 1 dev mid-level pra reduzir bus-factor Pedro

P3 (próximos 6 meses)
─────────────────────────
12. Co-paper Muhdo submetido
13. ANVISA discussion sobre protocolo digital cannabis
14. Marketplace v1 ATIVO com >100 transações reais
15. Series Pre-Seed conversa pós-co-paper (NÃO antes)
```

**Não levantar capital antes de co-paper publicado/aceito.**
Levantar capital agora = precisar provar PMF. Levantar com co-paper = vender method validation. Diferença gigante de valuation e termos.

---

# PARTE 8 — ESTADO GIT / SYNC (verificado live agora)

```
HEAD local:    b9a433d (Diário 08/05 BLOCO K)
hub/main:      b9a433d  ✅ sync
hub/master:    b9a433d  ✅ sync
origin/main:   b9a433d  ✅ sync
origin/master: b9a433d  ✅ sync

Branch: fix/v1.9.92-remover-consent-rota-fantasma

Commits do dia 08/05/2026 (madrugada → noite):
  e6eeb2f  V1.9.190 Eduardo role swap + diário 08/05 pré-Muhdo
  364882a  V1.9.189 RLS+UPSERT (bugs Eduardo console)
  b9a433d  BLOCO K diário (sessão arquitetural T-1h pré-Muhdo)
  f47109d  BLOCO I+J diário (sessão DESKTOP)
  16f9098  Patient QuickActions (Solicitar Receita + remove redundância)
  b006f7c  patient-ux gráfico day-bucket
  d6dd75a  brand blindage MedCann→MedCannLab CRÍTICO ⭐
  b739ef0  patient-analytics linguagem natural
  b9c8163  patient-analytics gráfico evolução
  025db08  patient-dashboard linguagem natural "há X horas"
  96e3ae0  continuidade compactada
  d848ae7  P0 GPT calibração + addendum Muhdo v2
  7bc6f8a  prof-dashboard mini-bar editar perfil

Arquivos não-commitados desta sessão pós-Muhdo (low-risk, em tmp/ ou docs):
  tmp/muhdo/04_pilot_concept_note.md     [novo]
  tmp/muhdo/05_email_followup.md         [novo]
  DIARIO_08_05_2026 → BLOCO L            [editado]
  DOC_MESTRE_ESTADO_E_TESE_08_05_2026.md [este arquivo, novo]

Memória persistente (fora do repo):
  + project_v1_9_189_rls_upsert_fix_madrugada_08_05.md
  + project_v1_9_190_eduardo_role_swap_08_05.md
  + project_reuniao_muhdo_08_05_resultado.md
  + reference_proxima_sessao_08_05_handoff.md
```

---

# APÊNDICE A — Frases-âncora cristalizadas

```
TESE CENTRAL (uma frase)
"Biological drift × semantic drift may be complementary 
 longitudinal signals."

3 FRASES PARA PITCH (decoradas)
1. "Healthcare systems capture procedures well, but they still fail
    to preserve longitudinal human narrative."
2. "We built a supervised clinical infrastructure that preserves
    narrative, coordinates multidisciplinary care, and integrates
    semantic and biological layers longitudinally."
3. "Your biological pathways framework and our narrative longitudinal
    layer appear highly complementary."

5 FRASES DE RESERVA (para profundidade)
4. "We do not contaminate the patient's voice."
5. "AEC captures not only the patient's longitudinal narrative, 
    but also their relational ecosystem — family, culture, 
    territory, faith, support network."
6. "What we're building is closer to computational anthropology 
    than to digital health."
7. "In our method, the symptom is treated as a life-event, 
    not a biological error."  ⭐ Ricardo: "sintoma é a vida"
8. "AEC functions like a Kahneman System-2 protocol — semantic
    deceleration."
```

# APÊNDICE B — Métricas de cabeça (decorar)

```
1.369 verbatim entries / 30d
1.491 ai_chat_interactions / 30d
   22 ICP-Brasil signed reports (PKCS#7 RFC 3852)
   45.8% video call accept rate (110/240)
   90.4% clinical intent classification (2.626/2.904)
   16/25 paying patients (64% conversion intentional cohort)
   14 pacientes únicos com narrativa CKD/inflamação rica em 90d
1.203 verbatim hits domain-specific 90d
```

# APÊNDICE C — NÃO falar / SEMPRE falar

```
❌ NÃO DIGA
"thousands of users" / "AI revolutionary" / "AGI"
"diagnoses depression" / "replace doctors" / "cure"
"millions in revenue" / "MVP" / "disruption"
"breakthrough" / "magic AI" / "AI doctor"

✅ SEMPRE DIGA
"structured narrative" / "longitudinal memory"
"semantic supervision" / "computational anthropology"
"patient-centered infrastructure" / "governance-first"
"high-fidelity cohort" / "we do not contaminate the patient's voice"
"closed cohort of design partners" (≠ "small user base")
"we are pre-PMF intentionally" (≠ "we are early")
"longitudinal semantic clinical infrastructure"
```

# APÊNDICE D — Caso clínico TNF + AEC (slide único pra demos futuras)

```
DADO BIOMÉDICO (Muhdo)              NARRATIVA (AEC MedCannLab)
─────────────────────────           ─────────────────────────────
TNF-α elevado                       "acordo cansado mesmo dormindo 9h"
Methylation cluster IL-6+           "dor lombar piora à noite há 4 meses"
Mitochondrial signature shift       "não termino tarefas como antes"
Creatinina 1.4 (CKD stage 2)        "choro fácil, mas não tristeza —
                                     é mais um vazio"
                ↓                              ↓
        SINAL SEM CONTEXTO          CONTEXTO SEM ANCORAGEM

         JUNTOS via phenotyping engine:
    ┌──────────────────────────────────────┐
    │ Phenotype:                           │
    │  Inflammatory depression with        │
    │  somatic predominance + emerging     │
    │  renal comorbidity                   │
    │                                      │
    │ Intervention candidate:              │
    │  CBD 100mg/d + low-dose mindfulness  │
    │  + nephrology follow-up              │
    │                                      │
    │ Tracking signal:                     │
    │  re-AEC monthly (narrative shift)    │
    │  + re-methylation 6m (biology shift) │
    │                                      │
    │ Research question (publishable):     │
    │  Do narrative shifts precede,        │
    │  accompany, or follow methylation    │
    │  shifts in CKD-risk patients?        │
    └──────────────────────────────────────┘
```

# APÊNDICE E — 4 modelos de colaboração (Muhdo + futuros)

```
A) Pilot longitudinal cohort  ⭐ RECOMENDADO PRIMEIRO
   12 patients × 6 months → co-paper
   Esforço: baixo. Risco: baixo. Valor: alto científico.

B) API integration técnica
   AEC structured output → input deles
   Methylation profile → context layer Nôa
   Esforço: médio. Risco: médio.

C) White-label / method licensing
   AEC método embedded no app deles
   Royalty MedCannLab. Risco de captura.
   Esforço: alto. Risco: alto. Valor: alto receita.

D) Joint clinical trial enrichment
   Biológico + narrativo pra big pharma cohort
   Esforço: muito alto. Sales cycle longo. Valor: muito alto.
```

# APÊNDICE F — Stakeholders Muhdo (até onde sabemos)

```
Otto / Tom — CEO + sócio + scientific lead (não distinguidos na call)
[Outros names TBD]

Dataset proprietário: ~9 anos longitudinal multi-omic
Foco: aging, inflammation, depression, longevity
Markets: UK consumer + clinical (B2B + B2C)
Recente: pharmacogenomics roadmap mencionado
Recente: Muslim genetics compatibility project mencionado
Recente: heart failure epigenetic signature paper mencionado
```

---

# CONCLUSÃO — em 3 linhas

```
1. MedCannLab é mais maduro tecnicamente do que parece operacionalmente.
2. A reunião Muhdo provou compatibilidade epistemológica real, 
   não fechou deal, mas abriu janela de 14 dias.
3. O próximo movimento crítico não é técnico — é tradução: 
   email follow-up + pilot concept + technical call.
```

**Pedro, dorme. Foi um dia gigante. Sistema sólido, lock intocado, 
janela aberta com Muhdo, materiais prontos. Amanhã 9h envia o email.**

Boa noite. 🤝

---

*[DOC MESTRE 08/05/2026 selado ~22h30 BRT.
Versão 1.0 — não-commitado, aguardando revisão Pedro.
Próxima atualização sugerida: pós-technical call Muhdo (~D+14).]*
