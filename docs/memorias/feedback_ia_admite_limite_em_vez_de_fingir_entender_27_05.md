---
name: IA admite limite em vez de fingir entender — princípio meta-arquitetural (27/05)
description: Princípio nuclear cristalizado pós-bug CONSENSUS_REPORT loop V1.9.473. Quando IA não tem capacidade semântica de processar pedido do usuário, deve admitir o limite explicitamente E oferecer registro literal da fala original, em vez de regenerar resposta idêntica ou fingir interpretação. Vale pra QUALQUER FSM clínica determinística + LLM híbrido. Honra fidelidade > completude (vertente clínica Constituição) e princípio Ricardo "queixa preserva abertura fenomenológica" (paciente tem voz que persiste mesmo quando sistema não compreende).
type: feedback
originSessionId: 4a984140-7091-42ce-a9d3-75298afef276
---
# IA admite limite em vez de fingir entender (27/05)

## Rule

Quando IA híbrida (determinístico FSM + LLM) atinge **bug arquitetural de capacidade semântica** (não consegue processar pedido do usuário no padrão atual), deve:

1. **Detectar o loop** (ex: 2ª discordância sem state change)
2. **Admitir explicitamente o limite** ao usuário em linguagem natural
3. **Oferecer registro literal** da fala original como anexo persistente
4. **Avançar** o fluxo com a fala registrada (não bloquear)

NÃO regenerar resposta idêntica esperando que o usuário "entenda". NÃO inventar interpretação via LLM pra mascarar limite (vira alucinação completiva — `feedback_locks_macro_vs_micro_matrix_alucinacao_completiva_25_05`).

## Why — caso paradigmático V1.9.473

**Bug arquitetural exposto por Eduardo Faveret 27/05 ~18h BRT** (1ª AEC operacional dele simulando paciente médico burnout).

Sequência empírica (logs Edge + DB):
1. Sistema apresentou "MEU ENTENDIMENTO" com ruído ("olha", "aí ela liga" — parser confundiu interjeições como sintomas)
2. Eduardo: "discordo, nao existe o sintoma olha, nem existe a frase ai ela liga"
3. Sistema regenerou MESMO entendimento (`generateConsensusReport` é renderização determinística do state)
4. Eduardo: "que voce retire o sintoma 'olha' e substitua por ansiedade"
5. Sistema regenerou MESMO entendimento (state nunca foi modificado)
6. Eduardo: "quero que retire a frase *(roteiro de perguntas abaixo focado em olha...)*"
7. Sistema regenerou MESMO entendimento
8. Eduardo desistiu na 4ª e escreveu "concordo" (`content.consenso.revisoes_realizadas: 2`)

**Causa arquitetural**: `generateConsensusReport` é determinístico (concatena `state.data`). Não tem semântica pra aplicar correção livre. FSM não tinha caminho de escape — só "concordo" avançava, qualquer outra coisa entrava em loop.

**3 opções consideradas + decisão**:

| Opção | Como | Risco | Honra Constituição |
|---|---|---|---|
| **A** ⭐ | Após 2ª discordância, oferecer "registrar observação literal como anexo" | 🟢 BAIXO — só FSM | ✅ admite limite + escuta paciente |
| **B** | Reconhecer "remover X" via regex e modificar state | 🟡 MÉDIO — frágil | ⚠️ inventa interpretação |
| **C** | GPT no Edge pra reescrever entendimento | 🔴 ALTO — mexe pirâmide | ⚠️ risco alucinação completiva |

**Pedro autorizou Opção A explicitamente.** Implementada em V1.9.473 (commit `c0ca8d3` + Edge tradevision-core v416).

## How to apply

**Pra QUALQUER feature futura híbrida (FSM + LLM) que enfrente bug arquitetural similar**:

1. **NÃO** inventar interpretação via LLM (vira alucinação completiva)
2. **NÃO** loop com regeneração idêntica (frustra usuário, parece bug obvio)
3. **NÃO** travar fluxo (paciente abandona AEC, "discordo" vira dead-end)
4. **SIM** detectar limite via contador (`revisões >= 2`) ou flag de estado
5. **SIM** admitir explícito: *"não consigo X automaticamente — vou registrar Y literal pra Z ver"*
6. **SIM** persistir fala original em campo dedicado (ex: `patientReviewNotes`, `clinicianOverrideText`, `userFeedbackRaw`)
7. **SIM** avançar fluxo com fala registrada

