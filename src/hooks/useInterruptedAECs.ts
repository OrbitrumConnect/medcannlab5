/**
 * useInterruptedAECs — hook que carrega AECs INTERRUPTED órfãs (não-completed,
 * não-invalidated) pra médico decidir destino (invalidar / aguardar paciente retomar).
 *
 * V1.9.500 (Pedro 29/05 — Sprint A pós P0). Endereça backlog conhecido:
 *  - 9 INTERRUPTED rows totais em aec_assessment_state
 *  - 4 "alive" (NOT is_complete + invalidated_at IS NULL) — ÓRFÃS REAIS
 *  - 4 já-completed (paciente retomou) + 2 invalidated (admin tratou)
 *
 * Smoke empírico 29/05: joao eduardo 4d / Pedro 7d / Thiago 24d / Solange 32d.
 *
 * Ações disponíveis:
 *  - invalidate(id, reason): marca como invalidated_at=NOW + invalidation_reason
 *    (preserva row pra audit LGPD; não deleta)
 *  - markComplete(id): força is_complete=true (caso paciente concluiu offline)
 *
 * NÃO oferece "Retomar": fluxo natural é paciente abrir app + auto-pause
 * detector V1.9.299 retoma sessão. Médico não pode forçar paciente a retomar.
 *
 * RLS: aec_assessment_state precisa policy admin/médico (ver). Smoke confirma
 * via PAT que admin Pedro vê todas as 9 rows.
 */
import { useEffect, useState, useCallback } from 'react'
import { supabase } from '../lib/supabase'

export interface InterruptedAEC {
  id: string
  user_id: string
  patient_name: string | null
  phase: string
  interrupted_from_phase: string | null
  last_update: string
  days_ago: number
  consent_given: boolean
  started_at: string
  phase_iteration_count: number | null
}

interface UseInterruptedAECsState {
  items: InterruptedAEC[]
  loading: boolean
  error: string | null
  refresh: () => Promise<void>
  invalidate: (id: string, reason: string) => Promise<{ ok: boolean; error?: string }>
  markComplete: (id: string) => Promise<{ ok: boolean; error?: string }>
}

export function useInterruptedAECs(): UseInterruptedAECsState {
  const [items, setItems] = useState<InterruptedAEC[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchItems = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      // Join manual: aec_assessment_state -> users (RLS protege)
      const { data: states, error: err } = await (supabase as any)
        .from('aec_assessment_state')
        .select('id, user_id, phase, interrupted_from_phase, last_update, consent_given, started_at, phase_iteration_count')
        .eq('phase', 'INTERRUPTED')
        .eq('is_complete', false)
        .is('invalidated_at', null)
        .order('last_update', { ascending: false })
      if (err) throw err

      const userIds = Array.from(new Set((states || []).map((s: any) => s.user_id).filter(Boolean)))
      let usersMap = new Map<string, string>()
      if (userIds.length > 0) {
        const { data: users } = await (supabase as any)
          .from('users')
          .select('id, name')
          .in('id', userIds)
        for (const u of users || []) {
          usersMap.set(u.id, u.name || 'Paciente')
        }
      }

      const today = new Date()
      const enriched: InterruptedAEC[] = (states || []).map((s: any) => {
        const last = new Date(s.last_update)
        const days = Math.floor((today.getTime() - last.getTime()) / (1000 * 60 * 60 * 24))
        return {
          id: s.id,
          user_id: s.user_id,
          patient_name: usersMap.get(s.user_id) || null,
          phase: s.phase,
          interrupted_from_phase: s.interrupted_from_phase,
          last_update: s.last_update,
          days_ago: days,
          consent_given: !!s.consent_given,
          started_at: s.started_at,
          phase_iteration_count: s.phase_iteration_count,
        }
      })
      setItems(enriched)
    } catch (e: any) {
      console.warn('[useInterruptedAECs] erro:', e)
      setError(e?.message || 'Erro ao carregar AECs interrompidas')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchItems()
  }, [fetchItems])

  const invalidate = useCallback(async (id: string, reason: string) => {
    try {
      if (!reason.trim()) {
        return { ok: false as const, error: 'Motivo de invalidação obrigatório' }
      }
      const { error: err } = await (supabase as any)
        .from('aec_assessment_state')
        .update({
          invalidated_at: new Date().toISOString(),
          invalidation_reason: reason.trim(),
        })
        .eq('id', id)
      if (err) throw err
      await fetchItems()
      return { ok: true as const }
    } catch (e: any) {
      console.warn('[useInterruptedAECs.invalidate] erro:', e)
      return { ok: false as const, error: e?.message || 'Erro ao invalidar' }
    }
  }, [fetchItems])

  const markComplete = useCallback(async (id: string) => {
    try {
      const { error: err } = await (supabase as any)
        .from('aec_assessment_state')
        .update({ is_complete: true })
        .eq('id', id)
      if (err) throw err
      await fetchItems()
      return { ok: true as const }
    } catch (e: any) {
      console.warn('[useInterruptedAECs.markComplete] erro:', e)
      return { ok: false as const, error: e?.message || 'Erro ao marcar como concluída' }
    }
  }, [fetchItems])

  return { items, loading, error, refresh: fetchItems, invalidate, markComplete }
}

// Helper UI: label legível por fase
export const PHASE_LABELS: Record<string, string> = {
  IDENTIFICATION: 'Identificação',
  CONSENT: 'Consentimento',
  MAIN_COMPLAINT: 'Queixa Principal',
  COMPLAINT_DETAILS: 'Detalhes da Queixa',
  INVESTIGATION: 'Investigação',
  PATHOLOGICAL_HISTORY: 'Hist. Patológica',
  FAMILY_HISTORY: 'Hist. Familiar',
  LIFE_HABITS: 'Hábitos de Vida',
  OBJECTIVE_QUESTIONS: 'Perguntas Objetivas',
  CONSENSUS: 'Consenso',
  REPORT: 'Relatório',
  FINAL_RECOMMENDATION: 'Recomendação Final',
  INTERRUPTED: 'Interrompida',
  COMPLETED: 'Concluída',
}

export function getPhaseLabel(phase: string | null | undefined): string {
  if (!phase) return '—'
  return PHASE_LABELS[phase] || phase
}
