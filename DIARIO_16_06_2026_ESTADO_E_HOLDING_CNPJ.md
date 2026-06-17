# 📓 DIÁRIO 16/06/2026 — Estado + holding pattern (esperando CNPJ)

**Tipo:** snapshot de estado / consolidação · **HEAD:** `a07144f` (V1.9.643) · **Período:** desde 14/06
**Contexto:** **sem código novo desde 10/06** (V1.9.643) — em compasso de espera do **Marco 1 (CNPJ)**. Foco da semana = documentos societários + BPlan + revisão de estado, não desenvolvimento.
**Princípio:** honesto sobre empírico vs stale. ⚠️ **PAT rotacionada desde 11/06** (Unauthorized) → sem cruzamento de banco vivo; números são os **últimos verificados 10/06**.

---

## 1. ONDE ESTAMOS

**Holding pattern consciente.** O app está estável e o gargalo é **humano/societário**, não técnico. Desde 10/06 não se mexe em código (e está certo) — o que destrava o roadmap agora é o **CNPJ** (documentos + decisões dos sócios + Pix), não mais features.

| Marco | Estado |
|---|---|
| Marco 1 — CNPJ | 🟡 em andamento (desenho fiscal fechado 10/06; falta executar) |
| Marco 2 — PMF (20-30 pagantes + 2º médico) | 🔴 depende Marco 1 |
| Marco 3 — escala | 🔴 |

---

## 2. O QUE TEMOS (assets)

### 2.1 Produto (código)
- App estável, HEAD `a07144f`, **type-check limpo**, repo 100% sincronizado (amigo + medcannlab5).
- **Locks 8 intocados.**
- Últimas entregas: vínculo sem AEC (V1.9.633/634) + cascata atestado/CRM (V1.9.635-643).
- 4 sidecars cognitivos · cockpit de triagem · Saúde Renal A/Cr KDIGO · prescrição/atestado com ICP-Brasil real.

### 2.2 Compliance técnico *(10/06)*
- ICP-Brasil PBAD AD-RB conforme ITI (48 relatórios assinados), RLS 100%, PII sanitizada (gap residual nome-do-meio).
- 17 Edge Functions (16/17 verify_jwt=true) · 3 cron jobs.

### 2.3 Documentos de negócio (esta semana)
- `DOSSIE_CONTADOR_PAULO_09_06` — entregue ao Paulo
- `ATA_10_06` — reunião CNPJ (Split 70/30, Simples Anexo III, CNAE SaaS)
- `DOCUMENTOS_ABERTURA_CNPJ_PAULO_11_06` — checklist documentos *(não commitado)*
- `DIARIO_14_06` — estado completo *(não commitado)*
- `BUSINESS_PLAN_15_06` — BPlan (CapEx/OpEx/EBITDA) *(não commitado)*

### 2.4 BPlan — o número que importa *(15/06)*
- **CapEx ~R$ 1.600** (a plataforma já existe = IP cedido, R$ 0 cash)
- **OpEx ~R$ 130/mês hoje** · ~R$ 700/mês pós-escala
- **Break-even ~25 pacientes pagantes = Marco 2** → *atingir PMF ≈ atingir break-even*
- Receita = 🔴 projeção (0 pagante real)

### 2.5 Memória
- **335 memórias** (188 project / 127 feedback / 11 reference / 6 audit / 2 user) + índice MEMORY.md (543 linhas).

---

## 3. O QUE PRECISAMOS

### 🔴 P0 — destrava Marco 1 (humano/societário)
- [ ] **Documentos pessoais dos 4 sócios** pro Paulo (incluir Eduardo, ausente na reunião)
- [ ] **4 decisões da empresa:** capital social · **divisão de quotas** (resolver pool de Tesouraria — Ltda não tem quota própria; recomendado 25% cada + pool no acordo) · endereço da sede + comprovante · administrador
- [ ] **Pix R$ 350/sócio** (R$ 1.400)
- [ ] Protocolo CNPJ (Paulo executa)

