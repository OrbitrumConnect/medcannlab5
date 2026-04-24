# Estado Real do MedCannLab — 24/04/2026 (consolidação)

> **Propósito:** documento único que Dr. Ricardo Valença, Dr. Eduardo Faveret, João Eduardo Vidal e Pedro Galluf podem ler em 5-10 minutos para ter visão real do sistema **agora** (não o que docs antigos dizem, não o que memória do assistente acha — o que o banco e o código mostram em 24/04/2026).
>
> **Metodologia:** cruzamento de 3 fontes — inventários/panoramas prévios (fev-abr/2026), banco de produção (via Management API), grep exaustivo do código (src/ + supabase/). Foi construído ao fim de uma maratona de 31 versões (V1.9.11 → V1.9.41).

---

## 1. Panorama em 1 minuto

**Produto:** Marketplace clínico cognitivo sobre 3 eixos — Clínica (Dr. Ricardo + AEC 001 + cannabis + DRC), Ensino (Dr. Eduardo + LessonPreparation + noa_lessons), Pesquisa (46 documentos curados + racionalidades médicas cruzadas).

**Estágio:** pós-MVP, pré-paciente externo. 27 usuários em produção, todos admins/família/staff. Zero aquisição externa.

**Infra:** React + Vite + Vercel (frontend) | Supabase Postgres + 9 Edge Functions Deno (backend) | GitHub Actions CI/CD ativo desde 24/04 noite | OpenAI GPT-4o-mini orquestrada pela Nôa.

**Saúde:** core clínico funcional, AEC entregando, monetização pronta sem gateway externo plugado, pipeline CI rodando, 10 testes de integração verdes.

**Direção:** aguardando feedback do time sobre 2 decisões estratégicas — (a) AEC deve parar de gerar diagnóstico/plano? (b) IMRE Triaxial reativa ou formalmente depreca?

---

## 2. Métricas reais do banco (24/04/2026 noite)

| Métrica | Valor | Observação |
|---|---|---|
| Users totais | 27 | Todos admin/família/staff; zero paciente externo |
| Clinical reports | 69 | 38 com consent coerente, 30 pré-V1.9.1 históricos, 1 nasceu hoje de teste |
| Appointments | 60 | Infra pronta; Stripe Connect não plugado → saída de dinheiro ainda não existe |
| CFM prescriptions | 32 | Usam digital-signature que retorna assinatura **fake** (AC real desligada) |
| AI chat interactions | 1413 | Histórico técnico das conversas com Nôa |
| Cognitive events (audit) | 1465 | Auditoria robusta das decisões da IA — healthy pattern |
| Institutional trauma log | 104 | 104 falhas OpenAI entre fev-16/04; 8 dias sem falha nova |
| Rationalities aplicadas | 50 | Criadas historicamente; V1.9.40+41 melhora qualidade dos prompts futuros |

**Leitura:** sistema é usado de verdade (1400+ interações com Nôa em 2 meses). Principalmente pelo time, não por externos. Pipeline AEC→report→consulta→wallet tá funcional end-to-end **exceto saída de dinheiro**.

---

## 3. O que a maratona de 24/04/2026 resolveu (V1.9.11 → V1.9.41)

Agrupado por categoria, não cronológico:

### 3.1 Restauração de regressões (V1.9.11 → V1.9.21)
- Bug "quantos usuários" cai em detector de documentos → regex tightened
- 412 slides poluindo biblioteca → filtro `category!='slides'`
- Monetização destravada → fix COALESCE doctor_id/professional_id + notifications.id default
- Context enrichment por role (profissional/admin/aluno) → V1.9.15-17
- Role guard no FSM → admin/pro/aluno não ficam presos em aec_state residual
- Schema de reports restaurado (lista_indiciaria direto em content.*)
- Sync trigger `doctor_id == professional_id` sempre → 60 appointments + 56 reports + 24 kpis normalizados

### 3.2 Rede de segurança (V1.9.22 → V1.9.25)
- 3 testes de integração (consent-gate, monetization-e2e, aec-finalize-schema)
- GitHub Actions `.github/workflows/deploy-and-test.yml` pronto pra deploy automático
- Fix idempotência: 23 reports/sessão → 1 report/sessão (frontend gate + backend window 10min)
- `handle_new_auth_user` upsert preservativo (DO UPDATE COALESCE)
- Backfill 33 reports aninhados `raw.content.*` → `content.*`

