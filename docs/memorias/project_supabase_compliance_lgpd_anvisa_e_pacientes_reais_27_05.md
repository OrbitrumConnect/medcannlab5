---
name: supabase-compliance-lgpd-anvisa-e-pacientes-reais-27-05
description: "Audit empírico via PAT 27/05 ~14h BRT revelou Supabase score 65% maturidade compliance LGPD/SaMD: ✅ encryption + RLS 141/141 (100%) + backups diários 8d + Supabase corporativo SOC 2/ISO 27001/HIPAA-ready. ❌ 3 gaps críticos: região us-east-1 (não BR) + PITR DESABILITADO + pgaudit NÃO instalado. 115 rows PII rationalities: ~90% testes internos sócios/admin (Pedro/Carolina/Ricardo/João Vidal teste) + ~10% pacientes potencialmente reais (Maria Pinto Pitoco confirmada + Cristiano Pontes + Mateus + Mariana — Maria Helena Chaves É NAMORADA Pedro, não real). Backfill priorizado ~12 rows reais trivial. Caminho cirúrgico SEM REGRESSÃO: Supabase Pro plan $25/mês + pgaudit + Termo formal + migração SP só pós-Marco 2 OR ANVISA pedir. Migrar PRA OUTRO provider = REGRESSÃO ENORME 3-6 meses (perde Edge Functions + Auth + Storage + RLS) — NÃO recomendado."
metadata:
  node_type: memory
  type: project
  originSessionId: 00be2b9f-5dbc-4236-a02e-1459c3f57bd2
---

# 🔒 Supabase Compliance LGPD/SaMD + Pacientes Reais vs Testes — audit 27/05 ~14h BRT

## ⚠️ Disclaimer

Análise baseada em audit empírico via Supabase Management API + queries SQL (PAT `sbp_6ca2f018...`) em 27/05 ~14h BRT.

**NÃO substitui consulta com advogado especialista** em LGPD + saúde digital + RDC 657/2022 antes de submissão formal a Marco 2 paciente externo OR petição ANVISA.

## 📊 Score Supabase compliance honesto — 65% maturidade

### ✅ O que está bem (defensável institucional/auditor)

| Critério | Estado empírico |
|---|---|
| Encryption at rest (AES-256) | ✅ Default Supabase todos projetos |
| Encryption in transit (TLS 1.3) | ✅ Default |
| RLS coverage | ✅ **141/141 tabelas públicas (100%)** — validado via PAT |
| Backups diários físicos | ✅ 8 backups consecutivos (20-27/05) WAL-G habilitado |
| pgcrypto | ✅ instalado (criptografia colunar) |
| pg_cron | ✅ instalado (jobs auditáveis) |
| pg_stat_statements | ✅ instalado (query monitoring) |
| Project status | ✅ ACTIVE_HEALTHY |
| **Supabase corporativo** | ✅ SOC 2 Type II + ISO 27001 + HIPAA-ready (BAA disponível em plano Team+) |

### 🔴 3 GAPs críticos descobertos

#### Gap 1 — Região `us-east-1` (AWS Virginia, EUA)
- Dados pacientes BR hospedados nos EUA
- LGPD Art. 33 permite transferência internacional MAS exige:
  - Base legal específica declarada
  - Cláusulas contratuais padrão
  - **Termo de Uso paciente declarar transferência**
- Risco: Cloud Act US (governo US pode requisitar dados)
- Para SaMD ANVISA pode ser questionado

#### Gap 2 — **PITR (Point-in-Time Recovery) DESABILITADO**
- Confirmado API: `"pitr_enabled":false`
- Sem PITR = só recovery pra backup mais recente (até 24h perda)
- LGPD/SaMD: incidente entre backups = perda dados sem recovery granular
- **Habilitação automática no plano Pro ($25/mês)**

#### Gap 3 — `pgaudit` **NÃO instalado**
- Sem audit log formal de operações sensíveis (UPDATE/DELETE)
- LGPD Art. 37 exige registro de operações
- SaMD: rastreabilidade é requisito ISO 13485 §4.2.5
- **Instalação trivial (1-2h dev)** — extension oficial Supabase suporta

### 🟡 Gaps menores

- BAA Supabase: não aplicável LGPD direto, é prática maturidade
- Vault / Secrets advanced: secrets atualmente em Edge Functions Dashboard (OK pra MVP)
- pgsodium: encryption avançado opcional pós-maturidade

## 🧬 Pacientes REAIS vs TESTES — empírico 115 rows clinical_rationalities

### 🔴 TESTES INTERNOS (~103 rows = ~90%)

