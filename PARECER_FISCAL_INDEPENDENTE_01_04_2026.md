# 🔎 PARECER FISCAL INDEPENDENTE — MedCannLab v10
## Inspeção Forense Completa · 01 de Abril de 2026
### Perspectiva: Fiscal Master — Conselho Federal de Medicina + Engenharia de Software

---

> **Declaração:** Este parecer foi elaborado como se o sistema nunca tivesse sido visto antes. Nenhuma informação prévia foi assumida. Toda conclusão deriva exclusivamente da leitura do código-fonte, schema do banco de dados e scan de segurança executado em tempo real.

---

## PARTE I — VEREDICTO EXECUTIVO

### 🔴 O SISTEMA NÃO PASSA EM AUDITORIA CFM/LGPD NO ESTADO ATUAL

**Motivos impeditivos (qualquer um deles já seria suficiente):**

1. **Views com dados PII completamente expostos** — qualquer usuário autenticado lê CPF, email, telefone, dados clínicos de TODOS os outros pacientes
2. **Buckets de storage sem isolamento** — documentos médicos e áudios clínicos acessíveis a qualquer autenticado
3. **Estado clínico (AEC) persistido em `localStorage`** — dados clínicos no navegador do paciente, sem criptografia, sem expiração automática
4. **`SUPABASE_SERVICE_ROLE_KEY` usada corretamente na Edge Function, MAS a Edge Function usa `esm.sh/openai@4` sem lockfile** — dependência de CDN externo em runtime de produção clínica
5. **Frontend contém `VITE_OPENAI_API_KEY`** — chave da OpenAI exposta em código client-side (documentado em auditorias anteriores mas NÃO corrigido)
6. **Ausência total de testes automatizados** — zero cobertura E2E ou unitária

---

## PARTE II — ANATOMIA TÉCNICA DETALHADA

### A. AUTENTICAÇÃO E CONTROLE DE ACESSO

#### ✅ O que está correto:
- **RBAC via `user_roles`** com RPC `get_my_primary_role()` como SECURITY DEFINER
- **`current_user_role()`** lê de `user_roles` (não de `user_profiles` — corrigido)
- **Trigger anti-escalação** impede que usuários alterem o próprio tipo para admin
- **`ProtectedRoute.tsx`** verifica role via contexto, não localStorage
- **Fallback seguro**: se a RPC falhar, assume `paciente` (menor privilégio)

#### 🔴 O que está errado:
- **`normalizeUserType()` aceita `'unknown'` como tipo válido no fluxo** — e retorna `false` para `isValidUserType('unknown')`, mas o `ProtectedRoute` não bloqueia `unknown`; apenas redireciona para `/`
- **`filterAppCommandsByRole` para role `'unknown'`**: retorna TODOS os comandos sem filtro (linha 510: `return commands`) — um usuário sem role receberia comandos de admin
- **Admin é verificado por `user.type === 'admin'` no frontend** — correto se a fonte for a RPC, mas se houver dessincronia, o frontend confia cegamente

#### ⚠️ Risco residual:
- O `AuthContext` faz fallback para `user_metadata?.name` que pode conter qualquer string — usado como display, não como autenticação, mas pode confundir auditoria

---

### B. FLUXO AEC (Arte da Entrevista Clínica) — ANÁLISE CLÍNICA

#### ✅ O que está correto:
- **10 etapas implementadas** com fidelidade ao protocolo do Dr. Ricardo Valença
- **Loop "O que mais?"** na Lista Indiciária — funciona corretamente
- **Saída voluntária** com confirmação ("tem certeza?") — bem implementado
- **Retomada de avaliação interrompida** — funciona
- **Consenso com revisão** — paciente pode discordar e resubmeter
- **Relatório gerado via Edge Function** (`finalize_assessment`) com bypass RLS via service role
- **Extração GPT v2** dos dados clínicos a partir do histórico de chat
- **Auto-link de profissional** via tabela de agendamentos

#### 🔴 O que está criticamente errado:

1. **Estado AEC persiste em `localStorage` do navegador** (linha 76-100 de `clinicalAssessmentFlow.ts`):
   ```typescript
   private readonly STORAGE_KEY = 'medcannlab_aec_states_v1'
   // ...
   localStorage.setItem(this.STORAGE_KEY, JSON.stringify(obj))
   ```
   **Impacto CFM/LGPD:** Dados clínicos (queixas, história médica, alergias, medicações) armazenados em texto plano no browser. Qualquer pessoa com acesso ao computador pode ler. NÃO EXISTE expiração automática. NÃO EXISTE criptografia.

