# 🧠 MEMÓRIAS CRÍTICAS — Handoff para Claude no laptop do Pedro
**Data:** 04/05/2026
**Origem:** dump de 15 memórias persistentes do Claude desktop do Pedro (de 98 totais)
**Quando ler:** próxima sessão na casa do Ricardo

> **Por que este doc existe:** memórias persistentes ficam em `~/.claude/projects/.../memory/` localmente — não vão pelo git. Este doc dump as 15 mais críticas pra continuação fluir sem perda de contexto entre máquinas.

---

## 1. PRINCÍPIOS OPERACIONAIS CRISTALIZADOS (top 12)

### 1.1 🛑 AUDITAR 100% antes de qualquer mudança (META-princípio)

**Origem:** Pedro 30/04 ~17h, após jornada V1.9.102→F (6 PRs em 16h fechando 1 PR sem auditoria).

**Regra única absoluta:**
```
Antes de tocar 1 linha de código, fazer auditoria empírica completa.

Sequência obrigatória:
  1. Ler memórias relacionadas (MEMORY.md + CLAUDE.md)
  2. Mapear TODAS as tabelas/funções/triggers afetadas
  3. Identificar referência empírica em prod (caso normal funcionando)
  4. Listar TODOS os campos/sub-resultados que devem permanecer iguais
  5. SÓ ENTÃO propor mudança
  6. Smoke test valida CAMPO A CAMPO (não count > 0)
  7. Comparar empíricamente: novo caminho == referência?

Se algum dos 7 passos é skippado: provável regressão silenciosa.
```

**O que pular (eficiência sem regressão):**
```
✅ Mudanças de TEXTO em UI/mensagens — sem audit
✅ Polish CSS/visual sem lógica — sem audit
✅ Documentação (memórias, diários) — sem audit

⚠️ Mudanças com qualquer impacto em DATA FLOW exigem 100% audit.
```

**Frase-âncora:** *"30 min de audit ANTES economiza 16h de fix DEPOIS. Reuso > criação. Paridade campo a campo, não 'última cascata'."*

---

### 1.2 P10 — Substituição silenciosa de responsabilidade

**Cristalizado:** 28/04 ~18h, após DOCTOR_RESOLUTION fallback descoberto.

**Regra:** kevlar não é instância — é padrão. Toda decisão sobre responsabilidade SEM sinalização explícita é variante de kevlar.

**Aplicação:**
```
❌ Sistema decide médico padrão sem CRM ativo declarado
❌ Fallback "se não tem X, usa Y" sem alertar usuário
❌ Estrutura societária assimétrica sem cláusula PR
❌ Mudança de modelo "MedCannLab unificada" → "Clínica X dominante" sem ata

✅ Toda fallback gera entry em noa_logs.interaction_type='fallback_decision'
✅ Toda transação parte relacionada exige cláusula explícita
✅ Toda mudança de modelo exige ata + auditoria
```

---

### 1.3 P9 — Não-uso ≠ não-precisa (cuidado em pré-PMF)

**Cristalizado:** 28/04, após erro com video-call-reminders (deletei pensando duplicata, na verdade era half-impl que precisa).

**Regra:** antes de deletar/desativar feature/dependência:
```
1. Perguntar: "faz parte do produto desejado?" (não só "está sendo usado?")
2. Em pré-PMF, "uso zero" pode ser "infra pré-uso" planejada
3. Validar com Pedro antes de qualquer DELETE/DROP/rm
```

**Princípio inverso (também válido):** *"Pré-PMF, proteção pré-uso parece útil — não compre preventivamente além do mínimo viável."* (3 classes IMRE = MVP defesa jurídica; classes 9/35/Madrid = pós-PMF).

---

### 1.4 Polir, NÃO inventar (P8)

**Regra:** antes de criar código novo, **buscar mecanismo equivalente que já existe** no codebase. Reutilizar > criar paralelo.

**Aplicação prática:**
```
✅ V1.9.122 reaproveitou 2 botões já existentes em vez de criar novos
✅ V1.9.123-A adicionou 2 entries em REMINDER_WINDOWS array existente
✅ Edge video-call-reminders rescatada (V1.9.99) em vez de criar nova
```

---

### 1.5 Anomalia ≠ bug (perguntar antes de "consertar")

**Cristalizado:** 28/04 — V1.9.78/79 erro: vi invalidated_at órfão, inventei bug, criei 2 fixes que pioraram. Pedro só tinha PERGUNTADO sobre dados.

**Regra:** dado estranho no banco não é automaticamente bug. Pode ser:
- Design intencional (ex: duas contas Ricardo: admin + profissional)
- Anomalia conhecida documentada
- Lixo histórico aceito
- Trigger antigo

**Antes de fixar:** confirmar com Pedro que é bug.

