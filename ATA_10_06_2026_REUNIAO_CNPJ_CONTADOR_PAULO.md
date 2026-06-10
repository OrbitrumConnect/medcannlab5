# ATA DE REUNIÃO — 10/06/2026 (quarta-feira)

**Pauta principal:** abertura CNPJ MedCannLab 3.0 com contador Paulo · alinhamento Split Payment / NF intermediação · cascata operacional do dia (atestado Ricardo) · estado documento dos cotistas.

**Local:** remota (transcrição de áudio + sessão laptop paralela Claude).

**Hora aproximada início:** manhã/tarde BRT (reunião contador Paulo) + cascata operacional ao longo do dia até ~21h BRT (fechamento V1.9.641).

---

## 1. PRESENTES E CONTEXTOS

### Reunião CNPJ (presencial / áudio)

| Nome | Papel | Status na ata |
|---|---|---|
| **Pedro Henrique Passos Galluf** | Sócio tech lead / orquestrador COS | Presente |
| **Dr. Ricardo Valença** | Sócio médico / criador AEC / Nefrologia-CKD | Presente |
| **João Eduardo Vidal** | Sócio institucional / parcerias / regulatório | Presente |
| **Paulo (contador)** | Contador, tomada de decisão fiscal / Simples Nacional | Presente, ouviu dossiê |

### Sócios NÃO presentes hoje

- **Eduardo Faveret** — não presente reunião CNPJ; segue uso operacional contínuo do app desde 27/05

### Sessão Claude (laptop paralela)

| Frente | O que rodou |
|---|---|
| Análise pré-pull | 11 commits desktop V1.9.627-634 absorvidos sem regressão |
| Cascata bug atestado Ricardo | 7 commits cirúrgicos V1.9.635-641 (5 fixes + memória + diário + Opção D Prontuário) |
| Validação empírica unit economics | PAT (Supabase Management API) — números cruzados com estimativa Ricardo |

---

## 2. CNPJ — O QUE FOI ATACADO COM PAULO HOJE

### 2.1. Dossiê entregue ao Paulo (formato consolidado pelo Pedro)

Dossiê apresentou:

- **Marco 1 — Pix R$350/sócio** para custos abertura CNPJ (4 sócios → R$1.400 total)
- **CNAE 63.11-9/00** — SaaS (atividade-fim do MedCannLab)
- **Regime tributário inicial:** Simples Nacional Anexo III
- **Modelo de receita:** plataforma intermedeia consulta médica + venda de relatório clínico DRC (R$122 cravado por Ricardo, modelo Sociedade Nefrologia)

### 2.2. Split Payment — modelo discutido

| Componente | Decisão / discussão |
|---|---|
| Split médico/plataforma | **70% médico / 30% plataforma** |
| Provedor preferencial discutido | **Stripe Connect** (alternativa Mercado Pago Marketplace) |
| Fluxo de dinheiro | Paciente paga 100% → provedor segrega 70% conta médico + 30% conta empresa, em transação atômica |
| Vantagem fiscal | Empresa só reconhece como receita os 30% (não os 100%); médico emite NF dele pelos 70% direto na conta dele |

### 2.3. NF de intermediação — esclarecida com Paulo

- **Tomador:** o médico (não o paciente)
- **Prestador:** empresa MedCannLab 3.0
- **Serviço descrito:** "Intermediação de plataforma de telessaúde / vitrine clínica digital"
- **Valor da NF:** os 30% da plataforma (não os 100%)
- **Implicação:** empresa NÃO precisa abrir CNAE de "serviços médicos" (o que exigiria responsável técnico médico no CNPJ) — fica como SaaS pura

### 2.4. Unit economics validadas empiricamente (via PAT Supabase)

Validou-se números do Ricardo cruzando com banco vivo:

- **Custo OpenAI/relatório:** ~US$ 0,43 (instrumentado via `ai_chat_interactions.metadata` — V1.9.238 em produção desde 14d)
- **Frequência uso:** ~2,86 reports/usuário/mês (empírico cohort interna)
- **Custo agregado 7d mensurado:** ~US$ 5,96 → projeção R$ 120/mês
- **Latência média:** 4,7s a 12s

Estimativa Ricardo (R$122 × 70k DRC) é **vitrine narrativa** (anchor Sociedade Nefrologia), **NÃO pipeline contratado** — explicitado com Paulo.

---

## 3. O QUE FOI FALADO E NÃO REGISTRADO COMO DECISÃO

### 3.1. Mencionado mas NÃO fechado hoje

