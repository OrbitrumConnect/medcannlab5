# DIÁRIO 25/04/2026 — Auditoria de RLS, Correções Cirúrgicas e Plano dos 3 Modos da Nôa

> **Marco:** dia de validação e calibração depois de 2 dias intensos de execução (23 e 24/04). Pegamos um falso positivo nosso, retratamos publicamente, aplicamos 2 correções de segurança em produção via Management API, e construímos o plano cirúrgico para os 3 modos epistemológicos da Nôa (AEC / Chat / Racionalidades) — alinhado à tese do Dr. Ricardo Valença: *"IMRE pergunta. AEC escuta. O relatório organiza. A clínica interpreta."*
>
> **Princípio do dia:** quando a evidência muda, a afirmação muda. Auditoria sem reproduzir o suposto leak vira teatro.

---

## 1. Resumo Executivo

O dia começou com Pedro pedindo "voltamos aonde paramos? verificar o possível" — pergunta de retomada após o dia de 24/04 ter fechado com 29 versões deployadas, CI ativo e auditoria LGPD declarada coerente.

**Total do dia: 23 versões deployadas (V1.9.47 → V1.9.69)** — dia mais produtivo da história do projeto.

**Eixos principais:**
- **Manhã** — Pegamos e retratamos um falso positivo nosso ("26 views sem RLS"); aplicamos V1.9.47-48 via Management API (policy `clinical_reports` unificada + RLS em 3 backups).
- **Tarde** — Plano dos 3 Modos da Nôa, racionalidades blindadas (V1.9.49), CI gate (V1.9.50), tutorial chat por perfil (V1.9.54), fix crítico patientData ignorado pelo Core (V1.9.55).
- **Tarde-noite** — V1.9.56 limpou "Modo local"; V1.9.57 instalou invalidate pattern (Camadas 1+2); V1.9.58-59 fecharam **S4 Trust Boundary** (refactor: body NUNCA participa de identidade).
- **Noite** — Bugs paralelos descobertos no teste como paciente (V1.9.60-64); **V1.9.65 Identity Unification** (4 builders); **V1.9.66 ISM Fase 1** (camada arquitetural fundacional inicia); **V1.9.67 Bug A persistente RESOLVIDO** (Camada 3 Prevention — causa real era refusal path, não as 3 fases que resumo prévio dizia); **V1.9.68 Reports UI** consolidado; **V1.9.69** padronização visual admin.

**Princípio reafirmado hoje:** *"antes de afirmar leak, reproduzir com query bruta. Antes de propor fix, verificar terminologia. Antes de aplicar, ter rollback documentado."*

**Princípios emergentes consolidados ao longo do dia:**
- *"Polimento cirúrgico não é confiança cega — é cirurgia com checklist e snapshot defensivo."*
- *"Body NUNCA participa de identidade — só payload funcional."*
- *"Não inventar, consolidar."*
- *"Telemetria antes de comportamento."*
- *"Invalidate ≠ DELETE — estende além de DB pra state in-memory."*
- *"Dead code > deleção precoce — preserva reversibilidade até validação real."*
- *"Ler todos os call sites antes de declarar fix completo."*
- *"Verificar logs antes de culpar infra."*
- *"Quando resumo prévio diverge do código, código é a verdade."*

**Mudança qualitativa do dia:** sistema saiu de *"clínico com IA + risco crítico de privilege escalation + identidade fragmentada"* para *"sistema clínico com governança automatizada + trust boundary fechado + identidade unificada + ISM Fase 1 + UX consolidada"*. Não é mais sobre fechar vulnerabilidade — é sobre construir camadas arquiteturais que previnem **classes inteiras** de bugs.

---

## 2. Timeline Retrospectiva (23/04 → 25/04)

### 23/04/2026 — V1.6.2 / V1.8.x — Trust Boundary clínico
- Separação de domínios (input humano / RAG / estado clínico).
- Câmara de esterilização (Ingestion Bridge).
- Validação de resiliência: relatórios 100% corretos mesmo com banco contaminado.
- V1.8.6: trava seletiva em fases de identificação, "Bate-Pronto" (teto 2 iterações).
- V1.8.7: reset real do contador de iteração (dead code resolvido).

### 24/04/2026 — V1.9.11 → V1.9.39 — Restauração + CI vivo + LGPD

**Manhã (V1.9.11 → V1.9.21) — Restauração**
- Trigger órfão "Iniciar Avaliação Clínica" corrigido.
- Biblioteca limpa de 412 slides (filtro por `category != 'slides'`).
- Monetização destravada (COALESCE doctor_id/professional_id + notifications.id default).
- Bloco A polimento (aluno abre docs, send-email com verify_jwt, backfill 27 user_profiles).
- 4 builders de contexto por role (`buildPatient/Professional/Admin/Student`).
- Dual-write inteligente: `lista_indiciaria`, `identificacao`, `consenso` voltam direto em `content.*`.
- Sync trigger `doctor_id ↔ professional_id` + backfill de 60 appointments + 56 reports.

**Tarde (V1.9.22 → V1.9.25) — Rede de segurança**
- 3 testes integração + GitHub Actions auto-deploy (`deploy-and-test.yml`).
- Fix idempotência reports (23 → 1 por sessão): gate `reportDispatchedAt` + janela 30s → 10min.
- Backfill 33 reports aninhados de 22-23/04 (desaninhar `content.raw.content.*` → `content.*`).

**Noite (V1.9.26 → V1.9.39) — AEC e LGPD**
- V1.9.26: filtro temporal de conversationHistory (4h floor).
- V1.9.27: remoção do filtro micro-phrase ("AEC é escuta ativa — tudo é ouro").
- V1.9.28: gate de IDENTIFICATION (FSM trava até nome capturado).
- V1.9.29-30-31: terminator regex expandido + phase lock COMPLAINT_DETAILS + transição metodológica.
- V1.9.32: gráfico Evolução da Completude (sortedReports vs reports).
- V1.9.33-34-35: scoreCalculator inline no index.ts (deploy via dashboard funciona).
- V1.9.36: alinhar `generated_by` com CHECK constraint (`'noa_ai'` em vez de `'ai_resident'`).
- V1.9.37: bump timeout 30s integration tests.
- **V1.9.38**: **primeiro bug pego pelo CI** — consent gate antes de idempotência (vazamento silencioso de report_id).
- V1.9.39: hardening RLS na tabela de backup + LOWER() em consent jsonb.

**Selo 24/04 (noite):** *"não é mais só um MVP, estamos acima"* — registrado em memória `project_beyond_mvp_stage`.

### 25/04/2026 — V1.9.40 → V1.9.48 — Calibração e plano

**Madrugada (V1.9.40 → V1.9.46) — Racionalidades + IMRE**
- V1.9.40: rationalityAnalysisService lê schema PT do banco + gate de densidade + diretrizes.
- V1.9.41: refinar diretrizes + log com flags diagnósticas.
- V1.9.42: caller passa report inteiro para service ler `rawContent`.
- V1.9.43: retratar gate V1.9.40 + fortalecer restrições CRM/LGPD.
- V1.9.44: instruir IA a NÃO usar markdown `**` no output.
- V1.9.45: **modo epistemológico obrigatório** + recomendações com hífen (não prescrição).
- V1.9.46: retratação de nomenclatura "IMRE Triaxial" pós-esclarecimento Dr. Ricardo (4 arquivos eram Dashboard Clínico Integrado mal nomeado, não cluster IMRE).

**Manhã/Tarde (25/04) — Auditoria, fixes e plano**
- 10:00: Pedro pede retomada → exploração do estado pós-V1.9.46.
- 10:30: descoberta dos 4 admins (Pedro CTO, João, Ricardo iaianoa, Eduardo) e necessidade de unificar policy `Reports access` que tinha hardcode de 2 emails.
- 11:00: **V1.9.47 aplicada via Management API** — policy unificada (is_admin + 4 UUIDs break-glass + vínculos clínicos preservados).
- 11:30: GPT review valida arquitetura, sugere logging de telemetria.
- (resto da timeline 11:30 → 19:00 detalhado nas seções 4-23)

**Noite (25/04) — V1.9.60 → V1.9.69**
- 20:00-22:00: Pedro testa em prod como paciente — descobre 5 bugs preexistentes (AA-EE) + bug FF (médicos inventados). Maioria categorizada como manifestação de ISM ausente.
- V1.9.60-61: dState.context removido então restaurado com gate cirúrgico + hard cap context overflow (root cause real do "OpenAI instável" foi context_length_exceeded interno).
- V1.9.62: Bug FF — query `doctors` (tabela inexistente) → `users.type='professional'`.
- V1.9.63-64: avatar duplicado em `/chat-noa` — fix em 2 etapas (V1.9.63 só pegou 1 invoke; V1.9.64 fechou o segundo).
- V1.9.65: **Identity Unification** — 4 builders unificados, regra "use identity.name" promovida a UNIVERSAL no prompt do Core (cumpre promessa V1.9.59).
- V1.9.66: **ISM Fase 1** — schema + observabilidade puramente aditiva. `body.conversation_state` consolidado, log em `noa_logs.interaction_type='ism_state_observed'`. Comportamento intacto, telemetria viva pra Fase 2.
- V1.9.67: **Bug A persistente RESOLVIDO** — causa real era refusal path linha 1126 (não as 3 fases que resumo prévio dizia). Novo método `invalidateAssessment` com delete síncrono in-memory antes dos awaits + audit invariant em `completeAssessment`.
- V1.9.68: **Reports UI consolidado** — aba "Lista" removida, Clínico vira default. Dead code preservado pra rollback.
- V1.9.69: padronização visual `bg-[#050914]` → `bg-slate-950` em ClinicalGovernanceAdmin.
- 12:00: auditoria de RLS — afirmei "26 views sem RLS, leak LGPD ativo, fix P0".
- 12:15: **falso positivo detectado** ao reproduzir o suposto leak. Causa raiz: query usava `pg_class.relrowsecurity` (flag de tabela) em vez de `pg_class.reloptions[security_invoker]` (flag de view). Todas as 26 views já estavam protegidas via `security_invoker=on`.
- 12:30: **retratação pública** + criação de `project_lessons_learned_rls_audit.md` com checklist anti-falso-positivo.
- 13:00: descoberta de 3 backups REAIS sem RLS (não eram views, eram tabelas):
  - `clinical_reports_content_backup_24_04` (64 rows)
  - `documents_backup_23_04_2026` (458 rows)
  - `generated_slides_archive` (412 rows)
