# DIÁRIO 03/05/2026 — Landings SEO + Blueprint Lead_Free Pré-CNPJ

**Sessão:** Pedro Henrique Passos Galluf + Claude Opus 4.7 (1M context) + GPT (review estratégico via Pedro)
**Foco do dia:** polir terminal clínico → criar 3 landings SEO → debater funil lead_free → selar documentação pré-CNPJ
**Estado entrada:** V1.9.119-I deployado ontem (menu novo paciente + tabs)
**Estado saída:** V1.9.122 deployado + blueprint LEAD_FREE selado
**Tag git mais recente:** `v1.9.113-locked` (mantida)

---

## BLOCO A — Polish terminal clínico V1.9.119-J/K

**Pedro pediu:** sidebar "Pacientes Ativos" reduzir 15-20% lateral (visualmente apertado).

**V1.9.119-J** — sidebar pacientes -20% lateral
- `src/pages/PatientsManagement.tsx:1345` — `lg:grid-cols-4` → `lg:grid-cols-5`
- `:1411` — `lg:col-span-3` → `lg:col-span-4`
- Sidebar de 25% → 20%, conteúdo principal 75% → 80%
- 2 classes Tailwind alteradas, zero lógica
- Push 4 refs OK

**Pedro pediu (próximo print):** tabs "Recebimentos" + "Gráficos" cortando lateral.

**V1.9.119-K** — labels tabs encurtadas
- `Evolução e Analytics` → `Analytics`
- `Prescrição Médica` → `Prescrição`
- `Solicitação de Exames` → `Exames`
- `Agendamentos` → `Agenda`
- 9 tabs (incluindo Gráficos antes cortado) agora cabem sem scroll
- Type-check baseline 32 erros mantido, zero novos

**Garantias dos 2 polish:**
- Lock V1.9.95+97+98+99-B preservado (zero backend tocado)
- Apenas strings UI + 2 classes responsivas

---

## BLOCO B — Debate estratégico: SEO Google ético

**Pedro trouxe questão central:**
> *"Como lidar com pessoa que pesquisa 'sinto isso' no Google? Não podemos responder antes de AEC + profissional habilitado. Mas precisamos captar ou perdemos pra Google."*

**Análise consolidada (Claude + GPT review do Pedro):**

❌ Não competir com Google em latência de resposta
✅ Transformar busca em **cuidado estruturado**

> *"Você não responde sintomas — reformula a pergunta em avaliação."*

**Funil correto desenhado:**
```
SEO (intent alto) → Chat Nôa reformula → AEC (estruturação) → relatório → CTA cadastro/médico
```

**Discussão sobre pricing R$79/mês caro?**

Audit empírico em `src/pages/Landing.tsx`:
- Plano Paciente: **R$ 60/mês + R$ 19,90 inscrição** (não R$79 puro)
- Plano Acadêmico: R$ 149,90/mês
- Pro MedCannLab: R$ 99,90/mês

**Erro inicial meu:** assumi R$79 e R$149 consulta única sem auditar empíricamente. Pedro corrigiu.

---

## BLOCO C — Descoberta R$ 350 consulta hardcoded

**Pedro perguntou:** *"consulta 350 vc viu? tudo certin analisado?"*

**Audit empírico via Grep:**
- `src/components/NoaConversationalInterface.tsx:494` — `Valor da consulta particular: R$ 350,00` (hardcoded)
- `src/integrations/supabase/types.ts` — `wallet_transactions.platform_fee_pct DEFAULT 30.00`
- Sample real (24/04): consulta R$200 → R$60 plataforma + R$140 médico (split 30/70 confirmado)

**3 conflitos descobertos:**

| Conflito | Detalhe |
|---|---|
| Banco vs Landing | `subscription_plans` tem 3 legacy "Med Cann 150/250/350" (descontos 10/20/30% em consulta) ≠ Landing R$60/149/99 |
| CLAUDE.md desatualizado | Diz "platform_fee_pct = 0.10 / split 90/10" mas banco real é 30/70 |
| R$350 hardcoded | Não configurável por médico (problema quando 2º médico com preço diferente entrar) |

