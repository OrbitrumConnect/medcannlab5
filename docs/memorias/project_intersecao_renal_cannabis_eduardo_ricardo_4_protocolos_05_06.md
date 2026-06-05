---
name: project_intersecao_renal_cannabis_eduardo_ricardo_4_protocolos_05_06
description: "Interseção clínica renal × cannabis × Eduardo-neuro JÁ ESTÁ CRAVADA no codebase em 4 protocolos formais dentro de CidadeAmigaDosRins.tsx + Sidecar Renal V1.9.307 + cannabisMetabolism em noaResidentAI.ts. Confirmação 05/06 pós-jantar: a conexão Ricardo+Eduardo não é especulação — é arquitetura existente esperando ativação. Protocolos: avaliacao-cannabis (Ativo) / drcteza DRC+TEZ Integrada (Beta Controlado) / renal-medcannlab Saúde Renal+Cannabis (Consulta Pública, milestones Nov/2025-Jan/2026 envelhecidas) / onboarding-profissionais Cannabis (Em elaboração). Eixo farmacológico: CBD via CYP2C9+CYP3A4 → metabólitos excretados via rim → DRC altera excreção + polifarmácia + indicações cruzadas (prurido urêmico, neuropatia periférica, encefalopatia). TEZ ainda não confirmado (não é CID-11 standard) — Pedro precisa confirmar com Ricardo."
type: project
---

# Interseção renal × cannabis × Eduardo-neuro — 4 protocolos JÁ cravados

## A descoberta empírica 05/06 pós-jantar

Pedro perguntou: "saúde renal + cannabis medicinal, existe conexão onde? Cannabis é óleo + pacientes renais têm problemas com óleos. Como conectar Eduardo (neuro/cannabis) e Ricardo (renal)?"

