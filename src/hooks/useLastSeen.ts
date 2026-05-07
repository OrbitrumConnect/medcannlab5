/**
 * V1.9.186-B — useLastSeen: pinga users.last_seen_at com throttle 5min.
 *
 * Pra evitar poluir banco com UPDATEs a cada navegação, usa localStorage timestamp
 * como cache. Só atualiza no banco se passou > 5min do último ping.
 *
 * Uso: chamar em AppRouter (uma vez por sessão) ou em layout principal.
 */
import { useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'

const THROTTLE_MS = 5 * 60 * 1000  // 5 minutos
const STORAGE_KEY = 'medcannlab.lastSeenPing'

export function useLastSeen() {
  const { user } = useAuth()

  useEffect(() => {
    if (!user?.id) return

    const ping = async () => {
      try {
        const lastPing = parseInt(localStorage.getItem(STORAGE_KEY) || '0', 10)
        const now = Date.now()
        if (now - lastPing < THROTTLE_MS) return  // throttled

        // V1.9.186-A coluna nova; types do Supabase ainda não regenerados → cast
        const { error } = await (supabase as any)
          .from('users')
          .update({ last_seen_at: new Date().toISOString() })
          .eq('id', user.id)

        if (!error) {
          localStorage.setItem(STORAGE_KEY, String(now))
        }
      } catch {
        // silently fail — presença é nice-to-have, não crítico
      }
    }

    // Primeiro ping imediato (se passou throttle)
    void ping()

    // Pings periódicos enquanto tab ativa
    const interval = setInterval(() => {
      if (document.visibilityState === 'visible') void ping()
    }, THROTTLE_MS + 30_000)  // verifica a cada 5min30s

    // Ping quando tab volta a foco
    const onVisibility = () => {
      if (document.visibilityState === 'visible') void ping()
    }
    document.addEventListener('visibilitychange', onVisibility)

    return () => {
      clearInterval(interval)
      document.removeEventListener('visibilitychange', onVisibility)
    }
  }, [user?.id])
}
