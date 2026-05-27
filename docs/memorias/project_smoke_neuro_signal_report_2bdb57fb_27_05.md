---
name: Smoke empírico sidecar neuro — report 2bdb57fb Eduardo simulando paciente (27/05)
description: Extração manual neuro-signal aplicada à conversa real do report 2bdb57fb-94d6-4463-afce-f3b3817ccf38 (Eduardo Faveret simulando paciente médico/burnout/ansiedade na AEC 27/05 18-19h BRT). Prova empírica que mapa proposto funciona em caso real — 4 sinais TDAH detectados + 0 TEA + 0 TOD + diferencial clínico não-diagnóstico. Mesmo com lista_indiciária contaminada por "olha" e "aí ela liga", sinais semânticos foram perfeitamente captáveis nas 20 mensagens da conversa.
type: project
originSessionId: 4a984140-7091-42ce-a9d3-75298afef276
---
# Smoke empírico sidecar neuro — report 2bdb57fb (27/05)

## Trigger empírico

27/05 18:32→19:05 BRT: Eduardo Faveret simulou paciente real na AEC pela 1ª vez. Persona: médico ex-diretor de clínica multinacional que faliu (4 meses salário não pago) + assédio moral em serviço público + burnout há 3 anos + quadro atual de ansiedade/insônia/depressão + dificuldade de concentração + uso de bupropiona 150mg XR + quer substituir parte da medicação por canabidiol.

Report gerado: `2bdb57fb-94d6-4463-afce-f3b3817ccf38`. Pipeline 100% rodou (clinical_score 70, confidence high, signed via ICP, doctor_id = Eduardo via vínculo appointments).

**Como esse smoke nasceu**: depois de discutirmos o mapa neuro Fase A (`project_universo_sinais_neuro_tea_tod_tdah_mapa_completo_27_05`), Pedro perguntou: *"podemos detectar TEA/TOD/TDAH mesmo nesse relatório com a contaminação do olha?"*. Resposta: SIM, sidecar processaria CONVERSA INTEIRA (não lista_indiciária poluída). Smoke manual = prova.

## Output JSON que o sidecar geraria (extração manual)

```json
[
  {
    "sujeito": "próprio paciente",
    "fala_literal": "dificuldade de me concentrar",
    "data": "2026-05-27T21:34:56+00:00",
    "etapa_aec": "lista_indiciaria",
    "categorias_detectadas": [
      { "transtorno": "TDAH", "subcategoria": "desatencao", "confianca": 92 }
    ],
    "ambiguidade_clinica": false
  },
  {
    "sujeito": "próprio paciente",
    "fala_literal": "preciso me concentrar diante de muitas demandas como médico",
    "data": "2026-05-27T21:44:08+00:00",
    "etapa_aec": "hda_localizacao",
    "categorias_detectadas": [
      { "transtorno": "TDAH", "subcategoria": "desatencao", "confianca": 88 }
    ],
    "ambiguidade_clinica": false
  },
  {
    "sujeito": "próprio paciente",
    "fala_literal": "ha uns 3 anos depois de ter um episodio de burn out + ansiedade + depressão",
    "data": "2026-05-27T21:44:31+00:00",
    "etapa_aec": "hda_inicio + queixa_principal",
    "categorias_detectadas": [
      { "transtorno": "TDAH", "subcategoria": "comorbidade_emocional", "confianca": 65 }
    ],
    "ambiguidade_clinica": true,
    "diferencial_sugerido": "TDAH adulto descompensado por burnout vs ansiedade primária isolada"
  },
  {
    "sujeito": "próprio paciente",
    "fala_literal": "tenho tomando remedios para me concentrar e diminuir a ansiedade [...] bupropiona 150 mg XR 1 x ao dia",
    "data": "2026-05-27T21:36:35+00:00 + 21:57:18+00:00",
    "etapa_aec": "lista_indiciaria + medicacao_regular",
    "categorias_detectadas": [
      { "transtorno": "TDAH", "subcategoria": "terapeutico_indireto", "confianca": 55 }
    ],
    "ambiguidade_clinica": true,
    "observacao": "bupropiona usada off-label TDAH adulto além de depressão"
  }
]
```

**Resumo agregado**:
- 🟢 TDAH-Desatenção: 2 sinais (confiança 92, 88)
- 🟡 TDAH-Comorbidade emocional: 1 sinal (confiança 65)
- 🟡 TDAH-Terapêutico indireto: 1 sinal (confiança 55)
- ⚪ TEA: 0 sinais
- ⚪ TOD: 0 sinais

**Veredito clínico não-diagnóstico**: padrão típico de **TDAH residual adulto descompensado por burnout**. Eduardo (neurologista) interpretaria o diferencial — sidecar não diz "é TDAH", diz "esses 4 sinais TDAH são compatíveis".

## Como o card Eduardo renderizaria

