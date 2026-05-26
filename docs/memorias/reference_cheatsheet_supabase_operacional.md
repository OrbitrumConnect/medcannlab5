---
name: Cheatsheet operacional — Supabase Management API + Edge Functions + GPT models
description: Comandos e queries que rodei dezenas de vezes em 27/04. Centraliza padrão de uso pra próxima sessão pegar de pé sem re-aprender
type: reference
originSessionId: 60cf94b7-b5d3-4df1-974d-c1c92082460c
---
## Supabase Management API (queries SQL via curl)

**Endpoint**: `POST https://api.supabase.com/v1/projects/{project_ref}/database/query`

**Project ref**: `itdjkfubfzmvmuxxjoae` (MedCannLab 3.0 produção)

**Auth**: Bearer PAT (Personal Access Token de Pedro)

**Header**: `Content-Type: application/json`

**Body**: `{"query": "SQL_AQUI"}` — escapar aspas duplas como `\"` se a SQL tiver, OU usar aspas simples na SQL.

### Pattern básico (curl Bash)

```bash
curl -s -X POST "https://api.supabase.com/v1/projects/itdjkfubfzmvmuxxjoae/database/query" \
  -H "Authorization: Bearer sbp_419b3389d0642b252af20235daf0df6ce4250976" \
  -H "Content-Type: application/json" \
  -d '{"query":"SELECT ... FROM ... ;"}'
```

**Importante**: aspas simples dentro do SQL precisam ser escapadas como `'\''` no shell:
```bash
-d '{"query":"SELECT * FROM users WHERE email='\''x@y.com'\'' ;"}'
```

### Limitação conhecida

- Roda **SECURITY DEFINER** como postgres (bypassa RLS — boa pra audit, ruim pra simular user real)
- `auth.uid()` dentro de RPC chamada via API = NULL
- Single-statement (não suporta `BEGIN; ... ROLLBACK;` multi-statement)
- DDL (CREATE/DROP/ALTER) funciona

## Queries comuns (testadas em 27/04)

### Audit policies de uma tabela
```sql
SELECT tablename, policyname, cmd, qual, with_check
FROM pg_policies
WHERE schemaname='public' AND tablename='X'
ORDER BY cmd, policyname;
```

### Check RLS habilitado por tabela
```sql
SELECT tablename, rowsecurity FROM pg_tables
WHERE schemaname='public' AND tablename IN ('a','b','c')
ORDER BY tablename;
```

### Listar views + security_invoker
```sql
SELECT c.relname AS view_name,
       CASE WHEN c.reloptions::text LIKE '%security_invoker=true%'
            OR c.reloptions::text LIKE '%security_invoker=on%'
            THEN 'INVOKER (RLS aplicada)'
            ELSE 'DEFINER (RLS BYPASSADA)'
       END AS security_mode
FROM pg_class c
WHERE c.relkind='v' AND c.relnamespace=(SELECT oid FROM pg_namespace WHERE nspname='public');
```

### Ler source de RPC
```sql
SELECT pg_get_functiondef(p.oid)
FROM pg_proc p
JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE n.nspname='public' AND p.proname='nome_da_rpc';
```

### Reports recentes do paciente X
```sql
SELECT id::text, patient_name, status, doctor_id::text,
       signature_hash IS NOT NULL AS signed,
       (content->'scores'->>'clinical_score')::int AS sc,
       generated_at::text
FROM clinical_reports
WHERE patient_id='UUID' AND created_at > now() - interval '4 hours'
ORDER BY created_at DESC;
```

### Appointments do paciente
```sql
SELECT id::text, patient_id::text, professional_id::text, status,
       appointment_date::text, professional_name, created_at::text
FROM appointments
WHERE patient_id='UUID' AND created_at > now() - interval '2 hours'
ORDER BY created_at DESC;
```

### Audit log de scheduling
```sql
SELECT actor_id::text, action, professional_id::text, start_time::text,
       status, error_message, attempt_at::text
FROM scheduling_audit_log
WHERE attempt_at > now() - interval '2 hours'
ORDER BY attempt_at DESC;
```

### Tokens GPT consumidos (custo)
```sql
SELECT count(*) AS total,
       count(*) FILTER (WHERE (metadata->>'tokens')::int = 0) AS verbatim_bypass,
       count(*) FILTER (WHERE (metadata->>'tokens')::int > 0) AS gpt_calls,
       sum(COALESCE((metadata->>'tokens')::int, 0)) AS tokens_total
FROM ai_chat_interactions
WHERE created_at > now() - interval '4 hours';
```

### Storage buckets visibility
```sql
SELECT id, name, public, created_at::text FROM storage.buckets ORDER BY name;
```

### Storage policies
```sql
SELECT tablename, policyname, cmd, qual
FROM pg_policies
WHERE schemaname='storage'
ORDER BY tablename, cmd;
```

