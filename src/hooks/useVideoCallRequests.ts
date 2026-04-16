import { useEffect, useCallback } from 'react'
import { VideoCallRequest, CreateVideoCallRequestParams } from '../services/videoCallRequestService'
import { useAuth } from '../contexts/AuthContext'
import { useVideoCall } from '../contexts/VideoCallContext'

export interface UseVideoCallRequestsOptions {
  /** Chamado quando uma solicitação que nós criamos é aceita. */
  onRequestAccepted?: (request: VideoCallRequest) => void
}

interface UseVideoCallRequestsReturn {
  pendingRequests: VideoCallRequest[]
  isLoading: boolean
  createRequest: (params: CreateVideoCallRequestParams) => Promise<VideoCallRequest | null>
  acceptRequest: (requestId: string) => Promise<VideoCallRequest | null>
  rejectRequest: (requestId: string) => Promise<VideoCallRequest | null>
  cancelRequest: (requestId: string) => Promise<VideoCallRequest | null>
  refreshRequests?: () => Promise<void>
}

/**
 * Hook de compatibilidade que consome o VideoCallContext global.
 * Isso evita a duplicação de timers e conexões Realtime em cada componente.
 */
export const useVideoCallRequests = (options?: UseVideoCallRequestsOptions): UseVideoCallRequestsReturn => {
  const { onRequestAccepted } = options ?? {}
  const { user } = useAuth()
  const { 
    pendingRequests, 
    isLoading, 
    createRequest, 
    acceptRequest, 
    rejectRequest, 
    cancelRequest,
    refreshRequests
  } = useVideoCall()

  // Listener para quando uma chamada é aceita globalmente (importante para o Caller abrir a janela)
  useEffect(() => {
    if (!onRequestAccepted || !user?.id) return

    const handleUpdate = (event: Event) => {
      const custom = event as CustomEvent<VideoCallRequest>
      const request = custom.detail
      
      // Se a solicitação que mudou foi ACEITA e fomos NÓS (caller) que a criamos
      if (request.status === 'accepted' && request.requester_id === user.id) {
        console.log('[useVideoCallRequests] Call accepted event received:', request.request_id)
        onRequestAccepted(request)
      }
    }

    window.addEventListener('videoCallRequestUpdated', handleUpdate as EventListener)
    return () => window.removeEventListener('videoCallRequestUpdated', handleUpdate as EventListener)
  }, [onRequestAccepted, user?.id])

  return {
    pendingRequests,
    isLoading,
    createRequest,
    acceptRequest,
    rejectRequest,
    cancelRequest,
    refreshRequests
  }
}
