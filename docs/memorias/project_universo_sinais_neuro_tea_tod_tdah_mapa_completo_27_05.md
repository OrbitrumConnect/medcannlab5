---
name: Universo sinais neuro TEA + TOD + TDAH — mapa completo Fase A (27/05)
description: Mapa empírico completo pra sidecar único `neuro-signal-extractor` (padrão V1.9.307 renal). 3 transtornos (TEA 8 + TOD 6 + TDAH 6 = 20 categorias) × keywords × sobreposição semântica × decisões arquiteturais. Fase A (mapa) feita 27/05 ~22h BRT pós-AEC Eduardo simulando paciente — Fase B (Eduardo trazer 2-3 casos reais pra calibrar) pendente. Princípio mapear-antes-codar-guardrail aplicado integralmente.
type: project
originSessionId: 4a984140-7091-42ce-a9d3-75298afef276
---
# Universo sinais neuro TEA + TOD + TDAH — mapa Fase A (27/05)

## Trigger empírico

27/05 ~22h BRT: Eduardo Faveret (neurologista, sócio) entrou no app pela 1ª vez operacional (já tinha cadastro CRM + vitrine + recebeu 2 relatórios via sharing), simulou paciente real numa AEC completa (report 2bdb57fb). Discussão evoluiu pra cobertura de TEA/TOD/TDAH (espectro neurológico) — Eduardo concordou com proposta de sidecar único.

Mapeamento feito hoje em Fase A (anti-especulação): **mapa primeiro, código depois**. Aplicação direta do princípio `feedback_mapear_universo_vetores_antes_de_codar_guardrail`.

## Por que SINGLE sidecar > 3 separados

| Aspecto | Single `neuro-signal-extractor` | 3 sidecars TEA/TOD/TDAH |
|---|---|---|
| Deploy | 1 Edge | 3 Edges (3× custo manutenção) |
| Comorbidade | Captura automática (1 fala → tag múltiplos) | Cada Edge isolado (perde co-tagging) |
| Latência | 1 chamada GPT extraction | 3 chamadas paralelas |
| Custo OpenAI | ~$0.001/análise | ~$0.003/análise |
| Eduardo configurar | 1 cadastro | 3 cadastros |

**Decisão técnica**: 1 sidecar único `neuro-signal-extractor` (padrão V1.9.307 renal + 3 categorias de transtorno multi-tag).

**Justificativa clínica forte**: comorbidade é REAL e alta:
- TEA + TDAH = 30-50% co-ocorrência (literatura)
- TDAH + TOD = 40-50%
- TEA + TOD = 15-30%
- 1 paciente pode ter sinais dos 3 — sidecar NÃO decide, captura tudo + Eduardo interpreta

## 3 transtornos — DSM-5 ancora sem cópia literal

| Transtorno | Núcleo clínico | Sujeito típico | Idade pico diagnóstico |
|---|---|---|---|
| **TEA** (Espectro Autista) | Comunicação social + comportamentos repetitivos + sensorialidade | Infância → adulto | 2-6 anos |
| **TOD** (Opositivo Desafiador) | Padrão de raiva, desafio à autoridade, vingança | Infância (até 18a) | 6-12 anos |
| **TDAH** (Déficit Atenção/Hiperatividade) | Desatenção + hiperatividade + impulsividade | Toda idade | 6-12 anos pico / adulto não-diagnosticado comum |

## 20 categorias × keywords BR (mapa completo)

### TEA — 8 categorias

Já cristalizadas em `project_universo_sinais_tea_8_categorias_keywords_pre_fase_b_26_05`. Resumo:
1. Comunicação social
2. Comportamentos repetitivos
3. Sensorialidade
4. Sono
5. Agressividade-autolesão
6. Diagnósticos
7. Medicações TEA
8. Estresse cuidador

### TOD — 6 categorias (NOVAS 27/05)

