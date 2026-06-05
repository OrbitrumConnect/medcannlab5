---
name: reference_mapa_farmacologico_drc_cannabinoides_anti_inflamatorios_05_06
description: "Mapa farmacológico cravado por Ricardo Valença na reunião 05/06 pós-jantar — referência durável pra Sidecar Renal / Quick Prescriptions / cursos / pitch Sociedade Nefrologia. Contraindicações DRC por estágio (NSAIDs ibuprofeno/paracetamol/acetaminofeno PROIBIDOS estágio 4+, THC PERIGOSO acúmulo metabólico). Cannabinoides diferenciados: CBD=ansiolítico primariamente / CBG potencializa CBD = perfil ANTI-INFLAMATÓRIO seguro DRC / THC=evitar DRC ≥G4. Subgrupo dominante nefrologia: 80% diabéticos+hipertensos têm DRC estágio 5 no Brasil. Estágios precoces 1-2-3 = outros fenótipos (cálculo renal, IRA recidivante, dor lombar, disúria). Janela terapêutica nova: cannabis como anti-inflamatório alternativo aos AINEs proibidos."
type: reference
---

# Mapa farmacológico DRC × cannabinoides × anti-inflamatórios

## Fonte autoritativa

Dr. Ricardo Valença, reunião 05/06/2026 noite (jantar Pedro+Ricardo+João Vidal), trecho de gravação transcrita pós-pausa laptop. Densidade clínica específica — fonte primária pra arquitetura técnica e narrativa institucional.

## Subgrupo dominante nefrologia (anchor de escala)

**80% dos pacientes diabéticos + hipertensos no Brasil têm DRC estágio 5** (Ricardo cravou na mesa).
Maior grupo da nefrologia brasileira. Foco do pricing R$ 122 × 70k.

## Anti-inflamatórios PROIBIDOS em DRC

**Estágio ≥4 (eGFR <30)**: contraindicação absoluta:

| Fármaco | Risco DRC | Status |
|---|---|---|
| Ibuprofeno (AINE não-seletivo) | Vasoconstrição renal + necrose tubular | ❌ PROIBIDO |
| Paracetamol (acetaminofeno) | Hepatotoxicidade + nefrite intersticial em altas doses | ❌ EVITAR (>2g/d) |
| Acetaminofeno (mesmo que paracetamol) | Idem | ❌ EVITAR |
| Outros AINEs (naproxeno, diclofenaco) | Vasoconstrição + IRA pré-renal | ❌ PROIBIDOS |
| Corticoides (anti-inflamatório hormonal) | Não-mencionados como proibidos — Ricardo disse "tira todos esses" referindo-se aos não-hormonais | 🟡 contexto |

**Frase Ricardo**: *"Se usar, fodeu. Estágio 4 tá aí, não vai meu irmão. Aí a pessoa que eu tenho pena do cara que prescreveu — não chegou informação para ele."*

→ **Case de UX**: alerta vermelho na prescrição quando paciente tem `drc_stage >= G3b` + médico tenta prescrever AINE/paracetamol.

## Cannabinoides — perfil diferenciado

⚠️ **CRÍTICO**: sistema HOJE só conhece CBD e THC. Não diferencia CBG/CBN. Gap a fechar.

| Canabinoide | Perfil terapêutico Ricardo | Uso DRC |
|---|---|---|
| **CBD** (cannabidiol) | **Ansiolítico** primariamente | OK em qualquer estágio (monitorar CYP3A4) |
| **CBG** (cannabigerol) | **Anti-inflamatório** — Ricardo: *"potencializa o CBG em cima do próprio CBD"* | **Alternativa anti-inflamatória segura DRC** (caminho terapêutico Ricardo) |
| **CBG + CBD combinado** | Anti-inflamatório potencializado | **CAMPO TERAPÊUTICO PRA REMISSÃO DRC** — Ricardo cravou |
| **THC** | Psicoativo + analgésico | ⚠️ **PERIGOSO DRC** — acúmulos metabólicos (estudos citados Ricardo). Estágio ≥G4 evitar |

**Frase Ricardo**: *"O CBD é o que processa ansiolítico, mas o anti-inflamatório, o melhor seria o CBG que potencializa em cima do próprio CBD. É o campo onde a gente começa a ter um canal de poder prescrever."*

## Estágios DRC × estratégia clínica

### Estágio 1-2-3 precoce (eGFR ≥30, pré-creatinina-grave)

**Fenótipos NÃO-DM/HAS** (Ricardo cravou os sintomas):
- Cálculo renal
- Insuficiência renal aguda **de repetição** (CRÍTICO)
- Dor nas costas / dor lombar / dor em flanco
- Dificuldade pra urinar (disúria)

**Postura clínica**: *"Tem que ir atrás dele, levar informação"* — busca ativa, não esperar.
**Sistema deve detectar**: Sidecar Renal V1.9.307 HOJE só captura labs (creatinina, eGFR, proteinúria). Gap A — expandir parser pra sintomas precoces.

### Estágio 4 (eGFR 15-29, severa)

- Cannabis OK com supervisão estrita
- THC contra-indicado (acúmulo)
- AINEs/paracetamol PROIBIDOS
- **CBG + CBD = alternativa anti-inflamatória**

### Estágio 5 (eGFR <15, terminal)