---

### 1.6 Anti-overclaim de endorsements

**Cristalizado:** 28/04 — classifiquei doc gerado por IDE de IA (Antigravity Google) como "auditoria externa Google DeepMind".

**Regra:** 4 testes obrigatórios antes de afirmar endorsements:
```
1. É documento formal assinado por entidade externa?
2. Há contrato/termo entre as partes?
3. Há comunicação direta da entidade endorsando?
4. Pode ser comprovado se questionado por advogado?

Linguagem defensável: "inspirada/alinhada/consistente"
Linguagem que exige prova formal: "auditado/validado/endossado"
```

---

### 1.7 Anti-subestimação de severidade

**Cristalizado:** 28/04 ~18h45 — Pedro: *"não subestimar as coisas assim facilmente"*.

**Regra:** classifiquei 4+ vezes severidade pra MENOS no mesmo dia (DOCTOR_RESOLUTION 3x, video-call-reminders, jvbiocann, "5 órfãos"=11).

**3 perguntas antes de fixar severidade:**
```
1. O que falha SE este item explodir?
2. Quem é afetado? (1 user, todos, regulador?)
3. Quanto tempo pra detectar/corrigir se acontecer?

Tendência default: classificar pra MENOS.
Correção: subir 1 nível em qualquer dúvida.
```

---

### 1.8 AEC é escuta ativa — tudo que paciente fala é ouro

**Origem:** Pedro 24/04 — havia filtro heurístico que rejeitava inputs "curtos sem palavras-chave" como ruído. Isso violava DNA do método AEC.

**Regra:**
```
❌ Nunca filtros heurísticos que classifiquem conteúdo do paciente como
   "não-relevante" baseado em regex de palavras-chave
✅ Debounce anti-spam (UX) é OK — não é julgamento de conteúdo
✅ Lógica de uso fica no switch-case da fase, não em filtro prévio
✅ "O que mais?" é protocolo, não repetição
```

---

### 1.9 Princípio clínico — invalidate vs DELETE

**Regra fundamental:** sistema clínico NUNCA destrói dado, mesmo inconsistente.
```
Snapshot + invalidate + restart controlado.
Triângulo: mitigate → detect → prevent.

❌ DELETE FROM aec_assessment_state
✅ UPDATE invalidated_at = now() + invalidation_reason

Por isso bug Carolina existe: invalidate funcionou, mas algum path
UPDATE depois reativou o registro sem limpar invalidated_at.
```

---

### 1.10 Push 4 refs (política obrigatória)

**Regra:** todo commit precisa ir pra 4 lugares:
```bash
git push amigo HEAD:main && git push amigo HEAD:master && \
  git push medcannlab5 HEAD:main && git push medcannlab5 HEAD:master
```

**Por quê:** dual-remote (amigo + medcannlab5) × dual-branch (main + master). CI deploy roda no medcannlab5.

---

### 1.11 IAs são SUPORTE, nunca AUTORIA

**Cristalizado:** Pedro 28/04 — corrigiu v6→v7 do parágrafo institucional.

**Regra:** IAs ficam fora da linha autoral.
```
AEC = integralmente Ricardo (criação humana)
Pedro orquestrou em colaboração técnica com Ricardo
IAs servem só como:
  - Suporte técnico (codar)
  - Troca de visões (review)

Nunca: co-fundadora, co-criadora, co-autora em pitch/doutorado/captação.
```

---

### 1.12 Dinâmica relacional sócios — AEC primeiro

**Origem:** Pedro 28/04 — contou que Ricardo veio antes, ele DEPOIS trouxe o Core "para ele não ficar triste". Houve intriga histórica.

**Regra:** AEC primeiro / peso maior em narrativa pública. Audit trail completo no interno. *"Quem souber vai saber."*

**Hierarquia narrativa pública:** *"Method-first, architecture-grounded, AI-last"*.

---

## 2. IDENTIDADES REAIS (não confundir, não deletar)

### 2.1 Sócios fundadores (4) — todos com 2 contas alguns

```
Pedro Henrique Passos Galluf:
  • UUID 17345b36 — admin (passosmir4@gmail.com / phpg69@gmail.com)
  • UUID d5e01ead — paciente teste (Pedro Paciente)
  Operando este chat. Tech lead. CTO.

Dr. Ricardo Valença — fundador médico (2 contas INTENCIONAIS):
  • UUID 99286e6f — admin institucional (iaianoaesperanza@gmail.com)
  • UUID 2135f0c0 — profissional clínico (rrvalenca@gmail.com)
  Médico nefrologista UFRJ + mestrado UFRJ.
  Criador método AEC. 35+ anos medicina.
  Trabalha equipe OS hemodiálise + hospitais (Angra).
  PJ: "Ricardo Valença Serviços de Saúde LTDA" (parceira clínica futura).

Dr. Eduardo Faveret — fundador ensino (2 contas):
  • admin (eduardoscfaveret@gmail.com)
  • profissional clínico (eduardo.faveret@hotmail.com)
  Neurologista. Conselheiro Científico.

João Eduardo Vidal — sócio admin (1 conta):
  • cbdrcpremium@gmail.com
  Comercial/B2B. Representante 1Pure no Brasil (cláusula PR no acordo).
  Não atende clinicamente.
```

