// V1.9.x (07/05) — range ampliado pra cobrir professional_availability real:
//   Ricardo configurou Quinta 08:00→00:00 (meia-noite); outros dias 09:00→20:00
//   Eduardo configurou 08:00→12:00 + 13:00→17:00
// Pra evento de demonstração amanhã, paciente precisa ver TODO o range possível.
// Solução elite (engatilhada V1.9.190): consumir professional_availability dinâmico
// quando médico é selecionado. Quick fix aqui amplia o range até 23:00.
export const SCHEDULING_CONFIG = {
  startDateISO: '2025-11-10T00:00:00-03:00',
  workingDays: ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta'] as const,
  startTime: '08:00',
  endTime: '23:00',
  appointmentDurationMinutes: 60,
  bufferMinutes: 15
}

export type SchedulingWorkingDay = (typeof SCHEDULING_CONFIG.workingDays)[number]

export const getSchedulingStartDate = (): Date => {
  const baseDate = new Date(SCHEDULING_CONFIG.startDateISO)
  const today = new Date()
  return today < baseDate ? baseDate : today
}

export const generateAppointmentSlots = (
  startTime: string = SCHEDULING_CONFIG.startTime,
  endTime: string = SCHEDULING_CONFIG.endTime,
  appointmentMinutes: number = SCHEDULING_CONFIG.appointmentDurationMinutes,
  bufferMinutes: number = SCHEDULING_CONFIG.bufferMinutes
): string[] => {
  const [startHour, startMinute] = startTime.split(':').map(Number)
  const [endHour, endMinute] = endTime.split(':').map(Number)

  const slots: string[] = []
  const startTotalMinutes = startHour * 60 + startMinute
  const endTotalMinutes = endHour * 60 + endMinute

  let cursor = startTotalMinutes

  while (cursor + appointmentMinutes <= endTotalMinutes) {
    const hours = Math.floor(cursor / 60)
    const minutes = cursor % 60
    slots.push(`${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`)

    cursor += appointmentMinutes + bufferMinutes
  }

  return slots
}

export const isSchedulingWorkingDay = (date: Date): boolean => {
  const days = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado']
  return SCHEDULING_CONFIG.workingDays.includes(days[date.getDay()] as SchedulingWorkingDay)
}

export const clampToSchedulingStartDate = (date: Date): Date => {
  const startDate = new Date(SCHEDULING_CONFIG.startDateISO)
  return date < startDate ? startDate : date
}

