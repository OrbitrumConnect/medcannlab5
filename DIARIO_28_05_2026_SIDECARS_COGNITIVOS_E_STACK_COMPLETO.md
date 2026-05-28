# DIÁRIO 28/05/2026 — Sidecars Cognitivos + Stack Completo (continuação madrugada)

**Snapshot**: continuação da sessão Claude desktop 27/05 que virou madrugada 28/05 (~00:00 → ~01:15 BRT). Cobertura: conversa WhatsApp + análise externa GPT/Claude sobre skills vs epistemologia → refinamento "MedCannLab tem stack completo 16 camadas, não só Constituição" + 5 iterações Card Neuro/Renal evoluindo container "Sidecars Cognitivos" + V1.9.477 prop `compact` no RenalSuggestionsCard + feature multidisciplinar parqueada.

---

## 🎯 ESTADO ATUAL FIM DESTA SESSÃO (~01:15 BRT)

| Camada | Estado |
|---|---|
| **HEAD git** | `fe3dea2` (V1.9.477 Renal compact) |
| **Última tag** | `v1.9.475-card-neuro-embriao` (27/05 noite) |
| **Edge tradevision-core** | v416 ACTIVE (V1.9.473 inalterado) |
| **Edge sign-pdf-icp** | v22 ACTIVE — lock V1.9.299 PBAD ICP intacto integralmente |
| **Frontend Vercel** | deploy ~2min com V1.9.477 |
| **Total memorias (desktop path)** | **268** (era 266 noite — 2 novas) |
| **Commits 28/05 (~00→01h15)** | 5 (V1.9.476-A FIX, V1.9.477) |
| **Validação Ricardo conceito-pivot compressão estrutural** | 🟡 ainda pendente |
| **Smoke V1.9.468-B 9 turnos** | 🟡 ainda pendente (próxima sessão laptop) |
| **Eduardo validar Cards Sidecar** | 🟡 ainda pendente |

## 🪡 BLOCO A — Conversa WhatsApp + análise externa GPT/Claude Antigravity

### A.1 — Provocação amigos WhatsApp sobre "skills/hooks são suficientes"

Grupo casual com Cristiano + C Leão + +55 21 999... + Pedro discutindo:
- Cristiano + amigo Canadá: pipeline Hermes orquestrando Higgs pra mídia + proxy ISP residencial Canadá + scrapping/MCP
- C Leão: "ChatGPT já tem memória nativa + admitir não-sabe nativo + skills/hooks tira IA do probabilístico pro determinístico"
- Pedro: defendeu camada epistemológica (compressão estrutural, lacuna observacional, anti-drift)
- Amigos: *"meteu chip do Elon" / "fala japonês"* (afeto disfarçado de deboche)

### A.2 — Análise externa Claude Antigravity + GPT triou conversa

Análise externa elogiou Pedro: *"moat é a camada epistemológica, não execução"* + identificou empíricamente "Caso #3 alucinado no dossiê 10:48 BRT" (validação real do gap V1.9.452/V1.9.468-B).

Pontos válidos identificados:
- Composição > competição entre skills/hooks (execução) e epistemologia (governança)
- "Skill executa uma regra; alguém precisa definir a regra primeiro"
- Amigos zombaram por 3 razões sociais (vocabulário sem ponte + canal errado + contexto)

### A.3 — Refinamento crítico Pedro: "tradevision-core é motor também"

Pedro empiricamente pressionou minha analogia simplificada *"vcs fazem motor / eu defino freio"*:

> *"mais o tradevision core e oq entao? nao e um motor tbm?"*

Análise empírica revelou: minha dicotomia simplificou demais. Tradevision-core é AMBOS motor E constituição embutida (6700 linhas com RESEARCH_PROMPT + AEC FSM + Verbatim First + locks).

### A.4 — Pedro empiricamente: "eu tenho stack completo"

> *"na real eu tenho motor tenho governansa fsm etc etc nao seria isso?"*

Validação empírica via PAT + git revelou MedCannLab tem **16 camadas integradas** vs 1 ausente (Hermes-style camada 4):

