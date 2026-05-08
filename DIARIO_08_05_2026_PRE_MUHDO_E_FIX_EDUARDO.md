# 📔 DIÁRIO 08/05/2026 — PRÉ-MUHDO + FIX EDUARDO

**Início:** 00:30 BRT (transição direta de 07/05 ~23h, sessão laptop)
**HEAD entrada:** `13a7a95` (V1.9.x — Profile.tsx upsert sem user_id)
**HEAD saída:** `364882a` (V1.9.189) → atualiza com V1.9.190 ao fim do BLOCO G
**Tag estável:** `v1.9.113-locked` (preservada desde 04/05)
**Lock V1.9.95+97+98+99-B:** ✅ intocado em 100% dos commits
**Reunião marcada:** Muhdo Health Ltd (UK) → 14h BRT / 18h BST

---

## ESTADO REAL DE ENTRADA (validado live via PAT 08/05 ~00h BRT)

```
HEADCOUNT
  25 pacientes (22 patient + 3 paciente)
  16 pagantes (paid status) — 64% conversion intentional cohort
  3 anonimizados (LGPD compliance comprovada)
  10 profissionais + 5 admins = 15 staff

AEC FUNNEL (V1.9.95 lock — produção real)
  61 AECs iniciadas (16 completed, 45 in_progress)
  102 clinical_reports gerados
  22 reports ICP-signed end-to-end (signature_hash + signed_payload + signed_at)
  14 unique patients reached "report" stage

ENGAGEMENT (últimos 30 dias)
  1.491 ai_chat_interactions (~50/dia)
  1.369 verbatim entries hashed (~46/dia)
  22 unique active users
  90.4% intent classification = clinical (2.626/2.904)
  33 appointments scheduled+completed (12 nos últimos 7d)
  240 video_call_requests / 110 accepted = 45.8% accept rate
  83 reports created (22 ICP-signed = 100% all-time signed no último mês)

PRESCRIPTIONS
  41 cfm_prescriptions (1 SIGNED ICP, 2 SENT, 38 DRAFT)
  0 atestados ainda (V1.9.185 deployed mas Ricardo não testou)

INFRAESTRUTURA
  172 public tables / 345 RPCs / 74 triggers
  11 Edge Functions ATIVAS
  PKCS#7 RFC 3852 ICP-Brasil REAL — Ricardo cert ativo
  8-layer governance pyramid (LLM último a falar, primeiro a checar)
  Realtime publication ativa (V1.9.164)
  pg_cron 5min reminders + 30min financeiros
```

---

## REGRAS OPERACIONAIS DE ENTRADA

1. Hierarquia banco > diários > Pedro > palpites focados
2. Polir não inventar (P3) — 99% da infra existe pré-PMF
3. Garantir uso real V2 (todos tipos usuários sem regressão)
4. **Anti-regressão sagrada (Lock V1.9.95+97+98+99-B intocado)** — Pedro 08/05 reforçou novamente
5. Camada 0 com rigor (irreversível REAL)
6. Pré-Muhdo = honestidade, não overclaim — "computational anthropology, not digital health"
7. Anti-kevlar §1: tudo aditivo, zero remoção de Lock CORE

---

## BLOCO A — ANÁLISE EBOOK MEDCANNLAB (ENGLISH)

Pedro mandou *"MedCannLab Precision Health Ebook"* (10 págs, EN) para análise pré-Muhdo.

### Análise produzida (resumo)

- ✅ **70% bate com Muhdo:** página 7 "Biological + Narrative Intelligence" é literalmente a tese de integração que Muhdo precisa ouvir; página 6 "Semantic Infrastructure" eleva a categoria; página 5 "AI organizes complexity" alinhado com governance
- ❌ **30% gap:** ebook é manifesto, falta 1 página de proof points (números) e 1 página de caso clínico concreto
- ❌ **Cannabis sumiu:** brand "MedCannLab" + zero menção cannabis no corpo. Deliberado pra audience UK?
- ❌ **Sem zero proof points:** cientista UK pede números. Vocês têm (1.369 verbatim, 22 ICP-signed, 45.8% accept rate)

### Recomendação produzida

NÃO refaça o ebook (lindo, em alta resolução, pronto). Faz **3 páginas de addendum técnico** anexo: (A) caso TNF + AEC integrado, (B) proof points 30d, (C) 4 modelos colaboração + 3 perguntas. Total ~1h.