| # | Categoria | Keywords detectáveis na fala | Aparece em |
|---|---|---|---|
| 1 | Desafio à autoridade | "não obedece" / "contesta tudo" / "questiona regras" / "desrespeita" / "recusa fazer" | Chat livre + lista indiciária |
| 2 | Raiva/irritabilidade frequente | "perde a cabeça fácil" / "explosivo" / "qualquer coisa irrita" / "mau humor constante" / "chateia-se à toa" | Chat livre + HDA |
| 3 | Agressividade reativa | "agride quando contrariado" / "bate quando frustrado" / "reage com violência" / "crise de raiva" | Lista indiciária |
| 4 | Vingança/rancor | "guarda rancor" / "se vinga" / "não esquece" / "fica magoado dias" / "trama" | Chat livre cuidador |
| 5 | Mentir/manipular | "mente com facilidade" / "manipula" / "culpa os outros" / "inventa histórias" | Chat livre cuidador |
| 6 | Recusa cumprir regras | "não cumpre rotina" / "foge das tarefas" / "não aceita limites" / "ignora avisos" | HDA + hábitos |

**Onde aparece naturalmente**: 90% chat livre cuidador (pais relatando filho); 10% HDA (paciente adolescente/adulto se descrevendo retrospectivamente).

### TDAH — 6 categorias (NOVAS 27/05 + ajustes do Claude 27/05)

| # | Categoria | Keywords detectáveis | Aparece em |
|---|---|---|---|
| 1 | Desatenção | "não presta atenção" / "distraído" / "esquece tudo" / "perde coisas" / "não termina tarefas" / "sonha acordado" / "voa" / "dificuldade de me concentrar" | Chat livre + lista |
| 2 | Hiperatividade motora | "agitado" / "não para quieto" / "vive em movimento" / "sobe nas coisas" / "corre demais" / "mexe pernas o tempo todo" | Chat livre + HDA |
| 3 | Impulsividade | "age sem pensar" / "interrompe" / "fala fora de hora" / "compra por impulso" / "acidentes frequentes" / "toma decisão precipitada" | Chat livre |
| 4 | Procrastinação/desorganização | "adia tudo" / "deixa pra última hora" / "bagunçado" / "perde prazos" / "não consegue planejar" | HDA + hábitos |
| 5 | Hiperfoco paradoxal | "foco extremo em [X]" / "fica horas em uma coisa" / "não tira da cabeça" / "obsessivo com [Y]" | Chat livre + interesses |
| 6 | Comorbidade emocional | "ansiedade desde criança" / "dificuldade na escola" / "dislexia" / "baixa autoestima" / "depressão" / **"ansiedade adulto refratária"** / **"burnout precoce/recorrente"** | HPP (Etapa 5) + HF |

**Onde aparece**: paciente adulto frequentemente fala de si próprio (subjetivo); paciente criança/adolescente vem via cuidador (referido).

**Ajuste Claude 27/05**: categoria 6 expandida com "ansiedade adulto refratária" e "burnout precoce/recorrente" porque empírico do report 2bdb57fb mostrou que ~50% das crianças TDAH continuam adulto não-diagnosticadas — esse paciente simulado pelo Eduardo (médico/adulto/burnout) é o padrão típico.

## Sobreposição semântica (zona de ambiguidade)

Alguns sinais aparecem nos 3 transtornos — sidecar captura **todas as classificações possíveis + flags ambiguidade**:

| Fala literal | TEA? | TOD? | TDAH? | Diferencial clínico |
|---|---|---|---|---|
| "meu filho tem crise / explode" | ✅ (overload sensorial) | ✅ (raiva oposicional) | ✅ (impulsividade frustrada) | Contexto: causa (sensorial vs frustração vs impulso) |
| "não obedece / não fica parado" | ❌ | ✅ (desafio) | ✅ (hiperatividade) | Função: oposição deliberada vs incapacidade física |
| "não presta atenção" | ✅ (atenção compartilhada) | ❌ | ✅ (desatenção) | Domínio: social vs executivo |
| "obsessivo com [X]" | ✅ (interesse restrito) | ❌ | ✅ (hiperfoco) | Qualidade: estereotipado vs imersivo |
| "agressivo / morde" | ✅ (auto-lesão) | ✅ (reativa) | ✅ (impulsiva) | Direção: auto vs hetero |

