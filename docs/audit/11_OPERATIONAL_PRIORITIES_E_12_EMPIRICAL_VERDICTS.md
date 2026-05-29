# 11_OPERATIONAL_PRIORITIES + 12_EMPIRICAL_VERDICTS — Consolidação Auditoria Integral — 29/05/2026

**Método**: consolidação dos Sprints 0-4 (00 + 01 + 03 + 04 + 05 + 09 + 02/08 + 06/07/10).
**Princípios**: hierarquia de risco cristalizada (🔐 > 🔴 > 🟡 > ⚫) + anti-overclaim aplicado.

---

## TL;DR (10 bullets — FRASE FINAL)

1. **Sistema saudável, vivo, pré-PMF**. Vital signs ⬆️ em 6 dias (interações IA +18%, prescrições CFM +33%).
2. **140 tabelas / 451 RLS policies / 14 Edges / 81 páginas / 50 users**. Arquitetura robusta + sprawl não-fatal (45% tabelas vazias).
3. **2 ACHADOS CRÍTICOS NOVOS**: `tradevision-core` verify_jwt flipou true→false em 6 dias (bomba 22/05 cumprida) + 8 órfãos `public.users` SEM `auth.users` (drift novo).
4. **87% reports INTERNOS**, **60% prescrições EXTERNAS**, **44% appointments cancelled**, **69% AECs interrupted** — funil empírico revela uso enviesado interno + drop-off alto.
5. **DRAFT MELHOROU**: prescrições 94%→79% draft em 6 dias (Ricardo assinou mais).
6. **Z2 preservado empíricamente** (smoke Matrix 28/05 PASS, disclaimer literal, anti-síntese, pseudonimização).
7. **Camada 2.3 plano terapêutico** = buraco arquitetural REAL não-resolvido (tabela vazia, UI nunca codada).
8. **3 perguntas Ricardo** destravam Camada 2 inteira do roadmap Matrix-Longitudinal.
9. **🔐 PII em `clinical_rationalities.assessment`** (88.5% rows) continua P0 não-mitigado.
10. **Marco 2 (1º paciente externo pagante) ainda ZERO** — toda essa arquitetura ainda sustentada por uso 87% interno.

---

## §1 — TOP 10 ações prioritárias próximos 30 dias

### 🔐 Irreversíveis (executar HOJE/AMANHÃ)
1. **Rotar PAT `sbp_cc2afa...`** (exposto via Push Protection log GitHub)
2. **Rotar 2 PATs `.claude/settings.local.json`** (no disco local Pedro)
3. **Corrigir script `deploy:tradevision`** removendo `--no-verify-jwt` flag (1 linha, restaura defesa em camadas)

### 🔴 Quebra uso real (executar próximos 7-14 dias)
4. **V1.9.452 PII sanitize** `clinical_rationalities.assessment` — backlog P0 28 dias atrasado. Pré-Marco 2 obrigatório.
5. **Camada 2.3 plano terapêutico** — decisão Ricardo: construir feature OR descontinuar tabela. Sem isso, Matrix Camada 2 fica bloqueada.
6. **UI gerir AECs interrupted** (9 órfãos) — Ricardo decisão retomar/cancelar/invalidar com motivo.
7. **Investigar 8 órfãos `public.users` sem `auth.users`** — 3 anonymized OK, 5 reais precisam triagem (incluindo João Vidal `joao.vidal@remederi.com`).

### 🟡 Atrito de fluxo (executar próximos 14-30 dias)
8. **Aba Evolução prontuário separar 3 fontes** (Camada 1.5) — FOLLOW_UP + AEC + chat_interaction com agrupamento semântico igual V1.9.482.
9. **Investigar drop-off appointments cancelled 44%** — sample qualitativo: quem cancelou? quando? por quê?
10. **Mandar 3 perguntas Ricardo** (rascunho entreguei sessão 28/05) — destravar Camada 1.2 + 1.4 + 2.3.

### ⚫ Polish (próximos 30-90 dias, pós-Marco 2)
- Drop ~10 tabelas safe (mensagens legacy + ai_chat_history + backups abril) após pg_dump
- Auditar 10/14 Edges sem confirmação auth interna manual
- Auditar RLS policies redundantes
- Auditar páginas frontend órfãs (`Home`, `Login`, `AdminAIGovernance`, etc)