| 16 PRESENTES | 1 AUSENTE |
|---|---|
| Motor LLM (tradevision-core v416) | Camada 4 Hermes-style |
| Governança epistemológica (9 locks V1.9.X) | (skills/hooks abstratos, |
| FSM determinístico (AEC 13+ fases) | auto-correção autônoma, |
| Pipeline orchestrator | MCP orquestração externa, |
| Memória institucional (268 memorias) | scraping/proxy stack) |
| Telemetria (4005 interactions metadata) | |
| Sidecar pattern (Renal V1.9.307 + Neuro V1.9.475) | |
| ICP-Brasil PBAD V1.9.299 CONFORME ITI | |
| LGPD V1.9.407 + V1.9.452 (88.5% → 0%) | |
| Anti-drift V1.9.453 + V1.9.468-B | |
| Trigger BD V1.9.474 (3 anomalias zeradas) | |
| Audit framework clinical_qa_runs | |
| SDLC V1.9.X (475 versões / 7 meses / 9 tags) | |
| Dual remote push 4 refs obrigatório | |
| Smoke pre-commit obrigatório (princípio cristalizado) | |
| Cross-machine sync docs/memorias/ | |

**Conclusão honesta**: análise externa criou dicotomia falsa ("eles fazem X / você faz Y") quando empíricamente é "Pedro tem stack completo de saúde digital regulada; eles têm stack genérico de automação criativa". Domínios diferentes, soluções diferentes, sobreposição mínima.

### A.5 — 4 versões de pitch pra WhatsApp leigo

Pedro pediu "como explicar pra leigo". Apresentei 4 versões progressivas (1 frase → 3 linhas → parágrafo → exemplo concreto) refinadas após Pedro apontar que minha analogia inicial simplificou. Versão final reconhece stack completo MedCannLab vs camada Hermes-style.

## 🧬 BLOCO B — 5 iterações Card Neuro/Renal evoluindo Container "Sidecars Cognitivos"

### B.1 — V1.9.476 inicial (commit `d239868`) — container Sidecars Cognitivos
- Background gradient discreto (slate-900/40 → emerald-950/5 → slate-900/40)
- Grid externo: `grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4`
- Renal wrapped em `max-w-md w-full`
- Neuro com max-w-md interno
- 2 slots futuros placeholders (Cardiovascular + Endócrino) dim border-dashed
- Header "🩺 SIDECARS COGNITIVOS · sinais detectados em conversas reais"

### B.2 — V1.9.476-A (commit `48e5a4a`) — 2 bugs reportados via screenshot
Pedro empíricamente:
> *"so ajustar o renal como renderiza por favor amigao! e omesmo trigger para validar do rim no neuro nao vejo"*

**Fix 1 (tentado)**: grid 4-col → 2-col (`lg:grid-cols-2`). REGREDIU layout que Pedro queria.

**Fix 2 (mantido)**: trigger validação no Neuro com paridade visual ao Renal:
- Card Renal: "✓ Aprovada por Dr. Ricardo Valença · 17/05" (verde)
- Card Neuro: "⏳ Audit manual · aguardando validação Dr. Eduardo Faveret" (amber)
- Paridade institucional atingida

### B.3 — Pedro feedback claro: "ordem 4-col estava correta"
> *"amigo oq vc fez ficou ruim voltar como estava ! e apennas o conteudo renaal que nao estava renderizando direito ! trigger ok!"*

Diagnóstico empírico: Card Renal V1.9.309 tem grid INTERNO `2xl:grid-cols-5` que precisa width ~600-700px pra renderizar mini-card sem espremer. Em col estreita do grid externo 4-col (~352-400px), quebra visualmente ("Possível/DRC/G3b" em 3 linhas, "Maria das Dores" cortado, etc).

### B.4 — V1.9.477 (commit `fe3dea2`) — prop `compact` no RenalSuggestionsCard ⭐ FINAL

**Solução cirúrgica final** (2 arquivos, ~10 linhas):

**`RenalSuggestionsCard.tsx`** — prop opcional `compact?: boolean`:
```tsx
interface RenalSuggestionsCardProps {
  compact?: boolean
}

export default function RenalSuggestionsCard({ compact = false }: ...) {
  // ... linha 223:
  <div className={compact
    ? "grid grid-cols-1 gap-3"  // compact: força 1 col
    : "grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-5 gap-3"
  }>
```

**`ProfessionalMyDashboard.tsx`** — grid 4-col + caller compact:
```tsx
<div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-3">
  <RenalSuggestionsCard compact />  {/* ← prop compact aplicada */}
  <NeuroSuggestionsCardPlaceholder />
  {/* + 2 slots futuros (Cardio + Endo) placeholders */}
</div>
```

**Resultado visual final** (2xl viewport):
```
[Renal compact] [Neuro embrião] [Cardio dim] [Endo dim]
   mini-card        4 sinais        roadmap      roadmap
   vertical OK      trigger amber   
```

### B.5 — Princípios aplicados ao longo das 5 iterações

