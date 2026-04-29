# P0B GATE D — Patch DRAFT v2 (Opção Q controlada)

> **Status**: ✏️ Rascunho v2 madrugada 29/04 ~05h. **NÃO aplicado**.
> Pedro revisa amanhã. Aplicação prevista: próxima sessão técnica (~2h).
>
> **Decisão UX**: Opção **D** — *AEC só roda para pacientes com appointment criado*.
> **Estratégia**: **Opção Q controlada** — defesa em profundidade em 3 camadas
> via helper único canônico (descoberta empírica madrugada 29/04 ~04h-05h:
> existem 3 caminhos de finalização, 1 fora do gate original).
>
> **Princípio operacional crítico** (GPT-Ricardo):
> > *"P0b NÃO pode alterar lógica do AEC. Só pode atuar ANTES de entrar no pipeline."*

---

## 0. Mapa empírico dos pontos de gate

```
ENTRADA AEC:
  Camada A — frontend, antes de ativar smart lock
             (noaResidentAI.ts:284 OU clinicalAssessmentFlow.startAssessment:404)

SAÍDA AEC (defesa em profundidade):
  Camada B — backend tradevision-core:1716
             trigger: action='finalize_assessment' (frontend explícito)

  Camada C — backend tradevision-core:5048
             trigger: aiResponse contém [ASSESSMENT_COMPLETED]
             (DOMINANTE em prod — quando AEC chega ao fim, sistema injeta
              tag e dispara pipeline automaticamente, linha 4947-4958)

DEAD CODE PROVÁVEL:
  Caminho 3 — tradevision-core:2587
             if (action='finalize_assessment') duplicado
             linha 1740 retorna response ANTES, então 2587 é inalcançável
             ATAQUE: marcar TODO de unificação, NÃO tocar lógica
```

---

## 1. Helper único canônico (single source of truth)

### Novo arquivo: `src/lib/aecGate.ts`

```typescript
/**
 * V1.9.100-P0b — Gate D unificado para responsabilidade clínica.
 *
 * Verifica se paciente tem contexto médico válido (appointment com
 * profissional ativo). Substitui o fallback hardcoded silencioso
 * que estava em DOCTOR_RESOLUTION (tradevision-core:1208-1279).
 *
 * Decisão UX: Opção D — Ricardo via GPT 29/04
 * Estratégia: defesa em profundidade — usado em 3 camadas (frontend
 * entrada AEC, backend caminho 1 finalize explícito, backend caminho 2
 * tag automática).
 *
 * NÃO toca lógica do AEC. Só decide quem pode entrar/sair do pipeline.
 */

import type { SupabaseClient } from '@supabase/supabase-js'

export type GateResult =
  | { ok: true; doctor_id: string }
  | {
      ok: false
      reason:
        | 'NO_PATIENT_ID'
        | 'NO_APPOINTMENT'
        | 'NO_VALID_DOCTOR_LINKED'
        | 'DB_ERROR'
        | 'EXCEPTION'
      ux_action?: 'SCHEDULE_APPOINTMENT' | 'CONTACT_SUPPORT'
    }

/**
 * Verifica se paciente tem médico válido vinculado via appointment.
 * Fail-closed: em caso de erro de DB, NEGA acesso.
 */
export async function assertPatientHasDoctorContext(
  supabase: SupabaseClient,
  patientId: string | null | undefined,
): Promise<GateResult> {
  if (!patientId) {
    return { ok: false, reason: 'NO_PATIENT_ID', ux_action: 'CONTACT_SUPPORT' }
  }

  try {
    // Busca até 5 últimos appointments com professional vinculado
    const { data: appts, error } = await supabase
      .from('appointments')
      .select('id, professional_id, status, scheduled_at')
      .eq('patient_id', patientId)
      .not('professional_id', 'is', null)
      .in('status', ['scheduled', 'confirmed', 'in_progress', 'completed'])
      .order('scheduled_at', { ascending: false })
      .limit(5)

    if (error) {
      console.error('[AEC_GATE] DB error consultando appointments:', error)
      return { ok: false, reason: 'DB_ERROR', ux_action: 'CONTACT_SUPPORT' }
    }

    if (!appts || appts.length === 0) {
      return { ok: false, reason: 'NO_APPOINTMENT', ux_action: 'SCHEDULE_APPOINTMENT' }
    }

    // Validar que cada candidato professional ainda está ativo
    for (const appt of appts) {
      const { data: prof } = await supabase
        .from('users')
        .select('id, type')
        .eq('id', appt.professional_id)
        .eq('type', 'professional')
        .maybeSingle()

      if (prof?.id) {
        return { ok: true, doctor_id: prof.id }
      }
    }

    return { ok: false, reason: 'NO_VALID_DOCTOR_LINKED', ux_action: 'CONTACT_SUPPORT' }
  } catch (e) {
    console.error('[AEC_GATE] Exceção:', e)
    return { ok: false, reason: 'EXCEPTION', ux_action: 'CONTACT_SUPPORT' }
  }
}

/**
 * Mensagem amigável para mostrar ao paciente quando gate bloqueia.
 */
export function getGateBlockMessage(reason: GateResult extends { ok: false } ? GateResult['reason'] : never): {
  title: string
  body: string
  cta?: string
} {
  switch (reason) {
    case 'NO_APPOINTMENT':
      return {
        title: 'Agende sua consulta primeiro',
        body: 'A Avaliação Clínica Estruturada (AEC) funciona em conjunto com sua consulta. Vamos agendar?',
        cta: 'Agendar consulta',
      }
    case 'NO_VALID_DOCTOR_LINKED':
      return {
        title: 'Médico não disponível',
        body: 'O médico vinculado ao seu agendamento não está mais ativo. Por favor, reagende com outro profissional.',
        cta: 'Reagendar',
      }
    default:
      return {
        title: 'Não foi possível iniciar a avaliação',
        body: 'Houve um problema técnico. Por favor, tente novamente em alguns minutos ou contate o suporte.',
      }
  }
}
```

