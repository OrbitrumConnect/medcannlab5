# 🔬 AUDITORIA COMPLETA — MedCannLab v10 Titan Edition
## 01 de Abril de 2026 — Leitura Total do Sistema

---

## 1. INVENTÁRIO DO REPOSITÓRIO

| Métrica | Valor |
|---------|-------|
| **Ficheiros .ts/.tsx** | 264 |
| **Páginas (src/pages)** | 73 ficheiros / ~48.479 linhas |
| **Contextos React** | 10 providers (~1.769 linhas) |
| **Edge Functions** | 7 deployadas |
| **Migrações SQL** | 61 executadas |
| **Diários de bordo** | 17 documentos |
| **Dependências npm** | 30+ pacotes prod |

### 1.1 Módulos Nucleares (linhas de código)

| Módulo | Ficheiro | Linhas |
|--------|----------|--------|
| **TradeVision Core** | `supabase/functions/tradevision-core/index.ts` | 3.068 |
| **Nôa Interface** | `src/components/NoaConversationalInterface.tsx` | 2.991 |
| **NoaResidentAI** | `src/lib/noaResidentAI.ts` | 1.897 |
| **ClinicalReports** | `src/components/ClinicalReports.tsx` | 1.376 |
| **ProfessionalScheduling** | `src/components/ProfessionalSchedulingWidget.tsx` | 975 |
| **ClinicalAssessmentFlow** | `src/lib/clinicalAssessmentFlow.ts` | 807 |
| **NoaIntegration** | `src/lib/noaIntegration.ts` | 496 |
| **NoaEsperancaCore** | `src/lib/noaEsperancaCore.ts` | 367 |
| **ClinicalReportService** | `src/lib/clinicalReportService.ts` | 242 |
| **TOTAL NUCLEAR** | — | **~12.219** |

### 1.2 Edge Functions (7 ativas)

| Função | Propósito |
|--------|-----------|
| `tradevision-core` | Kernel cognitivo: GPT, AEC, agendamento, documentos, governance |
| `send-email` | Envio de e-mail via Resend |
| `wisecare-session` | Sessões de vídeo WebRTC (WiseCare) |
| `video-call-reminders` | Lembretes de videochamada |
| `video-call-request-notification` | Notificação de pedido de videochamada |
| `digital-signature` | Assinatura digital ICP-Brasil |
| `extract-document-text` | Extração de texto de documentos (OCR/PDF) |

---

## 2. ARQUITETURA (5 CAMADAS)

```
CAMADA 5 — SOBERANIA (Supabase: 137 tabelas, RLS 100%)
CAMADA 4 — COGNIÇÃO (GPT-4o + RAG + Knowledge Base 376 docs)
CAMADA 3 — KERNEL (TradeVision Core Edge Function — governança)
CAMADA 2 — SENTINELA (NoaResidentAI + NoaEsperancaCore + NoaIntegration)
CAMADA 1 — SENSORIAL (NoaConversationalInterface + Widgets + Voice)
```

**Princípio imutável:** `fala ≠ ação` — a IA sugere, o Core governa, o frontend executa via `app_commands`.

---

## 3. FLUXOS OPERACIONAIS — ESTADO ATUAL

### 3.1 AEC (Arte da Entrevista Clínica) ✅
- **10 etapas** obrigatórias implementadas no `clinicalAssessmentFlow.ts`
- Loop "O que mais?" na fase 2 (Lista Indiciária) — validado
- Marcador `[ASSESSMENT_COMPLETED]` na etapa 10
- Extração de dados v2 via GPT-4o-mini no servidor
- **⚠️ P0 ABERTO:** Fechar ciclo completo → relatório → visível ao paciente

### 3.2 Agendamento ✅
- Detecção dinâmica de profissionais via consulta a `public.users`
- Widget inline no chat (paciente não sai do chat)
- Configuração de disponibilidade pelo profissional (dias, horários, slots 30-90min)
- RPC `get_available_slots_v3` para geração de slots
- RLS na tabela `professional_availability`

### 3.3 Chat Nôa ✅
- 16 triggers GPT semânticos selados (navigate, document, prescription, etc.)
- `parseTriggersFromGPTResponse` → `stripGPTTriggerTags` → `filterAppCommandsByRole`
- Fallback determinístico (`deriveAppCommandsV1`) quando GPT não emite triggers
- Sessão AEC isolada para relatórios (retroativo via marcador)

### 3.4 Relatórios Clínicos ✅ (parcial)
- Tabela `clinical_reports` com conteúdo JSONB
- Visibilidade por role: paciente vê só seu, profissional vê compartilhados, admin vê tudo
- Score calculator (`clinicalScoreCalculator.ts`) operacional
- **⚠️ P0 ABERTO:** Pipeline ACI completo → paciente visualiza resultado

### 3.5 Videochamada ✅ (parcial)
- WiseCare + WebRTC implementado
- CORS universal para previews dinâmicas
- **⚠️ Risco:** STUN sem TURN — pode falhar em redes restritivas

### 3.6 Assinatura Digital ✅
- 3 níveis (L1: interno, L2: admin, L3: ICP-Brasil/CFM)
- Edge Function `digital-signature` ativa

### 3.7 RBAC ✅
- `user_roles` como fonte da verdade (admin, profissional, paciente, aluno)
- RPC `get_my_primary_role()` com `SECURITY DEFINER`
- `current_user_role()` corrigida para ler de `user_roles` (não `user_profiles`)

---

