# Operating Cheatsheet — MedCannLab

> **1 página A4. Decisão em 30 segundos.** Não substitui Livro Magno + ENGINEERING_RULES + diários + memórias — atalha caminho pra decisão rápida.

---

## ⏱️ ANTES de mexer em algo (5 perguntas)

1. **Anomalia ou bug?** → se anomalia (banco, log, comportamento estranho), **perguntar antes** de mexer (**Princ. 6**)
2. **Polimento ou invenção?** → se a resposta começa com *"vamos criar X que ainda não existe"*, **freia** (**Princ. 8**)
3. **Mexe em quem decide o quê/quando?** → se sim, **exige nova versão do Livro Magno** antes do commit
4. **Acoplado a commit de outra coisa** (segurança, infra, UI)? → **separa** em commits dedicados (**anti-kevlar**)
5. **Já validado em produção?** → se não, **modo passivo + telemetria 24-48h** antes de virar default (**REGRA #4**)

## 🎯 Polir ≠ Paralisar

**Polir É:** resolver ambiguidade estrutural já existente (IMRE legacy, duplicatas users/profiles, migração chat_messages)
**Polir NÃO É:** ignorar decisão pendente. Ambiguidade não-resolvida = dívida invisível.

## 🧩 Frases-âncora (decisão em segundos)

| Situação | Lembrar |
|---|---|
| Decisão sobre AEC | *"AEC organiza. Clínica interpreta."* |
| Decisão sobre Core vs GPT | *"Core = trilho. GPT = vagão."* |
| Tentação de mudar princípio fundador | *"O Livro Magno só funciona se for ativamente honrado."* |
| Achou anomalia interessante | *"Anomalia ≠ bug. Perguntar antes."* |
| Quer adicionar feature/regra | *"Polir ≠ inventar. Polir ≠ paralisar."* |

## 🚦 Os 4 pontos críticos pra produto vendável (status 27/04)

| # | Ponto | Status | Versão |
|---|---|---|---|
| 1 | P0 narrador prescreve | ✅ Resolvido | V1.9.84 |
| 2 | Slot errado COMPLAINT_DETAILS | ✅ Resolvido | V1.9.83 (aguarda validação real) |
| 3 | `is_complete=false` zumbi | ✅ Resolvido | V1.9.57 cold guard atuou |
| 4 | Fail-safe clínico offline | ✅ Resolvido | V1.9.82 |

## 🔴 Pendências aguardando Dr. Ricardo (5 decisões)

1. ⏳ Frente A/B/C estratégica (paciente externo / educacional / híbrido)
2. ⏳ 3 features-fantasma (ClinicalAssessment + 4 IMRE + AIDocumentChat)
3. ⏳ IMRE legacy: deletar OU recriar tabelas?
4. ⏳ Contrato `users` / `user_profiles` / `profiles`
5. ⏳ Selar Livro Magno v1.0.7 com 3 princípios novos + anti-kevlar

## 🛡️ Anti-kevlar (3 mecanismos obrigatórios)

1. **Gatilho operacional**: mudança que afeta quem decide o quê/quando exige nova versão do Livro Magno antes do commit
2. **Anti-acoplamento**: mudanças estruturais NÃO podem entrar acopladas a commits de infra/segurança/UI
3. **Check pré-deploy**, não pós

## 📂 Onde encontrar contexto completo (se cheatsheet não bastar)

- Filosofia: `docs/LIVRO_MAGNO_DOCUMENTO_FINAL_CONSOLIDADO.md`
- Regras operacionais: `ENGINEERING_RULES.md`
- Estado consolidado: `SYSTEM_STATE_SEAL_2026-04-26.md`
- Histórico semana: `DIARIO_26_04_2026_*.md` (13 blocos) + `DIARIO_27_04_2026_*.md` (10 blocos)
- Memórias persistentes: `~/.claude/projects/c--Users-phpg6-.../memory/MEMORY.md`

## 🔑 Em caso de dúvida

**PERGUNTAR antes de agir.** Sempre. Especialmente em mudança que afete:
- Princípio fundador (COS v5.0)
- Modelo de responsabilidade (RACI)
- Contrato de triggers clínicos
- Decisão sobre quem decide o quê/quando

---

*Criado 2026-04-27 ~07h30 BRT como instrumento operacional do Livro Magno (sugestão de análise externa). Mantém custo de operar conhecimento baixo. Não substitui documentação completa — atalha decisão.*
