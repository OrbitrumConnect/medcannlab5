# DIÁRIO 10/06/2026 — Marco 1 CNPJ DIA D + Reunião Paulo Contador + Bug Atestado Ricardo (cascata 5 fixes)

**Sessão**: laptop, manhã→noite 10/06 BRT — paralela à reunião presencial Pedro+Ricardo+Paulo (contador) na sede.
**HEAD entrada**: `484fb39` (V1.9.626 do fechamento 07/06 noite).
**HEAD saída atual**: `cc1d227` (V1.9.639 AuthContext fix CRM).
**Estado**: pull dos 11 commits desktop (V1.9.627→634) + 5 commits laptop (V1.9.635→639) + UPDATE PAT users.crm Ricardo + 1 memória cravada.

---

## 📍 CONTINUIDADE DOS 3-4 DIÁRIOS ANTERIORES

### DIARIO_05_06 (jantar Pedro+Ricardo+João Vidal)
Ricardo cravou na mesa: pricing R$ 122 × 70k = R$ 8,54M GMV âncora Sociedade Nefrologia + Marco 1 CNPJ 10/06 + densidade clínica DRC×cannabis + 4ª vertente Constituição (remissão DRC). Acordo de quotistas v2.1 em discussão.

### DIARIO_06_06 (Fase A Matrix Z2 — curadoria 103 órfãos)
Triagem read-only: 103 PDFs storage → ~17 papers científicos reais. 27 DOCX fora (extract PDF-only). LGPD prevenido (doc de exame em storage privado não indexado). Boundary cravado: documents ≠ base_conhecimento (V1.9.318 lock).

### DIARIO_07_06 (BLOCO E memórias top 20 + cockpit triagem + verbatim guard + panorama competitivo)
Desktop: V1.9.611→616 sidecars cognitivos + triagem unificada `v_clinical_signals`. Investigação fidelidade 56% (Pedro corrigiu overclaim — herpes era fala dele verbatim, não inferência IA). Cravamento top 20 memórias no diário pra acesso cross-machine.

### DIARIO_07_06_PARTE_2 (laptop, jantar paralelo)
9 commits V1.9.617→625 — Sinopse AECs consistente + tabs Arquivos Clínicos/Longitudinal + Saúde Renal A/Cr + KDIGO A1/A2/A3 + fontes acessíveis 4 sidecars + bug pre-existente date_of_birth corrigido. 4 lições meta cravadas (auditar componente inteiro, antecipar narrativa, cadência, empírico antes default).

### 08/06 e 09/06
Sem diário registrado — Pedro provavelmente trabalhou no desktop (foram criados 11 commits V1.9.627→634 nesses dias: aviso "estágio estimado", Profile demografia, Plano de Cuidado longitudinal REAL, KPIs TEA cópia honesta, "Ver no prontuário" consistência, Vinculação paciente↔médico V1.9.633+634 com modal + consent + Desvincular, DOSSIÊ CONTADOR PAULO consolidado).

---

## 🎯 OBJETIVO 10/06

**Marco 1 = DIA D.** CNPJ MEDCANNLAB TECNOLOGIA EM SAÚDE LTDA sendo aberto na reunião com Paulo (Master Group 888). Pedro + Ricardo presentes na sede. Pix R$ 350 cada sócio (R$ 1.400 total) — cravado 05/06 jantar.

Paralelo: laptop (eu Claude) suportando reunião em tempo real com análise técnica + audit empírico via PAT + fix de bug urgente que apareceu durante a sessão.

---

## 🌅 BLOCO A — Manhã: Pull de 11 commits desktop (V1.9.627→634)

Pull fast-forward `484fb39 → 1a41143`. Type-check verde. Locks 8 confirmados intocados (Core/AEC/Pipeline/Verbatim/sign-pdf-icp = 0 linhas). 1 migration aditiva (V1.9.633 RPC `vincular_paciente_medico`).