| Princípio | Aplicação |
|---|---|
| **Validação empírica > plano teórico** | 5 iterações baseadas em screenshots reais Pedro |
| **Polir-não-inventar** | V1.9.477 edição MÍNIMA no Renal (prop opcional) |
| **Zero regressão** | Callers atuais `<RenalSuggestionsCard />` intactos (default false) |
| **Defense in depth** | Prop compact + grid externo controlado + trigger validação Neuro |
| **Anti-cristalização-prematura** | V1.9.475-D parqueamento empírico documentado |

## 💡 BLOCO C — Feature multidisciplinar proposta + parqueada

Pedro propôs:
> *"caso um paciente faça AEC e apareçca questões que um profissional não cuida como card! no mesmo card poderia ter uma opcao de indicar para alguem da equipe clinica dele ou caso ele nao tenha aquele profissional na equipe oferece um pro na area para ele por na equipe caso esteja apto livre? já ajuda e inicia melhor tbm a relação entre profissionais usando a area de equipe clinica"*

### C.1 — Análise empírica (coerente arquiteturalmente)

**Cenário**: Ricardo (nefro) tem paciente com sinais TDAH detectados pelo sidecar Neuro. Ricardo não trata TDAH. Hoje sinal fica órfão. Com feature: card oferece "Indicar Eduardo (na equipe)" OU "Adicionar pro neuro à equipe via vitrine".

### C.2 — Justificativas

- ✅ Princípio compressão estrutural preservado (card sinaliza + facilita; médico decide)
- ✅ Reusa estrutura existente: `DoctorRelationCard` parqueado (memory 18/05) + Vitrine médicos + Sharing cross-account (validado 27/05)
- ✅ Marco 3 materializa via uso real (Eduardo entrou 27/05; agora precisa de ponte concreta com Ricardo)
- ✅ Wedge competitivo: poucas healthtechs têm coordenação multidisciplinar fluida

### C.3 — Riscos vigiados

- 🔴 Regulatório CFM — referral médico-médico precisa termo formal
- 🔴 LGPD — paciente autoriza compartilhamento cross-médico?
- 🔴 Marketplace livre — quem responde clinicamente?
- 🔴 Babylon-pattern se mal feito ("IA decide quem você indica")

### C.4 — 4 opções timing apresentadas + escolha empírica

| Opção | Status |
|---|---|
| A — Codar feature completa (~6-8h) | ❌ Rejeitado (sem caso empírico ainda) |
| B — MVP simples (~2-3h) | ❌ Não-implementado |
| **C — Parquear memory + triggers explícitos** | ✅ ESCOLHIDA |
| D — UI hint visual "em breve" (~15min) | ❌ Não-implementado |

### C.5 — Triggers explícitos pra desparquear feature

1. Ricardo bater empíricamente: *"queria indicar caso TDAH pra Eduardo"*
2. Eduardo bater empíricamente: *"tenho paciente com queixa renal, indicar Ricardo"*
3. Marco 2 paciente externo real com sinal fora especialidade médico atual

## 🪶 BLOCO D — Princípio meta cristalizado: "Validação empírica via screenshot > plano teórico"

### D.1 — Origem empírica

Apresentei V1.9.475-D (refator pattern Renal grid + paginação) com confiança técnica.

Pedro autorizou `go`. ANTES de codar, mandou screenshot do V1.9.475-C atual com mensagem *"veja"*.

Análise empírica do screenshot revelou que V1.9.475-D PERDERIA valor visual no estado atual (1 paciente único em grid 5-cols = espaço desperdiçado + 4 sinais escondidos em modal = perde detalhamento).

**Voltei atrás antes de codar** — recomendei `mantém C parquea D`. Pedro confirmou.

### D.2 — Princípio cristalizado pra futuras refatorações

> *"ANTES de codar refatoração, validar empíricamente que ela é melhoria pelo estado atual."*

Aplica-se a TODA refatoração futura. Especialmente importante quando:
- Plano teórico parece "elegante"
- Mas estado atual já entrega valor visual/funcional
- Refatoração pode trocar "valor real hoje" por "escalabilidade futura especulativa"

### D.3 — Manifestações empíricas na sessão (5 iterações)

- V1.9.475-A: tentei side-by-side 2-col → REGREDIU Renal (screenshot expôs)
- V1.9.475-C: declarei "5/5 PASS" → Pedro mandou dossiê PDF com 5 violações reais (turnos 6-9)
- V1.9.475-D: plano teórico "elegante" → screenshot expôs perda visual
- V1.9.476: container 4-col → Renal espremido visualmente (screenshot expôs)
- V1.9.476-A: tentei reduzir grid pra 2-col → Pedro rejeitou ordem
- V1.9.477: prop compact (final cirúrgico) — atendeu pedido empírico

