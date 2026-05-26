---
name: Gotchas conhecidos — armadilhas detectadas em 27/04 (anti-padrões)
description: Lista consolidada de 7 armadilhas aprendidas hoje. Cada uma foi bug real validado. Servem como lista de "não cometer de novo" em componentes similares
type: feedback
originSessionId: 60cf94b7-b5d3-4df1-974d-c1c92082460c
---
Armadilhas detectadas e corrigidas (ou registradas) em 27/04/2026. Cada uma teve causa raiz validada via audit. Lista pra evitar repetição em outros componentes/contextos similares.

## 1. "concordo" durante revisão ≠ "autorizo" no consentimento

**O que parecia**: paciente diz "concordo" → AEC fecha, dispara trigger.
**Realidade**: `assessmentPhase` transita FINAL_RECOMMENDATION → CONSENT_COLLECTION JUNTO com a "concordo". A pergunta de consentimento é a próxima resposta da Nôa. Só "sim/autorizo" NA pergunta de consentimento (`isAskingConsent`) fecha AEC.

**Where to apply**: qualquer lógica que detecta "fechamento" baseada em palavra-chave do user precisa também checar **se a Nôa está pedindo confirmação ou já confirmou**.

**Fix histórico**: V1.9.94 — guard `isAskingConsent` em [`tradevision-core/index.ts:4906-4933`](supabase/functions/tradevision-core/index.ts#L4906).

## 2. `action_card` com `role='system'` NÃO deve chamar Core

**O que parecia**: front mandando "✅ Agendamento confirmado!" via `sendMessage(content, { role: 'system' })` adiciona apenas display visual no chat.
**Realidade**: `sendMessage` não tinha early return — chamava o Core, que tratava o action_card como input do paciente. GPT-4o respondia com novo `[TRIGGER_SCHEDULING]`, abrindo widget duplicado pós-agendamento.

**Where to apply**: qualquer mensagem auto-gerada pelo front (banners, sucesso, erro, action_card) precisa de `if (options.role === 'system') return` antes do fetch ao Core.

**Fix histórico**: V1.9.95-B — early return em [`useMedCannLabConversation.ts:1022-1029`](src/hooks/useMedCannLabConversation.ts#L1022).

## 3. `selectedSlot` em widget de agendamento é ISO completo, não "HH:MM"

**O que parecia**: `selectedSlot.split(":")` extrai hora/minuto.
**Realidade**: `getAvailableSlots` retorna ISO timestamptz inteiro (`"2026-04-27T14:00:00+00:00"`). `split(":")` quebra em 4+ pedaços, `parseInt("2026-04-27T14")=NaN`, `setHours(NaN)→Invalid Date`, `toISOString` lança erro, RPC nem é chamada.

**Where to apply**: qualquer parsing de timestamp ISO precisa usar `Date()` constructor ou `Intl.DateTimeFormat`, nunca `split`.

**Fix histórico**: V1.9.97-A — usar `selectedSlot` direto (já é ISO) em [`NoaConversationalInterface.tsx:339-360`](src/components/NoaConversationalInterface.tsx#L339).

## 4. `reports[length-1]` ≠ "primeiro acesso"

**O que parecia**: índice `-1` de array sorted ASC = mais antigo.
**Realidade**: ordem do array depende de quem populou. Pode ser ASC ou DESC. Para "primeiro acesso", **sempre usar `user.created_at`** ou `Math.min(...reports.map(r => new Date(r.generated_at).getTime()))`.

**Where to apply**: qualquer cálculo "tempo na plataforma", "primeira interação", "data da última atividade" — usar fonte autoritativa (`users.created_at`), não posição em array.

**Fix histórico**: V1.9.98 pendente em [`PatientStats.tsx:23-26`](src/components/dashboard/patient/PatientStats.tsx#L23).

## 5. GPT chuta dados factuais sem function call (gap arquitetural)

**O que parecia**: GPT no chat livre conhece dados do paciente via contexto.
**Realidade**: GPT-4o responde número factual sobre paciente sem tool/function call. Pode acertar (87 dias) e errar (20 avaliações vs verdade 38). Sem grounding, **alucinação garantida em escala**.

**Where to apply**: princípio constitucional — *GPT NUNCA deve responder número factual sobre o paciente sem fonte autoritativa do banco no contexto*. Se intent = FACT_QUERY, Core consulta banco → injeta dado verdadeiro → GPT formula resposta natural.

**Fix proposto**: V1.9.99 (não implementado) — function call no Core pra perguntas factuais, com whitelist de queries permitidas.

## 6. UUIDs hardcoded em policies = fragilidade operacional

**O que parecia**: 4 UUIDs founders hardcoded em `clinical_reports` policy permite acesso admin a esses 4.
**Realidade**: founder que sai mantém acesso. Novo founder exige migration. Lista hardcoded vira refém de SQL deploy, não de gestão de roles.

**Where to apply**: nunca hardcode UUIDs em policies. Usar role (`has_role(auth.uid(), 'admin')`) ou tabela `founders` consultável.

**Fix proposto**: pendente, P3.

## 7. Bucket de storage `public=true` SEM filtro de SELECT na policy

**O que parecia**: bucket público pra `getPublicUrl()` funcionar.
**Realidade**: `bucket public=true` + policy SELECT `qual: bucket_id = 'X'` = qualquer URL acessível por qualquer pessoa, mesmo deslogada. Em healthtech, paciente sobe print de exame → vazado.

**Where to apply**: bucket público é OK pra avatar/branding. Pra conteúdo de paciente, **sempre filtrar SELECT** por owner ou usar `createSignedUrl` (token temporário).

**Fix pendente**: V1.9.96+ chat-images — migrar `getPublicUrl` pra `createSignedUrl` em [`AdminChat.tsx:233`](src/pages/AdminChat.tsx#L233).

## Princípio meta-aprendido

> **Defesa em profundidade > confiança em prompt/UI/convenção.**
> Cada um destes 7 gotchas era assumido como "vai funcionar porque está documentado/comentado/óbvio". Cada um falhou na prática. Healthtech regulada exige enforcement em runtime, não solicitação.
