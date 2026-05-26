---
name: Política de push — sempre 2 remotes, main E master
description: Pedro instituiu em 27/04/2026 que toda atualização sobe nos 2 remotes (hub = amigo-connect-hub e origin = medcannlab5), e nas duas branches principais (main + master). Não fazer só uma.
type: feedback
originSessionId: 60cf94b7-b5d3-4df1-974d-c1c92082460c
---
**Regra:** Para qualquer push de mudança aprovada, atualizar **as 4 referências**:

1. `hub/main` → `git push hub main`
2. `hub/master` → `git push hub master`
3. `origin/main` → `git push origin main`
4. `origin/master` → `git push origin master`

E o branch de feature também sobe nos dois remotes (`hub/<branch>` + `origin/<branch>`) para auditabilidade.

**Por quê:** O projeto MedCannLab tem 2 repositórios paralelos:
- `https://github.com/OrbitrumConnect/amigo-connect-hub.git` (alias local: `hub`)
- `https://github.com/OrbitrumConnect/medcannlab5.git` (alias local: `origin`)

Ambos precisam estar sincronizados. main e master também.

**Workflow padrão pós-aprovação:**
```bash
# Branch feature ja commitada
git push hub <branch>
git push origin <branch>

# Fast-forward main + master para o tip do branch
git checkout main
git merge --ff-only <branch>
git push hub main
git push origin main

git checkout master
git merge --ff-only <branch>
git push hub master
git push origin master

# Voltar para o branch de trabalho
git checkout <branch>
```

**Anti-pattern a evitar:**
- Push só em hub e esquecer origin → repos divergem
- Push só em main e esquecer master (ou vice-versa) → branches divergem dentro do mesmo repo

**How to apply:** Sempre que Pedro autorizar push, executar os 4 push automaticamente. Se algum falhar (ex: non-fast-forward), parar e investigar antes de tentar `--force`. Nunca force-push em main/master sem autorização explícita.
