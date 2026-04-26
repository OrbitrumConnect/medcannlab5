# SYSTEM STATE SEAL — 2026-04-26 (madrugada BRT)

> Ponto de verdade do sistema. Banco como árbitro. Diários como contexto.
> Próxima sessão DEVE começar lendo este arquivo + `ENGINEERING_RULES.md`.

---

## 0. ESTADO DE SEGURANÇA ATUAL (P0) — leia primeiro

**Sistema funcional e coerente internamente. NÃO está pronto para exposição externa (pacientes pagos).**

Riscos ativos não mitigados (ordem de criticidade):

1. **Credenciais privilegiadas expostas no repo**
   - `service_role` JWT (exp 2076) hardcoded em 6+ arquivos commitados (`verify_report.js`, scripts/auto-fix-profiles.js, scripts/chat_investigation.cjs, scripts/diagnose_full.cjs, etc.)
   - 2 PATs Supabase antigos hardcoded (`sbp_0a39…`, `sbp_bf17…`) em scripts de auditoria
   - Impacto: bypass total de RLS, leitura/escrita irrestrita de PHI/LGPD

2. **Trust boundary quebrada em Edge Functions**
   - `tradevision-core` deploya com `--no-verify-jwt` — body é fonte de identidade
   - `google-auth` aceita `state` injetando `user_id` sem HMAC (CSRF/spoofing)
   - `wisecare-session` armazena credenciais em env plain-text
   - `video-call-request-notification` aceita qualquer `(requesterId, recipientId)` sem validar caller
   - Impacto: forjabilidade de identidade no servidor

3. **Configuração de Auth permissiva**
   - Senha mínima: 6 caracteres
   - HIBP (haveibeenpwned) desligado
   - Auto-confirm de email ligado (signup sem verificação)
   - Sessões eternas (`timebox=0`, `inactivity=0`)
   - MFA com `allow_low_aal=true` (TOTP não obrigatório nem para admin)
   - `uri_allow_list` contém `http://localhost:3000` em produção (open redirect)
   - Impacto: takeover de conta com baixo esforço

4. **Vulnerabilidades de dependências**
   - 17 vulns npm (4 critical, 4 high) — `@xenova/transformers`+`onnx-proto`, `axios <0.31` via `wise-api`, `xlsx` sem fix
   - Impacto: SSRF, prototype pollution, CSRF

**Status de mitigação: PENDENTE — Etapa 1 da Seção 6 obrigatória antes de qualquer exposição externa.**

> *"O sistema está funcional, mas não está seguro para produção externa ainda."*

---

## 1. Realidade no banco (snapshot 02:30 BRT, projeto `itdjkfubfzmvmuxxjoae`)

| Métrica | Valor real | Comentário |
|---|---|---|
| Users totais | **27** (5 admin + 8 prof + 14 paciente + **0 aluno**) | |
| Reports clínicos | **75** (64 completed + 11 shared) | +5 desde 24/04 |
| Reports assinados V1.9.73 | **0** | Migration aplicada, mas zero reports novos pra assinar (OpenAI fora) |
| Appointments | 60 (30 cancelled + 29 scheduled + 1 completed) | ~50% cancelamento — sinal de produto |
| CFM prescriptions | 32 | |
| DB size | **79 MB / 8 GB** (~1%) | Sem urgência de scale |
| Último report criado | **2026-04-25 15:12** | Congelou junto com OpenAI |
| `payload_size_v1_9_72` log | 1 hit em 26/04 02:27 | V1.9.72 ATIVO em prod |
| `aec_state_invalidated_*` | 4 invalidações | V1.9.57 self-healing funcionando |
| `chat_turn` últimos 7d | 133 | Sistema sendo usado |

---

## 2. Prova de causalidade do incidente OpenAI (25/04 → 26/04)

Sequência reconstruída via `institutional_trauma_log`:

1. **25/04 15:01-15:02** — 3 erros `400 context_length_exceeded` (140k+ tokens). Causa: V1.9.55 reintroduziu `patientData` inteiro no payload sem cap.
2. **25/04 15:02 → 26/04 02:27** — 12 erros `429 insufficient_quota`. Causa: retries cegos + payload inflado consumiram cota.
3. **V1.9.72 (cap patientData via whitelist por fase)** — defesa implementada e deployada, mas validação em escala bloqueada até OpenAI voltar.

> Não é correlação: é causalidade rastreável de log → log → fix.

---

## 3. Sistema em estado degradado funcional (12h sem OpenAI)

Banco prova que o sistema sobreviveu sem IA:

