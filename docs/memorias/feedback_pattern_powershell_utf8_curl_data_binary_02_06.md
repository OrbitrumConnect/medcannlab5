---
name: feedback_pattern_powershell_utf8_curl_data_binary_02_06
description: Pattern canonico para escrita PT-BR via PAT (Management API Supabase) em ambiente Windows — PowerShell escreve JSON UTF-8 sem BOM + curl --data-binary @file. Reverte anti-padrao curl -d inline (que quebra acentos como Valenca, alergica, etc).
type: feedback
---

# Pattern PowerShell UTF-8 + curl --data-binary @file (escrita PT-BR via PAT no Windows)

## A regra

Toda escrita SQL via Management API Supabase contendo texto em PT-BR (acentos, ç, etc) deve usar fluxo de 2 passos:

1. **PowerShell** escreve JSON payload com encoding UTF-8 sem BOM:
   ```powershell
   $sql = [System.IO.File]::ReadAllText((Resolve-Path $sqlPath).Path, [System.Text.Encoding]::UTF8)
   $payload = @{ query = $sql } | ConvertTo-Json -Compress
   $utf8NoBom = New-Object System.Text.UTF8Encoding($false)
   [System.IO.File]::WriteAllText($payloadPath, $payload, $utf8NoBom)
   ```

2. **curl** envia via `--data-binary @file` com Content-Type explícito:
   ```bash
   curl -sS --ssl-revoke-best-effort -X POST "https://api.supabase.com/v1/projects/${PROJ}/database/query" \
     -H "Authorization: Bearer ${PAT}" \
     -H "Content-Type: application/json; charset=utf-8" \
     --data-binary "@tmp/payload.json"
   ```

**Validação byte-level pós-write** (multibyte detection):
```sql
SELECT octet_length(campo) AS bytes, length(campo) AS chars FROM tabela WHERE ...
```
Se `bytes > chars`, é multibyte UTF-8 correto. Se forem iguais E o campo deveria ter acentos, encoding quebrou.

## Why (anti-padrao histórico empírico)

**Anti-padrao**: `curl -d "{\"query\":\"UPDATE ... SET allergies = 'Rinite alérgica' ...\"}"` inline. Shell Windows (bash via Git for Windows) converte encoding ao expandir a string entre aspas, e o servidor Postgres recebe `Rinite al�rgica` (caractere de substituição U+FFFD).

**Casos empíricos no MedCannLab**:

1. **31/05 desktop**: ref bio Ricardo gravou "Método Incentivador" quando Ricardo disse "Motor" — drift editorial pós-crash do PC (memória `feedback_nunca_criar_auth_users_sql_direto_tokens_null_31_05` cristalizou padrão geral mas escopo era SQL direto auth.users)
2. **02/06**: tentei UPDATE Gisele `allergies='Rinite alérgica'` via curl -d inline → banco recebeu `Rinite al�rgica`. Detectei via `octet_length` vs `length`. Corrigi com `chr(233)` (técnica shell-independent).
3. **02/06 mesmo dia V1.9.560-A**: aplicado o pattern correto (PowerShell + --data-binary) → migration com `Valença` gravou byte-level OK.
4. **02/06 V1.9.560-C**: idem, RLS migration com comentários PT-BR aplicada limpa.

## How to apply (quando)

- **Toda migration `.sql` com PT-BR** que vai ser aplicada via PAT (não via `supabase db push`)
- **Todo UPDATE/INSERT direto via PAT** que contenha string PT-BR (nome, queixa, observação, etc)
- **Toda criação de função SQL** com comentário/literal PT-BR

## Tecnica alternativa (quando PowerShell nao disponivel)

Usar `chr(N)` no SQL pra escapar acento específico:
- `chr(225)` = á
- `chr(227)` = ã
- `chr(231)` = ç
- `chr(233)` = é
- `chr(237)` = í
- `chr(243)` = ó
- `chr(245)` = õ
- `chr(250)` = ú

Exemplo: `'Rinite al' || chr(233) || 'rgica'` em vez de `'Rinite alérgica'`. Funciona em qualquer shell.

## Anti-padrao a NUNCA fazer

```bash
# ❌ NUNCA:
curl -d "{\"query\":\"UPDATE users SET name = 'Valença' WHERE id = '...'\"}"
```

## Pattern correto a SEMPRE seguir (Windows)

```bash
# ✅ SEMPRE em 2 passos:
# 1) PowerShell: escrever payload UTF-8
# 2) curl --data-binary @file --header 'charset=utf-8'
```

## Conexoes

- [[feedback_nunca_criar_auth_users_sql_direto_tokens_null_31_05]] — princípio adjacente sobre INSERT auth.users SQL direto
- DIARIO_02_06_2026 §B.2 — caso empírico drift V1.9.559
- DIARIO_02_06_2026 §F.1 + §F.3 — aplicação correta V1.9.560-A/C

## Frase ancora

> *"02/06: cai no anti-padrao curl -d inline com PT-BR (caso Gisele allergies). Memoria existia ha 1 dia, eu havia lido na rodada de leitura profunda 2-3h antes, ainda assim cai. Corrigi com chr() na hora. Em V1.9.560-A e V1.9.560-C apliquei o pattern correto (PowerShell + --data-binary @file): Valenca gravou byte-level OK. Princípio meta: validacao byte-level (octet_length vs length) pos toda escrita PT-BR via PAT — multibyte e diagnostico, nao confianca."*
