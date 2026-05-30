---
name: racionalidades-pipeline-gera-1-medico-aciona-4-28-05
description: "Baseline empírico validado 28/05 via PAT (10 reports últimos 14 dias): pipeline tradevision-core stage RATIONALITY gera AUTOMATICAMENTE apenas 1 racionalidade (integrative, generated_by=noa_ai) quando AEC fecha. As outras 4 (biomedical/homeopathic/traditionalChinese/ayurvedic) são geradas SOB DEMANDA pelo médico via UI quando abre o relatório (service rationalityAnalysisService.saveAnalysisToReport). 9/10 reports têm só 1 (integrative); 1/10 (fa003f50 de 15/05) tem 3 (biomedical+homeopathic+tcm) — médico acionou análise pós-pipeline. NÃO É BUG. Implicações: backlog audit não deve interpretar 'só 1 racionalidade' como falha do pipeline. UI 'Aplicar análise' do médico é o trigger pra popular as outras. Comunicação externa NÃO deve dizer 'sistema gera 5 racionalidades automáticas' — sintaxe correta é 'gera 1 baseline + 4 sob demanda médica'."
metadata: 
  node_type: memory
  type: feedback
  originSessionId: 00be2b9f-5dbc-4236-a02e-1459c3f57bd2
---

# 🧠 Racionalidades: pipeline gera 1 (integrative), médico aciona 4 — baseline empírico 28/05

## Regra (validada empíricamente)

Quando AEC fecha → pipeline `tradevision-core` stage RATIONALITY gera AUTOMATICAMENTE **1 racionalidade tipo `integrative`** (com `generated_by=noa_ai`). As outras 4 tipos (`biomedical`, `homeopathic`, `traditionalChinese`/`tcm`, `ayurvedic`) **NÃO são geradas pelo pipeline** — são populadas SOB DEMANDA pelo médico via UI no terminal de atendimento.

Caminho técnico das 4 sob demanda: service `rationalityAnalysisService.saveAnalysisToReport` (linha 539, ver CLAUDE.md) — escreve nos 2 lugares (jsonb UPDATE + tabela UPSERT).

**Why**: validado empíricamente 28/05 via PAT em 10 reports assinados últimos 14 dias:
- 9/10 têm exatamente **1 racionalidade** (`integrative`, `generated_by=noa_ai`)
- 1/10 (`fa003f50` de 15/05) tem 3 racionalidades (`biomedical, homeopathic, traditional_chinese`) — único caso onde médico acionou análise pós-pipeline naquela janela de 14 dias

**How to apply**:
- ❌ NÃO interpretar "só 1 racionalidade no report novo" como bug do pipeline ou pipeline degradado
- ❌ NÃO comunicar externamente "Nôa gera 5 racionalidades automaticamente" (anti-overclaim Babylon/Watson)
- ✅ Frase honesta pra material institucional: "Nôa gera 1 racionalidade integrativa automática; médico aciona análises adicionais (biomedical/homeopática/MTC/ayurvédica) sob demanda no terminal"
- ✅ Antes de auditar "qualidade do pipeline RATIONALITY": comparar contra baseline 1/report, não 5/report
- ✅ Pra V1.9.330-FULL Audience Contract: distinguir UX paciente (vê só integrative no jsonb se médico não acionou as outras) vs UX médico (terminal mostra botão "Gerar análise X")

## Implicações pro backlog reconfirmadas

🟡 **Dual-write contract pendente** ([[feedback_dual_write_contract_jsonb_vs_tabela_18_05]]):
- Pipeline escreve em `clinical_rationalities` (tabela) com 1 row integrative
- MAS NÃO escreve em `clinical_reports.content.rationalities` (jsonb fica null)
- UI paciente lê do jsonb → vai mostrar zero racionalidade no app mesmo com 1 na tabela
- Service `rationalityAnalysisService.saveAnalysisToReport` (caminho médico via UI) é o ÚNICO que escreve nos 2 lugares

→ Empíricamente em 9/10 reports: tabela populada, jsonb null. Paciente vê racionalidade ZERO até médico acionar UI.

## Trigger pra desparquear "geração automática das 5"

Não desparquear especulativamente. Triggers válidos:
1. **Médico real pedir empíricamente** "queria que as 5 análises viessem prontas, não tenho tempo de acionar uma por uma"
2. **Marco 2 paciente externo pagante** estressar fluxo (paciente abre app, vê 1 racionalidade só)
3. **V1.9.330-FULL Audience Contract** redesenhar separação paciente vs médico — talvez seja desejável manter "médico aciona" pra controle clínico

Anti-cristalização-prematura aplicado.

## Baseline empírico exato (PAT 28/05)

```sql
SELECT cr.id, cr.signed_at, COUNT(crat.id) AS n, 
       string_agg(crat.rationality_type, ',' ORDER BY rationality_type) AS types
FROM clinical_reports cr 
LEFT JOIN clinical_rationalities crat ON crat.report_id = cr.id
WHERE cr.signed_at IS NOT NULL
GROUP BY cr.id, cr.signed_at
ORDER BY cr.signed_at DESC LIMIT 10;
```

| Report | signed_at | n | types |
|---|---|---|---|
| ef7b33d9 | 2026-05-28 | 1 | integrative |
| 2bdb57fb | 2026-05-27 | 1 | integrative |
| ece4ef44 | 2026-05-25 | 1 | integrative |
| 46b626a5 | 2026-05-24 | 1 | integrative |
| 6e8e9fc5 | 2026-05-23 | 1 | integrative |
| bd8ab977 | 2026-05-22 | 1 | integrative |
| 18909d46 | 2026-05-22 | 1 | integrative |
| 71ad1aee | 2026-05-19 | 1 | integrative |
| **fa003f50** | **2026-05-15** | **3** | **biomedical, homeopathic, traditional_chinese** |
| d0cdb759 | 2026-05-14 | 1 | integrative |

→ 9/10 = baseline 1 (integrative). 1/10 = médico acionou análise.

## Conexões

- [[feedback_dual_write_contract_jsonb_vs_tabela_18_05]] — contrato implícito jsonb vs tabela
- [[project_v1_9_330_audience_contract_design_18_05]] — Audience Contract que vai redesenhar quem vê o quê
- [[feedback_anti_overclaim]] — não dizer "5 racionalidades automáticas" em pitch
- [[feedback_pacientes_reais_vs_testes_clinical_rationalities_27_05]] — pacientes reais validados (Maria Pinto Pitoco tem 3 rationalities — médico acionou)

## Frase âncora

> *"Pipeline gera 1 racionalidade automática (integrative). Médico aciona as outras 4 sob demanda. 9/10 reports últimos 14 dias confirmam baseline. Não é bug — é divisão de trabalho IA-médico desenhada. Comunicar externamente: 'baseline automático + análises sob demanda médica', NÃO '5 automáticas'."*
