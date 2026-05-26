---
name: Catálogo das 11 Edge Functions (auditadas em 28/04/2026)
description: Lista completa com função real, status, tabelas usadas, env vars, e features half-implemented detectadas
type: reference
originSessionId: 60cf94b7-b5d3-4df1-974d-c1c92082460c
---
11 Edge Functions deployadas no projeto `itdjkfubfzmvmuxxjoae`. Auditadas em 28/04/2026 madrugada via Management API + leitura código.

## 🟢 Funcionais

### 1. `tradevision-core` (v302)
- **Função**: Core IA Nôa principal
- **Última edição**: HOJE (V1.9.97 deployed)
- **Tabelas usadas**: clinical_reports, appointments, cognitive_events, cognitive_decisions, cognitive_metabolism, institutional_trauma_log, ai_chat_interactions, patient_medical_records, etc.
- **Env vars**: `OPENAI_API_KEY`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`
- **Status**: 🟢 Lockado V1.9.95-V1.9.97. Auditado profundamente.

### 2. `digital-signature` (v52)
- **Função**: Assinatura digital ICP-Brasil/CFM (3 levels)
- **Tabelas**: `medical_certificates` (lê certificate ativo)
- **Princípio**: Requer `userConfirmed` (REGRA HARD §1 — fala ≠ ação)
- **Comentário**: "Sistema de assinatura digital conforme CFM/ITI. Arquitetura: COS v5.0 + TradeVision Core. Data: 05/02/2026"
- **Status**: 🟢 Funcional, pronto. Mas `medical_certificates` tem 0 rows — sem certificados emitidos ainda.

### 3. `wisecare-session` (v68)
- **Função**: **Provedor de videochamada V4H Cloud**
- **URL**: `session-manager.homolog.v4h.cloud/api/v1` ⚠️ **HOMOLOG**, não produção
- **Org**: `MedicannLab`
- **Auth**: login + password → Bearer token com cache (renovação 5min antes expira)
- **Fallback**: usar próprio LOGIN UUID como token
- **Env vars**: `WISECARE_LOGIN`, `WISECARE_PASSWORD`, `WISECARE_BASE_URL`, `WISECARE_DOMAIN`, `WISECARE_ORG`
- **Status**: 🟡 Funcional mas em **homologação** — migrar pra produção antes de pacientes externos

### 4. `extract-document-text` (v49)
- **Função**: OCR de PDFs/DOCX usando `pdfjs-serverless@0.4.2`
- **Tabelas**: `documents` (atualiza coluna `content`)
- **Modos**: `process_all`, `reprocess_binary` (PDFs binários raw), específico por `document_id`
- **Status**: 🟢 Funcional. Há 128 docs no bucket — alguns processados, outros não validado.

### 5. `send-email` (v46)
- **Função**: Provider de email **Resend**
- **Env vars**: `RESEND_API_KEY`, `RESEND_FROM_EMAIL` (default: `MedCannLab <onboarding@resend.dev>`)
- **CORS allowed**:
  - `localhost:3000`
  - `medcannlab.vercel.app`
  - `medcannlab.com.br`
  - **`*.lovable.app`** ⚠️ origem Lovable (no-code)
  - `*.lovableproject.com`
- **Templates**: HTML com gradient roxo/rosa
- **Status**: 🟢 Funcional. Detalhe: app originalmente foi feito na **Lovable** (no-code), CORS preservado por compat.

### 6. `video-call-request-notification` (v49)
- **Função**: Notificação de pedido de videochamada
- **Status**: 🟢 Funcional

### 7. `get_chat_history` (v6)
- **Função**: Histórico de chat
- **Última edição**: dez/2025
- **Status**: 🟡 Provavelmente estável — não auditei código

## 🔴 HALF-IMPLEMENTED (Edge Function deployed, tabela ausente)

### 8. `video-call-reminders` (v52)
- **Função**: Enviar lembretes 30/10/1min antes da videochamada
- **Tabela esperada**: `video_call_schedules` ❌ **NÃO EXISTE**
- **Sintoma**: Edge Function ativa, mas falha silenciosamente
- **Fix**: criar migration da tabela OU desativar Edge Function

### 9. `google-auth` (v16)
- **Função**: OAuth2 Google flow (scope `calendar.events`)
- **Env vars**: `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`
- **Redirect URI**: `{SUPABASE_URL}/functions/v1/google-auth`
- **Tabela esperada**: `professional_integrations` ❌ **NÃO EXISTE**
- **Sintoma**: feature implementada, **zero identities Google em auth.users**
- **Fix**: criar migration `professional_integrations` (com colunas access_token, refresh_token, expiry_date encrypted)

### 10. `sync-gcal` (v16)
- **Função**: Sync Google Calendar via job queue (10 jobs/batch)
- **Tabelas esperadas**: `integration_jobs` ❌ **NÃO EXISTE**, `professional_integrations` ❌ **NÃO EXISTE**
- **Lógica**: pega jobs pending, busca appointment, decrypt access_token (refresh se expira em 5min), chama Google Calendar API
- **Usa**: `_shared/crypto.ts` (encrypt/decrypt) — provavelmente AES com key em env var
- **Fix**: criar migrations das 2 tabelas + scheduler (não há pg_cron)

## 🟠 LEGACY (deletar)

### 11. `video-call-request-notification-` (v23)
- **Diferença**: hífen no fim do nome
- **Última edição**: nov/2025
- **Status**: 🟠 Duplicata legacy de #6, deletar em sprint de limpeza

## Notas operacionais

- **pg_cron NÃO instalado** — schedules precisam de scheduler externo (cron job na máquina, n8n, ou chamada manual via Dashboard)
- **Vault vazio** — secrets estão em **Edge Function environment variables** (Supabase Dashboard → Edge Functions → secrets), não em `vault.decrypted_secrets`
- **Deploy via**: `npx supabase functions deploy <slug> --project-ref itdjkfubfzmvmuxxjoae --no-verify-jwt`
- **`_shared/crypto.ts`** existe e é usado por `google-auth` e `sync-gcal` para encrypt/decrypt de tokens

## Refs

- Diário 28/04/2026 Bloco B
- Memory `project_lock_v1995_aec_relatorio_agendamento.md`
- Edge Functions list via: `curl https://api.supabase.com/v1/projects/{ref}/functions`
