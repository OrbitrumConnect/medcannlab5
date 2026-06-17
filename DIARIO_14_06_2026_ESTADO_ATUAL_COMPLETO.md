# 📓 DIÁRIO 14/06/2026 — ESTADO ATUAL COMPLETO (consolidação 11–14/06)

**Tipo:** snapshot de estado / retomada · **Autor:** Pedro + Claude Opus 4.8
**Período coberto:** 11–14/06 (pós-reunião CNPJ 10/06) · **HEAD:** `a07144f` (V1.9.643)
**Princípio:** honesto sobre o que é empírico vs stale. ⚠️ **PAT rotacionada desde 11/06** → números de banco são os **últimos verificados 10/06 (ATA)**, marcados *(10/06)*. Re-validar quando houver PAT nova.

---

## 0. RESUMO DE 1 PARÁGRAFO

Estamos no **Marco 1 (CNPJ)**, pré-PMF, **0 paciente externo pagante**. A semana 09–10/06 entregou: o sistema de **vínculo médico↔paciente sem AEC** (V1.9.633/634, meu) + a **cascata de atestado/CRM** da reunião (V1.9.635-643, laptop). A reunião com o contador Paulo (10/06) fechou o desenho fiscal (Split 70/30, Simples Anexo III, CNAE SaaS, NF intermediação). Falta **executar a abertura do CNPJ** (documentos dos 4 sócios + 4 decisões societárias) e os **fixes técnicos pendentes** (4 fases do CRM, smoke Ricardo, agendamento slot-picker). Código estável, locks 8 intocados, nada pra reverter.

---

## 1. ONDE ESTAMOS (macro)

| Marco | Estado |
|---|---|
| **Marco 1 — CNPJ + 1º pagante** | 🟡 EM ANDAMENTO — desenho fiscal fechado com Paulo (10/06); falta documentos + decisões + protocolo |
| Marco 2 — PMF (20–30 pagantes + 2º médico independente) | 🔴 não iniciado (depende Marco 1) |
| Marco 3 — escala (redes/prefeituras + Eduardo Ensino) | 🔴 não iniciado |
| PMF declarável | 🔴 0 paciente externo pagante |

**Sócios:** Pedro (CTO) · Ricardo (clínico/AEC) · João (institucional/CNPJ) · Eduardo (Ensino/Neuro). Eduardo operacional no app desde 27/05; ausente da reunião CNPJ.

---

## 2. O QUE FOI ENTREGUE (versões recentes — todas no ar)

### 2.1 Vínculo médico↔paciente sem AEC (meu, 09–10/06)
- **V1.9.633** — RPC `vincular_paciente_medico` (SECURITY DEFINER) grava `patient_professional_links` source=`self_link`. Botão "Vincular" deixa de forçar AEC/agendamento. Lado médico já lia via UNION (getAllPatients). Caso disparador: **Alexandre Magno Steglich** (self-registrado, invisível pro Ricardo).
- **V1.9.634** — modal de **escolha** ao Vincular (🩺 Vincular agora / 🧠 Fazer AEC) + **card de consentimento LGPD** (compartilha histórico do app) + **Desvincular** (só self_link, RLS permite delete do paciente).
- Princípio cristalizado: **"Vínculo ≠ Agendamento ≠ AEC"** (reforça REGRA HARD §1).

### 2.2 Cascata atestado/CRM (laptop, reunião 10/06)
- **V1.9.635** template ATESTADO MÉDICO dedicado · **V1.9.636** loader mapeia `notes` · **V1.9.637** fallback CRM (`crm‖council_number‖council_state`) · **V1.9.639** AuthContext lê council_* do banco · **V1.9.641** IntegrativePrescriptions lê `cfm_prescriptions` (era tabela órfã) + 5º card Atestado no Prontuário.
- **Causa-raiz:** Vitrine grava CRM em `users.council_*`, prescrição lia `users.crm` — não se conversavam. + `notes` só renderizava dentro de `medications.map()` (atestado tem medications=[] → corpo vazio).
- **Avaliação (minha, 11/06):** sólido, cirúrgico, zero-regressão, locks intactos, type-check passa na árvore mesclada. Nada pra reverter.

### 2.3 Documentos societários/fiscais
- `DOSSIE_CONTADOR_PAULO_09_06_2026.md` (entregue ao Paulo na reunião)
- `ATA_10_06_2026_REUNIAO_CNPJ_CONTADOR_PAULO.md`
- `DOCUMENTOS_ABERTURA_CNPJ_PAULO_11_06_2026.md` (checklist documentos — ⚠️ **ainda não commitado**, local)

---

## 3. ESTADO DO APP POR ÁREA *(números 10/06 — re-validar c/ PAT nova)*

| Área | Estado |
|---|---|
| **Clínica (AEC + Relatório + Agendamento)** | 🟢 core estável. Vínculo sem AEC novo. Agendamento ainda no modal manual (ver §4) |
| **Prescrição / Atestado** | 🟢 5 tipos + atestado dedicado. CRM corrigido só pro Ricardo (workaround); outros médicos no fallback |
| **Ensino (cursos/TRL)** | ❄️ latente (eixo Eduardo, pós-Marco 3) |
| **Pesquisa (fórum/casos)** | ❄️ latente |
| **Sidecars cognitivos** | Renal + Neuro + Sinais do Relato + Cannabis no Relato (coletores ativos, dashboards data-gated) |
| **Edge Functions** | 17 ativas, 16/17 verify_jwt=true *(10/06)* |
| **Cron jobs** | 3 (video-reminders OK · monthly-closing dormente · expire-renal) |
| **cfm_prescriptions** | 63 rows *(10/06)* |
| **Pagamento** | mock/demo — Stripe/MP não conectado (parqueado até CNPJ) |
| **Compliance técnico** | ICP-Brasil PBAD AD-RB real (48 relatórios assinados), RLS 100%, PII sanitizada (gap residual nome-do-meio) |