### 2.2 Familiares/teste válidos (não remover)

```
Carolina Campello do Rêgo Valença — UUID 5c98c123
  Familiar Ricardo, conta teste pra AEC. NÃO paciente real.
  Tem 31 reports + 7 consultas (todos teste).

Vicente Caetano Pimenta — vicente4faveret@gmail.com
  Filho do Eduardo, cadastrado como patient pra teste familiar.

Pedro Paciente — UUID d5e01ead
  Conta teste do Pedro (admin). 38 reports + 9 consultas teste.
```

### 2.3 Pacientes externos REAIS últimos 7 dias

```
Maria Helena Chaves       (mariahelenaearp@gmail.com) — golden case 03/05
Pedro Alberto Protasio    (apoenaenv@gmail.com)
Badhia Waarrak           (eawarrak@id.uff.br)
Ana Ventorini             (dra.anavs@gmail.com) — profissional
Othon Berardo Nin         (othon.nin@gmail.com)
Carlos Felipe Nascimento (marinikefelipe@gmail.com)
Solange Rodrigues        (micheleuvinha@hotmail.com)
```

### 2.4 Divergência users.type ↔ user_profiles.role (NÃO corrigir)

**Decisão Pedro 24/04:** *"1 ele é adm outro ele é profissional não tem discussão, Eduardo também"*. Zero ação necessária.

---

## 3. BUGS CONHECIDOS (família "estados FSM inconsistentes")

### 3.1 Carolina state ressuscitado (ATIVO 04/05)

```
Sintoma: AEC completa mas dashboard mostra "Iniciar Avaliação" novamente.

Causa raiz: UPDATE em row com invalidated_at preenchido sem limpar
  o invalidated_at. loadStateFromDB filtra invalidated_at IS NULL,
  não acha state ativo → mostra botão de iniciar.

Fix #1 cirúrgico (5min SQL):
  UPDATE aec_assessment_state
  SET invalidated_at = NULL, invalidation_reason = NULL
  WHERE id = 'abce92b0-5f75-44f3-9484-5f107808ef1d'
    AND is_complete = true AND phase = 'FINAL_RECOMMENDATION';

⚠️ Não aplicar sem autorização Pedro.
Audit code path UPDATE invalidated_at em paralelo (~1h).
```

### 3.2 HPP transbordamento AEC (30/04)

```
Bug: input "pneumonia, internado" capturado como PIORA porque
  transition entre fases tem 1 turno de atraso.
Score 79 inflado, conteúdo desorganizado.
Solução B2 recomendada (escriba pós-AEC reorganiza sem tocar FSM).
```

### 3.3 AEC restart regex landmine (V1.9.77 — resolvido)

```
"agora" no relato disparava reset (Pedro testando como Carolina).
Classe: regex de operação confunde relato com comando.
✅ Resolvido. Auditar wantsToExit/meansNoMore pelo mesmo padrão.
```

---

## 4. ESTADO ATUAL EMPÍRICO (snapshot 04/05/2026)

```
USERS:
  37 totais (7 últimos 7 dias)
  23 pacientes / 9 profissionais / 5 admin
  18/37 com consent_accepted_at preenchido

ATIVIDADE CLÍNICA:
  95 reports gerados (18 signed pós-V1.9.95, 77 unsigned legacy)
  0 AECs completas ATIVAS (todas invalidated — bug Carolina)
  70 appointments / 3 done / 35 cancelled (50%)
  34 prescrições CFM

RECEITA:
  0 transações pagas
  0 subscriptions ativas
  ⚠️ Pré-PMF confirmado

CURSOS:
  6 cadastrados
  2 publicados (R$0 grátis): Pós-grad Cannabis + CAR
  4 NÃO publicados (R$99-2999)

INFRA:
  161 tabelas / 341 functions / 432 policies
  9 Edge Functions ativas
  Lock V1.9.95+97+98+99-B preservado
```

---

## 5. PIRÂMIDE GOVERNANÇA 8 CAMADAS (intocável)