### 3.3 AEC como escuta ativa (V1.9.26 → V1.9.32)
- Filtro de "micro-frase" removido (princípio registrado em memória: *"A AEC é a Arte da Entrevista Clínica — tudo que o paciente fala é ouro"*)
- Gate de IDENTIFICATION (FSM não avança sem nome)
- Terminator regex expandido (15 variações PT de "chega, só isso, tudo bem...")
- Phase lock em COMPLAINT_DETAILS (uma pergunta por turno)
- Transição metodológica explícita pós-queixa principal
- Gráfico Evolução da Completude usa `sortedReports` enriquecido

### 3.4 Scores nativos no backend (V1.9.33 → V1.9.35)
- `calculateScoresFromContent` inline em `tradevision-core` (3 tentativas até deploy funcionar)
- KPI "Gerados por IA" saiu de 0 artificial (V1.9.36: alinhar `generated_by` com CHECK constraint — banco sempre foi autoridade, código TS divergia)

### 3.5 CI ativo + LGPD hardening (V1.9.37 → V1.9.39)
- Timeout de integration tests (V1.9.37)
- **Consent gate antes de idempotency** (V1.9.38) — primeiro bug descoberto pelo próprio CI, LGPD leak latente que vazava report_id de sessão anterior pra request sem consent
- Backfill 27 reports (consent coerente no jsonb mas coluna dedicada false) → 37 coerentes + 30 históricos após V1.9.39

### 3.6 Racionalidades médicas restauradas (V1.9.40 → V1.9.41)
- `rationalityAnalysisService` lia keys EN (`chiefComplaint`, `history`) mas banco grava PT (`queixa_principal`) desde V1.9.20 → IA recebia "Não informado" em 100% dos campos → gerava boilerplate genérico em todas as 5 racionalidades
- Fix: schema PT primary + EN fallback + gate de densidade mínima + diretrizes obrigatórias no prompt + log diagnóstico com flags
- Refinamento V1.9.41 após revisão externa: nome explícito, raciocínio diferencial (justificar exclusão de hipóteses), parcimônia em exames, conduta em 3 tempos

---

## 4. Débitos CRÍTICOS conhecidos e NÃO atacados (do INVENTARIO_FASE1_02_04_2026)

Estes gaps existem há meses, estão documentados, e não foram resolvidos na maratona de 24/04:

### 4.1 Segurança (escalonamento recomendado)

| ID | Gap | Risco |
|---|---|---|
| **S1** | **8 views SEM RLS** expostas (`v_clinical_reports`, `patient_assessments`, `v_prescriptions_queue`, `v_auth_activity`, `users_compatible`, `v_next_appointments`, `active_subscriptions`, `v_user_points_balance`) | 🔴 LGPD — anon_key lê dados clínicos |
| **S3** | **Dados clínicos em localStorage em texto claro** (`clinicalAssessmentFlow.ts:76-104` persiste queixa + histórico + medicação + alergia no browser) | 🔴 LGPD + browser attacks |
| **S4** | **JWT não validado no `tradevision-core`** — linha 751 usa serviceKey sem verificar Authorization header; `patientData.user.id` vem do body e pode ser falsificado | 🔴 Auth bypass; hoje contido por só admins; risco ativo ao abrir pra externo |
| **S7** | **Sem workflow de revisão médica** — report vai direto pra `completed` sem assinatura profissional (campo `reviewed` existe mas fluxo não) | 🔴 CFM, validade jurídica |

### 4.2 Produto (bloqueadores de qualidade)

| ID | Gap | Risco |
|---|---|---|
| **C1** | **Fases AEC só em localStorage** — paciente limpa cache, perde avaliação; não há `status` server-side | 🔴 Perda de dado clínico |
| **C4** | **Dois serviços de relatório coexistindo** (`clinicalReportService` vs `clinicalAssessmentService`) — confusão sobre canônico | 🟡 Débito conceitual |

### 4.3 Achados desta sessão (24/04 noite) que somam aos críticos

