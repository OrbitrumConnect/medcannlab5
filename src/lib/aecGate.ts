/**
 * V1.9.100-P0b — AEC Gate D' (helper canônico)
 *
 * Verifica se paciente tem contexto médico válido ANTES de iniciar AEC.
 * Modelo: Opção D' (escolha inline no chat, não redirect).
 *
 * - Se paciente tem appointment ativo → retorna { hasContext: true, doctor }
 *   AEC inicia normalmente com aecTargetPhysicianDisplayName populado.
 *
 * - Se paciente NÃO tem appointment → retorna { hasContext: false, options }
 *   Caller (noaResidentAI) apresenta opções inline no chat.
 *   Após paciente escolher, novo appointment "AEC pending" é criado.
 *
 * Princípio operacional:
 *   "P0b NÃO altera lógica do AEC. Só atua ANTES da entrada no pipeline."
 *   (gate antes do pipeline, FSM/IMRE/Verbatim/Pipeline INTOCADOS)
 *
 * Lock V1.9.95+97+98+99-B preservado integralmente.
 */

import { supabase } from './supabase'

export interface DoctorContext {
  doctorId: string
  doctorName: string
}

export interface DoctorOption {
  id: string
  name: string
  specialty: string
}

export type GateResult =
  | { hasContext: true; doctor: DoctorContext }
  | {
      hasContext: false
      reason: 'NO_APPOINTMENT' | 'NO_VALID_DOCTOR_LINKED' | 'DB_ERROR' | 'NO_PATIENT_ID'
      options?: DoctorOption[]
    }

/**
 * Verifica se paciente tem médico vinculado via appointment ativo.
 * Se sim, retorna o contexto. Se não, retorna opções para escolha inline.
 *
 * Fail-closed: em erro de DB, retorna hasContext: false (nega entrada AEC).
 */
export async function getOrPromptDoctorContext(patientId: string | null | undefined): Promise<GateResult> {
  if (!patientId) {
    return { hasContext: false, reason: 'NO_PATIENT_ID' }
  }

  try {
    // 1. Buscar último appointment com professional vinculado
    const { data: appts, error } = await supabase
      .from('appointments')
      .select('id, professional_id, status, appointment_date')
      .eq('patient_id', patientId)
      .not('professional_id', 'is', null)
      .in('status', ['scheduled', 'confirmed', 'in_progress', 'completed'])
      .order('appointment_date', { ascending: false })
      .limit(5)

    if (error) {
      console.error('[AEC_GATE] DB error consultando appointments:', error)
      return { hasContext: false, reason: 'DB_ERROR', options: await loadDoctorOptions() }
    }

    // 2. Se tem appointment válido, valida professional
    if (appts && appts.length > 0) {
      for (const appt of appts) {
        const { data: prof } = await supabase
          .from('users')
          .select('id, name, email, type')
          .eq('id', appt.professional_id)
          .in('type', ['professional', 'profissional']) // tolera variação PT/EN
          .maybeSingle()

        if (prof?.id) {
          const doctorName = prof.name || formatDoctorName(prof.email)
          return {
            hasContext: true,
            doctor: { doctorId: prof.id, doctorName },
          }
        }
      }

      // Tinha appts mas nenhum professional válido (anonimizado/excluído)
      return {
        hasContext: false,
        reason: 'NO_VALID_DOCTOR_LINKED',
        options: await loadDoctorOptions(),
      }
    }

    // 3. Sem appointments — apresentar opções pra escolha inline
    return {
      hasContext: false,
      reason: 'NO_APPOINTMENT',
      options: await loadDoctorOptions(),
    }
  } catch (e) {
    console.error('[AEC_GATE] Exceção:', e)
    return { hasContext: false, reason: 'DB_ERROR', options: await loadDoctorOptions() }
  }
}

/**
 * Lista médicos disponíveis pra escolha inline.
 * Aproveita mesma lógica do Scheduling.tsx (Princípio 8: polir, não inventar).
 *
 * Hoje hardcoded: Ricardo + Eduardo. Futuro: matching ML quando 5+ médicos.
 */
async function loadDoctorOptions(): Promise<DoctorOption[]> {
  try {
    const { data: docs } = await supabase
      .from('users')
      .select('id, name, email, type')
      .in('type', ['professional', 'profissional'])
      .in('email', ['rrvalenca@gmail.com', 'eduardo.faveret@medcannlab.com'])

    const options: DoctorOption[] = []

    const ricardo = docs?.find((d) => d.email === 'rrvalenca@gmail.com')
    if (ricardo) {
      options.push({
        id: ricardo.id,
        name: ricardo.name || 'Dr. Ricardo Valença',
        specialty: 'Nefrologia / CKD',
      })
    }

    const eduardo = docs?.find((d) => d.email === 'eduardo.faveret@medcannlab.com')
    if (eduardo) {
      options.push({
        id: eduardo.id,
        name: eduardo.name || 'Dr. Eduardo Faveret',
        specialty: 'Neurologia',
      })
    }

    return options
  } catch (e) {
    console.error('[AEC_GATE] Erro carregando opções de médicos:', e)
    return []
  }
}