### 🟡 P1 — técnico (atrás de PAT e/ou CNPJ, não urgente)
- [ ] **PAT nova** — sem ela, sem cruzamento de banco, sem auditoria empírica, sem firmar custos do BPlan
- [ ] Fase 1-3 do CRM (backfill `council_state→crm` pros outros médicos) — precisa PAT
- [ ] Smoke Ricardo (Prontuário/atestado pós-V1.9.641) + novo atestado Alexandre
- [ ] Smoke vincular/desvincular (Pedro testar em prod)
- [ ] Unificar agendamento manual → slot-picker (aguarda meu OK)

### 🟢 P2 — compliance pré-Marco 2
- [ ] PII residual · PITR/DPO · advogado saúde digital · WiseCare homolog→prod

### ⚪ Societário (próxima reunião)
- [ ] Acordo v2.1 → revisão advogados → assinatura · desmembrar Cláusula 2.1 (autoria Pedro)

---

## 4. MEMÓRIA — estado

- **335 memórias.** Núcleos duráveis cobertos: Constituição/método · clínico/vertical (rim×cannabis) · estratégia/negócio · princípios meta.
- ⚠️ **Gap desde 10/06:** última memória é a do vínculo (V1.9.633). **Não cristalizados:** PAT rotacionada (fato operacional) + modelo financeiro (break-even≈Marco 2) + avaliação da cascata CRM.
- ⚠️ **MEMORY.md inchado** (543 linhas) — candidato a consolidação/poda das memórias de abril já superadas.

---

## 5. AUDITORIA — o que dá pra fechar sem PAT

| Dimensão | Sem PAT (local/repo) | Precisa PAT (banco vivo) |
|---|---|---|
| Sync repo | ✅ HEAD = remotos (a07144f) | — |
| Saúde código | ✅ type-check limpo | — |
| Locks | ✅ 8 intocados (commit-stat) | — |
| Custos reais (BPlan) | 🟡 estimativa | ❌ OpenAI agregado, nº usuários ativos |
| CRM dos médicos | — | ❌ quantos ainda no fallback |
| Receita/assinaturas | — | ❌ confirmar 0 real |
| PII residual | — | ❌ re-contar rows |

→ **Conclusão da auditoria local:** repo são, código são, nada pra reverter. A auditoria **empírica de banco está bloqueada pela PAT** — é a primeira coisa a destravar quando voltar a codar.

---

## 6. DOCS PENDENTES DE COMMIT
`DOCUMENTOS_ABERTURA_CNPJ_PAULO_11_06` · `DIARIO_14_06` · `BUSINESS_PLAN_15_06` · (+ este `DIARIO_16_06`). Decisão do Pedro: commitar o lote (4 refs) ou manter local.

---

## 7. FRASE ÂNCORA
> **16/06/2026.** Compasso de espera consciente: sem código há 6 dias, e está certo — o que destrava agora é o **CNPJ** (documentos dos 4 sócios + 4 decisões + Pix), não mais features. O que temos: app estável (locks intocados, type-check limpo), compliance técnico real, dossiê + ATA + BPlan prontos. O BPlan trouxe a sacada: **break-even ≈ Marco 2** (atingir PMF = pagar a operação). O que falta é humano (societário) e a **PAT nova** pra reabrir a auditoria empírica. Nada pra reverter; tudo pra executar do lado de fora do código.

---

## 8. PRÓXIMO PASSO SUGERIDO
1. **Mandar checklist de documentos pros 4 sócios** (texto pronto no `DOCUMENTOS_ABERTURA_CNPJ_PAULO_11_06`)
2. **Decidir divisão de quotas** (recomendo 25% cada + pool no acordo)
3. **Commitar o lote de docs** (4 refs) pra fechar o repo
4. Quando vier **PAT nova:** re-auditar banco + firmar custos do BPlan + Fase 3 CRM
