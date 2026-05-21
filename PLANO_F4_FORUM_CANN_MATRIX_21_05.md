# PLANO F4 — Fórum: dossiê → conselho → debate

**Data**: 21/05/2026 · **Autor**: Pedro + Claude Opus 4.7
**Status**: PROPOSTA — aguarda aprovação antes de qualquer código
**Base**: audit empírico 21/05 (PAT + front + back + memórias)

---

## 1. Objetivo (Caminho B — confirmado por Pedro)

Fechar a jornada do eixo Pesquisa: **relatório → Matrix → dossiê → fórum**.
O dossiê é a **fonte**. Um trigger no dossiê o envia ao fórum; ele cai em
**análise do conselho**; aprovado, vira **debate** no Fórum Cann Matrix.

O formulário manual "Novo Caso Clínico" é **aposentado** — o dossiê já É o
caso clínico estruturado (corpus + papers + conversa auditada + síntese).

## 2. Estado atual auditado (21/05)

### Tabelas (todas 0 rows — subsistema morto de ponta a ponta)
| Tabela | Rows | RLS |
|---|---|---|
| forum_posts (23 col) | 0 | SELECT role-checked ✅ |
| forum_comments | 0 | SELECT via post ✅ |
| forum_likes / forum_views | 0 | SELECT aberto (contadores, baixa sensib.) |
| physician_research_dossiers | 3 | RLS own-only ✅ (a FONTE) |
| noa_clinical_cases | 0 | SELECT `USING(true)` ⚠️ — **órfã, ninguém usa** |

### 3 componentes tocam `forum_posts` — 2 com schema quebrado
- **ForumCasosClinicos.tsx** (1143 linhas) — tab "Fórum de Casos Clínicos". Form "Novo Caso" insere 6 colunas-fantasma (`complexity, specialty, attachments, rationality_analysis, ai_discussion, status`). **Create quebrado.**
- **ChatGlobal.tsx** (2512 linhas) — "Fórum Cann Matrix" (`/app/chat`). Lê `forum_posts` → converte em debate. Espera/insere 6 colunas-fantasma DIFERENTES (`author_name, author_avatar, participants_count, views_count, last_activity, password_hash`). **Create quebrado também.**
- **DebateRoom.tsx** (`/app/debate/{id}`) — detalhe do debate (comentários/votos).

### Outros achados
- Bucket storage **`forum-attachments` NÃO EXISTE** → upload do form quebrado também.
- Canais do Cann Matrix usam `chat_rooms` + `chat_messages` (separado de forum_posts) — F4 não toca neles.
- **`ranking_history` + `view_current_ranking_live` JÁ EXISTEM** — há infra de ranking. O "ranking tops" deve reusar isso (audit próprio antes).
- `forum_posts.password` é TEXT plain (anti-padrão) — fica parqueado (Caminho B não usa grupo com senha).
- **ZERO integração dossiê↔fórum hoje** — nenhum `dossier_id` em lugar nenhum.

## 3. O modelo F4

```
Dossiê (Meus Dossiês)
   │ trigger "Enviar ao Fórum"  +  gate de consent
   ▼
forum_posts (status=pending_review, dossier_id linkado)
   │
   ▼  aparece em:
"Fórum de Casos Clínicos" = CURADORIA / CONSELHO / RANKING
   (abas: Em análise · Em debate · Resolvidos)
   │ conselho aprova (ou rejeita → volta ao médico)
   ▼  status=active
"Fórum Cann Matrix" = DEBATE
   (vira debate; comunidade discute; DebateRoom = detalhe)
   │ debate conclui → status=resolved (reabrir: reopened_count++)
   ▼  status=archived
```

`forum_posts.status` é o trilho que liga as duas UIs. Cada uma ganha papel claro:
**Casos Clínicos = entrada+conselho+ranking · Cann Matrix = debate.**

## 4. Schema — F4.1 (migration aditiva, 0 rows → risco zero)

