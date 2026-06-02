---
name: project_v1_9_560_documents_separacao_curadoria_meus_02_06
description: V1.9.560 (A+B+C) — Separacao visual + RLS da Library entre "Curadoria da Plataforma" (institucional/compartilhado) e "Meus Documentos" (privados do profissional). Cenario 3 defensivo: docs historicos preservam acesso, novos uploads ficam privados por default. Smoke matriz 9/9 PASS + validacao visual cross-account Ricardo OK.
type: project
---

# V1.9.560 — Separacao Curadoria vs Meus Documentos na Library

## A decisao arquitetural (Pedro 02/jun)

**Documento subido pelo profissional eh DELE**. Outros profissionais nao veem, alunos nao veem. Compartilhamento curado de casos continua via Forum Cann Matrix (V1.9.403-410). Princípio: privacidade por default + flag explicito pra promover a curadoria.

Quote Pedro: *"problema que documento do proficional e dele nao seria correto outros proficinals verem! nem alunos pois ele pode subir doc pessoal dele! ja temos o forium para compartilhar casos ne melhor"*.

## A solucao em 3 fases atomicas (Cenario 3 defensivo)

### Fase A — Backend prep (commit `a523080`)
- **Backfill `uploaded_by`** por author: 30 docs Ricardo + 5 Eduardo (cruzando texto livre com UUID)
- **Backfill `is_curated=true`** em 43/43 docs historicos (DEFENSIVO: preserva acesso atual de prof e aluno)
- **Trigger BEFORE INSERT** `documents_set_uploaded_by`: garante `uploaded_by = auth.uid()` automatico

### Fase B — Library.tsx 2 abas + checkbox (commit `b4c47df`)
- 2 abas no topo: "Curadoria da Plataforma" (default) + "Meus Documentos"
- Filtro `matchesViewTab` em ambas funcoes de busca (normal + semantica)
- Checkbox no upload modal: "Compartilhar com a Curadoria da Plataforma" (default OFF = privado)
- `documentMetadata` ganha `is_curated: shareWithPlatform`
- Reset checkbox pos-upload

### Fase C — RLS tighten Variante 1 (commit `85bef6d`)
Mudanca em `docs_select_authenticated`:

```sql
-- ANTES
USING ((uploaded_by = auth.uid())
       OR has_role('admin')
       OR has_role('profissional')   -- ANY prof ve TUDO (gap raiz)
       OR (is_published = true))

-- DEPOIS (Variante 1 — preserva paciente)
USING ((uploaded_by = auth.uid())
       OR has_role('admin')
       OR (is_curated = true AND
           (has_role('profissional')
            OR has_role('aluno')))
       OR (is_published = true))     -- paciente igual antes
```

## Smoke matriz 9/9 PASS (empirico via PAT)

| # | Smoke | Esperado | Real |
|---|---|---|---|
| 1 | Paciente ve (so is_published) | 40 | 40 ✅ |
| 2 | Ricardo prof (owner 30 + curadoria) | 43 | 43 |
| 3 | Eduardo prof (owner 5 + curadoria) | 43 | 43 |
| 4 | Aluno (curadoria + publicados) | 43 | 43 |
| 5 | INSERT doc privado teste Ricardo | OK | OK (trigger funcionou) |
| 6 | Owner Ricardo VE proprio privado | 1 | 1 |
| 7 | Eduardo (nao-owner) NAO VE privado | 0 | 0 🎯 |
| 8 | Aluno NAO VE privado | 0 | 0 🎯 |
| 9 | Paciente NAO VE privado | 0 | 0 🎯 |

Cleanup: doc teste DELETED. **Gap fechado**, zero regressao.

## Validacao visual cross-account Ricardo

Pedro foi pessoalmente ao Ricardo, validou empiricamente:
- 2 abas visiveis (Curadoria + Meus Documentos) ✅
- Docs dele + docs do app aparecendo corretamente ✅
- Comportamento esperado confirmado

## Por que Variante 1 (preserva paciente)

Tinha 2 opcoes:
- **V1**: cond `is_curated=true AND (profissional OR aluno)` → paciente continua vendo APENAS `is_published=true` (40 docs)
- **V2**: cond `is_curated=true` global → paciente passaria a ver +3 docs (43 curados vs 40 publicados antes)

Pedro confirmou V1: *"sem regressao"*. Os 3 docs `is_curated=true AND is_published=false` provavelmente foram criados sem intencao de exposicao a paciente.

## Pre-condicao defensiva fundamental

V1.9.560-A backfillou `is_curated=true` em 43/43 docs historicos ANTES de mudar RLS. Sem isso, V1.9.560-C teria criado regressao (prof/aluno perderiam acesso a docs que ja viam). Princípio: **mudanca defensiva primeiro, mudanca de regra depois**.

## Limitacoes conhecidas (intencionais, parqueadas)

1. **UI edicao doc**: hoje so novos uploads respeitam checkbox. Pra Ricardo tirar algum dos 30 docs historicos da Curadoria (deixar privado dele), precisa UI nova "editar visibilidade". Parqueado ate demanda real.
2. **`author` drift**: 24 "Dr. Ricardo" + 7 "Ricardo Valença" — 2 entries pro mesmo autor. Cosmetico.
3. **Drift target_audience EN vs role enum PT**: vitrine usa `['professional', 'student']` mas enum `app_role` usa `profissional` (PT). RLS usa enum, frontend usa string EN. Inconsistencia historica nao tratada.

## Pattern reusavel cristalizado

**Fase A→B→C atomic com smoke matriz por papel** pra refators de RLS:
- Fase A: backfill + trigger (zero impacto runtime)
- Fase B: frontend (testavel antes de RLS mudar)
- Fase C: RLS tighten + smoke matriz 4 papeis × situacao positiva/negativa + INSERT/DELETE teste
- Sempre validacao visual cross-account ANTES de fechar

Aplicavel proxima vez que precisar tighten qualquer RLS com risco de regressao historica.

## Tabelas afetadas (so)

- `public.documents` — backfill + trigger + RLS policy
- `public.documents` storage bucket — nao tocado

NAO tocou: `base_conhecimento`, `patient_documents`, `ai_saved_documents`, `document_snapshots`, qualquer tabela clinica.

## Conexoes

- [[feedback_pattern_powershell_utf8_curl_data_binary_02_06]] — pattern UTF-8 usado pra aplicar migrations
- DIARIO_02_06_2026 §F (Bloco F) — narrativa completa das 3 fases
- [[project_f4_forum_plano_e_audit_21_05]] — Forum como canal alternativo de compartilhamento curado

## Frase ancora

> *"02/06: V1.9.560 separou Library em 2 abas (Curadoria/Meus) sem regressao. Cenario 3 defensivo (is_curated=true em 43/43 historicos) preservou acesso atual de prof+aluno. RLS Variante 1 fechou gap raiz onde TODO profissional via TUDO, sem afetar paciente. Smoke matriz 9/9 PASS + validacao visual Ricardo ✅. Pattern Fase A→B→C atomic com smoke por papel cristalizado pra próximos RLS tightenings. Decisao Pedro: docs do profissional sao DELE; compartilhamento curado via Forum (polir nao inventar)."*
