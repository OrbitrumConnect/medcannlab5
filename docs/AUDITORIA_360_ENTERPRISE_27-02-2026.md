# 🏛️ AUDITORIA 360° ENTERPRISE — MEDCANNLAB v10.0

**Data:** 27 de Fevereiro de 2026  
**Tipo:** Auditoria Técnica Completa (Security Scan + Linter + DB Query + Frontend Analysis)  
**Método:** Dados reais extraídos via Supabase API, Security Scanner Oficial, Linter Oficial, análise de código-fonte  
**Nível:** Enterprise / Pre-Production Readiness

---

## 📊 RESUMO EXECUTIVO

| Dimensão | Score | Nota |
|---|---|---|
| **Prontidão para Produção** | **48%** | Bloqueado por pagamentos e segurança |
| **Segurança Real** | **42%** | 116 findings no linter, 40+ policies USING(true) |
| **Escalabilidade** | **55%** | Sem TURN pago, sem webhook real, sem monitoring |
| **Maturidade Arquitetural** | **72%** | Boa separação de domínios, mas dívida técnica alta |
| **Monetização** | **15%** | 100% mockado, 0 transações reais |

> ⚠️ **VEREDITO: A plataforma NÃO está pronta para produção comercial.**  
> Existem fluxos que **parecem completos** mas **não alteram estado real** no banco.

---

## 🔴 DADOS REAIS DO BANCO (Consulta Direta)

### Contagem de Registros (27/02/2026)

| Tabela | Registros | Status |
|---|---|---|
| `users` | 35 | ✅ Operacional |
| `user_roles` | 37 | ✅ (2 roles extras = dual-role users) |
| `user_profiles` | 31 | ⚠️ 4 users sem profile |
| `appointments` | 47 | ⚠️ 30 scheduled, 17 cancelled, **0 completed** |
| `clinical_assessments` | 53 | ✅ Existem |
| `clinical_reports` | 55 | ✅ Existem |
| `cfm_prescriptions` | 25 | ⚠️ **23 draft, 1 signed, 1 sent** |
| `chat_rooms` | 75 | ✅ Salas criadas |
| `chat_messages` | **0** | 🔴 **CRÍTICO: Chat morto** |
| `documents` | 434 | ✅ Biblioteca rica |
| `patient_medical_records` | 1669 | ✅ Volume real |
| `notifications` | 57 | ✅ Existem |
| `transactions` | **0** | 🔴 **CRÍTICO: Zero pagamentos** |
| `imre_assessments` | **0** | 🔴 **Módulo IMRE sem uso** |

### Achados Críticos nos Dados

1. **0 consultas concluídas** — Todas 47 appointments são `scheduled` ou `cancelled`. Nenhuma jamais chegou a `completed`. O fluxo `paciente → consulta → conclusão → registro` **nunca foi exercitado end-to-end**.

2. **0 mensagens no chat** — 75 salas existem mas nenhuma mensagem foi persistida. **A RLS INSERT em `chat_messages` está bloqueando silenciosamente** (sem erro visível ao usuário, a mensagem simplesmente não aparece).

3. **92% das prescrições em draft** — 23/25 prescrições estão estagnadas. O fluxo de assinatura digital → envio raramente é completado.

4. **0 transações financeiras** — A tabela `transactions` está vazia. O checkout é 100% simulado com QR code PIX fake.

---

## 🔴 P0 — RISCOS BLOQUEANTES (Go-Live Impossível)

### P0-1: Pagamento 100% Mockado
**Evidência concreta:**
- `PaymentCheckout.tsx` linha 96-97: `await new Promise(resolve => setTimeout(resolve, 2000))` — simula processamento
- `PaymentCheckout.tsx` linha 82-87: QR Code PIX é string hardcoded, não vem de gateway
- `PaymentCheckout.tsx` linhas 49-73: Planos são objetos mockados in-memory (`mock-1`, `mock-2`, `mock-3`)
- Tabela `transactions`: **0 registros**
- **Secrets configurados**: Apenas `LOVABLE_API_KEY`, `VITE_SUPABASE_ANON_KEY`, `VITE_SUPABASE_URL` — **nenhum** secret para Stripe/MercadoPago
- **Impacto:** Risco financeiro total. Plataforma não pode cobrar. Paciente acessa tudo sem pagar.

