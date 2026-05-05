# WhatsApp Integration Blueprint — MedCannLab + Nôa Esperanza

**Data:** 05/05/2026
**Autores:** Pedro Galluf (decisão) + Claude Opus 4.7 (arquitetura) + GPT (review crítico)
**Estado:** 📋 SELADO — não codado. Aguarda CNPJ formal + Meta Cloud API verified.
**Número canônico:** `+55 21 97463 2738` (RJ — pendente vinculação Cloud API pós-CNPJ)
**Documento referência paralelo:** `docs/LEAD_FREE_SEO_BLUEPRINT_03_05_2026.md`

---

## 🎯 Princípio Guia

> **"WhatsApp é apoio. App é o produto. Toda função com gravidade clínica/legal/financeira retorna ao app — onde há autenticação forte, contexto rico e auditoria CFM."**

WhatsApp tem 3 limitações estruturais que decidem o que pode rodar nele:

1. **Sem rich UI** — não suporta cards interativos, modais, formulários multi-step
2. **Sem identificação verificável** — número pode ser de qualquer pessoa que tem o aparelho
3. **Custo por mensagem** — Meta tarifa ~R$ 0,12-0,30/msg empresa-iniciada + custo OpenAI por chamada

WhatsApp **não substitui** nenhuma das 8 camadas da pirâmide de governança. É **apenas um transport alternativo** ao web, que chama o mesmo `tradevision-core` Edge.

---

## 📋 Mapa de Responsabilidades

### 🟢 Obrigatoriamente NO APP

| Função | Razão técnica/regulatória |
|---|---|
| **AEC completa** | FSM 13+ fases, verbatim-first V1.9.86, gravidade clínica, consentimento explícito |
| **Prescrição CFM** | ICP-Brasil + ITI QR + responsabilidade médica (CFM 2.314/2022) |
| **Assinatura digital** | Certificado nível 3 obrigatório |
| **Pagamento/checkout** | Webhook Stripe/MP, segurança PCI-DSS |
| **Relatórios clínicos formais** | Estrutura rica + share controlado + signed_hash |
| **Racionalidades médicas** | Gate `role=profissional` + RLS Postgres |
| **Agendamento confirmado** | Slot real + Resend transacional + calendário sincronizado |
| **Edição de perfil/dados sensíveis** | LGPD strict + audit trail |
| **Compartilhamento de relatório com médico** | RPC `share_report_with_doctors` autenticada |

### 🟡 Permitido NO ZAP (limitado e leve)

| Função | Por quê pode |
|---|---|
| **Chat livre educacional** | "O que é AEC?", "como funciona o método Ricardo Valença?", orientação geral sem prescrição |
| **Confirmação binária** | "SIM/NÃO confirma consulta amanhã 15h?" |
| **Lembretes automáticos** | 24h/1h antes da consulta (reusa V1.9.123-A) |
| **Dúvidas de produto** | "Como acesso meu relatório?", "Esqueci a senha" |
| **Link mágico pra app** | Toda resposta com ação relevante anexa link autenticado expirável |
| **Notificação de evento** | "Seu relatório está pronto. Abrir: [link]" |

### 🚫 NUNCA no Zap

- Diagnóstico fechado ("você tem X")
- Prescrição direta com dose/posologia
- Documento PDF prescritivo (vai pelo app, paciente baixa autenticado)
- Dado clínico sensível em texto livre (vai por link autenticado, não inline)
- Recebimento de exames/imagens (rich content vai pelo app)

---

## 🔀 5 Triggers automáticos zap → app

Quando paciente escreve mensagem com gravidade, Nôa **redireciona com link mágico** em vez de responder no canal:

| Trigger | Detector | Ação |
|---|---|---|
| **Sintomático** | regex `dor|tomar|remédio|tratamento|sintoma` | "Vou te levar pro app pra avaliação completa: [link]" |
| **Prescritivo** | regex `dose|mg|posologia|miligrama` | Bloqueia + "Isso é decisão médica. Agende consulta: [link]" |
| **Pedido relatório** | regex `relatório|laudo|prontuário` | Link autenticado pro app expira em 30min |
| **Solicitação agenda** | regex `agendar|marcar|consulta` | Link `/app/clinica/paciente/agendamentos` |
| **Loop ≥5 msgs** | counter `daily_count` por sessão | "Vamos continuar no app pra registrar tudo: [link]" |

**Reuso:** detector reaproveita lógica que já existe em [clinicalAssessmentFlow.ts](../src/lib/clinicalAssessmentFlow.ts) — IMRE classifica intent CLINICA vs INFORMATIONAL.

