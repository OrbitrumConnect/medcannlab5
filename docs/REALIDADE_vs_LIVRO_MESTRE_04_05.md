# REALIDADE OPERACIONAL × LIVRO MESTRE
**Data:** 04/05/2026
**Cruza:** Banco (Supabase) + Código (App) + Decisões (LIVRO_MESTRE_v1.0)
**Objetivo:** ver o que realmente está pronto vs o que precisa ajustar

---

## 1. SNAPSHOT EMPÍRICO ATUAL (auditado via Supabase API)

### 1.1 Usuários

```
Total:                        37
Últimos 7 dias:               7  (tração ativa)
Pacientes:                   23
Profissionais:                9
Admins:                       5
Pacientes pagantes externos:  0  (pré-PMF confirmado)
```

### 1.2 Atividade clínica

```
Reports gerados:             95
Reports signed:              18 (após V1.9.95 Pipeline ativar 26/04)
Reports unsigned legacy:     77 (histórico pré-Pipeline)
AECs completas ATIVAS:        0  ⚠️ (todas invalidated pelo V1.9.57)
Appointments total:          70
Appointments completed:       3
Appointments cancelled:      35  (50% — V1.9.123-A medindo efeito)
Prescrições CFM:             34
```

### 1.3 Receita / Pagamento

```
Transações completed:         0  (zero pagamentos reais em prod)
Subscriptions ativas:         0
```

### 1.4 Cursos (cluster educacional)

```
Total cadastrados:            6
PUBLICADOS (visíveis):        2
  • Pós-graduação Cannabis Medicinal — preço R$ 0,00 (grátis)
  • Cidade Amiga dos Rins — preço R$ 0,00 (grátis)

NÃO publicados (potencial receita parada):  4
  • Pós-Graduação Cannabis Medicinal — R$ 2.999,90
  • Arte da Entrevista Clínica — R$ 299,90
  • Sistema IMRE Triaxial — R$ 199,90
  • Introdução à Cannabis Medicinal — R$ 99,90

Enrollments existentes:      12
```

### 1.5 Infraestrutura técnica

```
Tabelas no banco:           161
Functions SQL:              341
RLS policies:               432
Edge Functions ativas:        9
  • tradevision-core
  • digital-signature
  • wisecare-session
  • extract-document-text
  • send-email
  • video-call-request-notification
  • video-call-reminders (V1.9.123-A em prod)
  • google-auth (half-impl)
  • sync-gcal (half-impl)
```

---

## 2. CRUZAMENTO COM LIVRO MESTRE — onde alinha vs onde precisa ajustar

### 2.1 ✅ ALINHADO (não mexer)

| Item | Status |
|---|---|
| Pipeline V1.9.95 + Verbatim First V1.9.86 | ✅ funcionando, ~46% bypass |
| Lock V1.9.95+97+98+99-B | ✅ preservado |
| 8 camadas governança | ✅ ativas |
| 9 Edge Functions | ✅ deployadas |
| ConsentGuard LGPD | ✅ funcionando |
| Email Resend production-locked | ✅ desde 28/04 |
| 3 landings SEO ativas | ✅ /paciente /medico /aluno |
| V1.9.123-A lembretes 24h+1h | ✅ em prod, cron rodando |
| Cap table simétrico (Regra de Ouro) | ✅ princípio aceito |
| Caminho B simplificado | ✅ decidido por unanimidade |

### 2.2 ⚠️ DESALINHADO (precisa decisão)

| # | Banco/App | LIVRO MESTRE | Ação |
|---|---|---|---|
| 1 | 3 planos "Med Cann 150/250/350" no banco | Landing diz R$60/149/99 | Limpar pós-CNPJ + cadastrar planos certos |
| 2 | 4 cursos pagos NÃO publicados (R$99-2999) | Cursos previstos como receita | **Decisão: publicar 1-2 antes do CNPJ?** |
| 3 | CAR cadastrado como curso GRÁTIS R$0 | LIVRO MESTRE: "CAR é projeto Ricardo, não receita MedCannLab" | ✅ Já alinhado (curso grátis = divulgação) |
| 4 | 0 AECs completas ativas (todas invalidated) | Maria Helena 03/05 era pra ser caso golden | 🔴 **Bug Carolina afeta Maria também — Fix #1 P0** |
| 5 | 0 transações pagas | Receita esperada R$60+ via SaaS | Bloqueado: precisa CNPJ + MP/Stripe |
| 6 | 50% appointments cancelados | V1.9.123-A está medindo | ✅ Em medição (7-30 dias) |
| 7 | 95 reports total mas só 18 signed | Pipeline 100% sign rate desde 26/04 | ✅ 77 unsigned são legacy pré-Pipeline (não bug) |
| 8 | 161 tabelas, 341 functions, 432 policies | Pré-PMF (37 users) | ⚠️ Infra desproporcional ao uso (não mexer agora) |

