import { useEffect, useState, useCallback } from 'react'
import { supabase } from '../lib/supabase'

/**
 * V1.9.145 — usePendingRatings
 *
 * Hook que retorna pending_ratings do paciente atual:
 *   status='pending' AND deadline > NOW() AND patient_id=auth.uid()
 *
 * Realtime: subscribe em INSERT/UPDATE pra atualizar lista quando:
 *   - Trigger handle_appointment_completed cria novo pending
 *   - Modal de avaliação completa (UPDATE status='completed')
 *
 * Uso típico:
 *   const { pendingRatings, refresh, dismiss } = usePendingRatings()
 *   if (pendingRatings.length > 0) → exibir banner CTA "Avalie sua consulta"
 */

export interface PendingRating {
  id: string
  appointment_id: string
  patient_id: string
  professional_id: string
  professional_name?: string
  status: 'pending' | 'completed' | 'expired'
  deadline: string
  source: string
  created_at: string
}

export function usePendingRatings(userId?: string) {
  const [pendingRatings, setPendingRatings] = useState<PendingRating[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    if (!userId) {
      setPendingRatings([])
      setLoading(false)
      return
    }
    setLoading(true)
    setError(null)
    try {
      const { data, error: queryErr } = await (supabase as any)
        .from('pending_ratings')
        .select(
          'id, appointment_id, patient_id, professional_id, status, deadline, source, created_at'
        )
        .eq('patient_id', userId)
        .eq('status', 'pending')
        .gt('deadline', new Date().toISOString())
        .order('created_at', { ascending: false })

      if (queryErr) {
        setError(queryErr.message)
        setPendingRatings([])
        setLoading(false)
        return
      }

      // Enriquecer com nome do profissional (1 query batch)
      const profIds = Array.from(
        new Set((data ?? []).map((p: any) => p.professional_id).filter(Boolean))
      )
      let nameMap = new Map<string, string>()
      if (profIds.length > 0) {
        const { data: profs } = await (supabase as any)
          .from('users')
          .select('id, name')
          .in('id', profIds)
        for (const p of profs ?? []) nameMap.set(p.id, p.name)
      }

      const enriched = (data ?? []).map((p: any) => ({
        ...p,
        professional_name: nameMap.get(p.professional_id) ?? 'Profissional',
      })) as PendingRating[]

      setPendingRatings(enriched)
      setLoading(false)
    } catch (err: any) {
      setError(String(err?.message || err))
      setPendingRatings([])
      setLoading(false)
    }
  }, [userId])

  useEffect(() => {
    load()
  }, [load])

  // Realtime: refresh quando pending mudar
  useEffect(() => {
    if (!userId) return
    const channel = supabase
      .channel(`pending-ratings:${userId}`)
      .on(
        'postgres_changes' as any,
        {
          event: '*',
          schema: 'public',
          table: 'pending_ratings',
          filter: `patient_id=eq.${userId}`,
        },
        () => load()
      )
      .subscribe()
    return () => {
      supabase.removeChannel(channel)
    }
  }, [userId, load])

  /** Marca pending como dismiss local (não toca banco — só esconde UI temporariamente) */
  const dismiss = useCallback((appointmentId: string) => {
    setPendingRatings((prev) =>
      prev.filter((p) => p.appointment_id !== appointmentId)
    )
  }, [])

  return { pendingRatings, loading, error, refresh: load, dismiss }
}
