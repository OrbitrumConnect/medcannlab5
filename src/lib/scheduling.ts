import { supabase } from './supabase'

export interface TimeSlot {
    slot: string // ISO Timestamp
}

// Helper to resolve Professional ID (UUID vs Slug)
async function resolveProfessionalId(idOrSlug: string): Promise<string> {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    if (uuidRegex.test(idOrSlug)) return idOrSlug

    console.log(`[Scheduling] Resolving slug '${idOrSlug}' to UUID via Secure RPC...`)

    try {
        const { data, error } = await supabase.rpc('resolve_professional_by_slug' as any, {
            p_slug: idOrSlug
        })

        if (error) {
            console.error('[Scheduling] RPC Resolution failed:', error)
            throw error
        }

        if (data) {
            console.log(`[Scheduling] ✅ Resolved '${idOrSlug}' → UUID: ${data}`)
            return data as string
        }

    } catch (err) {
        console.warn(`[Scheduling] ⚠️ Could not resolve '${idOrSlug}' to UUID`, err)
        // Throwing error as requested by security audit - Fail Explicitly
        throw new Error(`Professional not found: ${idOrSlug}`)
    }

    throw new Error(`Professional resolution returned no data for: ${idOrSlug}`)
}

/**
 * Fetches available slots from the V3 Master Engine.
 * Uses the complex 'get_available_slots_v3' RPC which calculates rules - appointments - blocks.
 */
export async function getAvailableSlots(
    professionalId: string,
    startDate: Date,
    endDate: Date
): Promise<string[]> {

    // Resolve ID if necessary
    const targetId = await resolveProfessionalId(professionalId)

    const { data, error } = await supabase.rpc('get_available_slots_v3' as any, {
        p_professional_id: targetId,
        p_start_date: startDate.toISOString().split('T')[0], // YYYY-MM-DD
        p_end_date: endDate.toISOString().split('T')[0]
    })

    if (error) {
        console.error('Error fetching slots:', error)
        throw error
    }

    // The RPC V3 returns a table with a 'slot_start' column
    // We expect data to be an array of objects like [{ slot_start: '2026-01-30T09:00:00+00:00', ... }]
    return (data as any[])?.map(d => d.slot_start) || []
}

/**
 * Books an appointment using the Transactional Lock mechanism (V3 Atomic).
 * This guarantees no double-booking via 'pg_advisory_xact_lock'.
 */
export async function bookAppointment(
    patientId: string,
    professionalId: string,
    slotTime: string, // ISO Timestamp
    type: 'consultation' | 'return' = 'consultation',
    reason?: string
): Promise<string> {

    // Resolve ID if necessary
    const targetProfId = await resolveProfessionalId(professionalId)

    const { data, error } = await supabase.rpc('book_appointment_atomic' as any, {
        p_patient_id: patientId,
        p_professional_id: targetProfId,
        p_start_time: slotTime, // TIMESTAMPTZ - PostgreSQL armazena em UTC automaticamente
        p_type: type,
        p_notes: reason
    })

    if (error) {
        console.error('Booking failed:', error)
        // Map specific DB errors to user-friendly messages
        if (error.message?.includes('Slot no longer available') || error.message?.includes('Double Booking')) {
            throw new Error('Este horário acabou de ser reservado por outro paciente. Por favor, escolha outro.')
        }
        if (error.message?.includes('blocked')) {
            throw new Error('O profissional bloqueou este horário recentemente.')
        }
        throw error
    }

    if (data) {
        // V1.9.224 — Setar is_remote=true por default (telemedicina norma MedCannLab).
        //
        // Bug regressão empírica 06/05 → 07/05 (caso casualmusic2021):
        //   • 06/05 appointment 058ff575: is_remote=true → cron enviou reminders 10min + 1min
        //   • 07/05+ todos appointments via SchedulingWidget: is_remote=false (default DB)
        //   • Edge video-call-reminders filtra .eq('is_remote', true) → 0 envios
        //   • Resultado: paciente recebe só "Consulta Confirmada", sem lembretes
        //
        // Causa raiz: book_appointment_atomic RPC não aceita p_is_remote, usa default
        // DB (false). platformFunctionsModule.ts:780 e ProfessionalScheduling.tsx:587
        // setam true mas só pra paths do médico. Path do paciente (este bookAppointment)
        // ficou silenciosamente false.
        //
        // Fix cirúrgico: UPDATE pós-RPC. Fail-safe (não bloqueia booking se falhar).
        // Anti-regressão: appointment já criado com sucesso; UPDATE é aditivo.
        try {
            await supabase
                .from('appointments')
                .update({ is_remote: true })
                .eq('id', data as string)
        } catch (e) {
            console.warn('[V1.9.224] is_remote=true update falhou (não-bloqueante):', e)
        }

        // Trigger Background Notification
        (async () => {
            try {
                const { notificationService } = await import('./notificationService')

                // Fetch emails and names
                const [{ data: patient }, { data: professional }] = await Promise.all([
                    supabase.from('users').select('email, name').eq('id', patientId).single(),
                    supabase.from('users').select('email, name').eq('id', targetProfId).single()
                ])

                if (patient?.email && professional?.email) {
                    const dateObj = new Date(slotTime)
                    await notificationService.notifyAppointmentConfirmation(
                        patient.email,
                        professional.email,
                        {
                            date: dateObj.toLocaleDateString('pt-BR'),
                            time: dateObj.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
                            professionalName: professional.name || 'Médico',
                            patientName: patient.name || 'Paciente'
                        }
                    )
                }
            } catch (notifyError) {
                console.error('Non-blocking notification error:', notifyError)
            }
        })()
    }

    return data // Returns the UUID of the new appointment
}
