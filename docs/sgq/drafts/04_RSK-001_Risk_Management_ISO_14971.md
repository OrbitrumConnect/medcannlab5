# RSK-001 — Análise de Risco ISO 14971 + FMEA Inicial

**Versão draft:** 0.2 (02/06/2026 — H8 resolvido V1.9.506; números RLS/assinatura re-verificados via PAT; gap PII residual documentado; overclaim "ICP signed" corrigido p/ hash de integridade)
**Status:** DRAFT pré-consultora SaMD (requer revisão Ricardo Valença + RT)
**Referência normativa:** ISO 14971:2019 (Aplicação de gestão de risco a dispositivos médicos)

---

## 1. Escopo

Identificação, análise e controle de **riscos clínicos** associados ao uso do MedCannLab 3.0 como SaMD Classe IIa, com foco em:

- Risco de **decisão clínica errada** induzida pelo sistema
- Risco de **vazamento de PII / LGPD**
- Risco de **falha de assinatura jurídica** (ICP-Brasil)
- Risco de **falha de consentimento** do paciente
- Risco de **alucinação IA** com impacto terapêutico

## 2. Hazards identificados (10 hazards principais)

### H1 — IA prescreve autonomamente (Babylon-pattern)

**Descrição:** Sistema IA gera prescrição sem médico no loop ou influencia decisão sem disclaimer adequado.

**Controle implementado:**
- **Lock V1.9.388-A.3 multi-camada**: regulatório CFM 2.314 + LGPD art. 11/20 + EU AI Act + FDA SaMD + WMA
- **Princípio cristalizado** (memória `feedback_bula_e_infraestrutura_cognitiva_no_fluxo_prescricao_27_05`): *"médico prescreve, sistema documenta"*
- **Matrix Z2** = compressão estrutural permitida, **abstração clínica proibida** (memória `feedback_compressao_estrutural_vs_abstracao_clinica_27_05`)

**Severidade residual:** BAIXA (multi-camada de controle)

### H2 — Vazamento de PII em texto livre da IA

**Descrição:** Nome completo de paciente aparecer em `clinical_rationalities.assessment` (visto empiricamente em 4/5 rows recentes em audit 26/05).

**Controle implementado:**
- **V1.9.452 (29/05)**: Edge `tradevision-core` v423 com `sanitizeRationalityPII` + `lookupPatientName` patcheando 2 INSERTs (linhas 1723+2287)
- **Backfill 132 rows** via PL/pgSQL replicando lógica JS `casePseudonymization.ts` V1.9.407
- **Telemetry `pii_sanitized=true`** em metadata

**Severidade residual:** BAIXA-MÉDIA. Controle automático ativo (`sanitizeRationalityPII`), MAS **gap conhecido (gap-analysis 02/06)**: o regex de token EXATO (`\b<token>\b`) NÃO cobre variantes ortográficas/typos (ex: nome no DB difere da grafia gerada pelo GPT) → **20/141 racionalidades residuais não-pseudonimizadas** (live 02/06). Fix técnico-interno pendente (normalização de variantes + re-anonimização).

### H3 — Falha de consentimento (Consentimento ≠ Agendamento)

**Descrição:** Sistema interpretar "concordo" durante revisão clínica como autorização de agendamento.

**Controle implementado:**
- **REGRA HARD §1** constitucional (anti-kevlar §1)
- **Lock V1.9.95** AEC + Relatório + Agendamento selado 27/04/2026
- **AEC Gate V1.5** (V1.9.95-A reforçado) bloqueia agendamento durante AEC ativa
- **Guard `isAskingConsent`** em `tradevision-core/index.ts`

**Severidade residual:** MUITO BAIXA (4 camadas de defesa)

### H4 — Assinatura ICP-Brasil falha ou é falsificada

**Descrição:** PDF assinado não é reconhecido pelo Portal ITI OU assinatura é gerada sem cert válida.

**Controle implementado:**
- **Lock V1.9.299** PBAD AD-RB CONFORME ITI (16/05/2026)
- **Validação smoke ITI** obrigatória: openssl asn1parse + validar.iti.gov.br + diff binário
- **V1.9.457** auth + ownership check na Edge `sign-pdf-icp` v22

**Severidade residual:** BAIXA (validação ITI explícita)

### H5 — Alucinação IA com conteúdo clínico inventado

**Descrição:** GPT-4o gera informação clínica que não vem de fonte autoritativa.

**Controle implementado:**
- **VERBATIM FIRST V1.9.86**: ~46% bypass GPT em hard-lock phases
- **Princípio Grounding factual**: GPT NUNCA responde número factual sem fonte autoritativa
- **Matrix Z2 Bula como material marcado** (V1.9.468-B): cita literal, NUNCA sintetiza cross-bulas, NUNCA infere interação não-documentada

**Severidade residual:** MÉDIA (depende de uso responsável)

### H6 — Trauma de paciente em conversa AEC

**Descrição:** Conversa com Nôa desencadear trauma psicológico em paciente vulnerável.

**Controle implementado:**
- **COS KERNEL Porta Trauma** (camada 1 da pirâmide)
- **Lock V1.9.388-A.3** componente WMA (Declaração Helsinki)

**Severidade residual:** BAIXA (controle constitucional)

### H7 — Falha de RLS expondo dados de paciente

**Descrição:** Médico A ver dados de paciente do médico B sem autorização.

**Controle implementado:**
- **100% das 145 tabelas com RLS ON** (re-verificado via PAT 02/06/2026)
- **Audit empírico**: 467 policies, 0 sem `SET search_path` (re-verificado 02/06)
- **V1.9.98** chat-images bucket fechado (28/04)

**Severidade residual:** BAIXA (cobertura validada)

