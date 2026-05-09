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

- [09/05] — **Galeria de NFTs do médico** (tab nova em ProfessionalMyDashboard).
  Volume real: ~1h. **ZERO schema novo**, ZERO service novo, ZERO tabela nft_shares.
  Reuso 100%: RLS de `patient_nfts` JÁ permite profissional ver via JOIN
  `clinical_reports.doctor_id` (validado via PAT). Reusar `PatientNFTGallery.tsx`
  com prop `mode='professional'` + filtro WHERE pacientes do médico.
  Vínculo paciente↔médico já vem grátis do schema — NÃO precisa "compartilhar"
  como ação explícita. Médico vê NFTs dos pacientes que ele atende.
  Avaliar pós-Sprint 1 medido + sinal Ricardo/Eduardo demandar contexto visual.
  Origem: Pedro 09/05
  Conexão: estágio 4 LONGITUDINAL (camada simbólica) — polish do fluxo já existente

- [09/05] — **NFT da revisão clínica + compartilhamento explícito paciente→médico**
  (versão completa, NÃO recomendada agora).
  Stack: 2 cols em `patient_nfts` (`nft_type`, `triggered_by_review_id`) + tabela
  `nft_shares (nft_id, professional_id, shared_at, revoked_at)` + UI revoke +
  Edge `generate-nft-from-report` aceitar `?type=revision&review_id=X`.
  Volume: ~6-8h. Risco: 2 NFTs do mesmo evento clínico podem confundir paciente.
  Gates pra reabrir: ≥5 devoluções reais + paciente espontaneamente gerar NFT
  pós-devolução + médico mencionar querer "coleção visual de pacientes revisados".
  Se 2 dos 3 acontecerem → V1.9.21x. Senão → parked permanente.
  Origem: Claude (proposta) + Pedro (curadoria) 09/05
  Conexão: estágio 4 LONGITUDINAL — feature nova, NÃO polish

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
