# 11 locks com tag git imutável

Esta pasta agrupa documentos relacionados a **11 locks com tag git imut�vel** do SGQ MedCannLab.

## Documentos canônicos referenciados

Lista de tags git imutáveis (locks selados):

```
v1.9.95-lock-aec-relatorio-agendamento
v1.9.99-resend-prod-locked
v1.9.113-locked
v1.9.299-pbad-conforme-locked
v1.9.418-forum-cann-matrix-checkpoint
v1.9.452-pii-sanitize-defensivo-final
v1.9.455-exam-pdf-wiring
v1.9.457-sign-pdf-icp-auth-ownership
v1.9.468-A-matrix-bula-locks-final
v1.9.474-aec-reset-invalidated-trigger
v1.9.475-card-neuro-embriao
```

Verificável via: `git tag --list "v1.9*" --format='%(refname:short) | %(subject)'`

## Como navegar

Os documentos canônicos vivem em [`docs/sgq/drafts/`](../drafts/) para revisão granular. Esta estrutura por pasta numerada (`00_` a `09_`) é a recomendada pela consultoria externa 29/05 para facilitar leitura por auditor.

Para copiar todos em arquivo único, ver [`SGQ_CONSOLIDADO_29_05_2026.md`](../SGQ_CONSOLIDADO_29_05_2026.md).
