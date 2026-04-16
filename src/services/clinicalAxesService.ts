/**
 * Clinical Axes Service
 * 
 * Extracts and persists the 5 clinical interpretation axes from a report + rationality.
 * Pipeline: clinical_reports → clinical_rationalities → clinical_axes → clinical_kpis
 * 
 * Axes:
 * - sintomatico: o que o paciente sente
 * - funcional: como impacta a vida
 * - etiologico: causas possíveis
 * - terapeutico: o que está sendo feito
 * - prognostico: para onde caminha
 */

import { supabase } from '../lib/supabase'

export type AxisName = 'sintomatico' | 'funcional' | 'etiologico' | 'terapeutico' | 'prognostico'

export interface ClinicalAxisData {
  axis_name: AxisName
  summary: string
  indicators: AxisIndicator[]
  confidence: number
}

export interface AxisIndicator {
  name: string
  value: string | number
  unit?: string
  trend?: 'improving' | 'stable' | 'worsening' | 'unknown'
  source_signal?: string
}

const AXIS_DEFINITIONS: Record<AxisName, { label: string; extractionHint: string }> = {
  sintomatico: {
    label: 'Eixo Sintomático',
    extractionHint: 'Queixas relatadas, sintomas, intensidade, frequência, localização'
  },
  funcional: {
    label: 'Eixo Funcional',
    extractionHint: 'Impacto na vida diária, limitações, qualidade de vida, sono, trabalho'
  },
  etiologico: {
    label: 'Eixo Etiológico',
    extractionHint: 'Causas possíveis, fatores de risco, histórico familiar, comorbidades'
  },
  terapeutico: {
    label: 'Eixo Terapêutico',
    extractionHint: 'Tratamentos em curso, medicações, terapias complementares, adesão'
  },
  prognostico: {
    label: 'Eixo Prognóstico',
    extractionHint: 'Tendência de evolução, fatores de melhora/piora, expectativas, metas'
  }
}

/**
 * Extract clinical axes from a report's AEC content
 * This is deterministic — no GPT needed for basic extraction
 */
