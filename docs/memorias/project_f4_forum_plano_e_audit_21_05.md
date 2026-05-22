---
name: project_f4_forum_plano_e_audit_21_05
description: "Audit do subsistema fórum + F4 fechado end-to-end (21→22/05, V1.9.403→410) — Caminho B (dossiê é a fonte): Enviar ao Fórum → conselho Avalia → debate em sala própria com dossiê no topo. Sobra só F4.4 ranking. Plano em PLANO_F4_FORUM_CANN_MATRIX_21_05.md."
metadata: 
  node_type: memory
  type: project
  originSessionId: 6742fef8-9d20-43d8-a8d8-8853df0c89e9
---

Em 21/05/2026 o subsistema fórum foi auditado a fundo (PAT + front + back) e o **F4 foi desenhado** — mas **não codado**. Plano completo em `PLANO_F4_FORUM_CANN_MATRIX_21_05.md` (raiz do repo, commit `36c7027`).

## Audit — estado real do fórum

- **3 componentes** tocam `public.forum_posts`: `ForumCasosClinicos.tsx` (tab "Fórum de Casos Clínicos" do Terminal de Pesquisa), `ChatGlobal.tsx` (= "Fórum Cann Matrix", rota `/app/chat`), `DebateRoom.tsx` (detalhe `/app/debate/{id}`).
- **2 com schema quebrado**: `ForumCasosClinicos` e `ChatGlobal` inserem colunas-fantasma DIFERENTES que não existem em `forum_posts` (23 cols reais). Os dois create-paths estão quebrados.
- Bucket storage `forum-attachments` **não existe** → upload do form quebrado também.
- `forum_posts` é a **espinha compartilhada** — `ChatGlobal` já converte linhas de `forum_posts` em "debates".
- Infra de ranking **já existe**: `ranking_history` + `view_current_ranking_live`.
- Tabelas `forum_posts/comments/likes/views` + `noa_clinical_cases` todas **0 rows**. `physician_research_dossiers` tem dados (a fonte).
- `noa_clinical_cases` tem RLS `SELECT USING(true)` — mas é tabela **órfã** (nenhum componente usa). Fix standalone, não trava o F4.

## Caminho B (confirmado por Pedro)

O dossiê (F3) é a **fonte**. Um trigger "Enviar ao Fórum" cria um `forum_posts` row; cai em **análise do conselho**; aprovado, vira **debate** no Fórum Cann Matrix. `forum_posts.status` é o trilho. O form manual "Novo Caso" é **aposentado**.

Papéis das 2 UIs: **Fórum de Casos Clínicos = curadoria/conselho/ranking · Fórum Cann Matrix = debate**.

## 5 fases (no PLANO_F4)

- **F4.0** — decidir modelo de consent + fix RLS órfã `noa_clinical_cases`
- **F4.1** — migration `forum_posts` (~9 colunas aditivas: `dossier_id`, `status`, `reviewed_by/at`, `review_notes`, `resolved_at`, `reopened_count`, `consent_attested`, `patient_pseudonym`) + RLS por status
- **F4.2** — trigger "Enviar ao Fórum" no dossiê + `ForumCasosClinicos` reformulado como curadoria
- **F4.3** — workflow editorial do conselho (fila, aprovar/rejeitar, debate, resolver/reabrir)
- **F4.4** — ranking (auditar `ranking_history` antes)

## 2 decisões humanas — RESOLVIDAS 21/05

1. **Modelo de consent de publicação**: ✅ atestação do médico no publish (MVP) — médico atesta que o paciente consentiu a discussão pseudonimizada. Disclaimers a validar com advogado healthtech depois.
2. **Quem é o "conselho"**: ✅ v1 — **Ricardo + Eduardo** cobrem por enquanto (allowlist dos UUIDs admin deles, sem role nova). Futuro: quando elegerem o profissional do conselho, criar role/área dedicada e eleita.

## Progresso F4

