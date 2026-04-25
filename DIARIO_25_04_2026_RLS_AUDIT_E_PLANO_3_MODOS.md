# DIÁRIO 25/04/2026 — Auditoria de RLS, Correções Cirúrgicas e Plano dos 3 Modos da Nôa

> **Marco:** dia de validação e calibração depois de 2 dias intensos de execução (23 e 24/04). Pegamos um falso positivo nosso, retratamos publicamente, aplicamos 2 correções de segurança em produção via Management API, e construímos o plano cirúrgico para os 3 modos epistemológicos da Nôa (AEC / Chat / Racionalidades) — alinhado à tese do Dr. Ricardo Valença: *"IMRE pergunta. AEC escuta. O relatório organiza. A clínica interpreta."*
>
> **Princípio do dia:** quando a evidência muda, a afirmação muda. Auditoria sem reproduzir o suposto leak vira teatro.

---

## 1. Resumo Executivo

O dia começou com Pedro pedindo "voltamos aonde paramos? verificar o possível" — pergunta de retomada após o dia de 24/04 ter fechado com 29 versões deployadas, CI ativo e auditoria LGPD declarada coerente. Ao longo do dia:

- **Pegamos e retratamos um falso positivo nosso** ("26 views sem RLS" — query errada perpetuada de docs antigos).
- **Aplicamos V1.9.47** via Management API: policy `clinical_reports` unificada (`is_admin()` + 4 UUIDs de sócios fundadores como break-glass + vínculos clínicos preservados).
- **Aplicamos V1.9.48** via Management API: ENABLE RLS em 3 tabelas backup desprotegidas (`clinical_reports_content_backup_24_04`, `documents_backup_23_04_2026`, `generated_slides_archive`).
- **Construímos o plano dos 3 Modos da Nôa** após esclarecimento do Dr. Ricardo sobre IMRE (memória `project_imre_clarification_24_04`) e exploração profunda do `tradevision-core` (~4300 linhas).
- **Mapeamos 8 riscos** do plano, em particular o risco de quebrar Simulador + Teste de Nivelamento se Fix #1 (narrador escriba) for aplicado sem gate pedagógico.
- **Atualizamos memórias** para sessões futuras não repetirem o erro de auditoria de RLS (`project_lessons_learned_rls_audit.md`).

Princípio reafirmado hoje: **"antes de afirmar leak, reproduzir com query bruta. Antes de propor fix, verificar terminologia. Antes de aplicar, ter rollback documentado."**

Princípio emergente: **"polimento cirúrgico não é confiança cega — é cirurgia com checklist e snapshot defensivo."**

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