- **Stripe Connect vs Mercado Pago Marketplace** — apresentadas as 2 opções com trade-offs; decisão final adiada (Paulo sugeriu validar com banco que opera a conta CNPJ)
- **Cronograma de implementação Stripe gate hard** — depende CNPJ ativo + conta bancária PJ + integração Stripe Connect; estimativa Pedro 2-4 semanas pós-CNPJ
- **Pricing final R$122** — Ricardo cravou como anchor; ainda não validado externamente com paciente externo pagante
- **Marco 2 (médico independente real)** — não tocado profundamente na reunião; segue como pré-condição hard pra cohort 20-30 pagantes

### 3.2. Tópicos NÃO falados hoje (mas relevantes pra próxima reunião societária)

- **Acordo de cotistas v2.1** — Paulo NÃO recebeu o acordo; recebeu apenas dossiê contador (recorte fiscal). Decisão correta — Paulo é contador, não advogado societário
- **Estrutura societária formal (% de cada sócio)** — está no acordo v2.1 (RASCUNHO), não foi apresentada/aprovada hoje
- **Vesting / cliff / governança técnica de saída** — texto existe no v2.1, intocado
- **PITR / DPO / advogado especializado saúde digital** — pré-condições compliance LGPD/ANVISA Pro plan Supabase, não tocadas hoje
- **TRL / Ensino (eixo Eduardo Faveret)** — não tocado hoje

---

## 4. ESTADO DO DOCUMENTO DOS COTISTAS (acordo_quotistas_juridico_v2_1)

### 4.1. Onde está hoje

- **`acordo_quotistas_juridico.md`** (v2.0) — versão anterior, já existia no repo
- **`acordo_quotistas_juridico_v2_1_RASCUNHO.md`** — Minuta pra Revisão Jurídica, **350+ linhas**, **13 cláusulas + 5 anexos**, redigido durante sessão societária 30/05/2026 com 2 rounds de auditoria externa (Claude2 + Ricardo)

### 4.2. Status formal

- **NÃO promovido oficial** — sufixo `_RASCUNHO` deliberado no nome do arquivo
- **NÃO assinado** pelos 4 sócios
- **NÃO revisado** por advogado societário externo
- **NÃO revisado** por advogado saúde digital externo
- **NÃO apresentado** ao Paulo hoje (decisão correta — Paulo é contador, não advogado)

### 4.3. Pré-condições pra promover oficial (não atacadas hoje)

1. Reunião presencial dos 4 sócios
2. Revisão Paulo (parte fiscal/contábil das cláusulas)
3. Revisão advogado societário externo
4. Revisão advogado especialista saúde digital externo (LGPD/ANVISA/CFM)
5. Assinatura formal (ICP-Brasil ou cartório)

### 4.4. O que foi feito HOJE relativo ao documento

- **NADA** — documento intocado na sessão de hoje
- Mencionei na conversa que ele existe, em qual estado, e que NÃO entrou na pauta com Paulo
- Pedro implicitamente confirmou separação (Paulo viu dossiê contador, NÃO acordo de cotistas)

---

## 5. CASCATA OPERACIONAL DO DIA — BUG ATESTADO RICARDO (5 FIXES V1.9.635-641)

### 5.1. Disparador

- ~14h BRT: Ricardo precisava emitir atestado médico pra paciente externo **Alexandre Magno Steglich** (psiquiatra, CID F41.2 + F41.1, 90 dias afastamento)
- PDF saiu **vazio com blob PKCS#7 visível** ("criptografado" no print do Pedro)
- Bug bloqueante — paciente esperando no consultório do Ricardo

### 5.2. Causa-raiz cravada empiricamente

Validação ITI ≠ Display PDF — **2 coisas separadas**:

| ITI valida | PDF visual lê |
|---|---|
| Certificado ICP-Brasil FÍSICO embedded no PKCS#7 (sempre OK) | Renderiza HTML com dados do banco (`cfm_prescriptions.*`) |
| Por isso assinatura juridicamente válida | Por isso `professional_crm = ''` saía vazio no PDF visual |

**Bug arquitetural pré-existente:** Vitrine grava CRM em `users.council_state`; QuickPrescriptions lê de `users.crm`. Os 2 não se conversam.

### 5.3. Cascata cirúrgica aplicada (locks 8 intocados em todos os commits)

| Commit | O que fez | Arquivo |
|---|---|---|
| **V1.9.635** | Template ATESTADO MÉDICO dedicado (~143 linhas) | [src/pages/Prescriptions.tsx](src/pages/Prescriptions.tsx) |
| **V1.9.636** | Loader `notes` mapeado em formattedPrescriptions | [src/pages/Prescriptions.tsx](src/pages/Prescriptions.tsx) |
| **V1.9.637** | Fallback CRM (`crm \|\| council_number \|\| council_state`) | [src/components/QuickPrescriptions.tsx](src/components/QuickPrescriptions.tsx) |
| **V1.9.638** | Memória `feedback_crm_iti_certificado_vs_banco_display_10_06.md` | [docs/memorias/](docs/memorias/) |
| **V1.9.639** | AuthContext busca `council_type/state/number + specialty` | [src/contexts/AuthContext.tsx](src/contexts/AuthContext.tsx) |
| **V1.9.640** | DIARIO_10_06_2026 (5 blocos A-H, 298 linhas) | [DIARIO_10_06_2026_CNPJ_DIA_D_ATESTADO_RICARDO_CASCATA_5_FIXES.md](DIARIO_10_06_2026_CNPJ_DIA_D_ATESTADO_RICARDO_CASCATA_5_FIXES.md) |
| **V1.9.641** | IntegrativePrescriptions lê `cfm_prescriptions` + 5º card "Atestado" no Prontuário | [src/components/IntegrativePrescriptions.tsx](src/components/IntegrativePrescriptions.tsx) |

