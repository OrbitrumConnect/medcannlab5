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

## BLOCO J — V1.9.133 acesso direto Prescrições no sidebar pro + atalho Terminal Clínico (12:08 BRT)

**Trigger empírico Pedro:** abriu /clinica/prescricoes via URL direta e percebeu que profissional **não tem caminho de menu** pra essa página. Commit `5dcd344`.

**V1.9.133-A — Sidebar:** novo item "Prescrições Médicas" (ícone Pill) entre "Chat Clínico" e "Terminal de Pesquisa", apontando pra `/app/clinica/prescricoes`.

**V1.9.133-B — Atalho QuickPrescriptions:** botão "Ver todas / Rascunhos" ao lado de "Nova Prescrição" no header do Terminal Clínico tab=prescriptions.

**Triple-A escalável:** 3 caminhos pra mesma gestão (sidebar / atalho / URL direta + Nôa).

---

## BLOCO K — V1.9.134 Stats + banner ICP integrados no Terminal (12:17 BRT)

**Pedro pediu Opção D anterior:** trazer stats + banner ICP do Prescriptions.tsx PRA DENTRO do QuickPrescriptions sem perder os templates atuais. Commit `5890aaa`, +173 linhas.

**Adicionado no QuickPrescriptions:**
- 4 stats cards topo (Total/Rascunhos/Assinadas/Enviadas)
- Banner amarelo educacional condicional (≥5 rascunhos)
- Modal rico ICP-Brasil (A1 vs A3, R$280-500, ACs credenciadas, link gov.br/iti)
- Filtra por professional_id (stats individuais, não globais)
- Recarrega após showSuccess=true (criação reflete)

---

## BLOCO L — V1.9.135 fluxo unificado: médico nunca sai do Terminal (12:25 BRT)

**Pedro:** "tirar o trigger do sidebar [pra que] aba [vá] para o terminal e oq estiver no prescrição do terminal adaptar na aba nova só isso". Commit `006bc86`.

**V1.9.135-A — Sidebar redirecionado:**
- "Prescrições Médicas" no sidebar agora aponta direto pra `terminal-clinico&tab=prescriptions`
- Antes ia pra rota standalone `/app/clinica/prescricoes` (separava o fluxo)

**V1.9.135-B — Lista "Minhas Prescrições" integrada:**
- Cards reais do médico abaixo dos templates terapêuticos
- Filtro tabs: Todas / Rascunhos / Assinadas / Enviadas
- Limite 12 cards + link "Ver todas N" se houver mais
- Reusa `myPrescriptions` (V1.9.134) — apenas expandiu SELECT

---

## BLOCO M — V1.9.136 modernizar visual aba Prescrições (12:46 BRT)

**Pedro:** "esta meio fraca cards colados no sidebar grande falta coisas, modernizar". Commit `eb53c36`.

**V1.9.136 aplicada:**
- Container com padding `px-4 md:px-6 lg:px-8 py-4 md:py-6` (resolve "colado no sidebar")
- Stats cards com gradient lateral + ícone (FileText/AlertCircle/Lock/CheckCircle) + texto 3xl + sublabel
- Cards "Minhas Prescrições" estética Prescriptions.tsx:
  - Ícone tipo (Receituário Simples/Especial/Azul/Amarela) com gradient colorido
  - Status badge com dot pulsante animado
  - Glow line topo na cor do tipo
  - Medicação em "card dentro do card" com pills coloridas (dose/frequência/duração)
  - "+ N medicações" indicador
  - Footer Clock + data + ITI badge azul truncado ou CPF fallback
  - Hover: border emerald + scale ícone + shadow emerald

---

## BLOCO N — Briefing Paulo CNPJ (12:54 BRT) + refinamento pós-GPT review (13:07 BRT)

**Pedro decidiu:** montar briefing completo pra Paulo (contábil/jurídico amigo). Sem orçamento ainda — primeiro alinhamento.