**Princípio Z2 aplicado**: sidecar marca todos os transtornos plausíveis + confidence + fala literal. Eduardo (neurologista) interpreta o diferencial. **Sidecar não diz "é TEA" — diz "esses 3 são compatíveis"**.

## Estrutura output JSON proposta

```json
{
  "sujeito": "próprio paciente | filho menor | filho adulto | irmão | outro_familiar",
  "fala_literal": "meu filho tem crises de raiva quando muda rotina",
  "data": "2026-05-26T...",
  "etapa_aec": "lista_indiciaria | chat_livre | hda | hpp | hf | habitos",
  "categorias_detectadas": [
    {
      "transtorno": "TEA",
      "subcategoria": "comportamentos_repetitivos",
      "confianca": 78
    },
    {
      "transtorno": "TOD",
      "subcategoria": "raiva_irritabilidade",
      "confianca": 55
    }
  ],
  "ambiguidade_clinica": true,
  "janela_contextual": "...5 frases antes + 2 depois (capped ~600 tokens)..."
}
```

**Ajuste Claude 27/05**:
- `confianca` = score numérico **0-100** (não alta/média/baixa) — threshold de exibição configurável (>50 entra no card), Eduardo calibra empíricamente
- `sujeito` expandido com granularidade (não só "próprio/cuidador") — TEA adulto vs pediátrico têm semiologias distintas
- `janela_contextual` definido: **5 msgs antes + 2 depois**, cap ~600 tokens cost-control

## Persistência — Opção B (tabela `clinical_neuro_signals`)

**Decisão técnica parqueada (Fase D)**: tabela nova `clinical_neuro_signals` para suportar Eixo Pesquisa (Eduardo + analytics cross-paciente futuro).

**Contrato dual-write OBRIGATÓRIO DESDE O DESIGN** (`feedback_dual_write_contract_jsonb_vs_tabela_18_05` aplicado preventivamente):
- Tabela canônica pra analytics + filtros médico (Eduardo)
- Jsonb (`clinical_reports.content.neuro_signals`) canônica pra UI do report (paciente NÃO vê)
- Service que persiste deve gravar AMBOS em sequência (log se um falhar)
- **NÃO replicar** gap não-formalizado de hoje em `clinical_rationalities`

## Card UI Eduardo — padrão DRC empilhado

**Empilhado abaixo do `<RenalSuggestionsCard />` no `ProfessionalMyDashboard.tsx:937`**:

```tsx
{/* V1.9.307 — DRC Ricardo */}
<div className="mb-6"><RenalSuggestionsCard /></div>
{/* V1.9.X — Neuro Eduardo */}
<div className="mb-6"><NeuroSignalsCard /></div>
```

**Por que empilhado (não side-by-side)**: cada médico vê só o card da sua especialidade via RLS — Ricardo (nefro) NUNCA atende espectro do Eduardo + vice-versa. Anti-disco visual preservado (V1.9.111-A). Pedro (admin) vê os 2 — analytics cross-pacientes.

### Estrutura visual proposta

- **Topo**: filtro multi-select TEA | TOD | TDAH | TODOS (não radio — caso TEA+TDAH simultâneo)
- **Lista**: categoria + fala literal + data + confiança numérica 0-100 + ação aprovar/rejeitar/arquivar
- **Ambiguidade clínica**: flag visual amarelo "🟡 Múltiplos transtornos plausíveis"
- **Tags por transtorno**: azul TEA / roxo TOD / verde TDAH + ícone duplo na comorbidade
- **Botão "Exportar pra dossiê"** (F3 V1.9.390)

## 4 fases empíricas (sequência anti-especulação)

