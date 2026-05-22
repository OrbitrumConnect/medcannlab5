---
name: Audit pendências ~1 mês pós-PBAD (16/04 → 20/05) — sem CNPJ, sem Ricardo
description: Mapeamento consolidado 20/05 cedo do que está PARQUEADO, ABERTO ou DRIFTING há ~1 mês — explicitamente FILTRANDO bloqueios externos (CNPJ + Ricardo aprovar). Trabalho técnico/operacional possível com Pedro+Claude isolados.
type: audit
originSessionId: 6742fef8-9d20-43d8-a8d8-8853df0c89e9
---
## Escopo deste audit

Pedro 20/05 ~11h50 BRT: *"pegar nesse quase 1 mes juntos aqui no claude oq temos pendentes! que nao seja cnpj ou falar com ricardo kkk por favor!"*

**Filtros aplicados**:
- ❌ Bloqueios externos (CNPJ, Stripe Subscription, termo CDC)
- ❌ Bloqueios humanos (Ricardo aprovar Maria DRC, Eduardo gerar cursos, João Vidal CNPJ)
- ✅ O que Pedro+Claude conseguem fazer hoje sozinhos

**Resultado**: 7 categorias / 22 itens executáveis isolados, ordenados por prioridade.

---

## 🔴 P0 SEGURANÇA/COMPLIANCE (4 itens)

### 1. AEC localStorage há 6+ semanas — 51 AECs in_progress eternas
**Memory**: `feedback_debitos_tecnicos_parecer_fiscal_01_04_pendentes_18_05`
**Status**: anti-kevlar §1 bloqueia fix sem sessão dedicada
**Risco**: 51 pacientes perderam estado AEC, possível regressão LGPD
**Complexidade**: alta (afeta AEC FSM — Camada 2 da pirâmide)
**Trigger ação**: sessão dedicada ≥4h com smoke test cross-feature obrigatório

### 2. 2 views Postgres SECURITY DEFAULT (parecer fiscal P0 parcial)
**Memory**: `feedback_debitos_tecnicos_parecer_fiscal_01_04_pendentes_18_05`
**Status**: parcialmente resolvido, 2 views remanescentes
**Risco**: privilege escalation potencial em queries
**Complexidade**: baixa (migration SQL)
**Trigger ação**: query identificar views afetadas + recriar com SECURITY INVOKER

### 3. esm.sh sem lockfile (supply chain risk)
**Memory**: `feedback_debitos_tecnicos_parecer_fiscal_01_04_pendentes_18_05` (P1 desde 01/04)
**Status**: aberto há 50+ dias
**Risco**: 13 Edge Functions importam de esm.sh sem versionamento → vulnerable a supply chain attack
**Complexidade**: média (precisa migrar imports pra deno.land ou jsr)
**Trigger ação**: audit dependências esm.sh + criar deno.lock por Edge function

### 4. is_professional_patient_link via chat_participants (vazamento lateral)
**Memory**: `feedback_debitos_tecnicos_parecer_fiscal_01_04_pendentes_18_05`
**Status**: aberto desde 01/04
**Risco**: profissional pode acessar pacientes via JOIN chat_participants sem vínculo formal
**Complexidade**: média (refatorar RPC + audit chamadores)
**Trigger ação**: criar `is_professional_patient_link_v2` baseado em `professional_patient_assignments` (tabela formal) + migrar callers

---

## 🟡 P1 DADOS/STORAGE (3 itens)

### 5. 72 files órfãos bucket documents (LGPD compliance)
**Memory**: CLAUDE.md gotchas + audit_v1_9_307_299_311_312_estado_real_pos_deploy_16_05
**Status**: ~67 MB de owners deletados
**Risco**: LGPD direito ao esquecimento incompleto, custo storage residual
**Complexidade**: baixa (query identificar + delete bucket entries)
**Trigger ação**: criar cron de limpeza ou script one-off

### 6. 35 vínculos médico-paciente não-backfilados
**Memory**: `project_anexos_prof_paciente_plano_nao_acabado`
**Status**: design parqueado, vínculos existem em chat_participants mas não em assignments
**Risco**: queries de pacientes vinculados retornam menos do que real
**Complexidade**: média (ETL backfill + validação)
**Trigger ação**: extrair vínculos de chat_participants + inserir em professional_patient_assignments + validar conta

### 7. chat_messages_legacy nome enganoso (15 rows canônica)
**Memory**: CLAUDE.md
**Status**: tabela "legacy" é a canônica em uso, `chat_messages` (vazia) é shell planejada
**Risco**: novo dev confunde, deleta legacy achando que pode
**Complexidade**: baixa (renomear ou documentar)
**Trigger ação**: ADD COMMENT na tabela + atualizar CLAUDE.md gotchas

