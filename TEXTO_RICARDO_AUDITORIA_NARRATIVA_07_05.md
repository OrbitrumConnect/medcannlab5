# 📨 Rascunho pra Ricardo — Auditoria empírica do parágrafo institucional

**Preparado:** 07/05/2026 ~01h30 BRT
**Status:** PRONTO pra Pedro copiar/enviar quando decidir canal/timing
**Não enviado ainda** — Pedro decide (WhatsApp / email / sessão presencial)

---

## 🟢 VERSÃO CURTA (WhatsApp, ~250 palavras)

> Ricardo,
>
> Passei o parágrafo institucional pelo crivo empírico — código + banco + Edge Functions. Levantei 4 níveis de evidência (🟢 confirmado / 🟡 parcial / ⚪ interpretação / 🔴 sem prova).
>
> **🟢 Sólido pra captação:** FSM 19 fases, Verbatim First (24 ocorrências), 28 PHASE LOCKs, Pipeline auditável, 5394 logs granulares, ICP-Brasil REAL deployado (3 prescriptions tuas signed desde ontem!), CFM 2.314 trigger anti-fraude ATIVO, Realtime 12 tabelas, Clinical Team Command Center, dual provider videoconsulta validado.
>
> **🟡 Gap declarado:** governança epistemológica é robusta em hard-lock AEC, mas o modo institucional/orientação do system prompt tem ~50 palavras genéricas — quando a Nôa explicou AEC pra ti em chat livre, ela parafraseou. Solução cirúrgica engatilhada (~50 LOC), aguarda nossa aprovação antes de tocar CORE.
>
> **🔴 Trechos pra ajustar antes de pitch institucional:**
> - "Fine-tuning estabilizou cadência" → modelo é gpt-4o BASE, sem fine-tune. **Cadência vem da arquitetura, não do modelo.**
> - "Espelhamos GPTs Nôa Esperanza na API" → projetado, mas Assistants API NÃO é usada em prod (Edge usa Chat Completions).
> - "Memória vetorial" → vector store está no assistant antigo desativado. **Memória real é Postgres relacional auditável** (5394 logs + 98 reports + 61 AECs + 38 prescriptions). É VANTAGEM em ambiente clínico de compliance.
>
> **Frase que sobreviveu à auditoria** (vale guardar):
> *"A cadência da Nôa emerge da arquitetura de governança, não do modelo."*
>
> Detalhamento completo no diário 07/05 BLOCO A. Quando puderes, te passo a versão calibrada do parágrafo.

---

## 🟡 VERSÃO MÉDIA (email, ~600 palavras)

**Assunto:** Auditoria empírica do parágrafo institucional — narrativa auditada vs realidade do app

