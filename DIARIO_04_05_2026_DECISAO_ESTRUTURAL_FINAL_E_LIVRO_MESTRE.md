# DIÁRIO 04/05/2026 — Decisão Estrutural Final + Livro Mestre

**Sessão:** Pedro Galluf + João Vidal + Claude Opus 4.7 + GPT (review estratégico via Pedro)
**Aguarda alinhamento presencial:** Ricardo Valença + Eduardo Faveret (casa Ricardo, 14h hoje)
**Tag git mais recente:** `v1.9.113-locked` (mantida)
**Estado entrada:** V1.9.122 deployado ontem (CTAs estado vazio)
**Estado saída:** V1.9.123-A em prod + 7 documentos canônicos selados + LIVRO MESTRE consolidado

---

## BLOCO A — V1.9.123-A Lembretes 24h+1h em produção

**Causa:** Audit empírico revelou 0/69 appointments com lembrete enviado. Edge `video-call-reminders` só tinha janelas 30/10/1 min ("pé na porta") — fora da janela onde 51% dos pacientes cancelam.

**Fix:**
- Migration: `ALTER TABLE appointments ADD reminder_sent_24h BOOLEAN, reminder_sent_1h BOOLEAN`
- Edge: 2 entries novas em `REMINDER_WINDOWS` (24h + 1h preventivos)
- Sweep window ampliado: 35min → 25h (1500 min)
- Helper `formatReminderTitle()` humaniza mensagem ("sua consulta é amanhã às 15:00" / "começa em 1h")
- Mantém 30/10/1min como fail-safe

**Deploy:** commit `8daa2e9`, CI success 12:37 UTC. Cron rodando a cada 5min, smoke manual passou.

**Smoke previsto:** Maria Helena 06/05 15:00 BRT — receberá lembrete 24h em 05/05 entre 14-16h BRT.

---

## BLOCO B — Audit empírico subscription_plans + cursos

```sql
subscription_plans (banco real):
  Med Cann 150  R$ 150  is_active=true
  Med Cann 250  R$ 250  is_active=true
  Med Cann 350  R$ 350  is_active=true
  → 3 planos LEGACY que não correspondem à Landing
  → Limpar pós-CNPJ + cadastrar conforme Landing

courses (banco real):
  PUBLICADOS (R$0 grátis):
    • Pós-graduação Cannabis Medicinal
    • Cidade Amiga dos Rins
  NÃO publicados (potencial receita parada):
    • Pós-Graduação Cannabis Medicinal — R$ 2.999,90
    • Arte da Entrevista Clínica — R$ 299,90
    • Sistema IMRE Triaxial — R$ 199,90
    • Introdução à Cannabis Medicinal — R$ 99,90
```

CAR é curso GRÁTIS no banco — confirma decisão "CAR é projeto, não receita".

---

## BLOCO C — Estratégia marca + CNPJ consolidada

**5 documentos selados em sequência:**

1. `docs/ESTRATEGIA_MARCA_CNPJ_FINAL.md` (397 linhas)
   - 4 PLANOS honestos (corrige "5 camadas" antigas)
   - Classes Nice (5/9/35/41/42/44)
   - Buscas INPI empíricas (MEDCANN/NOA/AEC/IMRE)
   - IMRE LIVRE em todas as classes ✅

2. `docs/PARTNERSHIP_FRAMEWORK.md` (283 linhas)
   - 5 tipos de parceiros
   - Cláusula partes relacionadas modelo
   - Caso 1Pure detalhado (João)

3. `docs/MENSAGEM_ADVOGADO_E_PAULO_04_05_2026.md` (234 linhas)
   - Mensagens prontas pra envio
   - Advogado: 6 frentes + 4 perguntas
   - Paulo Master Group 888: 8 perguntas + cronograma

4. `docs/MAPA_BUGS_E_AJUSTES_04_05_2026.md` (320 linhas)
   - Bug Carolina state inconsistente documentado
   - 5 famílias estruturais de bugs
   - 20 itens priorizados (P0-P4)

