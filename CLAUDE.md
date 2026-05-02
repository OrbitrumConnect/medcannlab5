# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project identity

**MedCannLab 3.0** — HealthTech/EdTech de Cannabis Medicinal com IA Nôa Esperança. Arquitetura por 3 eixos: **Clínica** (AEC + Relatório + Agendamento), **Ensino** (cursos + TRL), **Pesquisa** (forum + casos clínicos). Sistema cognitivo de 8 camadas onde **GPT é o último a falar e o primeiro a ser checado**.

**Estado atual** (02/05/2026): **Lock V1.9.95+V1.9.97+V1.9.98+V1.9.99-B** em AEC + Pipeline + Agendamento + Resend prod + Storage RLS. Tag git mais recente: `v1.9.113-locked` (selo AEC + Pipeline + Analisar Paciente estável). Tag anterior: `v1.9.99-resend-prod-locked`. Pré-PMF (zero pacientes externos pagantes; testes internos com Pedro/Dr. Ricardo/Carolina).

## Common commands

```bash
# Dev local
npm run dev              # Vite porta 3001
npm run build            # ⚠️ quebra local por dompurify ausente; Vercel passa
npm run type-check       # tsc --noEmit (use isso pra validar mudanças)
npm run lint             # eslint
npm run lint:fix
npm test                 # Vitest com coverage
npm run test:watch
npm run test:integration

# Deploy Edge Function (Supabase CLI)
npx supabase functions deploy <slug> --project-ref itdjkfubfzmvmuxxjoae --no-verify-jwt

# Push dual-remote (POLÍTICA OBRIGATÓRIA — sempre 4 refs)
git push hub HEAD:main && git push hub HEAD:master && \
  git push origin HEAD:main && git push origin HEAD:master

# Supabase Management API (queries SQL)
curl -X POST "https://api.supabase.com/v1/projects/itdjkfubfzmvmuxxjoae/database/query" \
  -H "Authorization: Bearer <PAT>" \
  -H "Content-Type: application/json" \
  -d '{"query":"SQL_AQUI"}'
```

## Pirâmide de governança (8 camadas — leia antes de mexer no Core)

```
0. REGRA HARD §1 (constitucional)        "Consentimento ≠ Agendamento" — anti-kevlar §1
1. COS KERNEL v5.0 (cos_engine.ts*)      5 portas: KillSwitch/Trauma/Metabolismo/ReadOnly/Policy
2. AEC FSM (clinicalAssessmentFlow.ts)   13+ fases determinísticas
3. VERBATIM FIRST (V1.9.86)              ~46% bypass GPT em hard-lock phases
4. AEC GATE V1.5 (V1.9.95-A reforçado)   Bloqueia agendamento durante AEC ativa
5. GPT-4o-2024-08-06 / gpt-4o-mini       Só chamado se nada acima resolveu
6. PÓS-PROCESSAMENTO                     Strip tokens, validate UUID, force tags pós-AEC
7. PIPELINE ORCHESTRATOR                 REPORT→SCORES→SIGNATURE→AXES→RATIONALITY→DONE
```

*Discrepância conhecida: `cos_engine.ts` diz "v1.0" mas Magno selou v5.0 em 04-06/02/2026. É v5.0.*

## Stack

| Camada | Tecnologia |
|---|---|
| Front | React 18 + TypeScript + Vite + Tailwind + shadcn/ui |
| Front deploy | Vercel auto-deploy on push |
| Backend DB | Supabase Postgres (project `itdjkfubfzmvmuxxjoae`) |
| Backend functions | 10 Supabase Edge Functions (Deno) — após cleanup 28/04 |
| Auth | Supabase Auth (email apenas — Google deployed mas não usado) |
| IA Chat | OpenAI `gpt-4o-2024-08-06` |
| IA Escriba (V1.9.84) | OpenAI `gpt-4o-mini` (temperature 0.1) |
| Email | **Resend** (`RESEND_API_KEY` + `RESEND_FROM_EMAIL=noreply@medcannlab.com.br`) — domínio verified 28/04, envia pra externos OK |
| Vídeo | **WiseCare V4H** (`session-manager.homolog.v4h.cloud` — ⚠️ HOMOLOG) |
| Calendar | Google Calendar (sync via `sync-gcal` — ⚠️ half-impl) |
| Origem histórica | App nasceu na **Lovable** (no-code), CORS de send-email permite `*.lovable.app` |
| Repos | hub (`amigo-connect-hub`) + origin (`medcannlab5`) |

