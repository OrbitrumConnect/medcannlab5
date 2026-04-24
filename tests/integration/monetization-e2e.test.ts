/**
 * MONETIZATION E2E — cadeia de 4 triggers em appointment.status='completed'
 *
 * Cobre o que V1.9.13 destravou:
 *   1) Cria appointment teste (scheduled, price=200)
 *   2) UPDATE status='completed'
 *   3) Verifica que a cadeia executou corretamente:
 *      - notifications: 1 criada pro paciente (handle_appointment_completed)
 *      - wallet_transactions: 1 criada com amount=200,
 *          platform_fee=60, professional_amount=140 (split 70/30 via
 *          tg_apply_wallet_transaction BEFORE INSERT)
 *      - wallets: professional tem balance_pending >= 140
 *          (tg_wallet_balance_sync AFTER INSERT)
 *      - sync trigger (V1.9.21) garantiu doctor_id == professional_id
 *
 * Cleanup: tudo criado é removido no afterAll (não polui dashboards/métricas).
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import {
  adminClient,
  hasIntegrationCreds,
  SANDBOX_PATIENT_ID,
  SANDBOX_PROFESSIONAL_ID,
  E2E_PREFIX,
  cleanupAppointmentCascade,
} from './_helpers'

describe.skipIf(!hasIntegrationCreds)('MONETIZATION — cadeia completed', () => {
  const client = adminClient()
  let testAppointmentId: string | null = null
  let walletPendingBefore = 0

  beforeAll(async () => {
    // Saldo de wallet do professional antes (pra diff)
    const { data: walletBefore } = await client
      .from('wallets')
      .select('balance_pending')
      .eq('user_id', SANDBOX_PROFESSIONAL_ID)
      .maybeSingle()
    walletPendingBefore = Number((walletBefore as any)?.balance_pending ?? 0)
  })

  afterAll(async () => {
    if (testAppointmentId) {
      await cleanupAppointmentCascade(client, testAppointmentId)
    }
  })

  it('1) cria appointment scheduled', async () => {
    const { data, error } = await client
      .from('appointments')
      .insert({
        patient_id: SANDBOX_PATIENT_ID,
        professional_id: SANDBOX_PROFESSIONAL_ID,
        appointment_date: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
        duration: 60,
        status: 'scheduled',
        type: 'consultation',
        price: 200.0,
        title: `${E2E_PREFIX}monetization_chain`,
        description: 'Sandbox para validar cadeia de 4 triggers',
        notes: 'Cleanup automático no afterAll',
      })
      .select()
      .single()

    expect(error, 'INSERT appointment deve passar pelo sync trigger').toBeNull()
    expect(data?.id).toBeTruthy()
    testAppointmentId = (data as any).id

    // V1.9.21 sync trigger: doctor_id deve ter sido preenchido automaticamente
    expect((data as any).doctor_id, 'sync trigger deve popular doctor_id').toBe(
      SANDBOX_PROFESSIONAL_ID,
    )
  })

  it('2) marca completed → triggers disparam', async () => {
    if (!testAppointmentId) throw new Error('appointment não foi criado')

    const { data, error } = await client
      .from('appointments')
      .update({ status: 'completed' })
      .eq('id', testAppointmentId)
      .select()
      .single()

    expect(error, 'UPDATE status=completed deve executar cadeia sem constraint violation').toBeNull()
    expect((data as any).status).toBe('completed')
  })

  it('3a) wallet_transaction foi criada com split 70/30 automático', async () => {
    const { data: tx, error } = await client
      .from('wallet_transactions')
      .select(
        'amount, platform_fee, professional_amount, platform_fee_pct, status, professional_id',
      )
      .eq('appointment_id', testAppointmentId!)
      .maybeSingle()

    expect(error).toBeNull()
    expect(tx, 'wallet_transaction deve existir').toBeTruthy()
    expect(Number((tx as any).amount)).toBe(200)
    expect(Number((tx as any).platform_fee)).toBe(60) // 30% de 200
    expect(Number((tx as any).professional_amount)).toBe(140) // 70% de 200
    expect(Number((tx as any).platform_fee_pct)).toBe(30)
    expect((tx as any).status).toBe('pending')
    expect((tx as any).professional_id).toBe(SANDBOX_PROFESSIONAL_ID)
  })

  it('3b) wallets.balance_pending foi incrementado', async () => {
    const { data: wallet } = await client
      .from('wallets')
      .select('balance_pending')
      .eq('user_id', SANDBOX_PROFESSIONAL_ID)
      .maybeSingle()

    const pendingAfter = Number((wallet as any)?.balance_pending ?? 0)
    const delta = pendingAfter - walletPendingBefore
    expect(delta, 'balance_pending deve aumentar em 140 (professional_amount)').toBeCloseTo(
      140,
      2,
    )
  })

  it('3c) notification foi criada pro paciente', async () => {
    const { data: notifs } = await client
      .from('notifications')
      .select('id, type, title, is_read')
      .eq('metadata->>appointment_id', testAppointmentId!)
      .eq('user_id', SANDBOX_PATIENT_ID)

    const appointmentNotif = (notifs ?? []).find(
      (n: any) => n.type === 'appointment_completed',
    )
    expect(appointmentNotif, 'notification appointment_completed deve existir').toBeTruthy()
    expect((appointmentNotif as any).is_read).toBe(false)
  })
})