| Email | Nome | Rows | Categoria |
|---|---|---|---|
| carolinacampellovalenca@gmail.com | Carolina Campello do Rêgo Valença | 48 | TESTE Ricardo (CLAUDE.md confirma) |
| casualmusic2021@gmail.com | Pedro Paciente | 39 | TESTE admin |
| passosmir4@gmail.com | passosmir4 | 11 | TESTE Pedro tech lead |
| phpg69@gmail.com | Pedro | 9 | TESTE Pedro admin |
| cbdrcpremium@gmail.com | João Eduardo Vidal | 3 | SÓCIO TESTE |
| jvbiocann@gmail.com | joao eduardo | 3 | SÓCIO TESTE |
| rrvalenca@gmail.com | Dr. Ricardo Valença | 1 | SÓCIO TESTE |
| **mariahelenaearp@gmail.com** | **Maria Helena Chaves** | **5** | **🟡 NAMORADA Pedro** (correção 27/05) |

### 🟢 PACIENTES REAIS — REVISÃO FINAL (apenas ~3-4 rows = 2-3%)

**Correção empírica 27/05 ~16h BRT (Pedro confirmou amigos pessoais):**

| Email | Nome | Rows | Status |
|---|---|---|---|
| mariappitoco@gmail.com | **Maria das Dores Pinto Pitoco** | 3 | ✅ **ÚNICA REAL confirmada** (Ricardo + 1 row sidecar renal V1.9.307) |
| marianacarvalhomgd@gmail.com | Mariana Carvalho | 1 | 🟡 INCERTO (Pedro deve confirmar com Ricardo se é real ou amiga/teste) |

**Removidos da categoria "real" após confirmação Pedro:**
- ~~Cristiano Pontes (4 rows)~~ → **AMIGO Pedro** (teste pessoal)
- ~~Mateus Chagas (3 rows)~~ → **AMIGO Pedro** (teste pessoal)
- ~~Maria Helena Chaves (5 rows)~~ → **NAMORADA Pedro** (teste pessoal — confirmado anteriormente)

**Implicação cirúrgica revisada**: backfill 3-4 UPDATEs em vez de 12 ou 115. Smoke trivial (1 paciente real + 1 incerto = 15min cirúrgico).

### 🔍 Casos especiais empíricos

- **Gilda Cruz Siqueira** (gildacscacomanga@gmail.com) — cadastrada 19/01/2026, paciente REAL Ricardo, **0 AEC + 0 reports + 2 exames** — NÃO tem rationalities (não está nas 115 rows). Gap empírico: paciente real sem passagem completa pelo fluxo.
- **João Guimarães** — mencionado no V1.9.455 (26/05) mas NÃO é conta separada em `users` — provavelmente nome em campo livre `patient_name` de exame/prescrição

## 🎯 Caminho cirúrgico SEM REGRESSÃO (~5h dev total)

### Sequência prática prioritizada

| Ação | Custo $ | Custo dev | Regressão | Quando |
|---|---|---|---|---|
| 1. Upgrade Supabase Free → Pro plan | $25/mês | 5min UI | 🟢 ZERO | HOJE/AMANHÃ |
| 2. Habilitar pgaudit + configurar tabelas críticas | $0 | 1-2h | 🟢 ZERO | Esta semana |
| 3. Backfill ~12 rows pacientes reais (4 pessoas) | $0 | 30min + smoke | 🟡 Baixo (Ricardo aprova) | Pós-Ricardo OK |
| 4. Termo de Uso formal LGPD Art. 33 + CFM 2.314 | R$ 1-3K advogado | 2h | 🟢 ZERO | Pré-Marco 2 |
| 5. DPO designado (sócio + treinamento) | $0 | 0 | 🟢 ZERO | Pré-Marco 2 |
| **TOTAL pré-Marco 2** | **$25/mês + R$ 1-3K** | **~5h** | 🟢 ZERO | — |

### Migração pra `sa-east-1` São Paulo — PARQUEADO

**Quando ativar**:
- ANVISA pedir hospedagem BR na petição
- Investidor sênior questionar
- Volume Marco 2 escalar (50+ pacientes externos)
- Decisão conservadora Ricardo + João

**Processo (4-8h dev cuidadoso, ZERO custo financeiro adicional)**:
1. Criar projeto novo Supabase em `sa-east-1`
2. `pg_dump` projeto atual us-east-1
3. `pg_restore` no novo
4. Migrar Edge Functions (deploy nos novos URLs)
5. Migrar Storage (via API)
6. Atualizar `SUPABASE_URL` + `ANON_KEY` no frontend
7. Vercel re-deploy
8. Smoke completo (toda Constituição Z2 + AEC + ICP)
9. Decommission projeto antigo

