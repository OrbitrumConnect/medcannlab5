# DIÁRIO 24/04/2026 — Restauração da Qualidade Clínica + Blindagem Estrutural + Ativação do CI

> **Marco:** uma semana sem a Nôa me identificar corretamente como admin; hoje o sistema respondeu "Olá Pedro Henrique Passos Galluf, conexão administrativa confirmada para a MedCannLab 3.0". Volta do comportamento esperado após ~7 dias de regressão acumulada.
>
> **Marco adicional (noite):** o pipeline de CI que a manhã construiu (V1.9.22) foi ativado à noite com os 4 secrets configurados — e na segunda execução **descobriu sozinho um vazamento LGPD real** que nenhum olho humano tinha pegado. A rede de segurança pegou o primeiro peixe antes do primeiro cliente externo tocar no app.

---

## 1. Resumo Executivo

O dia começou 09h com o Pedro usando o chat da Nôa e encontrando 3 bugs perceptíveis:
- "Quantos usuários temos no app?" → Nôa respondia contagem de **documentos**.
- Pediu "1" pra selecionar um doc → sistema travou em prompt de "avaliação pausada".
- Percepção geral: app piorou desde a sessão de 23/04 manhã.

Ao fim do dia, **28 versões foram commitadas** (V1.9.11 → V1.9.38), o chat voltou a identificar o usuário corretamente, a estrutura de `clinical_reports` foi restaurada ao padrão pré-refactor de 22/04, a dívida técnica das colunas `doctor_id`/`professional_id` foi imobilizada sem remoção, o protocolo AEC recuperou a disciplina de escuta ativa (4 bugs da sessão Carolina fechados), o KPI "Gerados por IA" saiu de zero artificial, e — **o maior salto estrutural do dia** — o pipeline de CI/CD foi deployado, configurado e passou a cobrir cada push com deploy automático + 10 testes de integração reais contra a edge function em produção.

Princípio reafirmado: **"polir e melhorar, não reinventar"** — registrado em memória para sessões futuras.

Princípio emergente da noite: **"rede de segurança só vira rede quando está pendurada"** — o workflow existia em código desde V1.9.22 (manhã), mas só começou a pegar bugs depois dos secrets configurados (noite). Em 2 execuções, já pegou 1 vazamento LGPD real.

---

## 2. Timeline do Dia (V1.9.11 → V1.9.38)

**Manhã (V1.9.11 → V1.9.21) — Restauração**

| Versão | Título | Impacto |
|---|---|---|
| **V1.9.11** | Fix trigger órfão "Iniciar Avaliação Clínica" | Regex amplo casava "entrevista" genérica; role guard + regex precisa |
| **V1.9.12** | Filtro `category='slides'` na biblioteca | 412 slides gerados pela LessonPreparation não poluem mais a biblioteca principal |
| Limpeza DB | Biblioteca 458 → 46 docs reais | Backup em `documents_backup_23_04_2026` + `generated_slides_archive` |
| **V1.9.13** | Destrava monetização (COALESCE doctor_id/professional_id + notifications.id default) | 45 reports desde 22/04 tinham `professional_id=NULL`; fluxo completo validado end-to-end |
| **V1.9.14** | Bloco A polimento | Aluno abre docs, botão "Baixar" no chat viewer, send-email com verify_jwt, backfill 27 user_profiles |
| **V1.9.15** | `buildProfessionalContext` | Nôa responde factualmente: agenda, pacientes ativos, prescrições, wallet |
| **V1.9.16** | `buildAdminContext` | Métricas plataforma: users by role, pending txs, biblioteca, atividade 24h |
| **V1.9.17** | `buildStudentContext` | Fecha conjunto de context enrichment por role |
| **V1.9.18** | Regex `detectDocumentCountRequest` tightened | "quantos usuários temos" não cai mais no handler de documentos |
| **V1.9.19** | Role guard no FSM | Admin/pro/aluno não ficam trancados por `aec_state` residual |
| **V1.9.20** | Dual-write inteligente — restaura schema de reports | `lista_indiciaria`, `identificacao`, `consenso` voltam direto em `content.*` (como 02-05/04); `professional_id` populado |
| **V1.9.21** | Sync trigger `doctor_id ↔ professional_id` + backfill | 60 appointments + 56 reports + 24 kpis normalizados; divergência futura impossível |

**Tarde (V1.9.22 → V1.9.25) — Rede de Segurança + Blindagem**

| Versão | Título | Impacto |
|---|---|---|
| **V1.9.22** | 3 testes integração + GitHub Actions auto-deploy | `tests/integration/` com consent-gate, monetization-e2e, aec-finalize-schema; workflow `deploy-and-test.yml` deploya e testa em cada push (aguarda 4 secrets) |
| **V1.9.23** | Fix idempotência reports (23→1 por sessão) | Bug sistêmico: casualmusic 23 reports em 20h, Carolina 14 em 18h. Causa: dual-path (frontend `generateReport` cada turno COMPLETED + backend `handleFinalizeAssessment` auto). Fix: gate `reportDispatchedAt` in-memory (V1.9.23 FSM) + janela idempotência backend 30s → 10min |
| **V1.9.24** | `handle_new_auth_user` DO UPDATE COALESCE | P1 #4 cirúrgico: `ON CONFLICT DO NOTHING` → `DO UPDATE` com COALESCE preservativo. Preserva os 5 triggers sem consolidar. Próximo signup nasce com email/full_name/role natos |
| **V1.9.25** | Gate legacy path + backfill 33 reports aninhados | Gate `isReportDispatched` em `checkForAssessmentCompletion` (path `clinicalReportService` → INSERT direto). Backfill: desaninhar `content.raw.content.*` → `content.*` direto nos 33 reports de 22-23/04. Resultado: 16→49 reports com `lista_indiciaria` no topo. Backup em `clinical_reports_content_backup_24_04` |