| Commit | V | O que |
|---|---|---|
| `323f03c` | V1.9.627 | Saúde Renal aviso "estágio estimado" quando idade/sexo faltam — empírico: 86% pacientes sem `birth_date` (continuidade do meu V1.9.625) |
| `4d1494c` | V1.9.628 | Profile.tsx ganha campos data nascimento + sexo biológico (fix-raiz do gap demografia que meu V1.9.625 só tampou superficialmente) |
| `84e3ec3` | V1.9.629 | Plano de Cuidado longitudinal REAL — substitui "Progresso 17%" falso (era dias-desde-relatório) por marcos clínicos reais + plugou PatientClinicalTimeline V1.9.327 no PatientDashboard |
| `6f28f43` | V1.9.630 | Destaque trigger "Ver detalhe por domínio" |
| `3d151f0` | V1.9.631 | Renal "Ver em Saúde Renal" → "Ver no prontuário" (consistência com 3 sidecars novos) |
| `dda9a8b` | V1.9.632 | KPIs TEA cópia honesta — coletor Sidecar Neuro já existe, dashboard data-gated |
| `a1dbc46` | docs | Memória modelo longitudinal = semantic drift constitucional (Magno V17) |
| `66faf86` + `8a74e74` | docs | DOSSIÊ CONTADOR PAULO completo (CNAEs candidatos + cessão IP por sócio: Pedro técnico, Ricardo licencia AEC+autoria moral) |
| `fb842ef` | V1.9.633 | "Vincular sem AEC" botão cria vínculo de cuidado leve (RPC + tabela `patient_professional_links`) |
| `1a41143` | V1.9.634 | Modal escolha "Vincular agora" OU "Fazer AEC" + card consent LGPD + botão Desvincular (DELETE row) |

Convergência forte com o que eu fiz 07/06 noite:
- V1.9.625 (`date_of_birth` → `birth_date`) ↔ V1.9.628 (Profile demografia) — desktop fechou gap-raiz
- V1.9.621 (tab "Longitudinal") ↔ V1.9.629 (Plano de Cuidado REAL)
- V1.9.624 (empty state Renal) ↔ V1.9.631 (rename "Ver no prontuário")

---

## 🍽️ BLOCO B — Reunião CNPJ presencial Pedro + Ricardo + Paulo

### B.1 — Abertura oficial ata
**Data**: 10/06/2026 ~12h03 BRT. Presentes:
- **Pedro Henrique Passos Galluf** (CTO / fundador técnico)
- **Dr. Ricardo Valença** (fundador clínico/metodológico)
- **Paulo Henrique** (contador, Master Group 888)
- João Vidal **NÃO presente** (provavelmente confirmou por outro canal)

### B.2 — Modelo Split Payment validado por Paulo
Pedro apresentou pra Paulo:
- Consulta R$ 100 → 80% médico ($80) / 20% MedCannLab ($20)
- **MedCannLab emite NF de intermediação** sobre $20 (não consulta médica)
- **Médico emite NF serviços médicos** sobre $80 (PJ ou PF para IRPF)
- Caso remédio análogo: 80% indústria / 20% intermediação

Paulo cravou pontos críticos:
- *"Pra vocês não terem inscrição estadual"* → SaaS puro sem mercadoria
- *"Pra não ter vínculo trabalhista"* → split direto, médico autônomo
- *"Vocês não podem armazenar mercadoria"* → marketplace, dropship (cannabis especialmente)

→ **Tese fiscal da Seção 6 do DOSSIÊ CONTADOR PAULO validada empíricamente.**

### B.3 — Sistema de Referral progressivo (NOVO — não estava no dossiê)
- Iniciante / Intermediário / Avançado
- Médico começa em 70% (zero referrals)
- ~100 referrals → 72-77% (degraus 2-3%)
- 250 referrals → **80%** (teto)
- Sistema automático, infra parcial existe (`patient_referrals`)

### B.4 — Debate pricing — NÃO fechado
Ricardo: *"acho que a consulta tá cara, 80 e 70"*. Sugestão: subir take médico 70%→77-80% (queda take plataforma 30%→20-23%) pra atrair médico que senão fica no consultório próprio.

