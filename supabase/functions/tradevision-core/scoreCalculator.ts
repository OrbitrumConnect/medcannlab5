/**
 * Clinical Score Calculator — Deno Edge version
 *
 * Derives STRUCTURAL scores from AEC protocol data stored in
 * clinical_reports.content. These scores measure COMPLETENESS and richness
 * of the assessment — NOT direct health outcomes.
 *
 * Mirror of src/lib/clinicalScoreCalculator.ts (frontend). Colocado dentro
 * de tradevision-core/ (em vez de _shared/) porque o bundler do Supabase
 * Edge Function não empacotava arquivos de ../_shared/ via alguns métodos
 * de deploy (dashboard upload / V1.9.33 falhou "Module not found"). Com
 * arquivo local ao diretório da função, qualquer deploy funciona.
 * V1.9.34 (correção do deploy de V1.9.33).
 *
 * IMPORTANTE: o algoritmo DEVE permanecer equivalente ao do frontend.
 * Se for evoluir, atualize os dois lados. Idealmente extrair como módulo
 * compartilhado com build step, mas hoje é duplicação consciente.
 */

export interface ScoreSignal {
  signal_name: string
  signal_value: number
  weight: number
  aec_stage: string
}

export type ScoreConfidence = 'low' | 'medium' | 'high'

export interface ClinicalScores {
  clinical_score: number
  treatment_adherence: number
  quality_of_life: number
  symptom_improvement: number
  calculated: boolean
  score_confidence: ScoreConfidence
  source_signals: ScoreSignal[]
}

const EMPTY_SCORES: ClinicalScores = {
  clinical_score: 0,
  treatment_adherence: 0,
  quality_of_life: 0,
  symptom_improvement: 0,
  calculated: false,
  score_confidence: 'low',
  source_signals: []
}

export function calculateScoresFromContent(content: any): ClinicalScores {
  if (!content || typeof content !== 'object') return EMPTY_SCORES

  let totalSignals = 0
  let totalWeight = 0
  const signals: ScoreSignal[] = []

  // Signal 1: Queixa Principal
  // V1.9.87 FIX: threshold antigo `> 10` rejeitava queixas legitimas curtas
  // ("O cansaço" = 10 chars exatos, "tontura" = 7, "fadiga" = 6, "ansiedade" = 9,
  // "tosse" = 5, "dor" = 3). Caso real Carolina 27/04 (report 12e4a201) marcou 0/15
  // com queixa_principal = "O cansaço" preenchida. Novo threshold: trim().length >= 3
  // (rejeita "ok"/"sim" mas aceita queixas medicas curtas validas).
  const queixa = content.queixa_principal || content.chiefComplaint || content.mainComplaint
  const queixaTrim = typeof queixa === 'string' ? queixa.trim() : ''
  if (queixaTrim.length >= 3) {
    totalSignals += 15
    totalWeight += 15
    signals.push({ signal_name: 'queixa_principal', signal_value: 15, weight: 15, aec_stage: 'Etapa 3: Queixa Principal' })
  } else {
    totalWeight += 15
    signals.push({ signal_name: 'queixa_principal', signal_value: 0, weight: 15, aec_stage: 'Etapa 3: Queixa Principal' })
  }

  // Signal 2: Lista Indiciária
  const listaRaw = content.lista_indiciaria || content.lista_indiciaria_flat || content.indicativeList || []
  const listaIndiciaria = Array.isArray(listaRaw) ? listaRaw : []
  const listaCount = listaIndiciaria.length
  const listaValue = listaCount > 0 ? Math.min(20, listaCount * 4) : 0
  if (listaCount > 0) {
    totalSignals += listaValue
    totalWeight += 20
  } else {
    totalWeight += 20
  }
  signals.push({ signal_name: 'lista_indiciaria', signal_value: listaValue, weight: 20, aec_stage: 'Etapa 2: Lista Indiciária' })

  // Signal 3: Desenvolvimento da Queixa
  const desenvolvimento = content.desenvolvimento_queixa || content.complaintDevelopment || {}
  const devScore = calculateDevelopmentScore(desenvolvimento)
  totalSignals += devScore
  totalWeight += 20
  signals.push({ signal_name: 'desenvolvimento_queixa', signal_value: devScore, weight: 20, aec_stage: 'Etapa 4: HDA' })

  // Signal 4: Hábitos de Vida
  const habitos = content.habitos_vida || content.lifestyle || []
  const habitosCount = Array.isArray(habitos) ? habitos.length : 0
  const habitosValue = habitosCount > 0 ? Math.min(15, habitosCount * 3) : 0
  if (habitosCount > 0) totalSignals += habitosValue
  totalWeight += 15
  signals.push({ signal_name: 'habitos_vida', signal_value: habitosValue, weight: 15, aec_stage: 'Etapa 7: Estilo de Vida' })

  // Signal 5: História Patológica
  const historiaPatologica = content.historia_patologica_pregressa || content.pastMedicalHistory || []
  const histCount = Array.isArray(historiaPatologica) ? historiaPatologica.length : 0
  const histValue = histCount > 0 ? Math.min(10, histCount * 2) : 0
  if (histCount > 0) totalSignals += histValue
  totalWeight += 10
  signals.push({ signal_name: 'historia_patologica', signal_value: histValue, weight: 10, aec_stage: 'Etapa 5: HPF' })

  // Signal 6: História Familiar
  const historiaFamiliar = content.historia_familiar || content.familyHistory || {}
  const famScore = calculateFamilyHistoryScore(historiaFamiliar)
  totalSignals += famScore
  totalWeight += 10
  signals.push({ signal_name: 'historia_familiar', signal_value: famScore, weight: 10, aec_stage: 'Etapa 5: HPF' })

  // Signal 7: Perguntas Objetivas
  const perguntas = content.perguntas_objetivas || content.objectiveQuestions || {}
  const perguntasKeys = typeof perguntas === 'object' && perguntas !== null ? Object.keys(perguntas).length : 0
  const perguntasValue = perguntasKeys > 0 ? Math.min(10, perguntasKeys * 2) : 0
  if (perguntasKeys > 0) totalSignals += perguntasValue
  totalWeight += 10
  signals.push({ signal_name: 'perguntas_objetivas', signal_value: perguntasValue, weight: 10, aec_stage: 'Etapa 6: Revisão de Sistemas' })

  // Signal 8: Consenso
  const consenso = content.consenso || {}
  const consensoValue = consenso.aceito === true ? 5 : 0
  if (consenso.aceito === true) totalSignals += 5
  signals.push({ signal_name: 'consenso_paciente', signal_value: consensoValue, weight: 5, aec_stage: 'Etapa 9: Resumo Narrativo' })

  const rawScore = totalWeight > 0 ? Math.round((totalSignals / totalWeight) * 100) : 0
  const clinicalScore = Math.min(100, Math.max(0, rawScore))

  const adherence = deriveAdherenceScore(content, clinicalScore)
  const qol = deriveQualityOfLife(content, clinicalScore)
  const symptoms = deriveSymptomImprovement(content, clinicalScore)

  const hasAnyData = totalSignals > 0

  const filledSignals = signals.filter(s => s.signal_value > 0).length
  const score_confidence: ScoreConfidence =
    filledSignals >= 6 ? 'high'
    : filledSignals >= 3 ? 'medium'
    : 'low'

  return {
    clinical_score: hasAnyData ? clinicalScore : 0,
    treatment_adherence: hasAnyData ? adherence : 0,
    quality_of_life: hasAnyData ? qol : 0,
    symptom_improvement: hasAnyData ? symptoms : 0,
    calculated: hasAnyData,
    score_confidence,
    source_signals: signals
  }
}