### P0-2: 116 Findings no Security Scanner
**Evidência do Supabase Linter oficial (scan executado 27/02/2026):**
- **~80 warnings**: `Function Search Path Mutable` — funções SQL sem `SET search_path`, vulneráveis a search_path hijacking
- **~35 warnings**: `RLS Policy Always True` — policies com `USING(true)` ou `WITH CHECK(true)` em INSERT/UPDATE/DELETE
- **1 warning**: `Leaked Password Protection Disabled` — proteção contra senhas vazadas desativada no Auth
- **Total: 116 findings de segurança**

### P0-3: Policies USING(true) em Tabelas Sensíveis
**Evidência direta das queries em pg_policies (dados clínicos expostos):**

| Tabela | Policy | Comando | Problema |
|---|---|---|---|
| `cfm_prescriptions` | `allow_all_authenticated` | ALL | **Qualquer user autenticado pode INSERT/UPDATE/DELETE prescrições médicas** |
| `documents` | `Service role full access` | ALL | USING(true) — qualquer autenticado tem acesso total |
| `documents` | 5 policies SELECT redundantes | SELECT | 5 policies de leitura sobrepostas, todas USING(true) |
| `course_enrollments` | `Authenticated can manage` | ALL | USING(true) — qualquer um gerencia matrículas de qualquer outro |
| `pki_transactions` | `Service role full access` | ALL | USING(true) — logs de assinatura digital expostos |
| `lesson_content` | `update` policy | UPDATE | USING(true) — aluno pode editar conteúdo de aula |

**Risco LGPD:** `cfm_prescriptions` contém `patient_cpf`, `patient_email`, `patient_phone`, `medications` — dados sensíveis de saúde exposto a qualquer autenticado via policy `allow_all_authenticated`.

### P0-4: Chat Clínico Morto (0 mensagens)
**Evidência:**
- `chat_rooms`: 75 registros
- `chat_messages`: **0 registros**
- A RPC `create_chat_room_for_patient()` cria salas corretamente
- O bloqueio está na **policy INSERT de `chat_messages`** — as policies existentes usam `sender_id` com FK para `auth.users` mas a coluna é nullable, causando falha silenciosa

### P0-5: Secrets Ausentes para Serviços Externos
**Secrets configurados (verificação real):**
```
✅ LOVABLE_API_KEY (sistema)
✅ VITE_SUPABASE_ANON_KEY
✅ VITE_SUPABASE_URL
```

**Secrets AUSENTES (necessários para produção):**
```
❌ STRIPE_SECRET_KEY — pagamentos reais
❌ STRIPE_WEBHOOK_SECRET — validação de webhooks
❌ RESEND_API_KEY — envio de e-mails (Edge Function send-email espera esta key)
❌ RESEND_FROM_EMAIL — domínio verificado
❌ OPENAI_API_KEY — Nôa IA (tradevision-core usa OpenAI)
```

---

## 🟠 P1 — RISCOS ESTRUTURAIS (Funcionalidade Comprometida)

### P1-1: Fluxo de Consulta Nunca Completa
**Evidência:**
- `appointments.status`: 30 `scheduled`, 17 `cancelled`, **0 `completed`**
- A função `_normalize_appointment_status()` aceita valores como `completed/concluido/finalizado/done`
- Mas **nenhum código no frontend** chama UPDATE para marcar como `completed`
- O trigger `set_referral_marco_zero()` depende de `status = 'completed'` para ativar bônus de referral — **nunca dispara**
- O trigger `process_appointment_referral_bonus()` busca em `transactions` — **tabela vazia**
- **Consequência:** Sistema de referral, bônus e gamificação são código morto

### P1-2: WebRTC Sem TURN Pago
**Evidência em `useWebRTCRoom.ts` linhas 15-18:**
```typescript
const rtcConfig: RTCConfiguration = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' }
  ]
}
```
- **Apenas STUN** (Google gratuito) — sem TURN server
- Em redes restritivas (hospitais, redes corporativas, NAT simétrico), a teleconsulta **falhará silenciosamente**
- Estimativa: 15-30% dos pacientes em redes restritas não conseguirão conectar

