---
name: reference_schema_users_birth_date_nao_date_of_birth_07_06
description: "REFERENCE durable: coluna real em public.users e 'birth_date' (date) - NAO 'date_of_birth'. Bug V1.9.625 descoberto: RenalFunctionModule.tsx fazia SELECT date_of_birth -> query falhava silenciosamente -> caia pros defaults age=40/male -> calculo CKD-EPI errado pra pacientes com birth_date populado. Carolina (id 5c98c123, birth_date 1990-07-15, gender=null) aparecia '40 anos masculino' empiricamente. Reference pra evitar repeticao em outros componentes."
type: reference
---

# Schema users — `birth_date` (NÃO `date_of_birth`)

## A coluna real

`public.users.birth_date` — type `date`, nullable.

**NÃO existe** `date_of_birth`. Tentativa de SELECT silenciosamente falha (PostgREST retorna data vazia, frontend cai pros defaults).

## Audit empírico (PAT 07/06 ~22h BRT)

```sql
SELECT column_name, data_type FROM information_schema.columns
WHERE table_schema='public' AND table_name='users'
  AND (column_name ILIKE '%birth%' OR column_name ILIKE '%gender%' OR column_name ILIKE '%sex%');
```

Retornou:
| column_name | data_type |
|---|---|
| `birth_date` | date |
| `gender` | text |

## Caso empírico Carolina (5c98c123-83f9-4e66-9fb7-3f05a5431cc0)

```json
{
  "id": "5c98c123-83f9-4e66-9fb7-3f05a5431cc0",
  "name": "Carolina Campello do Rêgo Valença",
  "gender": null,
  "birth_date": "1990-07-15",
  "renal_count": 0
}
```

Idade real: **35 anos** (calculada a partir de birth_date 1990-07-15 vs hoje 2026-06-07).
Frontend mostrava **40 anos** (default localAge=40) + **Masculino** (default localGender='male').

## Como aplicar

### SELECT correto
```ts
const { data } = await supabase
  .from('users')
  .select('name, birth_date, gender')  // ✅ birth_date
  .eq('id', patientId)
  .maybeSingle()
```

### Calcular idade
```ts
if (data?.birth_date) {
  const dob = new Date(data.birth_date)
  const age = Math.floor((Date.now() - dob.getTime()) / (365.25 * 24 * 60 * 60 * 1000))
  if (age > 0 && age < 150) setLocalAge(age)
}
```

### Gender (cuidado: pode ser null)
- Banco aceita: `'male'`, `'female'`, `'feminino'`, `'masculino'`, `'f'`, `'m'`, `null`
- Frontend normaliza pra `'male' | 'female'`
- Se `null` → escolher default consciente (NÃO assumir `'male'` cego) OR pedir input médico

## Onde mais isso aparece no código (audit grep)

⚠️ **TODO**: rodar `grep -rn "date_of_birth" src/` pra encontrar outros componentes com mesmo bug.

Suspeitos comuns:
- `RenalFunctionModule.tsx` (corrigido V1.9.625)
- Componentes de cadastro paciente
- Pacientes management
- Patient demographics displays

## Quando aplicar esta referência

- ✅ Qualquer query SELECT em `public.users` que precisa de data nasc
- ✅ Componente que calcula idade
- ✅ Calculadora clínica que depende de age (CKD-EPI, doses pediátricas, etc)
- ✅ Display de demographics no prontuário

## Anti-padrões a vigiar

- ❌ Assumir nome de coluna sem PAT (sempre validar via information_schema)
- ❌ Tratar query falhada como "paciente sem data nasc" (pode ser bug)
- ❌ Default age=40 silencioso (deveria avisar médico que data não tá no cadastro)

## Conexões

- `feedback_auditar_componente_inteiro_antes_de_touch_07_06` (lição meta deste bug)
- `feedback_metodo_validacao_producao` (smoke 5 etapas)
- CLAUDE.md "4 tabelas de perfil existem... `users` é canônica"
- V1.9.625 commit `8cc8e02` (fix aplicado)

## Frase ancora

> *"07/06 PAT cravou: public.users tem birth_date (date), NÃO date_of_birth. Bug em RenalFunctionModule.tsx pre-existente — query falhava silenciosamente, frontend caía pros defaults age=40/male, calculo CKD-EPI errado pra pacientes com birth_date real (Carolina nasceu 1990 = 35a, aparecia 40a). Going-forward: SEMPRE validar nome de coluna via information_schema antes de SELECT em users. Audit grep pendente pra outros componentes com mesmo bug."*
