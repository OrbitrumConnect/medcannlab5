# DIARIO 29/05/2026 — Roadmap "App 100% pronto sem regressão"

**Sessão**: madrugada 29/05 (continuação da maratona 28→29/05) — fechamento da Auditoria Integral + planejamento próxima fase.
**Estado**: pós-auditoria 10 docs entregues / 17 commits sessão / 4 memorias NÍVEL 1 cristalizadas.

---

## 🎯 OBJETIVO DESTA SESSÃO E DESTE DIÁRIO

Definir o que falta empíricamente para o app MedCannLab ficar **100% pronto pra Marco 2** (1º paciente externo pagante real), **sem regressão**.

**Base**: Auditoria Integral 28-29/05 (10 docs em `docs/audit/`) + 4 memorias NÍVEL 1 + retrospectiva mensal + diários acumulados.

---

## 🔬 BLOCO A — Estado atual empírico (consolidado)

### Vital signs PAT 29/05 ~00h40
- **140 tabelas** públicas / 142 com RLS / 451 policies / 89 triggers / 176 FKs
- **64 tabelas vazias** (45% sprawl arquitetural não-fatal)
- **14 Edges** ativas (12 com `verify_jwt=false`, 2 com `true`)
- **8 buckets Storage** (7 privados + 1 público esperado)
- **50 users public** / 44 users auth (8 órfãos públicos, 2 órfãos auth)
- **145 reports** assinaveis (87% INTERNOS, 13% externos)
- **48 prescrições CFM** (60% EXTERNAS — único caso externo dominante, 79% draft)
- **93 appointments** (44% cancelled — preocupante)
- **13 AECs** estado FSM (9 INTERRUPTED, 4 COMPLETED — 69% drop-off)
- **18 evoluções FOLLOW_UP** escritas por 4 médicos (Matrix não lê — Camada 1.2 pendente)
- **11 dossiês Matrix** (100% internos)
- **2 feedback_tickets** (ambos PAT smoke)

### Saúde por dimensão (vereditos da auditoria)
| Dimensão | Estado | Bloqueador imediato |
|---|---|---|
| 🟢 Técnica | SAUDÁVEL | (nada crítico) |
| 🟢 Clínica | PRESERVADA | Camada 2.3 plano terapêutico (UI nunca codada) |
| 🟡 Regulatória | MELHORÁVEL | **PII em `clinical_rationalities.assessment`** 88.5% rows |
| 🟡 Fluxo | ATENÇÃO | 44% appts cancelled, 69% AECs interrupted, 79% prescrições draft |
| 🟢 Filosófica | COERENTE | (norte Ricardo respeitado) |

---

## 🚨 BLOCO B — O que FALTA pra app ficar 100% pronto

### B.1 — Bloqueador absoluto (P0) pra Marco 2

**Bloqueador único**: `V1.9.452 PII sanitize` em `clinical_rationalities.assessment`
- **88.5% das rows com nome do paciente em texto livre** (memória 27/05)
- Risco LGPD direto se 1º paciente externo pagante entrar antes
- Backlog P0 há **28 dias** sem mitigação
- Fix conhecido: helper `sanitizeAssessmentPII(assessment, patientName, patientId)` em `casePseudonymization.ts` + chamar nos pontos de write (linhas 575+603 de `rationalityAnalysisService.ts`)
- Custo estimado: ~3-4h dev + smoke
- Risco regressão: 🟡 MÉDIO (mutilação clínica se sanitização agressiva — smoke obrigatório com 3 racionalidades reais)

### B.2 — Segurança imediata (executar HOJE)

| # | Ação | Tempo | Por quê crítico |
|---|---|---|---|
| 1 | **Rotar PAT sessão** (`sbp_cc2afa...`) | 2 min | Exposto Push Protection log GitHub HOJE |
| 2 | **Rotar 2 PATs `.claude/settings.local.json`** | 5 min | Não vazaram (no `.gitignore`) mas no disco local |
| 3 | **Corrigir `npm run deploy:tradevision`** (remover `--no-verify-jwt`) | 5 min | Restaura defesa-em-camadas (bomba 22/05 cumprida) |

### B.3 — Decisão humana destravadora (precisa Ricardo)

**3 perguntas pendentes pro Ricardo** (memory `project_matrix_roadmap_camadas_1_2_3_28_05`):

