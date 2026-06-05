/**
 * V1.9.601 — Identidade canônica dos médicos oficiais (singleton).
 *
 * Substitui anti-padrão `email.includes('faveret')` / `email.includes('ricardo')`
 * espalhado pela UI (ChatGlobal, aecGate, PatientAppointments, LoginDebugPanel).
 *
 * Fonte de verdade no banco: `public.users.is_official = true`
 * Validado empiricamente via PAT 05/06:
 *   - Dr. Ricardo Valença   → 2135f0c0  (professional, Nefrologia)
 *   - Dr. Eduardo Faveret   → f4a62265  (professional, Neuropediatria + Neurofisiologia Clínica)
 *   - Ricardo Valença admin → 99286e6f  (admin secundário, conta de gestão)
 *
 * Pra adicionar novo médico oficial:
 *   1. SET is_official = true no users (banco) — verdade canônica
 *   2. Adicionar UUID nesta constante + função `isOfficialDoctor`
 *
 * Risco anti-padrão eliminado: ANTES, `joaofaveret@gmail.com` (homônimo)
 * ganhava botões de moderação no chat global. AGORA: só os UUIDs explícitos.
 */

export const OFFICIAL_DOCTOR_UUIDS = {
  /** Dr. Ricardo Valença — Nefrologia, criador do método AEC */
  RICARDO_VALENCA: '2135f0c0-eb5a-43b1-bc00-5f8dfea13561',
  /** Dr. Eduardo Faveret — Neuropediatria + Neurofisiologia Clínica, sócio eixo Ensino */
  EDUARDO_FAVERET: 'f4a62265-8982-44db-8282-78129c4d014a',
  /** Ricardo Valença admin secundário — conta de gestão (não atende) */
  RICARDO_ADMIN: '99286e6f-b309-41ad-8dca-cfbb80aa7666',
} as const

/** Verifica se um UUID pertence a um médico oficial atendente (Ricardo OU Eduardo). */
export function isOfficialDoctor(userId?: string | null): boolean {
  if (!userId) return false
  return (
    userId === OFFICIAL_DOCTOR_UUIDS.RICARDO_VALENCA ||
    userId === OFFICIAL_DOCTOR_UUIDS.EDUARDO_FAVERET
  )
}

/** Verifica se o UUID é especificamente Dr. Eduardo Faveret (eixo Ensino + Neuropediatria). */
export function isEduardoFaveret(userId?: string | null): boolean {
  return !!userId && userId === OFFICIAL_DOCTOR_UUIDS.EDUARDO_FAVERET
}

/** Verifica se o UUID é especificamente Dr. Ricardo Valença (Nefrologia, criador AEC). */
export function isRicardoValenca(userId?: string | null): boolean {
  return !!userId && userId === OFFICIAL_DOCTOR_UUIDS.RICARDO_VALENCA
}

/** Retorna nome de exibição do médico oficial pelo UUID, ou null se não-oficial. */
export function getOfficialDoctorName(userId?: string | null): string | null {
  if (!userId) return null
  if (userId === OFFICIAL_DOCTOR_UUIDS.RICARDO_VALENCA) return 'Dr. Ricardo Valença'
  if (userId === OFFICIAL_DOCTOR_UUIDS.EDUARDO_FAVERET) return 'Dr. Eduardo Faveret'
  return null
}