---

## 🟠 P1 REFATORAÇÃO/DÉBITO ARQUITETURAL (3 itens)

### 8. tradevision-core inchou 3068 → 6690 linhas (PIOROU)
**Memory**: `feedback_debitos_tecnicos_parecer_fiscal_01_04_pendentes_18_05`
**Status**: dobrou desde parecer fiscal 01/04 — refator futura mandatória
**Risco**: harder to maintain, mais bugs latent, deploy mais lento
**Complexidade**: ALTA (precisa quebrar em módulos sem quebrar Locks V1.9.95+V1.9.299)
**Trigger ação**: identificar 5-10 responsabilidades isoladas → extrair pra `_shared/`

### 9. Workflow revisão racionalidades 9.4% adoção (12/127)
**Memory**: `feedback_debitos_tecnicos_parecer_fiscal_01_04_pendentes_18_05`
**Status**: sistema existe e funciona, ninguém usa
**Risco**: feature de governança clínica dormente, parecer fiscal P0 parcial
**Complexidade**: baixa (telemetria + UX hint pra Ricardo)
**Trigger ação**: medir uso real + decidir se UX hint vale ou aceita "infra sem adoção" (memory `feedback_infraestrutura_vs_uso_humano_16_05`)

### 10. Dual-write contract jsonb vs tabela rationalities formalizar
**Memory**: `feedback_dual_write_contract_jsonb_vs_tabela_18_05`
**Status**: divergência controlada mas não documentada formalmente em CLAUDE.md ainda
**Risco**: feature nova mexe em uma fonte sem propagar → drift silencioso
**Complexidade**: baixa (atualizar CLAUDE.md + criar trigger SQL opcional)
**Trigger ação**: já parcialmente em CLAUDE.md, completar checklist 7 perguntas como bloco formal

---

## 🟢 P2 FEATURES PARQUEADAS — Eixo Pesquisa (4 itens)

### 11. F1 Auto-ativação Matrix pós-relatório
**Memory**: `project_visao_final_eixo_pesquisa_19_05`
**Status**: hoje médico clica botão "Nôa Matrix" no PatientFocusView, sem trigger automático
**Complexidade**: baixa (banner/toast condicional pós-`report.status === 'signed'`)
**Trigger ação**: identificar hook signed_at change em PatientFocusView + adicionar toast

### 12. F2 Function calling PubMed/KB no chat Matrix
**Memory**: `project_visao_final_eixo_pesquisa_19_05`
**Status**: hoje busca manual UI, médico clica "+ anexar"
**Complexidade**: média (function calling no Edge gpt-4o + prompt update)
**Trigger ação**: definir functions `search_pubmed` e `search_knowledge_base` no Edge

### 13. F3 Fechar como dossiê (3 saídas: PDF / Fórum / Tese)
**Memory**: `project_visao_final_eixo_pesquisa_19_05`
**Status**: conversa Matrix fica só no chat state (perdida ao fechar tab)
**Complexidade**: ALTA (schema novo `physician_research_dossier` + UI + 3 pipelines export)
**Trigger ação**: começar pela menor — PDF first, depois Fórum, depois Tese

### 14. F4 Fórum publicação ativa (3 bloqueios técnicos)
**Memory**: `audit_forum_3_bloqueios_pre_publicacao_18_05`
**Status**: tab existe na UI, publicação não fecha o ciclo
**Complexidade**: média (3 bloqueios mapeados na memory)
**⚠️ Excludente parcial**: gatilho HUMANO é Ricardo querer publicar, MAS bloqueios técnicos pra resolver são autônomos
**Trigger ação**: atacar os 3 bloqueios mesmo antes do Ricardo ativar — quando ele vier, está pronto

---

## 🔵 P2 IMPLEMENTAÇÕES PARQUEADAS — Pricing/Cap/BYO (3 itens)

### 15. Cap Matrix técnico (counter + edge check + UI banner)
**Memory**: `reference_pricing_dinamico_cap_byo_sem_trava_20_05`
**Status**: design cristalizado, implementação parqueada
**Complexidade**: média (schema `user_quota_monthly` + Edge function check + UI banner progressivo 80%/95%/100%)
**Trigger ação**: aguardar dado real beta 20-30 (uso p50/p95 antes de fixar cap)