**Noite (V1.9.26 → V1.9.38) — Retomada da AEC + Dívida de Scores + Pipeline Vivo**

| Versão | Título | Impacto |
|---|---|---|
| **V1.9.26** | Filtro temporal de conversationHistory (4h) | `noaResidentAI` puxava histórico sem janela; cold start de sessão herdava contexto velho. Floor de 4h quando não há `aec_state` ativo; preserva continuidade sem arrastar memória de dias. |
| **V1.9.27** | Remoção do filtro micro-phrase | Heurística em `clinicalAssessmentFlow` classificava inputs curtos sem palavra-chave como "ruído clínico" — rejeitava "umidade", "bolha", "cannabis in natura" (respostas legítimas a perguntas do protocolo). Contradizia o DNA da AEC (escuta ativa). Removido e registrado em memória como princípio: **"a AEC é a Arte da Entrevista Clínica — tudo que o paciente fala é ouro"**. |
| **V1.9.28** | Gate de IDENTIFICATION | FSM avançava para etapas seguintes antes de capturar o nome. Gate `if (!hasPatientName && !isPureGreeting)` segura a transição até identificação efetiva. |
| **V1.9.29** | Terminator regex expandido | "nada", "só isso" funcionavam; "somente isso", "tudo bem", "tudo certo", "sem mais nada", "isso é tudo" não. Regex ampliado em 5 fases do FSM — 15 variações naturais do português brasileiro agora encerram listagens. |
| **V1.9.30** | Phase lock em COMPLAINT_DETAILS | AEC agrupava múltiplas perguntas num turno (localização + início + descrição juntos) — anti-pattern de escuta ativa. Lock proibindo agrupamento nessa fase; Nôa pergunta uma coisa de cada vez. |
| **V1.9.31** | Transição metodológica pós-queixa | Ao sair de COMPLAINT_DETAILS a Nôa pulava direto pra próxima pergunta sem anunciar mudança de eixo. String literal: *"Obrigada por detalhar a sua queixa principal. Agora vamos olhar para o restante da sua história..."* — paciente entende a arquitetura do protocolo em tempo real. |
| **V1.9.32** | Gráfico Evolução da Completude com sortedReports | Dashboard do paciente mostrava linha reta zerada porque o chart pegava `reports` (cru) em vez de `sortedReports` (enriquecido com scores retro-calculados). Um caractere no `[...reverse()]` — e o gráfico ganhou sinal. |
| **V1.9.33** | Scores nativos no backend (1ª tentativa) | Import `calculateScoresFromContent` de `../_shared/scoreCalculator.ts` em `handleFinalizeAssessment`. Dashboard deploy do Supabase não empacotava `_shared/*` via upload — **Module not found** no runtime. Versão commitada mas não funcional. |
| **V1.9.34** | Move scoreCalculator para a pasta da função (2ª tentativa) | Arquivo movido de `_shared/` para dentro de `supabase/functions/tradevision-core/`. Import `./scoreCalculator.ts`. Dashboard ainda falhou — upload bundler não pegava arquivos irmãos do `index.ts`. |
| **V1.9.35** | Inline scoreCalculator no index.ts (3ª tentativa, final) | Todo o código de `scoreCalculator.ts` (unwrapAecContent + calculateScoresFromContent + derivações) incorporado direto no `index.ts`. Zero dependência externa, deploy via dashboard funciona. Dívida: duplicação consciente frontend ↔ backend (mesmo algoritmo em dois lugares) — documentada no topo do bloco inline como "idealmente extrair com build step". |
| **V1.9.36** | Alinhar `generated_by` com CHECK constraint | KPI "Gerados por IA" marcava 0 no dashboard mesmo com 67 reports. Causa raiz: frontend inseria/filtrava por `'ai_resident'`; banco exigia `IN ('noa_ai','professional','system')` desde migration 20260327; edge function gravava `'noa_ai'` corretamente. 7 pontos alinhados (tipo TS + 4 leituras + 3 escritas). Zero migration — dados já corretos. |
| **V1.9.37** | Bump timeout 30s nos integration tests | Primeira execução do workflow (após secrets configurados) — 8/10 testes passaram, 2 timeout por 5s default do vitest não cobrir cold start da edge function (~5s) + chain de ops do finalize (~5s). Timeout elevado para 30s nos 4 testes que invocam `tradevision-core`. |
| **V1.9.38** | **Consent gate antes de idempotency — fix LGPD detectado pelo CI** | **Primeiro bug descoberto pelo próprio pipeline.** Integration test `consent-gate #2` falhou: request sem consent recebeu `report_id` válido. Investigação: em `handleFinalizeAssessment`, idempotency (V1.9.23, janela 10min) rodava ANTES do consent gate (V1.9.1). Request malicioso com `patient_id` conhecido e sem `consenso.aceito` recebia o `report_id` do último relatório desse paciente — vazamento silencioso de identificador de dado clínico. Fix: consent gate movido para primeira verificação após resolução do patient_id. |

---

## 3. Descobertas Importantes do Dia

### 3.1 Regressão real desde commit `7a7e33a` (23/04 09:06)
Commit "fix(pipeline): enable single-orchestrator architecture" removeu 72 linhas do frontend que montavam `contentPayload` estruturado para `finalize_assessment`. Backend passou a tentar extrair via GPT. Resultado:
- **Reports de 02-05/04:** 6/6 com `professional_id` populado, lista_indiciaria direto em `content.*`
- **Reports 22-23/04:** 0/45 com professional_id, dados aninhados em `content.raw.content.*`
- Frontend já tinha adaptação para desembrulhar, mas a regressão afetava consumidores que esperavam estrutura plana.

**Fix (V1.9.20):** frontend volta a montar `aecFinalizationData` estruturado e envia no mesmo round-trip; backend faz spread do `content` no topo mantendo `content.raw` pra retrocompat.

