# 🅿️ IDEIAS PARKED — Para Depois do Sprint 1

**Criado:** 09/05/2026 (pós-virada para execução)
**Vigência da regra:** 09/05/2026 → 16/05/2026 (ou até Sprint 1 medindo, o que vier primeiro)
**Regra de blindagem:** ver `~/.claude/.../memory/feedback_freeze_analise_estrutural_ate_16_05.md`

---

## Como usar este arquivo

### ✅ FAZER quando aparecer ideia arquitetural nova entre 09/05 e 16/05:
- Adicionar entrada em **1-2 linhas** no formato:
  ```
  - [DATA] — [ideia em 1 linha]. Avaliar pós-Sprint 1 medido.
    Origem: [Pedro / Ricardo / GPT externo / outro]
    Conexão com blueprint v2: [estágio do ciclo OU "novo eixo"]
  ```

### ❌ NÃO FAZER:
- Blueprint v3
- Nova memória persistente em `~/.claude/.../memory/`
- Novo `DOC_MESTRE_*.md`
- Novo bloco expansivo em diário
- Mais conversa GPT externa pedindo análise da ideia
- Refatoração do blueprint v2 cristalizado

---

## Exceções legítimas que QUEBRAM o freeze

1. **Bug crítico de segurança** descoberto que exija decisão arquitetural imediata
2. **Ricardo responde 9 decisões clínicas** e alguma resposta invalida premissa do blueprint v2
3. **Sprint 1 codado e medido** (~D+7 a D+14) gera empírico que muda direção
4. **Resposta Muhdo D+1** abre prioridade nova (ex: pedem demo ao vivo D+3)
5. **Pedro decide explicitamente** quebrar o freeze por motivo registrável aqui

Em caso de exceção: registrar abaixo na seção "Exceções acionadas" antes de quebrar.

---

## Parking Lot — Ideias capturadas (entre 09/05 e 16/05)

- [09/05] — **Galeria de NFTs do médico** (tab nova em ProfessionalMyDashboard).
  Volume real: ~1h. **ZERO schema novo**, ZERO service novo, ZERO tabela nft_shares.
  Reuso 100%: RLS de `patient_nfts` JÁ permite profissional ver via JOIN
  `clinical_reports.doctor_id` (validado via PAT). Reusar `PatientNFTGallery.tsx`
  com prop `mode='professional'` + filtro WHERE pacientes do médico.
  Vínculo paciente↔médico já vem grátis do schema — NÃO precisa "compartilhar"
  como ação explícita. Médico vê NFTs dos pacientes que ele atende.
  Avaliar pós-Sprint 1 medido + sinal Ricardo/Eduardo demandar contexto visual.
  Origem: Pedro 09/05
  Conexão: estágio 4 LONGITUDINAL (camada simbólica) — polish do fluxo já existente

- [09/05] — **NFT da revisão clínica + compartilhamento explícito paciente→médico**
  (versão completa, NÃO recomendada agora).
  Stack: 2 cols em `patient_nfts` (`nft_type`, `triggered_by_review_id`) + tabela
  `nft_shares (nft_id, professional_id, shared_at, revoked_at)` + UI revoke +
  Edge `generate-nft-from-report` aceitar `?type=revision&review_id=X`.
  Volume: ~6-8h. Risco: 2 NFTs do mesmo evento clínico podem confundir paciente.
  Gates pra reabrir: ≥5 devoluções reais + paciente espontaneamente gerar NFT
  pós-devolução + médico mencionar querer "coleção visual de pacientes revisados".
  Se 2 dos 3 acontecerem → V1.9.21x. Senão → parked permanente.
  Origem: Claude (proposta) + Pedro (curadoria) 09/05
  Conexão: estágio 4 LONGITUDINAL — feature nova, NÃO polish

