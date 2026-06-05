---
name: feedback_sanitize_pii_nome_meio_escapa_05_06
description: "Sanitize PII (sanitizeRationalityPII Edge v425) pode escapar nome do meio quando users.name tem typo OU quando nome é composto e o input clínico bruto usa versão correta. Caso empírico Flávia Critstina (typo) → 'Cristina' no chat real → 2 rationalities expostas. Fix REGEXP_REPLACE word-boundary cirúrgico aplicado 05/06. Princípio meta: heurística de auditoria PII deve TOKENIZAR nomes (string_to_array) e cruzar TODOS os tokens, não só nome+sobrenome."
type: feedback
---

# Sanitize PII pode escapar nome do meio (typo + nome composto)

## A regra

Toda função de sanitize de PII em texto livre clínico deve:

1. **Extrair TODOS os tokens do `users.name`** via `string_to_array(name, ' ')`, não só primeiro+último
2. **Tolerar typos** no `users.name` cruzando também com variantes phonéticas/levenshtein 1-2 OU normalizando entrada
3. **Substituir TODOS os tokens >3 chars** por pseudônimo `Paciente #XXXXXX` (primeiros 6 chars uppercase do UUID)
4. **Word boundary obrigatório**: `\m<token>\M` em REGEXP_REPLACE pra não pegar "Cristiano" ao substituir "Cristina"

Toda **heurística de auditoria PII** (queries de validação) deve tokenizar `users.name` e cruzar token por token, **não procurar por nomes completos conhecidos**. Caso contrário cria falso negativo silencioso.

## Why (caso empírico Flávia)

**05/06/2026 ~15h BRT** — investigação Pedro flagrou "Cristina" em rationalities. Investigação empírica via PAT:

- **`users.id = 18ece941`**: name = `"Flávia Critstina Teodoro  Serra Quitanilha"` (com typo "Critstina" no cadastro)
- **2 rationalities da Flávia** com "Cristina" exposto no `assessment`:
  - `a3e45bda` (homeopathic, 02/06 09:57 UTC) — *"Paciente: Paciente #18ECE9 Cristina Paciente #18ECE9 apresenta..."*
  - `224bc80b` (traditional_chinese, 31/05 17:35 UTC) — *"PACIENTE: Paciente #18ECE9 Cristina Paciente #18ECE9 apresenta..."*
- **3ª rationality (integrative `cf9cbcf1` 31/05 16:21 UTC) ficou LIMPA** — input clínico nesse turno não continha "Cristina"

**Causa raiz**: `sanitizeRationalityPII` (Edge v425, V1.9.565/566) tokenizou `users.name` "Flávia **Critstina** Teodoro" e substituiu cada token. Mas o input clínico bruto (chat, exames, AEC) usou versão CORRETA "Cristina" → token não casou com "Critstina" do banco → escapou.

**Lição dupla**:
1. Typo em `users.name` quebra sanitize por causalidade direta
2. Nome composto (4-5 tokens) aumenta superfície de escape

## How to apply (going-forward)

### Em `sanitizeRationalityPII` (Edge tradevision-core):

```typescript
function sanitizePII(text: string, patientName: string, patientUuid: string): string {
  const pseudonym = `Paciente #${patientUuid.slice(0, 6).toUpperCase()}`
  const tokens = patientName
    .split(/\s+/)
    .map(t => t.trim())
    .filter(t => t.length >= 3) // pula "de", "da", "do"
  
  let sanitized = text
  for (const token of tokens) {
    // \b boundary + flag i (insensível a caso) + acento via Unicode property
    const regex = new RegExp(`\\b${escapeRegex(token)}\\b`, 'gi')
    sanitized = sanitized.replace(regex, pseudonym)
  }
  return sanitized
}
```

### Em auditoria PII (script de validação):

```sql
WITH patient_tokens AS (
  SELECT u.id AS patient_id, u.name AS full_name,
         unnest(string_to_array(TRIM(u.name), ' ')) AS token
  FROM users u
  WHERE u.type IN ('paciente','patient') AND u.name IS NOT NULL
)
SELECT pt.token, pt.full_name, cr.id AS leak_id
FROM patient_tokens pt
JOIN clinical_rationalities cr
  ON cr.patient_id = pt.patient_id
 AND cr.assessment ~* ('\m' || pt.token || '\M')
