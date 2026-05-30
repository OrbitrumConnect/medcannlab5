# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project identity

**MedCannLab 3.0** — HealthTech/EdTech de Cannabis Medicinal com IA Nôa Esperança. Arquitetura por 3 eixos: **Clínica** (AEC + Relatório + Agendamento), **Ensino** (cursos + TRL), **Pesquisa** (forum + casos clínicos). Sistema cognitivo de 8 camadas onde **GPT é o último a falar e o primeiro a ser checado**.

**Estado atual** (30/05/2026, pós DIARIO_30 auditoria 360 + V1.9.503 Nível 1 automação SGQ): Locks preservados V1.9.95+97+98+99-B+299+388-A.3+452+468-B + sessões 27→29/05 entregaram Sprint D Matrix Camadas 1.X + Sprint E 3 verticais Ensino + V1.9.452 PII sanitize fechado + V1.9.500 InterruptedAECsCard + SGQ ANVISA (20 drafts em `docs/sgq/`). **HEAD atual `0920c57`** (30/05 ~00h, DIARIO_30 + plano Tiers 0-3). Tags ativas: `v1.9.452-pii-sanitize-defensivo-final` + `v1.9.468-A-matrix-bula-locks-final` + `v1.9.299-pbad-conforme-locked` (entre 11 total). Pré-PMF declarado empíricamente (0 pacientes externos pagantes; **Eduardo Faveret virou usuário operacional 27/05 laptop**; testes internos + 1 paciente externa real confirmada Ricardo: Maria das Dores Pinto Pitoco com 3 racionalidades).

**P0 V1.9.452 LGPD sanitize ✅ RESOLVIDO 29/05** (`8ed1802`): Edge `tradevision-core` v423 com `sanitizeRationalityPII` + `lookupPatientName` patcheando 2 INSERTs + backfill 132 rows via PL/pgSQL. Audit empírico 30/05 refutou claim "88.5% PII residual" — **113/132 (85.6%) com padrão `Paciente #XXXXXX`** + **0/132 com nome real cruzado** (heurística contra Maria/Carolina/João/Pedro). Marco 2 não fica mais bloqueado por isso; rebaixado a "polish residual ~14% pré-V1.9.407". Detalhes em DIARIO_30 §B.2.

**Cron `sgq-health-checks-daily` ATIVO 29/05** (V1.9.503): roda diariamente 06h BRT (09h UTC), executa `SELECT public.run_sgq_health_checks()` que checa 5 itens (RLS / PII / AECs órfãs >7d / cron failures 24h / ICP coverage) e grava em `public.system_health_alerts` (fila auditável). V1.9.505 refinou regex PII (3+ palavras capitalizadas + exclude list 30 termos técnicos + severidade `warning`) → 0 falsos positivos pós-deploy. Total 4 cron jobs agora (era 3). Memória completa: `project_v1_9_503_sgq_health_checks_nivel1_29_05`.

**🔒 V1.9.506 Sprint A `verify_jwt` RESTAURADO 30/05** (Tier 2 DIARIO_30): Edge `tradevision-core` v424 com **`verify_jwt=true`** (era `false` desde v407 22/05). Defesa em camadas restaurada: Supabase rejeita request anônimo ANTES de chegar à Edge (não consome CPU/tokens) + auth interna `assertPatientHasDoctorContext` continua ativa em runtime. Smoke pré-flip (slug-test paralelo `tradevision-core-jwt-test v1`): 4/4 (sem JWT 401, JWT inválido 401, deploy OK, 5 callers mapeados todos passando Bearer). Smoke pós-flip produção: 401 sem JWT + 401 JWT inválido. Slug-test cleaned. Logs Edge confirmaram fluxo AEC + Pipeline + Verbatim + ICP signature funcionando 100% (Pedro paciente, AEC FINAL_RECOMMENDATION → COMPLETED, total_ms 17888, signature hash gerado). RSK-001 H8 fechado, SRS-NFR-06 satisfeito, TRM-001 Gap #3 resolvido. Script preventivo `npm run deploy:tradevision` (sem `--no-verify-jwt`) adicionado em [package.json](package.json#L13). Lock V1.9.299 sign-pdf-icp INTOCADO.

**Memórias 17-18/05 com cobertura completa dos commits pós-PBAD**:
- RAG truncation endêmico (`feedback_rag_truncation_endemico_17_05`)
- Grounded Response Mode ausente (`feedback_grounded_response_mode_ausente_17_05`)
- Arquitetura "Escola Clínica Digital" 5 camadas (`project_arquitetura_escola_clinica_digital_17_05`)
- Audience Contract V1.9.330-A deployado (`project_v1_9_330_audience_contract_design_18_05`)
- Conditional Section Emission V1.9.331 (`project_v1_9_331_conditional_section_emission_18_05`)
- Presentation Contract Layer (`project_presentation_contract_layer_18_05`)
- Dual-write jsonb vs tabela contract (`feedback_dual_write_contract_jsonb_vs_tabela_18_05`)
- PARECER FISCAL 19/19 verificado (`feedback_debitos_tecnicos_parecer_fiscal_01_04_pendentes_18_05`)
- DoctorRelationCard parqueado (`project_doctor_relation_card_design_18_05`)
- 3 marcos de reprecificação valuation (`project_3_marcos_minimos_reprecificacao_valuation_18_05`)
- Drift histórico dev pré-PMF aceitável (`feedback_drift_historico_dev_aceitavel_pre_pmf_18_05`)

