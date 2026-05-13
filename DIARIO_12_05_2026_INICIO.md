# 📓 Diário 12/05/2026 — Início do dia

**Autor:** Pedro Henrique Passos Galluf (CTO MedCannLab)
**Co-autor:** Claude Opus 4.7 (1M context)
**HEAD git ao iniciar dia:** `2072d18` (V1.9.231 selada na virada 11→12)
**Lock CORE intocado:** V1.9.95 + V1.9.97 + V1.9.98 + V1.9.99-B

---

## BLOCO A — Recap factual dos 3 últimos dias (09 → 11/05)

### Dia 09/05 — Virada para execução + Freeze estrutural
- Blueprint Ciclo Fechado v2 cristalizado (5 estágios, 3 gaps, 9 decisões clínicas)
- Princípio 48: **Freeze de análise estrutural até 16/05/2026** (ROI decrescente após 4 iterações pré-PMF)
- Princípio 49: **Gap operacional humano nos 3 gates duros 60d** (CNPJ + Ricardo + Muhdo)
- Princípios 50-51: ACDSS catalogado como fóssil decomposto; sistema real > sistema abstrato
- 3 ações externas próximas 72h identificadas (~50min totais): contador CNPJ, Ricardo A4+caneta, Muhdo D+1

### Dia 10/05 — Sprint 1 Devolution DEPLOYED + Tier S hardening
- **11 commits push 4 refs em 24h**
- V1.9.200 Sprint 1 backend (ciclo médico→paciente)
- V1.9.201 Tier A polish, V1.9.202 selo visual
- 3 riscos regulatórios eliminados:
  - V1.9.203 ACDSS hide
  - V1.9.206 mock Pesquisa
  - V1.9.207 banner CRM + UF signup CFM 2.314
- V1.9.204 fix Carolina, V1.9.205 Tier S hardening
- V1.9.208 view `v_clinical_cycle_health` (KPI Muhdo D+7 closed-loop=0% honesto)
- V1.9.209 Promise.all + Sentry observabilidade

### Dia 11/05 — Sessão cirúrgica empírica (Pedro paciente + Ricardo Carolina)
- 6 commits sessão dirigida por uso real
- V1.9.214 card redundante removido
- V1.9.215 timeout/telemetria/paralelo (introduziu regressão própria)
- V1.9.216 corrigiu regressão (wording + msg-por-fase + SMART_SCHEDULING_GUARD validado 5×)
- V1.9.217 timezone Edge 7 fixes
- V1.9.218 verbatim "O que mais?" COMPLAINT_DETAILS
- V1.9.219 datas appointments client (split ISO)
- V1.9.220+221 paradores "soisso" + consensus "isso"
- V1.9.222 ARQ-1 médico-alvo dado de 1ª classe (6 arquivos, 90 LOC)
- V1.9.223 email regex signup
- V1.9.224 is_remote=true default scheduling
- V1.9.225-227 reviewStatus mapping + Validados + idempotência CFM 2.314
- DELETE 3 rules duplicadas Ricardo (audit JSON parqueado)
- **Track record honesta:** V1.9.215 introduziu regressão própria, corrigida V1.9.216 mesmo dia
- Telemetria validada: RATIONALITY é gargalo real (16-20s, 55% latência), não cleanup_pass
- Princípios 52-55 cristalizados (dry-run mental / 5 perguntas pré-classificar / cross-impact registry / governance Pedro×Ricardo)

---

## BLOCO B — Sessão virada 11→12 (este diário)

### Plano "cadeado AEC triple-A escalável" executado

Pedro perguntou tirando Stripe/CNPJ o que precisa pra app ficar selado igual cadeado AEC. Eu mapei 4 itens auto-executáveis + 2 bloqueados em humanos externos. Executamos os 4 com push 4 refs sem regressão.

