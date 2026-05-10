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

- [09/05] — **IA na página renal coletando exames laboratoriais** (sugestão Ricardo 05/05).
  Nôa pede ao paciente: creatinina, EAS + cultura urinária, US vias urinárias.
  Volume estimado: ~6-8h. Anti-kevlar §2 OK porque Ricardo dita os exames
  específicos (não IA inventa). Bloqueador empírico: 0 exames renais cadastrados
  hoje. Gates pra reabrir: ≥1 paciente real cadastrar 1º exame manualmente +
  Sprint 1 medido. Pós-isso, IA solicitar próximos vira polish.
  Origem: Ricardo Valença 05/05/2026 (mensagem WhatsApp)
  Conexão: estágio 1 INTAKE — Saúde Renal / Cidade Amiga dos Rins

- [09/05] — **Dashboard KPI Cidade Amiga dos Rins (DRC estágios I-V)**.
  Material existe parcialmente: `renal_exams.drc_stage TEXT` + view `v_renal_trend`
  (validados via PAT). Pergunta Ricardo: "quantos pacientes em estágio I, II, III, IV, V?".
  Stack: 1 view nova (`v_drc_stage_distribution`) + 1 card no dashboard admin.
  Volume: ~3h total. Bloqueador empírico: 0 exames renais cadastrados → KPI vazio.
  Gates pra reabrir: ≥10 exames cadastrados (volume estatístico mínimo).
  Origem: Ricardo Valença 05/05/2026
  Conexão: estágio 5 FORMAL_ACT + observabilidade Cidade Amiga

- [09/05] — **Avaliador de Risco DRC** (blueprint pré-kevlar, nunca codado).
  Texto técnico Ricardo menciona "machine learning + alertas precoces".
  Anti-kevlar §2 FORTE: se for codar, Ricardo dita regras manualmente
  (creatinina/eGFR/proteinúria thresholds + intervalos), NÃO ML auto-aprendiz.
  Volume incerto pré-protocolo Ricardo. Parking permanente até decisão clínica
  formal sobre regras de risco.
  Origem: documento pré-kevlar trazido por Ricardo 05/05
  Conexão: estágio 2 STRUCTURING — análise de risco DRC

<!-- TEMPLATE para futuras entradas:
- [DD/MM HH:MM] — [Ideia em 1 linha]. Avaliar pós-Sprint 1 medido.
  Origem: [autor]
  Conexão: [estágio ciclo OU novo eixo]
-->

---

## Exceções acionadas (registro auditável)

- [09/05 ~18h] — **Exceção #5 (Pedro decide explicit + Exceção #1 cobertura risco)**
  
  **Motivo:** Bug funcional reportado pelo Dr. Ricardo Valença em 05/05/2026 via WhatsApp:
  filtro de busca de paciente em `RenalFunctionModule.tsx` não retorna todos pacientes
  (Carolina Campello invisível). Filtro original usa apenas `clinical_assessments.doctor_id`,
  ignora pacientes vinculados via `clinical_reports.doctor_id`. Bloqueia workflow do
  nefrologista chefe do programa Cidade Amiga dos Rins.
  
  **Justificativa:** Ricardo é stakeholder clínico crítico. Bug bloqueia uso real do
  módulo Saúde Renal. Não é feature nova nem análise estrutural — é fix funcional sobre
  código vivo. Princípio "polir não inventar" aplicado.
  
  **Ação tomada:**
  - Fix em RenalFunctionModule.tsx (V1.9.204): UNION queries clinical_assessments OR
    clinical_reports + dedupe via Set + Promise.all paralelo
  - ZERO mudança schema/RLS/CORE/AEC
  - 3 entradas correlatas adicionadas ao parking (IA renal, KPI DRC, Avaliador Risco)

- [10/05 ~01h] — **Exceção #1 (cobertura risco regulatório) + #5 (Pedro explicit)**

  **Motivo:** Tela `Terminal de Pesquisa → Dashboard de Pesquisa` exibia bloco
  "Integrações e Conexões" com 6 números mock hardcoded enganosos:
  ```
  Tela mostrava   vs   Real (PAT 10/05)
  89 casos AEC         9-25 (3-4× inflado)
  34 profissionais     10  (3.4× inflado)
  156 dados clínicos   87  (1.8× inflado)
  124 pacientes        25  (5× inflado)
  856 alunos            0  (∞ inflado — ZERO alunos no banco)
  3 estudos             0  (?× inflado)
  ```
  Mesma classe de risco regulatório resolvida em V1.9.203 (ACDSS hide).
  Mock parece claim falso material pra Muhdo / parceiros / pacientes externos.

  **Justificativa adicional:** botões "Acessar Curso" eram redundantes com Catálogo
  de Cursos do sidebar (linhas 147-148, 268-269, 302). Esta aba é Terminal de PESQUISA,
  não ENSINO — conteúdo desalinhado com o nome.

  **Ação tomada:**
  - V1.9.206: substituído bloco "Integrações e Conexões" em
    `src/components/ResearchDashboardContent.tsx` por:
    • Card destaque "Cidade Amiga dos Rins" → /app/pesquisa/profissional/cidade-amiga-dos-rins
      (página JÁ EXISTE com 1.352 LOC)
    • Linha discreta atalho "Catálogo de Cursos" (preserva UX sem mock numbers)
  - ZERO mudança schema/RLS/Edge/CORE/AEC
  - Volume real ~30 min, ZERO regressão técnica
  - Páginas que navegam pra `/app/pesquisa/profissional/dashboard` (CidadeAmigaDosRins.tsx,
    JardinsDeCura.tsx, MedCannLab.tsx) continuam funcionando — só conteúdo da aba muda

<!-- TEMPLATE para futuras exceções:
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