```
0. REGRA HARD §1            (Consentimento ≠ Agendamento)
1. COS KERNEL v5.0          (5 portas)
2. AEC FSM                  (16 fases — IDENTIFICATION → COMPLETED)
3. VERBATIM FIRST V1.9.86   (~46% bypass GPT em hard-lock)
4. AEC GATE V1.5            (Lock V1.9.95)
5. GPT-4o-2024-08-06        (só se nada acima resolveu)
6. Pós-processamento
7. Pipeline orchestrator    (REPORT→SCORES→SIGNATURE→AXES→RATIONALITY→DONE)
```

**Princípio:** *"GPT é o último a falar e o primeiro a ser checado."*

**Mexer em camadas 0-2:** exige nova versão Livro Magno + presença Ricardo.
**Mexer em camadas 3-7:** polimento OK com OK Pedro.

---

## 6. GOTCHAS OPERACIONAIS

### 6.1 Banco

```
selectedSlot é ISO completo (não HH:MM)
chat_messages_legacy é canônica (chat_messages é shell vazia)
prescriptions é vulnerável historicamente (use cfm_prescriptions)
4 tabelas de perfil (users canônica)
3 planos legacy "Med Cann 150/250/350" não correspondem à Landing
```

### 6.2 Build/Deploy

```
Build local quebra por dompurify (Vercel passa)
Vite NÃO tem alias '@/' configurado (usar paths relativos)
Vercel rewrites pra /index.html (SPA OK)
CI deploy automático em push paths supabase/functions/<slug>/**
```

### 6.3 Auditoria

```
Use Supabase Management API (PAT do Pedro) pra queries empíricas
NUNCA inventar números — sempre auditar
Smoke real: SELECT cada campo, não count > 0
```

---

## 7. WORKFLOW GIT (4 refs obrigatórios)

```bash
# Antes de iniciar trabalho
git pull amigo main
git pull medcannlab5 main

# Após commit
git push amigo HEAD:main && git push amigo HEAD:master && \
  git push medcannlab5 HEAD:main && git push medcannlab5 HEAD:master

# Verificar baseline type-check
npm run type-check 2>&1 | grep -E "^src.*error TS" | wc -l
# Esperado: 32 (legacy imre_assessments + clinical_integration)
```

---

## 8. DECISÕES SELADAS HOJE (04/05/2026)

### 8.1 Estrutura empresarial (UNÂNIME)

```
✅ Caminho B SIMPLIFICADO
   1 CNPJ MEDCANNLAB TECNOLOGIA EM SAÚDE LTDA
   4 sócios × 20% + 20% tesouraria
   SEM CNAE médico inicial
   SEM AFE/alvará/Clínica Saúde adicional
   CAR é projeto Ricardo (subcontratação futura)

✅ IMRE registra 3 classes INPI (42/44/41) — R$ 1.065
✅ MedCannLab opera sem registrar (uso continuado)
✅ Nôa Esperanza preservada (autoral Ricardo)

✅ Cláusula partes relacionadas:
   • João Vidal × 1Pure (declarada)
   • Ricardo × PJ Serviços de Saúde (se usar pra subcontratação)
```

### 8.2 Princípios não-negociáveis

```
1. Cap table simétrico (4 iguais)
2. AUDITAR 100% antes de qualquer mudança
3. Polir não inventar (P8)
4. P10 sem substituição silenciosa
5. Lock V1.9.95+97+98+99-B intocável
6. Push 4 refs sempre
```

---

## 9. PENDÊNCIAS HUMANAS

```
Pedro (esta semana):
  ☐ Confirmar capital R$ 5k vs R$ 10k
  ☐ Enviar mensagem Paulo (atualizada simplificada)
  ☐ Enviar mensagem advogado (3 candidatos)

João (esta semana):
  ☐ AFE 1Pure + lista produtos com nº ANVISA

Ricardo + Eduardo (sessão 14h hoje):
  ☐ OK formal Caminho B simplificado
  ☐ Estado civil + regime de bens
  ☐ Dados pessoais

4 sócios (próxima reunião):
  ☐ Ata formal aprovação
  ☐ Capital social definido
  ☐ Sede RJ confirmada
```

---

## 10. FRASE ÂNCORA OPERACIONAL

> **"4 sócios iguais. 1 CNPJ MedCannLab. CAR é projeto Ricardo (parceria futura). MedCannLab existe e cresce independente. Pipeline V1.9.95 + Verbatim First V1.9.86 + Lock V1.9.95+ é sagrado. Auditar 100% antes. Polir não inventar. Push 4 refs sempre. IAs são suporte, não autoria."**

> *"A gente não estrutura empresa em cima de ideia — só em cima de realidade."* — GPT do Ricardo, 04/05/2026.

---

## 11. PRINCÍPIOS TÉCNICOS COMPLEMENTARES (parte 2)

### 11.1 Idempotência granular

