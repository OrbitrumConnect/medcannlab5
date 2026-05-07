/**
 * V1.9.186-B — useTeamPresence: Realtime presence channel pro Command Center.
 *
 * Usa Supabase Realtime Presence (track / sync). Cada tab autenticada
 * faz track({user_id, online_at}). Subscribers recebem o estado atual.
 *
 * Diferença vs last_seen_at:
 * - last_seen_at = throttled 5min (passado/recente)
 * - presence    = real-time AGORA (online enquanto tab aberta)
 *
 * Combinados: card mostra "Online" se está em presence; senão fallback pra
 * "ativo há X min" via last_seen_at.
 */
import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'

const CHANNEL = 'team-presence-v1'

export interface PresenceMember {
  user_id: string
  online_at: string  // ISO timestamp
}

export function useTeamPresence(): {
  onlineUserIds: Set<string>
  isOnline: (userId: string) => boolean
} {
  const { user } = useAuth()
  const [onlineUserIds, setOnlineUserIds] = useState<Set<string>>(new Set())

  useEffect(() => {
    if (!user?.id) return

    const channel = supabase.channel(CHANNEL, {
      config: { presence: { key: user.id } }
    })

    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState() as Record<string, PresenceMember[]>
        const ids = new Set<string>()
        Object.keys(state).forEach((key) => {
          // key é o user.id que fez track
          ids.add(key)
        })
        setOnlineUserIds(ids)
      })
      .on('presence', { event: 'join' }, ({ key }) => {
        setOnlineUserIds((prev) => {
          const next = new Set(prev)
          next.add(key)
          return next
        })
      })
      .on('presence', { event: 'leave' }, ({ key }) => {
        setOnlineUserIds((prev) => {
          const next = new Set(prev)
          next.delete(key)
          return next
        })
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await channel.track({
            user_id: user.id,
            online_at: new Date().toISOString()
          })
        }
      })

    return () => {
      void channel.unsubscribe()
    }
  }, [user?.id])

  return {
    onlineUserIds,
    isOnline: (userId: string) => onlineUserIds.has(userId)
  }
}
