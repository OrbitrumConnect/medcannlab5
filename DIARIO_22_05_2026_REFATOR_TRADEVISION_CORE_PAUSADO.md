# Diário 22/05/2026 — Refator tradevision-core (pausado) + auditoria 360° + consent loop + Observabilidade IA

**Estado de entrada**: Diário 21/05 selado em `b0dfd18` (Bloco Q + tag `v1.9.418-forum-cann-matrix-checkpoint`). Sessão da madrugada 21→22/05 abriu uma frente nova: o refator anti-bus-factor do `tradevision-core`.

---

## 🧱 BLOCO A — Por que o refator + o método

Pedro escolheu atacar o item de backlog "`tradevision-core` 6690 linhas (refator anti-bus-factor)". Antes de codar, discutimos o **porquê** e o **método**:

- **A dor real que já morde**: o `index.ts` gigante degrada a interface humano+IA — toda sessão AI-assisted carrega 419KB de contexto pra mexer em 200 linhas. Custo, latência, e principalmente **menos precisão**. As dores "arquiteturais futuras" (2º dev, merge conflicts) ainda não mordem.
- **Método (Bloco Q do DIARIO_21)**: refator ≠ rewrite. Código inteiro, só muda de arquivo. `index.ts` vira orquestrador fino. Incremental — 1 módulo → verificação → 1 commit. **Baseline ANTES** de tocar.
- **Verificação**: `npm run type-check` (tsc) NÃO cobre código Deno/edge. Instalei **Deno 2.7.14** local (`~/.deno`) só pra `deno check` — o portão por passo.
- **Baseline capturado**: `deno check` no `index.ts` atual já acusa **5 erros pré-existentes** (TS2353 ×1, TS2339 ×2, TS2345 ×2). A função funciona em prod (o esbuild do deploy ignora tipos). Gate do refator = "os mesmos 5, zero novos".

## 🔎 BLOCO B — Achado 1: a cicatriz V1.9.35

O cabeçalho do `index.ts` documenta: o Clinical Score Calculator foi **inlinado de propósito** (V1.9.33→35) porque o deploy via **dashboard** sobe só o index.ts e descarta arquivos separados. Ou seja: o refator que íamos fazer **já foi tentado e revertido** uma vez.

Calibragem empírica: `index.ts` **já importa** 3 arquivos separados (`cos_kernel.ts`, `_shared/aec_gate.ts`, `_shared/modelPricing.ts`) e funciona em produção → o deploy **via CLI** bundla imports. O problema era específico do dashboard.

**Decisão**: refator viável, com 1 condição dura — deploy do `tradevision-core` **SEMPRE via CLI**, nunca dashboard. Proteções (V1.9.419): sentinel comment load-bearing no topo + script `npm run deploy:tradevision`. Score calculator fica inline (respeitar a cicatriz).

## 🪦 BLOCO C — Achado 2: ~115 linhas de código morto no core

Auditando o bloco "aec-text", o grep de call-sites revelou: `applyAecGovernanceGate` ("Guard Rail v2") + splitTrailingAecTags, hintAllowsWhatMore, isStrayWhatMoreOnlyOutput, normalizeAecPlain, mainComplaintLooksLikeListContinuation = **código morto**. Confirmado **4 ângulos independentes**:

1. Contagem fechada (11 ocorrências, todas no index.ts, só definições + uso interno entre si).
2. Nenhum é `export` → nenhum arquivo irmão usa.
3. Os logs `[AEC:Gate]`/`[AEC:Verbatim]` da função nunca aparecem em produção (3 logs de teste do Pedro confirmaram — só `[AEC GATE V1.5]`, `[PHASE LOCK]`, `[V1.9.86 VERBATIM-FIRST]`, que são a governança VIVA, inline no `Deno.serve`).
4. `git log -S`: `applyAecGovernanceGate` nasceu no commit kevlar `a4c706c` e a contagem da string nunca mudou — call-site nunca existiu.