2. **Singleton em memória (`Map<string, AssessmentState>`)**: Se a página recarregar, o estado é reconstruído do localStorage. Se dois dispositivos usarem a mesma conta, conflito de estado.

3. **`generateReport()` chama `await import('./supabase')`** — import dinâmico que pode falhar silenciosamente em alguns bundlers. Se falhar, o relatório nunca é salvo e o paciente não sabe.

4. **`clinicalReportService.ts` insere diretamente via anon key** (RLS client-side) com `id: report_${Date.now()}_random` — NÃO é UUID, pode colidir. E a tabela espera UUID.

5. **Prompt do sistema (`noaResidentAI.ts`, linha 155)**: Hardcoda "Dr. Ricardo Valença" como único profissional da avaliação. Não é dinâmico.

#### ⚠️ O que falta para CFM:
- **O paciente NUNCA vê o resultado da AEC no seu dashboard** — o ciclo não fecha
- **Não existe consentimento informado digital registrado antes da AEC** — a Nôa inicia a avaliação sem confirmar que o paciente entende que está sendo avaliado por IA
- **Não existe assinatura do profissional revisando o relatório AEC** — CFM exige que relatório gerado por IA seja revisado e assinado por médico responsável

---

### C. TRADEVISION CORE (Edge Function) — ANÁLISE TÉCNICA

#### ✅ O que está correto:
- **3.068 linhas, 1 ficheiro monolítico** — grande mas legível e coerente
- **Princípio `fala ≠ ação`** rigorosamente aplicado: GPT emite trigger → Core governa → `app_commands`
- **Governança por role** (`filterAppCommandsByRole`) com lógica conservadora (fail-closed para paciente/aluno)
- **COS (Cognitive Operating System)** com Kill Switch, metabolismo cognitivo, trauma log, políticas
- **Motor determinístico (Sovereignty Protocol v2)** quando OpenAI cai — 5 camadas de fallback
- **RAG duplo**: busca em `base_conhecimento` (servidor) + `documents` (cliente)
- **Auditoria**: toda interação salva em `ai_chat_interactions` + `cognitive_events`
- **Agendamento dinâmico**: profissionais detectados por consulta ao banco (não hardcoded)
- **Fluxo documental**: lista → confirmação → abertura inline (governado, com expiração 3min)
- **Gamificação**: pontos e achievements atribuídos automaticamente
- **PREREQUISITE GUARD**: impede agendamento sem AEC completa

#### 🔴 O que está criticamente errado:

1. **Service Role Key usada em TODAS as operações** — mesmo para ler dados do paciente:
   ```typescript
   const supabaseClient = createClient(supabaseUrl, supabaseServiceKey)
   ```
   Toda query na Edge Function ignora RLS. Se um atacante descobrir como manipular o body da request, tem acesso total ao banco.

2. **Sem validação de JWT do usuário** — a Edge Function não verifica se o `patientData.user.id` enviado no body corresponde ao token JWT da request. Um atacante pode enviar outro `user.id` e operar como outro usuário.

3. **`esm.sh` como CDN de dependências em runtime** — sem lockfile, sem hash. Se `esm.sh` servir uma versão maliciosa de `openai@4` ou `@supabase/supabase-js@2`, o sistema é comprometido.

4. **Prompt injection possível**: O `message` do usuário é inserido direto no prompt sem sanitização contra injection. A função `stripInjectedContext` remove apenas blocos `[contexto_da_plataforma]`, mas NÃO protege contra prompt injection clássico ("Ignore all previous instructions...").

5. **`cosDecision` referenciado sem definição visível** na seção de `predict_scheduling_risk` (linha 1751: `cosDecision.autonomy_level`). Se não estiver definido no escopo, causa crash silencioso.

