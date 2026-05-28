---
name: bula-e-infraestrutura-cognitiva-no-fluxo-prescricao-27-05
description: "Princípio meta cristalizado por Dr. Ricardo Valença (convergência quadrupla — eu empírico + Ricardo-GPT + Ricardo humano#1 + Ricardo humano#2). Bula BR é INFRAESTRUTURA COGNITIVA do médico no MOMENTO da prescrição, não literatura farmacológica decontextualizada. Pertence ao FLUXO de prescrição (contexto correto + momento correto + subordinada à decisão médica já tomada), não a aba separada. Hierarquia inviolável: médico prescreve → sistema organiza contexto documental oficial daquela decisão. Reduz risco regulatório + percepção \"IA farmacológica\" + deriva prescritiva."
metadata: 
  node_type: memory
  type: feedback
  originSessionId: 00be2b9f-5dbc-4236-a02e-1459c3f57bd2
---

# 💊 Bula é infraestrutura cognitiva no fluxo de prescrição (27/05 madrugada²)

## Contexto empírico

Sessão 27/05 madrugada — Pedro autorizou V1.9.465 ANVISA Bulário MVP-Catálogo (aba Literatura standalone). Depois mostrou complemento de Dr. Ricardo Valença que **REFINOU arquiteturalmente** a proposta:

> *"Você não está falando de 'buscar bulas como literatura externa'. Está falando de **enriquecer semanticamente o fluxo de prescrição já existente**. Bula no dropdown do card de nova prescrição: serviria como suporte contextual, referência oficial, consulta factual, e memória farmacológica integrada ao ato clínico."*

Esse refinamento **NÃO contradisse** princípio cristalizado de manhã (`feedback_fronteira_organizar_info_farmacologica_vs_decisao_terapeutica_27_05`) — APROFUNDOU.

## Princípio cristalizado (formulação Ricardo)

> *"O médico prescreve. Depois o sistema organiza contexto documental oficial daquela decisão. Essa hierarquia é MUITO importante para preservar identidade, regulação, e a filosofia clínica da Nôa."*

E ainda:

> *"Bula integrada ao fluxo de prescrição **vira infraestrutura cognitiva do médico**. Não motor terapêutico autônomo."*

E:

> *"No consultório o médico lembra; correlaciona; revisita; consulta rapidamente; contextualiza efeitos; temporalidade; interações; contraindicações. Mas tudo isso hoje fica fragmentado em abas, Google, WhatsApp, memória biológica."*

## Hierarquia inviolável codificada

```
1. Médico digita/seleciona medicamento (decisão clínica humana TOMADA)
                    ↓
2. Sistema reconhece medicamento (lookup no catálogo curado)
                    ↓
3. Popover contextual mostra DOCUMENTAÇÃO OFICIAL daquela decisão:
   - Princípio ativo + tarja BR
   - Observação clínica curada (interações, contraindicações)
   - Apresentação ANVISA
   - Link "Ver bula completa (ANVISA)" externa
                    ↓
4. Médico prescreve preenche dose + assina ICP normalmente
                    ↓
5. Audit trail: prescrição assinada com bula CONSULTADA (defesa CFM)
```

## Why — diferença vs aba separada

| Aba separada (V1.9.465 standalone) | Popover no fluxo (V1.9.466 — Ricardo) |
|---|---|
| Decontextualizado — médico sai do prontuário | Contextualizado — médico não sai do fluxo |
| Risco percepção "IA farmacológica" | Hierarquia médico→sistema preservada |
| Decisão pode ser interpretada como sugerida | Decisão já tomada, sistema só documenta |
| Use case: "consulta rápida tipo Google" | Use case: "infraestrutura cognitiva do ato clínico" |
| Validade: tier bonus secundário | Validade: PRIMARY use case |

Ricardo cristalizou: **camada documental longitudinal do prontuário vivo, não base farmacológica da IA**.

## Reduz 3 riscos críticos

1. **Risco regulatório**: CFM 2.314 + RDC ANVISA → bula como referência subordinada à decisão médica = OK. Bula como sugestão IA = não.
2. **Percepção "IA farmacológica"**: aba standalone pode ser interpretada como "IA recomenda medicamentos". Popover contextual = "sistema documenta o que médico escolheu".
3. **Deriva prescritiva**: aba pode incentivar busca exploratória "qual medicamento usar?". Popover só ativa APÓS médico já decidir.

## How to apply