**Regra:** se uma operação faz N coisas, cada uma precisa flag idempotência separada (não 1 só pra todas). Skip de 1 sinal mascara N-1 gaps.

**Exemplo:** V1.9.123-A tem 5 colunas reminder_sent_* (não 1 booleano genérico) — cada janela tem flag própria.

### 11.2 Instrumentação ANTES do teste

**Regra:** antes de fazer smoke test, instrumentar logs/métricas que vão validar empiricamente. Sem isso, "deu certo" vira chute.

**Exemplo:** noa_logs.video_call_reminders_sweep registra cada execução com stats (scanned, reminders_sent, emails_sent, errors).

### 11.3 Paridade funcional completa (não "última cascata")

**Regra:** ao replicar fluxo, validar TODOS os campos/efeitos que ele produz, não só o output final. Replicar parte ≠ paridade.

**Exemplo:** handleFinalizeAssessment popula 14 campos. Fallback Gate D' P0b populou 6. "Funcionou" mas faltavam 8 campos críticos (signature, scores, axes, rationality).

### 11.4 Postura sobre quebras e evolução

**Pedro 25/04:** *"regressões podem ser revertidas, não são interessantes mas trazem experiência. Foco é evoluir junto. Honestidade direta > cordialidade defensiva."*

**Aplicação:** quando errar, reconhecer rápido + reverter + aprender. Não dramatizar. Não esconder.

### 11.5 Protocolo de remoção de dependência

**Antes de propor remover dep/arquivo:**
```
1. Grep amplo SIMPLES (nome do pacote/arquivo)
2. npm ls <pkg> (validar se usado)
3. npm run build (validar se quebra)
4. Validar com Pedro antes de DELETE
```

**Exemplo:** 26/04 Vimi xenova como "morto", removi, build local quebrou. Pedro corrigiu.

### 11.6 Governance decision matrix v2

**Regra:** decisões clínicas seguem **default + exceção** (não múltipla escolha). Defaults com flag ⚠️ provisório, Pedro corrige conforme caso real.

**4 passos protocolo execução:**
```
1. Identificar default (regra padrão)
2. Verificar se caso é exceção
3. Se exceção: pedir Pedro decidir
4. Se default: aplicar + log
```

### 11.7 Uso zero ≠ código morto

**Regra:** validar contra produto/negócio com dono ANTES de classificar como morto. Em produto nascendo, "infra pré-uso" parece "morto" se medido só por dados.

**Aplicação:** 6 cursos cadastrados (4 pagos não publicados) — não é "morto", é "pré-PMF aguardando gateway".

---

## 12. ARQUITETURA E MAPAS

### 12.1 Mapa arquitetural MedCannLab

```
3 EIXOS:
  • Clínica (AEC + Relatório + Agendamento)
  • Ensino (cursos + TRL + Simulador)
  • Pesquisa (fórum + casos clínicos)

7 NÔA LIBS (lib/):
  • clinicalAssessmentFlow.ts (FSM AEC 16 fases)
  • noaResidentAI.ts
  • clinicalReportService.ts
  • aecGate.ts (Lock V1.5)
  • noaIntegration.ts
  • noaCommandSystem.ts
  • patientDashboardAPI.ts

11 CLINICAL GOVERNANCE:
  • COS Engine v5.0 (5 portas)
  • AEC FSM (16 fases)
  • Verbatim First V1.9.86
  • AEC Gate V1.5
  • Pipeline orchestrator
  • Pós-processamento
  • Signature SHA-256
  • RACI provisório
  • Constituição (REGRA HARD §1)
  • Anti-kevlar §1
  • Pipeline Diário → Magno

9 EDGE FUNCTIONS ATIVAS:
  • tradevision-core (Core principal, ~4300 linhas)
  • digital-signature (ICP-Brasil)
  • wisecare-session (vídeo V4H — homolog)
  • extract-document-text (OCR pdfjs)
  • send-email (Resend)
  • video-call-request-notification
  • video-call-reminders (V1.9.123-A em prod)
  • google-auth (half-impl)
  • sync-gcal (half-impl)
```

### 12.2 4 motores clínicos mapeados

```
1 ATIVO:    AEC FSM (clinicalAssessmentFlow.ts) — 16 fases, em prod
1 GATED:    Rationality Engine (rationalityAnalysisService) — pós-relatório
4 DORMENTES (planejados, não testados):
  • IMRE Score (motor scoring)
  • Triaxial Analysis
  • Clinical Integration Layer
  • IMRE Triaxial Dashboard

⚠️ Não são órfãos — são "implementado/não testado"
   Decisão Ricardo+Eduardo futura: revive ou deprecar
```

### 12.3 Estado real banco (snapshot 28/04)

