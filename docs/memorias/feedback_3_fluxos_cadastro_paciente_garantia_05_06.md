---
name: feedback_3_fluxos_cadastro_paciente_garantia_05_06
description: "Garantia arquitetural going-forward dos 3 fluxos de cadastro de paciente (A: manual 1 paciente, B: bulk import EMR, C: link/referral self-signup). Status empirico 05/06: 12/12 cadastros ultimos 30d com auth.users correto. V1.9.598 fechou gap try-catch silencioso Fluxo A (anti-orfao profilatico pre-Marco 2). 4 orfaos pre-V1.9.533 (Marne/Milton/Badhia/Carlos) sao residuo de fluxo morto SQL direto - NUNCA mais reproduzir."
type: feedback
---

# Garantia 100% — 3 fluxos de cadastro de paciente

## A regra (going-forward)

Todo novo paciente entra no MedCannLab via **um dos 3 fluxos sancionados**:

| Fluxo | Quem inicia | Componente | Edge | Cria auth.users? |
|---|---|---|---|---|
| **A — Manual 1 paciente** | Médico no prontuário | `NewPatientForm.tsx` (mode='manual'/'drag-drop') | `create-patient-auth` V1.9.533 | ✅ UUID forçado |
| **B — Bulk import EMR** | Médico via wizard | `ImportClinicalBaseWizard.tsx` | `bulk-import-emr` V1.9.587-588 | ✅ admin.createUser |
| **C — Link/Referral** | Paciente via QR/link | `InvitePatient.tsx` + signup Auth nativo | (trigger `handle_new_user`) | ✅ trigger pg |

**Anti-fluxo cravado**: NUNCA cadastro via SQL direto em `public.users` sem criar `auth.users` paralelo. Quem fizer reproduz os 4 órfãos pré-V1.9.533 (Marne/Milton/Badhia/Carlos cadastrados ~27/04→04/05 que pagaram R$ 63 mas nunca conseguiram logar).

## Why (smoke empírico 05/06)

12 cadastros últimos 30 dias auditados via PAT:

| Paciente | Data | Fluxo | tem_auth? |
|---|---|---|---|
| Gisele Ribeiro Gonçalves | 01/06 | C (self-signup) | ✅ |
| Luiz Claudio Bispo Alves | 01/06 | C (self-signup) | ✅ |
| Flávia Critstina Teodoro Serra Quitanilha | 30/05 | C (signup + invited_by) | ✅ |
| Illa Proença | 22/05 | C (self-signup) | ✅ |
| Nonu Castro da Silva | 21/05 | C (self-signup) | ✅ |
| Mateus Chagas | 18/05 | C (self-signup) | ✅ |
| Ana Beatriz Pimenta (profissional) | 17/05 | C (self-signup) | ✅ |
| Maria das Dores Pinto Pitoco | 14/05 | C (self-signup) | ✅ |
| João Guimarães | 13/05 | C (self-signup) | ✅ |
| Mariana Carvalho | 13/05 | C (self-signup) | ✅ |
| maiara silva tavares de lima | 11/05 | C (self-signup) | ✅ |
| Cristiano Pontes | 11/05 | C (self-signup) | ✅ |

**12/12 com `tem_auth=true`** → going-forward o problema dos 4 órfãos NÃO se manifestou. Mas profilaticamente fechamos o gap try-catch silencioso (V1.9.598).

## How — V1.9.598 fix gap try-catch silencioso Fluxo A

