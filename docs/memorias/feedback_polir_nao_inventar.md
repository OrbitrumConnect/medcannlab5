---
name: Princípio operacional — "Polir e ligar pontos. Não inventar. Foco em escalabilidade"
description: Direção estratégica explícita do Pedro a partir de 27/04/2026. Substitui qualquer impulso de criar features novas — o trabalho daqui pra frente é polir, ligar pontos soltos e preparar pra escala.
type: feedback
originSessionId: 60cf94b7-b5d3-4df1-974d-c1c92082460c
---
**Regra:** Não criar feature/arquitetura nova. Polir o que já existe. Resolver ambiguidade pendente. Ligar pontos soltos. Preparar escalabilidade.

**3 Princípios fundadores (pra Livro Magno v1.0.7):**
- **Princípio 6 — Anomalia ≠ bug.** Antes de "consertar", perguntar: bug ou intencional? (Pedro freia se eu invento problema.)
- **Princípio 7 — Contract-Based Communication.** Core = trilho. GPT = vagão. Sistema híbrido com contrato explícito.
- **Princípio 8 — Polimento responde "o que já existia mas não estava ligado direito?"** Se sim → polimento. Se não → freia. **MAS:** "não inventar" ≠ "não decidir". Resolver ambiguidade pendente É polimento.

**Anti-kevlar (3 mecanismos obrigatórios):**
1. Mudança que afete quem decide o quê/quando exige nova versão Livro Magno ANTES do commit
2. Mudanças estruturais NÃO podem ser acopladas a commits de infra/segurança/UI
3. Check pré-deploy, não pós

**5 perguntas antes de mexer (OPERATING_CHEATSHEET):**
1. Anomalia ou bug? Se anomalia → perguntar antes
2. Polimento ou invenção? Se "criar X que não existe" → freia
3. Mexe em quem decide o quê/quando? Se sim → exige nova versão Livro Magno
4. Acoplado a commit de outra coisa? Se sim → separa
5. Já validado em produção? Se não → modo passivo + telemetria 24-48h

**Why:** O kevlar (commit `a4c706c` 16/04) inverteu Core→Assistant primário sem nova versão do Livro Magno. Sistema saiu do foco por ~10 dias. Em 27/04 voltou ao Livro Magno com V1.9.82/83/84. A direção é manter o foco e não regredir.

**How to apply:**
- Se identificar bug/melhoria, perguntar antes de aplicar
- Não criar tabela/arquivo/feature sem confirmação explícita
- Para ambiguidades pendentes (IMRE legacy, users/profiles, chat_messages), tratar como polimento — proponho decisão, espero OK do Pedro/Ricardo
- Validar afirmações em FATO VERIFICADO vs HIPÓTESE vs INTERPRETAÇÃO antes de comprometer
- Sempre adicionar `Co-Authored-By: Claude Opus 4.7` em commits
