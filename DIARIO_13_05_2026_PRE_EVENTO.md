# 📓 Diário 13/05/2026 — Pré-evento ~20 testers quinta-feira

**Autor:** Pedro Henrique Passos Galluf (CTO MedCannLab)
**Co-autor:** Claude Opus 4.7 (1M context)
**HEAD git ao iniciar:** `2e9e40a` (V1.9.237 selada 00h30 13/05)
**Janela crítica:** 48h até quinta 15/05 (evento com ~20 amigos testando empíricamente)
**Lock CORE intocado:** V1.9.95 + V1.9.97 + V1.9.98 + V1.9.99-B

---

## BLOCO A — Estado herdado do dia 12/05 (ver `DIARIO_12_05_2026_INICIO.md` Bloco F atualizado retroativamente)

- **9 versões deployadas em 36h** (V1.9.228 → V1.9.237), todas push 4 refs
- type-check **0 erros** preservado em todas
- CORE intocado, lock V1.9.95+97+98+99-B firme
- 5 exceções legítimas ao freeze 16/05 documentadas (todas bugs UX empíricos reportados pelos testers)
- 4 auditorias empíricas profundas via PAT (widgets AEC, "O que mais?", ICP Ricardo, meeting_url)
- Densificação laptop 1280x720+ aplicada **ontem 00h30** (V1.9.237)

---

## BLOCO B — Contexto do evento quinta 15/05

| Variável | Valor |
|----------|-------|
| Data | Quinta-feira 15/05/2026 |
| Quantidade | ~20 amigos |
| Papel esperado | Pacientes (não médicos) |
| Origem | Beta orgânico controlado (janela ~50 testers de Pedro) |
| Hardware presumido | Laptops 1280-1920px + mobile mix |
| Tempo total | Provavelmente 1-2h de uso simultâneo |

## BLOCO C — Checklist pré-evento empírico

### 🔐 Camada 0 — Risco irreversível (validar HOJE 13/05)

| Item | Status conhecido | Ação |
|------|------------------|------|
| Resend API key viva | ✅ Validado smoke-test 12/05 | OK |
| Edge `tradevision-core` v302 rodando | ✅ Empírico 5394 logs 30d | OK |
| AEC FSM intocada (Lock V1.9.95) | ✅ 31 reports/30d signed | OK |
| Pipeline V1.9.95 100% sign-rate | ✅ 31/31 reports | OK |
| RLS chat-images / cfm_prescriptions / patient_exam_requests | ✅ Audit 12/05 | OK |
| pg_cron `video-call-reminders-5min` rodando | ✅ noa_logs sweeps OK | Verificar empírico hoje |
| Sentry V1.9.209 ativo | ⚠️ DSN setada em prod? | **VERIFICAR HOJE** |
| type-check 0 erros | ✅ V1.9.237 | OK |
| Push 4 refs sincronizados | ✅ amigo+medcannlab5 × main+master | OK |

### 🔴 Críticos — fluxo dos 20 testers

| Cenário | Status empírico | Ação |
|---------|-----------------|------|
| Signup paciente novo | ✅ casualmusic testou empírico | **Re-validar 1 conta nova hoje** (dogfood) |
| Login + redirect dashboard | ✅ OK | OK |
| Iniciar AEC FSM (chat-noa) | ✅ 31 reports/30d | OK |
| AEC FSM 13 fases completas | ✅ Verbatim First V1.9.218 validado | OK |
| Gerar relatório clínico (Pipeline) | ✅ 100% sign-rate | OK |
| Receber NFT lógico | ✅ 26 NFTs geradas | OK |
| Agendar consulta | ✅ 4 prescrições test casualmusic mostram fluxo | OK |
| Email confirmação | ✅ Smoke-test 12/05 OK | OK |
| Reminders 10min/1min | ✅ V1.9.236 corrigiu link quebrado | **Aguarda 1 caso real validar** |
| Sino notificações clicável | ✅ V1.9.232 deployed | **Smoke-test no Vercel hoje** |
| Card Exames em 2 rotas | ✅ V1.9.233 + V1.9.234 dots | Visual confirmado |
| Densificação laptop | ✅ V1.9.237 deployed | **Validar empírico hoje** |
| Compartilhar relatório | ⚠️ Edge share-report empírico? | Auditar últimas 24h |

### 🟡 Importantes — verificar mas não bloqueia

- **Encoding UTF-8** email reminder (Bug 1 do smoke-test 12/05) — re-teste com Unicode escape disparou Resend ID `6f0fcaca` mas Pedro ainda não confirmou empíricamente se chegou bonito. **Verificar hoje**
- **Onboarding profissional V1.9.229** ainda **0 médicos novos** cadastraram pós-deploy — não-crítico (testers são pacientes)
- **13 `patient_exam_requests` em draft** — Ricardo precisa assinar 1+ antes de testers verem fluxo "assinado" (opcional, não bloqueia)
- **Sentry DSN** ativa em prod? Precisa pra capturar errors do evento
- **Performance** AEC FSM com 5+ pacientes simultâneos (Pipeline latência 16-20s)