## Edge Functions (11)

```
🟢 FUNCIONAIS (7)
  tradevision-core (v302)        Core IA Nôa principal — auditado completo
  digital-signature (v52)         Assinatura digital ICP-Brasil/CFM (3 levels)
  wisecare-session (v68)          Provedor vídeo V4H (HOMOLOG, migrar)
  extract-document-text (v49)     OCR via pdfjs-serverless
  send-email (v46)                Resend
  video-call-request-notification (v49)
  get_chat_history (v6)

🟢 RESCATADA — V1.9.99 (28/04 ~14h30)
  video-call-reminders (v3)       ← reescrita elite sweep mode + cron 5min + Resend
                                    + idempotência via 3 colunas em appointments

🔴 HALF-IMPLEMENTED — Edge Function deployed mas tabela ausente
  google-auth (v16)               ← falta professional_integrations
  sync-gcal (v16)                 ← faltam integration_jobs + professional_integrations
```

*Cleanup 28/04 ~10h45*: Edge `video-call-request-notification-` (v23, duplicata com hífen) **deletada**. Backup em `.backups/`. Trigger duplicado `trg_handle_new_auth_user` em auth.users **dropado**. Edge `video-call-reminders` v52 deletada (P9 erro de processo) → reintroduzida elite v53/v3 às ~14h30 com sweep mode + cron + Resend (4 smoke tests passaram). Total: **10 Edge Functions ativas**, 5 triggers em auth.users.

## REGRA HARD §1 (constitucional, anti-kevlar)

**"Consentimento ≠ Agendamento"** — `concordo` durante revisão clínica nunca dispara agendamento. Apenas `sim/autorizo` à pergunta literal de consentimento (`isAskingConsent` guard em `tradevision-core/index.ts`) fecha AEC.

Mudanças que afetam Constituição/RACI/contratos clínicos exigem **nova versão do Livro Magno** — não mudar diretamente no código.

## Pipeline Diário → Magno (princípio meta-arquitetural)

```
HIPÓTESE → EXPERIMENTO → VALIDAÇÃO → CRISTALIZAÇÃO
(diário)   (sprint)      (uso real)   (Livro Magno)
```

- **Diário** (`DIARIO_*.md` na raiz) = laboratório operacional, WIP, registra tudo
- **Memórias persistentes** (`~/.claude/projects/.../memory/`) = aprendizados intermediários
- **Livro Magno** (`docs/LIVRO_MAGNO_*.md`, 5 versões) = museu do que sobreviveu, **só absorve o que provou valor empírico repetível**

**NÃO atualize o Livro Magno por capricho** — só quando algo evoluído provar-se lei (~3-6 semanas de uso real sem regressão).

## Quem é quem