**Memórias 27/05/2026 cristalizadas (sessão desktop manhã/tarde + laptop noite)** — LER ANTES de tocar Matrix/AEC/racionalidades/Supabase/SaMD/neuro/Eduardo:

**Sessão DESKTOP (manhã/tarde):**
- 🔒 Supabase compliance LGPD/SaMD audit (`project_supabase_compliance_lgpd_anvisa_e_pacientes_reais_27_05`) — score 65% maturidade + 3 gaps críticos fixáveis sem regressão
- 🔍 Pacientes REAIS vs TESTES clinical_rationalities (`feedback_pacientes_reais_vs_testes_clinical_rationalities_27_05`) — empírico Pedro confirmou: ~96,9% testes; apenas Maria Pinto Pitoco é real (3 rows + 1 sidecar renal)
- 🎯 Compressão estrutural permitida vs abstração clínica proibida — CONCEITO-PIVOT Z2 (`feedback_compressao_estrutural_vs_abstracao_clinica_27_05`)
- 🏛️ Lock V1.9.388-A.3 ancoragem regulatória multi-camada CFM/LGPD/AI Act/FDA/WMA (`reference_lock_v1_9_388_a3_ancoragem_regulatoria_multicamada_27_05`)
- 🧬 Matrix Z2 + Bula ANVISA V1.9.468-B ativado + smoke prolongado pendente (`feedback_matrix_z2_bula_como_material_marcado_nao_sintetizada_27_05`)
- 💊 Bula é infraestrutura cognitiva no fluxo de prescrição (`feedback_bula_e_infraestrutura_cognitiva_no_fluxo_prescricao_27_05`)
- 💊 Fronteira info farmacológica vs decisão terapêutica (`feedback_fronteira_organizar_info_farmacologica_vs_decisao_terapeutica_27_05`)
- 💊 ANVISA Bulário indexação PDFs parqueado (`project_anvisa_bulario_indexacao_pdfs_parqueado_27_05`)
- 🌿 Portal ANVISA Cannabis parqueado top elite (`project_anvisa_cannabis_portal_parqueado_top_elit_27_05`)

**Sessão LAPTOP (noite, com Eduardo Faveret operacional)** — espelhadas em `docs/memorias/` (cross-machine sync):
- 🧠 Eduardo Faveret no app + sharing validado cross-account (`docs/memorias/project_eduardo_faveret_no_app_sharing_validado_27_05.md`)
- 🧠 Universo sinais neuro TEA/TOD/TDAH mapa completo Fase A (`docs/memorias/project_universo_sinais_neuro_tea_tod_tdah_mapa_completo_27_05.md`) — 20 categorias × keywords × Single sidecar
- 🧠 Smoke neuro empírico report 2bdb57fb (`docs/memorias/project_smoke_neuro_signal_report_2bdb57fb_27_05.md`) — 4 sinais TDAH detectados manualmente
- 🎯 IA admite limite em vez de fingir entender (`docs/memorias/feedback_ia_admite_limite_em_vez_de_fingir_entender_27_05.md`) — PRINCÍPIO META NOVO descoberto via uso real Eduardo

**Documentos SGQ preliminares pré-petição ANVISA (27/05 desktop)** — leia ANTES de discutir certificação SaMD:
- `docs/MEDCANNLAB_SGQ_INDICE_PRELIMINAR_27_05.md` (363 linhas — INTERNO técnico-detalhado) — mapeamento empírico SGQ orgânico → ISO 13485 + IEC 62304 + ISO 14971
- `docs/MEDCANNLAB_SGQ_INDICE_AUDITOR_27_05.md` (432 linhas — versão SANITIZADA pra auditor externo com 8 perguntas-pauta)
- `DIARIO_27_05_2026_MATRIX_Z2_BULA_E_LOCKS_ANTI_DRIFT.md` — Bloco A-M (desktop) + Bloco N (laptop, sessão Eduardo + 4 fixes UX + mapa neuro)

**⚠️ NÃO TOCAR** (sem auditoria empírica via openssl asn1parse + smoke ITI + diff binário vs PDF aprovado):
- `supabase/functions/sign-pdf-icp/index.ts` — algoritmo PBAD AD-RB validado, mexer = risco voltar pra "desconhecida"
- `supabase/functions/sign-pdf-icp/icp_chain.ts` — chain ICP embedded validada
- Constants `PA_AD_RB_V24_OID` e `PA_AD_RB_V24_SIGPOLICYHASH_HEX` no edge — só atualizar quando ITI publicar nova PA (próxima v2.5+)

## Common commands

```bash
# Dev local
npm run dev              # Vite porta 3001
npm run build            # ⚠️ quebra local por dompurify ausente; Vercel passa
npm run type-check       # tsc --noEmit (use isso pra validar mudanças)
npm run lint             # eslint
npm run lint:fix
npm test                 # Vitest com coverage
npm run test:watch
npm run test:integration

# Deploy Edge Function (Supabase CLI)
npx supabase functions deploy <slug> --project-ref itdjkfubfzmvmuxxjoae --no-verify-jwt

# Push dual-remote (POLÍTICA OBRIGATÓRIA — sempre 4 refs)
# ⚠️ Naming dos remotes muda por máquina (laptop = hub+origin; desktop = amigo+medcannlab5)
# Antes de pushar, validar com: git remote -v
# Desktop atual (Pedro 18/05):
git push amigo HEAD:main && git push amigo HEAD:master && \
  git push medcannlab5 HEAD:main && git push medcannlab5 HEAD:master
# Laptop equivalente:
# git push hub HEAD:main && git push hub HEAD:master && \
#   git push origin HEAD:main && git push origin HEAD:master

# Supabase Management API (queries SQL)
curl -X POST "https://api.supabase.com/v1/projects/itdjkfubfzmvmuxxjoae/database/query" \
  -H "Authorization: Bearer <PAT>" \
  -H "Content-Type: application/json" \
  -d '{"query":"SQL_AQUI"}'
```