| Gap novo | Descrição |
|---|---|
| **Narrador extrapola AEC** | Prompt força "Impressão Clínica Inicial" e "Plano de Conduta Sugerido" em 100% dos reports — pseudo-consulta médica sem CRM. `supabase/functions/tradevision-core/index.ts:1289-1299`. Risco regulatório direto. Fix = 4 linhas de prompt |
| **Divergência `users.type` ↔ `user_profiles.role`** | 4/6 contas admin com espelhamento incoerente. Explica "saudação admin" no rrvalenca. Afeta RLS policies que leem `profile.role` |
| **Field mismatch rationality (RESOLVIDO V1.9.40)** | Código lia EN, banco grava PT — IA recebia "Não informado" em 100% |
| **Trauma log write/read assimétrico** | 104 inserts em `institutional_trauma_log`, todos com `restricted_mode_active=null`. Query de detecção sempre retorna null. Auditoria cega |
| **Captura contraditória em AEC** | "Melhora: Dormir, A luminosidade" + "Piora: Luminosidade" — bug de extração (FSM ou GPT) |
| **Scores 100% sempre** | `calculateScoresFromContent` mede completude estrutural, mas label "anamnese=100%" sugere qualidade clínica. Confunde produto |
| **UX consent sem botão explícito** | Paciente digita "sim/não" — precisa botão visível "Autorizo" |
| **Agendamento com erro** (reportado por Ricardo) | Não investigado |

---

## 5. Mapa real dos motores de avaliação clínica

Ver também `C:\Users\phpg6\.claude\projects\...\memory\project_4_clinical_engines_map_24_04.md` (memória interna).

| Arquivo | Linhas | Callers externos | Status |
|---|---|---|---|
| `src/lib/clinicalAssessmentFlow.ts` | 1593 | 15+ em noaResidentAI | ✅ **Motor AEC oficial** |
| `src/lib/clinicalReportService.ts` | 242 | 1 (gated V1.9.25) | 🟡 Fallback legacy, raramente dispara |
| `src/lib/unifiedAssessment.ts` | 601 | 0 em produção | 💤 **Planejado/dormente** (IMRE Triaxial) |
| `src/lib/clinicalAssessmentService.ts` | 128 | 0 em produção | 💤 **Planejado/dormente** (tem fallback codificado para `clinical_assessments`) |
| `src/lib/imreMigration.ts` | 483 | só em unifiedAssessment | 💤 Transitivo |
| `src/lib/noaIntegration.ts` | 496 | só em unifiedAssessment | 💤 Transitivo |

**Total dormente IMRE: ~1700 linhas de código planejado mas não plugado.**

**Status documentado nos panoramas antigos:**
- `PANORAMA_360_27_02_2026.md:125` — `unifiedAssessment.ts` marcado "✅ Funcional"
- `docs/guides/PROBLEMAS_IDENTIFICADOS.md:51` — "noaIntegration — Implementado mas não testado"
- `docs/guides/PROBLEMAS_IDENTIFICADOS.md:63` — "imreMigration — Script pronto mas não executado"
- `docs/INVENTARIO_FASE1_02_04_2026.md:131` — C4 lista duplicação `clinicalReportService` vs `clinicalAssessmentService` como dívida conhecida

**NÃO são órfãos esquecidos. São arquitetura adiada consciente.**

O que IMRE Triaxial prometia (e nunca entregou):
- Eixo Emocional (intensidade, valência, arousal, estabilidade)
- Eixo Cognitivo (atenção, memória, executiva, processamento)
- Eixo Comportamental (atividade, social, adaptativo, regulatório)
- Dados clínicos: função renal (creatinina, GFR, BUN, proteinúria, estágio), metabolismo cannabis (CYP2C9/3A4/2C19), resposta terapêutica
- Correlações cross-domain (emocional↔renal, cognitivo↔renal, etc.)

**Isso é diferencial forte se ativo. Decisão estratégica pendente com time.**

---

## 6. Pipeline CI/CD (ativo 24/04 noite)

