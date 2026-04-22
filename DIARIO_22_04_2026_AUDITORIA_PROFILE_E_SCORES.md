# Diário de Bordo — 22/04/2026 (tarde)
## Auditoria Profile + Pipeline de Scores + Tutorial

### 1. Perfil — CEP, Foto, Ranking & Estrelas

**Auditoria solicitada:** "no CEP, profissional pode buscar por região automático? foto quando altera entra a foto que ele escolheu? Estrelas/ranking funcionando para devidos tipos de usuários?"

**Estado encontrado:**
- ❌ CEP: campo "Localização" era input de texto livre, sem ViaCEP nem autocomplete.
- ✅ Foto de perfil: bucket `avatar` confirmado, upload em `profiles/{user.id}/avatar.{ext}`, salva em `auth.user_metadata.avatar_url`, dispara evento `avatarUpdated` global.
- ❌ Ranking & Estrelas: `ranking = 42` e `averageRatingStars = 4.2` **hardcoded** em `Profile.tsx`. Todo profissional via "#42 / 4½ estrelas".

**Fix aplicado em `src/pages/Profile.tsx`:**
- **CEP automático (ViaCEP):** novo campo CEP ao lado de Localização. Ao digitar 8 dígitos chama `https://viacep.com.br/ws/{cep}/json/` e preenche "Cidade, UF" sem sobrescrever edição manual. Indicador "buscando…" durante consulta. Persistência inteligente: salva como `"00000-000 — Cidade, UF"` em `profiles.location` (sem migration, retrocompatível). Ao recarregar separa CEP e localização nos campos certos.
- **Ranking real:** posição calculada por `user_profiles.points` (count de profissionais com mais pontos + 1). Pacientes/alunos veem "—".
- **Estrelas reais:** média de `conversation_ratings` filtrada por `professional_id`/`patient_id` conforme tipo. Mostra contagem `(12)`. Sem avaliações → "Sem avaliações" em vez de número falso.
- Removido todo mock numérico.

### 2. Pipeline de Scores Clínicos — "Em cálculo" / "Aguardando dados"

**Sintoma reportado:** dashboard do paciente exibindo "Em cálculo" em quase todos os scores e cards "−44 pts / Aguardando dados" nos 4 índices AEC.

**Investigação SQL:**
- Relatórios até 02/04: chaves AEC no topo do `clinical_reports.content` (`identificacao`, `queixa_principal`, `lista_indiciaria`, etc.) → `enrichReportWithScores` calculava normalmente.
- Relatório 22/04 (id `a217252e…`): chaves topo = `raw`, `metadata`, `structured`. As chaves AEC estavam aninhadas em `content.raw.content` (Pipeline Master v2).
- `clinicalScoreCalculator` continuava lendo `content.identificacao` etc → tudo `undefined` → score 0 → marca `calculated:false` → UI exibe "Em cálculo" e o delta vs anterior virou `−44 pts`.

**Fix aplicado em `src/lib/clinicalScoreCalculator.ts`:**
- Nova função `unwrapAecContent()` que detecta automaticamente as 3 estruturas:
  - Topo (`{ identificacao, queixa_principal, ... }`)
  - Aninhada profunda (`{ raw: { content: { identificacao, ... } } }`) ← Pipeline Master v2
  - Aninhada rasa (`{ raw: { identificacao, ... } }`)
- `enrichReportWithScores` desempacota antes de calcular. Sem migration: relatórios antigos serão recalculados em runtime no próximo render.

### 3. Trigger Admin Chat & Audit de Comunicação

- Adicionado link permanente "Chat Admin" na sidebar (visível só para admin), pois o trigger anterior só era acessível por URL direta ou redirect pós-call.
- Confirmado: AdminChat 100% (1:1 + grupos + mídia + realtime), VideoCall com cascata WiseCare → WebRTC, integração WiseCare estável.
- ⚠️ Observação infraestrutura: WebRTC depende apenas de STUN público — recomendado adicionar TURN (Twilio/Cloudflare) para casos atrás de NAT restritivo.

### 4. UX — Tags internas vazando + Botão "Ver Agendamentos"

- Whitelistadas tags internas `[FINALIZE_SESSION]` e `[ASSESSMENT_FINALIZED]` em `NoaConversationalInterface.tsx`, `useMedCannLabConversation.ts` e `noaResidentAI.ts` (estavam aparecendo nas bolhas do chat).
- `SchedulingWidget.onSuccess` agora passa `role: "system"` + `type: "action_card"` para renderizar como card interativo. Card verde "Ver Meus Agendamentos" com fallback para `/app/clinica/paciente/agendamentos` quando handler específico não existe.

### 5. Modal "Revisar Relatório" Vazio

- Causa: Pipeline Master começou a aninhar `content` em `content.raw.content`. `loadSharedReports` lia campos do nível raiz.
- Fix em `src/components/ClinicalReports.tsx`: `loadSharedReports` detecta `nested = rawDb.raw?.content` e mescla com `structured` (markdown) + metadata. Modal agora renderiza markdown clínico em `<pre>` com borda emerald. Download `.txt` restaurado automaticamente.

### 6. Próximos Passos Sugeridos
- Botão "?" de Ajuda no Header para reabrir o tutorial a qualquer momento.
- Tooltips contextuais nos cards "Em cálculo" / "Aguardando dados" explicando que é normal até a 1ª avaliação processada.
- Backfill opcional dos relatórios pré-Pipeline Master v2 para popular `content.scores.calculated:true` e evitar recálculo em runtime.

### Arquivos Tocados Hoje
- `src/pages/Profile.tsx`
- `src/lib/clinicalScoreCalculator.ts`
- `src/components/ClinicalReports.tsx`
- `src/components/Sidebar.tsx`
- `src/components/NoaConversationalInterface.tsx`
- `src/hooks/useMedCannLabConversation.ts`
- `src/lib/noaResidentAI.ts`
