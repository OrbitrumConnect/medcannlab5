/**
 * V1.9.121 — AEC Promotion Detector (FASE 0)
 *
 * Detecta "padrão AEC emergindo" em chat livre paciente.
 * Selo quíntuplo: Claude + GPT review + Pedro + Ricardo + GPT-Ricardo (03/05/2026).
 *
 * Princípio epistemológico Ricardo:
 *   "Não é a IA que transforma conversa em verdade clínica;
 *    é o paciente que confirma a organização da própria fala."
 *
 * Função PURE (sem side effects). Recebe mensagens + contexto, retorna decisão.
 * Resolve caso João (04/05/2026): conversa que parece AEC sem FSM real
 * → ORCHESTRATOR confuso → CONSENT_GATE backstop. Com detector → hint
 * consciente → ASSESSMENT_START (mecanismo P8 existente).
 */

const CLINICAL_KEYWORDS = {
  symptoms: /\b(dor(es)?|ansiedade|depressao|depressão|cansaco|cansaço|insonia|insônia|febre|nausea|náusea|vertigem|tontura|tosse|falta\s+de\s+ar|enjoo|enjôo|vomito|vômito|diarreia|prisao|prisão\s+de\s+ventre|alergia|coceira|inchaco|inchaço)\b/i,
  anatomy: /\b(cabeca|cabeça|estomago|estômago|coracao|coração|pulmao|pulmão|rim|figado|fígado|garganta|pele|articulacao|articulação|costas|peito|barriga|perna|braco|braço|olho|ouvido)\b/i,
  duration: /\b(ha\s+(dias?|semanas?|meses?|anos?)|h[aá]\s+\d+|todo\s+(dia|tempo)|sempre|desde\s+(crianca|criança|adolescente|adolescência|jovem)|cronico|crônico)\b/i,
  events: /\b(tomei|usei|fiz\s+(exame|cirurgia)|fui\s+ao\s+m[eé]dico|hospitalizado|operado|medica(c|ç)ao|medicação|rem[eé]dio|receita)\b/i,
  family: /\b(m[aã]e\s+(tem|teve|tinha)|pai\s+(tem|teve|tinha)|irm[aã]o\s+(tem|teve|tinha)|familia|família|heredit[aá]rio|gen[eé]tico)\b/i,
}

const THIRD_PERSON = /\b(namorad[ao]|esposa|esposo|marido|filh[ao]|amig[ao]|colega|vizinh[ao]|prim[ao]|tia|tio|conhec[ie]d[ao])\s+(tem|teve|esta|está|sente|tinha|sofre)\b/i

export interface DetectorMessage {
  role: 'user' | 'noa' | 'system'
  content: string
  intent?: string
}

export interface DetectorContext {
  userType?: string
  hasActiveAec: boolean
  hasRecentAec24h: boolean
  lastHintShownAt?: number
  currentRoute?: string
}

export interface DetectionResult {
  shouldShowHint: boolean
  reason: string
  signals: {
    clinicalTurns: number
    intentClinical: boolean
    skippedThirdPerson: boolean
  }
}

const COOLDOWN_MS = 60 * 60 * 1000
const MIN_CLINICAL_TURNS = 3
const MAX_LOOKBACK = 8

function isClinicalTurn(content: string, intent?: string): boolean {
  if (!content || content.trim().length < 3) return false
  if (THIRD_PERSON.test(content)) return false

  let signals = 0
  if (CLINICAL_KEYWORDS.symptoms.test(content)) signals++
  if (CLINICAL_KEYWORDS.anatomy.test(content)) signals++
  if (CLINICAL_KEYWORDS.duration.test(content)) signals++
  if (CLINICAL_KEYWORDS.events.test(content)) signals++
  if (CLINICAL_KEYWORDS.family.test(content)) signals++

  if (signals >= 1) return true
  if (intent === 'CLINICA' && content.length > 8) return true
  return false
}

export function detectAecPromotion(
  messages: DetectorMessage[],
  context: DetectorContext
): DetectionResult {
  const baseSignals = { clinicalTurns: 0, intentClinical: false, skippedThirdPerson: false }

  if (context.userType && context.userType !== 'patient' && context.userType !== 'paciente') {
    return { shouldShowHint: false, reason: 'skip_non_patient_user', signals: baseSignals }
  }

  if (context.hasActiveAec) {
    return { shouldShowHint: false, reason: 'skip_aec_already_active', signals: baseSignals }
  }

  if (context.hasRecentAec24h) {
    return { shouldShowHint: false, reason: 'skip_recent_aec_24h', signals: baseSignals }
  }

  if (context.lastHintShownAt && Date.now() - context.lastHintShownAt < COOLDOWN_MS) {
    return { shouldShowHint: false, reason: 'skip_cooldown', signals: baseSignals }
  }

  const recentUserMessages = messages
    .filter(m => m.role === 'user')
    .slice(-MAX_LOOKBACK)

  const clinicalTurns = recentUserMessages.filter(m => isClinicalTurn(m.content, m.intent)).length
  const intentClinical = recentUserMessages.some(m => m.intent === 'CLINICA')
  const skippedThirdPerson = recentUserMessages.some(m => THIRD_PERSON.test(m.content))

  const signals = { clinicalTurns, intentClinical, skippedThirdPerson }

  if (clinicalTurns < MIN_CLINICAL_TURNS) {
    return { shouldShowHint: false, reason: `insufficient_clinical_turns_${clinicalTurns}_of_${MIN_CLINICAL_TURNS}`, signals }
  }

  return { shouldShowHint: true, reason: 'pattern_detected', signals }
}

export const AEC_PROMOTION_TRIGGER_TEXT = 'Quero iniciar a avaliação clínica inicial'
