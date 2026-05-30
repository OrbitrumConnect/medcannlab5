---
name: sistema-tem-contexto-demais-falta-semantica-clinica-28-05
description: "PRINCÍPIO META cristalizado 28/05 manhã após auditoria empírica via PAT front+back do Matrix corpus. Pivot epistemológico: o problema NÃO é falta de dados, é EMBARALHAMENTO SEMÂNTICO entre fontes. Quando médico diz 'falta contexto', frequentemente significa 'tem contexto demais mal-organizado'. Exemplo empírico nuclear (descoberto hoje): aba Evolução de PatientsManagement.tsx mistura clinical_assessments FOLLOW_UP (18 rows evolução médica) + clinical_reports (145 rows AEC) + patient_medical_records (6070 rows chat IA paciente↔Nôa) como se fossem equivalentes. Ricardo sentia 'difuso' não porque faltava dado — porque 3 dimensões clínicas distintas estavam justapostas como iguais. Pivot meta: ANTES de adicionar nova fonte ao corpus IA, validar empíricamente se as fontes existentes estão SEMANTICAMENTE separadas. Aplicável a TODA decisão de RAG/corpus expansion futuro. Conecta com [[feedback_validacao_empirica_screenshot_maior_que_plano_teorico_28_05]] (validar empírico antes de codar) + V1.9.318 lock (RAG molda cognição). Frase âncora: 'O problema não é falta de dados — é falta de separação epistemológica entre as fontes'."
metadata: 
  node_type: memory
  type: feedback
  originSessionId: 00be2b9f-5dbc-4236-a02e-1459c3f57bd2
---

# 🎯 Sistema tem contexto demais — falta semântica clínica — princípio meta (28/05 manhã)

## Regra

ANTES de adicionar nova fonte ao corpus IA (RAG, Matrix, sidecar, qualquer), validar empíricamente:

1. **As fontes existentes estão SEMANTICAMENTE separadas no UI/UX?**
2. **O médico distingue empíricamente as dimensões clínicas?**
3. **Adicionar nova fonte vai resolver UM problema OU empilhar mais ambiguidade?**

Se a resposta a #1 ou #2 for "não", a solução **NÃO é adicionar mais corpus**. É **separar semanticamente o que já existe**.

**Why**: validado empíricamente 28/05 via PAT front+back. Ricardo pediu "Matrix deve ler mais do prontuário (evoluções, plano, timeline)". Auditoria revelou que:
- `clinical_assessments` WHERE `FOLLOW_UP` (18 rows) = evolução médica real
- `clinical_reports` `initial_assessment` (145 rows) = AEC
- `patient_medical_records` `chat_interaction` (6070 rows) = diálogo IA paciente↔Nôa

Os 3 estavam **misturados na MESMA aba "Evolução"** em `PatientsManagement.tsx` linhas 1055-1162 (`loadEvolutions`), entrando como "Avaliação"/"Registro médico"/"Evolução" sem distinção visual. Ricardo via aba cheia, sentia "difuso", concluía "Matrix não lê" — quando o problema era que **3 dimensões clínicas distintas estavam justapostas como equivalentes**.

**How to apply**:

### Antes de aceitar pedido "X deve ler mais Y"

1. ✅ Mapear via PAT TODAS as fontes que já existem pra dimensão Y
2. ✅ Verificar empíricamente no UI se as fontes estão **separadas semanticamente**
3. ✅ Se NÃO separadas: priorizar SEPARAÇÃO antes de EXPANSÃO
4. ✅ Se separadas mas pouco visíveis: priorizar VISIBILIDADE antes de EXPANSÃO
5. ✅ Só EXPANDIR corpus quando #2/#3/#4 estiverem empíricamente OK

### Anti-padrões a vigiar

- ❌ Aceitar "falta contexto" como verdade direta sem auditar empíricamente o estado atual
- ❌ Adicionar fonte ao corpus sem verificar se a anterior está bem-organizada
- ❌ "Mais inteligência = mais fontes" — frequentemente é o oposto (mais ruído)
- ❌ Confundir "tem dado mas Matrix não lê" com "tem dado mal-organizado que Matrix lê parcialmente"

### Pattern correto

