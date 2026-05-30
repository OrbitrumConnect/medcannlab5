---
name: auditoria-integral-completa-sprints-0-5-29-05
description: "Auditoria Integral MedCannLab COMPLETA entregue madrugada 29/05 em 10 docs (docs/audit/). Custo real ~3-4h vs ~17-23h estimados (economia 70%) via reuso de 18 auditorias históricas + retrospectiva 2340 linhas + PAT empírico direto. 6 achados críticos novos: (1) tradevision-core verify_jwt flipou true→false em 6 dias — bomba 22/05 cumprida; (2) 8 órfãos public.users sem auth.users (5 reais incluindo joao.vidal); (3) 44% appointments cancelled; (4) 69% AECs interrupted sem UI; (5) 60% prescrições CFM EXTERNAS (Ricardo prescrevendo real); (6) DRAFT melhorou 94%→79%. Vereditos: tecnica SAUDAVEL / clínica PRESERVADA / regulatoria MELHORAVEL / fluxo ATENÇÃO / filosofica COERENTE. PII em clinical_rationalities.assessment (88.5% rows) único bloqueador imediato Marco 2. Frase brutal: 'MedCannLab é pipeline clínico AEC + IA Z2 + assinatura ICP-Brasil maduro com uso 87% interno e 1 paciente externo real confirmado (Maria Pinto)'."
metadata: 
  node_type: memory
  type: project
  originSessionId: 00be2b9f-5dbc-4236-a02e-1459c3f57bd2
---

# 🔍 Auditoria Integral MedCannLab COMPLETA — 10 docs Sprints 0-5 (29/05 madrugada)

## Contexto

Pedro pediu auditoria integral completa noite 28/05 baseada em proposta GPT externo (12 docs). Aplicado anti-overclaim (descartar retórica) + polir-não-inventar (reusar material existente). Custo real **~3-4h vs ~17-23h estimados** (economia 70%).

## Estrutura entregue (10 docs em `docs/audit/`)

### Sprint 0 — Catalogação (commit `d41aac9`)
- `00_INDEX_MATERIAIS_EXISTENTES.md` — catálogo 18 auditorias + retrospectiva 2340 linhas + 65 diários
- `01_SYSTEM_STATE_28_05_2026.md` — delta vs 22/05 + vital signs PAT empírico
- `PLANO_SPRINTS_AUDIT_INTEGRAL.md` — roadmap 5 sprints

### Sprint 1 — Banco (commit `b7fb8e0`)
- `03_DATABASE_REALITY.md` — 140 tabelas + 64 vazias (45%) + drift auth/public + triggers
- `09_UNUSED_ARCHITECTURE.md` — catálogo 64 vazias + ~10 safe-to-drop pós-Marco 2

### Sprint 2 — Frontend + Security
- `04_FRONTEND_ROUTE_MAP.md` — ~85 rotas, 81 páginas, legacy redirects
- `05_SECURITY_AND_SECRETS.md` — 12/14 Edges verify_jwt=false, 0 secrets em src/, .claude não vazou

### Sprint 3 — Uso real qualificado interno/externo
- `02_REAL_USER_FLOWS_E_08_DRAFT_DROP_OFF.md` — 87% reports internos, 60% prescrições externas, 44% appointments cancelled, 69% AECs interrupted

### Sprint 4 — Clínica + Longitudinalidade + Filosofia (REQUERIA Ricardo, entregou coleta de evidências)
- `06_07_10_CLINICAL_LONGITUDINAL_PHILOSOPHICAL.md` — Z2 preservado empírico, Verbatim First V1.9.86 ativo, frase âncora Ricardo respeitada, Camada 2.3 buraco arquitetural

### Sprint 5 — Consolidação + vereditos
- `11_OPERATIONAL_PRIORITIES_E_12_EMPIRICAL_VERDICTS.md` — TOP 10 ações 30d, TOP 5 matar, TOP 5 manter, vereditos 5 dimensões, pergunta brutal "O que MedCannLab É?"

## 🔥 6 ACHADOS CRÍTICOS NOVOS

### 🔐 1. `tradevision-core` verify_jwt flipou true→false (bomba 22/05 cumprida)
- 22/05: `v407` `verify_jwt: true`
- 29/05: `v422` **`verify_jwt: false`**
- Causa: script `npm run deploy:tradevision` tem `--no-verify-jwt` flag (avisada 22/05 mas não corrigida)
- Mitigação: auth interna manual `auth.getUser()` linha 1799 cobre
- Risco residual: defesa-em-camadas quebrada
- Correção: 1 linha (remover flag do script)

### 🔴 2. 8 órfãos `public.users` SEM `auth.users` (drift novo)
- 3 anonymized OK (pós-delete LGPD)
- **5 reais** a investigar: `cdo@gmail.com`, `eawarrak@id.uff.br`, `miltonluquett@yahoo.com.br`, `marneserrano@terra.com.br`, **`joao.vidal@remederi.com`** (sócio CNPJ Marco 1!)

### 🔴 3. 44% appointments cancelled
- 48 scheduled / 41 cancelled / 4 completed (93 total)
- Mesmo qualificado por viés interno: drop-off agendamento alto
- Hipóteses pra investigar: UX gap / referral_marco_zero trigger / cancelamento legítimo paciente

### 🔴 4. 69% AECs interrupted sem UI gerir
- 9 interrupted / 4 completed
- Backlog P1 conhecido (5 órfãs) cresceu pra 9 sem mitigação
- Casos: Illa, Pedro, Thiago (21d), Solange (30d), João Eduardo, +4 novos