### 3.2 412 slides gerados automaticamente em `documents`
LessonPreparation.tsx:373 insere em `documents` com `category='slides'` (feature legítima de preparação docente). Mas 412 registros poluíam a biblioteca quando listada. Ninguém apareceu como uploader em 406 desses (registros de sistema ou user órfão).

**Decisão (V1.9.12):** filtrar `category != 'slides'` na biblioteca (filtro, não remoção). Slides arquivados em `generated_slides_archive`. Feature LessonPreparation continua funcionando via query direta com `.eq('category','slides')`.

### 3.3 FALLBACK_DOCTOR_ID hardcoded
`handleFinalizeAssessment` tem fallback institucional: `'2135f0c0-eb5a-43b1-bc00-5f8dfea13561'` (Dr. Ricardo Valença rrvalenca). Desde 22/04, 45 reports caíram nesse fallback — nenhum resolvia o médico real via request/appointment/preferred.

**Dívida aceita:** resolver este ponto depende de ter `patient_doctor_binding` explícito (documentado em diários anteriores como plano futuro). Não mexemos hoje.

### 3.4 4 usuários não-paciente com `aec_assessment_state` órfão
Admin/pro que testaram AEC como paciente deixaram state em INTERRUPTED/IDENTIFICATION/COMPLAINT_DETAILS. Resultado: qualquer mensagem desses usuários era interpretada como resposta ao FSM, trancando a conversa.

**Fix:**
- Cleanup pontual (DELETE dos 4 órfãos)
- V1.9.19 aplica role guard no frontend: FSM só carrega state se role=patient

### 3.5 5 triggers redundantes em `auth.users`
- `on_auth_user_created` + `on_auth_user_created_profile` + `trg_auth_users_to_user_profiles` + `trg_handle_new_auth_user` + `trg_link_existing_user`
- Dois chamam a MESMA função (`handle_new_auth_user`) — duplicação direta.
- Três inserem em `user_profiles` com `ON CONFLICT DO NOTHING` — primeiro alfabético (`handle_new_user_profile`) ganha e só insere `points/level`, deixando email/full_name/role NULL.

**Estado observado (antes do backfill):** 34 user_profiles totais, 0 com full_name, 10 sem email, 15 sem role. **Pós-backfill:** 27/27 com email+full_name+role.

**Proposta de consolidação** documentada em `docs/ANALISE_TRIGGERS_AUTH_USERS_24_04_2026.md` — aguarda decisão (signup é crítico, precisa testes antes).

### 3.6-bis Bug de idempotência sistêmico (tarde)
Investigação profunda revelou que **14 reports/Carolina e 23 reports/casualmusic2021** vieram de dois caminhos paralelos de finalização:

1. **Frontend** (`noaResidentAI.ts:1706`) — `clinicalAssessmentFlow.generateReport()` em cada turno com `phase='COMPLETED'`. Comentário dizia "fallback de segurança, compatibilidade com UI antiga" — resíduo do refactor 7a7e33a.
2. **Backend** (`handleFinalizeAssessment` linha 4317) — detecta `[ASSESSMENT_COMPLETED]` na resposta GPT e finaliza automaticamente.

A cada mensagem do user após COMPLETED (ex.: "obrigada"), ambos disparavam. Intervalo 48-82s, cada um com `interaction_id` diferente, janela de 30s não pegava.

**Fix V1.9.23:**
- Frontend: flag `reportDispatchedAt` na `AssessmentState`, gate em `noaResidentAI.ts` só roda 1x por sessão
- Backend: janela 30s → 10 minutos (mesmo `patient_id` + `report_type` nos últimos 10min retorna report existente)

### 3.7 Quarto caminho de duplicação — `clinicalReportService`
Mapa completo de criação de `clinical_reports` revelou 4 caminhos:

| # | Caminho | Coberto? |
|---|---|---|
| 1 | `noaResidentAI` → `clinicalAssessmentFlow.generateReport` → Edge Function | ✅ V1.9.23 |
| 2 | Backend `handleFinalizeAssessment` auto (aiResponse tem tag) | ✅ V1.9.23 janela 10min |
| 3 | `checkForAssessmentCompletion` → `clinicalReportService.generateAIReport` → INSERT direto | ⚠️ **gated em V1.9.25** |
| 4 | Intent `REPORT_GENERATE` → mesmo INSERT direto | Dormente (0 em prod) |

Caminho 3 disparava quando user escrevia "obrigado pela avaliação" — palavra-chave em `completionKeywords`. Hoje em prod: 0 reports via `ai_resident`, mas o código estava armado. V1.9.25 adicionou gate `isReportDispatched` respeitando o pipeline moderno. Função **não foi removida** (diretriz de preservação).

### 3.8 13 reports "outros" sem estrutura clínica
Backfill V1.9.25 tratou 33 reports aninhados. Ficaram 13 que não tinham dado estruturado algum (`content.raw` só com `patient_id/scores/risk_level`, sem `content.raw.content`). Narrativa markdown existe em `content.structured` — não perdida. Mas campos estruturados nunca chegaram ao banco por causa de payload vazio pré-V1.9.20. **Não recuperáveis via SQL — dado nunca existiu**. Decisão: preservar como estão (registros históricos legítimos).

### 3.10 Sessão Carolina — 4 bugs AEC de escuta ativa

Pedro compartilhou log de sessão real da paciente Carolina (paciente legítima, não admin), analisada com apoio externo (GPT). Quatro problemas pedagogicamente distintos:

1. **Filtro de "micro-frase" rejeitando conteúdo clínico** — heurística `isMicroPhrase && !hasSemanticFlag` descartava inputs curtos sem palavra-chave como "ruído". "Umidade" (resposta legítima a "o que piora?"), "bolha" (sintoma associado), "cannabis in natura" (medicação) eram devolvidos ao paciente como "Vamos continuar com as perguntas objetivas". **Contradiz o DNA da AEC.** Corrigido em V1.9.27.