5. `docs/LIVRO_MESTRE_MEDCANNLAB_v1.0.md` (525 linhas)
   - Doc canônico mestre
   - Regra de Ouro codificada
   - Caminho B simplificado selado

---

## BLOCO D — Discussão Caminho A vs B vs C (3 rodadas com GPT do Ricardo)

### Rodada 1 — proposta Ricardo "usar minha empresa"

Ricardo propôs: "Já tenho cozinha aprovada, a gente faz o sistema de pedidos."

Análise levantou:
- 🔴 Cap table assimétrico (Pedro recebe migalhas, Ricardo 16x mais)
- 🔴 Key-person risk (Ricardo sai → CAR vai junto)
- 🔴 Substituição silenciosa (P10 da memória)

### Rodada 2 — esclarecimento Lattes do Ricardo

Lattes mostrou "Consultório do Valença desde 2009". Eu extrapolei pra "17 anos track record empresarial robusto" — **erro meu, princípio AUDITAR 100% violado**. Pedro questionou, retrato.

### Rodada 3 — Ricardo esclareceu situação real

> *"Sou equipe de OS em hemodiálise, atendo pacientes SUS no consultório DA CLÍNICA, ou hospitais como Angra"*

Não tem clínica/sala física própria. Trabalha como médico via OS. PJ "Ricardo Valença Serviços de Saúde LTDA" existe mas estrutura empresarial é da OS.

### Rodada 4 — GPT do Ricardo veredito final

> *"CAR não é contrato, não é receita, não é urgência. É só uma ideia. A gente não estrutura empresa em cima de ideia — só em cima de realidade."*

**Decisão unânime:** Caminho B simplificado.

---

## BLOCO E — Esclarecimento técnico CNAE médico (preocupação válida do Ricardo)

Ricardo preocupado: *"se for atendimento a populações via secretaria de saúde, vão pedir CNAE médico e teremos problemas"*.

**Análise técnica:** Ricardo está certo no técnico, mas a solução NÃO é dar CNAE médico à MedCannLab.

```
EDITAL "Atendimento a populações" via SES
                     │
    ┌────────────────┴────────────────┐
    │ Contratante principal           │
    │ (precisa CNAE médico 8630-5/03) │
    │                                  │
    │ • Ricardo Valença Serviços      │
    │   de Saúde LTDA (PJ Ricardo)     │
    │ • OU OS de hemodiálise           │
    │ • OU Clínica/Hospital parceiro   │
    └────────────────┬────────────────┘
                     │ subcontrata como fornecedora
                     ↓
    ┌─────────────────────────────────┐
    │ MEDCANNLAB TECNOLOGIA EM SAÚDE  │
    │ CNAE 6204 + 8599                │
    │ Emite nota como:                │
    │  • Plataforma tecnológica       │
    │  • Método AEC (licença)         │
    │  • Treinamento clínico          │
    │  • Sistema relatórios            │
    └─────────────────────────────────┘
```

**Modelo padrão de mercado** (Memed faz assim com prefeituras).

---

## BLOCO F — Caminho B SIMPLIFICADO selado (decisão final 04/05 16h)

```
MEDCANNLAB TECNOLOGIA EM SAÚDE LTDA
  Tipo:           LTDA
  Sede:           Rio de Janeiro
  Regime:         Simples Nacional Anexo III (com fator R)
  Capital social: R$ 5.000-10.000 (a confirmar com Paulo)

Cap table (REGRA DE OURO):
  Pedro Galluf       20%  (CTO/Tecnologia)
  Ricardo Valença    20%  (Clínico/Produto — método AEC + IMRE)
  João Vidal         20%  (Comercial/B2B + parceria 1Pure)
  Eduardo Faveret    20%  (Conselheiro Científico)
  Tesouraria         20%  (10% ESOP + 10% Growth Pool)

CNAEs (sem médico inicialmente):
  • 6204-0/00  Consultoria TI (principal)
  • 6209-1/00  Suporte técnico TI
  • 7490-1/04  Intermediação comercial (broker classe 35 — 1Pure)
  • 8599-6/04  Treinamento profissional (cursos AEC/IMRE)

INVESTIMENTO ATIVAÇÃO:
  CNPJ Paulo:        R$ 8-13k
  Acordo advogado:   R$ 3-5k
  INPI IMRE 3 cls:   R$ 1.065
  Agente PI:         R$ 500-1.000
  ─────────────
  TOTAL:             R$ 12.5-20k
  TEMPO:             15-30 dias
```

