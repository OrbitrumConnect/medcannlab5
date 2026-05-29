/**
 * useMentorship — hook que carrega perfis de mentores + permite solicitar mentoria.
 *
 * V1.9.497 (Sprint E Vertical 3 — Pedro 29/05) — plantio Mentoria.
 *
 * Schemas NOVOS via PAT migration:
 *  - `public.mentor_profiles` (13 cols): perfil de cada mentor (Ricardo/Eduardo/Nôa+).
 *    user_id NULL ok pra IA Nôa (não tem auth.users).
 *  - `public.mentorship_requests` (12 cols): solicitações de mentoria. Status
 *    enum: pending / accepted / rejected / completed / cancelled.
 *
 * RLS:
 *  - mentor_profiles: público vê active; admin manage; mentor pode UPDATE próprio
 *  - mentorship_requests: requester vê próprias + mentor vê as dele + admin vê todas;
 *    requester insere próprias; mentor + admin atualizam (resposta/status)
 *
 * Princípios:
 *  - Triple-A: tipado, error handling, empty state honesto
 *  - polir-não-inventar (pattern consistente com useNewsItems V1.9.495 + useEvaluationInstruments V1.9.496)
 *  - separação semântica (mentor profile distinto de auth user — IA Nôa é mentor sem user_id)
 *  - graceful (mentor responde via DB; email Resend é opt-in via Edge separado se quiser)
 */
import { useEffect, useState, useCallback } from 'react'
import { supabase } from '../lib/supabase'

export interface MentorProfile {
  id: string
  user_id: string | null
  slug: string
  display_name: string
  role: string
  availability: string | null
  channel: string | null
  focus: string | null
  bio: string | null
  avatar_url: string | null
  active: boolean
  sort_order: number
  created_at: string
  updated_at: string
}

export type MentorshipStatus = 'pending' | 'accepted' | 'rejected' | 'completed' | 'cancelled'

export interface MentorshipRequest {
  id: string
  mentor_profile_id: string
  requester_id: string
  requester_name: string | null
  requester_email: string | null
  preferred_date: string | null  // YYYY-MM-DD
  preferred_time: string | null
  topic: string
  message: string | null
  status: MentorshipStatus
  mentor_response: string | null
  responded_at: string | null
  created_at: string
  updated_at: string
}

export interface MentorshipRequestInput {
  mentor_profile_id: string
  requester_name?: string | null
  requester_email?: string | null
  preferred_date?: string | null
  preferred_time?: string | null
  topic: string
  message?: string | null
}

interface UseMentorshipState {
  mentors: MentorProfile[]
  myRequests: MentorshipRequest[]
  loading: boolean
  error: string | null
  refresh: () => Promise<void>
  submitRequest: (input: MentorshipRequestInput) => Promise<{ ok: boolean; error?: string; id?: string }>
  cancelRequest: (id: string) => Promise<{ ok: boolean; error?: string }>
}

export function useMentorship(): UseMentorshipState {
  const [mentors, setMentors] = useState<MentorProfile[]>([])
  const [myRequests, setMyRequests] = useState<MentorshipRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const { data: mentorsData, error: mentorsErr } = await (supabase as any)
        .from('mentor_profiles')
        .select('*')
        .eq('active', true)
        .order('sort_order', { ascending: true })
      if (mentorsErr) throw mentorsErr
      setMentors((mentorsData || []) as MentorProfile[])

      // My requests (RLS já filtra: vê só próprias OR como mentor OR como admin)
      const { data: requestsData } = await (supabase as any)
        .from('mentorship_requests')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(20)
      setMyRequests((requestsData || []) as MentorshipRequest[])
    } catch (e: any) {
      console.warn('[useMentorship] erro:', e)
      setError(e?.message || 'Erro ao carregar mentoria')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const submitRequest = useCallback(async (input: MentorshipRequestInput) => {
    try {
      const { data: userResp } = await supabase.auth.getUser()
      const userId = userResp?.user?.id
      if (!userId) {
        return { ok: false as const, error: 'Sessão expirada. Faça login novamente.' }
      }
      // Pré-popula requester_email/name se disponível em auth metadata
      const userMeta = userResp?.user?.user_metadata || {}
      const fallbackName = input.requester_name || userMeta.name || userMeta.full_name || null
      const fallbackEmail = input.requester_email || userResp?.user?.email || null
      const { data, error: err } = await (supabase as any)
        .from('mentorship_requests')
        .insert({
          mentor_profile_id: input.mentor_profile_id,
          requester_id: userId,
          requester_name: fallbackName,
          requester_email: fallbackEmail,
          preferred_date: input.preferred_date || null,
          preferred_time: input.preferred_time || null,
          topic: input.topic,
          message: input.message || null,
          status: 'pending',
        })
        .select('id')
        .single()
      if (err) throw err
      await fetchData()
      return { ok: true as const, id: data?.id }
    } catch (e: any) {
      console.warn('[useMentorship.submitRequest] erro:', e)
      return { ok: false as const, error: e?.message || 'Erro ao enviar solicitação' }
    }
  }, [fetchData])

  const cancelRequest = useCallback(async (id: string) => {
    try {
      const { error: err } = await (supabase as any)
        .from('mentorship_requests')
        .update({ status: 'cancelled', updated_at: new Date().toISOString() })
        .eq('id', id)
      if (err) throw err
      await fetchData()
      return { ok: true as const }
    } catch (e: any) {
      console.warn('[useMentorship.cancelRequest] erro:', e)
      return { ok: false as const, error: e?.message || 'Erro ao cancelar' }
    }
  }, [fetchData])

  return { mentors, myRequests, loading, error, refresh: fetchData, submitRequest, cancelRequest }
}

export const MENTORSHIP_STATUS_LABELS: Record<MentorshipStatus, { label: string; color: string }> = {
  pending: { label: 'Pendente', color: 'bg-amber-500/15 text-amber-200 border-amber-500/40' },
  accepted: { label: 'Aceita', color: 'bg-emerald-500/15 text-emerald-200 border-emerald-500/40' },
  rejected: { label: 'Recusada', color: 'bg-rose-500/15 text-rose-200 border-rose-500/40' },
  completed: { label: 'Concluída', color: 'bg-blue-500/15 text-blue-200 border-blue-500/40' },
  cancelled: { label: 'Cancelada', color: 'bg-slate-500/15 text-slate-300 border-slate-500/40' },
}