### Migração pra OUTRO provider — REGRESSÃO ENORME 3-6 meses

**NÃO recomendado**. Supabase é praticamente uma plataforma inteira:
- Edge Functions Deno (14 ativas)
- Auth (email + RLS por user)
- Storage (chat-images V1.9.98 + documents + bucket bulario futuro)
- Realtime
- RLS (141/141 tabelas)

Migrar = reescrever 14 Edges + reconfigurar tudo + perder maturidade institucional Supabase.

Alternativas avaliadas:
- **Neon** (https://neon.tech): Postgres serverless mas **NÃO tem São Paulo** + sem Edge Functions
- **AWS RDS Postgres sa-east-1**: possível mas sem dashboard + sem Edges + sem Auth = retrabalho enorme
- **DigitalOcean Managed Database BR**: similar AWS RDS
- **Hostgator/Locaweb**: shared hosting, não prod-grade

**Veredito**: Supabase atual + 3 fixes (Pro + pgaudit + Termo) > qualquer alternativa BR atualmente.

## 📋 Implicações pra petição ANVISA SaMD (Modelo C híbrido)

- ✅ Supabase corporativo (SOC 2 + ISO 27001 + HIPAA-ready) é defensável
- ✅ RLS 141/141 (100%) é argumento forte
- ✅ Backups diários documentados via Management API
- ⚠️ Auditor SaMD vai questionar: região US + PITR off + pgaudit ausente
- **Modelo C híbrido pode aceitar SE 3 fixes feitos ANTES da petição**

## 🛡️ Lock Supabase via Edge Functions — defesa adicional cristalizada

12/14 Edges com `verify_jwt:false` (config.toml) MAS:
- `sign-pdf-icp` v22 tem lock interno V1.9.457 (auth + ownership check)
- `extract-document-text` v62 + `video-call-request-notification` v62 com `verify_jwt:true`
- Outras Edges precisam audit: quais têm Authorization manual check?

**Próximo passo**: rodar grep nas 14 Edges pra mapear quais têm validação JWT manual interna (defesa Classe Ia SaMD).

## 🪶 Frase âncora

> *"Supabase score 65% — encryption + RLS + backups OK; 3 gaps fixáveis em 1 semana sem regressão. Migrar pra outro provider = matar o sistema. Pro plan + pgaudit + Termo formal = caminho cirúrgico pré-Marco 2."*

## Conexões com princípios cristalizados

- [[reference_lock_v1_9_388_a3_ancoragem_regulatoria_multicamada_27_05]] — LGPD Art. 11/20/33 mapeados
- [[feedback_compressao_estrutural_vs_abstracao_clinica_27_05]] — Constituição não-decisional reforça defesa Classe Ia
- [[project_marco_empirico_validacao_iti_externa_pedro_paciente_26_05]] — ICP-Brasil pipeline validado externamente
- `docs/MEDCANNLAB_SGQ_INDICE_PRELIMINAR_27_05.md` (commit 6ba6ca9) — dossiê preliminar referência

## 🎯 Próxima sessão Claude (laptop com Ricardo) — checklist

1. **Decidir com Ricardo**: upgrade Pro plan agora ou esperar Marco 2?
2. **Aprovar backfill 4 pacientes reais** (~12 rows): Maria Pinto Pitoco + Cristiano + Mateus + Mariana
3. **Validar conceito-pivot** compressão estrutural com Ricardo (memory pendente endosso humano)
4. **Smoke V1.9.468-B 9 turnos** com Ricardo no laptop
5. **Discutir** migração SP futura vs Termo formal pra agora
6. **DPO designation**: quem? Pedro? Ricardo? Eduardo? (Sócio mais técnico-legal)
7. **Termo de Uso advogado**: contratar especialista saúde digital BR

## 🔴 Anti-padrão a vigiar

- ❌ Migrar pra outro provider sem necessidade real = regressão arquitetural enorme
- ❌ Esperar Marco 2 chegar pra começar Pro plan + pgaudit (atrasa preparação compliance)
- ❌ Backfill 115 rows TODAS sem priorização (risco mutilação rows complexas testes históricos)
- ❌ Anunciar publicamente "Supabase é seguro pra pacientes" sem antes os 3 fixes (overclaim)

**Anti-overclaim aplicado**: o sistema TEM gaps reais (3 críticos + alguns menores). NÃO declarar publicamente "Supabase é HIPAA/LGPD compliant" sem aplicar fixes específicos do projeto MedCannLab.