WHERE LENGTH(pt.token) >= 4
  AND LOWER(pt.token) NOT IN ('silva','santos','souza','...')  -- excluir sobrenomes comuns
```

**Importante**: TOKEN aparecer numa rationality do MESMO `patient_id` é alta correlação de PII residual real (vs token aparecer numa rationality de OUTRO paciente, que pode ser falso positivo de termo comum).

## Caso empírico Pedro Paciente — falso positivo

`Pedro Paciente` (conta teste interna) tem `users.name = "Pedro Paciente"` literalmente. Token "Paciente" gera **42 matches** falsos positivos em rationalities (porque "Paciente" é termo genérico em texto clínico tipo "o paciente apresenta..."). 

**Regra**: tokens muito genéricos OU iguais à palavra "Paciente" devem ser **ignorados** na auditoria. Pedro Paciente é caso patológico de teste — não bug real.

## Anti-padrao confirmado

❌ **NUNCA**: heurística PII que procura **lista finita de nomes completos conhecidos** (`'Maria das Dores'`, `'Carolina Campello'`, etc) — produz falso negativo silencioso quando paciente novo entra OR quando nome do meio escapa.

✅ **SEMPRE**: tokenizar `users.name` no banco vivo + cruzar token-a-token + filtrar tokens genéricos via blacklist.

## Anti-padrão regex falsos positivos

❌ **NÃO usar**: regex genérico tipo `[A-Z][a-z]+\s[A-Z][a-z]+\s[A-Z][a-z]+` pra detectar PII — pega "Análise Holística Clínica", "Identificação Geral Paciente", etc como falso positivo. Já caímos nessa V1.9.503 SGQ (corrigido V1.9.505 com exclude list).

✅ **USAR**: cruzar com lista REAL de tokens de `users.name` (banco vivo).

## Fix empírico V1.9.597 (05/06)

```sql
UPDATE clinical_rationalities
SET assessment = REGEXP_REPLACE(assessment, '\mCristina\M', 'Paciente #18ECE9', 'g'),
    updated_at = NOW()
WHERE id IN ('a3e45bda-b480-4bca-9bca-6688e5eeaf18',  -- homeopathic Flávia
             '224bc80b-acbb-44dd-9030-853aee29d421'); -- MTC Flávia
```

Pré-fix: 2 rows com `tem_cristina=true`.
Pós-fix: 2 rows com `tem_cristina=false` + `tem_pseudonimo=true` ✅.
Encoding UTF-8 safe via PowerShell + `--data-binary @file --header charset=utf-8`.

## Pendência (parqueada conscientemente)

A função `sanitizeRationalityPII` Edge v425 ainda escapa nome do meio se input clínico usar versão sem typo enquanto `users.name` tem typo. **Próxima rodada Edge v426+** deve aplicar fix going-forward (tokenização + tolerância typo via normalize).

Trigger pra desparquear: próximo paciente novo com nome composto + alguém flagar empíricamente OU smoke periódico via auditoria SQL acima.

## Conexoes

- [[feedback_pattern_powershell_utf8_curl_data_binary_02_06]] — pattern de aplicação fix UTF-8 safe
- [[project_v1_9_452_pii_sanitize_clinical_rationalities_29_05]] — versão Edge anterior
- [[feedback_doc_institucional_sem_pat_nao_e_valido_23_05]] — princípio Ricardo aplicado retroativamente (validar PII via PAT, não via narrativa)
- AVALIACAO_360_05_06_2026.md — claim "PII residual 25" parcialmente refutado: real foram 2 rows da Flávia (não 25). Demais 19 rows não-pseudonimizadas usam linguagem genérica sem PII real.

## Frase ancora

> *"05/06: auditoria PII via lista fechada de 17 nomes conhecidos disse 0 vazamentos. Auditoria via TOKENIZAÇÃO de `users.name` no banco vivo achou 2 rows da Flávia ('Cristina' por causa de typo 'Critstina' no users + nome composto). Princípio meta: heurística PII deve cruzar TOKEN A TOKEN do banco vivo, não procurar nomes conhecidos. Fix REGEXP_REPLACE \\m...\\M cirúrgico, 2 rows corrigidas, encoding UTF-8 safe."*
