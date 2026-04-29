/**
 * V1.9.100-P0b — AEC Gate D' (helper canônico Deno)
 *
 * Versão Edge Function (backend) do helper. Usado em tradevision-core
 * como defesa em profundidade nas camadas B (caminho 1) e C (caminho 2).
 *
 * Comportamento alinhado com src/lib/aecGate.ts (frontend):
 *   - Se paciente tem appointment ativo → ok: true + doctor info
 *   - Se NÃO tem → ok: false + reason
 *
 * Princípio operacional crítico:
 *   "P0b NÃO altera lógica do AEC. Só atua ANTES da entrada no pipeline."
 *
 * Lock V1.9.95+97+98+99-B preservado integralmente.
 */

export type GateResult =
  | { ok: true; doctor_id: string; doctor_name?: string }
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
 * Verifica se paciente tem médico válido vinculado via appointment ativo.
 * Fail-closed: em caso de erro de DB, NEGA acesso (não permite passar).
 */
export async function assertPatientHasDoctorContext(
  // deno-lint-ignore no-explicit-any
  supabase: any,
  patientId: string | null | undefined,
): Promise<GateResult> {
  if (!patientId) {
    return { ok: false, reason: 'NO_PATIENT_ID', ux_action: 'CONTACT_SUPPORT' }
  }

  try {
    const { data: appts, error } = await supabase
      .from('appointments')
      .select('id, professional_id, status, appointment_date')
      .eq('patient_id', patientId)
      .not('professional_id', 'is', null)
      .in('status', ['scheduled', 'confirmed', 'in_progress', 'completed'])
      .order('appointment_date', { ascending: false })
      .limit(5)

    if (error) {
      console.error('[AEC_GATE] DB error:', error)
      return { ok: false, reason: 'DB_ERROR', ux_action: 'CONTACT_SUPPORT' }
    }

    if (!appts || appts.length === 0) {
      return { ok: false, reason: 'NO_APPOINTMENT', ux_action: 'SCHEDULE_APPOINTMENT' }
    }

    // Validar professional ainda ativo
    for (const appt of appts) {
      const { data: prof } = await supabase
        .from('users')
        .select('id, name, email, type')
        .eq('id', appt.professional_id)
        .in('type', ['professional', 'profissional'])
        .maybeSingle()

      if (prof?.id) {
        return {
          ok: true,
          doctor_id: prof.id,
          doctor_name: prof.name || formatDoctorName(prof.email),
        }
      }
    }

    return { ok: false, reason: 'NO_VALID_DOCTOR_LINKED', ux_action: 'CONTACT_SUPPORT' }
  } catch (e) {
    console.error('[AEC_GATE] Exceção:', e)
    return { ok: false, reason: 'EXCEPTION', ux_action: 'CONTACT_SUPPORT' }
  }
}

function formatDoctorName(email?: string): string {
  if (!email) return 'Médico'
  if (email.includes('rrvalenca')) return 'Dr. Ricardo Valença'
  if (email.includes('faveret')) return 'Dr. Eduardo Faveret'
  return 'Médico'
}