- [13/05] — **NFT = royalty + ranking + gamificação natural (tese Ricardo 13/05)**
  Cristalização empírica do Ricardo via WhatsApp 12h41-12h44 BRT em reação ao
  V1.9.243+244: "Se o paciente quiser compartilhar o NFT dele com o médico,
  valida o royalty. Pela qualidade do atendimento. Se gostar, compartilha — é
  assim que funciona no mundo real. E assim organiza o ranking de pacientes
  satisfeitos. Já está embutido no custo de tokenização. E gamifica."
  Une 5 vetores em uma só formulação: NFT (Lei 14.063) + royalty (incentivo
  econômico) + ranking marketplace (já ativo V1.9.150-155) + satisfação paciente
  + gamificação mimética ("assim funciona no mundo real" = like/share/review).
  Convergente com ideias parqueadas 09/05 acima (galeria + nft_shares).
  Volume real estimado pós-Sprint 1 + pós-CNPJ: ~10-14h.
  Princípio 59 candidato (pós-freeze 16/05): "Compartilhamento de NFT pelo
  paciente = sinal validado de satisfação clínica = input do ranking de
  qualidade, não decisão IA. Royalty financia o ato. Mimético, não imposto."
  Pedro nota: "kkkk já é mais ou menos o que estamos falando, porém nossa
  avaliação é melhor prosseguir" (mantém freeze, prossegue V1.9.244 atual).
  Origem: Ricardo (criador método AEC) 13/05
  Conexão: estágios 4+5 LONGITUDINAL + camada marketplace

- [09/05] — **IA na página renal coletando exames laboratoriais** (sugestão Ricardo 05/05).
  Nôa pede ao paciente: creatinina, EAS + cultura urinária, US vias urinárias.
  Volume estimado: ~6-8h. Anti-kevlar §2 OK porque Ricardo dita os exames
  específicos (não IA inventa). Bloqueador empírico: 0 exames renais cadastrados
  hoje. Gates pra reabrir: ≥1 paciente real cadastrar 1º exame manualmente +
  Sprint 1 medido. Pós-isso, IA solicitar próximos vira polish.
  Origem: Ricardo Valença 05/05/2026 (mensagem WhatsApp)
  Conexão: estágio 1 INTAKE — Saúde Renal / Cidade Amiga dos Rins

- [09/05] — **Dashboard KPI Cidade Amiga dos Rins (DRC estágios I-V)**.
  Material existe parcialmente: `renal_exams.drc_stage TEXT` + view `v_renal_trend`
  (validados via PAT). Pergunta Ricardo: "quantos pacientes em estágio I, II, III, IV, V?".
  Stack: 1 view nova (`v_drc_stage_distribution`) + 1 card no dashboard admin.
  Volume: ~3h total. Bloqueador empírico: 0 exames renais cadastrados → KPI vazio.
  Gates pra reabrir: ≥10 exames cadastrados (volume estatístico mínimo).
  Origem: Ricardo Valença 05/05/2026
  Conexão: estágio 5 FORMAL_ACT + observabilidade Cidade Amiga

- [09/05] — **Avaliador de Risco DRC** (blueprint pré-kevlar, nunca codado).
  Texto técnico Ricardo menciona "machine learning + alertas precoces".
  Anti-kevlar §2 FORTE: se for codar, Ricardo dita regras manualmente
  (creatinina/eGFR/proteinúria thresholds + intervalos), NÃO ML auto-aprendiz.
  Volume incerto pré-protocolo Ricardo. Parking permanente até decisão clínica
  formal sobre regras de risco.
  Origem: documento pré-kevlar trazido por Ricardo 05/05
  Conexão: estágio 2 STRUCTURING — análise de risco DRC

---

## Terminal de Pesquisa — terreno arado, falta plantar (auditoria 10/05)

> **Frase âncora Pedro 10/05:** *"terreno ja foi arrumado, falta plantar"*
>
> Stack técnico das 4 tabs investigadas está PRONTO. Falta atividade real
> (dados, eventos, alunos, posts). NÃO codar agora — esperar uso real OU
> decisão clínica/curatorial humana.

