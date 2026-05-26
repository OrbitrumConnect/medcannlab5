---
name: Protocolo de remoção de dependência (4 passos antes de DELETE)
description: Antes de propor remover dep/arquivo: grep amplo simples + npm ls + npm run build + validar com Pedro
type: feedback
originSessionId: 60cf94b7-b5d3-4df1-974d-c1c92082460c
---
**Origem**: 26/04/2026 — Claude (eu) viu xenova como "morto", removi, build local quebrou. Pedro corrigiu.

**Why**: dependência "não usada por código direto" pode ser usada por:
- Build tooling (vite plugins)
- Peer deps de outros pacotes
- Loaders dinâmicos
- Sistemas legacy ainda funcionando

**Regra: 4 passos obrigatórios antes de propor remover dep/arquivo**:

```
1. Grep amplo SIMPLES (nome do pacote em todo src/ e configs)
   grep -rn "xenova\|@xenova" --include="*.ts" --include="*.tsx" --include="*.json"
   
2. npm ls <pkg> (validar se é dep direta ou transitiva)
   npm ls @xenova/transformers
   
3. npm run build (validar se quebra ao remover)
   npm uninstall <pkg> --no-save  # teste sem commit
   npm run build
   # se quebrar: REINSTALAR + investigar uso
   
4. Validar com Pedro antes de DELETE final
```

**Casos onde NÃO remover mesmo se "não usado"**:
- Pacotes com peer dependency em outros pacotes
- Pacotes carregados via dynamic import
- Pacotes em vite.config.ts
- Pacotes em scripts npm

**Frase-âncora**: *"4 passos antes de DELETE. Build local quebrou em produção é regressão pública."*

**Refs**: docs/MEMORIAS_CRITICAS_HANDOFF_04_05.md §11.5, lição xenova 26/04.