`ALTER TABLE forum_posts ADD`:
- `dossier_id uuid REFERENCES physician_research_dossiers(id) ON DELETE SET NULL` — link Caminho B
- `status text NOT NULL DEFAULT 'pending_review'` CHECK in (`pending_review,active,resolved,archived,rejected`)
- `reviewed_by uuid` · `reviewed_at timestamptz` · `review_notes text` — conselho
- `resolved_at timestamptz` · `reopened_count int NOT NULL DEFAULT 0` — resolução/reabrir
- `consent_attested boolean NOT NULL DEFAULT false` — gate de publicação (v1: atestação do médico)
- `patient_pseudonym text` — #6ACF denormalizado p/ exibir sem JOIN

**RLS revisada**: SELECT por `status` — `pending_review`/`rejected` só autor+conselho; `active`/`resolved`/`archived` pelos `allowed_roles`.

**Reconciliação**: os dois frontends param de escrever colunas-fantasma (F4.2). O form manual é aposentado → `complexity/specialty/rationality_analysis/ai_discussion` deixam de ser necessárias (o dossiê carrega isso no snapshot).

## 5. Bloqueios recalibrados (Caminho B encolhe os 3 do 18/05)

| Bloqueio 18/05 | Estado real | Ação F4 |
|---|---|---|
| RLS `noa_clinical_cases` aberta | tabela **órfã**, F4 não usa | fix standalone em F4.0 (1 linha) |
| Pseudonimização fraca | dossiê já usa **#6ACF** | herdado do F2/F3 ✅ |
| Sem consent de publicação | **continua o real** | gate em F4.0/F4.2 |

## 6. Fases

| Fase | Escopo | Risco |
|---|---|---|
| **F4.0** | Decisão do modelo de consent (humano) + fix RLS `noa_clinical_cases` órfã | nulo |
| **F4.1** | Migration `forum_posts` (9 cols aditivas) + RLS por status + criar bucket `forum-attachments` (ou remover anexo) | nulo (0 rows) |
| **F4.2** | UI: trigger "Enviar ao Fórum" no dossiê + `ForumCasosClinicos` reformulado como curadoria (abas por status) + ChatGlobal lê colunas reais | baixo (0 users) |
| **F4.3** | Workflow editorial: fila do conselho, aprovar/rejeitar, active→debate, resolver/reabrir | baixo |
| **F4.4** | Ranking — audita `ranking_history` existente, depois conecta | a definir |

Cada fase = commit(s) com type-check + smoke (igual aos V1.9.393→400). **Não é big-bang.**

## 7. Análise de regressão

- `forum_posts` 0 rows → migration aditiva = **zero regressão de dado**.
- 3 componentes do fórum: já quebrados, **0 usuários** → reformular não regride nada vivo.
- Lê `physician_research_dossiers` (read-only) → seguro.
- **Não toca**: AEC, Pipeline, PBAD, Locks, core da Matrix, canais de chat (`chat_rooms`/`chat_messages`).
- Único cuidado: F4.1 (migration) e F4.2 (ChatGlobal lê colunas reais) andam em lockstep — se a migration for sem o fix do ChatGlobal, o Cann Matrix só continua vazio (0 rows), sem regressão.

## 8. Decisões humanas pendentes (antes de F4.2)

1. **Modelo de consent** — duas opções:
   - (a) **Atestação do médico** no publish ("atesto que o paciente consentiu a discussão pseudonimizada deste caso") — simples, MVP.
   - (b) **Consent do paciente** — estender o NFT consent V1.9.311 com flag `permite_discussao_forum` — mais forte, exige ação do paciente.
   - Recomendação: (a) pra v1 + audit log; (b) como evolução. **Validar com advogado healthtech.**
2. **Quem é o "conselho"** — admins (Pedro/Ricardo/Eduardo/João)? Role dedicada? v1 sugerido: role `admin` revisa.

## 9. Parqueado (não entra no F4 v1)

- `forum_posts.password` plain → hash (Caminho B não usa grupo privado).
- Ranking sofisticado — depende do audit do `ranking_history`.
- Curadoria semântica de papers no dossiê (F3-A.3/A.4).

## 10. Frase âncora

> *"O fórum não é construído do zero — é desentortado. forum_posts já é a
> espinha; o dossiê vira a fonte; o status vira o trilho. 0 rows, 0 users,
> create quebrado = a feature mais segura de reformar no app inteiro."*