**Commit `419045b` — versão inicial** (12 seções, 233 linhas):
- Visão MedCannLab (3 eixos)
- 4 sócios + cap table 4×20% + 20% tesouraria
- Capital R$5k vs R$10k (Paulo opina)
- 5 CNAEs propostos
- 7 cláusulas especiais (partes relacionadas, veto Ricardo, lock-up, ROFR, tag-along, ESOP, dissolução)

**GPT review trouxe 8 críticas certeiras:**
1. Paulo é **contador**, não advogado — escopo errado
2. Tesouraria 20% em Ltda → "reserva pra ESOP via acordo de quotistas/vesting/phantom"
3. Veto Ricardo → "veto técnico delimitado AEC, sem afetar governança geral"
4. CNAE 47.71 farmacêutico **REMOVER** (puxa AFE/ANVISA/farmacêutico responsável)
5. CNAE 86.50 médico manter FORA
6. Assinatura ICP-Brasil → "(em desenvolvimento)" — verdade técnica
7. Marca INPI → pedir indicação especialista PI separado
8. Reorganizar pontos abertos em 3 buckets (contábil/societário/operacional)

**Commit `5b9b1d1` — refinamento aplicado:** documento mantém densidade + sofisticação, mas com escopo correto. Paulo recebe perguntas que ele PODE responder com autoridade.

**Frase âncora final:** *"Tu resolve como a empresa nasce. Advogado depois resolve como os sócios não brigam."*

---

## BLOCO O — Blueprint WhatsApp Cloud API (11:45 BRT) — selo duplo Claude+GPT+Pedro

**Trigger:** Pedro debatendo com GPT sobre integração Nôa via WhatsApp. Compartilhou número canônico `+55 21 97463 2738` (RJ) — pendente conexão Cloud API.

**Análise crítica auditando ambiente real:**
- ✅ `users.phone` existe + populado
- ✅ Botões wa.me em frontend (PatientHeaderActions, ProfessionalSchedulingWidget, ShareAssessment, NewPatientForm)
- ✅ Mock WhatsApp em Edge `video-call-request-notification:128-135` (só console.log)
- ❌ Zero integração Meta Cloud API
- ❌ Zero Edge `whatsapp-webhook` ou `whatsapp-send`
- ❌ Zero sistema OTP

**Blueprint completo selado** (`docs/WHATSAPP_INTEGRATION_BLUEPRINT_05_05_2026.md`, 451 linhas):

**Decisões travadas (selo duplo):**
1. WhatsApp = apoio. App = produto. Toda função pesada retorna ao app.
2. **Modelo B (OTP visível só na sessão autenticada do app)** — superior a SMS, prova 3 coisas: acesso app + posse número + ato consciente
3. **Limite por COMPORTAMENTO** (msgs/AECs), tokens são budget invisível com degradação graceful aos 80%
4. AEC = evento (1/dia ou 3/sem), não cota diária
5. **Edge unificado** — reusa tradevision-core com `channel='whatsapp'`. Pirâmide 8 camadas aplica idêntica
6. **5 triggers automáticos redirect** ao app (sintomático, prescritivo, pedido relatório, agendamento, loop ≥5 msgs)
7. gpt-4o-mini default no canal zap (10x mais barato)
8. Debounce server-side 2.5s (~60% redução custo)
9. Anti-flood 3/min independente do tier
10. Tunabilidade via `feature_flags` existente (sem deploy)

**Tier table:**
| Tier | Chat zap/dia | AEC | Token budget/mês | Modelo |
|---|---|---|---|---|
| Trial | 5 | 1 lifetime | 50k | gpt-4o-mini |
| R$ 60 Pacto | 30 | 3/sem | 500k | gpt-4o-mini |
| R$ 149 Premium | 50 | ilimitado | 1M | gpt-4o (downgrade 80%) |
| Médico/Aluno | 100 | N/A | 2M | gpt-4o |

