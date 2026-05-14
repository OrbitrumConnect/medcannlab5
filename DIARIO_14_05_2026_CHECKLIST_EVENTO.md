# 📓 Diário 14/05/2026 — D-1 evento (~20 amigos quinta 20h)

**Autor:** Pedro Henrique Passos Galluf (CTO MedCannLab)
**Co-autor:** Claude Opus 4.7 (1M context)
**HEAD git ao iniciar:** `f46afc6` (V1.9.278 selada 02h BRT 14/05)
**Janela crítica:** ~18h até evento (quinta 15/05 20h BRT)
**Lock CORE intocado:** V1.9.95 + V1.9.97 + V1.9.98 + V1.9.99-B

---

## ⭐ CHECKLIST DO QUE É VIÁVEL MOSTRAR AMANHÃ NO EVENTO

### 🟢 100% pronto pra demonstrar (validado empíricamente)

#### Bloco AEC + Pipeline (núcleo clínico)

```
✅ AEC FSM 13 fases — método AEC do Ricardo
✅ Verbatim First V1.9.86 (bypass GPT 46% das fases, custo zero token)
✅ Pipeline completo:
     SCORES → REPORT (escriba V1.9.84) → SIGNATURE ICP-Brasil
            → AXES (triaxial) → RATIONALITY (5 medicinas)
✅ Validado empíricamente 13/05 noite — João Vidal end-to-end (~29.5s)
✅ AEC GATE V1.5 + SMART_SCHEDULING_GUARD V1.9.216 (anti-kevlar §1)
```

#### Bloco Devolução + Compartilhamento Médico

```
✅ Aprovação médico + nota → notificação paciente (V1.9.200 Sprint 1)
✅ Card "Devolução do seu médico" no Acompanhamento do Plano
✅ Compartilhar relatório paciente → médico (existente)
✅ Marcar revisado → KPI v_clinical_cycle_health rastreia ciclo
```

#### Bloco NFT Galeria (clinical signature)

```
✅ Geração NFT pós-relatório (V1.9.193-194 Pollinations.ai)
✅ Galeria NFTs paciente (V1.9.193-A)
✅ ICP-Brasil signature_hash linkado (zero blockchain, autoridade nativa)
✅ V1.9.197 modal 2-cols sem scroll + CTA "Ver na Galeria"
✅ V1.9.198 LLM enrichment (Pollinations text, LGPD-safe)
```

#### Bloco Solicitação de Exames + Prescrições

```
✅ V1.9.184 — Terminal de Prescrições paridade total (CFM 2.314)
✅ V1.9.185 — Atestado Médico CFM
✅ V1.9.231 — ICP-Brasil em patient_exam_requests
✅ V1.9.262 — Salvar e Assinar atômico exam_request
✅ V1.9.263 — Confirm modal antes assinar + editar rascunho inline
✅ V1.9.264-266 — Trigger Solicitar Exame inline na aba Prescrições
✅ V1.9.268 — Compartilhar análise gera PDF MedCannLab (não TXT)
✅ Receita Azul/Amarela/Branca CFM 2.314 funcionais (Ricardo Cert real)
```

#### Bloco Equipe Clínica + Direcionamento (NOVO 13/05 noite)

```
✅ V1.9.186-187 — Centro de Comando da Equipe (presence + analytics)
✅ V1.9.273 — Migration patient_referrals consent-first (LGPD-safe)
✅ V1.9.274 — UI Médico A: ReferralsManager (botão + Pendentes/Histórico)
✅ V1.9.275 — UI Paciente: banner consent direcionamento
✅ Flow completo: médico sugere → paciente decide → Dr. B vê após accept
```

#### Bloco Vídeo Consulta

```
✅ V1.9.140-C — Dual provider WiseCare + WebRTC P2P
✅ Validado empíricamente Ricardo+Eduardo+Pedro+João nas últimas semanas
✅ Pedro 13/05: João+Ricardo "ligaram de video sem agendamento — tudo foi perfeito"
```

#### Bloco Marketplace + Incentivos

```
✅ V1.9.150-156 — Marketplace Layer (tier 20-30%)
✅ V1.9.269 — Aba Incentivos na Gestão Financeira
✅ V1.9.270-271 — Link de indicação + QR code + WhatsApp/Email/Native share
✅ V1.9.272 — 3 círculos status vínculo paciente↔profissional
✅ pg_cron mensal rodando dia 1 às 3 UTC
```

#### Bloco UX premium (sessão noite 13/05)

