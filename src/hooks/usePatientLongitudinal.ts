/**
 * usePatientLongitudinal — hook que carrega recortes longitudinais de UM paciente
 * pra anexar como cards na Nôa Matrix.
 *
 * V1.9.382 — Fluxo longitudinal Terminal de Atendimento → Nôa Matrix.
 *
 * Origem: conversa Pedro 19/05 noite — "caso amadurece com tempo, não nasce
 * na primeira AEC; médico no Terminal de Atendimento deve poder levar recortes
 * pro chat Nôa Matrix". Material A puro Pedro (continuação coerente da Sequência
 * Conservadora Ricardo cristalizada em 6+ meses).
 *
 * Princípios aplicados:
 *  - feedback_publicacao_nao_e_exploracao_interna_18_05 (exploração vs publicação)
 *  - feedback_limitar_autoridade_computacional_19_05 (Z2 estrutural)
 *  - feedback_admin_metadata_nao_conteudo_clinico_16_05 (cuidado com PHI)
 *  - polir-não-inventar (reusa clinical_reports + clinical_rationalities existentes)
 *
 * Atrito intencional:
 *  - Médico recebe lista de cards DESMARCADOS por default
 *  - Médico marca explicitamente quais quer trazer pro chat
 *  - Audit log no carregamento (LGPD trail — quem viu o quê e quando)
 */
import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

export interface LongitudinalReport {
  id: string
  created_at: string
  status: string
  signed_at: string | null
  mainComplaint?: string
  listaIndiciaria?: string[]
}

export interface LongitudinalRationality {
  id: string
  rationality_type: string
  created_at: string
  assessmentExcerpt?: string  // primeiros 200 chars do assessment (recorte estrutural)
}

export interface PatientLongitudinalData {
  patientName: string | null
  reports: LongitudinalReport[]
  rationalities: LongitudinalRationality[]
  loading: boolean
  error: string | null
}

const MAX_REPORTS = 5
const MAX_RATIONALITIES = 10
const ASSESSMENT_EXCERPT_CHARS = 200

export function usePatientLongitudinal(patientId: string | undefined | null): PatientLongitudinalData {
  const [data, setData] = useState<PatientLongitudinalData>({
    patientName: null,
    reports: [],
    rationalities: [],
    loading: false,
    error: null,
  })

  useEffect(() => {
    if (!patientId) {
      setData({ patientName: null, reports: [], rationalities: [], loading: false, error: null })
      return
    }

    let cancelled = false
    setData((prev) => ({ ...prev, loading: true, error: null }))

    const load = async () => {
      try {
        // Nome do paciente (RLS protege — só médicos vinculados veem)
        const { data: userData } = await (supabase as any)
          .from('users')
          .select('name')
          .eq('id', patientId)
          .maybeSingle()

        // Últimos N relatórios assinados (snapshot estruturado)
        const { data: reportsData } = await (supabase as any)
          .from('clinical_reports')
          .select('id, created_at, status, signed_at, content')
          .eq('patient_id', patientId)
          .order('created_at', { ascending: false })
          .limit(MAX_REPORTS)

        // Últimas N racionalidades aplicadas
        const { data: rationalitiesData } = await (supabase as any)
          .from('clinical_rationalities')
          .select('id, rationality_type, created_at, assessment')
          .eq('patient_id', patientId)
          .order('created_at', { ascending: false })
          .limit(MAX_RATIONALITIES)

        if (cancelled) return

        const reports: LongitudinalReport[] = (reportsData || []).map((r: any) => {
          const c = r.content || {}
          return {
            id: r.id,
            created_at: r.created_at,
            status: r.status,
            signed_at: r.signed_at,
            mainComplaint: c.main_complaint || c.queixa_principal || c.chiefComplaint || undefined,
            listaIndiciaria: Array.isArray(c.lista_indiciaria)
              ? c.lista_indiciaria.slice(0, 5).map((x: any) => typeof x === 'string' ? x : (x?.label ?? ''))
              : undefined,
          }
        })

        const rationalities: LongitudinalRationality[] = (rationalitiesData || []).map((r: any) => ({
          id: r.id,
          rationality_type: r.rationality_type,
          created_at: r.created_at,
          assessmentExcerpt: typeof r.assessment === 'string'
            ? r.assessment.substring(0, ASSESSMENT_EXCERPT_CHARS).trim()
            : undefined,
        }))

        // Audit log LGPD (sem PHI direto, só metadados)
        try {
          await (supabase as any).from('noa_logs').insert({
            interaction_type: 'matrix_patient_load_v1_9_382',
            payload: {
              patient_id: patientId,
              reports_loaded: reports.length,
              rationalities_loaded: rationalities.length,
              source: 'noa_matrix_longitudinal',
            },
          })
        } catch {
          // audit fail-open (não bloqueia carregamento)
        }

        setData({
          patientName: userData?.name || null,
          reports,
          rationalities,
          loading: false,
          error: null,
        })
      } catch (err: any) {
        if (cancelled) return
        console.warn('[usePatientLongitudinal] erro:', err)
        setData((prev) => ({
          ...prev,
          loading: false,
          error: err?.message || 'Erro ao carregar histórico do paciente',
        }))
      }
    }

    load()
    return () => { cancelled = true }
  }, [patientId])

  return data
}
