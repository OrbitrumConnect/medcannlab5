# MAPA UNIFICADO — Bugs, Riscos e Ajustes Pendentes
**Data:** 04/05/2026 — pós-audit do bug Carolina (Ricardo testou)
**Status:** documentação para decisão pós-treino
**Princípio aplicado:** AUDITAR 100% antes de qualquer mudança

---

## 1. BUG NOVO IDENTIFICADO HOJE — Carolina state inconsistente

### 1.1 Sintoma reportado por Ricardo

> *"TEstei a avaliação clinica inicial como Carolina agora. Foi tudo certo, no final confirmei o agendamento e ela me levou para o agenda, quando confirmei. apareceu novamente iniciar avaliação clínica inicial."*

### 1.2 Audit empírico (Supabase)

```sql
-- aec_assessment_state da Carolina (1 único registro):
{
  id:              "abce92b0-5f75-44f3-9484-5f107808ef1d"
  user_id:         "5c98c123-83f9-4e66-9fb7-3f05a5431cc0"
  created_at:      "2026-04-23 12:45 BRT"
  invalidated_at:  "2026-04-25 10:41 BRT"  ← INVALIDADO há 9 dias
  invalidation_reason: "V1.9.57 retroativo: state phase=COMPLETED
                        mas is_complete=false (alguma fase não foi
                        marcada pelo FSM). Snapshot preservado em noa_logs."

  phase:           "FINAL_RECOMMENDATION"  ← ATUALIZADO HOJE 10:05
  is_complete:     true                    ← ATUALIZADO HOJE 10:05
  consent_given:   true                    ← ATUALIZADO HOJE 10:05
  last_update:     "2026-05-04 10:05 BRT"
}
```

### 1.3 Causa raiz (hipótese forte com 90% confiança)

**Loop arquitetural:**

```
1. State da Carolina existe há 9 dias, invalidado pelo V1.9.57
   (cold start guard limpa states inconsistentes pré-V1.9.57)

2. Hoje 10:05 — Ricardo testa como Carolina, dispara ASSESSMENT_START

3. ⚠️ FSM ATUALIZA registro invalidado (UPDATE sem filtrar invalidated_at):
   - phase:        COMPLETED → FINAL_RECOMMENDATION
   - is_complete:  false → true
   - consent_given: false → true
   - MAS invalidated_at PERMANECE de 25/04

4. AEC completa em runtime (state em memória), gera relatório, vai pra agenda

5. Ricardo agenda OK, volta pro chat

6. loadStateFromDB roda → filtra invalidated_at IS NULL (linha 200)
   → NÃO acha state ativo (único existente está invalidado)

7. FSM considera "paciente sem AEC ativa"
   → re-mostra botão "Iniciar Avaliação Clínica Inicial"
```

### 1.4 Conflito de design

```
Princípio V1.9.57:
  loadStateFromDB filtra invalidated_at IS NULL ✅
  ASSESSMENT_START deveria CREATE NEW ROW ✅

Realidade no código (a auditar):
  Algum path do FSM faz UPSERT sem filtrar invalidated_at
  State invalidado é "ressuscitado" mas continua marcado como invalido
  Próximo loadStateFromDB não acha → loop volta pro botão "Iniciar"
```

### 1.5 NÃO é regressão V1.9.122

Confirmado: V1.9.122 (CTAs no estado vazio) **NÃO afeta Carolina**:
- Carolina tem 31 reports
- Estado vazio só dispara se `reports.length === 0`
- Bug é em camada anterior (FSM/state) não em renderização do dashboard

---

## 2. CRUZAMENTO COM BUGS SIMILARES CONHECIDOS

### 2.1 Família: "Estados FSM inconsistentes"

| Bug | Memória | Sintoma | Causa raiz | Status |
|---|---|---|---|---|
| **Carolina state invalidado** | Este doc | "Iniciar Avaliação" volta após AEC completa | UPDATE em row invalidado | 🔴 Aberto hoje |
| **HPP transbordamento** | `project_aec_hpp_transbordamento_30_04.md` | Input "pneumonia, internado" capturado como PIORA | Transition entre fases tem 1 turno de atraso | 🟡 Aberto desde 30/04 |
| **AEC residual state V1.9.67** | `project_aec_residual_state_25_04.md` | Estado fantasma após refusal path | Refusal não invalidava cleanly | 🟢 Resolvido V1.9.67 |
| **AEC restart regex landmine** | `project_aec_restart_regex_landmine_26_04.md` | "agora" no relato disparava reset (Pedro Carolina) | Regex de operação confunde relato com comando | 🟢 Resolvido V1.9.77 |