- 133 chat turns processados (fallback determinístico ativo)
- 12 reports finalizados em `mode=deterministic`
- 4 states AEC inconsistentes invalidados automaticamente (V1.9.57)
- Telemetria contínua (`noa_logs.payload_size_v1_9_72`)
- Zero perda de dados, zero corrupção

**Implicação:** o sistema não depende criticamente da IA. O fallback de 5 camadas (V1.9.61) é defesa real, não placebo.

---

## 4. Coerência diários × banco

| Diário afirma | Banco prova | Status |
|---|---|---|
| Sistema robusto, 27 users ativos | 27 users + 133 chat_turns/7d | OK |
| AEC funcionando ponta-a-ponta | 75 reports + 4 self-heals (V1.9.57) | OK |
| V1.9.72 cap em prod | telemetria gerada 02:27 | OK |
| Brain Disconnect Mode = fallback OK | 12 reports `mode=deterministic` em 12h | OK |
| Ricardo vai recarregar OpenAI | Último 429 às 02:27 BRT | NÃO recarregado |
| ClinicalAssessment.tsx em rota ativa | Tabelas `imre_assessments` dropadas, zero inserts | Feature morta |
| 0 alunos cadastrados | `users.type=aluno` retorna 0 | OK |
| Cluster IMRE escalado pra Ricardo | Pendente decisão | Aberto |

---

## 5. Features inconsistentes — NÃO MEXER sem decisão Ricardo

### `src/pages/ClinicalAssessment.tsx`
- Rota viva no frontend (`/clinica/paciente/avaliacao-clinica` em `App.tsx:154`)
- Componente foi visto em log de console (Pedro confirmou) — significa que foi carregado em algum momento de teste
- Tenta `INSERT em imre_assessments` (tabela dropada do banco)
- Zero inserts em produção — feature 100% morta na prática
- **Status: código morto / decisão Ricardo pendente** (deprecar / recriar tabelas / refatorar pra `clinical_reports`)

### 4 motores IMRE dormentes em `src/lib/`
- `clinicalAssessmentService.ts`, `imreMigration.ts`, `noaIntegration.ts`, `unifiedAssessment.ts`
- Quebram `tsc` (102 erros após Lovable regenerar `types.ts`)
- Cabeçalho explícito: "NÃO DELETAR sem autorização explícita" (gap C4 documentado)
- Remover não resolve — `ClinicalAssessment.tsx` usa tabelas direto, não importa desses arquivos
- **Status: dormente / decisão Ricardo pendente**

### `src/pages/AIDocumentChat.tsx` + cadeia RAG local (xenova)
- Página em rota viva (`App.tsx:232` — `path="ai-documents"`)
- Cadeia: `AIDocumentChat` → `RAGSystem` → `LocalLLM` → `@xenova/transformers` (4 arquivos)
- **Investigação banco (26/04 manhã) — zero uso real:**
  - 46 documentos na tabela `documents`, mas **zero têm embeddings**
  - Tabela `ai_saved_documents`: vazia (0 rows)
  - Tabela `document_chunks`: nem existe
  - `noa_logs` últimos 90 dias: zero menções a AIDocumentChat/RAGSystem/LocalLLM
  - Último upload em qualquer categoria: 13/03/2026 (~6 semanas atrás)
- **Sem entry point pelo UI:** zero `<Link to>` ou `navigate()` apontando pra `/ai-documents` em sidebar/menu
- **Custo de manter:** 4 vulns critical no `npm audit` (vêm de `onnxruntime-web`/`onnx-proto`) + bundle inflado (xenova arrasta ONNX runtime)
- **Status: feature 100% morta na prática / decisão Ricardo pendente** (3 caminhos: deprecar / manter / refatorar pra `pgvector` + OpenAI embeddings)
- **Tentativa de remoção em 26/04 madrugada falhou** — Grep inicial não pegou cadeia de imports, build quebrou, restaurado imediatamente. Lição: `npm run build` antes de `npm uninstall` é smoke test obrigatório.

---

## 6. Próxima sessão — ORDEM OBRIGATÓRIA

### Etapa 1 — Segurança (P0, ~3-5 dias)
1. Rotacionar `service_role` JWT (hardcoded em 6+ arquivos commitados)
2. Rotacionar 2 PATs Supabase antigos (`sbp_0a39…`, `sbp_bf17…`)
3. Toggles Auth Supabase: senha mín=12, HIBP on, autoconfirm off, `sessions_timebox=8h`, `inactivity_timeout=30min`, `mfa_allow_low_aal=false`
4. Limpar `uri_allow_list` (remover `localhost:3000` + URL malformada)
5. Buckets `documents` e `avatar`: MIME whitelist + size limit
6. Branch protection em `main` + status checks required
7. Fechar S4 JWT (`tradevision-core --no-verify-jwt`)