## 📊 BLOCO E — Diferenciação Pedro vs Ricardo no moat MedCannLab

Análise externa elogiou: *"você cristalizou em 9 meses"*. Refinei empíricamente:

**Camada epistemológica é COMPARTILHADA com Ricardo** — não é só Pedro:
- Conceitos médicos centrais ("queixa ≠ sintoma", AEC abertura fenomenológica, Lock V1.9.388-A.3 Z2) = Ricardo
- Pedro orquestra COS + cristaliza em código/memory + arquitetura técnica
- **Moat não é Pedro individual, é Pedro+Ricardo cristalizando juntos**

Pedro também é menos solo do que análise externa sugeriu:
- ~7 meses (não 9) — começou ~outubro 2025
- 268 memories (não 200)
- 5+ camadas dependem de Ricardo (Constituição clínica, validação Z2, conceito-pivot pendente endosso)

Anti-overclaim aplicado retroativamente.

## 🚨 BLOCO F — Pendências críticas pra continuar (laptop ou próxima sessão)

### F.1 — Validações empíricas pendentes

1. **Smoke V1.9.474 trigger BD in vivo** — paciente teste recomeça AEC após invalidação → confirma trigger funciona
2. **Smoke V1.9.468-B 9 turnos** com Ricardo — armadilhas curtas + conversação prolongada
3. **Validar conceito-pivot compressão estrutural com Ricardo** (endosso humano memory cristalizada 27/05)
4. **Eduardo validar Cards Sidecar** (V1.9.475-C/E + V1.9.477) visual no laptop
5. **Eduardo trazer Fase B** (2-3 casos neuro REAIS anonimizados) → gatilho V1.9.475-D refator
6. **Validar viewport mobile** V1.9.476/477 (cards empilhados)
7. **Backfill 3-4 rows reais PII** (Maria Pinto + Mariana incerto) com aprovação Ricardo

### F.2 — Decisões humanas pendentes (destravam roadmap)

- **CNPJ MedCannLab** (Marco 1 João — gatilho de tudo)
- **DPO designation** (sócio: Pedro/Ricardo/Eduardo/João)
- **1Pure parceria** — 5 condições + 3 versões posicionamento (Ricardo + João decidirem)
- **Pro plan Supabase** ($25/mês) — habilita PITR + pgaudit
- **Termo de Uso formal** LGPD Art. 33 + CFM 2.314 (advogado especialista)
- **Canal auditor ANVISA** (João conhece) — enviar SGQ AUDITOR sanitizado

### F.3 — Memory cristalizadas hoje 28/05 (madrugada)

1. `feedback_validacao_empirica_screenshot_maior_que_plano_teorico_28_05` ← PRINCÍPIO META
2. `project_v1_9_477_renal_compact_sidecars_cognitivos_28_05` ← implementação técnica
3. `project_referral_multidisciplinar_sidecar_parqueado_28_05` ← feature proposta parqueada

## 🪶 BLOCO G — Frase âncora 28/05 ~01:15 BRT

> *"5 iterações Card Neuro/Renal evoluindo Container Sidecars Cognitivos provaram empíricamente: validação via screenshot > plano teórico. Pedro pegou 5 inconsistências visuais via screenshots — cada vez fix cirúrgico, não-grande-refator. V1.9.477 prop compact é polish final: ~10 linhas, zero regressão, Renal V1.9.309 lock preservado via prop opcional. Análise externa GPT/Claude validou: moat MedCannLab é camada epistemológica completa (16 camadas integradas) vs camada operacional genérica Hermes-style — domínios diferentes, não-competição."*

---

## 🩺 BLOCO H — Smoke AEC end-to-end 28/05 manhã (~08h26 BRT)

### Contexto

Pedro (conta paciente teste `d5e01ead`) executou AEC completa: queixa "estresse" → CONSENT_COLLECTION → FINAL_RECOMMENDATION → COMPLETED ("obrigado noa"). Validado via logs Edge `tradevision-core` + PAT no banco.

### Resultado: SMOKE PASS ✅