### 2.3 🔴 BLOQUEADORES REAIS (não dependem de código)

| # | Bloqueador | Quem | Status |
|---|---|---|---|
| 1 | CNPJ MedCannLab Tecnologia em Saúde Ltda | Pedro + Paulo (despachante) | Mensagem pronta, falta enviar |
| 2 | Acordo de quotistas v2.0 assinado | 4 sócios + advogado | Mensagem pronta, falta enviar |
| 3 | Gateway pagamento (MP ou Stripe) | Pós-CNPJ ativo | Bloqueado por #1 |
| 4 | INPI IMRE 3 classes | Pós-CNPJ + agente PI | Bloqueado por #1 |
| 5 | Termo LGPD final + disclaimer clínico | Advogado + Ricardo+Eduardo | Bloqueado por #1+#2 |

---

## 3. FOCO PRÁTICO — 5 AÇÕES REAIS HOJE/ESTA SEMANA

### Ação 1 — Pedro envia mensagem Paulo (atualizada simplificada)

```
Status: pendente
Pré-requisito: confirmar capital social R$ 5k vs R$ 10k
Arquivo: docs/MENSAGEM_ADVOGADO_E_PAULO_04_05_2026.md
⚠️ Atualizar: remover CNAE médico/AFE/alvará da pauta (Caminho B simplificado)
Tempo: 30 min
```

### Ação 2 — Pedro envia mensagem advogado

```
Status: pendente
Pré-requisito: identificar 2-3 candidatos (KLA/Cescon Barrieu/Bichara)
Escopo: societário + LGPD + INPI + cláusula PR (João/1Pure)
Tempo: 1h
```

### Ação 3 — Fix Carolina state inconsistente (BUG REAL)

```
Status: 🔴 P0 — afeta Maria Helena também (0 AECs completas no banco)
Arquivo: src/lib/clinicalAssessmentFlow.ts (UPDATE em invalidated_at)
Fix #1 cirúrgico: 5min SQL + audit code path 1h
Risco regressão: zero (cirúrgico)
Memória: project_aec_residual_state_25_04 (família já mapeada)
```

### Ação 4 — Aguardar smoke V1.9.123-A Maria Helena

```
Status: passivo
Janela: 05/05 14-16h BRT
O que medir: lembrete 24h dispara? Email chega?
Sem ação humana necessária (cron + Resend já rodando)
```

### Ação 5 — João envia AFE 1Pure (preparação parceria futura)

```
Status: pendente João
Pré-requisito: documentação 1Pure (AFE + lista produtos com nº ANVISA)
Não bloqueia CNPJ — pode rodar em paralelo
```

---

## 4. O QUE NÃO FAZER AGORA (lista de "não inventar")

```
❌ Atacar V1.9.121 antes de Ricardo aprovar visual
❌ Codar lead_free anônimo (espera CNPJ + advogado + termos)
❌ Criar Clínica MedCannLab Saúde adicional (não precisa pré-PMF)
❌ Adicionar CNAE médico (não precisa, CAR não é da empresa)
❌ Adicionar 8630-5/03 ou alvará sanitário (idem)
❌ Mexer em planos/cursos legacy do banco (espera MP/Stripe)
❌ Limpar 161 tabelas / 341 functions (over-engineering)
❌ Fundir empresa do Ricardo (caminho A descartado)
❌ Auditar Consultório do Valença (caminho A descartado)
❌ Criar features novas (foco em conversão, não em escopo)
❌ Atacar 3 Edge functions half-impl (google-auth, sync-gcal, etc)
```

---

## 5. PERGUNTAS REAIS PRA TOMAR DECISÃO

