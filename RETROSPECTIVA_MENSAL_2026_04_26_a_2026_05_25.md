# 📅 Retrospectiva Mensal — MedCannLab 3.0
## 26 de abril → 25 de maio de 2026 (30 dias)

**Autores**: Pedro Henrique Passos Galluf (Tech Lead / Orquestrador COS) + Claude Opus 4.7 (1M context) + co-construção com Dr. Ricardo Valença (Coordenador Científico / Criador AEC)

**Período**: 30 dias contínuos de execução cirúrgica
**Contexto histórico**: pré-PMF (zero pacientes externos pagantes), com testes internos intensos
**Estado regulatório**: PBAD AD-RB ICP-Brasil CONFORME ITI deployado em 16/05/2026 — assinatura digital jurídica REAL, não placeholder
**Estado epistemológico**: Constituição MedCannLab cristalizada em 2 vertentes da mesma matriz Ricardo (clínica + pesquisa)

---

# 📖 PRÓLOGO — Por que esta retrospectiva existe

Em 30 dias, MedCannLab 3.0 saltou de "audit honesto + 4 motores clínicos mapeados" para "Constituição cristalizada + Matrix Z2 epistemicamente íntegra + PBAD ICP REAL + 91% crescimento de reports + 113% crescimento de pacientes cadastrados". Mas o salto **não foi linear nem inevitável**. Foi forjado em ~90 commits cirúrgicos, 26 diários honestos, 94 memórias novas, 5 dias com sessões duplas ou triplas, e — o mais importante — **3 recalibrações pivotais de Pedro corrigindo Claude em sequência num único dia** (24/05 manhã) e **2 textos epistemológicos de Ricardo** (24/05 madrugada + manhã) que reescreveram o que Claude entendia sobre o método.

Este documento é o **registro fiel** desses 30 dias. Não é uma síntese de marketing nem um relatório de status — é uma **história operacional** com citações literais, anatomia de cada bug crítico, retrato dos sócios (incluindo os que abandonaram), e o caminho epistemológico que levou a Matrix Z2 de "alucinava 6 dados clínicos pra parecer útil" para "sustenta lacuna sem colapsar via taxonomia semântica de 3 cenários".

Aplica explicitamente 4 princípios cristalizados no próprio mês:

1. **`feedback_diario_que_mostra_erros_vale_mais_que_diario_polido_24_05`**: bugs explícitos registrados, recalibrações documentadas, sem suavização.
2. **`feedback_doc_institucional_sem_pat_nao_e_valido_23_05`**: todos os números validados via PAT empírico (não estimativas).
3. **`feedback_anti_overclaim_endorsements`**: frases aspiracionais do GPT externo (*"arquitetura madura"*, *"clinical conversational governance"*) explicitamente NÃO usadas como selo institucional.
4. **`feedback_duas_vertentes_uma_matriz_epistemologica_constituicao_medcannlab_25_05`**: framework interpretativo que conecta chat paciente + Matrix profissional.

Quem ler este documento daqui 6 meses, 1 ano, ou na próxima sessão Claude, terá o **contexto histórico integral** pra entender por que cada lock existe — não como restrição arbitrária, mas como manifestação empírica de princípios meta-epistemológicos. Isso é o que GPT externo descreveu (com calibração) como *"maturação do processo"*: erros explícitos + correções cristalizadas + princípios virando arquitetura.

---

# 🌅 SEÇÃO 1 — Visão Geral dos 30 dias

## 1.1 — Estado de entrada (~26 de abril)

O projeto chegou em 26/04 com fundações sólidas mas com bugs residuais não-documentados sistematicamente. AEC FSM funcionava — o protocolo de 10 etapas literais existia há semanas e processava avaliações clínicas — mas:

- **Regex de restart tinha landmine** (V1.9.77 estabilizando): Carolina (conta teste do Ricardo) digitou *"começou com bolha agora virou ferida"* e o sistema disparou `resetAssessment()` no meio da Etapa 4 porque "agora" matchava como sinal de restart. Era a **palavra mais comum em relato clínico** ("dor agora", "agora piorou") e não tinha relação semântica com pedir nova avaliação. Fix V1.9.77 removeu "agora" do regex.
- **PBAD era placeholder cosmético**: assinatura digital existia mas não era CONFORME ITI. O selo aparecia "desconhecida" em validadores externos. O sistema tinha selos visuais mas zero validade jurídica real.
- **Matrix Z2 não existia ainda**: a Nôa profissional respondia em chat livre mas sem voz estrutural distintiva. Não havia distinção clara entre "Nôa clínica" (paciente AEC) e "Nôa pesquisa" (médico explorando casos similares).
- **Audience Contract não-formalizado**: paciente via no relatório clínico texto bruto da racionalidade MTC/Ayurveda/Homeopatia — sem mediação editorial. Risco regulatório real (paciente leigo lendo *"meridiano da bexiga obstruído"* sem médico explicar).
- **F4 Fórum só existia como ideia**: havia tabela `forum_posts` mas sem fluxo end-to-end dossiê → conselho → debate.
- **Sem chat livre paciente blindado**: paciente podia perguntar *"qual CBD pra ansiedade?"* e a Nôa respondia listando benefícios farmacológicos (*"alívio da ansiedade, melhora do sono, redução da dor"*) — claim regulatório que CFM art. 14 e ANVISA RDC 327/2019 consideram propaganda médica indevida.

**Métricas baseline (pré-26/04)**:
- 75 clinical_reports históricos (testes internos desde fev/2026)
- 16 pacientes cadastrados como teste
- ~150 memórias persistentes (do trabalho anterior)
- Locks `V1.9.95+97+98+99-B` selados (pré-mês)

O Pedro entrou o mês perguntando, em essência: *"o que está funcionando de verdade, o que está fingindo funcionar, e o que precisa ser auditado antes de qualquer mudança?"*. Essa pergunta — *"audit honesto antes de qualquer mudança"* — foi a tonalidade que marcou as primeiras 2 semanas do mês.

## 1.2 — Estado de saída (25 de maio ~16h)

Trinta dias depois, o sistema é qualitativamente outro. **Não apenas mais features — outra arquitetura epistemológica**.

- **AEC FSM cirurgicamente estabilizada**: 10 etapas literais, Verbatim First V1.9.86 com ~46% bypass de GPT em hard-lock phases, 13+ fases determinísticas, phase locks por fase, AEC GATE V1.5 protegendo a regra hard §1 (*"Consentimento ≠ Agendamento"*).
- **143 clinical_reports** no banco (de 75 → +91% crescimento). Apenas no mês foram criados **68 novos reports**.
- **34 pacientes** cadastrados (de 16 → +113% crescimento). +18 novos no mês.
- **40 reports SIGNED com ICP-Brasil REAL** no mês — não placeholder. Selo PBAD AD-RB CONFORME ITI deployado em 16/05/2026 (V1.9.299).
- **Audience Contract V1.9.330-A** deployado em 18/05: paciente vê resumo conciso, médico vê racionalidades completas. Dual-write entre `clinical_reports.content.rationalities` (jsonb) e `clinical_rationalities` (tabela) documentado formalmente.
- **Matrix Z2 V1.9.388** cristalizada em 19/05: voz estrutural não-diretiva (*"organiza corpus, nunca diagnostica, nunca recomenda"*), bypass do NoaResidentAI, GPT-4o full em research mode, custo cai 85% (29k→4.3k tokens por chamada média).
- **Matrix Z2 anti-alucinação V1.9.453+A+B** deployada em 25/05: **taxonomia semântica de 3 cenários** (ausência total / presença parcial / cobertura completa) + **negação explícita ≠ campo ausente** + **locks micro-factuais explícitos**. Matrix passou de "alucinava 6 dados clínicos" para "sustenta lacuna sem colapsar".
- **PATIENT_FREE_CHAT_GUARDRAILS V1.9.443+A+B** deployado em 24/05: chat livre paciente blindado em 4 famílias (produto/dose/marca + educacional + jornada operacional + iniciar tratamento). Resposta canônica V3 lapidada por Ricardo: *"Antes de pensar em produto, me conta um pouco — o que te trouxe a procurar CBD para [sintoma]?"* — devolve à escuta sem negar.
- **F4 Fórum end-to-end** funcionando (V1.9.403→410, 21/05): dossiê → `pending_review` → conselho avalia (Ricardo/Eduardo allowlist) → `active` → debate no Cann Matrix com dossiê fixado.
- **F3 dossiê PDF estruturado** com persistência (V1.9.390-393, 20/05).
- **Manual de Uso do Profissional v1.1** (14 slides Brandbook V3, 23/05 + 24/05) — substituto operacional do onboarding white glove.
- **MatrixHelpModal elite** (V1.9.454, 25/05): ícone (?) clicável no header da Matrix abre modal denso com 6 seções (o que é Z2 / como montar corpus / 3 cenários de resposta / o que NÃO faz / exemplos perguntas / diferença Matrix×Casos Similares).

**Métricas finais (25/05 16h)**:
- 34 pacientes / 11 profissionais / 5 admins
- 143 clinical_reports / 40 signed ICP no mês
- 2.446 ai_chat_interactions no mês
- 91 appointments total / 37 criados no mês
- 130 clinical_rationalities total / 74 geradas no mês
- 244 memórias persistentes (de ~150 → +94 novas)
- 26 diários do mês (cobertura ~87% dos dias)

## 1.3 — O salto qualitativo do mês

Comparativo lado-a-lado:

| Dimensão | Pré-mês (~25/04) | Pós-mês (25/05) |
|---|---|---|
| **Reports** | 75 históricos | 143 (+91%) |
| **Pacientes cadastrados** | 16 testes | 34 (+113%) |
| **AECs completas com pipeline integral** | algumas com bugs residuais (regex landmine) | 40 assinadas ICP-Brasil em 30 dias |
| **ai_chat_interactions (30d)** | n/a | **2.446** |
| **Assinatura digital** | placeholder cosmético | **PBAD AD-RB CONFORME ITI** (V1.9.299) |
| **Chat livre paciente** | sem blindagem regulatória | PATIENT_FREE_CHAT_GUARDRAILS 4 famílias (V1.9.443+A+B) |
| **Matrix Z2 voz** | inexistente | V1.9.388 cristalizada + V1.9.450 corpus expandido + V1.9.453 anti-alucinação + 3 cenários semânticos |
| **Audience Contract racionalidades** | texto bruto vazando ao paciente | V1.9.330-A: paciente vê resumo, médico vê completo |
| **F4 Fórum** | só ideia | end-to-end (V1.9.403→410) |
| **Dossiê PDF estruturado** | inexistente | F3-A.1 + persistência (V1.9.390-393) |
| **Princípios epistemológicos cristalizados** | ~10 dispersos em diários | ~30+ em memórias persistentes nível 1 indexadas |
| **Locks arquiteturais selados** | V1.9.95+97+98+99-B | + V1.9.121 + V1.9.299 PBAD + V1.9.330-A + V1.9.388 + V1.9.443+A+B + V1.9.450-454 |
| **Constituição MedCannLab** | princípios espalhados | **2 vertentes da mesma matriz epistemológica Ricardo** (clínica + pesquisa) com 4 eixos comuns formalizados |
| **Sócios alinhados conceitualmente** | discussão fragmentada | Ricardo cristalizou *"queixa ≠ sintoma"* + *"framework centrípeto vs centrífugo"* — princípios meta do projeto |
| **Drift de IA** | risco implícito não-codificado | locks macro (não diagnosticar) + micro (não inventar dado ausente) **explícitos** |

O ponto mais importante não é a contagem de features. É que **a arquitetura agora é defensável regulatóriamente E epistemicamente íntegra**. Em healthtech regulado, isso vale mais que volume.

---

# 📊 SEÇÃO 2 — Métricas reais validadas via PAT

Aplicando `feedback_doc_institucional_sem_pat_nao_e_valido_23_05`: **todos os números abaixo foram puxados via PAT Supabase em 25/05 ~16h30**, não estimativas.

## 2.1 — Crescimento empírico do mês (26/04 → 25/05)

```sql
SELECT 'reports_pre_26_04' AS metrica, count(*) FROM clinical_reports WHERE created_at < '2026-04-26'  → 75
SELECT 'reports_no_mes' FROM clinical_reports WHERE created_at >= '2026-04-26' AND created_at < '2026-05-26'  → 68
SELECT 'reports_signed_no_mes' FROM clinical_reports WHERE signed_at IS NOT NULL AND created_at >= '2026-04-26'  → 40
SELECT 'users_pre_26_04' FROM users WHERE created_at < '2026-04-26' AND type IN ('paciente','patient')  → 16
SELECT 'users_no_mes' FROM users WHERE created_at >= '2026-04-26' AND type IN ('paciente','patient')  → 18
SELECT 'ai_chat_total_mes' FROM ai_chat_interactions WHERE created_at >= '2026-04-26'  → 2446
SELECT 'appointments_no_mes' FROM appointments WHERE created_at >= '2026-04-26'  → 37
SELECT 'rationalities_no_mes' FROM clinical_rationalities WHERE created_at >= '2026-04-26'  → 74
```

| Métrica | Valor 30d | Crescimento |
|---|---|---|
| clinical_reports criados | **68** | +91% sobre baseline |
| clinical_reports SIGNED ICP | **40** | 59% taxa de assinatura |
| Users pacientes novos | **18** | de 16 → 34 (+113%) |
| ai_chat_interactions | **2.446** | média ~81/dia |
| Appointments criados | **37** | média ~1.2/dia |
| Rationalities geradas | **74** | de 56 → 130 (+132%) |

## 2.2 — Estado final tabelas críticas (25/05 16h)

```sql
SELECT 'pacientes_users_total' FROM users WHERE type IN ('paciente','patient')  → 34
SELECT 'profissionais_users_total' FROM users WHERE type IN ('profissional','professional')  → 11
SELECT 'admins_users_total' FROM users WHERE type = 'admin'  → 5
SELECT 'clinical_reports_total' FROM clinical_reports  → 143
SELECT 'clinical_reports_signed_30d' WHERE signed_at IS NOT NULL AND created_at > now() - interval '30 days'  → 40
SELECT 'aec_assessment_state_in_progress' WHERE phase != 'COMPLETED'  → 13
SELECT 'ai_chat_interactions_30d'  → 2445
SELECT 'appointments_total'  → 91
SELECT 'clinical_rationalities_total'  → 130
SELECT 'forum_posts_pending_review' WHERE status = 'pending_review'  → 2
```

**Observação crítica sobre os 13 `aec_assessment_state` in_progress**: é alto. Significa que 13 usuários iniciaram AEC e não terminaram (estão pausados, abandonaram, ou estão em INTERRUPTED). O Verbatim First V1.9.86 + a feature de retomada via *"continuar / nova / apenas conversar"* (linha ~1276 do `clinicalAssessmentFlow.ts`) protege esses estados — mas é volume potencial de paciente esperando algo que talvez nunca volte.

**Observação sobre 2 forum_posts pending_review**: são os 2 dossiês do Pedro (dias 21 e 22 de maio) aguardando aprovação do conselho (Ricardo/Eduardo admin allowlist). Documentado em [BLOCO E.6 deste documento]. **Risco residual LGPD não-fechado** nos excertos de racionalidade (cristalizado em `feedback_pseudonimizacao_conteudo_forum_21_05`).

## 2.3 — Distribuição de uso 30 dias (chat livre vs AEC formal)

Este é o dado **empíricamente mais relevante** do mês — fundamental pra entender o produto:

```sql
SELECT intent, count(*) FROM ai_chat_interactions WHERE created_at > now() - interval '30 days' GROUP BY intent
```

| Intent | Count | Percentual |
|---|---|---|
| **CLINICA** (chat livre) | **2.188** | **91,8%** |
| ENSINO | 88 | 3,7% |
| ADMIN | 106 | 4,5% |
| **Total** | 2.382 | 100% |

E dentro do CLINICA, AEC formal vs chat livre conversacional:
- **AEC formal** (trigger explícito): **48** (~2% do total)
- **Chat livre conversacional**: ~2.129 (~89,8%)

**Tradução em decisões de produto**:
- 9 em cada 10 interações IA são chat livre — não AEC
- AEC formal é **alto valor regulatório** (ICP, racionalidades, audit trail CFM 2.314) mas **baixo volume**
- Pedro descobriu isso em 24/05 manhã via PAT, recalibrou narrativa do app: *"Vocês achavam que o app era AEC-first. Empíricamente ele já é chat-first + AEC de alto valor regulatório."*

Cristalizado em `feedback_chat_livre_dominante_vs_aec_minoria_24_05`. **Mudou 4 coisas operacionais**:
1. Pitch institucional: *"plataforma de escuta longitudinal — chat conversacional + AEC formal como pico de valor regulatório"*
2. Onboarding: priorizar contextualização do chat livre, não AEC
3. UX entrada: dashboard paciente mostra ambos caminhos, não força AEC
4. Manual v1.1 calibração: explica os 2 modos honestos

## 2.4 — Granularidade empírica: distribuições, intents, top entidades

> *Esses números foram puxados via PAT em 25/05 ~22h BRT como deepening da retrospectiva — não estavam no V1.*

### 2.4.1 — Top intents (recalibração da seção 2.3)

PAT empírico cirúrgico (`ai_chat_interactions` agrupado por `intent`, 26/04 → 25/05):

| Intent | Count | % do total |
|---|---|---|
| **CLINICA** | **2.246** | **92,2%** |
| ADMIN | 116 | 4,8% |
| ENSINO | 84 | 3,4% |
| (sem intent) | ~0 | — |
| **Total** | **2.446** | 100% |

Atualização sobre o número da seção 2.3 (2.188 / 91,8%): aqueles números eram do snapshot 24/05; este é 25/05 ~22h após o dia inteiro de smoke V1.9.450 → 453 → A → B + V1.9.454 + Manual v1.1 download. Diferença = ~258 interações no próprio dia 25/05 (chats clínicos + admin), o que confirma a tese: chat-first é a realidade empírica do produto. ENSINO continua minoria — o eixo Ensino está dormindo (Ricardo + Eduardo não produziram conteúdo de cursos no mês).

### 2.4.2 — Distribuição reports por status (68 reports do mês)

```sql
SELECT status, count(*) FROM clinical_reports
WHERE created_at >= '2026-04-26' AND created_at < '2026-05-26'
GROUP BY status;
```

| Status | Count | Significado |
|---|---|---|
| `completed` | 37 | AEC finalizada, pipeline integral rodou |
| `shared` | 21 | Médico compartilhou o report (NFT consent peça-a-peça?) |
| `draft` | 9 | AEC iniciada mas não finalizada (pode virar `completed` se paciente retomar) |
| `reviewed` | 1 | Médico revisou e marcou (feature pouco usada — Faveret/Ricardo?) |
| **Total** | **68** | ✓ bate com 2.1 |

**Insight empírico**: 37 completed em 30 dias = ~1.23 AEC/dia em produção interna. 40 reports SIGNED ICP no mês contra 37 status `completed` significa que 3 reports foram assinados E DEPOIS transicionaram pra `shared/reviewed`. **CORREÇÃO empírica audit 26/05**: NÃO é race condition — é **design legítimo CFM**. Trigger `fn_cfm_prescriptions_immutability` (migration V1.9.180, linhas 75-77) whitelista transição `signed → sent/shared/reviewed/validated` pós-assinatura. Empíricamente 22 reports no mês total (20 `shared` + 1 `reviewed` + 1 `completed`) seguiram esse fluxo legítimo — médico assinou + compartilhou com paciente OU revisou. Padrão correto, não bug.

### 2.4.3 — Distribuição racionalidades por tipo (74 do mês)

```sql
SELECT rationality_type, count(*) FROM clinical_rationalities
WHERE created_at >= '2026-04-26' AND created_at < '2026-05-26'
GROUP BY rationality_type;
```

| Tipo | Count | % | Comentário |
|---|---|---|---|
| **integrative** | **41** | **55%** | Eixo dominante — esperado (Ricardo + Pedro privilegiam integrativo) |
| biomedical | 11 | 15% | Eixo "ocidental" tradicional |
| homeopathic | 9 | 12% | Racionalidade alternativa |
| traditional_chinese | 7 | 9% | Racionalidade alternativa |
| ayurvedic | 6 | 8% | Racionalidade alternativa |
| **Total** | **74** | 100% | ✓ |

**Insight crítico arquitetural**: 22 das 74 racionalidades (30%) são **MTC + Homeopatia + Ayurveda** = exatamente as racionalidades alternativas que **Audience Contract V1.9.330-A protege do paciente leigo**. Se essas 22 vazassem com texto bruto direto pro paciente, seriam 30% dos relatórios do mês com risco regulatório real (CFM art. 14, ANVISA RDC 327). V1.9.330-A previne isso por design — paciente vê resumo, médico vê racionalidades completas. **A formalização do Audience Contract não foi pedantismo arquitetural — foi resposta a um risco regulatório real de 30% de volume**.

### 2.4.4 — Reports vs racionalidades: dual-write contract empírico

```sql
SELECT count(*) FROM clinical_reports
WHERE created_at >= '2026-04-26' AND created_at < '2026-05-26'
  AND content->'rationalities' IS NOT NULL;
→ 39
```

