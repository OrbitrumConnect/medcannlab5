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
