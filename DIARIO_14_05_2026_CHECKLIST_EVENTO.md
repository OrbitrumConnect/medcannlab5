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

---

## BLOCO C — Manhã desktop + audiência consultiva João (14/05/2026 ~09h30-13h30)

### C.1 — 12 commits cirúrgicos V1.9.280→291 (pull do laptop OK)

Sessão desktop com pull já concluído. Untracked herdados do laptop:
- `INVESTMENT_KIT/pitch_atual_14_05.md`
- `PARA_RICARDO_V16_2_APROVAR_14_05.md`

**12 commits push 4 refs (amigo+medcannlab5 × main+master):**

| Versão | Hash | Foco |
|---|---|---|
| V1.9.280 | d2dd444 | 6 tapas visuais Terminal Clínico Integrado |
| V1.9.281 | d6e9521 | **Visão Geral elite escalável** — 7 blocos top-down |
| V1.9.282 | 199ae30 | Alergias/Meds/Sangue movidos pra Visão Geral |
| V1.9.283 | 622b96b | Aba Prescrição Prontuário triple A |
| V1.9.284 | d5cb7c4 | Busca integrada ao empty state Paciente em foco |
| V1.9.285 | c5ffee4 | Abre direto Evolução+Analytics ao clicar paciente |
| V1.9.286 | a34ff96 | "Voltar à seleção" limpa paciente |
| V1.9.287 | c243cfb | "Resumo das Abas" → "Resumo" |
| V1.9.288 | de509e5 | Chat Clínico header 1 linha + Novo Chat sóbrio |
| V1.9.289 | d2c6fdc | Fix InvalidJWT (introduziu regressão) |
| V1.9.290 | 3f6b9fc | Fix regex bucket (correção da V1.9.289) |
| V1.9.291 | 5580897 | Fix download → inline (Blob + Content-Type) |

**Aprendizado destacado:** Trio Library (289→290→291) reforça princípio operacional — regex/fix não testado empiricamente é palpite, não código. Pedro corrigiu rápido na hora.

### C.2 — Conversa consultiva com João Vidal (~12h-12h45)

Pedro entrou em modo consultivo (banho), autorizou IA atender João pra dúvidas SEM mexer código. Senha de retorno: **"Pedro aquI"** (I maiúsculo).

**Pedidos do João atendidos (entregues como texto markdown pra ele copiar):**
1. Deck interno 12 slides — alinhamento sócios pré-Prefeitura RJ
2. Deck externo 10 slides — apresentação Prefeitura RJ (parceria com indústria 1.0)
3. Handout A4 — material residual pós-reunião
4. Email frio — 3 versões pra abrir conversa com Subsecretaria SMS-RJ
5. Roteiro de fala 12 min coordenado com deck externo + dicas presenciais

**Modo consultivo respeitado: 0 arquivos criados, 0 commits, 0 código tocado.** Tudo em chat.

### C.3 — Chapéu paralelo João — BIOCANN / 1 Pure separado MedCannLab

Tema institucional novo emergiu da conversa, depois confirmado e refinado pelo Pedro ao retornar:

```
1 Pure (farmacêutica canabidiol)
   └─► JV BIOCANN (representação comercial + educação/cultura)
              ▲ João representante autorizado (Lei 4.886/1965 representação comercial)
              │
              ▼
   MedCannLab (entidade soberana na gestão — sem vínculo com BIOCANN)
              ▲ João = sócio institucional MedCannLab
```

**Selo declarado pelo Pedro 14/05:**
- MedCannLab × JV BIOCANN = **zero relação atual**
- MedCannLab × 1 Pure = **zero relação atual** (caso futuro investimento/parceria = outro caso, não tratar como existente)
- Trajetória histórica: Remederi (até início 2026) → 1 Pure via BIOCANN
- Email `jvbiocann@gmail.com` já circulava desde fev/2026 — não é entidade nova, é refinamento da representação
- **Sem conflito de interesse declarado** pelos 4 sócios MedCannLab
- João conduz pitches MedCannLab como sócio institucional, sem misturar narrativa com BIOCANN/1 Pure

