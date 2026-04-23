// =============================================================================
// buildPatientContext — V1.9.8
// =============================================================================
// Monta um contexto factual do paciente para a Nôa (role=paciente) usando o
// client Supabase autenticado. RLS garante que o paciente só lê dados dele.
//
// Princípios:
//   - Fail-open: qualquer erro retorna null, e o Core responde como antes.
//   - SEM colunas incertas: só campos confirmados no schema.
//   - Zero efeito colateral: só SELECT, nada de INSERT/UPDATE.
//   - Best-effort: campos ausentes viram null; a Nôa admite honestamente
//     em vez de inventar.
//
// Uso:
//   const ctx = await buildPatientContext(userId)
//   if (ctx) payload.userContext = ctx
// =============================================================================

import { supabase } from './supabase'

export interface PatientContext {
  role: 'paciente'
  daysOnPlatform: number | null
  assessmentsCount: number
  lastAssessmentAt: string | null // ISO date
  nextAppointment: {
    date: string // ISO
    doctorName: string | null
    status: string | null
  } | null
  trial: {
    active: boolean
    endsAt: string | null // ISO
    daysLeft: number | null
  } | null
}

export async function buildPatientContext(userId: string): Promise<PatientContext | null> {
  if (!userId) return null

  try {
    // 1. Dados do próprio user (created_at + trial_ends_at)
    const { data: userData } = await supabase
      .from('users')
      .select('created_at, trial_ends_at')
      .eq('id', userId)
      .maybeSingle()

    // 2. Avaliações do paciente
    const { data: reports } = await supabase
      .from('clinical_reports')
      .select('id, created_at')
      .eq('patient_id', userId)
      .order('created_at', { ascending: false })
      .limit(20)

    // 3. Próxima consulta (futura, não cancelada)
    const nowIso = new Date().toISOString()
    const { data: nextAppt } = await supabase
      .from('appointments')
      .select('appointment_date, status, professional_name')
      .eq('patient_id', userId)
      .gte('appointment_date', nowIso)
      .neq('status', 'cancelled')
      .order('appointment_date', { ascending: true })
      .limit(1)
      .maybeSingle()

    // Derivados
    const daysOnPlatform = userData?.created_at
      ? Math.max(
          0,
          Math.floor(
            (Date.now() - new Date(userData.created_at).getTime()) / (1000 * 60 * 60 * 24)
          )
        )
      : null

    const trialEndsAt = (userData as any)?.trial_ends_at ?? null
    const trialDaysLeft = trialEndsAt
      ? Math.ceil((new Date(trialEndsAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
      : null
    const trialActive = trialDaysLeft !== null && trialDaysLeft > 0

    const ctx: PatientContext = {
      role: 'paciente',
      daysOnPlatform,
      assessmentsCount: reports?.length ?? 0,
      lastAssessmentAt: reports?.[0]?.created_at ?? null,
      nextAppointment: nextAppt
        ? {
            date: (nextAppt as any).appointment_date,
            doctorName: (nextAppt as any).professional_name ?? null,
            status: (nextAppt as any).status ?? null,
          }
        : null,
      trial: trialEndsAt
        ? {
            active: trialActive,
            endsAt: trialEndsAt,
            daysLeft: trialDaysLeft,
          }
        : null,
    }

    return ctx
  } catch (err) {
    console.warn('[buildPatientContext] falhou (fail-open, Core responde sem contexto):', err)
    return null
  }
}
