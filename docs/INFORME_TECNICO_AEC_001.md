# 🩺 Informe Técnico: Estabilização do Protocolo AEC 001 (Eixo Clínico)

**Versão:** 1.0 (Titan 3.2 Gold)  
**Status:** ESTÁVEL / BLINDADO  
**Responsável:** Antigravity (IA Resident Engineering)  
**Data:** 12 de Abril de 2026

---

## 1. Sumário Executivo
Este documento detalha as intervenções realizadas no Core da plataforma para estabilizar a **Avaliação Clínica Inicial (AEC 001)**. Foram resolvidos loops lógicos no motor de estados, falhas de gatilho de finalização (tags invisíveis) e erros de sintaxe de banco de dados que impediam a geração atômica de relatórios.

---

## 2. Diagnóstico dos Problemas Anteriores

### A. Loop de "O que mais?" (Histórico Médico)
*   **Sintoma:** Ao chegar na etapa de Histórico Médico, a IA repetia a pergunta inicial ("Desde o nascimento..."), mesmo após o paciente responder.
*   **Causa Raiz:** No `tradevision-core/index.ts`, a governança de "Próxima Pergunta Obrigatória" estava engessada (Hard-Coded). Toda vez que o sistema detectava a fase `MEDICAL_HISTORY`, ele sobrescrevia a dica dinâmica do motor de avalanche com a pergunta de abertura da fase, ignorando o progresso real da conversa.
*   **Impacto:** Quebra da naturalidade e irritação do paciente.

### B. Falha no Gatilho de Finalização (`[ASSESSMENT_COMPLETED]`)
*   **Sintoma:** Após o consentimento, a IA dava a mensagem de sucesso, mas o sistema não "fechava" a sessão nem gerava o relatório PDF.
*   **Causa Raiz:** O gatilho era puramente generativo. Dependíamos que o GPT "lembrasse" de incluir o token invisível `[ASSESSMENT_COMPLETED]`. Em respostas longas, a IA frequentemente omitia a tag, quebrando o receptor no Frontend.
*   **Impacto:** Relatórios não salvos no banco e necessidade de intervenção técnica.

### C. Erro de Sintaxe UUID (`doctor_id`)
*   **Sintoma:** Mensagem `invalid input syntax for type uuid: "ricardo-valenca"` no log do servidor.
*   **Causa Raiz:** O sistema estava tentando salvar o **Slug** do médico (`ricardo-valenca`) em campos de chave estrangeira que exigem o **UUID** real (36 caracteres) no PostgreSQL.
*   **Impacto:** Falha total no `insert` da tabela `clinical_reports`.

---

## 3. Implementação das Soluções (O Novo Funcionamento)

### 3.1. Governança Dinâmica de Perguntas
O Core (`index.ts`) foi modificado para ser **reativo** e não **proativo**:
- O `nextQuestionHint` agora prioriza o valor vindo do motor `ClinicalAssessmentFlow`.
- Se o motor diz "O que mais?", o Core sela "O que mais?".
- As perguntas longas de abertura agora funcionam como *fallbacks* (apenas se o hint estiver vazio).

### 3.2. Gatilho de Finalização Blindado (Hard-Injected)
Para garantir a conclusão determinística:
- Removida a dependência da "memória" da IA.
- O Core agora possui um **Interceptor de Fechamento**. Se a fase é `CLOSING` ou `COMPLETED`, o servidor anexa automaticamente o token `[ASSESSMENT_COMPLETED]` ao final da string de resposta.
- **Resultado:** O trigger agora é 100% confiável.

### 3.3. Tradutor de Identidade (Slug to UUID)
Implementada camada de lookup dinâmico:
- O sistema detecta o profissional pelo nome/slug na fala.
- Captura o `UUID` real (`id`) do banco.
- Armazena o UUID em `detectedProfessionalUuid` para uso exclusivo em operações de banco (SQL).
- Mantém o Slug apenas para metadados legíveis.

### 3.4. Refino do Motor de Parada (`meansNoMore`)
O motor AEC agora entende referências:
- Além de "não", "nada" e "só", ele agora aceita: "já disse", "anteriormente", "como comentei".
- Isso evita que a IA insista em listas que o paciente já considera encerradas.

---

## 4. Fluxo de Operação (Cenário Ideal)

1.  **Abertura:** IA se apresenta e inicia AEC.
2.  **Lista:** IA usa "O que mais?" dinamicamente, governada pelo motor.
3.  **Histórico:** IA avança de fase assim que detecta encerramento (sem repetir perguntas longas).
4.  **Consentimento:** Ao ouvir "concordo", o Core injeta o trigger atômico.
5.  **Persistência:** O sistema traduz "Ricardo Valença" para o UUID do banco e salva o relatório via GPT-Extraction (Garantindo que mesmo dados perdidos localmente sejam recuperados da conversa).

---

> [!IMPORTANT]
> O Protocolo AEC 001 está agora em estado **Titan 3.2 Gold**. Nenhuma lógica de repetição ou falha de UUID deve ocorrer se os arquivos `index.ts` e `clinicalAssessmentFlow.ts` forem mantidos com estas modificações.

**Assinatura:**
*Antigravity v1.0 — IA Residente Engineering Lab* 🦾🩺🧬
