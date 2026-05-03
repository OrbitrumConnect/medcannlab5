# LEAD_FREE SEO BLUEPRINT — Pré-CNPJ
**Data:** 03/05/2026
**Autor:** Pedro Henrique Passos Galluf + Claude Opus 4.7 + GPT (review)
**Status:** 📦 DOCUMENTADO — não codado (aguarda CNPJ + revisão jurídica + Ricardo)

---

## SUMÁRIO EXECUTIVO

Documenta o modelo de **funil de aquisição lead_free via SEO** para 3 perfis (paciente, médico, aluno), com **chat anônimo + AEC light + relatório salvo antes do cadastro**. Implementação adiada até CNPJ formal de controlador LGPD estar definido.

**Tese central (validada por Pedro + GPT):**
> "Relatório clínico salvo antes do cadastro = coração do modelo. Cria continuidade psicológica + custo de abandono + elimina refazer AEC."

---

## 1. ESTADO ATUAL (auditado empiricamente 03/05/2026)

### 1.1 Captura ativa funcionando

- **9 cadastros nos últimos 7 dias** (tração real)
- **37 usuários totais** (5 admin + 13 profissionais + 18 pacientes + 1 aluno)
- **`consent_accepted_at`** registrado em `users` (18/37 = 49%, restante legacy pré-LGPD)
- **`ConsentGuard`** bloqueia `/app` até aceite de 3 checkboxes (Termos / Compartilhamento / Consulta médica)

### 1.2 Flow de cadastro atual

```
Landing.tsx (/) ou /paciente /medico /aluno
  ↓
Botão "Iniciar..." → setShowRegister(true)
  ↓
AuthModal (cadastro tradicional email + senha)
  ↓
Supabase auth.signUp() → trigger cria row em users
  ↓
Redirect /app
  ↓
ConsentGuard intercepta (overlay obrigatório)
  ↓
Aceita 3 checkboxes → consent_accepted_at = now()
  ↓
Libera dashboard
```

### 1.3 Rotas SEO ativas (V1.9.120-B)

| Rota | Status | SEO meta tags |
|---|---|---|
| `/paciente` | ✅ Ativa | useSEO() com title+desc específico |
| `/medico` | ✅ Ativa | useSEO() com title+desc específico |
| `/aluno` | ✅ Ativa | useSEO() com title+desc específico |

**Atualmente todas levam pra cadastro tradicional.** Sem chat anônimo embutido.

---

## 2. MODELO PROPOSTO (lead_free completo)

### 2.1 Fluxo paciente lead_free

```
SEO /paciente
  ↓
Modal LGPD obrigatório (1ª tela)
  ✓ Aceito coleta conforme [Termo LGPD v2 — pós-CNPJ]
  ✓ Entendo que isso é triagem informativa, não diagnóstico
  ↓
<MiniNoaChatAnonymous /> embutido na landing
  - 5-7 turnos com AEC light
  - cap rígido por session_id (não user_id)
  - sem RAG, sem racionalidade, sem prescrição
  ↓
Relatório AEC light gerado + salvo
  - vinculado a lead_session_id (UUID client-side)
  - retenção 7 dias (pseudonimização aos 7d, exclusão aos 30d)
  ↓
"Pra acessar relatório completo + dashboard + agendamento:
   [Cadastre-se grátis e assine R$60/mês + R$19,90 inscrição]"
  ↓
Cadastro: magic link Supabase (passwordless)
  ↓
Backend vincula lead_session_id → user_id (via email match)
  ↓
INTELIGÊNCIA: redirect direto pra ABA PAGAMENTO
  (porque já tem relatório, não precisa fazer AEC de novo)

VERSUS

Cadastro tradicional sem SEO:
  ↓
Cai no chat Nôa normal (faz AEC do zero)
```

### 2.2 Decisões binárias seladas (pelo Pedro 03/05)

| # | Decisão | Escolha |
|---|---|---|
| 1 | Chat anônimo onde roda | **B — Reusa `tradevision-core` com gate `mode=anonymous` (FAIL-CLOSED)** |
| 2 | Schema AEC anônima | **A — Tabela nova `aec_anonymous_state`** (isolado de `aec_assessment_state`) |
| 3 | Retenção relatório anônimo | **A — 7 dias** (pseudonimização aos 7d, exclusão aos 30d) |
| 4 | Cadastro pós-AEC | **A — Magic link Supabase** (passwordless) |
| 5 | Inscrição R$ 19,90 | **A — Manter** (modelo Landing atual) |
| 6 | Multichannel | Campo `channel` ENUM('web','whatsapp','app') desde já (futuro WhatsApp) |