**Antes de QUALQUER feature de info farmacológica** (interação medicamentosa, alerta dose, comparador), perguntar 4 perguntas adicionais (extensão do checklist de `feedback_fronteira_organizar_info_farmacologica_vs_decisao_terapeutica_27_05`):

5. **A feature ativa no FLUXO de prescrição** (médico já escolheu) ou em aba separada exploratória?
6. **A feature é SUBORDINADA à decisão médica** já tomada ou tenta INFLUENCIAR a decisão?
7. **A feature poderia ser interpretada como** "IA farmacológica" se mostrada a investidor / CFM / regulador?
8. **A documentação oficial é PRIMARY** (link ANVISA externo) ou sistema é PRIMARY (síntese própria)?

Se feature ativa fora de fluxo + influencia decisão + parece IA farmacológica + sistema é primary → BLOQUEIO. Refatorar para hierarquia inviolável.

## Aplicação concreta V1.9.466 (codado 27/05 madrugada²)

**BulaContextPopover** ([src/components/BulaContextPopover.tsx](src/components/BulaContextPopover.tsx)):
- ✅ Aparece SÓ APÓS médico digitar/selecionar medicação (subordinado)
- ✅ Renderizado dentro QuickPrescriptions (contexto correto)
- ✅ Mostra documentação oficial + link ANVISA (PRIMARY = oficial)
- ✅ ZERO sugestão de medicamento alternativo
- ✅ ZERO comparação cross-bulas
- ✅ Médico pode dismissar 24h (LocalStorage opt-out)
- ✅ Observação clínica é texto CURADO manualmente do seed (não síntese GPT)
- ✅ Tarja BR codificada visualmente (branca / amarela / vermelha / preta)
- ✅ Profissional-only (QuickPrescriptions é Terminal Atendimento)

V1.9.465 AnvisaPanel (aba standalone) **fica como use case secundário válido** — "consulta rápida tipo Google" — mas Ricardo afirmou que PRIMARY use case é V1.9.466 integrado.

## Conexões com princípios cristalizados existentes

| Princípio | Conexão |
|---|---|
| `feedback_fronteira_organizar_info_farmacologica_vs_decisao_terapeutica_27_05` | Refinamento DIRETO — esta memory é **camada mais profunda** do mesmo princípio |
| `feedback_polir_nao_inventar` | V1.9.466 reusa anvisaService + QuickPrescriptions existentes |
| `feedback_locks_macro_vs_micro_matrix_alucinacao_completiva_25_05` | Locks micro-factuais aplicados ao contexto farmacológico |
| `project_marca_medcannlab_brandbook_v3_22_05` | "Method-first, architecture-grounded, AI-last" — médico-first, sistema documenta |
| `project_investment_memo_28_04` | Diferencial competitivo BR (Memed/Conexa não têm bula integrada com observações curadas) |
| `feedback_lovable_audit_nao_fica_100pct_sempre_checar_via_pat_26_05` | Convergência quadrupla (eu + Ricardo-GPT + Ricardo humano x2) = sinal forte que cristalização agora é válida |

## Frase âncora

> *"O médico prescreve. O sistema documenta. Bula é infraestrutura cognitiva subordinada à decisão clínica humana — não motor terapêutico autônomo. Atravessar essa hierarquia = virar 'IA farmacológica' = anti-Constituição Nôa."*

## Próxima sessão Claude

Quando tocar feature farmacológica futura (interação medicamentosa, alerta dose, comparador, alerta DRC ajuste, etc):
- Ler esta memory ANTES
- Aplicar 8 perguntas (4 de fronteira + 4 de hierarquia)
- Default arquitetural: integrar ao FLUXO, não aba separada
- Documentação oficial sempre PRIMARY (link externo), sistema só organiza acesso

## Convergência quadrupla validada empíricamente (27/05)

1. **Eu (empírico OpenFDA)**: OpenFDA retorna ruído OTC pra busca CBD genérica → "ANVISA seria mais útil"
2. **Ricardo-GPT (parecer arquitetural)**: "app é BR... contexto clínico brasileiro tem implicações maiores"
3. **Ricardo humano #1 (validação direção)**: "trouxe também" — ANVISA é prioridade
4. **Ricardo humano #2 (refinamento arquitetural)**: "não é literatura externa, é infraestrutura cognitiva no fluxo de prescrição"

**4 fontes convergentes em 1 sessão** = sinal empírico mais forte que o critério "2ª evidência" estabelecido em `feedback_lovable_audit_nao_fica_100pct_sempre_checar_via_pat_26_05`. Cristalização justificada AGORA.