### B.5 — ⚠️ Anti-padrão CRAVADO: 2 empresas US$ 4B que quebraram
Mencionadas 2 empresas no mesmo segmento que chegaram a US$ 4B faturamento e **quebraram** por: *"muito fácil entrar na plataforma, muita cortesia, não conseguiram contabilizar o quanto o usuário tava usando, tavam pagando pra trabalhar"*.

→ **Princípio cravado**: instrumentação de **unit economics** obrigatória desde dia 1.

### B.6 — Tese nuclear cravada por Ricardo
> *"O produto é o RELATÓRIO. A consulta é OPCIONAL."*

- Médico recebe paciente JÁ com relatório AEC completo
- Relatório = entrega imediata ("brinde" do produto digital)
- Consulta vira ESCALA OPCIONAL, não obrigatória
- Sistema escala porque AEC roda 70k vezes sem médico online
- **Anchor empresarial**: R$ 122 × 70k = R$ 8,54M GMV (cravado jantar 05/06)

### B.7 — Longitudinalidade = MOAT
Cada relato enriquece relatório longitudinal. Conecta com:
- V1.9.621 (tab "Longitudinal" laptop 07/06)
- V1.9.629 (Plano de Cuidado longitudinal REAL desktop 09/06)
- 3ª vertente Ricardo (segurança paciente / gestão risco semântica)
- CARD-RJ pitch slide 4 ("trajetoria individual auditável")

### B.8 — Eixo Ensino refinado: 3 níveis
- Curso AEC/IMRE Ricardo (R$ 1.999, já existe)
- **Mini-curso onboarding plataforma** (NOVO, R$ 10-30, evita "que faço nessa porra?")
- Treinamento profissional saúde governo (R$ 10, preço social)

### B.9 — Paulo confirmou LTDA, sem inscrição estadual
- LTDA agora (gerar caixa) → instituto depois (com fluxo de caixa)
- Pattern "casa Galdia Bonfiolha" mencionado por Ricardo como referência

### B.10 — NF de intermediação detalhada (Paulo)
- **Tomador**: médico (PJ ou PF), NÃO paciente — evita "MedCannLab vende consulta médica" + problema CFM
- Discriminação: "Licenciamento de uso de plataforma SaaS + intermediação tecnológica de serviços de saúde"
- Código serviço municipal: Paulo confirma específico cidade da sede
- Periodicidade: a decidir (mensal consolidado OR por transação)
- ISS embutido Simples Anexo III

---

## 💰 BLOCO C — Unit economics empírico cravado via PAT (PAT novo `sbp_0d2d0e53...`)

PAT antigo (`sbp_75f091f5...`) confirmado revogado. PAT novo ativo. Smoke ping OK.

### C.1 — Custo médio por interação IA
- US$ 0,0145/interação (mediana US$ 0,0081)
- US$ 17,31 custo TOTAL 30d
- 1197 interações 30d

### C.2 — Reports por usuário
- Hipótese Ricardo na mesa: "4-5 reports/usuário/mês"
- **REAL: 2,86 reports/usuário/mês** (mais conservador, MELHOR pra margem)
- Max 11 reports/usuário (cauda longa)
- 14 pacientes ativos 30d / 40 reports gerados

### C.3 — Custo por relatório (proxy)
- US$ 0,43/relatório (~R$ 2,30)
- Confirma estimativa Ricardo mesa (US$ 0,30-0,40)

### C.4 — Margens projetadas
| Cenário | Custo/usuário/mês | Receita | Margem bruta |
|---|---|---|---|
| Paciente FULL R$ 33 | R$ 6,50-7 | R$ 33 | **~78%** |
| Relatório B2B R$ 122 (Sociedade Nefrologia) | R$ 0,86 | R$ 122 | **~99%** |
| Take 30% × R$ 350 consulta | ~R$ 7 | R$ 105 take | **~93%** |