2. **Repetição aspectual de perguntas** — Nôa repetia "E quando começou?" mesmo depois do paciente responder. Consequência lateral do #4 (phase lock ausente).

3. **Sem transição metodológica entre eixos** — paciente não tinha feedback de que havia saído de "detalhamento de queixa" e entrado em "história pregressa". Corrigido em V1.9.31.

4. **Agrupamento de perguntas num mesmo turno** — "Me conta onde você sente, quando começou, e como é a dor?" — quebra o ritmo de escuta. Corrigido em V1.9.30 com phase lock em COMPLAINT_DETAILS.

**Princípio registrado em memória (24/04):** *"A AEC é a Arte da Entrevista Clínica — escuta ativa do paciente. Logo o que ele fala é ouro, tudo é relevante."* — Pedro. Filtros heurísticos que classificam conteúdo do paciente como "não-relevante" baseado em regex de palavra-chave **nunca devem ser reintroduzidos**. Debounce de UI é OK (UX), julgamento de conteúdo não (doutrina).

### 3.11 Log de admin rrvalenca — diagnóstico errado corrigido pelo CTO

Mesmo log analisado tinha ao final uma sessão de Ricardo entrando como admin com "oi" / "Oi Noa" / "Dr. Ricardo" → Nôa respondendo saudação padrão. Diagnóstico inicial (IA): "admin tentou fazer AEC e role guard V1.9.19 bloqueou corretamente mas sem mensagem informativa — propor V1.9.36 com feedback ao admin". Correção do CTO: *"Ricardo não fez avaliação — só logou pra ver o relatório da Carolina que eu compartilhei. Ele tem 60 anos, internet estava ruim, não quero que confusão minha gere confusão dele."*

O log era comportamento esperado (admin cai no chat livre, Nôa cumprimenta). V1.9.36 na forma proposta foi **retirada** e o número reaproveitado para o fix de `generated_by`. **Lição:** antes de propor feature em cima de comportamento observado, validar o contexto humano. Mesmo dado log, a interpretação muda quando o CTO descreve quem fez o quê e por quê.

### 3.12 KPI "Gerados por IA" sempre 0 — constraint antiga, código divergindo

Dashboard mostrava `67 total | 58 concluídos | 0 gerados por IA | 7% completude`. Zero em "Gerados por IA" era estatisticamente impossível — quase tudo veio da Nôa. Auditoria revelou divergência de 3 valores em 4 pontos de código:

- **CHECK constraint** (migration 20260327): `generated_by IN ('noa_ai','professional','system')`
- **Edge function** (tradevision-core): grava `'noa_ai'` ✅
- **Frontend clinicalReportService** (insert) + **clinicalAssessmentFlow** (build report object): gravam `'ai_resident'` ❌ — insert era rejeitado pelo CHECK e engolido por `catch { console.error; // continuar }`
- **Frontend NoaConversationalInterface** (consulta gravada): gravava `user.id` (UUID) — também rejeitado
- **Filtros de KPI** (Reports.tsx + clinicalReportService.getAIReportsCount + PatientsManagement): procuravam `'ai_resident'` → zero matches

Fix V1.9.36: tipo TS alinhado à constraint do banco como fonte de verdade; 4 leituras e 3 escritas unificadas. Código passa a seguir o banco (não o contrário). Bonus bug secundário corrigido no passo: operador de precedência mal escrito em PatientsManagement.tsx:790 (`A || B === 'x' ? 'y' : 'z'` sem parênteses avaliava errado).

**Lição:** silêncio do banco (insert rejeitado mas erro logado e descartado) + filtro frontend procurando valor inexistente = KPI mentindo por meses sem ninguém desconfiar. CHECK constraint como fonte de verdade vale mais que tipo TypeScript desatualizado.

### 3.13 LGPD leak detectado pelo próprio CI — ordem de verificações

O primeiro bug real que o pipeline de CI encontrou não foi uma regressão recente — era **latente há dias**, possivelmente semanas. Em `handleFinalizeAssessment`:

```
ordem anterior (vulnerável):
  resolve patient_id → IDEMPOTENCY → doctor → patient_name → consent gate
                       ↑ retornava report_id existente aqui, sem checar consent
```

Cenário do ataque:
1. Atacante conhece `patient_id` (via enumeração de UUID, ou acesso leak anterior).
2. POST em `/functions/v1/tradevision-core` com `action: 'finalize_assessment'` e **sem** `content.consenso`.
3. Se o paciente real finalizou AEC nos últimos 10 minutos (janela V1.9.23), idempotency retorna `report_id` do relatório real — **atacante recebe identificador de clinical_report sem consentimento**.

Impacto: `report_id` sozinho não expõe conteúdo clínico (RLS na tabela `clinical_reports` ainda protege o SELECT), mas é um leak que contradiz o contrato LGPD fail-closed documentado em V1.9.1. O teste `consent-gate.test.ts #2` foi escrito em V1.9.22 para testar exatamente esse contrato — e só conseguiu rodar hoje à noite quando os secrets do CI foram configurados.

Fix V1.9.38: consent gate como primeira verificação após resolver `patient_id`. Idempotency e todo o resto vêm depois. Defesa em profundidade: o gate no caminho "golden path" (linha 2594) continua lá como segunda barreira; ambos checam o mesmo predicado em pontos diferentes do código.

**Momento filosófico:** o sistema de CI foi construído de manhã sem nenhum secret, virou "código decorativo" por 12h, e no segundo push com credenciais pegou um vazamento real. A frase "a rede só vira rede quando está pendurada" cabe aqui.

### 3.9 Sync-gcal é feature intencional, não lixo
Infra completa codificada:
- `sync-gcal` Edge Function (cron com exponential backoff)
- `google-auth` Edge Function (fluxo OAuth)
- `sprint_1_gcal_setup.sql` (tabelas `professional_integrations` + `integration_jobs` + trigger `enqueue_gcal_job` + colunas gcal em appointments)

