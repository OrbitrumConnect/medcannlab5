# Arquivo de backups — drop 22/05/2026 (schema hygiene)

3 tabelas de backup antigas, **removidas do schema ativo** na "schema hygiene sprint"
de 22/05/2026 (ver `AUDITORIA_COMPLETA_22_05_2026.md`). Eram snapshots de migrações
de abril que já cumpriram o papel; a auditoria confirmou **zero referência em código
vivo** (só apareciam no `src/integrations/supabase/types.ts` auto-gerado).

Cada `.json` é o **dump completo** da tabela (array de objetos-linha, exportado via
Supabase Management API com `SELECT *`). Linha-contagem conferida no export.
**Reversível**: re-criar a tabela pelo schema abaixo e re-inserir as linhas do JSON.

## Tabelas arquivadas

### `documents_backup_23_04_2026.json` — 458 linhas (1.8 MB)
Snapshot pré-cleanup da tabela `documents` (23/04/2026).
Colunas: `id uuid, title text, content text, summary text, keywords ARRAY,
medical_terms ARRAY, embeddings jsonb, file_url text, file_type text,
file_size integer, uploaded_by uuid, created_at timestamptz, updated_at timestamptz,
category text, tags ARRAY, target_audience ARRAY, author text, isLinkedToAI boolean,
aiRelevance numeric, type text, downloads integer, is_published boolean,
is_featured boolean, is_curated boolean`

### `clinical_reports_content_backup_24_04.json` — 64 linhas (192 KB)
Snapshot do `content` de `clinical_reports` antes de uma migração (24/04/2026).
Colunas: `id text, content_before jsonb, backed_up_at timestamptz`

### `clinical_reports_consent_backup_v1_9_39.json` — 27 linhas (16 KB)
Snapshot de consent de `clinical_reports` (V1.9.39).
Colunas: `id text, consent_given boolean, consent_at timestamptz, created_at timestamptz`

## Como restaurar (se algum dia precisar)

1. `CREATE TABLE public.<nome> (<colunas do schema acima>);`
2. Inserir as linhas do `.json` correspondente (cada objeto = 1 row).

Os originais que esses backups protegiam (`documents`, `clinical_reports`) seguem
vivos e ativos em produção — estes eram a rede de segurança das migrações de abril.
