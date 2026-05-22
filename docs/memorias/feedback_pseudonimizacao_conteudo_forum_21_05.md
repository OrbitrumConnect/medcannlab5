---
name: feedback_pseudonimizacao_conteudo_forum_21_05
description: "O conteúdo do post do Fórum (síntese do dossiê) podia vazar o nome real do paciente. V1.9.407 fechou o vetor sistemático (cards 'case'); resíduo histórico permanece."
metadata: 
  node_type: memory
  type: feedback
  originSessionId: 6742fef8-9d20-43d8-a8d8-8853df0c89e9
---

Pedro perguntou 21/05: o post publicado no Fórum mostrava *"paciente Pedro"* / *"Caso #X (Pedro Paciente)"* — **nome real no conteúdo**, mesmo o médico tendo atestado "discussão pseudonimizada" no consent. Pergunta certa — achou um furo real.

**A causa (sistemática):** o `body` do card `case` em `NoaMatrixView` formatava `Caso #X (patientName)`. Esse `body` → contexto da Matrix → síntese do dossiê → `content` do `forum_post` (visível a outros profissionais). Os cards `patient-report`/`patient-rationality` já usavam pseudônimo (V1.9.384); os `case` não.

**Fix V1.9.407** (commit `f866c44`): o `body` do card `case` deixou de incluir `patientName` — só `Caso #` (identificador pseudonimizado). O nome real ficou só no `title` do card (UI do médico, não vai pro fórum). Vetor sistemático fechado.

**Resíduo conhecido (NÃO fechado pelo V1.9.407):**
- Excertos de racionalidade (`assessmentExcerpt`) podem ter o nome embutido em **dado histórico** — não é bug de formatação, é qualidade de dado antigo. Conecta com [[feedback_drift_historico_dev_aceitavel_pre_pmf_18_05]].
- Texto livre do médico (notas, mensagens digitadas à Matrix) — se o médico digitar um nome, ele viaja. Sanitizar texto livre é difícil; o modal de consent pode lembrar "evite nomes reais".

**Why — calibração:** o plano F4 (`project_f4_forum_plano_e_audit_21_05`) disse que a pseudonimização vinha "herdada do dossiê #6ACF". Isso era **otimista demais** — o CAMPO `patient_pseudonym` vem pseudonimizado, mas o CONTEÚDO (texto da síntese) não era sanitizado. O audit do 18/05 (`audit_forum_3_bloqueios_pre_publicacao_18_05`) listava "pseudonimização fraca" como bloqueador — estava certo.

**How to apply:** antes do 1º paciente externo real publicar no Fórum, tratar o resíduo (excertos de racionalidade + lembrete no consent). Hoje pré-PMF, zero pacientes externos — não urgente, mas é bloqueador de Marco 2. V1.9.407 fechou a parte sistemática; a pseudonimização do Fórum NÃO está 100% — está reduzida.