export function extractAxesFromContent(content: any): ClinicalAxisData[] {
  if (!content || typeof content !== 'object') return []

  const axes: ClinicalAxisData[] = []

  // === EIXO SINTOMÁTICO ===
  const queixa = content.queixa_principal || content.chiefComplaint || ''
  const listaRaw = content.lista_indiciaria || content.lista_indiciaria_flat || content.indicativeList || []
  const lista = Array.isArray(listaRaw) ? listaRaw : []
  const dev = content.desenvolvimento_queixa || content.complaintDevelopment || {}
  const sintomasAssociados = dev.sintomas_associados || dev.associatedSymptoms || []

  // Detect if lista has structured symptoms (v2) or flat strings (v1)
  const isStructured = lista.length > 0 && typeof lista[0] === 'object' && lista[0].label

  if (queixa || lista.length > 0) {
    const indicators: AxisIndicator[] = []
    if (queixa) {
      indicators.push({ name: 'queixa_principal', value: queixa, source_signal: 'AEC_etapa_3' })
    }
    indicators.push({ name: 'total_queixas', value: lista.length, unit: 'queixas', source_signal: 'AEC_etapa_2' })

    // If structured symptoms (v2), extract richer data
    if (isStructured) {
      lista.forEach((s: any, i: number) => {
        indicators.push({
          name: `sintoma_${i + 1}`,
          value: s.label || String(s),
          unit: s.intensity || undefined,
          trend: s.frequency ? 'stable' : 'unknown',
          source_signal: `AEC_etapa_2:${s.label}`
        })
      })
    }

    if (dev.localizacao) {
      indicators.push({ name: 'localizacao', value: dev.localizacao, source_signal: 'AEC_etapa_4' })
    }
    if (dev.inicio) {
      indicators.push({ name: 'inicio', value: dev.inicio, source_signal: 'AEC_etapa_4' })
    }
    if (Array.isArray(sintomasAssociados) && sintomasAssociados.length > 0) {
      indicators.push({ name: 'sintomas_associados', value: sintomasAssociados.length, unit: 'sintomas', source_signal: 'AEC_etapa_4' })
    }

    const summaryItems = isStructured
      ? lista.map((s: any) => s.label).join(', ')
      : lista.join(', ')

    axes.push({
      axis_name: 'sintomatico',
      summary: `Queixa principal: ${queixa || 'Não informada'}. ${lista.length} queixas registradas: ${summaryItems || 'nenhuma'}.`,
      indicators,
      confidence: queixa ? (isStructured ? 0.9 : 0.8) : 0.3
    })
  }

  // === EIXO FUNCIONAL ===
  const habitos = content.habitos_vida || content.lifestyle || []
  const fatoresMelhora = dev.fatores_melhora || dev.improvingFactors || []
  const fatoresPiora = dev.fatores_piora || dev.worseningFactors || []

  if (Array.isArray(habitos) && habitos.length > 0) {
    const indicators: AxisIndicator[] = [
      { name: 'habitos_registrados', value: habitos.length, unit: 'hábitos', source_signal: 'AEC_etapa_7' }
    ]
    if (Array.isArray(fatoresMelhora) && fatoresMelhora.length > 0) {
      indicators.push({ name: 'fatores_melhora', value: fatoresMelhora.length, trend: 'improving', source_signal: 'AEC_etapa_4' })
    }
    if (Array.isArray(fatoresPiora) && fatoresPiora.length > 0) {
      indicators.push({ name: 'fatores_piora', value: fatoresPiora.length, trend: 'worsening', source_signal: 'AEC_etapa_4' })
    }

    axes.push({
      axis_name: 'funcional',
      summary: `${habitos.length} hábitos de vida registrados. ${fatoresMelhora.length} fatores de melhora e ${fatoresPiora.length} fatores de piora identificados.`,
      indicators,
      confidence: habitos.length > 2 ? 0.7 : 0.4
    })
  }

  // === EIXO ETIOLÓGICO ===
  const historiaPatologica = content.historia_patologica_pregressa || content.pastMedicalHistory || []
  const historiaFamiliar = content.historia_familiar || content.familyHistory || {}
  const materno = historiaFamiliar.lado_materno || historiaFamiliar.maternal || []
  const paterno = historiaFamiliar.lado_paterno || historiaFamiliar.paternal || []

  if ((Array.isArray(historiaPatologica) && historiaPatologica.length > 0) ||
      (Array.isArray(materno) && materno.length > 0) ||
      (Array.isArray(paterno) && paterno.length > 0)) {
    const indicators: AxisIndicator[] = []
    if (Array.isArray(historiaPatologica) && historiaPatologica.length > 0) {
      indicators.push({ name: 'antecedentes_pessoais', value: historiaPatologica.length, unit: 'condições', source_signal: 'AEC_etapa_5' })
    }
    if (Array.isArray(materno) && materno.length > 0) {
      indicators.push({ name: 'antecedentes_maternos', value: materno.length, unit: 'condições', source_signal: 'AEC_etapa_5' })
    }
    if (Array.isArray(paterno) && paterno.length > 0) {
      indicators.push({ name: 'antecedentes_paternos', value: paterno.length, unit: 'condições', source_signal: 'AEC_etapa_5' })
    }

    axes.push({
      axis_name: 'etiologico',
      summary: `${Array.isArray(historiaPatologica) ? historiaPatologica.length : 0} antecedentes pessoais, ${Array.isArray(materno) ? materno.length : 0} maternos, ${Array.isArray(paterno) ? paterno.length : 0} paternos.`,
      indicators,
      confidence: (historiaPatologica.length > 0 && (materno.length > 0 || paterno.length > 0)) ? 0.7 : 0.4
    })
  }

  // === EIXO TERAPÊUTICO ===
  const perguntas = content.perguntas_objetivas || content.objectiveQuestions || {}
  const medicacoesReg = perguntas.medicacoes_regulares || perguntas.regularMedications
  const medicacoesEsp = perguntas.medicacoes_esporadicas || perguntas.sporadicMedications
  const alergias = perguntas.alergias || perguntas.allergies

  if (medicacoesReg || medicacoesEsp || alergias) {
    const indicators: AxisIndicator[] = []
    if (medicacoesReg) {
      indicators.push({ name: 'medicacoes_regulares', value: medicacoesReg, source_signal: 'AEC_etapa_6' })
    }
    if (medicacoesEsp) {
      indicators.push({ name: 'medicacoes_esporadicas', value: medicacoesEsp, source_signal: 'AEC_etapa_6' })
    }
    if (alergias) {
      indicators.push({ name: 'alergias', value: alergias, source_signal: 'AEC_etapa_6' })
    }

    axes.push({
      axis_name: 'terapeutico',
      summary: `Medicações: ${medicacoesReg || 'Nenhuma regular'}. Alergias: ${alergias || 'Nenhuma relatada'}.`,
      indicators,
      confidence: medicacoesReg ? 0.7 : 0.3
    })
  }

  // === EIXO PROGNÓSTICO ===
  const consenso = content.consenso || {}
  const hasConsent = consenso.aceito === true

  if (hasConsent || (Array.isArray(fatoresMelhora) && fatoresMelhora.length > 0)) {
    const melhoraCount = Array.isArray(fatoresMelhora) ? fatoresMelhora.length : 0
    const pioraCount = Array.isArray(fatoresPiora) ? fatoresPiora.length : 0
    const trend: 'improving' | 'worsening' | 'stable' =
      melhoraCount > pioraCount ? 'improving' :
      pioraCount > melhoraCount ? 'worsening' : 'stable'

    const indicators: AxisIndicator[] = [
      { name: 'tendencia', value: trend, trend, source_signal: 'AEC_etapa_4_7' },
      { name: 'consenso_paciente', value: hasConsent ? 'sim' : 'não', source_signal: 'AEC_etapa_9' }
    ]

    axes.push({
      axis_name: 'prognostico',
      summary: `Tendência: ${trend === 'improving' ? 'melhora' : trend === 'worsening' ? 'piora' : 'estável'}. Consenso: ${hasConsent ? 'aceito' : 'pendente'}.`,
      indicators,
      confidence: hasConsent ? 0.6 : 0.3
    })
  }

  return axes
}