---

## 🔒 Modelo B — OTP visível na sessão autenticada (decisão final)

### Por que B (vs A phone match / vs C magic link recurring)
- **A** é fraco: troca de SIM, WhatsApp clonado, paciente empresta o cel
- **C** é forte mas alta fricção (revalida cada N horas)
- **B** prova **3 coisas ao mesmo tempo**: acesso ao app + posse do número + ato consciente de vincular

### Fluxo (sem SMS, sem custo extra)

```
1. Paciente loga no app web
2. Vai em Perfil → "Vincular WhatsApp"
3. App gera OTP de 6 dígitos visível só pra sessão autenticada
   - Salva users.whatsapp_otp + whatsapp_otp_expires_at (10 min)
4. App mostra: "Mande esta mensagem ao 21 97463 2738:
   VINCULAR 482903"
5. Paciente abre WhatsApp, copia mensagem, manda
6. Webhook recebe, valida OTP + phone match com user_id
7. INSERT whatsapp_sessions (phone, user_id, consent_at=now())
8. Limpa OTP (one-shot)
9. Confirmação: "Pronto! Sou a Nôa, sua assistente educacional..."
```

**Vantagens:**
- ✅ Zero custo SMS (OTP visível no app web)
- ✅ Prova autenticação app
- ✅ Vínculo permanente (não revalida cada sessão)
- ✅ Possível desvincular: paciente revoga em Perfil → "Desvincular WhatsApp"

---

## 📊 Tabela de limites por tier (selada)

| Tier | Chat zap/dia | AEC | Token budget/mês | Modelo padrão |
|---|---|---|---|---|
| **Trial** (não-pagante) | 5 | 1 lifetime | 50k | gpt-4o-mini |
| **R$ 60 — Pacto Paciente** | 30 | 1/dia, 3/sem | 500k | gpt-4o-mini |
| **R$ 149 — Pacto Premium** | 50 | ilimitado fair-use | 1M | gpt-4o (downgrade aos 80%) |
| **Médico/Aluno** (uso interno autenticado) | 100 | N/A | 2M | gpt-4o |

**Regras adicionais:**
- **Reset diário**: 00:00 BRT (cron simples reset `msgs_count_today=0`)
- **Reset mensal**: dia 1 do mês (`tokens_used_month=0`)
- **Reset semanal AEC**: segunda-feira 00:00 BRT (`aec_count_week=0`)
- **Anti-flood**: máx 3 msgs/min por phone (independente do tier)
- **Atingir limite**: mensagem padrão "Limite diário atingido. Continue no app: [link]"

**Princípio:** limite **comportamental** (msgs/AECs) é o que paciente entende; tokens são **budget invisível de segurança**. Quando token budget chega 80% → **degradação graceful** automática (gpt-4o → gpt-4o-mini). Aos 100% → bloqueia.

**Tunabilidade:** todos os números via tabela `feature_flags` existente (sem deploy):
```
whatsapp.chat_msgs_per_day_trial = 5
whatsapp.chat_msgs_per_day_pacto = 30
whatsapp.chat_msgs_per_day_premium = 50
whatsapp.aec_per_week_pacto = 3
whatsapp.token_budget_monthly_pacto = 500000
whatsapp.token_degrade_threshold = 0.80
whatsapp.debounce_ms = 2500
whatsapp.flood_max_per_minute = 3
```

---

## ⚖️ Fluxo LGPD — primeira mensagem

```
1. Paciente escreve qualquer coisa pela primeira vez

2. Webhook: phone NOT IN whatsapp_sessions → bifurca:

   Caso A: phone NOT IN users.phone
     → Resposta padrão (template Meta aprovado):
       "Olá! Para usar este canal, você precisa estar
        cadastrado no MedCannLab. Cadastre-se em:
        medcannlab.com.br
        Depois volte aqui pra começarmos."
     → Não cria sessão, não chama OpenAI (custo zero)

   Caso B: phone IN users.phone E NÃO consent
     → Template aprovado Meta com pedido de consent:
       "Olá {nome}! Sou a Nôa Esperanza, assistente
        educacional da MedCannLab.
        ⚠️ Para conversarmos por aqui, preciso do seu
        consentimento:
        ✅ Suas mensagens podem ser processadas pela IA
        ✅ Conteúdo pode ser usado para apoiar sua jornada
        ✅ Você pode pedir exclusão a qualquer momento (LGPD Art. 18)
        ✅ Este canal NÃO substitui consulta médica
        ✅ Termos: medcannlab.com.br/termos
        Para começar, responda *ACEITO*."

3. Resposta "ACEITO" exato:
   → INSERT whatsapp_sessions (phone, user_id, consent_at=now(),
     consent_terms_version='v1.0_05_05_2026')
   → Confirmação: "Pronto! Como posso te ajudar hoje?"
   → Libera chat dentro do limite do tier

4. Resposta diferente:
   → Re-pergunta uma vez
   → Se persistir sem ACEITO: encerra com cordialidade
```