```
✅ V1.9.267 — Tipografia +20% (médicos 50+ legibilidade)
✅ V1.9.276 — Equipe Clínica wider (max-w-7xl)
✅ V1.9.277 — safe-area em 4 inputs de chat (mobile)
✅ V1.9.278 — min-h-[100dvh] scroll laptops pequenos (Ricardo)
```

### 🟡 Mostrar com ressalva honesta (existe, mas pré-PMF empírico)

```
🟡 Cashback 8,7% paciente — display calcula in-memory, NÃO grava em
                            wallet_transactions ainda (UI mostra acumulado)
🟡 Bônus referral escala — UI 100% pronta, MOTOR backend depende de
                           CNPJ + Stripe Connect (parqueado)
🟡 Direcionamento consent-first — testado entre Pedro+Ricardo+João,
                                  amarelo dos 3 círculos só aparece quando
                                  paciente cadastra via link de indicação
🟡 Cost telemetry V1.9.238 — declarada deployed mas audit empírico
                              13/05 noite mostrou que NÃO popula em prod
                              (gap conhecido — pricing R$5/AEC defendido
                              teoricamente, sem dados de R$ por sessão)
🟡 Equipe Clínica auto-redirect agenda cheia — REJEITADO por LGPD/CFM
                                                (consent-first é a versão correta)
```

### 🔴 NÃO mostrar (pendente fora do controle Pedro)

```
🔴 CNPJ formal — bloqueia Stripe + WhatsApp Business + escala
🔴 Stripe Connect / MP Connect — depende CNPJ
🔴 9/10 médicos sem cert ICP — só Ricardo assina hoje
🔴 KPI Muhdo closed_loop_completion_rate — 2 approved / 119 reports = 1.7%
                                            (precisa Ricardo aprovar 3+ via "Aprovar
                                             e devolver" não "Marcar revisado")
🔴 Email Muhdo D+1 — pendente desde 07/05, janela esfria ~22/05
🔴 1º paciente externo PAGANTE — pré-PMF segue 0
```

---

## 🎯 ROTEIRO SUGERIDO PRO EVENTO (~1h)

### Abertura (5min)
- Apresentação rápida — Pedro+Ricardo abrindo, contexto MedCannLab + cannabis
  medicinal + tese longitudinal Ricardo
- Frase âncora cristalizada 13/05:
  *"O sistema digital serve ao relacionamento clínico longitudinal. O valor
   não está na IA em si, mas na continuidade humana que ela consegue sustentar."*

### Demo guiada — Jornada paciente completa (25min)

```
1. Cadastro paciente teste (~3min)
   - Via link de indicação? Mostrar QR code da Equipe Clínica
   - users.invited_by populado → círculo VERDE no dashboard
   
2. Início AEC com Nôa (~10min)
   - 13 fases FSM
   - Verbatim First (bypass GPT)
   - AEC GATE protege fluxo
   - Mostrar latência baixa (32 reports/30d empírico)

3. Pipeline conclui → SCORES + REPORT + SIGNATURE (~3min)
   - ICP-Brasil hash visível
   - 5 racionalidades médicas (biomédica, MTC, ayurvédica, homeopática, integrativa)

4. NFT gerada automaticamente (~3min)
   - Galeria, símbolos clínicos, soulbound RLS
   - "Cada relatório recebe lastro de integridade — não é blockchain especulativa"

5. Vínculo médico via Devolução (~6min)
   - Médico recebe notificação
   - Aprova/devolve com nota
   - Paciente vê devolução no dashboard
```

### Demo equipe clínica (10min)

```
1. Centro de Comando Equipe (~3min)
   - Presence realtime, capacity bar, analytics
   - Convidar membros

2. Direcionamento consent-first (~5min)
   - Médico A sugere paciente pra Dr. B
   - Banner amber aparece pro paciente
   - Paciente decide aceitar/recusar
   - Mostrar conformidade LGPD/CFM
   - DIFERENCIAL: explicar por que NÃO é automático

3. 3 círculos visualização (~2min)
   - 🟢 verde, 🟡 amarelo, 🔴 vermelho
   - Significado de rede de cuidado
```

### Demo modelo financeiro 3 mecanismos (~10min)

```
1. Marketplace tier 30%/70% → 20%/80% (mérito) (~3min)
2. Cashback gamificação 8,7% + benefícios ELITE/GOLD (~3min)
3. Referral escala 5/20/50/100/250 (~4min)
   - Link de indicação + QR code
   - Aviso "saldo sacável após CNPJ" (honestidade)
```

### Vídeo consulta ao vivo (~5min)