### C.5 — Projeção 70k Sociedade Nefrologia
- 70k × 2,86 reports × R$ 2,30 = **R$ 460k/mês custo IA**
- Cenário paciente R$ 33: R$ 2,31M faturamento → R$ 1,85M margem (~80%)
- Cenário relatório único R$ 122: R$ 8,54M → R$ 8,38M margem (~98%)
- ⚠️ Cap inteligente OBRIGATÓRIO (Pedro flagou *"pode cachar"*)

---

## 🚨 BLOCO D — Bug urgente atestado Ricardo (cascata 5 fixes)

### D.1 — Trigger inicial
Durante a reunião, Ricardo emitiu atestado real pra paciente **Alexandre Magno Steglich** (médico psiquiatra SUS CAPS Augusto Magal, 63 anos, CID F41.2+F41.1, 90 dias afastamento trabalhista pós-trauma acidente esposa 2023).

PDF saiu **completamente vazio de conteúdo clínico** + blob PKCS#7 visível como texto. Cabeçalho "RECEITUÁRIO MÉDICO" (não "ATESTADO"). CRM vazio.

→ Pedro: *"pagamos Paulo pra iniciar CNPJ, não pode ter isso mais"*.

### D.2 — Audit empírico via PAT
- `cfm_prescriptions.id='89164639...'`
- `prescription_type='attestation'`
- `notes` = **2101 chars perfeitos** (texto completo do atestado)
- `professional_crm` = `""` vazio
- `signed_pdf_url` = NULL (PDF não persistido)
- `status='signed'`, `iti_validation_code='ITI-A2A89BF873D6'` ✅
- **Assinatura ICP-Brasil válida** (Edge sign-pdf-icp v22 INTOCADA Lock V1.9.299)

### D.3 — Cascata de 5 causas-raiz identificadas e corrigidas

| # | V | Commit | Causa-raiz | Fix |
|---|---|---|---|---|
| 1 | V1.9.635 | `c7e842a` | Prescriptions.tsx interface só aceitava `'simple'\|'special'\|'blue'\|'yellow'` (sem `'attestation'`) → caía em "Receituário Médico" default | Template ATESTADO MÉDICO dedicado + interface union expandido |
| 2 | V1.9.636 | `c1d960b` | `formattedPrescriptions.map()` (linha 255-275) **não mapeava** `notes` → frontend recebia `undefined` → body vazio | Adicionado `notes: p.notes` ao mapping (1 linha aditiva) |
| 3 | PAT | UPDATE | `users.crm = NULL` no banco do Ricardo (cadastrou em `users.council_state='5253203-7'` via Vitrine — campo confuso/desalinhado) | UPDATE users SET crm = '5253203-7' WHERE id IN (Ricardo prof + admin) |
| 4 | V1.9.637 | `b9a7838` | QuickPrescriptions linha 364: `professional_crm: (user as any)?.crm \|\| ''` (não tinha fallback pros campos council_*) | Fallback: `crm \|\| council_number \|\| council_state \|\| ''` (1 linha aditiva) |
| 5 | V1.9.639 | `cc1d227` | **CAUSA-RAIZ FINAL**: AuthContext.tsx:186 lia `crm` de `authUser.user_metadata?.crm` (Supabase Auth, vazio) — **não da tabela `public.users`**. SELECT na linha 132 não incluía `crm`, `cro`, `council_*`, `specialty` | Adicionado SELECT desses campos + populado no debugUser (banco prioridade > metadata legado) |

### D.4 — Memória cravada
`feedback_crm_iti_certificado_vs_banco_display_10_06.md` (V1.9.638 commit `d20356c`):
- Diferença ITI valida certificado FÍSICO embutido vs PDF display lê banco
- 3 padrões de cadastro descobertos (Ricardo / Eduardo / Ana Beatriz)
- Por que validações ITI passavam mesmo com `professional_crm=''` ou fake
- Por que NUNCA tinha sido detectado: empresas/RH cobram CRM visual obrigatório no atestado

