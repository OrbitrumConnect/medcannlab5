---
name: v1-9-477-renal-compact-sidecars-cognitivos-28-05
description: "V1.9.477 (commit fe3dea2, 28/05 ~01h05 BRT) finalizou Container 'Sidecars Cognitivos' após 5 iterações empíricas. Solução cirúrgica: prop opcional compact?: boolean no RenalSuggestionsCard que força grid interno cols-1 quando true (em vez de responsivo md/xl/2xl). Grid externo Sidecars Cognitivos voltou pra 4-col (grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-3). Caller Dashboard: <RenalSuggestionsCard compact /> renderiza OK em col estreita 4-col. Trigger validação Neuro paridade institucional preservado (V1.9.476-A FIX 2: 'Audit manual aguardando Dr. Eduardo Faveret' amber). Slots futuros Cardiovascular + Endócrino placeholders dim. Zero regressão Renal V1.9.309 (default false preserva callers existentes). ~10 linhas mudadas em 2 arquivos. Type-check verde. Push 4 refs OK."
metadata:
  node_type: memory
  type: project
  originSessionId: 00be2b9f-5dbc-4236-a02e-1459c3f57bd2
---

# 🩺🧠 V1.9.477 Renal Compact + Sidecars Cognitivos finalizado (28/05 madrugada)

## Contexto cronológico

V1.9.477 é o ponto cirúrgico FINAL após 5 iterações noite 27→28/05:

| Iteração | Resultado |
|---|---|
| V1.9.475 | Card Neuro embrião inicial |
| V1.9.475-A | side-by-side 2-col (regrediu Renal — revertido) |
| V1.9.475-B | 2 bugs (grid + visibilidade) corrigidos |
| V1.9.475-C | Audit Manual Fase C (4 sinais TDAH) |
| V1.9.475-D | parqueado empíricamente (memory dedicada) |
| V1.9.475-E | max-w-md (revertido depois) |
| V1.9.476 | Container Sidecars Cognitivos + grid 4-col + 2 slots futuros |
| V1.9.476-A | 2 bugs (grid 2-col tentativa rejeitada + trigger validação Neuro aprovado) |
| **V1.9.477** | **prop compact Renal + grid 4-col revertido + caller atualizado ⭐** |

## Solução técnica V1.9.477 (commit fe3dea2)

### Arquivo 1: `src/components/RenalSuggestionsCard.tsx`

```tsx
// [V1.9.477] prop compact opcional pra Card renderizar em col estreita
// (grid externo 2xl:grid-cols-4 = ~352-400px/col). Quando compact=true:
// força grid interno cols-1 (em vez de responsivo md/xl/2xl).
// Default false preserva comportamento atual (callers existentes intactos).
interface RenalSuggestionsCardProps {
  compact?: boolean
}

export default function RenalSuggestionsCard({ compact = false }: RenalSuggestionsCardProps = {}) {
  // ... linha 223 (grid interno):
  <div className={compact
    ? "grid grid-cols-1 gap-3"
    : "grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-5 gap-3"
  }>
```

### Arquivo 2: `src/pages/ProfessionalMyDashboard.tsx`

```tsx
{/* V1.9.477 (28/05 01:00 BRT) — Container Sidecars Cognitivos final */}
<div className="mb-6 rounded-2xl border border-slate-700/30 bg-gradient-to-br from-slate-900/40 via-emerald-950/5 to-slate-900/40 p-4">
  <div className="flex items-center gap-2 mb-3">
    <Activity className="w-3.5 h-3.5 text-slate-400" />
    <h3 className="text-[11px] font-semibold text-slate-300 uppercase tracking-wide">
      Sidecars Cognitivos
    </h3>
    <span className="text-[10px] text-slate-500">
      · sinais detectados em conversas reais
    </span>
  </div>
  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-3">
    <RenalSuggestionsCard compact />
    <NeuroSuggestionsCardPlaceholder />
    {/* + 2 slots futuros (Cardio + Endo) placeholders dim */}
  </div>
</div>
```

## Layout visual final esperado

**2xl viewport (≥1536px)**:
```
[Renal compact] [Neuro embrião] [Cardio dim] [Endo dim]
   1 mini-card     trigger amber    roadmap     roadmap
   vertical OK     4 sinais TDAH
   ✓ Aprovada      ⏳ Audit manual
   Ricardo 17/05   aguardando
                   Dr. Eduardo
```

**xl (1280-1536px)**: 3 cards linha 1 + 1 linha 2
**md (768-1280px)**: 2 cards por linha (2 linhas)
**mobile (<768px)**: 4 cards empilhados verticalmente

