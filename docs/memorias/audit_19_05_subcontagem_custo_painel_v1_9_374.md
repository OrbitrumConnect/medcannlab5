---
name: Audit empírico 19/05 — subcontagem custo Painel V1.9.374 (9.5% lifetime instrumentado)
description: Audit empírico via PAT resolveu contradição painel V1.9.374 ($4.81 lifetime) vs memórias 17/05 ($55/mês) e 18/05 ($30/mês). Hipótese (a) confirmada: instrumentação V1.9.238+ (13/05) cobre 9.5% interações lifetime. 90.5% pré-V1.9.238 têm cost_usd_estimate NULL. Custo real lifetime via OpenAI billing dashboard, NÃO via banco. Painel mostra apenas subconjunto observado declarado. V1.9.374-A adicionou flag de subcontagem explícita + extrapolação aproximada.
type: project
originSessionId: 6742fef8-9d20-43d8-a8d8-8853df0c89e9
---

# Audit Subcontagem Custo Painel V1.9.374

## Contradição que ativou o audit

| Fonte | Valor | Data |
|---|---|---|
| Memory `reference_custo_ia_instrumentacao_canonica_18_05` | $30/mês (~$2.95/3 dias) | 18/05 |
| Memory `audit_profundo_5_camadas_17_05` | $55/mês | 17/05 |
| Painel V1.9.374 deployado 19/05 | $4.81 lifetime | 19/05 |

Discrepância: 6-11× ordem de magnitude.

Pedro perguntou: "painel é teatro de números?"

## Query empírica que resolveu (PAT 19/05 manhã)

```sql
SELECT COUNT(*) AS total,
       COUNT(*) FILTER (WHERE metadata->>'cost_usd_estimate' IS NOT NULL) AS with_cost,
       COUNT(*) FILTER (WHERE metadata->>'cost_usd_estimate' IS NULL) AS without_cost,
       COUNT(*) FILTER (WHERE created_at >= '2026-05-13') AS post_v238,
       COUNT(*) FILTER (WHERE created_at < '2026-05-13') AS pre_v238
FROM ai_chat_interactions
```

Resultado:
```
total:        3.529
with_cost:      334 (9.5%)
without_cost: 3.195 (90.5%)
post_v238:      334 (100% têm cost)
pre_v238:     3.195 (100% NULL)
```

## Hipótese confirmada

**(a) Painel subconta** — instrumentação V1.9.238 (13/05) só cobre 9.5% das interações lifetime. As 3.195 anteriores são invisíveis no painel.

Hipótese (b) "estimativas anteriores eram overestimates" REJEITADA.

## Reconciliação correta

- **Banco (ai_chat_interactions.metadata.cost_usd_estimate)**: $4.81 das 334 interações instrumentadas
- **OpenAI billing dashboard real**: provavelmente $30-55 lifetime (não validado, mas é única explicação consistente com memórias 17/05 + 18/05)
- **São fontes diferentes** — NÃO comparar 1:1

## Fix aplicado V1.9.374-A

Adicionado bloco CoverageCard no painel:
- Total lifetime / com cost / sem cost / cobertura %
- Custo observado + extrapolação aproximada lifetime
- Declaração honesta: "Para custo real lifetime, consultar billing dashboard OpenAI direto"
- Cita V1.9.238 (13/05) como início da instrumentação

KPI labels mudaram: "Custo lifetime" → "Custo observado lifetime"

## Achados extras das queries (parqueados)

1. **João Vidal está com `type='patient'`** no banco (321 interações). Memórias dizem que ele é sócio institucional — anomalia drift histórico aceito
2. **Dr. Eduardo Faveret = 0 custo logado em 42 interações** — provável pré-V1.9.238 ou cost tracking quebrado pra ele
3. **Inconsistência `type='patient'` (EN) vs `'paciente'` (PT)** — 3 users com PT, 28 com EN
4. **Carolina Campello = 882 interações × $0.18** — benchmark Verbatim First V1.9.86 funcionando (99% bypass GPT)
5. **Pedro = 656 interações × $3.47** (72% do custo logado) — admin testing intenso

## Lição empírica

**Auditar via SQL ANTES de afirmar números**. Eu havia proposto V1.9.376 "cache MEMORY_CACHE multi-bucket pra economizar query Supabase" extrapolando padrão do super_service TradeContinuity, sem auditar se MedCannLab realmente tinha esse gargalo.

Audit empírico mostrou:
- Gargalo NÃO é cache de DB (já existe cache idempotência V1.9.X)
- Gargalo REAL é pipeline AEC pós-consentimento (50s — `project_bug_pipeline_aec_50s_pos_consent_19_05`)
- Cache de DB não resolve 50s do pipeline serial

Princípio aplicado: `feedback_nao_fingir_autoridade_18_05` no nível IA assistente. Auditar antes de afirmar.

## Anti-padrões evitar

- ❌ Mostrar painel custo sem flag de cobertura (gera leitura errada)
- ❌ Comparar valor banco com valor billing OpenAI como se fossem mesma fonte
- ❌ Propor otimização técnica (cache, etc) sem auditar gargalo real primeiro
- ❌ Cunhar "regra T/E" (razão triagem/execução) como princípio MASTER — ironia auto-referente

## Próximos passos parqueados

| Item | Trigger pra retomar |
|---|---|
| Reconciliação com OpenAI billing real | Marco 2 ou pré-pitch investidor |
| Fix encoding broken simbologia (`�`) | Cleanup sessão dedicada |
| Fix cost tracking 🔬 Casos Similares (`audit_back_v1_9_368_bugs_descobertos`) | Quando 2º médico ativar Casos Similares regularmente |

## Frase âncora

> *"Painel mostra $4.81. Realidade OpenAI mostra ~$30-55. Não é contradição — são fontes diferentes. 90.5% lifetime tem cost NULL (pré-V1.9.238). Subcontagem agora declarada explicitamente no painel. Auditar via SQL antes de afirmar números."*

— Cristalizado 19/05/2026 após Pedro me pegar afirmando cache sem evidência empírica.