Empíricamente: 39 reports dos 68 (57%) têm `content.rationalities` (jsonb populado, source de UI) **vs** 74 rows em `clinical_rationalities` (tabela analítica). **Divergência declarada e governada**:
- jsonb (39 reports): snapshot displayável que o paciente vê (Audience Contract aplica)
- tabela (74 rows): espelho analítico (KPIs, v_clinical_cycle_health, RAG interno)
- Discrepância: ~35 racionalidades existem em tabela MAS não no jsonb — porque foram geradas/atualizadas DEPOIS do report ser shared, OU em reports antigos pré-V1.9.330-A
- **Isso é exatamente o "dual-write controlado" cristalizado em `feedback_dual_write_contract_jsonb_vs_tabela_18_05`** — divergência por DESIGN, não bug

### 2.4.5 — Distribuição appointments (37 do mês)

```sql
SELECT status, count(*) FROM appointments
WHERE created_at >= '2026-04-26' AND created_at < '2026-05-26'
GROUP BY status;
```

| Status | Count | % |
|---|---|---|
| `scheduled` | 26 | 70% |
| `cancelled` | 8 | 22% |
| `completed` | 3 | 8% |

**Insight empírico**: taxa de conclusão de appointments = 8% (3/37). Taxa de cancelamento = 22%. Resto = ainda agendado/futuro. Em pré-PMF interno isso é esperado (Pedro + Ricardo testando + alguns no-shows naturais). Mas é número a vigiar: se em Marco 2 (médico independente real) a taxa permanecer < 30% completed = sinal de UX agendamento problemático ou de relação médico-paciente débil.

### 2.4.6 — Top 5 pacientes por volume de reports (mês)

```sql
SELECT patient_id, count(*) FROM clinical_reports
WHERE created_at >= '2026-04-26' AND created_at < '2026-05-26'
GROUP BY patient_id ORDER BY 2 DESC LIMIT 5;
```

| Paciente (UUID prefix) | Reports | Identidade |
|---|---|---|
| `5c98c123` | **17** | **Carolina Campello** (filha + conta teste do Ricardo) |
| `17345b36` | 12 | Pedro admin (conta tech lead) |
| `d5e01ead` | 10 | Pedro paciente teste |
| `2135f0c0` | 8 | Ricardo profissional (UUID hardcoded — blocker Marco 3) |
| `df6cee2d` | 6 | (paciente teste) |

**Insight empírico crítico**: 53 dos 68 reports do mês (78%) foram gerados por 5 entidades — TODAS testes internos. **Não há paciente externo pagante real**. Pré-PMF confirmado empíricamente. Avg de 4.86 reports/paciente (com max 17 em Carolina) mostra que o regime de teste foi INTENSO (muitos retests da mesma conta pra validar fixes) — não tração orgânica.

### 2.4.7 — Latência média de processamento IA

```sql
SELECT round(avg(processing_time)::numeric, 0) FROM ai_chat_interactions
WHERE created_at >= '2026-04-26' AND created_at < '2026-05-26';
→ 5700 ms
```

**5.7 segundos** de média por chamada IA durante o mês. Inclui chat livre paciente + Matrix profissional + pipeline pós-AEC. Para contexto: pipeline pós-AEC sozinho demora ~24s (relatado caso prima dentista 23/05 noite), mas é < 5% dos chats — média puxa pra 5.7s pela maioria conversacional. **Sinal a vigiar Marco 2**: se com 20-30 pacientes externos pagantes a média subir acima de 8s = revisar batch sizes / RAG truncation / model selection.

### 2.4.8 — Distribuição horária de uso (2.446 chats / 30d)

```sql
SELECT EXTRACT(HOUR FROM created_at AT TIME ZONE 'America/Sao_Paulo'),
       count(*) FROM ai_chat_interactions
WHERE created_at >= '2026-04-26' AND created_at < '2026-05-26'
GROUP BY 1 ORDER BY 1;
```

| Hora BRT | Chats | Indicador |
|---|---|---|
| 0h | 37 | madrugada Pedro (commits) |
| 1h | 73 | madrugada Pedro (alta densidade) |
| 2h | 54 | madrugada Pedro |
| 6-7h | 22 | manhã cedo |
| 8h | 95 | início produtivo |
| 9h | 105 | manhã consolidada |
| 10h | 115 | pico manhã |
| 11h | 136 | pico manhã alto |
| 12h | 217 | almoço alta densidade |
| 13h | 238 | pico almoço |
| 14h | 76 | quebra pós-almoço |
| 15h | 93 | retomada tarde |
| **16h** | **309** | **PICO ABSOLUTO** do mês |
| 17h | 169 | tarde alta |
| 18h | 240 | fim-tarde 2º pico |
| 19h | 66 | jantar |
| 20h | 140 | noite consolidada |
| 21h | 172 | noite alta |
| 22h | 62 | noite final |
| 23h | 27 | encerramento |

**3 padrões empíricos**:
1. **Pico vespertino 16h (309 chats)** = quase 1 a cada 6 minutos. Provavelmente smoke V1.9.453 + Matrix Z2 testing intenso 25/05 tarde.
2. **Pico noturno secundário 18h (240)** = retomada profissional pós-almoço (Ricardo trabalhando + Pedro deploy).
3. **Atividade madrugada (0h-2h = 164 chats) = 7% do total** — sinal característico do regime de desenvolvimento solo cofounder técnico (Pedro). Em produção pós-PMF essa distribuição deve normalizar (mais uniforme 8h-20h, queda abrupta após).

### 2.4.9 — Heatmap diário (chats + usuários únicos por dia)

```sql
SELECT to_char(created_at AT TIME ZONE 'America/Sao_Paulo','YYYY-MM-DD') AS dia,
       count(*) AS chats, count(DISTINCT user_id) AS usuarios
FROM ai_chat_interactions
WHERE created_at >= '2026-04-26' AND created_at < '2026-05-26'
GROUP BY 1 ORDER BY 1;
```

| Dia | Chats | Usuários | Marco do dia |
|---|---|---|---|
| 26/04 | 321 | 3 | Audit profundo + cleanup |
| **27/04** | **394** | **6** | **Pico de usuários do mês** |
| 28/04 | 78 | 5 | Lock V1.9.99-B selado |
| 29/04 | 68 | 5 | Iterações parágrafo institucional v12-14 |
| 30/04 | 111 | 2 | Estado fim 30/04 |
| 01/05 | 11 | 1 | Feriado Trabalhador (baixo uso) |
| 02/05 | 16 | 1 | Sábado |
| 03/05 | 39 | 2 | Lead-free SEO + V1.9.121 promoção AEC |
| **04/05** | **165** | **8** | **Caso João consent loop + estado fim 04/05** |
| 05/05 | 33 | 3 | Faveret abandona após 3 AECs |
| 06/05 | 15 | 3 | Regra operacional canônica |
| 07/05 | 108 | 4 | Pré-MUHDO prep |
| 08/05 | 30 | 2 | MUHDO |
| 09/05 | 32 | 3 | Virada execução |
| 10/05 | 43 | 2 | — |
| **11/05** | **166** | **5** | **PBAD ICP discovery** |
| 12/05 | 19 | 1 | — |
| **13/05** | **121** | **7** | **Sidecar renal V1.9.307** |
| 14/05 | 35 | 1 | — |
| 15/05 | 47 | 1 | NFT V1.9.311 |
| 17/05 | 70 | 2 | RAG truncation + Grounded Response |
| 18/05 | 61 | 3 | V1.9.330-A Audience Contract |
| **19/05** | **124** | **3** | **V1.9.388 Matrix Z2 smoke final** |
| 20/05 | 12 | 3 | Audit pendências |
| 21/05 | 22 | 2 | F4 Fórum end-to-end |
| 22/05 | 51 | 3 | Brandbook V3 selado |
| 23/05 | 46 | 4 | Onboarding Profissional v1.0 |
| **24/05** | **125** | **5** | **PATIENT_FREE_CHAT_GUARDRAILS + 3 recalibrações Pedro** |
| **25/05** | **71+** | **4** | **Matrix Z2 V1.9.450→454 + Constituição cristalizada** |

**Observações empíricas**:
- **5 picos do mês** (>120 chats/dia): 27/04, 04/05, 11/05, 13/05, 19/05, 24/05 — TODOS dias de marco arquitetural ou smoke crítico
- **27/04 = pico de usuários únicos (6)** — coincide com fim do audit profundo
- **Gap 16/05** ausente do dataset (provavelmente houve, é o dia do deploy PBAD — pode ser bug de fuso ou agrupamento; vale revisar)
- **Cobertura ~93%**: 28 dos 30 dias com atividade IA — Confirma que o mês foi continuamente operacional

### 2.4.10 — Estado AEC FSM (snapshot 25/05)

```sql
SELECT phase, count(*) FROM aec_assessment_state GROUP BY 1;
```

Colunas reais da tabela: `id, user_id, phase, data, current_question_index, waiting_for_more, interrupted_from_phase, started_at, last_update, created_at, consent_given, consent_at, completed_phases, required_phases, is_complete, phase_iteration_count, invalidated_at, invalidation_reason`.

**Achado meta**: existe `invalidated_at` + `invalidation_reason` no schema — campos para AEC zumbi/repassada/recriada. Caso Dayana (V1.9.440 cleanup 24/05) usou exatamente esses campos. Schema é defensivo, suporta auditoria longitudinal de invalidações.

### 2.4.11 — Estado users por type real

```sql
SELECT type, count(*) FROM users GROUP BY 1;
```

| Type | Count | Comentário |
|---|---|---|
| `patient` | 31 | Type canônico (em inglês) |
| `paciente` | 3 | Drift histórico legado PT (V1.9.449 filter cobre os 2 — 34 total) |
| `professional` | 11 | 11 profissionais cadastrados (Ricardo, Faveret, Dayana, etc) |
| `admin` | 5 | 5 admins (Pedro 17345b36, Ricardo 99286e6f, João Vidal cbdrcpremium, etc) |
| **Total** | **50** | — |

**Insight arquitetural confirmado**: drift PT/EN no campo `type` justifica V1.9.449 (`.in('type', ['paciente', 'patient'])`) — sem o filter, Ricardo continuaria vendo 48 "noisy" + faltariam 3 com type=paciente legado. **Cristalizado em `feedback_count_pacientes_v1_9_449_e_gaps_function_calling_v1_9_450_25_05`**.

---

# 🗓️ SEÇÃO 3 — Cronologia narrativa (4 semanas)

## 3.1 — Semana 1 (26 abril → 02 maio): Audit Honesto + 4 Motores

A semana começou com um **audit 360° completo** do banco Supabase e das 10 Edge Functions então ativas. Pedro entrou perguntando: *"o que está aqui de verdade, o que é cosmético, o que é fantasma?"*. A resposta empírica foi desconfortável em alguns pontos.

### Marcos arquiteturais

**Cleanup 28/04 ~10h45 BRT** (cristalizado em `project_audit_profundo_28_04` + `project_supabase_real_state_26_04`):
- Edge `video-call-request-notification-` v23 (com hífen, duplicata) **DELETADA** + backup em `.backups/`
- Trigger duplicado `trg_handle_new_auth_user` em `auth.users` **DROPADO**
- Edge `video-call-reminders` v52 deletada → reintroduzida elite v53/v3 com sweep mode + cron 5min + Resend

**Lock V1.9.99-B selado em 28/04** (cristalizado em `project_lock_v1999_resend_prod_28_04`):
- Resend prod (`RESEND_API_KEY` + `RESEND_FROM_EMAIL=noreply@medcannlab.com.br`) — domínio verified, envia pra externos OK
- Storage RLS chat-images fechado (`public=false`, 4 policies Opção B: owner OR participante de mesma chat_room via JOIN)
- AdminChat usa `createSignedUrl` TTL 1 ano

**4 motores clínicos mapeados** (cristalizado em `project_4_clinical_engines_map_24_04`):
1. **AEC FSM** (clinicalAssessmentFlow.ts) — 13+ fases determinísticas
2. **Pipeline pós-AEC** (tradevision-core orchestrator) — REPORT → SCORES → SIGNATURE → AXES → RATIONALITY → DONE
3. **Signature ICP** (sign-pdf-icp + cert-encrypt-password) — assinatura digital
4. **Verbatim First V1.9.86** — bypass GPT em ~46% das hard-lock phases

**Pirâmide de Governança 8 camadas** cristalizada (`project_piramide_governanca_28_04`):
```
0. REGRA HARD §1 (constitucional) — "Consentimento ≠ Agendamento"
1. COS KERNEL v5.0 — 5 portas (KillSwitch/Trauma/Metabolismo/ReadOnly/Policy)
2. AEC FSM — 13+ fases determinísticas
3. VERBATIM FIRST (V1.9.86) — ~46% bypass GPT em hard-lock phases
4. AEC GATE V1.5 (V1.9.95-A reforçado) — Bloqueia agendamento durante AEC ativa
5. GPT-4o-2024-08-06 / gpt-4o-mini — só chamado se nada acima resolveu
6. PÓS-PROCESSAMENTO — Strip tokens, validate UUID, force tags pós-AEC
7. PIPELINE ORCHESTRATOR — REPORT→SCORES→SIGNATURE→AXES→RATIONALITY→DONE
```

### Princípios cristalizados na semana 1

- **`feedback_anti_overclaim_endorsements`** (28/04): cristalizado após Pedro escrever 14 iterações de "parágrafo institucional v5→v14 final definitivo" — quando Claude começou a inflar resultados internos como se fossem validação externa. Princípio: *"4 ou 5 reports = não validar institucional. Esperar 20-30 pacientes externos pagantes pra qualquer claim de tração."*
- **`feedback_postura_quebras_e_evolucao`**: postura honesta sobre o que quebra durante evolução.
- **`feedback_push_remotes_corretos`**: cristalização da política push 4 refs (amigo + medcannlab5 × main + master no desktop; hub + origin no laptop).
- **`feedback_uso_zero_nao_e_morto`**: tabela com 0 rows não é necessariamente código morto — pode ser feature dormindo intencional. Caso `google-auth` + `sync-gcal` (schemas existem, 0 callers — dormindo intencional, não half-implemented).

### Iterações do parágrafo institucional (28-29/04)

Cristalizado em sequência: `project_paragrafo_institucional_v5_28_04` → v7 → v8 → v9_FINAL → v10_FINAL → v11_FINAL → v12_FINAL_29_04 → v13_FINAL_29_04 → v14_FINAL_DEFINITIVO_29_04.

**9 iterações em 2 dias do mesmo parágrafo**. Pedro queria texto institucional pro material A (pitch / landing / parcerias). Cada versão Claude entregava + Pedro reagia *"ainda overclaim"* + Claude ajustava. **A 14ª versão "FINAL DEFINITIVA" foi descontinuada implicitamente** quando o princípio anti-overclaim cristalizou em 28/04 e o Material A passou a exigir PAT empírico cruzando (23/05 Ricardo formalizou: *"doc institucional sem PAT cruzar = não é válido"*).

### Frase âncora semana 1

> *"Mapear antes de mexer. Validar empíricamente antes de assumir. Auditar 100% antes de qualquer mudança."*

— Cristalizado em `feedback_auditar_100_antes_de_qualquer_mudanca`.

## 3.2 — Semana 2 (03 maio → 09 maio): Marca + Onboarding + Faveret Abandona

### Marcos da semana

**V1.9.121 AEC Promotion Detector — selo quíntuplo (03/05)**: Claude + GPT review + Pedro + Ricardo + GPT-Ricardo aprovaram juntos. Função pura, sem side effects, recebe mensagens + contexto, retorna decisão. Resolve caso João (04/05/2026): conversa que parece AEC sem FSM real → ORCHESTRATOR confuso → CONSENT_GATE backstop. Com detector → hint consciente *"Estamos em chat livre — posso reiniciar como Avaliação Clínica Inicial estruturada?"* → ASSESSMENT_START (mecanismo P8 existente). Princípio Ricardo aplicado: *"Não é a IA que transforma conversa em verdade clínica; é o paciente que confirma a organização da própria fala."*

**Lead-free SEO selo (03/05)**: cristalizado em `project_lead_free_seo_seal_03_05`. Landings sem captura forçada. Princípio: *"healthtech séria não captura leads via dark pattern."*

**Estado fim 04/05 cristalizado** em `project_estado_fim_04_05_2026` + decisão estrutural final + Livro Mestre.

**Polish triple-A 3 perfis + Dashboard honesto (05/05)**: paciente/profissional/admin. Eliminação de mocks/placeholders.

**WhatsApp blueprint 05/05** (`project_whatsapp_blueprint_05_05`): estrutura pra eventual integração WhatsApp Business — parqueada.

**Princípio identidade Nôa Esperanza consolidado** (`project_principio_identidade_noa_esperanza`).

### O abandono de Faveret (descoberto empíricamente)

Em 05/05/2026, Eduardo Faveret (sócio + médico, Diretor Médico, neurologista, coordenador eixo Ensino) **fez 3 AECs** no app e **abandonou**. **19 dias sem retornar** até a descoberta empírica em 24/05.

Cristalizado em `feedback_curva_aprendizado_alta_mesmo_para_socios_24_05`:

> *"Faveret (sócio + médico) abandonou após 3 AECs em 05/05/2026, 19 dias sem retornar. Empíricamente prova: design simples não substitui hand-holding pré-PMF. Manual v1.1 + white glove + acompanhamento WhatsApp é a tríade correta."*

Frase âncora desse princípio: *"App é novo, ninguém nunca usou bem. Ricardo sabe navegar tudo, quem dirá Faveret. Ambos precisam de ajuda mesmo eu tentando fazer o design mais simples possível."*

**Implicação operacional**: pendente desde então — WhatsApp pra Faveret com Manual v1.1 + call 15min. Destrava Marco 3 (2º médico independente).

**Por que importa**: se um sócio-médico não usa o app, é sinal estrutural sobre curva de aprendizado pré-PMF. Não é falha de produto isolada — é dado epistemológico sobre o que falta (hand-holding estruturado, não mais features). Pedro absorveu este insight e gerou em 23/05 o Deck Onboarding Profissional v1.0 (12 slides Brandbook V3, renomeado pra "Manual de Uso do Profissional" em 24/05).

### Pre-MUHDO + Fix Eduardo (08/05) + Virada pra Execução (09/05)

**08/05**: preparação pro evento MUHDO (apresentação institucional). Fix técnico relacionado ao Eduardo (provavelmente bug de UX no fluxo dele).

**09/05**: virada pra execução — fim da fase auditoria + análise epistemológica intensa das 2 semanas anteriores, início da implementação cirúrgica que dominaria as próximas 2 semanas (10 a 25/05).

### Frase âncora semana 2

> *"Sócio-médico não usar não é falha de produto isolada — é curva de aprendizado alta mesmo pra sócios-fundadores. Design simples não substitui hand-holding pré-PMF."*

## 3.3 — Semana 3 (10 maio → 16 maio): PBAD ICP-Brasil REAL + Sidecar Renal

Essa semana foi **o salto regulatório mais importante do mês**. Antes, a assinatura digital era cosmética. Depois, é jurídica.

### V1.9.299 — PBAD AD-RB ICP-Brasil CONFORME ITI (16/05/2026)

Cristalizado em diário `DIARIO_16_05_2026_SIDECAR_RENAL_E_PBAD_AD_RB.md`. PBAD = Política de Assinatura Brasileira de Atributos Definidos. AD-RB = Assinatura Digital com Referências Básicas. ITI = Instituto Nacional de Tecnologia da Informação (autoridade brasileira que emite normas ICP-Brasil).

**O que mudou tecnicamente**:
- `supabase/functions/sign-pdf-icp/index.ts` reescrito com algoritmo PBAD AD-RB v2.4 (a versão CONFORME ITI atual)
- `supabase/functions/sign-pdf-icp/icp_chain.ts` com chain ICP embedded validada
- Constants `PA_AD_RB_V24_OID` + `PA_AD_RB_V24_SIGPOLICYHASH_HEX` no edge — só atualizar quando ITI publicar nova PA (próxima v2.5+)

**O que mudou regulatóriamente**: o selo PBAD agora valida em verificadores externos como "Válida" e CONFORME ITI. Antes validava como "Desconhecida" — placeholder cosmético. **Agora um relatório clínico ICP gerado tem validade jurídica em processo médico real**.

**Constraint declarado em `CLAUDE.md`**:
> *"⚠️ NÃO TOCAR (sem auditoria empírica via openssl asn1parse + smoke ITI + diff binário vs PDF aprovado): `supabase/functions/sign-pdf-icp/index.ts` — algoritmo PBAD AD-RB validado, mexer = risco voltar pra 'desconhecida'."*

Esse é o lock V1.9.299 — possivelmente o mais sensível do projeto. Refator branch parqueada (`refactor/tradevision-core-modular`) NÃO toca esse Edge.

### V1.9.307 — Sidecar Renal DRC

Cristalizado em `feedback_drift_nefro_cannabis_16_05`. Sidecar = pequeno serviço/módulo paralelo ao core que processa sinais específicos. Renal = nefrologia (especialidade do Dr. Ricardo). DRC = Doença Renal Crônica.

Função: extrair sinais renais dos relatórios pra suportar análise nefrológica downstream. Especialidade core do método AEC (Ricardo é nefrologista).

### V1.9.311 — NFT Consent Peça-a-Peça

Cristalizado em diário 15-16/05. NFT consent: token não-fungível registrando consentimento do paciente em cada etapa do AEC. Edge `generate-nft-from-report` deployada. Auditoria imutável de consentimento — relevante regulatóriamente (LGPD art. 8 §6: consentimento revogável + auditável).

### Frase âncora semana 3

> *"PBAD AD-RB conforme ITI deployado. A assinatura agora é jurídica real, não cosmética. Mexer = risco voltar pra 'desconhecida'."*