### Etapa 1.5 — 3 P0 descobertos via log real (26/04 manhã)

Análise de log de produção revelou 3 problemas operacionais não cobertos na auditoria 360°:

1. **Loop de render no `UserViewContext`** ([src/contexts/UserViewContext.tsx](./src/contexts/UserViewContext.tsx)) — `console.log` dentro de `getEffectiveUserType` disparava 80+ vezes por sessão (chamado por todo consumer em todo render). **Causa raiz mais profunda:** dual-source-of-truth entre `user.type` (Supabase `user_roles`) e `viewAsType` (localStorage), Provider sem `useMemo`/`useCallback`.
   - **Fix de superfície aplicado em 26/04 (commit isolado):** remover `console.log` do getter (loga apenas em `setViewAsType`)
   - **Fix estrutural pendente:** memoization completa + decisão de fonte única → fica pra Fase 4 #20 (singletons + Context refactor)

2. **Signed URLs do Supabase Storage expirando silenciosamente** — [Library.tsx:613](./src/pages/Library.tsx#L613) e [NoaConversationalInterface.tsx:2317](./src/components/NoaConversationalInterface.tsx#L2317) geram URL com TTL=30 dias e persistem no banco; após 30d viram `400`. RAG quebra silenciosa.
   - **Fix proposto:** regenerar on-demand quando RAG/UI precisa do conteúdo. Esforço M (~2h). Pendente.

3. **Log `[Assistant] Resposta recebida` não distingue origem** — [noaResidentAI.ts:405](./src/lib/noaResidentAI.ts#L405). Hoje todas respostas vêm do fallback determinístico (OpenAI fora). Quando OpenAI voltar, distinção entre `[GPT]` vs `[FALLBACK]` será necessária pra debug.
   - **Fix proposto:** prefixo dinâmico baseado em `metadata.offline`. Pendente até OpenAI voltar (Fase 2).

**Princípio aplicado:** "reduzir ruído + estabilizar fluxo atual, não criar nova camada agora" (validado por GPT review). Arbitration Layer (proposta lateral) violaria Seção 10 — fica embutida na Fase 4.

### Etapa 2 — Validar V1.9.72 e V1.9.73 (quando Ricardo recarregar OpenAI)
```sql
-- V1.9.72 (cap payload):
SELECT
  ROUND(AVG((payload->>'estimated_tokens')::int)) AS media,
  MAX((payload->>'estimated_tokens')::int) AS pico,
  COUNT(*) FILTER (WHERE (payload->>'estimated_tokens')::int < 15000) AS ideais
FROM noa_logs
WHERE interaction_type = 'payload_size_v1_9_72'
  AND created_at > now() - interval '24 hours';
-- Esperado: media < 15k, pico < 25k, ideais alto

-- V1.9.73 (assinatura):
SELECT id, signature_hash IS NOT NULL AS assinado, LENGTH(signature_hash) AS hash_len
FROM clinical_reports
WHERE created_at > '2026-04-26 00:00:00'
ORDER BY created_at DESC LIMIT 5;
-- Esperado: assinado=true, hash_len=64
```

### Etapa 3 — Só então considerar
- V1.9.74 (verificação de assinatura na leitura — re-hash do `signed_payload` vs hash atual)
- V1.9.75 (Verbatim First — interceptar saudações/frases AEC antes do GPT)
- Cluster IMRE (decisão Ricardo: deprecar / recriar / refatorar)

### NÃO FAZER antes da Etapa 1 estar completa
- Refactor de UI (god components, bundle splitting)
- Otimização de performance frontend
- Mexer em `ClinicalAssessment.tsx` ou motores IMRE legacy
- Mexer em prompts da Nôa (TEACHING_PROMPT, CLINICAL_PROMPT)
- Deletar arquivos legacy
- Ativar `sync-gcal` ou outras Edge Functions dormentes

---

## 7. Auditoria 360° — síntese (sessão 26/04 madrugada)

5 frentes auditadas em paralelo (Supabase backend, Edge Functions não-Core, Frontend, CI/CD/segurança, Observabilidade/testes/DR). Total ~30 achados P0-P3.

**Estimativa em dev focado:**
- Produção segura mínima: **~3-5 dias**
- Aceitar pacientes externos pagos: **~8-12 dias** total
- Elite escalável (10x usuários sem refactor): **~18-27 dias** total

**Achados destacados além de Etapa 1:**
- ~~17~~ **16 vulns npm** (4 critical, 3 high, 9 moderate) — restantes: `@xenova/transformers` + `onnx-proto` (4 critical, possivelmente removível se feature de IA local não usada), `axios <0.31` via `wise-api` (high — precisa npm `overrides` + teste WiseCare end-to-end)
  - ✅ **`xlsx` resolvido** (26/04 madrugada): vendored via CDN oficial SheetJS (`xlsx@0.20.3` pinado, `npm` registry está unmaintained). Trade-off explícito: `npm audit`/Dependabot/Snyk não escaneiam tarballs externas — checar `sheetjs.com/changelog` mensalmente. Smoke test com `.xlsx` real ainda pendente (admin valida quando tiver planilha à mão).
- `tsc` e `lint` NÃO rodam no CI (102 erros TS passariam direto)
- Bundle 4.7MB monolítico (sem code splitting)
- 6 singletons compartilhando estado entre sessões
- ErrorBoundary existe mas nunca é usado
- Índices faltando em `user_interactions` (96.8% seq scan), `noa_logs` (100% seq scan)
- Edge Functions sem autorização de caller (`google-auth` state sem HMAC, `wisecare-session` credentials plain-text)
- Zero health endpoint, zero correlation IDs, zero Sentry
- 3 integration tests apenas (zero regressão pros bugs corridos)

---

## 8. Frases-âncora

> *"Banco é a realidade. Diários documentam intenção, código documenta implementação, banco documenta o que de fato aconteceu. Quando divergem, banco vence."*

> *"Auth define quem pode ver a realidade. Sem auth endurecida, ter o banco em ordem é proteção parcial."*

---

## 9. Histórico recente (referência rápida)

- V1.9.66 (24/04): ISM Fase 1 — ConversationState aditivo
- V1.9.67 (25/04): bug A AEC residual state — invalidate path
- V1.9.68 (25/04): UI Reports restaurada
- V1.9.69 (25/04): admin terminal background
- V1.9.70 (25/04 noite): FSM terminal persistence + COMPLETED resume
- V1.9.71 (25/04 noite): extract-document-text deflate-raw fix
- V1.9.72 (26/04 madrugada): cap patientData via whitelist por fase + telemetria
- V1.9.73 (26/04 madrugada): assinatura SHA-256 server-side de relatórios

---

## 10. Princípio de timing arquitetural (anti-regressão)

**Arquitetura NÃO é implementada por intuição — é implementada por validação empírica.**

### Erro recente (25/04)
- ISM Fase 2 iniciada sem telemetria suficiente
- Resultado: esforço sem validação, risco de regressão evitado por marcha-ré

### Aplicação atual (V1.9.72+)

**NÃO implementar novas camadas** (router, cache semântico, intent classifier, Verbatim First) **antes de:**

1. OpenAI funcional (quota recarregada)
2. V1.9.72 validado com 24-48h de tráfego real
3. Métricas dentro do esperado:
   - média < 15k tokens
   - pico < 25k tokens
   - alta proporção de payloads ideais

### Justificativa

- Sem GPT ativo → não há baseline comparável
- Sem telemetria → não há evidência de gargalo real
- Sem evidência → arquitetura vira opinião

### Regra operacional

> *"Sem dado real, qualquer arquitetura nova é fé, não engenharia."*

> *"Sem dado, não há mudança de arquitetura."*

### Ordem obrigatória (reforço da Seção 6)

1. Segurança P0
2. Validar V1.9.72/73 (telemetria 24-48h)
3. Só então evoluir arquitetura (V1.9.74+ → V1.9.75 Verbatim First → V1.9.76 Intent local → V1.9.77 Cache semântico com `patient_id` no key → V1.9.78 Router formal)

**Quebrar essa ordem = decisão consciente de risco técnico** (com justificativa registrada e aceita por Pedro/Ricardo).

### Por que essa trava existe

O sistema já funciona. Melhorias estruturais ficam visíveis. Tentação de "otimizar arquitetura" aumenta. **É exatamente aí que surgem regressões invisíveis.** Esta seção é proteção contra empolgação na próxima sessão.

---

*Selo gerado em 2026-04-26 ~02:30 BRT. Cruzamento: queries Management API + 42 diários do último mês + memórias de auto-memory + auditoria 360°. Seção 10 adicionada após análise estratégica (Pedro + GPT review).*