**Padrão identificado:** todos relacionados a **timing entre intent → fase → state persist**. FSM tem hooks que fazem write antes do state estar coerente.

### 2.2 Família: "Substituição silenciosa de responsabilidade"

| Bug | Memória | Sintoma |
|---|---|---|
| **DOCTOR_RESOLUTION fallback** | `project_pipeline_observado_ao_vivo_28_04.md` | Sistema decide médico padrão sem médico real existir | 🟡 Aberto |
| **Carolina state ressuscitado** | Este doc | UPDATE silencioso em row invalidado (não notifica que era inválido) | 🔴 Aberto |

**Padrão identificado:** sistema toma decisão sem sinalizar que era zona ambígua. Princípio P10 (memória `feedback_p10_substituicao_silenciosa_responsabilidade`).

### 2.3 Família: "Anomalias não-bug que parecem bug"

| Anomalia | Memória | Realidade |
|---|---|---|
| 75 reports unsigned | `project_v1_9_115_reports_unsigned_resolvido` | Histórico pré-Pipeline (não bug) |
| invalidated_at órfão | `feedback_anomalia_nao_e_bug` | Erro V1.9.78/79 — eu inventei bug |
| 5 órfãos users vs profiles | Memória investigação | 11 reais, classificação errada |

**Padrão identificado:** auditar antes de criar fix. Princípio "AUDITAR 100% antes" da memória.

---

## 3. MAPA COMPLETO DE BUGS/RISCOS PENDENTES (priorizado)

### 🔴 P0 — Bugs funcionais ativos

| # | Item | Severidade | Esforço | Bloqueador |
|---|---|---|---|---|
| 1 | **Carolina state inconsistente** (UPDATE em invalidated_at) | Alta — afeta UX pós-AEC | Fix #1 (5min SQL) + Fix #3 (1-2h compensatório) | — |
| 2 | **DOCTOR_RESOLUTION fallback silencioso** | Média | ~2-3h auditar + corrigir | — |
| 3 | **HPP transbordamento AEC** (turno→fase 1 turno atraso) | Média | ~3-4h refatorar transition | — |
| 4 | **51% appointments cancelados** | Alta operacional | V1.9.123-A já em prod, medir 7-30 dias | Aguarda dado |
| 5 | **86% abandono AEC** | Alta clínica | V1.9.121 fases 0-2 (~3-5h) + 3-6 (~5h pós Ricardo) | Aguarda OK Ricardo visual |
| 12 | **saveAnalysisToReport falha p/ profissional não-admin** ✅ RESOLVIDO 04/05 17h | ALTA — feature racionalidades 100% quebrada | 5min CREATE POLICY | — |

### 🟢 P0 #12 — RESOLVIDO 04/05/2026 17h via Opção A

```
Sintoma reportado: Ricardo profissional (rrvalenca@gmail.com) tentou
   aplicar 5 racionalidades à Carolina (UUID 5c98c123). TODAS falharam:
   "Erro ao salvar análise no relatório: Object"
   "Persistência parcial — Verifique permissões (RLS)"

Causa raiz (audit empírico via PAT):
  Trigger trigger_assessment_score em clinical_reports UPDATE
    → register_assessment_score() é SECURITY INVOKER (prosecdef=false)
    → Faz INSERT em ai_assessment_scores com auth.uid() do usuário
  ai_assessment_scores tinha RLS habilitada MAS:
    • SELECT policy admin ✅
    • SELECT policy own ✅
    • INSERT policy ❌ AUSENTE
    • UPDATE policy ❌ AUSENTE
  Pipeline automático funcionava porque Edge Function usa service_role
  (bypassa RLS). Profissional via supabase-js ficava bloqueado.

Fix aplicado (Opção A — CREATE POLICY):
  CREATE POLICY "scores_insert_pro_admin"
  ON ai_assessment_scores FOR INSERT
  WITH CHECK (is_admin() OR EXISTS(SELECT 1 FROM users 
              WHERE id=auth.uid() AND type IN ('professional','profissional')))

Estado pós-fix:
  • BEFORE: 2 policies (apenas SELECT)
  • AFTER:  3 policies (+ scores_insert_pro_admin INSERT)
  • Padrão alinhado com clinical_rationalities/clinical_axes
  • ai_assessment_scores: 312 rows (sem mudança)
  • clinical_reports: 96 (sem mudança)
  • Smoke pendente: Ricardo testar nova racionalidade

Reversão (se necessário):
  DROP POLICY "scores_insert_pro_admin" ON ai_assessment_scores;

Princípios aplicados:
  • AUDITAR 100% antes (16 queries empíricas via PAT)
  • Polir não inventar (espelhou padrão existente)
  • Anti-regressão (snapshot BEFORE/AFTER, count check)
  • Zero código tocado, zero deploy
  • Cadeado V1.9.95+97+98+99-B intacto
```