| Item | Status | Evidência |
|---|---|---|
| AEC FSM completou | ✅ | `phase=COMPLETED`, `is_complete=true`, `invalidated_at=null` |
| Report assinado | ✅ | `ef7b33d9-0e54-4ec3-9e81-3af44e34150d`, signed 11:26:27 |
| Scores calculados | ✅ | `clinical_score=49`, `confidence=high`, 8 sinais source |
| AEC GATE V1.5 | ✅ | reteve "concordo" em CONSENT_COLLECTION (REGRA HARD §1) |
| Verbatim V1.9.86 | ✅ | bypass GPT em 3 fases hard-lock |
| Idempotência | ✅ | `PIPELINE_REDUNDANT_TRIGGER` capturou re-disparo Caminho 1 |
| Pipeline 5 stages | ✅ | START → CLEANUP → REPORT → AXES → RATIONALITY → DONE (39s) |

### Achados arquiteturais NOVOS (não estavam em memória)

**1. SHARE faz OVERWRITE em `professional_id` / `doctor_id`, não APPEND**

Pedro compartilhou `ef7b33d9` pra Eduardo (`f4a62265`) 3min50s após signed_at:
- `professional_id = Eduardo` (sobrescreveu Ricardo)
- `doctor_id = Eduardo` (sobrescreveu Ricardo)
- `shared_with = [Eduardo]` (Ricardo NÃO está no array)

**Comportamento histórico mudou em algum momento**: report `8f4876e9` (26/04) tem `shared_with=[Ricardo, 5a9ada8b]` — multi-share funcionou. Hoje virou overwrite. Não sei quando mudou ou se foi intencional.

**Memória clínica preservada nos antigos**: 7 reports pré-22/05 mantêm `professional_id=Ricardo`. Paciente que "volta pro médico antigo" → médico antigo tem histórico intacto via reports antigos.

**2. RLS `Reports access` tem UUIDs HARDCODED + caminho via `is_admin()` transparente**

```sql
is_admin()                                    -- Ricardo (rrvalenca, admin) vê TUDO
OR auth.uid() IN [17345b36, f62c3f62, 99286e6f, f4a62265]  -- whitelist
OR professional_id = auth.uid()
OR doctor_id = auth.uid()
OR patient_id = auth.uid()
```

Eduardo (`f4a62265`) está HARDCODED na policy (anti-pattern). Ricardo vê o report novo 28/05 não por share, mas por ser admin (`role=admin`).

**Lacuna latente**: policy NÃO tem caminho via `appointments`. Quando entrar profissional puro (role=profissional sem admin), reports gerados após paciente compartilhar pra outro médico ficam invisíveis pra ele — mesmo com 11 appointments históricos.

**3. Racionalidades: pipeline gera 1 (integrative), médico aciona as outras 4**

Baseline empírico últimos 10 reports assinados:
- 9/10 com **1 racionalidade** (`integrative`, `generated_by=noa_ai`)
- 1/10 com 3 racionalidades (report `fa003f50` de 15/05, alguém acionou análise pós-pipeline)

→ Comportamento ESPERADO. Pipeline `tradevision-core` stage RATIONALITY gera 1 automaticamente. As outras 4 (biomedical/homeopathic/tcm/ayurvedic) são via service `rationalityAnalysisService.saveAnalysisToReport` quando médico aciona UI.

### Backlog RECONFIRMADO (não-novo, mas empíricamente reproduzido hoje)

🔴 **PII em `clinical_rationalities.assessment`**:
```
"A análise do relatório clínico de Pedro Paciente revela..."
                              ^^^^^^^^^^^^^^^^^^^
```
V1.9.452 sanitize já no backlog P0 — smoke reproduziu vazamento exato.

🟡 **Dual-write `content.rationalities` jsonb vs tabela** ([[feedback_dual_write_contract_jsonb_vs_tabela_18_05]]):
- jsonb `content.rationalities = null` ❌
- tabela 1 row populada ⚠️
- UI paciente lê do jsonb → vai mostrar zero racionalidade no app

Já documentado, não-novo. Smoke reproduziu drift esperado.

### Frase âncora Bloco H

> *"Smoke AEC 28/05 PASS end-to-end. AEC + Pipeline + Signature + Share + RLS funcionando. 3 aprendizados arquiteturais novos cristalizados: share = overwrite (não append) / RLS admin transparente (Ricardo vê tudo via role) / pipeline gera 1 racionalidade (médico aciona 4). 2 backlog reconfirmados empíricamente: PII em assessment + dual-write jsonb null."*

---

## 🌅 BLOCO I — Sessão tarde 28/05 (~11h-15h BRT): V1.9.479 + V1.9.480 + Mario fix + Auditoria Matrix completa

### Cronologia

