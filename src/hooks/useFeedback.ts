/**
 * useFeedback — V1.9.486 (Pedro 28/05/2026)
 * Canal aberto de feedback (paciente / profissional / aluno / admin).
 *
 * Schema: public.feedback_tickets
 *  - RLS: usuário insere/vê próprios; admin vê/atualiza/deleta todos
 *  - Categorias: dúvida / sugestão / problema / elogio
 *  - Trigger urgente: dispara envio email via Edge send-email pra suporte
 *
 * Princípios:
 *  - polir-não-inventar (Princípio 8): reusa supabase client + Edge send-email
 *  - Anti-overclaim: feedback aberto (sem SLA contratual), escalação opcional
 *  - LGPD: payload sem PHI clínica (assunto + mensagem livre do usuário)
 */
import { useState, useCallback } from 'react'
import { supabase } from '../lib/supabase'

export type FeedbackCategory = 'duvida' | 'sugestao' | 'problema' | 'elogio'
export type FeedbackStatus = 'open' | 'in_progress' | 'resolved' | 'closed'

export interface FeedbackTicket {
  id: string
  user_id: string
  user_role: string
  category: FeedbackCategory
  subject: string
  message: string
  is_urgent: boolean
  status: FeedbackStatus
  admin_response: string | null
  admin_responder_id: string | null
  created_at: string
  updated_at: string
  resolved_at: string | null
}

export interface SubmitFeedbackInput {
  category: FeedbackCategory
  subject: string
  message: string
  is_urgent?: boolean
}

// V1.9.486 — email pra escalação urgente (Pedro 28/05: medcannlab.br@gmail.com).
// Reusa Edge send-email V1.9.99-B (Resend, RESEND_FROM_EMAIL=noreply@medcannlab.com.br).
const SUPPORT_EMAIL = 'medcannlab.br@gmail.com'

export function useFeedback() {
  const [submitting, setSubmitting] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  /**
   * Envia feedback. Se is_urgent=true, dispara email pra suporte em paralelo
   * (best-effort, não bloqueia retorno se Edge falhar).
   */
  const submitFeedback = useCallback(
    async (input: SubmitFeedbackInput, userRole: string): Promise<string | null> => {
      setSubmitting(true)
      setError(null)
      try {
        const { data: authData } = await supabase.auth.getUser()
        const userId = authData?.user?.id
        const userEmail = authData?.user?.email
        if (!userId) {
          setError('Sessão não detectada. Faça login novamente.')
          return null
        }

        const { data: row, error: insertErr } = await (supabase as any)
          .from('feedback_tickets')
          .insert({
            user_id: userId,
            user_role: userRole || 'unknown',
            category: input.category,
            subject: input.subject.trim().slice(0, 200),
            message: input.message.trim().slice(0, 4000),
            is_urgent: input.is_urgent ?? false,
          })
          .select('id')
          .single()

        if (insertErr) {
          console.warn('[useFeedback] erro insert:', insertErr)
          setError(insertErr.message || 'Erro ao enviar feedback.')
          return null
        }

        // V1.9.486 — escalação urgente via Edge send-email (best-effort).
        // Falha de email NÃO bloqueia retorno (feedback ja foi salvo no banco).
        if (input.is_urgent) {
          try {
            const html = buildUrgentEmailHtml({
              ticketId: row?.id,
              userEmail: userEmail || 'desconhecido',
              userRole: userRole || 'unknown',
              category: input.category,
              subject: input.subject,
              message: input.message,
            })
            await supabase.functions.invoke('send-email', {
              body: {
                to: SUPPORT_EMAIL,
                subject: `[URGENTE · MedCannLab] ${input.subject.slice(0, 120)}`,
                html,
              },
            })
          } catch (emailErr) {
            // fail-open: feedback persiste mesmo se email falhar
            console.warn('[useFeedback] email urgente falhou (ticket persistido):', emailErr)
          }
        }

        return row?.id || null
      } catch (e: any) {
        console.error('[useFeedback] submitFeedback:', e)
        setError(e?.message || 'Erro inesperado ao enviar.')
        return null
      } finally {
        setSubmitting(false)
      }
    },
    [],
  )

  /**
   * Lista feedbacks. RLS filtra: usuário comum vê próprios; admin vê todos.
   * Ordem: urgentes primeiro, depois mais recentes.
   */
  const listFeedbacks = useCallback(async (limit = 50): Promise<FeedbackTicket[]> => {
    setLoading(true)
    setError(null)
    try {
      const { data, error: listErr } = await (supabase as any)
        .from('feedback_tickets')
        .select('*')
        .order('is_urgent', { ascending: false })
        .order('created_at', { ascending: false })
        .limit(limit)
      if (listErr) {
        console.warn('[useFeedback] erro list:', listErr)
        setError(listErr.message || 'Erro ao carregar feedbacks.')
        return []
      }
      return (data || []) as FeedbackTicket[]
    } catch (e: any) {
      console.error('[useFeedback] listFeedbacks:', e)
      setError(e?.message || 'Erro inesperado.')
      return []
    } finally {
      setLoading(false)
    }
  }, [])

  /**
   * Atualiza status + admin_response (só admin pelo RLS).
   */
  const respondFeedback = useCallback(
    async (id: string, status: FeedbackStatus, adminResponse?: string): Promise<boolean> => {
      setError(null)
      try {
        const { data: authData } = await supabase.auth.getUser()
        const adminId = authData?.user?.id
        const patch: Record<string, any> = {
          status,
          updated_at: new Date().toISOString(),
        }
        if (adminResponse !== undefined) patch.admin_response = adminResponse
        if (adminId) patch.admin_responder_id = adminId
        if (status === 'resolved' || status === 'closed') {
          patch.resolved_at = new Date().toISOString()
        }
        const { error: updErr } = await (supabase as any)
          .from('feedback_tickets')
          .update(patch)
          .eq('id', id)
        if (updErr) {
          console.warn('[useFeedback] erro update:', updErr)
          setError(updErr.message || 'Erro ao responder.')
          return false
        }
        return true
      } catch (e: any) {
        console.error('[useFeedback] respondFeedback:', e)
        setError(e?.message || 'Erro inesperado.')
        return false
      }
    },
    [],
  )

  /**
   * Conta tickets abertos (para badge do sidebar admin).
   */
  const countOpenFeedbacks = useCallback(async (): Promise<number> => {
    try {
      const { count, error: countErr } = await (supabase as any)
        .from('feedback_tickets')
        .select('*', { count: 'exact', head: true })
        .in('status', ['open', 'in_progress'])
      if (countErr) {
        console.warn('[useFeedback] erro count:', countErr)
        return 0
      }
      return count || 0
    } catch (e: any) {
      console.warn('[useFeedback] countOpenFeedbacks:', e)
      return 0
    }
  }, [])

  return {
    submitting,
    loading,
    error,
    submitFeedback,
    listFeedbacks,
    respondFeedback,
    countOpenFeedbacks,
  }
}