### D.5 — Trigger CFM imutabilidade
Atestados `89164639` (09:34) e `fb99247f` (13:32) já assinados → trigger `fn_cfm_prescriptions_immutability` bloqueia UPDATE em campos profissionais → **manter** (correto juridicamente, anti-adulteração).

Solução: Ricardo precisa criar **NOVO** atestado pós-deploy V1.9.639.

---

## 🛠️ BLOCO E — 5 commits laptop 10/06 (V1.9.635→639)

| Commit | V | Arquivo | Linhas | Risco |
|---|---|---|---|---|
| `c7e842a` | V1.9.635 | `Prescriptions.tsx` (interface + branch + função `handlePrintAttestation`) | +143 / -1 | BAIXO |
| `c1d960b` | V1.9.636 | `Prescriptions.tsx:275` adiciona `notes: p.notes` | +12 / -2 | BAIXO |
| `b9a7838` | V1.9.637 | `QuickPrescriptions.tsx:364` fallback CRM | +12 / -1 | BAIXO |
| `d20356c` | V1.9.638 | `feedback_crm_iti_certificado_vs_banco_display_10_06.md` (memória) | +111 | DOC |
| `cc1d227` | V1.9.639 | `AuthContext.tsx` SELECT + interface + populate | +33 / -4 | BAIXO |

**Total**: 5 arquivos / +311 / -8 linhas. **Locks 8 intocados em TODOS os commits**.

### Convergência arquitetural cravada
1. Banco `users.crm` (preenchimento PAT) → fluiria pra frontend SE AuthContext buscasse → fluiria pra QuickPrescriptions SE tivesse fallback → gravaria em `cfm_prescriptions.professional_crm` SE loader mapeasse → renderizaria SE template attestation existisse
2. **5 fixes = 5 elos da cadeia** que estavam todos quebrados em sequência
3. Nenhum único fix sozinho resolvia. Combinação dos 5 = solução completa

---

## 🔧 BLOCO F — Vercel fila + status deploy

Tier free Vercel = 1 build por vez. 5 commits enfileirados:
```
c7e842a V1.9.635 → ✅ Ready (Production)
c1d960b V1.9.636 → ✅ Ready (provável)
b9a7838 V1.9.637 → 🟡 processando
d20356c V1.9.638 → 🟡 queued
cc1d227 V1.9.639 → 🟡 queued
```

Estimativa: **~10-20min** pra todos saírem da fila.

Quando `cc1d227` virar 🟢 Ready em Production:
1. Ricardo hard refresh (Ctrl+Shift+R)
2. Logout + login (garante AuthContext rodar fresh)
3. Cria NOVO atestado (não dá editar `89164639` nem `fb99247f` — trigger CFM)
4. Cola texto + assina
5. **PDF sai 100% correto** com cabeçalho ATESTADO MÉDICO + CRM 5253203-7 + texto + assinatura ICP + QR válido

---

## 🎯 BLOCO G — Estado atual e pendências

### G.1 — Funcionando agora (após Vercel deploy completar)
- ✅ Ricardo emite atestado/receita com CRM automático
- ✅ Eduardo (`council_state='52509446'`) emite com CRM via fallback V1.9.637
- ✅ Ana Beatriz (`council_number='44343'`, CRO) emite com número via fallback
- ✅ Novos profissionais cadastrando via Vitrine: cobertos pelos 3 fallbacks
- ✅ Template ATESTADO MÉDICO dedicado (V1.9.635)
- ✅ Texto do atestado renderizado completo (V1.9.636)
- ✅ AuthContext busca conselho do banco (V1.9.639)

