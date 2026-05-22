---
name: feedback_matrix_vies_suavizacao_primeira_passada_21_05
description: "Nôa Matrix suaviza padrão na primeira passada (declara mais forte/contínuo do que o corpus sustenta), mas corrige limpo sob desafio e admite limites — viés monitorado, não bloqueador."
metadata: 
  node_type: memory
  type: feedback
  originSessionId: 6742fef8-9d20-43d8-a8d8-8853df0c89e9
---

A Nôa Matrix tem um **viés de suavização de primeira-passada**: na primeira vez que descreve um padrão, ela inclina para "tem padrão" — declara mais forte, mais contínuo ou mais frequente do que o corpus sustenta.

Detectado empiricamente no teste de 5 turnos de 21/05/2026 (caso dor no pé do paciente #6ACF, 4 datas — 07/05, 11/05, 13/05, 19/05):
- **Turno 1**: disse que a irradiação "se mantém após aparecer" — mas o padrão real era intermitente (07 não / 11 sim / 13 não / 19 sim).
- **Turno 5**: na síntese final do dossiê, disse "menção frequente de 'perto da articulação'" — sendo que era 2 de 4 datas (50%).

**O que NÃO acontece — e é o que salva:** sob desafio do médico ela corrige limpo, sem defensividade, sem dobrar a aposta; faz auto-audit honesto (não fabrica mea-culpa falso — no turno 2 checou a intensidade e disse corretamente "essa estava certa"); e admite o limite epistêmico ("com o que tenho no corpus não consigo distinguir padrão real de variação descritiva"). Nunca fabricou certeza falsa.

**Why:** é uma versão LEVE da mesma tendência que o aviso do Casos Similares alerta ("pode produzir falsa sensação de evidência ou recorrência"). Em formato one-shot não-conversacional seria perigoso. O risco residual concreto: um médico apressado que NÃO cutuca recebe a versão suavizada e pode levar uma falsa sensação de padrão.

**How to apply:**
1. A mitigação real é o **formato conversacional** — o médico pode e deve cutucar; a conversa É a mitigação. Coisa que o matching textual one-shot do Casos Similares não permite. Ver [[feedback_matrix_prolonga_vs_casos_similares_infere_20_05]].
2. Refinamento concreto **parqueado** (mexe no Edge RESEARCH_PROMPT): exigir **denominador explícito** — "ao apontar padrão temporal, declarar sempre a fração (ex: '2 de 4 datas'); nunca usar 'constante/frequente/se mantém' sem o número". Mata o viés na origem. Trigger: próxima janela de deploy do Edge tradevision-core.
3. **Não é bloqueador do beta 20-30** — a Matrix faz o trabalho central (estruturação longitudinal, honestidade sob pressão, utilidade concreta) e o Z2 aguentou os 5 turnos. É viés monitorado, não defeito impeditivo.

Conecta com [[feedback_z2_nao_e_burrice_voz_intelectual_19_05]] (Z2 estrutura, não é vago) e [[project_v1_9_388_matrix_log_empirico_20_05]] (honestidade epistemológica — teste dos Beagles).