### 🟢 5. 60% prescrições CFM EXTERNAS (achado positivo)
- 19 internos / 29 externos (48 total)
- Único componente onde externo > interno
- Ricardo prescrevendo real pra pacientes físicos (mesmo que não usem app)

### 🟢 6. DRAFT melhorou empíricamente
- 22/05: 94% prescrições draft
- 29/05: 79% draft (15 percentual points em 6 dias)
- Ricardo assinou mais

## Vereditos por dimensão

| Dimensão | Estado | Justificativa empírica |
|---|---|---|
| Saúde técnica | 🟢 SAUDÁVEL | 140 tabelas RLS 100%, 14 Edges com auth interna onde gateway flag off, type-check verde 17 commits |
| Saúde clínica | 🟢 PRESERVADA | Z2 smoke 28/05 PASS, Verbatim First V1.9.86 ativo, AEC Gate V1.5 preservado, Lock V1.9.388-A.3 intocado |
| Saúde regulatória | 🟡 MELHORÁVEL | PII em clinical_rationalities 88.5%, PATs rotação pendente, compliance 65% maturidade (us-east-1 + PITR off) |
| Saúde de fluxo | 🟡 ATENÇÃO | 44% appts cancelled, 69% AECs interrupted, 79% prescrições draft (melhorando) |
| Saúde filosófica | 🟢 COERENTE | Norte Ricardo respeitado, Babylon/Watson/Olive patterns evitados, Camada 3 (modelar médico) vetada |

## Pergunta brutal — O que MedCannLab É HOJE?

> *"Pipeline clínico AEC + IA Z2 + assinatura ICP-Brasil maduro, sustentado por uso 87% interno (sócios+amigos teste) e 1 paciente externo real confirmado (Maria Pinto Pitoco). Arquitetura epistemológica pronta esperando Marco 2 (20-30 externos pagantes). Norte filosófico Ricardo preservado. PII P0 não-mitigado há 28d é único bloqueador imediato pra escala. Próximo evento crítico: CNPJ Marco 1 João Vidal → Pro plan Supabase + DPO + advogado especialista → Marco 2."*

## TOP 3 ações URGENTES (executar HOJE/AMANHÃ)

1. **Rotar 3 PATs**: 1 sessão atual (exposto Push Protection log GitHub) + 2 em `.claude/settings.local.json` (não-vazaram, no disco local)
2. **Corrigir script `deploy:tradevision`** removendo `--no-verify-jwt` flag (1 linha, restaura defesa em camadas)
3. **Mandar 3 perguntas pro Ricardo** (rascunho entreguei sessão 28/05 manhã) — destrava Camada 2 inteira

## TOP 10 ações 30 dias (priorizadas)

### 🔐 Irreversíveis (1-3)
1. Rotar 3 PATs
2. Rotar 2 PATs `.claude/` 
3. Corrigir deploy script

### 🔴 Quebra uso real (4-7)
4. V1.9.452 PII sanitize `clinical_rationalities.assessment` (P0 backlog 28d atrasado)
5. Camada 2.3 plano terapêutico — decisão Ricardo (construir feature OR descontinuar tabela)
6. UI gerir AECs interrupted (9 órfãs)
7. Investigar 5 órfãos reais `public.users` sem `auth.users`

### 🟡 Atrito fluxo (8-10)
8. Camada 1.5 aba Evolução prontuário separar 3 fontes
9. Investigar drop-off appointments cancelled 44%
10. Mandar 3 perguntas Ricardo

## Princípio cristalizado nesta sessão

> **"Auditoria integral profunda é possível em poucas horas SE reusar massivamente material existente. Princípio polir-não-inventar economiza 70% de re-trabalho. PAT empírico via Management API + grep cruzado entrega evidências objetivas. GPT externo propôs 12 docs gigantes — triagem anti-overclaim revelou que 6 docs cobrem empíricamente; outros são poesia retórica útil pra moldura mas não pra ação."**

## Conexões com memorias anteriores

- [[feedback_validacao_empirica_screenshot_maior_que_plano_teorico_28_05]] — princípio meta aplicado
- [[feedback_sistema_tem_contexto_demais_falta_semantica_clinica_28_05]] — princípio meta aplicado a uso real
- [[feedback_polir_nao_inventar]] — base da economia 70%
- [[feedback_anti_overclaim]] — triagem proposta GPT externo
- [[feedback_pacientes_reais_vs_testes_clinical_rationalities_27_05]] — base qualificador interno/externo
- [[project_matrix_roadmap_camadas_1_2_3_28_05]] — referenciado nos achados
- [[reference_lock_v1_9_388_a3_ancoragem_regulatoria_multicamada_27_05]] — preservado empíricamente
- [[project_supabase_compliance_lgpd_anvisa_e_pacientes_reais_27_05]] — base do veredito regulatório

## Próxima auditoria (gatilho explícito)

**Trigger**: Marco 2 materializado (1º paciente externo pagante) OR 60 dias (29/07/2026).

**Escopo**: comparar funil empírico ANTES vs DEPOIS Marco 2. Validar V1.9.452 PII resolvido. Re-auditar AEC drop-off com base externa. Decisão MATAR ~12 tabelas (drop com pg_dump). Re-validar verify_jwt em todas Edges.

## Frase âncora

> *"Auditoria Integral completa em ~3-4h via reuso massivo (70% economia). 6 achados críticos novos via PAT empírico — incluindo bomba V1.9.299 cumprida. Sistema saudável tecnicamente, preservado clinicamente. PII P0 (88.5% rows vazadas) único bloqueador imediato Marco 2. Pergunta brutal respondida: MedCannLab É pipeline AEC + IA Z2 maduro com 87% uso interno + 1 paciente externo real. Arquitetura epistemológica pronta esperando Marco 2."*