### Versão Deno (Edge Function) — `supabase/functions/_shared/aec_gate.ts`

```typescript
// Mesma lógica, adaptada para Deno (sem ESM imports do Node).
// Importado no tradevision-core/index.ts para usar nos 2 pontos de saída.

export type GateResult =
  | { ok: true; doctor_id: string }
  | {
      ok: false
      reason: 'NO_PATIENT_ID' | 'NO_APPOINTMENT' | 'NO_VALID_DOCTOR_LINKED' | 'DB_ERROR' | 'EXCEPTION'
      ux_action?: 'SCHEDULE_APPOINTMENT' | 'CONTACT_SUPPORT'
    }

export async function assertPatientHasDoctorContext(
  supabase: any,
  patientId: string | null | undefined,
): Promise<GateResult> {
  // [... mesma lógica do front, sem dependência node ...]
}
```

---

## 2. Camada A — Frontend gate ENTRADA

### Local recomendado: `src/lib/noaResidentAI.ts:284`

**Antes** do smart lock ativar (linha 284), adicionar verificação:

```typescript
// [V1.9.19] Só paciente dispara carregamento de aec_state e smart-lock.
if (userId && isPatientForAec) {
  // 🛡️ [P0B GATE D — CAMADA A] Verificar contexto médico ANTES de qualquer init AEC
  const gateResult = await assertPatientHasDoctorContext(supabase, userId)
  if (!gateResult.ok) {
    console.warn('[P0B_GATE_A] AEC bloqueada na entrada:', gateResult.reason)

    // Retorna mensagem amigável SEM ativar AEC nem chamar Core
    const block = getGateBlockMessage(gateResult.reason)
    return {
      response: `${block.title}\n\n${block.body}`,
      requiresAction: 'redirect_to_scheduling',
      blocked_by: 'P0B_GATE_D',
      reason: gateResult.reason,
    }
  }

  // ✅ Gate passou — ativar smart lock como antes
  await clinicalAssessmentFlow.ensureLoaded(userId)
  const aecState = clinicalAssessmentFlow.getState(userId)
  // ... resto inalterado
}
```

### Bonus UI: bloquear botão "Iniciar AEC" se sem appointment

Hook que fica no header/dashboard:
```typescript
useEffect(() => {
  async function checkGate() {
    if (!user?.id) return
    const result = await assertPatientHasDoctorContext(supabase, user.id)
    setCanStartAEC(result.ok)
  }
  checkGate()
}, [user?.id])

// No botão: <Button disabled={!canStartAEC} ... />
```

---

## 3. Camada B — Backend caminho 1 (linha 1716)