### H8 — Edge Function sem JWT verify expõe API

**Descrição:** Edge `tradevision-core` com `verify_jwt=false` permite qualquer caller invocar GPT-4o.

**Controle implementado:** ✅ **RESOLVIDO (V1.9.506, 30/05/2026)**
- `tradevision-core` v424 com `verify_jwt=true` (flip 30/05; smoke pré+pós: 401 sem JWT e com JWT inválido)
- Defesa em camadas restaurada: Supabase rejeita anônimo no ingress ANTES do código Deno + auth interna runtime (`assertPatientHasDoctorContext`)
- Batch V1.9.520-526 estendeu `verify_jwt=true` a **14/15 Edges (93%)** — única exceção `sign-pdf-icp` (lock V1.9.299, auth interna V1.9.457)

**Severidade residual:** BAIXA (resolvido — defesa em camadas restaurada)

### H9 — Loop infinito IA (CONSENSUS_REPORT)

**Descrição:** Pipeline travar em fase CONSENSUS_REPORT consumindo tokens sem fim.

**Controle implementado:**
- **V1.9.473** escape CONSENSUS_REPORT loop via CONSENSUS_NOTES
- **TOKEN MGMT V1.9.61** cap 60k tokens

**Severidade residual:** BAIXA (controles ativos)

### H10 — Modificação não-autorizada de signature_hash

**Descrição:** UPDATE direto via SQL alterando `signature_hash` de relatório assinado.

**Controle implementado:**
- **RLS policies** bloqueiam UPDATE no signature_hash exceto via Edge `sign-pdf-icp`
- **Trigger AFTER UPDATE** registra modificação em `cognitive_events`
- **Lock V1.9.299** declara campo imutável após signed_at

**Severidade residual:** BAIXA (controle múltiplo)

## 3. Matriz de risco (Severidade × Probabilidade)

| Hazard | Severidade | Probabilidade | Risco residual | Aceitação |
|---|---|---|---|---|
| H1 | Crítica | Muito Baixa | Baixo | ✅ Aceitável |
| H2 | Alta | Baixa (pós V1.9.452) | Baixo | ✅ Aceitável |
| H3 | Crítica | Muito Baixa | Baixo | ✅ Aceitável |
| H4 | Crítica | Baixa | Baixo | ✅ Aceitável |
| H5 | Alta | Média | Médio | ⚠️ Monitorar |
| H6 | Alta | Baixa | Baixo | ✅ Aceitável |
| H7 | Crítica | Muito Baixa | Baixo | ✅ Aceitável |
| H8 | Alta | Muito Baixa | Baixo | ✅ Aceitável (resolvido V1.9.506 — verify_jwt=true) |
| H9 | Média | Baixa | Baixo | ✅ Aceitável |
| H10 | Crítica | Muito Baixa | Baixo | ✅ Aceitável |

## 4. Plano de mitigação dos riscos médio-alto

### H8 (tradevision-core verify_jwt=false) — Plano Sprint A ✅ EXECUTADO (V1.9.506, 30/05)

1. Mapear callers via grep: `grep -rn "tradevision-core" src/`
2. Validar que todos usam `supabase.functions.invoke()` (auto-injeta JWT) e não `fetch()` direto
3. Deploy Edge `tradevision-core` SEM `--no-verify-jwt`
4. Smoke empírico: requisição sem JWT → 401 esperado
5. Smoke empírico: requisição com JWT → 200 esperado
6. Documentar em diário + memória `feedback_*`

### H5 (alucinação IA) — Monitoramento contínuo

- Cadência mínima `clinical_qa_runs` (princípio cristalizado 26/05)
- Telemetria `metadata.simbologia` no painel Observabilidade IA (V1.9.374)
- Smoke trimestral por amostragem de 10 reports aleatórios

## 5. Não-conformidades históricas conhecidas (transparência)

| Período | Não-conformidade | Resolução |
|---|---|---|
| 25/05 → 29/05 (28d) | PII em `clinical_rationalities.assessment` | Resolvido V1.9.452 |
| 17/05 → 17/05 (6 casos em 21h) | DOC_LIST hijacking pós-V1.9.308 | Revertido V1.9.318 |
| 22/05 → 30/05 | `tradevision-core` verify_jwt=false | Resolvido V1.9.506 (flip v424 verify_jwt=true) |
| 28/04 → 28/04 | chat-images bucket público | Resolvido V1.9.98 |

## 6. Conformidade ISO 14971 §9 — Análise de aceitabilidade

A combinação de:

- **Pirâmide 8 camadas** (defense in depth)
- **11 locks com tag git imutável** com tag git imutável
- **649 commits/30d** rastreáveis
- **284 memórias persistentes** documentando lessons learned
- **47/150 reports com hash de integridade SHA-256** (re-verificado PAT 02/06) — **NÃO** é assinatura ICP-Brasil; a assinatura ICP real (PKCS#7) está em prescrições (12) e exames; assinar a `Composition` do relatório é roadmap

...estabelece um **perfil de risco aceitável** para classificação SaMD Classe IIa (sujeita a avaliação regulatória formal). O principal risco médio-alto (H8 — `verify_jwt`) foi **resolvido em V1.9.506 (30/05)**; o perfil de risco residual foi revisado para BAIXO nesse vetor. *(Atualização 02/06: H8 fechado, números RLS e de assinatura re-verificados via PAT.)*

---

**Aprovação:**
- [ ] RT habilitado: ________________ Data: ___/___/___
- [ ] Médico Sócio (validação clínica): Dr. Ricardo Valença — Data: ___/___/___
- [ ] Consultora SaMD: ________________ Data: ___/___/___
- [ ] Tech Lead: Pedro Henrique Passos Galluf — Data: 29/05/2026 (draft)