### P1-3: trial_ends_at Calculado Apenas no Frontend
**Evidência em `AuthContext.tsx` linhas 131-135:**
```typescript
const createdAt = authUser.created_at ? new Date(authUser.created_at) : null
const trialEndsAt = createdAt
  ? new Date(createdAt.getTime() + 3 * 24 * 60 * 60 * 1000)
  : undefined
```
- O trial de 3 dias é calculado **inteiramente no client-side**
- A tabela `users` **não tem coluna `trial_ends_at`** 
- `PaymentGuard.tsx` consome `user.trial_ends_at` do contexto React
- **Risco:** Usuário pode manipular `created_at` no DevTools ou simplesmente desabilitar JS do PaymentGuard

### P1-4: View v_auth_activity Expõe auth.users
**Evidência:** View `v_auth_activity` existe na lista de views públicas e referencia diretamente `auth.users`, expondo email, metadata e timestamps de autenticação.

### P1-5: Resend API Key Ausente (Edge Function Inoperante)
**Evidência em `send-email/index.ts` linhas 8-9:**
```typescript
const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')
```
- Secret `RESEND_API_KEY` **não está configurado** nos secrets do projeto
- A Edge Function existe e está bem implementada (templates de welcome, appointment, prescription, invite)
- Mas **nunca funciona** porque a key não existe
- Templates de e-mail prontos: `welcome`, `appointment_confirmation`, `report_shared`, `prescription_ready`, `invite_patient`, `payment_confirmation`

### P1-6: 4 Users Sem Profile
- `users`: 35, `user_profiles`: 31
- 4 usuários sem entry em `user_profiles` = gamificação, pontos e ranking quebrados para eles
- Trigger `handle_new_user_profile()` existe mas pode ter falhado silenciosamente na criação

---

## 🟡 P2 — DÍVIDA TÉCNICA

### P2-1: ~80 Funções Sem search_path Definido
- Funções como `cleanup_old_chat_messages()`, `set_chat_message_expiry()`, `generate_referral_code()`, `update_user_statistics()` não definem `SET search_path`
- Vulneráveis a search_path hijacking se um schema malicioso for criado

### P2-2: Tabelas com 1 Policy Apenas (Cobertura Insuficiente)
| Tabela | Policies | Problema |
|---|---|---|
| `noa_clinical_cases` | 1 | Provavelmente só SELECT |
| `ranking_history` | 1 | Sem INSERT/UPDATE protegido |
| `scheduling_audit_log` | 1 | Log sem proteção de escrita |
| `courses` | 1 | Sem controle de quem pode criar cursos |
| `noa_memories` | 1 | Memórias da IA sem isolamento |
| `modelos_receituario` | 1 | Templates de receita |
| `user_benefits_status` | 1 | Status de benefícios |
| `ai_scheduling_predictions` | 1 | Predições de IA |
| `cognitive_events` | 1 | Eventos cognitivos |

### P2-3: Policies SELECT Duplicadas em `documents`
- 5 policies de leitura diferentes, todas USING(true): `Authenticated users can view documents`, `Users can view documents`, `Service role full access`, `Authenticated users view all`, `Authenticated users upload`
- Redundância que dificulta manutenção e auditoria

### P2-4: Emails Hardcoded em Funções SQL
- `get_authorized_professionals()`: hardcode de `rrvalenca@gmail.com` e `eduardoscfaveret@gmail.com`
- `handle_new_patient_triage()`: busca admin por email hardcoded
- `clinic_can_access_assessment()`: emails hardcoded
- `is_authorized_professional()`: emails hardcoded
- **Deveria usar `user_roles`** e a função `has_role()` para todas essas verificações

### P2-5: Leaked Password Protection Disabled
- Supabase Auth tem proteção contra senhas vazadas **desativada**
- Usuários podem usar senhas que já apareceram em data breaches

---

## 🔗 CONEXÕES FALTANTES ENTRE MÓDULOS

| De | Para | Problema |
|---|---|---|
| Checkout (frontend) | Stripe/Gateway | Não existe backend de pagamento |
| Appointment completion | Transaction creation | Trigger existe mas `transactions` está vazio |
| Transaction completion | Referral bonus | `process_appointment_referral_bonus()` nunca dispara |
| Referral bonus | Gamification | Pontos nunca são creditados |
| Prescription signing | Email notification | `send-email` Edge Function sem API key |
| Chat message send | `chat_messages` INSERT | RLS bloqueando silenciosamente |
| Patient registration | `user_profiles` | 4 users sem profile |
| Video call | TURN server | Sem fallback para NAT restritivo |
| Nôa IA (tradevision-core) | OpenAI | Secret `OPENAI_API_KEY` ausente |