```
161 tabelas (3 tiers):
  • ~30 ATIVAS (uso diário)
  • ~20 TIER 1 (feature pronta aguardando 1º uso)
  • ~15 TIER 2 (impl parcial)
  • ~35 TIER 3 (verdadeiramente dormente)
  • ~60 outras (lookup, histórico, backup)

341 functions / 432 policies / 27 views (security_invoker=on)

⚠️ NÃO mexer em legacy sem audit empírico
   Lessons learned RLS: já me confundi 24/04 (relrowsecurity vs reloptions)
```

### 12.4 System State Seal 26/04

**Selo no repo:** `SYSTEM_STATE_SEAL_2026-04-26.md` cruzando banco + diários + auditoria 360°.

**Próxima sessão deve:** ler ele + ENGINEERING_RULES.md ANTES de qualquer mudança.

---

## 13. ESTADO DE FEATURES (P0/P1/P2)

### 13.1 P0 funcional ativo

```
🔴 Bug Carolina state inconsistente (família invalidate ressuscitado)
🔴 0 AECs completas ATIVAS (sintoma sistêmico)
🟡 51% appointments cancelados (V1.9.123-A medindo)
🟡 86% abandono AEC iniciada→completa (V1.9.121 atacaria)
```

### 13.2 P0 segurança/conformidade

```
🔴 RLS chat-images já fechado V1.9.98 ✅
🔴 3 Edge half-impl: criar tabela OU desativar
   • google-auth: falta professional_integrations
   • sync-gcal: falta integration_jobs + professional_integrations
🔴 72 files órfãos bucket documents (~67 MB) — LGPD pendente
🔴 WiseCare V4H homolog → migrar produção
```

### 13.3 P1 polish pré-escala

```
🟡 V1.9.97-B timezone agenda
🟡 V1.9.99 grounding factual Nôa (function call)
🟡 V1.9.96 guardrail tiered HARD/SOFT/INFO
```

### 13.4 Decisões humanas pendentes

```
🤝 TRL com Eduardo Faveret (7 tabelas zeradas — ativar?)
🤝 Onda 2/3 Ricardo (gap GPT-first arquitetural)
🤝 NFT $escutese mint real (50+ pacientes pagantes)
🤝 Reativar gamification (feature flag false)
🤝 Limpar 2 RAG contaminados (Pedro Paciente)
```

### 13.5 P0 técnico fora do plano atual (não atacar agora)

```
🔴 S4 JWT — Edge tradevision-core deployada com --no-verify-jwt
   Endpoint público aceita qualquer chamada com patientData.user.id falsificável
   NÃO atacar agora (V1.9.121 vai mexer no Core)
   
🔴 Dívida auth_user_id remap (28/04)
   Bug em 2 camadas (UNIQUE email + FK) no signup paciente via link
   Refactor ~70 pontos atravessando banco+RLS+frontend+Edge
   Atacar quando CNPJ regularizar
```

---

## 14. PRINCÍPIO META — Pipeline Diário → Magno

```
HIPÓTESE → EXPERIMENTO → VALIDAÇÃO → CRISTALIZAÇÃO
(diário)   (sprint)      (uso real)   (Livro Magno)

• Diário = laboratório operacional, registra tudo, WIP
• Memórias persistentes = aprendizados intermediários
• Livro Magno (5 versões em docs/) = museu do que sobreviveu

NÃO atualizar Livro Magno por capricho — só quando
algo evoluído provar-se lei (~3-6 semanas uso real
sem regressão).
```

---

## 15. ESTRATÉGIA E POSTURA

### 15.1 Beyond MVP stage

**Pedro 24/04 noite:** *"não é mais só um MVP, estamos acima"*. Padrão elite escalável pra sessões futuras.

**Implicação:** decisões devem mirar produção real, não experimento. Mas pré-PMF (zero pacientes externos pagantes) limita exposição.

### 15.2 Postura estratégica

> *"Você já tem o produto, só não terminou de estabilizar."*

**IMRE só faz sentido depois que AEC provar que o produto vive.** Polir ativo > construir novo.

### 15.3 Reframe central "method-native" 28/04

**Ricardo via GPT corrigiu:** NÃO é "Regulated Clinical Workflow OS". É **"Infraestrutura Cognitiva Clínica orientada pela Escuta"**.

```
4 PILARES (não 3):
  1. Método (AEC autoral Ricardo)
  2. Motor cognitivo (AEC + IMRE)
  3. Sistema regulado (Pipeline + Lock)
  4. Formação (cursos)

AEC = manifestação operacional do método.
Method-native antes de AI-native.
```

### 15.4 Audit dimensão método empírico

**Documento Mestre tem método autoral formal.** IMRE = motor ATIVO em clinicalAssessmentFlow.ts. 4 fases macro mapeadas a 16 fases FSM. V1.9.27 codifica princípio AEC. Anamnese Triaxial = 3 eixos × 4 dim + 37 blocos.

