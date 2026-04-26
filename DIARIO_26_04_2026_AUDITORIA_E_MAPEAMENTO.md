# Diário 26/04/2026 — Auditoria 360° + Mapeamento Completo

> Continuação do `DIARIO_25_04_2026_RLS_AUDIT_E_PLANO_3_MODOS.md` (selado em 25/04 ~23h BRT).
>
> Sessão começou madrugada de 26/04 (~02:30 BRT) e continuou até manhã (~9h-12h BRT).
>
> Selo principal: [`SYSTEM_STATE_SEAL_2026-04-26.md`](./SYSTEM_STATE_SEAL_2026-04-26.md). Mapa completo: [`MAP_FULL_2026-04-26.md`](./MAP_FULL_2026-04-26.md).

---

## Bloco A — Madrugada (02:30-04:00 BRT)

### Entregas técnicas

| Versão | O que entregou | Status |
|---|---|---|
| **V1.9.72** | Cap `patientData` via whitelist por fase em `tradevision-core` + log telemetria `payload_size_v1_9_72` em `noa_logs` | ✅ Em prod (commit `4606e50`, telemetria validada às 02:27 BRT) |
| **V1.9.73** | Migration `clinical_reports` adiciona `signature_hash` + `signed_at` + `signed_payload`. Code Core calcula SHA-256 do payload congelado server-side e persiste após `REPORT_GENERATED` | ✅ Em prod (migration via Management API + commit `23aef36`). Aguarda 1º report novo pra disparar |
| **xlsx CDN** | Substituído `^0.18.5` (npm registry, sem patch) por `xlsx-0.20.3` da CDN oficial SheetJS. 1 vuln high resolvida. Versão pinada (não `latest`) pra evitar lock drift | ✅ Em prod (commit `af428c3`) |

### Documentação produzida

- `ENGINEERING_RULES.md` (5 regras, originadas das lições 25-26/04)
- `SYSTEM_STATE_SEAL_2026-04-26.md` (10 seções):
  - **Seção 0**: Estado de segurança P0 (acrescentado por sugestão GPT — sistema funcional ≠ seguro pra produção externa)
  - Seção 1: Snapshot real do banco às 02:30 BRT
  - Seção 2: Causalidade do incidente OpenAI (V1.9.55 → 400 → 429)
  - Seção 3: Sistema funcional 12h sem GPT (prova de robustez do fallback)
  - Seção 4: Coerência diários × banco
  - Seção 5: Features inconsistentes — não mexer sem decisão Ricardo
  - Seção 6: Ordem obrigatória próxima sessão (Etapa 1 → 2 → 3)
  - Seção 7: Auditoria 360° síntese (~30 achados P0-P3)
  - Seção 8: Frases-âncora (banco realidade + auth define quem vê)
  - Seção 9: Histórico V1.9.66-73
  - **Seção 10**: Princípio de timing arquitetural (anti-regressão) — "sem dado real, qualquer arquitetura nova é fé, não engenharia"

### Auditoria 360° (5 frentes paralelas)

5 agents paralelos auditaram: Supabase backend / Edge Functions não-Core / Frontend / CI+segurança+deps / Observabilidade+testes+DR.

**Resultado**: ~30 achados catalogados P0/P1/P2/P3 com esforço estimado.

**Gaps mais graves (P0):**
- Service_role JWT hardcoded em 6+ arquivos commitados (bypass total RLS)
- 2 PATs Supabase antigos hardcoded em scripts
- Auth permissivo: senha mín=6, sem HIBP, autoconfirm=true, sessões eternas, MFA `allow_low_aal=true`
- `uri_allow_list` contém `localhost:3000` em prod (open redirect)
- `google-auth` aceita `state` injetando `user_id` sem HMAC (CSRF)
- `tradevision-core` deploya com `--no-verify-jwt` (S4 conhecido)
- 17 vulns npm (4 critical, 4 high)

**Estimativas em dev focado:**
- Produção segura mínima: ~3-5 dias
- Aceitar pacientes externos pagos: ~8-12 dias
- Elite escalável (10x usuários sem refactor): ~18-27 dias = ~4-6 semanas

---

## Bloco B — Manhã (~9h-12h BRT)

### Erro de processo (registrado pra não repetir)