---

## 3. PRÉ-REQUISITOS BLOQUEANTES

### 3.1 P0 — CNPJ formal (controlador LGPD)

**Bloqueador real, não teórico.**

Sem CNPJ:
- LGPD art. 5 inciso VI exige controlador identificado
- Coleta de dado sensível de saúde sob responsabilidade pessoal de Pedro/Ricardo
- ANPD pode multar pessoa física (art. 52, multa até 2% do faturamento — para PF, calculada sobre rendimentos)
- Lead anônimo coletando AEC sem proteção empresarial = exposição direta

**Status:** João Eduardo Vidal está destravando.
**Sem CNPJ:** não codar lead_free anônimo.

### 3.2 P0 — Termo LGPD v2 (texto jurídico mínimo)

Ver seção 4 abaixo (rascunho pronto pra revisão jurídica).

### 3.3 P0 — Disclaimer clínico forte do relatório

Ver seção 5 abaixo.

### 3.4 P1 — Spec FAIL-CLOSED do mode=anonymous

Ver seção 6 abaixo.

---

## 4. TERMO LGPD ENXUTO (rascunho pré-CNPJ)

### 4.1 Texto pra modal inicial do chat anônimo

> **Antes de começarmos**
>
> A MedCannLab vai te ajudar a organizar sua história clínica para uma consulta médica futura.
>
> **O que coletamos:** dados de saúde que você fornecer (sintomas, histórico, medicações, alergias).
>
> **Para quê:** estruturar essas informações em um relatório que você pode levar a um médico.
>
> **Quem é responsável:** [MedCannLab Tecnologia em Saúde Ltda — CNPJ XX.XXX.XXX/0001-XX] *(em registro)*. Endereço: [endereço]. Encarregado de dados (DPO): [nome] — contato: dpo@medcannlab.com.br
>
> **Por quanto tempo guardamos:** 7 dias. Após isso, removemos seu email e identificadores, mantendo apenas dados pseudonimizados por mais 23 dias para fins estatísticos. Após 30 dias totais, excluímos tudo.
>
> **Seus direitos (LGPD art. 18):**
> - Saber o que está armazenado
> - Pedir cópia, correção ou exclusão a qualquer momento
> - Revogar este consentimento
> - Contato: dpo@medcannlab.com.br ou através do canal "Meus Dados" no site
>
> **Importante:** este chat é **triagem informativa e educacional, NÃO é consulta médica nem diagnóstico**. Para diagnóstico ou tratamento, é necessária consulta com profissional habilitado.
>
> ☐ Li e aceito a coleta dos meus dados nos termos acima.
> ☐ Entendo que este chat não é consulta médica nem diagnóstico.
>
> **[Continuar]** (desabilitado até ambos checkboxes)

### 4.2 Validação jurídica necessária

Texto deve ser revisado por:
1. Advogado especialista em LGPD + saúde
2. Dr. Ricardo Valença (validação clínica)
3. Compliance/DPO (encarregado de dados)

### 4.3 Campos a adicionar no banco (pós-CNPJ)

```sql
-- Nova tabela leads_consent_log (para auditoria LGPD)
CREATE TABLE leads_consent_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_session_id uuid NOT NULL,
  consent_text_hash text NOT NULL,  -- SHA256 do texto exato aceito
  ip_address inet,
  user_agent text,
  channel text NOT NULL CHECK (channel IN ('web','whatsapp','app')),
  accepted_terms boolean NOT NULL,
  accepted_disclaimer boolean NOT NULL,
  created_at timestamptz DEFAULT now()
);
```

---

## 5. DISCLAIMER CLÍNICO DO RELATÓRIO

### 5.1 Cabeçalho obrigatório no topo do relatório AEC

