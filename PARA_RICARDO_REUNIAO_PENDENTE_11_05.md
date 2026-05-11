# 📋 PARA RICARDO — Reunião pendente desde 07/05

**Preparado por:** Pedro + Claude (sessão 11/05/2026)
**Vigência:** material vivo até reunião acontecer
**Tempo estimado de reunião:** 60-90 min

---

## Resumo executivo (1 minuto)

Dia 11/05 tivemos sessão técnica densa: **11 commits**, **9 bugs estruturais** descobertos via uso empírico real (incluindo primeiro friendly user externo — Cristiano Pontes que completou ciclo end-to-end em 23 min). **9 itens precisam sua decisão** abaixo. Sem reunião, o Sprint 1 fica invisível (`closed_loop_completion_rate_30d = 0%`) e o ARQ-1 (drift médico-alvo) bloqueia release pra paciente externo real.

---

## 1. SPRINT 1 MEDINDO (P0 — você é o único gargalo)

**Estado:** 31 reports signed nos últimos 30d. **0 aprovados.**
**Bloqueio:** sem aprovação sua, `closed_loop_completion_rate = 0%` permanente.
**Decisão:** logar no dashboard, aprovar 5 reports draft pra "destravar" KPI.
**ETA:** 30-45 min de trabalho seu.

---

## 2. LAUDO ARQ-1 + V1.9.222 (aplicado backward-compat)

**Empírico:** Cristiano declarou Faveret (Neurologia), sistema vinculou você (Nefrologia). Especialidade trocada silenciosamente — CFM 2.314/2022 risco em paciente real.

**Causa raiz:** FSM AEC não modelava médico-alvo como dado de primeira classe.

**Fix aplicado V1.9.222 (~90 LOC, 6 arquivos, 100% backward-compat):**
- Persiste `aecTargetPhysicianId` em FSM
- Edge DOCTOR_RESOLUTION lê target no topo da chain
- Telemetria `cognitive_events.DOCTOR_DIVERGENCE_DETECTED` audita futuras divergências

**Decisões pendentes:**
- ✅ Validar fix conceitualmente (já aplicado, anti-regressão confirmada)
- Plugar função `bindPatientToDoctor` (existe em `aecGate.ts:156` mas nunca chamada) ou deletar?

---

## 3. V16 RIM — Aprovação pendente desde 07/05 (4 dias)

**Arquivo:** `PARA_RICARDO_V16_APROVAR.md` no repo + `RASCUNHO_A1_PR_07_05.md`

**Status:** sem resposta sua desde 07/05.

**Decisão:** aprovar Caminho A.1 (cristalização Constituição runtime via RIM = Runtime Institutional Manifest) ou propor mudanças.

---

## 4. SCORE HARDCODED 1.5 (352/358 reports)

**Empírico:** 352 reports nos últimos meses todos com `clinical_score=1.5` fixo.

**Causa:** TODO em `handleFinalizeAssessment:1301` — "Hardcoded baseline momentâneo para compatibilidade".

**Implicação:** dashboard mostra score irreal. Você nunca viu score calculado de verdade.

**Decisão:** definir fórmula de cálculo real (4 fatores: anamnese, detalhamento, consenso, qualidade narrativa?) ou aceitar manter binário "completou/não completou".

---

## 5. BUG 3 — "anoite" capturado como Localização (semântica)

**Empírico:** Cristiano respondeu "anoite" (= à noite, TEMPO) para pergunta "Onde sente?" (LOCAL). FSM aceitou silenciosamente.

**Resultado no relatório:** `complaintLocation: "anoite"` — médico vê dado clínico ruim.

**Decisão:** cleanup_pass V1.9.109 deve expandir pra detectar resposta-temporal em campo-espacial? Ou apenas avisar paciente "essa resposta não parece ser sobre LOCAL — deseja revisar"?

---

## 6. BUG 6 — "O que mais?" cap empírico

**Empírico:** Cristiano (paciente externo) achou "muito zoado, difícil de usar, 20 vezes". Você também questionou há 1 ano.

**Frequência empírica:** ~10-19 turns de "O que mais?" por AEC completa (3 listas isList=true × 2-5 followups).

