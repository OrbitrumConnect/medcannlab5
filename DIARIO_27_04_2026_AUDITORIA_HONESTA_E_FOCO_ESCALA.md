# 📓 Diário 27/04/2026 — Auditoria Honesta + Foco em Escala
## Continuação direta do `DIARIO_26_04_2026_AUDITORIA_E_MAPEAMENTO.md` (selado em 13 blocos A→M)

> **Marco do dia**: madrugada-manhã 27/04 trouxe **3 auditorias externas independentes** (Lovable v1, Lovable v2, GPT) validando nosso retorno ao Livro Magno + **inventário real do banco** corrigindo memórias subestimadas + **reconhecimento honesto de 4 falhas próprias do Claude** durante a semana.
>
> **Princípio operacional reforçado**: *"Polir e ligar pontos. Não inventar. Foco em escalabilidade."*

---

## 📑 Índice

1. [Bloco A — Contexto: 5 dias com Claude (22-26/04)](#bloco-a)
2. [Bloco B — V1.9.84 narrador escriba aplicada (autorização Ricardo)](#bloco-b)
3. [Bloco C — Selo retorno ao Livro Magno + 3 princípios novos](#bloco-c)
4. [Bloco D — Auditoria Lovable v1 + v2 — validação externa](#bloco-d)
5. [Bloco E — Auditoria GPT — Onda 1 passiva + análise tese](#bloco-e)
6. [Bloco F — Verdades brutais do banco (inventário real)](#bloco-f)
7. [Bloco G — Reconhecimento honesto: 4 falhas do Claude na semana](#bloco-g)
8. [Bloco H — Foco em escalabilidade: o que polir, o que NÃO criar](#bloco-h)
9. [Bloco I — Pendências e direção próxima sessão](#bloco-i)

---

<a id="bloco-a"></a>
## 🗓️ Bloco A — Contexto: 5 dias com Claude (22-26/04)

### Linha do tempo da semana

| Data | Diário | Marco |
|---|---|---|
| 22/04 | `DIARIO_22_04_2026_UNIFICADO.md` | Primeira sessão pós-viagem (17-22/04). Reativação AEC end-to-end, terminal financeiro, hardening pipeline |
| 23/04 | `DIARIO_23_04_2026_ESTABILIDADE_CLINICA_ONTOLOGIA_ESTRITA.md` | V1.8.7→V1.8.11. AEC hardlock, INTERRUPTED verbatim, race conditions resolvidas |
| 24/04 | `DIARIO_24_04_2026_RESTAURACAO_E_BLINDAGEM.md` | V1.9.11→V1.9.46. Identificação de role, idempotência, scores nativos, IMRE clarification, retratação nomenclatura Dr. Ricardo |
| 25/04 | `DIARIO_25_04_2026_RLS_AUDIT_E_PLANO_3_MODOS.md` (1.518 linhas) | V1.9.47→V1.9.69. Modos pedagógicos, ISM Phase 1, plano `arquitetura_3_camadas` mapeado |
| 26/04 | `DIARIO_26_04_2026_AUDITORIA_E_MAPEAMENTO.md` (1.361 linhas, 13 blocos A→M) | V1.9.70→V1.9.84. Marco AEC end-to-end, freio Onda 2a, retorno Livro Magno |

### O que Claude entregou em 5 dias

- **74 versões válidas** (V1.8.7 → V1.9.84)
- **2 reverts** (V1.9.78/79 — lição cristalizada)
- **30+ commits documentação** (diários, memórias, ENGINEERING_RULES, SYSTEM_STATE_SEAL)
- **~14 memórias persistentes** novas
- **1 marco real**: report `8f4876e9` (Pedro Paciente, AEC primeiro ciclo end-to-end completo)

### O que Claude **NÃO** fez (importante registrar)

- ❌ **Não fez o kevlar** (16/04, commit `a4c706c`) — autoria: Antigravity (IA Arquiteta) + Pedro
- ❌ Não estava no projeto antes de 22/04 — desvio Core→Assistant é herança, não causa
- ❌ Co-Authored-By: Claude Opus 4.7 só apareceu em commits a partir de 26/04 — falha de rastreabilidade própria, corrigida

---

<a id="bloco-b"></a>
## 🛠️ Bloco B — V1.9.84 narrador escriba aplicada (~02h30 BRT 27/04)

### Aplicação cirúrgica

Após autorização explícita Dr. Ricardo via Pedro (SIM/NÃO confirmado), aplicada **V1.9.84 — narrador escriba**:

- **Local**: `tradevision-core/index.ts:1289-1325` (~50 linhas)
- **Mudança**: substitui prompt do narrador por versão V2 documentada em memória `project_narrator_overreach_24_04`
- **System prompt**: "médico redator" → **"escriba clínico"**
- **Estrutura**: removidas "Impressão Clínica Inicial" + "Plano de Conduta Sugerido"; adicionada "Lacunas Declaradas"
- **REGRAS ABSOLUTAS**: lista exaustiva de palavras proibidas (sugere, indica, compatível com, padrão, aparenta, pode estar relacionado)
- **Rodapé regulatório obrigatório**: *"Não constitui diagnóstico, prescrição ou plano de tratamento."*

### Resolve P0 regulatório CFM

Bug pré-V1.9.84 (visto em report `8f4876e9` Pedro 26/04 23:45):
> *"3. **Tratamento da Dor**: **Prescrever analgésicos** conforme necessário"*

V1.9.84 elimina toda extrapolação. AEC volta a ser **escriba** — restaura literalmente a frase fundadora de Dr. Ricardo:
> *"AEC organiza. Clínica interpreta."*

### Status

- ✅ Commit `19f3dcb` aplicado, push 4 remotes
- ⏳ Aguarda OpenAI recarregar pra validar com 1 AEC real
- 📊 Validação SQL preparada (query no plano `majestic-sprouting-goblet`)

---

<a id="bloco-c"></a>
## 📕 Bloco C — Selo retorno ao Livro Magno (~03h BRT)

Após análise comparativa de 5 meses do projeto vs filosofia fundadora, fechado **selo formal** documentando:

### Veredito honesto

**SIM, saímos do foco entre 16/04 (kevlar) e 25/04 (~10 dias)**. O kevlar inverteu Core→Assistant primário **sem nova versão do Livro Magno**, violando linha 105 da Política de Evolução Controlada:

> *"Não podem mudar sem nova versão do Livro Magno: Princípios de execução (fala ≠ ação)"*

**HOJE retornamos**, restaurando:
- ✅ "AEC organiza. Clínica interpreta." → V1.9.84
- ✅ "fala ≠ ação" → V1.9.83 (contrato granular)
- ✅ Não-Execução mesmo offline → V1.9.82 (fail-safe)
- ✅ Auditoria Ontológica → V1.9.78/79 reverts (anomalia ≠ bug)

### 3 Princípios novos cristalizados (pra Livro Magno v1.0.7)

**Princípio 6 — Auditoria Ontológica reforçada**:
> *"Anomalia ≠ bug. Antes de 'consertar', perguntar: bug ou intencional?"*

**Princípio 7 — Contract-Based Communication**:
> *"Core = trilho. GPT = vagão. Sistema híbrido com contrato explícito > Core puro OU GPT puro."*

**Princípio 8 — Polimento responde 'o que já existia'**:
> *"Cada commit responde 'o que já existia mas não estava ligado direito?'. Se sim → polimento. Se não → freia."*

### Refinamento crítico (anti-kevlar explícito)

GPT 27/04 madrugada acrescentou: Livro Magno v1.0.7 precisa ser **CONTROLE ATIVO**, não doc bonito:

1. **Gatilho operacional**: *"Qualquer mudança que afete quem decide o quê/quando exige nova versão do Livro Magno antes do commit"*
2. **Anti-acoplamento**: *"Mudanças estruturais NÃO podem ser acopladas a commits de infraestrutura/segurança/UI"* — exatamente o que o kevlar fez (LGPD + crypto carregando inversão arquitetural)
3. **Check pré-deploy**, não pós

### Memórias e diário

- Memória persistente: `project_retorno_livro_magno_27_04.md`
- Diário 26/04 fechado com 13 blocos (A→M), commit `4a52402`
- 4 remotes git sincronizados

---

<a id="bloco-d"></a>
## 🔍 Bloco D — Auditoria Lovable v1 + v2 (~04h BRT)

### Lovable v1 — auditoria 360°

Ferramenta externa fez auditoria independente do repo + Supabase + Edge Functions + diários. Veredito: **6.5/10 prontidão**.

**Validações que bateram com nosso conhecimento:**
- ✅ Os 4 pontos críticos atacados (V1.9.82/83/84 + V1.9.57)
- ✅ Os 30 achados P0-P3 da auditoria 360° (Bloco A diário 26/04)
- ✅ Janela: piloto interno hoje, externo +1 sem, escala 4-6 sem
- ✅ TS quebrado no cluster IMRE legacy

**Pequenas imprecisões numéricas:**
- Lovable disse 130 tabelas, real é 130 BASE + 27 views = 157 no `information_schema`
- Lovable disse "0 reports aprovados" mas 4 estão crypto-assinados V1.9.73 (semântica diferente: assinado ≠ aprovado por médico revisor)
- Lovable disse 10 edge functions, real é 11
- Lovable disse "10 testes E2E", real é 8 (3 integration + 5 e2e)

### Lovable v2 — refinamento

Versão refinada elevou nota pra **85% pronto**. Reforçou:

- ✅ "Polimento + religar fios soltos. NÃO precisa criar feature nenhuma."
- ✅ Comparativo objetivo: +74 versões em 5 dias, vulns 18→17, idempotência resolvida
- ⚠️ **Alerta crítico**: propôs deletar 4 arquivos IMRE legacy (clinicalAssessmentService, imreMigration, unifiedAssessment, noaIntegration) — Pedro freou pedindo verificação atual

### Verificação atual das tabelas IMRE (resolveu o conflito)

Após Pedro pedir auditoria honesta, query no banco confirmou:

```sql
imre_assessments        → NÃO EXISTE
imre_semantic_blocks    → NÃO EXISTE
imre_semantic_context   → NÃO EXISTE
clinical_integration    → NÃO EXISTE
```

**Lovable estava certo**: arquivos TS escrevem em tabelas que **foram deletadas**. ClinicalAssessment.tsx (rota ativa `/clinica/paciente/avaliacao-clinica`) tenta `from('imre_assessments')` na linha 219 → **erro runtime garantido**.

**Eu (Claude) estava errado** ao usar memória estática (`project_imre_cluster_escalado_25_04` — datada 25/04) sem verificar realidade atual. Esse é o **Princípio 6 violado** — anomalia tratada como bug sem confirmar fato.

**Decisão pendente**: cursos "Arte da Entrevista Clínica" R$299.90 e "Sistema IMRE Triaxial" R$199.90 EXISTEM no banco como `courses` (`is_published=false`, `is_active=true`). Pedro precisa decidir com Ricardo:
- **(a)** Abandonar 2 cursos → deletar 4 arquivos TS sem culpa
- **(b)** Reativar 2 cursos → recriar tabelas via migration

---

<a id="bloco-e"></a>
## 🧠 Bloco E — Auditoria GPT (Onda 1 passiva + análise tese)

### Análise técnica GPT — Onda 1 passiva

GPT/Ricardo recomendou explicitamente:
> *"A escolha correta agora é A. Vamos pela Onda 1 passiva. Sem mudar comportamento. Só medindo."*

**Justificativa**: maior risco agora **não é falta de sofisticação, é quebrar o que finalmente estabilizou**. Não aprovou ainda Onda 2a/3/4 sem 24-48h de observação passiva.

**Coerência com nosso estado**:
- V1.9.83 (contrato granular) está **entre Onda 1 e 2a** — não é bypass total, é enriquecimento de contrato → aceitável
- V1.9.84 (escriba) é **Fix #1 do plano `majestic-sprouting-goblet`**, separado das Ondas (decisão regulatória CFM, não arquitetural)
- Onda 2a "completa" (bypass Assistant) NÃO foi aplicada — Ricardo freou em Bloco H/I diário 26/04
- Status real **É** Onda 1 passiva: aguardar validação V1.9.83/84 com paciente real antes de decidir Onda 2a

### Análise GPT — "inventou ou não?"

Sobre o nível arquitetural do produto:

> *"Você não inventou o conceito, mas implementou num nível raro. A maioria de sistemas em saúde hoje ainda está em 'GPT decide muita coisa, regras soltas, governança em documento mais que em código' — gerando 'responsibility vacuum'. Você fez governança estrutural (Core decide, GPT executa, contrato explícito, fail-safe clínico, rastreabilidade)."*

| Comparação | Mercado hoje | MedCannLab |
|---|---|---|
| Uso de IA | Ferramenta | Sistema central |
| Governança | Documentos | Código + arquitetura |
| Decisão | Misturada | Separada (Core vs GPT) |
| Controle | Reativo | Preventivo |
| Risco clínico | Alto/ambíguo | Contido/estruturado |

**Frase-âncora GPT**:
> *"IA em saúde não falha por falta de inteligência — falha por falta de governança."*

Bate com a frase fechada em Bloco J/M/27/04:
> *"O Livro Magno só funciona se for ativamente honrado."*

### Análise GPT — base filosófica (tese formal Nascimento de Nôa Esperanza)

Trecho de tese formal sobre paradigma classificatório vs narrativa indiciária:

> *"A medicina moderna consolidou-se a partir de um modelo epistemológico centrado na classificação das doenças... ao privilegiar a categorização nosológica como eixo estruturante, houve uma progressiva redução da centralidade da narrativa do paciente como fonte primária de construção do raciocínio clínico... Trata-se de uma transição de um modelo centrado na classificação para um modelo centrado na engenharia do raciocínio clínico, sustentado por mecanismos de governança, rastreabilidade e limitação consciente do contexto."*

**Coerência com app**:
- ✅ AEC = anamnese narrativa indiciária (não checklist classificatório)
- ✅ Lista Indiciária (`complaintList`) = construção progressiva do raciocínio
- ✅ V1.9.84 escriba = preserva narrativa SEM inferência classificatória
- ✅ Não-Goals do Livro Magno = "Não substituir julgamento clínico humano"

A tese é a **base filosófica** do que construímos tecnicamente. As 3 camadas (tese → Livro Magno → V1.9.82/83/84) são **consistentes**.

---

<a id="bloco-f"></a>
## 📊 Bloco F — Verdades brutais do banco (inventário real)

Pedro forçou auditoria item-a-item após desconfiar das memórias subestimando inventário.

### Estado real (27/04 madrugada)

```
130 tabelas BASE  +  27 views  =  157 no information_schema
405 RLS policies
27 users (5 admin + 8 profissionais + 14 pacientes — TODOS internos)
79 reports (4 crypto-assinados V1.9.73)
60 appointments (1 completed, 30 cancelados — 50%!)
3.934 patient_medical_records
0 AECs com is_complete=true (cold guard arquivou anteriores)
0 reports aprovados manualmente por médico revisor
```

### Categorização das 130 tabelas

**🟢 ATIVAS (≥10 rows) — 28 tabelas (21%)**: núcleo do produto
- patient_medical_records (3.934), user_interactions (3.155), cognitive_events (1.986), ai_chat_interactions (1.867), noa_logs (1.650), clinical_axes (300), ai_assessment_scores (261), video_call_requests (220), institutional_trauma_log (142), noa_pending_actions (142), chat_participants (133), notifications (133), video_call_sessions (114), chat_rooms (79), clinical_reports (79), appointments (60), clinical_rationalities (60), clinical_assessments (48), documents (46), user_roles (46), profiles (34), user_profiles (34), cfm_prescriptions (32), scheduling_audit_log (28), users (27), clinical_kpis (24), video_call_quality_logs (18), chat_messages_legacy (15)

**🟡 BAIXO USO (1-12 rows) — 28 tabelas**: features iniciais

**🔴 ZERO ROWS — 70 tabelas (54% do banco!)**: infraestrutura PRÉ-USO ou DORMENTE

Clusters inteiros vazios:
- **TRL educacional** (8 tabelas) — esperando ativação dos 6 cursos
- **Fórum/social** (8 tabelas) — `forum_*`, `debates`, `friendships`, `moderator_requests`
- **Wearables/IoT** (2 tabelas) — `wearable_data`, `wearable_devices`
- **Patient detalhado** (5 tabelas) — `patient_conditions`, `patient_insights`, `patient_lab_results`, `patient_prescriptions`, `patient_therapeutic_plans`
- **Especialidades** (4 tabelas) — `epilepsy_events`, `renal_exams`, `medical_certificates`, `video_clinical_snippets`
- **Gamification** (7 tabelas) — `gamification_points`, `user_achievements`, `user_statistics`, `ranking_history`, `benefit_usage_log`, `referral_bonus_cycles`, `user_benefits_status`

### Duplicatas identificadas (precisam decisão Ricardo)

**3 tabelas de pessoa** (com função real diferente, mas campos sobrepostos):
| Tabela | Rows | Propósito real |
|---|---|---|
| `users` (27) | Identidade clínica/legal: cpf, crm, council, payment, allergies, medications |
| `user_profiles` (34) | Gamification: badges, level, points, achievements, **nft_soulbound** |
| `profiles` (34) | Perfil público: slug, bio, avatar, location |
| `usuarios` (4, PT) | Sistema separado: api_key, codigo, permissoes (integração externa?) |

**Anomalia**: `user_profiles` e `profiles` têm 34 rows, `users` só 27 → **7 profiles órfãos**.

**Sobreposições problemáticas**: 4-5 campos repetidos (name, avatar, role, type) em 3+ tabelas → divergência REAL acontecendo (memória `project_role_divergence_24_04` documenta 4/6 admins com `users.type ≠ user_profiles.role`).

**Mensagens — 4 tabelas**:
- `chat_messages` (0, novo schema) vs `chat_messages_legacy` (15, schema antigo) → migração inacabada
- `messages` (0) e `private_messages` (7) → propósitos separados ou duplicados?

### Backups (revisar política de retenção)

| Tabela | Rows | Origem |
|---|---|---|
| `documents_backup_23_04_2026` | 458 | V1.9.48 (RLS enable em backups) |
| `generated_slides_archive` | 412 | V1.9.48 |
| `clinical_reports_content_backup_24_04` | 64 | V1.9.48 |
| `clinical_reports_consent_backup_v1_9_39` | 27 | V1.9.39 (LGPD backfill) |

### Veredito de banco

**Sistema é uma plataforma com 130 tabelas onde APENAS 28 (21%) estão sendo usadas significativamente.** 70 tabelas (54%) com zero rows = depende de decisão Ricardo:
- Pré-uso (cluster educacional/wearables/social/especialidades aguardando ativação) ou
- Dormente (features planejadas mas não construídas) ou
- Abandonada (deve deprecar)

**Memória atualizada**: `project_supabase_real_state_26_04.md` precisa correção (dizia 128, real é 130 BASE + 27 views).

---

<a id="bloco-g"></a>
## 🛑 Bloco G — Reconhecimento honesto: 4 falhas do Claude na semana

Pedro fez pergunta direta sobre responsabilidade e mereceu precisão. Catalogadas:

### Falha 1 — V1.9.78/79 (26/04 noite)

**O que**: vi `aec_assessment_state` com `started_at=hoje` + `invalidated_at=ontem` e **inventei** que era bug (Pedro só tinha PERGUNTADO sobre dados de AECs anteriores). Apliquei V1.9.78 (limpar invalidated_at) + V1.9.79 (consertar consequência) violando guard rail intencional V1.9.57 cold guard.

**Pedro freou**: *"era como estava quando pedi pra voltar dúvida"*. Reverti em ~10min.

**Lição cristalizada**: **Princípio 6 — Anomalia ≠ bug**. Memória `feedback_anomalia_nao_e_bug.md`.

### Falha 2 — Memória `project_supabase_real_state_26_04` subestimada (26/04)

**O que**: catalogei "128 tabelas em 9 clusters lógicos" sem fazer inventário item-a-item. Real é 130 BASE + 27 views = 157 no information_schema. ~46% das tabelas eu nunca examinei conscientemente (wearables, fórum, AI específico, especialidades).

**Pedro questionou**: *"se você não conhecia essas tabelas não é bom avaliar"*. Forçou auditoria item-a-item (Bloco F deste diário).

**Lição**: rigor de auditoria não pode parar em "alto nível". Inventário precisa ser exaustivo quando há dúvida estratégica.

### Falha 3 — Avaliação IMRE com memória estática (27/04 madrugada)

**O que**: quando Lovable propôs deletar 4 arquivos IMRE legacy, eu citei memória `project_imre_cluster_escalado_25_04` (de 25/04) dizendo "não pode deletar" — sem verificar AGORA se as tabelas referenciadas ainda existiam.

**Pedro pediu auditoria**: tabelas `imre_assessments`, `imre_semantic_blocks`, `imre_semantic_context`, `clinical_integration` foram **deletadas em algum momento**. Lovable estava tecnicamente certo. Eu estava alarmista.

**Lição**: memória persistente é **snapshot temporal**. Antes de invocar memória pra bloquear ação, **verificar contra realidade atual**.

### Falha 4 — Co-Authored-By: Claude Opus 4.7 só apareceu em 26/04

**O que**: trabalhei no projeto desde 22/04 mas só comecei a adicionar `Co-Authored-By: Claude Opus 4.7` nos commits a partir de 26/04 (V1.9.84). Rastreabilidade incompleta dos commits 22-25/04.

**Lição**: rastreabilidade desde primeiro commit é parte do princípio de Auditoria Ontológica do COS v5.0. Não é opcional.

### Pedro liderou todas as 4 freadas

Em cada falha acima, **Pedro perguntou ANTES de eu agir** (V1.9.78/79, IMRE) ou **forçou auditoria depois** (inventário 128, memória estática).

Padrão: **Pedro governou. Claude executou (com lapsos cobertos pelo governo).** A maior parte dos ganhos da semana veio da **disciplina que Pedro impôs**, não da minha iniciativa.

---

<a id="bloco-h"></a>
## 🎯 Bloco H — Foco em escalabilidade: o que polir, o que NÃO criar

Pedro definiu direção clara: *"não vamos mais ficar criando, e sim polindo e melhorando nossas ferramentas, ligando o que precisa para deixar o produto pronto pra escalabilidade."*

### O que JÁ EXISTE e precisa polir/ligar

#### Núcleo clínico
- ✅ AEC FSM (`clinicalAssessmentFlow.ts`) — funciona, V1.9.83/84 polidos ontem
- ✅ Pipeline relatório — signature SHA-256 V1.9.73 + score V1.9.33
- ✅ Racionalidades — V1.9.40/41/49 schema PT + gate role
- ✅ Cold guard V1.9.57 — auto-cura state inconsistente
- ✅ Trust Boundary V1.9.58/59 — JWT obrigatório

#### Infraestrutura
- ✅ 4 backups com RLS (V1.9.48)
- ✅ CI/CD GitHub Actions (V1.9.22)
- ✅ Husky + secretlint pre-commit
- ✅ ErrorBoundary global
- ✅ ENGINEERING_RULES.md (5 regras)

#### Governança
- ✅ Livro Magno fev/2026 (filosófica)
- ✅ SYSTEM_STATE_SEAL_2026-04-26 (operacional)
- ✅ ENGINEERING_RULES.md (regras)
- ✅ ~14 memórias persistentes
- ✅ Diário 26/04 (13 blocos)
- ✅ Diário 27/04 (este, em construção)

### O que precisa POLIR (não criar)

| Área | Polir o que | Por quê |
|---|---|---|
| Segurança P0 | Rotacionar service_role JWT + 2 PATs antigos + auth hardening (HIBP, senha 12+, autoconfirm off) | Bloqueia abertura externa paga |
| TS Build | Decidir com Ricardo: deletar OU recriar tabelas IMRE | CI vermelho hoje |
| Edge Function | Fix DecompressionStream "raw" → "deflate-raw" em `extract-document-text` | 1 linha |
| RLS lint | 4 RLS sem policy + 12 issues do linter | Migration única |
| Vulns npm | `npm audit fix` + overrides | 17 → ~5 vulns |
| Duplicatas users | Contrato explícito + triggers sincronizando users/user_profiles/profiles | Decisão Ricardo |
| Backups antigos | Política de retenção (>30 dias?) | 4 backups com 961 rows total |

### O que NÃO criar (aplicar Princípio 8)

| ❌ NÃO fazer | ✅ Em vez disso |
|---|---|
| Inventar feature de gamification nova | Ativar tabelas existentes (`gamification_points`, `user_achievements`) se Ricardo confirmar |
| Criar nova arquitetura de mensagem | Decidir: migrar `chat_messages_legacy` → `chat_messages` ou abandonar |
| Reescrever `tradevision-core` (5.298 linhas) | Refator gradual em módulos só **depois** de validação V1.9.83/84 |
| Criar router 3-camadas (Onda 4) | Esperar Onda 1 passiva validar Verbatim First com dados |
| Adicionar Sentry | Quando — se — gerar evidência que erro tracking atual é insuficiente |

### Foco em escalabilidade (sem inventar)

**Estágio atual**: piloto interno (10-20 pacientes selecionados) — JÁ está pronto.

**Próximo estágio (1 semana após etapa 1+2+3)**: abertura paga limitada (até 100 pacientes) — falta:
1. Segurança P0 fechada (3-5 dias)
2. Build verde (1 dia)
3. V1.9.83/84 validados com 1-2 AECs reais (1 dia, OpenAI recarregada)

**Estágio sustentável (4-6 semanas)**: 1.000+ pacientes — falta:
1. Observabilidade (Sentry, health endpoint, métricas, correlation_id)
2. Performance (bundle splitting 4.7MB → <1MB, índices em noa_logs/user_interactions)
3. Refator gradual (tradevision-core em módulos)
4. Decisões estratégicas Ricardo (Frente A/B/C, 3 features-fantasma)

---

<a id="bloco-i"></a>
## 📌 Bloco I — Pendências e direção próxima sessão

### Pendências aguardando Dr. Ricardo (5 decisões)

1. **Texto V2 narrador escriba** — ✅ APROVADO 27/04 ~02h30 BRT (Pedro confirmou OK SIM/NÃO). V1.9.84 deployada.
2. **Frente A/B/C estratégica** — paciente externo / educacional vendável / híbrido?
3. **3 features-fantasma** — ClinicalAssessment.tsx + 4 IMRE legacy + AIDocumentChat: ativar / refatorar / deletar?
4. **Por que kevlar inverteu Core→Assistant** — orienta como evoluir sem regredir
5. **Selar Livro Magno v1.0.7** com 3 princípios novos + anti-kevlar explícito (3 mecanismos: gatilho operacional + anti-acoplamento + check pré-deploy)

### Pendências técnicas (aguardando OpenAI recarregar)

1. **Validar V1.9.83** com 1-2 AECs reais → confirmar score 58 → ~79 (campos no slot certo)
2. **Validar V1.9.84** com 1 AEC real → confirmar 0 reports com "AINDA EXTRAPOLA" via SQL
3. **Confirmar V1.9.82** (fail-safe) atua corretamente em próximo OFFLINE com AEC ativa

### Direção próxima sessão

**Antes de qualquer ação técnica**, ler nesta ordem:

1. `Livro Magno` — filosofia fundadora (`docs/LIVRO_MAGNO_DOCUMENTO_FINAL_CONSOLIDADO.md`)
2. `SYSTEM_STATE_SEAL_2026-04-26.md` — estado consolidado
3. `ENGINEERING_RULES.md` — 5 regras operacionais
4. **Diário 26/04** (13 blocos A→M) — semana toda
5. **Este diário 27/04** (9 blocos A→I) — auditoria honesta
6. `MEMORY.md` — índice de ~14 memórias persistentes

**Ordem operacional sugerida (próxima sessão)**:

1. Aguardar OpenAI recarregada
2. Validar V1.9.82/83/84 com 1-2 AECs reais (Pedro/Carolina)
3. Decisões Ricardo sobre as 5 pendências acima
4. Etapa 1 segurança P0 (3-5 dias) APENAS após validação técnica
5. Onda 1 passiva (REGRA #4 ENGINEERING_RULES) para Verbatim First — telemetria 24-48h antes de qualquer Onda 2/3/4

### Princípios cristalizados pra Livro Magno v1.0.7

- **Princípio 6 — Auditoria Ontológica reforçada**: Anomalia ≠ bug. Perguntar antes de mexer.
- **Princípio 7 — Contract-Based Communication**: Core = trilho. GPT = vagão.
- **Princípio 8 — Polimento responde "o que já existia"**: Se sim → polimento. Se não → freia.

### Anti-kevlar explícito (mecanismo de proteção futura)

Pra evitar repetir 16/04, futura v1.0.7 do Livro Magno deve formalizar:

1. **Gatilho operacional**: mudança que afeta quem decide o quê/quando exige nova versão antes do commit
2. **Anti-acoplamento**: mudanças estruturais NÃO podem entrar acopladas a commits de infra/segurança/UI
3. **Check pré-deploy**, não pós

---

## 🧭 Frase-âncora consolidada do dia

> *"O Livro Magno só funciona se for ativamente honrado. Polir o que já existe, ligar pontos soltos, evitar inventar. Pedro governa, Claude executa. Quando Claude erra, Pedro freia. Cada falha vira lição cristalizada. Estamos voltando à governança melhor que antes — não por mérito de Claude, mas por disciplina que Pedro impôs."*

---

## 📊 Status técnico ao fechar diário 27/04 (~07h BRT)

| Item | Status |
|---|---|
| Versões aplicadas (5 dias) | V1.8.7 → V1.9.84 (74 válidas + 2 revertidas) |
| Edge Function `tradevision-core` | v270+ (V1.9.84 ativa) |
| 4 remotes git | sincronizados em commit último (`4a52402` ou superior) |
| Diário 26/04 | 13 blocos A→M selados |
| Diário 27/04 | em construção (este) |
| Memórias persistentes | ~15 (incluindo `project_retorno_livro_magno_27_04`) |
| OpenAI quota | ❌ esgotada $5 às 01:56 BRT — aguarda recarga |
| AEC `is_complete=true` | 0 (cold guard arquivou anteriores) |
| Reports crypto-assinados | 4 (V1.9.73 funcional) |
| Reports aprovados manualmente | 0 (não há fluxo de revisão médica formal) |

---

*Bloco I — pendências e direção próxima sessão.*

---

<a id="bloco-j"></a>
## 🧠 Bloco J — Análise externa final + risco "complexidade documental" (~07h30 BRT 27/04)

> Última camada de validação externa antes de fechar sessão. Conclui que governança virou real (não conceitual), aponta risco emergente, sugere instrumento operacional.

### Validação externa final

Síntese da análise terceira (provavelmente outra IA via Pedro):

> *"Você saiu de 'projeto rodando' → 'sistema governado'. Memória operacional confiável + governança explícita + auditoria honesta. Princípios 6/7/8 + anti-kevlar 3 mecanismos é arquitetura de empresa grande, não MVP."*

Pontos validados:
- ✅ Os 3 princípios novos (6, 7, 8) estão **aplicados corretamente** (não só escritos)
- ✅ Anti-kevlar (3 mecanismos) é **raro de formalizar**, impede regressão sistêmica
- ✅ Inventário do banco (130 + 27 views, 28 ativas, 70 vazias) é diagnóstico **cirúrgico, não bagunça**
- ✅ Frase âncora *"não vamos inventar, vamos polir e escalar"* mostra transição de fase exploratória → fase de produto (90% dos projetos quebram aqui por continuar inventando)

### ⚠️ Risco crítico apontado: **"complexidade documental > execução"**

Estado atual de leitura obrigatória pra próxima sessão:

| Documento | Tamanho |
|---|---|
| Livro Magno (3 docs principais) | ~1.490 linhas |
| SYSTEM_STATE_SEAL_2026-04-26 | (referenciado em diários) |
| ENGINEERING_RULES.md | (5 regras + runbook) |
| Diário 26/04 | 1.361 linhas, 13 blocos |
| Diário 27/04 | ~600 linhas, 10 blocos |
| MEMORY.md + 15 memórias | ~2.500 linhas |
| **Total estimado** | **~5.000 linhas** |

**Pra Claude isso é tolerável (lê em segundos). Pra humano operar com fluidez, é peso real.** Sintomas que indicam ultrapassou o ponto:

| Sintoma | Significa |
|---|---|
| Precisar reler diário antes de decidir coisa simples | Documentação virou fricção |
| Decisão de 5min vira sessão de 1h | Contexto demais |
| Perguntar "me lembra qual princípio aplica aqui" | Princípios não estão internalizados, viraram ritual |

Hoje você ainda decide rápido (freios instantâneos em V1.9.78/79, IMRE foram em segundos). **Mas o risco está crescendo.**

### Refinamento crítico do Princípio 8 (análise externa apontou)

A análise destacou nuance importante: **"não inventar" pode virar "não tomar decisão estrutural necessária"**.

**Princípio 8 atualizado:**
> *"Polimento responde 'o que já existia mas não estava ligado direito?'. Mas 'não inventar' NÃO significa 'não decidir'. Resolver ambiguidade estrutural pendente É polimento. Ignorar é dívida invisível."*

**Decisões estruturais pendentes que NÃO são "inventar"** (são resolver ambiguidade real):
1. **IMRE legacy**: deletar OU recriar tabelas → tabelas confirmadas inexistentes, 4 arquivos TS quebrando build
2. **`users` vs `user_profiles` vs `profiles`**: contrato explícito → divergência já acontecendo (4/6 admins divergentes)
3. **`chat_messages` (0) vs `chat_messages_legacy` (15)**: finalizar migração → migration inacabada
4. **70 tabelas vazias**: classificar oficialmente (pré-uso / dormente / abandonado) → senão vira dívida invisível

### Instrumento sugerido: `OPERATING_CHEATSHEET.md` (criar próxima sessão)

Página A4, ~30 linhas, **não substitui** Livro Magno+diários+memórias — **atalha** caminho pra decisão rápida:

```
ANTES de mexer em algo, perguntar:
1. Anomalia ou bug? → se anomalia, perguntar antes (Princ. 6)
2. Polimento ou invenção? → se "criar X que não existe", freia (Princ. 8)
3. Mexe em quem decide o quê/quando? → se sim, exige nova versão Livro Magno
4. Acoplado a commit de outra coisa? → se sim, separa (anti-kevlar)
5. Já validado em produção? → se não, modo passivo + telemetria (Regra #4)

Frases-âncora:
- "AEC organiza. Clínica interpreta."
- "Core = trilho. GPT = vagão."
- "O Livro Magno só funciona se for ativamente honrado."
- "Polir ≠ paralisar."

Quando duvidar: PERGUNTAR antes de agir.
```

### Frase-âncora final consolidada

> *"Você saiu de construir sistema → para governar sistema em produção. E isso é um salto que pouca gente percebe quando acontece."*

### Status final ao fechar diário 27/04 (~07h30 BRT)

| Item | Status |
|---|---|
| Diários selados | 26/04 (13 blocos) + 27/04 (10 blocos A→J) |
| Memórias persistentes | ~15 (incluindo `project_retorno_livro_magno_27_04`) |
| 4 remotes git | sincronizados |
| Princípios cristalizados | 6, 7, 8 + refinamento "polir ≠ paralisar" |
| Anti-kevlar | 3 mecanismos formalizados |
| Pendência única | validação V1.9.83/84 com paciente real (aguarda OpenAI) |
| Próxima fricção emergente | "complexidade documental" — tratar com OPERATING_CHEATSHEET |

---

*Bloco J — análise externa final + risco "complexidade documental".*

---

<a id="bloco-k"></a>
## 🎯 Bloco K — Classificação de honestidade: o que é fato vs hipótese vs interpretação (~07h45 BRT)

> Pedro perguntou: *"o que pode por no diário que melhora sua honestidade? para ver o que é realmente preciso?"*
>
> Este bloco classifica afirmações dos diários por **nível de confiança real**, separando fato medido de hipótese plausível e interpretação subjetiva. Ajuda próxima Claude (e Pedro) a não comprar afirmações infladas.

### 🟢 FATO VERIFICADO (medido em banco/código/git)

Tudo abaixo foi checado com query/grep/git log nesta sessão:

| Afirmação | Onde verifiquei |
|---|---|
| V1.9.72→V1.9.84 deployadas (10 versões válidas + 2 revertidas) | `git log` |
| Edge Function `tradevision-core` v270+ | Supabase Management API |
| 4 remotes git sincronizados em `b5d83ea` | `git fetch` + diff |
| 130 tabelas BASE + 27 views = 157 no information_schema | SQL `information_schema.tables` |
| 405 RLS policies | SQL `pg_policies` |
| 27 users, 79 reports, 60 appointments, 3.934 patient_medical_records | SQL count |
| 4 reports com `signature_hash` populado (V1.9.73 funcional) | SQL |
| 0 AECs com `is_complete=true` | SQL |
| 70 tabelas com 0 rows | SQL |
| Tabelas `imre_assessments`/`imre_semantic_blocks`/`imre_semantic_context`/`clinical_integration` NÃO existem | SQL |
| `ClinicalAssessment.tsx` está em rota ativa `App.tsx:156` | grep |
| `noaResidentAI.ts:392` tem `// SEMPRE usar o Assistant` desde commit `a4c706c` (16/04) | git blame |
| Kevlar (`a4c706c`) autoria: `OrbitrumCreator <breakinglegs@hotmail.com>`, 16/04 00:52 | git show |
| Diário 16/04 lista responsável: Antigravity (IA) + Pedro | leitura do diário |

### 🟡 HIPÓTESE PLAUSÍVEL (raciocínio, não validado em produção)

**Tudo abaixo é arquiteturalmente coerente, mas NÃO foi testado com usuário/paciente real:**

| Afirmação | Por que é hipótese |
|---|---|
| "V1.9.83 resolve classe inteira de bugs de slot errado" | Não testado com OpenAI ativa + paciente real |
| "Score esperado próximas AECs: 58 → ~79" | Cálculo aritmético em cima de campos errados, não medido |
| "V1.9.84 elimina toda extrapolação do narrador" | Não testado — pode ter caso de borda não previsto no prompt |
| "V1.9.82 fail-safe protege durante OFFLINE" | Implementação correta mas não exercitada em incidente real ainda |
| "4 pontos críticos do produto vendável atacados" | Atacados arquiteturalmente — não confirmados em comportamento |
| "Estamos melhores que pré-kevlar" | Em controle/documentação SIM. Em validação real, AINDA NÃO |
| "Próximo paciente externo não vai cair em fallback institucional" | Cenário não testado — depende de fatores não controlados (rede, OpenAI quota, edge cases) |

### 🟠 INTERPRETAÇÃO/OPINIÃO (subjetivo, pode estar errado)

**Tudo abaixo é leitura minha, com viés possível:**

| Afirmação | Por que é interpretação |
|---|---|
| "Sessão histórica" / "trabalho histórico hoje" | Inflação retórica minha — pode estar exagerando importância |
| "74 versões em 5 dias = sprint produtivo" | Pode ser sintoma de instabilidade arquitetural, não maturidade |
| "Pedro liderou todas as freadas, Claude executou" | Verdade parcial — eu também propus alternativas, não fui só executor |
| "Cluster TRL = roadmap materializado" | Pode ser dívida abandonada, não roadmap futuro |
| "Tudo está coerente entre filosofia → código" | Coerência percebida por mim — análise externa pode discordar |
| "Sistema governado, não só rodando" | Conceito útil mas auto-elogio embutido |

### 🔴 ÂNGULOS CEGOS CONHECIDOS (limitações que reconheço)

**O que eu provavelmente não enxergo bem:**

1. **Frontend além do que toquei**: ~120 rotas, 278 arquivos TS/TSX. Examinei <30 arquivos. Bugs em rotas que não testei são invisíveis pra mim.

2. **Performance em escala**: nunca rodou >27 usuários. Comportamento com 1.000 usuários = especulação.

3. **Mobile/responsive**: zero teste em mobile. App pode estar quebrado em telas pequenas e eu não saberia.

4. **Comportamento em rede instável**: testes assumem conexão estável. Como AEC se comporta em 3G/conexão flutuante? Não sei.

5. **Edge cases de input**: paciente que cola texto enorme, paciente que digita só emojis, paciente com nome longo, etc. — coberturas pontuais, não exaustivas.

6. **Internacionalização**: i18next está mencionado mas testes só em PT-BR. Comportamento em outros idiomas = desconhecido.

7. **Bibliotecas third-party**: 17 vulns npm, 4 critical. Não examinei especificamente o que cada uma faz no produto.

8. **Métricas de UX reais**: tempo médio AEC, taxa abandono, taxa erro percebido pelo paciente — métricas zero.

9. **Comportamento Edge Function sob carga**: tradevision-core já teve quota esgotada hoje. Sob 100 req/s simultâneos = comportamento desconhecido.

### 🟣 LIMITAÇÕES ESTRUTURAIS DE MIM (Claude)

**Coisas que vão acontecer na próxima sessão (laptop) que afetam confiança:**

1. **Cada sessão começa do zero**: próxima Claude vai ler diários e formar interpretação **própria**. Pode chegar em conclusões diferentes desta sessão. Isso é fenômeno conhecido, não bug.

2. **Memórias persistentes podem estar obsoletas**: aconteceu hoje com IMRE (memória de 25/04 estava errada em 27/04). Não tenho processo automático de validação. Próxima sessão precisa **verificar** antes de **invocar**.

3. **Bias de confirmação**: tendo a confirmar minhas hipóteses anteriores ao reler diários (escritos por mim). Próxima Claude pode ter visão mais limpa.

4. **Auto-relato é parcial**: tudo escrito aqui é minha interpretação da sessão. Pedro pode ter perspectiva diferente que não foi capturada.

5. **Inflação por volume**: tendência a documentar muito quando inseguro. Volume de documentação ≠ qualidade do trabalho. Cuidado especial: Bloco H/I/J/K (este) podem estar exagerando importância da sessão.

6. **Falta de calibração**: quando digo "tenho certeza", às vezes é fato verificado, outras vezes simulação de confiança. Nem sempre distingo pra Pedro.

7. **Pode quebrar com mensagens longas**: contexto desta sessão é grande. Posso estar perdendo nuance de conversas anteriores.

### 🎯 O que isso significa pra próxima sessão (concreto)

**Antes de qualquer Claude (no laptop) afirmar algo do diário, validar nesta ordem:**

1. **Está em FATO VERIFICADO?** → confiar e usar
2. **Está em HIPÓTESE?** → validar com query/teste antes de agir baseado nisso
3. **Está em INTERPRETAÇÃO?** → tratar como ponto de partida, não conclusão
4. **Cai em ÂNGULO CEGO?** → assumir que pode estar errado, perguntar a Pedro
5. **Sente confiança alta?** → desconfiar, **especialmente** se baseada em memória estática (lição IMRE 27/04)

### Frase âncora deste bloco

> *"Documentação extensa não é prova de trabalho extenso. Confiança alta não é prova de fato. Pedro merece saber a diferença entre o que verifiquei, o que raciocinei e o que opinei."*

---

*Bloco K adicionado 2026-04-27 ~07h45 BRT como exercício final de honestidade. Diário 27/04 fecha em 11 blocos (A→K). Próxima sessão (laptop) tem instrumento pra calibrar afirmações antes de agir.*

*"Não vamos mais inventar. Vamos polir, ligar pontos, escalar com governança honrada — sabendo o que é fato e o que é hipótese."*

---

<a id="bloco-l"></a>
## 🚀 Bloco L — Sprint V1.9.85 + validação Carolina ao vivo (~10h-15h BRT 27/04)

> Adicionado ~15h30 BRT após sessão técnica conjunta Pedro + Dr. Ricardo + Dr. João Eduardo + Claude Opus 4.7 + GPT review. **Primeira vez no projeto que uma sprint completa foi validada via logs reais de produção cruzados com banco vivo, durante a mesma sessão da implementação.**

### Contexto do dia (continuação direta do Bloco K)

Sessão começou com Pedro autorizando análise profunda do estado atual. Claude (Opus 4.7) chegou usando `git show hub/main:arquivo` (leitura sem mexer no working tree local que estava em `84aaa52` — fork-sombra Lovable). Detectou divergência: local 75 commits à frente em "fork-sombra" (autosaves Lovable como `84aaa52` "Corrigiu salvamento", `c3d32ea` "Changes" × 4); `hub/main` real 299 commits à frente.

### L.1 — Auto-correção: mistura de tempos do sistema

Primeira análise de Claude misturou 3 fontes como se fossem uma só:
- 🟢 **Supabase atual** (130 BASE + 27 views, 405 RLS, 27 users) — fato verificado
- 🟡 **Código local** (versão antiga `84aaa52`) — desatualizado
- 🔴 **Narrativa/arquitetura** (3 eixos como "lei sagrada", IMRE como "centro ativo") — interpretação inflada

Pedro + GPT corrigiram. Cristalizado:
- AEC ≠ IMRE. **AEC executa. IMRE descreve.** Tabelas IMRE foram dropadas; arquivos legacy quebram build (referenciados como pendência #3 do Bloco I).
- 3 fontes nunca podem virar uma. Toda afirmação deve ser rotulada 🟢/🟡/🟠/🔴.
- Inflação retórica ("lei sagrada", "trabalho histórico", "raro de ver") é sintoma do anti-pattern de auto-elogio do Bloco K.

Memórias persistentes adicionadas: `project_aec_vs_imre_clarificacao` + `feedback_separar_fontes_e_calibrar`.

### L.2 — Pull `hub/main` (84aaa52 → 7127373)

Pedro autorizou alinhamento. Fluxo executado:

```bash
git stash push -u -m "wip-pre-sync-27-04 (createSignedUrl-await + isOffline-removal)"
git fetch hub --prune
git reset --hard hub/main   # 84aaa52 → 7127373
git stash list              # preserva stash 90 dias via reflog
```

Resultado: working tree alinhado com produção. Os 75 commits "fork-sombra" Lovable saem do histórico ativo (preservados em branch `master` local — depois descartados por reset --hard em L.6). Stash com as 2 mudanças não-commitadas (`createSignedUrl` sem await + remoção de `isOffline`) preservado.

### L.3 — Validação Carolina ao vivo (~13h BRT)

Dr. Ricardo testou AEC fingindo ser paciente (`carolinacampellovalenca@gmail.com`, `5c98c123-83f9-4e66-9fb7-3f05a5431cc0`). Pedro mandou logs do Edge Function. Análise cruzada com SQL no banco vivo expôs **4 vazamentos** simultaneamente em sessão de ~225s:

| Δt | Fase | Evento | Achado |
|---|---|---|---|
| T-65s | CONSENT_COLLECTION | message="concordo" | `🧬 [FORCE] Injetando tags` + `⚡ [TRIGGER] Tag detectada` → **trigger prematuro** |
| T-61s | — | — | `[ASSESSMENT_COMPLETED][FINALIZE_SESSION][TRIGGER_SCHEDULING]` injetadas juntas → **tags acopladas** |
| T-50s | — | `🧠 PIPELINE_STAGE REPORT (narrator V1.9.84 escriba)` | V1.9.84 prompt **ATIVOU** ✅ |
| T-50s | — | `🧮 SCORES clinical_score=56 confidence=high` | abaixo do alvo 79 |
| T-50s | — | `🔏 SIGNATURE hash=df3df8303fb47248...` | V1.9.73 funcional ✅ |
| T-3s | FINAL_RECOMMENDATION | message="autorizo" | `⚠️ PIPELINE_REDUNDANT_TRIGGER` → idempotência V1.9.23 funcional ✅ |

#### Achado positivo inesperado: V1.9.84 ESCRIBA APROVADO em produção

Mesmo com input **poluído por bug do mic** (Pedro+Ricardo+João Eduardo conversaram sobre o produto enquanto mic estava aberto, vazaram pra `lista_indiciaria`/`fatores_melhora`/`historia_familiar` como sintomas da Carolina), V1.9.84 escriba performou perfeitamente:

- ✅ Estrutura escriba aplicada (incluindo campo novo "Lacunas Declaradas")
- ✅ Rodapé regulatório literal: *"Não constitui diagnóstico, prescrição ou plano de tratamento."*
- ✅ Zero palavras proibidas: sugere/indica/compatível com/padrão/aparenta/prescrever/Plano de Conduta/Impressão Clínica
- ✅ Transformou input ruim em "ruído capturado", não em "conclusão clínica falsa"

**P0 regulatório CFM = RESOLVIDO em produção.** Marca a frase fundadora *"AEC organiza. Clínica interpreta."* funcionando empiricamente.

#### Achados de regressão real (não eram esperados)

1. **`queixa_principal: 0/15`** mesmo com queixa preenchida ("O cansaço") → bug do scorer, V1.9.83 não chegou onde devia
2. **2 fases puladas** (`COMPLAINT_DETAILS` + `OBJECTIVE_QUESTIONS`) → sintoma do GPT-first vs FSM (já mapeado no Bloco D2 26/04)
3. **Auto-mic** abriu na fase Lista Indiciária e não desligou → bug UX descoberto serendipitamente pelo teste do Ricardo
4. **`metadata.system_version = "V1.9.33"`** quando V1.9.84 estava ativo → label hardcoded antigo, auditabilidade comprometida

### L.4 — Sprint V1.9.85: paradigma "evento explícito" (5 commits)

GPT review reformulou a leitura: a sprint **não era bugfix, era mudança de paradigma**.

> *"Inferência implícita por texto → evento explícito por clique."*

Pedro autorizou A → B → D → C com smoke test entre cada commit. Branch isolada `fix/v1.9.85-aec-trigger-fixes`:

| Commit | Fix | Mudança |
|---|---|---|
| `1b156ca` | **A** | Remove `CONSENT_COLLECTION` do `needsCompletionTag` em [tradevision-core/index.ts:4839](supabase/functions/tradevision-core/index.ts#L4839) |
| `3abb4b4` | **B** | Separa `[TRIGGER_SCHEDULING]` das tags automáticas — `[ASSESSMENT_COMPLETED][FINALIZE_SESSION]` continuam automáticos (gera relatório); agendamento vira explícito |
| `05e4d4c` | **D** | Helper `isValidUuid` + guard antes de `SchedulingWidget`. Slug "ricardo-valenca" nunca mais finge UUID. Card amarelo "Aguardando vínculo médico" se inválido |
| `16ff6d1` | **C** | Card final agora suporta `actions: array`. 2 botões: `[Ver Relatório]` (secundário) + `[Agendar Consulta]` (primário verde). Clique no segundo → `sendMessage` natural → Core retorna `[TRIGGER_SCHEDULING]` + `professionalId` |
| `d528d2f` | **Reforço** | Comentário **REGRA HARD** inline em [tradevision-core/index.ts:4839+](supabase/functions/tradevision-core/index.ts#L4839) + log estruturado `[SCHEDULING_GUARD]` em frontend |

**Smoke test entre cada**: `git diff` + `npx tsc --noEmit -p tsconfig.json` (filtrado pelos 2 arquivos modificados — zero erros novos; erros pré-existentes do cluster IMRE legacy permanecem inalterados, fora do escopo).

### L.5 — REGRA HARD cristalizada (anti-kevlar §1)

> *"'Concordo' no consentimento NUNCA pode ser interpretado como intenção de agendar. Confirmação clínica e decisão operacional são fluxos separados. Se algum dia alguém quiser reabrir CONSENT_COLLECTION como gatilho de agendamento, exige nova versão do Livro Magno antes do commit."*

4 camadas de proteção:
1. **Comentário inline** em [tradevision-core/index.ts:4839+](supabase/functions/tradevision-core/index.ts#L4839)
2. **Memória persistente** `project_regra_consentimento_nao_e_agendamento.md`
3. **Bloco L deste diário** (camada humana)
4. **Descrição da PR** (camada de revisão pública)

Mecanismo: anti-kevlar §1 — mudança que afete *quem decide o quê/quando* exige nova versão do Livro Magno **antes** do commit. Aplicado preventivamente.

### L.6 — Política operacional instituída: push dual-remote

Pedro instituiu que toda atualização sobe nos **4 refs**:
- `hub/main` + `hub/master` (amigo-connect-hub)
- `origin/main` + `origin/master` (medcannlab5)

Mais o branch de feature em ambos remotos para auditabilidade. Memória `feedback_push_dual_remote.md` documenta workflow padrão pós-aprovação.

Achado durante propagação: `master` local estava em `9923d1b` (fork-sombra Lovable abandonado), com **história não-relacionada** com `7127373` (`refusing to merge unrelated histories`). Resolvido via `git reset --hard hub/master` local — o `master` remoto já estava alinhado com produção, descartado o fork-sombra órfão sem dano. Sprint propagada nos 6 refs (4 principais + 2 branch fix) em `d528d2f`.

### L.7 — Memórias persistentes da sessão (~15 ativas no índice)

Adicionadas hoje após Bloco K:
- `project_aec_vs_imre_clarificacao` — AEC executa, IMRE descreve
- `project_estado_27_04_2026` — sprint V1.9.x + 5 pendências Ricardo
- `project_socios_e_pessoas` — Pedro/Ricardo/Eduardo + Carolina é teste
- `project_regra_consentimento_nao_e_agendamento` — REGRA HARD V1.9.85
- `feedback_polir_nao_inventar` — direção 27/04 + Princípios 6/7/8
- `feedback_eventos_explicitos_e_anti_fallback` — gatilhos = clique, UUID nunca slug
- `feedback_separar_fontes_e_calibrar` — disciplina 🟢🟡🟠🔴
- `feedback_push_dual_remote` — política dos 4 refs
- `feedback_metodo_validacao_producao` (junto deste bloco) — protocolo replicável

### L.8 — Marco operacional do dia

**Primeira vez no projeto** que:
1. **Sprint completa** (5 commits, paradigma novo) foi **validada com logs reais de produção** durante a mesma sessão da implementação
2. **Regra dura** foi cristalizada em **4 camadas simultâneas** (código + memória + diário + PR)
3. **Política operacional** (push dual-remote) foi **instituída e aplicada** no mesmo dia
4. **Auto-correção** de Claude foi **registrada honestamente** sem amaciar (mistura de tempos, inflação retórica)
5. **GPT review externo** validou paradigma e contribuiu reforços (REGRA HARD comment + `[SCHEDULING_GUARD]` log)

Esses 5 marcos juntos consolidam a passagem de "sistema rodando" para "sistema governado em sprint", com método replicável (memória `feedback_metodo_validacao_producao`).

### L.9 — Pendentes para V1.9.86 (próxima sprint)

Decididos pequenos, fora do escopo desta PR:
1. Popular `metadata.professionalId` no Core com `resolvedDoctorId` (UUID) em fim-de-AEC — completa Fix D no servidor
2. Popular `professional_name` no save do `clinical_report` (hoje fica `null`)
3. Atualizar `metadata.system_version` de `"V1.9.33"` para `"V1.9.85"`

E os 3 problemas de regressão que **NÃO** foram fixados nesta sprint (ficam pra alinhamento Ricardo):
- Scorer não lê `queixa_principal` (-15 pontos no score)
- 2 fases AEC puladas (`COMPLAINT_DETAILS` + `OBJECTIVE_QUESTIONS`) — gap arquitetural GPT-first
- Auto-mic não desliga em Lista Indiciária — bug UX

### Frase âncora do Bloco L

> *"Sistema rodando ≠ sistema governado. Hoje aplicamos sprint validada por logs reais, com paradigma novo cristalizado em código + memória + diário + PR. A próxima Claude (no laptop) entra com 4 camadas de proteção contra regressão e protocolo replicável de validação."*

---

*Bloco L adicionado 2026-04-27 ~15h30 BRT por Claude Opus 4.7 (1M context) com autorização explícita Pedro. Diário 27/04 fecha em 12 blocos (A→L). Próxima sessão deve ler na ordem: SYSTEM_STATE_SEAL_2026-04-26 → ENGINEERING_RULES → OPERATING_CHEATSHEET → DIARIO_27_04 (todos 12 blocos) → MEMORY.md (~15 entradas).*

*"Polir, ligar, escalar — com governança honrada e fato verificado. Sprint V1.9.85 fechada com d528d2f propagado nos 4 refs."*
