# 🧭 CHAT_AUTH_MATRIX — Matriz de autorização semântica de chat e fórum

> **Documentado**: 28/04/2026 ~16h00 BRT por Claude Opus 4.7 + GPT review.
> **Status**: doc-only (arquitetura). Implementação em sessão dedicada futura.
> **Trigger pra implementar**: decisão Pedro+Ricardo (clínico) + João Vidal (regulatório).

---

## 1. Contexto e descoberta

Sessão 28/04 descobriu via audit empírico das RLS:

**Modelo atual** = RBAC leve baseado em **participação na sala**:
```
chat_rooms.SELECT       :  is_admin OR is_chat_room_member(id, auth.uid())
chat_participants.SELECT:  is_admin OR is_chat_room_member(room_id, auth.uid())
chat_messages.SELECT    :  is_admin OR is_chat_room_member(room_id, auth.uid())
chat_rooms.INSERT       :  qualquer authenticated cria sala
chat_participants.INSERT:  self OR room_owner OR admin
```

→ **RLS NÃO bloqueia por tipo de usuário**. Quem cria sala pode adicionar QUALQUER um. Convenção atual está alinhada com regras desejadas (zero salas paciente↔paciente nas 20 atuais), **mas só por convenção da UI**, não por constraint do banco.

**Modelo desejado** = ABAC semântico (atributo + contexto + intenção):
```
can_users_chat(user_a, user_b, context)
  → considera type de cada user
  → considera contexto (turma de aluno, atendimento clínico ativo, etc.)
  → considera intenção (chat solo / grupo terapêutico / fórum)
```

→ Salto de maturidade: de "quem está na sala" para "quem PODE falar com quem".

---

## 2. Matriz proposta (Pedro 28/04)

### Chat 1:1 (PatientDoctorChat) e Chat clínico (ProfessionalChatSystem)

| Combinação | Permissão | Justificativa |
|---|---|---|
| profissional ↔ profissional | ✅ livre | discussão clínica, equipe |
| profissional ↔ paciente | ✅ livre | atendimento clínico (caminho A do produto) |
| profissional ↔ aluno | ✅ livre | orientação / supervisão |
| profissional ↔ admin | ✅ livre | suporte operacional |
| admin ↔ admin | ✅ livre | gestão |
| admin ↔ paciente | ✅ livre | suporte ao paciente |
| admin ↔ aluno | ✅ livre | suporte ao aluno |
| **paciente ↔ paciente** | ❌ bloquear | privacidade clínica, compliance LGPD |
| **aluno ↔ paciente** | ❌ bloquear | aluno não tem credencial pra falar com paciente |
| **aluno ↔ aluno (mesma turma)** | 🤔 dúvida Pedro | grupo de estudo? cohort de 1 semana? |
| **aluno ↔ aluno (turmas diferentes)** | ❌ provavelmente bloquear | sem contexto compartilhado |

**Pendente decisão Pedro+Ricardo+Eduardo**:
- Aluno↔aluno mesma turma: liberar como grupo de estudo OU manter restrito?
- Definir o que é "mesma turma" — `course_enrollments.course_id` igual? `course_enrollments.created_at` em janela de N dias?
- Considerar grupos terapêuticos futuros (paciente↔paciente em grupo supervisionado)?

### Fórum (forum_posts / forum_comments)

| Comportamento | Estado atual | Estado desejado |
|---|---|---|
| Visibilidade post `is_active=true` | TODOS veem (Policy 1 ignora allowed_roles) | Respeitar allowed_roles |
| Posts marcados "só profissional" | 🚨 Pacientes veem (BUG) | Só profissionais veem |
| Posts marcados "só admin" | 🚨 Pacientes veem (BUG) | Só admins veem |
| Posts sem allowed_roles (vazio/null) | TODOS veem | TODOS veem (manter) |
| Comentários | Anyone view (sem filtro) | Idem ou seguir post pai |
| Likes / Views | Anyone view | Manter (telemetria, ok público) |

→ **Bug de vazamento**: `Anyone can view active forum posts` (Policy 1) + `Users can view posts based on allowed_roles` (Policy 2) = OR. Policy 1 mais permissiva sempre passa. **`allowed_roles` está IGNORADO.**

---

## 3. Plano de implementação (em sessões dedicadas)