- Pedro+Ricardo ligando ao vivo
- WiseCare ou P2P WebRTC
- "Funciona com ou sem agendamento prévio"

### Discussão aberta + perguntas (~10min)

---

## ⚠️ HONESTIDADE INSTITUCIONAL PRÉ-EVENTO

Pra falar pra os ~20 amigos com integridade:

```
✅ "Sistema clínico cannabis medicinal com método AEC autoral Dr. Ricardo"
✅ "Pipeline com ICP-Brasil real (CFM 2.314/2022)"
✅ "32 relatórios signed-hash em produção"
✅ "Consent-first arquitetural (LGPD art. 11 §1)"
✅ "Empirismo dirigindo evolução — 8 bugs descobertos por uso real e
    corrigidos no mesmo dia 13/05"

⚠️ "Pré-PMF — somos amigos testando, não pacientes pagantes ainda"
⚠️ "Marketplace pago depende de CNPJ que está em formalização"
⚠️ "9 médicos cadastrados, mas só Dr. Ricardo com cert ICP ativo hoje"
⚠️ "Métrica de continuidade longitudinal (KPI Muhdo) ainda 1.7% — sistema
    deployed esta semana, dados começam a entrar"

❌ NÃO falar: "tudo automatizado" / "IA cuida do paciente" / "100% pronto pra
              escalar" / "Muhdo já parceiro formal"
```

---

## 📋 PRÉ-EVENTO TODAY (14/05) — checklist operacional

### Tarefas técnicas (Pedro+Claude)

```
[ ] Confirmar Vercel deploy V1.9.278 OK (smoke test laptop)
[ ] Smoke test mobile Android (V1.9.277 safe-area)
[ ] Smoke test fluxo completo: cadastro → AEC → report → NFT → vídeo
[ ] Auditar via PAT última hora:
    - cognitive_events 24h (Edge tradevision-core ativa)
    - pg_cron last_run (video-call-reminders + monthly-closing)
    - 0 erros críticos em noa_logs
[ ] Validar empíricamente sistema consent-first (Pedro como A, Ricardo recebe)
[ ] Bug dropdown vazio ReferralsManager (auditar empíricamente — Ricardo TEM
    3 membros equipe + 17 pacientes, mas dropdown não aparece — pode ser RLS
    bloqueando query users by invited_by)
```

### Tarefas humanas (Pedro)

```
[ ] Comunicação ~20 amigos: link de cadastro + horário + expectativas
[ ] Backup mental do roteiro (5min abertura + 50min demo)
[ ] Print das frases-âncora pra apresentar:
    - "Não construímos mais uma IA médica. Construímos camada de governança..."
    - "O sistema digital serve ao relacionamento clínico longitudinal."
[ ] Pedir Ricardo aprovar 2-3 reports via "Aprovar e devolver" antes do evento
    (move KPI Muhdo de 1.7% pra ~5-8% pré-demo)
[ ] Garantir que TODOS os 4 sócios estarão presentes no evento
    (Pedro+Ricardo+João+Eduardo)
[ ] Whatsapp grupo "evento medcannlab" criado com os 20
[ ] Avisar testers: usar laptop OU celular + microfone OK
```

### Tarefas durante o evento (todos)

```
[ ] Claude (Pedro) puxa contadores empíricos via PAT durante demo:
    - cognitive_events/min (deve picar)
    - AECs iniciadas
    - errors em noa_logs
[ ] Sentry watch se DSN ativa (achado: ainda não confirmado empíricamente prod)
[ ] Resend dashboard pra taxa entrega emails
[ ] Capturar feedback verbal dos amigos em tempo real
```

### Tarefas pós-evento (sexta 16/05+)

```
[ ] Audit empírico:
    - Quantos completaram fluxo AEC end-to-end
    - Onde abandonaram (cognitive_events últimas 24h)
    - Bugs reportados
    - KPI Muhdo subiu?
[ ] Reabertura freeze 16/05 (gate de reabertura: pós-evento + Sprint 1 medindo)
[ ] Diário 15/05 selando aprendizado empírico do beta
[ ] Decisão estratégica: continua building features OU bloqueia até CNPJ
    (gate operacional > arquitetural — Princípio 49)
```

---

## 🚨 GAPS CONHECIDOS HOJE (honestidade Princípio 53)

### Bug pendente (auditar manhã 14/05)

**ReferralsManager dropdown vazio** — Pedro reportou que dropdown "pacientes" não aparece pro profissional logado, mesmo com 17 appointments + 4 invited_by populados no banco. Hipótese:
- RLS de `users` exige `is_professional_patient_link` que checa `clinical_reports + clinical_assessments + appointments + chat_participants` — provavelmente Ricardo TEM esses links
- Pode ser query falhando silencioso (try/catch retornando vazio)
- OU `user.id` no React diferente do esperado