**Risco regulatório RDC 96/2008 fica em BIOCANN/1 Pure (não em MedCannLab):**
Propaganda de medicamento sob prescrição a leigos é restrita. Risco primário na 1 Pure (titular registro); BIOCANN responde solidariamente como agente executor. MedCannLab não comercializa medicamento — fora desse risco.

**Memória nova selada:** `project_joao_vidal_biocann_1pure_estrutura.md` (entrada Nível 2.5 no MEMORY.md).

### C.4 — Re-auditoria via PAT (princípio 38 aplicado)

Antes de aceitar os números do pitch entregue ao João, Pedro pediu re-audit via PAT pra calibrar com a realidade do banco. PAT novo fornecido `sbp_…[REDACTED — ver fluxo de credenciais; rotacionado fim sessão 14/05]`.

**9 queries rodadas + 8 contagens de log. Comparativo memória vs auditado 14/05 ~13h:**

| Métrica | Pitch entregue | **Real auditado** | Δ |
|---|---|---|---|
| Reports clínicos 30d | 104 | **104** | ✅ exato |
| Reports clínicos TOTAL | — | **123** | 🆕 |
| ICP signed 30d | 25 | **33** | ⬆️ +8 |
| ICP signed TOTAL | — | **33** | 🆕 100% nos últimos 30d — aceleração ICP |
| Reports Ricardo (toda base) | 88 | **97** | ⬆️ +9 |
| Pacientes Ricardo via reports | 18 | **8** | ⬇️ -10 (clínico-rigoroso) |
| Pacientes Ricardo via appointments | — | **22** | 🆕 mais inclusivo |
| Pacientes Ricardo via chat ativo | — | **19** | 🆕 conversa ativa |
| Hits renais 90d | 358 | **28** | ⬇️ **-330** 🚨 |
| Tabelas public | 134 | **177** | ⬆️ +43 |
| Policies RLS | 414 | **432** | ⬆️ +18 |
| Logs auditáveis | 5.394 | **10.124** | ⬆️ +4.730 (8 tabelas: noa_logs 9.872 dominante) |

**Discrepâncias críticas pré-Prefeitura:**
1. **Hits renais 90d**: 358 → 28. Memória `project_cohort_ckd_existe_pos_muhdo_08_05.md` já tinha registrado essa volatilidade (1.203 → 358 → 18 nas iterações). **28 é factual auditado agora.**
2. **Pacientes Ricardo**: 18 → narrativa de funil é mais honesta (22 atendidos → 19 conversando → 8 com relatório assinado)
3. **Audit logs**: tabela `audit_logs` não existe; total agregado real é 10.124 distribuído em 8 tabelas

**Ajustes positivos pro pitch:**
- ICP signed pulou de 25 → 33 (+32% em ~5 dias). Narrativa de aceleração legítima.
- Banco cresceu 134→177 tabelas. Sinal de evolução arquitetural sólida.
- 10k+ logs auditáveis (vs 5.394 anteriores).

### C.5 — Pitch institucional TOP MASTER (Etapa 4 desta sessão)

Refazendo o deck externo Prefeitura RJ com dados auditados via PAT — vira "top master". Pedro autorizou. Substitui versão anterior entregue ao João.

[a fazer após este bloco]

### C.6 — Lições do dia

- **Princípio 38 ratificado**: re-audit via PAT antes de afirmar métrica externa salvou João de levar número 358 (inflado em 12,7x) pra Prefeitura RJ. Dado primário sempre auditável.
- **Sócio em dupla atividade institucional**: requer documentação explícita pra evitar confusão pública. Memória nova fecha esse gap.
- **Trio Library 289-291**: bug humilde — fix sem teste empírico é regressão garantida. Pedro me corrigiu na hora.

### C.7 — Frase âncora do bloco

> *"Antes de entregar número pra fora, re-auditar pra dentro.*
> *Pitch com memória é palpite; pitch com PAT é evidência."*

---