---

## 🔓 PONTOS DE VAZAMENTO DE DADOS (LGPD)

1. **`cfm_prescriptions`**: Policy `allow_all_authenticated` permite que **qualquer paciente leia CPF, email, telefone e medicamentos de TODOS os pacientes**
2. **`v_auth_activity`**: View pública que expõe dados de `auth.users` (email, metadata, timestamps)
3. **`documents`**: 5 policies USING(true) = qualquer autenticado lê todos os documentos, incluindo relatórios médicos
4. **`pki_transactions`**: Logs de assinatura digital acessíveis a todos via USING(true)
5. **`patient_medical_records`**: 1669 registros — verificar se policy filtra por `patient_id = auth.uid()`

---

## 🖥️ DEPENDÊNCIA EXCESSIVA DO FRONTEND

| Funcionalidade | Onde Roda | Deveria Rodar |
|---|---|---|
| Cálculo de trial (3 dias) | `AuthContext.tsx` client | Coluna `trial_ends_at` no banco + policy RLS |
| Validação de pagamento | `PaymentGuard.tsx` client | Webhook → status no banco + policy RLS |
| Role display | `AuthContext.tsx` (OK via RPC) | ✅ Correto: usa `get_my_primary_role()` |
| QR Code PIX | `PaymentCheckout.tsx` client | Edge Function + Gateway API |
| Listagem de planos | Objetos mock no client | Tabela `subscription_plans` (existe mas fallback mock) |

---

## 🤖 DEPENDÊNCIA DE OPENAI

| Componente | Uso | Fallback |
|---|---|---|
| `tradevision-core` Edge Function | GPT-4 para Nôa | ❌ Sem fallback offline documentado |
| Nôa COS Kernel | Decisões cognitivas | ❌ Sem modo determinístico verificado |
| Document RAG | Busca semântica | ❌ Sem fallback local |

Se OpenAI ficar indisponível:
- Chat com Nôa para completamente
- Nenhum relatório clínico pode ser gerado
- Sistema de navegação por voz para
- **Impacto:** 100% do valor diferencial da plataforma depende de 1 provider

---

## 🏗️ EDGE FUNCTIONS ANÁLISE

| Function | Status | Problema |
|---|---|---|
| `tradevision-core` | ⚠️ Parcial | Depende de `OPENAI_API_KEY` (ausente nos secrets) |
| `send-email` | ❌ Inoperante | `RESEND_API_KEY` ausente nos secrets |
| `digital-signature` | ⚠️ Não verificado | |
| `extract-document-text` | ⚠️ Não verificado | |
| `video-call-reminders` | ⚠️ Não verificado | Sem secret para envio |
| `video-call-request-notification` | ⚠️ Não verificado | Sem secret para envio |

---

## 📋 FLUXOS INCOMPLETOS (Parecem Completos Mas Não São)

### 1. Paciente → Consulta → Conclusão
```
✅ Paciente agenda consulta (appointment.status = 'scheduled')
✅ Profissional vê na agenda
❌ NINGUÉM altera para 'completed' — não existe botão/handler
❌ Trigger de bônus nunca dispara
❌ KPIs de conclusão são sempre 0
```

### 2. Paciente → Chat Clínico → Mensagem
```
✅ Sala é criada via RPC create_chat_room_for_patient()
✅ Participantes são adicionados
❌ Mensagem é enviada pelo frontend mas INSERT falha silenciosamente
❌ 0 mensagens no banco após meses de uso
```

### 3. Prescrição → Assinatura → Envio
```
✅ Prescrição é criada (23 drafts existem)
⚠️ Apenas 1 foi assinada, 1 foi enviada
❌ Email de notificação não funciona (RESEND_API_KEY ausente)
❌ QR Code ITI é gerado mas validação é simulada
```

### 4. Pagamento → Webhook → Status
```
✅ UI de checkout existe com 3 métodos (PIX, Cartão, Boleto)
❌ Nenhum gateway real conectado
❌ QR Code PIX é string hardcoded
❌ Nenhuma transação registrada
❌ Payment status nunca muda de 'pending' para 'paid'
❌ Trial de 3 dias calculado no client (bypassável)
```

