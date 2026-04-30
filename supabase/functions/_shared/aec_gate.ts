/**
 * V1.9.100-P0b + V1.9.103 — AEC Gate D' (helper canônico Deno)
 *
 * Versão Edge Function (backend) do helper. Usado em tradevision-core
 * como defesa em profundidade nas camadas B (caminho 1) e C (caminho 2).
 *
 * Comportamento (cadeia de aceitação V1.9.103 — ampliada):
 *   1. appointments ativos com professional_id válido          → ok ✓
 *   2. NOVO: reports onde professional_id IS NOT NULL E
 *      signed_at IS NOT NULL (vínculo via report finalizado)   → ok ✓
 *   3. NOVO: reports onde shared_with[] populado E
 *      signed_at IS NOT NULL (vínculo via compartilhamento)    → ok ✓
 *   4. Nenhum dos acima                                         → NO_APPOINTMENT
 *
 * Guard crítico em (2) e (3): signed_at IS NOT NULL.
 * Sem isso, gate aceitaria drafts órfãos / inconsistentes.
 *
 * Princípio operacional crítico:
 *   "P0b NÃO altera lógica do AEC. Só atua ANTES da entrada no pipeline."
 *
 * Lock V1.9.95+97+98+99-B preservado integralmente.
 */

export type GateResult =
  | { ok: true; doctor_id: string; doctor_name?: string; source: 'appointment' | 'report_professional_id' | 'report_shared_with' }
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
 * Verifica se paciente tem médico válido vinculado.
 * Cadeia (V1.9.103): appointments → reports.professional_id → reports.shared_with[].
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
    // ─────────────────────────────────────────────────────────────────
    // FONTE 1 — appointments ativos (lógica V1.9.100 original)
    // ─────────────────────────────────────────────────────────────────
    const { data: appts, error: apptErr } = await supabase
      .from('appointments')
      .select('id, professional_id, status, appointment_date')
      .eq('patient_id', patientId)
      .not('professional_id', 'is', null)
      .in('status', ['scheduled', 'confirmed', 'in_progress', 'completed'])
      .order('appointment_date', { ascending: false })
      .limit(5)

    if (apptErr) {
      console.error('[AEC_GATE] DB error (appointments):', apptErr)
      return { ok: false, reason: 'DB_ERROR', ux_action: 'CONTACT_SUPPORT' }
    }

    if (appts && appts.length > 0) {
      for (const appt of appts) {
        const validProf = await resolveActiveProfessional(supabase, appt.professional_id)
        if (validProf) {
          return {
            ok: true,
            doctor_id: validProf.id,
            doctor_name: validProf.name,
            source: 'appointment',
          }
        }
      }
    }

    // ─────────────────────────────────────────────────────────────────
    // FONTE 2 (NOVO V1.9.103) — report finalizado com professional_id explícito
    // Guard: signed_at IS NOT NULL (drafts não contam)
    // ─────────────────────────────────────────────────────────────────
    const { data: reportsByProf, error: reportProfErr } = await supabase
      .from('clinical_reports')
      .select('id, professional_id, signed_at')
      .eq('patient_id', patientId)
      .not('professional_id', 'is', null)
      .not('signed_at', 'is', null)
      .order('signed_at', { ascending: false })
      .limit(5)

    if (reportProfErr) {
      console.error('[AEC_GATE] DB error (reports.professional_id):', reportProfErr)
      // Não fail-closed aqui — tenta próxima fonte
    } else if (reportsByProf && reportsByProf.length > 0) {
      for (const rep of reportsByProf) {
        const validProf = await resolveActiveProfessional(supabase, rep.professional_id)
        if (validProf) {
          return {
            ok: true,
            doctor_id: validProf.id,
            doctor_name: validProf.name,
            source: 'report_professional_id',
          }
        }
      }
    }

    // ─────────────────────────────────────────────────────────────────
    // FONTE 3 (NOVO V1.9.103) — report compartilhado com médico válido
    // Guard: signed_at IS NOT NULL (drafts compartilhados não contam)
    // ─────────────────────────────────────────────────────────────────
    const { data: reportsShared, error: sharedErr } = await supabase
      .from('clinical_reports')
      .select('id, shared_with, signed_at')
      .eq('patient_id', patientId)
      .not('shared_with', 'is', null)
      .not('signed_at', 'is', null)
      .order('signed_at', { ascending: false })
      .limit(5)

    if (sharedErr) {
      console.error('[AEC_GATE] DB error (reports.shared_with):', sharedErr)
    } else if (reportsShared && reportsShared.length > 0) {
      for (const rep of reportsShared) {
        const sharedIds: string[] = Array.isArray(rep.shared_with) ? rep.shared_with : []
        for (const docId of sharedIds) {
          const validProf = await resolveActiveProfessional(supabase, docId)
          if (validProf) {
            return {
              ok: true,
              doctor_id: validProf.id,
              doctor_name: validProf.name,
              source: 'report_shared_with',
            }
          }
        }
      }
    }

    // Nenhuma das 3 fontes resolveu vínculo válido
    return { ok: false, reason: 'NO_APPOINTMENT', ux_action: 'SCHEDULE_APPOINTMENT' }
  } catch (e) {
    console.error('[AEC_GATE] Exceção:', e)
    return { ok: false, reason: 'EXCEPTION', ux_action: 'CONTACT_SUPPORT' }
  }
}

/**
 * Helper: valida que candidate é profissional ativo (ou admin que atua como tal,
 * caso de Eduardo Faveret conta `f4a62265` — admin com 5 rules de availability).
 */
async function resolveActiveProfessional(
  // deno-lint-ignore no-explicit-any
  supabase: any,
  candidateId: string | null | undefined,
): Promise<{ id: string; name: string } | null> {
  if (!candidateId) return null
  try {
    const { data: prof } = await supabase
      .from('users')
      .select('id, name, email, type')
      .eq('id', candidateId)
      .in('type', ['professional', 'profissional', 'admin'])
      .maybeSingle()

    if (!prof?.id) return null
    return {
      id: prof.id,
      name: prof.name || formatDoctorName(prof.email),
    }
  } catch {
    return null
  }
}

function formatDoctorName(email?: string): string {
  if (!email) return 'Médico'
  if (email.includes('rrvalenca')) return 'Dr. Ricardo Valença'
  if (email.includes('faveret')) return 'Dr. Eduardo Faveret'
  return 'Médico'
}