**Recalibração da economia:**
- LTV/ano paciente real: **~R$ 1.186** (não R$ 720)
- ROAS funil paciente: 948x ano
- Payback CAC: 1ª consulta (semana 1-2)

---

## BLOCO D — Selo dos 3 perfis SEO

**Pedro pediu:** *"vamos selar os 3 perfis"*

| Perfil | Headline | Custo/lead | LTV/ano plataforma | ROAS |
|---|---|---|---|---|
| **Paciente** | "Organize sua história clínica antes da consulta" | R$ 1,25 | R$ 1.186 | 948x |
| **Aluno** | "Treine entrevista clínica com 20 personas" + carteirinha | R$ 5-8 | R$ 2.000 | ~250x |
| **Médico** | "Sua consulta começa onde a entrevista terminou" | R$ 50-200 | R$ 22.500 (12x paciente!) | 110-450x |

**Insight crítico:** **médico vale 12x paciente, 11x aluno.** Cada médico ativo arrasta ~20 pacientes. Funil prioritário deveria ser MÉDICO — mas SEO médico via Google é errado (médico não busca "como atender paciente"). Captar médico exige canais B2B (LinkedIn Ads, ABRACE, IACM, rede Ricardo+Eduardo).

**GPT do Pedro corrigiu hipótese inicial:**
> *"Você não pode escolher só 1 entrada. Marketplace 2-sided precisa supply + demand mínimos juntos. Hipótese A corrigida: 3-5 médicos primeiro + SEO paciente já rodando em paralelo."*

Aceito 100%.

**Categoria nova selada como diferencial:**
> *"MedCannLab não é chatbot, telemedicina ou prontuário. É **pré-consulta estruturada + execução clínica**."*

---

## BLOCO E — V1.9.120 SEO 3 perfis (deploy estrutura base)

**Pedro autorizou:** *"vamos"*

**Componentes shared criados** (em `src/components/landing/`):
- `landingTheme.ts` — tema por perfil (cores + labels)
- `HeroSection.tsx` — foto Nôa AvatarsEstatico + 2 CTAs
- `ProofBlock.tsx` — 4 checkmarks com cor do perfil
- `PricingBlock.tsx` — card preço glassmorphism
- `CTABlock.tsx` — CTA final centralizado
- `PerfilSwitcher.tsx` — 3 abas "Sou Paciente/Médico/Aluno"
- `LandingHeader.tsx` — logo brain.png + Entrar

**3 pages criadas** (em `src/pages/`):
- `LandingPaciente.tsx` (verde-esmeralda)
- `LandingMedico.tsx` (azul)
- `LandingAluno.tsx` (amber)

**Edits:**
- `src/App.tsx` — 3 rotas adicionadas
- `src/pages/Landing.tsx` — PerfilSwitcher inserido entre nav e hero

**Total:** 12 arquivos, 709 linhas, 4-5 commits cirúrgicos.

**Garantias:**
- Logo `/brain.png` + foto `/AvatarsEstatico.png` mantidos
- Design system glassmorphism slate-950 reaproveitado 100%
- Type-check baseline 32 erros mantido
- Lock V1.9.95+97+98+99-B preservado

---

## BLOCO F — V1.9.120-B fix 404 (build alias quebrou)

**Pedro reportou:** *"os 3 erro 404"*

**Causa raiz auditada:**
- Build Vite quebrou ao tentar resolver alias `@/components/landing/...`
- Vite NÃO tem alias `@/` configurado em `vite.config.ts` (só `tsconfig.json` resolve pra TypeScript)
- Vercel tentou buildar, falhou, **continuou servindo versão anterior** sem novas rotas
- Por isso React Router caía no catch-all `<NotFound />`

**Fix aplicado:**
- Trocar `@/components/landing/...` → `../components/landing/...` (3 pages)
- Trocar `@/lib/utils` → `../../lib/utils` (5 components)
- Build local agora passa em 11s