### 🟡 P1 — Inconsistências de configuração

| # | Item | Risco | Esforço |
|---|---|---|---|
| 6 | **CLAUDE.md desatualizado** (split 90/10 vs banco 30/70) | Drift de futuras sessões | 5min |
| 7 | **3 planos legacy banco** (Med Cann 150/250/350) | Confusão futura | 5min DELETE pós-CNPJ |
| 8 | **R$350 hardcoded** em NoaConversationalInterface.tsx:494 | Bloqueia 2º médico | ~30min migrar pra `users.consultation_price` |
| 9 | **57% cadastros sem consent** (19/37 legacy pré-LGPD) | Possível investigar | Documentar (dado histórico, não bug) |
| 10 | **Tag git CLAUDE.md desatualizada** (`v1.9.113-locked` mas estamos em V1.9.123-A) | Drift documental | Atualizar pós-V1.9.123-A validado |
| 11 | **Input misto durante AEC** (João 04/05 16:47 BRT) | UX/possível regressão TTS ou avatar — relato "ouvindo leandro... ela fica vibrando" capturado em MEDICAL_HISTORY como dado clínico | Investigar com João + screenshot do que viu |

### 🟦 P1.1 — Achado de teste hoje (04/05 sessão Ricardo+João)

```
Sintoma: João (UUID c68fb133, jvbiocann@gmail.com) durante AEC ativa
         em fase MEDICAL_HISTORY, escreveu como input clínico:
         
         "eu aparece como ouvindo leandro aqui mas ela fica vibrando"
         
         (timestamp: 04/05/2026 16:47:35 BRT, log Supabase
          execution_id 065bd143-205f-4fb7-9105-0ab6caaba613)

Comportamento atual (correto pelo princípio AEC):
  • AEC capturou (escuta ativa — tudo é ouro)
  • Verbatim First processou normal
  • Salvo em interaction histórico

Risco lateral:
  • Conteúdo bizarro pode entrar no relatório clínico final
  • Escriba V1.9.84 + Cleanup V1.9.109 podem reorganizar OU não

Hipóteses de causa raiz (UX layer):
  A) Avatar TTS pronunciou nome errado (ex: "Leandro" no lugar do João)
  B) UI mostrou outro nome visualmente
  C) Botão de mic estava com animação contínua ("vibrando")
  D) Audio feedback loop (mic captando próprio TTS)

Próximo passo:
  • Pedir screenshot do João do que ele viu
  • Pedir reprodução em sessão controlada
  • NÃO mexer no Core/AEC (princípio: AEC = escuta ativa)
  • Se persistir: mapear via UI Devtools

Severidade: P1 (não bloqueia AEC, contamina relatório possivelmente)
Esforço: 30-60min audit UX
```


### 🟠 P2 — Half-implementations

| # | Item | Status | Decisão pendente |
|---|---|---|---|
| 11 | **google-auth Edge** | v16 deployed sem `professional_integrations` | Criar tabela OU desativar |
| 12 | **sync-gcal Edge** | v16 deployed sem `integration_jobs` + `professional_integrations` | Mesma decisão |
| 13 | **WiseCare V4H homolog** | URL homolog em produção | Migrar pra prod |
| 14 | **NFT $escutese** mock | Code mock, sem mint Polygon real | Pós-PMF + decisão sócios |

