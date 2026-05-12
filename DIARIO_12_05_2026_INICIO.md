# 📓 Diário 12/05/2026 — Início do dia

**Autor:** Pedro Henrique Passos Galluf (CTO MedCannLab)
**Co-autor:** Claude Opus 4.7 (1M context)
**HEAD git ao iniciar dia:** `2072d18` (V1.9.231 selada na virada 11→12)
**Lock CORE intocado:** V1.9.95 + V1.9.97 + V1.9.98 + V1.9.99-B

---

## BLOCO A — Recap factual dos 3 últimos dias (09 → 11/05)

### Dia 09/05 — Virada para execução + Freeze estrutural
- Blueprint Ciclo Fechado v2 cristalizado (5 estágios, 3 gaps, 9 decisões clínicas)
- Princípio 48: **Freeze de análise estrutural até 16/05/2026** (ROI decrescente após 4 iterações pré-PMF)
- Princípio 49: **Gap operacional humano nos 3 gates duros 60d** (CNPJ + Ricardo + Muhdo)
- Princípios 50-51: ACDSS catalogado como fóssil decomposto; sistema real > sistema abstrato
- 3 ações externas próximas 72h identificadas (~50min totais): contador CNPJ, Ricardo A4+caneta, Muhdo D+1

### Dia 10/05 — Sprint 1 Devolution DEPLOYED + Tier S hardening
- **11 commits push 4 refs em 24h**
- V1.9.200 Sprint 1 backend (ciclo médico→paciente)
- V1.9.201 Tier A polish, V1.9.202 selo visual
- 3 riscos regulatórios eliminados:
  - V1.9.203 ACDSS hide
  - V1.9.206 mock Pesquisa
  - V1.9.207 banner CRM + UF signup CFM 2.314
- V1.9.204 fix Carolina, V1.9.205 Tier S hardening
- V1.9.208 view `v_clinical_cycle_health` (KPI Muhdo D+7 closed-loop=0% honesto)
- V1.9.209 Promise.all + Sentry observabilidade

### Dia 11/05 — Sessão cirúrgica empírica (Pedro paciente + Ricardo Carolina)
- 6 commits sessão dirigida por uso real
- V1.9.214 card redundante removido
- V1.9.215 timeout/telemetria/paralelo (introduziu regressão própria)
- V1.9.216 corrigiu regressão (wording + msg-por-fase + SMART_SCHEDULING_GUARD validado 5×)
- V1.9.217 timezone Edge 7 fixes
- V1.9.218 verbatim "O que mais?" COMPLAINT_DETAILS
- V1.9.219 datas appointments client (split ISO)
- V1.9.220+221 paradores "soisso" + consensus "isso"
- V1.9.222 ARQ-1 médico-alvo dado de 1ª classe (6 arquivos, 90 LOC)
- V1.9.223 email regex signup
- V1.9.224 is_remote=true default scheduling
- V1.9.225-227 reviewStatus mapping + Validados + idempotência CFM 2.314
- DELETE 3 rules duplicadas Ricardo (audit JSON parqueado)
- **Track record honesta:** V1.9.215 introduziu regressão própria, corrigida V1.9.216 mesmo dia
- Telemetria validada: RATIONALITY é gargalo real (16-20s, 55% latência), não cleanup_pass
- Princípios 52-55 cristalizados (dry-run mental / 5 perguntas pré-classificar / cross-impact registry / governance Pedro×Ricardo)

---

## BLOCO B — Sessão virada 11→12 (este diário)

### Plano "cadeado AEC triple-A escalável" executado

Pedro perguntou tirando Stripe/CNPJ o que precisa pra app ficar selado igual cadeado AEC. Eu mapei 4 itens auto-executáveis + 2 bloqueados em humanos externos. Executamos os 4 com push 4 refs sem regressão.

| Versão | Item | Resultado |
|--------|------|-----------|
| **V1.9.228** | Backfill is_remote em appointment futuro órfão (Cristiano) | 1 UPDATE empírico; Cristiano agora recebe reminders 24h/1h/30min/10min/1min |
| **V1.9.229** | Signup profissional obrigatório fee+specialty + trigger persiste council | Migration handle_new_user lê council_*+fee da metadata; Landing.tsx valida obrigatório; AuthContext propaga 9º param |
| **V1.9.230** | Cleanup IMRE/ACDSS fossil | 5 arquivos deletados (~1500 LOC), App.tsx Route → Navigate redirect, rotasIndividualizadas.ts ajustado. **33 erros TS → 0** |
| **V1.9.231** | ICP-Brasil em patient_exam_requests | Migration 7 colunas ICP, Edge digital-signature com `documentType` param backward-compat, ExamRequestModule.tsx +275 LOC (banner+watermark+idempotência), Edge deployed via PAT |

### Sub-aprendizados/correções desta sessão