- [10/05] — **Avaliações (EnsinoDashboard `evaluationInstruments`)** — 🔴 mock
  participantes hardcoded (Rubrica AEC 360º=128, Casos Clínicos=94, Portfolio=76).
  Realidade: 0 alunos no banco. Mesma classe ACDSS / Mock Pesquisa.
  Quando trocar: quando ≥1 aluno real fizer ≥1 avaliação OU esconder seção até
  ter atividade. Volume ~30 min.
  Origem: descoberta 10/05 audit Terminal de Pesquisa
  Conexão: estágio 1 INTAKE — Ensino / Avaliação acadêmica

- [10/05] — **Newsletter & Eventos (EnsinoDashboard `newsletterUpdates`)** — 🔴
  3 itens hardcoded com datas PASSADAS (set-out/2025):
    1. Seminário Internacional Cannabis & Nefrologia 20/09/2025
    2. Bootcamp LabPEC 05/10/2025
    3. ⚠️ "Publicação destacada na Revista Brasileira de Nefrologia (set/2025)"
  ⚠️ Item 3 é claim material — confirmar com Ricardo/Pedro se a publicação
  realmente aconteceu. Se NÃO houve publicação, remover urgente (mesma família
  V1.9.203/206/207 risco regulatório).
  Quando trocar: quando houver evento futuro real OU eliminar seção. Volume
  ~20 min (substituir array por query ou esconder).
  Origem: descoberta 10/05 audit Terminal de Pesquisa
  Conexão: estágio 1 INTAKE — Newsletter / Eventos

- [10/05] — **Mentoria (EnsinoDashboard `mentorshipPrograms`)** — 🟡 NÃO é
  mock numérico, mas config estática. Hardcoded:
    • Dr. Ricardo Valença — "Terça a Quinta • 14h às 20h"
    • Dr. Eduardo Faveret — "Terças • 19h às 21h"
    • IA Nôa Esperança — "Disponível 24h"
  Mentores são reais. Click no card abre modal → INSERT em appointments
  (funcional). Risco: disponibilidade hardcoded pode estar desatualizada.
  Quando trocar: pós-CNPJ + médicos confirmarem horário oficial.
  Volume ~20 min (substituir array por query em users.availability).
  Origem: descoberta 10/05 audit Terminal de Pesquisa
  Conexão: estágio 3 INTERPRETATION + Ensino

- [10/05] — **Library (Base de Conhecimento)** — 🟢 NADA A FAZER
  Validado empíricamente: 46 docs reais, 13 nos últimos 90d, 6 storage buckets.
  Schema completo, queries supabase.from('documents') funcionando, upload ativo.
  Sem mock-data. Tab funcional com conteúdo legítimo. Apenas registro.
  Origem: audit 10/05 (incluído pra completude)

### Critério de reabertura coletiva (3 entradas Avaliações/Newsletter/Mentoria):

```
Sprint 1 medindo (D+14 = 23/05)             — desbloqueia decisão
Ricardo/Pedro confirmar publicação RBN       — urgência item Newsletter
1º aluno real fazer 1ª avaliação             — desbloqueia Avaliações
CNPJ formalizado                              — desbloqueia comercialização
                                                onde essas seções ficam visíveis
```

Princípio aplicado: *"terreno arado, falta plantar"* — não destruir
infraestrutura técnica que está pronta. Esperar uso real OU decisão humana
sobre o que mostrar pré-uso.

<!-- TEMPLATE para futuras entradas:
- [DD/MM HH:MM] — [Ideia em 1 linha]. Avaliar pós-Sprint 1 medido.
  Origem: [autor]
  Conexão: [estágio ciclo OU novo eixo]
-->

---

## Exceções acionadas (registro auditável)

