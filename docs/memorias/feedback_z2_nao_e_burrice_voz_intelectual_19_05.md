---
name: Z2 estrutural ≠ Z2 burra — princípio voz intelectual
description: Princípio arquitetural cristalizado Pedro 19/05 noite — Z2 não-diretivo clínico não significa Z2 sem voz conversacional. Aplicável a Matrix, Fórum, Dossiê, BYO-LLM.
type: feedback
originSessionId: 6742fef8-9d20-43d8-a8d8-8853df0c89e9
---
## A regra

**Z2 estrutural NÃO é Z2 burra.** A distinção é entre dois eixos diferentes:
- Eixo CLÍNICO: Z2 não-diretiva — não prescreve, não diagnostica, não categoriza por doença, não navega, não agenda
- Eixo CONVERSACIONAL: Z2 É intelectual — pondera, debate, levanta tensões estruturais, pergunta de volta, expressa dúvida própria, progride entre turnos

Confundir os dois eixos foi o erro do V1.9.387 (Bloomberg Terminal seco) — eu interpretei "anti-tique GPT" como "anti-conversação" e travei a voz. Pedro corrigiu cirurgicamente: "se não tiver isso, qual sentido?".

## Why
Sem capacidade de debate, a Nôa Matrix vira agregador de cards (Notion glorificado) — médico tem zero motivo pra usar vs colar texto no ChatGPT pessoal. O ponto inteiro da Matrix é ser **interlocutora intelectual do médico pós-relatório dentro do sistema regulado**.

A regulação acontece pela proibição CLÍNICA literal (palavras banidas V1.9.385, categorias diagnósticas, terapêutica), não pela limitação CONVERSACIONAL. Voz natural + proibições clínicas = Z2 funcional. Voz robótica = Z2 disfuncional.

## How to apply
Aplicar SEMPRE que projetar feature "não-diretiva" no MedCannLab:

1. **Distinguir os 2 eixos explicitamente** no prompt/UX:
   - O QUE não pode dizer (clínica): lista literal de palavras banidas
   - COMO pode falar (conversacional): tom contralto, debate, perguntas de volta
2. **NÃO usar** "Bloomberg Terminal seco", "console estrutural", "não professoral" — esses matam voz
3. **USAR** "voz intelectual", "debate estrutural", "interlocutor", "ponderar"
4. **Exemplo CERTO** sempre em formato conversacional, não bullets cirúrgicos
5. **Permitir explicitamente** no prompt: "pode dizer 'noto que', 'me intriga', perguntar de volta, expressar dúvida"

## Anti-padrões identificados
- "Não professoral, não didático, não simpático-comercial" → travou voz (V1.9.387, erro meu)
- Proibir "Vamos analisar" como tique GPT → matou abertura conversacional natural
- Forçar gpt-4o-mini pra economia em chat Z2 complexo → mini perde fidelidade a system prompt com proibições literais (V1.9.379-B, revertido V1.9.388-A.3)
- Estrutura "CASOS / PADRÕES / QUESTÕES" obrigatória a cada turno → re-estrutura em loop em vez de progredir conversa

## Aplicabilidade futura (features que dependem deste princípio)
- **Nôa Matrix V1.9.388-A.3+** (validado empíricamente 19/05)
- **Fórum sala Z2** (memory `project_ricardo_19_05_forum_validation_features_solicitadas`)
- **Dossiê do médico** (F3 da visão final eixo Pesquisa)
- **BYO-LLM provider config** (memory `project_byo_llm_arquitetura_parqueada_19_05`)
- Qualquer conselheiro editorial / mentor IA pós-publicação (memory `feedback_pesquisa_materializacao_tese_ricardo_19_05`)

## Frase âncora Pedro 19/05 ~21h BRT
> "Se não tiver isso, qual sentido?"

## Material empírico de validação
- Conversação 19/05 noite via WhatsApp + chat Matrix produção
- Log Edge tradevision-core: turno 3 `tokensUsed: 5488 model: gpt-4o-2024-08-06` retornou análise substantiva 2818 chars com debate honesto
- Trecho-prova (Matrix V1.9.388-A.3): "Os papers marcados não parecem ter uma conexão direta com as queixas do paciente #6ACF, mas podem oferecer insights..." — voz intelectual com dúvida própria, Z2 mantido