```
SÓCIOS (4 — corrigido 28/04, antes tinha 3 + classificação errada do João)
  Pedro Henrique Passos Galluf    UUID 17345b36 (admin) + d5e01ead (paciente teste)
                                  passosmir4@gmail.com — tech lead, orquestrador COS
  Dr. Ricardo Valença             UUID 2135f0c0 (professional REAL) + 99286e6f (admin)
                                  Nefrologia/CKD — criador do método AEC
                                  Camadas 0-2 da pirâmide (clínico)
  Eduardo Faveret                 admin coordenador eixo Ensino
                                  Neurologia
  João Eduardo Vidal              cbdrcpremium@gmail.com (admin) + jevyarok@gmail.com (teste)
                                  Lado institucional / parcerias / governo / regulatório
                                  Destrava CNPJ → gatilho de timing pra auth_user_id remap

USUÁRIOS TESTE
  Carolina Campello   UUID 5c98c123 — conta teste do Ricardo, NÃO paciente real

ROLES RBAC (4 enums em app_role)
  admin (5) | profissional (13) | paciente (30) | aluno (1)

PACIENTES EXTERNOS PAGANTES: ZERO (pré-PMF)
```

## Diretório de memórias persistentes

`~/.claude/projects/c--Users-phpg6-OneDrive-Imagens-amigo-connect-hub-main/memory/`

30+ memórias organizadas por tipo (`project_*`, `feedback_*`, `reference_*`, `user_*`). Sempre ler `MEMORY.md` (índice) ao iniciar sessão. Memórias críticas:

- `project_lock_v1995_aec_relatorio_agendamento.md` — estado do cadeado atual
- `project_pipeline_diario_para_magno.md` — princípio meta-arquitetural
- `project_estado_28_04_2026_pos_lock_v1997.md` — snapshot mais recente
- `reference_supabase_estado_total_28_04_2026.md` — banco completo
- `reference_edge_functions_catalogo_completo.md` — 11 Edge Functions
- `reference_cheatsheet_supabase_operacional.md` — comandos comuns
- `feedback_polir_nao_inventar.md` — Princípio 8
- `feedback_gotchas_conhecidos_27_04.md` — 7 anti-padrões validados
- `project_regra_consentimento_nao_e_agendamento.md` — REGRA HARD §1
- `project_3_features_half_implemented_p0.md` — P0 funcional pendente

## Princípios operacionais identificados (12 cristalizados)

1. **REGRA HARD §1** — consentimento ≠ agendamento (4 camadas de defesa)
2. **Anti-kevlar §1** — Constituição só muda via nova versão Magno
3. **Princípio 8** — polir, não inventar (reutilizar mecanismo equivalente antes)
4. **Defense in depth** — validação em runtime > confiança em prompt/UI
5. **Princípio de Grounding factual** — GPT NUNCA responde número factual sem fonte autoritativa
6. **Push dual-remote 4 refs** — hub + origin × main + master, sempre
7. **Método de validação 5 etapas** — logs + DB + código + classificação 🟢🟡🟠🔴 + review humano
8. **Action_cards `role='system'` não chamam Core** — early return em sendMessage
9. **UUID nunca tem fallback de slug** — `isValidUuid` antes de qualquer DB op
10. **Separar fontes e calibrar** (🟢🟡🟠🔴) — não misturar Supabase atual / código antigo / narrativa
11. **Eventos explícitos** — gatilhos com consequência real = clique, não inferência LLM
12. **Least data exposure** — remover campos desnecessários de queries públicas

## Cuidados conhecidos (gotchas)

- `selectedSlot` no widget de agendamento é **ISO completo** (`"2026-04-27T14:00:00+00:00"`), não `HH:MM`. Não fazer `.split(":")` nele.
- Tabela `chat_messages_legacy` (15 rows) tem **nome enganoso** — é a CANÔNICA hoje. `chat_messages` (vazia) é shell planejada.
- `prescriptions` tem 8 rows mas é **vulnerável historicamente** — RLS já fechado em V1.9.97-D. Use `cfm_prescriptions` (32 rows oficiais) pra modificações.
- 4 tabelas de perfil existem (`users`, `user_profiles`, `profiles`, `usuarios`) — **`users` é canônica** (38 cols, escrita diariamente). Outras são órfãs/legacy.
- Build local quebra por `dompurify` (em `node_modules` vazio), Vercel passa porque tem em `package.json`.
- 3 Edge Functions deployadas falham silenciosamente (tabelas ausentes — ver lista acima).
- 72 files órfãos no bucket `documents` (~67 MB) de owners deletados — LGPD compliance pendente.
- `chat-images` storage **fechado em V1.9.98 (28/04)**: bucket `public=false`, 4 policies Opção B (owner OR participante de mesma chat_room via JOIN), AdminChat usa `createSignedUrl` TTL 1 ano. Imagem antiga (1 teste do Pedro) não carrega mais via URL pública direta — impacto zero.
- Discrepância `users (30)` vs `user_profiles (35)` — 5 órfãos, investigar antes de deletar.