### Antes (V1.9.533, criado 30/05)
[NewPatientForm.tsx:567-570](src/pages/NewPatientForm.tsx#L567):
```typescript
} catch (e) {
  // Fallback silencioso — médico ainda tem QR/link
  console.warn('[V1.9.533] Edge invoke exception:', e)
}
```
Risco: Edge falha → médico não sabe → paciente fica em limbo SEM login → reproduz padrão dos 4 órfãos pré-V1.9.533 quando volume escalar pré-Marco 2.

### Depois (V1.9.598, 05/06)
- Captura `authError: string | undefined` no try-catch
- Mensagem detalhada na tela de sucesso (bloco vermelho/amber claro + AlertCircle)
- Texto explicativo: *"O paciente foi cadastrado no prontuário, mas a conta de acesso (login/senha) não pôde ser criada automaticamente"* + solução: usar o QR Code/link gerado

3 cenários cobertos:
1. **Email temporário** (`@medcannlab.temp`) → mensagem específica
2. **Edge invoke falhou** (rede/JWT) → mensagem + sugestão reenvio
3. **Edge retornou no-success** → mensagem com error específico

Type-check verde. Zero impacto runtime quando Edge funciona (caminho feliz inalterado).

## Triggers auth.users que GARANTEM Fluxo C (5 ativos)

```
on_auth_user_created           → handle_new_user (cria public.users)
on_auth_user_created_profile   → handle_new_user_profile (cria user_profiles)
trg_auth_users_to_user_profiles → handle_new_auth_user
on_auth_user_deleted           → handle_auth_user_deletion (cleanup)
trg_link_existing_user (V1.9.533) → fn_on_auth_user_created_link_existing (UUID forçado)
```

Verificados via PAT 05/06. Signup normal (Supabase Auth signUp) sempre cria public.users + user_roles automaticamente.

## Anti-padrao a NUNCA fazer

❌ **NUNCA**: INSERT direto em `public.users` via SQL/Management API sem criar `auth.users` correspondente. Reproduz Marne/Milton/Badhia/Carlos (4 órfãos pré-V1.9.533).

❌ **NUNCA**: try-catch silencioso em Edge que cria identidade. Princípio meta cristalizado V1.9.598: *"INSERT que cria identidade nunca pode ser silencioso — médico precisa saber pra recuperar"*.

❌ **NUNCA**: bypassar Edge `create-patient-auth` chamando `auth.admin.createUser` direto via PAT em produção (princípio V1.9.533 + lição V1.9.546 Flávia tokens NULL).

✅ **SEMPRE**: usar 1 dos 3 fluxos sancionados (A/B/C).

## Frente 3 parqueada — Check 7 SGQ auth_orfaos

Próximo passo natural: adicionar Check 7 em `run_sgq_health_checks()` que detecta `public.users` sem `auth.users` correspondente e grava em `system_health_alerts`. Permite admin ver no dashboard SGQ.

**Parqueado** porque exige mexer em função SQL crítica + smoke matriz. Aplicar princípio "Edge que cria identidade merece sessão fresca" (V1.9.582 lição). Trigger pra desparquear: próxima sessão SGQ OU quando voltar a haver órfão empírico.

## Pendências (não bloqueadores)

- 4 órfãos pré-V1.9.533: Marne/Milton/Badhia/Carlos (todos pacientes do Ricardo, confirmados por Pedro 05/06). Decisão Pedro+Ricardo de ativar via Edge create-patient-auth OU anonimizar.
- 1 órfão sócio CNPJ: João Vidal joao.vidal@remederi.com (esperado, ativará pós-CNPJ).
- 3 órfãos anonimizados (LGPD enforcement, esperado, NÃO mexer).

## Conexoes

- [[feedback_pattern_powershell_utf8_curl_data_binary_02_06]] — pattern aplicação fix UTF-8 safe
- [[project_v1_9_560_documents_separacao_curadoria_meus_02_06]] — pattern Fase A→B→C atomic com smoke por papel
- [[feedback_nunca_criar_auth_users_sql_direto_tokens_null_31_05]] — origem do princípio anti-SQL direto
- DIARIO_05_06_2026 §G — bug Flávia exame RLS (irmã do mesmo princípio)
- AVALIACAO_360_05_06_2026.md — 5 auditorias paralelas validaram 17 Edges + 147 RLS

## Frase ancora

> *"05/06 cedo: Pedro pediu garantia 100% dos 3 fluxos cadastro (manual / bulk / referral) sem regressão eletrico-pro-escalavel-triple-A. Smoke empírico 12/12 cadastros últimos 30d com auth.users correto = padrão saudável pós-V1.9.533. V1.9.598 fechou gap try-catch silencioso profilaticamente (anti-órfão pre-Marco 2 quando volume escalar). 4 órfãos pré-V1.9.533 ficam como pendência decisão humana Pedro+Ricardo (4 pacientes reais do Ricardo). Princípio cravado: INSERT que cria identidade NUNCA pode ser silencioso."*
