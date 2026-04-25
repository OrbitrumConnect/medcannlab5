# Cross-check da Auditoria Lovable — 25/04/2026 noite

> **Marco:** Lovable rodou auditoria 360º read-only após V1.9.69 (selo do dia). Pedro pediu validação ponto-a-ponto. Este documento é o cross-check, separando achados confirmados, refutados e pendentes.
>
> **Princípio aplicado:** *"Toda afirmação técnica precisa ser reproduzível localmente. Achado não validado é hipótese, não fato."* (Mesma regra que pegou o falso positivo das 26 views em 25/04 manhã.)

---

## 0. Sumário executivo

Lovable produziu auditoria extensa misturando 3 categorias de qualidade desigual:

| Categoria | Qualidade | Razão |
|---|---|---|
| **Volumetria de código** | Alta | Cruza com `wc -l` real (5040 linhas tradevision-core, 1395 useMedCannLabConversation) |
| **Insights operacionais** | Provavelmente alta | Não validei localmente — depende de queries SQL no Supabase |
| **Erros de build / TypeScript** | **Baixa** | 3 dos 3 P0 reportados foram refutados por tsc/vite local |

**Veredito:** Lovable é útil como segundo olhar arquitetural e detector de gargalos operacionais (review_status, is_complete, cancellation rate). Não é confiável como validador de build — provavelmente seu ambiente IDE tem cache de tipos divergente do repo.

---

## 1. Metodologia

Cada achado de Lovable foi cruzado com 1 ou mais das seguintes fontes locais:
- `tsc --noEmit` (TypeScript front)
- `vite build` (bundle de produção)
- `wc -l` em arquivos físicos
- `Grep` por strings exatas que Lovable citou
- `find` em `supabase/functions/`
- Leitura direta de `src/integrations/supabase/types.ts`

Achados que **só** podem ser validados em runtime do banco foram listados como queries pra Pedro rodar (Seção 5).

---

## 2. Achados CONFIRMADOS (Lovable acertou)

