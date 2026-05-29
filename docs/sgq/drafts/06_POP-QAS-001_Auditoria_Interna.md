# POP-QAS-001 — Auditoria Interna do SGQ

**Versão draft:** 0.1 (29/05/2026)
**Status:** DRAFT pré-consultora SaMD
**Referência normativa:** ISO 13485:2016 §8.2.2

---

## 1. Objetivo

Estabelecer o processo formal de auditoria interna do SGQ MedCannLab, garantindo verificação periódica e independente de:

- Conformidade com SGQ documentado
- Eficácia dos controles implementados
- Identificação de não-conformidades e oportunidades de melhoria
- Aderência aos princípios constitucionais (anti-kevlar §1, REGRA HARD §1)

## 2. Framework PMF Audit (V1.9.85 — Memo 28/04/2026)

A tabela `clinical_qa_runs` é o **instrumento primário de auditoria** já implementado, com 17 colunas estruturadas:

```
id, run_at, system_version, verdict, verdict_score,
log_findings, db_findings, code_findings,
green_facts, yellow_hypotheses, orange_interpretations, red_blindspots,
notes, metadata, created_at, updated_at, run_by
```

### 2.1. Classificação semântica obrigatória (cristalizada em CLAUDE.md)

```
🟢 GREEN_FACTS         Fatos validados empiricamente (PAT smoke + log + código)
🟡 YELLOW_HYPOTHESES   Hipóteses razoáveis mas não validadas (inferência)
🟠 ORANGE_INTERPRETS   Interpretações narrativas (alta variância semântica)
🔴 RED_BLINDSPOTS      Pontos cegos conhecidos (o que NÃO foi possível verificar)
```

Princípio cristalizado (memória `feedback_separar_fontes_e_calibrar`): **NÃO misturar Supabase atual + código antigo + narrativa**. Separar fontes e calibrar com cores antes de qualquer conclusão.

## 3. Cadência mínima de auditoria

### 3.1. Cadência cristalizada (memória `feedback_clinical_qa_runs_cadencia_minima_26_05`)

1. **1 QA run por nova versão V1.9.X** que tocar código clínico (AEC FSM / Pipeline / Verbatim / signature / RAG)
2. **1 QA run quinzenal** num report aleatório (rotação Claude/Pedro/Ricardo)
3. **1 QA run OBRIGATÓRIA pré-Marco 2** em report do 1º paciente externo pagante

### 3.2. Custo estimado

~1h Claude + ~30min review humano = ~1h30min por run.
Cadência mínima ~2/mês ≈ **3h/mês overhead**.

### 3.3. Risco de NÃO fazer

Chegada Marco 2 sem baseline empírico de validação clínica = recurso fica indemonstrável para investidor / regulador / 2º médico independente.

Frase âncora Memo 28/04: *"Crítico instrumentar AGORA. Quando paciente externo entrar, baseline já existe pra comparação."*

## 4. Métodos de auditoria

### 4.1. Auditoria de Edge Functions

```bash
# Listar todas as Edges + versão + verify_jwt
curl -s "https://api.supabase.com/v1/projects/itdjkfubfzmvmuxxjoae/functions" \
  -H "Authorization: Bearer <PAT>"

# Verificar lock V1.9.299 PBAD ICP-Brasil intacto
diff <(grep -A10 "PA_AD_RB_V24_OID" supabase/functions/sign-pdf-icp/index.ts) \
     <(git show v1.9.299-pbad-conforme-locked:supabase/functions/sign-pdf-icp/index.ts | grep -A10 "PA_AD_RB_V24_OID")
```

### 4.2. Auditoria de schema do banco

```sql
-- Cobertura RLS (esperado: 100%)
SELECT COUNT(*) AS tabelas_com_rls, 
       COUNT(*) FILTER (WHERE rls_enabled) AS rls_on
FROM (SELECT t.tablename, c.relrowsecurity AS rls_enabled
      FROM pg_tables t JOIN pg_class c ON c.relname = t.tablename
      WHERE t.schemaname = 'public') x;

-- Triggers críticos ativos
SELECT tgname, tgrelid::regclass AS tabela
FROM pg_trigger WHERE NOT tgisinternal
  AND tgrelid::regclass::text IN ('aec_assessment_state', 'clinical_reports', 'clinical_rationalities')
ORDER BY tabela, tgname;

-- Cron jobs ativos
SELECT jobname, schedule, command FROM cron.job ORDER BY jobname;
```

### 4.3. Auditoria de cobertura de testes empíricos

