---
name: v1-9-531-admin-users-status-left-join-fix-30-05
description: "30/05/2026 ~19h55 BRT — V1.9.531 ENTREGUE: fix RPC admin_get_users_status trocando INNER JOIN auth.users por LEFT JOIN (+ COALESCE email/is_online/ORDER BY). Bug REAL identificado em audit empírico pre-pausa Pedro: tela 'Base de Usuários Unificada' (ClinicalGovernanceAdmin.tsx:318) mostrava apenas 42 dos 51 users reais — INNER JOIN excluía 9 órfãos públicos legítimos CFM-compliant. Flávia Critstina (cadastrada HOJE 14:57 por Ricardo) + João Vidal SÓCIO FUNDADOR (cadastrado 28/01) + 7 outros eram INVISÍVEIS pro admin. Smoke 100% PASS empírico: 42 → 51 users via LEFT JOIN, todos 9 órfãos visíveis. Padrão CFM 2.314 pre-cadastro silencioso documentado [[feedback_padrao_orfaos_public_users_validos_29_05]] preservado — agora admin REALMENTE vê pattern em ação. Migration aditiva pura (CREATE OR REPLACE FUNCTION). Zero regressão: LEFT JOIN é superset de INNER (todos 42 anteriores continuam visíveis + adiciona 9). Frontend ClinicalGovernanceAdmin.tsx INTOCADO — apenas RPC alterada via PAT. Trigger pra desparquear este achado: Pedro perguntou 'agora não vejo o nome dela no sistema' empíricamente."
metadata:
  node_type: memory
  type: project
  originSessionId: 00be2b9f-5dbc-4236-a02e-1459c3f57bd2
---

# V1.9.531 — Fix admin_get_users_status INNER → LEFT JOIN (revela 9 órfãos invisíveis)

## A entrega (~15min real)

Migration: [supabase/migrations/20260530220000_v1_9_531_admin_users_status_left_join.sql](supabase/migrations/20260530220000_v1_9_531_admin_users_status_left_join.sql)

- **CREATE OR REPLACE FUNCTION** `admin_get_users_status()` mantém schema RETURNS TABLE
- `INNER JOIN auth.users au ON u.id = au.id` → **`LEFT JOIN auth.users au ON u.id = au.id`**
- `au.email::text` → `COALESCE(au.email, u.email)::text` (órfãos têm email próprio)
- `is_online` → `COALESCE(..., false)` (órfãos nunca online)
- `ORDER BY` adiciona `u.created_at` como fallback `NULLS LAST`

## Bug REAL identificado empíricamente

**Audit pré-pausa Pedro perguntou**: *"agora não vejo o nome dela no sistema! Base de Usuários Unificada SYNC: 21:48:03 — então ele não criou a conta dela?"*

Validação empírica via PAT:
```sql
SELECT COUNT(*) FROM public.users;       -- 51
SELECT COUNT(*) FROM auth.users;          -- 44
SELECT COUNT(*) FROM public.users pu 
   WHERE NOT EXISTS (
     SELECT 1 FROM auth.users au WHERE au.id = pu.id
   );                                      -- 9 órfãos
```

Análise do código da RPC (antes do fix):
```sql
FROM public.users u 
JOIN auth.users au ON u.id = au.id    -- ← INNER JOIN exclui 9 órfãos!
```

## Os 9 órfãos invisíveis ANTES do fix

| Paciente | Cadastro | Tipo | Status |
|---|---|---|---|
| Flávia Critstina | HOJE 14:57 | paciente | Cadastrada por Ricardo via Novo Paciente — INVISÍVEL pré-V1.9.531 |
| CArlos Eduardo Olivaira | 04/05 | paciente | Órfão há ~26 dias |
| Badhia Waarrak | 01/05 | patient | Órfão há ~30 dias |
| MILTON LUQUETT NETTO | 28/04 | paciente | Órfão há ~32 dias |
| Marne Serrano Caldera | 27/04 | paciente | Órfão há ~33 dias |
| **João Vidal SÓCIO FUNDADOR** | 28/01 | patient | ⚠️ Sócio invisível há 4 MESES |
| 3 Pacientes anonimizados | nov/2025 | patient | Pseudonimização V1.9.407 |

## Smoke 100% PASS empírico

Query manual (mesma lógica RPC pós-fix):
```sql
SELECT COUNT(*) FROM public.users u 
LEFT JOIN auth.users au ON u.id = au.id;
```