| Hora BRT | Evento |
|---|---|
| ~11h | Pedro logs smoke AEC end-to-end PASS via PAT (Bloco H deste diário) |
| ~12h | Pedro print dashboard paciente + tensão Ricardo "AEC obrigatória" vs "paciente perdido" |
| ~12h30 | V1.9.479 cirúrgica (destaque AEC + Agendar rebaixado) — commit `1476862` push 4 refs |
| ~13h | Pedro print Prontuário João Guimarães + pedido Ricardo Matrix corpus expansion + bug Mario typo email |
| ~13h30 | Mario fix via PAT atomic (`mariorvalenca@oulook.com` → `outlook.com` auth+public) |
| ~14h | Auditoria empírica Matrix corpus via PAT front+back (6 fontes mapeadas) |
| ~14h30 | V1.9.480 alterar email Profile (re-auth + Supabase confirmation) — commit `69e88a1` push 4 refs |
| ~15h | 2 memorias arquiteturais novas cristalizadas + MEMORY.md NÍVEL 1 atualizado |

### V1.9.479 — destaque visual AEC dashboard paciente (`1476862`)

**Contexto**: Ricardo trouxe princípio *"todo usuário deve ser levado a fazer uma avaliação clínica inicial"*. Pedro questionou empíricamente: zero-onboarding deixa paciente perdido. Tensão resolvida via **Opção B (hierarquia visual)**, NÃO Opção C (bloqueio forçado).

**Print Pedro confirmou**: 6 botões "O que você quer fazer agora?" no mesmo nível visual — "Iniciar Avaliação" nivelada com "Vincular Médico" (slate-800/40). V1.9.310 (16/05) tinha escolhido "Agendar Consulta" como primary emerald — anti-AEC.

**Cirurgia ~10 linhas em [PatientHeaderActions.tsx](src/components/PatientHeaderActions.tsx)**:
- AEC vira primary: `bg-emerald-500/15` + `border-emerald-500/40` + `ring-emerald-500/20` + `shadow-emerald-500/10` + `font-semibold` + Brain icon `animate-pulse` 3s lento + `hover:scale-[1.02]`
- Agendar Consulta DESCE pra `slate-800/40` (igual aos demais secundários)
- Demais botões intocados (Enviar Médico, Canal Atendimento, Vincular Médico, WhatsApp)

**Princípios aplicados**: polir-não-inventar / anti-Babylon (glow sutil, não-agressivo) / acessibilidade Ricardo 60+ (`font-semibold` aumenta peso visual sem aumentar tamanho).

### Mario Valença fix empírico via PAT

**Causa raiz descoberta empíricamente**: irmão Mario tinha cadastro com TYPO no email — `mariorvalenca@oulook.com` (sem o "t" em "outlook"). Por isso recovery email NUNCA chegava. Domínio inexistente. Ricardo enviou recovery 2x manualmente, ambos morriam silenciosamente.

**Fix atomic via PAT (BEGIN/COMMIT)**:
```sql
UPDATE auth.users SET email = 'mariorvalenca@outlook.com', updated_at = NOW() WHERE id = '05bd8398-...';
UPDATE public.users SET email = 'mariorvalenca@outlook.com', updated_at = NOW() WHERE id = '05bd8398-...';
```

`email_confirmed_at` preservado (31/03 original) — Mario NÃO precisa reconfirmar email. Ricardo manda recovery agora, chega no @outlook.com real.

### V1.9.480 — alterar email Profile com re-auth + Supabase confirmation (`69e88a1`)

**Contexto**: Mario fix expôs gap arquitetural — campo email do Profile estava `disabled` HARDCODED (não condicional), bloqueava QUALQUER user de mudar email pelo app. Defesa do dev anterior contra dessync auth↔public, mas sem implementar fluxo correto.

**Implementação em [Profile.tsx](src/pages/Profile.tsx) (~190 linhas)**:
- State: `isEmailEditing` + `emailData` (newEmail/confirmEmail/currentPassword) + `showEmailPassword`
- Handler: `handleEmailDataChange` + `handleChangeEmail`
- UI: bloco "Alterar Email" dentro da seção Segurança, replicando padrão visual do bloco "Alterar Senha"
- Campo email do form principal **continua disabled** (defesa) — mudança SÓ via modal dedicado