- [09/05 ~18h] — **Exceção #5 (Pedro decide explicit + Exceção #1 cobertura risco)**
  
  **Motivo:** Bug funcional reportado pelo Dr. Ricardo Valença em 05/05/2026 via WhatsApp:
  filtro de busca de paciente em `RenalFunctionModule.tsx` não retorna todos pacientes
  (Carolina Campello invisível). Filtro original usa apenas `clinical_assessments.doctor_id`,
  ignora pacientes vinculados via `clinical_reports.doctor_id`. Bloqueia workflow do
  nefrologista chefe do programa Cidade Amiga dos Rins.
  
  **Justificativa:** Ricardo é stakeholder clínico crítico. Bug bloqueia uso real do
  módulo Saúde Renal. Não é feature nova nem análise estrutural — é fix funcional sobre
  código vivo. Princípio "polir não inventar" aplicado.
  
  **Ação tomada:**
  - Fix em RenalFunctionModule.tsx (V1.9.204): UNION queries clinical_assessments OR
    clinical_reports + dedupe via Set + Promise.all paralelo
  - ZERO mudança schema/RLS/CORE/AEC
  - 3 entradas correlatas adicionadas ao parking (IA renal, KPI DRC, Avaliador Risco)

- [10/05 ~02h] — **Exceção #1 (cobertura risco regulatório CFM 2.314/2022) + #5 (Pedro explicit)**

  **Motivo:** Validação empírica via PAT 10/05 revelou:
  - 9/10 profissionais com `council_state` NULL no banco
  - 9/10 profissionais com `consultation_fee_default` NULL
  - 79/82 appointments com `price` NULL (96%)

  Investigação Profile.tsx + Landing.tsx revelou causa raiz:
  - Profile.tsx UI **JÁ TEM** os 4 campos profissional (não é falta de UI)
  - Landing.tsx signup tinha só 1 campo "Número (UF)" combinado, sem UF separada
  - `councilState` no signup ficava SEMPRE vazio porque não havia dropdown UF
  - Resultado: novos cadastros nunca preenchiam UF → council_state NULL

  Bloqueia prescrição CFM 2.314/2022 (exige identificação completa do prescritor:
  conselho + número + UF). Mesma classe de risco regulatório resolvida em
  V1.9.203 (ACDSS hide) e V1.9.206 (mock Pesquisa).

  **Ação tomada V1.9.207:**
  1. Profile.tsx: banner emerald "Complete seu cadastro" pra profissional
     com campos faltantes (council_state OR consultation_fee OR specialty
     vazios). Não bloqueia, só lembra. Botão "Editar agora" abre form.
  2. Landing.tsx signup: separou campo "Número (UF)" em 3 inputs (grid 12-cols):
     - Conselho dropdown (CRM/CRO/CRP/CRF/CREFITO/COREN)
     - Número (text)
     - UF dropdown 27 estados brasileiros
  3. handleRegister: valida obrigatoriedade pra profissional antes de criar
     conta. Mensagem: "Para profissionais, informe Conselho + Número + UF
     (obrigatório CFM 2.314/2022)"
  - ZERO mudança schema (campos já existem em users.council_*)
  - Dado existente do Ricardo "5253203-7" em council_state mantido — fix
    de dados é separado, decisão dele migrar manualmente pra council_number
  - Pacientes / alunos / admin não afetados