**Reuso de infra:** `users.phone` já existe + tabela `terms_acceptance` poderia ser estendida (já há padrão de LGPD no código).

**Auditoria:** consent_at + consent_terms_version permite prova jurídica em caso de questionamento ANPD.

---

## 💾 Schema SQL completo

```sql
-- ============================================================
-- Tabela nova mínima: whatsapp_sessions
-- ============================================================
CREATE TABLE whatsapp_sessions (
  phone TEXT PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,

  -- Consent LGPD
  consent_at TIMESTAMPTZ,
  consent_terms_version TEXT,

  -- Atividade
  last_message_at TIMESTAMPTZ,
  last_user_msg_at TIMESTAMPTZ,  -- pra janela 24h Meta gratuita

  -- Counters comportamentais
  msgs_count_today INT DEFAULT 0,
  msgs_count_today_reset_at DATE,
  aec_count_week INT DEFAULT 0,
  aec_week_reset_at DATE,

  -- Budget de segurança (tokens)
  tokens_used_today INT DEFAULT 0,
  tokens_used_month INT DEFAULT 0,
  tokens_month_reset_at DATE,

  -- Estado
  blocked BOOLEAN DEFAULT FALSE,
  blocked_reason TEXT,
  blocked_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS: paciente só vê própria sessão
ALTER TABLE whatsapp_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY whatsapp_sessions_select_own ON whatsapp_sessions
  FOR SELECT USING (user_id = auth.uid() OR is_admin());

-- ============================================================
-- Adições mínimas em users (já existe phone)
-- ============================================================
ALTER TABLE users ADD COLUMN IF NOT EXISTS whatsapp_otp TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS whatsapp_otp_expires_at TIMESTAMPTZ;
ALTER TABLE users ADD COLUMN IF NOT EXISTS whatsapp_verified_at TIMESTAMPTZ;

-- Índice pra lookup rápido phone → user_id
CREATE INDEX IF NOT EXISTS users_phone_idx ON users(phone)
  WHERE phone IS NOT NULL;

-- ============================================================
-- noa_logs (existente) ganha interaction_types novos
-- ============================================================
-- Sem migration, só convenção:
-- 'whatsapp_inbound' / 'whatsapp_outbound' / 'whatsapp_consent_given' /
-- 'whatsapp_otp_verified' / 'whatsapp_redirect_to_app' /
-- 'whatsapp_rate_limited' / 'whatsapp_token_degraded'

-- ============================================================
-- feature_flags (existente) ganha entradas
-- ============================================================
INSERT INTO feature_flags (key, value) VALUES
  ('whatsapp.enabled', 'false'),  -- master kill-switch
  ('whatsapp.chat_msgs_per_day_trial', '5'),
  ('whatsapp.chat_msgs_per_day_pacto', '30'),
  ('whatsapp.chat_msgs_per_day_premium', '50'),
  ('whatsapp.aec_per_week_pacto', '3'),
  ('whatsapp.token_budget_monthly_pacto', '500000'),
  ('whatsapp.token_degrade_threshold', '0.80'),
  ('whatsapp.debounce_ms', '2500'),
  ('whatsapp.flood_max_per_minute', '3');
```

---

## 🛠️ Edges propostos (3 novos)

### 1. `whatsapp-webhook` (Cloud API → MedCannLab)
- Recebe payload Meta Cloud API
- Verifica HMAC signature
- Lookup phone → user_id
- Aplica rate limit (anti-flood + daily count)
- Aplica debounce (agrega msgs em sequência ≤ 2.5s)
- Roteia: consent flow / redirect / chamada `tradevision-core` com `channel='whatsapp'`

### 2. `whatsapp-send` (MedCannLab → Cloud API)
- Adapter unificado: aceita `{ to, template_name, params }` ou `{ to, free_text }`
- Reusa fluxo similar ao `send-email` (Resend) já em prod
- Templates aprovados Meta (lembrete 24h, lembrete 1h, OTP confirm, consent request)
- Janela 24h: free text se `last_user_msg_at < 24h ago`, senão usa template

