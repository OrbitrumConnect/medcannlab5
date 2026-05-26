---
name: Action_cards do front são só visuais — não enviar ao Core
description: Lição V1.9.95-B. Mensagens com role='system' em sendMessage devem ter early return (não chamar API do Core)
type: feedback
originSessionId: 60cf94b7-b5d3-4df1-974d-c1c92082460c
---
Mensagens **action_card** (`role='system'`) no front são displays visuais no chat — confirmações, banners, sucesso de ação. **Nunca devem ser enviadas ao Core como input do user**.

**Why:** descoberto em 27/04/2026 18:58 BRT. Após paciente confirmar agendamento via widget, o front chamava `sendMessage('✅ Agendamento confirmado! ID: 48ca2298', { role: 'system', ... })`. O `sendMessage` adicionava a mensagem local mas SEGUIA chamando o Core. GPT-4o recebia "✅ agendamento confirmado!" como input do user (validado nos logs: `📥 [REQUEST] normSnippet="✅ agendamento confirmado!"`) e respondia com `[TRIGGER_SCHEDULING]` → outro card de agendamento abria → loop.

**How to apply:**
- Em `useMedCannLabConversation.sendMessage`, após `setMessages(prev => [...prev, userMessage])`, adicionar early return quando `options.role === 'system'`:
  ```typescript
  if (options.role === 'system') {
    console.log('🛈 [SYSTEM_MSG] Card de sistema adicionado ao chat (sem chamada ao Core).')
    return
  }
  ```
- Mesma regra aplica a qualquer mensagem auto-gerada pelo front (banners, sucesso, erro) — NÃO chamar Core. Action é display.
- Se um action_card precisa disparar lógica do Core (ex: paciente clica "iniciar avaliação"), use `app_commands` ou button handlers explícitos, não sendMessage com role='system'.

**Refs**: V1.9.95-B commit `1a79108`. Linha 1022-1029 de `src/hooks/useMedCannLabConversation.ts`. Diário 27/04 Bloco O.2.
