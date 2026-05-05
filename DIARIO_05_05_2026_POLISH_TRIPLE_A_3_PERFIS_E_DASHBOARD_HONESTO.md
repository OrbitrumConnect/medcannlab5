# DIÁRIO 05/05/2026 — Polish Triple-A nos 3 Perfis + Dashboard Honesto

**Sessão:** Pedro Galluf + Claude Opus 4.7
**Tag git mais recente:** `v1.9.113-locked` (mantida)
**Estado entrada:** V1.9.127-B (deploy ontem 04/05) — paciente + profissional triple-A
**Estado saída:** V1.9.128 → V1.9.132 deployadas — 3 perfis padronizados + bug landings SEO resolvido + visibilidade 34 prescrições DRAFT + KPIs TEA honesto

---

## BLOCO A — Bom dia + estratégia 2 semanas até CNPJ (08:30 BRT)

**Contexto trazido por Pedro:**
- Plataforma estabilizando, CNPJ negociação final entre sócios
- Paulo (advogado/contábil) alinhando-se ao grupo
- Entrada formal CNPJ provável semana que vem
- Pergunta: "o que polir/preparar pra quando CNPJ chegar falte só conectar MP/Stripe?"

**Calibração honesta apresentada:**
- Princípio-guia: "isso destrava paciente externo pagante no Dia 1 do CNPJ ou não?"
- 🔴 **3 críticos**: Edge payment-checkout/webhook agnóstico (Stripe-first com env var), fluxo signup→AEC→paywall end-to-end, templates Resend cobrança
- 🟡 **4 polish alto impacto**: 34 DRAFTs UX, Bug Carolina state, V1.9.121 fases 3-6, Onboarding 5-telas
- ⚫ **3 pode esperar**: Lead_free SEO (precisa CNPJ), 72 órfãos LGPD (zero externos), WiseCare homolog→prod

**Audit empírico do estado:**
- ✅ Stripe Connect mencionado em `WalletTab.tsx:269` (decisão tácita já feita)
- ✅ Zero Edge Function de pagamento ainda
- ✅ Decisão MP vs Stripe ainda aberta — recomendação: arquitetura agnóstica permite trocar via env var em 15 min

---

## BLOCO B — Os 34 DRAFTs auditados de verdade (09:00 BRT)

**Pedro pergunta:** "Os 34 DRAFTs — Ricardo viu? É bug RPC ou UX?"