1. Matrix deve ler 18 `FOLLOW_UP` (evoluções médico) + dossiês prévios + relatórios AEC — OR também 6070 `chat_interaction` (conversas paciente↔Nôa)?
2. Lê automático cada turno OR sob toggle médico (anti V1.9.318 DOC_LIST hijacking)?
3. **Plano terapêutico** — construir feature primeiro (`patient_therapeutic_plans` schema completo, 0 rows, UI nunca codada) OR Matrix só lê o que já existe?

Sem essas respostas: Camada 2 do roadmap Matrix-Longitudinal fica BLOQUEADA. **Buraco arquitetural REAL** descoberto na auditoria.

### B.4 — Quebra uso real (P1, próximos 14 dias)

| Item | Impacto |
|---|---|
| **UI gerir AECs interrupted** (9 órfãs sem caminho de retomar/cancelar) | Backlog P1 cresceu 5→9 sem mitigação. Sem UI Ricardo decide manualmente via PAT |
| **Camada 1.5 aba Evolução separar 3 fontes** (`PatientsManagement.tsx` 1055-1162) | FOLLOW_UP + AEC + chat_interaction misturados confunde Ricardo |
| **Investigar drop-off 44% appts cancelled** | Sample qualitativo: quem cancelou? por quê? UX gap ou comportamento real? |
| **Investigar 5 órfãos `public.users`** reais sem `auth.users` | Inclui `joao.vidal@remederi.com` (sócio CNPJ Marco 1) — pode ser cadastro antigo |

### B.5 — Atrito de fluxo (P2, próximos 14-30 dias)

- Mensagem Ricardo WhatsApp (rascunho entreguei sessão 28/05) — destrava B.3
- Smoke V1.9.480-486 empíricos (6 features sem validação real ainda)
- Cleanup duplicata feedback PAT teste (2 tickets criados meus)
- Migrar WiseCare homolog → produção (memorias antigas mencionam)

### B.6 — Polish (P3, próximos 30-60 dias, pós-Marco 2)

- Drop ~12 tabelas safe (após `pg_dump` completo): legacy mensagens + `ai_chat_history` + `ai_saved_documents` + `patient_prescriptions` + 3 backups abril
- Auditar 10/14 Edges sem confirmação `auth.getUser()` interna
- Auditar RLS policies redundantes
- Compliance Supabase: Pro plan ($25/mês) → habilita PITR + pgaudit
- Migrar região `sa-east-1` (se ANVISA pedir)
- DPO designation (1 dos sócios)
- Termo formal LGPD Art. 33 + CFM 2.314 (advogado especialista)
- 1Pure parceria 5 condições + 3 versões posicionamento
- CNPJ Marco 1 (João Vidal) — destrava recebimento direto / pricing / parcerias / DPO formal

---

## 🛡️ BLOCO C — Princípios anti-regressão cristalizados HOJE

Aplicáveis a TODA ação de B.1-B.6:

### C.1 — Validar empíricamente antes de codar
**Memory**: `feedback_validacao_empirica_screenshot_maior_que_plano_teorico_28_05`

Antes de cada item:
- Existe trigger empírico real? OR é especulação?
- Estado atual via PAT/grep mapeado?
- Comportamento real do usuário avaliado?
- 40% interno reconhecido como viés?

### C.2 — Polir-não-inventar (Princípio 8)
Antes de criar componente/tabela/feature nova:
- Buscar mecanismo equivalente que já existe
- Reusar > criar paralelo
- Auditoria comprovou: 70% do conteúdo dos 12 docs propostos pelo GPT externo já existia disperso

### C.3 — Anti-cristalização-prematura
Não codar feature pra fluxo que não existe empíricamente:
- Marco 2 ainda ZERO paciente externo pagante
- Camada 2.3 plano terapêutico — esperar trigger Ricardo, não construir especulativo
- Drop tabelas — só após Marco 2 + pg_dump

### C.4 — Anti-overclaim (Babylon/Watson/Olive)
Frases proibidas em material institucional/landing/pitch:
- "Sistema operacional clínico-longitudinal" (overclaim — auditoria 06/07/10 §2 explicitou)
- "5 racionalidades automáticas" (real: 1 + 4 sob demanda médica)
- "Multi-médico operacional" (real: 1 médico operacional + 1 paciente externo confirmado)

### C.5 — Separação semântica > expansão
**Memory**: `feedback_sistema_tem_contexto_demais_falta_semantica_clinica_28_05`