- ✅ Validar empíricamente o gap antes de propor solução
- ✅ Distinguir "falta de dados" (build feature) vs "falta de semântica" (refator + UX)
- ✅ Refator semântico pode resolver 80% do problema sem aumentar superfície técnica
- ✅ Anti-Babylon: "menos IA bem organizada > mais IA misturada"

## Caso empírico nuclear (descoberto via auditoria PAT 28/05)

### O que Ricardo disse

> *"Matrix deve analisar todos os documentos do prontuário, não só relatórios AEC. Pode ler evoluções, plano terapêutico, linha do tempo... Gerei um dossier muito bom que já deveria ficar no prontuário do paciente também."*

### Tradução literal (modelo "mais IA"):
> Matrix está incompleta. Precisa expandir corpus.

### Tradução empírica via PAT (modelo "mais semântica"):
> Sistema TEM as 3 fontes (evolução FOLLOW_UP + AEC + chat IA). Aba "Evolução" mostra TODAS misturadas. Ricardo VÊ ruído + Matrix lê só 1 fonte → conclui "Matrix limitada". O gap REAL é **separação semântica entre fontes**, não falta delas.

### Solução errada (caminho Babylon)
- Matrix lê automaticamente: clinical_assessments + clinical_reports + patient_medical_records (chat) + appointments.notes + physician_research_dossiers (5 fontes empilhadas)
- Resultado: DOC_LIST hijacking (V1.9.318), ruído, latência, confusão cognitiva, e ainda médico continua sem entender o que é o quê

### Solução correta (anti-Babylon)
- **Camada 1.5** primeiro: aba "Evolução" SEPARA visualmente as 3 fontes (não mistura)
- **Camada 1.4**: toggle médico escolhe o que Matrix lê (V1.9.318 mitigation)
- **Camada 1.2**: Matrix lê só `FOLLOW_UP` (evolução real médica, 18 rows) como expansion primária
- chat_interaction (6070 rows) FICA FORA do default — opt-in apenas

## Princípio derivado pra arquitetura geral MedCannLab

> **Mais valor frequentemente nasce de SEPARAR o que está junto do que de ADICIONAR o que não existe.**

Aplicável a:
- Matrix corpus expansion (caso original)
- Dashboard paciente (V1.9.479 — hierarquia visual AEC vs 5 botões)
- UX prontuário profissional (separar 3 fontes na aba Evolução)
- Racionalidades (dual-write jsonb vs tabela — divergência por design, separação explícita)
- Audience Contract V1.9.330 (paciente vs médico — separação semântica do que cada um vê)

## Conexões com princípios já cristalizados

- [[feedback_validacao_empirica_screenshot_maior_que_plano_teorico_28_05]] — validar empírico antes de propor (caso aplicado: auditoria PAT antes de codar Camada 2)
- [[feedback_dual_write_contract_jsonb_vs_tabela_18_05]] — separação semântica de fontes paralelas
- [[feedback_polir_nao_inventar]] — refator/separar > criar paralelo
- [[feedback_rag_truncation_endemico_17_05]] (parqueada) — RAG sem boundary semântica vira ruído
- [[reference_lock_v1_9_388_a3_ancoragem_regulatoria_multicamada_27_05]] — boundary epistemológica também é boundary regulatória
- [[project_matrix_roadmap_camadas_1_2_3_28_05]] — aplicação direta deste princípio (Camada 1.5 antes de Camada 1.2)

## Frase âncora

> *"O problema não é falta de dados — é falta de separação epistemológica entre as fontes. Mais valor nasce de separar o que está junto, do que adicionar o que não existe. Validação empírica via PAT mostra: sistema já tem contexto demais mal-organizado, NÃO falta contexto."*

## Próxima sessão Claude que receber pedido "X deve ler/usar mais Y"

ANTES de propor solução técnica, fazer **3 perguntas empíricas**:

1. *"Que fontes Y existem hoje? (PAT mapeia)"*
2. *"Elas estão separadas semanticamente no UI atual?"*
3. *"O médico distingue empíricamente o que é cada uma?"*

Se NÃO a #2 ou #3: **a solução é separação semântica, não expansão de corpus.**