```typescript
if (isFinalizeRequest) {
  console.log('🚀 [GATEWAY] Disparando Orquestrador de Finalização...')

  // 🛡️ [P0B GATE D — CAMADA B] Backend defesa em profundidade
  const gate = await assertPatientHasDoctorContext(supabaseClient, effectiveUserId)
  if (!gate.ok) {
    console.warn(`⛔ [P0B_GATE_B] Caminho 1 bloqueado — ${gate.reason}`)

    // Log estruturado
    try {
      await supabaseClient.from('noa_logs').insert({
        user_id: effectiveUserId,
        interaction_type: 'p0b_gate_blocked',
        payload: { layer: 'B', reason: gate.reason, interaction_id, path: 'caminho_1' },
      })
    } catch (e) { /* não bloqueia */ }

    return new Response(
      JSON.stringify({
        success: false,
        error_code: 'DOCTOR_REQUIRED',
        error_reason: gate.reason,
        message: 'É necessário ter um médico vinculado antes de finalizar a avaliação.',
        action: gate.ux_action ?? 'SCHEDULE_APPOINTMENT',
      }),
      {
        status: 409,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      },
    )
  }

  // ✅ Gate passou — pipeline original SEGUE INTOCADO
  let finalizeResult: { report_id: string | null; status: string; error?: string } = { /* ... */ }
  // [resto do código original]
}
```

---

## 4. Camada C — Backend caminho 2 (linha 5048) ⚠️ ESTE É O CRÍTICO

```typescript
// 🧬 [BACK-TO-APRIL-4] AUTOMATIC CLINICAL ORCHESTRATION v2
if (aiResponse?.includes('[ASSESSMENT_COMPLETED]')) {
  const orchestratorPatientId = assessmentData?.patient_id || effectiveUserId

  if (orchestratorPatientId) {
    // 🛡️ [P0B GATE D — CAMADA C] CAMINHO DOMINANTE em prod
    const gate = await assertPatientHasDoctorContext(supabaseClient, orchestratorPatientId)
    if (!gate.ok) {
      console.warn(`⛔ [P0B_GATE_C] Caminho 2 bloqueado (tag automática) — ${gate.reason}`)

      // Log estruturado
      try {
        await supabaseClient.from('noa_logs').insert({
          user_id: orchestratorPatientId,
          interaction_type: 'p0b_gate_blocked',
          payload: { layer: 'C', reason: gate.reason, interaction_id, path: 'caminho_2_auto_tag' },
        })
      } catch (e) { /* não bloqueia */ }

      // Estratégia: REMOVER a tag do aiResponse pra frontend não interpretar como completed
      // E adicionar mensagem clara ao paciente
      aiResponse = aiResponse
        .replace('[ASSESSMENT_COMPLETED]', '')
        .replace('[FINALIZE_SESSION]', '')
        .trim()

      const blockMsg = '\n\n⚠️ **Para finalizar sua avaliação, é necessário agendar uma consulta com um médico antes.** Por favor, acesse a área de agendamento.'
      aiResponse = aiResponse + blockMsg

      // SKIP pipeline (não chamar handleFinalizeAssessment)
      // Pula direto pra logging normal abaixo
    } else {
      // ✅ Gate passou — pipeline orquestrador roda como antes
      console.log('📝 [ORCHESTRATOR] Detectado fechamento clínico. Disparando Pipeline...', { orchestratorPatientId })

      const isAssessmentDataEmpty = !assessmentData || Object.keys(assessmentData).length <= 1
      const sourceData = isAssessmentDataEmpty ? aecSnapshot || {} : assessmentData

      try {
        await handleFinalizeAssessment({
          supabaseClient,
          openai,
          interaction_id,
          assessmentData: { ...sourceData, patient_id: orchestratorPatientId },
          patientData,
          professionalId,
          fallbackUserId: effectiveUserId,
        })
      } catch (orchErr) {
        console.error('❌ [ORCHESTRATOR] Erro no pipeline:', orchErr)
      }
    }
  }
}
```

---

## 5. Caminho 3 (linha 2587) — TODO de unificação

**Não tocar lógica agora.** Apenas marcar:

```typescript
// ⚠️ TODO P0b unify: este `if (action === 'finalize_assessment')` é
// duplicado da linha 1712 (caminho 1). Em prática, linha 1740 retorna
// response ANTES desta linha ser alcançada — provável dead code.
//
// Tem fallback hardcoded próprio (linha 2619, 2622) com mesmo UUID
// Ricardo. Se algum dia ficar acessível, viola gate D.
//
// AÇÃO FUTURA: validar via logs prod se este path dispara. Se nunca,
// remover. Se sim, refatorar para chamar assertPatientHasDoctorContext.
if (action === 'finalize_assessment') {
  // [resto do código intocado]
}
```

---

## 6. Smoke test plan (4 cenários — refinado)

