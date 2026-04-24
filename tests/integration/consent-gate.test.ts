/**
 * CONSENT GATE — fail-closed server-side
 *
 * Contrato (V1.9.1, tradevision-core/index.ts:1079):
 *   Nenhum clinical_report deve ser persistido sem
 *   content.consenso.aceito === true.
 *
 * Este teste invoca o finalize_assessment via HTTP direto na Edge Function
 * deployada e valida:
 *   1) Com consent.aceito=true → report criado.
 *   2) Sem consent → rejeitado com status 'aborted_no_consent', NADA persistido.
 *   3) Com consent.aceito=false (explícito) → idem rejeitado.
 */

import { describe, it, expect, afterAll } from 'vitest'
import {
  adminClient,
  hasIntegrationCreds,
  SANDBOX_PATIENT_ID,
  SUPABASE_URL,
  E2E_PREFIX,
  cleanupReportCascade,
} from './_helpers'

describe.skipIf(!hasIntegrationCreds)('CONSENT_GATE — fail-closed', () => {
  const createdReportIds: string[] = []
  const client = adminClient()

  afterAll(async () => {
    for (const rid of createdReportIds) {
      await cleanupReportCascade(client, rid)
    }
  })

  // Helper: chamar a Edge Function tradevision-core com action=finalize_assessment.
  async function invokeFinalize(assessmentData: unknown) {
    const res = await fetch(`${SUPABASE_URL}/functions/v1/tradevision-core`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'finalize_assessment',
        message: `${E2E_PREFIX}consent_gate`,
        assessmentData,
        context: { patient_id: SANDBOX_PATIENT_ID },
      }),
    })
    return (await res.json()) as {
      success: boolean
      report_id?: string | null
      pipeline_status?: string
      error?: string
    }
  }

  it('1) aceita quando content.consenso.aceito === true', async () => {
    const result = await invokeFinalize({
      patient_id: SANDBOX_PATIENT_ID,
      content: {
        identificacao: { nome: `${E2E_PREFIX}paciente_teste` },
        lista_indiciaria: ['teste_consent_aceito'],
        queixa_principal: 'Smoke test',
        consenso: { aceito: true, revisoes_realizadas: 0 },
      },
    })

    expect(result.report_id, 'report deve ser criado').toBeTruthy()
    if (result.report_id) createdReportIds.push(result.report_id)
  }, 30_000)

  it('2) rejeita quando consenso ausente (fail-closed)', async () => {
    const result = await invokeFinalize({
      patient_id: SANDBOX_PATIENT_ID,
      content: {
        identificacao: { nome: `${E2E_PREFIX}sem_consenso` },
        lista_indiciaria: ['sem_consent'],
        queixa_principal: 'Deve ser bloqueado',
        // consenso ausente intencionalmente
      },
    })

    expect(result.report_id, 'NENHUM report deveria ser criado').toBeFalsy()
    expect(
      result.pipeline_status || result.error,
      'status deve indicar bloqueio por consent',
    ).toMatch(/consent|aborted/i)
  }, 30_000)

  it('3) rejeita quando consenso.aceito === false', async () => {
    const result = await invokeFinalize({
      patient_id: SANDBOX_PATIENT_ID,
      content: {
        identificacao: { nome: `${E2E_PREFIX}recusou_consenso` },
        lista_indiciaria: ['recusou'],
        queixa_principal: 'Paciente recusou explicitamente',
        consenso: { aceito: false, revisoes_realizadas: 0 },
      },
    })

    expect(result.report_id, 'NENHUM report deveria ser criado').toBeFalsy()
    expect(
      result.pipeline_status || result.error,
      'status deve indicar bloqueio por consent',
    ).toMatch(/consent|aborted/i)
  }, 30_000)

  it('4) confirma que os tentativas bloqueadas não deixaram rastro', async () => {
    // Busca qualquer report com title de teste recente que NÃO esteja no array de criados
    const { data: recentReports } = await client
      .from('clinical_reports')
      .select('id, content')
      .gte('created_at', new Date(Date.now() - 5 * 60 * 1000).toISOString())
      .eq('patient_id', SANDBOX_PATIENT_ID)

    const orphans = (recentReports ?? []).filter((r) => {
      const rec = r as { id: string; content: unknown }
      const nome = (rec.content as { identificacao?: { nome?: string } })?.identificacao?.nome ?? ''
      const isTestLeak =
        nome.includes('sem_consenso') || nome.includes('recusou_consenso')
      return isTestLeak && !createdReportIds.includes(rec.id)
    })

    expect(orphans, 'fail-closed deve bloquear 100%, sem report órfão').toHaveLength(0)
  })
})
