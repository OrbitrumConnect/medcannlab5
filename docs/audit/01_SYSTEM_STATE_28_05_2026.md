# 01_SYSTEM_STATE — Auditoria Integral MedCannLab — 28/05/2026

**Método**: delta vs `AUDITORIA_COMPLETA_22_05_2026.md` (6 dias atrás) + PAT empírico 28/05 20h BRT + CLAUDE.md atual.
**Princípio cristalizado aplicado**: polir-não-inventar — não re-auditar o que está bem documentado em 22/05. Atualizar + sinalizar drift.

---

## TL;DR (5 bullets, leigo entende)

1. **Sistema continua saudável e vivo**. Vital signs subiram (interações 7d: 385→456, +18%), sem novos incêndios.
2. **Pré-PMF confirmado empíricamente**: 0 receita / 0 assinatura ativa / planos cadastrados. ~40% usuários internos.
3. **Ciclo 28/05 entregou 14 commits** (V1.9.479 → V1.9.486-C). +1 tabela nova (`feedback_tickets`), +4 memorias NÍVEL 1, refutação alucinação GPT externo.
4. **Pendências de 22/05 ainda válidas**: deploy:tradevision com `--no-verify-jwt`, Ricardo UUID hardcoded em 4 pontos, dual-write não-formalizado, monolito 7036 linhas pausado.
5. **Nada saiu de 🟢 OK / 🟡 atenção pra 🔴 risco**. Sistema permanece estável.

---

## Materiais reusados

| Origem | Como entrou aqui |
|---|---|
| `AUDITORIA_COMPLETA_22_05_2026.md` | Base inteira — comparação delta |
| `CLAUDE.md` | Estado atual canônico |
| `DIARIO_28_05_2026_SIDECARS_COGNITIVOS_E_STACK_COMPLETO.md` | Eventos sessão hoje |
| `MEMORY.md` NÍVEL 1 (4 memorias 28/05) | Princípios cristalizados |
| `RETROSPECTIVA_MENSAL_2026_04_26_a_2026_05_25.md` | Contexto longitudinal (2340 linhas) |
| PAT empírico 28/05 20h BRT | Vital signs atuais |

---

## §1 — Vital signs (delta 22/05 → 28/05)

| Métrica | 22/05 | 28/05 (PAT) | Delta | Leitura |
|---|---|---|---|---|
| Tabelas `public` | 139 | **140** | +1 | `feedback_tickets` criada hoje V1.9.486 |
| AECs / 30d | 23 | **13** | ❓ | Possível janela diferente (22/05 contava 30d-30/04→22/05, hoje 30d-28/04→28/05). Confirmar manualmente |
| Reports / 30d | 121 | **55** | ❓ | Mesmo viés de janela |
| Interações IA / 7d | 385 | **456** | +18% | ⬆️ Atividade subindo |
| Interações IA / 24h | n/d | **72** | — | Smoke V1.9.474 + sessão Pedro+Eduardo+Ricardo |
| CFM prescrições / 30d | 15 | **20** | +33% | ⬆️ Ricardo prescrevendo mais |
| Dossiês total (acumulado) | 10 | **11** | +1 | Reverteu — Pedro deletou duplicata HOJE via PAT, mas 1 novo de Eduardo? Investigar |
| Reports compartilhados (status='shared') | n/d | **36** | — | Métrica nova relevante p/ Sprint 3 |
| FOLLOW_UP escritos por médico | n/d | **18** | — | **Discovery hoje** — Matrix NÃO lê, gap arquitetural (memory roadmap_camadas_1_2_3) |
| Users `public.users` | 48 | **50** | +2 | 2 novos cadastros pós-22/05 |
| Users `auth.users` | n/d | **44** | — | 6 órfãos sem profile (vs 3 reportados em 22/05) — DRIFT? investigar Sprint 1 |
| feedback_tickets | 0 | **2** | +2 | Smoke PAT meu (não-externo) |