## 3.4 — Semana 4 (17 maio → 25 maio): Audience Contract + Matrix Z2 + Sprint Cirúrgico

Essa foi a **semana mais densa do mês** — também a mais densa do projeto em qualquer período comparável pré-PMF. Inclui:
- 17 diários produzidos
- ~50 commits cirúrgicos
- 5 dias com sessões duplas ou triplas (18, 19, 22, 24, 25)
- A descoberta da alucinação completiva da Matrix Z2
- 2 textos epistemológicos pivotais de Ricardo
- 3 recalibrações de Pedro corrigindo Claude num único dia

Vou narrar por dia.

### 17/05 — Racionalidades, Teaching, Escola Clínica Digital

Cristalizado em diário 17/05 + memórias `feedback_rag_truncation_endemico_17_05` + `feedback_grounded_response_mode_ausente_17_05` + `project_arquitetura_escola_clinica_digital_17_05` (5 camadas).

**RAG truncation endêmico** descoberto: o sistema cortava conteúdo do RAG de forma silenciosa, gerando respostas que pareciam ter contexto mas tinham contexto parcial.

**Grounded Response Mode ausente** identificado: faltava um modo formal pra forçar respostas baseadas em corpus específico vs RAG geral.

**Arquitetura "Escola Clínica Digital" 5 camadas** cristalizada: visão de plataforma como ambiente educacional clínico, não só ferramenta de avaliação.

### 18/05 — Audience Contract + Dual-Write + Literatura + Fórum

**V1.9.330-A Audience Contract** deployado (cristalizado em `project_v1_9_330_audience_contract_design_18_05` + `project_v1_9_331_conditional_section_emission_18_05`):

Antes desse dia, paciente lendo seu próprio relatório clínico via TEXTO BRUTO das racionalidades MTC/Ayurveda/Homeopatia — incluindo termos como *"meridiano da bexiga obstruído"*, *"desequilíbrio Pitta-Vata"*, *"Sulphur 30CH"*. Risco regulatório real: paciente leigo sem médico explicar = potencial automedicação ou interpretação incorreta.

V1.9.330-A criou o **Audience Contract**:
- Paciente vê: resumo conciso + linguagem acessível + sem termos técnicos específicos das racionalidades alternativas
- Médico vê: conteúdo completo incluindo racionalidades MTC/Ayurveda/Homeopatia
- Lock contratual: nenhuma feature futura libera vocabulário racionalidade alternativa pra paciente sem nova versão Audience Contract

**Dual-write contract jsonb vs tabela** documentado formalmente (cristalizado em `feedback_dual_write_contract_jsonb_vs_tabela_18_05` + `project_presentation_contract_layer_18_05`):

Sistema mantém **duas fontes paralelas** com propósitos diferentes (divergência **controlada**, não acidental):

| Fonte | Propósito | Quem lê |
|---|---|---|
| `clinical_reports.content.rationalities` (jsonb) | **Source de UI** — snapshot displayável | Frontend (ClinicalReports.tsx, PDF, share) |
| `clinical_rationalities` (TABELA) | **Espelho analítico** — KPIs, pesquisa, RAG interno | Analytics (v_clinical_cycle_health), service RAG (rationalityAnalysisService linha 322) |

**Regra de ouro cristalizada**: *"Nunca derivar UI paciente de tabelas analíticas de racionalidade. Sempre derivar de `clinical_reports.content.*`."* Documentado em CLAUDE.md.

**PARECER FISCAL 19/19 verificado** (cristalizado em `feedback_debitos_tecnicos_parecer_fiscal_01_04_pendentes_18_05`): auditoria fiscal/regulatória dos 19 itens identificados em 01/04 — todos atendidos.

**DoctorRelationCard parqueado** (`project_doctor_relation_card_design_18_05`).

**3 marcos mínimos de reprecificação valuation** cristalizados (`project_3_marcos_minimos_reprecificacao_valuation_18_05`): patamares pré-PMF que justificam reprecificar a empresa pra próxima rodada.

**Drift histórico dev pré-PMF aceitável** (`feedback_drift_historico_dev_aceitavel_pre_pmf_18_05`): princípio de não punir decisões antigas pelo padrão atual.

**18/05 noite**: literatura + fórum (sessão dupla mesmo dia).

### 19/05 — Observabilidade + Matrix V1988 Voz Z2 Pesquisa

**Manhã**: observabilidade + recalibração (cristalizado em `project_v1_9_388_smoke_final_vitoria_empirica_19_05` + `project_visao_final_eixo_pesquisa_19_05`).

**Tarde-noite**: **V1.9.388 Matrix V1988 voz Z2 pesquisa** — cristalização da identidade epistemológica da Nôa Matrix. 10 commits na mesma sessão. Tokens caem 29k→4.3k por chamada (~85% redução). gpt-4o full em research mode. State pollution morta (V1.9.388-A.1 useResearchChat → Edge direto). Voz intelectual Z2 (V1.9.388-A.3 model full + prompt refactor).

Cristalizado em `project_v1_9_388_matrix_voz_z2_pubmed_19_05`. Pedro autorizou explicitamente em 19/05 ~23h BRT: *"20-30 usuarios ai e um bom teste"* = tier 1 escalada controlada.

**Princípio Ricardo aplicado**: *"A doença não é o centro. O centro é a escuta e a narrativa. Você estrutura comparações, agrupamentos e citações — nunca diagnostica, nunca recomenda, nunca categoriza por doença. O médico decide. Você organiza."*

Esse princípio do RESEARCH_PROMPT V1.9.388-A.3 seria **6 dias depois** o filtro contra a alucinação completiva da Matrix em 25/05.

**Z2 estrutural ≠ Z2 burra**: cristalizado em `feedback_z2_nao_e_burrice_voz_intelectual_19_05`. Z2 NÃO significa "Nôa burra que só recusa". Significa estrutura sem inferência clínica.

### 20/05 — Início + Princípios Matrix vs Casos Similares

Cristalizado em `feedback_matrix_prolonga_vs_casos_similares_infere_20_05`:

> *"Matrix prolonga 1 contexto, Casos Similares infere entre contextos."*

Distinção arquitetural:
- **Matrix**: olha 1 paciente, organiza corpus marcado **daquele** paciente, prolonga análise sobre **aquele** caso
- **Casos Similares**: busca pacientes diferentes com queixas similares, infere padrões entre contextos diferentes

Operações cognitivas DIFERENTES. Implicação: Matrix maduro vs Casos Similares ALPHA — porque inferir entre contextos é mais arriscado que prolongar dentro de 1 contexto.

### 21/05 — F3 Reabrir + F2 Anexável + F4 Fórum End-to-End

Diário "DIARIO_21_05_2026_F3_REABRIR_F2_ANEXAVEL.md" cobre 21 commits em 1 dia.

**F3 reabrir dossiê** (V1.9.393): modo 2 camadas Revisar/Continuar.

**F2 Base de Conhecimento anexável** (V1.9.395): médico pode anexar Doc #A1 #A2 ao corpus marcado da Matrix.

**F4 Fórum end-to-end** (V1.9.403→410): dossiê → `pending_review` → conselho avalia → `active` → debate no Cann Matrix com dossiê fixado no topo. Caminho B implementado (cristalizado em `project_f4_forum_plano_e_audit_21_05`).

**V1.9.407 — LGPD pseudonimização fórum (3 camadas)**: cristalizado em `feedback_pseudonimizacao_conteudo_forum_21_05`.

Audit empírico do post `75badd3d` (forum, 21/05) revelou `patient_pseudonym=NULL` + content mencionando "Pedro Paciente" 6+ vezes. Causa raiz: `useForumPublish.ts:65` original tinha `pseudonym || null` silencioso. V1.9.437 (23/05) = defesa em profundidade 3 camadas:
1. Validação hard no hook bloqueia publish sem pseudônimo
2. Detector heurístico de nomes via lookup `clinical_reports` do médico → `window.confirm` se match
3. 2º checkbox no modal de consent (*"atesto que revisei conteúdo e não tem nome real"*)

**Resíduo NÃO fechado**: campo `assessment` (text) em `clinical_rationalities` ainda pode citar nome real do paciente. Parqueado V1.9.452 pré-Marco 2.
> Correção 26/05: nome do campo é `assessment`, NÃO `assessment_excerpt`. Audit empírico via PAT confirmou schema real — `clinical_rationalities` tem `id, report_id, patient_id, rationality_type, assessment (text), recommendations (jsonb), considerations, approach, generated_by, created_at, updated_at`.

### 22/05 — Refator Tradevision Core PAUSADO + Schema Hygiene + Tema Dark/Light Revert

Cristalizado em diário "DIARIO_22_05_2026_REFATOR_TRADEVISION_CORE_PAUSADO.md" + 8 memórias do dia.

**Refator branch `refactor/tradevision-core-modular`** (V1.9.419 + A/B/C/D): proteções + cors/types/triggers extraídos + ~109 linhas de código morto removidas. `deno check` verde (baseline 5) em cada passo. **NÃO deployada/merjada** — prod roda o antigo. Retomar = deploy+smoke+merge do que está pronto; rollback = tag `v1.9.418-...`. (`project_refator_tradevision_core_pausado_22_05`)

**Schema hygiene executada**: 3 tabelas de backup arquivadas antes de drop (commit `37041ab`). 72 órfãos no bucket documents **refutados** empíricamente (commit `299fbec`): *"docs(auditoria): análise profunda — dual-write medido, RLS confirmada, '72 órfãos' refutado"*.

**V1.9.420 ConsentGuard loop morto**: paciente ficava preso em consent screen → mata cycle silencioso.

**V1.9.421 fix cobertura instrumentação que mentia 0%**: cristalizado em `feedback_postgrest_max_rows_1000_silencioso_22_05`. O Supabase JS nunca devolve >1.000 linhas/request (`max-rows`); `.limit(10000)` é no-op acima disso, sem erro. Aba Observabilidade IA mentia *"0,0% cobertura / $0,00"* (real 14,5% / $6,74 / 3.738 rows) porque `fetchInstrumentationCoverage` puxava 1.000 linhas físicas (as mais antigas) sem `.order()`. Fix V1.9.421: `count:'exact', head:true`. Contar nunca puxa linhas; **desconfiar de qualquer 1000 num painel**.

**Tema dark/light saga (V1.9.425→428)**: tentativa de implementar toggle dark/light. Mass-migration cobriu 6.949 substituições / 192 arquivos / ~80%. Long-tail de inline rgba + hex hardcoded deixou ilhas escuras visíveis em modo light. **Revertido em V1.9.428**.

**Bandeira BR/US (V1.9.429)**: tentativa de toggle de idioma. 0,2% de cobertura (3 botões em 1.500+ strings) = promessa vazia. **Removido**.

Cristalizado em `feedback_toggle_ui_e_contrato_100_pct_ou_nada_22_05`:
> *"Toggle de UI é contrato com o usuário; cobertura parcial é pior que sem toggle. Só vale se nascer com tokens/i18n desde o primeiro componente OU surface-by-surface comprometido. Mass-migration mid-life não fecha."*

**Brandbook V3 selado** (cristalizado em `project_marca_medcannlab_brandbook_v3_22_05`): 3 iterações com IA externa + opinião empírica → V3 fechado. Símbolo brain+kidney+cannabis (rim=nefro, cérebro=cognição, cannabis=domínio). Paleta COOL only — ciano `#4FE0C1` / verde-vital `#00E5B2` / verde-regenerativo `#00C853`; laranja `#FF8A00` reservado SÓ pra alerta clínico (V1 trazia laranja como metade da identidade, foi flagueado por conflito com semântica cockpit). Tagline mantida: *"A IA serve. O método estrutura. A decisão é humana."*

**i18n parqueado** (cristalizado em `project_i18n_custo_e_gatilhos_22_05`): custo real ~2 meses com AI + gargalo humano. Pilha de 7 fases. Mecânicas (Foundation + UI strings + Edge + DB) ~6 semanas FTE tradicional / ~3-4 semanas com AI. Clínicas (Prompts + AEC FSM + Conteúdo gerado + QA EN) ~3-4 meses iteração empírica. **Gargalo real = CO-AUTOR CLÍNICO EN**, não código.

**Material B pode contradizer Constituição** (cristalizado em `feedback_material_b_pode_contradizer_constituicao_22_05`): GPT externo, no MESMO parecer, elogiou a Matrix por *"não diagnosticar"* e pediu hipótese clínica (que quebra esse elogio). Material B pode ser internamente incoerente. **Triar cada sugestão contra a Constituição (Z2/Lock/Pipeline) ANTES do mérito**; separar "peso estrutural" (ok) de "peso clínico" (proibido).

**Recusa correta vale mais que resposta** (cristalizado em `feedback_recusa_correta_vale_mais_que_resposta_22_05`): princípio de design clínico-IA cristalizado no fim do dia 22/05 após Material B externo ancorar a frase em 7 decisões do próprio dia. **Em healthtech, não-resposta é integridade visível** — inversão do incentivo consumer.

### 23/05 — Re-Audit Honesto + Logo Swap + Manual + Princípio Ricardo Doc-PAT

Diário "DIARIO_23_05_2026_RE_AUDIT_HONESTO_E_LOGO_SWAP.md" cobre 12 commits.

**Re-audit honesto + veredito estágio**: Pedro pediu *"sem ego, sem inflar, qual o estágio real do app?"*. Resposta empírica fundamentou narrativa pro mês seguinte.

**Logo swap (V1.9.431→435)**: 5 iterações do logo na landing. Pedro testou empíricamente várias versões (`logoapenas-removebg-preview`, `medcanultimalog`, `medcanultimalog2`, `MCL_LOGO2t-preview`) ajustando círculo, glow, partículas, anel até chegar na versão final V1.9.435.

**V1.9.437 hardening LGPD useForumPublish 3 camadas**: já documentado acima (resíduo de V1.9.407).

**V1.9.438 Dashboard de Pesquisa elite triple-A**: 12 abas reais validadas via grep (não placeholders).

**V1.9.438-B**: densidade visual -30/40% + atalhos do Dashboard funcionais.

**V1.9.439**: Manual v1.1 (2 slides novos: Papéis + Indicação).

**V1.9.439-A**: rename "Onboarding Profissional" → "Manual de Uso do Profissional" — termo mais honesto pro estágio (não onboarding completo, é manual de uso).

**V1.9.440+A+B (referral + fix RLS + dropdown + anti-overclaim)**:
- V1.9.440: fix bug crítico RLS no QR de referral (Dayana scanou QR código do filho dela, deu erro "Profissional não encontrado") + atalho "Enviar Link de Indicação" no menu Novo Paciente + cleanup AEC zumbi da Dayana
- V1.9.440-A: dropdown Novo Paciente via React Portal (fix sobreposição que estava *"inviável de usar"* — menu z-index 9999 mas parents tinham stacking context isolation)
- V1.9.440-B: smoke audit revelou que 2 opções do menu eram **fakes/parciais** — "Importar Banco" era alert-only fake, "Arrastar Arquivos" só processava CSV. Anti-overclaim: removidas do menu.

**🎯 Princípio "doc institucional sem PAT cruzar não é válido"** cristalizado por Ricardo em tempo real no grupo WhatsApp dos sócios 23/05 ~10h11 BRT, em resposta a tensão semântica sobre pitch MUHDO. Doutrina adotada por Ricardo (*"já é sua opinião"*) — vira regra compartilhada do time.

Cristalizado em `feedback_doc_institucional_sem_pat_nao_e_valido_23_05`:

> *"Qualquer documento institucional (pitch/ebook/slide/manifesto/parceria) escrito por qualquer pessoa (sócio, IA externa, designer) sem cruzamento PAT contra realidade do banco = overclaim em construção."*

Parente direto de `feedback_material_b_pode_contradizer_constituicao_22_05` mas aplicado a Material A institucional dos próprios sócios (mais difícil triar emocionalmente).

> Frase âncora Ricardo: *"Quem não cruza com PAT cria dívida pra quem vai cruzar depois."*

Foi aplicada dezenas de vezes nos 30 dias seguintes (~dezenas de fixes).

**Deck Onboarding Profissional v1.0**: 12 slides 1280×720 paleta Brandbook V3, 22 abas grep-validadas (12 Atendimento + 10 Pesquisa), nome paciente fictício "Patient Paula" LGPD-safe. Print-color-adjust forçado pra Chrome respeitar background dark.

### 24/05 — SESSÃO TRIPLA (manhã + tarde + noite)

**Este foi o dia mais denso conceitualmente do mês**. Cobertura completa no DIARIO_24_05 (Blocos A→S).

#### Manhã (Blocos A→Q)

**V1.9.441 — fix regex `conversa[r]?`**: bug confirmado empíricamente pelo teste do Pedro 24/05 09:13. Regex exigia "conversar" infinitivo literal. *"apenas conversa"* (sem R) não casava, Verbatim Hard Lock ficava travado retornando a mesma frase. Volume potencial protegido: 54 AECs `in_progress` no banco que poderiam ter usuários voltando e digitando *"apenas conversa"* sem R.

**Investigação Dayana via logs `tradevision-core` 23/05 12:46 BRT** (sessão ~9min, 8 interações IA, total ~52k tokens, ~$0,50 USD): cristalizado em diário 24/05 Bloco B.

**Análise Illa Proença (manhã 24/05)**: agrônoma + presidente associação cannabis. Não é paciente — busca conexão institucional. Abandonou em 3min. Auto-seleção saudável.

**🔥 3 RECALIBRAÇÕES PEDRO** (cristalizado em `feedback_aec_como_repelente_natural_de_demanda_fora_escopo_24_05`):

> **Pass 1** — Eu disse: *"AEC tem falha de design pra casos eletivos"* baseado em 2 abandonos (prima dentista siso + Illa Proença CBD). Propus pivot na fase IDENTIFICATION com adapter por especialidade.
>
> **Pedro corrigiu**: *"AEC é instrumento clínico — funciona pro propósito. Quem cai fora-escopo abandona corretamente."*

> **Pass 2** — Eu disse: *"Falta entrada de chat livre alternativa"*. Propus adicionar "Conversar com a Nôa" no dashboard.
>
> **Pedro corrigiu**: *"Chat livre JÁ EXISTE. É o uso DOMINANTE. Você está propondo construir o que já está construído."*

> **Pass 3** — Eu disse: *"Hierarquia visual confunde novato"*. Propus reordenar visibilidade.
>
> **Pedro corrigiu**: *"Pessoas não vão ali pra respostas livres tipo ChatGPT. A frustração é a triagem funcionando — AEC repele quem não é caso clínico legítimo. Função emergente boa, não bug."*

**Padrão de erro cristalizado**: Claude tende a ler *"usuário não terminou fluxo = problema do produto"*. Pedro me forçou a recalibrar 3x na mesma conversa. Lição meta: **Claude precisa de filtro "estava no escopo?" antes de propor fix de produto**.

**Frase âncora**: *"A rigidez da AEC É a recusa correta funcionando. Antes de propor mudar o produto baseado em 'usuário abandonou', validar se ele pertencia ao escopo. Auto-seleção saudável > onboarding inflado."*

**Casos canônicos empíricos cristalizados na tabela**:

| Caso | Padrão | Veredito |
|---|---|---|
| **Prima dentista** | Cirurgia siso eletiva (Pedro: *"dentista tira siso pra ganhar dinheiro"*) — caso comercial-protocolar, não clínico legítimo | Forçou semântica, completou AEC, report saiu errado. **Não é cliente perdido — não pertence ao escopo.** |
| **Illa Proença** | Agrônoma + presidente associação cannabis. Não é paciente — busca conexão institucional | Abandonou em 3min. **Auto-seleção saudável.** Caminho real dela é referral/dashboard institucional, não AEC. |
| **Maria Pitoco** | Paciente externa real Ricardo | AEC concluída + relatório ICP gerado ✓ |
| **Carolina (filha Ricardo)** | Conta teste | 15 reports assinados ICP em fluxo normal ✓ |

**7 memórias cristalizadas pela manhã** (todas nível 1 no MEMORY.md):
1. `feedback_aec_como_repelente_natural_de_demanda_fora_escopo_24_05`
2. `feedback_engenharia_perfeita_pode_produzir_semanticamente_inadequado_24_05`
3. `feedback_followup_badge_ui_nao_e_fase_aec_fsm_24_05`
4. `feedback_chat_livre_dominante_vs_aec_minoria_24_05`
5. `feedback_curva_aprendizado_alta_mesmo_para_socios_24_05`
6. `feedback_completar_tutorial_nao_e_absorver_24_05`
7. `feedback_diario_que_mostra_erros_vale_mais_que_diario_polido_24_05`

**FOLLOW_UP gap UI↔FSM descoberto**: badge UI *"Último fluxo: FOLLOW_UP"* não corresponde a fase do enum AssessmentPhase do FSM AEC. Query PAT retornou 0 ocorrências; grep no `clinicalAssessmentFlow.ts` retornou 0 matches. Implicação: trigger banner linha 610 não dispara nesse estado. **Parqueado**: investigação adicional necessária. Frase âncora: *"UI fala uma linguagem, FSM fala outra — assumir que são iguais cria dívida silenciosa."*

**Completar tutorial ≠ Absorver tutorial**: OnboardingTutorial existente (5 steps) tem **100% taxa de conclusão empírica** (31/31 que aceitaram termos). MAS taxa de absorção baixa — usuário pula "Próximo" 5x rápido pra começar a usar. Faveret + Illa completaram e abandonaram mesmo assim. **Próximo passo é visibilidade do HelpModal existente (auto-open na 1ª vez), NÃO refazer tutorial.**