- [10/05 ~01h] — **Exceção #1 (cobertura risco regulatório) + #5 (Pedro explicit)**

  **Motivo:** Tela `Terminal de Pesquisa → Dashboard de Pesquisa` exibia bloco
  "Integrações e Conexões" com 6 números mock hardcoded enganosos:
  ```
  Tela mostrava   vs   Real (PAT 10/05)
  89 casos AEC         9-25 (3-4× inflado)
  34 profissionais     10  (3.4× inflado)
  156 dados clínicos   87  (1.8× inflado)
  124 pacientes        25  (5× inflado)
  856 alunos            0  (∞ inflado — ZERO alunos no banco)
  3 estudos             0  (?× inflado)
  ```
  Mesma classe de risco regulatório resolvida em V1.9.203 (ACDSS hide).
  Mock parece claim falso material pra Muhdo / parceiros / pacientes externos.

  **Justificativa adicional:** botões "Acessar Curso" eram redundantes com Catálogo
  de Cursos do sidebar (linhas 147-148, 268-269, 302). Esta aba é Terminal de PESQUISA,
  não ENSINO — conteúdo desalinhado com o nome.

  **Ação tomada:**
  - V1.9.206: substituído bloco "Integrações e Conexões" em
    `src/components/ResearchDashboardContent.tsx` por:
    • Card destaque "Cidade Amiga dos Rins" → /app/pesquisa/profissional/cidade-amiga-dos-rins
      (página JÁ EXISTE com 1.352 LOC)
    • Linha discreta atalho "Catálogo de Cursos" (preserva UX sem mock numbers)
  - ZERO mudança schema/RLS/Edge/CORE/AEC
  - Volume real ~30 min, ZERO regressão técnica
  - Páginas que navegam pra `/app/pesquisa/profissional/dashboard` (CidadeAmigaDosRins.tsx,
    JardinsDeCura.tsx, MedCannLab.tsx) continuam funcionando — só conteúdo da aba muda

<!-- TEMPLATE para futuras exceções:
- [DD/MM HH:MM] — Exceção #[N]: [motivo]
  Justificativa: [qual das 5 exceções legítimas]
  Ação tomada: [o que foi feito além de adicionar ao parking]
-->

---

## Auto-check em 16/05/2026

Quando o freeze terminar, fazer auto-check honesto:

- [ ] `IDEIAS_PARKED.md` tem entradas? (sinal de freeze efetivo — ideias capturadas sem expandir)
- [ ] Sprint 1 está implementado / em deploy?
- [ ] Reunião Ricardo aconteceu?
- [ ] 3 ações externas (CNPJ / Ricardo / Muhdo D+1) executadas?

**Se 3+ positivas → freeze cumpriu objetivo.**
**Se ≤2 → padrão análise→defesa voltou. Reavaliar honestamente (memória `project_gap_operacional_humano_3_acoes_externas_09_05.md`).**

---

## Critério de revisão pós-freeze (16/05+)

Para cada item no parking lot:
1. Ainda é relevante depois de Sprint 1 medido?
2. Conecta com gap real validado empíricamente OU é especulação?
3. Move algum dos 3 gates de 60d? (CNPJ / Muhdo Pilot / 1 ciclo médico→receita real)
4. Custa quanto pra implementar vs valor empírico?

Aprovados → entram em blueprint v3 (se houver).
Rejeitados → arquivar no fundo deste arquivo com data + motivo.
Adiados → manter no parking com nova data de revisão.

---

## Audit trail — fix de dado pontual (não migration formal)

### 11/05/2026 — DELETE 3 rules duplicadas em professional_availability (Dr. Ricardo)

**Bug observado:** widget de agendamento mostrava horários duplicados (06:00-16:00 BRT + 11:00-16:00 BRT duplicados). RPC `get_available_slots_v3` retornava 17 rows para 13/05 (quarta) sendo 11 únicos + 6 duplicatas.

**Causa raiz:** Dr. Ricardo (2135f0c0-eb5a-43b1-bc00-5f8dfea13561) tinha 7 rules em `professional_availability`, 3 delas duplicatas sobrepostas (rule A: 09:00-20:00 + rule B: 14:00-20:00 no mesmo day_of_week). Todas as 7 com `created_at: 2026-05-08 00:11:47.874246+00` (microsegundos idênticos = seed automático, não criação humana manual).