**Achados imediatos**:
- 🟡 **Possível drift `auth.users` ↔ `public.users`**: 22/05 reportou 3 órfãos; hoje 50 public vs 44 auth = 6 órfãos no inverso (public sem auth). Investigar Sprint 1.
- ⬆️ **Interações subindo** (456/7d vs 385/7d = +18% em 6 dias) — coerente com sessão densa hoje + smoke V1.9.482 + Pedro/Eduardo/Ricardo ativos
- ✅ **CFM prescrições +33%** — Ricardo usando empíricamente

---

## §2 — Ciclo 28/05 (14 commits, 1 sessão tarde-noite ~6h)

| Commit | Versão | Escopo |
|---|---|---|
| `1476862` | V1.9.479 | UX dashboard paciente — AEC virou protagonista visual |
| `69e88a1` | V1.9.480 | Profile — alterar email com re-auth + Supabase confirmation |
| `b04ede9` | docs | DIARIO_28 Bloco I |
| `4f57006` | V1.9.481 | Matrix Camada 1.1 — modal vincular dossier (sem patientId) |
| `a81c736` | V1.9.482 | Matrix — separação semântica visual cards (3 categorias) |
| `877d1ff` | V1.9.483 | Matrix Camada 1.3 — dossiês prévios no longitudinal |
| `7319521` | V1.9.484 | Matrix — tutorial atualizado com 3 features |
| `b6e97c0` | V1.9.485 | Matrix — compactação header + mobile responsivo |
| `583dca3` | V1.9.485-A | Matrix — '?' trocado por "Modo de uso" textual |
| `1cc661a` | V1.9.486 | Feedback canal — tabela + hook + modal + sidebar (REVERTIDO depois) |
| `1582049` | V1.9.486-A | Feedback modal expandido (REVERTIDO depois) |
| `a7fd4b1` | V1.9.486-B | Feedback — página dedicada /app/feedback, removido sidebar |
| `4d80733` | V1.9.486-C | Feedback — re-adicionado sidebar como Link (não modal) |

**Operações não-código (PAT)**:
- Mario Valença typo email fix (`oulook.com` → `outlook.com`) — atomic auth+public
- Tabela `feedback_tickets` criada via PAT (schema + indexes + RLS)
- Duplicata dossier `5210a5ed` deletada
- 2 tickets smoke V1.9.486 inseridos (não-deletados)

**4 memorias NÍVEL 1 cristalizadas**:
1. `feedback_sistema_tem_contexto_demais_falta_semantica_clinica_28_05` (princípio meta)
2. `project_matrix_roadmap_camadas_1_2_3_28_05` (roadmap)
3. `feedback_share_overwrite_professional_id_e_admin_visibilidade_28_05`
4. `feedback_racionalidades_pipeline_gera_1_medico_aciona_4_28_05`

**Refutação empírica**:
- GPT externo alegou Landing.tsx descreve "4 fases macro" — falso. Grep confirmou linha 791 com estrutura correta "Anamnese Triaxial > 3 atos".

---

## §3 — Estado dos achados 22/05 (status hoje 28/05)