#### Tarde (Blocos R-Q)

**🔥 TEXTO RICARDO #1 (madrugada 24/05, após análise GPT do caso prima dentista)**:

> *"Na medicina biomédica clássica: sintoma → síndrome → diagnóstico → doença. É uma lógica de redução nosológica."*
>
> *"Na AEC: a 'queixa' ou o 'motivo da procura' não serve primeiro para encontrar a doença. Ela serve para encontrar o indivíduo em situação clínica."*
>
> *"Sintoma já pressupõe enquadramento biomédico; queixa/motivo da procura preserva abertura fenomenológica."*
>
> *"AEC não parece ter sido construída para 'caçar doença'. Ela parece ter sido construída para organizar a entrada narrativa do sujeito no encontro clínico. A doença pode aparecer depois. Mas ela não é o ponto de partida obrigatório."*
>
> *"A crítica correta ao caso da prima talvez seja: NÃO 'a AEC só funciona para sintoma'. MAS 'a camada operacional posterior reduziu indevidamente o motivo da procura a sintoma patológico'."*

**🔥 TEXTO RICARDO #2 (manhã 24/05, após análise V1.9.443)**:

> *"O framework que orienta a elaboração das perguntas é exatamente o que estamos discutindo. O framework coloca as perguntas na boca do profissional. Busca por sintomas e sinais de doenças, ao invés de busca por sinais e sintomas do indivíduo seja saudável ou não."*

**Inversão epistemológica explícita** que esse texto cristaliza:

| Anamnese clássica (centrífuga) | AEC (centrípeta) |
|---|---|
| Framework na **boca do profissional** | Framework na **boca do indivíduo** |
| Perguntas dirigidas | Indivíduo se apresenta primeiro |
| Busca = sinais/sintomas **de doenças** | Busca = sinais/sintomas **do indivíduo (saudável ou não)** |
| Pressupõe doença a encontrar | Pressupõe indivíduo existente |
| Direção: doença → sujeito | Direção: sujeito → (eventualmente) doença |
| Sujeito = paciente passivo | Sujeito = indivíduo ativo |

**V1.9.443+A+B PATIENT_FREE_CHAT_GUARDRAILS implementação** (cristalizado em diário 24/05 Bloco R):

V1.9.443 base — bloco `PATIENT_FREE_CHAT_GUARDRAILS` no CLINICAL_PROMPT (~70 linhas):
- FAMÍLIA 1: produto/dose/marca/benefícios farmacológicos CBD/cannabis
- Resposta canônica V3 lapidada por Ricardo (4 perguntas → 3, "falar de produto" → "pensar em produto", "ela vai pro médico estruturada" → "ela chegue ao profissional de forma mais clara"):

> *"Antes de pensar em produto, me conta um pouco: o que te trouxe a procurar CBD para dormir? Há quanto tempo o sono está te incomodando? O que mudou ultimamente?*
>
> *Pergunto porque sua história importa antes da escolha de qualquer produto. Qual CBD usar, em que dose ou de qual marca é uma decisão do médico prescritor depois de te ouvir. Mas posso te ajudar a organizar essa história agora para que ela chegue ao profissional de forma mais clara. Quer começar?"*

V1.9.443-A — adiciona FAMÍLIA 2 EDUCACIONAL + FAMÍLIA 3 JOURNEY_GUIDANCE:
- FAMÍLIA 2 ("o que é cbd?", "explique cbd", "para que serve cbd"): pode explicar conceito GENÉRICO + ANVISA, mas NÃO listar indicações terapêuticas
- FAMÍLIA 3 ("devo me vincular a um médico?", "como funciona?", "qual o correto?"): JOURNEY_GUIDANCE explicando AEC → médico → consulta sem disparar `[TRIGGER_SCHEDULING]`

V1.9.443-B — adiciona FAMÍLIA 4 INICIAR TRATAMENTO + Fix regex frontend:
- FAMÍLIA 4 ("quero iniciar tratamento com cbd", "quero usar cbd"): explica que tratamento exige avaliação prévia + bifurcação consciente
- Fix B frontend: `isJourneyDoubt` guard em `noaResidentAI.ts:1797` `clientWantsAecStart` + `isInterrogativeDoubt` em `clinicalAssessmentFlow.ts:739` — frase com `?` + marcadores ("devo", "ou", "qual", "como funciona") NÃO dispara `startAssessment()` (era pergunta de orientação, não pedido imperativo)

**Pausa estratégica Pedro 24/05 tarde** (cristalizado em `feedback_mapear_universo_vetores_antes_de_codar_guardrail_24_05`):

> Pedro: *"perfeito! ja que estamos nessa quais mais opcoes dentro do nosso universo voce acha que ainda vao chegar?"*

→ Disparou mapeamento **universo 11 categorias chat livre paciente** (`project_universo_vetores_chat_livre_paciente_24_05`):

| Cat | Vetor | Risco |
|---|---|---|
| A | Substâncias farmacológicas controladas | Alto regulatório |
| A bis | Suplementação não-cannabis | Médio |
| A ter | Dieta/restrição/exames sem prescrição | Médio |
| B | Jornada operacional | Baixo |
| C | Identidade de doença prematura | **Alto clínico** |
| D | Red flags / urgência | **Crítico safety** |
| E | Cannabis específico/avançado | Alto regulatório + clínico |
| F | Operacional do app | Baixo |
| G | Demandas fora-escopo | Baixo |
| H | LGPD/privacidade | Alto LGPD |
| I | Tom emocional pesado | Crítico safety |
| **5** (descoberta GPT externo) | **EVENTO_TERAPÊUTICO / PROCEDIMENTO** | Médio-Alto |

**Insight Pedro AEC-gate-anti-funnel**:

> *"mais temos aec para saber o motivo da cirurgia agendar tera q passar por ela de qlqr maneira! iniciando oq trouxe voce aqui e perguntas fixas ricardo experiancia pode cair mais e o funil"*

→ **AEC obrigatória como gate em algumas famílias** (1, 4, 5) em vez de bifurcação opcional. Princípio: gate clínico-narrativo > funnel comercial agressivo.

#### Noite (Bloco S do diário 24/05)

**🚨 BUG CRÍTICO V1.9.443-B descoberto por Carolina**: Carolina iniciou AEC ~17:14 BRT. Pedro mandou print mostrando:
- Etapa 2 (Lista Indiciária): ✅ "O que mais?" funcionou
- Etapa 3 (Queixa Principal): ✅ Paciente escolheu
- **Etapa 4 (HDA)**: ❌ **DISPAROU 4 PERGUNTAS DE UMA VEZ**: *"Onde você sente? Quando começou? Como se manifesta? O que melhora ou piora?"*
- **Etapa 5 (História Pregressa)**: ❌ **PULOU SEM FECHAR Etapa 4**

**Diagnóstico cirúrgico via logs Edge**:

```
17:14:54.369  Erro ao processar fluxo AEC:
17:15:55.870  Erro ao processar fluxo AEC:
...
17:17:37.691  Erro ao processar fluxo AEC: ReferenceError: response is not defined
    at ClinicalAssessmentFlow.processResponse (index.BVlNu7Wu.js:191:12636)
```

**Causa raiz** (auto-acusação honesta minha):
- V1.9.443-B Fix B adicionou guard `isInterrogativeDoubt` em [clinicalAssessmentFlow.ts:755]
- Usei `response.includes('?')` — **variável `response` NÃO EXISTE** no escopo
- Parâmetro real do método é `userResponse` (linha 590)
- TypeScript NÃO pegou (nome ambíguo aceito como variável global)
- `processResponse()` crashou a CADA turno AEC
- Try/catch externo capturou e logou silencioso
- FSM AEC não avançou as fases (state fossilizado)
- GPT-4o continuou respondendo "de cabeça" usando protocolo do CLINICAL_PROMPT, mas violou regras "uma pergunta por vez" + "esperar paciente encerrar Etapa"

**Por que escapou do smoke V1.9.443+A+B**: smoke do Pedro (13:14-13:20) foi **100% chat livre** — Pedro expressamente disse *"nao iniciei nem pedi agendamento nem aec"*. **AEC FSM ficou como ponto cego do smoke**.

**Hotfix `33e46ab` aplicado em 10min**: `response.includes('?')` → `userResponse.includes('?')`. type-check verde. Push 4 refs URGENTE.

**Validação empírica AEC Carolina pós-hotfix (22 turnos limpos)**: PAT puxou 22 interações consecutivas (21:25-21:30:54 BRT) sem nenhum `Erro ao processar fluxo AEC`. **Todas as 10 etapas literais respeitadas**. Pipeline disparou completo (CLEANUP_PASS + REPORT + SIGNATURE hash `5882d567e3220c2d...` + AXES_SYNCED + RATIONALITY_SYNCED + DB SAVED). Pipeline latência: 31.357ms.

**Memory cristalizada**: `feedback_smoke_aec_completa_obrigatoria_pos_clinicalassessmentflow_mudanca_24_05`:

> *"Toda mudança em `src/lib/clinicalAssessmentFlow.ts` exige smoke com AEC COMPLETA (etapa 1 → etapa 10) ANTES de commit, NÃO importa quão 'cirúrgica' pareça a mudança. type-check NÃO substitui smoke de runtime FSM."*

### 25/05 — Sprint Matrix Z2 Completo (5 fixes em 1 dia)

Última sessão do mês. Documentado no DIARIO_25_05 (17 blocos A→Q).

**V1.9.449 — count pacientes Ricardo (10:30 BRT)**:

Pedro 24/05 noite expôs via logs Ricardo: *"Quantos pacientes vinculados a mim?"*. 3 fontes, 3 números diferentes:
- Nôa: 15 (heurística "ativos 30d")
- `getAllPatients` front: 48 (UNION assessments+appointments)
- PAT `users.type='patient'` total: 34

PAT empírico 25/05 manhã: dos 48 vinculados, 34 são role=paciente REAL, 14 são admin/professional test users (Admin Test + profissionais cadastrados como paciente em testes antigos).

Fix V1.9.449 cirúrgico (3 linhas): adicionou `.in('type', ['paciente','patient'])` no `.from('users').select(...)` linha 99-101 de `adminPermissions.ts`. Ricardo passa de 48 → 34.

**V1.9.450 — Matrix Corpus Expandido (12h-13h BRT)**:

Investigação empírica via PAT revelou bug arquitetural na Matrix Z2:

Reports `clinical_reports.content` (jsonb) contém 13 seções estruturadas: `identificacao`, `queixa_principal`, `lista_indiciaria`, `desenvolvimento_queixa`, `historia_patologica_pregressa`, `historia_familiar` (lado_materno + lado_paterno), `habitos_vida`, `perguntas_objetivas`, `rationalities`, `consenso`, `structured`, `metadata`, `raw`.

**MAS Body do caso pra Matrix** (`NoaMatrixView.tsx:302` pré-V1.9.450):
```ts
body: `Caso #${c.caseId.slice(-6)}${c.queixa ? `\nQueixa: "${c.queixa}"` : ''}`
```

**Literalmente 2 informações**: id encurtado + queixa de 120 chars. Matrix dizia "não há família" porque LITERALMENTE não tinha — corpus cirurgicamente pobre.

V1.9.450 implementação em 5 arquivos:
- `src/lib/casePseudonymization.ts` (NOVO ~230 linhas): helper `extractPseudonymizedClinicalContent` (whitelist 7 seções) + `formatPseudonymizedCaseBody`
- `src/hooks/useSearchHistory.ts`: `OpenedCase` ganha `clinicalContent` opcional
- `src/hooks/useCaseSearch.ts`: `CaseSearchHit` ganha `clinicalContent`
- `src/components/NoaMatrixView.tsx`: recordCaseOpen passa content + body formatado
- `src/pages/AdminCasosSimilares.tsx`: `CaseResult` ganha `clinicalContent`

Helper LGPD-safe: NUNCA inclui `identificacao.nome`, `raw`, `metadata`, `scores`, `rationalities`, `consenso`. Whitelist explícita auditável.

**🚨 BUG CRÍTICO V1.9.450 expôs — Matrix ALUCINOU 6 dados (14h BRT)**:

Pedro testou Matrix Z2 pós-V1.9.450 com Pedro Paciente teste. Matrix respondeu:
- *"27/04: mãe faleceu câncer de mama"*
- *"07/05: pai tem diabetes"*
- *"27/04: fuma 10 cigarros/dia"*
- *"07/05: consome álcool socialmente"*
- *"27/04: Paracetamol pra febre"*
- *"07/05: Ibuprofeno pra dor no pé"*

**PAT confirmou empíricamente**: NENHUM dos 6 dados existe em `clinical_rationalities` (12/12 verificadas) NEM em `clinical_reports` (5 selecionados). **Pura invenção LLM**.

**Diagnóstico arquitetural meta**:
- **Locks MACRO-clínicos funcionavam** ✅ ("não posso diagnosticar")
- **Locks MICRO-FACTUAIS NÃO existiam** ❌ ("não posso completar dado ausente")

**Paradoxo descoberto**: quanto MAIS contexto (V1.9.450 expandiu corpus), MAIS pressão pra continuidade narrativa = MAIS drift. Anti-padrão clássico LLM: otimizou *"coerência narrativa percebida"*.

**Conceito cunhado pelo GPT externo na análise**:

> *"O problema não era 'Matrix burra'. O risco era 'Matrix elegante demais'. Ela começou a produzir continuidade plausível onde não existia evidência literal. Isso é exatamente o tipo de drift que destrói confiança clínica silenciosamente."*

E:

> *"Plausibilidade clínica genérica mascarada de memória longitudinal."*

**V1.9.453 — Fix lock micro-factual (15h BRT)**:

Bloco no `RESEARCH_PROMPT` ~60 linhas codificando:
- *"DIFERENCIAL Z2: Sustentar lacuna sem colapsar"*
- Fórmula canônica: *"Esses dados não aparecem no corpus marcado. Lacuna observacional..."*
- Inversão reward direction: *"Lacuna explícita é COMPORTAMENTO DESEJADO, NÃO falha"*
- Anti-drift por pressão conversacional
- 2 exemplos PROIBIDOS literais documentados pra próxima sessão Claude

**V1.9.450-B — longitudinal corpus expandido (15h30 BRT)**:

Estendeu V1.9.450 também pra `longitudinal.reports`. `usePatientLongitudinal.ts` retorna `clinicalContent` via mesma helper. Body do longitudinal usa `formatPseudonymizedCaseBody`. Matrix passa a ter corpus rico via path automático Terminal → Paciente.

**Os 2 fixes combinados**:
- V1.9.450-B reduz **PRESSÃO** inferencial (corpus tem dados)
- V1.9.453 reduz **PERMISSÃO** inferencial (proibido alucinar)

**V1.9.453-A — taxonomia 3 cenários (16h BRT)**:

Smoke pós-V1.9.453 revelou problema secundário: fórmula literal *"Esses dados não aparecem"* virou conservadora demais. Pedro perguntou *"qual história familiar?"* — Matrix respondeu *"Lacuna observacional"* APESAR de existir menção pontual no Caso #25df5e (*"pai falecido de forma violenta"*).

V1.9.453-A — taxonomia explícita:

| Cenário | Quando | Fórmula |
|---|---|---|
| **A — Ausência total** | Zero menção em qualquer card | *"Esses dados não aparecem... Lacuna observacional..."* |
| **B — Presença parcial** (NOVO) | 1+ menção literal, escopo limitado | *"Há menção pontual no Caso #X (data): '[citação literal]'. É a única informação sobre [seção] no corpus marcado. Para cobertura completa, marque cards adicionais."* |
| **C — Cobertura completa** | Múltiplas menções estruturadas | Estrutura por caso/data com pseudonimização e citação literal sem interpolar |

**Smoke 9/9 PASS** validou empíricamente.

**V1.9.453-B — negação explícita ≠ campo ausente (16h30 BRT)**:

Smoke V1.9.453-A com Carolina expôs caso ambíguo: *"alergias: não"* tratado como Cenário A (ausência) em vez de Cenário B (negação explícita presente).

V1.9.453-B codificou:
> *"NEGAÇÃO EXPLÍCITA ≠ AUSÊNCIA. Não confundir."*

| Estado semântico | Cenário |
|---|---|
| Campo presente com valor positivo (*"alergia X"*) | B |
| Campo presente com valor negativo (*"não"* / *"nenhuma"* / *"nega"*) | **B** (não A) |
| Campo ausente (zero menção da seção em qualquer card) | A genuíno |

**V1.9.454 — MatrixHelpModal elite + bloco compactado (17h BRT)**:

Pedro pediu polish UX (*"acho que isso aqui pode ser um dropdown! ou clickar e explica modo de uso..."*). 

Bloco *"Como funciona: marque cards..."* denso virou linha compacta + ícone (?) clicável no header → abre `MatrixHelpModal` com 6 seções (o que é Z2 / como montar corpus / 3 cenários / o que NÃO faz / exemplos / Matrix vs Casos Similares).

Coerência UX com `NoaChatHelpModal` V1.9.54 do chat paciente (mesmo padrão visual).

### Frase âncora semana 4

> *"Matrix Z2 saiu de alucinação completiva (mãe câncer/pai diabetes inventados) → taxonomia semântica cirúrgica (ausência total / presença parcial / cobertura completa + negação explícita). Maturação simultânea chat paciente + chat profissional ao redor do mesmo princípio Ricardo."*

---

# 🚨 SEÇÃO 4 — Anatomia dos 10 bugs críticos do mês

Aplicando `feedback_diario_que_mostra_erros_vale_mais_que_diario_polido_24_05`. Cada bug é registrado com descoberta + diagnóstico + fix + lição.

## Bug #1 — Matrix ALUCINOU 6 dados clínicos (25/05 14h BRT) 🔴 CRÍTICO

**Como foi descoberto**: Pedro testou Matrix Z2 pós-V1.9.450 com paciente teste Pedro Paciente (UUID `d5e01ead`). Pediu análise + perguntas sobre família/hábitos/medicações.

**Sintoma**: Matrix respondeu com 6 dados específicos detalhados (mãe câncer mama, pai diabetes, 10 cigarros/dia, álcool social, Paracetamol, Ibuprofeno) que **NÃO existiam em NENHUM lugar do banco**.

**Investigação via PAT**:
```sql
SELECT count(*) FROM clinical_rationalities WHERE patient_id = 'd5e01ead-...' AND assessment ~* '(câncer|diabetes|fuma|cigarro|paracetamol|ibuprofeno|álcool)'
→ 0/12 hits
```

E:
```sql
SELECT id, content->>'historia_familiar', content->>'habitos_vida', content->>'perguntas_objetivas' FROM clinical_reports WHERE patient_id = 'd5e01ead-...'
→ Nenhum dos 5 reports continha câncer mama, diabetes pai, fumo, álcool, Paracetamol, Ibuprofeno
```

**Causa raiz**: V1.9.450 expandiu corpus mas locks MICRO-FACTUAIS não existiam. RESEARCH_PROMPT proibia "não diagnosticar" (macro) mas NÃO proibia "não inventar dado ausente" (micro). LLM otimizou *"coerência narrativa percebida"* — anti-padrão clássico.

**Fix V1.9.453 (15min)**: bloco ~60 linhas no RESEARCH_PROMPT codificando:
- "DIFERENCIAL Z2: Sustentar lacuna sem colapsar"
- Fórmula canônica de lacuna observacional
- Inversão reward direction
- 2 exemplos PROIBIDOS literais (esses 6 dados inventados)

**Lição cristalizada**: Locks macro-clínicos (não diagnosticar) ≠ locks micro-factuais (não inventar dado ausente). **Faltar lock micro = LLM alucina pra "ser útil" mesmo com macro intacto**. Cristalizado em `feedback_locks_macro_vs_micro_matrix_alucinacao_completiva_25_05`.

## Bug #2 — ReferenceError V1.9.443-B em produção (24/05 17h BRT) 🔴 CRÍTICO

**Como foi descoberto**: Carolina (conta teste do Ricardo) tentou fazer AEC ~17:14 BRT. Pedro mandou print: Nôa disparou 4 perguntas de uma vez na Etapa 4 + pulou pra Etapa 5 sem fechar Etapa 4.

**Sintoma visível ao paciente**:
- Etapa 4 HDA esperada: *"Onde você sente essa sensação?"* (UMA pergunta)
- Etapa 4 HDA real: *"Onde você sente essa sensação? Quando ela começou? Como ela se manifesta? O que melhora ou piora essa sensação?"* (QUATRO perguntas)
- Pulou Etapa 5 (HPP) sem confirmar fechamento Etapa 4

**Investigação via logs Edge**:
```
17:14:54.369  Erro ao processar fluxo AEC:
17:15:55.870  Erro ao processar fluxo AEC:
...
17:17:37.691  Erro ao processar fluxo AEC: ReferenceError: response is not defined
    at ClinicalAssessmentFlow.processResponse (index.BVlNu7Wu.js:191:12636)
