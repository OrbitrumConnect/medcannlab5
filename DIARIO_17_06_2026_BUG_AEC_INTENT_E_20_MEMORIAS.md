# 📓 DIÁRIO 17/06/2026 — Bug clínico AEC (intent ADMIN fura o gate) + 20 memórias pra reunião

**HEAD entrada:** `a07144f` (V1.9.643) · **Tipo:** achado clínico + handoff laptop + consolidação pra sócios
**Contexto:** holding pattern (sem código desde 10/06, esperando CNPJ). Hoje o **Ricardo testou a AEC** e cravou um bug clínico real. Investigação profunda + fix ficam pro **laptop** (com ok do Ricardo). Aqui: documentar + memória + 20 memórias elevadas pra avaliarmos com os sócios.
**PAT:** recebida nova hoje (`sbp_9441…`) — cruzamento empírico feito.

---

# BLOCO A — 🐛 BUG CLÍNICO: a AEC abandona a escuta e pula pra agenda

## O que o Ricardo viu (testando logado como Carolina, conta paciente-teste)
A AEC abre → *"O que trouxe você?"* → ele responde **"Fui encaminhada a marcar consulta com nefrologista"** (a queixa de abertura, o motivo da visita) → o Core **abre o card de agendamento** e mostra **"Avaliação Concluída"**. Reiniciou, disse a mesma coisa → foi pra agenda de novo. A escuta (MIMRE) foi curto-circuitada já na 1ª fala.

## Prova empírica (PAT, logs de hoje)
| Hora | Mensagem | `intent` |
|---|---|---|
| 13:57 | "iniciar avaliação clínica inicial" | CLINICA ✅ |
| 13:57 | **"Fui encaminhada a marcar consulta com nefrologista"** | **ADMIN** 🔴 |
| 13:58 | "Carolina" | CLINICA ✅ |
| 14:00 | **"Fui encaminhada para marcar consulta com um nefrologista"** | **ADMIN** 🔴 |

- `aec_assessment_state`: phase = **`IDENTIFICATION`**, `is_complete` = **false** → a AEC **nunca completou**; o "Avaliação Concluída" da tela era **FALSO**.
- Split: o texto gerado foi *"O que mais?"* (AEC tentando seguir) **ao mesmo tempo** que o card de agenda disparou.
- **Identidade OK** (sem bug de conta): appointment `526bbcd2` → patient_id=**Carolina** (`5c98c123`, type=patient), professional=**Ricardo** (`2135f0c0`). Rodou como Carolina (paciente), correto.

## ⚠️ Os dois "ADMIN" (a confusão desfeita pro Pedro)
- **Conta/login** = Carolina (**paciente**, NÃO admin). O erro **não** foi por causa da conta.
- **`intent` da MENSAGEM** = "ADMIN" = categoria interna de intenção operacional/agenda → **esse é o bug**. O classificador carimbou uma fala clínica como operacional por conter "marcar consulta". **Independente da conta** (qualquer paciente reproduz).