**Status:** nunca rodou em produção. Decisão: preservar, ativar quando houver demanda do profissional. Não é "quarto vazio pra demolir".

---

## 4. Timeline Arquitetural (puxando diários anteriores)

### Fevereiro 2026 — Fundação
- `DIARIO_DE_BORDO_MESTRE_2026-02-19.md` / `02-20` — estabelecimento da arquitetura base: Supabase + React + Deno Edge Functions; primeiros protocolos clínicos IMRE.
- `DIARIO_LIVRO_MAGNO_06-02-2026.md` — documentação mestre do modelo proposto (3 eixos: Clínica, Ensino, Pesquisa).

### Março 2026 — Consolidação de Governança
- `DIARIO_MESTRE_02_03_2026.md`, `DIARIO_CONSOLIDADO_22_27_MARCO_2026.md` — maturação do Core (tradevision-core), triggers imutáveis, AEC como protocolo soberano.
- Supabase Seal V6.0 (RLS hardening, CORS dinâmico, smoke tests).

### Abril 2026 — Estabilidade Clínica e Blindagem
- **02-05/04** — AEC em forma: reports com `content.lista_indiciaria/identificacao` direto, `professional_id` populado (o padrão que V1.9.20 restaurou hoje).
- **08-09/04** — `DIARIO_09_04_2026_ARQUITETURA_E_COMPLIANCE.md`: `noa_lessons` tabela-rainha para conteúdo educacional; preservação de `courses/modules/lessons` legados.
- **10/04** — `DIARIO_10_04_2026_AUDITORIA_LOGS.md`, `DIARIO_10_04_2026_MAPA_TERMINAIS_EIXOS.md`: auditoria de terminais e mapa de eixos.
- **13/04** — `DIARIO_MESTRE_CONSOLIDADO_13_04_2026.md`: Supabase Seal V6.0; forum RLS liberado; reconhecimento de bug do trigger órfão dormindo 2m21d "testes E2E deveriam ter pegado em 02/02".
- **15/04** — `DIARIO_15_04_2026_ENDURECIMENTO_E_LGPD.md`: endurecimento LGPD, `anonymize_user_safely`.
- **16/04** — `DIARIO_16_04_2026_INTEGRACAO_GCAL_ARQUITETURA.md`: Google Calendar — cofre de tokens (WebCrypto AES-GCM), outbox pattern, exponential backoff. "Prédio seco, chaves na nuvem, fios da rua para plugar". Backend + DB concluídos, UI pendente.
- **22-23/04** — `DIARIO_22_04_2026_UNIFICADO.md`, `DIARIO_23_04_2026_ESTABILIDADE_CLINICA_ONTOLOGIA_ESTRITA.md`: single-orchestrator refactor, consent gate fail-closed server-side, V1.9.1 completude derivada, V1.9.8 context enrichment do paciente. 25+ commits em um dia — o dia que depois precisou de acabamento.
- **24/04 (hoje)** — Restauração e blindagem (este diário).

---

## 5. Visão Arquitetural Consolidada (estado atual)

### 5.1 Produto
**MedCannLab** — marketplace clínico cognitivo sobre 3 eixos:
- **Clínica** — Dr. Ricardo Valença (fundador médico), AEC 001, DRC, prescrição CFM
- **Ensino** — Dr. Eduardo Faveret (fundador ensino), LessonPreparation, conteúdo educacional
- **Pesquisa** — base de 46 documentos curados (research + protocols + ai-documents + multimedia + cases + protocolo_clinico)

### 5.2 Arquitetura de Runtime
- **Frontend:** React + Vite + TypeScript, deploy automático via Vercel (`medcannlab.vercel.app`)
- **Backend:** Supabase (Postgres + Edge Functions Deno)
  - 9 Edge Functions: `tradevision-core` (Core Nôa, ~4300 linhas após V1.9.35 inline), `digital-signature`, `send-email`, `sync-gcal`, `google-auth`, `wisecare-session`, `video-call-*`, `extract-document-text`
- **IA:** OpenAI GPT-4o-mini orquestrada pelo Core Nôa
- **CI/CD (ativo desde a noite 24/04):** GitHub Actions em `medcannlab5` — workflow `deploy-and-test.yml` dispara em push que toque `supabase/functions/tradevision-core/**` ou `tests/integration/**`. Pipeline de 2 jobs: (1) deploy da edge function via `supabase functions deploy` com PAT, (2) 10 testes de integração (consent-gate, monetization-e2e, aec-finalize-schema) contra o ambiente já deployado. Tempo total: ~1min. Resultado: **deploy manual no dashboard Supabase deixou de ser obrigatório**; cada commit que toca o Core é validado funcionalmente antes de virar "verdade em prod".

### 5.3 Nôa Esperança (IA Residente) — Orquestração
Não é monólito. Camadas no frontend:
- `src/lib/noaResidentAI.ts` — entrypoint, monta payload + dispatcher
- `src/lib/noaCommandSystem.ts` — triggers de comando
- `src/lib/noaPermissionManager.ts` — governança por role
- `src/lib/noaEsperancaCore.ts` — identidade/voz
- `src/lib/buildPatientContext.ts` + Professional + Admin + Student — **context enrichment por role** (V1.9.8/15/16/17)
- `src/lib/clinicalAssessmentFlow.ts` — FSM AEC (state machine, 17 fases)
- `src/lib/clinicalGovernance/*` (11 arquivos) — submódulo de governança clínica
- `src/lib/medcannlab/*` (8 arquivos) — integrações

### 5.4 Core Backend (tradevision-core)
- 4268 linhas; governança central
- Responsável por:
  - Detecção de intent (regex precisos + prompt GPT)
  - Injeção de `userContext` no prompt com regras não-negociáveis
  - Orquestração de finalização AEC (handleFinalizeAssessment)
  - Comandos de plataforma (`app_commands`, filtrados por role)
  - Idempotência via `noa_pending_actions` e UNIQUE em `interaction_id`