| Versão | Item | Resultado |
|--------|------|-----------|
| **V1.9.228** | Backfill is_remote em appointment futuro órfão (Cristiano) | 1 UPDATE empírico; Cristiano agora recebe reminders 24h/1h/30min/10min/1min |
| **V1.9.229** | Signup profissional obrigatório fee+specialty + trigger persiste council | Migration handle_new_user lê council_*+fee da metadata; Landing.tsx valida obrigatório; AuthContext propaga 9º param |
| **V1.9.230** | Cleanup IMRE/ACDSS fossil | 5 arquivos deletados (~1500 LOC), App.tsx Route → Navigate redirect, rotasIndividualizadas.ts ajustado. **33 erros TS → 0** |
| **V1.9.231** | ICP-Brasil em patient_exam_requests | Migration 7 colunas ICP, Edge digital-signature com `documentType` param backward-compat, ExamRequestModule.tsx +275 LOC (banner+watermark+idempotência), Edge deployed via PAT |

### Sub-aprendizados/correções desta sessão

1. **Memória "34/35 medical_certificates DRAFT" estava ERRADA** — `medical_certificates` é tabela de **certificados ICP do médico em si** (PFX uploads), não atestados. Atestado vive em `cfm_prescriptions.prescription_type='attestation'`.
2. **"8 médicos nunca prescreveram" NÃO É problema** — Pedro corrigiu 2× → métrica de uso ≠ bug operacional. Cristalizado em `feedback_metrica_uso_nao_e_problema_11_05.md`.
3. **Conferir UI real antes de propor estrutura nova** — Pedro mostrou screenshot da Vitrine Profissional já com campo CRM; eu havia proposto adicionar council_type/council_number separados; **revertido antes de commit**. Cristalizado em `feedback_conferir_ui_antes_de_propor_11_05.md`.
4. **ICP-Brasil escopo Ricardo expandido** — aplica a TODOS docs médicos (laudos+atestados+prescricoes+solicitação exames), não só prescrições. Cristalizado em `project_icp_brasil_escopo_total_ricardo_11_05.md`.

### Status empírico ICP-Brasil ao virar o dia

- Ricardo tem **1 cert ativo** (DigitalSign, expira 06/05/2027)
- **38 docs assinados com ICP** pelo Ricardo: 7 prescriptions + 31 reports AEC
- 5 das 7 prescriptions em PKCS#7 REAL (.pfx via V1.9.176)
- 2 prescriptions antigas (31/01) em modo simulação pré-V1.9.176
- 31 reports AEC com signature_hash via Pipeline V1.9.95 (100% sign rate desde 26/04)
- **26 NFTs** geradas (V1+V2+V2_fallback+V3_LLM), 18 com signature_hash, 100% ligadas a reports
- ~14 NFTs com hash idêntico ao report ICP-Brasil (resto re-assinou depois — timeline natural)

---

## BLOCO C — Gaps cristalizados (estado atual, sem inflar)

### Camada 0 (risco irreversível, prioridade absoluta)
- **3 widgets AEC paralelos** — 1 eliminado via V1.9.230 (ClinicalAssessment.tsx órfão). **2 restantes pra mapear** quando paciente externo entrar.

### 🔴 Bloqueio empírico de PMF (gates duros 60d)
- **KPI Muhdo closed-loop = 0%** — Sprint 1 backend deployed em 10/05, mas 0 reports approved até agora. **Bloqueador é humano:** Ricardo+Eduardo precisam aprovar ≥3 reports em 7 dias pra mover KPI.
- **CNPJ formal** — não movido. Bloqueia Stripe/MP, WhatsApp Business, bling/dom contador.
- **Muhdo D+1 email** — pendente desde 08/05. Linha-âncora "biological×semantic drift CKD" pronta.

### 🟡 Adoção operacional (não código)
- **9/10 médicos sem PFX ICP-Brasil upload** em `medical_certificates`. Edge `digital-signature` retorna "Configurar certificado" → médico não consegue assinar. **Onboarding humano** pendente.
- **13 `patient_exam_requests` ainda em draft (0 signed)** — V1.9.231 acabou de subir Edge+UI. Aguarda Ricardo testar 1ª assinatura empírica do tipo novo.
- **Onboarding profissional V1.9.229** ainda **não foi exercido empíricamente** — nenhum médico novo cadastrou após deploy (10/05+). Validação requer próximo signup.