## Pirâmide de governança (8 camadas — leia antes de mexer no Core)

```
0. REGRA HARD §1 (constitucional)        "Consentimento ≠ Agendamento" — anti-kevlar §1
1. COS KERNEL v5.0 (cos_engine.ts*)      5 portas: KillSwitch/Trauma/Metabolismo/ReadOnly/Policy
2. AEC FSM (clinicalAssessmentFlow.ts)   13+ fases determinísticas
3. VERBATIM FIRST (V1.9.86)              ~46% bypass GPT em hard-lock phases
4. AEC GATE V1.5 (V1.9.95-A reforçado)   Bloqueia agendamento durante AEC ativa
5. GPT-4o-2024-08-06 / gpt-4o-mini       Só chamado se nada acima resolveu
6. PÓS-PROCESSAMENTO                     Strip tokens, validate UUID, force tags pós-AEC
7. PIPELINE ORCHESTRATOR                 REPORT→SCORES→SIGNATURE→AXES→RATIONALITY→DONE
```

*Discrepância conhecida: `cos_engine.ts` diz "v1.0" mas Magno selou v5.0 em 04-06/02/2026. É v5.0.*

## Fonte de verdade de racionalidades (CRÍTICO — cristalizado 18/05 pós-V1.9.330-A)

Sistema mantém **duas fontes paralelas** com propósitos diferentes (divergência **controlada**, não acidental):

| Fonte | Propósito | Quem lê | Otimização |
|---|---|---|---|
| `clinical_reports.content.rationalities` (JSONB) | **Source de UI** — snapshot displayável | Frontend (ClinicalReports.tsx, PDF, share) | Latência, formato display, imutabilidade do que paciente viu |
| `clinical_rationalities` (TABELA) | **Espelho analítico** — KPIs, pesquisa, RAG interno | Analytics (v_clinical_cycle_health), service RAG (rationalityAnalysisService linha 322) | Query, agregação, JOIN |

**Estrutura empírica `content.rationalities`** (audit PAT 26/05 noite): é **OBJECT** com chaves por tipo (`biomedical`, `integrative`, `homeopathic`, `traditionalChinese`, `ayurvedic`), NÃO array. Empírico em 143 reports: 48 NULL / 95 object / 0 array. Comparação direta `jsonb_array_length(...) vs COUNT(*) clinical_rationalities` é **inválida** (granularidade diferente — jsonb por tipo, tabela por instância). Pra medir drift correto: `jsonb_object_keys(content->'rationalities')` em jsonb × `rationality_type` na tabela.

**Schema empírico tabela `clinical_rationalities`**: `id, report_id, patient_id, rationality_type, assessment (text COM PII), recommendations (jsonb), considerations, approach, generated_by, created_at, updated_at`. **Campo `assessment_excerpt` não existe** — campo real é **`assessment`**.

### Regra de ouro

**Nunca derivar UI paciente de tabelas analíticas de racionalidade. Sempre derivar de `clinical_reports.content.*`.**

Inversão futura desta regra exige migração explícita documentada com:
1. Trigger SQL replicador (source → projection)
2. Plano de reconciliação dos 112+ rows históricos
3. Validação cross-source antes do cutover

### Contrato de divergência controlada (não eliminação)

Aceitamos que jsonb e tabela divergem por design. Governar o COMO:

- **Edge tradevision-core** (linhas 1716+2272) escreve só na tabela → racionalidade aparece em analytics ANTES de aparecer na UI (latência aceitável)
- **Service rationalityAnalysisService.saveAnalysisToReport** (linha 539) escreve nos 2 sequencialmente (jsonb UPDATE + tabela UPSERT) → falha de uma não rollback a outra
- **Frontend** lê apenas jsonb (snapshot do que paciente viu naquele momento)
- **Analytics** lê apenas tabela (estado atual normalizado)

### Antes de qualquer feature que toque rationalities — checklist

```
□ Feature lê de jsonb OU de tabela?
□ Se lê de tabela mas serve UI paciente → BLOQUEIO. Use jsonb ou migra fonte explicitamente.
□ Feature escreve em jsonb? Em tabela? Em ambos?
□ Se escreve só em 1: divergência ESPERADA ou ACIDENTAL?
□ Se divergência esperada: documentar contrato (qual fonte, por quanto tempo, reconciliação)
□ Migration aditiva em tabela mexe em campo que UI lê do jsonb? → propagar trigger
□ Backfill SQL direto numa fonte → executar simétrico na outra OU documentar drift aceito
```

Memórias completas: `feedback_dual_write_contract_jsonb_vs_tabela_18_05.md` + `project_v1_9_330_audience_contract_design_18_05.md`.

## Fonte de verdade do RAG da Nôa (CRÍTICO — cristalizado 20/05 audit Sprint 1)

Sistema mantém **DUAS bases de conhecimento separadas POR DESIGN**. NÃO MIGRE entre elas sem ler V1.9.318:

| Fonte | Propósito | Quem lê | Onde aparece |
|---|---|---|---|
| `public.documents` (41 rows) | **Acervo institucional** — UI Base de Conhecimento da IA Residente | Frontend UI admin (`/profissional/dashboard?section=conhecimento`) | Cards com botões Ver/Baixar/Desvinc/Excluir |
| `public.base_conhecimento` (5 rows) | **RAG curado HAND-CRAFTED** — entries minimalistas que protegem contra DOC_LIST hijacking | Edge `tradevision-core` linha ~4862 (`.from('base_conhecimento').or(queryFilters).limit(3)`) | Quando GPT puxa contexto em chat clínico/Matrix |

### Por que separadas (anti-padrão histórico)

**V1.9.308 (16/05/2026)** adicionou busca paralela em `documents` ao bloco RAG. **V1.9.318 (17/05/2026) REVERTEU empiricamente** porque:

- GPT começou a interpretar "analise este relatório" como "ele quer ver documentos"
- Emitia `[DOCUMENT_LIST]` e devolvia lista de PDFs em vez de raciocínio clínico
- Bug: 1 caso isolado em 16+ dias ANTES → 6 casos em 21h DEPOIS de V1.9.308

**Aprendizado cristalizado**: **RAG não é só banco de conhecimento — RAG molda comportamento cognitivo do sistema**. Engrossar `base_conhecimento` com docs brutos altera prior implícita do GPT sobre intenção do usuário.

### Regra de ouro

**NUNCA migrar `documents.content` → `base_conhecimento.conteudo` em massa.** As 5 entries hand-crafted (`noa_identidade`, `metodologia_aec`, `sistema_imre`, `kb-curso-aec`, `kb-protocolo-cbd`) são proteção empíricamente validada contra DOC_LIST hijacking.

### Quando expandir RAG real (gatilho futuro)

Se Matrix Z2 precisar corpus expandido empíricamente (médico reclamar de RAG raso DEPOIS de beta 20-30):
- **Opção B parqueada**: criar `base_conhecimento_pesquisa` (tabela separada)
- Edge Matrix faz UNION com `base_conhecimento` original
- Chat clínico NÃO toca a segunda tabela
- Boundary explícita preserva V1.9.318

### Antes de qualquer feature que toque RAG — checklist

```
□ Feature lê de documents OU base_conhecimento?
□ Se lê de base_conhecimento: respeita .limit(3) do Edge?
□ Se migra documents → base_conhecimento: LEU V1.9.318? Há mitigação contra DOC_LIST?
□ Conteúdo migrado é >50k chars? → vai estourar TOKEN MGMT V1.9.61 (60k cap)
□ Doc é institucional ou paciente individual? → cases vai pra patient_documents, NÃO documents
□ Trigger empírico ocorreu (médico pediu RAG maior)? Ou é "salto" especulativo?
```

### Cases LGPD (cristalizado 20/05 quarentena Atestado Marco Tanus)

Categoria `cases` em `public.documents` representa **anomalia arquitetural** — doc clínico individual vazou pra tabela institucional. Solução de quarentena:
- `is_published = false`
- `isLinkedToAI = false`
- `target_audience = []`
- `category = 'cases_lgpd_quarantine'`
- Arquivo preservado no Storage (audit trail LGPD)

Próximos docs clínicos individuais devem ir pra `patient_documents` (RLS por `patient_id`).

Memórias completas: `audit_pendencias_um_mes_pos_pbad_20_05.md` (Sprint 1) + memory princípio `feedback_rag_molda_comportamento_cognitivo_20_05` (a ser criada).

## Stack

| Camada | Tecnologia |
|---|---|
| Front | React 18 + TypeScript + Vite + Tailwind + shadcn/ui |
| Front deploy | Vercel auto-deploy on push |
| Backend DB | Supabase Postgres (project `itdjkfubfzmvmuxxjoae`) |
| Backend functions | 10 Supabase Edge Functions (Deno) — após cleanup 28/04 |
| Auth | Supabase Auth (email apenas — Google deployed mas não usado) |
| IA Chat | OpenAI `gpt-4o-2024-08-06` |
| IA Escriba (V1.9.84) | OpenAI `gpt-4o-mini` (temperature 0.1) |
| Email | **Resend** (`RESEND_API_KEY` + `RESEND_FROM_EMAIL=noreply@medcannlab.com.br`) — domínio verified 28/04, envia pra externos OK |
| Vídeo | **WiseCare V4H** (`session-manager.homolog.v4h.cloud` — ⚠️ HOMOLOG) |
| Calendar | Google Calendar (sync via `sync-gcal` — 💤 dormindo completo, audit 18/05) |
| Origem histórica | App nasceu na **Lovable** (no-code), CORS de send-email permite `*.lovable.app` |
| Repos | hub (`amigo-connect-hub`) + origin (`medcannlab5`) |

## Edge Functions (14 ativas — atualizado 26/05 pós-V1.9.455 audit Management API)

