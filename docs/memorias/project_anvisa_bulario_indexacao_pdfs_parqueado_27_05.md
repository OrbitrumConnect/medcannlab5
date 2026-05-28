---
name: anvisa-bulario-indexacao-pdfs-parqueado-27-05
description: "ANVISA Bulário Eletrônico NÃO tem API REST pública (403 Cloudflare empíricamente validado 27/05). Pipeline parqueado: download PDFs ANVISA → OCR via Edge `extract-document-text` v59 (REUSO 100% infra V1.9.307 sidecar renal) → tabela `bulario_index` → service `anvisaService.ts` (consulta local) → UI Aba Literatura source \"💊 Bulário ANVISA\". 3 tiers scope (MVP 100 / Pleno 1k / Completo 30k). 3 triggers explícitos pra desparquear."
metadata: 
  node_type: memory
  type: project
  originSessionId: 00be2b9f-5dbc-4236-a02e-1459c3f57bd2
---

# 💊 ANVISA Bulário — indexação PDFs PARQUEADO (27/05 madrugada)

## Contexto empírico

Sessão 27/05 madrugada — Pedro perguntou se daria pra adicionar bulas ANVISA na aba Literatura. Validação empírica:

```bash
$ curl -I https://consultas.anvisa.gov.br/api/consulta/bulario
→ HTTP/1.1 403 Forbidden (Cloudflare _cfuvid cookie protection)
```

ANVISA Bulário Eletrônico **NÃO tem API REST pública moderna**. Confirmado também por Pedro empíricamente: *"Tem PDFs das bulas / Não possui API pública oficial moderna / Dá para fazer: scraping, indexação de PDFs, ou consumir endpoints internos (instáveis)"*.

Diferentes do PubMed (V1.9.369-A) e OpenFDA (V1.9.464 codado 27/05) que têm APIs REST grátis CORS-friendly.

## Pipeline arquitetural proposto (REUSA 100% infra existente)

```
┌─────────────────────────────────────────────────────────────┐
│ 1. Edge function `anvisa-bulario-crawler` (NOVA, cron mensal)│
│    - Cron: 0 3 5 * * (dia 5 do mês às 3h BRT)                │
│    - Lista bulas atualizadas no portal ANVISA                │
│    - Download PDFs novos/atualizados pro Storage             │
│    - Usa puppeteer-core OR Playwright + Cloudflare bypass    │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ 2. Storage bucket `bulario_pdfs` (SEPARADO de `documents`)   │
│    - public:false (RLS profissional-only)                    │
│    - file_size_limit: 10MB (bulas PDFs grandes)              │
│    - allowed_mime_types: application/pdf                     │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ 3. Edge `extract-document-text` v59 (JÁ EXISTE — REUSO 100%) │
│    - Trigger SQL ou hook pós-upload                          │
│    - OCR via pdfjs-serverless                                │
│    - Pattern V1.9.307 sidecar renal validado empíricamente   │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ 4. Edge `anvisa-bulario-parser` (NOVA)                       │
│    - GPT-4o-mini extraction (prompt restrito):               │
│      "Extraia SOMENTE: medicamento, composicao, posologia,   │
│       indicacoes, contraindicacoes, efeitos_colaterais,      │
│       laboratorio, principio_ativo, mecanismo. NUNCA infira  │
│       recomendacao terapeutica."                             │
│    - Output JSON estruturado                                 │
│    - INSERT em `bulario_index`                               │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ 5. Tabela `bulario_index` (NOVA — schema sugerido)           │
│    - id, anvisa_id (PK natural), nome, principio_ativo,      │
│      composicao, posologia, indicacoes, contraindicacoes,    │
│      efeitos_colaterais (jsonb), laboratorio,                │
│      pdf_storage_path, last_updated, source_url,             │
│      created_at, updated_at                                  │
│    - RLS: SELECT profissional/admin only                     │
│    - Index full-text portuguese em nome + principio_ativo    │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ 6. Service `anvisaService.ts` (NOVO — replica pubmedService) │
│    - searchAnvisa(term, filters) → consulta TABELA LOCAL     │
│    - Não chama API ANVISA externa (zero dependência)         │
│    - Mesmo SearchResult interface                            │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ 7. UI Aba Literatura (V1.9.464+ extensão)                    │
│    - Source dropdown: PubMed / OpenFDA / "💊 Bulário ANVISA" │
│    - Linguagem "Resultados encontrados na ANVISA"            │
│    - Mostra PDF original ANVISA com link                     │
│    - Disclaimer CFM 2.314 obrigatório                        │
└─────────────────────────────────────────────────────────────┘
```

## 3 Tiers scope (decidir baseado em trigger empírico)

| Tier | Quantidade | Foco | Storage estimado | Custo OCR (one-time) | Trigger |
|---|---|---|---|---|---|
| **MVP** | Top 100 bulas | Cannabis + comorbidades comuns (CBD, THC, dipirona, paracetamol, fluoxetina, sertralina, gabapentina, pregabalina, etc) | ~50 MB | ~$5 USD | Ricardo bater empíricamente |
| **Pleno** | Top 1.000 bulas | 80% prescrições BR | ~500 MB | ~$50 USD | Marco 2 (20-30 pacientes externos pagantes) |
| **Completo** | ~30.000 bulas | Cobertura total ANVISA | ~15 GB | ~$1500 USD | Pós-PMF + Supabase Pro plan |

**Refresh mensal**: cron dia 5 baixa só bulas atualizadas (diff vs last_updated). Custo OCR incremental ~$0.50/mês.

## 3 triggers EXPLÍCITOS pra desparquear