### 🟢 Decisões humanas pendentes (1-pager Ricardo)
- Formula scoring (375/381 ai_assessment_scores hardcoded em 1.5)
- V16 RIM aprovação (PR pronta desde 07/05, anti-kevlar §1 ativo até autorização)
- Bug 3 (anoite), Bug 6 ("O que mais?" cap), RATIONALITY async, UX-4
- Onboarding 9 médicos, button workflow, 3 emails jornada

### ⚪ Ruído estrutural (deixou de existir hoje)
- ~~33 erros TS baseline~~ → V1.9.230 zerou
- ~~Cristiano sem reminders~~ → V1.9.228 corrigiu
- ~~Signup pro sem fee/specialty obrigatório~~ → V1.9.229 corrigiu
- ~~exam_requests sem ICP~~ → V1.9.231 corrigiu
- ~~Notificações do sino não-clicáveis~~ → V1.9.232 corrigiu (exceção legítima ao freeze)

---

## BLOCO E — V1.9.232 (excepção legítima ao freeze 16/05)

Após o diário ser criado, Pedro reportou empíricamente bug UX do sino (50 testers): clicar no texto da notificação não direciona. Autorizou como **exceção legítima ao Princípio 48** (bug UX real reportado por usuários, sem CORE).

### Auditoria empírica
- 167 notifs no DB, 5 tipos (video_call_request 109 / report_shared 43 / video_call_reminder 8 / new_clinical_report 6 / info 1)
- 94% sem `metadata.action_url` populado (apenas video_call_reminder + info têm)
- Pedro admin (17345b36) tem **0 notifs no DB** mas screenshot mostra 4 ("Avalie sua consulta" + "Consulta Concluída")
- Fonte exata das 4 mockadas **não localizada em 8 buscas grep** (possível cache stale, mock residual ou localStorage legacy)
- 4 callsites de `createNotification` mapeados; `clinicalDevolutionService.ts:136` já popula `metadata.action_url` corretamente (V1.9.188-C honrado)

### V1.9.232 — Card clicável + fallback per type (NotificationCenter.tsx, +117/-50 LOC)
- `resolveFallbackRoute(notif, userType)` pura no topo do arquivo: 8 tipos mapeados pra rotas paciente/profissional/admin
- Regex em `title`/`message` captura "Avalie/Avaliar/Conclu" mesmo sem type formal — cobre as 4 mockadas
- Card todo clicável (`onClick` no div) com `cursor-pointer` + hover só quando há rota
- Tipos genéricos (info/success/warning/error) ficam **não-clicáveis** (UX previsível)
- Botões ✓ e ✗ com `e.stopPropagation()` — não disparam navigate
- `role="button"` + `tabIndex` + Enter/Space (a11y)
- `try/catch` no `navigate` (defensivo)
- Marca lida fire-and-forget ao clicar (otimista)

### Anti-regressão validada empíricamente
- type-check 0 erros (baseline preservado de V1.9.231)
- 3 callsites sem action_url ficam cobertos pelo fallback per type
- `clinicalDevolutionService` premium UX preservado (deeplink direto pro report via `metadata.action_url`)
- CORE intocado (AEC FSM, Pipeline, ICP-Brasil, Edge Functions)
- Janela 50 testers preservada (mudança é melhoria UX visível, não bloqueio)

### Achado empírico não resolvido (registro honesto)
- Notifs mockadas do sino do admin Pedro **não rastreadas** ao banco
- Fix universal (regex em title/message) cobre o sintoma
- Fonte original fica como pendência empírica pra audit futuro se reaparecer

---

## BLOCO D — Próximos passos sugeridos (sua decisão)