```
🟢 CORE / FUNCIONAIS
  tradevision-core              v415  Core IA Nôa principal (6697 linhas)
  digital-signature             v65   Assinatura digital ICP-Brasil/CFM (3 levels)
  sign-pdf-icp                  v18   PBAD AD-RB ICP-Brasil CONFORME ITI (V1.9.299 LOCK)
  cert-encrypt-password         v3    Cripto password p/ cert ICP do médico
  wisecare-session              v78   Provedor vídeo V4H (HOMOLOG, migrar)
  extract-document-text         v59   OCR via pdfjs-serverless
  send-email                    v59   Resend
  video-call-request-notification v59
  video-call-reminders          v28   Sweep mode + cron 5min + Resend (V1.9.99-B)
  generate-nft-from-report      v3    NFT consent peça-a-peça (V1.9.311)
  renal-signal-extractor        v1    Sidecar renal DRC (V1.9.307)
  get_chat_history              v8    ⚠️ Slug snake_case (≠ kebab), audit 26/05 — caller a investigar

💤 FEATURE DORMINDO COMPLETA (Google Calendar integration) — audit 18/05
  google-auth                   v26   ← Edge OAuth Google (tabelas existem agora, vazias)
  sync-gcal                     v26   ← Edge cron (tabelas existem agora, vazias)
                                  Schemas professional_integrations + integration_jobs
                                  criados V1.9.99-B (28/04). 0 rows, 0 callers
                                  frontend/backend. Reativar requer só chamadas
                                  frontend. Decisão Pedro 18/05: manter intocado
                                  (drift dev pré-PMF aceitável). NÃO é mais
                                  "half-implemented" strict.
```

*Cleanup 28/04 ~10h45*: Edge `video-call-request-notification-` (v23, duplicata com hífen) deletada. Backup em `.backups/`. Trigger duplicado `trg_handle_new_auth_user` em auth.users dropado. Edge `video-call-reminders` v52 deletada (P9) → reintroduzida elite v53/v3 com sweep mode + cron + Resend.

*Adições pós-V1.9.299 (16-18/05)*: `sign-pdf-icp` + `cert-encrypt-password` (PBAD ICP-Brasil), `generate-nft-from-report` (V1.9.311 NFT consent), `renal-signal-extractor` (V1.9.307 sidecar DRC).

*Audit 26/05 (Management API)*: total real **14 Edge Functions ativas** (descoberto `get_chat_history` órfã não documentada, caller a investigar — provavelmente legacy V1.9.84 Escriba). 5 triggers em auth.users.

*Vetor segurança FECHADO V1.9.457 (26/05)*: `sign-pdf-icp` Edge v19 agora valida Authorization header obrigatório + resolve user via `auth.getUser(token)` + ownership check (`document.professional_id === user.id` OR admin OR SERVICE_ROLE_KEY bypass). Algoritmo PBAD AD-RB integralmente preservado (lock V1.9.299 intocado). Smoke 1+2 validados (401 sem auth e com ANON_KEY role=anon).

## Cron Jobs ativos (pg_cron — catalogado 26/05 noite pós-audit empírico)

3 cron jobs registrados em `cron.job` (extension `pg_cron` v1.6.4):

| jobname | schedule | comando | telemetria |
|---|---|---|---|
| `video-call-reminders-5min` | `*/5 * * * *` | `net.http_post` → Edge `video-call-reminders` (V1.9.99-B sweep+Resend) | rodando OK desde 28/04 |
| `monthly-closing-medcannlab` | `0 3 1 * *` (dia 1 do mês às 3h) | `SELECT public.process_monthly_closing()` — chama `calculate_monthly_ranking` + `grant_benefits_rewards` (**gamification**) | **0 runs ainda** — cron criado após dia 1/05; primeira execução prevista **01/06/2026 03h BRT** |
| `expire-renal-suggestions` | `0 2 * * *` (todo dia 2h) | `UPDATE renal_inline_suggestions SET status='expired' WHERE pending AND expires_at < now()` | rodando OK diariamente, mas empíricamente vazio (1 row total tabela — Maria das Dores 14/05) |

**Telemetria agregada `cron.job_run_details` últimos 7d**: 2.023 runs, **100% succeeded**, last_run 26/05 18:20 BRT.

**⚠️ Atenção `monthly-closing-medcannlab` — gamification dormindo**: memory `project_veredito_final_24_04` documentou *"gamification DESABILITADA por feature flag"*. Cron chama `calculate_monthly_ranking` + `grant_benefits_rewards` mesmo assim. **Verificar empíricamente em 02/06/2026** após primeira execução: se populou `gamification_points` indevidamente → desativar cron via `SELECT cron.unschedule('monthly-closing-medcannlab')` até reativar feature explicitamente. Pré-condição checklist: revisar definição de `calculate_monthly_ranking` + `grant_benefits_rewards` para confirmar se honram feature flag interno.

## Cadência mínima `clinical_qa_runs` (cristalizado 26/05 noite — princípio operacional, não código)

`clinical_qa_runs` é a tabela do **PMF Audit Framework** Memo 28/04 — desenhada V1.9.85 (27/04) com 17 colunas ricas: `verdict + verdict_score + log_findings + db_findings + code_findings + green_facts + yellow_hypotheses + orange_interpretations + red_blindspots + system_version + notes + metadata`. **Cobertura empírica audit 26/05**: 1 row / 133 reports assináveis = **0,75%**. Última execução **27/04** (Claude rodou formal V1.9.85 score 75 "parcial"). Framework existe mas **não virou processo**.

### Cadência mínima proposta

1. **1 QA run por nova versão V1.9.X que toca código clínico** (AEC FSM / Pipeline / Verbatim / signature / RAG) — não toda versão, só as que afetam pirâmide 8 camadas
2. **1 QA run quinzenal num report aleatório** — rotação Claude/Pedro/Ricardo executando
3. **1 QA run OBRIGATÓRIA pré-Marco 2 em report do 1º paciente externo pagante** — instrumenta baseline antes da escala real

