---
name: fronteira-organizar-info-farmacologica-vs-decisao-terapeutica-27-05
description: "Quando IA passa a oferecer informação farmacológica (bulas, posologia, contraindicações), preserve fronteira entre \"organizar acesso à informação oficial\" (infra clínica) vs \"participar da decisão terapêutica\" (prescrição). A primeira é infraestrutura; a segunda muda risco regulatório + identidade da Nôa. Cristalizado 27/05 noite² madrugada após parecer Ricardo-GPT triado contra Constituição na proposta V1.9.464 OpenFDA + ANVISA Bulário."
metadata: 
  node_type: memory
  type: feedback
  originSessionId: 00be2b9f-5dbc-4236-a02e-1459c3f57bd2
---

# 💊 Fronteira: organizar info farmacológica vs participar decisão terapêutica (27/05)

## Contexto empírico

Sessão 27/05 madrugada — Pedro perguntou se daria pra adicionar busca de bulas (ANVISA + OpenFDA) na aba Literatura. Proposta V1.9.464 OpenFDA + ANVISA Tier MVP em 3 fases. Pedro colou parecer Ricardo-GPT sobre a proposta. Triagem contra Constituição (`feedback_lovable_audit_nao_fica_100pct_sempre_checar_via_pat_26_05` aplicado entre IAs) revelou: 90% ECO do que já está cristalizado + 10% formulação afiada NOVA que vale absorver.

A formulação afiada NOVA é o princípio meta desta memória.

## Princípio cristalizado (formulação Ricardo-GPT)

> *"Vocês precisam preservar a diferença entre **'organizar informação farmacológica'** e **'participar da decisão terapêutica'**. Porque a segunda muda completamente o risco regulatório; e muda a própria identidade da Nôa."*

E ainda:

> *"O perigo não é só recomendar remédio. É a plataforma começar semanticamente a parecer 'IA farmacológica'. E isso colide diretamente com AEC, organização narrativa, longitudinalidade, e o eixo 'trajetória clínica'."*

## Why

Em healthtech regulada (CFM 2.314 + Lei 14.063 + ANVISA), oferecer **informação farmacológica** (bula, composição, posologia) é juridicamente OK como consulta de informação pública — desde que NÃO atravesse pra **decisão terapêutica**. Quando atravessa:

| Linha | "Organizar info" (OK) | "Participar decisão" (proibido sem revisão) |
|---|---|---|
| Linguagem | *"Resultados encontrados na ANVISA / FDA"* | *"IA recomenda este medicamento"* |
| Fonte | Mostra original ANVISA/FDA com link | Síntese GPT a partir de várias bulas |
| Ação | Médico clica + lê bula completa | Sistema sugere "tome X" / "substitua Y" |
| Audiência | Profissional-only (Terminal Pesquisa) | Paciente direto via chat |
| Risco regulatório | Baixo (info pública) | Alto (prescrição automática = CFM 2.314 violação) |
| Identidade Nôa | *"Infraestrutura de organização clínica"* | *"IA farmacológica"* (anti-Constituição) |

**Atravessar a fronteira muda 2 coisas críticas**:
1. **Risco regulatório**: CFM 2.314/2022 proíbe prescrição automática por IA sem revisão médica
2. **Identidade da Nôa**: AEC + escuta narrativa + longitudinalidade vs "IA farmacológica" são vetores cognitivos OPOSTOS

## Conexões com princípios cristalizados existentes

- `feedback_locks_macro_vs_micro_matrix_alucinacao_completiva_25_05`: macro-clínico "não diagnosticar" estendido a micro-farmacológico "não sugerir prescrição"
- `feedback_queixa_nao_e_sintoma_aec_e_abertura_fenomenologica_24_05`: AEC organiza, clínica interpreta — bula é dado, não prescrição
- `feedback_z2_nao_e_burrice_voz_intelectual_19_05`: Z2 estrutural codificada — mostrar info sem opinar é Z2 farmacológica
- `feedback_viabilidade_tecnica_vs_legitimidade_epistemologica_18_05`: pubmedService.ts já aplicou (ZERO síntese GPT, linguagem "Resultados encontrados")
- Risco padrão Babylon Health (BLOCO S diário 26/05): vendiam "AI diagnostica sintomas" → identidade IA farmacológica → caiu

## How to apply

**Antes de adicionar QUALQUER feature de informação farmacológica** (bula, interação medicamentosa, posologia, alerta dose), verificar 5 perguntas:

1. **Linguagem usa "Resultados encontrados"** (não "IA recomenda")?
2. **Fonte oficial primária** é mostrada (ANVISA PDF / FDA label original)?
3. **Audiência é profissional-only** (Terminal Pesquisa, não paciente direto)?
4. **Disclaimer obrigatório**: *"Informação educativa. Decisão clínica e prescrição: responsabilidade do médico (CFM 2.314)"*?
5. **ZERO síntese GPT** sobre dados farmacológicos (mostra original, não interpreta)?

Se qualquer NÃO → BLOQUEIO. Refatorar pra atravessar a fronteira na direção segura.

## Aplicação concreta V1.9.464 (codado 27/05 com este princípio em mente)

- ✅ OpenFDA: replica pubmedService pattern — ZERO síntese, linguagem "Resultados encontrados", profissional-only
- ✅ ANVISA parqueado: mesmo princípio aplicado preventivamente — quando ativar, manter pattern
- ✅ Disclaimer obrigatório no UI: cristalizado no pubmedService.ts comentário desde V1.9.369-A

## Anti-padrões a vigiar (rejeitar se aparecerem)

- 🔴 *"Baseado nos sintomas do paciente, Nôa sugere medicamento X"*
- 🔴 *"Estes 3 medicamentos têm melhor evidência para [condição]"* (mesmo com fonte)
- 🔴 *"Substituir paracetamol por dipirona pode ser melhor pra este caso"*
- 🔴 Cálculo automático de dose/posologia pra paciente direto
- 🔴 Alertas de interação medicamentosa SEM revisão médica
- 🔴 Síntese GPT comparando bulas

## Frase âncora

> *"Bula é dado factual público. Decisão terapêutica é ato médico CFM. IA organiza acesso ao primeiro, NUNCA participa do segundo. Atravessar essa fronteira = mudar identidade Nôa + risco regulatório existencial."*

## Trigger pra revisitar princípio

- Qualquer feature futura que toque informação farmacológica (sidecar interação medicamentosa, alerta dose, comparador de bulas)
- Sugestão GPT externo / Lovable / parecer institucional propondo "IA farmacológica"
- Reclamação paciente externo "queria que sistema me sugerisse remédio"
- Pressão regulatória ANVISA/CFM expandir uso clínico de IA