### Pergunta 1 — Publicar cursos pagos antes do CNPJ?

```
Hoje:
  4 cursos pagos cadastrados mas NÃO publicados
  R$ 99,90 + R$ 199,90 + R$ 299,90 + R$ 2.999,90

Opção A: publicar AGORA
  → Mostra catálogo + preço como vitrine
  → Captura interesse pré-CNPJ
  → ❌ Mas NÃO PODE COBRAR sem MP/Stripe ativo (bloqueio CNPJ)
  → Risco: prometer e não entregar = quebra confiança

Opção B: publicar JUNTO COM gateway pagamento (pós-CNPJ)
  → Marketplace funcional desde dia 1 da cobrança
  → ✅ Lançamento limpo
  → Espera ~30 dias

Recomendação: Opção B (esperar pós-CNPJ)
```

### Pergunta 2 — V1.9.121 fases 0-2 sem ainda Ricardo OK visual?

```
Estado: fases 0-2 autorizadas pelo selo quíntuplo
        fases 3-6 aguardam Ricardo aprovar visual de 0-2 deployado

Opção A: codar fases 0-2 agora (~2-3h, risco baixo)
  → Deploy detector + UI hint sem onClick
  → Ricardo testa em prod, aprova ou ajusta
  → Depois: fases 3-6

Opção B: aguardar Ricardo validar mockup textual primeiro
  → Sugestão GPT-Ricardo na memória
  → Sem código, só descrição
  → Ricardo aprova/ajusta → aí coda

Recomendação: Opção B (alinhamento humano antes de código)
```

### Pergunta 3 — Fix Carolina agora ou aguardar?

```
Estado: state Carolina ressuscitado, MAS visível afeta dashboard pós-AEC
        0 AECs completas ativas no banco — pode ser sintoma sistêmico

Opção A: Fix #1 cirúrgico hoje (5 min SQL)
  → Resolve caso visível
  → Audit code path UPDATE 1h em paralelo
  → Risco regressão: zero

Opção B: Aguardar mais ocorrências pra mapear padrão
  → Mais empírico
  → Mas Maria Helena já é caso novo (mesma família?)
  → Pode acumular casos

Recomendação: Opção A — Fix #1 imediato (cirúrgico, sem regressão)
```

---

## 6. AGENDA DA SEMANA (proposta)

```
SEGUNDA (05/05):
  ☐ Pedro confirma capital social
  ☐ Pedro atualiza + envia mensagem Paulo
  ☐ Smoke V1.9.123-A passivo (Maria 14-16h)

TERÇA (06/05):
  ☐ Pedro envia mensagem advogado (3 candidatos)
  ☐ Fix #1 Carolina cirúrgico (autorizado?)

QUARTA (07/05):
  ☐ Aguardar Paulo respostas
  ☐ João envia documentação 1Pure

QUINTA-SEXTA:
  ☐ Reunião 4 sócios alinhamento CNPJ
  ☐ Decidir advogado entre 3 candidatos
```

---

## 7. RESUMO HONESTO — onde estamos vs onde queremos

```
🟢 ESTAMOS BEM:
  • App estável, Pipeline 100% sign rate
  • Lembretes 24h+1h em prod
  • 9 cadastros últimos 7 dias (tração)
  • 6 documentos canônicos selados
  • Decisão estrutural unânime (Caminho B simplificado)

🟡 PRECISAMOS:
  • CNPJ ativo (bloqueador #1)
  • Acordo quotistas assinado (bloqueador #2)
  • Gateway pagamento (bloqueador #3 — depende CNPJ)
  • Fix Carolina cirúrgico (bug ativo)

🔴 NÃO PRECISAMOS:
  • Mais features
  • Mais documentação estratégica
  • CAR como bloqueador
  • Estrutura empresarial complexa
  • Gastos pré-PMF além do mínimo
```

---

## 8. FRASE ÂNCORA OPERACIONAL

> **"Banco mostra 37 users + 0 receita. App mostra Pipeline funcionando. LIVRO MESTRE diz Caminho B + 4 sócios iguais. As 3 leituras convergem em 5 ações práticas: enviar Paulo + advogado, fix Carolina cirúrgico, smoke passivo Maria Helena, João envia 1Pure. Tudo o resto fica em standby até CNPJ destravar."**