**Tentei remover `@xenova/transformers`** baseado em Grep raso ("zero importações em src/"). Build quebrou imediatamente — existia cadeia completa `App.tsx → AIDocumentChat → ragSystem → localLLM → @xenova/transformers`. Reverti em 1min via `git checkout package-lock.json` + `npm install`. Estado restaurado, zero dano em prod.

**Lição registrada** em memória persistente (`feedback_dep_removal_protocolo`): antes de remover qualquer dep, executar `Grep amplo SIMPLES` + `npm ls <pkg>` + **`npm run build` como smoke test obrigatório**.

### 3 correções importantes do Pedro (sequência cronológica)

1. **"0 alunos cadastrados ≠ feature morta"** — em produto nascendo, infra pré-uso parece morta se medida só por dados em prod
2. **"A frente educacional está ativa OU pra ser ativada"** — não é hipótese, é produto sendo construído
3. **"Teacher está dentro do Core como prompt, faz parte do simulador e teste"** — não é role, é TEACHING_PROMPT em `tradevision-core:3664`

Cristalizadas em 2 memórias persistentes (`feedback_uso_zero_nao_e_morto` + `project_modo_teacher_e_prompt_no_core`).

### Investigação AIDocumentChat

Resultado banco confirmou:
- 14 documentos categoria `ai-documents` (não 0)
- **TODOS uploaded por Ricardo** entre nov/2025 e mar/2026 (currículo, Italo Calvino, Nascimento da Nôa, papers CB1/CKD, OMS IA)
- **ZERO embeddings** (xenova nunca processou)
- Página `AIDocumentChat` (`/ai-documents`) NUNCA acessada por usuário
- Sem entry pelo menu/sidebar

**Reclassificação:** AIDocumentChat NÃO é morta — é **infraestrutura pré-uso** da camada IA educacional (Nôa "estudando" bibliografia pra responder no curso AEC R$300 e outros).

### Mapeamento exaustivo

**Supabase 100%** (via Management API):
- 128 tabelas em 9 clusters lógicos (corrige memórias antigas que diziam 127)
- 335 functions (memórias antigas diziam 90+ — 3.7x mais)
- 423 policies (memória antiga: 380+)
- 27 views, 77 triggers, 8 enums
- 79 MB / 8GB tier free (~1%)

**Frontend** (via Agent Explore):
- 4 terminais completos: paciente / profissional / admin / aluno
- ~120 rotas em `App.tsx`, agrupadas em 3 eixos transversais (Clínica / Ensino / Pesquisa)
- Aluno tem 8 tabs + 3 eixos expandíveis (UI completa)
- "Teacher" sem UI dedicada (só prompt Core)

**Edge Functions** (via Agent Explore):
- 9 totais: tradevision-core, send-email, digital-signature, wisecare-session, google-auth, sync-gcal, video-call-reminders, video-call-request-notification, extract-document-text
- 6 ATIVAS, 3 DORMENTES (video-call-reminders, video-call-request-notification, extract-document-text)
- 3 jornadas críticas mapeadas: paciente AEC, profissional racionalidade, aluno simulador

### Descobertas grandes

| # | Descoberta |
|---|---|
| 1 | **6 cursos cadastrados**: 2 publicados (Pós Cannabis + Cidade Amiga dos Rins) + 4 em dev (AEC R$299, Pós Cannabis Premium R$2999, IMRE Triaxial R$199, Intro R$99) |
| 2 | **Framework TRL** (Technology Readiness Levels) com 8 tabelas — sistema sofisticado de competência educacional |
| 3 | **Modo "teacher"** = TEACHING_PROMPT no Core (não role no banco) |
| 4 | **3 features-fantasma reclassificadas** como provável código de cursos pagos em construção (AEC R$300 → ClinicalAssessment.tsx; IMRE Triaxial R$200 → 4 motores legacy; AIDocumentChat → camada IA educacional) |
| 5 | **Persistência do aluno = ZERO** (Simulador/Teste de Nivelamento rodam só na memória do GPT, dado perdido ao fim da sessão) |
| 6 | **`generated_slides_archive`** tem 412 rows — backup dos slides "lixo" que apagamos em 23/04 (categoria `slides` em `documents`) |
| 7 | Pedro tem 2 contas (admin + paciente teste). Ricardo idem. Documentado com mapeamento completo de roles |
| 8 | **`patient_medical_records`: 3493 rows** (volume desconhecido antes — prontuário ativo) |