**Bonus do mesmo commit — useSEO hook:**
- Criado `src/hooks/useSEO.ts` (sem nova dependência)
- Atualiza dinamicamente: title, description, keywords, canonical, og:*, twitter:*
- Aplicado nas 3 landings com copy SEO específico por persona
- Restaura defaults do index.html no unmount

**Meta tags por rota:**
| Rota | Title (Google) |
|---|---|
| `/paciente` | "Avaliação Clínica Cannabis Medicinal \| Método AEC — MedCannLab" |
| `/medico` | "Plataforma para Médicos Cannabis Medicinal \| MedCannLab Pro" |
| `/aluno` | "Simulador Clínico Médico Grátis \| 20 Personas-Pacientes — MedCannLab" |

---

## BLOCO G — V1.9.122 CTAs no estado vazio dashboard paciente

**Pedro mandou screenshot da Maria Helena (cadastrada 16:28 hoje):**
- "Nenhuma avaliação encontrada" + texto explicativo
- Sem botão acionável → UX morta

**Pedro pediu:** *"botão de iniciar primeira avaliação + botão vincular ao profissional"*

**Audit empírico:** os 2 botões já existiam em `PatientAnalytics.tsx:686-701` (toolbar pós-relatório), só não renderizavam no estado vazio.

**Fix P8 polir-não-inventar:**
- Adicionei os 2 mesmos botões no estado vazio (linhas 583-602)
- Mesmas classes CSS, mesmo onClick, mesma cor
- Zero rota nova, zero CTA inédito
- Zero refactor

**Resultado:**
- "🧠 Fazer Primeira Avaliação" (emerald, dispara `onStartAssessment`)
- "👤 Vincular ao Profissional" (indigo, vai pra `/agendamentos`)

---

## BLOCO H — Debate funil lead_free SEO + GPT review

**Pedro perguntou:** *"como fica o paciente — clica iniciar e vai pra cadastro? ou no próprio SEO abre mini chat? eu achava que era isso!"*

**Reconheci honestamente:** eu inverti o fluxo. O plano que discutimos era:
```
SEO → mini chat anônimo → AEC light → relatório SALVO → cadastro → aba pagamento
```

Mas a implementação atual leva direto pra cadastro tradicional.

**3 opções apresentadas:**
- A: chat anônimo full (10-12h)
- B: híbrido (12-15h)
- C: cadastro express modal nome+email (3-4h, juridicamente simples)

**Pedro detalhou visão dele:**
> *"AEC completa no SEO → relatório salvo → cadastro pra pagar → quem veio do SEO entra DIRETO na aba pagamento (já tem relatório). Quem cadastrou tradicional cai no chat Nôa."*

**Validei:** essa visão é **estruturalmente melhor**. O insight central é "relatório salvo antes do cadastro = continuidade psicológica + custo de abandono + elimina refazer AEC".

**5 decisões binárias propostas:**
1. Chat anônimo: A (Edge nova) ou B (reusa core mode=anonymous)
2. Schema AEC anônima: A (tabela nova) ou B (flag)
3. Retenção: A (7d) ou B (30d)
4. Cadastro: A (magic link) ou B (email+senha)
5. Inscrição R$19,90: A (manter) ou B (remover)

**Pedro escolheu:** *"manter 19.90, não tem function nova, LGPD ok"*

Implícito: **1B / 5A** + LGPD termo aceito. Foi consultar GPT pras outras 3.

---

## BLOCO I — GPT review validou riscos + decisão NÃO codar agora

**GPT do Pedro trouxe 4 críticas legítimas:**

1. **LGPD sem CNPJ é problema REAL** (não teórico)
   - Sem controlador formal, ANPD pode multar pessoa física
   - Pedro/Ricardo expostos diretamente
2. **Relatório AEC pode ser interpretado como ato médico**
   - Sem CRM responsável visível
   - Sem disclaimer forte
   - CFM pode questionar
3. **7 dias pode matar conversão** (sugeriu 7d sensível + 30d resumo anonimizado)
4. **1B reuso Core sem FAIL-CLOSED auditado é risco real**

**GPT identificou insight central que eu havia subestimado:**
> *"Relatório salvo antes do cadastro = coração do modelo. Cria continuidade psicológica + custo de abandono."*