### Hoje pode (sem bloqueio externo)
1. **Item 4 audit** — mapear os 2 widgets AEC paralelos restantes (~1h só audit, sem código)
2. **Testar empíricamente V1.9.231** — pedir Ricardo assinar 1 exam_request pra validar fluxo end-to-end
3. **Onboarding profissional V1.9.229 dogfood** — cadastrar conta teste profissional novo, validar fluxo signup obrigatório
4. **Item 5 decisões 1-pager Ricardo** — gerar a 1 página A4 enxuta pra Ricardo aprovar 11 itens

### Esperando gate externo
- Stripe + CNPJ (você)
- Aprovações Ricardo (V16, formula scoring, 6 reports approved)
- Email Muhdo D+1

### Freeze ativo (Princípio 48)
- Não criar blueprint v3
- Não criar nova memória estrutural
- Ideias estruturais novas vão pra `IDEIAS_PARKED_PARA_DEPOIS_SPRINT1.md`
- Freeze vigora até **16/05/2026** ou Sprint 1 medindo

---

## Frase âncora do dia

> **"Cadeado AEC virou cadeado APP. Os 4 itens auto-executáveis viraram 4 versões com push 4 refs sem regressão. O que falta agora não é código — é Ricardo aprovar, CNPJ existir, e médico subir PFX."**

### Frase âncora secundária (pós V1.9.232)

> **"Fix universal cobre sintoma mesmo sem origem mapeada — quando empiricamente impossível rastrear fonte (mockada/cache/legacy), regex defensivo + fallback per type resolve o bug do usuário real sem caçar fantasma."**

---

**Estado da sessão virada 11→12 (encerramento parcial — só 1ª sessão):**
- HEAD `5206a95` selado
- type-check **0 erros**
- **5 versões V1.9.228+229+230+231+232** deployadas
- **6 commits** push 4 refs (5 versões + 1 diário)
- CORE intocado em todas
- Janela ~50 testers preservada
- Freeze 16/05 mantido com **1 exceção legítima documentada** (V1.9.232 — bug UX empírico)
- Aguarda movimento humano nos 3 gates duros

---

## BLOCO F — Continuação dia 12/05 (manhã+tarde+noite, registrado retroativamente em 13/05)

### Audits empíricos profundos

