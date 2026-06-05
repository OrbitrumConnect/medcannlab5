---
name: feedback_authz_uuid_singleton_substitui_email_includes_05_06
description: "Pattern canônico para autorização baseada em identidade conhecida — substitui anti-padrão email.includes('faveret'|'ricardo'|'admin') por UUID singleton com is_official=true (banco) como fonte de verdade. V1.9.601 implementou em 4 spots (ChatGlobal moderação, aecGate name lookup, PatientAppointments identificação, LoginDebugPanel debug). Pattern reusável: pra adicionar 3º médico oficial = SET is_official=true no banco + adicionar UUID na constante."
type: feedback
---

# Pattern UUID singleton substitui anti-padrão `email.includes()`

## A regra

Toda autorização que concede privilégio especial a usuário específico **NUNCA** deve usar substring de email. Use UUID explícito + flag canônica no banco.

**Padrão correto**:
```ts
import { isEduardoFaveret } from '../lib/officialDoctors'

{showModeration && (isAdmin || isEduardoFaveret(user?.id)) && (...)}
```

**Anti-padrão**:
```ts
{showModeration && (isAdmin || user?.email?.includes('faveret')) && (...)}
```

## Why (vulnerabilidades empíricas)

1. **Homônimos**: `joaofaveret@gmail.com` ganha privilégios sem ser o Dr. Eduardo Faveret real.
2. **Fake fácil**: alguém cadastra `faveret.fake@example.com` → ganha mod no Fórum.
3. **Frágil em mudança**: Dr. Eduardo troca email pra `efaveret@medcannlab.com` → perde permissão silenciosamente.
4. **Audit indefensável**: revisão de segurança pergunta "quem é Eduardo Faveret?" → resposta "qualquer um com 'faveret' no email" não passa.

## How (implementação V1.9.601)

### Fonte de verdade do banco
`public.users.is_official = true` é a flag canônica (singleton, validado via PAT):

| Nome | UUID | Especialidade |
|---|---|---|
| Dr. Ricardo Valença | `2135f0c0-eb5a-43b1-bc00-5f8dfea13561` | Nefrologia (criador AEC) |
| Dr. Eduardo Faveret | `f4a62265-8982-44db-8282-78129c4d014a` | Neuropediatria + Neurofisiologia Clínica |
| Ricardo Valença admin | `99286e6f-b309-41ad-8dca-cfbb80aa7666` | Conta de gestão |

### Singleton lib (`src/lib/officialDoctors.ts`)
```ts
export const OFFICIAL_DOCTOR_UUIDS = {
  RICARDO_VALENCA: '2135f0c0-eb5a-43b1-bc00-5f8dfea13561',
  EDUARDO_FAVERET: 'f4a62265-8982-44db-8282-78129c4d014a',
  RICARDO_ADMIN:   '99286e6f-b309-41ad-8dca-cfbb80aa7666',
} as const

export function isOfficialDoctor(userId?: string | null): boolean { /* ... */ }
export function isEduardoFaveret(userId?: string | null): boolean { /* ... */ }
export function isRicardoValenca(userId?: string | null): boolean { /* ... */ }
export function getOfficialDoctorName(userId?: string | null): string | null { /* ... */ }
```

### Adicionar 3º médico oficial (procedimento)
1. `UPDATE users SET is_official=true WHERE id='<uuid>'` no banco (fonte canônica)
2. Adicionar `NOVO_MEDICO: '<uuid>'` em `OFFICIAL_DOCTOR_UUIDS`
3. Adicionar caso em `isOfficialDoctor` OR criar helper específico se necessário
4. Type-check + push 4 refs

## Quando aplicar

- ✅ **SEMPRE** que código checar "é o Dr. X específico?" para conceder privilégio
- ✅ Em moderação (Fórum, ChatGlobal, debug panels)
- ✅ Em identificação visual (nome do médico em landing, prontuário)
- ✅ Em lógica condicional baseada em médico específico

## Quando NÃO aplicar

- ❌ `searchQuery.includes()` em **caixa de busca** UI (filtro, não authz)
- ❌ Autorização de role genérica (admin/profissional/paciente/aluno) → usar `has_role()` ou `normalizedType` (já canônico em `adminPermissions.ts`)
- ❌ Identificação de paciente (paciente não tem `is_official=true`)

## Falsos positivos identificados em audit (5 spots — NÃO MEXER)

Todos `searchQuery.toLowerCase().includes()` em UI de filtro:
- `src/pages/AdminChat.tsx:389`
- `src/pages/ClinicalGovernanceAdmin.tsx:195`
- `src/components/MedicalWorkstation.tsx:74`
- `src/pages/GestaoAlunos.tsx:180`
- `src/pages/Patients.tsx:83`

São busca de UI, não autorização. Preservados.

## 4 spots editados V1.9.601

| Arquivo | Linhas | Helper usado |
|---|---|---|
| `src/pages/ChatGlobal.tsx` | 1590 + 2194 | `isEduardoFaveret(user?.id)` |
| `src/lib/aecGate.ts` | 189-194 + 80 | `getOfficialDoctorName(id)` + fallback email legado |
| `src/pages/PatientAppointments.tsx` | 252-253 | `isRicardoValenca(prof.id)` + `isEduardoFaveret(prof.id)` |
| `src/components/LoginDebugPanel.tsx` | 46 + 227 | `isOfficialDoctor(userId)` |

## Conexoes

- [[feedback_pattern_powershell_utf8_curl_data_binary_02_06]] — pattern aplicação UTF-8 safe
- `adminPermissions.ts` canônico (Phase 5) — `normalizedType==='admin'` via `user_roles` server-side
- AVALIACAO_360_05_06_2026.md BLOCO 4 + BLOCO 12 item 4 — flagrou o anti-padrão
- DIARIO_05_06_2026_PARTE_2_LAPTOP_SANEAMENTO_AUTHZ.md §F — execução completa

## Frase ancora

> *"05/06: substituí 4 spots `email.includes('faveret'|'ricardo'|'admin')` por UUID singleton `officialDoctors.ts` com `is_official=true` como fonte canônica no banco. Antes: `joaofaveret@gmail.com` (homônimo) ganhava mod no Fórum. Agora: só Eduardo real via UUID autoritativo. Princípio: identidade conhecida específica NUNCA via substring — sempre UUID + flag canônica do banco. Escalável: 3º médico oficial = 1 UPDATE + 1 linha no código."*
