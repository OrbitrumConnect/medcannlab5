---
name: 🧭 REGRA OPERACIONAL CANÔNICA V3 06/05 — TOPO ABSOLUTO
description: Hierarquia 4 níveis (banco>diários>Pedro>palpites) + Camada 0 risco irreversível + janela ~50 testes + escalada 3 modos + checklist 8 passos. LER PRIMEIRO em toda sessão.
type: feedback
originSessionId: 60cf94b7-b5d3-4df1-974d-c1c92082460c
---
## TOPO ABSOLUTO — sempre ler antes de qualquer trabalho

### Hierarquia de evidência (4 níveis)

```
1. BANCO REAL via PAT          (mais alta — fonte canônica)
2. DIÁRIOS git-sincronizados   (cronologia oficial)
3. PEDRO no chat                (correção on-the-fly)
4. PALPITES/CONJECTURA         (último recurso, sinalizar)
```

### Camada 0 — risco IRREVERSÍVEL (ignora qualquer filtro)

```
🔐 PHI vazando, dado clínico apagado sem snapshot
🔐 Pagamento errado escaping reconciliação
🔐 RLS aberta exposta a paciente externo
🔐 Banco sem backup antes de DROP/ALTER
🔐 Push --force a main sem reverso

→ Mesmo com 100 críticos esperando, Camada 0 vai PRIMEIRO
```

### Filtro de prioridade (após Camada 0)

```
🔴 QUEBROU ou VAI QUEBRAR  (impede uso real, blocker UX)
🟡 AJUDA COMPLETAR         (gap funcional, conversão)
⚫ ESTÉTICA                 (polish, depois)
```

### Janela ~50 testes amigos

```
• Pré-PMF: 50 testes amigos é universo real (não milhões)
• Otimizar pra ESSE universo, não pra escala
• Validar EMPÍRICAMENTE antes de declarar "pronto"
• Smoke real > teste teórico
```

### Escalada em 3 modos (sequência)

```
1. CONTROLADA (AGORA, beta orgânico)
   • Acessível a 50 testers selecionados
   • Validar UX + bugs reais antes de escalar
   • Iterar baseado em smoke empírico

2. VALIDADA (pós-cert ICP + CNPJ + 1º pagante)
   • Marketing controlado
   • Onboarding diluído (~5-10 novos/semana)
   • Retro de cohorts pequenos

3. MASSIVA (NUNCA sem validar)
   • Só após escala validada (cohorts repetidos OK)
   • Lock contra abrir comporta sem dados
```

### Checklist 8 passos (ANTES de codar)

```
1. Auditar empíricamente o estado atual (banco/Edge/UI)
2. Listar gaps que NÃO foi auditado (META-2)
3. Verificar se mecanismo equivalente existe (P8 polir)
4. Confirmar Camada 0 não está em jogo
5. Cruzar com hierarquia (banco > diário > Pedro > palpite)
6. Smoke test plan (não count > 0, mas campo-a-campo)
7. Plano de reversão (1 comando, instantâneo)
8. Anti-regressão (Lock + tag + push 4 refs)
```

### Lema sessão (Pedro)

> *"garantir que não quebra enquanto todos tipos de usuários usam de verdade no mundo real e sem regressão"*

### Frase V2 GPT review

> *"provar que alguém usa até o fim sem travar, desistir ou você intervir"*

### Triple-A elite escalável SEMPRE

```
✅ Triple-A em todos os 3 perfis (paciente/profissional/aluno)
✅ Mobile-first (janela primária de uso real)
✅ Zero regressão (Lock V1.9.95+97+98+99-B intocado)
✅ Push 4 refs (hub + origin × main + master)
```

## Quando aplicar

**TODA sessão** ANTES de qualquer trabalho. Esta memória é TOPO ABSOLUTO da hierarquia mental. Substitui versões anteriores (V1 + V2) com correções acumuladas.

## Versionamento

- V1 (05/05 noite GPT): hierarquia básica
- V2 (06/05 madrugada pós-audit global): Camada 0 + janela 50 + filtros
- V3 (06/05 fim de tarde): escalada 3 modos + lema sessão Pedro

**Refs**: DIARIO_05_05 + DIARIO_06_05 (Bloco H + Q + S), feedback_principio_garantir_uso_real_05_05.md