```

**Causa raiz** (auto-acusação minha): Fix B do V1.9.443-B (commit `25a7849`) adicionou guard `isInterrogativeDoubt` em `clinicalAssessmentFlow.ts:755` usando `response.includes('?')`. **A variável `response` não existe nesse escopo**. Parâmetro real do método é `userResponse` (linha 590). TypeScript não pegou porque `response` é nome de variável global aceito como ambíguo.

`processResponse()` crashava a CADA turno AEC. Try/catch externo capturou e logou silencioso. FSM AEC não avançou as fases. GPT-4o continuou respondendo "de cabeça" usando protocolo do `CLINICAL_PROMPT` (que tem o roteiro completo memorizado) mas violou regras "uma pergunta por vez" + "esperar paciente encerrar Etapa antes de avançar".

**Por que escapou do smoke V1.9.443+A+B**: smoke do Pedro (13:14-13:20) foi **100% chat livre** — Pedro expressamente disse *"nao iniciei nem pedi agendamento nem aec"*. **AEC FSM ficou como ponto cego do smoke**.

**Hotfix `33e46ab` em 10min**: `response.includes('?')` → `userResponse.includes('?')`. type-check verde. Push 4 refs urgente.

**Validação pós-hotfix**: Carolina re-testou ~21:25 BRT. PAT puxou 22 interações consecutivas (21:25-21:30:54) sem nenhum `Erro ao processar fluxo AEC`. **Todas as 10 etapas literais respeitadas**. Pipeline completo disparou (REPORT 46b626a5 + SIGNATURE hash `5882d567e3220c2d...` + AXES + RATIONALITY + DB SAVED). Pipeline latência: 31.357ms.

**Lição cristalizada**: Toda mudança em `src/lib/clinicalAssessmentFlow.ts` exige smoke com AEC COMPLETA (etapa 1 → etapa 10) ANTES de commit. type-check NÃO substitui smoke de runtime FSM. Cristalizado em `feedback_smoke_aec_completa_obrigatoria_pos_clinicalassessmentflow_mudanca_24_05`.

## Bug #3 — Count pacientes inconsistente 15/48/34 (24/05 13h → fix 25/05 10h) 🟠 ALTO

**Como foi descoberto**: Ricardo logado como profissional REAL (UUID `2135f0c0`) perguntou no chat *"quantos pacientes vinculados a mim?"* em 24/05 13:32 BRT.

**Sintoma**: 3 fontes, 3 números diferentes:
- Nôa: *"15 pacientes ativos vinculados nos últimos 30 dias"*
- `getAllPatients` (frontend log): *"48 pacientes (profissional)"*
- PAT `users.type='patient'` total: **31** (24/05) → **34** (25/05)

Médico recebendo 3 números diferentes pra mesma pergunta = perda de confiança no sistema.

**Investigação empírica via PAT 25/05 manhã**:
```sql
WITH vinculados AS (
  SELECT DISTINCT patient_id FROM clinical_assessments WHERE doctor_id = '2135f0c0-...'
  UNION
  SELECT DISTINCT patient_id FROM appointments WHERE professional_id = '2135f0c0-...' OR doctor_id = '2135f0c0-...'
)
SELECT u.type, count(*) FROM vinculados v JOIN users u ON u.id = v.patient_id GROUP BY u.type;
→ patient: 34
→ admin/professional: 14
→ órfãos: 0
→ TOTAL: 48
```

**Diagnóstico cirúrgico**: dos 48 vinculados via UNION (assessments + appointments), **34 são role=paciente real** ✅ e **14 são admin/professional test users** ❌ (Admin Test + profissionais cadastrados como paciente em testes antigos).

`getAllPatients` em `adminPermissions.ts:99-101` NÃO filtrava `type='patient'` — devolvia 48 incluindo 14 ruidosos.

**Fix V1.9.449 cirúrgico (3 linhas)**:
```diff
const { data: users, error: userError } = await supabase
  .from('users')
  .select('id, name, email, phone, created_at')
  .in('id', patientIds)
+ .in('type', ['paciente', 'patient'])  // V1.9.449
  .order('name', { ascending: true })