**Backup pré-DELETE (JSON completo):**
```json
[
  {"id":"47f2dbc8-eea4-4ed7-b2e8-8d97e25d9235","professional_id":"2135f0c0-eb5a-43b1-bc00-5f8dfea13561","day_of_week":1,"start_time":"14:00:00","end_time":"20:00:00","slot_duration":60,"slot_interval_minutes":null,"is_active":true,"created_at":"2026-05-08 00:11:47.874246+00"},
  {"id":"398ff644-743e-4d1b-81d5-3594767af9c0","professional_id":"2135f0c0-eb5a-43b1-bc00-5f8dfea13561","day_of_week":3,"start_time":"14:00:00","end_time":"20:00:00","slot_duration":60,"slot_interval_minutes":null,"is_active":true,"created_at":"2026-05-08 00:11:47.874246+00"},
  {"id":"0f341e4f-7c14-4a37-be85-e37ba5b8eef5","professional_id":"2135f0c0-eb5a-43b1-bc00-5f8dfea13561","day_of_week":5,"start_time":"14:00:00","end_time":"20:00:00","slot_duration":60,"slot_interval_minutes":null,"is_active":true,"created_at":"2026-05-08 00:11:47.874246+00"}
]
```

**SQL executado:**
```sql
DELETE FROM professional_availability
WHERE id IN (
  '47f2dbc8-eea4-4ed7-b2e8-8d97e25d9235',
  '398ff644-743e-4d1b-81d5-3594767af9c0',
  '0f341e4f-7c14-4a37-be85-e37ba5b8eef5'
);
```

**Validação empírica pós-DELETE:** RPC `get_available_slots_v3` para 13/05 retornou 11 slots únicos (era 17). Estado final: 4 rules (seg/qua/qui/sex), sem sobreposição.

**Rollback (se necessário):** re-INSERT do JSON acima em `professional_availability` (com novos `id` UUIDs).

**Por que não migration formal:** fix-de-dado pontual pré-PMF de 1 médico afetado. Migration tracking seria over-engineering pra DELETE de 3 rows em ambiente com 10 profissionais cadastrados. Documentado aqui para audit trail caso precise repetir o padrão (ex: outro médico cadastrar manualmente com duplicação similar).

**Lição arquitetural:** RPC `get_available_slots_v3` retorna slots por rule sem dedup — comportamento correto, não bug. Defesa contra duplicação futura deve ficar no UI de cadastro de rules (que ainda não existe), não na RPC.

---

## Entries 14/05/2026

### [14/05] — Triagem narrativa pública DRC + AEC Nefro Extension (esboço Ricardo)

**Origem:** Dr. Ricardo Valença enviou pseudocódigo Python (`class NoaEsperanza` com 17 perguntas DRC) junto da RDC ANVISA 1.015/2026.

**Conteúdo do esboço:** 17 perguntas sequenciais — 11 determinantes sociais (idade, sexo, escolaridade, renda, habitação, saneamento, água) + 6 hábitos/comorbidades (sal, tabagismo, álcool, exercício, HAS, DM). Score linear simples (alto > 20 / moderado > 10 / baixo). Sem perguntas laboratoriais (creatinina/TFG/proteinúria intencionalmente fora — captura ANTES de exame).

**Interpretação alinhada com 3 camadas constitucionais (Ricardo 13/05):**
- **Camada 1 — Triagem narrativa pública:** ESSE questionário mora aqui (entrada SEO, score populacional, orientação a procurar atendimento — não diagnóstico)
- Camada 2 — AEC formal: intocada (kevlar §1)
- Camada 3 — Consulta médica: intocada

**Conexão com RDC ANVISA 1.015/2026:** Art. 38 + Anexo II exigem TCLE individualizado por enfermidade. Triagem DRC qualificada alimentaria input pro TCLE em prescrições cannabis para CKD (cenário Cidade Amiga dos Rins). RDC entrou em vigor 04/05/2026.