| Hora | Item | Resultado |
|------|------|-----------|
| ~10h45 | Item 4 widgets AEC paralelos | ✅ **Desmistificado** — pirâmide intacta. Os "3 widgets" eram (1) ClinicalAssessment.tsx órfão eliminado V1.9.230, (2) `/chat-noa-esperanca` que é ALIAS pro mesmo PatientNOAChat, (3) inexistente. Não havia bypass real |
| ~10h55 | Monitor "O que mais?" pós-V1.9.218 | ✅ Empírico: 31 sessões pós-fix com **exatamente 1 OQM cada** (zero loop). Outlier de 97 era session_id=NULL (rows órfãs legacy). Bug 6 Ricardo provavelmente **resolvido sem precisar cap quantitativo** |
| ~13h30 | Audit prescrições casualmusic + ICP Ricardo | ✅ Mapeado: 7 docs assinados ICP-Brasil (5 PKCS#7 real .pfx 06-09/05 + 2 simulação legacy 31/01). 4 docs para Carolina + 1 Pedro Alberto + 2 Gilda. Casualmusic tem 4 docs em DRAFT (Ricardo criou mas não fechou). NFT lógico empírico: 26 NFTs, 18 com signature_hash, ~14 herdam hash ICP-Brasil do report |
| ~15h00 | Audit empírico `meeting_url` | 🚨 **Gap real descoberto:** 0/6 appointments remotos têm meeting_url populado. `meeting_url` só é setado em sync-gcal (half-implemented). bookAppointment + wisecare-session NÃO populam. Em produção, reminder enviava "Link da chamada será disponibilizado" (promessa quebrada) |

### Versões deployadas (sessão tarde+noite)

| Versão | O que entregou | Status |
|--------|----------------|--------|
| **V1.9.233** | Card "Exames Solicitados" extraído em componente reutilizável (`PatientExamRequestsCard.tsx`). Modo híbrido: controlled (PatientAnalytics passa props) OR autonomous (PatientPrescriptions faz própria query). Paciente agora vê exames em 2 rotas: Dashboard analytics + aba Minhas Prescrições | ✅ Selado |
| **V1.9.234** | `<DotPagination />` reutilizável extraído de PatientAppointments. Aplicado em 4 callsites (PatientAppointments cards profissionais + PatientPrescriptions cfmPage + planPage + PatientExamRequestsCard examPage). Padrão visual unificado (chevron + dots cinza→cyan + contador) | ✅ Selado |
| **V1.9.236** | Edge `video-call-reminders` — remove linha "Link: ${meeting_url}" do template (era sempre vazio ou URL fake). Email reminder agora vai apenas com "Acessar Atendimento Integrado" (link que funciona). Edge re-deployed via PAT | ✅ Selado |
| **V1.9.237** | Densificação laptop 1280x720+ — 3 arquivos paciente: PatientDashboard (container `p-6` + `space-y-6` + hero menor), PatientHeaderActions (`p-4` + `space-y-2`), PatientStats (`gap-3` + cards `p-4 md:p-5`). Mobile preservado. Ganho ~100px altura útil. Aplicado pré-evento quinta 15/05 | ✅ Selado (00h30 13/05) |

### Smoke-test empírico (12/05 ~14h45)

3 emails de agendamento disparados via Edge `send-email` pra `phpg69@gmail.com`:
- Email 1: "✅ Consulta Confirmada" → ✅ chegou
- Email 2: "Sua consulta começa em 10 minutos" → ✅ chegou mas com bugs
- Email 3: "Sua consulta começa em 1 minuto" → ✅ chegou mas com bugs

**Bugs reportados pelo Pedro:**
- 🔴 Encoding UTF-8 quebrado (`Olá` → `Ol�`, `Valença` → `Valen�a`, emojis `👤🔗` → `??`). Hipótese: meu curl Windows Git Bash converteu UTF-8 pra ANSI no transporte. Re-teste com Unicode escape disparado (Resend ID `6f0fcaca`) — **resposta empírica pendente** se chegou bonito
- 🟡 Link `meeting_url` placeholder fictício deu erro real → corrigido em V1.9.236 (removido)
- ✅ Link "Acessar Atendimento Integrado" funciona corretamente

### Princípios cristalizados / atualizados

- **Métrica de uso ≠ problema operacional** (cristalizado em sessão 11/05, aplicado várias vezes 12/05)
- **Conferir UI real antes de propor estrutura nova** (reverti expansão Profile.tsx antes de commit quando Pedro mostrou screenshot da Vitrine que já tinha CRM)
- **Fix universal cobre sintoma mesmo sem origem mapeada** (cristalizado V1.9.232, aplicado também em V1.9.236)

### Estado real do encerramento 12/05 (verdadeiro)

- HEAD: `2e9e40a` (V1.9.237)
- **10 commits sessão dupla 11→12** (5 versões + 1 diário + V1.9.233 + V1.9.234 + V1.9.236 + V1.9.237 + atualizações)
- Wait, recontar: V1.9.228, 229, 230, 231, 232, 233, 234, 236, 237 = **9 versões** + diário + update diário = **11 commits**
- type-check **0 erros** preservado em TODAS
- CORE intocado em TODAS
- Janela ~50 testers preservada
- Freeze 16/05 mantido — **5 exceções legítimas documentadas** (V1.9.232 sino + V1.9.233 card exames + V1.9.234 dots + V1.9.236 link quebrado + V1.9.237 densificação laptop)
- 4 auditorias empíricas profundas via PAT
- Aguarda movimento humano nos 3 gates duros (CNPJ + Ricardo + Muhdo)

### Frase âncora terciária (encerramento real 12/05 → 13/05)

> **"O que era pra ser 1 sessão virou 2. O que era pra ser cadeado virou app inteiro densificado. 9 versões em 36h sem regressão — porque o caminho era polir empíricamente, não inventar."**
