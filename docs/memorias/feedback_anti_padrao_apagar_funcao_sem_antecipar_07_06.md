---
name: feedback_anti_padrao_apagar_funcao_sem_antecipar_07_06
description: "Principio meta cravado por Pedro 07/06 noite ~22h30 BRT: antes de aplicar mudanca UX visivel, ANTECIPAR NARRATIVA explicando 'vou substituir X por Y, comportamento muda de Z pra W'. NAO chegar com fato consumado. Caso empirico V1.9.624: substitui return null por empty state no RenalSuggestionsCard sem antecipar -> Pedro pensou que eu APAGUEI a funcao do Sidecar Renal V1.9.307. Demorou 5 min de audit empirico pra esclarecer que Edge intocada + cron rodando + funcao calculateEGFR intacta. Comunicacao reativa = atrito desnecessario."
type: feedback
---

# Antes de touch UX visível, antecipar narrativa (não chegar com fato consumado)

## A regra

Antes de aplicar mudança UX que altera o que o usuário VÊ na tela:
1. **Antecipar narrativa** numa frase: *"Vou substituir X por Y. Comportamento muda de Z (antes) pra W (agora). Anti-regressão preservada porque [...]"*
2. **Esperar GO explícito** se houver risco de o usuário interpretar como "apagamento"
3. **NÃO chegar com fato consumado** se a mudança remove/oculta algo visível (mesmo que substitua por equivalente)

## Why (caso empírico V1.9.624 → confusão Pedro)

**07/06 ~22h** — Apliquei V1.9.624 substituindo `return null` por empty state no `RenalSuggestionsCard.tsx`:
```ts
// ANTES
if (suggestions.length === 0) return null

// DEPOIS
if (suggestions.length === 0) {
  return (
    <div className="...empty state padronizado...">
      Sugestões DRC — Nenhuma sugestão pendente
      Sidecar Renal V1.9.307 auto-extrai...
    </div>
  )
}
```

**Razão técnica**: padronizar com os 3 sidecars novos (Neuro/Relato/Cannabis que já tinham empty state).

**Mas Pedro viu o card e flagou**:
> "Sugestões DRC — Nenhuma sugestão pendente... que isso amigo que isso ?! por que ta se mdados que isso teve regerssao aqui por que? o caso o calculo tudo que fazia ja vc apagou essa funcao?! oq aconteceu amigao"

**Pedro pensou que eu APAGUEI**:
- A função do Sidecar Renal V1.9.307
- O cálculo CKD-EPI
- O pipeline auto-extração

**Realidade empírica (rodei PAT pra provar)**:
- Edge `renal-signal-extractor` v4 ATIVA (zero linhas tocadas)
- Cron `renal-signal-extractor-15min` ATIVO (96 runs/24h, 100% sucesso)
- Função `calculateEGFR` INTOCADA
- Tabelas `renal_inline_suggestions` + `renal_exams` INTOCADAS
- A única sugestão (Maria das Dores) foi arquivada **17/05 pelo Ricardo** — não por mim
- Empty state é UI NOVA, mas comportamento "sem sugestão pendente" sempre existiu (antes era return null = sumia)

**Demorou ~5 min de audit empírico via PAT pra esclarecer.** Atrito desnecessário, frustração legítima do Pedro.

## How (procedimento operacional)

### Pre-touch UX visível

Pra qualquer Edit que altere o que aparece na tela do usuário (componente UI):

1. **Avaliar nivel de visibilidade da mudança**:
   - LOW: cosmético (cor, padding, font-size) → aplicar direto
   - MEDIUM: novo elemento adicionado → mencionar no commit message
   - **HIGH: remover/substituir elemento existente OU alterar comportamento "sem dado"** → ANTECIPAR

2. **Pra mudanças HIGH, ANTES de aplicar**:
   ```
   "Vou substituir [comportamento atual visível] por [novo comportamento].
   
   Por quê: [razão técnica/UX]
   
   Antes você vê: [estado atual]
   Depois você vê: [estado novo]
   
   Anti-regressão: [comportamento preservado / dados intactos / lock X]
   
   Posso aplicar?"
   ```

3. **Esperar GO ou questionamento do usuário** antes do Edit

### Casos específicos onde sempre antecipar

- ❌ Substituir `return null` por outro JSX (mesmo que melhor) — usuário VÊ aparecer onde antes era vazio
- ❌ Remover botão/menu/feature visível (mesmo se obsoleto)
- ❌ Reordenar tabs/seções (memória muscular do usuário)
- ❌ Mudar texto de label clínico (médico decora "Ureia", troca pra "A/Cr" precisa contexto)
- ❌ Esconder informação (mesmo que tecnicamente correto)
- ✅ Aplicar direto: fontes maiores, padding, cores secundárias, tooltips novos

### Exemplo correto (como devia ter feito V1.9.624)

> "Vou substituir o `return null` do RenalSuggestionsCard por empty state padronizado (mesmo pattern dos 3 sidecars novos Neuro/Relato/Cannabis).
>
> **Antes**: card sumia 100% quando sem sugestões pendentes (Maria archived 17/05 → card invisível agora).
> **Depois**: card aparece com 'Sugestões DRC — Nenhuma sugestão pendente' + caption sobre Sidecar V1.9.307.
>
> **Anti-regressão**: Edge `renal-signal-extractor` v4 INTOCADA, cron V1.9.610 rodando 96/24h sucesso, função `calculateEGFR` intacta, tabelas inalteradas. Só UI muda.
>
> Posso aplicar?"

## Quando aplicar

- ✅ SEMPRE em mudanças HIGH visibility
- ✅ Quando substituir comportamento "default/sem dado"
- ✅ Quando remover qualquer elemento UI
- ✅ Quando mudar label clínico/técnico que médico decora

## Quando NÃO aplicar (excecões razoáveis)

- ❌ Cosmético puro (cor, padding, espaçamento)
- ❌ Bug fix óbvio (typo, link quebrado)
- ❌ Pedido EXPLÍCITO do usuário ("faz X")

## Anti-padrões a vigiar

- ❌ "Vai ficar melhor depois, vou aplicar" → presunção sem aval
- ❌ "Mudança técnica menor, não precisa explicar" → minimização incorreta
- ❌ "Type-check verde, está OK" → técnico ≠ UX
- ❌ "Padronizar é sempre bom" → padronização pode confundir muscle memory

## Conexões

- `feedback_auditar_componente_inteiro_antes_de_touch_07_06` (lição irmã do mesmo dia)
- `feedback_validacao_empirica_screenshot_maior_que_plano_teorico_28_05` (screenshot > teoria)
- `feedback_pedro_nao_usar_card_de_escolha` (Pedro estilo direto, não card)
- `feedback_aec_como_repelente_natural_de_demanda_fora_escopo_24_05` (Princípio Pedro: 3 recalibrações)
- `feedback_regra_operacional_canonica_06_05` (TOPO ABSOLUTO regra V1)

## Frase ancora

> *"07/06 noite Pedro reclamou 'que isso amigo que isso ?! vc apagou essa funcao?!' apos V1.9.624 substituir return null por empty state no RenalSuggestionsCard. Realidade: NADA apagado (Edge V1.9.307 + cron V1.9.610 + funcao calculateEGFR intactos). MAS comunicacao reativa demorou 5min pra esclarecer via PAT. Lecao: mudancas UX HIGH visibility exigem ANTECIPAR narrativa antes do Edit ('vou substituir X por Y, antes ve Z, depois ve W, anti-regressao [...], posso aplicar?'). NUNCA chegar com fato consumado quando remove/substitui elemento visivel - mesmo que tecnicamente melhor."*