## Smoke test pattern (RPC test sem poluir DB)

```bash
# 1. Tentar com input inválido (espera RAISE EXCEPTION)
curl ... -d '{"query":"SELECT rpc_name(args_invalidos);"}'
# → mensagem de erro confirma validação funciona

# 2. Tentar com input válido (cria entidade)
curl ... -d '{"query":"SELECT rpc_name(args_validos);"}'
# → retorna ID da entidade criada

# 3. Validar persistência
curl ... -d '{"query":"SELECT * FROM tabela WHERE id='\''ID_RETORNADO'\'';"}'

# 4. Cleanup (importante!)
curl ... -d '{"query":"DELETE FROM tabela WHERE id='\''ID'\'' RETURNING id::text;"}'
```

## Edge Function deploy

```bash
npx supabase functions deploy tradevision-core \
  --project-ref itdjkfubfzmvmuxxjoae \
  --no-verify-jwt
```

**Notas**:
- `--no-verify-jwt` necessário porque Core valida JWT manualmente
- Docker rodando ou não — Supabase CLI faz upload sem Docker
- Deploy é instantâneo após upload (sem cold start visível)
- Logs aparecem em `https://supabase.com/dashboard/project/itdjkfubfzmvmuxxjoae/functions`

## Modelos GPT em uso (mapa)

| Componente | Modelo | Quando | Custo |
|---|---|---|---|
| Chat livre fora-AEC | `gpt-4o-2024-08-06` | Pergunta genérica do paciente | $4/1M tokens (blend) |
| Escriba V1.9.84 | `gpt-4o-mini` | Geração do relatório clínico | $0.30/1M (mais barato) |
| Verbatim First (V1.9.86) | nenhum (bypass) | Hard-lock phases | **$0** (economia) |
| AEC FSM | nenhum (templates) | Próxima pergunta | $0 |

**46% das interações usam Verbatim** (bypass) — economia validada em métricas reais.

## Push dual-remote (política)

```bash
git push hub HEAD:main && \
git push hub HEAD:master && \
git push origin HEAD:main && \
git push origin HEAD:master
```

**Por que**: hub (`amigo-connect-hub`) e origin (`medcannlab5`) são 2 repos diferentes que precisam ficar sincronizados. main e master são 2 branches que diferentes consumidores leem.

**Sempre**: 4 refs em todo commit. Quebrar = quebra deploy de algum consumidor.

## Como ler logs Edge Function

Pedro cola logs em formato JSON (array de eventos). Cada evento tem:
- `event_message` — texto do log
- `timestamp` — em microsegundos epoch (dividir por 1.000.000 pra segundos)
- `level` — info/warning/error
- `execution_id` — agrupa logs da mesma execução

**Conversão timestamp**:
```
1777327055000000 microseg → 1777327055 seg → Date(1777327055 * 1000) → 2026-04-27 22:37:35 UTC = 19:37 BRT
```

**Logs importantes do Core**:
- `📥 [REQUEST]` — inicia processamento
- `⏳ [AEC GATE V1.5] Agendamento retido` — gate funcionando
- `🟢 [V1.9.86 VERBATIM-FIRST]` — bypass GPT
- `🤖 [AI RESPONSE]` — modelo + tokens (Verbatim = tokens=0)
- `📝 [ORCHESTRATOR] Detectado fechamento` — pipeline disparado
- `✅ [PIPELINE_STAGE] DONE` — relatório completo
- `⚡ [TRIGGER] Tag de agendamento detectada` — token GPT
- `⛔ [AEC GATE V1.5] GPT emitiu [TRIGGER_SCHEDULING] durante AEC ativa` — V1.9.95-A bloqueando

## Comando útil: rodar type-check no front

```bash
npm run type-check
# Erros conhecidos (não regressão): imreMigration.ts, clinicalAssessmentService.ts, SlidePlayer.tsx
# Filtrar errors do arquivo editado:
npm run type-check 2>&1 | grep "MeuArquivo.tsx"
```

## Vercel deploy

- Auto-deploy em push pra `main` (hub e origin)
- Build local quebrado por `dompurify` não instalado em `node_modules` — Vercel passa porque `package.json` tem
- URL de produção: não documentada nesta memória (perguntar Pedro)

## Acessos importantes

- **Supabase Dashboard**: https://supabase.com/dashboard/project/itdjkfubfzmvmuxxjoae
- **Logs Edge Function**: dashboard → Edge Functions → tradevision-core → Logs
- **DB SQL Editor**: dashboard → SQL Editor (alternativa ao curl)
- **PAT**: `sbp_419b3389d0642b252af20235daf0df6ce4250976` (do Pedro)

## Sugestão de melhoria pra próxima sessão

Quando Pedro quiser que eu rode N queries em sequência, agrupar todas no primeiro request (transações ou múltiplos curl em paralelo). Hoje rodei 25+ queries em série — economia possível.