1. **Ricardo bater empíricamente**: *"Preciso ver bula de [medicamento X] aqui no sistema"* — gatilho clínico real
2. **Marco 2**: 1º paciente externo pagante perguntar bula via médico
3. **Eduardo neuro real**: pacientes neuro com 5+ medicamentos cruzados — interação medicamentosa vira pré-condição

## Custo estimado por fase

| Fase | Trabalho | Tempo |
|---|---|---|
| Fase 2a — Edge crawler ANVISA + Cloudflare bypass | Puppeteer + headless browser em Edge function | 4-6h |
| Fase 2b — Bucket + RLS + storage setup | SQL migration + bucket creation + policies | 1h |
| Fase 2c — Edge parser GPT extraction | Replica pattern `renal-signal-extractor` V1.9.307 | 2-3h |
| Fase 2d — Tabela `bulario_index` + index full-text | SQL migration + RLS | 1h |
| Fase 2e — Service `anvisaService.ts` + hook update | Replica pattern V1.9.464 OpenFDA | 1-2h |
| Fase 2f — UI tab + smoke + memory crystallize | Frontend + smoke 5-10 medicamentos reais | 2h |
| **Total Fase 2 MVP (Top 100)** | | **~11-15h** |

Pleno (+900 bulas) adiciona custo OCR + storage mas pipeline mesmo. Completo (29k bulas) precisa Supabase Pro + storage scaling.

## Riscos a vigiar quando ativar

### Risco regulatório
- ✅ Aplicar **`feedback_fronteira_organizar_info_farmacologica_vs_decisao_terapeutica_27_05`** integralmente
- ✅ Linguagem "Resultados encontrados" + ZERO síntese GPT cross-bulas
- ✅ Profissional-only (Terminal Pesquisa, não paciente direto)
- ✅ Disclaimer CFM 2.314 obrigatório em cada resultado
- 🔴 NUNCA gerar sugestão de troca medicamentosa
- 🔴 NUNCA calcular dose pra paciente direto
- 🔴 NUNCA comparar bulas via GPT ("X é melhor que Y")

### Risco técnico
- 🔴 ANVISA muda site → crawler quebra → cron falha silenciosamente
  - Mitigação: alerta Sentry em falhas consecutivas + fallback "última atualização há X dias"
- 🟡 OCR errado popula `bulario_index` com posologia errada → médico vê dado errado
  - Mitigação: validação humana pré-INSERT (workflow Edge → DRAFT → revisão admin → ACTIVE)
- 🟡 Cloudflare aprimora detecção → crawler bloqueado
  - Mitigação: fallback pra dataset open `dados.gov.br/dataset/bulario-eletronico` (validar atualidade)

### Risco semântico
- ⚠️ Linguagem comercial das bulas ANVISA (vs científica PubMed) pode confundir
- ⚠️ Bulas BR têm vocabulário próprio (vs FDA US estruturado)
- ⚠️ Interação paciente/profissional via bula precisa scope-control rigoroso

## Conexões com princípios cristalizados

- `feedback_fronteira_organizar_info_farmacologica_vs_decisao_terapeutica_27_05` (cristalizado mesma sessão) — princípio meta DIRETO
- `feedback_polir_nao_inventar`: REUSO total Edge `extract-document-text` v59 + pattern V1.9.307 sidecar renal
- `feedback_count_pacientes_v1_9_449_e_gaps_function_calling_v1_9_450_25_05`: 3 triggers explícitos anti-especulação
- `feedback_locks_macro_vs_micro_matrix_alucinacao_completiva_25_05`: locks micro-factuais sobre dado farmacológico
- `feedback_viabilidade_tecnica_vs_legitimidade_epistemologica_18_05`: pattern pubmedService já cristalizou ZERO síntese GPT
- `project_pipeline_patient_documents_ocr_lab_results_parqueado_26_05` (parqueado mesma natureza, mesmo trigger pattern)

## Estado pré-execução

- ✅ Edge `extract-document-text` v59 deployada (catálogo CLAUDE.md)
- ✅ Bucket storage pattern validado (V1.9.99-B + V1.9.455)
- ✅ Pattern sidecar renal V1.9.307 validado (1 caso Maria das Dores Pitoco)
- ✅ Pattern Edge + GPT extraction validado (renal-signal-extractor)
- ✅ Pattern service + hook + UI validado (pubmedService V1.9.369-A + openfdaService V1.9.464)
- ❌ Edge `anvisa-bulario-crawler` NÃO existe
- ❌ Bucket `bulario_pdfs` NÃO existe
- ❌ Tabela `bulario_index` NÃO existe
- ❌ Service `anvisaService.ts` NÃO existe

**Tudo parqueado aguardando 1 dos 3 triggers empíricos acima.**

## Frase âncora

> *"ANVISA Bulário é o caso canônico de polir-não-inventar: a infra OCR + extraction já existe (V1.9.307), o pattern service+hook+UI já existe (V1.9.369-A + V1.9.464), o que falta é trigger empírico clínico real. Não codar por completude técnica — codar quando Ricardo/Eduardo/paciente real bater."*

## How to apply (próxima sessão Claude se desparquear)

1. **Ler esta memory ANTES de codar**
2. **Confirmar trigger materializou** empíricamente
3. **Implementar Fase 2a→2f** em ordem (cron crawler primeiro pra ter dados antes UI)
4. **Smoke obrigatório com 5-10 bulas reais** antes de declarar pronto
5. **Aplicar `feedback_fronteira_organizar_info_farmacologica_vs_decisao_terapeutica_27_05`** rigorosamente no UI
6. **NUNCA ativar comparação cross-bulas via GPT** — anti-Constituição
