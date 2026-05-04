# 🎯 BRIEFING PRÓXIMA SESSÃO — Casa do Ricardo

**Data:** 04/05/2026 14h (presencial)
**Local:** Casa do Dr. Ricardo Valença
**Presentes esperados:** Pedro Galluf + João Vidal + Dr. Ricardo Valença + (talvez Dr. Eduardo Faveret)
**Equipamento:** Laptop do Pedro
**Documento de handoff:** este

---

## 📋 PRA O CLAUDE QUE VAI ATENDER NO LAPTOP DO PEDRO

### Antes de qualquer coisa — execute

```bash
# 1. Pull do estado atual (Pedro fez muitos commits hoje)
git pull amigo main
git pull medcannlab5 main

# 2. Checar último commit
git log --oneline -5

# Esperado ver commits do dia 04/05/2026:
# - feat(reminders): V1.9.123-A janelas 24h e 1h
# - docs(marca): consolidar estrategia marca+CNPJ
# - docs(parcerias): framework geral parcerias
# - docs(legal): mensagens prontas advogado + Paulo
# - docs(map): mapa unificado bugs + riscos
# - docs(master): LIVRO MESTRE v1.0
# - docs(reality): cruzamento empirico
# - docs(diario): 04/05/2026
```

### Documentos canônicos que você DEVE ler antes de qualquer ação

```
1. CLAUDE.md (raiz)                                  ← contexto geral projeto
2. docs/LIVRO_MESTRE_MEDCANNLAB_v1.0.md              ← decisões estratégicas (525 linhas)
3. docs/REALIDADE_vs_LIVRO_MESTRE_04_05.md           ← cruzamento empírico (302 linhas)
4. docs/ESTRATEGIA_MARCA_CNPJ_FINAL.md               ← marca + classes Nice
5. docs/PARTNERSHIP_FRAMEWORK.md                     ← 5 tipos parceiros + 1Pure
6. docs/MENSAGEM_ADVOGADO_E_PAULO_04_05_2026.md      ← mensagens prontas
7. docs/MAPA_BUGS_E_AJUSTES_04_05_2026.md            ← bugs documentados
8. DIARIO_04_05_2026_DECISAO_ESTRUTURAL_FINAL_E_LIVRO_MESTRE.md  ← histórico do dia
```

### PAT Supabase (Pedro vai te passar)

```
URL: https://api.supabase.com/v1/projects/itdjkfubfzmvmuxxjoae/database/query
Auth: Bearer <PAT> (Pedro fornece)

Use pra queries empíricas — NÃO inventar números.
Sempre auditar antes de afirmar.
```

---

## 🎯 ESTADO ATUAL CONSOLIDADO (04/05/2026)

### Estrutura empresarial — DECISÃO FINAL UNÂNIME

```
✅ CAMINHO B SIMPLIFICADO selado por:
   • Pedro Galluf
   • João Vidal
   • GPT do Pedro (review estratégico)
   • GPT do Ricardo (review independente)

⏳ Aguarda alinhamento presencial:
   • Dr. Ricardo Valença
   • Dr. Eduardo Faveret
```

**Estrutura selada:**
```
MEDCANNLAB TECNOLOGIA EM SAÚDE LTDA
  Tipo:      LTDA
  Sede:      Rio de Janeiro
  Capital:   R$ 5.000-10.000 (Pedro confirma com Paulo)
  Regime:    Simples Nacional Anexo III (com fator R)

Cap table (REGRA DE OURO — TODOS IGUAIS):
  Pedro Galluf       20%
  Ricardo Valença    20%
  João Vidal         20%
  Eduardo Faveret    20%
  Tesouraria         20%  (10% ESOP + 10% Growth Pool)

CNAEs:
  • 6204-0/00  Consultoria TI
  • 6209-1/00  Suporte técnico TI
  • 7490-1/04  Intermediação comercial
  • 8599-6/04  Treinamento profissional

⚠️ SEM CNAE médico (8630-5/03) inicialmente
   → MedCannLab é tech/método/educação
   → CAR (se vier) é da PJ Ricardo Valença Serviços de Saúde
   → MedCannLab subcontrata como fornecedora de plataforma
```

### Produto

```
V1.9.123-A em prod (lembretes 24h+1h)
  → Smoke previsto: Maria Helena 06/05 15h
  → Lembrete 24h dispara em 05/05 14-16h BRT
  → Cron rodando, Resend OK

Bug Carolina state inconsistente
  → 0 AECs completas ATIVAS no banco (todas invalidated)
  → Fix #1 cirúrgico aguarda autorização Pedro

V1.9.121 AEC Promoção Progressiva
  → Aguarda mockup textual antes de Ricardo aprovar
  → Fases 0-2 autorizadas, fases 3-6 pós-OK Ricardo
```

### Banco (snapshot empírico)

```
37 users (7 últimos 7d)
23 pacientes / 9 profissionais / 5 admin
95 reports (18 signed pós-V1.9.95, 77 unsigned legacy)
70 appointments / 3 done / 35 cancelled
0 transações pagas / 0 subs ativas
6 cursos cadastrados (2 grátis publicados, 4 pagos não publicados)
161 tabelas / 341 functions / 432 policies
9 Edge Functions ativas
```

