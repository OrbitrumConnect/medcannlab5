# POP-VAL-001 — Validação Clínica Documental

**Versão draft:** 0.1 (29/05/2026)
**Status:** DRAFT pré-consultora SaMD (requer revisão Ricardo Valença + RT)
**Referência normativa:** ISO 13485:2016 §7.3.7 + IEC 62366-1 (Engenharia de Usabilidade)

---

## 1. Objetivo

Documentar a estratégia de validação clínica do MedCannLab 3.0 como SaMD Classe IIa, incluindo:

- Validação interna (sócios e usuários internos)
- Validação externa formal (pacientes externos pagantes — Marco 2)
- Critério de aceitabilidade clínica
- Plano de validação contínua pós-comercialização

## 2. Estado atual da validação (transparência empírica)

### 2.1. Validação interna realizada

| Validador | Papel | Período | Volume |
|---|---|---|---|
| Pedro Galluf | Tech Lead + paciente teste (UUID `d5e01ead`) | Maio/2026 contínuo | ~50 AECs incompletas |
| Ricardo Valença | Médico Sócio + admin REAL | Abril-Maio/2026 | ~40 reports gerados |
| Eduardo Faveret | Coordenador Ensino (operacional desde 27/05) | 27-29/05/2026 | ~5 sessões |
| Carolina Campello | Conta teste do Ricardo | Abril-Maio/2026 | ~7 reports |

### 2.2. Validação externa empírica

**ZERO pacientes externos pagantes** confirmados (Marco 2 pendente).

**1 paciente externo REAL** identificado (memória `feedback_pacientes_reais_vs_testes_clinical_rationalities_27_05`):
- **Maria das Dores Pinto Pitoco** — 3 rationalities + 1 sidecar renal
- Cadastrada por Ricardo no escopo de teste extendido

### 2.3. Taxa empírica TESTES vs REAIS

| Categoria | % |
|---|---:|
| Pacientes internos (sócios + amigos + testes Pedro/Ricardo) | ~96,9% |
| Pacientes externos potencialmente reais | ~2-3% |
| Pacientes externos REAIS validados clinicamente | ~0,8% (1 confirmada) |

**Frase âncora cristalizada:** *"NÃO declarar 'N pacientes acompanhados' usando contagem agregada — anti-overclaim Babylon/Watson."*

## 3. Estratégia de validação Marco 2 (1º paciente externo pagante)

### 3.1. Critérios de elegibilidade

Paciente que entrar via Marco 2 deve:

- Ser maior de 18 anos com plena capacidade legal
- Ter consentimento médico expresso (CFM 2.314)
- Pagar pela consulta (proxy de "uso real, não favor")
- Não ter vínculo profissional com MedCannLab nem com Pedro/Ricardo/Eduardo/João
- Concordar com Termo de Uso + Política de Privacidade LGPD
- Concordar explicitamente em participar de validação formal SaMD

### 3.2. Métricas obrigatórias de validação

Para cada paciente Marco 2, instrumentar:

| Métrica | Captura | Fonte |
|---|---|---|
| Tempo total AEC | `aec_assessment_state.last_update - started_at` | DB |
| Fases completadas | `completed_phases` array | DB |
| Taxa de Verbatim bypass | `metadata.verbatim_used` | ai_chat_interactions |
| Custo OpenAI | `metadata.cost_usd_estimate` | ai_chat_interactions |
| Latência turn | `processing_time` | ai_chat_interactions |
| Score Ricardo (1-10) | Manual via `clinical_qa_runs` | Formal |
| Score paciente (NPS-like) | Pós-AEC questionnaire | UI |
| Adesão Marco 3 (volta em 30d) | Cohort follow-up | DB |

### 3.3. Cadência `clinical_qa_runs` Marco 2

- 1 run **PRÉ-paciente externo** (baseline empírico) — instrumentação V1.9.85
- 1 run **AO FIM da primeira AEC externa** (validação imediata)
- 1 run **APÓS follow-up 30d** (validação clínica longitudinal)

## 4. Validação por papel

### 4.1. Médico Sócio (Ricardo Valença) — validação clínica primária

- Criador do método AEC → autoridade máxima sobre fidelidade ao método
- Camadas 0-2 da pirâmide (constitucional)
- Validação **antes de Marco 2** (já realizada empíricamente em ~40 reports internos)
- Validação **durante Marco 2** (formalizada via clinical_qa_runs)

### 4.2. Coordenador Ensino (Eduardo Faveret) — validação metodológica

- Operacional desde 27/05/2026 (memória `project_eduardo_faveret_no_app_sharing_validado_27_05`)
- Validação do eixo Ensino (cursos AEC + Simulações de Paciente)
- Validação cross-account (sharing entre médicos validado empíricamente)
- **Princípio meta cristalizado** durante uso real: *"IA admite limite em vez de fingir entender"* (memória `feedback_ia_admite_limite_em_vez_de_fingir_entender_27_05`)