---

## BLOCO G — Cruzamento empírico LIVRO MESTRE × APP × BANCO

`docs/REALIDADE_vs_LIVRO_MESTRE_04_05.md` (302 linhas):

**Convergência 80%:**
- ✅ Pipeline V1.9.95 + Verbatim First V1.9.86 (~46% bypass)
- ✅ Lock V1.9.95+97+98+99-B preservado
- ✅ V1.9.123-A em prod
- ✅ 9 cadastros últimos 7d (tração)
- ✅ Caminho B selado

**8 desalinhamentos:**
- ⚠️ 3 planos legacy banco vs Landing (limpar pós-CNPJ)
- ⚠️ 4 cursos pagos NÃO publicados (esperar gateway)
- 🔴 0 AECs completas ATIVAS (bug Carolina sistêmico)
- ⚠️ 50% appointments cancelados (V1.9.123-A medindo)
- ⚠️ 0 transações pagas (depende CNPJ)
- 🟢 95 reports / só 18 signed (legacy pré-Pipeline OK)
- 🟢 161 tabelas / 37 users (over-eng aceito pré-PMF)
- 🟢 3 Edge half-impl (manter como está)

---

## BLOCO H — Próxima sessão presencial casa do Ricardo (14h hoje)

**Objetivo:** alinhar com Ricardo + Eduardo a decisão Caminho B simplificado.

**4 sócios alinhados pré-sessão:**
- ✅ Pedro
- ✅ João
- ⚠️ Ricardo (entender que PJ dele continua existindo + vira parceira via subcontratação)
- ⚠️ Eduardo (apresentar decisão)

**Briefing pra próxima sessão:** ver `docs/BRIEFING_PROXIMA_SESSAO_CASA_RICARDO.md`

---

## BLOCO I — Stress test real OpenAI 429 (15:25-16:00 BRT)

**Causa:** Saldo créditos OpenAI da org "Nôa Esperanza" (key user-SjuGx...) zerou. 5 incidentes 429 `insufficient_quota` em 31 minutos via Cloudflare api.openai.com.

**Comportamento defensivo:**
- ⚠️ tradevision-core/index.ts:5092-5093 ativou `Modo Determinístico (Consciência Reduzida)` automaticamente
- ✅ AEC continuou via Verbatim First (~46% bypass histórico mantido)
- ✅ Pipeline orchestrator intacto durante toda crise
- ✅ DB SAVED em 100% das interações
- ✅ Logs Supabase mantidos (RAG + Auth + Realtime OK)

**Recuperação (~16:00 BRT):**
- Ricardo recarregou créditos OpenAI
- Sistema voltou automaticamente ao `gpt-4o-2024-08-06` em ~30s
- Zero deploy, zero restart, zero ação manual de produto

**Validação Sovereignty Protocol v2:**
- Cadeado V1.9.95+97+98+99-B PROVADO em produção real
- Camadas 0-4 e 6-7 da pirâmide operaram sem GPT
- Apenas camada 5 (camada generativa) ficou indisponível
- Real-world stress test passado com sucesso

---

## BLOCO J — Sessão dupla teste pós-recarga (16:00-17:30 BRT)

**Setup:** Ricardo testou como Carolina (UUID 5c98c123) + João como paciente (UUID c68fb133, jvbiocann@).

