# Análise dos triggers em auth.users (2026-04-24)

Auditoria feita como parte da Fase 6 do plano rumo à produção. **Nenhum trigger foi removido nesta análise** — apenas mapeadas redundâncias e preparada proposta de consolidação.

## Mapa atual (6 triggers)

| # | Trigger | Função | Tabela alvo | Observação |
|---|---|---|---|---|
| 1 | `on_auth_user_created` | `handle_new_user` | `users` + `user_roles` | Único a criar em `public.users` |
| 2 | `on_auth_user_created_profile` | `handle_new_user_profile` | `user_profiles` (points=0, level=1) | Só gamificação |
| 3 | `trg_auth_users_to_user_profiles` | `handle_new_auth_user` | `user_profiles` (email, full_name, role) | **DUPLICADO do #4** |
| 4 | `trg_handle_new_auth_user` | `handle_new_auth_user` | `user_profiles` (email, full_name, role) | **DUPLICADO do #3** — mesma função |
| 5 | `trg_link_existing_user` | `fn_on_auth_user_created_link_existing` | `user_profiles` (points=0, level=1) + links | Linking cross-email |
| 6 | `on_auth_user_deleted` | `handle_auth_user_deletion` | — (BEFORE DELETE) | Ciclo de vida |

## Redundâncias confirmadas

### A — Mesma função em 2 triggers
`trg_auth_users_to_user_profiles` e `trg_handle_new_auth_user` chamam ambos `handle_new_auth_user()`. A função roda **duas vezes** para cada signup. É idempotente via `ON CONFLICT DO NOTHING`, então não causa erro, mas desperdiça trabalho.

### B — Conflict-on-nothing corrompe dados
Os triggers 2, 3 (ou 4) e 5 inserem todos em `user_profiles` com `ON CONFLICT (user_id) DO NOTHING`. Ordem alfabética de execução:

1. `on_auth_user_created_profile` (trigger 2) → insere `user_id, points=0, level=1`
2. `trg_auth_users_to_user_profiles` (trigger 3) → tenta inserir `user_id, email, full_name, role` → **conflict, nada inserido**
3. `trg_handle_new_auth_user` (trigger 4) → idem, conflict
4. `trg_link_existing_user` (trigger 5) → idem, conflict

**Resultado observado (antes do backfill de 2026-04-24):**
- 34 user_profiles totais, 27 com auth.users match
- 0 com full_name ✗
- 10 sem email ✗
- 15 sem role ✗
- 34 com points ✓ (sempre o trigger 2 ganha)

**Backfill aplicado:** UPDATE cross-reference com `auth.users.raw_user_meta_data` corrigiu os 27 users reais. Todos agora têm email, full_name, role.

## Proposta de consolidação (NÃO executada — aguardando decisão)

**Objetivo:** manter comportamento, eliminar redundância, garantir que full_name/email/role sejam preenchidos em todo signup novo.

### Passo 1 — Função consolidada `handle_new_user_unified`
Unir lógica dos 4 triggers INSERT (triggers 1, 2, 3/4, 5) em uma única função SECURITY DEFINER que:
1. INSERT em `public.users` (+ `user_roles`)
2. INSERT em `public.user_profiles` com TODOS os campos (user_id, email, full_name, role, points=0, level=1) via `ON CONFLICT (user_id) DO UPDATE SET` (update real, não do-nothing, pra garantir campos preenchidos mesmo em re-signup)
3. Linking de email pré-existente (da `fn_on_auth_user_created_link_existing`)

### Passo 2 — Manter apenas 2 triggers
- `on_auth_user_created_unified` → `handle_new_user_unified` (substitui 1, 2, 3, 4, 5)
- `on_auth_user_deleted` → `handle_auth_user_deletion` (mantém, já é único)

### Riscos
- Baixo: todos os signups de hoje em diante executam 1 função em vez de 5. Funções antigas não precisam ser dropadas imediatamente (podem coexistir como código órfão até validação de signup novo).
- Rollback: remover trigger unificado e recriar os 5 antigos a partir deste documento.

## Recomendação
- **Aguardar autorização explícita** antes de consolidar. Signup é fluxo crítico.
- Testar em dev primeiro (se ambiente dev existir).
- Fazer consolidação fora de horário de pico.
