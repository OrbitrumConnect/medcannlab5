/**
 * V1.9.272 — Helper puro pra calcular status de vínculo paciente↔profissional.
 *
 * Princípio: feature emergente do schema existente. ZERO migration nova.
 * Reusa users.invited_by + appointments + professional_teams (todos já existem).
 *
 * Hierarquia determinística (review GPT externo 13/05 23h30):
 *   1) Vínculo direto via appointment ativo   → 🟢 green (source='appointment')
 *   2) Médico de referência (invited_by)      → 🟢 green (source='direct_invite')
 *   3) Membro da rede de cuidado do médico    → 🟡 yellow (source='network')
 *      de referência (extensão autorizada via
 *      professional_teams.is_active)
 *   4) Nenhuma evidência empírica de vínculo  → 🔴 red (source='none')
 *
 * Helper 100% PURO:
 *   - Zero query interna
 *   - Zero async
 *   - Zero side effects
 *   - Auditável e testável isoladamente
 *   - Compatível com useMemo / cache externo
 *
 * Maps auxiliares são pré-carregados em PatientAppointments via 3 queries
 * leves (executadas 1x ao montar a página).
 */

export type VinculoStatus = 'green' | 'yellow' | 'red'
export type VinculoSource = 'appointment' | 'direct_invite' | 'network' | 'none'

export interface VinculoStatusInput {
  /** Professional sendo avaliado (UUID do card). */
  professionalId: string
  /** Pacient.invited_by — UUID do médico que indicou o paciente, ou null. */
  invitedBy: string | null
  /** Set/Map de professional_ids com quem o paciente tem appointment ativo. */
  appointmentsSet: Set<string>
  /** Set/Map de professional_ids que estão na equipe ativa do invited_by. */
  careNetworkSet: Set<string>
}

export interface VinculoStatusOutput {
  status: VinculoStatus
  source: VinculoSource
  /** Texto humano pra tooltip — semântica clínica, não técnica. */
  tooltip: string
}

const TOOLTIPS: Record<VinculoSource, string> = {
  appointment: 'Vínculo ativo — você já consultou ou tem consulta marcada com este profissional.',
  direct_invite: 'Seu profissional de referência — você se cadastrou pela indicação dele(a).',
  network: 'Membro da rede de cuidado do seu profissional de referência. Pode marcar consulta com confiança.',
  none: 'Sem vínculo ainda — você pode escolher este profissional pra iniciar acompanhamento.',
}

export function getVinculoStatus(input: VinculoStatusInput): VinculoStatusOutput {
  const { professionalId, invitedBy, appointmentsSet, careNetworkSet } = input

  // 1) Verde via appointment — evidência empírica máxima
  if (appointmentsSet.has(professionalId)) {
    return { status: 'green', source: 'appointment', tooltip: TOOLTIPS.appointment }
  }

  // 2) Verde via indicação direta — paciente cadastrou-se pelo link DESTE profissional
  if (invitedBy && invitedBy === professionalId) {
    return { status: 'green', source: 'direct_invite', tooltip: TOOLTIPS.direct_invite }
  }

  // 3) Amarelo via rede de cuidado — extensão autorizada via professional_teams
  if (careNetworkSet.has(professionalId)) {
    return { status: 'yellow', source: 'network', tooltip: TOOLTIPS.network }
  }

  // 4) Vermelho — nenhuma relação empírica
  return { status: 'red', source: 'none', tooltip: TOOLTIPS.none }
}