> ⚕️ **AVISO IMPORTANTE — LEIA ANTES DE PROSSEGUIR**
>
> Este documento é uma **estruturação organizada das informações que você forneceu** durante a conversa com a Nôa Esperanza, baseada no método AEC (Arte da Entrevista Clínica) do Dr. Ricardo Valença.
>
> **Este documento NÃO É:**
> - ❌ Diagnóstico médico
> - ❌ Prescrição ou indicação de tratamento
> - ❌ Substituto de consulta médica presencial ou telemedicina
> - ❌ Avaliação clínica formal
>
> **Este documento PODE SER usado para:**
> - ✅ Levar a uma consulta médica como organização da sua história
> - ✅ Apoiar você na comunicação com profissional de saúde
> - ✅ Acompanhar sua jornada de cuidado de forma estruturada
>
> **Para diagnóstico, tratamento ou prescrição, é necessária consulta com profissional habilitado** (médico inscrito em Conselho Regional de Medicina — CRM).
>
> A MedCannLab não substitui o ato médico nem se responsabiliza por decisões clínicas tomadas com base exclusiva neste documento.

### 5.2 Rodapé obrigatório

> ---
> Documento gerado em [data] · Sessão [id] · Método AEC v[versão]
> MedCannLab Tecnologia em Saúde · CNPJ [XX.XXX.XXX/0001-XX] *(em registro)*
> Para esclarecimentos: contato@medcannlab.com.br
> Para exercer direitos LGPD: dpo@medcannlab.com.br

### 5.3 Já existe parcialmente

Verbatim First (V1.9.86) já remove "Impressão Clínica" e "Plano de Conduta" do narrador AEC. **Falta só** anexar este cabeçalho/rodapé no PDF/visualização.

### 5.4 Validação clínica

Texto deve ser revisado por:
1. Dr. Ricardo Valença (CRM responsável pelo método)
2. Dr. Eduardo Faveret (CRM neurologia)
3. Compliance médico (CFM + LGPD)

---

## 6. SPEC FAIL-CLOSED DO mode=anonymous

### 6.1 Princípio

Se decisão 1B mantida (reusar `tradevision-core`), o gate `mode=anonymous` **deve ser FAIL-CLOSED auditável**, não declarativo.

### 6.2 Implementação prevista

```typescript
// PRIMEIRA LINHA do handler em tradevision-core/index.ts
serve(async (req) => {
  const body = await req.json()
  const { mode, sessionId, message, ... } = body

  // GATE FAIL-CLOSED — antes de QUALQUER outra lógica
  if (mode === 'anonymous') {
    // 1. session_id obrigatório
    if (!sessionId || !isValidUuid(sessionId)) {
      return jsonResponse({ error: 'INVALID_SESSION' }, 403)
    }

    // 2. NUNCA aceitar user_id em modo anonymous
    if (body.userId || body.patientData?.user?.id) {
      await logSecurityEvent('anonymous_with_userid_attempt', { sessionId })
      return jsonResponse({ error: 'INVALID_PAYLOAD' }, 403)
    }

    // 3. Cap rígido por session_id (10 turns / 24h)
    const turnCount = await getTurnCount(sessionId, '24h')
    if (turnCount >= 10) {
      return jsonResponse({
        error: 'QUOTA_EXCEEDED',
        message: 'Pra continuar, [cadastre-se grátis e assine]'
      }, 200)
    }

    // 4. Rota separada do handler principal — não compartilha estado
    return handleAnonymousChat(body)  // função isolada
  }

  // Handler normal pra users autenticados
  return handleAuthenticatedChat(body)
})
```

### 6.3 Testes de regressão obrigatórios (executar antes de deploy)

```typescript
// 1. anonymous sem session_id
test('FAIL-CLOSED: anonymous sem sessionId retorna 403')

// 2. anonymous com user_id (tentativa de bypass)
test('FAIL-CLOSED: anonymous com userId retorna 403 e loga security event')

// 3. cap turns
test('FAIL-CLOSED: 11º turno em 24h retorna QUOTA_EXCEEDED')

// 4. isolamento de estado
test('FAIL-CLOSED: anonymous não acessa aec_assessment_state (só aec_anonymous_state)')

// 5. isolamento RAG
test('FAIL-CLOSED: anonymous não dispara RAG/embeddings')

// 6. isolamento de racionalidade
test('FAIL-CLOSED: anonymous não dispara rationality engine')
```

### 6.4 Quando NÃO usar 1B

Se algum dos 6 testes falhar OU não puder ser implementado com confiança, **mudar para 1A** (Edge Function nova `tradevision-anonymous-chat` totalmente separada).

---

## 7. PLANO DE EXECUÇÃO PÓS-CNPJ

### 7.1 Pré-requisitos pra começar