1. **Memória "34/35 medical_certificates DRAFT" estava ERRADA** — `medical_certificates` é tabela de **certificados ICP do médico em si** (PFX uploads), não atestados. Atestado vive em `cfm_prescriptions.prescription_type='attestation'`.
2. **"8 médicos nunca prescreveram" NÃO É problema** — Pedro corrigiu 2× → métrica de uso ≠ bug operacional. Cristalizado em `feedback_metrica_uso_nao_e_problema_11_05.md`.
3. **Conferir UI real antes de propor estrutura nova** — Pedro mostrou screenshot da Vitrine Profissional já com campo CRM; eu havia proposto adicionar council_type/council_number separados; **revertido antes de commit**. Cristalizado em `feedback_conferir_ui_antes_de_propor_11_05.md`.
4. **ICP-Brasil escopo Ricardo expandido** — aplica a TODOS docs médicos (laudos+atestados+prescricoes+solicitação exames), não só prescrições. Cristalizado em `project_icp_brasil_escopo_total_ricardo_11_05.md`.

### Status empírico ICP-Brasil ao virar o dia

- Ricardo tem **1 cert ativo** (DigitalSign, expira 06/05/2027)
- **38 docs assinados com ICP** pelo Ricardo: 7 prescriptions + 31 reports AEC
- 5 das 7 prescriptions em PKCS#7 REAL (.pfx via V1.9.176)
- 2 prescriptions antigas (31/01) em modo simulação pré-V1.9.176
- 31 reports AEC com signature_hash via Pipeline V1.9.95 (100% sign rate desde 26/04)
- **26 NFTs** geradas (V1+V2+V2_fallback+V3_LLM), 18 com signature_hash, 100% ligadas a reports
- ~14 NFTs com hash idêntico ao report ICP-Brasil (resto re-assinou depois — timeline natural)

---

## BLOCO C — Gaps cristalizados (estado atual, sem inflar)

### Camada 0 (risco irreversível, prioridade absoluta)
- **3 widgets AEC paralelos** — 1 eliminado via V1.9.230 (ClinicalAssessment.tsx órfão). **2 restantes pra mapear** quando paciente externo entrar.

### 🔴 Bloqueio empírico de PMF (gates duros 60d)
- **KPI Muhdo closed-loop = 0%** — Sprint 1 backend deployed em 10/05, mas 0 reports approved até agora. **Bloqueador é humano:** Ricardo+Eduardo precisam aprovar ≥3 reports em 7 dias pra mover KPI.
- **CNPJ formal** — não movido. Bloqueia Stripe/MP, WhatsApp Business, bling/dom contador.
- **Muhdo D+1 email** — pendente desde 08/05. Linha-âncora "biological×semantic drift CKD" pronta.

### 🟡 Adoção operacional (não código)
- **9/10 médicos sem PFX ICP-Brasil upload** em `medical_certificates`. Edge `digital-signature` retorna "Configurar certificado" → médico não consegue assinar. **Onboarding humano** pendente.
- **13 `patient_exam_requests` ainda em draft (0 signed)** — V1.9.231 acabou de subir Edge+UI. Aguarda Ricardo testar 1ª assinatura empírica do tipo novo.
- **Onboarding profissional V1.9.229** ainda **não foi exercido empíricamente** — nenhum médico novo cadastrou após deploy (10/05+). Validação requer próximo signup.

### 🟢 Decisões humanas pendentes (1-pager Ricardo)
- Formula scoring (375/381 ai_assessment_scores hardcoded em 1.5)
- V16 RIM aprovação (PR pronta desde 07/05, anti-kevlar §1 ativo até autorização)
- Bug 3 (anoite), Bug 6 ("O que mais?" cap), RATIONALITY async, UX-4
- Onboarding 9 médicos, button workflow, 3 emails jornada

### ⚪ Ruído estrutural (deixou de existir hoje)
- ~~33 erros TS baseline~~ → V1.9.230 zerou
- ~~Cristiano sem reminders~~ → V1.9.228 corrigiu
- ~~Signup pro sem fee/specialty obrigatório~~ → V1.9.229 corrigiu
- ~~exam_requests sem ICP~~ → V1.9.231 corrigiu

---

## BLOCO D — Próximos passos sugeridos (sua decisão)

### Hoje pode (sem bloqueio externo)
1. **Item 4 audit** — mapear os 2 widgets AEC paralelos restantes (~1h só audit, sem código)
2. **Testar empíricamente V1.9.231** — pedir Ricardo assinar 1 exam_request pra validar fluxo end-to-end
3. **Onboarding profissional V1.9.229 dogfood** — cadastrar conta teste profissional novo, validar fluxo signup obrigatório
4. **Item 5 decisões 1-pager Ricardo** — gerar a 1 página A4 enxuta pra Ricardo aprovar 11 itens

### Esperando gate externo
- Stripe + CNPJ (você)
- Aprovações Ricardo (V16, formula scoring, 6 reports approved)
- Email Muhdo D+1

### Freeze ativo (Princípio 48)
- Não criar blueprint v3
- Não criar nova memória estrutural
- Ideias estruturais novas vão pra `IDEIAS_PARKED_PARA_DEPOIS_SPRINT1.md`
- Freeze vigora até **16/05/2026** ou Sprint 1 medindo

---

## Frase âncora do dia

> **"Cadeado AEC virou cadeado APP. Os 4 itens auto-executáveis viraram 4 versões com push 4 refs sem regressão. O que falta agora não é código — é Ricardo aprovar, CNPJ existir, e médico subir PFX."**

---

**Estado ao iniciar 12/05:**
- HEAD `2072d18` selado
- type-check 0 erros
- 4 versões V1.9.228+229+230+231 deployadas
- CORE intocado
- Janela ~50 testers preservada
- Aguarda movimento humano nos 3 gates duros