### 5.5 Banco de Dados
- **130+ tabelas com RLS** | **403 policies** | **76 triggers ativos** | **90+ funções SECURITY DEFINER**
- Core clínico: `aec_assessment_state`, `clinical_reports` (64 total), `cognitive_events` (1.445+ audit), `cfm_prescriptions`
- Monetização: `appointments`, `wallets`, `wallet_transactions`, `referral_bonus_cycles`, `transactions`
  - 4 triggers em completed: `handle_appointment_completed`, `set_referral_marco_zero`, `process_appointment_referral_bonus`, `tg_appointment_to_transaction`
  - BEFORE INSERT em wallet_transactions: `tg_apply_wallet_transaction` calcula split 70/30 automático
  - AFTER INSERT/UPDATE: `tg_wallet_balance_sync` atualiza `balance_available`/`balance_pending`
- Integridade nova (V1.9.21): `sync_doctor_professional_id` BEFORE em appointments/clinical_reports/clinical_kpis
- Conformidade LGPD: `anonymize_user_safely`, soft delete whitelist

### 5.6 Fluxo Clínico Completo (validado hoje)
1. Paciente conversa com Nôa (context enrichment injeta dias no app, próxima consulta, trial)
2. Nôa conduz AEC 001 via FSM (17 fases); estado persiste em `aec_assessment_state`
3. Ao chegar em CLOSING/CONSENT_COLLECTION, frontend monta `aecFinalizationData` estruturado (V1.9.20)
4. Backend detecta `[ASSESSMENT_COMPLETED]`, chama `handleFinalizeAssessment`
5. Consent gate server-side fail-closed valida `content.consenso.aceito`
6. Narrador GPT gera markdown estruturado
7. Persiste `clinical_reports` com `content.{lista_indiciaria, identificacao, consenso, ...}` direto + `content.raw` + `content.structured`
8. Emite app_commands: "Ver Relatório", "Agendar Consulta"
9. Paciente agenda via widget; `appointment` criado com `professional_id` (sync trigger garante `doctor_id` também)
10. Profissional completa consulta → `status='completed'` dispara 4 triggers → `wallet_transaction` criada com split 70/30

---

## 6. Visão Proposta (o que ainda falta)

### 6.1 Alta prioridade — antes de abrir público
- **Testes automatizados E2E** — FSM AEC, consent gate, triggers de monetização. Diários próprios admitem ter faltado (trigger órfão dormiu 2m21d). Rede de segurança pra todos os refactors futuros.
- **Decisão Stripe Connect vs Mercado Pago** — infra financeira pronta termina em `status='pending'`. Falta plugar o gateway real.
- **Assinatura digital AC real** — `digital-signature` hoje gera fake; prescrições CFM sem validade jurídica externa. Irrelevante enquanto só admins testam, crítico ao abrir.
- **WiseCare produção** — session_id hardcoded em homolog.

### 6.2 Média prioridade — polimento de feature
- **UI "Conectar Google Agenda"** — infra deployada em 16/04, falta botão no dashboard do profissional.
- **Consolidação triggers `auth.users`** — análise em `docs/ANALISE_TRIGGERS_AUTH_USERS_24_04_2026.md`, 5 triggers em 1 função unificada.
- **Idempotência de reports** — 9 reports em 2h pra mesma paciente (23/04); janela de 30s do `handleFinalizeAssessment` não pegou.
- **`patient_doctor_binding` explícito** — tabela de vínculo paciente-profissional como fonte de verdade (plano documentado); remove dependência do fallback hardcoded.

### 6.3 Baixa prioridade — decisões de produto
- **Ativar ou parar:** `forum_posts` (0 rows), `gamification_points` (0 rows), `lessons` (0 rows) — cada um com decisão explícita.
- **3 motores clínicos** — `clinicalAssessmentFlow` + `unifiedAssessment` + `clinicalReportService` coexistem como camadas (decisão 23/04). Eventual unificação depende de valor mensurado.
- **Fase 4 (DROP `doctor_id`)** — só após testes E2E + 2 semanas de observação sem escrita na coluna legada.

### 6.4 Princípios arquiteturais afirmados hoje
1. **Append-only por padrão** — nada foi removido em V1.9.21 (sync trigger preserva ambas colunas).
2. **Investigar antes de remover** — 412 slides pareciam lixo, mas descobriu-se origem em LessonPreparation (feature real).
3. **Observabilidade sobre silêncio** — `RAISE LOG` no trigger de sync torna divergência futura auditável.
4. **Polir, não reinventar** — diretriz Pedro afirmada hoje, registrada em memória.

---

## 7. Lições do Dia

