import { supabase } from './supabase'

export interface TimeSlot {
    slot: string // ISO Timestamp
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
    const { data, error } = await supabase.rpc('get_available_slots_v3', {
        p_professional_id: professionalId,
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
    const { data, error } = await supabase.rpc('book_appointment_atomic', {
        p_patient_id: patientId,
        p_professional_id: professionalId,
        p_slot_time: slotTime,
        p_appointment_type: type, // V3 changed param name
        p_notes: reason          // V3 changed param name
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

    return data // Returns the UUID of the new appointment
}