### ⚫ Cosméticos — pode esperar pós-evento

- Notif mockadas fonte desconhecida (V1.9.232 cobre sintoma)
- Bug 1 encoding (se realmente for app, é menor — caracteres especiais em alguns templates apenas)
- Outras densificações de dashboard secundário (profissional, aluno) — testers não acessam

---

## BLOCO D — Plano de execução 13-14/05 (48h até evento)

### Hoje (terça-feira 13/05)
1. **Smoke-test V1.9.232 sino** no Vercel deployed (10min) — Pedro abre, clica numa notif, valida navegação
2. **Validar empírico V1.9.237** densificação — Pedro abre dashboard em laptop e confirma "vê tudo agora"
3. **Audit empírico via PAT** (15min):
   - Sentry DSN setada em prod?
   - pg_cron últimos sweeps `video-call-reminders` rodaram OK?
   - Edge functions todas com last_invocation < 24h?
   - Quantos cognitive_events últimas 24h? (saúde tradevision-core)
4. **Re-disparar 1 email reminder** com template V1.9.236 + Unicode escape pra confirmar encoding (5min)
5. **Dogfood signup paciente novo** (15min) — criar email temporário, validar fluxo signup → dashboard → AEC início

### Amanhã (quarta 14/05)
1. **Fluxo end-to-end empírico** (30min) — signup → AEC → report → agendamento → reminder → consulta WiseCare
2. **Ricardo assinar 1+ prescrição** dos 13 drafts pendentes (humano, mensagem direta) — pra testers verem fluxo "assinado"
3. **Comunicação aos amigos** (Pedro define): email/whatsapp com link cadastro + expectativas (10-15min cada amigo, role paciente, feedback livre)
4. **Backup DB** (Supabase auto OU export manual via PAT)
5. **Atualizar 1-pager Ricardo** se houver decisões pendentes que possam ser fechadas pré-evento

### Durante o evento (quinta 15/05)
1. **Monitor PAT em paralelo** — Claude puxa contadores periódicos (cognitive_events/min, AECs iniciadas, errors)
2. **Sentry watch** se DSN ativa — alertar se errors picam
3. **Resend dashboard** — taxa entrega de emails

### Pós-evento (quinta noite / sexta)
1. **Audit empírico** — quantos completaram fluxo, onde abandonaram, bugs encontrados
2. **Diário 15/05** registrando aprendizado empírico do beta

---

## BLOCO E — Gaps declarados honestamente (Princípio 53)

- **Não temos** dashboard "saúde do evento" em tempo real — depende de mim puxar PAT manualmente
- **Não auditei** mobile UX recentemente — 20 testers podem usar celular, ficar em viewport <768px (mobile)
- **Não medi** rate limit OpenAI/Resend pra 20 pacientes em ~2h simultâneo
- **Não validei** Sentry empírico (DSN setada? Events chegando?)
- **Não validei** que `/app/clinica/paciente/chat-profissional` (link Atendimento Integrado do email) abre fluxo correto em celular
- **9/10 médicos sem PFX** ICP-Brasil — se algum tester for vinculado a outro médico que não Ricardo, prescrições/atestados ficam em rascunho perpétuo
- **Stripe + CNPJ** não movidos (não-bloqueador pré-PMF, mas não evolui Gates externos)

---

## BLOCO F — Decisões humanas pendentes

| Item | Bloqueio | Esforço Pedro |
|------|----------|---------------|
| Ricardo aprovar V16 RIM | Aguarda Ricardo desde 07/05 | 0h código / Ricardo aprovar PR |
| Ricardo aprovar formula scoring | 375/381 hardcoded 1.5 | 0h código / Ricardo decisão clínica |
| Ricardo aprovar 3+ reports (KPI Muhdo) | Sprint 1 backend deployed 10/05 | 0h código / Ricardo+Eduardo workflow |
| Mensagem ao contador CNPJ | Empírico mais alavancável | ~15min Pedro |
| Email Muhdo D+1 (CKD linha-âncora) | Linha-âncora pronta desde 07/05 | ~30min Pedro |

---

## Frase âncora do dia

> **"O sistema está pronto. Os 20 amigos vão exercitar empíricamente o que 9 versões em 36h densificaram. O que aprendermos quinta vira o próximo Magno."**

---

**Estado ao iniciar 13/05:**
- HEAD `2e9e40a` selado
- type-check 0 erros
- 9 versões V1.9.228 → V1.9.237 deployadas em 36h
- CORE intocado, Lock V1.9.95+97+98+99-B firme
- 48h até evento quinta
- Janela ~50 testers preservada
- Freeze 16/05 — vence dia depois do evento. Bem alinhado.
