---
name: matrix-roadmap-camadas-1-2-3-28-05
description: "Roadmap arquitetural Nôa Matrix decomposto em 3 Camadas após auditoria empírica via PAT front+back 28/05. CAMADA 1 (fática, baixo risco, alto valor): consolidar o que JÁ existe — usePatientLongitudinal V1.9.382 carrega 5 reports + 10 rationalidades + pseudonimiza Z2. Decompor em 6 passos incrementais: 1.1 dossier captura patient_id (~1-2h cirúrgica), 1.2 hook expandido pra ler clinical_assessments FOLLOW_UP (18 rows reais), 1.3 ler dossiês prévios mesmo paciente, 1.4 UI toggle médico por fonte (mitiga V1.9.318), 1.5 aba Evolução separa visualmente 3 fontes embaralhadas (gap arquitetural descoberto: PatientsManagement.tsx loadEvolutions linha 1055-1162 mistura clinical_assessments FOLLOW_UP + clinical_reports + patient_medical_records chat_interaction como se fosse equivalente), 1.6 hierarquia semântica (contexto ativo / relevância temporal / eventos-chave / ecos narrativos / mudanças conduta / reflexões persistentes — texto Ricardo). CAMADA 2 (conceitual, requer Ricardo): 2.1 identidade Matrix redefinida ('lente reflexiva da trajetória clínica'), 2.2 dossier vira evento longitudinal na timeline do prontuário, 2.3 feature PLANO TERAPÊUTICO — tabela patient_therapeutic_plans existe mas 0 rows / nunca codada UI = buraco arquitetural REAL (Ricardo: 'momento de decisão clínica ainda não foi institucionalizado no sistema'). CAMADA 3 (relacional, VETADA institucionalmente): modelar trajetória cognitiva médico = Babylon-pattern (Watson Health $5B→$1B), CFM 2.314, V1.9.388-A.3. Alternativa segura: sugerir perguntas complementares anti-espelho. 3 perguntas pendentes Ricardo pra fechar Camada 2. Princípio Matrix-Longitudinal cristalizado: 'modela trajetória do PACIENTE, NÃO modela investigação do MÉDICO'."
metadata: 
  node_type: memory
  type: project
  originSessionId: 00be2b9f-5dbc-4236-a02e-1459c3f57bd2
---

# 🧠 Matrix Roadmap — Camadas 1/2/3 (28/05 manhã, pós-auditoria empírica)

## Origem

Ricardo trouxe princípio epistemológico 28/05 manhã: *"Matrix deve analisar todos os documentos do prontuário, não só relatórios AEC. Dossier deveria voltar pro prontuário. Pode ler evoluções, plano de cuidado, linha do tempo."* Pedro potencializou: *"Matrix/Nôa deveria virar consciência longitudinal do prontuário inteiro"*. Auditoria empírica via PAT front+back 28/05 revelou que **o salto Ricardo está pedindo JÁ COMEÇOU em 19/05 (V1.9.382 usePatientLongitudinal) e ele nem percebeu** + identificou gap arquitetural real (3 fontes embaralhadas como "evolução") + buraco arquitetural ainda mais profundo (feature plano terapêutico nunca codada).

## Estado empírico do sistema (PAT 28/05 14h)

### Fontes de dados (mapeamento empírico)

| Fonte | Rows | Comentário |
|---|---|---|
| `clinical_reports` (`initial_assessment`) | 145 | Fonte principal Matrix hoje via `usePatientLongitudinal` V1.9.382 |
| `clinical_assessments` (`FOLLOW_UP`) | **18 / 9 pacientes / 4 médicos** | ⭐ EVOLUÇÕES REAIS escritas pelos médicos — Matrix NÃO lê |
| `clinical_assessments` (TRIAGE) | 45 / 43 pacientes / 1 médico | Triagem inicial — provável processo único |
| `patient_medical_records` (`chat_interaction`) | **6.070 / 33 pacientes** | Cada turno paciente↔Nôa = 1 row. Período 03/11/2025–28/05/2026 |
| `physician_research_dossiers` | 10 | Dossiês Matrix funcionais |
| `appointments.notes` | 9 com >50ch | Subutilizado |
| `patient_documents` | 2 | Quase vazio |
| `patient_therapeutic_plans` | **0** | ❌ Tabela existe com schema completo (goals jsonb + summary + notes + metadata + started/completed_at) MAS feature NUNCA codada UI |
| `base_conhecimento` | 5 | RAG curado V1.9.318 lock |

### Hooks/serviços já existentes (reusáveis)

| Componente | Versão | Função |
|---|---|---|
| `usePatientLongitudinal` | V1.9.382 (19/05) | Carrega 5 reports + 10 rationalidades + pseudonimiza Z2 + audit log + atrito intencional |
| `casePseudonymization` | V1.9.450 (25/05) | Whitelist clínica (família + HDA + hábitos + perguntas objetivas) preservando LGPD |
| `useDossierPersist` | V1.9.392 (20/05) | Salva dossier em `physician_research_dossiers` — patientId OPCIONAL (gap funcional descoberto) |
| `noa_logs` | Existe | Audit LGPD reusável |
| `NoaMatrixView` | Existe | View Matrix |