## Por que esta solução é cirúrgica

- **~10 linhas mudadas** em 2 arquivos (vs 50+ linhas de refator pattern espelhado)
- **Zero regressão** pra callers existentes (`<RenalSuggestionsCard />` sem prop continua idêntico)
- **Renal V1.9.309 lock preservado** via prop opcional opcional (não-edição-disruptiva)
- **Trigger validação Neuro paridade institucional** preservado (V1.9.476-A FIX 2)
- **Princípio polir-não-inventar** aplicado ao máximo

## Componente final do dashboard

```
Container Sidecars Cognitivos (gradient discreto)
├─ Header "🩺 SIDECARS COGNITIVOS · sinais detectados em conversas reais"
└─ Grid 4-col responsivo
   ├─ Renal V1.9.309 (compact=true → mini-cards verticais)
   │  └─ Mostra: "✓ Aprovada Ricardo 17/05" + Maria Pinto Pitoco 95% G3b
   ├─ Neuro V1.9.475-C placeholder (audit manual Fase C)
   │  └─ Mostra: "⏳ Audit manual aguardando Dr. Eduardo" + 4 sinais TDAH
   ├─ Cardiovascular placeholder dim (border-dashed)
   │  └─ "Pré-Fase A · roadmap · Sidecar futuro quando trigger empírico materializar"
   └─ Endócrino placeholder dim (border-dashed)
      └─ "Pré-Fase A · roadmap · Sidecar futuro quando trigger empírico materializar"
```

## Visibilidade RLS preservada

- **Card Renal**: RLS BD por vínculo `appointments` (paciente-médico) — V1.9.307
- **Card Neuro embrião**: visível pra TODOS profissionais + admin (V1.9.475-B correção visibilidade)
- **Placeholders futuros**: sempre visíveis (roadmap institucional)
- **Quando card individual retorna null**: grid colapsa naturalmente

## Princípios meta-arquiteturais aplicados

1. **Validação empírica via screenshot > plano teórico** (memory dedicada [[feedback_validacao_empirica_screenshot_maior_que_plano_teorico_28_05]])
2. **Polir-não-inventar** ([[feedback_polir_nao_inventar]])
3. **Zero regressão** — prop opcional, default preserva comportamento
4. **Anti-cristalização-prematura** — slots futuros DIM (não codifica Edges Cardio/Endo especulativos)
5. **Trigger empírico-driven** — feature multidisciplinar parqueada com triggers explícitos

## Pendências relacionadas pra próxima sessão

1. **Validar visual V1.9.477 em viewports diferentes** (mobile/md/xl/2xl) — possivelmente exige ajuste fino
2. **Eduardo validar Card Neuro V1.9.475-C/E** no laptop
3. **Eduardo trazer Fase B** (2-3 casos neuro reais) → gatilho V1.9.475-D refator real
4. **Smoke V1.9.474 trigger BD in vivo** (recomeçar AEC após invalidação)
5. **Marco 2 paciente externo pagante** materializar → Renal pode escalar e parar de precisar compact

## Frase âncora

> *"5 iterações Card Neuro/Renal evoluindo Container Sidecars Cognitivos. V1.9.477 prop compact é o ponto cirúrgico final: ~10 linhas, zero regressão, Renal V1.9.309 lock preservado, trigger validação Neuro paridade institucional, slots futuros roadmap visível. Solução cirúrgica venceu solução elegante após 4 falhas."*

## Substituição futura

Quando Eduardo trazer Fase B (2-3 casos neuro reais) + Fase D codada:

- Substituir `<RenalSuggestionsCard compact />` por `<RenalSuggestionsCard />` (sem compact) SE grid externo voltar pra 2-col ou 1-col
- OU adicionar mais sidecars no grid (Cardiovascular real, Endócrino real) → cada card vira col do grid 4-col
- Trigger empírico-driven: NÃO refatorar especulativamente

## Conexões

- [[feedback_validacao_empirica_screenshot_maior_que_plano_teorico_28_05]] — princípio meta que guiou esta solução
- [[project_v1_9_475_D_card_neuro_pattern_renal_parqueado_27_05]] — refator parqueado (ainda não-implementado)
- [[project_universo_sinais_neuro_tea_tod_tdah_mapa_completo_27_05]] — mapa Fase A do sidecar Neuro
- [[project_smoke_neuro_signal_report_2bdb57fb_27_05]] — smoke manual que populou Card Neuro Audit Fase C
- [[feedback_polir_nao_inventar]] — princípio aplicado
