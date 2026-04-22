# Diário 22/04/2026 — Pipeline Clínico Selado + Fix Toggle "Ver como"

## 🎯 Resumo Executivo

Dois marcos consolidados no mesmo dia:

1. **Pipeline clínico pós-AEC provado vivo ponta a ponta** (Cenário A confirmado)
2. **Bug de coerência do toggle "Ver como" corrigido** em `getAllPatients`

---

## 1. Pipeline Clínico — PROVA DE VIDA

### Achado
Após a correção do bloqueador primário (`doctor_id NULL` em `clinical_reports`),
restava validar se o pós-processamento (axes + rationalities + interaction_id)
estava realmente persistindo. Suspeita histórica: bug silencioso no orquestrador.

### Evidência cruzada (logs + DB)

**Logs do edge `tradevision-core` (sequência cronológica real):**
```
14:47:07  🚀 [GATEWAY] Disparando Orquestrador de Finalização ClinicalMaster (Mode: Active)
14:47:10  ✍️  [NARRATOR] Redigindo narrativa clínica estruturada
14:47:19  ✅ [REPORT_GENERATED] a217252e-a162-4b75-bb26-8851e1cc518b
14:47:19  ✅ [AXES] Eixos clínicos sincronizados
14:47:33  ✅ [INTELLIGENCE_LAYER] Pipeline completo
```

**Query de validação (`clinical_reports` + agregados):**
```
report_id            : a217252e-a162-4b75-bb26-8851e1cc518b
interaction_id       : 93bce7f9-64c3-44f9-b96c-d673c9dc2c90  ✅ não-NULL
doctor_id            : 2135f0c0-eb5a-43b1-bc00-5f8dfea13561 (Dr. Ricardo) ✅
axes_count           : 5
rationalities_count  : 1
```

### Idempotência (C2) — funcionando
Após o `INTELLIGENCE_LAYER` completar às 14:47:33, **6 disparos redundantes**
foram corretamente bloqueados pelo lock temporal:

```
14:47:35 / 14:47:40 / 14:47:55 / 14:48:00 / 14:48:04 → ⚠️ IDEMPOTENCY_TIME_LOCK
```

Front-end emite múltiplos triggers (re-tentativas, reconexões, mensagens duplicadas)
e o backend recusa elegantemente sem duplicar relatório. Comportamento esperado.

### Veredito
✅ Bug crítico do `doctor_id` — resolvido
✅ Pipeline pós-report (axes + rationalities + interaction_id) — **PROVADO VIVO**
✅ Idempotência (C2) — operacional, bloqueou 6 redundâncias
✅ Camada de Inteligência Clínica — operacional ponta a ponta

🟢 **Status:** Pipeline clínico fully restored. Desbloqueado para avançar nos
próximos eixos: cursos, financeiro, gamificação.

---

## 2. Bug de Coerência do Toggle "Ver como" — CORRIGIDO

### Achado
Admin (Dr. Pedro / phpg69@gmail.com) ativa o toggle **"Ver como Profissional"**
no header. Console mostra corretamente:
```
👁️ Admin visualizando como: profissional (tipo real: admin)
```

Porém o card "Total de Pacientes" continuava exibindo **14** (todos da plataforma),
em vez de simular fielmente a visão de um profissional comum (apenas pacientes
vinculados ao próprio `user.id`).

### Causa raiz
Em `src/lib/adminPermissions.ts`, a função `getAllPatients(user)` chamava
`isAdmin(user)` — que considera apenas o **tipo real** do usuário no AuthContext.
Resultado: admin sempre caía no ramo "todos os pacientes da plataforma",
independente do toggle.

### Fix aplicado
**3 arquivos editados:**

1. **`src/lib/adminPermissions.ts`** — `getAllPatients` agora aceita parâmetro
   opcional `effectiveType`. Só trata como admin (acesso global) quando o tipo
   efetivo é `admin` ou ausente. Caso contrário, cai no ramo profissional e
   retorna apenas pacientes vinculados via `clinical_assessments` + `appointments`
   ao `user.id`.

2. **`src/hooks/dashboard/useProfessionalDashboard.ts`** — passa `effectiveType`
   para `getAllPatients` e ajusta o gate `if (userIsAdmin)` para considerar
   o tipo efetivo.

3. **`src/pages/PatientsManagement.tsx`** — importa `useUserView`, deriva
   `effectiveType` e o passa para `getAllPatients`. Log atualizado para
   distinguir os 3 cenários: `(admin)`, `(admin vendo como X)`, `(profissional)`.

### Comportamento esperado pós-fix
| Usuário real | Toggle "Ver como" | Pacientes exibidos |
|--------------|-------------------|--------------------|
| admin        | (sem simulação)   | TODOS              |
| admin        | admin             | TODOS              |
| admin        | profissional      | **apenas vinculados ao user.id** |
| admin        | paciente          | apenas vinculados ao user.id     |
| profissional | (n/a)             | apenas vinculados (inalterado)   |
| paciente     | (n/a)             | n/a                              |

### Por que isso importa
Sem o fix, o modo "Ver como" violava o próprio propósito (simular a experiência
do papel selecionado). Com o fix, admin pode validar UX e fluxos clínicos do
profissional sem precisar trocar de conta.

---

## 3. Trigger do Admin Chat na Sidebar — não sumiu

Investigação rápida em `src/components/Layout.tsx` (linhas 74-78 e 359-363):
o trigger continua presente e roteia conforme `effectiveType`:

```ts
if (effectiveType === 'admin')           → /app/admin-chat
else if (effectiveType === 'profissional') → /app/clinica/profissional/chat-profissionais
```

Sintoma reportado decorria do mesmo toggle "Ver como Profissional" ativo —
o trigger redirecionava para o chat profissional. Comportamento correto.
Voltando o header para "Admin", o trigger volta a apontar para `/app/admin-chat`.

---

## 4. Itens conhecidos remanescentes (baixa prioridade)

- ⚠️ **React `forwardRef` warning** em `PatientsManagement` dentro de
  `IntegratedWorkstation` (console). Não quebra nada — apenas warning de DX.
  A corrigir quando entrarmos em refatoração de componentes integrados.

---

## 5. Próximos eixos liberados

Conforme plano original, com pipeline selado e toggle coerente:

1. 🎓 Eixo de cursos (Catálogo / Universidade Digital)
2. 💰 Eixo financeiro (Carteira / Simulador / Visão)
3. 🎮 Eixo de gamificação (XP / Ranking / Badges)