### Gap arquitetural CRÍTICO descoberto (PatientsManagement.tsx)

**`loadEvolutions` (linhas 1055-1162) MISTURA 3 fontes na aba "Evolução" sem distinguir**:
- `clinical_assessments` WHERE `FOLLOW_UP` (evolução real médica) — 18 rows
- `clinical_reports` (AEC) — entra como "Avaliação"
- `patient_medical_records` `chat_interaction` (diálogo IA) — entra como "Registro médico"

→ Ricardo vê aba Evolução com 6070 chat IA misturados com 18 evoluções reais. Não distingue. Sente "difuso".
→ Também explica reclamação Ricardo de outro ângulo: ele provavelmente VÊ a aba cheia mas Matrix lê só initial_assessment.

### handleSaveEvolution (linha 1302) — Onde médico ESCREVE evolução

```ts
.from('clinical_assessments')
.insert({
  patient_id: selectedPatient.id,
  doctor_id: user.id,
  assessment_type: 'FOLLOW_UP',
  data: {
    clinicalNotes: evolutionContent,
    type: 'evolution',
    ...
  },
  clinical_report: evolutionContent,
  status: 'completed'
})
```

→ Evolução vai pra `clinical_assessments`, NÃO pra `patient_medical_records` como o load parece sugerir.

## CAMADA 1 — Fática (consolidar o que JÁ existe)

**Princípio**: baixo risco V1.9.318 + alto valor empírico + reusa pattern existente V1.9.382.

| # | Ação | Custo | Trigger empírico |
|---|---|---|---|
| **1.1** | Dossier captura `patient_id` quando Matrix aberta com paciente em foco | ~1-2h | Ricardo 28/05 (caso concreto dossier órfão) |
| **1.2** | `usePatientLongitudinal` expandido lê `clinical_assessments` WHERE `FOLLOW_UP` (18 rows reais hoje) | ~2-3h | Pedido Ricardo direto |
| **1.3** | Matrix lê dossiês prévios do mesmo paciente (continuidade interpretativa) | ~1h | "dossier deve voltar pro prontuário" |
| **1.4** | UI Matrix toggle médico "incluir/excluir" cada fonte | ~2-3h | OBRIGATÓRIO pra liberar 1.2/1.3 com segurança V1.9.318 |
| **1.5** | Aba "Evolução" do prontuário separa visualmente 3 fontes (não mistura) | ~2-3h | Bug arquitetural descoberto hoje |
| **1.6** | Hierarquia semântica (contexto ativo / relevância temporal / eventos-chave / ecos narrativos / mudanças conduta / reflexões persistentes) | ~?? complexo | Quando 1.1–1.5 estabilizar empíricamente |

**Custo Camada 1 total**: ~12-15h dev + smoke matrix. Pode ser feito incrementalmente, cada passo com validação empírica.

### CRÍTICO — não jogar 6070 chat_interaction como default no Matrix

Decisão arquitetural: `patient_medical_records.chat_interaction` NÃO entra no corpus default Matrix (vira ruído). Opt-in apenas via toggle 1.4 + filtro temporal (últimos N dias).

## CAMADA 2 — Conceitual (requer alinhamento Ricardo)

**Princípio**: mexe na constituição epistemológica. Não codar sem Ricardo confirmar boundary.

| # | Ação | Custo | Bloqueador |
|---|---|---|---|
| **2.1** | Identidade Matrix redefinida em UI/copy: "Cann Matrix" → "lente reflexiva da trajetória clínica" | ~2-3h docs + UI | Alinhamento Ricardo (boundary médico/paciente) |
| **2.2** | Dossier aparece na **linha do tempo** do prontuário como tipo de evento ("evento longitudinal interpretativo" — frase texto Ricardo) | ~3-4h | Requer 1.1 funcionando |
| **2.3** | Feature **Plano terapêutico** — tabela vazia, feature nunca codada UI | ~6-10h + decisão Ricardo | **Buraco arquitetural REAL** — Ricardo: "momento de decisão clínica ainda não foi institucionalizado". Antes de Matrix ler plano, plano precisa EXISTIR como feature |

## CAMADA 3 — Relacional (VETADA INSTITUCIONALMENTE)

**Decisão Pedro+Claude 28/05**: VETAR modelagem da trajetória cognitiva do médico.

| # | Ação | Status |
|---|---|---|
| 3.1 | Modelar estilo investigativo médico / foco / construção de hipótese | 🔴 **VETADO** — Babylon-pattern direto (Watson Health $5B→$1B), CFM 2.314, V1.9.388-A.3 lock institucional |
| 3.2 | Alternativa segura: Matrix sugere PERGUNTAS que médico ainda não fez (anti-espelho, pró-complementariedade) | 🟡 Aceitável APÓS Camada 2.1 estabilizada + Ricardo aprovar boundary explícita |