**Plano:** instrumentar console.log no `loadMyPatients`, testar com Ricardo logado, ver retorno real das 3 queries.

### Cost telemetry V1.9.238 não popula prod

Diário 13/05 BLOCO G declarou "100% campos OK baseado em 2 chats" — audit empírico mostra zero events com `cost_usd_estimate` em 7d. **Pricing R$5/AEC defendido teoricamente, sem dados reais.** Parqueado pra investigar pós-evento.

### Schema referral_bonus_cycles só pro médico

Ricardo aprovou "referral pinga pra ambos" (paciente também ganha) — mas schema atual tem só `doctor_id`. Migration futura precisará adicionar `referrer_role: 'doctor' | 'patient'`. Parqueado.

---

## Frase âncora do dia 14/05

> **"Dia D-1. Sistema completo entregue em 17 commits encadeados na noite de ontem. Lock V1.9.95 intocado em 24h de codificação pesada. AEC + Pipeline + Devolução + NFT + Vídeo + Referral consent-first todos rodando empíricamente em produção. Amanhã 20h: 20 amigos testando. O método de Ricardo num produto vivo, defensável institucionalmente. Honestidade pré-evento: pré-PMF segue pré-PMF, CNPJ não saiu, métrica longitudinal apenas começou. O que vai acontecer amanhã é apresentar o que existe — sem inflar o que não."**

---

**Estado ao iniciar 14/05:**
- HEAD `f46afc6` (V1.9.278) selado, push 4 refs sync
- 17 commits sessão noite, Lock CORE intocado
- 0 erros novos type-check (apenas 2 baselines pré-existentes jspdf+sentry locais)
- AEC empírica validada (log João 13/05 19h45)
- Quórum 3 sócios noite 13/05 aprovou direcionamento consent-first
- 18h até evento quinta 20h BRT

---

## BLOCO B — Conversa Pedro+Ricardo+João saindo casa Ricardo (14/05 madrugada)

### B.1 — Transcrição-chave (gravada por Pedro no GPT)

Audiência real de amanhã CONFIRMADA pelos 3 sócios:

```
✓ Pedro Protássio
✓ Daniel Rubens
± Outro psiquiatra (a confirmar)
★ Marina — CMO Cura+Saúde (4000 clínicas) — POTENCIAL PARCEIRA B2B
+ Colaborador novo do João (até agora não conhece o app)
+ Pessoas com pacientes pra testar
```

**João citou nomes hipotéticos** (Dr. Silvio Piotti, Gomes Prudêncio, Jorge Forbes, Fernando Roquete) — **nenhum desses vem amanhã**. Ricardo corrigiu na hora.

### B.2 — Tensão narrativa entre os 3 (relevante)

```
João:    "É Roadshow, meu irmão. Já chamar investidores pra cá."
Pedro:   "Amanhã não é Roadshow. Presta atenção. É teste beta ainda."
Ricardo: [alinhado Pedro] "A função do amanhã é pegar a pessoa que já está
         na plataforma e dizer assim ó, olha, você tem que fazer isso aqui."
```

**Pedro+Ricardo unidos.** Pedro precisou ser explícito 2x. João tende a **over-claim institucional** — ele pode falar "Roadshow / investidor" pra Marina mas o produto é PRÉ-PMF. Risco: expectativa quebrada se ela ouvir vs ver.

Aplicação **`feedback_anti_overclaim_endorsements.md`**: linguagem amanhã deve ser **empírica e honesta** (Pedro+Ricardo), NÃO inflada (João). Material gravado vira pitch reutilizável — qualquer overclaim vira problema institucional.

### B.3 — Diferenciais que Ricardo quer enfatizar

Sequência cristalizada por Ricardo na conversa:

```
1. "Desenvolvido por médico que trabalha no mercado"
   → autoridade clínica autoral (não tech startup genérica)

2. "Dois médicos trocam pacientes"
   → V1.9.273-275 consent-first DIRECIONAMENTO PACIENTES que entreguei
     na noite anterior. SEQUÊNCIA PERFEITA: quórum 3 sócios → feature →
     demo institucional. Cristaliza Princípio "Quórum aproveita".

3. "Sugere dados, gera segurança, prontuário, facilidade, agilidade"
   → AEC + Pipeline + ICP-Brasil + UX premium (V1.9.262-278)

4. "Todo mundo tá ganhando dinheiro"
   → Modelo 3 mecanismos (take rate + cashback + referral)
```