---

## Bloco C — Estado atual ao fim do dia (~12h BRT)

### O que está commitado em prod (4 remotes sincronizados)

```
af428c3 chore(deps): vendor xlsx via SheetJS CDN (npm version unmaintained)
1c82eba docs(seal): adiciona AIDocumentChat (cadeia xenova) na Secao 5 - feature morta
be5bf89 docs(seal): adiciona Secao 10 - principio de timing arquitetural
b77fe70 docs: selo estado do sistema 26/04 + ancora em engineering rules
23aef36 feat(core): assinatura de integridade SHA-256 por relatorio V1.9.73
ace130f docs(diario): selar diario 25/04 com madrugada 26/04 (V1.9.72 + 3 camadas)
4606e50 fix(core): cap patientData via whitelist por fase + log payload V1.9.72
8c4e103 docs: ENGINEERING_RULES.md + memoria arquitetura 3 camadas
9614fa1 fix+docs: V1.9.71 deflate-raw + diario completo + IMRE escalado
aafdf13 fix(aec): fechar ciclo persistencia terminal V1.9.70
```

### Pendências aguardando OK explícito

1. **DELETE row admin do `rrvalenca@gmail.com`** em `user_roles` — Pedro pediu casualmente, mas é mudança no banco (mesmo princípio "destrutiva precisa autorização" + governança Ricardo)
2. **Decisão Ricardo sobre direção próximo ciclo** — Frente A (pacientes externos) / B (educacional vendável) / Híbrido
3. **Decisão Ricardo sobre 3 features-fantasma** (depende da escolha A/B/C)
4. **Ricardo recarregar OpenAI** — bloqueia validação V1.9.72/73 (último 429 = 02:27 BRT 26/04)

### Memórias persistentes adicionadas (6)

| Arquivo | Tipo | Função |
|---|---|---|
| `feedback_dep_removal_protocolo.md` | feedback | Protocolo `npm run build` ANTES de `npm uninstall` |
| `feedback_uso_zero_nao_e_morto.md` | feedback | "Validar contra produto/negócio antes de classificar morto" |
| `project_supabase_real_state_26_04.md` | project | Números reais (128/335/423) corrigem memórias antigas |
| `project_cluster_educacional_ativo_26_04.md` | project | 6 cursos + TRL + AlunoDashboard. GAP: persistência aluno |
| `project_features_fantasma_reclassificadas_26_04.md` | project | Conexão das 3 com cursos pagos. NÃO deletar sem Ricardo |
| `project_modo_teacher_e_prompt_no_core.md` | project | TEACHING_PROMPT em Core:3664. Sem UI. Sem persistência |

---

## Bloco D — Caminho pra polimento + ligar tudo + escala elite pro

### Plano em 5 fases (com 3 ajustes finos validados via GPT review)