## RESUMO DO DIA 14/05 (estado ao final do BLOCO C)

```
Hora:                  ~13h30 BRT
Commits hoje:          12 (V1.9.280→291), 4 refs OK
Conversa João:         5 materiais consultivos entregues (deck interno, externo,
                       handout, email frio, roteiro fala) sem tocar código
Chapéu João aclarado:  BIOCANN/1 Pure ≠ MedCannLab — memória nova selada
Re-audit PAT:          9 métricas reavaliadas — 3 discrepâncias críticas
                       (hits renais 358→28, pacientes Ricardo 18→funil 22/19/8,
                       logs 5394→10124)
Próximo:               Pitch TOP MASTER com dados reais (substitui o entregue ao João)
                       Depois: aba A/B/C Prescrição Prontuário (volta código)
PAT pra rotacionar:    sbp_…[REDACTED — rotacionado fim sessão 14/05]
```

---

## BLOCO D — Tarde RDC ANVISA 1.015 + análise Triagem DRC (14/05/2026 ~13h30-15h15)

### D.1 — Ricardo trouxe RDC ANVISA Nº 1.015/2026 + pseudocódigo Python

Pedro recebeu de Ricardo: PDF da **RDC ANVISA Nº 1.015 de 02/02/2026 (vigência 04/05/2026)** + pseudocódigo Python `class NoaEsperanza` com 17 perguntas Triagem DRC.

**Comentário Ricardo (frase âncora):** *"Não podemos usar como está, mas adaptar e estudar."*

A RDC 1.015 **revoga a RDC 327/2019** — base regulatória anterior que estava documentada nas memórias. Regula Autorização Sanitária (AS) para fabricação/importação/comercialização de produtos cannabis medicinal.

Pedro: *"isso era da Remederi! agora mudou para 1 Pure como representante e abriu a JV BIOCANN."* — confirma trajetória histórica. Email `jvbiocann@gmail.com` já circulava desde fevereiro/2026 conforme `docs/DIARIO_COMPLETO_05-06_FEVEREIRO_2026.md`.

### D.2 — Análise técnica RDC 1.015 × estado atual MedCannLab

**Veredito principal:** MedCannLab NÃO é sujeito regulado direto da RDC 1.015 (não fabrica/importa/comercializa). 1 Pure SIM. Médicos prescritores cannabis na plataforma têm responsabilidade individual.

**O que JÁ atende (zero ação):**
- Art. 36 prescritor habilitado — V1.9.207 valida CRM/UF
- Art. 37 §1+§2 receitas Branca/Amarela — V1.9.185 implementou 4 tipos CFM + Portal ITI
- Art. 38 §1 assinatura — ICP-Brasil PKCS#7 SHA-256 nativo
- Art. 39-40 dispensação SNGPC — fora do escopo (não somos farmácia)

**Gaps identificados (não urgentes, não bloqueadores):**

| # | Ponto | Status real |
|---|---|---|
| 1 | TCLE Anexo II | Tabela `medical_certificates` existe mas é pra certificados ICP dos médicos, **não pra TCLE de paciente**. Gap real, médico gera fora hoje |
| 2 | Auto-classificação Branca/Amarela por teor THC | Médico escolhe manual. UX, não compliance bloqueador |
| 3 | Audit Library termos proibidos | Apenas 1 doc dos 46 (`Protocolos REUNI.pdf`) cita "full spectrum"/"broad spectrum"; HCP-only. Risco regulatório próximo de zero |

### D.3 — Esboço Ricardo "class NoaEsperanza" Triagem DRC

17 perguntas (11 determinantes sociais + 6 hábitos/comorbidades), score linear simples. **Sem perguntas laboratoriais** — captura ANTES de exame.

**Interpretação alinhada com 3 camadas constitucionais Ricardo 13/05:**