### 16. Cashback dinâmico (CASHBACK_RATE constante → campo user_profile)
**Memory**: `reference_pricing_dinamico_cap_byo_sem_trava_20_05`
**Status**: hoje `CASHBACK_RATE = 0.05` hardcoded em `PatientFinancialDashboard.tsx:56`
**Complexidade**: baixa (migration + atualizar 3 lugares)
**Trigger ação**: NÃO antes beta — não mudar 2 variáveis simultâneas

### 17. BYO-LLM (schema + Edge encrypt + Router + UI tab)
**Memory**: `project_byo_llm_arquitetura_parqueada_19_05` + `reference_pricing_dinamico_cap_byo_sem_trava_20_05`
**Status**: arquitetura completa parqueada
**Complexidade**: ALTA (schema `professional_llm_config` + Edge `llm-key-encrypt` + LLM Router + Tab `/profissional/configuracoes`)
**Trigger ação**: aguardar Marco 1 (CNPJ) — recalibrado de Marco 3 → Marco 1

---

## 📊 P2 TELEMETRIA/OBSERVABILIDADE (3 itens)

### 18. Telemetria 6 sinais comportamentais beta 20-30
**Memory**: `project_v1_9_388_smoke_final_vitoria_empirica_19_05` + `reference_pricing_dinamico_cap_byo_sem_trava_20_05`
**Status**: 6 sinais definidos, telemetria inexistente
**Sinais**:
- Autoridade invisível de estrutura (Matrix)
- Cognitive offloading (Matrix uso como resposta)
- Retenção longitudinal cashback
- Frequência consulta cashback
- Sensibilidade psicológica 3% vs 5%
- Efeito médico longitudinal
**Complexidade**: média (eventos Posthog ou tabela `behavioral_signals`)
**Trigger ação**: definir schema eventos + instrumentar coleta antes/durante beta

### 19. Cost dashboard agregado em tempo real
**Memory**: `reference_custo_ia_instrumentacao_canonica_18_05`
**Status**: custos instrumentados em metadata jsonb, mas dashboard inexistente
**Complexidade**: baixa (view SQL + página admin)
**Trigger ação**: criar view `v_ai_cost_daily` + adicionar página AdminDashboard

### 20. Cron de validação periódica V1.9.299 PBAD ITI
**Memory**: `project_v1_9_299_pbad_ad_rb_conforme_16_05` + `feedback_lock_v1_9_299_pbad_nao_tocar_16_05`
**Status**: validado UMA vez em validar.iti.gov.br (16/05), sem re-validação automática
**Risco**: se ITI atualizar PA AD-RB pra v2.5 + nosso código não pegar, voltamos a "desconhecida"
**Complexidade**: média (cron mensal + alerta se hash PA muda)
**Trigger ação**: criar Edge `pbad-validation-cron` que verifica PA_AD_RB_V24 hash continua ativo

---

## 🔻 P3 DRIFT TÉCNICO EMPÍRICO (2 itens)

### 21. Sidecar renal V1.9.307 — 0 aprovações em 8h pós-deploy
**Memory**: `audit_v1_9_307_299_311_312_estado_real_pos_deploy_16_05`
**Status**: feature deployada, ninguém aprovou na primeira semana
**Risco**: "infra sem adoção" — V1.9.307 pode ser sinal de over-engineering pré-PMF
**Complexidade**: análise (não código) — auditar uso + decidir se mantém ativo ou parqueia
**Trigger ação**: query atual `renal_inline_suggestions` em 16/04→20/05 + decidir

### 22. NFT Gallery V1.9.311 — 1/12 PBAD adoção
**Memory**: `audit_v1_9_307_299_311_312_estado_real_pos_deploy_16_05` + `project_v1_9_311_nft_consent_pattern_16_05`
**Status**: 1 médico (Ricardo, exceção) com 1 NFT consentido, 11 sem
**Risco**: feature complexa com adoção marginal
**Complexidade**: análise + UX hint
**Trigger ação**: medir uso real 20/05 vs 16/05 + decidir

---

## Tabela ordenada por executividade isolada (Pedro+Claude conseguem)