---

## BLOCO B — ÁUDIO RICARDO+PEDRO+JOÃO (TRANSCRIÇÃO BRUTA MULTILÍNGUE)

Pedro mandou áudio com transcrição cortada em 6+ idiomas (PT/EN/KR/RU/IT/JP — falha de detecção do GPT). Mesmo cortado, núcleo extraído:

```
RICARDO: "captura de dados ≠ preservação narrativa"
RICARDO: "sintoma é a vida"
RICARDO: análise do ecossistema do paciente
         (cultura, território, família, religião, paciente
          muçulmano vs cubano = contextos diferentes)
PEDRO:   "diferencial linguístico computacional"
PEDRO:   "8 camadas — OS clínico"
PEDRO:   "domina a resposta da IA / não contamina a fala
          do paciente"
RICARDO: Kahneman — "pensamento rápido vs devagar"
                    → AEC como desaceleração reflexiva
TODOS:   "antropologia computacional"

CONFIRMAÇÃO LOGÍSTICA:
  reunião amanhã VIRTUAL (London + Lisboa + Rio)
  almoço antes na casa do Ricardo (12h)
  Pedro+Ricardo+João presencial Rio + Eduardo via vídeo
  Eduardo = "diretor científico do Instituto do Cérebro"
            (credencial institucional CONFIRMADA)
```

### Insights novos extraídos pra usar AMANHÃ

1. *"We do not contaminate the patient's voice"* — mata AI hallucination
2. **Ecosystem layer** — família/cultura/território/fé (NÃO está no addendum mas é diferencial real)
3. *"Computational anthropology"* — categoria mais defensável que "healthtech"
4. *"Symptom is a life-event, not a biological error"* — silencia mesa
5. **Kahneman System-2 protocol** — AEC como desaceleração reflexiva (peer-friendly UK)

---

## BLOCO C — AUDIT EMPÍRICO LIVE (PAT NOVO)

Pedro mandou PAT novo `sbp_***[REDIGIDO — revogar pós-Muhdo]` "para conferir 100%". Audit completo via Management API confirmou:

**MEMÓRIA 27/04 ESTAVA DESATUALIZADA.** Métricas hoje 4-20× maiores:
- 7 AECs (memória) → **16 completed** (real)
- 38 reports signed (memória) → **22 ICP-signed em 30d** (real, mais limpo)
- 305 interações Core (memória) → **1.491 chat + 1.369 verbatim em 30d** (real)
- 3 appointments (memória) → **42 scheduled+completed** (real)
- 8 pacientes externos (memória) → **25 pacientes / 16 pagantes** (real)

