// =============================================================================
// conversationState — V1.9.66 (ISM Fase 1)
// =============================================================================
// Interaction State Model (ISM) — Fase 1: schema + observabilidade.
//
// Camada arquitetural fundacional que promove "estado conversacional" a
// CONTRATO DE PRIMEIRA CLASSE no payload do Core. Antes do V1.9.66, estado
// estava implícito e espalhado: assessmentPhase em uma chave, consenso dentro
// de aecSnapshot, viewing-as escondido em patientData. Resultado: bugs como
// CC (tipoVisual não chega ao Core), GG (card antes do consent), HH (slot
// mapping), CONSENT_PENDING_BLOCKED, "vamos no 4" (context drift).
//
// Esta Fase 1 NÃO muda comportamento — só consolida o contrato e habilita
// observabilidade no Edge Function. Validação em prod 24-48h antes da Fase 2
// (Core respeitando estados críticos).
//
// Princípios:
//   - Único objeto, fonte única de verdade pro estado conversacional.
//   - Aditivo: campos já existem em outros lugares do payload, só consolidamos.
//   - Fail-safe: qualquer campo indeterminado vira null/'unknown' (não inventa).
//   - Versionado: schema_version permite evolução sem breaking change.
// =============================================================================

export type ConsentStatus = 'pending' | 'given' | 'declined' | 'unknown'

export type AecPhase =
  | 'NONE'
  | 'INITIAL_GREETING'
  | 'IDENTIFICATION'
  | 'COMPLAINT_LIST'
  | 'COMPLAINT_DETAILS'
  | 'PATHOLOGICAL_HISTORY'
  | 'FAMILY_HISTORY'
  | 'LIFESTYLE_HABITS'
  | 'OBJECTIVE_QUESTIONS'
  | 'CONSENSUS'
  | 'COMPLETED'
  | 'INTERRUPTED'
  | string // permite outras fases sem quebrar build

export interface ConversationState {
  schema_version: 1
  /** Fase atual da AEC (se ativa). Default 'NONE' fora da AEC. */
  phase: AecPhase
  /** Status do consentimento clínico. 'unknown' = ainda não modelado pelo client. */
  consent_status: ConsentStatus
  /**
   * Em sessão clínica, o profissional alvo declarado pelo paciente
   * ("quero AEC com Dr. X"). Permite Core escolher persona/template.
   */
  physician_viewing_as: string | null
  /**
   * Modo de visualização do admin ("ver como aluno"). Quando set, Core
   * deve usar role visualizada para selecionar persona/templates,
   * não a role real. Reservado pra Fase 2 (CC fix).
   */
  viewing_as_role: 'patient' | 'professional' | 'student' | 'admin' | null
  /** Role real (do JWT). Sempre presente. */
  real_role: 'patient' | 'professional' | 'student' | 'admin' | 'unknown'
  /**
   * Slot ativo no FSM (ex: aguardando "location" da queixa).
   * Reservado pra Fase 3 (HH fix). Null se nada aguardado.
   */
  active_slot: string | null
}

interface BuildArgs {
  realRole: string | null | undefined
  aecPhase?: string | null
  consensusAgreed?: boolean | null
  physicianViewingAs?: string | null
  viewingAsRole?: string | null
  activeSlot?: string | null
}

/**
 * Constrói o ConversationState a partir das variáveis disponíveis no client
 * no momento do invoke. Fail-safe — campos ausentes viram defaults seguros.
 */
export function buildConversationState(args: BuildArgs): ConversationState {
  const realRoleNorm = normalizeRole(args.realRole)
  const viewingAsNorm = args.viewingAsRole
    ? (normalizeRole(args.viewingAsRole) as ConversationState['viewing_as_role'])
    : null

  const consentStatus: ConsentStatus =
    args.consensusAgreed === true
      ? 'given'
      : args.consensusAgreed === false
        ? 'pending'
        : 'unknown'

  return {
    schema_version: 1,
    phase: (args.aecPhase as AecPhase) || 'NONE',
    consent_status: consentStatus,
    physician_viewing_as: args.physicianViewingAs ?? null,
    viewing_as_role: viewingAsNorm,
    real_role: realRoleNorm,
    active_slot: args.activeSlot ?? null,
  }
}

function normalizeRole(role: string | null | undefined): ConversationState['real_role'] {
  const r = (role ?? '').toString().toLowerCase()
  if (r === 'paciente' || r === 'patient') return 'patient'
  if (r === 'profissional' || r === 'professional') return 'professional'
  if (r === 'aluno' || r === 'student') return 'student'
  if (r === 'admin' || r === 'master') return 'admin'
  return 'unknown'
}
