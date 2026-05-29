# Evidências empíricas (commits + telemetria + smokes)

Esta pasta agrupa documentos relacionados a **evid�ncias emp�ricas (commits + telemetria + smokes)** do SGQ MedCannLab.

## Documentos canônicos referenciados

As evidências empíricas são extraídas diretamente do repositório git:

- `git log --oneline --since="30 days ago"` — 649 commits últimos 30d
- `git tag --list "v1.9*"` — 11 locks com tag imutável
- `ls DIARIO_*.md` — 66 diários técnicos
- `ls ~/.claude/projects/*/memory/*.md` — 284 memórias persistentes
- Telemetria via PAT Supabase `ai_chat_interactions` + `cron.job_run_details`

## Como navegar

Os documentos canônicos vivem em [`docs/sgq/drafts/`](../drafts/) para revisão granular. Esta estrutura por pasta numerada (`00_` a `09_`) é a recomendada pela consultoria externa 29/05 para facilitar leitura por auditor.

Para copiar todos em arquivo único, ver [`SGQ_CONSOLIDADO_29_05_2026.md`](../SGQ_CONSOLIDADO_29_05_2026.md).