```
FASE 1 — SEGURANÇA P0 (3-5 dias) — não depende de OpenAI
├─ Rotacionar service_role JWT
├─ Rotacionar 2 PATs Supabase antigos (sbp_0a39…, sbp_bf17…)
├─ ⚠️ REVOGAR tokens antigos APÓS gerar novos (não só adicionar — fechar porta antiga)
├─ Toggles Auth: senha 12+ / HIBP on / autoconfirm off / sessions 8h+30min / MFA mandatory admin
├─ Limpar uri_allow_list (tirar localhost)
├─ Buckets MIME whitelist + size limit
├─ Branch protection main + status checks required
└─ Fechar S4 (tradevision-core --no-verify-jwt → JWT obrigatório)

FASE 2 — VALIDAÇÃO V1.9.72/73 (Ricardo recarregar OpenAI + 24-48h telemetria)
├─ Query payload_size_v1_9_72: média < 15k, pico < 25k
├─ Query signature_hash: 100% reports novos assinados
└─ Decisão Ricardo sobre 3 features-fantasma (ativar/refatorar/deletar)

FASE 3 — ATIVAR CLUSTER EDUCACIONAL (1-2 semanas)
├─ ⚠️ ORDEM: Persistência ANTES de UX/IA (criar tabela educational_assessments PRIMEIRO)
├─ Logs cobrindo Simulador/Teste antes de qualquer refactor de prompt
├─ Refatorar AIDocumentChat → pgvector + OpenAI embeddings (OU deletar se Ricardo confirmar)
├─ Decidir destino "Sistema IMRE Triaxial" curso (4 motores legacy = base ou novo código?)
├─ ClinicalAssessment.tsx → AEC página dedicada do curso AEC R$300 (ou deletar)
├─ Sidebar aluno conectada com 6 cursos
└─ TRL framework alimentado (criar 1º programa piloto)

FASE 4 — POLIMENTO + ESCALA (2 semanas)
├─ Bundle splitting (4.7MB → < 1MB inicial via React.lazy + Suspense)
├─ ErrorBoundary nas rotas + retry/fallback UI
├─ Índices: user_interactions (96.8% seq scan), noa_logs (100% seq scan), clinical_reports
├─ 17 → ~5 vulns (xenova decidido + axios npm overrides + restantes)
├─ Health endpoint
├─ ⚠️ correlation_id propagando: frontend → edge → banco (rastreabilidade ponta-a-ponta)
├─ Sentry/observability + 6 métricas mínimas
├─ E2E Playwright destrava (credenciais CI)
├─ TSC + ESLint + Husky pre-commit no CI
└─ Singletons refactor (6 cruzando sessões)

FASE 5 — PRÉ-LAUNCH (1 semana)
├─ Smoke test cada terminal (5: paciente/profissional/admin/aluno/master)
├─ Runbooks operacionais (OpenAI down, Supabase quota, RLS denial)
├─ Stress test (volume de pacientes externos esperado)
├─ Plano de comunicação aos primeiros pagantes externos
└─ Release candidate v2.0.0

TOTAL: ~6-8 semanas focadas pra produção escala elite pro.
```

### Os 3 ajustes finos incorporados (do GPT review)

1. **Fase 1 — Revogar tokens antigos APÓS rotação** (não só gerar novos — sem revogar, porta antiga fica aberta)
2. **Fase 3 — Persistência ANTES de UX/IA** (criar tabela `educational_assessments` PRIMEIRO, logs depois, só então refactor de UX/prompt). Senão repete erro atual: UI pronta sem backend real
3. **Fase 4 — `correlation_id` propagando frontend → edge → banco** (hoje impossível rastrear sessão ponta-a-ponta)

### Princípio de timing reforçado (Seção 10 do selo)

**NÃO implementar router/cache/intent classifier antes de validar V1.9.72/73 com 24-48h de tráfego real.** Sem dado, arquitetura é fé, não engenharia.

### Decisão estratégica que Pedro vai apresentar pro Ricardo

> *"Ricardo, frente educacional é mais real do que imaginava. 6 cursos cadastrados, TRL framework, terminal aluno completo, modo teacher funcional. MAS: zero alunos ativos, simulador/teste não persistem, IA educacional não conectada. Diagnóstico: produto em construção com infraestrutura avançada (~70%) e operação ainda baixa (~5%). Decisão estratégica: Frente A (pacientes externos pagantes, ~2-3 sem) / B (educacional vendável, ~4-6 sem) / C (Híbrido). Decisões técnicas (limpar features, remover libs) dependem dessa escolha. Não avancei nisso por segurança."*

---

## Frase-âncora consolidada do dia

> *"Banco é a realidade. Auth define quem pode ver a realidade. Validação contra produto define o que vale existir nessa realidade."*

---

## Histórico de versões hoje

- V1.9.70 (25/04 noite): FSM terminal persistence + COMPLETED resume
- V1.9.71 (25/04 noite): extract-document-text deflate-raw fix
- **V1.9.72** (26/04 madrugada): cap `patientData` via whitelist por fase + telemetria
- **V1.9.73** (26/04 madrugada): assinatura SHA-256 server-side de relatórios
- xlsx vendored via CDN SheetJS (parte do hardening de deps)

---

*Diário gerado em 2026-04-26 ~12h BRT. Continuação direta do `DIARIO_25_04_2026_RLS_AUDIT_E_PLANO_3_MODOS.md`. Próxima sessão deve ler este + `SYSTEM_STATE_SEAL_2026-04-26.md` + `MAP_FULL_2026-04-26.md` antes de qualquer ação técnica.*
