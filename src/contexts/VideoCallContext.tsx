import React, { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react'
import { videoCallRequestService, VideoCallRequest, CreateVideoCallRequestParams } from '../services/videoCallRequestService'
import { useAuth } from '../contexts/AuthContext'

interface VideoCallContextType {
  pendingRequests: VideoCallRequest[]
  isLoading: boolean
  createRequest: (params: CreateVideoCallRequestParams) => Promise<VideoCallRequest | null>
  acceptRequest: (requestId: string) => Promise<VideoCallRequest | null>
  rejectRequest: (requestId: string) => Promise<VideoCallRequest | null>
  cancelRequest: (requestId: string) => Promise<VideoCallRequest | null>
  refreshRequests: () => Promise<void>
}

const VideoCallContext = createContext<VideoCallContextType | undefined>(undefined)

export const VideoCallProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user } = useAuth()
  const [pendingRequests, setPendingRequests] = useState<VideoCallRequest[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Carregar solicitações pendentes
  const loadPendingRequests = useCallback(async () => {
    if (!user?.id) {
      setPendingRequests([])
      setIsLoading(false)
      return
    }

    // Usar setIsLoading(true) apenas no carregamento inicial para evitar flickering
    try {
      const requests = await videoCallRequestService.getPendingRequests()
      setPendingRequests(requests)
    } catch (error) {
      console.error('[VideoCallContext] Erro ao carregar solicitações pendentes:', error)
    } finally {
      setIsLoading(false)
    }
  }, [user?.id])

  // Criar solicitação
  const createRequest = useCallback(async (params: CreateVideoCallRequestParams): Promise<VideoCallRequest | null> => {
    try {
      const request = await videoCallRequestService.createRequest(params)
      if (request) {
        await loadPendingRequests()
      }
      return request
    } catch (error) {
      console.error('[VideoCallContext] Erro ao criar solicitação:', error)
      return null
    }
  }, [loadPendingRequests])

  // Aceitar solicitação
  const acceptRequest = useCallback(async (requestId: string): Promise<VideoCallRequest | null> => {
    try {
      const request = await videoCallRequestService.acceptRequest(requestId)
      if (request) {
        setPendingRequests(prev => prev.filter(r => r.request_id !== requestId))
      }
      return request
    } catch (error) {
      console.error('[VideoCallContext] Erro ao aceitar solicitação:', error)
      return null
    }
  }, [])

  // Recusar solicitação
  const rejectRequest = useCallback(async (requestId: string): Promise<VideoCallRequest | null> => {
    try {
      const request = await videoCallRequestService.rejectRequest(requestId)
      if (request) {
        setPendingRequests(prev => prev.filter(r => r.request_id !== requestId))
      }
      return request
    } catch (error) {
      console.error('[VideoCallContext] Erro ao recusar solicitação:', error)
      return null
    }
  }, [])

  // Cancelar solicitação
  const cancelRequest = useCallback(async (requestId: string): Promise<VideoCallRequest | null> => {
    try {
      const request = await videoCallRequestService.cancelRequest(requestId)
      if (request) {
        setPendingRequests(prev => prev.filter(r => r.request_id !== requestId))
        await loadPendingRequests()
      }
      return request
    } catch (error) {
      console.error('[VideoCallContext] Erro ao cancelar solicitação:', error)
      setPendingRequests(prev => prev.filter(r => r.request_id !== requestId))
      return null
    }
  }, [loadPendingRequests])

  // Carregar solicitações ao montar ou mudar usuário
  useEffect(() => {
    if (user?.id) {
       setIsLoading(true)
       loadPendingRequests()
    } else {
       setPendingRequests([])
       setIsLoading(false)
    }
  }, [user?.id, loadPendingRequests])

  // ÚNICA inscrição Realtime para todo o aplicativo
  useEffect(() => {
    if (!user?.id) return

    console.log('[VideoCallContext] Iniciando inscrição Realtime global para:', user.id)
    const unsubscribe = videoCallRequestService.subscribeToRequests(user.id, (request) => {
      console.log('[VideoCallContext] Evento Realtime recebido:', request.status, request.request_id)
      
      if (request.status === 'pending' && request.recipient_id === user.id) {
        setPendingRequests(prev => {
          if (prev.some(r => r.request_id === request.request_id)) return prev
          return [request, ...prev]
        })
      } else if (['accepted', 'rejected', 'expired', 'cancelled'].includes(request.status)) {
        // Se a chamada foi aceita por nós ou pelo outro lado, o hook useVideoCallRequests (no Layout) 
        // ou o listener do Layout reagirá se necessário.
        // Aqui apenas limpamos a lista de pendentes.
        setPendingRequests(prev => prev.filter(r => r.request_id !== request.request_id))
        
        // Disparar evento customizado avisando que uma solicitação mudou de estado
        // Isso permite que componentes específicos (como o Layout) reajam ao aceite globalmente
        window.dispatchEvent(new CustomEvent('videoCallRequestUpdated', { detail: request }))
      }
    })

    return () => {
      console.log('[VideoCallContext] Desinscrevendo Realtime global')
      unsubscribe()
    }
  }, [user?.id])

  // ÚNICO timer de manutenção de expiração
  useEffect(() => {
    if (!user?.id) return

    const interval = setInterval(() => {
      // Tentar expirar solicitações no banco apenas uma vez globalmente
      videoCallRequestService.expireOldRequests()
      // Sincronizar estado local
      loadPendingRequests()
    }, 45000) // 45 segundos é suficiente para manutenção preventiva

    return () => clearInterval(interval)
  }, [user?.id, loadPendingRequests])

  return (
    <VideoCallContext.Provider value={{
      pendingRequests,
      isLoading,
      createRequest,
      acceptRequest,
      rejectRequest,
      cancelRequest,
      refreshRequests: loadPendingRequests
    }}>
      {children}
    </VideoCallContext.Provider>
  )
}

export const useVideoCall = () => {
  const context = useContext(VideoCallContext)
  if (context === undefined) {
    throw new Error('useVideoCall must be used within a VideoCallProvider')
  }
  return context
}