```
Camada 1: TRIAGEM NARRATIVA PÚBLICA  ◄── Esse questionário mora AQUI
   ├─ Entrada SEO / web pública
   ├─ Score populacional de risco DRC
   ├─ Baseado em determinantes sociais + hábitos
   └─ Output: orientação a procurar atendimento (não diagnóstico)

Camada 2: AEC FORMAL (ato clínico autoral Ricardo) — kevlar §1, intocada
Camada 3: CONSULTA MÉDICA (responsabilidade humana)
```

**Decisão Pedro:** PARQUEAR. Entry detalhada em `IDEIAS_PARKED_PARA_DEPOIS_SPRINT1.md`. Honra freeze 16/05.

### D.4 — Análise de risco arquitetural (pergunta Pedro: "o que implica em AEC, GPT, toda arquitetura?")

| Camada | Cenário A (Triagem Camada 1) | Cenário B (AEC Nefro Extension) |
|---|---|---|
| AEC FSM | ✅ ZERO toque | 🔴 MEXE NO CORE |
| tradevision-core (6338 LOC) | ✅ ZERO toque (form determinístico, não LLM) | 🟠 Adicionar ramos condicionais — risco regressão |
| Pirâmide 8 camadas | ✅ ZERO toque | 🔴 Toca camada 2 (AEC) + camada 3 (Verbatim) |
| ICP-Brasil | ✅ Não gera doc médico | 🟠 Pode precisar hash diferente |
| Schema | 1 tabela nova `triagem_drc_responses` | Migration complexa em `clinical_assessments` + `clinical_axes` |
| Anti-kevlar §1 | ✅ NÃO viola | 🔴 VIOLA — exige Magno V2.0+ |
| 3 camadas constitucionais | ✅ Encaixa perfeitamente em Camada 1 | 🔴 Muda Camada 2 — requer Ricardo + 4 sócios |
| Rollback | Trivial | Complexo (migration de dados) |

### D.5 — Análise latência 3 usuários simultâneos (User1 AEC + User2 chat + User3 RDC)

```
Cenário A (Triagem DRC):
  User1 AEC turn:        ~3-15s (tradevision-core LLM)
  User2 chat livre:      ~3-5s (mesma Edge)
  User3 Triagem DRC:     ~100-300ms (form local + insert Supabase)

  → User3 INVISÍVEL pra User1 e User2 (caminho técnico separado).
  → Zero competição por GPT / tradevision-core / fila.

Cenário B (AEC Nefro Extension):
  User1 AEC base:        ~3-15s
  User2 chat livre:      ~3-5s
  User3 AEC Nefro:       ~5-20s (módulo extra)

  → AEC Nefro divide tradevision-core com User1 e User2.
  → Pipeline RATIONALITY (já ~20s = 55% latência total) pode ir pra 30-40s.
  → Risco UX real acima de 5-7 users simultâneos AEC Nefro.
```

### D.6 — Pergunta Pedro: "usuário iniciaria do mesmo jeito que AEC porém RDC sem atrapalhar core AEC?"

**Sim, totalmente possível.** Padrão recomendado: **mesma porta UX, rotas/componentes técnicos separados.**

```
[Botão "Iniciar Avaliação"]
      │
      ▼
[Seletor: Triagem rápida 5min OU Avaliação clínica completa?]
      │                            │
      ▼                            ▼
/triagem-renal               /aec
TriagemDRCForm.tsx           AECChat.tsx
triagem_drc_responses        clinical_assessments
NÃO chama LLM                tradevision-core
NÃO Pipeline                 Pipeline completo
NÃO ICP-Brasil               ICP-Brasil signature
```

**2 regras críticas pra não confundir o Core:**
1. Final da Triagem NÃO pode auto-disparar AEC (princípio 11 — eventos explícitos, clique não inferência). Paciente vê score + CTA "Quer fazer AEC completa? [SIM]" → clica → AEC inicia
2. Triagem NUNCA grava em `clinical_assessments` (tabela própria + RLS própria — não contamina query `is_complete`)

### D.7 — Conexões com sessão atual