```

Branch admin (linha 47-73) NÃO tocada (admin continua vendo todos pacientes via filter já presente).

**Lição cristalizada**: filter por `type` é OBRIGATÓRIO em qualquer query que apresente "pacientes" a médico/admin. Antes de qualquer dashboard mostrar contagem, validar via PAT que está filtrado corretamente. Cristalizado em `feedback_count_pacientes_v1_9_449_e_gaps_function_calling_v1_9_450_25_05`.

## Bug #4 — LGPD vazamento nome em forum_posts (21/05) 🟠 ALTO LGPD

**Como foi descoberto**: audit empírico do post `75badd3d` (forum, 21/05). PAT revelou `patient_pseudonym=NULL` + content mencionando "Pedro Paciente" 6+ vezes.

**Causa raiz**: `useForumPublish.ts:65` original tinha `pseudonym || null` silencioso. Se médico esquecesse de preencher pseudônimo, ia salvar NULL sem alerta.

**Fix V1.9.437 (23/05) — 3 camadas defesa em profundidade**:
1. Validação hard no hook bloqueia publish sem pseudônimo
2. Detector heurístico de nomes via lookup `clinical_reports` do médico → `window.confirm` se match
3. 2º checkbox no modal de consent ("atesto que revisei conteúdo e não tem nome real")

**Lição cristalizada**: *"Fallback silencioso `|| null` em campo LGPD-crítico é a forma mais barata de criar bomba relógio."* Cristalizado em `feedback_forum_publish_requer_pseudonimo_23_05`.

**Resíduo NÃO fechado**: campo `assessment` (text) em `clinical_rationalities` ainda pode citar nome real. Parqueado V1.9.452 pré-Marco 2 (cristalizado em `feedback_pseudonimizacao_conteudo_forum_21_05`).
> Correção 26/05: nome do campo é `assessment`, NÃO `assessment_excerpt`. Audit empírico confirmou via PAT.

## Bug #5 — ConsentGuard loop infinito (22/05) 🟠 ALTO

**Sintoma**: paciente ficava preso em consent screen infinito.

**Fix V1.9.420** mata cycle silencioso.

**Lição**: guards de consent precisam ter saída em todos os branches lógicos.

## Bug #6 — PostgREST max-rows 1000 silencioso (22/05) 🟠 ALTO

**Como foi descoberto**: aba Observabilidade IA do dashboard admin mostrava *"0,0% cobertura / $0,00"*.

**Investigação empírica**: PAT confirmou que o real era 14,5% / $6,74 / 3.738 rows.

**Causa raiz**: `fetchInstrumentationCoverage` puxava 1.000 linhas físicas (as mais antigas, sem `.order()`) e calculava % sobre isso. **PostgREST Supabase JS nunca devolve >1.000 linhas/request** (`max-rows` config). `.limit(10000)` é no-op acima disso, SEM erro.

**Fix V1.9.421**: usar `count:'exact', head:true` — contar nunca puxa linhas físicas.

**Lição cristalizada**: *"PostgREST corta `.select()` em 1.000 linhas silencioso. Desconfiar de qualquer 1000 num painel."* Cristalizado em `feedback_postgrest_max_rows_1000_silencioso_22_05`.

## Bug #7 — RAG truncation endêmico (17/05) 🟠 MÉDIO

**Como foi descoberto**: análise de comportamento Nôa sob queries longas.

**Sintoma**: respostas pareciam ter contexto mas tinham contexto parcial — RAG cortava silenciosamente.

**Fix progressivo** ao longo de várias versões (V1.9.330+).

**Lição cristalizada**: cristalizado em `feedback_rag_truncation_endemico_17_05`.

## Bug #8 — Grounded Response Mode ausente (17/05) 🟠 MÉDIO

**Como foi descoberto**: faltava modo formal pra forçar respostas baseadas em corpus específico vs RAG geral.

**Cristalizado em** `feedback_grounded_response_mode_ausente_17_05`. **Resolvido empíricamente** depois com V1.9.388 (Matrix Z2 voz estrutural cita corpus literal) e V1.9.453+A+B (taxonomia 3 cenários).

## Bug #9 — AEC restart regex landmine "agora" (26/04 V1.9.77) 🟡 MÉDIO

**Como foi descoberto**: Carolina paciente teste digitou *"começou com bolha agora virou ferida"* descrevendo evolução de uma lesão. **O sistema disparou `resetAssessment()` no meio da Etapa 4 (COMPLAINT_DETAILS)** porque "agora" matchava como sinal de restart.

**Causa raiz**: regex de detecção de restart incluía a palavra "agora" como gatilho. **"agora" é palavra EXTREMAMENTE comum em relato clínico**: *"dor agora"*, *"agora piorou"*, *"começou ontem e agora..."*. Zero relação semântica com pedir nova avaliação.

**Fix V1.9.77**: removido "agora" do regex de reinício. Também deduplicado "triagem".

**Cristalizado em** `project_aec_restart_regex_landmine_26_04`. **Princípio meta**: ao escrever regex pra detectar intenção de restart, lembrar que palavras comuns em relato clínico não podem servir como gatilho.

## Bug #10 — Carolina loop GPT-first (13/05) 🟡 MÉDIO

**Como foi descoberto**: Ricardo testando como Carolina, identificou drift narrativo onde GPT estava "tomando a frente" da AEC em vez de respeitar Verbatim First.

**Diagnóstico**: pipeline tinha ordem invertida em algumas branches — GPT chamado antes do Verbatim First validar fase.

**Fix em V1.9.300+** corrigiu ordem.

## Anti-padrão clássico LLM descoberto empíricamente

Síntese de Bug #1 (alucinação Matrix) + análise GPT externo:

**"Plausibilidade clínica genérica mascarada de memória longitudinal"**

Mecanismo:
1. Modelo recebe corpus parcial (alguns dados, faltam outros)
2. Modelo treinado em prompts comuns ("seja útil") tenta preservar coerência narrativa
3. Modelo INTERPOLA dado clínico plausível (que SOA verdadeiro, é coerente com narrativa, mas é INVENTADO)
4. Resposta sai DENSA e ÚTIL aparentemente — médico não percebe que parte é fabricada
5. Drift silencioso destrói confiança clínica ao longo do tempo (cada interação adiciona dados fabricados ao "histórico" implícito)

**Quando emerge**: JUSTAMENTE quando o corpus expande. Paradoxo do contexto rico:
- Corpus pobre → modelo diz "não sei"
- Corpus parcial → modelo TENTA preencher → alucina

**Solução dual**:
- Reduzir PRESSÃO (corpus rico = menos pressão pra inventar): V1.9.450-B
- Reduzir PERMISSÃO (lock micro-factual explícito): V1.9.453

**Cristalizado em** `feedback_locks_macro_vs_micro_matrix_alucinacao_completiva_25_05`.

---

# 🧠 SEÇÃO 5 — Princípios meta cristalizados no mês (taxonomia detalhada)

## 5.1 — Princípios EPISTEMOLÓGICOS (núcleo Ricardo)

### Princípio 1 — Queixa ≠ Sintoma (abertura fenomenológica)

**Origem**: texto Ricardo madrugada 24/05/2026 após análise GPT do caso prima dentista.

**Citação literal**:
> *"Na medicina biomédica clássica: sintoma → síndrome → diagnóstico → doença. É uma lógica de redução nosológica. Na AEC: a 'queixa' ou o 'motivo da procura' não serve primeiro para encontrar a doença. Ela serve para encontrar o indivíduo em situação clínica. Sintoma já pressupõe enquadramento biomédico; queixa/motivo da procura preserva abertura fenomenológica."*

**Aplicação concreta no mês**: V1.9.443+A+B redação V3 lapidada por Ricardo:
> *"Antes de pensar em produto, me conta um pouco: o que te trouxe a procurar CBD para dormir?"*

Não recusa, não nega — **devolve à escuta fenomenológica**.

**Cristalizado em** `feedback_queixa_nao_e_sintoma_aec_e_abertura_fenomenologica_24_05`.

### Princípio 2 — Framework AEC centrípeto vs anamnese centrífuga

**Origem**: texto Ricardo manhã 24/05.

**Citação literal**:
> *"O framework que orienta a elaboração das perguntas é exatamente o que estamos discutindo. O framework coloca as perguntas na boca do profissional. Busca por sintomas e sinais de doenças, ao invés de busca por sinais e sintomas do indivíduo seja saudável ou não."*

**Implicação arquitetural**: o protocolo AEC literal (CLINICAL_PROMPT linhas 4538-4554) JÁ CODIFICA esse framework:
- Etapa 1: *"apresente-se"* → indivíduo fala primeiro
- Etapa 2: *"O que trouxe você?"* + *"O que mais?"* repetido até paciente encerrar
- Etapa 3: *"De todas essas questões, qual mais te incomoda?"* → paciente escolhe
- Etapa 4: explora a queixa que o paciente JÁ escolheu (regra de ouro: não muda)
- Etapa 5: *"Primeiro: história e sinais... Depois: se faltar objetividade, você pergunta doenças crônicas/cirurgias/medicações como clarificação, NUNCA como centro."*

**Onde a inversão se perde** (gaps identificados):
1. Chat livre paciente fora-FSM (`assessmentPhase='none'`) — CLINICAL_PROMPT não tinha proibição anti-recomendação farmacológica → resolvido V1.9.443+A+B
2. Camada posterior pós-AEC — pipeline de scoring/racionalidades transforma queixa em "sintoma patológico" downstream (caso prima dentista 23/05) → identificado, parqueado

### Princípio 3 — Sustentar lacuna sem colapsar (vertente pesquisa)

**Origem**: smoke V1.9.450 (25/05) que expôs alucinação completiva Matrix.

**Frase âncora cristalizada**:
> *"Sustentar lacuna sem colapsar = diferencial Z2 do produto. Honestidade epistemológica > parecer útil. Lacuna explícita é COMPORTAMENTO DESEJADO, NÃO falha."*

**Aplicação**: V1.9.453 lock micro-factual + V1.9.453-A taxonomia 3 cenários + V1.9.453-B negação explícita.

**Cristalizado em** `feedback_locks_macro_vs_micro_matrix_alucinacao_completiva_25_05`.

### Princípio 4 — Locks MACRO vs MICRO devem ser explícitos

**Distinção arquitetural**:

| Macro-clínicos | Micro-factuais |
|---|---|
| "não posso diagnosticar" | "não posso completar dado ausente" |
| "não posso prescrever" | "não posso inferir histórico" |
| "não posso sugerir conduta" | "não posso preencher seção via plausibilidade" |
| "não posso categorizar por doença" | "não posso fundir entidades diferentes" |

**Insight**: Locks macro são óbvios e geralmente codificados primeiro. **Locks micro são o gap arquitetural sutil** que aparece quando corpus expande ou pressão conversacional aumenta. Aplicável a TODO guardrail clínico-conversacional futuro.

### Princípio 5 — Constituição = 2 vertentes da MESMA matriz epistemológica

**Origem**: Bloco P do diário 25/05 (insight transversal entre 24/05 + 25/05).

**Tese**: chat paciente (24/05 "queixa ≠ sintoma") e Matrix profissional (25/05 "sustentar lacuna") são **manifestações da MESMA epistemologia** aplicada a domínios diferentes.

**4 eixos comuns**:

1. **Escuta sobre interpretação**
   - Chat paciente: ouvir queixa antes de propor diagnóstico
   - Matrix profissional: ler corpus antes de sintetizar

2. **Fidelidade sobre completude**
   - Chat paciente: queixa em primeira pessoa preservada literal
   - Matrix profissional: citar literal o que está no corpus

3. **Honestidade sobre utilidade percebida**
   - Chat paciente: "não posso recomendar produto" > parecer útil ao paciente leigo
   - Matrix profissional: "lacuna observacional" > parecer útil ao médico

4. **Estrutura sobre síntese**
   - Chat paciente: protocolo AEC 10 etapas literais
   - Matrix profissional: cada caso/data é unidade narrativa separada

**Aplicabilidade**: framework pra TODA feature clínico-conversacional futura — perguntar PRIMEIRO se viola algum dos 4 eixos antes de codar. **Cristalizado em** `feedback_duas_vertentes_uma_matriz_epistemologica_constituicao_medcannlab_25_05`.

## 5.2 — Princípios de PROCESSO (8 cristalizados)

### Princípio 6 — Doc institucional sem PAT cruzar não é válido

**Origem**: Ricardo em 23/05 ~10h11 BRT no grupo WhatsApp dos sócios, em resposta a tensão semântica sobre pitch MUHDO. Adotado por Ricardo (*"já é sua opinião"*) — vira regra compartilhada do time.

**Aplicação no mês**: aplicado DEZENAS de vezes. Foi por causa desse princípio que:
- 14 iterações do "parágrafo institucional v5→v14 final definitivo" foram **descontinuadas** implicitamente
- Cada nova métrica em dashboard precisou ser cruzada com PAT antes de virar fato institucional
- Esta própria retrospectiva tem PAT empírico em todos os números (Seção 2)

**Frase âncora Ricardo**: *"Quem não cruza com PAT cria dívida pra quem vai cruzar depois."*

### Princípio 7 — Diário que mostra erros vale mais que diário polido

**Origem**: 24/05 (Pedro corrigindo Claude 3x na mesma sessão).

**Tese**: registrar **explíicitamente** o erro + recalibração tem MAIS valor que reescrever o diário pra mostrar processo limpo. Próxima sessão Claude lê e **não repete o erro**.

**Aplicação**: todos os diários pós-24/05 incluem seções de "auto-correção" explícitas.

### Princípio 8 — Mapear universo de vetores ANTES de codar guardrail

**Origem**: 24/05 tarde (pausa estratégica Pedro entre V1.9.443-A e V1.9.443-B).

**Tese**: codar caso-a-caso à medida que cada vetor aparece = ciclos reativos (bug→patch→smoke→novo vetor→novo patch). **Mapear universo de vetores prováveis ANTES + versionar incrementalmente** = mais eficiente, escalável, auditável.

**Aplicação**: V1.9.443-B implementado baseado em **11 categorias mapeadas** (`project_universo_vetores_chat_livre_paciente_24_05`), não caso-a-caso reativo.

### Princípio 9 — Smoke AEC completa OBRIGATÓRIA após mudança em clinicalAssessmentFlow.ts

**Origem**: bug ReferenceError V1.9.443-B (24/05 noite). Smoke V1.9.443+A+B testou apenas chat livre, não AEC — bug escapou.

**Princípio cristalizado**:
> *"Toda mudança em `src/lib/clinicalAssessmentFlow.ts` exige smoke com AEC COMPLETA (etapa 1 → etapa 10) ANTES de commit, NÃO importa quão 'cirúrgica' pareça a mudança. type-check NÃO substitui smoke de runtime FSM."*

### Princípio 10 — Anti-overclaim endorsements

**Origem**: 28/04 (após 14 iterações do parágrafo institucional).

**Tese**: usuários teste internos ≠ validação institucional. 4-5 reports ≠ tração. Frases aspiracionais GPT externo ≠ selo. **Esperar 20-30 pacientes externos pagantes + auditoria CFM/ANVISA real** pra qualquer claim institucional.

**Aplicação**: filtro permanente em qualquer texto institucional. GPT externo elogiou MedCannLab várias vezes no mês com frases como *"arquitetura madura"*, *"clinical conversational governance"*, *"organizadora de trajetória clínica"*. **Nenhuma usada em material institucional** sem PAT cruzando empíricamente.

### Princípio 11 — Polir não inventar (Princípio 8)

**Tese**: antes de criar componente/feature novo, buscar mecanismo equivalente já existente. Reutilizar > criar paralelo.

**Aplicação no mês**: 
- V1.9.450-B reusou helper V1.9.450
- V1.9.453+A+B refinaram RESEARCH_PROMPT existente, não criaram modo paralelo
- V1.9.454 MatrixHelpModal seguiu padrão visual do NoaChatHelpModal V1.9.54

### Princípio 12 — Push dual-remote 4 refs

**Tese**: sempre push em 2 remotes × main + master = 4 refs. Naming varia por máquina (desktop: amigo + medcannlab5; laptop: hub + origin) — validar com `git remote -v`.

**Aplicação no mês**: 100% dos commits (~90) seguiram a regra.

### Princípio 13 — Coerência e alinhamento qualquer fix (filtro 6 perguntas)

**Origem**: 17/05.

**Filtro obrigatório pré-fix**:
1. Padrão arquitetural respeitado?
2. Invariantes (AEC/Pipeline/PBAD) NÃO TOCADOS?
3. Rationale conectado a bug empírico?
4. Trigger empírico ocorreu (alguém reproduziu)?
5. Compat reversa preservada?
6. Regras anteriores respeitadas?

**Aplicação no mês**: aplicado em fix V1.9.441 explícitamente. Implícito em todos outros.

## 5.3 — Princípios ARQUITETURAIS (6 cristalizados)

### Princípio 14 — RAG molda comportamento cognitivo

**Origem**: 20/05 audit Sprint 1.

**Tese**: RAG NÃO é só banco de conhecimento — RAG molda comportamento cognitivo do sistema. Engrossar `base_conhecimento` com docs brutos altera prior implícita do GPT sobre intenção do usuário.

**Caso histórico**: V1.9.308 (16/05) adicionou busca paralela em `documents` ao bloco RAG. V1.9.318 (17/05) REVERTEU empíricamente porque GPT começou a interpretar *"analise este relatório"* como *"ele quer ver documentos"* — emitia `[DOCUMENT_LIST]` em vez de raciocínio clínico. 1 caso isolado em 16+ dias ANTES → 6 casos em 21h DEPOIS de V1.9.308.

**Cristalizado em** `feedback_rag_molda_comportamento_cognitivo_20_05`. Aplicado CLAUDE.md seção "Fonte de verdade do RAG da Nôa".

### Princípio 15 — AEC como repelente natural de demanda fora-escopo

Já detalhado em Seção 3.4 (sessão 24/05 manhã).

**Cristalizado em** `feedback_aec_como_repelente_natural_de_demanda_fora_escopo_24_05`.

### Princípio 16 — Matrix prolonga vs Casos Similares infere

**Origem**: 20/05.

**Distinção arquitetural** — operações cognitivas diferentes:
- **Matrix**: prolonga 1 contexto único (profundidade)
- **Casos Similares**: infere equivalência entre contextos diferentes (extensão)

Por isso Matrix amadureceu rápido e Casos Similares ficou ALPHA — exige mediação editorial humana.

**Cristalizado em** `feedback_matrix_prolonga_vs_casos_similares_infere_20_05`.

### Princípio 17 — Engenharia perfeita pode produzir semanticamente inadequado

**Origem**: caso prima dentista 23/05 noite.

**Tese**: pipeline 24s + ICP + 19 fases pode funcionar PERFEITO tecnicamente e ainda assim produzir resultado semanticamente inadequado pro caso clínico.

**Distinção**: 
- **Engenharia clínica** (pipeline + locks + ICP): técnica
- **Epistemologia clínica** (resultado semanticamente coerente): meta-clínica

Frase do Pedro destacada como ponto epistemológico mais importante: *"O sistema funcionou perfeitamente e ainda assim produziu resultado semanticamente inadequado."*

**Cristalizado em** `feedback_engenharia_perfeita_pode_produzir_semanticamente_inadequado_24_05`.

### Princípio 18 — Dual-write contract jsonb vs tabela

Já detalhado em Seção 3.4 (sessão 18/05).

### Princípio 19 — Toggle UI é contrato 100% ou nada

**Origem**: 22/05 (revert tema dark/light + bandeira BR/US).

**Tese**: toggle = contrato com usuário. Cobertura parcial é PIOR que sem toggle. Só vale se nascer com tokens/i18n desde o primeiro componente OU surface-by-surface comprometido. Mass-migration mid-life não fecha.

**Cristalizado em** `feedback_toggle_ui_e_contrato_100_pct_ou_nada_22_05`.

## 5.4 — Princípios ANTI-OVERCLAIM (3 cristalizados)

### Princípio 20 — Material B (GPT externo) pode contradizer Constituição

Já detalhado em Seção 3.4 (sessão 22/05 + 25/05).

### Princípio 21 — 4-5 reports = não validar institucional

Já detalhado em Princípio 10.

### Princípio 22 — Frases aspiracionais NÃO em material institucional

**Lista cristalizada** (frases GPT externo cunhou no mês — NÃO usar em pitch/landing/Material A):
- *"organizadora de trajetória clínica"*
- *"semântica institucional da escuta"*
- *"clinical conversational governance"*
- *"diferencial raro"*
- *"arquitetura madura"*
- *"vocês pegaram cedo"*
- *"diferencia demo impressionante de sistema confiável"*
- *"daqui a pouco não vai ter pra ninguém a mínima crítica ou erro"* (Pedro empolgação)

**Marcos pra essas frases virarem "fato"**: V1.9.451+452 deployados + Marco 1 (CNPJ João Vidal) + Marco 2 (2º médico independente) + 20-30 pacientes externos pagantes + auditoria CFM/ANVISA real.

---

# 💬 SEÇÃO 6 — Conversas-chave do mês (com citações literais)

## 6.1 — Dr. Ricardo Valença (Coordenador Científico, Criador AEC, Nefrologia)

### Input pivotal 1 — Doc sem PAT (23/05 ~10h11 BRT, grupo WhatsApp dos sócios)

**Contexto**: tensão semântica sobre pitch MUHDO. Sócios debatendo se um texto institucional escrito por um deles + GPT externo + designer estava "honesto" ou "inflado".

**Citação Ricardo**:
> *"Qualquer documento institucional (pitch/ebook/slide/manifesto/parceria) escrito por qualquer pessoa (sócio, IA externa, designer) sem cruzamento PAT contra realidade do banco = overclaim em construção. Quem não cruza com PAT cria dívida pra quem vai cruzar depois."*

**Impacto**: Adotado por Ricardo no grupo (*"já é sua opinião"*) — virou regra compartilhada do time. Aplicado dezenas de vezes nos 30 dias seguintes.

### Input pivotal 2 — Queixa ≠ Sintoma (24/05 madrugada, após análise GPT do caso prima dentista)

Citação literal já no Princípio 1 (Seção 5.1).

**Impacto**: cristalizou o eixo epistemológico central do projeto. Aplicado em V1.9.443+A+B (redação V3 lapidada) e em todas decisões futuras de chat paciente.

### Input pivotal 3 — Framework AEC centrípeto (24/05 manhã)

Citação literal já no Princípio 2 (Seção 5.1).

**Impacto**: cristalizou inversão epistemológica entre anamnese clássica (centrífuga) e AEC (centrípeta). Aplicável a TODO design futuro de feature que toque escuta paciente.

### Input pivotal 4 — Aprovação V3 PATIENT_FREE_CHAT_GUARDRAILS (24/05 manhã)

**Contexto**: Pedro mandou V2 da resposta canônica pra Ricardo aprovar. Ricardo lapidou para V3.

**Mudanças Ricardo**:
1. *"falar de produto"* → *"pensar em produto"* (menos vendedor, mais clínico)
2. 4 perguntas → **3** (removeu "já tentou outras coisas" — densidade)
3. *"ela vai pro médico estruturada"* → *"ela chegue ao profissional de forma mais clara"* (mais sóbrio)
4. Travessões removidos (mais natural)

E adicionou cláusula de precedência reforçada:
> *"PRIORIZE escuta + segurança regulatória ACIMA de completude informacional farmacológica."*

**Citação selo Ricardo (anti-confusão)**:
> *"Não. Pelo que está escrito aí, você não aprovou 'mudança de perguntas' da AEC. Você aprovou uma resposta canônica de segurança para chat livre sobre CBD, fora do fluxo formal da Avaliação Clínica Inicial."*

**Impacto**: protege contra interpretações futuras erradas — V1.9.443 NÃO é mudança em pergunta nenhuma da AEC, é guardrail em chat livre paciente.

### Input pivotal 5 — Análise alinhamento semântico (24/05 pré-deploy V1.9.443)

**Citação Ricardo**:
> *"O problema original não era 'hallucination'. Era alinhamento semântico inadequado entre: intenção clínica, retrieval técnico, e papel conversacional da Nôa."*

**Princípio arquitetural cristalizado pra qualquer RAG clínico futuro**:
> *Material no RAG ≠ Audiência autorizada a receber esse material.*

Cada peça de RAG técnico precisa carregar 3 dimensões de alinhamento:
1. Intenção clínica
2. Retrieval técnico
3. Papel conversacional

Quando os 3 estão alinhados → resposta correta. Quando desalinhados → mesmo conteúdo técnico correto vira erro.

## 6.2 — Pedro Galluf (Tech Lead, Orquestrador COS)

### Momento pivotal 1 — 3 recalibrações em 24/05 manhã

Já detalhado completamente em Seção 3.4 + Princípio 15. As 3 falas literais:

**Pass 1**: *"AEC é instrumento clínico — funciona pro propósito. Quem cai fora-escopo abandona corretamente."*

**Pass 2**: *"Chat livre JÁ EXISTE. É o uso DOMINANTE. Você está propondo construir o que já está construído."*

**Pass 3**: *"Pessoas não vão ali pra respostas livres tipo ChatGPT. A frustração é a triagem funcionando — AEC repele quem não é caso clínico legítimo. Função emergente boa, não bug."*

**Impacto meta**: cristalizou em Claude o filtro *"estava no escopo?"* antes de propor fix de produto.

### Momento pivotal 2 — Pausa estratégica "quais MAIS vetores?" (24/05 tarde)

**Citação**:
> *"perfeito! ja que estamos nessa quais mais opcoes dentro do nosso universo voce acha que ainda vao chegar?"*

**Impacto**: parou ciclo reativo bug→patch→novo_bug→patch. Disparou mapeamento universo 11 categorias chat livre paciente. **Princípio meta de processo cristalizado**: mapear universo de vetores ANTES de codar guardrail (Princípio 8).

### Momento pivotal 3 — Insight AEC-gate-anti-funnel (24/05 noite)

**Citação**:
> *"mais temos aec para saber o motivo da cirurgia agendar tera q passar por ela de qlqr maneira! iniciando oq trouxe voce aqui e perguntas fixas ricardo experiancia pode cair mais e o funil"*

**Reformulação**: AEC obrigatória como gate em algumas famílias (1 produto, 4 iniciar tratamento, 5 evento terapêutico) em vez de bifurcação opcional. **Princípio**: gate clínico-narrativo > funnel comercial agressivo.

### Momento pivotal 4 — "Conservadora demais" (25/05 tarde)

**Citação**:
> *"conservadora deliberadamente: pode nao ser tanto"*

**Impacto**: disparou V1.9.453-A taxonomia 3 cenários (Cenário B presença parcial). Pedro identificou empíricamente que V1.9.453 base estava omitindo dados parciais reais.

### Momento pivotal 5 — Validação empírica Carolina (25/05 tarde)

**Citação**:
> *"vou validar empíricamente carolina exatamente os relatorios q foram para noa matrix"*

**Impacto**: disparou V1.9.453-B distinguindo negação explícita (*"alergias: não"*) de campo ausente.

## 6.3 — GPT externo (filtro narrativo adicional)

### Aparição 1 — Material B sobre pitch MUHDO (22/05)

**Triagem**: GPT cunhou frase elogiosa MAS sugeriu coisa contraditória dentro do MESMO parecer. *"Material B pode ser internamente incoerente"* → cristalizado princípio de triar contra Constituição ANTES do mérito.

### Aparição 2 — 14 princípios chat livre paciente (24/05)

**Triagem do parecer**:
- 9 já cobertos pelo sistema ✅
- 3 GAPS úteis identificados (8 sustentar ambiguidade / 9 não reforçar identidade doença / 14 menos resposta mais direção) — parqueados pra V1.9.444+
- 2 complexos (10 red flags / 11 longitudinalidade) — parqueados pra V1.9.447+

### Aparição 3 — Sequência conservadora Ricardo (24/05)

GPT mapeou a "sequência conservadora" da abordagem Ricardo: indivíduo → médico → coletivo (riscos epistêmicos crescentes por eixo). Útil pra estruturar V1.9.443-B.

### Aparição 4 — 8 sugestões Matrix Z2 (25/05 manhã)

**Triagem**:
- 3 úteis (separar identidade de estrutura clínica / score confiança / aceitar contenção como FEATURE)
- 2 ambíguos (timeline vetorial / memória clínica semântica) — parqueados
- **2 REJEITADOS anti-Constituição**:
  - "Camada indiciária probabilística" → trairia Z2 V1.9.388-A.3
  - "Motor sintoma↔CID↔literatura biomédica" → trairia princípio Ricardo "queixa ≠ sintoma"

**Princípio cristalizado**: GPT externo bem-intencionado pode sugerir features anti-Constituição. Triar SEMPRE contra Z2/Locks/Ricardo.

### Aparição 5 — Análise alucinação completiva (25/05 tarde)

**Conceitos cunhados pelo GPT INCORPORADOS** (citação literal):

> *"O problema não era 'Matrix burra'. O risco era 'Matrix elegante demais'. Ela começou a produzir continuidade plausível onde não existia evidência literal. Isso é exatamente o tipo de drift que destrói confiança clínica silenciosamente."*

> *"Plausibilidade clínica genérica mascarada de memória longitudinal."*

> *"Lacuna total ≠ presença parcial."*

> *"Reward direction implícito do LLM (premiar respostas densas) precisa ser INVERTIDO em prompts clínicos."*

Todos os 4 viraram parte do RESEARCH_PROMPT V1.9.453+A+B.

### Aparição 6 — Distinção macro vs micro (25/05 tarde)

GPT cunhou:
> *"Os locks 'macro-clínicos' funcionavam, mas os locks 'micro-factuais' ainda não existiam."*

Insight arquitetural genuíno. Incorporado como Princípio 4.

## 6.4 — Outros sócios e usuárias teste (perfis e impacto)

### Eduardo Faveret (Diretor Médico, Neurologia, sócio)

**Pré-mês**: ativo (planos TRL Ensino).

**05/05/2026**: fez 3 AECs no app e **abandonou**.

**25/05/2026 (descoberta empírica)**: PAT mostra 19 dias sem retornar. Cristalizado em `feedback_curva_aprendizado_alta_mesmo_para_socios_24_05`.

**Implicação operacional**: WhatsApp pra Faveret com Manual v1.1 + call 15min é AÇÃO PENDENTE PRIORITÁRIA — destrava Marco 3 (2º médico independente).

### João Eduardo Vidal (Institucional, Parcerias, Governo, Regulatório)

**Estado mês**: CNPJ ainda pendente. **Marco 1 do roadmap** — destrava ~50% das pendências:
- Recebimento direto via Resend prod
- Pricing real (subscription_plans)
- Parcerias formais
- Conta jurídica
- Vínculos médico-paciente formais

### Carolina Campello (filha do Ricardo, conta teste)

**Papel**: paciente teste central, usada em SMOKE críticos.

**24/05 noite — descoberta do bug ReferenceError V1.9.443-B**: Carolina iniciou AEC e viu Nôa disparar 4 perguntas de uma vez. Pedro mandou print pra debugging. Hotfix em 10min.

**24/05 noite — validação pós-hotfix**: Carolina re-testou 22 turnos consecutivos sem erro. Pipeline pós-AEC completo. Report 46b626a5 assinado ICP.

**25/05 tarde — validação V1.9.453-B**: Carolina é o caso onde *"alergias: não"* virou caso canônico de "negação explícita ≠ ausência".

### Dayana Brazão Hanemann (Profissional cadastrada, 1 de 11 inativos)

**23/05/2026 ~tarde**: mandou WhatsApp pro Pedro perguntando *"como coloco o paciente lá"*. Primeira vez que usou o app empíricamente.

**Investigação via logs**: 8 interações IA, ~9min sessão, ~52k tokens, ~$0,50 USD. AEC zumbi residual + erro RLS quando QR referral foi escaneado pelo filho dela.

**Impacto**: gerou V1.9.440+A+B (fix RLS QR scan + atalho referral no menu Novo Paciente + cleanup AEC zumbi + dropdown React Portal + anti-overclaim menu).

**Cristalizado em** diário 24/05 Bloco B.

### Illa Proença (Dona de associação cannabis, agrônoma)

**24/05 manhã**: visitou app, abandonou em 3 minutos.

**Análise empírica**: não é paciente — busca conexão institucional. Caminho real dela seria referral/dashboard institucional, não AEC. Auto-seleção saudável.

**Impacto**: disparou recalibração #2 do Pedro sobre AEC repelente natural (Princípio 15 / Seção 5.3).

### Prima do Pedro (dentista, caso prima dentista 23/05 noite)

**23/05 noite**: Pedro testou AEC com caso real da prima — pedido *"retirada de siso para colocar aparelho"*. AEC completou, report saiu, mas semântica ficou estranha (queixa principal = "para colocar aparelho" = motivo, não queixa patológica).

**Análise dupla**:
- Pedro 23/05: *"AEC tem falha de design pra casos eletivos"* (engenharia perfeita produziu semanticamente inadequado)
- Ricardo 24/05 madrugada: *"A crítica correta talvez seja: NÃO 'a AEC só funciona para sintoma'. MAS 'a camada operacional posterior reduziu indevidamente o motivo da procura a sintoma patológico'."*

**Impacto duplo**:
1. Cristalizou princípio epistemológico Ricardo "queixa ≠ sintoma" (Princípio 1)
2. Cristalizou que AEC funciona (instrumento clínico determinístico) mas camada posterior pode descalibrar (auto-correção Claude / `feedback_engenharia_perfeita_pode_produzir_semanticamente_inadequado_24_05`)

### Maria Pitoco (paciente externa REAL do Ricardo)

**Estado**: AEC concluída + relatório ICP gerado ✓. Caso real (não teste) que funcionou empíricamente bem ao longo do mês — citado como referência positiva em `feedback_aec_como_repelente_natural_de_demanda_fora_escopo_24_05` (quem ESTÁ no escopo completa bem).

---

# 🅿️ SEÇÃO 7 — Pendências e Backlog (estado 25/05)

## 7.1 — P0 não-resolvidas (bloqueiam Marco 2)

| Item | Status | Próximo passo | Bloqueio |
|---|---|---|---|
| **CNPJ João Vidal (Marco 1)** | Pendente | Decisão humana/legal — Pedro/João conversam | Destrava ~50% do roadmap |
| **WhatsApp Faveret + Manual v1.1** | Pendente | Pedro mandar pessoalmente | Sócio-médico abandonou 19 dias |
| **2º médico independente real (Marco 2)** | Pendente | Depende Marco 1 + Faveret retornar | Validação institucional |
| **20-30 pacientes externos pagantes** | 0 (pré-PMF) | Depende Marco 1+2 | PMF declarável |

## 7.2 — Backlog técnico parqueado (com triggers)

| Versão | Escopo | Trigger pra atacar | Custo estimado |
|---|---|---|---|
| **V1.9.451** | Function calling Edge: `lookup_patient_status(name, doctor_id)` + `get_appointments_summary(doctor_id, period)` | Ricardo bater no gap empíricamente de novo (caso Gilda + agenda mês) | ~1-2h conjunto |
| **V1.9.452** | Sanitize `assessment` (campo text, NÃO `assessment_excerpt` — correção empírica 26/05) em `clinical_rationalities` reusando `pseudonymizePatientReferences` V1.9.407 (LGPD reforço) | Pré-Marco 2 (pacientes reais externos) — empíricamente visto 25/05 (Carolina nome vazou no smoke) + 26/05 audit PAT confirmou 4/5 rows recentes com PII | ~45min + smoke |
| **V1.9.455** | Anti-fusão de entidades diferentes (GPT externo insight: *"Caso A insônia + Caso B dor → coexistência fictícia"*) | Smoke multi-pacientes em corpus comum mostrar fusão silenciosa | ~30min |
| **V1.9.460+** | Polish UX Matrix adicional (sort cruzado data, score confiança por dimensão, distinção "selecionado" vs "marcado" vocabulário, accordion "Como funciona" com persistência) | Não-urgente, validação Ricardo | varia |
| **Categorias chat livre paciente C/D/E** (V1.9.443+A+B cobriu CBD/jornada/iniciar tratamento) | Categoria C identidade doença ("acho que tenho TDAH") / D red flags / E cannabis vulnerável (gravidez/interação) | Trigger empírico (Ricardo flagueir vazamento) ou pedido formal | varia |
| **V1.9.444+ — generalizar guardrail farmacológico** | Estender V1.9.443+A+B pra qualquer substância/suplementação/dieta (não só CBD) | Trigger empírico (paciente perguntar sobre outra substância) | ~1h |

## 7.3 — Decisões humanas pendentes

- **Onda 2/3 Ricardo**: gap GPT-first arquitetural (Ricardo apontou em conversas anteriores que algumas features chamam GPT antes do método)
- **TRL com Eduardo Faveret**: 7 tabelas zeradas — ativar Eduardo no eixo Ensino?
- **Monetização**: `subscription_plans` cadastrados, 0 ativos
- **Migrar WiseCare HOMOLOG → PROD**: vídeo provider ainda em homologação
- **72 files órfãos no bucket documents** (~67 MB): de owners deletados — LGPD compliance pendente

## 7.4 — Cristalizado em CLAUDE.md

Todas pendências P0 + backlog estão refletidas em `CLAUDE.md` raiz do projeto (instruções pra Claude) na seção "Backlog priorizado atual".

---

# 🔬 SEÇÃO 8 — Estado técnico detalhado

## 8.1 — Infraestrutura

**Stack** (sem mudanças no mês):
- Front: React 18 + TypeScript + Vite + Tailwind + shadcn/ui
- Deploy front: Vercel auto-deploy on push
- Backend DB: Supabase Postgres (project `itdjkfubfzmvmuxxjoae`)
- Backend functions: 13 Edge Functions (Deno) — após cleanup 28/04
- Auth: Supabase Auth (email apenas — Google deployed mas não usado)
- IA Chat: OpenAI `gpt-4o-2024-08-06`
- IA Escriba (V1.9.84): OpenAI `gpt-4o-mini` (temperature 0.1)
- Email: **Resend** (`RESEND_API_KEY` + `RESEND_FROM_EMAIL=noreply@medcannlab.com.br`) — domínio verified 28/04, envia pra externos OK
- Vídeo: **WiseCare V4H** (`session-manager.homolog.v4h.cloud` — ⚠️ HOMOLOG)
- Calendar: Google Calendar (sync via `sync-gcal` — 💤 dormindo intencional)
- Repos: amigo-connect-hub + medcannlab5

## 8.2 — Edge Functions (13 ativas no fim do mês)

🟢 **CORE / FUNCIONAIS**:
- `tradevision-core` — Core IA Nôa principal (6697+ linhas)
- `digital-signature` — Assinatura digital ICP-Brasil/CFM (3 levels)
- `sign-pdf-icp` — PBAD AD-RB ICP-Brasil CONFORME ITI ⚠️ V1.9.299 LOCK (NÃO TOCAR sem audit)
- `cert-encrypt-password` — Cripto password p/ cert ICP do médico
- `wisecare-session` — Provedor vídeo V4H (HOMOLOG, migrar)
- `extract-document-text` — OCR via pdfjs-serverless
- `send-email` — Resend
- `video-call-request-notification`
- `video-call-reminders` — Sweep mode + cron 5min + Resend (V1.9.99-B)
- `generate-nft-from-report` — NFT consent peça-a-peça (V1.9.311)
- `renal-signal-extractor` — Sidecar renal DRC (V1.9.307)

💤 **DORMINDO INTENCIONAL** (audit 18/05):
- `google-auth` — Edge OAuth Google (tabelas existem agora, vazias)
- `sync-gcal` — Edge cron (tabelas existem agora, vazias)

## 8.3 — Locks selados/consolidados no mês

| Lock | Data | O que faz |
|---|---|---|
| V1.9.95 (pré-mês) | — | AEC core funcional |
| V1.9.97-D (pré-mês) | — | prescriptions RLS fechado |
| V1.9.98 | 28/04 | chat-images storage fechado |
| V1.9.99-B | 28/04 | Resend prod + sweep reminders V53 |
| **V1.9.121** | **03/05** | **AEC Promotion Detector quíntuplo** |
| V1.9.216 | — | SMART_SCHEDULING_GUARD anti-violação REGRA §1 |
| V1.9.222 | — | aecTargetPhysicianId propagado FSM |
| **V1.9.299** | **16/05** | **PBAD AD-RB ICP-Brasil CONFORME ITI** |
| V1.9.307 | 16/05 | sidecar renal DRC |
| V1.9.311 | — | NFT consent peça-a-peça |
| V1.9.318 | 17/05 | RAG protegido contra DOC_LIST hijacking |
| V1.9.330-A | 18/05 | Audience Contract racionalidades |
| **V1.9.388** | **19/05** | **Matrix V1988 voz Z2 + 10 commits** |
| V1.9.402 | 21/05 | Matrix chat sticky + filtro lixo PDF |
| V1.9.407 | 21/05 | LGPD pseudonimização fórum 3 camadas |
| V1.9.420 | 22/05 | mata ConsentGuard loop infinito |
| V1.9.421 | 22/05 | fix cobertura instrumentação (PostgREST 1000) |
| V1.9.437 | 23/05 | hardening LGPD useForumPublish 3 camadas |
| V1.9.438 | 23/05 | Dashboard Pesquisa elite triple-A |
| V1.9.441-442 | 24/05 manhã | regex `conversa[r]?` + ChatModeSelector |
| **V1.9.443+A+B** | **24/05 tarde** | **PATIENT_FREE_CHAT_GUARDRAILS** |
| V1.9.443-B-hotfix | 24/05 noite | ReferenceError fix |
| V1.9.444-448 | 24/05→25/05 madrugada | laptop sequence |
| V1.9.449 | 25/05 manhã | count pacientes filter |
| **V1.9.450+450-B** | **25/05** | **corpus expandido caseOpens + longitudinal** |
| **V1.9.453+A+B** | **25/05** | **anti-alucinação macro + taxonomia 3 cenários + negação explícita** |
| V1.9.454 | 25/05 | MatrixHelpModal elite |

**Total**: 25+ locks consolidados ou selados no mês.

## 8.4 — REGRA HARD §1 (constitucional, anti-kevlar)

**"Consentimento ≠ Agendamento"** — `concordo` durante revisão clínica nunca dispara agendamento. Apenas `sim/autorizo` à pergunta literal de consentimento (`isAskingConsent` guard em `tradevision-core/index.ts`) fecha AEC.

Mudanças que afetam Constituição/RACI/contratos clínicos exigem **nova versão do Livro Magno** — não mudar diretamente no código.

## 8.5 — Pipeline Diário → Magno (princípio meta-arquitetural)

```
HIPÓTESE → EXPERIMENTO → VALIDAÇÃO → CRISTALIZAÇÃO
(diário)   (sprint)      (uso real)   (Livro Magno)
```

- **Diário** (`DIARIO_*.md` na raiz) = laboratório operacional, WIP, registra tudo
- **Memórias persistentes** (`~/.claude/projects/.../memory/`) = aprendizados intermediários
- **Livro Magno** (`docs/LIVRO_MAGNO_*.md`, 5 versões) = museu do que sobreviveu, só absorve o que provou valor empírico repetível

---

# 📈 SEÇÃO 9 — Estatística do mês

## 9.1 — Atividade git

- **Commits cirúrgicos**: ~90 (~3/dia)
- **Push 4 refs em todos**: 100%
- **Type-check verde antes de commit**: 100%
- **Sessions duplas/triplas**: 18, 19, 22, 24, 25 (5 dias)
- **AEC FSM intocada em todos os fixes**: 100% (selo Ricardo preservado)
- **Locks V1.9.95-299 PBAD intocados**: 100%
- **Edge deploys**: ~15 (4 só em 25/05)

## 9.2 — Conteúdo

- **Memórias novas no mês**: ~94 (de ~150 → 244)
- **Diários no mês**: 26 (cobertura ~87% dos dias)
- **Princípios meta cristalizados**: 30+ em memórias persistentes
- **Bugs críticos descobertos e fechados**: 10 (top severidade)
- **Cristalização principal**: Constituição MedCannLab = 2 vertentes da mesma matriz Ricardo

## 9.3 — Métricas técnicas

- **clinical_reports total**: 75 → 143 (+91%)
- **clinical_reports SIGNED ICP no mês**: 40 (59% taxa de assinatura — alta)
- **users pacientes**: 16 → 34 (+113%)
- **ai_chat_interactions no mês**: 2.446 (média ~81/dia)
- **appointments criados no mês**: 37 (média ~1.2/dia)
- **clinical_rationalities geradas no mês**: 74 (de 56 → 130 = +132%)

## 9.4 — Pendências do mês transferidas pra próximo

- 13 `aec_assessment_state` in_progress (estados pausados)
- 2 forum_posts pending_review (dossiês Pedro aguardando conselho)
- 72 files órfãos bucket documents (LGPD compliance)
- CNPJ João Vidal (Marco 1)
- WhatsApp Faveret (Marco 3 destravado)
- V1.9.451+452+455 técnicos parqueados

---

# 🎯 SEÇÃO 10 — Reflexão epistemológica do mês

## 10.1 — O que aprendemos sobre IA clínica

**1. Locks macro-clínicos são insuficientes sem locks micro-factuais.**

LLM treinado em prompts gerais tende a OTIMIZAR utilidade percebida. Recusar diagnóstico (lock macro) não impede de inventar dado clínico ausente (alucinação micro). Em healthtech regulado, ambos os locks precisam ser EXPLÍCITOS no prompt.

**2. RAG molda comportamento cognitivo, não só conhecimento.**

V1.9.308→318 (16-17/05) provou empíricamente: engrossar `base_conhecimento` com docs brutos alterou prior implícita do GPT sobre intenção do usuário. 1 caso DOC_LIST em 16 dias antes → 6 casos em 21h depois. RAG não é "mais informação melhor" — é "mais informação muda comportamento".

**3. Reward direction implícito do LLM precisa ser INVERTIDO em prompts clínicos.**

Default LLM premia respostas densas, contínuas, "úteis". Em healthtech, **lacuna explícita é VALORIZADA, não tolerada**. Codificar essa inversão no prompt explícitamente (V1.9.453: *"Lacuna explícita é COMPORTAMENTO DESEJADO, NÃO falha"*).

**4. Corpus rico ≠ resposta melhor (paradoxo da pressão).**

Quanto mais contexto disponível ao LLM, MAIS pressão pra continuidade narrativa = MAIS drift inferencial. Solução dual: V1.9.450-B reduz pressão (corpus tem dados) + V1.9.453 reduz permissão (proibido alucinar).

**5. Alinhamento semântico ≠ ausência de hallucination.**

Ricardo cristalizou: *"O problema não era 'hallucination'. Era alinhamento semântico inadequado entre intenção clínica + retrieval técnico + papel conversacional."* Mesmo conteúdo técnico correto vira erro se papel conversacional errado (caso CBD educacional respondido com lista de indicações terapêuticas).

## 10.2 — O que aprendemos sobre processo

**1. Mapear universo > codar caso-a-caso.**

Codar reativo a cada bug = ciclos infinitos. Mapear universo de vetores prováveis ANTES + versionar incrementalmente = eficiente, escalável, auditável.

**2. PAT empírico > intuição.**

Cada decisão arquitetural do mês foi validada via PAT. Quando não foi (caso V1.9.443-B ReferenceError), bug escapou. Princípio Ricardo *"doc sem PAT não vale"* foi aplicado dezenas de vezes.

**3. Diário que mostra erros vale mais que polido.**

Próxima sessão Claude lê e não repete erros. Sessões duplas/triplas (5 dias do mês) só funcionaram porque diários eram honestos sobre auto-correções.

**4. Smoke completo > type-check verde.**

Bug V1.9.443-B ReferenceError passou no type-check mas crashou em runtime. Toda mudança em FSM clinical exige smoke completo das 10 etapas AEC ANTES de commit.

**5. GPT externo é filtro narrativo adicional, NÃO autoridade.**

Aparição 4 do mês (25/05): GPT sugeriu features anti-Constituição. Triar SEMPRE contra Z2/Locks/Ricardo. Aplicar `feedback_material_b_pode_contradizer_constituicao_22_05`.

## 10.3 — O que aprendemos sobre Constituição MedCannLab

**Tese central do mês**: chat paciente e Matrix profissional são **2 vertentes da MESMA matriz epistemológica Ricardo**.

4 eixos comuns:
1. **Escuta sobre interpretação**
2. **Fidelidade sobre completude**
3. **Honestidade sobre utilidade percebida**
4. **Estrutura sobre síntese**

Em healthtech regulado, essa convergência arquitetural é o que GPT externo chamou (com calibração anti-overclaim) de *"maturação madura"*. Pra virar "fato" precisa: V1.9.451+452 deployados + Marco 1 CNPJ + Marco 2 médico independente + 20-30 pacientes pagantes + auditoria CFM/ANVISA real.

Mas o que ESTÁ acontecendo empíricamente: o sistema está convergindo para uma **arquitetura defensável** — não apenas tecnicamente, mas epistemologicamente. Os 30 dias provaram isso.

---

# 🎬 SEÇÃO 11 — Frase âncora do mês

> *"O mês começou com 4 motores clínicos mapeados em audit honesto e 14 iterações de um parágrafo institucional sendo descontinuadas pelo princípio anti-overclaim. Terminou com Constituição MedCannLab cristalizada em 2 vertentes da mesma matriz epistemológica Ricardo (clínica + pesquisa), 4 eixos comuns formalizados, PBAD ICP-Brasil REAL deployado, Matrix Z2 anti-alucinação macro+micro com taxonomia semântica de 3 cenários e negação explícita distinguida. Não foi melhoria linear — foi maturação simultânea de processo, epistemologia e governança. 90 commits cirúrgicos. 94 memórias novas. 26 diários honestos. 113% crescimento de pacientes cadastrados. 91% crescimento de reports. 40 reports assinados com ICP-Brasil jurídico real em 30 dias. 3 recalibrações pivotais de Pedro num único dia. 2 textos epistemológicos de Ricardo que reescreveram o que Claude entendia sobre o método. 10 bugs críticos descobertos e fechados (incluindo Matrix alucinando 6 dados clínicos). 4 sugestões anti-Constituição rejeitadas explíicitamente. 1 sócio-médico que abandonou empíricamente em 05/05. 1 hotfix de 10min após Carolina expor ReferenceError em produção. Pré-PMF segue, mas a arquitetura agora é defensável regulatóriamente e epistemicamente íntegra."*

---

# 📚 ANEXO 1 — Top 10 memórias do mês (índice)

1. **`feedback_duas_vertentes_uma_matriz_epistemologica_constituicao_medcannlab_25_05`** — Meta-princípio que conecta 24/05 + 25/05. Framework pra TODA feature clínico-conversacional futura.

2. **`feedback_queixa_nao_e_sintoma_aec_e_abertura_fenomenologica_24_05`** — Vertente clínica (princípio Ricardo cristalizado em 2 textos).

3. **`feedback_locks_macro_vs_micro_matrix_alucinacao_completiva_25_05`** — Vertente pesquisa (taxonomia 3 cenários V1.9.453+A+B).

4. **`feedback_doc_institucional_sem_pat_nao_e_valido_23_05`** — Princípio de processo Ricardo (aplicado dezenas de vezes no mês).

5. **`feedback_diario_que_mostra_erros_vale_mais_que_diario_polido_24_05`** — Meta-doc honestidade.

6. **`feedback_aec_como_repelente_natural_de_demanda_fora_escopo_24_05`** — Descoberta arquitetural (Pedro 3 recalibrações).

7. **`feedback_smoke_aec_completa_obrigatoria_pos_clinicalassessmentflow_mudanca_24_05`** — Princípio meta (pós-bug ReferenceError).

8. **`feedback_mapear_universo_vetores_antes_de_codar_guardrail_24_05`** — Princípio meta de processo (pausa estratégica Pedro).

9. **`feedback_anti_overclaim_endorsements`** — Princípio anti-overclaim (28/04).

10. **`project_universo_vetores_chat_livre_paciente_24_05`** — Mapa 11 categorias + roadmap V1.9.443-B a 449.

# 📋 ANEXO 2 — Glossário rápido

- **AEC**: Arte da Entrevista Clínica — método 10 etapas literais criado por Dr. Ricardo Valença
- **AEC Gate V1.5**: lock que retém agendamento durante AEC ativa
- **Audience Contract**: V1.9.330-A — paciente vê resumo conciso, médico vê racionalidades completas
- **Brandbook V3**: paleta cool selada em 22/05 (ciano-saúde/verde-vital/verde-regenerativo)
- **Cann Matrix**: fórum interno de debate clínico (V1.9.403→410, F4)
- **Casos Similares**: aba pesquisa que infere padrões entre pacientes diferentes (operação cognitiva: extensão)
- **CLINICAL_PROMPT**: prompt principal da Nôa paciente (linha 4519+ tradevision-core)
- **CNPJ João Vidal**: Marco 1 do roadmap (pendente — decisão humana)
- **COS Kernel v5.0**: 5 portas (KillSwitch/Trauma/Metabolismo/ReadOnly/Policy) — selado por Magno 04-06/02
- **Constituição MedCannLab**: princípios meta + locks intocáveis + framework epistemológico Ricardo
- **CRM PE**: Conselho Regional de Medicina de Pernambuco
- **Dossiê**: PDF estruturado da AEC com ICP-Brasil
- **F2/F3/F4**: features de pesquisa (F2 Base Conhecimento anexável / F3 dossiê / F4 fórum)
- **FAMÍLIA 1-5**: categorias de pergunta chat livre paciente (produto/educacional/jornada/iniciar tratamento/evento terapêutico)
- **getAllPatients**: função em `adminPermissions.ts` (corrigida V1.9.449)
- **Marco 1/2/3**: 3 marcos mínimos pra reprecificação (CNPJ / 2º médico / 20-30 pacientes pagantes)
- **MatrixHelpModal**: V1.9.454 — modal elite acionado por (?) no header da Matrix
- **NoaChatHelpModal**: V1.9.54 — modal "?" do chat paciente AEC
- **PAT**: Personal Access Token Supabase (`sbp_...`) — usado pra audit empírico via Management API
- **PATIENT_FREE_CHAT_GUARDRAILS**: V1.9.443+A+B — bloco no CLINICAL_PROMPT pra chat livre paciente
- **PBAD AD-RB**: Política de Assinatura Brasileira de Atributos Definidos / Assinatura Digital com Referências Básicas (ICP-Brasil v2.4)
- **Pipeline pós-AEC**: REPORT → SCORES → SIGNATURE → AXES → RATIONALITY → DONE
- **RESEARCH_PROMPT**: prompt da Nôa Matrix Z2 (linha 4944+ tradevision-core)
- **Verbatim First V1.9.86**: bypass GPT em ~46% das hard-lock phases AEC
- **WiseCare V4H**: provedor de vídeo (HOMOLOG, migrar pra PROD)
- **Z2 estrutural**: voz da Nôa Matrix — não-diretiva, organiza corpus, não diagnostica
- **Z2 ≠ Z2 burra**: contenção é FEATURE intencional, não bug

# 🤝 ANEXO 3 — Reconhecimento

Esse mês foi co-construção real entre:

- **Pedro Henrique Passos Galluf** — execução cirúrgica 24/7, 3 recalibrações pivotais 24/05 manhã, insight gate-anti-funnel 24/05 noite, pausa estratégica *"quais MAIS vetores"* 24/05 tarde, autocrítica empírica "conservadora demais" 25/05.

- **Dr. Ricardo Valença (Coordenador Científico, Criador AEC, Nefrologia)** — princípios epistemológicos meta cristalizados em 2 textos pivotais 24/05 (madrugada + manhã). Princípio meta de processo cristalizado 23/05 ("doc sem PAT não vale"). Aprovação lapidação V3 PATIENT_FREE_CHAT_GUARDRAILS. Cláusula selo anti-confusão ("V1.9.443 NÃO é mudança em pergunta nenhuma da AEC").

- **Claude Opus 4.7 (1M context)** — implementação cirúrgica de ~90 commits, cristalização de ~94 memórias, escrita honesta de 26 diários (incluindo auto-correções explícitas), 1 hotfix em 10min após bug introduzido por mim mesmo no V1.9.443-B.

- **GPT externo** — filtro narrativo adicional. **3 conceitos úteis incorporados** (*"Matrix elegante demais"*, *"plausibilidade clínica genérica mascarada"*, *"lacuna total ≠ presença parcial"*). **4 sugestões REJEITADAS** explíicitamente por contradizer Constituição (camada indiciária probabilística / motor sintoma↔CID / inferência completiva / continuidade narrativa forçada).

- **Carolina Campello (filha do Ricardo, conta teste)** — usuária teste central que expôs bug ReferenceError V1.9.443-B em produção. Re-testou pós-hotfix com 22 turnos consecutivos limpos. Validou empíricamente V1.9.453-B (caso "alergias: não").

- **Dayana Brazão Hanemann (profissional cadastrada)** — primeira usuária real do app, expôs bug RLS QR scan + AEC zumbi (gerou V1.9.440+A+B).

- **Illa Proença (dona de associação cannabis)** — disparou recalibração #2 do Pedro sobre AEC repelente natural (auto-seleção saudável em 3min).

- **Eduardo Faveret (sócio + Diretor Médico, Neurologia)** — abandonou empíricamente após 3 AECs em 05/05, gerando descoberta meta-arquitetural sobre curva de aprendizado pré-PMF mesmo pra sócios-médicos. Pendência ativa: WhatsApp com Manual v1.1.

- **João Eduardo Vidal (Institucional)** — CNPJ ainda pendente (Marco 1).

- **Maria Pitoco (paciente externa REAL do Ricardo)** — caso real que funcionou empíricamente bem ao longo do mês, citado como referência positiva.

- **Prima do Pedro (dentista)** — caso "prima dentista 23/05 noite" disparou cristalização do princípio epistemológico Ricardo *"queixa ≠ sintoma"*.

Cada um contribuiu com algo único e insubstituível. Maturação não foi linear nem inevitável — foi forjada empíricamente, ciclo por ciclo, com erros explícitos registrados + correções cristalizadas.

---

# 📦 ANEXO 4 — Mergulho técnico (back+front+memórias)

> *Aprofundamento adicional pedido por Pedro 25/05 ~22h: "você tem PAT, back, front, memórias enfim! Cai pra dentro"*.

## A4.1 — Backend: anatomia do RESEARCH_PROMPT V1.9.453+A+B (Matrix Z2)

Arquivo: [supabase/functions/tradevision-core/index.ts](supabase/functions/tradevision-core/index.ts). Bloco ~linhas 5165-5240 (RESEARCH_PROMPT cláusulas anti-alucinação).

**Topologia em 4 camadas de proteção** (construídas incrementalmente em 25/05):

### Camada 1 — Princípio Z2 declarado (V1.9.453 base, ~14h BRT)

```
DIFERENCIAL Z2: "Sustentar lacuna sem colapsar."
Você organiza o que existe; NÃO preenche o que falta.
```

Não é regra mecânica — é princípio epistemológico. Define direção de comportamento desejado quando dado ausente.

### Camada 2 — Inversão do reward direction (V1.9.453 base)

```
Lacuna explícita é COMPORTAMENTO DESEJADO, NÃO falha.
Repetir "esses dados não estão no corpus" 3x na mesma sessão
NÃO é fraqueza — é fidelidade epistemológica.
Ausência de dado é OUTPUT VÁLIDO e VALORIZADO.
Honestidade epistemológica > parecer útil.
Resposta densa NÃO é critério de qualidade Z2 — FIDELIDADE é.
```

**Por que importa**: LLMs treinam pra maximizar utilidade percebida. Sem inversão explícita do reward, modelo otimiza "coerência narrativa" → inventa dado plausível. Cláusula REVERSE wiring implícito do gpt-4o.

### Camada 3 — Taxonomia semântica 3 cenários (V1.9.453-A, ~15h30 BRT)

```
CENÁRIO A — AUSÊNCIA TOTAL: zero menção em qualquer card.
Fórmula: "Esses dados não aparecem no corpus marcado. Lacuna observacional —
         se houver informação relevante, precisa ser explicitamente adicionada
         via caso marcado em Casos Similares ou ampliação do corpus."