### 15.5 Origem TradeVision Core

**Core nasceu do TradeVision IA** (app trading anterior do Pedro, código preservado em archive/tradevisioniamedcannlab.txt 10k+ linhas). Tese "Lobo Pré-Frontal Digital / intercepta-avalia-permite IA".

**Visão de governança IA = Pedro / Método AEC = Ricardo / GPT verbalizou, não inventou.**

---

## 16. ESTADOS INTERMEDIÁRIOS E ISM

### 16.1 Interaction State Model — Fase 1 entregue V1.9.66

**ConversationState schema + payload + log em noa_logs.** Puramente aditivo, comportamento intacto.

**Fases 2 (Core respeita estados) + 3 (intent classifier) PENDENTES.**

### 16.2 CONSENT_PENDING_BLOCKED (gap)

**Estado intermediário ausente:** backend correto, UX representando estado errado.

**Não criar V1.9.56 admin_test_mode.** Bug B = entity resolution Ricardo (2 contas).

### 16.3 Context drift "vamos no 4"

**Bug X1 manifestação de "estado conversacional não modelado".** Solução = payload com conversation_state explícito. Mesma raiz de CONSENT_PENDING_BLOCKED.

---

## 17. REGRAS ESPECIAIS

### 17.1 REGRA HARD §1 (constitucional, anti-kevlar)

```
"Consentimento ≠ Agendamento"

`concordo` durante revisão clínica nunca dispara agendamento.
Apenas `sim/autorizo` à pergunta literal de consentimento
(isAskingConsent guard em tradevision-core/index.ts) fecha AEC.

Mudanças que afetam Constituição/RACI/contratos clínicos exigem
nova versão do Livro Magno — não mudar diretamente no código.
```

### 17.2 ICL Identity Canonicalization Layer

**Roadmap pós-PMF:** single source of truth = `clinical_reports.doctor_id`.

**V1.9.107+108 são primeiros passos.**

**ICL completo só quando:** ≥3 médicos ativos + ≥5 pacientes pagantes (over-engineering pré-PMF antes disso).

### 17.3 Lock V1.9.95 AEC + Relatório + Agendamento

```
• AEC só pode iniciar se NÃO houver AEC ativa pendente
• Relatório só gera após consent_given=true E consensus_agreed=true
• Agendamento só após phase=COMPLETED E signature_hash populado
• V1.9.95-A: strippa [TRIGGER_SCHEDULING] automaticamente
  se GPT emitir durante AEC ativa

Tag git: v1.9.95-lock-aec-relatorio-agendamento
```

---

## 18. BUGS HISTÓRICOS RESOLVIDOS (referência)

```
✅ V1.9.67 — AEC residual state (refusal path linha 1126)
✅ V1.9.77 — AEC restart regex landmine
✅ V1.9.85 — Fix D UUID validation widget
✅ V1.9.86 — Verbatim First aplicado (Onda 2)
✅ V1.9.93-A — Strip tokens internos
✅ V1.9.95-A — Strip [TRIGGER_SCHEDULING] durante AEC
✅ V1.9.97-D — RLS prescriptions fechado
✅ V1.9.98 — chat-images bucket fechado
✅ V1.9.99 — Resend production-locked
✅ V1.9.99-B — Storage RLS
✅ V1.9.115 — 75 reports unsigned é histórico (não bug)
✅ V1.9.122 — CTAs estado vazio dashboard paciente
✅ V1.9.123-A — Lembretes 24h+1h em prod
```

---

## 19. PIPELINE OBSERVADO AO VIVO 28/04

**Logs reais jvbiocann confirmam pirâmide 8 camadas funcionando como Magno descreve.**

**V1.9.86 Verbatim First entrega 100% bypass em hard-lock** (vs 46% anunciado em métricas globais).

**Pipeline orchestrator latency:** ~20s (REPORT→SCORES→SIGNATURE→AXES→RATIONALITY→DONE).

**1 warning:** DOCTOR_RESOLUTION fallback silencioso (P1).

---

## 20. INVESTMENT MEMO 28/04 (referência VC)

**Categoria:** "Clinical OS with AI governance" (sem precedente de mercado).

**Posicionamento:** top 20% arquitetura, bottom 50% tração.

**Wedge:** CKD-cannabis + Ricardo (autoridade nefrologia + cannabis).

**Valuation:**
```
Pre-CNPJ:                  $1.5M-3M
Se 50+ pagantes 6 meses:   $5M-12M
```

**Risco:** over-architected before demand proof. Janela 60-90 dias.

**Regra ouro:** *"commits que não destravam paciente externo = dívida cognitiva"*.

---