**Sequência implementação (pós-CNPJ):**
- Sprint 1 (~12h): notificações WhatsApp (lembretes 24h/1h)
- Sprint 2 (~16h): chat livre Nôa com gate consent + redirects
- Sprint 3 (~10h): operação + observabilidade + comandos LGPD

**NÃO codar agora**: pré-CNPJ + 0 paciente externo + 3 caminhos críticos não envolvem WhatsApp.

---

## BLOCO P — V1.9.137 bloqueio anti-abuso receita em rascunho (CFM 2.314/2022) (13:32 BRT)

**Trigger empírico:** Pedro abriu print preview do paciente, viu receita em rascunho com botão "Imprimir" liberado, faltando QR code + nome paciente + CRM/UF + endereço. Perguntou "está triple-A?".

**Audit empírico via PAT:**
```
35 prescrições draft (94.6%) — sem ITI, sem QR
 1 prescrição signed (com ITI + QR ✅)
 1 prescrição sent (com ITI + QR ✅)
```

**Risco real:** paciente imprime rascunho → leva à farmácia → farmácia recusa → percepção "produto quebrado". Mesmo com 0 paciente externo, qualquer teste interno reproduz.

**V1.9.137 aplicada — proteção em 4 camadas** (commit `31ba22a`):

1. **Helper `hasLegalValue`**: status IN (signed/sent/validated) AND (iti_qr_code OR iti_validation_url)
2. **handlePrint guard**: `window.confirm` com aviso CFM 2.314/2022 quando rascunho
3. **Banner amarelo modal**: "Receita em rascunho — sem valor legal" + explicação ICP-Brasil (oculto na print)
4. **CSS @media print marca d'água**: "RASCUNHO — SEM VALOR LEGAL CFM" rotacionada 30°, vermelho translúcido 18%, z-index 9999. Aparece SOMENTE em impressão E somente quando rascunho. Garante: mesmo se paciente força Ctrl+P, farmácia vê marca.
5. **Botão Imprimir contextual**: "Imprimir receita" verde se válida / "Imprimir rascunho" amarelo se draft

**PlanDetailModal (plano terapêutico) NÃO toca** — não é receita CFM, sem risco regulatório.

---

## BLOCO Q — Audit empírico estado real do banco (13:35 BRT, via PAT)

```
USUÁRIOS (39 total):
  patient        22  (incluindo Thiago Mansur, Carolina, Pedro Paciente, Pedro Alberto, Maria Helena, Carlos Eduardo, Othon, Carlos Felipe, Badhia)
  professional    9  (Ricardo + Eduardo + Ana Ventorini nova + 6 outros)
  admin           5  (Pedro + iaianoa + cbdrc + faveret + admin.test)
  paciente        3  (legacy PT — 3 anonimizados LGPD)

ATIVIDADE (últimos 7 dias):
  +8 novos users (5 pacientes externos potenciais!)
  6 appointments criados
  1.940 interações Core (uso real consistente)

CLÍNICO:
  98 reports clínicos (19 signed = 19.4%)
  1 AEC completa total + 3 AECs INTERRUPTED não-invalidadas
  73 appointments (35 cancelados = 47.9% — V1.9.123-A vai medir mudança)
  4 appointments completed

PRESCRIÇÕES:
  37 cfm_prescriptions (35 draft 94.6%, 2 signed/sent)
  0 medical_certificates cadastrados ❗ (NENHUM médico tem cert ICP-Brasil)
  0 thumbprints mock — confirmado: gargalo é ausência REAL, não bug código

MONETIZAÇÃO:
  0 transactions (zero pagamentos — pré-PMF confirmado)
```

**Insight crítico revelado pelo audit:** os 35 DRAFTs **não são bug nem UX cega**. É realidade pura: **NENHUM médico cadastrou certificado ICP-Brasil**. V1.9.131 placeholder TEA + V1.9.137 marca d'água são respostas honestas a esse vazio. Os 2 SIGNED+SENT do banco devem ser testes manuais via SQL/Edge mock (visto que cert_total=0).