**Conexão com tese Muhdo:** biological×semantic drift renal — Triagem Camada 1 capturaria *semantic drift* longitudinal (mudança de respostas ao longo do tempo) → input pra cohort CKD.

**Conexão com pitch Prefeitura RJ:** vira diferencial — score de risco DRC nascido em arquitetura clínico-narrativa autoral, não algoritmo blackbox.

**2 alertas a registrar antes de codar:**
1. Modelo de score linear é ingênuo cientificamente. Modelos validados (KDIGO, CKD-PC) usam pesos diferentes por fator + idade + etnia. Pesos precisam curadoria Ricardo OU substituição por modelo já validado.
2. Nome `NoaEsperanza` em Python colide com identidade da IA da plataforma. Se virar feature, deve ser `Camada1_TriagemRenal` ou `TriagemDRCPublica` — preserva identidade Nôa Esperanza completa (memória `project_principio_identidade_noa_esperanza.md`).

**Status:** PARQUEADO. Não codar pré-PMF.

**Condições pra ativar:**
- Pós-freeze 16/05/2026
- Aprovação explícita Ricardo (autor método AEC + curadoria pesos do score)
- Sprint 1 medido (CARD-RJ ou equivalente)
- Decisão pelos 4 sócios se entra como Camada 1 separada ou módulo opt-in da AEC

**Anti-regressão garantida:**
- ZERO toque AEC FSM (kevlar §1)
- Componente novo isolado, rota nova (`/triagem-renal` ou similar)
- Nova tabela `triagem_drc_responses` (não modifica clinical_assessments)
- Feature flag off por padrão até decisão dos 4 sócios

**Por que não agora:** freeze 16/05 ativo. Ricardo enviou material conceitual, não pediu implementação. RDC entrou em vigor há 10 dias, não há urgência regulatória (MedCannLab não é detentora AS). Sprint 1 (Devolution V1) ainda não mediu. Decisão arquitetural grande requer condições maduras.

---

### [14/05] — DRC Risk Module (arquitetura micro-serviço cognitivo isolado)

**Origem:** Conversa Pedro+Ricardo+João saindo casa Ricardo madrugada 14/05 + análise GPT externo. Pedro cristalizou direção arquitetural mais madura que o esboço Triagem original (linha 342 acima).

**Decisão conceitual aprovada pelos 3 sócios:**

DRC Risk **NÃO entra no tradevision-core** (motor longitudinal AEC).
DRC Risk vira **módulo satélite isolado** ativado por **botão explícito no dashboard paciente** (não via chat Nôa).

**Arquitetura proposta (modelo "micro-serviço cognitivo"):**

```
[ Dashboard Paciente ]
       ↓ click explícito (Princípio 11 — eventos explícitos)
[ Botão "Fazer rastreio renal" ]
       ↓
[ Edge Function NOVA: drc-risk-collect ]
       ↓ mesma OPENAI_API_KEY existente
[ gpt-4o-mini com prompt enxuto dedicado ]
       ↓
[ Schema NOVO: drc_risk_assessments ]
   - patient_id, answers jsonb, score, created_at
   - ZERO toque em clinical_assessments
```

**Decisão técnica conservadora (Princípio 8 — polir não inventar):**

- ❌ **NÃO usar OpenAI Assistant API** — custo ~1000× maior ($0.10/1K vs $0.0001/msg)
- ✅ **Reusar OPENAI_API_KEY existente** + gpt-4o-mini (mesmo modelo do V1.9.84 escriba)
- ✅ Edge Function nova isolada (`drc-risk-collect`)
- ✅ Schema próprio (`drc_risk_assessments`) — NÃO em `clinical_assessments`
- ✅ Botão dashboard paciente (não trigger chat)

**4 problemas resolvidos simultaneamente:**