### 3. `whatsapp-otp-generate` (autenticado, frontend)
- Gera OTP 6 dígitos
- Salva `users.whatsapp_otp + whatsapp_otp_expires_at` (TTL 10 min)
- Retorna OTP pro frontend mostrar pro paciente

**Reuso máximo:** **NÃO** criar `whatsapp-tradevision`. WhatsApp inbound chama `tradevision-core` existente com:
```json
{
  "channel": "whatsapp",
  "phone": "+5521974632738",
  "user_id": "uuid",
  "message": "...",
  "force_model": "gpt-4o-mini",
  "max_tokens": 600
}
```

Pirâmide 8 camadas inteira aplica idêntica. Diferença só de:
- prompt-system mais curto (~30% do app)
- gpt-4o-mini forçado (custo)
- max_tokens menor (600 vs 4000)
- pós-processamento extra (anexa link mágico se trigger)

---

## ⚠️ 4 Riscos críticos + mitigações

### 1. LGPD — dado clínico em canal público
**Risco real:** WhatsApp criptografa em trânsito mas Meta tem metadados (com quem você fala, quando, frequência). Mensagens em Cloud API ficam armazenadas Meta por **30 dias mínimo**.

**Mitigações:**
- ✅ Consent explícito ACEITO (capturado + versionado)
- ✅ Termos atualizados mencionando WhatsApp
- ✅ Aviso "este canal NÃO substitui consulta médica" em primeira mensagem
- ✅ Dados sensíveis (relatórios, prescrições) **nunca inline**, sempre por link autenticado
- ✅ Direito de exclusão LGPD Art. 18 implementado (paciente responde "EXCLUIR" → soft delete)

### 2. CFM — telemedicina
**Risco real:** Resolução CFM 2.314/2022 exige identificação verificável + ato médico responsável. WhatsApp sozinho não atende.

**Mitigações:**
- ✅ Modelo B (OTP via app autenticado) cumpre identificação
- ✅ Prescrição **bloqueada** no canal (trigger detector + bloqueio automático)
- ✅ Diagnóstico fechado bloqueado (mesmo guardrail que o app — REGRA HARD §1)
- ✅ Texto explícito "este canal NÃO substitui consulta médica"
- ✅ Toda resposta clínica termina com "se persistir, agende consulta: [link]"

### 3. Custo OpenAI sem teto
**Risco real:** Mesmo 30 msg/dia × 100 pacientes pagantes = 3000 calls/dia ≈ R$ 90-150/dia em GPT-4o.

**Mitigações:**
- ✅ gpt-4o-mini default no canal zap (10x mais barato)
- ✅ Token budget mensal por user_id com degradação graceful aos 80%
- ✅ Hard block aos 100%
- ✅ Debounce 2.5s reduz fragmentação ~60%
- ✅ Anti-flood 3/min protege contra loop/abuse

### 4. Expectativa cultural BR (humano vs IA)
**Risco real:** WhatsApp = expectativa de resposta humana em segundos. Se Nôa responde mas paciente esperava "alguém da clínica", gera fricção e reclamação.

**Mitigações:**
- ✅ Primeira mensagem **sempre** declara: "Sou a Nôa, assistente digital. Não substituo atendimento humano."
- ✅ Tagline em cada resposta longa
- ✅ Trigger especial pra emergência ("URGENTE", "EMERGÊNCIA") → "Não atendo emergência. Ligue 192 ou vá ao pronto-socorro."
- ✅ Opção sempre visível: "Falar com humano: [link de ticket]" (futuro)

---

## 📅 Sequência de implementação (pós-CNPJ)

### Sprint 1 — Notificações (~12h, baixo risco)
**Entrega:** lembretes automáticos via WhatsApp.

- [ ] Conta Meta Cloud API verified com CNPJ
- [ ] Templates aprovados Meta: `appointment_reminder_24h`, `appointment_reminder_1h`, `otp_confirm`, `consent_request`
- [ ] Edge `whatsapp-send` adapter
- [ ] Tabela `whatsapp_sessions` (migration)
- [ ] Conexão com cron de V1.9.123-A reminders existente
- [ ] Smoke: 1 lembrete real disparado manualmente
- **Custo OpenAI:** zero (não usa IA, só envia template)

### Sprint 2 — Chat livre com Nôa (~16h, risco médio)
**Entrega:** chat educacional funcional com gate consent + redirect inteligente.