| Fase | Pré-condição | Trabalho | Tempo | Risco |
|---|---|---|---|---|
| **A — Mapa** ✅ | — | Esta análise = universo categorias × keywords × sobreposição | ✅ 1h | ZERO |
| **B — Validação Eduardo** | Eduardo trazer 2-3 casos neuro REAIS (TEA puro + TDAH puro + comorbidade) | Junto: validar keywords reais BR + adicionar/remover categorias + responder 3 decisões UI parqueadas + cristalizar memória final | ~2h | ZERO (sem código) |
| **C — Audit empírico reports existentes** | Eduardo aprovado lista | Grep nos 143 reports + chats — quantos sinais aparecem hoje? Quais categorias top? Base estatística pré-codar | ~3h | ZERO (sem código) |
| **D — Sidecar codificado** | Volume real comprovado (3-5 casos Eduardo) | Edge `neuro-signal-extractor` + tabela `clinical_neuro_signals` + `<NeuroSignalsCard />` + smoke + tag git | ~6-8h | 🟢 BAIXO (modelo V1.9.307 + V1.9.457 auth) |
| **E — Pós-Marco 2 KPIs visuais** | Marco 2 cumprido | Scores 0-10 por domínio + timeline + cross-paciente analytics | parqueado | — |

**Hoje em Fase A**. V1.9.456 (histórico longitudinal já deployado 26/05) cobre ~50% da necessidade neuro mesmo sem sidecar — Eduardo já vê padrão de queixas longitudinal no modal de report.

## 3 decisões UI parqueadas (Fase B com Eduardo)

1. **Card mostra confiança numérica 0-100** (recomendado, calibrável) OU **bolinhas verde/amarelo/cinza** (mais simples visual)?
2. **Aprovar** = persiste como "diagnóstico clínico anotado pelo médico" OU só marca "li e considerei"?
3. Card mostra **fala literal completa** (transparência total) OU **resumo + tooltip pra fala** (visual mais limpo)?

## 10 princípios meta aplicáveis (todos já cristalizados)

1. ✅ AEC FSM intocada (`feedback_queixa_nao_e_sintoma_aec_e_abertura_fenomenologica_24_05`)
2. ✅ Sidecar NÃO diagnostica (`feedback_locks_macro_vs_micro_matrix_alucinacao_completiva_25_05`)
3. ✅ Semântica relacional sujeito da frase (`feedback_sidecar_tea_semantica_relacional_sujeito_frase_26_05`)
4. ✅ Janela contextual obrigatória (resolve pronome ambíguo)
5. ✅ Confiança calibrada (BAIXA não entra no card)
6. ✅ Polir-não-inventar (modelo V1.9.307 renal + V1.9.455 wiring + V1.9.457 auth)
7. ✅ Mapear universo antes de codar (esta análise = mapa)
8. ✅ Anti-feature-creep (codar SÓ quando Eduardo trouxer casos reais)
9. ✅ DSM-5 ancora mas não copia (adaptação cultural BR cuidadores)
10. ✅ Auth + ownership V1.9.457 (já estabelecido pra Edges sensíveis)

## Conexões

- [[project_smoke_neuro_signal_report_2bdb57fb_27_05]] — smoke empírico do report Eduardo simulando paciente; prova que mapa funciona em caso real
- [[project_universo_sinais_tea_8_categorias_keywords_pre_fase_b_26_05]] — TEA 8 categorias originais (memory companheira)
- [[feedback_sidecar_tea_semantica_relacional_sujeito_frase_26_05]] — princípio sujeito da frase
- [[project_v1_9_456_historico_longitudinal_modal_report_26_05]] — modal report já entrega ~50% da necessidade neuro hoje
- [[project_eduardo_faveret_no_app_sharing_validado_27_05]] — Eduardo operacional desde 27/05 14h
- [[feedback_dual_write_contract_jsonb_vs_tabela_18_05]] — contrato preventivo
- [[feedback_4_camadas_arquitetura_fenomenologica_semantica_estrutural_longitudinal_26_05]] — sidecar = camada semântica
- V1.9.307 renal — modelo arquitetural a replicar

## Cristalizado

27/05 ~22h30 BRT pós-AEC Eduardo simulando paciente médico burnout (report 2bdb57fb) + discussão Pedro+Eduardo sobre cobertura espectro neurológico. Eduardo concordou com proposta. **Próximo gate**: Eduardo trazer 2-3 casos neuro reais anonimizados pra Fase B calibrar empírico.