| # | Item | P | Complexidade | Tempo estimado | Bloqueio externo? |
|---|---|---|---|---|---|
| 5 | 72 files órfãos | P1 | Baixa | 30min script | ❌ |
| 7 | chat_messages_legacy comment | P1 | Baixa | 10min | ❌ |
| 10 | Dual-write contract CLAUDE.md | P1 | Baixa | 30min docs | ❌ |
| 2 | 2 views SECURITY DEFAULT | P0 | Baixa | 1h SQL | ❌ |
| 11 | F1 auto-ativação Matrix | P2 | Baixa | 2h FE | ❌ |
| 16 | Cashback constante → campo | P2 | Baixa | 2h FE+SQL | ⚠️ aguarda beta |
| 19 | Cost dashboard | P2 | Baixa | 2h SQL+UI | ❌ |
| 21 | Audit sidecar renal | P3 | Análise | 1h query | ❌ |
| 22 | Audit NFT Gallery | P3 | Análise | 1h query | ❌ |
| 18 | Telemetria 6 sinais | P2 | Média | 4h schema+inst | ❌ |
| 3 | esm.sh lockfile | P0 | Média | 4h migrate | ❌ |
| 4 | is_professional_patient_link v2 | P0 | Média | 3h refactor | ❌ |
| 6 | 35 vínculos backfill | P1 | Média | 3h ETL+validar | ❌ |
| 9 | Workflow revisão telemetria | P1 | Baixa | 2h instrumentar | ⚠️ Ricardo |
| 12 | F2 function calling | P2 | Média | 6h Edge | ❌ |
| 15 | Cap Matrix técnico | P2 | Média | 6h schema+UI | ⚠️ aguarda beta |
| 20 | Cron PBAD validation | P2 | Média | 4h Edge | ❌ |
| 8 | tradevision-core refator | P1 | Alta | 12h+ | ❌ |
| 13 | F3 dossiê | P2 | Alta | 16h+ | ❌ |
| 14 | F4 fórum publicação | P2 | Média | 8h | ⚠️ Ricardo trigger |
| 17 | BYO-LLM completo | P2 | Alta | 16h+ | ⚠️ Marco 1 CNPJ |
| 1 | AEC localStorage fix | P0 | Alta | 8h+ sessão dedicada | ❌ |

## Sugestão de ordem prática (próximos 30 dias sem CNPJ/Ricardo)

### Sprint 1 — Limpezas rápidas (1 dia)
- Item 5 (órfãos)
- Item 7 (comment legacy)
- Item 10 (dual-write docs)
- Item 2 (SECURITY DEFAULT views)
- Item 21+22 (audits sidecar/NFT)

**Resultado**: 5 débitos fechados em 1 dia, MEMORY.md mais limpo.

### Sprint 2 — F1 + observability (2-3 dias)
- Item 11 (F1 auto-ativação Matrix) — destrava jornada eixo Pesquisa
- Item 19 (cost dashboard)
- Item 18 (telemetria 6 sinais) — habilita medição beta 20-30

### Sprint 3 — Segurança crítica (3-5 dias)
- Item 3 (esm.sh lockfile)
- Item 4 (is_professional_patient_link v2)
- Item 6 (35 vínculos backfill)

### Sprint 4 — Refatoração crítica (preparação anti-bus-factor)
- Item 8 (tradevision-core refator) — alta prioridade pra reduzir bus factor 1 técnico (Pedro single dev)

### Backlog parqueado aguardando beta/Marco
- Item 14 (F4 fórum — aguarda 20-30 darem feedback se querem)
- Item 15 (cap Matrix — aguarda dado uso real)
- Item 16 (cashback dinâmico — aguarda beta concluir)
- Item 17 (BYO-LLM — aguarda Marco 1 CNPJ)
- Item 13 (F3 dossiê — aguarda F1 funcionando primeiro)
- Item 1 (AEC localStorage — aguarda sessão dedicada ≥4h)

## Anti-padrões a evitar nas próximas sessões

- ❌ Atacar item 8 (tradevision-core refator) sem sessão ≥6h dedicada — alto risco quebrar Locks
- ❌ Mudar cashback (16) durante beta — enviesa medição
- ❌ Implementar BYO (17) antes Marco 1 — sem CNPJ não dá pra ativar mesmo se quiser
- ❌ F3 dossiê (13) antes de F1 auto-ativação (11) — jornada quebra
- ❌ Esperar Ricardo decidir item 14 fórum — bloqueios técnicos são autônomos, atacar quando der
- ❌ Mexer no V1.9.299 PBAD sign-pdf-icp ou icp_chain.ts sem auditoria completa (memory `feedback_lock_v1_9_299_pbad_nao_tocar_16_05`)

## Frase âncora

> *"22 itens executáveis isoladamente (Pedro+Claude) acumulados em ~1 mês pós-PBAD. Filtrado tudo que depende de CNPJ ou Ricardo. Ordem pragmática: limpezas rápidas → observability → segurança → refator. Beta 20-30 destrava dados pra ajustar caps e cashback. Refator tradevision-core é crítico anti-bus-factor."*

— Pedro + Claude 20/05/2026 ~11h50 BRT