## 4. SCAN DE SEGURANÇA — FINDINGS (01/04/2026)

### 🔴 CRITICAL (6 findings)

| # | Finding | Risco | Remediação |
|---|---------|-------|------------|
| 1 | **Bucket `documents`** sem ownership check | Qualquer autenticado lê/modifica documentos médicos de outros | Adicionar `(storage.foldername(name))[1] = auth.uid()::text` |
| 2 | **View `users_compatible`** expõe PII total (CPF, email, etc.) | Sem RLS — qualquer autenticado lê tudo | Recriar como `SECURITY INVOKER` ou adicionar RLS |
| 3 | **Bucket `chat-audio`** sem ownership | Áudio clínico acessível a qualquer autenticado | Path-based ownership ou join a `chat_participants` |
| 4 | **Views `patient_assessments`, `eduardo_shared_assessments`, `ricardo_shared_assessments`** | Dados clínicos completos sem RLS | Recriar como `SECURITY INVOKER` |
| 5 | **View `active_subscriptions`** expõe billing de todos | Dados financeiros sem proteção | RLS com `user_id = auth.uid()` |
| 6 | **Views de appointments/PII** (`v_next_appointments`, `v_paciente_completo`, etc.) | Emails, dados clínicos sem RLS | `SECURITY INVOKER` em todas |
| 7 | **Avatar UPDATE** sem ownership | Qualquer um sobrescreve avatar de outro | Path check `auth.uid()::text` |

### 🟡 WARNINGS (10 findings)

| # | Finding | Remediação |
|---|---------|------------|
| 1-2 | Functions sem `search_path` fixo | Adicionar `SET search_path = public` |
| 3 | Extension em schema `public` | Mover para schema dedicado |
| 4-7 | RLS policies com `USING (true)` em INSERT/UPDATE/DELETE | Revisar cada política |
| 8 | Leaked password protection desativada | Ativar no dashboard Supabase |
| 9 | Realtime sem RLS em `realtime.messages` | Adicionar políticas por topic |
| 10 | `is_professional_patient_link()` inclui `chat_participants` | Remover — usar só appointments/assessments |

---

## 5. BUILD ERROR ATUAL

```
Failed resolving types: npm:openai@^4.52.5 não encontrado para deno.json
```
**Causa:** O `@supabase/functions-js` tenta resolver `openai@^4.52.5` no type-check local. No runtime Deno a Edge Function usa `esm.sh/openai@4` (que funciona). Não afeta deploy real — é um falso positivo do type checker local.

---

## 6. ROADMAP PRIORIZADO (P0 → P4)

### P0 — Clínico e Produto (URGENTE)
1. **Fechar ciclo ACI:** fechamento → relatório → paciente visualiza
2. **Copy "identifique-se":** ajustar para contexto autenticado (nome/perfil)
3. **Ordem de roadmap:** relatório útil antes de indicadores/camadas analíticas

### P1 — Governança e Confiança
1. **Corrigir 6 findings CRITICAL** de segurança acima
2. **Prompts versionados no repo** (não só no dashboard Assistant)
3. **Relatório ACI previsível:** JSON + validação → texto derivado
4. **Manter patches:** AEC/intent, WiseCare/service role

### P2 — Infra e Go-Live (Runbook §9)
1. **CNPJ** — registro formal
2. **Stripe Connect** — split 30/70 real (4-6h)
3. **Resend DNS** — DKIM/SPF (30min)
4. **Rotação de chaves** se houve exposição
5. **TURN server** — decisão para redes difíceis
6. **Dívida `users` / `pacientes`** — planejar mitigação

### P3 — Engenharia de Manutenção
1. **Modularizar tradevision-core** (3.068 linhas) — após P0 fechado
2. **Testes unitários** — cobertura ~0% atualmente
3. **HealthKit / app nativo** — só se decisão de produto

### P4 — Memória Institucional
1. **Timeline atualizada** a cada marco
2. **Diários de bordo** — manter cadência

---

## 7. MÉTRICAS DE MATURIDADE

| Subsistema | Maturidade | Nota |
|------------|------------|------|
| RLS / Segurança tabelas | 95% | 6 views críticas sem SECURITY INVOKER |
| AEC / Protocolo clínico | 90% | Ciclo não fecha no paciente |
| Agendamento dinâmico | 98% | Funcional e configurável |
| Chat Nôa + Triggers | 95% | 16 triggers selados |
| Relatórios clínicos | 75% | Paciente não visualiza ainda |
| Videochamada | 70% | Sem TURN server |
| Stripe / Pagamentos | 20% | Mock apenas |
| E-mail transacional | 60% | Edge ok, DNS pendente |
| Gamificação | 30% | Estrutura existe, triggers reais faltam |
| Testes automatizados | 5% | Quase zero |
| **GLOBAL** | **~72%** | Funcional mas com gaps críticos de segurança e UX |

---

## 8. FRASE DE SELO

> O MedCannLab v10 possui uma arquitetura cognitiva madura (5 camadas, 264 ficheiros, 7 Edge Functions, 61 migrações, 137 tabelas com RLS), mas **6 vulnerabilidades críticas de segurança em views/storage** e o **ciclo ACI incompleto para o paciente** são os bloqueios de go-live. Prioridade absoluta: fechar o relatório ACI no paciente e corrigir as views expostas.

---

*Auditoria gerada em 01/04/2026 — MedCannLab Titan Edition*
*Fonte: análise direta do repositório + security scan Supabase*