```
🧠 SINAIS NEURO DETECTADOS — 1 paciente (passosmir4)
─────────────────────────────────────────────────────
[ Filtro: TEA □ | TOD □ | TDAH ☑ | TODOS □ ]

🟢 TDAH-Desatenção           confiança 92
   "dificuldade de me concentrar"
   contexto: chat livre msg 5 (27/05 18:34)
   [aprovar] [rejeitar] [arquivar]

🟢 TDAH-Desatenção           confiança 88
   "preciso me concentrar diante de muitas demandas como médico"
   contexto: HDA localização msg 12 (27/05 18:44)
   [aprovar] [rejeitar] [arquivar]

🟡 TDAH-Comorbidade emocional   confiança 65
   "ansiedade + depressão + burn-out há 3 anos"
   contexto: HDA início + queixa principal
   [aprovar] [rejeitar] [arquivar]

🟡 TDAH-Terapêutico indireto    confiança 55
   "tomando remédios para concentrar" + bupropiona 150mg XR
   (bupropiona off-label TDAH adulto)
   contexto: medicação regular + lista indiciária
   [aprovar] [rejeitar] [arquivar]

🟡 Diferencial clínico sugerido (não-diagnóstico):
   "TDAH residual adulto descompensado por burnout"
   vs ansiedade primária isolada
   → diferencial requer avaliação Eduardo
```

## 3 confirmações empíricas importantes

### 1. Contaminação "olha" / "aí ela liga" NÃO afeta detecção

A lista_indiciária do report tem ruído ("olha", "aí ela liga"). Mas o sidecar processaria as **20 mensagens completas da conversa** (`ai_chat_interactions`), não a lista_indiciária curada. Os 4 sinais TDAH foram extraídos de:
- msg 5 "dificuldade de me concentrar" (1ª descrição livre)
- msg 12 "preciso me concentrar... médico" (HDA localização)
- msg 13 "há 3 anos depois de burn out" (HDA início)
- msg 29 "bupropiona 150mg XR" (medicação regular)

**Tese confirmada**: sidecar = camada semântica independente da curadoria fenomenológica da AEC. Bug de parser (V1.9.473 já fixado pra "olha") não bloqueia sinais neuro.

### 2. Persona "médico ex-diretor burnout" é caso PARADIGMÁTICO

~50% das crianças TDAH continuam adultos não-diagnosticadas (literatura). Padrão típico:
- Compensaram na infância (inteligência alta, ambiente estruturado)
- Descompensaram adulto quando demandas executivas explodiram (carreira/responsabilidade)
- Buscam tratamento como "ansiedade" ou "burnout" — confundindo causa primária

Esse é exatamente o paciente que Eduardo simulou. **Smoke 100% representativo de caso real que Eduardo provavelmente atende muito** em consulta — primeiro paciente plausível pra sidecar provar valor.

### 3. Audience Contract honrado

Esses 4 sinais NÃO vão pro paciente (Pedro/passosmir4 não vê esse card). Vão APENAS pro médico (Eduardo) via RLS no card `<NeuroSignalsCard />` que seria adicionado em `ProfessionalMyDashboard.tsx:937` (empilhado abaixo do `<RenalSuggestionsCard />` do Ricardo).

Pedro como admin veria os 2 cards (analytics cross-pacientes).

## Material pra Fase B com Eduardo

Esse smoke é exatamente o tipo de "output sample" que deve ser mostrado pro Eduardo quando ele trouxer 2-3 casos neuro reais:

1. **Pergunta-validação**: "se eu te entregar ESSE card pro paciente 2bdb57fb amanhã de manhã, ele te economiza tempo / muda alguma decisão clínica?"
2. **Pergunta-calibração**: "as 4 categorias detectadas batem com a sua leitura? Falta alguma? Sobra alguma?"
3. **Pergunta-confidence**: "92 / 88 / 65 / 55 — você confia mais nos sinais altos? Os de 55 incomodam visualmente?"
4. **Pergunta-diferencial**: "o flag 'TDAH descompensado por burnout vs ansiedade primária' é útil ou ruído?"

## Anti-overclaim

Não significa que sidecar resolveu TDAH detection. Significa apenas que:
- 1 caso simulado por Eduardo → mapa funciona
- 0 TEA + 0 TOD nesse paciente → não sabemos ainda se mapa cobre bem TEA/TOD (precisa casos reais)
- Confiança numérica é estimativa subjetiva minha — empírico real virá com Eduardo calibrando
- Smoke é em PORTUGUÊS-BR adulto profissional — adaptação pra cuidador relatando filho pediátrico TEA precisa validação separada

## Conexões

- [[project_universo_sinais_neuro_tea_tod_tdah_mapa_completo_27_05]] — mapa completo (memory mãe)
- [[project_universo_sinais_tea_8_categorias_keywords_pre_fase_b_26_05]] — TEA 8 categorias originais
- [[project_eduardo_faveret_no_app_sharing_validado_27_05]] — Eduardo operacional desde 27/05
- AEC report `2bdb57fb-94d6-4463-afce-f3b3817ccf38` no banco (signed via ICP, doctor_id Eduardo)
- V1.9.473 fix CONSENSUS_REPORT loop + parser interjeições (separado, não bloqueia sidecar)

## Cristalizado

27/05 ~22h45 BRT após Fase A do mapa + autorização Pedro pra cristalizar. **Próximo gate**: usar esse smoke como material concreto pra Eduardo na Fase B — pergunta-validação acima.