function calculateDevelopmentScore(dev: any): number {
  if (!dev || typeof dev !== 'object') return 0
  let score = 0
  const fatoresPiora = dev.fatores_piora || dev.worseningFactors || []
  const fatoresMelhora = dev.fatores_melhora || dev.improvingFactors || []
  const sintomasAssociados = dev.sintomas_associados || dev.associatedSymptoms || []
  if (Array.isArray(fatoresPiora) && fatoresPiora.length > 0) score += 7
  if (Array.isArray(fatoresMelhora) && fatoresMelhora.length > 0) score += 7
  if (Array.isArray(sintomasAssociados) && sintomasAssociados.length > 0) score += 6
  return Math.min(20, score)
}

function calculateFamilyHistoryScore(fam: any): number {
  if (!fam || typeof fam !== 'object') return 0
  let score = 0
  const materno = fam.lado_materno || fam.maternal || []
  const paterno = fam.lado_paterno || fam.paternal || []
  if (Array.isArray(materno) && materno.length > 0) score += 5
  if (Array.isArray(paterno) && paterno.length > 0) score += 5
  return Math.min(10, score)
}

function deriveAdherenceScore(content: any, clinicalScore: number): number {
  const consenso = content.consenso || {}
  const hasConsent = consenso.aceito === true
  const base = hasConsent ? clinicalScore + 10 : clinicalScore - 5
  const variance = Math.round(Math.sin(clinicalScore * 0.1) * 8)
  return Math.min(100, Math.max(0, base + variance))
}

function deriveQualityOfLife(content: any, clinicalScore: number): number {
  const habitos = content.habitos_vida || content.lifestyle || []
  const habitosCount = Array.isArray(habitos) ? habitos.length : 0
  const bonus = habitosCount > 3 ? 10 : habitosCount > 0 ? 5 : -5
  const variance = Math.round(Math.cos(clinicalScore * 0.1) * 6)
  return Math.min(100, Math.max(0, clinicalScore + bonus + variance))
}

function deriveSymptomImprovement(content: any, clinicalScore: number): number {
  const dev = content.desenvolvimento_queixa || content.complaintDevelopment || {}
  const melhora = dev.fatores_melhora || dev.improvingFactors || []
  const piora = dev.fatores_piora || dev.worseningFactors || []
  const melhoraCount = Array.isArray(melhora) ? melhora.length : 0
  const pioraCount = Array.isArray(piora) ? piora.length : 0
  const delta = (melhoraCount - pioraCount) * 5
  return Math.min(100, Math.max(0, clinicalScore + delta))
}

/**
 * Unwrap content se vier em forma aninhada (content.raw.content.* vs content.*).
 */
export function unwrapAecContent(content: any): any {
  if (!content || typeof content !== 'object') return content
  const AEC_KEYS = ['identificacao', 'queixa_principal', 'desenvolvimento_queixa', 'lista_indiciaria', 'historia_familiar', 'habitos_vida', 'historia_patologica_pregressa', 'perguntas_objetivas']
  const hasTopLevel = AEC_KEYS.some(k => content[k] && typeof content[k] === 'object')
  if (hasTopLevel) return content
  const nestedDeep = content?.raw?.content
  if (nestedDeep && typeof nestedDeep === 'object' && AEC_KEYS.some(k => nestedDeep[k])) return nestedDeep
  const nestedShallow = content?.raw
  if (nestedShallow && typeof nestedShallow === 'object' && AEC_KEYS.some(k => nestedShallow[k])) return nestedShallow
  return content
}
