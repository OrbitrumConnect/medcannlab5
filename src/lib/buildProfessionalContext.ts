// =============================================================================
// buildProfessionalContext — V1.9.15
// =============================================================================
// Contexto factual do profissional logado (Dr. Ricardo, Dr. Eduardo, ou qualquer
// outro profissional cadastrado). Segue o padrão de buildPatientContext:
//
//   - Fail-open: qualquer erro → retorna null, Core responde como antes.
//   - Só SELECT, nada de INSERT/UPDATE.
//   - RLS-safe: queries filtram por professional_id, RLS valida no banco.
//   - Campos ausentes viram null/0; Nôa admite em vez de inventar.
//
// Uso:
//   const ctx = await buildProfessionalContext(userId)
//   if (ctx) payload.userContext = ctx
// =============================================================================

import { supabase } from './supabase'

export interface ProfessionalContext {
  role: 'professional'
  activePatientsCount: number
  todayAppointmentsCount: number
  todayAppointments: Array<{
    date: string // ISO
    patientName: string | null
    status: string | null
  }>
  nextAppointment: {
    date: string // ISO
    patientName: string | null
    status: string | null
  } | null
  prescriptionsLast30d: number
  reportsLast30d: number
  wallet: {
    balanceAvailable: number
    balancePending: number
  } | null
}

export async function buildProfessionalContext(
  professionalId: string,
): Promise<ProfessionalContext | null> {
  if (!professionalId) return null

  try {
    const now = new Date()
    const nowIso = now.toISOString()
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString()
    const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1).toISOString()
    const thirtyDaysAgoIso = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString()

    // Queries em paralelo (todas read-only, RLS-safe)
    const [
      activePatientsRes,
      todayAppointmentsRes,
      nextAppointmentRes,
      prescriptionsRes,
      reportsRes,
      walletRes,
    ] = await Promise.all([
      // 1. Pacientes ativos: distintos patient_id com appointments futuros não cancelados
      supabase
        .from('appointments')
        .select('patient_id')
        .eq('professional_id', professionalId)
        .gte('appointment_date', thirtyDaysAgoIso)
        .neq('status', 'cancelled'),

      // 2. Appointments de hoje (janela [início do dia, início do próximo])
      supabase
        .from('appointments')
        .select('appointment_date, status, patient_id')
        .eq('professional_id', professionalId)
        .gte('appointment_date', startOfDay)
        .lt('appointment_date', endOfDay)
        .neq('status', 'cancelled')
        .order('appointment_date', { ascending: true })
        .limit(10),

      // 3. Próximo appointment futuro
      supabase
        .from('appointments')
        .select('appointment_date, status, patient_id')
        .eq('professional_id', professionalId)
        .gte('appointment_date', nowIso)
        .neq('status', 'cancelled')
        .order('appointment_date', { ascending: true })
        .limit(1)
        .maybeSingle(),

      // 4. Prescrições CFM nos últimos 30 dias
      supabase
        .from('cfm_prescriptions')
        .select('id', { count: 'exact', head: true })
        .eq('professional_id', professionalId)
        .gte('created_at', thirtyDaysAgoIso),

      // 5. Clinical reports nos últimos 30 dias
      supabase
        .from('clinical_reports')
        .select('id', { count: 'exact', head: true })
        .eq('professional_id', professionalId)
        .gte('created_at', thirtyDaysAgoIso),

      // 6. Wallet do profissional
      supabase
        .from('wallets')
        .select('balance_available, balance_pending')
        .eq('user_id', professionalId)
        .maybeSingle(),
    ])

    // Resolver nomes de pacientes dos appointments de hoje + próximo (uma query agrupada)
    const todayRows = (todayAppointmentsRes.data ?? []) as Array<{
      appointment_date: string
      status: string | null
      patient_id: string | null
    }>
    const nextRow = nextAppointmentRes.data as {
      appointment_date: string
      status: string | null
      patient_id: string | null
    } | null

    const patientIdsToResolve = Array.from(
      new Set(
        [
          ...todayRows.map((r) => r.patient_id),
          nextRow?.patient_id ?? null,
        ].filter((v): v is string => !!v),
      ),
    )

    const nameByPatientId = new Map<string, string>()
    if (patientIdsToResolve.length > 0) {
      const { data: patientRows } = await supabase
        .from('users')
        .select('id, name')
        .in('id', patientIdsToResolve)
      for (const p of patientRows ?? []) {
        if (p?.id && p?.name) nameByPatientId.set(p.id, p.name)
      }
    }

    // Contagem de pacientes ativos (distintos)
    const activePatientIds = new Set<string>()
    for (const r of (activePatientsRes.data ?? []) as Array<{ patient_id: string | null }>) {
      if (r?.patient_id) activePatientIds.add(r.patient_id)
    }

    const wallet = walletRes.data
      ? {
          balanceAvailable: Number((walletRes.data as any).balance_available ?? 0),
          balancePending: Number((walletRes.data as any).balance_pending ?? 0),
        }
      : null

    const ctx: ProfessionalContext = {
      role: 'professional',
      activePatientsCount: activePatientIds.size,
      todayAppointmentsCount: todayRows.length,
      todayAppointments: todayRows.slice(0, 5).map((r) => ({
        date: r.appointment_date,
        patientName: r.patient_id ? nameByPatientId.get(r.patient_id) ?? null : null,
        status: r.status ?? null,
      })),
      nextAppointment: nextRow
        ? {
            date: nextRow.appointment_date,
            patientName: nextRow.patient_id
              ? nameByPatientId.get(nextRow.patient_id) ?? null
              : null,
            status: nextRow.status ?? null,
          }
        : null,
      prescriptionsLast30d: prescriptionsRes.count ?? 0,
      reportsLast30d: reportsRes.count ?? 0,
      wallet,
    }

    return ctx
  } catch (err) {
    console.warn(
      '[buildProfessionalContext] falhou (fail-open, Core responde sem contexto):',
      err,
    )
    return null
  }
}