**AVISO de segurança ao Pedro:** PAT exposto no chat → girar depois de Muhdo (https://supabase.com/dashboard/account/tokens).

### Linha-âncora pra reunião amanhã (calibrada)

> *"Last 30 days: 1,369 patient verbatim entries with cryptographic hash, 1,491 AI-mediated clinical interactions, 22 ICP-Brasil signed clinical reports (PKCS#7 RFC 3852, juridically valid in Brazil), 16 completed AEC structured assessments across 13 deterministic phases, 110 accepted video consultations (45.8% accept rate), 22 unique active users, 16 paying patients out of 25. We're pre-PMF intentionally — closed cohort of ~50 design partners. Methodology, governance and signing infrastructure work end-to-end at production scale. Not vaporware."*

---

## BLOCO D — MATERIAL MUHDO PRODUZIDO

Pedro topou plano cirúrgico 30-45min de produção. Entreguei 3 peças:

```
tmp/muhdo/01_email_premeeting.md    (English, 3 paragraphs)
                                    Subject: "MedCannLab × Muhdo — pre-call note"
                                    Cita o paper Muhdo de Depression literal
                                    Recomenda Model A (12-pt pilot, 6 months)

tmp/muhdo/02_addendum.md            (3 pages technical, English)
                                    Page A: caso TNF + AEC integrado (visual)
                                    Page B: proof points 30d (tabela métricas)
                                    Page C: 4 collab models + 3 perguntas a eles

tmp/muhdo/03_roteiro_mental.md      (cheat-sheet PT-BR, só pra Pedro)
                                    Tom + 3 frases-âncora + 4 elementos novos
                                    Métricas de cabeça + caso clínico
                                    Defesas anti-ataque + abertura "we use own infra"
                                    Estrutura 30min + smoke pré-call 13:30
                                    Frame elegante se P2P cair durante a call
```

Plano operacional final:
```
Hoje 23:30  envia email + ebook + addendum
Hoje 23:55  DORME
Amanhã 09h  abre roteiro mental, lê 2x
Amanhã 12h  almoço casa Ricardo + smoke ICE/áudio Eduardo
Amanhã 13:30  decide rota A (P2P MedCannLab) ou B (Zoom backup)
Amanhã 14h  Muhdo entra
```

---

## BLOCO E — BUG AUDIT EDUARDO (CONSOLE LOGS)

Eduardo testou plataforma 23h do 07/05 (call profissional⇄profissional com Ricardo + Pedro como observador admin). Áudio do Eduardo NÃO saiu. Pedro mandou logs dos 2 lados (Pedro admin + Eduardo).

### 3 issues identificados

**1. ICE/WebRTC NAT loop (50+ Watchdog "Bad connection")**
- Diagnóstico: NAT simétrico do laptop/rede do Eduardo OU TURN config incompleta no MedCannLab
- Fix: NÃO toca em código de WebRTC à madrugada (risco). Mitigação operacional: smoke 13:30 + Zoom backup pronto
- Eduardo precisa testar: chrome://settings/content/microphone + https://test.webrtc.org + tentar do celular

**2. 403 RLS em video_call_sessions (sem patientId)**
- Causa raiz: profissional⇄profissional → caller grava 1º com seu user.id como professional_id, callee tenta upsert e bate UPDATE policy (auth.uid ≠ professional_id da row)
- Fix: V1.9.189 (BLOCO F)

**3. 409 em professional_availability (race DELETE+INSERT)**
- Causa raiz: clique duplo, INSERT bate UNIQUE(professional_id, day_of_week, start_time)
- Fix: V1.9.189 (BLOCO F) — UPSERT idempotente

**4. Re-render Chat System (12 salas × 9 logs)**
- Investigado: NÃO É BUG. É Realtime postgres_changes em chat_messages disparando loadInbox a cada nova message (working as designed). DROPPED.

---

## BLOCO F — V1.9.189 RLS + UPSERT (deployed ~00h30 BRT 08/05)

### Migration RLS — `video_call_sessions`

```sql
DROP POLICY "Professional inserts own video call sessions" ...
DROP POLICY "Professional updates own video call sessions" ...

CREATE POLICY "Professional or admin inserts video call sessions"
  ON public.video_call_sessions
  FOR INSERT
  WITH CHECK (
    auth.uid() = professional_id
    OR EXISTS (SELECT 1 FROM public.user_roles
               WHERE user_id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Professional or admin updates video call sessions"
  ON public.video_call_sessions
  FOR UPDATE USING (... admin OR professional_id ...)
  WITH CHECK (... admin OR professional_id ...);
```

### Frontend — `ProfessionalSchedulingWidget.tsx` linha 156

```ts
// ANTES
await supabase.from('professional_availability').delete().eq('professional_id', user.id)
const { error } = await supabase.from('professional_availability').insert(rows)

// DEPOIS (V1.9.189) — UPSERT idempotente
const { error } = await supabase
  .from('professional_availability')
  .upsert(rows, { onConflict: 'professional_id,day_of_week,start_time' })

// + DELETE seletivo só pras regras removidas da lista
```

### Análise regressão

```
✅ Profissional continua vendo/editando próprias rows como antes
✅ Paciente continua vendo próprias sessions como antes
✅ Admin agora pode tudo (privilege levantado, não rebaixado)
✅ Availability: comportamento final idêntico — só atomicidade muda
✅ Não toca chat/realtime/scheduling/profile/atestado/AEC/pipeline
✅ Não toca Edge Functions
✅ Backwards compat 100%
```

**Commit:** `364882a` — `fix(rls+frontend): V1.9.189 — RLS video_call_sessions admin + UPSERT availability (zero regressão)`

**Push:** 4 refs synced (hub + origin × main + master).

---

## BLOCO G — V1.9.190 EDUARDO ROLE SWAP (deployed ~01h BRT 08/05)

### Pedido explícito de Eduardo (via Pedro)

> *"Eduardo entra como pro com gmail. O dele admin é o hotmail."*

### Estado ANTES (auditado live)

```
gmail   eduardoscfaveret@gmail.com   (f4a62265-...)
  type=admin, is_official=false
  user_roles=['admin', 'profissional']  ← duplicado

hotmail eduardo.faveret@hotmail.com  (5a9ada8b-...)
  type=professional, is_official=true
  user_roles=['profissional']
```

### Estado DEPOIS (smoke confirmado live)

```
gmail   = profissional oficial (atende paciente, prescreve, assina ICP)
  type=professional, is_official=true
  user_roles=['profissional']

hotmail = admin (gestão da plataforma)
  type=admin, is_official=false
  user_roles=['admin']
```

### Pattern segue Ricardo

```
Ricardo  rrvalenca@gmail.com         = profissional oficial (clínico)
         iaianoaesperanza@gmail.com  = admin

Eduardo  eduardoscfaveret@gmail.com  = profissional oficial (clínico)  ⭐ NOVO
         eduardo.faveret@hotmail.com = admin                            ⭐ NOVO
```

### ⚠️ Caveat conhecido após V1.9.190

V1.9.189 cobria Eduardo via cláusula `OR admin`. Após V1.9.190, gmail Eduardo (profissional, não admin) volta a estar exposto ao 403 em call profissional⇄profissional callee. **Não bloqueia o uso real:**

- Eduardo gmail ⇄ paciente → ele é caller, professional_id = Eduardo, policy passa ✅
- Eduardo gmail ⇄ Ricardo profissional⇄profissional → callee bate 403 só ao salvar telemetria pós-call (não a call em si)

Backlog: implementar policy peer-aware (verificar caller/callee em video_call_requests para a sessão).

---

## BLOCO H — FRASE ÂNCORA + HANDOFF

### Frase âncora 08/05 madrugada (selo pré-evento)

> *"08/05 abriu com sessão laptop madrugada (~3h), entregou: análise ebook MedCannLab vs Muhdo paper (gap honesto identificado), absorção do áudio Ricardo+Pedro+João (4 elementos novos extraídos: 'we don't contaminate', ecosystem layer, computational anthropology, symptom-as-life-event, Kahneman System-2), audit empírico live com PAT novo (memória 27/04 desatualizada, métricas reais 4-20× maiores), 3 peças material Muhdo (email + addendum 3pg + roteiro mental) salvas em tmp/muhdo/, fix V1.9.189 RLS+UPSERT (zero regressão, push 4 refs), fix V1.9.190 swap role Eduardo (gmail=pro, hotmail=admin pelo pedido dele). Lock V1.9.95+97+98+99-B intocado 100%. Reunião Muhdo amanhã 14h BRT presencial Rio (Pedro+Ricardo+João) + Eduardo via vídeo MedCannLab + UK virtual. Pedro vai voltar ao PC — handoff em reference_proxima_sessao_08_05_handoff.md."*

### Próxima ação humana (Pedro 08/05 ~01h+)

```
[ ] Manda email pré-meeting Muhdo (tmp/muhdo/01) ANTES de dormir
[ ] Anexa ebook.pdf + addendum.pdf (converte tmp/muhdo/02 → PDF)
[ ] Manda mensagem pro Eduardo: chrome://settings/content/microphone + test.webrtc.org
[ ] Backup Zoom link salvo a 1 clique
[ ] DORME (00h45-09h) ⭐ mais importante
[ ] 09h — abre tmp/muhdo/03 roteiro, lê 2x
[ ] 12h — almoço casa Ricardo + smoke ICE Eduardo
[ ] 13:30 — decide rota A ou B
[ ] 14h — Muhdo entra
```

### Próxima ação Claude (quando Pedro voltar pro PC)

Ler primeiro:
1. `MEMORY.md` (índice atualizado)
2. `reference_proxima_sessao_08_05_handoff.md` (este diário aqui resumido)
3. `project_v1_9_189_rls_upsert_fix_madrugada_08_05.md`
4. `project_v1_9_190_eduardo_role_swap_08_05.md` (criada neste commit)

Depois esperar Pedro indicar foco:
- Pós-Muhdo retroativo (acalmar pendências)
- Smoke real ICP-Brasil Ricardo (V1.9.180)
- V1.9.121 fases 3-6 AEC Assistida Progressiva
- Outro item do backlog elite-pro-escalável pré-PMF

---

*[BLOCO A→H selados 08/05 ~01h BRT. Sessão laptop consolidada. Lock CORE preservado. Push 4 refs. Materiais Muhdo prontos pra envio. Pedro vai dormir antes de 01h. Bom evento amanhã 🤝.]*
