/** Credenciais reais só em `.env` / CI — nunca no repositório. */
export function e2eProEmail(): string {
  return process.env.E2E_PRO_EMAIL ?? ''
}

export function e2eProPassword(): string {
  return process.env.E2E_PRO_PASSWORD ?? ''
}

export function e2ePatientEmail(): string {
  return process.env.E2E_PATIENT_EMAIL ?? ''
}

export function e2ePatientPassword(): string {
  return process.env.E2E_PATIENT_PASSWORD ?? ''
}

export const e2eHasProCreds = Boolean(e2eProEmail() && e2eProPassword())
export const e2eHasPatientCreds = Boolean(e2ePatientEmail() && e2ePatientPassword())
export const e2eHasFullCreds = e2eHasProCreds && e2eHasPatientCreds