### 🔵 P3 — Pendências regulatórias/operacionais

| # | Item | Bloqueador real |
|---|---|---|
| 15 | **CNPJ não ativo** | João + 4 sócios + JUCERJA + Paulo |
| 16 | **Termo LGPD sem CNPJ formal** | Aguarda CNPJ + advogado |
| 17 | **Disclaimer clínico relatório AEC** | Aguarda revisão Ricardo + Eduardo |
| 18 | **Spec FAIL-CLOSED mode=anonymous** | Pré-requisito lead_free pós-CNPJ |
| 19 | **72 files órfãos bucket documents** | LGPD compliance — owners deletados |
| 20 | **chat-images bucket** já fechado V1.9.98 | ✅ resolvido |

### 🟢 P4 — Documentação selada (não-ações)

| Item | Doc | Status |
|---|---|---|
| Estratégia marca + CNPJ | `docs/ESTRATEGIA_MARCA_CNPJ_FINAL.md` | ✅ Selado |
| Framework parcerias | `docs/PARTNERSHIP_FRAMEWORK.md` | ✅ Selado |
| Mensagens advogado + Paulo | `docs/MENSAGEM_ADVOGADO_E_PAULO_04_05_2026.md` | ✅ Selado |
| Blueprint lead_free SEO | `docs/LEAD_FREE_SEO_BLUEPRINT_03_05_2026.md` | ✅ Selado |
| Diário 03/05 | `DIARIO_03_05_2026_LANDINGS_SEO_E_BLUEPRINT_LEAD_FREE.md` | ✅ Selado |

---

## 4. CATEGORIZAÇÃO POR FAMÍLIA (5 famílias estruturais)

### Família A — Bugs de FSM/timing (Carolina, HPP, restart regex)

**Padrão raiz:** transitions entre fases têm UPDATE em paths que não filtram invalidated_at OU têm 1 turno de delay entre intent detectado e state persistido.

**Fix estrutural ideal (V1.9.124+):**
- Garantir que ASSESSMENT_START sempre INSERT new row
- Trigger SQL: ao UPDATE em row com invalidated_at, ou rejeitar OU limpar invalidated_at
- Refactor transition pra ser síncrono (sem 1 turno de delay)

### Família B — Bugs de UX dashboard (CTAs estado vazio, refresh pós-agendamento)

**Padrão raiz:** estado do dashboard não recarrega quando AEC/agendamento finaliza (sem realtime listener específico).

**Fix estrutural ideal:**
- Hook `usePatientDashboard` reage a mudança em `aec_assessment_state.is_complete` via Supabase Realtime
- Reload automático pós ASSESSMENT_FINALIZED

### Família C — Substituição silenciosa de responsabilidade (DOCTOR_RESOLUTION, state ressuscitado)

**Padrão raiz:** sistema decide em zonas ambíguas sem sinalizar.

**Fix estrutural ideal:**
- Toda decisão fallback gera entry em `noa_logs.interaction_type='fallback_decision'` com payload do que foi decidido
- UI alerta admin quando frequência > X/dia

### Família D — Configuração desatualizada (CLAUDE.md, planos legacy, hardcoded values)

**Padrão raiz:** dados em múltiplas fontes sem single source of truth.

**Fix estrutural ideal (pós-PMF):**
- Landing.tsx puxa de `subscription_plans` (banco)
- `users.consultation_price` substitui hardcoded
- CLAUDE.md regenerado a partir de banco real (script)

### Família E — Pendências regulatórias bloqueadas por CNPJ

**Padrão raiz:** ativação plena depende de CNPJ + advogado + acordo quotistas.

**Não tem fix técnico:** depende de Paulo + 4 sócios + JUCERJA + INPI.

---

## 5. MAPA DE DEPENDÊNCIAS (o que destrava o quê)

```
CNPJ ativo
  ├─ destrava: Termo LGPD formal
  ├─ destrava: Lead_free anônimo (5 commits, ~21-26h)
  ├─ destrava: Marketplace 1Pure (broker classe 35)
  ├─ destrava: Stripe/MP Connect ativo
  ├─ destrava: INPI IMRE 3 classes
  └─ destrava: Cobrança taxa cancelamento <48h

OK Ricardo aprovar visual V1.9.121 fases 0-2 deployado
  └─ destrava: V1.9.121 fases 3-6 (extração + handler + telemetria)

V1.9.123-A em prod (DONE hoje)
  └─ destrava: medir efeito 24h/1h em cancelamento (7-30 dias)

Documentação selada (DONE)
  └─ destrava: envio mensagens advogado + Paulo

Pesquisa fair market value comissão farmacêutica
  └─ destrava: ata formal aprovação parceria 1Pure
```