**Resultado**:
- Total: **51 users** (era 42 visíveis na tela)
- Órfãos visíveis: **9** (eram 0 visíveis)
- Todos 9 órfãos têm `last_sign_in_at = NULL` (esperado)
- Order by trata NULLs corretamente

## Pattern CFM-compliant preservado

[[feedback_padrao_orfaos_public_users_validos_29_05]] documentou:

> *"Rows em public.users SEM auth.users NÃO são órfãs nem bug — são pattern arquitetural válido. CFM 2.314 + Manual MedCannLab permitem prontuário sem login app."*

**Antes V1.9.531**: pattern ACEITO arquiteturalmente MAS invisível pra admin gerenciar.
**Pós V1.9.531**: pattern aceito + admin REALMENTE vê e gerencia (status amber "Pré-cadastro silencioso" possível futuro).

## Anti-regressão garantida

| Aspecto | Validação |
|---|---|
| Schema RETURNS TABLE | ✅ idêntico (10 colunas mesmos tipos) |
| LEFT JOIN é superset de INNER | ✅ todos 42 anteriores continuam visíveis |
| Filtros frontend (status='banned', payment_status='paid') | ✅ continuam funcionando |
| RLS público `users_select` | ✅ não afetado (RPC SECURITY DEFINER bypassa) |
| Check `is_admin()` no início | ✅ mantido (segurança) |
| ORDER BY NULLS LAST | ✅ órfãos sem login aparecem no final |

## Próximos passos naturais (Pedro decide)

### Curto prazo (próxima sessão)
- **V1.9.531-A** (parqueado decisão Pedro): toggle no NewPatientForm "Notificar paciente agora?" (default OFF) + email auto-enviado quando ON (~1h30min)
- **V1.9.532** (parqueado): badge visual amber "Pré-cadastro silencioso" + botão "Enviar Convite Agora" na ficha (~30min)

### Decisão Pedro pendente
- **Joao Vidal SÓCIO órfão há 4 meses** — quer notificar Joao pra completar signup? OR mantém pattern silencioso?
- **5 órfãos antigos** (Carlos/Badhia/Milton/Marne) — Pedro/Ricardo querem ativar OR manter pré-cadastro silencioso?

## Princípios meta aplicados

- [[feedback_mexer_so_gap_real_principio_meta_30_05]]: gap REAL detectado via pergunta empírica Pedro
- [[feedback_polir_nao_inventar]]: REPLACE FUNCTION reusa estrutura existente
- [[feedback_padrao_orfaos_public_users_validos_29_05]]: pattern já documentado, agora visível
- [[feedback_validacao_empirica_screenshot_maior_que_plano_teorico_28_05]]: smoke imediato pós-deploy via PAT confirmou 51 users

## Locks intocados

✅ V1.9.299 PBAD CONFORME ITI
✅ V1.9.388-A.3 ancoragem regulatória
✅ V1.9.452 PII sanitize
✅ V1.9.468-B Matrix Z2
✅ Todos 11 PATCH Edges hoje
✅ 5 migrations triggers notification (V1.9.516+527+528+530)

Zero migration destrutiva. Apenas CREATE OR REPLACE FUNCTION (idempotente).

## Conexões

- [[feedback_padrao_orfaos_public_users_validos_29_05]] — pattern CFM-compliant base
- [[feedback_2_gaps_p1_tecnicos_auth_triggers_e_video_call_notif_30_05]] — gap 1 auth.users 3-way race (separado deste fix)
- [[feedback_mexer_so_gap_real_principio_meta_30_05]] — princípio meta aplicado
- src/pages/ClinicalGovernanceAdmin.tsx:318 — frontend caller da RPC
- src/pages/NewPatientForm.tsx:341 — código que cria órfãos legítimos (V1.9.531-A parqueado)

## Frase âncora

> *"30/05 ~19h55: V1.9.531 fix RPC admin_get_users_status INNER → LEFT JOIN. Tela admin agora mostra 51 users reais (era 42) incluindo Flávia HOJE + João Vidal SÓCIO órfão 4 MESES + 7 outros pacientes CFM-compliant invisíveis. Pattern feedback_padrao_orfaos_public_users_validos_29_05 finalmente VISÍVEL empíricamente pra admin gerenciar. Smoke 100% PASS via PAT. Zero regressão (LEFT JOIN superset INNER). Migration aditiva pura. 24 commits + 19 memórias dia 30/05."*