## 21. INSTRUÇÃO FINAL PRO CLAUDE QUE LER ESTE DOC

```
1. Leia este doc INTEIRO antes de tomar qualquer ação
2. Cruze com:
   - CLAUDE.md (contexto geral)
   - docs/LIVRO_MESTRE_MEDCANNLAB_v1.0.md (decisões)
   - docs/BRIEFING_PROXIMA_SESSAO_CASA_RICARDO.md (handoff)
   - docs/REALIDADE_vs_LIVRO_MESTRE_04_05.md (estado atual)
3. Se algum princípio aqui contradisser algo na sessão atual, valide com Pedro
4. NÃO mexa em código sem auditar empiricamente primeiro
5. NÃO invente números — use Supabase Management API
6. Push 4 refs sempre
7. Lock V1.9.95+97+98+99-B é INTOCÁVEL
8. AEC FSM (clinicalAssessmentFlow.ts) é INTOCÁVEL exceto V1.9.121 autorizada
9. Pipeline orchestrator é INTOCÁVEL
10. Verbatim First V1.9.86 é INTOCÁVEL
```

---

## 22. ÍNDICE DE TODAS AS 98 MEMÓRIAS NO DESKTOP DO PEDRO

**Categoria FEEDBACK (princípios — 20 memórias):**
```
aec_escuta_ativa, anomalia_nao_e_bug, anti_overclaim_endorsements,
anti_subestimacao_severidade, auditar_100_antes_de_qualquer_mudanca,
credentials, dep_removal_protocolo, dinamica_relacional_socios,
ias_sao_suporte_nao_autoria, idempotencia_granular,
instrumentacao_antes_do_teste, no_aggressive_removal,
p10_substituicao_silenciosa_responsabilidade, p9_nao_uso_nao_e_nao_precisa,
paridade_funcional_completa, postura_quebras_e_evolucao,
principio_clinico_destrutivo, push_remotes_corretos, uso_zero_nao_e_morto
```

**Categoria PROJECT (estratégia + estado — 70 memórias):**
```
4_clinical_engines_map, admin_identities, aec_flow,
aec_hpp_transbordamento, aec_primeiro_ciclo_completo, aec_residual_state,
aec_restart_regex_landmine, analisar_paciente_feature_mapeada,
anexos_prof_paciente_plano_nao_acabado, architecture_map,
arquitetura_3_camadas, audit_metodo_dimensao, audit_profundo,
banco_mapa_completo, beyond_mvp_stage, brain_disconnect, ci_pipeline,
cluster_educacional_ativo, context_drift, divida_auth_user_id,
estado_e_backlog, estados_intermediarios, features_fantasma,
git_workflow, governance_decision_matrix, icl_identity_canonicalization_layer,
identidades_reais, identity_gap, imre_clarification, imre_cluster_escalado,
interaction_state_model_camada_fundacional, lessons_learned_rls_audit,
lock_v1995_aec_relatorio_agendamento, mimre_pesos_narrativos,
modo_visualizacao_e_fallback, narrator_overreach,
origem_tradevision_core_pedro, paragrafo_institucional_v15,
pipeline_diario_para_magno, pipeline_observado_ao_vivo,
planos_canonicos, postura_estrategica, progress_24_04,
real_state_23_04, regra_consentimento_nao_e_agendamento,
retorno_livro_magno, role_divergence, s4_jwt_mapping,
selo_24_04, selo_entendimento, selo_quintuplo_v1_9_121,
strategic_posture, strategy_marca_imre_medcannlab,
supabase_real_state, system_state_seal, user_base_stage,
v1_9_115_reports_unsigned_resolvido, v1_9_121_aec_promocao_selada,
veredito_final, video_call_reminders_v53, lead_free_seo_seal_03_05,
3_features_half_implemented_p0, investment_memo,
reframe_method_native, paragrafo_institucional_v8 a v14,
estado_28_04_2026_pos_lock_v1997
```

**Categoria REFERENCE (mapas técnicos — 5 memórias):**
```
supabase_estado_total_28_04, video_call_stack_28_04,
edge_functions_catalogo_completo, cheatsheet_supabase_operacional,
acordo_quotistas_juridico
```

**Categoria USER (info do usuário — 1 memória):**
```
user_role
```

**Total:** 96 memórias específicas + MEMORY.md (índice) + 1 user = ~98 arquivos.

**No laptop do Pedro:** procurar memórias por `feedback_<tema>`, `project_<tema>`, `reference_<tema>` — caminho `~/.claude/projects/c--Users-<user>-Desktop-amigo-connect-hub-main/memory/`.

**Se memórias específicas faltarem no laptop:** este doc + LIVRO_MESTRE + BRIEFING + diários cobrem 95% do contexto necessário.