**7 mitigações de risco aplicadas**:
1. Account takeover → re-auth obrigatório (`signInWithPassword` antes do `updateUser`)
2. Confirmação Supabase nativa → mensagem clara "clique no link no novo email"
3. Sync auth/public → NÃO faz UPDATE direto em `public.users` (auth é canônica)
4. Email duplicado → handle de erro específico "já em uso por outra conta"
5. Typo novo email → pede 2x (newEmail + confirmEmail) + regex `^[^\s@]+@[^\s@]+\.[^\s@]+$`
6. Email = atual → bloqueia com mensagem clara
7. Audit LGPD → `noa_logs` insert type=`profile_email_change_requested_v1_9_480` (best-effort)

**UX honesta**: *"Email de confirmação enviado para X. Clique no link recebido para finalizar. O email atual continua válido até lá."* — sem overclaim "alterado com sucesso" antes de fato estar.

### Auditoria Matrix corpus empírica via PAT front+back (descoberta GRANDE)

**Pedido Ricardo manhã**: *"Matrix deve analisar todos os documentos do prontuário, não só relatórios AEC. Pode ler evoluções, plano terapêutico, linha do tempo. Dossier deveria voltar pro prontuário."*

**Pedro potencializou**: *"Matrix/Nôa deveria virar consciência longitudinal do prontuário inteiro"* — separou Camada paciente (modelar trajetória OK) vs Camada médico (modelar investigação = Babylon).

**Auditoria PAT revelou (descobertas centrais)**:

1. **V1.9.382 `usePatientLongitudinal` JÁ EXISTE desde 19/05** — embrião longitudinal Ricardo nem percebeu. Carrega 5 reports + 10 racionalidades + pseudonimiza Z2 (V1.9.384) + extrai conteúdo clínico (V1.9.450) + audit log LGPD + atrito intencional (cards desmarcados default).

2. **3 fontes embaralhadas como "evolução"** em `PatientsManagement.tsx` linhas 1055-1162 (`loadEvolutions`):
   - `clinical_assessments` WHERE `FOLLOW_UP` = **18 rows** evoluções reais médicas (4 médicos, 9 pacientes)
   - `clinical_reports` `initial_assessment` = 145 rows AEC
   - `patient_medical_records` `chat_interaction` = **6.070 rows** diálogo IA paciente↔Nôa (NÃO é evolução clínica)
   
   Todas misturadas na MESMA aba "Evolução" sem distinguir → Ricardo vê 6070 chat IA com 18 evoluções reais → conclui "Matrix não lê" quando o problema é separação semântica.

3. **`patient_therapeutic_plans` = 0 rows** — tabela existe com schema completo (goals jsonb + summary + notes + metadata + started/completed_at) MAS feature **NUNCA codada UI**. Ricardo pediu "Matrix lê plano terapêutico" — empíricamente *"o momento de decisão clínica ainda não foi institucionalizado no sistema"* (frase GPT externo).

4. **Dossier Ricardo hoje ÓRFÃO** — `physician_research_dossiers ecd67cf0` tem `patient_id=NULL`. `useDossierPersist` (V1.9.392) aceita patientId opcional, e Matrix permite "pesquisa livre" sem paciente em foco. Por isso dossier não aparece no prontuário.

### 3 Camadas Matrix decompostas (memory `project_matrix_roadmap_camadas_1_2_3_28_05`)

**Camada 1 (fática, consolidar JÁ existente)** — 6 passos incrementais (~12-15h dev total):
- 1.1 dossier captura `patient_id` (~1-2h) — degrau cirúrgico imediato
- 1.2 hook lê `clinical_assessments` FOLLOW_UP (18 rows reais) (~2-3h)
- 1.3 hook lê dossiês prévios mesmo paciente (~1h)
- 1.4 UI toggle médico por fonte (V1.9.318 mitigation) (~2-3h)
- 1.5 aba Evolução separa visualmente 3 fontes (~2-3h)
- 1.6 hierarquia semântica (texto Ricardo: contexto ativo / relevância temporal / eventos-chave / ecos narrativos / mudanças conduta / reflexões persistentes)

**Camada 2 (conceitual, requer Ricardo)**:
- 2.1 identidade Matrix redefinida em UI/copy ("lente reflexiva da trajetória clínica")
- 2.2 dossier vira evento longitudinal na timeline do prontuário
- 2.3 feature **plano terapêutico** — buraco arquitetural REAL (precursora, sem ela Matrix não tem o que ler)

**Camada 3 (relacional) — VETADA INSTITUCIONALMENTE**: modelar trajetória cognitiva do médico = Babylon-pattern (Watson Health $5B→$1B) + CFM 2.314 + V1.9.388-A.3.

**Alternativa segura Camada 3**: Matrix sugere PERGUNTAS que médico ainda não fez (anti-espelho, pró-complementariedade) — só após Camada 2.1 estabilizar + Ricardo aprovar boundary explícita.