**Resultado Carolina (Pipeline FULL):**
- AEC completou: IDENTIFICATION → MEDICAL_HISTORY → CONSENT_COLLECTION ("sim concordo") → FINAL_RECOMMENDATION ("autorizo")
- Pipeline orchestrator: 7 estágios em ~28s
  - REPORT (V1.9.84 escriba) → CLEANUP V1.9.109 → SCORES (70 high) → REPORT_GENERATED → AXES_SYNCED → SIGNATURE (hash ad6d7191) → RATIONALITY_SYNCED → DONE
- report_id: `6fc75ce8-0cd5-43bd-b0b9-2be9dc461b47`
- doctor_id: `2135f0c0` (Ricardo via DOCTOR_RESOLUTION Caminho 2 P0B)

**Resultado João (parou em MEDICAL_HISTORY):**
- AEC iniciou COMPLAINT_DETAILS → MEDICAL_HISTORY
- Não fechou (não chegou em CONSENT_COLLECTION)
- ⚠️ Achado lateral: input misto durante AEC ("eu aparece como ouvindo leandro aqui mas ela fica vibrando") — possível bug UX (TTS/avatar/mic) capturado como dado clínico → P1 #11 no MAPA_BUGS

**Métricas da sessão:**
- Verbatim bypass: ~80% (acima média histórica 46%)
- AEC GATE V1.5 reteve agendamento 5+ vezes corretamente
- 0 erros 5xx, 0 erros DB, 0 falhas Pipeline

---

## BLOCO K — Análise pipeline paciente (Vincular ≠ AEC ≠ Agendar)

**Insight Pedro:** vínculo, AEC e agendamento estão MISTURADOS hoje no fluxo paciente. Card de agendamento cria vínculo como efeito colateral. Correto seria 3 atos sequenciais separados.

**Proposta 3 camadas:**
- 🟢 VINCULADOS (longitudinal, VBHC): Vincular → AEC → Agendar
- 🟡 POOL (avulso/urgência): Agendar → AEC → opcional vincular pós-fato
- 🟠 ESTAGIÁRIOS (futuro pós-PMF): role + workflow supervisão

**Audit empírico (10 queries via PAT):**
- `patient_doctors` é VIEW derivada de appointments (não tabela formal)
- `aec_assessment_state` SEM `professional_id` — AEC roda cega de médico
- 13 profissionais cadastrados, apenas 2 com availability (Ricardo + Eduardo)
- DOCTOR_RESOLUTION resolve pós-AEC (default Ricardo)

**Bug latente descoberto no Core (linha 4674):**
- tradevision-core lê `patient_doctors.is_official` que NÃO EXISTE na VIEW
- Sempre retorna undefined → distinção oficial/parceiro silenciosa pré-existente
- Nenhuma memória prévia tinha registrado

---

## BLOCO L — Peer review crítico (outra Claude) + 5 gates

**3 pontos críticos NÃO levantados na minha análise técnica inicial:**

1. **Cap table impact** (REGRA DE OURO selada hoje no LIVRO MESTRE)
   - Bond formal Ricardo + CAR pode quebrar simetria 4×20%
   - Cenário CAR R$300k/ano: assimetria 12.6x se mal estruturado

2. **CFM 1.974/2011 + 2.314/2022**
   - Vínculo unilateral viola dever de continuidade médica
   - Precisa fluxo 2 etapas: paciente solicita → médico aceita

3. **LGPD art. 11 dado sensível saúde**
   - Bond = dado clínico relacional, exige consent específico
   - Schema atual sem `consent_id` apontando pra consents

**Aprendizado cristalizado:**
> AUDITAR 100% inclui CAMADAS NÃO-TÉCNICAS (societária + regulatória + jurídica). Spec técnica sem peer review jurídico = incompleta. Anti-subestimação severidade vale pra propostas de feature também.

**Spec patient_doctor_bonds BLOQUEADA até 5 gates:**
- ☐ CNPJ MedCannLab Tec ativo
- ☐ Acordo quotistas v2.0 assinado
- ☐ Termo LGPD revisado por advogado
- ☐ CFM 2 etapas validado Ricardo + Eduardo
- ☐ Cap table impact aprovado em ata 4 sócios