// V1.9.486 — template HTML do email urgente (compacto, sem CSS externo)
function buildUrgentEmailHtml(params: {
  ticketId?: string
  userEmail: string
  userRole: string
  category: string
  subject: string
  message: string
}): string {
  const categoryLabel: Record<string, string> = {
    duvida: 'Dúvida',
    sugestao: 'Sugestão',
    problema: 'Problema',
    elogio: 'Elogio',
  }
  const cat = categoryLabel[params.category] || params.category
  // Escape básico (não esperamos HTML no input, mas defensivo)
  const esc = (s: string) =>
    String(s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/\n/g, '<br/>')
  return `
<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; background: #f8fafc;">
  <div style="background: white; border-left: 4px solid #dc2626; padding: 20px; border-radius: 8px;">
    <h2 style="margin: 0 0 8px; color: #dc2626; font-size: 16px;">🚨 Feedback URGENTE — MedCannLab</h2>
    <p style="color: #64748b; font-size: 12px; margin: 0 0 16px;">SLA esperado: 1-2 horas</p>
    <table style="width: 100%; border-collapse: collapse; font-size: 14px; color: #1e293b;">
      <tr><td style="padding: 4px 0; color: #64748b;">Ticket:</td><td>${esc(params.ticketId || 'n/d')}</td></tr>
      <tr><td style="padding: 4px 0; color: #64748b;">Usuário:</td><td>${esc(params.userEmail)} (${esc(params.userRole)})</td></tr>
      <tr><td style="padding: 4px 0; color: #64748b;">Categoria:</td><td>${esc(cat)}</td></tr>
      <tr><td style="padding: 4px 0; color: #64748b;">Assunto:</td><td><strong>${esc(params.subject)}</strong></td></tr>
    </table>
    <div style="margin-top: 16px; padding: 12px; background: #f1f5f9; border-radius: 6px;">
      <p style="margin: 0 0 4px; color: #64748b; font-size: 12px;">Mensagem:</p>
      <p style="margin: 0; color: #1e293b; line-height: 1.5;">${esc(params.message)}</p>
    </div>
    <p style="margin-top: 16px; font-size: 11px; color: #94a3b8;">
      Responder direto no painel Admin → Feedbacks. Este email é apenas notificação.
    </p>
  </div>
</div>
`.trim()
}