### Sprint A — Fix fórum (P0 real, broadcast = escala rápido) — ~30min

**Justificativa de prioridade**: vazamento de permissão em broadcast (qualquer paciente pode ver post marcado "só profissional") é problema clínico/regulatório real. Chat 1:1 controlado pela UI não tem urgência similar.

**Caminhos**:

**Opção A (recomendada — mais simples)**:
```sql
DROP POLICY "Anyone can view active forum posts" ON public.forum_posts;
-- Mantém só "Users can view posts based on allowed_roles" que JÁ trata
-- allowed_roles vazio/null como "todos podem ver"
```

**Opção B (controlada — composição explícita)**:
```sql
DROP POLICY "Anyone can view active forum posts" ON public.forum_posts;
DROP POLICY "Users can view posts based on allowed_roles" ON public.forum_posts;
CREATE POLICY "forum_posts_select_active_with_allowed_roles" ON public.forum_posts
  FOR SELECT USING (
    is_active = true AND (
      is_admin()
      OR allowed_roles IS NULL
      OR allowed_roles = '{}'::text[]
      OR EXISTS (
        SELECT 1 FROM public.users
        WHERE id = auth.uid() AND type = ANY(allowed_roles)
      )
    )
  );
```

**Smoke test obrigatório pré-aplicação**:
1. Listar posts com `allowed_roles NOT NULL AND allowed_roles != '{}'`
2. Listar `read_forum_posts` policy (3ª policy SELECT) — pode ter outra brecha
3. Testar visibilidade pós-DROP via paciente teste

### Sprint B — Refactor chat matrix (~3-4h dedicado, NÃO agora)

**Componentes**:
1. SQL function `can_users_chat(user_a uuid, user_b uuid)` retorna boolean
   - Lê types via `users.type` (ou `user_roles` se canônico hoje)
   - Aplica matriz acima
   - Lida com cohorts de aluno (consultar `course_enrollments` se aplicável)

2. Trigger BEFORE INSERT em `chat_participants`:
   - Para cada novo participante adicionado, checar todos os existentes via `can_users_chat()`
   - Se algum par retornar false → RAISE EXCEPTION

3. RPC `create_chat_room_with_participants(name, type, members[])`:
   - Validação preventiva (impede criação inválida desde o início)
   - Mais elegante que trigger-only

4. UI: ProfessionalChatSystem + PatientDoctorChat fazem chamadas via RPC, não INSERT direto

**Pré-requisitos críticos**:
- Decisão final sobre aluno↔aluno (Eduardo Faveret + Pedro)
- Migrar `chat_messages_legacy` → `chat_messages` canônica antes (decisão pendente)
- Definir contexto de cohort de aluno (course_enrollments)

**Custo de não fazer agora**:
- 🟢 Baixo se UI continuar respeitando convenção (zero salas inválidas hoje)
- 🟡 Médio se time crescer e novos devs quebrarem convenção sem RLS proteger
- 🔴 Alto se aparecer ataque deliberado (paciente fazendo signup criar sala com outro paciente via API)

---

## 4. Critério de ativação (Sprint A vs B)

| Sprint | Quando atacar |
|---|---|
| **A — Fix fórum** | Próxima sessão dedicada. P0 real (broadcast). |
| **B — Chat matrix** | Quando: (a) decidir aluno↔aluno + (b) primeiro paciente externo via Caminho A + (c) janela de 3-4h dedicada com Pedro+Ricardo+João. |

---

## 5. Anti-kevlar §1 aplicado

Mudanças em camadas 0-2 (autorização) afetam **quem decide o quê**. Por anti-kevlar §1:
- Sprint A (fórum) = camada 7 técnica + impacto camada 0-2 → exige doc + smoke test
- Sprint B (chat matrix) = camada 0-2 (autorização semântica) → **exige nova versão Livro Magno** antes de aplicar

→ Este documento é o pré-requisito formal pra Sprint B.

---

## 6. Frase-âncora

> *"RBAC leve (por participação) → ABAC semântico (por tipo + contexto + intenção). Esse é o salto. Mas não se atravessa salto sem rede: doc primeiro, smoke depois, código por último."*

---

## Histórico

| Data | Quem | O que |
|---|---|---|
| 28/04/2026 | Pedro + Claude + GPT | Audit RLS + identificação bug fórum + matriz proposta + doc inicial |
