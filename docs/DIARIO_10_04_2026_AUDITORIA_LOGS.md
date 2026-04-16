# DIÁRIO DE BORDO: 10 DE ABRIL DE 2026
## Auditoria de Logs de Produção e "Hardening" (Endurecimento do Sistema)

### 🚨 O Diagnóstico Frontal dos 3 Grandes Bugs
Hoje validamos a teoria com a prática crua: pegamos os logs de tela do celular/computador do Dr. Ricardo tentado usar a plataforma em vida real. Encontramos **3 problemas de estabilidade**, que após auditoria externa do LLM Sênior (GPT), apontou para a mesma conclusão: Não temos um problema arquitetural profundo, temos "falhas de borda e robustez" e precisamos resolver com as seguintes implementações maduras.

---

### 1. O Apagão de Rede (O Loop do Token)
**Fato:** A partir das `19:34`, o app perdeu conexão local com a rede. Em vez de lidar como um aplicativo profissional, a livraria Auth do Supabase fritou o processador da máquina tentando um *infinite retry* invisível.
**Ação Cirúrgica de Engenharia (Anti-Loop):**
- Implementar listener de `navigator.onLine`.
- Se a rede cair, paralisar as tentavas do Supabase. Retornar silencioso ou colocar tela nativa de *"Reconectando"*, matando o consumo e salvando o log.

---

### 2. Agendamento Falho (O Coração SQL: PGCRYPTO)
**Fato:** A RPC falhou clamorosamente porque não achou o `digest('test', 'sha256')`. Sem ela trancada, o sistema de agendamento emite um bloqueio total (`Booking Failed`).
**Ação Cirúrgica de Engenharia:**
- Rodar o exato script isolado: `CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;`
- Imediatamente provar no Query Editor do Supabase se o comando `select digest('test', 'sha256');` emite o hash de retorno, blindando contra futuras quedas.

---

### 3. A Fragilidade do PDF Acoplado (Armazenamento > Extração)
**Fato:** Foi tentado upar um artigo denso. A extração de texto via `pdfjs` bateu numa imagem cifrada e cuspiu erro. Isso fez a UI cancelar irresponsavelmente a subida do próprio arquivo PDF.
**Ação Cirúrgica (Desenvolvimento Resiliente):**
- Separar o cordão umbilical: *Primeiro:* Salvar no `Storage` imediatamente e comemorar com Check no Front-end (O dado físico já está lá).
- *Segundo:* O *Edge Function* tenta a extração com `try/catch`. 
- Se der erro na Extração de texto: Preencher *"Não foi possível ler este papel para ser cruzado contra escores IMRE"* e encerrar graciosamente. Se passar, atualizar do Hub de `content`. 

---

### 🚀 O Veredito de Borda
Nós não estamos mais "construindo uma aplicação". Estamos executando **Endurecimento de Sistema.** 

> *"Nada pode impedir o dado médico de entrar no sistema físico. Mesmo que o LLM falhe."*

---

## 🛠 O Que Foi Físicamente Executado no Código Hoje (Hardening 1.0)
Para que o sistema sobreviva ao caos em produção, realizamos as seguintes cirurgias na master/main:

1. **A Desconexão do PDF e o Banco (Upload Tolerante):**
   - Alteramos `src/pages/Library.tsx`. O upload do Storage agora insere um "Chassi" vazio no Banco de Dados (`is_extracted = false`) **antes** de ler o PDF na memória.
   - Qualquer queima gráfica (`UnknownErrorException`) da extração fará um *downgrade gracioso*: A interface salva o documento, omite o resumo, e marca em amarelo que o arquivo é complexo. Zero dados perdidos.

2. **Supressão do "Loop Infinito de Bateria" (Offline Mode PWA):**
   - Alteramos `videoCallRequestService.ts` e `notificationService.ts`.
   - Incluímos o *Short-Circuit*: `if (!navigator.onLine) return;`. Assim, a livraria de Auth do Supabase não estoura tentando buscar APIs se o paciente passar por um túnel sem sinal ou seu roteador desligar. Fim do `TypeError: Failed to Fetch` massivo.

3. **Injeção do Trigger Administrativo "Conteúdo Digital":**
   - Alteramos `Sidebar.tsx`.
   - Criamos o botão **Conteúdo Digital** com rota `/app/admin/courses` exclusivo para você. É neste HUB que links do YouTube, MP4, gravações do Ricardo Valença e pílulas do Eixo de Ensino (Faveret) serão despejadas para engajar o eixo educacional sem sujar os painéis clínicos.

---

## ⚖️ O Que Precisamos Ajustar no Supabase? (Próximos Passos Obrigatórios)
Agora que a ponte está feita, você precisa obrigatoriamente entrar no **Painel SQL (Query Editor)** do seu Supabase e rodar estes dois blocos para as funções acima ganharem "alma":

1. **Rodar o HotFix do Agendamento (HOJE):** O arquivo `database/scripts/FIX_PGCRYPTO_SCHEDULING.sql` habilita a extensão global `with schema extensions`, caso contrário as RPCs de travar horário continuarão quebrando.
2. **Rodar o Migrador Estrutural do Ensino:** Como vimos no `PLANO_EXECUCAO_EIXO_ENSINO_SEGURO.md`, a *Tabela Canônica* `noa_lessons` ainda não possui as colunas reais para colocar os vídeos MP4 que você vai subir no "Conteúdo Digital". Teremos que rodar o *Fase 1* do plano lá *(Adicionar `video_url`, `pdf_url`)* para que não dê erro ao salvar o vídeo lá dentro.

*Status: Commitado limpo, Pushed para MAIN e Pronto para produção. Esperando o Dr. Ricardo executar as chaves SQL.*