- 13:15: **V1.9.48 aplicada via Management API** — `ENABLE ROW LEVEL SECURITY` nas 3, sem policies (apenas service_role acessa).
- 14:00: Pedro pergunta sobre reestruturar os 3 modos da Nôa.
- 14:30: GPT review redireciona prioridade — narrador AEC é o P0 estratégico real (não V1.9.49 nem limpeza RAG).
- 15:00-17:00: **plano construído** (`majestic-sprouting-goblet.md`) explorando o `tradevision-core` (~4300 linhas), identificando que o Core já tem `TEACHING_PROMPT` (linha 3521-3575) com 20 personas-pacientes para o Simulador.
- 17:30: descoberta crítica — Simulador e Teste de Nivelamento usam o mesmo `reportPrompt` (linha 1290) em fechamento. Aplicar Fix #1 sem gate pedagógico **quebraria** ambas as features.
- 18:00: plano expandido com `isPedagogicalMode` (4 fontes, defesa em profundidade) + 4 perfis de prompt (não 3).
- 18:30: GPT valida plano final, sugere log estruturado em `noa_logs`.
- 19:00: pergunta crítica de Pedro sobre rollback e capacidade de execução — resposta honesta com confiança escalonada (Fix #3 ~95%, Fix #1 ~85% com testes, Fix #2 ~75%).

---

## 3. Estado Antes (chegada 25/04 manhã) vs Estado Atual (agora)

### Banco em produção

| Item | Estado 25/04 manhã | Estado 25/04 noite | Mudança |
|---|---|---|---|
| Policy `clinical_reports.Reports access` | Hardcode 2 emails (phpg69 + cbdrcpremium) + vínculos | `is_admin()` + 4 UUIDs break-glass + vínculos | **Ampliada**, não restringida |
| `clinical_reports_content_backup_24_04` | RLS off, 0 policies — 64 rows acessíveis via anon | RLS on, 0 policies — só service_role | **Fechada** |
| `documents_backup_23_04_2026` | RLS off, 0 policies — 458 rows acessíveis via anon | RLS on, 0 policies — só service_role | **Fechada** |
| `generated_slides_archive` | RLS off, 0 policies — 412 rows acessíveis via anon | RLS on, 0 policies — só service_role | **Fechada** |
| 26 views (`v_*`) | Suspeita de "sem RLS" baseada em query errada | Confirmadas com `security_invoker=on` | **Esclarecida** (não era problema) |
| Tabelas com RLS robusta | users, cfm_prescriptions, appointments, clinical_reports, etc | Idem + 3 backups acima | **Idem + reforço** |

### Código

| Item | Estado 25/04 manhã | Estado 25/04 noite | Mudança |
|---|---|---|---|
| Migrations no repo | 70 migrations | 72 migrations (V1.9.47 + V1.9.48) | **+2 arquivadas** |
| `tradevision-core/index.ts` | Não modificado | Não modificado | **Plano pronto, aguardando OK Ricardo** |
| `rationalityAnalysisService.ts` | V1.9.45 modo epistemológico | Idem | **Sem mudança hoje** |
| Frontend | V1.9.46 doc retratação | Idem | **Sem mudança no produto hoje** |
| Memórias | 23 entradas | 24 entradas (+ `project_lessons_learned_rls_audit`) | **+1 anti-falso-positivo** |

### Conhecimento sobre o sistema (mais importante que código)

| O que pensávamos | Realidade descoberta hoje |
|---|---|
| "26 views sem RLS — leak LGPD" | **Falso positivo** — todas com `security_invoker` |
| Plano "criar TEACHING_PROMPT" | Já existe no Core (linha 3521-3575) com 20 personas |
| Narrador é problema isolado da AEC | Narrador também roda em fechamento de Simulador e Teste de Nivelamento |
| 3 modos da Nôa precisam 3 prompts | Precisam **4 prompts** (paciente AEC / paciente livre / aluno livre / pro) + reuso do TEACHING |
| Plano tinha "criar gate pedagógico" | Plano precisa **estender gate existente** (`isTeachingMode` linha 3713-3727) ao narrador |

---

## 4. O Erro Reconhecido — Falso Positivo "26 views sem RLS"

### O que aconteceu
Afirmei com confiança "26 views sem RLS, leak LGPD ativo, fix prioridade P0" baseado em query herdada de `docs/INVENTARIO_FASE1_02_04_2026.md`:

```sql
-- Query ERRADA usada:
SELECT viewname,
  EXISTS (SELECT 1 FROM pg_class WHERE relname=v.viewname AND relrowsecurity=true) AS rls_enabled
FROM pg_views WHERE schemaname='public';
-- Resultado: TODAS as 26 views aparecem com rls_enabled=false
-- Conclusão errada: "26 views sem RLS"
```

### Por que está errado
`pg_class.relrowsecurity` é flag de **tabela** (`relkind='r'`) — nunca é true em **view** (`relkind='v'`). A proteção de view se dá por `pg_class.reloptions` contendo `security_invoker=on` ou `=true`.

### Query correta
```sql
SELECT c.relname, c.reloptions,
  CASE WHEN c.reloptions::text ILIKE '%security_invoker=on%'
         OR c.reloptions::text ILIKE '%security_invoker=true%'
       THEN 'PROTEGIDA' ELSE 'BYPASSA_RLS' END AS status
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public' AND c.relkind = 'v';
```

Resultado real: **26/26 views protegidas**.

### Lição aprendida (registrada em memória)
- Antes de afirmar "leak/sem RLS": rodar 3 queries (relkind, relrowsecurity, reloptions).
- Antes de propor migration: tentar reproduzir o leak com query bruta como anon/authenticated.
- Quando herdar afirmação de docs antigos: re-validar com query atual antes de basear plano.
- Diferenciar terminologia: "RLS habilitada" ≠ "RLS efetiva em view" ≠ "sem policies" ≠ "policy USING true".
- Anotar fonte da verdade: query atual? grep? doc antigo? memória? Quanto mais distante de query atual, menor confiança.

Memória `project_lessons_learned_rls_audit.md` criada com checklist anti-falso-positivo + queries consolidadas.

---

## 5. Fixes Aplicados em Produção Hoje

### V1.9.47 — Policy `clinical_reports` unificada
**Migration:** `supabase/migrations/20260425100000_v1_9_47_clinical_reports_policy_unificada.sql`

**Antes:**
```sql
-- Policy "Reports access" antiga:
((auth.email() = ANY (ARRAY['phpg69@gmail.com', 'cbdrcpremium@gmail.com']))
 OR (professional_id = auth.uid())
 OR (doctor_id = auth.uid())
 OR (patient_id = auth.uid()))
```

**Depois:**
```sql
is_admin()  -- fonte principal: 5 admins atuais + futuros
OR auth.uid() = ANY (ARRAY[
  '17345b36-50de-4112-bf78-d7c5d9342cdb'::uuid,  -- Pedro (CTO)
  'f62c3f62-1d7e-44f1-bec9-6f3c40ece391'::uuid,  -- João Vidal
  '99286e6f-b309-41ad-8dca-cfbb80aa7666'::uuid,  -- Dr. Ricardo iaianoa
  'f4a62265-8982-44db-8282-78129c4d014a'::uuid   -- Dr. Eduardo Faveret
])
OR professional_id = auth.uid()
OR doctor_id = auth.uid()
OR patient_id = auth.uid()
```

**Por quê GPT review validou esta forma:**
- `is_admin()` como fonte principal (cobre admins futuros sem migration)
- UUIDs em vez de emails (chave estável vs string mutável)
- Break-glass redundante (camada de defesa caso `is_admin()` falhe)
- Migration **amplia** acesso (Eduardo + Ricardo + admin.test agora veem tudo) — não restringe

**Aplicação:** via Management API (`exec_sql`) — idempotente. Migration arquivada para rastreabilidade.

### V1.9.48 — ENABLE RLS em 3 tabelas backup
**Migration:** `supabase/migrations/20260425110000_v1_9_48_enable_rls_backups.sql`

```sql
ALTER TABLE clinical_reports_content_backup_24_04 ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents_backup_23_04_2026 ENABLE ROW LEVEL SECURITY;
ALTER TABLE generated_slides_archive ENABLE ROW LEVEL SECURITY;
```

**Padrão:** mesmo da V1.9.39 (`clinical_reports_consent_backup_v1_9_39`) — RLS habilitada com **zero policies**. Resultado: PostgREST nega leitura via anon/authenticated; apenas service_role acessa via backend. Dado preservado para rollback eventual, sem exposição.

**Aplicação:** via Management API + migration arquivada.

---

## 6. Plano Construído — 3 Modos da Nôa (AEC / Chat / Racionalidades)

**Plan file:** `C:\Users\phpg6\.claude\plans\majestic-sprouting-goblet.md`

### Tese motivadora
Hoje a Nôa Esperanza opera num modelo onde **3 papéis vazam entre si**:
- **AEC** (que deveria coletar) também **interpreta** — narrador gera "Impressão Clínica" + "Plano de Conduta" em 100% dos reports
- **Chat fora da AEC** (que deveria orientar) **NÃO tem guardrails clínicos** — pode prescrever sem barreira
- **Racionalidades** (que deveriam ficar com profissional) têm **gate só na UI** — backend aceita chamada de qualquer role

Resultado desejado: 3 modos com fronteiras explícitas no código, no prompt e no acesso. Cada camada faz só o que cabe ao seu papel.

### Os 3 Fixes coordenados

#### Fix #1 — Narrador AEC vira escriba clínico
**Local:** `tradevision-core/index.ts:1290-1311`

**Mudança:** narrador deixa de gerar "Impressão Clínica" + "Plano de Conduta". Vira escriba puro: organiza fala do paciente com fidelidade estrutural, adiciona "Lacunas Declaradas" + rodapé regulatório.

**Risco crítico identificado:** Simulador (`AlunoDashboard:1820-1960`) e Teste de Nivelamento (`AlunoDashboard:2099-2168`) usam o **mesmo** narrador no fechamento — esperam "Impressão Clínica + Plano" como feedback pedagógico. Aplicar Fix #1 sem gate **quebra** essas features.

**Mitigação:** detecção `isPedagogicalMode` com 4 fontes (defesa em profundidade):
1. `metadata.mode === 'simulation' | 'placement_test' | 'teaching'` (passar do client)
2. `userRole === 'student'`
3. `currentIntent === 'ENSINO'` (já populado pelo Core, linha 1846-1847)
4. `isTeachingMode` (variável existente, linha 3713-3727)

Fail-safe: qualquer ambiguidade → modo pedagógico (mais permissivo). Paciente real nunca dispara nenhuma das 4 fontes.

**Telemetria:** log estruturado em `noa_logs` com `interaction_type='narrator_mode_decision'` (sugestão GPT 25/04).

**Status:** ✅ pré-aprovado por Pedro, ❌ aguarda OK explícito do Dr. Ricardo Valença sobre texto V2.

#### Fix #2 — Chat com guardrails por role + modo
**Locais:** `tradevision-core/index.ts:1731+` (system prompt builder); `useNOAChat.ts:22-28` (boas-vindas).

**4 perfis de prompt (não 3):**

| Perfil | Quando ativa | Comportamento |
|---|---|---|
| `SCRIBE_AEC` | role=`patient` + AEC ativa | Escriba puro (Fix #1) |
| `EDUCATIONAL_PATIENT` | role=`patient` + chat livre | Educacional, NÃO prescreve, disclaimer dinâmico |
| `TECHNICAL_LEARNING` | role=`student` + chat livre | Aluno aprendendo medicina, pode discutir doses como conteúdo educacional |
| `TECHNICAL_PROFESSIONAL` | role=`professional`/`admin` + chat livre | Discussão técnica avançada |
| `TEACHING_PROMPT` (existente) | role=`student` + simulação | Nôa atua como paciente fictício (Paula etc) |

**Componentes adicionais:**
- Disclaimer dinâmico automático para paciente em chat livre (regex em termos clínicos)
- Pós-processamento sanitizador (regex `/\b(tome|use|administre)\s+\d+\s*(mg|ml)/i` etc.)
- Boas-vindas por perfil (paciente / profissional / admin)

**Decisão consciente:** **NÃO mexer em `noaResidentAI.ts:170-205`** (system prompt central). Toda a ramificação fica no Edge Function onde já existe lógica `TEACHING_PROMPT vs CLINICAL_PROMPT`.

**Status:** ❌ aguarda OK do Dr. Ricardo Valença palavra-por-palavra (define limite legal/regulatório).

#### Fix #3 — Backend gate de Racionalidades
**Locais:**
- `src/services/rationalityAnalysisService.ts:81` (defesa client-side)
- Nova migration RLS em `clinical_rationalities` (defesa server-side)

**Mudança:**
```ts
// Client-side fail-closed:
if (!['professional','profissional','admin'].includes(role)) {
  throw new Error('FORBIDDEN_ROLE: Racionalidades médicas são restritas a profissionais e administradores.')
}
```

```sql
-- Server-side via RLS:
CREATE POLICY "rationalities_insert_pro_admin"
  ON clinical_rationalities FOR INSERT WITH CHECK (
    is_admin()
    OR EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND type IN ('professional','profissional'))
  );
-- (e equivalente para UPDATE)
```

**Telemetria:** log em `noa_logs` `interaction_type='rationality_attempt'`.

**Status:** ✅ pré-aprovado implicitamente (Pedro disse: *"para médico apenas racionalidades, profissionais e admins"*).

### Ordem recomendada de aplicação

| Ordem | Fix | Risco prod | Confiança execução | Dependência |
|---|---|---|---|---|
| **1º** | Fix #3 (Racionalidades) | Baixo | ~95% | OK explícito Pedro |
| **2º** | Fix #1 (Narrador escriba) | Médio | ~85% (com 2 testes) / ~70% (sem) | OK Ricardo + 2 testes |
| **3º** | Fix #2 (Chat guardrails) | Maior | ~75% | OK Ricardo palavra-por-palavra |

**Justificativa da ordem:**
- Fix #3 é isolado (backend) e fecha vazamento de privilégio sem mudar UX. Único que pode rodar sem dependência externa.
- Fix #1 muda formato de **novos** reports (antigos ficam como estão). Risco mitigado porque interpretação volta ao médico via Racionalidades.
- Fix #2 é o de maior superfície (toda conversa fora-AEC). Texto exato dos prompts precisa OK do Ricardo palavra-por-palavra.

---

## 7. Riscos do Plano (8 mapeados)

| # | Risco | Severidade | Mitigação |
|---|---|---|---|
| 1 | Quebra dos 3 fluxos pedagógicos (Simulador/Teste/Lições) sem gate | ALTA | `isPedagogicalMode` com 4 fontes (defesa em profundidade) |
| 2 | Aluno tratado como paciente no Fix #2 perdendo liberdade pedagógica | MÉDIA | 4 perfis de prompt (não 3) — TECHNICAL_LEARNING para aluno |
| 3 | CI não cobre fluxos pedagógicos | MÉDIA | Adicionar 2 integration tests antes do Fix #1 (AEC sem Plano + simulação COM Plano) |
| 4 | Narrador atual usado em fechamento de simulação (linha 1290) | ALTA | Gate específico nessa linha, não em outro lugar |
| 5 | Fix #2 toca system prompt central — superfície enorme | ALTA | **NÃO mexer em `noaResidentAI.ts:170-205`** — toda ramificação no Core |
| 6 | V1.9.47 acabou de ser aplicada, side-effects não monitorados | BAIXA | Monitorar 24h: reads de reports por Eduardo/Ricardo/admin.test |
| 7 | JWT não validado no Core (`--no-verify-jwt`) — S4 | ALTA | Fora deste plano — fix separado, próximo P0 técnico |
| 8 | Memórias antigas com afirmações erradas (perpetuação) | BAIXA-MÉDIA | Sessão futura faz pass de retratação em `docs/` |

---

## 8. Pendências e Próximos Passos

### Bloqueado em terceiros
- **OK do Dr. Ricardo Valença** sobre:
  - Texto V2 do narrador (frase pronta em `project_narrator_overreach_24_04.md`)
  - Texto base do prompt EDUCATIONAL_PATIENT (palavra-por-palavra)
  - Confirmação que Racionalidades são exclusivas de profissional/admin

### Bloqueado em ação física
- **Rotacionar PAT Supabase** ativo no projeto medcannlab5 (token registrado fora do repo; Pedro pendente da ação física)
- **Disable Actions em `amigo-connect-hub`** (3 cliques no GitHub)

### Pode rodar a qualquer momento (sem dependência externa)
- Aplicar **Fix #3** (Racionalidades gate) — pré-aprovado, alta confiança
- Adicionar **2 integration tests** novos (preparação para Fix #1)
- Atualizar memória `project_user_base_stage.md` com composição real (5 admin + 8 prof + 14 pacientes)

### Monitoramento pós-fixes
- Query 24h após V1.9.47: picos de leitura de reports por Eduardo/Ricardo/admin.test (não esperado, mas auditável).
- Telemetria pós-Fix #1: `noa_logs.interaction_type='narrator_mode_decision'` — confirmar que pacientes reais caem em modo clínico e alunos em pedagógico.
- Telemetria pós-Fix #2: `noa_logs.interaction_type='prescription_blocked'` — número alto significa prompt vazando, refinar.

---

## 9. O Que NÃO Está no Plano (Intencionalmente)

- **Reescrita do system prompt central da Nôa** (`noaResidentAI.ts:170-205`) — risco alto, fora de escopo. Evolução futura.
- **Migração de prompt do client (`noaResidentAI.ts`) pro server (`tradevision-core`) como fonte única** — bom princípio, refactor maior, dívida documentada.
- **A/B testing de prompts** — overhead com 27 usuários; aplicar direto após validação manual.
- **Feature flag para narrador V1 vs V2** — overhead; reverter via git é trivial.
- **Reativar gamification ou limpar 2 RAG contaminados** — explicitamente desfeito como prioridade nesta sessão (era distração).
- **Fix S4 (JWT validation)** — próximo P0 técnico depois dos 3 fixes deste plano.

---

## 10. Princípios Reafirmados / Emergentes

1. **"Antes de afirmar leak, reproduzir com query bruta"** — NOVO hoje, registrado em memória `project_lessons_learned_rls_audit`.
2. **"Polimento cirúrgico não é confiança cega — é cirurgia com checklist e snapshot defensivo"** — confiança escalonada (95% / 85% / 75%) > falsa promessa de 100%.
3. **"AEC coleta. Chat orienta. Racionalidade interpreta. Médico decide"** — tese central do Dr. Ricardo, virou eixo do plano.
4. **"Migration amplia, não restringe"** — V1.9.47 ampliou acesso (5 admins agora veem tudo) sem tirar de ninguém.
5. **"Quando a evidência muda, a afirmação muda"** — retratação pública do falso positivo "26 views sem RLS" sem ego.
6. **"O Core já tem arquitetura, não é criar do zero"** — TEACHING_PROMPT existe (linha 3521-3575), Fix #1 só estende o gate existente.
7. **"Defesa em profundidade vence detecção única"** — `isPedagogicalMode` com 4 fontes em vez de 1.

---

## 11. Capacidade de Execução — Avaliação Honesta

Pedro perguntou: *"com cuidado podemos fazer caso quebre temos commit anterior? Mas você acredita que é polimento cirúrgico — sua capacidade de executar o plano com 100% de assertividade é alta?"*

Resposta registrada para sessões futuras:

**Rollback é real:**
- Código: cada commit vai pra 4 remotos. `git revert <hash> && git push` desfaz em 2min.
- SQL: padrão V1.9.47 — snapshot da policy antiga em comentário + rollback no rodapé.
- Migrations já aplicadas hoje (V1.9.47, V1.9.48) são idempotentes.

**100% de assertividade — não. Honestamente:**
- Fix #3: ~95% (backend puro, padrão RLS já validado)
- Fix #1: ~85% **com** gate pedagógico + 2 testes integration; ~70% sem
- Fix #2: ~75% (4 perfis, sanitizador, depende de OK Ricardo word-by-word)

**Recomendação:** começar pelo Fix #3 sozinho. Independente do Ricardo, baixíssimo risco, valida o padrão operacional. Se passar limpo, ganhamos confiança pra os outros.

**Princípio:** *"prefiro dizer 85% e entregar 95% do que prometer 100% e descobrir um caller esquecido"*.

---

## 12. Selo do Dia

**Selo da Sessão:** 25/04/2026 — V1.9.47 + V1.9.48
**Hash:** `rls-audit-and-3-modes-plan`
**Status:** Banco endurecido • Falso positivo retratado • Plano dos 3 modos pronto • Aguarda OK Dr. Ricardo

**Próxima sessão pode:**
- Aplicar Fix #3 (sem dependência externa) — recomendado começar por aqui.
- Apresentar texto V2 do narrador ao Dr. Ricardo (frase pronta em memória).
- Adicionar 2 integration tests antes do Fix #1.

**Versão do produto:** V1.9.48 — banco em produção, frontend sem mudanças hoje.
**Encadeamento:** continuação direta do selo 24/04 noite ("acima do MVP") — hoje calibramos a régua, não construímos coisa nova.

---

# CONTINUAÇÃO MANHÃ 25/04 — V1.9.57 + DESCOBERTA ARQUITETURAL ISM

## 18. V1.9.57 — AEC State Invalidate Pattern (3 camadas)

Caso real: Carolina Campello (paciente Dr. Ricardo Valença) testou AEC ontem 24/04. Reportou hoje via Dr. Ricardo: Nôa fez 5 perguntas em um único turno violando phase lock V1.9.30.

**Investigação revelou state inconsistente em `aec_assessment_state`:**
```
phase: 'COMPLETED'
is_complete: false  ← GENERATED column = (completed_phases @> required_phases)
missing: ['INITIAL_GREETING', 'OBJECTIVE_QUESTIONS', 'COMPLAINT_DETAILS']
```

**Cadeia de bug:**
1. FSM não chamou `markPhaseCompleted()` para 3 fases
2. `is_complete=false` PRA SEMPRE (até completed_phases ser corrigido)
3. State residual nunca descartado
4. Cada turno enviava `assessmentPhase: "COMPLETED"` ao Core
5. Phase lock V1.9.30 (específico de COMPLAINT_DETAILS) JAMAIS aplicava
6. GPT em modo livre → 5 perguntas agrupadas

Os 4 sintomas reportados pelo GPT (perguntas múltiplas, sim/não, drift, perda pós-erro) são manifestações do MESMO bug arquitetural.

### Princípio aplicado: "invalidate ≠ DELETE"

Inicialmente propus DELETE do state como já tinha feito com Pedro Paciente ontem. **Erro arquitetural** — Carolina respondeu várias perguntas, dado clínico parcial estava em `data` jsonb. DELETE perderia tudo.

GPT corrigiu: *"invalidate + preserve snapshot + restart controlado"*. Em sistema clínico, dado parcial tem valor — NUNCA destruir mesmo inconsistente.

Memória `feedback_principio_clinico_destrutivo` salva. Memória `feedback_no_aggressive_removal` (já existia) reforçada.

### 3 camadas implementadas (mitigate → detect → prevent)

**Camada 1 — Recovery (cold start guard runtime):**
- `clinicalAssessmentFlow.ts` `loadStateFromDB`: filtra `invalidated_at IS NULL` ao buscar state ativo
- Detecta state com `phase=COMPLETED + is_complete=false + idade > 30min` (ajustado de 6h após Pedro confirmar AEC real é ~20min)
- Snapshot completo em `noa_logs` antes de invalidar
- UPDATE `invalidated_at + invalidation_reason` no banco
- NÃO carrega state inválido → próximo turno cria nova sessão

**Camada 2 — Observability (trigger SQL anomaly logger):**
- Trigger `aec_state_anomaly_logger AFTER INSERT/UPDATE` em `aec_assessment_state`
- Detecta `phase=COMPLETED + is_complete=false + invalidated_at=NULL`
- Loga em `noa_logs` com `interaction_type='aec_state_anomaly'`
- NÃO rejeita (preserva fluxo normal), apenas grita
- **Permite Camada 3 ter telemetria viva** — saber quais branches do FSM precisam fix

**Camada 3 — Prevention (FSM markPhaseCompleted audit):**
- Pendente para V1.9.58 sessão dedicada
- Com telemetria de C2 ativa, vira cirúrgico (não auditar 1500 linhas no escuro)
- 3 fixes esperados: COMPLAINT_DETAILS, OBJECTIVE_QUESTIONS, INITIAL_GREETING

### Migration retroativa Carolina

Snapshot completo dos dados (queixa de cefaleia bem documentada — pulsátil na fronte, 2 dias, pior com luminosidade, melhora dormindo, dipirona esporádica para dor) preservado em `noa_logs`. State marcado `invalidated_at=now()`. **Próxima conexão dela inicia AEC limpa.**

### View `v_aec_invalidated_recoverable`

Permite Dr. Ricardo (ou qualquer profissional autorizado por RLS) visualizar TODAS as avaliações invalidadas com dado clínico parcial. Decisão clínica de formalizar como `clinical_report` ou retomar AEC fica com o médico.

`security_invoker=on` — RLS audit gate (V1.9.50) confirmou 0 FAIL.

### Versões deployadas (manhã 25/04)
- V1.9.57 (commit `a6cbe7b`): cold start guard + trigger + retroativo
- Tune (commit `5a4facb`): threshold 6h → 30min
- View recoverable (commit `e6c911d`): v_aec_invalidated_recoverable

## 19. Reframing arquitetural — GPT 25/04 manhã

GPT trouxe formulação que mudou como pensamos sobre o backlog:

> **Sistema NÃO está "incompleto".**
> **Sistema é heterogêneo em maturidade por domínio.**
> **Estratégia correta = nivelar domínios críticos, não "melhorar sistema inteiro".**

**Frase-âncora:** *"sistema avançado com superfícies críticas ainda não unificadas"*.

### Implicação operacional: horizontal antes de vertical

Reordenação validada: **Identity unification (horizontal) antes de FSM C3 (vertical em AEC)**. Por quê:
- Identity afeta TODOS os 4 buildXContext + ramificações de role + prompt builders
- FSM C3 limitado à AEC, telemetria já coletando
- Fix horizontal antes de vertical reduz retrabalho

**Backlog priorizado registrado** em `project_estado_e_backlog_25_04_manha`:
1. S4 JWT (segurança boundary)
2. Identity unification (helper buildIdentity)
3. FSM C3 (markPhaseCompleted com telemetria viva)
4. ISM (camada arquitetural — ver próximo)
5. Tests

## 20. Bug X1 + descoberta arquitetural ISM (Interaction State Model)

Teste 25/04 11:06: Pedro listou 40 documentos em blocos de 5, pediu o item 4 dizendo *"vamos no 4"* — Nôa interpretou como **fase 4 do FSM AEC** (COMPLAINT_DETAILS) em vez de **documento 4 da lista**.

**Causa raiz arquitetural:** o estado conversacional "selecting_document" não existe no Core. Frontend renderiza lista numerada, mas o estado não chega ao Core como dado estruturado. GPT vê só "4" + history textual + system prompt extenso de AEC → escolhe match mais provável globalmente → fase do AEC vence.

### GPT formalizou: ISM = camada arquitetural ausente

> **Hoje o sistema tem FSM clínico, pipeline de relatório, consent gate — todos estruturados.**
> **Mas NÃO tem FSM de interação conversacional não-clínica.**
> **O Core decide significado por probabilidade GPT, não por estado determinístico.**

### Os 5 bugs recentes são UMA classe única

| Bug | Aparência | Realidade |
|---|---|---|
| Carolina state | "FSM AEC pulou markPhaseCompleted" | FSM clínico incompleto |
| CONSENT mismatch | "UX mostra botões, backend bloqueou" | Estado intermediário ausente |
| "vamos no 4" | "Bug de NLP" | **ISM ausente** |
| DOC_DETECT fraco | "Regex permissiva" | Intent sem state context |
| Scheduling Ricardo | "Entity resolution" | Estado sem context |

**Não são 5 bugs separados. São 5 sintomas de 1 lacuna arquitetural.**

### Salto arquitetural

```
ANTES: UI → text → GPT → interpretação probabilística
DEPOIS: UI → structured interaction state → Core → constrained interpretation
```

Tradução: **transformar prompt engineering em state machine determinística**. Sai de "IA interpretativa" para "IA guiada por estado".

### Estrutura proposta do payload

```ts
{
  message: string,
  conversation_state: {  // NOVO
    mode: 'free_chat' | 'selecting_document' | 'awaiting_schedule'
        | 'picking_professional' | 'consent_pending_block'
        | 'aec_active' | ...,
    context: { ... },
    transitioned_at: string
  },
  // resto: assessmentPhase, conversationHistory, userContext
}
```

### Princípio crítico (registrado)

> **Se não implementar ISM, cada nova feature de UI vai gerar mais drift como Bug X1.**
> **Sistema atual escala ambiguidade, não estrutura.**

ISM **não é item 4 do backlog** — é **camada acima** que subsume itens 4 (CONSENT) e 6 (entity resolution) do antigo. Backlog encolhe de 8 → 6 itens efetivos.

Memória `project_interaction_state_model_camada_fundacional` salva — pauta decisões futuras.

## 21. Estado consolidado fim manhã 25/04

### Versões deployadas no dia (12 commits)
V1.9.47 → V1.9.48 → V1.9.49 → V1.9.50 → V1.9.51 → V1.9.52+53 → V1.9.54 → V1.9.55 → V1.9.56 → V1.9.57 (3 commits relacionados)

### Memórias estruturantes criadas hoje
1. `project_lessons_learned_rls_audit` — anti-falso-positivo RLS
2. `project_identity_gap_25_04` — buildIdentity helper
3. `feedback_postura_quebras_e_evolucao` — regressões trazem experiência
4. `project_estados_intermediarios_25_04` — CONSENT_PENDING_BLOCKED
5. `project_aec_residual_state_25_04` — 4 bugs paciente + V1.9.58
6. `feedback_principio_clinico_destrutivo` — invalidate ≠ DELETE
7. `project_estado_e_backlog_25_04_manha` — 8 vetores priorizados
8. `project_context_drift_25_04_manha` — Bug X1
9. **`project_interaction_state_model_camada_fundacional`** — ISM como camada arquitetural

### Maturidade por domínio (auto-avaliação honesta)

| Domínio | Maturidade | Justificativa |
|---|---|---|
| FSM clínico (AEC) | Alta | V1.9.30 phase lock + V1.9.57 invalidate pattern + telemetria ativa |
| Pipeline de relatório | Alta | V1.9.23 idempotência + V1.9.38 consent gate + dual-write |
| RLS / segurança schema | Alta | V1.9.47/48 unified + V1.9.50 audit gate no CI |
| Persistência conversa | Alta | V1.9.55 patientData fix |
| Observability | Média-alta | Trigger anomaly + noa_logs + payload_hash |
| Identidade administrativa | Média | V1.9.52 admin OK; pro/patient/student sem identity |
| **Segurança boundary (JWT)** | **Baixa** | `--no-verify-jwt` ainda em prod, founder hardcode salva |
| **Interaction state (ISM)** | **Ausente** | Camada arquitetural não existe |
| Test coverage | Baixa-média | 3 fluxos cobertos de ~20+ |

**Tradução:** sistema avançado em domínios clínicos centrais, com 2 superfícies críticas (segurança boundary + interaction state) ainda não unificadas. Conforme princípio GPT: **heterogêneo em maturidade**.

## 22. Selo manhã 25/04

**Selo:** 25/04/2026 — V1.9.57 + ISM identification
**Hash:** `state-invalidate-pattern-and-ism-formalization`
**Versões deployadas no dia:** **12 (V1.9.47 → V1.9.57)**

**Princípios reafirmados/emergentes manhã 25/04:**
1. **Invalidate ≠ DELETE** em sistema clínico (dado parcial tem valor)
2. **Sistema heterogêneo em maturidade** (não "incompleto" — formulação importa)
3. **Horizontal antes de vertical** (Identity unifica antes de FSM C3 cirurgar)
4. **Sistema atual escala ambiguidade, não estrutura** (princípio ISM)
5. **5 bugs recentes = 1 classe arquitetural** (ISM ausente)

**Tradução final:** sistema saiu de *"AEC quebra silenciosa"* (manhã pré-V1.9.57) para **"AEC quebra → trigger grita → invalidate preserva → médico recupera"** (defesa em profundidade ativa). E **ISM identificada como próxima camada fundacional** quando S4/Identity/FSM C3 estiverem fechados.

---

## 13. Pós-script — Refinamento pós-GPT review (25/04 noite)

Após o plano e o diário ficarem prontos, GPT trouxe 7 críticas substantivas. Todas aceitas. Esta seção é a memória das mudanças que ajustam o plano e a próxima sessão.

### 13.1 Erro do dia foi do processo, não da query
Memória + checklist é frágil. **CI é durável.** O fix definitivo do falso positivo de RLS não é mais "rodar query certa" — é tornar **impossível errar** via pipeline. Tradução prática: `scripts/audit_rls_gate.sql` (que já existia incompleto) será expandido + integrado ao CI com split WARN/FAIL.

### 13.2 Fix #1 muda contrato semântico — `report_version` é pré-requisito
Trocar narrador de "interpretação inicial" para "escriba puro" sem versionar = quebra silenciosa pra médicos. Antes do Fix #1, o schema de `clinical_reports` ganha `report_version TEXT NOT NULL DEFAULT 'v1_clinical_narrative'`. Reports novos marcam `'v2_scribe'`. Estrutura `content` passa a ter `analysis_legacy` separado de `structured`.

### 13.3 Regex no Fix #2 é placebo de segurança
Pega "tome 500mg", deixa passar "dose inicial recomendada costuma ser". Caminho correto = **intent classifier antes da geração** (`INFORMATIONAL | EDUCATIONAL | CLINICAL_REASONING | PRESCRIPTIVE`). Reusa `currentIntent` que já existe no Core. Regex vira última linha de defesa, não primeira.

### 13.4 Fix #3 ganha auditoria estruturada com `payload_hash`
Não basta bloquear — tem que **provar tentativa indevida** com trilha LGPD-safe. Schema do log:
```json
{
  "interaction_type": "rationality_attempt",
  "user_id": "<uuid>",
  "payload": {
    "role": "patient",
    "granted": false,
    "rationality_type": "biomedical",
    "payload_hash": "<sha256(queixa + lista_indiciaria)>",
    "reason_denied": "FORBIDDEN_ROLE",
    "timestamp": "<iso8601>"
  }
}
```
Hash em vez de payload bruto = LGPD-safe. Hash dos campos clínicos (não report inteiro) = identificador estável.

### 13.5 Nomenclatura "3 modos" → "3 camadas + 1 transversal"
Renomeação conceitual aceita. Sistema fica mais corretamente descrito (não mais complexo):

| Camada | Função | Dono |
|---|---|---|
| Coleta (AEC) | capturar relato | paciente |
| Organização (Narrador) | estruturar | sistema |
| Interpretação (Racionalidade) | analisar | médico |
| Ensino (Pedagógico) | simular/explicar | aluno (transversal) |

Explica naturalmente por que precisamos de 4 prompts (não 3).

### 13.6 Princípio "não remover, transformar" (regra de ouro)
Para esta evolução estrutural não quebrar nada:
- Fix #1: "Impressão Clínica" não some — vira `analysis_suggestion` com flag `pending_doctor_review`
- Fix #2: chat não bloqueia — redireciona ("isso precisa ser avaliado por profissional, mas posso te explicar como é feito")
- Fix #3: única exceção legítima de remoção — paciente nunca devia ter privilégio

### 13.7 Ordem ajustada e validada por GPT

Ordem definitiva:

| Versão | Fix | Por quê nesta posição |
|---|---|---|
| V1.9.49 | Fix #3 Racionalidades blindado | Backend isolado, alta confiança, valida pipeline |
| V1.9.50 | verify_rls.sql + CI gate (WARN/FAIL split) | Mata classe de erro antes de tocar prompts |
| V1.9.51+ | report_version migration | Pré-requisito de Fix #1 |
| V1.9.52+ | Fix #1 narrador escriba | Só após versionamento + audit contínuo |
| V1.9.53+ | Intent classifier + Fix #2 | Por último (maior superfície regulatória) |

### 13.8 Tradução arquitetural

Não estamos mais "corrigindo bug" ou "ajustando segurança".

Estamos transformando **banco + backend em sistema auditável por pipeline**.

Movimento conceitual:
> "app com backend" → "sistema clínico com governança automatizada"

### 13.9 Sequência autorizada para esta sessão

Pedro autorizou (com 5 defaults: Management API + whitelist backups + hash só dos campos + adiar report_version + atualizar diário 25/04) a sequência:

1. ✅ Atualizar plan file + diário (esta seção)
2. **V1.9.49** — Fix #3 Racionalidades + audit log com payload_hash
3. **V1.9.50** — verify_rls.sql expandido + CI gate com **split WARN/FAIL**
4. Validação local + push

Ajuste obrigatório aceito: **CI tem split WARN (não bloqueia) vs FAIL (bloqueia)** para evitar falso positivo travar deploy inteiro.

---

**Selo do dia atualizado:** 25/04/2026 — V1.9.47 + V1.9.48 + (em execução: V1.9.49 + V1.9.50)
**Hash atualizado:** `rls-audit-and-3-modes-plan-with-gpt-refinement`
**Próximo marco:** banco + CI com governança automatizada (V1.9.50 fechado).

---

## 14. Continuação noite 25/04 — V1.9.49 → V1.9.54 deployadas

Após o pós-script com refinamentos GPT, a sessão executou a sequência completa autorizada por Pedro. Detalhes operacionais:

### V1.9.49 — Gate de role em `clinical_rationalities` + audit log com payload_hash
**Aplicada via Management API + commit `1e41e8c`.**

- Client: `enforceRoleGate` em `rationalityAnalysisService.ts:81` consulta `users.type` e bloqueia paciente/aluno antes de chamar OpenAI.
- Server: 2 policies novas (`rationalities_insert_pro_admin`, `rationalities_update_pro_admin`) com IF NOT EXISTS via DO blocks (re-run idempotente sem drift).
- Auditoria: log em `noa_logs.interaction_type='rationality_attempt'` com `payload_hash` (SHA256 de `queixa+lista_indiciaria` — LGPD-safe).
- Estado: 5 policies em `clinical_rationalities` (3 antigas + 2 novas). 51 racionalidades existentes preservadas.

### V1.9.50 — RLS audit gate no CI com split WARN/FAIL
**Commit `4e3bbaf`.**

- `scripts/audit_rls_gate.sql` reescrito: 5 checks consolidados via UNION ALL com severity FAIL/WARN/OK_INFO.
- `scripts/audit_rls_gate.js` reescrito: Management API + ESM + top-level await + exit code 1 só em FAIL.
- `.github/workflows/deploy-and-test.yml`: novo job `rls-audit` antes de `deploy`. `needs.X.result == 'success'` (built-in, mais robusto que output customizado). Trigger expandido para `supabase/migrations/**`.
- Validação local: FAIL=0, WARN=40 (read-public legítimo), OK_INFO=4 (backups whitelisted).

**Princípio:** *deploy verificável* (não mais só "deploy confiável"). Erro de classe "false positive de RLS" não escapa mais — pipeline grita.

### V1.9.51 — Fix do gráfico Evolução da Completude (cosmético)
**Commit `dc5e91d`.**

- Bug: barras colapsavam para altura zero porque parent imediato em `PatientAnalytics.tsx:786` não tinha `height` explícita; `height: %` da barra interna virava 0.
- Tooltip `{score} pts` continuava aparecendo (absolute positioned), dando ilusão de que dados estavam corretos.
- Fix: wrapper intermediário com altura fixa (h-48 / h-36 compact) entre item flex e barra. Padrão espelhado do `Reports.tsx` "Relatórios por Mês" que sempre funcionou.
- Não afeta dados (scores no banco intactos), apenas renderização.

### V1.9.52 + V1.9.53 — Admin context com identity/clinical + regra de ouro refinada
**Commit `f617072`.**

**Bug observado por Pedro em runtime:**
- "me identifique" → Nôa respondia genérico ("está logado como administrador") sem nome.
- "quantos relatórios temos no total?" → Nôa bloqueava como "fora do escopo" (era escopo legítimo de admin).

**Causa raiz dupla:**
1. `buildAdminContext` (V1.9.16) injetava role + métricas mas **NÃO** o nome do usuário nem contagem de `clinical_reports`. Sem dado, IA caía em respostas genéricas ou aplicava bloqueio universal.
2. Prompt do Core tinha exemplo único de "carros" — IA generalizava aplicando o mesmo bloqueio a perguntas de plataforma quando dado não estava no contexto.

**V1.9.52 — `buildAdminContext.ts`:**
- Novo campo `identity { name, email, type }` via SELECT em `users`.
- Novo campo `clinical { totalReports, completedCount, sharedCount, last30d }` via agregação client-side.
- Mantém fail-open: query falha → field null/0, não quebra resposta.

**V1.9.53 — `tradevision-core/index.ts:3491-3500`:**
- Distingue **tópico fora do escopo** (carros, política) de **info ausente** (relatórios, agendas) — apenas o primeiro recebe bloqueio.
- Quando dado de escopo não está em `userContext`, instrui IA a redirecionar para tela do painel ao invés de bloquear.
- Nome do admin obrigatório em "me identifique" usando `userContext.identity.name`.
- Lista de exemplos do que é escopo legítimo vs fora do escopo (calibrado com sugestão GPT de não-super-restringir).

### V1.9.54 — Tutorial do chat por perfil (botão "?" no header)
**Commit `<próximo>`.**

- Componente novo `src/components/NoaChatHelpModal.tsx` — modal com 4 perfis (paciente / professional / admin / aluno) + fallback unknown. Mostra apenas a aba do perfil ativo (evita confusão).
- Botão `?` injetado em `NoaConversationalInterface.tsx:2958` ao lado do Maximize.
- Conteúdo: o que a Nôa faz / comandos úteis / o que ela NÃO faz / limites — coerente com V1.9.49 (racionalidades só pro/admin), V1.9.52 (admin pergunta "me identifique"), V1.9.53 (escopo vs fora-do-escopo).
- Footer fixo: *"A Nôa coleta, organiza e orienta. Decisão clínica final pertence ao médico responsável."*

### V1.9.55 — Fix CRÍTICO — patientData ignorado pelo Core (regressão antiga descoberta hoje)
**Commit `<próximo>`.**

**Sintoma (reportado por Pedro às 04:06):** Após V1.9.52+53 deployadas, Nôa continuava sem identificar Pedro pelo nome ("sabe meu nome?" → "não tenho seu nome específico no momento") e perdia contexto entre turnos consecutivos.

**Investigação (logs reais):**
- `[REQUEST] historyLength: 0` em **toda** request — Core nunca recebe histórico.
- `🧠 Contexto histórico de 0 mensagens adicionado` — confirmação.
- `[DOC DETECT] userId=false` — Core trata Pedro como sem `user.id`.
- `ai_chat_interactions` global: **0 inserts em 24h**. Última msg: 2026-03-28 (28 dias atrás).
- `noa_logs`: 0 registros para Pedro em 24h (apesar de V1.9.49 inserir `rationality_attempt`).
- `patient_medical_records`: 40 records hoje (cliente persiste, mas Core não).

**Causa raiz identificada:**
[`tradevision-core/index.ts:1528-1532`](supabase/functions/tradevision-core/index.ts#L1528) buscava `patientData` via:
```ts
.from('profiles').select('*, user:id(*)').eq('id', body.context?.patient_id)
```
Mas `profiles.id` **não tem FK** para `users` ou `auth.users` — embed PostgREST `user:id(*)` falha silenciosamente, retornando `data.user` undefined.

Linha 1549 ignorava o canal explícito do client:
```ts
const patientData = patFromBody ?? body.context ?? {}  // ❌ ignora body.patientData
```

Cliente em [`noaResidentAI.ts:1960`](src/lib/noaResidentAI.ts#L1960) **sempre envia** `patientData: { user, intent, ... }`. Mas o Core descartava esse canal em favor de uma query frágil.

**Fix:**
```ts
const patientData = body.patientData ?? patFromBody ?? body.context ?? {}
```

**Cascata de efeitos do bug original:**
- `patientData?.user?.id` → undefined
- Linha 4539 `if (patientData?.user?.id)` → false
- Save em `noa_logs` e `ai_chat_interactions` → **PULADO**
- Próxima request lê `ai_chat_interactions` vazia → `historyLength: 0`
- Nôa esquece tudo a cada turno → "ola pedro" → próximo turno "olá! como posso ajudar?"
- V1.9.52 (`identity.name` no userContext) funcionava no client mas Core descartava o `body.patientData` que carregava esse contexto agregado
- V1.9.49 (`rationality_attempt` audit log) só funciona quando admin chama via client direto, não via Edge Function

**Quando quebrou:** entre 28/03 e 25/04 — algum deploy mexeu na sequência de resolução de `patientData` no Core. Não rastreável sem git bisect aprofundado, mas o fix é forward-compatible.

**Por que não foi detectado pelos integration tests:** `consent-gate`, `monetization-e2e`, `aec-finalize-schema` testam fluxos específicos com `patientData` mockado, não exercitam o fluxo de history loading entre turnos.

**Lição operacional:** logs do Edge Function (servidor) são fonte de verdade. Logs `[REQUEST] historyLength: 0` apareciam SILENCIOSAMENTE há 28 dias. Próxima evolução do CI: alerta automático quando historyLength=0 em mais de N% das requests.

---

## 15. Análise GPT pós-deploy V1.9.49+50+52+53 (validação independente)

GPT rodou avaliação após o push e trouxe 5 pontos:

### Riscos remanescentes reconhecidos
1. **Identity ainda parcialmente incompleto** — V1.9.52 fechou só admin. `buildProfessionalContext` e `buildPatientContext` seguem sem `identity.name`. Pode causar inconsistência de tom em outros fluxos. **Próximo passo natural** — não é mais feature, é **unificação de identity resolution em uma camada determinística**.
2. **Regra de ouro semântica (V1.9.53) pode super-restringir** — risco UX clínico, não técnico. Só validável em runtime. Telemetria via `noa_logs` permite Pedro/Ricardo monitorar e refinar.

### Veredito GPT (consolidado)
| Eixo | Estado |
|---|---|
| Arquitetura | Evoluindo corretamente |
| Segurança | Forte (RLS + CI + audit) |
| Semântica | Consistente (V1.9.53 é marco real) |
| Identidade | Quase completa, ainda parcialmente distribuída |
| UX | Precisa validação em runtime real |

**Tradução arquitetural emergente:** sistema saiu de *"pipeline clínico funcional com regras"* para **"sistema clínico com identidade + governança + semântica controlada"**.

---

## 16. Pendências reconhecidas (próxima sessão)

### Identity unification (próximo P0 técnico — sugestão GPT)
- `buildProfessionalContext.ts` — adicionar `identity { name, email, type, crm? }`
- `buildPatientContext.ts` — adicionar `identity { name, email, type }`
- Considerar extrair `buildIdentity(userId)` como helper único reusado pelos 4 builders (DRY + camada determinística).

### Validação UX em runtime (regra de ouro)
- Monitorar `noa_logs.interaction_type='narrator_mode_decision'` (após Fix #1) e respostas de admin pra detectar super-restrição.
- Se aparecer ruído, ajustar prompt iterativamente.

### Pré-requisitos do Fix #1 (narrador escriba)
- `report_version` field migration (V1.9.5x ainda).
- 2 integration tests novos (AEC real sem Plano + simulação COM Plano).
- OK explícito Dr. Ricardo no texto V2.

---

## 17. Selo Final 25/04/2026

**Versões deployadas hoje:** **9 commits, 9 versões** (V1.9.47 → V1.9.55).

| Versão | Commit | Tipo | Status |
|---|---|---|---|
| V1.9.47 | (Mgmt API + commit anterior) | RLS clinical_reports unificada | ✅ Em prod |
| V1.9.48 | `794040f` | RLS em 3 backups | ✅ Em prod |
| V1.9.49 | `1e41e8c` | Gate racionalidades + audit | ✅ Em prod (Mgmt API + repo) |
| V1.9.50 | `4e3bbaf` | RLS audit gate no CI | ✅ Em prod |
| V1.9.51 | `dc5e91d` | Fix gráfico (cosmético) | ✅ Em prod |
| V1.9.52 | `f617072` | Admin context identity + clinical | ✅ Em prod |
| V1.9.53 | `f617072` | Regra de ouro do prompt refinada | ✅ Em prod |
| V1.9.54 | `<este commit>` | Tutorial do chat por perfil | ✅ Em prod |
| V1.9.55 | `<este commit>` | **FIX CRÍTICO** — patientData ignorado pelo Core (regressão antiga descoberta) | ✅ Em prod |

**Hash do dia:** `governanca-semantica-e-identidade-admin-fechada`
**Princípios reafirmados/emergentes:**
1. Antes de afirmar leak, reproduzir com query bruta.
2. Polimento cirúrgico = checklist + snapshot defensivo (não confiança cega).
3. Defesa em profundidade vence detecção única.
4. CI converte "cuidado pra não errar" em "impossível errar sem pipeline gritar".
5. **NOVO** — Não remover, transformar. Compatibilidade > ruptura.
6. **NOVO** — Identidade é camada, não detalhe. Próximo nível = unificação determinística.

**Encadeamento histórico:**
- 22-23/04: trust boundary clínico
- 24/04: restauração + CI ativo + LGPD detectado pelo próprio CI
- **25/04 (hoje): governança semântica + identidade admin + tutorial de uso fechados**

**Estado conceitual do projeto:**
> "App com backend" → "Sistema clínico com governança automatizada e identidade administrativa coerente."

**Próximo dia provável:** unificar identity em professional/patient/student (fechar gap remanescente) **OU** começar Fix #1 (narrador escriba) caso Dr. Ricardo dê OK no texto V2.

---

## 23. Tarde 25/04 — S4 Trust Boundary FECHADO (V1.9.58 + V1.9.59)

### Investigação preliminar S4 (read-only)
Mapeamento revelou: 9 Edge Functions, 5 invocadas pelo client, `tradevision-core` único deployado com `--no-verify-jwt` no CI, founder hardcode em `tradevision-core:1708`, body fallbacks em 4 linhas críticas (1517, 1543, 1584, 1719) + IDOR estrutural em profile lookup.

**Reframing GPT:** não é "fix de auth" — é **refactor de trust boundary**. Classe correta: IDOR + privilege inference + trust boundary leak híbrido. Princípio cristalizado: *"Body NUNCA participa de identidade — só payload funcional"*.

### V1.9.58 — Quick-fix defensivo (commit `b354466`)
1 mudança isolada: founder elevation ancorada em `jwtEmail`. Vetor mais grave (~80%) fechado. Validado em prod: logs mostram `[AUTH] Founder detected via JWT: phpg69@gmail.com` — JWT como source.

### V1.9.59 — Trust Boundary Refactor completo (commit `5ddad2e`)

**5+ mudanças em 1 commit atômico:**
1. Workflow CI: removido `--no-verify-jwt` (gateway Supabase valida JWT)
2. `DEPLOY_NOA.bat`: removido `--no-verify-jwt` (sem split-brain CI vs manual)
3. Core 1517: `idempotencyUserId = jwtUserId || 'anon'`
4. Core 1543: `.eq('id', jwtUserId)` (IDOR fechado — service_role bypassa RLS)
5. Core 1593: `effectiveUserId = jwtUserIdFromToken` + 401 hard fail
6. Core 1741: `effectiveEmail = jwtEmail` (sem fallback body)
7. Core 1761: branch redundante removido

GPT validou todas mudanças como "consistência do mesmo problema raiz" — não escopo creep.

### Bugs paralelos descobertos no teste (NÃO bloqueantes)

| Bug | Causa real | Classe |
|---|---|---|
| Y1 — loop "analise documento" | Estado `document_opened` não existe no Core | ISM ausente |
| Y2 — `show-document-inline` em todo turno | Event sourcing por heurística de linguagem | Falta de gating |
| Z — ~80k tokens/request | History 20 + RAG sempre ativo + prompt extenso | Performance |

GPT separou maturidade arquitetural:
- S4 = Segurança (CRÍTICO) — fechado
- Y1/Y2 = Estado conversacional (UX) — V1.9.6x
- Z = Performance — V1.9.7x

**Não tratar tudo como "bug genérico"** = maturidade arquitetural.

### Princípios cristalizados V1.9.59

1. **Body NUNCA participa de identidade** — só payload funcional
2. **Identity + data access não podem ser separadas** em sistema clínico
3. **Auth boundary precisa de window dedicada** (não madrugada, não impulso)
4. **Reframing > expansão de escopo** — "fix JWT" virou "trust boundary refactor" sem virar refactor maior
5. **Não voltar a mexer em auth no mesmo dia** — qualquer tweak = risco alto de regressão

## 24. Selo final 25/04 — Trust Boundary Estabilizado

**Selo:** 25/04/2026 — V1.9.59 Trust Boundary Refactor
**Hash:** `state-invalidate-pattern-ism-formalization-and-trust-boundary-closed`
**Versões deployadas hoje:** **14 (V1.9.47 → V1.9.59)**

### Estado por domínio (fim do dia)

| Domínio | Antes hoje | Fim 25/04 |
|---|---|---|
| **Trust Boundary (auth)** | 🔴 Baixo (--no-verify-jwt) | ✅ **Alto (V1.9.59)** |
| FSM clínico (AEC) | Alto | Alto + invalidate pattern |
| RLS / segurança schema | Alto | Inalterado |
| Persistência conversa | Alto | Inalterado |
| Identidade administrativa | Médio | Inalterado |
| Recovery clínico | Inexistente | ✅ Médio (V1.9.57 view) |
| Identidade pro/patient/student | Baixa | Inalterado (V1.9.6x) |
| ISM (interaction state) | Ausente | Identificado, não implementado |
| Test coverage | 30% | Inalterado |

### Tradução de fase (sem romantizar)
**Antes hoje:** *"sistema clínico com IA + risco crítico de privilege escalation"*
**Fim hoje:** *"sistema clínico com governança automatizada + trust boundary estabilizado + ISM como próxima camada"*

Mudança de **categoria** de risco (não mais vazamento clínico aberto), agora em categoria de **dívida de UX/state model**. Mudança de natureza, não só de grau.

### Princípio operacional final
> **"S4 fechado. Sistema sensível em auth boundary. Não voltar a mexer em auth hoje. Próximo passo NÃO é mais segurança — é Identity unification + ISM (V1.9.6x)."**

---

## 25. Noite 25/04 — Bugs paralelos, ISM Fase 1, Identity Unification, UI consolidation (V1.9.60 → V1.9.69)

Após V1.9.59 fechar S4 trust boundary, Pedro testou em prod como paciente e descobriu **5 bugs preexistentes** (não regressão de V1.9.59) + novas demandas de UX. A noite virou execução do que era backlog desde manhã: ISM, Identity unification, Bug A persistente. Mais correções pequenas de UI ao longo do caminho.

### V1.9.60 — Remover dState.context (commit anterior à sessão atual)
Linha 4319 do Core gerava `dState.context = "Continuando nossa conversa sobre ${label} —"` no fallback determinístico. V1.9.56 limpou `transparencies` mas esqueceu este. Em sessões com OpenAI oscilando, vazava template administrativo no fluxo paciente.

**Fix V1.9.60 — agressivo:** removida a linha inteira.
**Problema descoberto pós-deploy:** o bloco "reflexão contextual ao sair" usa essa info pra outras áreas. Pedro perguntou *"o bloco reflexão contextual ao sair prejudica outra área avaliou?"* — resposta foi sim.

### V1.9.61 — Restaurar dState.context com gate cirúrgico + hard cap context overflow
2 mudanças:
1. **dState.context restaurado** com gate `isPatient && currentIntent === 'CLINICA'` — só preenche em fluxo clínico paciente, nunca em contexto admin/profissional.
2. **Hard cap 60k chars no `safeReasoningContext`** antes do prompt build. Logs revelaram que perceived "OpenAI instável" era na verdade `context_length_exceeded` (140k tokens > 128k limit GPT-4o). Originalmente categorizei como infra issue — logs provaram que era overflow interno.

**Lição registrada em memória:** *"infra instável" pode ser context overflow. Sempre verificar logs antes de culpar OpenAI.*

### V1.9.62 — Bug FF: médicos parceiros inventados
Sintoma: chat fora-AEC dizia "Dr. João, Dra. Maria" como médicos da plataforma. Causa: query no Core procurava tabela `doctors` (não existe) e o fallback hardcoded. Fix: trocar pra `users.type='professional'` com identificação por email oficial (Ricardo, Eduardo, etc.). Zero invenção — só dados reais do banco.

### V1.9.63 / V1.9.64 — Avatar duplicado em /chat-noa
**V1.9.63:** Pedro reportou 2 imagens da Nôa em `/app/clinica/paciente/chat-noa`. Investigação mapeou:
1. Avatar grande de fundo do `PatientNOAChat.tsx:213` (350x350 com hover) — *correto, "o de trás"*.
2. Avatar orbital pequeno do `NoaConversationalInterface.tsx:3179` (empty state).

V1.9.63 adicionou prop `hideEmptyStateAvatar` ao `NoaConversationalInterface` e setou `true` no invoke do **modo embed** ([PatientNOAChat:175](src/pages/PatientNOAChat.tsx#L175)).

**V1.9.64 — fix incompleto:** Pedro recarregou e ainda viu duplicação. Descoberta: V1.9.63 só passou prop no embed, **deixou o invoke do modo normal** ([PatientNOAChat:280-287](src/pages/PatientNOAChat.tsx#L280)) sem a flag. V1.9.64 = 1 linha (`hideEmptyStateAvatar={true}` no segundo invoke). Lição: ler **todos** os call sites antes de declarar fix completo.

### V1.9.65 — Identity Unification (cumprindo promessa de V1.9.59)

Memória `project_identity_gap_25_04` documentava que V1.9.52 fechou identity só em admin. Profissional/paciente/aluno ainda recebiam resposta genérica "está logado como X" mesmo após "me identifique".

**Mudanças:**
- `buildPatientContext.ts`: select expandido (created_at, trial_ends_at) → +name/email/type. Zero query nova.
- `buildProfessionalContext.ts`: +1 query users em `Promise.all` (já era paralelo).
- `buildStudentContext.ts`: select expandido. Zero query nova.
- `buildAdminContext.ts`: já tinha desde V1.9.52, intacto.
- Core 3563-3571: regra "use userContext.identity.name" promovida de admin-specific para **regra UNIVERSAL na linha 0** das DIRETRIZES, com saudação por role:
  - Paciente: "Olá [Nome], que bom te ver por aqui."
  - Profissional: "Olá Dr(a). [Nome], como posso ajudar?"
  - Admin: "Olá [Nome], sua sessão administrativa está ativa."
  - Aluno: "Olá [Nome], pronto para mais um passo no aprendizado?"

**Decisão arquitetural:** criei `src/lib/buildIdentity.ts` como helper, mas removi por não estar sendo usado. CLAUDE.md instrui *"Don't introduce abstractions beyond what the task requires"*. **Shape `{name, email, type}` consistente é o contrato — não um helper file.**

Memória `project_identity_gap_25_04` marcada **RESOLVIDO V1.9.65**.

### V1.9.66 — Interaction State Model (ISM) Fase 1

Cumprimento parcial da camada arquitetural fundacional formalizada por GPT (memória `project_interaction_state_model_camada_fundacional`). Bugs CC, GG, HH, "vamos no 4", CONSENT_PENDING_BLOCKED, entity resolution Ricardo são manifestações da MESMA classe — estado conversacional não modelado no payload.

**Fase 1 = puramente aditiva (zero comportamento novo):**
- `src/lib/conversationState.ts` (NOVO): tipo `ConversationState` v1 + builder fail-safe
- `noaResidentAI.ts:1950`: payload do invoke ganha `conversation_state` consolidado:
  ```ts
  {
    schema_version: 1,
    phase: AecPhase,
    consent_status: 'pending'|'given'|'declined'|'unknown',
    physician_viewing_as: string | null,
    viewing_as_role: ... | null,        // reservado pra Fase 2 (CC fix)
    real_role: ...,
    active_slot: string | null          // reservado pra Fase 3 (HH fix)
  }
  ```
- `tradevision-core/index.ts:1605-1626`: lê `body.conversation_state` e loga em `noa_logs.interaction_type='ism_state_observed'` antes da divergência finalize/chat. Fail-open.

**Fases 2-3 dependem de 24-48h de telemetria pra validar distribuição real.**

### V1.9.67 — Bug A persistente RESOLVIDO (Camada 3 Prevention)

Investigação contradisse o resumo prévio que dizia "3 fases (INITIAL_GREETING, OBJECTIVE_QUESTIONS, COMPLAINT_DETAILS) não chamavam markPhaseCompleted". Verificação de código mostrou que **essas fases TÊM as chamadas** (linhas 746, 1212, 1336).

**Causa real (descoberta hoje):**
[clinicalAssessmentFlow.ts:1126](src/lib/clinicalAssessmentFlow.ts#L1126) — refusal path pós-INTERRUPTED fazia `state.phase = 'COMPLETED'` SEM marcar fases pendentes. Resultado: `is_complete=false` na DB (GENERATED column compara `completed_phases @> required_phases`). Carolina (25/04 manhã) caiu nesse caminho ao recusar retomar AEC.

**Fix V1.9.67:**
- Novo método `invalidateAssessment(userId, reason)` em `clinicalAssessmentFlow.ts:1485-1521`:
  - Snapshot in-memory captado ANTES do delete (audit trail)
  - **Delete síncrono in-memory ANTES dos awaits** (evita race com turn seguinte)
  - Insert em `noa_logs.interaction_type='aec_state_invalidated_explicit'`
  - Update DB: `invalidated_at + invalidation_reason` (V1.9.57 schema)
  - Princípio reusado: invalidate ≠ DELETE
- Substituição na refusal path: `state.phase = 'COMPLETED'` → `invalidateAssessment(userId, 'user_refused_resume_after_interrupted')`
- Audit invariant em `completeAssessment`: warning se chegar sem `FINAL_RECOMMENDATION` marcado

Memória `project_aec_residual_state_25_04` marcada **RESOLVIDO V1.9.67**.

### V1.9.68 — Relatórios Clínicos: unificação Clínico + Analytics, remoção da Lista

Pedro reportou: aba "Lista" pobre (só busca + 2 filtros) competindo com "Clínico" (componente rico de 1300 linhas que Ricardo prefere) e "Analytics" (gráficos complementares). Auditoria pré-aplicação confirmou:
- Pacientes: imunes — `Reports.tsx:203` retorna `null` para `type=paciente`
- Links externos `?view=list`: zero matches no codebase
- `?patient=ID` de Patients.tsx: ignorado (Reports.tsx não usa `useSearchParams`)
- Sidebar: 3 links sem state

**Fix mínimo, postura conservadora:**
- [Reports.tsx:47](src/pages/Reports.tsx#L47): default `'list'` → `'component'` (Clínico)
- [Reports.tsx:235](src/pages/Reports.tsx#L235): removida entry `{ mode: 'list', label: 'Lista' }` do toggle
- Código do modo `'list'` (~358-460) **preservado como dead code** pra rollback trivial

**Validação honesta com Pedro:** unificação foi parcial — Lista some, Clínico vira default, mas Analytics continua aba separada (não fundida inline). Fase 2 (Analytics inline + drill-down) fica pendente até feedback Ricardo.

### V1.9.69 — Padronização visual Terminal Administrativo

Pedro reportou: `/app/admin` ([ClinicalGovernanceAdmin.tsx](src/pages/ClinicalGovernanceAdmin.tsx)) com tom escuro destoante do resto da app. Investigação: linha 148 usava hex hardcoded `bg-[#050914]` enquanto Landing/PatientNOAChat/AlunoDashboard usam `bg-slate-950` (#020617).

Fix: 1 caractere — `bg-[#050914]` → `bg-slate-950`. Risco zero, padronização visual.

---

## 26. Bugs paralelos no Pedro Paciente (descobertos no caminho, NÃO bloqueantes)

Memória `project_modo_visualizacao_e_fallback_25_04` cataloga 5 bugs descobertos em teste pós-V1.9.59, todos **preexistentes** (não regressão):

| Bug | Descrição | Classe | Status |
|---|---|---|---|
| AA | OpenAI oscilando ativava fallback determinístico | Context overflow | ✅ V1.9.61 |
| BB | `dState.context` vazava "Continuando nossa conversa" | V1.9.56 incompleto | ✅ V1.9.60+61 |
| CC | `tipoVisual` (modo visualização aluno) não chega ao Core | ISM ausente | ⏳ Fase 2 ISM |
| DD | Mensagens duplicadas (race em useMedCannLabConversation) | Race condition client | Não atacado |
| EE | UI auto-injection chega como `role: user` | ISM ausente | ⏳ Fase 2 ISM |
| FF | Médicos parceiros inventados (Dr. João/Dra. Maria) | Tabela `doctors` inexistente | ✅ V1.9.62 |
| GG | Card de agendamento abre antes do consent | ISM ausente | ⏳ Fase 2 ISM |
| HH | Mapeamento literal de respostas pro slot errado | FSM + ISM | ⏳ Fase 3 ISM |

3 bugs (CC, GG, HH) explicitamente subsumidos pela **camada ISM** — confirmando a tese arquitetural de GPT.

---

## 27. Princípios cristalizados V1.9.6x (noite)

1. **"Não inventar coisas novas, consolidar o que existe"** — V1.9.68 reusa 100% do que já estava no codebase. Eliminar redundância > criar feature.
2. **"Ler todos os call sites antes de declarar fix completo"** — V1.9.63 → V1.9.64 ensinou: 2 invokes do mesmo componente, fix em só 1 = bug visível.
3. **"Telemetria antes de comportamento"** — ISM Fase 1 é puramente aditiva. 24-48h de log antes de Fase 2 mudar Core.
4. **"Quando resumo prévio diverge do código, código é a verdade"** — Bug A: causa real era refusal path 1126, não as 3 fases que o resumo dizia. Investigar > confiar em memória stale.
5. **"Verificar logs antes de culpar infra"** — Bug Z (context overflow) parecia "OpenAI instável". Logs provaram que era interno.
6. **"Postura conservadora: dead code > deletado"** — V1.9.68 mantém modo `'list'` como dead code pra rollback. Limpeza vem só após validação Ricardo.
7. **"Princípio invalidate ≠ DELETE estende além de DB"** — V1.9.67 aplicou em FSM client (in-memory state). Sistema clínico nunca destrói, sempre arquiva.

---

## 28. Selo Final REAL 25/04/2026

**Versões deployadas hoje:** **23 commits, 23 versões** (V1.9.47 → V1.9.69) — dia mais produtivo da história do projeto.

| Bloco | Versões | Foco |
|---|---|---|
| Manhã | V1.9.47 → V1.9.48 | RLS unificada + 3 backups fechados |
| Tarde inicial | V1.9.49 → V1.9.55 | Racionalidades gate, CI gate, identity admin, fix patientData |
| Tarde-Noite | V1.9.56 → V1.9.59 | "Modo local" removido, S4 Trust Boundary fechado |
| Noite | V1.9.60 → V1.9.69 | Bugs paralelos, ISM Fase 1, Identity completo, UI consolidation |

**Hash do dia:** `trust-boundary-closed-ism-foundation-laid-identity-unified`

**Encadeamento histórico:**
- 22-23/04: trust boundary clínico
- 24/04: restauração + CI ativo + LGPD detectado
- **25/04 (hoje): governança + identidade + ISM Fase 1 + UI consolidation**

**Estado por domínio (fim REAL do dia 25/04):**

| Domínio | Início 25/04 | Fim 25/04 |
|---|---|---|
| **Trust Boundary (auth)** | 🔴 `--no-verify-jwt` | ✅ V1.9.59 trust boundary fechado |
| **Identidade (4 roles)** | 🟡 só admin (V1.9.52) | ✅ V1.9.65 todos 4 builders unificados |
| **FSM clínico (AEC)** | 🟡 inconsistência refusal | ✅ V1.9.67 invalidate path |
| **ISM (interaction state)** | 🔴 ausente | 🟡 Fase 1 (schema + log) |
| **RLS / segurança schema** | 🟢 alto | ✅ V1.9.47+48 reforço |
| **UX Reports** | 🟡 3 abas competindo | ✅ V1.9.68 consolidado |
| **UX Admin visual** | 🟡 hex divergente | ✅ V1.9.69 padronizado |
| **Recovery clínico** | 🔴 inexistente | ✅ V1.9.57+67 invalidate pattern |
| **Bugs paciente preexistentes** | 8 abertos | 4 fechados (AA/BB/FF/64) + 4 pendentes |
| **Test coverage** | 30% | Inalterado (próximo bloco) |

**Tradução de fase (sem romantizar):**
- **Antes hoje:** *"sistema clínico com IA + risco crítico de privilege escalation + identidade fragmentada"*
- **Fim hoje:** *"sistema clínico com governança automatizada + trust boundary fechado + identidade unificada + ISM Fase 1 entregue + UX consolidada"*

Mudança qualitativa: **não é mais sobre fechar vulnerabilidade**, é sobre **construir camadas arquiteturais que previnem classes inteiras de bugs**. Padrão "elite escalável" assumido conscientemente em vez de patch-and-deploy.

**Princípios operacionais consolidados (acumulados ao longo do dia):**
1. Antes de afirmar leak, reproduzir com query bruta.
2. Polimento cirúrgico = checklist + snapshot defensivo.
3. Defesa em profundidade vence detecção única.
4. CI converte "cuidado pra não errar" em "impossível errar sem pipeline gritar".
5. Não remover, transformar. Compatibilidade > ruptura.
6. Identidade é camada, não detalhe.
7. Body NUNCA participa de identidade.
8. Auth boundary precisa de window dedicada.
9. Telemetria antes de comportamento — ISM Fase 1 = aditiva 24-48h antes de Fase 2.
10. Não inventar, consolidar.
11. Invalidate ≠ DELETE — princípio clínico estende a state in-memory.
12. Dead code > deleção precoce — preservar reversibilidade até validação real.
13. Ler **todos** os call sites antes de declarar fix completo.
14. Verificar logs antes de culpar infra.

**Próximo dia provável:**
- ISM Fase 2 (Core respeita `consent_status` + `viewing_as_role`) após 24-48h de telemetria
- Reports Fase 2 (Analytics inline + drill-down) após feedback Ricardo
- Bugs DD/CC/EE/GG/HH paciente — todos via Fase 2-3 do ISM
- Test coverage expansion — único domínio que não evoluiu hoje

---

## 29. Auditoria Lovable cruzada + V1.9.70-71 + cleanup operacional (25/04 noite tardia)

Após "selo final" da Seção 28, sessão continuou com auditoria externa do Lovable e descobertas críticas que reformularam o roadmap.

### 29.1 Cross-check da auditoria Lovable
Lovable rodou auditoria 360º read-only via [auditoria mestra completa](AUDITORIA_LOVABLE_CROSS_CHECK_25_04_2026.md). Pedro pediu validação ponto-a-ponto.

**Achados confirmados (Lovable acertou):**
- DecompressionStream("raw") inválido em [extract-document-text:295](supabase/functions/extract-document-text/index.ts#L295)
- Volumetria batendo (5040 linhas tradevision-core, 1395 useMedCannLabConversation)
- **Cluster IMRE quebra type-check** (após rebase de `types.ts` — 102 erros tsc)
- 0 reports `review_status='approved'` em 75 (gargalo de revisão)
- 50% cancellation rate em agendamentos
- 0 estados `aec_assessment_state.is_complete=true` (motor não fechava ciclo)

**Achados refutados:**
- Referência fantasma `npm:openai@^4.52.5` — único import é `esm.sh/openai@4`, sem `deno.lock` no projeto
- "10 edge functions" — são 9 (Lovable contou `_shared`)

**Lição registrada (memória `project_lovable_cross_check`):** auditoria externa pode ser MAIS rigorosa que validação local. Lovable regenerou `types.ts` contra banco real; eu validei contra repo stale e refutei equivocadamente. **Retratei publicamente** (commit `e328edf`). Mesma lição das 26 views (manhã).

### 29.2 V1.9.70 — Fechar ciclo FSM terminal
GPT consolidou: *"sistema com duas verdades divergentes — clinical_reports diz que terminou, aec_assessment_state diz que nunca terminou. Não é simplificação, é dívida técnica silenciosa."*

Investigação encontrou que estado terminal `phase=COMPLETED` era setado in-memory mas **nunca persistido** em DB:
- [clinicalAssessmentFlow.ts:1098](src/lib/clinicalAssessmentFlow.ts#L1098) (case FINAL_RECOMMENDATION → COMPLETED via switch)
- [clinicalAssessmentFlow.ts:1487](src/lib/clinicalAssessmentFlow.ts#L1487) (`completeAssessment` chamado por `noaResidentAI:2022` quando Core devolve `[ASSESSMENT_COMPLETED]`)

**Fix V1.9.70 — 3 mudanças coordenadas:**
1. `void this.persist(userId)` em FINAL_RECOMMENDATION case
2. `void this.persist(userId)` em `completeAssessment`
3. `case 'COMPLETED'` em `getPhaseResumePrompt`: "Sua avaliação clínica anterior já está concluída" (antes caía em default "Vamos continuar de onde paramos" — incoerente para terminal)

**Princípio FSM:** todo estado terminal precisa ser persistido explicitamente.

### 29.3 V1.9.71 — Fix DecompressionStream
[extract-document-text/index.ts:295](supabase/functions/extract-document-text/index.ts#L295): `"raw"` não é valor válido em `CompressionFormat` (spec aceita `'gzip' | 'deflate' | 'deflate-raw'`). DOCX/ZIP usam DEFLATE puro sem header zlib. Fix: `"raw"` → `"deflate-raw"` (3 caracteres).

### 29.4 Cleanup operacional — 3 AEC pendentes invalidadas
Validação SQL via Management API revelou 3 estados em `aec_assessment_state`:

| User | Phase | Status |
|---|---|---|
| `casualmusic2021@gmail.com` (Pedro Paciente) | COMPLETED | Invalidado runtime guard 15:54 |
| `carolinacampellovalenca@gmail.com` (paciente real Ricardo) | COMPLETED | Invalidado retroativo 13:41 (V1.9.57) |
| `mariorvalenca@outlook.com` | INTERRUPTED 3 semanas | **Invalidado nesta sessão** com snapshot em `noa_logs` |

Estado final: **0 AEC ativas no banco** (todas com snapshot preservado em audit trail).

### 29.5 ESCALADO — Cluster IMRE legacy não pôde ser deletado
Lovable sugeriu deletar 4 arquivos legacy IMRE pra zerar tsc. Investigação revelou:
1. `clinicalAssessmentService.ts:13` tem cabeçalho explícito: **"NÃO DELETAR sem autorização explícita"** (gap C4 documentado)
2. `ClinicalAssessment.tsx` está em rota ativa (`/clinica/paciente/avaliacao-clinica`) e **usa `imre_assessments` + `clinical_integration` diretamente** (linhas 217-251)
3. Página provavelmente quebrada em prod (insert em tabela inexistente falha silenciosamente), mas não bloqueia ninguém — fluxo real de AEC vai por `/chat-noa`

Decisão: **escalado pra Ricardo**. 3 caminhos pendentes (deprecar feature / recriar tabelas IMRE / refatorar `ClinicalAssessment.tsx` pra usar `clinical_reports`). Memória `project_imre_cluster_escalado_25_04` arquiva.

### 29.6 Achado arquitetural mais valioso do dia
Pedro rodou AEC end-to-end e finalizou. Validação SQL revelou que **gerou pelo fluxo legado em memória**, não pelo motor V1.9.57+ DB-backed. Frase do GPT validada empiricamente:
> *"Estamos protegendo um caminho que ninguém percorreu"*

V1.9.70 corrigiu isso — próxima AEC finalizada gera primeiro `is_complete=true` da história do projeto.

### 29.7 Selo REAL FINAL 25/04 (atualizado)

**Versões deployadas hoje:** **25 commits, 25 versões** (V1.9.47 → V1.9.71) — recorde absoluto.

**Hash final do dia:** `trust-boundary-closed-ism-foundation-laid-identity-unified-fsm-cycle-closed`

**Mudança qualitativa REAL:** sistema deixou de ter "duas verdades divergentes" sobre AEC concluída. Era a dívida silenciosa que GPT apontou. V1.9.70 fechou o ciclo FSM. Próxima AEC vai gerar consistência real entre `clinical_reports` e `aec_assessment_state`.

**Princípio adicional cristalizado (V1.9.70):**
> *"Auditoria externa pode ser MAIS rigorosa que validação local — quando o ambiente externo regenera tipos contra schema atual e o repo deixou stale."*

**Memórias adicionadas nesta extensão:**
- `project_imre_cluster_escalado_25_04` — escalation pra Ricardo
- Atualizado `project_aec_residual_state_25_04` — resolvido V1.9.67
- Atualizado `project_interaction_state_model_camada_fundacional` — Fase 1 entregue V1.9.66
- `project_leitura_estrategica_25_04_noite` — reframe GPT 4 saltos + ordem refinada Fase 2 ISM

**Próximo dia provável (atualizado):**
- Investigação: Ricardo decide caminho IMRE (A/B/C) — escalation
- ISM Fase 2 (consent enforcement = invariant lógico, não depende de telemetria)
- Observability dashboard — radar de produção (6 métricas mínimas)
- Bug operacional crítico: `review_status='draft'` em 100% reports — fluxo de revisão profissional não exercitado

Próxima sessão acorda com plano executável em `project_estado_e_backlog_25_04_manha`.