### 2.1 `DecompressionStream("raw")` inválido
- **Local:** [supabase/functions/extract-document-text/index.ts:295](supabase/functions/extract-document-text/index.ts#L295)
- **Verificação:** `grep -n "DecompressionStream" supabase/functions/extract-document-text/index.ts` → linha 295
- **Spec Web Streams:** `CompressionFormat = 'gzip' | 'deflate' | 'deflate-raw'`. `"raw"` não existe.
- **Fix sugerido:** trocar `"raw"` → `"deflate-raw"` (1 caractere)
- **Risco:** zero, é correção pontual de string inválida

### 2.2 Volumetria de arquivos críticos
| Arquivo | Lovable | Real | Status |
|---|---|---|---|
| `tradevision-core/index.ts` | 5040 linhas | 5040 | ✅ exato |
| `useMedCannLabConversation.ts` | 1395 linhas | 1395 | ✅ exato |
| Páginas em `src/pages/` | 72 | 72 | ✅ exato |
| Contexts | 10 | 10 | ✅ exato |

### 2.3 Identity Unification + Trust Boundary + ISM Fase 1
Lovable cruzou com diários e memórias. Estado V1.9.69 confirmado (V1.9.59 trust boundary fechado, V1.9.65 identity unificada, V1.9.66 ISM Fase 1, V1.9.67 Bug A invalidate).

### 2.4 Camada cognitiva ativa
5 tabelas `cognitive_*` listadas (decisions, events, interaction_state, metabolism, policies) — confirmado em `migrations/`.

---

## 3. Achados REFUTADOS (Lovable errou)

### 3.1 "Cluster IMRE quebra o build" — REFUTADO
**Lovable afirmou:**
> "5 arquivos no frontend ainda referenciam tabelas que não existem mais no banco (`imre_assessments`, `imre_semantic_blocks`, `imre_semantic_context`, `clinical_integration`). O TypeScript do Supabase rejeita essas chamadas e quebra o type-check."

**Validação local:**
- `npx tsc --noEmit` → **ZERO erros**
- `npx vite build` → **passou em 31.65s** (só warnings de dynamic/static import e chunk size — não erros)
- [src/integrations/supabase/types.ts](src/integrations/supabase/types.ts) tem todas as 4 tabelas definidas:
  - linha 1471: `clinical_integration: { ... }`
  - linha 3625: `imre_assessments: { ... }`
  - linha 3700: `imre_semantic_blocks: { ... }`
  - linha 3757: `imre_semantic_context: { ... }`

**Conclusão:** o `types.ts` no repo tem as tabelas; tsc passa; build passa. Lovable provavelmente rodou contra um `types.ts` regenerado no ambiente dele a partir de schema atual do banco (que pode ter dropado as tabelas), divergindo do commit.

**Pergunta aberta (Seção 5, query #1-2):** as tabelas IMRE *existem* no banco hoje? Se não, regenerar `types.ts` localmente vai expor o problema que Lovable viu. Se sim, Lovable estava errado em ambas as pontas (tabelas existem E build não quebra).

### 3.2 "Referência fantasma `npm:openai@^4.52.5`" — REFUTADO
**Lovable afirmou:**
> "Alguma edge function ainda referencia `npm:openai@^4.52.5`. O `package.json` do projeto subiu para openai 6.16.0 mas a referência no Deno (edge) ficou para trás."

**Validação local:**
```
grep -rn "npm:openai\|esm.sh/openai\|from ['\"]openai" supabase/functions/
```
Resultado:
```
supabase/functions/tradevision-core/index.ts:4:
  import OpenAI from "https://esm.sh/openai@4"
```

- **Único import OpenAI no repo é `https://esm.sh/openai@4`** (não `npm:`)
- **Não existe `deno.lock`** no projeto
- `package.json` é do front (Vite/React), não dita Deno

**Conclusão:** referência fantasma `npm:openai@^4.52.5` é do **ambiente IDE Lovable**, não do nosso código. Provavelmente cache de type-check Deno do servidor Lovable contra alguma função antiga que não está no repo atual.

### 3.3 "10 edge functions" — REFUTADO
**Lovable listou:** 10 funções
**Real:** 9 funções (`ls supabase/functions/`):
1. tradevision-core
2. wisecare-session
3. digital-signature
4. extract-document-text
5. send-email
6. sync-gcal
7. video-call-request-notification
8. video-call-reminders
9. google-auth

`_shared` é módulo compartilhado, não edge function. Lovable provavelmente contou ele.

### 3.4 Volumetria menor que real
| Item | Lovable | Real | Diff |
|---|---|---|---|
| Components | 86 | 96 | +10 |
| Hooks | 11 | 13 | +2 |
| Edge functions | 10 | 9 | -1 |

Diferenças não-críticas, mas indicam que Lovable não rodou `find` exato.

---

## 4. Achados NOVOS (que Lovable não viu)

Validação local descobriu 2 monstros que Lovable não destacou ao listar "hotspots":

| Arquivo | Linhas | Status |
|---|---|---|
| `src/lib/noaResidentAI.ts` | **2184** | 2º maior arquivo do front. Candidato a refactor. |
| `src/lib/clinicalAssessmentFlow.ts` | **1735** | 3º maior. Já fizemos várias mudanças hoje (V1.9.57, V1.9.67). |

Lovable destacou só `tradevision-core` (5040) e `useMedCannLabConversation` (1395). Esses 2 acima também merecem entrar no mapa de refactor futuro.

---

## 5. Achados PENDENTES (precisam validação no Supabase)

Sem PAT em mão nesta sessão, listo as queries pra rodar em [supabase.com/dashboard/project/itdjkfubfzmvmuxxjoae/sql](https://supabase.com/dashboard/project/itdjkfubfzmvmuxxjoae/sql):

### 5.1 As tabelas IMRE existem no banco?
```sql
-- Q1: existência
SELECT tablename FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN ('imre_assessments','imre_semantic_blocks','imre_semantic_context','clinical_integration')
ORDER BY tablename;

-- Q2: conteúdo (rodar só se Q1 retornar linhas)
SELECT 'imre_assessments' AS tbl, COUNT(*) AS rows FROM imre_assessments
UNION ALL SELECT 'imre_semantic_blocks', COUNT(*) FROM imre_semantic_blocks
UNION ALL SELECT 'imre_semantic_context', COUNT(*) FROM imre_semantic_context
UNION ALL SELECT 'clinical_integration', COUNT(*) FROM clinical_integration;
```
**Decisão depende:**
- Tabelas existem + 0 rows → código morto OK no front, mantém ou limpa
- Tabelas existem + N rows → ainda em uso, NÃO mexer no código
- Tabelas não existem → Lovable estava certo em parte (tabelas dropadas), `types.ts` está stale, regenerar tipos vai quebrar tsc

### 5.2 Métricas operacionais que Lovable trouxe
```sql
SELECT
  (SELECT COUNT(*) FROM users) AS users_total,
  (SELECT COUNT(*) FROM clinical_reports) AS reports_total,
  (SELECT COUNT(*) FROM clinical_reports WHERE review_status = 'approved') AS reports_approved,
  (SELECT COUNT(*) FROM clinical_reports WHERE consent_given = false) AS reports_no_consent,
  (SELECT COUNT(*) FROM appointments) AS appointments_total,
  (SELECT COUNT(*) FROM appointments WHERE status = 'cancelled') AS appointments_cancelled,
  (SELECT COUNT(*) FROM aec_assessment_state WHERE invalidated_at IS NULL) AS aec_active,
  (SELECT COUNT(*) FROM aec_assessment_state WHERE is_complete = true AND invalidated_at IS NULL) AS aec_completed,
  (SELECT COUNT(*) FROM ai_chat_interactions) AS interactions_total;
```

**Insights críticos pra confirmar:**
- `reports_approved = 0` (75 pendentes) → ciclo de revisão profissional não está sendo executado
- `aec_completed = 0` (3 ativos) → motor novo DB-backed nunca fechou ciclo (V1.9.57+ protege caminho não exercitado em prod)
- `appointments_cancelled = 30/60` (50%) → problema operacional sério

### 5.3 ISM telemetria (V1.9.66 — recém-publicado)
```sql
SELECT
  COUNT(*) AS total_ism_logs,
  COUNT(*) FILTER (WHERE created_at > now() - interval '6 hours') AS last_6h,
  MIN(created_at) AS first_ism_log
FROM noa_logs
WHERE interaction_type = 'ism_state_observed';
```

### 5.4 Hardening RLS (4 tabelas + 3 policies + 2 buckets)
```sql
-- Q5: tabelas RLS sem policy
SELECT t.tablename FROM pg_tables t
LEFT JOIN pg_policies p ON p.tablename = t.tablename AND p.schemaname = t.schemaname
WHERE t.schemaname = 'public' AND t.rowsecurity = true
GROUP BY t.tablename HAVING COUNT(p.policyname) = 0
ORDER BY t.tablename;

-- Q6: policies WITH CHECK (true)
SELECT tablename, policyname, cmd, qual, with_check
FROM pg_policies WHERE schemaname = 'public'
  AND (with_check = 'true' OR qual = 'true')
ORDER BY tablename;

-- Q7: buckets públicos
SELECT name, public, file_size_limit, allowed_mime_types
FROM storage.buckets WHERE public = true ORDER BY name;
```

### 5.5 Reports órfãos (Lovable disse 3)
```sql
SELECT COUNT(*) AS reports_orfaos
FROM clinical_reports cr
WHERE cr.patient_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM users u WHERE u.id = cr.patient_id);
```

---

## 6. Roadmap consolidado pós cross-check

### P0 imediato (validados localmente)
1. **`"raw"` → `"deflate-raw"`** em [extract-document-text:295](supabase/functions/extract-document-text/index.ts#L295) — 1 caractere, zero risco

### P0 condicional (depende de query SQL)
2. **Se Q1 mostra que tabelas IMRE foram dropadas:**
   - Regenerar `types.ts` localmente
   - Tsc vai quebrar, daí valida Lovable parcialmente
   - Decidir: limpar 5 arquivos legacy ou recriar tabelas

### P1 hardening (depende de Q5-Q7)
3. **4 tabelas RLS sem policy** — decidir policy ou DROP RLS
4. **Policies WITH CHECK (true)** — restringir
5. **Buckets públicos** — owner-based access
6. **Leaked Password Protection** — habilitar no dashboard

### P2 investigação operacional (depende de Q3-Q4)
7. **Por que `aec_completed = 0`?** — motor novo nunca fechou ciclo
8. **Por que `reports_approved = 0`?** — fluxo de revisão profissional nunca executado
9. **Por que 50% de cancellation?** — investigar UX de agendamento

### P3 refactor (concordo com Lovable)
10. Quebrar `tradevision-core` (5040) em módulos `_shared/`
11. Quebrar `useMedCannLabConversation` (1395) em hooks especializados
12. Acrescento meu: `noaResidentAI` (2184) e `clinicalAssessmentFlow` (1735)

---

## 7. Lições registradas

1. **Auditoria externa precisa ser cruzada com ambiente local.** Lovable rodou no servidor dele com cache/snapshot que pode divergir do repo committed.
2. **Build green não significa código limpo.** `tsc` e `vite build` passaram com `imreMigration.ts`, `unifiedAssessment.ts` e `clinicalAssessmentService.ts` no repo. Eles podem estar mortos, mas não bloqueiam build.
3. **Métricas operacionais valem mais que erros de build inventados.** Os insights `reports_approved=0`, `aec_completed=0`, 50% cancellation rate são onde Lovable agregou valor real.
4. **`types.ts` é stale potencial.** Toda vez que schema do banco muda, regenerar `types.ts` é parte do workflow. Pode ter divergência silenciosa.
5. **Princípio "antes de afirmar, reproduzir" se aplica também a auditorias externas.** Mesma lição das 26 views (manhã 25/04).

---

## 8. Próxima ação recomendada

Pedro roda as queries da Seção 5 quando tiver tempo. Resultados decidem:
- Se Q1+Q2 mostram tabelas IMRE dropadas → P0 #2 dispara (limpar 5 arquivos legacy)
- Se Q3 confirma `aec_completed=0` → P2 #7 dispara (investigação produto, não código)
- Se Q4 mostra `last_6h > 0` em ISM logs → ISM Fase 1 funcionando, validar schema antes de Fase 2

Sem essas queries, **metade da auditoria do Lovable fica em hipótese**.

---

*Documento gerado em 25/04/2026 noite, pós V1.9.69. Auditoria cruzada por Claude Opus 4.7 contra repo local + tsc + vite build + grep exato.*
