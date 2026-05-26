---
name: Eventos explícitos > inferência por texto + Anti-fallback-silencioso
description: Duas regras operacionais cristalizadas em 27/04 durante a análise do trigger de agendamento da Carolina. Aplicação do Princípio 7 (Core=trilho/GPT=vagão) na camada de UX e na camada de identidade.
type: feedback
originSessionId: 60cf94b7-b5d3-4df1-974d-c1c92082460c
---
## Regra A — Eventos explícitos > inferência por texto

**Princípio:** Quando uma ação tem consequência real (abrir widget, agendar consulta, gerar prescrição), o gatilho NUNCA deve ser **inferência da LLM sobre o que o usuário disse**. Tem que ser **clique explícito** ou **comando determinístico**.

**Aplicação no caso `[TRIGGER_SCHEDULING]`:**
- ❌ Errado (até V1.9.84): Core injeta `[TRIGGER_SCHEDULING]` quando paciente diz "concordo/sim/autorizo/pode" durante CONSENT_COLLECTION. LLM-via-regex decidindo abrir widget.
- ✅ Correto: paciente clica explicitamente em "Agendar Consulta" no card final → front envia evento → Core responde com `[TRIGGER_SCHEDULING]` + `professionalId`.

**Por quê:**
- Reduz ambiguidade (palavra "concordo" tem múltiplos significados)
- Reduz custo de tokens (não precisa GPT pra decidir abrir widget)
- Auditável (clique gera evento rastreável; inferência é caixa-preta)
- Compatível com Princípio 7 (Core decide, GPT só executa frase verbatim)

**Sinal de que está caindo no anti-pattern:** Core fazendo `if (norm.includes('palavra'))` para decidir ação UI.

## Regra B — Anti-fallback-silencioso (slug ≠ UUID)

**Princípio:** Quando um valor obrigatório (UUID, ID, token) está ausente, **NÃO substituir por valor que parece válido mas não é**. Falhar explícito é melhor que sucesso aparente que quebra na ponta.

**Aplicação no caso `professionalId`:**
- ❌ Errado (atual `NoaConversationalInterface.tsx:3391`): `professionalIdFromMeta || "ricardo-valenca"` — slug literal vira fallback de UUID.
- ✅ Correto: se `professionalIdFromMeta` ausente, não renderizar SchedulingWidget. Mostrar mensagem "Aguardando vínculo médico" ou logar erro estrutural.

**Por quê o slug-fallback é pior que não-renderização:**
- Widget abre, paciente acha que vai funcionar
- Query no banco falha (UUID inválido)
- Slots não carregam, paciente vê widget vazio/quebrado
- Ninguém recebe alerta — falha silenciosa
- Débito técnico mascarado como feature funcional

**Sinal de que está caindo no anti-pattern:** Fallback hardcoded com nome humano/slug em campo que deveria ser UUID/token.

## Como aplicar (checklist antes de qualquer commit)

1. Esta ação tem consequência real (UI/banco/cobrança)? → Se sim, gatilho deve ser evento explícito, não inferência LLM
2. Este campo é UUID/ID? → Se sim, fallback só pode ser `null` ou erro — nunca string que finge ser ID
3. Esta lógica `if (texto.includes(palavra))` decide algo concreto? → Se sim, é candidato a virar evento explícito
4. Este "funciona aparentemente" tem path de falha silenciosa? → Investigar antes de marcar como done

**Why:** O GPT review de 27/04 (~13h BRT) flagou ambos os anti-patterns no mesmo ponto: trigger prematuro de agendamento por inferência de palavra + fallback de slug "ricardo-valenca" para UUID. Os dois sintomas, mesma raiz: confiar em texto onde deveria haver evento, e mascarar ausência de dado com valor "amigável".

**How to apply:**
- Quando vir `if (text.includes(...))` decidindo abrir UI/disparar pipeline → flagrar
- Quando vir fallback string em campo UUID → flagrar
- Antes de aprovar fix, perguntar: "Isso é evento ou inferência? Isso é tipo certo ou parecido?"