**Custo**: ~1h Claude + ~30min review humano = ~1h30min por run. Cadência mínima ~2/mês ≈ 3h/mês overhead. Pré-PMF aceitável.

**Risco de NÃO fazer**: chegada Marco 2 sem baseline empírico de validação clínica = recurso fica indemonstrável para investidor / regulador / 2º médico independente. Memo 28/04 frase âncora: *"Crítico instrumentar AGORA. Quando paciente externo entrar, baseline já existe pra comparação."*

**Trigger pra ativar cadência formal**: próxima versão V1.9.X que tocar AEC FSM ou Pipeline, OU 14/06/2026 (quinzena), o que vier primeiro. Cristalizar `feedback_clinical_qa_runs_cadencia_minima_26_05` quando 2ª run rodar empíricamente (anti-cristalização-prematura).

## REGRA HARD §1 (constitucional, anti-kevlar)

**"Consentimento ≠ Agendamento"** — `concordo` durante revisão clínica nunca dispara agendamento. Apenas `sim/autorizo` à pergunta literal de consentimento (`isAskingConsent` guard em `tradevision-core/index.ts`) fecha AEC.

Mudanças que afetam Constituição/RACI/contratos clínicos exigem **nova versão do Livro Magno** — não mudar diretamente no código.

## Pipeline Diário → Magno (princípio meta-arquitetural)

```
HIPÓTESE → EXPERIMENTO → VALIDAÇÃO → CRISTALIZAÇÃO
(diário)   (sprint)      (uso real)   (Livro Magno)
```

- **Diário** (`DIARIO_*.md` na raiz) = laboratório operacional, WIP, registra tudo
- **Memórias persistentes** (`~/.claude/projects/.../memory/`) = aprendizados intermediários
- **Livro Magno** (`docs/LIVRO_MAGNO_*.md`, 5 versões) = museu do que sobreviveu, **só absorve o que provou valor empírico repetível**

**NÃO atualize o Livro Magno por capricho** — só quando algo evoluído provar-se lei (~3-6 semanas de uso real sem regressão).

## Quem é quem

```
SÓCIOS (4 — corrigido 28/04, antes tinha 3 + classificação errada do João)
  Pedro Henrique Passos Galluf    UUID 17345b36 (admin) + d5e01ead (paciente teste)
                                  passosmir4@gmail.com — tech lead, orquestrador COS
  Dr. Ricardo Valença             UUID 2135f0c0 (professional REAL) + 99286e6f (admin)
                                  Nefrologia/CKD — criador do método AEC
                                  Camadas 0-2 da pirâmide (clínico)
  Eduardo Faveret                 admin coordenador eixo Ensino
                                  Neurologia
  João Eduardo Vidal              cbdrcpremium@gmail.com (admin) + jevyarok@gmail.com (teste)
                                  Lado institucional / parcerias / governo / regulatório
                                  Destrava CNPJ → gatilho de timing pra auth_user_id remap

USUÁRIOS TESTE
  Carolina Campello   UUID 5c98c123 — conta teste do Ricardo, NÃO paciente real

ROLES RBAC (4 enums em app_role)
  admin (5) | profissional (13) | paciente (30) | aluno (1)

PACIENTES EXTERNOS PAGANTES: ZERO (pré-PMF)
```

## Diretório de memórias persistentes

```
Desktop atual (Pedro 18/05):
  ~/.claude/projects/c--Users-phpg6-Desktop-amigo-connect-hub-main/memory/
Laptop equivalente:
  ~/.claude/projects/c--Users-phpg6-OneDrive-Imagens-amigo-connect-hub-main/memory/
```

**179 arquivos de memória** (cresceu de 30+ em abril pra 179 em 18/05). Sempre ler `MEMORY.md` (índice no nível 1) ao iniciar sessão. Memórias críticas:

- `project_lock_v1995_aec_relatorio_agendamento.md` — estado do cadeado atual
- `project_pipeline_diario_para_magno.md` — princípio meta-arquitetural
- `project_estado_28_04_2026_pos_lock_v1997.md` — snapshot mais recente
- `reference_supabase_estado_total_28_04_2026.md` — banco completo
- `reference_edge_functions_catalogo_completo.md` — 11 Edge Functions
- `reference_cheatsheet_supabase_operacional.md` — comandos comuns
- `feedback_polir_nao_inventar.md` — Princípio 8
- `feedback_gotchas_conhecidos_27_04.md` — 7 anti-padrões validados
- `project_regra_consentimento_nao_e_agendamento.md` — REGRA HARD §1
- `project_3_features_half_implemented_p0.md` — P0 funcional pendente

## Princípios operacionais identificados (12 cristalizados)

1. **REGRA HARD §1** — consentimento ≠ agendamento (4 camadas de defesa)
2. **Anti-kevlar §1** — Constituição só muda via nova versão Magno
3. **Princípio 8** — polir, não inventar (reutilizar mecanismo equivalente antes)
4. **Defense in depth** — validação em runtime > confiança em prompt/UI
5. **Princípio de Grounding factual** — GPT NUNCA responde número factual sem fonte autoritativa
6. **Push dual-remote 4 refs** — 2 remotes × main + master, sempre (naming varia por máquina: laptop=hub+origin, desktop=amigo+medcannlab5 — validar com `git remote -v`)
7. **Método de validação 5 etapas** — logs + DB + código + classificação 🟢🟡🟠🔴 + review humano
8. **Action_cards `role='system'` não chamam Core** — early return em sendMessage
9. **UUID nunca tem fallback de slug** — `isValidUuid` antes de qualquer DB op
10. **Separar fontes e calibrar** (🟢🟡🟠🔴) — não misturar Supabase atual / código antigo / narrativa
11. **Eventos explícitos** — gatilhos com consequência real = clique, não inferência LLM
12. **Least data exposure** — remover campos desnecessários de queries públicas