Aplicável imediatamente a:
- **AEC FSM** (V1.9.473 já implementa)
- **Matrix Z2** ressonância semântica (se Eduardo apontar "Matrix entendeu errado, faça X" 2x → registrar override literal sem reinterpretar)
- **Sidecar neuro futuro** (se médico rejeita sinal "isso aqui não é TEA, é Y" → registrar justificativa em vez de reclassificar via GPT)
- **Bula ANVISA** (se médico contesta dado da bula → registrar literal sem reescrever)
- **Qualquer interação onde LLM tem risco de "completar com inventação"**

## Conexão com Constituição MedCannLab

Honra os 4 eixos da matriz epistemológica Ricardo (`feedback_duas_vertentes_uma_matriz_epistemologica_constituicao_medcannlab_25_05`):

- **Escuta > Interpretação**: sistema admite que escutou mas não interpretou
- **Fidelidade > Completude**: prefere registro literal incompleto a invenção completa
- **Honestidade > Utilidade percebida**: avisa o usuário em vez de fingir competência
- **Estrutura > Síntese**: 2 blocos paralelos (entendimento original + observação literal) > síntese forçada que mascara o gap

**Vertente clínica** (chat paciente): "queixa preserva abertura fenomenológica" (`feedback_queixa_nao_e_sintoma_aec_e_abertura_fenomenologica_24_05`) — paciente tem voz que persiste mesmo quando sistema não compreende.

**Vertente pesquisa** (Matrix Z2): "sustenta lacuna sem colapsar" (`feedback_locks_macro_vs_micro_matrix_alucinacao_completiva_25_05`) — Matrix admite ausência de dado em vez de fabricar.

V1.9.473 = **mesma matriz aplicada em fase específica AEC** (CONSENSUS_REPORT).

## Anti-padrão a vigiar

Se em algum momento alguém propor "vamos usar GPT pra interpretar a correção do paciente e reescrever o entendimento automaticamente" → **TRIGGER LOCK**: lê esta memória + Constituição + V1.9.453 anti-alucinação. Provavelmente é gateway pra alucinação completiva disfarçada de "feature inteligente".

Exceção válida: **se Eduardo trouxer 5+ casos empíricos** onde Opção A (anexo literal) gerou retrabalho significativo pro médico, reavaliar pra Opção C — mas SÓ com smoke pesado + validar com Ricardo (`feedback_smoke_aec_completa_obrigatoria_pos_clinicalassessmentflow_mudanca_24_05`).

## Frase âncora

> *"IA híbrida que admite 'não consegui interpretar' e registra a fala literal do usuário é MAIS confiável que IA que inventa interpretação convincente. Em healthtech regulado, isso é a diferença entre produto sério e mais um chatbot perigoso."*

— Cristalizado 27/05 ~22h BRT pós-V1.9.473 deploy + alinhamento Pedro+Claude (Opção A explicitamente escolhida).

## Conexões

- [[feedback_queixa_nao_e_sintoma_aec_e_abertura_fenomenologica_24_05]] — vertente clínica da Constituição
- [[feedback_locks_macro_vs_micro_matrix_alucinacao_completiva_25_05]] — vertente pesquisa da Constituição
- [[feedback_duas_vertentes_uma_matriz_epistemologica_constituicao_medcannlab_25_05]] — meta-princípio mês
- [[feedback_polir_nao_inventar]] — princípio 8 (reusar FSM + Verbatim Lock, não inventar interpretação via GPT)
- [[feedback_smoke_aec_completa_obrigatoria_pos_clinicalassessmentflow_mudanca_24_05]] — gate pra mudar FSM
- [[project_eduardo_faveret_no_app_sharing_validado_27_05]] — Eduardo como descobridor empírico do bug
- V1.9.473 (commit `c0ca8d3` + Edge tradevision-core v416) — implementação