| Problema | Resolve |
|----------|---------|
| Latência AEC (29.5s base) | ✅ DRC paralelo, não bloqueia |
| Sobrecarga GPT principal | ✅ Edge Function separada |
| Risco kevlar §1 | ✅ Zero toque AEC/Pipeline/FSM |
| Escalabilidade futura | ✅ +1 satélite num modelo modular |

**Risco identificado pelo GPT externo:**

> *"Não é incompatibilidade OpenAI. É identidade do usuário + sincronização contexto + race conditions."*

Mitigação: mesmo `user_id`, sessões diferentes, memórias separadas.

```
user_id     = mesmo
session     = diferente
assistant   = não usar (gpt-4o-mini suficiente)
memory      = drc_risk_assessments isolada
```

**Conformidade pré-implementação:**
- LGPD art. 11 §1: paciente consente antes de iniciar rastreio (botão explícito é consent material)
- CFM: rastreio epidemiológico ≠ diagnóstico (não substitui consulta)
- RDC ANVISA 1.015/2026: enquadramento confirmar com Ricardo+Eduardo

**O que DRC Risk NÃO precisa fazer (manter escopo enxuto):**
- ❌ Pipeline ICP-Brasil (não é ato clínico)
- ❌ Verbatim First (não é AEC FSM)
- ❌ Signature_hash (não é prontuário oficial)
- ❌ Longitudinalidade pesada (snapshot único do momento)

**O que DRC Risk faz (enxuto):**
- ✅ Coleta contextual (17 perguntas do esboço Ricardo)
- ✅ Score epidemiológico simples (alto > 20 / mod > 10 / baixo)
- ✅ Determinantes sociais + hábitos + comorbidades
- ✅ Output: card no dashboard "Seu risco renal estimado: X"
- ✅ CTA pós-resultado: "Agendar consulta com Dr. Ricardo"

**Status:** PARQUEADO até pós-evento 15/05 + freeze 16/05 vencer.

**Condições pra ativar:**
- Pós-freeze 16/05
- Pós-evento empírico (validar com Marina + Daniel + Protássio se faz sentido)
- Decisão explícita Ricardo (curadoria pesos do score + 17 perguntas)
- Aprovação dos 4 sócios no enquadramento ANVISA

**Anti-regressão garantida (na hora de codar):**
- Edge Function isolada (`drc-risk-collect`)
- Tabela isolada (`drc_risk_assessments`)
- RLS própria (paciente só vê próprio, profissional via vínculo)
- ZERO toque AEC FSM / Pipeline / tradevision-core / clinical_assessments
- Lock V1.9.95+97+98+99-B intocado

**Conexão com pitch Prefeitura RJ:**
Cidade Amiga dos Rins ativa rastreio populacional via dashboard pacientes cadastrados. DRC Risk vira diferencial empírico — não é algoritmo blackbox, é arquitetura clínico-narrativa autoral com módulo satélite isolado pra rastreio epidemiológico.

**Princípio cristalizado na conversa madrugada 14/05:**

> *"Núcleo AEC permanece intocado. Satélites desacoplados crescem livremente. Cada satélite tem sua própria API, função, fila, latência. Arquitetura de plataforma real, não monolito de prompt."*

(GPT externo nomeou bonito — empíricamente já era a tese da MedCannLab desde V1.9.150-156 Marketplace Layer.)

**Por que NÃO falar como pronto pra Marina amanhã (15/05 20h):**

Marina (CMO Cura+Saúde, 4000 clínicas) pode interpretar *"temos rastreio DRC integrado"* como produto pronto. **Não temos.** Linguagem honesta pra ela:

> *"Nossa arquitetura é modular. Método AEC do Ricardo é o núcleo. Podemos adicionar módulos satélites (DRC, DST, escalas, etc) sem afetar a longitudinalidade do principal."*

= verdadeiro + não promete inexistente.

---

*Este arquivo é parte da disciplina temporal de execução pré-PMF. Não expandir. Não transformar em narrativa. Manter factual e curto.*