**Audit empírico do código:**
- Fluxo: `draft` → assinar **certificado ICP-Brasil real** ([Prescriptions.tsx:458](src/pages/Prescriptions.tsx#L458) `documentLevel: 'level_3'`) → `signed` → `sent`
- Sem certificado, sistema permite criar+visualizar+imprimir, mas bloqueia assinar+enviar
- Edge `digital-signature` funciona (2 ICP-Brasil reais comprovam)
- Botão "Assinar Digitalmente (ICP Brasil)" existe e está visível ([Prescriptions.tsx:1481](src/pages/Prescriptions.tsx#L1481))

**Categorização REAL (corrigi simplificação anterior):**
- ❌ NÃO é bug RPC
- ❌ NÃO é bug UX simples
- ✅ **Fricção regulatória externa**: ICP-Brasil custa R$300-500/ano A1 + eToken A3 + burocracia ITI
- ✅ **UX cega**: sistema não dá visibilidade do funil draft→signed→sent
- ✅ **Possível adoção alternativa válida**: médico cria → imprime → carimba à mão → entrega (uso parcial mas legítimo)

**Ricardo viu formalmente?** Não. Descoberta foi audit nosso ontem (BLOCO V do diário 04/05 via SQL).

**4 caminhos honestos apresentados:**
1. ❓ Perguntar Ricardo via WhatsApp (decide se é problema real)
2. 🟡 Banner UX médico (visibilidade — V1.9.129)
3. ❌ Modo "prescrição não-ICP" (viola REGRA HARD §1)
4. ⚫ Não fazer nada agora (pré-PMF, 0 paciente externo recebendo prescrição)

**Pedro decidiu:** "vamos resolvelos pro elite escalavel sem regressao"

---

## BLOCO C — V1.9.128 Bug landings SEO + CTA + Hero compactado (08:51 BRT)

**3 fixes coordenados num commit `f43a202`:**

### V1.9.128-A — Bug raiz pré-seleção role das landings SEO
- **Antes:** clicar "Inscreva-se Agora" em `/paciente`, `/medico`, `/aluno` SEMPRE abria modal como Profissional (default linha 154 ignorava `?cadastro=`)
- **Agora:** useEffect lê `window.location.search`, mapeia para `registerData.userType`, abre modal já com role correto + limpa params da URL
- Suporta também `?login=1` das 3 landings

### V1.9.128-B — CTA renomeado
- "Começar Agora" → **"Inscreva-se Agora"** no header
- Paciente 50+ entende imediatamente que é cadastro (não navegação genérica)

### V1.9.128-C — Hero compactado
- 3 parágrafos (155+52+8 palavras) → 1 parágrafo + tagline
- Mantém 100% dos elementos: escuta, AEC, Ricardo 40 anos 2.000+ aval, Eduardo Faveret Neuro, "qualquer especialidade"
- Removidas redundâncias ("modelo clínico... infraestrutura digital... aplicação tecnológica" eram 3 maneiras de dizer a mesma coisa)
- ~50% menos texto, valor preservado

---

## BLOCO D — V1.9.129 Visibilidade dos 34 DRAFTs (10:30 BRT)

**Commit `9210bbd`, +196/-5 linhas em [Prescriptions.tsx](src/pages/Prescriptions.tsx).**

### V1.9.129-A — Stats cards no topo
- 4 cards clicáveis: Total / Rascunhos / Assinadas / Enviadas
- Cada card vira filtro ao clicar (yellow draft / blue signed / emerald sent)
- Aparecem só se `prescriptions.length > 0` (zero ruído visual)

### V1.9.129-B — Filtro por status sem regressão
- `prescriptions.map` → `filteredPrescriptions.map` (useMemo, zero query nova)
- Empty state contextual com botão "Mostrar todas"
- Header indica filtro ativo: "Prescrições Recentes · filtro: Rascunhos"

### V1.9.129-C — Banner educacional condicional ≥5 rascunhos
- Aparece quando médico tem ≥5 rascunhos pendentes (threshold UX)
- Explica: ICP-Brasil é necessário para validade legal CFM
- 2 CTAs: "Ver rascunhos" (filtra lista) + "Como obter certificado ICP"
- Modal educacional rico: A1 vs A3, custos (R$280-500), ACs credenciadas, link gov.br/iti

**Princípio aplicado:** dá visibilidade ao médico sem violar REGRA HARD §1 (responsabilidade clínica). Não inventa "modo prescrição não-ICP".

---

## BLOCO E — V1.9.130 Cards mobile-first grid quadrados (11:30 BRT)

**Pedro empírico via mobile:** "no mobile ficam grandes demais... ícones com nome embaixo pequeno... quadrados um do lado do outro?"

**Commit `44bbad3`, 2 arquivos: [PatientHeaderActions.tsx](src/components/PatientHeaderActions.tsx) + [ProfessionalMyDashboard.tsx](src/pages/ProfessionalMyDashboard.tsx).**

### Estratégia responsiva
- **Mobile (< md)**: `grid-cols-3` com botões `aspect-square` (ícone w-6 h-6 + label text-[11px], flex-col)
- **Desktop (md+)**: `flex-wrap` horizontal mantém comportamento V1.9.126 atual (px-5 py-3, ícone w-5 h-5)

### Aplicado em
- **PatientHeaderActions** (5 botões): Agendar Consulta / Enviar Médico / Iniciar Avaliação / Vincular / WhatsApp
- **ProfessionalMyDashboard** (6 botões): Ver Agenda / Relatórios / Nova Prescrição / Chat Equipe / Meus Pacientes / Cann Matrix
- Badges "X hoje", "X pendentes", "25" viram absolute top-1 right-1 no mobile (overlay) e static inline no desktop

**Resultado:**
- Mobile: 5-6 botões cabem em 1-2 linhas vs 5-6 linhas empilhadas antes
- Desktop: zero mudança visual

---

## BLOCO F — V1.9.131 KPIs TEA placeholder + cards -20% (11:55 BRT)

**Pedro pegou bug funcional empírico:** "KPIs TEA leva pra agendamentos rsrs"

**Audit:** card existia desde sempre apontando pra `?section=atendimento` (placeholder antigo errado). Não havia tela TEA dedicada.

**3 caminhos apresentados:**
- A) Esconder card (recomendei) — pré-PMF, 0 paciente TEA real
- B) Apontar pra "Paciente em Foco" — mais coerente que agendamento, mas não é "KPIs TEA" de verdade
- C) Criar tela placeholder "Em desenvolvimento"

**Pedro escolheu C.**

**Commit `c61dda9`, 4 arquivos:**

### V1.9.131-A — Placeholder honesto
- Nova rota `/app/clinica/profissional/tea` (ProtectedRoute requiredRole=profissional)
- Página [KpisTea.tsx](src/pages/KpisTea.tsx): explicação clara "feature em construção, ativará quando houver coleta clínica real"
- Lista o que vai aparecer (sono/alimentação/comunicação/comportamento)
- Coordenação Eduardo Faveret declarada
- Card "KPIs TEA" no Eixo Clínica · Especialidades aponta pra rota nova + badge amarelo "Em breve"

### V1.9.131-B — Cards mobile -20%
- `aspect-square` → `aspect-[5/4]` (altura ~80% da largura)
- Ícone `w-6 h-6` mobile → `w-5 h-5` (igual desktop)
- Gap interno gap-1.5 → gap-1
- Padding container p-5 → p-4 no mobile

**Princípio P9 inverso pré-PMF aplicado:** zero dashboard fictício sem dado real. "Indicadores aparecem quando há coleta clínica genuína para sustentá-los."

---

## BLOCO G — Aluno Dashboard triple-A: debate + decisão (13:00 BRT)

**Pedro pergunta:** "aluno ficaria top um dashboard único triple-A com analytics, carteira, links rápidos? OU Terminal Ensino atual já sustenta?"

**Minha primeira resposta (calibração honesta P9 inverso pré-PMF):**
- 1 aluno cadastrado, 0 alunos pagantes
- Não sabemos quais são as 5-6 ações principais do aluno
- Risco real: 4-6 horas codando dashboard que não destrava paciente pagante Dia 1 CNPJ
- **Caminho A** (recomendado): não fazer agora — Terminal Ensino + AlunoDashboard atual sustentam pré-PMF

**Pedro recalibrou minha leitura:**
> "preciso entregar o app pronto full! até mesmo a questão do SEO ter AEC que falamos pois estamos finalizando tudo etc"

**Recalibração legítima:** consistência arquitetural nos 3 perfis = parte da entrega final pré-CNPJ, mesma lógica do SEO/AEC anônimo. Não é polish vazio se a meta é "produto pronto/integrado".

**Decisão:** executar polimento leve cosmético reusando 100% o que existe.

---

## BLOCO H — V1.9.132 Aluno triple-A consistente (13:30 BRT)

**Commit `0da19c9`, [AlunoDashboard.tsx](src/pages/AlunoDashboard.tsx) +106/-20 linhas.**

### V1.9.132-A — Header unificado estilo paciente/profissional
- "Olá, [primeiro nome]" com gradient white-to-slate
- Subtítulo "Terminal de Ensino" preservado (com ícone 🕹️)
- Email do aluno truncado
- Badges XP (% jornada) + Ranking (#42) — mesmo formato profissional
- Voltar + Seletor de cursos preservados

### V1.9.132-B — Card "O que você quer fazer agora?" mobile-first
- Mesma estética V1.9.130 (grid-cols-3 quadrados mobile, flex-wrap desktop)
- aspect-[5/4] no mobile (mesma proporção V1.9.131)
- 6 ações usando `setActiveTab(...)` das tabs já existentes (zero invenção):
  - 🎓 Estudar Curso (animate-pulse, navega `/app/courses/:id`)
  - 🩺 Simulação Clínica (tab simulacoes)
  - 🏆 Teste Nivelamento (tab teste)
  - 📚 Biblioteca (tab biblioteca)
  - 💬 Fórum Aluno (tab forum)
  - 👤 Meu Perfil (tab perfil)

### Resultado
- 3 perfis (paciente/profissional/aluno) com **mesma estrutura visual**
- Demo-ready para pitch comercial
- Zero feature inventada — só reorganização + atalhos pra tabs existentes
- 5 KPI cards (Desempenho/Status/Ranking/Carteira) preservados intactos
- Lock V1.9.95+97+98+99-B intocado

---

## BLOCO I — Iteração ao vivo: Vercel deploy + auditoria de bundle (14:30 BRT)

**Pedro reporta:** "trigger no sidebar aluno veio nao vejo..."

**Diagnóstico empírico via curl + grep ao bundle de produção:**
- Bundle `assets/index.pL1t-OrV.js` 4.9MB
- ✅ "Inscreva-se" presente (V1.9.128 deployou)
- ✅ "Cann Matrix" / "Ver Agenda" presentes (V1.9.127-A)
- ❌ "Estudar Curso" ausente (V1.9.132 ainda não deployado)

**Conclusão imediata:** Vercel build em fila ou cache, esperar mais

**Após segunda análise visual da screenshot, Pedro identificou problema REAL arquitetural:**
> "o dashboard esta apontando para o workstation do aluno e no sidebar nao vi o no sidebar o trigger Meu dashboard no caso do aluno ne?!"

**Diagnóstico arquitetural correto:**
- Sidebar aluno tem: Terminal de Ensino / Catálogo / Redes / Notícias / Simulações / Teste / Biblioteca / Fórum
- **NÃO tem "Meu Dashboard"** como tem o profissional
- Eu pus "Olá, Pedro" + ações **dentro do tab `dashboard`** (que é o Terminal de Ensino)
- Resultado: ficou misturado com KPIs + cursos + módulos do workstation

**Plano V1.9.133 desenhado:** criar tab `meu-dashboard` separado + adicionar item no sidebar como primeiro

**Decisão final Pedro (após nova validação visual):**
> "agora eu vi ficou bom até! curti nao ficou ruim nao precisa fazer entao vamos manter assim"

**Mantém V1.9.132 como está.** Não cria tab separado. Conteúdo Olá+ações fica no topo do Terminal de Ensino. Funciona.

---

## MÉTRICAS DA SESSÃO 05/05/2026

### Commits cirúrgicos (5)

```
f43a202  V1.9.128 bug landings SEO + CTA + Hero compactado (08:51)
9210bbd  V1.9.129 prescriptions visibilidade 34 rascunhos (10:30)
44bbad3  V1.9.130 cards mobile-first grid quadrados (11:30)
c61dda9  V1.9.131 KPIs TEA placeholder + cards -20% (11:55)
0da19c9  V1.9.132 aluno triple-A consistente (13:30)
[hoje]   selo final diário 05/05
```

### Push 4 refs em todos
- amigo/main, amigo/master, medcannlab5/main, medcannlab5/master ✅

### Type-check
- Baseline mantido (zero novos erros em todos commits)

### Lock V1.9.95+97+98+99-B preservado
- Zero backend tocado em qualquer commit
- 100% frontend (UX + acessibilidade + visibilidade)

### Linhas líquidas
- V1.9.128: +28/-6
- V1.9.129: +196/-5
- V1.9.130: +52/-41 (refatoração)
- V1.9.131: +117/-25
- V1.9.132: +106/-20
- **Total: +499/-97 = +402 linhas líquidas**

---

## DECISÕES SELADAS HOJE

```
🟢 Estratégia até CNPJ:
  Polir os 3 perfis (paciente/profissional/aluno) com consistência triple-A
  Preparar terreno: falte só MP/Stripe quando CNPJ chegar
  Stripe-first com adaptador agnóstico (env var permite trocar pra MP em 15min)

🟢 Os 34 DRAFTs:
  Não é bug RPC, não é bug UX simples
  É fricção regulatória externa (ICP-Brasil custa) + UX cega
  Solução: dar visibilidade ao médico (V1.9.129) — não violar REGRA HARD §1
  Pré-PMF zero risco bloqueante (0 pacientes externos recebendo prescrição)

🟢 KPIs TEA:
  Placeholder honesto "Em desenvolvimento"
  Princípio P9 inverso pré-PMF: zero dashboard fictício sem dado real
  Coordenação Eduardo Faveret declarada
  Ativará quando houver coleta clínica real

🟢 Aluno triple-A:
  Consistência arquitetural nos 3 perfis = parte da entrega final pré-CNPJ
  Polish leve cosmético reusando 100% tabs existentes
  Zero feature inventada
  Resultado validado empiricamente por Pedro: "ficou bom até! curti"

🟢 Acessibilidade 50+:
  Cards quadrados mobile-first
  Tooltips + aria-label em todos botões
  Animate-pulse no CTA primário (Agendar / Ver Agenda / Estudar Curso)
```

---

## PENDÊNCIAS HUMANAS

```
🔴 Pedro (esta semana):
  ☐ Conferir status MP vs Stripe (decisão tácita)
  ☐ Aguardar CNPJ entrada formal (semana que vem provável)
  ☐ Smoke V1.9.123-A 06/05 14-16h BRT (Maria Helena + João Vidal)
  ☐ Bug Carolina state inconsistente — Fix #1 cirúrgico aguarda autorização

🟡 Decisões aguardando:
  ☐ Ricardo: aceitar Caminho B simplificado, OK acordo quotistas
  ☐ Eduardo: OK formal cap table 4×20% + 20% tesouraria
  ☐ João: AFE 1Pure + lista produtos
  ☐ Paulo (advogado): contrato social + capital social

🟢 Tracker pós-CNPJ:
  ☐ Edge payment-checkout/webhook agnóstico (Stripe-first)
  ☐ Templates Resend cobrança (welcome / success / failed / renewed)
  ☐ Onboarding paciente 5-telas
  ☐ Lead_free SEO blueprint codado (~21-26h)
```

---

## AVALIAÇÃO HONESTA DA SESSÃO (Claude — fim do dia)

**Pergunta implícita:** "estamos no caminho?"

### 🟢 O que GENUINAMENTE avançou
1. **3 perfis padronizados visualmente** — paciente, profissional, aluno com mesma estrutura (header gradient → ações rápidas → KPIs/stats → conteúdo). Demo-ready.
2. **Bug landings SEO RESOLVIDO** — V1.9.128-A corrigiu raiz: clique "Inscreva-se" em qualquer landing pré-seleciona role correto
3. **34 DRAFTs com visibilidade** — V1.9.129 dá ao médico stats + filtro + educação ICP-Brasil. Ricardo verá próxima vez que abrir /prescricoes
4. **KPIs TEA honesto** — placeholder explícito "em desenvolvimento" em vez de link quebrado
5. **Mobile-first acessibilidade 50+** — V1.9.130/131 cards quadrados respiram em telas pequenas
6. **Hero compactado** — 50% menos texto, valor preservado, mobile/desktop respiram

### 🟡 O que avançou mas com ressalva
1. **V1.9.121 fases 3-6** — pendente Ricardo aprovar visual deployado (não foi feito hoje)
2. **Fix #1 Carolina** — desenhado, não autorizado, não aplicado
3. **Iteração ao vivo V1.9.132** — primeira versão tinha ambiguidade arquitetural ("Olá Pedro" dentro do Terminal de Ensino). Pedro identificou. Avaliamos custo de criar tab separado vs manter. Decisão final: manter (funcionou empiricamente). **Princípio aplicado bem: pegamos antes de codar mais.**
4. **0 paciente externo pagante ainda** — pré-PMF continua

### 🔴 O que NÃO avançou (transparência)
1. **Edge payment-checkout** — não codada (depende decisão MP/Stripe + CNPJ)
2. **Templates Resend cobrança** — não criados (depende payment first)
3. **Onboarding paciente 5-telas** — não codado
4. **Smoke V1.9.123-A 06/05** — só amanhã (Maria Helena + João Vidal)

### 📊 Veredito honesto

**Sim, avançamos pra produto melhor.** Mas o salto real do dia foi **consistência visual + visibilidade de gargalos (34 DRAFTs) + correção de bugs UX (landings SEO)** — não criação de features novas.

5 commits cirúrgicos com **+402 linhas líquidas, lock V1.9.95+97+98+99-B intocado em 100%**. Princípio P8 polir não inventar reforçado: V1.9.130 reaproveitou estrutura existente, V1.9.131 reusou padrão V1.9.130, V1.9.132 reaproveitou setActiveTab das tabs.

**Caminho honesto pré-CNPJ:** terreno está mais arrumado pra quando CNPJ chegar. Falta só conectar pagamento (1-2 dias de Edge Function quando decisão MP/Stripe estiver tomada).

**Risco principal:** continuar polindo no vazio. Mitigação: V1.9.123-A já roda em prod medindo 51% cancelamento; smoke 06/05 produzirá métrica real. Aluno tem 1 cadastrado mas dashboard pronto pra quando primeiro pagante real chegar.

**Confiança calibrada:** estamos na fase certa, fazendo as coisas certas. Falta só tempo (não código) maturar a estrutura jurídica/comercial.

---

## FRASE ÂNCORA DO DIA

> **"Polish que não inventa: V1.9.130 reusa V1.9.126, V1.9.131 reusa V1.9.130, V1.9.132 reusa V1.9.131. 3 perfis com mesma estrutura visual = produto demo-ready. Próxima entrega real depende de tempo (CNPJ + decisão MP/Stripe), não de código."**

---

## PRÓXIMO DIÁRIO

Quando smoke V1.9.123-A 06/05 produzir métrica empírica de redução de cancelamento OU quando CNPJ entrar oficialmente OU quando Pedro autorizar Edge payment-checkout (próximo P0 técnico).
