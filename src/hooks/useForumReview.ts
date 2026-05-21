/**
 * useForumReview — F4.3 (V1.9.406, 21/05/2026).
 *
 * Workflow do conselho: um forum_post em status 'pending_review' é avaliado
 * pelo conselho (v1 = admins; Ricardo + Eduardo cobrem na prática).
 *  - approve → status 'active' (o caso vira debate no Fórum Cann Matrix)
 *  - reject  → status 'rejected' + review_notes (feedback ao autor)
 *
 * Em ambos grava reviewed_by + reviewed_at (trilha de auditoria).
 * RLS: a policy UPDATE de forum_posts ("Authors and admins can update posts")
 * já permite is_admin() — sem mudança de RLS.
 *
 * Schema pós-F4.1: status / reviewed_by / reviewed_at / review_notes existem.
 */
import { useState } from 'react'
import { supabase } from '../lib/supabase'

export interface UseForumReviewReturn {
  reviewing: boolean
  error: string | null
  /** Aprova o caso → status 'active' (vira debate). */
  approve: (postId: string) => Promise<boolean>
  /** Rejeita o caso → status 'rejected' + observações do conselho ao autor. */
  reject: (postId: string, notes: string) => Promise<boolean>
}

export function useForumReview(): UseForumReviewReturn {
  const [reviewing, setReviewing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const run = async (postId: string, patch: Record<string, unknown>): Promise<boolean> => {
    setReviewing(true)
    setError(null)
    try {
      const { data: authData } = await supabase.auth.getUser()
      const reviewerId = authData?.user?.id
      if (!reviewerId) {
        setError('Sessão não detectada. Faça login novamente.')
        return false
      }
      const { error: updErr } = await (supabase as any)
        .from('forum_posts')
        .update({ ...patch, reviewed_by: reviewerId, reviewed_at: new Date().toISOString() })
        .eq('id', postId)
      if (updErr) {
        console.warn('[useForumReview] erro ao avaliar:', updErr)
        setError(updErr.message || 'Erro ao registrar a avaliação.')
        return false
      }
      return true
    } catch (e: any) {
      console.error('[useForumReview] run:', e)
      setError(e?.message || 'Erro inesperado na avaliação.')
      return false
    } finally {
      setReviewing(false)
    }
  }

  const approve = (postId: string) => run(postId, { status: 'active' })
  const reject = (postId: string, notes: string) =>
    run(postId, { status: 'rejected', review_notes: notes.trim() || null })

  return { reviewing, error, approve, reject }
}