Antes de adicionar nova fonte ao corpus/UI:
- Fontes existentes estão separadas semanticamente?
- Médico distingue empíricamente?
- 3 perguntas obrigatórias respondidas

### C.6 — Hierarquia de risco cristalizada
1. 🔐 Irreversíveis (PII leak, security, perda de dados)
2. 🔴 Quebra uso real
3. 🟡 Atrito fluxo
4. ⚫ Polish/arquitetura

Sempre priorizar nesta ordem.

### C.7 — Smoke matrix obrigatório pra features deployed
**Padrão emergente da sessão 28/05**: 6 features (V1.9.480-485-A) commitadas + push + Vercel deploy SEM smoke empírico empíricamente real. Risco: bug silencioso.

Toda feature de output (PDF, email, link share, modal novo) precisa:
- **Smoke 1 interno** (você testa)
- **Smoke 2 cross** (Ricardo OR Eduardo testa)
- **Smoke 3 externo** quando Marco 2 (paciente real)

---

## 📋 BLOCO D — Sprints próxima fase (29/05+)

### Sprint A — Segurança (1-2h, HOJE)
1. Rotar 3 PATs
2. Corrigir `deploy:tradevision`
3. Re-deployar `tradevision-core` v423 com `verify_jwt=true` restaurado
4. Validar via PAT que flag voltou pra `true`
5. Smoke: chamar Edge sem JWT → deve retornar 401

### Sprint B — PII P0 (3-5h, próximos 2-3 dias)
1. Validar smoke 4/4 PASS de `sanitizeAssessmentPII` helper (cristalizado em memory)
2. Aplicar nos 2 pontos de write (`rationalityAnalysisService.ts` 575 + 603)
3. Reusar `pseudonymizePatientReferences` V1.9.407 (polir-não-inventar)
4. Backfill 130 rows históricos? OR `ALTER COLUMN assessment SET NOT NULL`? Decidir.
5. Type-check + commit + push + smoke 3 racionalidades reais

### Sprint C — Decisão Ricardo (Pedro manda, Ricardo responde, ~1-2 dias dist)
1. Mandar 3 perguntas (rascunho entreguei)
2. Esperar resposta
3. Cristalizar memory `project_camada_2_matrix_ricardo_aprovou` OR `project_camada_2_matrix_ricardo_descontinuou`