---

## §2 — TOP 5 features candidatas a MATAR (após Marco 2)

| Feature | Tabelas envolvidas | Trigger morte |
|---|---|---|
| 1. **Legacy mensagens** | `global_chat_messages`, `messages`, `chat_sessions` (todas 0 rows) | Drop direto |
| 2. **AI legacy** | `ai_chat_history`, `ai_saved_documents`, `ai_scheduling_predictions` (0 rows) | Drop após dump |
| 3. **patient_prescriptions** | 0 rows, substituída por cfm_prescriptions | Drop |
| 4. **Backups abril** | `documents_backup_23_04_2026`, `clinical_reports_*_backup` | Dump + drop |
| 5. **`profiles` + `usuarios`** | Legacy órfãs (sprawl perfis ×4) | Migrar refs → `users` + drop |

**Total**: ~12 tabelas droppáveis após Marco 2 + pg_dump completo.

---

## §3 — TOP 5 features pra MANTER (uso real + valor)

1. **AEC + Pipeline** (núcleo CORE, 13 AECs / 30d, smoke 28/05 PASS)
2. **CFM Prescrições** (52 rows total, +7 em 6 dias, 60% externas) — único componente com adoção EXTERNA dominante
3. **Nôa Matrix + F3 dossier** (11 dossiês total, V1.9.481+482+483 entregues 28/05)
4. **Assinatura digital ICP-Brasil PBAD AD-RB** (V1.9.299 lock + V1.9.457 auth) — diferencial regulatório
5. **WiseCare vídeo** (134 sessions, ainda homolog — migrar pra produção)

---

## §4 — Vereditos por dimensão

### Saúde técnica: 🟢 SAUDÁVEL
- 140 tabelas com RLS 100% (cobertura universal)
- 14 Edges ativas + auth interna manual onde gateway flag está off
- Type-check verde em 15 commits hoje
- Push 4 refs OK em 15 commits

### Saúde clínica: 🟢 PRESERVADA (com vigilância)
- Z2 empíricamente preservado em smoke 28/05
- Verbatim First V1.9.86 ativo (~46% bypass)
- AEC Gate V1.5 ativo (REGRA HARD §1 preservada em smoke 28/05)
- Lock V1.9.388-A.3 (institucional) ativo
- 🟡 vigília: bulas ANVISA + sidecars + racionalidades — mitigações cristalizadas

### Saúde regulatória: 🟡 MELHORÁVEL
- 🟢 RLS universal + buckets privados (exceto avatar)
- 🟢 PBAD AD-RB CONFORME ITI (V1.9.299)
- 🔐 PII em `clinical_rationalities.assessment` (88.5% rows) — P0 não-mitigado
- 🟠 PATs no disco local (não-vazaram mas rotação pendente)
- 🟡 Compliance Supabase: 65% maturidade (memory 27/05) — região us-east-1 + PITR off + pgaudit ausente

### Saúde de fluxo: 🟡 ATENÇÃO
- 79% prescrições draft (melhorou mas alto)
- 44% appointments cancelled (preocupante)
- 69% AECs interrupted sem UI gerir
- Mas: CFM prescrições EXTERNAS = 60% (Ricardo prescrevendo real)

### Saúde filosófica: 🟢 COERENTE
- Norte Ricardo respeitado ("AEC porta + prontuário memória viva + Matrix lente reflexiva")
- Babylon/Watson/Olive patterns evitados em decisões deliberadas
- V1.9.486 sidebar reverso 3x = drift cognitivo fim sessão, auto-correção empírica via Pedro
- Camada 3 (modelar médico) vetada institucionalmente

---

## §5 — Pergunta brutal: O que o MedCannLab É hoje?

**Empíricamente, em 29/05/2026, NÃO em intenção**:

✅ **É** — pipeline clínico AEC + IA Z2 + assinatura ICP-Brasil + Matrix Pesquisa
✅ **É** — workspace digital de 1 médico nefrologista (Ricardo) com 1 paciente externo real (Maria Pinto) + ~5 contatos externos
✅ **É** — arquitetura epistemológica longitudinal pronta esperando escala (Marco 2)
✅ **É** — laboratório de cristalização de princípios (4 memorias NÍVEL 1 só em 28/05)