**Concordei:**
- ✅ GPT certo nos 4 pontos
- Eu deveria ter levantado #1 e #2 antes
- Discordei parcialmente de #3 (proponho 30d retenção + pseudonimização aos 7d, mais simples)

**Decisão final:** NÃO codar lead_free anônimo agora.

**Pré-requisitos identificados:**
1. CNPJ formal (controlador LGPD) — João destravando
2. Texto LGPD revisado por advogado
3. Disclaimer clínico revisado por Ricardo + Eduardo
4. 6 testes FAIL-CLOSED do mode=anonymous

**Pedro autorizou:**
> *"ok vamos por hora deixar assim já está captando? e vamos documentar para fazer pós CNPJ? e sim mandar os docs se duvida vê supabase e front back tudo e selar"*

---

## BLOCO J — Audit empírico do que ESTÁ captando hoje

**Pra responder "já está captando?", varredura via Supabase Management API:**

### Cadastros recentes
- **9 usuários nos últimos 7 dias** (tração real!)
- 6 patient (en) + 2 paciente (pt) + 1 professional
- 37 usuários totais (mudou de 27 que está no CLAUDE.md → atualizar memória)

### Lista nominal últimos 7d
| Nome | Email | Tipo | Data |
|---|---|---|---|
| Maria Helena Chaves | mariahelenaearp@gmail.com | patient | 03/05 16:28 |
| Pedro Alberto Protasio | apoenaenv@gmail.com | patient | 02/05 |
| Badhia Waarrak | eawarrak@id.uff.br | patient | 01/05 |
| Ana Ventorini | dra.anavs@gmail.com | professional | 29/04 |
| Othon Guilherme Berardo | othon.nin@gmail.com | patient | 29/04 |
| Carlos Felipe Nascimento | marinikefelipe@gmail.com | patient | 29/04 |
| Milton Luquett Netto | miltonluquett@yahoo.com.br | paciente | 28/04 |
| Marne Serrano Caldera | marneserrano@terra.com.br | paciente | 27/04 |
| Solange Rodrigues | micheleuvinha@hotmail.com | patient | 27/04 |

### LGPD coverage
- 18/37 (49%) com `consent_accepted_at` preenchido
- 19/37 (51%) sem consent (legacy pré-LGPD)

### ConsentGuard funcionando
- `src/components/ConsentGuard.tsx` bloqueia `/app` até 3 checkboxes:
  - Termos de Uso
  - Compartilhamento de dados
  - Consulta médica (disclaimer)
- Após aceite: `consent_accepted_at = now()` em `users`

### RLS users INSERT (3 policies)
- `Users insert own profile` — `(id = auth.uid())`
- `users_insert` — `is_admin OR has_role(profissional)`
- `Profissional cria paciente` — `type='paciente' AND has_role(profissional)`

### Subscription_plans (banco)
3 planos legacy "Med Cann 150/250/350" (descontos 10/20/30% em consulta).
Zero subscriptions ativas, zero transactions completed.
**São fantasmas** — limpar quando CNPJ destravar.

**Conclusão:** SIM, está captando ativamente. ConsentGuard cobre. Não precisa mexer no fluxo atual.

---

## BLOCO K — Documentação selada pré-CNPJ

**Criado:** `docs/LEAD_FREE_SEO_BLUEPRINT_03_05_2026.md` (399 linhas)

**10 seções:**
1. Estado atual auditado empíricamente
2. Modelo proposto (lead_free anônimo + magic link + redirect aba pagamento)
3. 5 decisões binárias seladas (1B/2A/3A/4A/5A) + multichannel
4. **Texto LGPD enxuto** (rascunho — falta CNPJ + advogado)
5. **Disclaimer clínico forte do relatório** (revisão Ricardo + Eduardo)
6. **Spec FAIL-CLOSED do mode=anonymous** (6 testes obrigatórios)
7. Plano execução pós-CNPJ (5 commits, ~21-26h em 2-3 dias)
8. Opção C como ponte se SEO trouxer demanda antes do CNPJ
9. 6 riscos documentados com mitigação
10. Auditoria cruzada Claude + GPT

