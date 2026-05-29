# 02_REAL_USER_FLOWS + 08_DRAFT_DROP_OFF — Uso Real Qualificado — 29/05/2026

**Método**: PAT empírico cruzando `users.email` com lista de internos (11 emails sócios+amigos teste) vs externos.
**Princípio aplicado**: separação semântica interno vs externo (lembrete crítico Sprint 0).

---

## TL;DR (5 bullets, CRÍTICOS)

1. **📊 Reports 87% INTERNO** (126/145). Apenas **19 reports externos reais** em todo histórico.
2. **💊 CFM Prescrições 60% EXTERNAS** (29/48) ← surpresa positiva. Ricardo prescrevendo pra pacientes reais.
3. **⚠️ Appointments 44% CANCELLED** (41/93). Apenas 4 completed (4%). Resto = scheduled future.
4. **⚠️ AEC 60% INTERRUPTED** (9 interrupted vs 4 completed). Drop-off alto.
5. **📉 Prescrição DRAFT 79%** (38/48). Atualizado de 94% (22/05) → 79% (29/05) — Ricardo assinando mais nos últimos 6 dias.

---

## §1 — Catálogo internos (11 emails)

```
passosmir4@gmail.com        → Pedro admin paciente teste
phpg69@gmail.com            → Pedro pessoal
rrvalenca@gmail.com         → Ricardo (profissional admin)
iaianoaesperanza@gmail.com  → Ricardo admin alternativo
eduardoscfaveret@gmail.com  → Eduardo Faveret
casualmusic2021@gmail.com   → Pedro paciente teste (#6ACF)
cbdrcpremium@gmail.com      → João Vidal admin
jevyarok@gmail.com          → João Vidal paciente teste
mariorvalenca@outlook.com   → Mario (irmão Ricardo)
carolinacampellovalenca@gmail.com → Carolina (Ricardo familia teste)
admin.test@medcannlab.com   → admin teste sintético
```

→ 11 emails. Tudo o que NÃO está nessa lista é considerado "externo" pra esta análise.

⚠️ **Caveat**: paciente externo pagante (Marco 2) ainda é ZERO confirmado. Os "externos" aqui são contatos do Ricardo (Maria Pinto Pitoco, Cristiano Pontes, etc) — alguns reais, alguns ainda teste. Só Maria Pinto confirmada empíricamente como caso real (memory `feedback_pacientes_reais_vs_testes_clinical_rationalities_27_05`).

---

## §2 — Clinical Reports (145 total)

| Categoria | Count | % |
|---|---|---|
| **Internos** (11 emails sócios) | **126** | 87% |
| **Externos** | 19 | 13% |

→ 87% do histórico é teste interno. Pra qualquer análise de "uso real Nôa AEC", **dividir por 7-8x** pra estimar adoção externa real.

→ Sprint 5 verediot: nenhuma conclusão de "uso real Nôa" pode ser feita até a base externa crescer 5-10x.

---

## §3 — CFM Prescrições (48 total) ← ACHADO POSITIVO

| Categoria | Count | % |
|---|---|---|
| **Internos** | 19 | 40% |
| **Externos** | **29** | **60%** |

| Status | Count | % |
|---|---|---|
| **Draft** | **38** | **79%** |
| Signed/assinada | 7 | 15% |
| Outros | 3 | 6% |

**Comparação 22/05**:
- 22/05: 45 prescrições, 94% draft → 6% signed (estimativa por achado disperso)
- 29/05: 48 prescrições, 79% draft → 15% signed

→ **DRAFT DROP-OFF MELHOROU** em 6 dias (94% → 79%). Ricardo assinou mais. Mas ainda **79% draft** é alto.

→ Hipótese: médico ainda usa CFM Prescrições como **rascunho persistente** (não como "prescrição final assinada"). UX/fluxo precisa investigar Sprint 5.

→ 60% externas = **Ricardo realmente prescrevendo pra pacientes reais** mesmo pré-PMF. Valor empírico real.

---

## §4 — Appointments (93 total) ← ACHADO PREOCUPANTE

| Status | Count | % |
|---|---|---|
| `scheduled` (futuras) | 48 | 52% |
| `cancelled` | **41** | **44%** |
| `completed` | 4 | 4% |

| Categoria | Count | % |
|---|---|---|
| Internos | 50 | 54% |
| Externos | 43 | 46% |

**Análise**:
- **44% cancelled = MUITO ALTO**. Mesmo qualificado pelo viés interno (Pedro+Ricardo testando agenda).
- **Apenas 4 completed** historicamente. WiseCare vídeo está em homologação — pode ser parte da causa (link homolog quebrava antes).
- 52% scheduled = futuras. Maioria pode virar cancelled também.

**Hipóteses pra Sprint 5**:
1. Cancelamento é fluxo legítimo (paciente desmarca) — empírico
2. Cancelamento é UX gap (sistema "cancela" quando deveria "reagendar")
3. Cancelamento é incentivo (referral marco zero — `tr_set_referral_marco_zero` trigger?)