---

## 6. RECOMENDAÇÃO DE ATAQUE PÓS-TREINO (ordem cirúrgica)

### Janela 1 — bugs ativos sem regressão (~2-3h)

```
1. Fix #1 Carolina (5min SQL) + auditar code path UPDATE invalidated_at (~1h)
2. Atualizar CLAUDE.md (split 30/70 + 37 users + V1.9.123 status) (~5min)
3. Aguardar smoke V1.9.123-A Maria Helena (passivo)
```

### Janela 2 — V1.9.121 fases 0-2 quando Ricardo OK (~3-5h)

```
1. Detector lógico "padrão AEC emergindo" (~1h)
2. UI hint visual (botão sem onClick) (~1h)
3. Deploy + Ricardo aprova visual em prod
4. Fases 3-6 ficam pra próxima janela (~5h)
```

### Janela 3 — quando CNPJ destravar

```
1. Termo LGPD final + advogado revisão
2. Cláusula partes relacionadas no acordo v2.0
3. Reunião 4 sócios + ata aprovação 1Pure
4. Migration 3 planos canônicos + cleanup legacy
5. Lead_free anônimo (5 commits)
6. R$350 → users.consultation_price
```

---

## 7. RISCOS NÃO-IDENTIFICADOS (provável que existam)

```
🟡 Bug similar em outros usuários teste/sócios
  → Pedro Paciente, joao eduardo, passosmir4 também têm states antigos
  → Pode haver mais ressuscitamentos invalidados se testarem novamente
  → Audit recomendado antes de Fix #2 estrutural

🟡 Reports gerados HOJE pela Carolina sem signature_hash
  → Pipeline pode ter falhado na finalização
  → Verificar `signed_at` do report novo

🟢 Smoke V1.9.123-A pode não disparar pra Maria Helena
  → Janela 24h cai amanhã 14-16h BRT
  → Se não disparar, problema em is_remote=true filter

🟢 Multi-fornecedor pode quebrar UX se 1Pure for único hoje
  → Frontend painel "Onde adquirir" precisa lidar com 0/1/N parceiros
```

---

## 8. PRINCÍPIOS APLICADOS NESTE MAPA

```
✅ AUDITAR 100% antes de qualquer mudança (memória)
✅ Polir não inventar (P8) — Fix #1 5min vs Fix #2 estrutural 4h
✅ Anomalia ≠ bug (memória feedback_anomalia_nao_e_bug) — confirmar antes de "consertar"
✅ P9 inverso — pré-PMF, não comprar proteção além do mínimo viável
✅ P10 — Substituição silenciosa de responsabilidade (DOCTOR_RESOLUTION + state ressuscitado)
✅ Princípio clínico destrutivo (memória) — invalidate ≠ DELETE
```

---

## 9. PRÓXIMA SESSÃO (disparadores)

Quando voltar do treino:
- [ ] Validar este mapa com Pedro
- [ ] Decidir: Fix #1 imediato ou aguardar próxima janela?
- [ ] Confirmar smoke V1.9.123-A passivo (Maria 05/05 14-16h BRT)
- [ ] Definir prioridade Janela 1 vs aguardar Ricardo OK pra V1.9.121

---

## 10. FRASE ÂNCORA

> *"Bug Carolina é da família 'state inconsistente' (mesma raiz do HPP transbordamento e do restart regex). Fix #1 cirúrgico (5min) resolve o caso visível. Fix #2 estrutural (~4h) resolve a classe inteira mas conflita com V1.9.121 — fica pra depois. P0 funcional ativo: Carolina + DOCTOR_RESOLUTION + 51% cancelamento (V1.9.123-A medindo) + 86% abandono (V1.9.121 atacando). P1-P3 são configuração + half-impl + pendências regulatórias dependentes do CNPJ. Documentado, sem inventar, sem mexer hoje."*
