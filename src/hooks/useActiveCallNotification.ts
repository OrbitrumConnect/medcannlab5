// V1.9.161 — Hook de notificação de chamada pendente (badge sidebar).
//
// Escuta video_call_requests onde:
//   - recipient_id = user.id (eu sou o destinatário)
//   - status = 'pending'
//   - expires_at > now()
//
// Retorna hasActiveCall + callType. Usado pra:
//   • Badge pulsante no sidebar item "Chat com Meu Médico" (paciente)
//     ou "Chat Clínico" / "Terminal de Atendimento" (médico)
//   • Reforça VideoCallRequestNotification (pop-up) que pode ser ignorado
//     se usuário estiver em outra página
//
// Pedro 06/05 ~14:25 BRT — gap empírico identificado:
//   "no sidebar Chat com Meu Médico aparece um notificacao ascende
//    algo consulta em curso?!"
//
// Reusa Realtime pg_changes que já está ativo no projeto.

import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'

export interface ActiveCallState {
  hasActiveCall: boolean
  callType: 'video' | 'audio' | null
}

export function useActiveCallNotification(): ActiveCallState {
  const { user } = useAuth()
  const [hasActiveCall, setHasActiveCall] = useState(false)
  const [callType, setCallType] = useState<'video' | 'audio' | null>(null)

  useEffect(() => {
    if (!user?.id) {
      setHasActiveCall(false)
      setCallType(null)
      return
    }

    let cancelled = false

    const checkPending = async () => {
      try {
        const { data, error } = await (supabase as any)
          .from('video_call_requests')
          .select('call_type, expires_at, status')
          .eq('recipient_id', user.id)
          .eq('status', 'pending')
          .gte('expires_at', new Date().toISOString())
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle()

        if (cancelled) return

        if (!error && data) {
          setHasActiveCall(true)
          setCallType((data.call_type as 'video' | 'audio') ?? null)
        } else {
          setHasActiveCall(false)
          setCallType(null)
        }
      } catch {
        // silencioso — fallback ao último estado
      }
    }

    checkPending()

    // Realtime: detecta novas chamadas chegando OU mudança de status
    const channel = supabase
      .channel(`active-call-${user.id}`)
      .on(
        'postgres_changes' as any,
        {
          event: '*',
          schema: 'public',
          table: 'video_call_requests',
          filter: `recipient_id=eq.${user.id}`
        },
        () => {
          checkPending()
        }
      )
      .subscribe()

    // Re-check a cada 30s pra catar expirações silenciosas
    const interval = setInterval(checkPending, 30000)

    return () => {
      cancelled = true
      supabase.removeChannel(channel)
      clearInterval(interval)
    }
  }, [user?.id])

  return { hasActiveCall, callType }
}