```sql
-- Telemetria custo IA últimos 7d
SELECT 
  metadata->>'simbologia' AS feature,
  COUNT(*) AS turns,
  ROUND(SUM(COALESCE((metadata->>'cost_usd_estimate')::numeric, 0)), 4) AS custo_usd_7d
FROM ai_chat_interactions
WHERE created_at > now() - interval '7 days'
GROUP BY 1 ORDER BY 3 DESC NULLS LAST;
```

### 4.4. Auditoria de aderência ao princípio "polir, não inventar"

Verificar que mudanças recentes reusam mecanismos existentes em vez de criar paralelos:

```bash
# Buscar duplicatas semânticas (anti-padrão)
grep -rn "pseudonymize\|sanitize.*PII\|test_run" src/lib/ | sort -u
```

## 5. Não-conformidades catalogadas (último mês)

### 5.1. Resolvidas

| Data | NC | Resolução | Versão |
|---|---|---|---|
| 28/04 | chat-images bucket público | RLS Opção B | V1.9.98 |
| 16/05 | DOC_LIST hijacking pós-V1.9.308 | Reverter para `base_conhecimento` | V1.9.318 |
| 25/05 | PII em `clinical_rationalities.assessment` | Sanitize + backfill 132 rows | V1.9.452 |
| 26/05 | Edge `sign-pdf-icp` sem auth check | Auth + ownership check | V1.9.457 |
| 29/05 | Coluna `clinical_reports.assessment` inexistente | Hotfix EvolutionDetailModal | V1.9.500-A |

### 5.2. Pendentes (transparência)

| Data flag | NC | Plano | Severidade |
|---|---|---|---|
| 29/05 | `tradevision-core` verify_jwt=false | Sprint A (validar callers) | MÉDIA-ALTA |
| 18/05 | Google Calendar tabelas vazias | Decisão pós-Marco 3 | BAIXA (dormindo) |
| 22/05 | WiseCare V4H homolog | Migrar pra produção | MÉDIA |
| Contínuo | Region us-east-1 (não BR) | sa-east-1 pós-LGPD pressure | BAIXA |

## 6. Pontos cegos conhecidos (RED_BLINDSPOTS)

Reconhecidos explicitamente (princípio cristalizado `feedback_claude_audit_diferenciar_validacao_de_descoberta_26_05`):

1. **Validação clínica externa = ZERO** — apenas Maria Pinto Pitoco como paciente real confirmado (memória `feedback_pacientes_reais_vs_testes_clinical_rationalities_27_05`)
2. **Carga real de produção = não testada** — capacidade máxima desconhecida
3. **Comportamento sob concorrência** — não há teste de stress
4. **Edge cases de RLS** — 447 policies, cobertura empírica pontual
5. **Aderência regulatória formal** — sem audit de auditor externo

## 7. Auditoria por consultoria externa (pós-CNPJ)

Após Marco 1 (CNPJ ativo + consultora contratada):

### 7.1. Auditoria de conformidade ISO 13485

Consultora deve verificar conformidade com:

- §4.2 Documentação (POP-CTL-001)
- §7.3 Projeto e desenvolvimento (POP-PRJ-002 + PLN-IEC-001)
- §7.5 Produção e provisão (Edge Functions deploy + RLS)
- §8.2 Monitoramento e medição (POP-QAS-001 atual + telemetria existente)
- §8.5 Melhoria contínua (PROC-CAPA-001)

### 7.2. Auditoria de gestão de risco ISO 14971

Consultora deve verificar conformidade com:

- §4 Análise de risco geral (RSK-001)
- §5 Avaliação de risco
- §6 Controle de risco
- §7 Avaliação de aceitabilidade de risco residual
- §9 Relatório de gestão de risco

## 8. Métricas de eficácia da auditoria

| Métrica | Atual | Meta pós-Marco 2 |
|---|---:|---:|
| `clinical_qa_runs` total | 2 | 12+ |
| Cobertura por versão V1.9.X tocando clínico | ~5% | 100% |
| NCs identificadas e resolvidas | 5 | Manter |
| NCs com plano de fix mas pendentes | 4 | <5 |
| Tempo médio detecção → fix | <48h (V1.9.452 levou 28d, anomalia) | <24h |

---

**Aprovação:**
- [ ] RT habilitado: ________________ Data: ___/___/___
- [ ] Consultora SaMD: ________________ Data: ___/___/___
- [ ] Tech Lead: Pedro Henrique Passos Galluf — Data: 29/05/2026 (draft)
