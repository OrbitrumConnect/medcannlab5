/**
 * AEC FINALIZE SCHEMA — contrato de persistência de clinical_reports
 *
 * Cobre regressões e restaurações:
 *   - V1.9.20: content.lista_indiciaria / identificacao / consenso direto em
 *     content.* (padrão pré-refactor 22/04). Reports de 02-05/04 tinham essa
 *     estrutura; reports 22-23/04 nasceram vazios até o fix.
 *   - V1.9.20: professional_id populado (coluna moderna, não só doctor_id).
 *   - V1.9.21: sync trigger garante doctor_id == professional_id.
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

describe.skipIf(!hasIntegrationCreds)('AEC FINALIZE — schema contract V1.9.20 + V1.9.21', () => {
  const createdReportIds: string[] = []
  const client = adminClient()

  afterAll(async () => {
    for (const rid of createdReportIds) {
      await cleanupReportCascade(client, rid)
    }
  })

  it('persiste content estruturado no topo + professional_id + sync doctor_id', async () => {
    const payload = {
      action: 'finalize_assessment' as const,
      message: `${E2E_PREFIX}schema_v1_9_20`,
      assessmentData: {
        patient_id: SANDBOX_PATIENT_ID,
        content: {
          identificacao: {
            nome: `${E2E_PREFIX}smoke_schema`,
            apresentacao: 'Paciente sintético',
          },
          lista_indiciaria: ['sintoma_1', 'sintoma_2', 'sintoma_3'],
          queixa_principal: 'Dor de teste',
          desenvolvimento_queixa: {
            localizacao: 'cabeça',
            inicio: 'esta manhã',
            descricao: 'Latejante',
            sintomas_associados: [],
            fatores_melhora: [],
            fatores_piora: [],
          },
          historia_patologica_pregressa: [],
          historia_familiar: { lado_materno: [], lado_paterno: [] },
          habitos_vida: [],
          perguntas_objetivas: {
            alergias: null,
            medicacoes_regulares: null,
            medicacoes_esporadicas: null,
          },
          consenso: { aceito: true, revisoes_realizadas: 0 },
        },
      },
      context: { patient_id: SANDBOX_PATIENT_ID },
    }

    const res = await fetch(`${SUPABASE_URL}/functions/v1/tradevision-core`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    })
    const body = (await res.json()) as { success: boolean; report_id: string | null }

    expect(body.report_id, 'report deve ter sido criado').toBeTruthy()
    if (body.report_id) createdReportIds.push(body.report_id)

    // Validar estrutura do report persistido
    const { data: report } = await client
      .from('clinical_reports')
      .select('content, professional_id, doctor_id, consent_given')
      .eq('id', body.report_id!)
      .maybeSingle()

    expect(report).toBeTruthy()
    const r = report as {
      content: any
      professional_id: string | null
      doctor_id: string | null
      consent_given: boolean | null
    }

    // V1.9.20: campos estruturados DIRETO em content.*
    expect(r.content.lista_indiciaria, 'lista_indiciaria no topo').toEqual([
      'sintoma_1',
      'sintoma_2',
      'sintoma_3',
    ])
    expect(
      r.content.identificacao?.nome,
      'identificacao.nome no topo',
    ).toBe(`${E2E_PREFIX}smoke_schema`)
    expect(r.content.queixa_principal, 'queixa_principal no topo').toBe('Dor de teste')
    expect(r.content.consenso?.aceito, 'consenso.aceito').toBe(true)

    // V1.9.20: retrocompat mantida
    expect(r.content.raw, 'content.raw preservado pra código legado').toBeTruthy()
    expect(r.content.structured, 'markdown narrativo gerado').toBeTruthy()

    // V1.9.20: professional_id populado (antes era sempre NULL)
    expect(r.professional_id, 'professional_id deve estar populado').toBeTruthy()

    // V1.9.21: sync trigger garantiu que doctor_id == professional_id
    expect(r.doctor_id).toBe(r.professional_id)

    // V1.9.1: consent_given como coluna dedicada
    expect(r.consent_given).toBe(true)
  })
})