---

## 4. O QUE FALTA — pendências por prioridade

### 🔴 P0 — destrava Marco 1 (humano/societário)
- [ ] **Documentos pessoais dos 4 sócios** pro Paulo (RG+CPF, comprovante residência, certidão casamento, dados completos) — **incluir Eduardo** (ausente)
- [ ] **4 decisões da empresa:** (1) capital social, (2) **divisão das quotas** — ⚠️ resolver o pool de Tesouraria (Ltda não tem quota própria → recomendado 25% cada + pool no acordo), (3) endereço da sede + comprovante, (4) administrador
- [ ] **Pix R$350/sócio** (R$1.400) pra custo de abertura
- [ ] Protocolo CNPJ (Paulo executa)

### 🟡 P1 — técnico pendente (sem regressão, atacável já)
- [ ] **Fase 1–3 do CRM** (correção de raiz pros OUTROS médicos): alinhar Vitrine→`users.crm` + **backfill `council_state→crm`** (Fase 3 tira mais médicos do stopgap de uma vez) — **precisa PAT nova**
- [ ] **Smoke Ricardo** no Prontuário pós-V1.9.641 (aba Prescrição lista atestados? 5º card abre?)
- [ ] **Ricardo emitir NOVO atestado** pro Alexandre Magno (o `fb99247f` é imutável com CRM vazio — trigger correto, não mexer)
- [ ] **Smoke E2E vincular/desvincular** (Pedro testar em prod: clica Vincular → modal → vincula → "Seu Médico" → Desvincular)
- [ ] **Unificar agendamento** manual → slot-picker (o modal "Novo Agendamento" faz o paciente digitar data/hora; o slot-picker já existe no reagendamento + no chat). Recomendado: reusar slots na própria tela. **Aguarda meu OK do Pedro**

### 🟢 P2 — compliance pré-Marco 2
- [ ] PII residual `clinical_rationalities.assessment` (gap nome-do-meio)
- [ ] PITR + pgaudit (Supabase Pro) pra pacientes externos reais
- [ ] Advogado saúde digital (CFM/ANVISA/LGPD) — não contratado
- [ ] DPO + DPIA (dado sensível cannabis) — não formalizados
- [ ] WiseCare homolog → produção (provider vídeo)

### ⚪ Societário (próxima reunião, pós-CNPJ)
- [ ] Acordo cotistas **v2.1 RASCUNHO** → revisão advogado societário + saúde digital → assinatura 4 sócios
- [ ] 4 riscos jurídicos mapeados (expulsão R$1, non-compete 24m, take-rate vínculo, pool Tesouraria)
- [ ] Desmembrar Cláusula 2.1 (governança cognitiva do Pedro = autoral, simétrico ao Ricardo)
- [ ] Incluir Eduardo nas decisões fiscais/societárias assíncronas

---

## 5. DECISÕES HUMANAS QUE DESTRAVAM (~50% do roadmap)
1. **CNPJ João/Paulo** (Marco 1) → destrava pricing/recebimento/Stripe
2. **2º médico independente real** (Marco 2)
3. **20–30 pacientes externos pagantes** (PMF)
4. **Stripe Connect vs MP Marketplace** (adiado — validar c/ banco PJ)
5. **Eduardo Faveret** Manual v1.1 + uso regular (Marco 3)

---

## 6. RISCOS / ALERTAS ATIVOS
- **CRM fallback é stopgap** — só Ricardo corrigido; outros médicos saem via `council_*`. Fase 3 backfill resolve. Pré-Marco 2.
- **Atestado fb99247f imutável** com CRM vazio — Ricardo cria novo (trigger de imutabilidade está correto).
- **Empresa sem trava societária formal** (acordo v2.1 não assinado) — ok pré-PMF, bloqueador pra rodada externa.
- **PAT rotacionada** — sem cross-check empírico ao vivo até ter token novo.
- **Pool de Tesouraria** não cabe no contrato social de Ltda — resolver antes do protocolo.

---

## 7. ESTADO DO REPO
- HEAD `a07144f` (V1.9.643), local = amigo/main = medcannlab5/main. **Sincronizado.**
- Solto não-commitado: `DOCUMENTOS_ABERTURA_CNPJ_PAULO_11_06_2026.md` (decisão do Pedro: commitar ou manter local).
- Lixo ignorável: `_shot.mjs`, `vite.config.ts.timestamp`.
- **Locks 8 intocados.** type-check OK.

---

## 8. FRASE ÂNCORA
> **14/06/2026.** Pós-reunião CNPJ, semana quieta sem código novo. App estável no Marco 1: vínculo-sem-AEC + cascata atestado/CRM entregues e avaliados sem regressão. O gargalo agora é **humano/societário** — documentos dos 4 sócios + 4 decisões + Pix destravam o CNPJ; do lado técnico, as 4 fases do CRM, o smoke do Ricardo e a unificação do agendamento esperam. Nada pra reverter; tudo pra executar.

---

## 9. PRÓXIMO PASSO SUGERIDO (quando retomar)
1. **Mandar checklist de documentos pros 4 sócios** (texto pronto no `DOCUMENTOS_ABERTURA_CNPJ_PAULO_11_06_2026.md`)
2. **Decidir a divisão de quotas** (recomendo 25% cada + pool no acordo)
3. Com **PAT nova**: Fase 3 backfill CRM (`council_state→crm`) + re-validar os números
4. **Pedro smoke** vincular/desvincular + Ricardo smoke Prontuário/atestado
