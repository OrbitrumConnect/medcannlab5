---
name: Reunião 4 sócios 26/05 — Eduardo engajando tecnicamente (Marco 3 começa a destravar)
description: Reunião Pedro+Ricardo+Eduardo+João onde Eduardo (sócio neurologista que abandonou 19 dias) voltou empíricamente com pergunta técnica concreta sobre KPIs neuro/TEA + paciente Joaninha autista. Primeiro sinal real de Marco 3 destravando (2º médico independente). Sequência A→B→C cristalizada pra cobrir neuro/TEA sem feature creep
type: project
originSessionId: 4a984140-7091-42ce-a9d3-75298afef276
---
# Reunião 4 sócios 26/05 — Eduardo engajando = Marco 3 destravando

**Fato pivotal**: Eduardo (sócio fundador, neurologista, último uso como doctor 17/02/2026) voltou empíricamente na reunião com **pergunta técnica concreta** sobre como o app captura KPIs neuro/TEA. Cita exemplo "paciente Joaninha autista", pergunta sobre protocolo, KPIs (agressividade 0-10, interação social, etc).

**Por que importa**: memory `feedback_curva_aprendizado_alta_mesmo_para_socios_24_05` documentava "Faveret abandonou após 3 AECs em maio, 19 dias sem retornar — implicação: design simples não substitui hand-holding". A pergunta técnica concreta dele NA reunião é o **primeiro sinal empírico** de Marco 3 destravando.

## Decisões saindo da reunião

| Item | Decisão |
|---|---|
| Sidecar TEA neuro | Design parqueado — sequência A→B→C (ver abaixo) |
| AEC FSM | INTOCADA (Ricardo enfatizou) |
| Captação sinais TEA | Pós-Pipeline igual sidecar renal V1.9.307 |
| Card "Sinais TEA detectados" | Aparece AO LADO do card DRC no dashboard |
| Eduardo configurar cert ICP + CRM | Tarde reunião pós-CNPJ |
| Calculadora dosagem CBD (OneClick) | Mencionada como referência, parqueada |
| Mutirão clínico ultrassom | Conceitualmente cogitado (Romeu, HighLab, Ouroi) |
| "Salvar reunião + extrair KPIs" | PARQUEADO (feature creep — princípio anti-distração pré-PMF) |

## Sequência empírica neuro/TEA cristalizada (3 fases)

**Fase A (agora — zero código novo)**:
- Eduardo reativa via WhatsApp + Manual v1.1 (pendência ativa)
- Eduardo traz 1-2 pacientes neuro REAIS pra usar empíricamente
- V1.9.456 histórico longitudinal (implementado 26/05) já cobre 50% — mostra padrões observacionais entre consultas

**Fase B (quando Eduardo tiver 3-5 casos reais)**:
- Cristalizar JUNTO com Eduardo lista de 8 categorias × keywords TEA empíricas
- NÃO chutar com base em literatura — usar fala real dos pacientes/cuidadores dele
- Codar sidecar TEA seguindo padrão V1.9.307 renal
- Memory `feedback_sidecar_tea_semantica_relacional_sujeito_frase_26_05` (sujeito da frase + referente)

**Fase C (pós-Marco 2)**:
- KPIs visuais score 0-10 no prontuário (clinical_kpis já existe, 24 rows)
- Cruzamento longitudinal multi-paciente (Eixo Pesquisa)
- Timeline de sinais por categoria

## Papéis na reunião (observação meta)

| Sócio | Papel observado |
|---|---|
| **Pedro** | Aterrissou conversas técnicas, flagou risco capacidade pré-beta, traduziu princípio sidecar pra Eduardo |
| **Ricardo** | Cristalizou linguagem "função renal" não "disfunção", trouxe caso emblemático psicanálise+cannabis, validou semântica relacional sujeito da frase |
| **Eduardo** | Voltou tecnicamente engajado, pergunta concreta sobre Joaninha autista + protocolo, princípio Z2 ainda em absorção |
| **João** | Semi-presente (no celular), pouca contribuição técnica direta — padrão `feedback_dinamica_relacional_socios.md` |

## Caso clínico marcador trazido por Ricardo

**Caso psicanálise + cannabis** (sem nome real cristalizado, com consent necessário se virar referência institucional):
- Paciente com história forte de psicanálise + tratamento canábico
- Ricardo: *"caso sensacional de acompanhar... ela tinha uma história com a psicanálise muito forte... ela pegou na minha questão"*
- Materializa tese 6+ meses cristalizada (`feedback_pesquisa_materializacao_tese_ricardo_nao_drift_19_05`)
- Conecta com `feedback_queixa_nao_e_sintoma_aec_e_abertura_fenomenologica_24_05` (paciente articulada subjetivamente)
- Conecta com `project_drift_nefro_cannabis_16_05` (longitudinal nefro-cannabis com camada psíquica)
- **Vale registrar como case empírico** (com consent) pra apresentação investidor

## Análise GPT externo durante reunião (triada)

Aplicação `feedback_material_b_pode_contradizer_constituicao_22_05`:

🟢 **INSIGHTS VÁLIDOS incorporados**:
- 4 camadas (fenomenológica → semântica → estrutural → longitudinal) — coerente com `feedback_duas_vertentes_uma_matriz_epistemologica_constituicao_medcannlab_25_05`
- "KPI não nasce de pergunta direta — emerge de inferência contextual recorrente"
- "Risco que vocês intuitivamente evitam: 40 perguntas fixas"
- "Manter lastro empírico" (próprio GPT alertando anti-overclaim)

🟡 **ASPIRACIONAL** — NÃO usar em material institucional:
- *"sistema longitudinal de fenotipagem clínica narrativa"*
- *"infraestrutura cognitiva organizacional"*
- *"isso aqui ninguém tem"*
- *"Finigrana, avanço total, renovação"*
- *"medicina narrativa"*
- *"detectar padrões precoces"*

Vai pra `feedback_anti_overclaim_lista_atualizada_pos_reuniao_4socios_26_05` (memória dedicada).

## Pendências operacionais pós-reunião

1. **CNPJ João Vidal** (Marco 1) — destrava ~50% do roadmap
2. **WhatsApp Faveret + Manual v1.1** (Marco 3 destrava) — ação Pedro pessoal
3. **Tarde reunião técnica pós-CNPJ** (cert ICP + modelos receita + CRM Eduardo)
4. **Eduardo trazer 1-2 pacientes neuro REAIS** (Fase A sidecar TEA)
5. **Romeu / HighLab / Ouroi** — mapear contatos pra mutirão clínico
6. **Apresentação investidor + slide mestre** — em produção, com cuidado anti-overclaim

## Frase âncora da reunião

> *"Eduardo voltou empiricamente com pergunta técnica concreta — primeiro sinal real de Marco 3 destravando. Sidecar renal Maria das Dores virou prova arquitetural pro time inteiro. Caso psicanálise+cannabis cristalizou exemplo longitudinal-narrativo. Pedro segurou risco capacidade pré-beta. V1.9.456 implementado hoje cobre 50% da necessidade neuro sem código novo. Modo operacional > modo institucional."*

## Cristalizado

Diário 26/05 BLOCO H+I (reunião 4 sócios). Momento pivotal do mês — Marco 3 começou a destravar empíricamente.