```
Cenário 1 — Paciente sem appointment tenta INICIAR AEC
  Setup:    Paciente novo, ZERO appointments
  Input:    Envia primeira mensagem ao chat
  Esperado: Camada A bloqueia, retorna mensagem amigável,
            NÃO ativa smart lock, NÃO chama Core para AEC
  Log:      noa_logs.interaction_type='p0b_gate_blocked' layer='A'

Cenário 2 — Paciente sem appointment tenta FINALIZAR (action explícito)
  Setup:    Bypassa frontend gate, chama Edge com action='finalize_assessment'
  Input:    POST direto à Edge Function
  Esperado: Camada B bloqueia, HTTP 409 + error_code='DOCTOR_REQUIRED'
  Log:      noa_logs.interaction_type='p0b_gate_blocked' layer='B'

Cenário 3 — GPT emite [ASSESSMENT_COMPLETED] sem médico (fluxo normal)
  Setup:    Paciente sem appointment + AEC chegou ao fim (improvável se A funcionou)
  Input:    aiResponse contém tag automática
  Esperado: Camada C remove tag, adiciona mensagem alerta, SKIP pipeline
  Log:      noa_logs.interaction_type='p0b_gate_blocked' layer='C'

Cenário 4 — Paciente COM appointment ativo (caminho feliz)
  Setup:    1 appointment scheduled + médico válido
  Input:    AEC normal start → fim
  Esperado: Todas as camadas passam, pipeline roda normalmente,
            report_id retornado, signature complete
  Log:      Não há entry de p0b_gate_blocked
```

---

## 7. Princípios cristalizados aplicados

```
✅ "Gate antes do pipeline" (não dentro)
✅ Helper único = single source of truth (DRY + manutenção)
✅ Defesa em profundidade (3 camadas)
✅ Fail-closed em ambiguidade (DB error nega)
✅ Log estruturado por camada (auditável)
✅ Erro humano claro (não 500 silencioso)
✅ Lock V1.9.95+97+98+99-B preservado
✅ P10 (substituição silenciosa) eliminada por construção
✅ Caminho 2 (dominante em prod) coberto
```

---

## 8. Checklist de aplicação (próxima sessão)

```
☐ Criar src/lib/aecGate.ts (helper canônico)
☐ Criar supabase/functions/_shared/aec_gate.ts (versão Deno)
☐ Aplicar Camada A em src/lib/noaResidentAI.ts:~284
☐ Aplicar Camada B em supabase/functions/tradevision-core/index.ts:~1716
☐ Aplicar Camada C em supabase/functions/tradevision-core/index.ts:~5048
☐ Adicionar TODO comment em tradevision-core/index.ts:~2587
☐ (opcional) Hook UI no botão "Iniciar AEC" no PatientDashboard
☐ Aplicar V1.9.100 migration (5min — copy/paste SQL Editor)
☐ Deploy Edge Function: npx supabase functions deploy tradevision-core
☐ Smoke tests cenários 1-4 (~45min)
☐ Push 4 refs: hub/main + hub/master + origin/main + origin/master
☐ Bumpar versão V1.9.100-P0b
☐ Documentar em diário 29 (bloco F+)
```

**Tempo total estimado**: ~2h-2h30 (helper + 3 camadas + migration + smoke + deploy + push)

---

## 9. O que este patch NÃO toca (LOCK PRESERVATION)

```
❌ tradevision-core handleFinalizeAssessment (linha 1126+)
❌ clinicalAssessmentFlow FSM (16 fases intocadas)
❌ Pipeline orchestrator (REPORT→SCORES→...)
❌ Verbatim First V1.9.86
❌ AEC Gate V1.5
❌ COS Kernel
❌ Signature ICP-Brasil
❌ DOCTOR_RESOLUTION existente (linhas 1208-1279) — fica como
   defesa em profundidade, mas inacessível em prod com gates ativos
❌ IMRE motor cognitivo (parte do método de Ricardo)
❌ 28 blocos modulares
```

**Lock V1.9.95+97+98+99-B preservado integralmente.**

---

## 10. Frase-âncora v2

> *"Helper único canônico. 3 camadas de defesa. Caminho 2 dominante coberto.
> Gate ANTES do pipeline. Lock preservado. Fallback silencioso eliminado
> por construção. P10 resolvida estruturalmente. Não é mais 'corrigir bug'
> — é 'primeira trava real de responsabilidade clínica do sistema'."*

---

*Draft v2 preparado 2026-04-29 ~05h BRT por Claude Opus 4.7 (1M context).*
*Pedro revisa amanhã com cabeça fresca antes de aplicar.*
*Próxima sessão técnica: ~2h-2h30 pra aplicar tudo (helper + 3 camadas + smoke + deploy + push).*