/**
 * Persist axes for a given report
 */
export async function saveAxesForReport(
  reportId: string,
  patientId: string,
  axes: ClinicalAxisData[],
  rationalityId?: string
): Promise<void> {
  if (axes.length === 0) return

  const rows = axes.map(axis => ({
    report_id: reportId,
    patient_id: patientId,
    axis_name: axis.axis_name,
    summary: axis.summary,
    indicators: axis.indicators,
    source_rationality_id: rationalityId || null,
    confidence: axis.confidence
  }))

  const { error } = await (supabase as any)
    .from('clinical_axes')
    .upsert(rows, { onConflict: 'report_id,axis_name' })

  if (error) {
    console.error('Error saving clinical axes:', error)
    throw error
  }

  console.log(`✅ ${axes.length} eixos clínicos salvos para relatório ${reportId}`)
}

/**
 * Get axes for a patient (latest report)
 */
export async function getPatientAxes(patientId: string): Promise<ClinicalAxisData[]> {
  const { data, error } = await (supabase as any)
    .from('clinical_axes')
    .select('*')
    .eq('patient_id', patientId)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching patient axes:', error)
    return []
  }

  return (data || []) as unknown as ClinicalAxisData[]
}

/**
 * Get axis definitions (for UI labels)
 */
export function getAxisDefinitions() {
  return AXIS_DEFINITIONS
}