## Cuidados conhecidos (gotchas)

- `selectedSlot` no widget de agendamento é **ISO completo** (`"2026-04-27T14:00:00+00:00"`), não `HH:MM`. Não fazer `.split(":")` nele.
- Tabela `chat_messages_legacy` (15 rows) tem **nome enganoso** — é a CANÔNICA hoje. `chat_messages` (vazia) é shell planejada.
- `prescriptions` tem 8 rows mas é **vulnerável historicamente** — RLS já fechado em V1.9.97-D. Use `cfm_prescriptions` (32 rows oficiais) pra modificações.
- 4 tabelas de perfil existem (`users`, `user_profiles`, `profiles`, `usuarios`) — **`users` é canônica** (38 cols, escrita diariamente). Outras são órfãs/legacy.
- Build local quebra por `dompurify` (em `node_modules` vazio), Vercel passa porque tem em `package.json`.
- 2 Edge Functions Google Calendar dormindo completas (tabelas EXISTEM agora, vazias, sem caller — audit 18/05 atualizou status de "half-impl" → "dormindo intencionalmente").
- 72 files órfãos no bucket `documents` (~67 MB) de owners deletados — LGPD compliance pendente.
- `chat-images` storage **fechado em V1.9.98 (28/04)**: bucket `public=false`, 4 policies Opção B (owner OR participante de mesma chat_room via JOIN), AdminChat usa `createSignedUrl` TTL 1 ano. Imagem antiga (1 teste do Pedro) não carrega mais via URL pública direta — impacto zero.
- Discrepância `users (30)` vs `user_profiles (35)` — 5 órfãos, investigar antes de deletar.

## Convenções específicas do projeto

- **Versionamento**: V1.9.X — incrementar a cada commit cirúrgico. Sub-letras (V1.9.97-A/B/C) pra fixes relacionados num mesmo ciclo.
- **Commits**: PT-BR informal, prefixo convencional (`fix(escopo)`, `docs(diario)`, `feat`). Co-author obrigatório `Claude Opus 4.7 (1M context) <noreply@anthropic.com>`.
- **Diários**: criar `DIARIO_DD_MM_2026_*.md` na raiz. Estrutura por blocos (A, B, C...), com frase âncora ao fim.
- **Migrations**: padrão `YYYYMMDDHHMMSS_v1_9_XX_descricao.sql` em `supabase/migrations/`.
- **Princípio "polir não inventar"**: antes de criar código novo, **buscar mecanismo equivalente que já existe** no codebase. Reutilizar > criar paralelo.
- **Validação empírica**: smoke-test via Supabase Management API (RPC test + cleanup) antes de declarar feature pronta.

## Modelos de classificação (4 categorias pra decidir destino de módulos)

```
🟢 CORE        Intocável, só bugfix. AEC + Pipeline + Signature + Verbatim + Gate + RACI
🟡 SUPORTE     Manter, simplificar. Escolher 1 caminho e matar resto (chats, prescriptions, perfis)
❄️ LATENTE     Pausado por foco — voltar quando AEC estabilizar. NÃO deletar, NÃO evoluir, documentar
❌ DESCARTÁVEL Cortar com coragem. Duplicatas óbvias, tabelas mortas
```

## Métricas reais (snapshot 27/04 4h, validadas via Supabase API)

```
7 AECs completas          141 Verbatim bypass (46.2%)
38 reports signed_hash    164 chamadas GPT-4o
3 appointments            1.396.254 tokens consumidos
305 interações Core       ~$1.40 USD/h (~$0.60/AEC)
```

## Backlog priorizado atual (atualizado 26/05 pós-V1.9.455 deploy + audit 360°)