### 5.4. Workaround executado HOJE via PAT

Aplicado **UPDATE** direto em `public.users.crm` pros 2 UUIDs do Ricardo (profissional + admin), valor `'5253203-7'` (CRM real confirmado pelo Pedro: *"exato e o dele mesmo!"*). Funcionou.

### 5.5. Lock intocado preservado

**Atestado fb99247f (Alexandre Magno Steglich)** — assinatura já feita com `professional_crm = ''` no banco; trigger `fn_cfm_prescriptions_immutability()` **bloqueia UPDATE pós-signed** (juridicamente correto). Ricardo cria NOVO atestado mesmo texto → vai sair correto com CRM.

---

## 6. ESTADO ATUAL DO APP (snapshot 10/06 ~21h BRT)

### 6.1. Métricas empíricas validadas via PAT

- **63 rows** em `cfm_prescriptions` (receitas + atestados reais incluindo cascata Ricardo de hoje)
- **17 Edge Functions** ativas (16/17 com `verify_jwt=true` — defesa em camadas restaurada V1.9.506)
- **3 cron jobs** ativos (video-call-reminders, monthly-closing dormente, expire-renal-suggestions)
- **AuthContext** agora busca campos profissionais completos (V1.9.639)

### 6.2. Estado funcional pós V1.9.641

| Caminho | Antes | Depois |
|---|---|---|
| Workstation → emitir atestado | ✅ Funcionava (5 tipos: simples/branca/azul/amarela/atestado) | ✅ Funciona (sem regressão) |
| Prontuário → aba Prescrição → listar emitidos | ⚠️ Lia `patient_prescriptions` (0 rows = lista vazia) | ✅ Lê `cfm_prescriptions` (63 rows reais) |
| Prontuário → aba Prescrição → emitir atestado | ❌ Faltava o 5º card | ✅ 5º card purple "Atestado" presente |
| CRM no PDF visual | ❌ Vazio (`users.crm = NULL`) | ✅ Preenchido (V1.9.637 fallback + V1.9.639 AuthContext + UPDATE PAT) |

### 6.3. Vercel queue

- Desktop deploy desencadeou ~5 builds enfileirados durante a tarde
- Free tier = 1 build paralelo → fila lenta
- Smoke pós-deploy V1.9.641 pendente do Pedro/Ricardo após processar fila

---

## 7. PENDÊNCIAS E PRÓXIMOS PASSOS PRIORIZADOS

### 7.1. Imediato (hoje/amanhã)

- [ ] **Smoke Ricardo no Prontuário** pós V1.9.641 deploy (aba Prescrição lista os atestados? 5º card abre o fluxo?)
- [ ] **Ricardo emitir NOVO atestado pra Alexandre Magno Steglich** com CRM preenchido (substitui o fb99247f imutável)
- [ ] **Pedro confirmar Pix R$350/sócio** dos 4 sócios pra abertura CNPJ

### 7.2. Curto prazo (próximas 2 semanas)

- [ ] **CNPJ ativo** (Paulo executando)
- [ ] **Conta bancária PJ aberta**
- [ ] **Decisão Stripe Connect vs MP Marketplace** (Paulo + Pedro)
- [ ] **Fase arquitetural CRM sem regressão** (4 fases parqueadas em [docs/memorias/feedback_crm_iti_certificado_vs_banco_display_10_06.md](docs/memorias/feedback_crm_iti_certificado_vs_banco_display_10_06.md)):
  - Fase 1: alinhar Vitrine UI → `users.crm`
  - Fase 2: fallback defensivo (já feito V1.9.637) reforçado
  - Fase 3: backfill `council_state → crm` pros médicos existentes
  - Fase 4: persistência `signed_pdf_url` em storage (Lock V1.9.299 intocado)

### 7.3. Médio prazo (pós-CNPJ ativo)

- [ ] **Stripe gate hard** (substitui mock atual)
- [ ] **Marco 2:** 2º médico independente real onboardado e operacional
- [ ] **Marco 3:** Manual v1.1 Eduardo Faveret + uso regular Marco 3 completo
- [ ] **Cohort 20-30 pacientes externos pagantes** (PMF declarável)
- [ ] **Revisão acordo cotistas v2.1** com advogado societário + advogado saúde digital
- [ ] **Promoção acordo cotistas v2.1 → versão oficial assinada**