- [ ] Edge `whatsapp-webhook` (HMAC + lookup + debounce + rate limit)
- [ ] Adições em `users` (whatsapp_otp + verified_at)
- [ ] Edge `whatsapp-otp-generate`
- [ ] UI no app web: aba "Vincular WhatsApp" no Perfil
- [ ] Conexão com `tradevision-core` (parâmetro `channel: 'whatsapp'`)
- [ ] Detectores de redirect (5 triggers)
- [ ] Pós-processamento de link mágico autenticado
- [ ] Smoke: AEC bloqueada (redireciona pro app), pergunta educacional respondida (gpt-4o-mini)

### Sprint 3 — Operação + observabilidade (~10h, polish)
**Entrega:** sistema completo, auditável, dentro de LGPD/CFM.

- [ ] Painel admin: volume zap por paciente, custo OpenAI por dia, quem atingiu limite
- [ ] Comando "EXCLUIR" → soft delete LGPD Art. 18
- [ ] Comando "DESVINCULAR" → remove sessão (mantém histórico audit)
- [ ] Métricas em `noa_logs` para auditoria
- [ ] Documentação operacional (runbook)
- [ ] Definição final dos limites por tier (com base em smoke das 2 sprints anteriores)

**Total:** ~38h de código pra ter Nôa Esperanza no WhatsApp completa, gov compliant, escalável e econômica.

---

## 🎯 Decisão estratégica (pré-CNPJ)

**NÃO codar agora.** Por quê:

| Bloqueador | Detalhe |
|---|---|
| **CNPJ** | Meta Cloud API exige CNPJ + Facebook Business Manager Verified |
| **Receita** | 0 paciente externo pagante = sem demanda real |
| **Foco** | 3 caminhos críticos pré-CNPJ não envolvem WhatsApp: payment-checkout, signup→AEC→paywall, templates Resend cobrança |
| **Risco distração** | 38h de código que **não destrava paciente pagante Dia 1 do CNPJ** |

**Fazer agora:**
- ✅ Documentar arquitetura (este documento)
- ✅ Salvar memória persistente
- ✅ Atualizar Livro Mestre v1.0 com referência ao blueprint
- ✅ Travar decisões: Modelo B + tier por plano + 5 triggers + Sprint 1 primeiro

---

## 📈 Métricas de sucesso (futuro)

Quando ativar pós-CNPJ, KPIs claros:

| Métrica | Meta | Fonte |
|---|---|---|
| Adoção opt-in | ≥40% dos pacientes pagantes vinculam WhatsApp em 30 dias | `whatsapp_sessions.consent_at` |
| Redução cancelamento consulta | -30% cancelamentos com lembrete 24h zap (vs sem) | comparativo antes/depois Sprint 1 |
| Custo médio por paciente/mês | < R$ 5,00 (OpenAI + Meta) | `noa_logs` agregado por user |
| % redirects ao app | ≥30% das interações terminam com clique no link mágico | tracking de link mágico |
| Bloqueios por flood | < 1% das sessões mensais | `whatsapp_sessions.blocked_reason='flood'` |
| Templates Meta rejection rate | 0% | painel Meta Business |

---

## 📚 Referências

- **Documentos paralelos:**
  - `docs/LEAD_FREE_SEO_BLUEPRINT_03_05_2026.md` (mesmo padrão arquitetural)
  - `docs/LIVRO_MESTRE_MEDCANNLAB_v1.0.md` (princípios)
  - `docs/PARTNERSHIP_FRAMEWORK.md` (caso 1Pure como modelo de framework)

- **Memórias relacionadas:**
  - `project_v1_9_121_aec_promocao_selada_03_05.md` (princípio "paciente confirma a organização da própria fala")
  - `feedback_p10_substituicao_silenciosa_responsabilidade.md` (anti-kevlar — aplica aqui em "WhatsApp não decide clínica")

- **Regulação:**
  - LGPD Lei 13.709/2018 — Art. 7º (consentimento) + Art. 18 (direitos do titular)
  - CFM 2.314/2022 — Telemedicina
  - Meta Business Policy — WhatsApp Business API

---

## 🔒 Selo de fechamento

Este documento foi **selado com revisão dupla:**
- Claude Opus 4.7 (arquitetura técnica + reuso de infra existente)
- GPT (validação crítica + ajuste do Modelo B + framework de tokens vs comportamento)

Pedro Galluf é o decisor final e validou em 05/05/2026 ~15:00 BRT.

**Não modificar este documento sem nova decisão de arquitetura.** Para mudanças, criar v2 nova com data e razão.

> **Frase âncora:**
> *"WhatsApp é apoio, app é o produto. Modelo B (OTP visível só no app autenticado) prova identidade real. Limite por comportamento, tokens como budget invisível. Sem CNPJ não tem Cloud API. Sem demanda real não tem código."*