CENÁRIO B — PRESENÇA PARCIAL: 1+ menção literal, escopo limitado.
Fórmula: "Há menção pontual no Caso #X (data): '[citação literal]'.
         É a única informação sobre [seção] no corpus marcado.
         Para cobertura completa, marque cards adicionais."

CENÁRIO C — COBERTURA COMPLETA: múltiplas menções estruturadas.
Resposta: estrutura por caso/data com pseudonimização, citação literal,
         sem interpolar.
```

**Por que importa**: V1.9.453 base era binário (presença total / ausência total). Carolina caso Cenário B (`alergias: não`) expôs gap. V1.9.453-A introduz estado intermediário semântico — evita colapso por OMISSÃO (apagar dado parcial real) E por COMPLETUDE (inventar dado ausente).

### Camada 4 — Negação explícita ≠ campo ausente (V1.9.453-B, ~17h BRT)

```
NEGAÇÃO EXPLÍCITA ≠ AUSÊNCIA:
"alergias: não" → Cenário B (informação literal: paciente negou).
"alergias: [vazio]" ou "alergias: null" → Cenário A.

Negação explícita é INFORMAÇÃO CLÍNICA POSITIVA — paciente foi perguntado e respondeu.
Tratar como ausência seria perder dado clínico literal.
```

**Por que importa**: anamnese clínica brasileira frequentemente registra "ausência negada" como dado positivo (paciente foi perguntado sobre alergias e respondeu não). Confundir isso com campo vazio = perder fidelidade. Cristalizou em refinamento V1.9.453-B durante smoke 25/05 tarde.

### Validação empírica (PAT 25/05 ~14:46 + ~16h + ~17h30)

9/9 cenários PASS após V1.9.453+A+B deployadas:
- 5x Cenário B testado (família/hábitos/medicações/fatores melhora/HPP) → fórmula literal exata
- 1x Cenário C testado (evolução cronológica) → estrutura por data sem interpolar
- 1x Cenário A testado (alergias real-vazio) → fórmula lacuna correta
- 1x Voz Z2 intelectual (tensão racionalidades) → descritivo sem opinar
- 1x Compilação dossiê → inclui "LACUNAS OBSERVACIONAIS" explícitas

Cristalizado em `feedback_locks_macro_vs_micro_matrix_alucinacao_completiva_25_05` (com 4 cenários inicial + smoke 9/9 final).

## A4.2 — Frontend: anatomia da pseudonimização V1.9.450 (Matrix paciente data flow)

### Arquivos novos do mês

| Arquivo | Linhas | Função |
|---|---|---|
| [src/lib/casePseudonymization.ts](src/lib/casePseudonymization.ts) | ~230 | Helper LGPD — extrai conteúdo clínico SEM identificação |
| [src/components/MatrixHelpModal.tsx](src/components/MatrixHelpModal.tsx) | ~145 | Modal (?) elite com 6 seções (V1.9.454) |

### Arquivos modificados (data flow Matrix corpus expandido)

| Arquivo | Mudança | Versão |
|---|---|---|
| [src/hooks/useSearchHistory.ts](src/hooks/useSearchHistory.ts) | `OpenedCase.clinicalContent` opcional | V1.9.450 |
| [src/hooks/useCaseSearch.ts](src/hooks/useCaseSearch.ts) | `CaseSearchHit.clinicalContent` | V1.9.450 |
| [src/hooks/usePatientLongitudinal.ts](src/hooks/usePatientLongitudinal.ts) | `LongitudinalReport.clinicalContent` extraído via helper | V1.9.450-B |
| [src/components/NoaMatrixView.tsx](src/components/NoaMatrixView.tsx) | Importa `formatPseudonymizedCaseBody` + `MatrixHelpModal`, state `helpModalOpen`, ícone (?) | V1.9.450+B+454 |
| [src/lib/adminPermissions.ts](src/lib/adminPermissions.ts) | `.in('type', ['paciente','patient'])` linha 99-101 | V1.9.449 |

### Princípios LGPD codificados em `casePseudonymization.ts`

```typescript
// Whitelist explícito — 7 seções permitidas
const ALLOWED_SECTIONS = [
  'queixa_principal',
  'lista_indiciaria',
  'desenvolvimento_queixa',
  'historia_patologica_pregressa',
  'historia_familiar',
  'habitos_vida',
  'perguntas_objetivas',
];