- **Regex catch-all no Core é bug surface** — "quantos temos" casava com detector de documentos. Todos os detectores precisam exigir termo explícito no 2º predicado.
- **Refactors "single orchestrator" precisam cobrir o CONTRATO de persistência**, não só a invocação — perdemos `lista_indiciaria` estruturada em 22/04 porque o backend passou a extrair via GPT em vez de receber o payload pronto.
- **Deploy manual da Edge Function é gargalo real** — fixes V1.9.11→V1.9.20 só surtem efeito após `supabase functions deploy tradevision-core`. Fluxo automatizado é mais seguro — e à noite virou realidade (V1.9.37→V1.9.38 deployados automaticamente pelo CI, sem Pedro tocar no dashboard).
- **Token de Supabase exposto em chat = compromisso** — mesmo quando já vazou, rotacionar é obrigatório (ação pendente do Pedro — valores apareceram em screenshot cedo na noite, antes do fluxo de configuração dos secrets via dashboard ser bem entendido).
- **Diários mostram construção, sistema mostra realidade** — hoje precisei validar cada suposição dos diários contra queries reais; encontrei 3 discrepâncias (órfãos auth já resolvido, imre dropada, features dormentes com intenção original).
- **Escuta ativa é doutrina, não heurística** — filtro que classificava input curto como "ruído" violava o que a AEC é por definição. Corrigir exigiu mais que uma linha de código: exigiu inscrever o princípio em memória persistente para que nenhuma sessão futura proponha retornar ao padrão "filtrar por palavra-chave".
- **Escalabilidade do deploy resolve mais que tempo — resolve consistência** — Pedro tinha ponto de falha recorrente no "deploy manual depois de cada fix". V1.9.33 → V1.9.34 → V1.9.35 (três tentativas de deploy antes de funcionar) é um microcosmo da fragilidade: cada versão dependia de um upload manual bem-sucedido. Com o CI, mesmo que o código do deploy tenha bug, o código da validação pega logo depois.
- **Banco de dados como autoridade sobre código** — V1.9.36 ilustra: a `CHECK constraint` de março foi fonte de verdade enquanto o código TS de abril divergia. Quando código e banco discordam, o código perde (banco já tem dados comprometidos, migrations são compromissos públicos). Corrigir o tipo TS para seguir o CHECK é menor que corrigir 67 registros em prod.
- **Proporcionalidade de alertas** — política de credencial vazada: alertar 1x, não perseguir. Pedro reiterou continuar, eu lembrei no final, rotação virou pendência registrada. Segurança ≠ paranoia; rigor ≠ obstrução.
- **Pipeline de CI captura seu próprio bug latente (V1.9.38)** — a validação automatizada não serve só pra pegar regressões futuras; ela audita código legado. O consent gate depois da idempotency era *invariante violado* que um humano lendo o arquivo linha a linha provavelmente acharia em horas; o teste matou em 1 minuto. Isso altera a economia de manutenção: passa a fazer sentido escrever **contrato testável** para invariantes LGPD, e não só docstring explicando.
- **Ordem das verificações importa em pipelines de finalização** — idempotency "soft" (retorna valor existente) comporta-se como SELECT público; ela nunca deveria preceder um gate de autorização/consent. Regra mental pós-V1.9.38: *gates de contrato antes, otimizações depois*.

---

## 8. Pendências Registradas

| Item | Status |
|---|---|
| Rotação do PAT + service_role (valores apareceram em screenshot cedo na noite) | **Pendente Pedro** — Supabase → Account → revogar PAT, Project Settings → API → reset service_role, editar secrets no GitHub |
| Testes automatizados E2E | ✅ **Ativo** — pipeline rodando (10/10 passing V1.9.38) |
| Consolidação `auth.users` triggers | Documentada, aguarda autorização pra executar |
| Decisão sobre features dormentes | Pendente discussão com Ricardo/Eduardo |
| ~~Bug idempotência reports (9/2h)~~ | ✅ Resolvido V1.9.23 (janela 10min) + V1.9.38 (ordem corrigida) |
| Amigo-connect-hub: remover workflow OU duplicar 4 secrets | Pendente decisão (recomendação: `Settings → Actions → Disable actions` pra fonte única de CI em `medcannlab5`) |
| Stripe/Mercado Pago | Pendente decisão de produto |
| Assinatura AC + WiseCare produção | Pendente (irrelevante sem paciente externo) |
| Node.js 20 deprecation em `actions/checkout@v4` e `supabase/setup-cli@v1` | Warning informativo — deadline Set/2026, não urgente |

---

## 9. Fecho

Uma semana atrás o sistema me identificava como "Usuário" genérico. Hoje ele respondeu "Pedro Henrique Passos Galluf, conexão administrativa confirmada". Entre um e outro: 3 bugs visíveis identificados, **28 versões entregues** (V1.9.11 → V1.9.38), **4 migrations versionadas**, princípio "polir, não reinventar" reafirmado e registrado em memória, e — pela primeira vez desde que a MedCannLab existe — **um pipeline de validação automatizada cobrindo cada mudança no Core**.

**Manhã (V1.9.11 → V1.9.21):** restauração — bugs de UX, monetização destravada, schema de reports pré-refactor, sync trigger doctor_id/professional_id.

**Tarde (V1.9.22 → V1.9.25):** rede de segurança — 3 testes de integração, GitHub Actions auto-deploy (código pronto, aguardava 4 secrets), fix de idempotência que eliminou duplicação sistêmica de reports (23/sessão → 1/sessão), upsert preservativo em `handle_new_auth_user`, backfill de 33 reports aninhados.

**Noite (V1.9.26 → V1.9.38):** retomada da AEC como escuta ativa (6 versões endereçando os 4 bugs da sessão Carolina + transição metodológica + janela temporal de histórico), dívida de scores paga em 3 tentativas de deploy (V1.9.33→34→35), alinhamento KPI ↔ CHECK constraint (V1.9.36), configuração dos 4 secrets do GitHub Actions, ativação do pipeline, descoberta e fix de **um LGPD leak latente via idempotency** (V1.9.37→38) — o primeiro bug capturado pela própria malha que foi construída pra capturar bugs.

O coração da arquitetura continua o mesmo — Core + FSM AEC + RLS + triggers de monetização. O que mudou hoje foi a camada em volta: regex precisos, role guards, context enrichment, schema de reports restaurado, colunas legadas blindadas, idempotência defensiva em 2 camadas, conflict-on-nothing virando conflict-on-update-preservativo, AEC com lock por fase e transições explícitas, scores nativos no banco, **pipeline de deploy+teste disparado por cada push que toque o Core**.