## Convenções específicas do projeto

- **Versionamento**: V1.9.X — incrementar a cada commit cirúrgico. Sub-letras (V1.9.97-A/B/C) pra fixes relacionados num mesmo ciclo.
- **Commits**: PT-BR informal, prefixo convencional (`fix(escopo)`, `docs(diario)`, `feat`). Co-author obrigatório `Claude Opus 4.7 (1M context) <noreply@anthropic.com>`.
- **Diários**: criar `DIARIO_DD_MM_2026_*.md` na raiz. Estrutura por blocos (A, B, C...), com frase âncora ao fim.
- **Migrations**: padrão `YYYYMMDDHHMMSS_v1_9_XX_descricao.sql` em `supabase/migrations/`.
- **Princípio "polir não inventar"**: antes de criar código novo, **buscar mecanismo equivalente que já existe** no codebase. Reutilizar > criar paralelo.
- **Validação empírica**: smoke-test via Supabase Management API (RPC test + cleanup) antes de declarar feature pronta.

## Modelos de classificação (4 categorias pra decidir destino de módulos)

```
🟢 CORE        Intocável, só bugfix. AEC + Pipeline + Signature + Verbatim + Gate + RACI
🟡 SUPORTE     Manter, simplificar. Escolher 1 caminho e matar resto (chats, prescriptions, perfis)
❄️ LATENTE     Pausado por foco — voltar quando AEC estabilizar. NÃO deletar, NÃO evoluir, documentar
❌ DESCARTÁVEL Cortar com coragem. Duplicatas óbvias, tabelas mortas
```

## Métricas reais (snapshot 27/04 4h, validadas via Supabase API)

```
7 AECs completas          141 Verbatim bypass (46.2%)
38 reports signed_hash    164 chamadas GPT-4o
3 appointments            1.396.254 tokens consumidos
305 interações Core       ~$1.40 USD/h (~$0.60/AEC)
```

## Backlog priorizado atual

```
🔴 P0 (segurança/funcional)
  • RLS chat-images (signed URL)
  • 3 Edge Functions half-implemented (criar tabelas OU desativar)
  • Limpar 72 files órfãos no bucket documents
  • Migrar WiseCare homolog → produção

🟡 P1 (polish pré-escala)
  • V1.9.97-B timezone agenda
  • V1.9.98 fix "Dias na Plataforma" no dashboard
  • V1.9.99 grounding factual da Nôa (function call)
  • V1.9.96 guardrail tiered HARD/SOFT/INFO

🤝 Decisões humanas pendentes
  • Onda 2/3 Ricardo (gap GPT-first arquitetural)
  • TRL com Eduardo Faveret (7 tabelas zeradas — ativar?)
  • Monetização (subscription_plans cadastrados, 0 ativos)
```

## Avisos finais

- **Não confunda `role=paciente` do Pedro no DB com seu papel real** (é só conta de teste/demo). Pedro é o tech lead.
- **Não trate diários antigos como Magno provisório** — são camadas diferentes (laboratório vs museu).
- **Quando em dúvida sobre prioridade**: AEC core é intocável, P0 segurança vem antes de polish, decisões humanas destrava 50% do roadmap.
- **Sempre push 4 refs** mesmo em commits de docs.
