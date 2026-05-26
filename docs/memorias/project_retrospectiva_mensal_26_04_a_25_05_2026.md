---
name: Retrospectiva mensal 26/04 → 25/05/2026 (snapshot consolidado V3)
description: Snapshot ponteiro pra retrospectiva mensal V3 (2338 linhas) localizada em RETROSPECTIVA_MENSAL_2026_04_26_a_2026_05_25.md na raiz do projeto. Cobre 30 dias de execução cirúrgica com cristalização meta-arquitetural Constituição MedCannLab
type: project
originSessionId: 4a984140-7091-42ce-a9d3-75298afef276
---
# Retrospectiva Mensal 26/04 → 25/05/2026 — Snapshot Ponteiro

**Arquivo**: `RETROSPECTIVA_MENSAL_2026_04_26_a_2026_05_25.md` na raiz do projeto (2338 linhas, V3 deepening empírico).

## Estado de entrada → saída do mês

- **Reports**: 75 → 143 (+91%)
- **Pacientes cadastrados**: 16 → 34 (+113%)
- **Rationalities**: 56 → 130 (+132%)
- **ai_chat_interactions no mês**: 2.446 (~81/dia)
- **Reports SIGNED ICP REAL no mês**: 40 (PBAD AD-RB CONFORME ITI deployado 16/05)
- **Commits cirúrgicos**: ~90
- **Memórias novas**: ~94 (de ~150 → 244)
- **Diários**: 26 (cobertura ~87%)
- **Princípios meta cristalizados**: 30+

## Tese central do mês

**Constituição MedCannLab = 2 vertentes da mesma matriz epistemológica Ricardo** (`feedback_duas_vertentes_uma_matriz_epistemologica_constituicao_medcannlab_25_05`).

4 eixos comuns: Escuta > Interpretação · Fidelidade > Completude · Honestidade > Utilidade percebida · Estrutura > Síntese.

## 10 bugs críticos do mês (top severidade)

1. Matrix ALUCINOU 6 dados clínicos (25/05) — `feedback_locks_macro_vs_micro_matrix_alucinacao_completiva_25_05`
2. ReferenceError V1.9.443-B em produção (24/05) — `feedback_smoke_aec_completa_obrigatoria_pos_clinicalassessmentflow_mudanca_24_05`
3. Count pacientes Ricardo 15/48/34 (24/05) — `feedback_count_pacientes_v1_9_449_e_gaps_function_calling_v1_9_450_25_05`
4. LGPD vazamento nome forum_posts (21/05) — `feedback_pseudonimizacao_conteudo_forum_21_05` + V1.9.437
5. ConsentGuard loop infinito (22/05) — V1.9.420
6. PostgREST max-rows 1000 silencioso (22/05) — `feedback_postgrest_max_rows_1000_silencioso_22_05`
7. RAG truncation endêmico (17/05)
8. Grounded Response Mode ausente (17/05) — resolvido empíricamente V1.9.388+V1.9.453
9. AEC restart regex landmine "agora" (V1.9.77)
10. Carolina loop GPT-first (13/05) — V1.9.300+

## Os 4 momentos pivotais

1. **23/05 ~10h11 BRT — Ricardo cristaliza**: *"Quem não cruza com PAT cria dívida pra quem vai cruzar depois."* → `feedback_doc_institucional_sem_pat_nao_e_valido_23_05` (aplicado dezenas de vezes no mês)

2. **24/05 manhã — Pedro recalibra Claude 3×**: AEC é repelente natural, chat livre já existe (89.8% uso!), frustração = triagem funcionando → `feedback_aec_como_repelente_natural_de_demanda_fora_escopo_24_05`

3. **24/05 madrugada+manhã — 2 textos Ricardo pivotais** pra Constituição:
   - Queixa ≠ Sintoma (abertura fenomenológica)
   - Framework AEC centrípeto vs anamnese centrífuga

4. **25/05 ~14h — Matrix ALUCINOU 6 dados clínicos** (mãe câncer, pai diabetes, etc — TODOS inventados). Solução dual: V1.9.450-B reduz pressão + V1.9.453+A+B reduz permissão.

## 25+ Locks selados/consolidados no mês