## Mecanismo no código (Core — território LOCKED)
- [tradevision-core:6787](supabase/functions/tradevision-core/index.ts#L6787): `isUserForcingAction = (currentIntent==='ADMIN' && (isCurrentlyInAecFinalPhase || hasScheduleVerb))`
- [tradevision-core:4738](supabase/functions/tradevision-core/index.ts#L4738): `hasScheduleVerb = norm.includes('marcar') || ...`
- [tradevision-core:6793](supabase/functions/tradevision-core/index.ts#L6793): AEC GATE V1.5 — `if (isAecStillActive && !overrideAllowedContext) shouldTriggerScheduling=false` → **o override fura o gate**.
- Cadeia: intent=ADMIN + "marcar" → override → agenda dispara na fase de abertura (IDENTIFICATION).

## Direção do fix (validada — NÃO aplicada; é pro laptop + Ricardo)
- **(B) intenção:** narrativa de encaminhamento na abertura ≠ ADMIN → é queixa CLINICA.
- **(A) override:** durante AEC ativa (sobretudo abertura/escuta), override NÃO dispara só por conter "marcar/agendar" — exige aceite inequívoco ("quero agendar agora"). AEC GATE soberano na abertura.
- **É BUGFIX, não anti-kevlar:** a REGRA HARD §1 já diz que agenda não dispara na AEC ativa; o código tem o FURO. Corrigir **restaura** a regra. Mesmo assim: **slug-test paralelo + smoke completo + ok do Ricardo** antes de tocar o Core (Lock V1.9.95).
- Pendência menor: a AEC da Carolina ficou órfã em IDENTIFICATION/is_complete=false.

---

# BLOCO B — Estado (holding pattern, ver DIARIO_16_06)
Sem código desde 10/06; gargalo = **Marco 1 CNPJ** (documentos dos 4 sócios + 4 decisões [capital/quotas/sede/admin] + Pix R$1.400). App estável, locks 8 intocados, type-check limpo. BPlan pronto (break-even ≈ Marco 2). Docs prontos: dossiê + ATA + checklist documentos + BPlan.

---

# BLOCO C — 20 MEMÓRIAS ELEVADAS (pra reunião Pedro+Ricardo+sócios)

> As memórias vivem em `.claude/` (fora do git). Aqui as 20 mais relevantes pra avaliarmos juntos. Cada uma = o fato-núcleo, standalone.

## 🏛️ MÉTODO / CONSTITUIÇÃO (o núcleo intocável)
1. **REGRA HARD §1 — "Consentimento ≠ Agendamento"** (anti-kevlar): só `sim/autorizo` à pergunta literal de consentimento fecha AEC. Constituição muda só via Livro Magno. **→ o bug de hoje é um FURO nessa regra (intent ADMIN), não uma mudança dela.**
2. **MIMRE / bio autoral Ricardo:** Método Incentivador Mínimo do Relato Espontâneo — a escuta estruturada é o OURO do sistema. IMRE(código)=MIMRE(nome). **→ é exatamente o que o bug de hoje curto-circuita.**
3. **Z2 — sinaliza, não diagnostica:** o sistema SINALIZA padrão, NÃO caracteriza condição. Fronteira regulatória E filosófica. "Médico decide."
4. **Modelo longitudinal = constitucional (Magno V17):** o valor não é 1 AEC, é a CONTINUIDADE (semantic drift; token=proxy, complementar ao Muhdo biological drift). V17 segue "Preparado" (métricas de escala não bateram). Frase Ricardo: *"o sistema serve ao relacionamento clínico longitudinal."*
5. **Dual-write racionalidades:** `clinical_reports.content` (jsonb, UI paciente) vs `clinical_rationalities` (tabela, analytics) — divergência por DESIGN. Nunca derivar UI paciente de tabela analítica.
6. **RAG molda cognição:** nunca migrar `documents`→`base_conhecimento` em massa (DOC_LIST hijacking). 5 entries hand-crafted = proteção empírica.

## 🩺 CLÍNICO / VERTICAL (rim + cannabis — o go-to-market)
7. **Mapa farmacológico DRC × cannabinoides:** CBD=ansiolítico · **CBG+CBD=anti-inflamatório seguro DRC** (canal de prescrição) · THC=perigoso DRC · **AINEs PROIBIDOS DRC ≥G3b**.
8. **Interseção renal×cannabis — 4 protocolos:** prurido urêmico, dor crônica, insônia, neuropatia. CBD via CYP2C9/3A4, excreção renal.
9. **Remissão DRC inflamatória (4ª vertente):** Tangri et al, Kidney International Jan/2026. Cannabis CBG+CBD anti-inflamatório = **proposta original MedCannLab**, não consenso do paper (anti-overclaim).
10. **Saúde Renal = A/Cr, não ureia** (correção Ricardo 07/06): KDIGO A1/A2/A3. Estágios precoces 1-2-3 ≠ DM/HAS (cálculo, IRA, dor lombar, disúria).
11. **4 sidecars cognitivos:** Renal · Neuro · Sinais do Relato · Cannabis no Relato — 1 arquitetura (Edge classifica report consolidado → tabela → card), trocada só pelo MAPA. Verticalização rim↔cannabis.
12. **Sidecar Neuro (Eduardo):** lê do RELATÓRIO consolidado (1:1 com AEC, consent dado), não chat cru. TEA/TOD/TDAH/epilepsia. Flag default pós-ok Eduardo.

## 💼 ESTRATÉGIA / NEGÓCIO
13. **Reunião CNPJ Paulo (10/06):** Split 70/30 médico/plataforma · Simples Anexo III · CNAE 63.11-9/00 SaaS (evitar 86.xx saúde) · NF intermediação sobre os 30%.
14. **BPlan — break-even ≈ Marco 2:** CapEx ~R$1.600 (plataforma=IP cedido) · OpEx ~R$130/mês hoje · **~25 pacientes pagantes pagam a operação = a meta de PMF**. Risco é comercial (chegar aos pagantes), não margem.
15. **Pricing Ricardo R$122 × 70k DRC:** R$8,54M GMV âncora Soc. Nefrologia — **vitrine narrativa, não pipeline**. Diferencial: estagiamento DRC 1-2 **pré-laboratório** (que a Soc. Nefrologia não tem).
16. **Panorama competitivo:** cada camada tem gigante (scribes Nuance/Abridge · Infermedica/Ada · Blis · HelloKidney), mas **ninguém faz a pilha a partir da ESCUTA**. Moat = interseção (escuta-fiel + método Ricardo + dado DRC pré-lab + cannabis renal), não código.
17. **Acordo quotistas — autoria 3 zonas:** Ricardo (clínica) · Pedro (governança cognitiva = método autoral, domínio DISTINTO não equivalente) · co-autoria (Constituição). Autoria fica com autor; uso cedido à empresa → ninguém sozinho "tira e mata". ⚠️ pool de Tesouraria 20% **não cabe no contrato de Ltda** (resolver: 25% cada + pool no acordo).
18. **PaymentGate mock:** Stripe não conectado, 0 pagante externo, sistema DEMO pré-Marco 2. Destrava: CNPJ → Stripe Connect.

## 🧭 PRINCÍPIOS META (como trabalhar — anti-armadilha)
19. **Doc sem PAT cruzado não vale** (doutrina Ricardo): qualquer doc institucional sem cruzar o banco = overclaim. **+ PAT rotaciona** (cada token vive pouco; revalidar). **+ memórias estáticas envelhecem <30d** pré-PMF.
20. **Verificar ORIGEM antes de afirmar drift / keyword subconta semântico:** detectar "sugere X" ≠ provar que a IA inventou (o herpes era fala do Pedro). Pra medir abundância de fala: dry-run GPT, não ILIKE. **Enforçar fidelidade no código, não no prompt** (verbatim guard 36/36). **→ o bug de hoje é o exemplo perfeito: keyword "marcar" enganou o classificador.**

---

## 🚀 FRASE ÂNCORA 17/06
> *"O Ricardo testou a AEC e cravou um bug clínico real: uma palavra-chave ("marcar") na queixa de abertura faz o classificador carimbar a fala como ADMIN, furar o AEC GATE e pular pra agenda — abandonando a escuta (MIMRE), o ouro do sistema. Confirmado empíricamente (intent=ADMIN, phase=IDENTIFICATION is_complete=false, identidade Carolina correta). Desfiz a confusão dos 2 'ADMIN' (conta=paciente vs intent-da-mensagem=bug). É BUGFIX (restaura a REGRA HARD §1), não anti-kevlar — mas vai pro laptop com slug-test + ok do Ricardo, porque mexe no Core. Documentei + cristalizei + elevei 20 memórias pra avaliarmos com os sócios. Holding pattern segue: o gargalo é o CNPJ, não o código. Locks 8 intocados."*