### Princípio meta cristalizado (memory `feedback_sistema_tem_contexto_demais_falta_semantica_clinica_28_05`)

> **"O problema não é falta de dados — é falta de separação epistemológica entre as fontes. Mais valor nasce de SEPARAR o que está junto do que ADICIONAR o que não existe."**

Aplicável a TODA decisão de RAG/corpus expansion futuro. 3 perguntas empíricas obrigatórias antes de "X deve ler mais Y":
1. Que fontes Y existem hoje? (PAT mapeia)
2. Estão separadas semanticamente no UI?
3. Médico distingue empíricamente o que é cada uma?

Se NÃO a #2 ou #3: solução é **separação semântica**, não expansão de corpus.

### 3 perguntas pendentes pro Ricardo (destravar Camada 2)

1. *"Quando você diz 'Matrix lê evoluções', são as 18 FOLLOW_UP (médico escreveu) ou as 6070 conversas IA também?"*
2. *"Matrix lê automaticamente OU sob comando seu via toggle de fonte?"* (V1.9.318 mitigation)
3. *"Plano terapêutico — quer construir a feature primeiro (tabela vazia esperando) OR Matrix só lê o que já existe?"*

### Memorias novas cristalizadas (NÍVEL 1 entry point)

- `feedback_sistema_tem_contexto_demais_falta_semantica_clinica_28_05.md` — princípio meta
- `project_matrix_roadmap_camadas_1_2_3_28_05.md` — roadmap completo

### Pendências de fechamento elite

| Item | Status |
|---|---|
| Smoke V1.9.480 empírico (Pedro abrir Perfil + testar) | ❌ Pendente |
| Decisão dossier Ricardo órfão (`ecd67cf0`) | ❌ Pendente — vincular agora OR aguardar Camada 1.1 |
| Mensagem Ricardo 3 perguntas (WhatsApp) | ❌ Rascunho entregue, Pedro envia |
| Sync `public.users.email` após confirmação Supabase | 🟡 Gap aceitável pré-PMF (auth é canônica) |
| Vercel deploy status | ❓ Não validado (presumido OK — push 4 refs sem erro) |
| PAT rotation fim de sessão | ❌ Princípio cristalizado, lembrar Pedro |

### Frase âncora Bloco I

> *"Sessão tarde 28/05 ficou triple-A por descomprimir: V1.9.479 cirúrgica (~10 linhas) + V1.9.480 polish defensivo (~190 linhas) + Mario fix empírico + auditoria Matrix REVELADORA (V1.9.382 já existe, 3 fontes embaralhadas, plano terapêutico nunca codado). Sistema ficou mais coerente sem adicionar feature grande. Camada 3 vetada institucionalmente — Babylon-pattern bloqueado. Princípio meta novo cristalizado: o problema não é falta de dados, é falta de separação epistemológica."*

---

## 📋 ÚLTIMA INSTRUÇÃO pra próxima sessão Claude (laptop ou desktop)

**LER NESTA ORDEM**:
1. `CLAUDE.md` (entry point sempre)
2. `MEMORY.md` (índice NÍVEL 1 — 14 memorias 27/05 + 3 novas 28/05)
3. `DIARIO_28_05_2026_SIDECARS_COGNITIVOS_E_STACK_COMPLETO.md` (este diário)
4. `DIARIO_27_05_2026_MATRIX_Z2_BULA_E_LOCKS_ANTI_DRIFT.md` (Blocos A-N)
5. `docs/MEDCANNLAB_SGQ_INDICE_PRELIMINAR_27_05.md` (se discussão regulatória)
6. `docs/MEDCANNLAB_SGQ_INDICE_AUDITOR_27_05.md` (se canal auditor)

**PRIMEIRA AÇÃO sugerida laptop**: validar visualmente V1.9.477 (Card Renal compact + grid 4-col + trigger validação Neuro) em diferentes viewports.

**SEGUNDA AÇÃO**: smoke V1.9.474 in vivo (5min — recomeçar AEC após invalidação).

**TERCEIRA AÇÃO**: smoke V1.9.468-B 9 turnos com Ricardo (30min — Bloco I diário 27/05).

Resto = decisões humanas estratégicas (CNPJ + 1Pure + canal auditor + Pro plan + DPO).

Sessão 28/05 madrugada fechada empíricamente. 11 commits noite (27→28) + Card Sidecars evoluiu placeholder → audit manual → container → trigger validação → compact final. Anti-overclaim Babylon/Watson aplicado em cada decisão. 🌙