**Decisões:**
- (a) Manter design atual (princípio narrativo)
- (b) Cap de 3 followups por sub-pergunta + transição automática
- (c) UI "Tem mais ou só isso?" com botões em vez de texto livre
- (d) Você propõe outra solução

---

## 7. RATIONALITY ~18s no pipeline (55% do total)

**Empírico:** telemetria V1.9.215 mostrou em 2 AECs:
- Pedro: total 36s, rationality 19.8s (55%)
- Cristiano: total 26s, rationality 12.8s (49%)

**Decisão:** RATIONALITY pode ser async pós-retorno ao paciente? Cliente receberia "Sua avaliação está sendo processada, relatório fica pronto em 30s" e fechava a sessão. Pipeline continuaria server-side. Ganho: percepção UX +50% mais rápido.

**Risco:** se RATIONALITY async falhar, paciente não sabe.

---

## 8. UX-4 — Contexto visual na retomada de AEC pausada

**Empírico:** Cristiano interrompeu AEC com pergunta off-topic ("como gero NFT?"), sistema pausou corretamente, ofereceu 3 opções. Cristiano disse "continuar". Sistema voltou pra COMPLAINT_LIST com "O que mais?" — sem contexto visual de onde parou. Cristiano respondeu off-topic 3 vezes sem perceber que estava dentro da AEC.

**Decisão:** ao retomar, mostrar frase de contexto ("Continuando sua avaliação. Estávamos listando suas queixas. Você havia falado de 'dor de cabeça'. Tem mais alguma coisa?") em vez de só "O que mais?".

**Custo:** ~10 LOC client.

---

## 9. ONBOARDING 9 médicos sem council/fee (operacional)

**Empírico:** view `v_clinical_cycle_health`:
```
professionals_with_council_state: 1/10  (só você)
professionals_with_fee:           1/10  (só você, 400/consulta)
```

**Implicação:**
- CFM 2.314/2022 violado em runtime pros outros 9
- Booking widget dropdown mostra Ricardo como única opção real → causa ARQ-1
- V1.9.207 (cadastro CRM obrigatório) só protege NEW signups, não os 9 antigos

**Decisão:** você contata Eduardo + 8 colegas pra preencher cadastro? Ou suspende cadastros incompletos do dropdown?

---

## Lista de decisão (formato Y/N pra agilizar)

| # | Pergunta | Y/N | Notas |
|---|---|---|---|
| 1 | Aprovar 5 reports draft pra destravar Sprint 1 medindo | ⬜ | |
| 2 | Validar V1.9.222 e autorizar plug `bindPatientToDoctor`? | ⬜ | |
| 3 | Aprovar V16 RIM Caminho A.1? | ⬜ | |
| 4 | Aceitar score binário "completou/não" até definir fórmula? | ⬜ | |
| 5 | Autorizar expansão cleanup_pass V1.9.109 para semântica espacial/temporal? | ⬜ | |
| 6 | "O que mais?" — qual opção (a/b/c/d)? | ⬜ | |
| 7 | RATIONALITY async pós-retorno? | ⬜ | |
| 8 | UX-4 contexto retomada — autorizar polish? | ⬜ | |
| 9 | Onboarding 9 médicos — você contata ou suspende? | ⬜ | |

---

## Contexto adicional

- **Cristiano = friendly user teste**, NÃO paciente externo pagante real. Gate "1 paciente externo pagante" do diário 10/05 segue **0/1**.
- **Stack inteira validou-se** end-to-end via Cristiano em 23 min. ICP-Brasil + Verbatim + Pipeline funcionando.
- **9 bugs descobertos em 1 sessão** mostram dívida latente — pré-PMF precisa exercitar esses caminhos.
- **Sem CNPJ MedCannLab Tecnologia em Saúde Ltda**, gate Muhdo + Stripe + WhatsApp + pagamento real bloqueados.
- **Email Muhdo D+1 sem enviar desde 08/05** (4 dias) — também depende de você confirmar texto antes.

---

*Este documento é vivo. Atualize com suas respostas e devolva pro Pedro pra implementação.*
