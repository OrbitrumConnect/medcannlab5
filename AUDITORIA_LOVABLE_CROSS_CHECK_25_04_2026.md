# Cross-check da Auditoria Lovable — 25/04/2026 noite

> **Marco:** Lovable rodou auditoria 360º read-only após V1.9.69 (selo do dia). Pedro pediu validação ponto-a-ponto. Este documento é o cross-check, separando achados confirmados, refutados e pendentes.
>
> **Princípio aplicado:** *"Toda afirmação técnica precisa ser reproduzível localmente. Achado não validado é hipótese, não fato."* (Mesma regra que pegou o falso positivo das 26 views em 25/04 manhã.)
>
> ## ⚠️ ATUALIZAÇÃO PÓS-PUBLICAÇÃO (após rebase)
>
> Após primeira versão deste documento, Lovable fez merge no remote `amigo` regenerando `src/integrations/supabase/types.ts` (-1484 linhas, +340) contra o banco real. **Após pull:**
> - `tsc --noEmit` que antes passava com 0 erros agora retorna **43 linhas de erros** em 4 arquivos legacy IMRE
> - 4 tabelas IMRE (`imre_assessments`, `imre_semantic_blocks`, `imre_semantic_context`, `clinical_integration`) **não existem mais nos tipos atualizados**
>
> **Conclusão:** Lovable estava CERTO sobre o cluster IMRE. Eu validei contra um `types.ts` STALE no repo. Seção 3.1 ("Cluster IMRE quebra build — REFUTADO") foi RETRATADA — está agora na Seção 2.5 (CONFIRMADO) abaixo.
>
> **Lição:** validação local só vale se `types.ts` estiver sincronizado com o banco. Lovable regenera tipos como parte do workflow dele; nosso repo deixou stale.

---

## 0. Sumário executivo

Lovable produziu auditoria extensa misturando 3 categorias de qualidade desigual:

| Categoria | Qualidade | Razão |
|---|---|---|
| **Volumetria de código** | Alta | Cruza com `wc -l` real (5040 linhas tradevision-core, 1395 useMedCannLabConversation) |
| **Insights operacionais** | Provavelmente alta | Não validei localmente — depende de queries SQL no Supabase |
| **Erros de build / TypeScript** | **Alta** (após retratação) | 2 dos 3 P0 confirmados por tsc após rebase do types.ts atualizado |

**Veredito (revisado):** Lovable é confiável como segundo olhar arquitetural E como validador de build, **DESDE QUE** seu ambiente esteja sincronizado com banco real. No nosso caso, ele foi mais rigoroso que eu — regenerou tipos contra banco e expôs `types.ts` STALE no repo. Lição: validação local sem `types.ts` atualizado é validação parcial.

**Score corrigido (após retratação):**
- Achados confirmados: 5 (incluindo cluster IMRE)
- Achados refutados: 2 (npm:openai fantasma, edge functions=10)
- Achados pendentes: insights operacionais (queries SQL na Seção 5)

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

### 2.5 Cluster IMRE quebra type-check — CONFIRMADO (após rebase)

**Lovable afirmou (e estava certo):**
> "5 arquivos no frontend ainda referenciam tabelas que não existem mais no banco (`imre_assessments`, `imre_semantic_blocks`, `imre_semantic_context`, `clinical_integration`). O TypeScript do Supabase rejeita essas chamadas e quebra o type-check."

**Validação após rebase do types.ts atualizado (Lovable regenerou contra banco real):**

```
$ npx tsc --noEmit 2>&1 | wc -l
43
```

**Erros distribuídos em:**
| Arquivo | Erros TS | Tabelas referenciadas |
|---|---|---|
| `src/lib/clinicalAssessmentService.ts` | ~6 | `imre_assessments` |
| `src/lib/imreMigration.ts` | ~12 | `imre_assessments`, `imre_semantic_blocks`, `imre_semantic_context` |
| `src/lib/noaIntegration.ts` | ~4 | `imre_semantic_context`, `imre_assessments` |
| `src/lib/unifiedAssessment.ts` | ~10 | `imre_assessments`, `clinical_integration` |