Destaques: **V1.9.121** (AEC promotion), **V1.9.299** (PBAD ITI — proteção técnica em `feedback_lock_v1_9_299_pbad_protege_modificacao_pos_assinatura_25_05`), **V1.9.330-A** (Audience Contract), **V1.9.388** (Matrix Z2), **V1.9.443+A+B** (PATIENT_FREE_CHAT_GUARDRAILS), **V1.9.450+450-B** (corpus pseudonimizado), **V1.9.453+A+B** (anti-alucinação 3 cenários + negação).

## Pendências P0 (bloqueiam Marco 2)

1. **CNPJ João Vidal** (Marco 1) — destrava ~50% do roadmap
2. **WhatsApp Faveret + Manual v1.1** — sócio-médico abandonou 19 dias (`feedback_curva_aprendizado_alta_mesmo_para_socios_24_05`)
3. **2º médico independente real** (Marco 2)
4. **20-30 pacientes externos pagantes** (Marco 2 declarável)
5. **V1.9.451** function calling (`lookup_patient_status` + `get_appointments_summary`)
6. **V1.9.452** sanitize `assessment_excerpt` LGPD reforço
7. **V1.9.455** QR Code embedded no PDF (`project_v1_9_455_qr_code_embedded_pdf_design_25_05`)

## Princípios meta cristalizados — taxonomia

### Epistemológicos (núcleo Ricardo)
- `feedback_queixa_nao_e_sintoma_aec_e_abertura_fenomenologica_24_05` ⭐ Vertente clínica
- `feedback_locks_macro_vs_micro_matrix_alucinacao_completiva_25_05` ⭐ Vertente pesquisa
- `feedback_duas_vertentes_uma_matriz_epistemologica_constituicao_medcannlab_25_05` ⭐⭐ META

### Processo (operacional)
- `feedback_doc_institucional_sem_pat_nao_e_valido_23_05` ⭐ (PAT cruzar)
- `feedback_diario_que_mostra_erros_vale_mais_que_diario_polido_24_05`
- `feedback_mapear_universo_vetores_antes_de_codar_guardrail_24_05`
- `feedback_smoke_aec_completa_obrigatoria_pos_clinicalassessmentflow_mudanca_24_05` ⭐
- `feedback_anti_overclaim_endorsements`
- `feedback_polir_nao_inventar` (Princípio 8)
- `feedback_push_dual_remote` (4 refs)
- `feedback_coerencia_e_alinhamento_qualquer_fix_17_05` (filtro 6 perguntas)

### Arquiteturais
- `feedback_rag_molda_comportamento_cognitivo_20_05` (V1.9.308→318)
- `feedback_aec_como_repelente_natural_de_demanda_fora_escopo_24_05` ⭐
- `feedback_matrix_prolonga_vs_casos_similares_infere_20_05`
- `feedback_engenharia_perfeita_pode_produzir_semanticamente_inadequado_24_05`
- `feedback_dual_write_contract_jsonb_vs_tabela_18_05`
- `feedback_toggle_ui_e_contrato_100_pct_ou_nada_22_05`

### Anti-overclaim
- `feedback_material_b_pode_contradizer_constituicao_22_05`
- `feedback_matrix_z2_contida_e_feature_nao_bug_e_gpt_externo_pode_sugerir_anti_constituicao_25_05`

### Operacionais externos
- `feedback_paciente_externo_real_estressa_arquitetura_25_05` ⭐ (caso João Guimarães)
- `feedback_lock_v1_9_299_pbad_protege_modificacao_pos_assinatura_25_05`

## Como usar este snapshot

Próxima sessão Claude (qualquer máquina) que precisar absorver o mês deve:
1. Ler `MEMORY.md` (índice nível 1)
2. Ler **este snapshot** (visão geral 30 dias)
3. Ler **`RETROSPECTIVA_MENSAL_2026_04_26_a_2026_05_25.md`** se precisar de detalhes empíricos (PAT empírico granular, distribuições, anatomia bugs, 4 sugestões anti-Constituição REJEITADAS, anexo genealogia)
4. Ler diários 22-25/05 se vai mexer em Matrix/PBAD/AEC FSM
5. Ler CLAUDE.md (instruções projeto)

## Cristalizado

Diário 25/05 BLOCO R (22h+). Snapshot consolidador do mês — referência primária pra context-continuity.
