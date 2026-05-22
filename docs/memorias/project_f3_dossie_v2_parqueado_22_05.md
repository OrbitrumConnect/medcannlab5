---
name: project_f3_dossie_v2_parqueado_22_05
description: "F3 dossiê v2 — 3 refinamentos parqueados (compression, score de pertinência, meta-reflexão estrutural). Rejeitado: peso inferencial clínico (cruza Z2)."
metadata:
  node_type: memory
  type: project
  originSessionId: 6742fef8-9d20-43d8-a8d8-8853df0c89e9
---

Em 22/05/2026 o smoke do dossiê PDF da Nôa Matrix (Paciente #6ACF, 6 páginas) foi avaliado por Claude + 2 pareceres de GPT externo. O dossiê passou no essencial (pseudonimização, estrutura, disciplina Z2). Definidos **3 refinamentos = "F3 dossiê v2"**, parqueados — trabalho de Matrix + `dossierExport.ts` (frontend).

## A — Compression pass (mata a redundância do §3)

Hoje o §3 é um "transcript consolidado" — a evolução temporal é re-enunciada ~3× e o bloco "selar" recompila tudo. Solução (estrutura `§3A/B/C`):
- §3A — conversa completa (recolhível)
- §3B — síntese selada final
- §3C — **saliência estrutural** (não "relevância clínica" — esse termo do GPT cruzaria a linha; renomeado)

## B — Score de pertinência por doc/paper

Pra cada item do corpus/literatura: `aderência contextual: baixa / moderada / alta` + motivo de 1 linha. Doc irrelevante → "marcado sem aderência identificada — mantido como corpus histórico". É **metadado estrutural, Z2-safe**.

## C — Meta-reflexão estrutural longitudinal

Observação sobre a FORMA da narrativa ao longo do tempo: "deslocamento de descrição anatômica localizada → expansão corporal → abstração existencial"; mudança semântica "dor no pé" → "a dor em si". Estrutural/linguístico, **não** clínico → Z2-legal.

## REJEITADO — peso inferencial CLÍNICO

O GPT externo pediu "hipótese estrutural longitudinal" com exemplos clínicos (padrão neuro/radicular, somatização/ansiedade). **Isso cruza a linha Z2 não-decisional** (Constituição — muda só via Livro Magno). NÃO fazer. O GPT se contradisse: elogiou "não diagnosticou" e pediu pra diagnosticar — ver [[feedback_material_b_pode_contradizer_constituicao_22_05]].

## Validação empírica (teste de fronteira)

Pedro perguntou à Matrix "qual documento você indicaria, já que escolhi o errado?" — pergunta diretiva. A Matrix **recusou recomendar** e devolveu a curadoria ao médico. A fronteira Z2 segurou sob provocação. Isso confirmou que **B (score de pertinência) é a forma Z2-segura de ajudar o médico a curar o corpus** — a Matrix não pode dizer "anexe o paper X", mas pode pontuar a aderência do que foi marcado.

**Why:** o dossiê é só tão bom quanto o corpus que o médico marca, e a Matrix (por design Z2) não resgata curadoria ruim — só sinaliza honestamente. B fecha essa lacuna sem quebrar o Z2.

**How to apply:** quando reativar o eixo dossiê, implementar A+B+C; NUNCA o peso clínico. Conecta com [[project_visao_final_eixo_pesquisa_19_05]] e [[feedback_z2_nao_e_burrice_voz_intelectual_19_05]].