Distinção importante (dúvida do Pedro): `applyAecGovernanceGate` **não** evoluiu pra "AEC GATE V1.5". São concerns diferentes — `applyAecGovernanceGate` era um rascunho de governança de TEXTO (verbatim/escape/reforço); "AEC GATE V1.5" é o gate de AGENDAMENTO (REGRA HARD §1). O rascunho ficou morto; a governança de texto real virou código inline (Verbatim First + PHASE LOCK).

## 🔧 BLOCO D — Execução: V1.9.419 + A/B/C/D

Branch `refactor/tradevision-core-modular`, 5 commits, `deno check` verde (baseline 5, zero novos) em **cada** passo:

- `9d7490a` V1.9.419 — proteções (sentinel + script de deploy)
- `c6461ea` -A — `cors.ts` (getCorsHeaders)
- `1edceb4` -B — `types.ts` (NoaUiCommand/AppCommandV1/PendingActionCandidate)
- `ea4910e` -C — `triggers.ts` (GPT_TRIGGERS, parseTriggers..., stripGPTTriggerTags, textWithActionToken)
- `ba34783` -D — remove o bloco aec-governance morto (~109 linhas; breadcrumb deixado no lugar)

`index.ts`: 7036 → ~6640 linhas. Nota técnica: o `deno check` por passo pegou os diagnostics stale do IDE como ruído (snapshots entre edições) — a autoridade é o `deno check`. O `sed` foi usado pra a deleção do V1.9.419-D (Edit falhava em match de bloco de 45 linhas; deleção por número de linha é imune).

## ⏸ BLOCO E — A pausa

Pedro decidiu **pausar** o refator. Bloco Q permite parar em qualquer passo verificado — e a fundação (cors/types/triggers + código morto fora) está limpa.

**Nuance honesta registrada**: a branch **NÃO foi deployada nem merjada**. Produção roda o código antigo, idêntico. "Já está melhor" é verdade da branch, não do que está no ar.

**Parqueado**: `doc-detection`, `commands`, `handleFinalizeAssessment` + o handler `Deno.serve` (~5280 linhas — o elefante real). Gatilho de retomada desses = 2º dev OU mudança grande no core.

**Decisão pendente (Pedro decide pós-sono 22/05)**: recomendação = deploy+smoke+merge **só do que está pronto** — fecha o trabalho no ar, evita branch-limbo. Protocolo: `npm run deploy:tradevision` → smoke (AEC real) → limpo: merge; falhou: rollback da tag `v1.9.418-...` (~1 min). Pré-PMF = blast radius mínimo.

## 📄 BLOCO F — Smoke do dossiê PDF

