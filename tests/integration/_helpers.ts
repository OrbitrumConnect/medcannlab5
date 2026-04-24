/**
 * Helpers compartilhados pela suite de integração.
 *
 * Constrói cliente Supabase com service_role (bypass RLS) para poder
 * preparar/limpar dados em sandbox. Nunca use este cliente no frontend.
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js'

export const SUPABASE_URL = process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL ?? ''
export const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ?? ''

export const hasIntegrationCreds = Boolean(SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY)

let cachedAdminClient: SupabaseClient | null = null

export function adminClient(): SupabaseClient {
  if (!hasIntegrationCreds) {
    throw new Error(
      'Integration tests require SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY env vars.',
    )
  }
  if (!cachedAdminClient) {
    cachedAdminClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: { persistSession: false, autoRefreshToken: false },
    })
  }
  return cachedAdminClient
}

/**
 * UUID fixos de usuários "sandbox" reais da base (admins/fundadores) usados
 * só como patient_id/professional_id nos testes. Nenhum é externo.
 */
export const SANDBOX_PATIENT_ID = '17345b36-50de-4112-bf78-d7c5d9342cdb' // Pedro (admin)
export const SANDBOX_PROFESSIONAL_ID = '99286e6f-b309-41ad-8dca-cfbb80aa7666' // Ricardo (admin iaianoa)

/** Prefixo para identificar dados de teste e limpar depois. */
export const E2E_PREFIX = 'E2E_TEST_'

/**
 * Limpa em cascata os artefatos criados por um appointment de teste.
 * Ordem importa — FKs bloqueiam DELETE fora de ordem.
 */
export async function cleanupAppointmentCascade(
  client: SupabaseClient,
  appointmentId: string,
): Promise<void> {
  // wallet_transactions (dispara sync de saldo no DELETE — ok, é estorno)
  await client.from('wallet_transactions').delete().eq('appointment_id', appointmentId)

  // notifications criadas via handle_appointment_completed
  await client
    .from('notifications')
    .delete()
    .eq('metadata->>appointment_id', appointmentId)

  // referral_bonus_cycles se tiver criado
  await client.from('referral_bonus_cycles').delete().eq('appointment_id', appointmentId)

  // o próprio appointment
  await client.from('appointments').delete().eq('id', appointmentId)
}

/**
 * Limpa em cascata os artefatos criados por um clinical_report de teste.
 */
export async function cleanupReportCascade(
  client: SupabaseClient,
  reportId: string,
): Promise<void> {
  // ai_assessment_scores referencia report
  await client.from('ai_assessment_scores').delete().eq('assessment_id', reportId)
  await client.from('clinical_axes').delete().eq('report_id', reportId)
  await client.from('clinical_reports').delete().eq('id', reportId)
}