```
🔴 P0 (segurança/funcional)
  • Migrar WiseCare homolog → produção (provider vídeo)
  • V1.9.452 sanitize `assessment` em clinical_rationalities
    (LGPD reforço — empíricamente visto vazamento nome 25/05 smoke Carolina + audit
    PAT 26/05 confirmou 4/5 rows recentes com nome completo: Maria das Dores Pinto
    Pitoco / Carolina Campello do Rêgo Valença / "O paciente, Pedro";
    campo real é `assessment` text, NÃO `assessment_excerpt` como backlog antigo
    dizia; fix vai em service `rationalityAnalysisService.saveAnalysisToReport`
    linhas 575+603 reusando `pseudonymizePatientReferences` V1.9.407 — princípio
    polir-não-inventar; pré-Marco 2 obrigatório; trigger: pacientes externos reais;
    risco MÉDIO de mutilação clínica se sanitização agressiva — smoke obrigatório)

🟡 P1 (polish pré-escala)
  • V1.9.451 function calling Edge (lookup_patient_status + get_appointments_summary)
    — gap empírico Ricardo caso Gilda + filtragem agenda mês (24/05 noite)
  • V1.9.456 QR Code visual embedded no PDF gerado pela Edge sign-pdf-icp
    — exige smoke ITI completo (openssl asn1parse + validar.iti.gov.br + diff binário
    vs V12 aprovado); mexe no lock V1.9.299 (Edge), risco MÉDIO; design em
    [[project_v1_9_455_qr_code_embedded_pdf_design_25_05]] PARTE D
  • 5 aec_assessment_state in_progress órfãs (Illa 22/05 / Pedro 22/05 / Thiago 05/05
    21d / Solange 27/04 30d / João Eduardo 25/05) — decisão Ricardo
    (retomar/cancelar/invalidar com motivo); hoje sem UI pra médico
  • 2 forum_posts pending_review — conselho (Ricardo/Eduardo) aprovar/rejeitar
  • Edge get_chat_history (v8 ACTIVE descoberta 26/05) — investigar caller frontend
    OU deprecate se órfã

✅ RESOLVIDO HOJE (26/05)
  • V1.9.455 exam_request PDF ICP wiring (PARTE B+C) — commit 1c71ef3, tag
    v1.9.455-exam-pdf-wiring. Caso João Guimarães 25/05 + 14 docs legacy
    backfill (11/12 sucesso, 1 fail graceful Gilda médico legacy sem cert).
    Sistema saiu de 2/17 docs com PDF binário (12%) pra 13/17 (76%).
    Núcleo V1.9.299 PBAD AD-RB CONFORME ITI integralmente preservado.
  • V1.9.457 Edge sign-pdf-icp auth + ownership (anti-abuso ANON_KEY) —
    commit d19cc83 merge f90f346 (branch feature/v1_9_457_jwt_validation),
    Edge v19 deployada. Smoke pós-deploy: SMOKE 1 (sem auth) + SMOKE 2
    (ANON_KEY role=anon) ambos retornam 401 ✅. Algoritmo PBAD AD-RB
    integralmente preservado (lock V1.9.299 intocado). V1.9.455 PARTE C
    auto-invoke continua funcionando (supabase.functions.invoke injeta
    session JWT user automático → ownership pass).

✅ RESOLVIDOS empíricamente no mês (mantido pra rastreio)
  • RLS chat-images → V1.9.98 (28/04)
  • 72 files órfãos bucket documents → REFUTADO audit 360° 22/05 (0 órfãos de owners deletados)
  • 3 Edge Functions half-implemented → audit 18/05 (Google Calendar dormindo intencional)
  • V1.9.97-B timezone agenda → coluna time without time zone = BRT (gotcha conhecido)
  • V1.9.99 grounding factual da Nôa → V1.9.453+A+B Matrix Z2 anti-alucinação cobre
  • Instrumentação custo OpenAI → V1.9.238 já em produção (audit Lovable 26/05 noite
    refutado): metadata em ai_chat_interactions tem 11 chaves (model + pricing_version
    + prompt_tokens + completion_tokens + total_tokens + cost_usd_estimate + provider
    + processing_time + sanitized + simbologia + system). 792 rows empíricos em 14d.
    Custo agregado 7d mensurado: $5.96 USD / proj R$ 120/mês. Latência 4.7-12s
  • RPCs SECURITY DEFINER sem search_path → REFUTADO audit Lovable 26/05 noite (0
    RPCs sem SET search_path; 100% tabelas com RLS ON; 42/447 policies "permissivas"
    são todas catálogo público legítimo OR service role inserts internos)

🤝 Decisões humanas pendentes (destravam ~50% do roadmap)
  • CNPJ João Vidal (Marco 1) — destrava recebimento direto / pricing / parcerias
  • WhatsApp Faveret + Manual v1.1 (Marco 3) — sócio-médico abandonou 19 dias 05/05
  • 2º médico independente real (Marco 2)
  • 20-30 pacientes externos pagantes (PMF declarável)
  • Onda 2/3 Ricardo (gap GPT-first arquitetural)
  • TRL com Eduardo Faveret (7 tabelas zeradas — ativar pós-Marco 3)
  • Monetização (subscription_plans cadastrados, 0 ativos — depende CNPJ)
```

## Avisos finais

- **Não confunda `role=paciente` do Pedro no DB com seu papel real** (é só conta de teste/demo). Pedro é o tech lead.
- **Não trate diários antigos como Magno provisório** — são camadas diferentes (laboratório vs museu).
- **Quando em dúvida sobre prioridade**: AEC core é intocável, P0 segurança vem antes de polish, decisões humanas destrava 50% do roadmap.
- **Sempre push 4 refs** mesmo em commits de docs.
- **Racionalidades MTC/Homeopatia/Ayurveda não são feature paciente até V1.9.330-FULL** (Audience Contract completo). V1.9.330-A (commit `bfc7c19`, 18/05) é hotfix UI que esconde texto bruto do paciente; sistema ainda tem dual-write não-formalizado entre `clinical_reports.content.rationalities` (jsonb) e `clinical_rationalities` (tabela). Não anunciar essas racionalidades em material institucional/landing/WhatsApp Ricardo até design completo. Ver memórias `project_v1_9_330_audience_contract_design_18_05` e `feedback_dual_write_contract_jsonb_vs_tabela_18_05`.
- **Dual-write contract pendente em `clinical_rationalities` ↔ `clinical_reports.content.rationalities`**. Antes de QUALQUER feature que toque uma dessas (migration aditiva, novo prompt, edição via UI), decidir contrato de reconciliação (tabela canônica vs jsonb canônica vs cron reconciliação). Hoje fontes "concordam por coincidência" — qualquer mudança pode introduzir drift silencioso. Checklist 7 perguntas na memory `feedback_dual_write_contract_jsonb_vs_tabela_18_05`.