- **Repo canônico:** `OrbitrumConnect/medcannlab5`
- **Workflow:** `.github/workflows/deploy-and-test.yml`
- **Triggers:** push em `main`/`master` que toque `supabase/functions/tradevision-core/**`, `supabase/functions/_shared/**`, `tests/integration/**`, ou o próprio workflow
- **Jobs:**
  1. Deploy automático da Edge Function `tradevision-core` via Supabase CLI (~20-30s)
  2. 10 testes de integração (`consent-gate` × 4, `monetization-e2e` × 5, `aec-finalize-schema` × 1) contra o ambiente já deployado (~30-45s)
- **Total:** ~1min por push
- **Secrets configurados:** `SUPABASE_ACCESS_TOKEN`, `SUPABASE_PROJECT_REF`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`

**Efeito arquitetural:** deploy manual da Edge Function deixou de ser obrigatório. Qualquer push que toque Core + testes passa primeiro por validação automática contra produção real. **Primeiro bug descoberto pelo próprio CI foi V1.9.38 (LGPD leak via idempotency).**

**Pendente operacional:** desabilitar GitHub Actions no repo `amigo-connect-hub` (espelho que recebe push mas não tem secrets → runs vermelhos desnecessários).

---

## 7. Fallback de sobrevivência (COS v1.0 — descoberto 24/04 noite)

Quando a OpenAI retorna erro, `tradevision-core:4080+` ativa **Deterministic Core Mode (Sovereignty Protocol v2)** com 5 camadas:

1. Detecção semântica via dicionários clínicos controlados
2. Memória conversacional estruturada
3. Motor de relação de fatores
4. Composição textual determinística (respeita triggers imutáveis, governança por role, "nunca diagnostica")
5. Sanitização

**Nas 104 falhas da OpenAI entre fev-abr, a Nôa continuou respondendo sem tela de erro.** Arquitetura hospital-grade de verdade.

**Dívida identificada:** par write/read do `institutional_trauma_log` é assimétrico — escrita não preenche `restricted_mode_active` nem `recovery_estimated_at`, então a query de detecção sempre retorna null. Auditoria cega. Fix = adicionar 2 campos no INSERT.

---

## 8. Decisões estratégicas pendentes (time precisa responder)

### 8.1 Conceitual — "AEC organiza vs interpreta"
Hoje o prompt do narrador (`tradevision-core:1289-1299`) força "Estrutura Obrigatória" incluindo **Impressão Clínica Inicial** e **Plano de Conduta Sugerido**. Resultado: 100% dos 50 reports com narrativa geram pseudo-diagnóstico + plano sem CRM.

Frase-tese (validada com GPT em revisão externa):
> *"AEC organiza. Clínica interpreta. Se a AEC interpretar, o produto perde identidade. Se a AEC organizar, o produto ganha escala."*

**Decisão pendente:** alinhar com Dr. Ricardo se AEC deve deixar de interpretar (fix = 4 linhas de prompt). Risco regulatório direto.

### 8.2 Estratégica — IMRE Triaxial
~1700 linhas de arquitetura rica dormente (emocional + cognitivo + comportamental + renal + farmacogenética + correlações cross-domínio).

**Decisão pendente:** Ricardo + Eduardo — (a) plano de reativação com roadmap? Ou (b) formalmente depreca com cerimônia em `docs/archived/imre_v1_2026/`?

### 8.3 Governança — 2 contas por fundador ✅ DECIDIDO (design confirmado)

**Decisão Pedro 24/04/2026 noite:** *"1 ele é adm outro ele é profissional não tem discussão, Eduardo também"*.

Cada fundador tem 2 contas intencionais:
- **Dr. Ricardo Valença**: `iaianoaesperanza` (admin) + `rrvalenca` (profissional)
- **Dr. Eduardo Faveret**: `eduardoscfaveret` (admin) + `eduardo.faveret@hotmail` (profissional)
- **João Eduardo Vidal** e **Pedro**: 1 conta cada (só admin)
- **Vicente Caetano Pimenta**: conta `type=patient` — filho do Dr. Eduardo, cadastrado para teste familiar

Separação protege auditoria LGPD/CFM — prescrição assinada pela conta profissional, governança pela admin.

Divergência `user_profiles.role` (detectada na investigação) é **histórico de cadastro, não bug**. Código-do-app lê `users.type` que está correto em todas as contas. **NÃO corrigir via migration.**

### 8.4 Produto — plugar infra financeira externa
Wallet + split 70/30 + referral + transactions tudo pronto; nada sai pro mundo externo porque Stripe Connect / Mercado Pago ainda não escolhido/plugado.

**Decisão pendente:** qual gateway e quando.

### 8.5 Regulatório — requisitos antes do paciente externo
- Assinatura digital AC real (hoje retorna fake)
- Consent clínico explícito pré-AEC (S6 parcial — ConsentGuard existe mas só wrapping Layout geral)
- Compliance CFM para teleconsulta / prescrição
- WiseCare produção (hoje session_id hardcoded em homolog)

---

## 9. Próximos passos em 3 tempos

### Agora (faz em minutos, zero risco)
- Desabilitar Actions em `amigo-connect-hub` (3 cliques no GitHub)
- Rotacionar PAT Supabase `sbp_bbf6...` que apareceu em chat

### Curto prazo (após feedback do time)
- Fix do narrador (AEC organiza vs interpreta) — 4 linhas de prompt, decisão de Ricardo primeiro
- Fix dos bugs adjacentes detectados no teste da Carolina (captura contraditória, botão Autorizar, agendamento)
- Implementar NPS clínico — "Você sentiu que a avaliação entendeu seu problema?" (pergunta única pós-agendamento)
- Atacar S1 (views sem RLS) — simples + alto impacto LGPD
- Fix write/read `institutional_trauma_log` — 1 linha, restaura observabilidade

### Médio prazo (roadmap produto)
- Decidir IMRE (reativar ou deprecar)
- Plugar Stripe Connect / Mercado Pago
- AC digital real
- UI "Conectar Google Calendar" (infra pronta desde 16/04)
- Migrar S3/S4/C1 críticos (LGPD + auth bypass + localStorage)
- Expandir pipeline CI com testes de UI/E2E

---

## 10. Referências internas

- **Memórias do assistente** (pasta `C:\Users\phpg6\.claude\projects\c--Users-phpg6-Desktop-amigo-connect-hub-main\memory\`):
  - `MEMORY.md` — índice
  - `project_beyond_mvp_stage.md` — padrão elite escalável declarado
  - `project_ci_pipeline.md` — referência operacional do CI
  - `project_selo_24_04.md` — 2 selos do dia
  - `project_rationality_field_mismatch_24_04.md` — bug resolvido V1.9.40+41
  - `project_narrator_overreach_24_04.md` — bug do narrador + template AEC final proposto
  - `project_role_divergence_24_04.md` — divergência users vs user_profiles
  - `project_brain_disconnect_24_04.md` — OpenAI outage + fallback
  - `project_4_clinical_engines_map_24_04.md` — mapa real dos 4 motores

- **Documentos do repo:**
  - `DIARIO_24_04_2026_RESTAURACAO_E_BLINDAGEM.md` — diário cronológico (~500 linhas)
  - `docs/INVENTARIO_FASE1_02_04_2026.md` — inventário + gaps numerados
  - `PANORAMA_360_27_02_2026.md` — panorama de fevereiro
  - `docs/guides/PROBLEMAS_IDENTIFICADOS.md` — status "Implementado mas não testado" / "Script pronto mas não executado"

- **Commits de 24/04/2026** (ordem cronológica):
  - V1.9.11 → V1.9.39: 5 migrations SQL + várias mudanças frontend/backend
  - V1.9.40: `a39406c` fix field mismatch rationality
  - V1.9.41: `0835c49` refinamento prompts + log diagnóstico
  - Selo final (estado): `895c4db` + `31651a6`

---

**Este documento é foto de 24/04/2026 noite.** A partir daqui:
- Nada é perfeito — 5 débitos CRÍTICOS aguardam (S1, S3, S4, S7, C1) + novos achados da sessão
- Nada está quebrado agora — 27 usuários em prod, sistema responde, pipeline valida
- Time sabe o que quer — Pedro + Ricardo + Eduardo + João têm clareza das decisões pendentes
- Rede existe — CI protege cada mudança no Core, 10 testes em cada push

Próxima retomada: decisão estratégica (8.1 ou 8.2) antes de mexer em código.

— Consolidado por Pedro Galluf (CTO) + assistente IA (Claude Opus 4.7, sessão 24/04/2026).