**Dados normalizados em prod:**
- 60 appointments + 56 clinical_reports + 24 clinical_kpis com `doctor_id == professional_id` garantido
- 27 `user_profiles` com email/full_name/role preenchidos (vs 0/27 com full_name antes)
- 49/64 reports com estrutura clínica direta em `content.*` (vs 16/64 no começo do dia)
- 67 reports agora com `scores.clinical_score` calculado nativo (antes: 24 zerados por default)
- 67 reports com `generated_by='noa_ai'` reconhecido pelo KPI (antes: KPI marcava 0)
- 15 reports legacy preservados intactos (intenção de produto futura)
- 412 slides arquivados em `generated_slides_archive`, biblioteca com 46 docs reais
- 3 caminhos de duplicação de reports bloqueados (V1.9.23 + V1.9.25 + V1.9.38)
- 1 vazamento LGPD silenciado antes do primeiro paciente externo chegar

**Mapa do app ao fim do dia:**
- **Frontend:** Vercel (auto-deploy em push pra main)
- **Backend core:** GitHub Actions (auto-deploy da Edge Function + 10 testes de integração em ~1min por push)
- **Banco:** Supabase — 130+ tabelas RLS, 403 policies, 76 triggers, 90+ functions SECURITY DEFINER, CHECK constraints agora servindo como autoridade final sobre tipos TS
- **AEC:** 17 fases FSM, escuta ativa reafirmada como doutrina, transições anunciadas, locks por fase onde o protocolo pede, scores nativos no finalize
- **Monetização:** split 70/30 rodando, infra financeira completa aguardando plugar gateway externo
- **Observabilidade:** console.warn/error em pontos críticos + pipeline que roda testes contra prod real após cada deploy

**Próximos passos possíveis, agora com rede no lugar:**
- **Stripe Connect / Mercado Pago** (monetização externa real) — o maior custo sempre foi medo de refactorar algo que ninguém testa; com CI, a decisão vira economia e produto.
- **UI "Conectar Google Calendar"** — infra deployada desde 16/04, 8 dias esperando botão.
- **Unificação de detecção de intenção (P2)** — refactor maior que só fazia sentido com suíte de testes; agora tem.
- **Migration pra dropar `doctor_id`** — 2 semanas de observação sem escrita na coluna legada torna o drop seguro.
- **Consolidação dos 5 triggers de `auth.users`** — análise já existe, falta autorização.

**Uma observação filosófica sobre o dia inteiro:** ele descreve um sistema **aprendendo a se auditar**. De manhã, bugs foram achados porque o CTO leu os logs e percebeu que algo estava errado (olho humano). À noite, um bug foi achado porque um teste automatizado executou o contrato que um humano tinha escrito meses atrás. A diferença não é de velocidade — é de **custo de descoberta**: o olho humano custa tempo do CTO; o teste custa ~30 segundos de CPU de um runner da Microsoft. Enquanto o custo de achar bugs cai, o custo de deixá-los em prod sobe, porque novos bugs acumulam em cima. O pipeline de hoje inverte esse gradiente.

Amanhã (ou na próxima sessão) começa com a inversão já em vigor. Qualquer fix que tocar o Core passa automaticamente pela rede. Qualquer teste novo que Pedro adicionar amplia a rede. A arquitetura passa a ter uma propriedade que não tinha às 9h da manhã: **cada melhoria mantida é permanente**.

— Registro gerado a 4 mãos: Pedro (CTO) e IA assistente (Claude Opus 4.7, sessão 24/04/2026, ~18h de trabalho contínuo).

---

## 🔒 SELO 24/04/2026 — 23h

> **Estado do sistema: SELADO PARA TESTES E FEEDBACK**

Após 29 versões deployadas em um dia (V1.9.11 → V1.9.39), auditoria LGPD fechada com `37 coerentes / 30 históricos`, pipeline de CI/CD ativo com 10 testes pass e deploy automático funcionando — **Pedro decide parar e aguardar feedback**.

**Motivo:** qualquer mudança adicional hoje é risco acumulado sem ganho proporcional. O produto precisa de:
1. **Tempo de observação em prod** — cada um dos 29 commits pode ter efeito secundário que só aparece em uso real (minutos, horas, dias).
2. **Feedback do time médico** — Dr. Ricardo Valença (fundador médico), Dr. Eduardo Faveret (fundador ensino), João Eduardo (sócio admin). O método AEC é IP do Ricardo — mudanças no FSM e na escuta ativa precisam da leitura dele antes de consolidar.
3. **Respiro cognitivo do CTO** — 18h contínuas, 28 versões encadeadas, 1 rotação de credencial, 1 auditoria completa, 1 ativação de CI, 1 fix LGPD descoberto pelo próprio CI. Dia denso. Parar é parte da engenharia.

**O que continua rodando autonomamente:**
- **Vercel** auto-deploya frontend a cada push em `main`.
- **GitHub Actions** auto-deploya Edge Function + valida 10 testes a cada push em `supabase/functions/tradevision-core/**` ou `tests/integration/**`.
- **Supabase triggers** seguem processando appointments, wallets, notifications, consent gates — sem intervenção humana necessária.
- **Memórias do assistente** foram atualizadas refletindo este estado final (`project_ci_pipeline.md` criado, `project_architecture_map.md` + `project_real_state_23_04.md` atualizados, `project_selo_24_04.md` criado).

**Quando retomar:**
- Após Pedro trazer feedback do time (pode ser horas, pode ser dias).
- Próximos candidatos naturais: UI "Conectar Google Calendar" (infra pronta desde 16/04), integração com Memed (prescrição formal), decisão Stripe vs Mercado Pago.
- Nada desses é urgente. Prioridade agora é **ouvir antes de agir**.

**Pendências operacionais mínimas (3 cliques cada, sem urgência):**
- Desabilitar GitHub Actions no repo `amigo-connect-hub` (evita runs vermelhas por falta de secrets).
- Validar que Vercel pegou a build do V1.9.39 (deve estar automático).
- Conferir em algumas horas/dias que o CI continua verde após a atividade do time.

> **Selado por:** Pedro Henrique Passos Galluf, CTO MedCannLab
> **Data:** 24/04/2026, ~23h00 BRT
> **Próxima retomada:** aguarda feedback

---