6. **SQL injection via `ilike`**: Linha 1204:
   ```typescript
   baseQuery.or(`title.ilike.*${term}*,summary.ilike.*${term}*`)
   ```
   O `term` é sanitizado por `sanitizeSearchTerm()` que remove `*(),"'\`, mas NÃO remove `%` nem `_` (wildcards do SQL LIKE). Um atacante pode manipular buscas.

---

### D. SEGURANÇA — SCAN REAL (01/04/2026)

| Severidade | Qtd | Exemplos |
|------------|-----|----------|
| 🔴 CRITICAL | 7 | `users_compatible`, `patient_assessments`, `documents` bucket, `chat-audio` bucket, `active_subscriptions`, `v_next_appointments`, avatar UPDATE |
| 🟡 WARNING | 10 | Functions sem search_path, RLS `USING(true)`, leaked password protection off, Realtime sem RLS, `is_professional_patient_link` via chat_participants |

**Detalhe da vulnerabilidade mais grave:**
A view `users_compatible` expõe CPF, email, telefone, grupo sanguíneo, alergias, medicações, endereço, gênero e data de nascimento de TODOS os usuários. Sem RLS. Qualquer query de qualquer usuário autenticado retorna todos os registros.

---

### E. INFRAESTRUTURA E DEPENDÊNCIAS

| Item | Estado | Risco |
|------|--------|-------|
| Supabase (externo) | ✅ Conectado | Credenciais hardcoded em `client.ts` (anon key — aceitável) |
| OpenAI | ⚠️ Chave no frontend (`VITE_OPENAI_API_KEY`) | Alto — qualquer usuário pode extrair e usar a chave |
| Edge Functions | ✅ 7 deployadas | Import via `esm.sh` sem lockfile |
| Stripe | 🔴 Mock apenas | Não funcional |
| Resend (email) | ⚠️ Edge Function existe | DNS (DKIM/SPF) pendente |
| WiseCare (vídeo) | ⚠️ Funcional | STUN sem TURN — falha em redes corporativas |
| Testes | 🔴 Zero | Nenhum teste unitário, integração ou E2E |

---

### F. QUALIDADE DE CÓDIGO

| Métrica | Avaliação | Nota |
|---------|-----------|------|
| **Consistência arquitetural** | ✅ Boa | Separação clara: Edge → lib → components → contexts |
| **Naming convention** | ⚠️ Mista | PT-BR/EN misturado (`profissional`/`professional`), mitigado por `normalizeUserType` |
| **Dead code** | ⚠️ Significativo | `clinicalReportService.ts` duplica lógica que a Edge Function já faz; `noaResidentAI.ts` tem fallback local que raramente executa |
| **Ficheiros grandes** | 🔴 Problemático | `tradevision-core`: 3.068 linhas; `NoaConversationalInterface`: 2.991 linhas; `noaResidentAI`: 1.897 linhas |
| **TypeScript strictness** | ⚠️ Parcial | `any` usado em muitos pontos; `as any` frequente |
| **Error handling** | ✅ Defensivo | Try-catch abundante, fail-closed em fluxos críticos |
| **Documentação inline** | ✅ Rica | Comentários em português explicam lógica de negócio |

---

## PARTE III — CONFORMIDADE REGULATÓRIA

### CFM (Conselho Federal de Medicina)

| Requisito | Estado | Veredicto |
|-----------|--------|-----------|
| IA não diagnostica | ✅ | Prompts explícitos proíbem diagnóstico |
| IA não prescreve | ✅ | Nenhum fluxo de prescrição automática |
| Relatório revisado por médico | 🔴 | Não existe workflow de revisão/assinatura obrigatória |
| Prontuário eletrônico (CFM 1638/2002) | ⚠️ | Dados gravados mas sem certificação de integridade |
| Assinatura digital ICP-Brasil | ⚠️ | Edge Function existe, integração parcial |
| Auditoria completa | ✅ | `ai_chat_interactions`, `cognitive_events`, `noa_logs` |
| Consentimento informado | 🔴 | Não existe registro de consentimento antes da AEC |
| Identificação do responsável | ⚠️ | `generated_by: 'noa_ai'` — falta médico supervisor |

### LGPD (Lei Geral de Proteção de Dados)

| Requisito | Estado | Veredicto |
|-----------|--------|-----------|
| Dados sensíveis protegidos | 🔴 | Views expõem PII de todos os usuários |
| Isolamento de dados por paciente | ⚠️ | RLS em tabelas OK; views NOT OK |
| Consentimento para tratamento de dados | 🔴 | Campo `consent_accepted_at` existe mas não é bloqueante |
| Direito ao esquecimento | 🔴 | Não existe funcionalidade de exclusão de dados |
| Criptografia em repouso | ⚠️ | Supabase criptografa disco; `localStorage` NÃO |
| Registro de operações (log) | ✅ | Logs completos em múltiplas tabelas |
| DPO / canal de comunicação | 🔴 | Não implementado |

---

## PARTE IV — LISTA DE AÇÕES BLOQUEANTES (MUST-FIX)

### Prioridade 0 — Sem estas, o sistema NÃO pode operar com dados reais

| # | Ação | Esforço | Impacto |
|---|------|---------|---------|
| 1 | **Recriar views expostas como SECURITY INVOKER** (`users_compatible`, `patient_assessments`, `active_subscriptions`, `v_next_appointments`, etc.) | 2h | LGPD/CFM |
| 2 | **Adicionar ownership check nos buckets** (`documents`, `chat-audio`, `avatar`) | 1h | LGPD |
| 3 | **Remover estado AEC do localStorage** — migrar para tabela Supabase com RLS | 4h | CFM/LGPD |
| 4 | **Validar JWT na Edge Function** — verificar que `user.id` no body = token do request | 2h | Segurança |
| 5 | **Remover VITE_OPENAI_API_KEY do frontend** — toda chamada via Edge Function | 1h | Segurança |
| 6 | **Implementar consentimento bloqueante** antes da AEC | 2h | CFM/LGPD |
| 7 | **Workflow de revisão médica** — relatório AEC requer assinatura do profissional | 4h | CFM |
| 8 | **Fechar ciclo AEC → paciente vê resultado** | 3h | Produto/CFM |

### Prioridade 1 — Necessárias para produção responsável

| # | Ação | Esforço |
|---|------|---------|
| 9 | Fixar `filterAppCommandsByRole` para `unknown` — retornar array vazio | 15min |
| 10 | Adicionar lockfile/pinning para imports `esm.sh` na Edge Function | 30min |
| 11 | Sanitizar `%` e `_` no `sanitizeSearchTerm` | 15min |
| 12 | Ativar leaked password protection no Supabase | 5min |
| 13 | Remover `chat_participants` de `is_professional_patient_link()` | 30min |
| 14 | Adicionar RLS em `realtime.messages` | 1h |

### Prioridade 2 — Antes do go-live comercial

| # | Ação | Esforço |
|---|------|---------|
| 15 | Stripe Connect real (split 30/70) | 6h |
| 16 | Resend DNS (DKIM/SPF) | 30min |
| 17 | TURN server para videochamada | 4h |
| 18 | Testes E2E para as 4 personas | 16h+ |
| 19 | Modularizar `tradevision-core` | 8h |

---

## PARTE V — O QUE ESTÁ GENUINAMENTE BEM FEITO

Apesar dos problemas críticos, o sistema tem qualidades notáveis:

1. **Arquitetura cognitiva (COS)** — Kill Switch, metabolismo cognitivo, trauma log, políticas configuráveis. Raro em startups de healthtech.
2. **Sovereignty Protocol v2** — Motor determinístico de 5 camadas quando OpenAI cai. Design resiliente.
3. **Governança `fala ≠ ação`** — GPT nunca executa; apenas sugere. O Core governa. O frontend aplica. Principio sólido.
4. **Auditoria tripla** — `ai_chat_interactions` + `cognitive_events` + `noa_logs`. Rastreabilidade excelente.
5. **AEC 10 etapas** — Implementação fiel ao protocolo clínico. Loop "O que mais?" funciona bem.
6. **Detecção dinâmica de profissionais** — Não hardcoded. Escala com novos médicos.
7. **Fluxo documental com confirmação** — Lista → número → abertura. Fail-closed. 3min de expiração.
8. **RBAC server-side** — `user_roles` + RPC + SECURITY DEFINER. Correto por design.

---

## CONCLUSÃO

> **O MedCannLab possui uma arquitetura conceitualmente sofisticada e um protocolo clínico implementado com fidelidade. Entretanto, 7 vulnerabilidades críticas de exposição de dados, a persistência de estado clínico em localStorage e a ausência de validação JWT na Edge Function impedem a aprovação para operação com dados reais de pacientes.**
>
> **Estimativa para atingir conformidade mínima:** ~20 horas de trabalho focado nas 8 ações P0.
>
> **Recomendação:** Suspender qualquer operação com dados reais de pacientes até que as ações P0 sejam implementadas e uma nova auditoria seja executada.

---

*Parecer emitido em 01/04/2026 · Análise direta do código-fonte e scan de segurança*
*Este documento não constitui certificação legal. Recomenda-se auditoria formal por entidade acreditada.*