- **Princípio 56 (3 camadas — Ricardo 13/05)** ↔ esboço Triagem DRC encaixa perfeitamente como Camada 1
- **Princípio 57 (relacionamento clínico longitudinal — Ricardo 13/05)** ↔ Art. 47-52 farmacovigilância pós-mercado RDC 1.015 → oportunidade B2B Muhdo
- **Consent-first V1.9.275** ↔ Art. 38 + Anexo II TCLE individualizado → precursor arquitetural
- **TradeVision Constitution Final** ("A IA não é confiável. O sistema é.") ↔ Art. 9 publicidade + Art. 19 termos proibidos → filtro editorial nativo possível

### D.8 — Memórias seladas nesta sessão tarde

1. **`project_joao_vidal_biocann_1pure_estrutura.md`** — chapéu paralelo João separado MedCannLab
2. **`reference_rdc_anvisa_1015_2026.md`** — referência regulatória completa com cross-ref princípios 56+57
3. **`project_sessao_14_05_2026_consolidacao_tarde.md`** — selo desta sessão (manhã + tarde)

3 entries novas em MEMORY.md (Nível 2.5 — regras de decisão).

### D.9 — Frase âncora do BLOCO D

> *"RDC 1.015 não regula a plataforma — regula quem fabrica e quem prescreve.*
> *Pra MedCannLab, a RDC é contexto, não bloqueador.*
> *A Triagem DRC do Ricardo é Camada 1, não AEC. Encaixa sem violar kevlar §1."*

### D.10 — Análise profunda compliance RDC 1.015 × plataforma (~15h)

Pedro pediu análise artigo-por-artigo da RDC × cada dimensão MedCannLab. 16 queries PAT empíricas. **Veredito final: compliance plena.**

**Premissa jurídica:** MedCannLab NÃO é sujeito regulado direto da RDC (não fabricamos/importamos/comercializamos). Art. 36 §2 explicita: "indicação e forma de uso são responsabilidade do prescritor." Blindagem jurídica clara.

**Achados empíricos críticos:**

1. **6 prescrições cannabis DRAFT** com termos problemáticos:
   - `6986c52f`: "REuni CBD Oil **borad spectrum** 3600 mg 0% THC" (marca Remederi + termo proibido Art. 19 III)
   - `5e2fcafe`: "CBD **full spectrum**" 36 mg (termo proibido)
   - 4 outras genéricas OK ("CBD para Dor Crônica Renal")
   - Status: TODAS DRAFT, não assinadas ICP, não saíram da plataforma. **Sem dano regulatório efetivo.**
   - Análise: Art. 19 III proíbe em rótulos/embalagens/folhetos do PRODUTO — não em prescrição médica per se. Responsabilidade do médico (Art. 36 §2).

2. **TCLE Anexo II não existe** — tabela `patient_consents` ausente. GAP real, mas Art. 38 §2 atribui arquivamento ao prescritor, não plataforma. Oportunidade feature pós-PMF.

3. **Farmacovigilância sem tabela dedicada** — Arts. 47-52 obrigam detentor AS (1 Pure), não MedCannLab. Eventos clínicos vivem em `noa_logs` (9.872) + AEC. Oportunidade B2B futura (módulo VigiMed pra titulares AS, conexão tese Muhdo).

4. **RLS templates permissiva** — qualquer logado pode SELECT direto API. UI não expõe (3 contextos HCP-only). Vetor teórico, risco prático muito baixo.

5. **Library 9 docs cannabis ATIVOS** — TODOS target_audience HCP (professional/admin/student), nenhum `patient`. Configuração editorial correta. Único doc com termo "Protocolos REUNI" (full/broad spectrum) é HCP-only.

### D.11 — Cursos cannabis + MEC + responsabilidade Eduardo/Ricardo

Pedro perguntou: *"Eduardo e Ricardo são sócios do app — o curso é deles, não necessariamente o app precisa da RDC? E o MEC também?"*

**Estado real auditado (PAT):**
- **3 cursos cannabis ativos:**
  - "Pós-Graduação Cannabis Medicinal" (5ea0c91c)
  - "Introdução à Cannabis Medicinal" (4b712f23)
  - "Pós-graduação em Cannabis Medicinal" (e1771364) ⚠️ duplicação?