---

## BLOCO M — Bug Carolina state CONFIRMADO ATIVO + João UX P1 #11

**Bug Carolina state ressuscitado (audit empírico HOJE):**
```
Row abce92b0-5f75-44f3-9484-5f107808ef1d:
  invalidated_at: 2026-04-25 13:41 (V1.9.57 retroativo)
  started_at:     2026-05-04 18:26 (Ricardo iniciou hoje)
  last_update:    2026-05-04 19:27 (FSM atualizou hoje)
  is_complete:    true
  phase:          FINAL_RECOMMENDATION
```
- ⚠️ FSM atualizou row INVALIDADA sem limpar `invalidated_at`
- ✅ AEC rodou (Pipeline gerou report 6fc75ce8 com hash + score 70)
- 🔴 UI volta a mostrar "Iniciar Avaliação" pós-completion
- Fix #1 SQL (5min) AGUARDA AUTORIZAÇÃO Pedro
- Maria Helena (golden case 05/05) PODE estar afetada

**João UX bug anotado em MAPA_BUGS P1 #11:**
- Input "eu aparece como ouvindo leandro aqui mas ela fica vibrando"
- Capturado em MEDICAL_HISTORY (AEC = escuta ativa, correto)
- Hipóteses: TTS nome errado / UI / mic vibrando / audio loop
- Próximo passo: pedir screenshot ao João

---

## BLOCO N — Fix P0 #12 saveAnalysisToReport (17h, autorizado Pedro)

**Sintoma reportado por Ricardo profissional:**
- Logs 16:34-16:36 BRT mostraram 5 análises de racionalidade (biomedical, traditional_chinese, ayurvedic, homeopathic, integrative) aplicadas à Carolina
- TODAS geraram análise via GPT-4o (Assistant API + Core OK)
- TODAS falharam ao persistir: `"Erro ao salvar análise no relatório: Object"` + `"Persistência parcial — Verifique permissões (RLS)"`

**Causa raiz (16 queries empíricas via PAT):**
- Trigger `trigger_assessment_score` em `clinical_reports` UPDATE/INSERT dispara `register_assessment_score()`
- Função tem `prosecdef=false` (SECURITY INVOKER) — roda com auth.uid() do usuário
- Insert em `ai_assessment_scores` falha por RLS:
  - 2 SELECT policies (admin + own) ✅
  - 0 INSERT policies ❌ AUSENTE
  - 0 UPDATE policies ❌ AUSENTE
- Pipeline automático funcionava (Edge Function usa service_role bypass RLS)
- Profissional via supabase-js ficava bloqueado pelo trigger

**Fix aplicado (Opção A — CREATE POLICY):**
```sql
CREATE POLICY "scores_insert_pro_admin"
ON public.ai_assessment_scores FOR INSERT
WITH CHECK (
  is_admin() OR EXISTS (
    SELECT 1 FROM public.users
    WHERE users.id = auth.uid()
      AND lower(COALESCE(users.type, ''::varchar)::text)
          = ANY (ARRAY['professional'::text, 'profissional'::text])
  )
);
```

**Padrão espelhado:** with_check idêntico ao `rationalities_insert_pro_admin` (princípio "polir não inventar").

**Validação anti-regressão:**
- BEFORE: 2 policies — total 312 rows / 96 unique reports
- AFTER:  3 policies — total 312 rows / 96 unique reports (sem mudança)
- Outras tabelas inalteradas (clinical_reports 96, clinical_rationalities 75, clinical_axes 375)
- Cadeado V1.9.95+97+98+99-B intacto
- Tag v1.9.113-locked preservada
- Zero código tocado, zero deploy

**Smoke pendente:** Ricardo testar nova racionalidade pra confirmar fim do bug.

**Reversão (se necessário):**
```sql
DROP POLICY "scores_insert_pro_admin" ON ai_assessment_scores;
```