**Tipos de erro:**
- `TS2769`: tabela não existe na overload do `from()`
- `TS2589`: instanciação de tipo profunda (sintoma de tipo ausente)
- `TS2345`: argumentos `'patient_id'`, `'user_id'`, etc. com `type 'never'` (chain de tipo quebrada)
- `TS2339`: properties não existem em `SelectQueryError`

**Decisão recomendada:** deletar/arquivar 4 arquivos legacy. Cabeçalho de `clinicalAssessmentService.ts:1-14` já admitia "NOT IN PRODUCTION · zero callers · gap C4 · decisão pendente". Lovable validou.

---

## 3. Achados REFUTADOS (Lovable errou)

### 3.1 ~~"Cluster IMRE quebra o build" — REFUTADO~~ — RETRATADO
**Status:** primeira versão deste cross-check refutou Lovable baseado em validação contra `types.ts` STALE no repo. Após rebase com `types.ts` atualizado pelo Lovable (regenerado contra banco real), tsc retornou 43 erros.

**Achado movido para Seção 2.5 como CONFIRMADO.**

**Lição registrada:** auditoria externa (Lovable) que regenera tipos contra banco real é mais autoritativa do que validação local contra repo. types.ts é fonte de verdade momentânea — pode estar stale no commit sem ninguém notar até regenerar.

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
2. **Deletar/arquivar 4 arquivos legacy IMRE** — `clinicalAssessmentService.ts`, `imreMigration.ts`, `noaIntegration.ts`, `unifiedAssessment.ts`. Confirmado: tabelas dropadas, tsc quebra com 43 erros, código documentado como "NOT IN PRODUCTION". Risco: precisa confirmar zero callers ativos antes de deletar.

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

1. **Auditoria externa pode ser MAIS rigorosa que validação local.** Lovable regenerou `types.ts` contra banco real; eu validei contra repo stale. Lovable estava certo.
2. **`types.ts` é stale potencial — sempre.** Schema do banco muda; `types.ts` no repo só atualiza por intervenção manual. Toda regeneração contra banco real pode expor divergência silenciosa.
3. **Build green não significa código limpo.** `tsc` e `vite build` passaram inicialmente com 4 arquivos legacy referenciando tabelas dropadas. Tipos antigos no repo escondiam o problema.
4. **Métricas operacionais valem mais que erros de build.** Os insights `reports_approved=0`, `aec_completed=0`, 50% cancellation rate são onde Lovable agregou valor único e ainda não validados.
5. **Princípio "antes de afirmar, reproduzir" se aplica em mão dupla.** Não só pra checar Lovable — também pra checar a si mesmo. Eu refutei Lovable na primeira passada baseado em tsc local; rebase + re-tsc me retratou.
6. **Workflow CI deveria regenerar `types.ts` automaticamente.** Sem isso, divergência banco↔repo fica oculta. Item P3 pra próximo CI sprint: `npx supabase gen types typescript --linked` no workflow.

---

## 8. Próxima ação recomendada

Pedro roda as queries da Seção 5 quando tiver tempo. Resultados decidem:
- Se Q1+Q2 mostram tabelas IMRE dropadas → P0 #2 dispara (limpar 5 arquivos legacy)
- Se Q3 confirma `aec_completed=0` → P2 #7 dispara (investigação produto, não código)
- Se Q4 mostra `last_6h > 0` em ISM logs → ISM Fase 1 funcionando, validar schema antes de Fase 2

Sem essas queries, **metade da auditoria do Lovable fica em hipótese**.

---

*Documento gerado em 25/04/2026 noite, pós V1.9.69. Auditoria cruzada por Claude Opus 4.7 contra repo local + tsc + vite build + grep exato.*