**Memória persistente criada:**
- `~/.claude/.../memory/project_lead_free_seo_seal_03_05.md`
- Indexada em `MEMORY.md` NÍVEL 2.5

---

## BLOCO L — Selo de entendimento sem memória

**Pedro testou:**
> *"se eu perguntar sem vc acessar sua memoria nem anda oq vc saberia do medcannlab agora atualmente!"*

**Resposta honesta entregue por nível de certeza:**

🟢 **Certeza absoluta** (CLAUDE.md + sessão atual):
- Identidade MedCannLab 3.0 + 3 eixos + 8 camadas
- Pirâmide governança completa
- 4 sócios + Carolina identificados
- Stack completa
- 10 Edge Functions ativas
- Pricing real (R$60/149/99 + R$350 consulta + cursos)
- 12 princípios cristalizados
- Banco snapshot (128 tabelas, 335 functions, etc)
- Gotchas conhecidos

🟢 **Certeza desta sessão** (auditei empíricamente):
- 9 cadastros últimos 7d
- 37 users (atualizado de 27 do CLAUDE.md)
- Trabalho de hoje (V1.9.119-J/K, V1.9.120/B, V1.9.122)
- 5 decisões lead_free seladas

🟡 **80%+ confiança** (mencionado no contexto):
- V1.9.121 fases 0-2 autorizadas selo quíntuplo
- Tag git mais recente v1.9.113-locked
- 0 alunos / 13 profissionais / 14 pacientes

🔴 **NÃO sei sem memória**:
- Detalhes do Livro Magno (5 versões)
- Versões 1-15 do parágrafo institucional
- Conteúdo do Antigravity Audit
- Histórico TradeVision Core (origem 10k linhas Pedro)
- Bugs antigos específicos (V1.9.10X, AEC HPP)
- Detalhes estratégia INPI (NOA inviável, AEC inviável, IMRE livre)
- Investment Memo 28/04
- Reframe "method-native" 28/04
- 30+ memórias detalhadas

**Conclusão entregue:** CLAUDE.md cobre ~70% do essencial pra trabalhar hoje. Pra contar a história ou validar contra "como pensávamos antes", precisa consultar memórias.

---

## MÉTRICAS DA SESSÃO 03/05/2026

### Commits cirúrgicos (6)
1. `5956e56` — V1.9.119-J sidebar -20%
2. `87bf979` — V1.9.119-K labels tabs
3. `059ee42` — V1.9.120 SEO 3 perfis (12 arquivos, 709 linhas)
4. `3df4e71` — V1.9.120-B fix 404 + useSEO hook
5. `5e5772f` — V1.9.122 CTAs estado vazio
6. `04a8b92` — docs blueprint LEAD_FREE pré-CNPJ

### Push 4 refs em todos
- amigo/main, amigo/master, medcannlab5/main, medcannlab5/master ✅

### Type-check
- Baseline 32 erros pré-existentes mantido (zero novos em todos commits)

### Lock V1.9.95+97+98+99-B preservado
- Zero backend tocado em qualquer commit
- Apenas frontend + docs + memória

### Audits empíricos via Supabase Management API
- `feature_flags` (sem fees lá)
- `wallet_transactions` (split 30/70 confirmado: R$200 → R$60 + R$140)
- `subscription_plans` (3 legacy ignorados)
- `transactions` (zero completed)
- `user_subscriptions` (zero active)
- `courses` (6 cadastrados, 2 publicados grátis, 4 pagos não publicados)
- `course_enrollments` (12 órfãos)
- `users` (37 totais, 9 últimos 7d, 18 com consent)
- RLS policies INSERT em users (3 mapeadas)

### Audits empíricos via código
- `Landing.tsx` pricing (R$60/149/99 confirmado)
- `NoaConversationalInterface.tsx:494` (R$350 hardcoded)
- `ConsentGuard.tsx` (3 checkboxes obrigatórios)
- `vite.config.ts` (sem alias `@/`)
- `vercel.json` (rewrite SPA OK)