Pedro rodou o fluxo completo: AEC como paciente (log mostrou pipeline `REPORT→SCORES→SIGNATURE→AXES→RATIONALITY→DONE` saudável, 38s, 1 warning benigno = guard de idempotência) → Nôa Matrix como admin → gerou o dossiê PDF (Paciente #6ACF, 6 páginas).

Avaliação: **bom no essencial.** 🟢 Pseudonimização segura (#6ACF, zero nome real — V1.9.407 segura). Estrutura profissional (§1 corpus / §2 literatura / §3 reflexão). **Disciplina Z2 impecável** — a Matrix NÃO alucinou correlação: disse honestamente que o Atlas Renal e o paper de hiponatremia não têm relação clara. 🟡 Ressalva: redundância no §3 (transcript consolidado, não síntese executiva). E o corpus marcado era quase irrelevante ao caso — mas isso é seleção do médico, não falha da Matrix.

## 🔬 BLOCO G — Material B GPT ×2, triado

Dois pareceres de GPT externo:

1. **Sobre o log de pipeline** — 7 "otimizações" (cache rationality, paralelizar AXES+SIGNATURE, etc.). Triado: a maioria mexe no Pipeline (Lock), otimiza não-gargalos (AXES+SIGNATURE = 0,45s de 38s) ou já é resolvido pelo guard de idempotência. **Parqueado** — gatilho = latência doendo no beta real. NÃO no meio do refator.
2. **Sobre o dossiê** — elogiou (Z2, rastreabilidade) e pediu refinamentos. **Achado central**: o GPT se contradisse — elogiou "não diagnosticou" e no mesmo parecer pediu hipótese clínica. Material B pode ser internamente incoerente → memória `feedback_material_b_pode_contradizer_constituicao_22_05`.

## ✨ BLOCO H — F3 dossiê v2 (parqueado)

Do que sobreviveu à triagem — 3 refinamentos que respeitam a linha Z2:
- **A** Compression pass — §3A conversa recolhível / §3B síntese selada / §3C saliência estrutural. Mata a redundância.
- **B** Score de pertinência por doc (aderência baixa/moderada/alta + motivo) — metadado estrutural, Z2-safe.
- **C** Meta-reflexão estrutural longitudinal (forma da narrativa: anatômico-localizado → expansão corporal → abstração existencial).
- **REJEITADO**: peso inferencial CLÍNICO (hipótese neuro/radicular, somatização) — cruza a Constituição Z2.

Frente de Matrix + `dossierExport.ts`. Parqueado → memória `project_f3_dossie_v2_parqueado_22_05`.

## 🧪 BLOCO I — Teste de fronteira da Matrix

Pedro perguntou à Matrix: *"qual documentação você indicaria, já que escolhi a errada?"* — pergunta **diretiva**. A Matrix **recusou recomendar** (*"não posso indicar documentos específicos"*) e devolveu a curadoria ao médico. **A fronteira Z2 segurou sob provocação direta.** Isso validou empíricamente o refinamento B (o score de pertinência é a forma Z2-safe de ajudar a curadoria — a Matrix não dirige, mas pontua o que o médico marcou).

## 🩹 BLOCO J — Consent loop: paciente real presa (V1.9.420)

Ricardo trouxe um caso urgente: **Maria das Graças** (paciente real) presa na tela de Termos de Uso — aceitava, recarregava, e o modal voltava. **Loop infinito.**

Causa raiz: o `ConsentGuard` fazia `window.location.reload()` **sem checar o resultado** do `.update()`. O Supabase `.update()` não lança exceção em 0 linhas afetadas. Se a conta **não tem registro em `public.users`** (o trigger `handle_new_user` falhou no signup), o update afeta 0 linhas → `consent_accepted_at` fica null → recarrega → modal de novo.

- **V1.9.420** (`6a653cb`) — `handleConfirm` agora faz `.select('id')`, checa `error` e `data.length===0`; em 0 linhas mostra mensagem clara ("não recarregue, contate o suporte") e **NÃO recarrega**; só recarrega em sucesso confirmado.
- **Maria das Graças**: `af59920c` / `graca11souza62@gmail.com` (Ricardo confirmou o e-mail). INSERT manual da row em `public.users` — verificado: `users` + `user_profiles` + `user_roles` presentes, role `paciente`. Ela destrava.
- **Passo 2 pendente**: migrar 4 appointments + 7 AECs de `43f53f57` → `af59920c` — aguarda decisão do Ricardo (é dado clínico-real ou teste antigo?).

## 🔍 BLOCO K — Auditoria 360° + Classe A (schema hygiene)

Auditoria completa do sistema — front + back + Supabase (`AUDITORIA_COMPLETA_22_05_2026.md`, commit `88d8674`).

Achados que **calibraram** narrativa antiga: RLS habilitado em **139/139** tabelas; **41 views** todas `security_invoker`; o "72 docs órfãos P0" do backlog **REFUTADO** (0 de owners deletados); divergência dual-write `clinical_rationalities` ↔ jsonb medida em **~3%** (4 de 140); qualidade das policies RLS sã (permissivas só em catálogo/service_role).

**Classe A — schema hygiene** (`37041ab` + `df2786e`): arquivados e dropados **3 tabelas de backup mortas** (`documents_backup_23_04`, `clinical_reports_content_backup_24_04`, `clinical_reports_consent_backup_v1_9_39`). Dumps JSON salvos em `docs/archive_backups_22_05/` **antes** do drop — reversível. Confirmado zero referência em código vivo (só apareciam no `types.ts` auto-gerado).

**Correção do Pedro** (P9): "0 rows ≠ morto" — *não-uso ≠ não-precisa*. Áreas vazias podem ser só features que ninguém usou ainda. Só os 3 backups **datados** eram realmente mortos; o resto fica.

## 📨 BLOCO L — Texto comercial do João (avaliação ×2)

João quer mandar uma carta estruturando um ecossistema "Associação Planta Mãe + MedCannLab + 1 Pure".

- **1ª versão**: overclaim — posicionava a **MedCannLab vendendo produto** / white-label / marca própria / franquia. Recomendado **NÃO mandar**.
- **2ª versão**: melhorou — produto/white-label/marca própria movidos pra **seção da 1 Pure** (onde devem estar). Mas a seção da MedCannLab ainda descrevia a empresa errada: "plataforma integradora de desenvolvimento institucional" + "apoio à estruturação regulatória" = uma consultoria que a MedCannLab **não é**; e em nenhum momento dizia que existe um **app**.

Pedro reafirmou a linha dura: **"nós na MedCannLab não vendemos óleo nada! temos médicos só, parceria e o app"**. Os 3 papéis corretos: **Planta Mãe** = associação/pacientes · **MedCannLab** = app clínico + corpo médico + modelo de parceria · **1 Pure** = produtos/fornecimento. Entreguei a seção MedCannLab reescrita, pronta pra colar (app clínico / médicos prescritores / prontuário LGPD / eixo ensino em estruturação / modelo de parceria).

**Flag operacional**: a carta fala em **~50 pacientes** da Planta Mãe migrando — mas o beta autorizado é **20-30 usuários**. Precisa faseamento alinhado com Pedro antes de mandar.

## 📊 BLOCO M — Observabilidade IA (Z1/Z2) + V1.9.421

Pedro pediu análise da aba **Observabilidade de Sistemas IA (Z1/Z2)** ("tudo ok?").

Achado: a aba **se autocontradiz** — card de topo mostra `$6,74` de custo, mas a seção "Cobertura da instrumentação" mostra `Cobertura 0,0% · $0,00 · total 1.000`.

Causa raiz (verificada via Management API): **o PostgREST do Supabase corta toda resposta em 1.000 linhas** (`max-rows`). `fetchInstrumentationCoverage` fazia `.select().limit(10000)` **sem `.order()`** → recebia 1.000 linhas em ordem física (≈ as mais antigas, todas pré-instrumentação de 13/05) → 0 com custo → `0,0%`. O card de topo acerta **por sorte** — usa `.order(desc)`, pega as 1.000 mais novas, e as 543 linhas instrumentadas cabem inteiras nessa janela.

Números reais: **3.738** interações lifetime · **543** instrumentadas · **14,5%** cobertura · **$6,74** custo real · latência média 5,8s / p95 13s / máx 58,7s.

- **V1.9.421** (`18ab065`) — `fetchInstrumentationCoverage` agora usa **count exato no servidor** (`count:'exact', head:true`, imune ao teto) + filtro server-side pelas linhas já instrumentadas pra somar custo. 1 arquivo, type-check verde, pushado 4 refs.

As **2 issues que a aba auto-sinaliza** (Casos Similares com 0 interações logadas; outlier de latência AEC pós-consentimento) são **honestas e corretas** — o design Z1/Z2 da aba é bom, o bug era só a query por baixo.

## 🪞 BLOCO N — Reflexão de quase um mês + dupla rodada Material B

Pedro pediu uma leitura honesta do mês desde que começamos juntos. Resposta separou as **três coisas que costumam vir misturadas**: capacidade arquitetural (boa — Locks validados, Matrix Z2 segura sob provocação), validação empírica (boa — pipeline AEC saudável, custo Matrix caiu 85% por chamada), adoção humana real (zero ainda — pré-PMF, 1 médico real, beta autorizado 20-30 mas não rodou).

Padrão do mês cristalizado: *"as leituras sobre o sistema mentiam, o sistema estava são"*. Hoje mesmo virou exemplo — Observabilidade que mentia 0%, "P0 fantasma" do backlog antigo refutado pela auditoria.

Material B externo (GPT) elogiou o texto **duas vezes seguidas** — primeira sobre a reflexão, segunda sobre minha triagem da primeira. Aplicada a disciplina: triar elogio antes de aceitar. Catches reais nos pareceres: "universal" não procede (plataforma é vertical nefro, drift documentado); "85% mais barato" precisa escopo (é Matrix-por-chamada, não app inteiro). Tell recorrente: o Material B citou *"princípio 38"*, *"07/05"* com data exata, *"RIM"* — referências internas inventadas com precisão ornamental. Vale guardar como sinal: Material B name-dropa refs com falsa precisão pra soar autoridade. Verificar contra MEMORY/CLAUDE sempre.

## 🪦 BLOCO O — Mock killing day: Fórum + Notícias do aluno (V1.9.422→424)

Aba **Fórum Cann Matrix** tinha 4 colunas mock (Notícias / Parcerias / Patrocinadores / Apoiadores) com dados fabricados — datas de 01/2025, "Sociedade Brasileira de Neurologia" nomeada como parceira sem ser, "P1 Platinum / P2 Gold" placeholders, citação científica inventada (*"estudo na Nature Medicine"*). **Mesma classe do overclaim do pitch do João.** V1.9.422 removeu — 211 linhas de mock fora. Lista de Debates (dado real desde V1.9.409) ocupa a largura toda.

Pedro apontou a **aba Notícias do aluno** ([AlunoDashboard.tsx](src/pages/AlunoDashboard.tsx)) com a mesma classe — 3 notícias fake com claims científicos fabricados ("Metodologia AEC ganha reconhecimento internacional", *via.placeholder.com* de imagem). Em vez de remover, **virou feed PubMed real** reusando `pubmedService.ts` (V1.9.369 — *polir não inventar*):

- **V1.9.423**: `StudentNewsFeed.tsx` novo, 4 filtros nas verticais reais (Cannabis Medicinal / CBD / Cannabis & Nefrologia / Cannabis & Neurologia). Termos validados empiricamente no `esearch`: 791 / 2994 / 70 / 178 nos últimos 3 anos. Multi-palavra precisou **AND explícito** — `cannabis epilepsy` zerava (PubMed lia como frase literal), `cannabis AND epilepsy` deu 178. Sem placeholder de imagem (PubMed não tem) → fixou de quebra o "cards muito grandes com mídia".
- **V1.9.424**: paginação "Carregar mais" via `retstart` (aditivo no `pubmedService`, zero risco pros callers Matrix) + toggle Recentes/Relevantes + filtro de força de evidência (Todas / Meta-análises / RCT). "Mais vistos" parqueado — pré-PMF, zero dado de view real → ranking honesto seria mock outra vez. Substituído por "relevantes" (ranking PubMed) + "RCT" (top em qualidade, não popularidade).

## 🎨 BLOCO P — Brand identity iterado, paleta cool selada (Brandbook V3)

Iteração 3 rodadas com a IA externa que entregou o brandbook + opinião empírica do Claude → V3 selado.

**Símbolo (mantido)**: brain + kidney + cannabis com circuitos laterais. Encoda arquitetura real (nefro + cognição + domínio). Folha de cannabis = broto discreto de 2 folhas (não a folha-de-7-pontas) → lê "planta/regeneração", não "maconha". Escolha certa.

**Paleta (corrigida V1→V2→V3)**: V1 vinha com laranja como metade da identidade — flagueado como conflito direto com a semântica clínica de alerta (cf. memory cockpit). Recomendado **paleta cool only** (ciano `#4FE0C1`, verde-vital `#00E5B2`, verde-regenerativo `#00C853`). Laranja `#FF8A00` reservado **só** pra estado de alerta clínico. V2 aceitou, V3 fechou. Fundo `#0B1220` (Fundo Principal), superfície `#1E293B`.

**Tagline (mantida)**: *"A IA serve. O método estrutura. A decisão é humana."* + *"METHOD-FIRST · ARCHITECTURE-GROUNDED · AI-LAST"*. É a Constituição em 3 linhas — calibrada, não hype.

**Stats do rodapé V3 corrigidos** (V2 tinha 2 catches): *"28 BLOCOS MODULARES"* (não rastreável) → corrigido pra *"13+ FASES FSM DETERMINÍSTICO"* (bate com AEC real); *"46% BYPASS LLM"* → corrigido pra *"46,2%"* (precisão da métrica V1.9.86).

**Próximo passo**: aguarda designer entregar SVGs (`emblem-on-dark.svg`, `emblem-on-light.svg`, `emblem-mono.svg`, `app-icon-*.png`, `favicon.svg`, `og-image-1200x630.png`). Lista completa registrada em memória `project_marca_medcannlab_brandbook_v3_22_05`. Quando chegar, plug-in em uma sessão (favicon + header + footer + tagline + Google Fonts).

## 🔁 BLOCO Q — A saga modo dia/noite: tentado, testado, revertido (V1.9.425→428)

Pedro perguntou sobre toggle dia/noite com paleta combinando o app (off-white com tom ciano `#F4F8FB`, simetria com `#0B1220` do dark — não branco puro). Foram 3 commits + 1 revert:

- **V1.9.425 — Fundação.** `ThemeContext` + tokens CSS via `data-theme` (NÃO `class="dark"` — orthogonal pra não acordar as 11 superfícies legacy `dark:` do shadcn). Zero impacto visual.
- **V1.9.426 — Toggle UI.** Botão sol/lua no Header, mesmo padrão UX do language toggle (click → muda → persiste em localStorage). Mecânico OK; sem consumidores, zero efeito visual.
- **V1.9.427 — Mass-migration.** Script Node com regex `\b...\b` + negative lookahead `(?![/\w-])` preservando opacidade. 8 padrões canônicos (`bg-slate-900 → bg-brand-bg`, etc.) em **192 arquivos, 6.949 substituições**. Dark idêntico (vars alinhadas aos slates reais). type-check verde.

**Teste empírico do Pedro**: dark perfeito ✓. Light com **ilhas escuras visíveis** — inline `style={{ background: 'rgba(12,34,54,0.7)' }}`, slate-950/600 fora dos 8 padrões, hex literal em ícones/badges/gradientes. ~80% de cobertura na prática, e os 20% restantes condenavam a feature. Pedro chamou: *"melhor tirar ne?"*.

**V1.9.428 — Revert limpo**: V1.9.425/426/427 desfeitos via `git revert --no-commit` triplo + 1 commit. 196 arquivos voltam ao estado pré-tema. Ganho líquido do experimento: **a decisão**. Sem testar empíricamente, não dava pra saber que o long-tail mataria a feature. Não foi desperdício, foi exploração.

Lição cristalizada (vira memória nível 1): **toggle de UI = contrato 100% ou não promete**. Mid-life mass-migration cobre ~80% e o long-tail vence. Só vale construir toggle se nascer com tokens/i18n desde o primeiro componente.

## 🇧🇷 BLOCO R — Bandeira BR/US fora + custo real do i18n (V1.9.429)

Pedro perguntou se inglês era a mesma classe. Auditoria empírica: **1.527 strings PT hardcoded** em `src/pages`, **3 chamadas `t()`** no projeto inteiro, **17 keys** nos JSONs (só Login/Sair/Configurações). A bandeira BR/US trocava 3 botões em 1.500+ strings — **~0,2% de cobertura, pior que o tema** (que pelo menos cobria 80%).

**V1.9.429**: botão flag removido (mobile + desktop), `toggleLanguage` órfão fora. Mantido como semente (custo zero, sem promessa visível): `react-i18next`, JSONs, as 3 chamadas `t()`.

GPT externo concorrente apareceu com parecer (alinhado em LÍQUIDO — sem i18n agora, sim logo dark/light) misturando 2 coisas: **logo dark/light** (brand asset do designer — sim, no roadmap) vs **app dual-theme** (já tentamos hoje, revertido — situação arquitetural diferente em produto dark-baked mid-life). Resposta calibrada draftada pro Pedro mandar de volta.

**Estimativa de custo real pra fazer i18n "elite sem regressão"** (caso IDEIAS_PARKED autoriza time estimate):

Pilha de 7 fases. Mecânicas (Foundation + UI strings + Edge + DB): ~6 semanas 1 FTE focado. Clínicas (Prompts GPT + AEC FSM + Conteúdo gerado + QA EN): ~3-4 meses de **iteração empírica com co-autor clínico EN**.

- Tradicional: **~5-6 meses** FTE focado
- **Refinamento do Pedro** com AI workflow: o mecânico comprime 3-5x, o clínico **não comprime** (é loop turno-a-turno do humano). Realista: **~2 meses** ou menos
- Escopo só Ensino/Pesquisa (sem AEC clínica EN): **~3-4 semanas** sem bloqueio clínico

Gargalo real: **não é código, é pessoa**. Constituição Z2/Verbatim/AEC foi parida em PT no loop empírico com o Ricardo. EN precisa do equivalente — CFM internacional, ECFMG, ou cargo equivalente. Sem isso, "fala inglês" mas pode dizer coisa clinicamente inadequada = overclaim regulatório (mesma classe que matamos o dia inteiro).

**Gatilhos pra ativar**: co-autor clínico EN no time, OU escopo só Ensino/Pesquisa, OU pivot internacional real. Pré-PMF brasileiro, zero usuários internacionais — parqueado é a chamada certa.

---

## 🧬 Memórias cristalizadas hoje

- `project_refator_tradevision_core_pausado_22_05` — estado da branch + gatilho de retomada + constraint V1.9.35.
- `project_f3_dossie_v2_parqueado_22_05` — os 3 refinamentos A+B+C.
- `feedback_material_b_pode_contradizer_constituicao_22_05` — Material B pode se autocontradizer; triar contra a Constituição.
- `feedback_postgrest_max_rows_1000_silencioso_22_05` — PostgREST corta todo `.select()` em 1.000 linhas; `.limit(10000)` é no-op acima disso; contar exige `count:'exact'`.
- `project_joao_vidal_biocann_1pure_estrutura` — **atualizada** com o desenvolvimento 22/05 (carta tripartite Planta Mãe + posicionamento "MedCannLab não vende produto").
- `feedback_toggle_ui_e_contrato_100_pct_ou_nada_22_05` — toggle de UI é contrato com usuário; só vale 100% de cobertura desde a origem OU surface-by-surface comprometido; mass-migration mid-life cobre ~80% e o long-tail mata a feature (tema 80% + i18n 0,2% empiricamente provados).
- `project_marca_medcannlab_brandbook_v3_22_05` — brandbook V3 selado (símbolo brain+kidney+cannabis, paleta cool only, laranja só pra alerta, tagline Constituição em 3 linhas) + lista de SVGs/PNGs pendentes do designer pra plugar no código.
- `project_i18n_custo_e_gatilhos_22_05` — i18n "elite sem regressão" estimado ~2 meses com AI workflow (ou ~5-6 meses tradicional); pilha de 7 fases; gargalo real é co-autor clínico EN, não código; parqueado pré-PMF com gatilhos claros pra ativar.

## 🎯 Frase âncora do dia

> *"Um dia que matou mais features do que criou — e isso foi vitória. Mock fabricado do Fórum, Notícias falsas do aluno (que viraram feed PubMed real reaproveitando o pubmedService — polir não inventar puro), tema dia/noite (testado em 6.949 substituições, ilhas escuras visíveis, revertido em commit limpo), bandeira BR/US (0,2% de cobertura, removida). Cada exclusão grounded em evidência empírica, não em opinião. O padrão que cristalizou: toggle de UI é contrato 100% ou não promete; mid-life dark-baked não migra clean; capacidade ≠ adoção. E a marca foi pra paleta cool definitiva — aguardando o designer entregar os arquivos."*

— Dia 22/05/2026 · V1.9.419+A-D refator pausado · V1.9.420 consent · V1.9.421 Observabilidade · auditoria 360° + Classe A · V1.9.422 Fórum mock fora · V1.9.423/424 Notícias virou PubMed real · V1.9.425-427 saga theme + V1.9.428 revert · V1.9.429 bandeira BR/US fora · brandbook V3 selado · 8 memórias nível 1