- **F4.0** ✅ — RLS órfã `noa_clinical_cases` corrigida (21/05 via PAT): SELECT deixou de ser `USING(true)`, agora `has_role(profissional) OR has_role(admin)`. Policy `noa_clinical_cases_select_professional_only`. Smoke confirmado.
- **F4.1** ✅ — schema `forum_posts` migrado (21/05 via PAT): 9 colunas aditivas (`dossier_id` FK→physician_research_dossiers ON DELETE SET NULL, `status`, `reviewed_by`/`reviewed_at`, `review_notes`, `resolved_at`, `reopened_count`, `consent_attested`, `patient_pseudonym`) + CHECK `forum_posts_status_check` (pending_review/active/resolved/archived/rejected) + 2 índices. RLS SELECT revisada → `forum_posts_select_by_status_role` (autor vê próprio qualquer status; admin tudo; demais só active/resolved/archived por allowed_roles). 0 rows = zero regressão. Smoke confirmado.
- **F4.2-A** ✅ — trigger "Enviar ao Fórum" no dossiê (V1.9.403, commit `78216de`): botão em "Meus Dossiês" (`NoaMatrixView`) + modal de consent (atestação do médico) + hook `useForumPublish` → INSERT `forum_posts` (dossier_id linkado, status=`pending_review`, consent_attested=true, allowed_roles=[profissional,admin]). INSERT policy já permitia (`auth.uid()=author_id`). O pipe dossiê→forum_posts funciona.
- **F4.2-B.1** ✅ — "+ Novo Caso" manual aposentado (V1.9.404, commit `9d27cf2`): botão → aviso do Caminho B ("casos chegam da Nôa Matrix"). O modal "Novo Caso Clínico" segue no código mas inalcançável — remoção completa no rework do F4.2-B.2.
- **F4.2-B.2** ✅ — "Criar aula" removido do card (V1.9.405); rótulos de status PT (V1.9.406); **Cann Matrix mostra só caso aprovado como debate** (V1.9.408 — `loadDebates` do `ChatGlobal` filtra `.in('status',['active','resolved'])` + mapeia colunas reais + JOIN `users` pro autor); painel lateral "Notícias" do Cann Matrix virou **"Debates" ao vivo** (V1.9.409 — lista forum_posts aprovados, clique → `/app/debate/{id}`).
- **F4.3** ✅ — avaliação do conselho (V1.9.406, commit `65f5fd2`): hook `useForumReview` + botão "Avaliar" no card `pending_review` (gate = admin; Ricardo+Eduardo cobrem) + modal aprovar/rejeitar com `review_notes`. Aprovar → status `active` / Rejeitar → `rejected`. Grava reviewed_by/at. RLS UPDATE já permitia admin.
- **V1.9.410** ✅ — **dossiê fixado no topo da sala de debate** (`DebateRoom`). Decisão de design: cada debate JÁ tem sala própria (`/app/debate/{id}`, mensagens isoladas por `chat_id` = `forum_posts.id`) — NÃO cai no canal compartilhado "Casos Clínicos". Card recolhível com trigger "Ver dossiê completo" quando `forum_posts.dossier_id` está preenchido.
- **F4.4** — ranking (auditar `ranking_history` antes). Parqueado — **único item de feature pendente**.

## End-to-end do F4 fechado (21→22/05)

`dossiê → [Enviar ao Fórum] (F4.2-A) → pending_review → [conselho Avalia] (F4.3) → Aprovar=active → [debate no Cann Matrix: painel "Debates" + quadro] (V1.9.408/409) → DebateRoom (sala própria + dossiê fixado no topo, V1.9.410)`. Rejeitar = `rejected` (volta ao autor com `review_notes`). **O ciclo end-to-end funciona e está fechado.** `pending_review`/`rejected` NÃO aparecem no Cann Matrix.

Falta só: link "Abrir debate" direto do card de curadoria do `ForumCasosClinicos`, remover o modal "Novo Caso" morto, e **F4.4 ranking**.

## Regressão

Risco ~nulo: tudo que o F4 toca tem 0 rows ou está quebrado/0 users; lê `physician_research_dossiers` read-only; não toca AEC/Pipeline/PBAD/Locks/Matrix core/canais de chat.

## Estado

F4 **codado e fechado end-to-end** (21→22/05, V1.9.403→410) — plano aprovado, 2 decisões humanas resolvidas (consent por atestação + conselho = Ricardo/Eduardo via allowlist admin). Sobra só F4.4 ranking + 2 polishes menores. Conecta com [[project_visao_final_eixo_pesquisa_19_05]] (F4 = etapa "coletivo" da jornada) e [[audit_forum_3_bloqueios_pre_publicacao_18_05]] (os 3 bloqueios encolheram no Caminho B — RLS forum_posts ok, consent por atestação, pseudonimização do conteúdo ainda é resíduo — ver [[feedback_pseudonimizacao_conteudo_forum_21_05]]).

Pós-F4, a noite 21→22/05 seguiu com **polish do Fórum Cann Matrix** (V1.9.411→418): sidebar, degradê dos 3 tabs, redesign do Fórum de Casos, chat maior com altura relativa à viewport, empty states, remoção de botões mortos. Detalhe no Bloco P do `DIARIO_21_05_2026_F3_REABRIR_F2_ANEXAVEL.md` — é git history, não virou memory própria.