### 4.3. RT habilitado (a contratar) — validação regulatória formal

- Pós-CNPJ
- Assinatura formal de documentos SGQ
- Auditoria de aderência a CFM 2.314 + 2.381 + RDC 327/2019 + LGPD

## 5. Validação técnica de output clínico

### 5.1. Validação automática (telemetria contínua)

```sql
-- Reports gerados com signature ICP-Brasil OK (Lock V1.9.299)
SELECT COUNT(*) FROM clinical_reports
WHERE signed_at IS NOT NULL AND signature_hash IS NOT NULL;
-- Atual empírico: 42 reports signed

-- Reports com racionalidades sanitizadas (V1.9.452)
SELECT COUNT(*) FROM clinical_rationalities
WHERE generated_by = 'noa_ai' AND assessment LIKE '%Paciente #%';
-- Atual empírico: 132 backfilled + novos

-- Reports com latência aceitável
SELECT 
  percentile_cont(0.5) WITHIN GROUP (ORDER BY processing_time) AS p50,
  percentile_cont(0.95) WITHIN GROUP (ORDER BY processing_time) AS p95
FROM ai_chat_interactions
WHERE created_at > now() - interval '7 days';
```

### 5.2. Validação manual obrigatória pré-Marco 2

Antes de receber 1º paciente externo pagante:

- [ ] Smoke completo de 1 AEC end-to-end por **Ricardo Valença**
- [ ] Validação de relatório gerado por **Eduardo Faveret** (cross-validation)
- [ ] PDF ICP-Brasil validado em validar.iti.gov.br
- [ ] Racionalidade integrativa gerada e revisada (V1.9.388-A.3)
- [ ] Sidecar renal disparado adequadamente se DRC presente
- [ ] Sidecar neuro disparado adequadamente se sinais TEA/TOD/TDAH presentes
- [ ] Documentação `clinical_qa_runs` registrada formalmente

## 6. Validação de usabilidade (IEC 62366-1)

### 6.1. Usuários primários identificados

- **Médicos especialistas** em cannabis medicinal e nefrologia (Ricardo)
- **Médicos generalistas** com interesse em cannabis (público alvo Marco 3+)
- **Pacientes** com indicação cannabis medicinal (público Marco 2+)
- **Alunos** de curso AEC (público interno)

### 6.2. Cenários de uso críticos validados internamente

| Cenário | Status validação |
|---|---|
| Paciente inicia AEC sozinho | ✅ Validado (Pedro paciente teste) |
| Médico cadastra paciente externo | ✅ Validado (pattern CFM-compliant memória `feedback_padrao_orfaos_*`) |
| Médico revisa relatório gerado | ✅ Validado (Ricardo + Eduardo) |
| Médico assina PDF ICP-Brasil | ✅ Validado empíricamente |
| Paciente compartilha com 2º médico | ✅ Validado (memória `feedback_share_overwrite_*`) |
| Paciente abandona AEC e retoma | ✅ Auto-pause detector V1.9.299 |
| Médico vê AEC interrompida e decide | ✅ V1.9.500 InterruptedAECsCard |

### 6.3. Cenários de uso críticos PENDENTES validação externa

- [ ] Paciente Marco 2 conclui AEC com avaliação ≥7/10
- [ ] Médico Marco 2.5 (independente externo) confirma qualidade clínica
- [ ] Múltiplos médicos em mesmo paciente (sharing)

## 7. Aceitabilidade clínica

### 7.1. Critérios mínimos para "validação Marco 2 PASS"

- ≥1 paciente externo pagante completa AEC integralmente
- ≥1 médico independente externo confirma qualidade do relatório
- 0 eventos adversos graves reportados
- Latência P95 < 12s mantida
- Custo médio por AEC < $1 USD

### 7.2. Critério para "validação Marco 3 PASS" (PMF declarável)

- ≥20-30 pacientes externos pagantes
- ≥2 médicos independentes externos usando regularmente
- NPS médico ≥50
- NPS paciente ≥40
- Taxa retenção 30d ≥70%

## 8. Validação pós-comercialização (pós-Marco 4)

### 8.1. Surveillance ativa

- Telemetria contínua via `ai_chat_interactions`
- `clinical_qa_runs` cadência mínima 2/mês
- Audit trimestral por RT
- Audit anual por consultora SaMD

### 8.2. Reporte de eventos adversos (post-market surveillance)

Canal estabelecido: `/app/feedback` (V1.9.486) com escalação urgente automatizada para casos graves.

---

**Aprovação:**
- [ ] RT habilitado: ________________ Data: ___/___/___
- [ ] Médico Sócio (validação clínica): Dr. Ricardo Valença — Data: ___/___/___
- [ ] Consultora SaMD: ________________ Data: ___/___/___
- [ ] Tech Lead: Pedro Henrique Passos Galluf — Data: 29/05/2026 (draft)