> Ricardo,
>
> Levei o parágrafo institucional que escrevemos a 4 mãos (você + GPT + eu) pelo crivo empírico — código + banco + Edge Functions, validação via PAT. Aplicamos 4 níveis de evidência: 🟢 confirmado / 🟡 parcial / ⚪ interpretação legítima / 🔴 sem prova no código atual.
>
> **🟢 16 afirmações sólidas (defensáveis em due diligence):**
> - FSM clínica 19 fases (clinicalAssessmentFlow.ts)
> - Verbatim First V1.9.86 (24 ocorrências, model_version registrado)
> - 28 PHASE LOCKs no system prompt
> - Fechamento Consensual (3 sub-fases dedicadas)
> - Retomada de sessão (INTERRUPTED + CONFIRMING_RESTART + ConversationState)
> - Realtime: 12 tabelas em supabase_realtime publication
> - Auditoria: 5394 noa_logs (12 tipos distintos, 243 nas últimas 24h) + 8 tabelas log/audit
> - Pipeline: 98 clinical_reports com signed_hash
> - 61 avaliações AEC FSM completas
> - ICP-Brasil REAL deployado (PKCS#7 RFC 3852, validado com openssl smime -verify)
> - **3 cfm_prescriptions tuas signed** desde ontem 23h (era 1 → tu testou ICP real, validado empiricamente)
> - CFM 2.314 imutabilidade trigger ATIVO (anti-fraude pós-assinatura)
> - Clinical Team Command Center deployado (V1.9.186-188)
> - Dual provider videoconsulta validado em produção (smoke 06/05 14:55)
> - pg_cron 2 jobs ativos (reminders 5min + monthly closing)
> - TradeVision Core herança preservada (archive/tradevisioniamedcannlab.txt 18.112 LOC)
>
> **🟡 4 áreas com gap declarado (não esconder, dá maturidade):**
> 1. Governança epistemológica é robusta em hard-lock AEC, mas o modo institucional/orientação tem ~50 palavras genéricas — quando você perguntou pra Nôa "explica AEC correlacionando com módulos do curso" em 22:45 BRT 06/05, ela parafraseou em 6 etapas livres em vez de citar as 10 etapas oficiais OU os 3 atos macro. Solução cirúrgica engatilhada.
> 2. Anti-drift protege em fases AEC (100% bypass GPT em hard-lock), mas chat livre conceitual permite paráfrase.
> 3. IA conversacional governada — arquitetura sim, mas modelo é gpt-4o BASE.
> 4. IA "residente" — identidade via system prompt, mas Assistants API não está sendo usada em produção.
>
> **🔴 4 afirmações que vale calibrar antes de pitch:**
>
> 1. *"Fine-tuning estabilizou comportamento-base / cadência"*
>    → Não há fine-tuned model em uso. Modelo é gpt-4o BASE + gpt-4o-mini (escriba). Os 10 assistants OpenAI antigos podem ter tido fine-tune, mas isso ficou desativado quando migramos pro tradevision-core monolito.
>    **Substituir por:** *"Engenharia de prompt + Verbatim First + 28 PHASE LOCKs + 19 fases FSM estabilizam comportamento-base. A cadência da Nôa emerge da arquitetura de governança, não do modelo."*
>
> 2. *"Espelhamos os GPTs da conta Nôa Esperanza dentro da API"*
>    → Foi projetado (noaAssistantIntegration.ts existe com asst_id hardcoded) mas DESATIVADO em produção (apiKey vazia, fallback pro Edge). Chamadas reais usam Chat Completions, não Assistants API.
>    **Substituir por:** *"Os 10 assistants OpenAI (abr-out 2025) foram laboratório conceitual histórico. O conhecimento destilou-se no system prompt do tradevision-core monolito (v340), que opera com Chat Completions sob governança própria de 8 camadas."*
>
> 3. *"Memória vetorial / vector store"*
>    → Se existe, está dentro do assistant OpenAI desativado. Memória institucional REAL viva é Postgres relacional: 5394 logs + 98 reports + 61 assessments + 38 prescriptions. Em ambiente clínico de compliance, **isso é VANTAGEM** (mais auditável que embedding).
>
> 4. *"Inteligência operacional vem do modelo"*
>    → Modelo é commodity. Inteligência vem da topologia.
>    **Substituir por:** *"Temos uma arquitetura clínica governada que usa LLMs como motor linguístico dentro de um sistema auditável. LLM ≠ sistema. Comportamento depende de contexto, fase, roteamento, lock, prompt, FSM, e topologia."*
>
> **Gargalo empírico que NÃO escondi (anti-autoengano startup):**
> 92.7% das cfm_prescriptions ficam DRAFT (38/41). O ciclo humano de cuidado COMPLETO ainda não está fechando empiricamente. **Esse é o KPI clínico real do projeto agora** — declarar o gargalo > esconder.
>
> **Frase canônica que sobreviveu à auditoria** (GPT validou: "essa frase sozinha já diferencia vocês de muito projeto AI-native superficial"):
>
> > *"A cadência da Nôa emerge da arquitetura de governança, não do modelo."*
>
> Tudo registrado em DIARIO_07_05_2026.md BLOCO A + memória persistente. Quando puderes opinar, atualizo o parágrafo institucional v15 → v16 com as substituições calibradas + correção 3 atos (que tu já corrigiste no WhatsApp 05/05).
>
> Lock V1.9.95+97+98+99-B intocado em 100% dos artefatos. Anti-regressão sagrada preservada.

---

## 🔴 NÃO USAR (versão tendenciosa)

NÃO mandar versão que:
- Inflar conquistas além do verificável
- Esconder gargalo 92.7% DRAFT
- Afirmar "fine-tuning ensinou" como fato
- Apresentar Assistants API espelhamento como ativo
- Usar "memória vetorial mágica" sem qualificar

---

## 📌 Decisão Pedro pendente

```
[ ] Versão CURTA (WhatsApp ~250 palavras)
[ ] Versão MÉDIA (email ~600 palavras)
[ ] Apenas falar pessoalmente (próxima sessão presencial)

Canal:
[ ] WhatsApp Ricardo
[ ] Email rrvalenca@gmail.com
[ ] Comentário em doc compartilhado
[ ] Aguardar próxima sessão presencial

Tom:
[ ] 1ª pessoa (Pedro fala)
[ ] "Pedro+Claude apuraram juntos"
[ ] "Pedro auditou via PAT" (mais técnico)

Timing:
[ ] Agora 01h30 BRT (Ricardo dorme — provável)
[ ] Manhã 07/05
[ ] Junto da próxima reunião presencial
```

---

*[Rascunho pronto. Pedro lidera, eu apoio. Não envio sem autorização explícita.]*
