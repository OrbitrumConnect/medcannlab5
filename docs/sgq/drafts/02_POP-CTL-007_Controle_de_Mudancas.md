# POP-CTL-007 — Procedimento Operacional Padrão: Controle de Mudanças em Software Médico

**Versão draft:** 0.1 (29/05/2026)
**Status:** DRAFT pré-consultora SaMD
**Referência normativa:** ISO 13485:2016 §7.3.7 + IEC 62304:2006 §6.2

---

## 1. Objetivo

Definir o processo formal de identificação, análise, implementação, verificação e documentação de **mudanças** em qualquer camada do software MedCannLab classificado como SaMD Classe IIa.

## 2. Princípio constitucional anti-kevlar §1

> *"Mudanças que afetam Constituição/RACI/contratos clínicos exigem nova versão do Livro Magno — não mudar diretamente no código."*

Esse princípio (cristalizado em memória `project_regra_consentimento_nao_e_agendamento`) garante que **mudanças arquiteturais críticas** seguem rito formal com consenso entre Tech Lead + Médico Sócio + (futuro) RT habilitado.

## 3. Categorias de mudança (4 níveis)

### Nível 1 — Mudança trivial (não-clínica, não-arquitetural)
- Polish visual, correção de typo, ajuste de copy
- Exemplos: V1.9.499 (background Literatura), V1.9.501 (KPIs Prescrição), V1.9.501 (mocks dashboard removidos)
- **Rito:** commit direto + push 4 refs

### Nível 2 — Mudança funcional não-clínica
- Novo componente UI, nova query analítica, refactor não-arquitetural
- Exemplos: V1.9.495-497 (Sprint E — Notícias / Avaliações / Mentoria), V1.9.500 (InterruptedAECsCard)
- **Rito:** commit + diário + memória (se padrão reusável)

### Nível 3 — Mudança clínico-cognitiva
- Toca AEC FSM, Pipeline, Verbatim, Signature, Gate, Matrix Z2
- Exemplos: V1.9.452 (PII sanitize racionalidades), V1.9.487-494 (Matrix Camadas 1.X)
- **Rito:** commit + diário + smoke empírico documentado (PAT validation) + memória cristalizada + atualização CLAUDE.md
- **Bloqueador:** smoke PASS empírico antes de push 4 refs

### Nível 4 — Mudança constitucional (Livro Magno)
- Altera Constituição, RACI, contratos clínicos, anti-kevlar §1
- Exemplos: V1.9.95 (lock AEC+Relatório+Agendamento), V1.9.388-A.3 (ancoragem regulatória multi-camada)
- **Rito:** nova versão do Livro Magno + selo formal + tag git imutável + memória Nível 1
- **Bloqueador:** consenso entre Tech Lead + Médico Sócio (Ricardo Valença) registrado em diário

## 4. Fluxo padrão (Nível 3 — exemplo concreto V1.9.452 PII sanitize)

| Passo | Evidência empírica |
|---|---|
| 1. Identificação | Backlog conhecido 28d em memória `project_v1_9_452_pii_sanitize_*` |
| 2. Análise risco | Vazamento PII em 4/5 rows recentes (audit PAT 26/05) |
| 3. Design | Helper `sanitizeRationalityPII` polish de `casePseudonymization.ts` V1.9.407 |
| 4. Implementação | Edge `tradevision-core` v423 patches linhas 1723+2287 |
| 5. Backfill histórico | 132 rows via PL/pgSQL replicando lógica JS |
| 6. Verificação | Smoke "Pedro Paciente" → bug detectado → fix v2 exclude list |
| 7. Documentação | Diário 29/05 Bloco K + memória `project_v1_9_452_*` Nível 1 |
| 8. Selagem | Lock V1.9.452 tag imutável + atualização CLAUDE.md |

## 5. Análise de risco obrigatória (toda mudança Nível 3+)

Toda mudança Nível 3 ou superior deve **explicitamente** responder:

1. **Toca o Lock V1.9.299 PBAD ICP-Brasil?** Se sim → smoke ITI obrigatório (openssl asn1parse + validar.iti.gov.br + diff binário vs PDF aprovado)
2. **Toca AEC FSM ou Pipeline?** → smoke cobrindo regressão pirâmide 8 camadas
3. **Pode disparar cascata DB?** → mapear triggers ON INSERT/UPDATE via `pg_trigger`
4. **Afeta Edge Functions auth?** → validar verify_jwt + callers
5. **Toca PII ou LGPD?** → validar sanitização preventiva + backfill se histórico
6. **Risco de regressão clínica?** → smoke empírico com paciente real (Carolina / Maria Pinto Pitoco)

## 6. Rastreabilidade técnica (IEC 62304 §5.1.3)

Toda mudança gera rastreabilidade através de:

- **Commit SHA** (git log)
- **Tag git** (se Nível 3+)
- **Diário DIARIO_*.md** (Bloco dedicado)
- **Memória persistente** (se princípio reusável)
- **Telemetria** (`ai_chat_interactions.metadata`, `cognitive_events`)
- **Smoke PAT** validation antes/depois (registro empírico)

## 7. Evidências empíricas para auditor

```bash
# Histórico de mudanças com versões
git log --oneline --grep="V1.9" | head -50

# Locks selados (tags imutáveis)
git tag --list "v1.9*" | sort -V

# Verificar conformidade com pirâmide
grep -rn "pirâmide 8 camadas" CLAUDE.md

# Mudanças clínicas críticas (Nível 3+)
grep -rn "AEC\|Pipeline\|Verbatim\|Signature" DIARIO_*.md | wc -l
```

## 8. Exceções (mudanças emergenciais)

Em incidente de segurança ou regressão crítica em produção:

1. Hotfix imediato sem rito completo permitido **SOMENTE** se Tech Lead + Médico Sócio (se disponível) concordarem em registro síncrono (WhatsApp + screenshot)
2. Documentação formal obrigatória em até **24h** após fix
3. Diário retroativo + memória Nível 1 cristalizada
4. Post-mortem em diário do dia seguinte

**Exemplo aplicado:** V1.9.500-A hotfix EvolutionDetailModal (29/05 12:28 BRT) — coluna `clinical_reports.assessment` inexistente flagrada empíricamente; corrigido em <30min; commit `252cd36` push 4 refs OK.

## 9. Métricas de controle (último mês)

| Métrica | Valor empírico |
|---|---:|
| Commits totais 30d | 649 |
| Versões V1.9.X 30d | ~120 |
| Locks selados (vida útil sistema) | 8 |
| Hotfixes emergenciais | 1 (V1.9.500-A) |
| Diários produzidos | 28+ |
| Memórias cristalizadas | 284 |

---

**Aprovação:**
- [ ] RT habilitado: ________________ Data: ___/___/___
- [ ] Consultora SaMD: ________________ Data: ___/___/___
- [ ] Tech Lead: Pedro Henrique Passos Galluf — Data: 29/05/2026 (draft)