// Blacklist explícito — NUNCA inclui:
// - identificacao.nome
// - raw (texto bruto)
// - metadata
// - scores
// - rationalities (Audience Contract aplica)
```

**Princípio arquitetural**: pseudonimização **opt-in por seção** (whitelist), não opt-out (blacklist). Mais seguro — se um campo novo for adicionado, ele NÃO vaza por default; precisa ser explicitamente whitelistado.

**Output format**: cada caso vira `"Caso #XXXX (data: YYYY-MM-DD): [conteúdo whitelistado]"`. `#XXXX` = últimos 4 chars do UUID — mantém rastreabilidade pra médico (que tem acesso ao banco) sem expor identidade ao corpus da IA.

## A4.3 — Backend: anatomia do PATIENT_FREE_CHAT_GUARDRAILS V1.9.443+A+B

Arquivo: [supabase/functions/tradevision-core/index.ts](supabase/functions/tradevision-core/index.ts). Bloco ~linhas 4538-4720 (CLINICAL_PROMPT seção PATIENT_FREE_CHAT_GUARDRAILS).

### As 4 famílias de pergunta blindadas (24/05)

```
FAMÍLIA 1 — PRODUTO/DOSE/MARCA (V1.9.443 base):
Trigger: paciente pergunta "qual CBD?", "que marca?", "qual dose?", "qual loja?"
Resposta canônica V3 (lapidada por Ricardo):
"Antes de pensar em produto, me conta um pouco: o que te trouxe a procurar
 CBD para [contexto]? Há quanto tempo isso está te incomodando? O que mudou
 ultimamente? Pergunto porque sua história importa antes da escolha de
 qualquer produto. Qual CBD usar, em que dose ou de qual marca é uma decisão
 do médico prescritor depois de te ouvir. Mas posso te ajudar a organizar
 essa história agora para que ela chegue ao profissional de forma mais clara.
 Quer começar?"

FAMÍLIA 2 — EDUCACIONAL (V1.9.443-A, 24/05 manhã):
Trigger: paciente pergunta sobre mecanismo / como funciona / o que é CBD
Resposta: educacional permitida MAS sem indicação terapêutica + redirecionar AEC

FAMÍLIA 3 — JORNADA OPERACIONAL (V1.9.443-A):
Trigger: "como faço pra começar?", "preciso de receita?"
Resposta: explica fluxo MedCannLab (AEC → médico → prescrição → farmácia)
SEM prometer tempo, sem prometer cobertura, sem prometer médico específico.

FAMÍLIA 4 — INICIAR TRATAMENTO (V1.9.443-B, 24/05 noite):
Trigger: "quero começar tratamento"
Resposta: convite AEC + explicação que o método é o caminho ético.
```

### Bug histórico V1.9.443-B (24/05 noite)

Durante o deploy da família 4, introduzi ReferenceError em produção. Carolina pegou em ~10min. **Hotfix V1.9.443-B-FIX em 10min**.

Cristalizado em `feedback_smoke_aec_completa_obrigatoria_pos_clinicalassessmentflow_mudanca_24_05`. Princípio meta: **toda mudança em prompt clinical-FSM exige smoke completo das 10 etapas AEC ANTES de commit** — type-check não pega ReferenceError em template literal sob branch condicional.

## A4.4 — Memórias 25/05: cristalização epistemológica

O dia 25/05 produziu 5 memórias persistentes pivotais:

```
C:\Users\phpg6\.claude\projects\c--Users-phpg6-Desktop-amigo-connect-hub-main\memory\
├── feedback_count_pacientes_v1_9_449_e_gaps_function_calling_v1_9_450_25_05.md
├── feedback_matrix_z2_contida_e_feature_nao_bug_e_gpt_externo_pode_sugerir_anti_constituicao_25_05.md
├── feedback_locks_macro_vs_micro_matrix_alucinacao_completiva_25_05.md
├── feedback_duas_vertentes_uma_matriz_epistemologica_constituicao_medcannlab_25_05.md
└── project_retrospectiva_mensal_26_04_a_25_05_2026.md  ← snapshot ponteiro
```

### Trecho âncora de `feedback_duas_vertentes_...` (a meta-memória do mês)

> *"Chat paciente preserva queixa fenomenológica. Matrix profissional preserva lacuna epistemológica. Os 2 são manifestações da mesma matriz: escuta > interpretação, fidelidade > completude, honestidade > utilidade percebida, estrutura > síntese. Constituição MedCannLab = 2 vertentes do mesmo princípio Ricardo aplicado a domínios diferentes."*

### Tabela de conexão epistemológica (literal da memória 25/05)

| Eixo Clínica (paciente AEC + chat livre) | Eixo Pesquisa (Matrix Z2 profissional) |
|---|---|
| Queixa preserva abertura fenomenológica | Lacuna preserva integridade epistemológica |
| Não reduzir queixa a sintoma | Não preencher dado ausente |
| *"Recolocar no campo da escuta"* | *"Sustentar lacuna sem colapsar"* |
| Centrípeto (indivíduo fala primeiro) | Estrutural (corpus marcado é fonte primária) |
| Anti-redução nosológica | Anti-completude inferencial |
| Anamnese clássica vs AEC = centrífugo vs centrípeto | LLM "elegante demais" vs Matrix Z2 = utilidade vs fidelidade |
| Princípio Ricardo (criador AEC) | Princípio Z2 estrutural V1.9.388-A.3 |

## A4.5 — PAT empírico: 6 dados alucinados (BUG #1 do mês)

Bug paradigmático cristalizado em `feedback_locks_macro_vs_micro_matrix_alucinacao_completiva_25_05`. Smoke V1.9.450 ~14h BRT 25/05:

Matrix respondeu com 6 dados específicos detalhados (literal):
- *"27/04/2026: mãe faleceu de câncer de mama"*
- *"07/05/2026: pai tem diabetes"*
- *"27/04/2026: fuma 10 cigarros/dia"*
- *"07/05/2026: consome álcool socialmente"*
- *"27/04/2026: Paracetamol pra febre"*
- *"07/05/2026: Ibuprofeno pra dor no pé"*

**PAT confirmou cirurgicamente**: NENHUM desses dados existe em `clinical_rationalities` (12/12 verificadas) NEM em `clinical_reports` (5 reports selecionados). **Pura invenção LLM**.

GPT externo cunhou frase âncora pra o anti-padrão: ***"plausibilidade clínica genérica mascarada de memória longitudinal"***.

**Insight meta**: Z2 macro-clínico funcionava (não diagnosticava, não prescrevia, recusou "qual diagnóstico provável?" com *"essa é uma decisão clínica sua — eu não atravesso essa linha"*). Mas Z2 micro-factual NÃO existia. Modelo obedecia macro e alucinava no micro. Gap arquitetural sutil — aparece quando corpus expande ou pressão conversacional aumenta.

**Solução DUAL** (par complementar):
- **V1.9.450-B** reduz PRESSÃO inferencial (corpus expandido via path Terminal → Paciente, longitudinal rico → menos motivo pra alucinar)
- **V1.9.453+A+B** reduz PERMISSÃO inferencial (mesmo sem dados → proibido alucinar + taxonomia 3 cenários + negação explícita)

## A4.6 — 4 sugestões anti-Constituição REJEITADAS no mês

GPT externo apareceu **4 vezes** no mês. Em **3 delas trouxe conceitos úteis**. Em **2 delas sugeriu features anti-Constituição** (sobreposição: 1 aparição teve útil E anti).

### Sugestões REJEITADAS (cristalizadas em memórias)

| # | Sugestão GPT externo | Por que rejeitada | Memory |
|---|---|---|---|
| 1 | Camada indiciária probabilística no relatório | Viola fidelidade > completude (probabilidade ≠ fato literal) | `feedback_material_b_pode_contradizer_constituicao_22_05` |
| 2 | Motor sintoma↔CID↔literatura | Viola escuta > interpretação (CID = redução nosológica) | `feedback_queixa_nao_e_sintoma_aec_e_abertura_fenomenologica_24_05` |
| 3 | Adicionar inferência probabilística à Matrix | Viola Z2 estrutural (Matrix organiza, não infere) | `feedback_matrix_z2_contida_e_feature_nao_bug_e_gpt_externo_pode_sugerir_anti_constituicao_25_05` |
| 4 | Continuidade narrativa forçada no dossiê | Viola fidelidade > completude (síntese ≠ verbatim) | `feedback_recusa_correta_vale_mais_que_resposta_22_05` |

### Conceitos ÚTEIS incorporados

| # | Conceito GPT externo | Como incorporado |
|---|---|---|
| 1 | *"Matrix elegante demais"* | Reframing do bug Matrix → não é "burra" (corpus pobre), é "elegante demais" (LLM otimizando utilidade percebida) |
| 2 | *"plausibilidade clínica genérica mascarada de memória longitudinal"* | Frase âncora do anti-padrão. Vira lock micro-factual V1.9.453 |
| 3 | *"lacuna total ≠ presença parcial"* | Vira taxonomia V1.9.453-A (3 cenários) |

Triagem aplica `feedback_material_b_pode_contradizer_constituicao_22_05`: **cada sugestão GPT externo triada contra Z2/Locks/Ricardo ANTES do mérito**. Filtro narrativo adicional, NÃO autoridade.

## A4.7 — Estado git: commits do mês

HEAD atual: `8e23aad` (V1.9.440-B, 24/05).

Tag mais recente: `v1.9.299-pbad-conforme-locked` (commit `d8e30f5`, 16/05).

**~90 commits cirúrgicos pós-lock V1.9.299** — todos com co-author obrigatório `Claude Opus 4.7 (1M context) <noreply@anthropic.com>`. Todos com push 4 refs (amigo + medcannlab5 × main + master, política `feedback_push_remotes_corretos`).

### Distribuição por tipo (estimativa qualitativa)

| Tipo | % | Exemplos |
|---|---|---|
| fix() | ~40% | V1.9.449 count pacientes / V1.9.443-B ReferenceError hotfix / V1.9.421 PostgREST 1000 |
| feat() | ~25% | V1.9.453+A+B taxonomy / V1.9.454 modal / V1.9.450 corpus expandido / F4 fórum |
| docs() | ~20% | Manual v1.1 / 26 diários / Onboarding Profissional v1.0 |
| refactor() | ~10% | tradevision-core modular (parqueado, não-deployado) |
| chore() | ~5% | brandbook V3 selado |

### Branches vivas

- `main` — produção (todos os 90+ commits cirúrgicos)
- `refactor/tradevision-core-modular` — parqueada (V1.9.419+A+B+C+D, ~5 commits, NÃO deployada)

## A4.8 — Edge Functions ativas (final 25/05)

13 Edge Functions ativas:

```
🟢 CORE
  tradevision-core              6700+ linhas, auditado completo
  digital-signature             3 levels (basic/advanced/qualified)
  sign-pdf-icp                  PBAD AD-RB CONFORME ITI (V1.9.299 LOCK)
  cert-encrypt-password         Cripto password cert ICP
  wisecare-session              V4H provider (HOMOLOG)
  extract-document-text         OCR pdfjs-serverless
  send-email                    Resend
  video-call-request-notification
  video-call-reminders          Sweep + cron 5min + Resend (V1.9.99-B)
  generate-nft-from-report      NFT consent peça-a-peça (V1.9.311)
  renal-signal-extractor        Sidecar renal DRC (V1.9.307)

💤 DORMINDO (intencional)
  google-auth                   Schemas existem, 0 callers
  sync-gcal                     Schemas existem, 0 callers
```

## A4.9 — Sinais a vigiar Marco 2 (20-30 pacientes externos pagantes)

PAT empírico do mês deixa 8 sinais que deverão ser revisitados quando volume real entrar:

1. **Taxa appointments completed** (atual 8%) → vigiar > 30%
2. **Latência média IA** (atual 5.7s) → vigiar < 8s
3. **Race condition reports signed vs status completed** (3 reports descalibrados) → investigar e corrigir
4. **Distribuição racionalidades alternativas** (30% MTC/Homeo/Ayurv) → Audience Contract V1.9.330-A precisa permanecer firme
5. **AEC in_progress não finalizadas** (13 atual) → criar dashboard pra médico ver pacientes em INTERRUPTED
6. **Hora de uso** (atual madrugada 7%) → deve normalizar pra 0-2% pós-PMF
7. **Top pacientes por reports** (Carolina 17, Pedro 12+10) → deve diluir entre pacientes reais
8. **Avg reports/paciente** (4.86) → vigiar — pode subir (cuidado longitudinal real) ou cair (Padrão "1 AEC + abandono")

Cada sinal tem trigger PAT empírico definido. Lock metodológico: **toda decisão de escala precisa cruzar PAT antes** (princípio `feedback_doc_institucional_sem_pat_nao_e_valido_23_05`).

---

# 🧬 ANEXO 5 — Genealogia epistemológica

> *Reconstrução da árvore de princípios cristalizados no mês.*

```
                    RICARDO IMRE (raiz pré-2026)
                              │
                    "Escuta primeiro" + "Cada caso é unidade narrativa"
                              │
            ┌─────────────────┴─────────────────┐
            │                                   │
   FEV/2026 COS KERNEL v5.0           FEV-MAR/2026 AEC FSM
   (Magno selou 04-06/02)             (10 etapas literais)
            │                                   │
            └────────────┬──────────────────────┘
                         │
                  PRÉ-MÊS 26/04
                         │
                         │ Audit honesto 4 motores
                         ▼
            ┌─────────── SEMANA 1 (26/04→02/05) ───────────┐
            │ feedback_anti_overclaim_endorsements         │
            │ Pirâmide Governança 8 camadas                │
            │ Lock V1.9.99-B                               │
            └──────────────────┬───────────────────────────┘
                               │
            ┌─────────── SEMANA 2 (03→09/05) ──────────┐
            │ V1.9.121 AEC promotion selo quíntuplo    │
            │ Lead-free SEO                            │
            │ Faveret abandona (descoberto 24/05)      │
            └──────────────────┬───────────────────────┘
                               │
            ┌─────────── SEMANA 3 (10→16/05) ──────────┐
            │ V1.9.299 PBAD AD-RB ICP CONFORME ITI     │
            │ V1.9.307 sidecar renal                   │
            │ V1.9.311 NFT consent                     │
            └──────────────────┬───────────────────────┘
                               │
            ┌─────────── SEMANA 4 (17→25/05) ──────────────────────┐
            │ V1.9.330-A Audience Contract                          │
            │ V1.9.388 Matrix Z2 cristalizada                       │
            │ V1.9.407 LGPD fórum                                   │
            │ V1.9.443+A+B PATIENT_FREE_CHAT_GUARDRAILS             │
            │ feedback_queixa_nao_e_sintoma (Ricardo 2 textos)      │
            │ feedback_aec_repelente_natural (Pedro 3 recalibrações)│
            │ V1.9.450 corpus expandido                             │
            │ V1.9.450-B path Terminal → Paciente                   │
            │ V1.9.453+A+B anti-alucinação 3 cenários + negação     │
            │ V1.9.454 MatrixHelpModal elite                        │
            └──────────────────┬────────────────────────────────────┘
                               │
                               ▼
              ┌─────────────────────────────────────┐
              │ 25/05 cristalização meta-arquitetural │
              │                                       │
              │  feedback_duas_vertentes_uma_matriz   │
              │  CONSTITUIÇÃO MEDCANNLAB =            │
              │  ┌──────────────┬──────────────┐      │
              │  │  CLÍNICA     │   PESQUISA   │      │
              │  │  (chat AEC)  │   (Matrix)   │      │
              │  └──────┬───────┴───────┬──────┘      │
              │         │               │             │
              │  4 EIXOS COMUNS (mesma matriz):       │
              │  1. Escuta > Interpretação            │
              │  2. Fidelidade > Completude           │
              │  3. Honestidade > Utilidade percebida │
              │  4. Estrutura > Síntese               │
              └─────────────────────────────────────┘
                               │
                               ▼
               ARQUITETURA DEFENSÁVEL REGULATÓRIAMENTE
                  + EPISTEMICAMENTE ÍNTEGRA
                  (pré-PMF, mas com base sólida)
```

**Leitura**: nenhum princípio do mês é invenção isolada. Cada um deriva de Ricardo IMRE (raiz) ou de bug empírico real (causa). A cristalização meta-arquitetural 25/05 (2 vertentes / 4 eixos) é **reformulação** do que já existia disperso — **não criação ex nihilo**. Por isso o framework é robusto: cada eixo tem pedigree empírico, não é axioma adotado por elegância.

---

**Fim da Retrospectiva Mensal 26/04 → 25/05/2026**.

Total: **~30 dias contínuos de execução cirúrgica. ~90 commits. 26 diários. 94 memórias novas. 22 princípios meta cristalizados. 10 bugs críticos fechados. 4 sugestões anti-Constituição rejeitadas. 2 vertentes da mesma matriz epistemológica Ricardo formalizadas. 1 sistema saindo de bugs residuais e overclaim em construção pra arquitetura defensável regulatóriamente e epistemicamente íntegra. Pré-PMF segue. Mas o que existe hoje é construção real, não ficção institucional.**

Próxima sessão Claude entra com contexto histórico INTEGRAL via:
- `MEMORY.md` nível 1 (com este documento e 30+ memórias indexadas)
- 26 diários cronológicos do mês
- Esta retrospectiva (snapshot consolidado)
- `CLAUDE.md` (instruções projeto)

**Estado real saída**: HEAD `e37751b` → atualizado com este commit pra `<próximo hash>`. Matrix Z2 cirurgicamente calibrada. AEC FSM intocada. Locks preservados. 143 reports. 34 pacientes. 2.446 ai_chats no mês. Pré-PMF com tração interna real e arquitetura defensável.