---

## 🔴 PRINCÍPIOS NÃO-NEGOCIÁVEIS (não violar)

```
1. REGRA DE OURO — todos os 4 sócios ganham igual
   Cap simétrico desde dia 1, sem assimetria escondida

2. AUDITAR 100% antes de qualquer mudança
   Nunca extrapolar de Lattes/docs sem confirmar empiricamente
   Smoke real, não count > 0

3. POLIR NÃO INVENTAR (P8)
   Reusar mecanismo existente antes de criar paralelo

4. P10 — sem substituição silenciosa de responsabilidade
   Toda decisão precisa sinalização explícita + ata + cláusula

5. Lock V1.9.95+97+98+99-B INTOCÁVEL
   Zero modificação no Core (tradevision-core)
   Zero modificação no FSM AEC
   Zero modificação no Pipeline orchestrator
   Apenas frontend + docs + Edges isoladas

6. Push 4 refs sempre (política obrigatória)
   amigo/main + amigo/master + medcannlab5/main + medcannlab5/master
```

---

## 🚦 O QUE PODE DISCUTIR NESTA SESSÃO

### ✅ Aberto pra alinhamento (não decidido)

```
☐ Capital social: R$ 5.000 vs R$ 10.000
   → Recomendação: R$ 10k (passa mais "seriedade" pra banco/fornecedor)

☐ Sede física: confirmar Rio de Janeiro
☐ Estado civil + regime de bens dos 4 sócios
☐ Dados pessoais (RG, CPF, endereço, comprovante)
☐ Anuência de cônjuges se aplicável

☐ Texto exato cláusula partes relacionadas (João/1Pure + Ricardo/PJ)
☐ Ata de aprovação parceria 1Pure
☐ Decisão sobre advogado (3 candidatos: KLA, Cescon, Bichara)

☐ Modelo intercompany Ricardo PJ × MedCannLab Tech
   → Quando CAR virar contrato (se vier)
   → Fee fair market value Clínica Ricardo → MedCannLab
```

### ❌ FECHADO — não reabrir

```
❌ Caminho A (usar PJ Ricardo) — descartado por unanimidade
❌ Caminho C (incluir 4 sócios na PJ Ricardo) — descartado
❌ Adicionar CNAE médico 8630-5/03 inicialmente
❌ Criar Clínica MedCannLab Saúde adicional
❌ Estruturar empresa em função do CAR (CAR é ideia, não receita)
❌ Mudar nome MedCannLab ou Nôa Esperanza
❌ Lead_free anônimo antes de CNPJ + advogado
❌ Cobrar taxa cancelamento <48h antes de validar V1.9.123-A
```

---

## 🎯 ROTEIRO SUGERIDO DA SESSÃO

### 1. Status update (10 min)

- V1.9.123-A em prod (lembretes 24h+1h)
- 9 cadastros últimos 7 dias (tração)
- 7 documentos canônicos selados

### 2. Apresentar Caminho B simplificado pro Ricardo (15 min)

Pontos-chave:
- "Ricardo, tua PJ Ricardo Valença Serviços de Saúde NÃO some"
- "MedCannLab vira PJ paralela, dos 4 igualmente"
- "CAR (se virar contrato) usa tua PJ + subcontrata MedCannLab"
- "Modelo padrão (Memed faz assim com prefeituras)"
- "0 receita hoje + CAR é ideia = sem urgência pra fundir agora"
- "Tua autoridade clínica não diminui — é o pilar do produto"

### 3. Apresentar pro Eduardo (10 min)

- Decisão estrutural
- Cap table 4×20% (ele inclusive)
- Papel: Conselheiro Científico + neurologia
- O que ele precisa fornecer (dados pessoais, anuência cônjuge se aplicável)

### 4. Decisões abertas (20 min)

- Capital social R$ 5k vs R$ 10k
- Sede RJ confirmada?
- Estado civil + regime de bens (cada um)
- Quem assina cláusula partes relacionadas (João já + Ricardo se aplicável)

### 5. Próximos passos (5 min)

- Pedro envia Paulo (mensagem atualizada simplificada)
- Pedro envia advogado (3 candidatos)
- João envia AFE 1Pure
- Reunião formal pra ata (ainda esta semana ou próxima)

---

## 🛠️ COMANDOS ÚTEIS PRO CLAUDE NO LAPTOP

### Auditar banco (com PAT)

```bash
curl -s -X POST "https://api.supabase.com/v1/projects/itdjkfubfzmvmuxxjoae/database/query" \
  -H "Authorization: Bearer <PAT>" \
  -H "Content-Type: application/json" \
  -d '{"query":"SELECT COUNT(*) FROM users;"}'
```

### Verificar V1.9.123-A em prod

```bash
curl -s -X POST "https://itdjkfubfzmvmuxxjoae.supabase.co/functions/v1/video-call-reminders" \
  -H "Authorization: Bearer <ANON_KEY>" \
  -H "Content-Type: application/json" \
  -d '{}'
# Esperado: {"ok":true, "stats":{"scanned":N,...}}
```