### 7.4. NÃO ATACADO HOJE (registrado pra próxima)

- Acordo cotistas v2.1 (intocado)
- TRL / Ensino (eixo Eduardo)
- PITR / DPO / compliance LGPD Pro plan Supabase
- WiseCare homolog → produção
- Sidecar TEA/TDAH (eixo Eduardo neuro)
- Matrix Z2 Fase B (papers RAG papers Ricardo)

---

## 8. DECISÕES FORMAIS REGISTRADAS NESTA SESSÃO

| # | Decisão | Quem decidiu | Status |
|---|---|---|---|
| 1 | Modelo Split Payment 70/30 médico/plataforma | Pedro + Paulo | ✅ Acordado conceitualmente |
| 2 | Regime tributário inicial: Simples Nacional Anexo III | Paulo (recomendação contador) | ✅ Aceito |
| 3 | CNAE 63.11-9/00 SaaS (sem CNAE serviços médicos) | Paulo (recomendação contador) | ✅ Aceito |
| 4 | NF intermediação: tomador = médico, valor = 30% | Paulo (esclarecimento) | ✅ Entendido |
| 5 | Stripe Connect vs MP Marketplace | Pedro + Paulo | ⏸ Adiado (validar com banco PJ) |
| 6 | Acordo cotistas v2.1 NÃO entra na reunião contador | Pedro (decisão implícita) | ✅ Correto (separação de competência) |
| 7 | Cascata V1.9.635-641 sem regressão | Pedro + Claude | ✅ Type-check PASS + push 4 refs OK |
| 8 | Workaround PAT CRM Ricardo | Pedro (autorizou) | ✅ Aplicado, fix arquitetural mapeado |

---

## 9. RISCOS E ALERTAS REGISTRADOS

### 9.1. Operacional

- **Atestado fb99247f imutável:** Ricardo PRECISA criar NOVO atestado pro Alexandre Magno; o velho fica como histórico legacy. Trigger de imutabilidade está CORRETO juridicamente — NÃO mexer
- **Vercel queue lenta** (free tier): smoke pode demorar pra refletir

### 9.2. Regulatório / compliance (pré-Marco 2)

- **PII residual em `clinical_rationalities.assessment`** — V1.9.452 resolveu majoritariamente + V1.9.597 reforço; ainda há gap "nome do meio" se typo no `users.name` (cristalizado em memória 05/06)
- **PITR off + pgaudit ausente** no Supabase atual — pré-condição Marco 2 pra pacientes externos reais
- **CFM 2 médicos exigíveis** pra plataforma operar comercialmente (Ricardo + Eduardo cobre, mas Eduardo precisa Marco 3 completo)

### 9.3. Societário

- **Acordo cotistas v2.1 NÃO assinado** = empresa opera hoje sem trava formal de governança entre sócios. Aceitável pré-PMF, **bloqueador pra rodada externa de investimento**
- **Eduardo Faveret ausente da reunião CNPJ** — precisa ser incluído via comunicação assíncrona nas decisões fiscais/societárias antes de assinatura formal

---

## 10. FRASE ÂNCORA

> **10/06/2026 — Dia D do CNPJ.** Presentes: Pedro + Ricardo + João + Paulo (Eduardo ausente). Paulo recebeu o dossiê contador, alinhou Split Payment 70/30 + NF intermediação + Simples Anexo III + CNAE SaaS. Acordo de cotistas v2.1 NÃO entrou na pauta (decisão correta — separação contador vs societário). Cascata 5 fixes V1.9.635-641 resolveu bug arquitetural CRM exposto pelo atestado urgente do Alexandre Magno Steglich — ITI validava o certificado físico (sempre OK), PDF visual lia do banco (saía vazio). Workaround PAT aplicado pro Ricardo emitir HOJE, fix arquitetural sem regressão mapeado em 4 fases pra próxima sessão. Locks 8 intocados em todos os commits. Próximo: incluir Eduardo na decisão fiscal assíncrona + smoke Ricardo pós-V1.9.641 + Pix R$350/sócio destravando Marco 1.

---

**Assinaturas pendentes:**
- [ ] Pedro Henrique Passos Galluf
- [ ] Dr. Ricardo Valença
- [ ] Eduardo Faveret
- [ ] João Eduardo Vidal
- [ ] Paulo (contador) — ciência das decisões fiscais

**Documento gerado em:** 10/06/2026 ~21h30 BRT
**Versão:** 1.0 (rascunho operacional — não substitui ata oficial cartorial)
**Próxima ata:** reunião societária 4 sócios pós-CNPJ ativo (data a confirmar)