## Princípio Matrix-Longitudinal (cristalizado nesta sessão)

> **Matrix lê tudo que o prontuário registra. Matrix NÃO observa o médico raciocinando. Matrix modela a trajetória do PACIENTE como objeto vivo; o médico segue soberano sobre sua própria investigação.**

Permite Camada 2 com escala (lê evoluções/plano/timeline/dossiês) e VETA Camada 3 (modelar estilo investigativo) em uma única frase.

## 3 perguntas pendentes pro Ricardo (destravar Camada 2)

1. *"Quando você diz 'Matrix lê evoluções', são essas 18 evoluções escritas via Terminal pelos 4 médicos (FOLLOW_UP) — ou as 6070 conversas IA do paciente também?"*
2. *"Matrix lê automaticamente cada vez OU sob comando seu via toggle de fonte?"* (V1.9.318 mitigation)
3. *"Plano terapêutico não existe como feature ainda (tabela vazia, UI nunca codada) — você quer construir a feature primeiro (patient_therapeutic_plans tem schema completo) ou Matrix só lê o que já existe?"*

## Endossos arquiteturais (sessão 28/05)

GPT externo (texto trazido por Pedro) endossou independentemente:
- ✅ Separação Camada 1 (consolidar) vs Camada 2 (conversar) vs Camada 3 (vetar)
- ✅ Veto Camada 3: "modelar estilo investigativo do médico cruza a linha"
- ✅ Alternativa anti-espelho: "sugerir perguntas complementares, não modelar identidade cognitiva"
- ✅ Camada 2 plano terapêutico = "momento de decisão clínica ainda não foi institucionalizado no sistema"
- ✅ Diagnóstico: "Sistema já tem contexto demais — falta semântica clínica entre as fontes"

## Lista hierárquica semântica do texto Ricardo (registrar pra Camada 1.6)

NÃO é hierarquia de fontes (1-7 tabelas) — é hierarquia de **dimensão semântica do caso**:
1. contexto ativo
2. relevância temporal
3. eventos-chave
4. ecos narrativos
5. mudanças de conduta
6. reflexões persistentes

Mais maduro arquiteturalmente que ordenar por fonte. Aplica-se quando 1.4 (toggle médico) já estabelecer corpus.

## Conexões

- [[feedback_sistema_tem_contexto_demais_falta_semantica_clinica_28_05]] — princípio meta cristalizado nesta sessão
- [[feedback_validacao_empirica_screenshot_maior_que_plano_teorico_28_05]] — princípio que IMPEDE codar Camada 2 hoje sem Ricardo
- [[feedback_dual_write_contract_jsonb_vs_tabela_18_05]] — pattern de contrato implícito (mesmo problema na nova superficie)
- [[feedback_polir_nao_inventar]] — reusar V1.9.382 hook + V1.9.450 helpers em vez de criar paralelo
- [[reference_lock_v1_9_388_a3_ancoragem_regulatoria_multicamada_27_05]] — lock institucional que sustenta veto Camada 3

## Anti-padrões a vigiar quando ativar

- ❌ Jogar chat_interaction 6070 rows como default (ruído + DOC_LIST hijacking)
- ❌ Misturar FOLLOW_UP + AEC + chat_interaction como equivalentes (gap atual em PatientsManagement.tsx 1055)
- ❌ Codar Matrix "auto-leitura" sem toggle médico (anti-V1.9.318)
- ❌ Implementar Camada 2 sem Ricardo responder as 3 perguntas
- ❌ Construir UI plano terapêutico sem decisão clínica Ricardo do que é "plano terapêutico" no MedCannLab
- ❌ Modelar médico (Camada 3) sob qualquer pretexto
- ❌ Frase "Matrix sistema operacional da relação clínica" em material institucional (overclaim)

## Frase âncora

> *"Sistema já tem contexto demais — falta semântica clínica entre as fontes. O salto Ricardo está pedindo começou em 19/05 (V1.9.382) e ele nem percebeu. Hoje 28/05, gap real não é arquitetural: é (a) dossier sem patientId, (b) fontes embaralhadas na aba Evolução, (c) plano terapêutico nunca codado. Camada 1 cirúrgica + Camada 2 conversar + Camada 3 vetar. Princípio Matrix-Longitudinal: modela paciente, NÃO modela médico."*

## Próxima sessão Claude que tocar Matrix

1. Verificar se Ricardo respondeu as 3 perguntas
2. Se SIM: começar Camada 1.1 (dossier patient_id) — cirúrgica ~1-2h
3. Se NÃO: manter parqueado, lembrar Pedro
4. NUNCA codar Camada 2 sem alinhamento explícito Ricardo (constituição epistemológica)
5. NUNCA tocar Camada 3 (vetada institucionalmente)