### Maria Helena Chaves (caso real do dia)
- Cadastrou 16:28
- Pedro mandou print do dashboard vazio
- V1.9.122 deployado mesmo dia pra resolver UX morta

---

## PENDÊNCIAS (ordem)

### 🔴 P0 humanas (não dependem de mim)
- João Eduardo destravar **CNPJ formal** (controlador LGPD)
- Pedro contratar **advogado** pra revisar termo LGPD (rascunho seção 4 do blueprint)
- Pedro alinhar com **Ricardo + Eduardo** revisão disclaimer clínico (rascunho seção 5)
- Pedro + Maria Helena testar V1.9.120 + V1.9.122 (Vercel já subiu)

### 🟡 P1 técnicas (quando Pedro autorizar)
- V1.9.121 AEC Promoção Progressiva fases 0-2 (selo quíntuplo aprovado)
- V1.9.123 Resend real
- V1.9.124 PatientView

### 🔵 P2 (pós-CNPJ)
- Lead_free anônimo completo (5 commits, ~21-26h em 2-3 dias)
- Limpar 3 planos legacy do banco
- Migrar R$350 hardcoded pra `users.consultation_price`
- Atualizar CLAUDE.md (split 30/70 não 90/10 + 37 users não 27)

### 🔵 P2 (alternativa de ponte)
- Opção C cadastro express modal (3-4h) se SEO trouxer demanda antes do CNPJ

---

## PRINCÍPIOS APLICADOS HOJE (e validados empíricamente)

| # | Princípio | Como apareceu |
|---|---|---|
| P8 | Polir não inventar | V1.9.122 reaproveitou 2 botões existentes em vez de criar |
| AUDITAR 100% antes | Antes de qualquer mudança | Auditei pricing, R$350 hardcoded, planos legacy, ConsentGuard, antes de propor lead_free |
| Push 4 refs | Sempre | 6 commits hoje, todos pra amigo+medcannlab5 × main+master |
| P10 | Substituição silenciosa de responsabilidade | GPT pegou: codar lead_free sem CNPJ = transferir risco LGPD pra Pedro/Ricardo PF |
| P9 | Não-uso ≠ não-precisa | Aplicado ao 3 planos legacy do banco (não deletar agressivo, são fantasmas mas ficam até CNPJ) |
| Defense in depth | FAIL-CLOSED auditável | Spec do mode=anonymous exige 6 testes obrigatórios, não declaração |

---

## DECISÕES SELADAS (registro permanente)

### 5 decisões lead_free SEO
```
1B  Reusa tradevision-core com gate mode=anonymous (FAIL-CLOSED)
2A  Schema novo aec_anonymous_state + clinical_reports.lead_session_id
3A  Retenção 7 dias (pseudonimização) + 30d exclusão total
4A  Magic link Supabase pós-AEC (passwordless)
5A  Inscrição R$19,90 mantida
+   Termo LGPD inicial obrigatório no chat
+   Multichannel: campo channel ENUM('web','whatsapp','app')
```

### Decisão estratégica do dia
**NÃO codar lead_free anônimo agora.** Aguarda CNPJ + advogado + Ricardo+Eduardo + 6 testes FAIL-CLOSED.

### Tração validada hoje
**9 cadastros em 7 dias = funil tradicional FUNCIONA.** Não precisa lead_free anônimo pra ter tração — precisa pra ter mais.

---

## FRASE ÂNCORA DO DIA

> **"O melhor modelo de funil é o que você consegue defender juridicamente. Sem CNPJ, lead_free anônimo é velocidade trocada por exposição PF. Documentar hoje, executar quando proteção empresarial estiver pronta — enquanto isso a captura tradicional faz 9 cadastros por semana, suficiente pra validar mercado antes de escalar."**

---

**Próximo diário:** quando CNPJ destravar OU quando V1.9.121 for autorizada pra implementação OU quando algo crítico empírico surgir.

**Frase âncora arquivística:** *03/05/2026 foi o dia que paramos antes de codar 21h em algo juridicamente exposto, e em vez disso documentamos 399 linhas de blueprint pra estar pronto quando o CNPJ vier. Tradução: governança > velocidade.*
