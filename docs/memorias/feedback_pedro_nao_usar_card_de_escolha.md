---
name: feedback_pedro_nao_usar_card_de_escolha
description: Pedro não gosta do card de múltipla escolha (AskUserQuestion). Perguntar em texto corrido ou prosseguir com a recomendação.
metadata: 
  node_type: memory
  type: feedback
  originSessionId: 6742fef8-9d20-43d8-a8d8-8853df0c89e9
---

Pedro **não gosta** do tool de card de múltipla escolha (AskUserQuestion). Rejeitou-o várias vezes na sessão de 21/05/2026 e disse explicitamente *"vc mandou um card para escolher, não gosto disso"*.

**Why:** o card quebra o ritmo da conversa e formaliza demais decisões que ele resolve rápido em texto. Pedro trabalha em fluxo conversacional contínuo, com momentum. Quando ele diz *"tudo certo"*, *"pode"*, *"perfeito"*, *"ok"* — é sinal de **prosseguir com a recomendação**, não de querer escolher entre opções formatadas.

**How to apply:**
1. **Não usar AskUserQuestion com o Pedro.** Nunca.
2. Quando uma decisão for necessária: (a) apresentar a recomendação em texto e seguir com ela, mencionando o que foi assumido; ou (b) fazer a pergunta inline, curta, 1-2 linhas, no corpo da resposta.
3. Decisão com recomendação clara → **prosseguir** e avisar o que assumiu, não perguntar.
4. Só parar pra perguntar quando a escolha realmente bifurca o trabalho E não há recomendação óbvia — e ainda assim, em texto.

Conecta com [[feedback_regra_operacional_canonica_06_05]] (fluxo de trabalho com o Pedro).