### Push 4 refs (política obrigatória)

```bash
git push amigo HEAD:main && git push amigo HEAD:master && \
  git push medcannlab5 HEAD:main && git push medcannlab5 HEAD:master
```

### Type-check baseline

```bash
npm run type-check 2>&1 | grep -E "^src.*error TS" | wc -l
# Esperado: 32 (baseline pré-existente, zero novos)
```

---

## 📂 LOCALIZAÇÃO DE MEMÓRIAS PERSISTENTES

Memórias do Claude ficam em:

```
~/.claude/projects/c--Users-<user>-Desktop-amigo-connect-hub-main/memory/
```

**No laptop do Pedro:** caminho será similar mas com `<user>` diferente.

**As memórias NÃO são versionadas no git** — ficam locais. Por isso:
- Diários no repo cobrem histórico
- LIVRO_MESTRE no repo cobre decisões estratégicas
- Memórias locais cobrem nuances de sessões anteriores

**Memórias críticas a procurar no laptop do Pedro:**
- `MEMORY.md` (índice)
- `project_v1_9_121_aec_promocao_selada_03_05.md`
- `feedback_auditar_100_antes_de_qualquer_mudanca.md`
- `feedback_p10_substituicao_silenciosa_responsabilidade.md`
- `feedback_polir_nao_inventar.md`

---

## 🔥 SE TIVER DÚVIDA SOBRE QUALQUER COISA

```
1. Verificar empiricamente no banco/código (PAT Supabase + Read)
2. Consultar LIVRO_MESTRE (canônico)
3. NÃO extrapolar
4. NÃO inventar
5. Se o usuário (Pedro/Ricardo/João/Eduardo) afirmar algo, validar antes de codar
```

---

## ⚠️ AVISOS IMPORTANTES

```
1. Pedro tem 2 contas no banco:
   • UUID 17345b36 — admin (passosmir4@gmail.com)
   • UUID d5e01ead — paciente teste (Pedro Paciente)
   NÃO confundir uma com a outra em queries

2. Ricardo tem 2 contas:
   • UUID 99286e6f — admin (iaianoa@gmail.com)
   • UUID 2135f0c0 — profissional REAL (rrvalenca@gmail.com)
   NÃO confundir

3. Carolina Campello tem UUID 5c98c123
   É CONTA TESTE do Ricardo, NÃO paciente real
   Tem 31 reports + 9 consultas (todos teste)

4. Bug Carolina state inconsistente:
   • aec_assessment_state.invalidated_at populado de 25/04
   • Mas phase=FINAL_RECOMMENDATION, is_complete=true (atualizado hoje)
   • Fix #1 cirúrgico: UPDATE invalidated_at=NULL onde phase=COMPLETED
   • NÃO aplicar sem autorização Pedro

5. Pacientes externos legítimos cadastrados últimos 7 dias:
   • Maria Helena Chaves (golden case 03/05)
   • Pedro Alberto Protasio
   • Badhia Waarrak
   • Ana Ventorini (profissional)
   • Othon Berardo Nin
   • Carlos Felipe Nascimento
   • Solange Rodrigues
   NÃO confundir com contas teste
```

---

## 🎯 FRASE ÂNCORA PRA REFERÊNCIA

> **"4 sócios iguais. 1 CNPJ MedCannLab Tech. Sem CNAE médico (CAR é projeto Ricardo, não nossa empresa). Cap table simétrico desde dia 1. PJ Ricardo continua existindo como parceira clínica natural. Tudo o que crescer, fica nos 4 igualmente."**

> *"A gente não estrutura empresa em cima de ideia — só em cima de realidade."* — GPT do Ricardo, 04/05/2026.

---

## ✅ CHECKLIST FINAL PRA SAÍDA DA SESSÃO

```
☐ Ricardo + Eduardo OK formal Caminho B simplificado
☐ Capital social decidido (R$ 5k ou R$ 10k)
☐ Sede confirmada (RJ)
☐ Estado civil + regime bens dos 4 sócios anotado
☐ Próxima reunião agendada (pra ata formal)
☐ Pedro pode enviar Paulo + advogado após a sessão
```

---

## 🆘 SE ALGO DER ERRADO TÉCNICAMENTE

```
1. Vercel auto-deploy quebrou:
   → Ver Actions no GitHub (medcannlab5)
   → Workflow deploy-* deve ter status=success

2. Edge function não responde:
   → Verificar workflow deploy-video-call-reminders
   → npx supabase functions logs video-call-reminders --project-ref itdjkfubfzmvmuxxjoae

3. Banco inconsistente:
   → Audit empírico via PAT Supabase
   → Comparar com LIVRO_MESTRE expected state

4. Type-check falhou:
   → Baseline é 32 erros (legacy imre_assessments + clinical_integration)
   → Se passou disso, há regressão
```

---

**FIM DO BRIEFING.**

Próximo Claude: bom trabalho. Lê o LIVRO_MESTRE primeiro. Não inventa. Audita antes de afirmar. Push 4 refs sempre. Lock V1.9.95+ é sagrado.