**Recomendação Sprint pós-Marco 2**: investigar 41 cancelamentos com sample qualitativo. Quem cancelou? Quando? Por quê (notes)?

---

## §5 — AEC FSM (FSM determinística 20 fases)

| Phase | Count | Status |
|---|---|---|
| `INTERRUPTED` | **9** | 60% drop-off |
| `COMPLETED` | 4 | sucesso |
| `COMPLAINT_DETAILS` | 1 | em progresso |
| `FINAL_RECOMMENDATION` | 1 | quase concluído |

**Análise**:
- 9 interrupted vs 4 completed = **drop-off 69% das AECs que saíram do GREETING**
- Casos Interrupted antigos identificados em memória `project_v1_9_474_aec_reset_invalidated_trigger_bd_27_05`:
  - Illa 22/05 (paciente cadastrada, não-completou)
  - Pedro 22/05 (smoke teste)
  - Thiago 05/05 (21d sem retomar)
  - Solange 27/04 (30d sem retomar)
  - João Eduardo 25/05

**Achado**: Backlog P1 conhecido — "5 aec_assessment_state in_progress órfãs" do CLAUDE.md. Hoje são 9 interrupted (cresceu — não-mitigado).

**Recomendação**: 
- 🔴 Ricardo decisão (retomar / cancelar / invalidar com motivo) pra cada
- Sem UI hoje pra médico ver/gerir AECs interrupted — UI gap empírico

---

## §6 — Dossiês Matrix (11 total)

(Já analisado em DIARIO_28_05 Bloco I + memory):
- 100% internos (Pedro 6 / Ricardo 3 / Eduardo 1 / 2 órfãos sem patient_id)
- Maria Pinto / Gilda / outros pacientes externos = 0 dossiês prévios

→ Matrix tem **adoção empírica zero externa**. Pré-Marco 2 confirmado.

---

## §7 — Feedback Tickets (2 total)

- Total: 2 (ambos PAT smoke meu)
- Reais (externos): **0**
- Adoção empírica: 0%

→ Canal Feedback V1.9.486 entregue mas sem volume real ainda. Esperado pré-PMF.

---

## §8 — Funil empírico (qualificado)

```
INTERNO (sócios + amigos teste — 11 emails):
  Users: 11/50 (22%) auth
  Reports: 126/145 (87%)
  AECs: ~13/13 = 100% (estimado)
  Prescrições: 19/48 (40%)
  Appointments: 50/93 (54%)
  Dossiês: 11/11 (100%)

EXTERNO (resto):
  Users: 39/50 (78%) — MAS apenas 1 confirmada paciente real (Maria Pinto)
  Reports: 19/145 (13%)
  Prescrições: 29/48 (60%) ⭐ Ricardo prescrevendo real
  Appointments: 43/93 (46%) — mas 44% cancelled global
  Dossiês: 0
```

→ **Funil empírico revela**: a única dimensão onde externo > interno é PRESCRIÇÕES (60%). Em todas as outras, interno domina.

→ Isso é **coerente**: Ricardo prescreve pra pacientes reais dele (consultório físico), mas eles não interagem com o app (não fazem AEC, não viram users ativos).

→ **Implicação Marco 2**: a meta "20-30 pacientes externos pagantes" significa converter parte dos 39 externos atuais em **users ativos** (AEC + chat + retornos), não só criar conta.

---

## §9 — Hierarquia de risco (uso real)

### 🔴 Quebra uso real
1. **44% appointments cancelled** — investigar causa raiz (UX vs comportamento real)
2. **69% AECs interrupted** sem UI pra gerir — backlog P1 conhecido, não-mitigado

### 🟡 Atrito de fluxo
1. **79% prescrições DRAFT** (melhorou de 94%, mas ainda alto) — médico usa CFM como rascunho persistente
2. AECs interrupted antigas (5+) órfãs sem UI pra Ricardo gerir
3. 87% reports internos = base muito enviesada pra qualquer análise empírica externa

### ⚫ Polish
- 22% users são "internos identificados" (11/50) — restantes 39 são mix de teste + externos reais. Catálogo individual pendente Sprint 4 (com Ricardo)

---

## §10 — Frase âncora

> *"87% dos reports são INTERNOS (sócios+amigos teste). 60% das prescrições CFM são EXTERNAS (Ricardo prescrevendo real). 44% appointments cancelled — preocupante. 69% AECs interrupted sem UI pra gerir — backlog P1 não-mitigado. Prescrição DRAFT melhorou (94% → 79% em 6 dias). Adoção Matrix externa = ZERO. Funil empírico revela: única dimensão onde externo > interno é Prescrições — coerente com Ricardo atendendo pacientes físicos sem que eles virem users digitais. Marco 2 = converter 39 externos atuais em users ativos (AEC + retornos), não só criar contas."*