- `lesson_content` cannabis: **0** (cursos vazios, pré-PMF)
- `lesson_content` com termos proibidos: 0

**Análise jurídica:**

| Dimensão | App precisa? | Eduardo/Ricardo precisam? |
|---|---|---|
| **RDC ANVISA 1.015** | 🟢 NÃO (não fabrica/importa/comercializa) | 🟢 NÃO (só pra ministrar; respondem via CFM como médicos-autores) |
| **MEC** | 🔴 SIM SE chamar "Pós-Graduação" (LDB Lei 9.394/1996 + Res. CNE/CES 1/2007) | 🟢 NÃO (são autores, não emissores de diploma) |
| **CFM 1.974/2011 publicidade médica** | 🟢 Plataforma curadora | 🔴 SIM como médicos com CRM ativo |
| **RDC 96/2008 propaganda** | 🟡 SE curso virar propaganda a leigos | 🟡 SE endossar produto/marca |

**Achado regulatório real:** 2 dos 3 cursos cannabis ativos usam termo "Pós-Graduação". Se MedCannLab não é Instituição de Ensino Superior credenciada MEC, isso pode caracterizar:
- Infração LDB (uso indevido nomenclatura reservada)
- Propaganda enganosa CDC Art. 37
- Problema com aluno tentando usar certificado como pós-graduação reconhecida

**3 opções operacionais:**
- **A — Renomear** "Pós-Graduação" → "Capacitação em Cannabis Medicinal" (1 SQL UPDATE, custo zero, elimina obrigação MEC). **Recomendado pré-PMF.**
- **B — Parceria** com IES credenciada (acordo institucional, mantém termo)
- **C — Credenciar** MedCannLab como IES (pós-PMF, capitalizado, anos)

**Vantagem institucional Eduardo + Ricardo:** ambos têm CRM ativo. Como médicos-sócios, **autoridade científica nativa** vs plataforma EdTech sem médicos no quadro. Diferencial pro pitch.

### D.12 — Memória nova selada

`reference_audit_compliance_rdc_1015_14_05.md` consolida análise artigo-por-artigo + achados empíricos + cursos MEC + recomendações por opção. Adicionada ao MEMORY.md.

### D.13 — Pendências fim de tarde 14/05

1. **PAT vazado** `sbp_740dd1f6a65b28d141d0dde382fbbefaef608f19` exposto no commit 6e94a76 (pushed ao `amigo`). Bloqueia push pro `medcannlab5`. Aguarda decisão Pedro: force-push limpa OU commit novo com contaminação. **Revogação no Supabase Dashboard URGENTE (memória `feedback_credentials.md`).**
2. **Pré-evento 15/05 20h** — opções leves a atacar: smoke visual V1.9.280-291 com pacientes reais (Carolina/Carlos Eduardo/Badhia), atualizar `pitch_atual_14_05.md` pra apontar `pitch_prefeitura_rj_top_master_14_05.md`, alinhamento João sobre linguagem ("teste beta", não "Roadshow").
3. **Aba A/B/C Prescrição** (substituir IntegrativePrescriptions por QuickPrescriptions) — fila original do dia. Não urgente pré-evento.

---

## RESUMO DO DIA 14/05 (estado ao final do BLOCO D)

```
Hora:                  ~15h30 BRT
Commits hoje:          12 (V1.9.280→291), 4 refs OK
Memórias seladas hoje: 3 (chapéu João, RDC 1.015, selo sessão tarde)
RDC 1.015 absorvida:   sim — análise + parking + cross-ref princípios 56+57
Triagem DRC esboço:    parqueado em IDEIAS_PARKED, Camada 1 publica futura
Pitch TOP MASTER:      pronto em INVESTMENT_KIT, dados auditados via PAT
PAT decisão:           AGUARDANDO Pedro (force-push limpa OU commit novo)
Pré-evento 15/05 20h:  opções leves listadas, aguardando escolha Pedro
```