---

## MÉTRICAS DA SESSÃO 04/05/2026

### Commits cirúrgicos (8)

```
8daa2e9  V1.9.123-A reminders 24h+1h
8901356  ESTRATEGIA_MARCA_CNPJ_FINAL.md
19c13d5  PARTNERSHIP_FRAMEWORK.md
e33ad9e  MENSAGEM_ADVOGADO_E_PAULO
b6cb0aa  MAPA_BUGS_E_AJUSTES
b0c1afc  LIVRO_MESTRE v1.0 inicial
57db998  LIVRO_MESTRE atualizado decisão final
6f14016  REALIDADE_vs_LIVRO_MESTRE cruzamento empírico
[hoje]   DIARIO + BRIEFING próxima sessão
```

### Push 4 refs em todos
- amigo/main, amigo/master, medcannlab5/main, medcannlab5/master ✅

### Type-check
- Baseline 32 erros mantido (zero novos em todos commits)

### Lock V1.9.95+97+98+99-B preservado
- Zero backend tocado em qualquer commit
- Apenas frontend + docs + Edge isolada (video-call-reminders)

---

## DECISÕES SELADAS HOJE

```
🟢 Estrutura empresarial:
  Caminho B simplificado (1 CNPJ MedCannLab Tech)
  Sem CNAE médico inicial
  Cap table 4×20% + 20% tesouraria

🟢 Marca/INPI:
  IMRE registra 3 classes (42/44/41) — R$ 1.065
  MedCannLab opera sem registrar (uso continuado)
  Nôa Esperanza preservada (autoral Ricardo)

🟢 Parcerias:
  Framework geral 5 tipos
  1Pure como caso (cláusula PR João)
  Multi-fornecedor desde início

🟢 Modelo CAR:
  CAR é projeto Ricardo (não MedCannLab)
  Se virar contrato: subcontratação intercompany
  PJ Ricardo Valença Serviços de Saúde fica como parceira

🟢 Produto:
  V1.9.123-A em prod (medindo cancelamento)
  V1.9.121 aguarda mockup textual + Ricardo
  Lead_free anônimo aguarda CNPJ
  Fix Carolina cirúrgico aguarda autorização
```

---

## PENDÊNCIAS HUMANAS

```
🔴 Pedro (esta semana):
  ☐ Confirmar capital R$ 5k vs R$ 10k
  ☐ Atualizar + enviar mensagem Paulo (simplificada sem CNAE médico)
  ☐ Enviar mensagem advogado (3 candidatos)
  ☐ Reunião casa Ricardo 14h hoje

🔴 João (esta semana):
  ☐ AFE 1Pure + lista produtos com nº ANVISA

🟡 Ricardo (próxima sessão):
  ☐ Aceitar Caminho B simplificado
  ☐ Entender modelo subcontratação CAR
  ☐ OK formal acordo quotistas v2.0

🟡 Eduardo (próxima sessão):
  ☐ Apresentar decisão
  ☐ OK formal cap table

🟢 4 sócios juntos:
  ☐ Estado civil + regime de bens
  ☐ Dados pessoais
  ☐ Ata reunião + assinatura
```

---

## FRASE ÂNCORA DO DIA

> **"4 sócios, 4 partes iguais, 1 missão: operacionalizar o método AEC do Dr. Ricardo Valença em escala digital. CAR é projeto Ricardo (pode virar parceria). MedCannLab é nossa empresa coletiva. Caminho B simplificado: 1 CNPJ, cap simétrico, sem misturar com infra que nenhum sócio tem antes da empresa nascer."**

> *"A gente não estrutura empresa em cima de ideia — só em cima de realidade."* — GPT do Ricardo, 04/05/2026.

---

## PRÓXIMO DIÁRIO

Quando alinhamento presencial casa Ricardo concluir + decisões formais (capital, sede, dados pessoais 4 sócios) ou quando V1.9.123-A produzir resultado empírico mensurável (efeito em cancelamento appointments).