🟡 **É parcialmente** — prontuário longitudinal (apenas Carolina + Pedro #6ACF têm > 25 eventos; demais ~5)

❌ **NÃO É** — sistema operacional clínico-longitudinal (overclaim — frase de marketing)
❌ **NÃO É** — plataforma de ensino TRL (eixo dormente)
❌ **NÃO É** — comunidade fórum (infra 0 adoção)
❌ **NÃO É** — produto comercial PMF (0 receita, pré-PMF)

### Frase honesta final
> *"MedCannLab é hoje um pipeline clínico AEC + IA estruturadora Z2 + assinatura ICP-Brasil maduro, sustentado por uso 87% interno (sócios+amigos teste) e 1 paciente externo real confirmado (Maria Pinto Pitoco). Arquitetura epistemológica pronta esperando Marco 2 (20-30 externos pagantes). Norte filosófico Ricardo preservado. Drift técnico mínimo nos últimos 6 dias (1 bomba latente cumprida: verify_jwt flipado). PII P0 não-mitigado há 28d é único bloqueador imediato pra escala. Próximo evento crítico: CNPJ destravar (Marco 1 João Vidal) → Pro plan Supabase + DPO + advogado especialista → Marco 2 paciente externo real."*

---

## §6 — Recomendação operacional final

### Hoje/amanhã (urgência)
1. Rotar 3 PATs
2. Corrigir script `deploy:tradevision`
3. Mandar 3 perguntas Ricardo

### Próximos 14 dias (P0)
1. V1.9.452 PII sanitize
2. Decisão Ricardo Camada 2.3 plano terapêutico
3. UI gerir AECs interrupted

### Próximos 30 dias (P1)
1. Camada 1.5 aba Evolução separar 3 fontes
2. Migrar WiseCare homolog → produção
3. Cleanup `public.users` órfãos (5 reais)

### Próximos 60-90 dias (pós-Marco 2)
1. Drop ~12 tabelas safe (pós pg_dump)
2. Auditoria expandida 10/14 Edges auth interna
3. Compliance Supabase: Pro plan + PITR + pgaudit + região sa-east-1 (se ANVISA pedir)

---

## §7 — Sucesso da Auditoria Integral

**Sprints completados 28/05 → 29/05** (1 sessão tarde-noite densa):
- ✅ Sprint 0: catálogo materiais + state + plano (3 docs)
- ✅ Sprint 1: 03_DATABASE_REALITY + 09_UNUSED_ARCHITECTURE (2 docs)
- ✅ Sprint 2: 04_FRONTEND_ROUTE_MAP + 05_SECURITY_AND_SECRETS (2 docs)
- ✅ Sprint 3: 02_REAL_USER_FLOWS + 08_DRAFT_DROP_OFF (combinado, 1 doc)
- ✅ Sprint 4: 06_CLINICAL + 07_LONGITUDINALITY + 10_PHILOSOPHICAL (combinado, 1 doc + coleta evidências, Ricardo destrava parte interpretativa)
- ✅ Sprint 5: 11_PRIORITIES + 12_VERDICTS (este doc)

**Total**: 9 documentos em `docs/audit/` cobrindo 12 escopos propostos pelo GPT externo.

**Custo real**: ~3-4h (não ~17-23h estimados originalmente) — graças a reuso massivo de 18 auditorias históricas + retrospectiva 2340 linhas + PAT empírico direto.

**Economia comprovada**: ~70% via princípio cristalizado polir-não-inventar.

---

## §8 — Próxima auditoria (gatilho)

**Trigger**: Marco 2 materializado (1º paciente externo pagante) OR 60 dias (29/07/2026).

**Escopo nova**:
- Comparar funil empírico ANTES vs DEPOIS Marco 2
- Validar V1.9.452 PII resolvido
- Re-auditar AEC drop-off com base externa
- Decisão MATAR ~12 tabelas (drop com pg_dump)
- Re-validar verify_jwt em todas as Edges