### Sprint D — Camadas Matrix 1.5 + 1.2 (~6-9h, próximos 7 dias, pós-resposta Ricardo)
1. **1.5**: Aba Evolução separa visualmente 3 fontes (`PatientsManagement.tsx` refator)
2. **1.4**: UI toggle médico por fonte (preparar pra 1.2)
3. **1.2**: `usePatientLongitudinal` lê `clinical_assessments FOLLOW_UP` (18 rows reais)
4. Smoke matrix 4 cenários (paciente Carolina / Maria Pinto / Pedro #6ACF / paciente novo sem dados)

### Sprint E — UI AECs interrupted (~3-4h, próximos 7 dias)
1. Component `AECsInterruptedManager.tsx` no Admin painel
2. Lista 9 órfãs + ação retomar/cancelar/invalidar com motivo
3. RLS: só admin (Ricardo, Pedro)
4. Audit log obrigatório
5. Smoke 1 caso real (Solange 30d)

### Sprint F — Investigação drop-off (~2-3h, próximos 14 dias)
1. PAT pra puxar 41 cancelled appointments com `notes` + `cancelled_at` + `cancelled_by`
2. Sample qualitativo: 10 representativos
3. Cruzar com `tr_set_referral_marco_zero` (trigger pode estar mexendo)
4. Cristalizar memory empírica: "44% cancelled é gap UX OR comportamento real"

### Sprint G — 5 órfãos `public.users` (~1-2h, próximos 14 dias)
1. PAT investigar cada um: appointments? reports? chats?
2. Decidir: re-criar auth (se quiser logar) OR anonymizar OR deletar
3. Atenção especial: `joao.vidal@remederi.com` (sócio CNPJ Marco 1)
4. Cristalizar como caso resolvido

### Sprint H — Cleanup pós-Marco 2 (~4-6h)
- Só após 1º paciente externo entrar
- `pg_dump` completo
- Drop ~12 tabelas safe
- Re-auditoria 60d depois

---

## 🎯 BLOCO E — Definição "App 100% pronto sem regressão"

### Critérios de prontidão pra Marco 2

| # | Critério | Status atual | Sprint que entrega |
|---|---|---|---|
| 1 | PII em `clinical_rationalities.assessment` sanitizado | ❌ 88.5% rows vazadas | B |
| 2 | `tradevision-core` `verify_jwt=true` restaurado | ❌ false desde 6 dias | A |
| 3 | 3 PATs rotacionados | ❌ Pendente | A |
| 4 | Camada 2.3 plano terapêutico decidida (construir OR descontinuar) | ❌ Bloqueada Ricardo | C+? |
| 5 | UI gerir AECs interrupted | ❌ Sem UI | E |
| 6 | Smoke matrix 4 cenários V1.9.480-486 | 🟡 Parcial | smoke contínuo |
| 7 | Compliance Supabase básico (Pro plan + PITR + pgaudit + Termo LGPD) | ❌ Pendente | depende CNPJ |
| 8 | DPO designation (1 sócio) | ❌ Pendente | depende CNPJ |
| 9 | Migrar WiseCare homolog → produção | ❌ Pendente | revisar |
| 10 | Drop ~12 tabelas safe | ❌ Pós-Marco 2 | H |

### Definição "sem regressão"

Cada mudança nos Sprints A-H deve:
1. **Type-check verde** antes de commit
2. **Push 4 refs** (amigo + medcannlab5 × main + master) — política CLAUDE.md
3. **Smoke matrix 1+2+3** quando aplicável (interno + cross + externo)
4. **Validação empírica via PAT** quando envolve dados
5. **Memory atualizada** se cristaliza princípio novo
6. **Diário do dia** com bloco do que foi feito

---

## 🔄 BLOCO F — Triggers e checkpoints

### Triggers explícitos (eventos que desbloqueiam progresso)

| Trigger | Desbloqueia |
|---|---|
| CNPJ Marco 1 João Vidal | Pro plan Supabase + DPO formal + recebimento direto + pricing + 1Pure parceria |
| Ricardo responder 3 perguntas | Camadas Matrix 1.2 + 1.4 + 2.3 |
| Eduardo trazer 2-3 pacientes neuro reais | Fase B Sidecar Neuro Edge codada |
| 1º paciente externo pagante | Cleanup ~12 tabelas / re-auditoria / WiseCare produção |
| Auditor ANVISA canal | Enviar SGQ AUDITOR sanitizado |

### Checkpoints empíricos (validar ao longo do caminho)

| Frequência | Checkpoint |
|---|---|
| A cada deploy Vercel | Smoke 1+2 mínimo |
| Semanal | Vital signs PAT (interações/30d, prescrições, AECs) |
| Quinzenal | 1 QA run formal `clinical_qa_runs` (cadência cristalizada 26/05) |
| Mensal | Retrospectiva + diário consolidado |
| 30/60 dias após cada mudança grande | Comparação delta empírica |

---

## 📊 BLOCO G — Memorias NÍVEL 1 acumuladas até 29/05

(Catálogo pra próxima sessão Claude começar com contexto)

1. `feedback_validacao_empirica_screenshot_maior_que_plano_teorico_28_05` — princípio meta
2. `feedback_sistema_tem_contexto_demais_falta_semantica_clinica_28_05` — princípio meta
3. `project_matrix_roadmap_camadas_1_2_3_28_05` — roadmap Matrix-Longitudinal
4. `feedback_share_overwrite_professional_id_e_admin_visibilidade_28_05` — descoberta empírica
5. `feedback_racionalidades_pipeline_gera_1_medico_aciona_4_28_05` — baseline empírico
6. `project_auditoria_integral_completa_sprints_0_5_29_05` — auditoria 10 docs entregue
7. (acumuladas anteriores ~261)

---

## 🪶 BLOCO H — Frase âncora do roadmap

> *"App ficar '100% pronto sem regressão' pra Marco 2 significa: (1) PII P0 resolvido (Sprint B, 3-5h), (2) Segurança restaurada (Sprint A, 1-2h), (3) Camada 2.3 decidida com Ricardo (Sprint C), (4) UI AECs interrupted (Sprint E), (5) Camadas Matrix 1.2+1.4+1.5 entregues (Sprint D pós-Ricardo). Total: ~15-25h dev distribuídos em 3-5 sessões + 1-2 dias resposta Ricardo + decisões CNPJ. Anti-regressão: princípios cristalizados aplicados em cada mudança (validação empírica > inferência, polir-não-inventar, anti-cristalização-prematura, anti-overclaim, separação semântica > expansão, hierarquia de risco, smoke matrix obrigatório). Auditoria Integral entregue (10 docs) como ponto de partida e referência empírica permanente."*

---

## 📋 PRÓXIMA SESSÃO Claude — instruções de ordem

**LER NESTA ORDEM**:
1. `CLAUDE.md` (entry point sempre)
2. `MEMORY.md` (índice NÍVEL 1)
3. **`docs/audit/11_OPERATIONAL_PRIORITIES_E_12_EMPIRICAL_VERDICTS.md`** (auditoria fechada)
4. **`docs/audit/01_SYSTEM_STATE_28_05_2026.md`** (estado atual)
5. **Este diário** (roadmap "100% pronto")
6. `DIARIO_28_05_2026_SIDECARS_COGNITIVOS_E_STACK_COMPLETO.md` (Blocos A-J)
7. `DIARIO_27_05_2026_MATRIX_Z2_BULA_E_LOCKS_ANTI_DRIFT.md` (Blocos A-N)

**PRIMEIRA AÇÃO sugerida** (Pedro próxima sessão): Sprint A (segurança, 1-2h) — rotar 3 PATs + corrigir deploy script + re-deployar `tradevision-core` com flag restaurada.

**SEGUNDA AÇÃO**: Sprint B (PII P0, 3-5h) — `sanitizeAssessmentPII` helper + aplicar nos 2 writes + smoke 3 racionalidades reais.

**TERCEIRA AÇÃO**: Pedro mandar 3 perguntas Ricardo no WhatsApp (rascunho está em sessão 28/05).

**NÃO INICIAR Sprint D/E/F sem A+B+C concluídos**.

---

Sessão 28→29/05 fechada. **17 commits** + **10 docs auditoria** + **6 memorias NÍVEL 1** + **roadmap 100% pronto cristalizado**. Próxima sessão começa com base empírica completa. 🌙

---

## 🔬 BLOCO I — Validação empírica cruzada (PAT + git + diários + retrospectiva + memorias)

**Método**: cruzar TUDO disponível pra validar cada item do roadmap não-narrativamente.

### I.1 — Atividade últimas 48h (PAT 29/05 ~00h50)

| Métrica | Valor 48h | Leitura empírica |
|---|---|---|
| `noa_logs` | **1.075** rows | Audit master VIVO (média 22 logs/h) |
| `ai_chat_interactions` | 148 | Chat IA ATIVO |
| `cognitive_events` | 112 | COS Kernel rodando |
| `patient_medical_records` (chat) | 97 | Pipeline paciente↔Nôa ativo |
| **`unique_users_48h`** | **5** | ⚠️ **APENAS 5 PESSOAS** ativas em 48h |
| `cfm_prescriptions` signed últimos 7d | 5 | Ricardo prescrevendo |

### I.2 — Top 5 usuários ativos últimas 48h (TODOS internos)

| # | Email | Interações 48h | Last seen |
|---|---|---|---|
| 1 | `rrvalenca@gmail.com` (**Ricardo**) | **62** | 29/05 02:06 |
| 2 | `passosmir4@gmail.com` (Pedro admin) | 39 | 27/05 22:06 |
| 3 | `casualmusic2021@gmail.com` (Pedro paciente teste #6ACF) | 27 | 28/05 11:27 (smoke AEC) |
| 4 | `phpg69@gmail.com` (Pedro pessoal) | 18 | 28/05 18:37 (smoke dossier) |
| 5 | `eduardoscfaveret@gmail.com` (Eduardo) | 2 | 27/05 19:55 |

→ **5 usuários totalmente internos**. 0 externos ativos em 48h.
→ **Ricardo é o usuário mais engajado** (62 interações, mais que 3 contas Pedro juntas = 84).
→ Eduardo caiu drasticamente após 27/05 noite (entusiasmo inicial dissipou).

### I.3 — Commits últimas 48h (git log)

**48 commits** no período (ritmo MUITO alto):

```
b7fb8e0  docs(audit):    Auditoria Integral COMPLETA Sprints 1-5
d41aac9  docs(audit):    Sprint 0 catálogo
4d80733  feat(feedback): V1.9.486-C sidebar Link
a7fd4b1  feat(feedback): V1.9.486-B reverso página
1582049  feat(feedback): V1.9.486-A modal expandido
1cc661a  feat(feedback): V1.9.486 canal Feedback
583dca3  feat(matrix):   V1.9.485-A "Modo de uso"
b6e97c0  feat(matrix):   V1.9.485 compactação
7319521  docs(matrix):   V1.9.484 tutorial
877d1ff  feat(matrix):   V1.9.483 Camada 1.3
a81c736  feat(matrix):   V1.9.482 separação semântica
4f57006  feat(matrix):   V1.9.481 Camada 1.1
b04ede9  docs(diario):   Bloco I sessão tarde
69e88a1  feat(perfil):   V1.9.480 alterar email
1476862  feat(ux-pac):   V1.9.479 destaque AEC
857045d  feat(neuro):    V1.9.478 botões stub Card Neuro
... (+30 commits anteriores 24-48h)
```

→ Validado: 17 commits sessão 28/05 + 30+ commits anteriores 24-48h (sessões noite 27/05 + manhã 28/05).

### I.4 — Compartilhamento de reports (validação Camada 2 Matrix)

| Métrica | Valor |
|---|---|
| Reports com `shared_with` não-vazio | **41** (28% de 145) |
| Médicos únicos recebendo shares | **APENAS 4** |

→ Sistema de share existe e é usado, **mas concentrado em 4 médicos** (provavelmente Ricardo + Eduardo + Pedro admin + 1 outro). Não há massa crítica externa.

### I.5 — Pendências do roadmap — validação empírica item a item

| Item roadmap | Status PAT confirmado | Empírico |
|---|---|---|
| B.1 PII em `clinical_rationalities.assessment` | 🔴 Continua P0 não-mitigado | Memory cristalizada 27/05 + reconfirmada 28/05 |
| B.2 `tradevision-core` verify_jwt | 🔴 v422 false (de v407 true em 22/05) | PAT confirmou drift |
| B.2 PATs rotação | 🔐 PAT sessão exposto Push Protection log GitHub HOJE | Confirmado nos warnings de push 2x |
| B.3 3 perguntas Ricardo pendentes | 🟡 Bloqueada Ricardo | Memory `project_matrix_roadmap_camadas_1_2_3_28_05` documenta as 3 |
| B.4 AECs interrupted | 🔴 9 INTERRUPTED + 1 in_progress órfã > 7d (PAT) | Era 5 em 22/05, cresceu pra 10 |
| B.4 5 órfãos `public.users` reais | 🟡 PAT confirmou (incluindo `joao.vidal@remederi.com`) | Drift novo confirmado |
| B.4 Camada 1.5 aba Evolução | 🟡 Confirmed via grep `PatientsManagement.tsx` 1055-1162 | Documentado memory 28/05 |
| B.5 Smoke V1.9.480-486 | 🔴 **Apenas V1.9.482 validado visualmente** | 5 features sem smoke real |
| B.6 Cleanup 12 tabelas | ⚫ Bloqueado Marco 2 + pg_dump | Doc `09_UNUSED_ARCHITECTURE` lista safe-to-drop |

### I.6 — Diários relevantes a cruzar (catálogo)

| Diário | Status validação | Leitura cruzada |
|---|---|---|
| `DIARIO_22_04_2026` | Histórico (1 mês+) | Base 22/04 — compare se crescimento mantém ritmo |
| `DIARIO_27_05` (Matrix Z2 + locks) | Base sessão noite anterior | Smoke V1.9.468-A 9 turnos com Ricardo pendente |
| `DIARIO_28_05` (sidecars + stack — agora Bloco J fechado) | Sessão 28/05 inteira | Auditoria integral concluída |
| `DIARIO_29_05` (este) | Roadmap 100% pronto | Sprints A-H definidos |

### I.7 — Retrospectiva mensal 26/04 → 25/05 (validação histórica)

`RETROSPECTIVA_MENSAL_2026_04_26_a_2026_05_25.md` (2340 linhas):
- Histórico 30 dias até 25/05
- Comparar com hoje (29/05) — delta 4 dias
- **Vital signs**: interações IA continuam crescendo (385→456 em 6 dias = +18%, consistente com mensal)
- **Marcos**: Marco 1 (CNPJ) ainda pendente desde retrospectiva, Marco 2 (paciente externo) zerado, Marco 3 (multi-médico) inicial (Eduardo entrou 27/05)
- Confirma: pré-PMF empíricamente, base interna 87%, externa 13% (Maria Pinto Pitoco única confirmada real)

### I.8 — Memorias NÍVEL 1 que validam roadmap

| Memory | Como valida roadmap |
|---|---|
| `feedback_validacao_empirica_screenshot_maior_que_plano_teorico_28_05` | Sprint C (Ricardo) + Sprint B (smoke PII obrigatório) |
| `feedback_sistema_tem_contexto_demais_falta_semantica_clinica_28_05` | Sprint D (Camadas 1.2+1.5 Matrix) — separar antes de expandir |
| `project_matrix_roadmap_camadas_1_2_3_28_05` | Roadmap inteiro Camadas Matrix bloqueado por Ricardo |
| `feedback_share_overwrite_professional_id_e_admin_visibilidade_28_05` | Critério "sem regressão" pra mudanças clinical_reports |
| `feedback_racionalidades_pipeline_gera_1_medico_aciona_4_28_05` | Base pra Sprint B PII (entender quando assessment é gerado) |
| `project_auditoria_integral_completa_sprints_0_5_29_05` | Doc-fonte deste roadmap |
| `project_supabase_compliance_lgpd_anvisa_e_pacientes_reais_27_05` | Sprint B (PII) + B.6 polish (Pro plan + PITR + pgaudit) |
| `reference_lock_v1_9_388_a3_ancoragem_regulatoria_multicamada_27_05` | Critério filosófico não-violar em nenhum sprint |

### I.9 — Front-end empírico (grep cruzado)

**Páginas em `src/pages/` que confirmam roadmap**:
- `Feedback.tsx` ✅ entregue V1.9.486-B
- `AdminFeedbackList.tsx` ✅ entregue V1.9.486
- `Profile.tsx` modificado V1.9.480 (Alterar Email) + V1.9.486-B (link Feedback)
- `PatientsManagement.tsx` 1055-1162 — **alvo Sprint D Camada 1.5** (aba Evolução refator)
- `NoaMatrixView.tsx` linhas 130/1328 — base Camadas 1.1/1.3 já entregues, 1.2/1.4 pendentes

### I.10 — Backend empírico (PAT confirmações)

| Confirmação | Empírico |
|---|---|
| `feedback_tickets` tabela funcional + RLS aplicado | 2 rows PAT smoke + 2 policies SELECT/UPDATE OK |
| Auth.users vs Public.users drift | 50 public / 44 auth, 8 órfãos public, 2 órfãos auth |
| `tradevision-core` v422 verify_jwt | PAT functions API confirmou false |
| `clinical_assessments FOLLOW_UP` | 18 rows (4 médicos, 9 pacientes) — Matrix não lê = Sprint D 1.2 |
| `patient_therapeutic_plans` 0 rows | Schema existe, UI nunca codada = Sprint C decisão Ricardo |

---

## 🎯 BLOCO J — Conclusão validação empírica DIARIO 29

**Roadmap está empíricamente sustentado** por:
- 10 docs auditoria (Sprints 0-5)
- PAT 29/05 ~00h50 — vital signs 48h + top users + commits
- Cruzamento com 4 memorias NÍVEL 1 + retrospectiva mensal
- Grep cruzado frontend + backend
- Histórico git 48h (48 commits documentados)

**Sem regressão** = aplicar 7 princípios cristalizados (C.1-C.7) a cada item dos Sprints A-H.

**Marco 2 = critério "100% pronto"** = 10 itens listados em E.

**Próximo ciclo (29/05+)**:
- Sprint A (segurança, 1-2h) hoje
- Sprint B (PII P0, 3-5h) próximos 2-3 dias
- Sprint C (Ricardo responde) em paralelo
- Sprints D-H após desbloqueio

### Frase âncora final Bloco I+J

> *"Roadmap '100% pronto sem regressão' empíricamente validado: 5 usuários ativos 48h (TODOS internos, Ricardo lidera com 62 interações), 48 commits documentados, 10 docs auditoria + 6 memorias NÍVEL 1 + retrospectiva mensal alinhados. PII P0 + verify_jwt + 3 PATs = 🔐 irreversíveis HOJE. Camada 2.3 plano terapêutico = buraco arquitetural REAL bloqueador. Sistema saudável + preservado + coerente, com 79% prescrições draft (melhorando), 44% appts cancelled (preocupante), 69% AECs interrupted (sem UI gerir). Marco 2 = critério gold; PII sanitize = bloqueador imediato. Custo estimado: ~15-25h dev distribuídos em 3-5 sessões + 1-2 dias resposta Ricardo."*