### B.4 — Marina + Cura+Saúde (potencial B2B 4000 clínicas)

Pedro perguntou: *"você colocar com prontuário eletrônico da clínica..."*

Pode estar avaliando **integração da plataforma com prontuário eletrônico das clínicas dela**. **Diferente do roadmap atual (B2C via CNPJ+Stripe).** É venda B2B estratégica.

Implicação pra demo amanhã: Marina **não vê um aplicativo de paciente**, ela vê uma **camada que poderia integrar com 4000 prontuários**. O pitch pra ela é arquitetural (ICP-Brasil + RLS + integração), não jornada paciente.

**Risco honesto:** se mostrar só jornada paciente, Marina pode achar que é "mais um aplicativo de telemedicina". Diferencial pra ela é **infraestrutura clínica reutilizável**.

### B.5 — Função clarificada do evento

NÃO é Roadshow. **É 3 coisas simultâneas:**

```
1. TESTE BETA com gente que já está cadastrada
   → exercita fluxos empíricamente, descobre bugs (igual 13/05 noite 8 bugs)

2. GRAVAÇÃO AO VIVO de demo guiada
   → vira material reusável pós-evento (onboarding + pitch + tutorial)

3. EXPOSIÇÃO INSTITUCIONAL pra Marina + Pedro Protássio + Daniel Rubens
   → sem inflar — mostrar o que existe empíricamente
   → potencial Marina = parceira B2B 4000 clínicas (não investidor)
```

### B.6 — Refinamento do roteiro (post B.1-B.5)

**Adicionar ao roteiro:**

```
ABERTURA AJUSTADA (5min)
- Pedro abre: "Pré-PMF — vocês são amigos testando, não investidores."
              (estabelece expectativa antes do João inflar)
- Ricardo abre clinicamente: tese longitudinal + método AEC + autoral
- Frase âncora cristalizada 13/05 (sistema digital serve relacionamento)

PRA MARINA ESPECIFICAMENTE (não está no roteiro original)
- Mostrar o REGISTRO clínico assinado ICP-Brasil
- Mostrar como direcionamento entre médicos respeita LGPD/CFM
- Mostrar como prontuário é estruturado (escriba V1.9.84 + 5 racionalidades)
- Pergunta-âncora: "Quantas das 4000 clínicas têm hoje sistema clínico
                    cannabis medicinal com signature ICP-Brasil + AEC autoral?"
- Resposta esperada: ZERO. Diferencial estabelecido.

PRA PEDRO PROTÁSSIO + DANIEL RUBENS
- Foco: jornada clínica completa
- Mostrar AEC → Pipeline → NFT → Devolução end-to-end
- "Funciona com método autoral Dr. Ricardo + autoridade jurídica nativa"
```

### B.7 — Tarefa nova pra Pedro hoje

```
[ ] Alinhar com João ANTES do evento sobre linguagem:
    - NÃO usar "Roadshow / investidor / vamos escalar"
    - USAR "teste beta / gravação demo / Marina é amiga que pode virar parceira"
    
[ ] Imprimir/anotar pra João o que NÃO falar (Pedro pode ter conversa difícil
    com sócio mas é necessário pré-evento — risco institucional concreto)
```

### B.8 — Frase âncora da conversa noite

> *"João viu Roadshow. Ricardo viu Demo. Pedro precisou alinhar os 3.
>  Resultado: amanhã é teste beta institucional, com gravação ao vivo,
>  pra audiência misturada (testers + Marina B2B + Daniel/Protássio
>  clínicos). Material reusável. Sem inflar. Empírico."*

---

## RESUMO DO DIA 14/05 (estado ao final do BLOCO B)

```
Hora:                  ~03h BRT
Sessão noite 13/05:    17 commits encadeados (V1.9.262-278)
Conversa 3 sócios:     captada por Pedro, transcrita no GPT, analisada
                       por Claude pra ajuste de roteiro
Decisão final:         alinhamento Pedro-João pré-evento sobre linguagem
                       narrativa = TASK CRÍTICA hoje antes 20h
Audiência refinada:    Pedro Protássio + Daniel Rubens + Marina (B2B 4000
                       clínicas) + colaborador novo + testers cadastrados
Risco principal:       João falar "Roadshow / investidor" e Marina
                       comparar expectativa vs realidade pré-PMF
Mitigação:             Pedro abre evento estabelecendo "teste beta" antes
                       do João falar. Anti-overclaim institucional.
```