- ✅ CNPJ MedCannLab Tecnologia em Saúde Ltda registrado
- ✅ Texto LGPD revisado por advogado
- ✅ Disclaimer clínico revisado por Ricardo + Eduardo
- ✅ DPO definido + email funcional

### 7.2 5 commits cirúrgicos (~21-26h em 2-3 dias)

| # | Commit | Esforço | Smoke test |
|---|---|---|---|
| 1 | Schema: `lead_sessions`, `aec_anonymous_state`, `clinical_reports.lead_session_id`, `leads_consent_log` | 2h | INSERT manual + RLS test |
| 2 | Edge Function: `mode=anonymous` gate FAIL-CLOSED + 6 testes | 6-8h | Todos 6 testes passam |
| 3 | Frontend: `<MiniNoaChatAnonymous />` + termo LGPD modal | 4h | Chat funciona em /paciente |
| 4 | Cron cleanup leads (pseudonimização 7d + exclusão 30d) | 2h | Job executa em ambiente test |
| 5 | Magic link signup + linking `lead_session_id → user_id` + redirect aba pagamento | 4-5h | E2E lead → cadastro → pagamento |

### 7.3 Métricas de sucesso (pós-deploy)

```sql
-- Conversão SEO → cadastro
SELECT
  COUNT(*) FILTER (WHERE consent_accepted_at IS NOT NULL) AS leads_consented,
  COUNT(*) FILTER (WHERE relatorio_gerado = true) AS leads_with_report,
  COUNT(*) FILTER (WHERE converted_to_user_id IS NOT NULL) AS leads_converted
FROM lead_sessions
WHERE created_at > now() - interval '30 days';
```

---

## 8. ENQUANTO ESPERA CNPJ

### 8.1 O que ESTÁ funcionando (não mexer)

- Captura via cadastro tradicional + ConsentGuard
- 9 cadastros/7 dias (tração real)
- 3 landings SEO ativas (V1.9.120-B): `/paciente` `/medico` `/aluno`
- Meta tags por rota (useSEO hook)

### 8.2 Opção de ponte (se quiser destravar SEO antes do CNPJ)

**Opção C** (cadastro express modal nome+email → entra direto no chat real):
- Juridicamente mais simples (cadastro = consentimento explícito)
- ~3-4h de código
- NÃO tem o coração "relatório antes do cadastro"
- Funciona como ponte até CNPJ liberar

**Decisão pendente** Pedro: implementar Opção C agora OU esperar CNPJ pra Opção A completa.

---

## 9. RISCOS DOCUMENTADOS

| # | Risco | Mitigação |
|---|---|---|
| 1 | CNPJ demorar 6+ meses | Manter Opção C como ponte |
| 2 | Texto LGPD mal redigido = multa ANPD | Revisão advogado obrigatória |
| 3 | Disclaimer clínico fraco = ato médico ilegal | Revisão Ricardo + Eduardo + CFM |
| 4 | mode=anonymous vazar = exposição dado clínico | 6 testes FAIL-CLOSED + auditoria |
| 5 | 7 dias matar conversão | Pseudonimização 7d + retenção 30d (compromisso entre LGPD e remarketing) |
| 6 | WhatsApp futuro requerer outra arquitetura | Campo `channel` ENUM desde já + magic link compatível |

---

## 10. AUDITORIA DA DECISÃO DE NÃO CODAR AGORA

**Por que não codar agora (validação cruzada Claude + GPT):**

1. ✅ CNPJ é blocker jurídico real (não teórico)
2. ✅ Texto LGPD sem controlador formal = exposição PF
3. ✅ Disclaimer clínico fraco hoje = risco CFM
4. ✅ Spec FAIL-CLOSED não testada empíricamente = risco vazamento

**Princípios da memória aplicados:**
- AUDITAR 100% antes de qualquer mudança
- P9 — Não-uso ≠ não-precisa
- P10 — Substituição silenciosa de responsabilidade

**Decisão final 03/05/2026:**
- Manter captura atual funcionando (9 cadastros/7d)
- Documentar tudo (este arquivo)
- Esperar CNPJ
- Reavaliar Opção C como ponte se SEO trouxer demanda antes

---

**Frase âncora:**
> "Lead_free é a melhor ideia que apareceu no funil. Mas codar sem CNPJ + texto jurídico + disclaimer clínico + FAIL-CLOSED testado seria substituir governança por velocidade. Documenta hoje, executa quando proteção jurídica estiver pronta."