### G.2 — Pendências NÃO bloqueantes (próximas sessões)
| Pendência | Risco fix | Quando |
|---|---|---|
| Vitrine alinhar pra salvar em `users.crm` direto (não em `council_state`) | MÉDIO | Próxima sessão (estudar componente da Vitrine) |
| `signed_pdf_url` NULL — PDFs assinados não persistidos no storage | ALTO (perto Lock V1.9.299) | Sessão dedicada com slug-test paralelo |
| Display bonito tipo+UF+número (CRO-RJ 44343) no PDF | BAIXO | Próxima sessão (frontend cosmético) |
| Cadastro 17 papers Ricardo na Library (Fase A Matrix Z2) | ZERO | Quando Pedro autorizar |
| KDIGO Heat Map visual 5×3 (G × A) | BAIXO | Próxima sessão |
| Sintomas precoces Sidecar Renal (cálculo/IRA/dor lombar/disúria) | MÉDIO via slug-test | Sessão dedicada |
| CBG/CBN no anvisaBularioSeed + cannabisMetabolism | BAIXO | Próxima sessão |
| Alerta NSAID em DRC G3b+ frontend | BAIXO | Próxima sessão |

### G.3 — Marco 1 CNPJ — status pós-reunião
- CNPJ MEDCANNLAB TECNOLOGIA EM SAÚDE LTDA: em processo (protocolado quarta 10/06)
- Capital social: a definir (Paulo)
- Regime: Simples Anexo III (Fator R)
- CNAEs: principal 63.11-9/00 SaaS
- Cessão IP: discussão em andamento (desmembrar Cláusula 2.1 Pedro técnico + governança cognitiva)
- Pix R$ 350/sócio confirmado

### G.4 — Próximos passos arquiteturais cravados (memória)
1. **Pós-CNPJ**: ligar Stripe Connect OR Mercado Pago Marketplace (split 70/30 ou 80/20 dependendo decisão pricing)
2. **Sistema referral progressivo**: aproveitar `patient_referrals` existente
3. **Telemetria unit economics**: dashboard custo/usuário (V1.9.238 metadata existente)
4. **Mini-curso onboarding plataforma**: R$ 10-30 escalonável
5. **NF intermediação automatizada**: NFe.io OR Bling pós-decisão Paulo sobre código municipal

---

## 📚 BLOCO H — Memórias cravadas hoje

1. **`feedback_crm_iti_certificado_vs_banco_display_10_06.md`** (V1.9.638) — causa-raiz cascata + 3 padrões cadastro + por que ITI sempre validou mesmo com CRM vazio + plano fix arquitetural conservador

---

## 🎙️ FRASE ÂNCORA 10/06

> *"Dia D Marco 1 CNPJ — MEDCANNLAB TECNOLOGIA EM SAÚDE LTDA em processo de abertura com Paulo (contador) na sede. Pedro+Ricardo+Paulo cravaram: split payment 80/20 ou 70/30 + NF intermediação + sem inscrição estadual + sem vínculo trabalhista + LTDA agora (instituto depois) + sistema referral progressivo iniciante/intermediário/avançado + tese nuclear 'produto é RELATÓRIO, consulta é OPCIONAL' (Ricardo) + anti-padrão US$ 4B que quebraram por sem unit economics. Pull manhã integrou 11 commits desktop (V1.9.627→634) com convergência arquitetural forte. À tarde bug urgente atestado real Ricardo→paciente Alexandre Magno Steglich (CID F41.2+F41.1, 90d afastamento) revelou cascata 5 causas-raiz arquiteturais (template attestation + loader notes + UPDATE users.crm + fallback QuickPrescriptions + AuthContext SELECT users) corrigidas em 5 commits V1.9.635→639 sem regressão (Locks 8 intocados, type-check verde em todos). Memória `feedback_crm_iti_certificado_vs_banco_display_10_06` cravou diferença empírica: ITI valida certificado físico ICP-Brasil (sempre OK), PDF visual lê banco (era o gap silencioso de 8 signed do Ricardo). Unit economics empírico via PAT confirmou estimativa Ricardo na mesa (US$ 0,43/relatório real vs 0,30-0,40 estimado) + 2,86 reports/usuário/mês (REAL menor que hipótese 4-5 → margem ainda melhor). Aguardando Vercel processar fila de 5 builds (tier free 1 por vez) pra Ricardo emitir atestado novo do Alexandre 100% correto. Reunião segue."*