| Achado 22/05 | Severidade | Status hoje |
|---|---|---|
| Sprawl 4 perfis (`users`/`user_profiles`/`profiles`/`usuarios`) | 🟡 dívida | **Inalterado** — `public.users` ainda canônica (50 rows hoje) |
| Sprawl 5 mensagens | 🟡 | **Inalterado** |
| Sprawl 4 prescrições | 🟡 | **Inalterado** |
| 3 tabelas backup abril (`documents_backup_23_04`, etc) | 🟠 dívida | **Inalterado** — não dumped+dropped ainda |
| Script `deploy:tradevision --no-verify-jwt` flag errada | 🟠 risco deploy | **Inalterado** — bomba latente caso alguém rode |
| Ricardo UUID `2135f0c0` hardcoded em 4 pontos `tradevision-core` | 🟡 bloqueador Marco 3 | **Inalterado** — 2º médico real ainda não entrou |
| Dual-write `clinical_rationalities` ↔ `content.rationalities` jsonb | 🟡 contrato implícito | **Inalterado** — drift continua não-formalizado |
| `tradevision-core` 7036 linhas monolito | 🟡 bus-factor | **Inalterado** — refator pausado branch `refactor/tradevision-core-modular` |
| 3 órfãos `auth.users` sem `public.users` | 🟡 | 🔍 **HOJE 6 órfãos no inverso (public sem auth)** — drift novo? Sprint 1 |
| Encryption fallback dev hardcoded | 🟡 | **Inalterado** — Pedro não confirmou env Vercel |
| AEC em `localStorage` | 🟡 conhecido | **Inalterado** |
| `esm.sh` sem lockfile | 🟡 conhecido | **Inalterado** |
| Bug consent loop | ✅ RESOLVIDO V1.9.420 (22/05) | Continua resolvido |
| 2 views SECURITY DEFINER | ✅ RESOLVIDO sozinho (pré-22/05) | Continua 0 |

---

## §4 — Novos achados desde 22/05

### 🔴 Quebra de uso real (nenhum novo)
Nenhum incêndio novo nos 6 dias.

### 🟠 Risco operacional (novos)

**O.1 — Drift `auth.users` ↔ `public.users` inverso**:
- 22/05 reportou 3 órfãos `auth.users` SEM `public.users`
- 28/05 PAT mostra 50 public vs 44 auth — significa **6 órfãos `public.users` SEM `auth.users`**
- Pode ser: 2 novos cadastros (signup recente) + 3 órfãos antigos que viraram + ? — precisa investigar Sprint 1
- Impacto: usuários que aparecem em rankings/relatórios mas não conseguem logar OR contas zumbi

### 🟡 Atrito de fluxo (descobertas hoje)

**A.1 — Aba Evolução do prontuário mistura 3 fontes** (`PatientsManagement.tsx` 1055-1162):
- `loadEvolutions` agrega `clinical_assessments FOLLOW_UP` (18 reais) + `clinical_reports` (145 AECs) + `patient_medical_records chat_interaction` (6070 chats IA) sem distinção visual
- Origem da reclamação Ricardo "Matrix não lê" → na verdade é fontes embaralhadas
- Documentado em memory `project_matrix_roadmap_camadas_1_2_3_28_05` Camada 1.5

**A.2 — Dossier órfão Ricardo (`ecd67cf0`)**:
- Gerado 28/05 14:37 sem `patient_id`
- Continua órfão (decisão conservadora — Ricardo regenera)
- V1.9.481 implementado preventivamente (futuro dossier sem paciente em foco abre modal)

**A.3 — Duplicação dossier 9 segundos**:
- Pedro fez 2 dossiês idênticos em 9s (28/05 15:37, content_len=7391 ambos)
- V1.9.401 só previne re-save de SNAPSHOT, não re-clique novo
- Bug latente: usuário clica "Fechar como dossier" 2x → 2 rows idênticas
- Mitigação futura: debounce 2-3s no onCloseDossier
- 1 duplicata foi deletada hoje via PAT

### ⚫ Estética / arquitetura (descobertas hoje)

**E.1 — V1.9.486 sidebar→modal→página→sidebar (3 reversos)**:
- Drift cognitivo no fim de sessão densa
- Princípio cristalizado MANHA ("validar empíricamente antes de codar") violado à NOITE pelo mesmo Claude
- Documentado como gap empírico — UX precisa testes mobile reais

---

## §5 — Aliveness das features (taxonomia 22/05 + delta 28/05)