- Diálise iminente ou em curso
- Cannabis sob acompanhamento ultra-restrito
- THC e óleos viscosos: *"teria que ser supervisionado um óleo nessa galera por conta da substância, viscosidade"* — Ricardo

## Remissão DRC inflamatória — janela terapêutica nova

**Conceito que abre porta** (Ricardo cravou): *"Conversamos aqui — veja, abriu a porta para que a gente pense em remissão de doença renal crônica. Remissão de DRC não acontecia."*

- **Artigo recente** (Ricardo está lendo) mostra possibilidade de remissão via controle do **componente inflamatório**
- **Não é remissão de qualquer DRC** — é remissão da DRC inflamatória de pacientes DM+HAS (subgrupo 80%)
- Caminho: controlar inflamação SEM usar AINE/corticoide (proibidos)
- **Cannabis (CBG+CBD)** = vetor anti-inflamatório alternativo
- Anchor de pesquisa pra MedCannLab (vertente "segurança paciente" + Sociedade Nefrologia)

⚠️ **Pendente Pedro**: confirmar referência específica do artigo com Ricardo (NEJM? Lancet? KDIGO 2024-2026?).

## Crítica modelo de atenção atual (UX case)

Ricardo cravou: *"Diagnóstica o cara, vai pegar um ultrassom marcado em outra cidade, 10 meses depois nem lembrava mais. Liga pro cara, lá tem consulta de manhã, em outra cidade, paga transporte, médico não vai. Na segunda vez ele não vai. Aí aquela doença que poderia tratar aqui, vai ser vista 2 anos depois. Se era um tumor, piorou."*

**Princípio cravado**: *"Tem que conseguir produzir um sistema muito suave de resolução do problema"*.

**Implicação MedCannLab**: a plataforma **É** esse sistema suave — captura local + ágil + longitudinal. Pitch CARD-RJ (14/05) já cita isso, agora ganha case concreto.

## Implicações técnicas (gaps a fechar)

| Gap | Componente afetado | Esforço estimado |
|---|---|---|
| Sidecar Renal não capta sintomas precoces (cálculo/IRA repetição/dor lombar/disúria) | `renal-signal-extractor` Edge + parser | ~4-6h slug-test paralelo obrigatório |
| Sistema desconhece CBG/CBN | `noaResidentAI.ts:147` cannabisMetabolism + anvisaBularioSeed | ~3-4h |
| Sem alerta NSAID em DRC | `QuickPrescriptions.tsx` + view drc_stage | ~2-3h |
| Sem score remissão DRC longitudinal | view `v_drc_remission_tracking` + dashboard | ~4-6h |
| Sem busca ativa cohort de risco | outbound module (não existe) | ~8h+ — Marco 2 |

## Quando aplicar este mapa

- ✅ **SEMPRE** que codar feature que toca prescrição/cannabis/DRC
- ✅ Pitch Sociedade Brasileira de Nefrologia (R$ 122 × 70k anchor)
- ✅ Curso Ricardo (módulo "Mapa farmacológico DRC × cannabinoides")
- ✅ Pitch CARD-RJ atualizado (camada complementar — caso AINE + remissão)
- ✅ Material institucional segurança do paciente (vertente Ricardo cravou)

## Quando NÃO aplicar

- ❌ Não usar este mapa pra autorizar prescrição automática IA (atravessa Constituição Z2 + Lock Bula 27/05 — bula é infraestrutura cognitiva, decisão é do médico)
- ❌ Não cravar como guideline oficial sem peer-review formal Ricardo + Eduardo
- ❌ Não citar como "evidência médica MedCannLab" em material regulatório — é referência operacional, não guideline ANVISA

## Conexões

- `project_intersecao_renal_cannabis_eduardo_ricardo_4_protocolos_05_06` — protocolos onde isso ativa
- `project_remissao_drc_inflamatoria_anchor_pesquisa_05_06` — anchor científico
- `project_modelo_pricing_ricardo_122_relatorio_70k_drc_05_06` — pricing comercial
- `feedback_bula_e_infraestrutura_cognitiva_no_fluxo_prescricao_27_05` — bula no fluxo
- `feedback_fronteira_organizar_info_farmacologica_vs_decisao_terapeutica_27_05` — fronteira clínica
- Sidecar Renal V1.9.307 (`supabase/migrations/20260516200000_v1_9_307_renal_inline_suggestions.sql`)

## Frase ancora

> *"05/06 jantar Ricardo cravou densidade clínica DRC×cannabis: 80% DM+HAS = DRC G5 (subgrupo dominante). AINEs/paracetamol/acetaminofeno PROIBIDOS DRC ≥G3b ('se usar, fodeu'). THC perigoso DRC (acúmulos metabólicos). CBD=ansiolítico / CBG+CBD=ANTI-INFLAMATÓRIO POTENCIALIZADO = canal terapêutico pra remissão DRC inflamatória. Estágios precoces 1-3 = outros fenótipos (cálculo renal, IRA recidivante, dor lombar, disúria). Janela terapêutica nova: remissão DRC via controle inflamatório sem AINE/corticoide. Crítica modelo atual: 'sistema suave de resolução' = MedCannLab. Gaps técnicos: Sidecar não capta sintomas precoces / sistema desconhece CBG / sem alerta NSAID DRC / sem score remissão."*