---

## MÉTRICAS DA SESSÃO 05/05/2026

### Commits cirúrgicos (15 — sessão produto + docs)

```
PRODUTO (10 commits):
f43a202  V1.9.128 bug landings SEO + CTA + Hero compactado (08:34)
9210bbd  V1.9.129 prescriptions visibilidade 34 rascunhos (08:49)
44bbad3  V1.9.130 cards mobile-first grid quadrados (08:53)
c61dda9  V1.9.131 KPIs TEA placeholder + cards -20% (09:01)
0da19c9  V1.9.132 aluno triple-A consistente (09:23)
5dcd344  V1.9.133 acesso direto Prescrições sidebar (12:08)
5890aaa  V1.9.134 Stats + banner ICP no Terminal (12:17)
006bc86  V1.9.135 fluxo unificado prescrições no Terminal (12:25)
eb53c36  V1.9.136 modernizar visual cards Prescrições (12:46)
31ba22a  V1.9.137 bloqueio anti-abuso receita rascunho (13:32)

DOCS (5 commits):
4b3c877  diário 05/05 selo manhã (11:08)
01a4f16  blueprint WhatsApp Cloud API (11:45)
419045b  briefing Paulo CNPJ inicial (12:54)
5b9b1d1  briefing Paulo refinado pós-GPT review (13:07)
[hoje]   selo final diário 05/05 + memória persistente
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

## O QUE PODERIA SUBIR PRO LIVRO MESTRE (Magno) v1.1

Cristalizações desta sessão que merecem avaliação pra promoção:

### 🟢 Fortes candidatas (validadas empíricamente hoje)

1. **Princípio "Edge unificado por canal"**
   - Reusar `tradevision-core` com `channel='whatsapp'` (Blueprint WhatsApp)
   - Reusar componente único pra prescrições (Terminal Clínico = 1 lugar)
   - "Não criar Edge novo se pode adicionar parâmetro ao existente"

2. **REGRA HARD §1 expandida — produto não emite documento legal sem requisito real**
   - V1.9.137 marca d'água "RASCUNHO — SEM VALOR LEGAL CFM" em CSS print
   - V1.9.131 KPIs TEA placeholder "em desenvolvimento"
   - Produto **se reconhece como inválido juridicamente** quando não tem certificado/dado/assinatura real
   - Princípio: status visual ≠ valor jurídico, mas precisamos comunicar a diferença

3. **Modelo B (OTP visível no app autenticado) > modelo SMS**
   - Para vínculo de canal externo (WhatsApp futuro)
   - Prova 3 coisas simultaneamente: acesso app + posse número + ato consciente
   - Zero custo SMS

4. **Limite por COMPORTAMENTO, tokens são budget invisível**
   - Aplicável a IA-cost ops em qualquer canal
   - Degradação graceful aos 80% (gpt-4o → gpt-4o-mini)
   - Hard block aos 100%
   - 4 buckets de mitigação custo: provider mais barato + budget + degradação + debounce

### 🟡 Candidatas requerem mais ciclos (1-2 sessões a mais)

5. **Triple-A consistência arquitetural pré-PMF**
   - 3 perfis com mesma estrutura visual (paciente/profissional/aluno)
   - Mas: ainda não validado em adoção real (0 aluno, 5+ pacientes externos novos)

6. **"Tu resolve como a empresa nasce. Advogado depois resolve como os sócios não brigam."**
   - Frase do briefing Paulo refinado pós-GPT
   - Princípio operacional pra escolher parceiros corretos por escopo
   - Boa candidata depois que CNPJ realmente sair

### ⚫ NÃO subir agora (precisa mais validação)

7. **Modelo de tier WhatsApp (5/30/50/100 msg/dia)** — selado mas não testado em uso real. Sub mas com flag "experimental"
8. **Decisão de não-cadastro CNAEs médico+farma** — boa decisão, mas única até CNPJ vir
9. **Bloqueio anti-abuso receita rascunho** — princípio bom, mas arquitetura de PDF servidor-side com Lacuna WebPKI ainda virá

---

## AVALIAÇÃO HONESTA EMPÍRICA (audit via PAT, 13:35 BRT)

### 🟢 O que GENUINAMENTE avançou
1. **Bug raiz landings SEO RESOLVIDO** — V1.9.128 corrige conversão real
2. **3 perfis padronizados** — produto demo-ready pra pitch, mesmo pré-PMF
3. **Fluxo prescrições unificado** — médico nunca sai do Terminal Clínico, 4 caminhos convergem
4. **V1.9.137 anti-abuso CFM** — protege regulatório antes do primeiro paciente externo receber prescrição
5. **Blueprint WhatsApp selado** — quando CNPJ vier, executa direto sem pensar de novo (~38h Sprint 1+2+3)
6. **Briefing Paulo refinado** — pronto pra enviar, escopo correto contador vs advogado

### 🟡 O que avançou mas com ressalva
1. **AlunoDashboard triple-A** — visual ok mas ainda 0 aluno cadastrado (decisão de fazer mesmo assim foi recalibração legítima do Pedro: "produto pronto full")
2. **V1.9.137 marca d'água** — protege rascunhos, mas problema RAIZ é 0 medical_certificates cadastrados (revelado por audit PAT)
3. **AECs interrompidas** — 3 INTERRUPTED não-invalidadas refletindo bug Carolina + caso João V1.9.121

### 🔴 O que NÃO avançou (transparência empírica)
1. **0 transactions** — pré-PMF confirmado
2. **0 medical_certificates** — gargalo dos 35 DRAFTs é VAZIO real, não bug
3. **0 aluno cadastrado** — feature pronta sem demanda
4. **47.9% appointments cancelados** — V1.9.123-A mediria amanhã, ainda sem dado
5. **Andreia/MedCann INPI** — sem clareza, Paulo precisa investigar
6. **Bug Carolina state** — Fix #1 SQL desenhado há 1 dia, sem autorização aplicar

### 📊 Veredito honesto

**Avançamos consistentemente pra produto demo-ready.** 15 commits hoje (10 produto + 5 docs) com lock V1.9.95+97+98+99-B intocado em 100%. **Princípio P8 polir aplicado em série**: V1.9.130 reusa V1.9.126, 131 reusa 130, 132 reusa 131, 134 reusa 129, 136 reusa 134. Sem código duplicado, sem invenção paralela.

**Audit empírico via PAT revelou 2 verdades importantes:**
1. **35 DRAFTs prescrições NÃO são UX cega** — é vazio real (0 certificates). V1.9.137 é honesto.
2. **+8 users em 7 dias com 1 médica nova** — adoção orgânica modesta mas real. Não é só Pedro testando.

**Estamos no caminho?** Sim. **Falta o que?** Tempo (não código): CNPJ, decisão MP/Stripe, primeiro pagante. **Risco principal?** Continuar polindo no vazio. **Mitigação?** Smoke V1.9.123-A 06/05 produzirá métrica real de redução cancelamento — primeiro KPI clínico empírico.

**Próxima entrega real depende de TEMPO, não de código.**

---

## FRASE ÂNCORA DO DIA

> **"Audit empírico via PAT revelou: os 35 DRAFTs não são UX cega — é vazio real (0 medical_certificates cadastrados). Produto se reconhece como inválido juridicamente quando precisa. Próxima entrega real depende de tempo (CNPJ + 1º pagante), não de código. Tu resolve como a empresa nasce. Advogado depois resolve como os sócios não brigam."**

---

## PRÓXIMO DIÁRIO

Quando smoke V1.9.123-A 06/05 produzir métrica empírica de redução de cancelamento OU quando CNPJ entrar oficialmente OU quando Pedro autorizar Edge payment-checkout (próximo P0 técnico).