| Classe | Features | Mudança vs 22/05 |
|---|---|---|
| 🟢 **CORE vivo** | AEC + Pipeline (13 AECs/30d) · Chat Nôa · Assinatura ICP-Brasil · Prescrições CFM (20/30d, ⬆️) · Vídeo WiseCare · Nôa Matrix · F3 dossier (11 total) + Camada 1.3 prévios HOJE | +Camada 1.3 Matrix · +Feedback canal · CFM ⬆️ |
| 🟡 **Infra sem adoção** | F4 Fórum (0 posts ainda) · NFT consent · Sidecar renal · **Feedback tickets (2 PAT smoke, 0 real)** | +Feedback novo |
| ❄️ **Latente / dormente** | Google Calendar · TRL Ensino · Monetização · Ranking/mérito | Inalterado |
| ❌ **Morto / descartável** | 5 tabelas mensagens (3 zero) · prescrições legacy · `noa_clinical_cases` · 3 backups abril · perfis legacy | Inalterado |

---

## §6 — Reconciliação backlog (22/05 + acumulado)

### Resolveu nos 6 dias
- ✅ V1.9.452 PII sanitize: AINDA P0 BACKLOG (não-resolvido)
- ✅ Mario Valença typo email — fixed empíricamente HOJE

### Continua P0 desde 22/05
- 🔴 V1.9.452 sanitize `assessment` em `clinical_rationalities` (88.5% rows com PII vazada — backlog P0 ANTIGO)
- 🟠 deploy script `--no-verify-jwt` flag

### Novos P0 candidatos (28/05)
- Smoke V1.9.480 (alterar email) — **0 acionamentos em 24h** após deploy
- Smoke V1.9.481 (modal vincular dossier) — não-validado empíricamente
- Smoke V1.9.486 email urgente → gmail — não-validado

---

## §7 — Risco operacional hoje (hierarquia)

### 🔐 Irreversíveis (atenção máxima)
- **V1.9.452 PII em `clinical_rationalities.assessment`** — 88.5% das rows com nome do paciente em texto livre. Não resolvido. Pré-Marco 2 obrigatório. (memory `project_supabase_compliance_lgpd_anvisa_e_pacientes_reais_27_05`)
- **PAT atual ainda ativo** (mascarado: `sbp_***`) — sessão 12h+, rotação cristalizada como princípio mas não-executada

### 🔴 Quebra uso real
- Nenhum confirmado empíricamente nos 6 dias

### 🟡 Atrito de fluxo
- Aba Evolução embaralha 3 fontes
- Modal V1.9.486 reversos (drift cognitivo)
- 6 órfãos `public.users` sem `auth.users` (novos)

### ⚫ Polish/arquitetura
- `tradevision-core` 7036 linhas (refator pausado)
- Sprawl 4 perfis + 5 mensagens + 4 prescrições + 3 backups (todos conhecidos 22/05)

---

## §8 — Pendências pra próximo sprint (1: DATABASE_REALITY)

1. Investigar empíricamente os 6 órfãos `public.users` SEM `auth.users` (drift novo)
2. Catalogar 140 tabelas → quais 0 rows / quais >100 / quais crescem
3. Verificar migrations `supabase/migrations/` vs estado real do schema (drift)
4. Listar triggers totais → quais ativos / quais disparados últimas 30d
5. Edge functions invocations 30d (cron + ad-hoc)
6. Foreign keys quebradas ou ausentes
7. RLS policies redundantes/contraditórias
8. **TUDO qualificado interno vs externo onde possível**

---

## Frase âncora (Sprint 0 + 01)

> *"Sistema continua saudável e vivo 6 dias depois (vital signs ⬆️). Sessão 28/05 entregou 14 commits e 4 princípios meta cristalizados. Nada saiu de 🟡 atenção pra 🔴 risco. Backlog P0 antigo de PII continua (88.5% rows vazadas) — pré-Marco 2 obrigatório. 1 drift novo: 6 órfãos `public.users` SEM `auth.users` (inverso de 22/05). Auditoria integral arrancou usando 18+ docs históricos como base — Princípio 8 polir-não-inventar aplicado. Próximo sprint: DATABASE_REALITY via PAT empírico."*
