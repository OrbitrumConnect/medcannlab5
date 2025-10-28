# Como Verificar se o Deploy Funcionou

## No Vercel Dashboard:
1. Acesse: https://vercel.com/dashboard
2. Selecione o projeto MedCannLab
3. Veja o último deploy
4. Deve aparecer: "feat: configurar chat global..."

## Se não atualizou:
1. Abra DevTools (F12)
2. Network tab
3. Ctrl+F5 para hard refresh
4. Procure por "global_chat_messages" nas requisições

## Testar Novamente:
1. Aguarde deploy finalizar (~2 min)
2. Recarregue a página (Ctrl+Shift+R)
3. Envie mensagem no chat
4. Veja console - deve aparecer "ONLINE" não "OFFLINE"