---

## ✅ O QUE ESTÁ TECNICAMENTE CORRETO

1. **Arquitetura de Auth** — `AuthContext.tsx` usa `get_my_primary_role()` RPC (server-side), não localStorage
2. **Separação Component → Hook → Service** — Padrão respeitado na maioria dos módulos
3. **RBAC via `user_roles`** — Tabela separada com `has_role()` SECURITY DEFINER, sem role no profile
4. **30 views migradas para SECURITY INVOKER** — Feito em 25/02/2026
5. **Edge Function send-email** — Bem implementada com 6 templates, falta apenas a API key
6. **tradevision-core** — COS Kernel complexo com triggers semânticos, parsing robusto
7. **RLS habilitado em 100% das tabelas** — Todas as tabelas têm `rowsecurity = true`
8. **Chat architecture** — Modelo de salas/participantes/mensagens bem estruturado
9. **Trigger de sincronização de roles** — `sync_user_roles_from_profile()` mapeia roles automaticamente
10. **Sistema de gamificação** — Estrutura completa (pontos, ranking, achievements) — falta dados reais

---

## 🎯 PLANO DE AÇÃO PARA 100%

### FASE 1: Segurança (1-2 dias)
- [ ] Remover policy `allow_all_authenticated` de `cfm_prescriptions` → substituir por `doctor_id = auth.uid()`
- [ ] Remover 4 policies USING(true) redundantes de `documents`
- [ ] Corrigir policies de INSERT em `chat_messages` (desbloquear chat)
- [ ] Adicionar `SET search_path = 'public'` nas ~80 funções vulneráveis
- [ ] Ativar Leaked Password Protection no Auth
- [ ] Eliminar view `v_auth_activity`

### FASE 2: Pagamentos (2-3 dias)
- [ ] Ativar integração Stripe via conector Lovable
- [ ] Criar Edge Function para checkout com Stripe Checkout Session
- [ ] Implementar webhook para atualizar `payment_status` e criar `transactions`
- [ ] Adicionar coluna `trial_ends_at` na tabela `users` (server-side)

### FASE 3: Comunicações (1 dia)
- [ ] Configurar secret `RESEND_API_KEY`
- [ ] Verificar domínio de email no Resend
- [ ] Integrar chamadas de email nos fluxos reais (convite, prescrição, consulta)

### FASE 4: Fluxos Clínicos (1-2 dias)
- [ ] Adicionar botão "Concluir Consulta" no dashboard do profissional
- [ ] Handler que altera `appointments.status` → `completed`
- [ ] Verificar e corrigir trigger de bônus de referral
- [ ] Testar fluxo end-to-end: agendamento → conclusão → relatório

### FASE 5: Infraestrutura (1 dia)
- [ ] Configurar TURN server pago (Twilio ou Metered)
- [ ] Configurar secret `OPENAI_API_KEY` para Nôa
- [ ] Implementar fallback offline para Nôa
- [ ] Sincronizar os 4 users sem profile

---

## 📊 SCORES FINAIS

```
╔══════════════════════════════╦═══════╦══════════════════════════════════╗
║ DIMENSÃO                     ║ SCORE ║ JUSTIFICATIVA                    ║
╠══════════════════════════════╬═══════╬══════════════════════════════════╣
║ Prontidão para Produção      ║  48%  ║ Pagamento mock + chat morto      ║
║ Segurança Real               ║  42%  ║ 116 findings, policies true      ║
║ Escalabilidade               ║  55%  ║ Sem TURN, sem monitoring         ║
║ Maturidade Arquitetural      ║  72%  ║ Boa separação, dívida técnica    ║
║ Monetização Real             ║  15%  ║ 0 transações, 0 gateway          ║
║ Conformidade LGPD            ║  35%  ║ CPF/email expostos via policies  ║
║ Cobertura de Testes          ║   5%  ║ Sem testes automatizados         ║
╚══════════════════════════════╩═══════╩══════════════════════════════════╝

SCORE COMPOSTO DE PRODUÇÃO: 48%
TEMPO ESTIMADO PARA 100%: 7-10 dias úteis
```

---

*Documento gerado por auditoria automatizada com dados reais do Supabase.*  
*Security Scanner: 123 findings | Linter: 116 warnings | DB Queries: 8 consultas diretas*