/**
 * Após paciente escolher médico inline no chat, cria appointment "AEC pending"
 * para vincular paciente-médico antes de iniciar AEC.
 *
 * Reutiliza book_appointment_atomic (RPC existente, transacional, anti-double-book).
 * Princípio 8 aplicado: aproveita infra existente.
 */
export async function bindPatientToDoctor(
  patientId: string,
  doctorId: string,
): Promise<{ success: boolean; appointmentId?: string; error?: string }> {
  try {
    // Cria appointment "AEC pending" — slot daqui a 7 dias (placeholder, paciente reagendará depois)
    const placeholderSlot = new Date()
    placeholderSlot.setDate(placeholderSlot.getDate() + 7)
    placeholderSlot.setHours(10, 0, 0, 0)

    const { data, error } = await supabase.rpc('book_appointment_atomic' as any, {
      p_patient_id: patientId,
      p_professional_id: doctorId,
      p_start_time: placeholderSlot.toISOString(),
      p_type: 'consultation',
      p_notes: 'AEC pending — vínculo criado via gate inline no chat',
    })

    if (error) {
      console.error('[AEC_GATE] Erro criando appointment de vínculo:', error)
      return { success: false, error: error.message }
    }

    return { success: true, appointmentId: data as string }
  } catch (e: any) {
    console.error('[AEC_GATE] Exceção em bindPatientToDoctor:', e)
    return { success: false, error: e?.message || 'Erro desconhecido' }
  }
}

/**
 * Formata nome do médico a partir do email (fallback se name vazio).
 */
function formatDoctorName(email?: string): string {
  if (!email) return 'Médico'
  if (email.includes('rrvalenca')) return 'Dr. Ricardo Valença'
  if (email.includes('eduardo.faveret') || email.includes('faveret')) return 'Dr. Eduardo Faveret'
  return 'Médico'
}

/**
 * V1.9.100-P0b — Detecta menção de médico em mensagem do paciente.
 *
 * GPT-Ricardo review (29/04 ~20h): "Intenção do usuário deve ser resolvida
 * ANTES da FSM, não dentro dela. FSM não deveria interpretar desejo, só
 * executar estado."
 *
 * Caso de uso: paciente fala "quero fazer com Dr Eduardo" → override
 * aecTargetPhysicianDisplayName ANTES de startAssessment ser chamado.
 *
 * Tolera exclusões: "Eduardo e nao Ricardo" → escolhe Eduardo.
 * Em caso de ambiguidade real (sem exclusão), retorna null (mantém default).
 */
export function extractDoctorFromMessage(message: string | null | undefined): string | null {
  if (!message) return null
  const norm = message.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')

  // Detectar EXCLUSÕES ("nao ricardo", "exceto eduardo", "fora valenca")
  const excludesRicardo = /\b(nao|exceto|menos|fora\s+(de\s+)?)\s*(o\s+)?(dr\.?\s*)?(ricardo|valenca)/.test(norm)
  const excludesEduardo = /\b(nao|exceto|menos|fora\s+(de\s+)?)\s*(o\s+)?(dr\.?\s*)?(eduardo|faveret)/.test(norm)

  // Detectar MENÇÕES (pode ser sem "Dr." prefix)
  const mentionsRicardo = /\b(ricardo|valenca)\b/.test(norm)
  const mentionsEduardo = /\b(eduardo|faveret)\b/.test(norm)

  // Aplicar exclusões
  const wantsRicardo = mentionsRicardo && !excludesRicardo
  const wantsEduardo = mentionsEduardo && !excludesEduardo

  // Decidir
  if (wantsEduardo && !wantsRicardo) return 'Dr. Eduardo Faveret'
  if (wantsRicardo && !wantsEduardo) return 'Dr. Ricardo Valença'

  // Ambíguo (ambos mencionados sem exclusão) ou nenhum → não override
  return null
}

/**
 * Mensagem amigável para mostrar ao paciente quando gate solicita escolha.
 */
export function buildDoctorChoicePrompt(options: DoctorOption[]): string {
  if (options.length === 0) {
    return 'No momento não temos profissionais disponíveis. Por favor, contate o suporte.'
  }

  const list = options
    .map((o, i) => `${i + 1}. **${o.name}** — ${o.specialty}`)
    .join('\n')

  return `Antes de iniciarmos sua avaliação clínica, com qual profissional você gostaria de fazer?\n\n${list}\n\nResponda com o nome ou número do profissional escolhido.`
}
