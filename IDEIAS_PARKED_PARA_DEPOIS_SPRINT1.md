# 🅿️ IDEIAS PARKED — Para Depois do Sprint 1

**Criado:** 09/05/2026 (pós-virada para execução)
**Vigência da regra:** 09/05/2026 → 16/05/2026 (ou até Sprint 1 medindo, o que vier primeiro)
**Regra de blindagem:** ver `~/.claude/.../memory/feedback_freeze_analise_estrutural_ate_16_05.md`

---

## Como usar este arquivo

### ✅ FAZER quando aparecer ideia arquitetural nova entre 09/05 e 16/05:
- Adicionar entrada em **1-2 linhas** no formato:
  ```
  - [DATA] — [ideia em 1 linha]. Avaliar pós-Sprint 1 medido.
    Origem: [Pedro / Ricardo / GPT externo / outro]
    Conexão com blueprint v2: [estágio do ciclo OU "novo eixo"]
  ```

### ❌ NÃO FAZER:
- Blueprint v3
- Nova memória persistente em `~/.claude/.../memory/`
- Novo `DOC_MESTRE_*.md`
- Novo bloco expansivo em diário
- Mais conversa GPT externa pedindo análise da ideia
- Refatoração do blueprint v2 cristalizado

---

## Exceções legítimas que QUEBRAM o freeze

1. **Bug crítico de segurança** descoberto que exija decisão arquitetural imediata
2. **Ricardo responde 9 decisões clínicas** e alguma resposta invalida premissa do blueprint v2
3. **Sprint 1 codado e medido** (~D+7 a D+14) gera empírico que muda direção
4. **Resposta Muhdo D+1** abre prioridade nova (ex: pedem demo ao vivo D+3)
5. **Pedro decide explicitamente** quebrar o freeze por motivo registrável aqui

Em caso de exceção: registrar abaixo na seção "Exceções acionadas" antes de quebrar.

---

## Parking Lot — Ideias capturadas (entre 09/05 e 16/05)

> _(Vazio por enquanto — adicionar conforme aparecerem)_

<!-- TEMPLATE para futuras entradas:
- [DD/MM HH:MM] — [Ideia em 1 linha]. Avaliar pós-Sprint 1 medido.
  Origem: [autor]
  Conexão: [estágio ciclo OU novo eixo]
-->

---

## Exceções acionadas (registro auditável)

> _(Vazio — preencher SE freeze for legitimamente quebrado)_

<!-- TEMPLATE para exceções:
- [DD/MM HH:MM] — Exceção #[N]: [motivo]
  Justificativa: [qual das 5 exceções legítimas]
  Ação tomada: [o que foi feito além de adicionar ao parking]
-->

---

## Auto-check em 16/05/2026

Quando o freeze terminar, fazer auto-check honesto:

- [ ] `IDEIAS_PARKED.md` tem entradas? (sinal de freeze efetivo — ideias capturadas sem expandir)
- [ ] Sprint 1 está implementado / em deploy?
- [ ] Reunião Ricardo aconteceu?
- [ ] 3 ações externas (CNPJ / Ricardo / Muhdo D+1) executadas?

**Se 3+ positivas → freeze cumpriu objetivo.**
**Se ≤2 → padrão análise→defesa voltou. Reavaliar honestamente (memória `project_gap_operacional_humano_3_acoes_externas_09_05.md`).**

---

## Critério de revisão pós-freeze (16/05+)

Para cada item no parking lot:
1. Ainda é relevante depois de Sprint 1 medido?
2. Conecta com gap real validado empíricamente OU é especulação?
3. Move algum dos 3 gates de 60d? (CNPJ / Muhdo Pilot / 1 ciclo médico→receita real)
4. Custa quanto pra implementar vs valor empírico?

Aprovados → entram em blueprint v3 (se houver).
Rejeitados → arquivar no fundo deste arquivo com data + motivo.
Adiados → manter no parking com nova data de revisão.

---

*Este arquivo é parte da disciplina temporal de execução pré-PMF. Não expandir. Não transformar em narrativa. Manter factual e curto.*