Busca empírica no codebase revelou: **a conexão JÁ está cravada em 4 protocolos formais** em [CidadeAmigaDosRins.tsx:437-512](src/pages/CidadeAmigaDosRins.tsx#L437) — não é proposta nova, é arquitetura existente esperando ativação.

## Os 4 protocolos cravados

| Protocolo (ID) | Título | Eixos | Status | Conexão Ricardo×Eduardo |
|---|---|---|---|---|
| `avaliacao-cannabis` | Avaliação Clínica Inicial IMRE • Cannabis Medicinal | Clínica + Ensino | **Ativo** | Base AEC focada cannabis. Gera relatório + NFT após validação paciente |
| `drcteza` | Estratificação DRC + TEZ Integrada | Clínica + Pesquisa | **Beta Controlado** | DRC (Ricardo) × TEZ neuropsiquiátricas (Eduardo). ⚠️ TEZ não é CID-11 standard |
| `renal-medcannlab` | Protocolo MedCannLab de Saúde Renal com Cannabis Medicinal | Clínica + Pesquisa + Ensino | **Consulta Pública** | LITERAL — *"Evolução do CAR com foco em terapias canabinoides. Inclui IMRE renal + diagnóstico DRC e TEZ + plano terapêutico"* |
| `onboarding-profissionais` | Onboarding de Profissionais para Cannabis Medicinal | Ensino + Clínica | **Em elaboração** | *"Adaptação da estrutura CAR pra credenciar novos profissionais"* |

**⚠️ Milestones do `renal-medcannlab` estão STALE** — datadas Nov/2025-Jan/2026, envelheceram em ~6 meses. Precisa repactuar com Ricardo (próxima reunião).

## Eixo farmacológico real (justificativa clínica)

- **CBD** metabolizado via **CYP2C9 + CYP3A4** (citocromos hepáticos)
- Metabólitos excretados via **rim**
- Pacientes DRC: excreção alterada → **acúmulo metabólitos**
- DRC + polifarmácia (anti-hipertensivos, EPO, fosfato binders) → interações CYP3A4 (CBD é inibidor)
- Indicações cruzadas DRC: **prurido urêmico, dor crônica, insônia, neuropatia periférica**
- Interseção Eduardo-Ricardo: **encefalopatia urêmica + neuropatia periférica** = DRC com sintoma neuro

## O que o codebase entende empíricamente

| Camada | Localização | Status |
|---|---|---|
| Modelo metabolismo CBD | [noaResidentAI.ts:147](src/lib/noaResidentAI.ts#L147) `cannabisMetabolism: {cyp2c9, cyp3a4, metabolismRate}` | ✅ código existe |
| Diretriz monitoramento renal × cannabis | [noaResidentAI.ts:1276](src/lib/noaResidentAI.ts#L1276) | ✅ código existe |
| Sidecar Renal V1.9.307 captura labs | Edge + DB | ✅ produção |
| Sidecar Renal captura SINTOMAS precoces 1-3 | — | ❌ gap (cálculo renal, IRA recidivante, dor lombar, disúria) |
| CBG/CBN no modelo | — | ❌ gap (sistema só conhece CBD/THC) |
| Alerta NSAIDs em DRC | — | ❌ gap |
| Score remissão DRC | — | ❌ gap (artigo recente Ricardo trouxe — janela nova) |

## Rotas no app (onde a interseção conecta UX)

| Rota | Componente |
|---|---|
| `/app/pesquisa/profissional/cidade-amiga-dos-rins` | CAR página principal |
| `/app/library?collection=protocolos&protocol=drcteza` | DRC×TEZ ferramenta |
| `/app/clinica/paciente/avaliacao-clinica` | IMRE Cannabis (rota AEC focada cannabis) |
| `/app/library?draft=protocolo-renal-medcannlab` | Protocolo renal-cannabis (rascunho) |
| `/app/library?draft=onboarding-cannabis-profissionais` | Onboarding pros |

## Por que isso importa estrategicamente

1. **Validação convergência empírica**: Ricardo (renal) + Eduardo (neuro) + cannabis = não é mistura forçada, é fronteira clínica real cravada há meses no código.
2. **CARD-RJ pitch (Cidade Amiga dos Rins Digital — pitch_prefeitura_rj_top_master_14_05.md) tem isso como diferencial** — interseção renal+cannabis com cobertura neuro = camada complementar (não substitui Tasy/Soul MV).
3. **Sociedade Brasileira de Nefrologia** (anchor R$ 122 × 70k) pode receber pitch com **estagiamento DRC pré-creatinina + terapia anti-inflamatória cannabis** como dois braços do mesmo produto.
4. **Quarta-feira com os alunos** (Eduardo + Ricardo + Fernando Bossa) — interseção neuro+renal já é tema cravado, não precisa inventar conteúdo.

## Pendências de validação Ricardo

1. **TEZ** — o que é exatamente? Não é CID-11 standard. Nomenclatura própria? Acrônimo?
2. **Milestones `renal-medcannlab`** Nov/2025-Jan/2026 → repactuar pra 2026 H2?
3. **Status real `drcteza` "Beta Controlado"** — quantos pacientes? Dado empírico via PAT.

## Conexões

- `project_modelo_pricing_ricardo_122_relatorio_70k_drc_05_06` — pricing comercial
- `reference_mapa_farmacologico_drc_cannabinoides_anti_inflamatorios_05_06` — referência farmacológica
- `project_remissao_drc_inflamatoria_anchor_pesquisa_05_06` — anchor científico Ricardo
- `project_curso_eduardo_pre_criado_ricardo_pendente_05_06` — gap ambiente curso Ricardo
- `project_universo_sinais_neuro_tea_tod_tdah_mapa_completo_27_05` — mapa neuro Eduardo
- `feedback_ricardo_quer_integrar_seguranca_paciente_gestao_risco_05_06` — vertente institucional

## Frase ancora

> *"05/06 pós-jantar Pedro perguntou onde renal+cannabis+Eduardo se conectam. Busca empírica revelou: a conexão JÁ está cravada em 4 protocolos formais dentro de CidadeAmigaDosRins.tsx desde antes — avaliacao-cannabis (Ativo) / drcteza DRC+TEZ Integrada (Beta) / renal-medcannlab Saúde Renal+Cannabis (Consulta Pública) / onboarding-profissionais (Em elaboração). + Sidecar Renal V1.9.307 + cannabisMetabolism em noaResidentAI.ts. Não é especulação, é arquitetura existente esperando ativação. Milestones renal-medcannlab Nov/2025-Jan/2026 STALE (repactuar). TEZ pendente confirmação Ricardo (não é CID-11). Gaps: sintomas precoces / CBG-CBN / alerta NSAIDs / score remissão DRC."*
