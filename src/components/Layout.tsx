import React, { useEffect, useState, useCallback } from 'react'
import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import ProtectedRoute from './ProtectedRoute'
import Header from './Header'
import Sidebar from './Sidebar'
import NoaConversationalInterface from './NoaConversationalInterface'
import Breadcrumbs from './Breadcrumbs'
import ConsentGuard from './ConsentGuard'
import OnboardingTutorial from './OnboardingTutorial'
import NavegacaoIndividualizada from './NavegacaoIndividualizada'
import MobileResponsiveWrapper from './MobileResponsiveWrapper'
import { normalizeUserType } from '../lib/userTypes'
import { useUserView } from '../contexts/UserViewContext'
import { useNoaPlatform } from '../contexts/NoaPlatformContext'
import { DashboardTriggersProvider } from '../contexts/DashboardTriggersContext'
import { backgroundGradient, colors } from '../constants/designSystem'
import { useVideoCallRequests } from '../hooks/useVideoCallRequests'
import VideoCallRequestNotification from './VideoCallRequestNotification'
import VideoCall from './VideoCall'

type NoaCommandDetail = {
  type: string
  target: string
  label?: string
  fallbackRoute?: string
  payload?: Record<string, any>
  rawMessage?: string
  source?: 'voice' | 'text'
  timestamp?: string
}

const Layout: React.FC = () => {
  const { user, isLoading } = useAuth()
  const { getEffectiveUserType, viewAsType } = useUserView()
  const { isGlobalChatHidden } = useNoaPlatform()
  const [isMobile, setIsMobile] = useState(false)
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)
  const [globalVideoCallRoom, setGlobalVideoCallRoom] = useState<string | null>(null)
  
  // State for global video call
  const [isGlobalVideoCallOpen, setIsGlobalVideoCallOpen] = useState(false)
  const [globalCallConfig, setGlobalCallConfig] = useState<{
    signalingRoomId?: string
    isInitiator?: boolean
    callType?: 'video' | 'audio'
    patientId?: string
    appointmentId?: string
  }>({})
  const location = useLocation()
  const navigate = useNavigate()

  // Global video call request listener — works on ALL pages
  const {
    pendingRequests: globalPendingRequests,
    acceptRequest: globalAcceptRequest,
    rejectRequest: globalRejectRequest
  } = useVideoCallRequests({
    onRequestAccepted: (request) => {
      console.log('[Layout] Call accepted by remote party:', request.request_id)
      
      // Abrir a chamada GLOBALMENTE para o CALLER (requester)
      setGlobalCallConfig({
        signalingRoomId: request.request_id,
        isInitiator: true,
        callType: request.call_type || 'video',
        patientId: (request.metadata as any)?.patientId,
        appointmentId: (request.metadata as any)?.appointmentId || (request.metadata as any)?.roomId
      })
      setIsGlobalVideoCallOpen(true)

      // Navegar para o chat correspondente
      const effectiveType = user ? getEffectiveUserType(user.type) : null
      if (effectiveType === 'admin') {
        navigate('/app/admin-chat')
      } else if (effectiveType === 'profissional' || effectiveType === ('professional' as any)) {
        navigate('/app/clinica/profissional/chat-profissionais')
      } else {
        navigate('/app/clinica/paciente/chat-profissional')
      }
    }
  })

  // Usar cores do designSystem
  const surfaceColor = colors.background.surface

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }

    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  useEffect(() => {
    if (typeof window === 'undefined') return
    requestAnimationFrame(() => {
      window.scrollTo({
        top: 0,
        left: 0,
        behavior: 'auto'
      })
    })
  }, [location.pathname, location.search])

  // Listener global (append-only): comandos da Nôa executados via allow-list no hook de conversa.
  // Objetivo: evitar o cenário "comando executado" mas sem listener na página atual.
  useEffect(() => {
    const handleNoaCommand = (event: Event) => {
      const custom = event as CustomEvent<NoaCommandDetail>
      const detail = custom.detail
      if (!detail) return

      // 1) Abrir documento (novo): levar à biblioteca e auto-abrir
      if (detail.type === 'open-document') {
        const documentId = (detail.payload?.document_id as string | undefined)?.trim()
        if (!documentId) return
        navigate('/app/library', { state: { openDocumentId: documentId } })
        return
      }

      // 2) Navegação direta por rota
      if (detail.type === 'navigate-route' && typeof detail.target === 'string' && detail.target.length > 0) {
        navigate(detail.target)
        return
      }

      // 3) Navegação por seção (fallback universal)
      // Se a página atual não tiver handler específico (ex.: Terminal Profissional), ao menos navegamos para a rota base
      // com `?section=` para que o dashboard resolva a seção correta.
      if (detail.type === 'navigate-section') {
        const fallback = typeof detail.fallbackRoute === 'string' ? detail.fallbackRoute : ''
        const section = typeof detail.target === 'string' ? detail.target : ''
        if (!fallback || !section) return

        const fallbackPath = fallback.split('?')[0]
        if (location.pathname === fallbackPath) {
          // Já estamos no dashboard base; o handler local (se existir) cuida de aplicar a seção.
          return
        }

        const sep = fallback.includes('?') ? '&' : '?'
        navigate(`${fallback}${sep}section=${encodeURIComponent(section)}`)
      }
    }

    window.addEventListener('noaCommand', handleNoaCommand as EventListener)
    return () => window.removeEventListener('noaCommand', handleNoaCommand as EventListener)
  }, [navigate, location.pathname])

  // Listener para abertura de vídeo global vindo de páginas específicas (AdminChat, etc)
  useEffect(() => {
    const handleOpenVideoCall = (event: Event) => {
      const custom = event as CustomEvent<{
        signalingRoomId: string
        isInitiator: boolean
        callType: 'video' | 'audio'
        patientId?: string
        appointmentId?: string
      }>
      const detail = custom.detail
      if (!detail) return

      console.log('[Layout] Opening video call from event:', detail.signalingRoomId)
      setGlobalCallConfig(detail)
      setIsGlobalVideoCallOpen(true)
    }

    window.addEventListener('openVideoCall', handleOpenVideoCall as EventListener)
    return () => window.removeEventListener('openVideoCall', handleOpenVideoCall as EventListener)
  }, [])

  useEffect(() => {
    if (!user) {
      localStorage.removeItem('platformData')
      return
    }

    // Admin: usar tipo efetivo ("ver como") para o Core respeitar paciente vs profissional (card no chat vs navegação)
    const effectiveType = getEffectiveUserType(user.type)
    const platformData = {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        user_type: effectiveType,
        type: effectiveType,
        real_type: user.type, // Tipo real (sem "ver como") para governança documental no Core
        crm: user.crm ?? null,
        cro: user.cro ?? null
      },
      dashboard: {
        activeSection: location.pathname,
        totalPatients: 0,
        recentReports: 0,
        pendingNotifications: 0,
        lastUpdate: new Date().toISOString()
      },
      totalPatients: 0,
      completedAssessments: 0,
      aecProtocols: 0,
      activeClinics: 0
    }

    localStorage.setItem('platformData', JSON.stringify(platformData))
      ; (window as any).getPlatformData = () => platformData
  }, [user, location.pathname, viewAsType, getEffectiveUserType])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900">
        <div className="text-center">
          <div className="loading-dots mb-4">
            <div></div>
            <div></div>
            <div></div>
            <div></div>
          </div>
          <p className="text-slate-400">Carregando...</p>
        </div>
      </div>
    )
  }

  // Normalizar tipo de usuário
  const effectiveType = user ? getEffectiveUserType(user.type) : null
  const normalizedUserType = effectiveType ? normalizeUserType(effectiveType) : null

  // Verificar se o email não foi confirmado
  if ((user?.type as string) === 'unconfirmed') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900">
        <div className="text-center max-w-md mx-auto p-8">
          <div className="w-16 h-16 bg-yellow-500 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-white mb-4">
            Confirme seu Email
          </h1>
          <p className="text-slate-300 mb-6">
            Enviamos um link de confirmação para <strong>{user?.email}</strong>
          </p>
          <p className="text-slate-400 text-sm mb-8">
            Verifique sua caixa de entrada e clique no link para ativar sua conta.
            Se não encontrar o email, verifique a pasta de spam.
          </p>
          <div className="space-y-4">
            <button
              onClick={() => window.location.href = '/'}
              className="w-full bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
            >
              Voltar ao Início
            </button>
            <button
              onClick={() => window.location.reload()}
              className="w-full bg-slate-700 hover:bg-slate-600 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
            >
              Já Confirmei - Atualizar
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Layout padrão - TODOS os tipos usam a mesma estrutura com Sidebar
  // PatientDashboard também usará o sidebar global igual aos outros dashboards

  // Usar sidebar global para todos os dashboards (incluindo paciente)
  const hasOwnSidebar = false

  // Layout padrão para outros tipos de usuário (com sidebar)
  return (
    <ProtectedRoute>
      <DashboardTriggersProvider>
      <MobileResponsiveWrapper>
        <div
          className="min-h-screen w-full overflow-x-hidden"
          style={{ background: backgroundGradient }}
        >
          {/* Sidebar - Não renderizar se a página já tem sidebar próprio */}
          {!hasOwnSidebar && (
            <Sidebar
              userType={viewAsType ?? user?.type}
              isMobile={isMobile}
              isOpen={isSidebarOpen}
              onClose={() => setIsSidebarOpen(false)}
              onCollapseChange={setIsSidebarCollapsed}
            />
          )}

          {/* Main Content */}
          <div
            className="flex flex-col min-h-screen transition-all duration-300"
            style={{
              marginLeft: hasOwnSidebar ? '0' : (isMobile ? '0' : isSidebarCollapsed ? '112px' : '256px'),
              width: hasOwnSidebar ? '100%' : (isMobile ? '100%' : `calc(100% - ${isSidebarCollapsed ? '112px' : '256px'})`),
              maxWidth: hasOwnSidebar ? '100%' : (isMobile ? '100%' : `calc(100% - ${isSidebarCollapsed ? '112px' : '256px'})`)
            }}
          >
            {/* Cabeçalho único: logo, triggers, cérebro e menu de usuário */}
            <Header onOpenSidebar={() => setIsSidebarOpen(true)} />
            {/* NavegacaoIndividualizada removida - botões dos eixos já estão na sidebar */}
            <main
              className="flex-1"
            >
              <Outlet />
            </main>
          </div>

          {/* Global Video Call Notifications — visível em QUALQUER página */}
          {globalPendingRequests.filter(r => r.status === 'pending').map(request => (
            <VideoCallRequestNotification
              key={request.id}
              request={request}
              onAccept={async (req) => {
                await globalAcceptRequest(req.request_id)
                
                // Abrir a chamada GLOBALMENTE para o CALLEE (quem aceitou)
                setGlobalCallConfig({
                  signalingRoomId: req.request_id,
                  isInitiator: false,
                  callType: req.call_type || 'video',
                  patientId: (req.metadata as any)?.patientId,
                  appointmentId: (req.metadata as any)?.appointmentId || (req.metadata as any)?.roomId
                })
                setIsGlobalVideoCallOpen(true)
                
                // Redirecionar para o chat correto
                const effectiveType = user ? getEffectiveUserType(user.type) : null
                if (effectiveType === 'admin') {
                  navigate('/app/admin-chat')
                } else if (effectiveType === 'profissional' || effectiveType === ('professional' as any)) {
                  navigate('/app/clinica/profissional/chat-profissionais')
                } else {
                  navigate('/app/clinica/paciente/chat-profissional')
                }
              }}
              onReject={async (req) => {
                await globalRejectRequest(req.request_id)
              }}
              onExpire={async (req) => {
                await globalRejectRequest(req.request_id)
              }}
            />
          ))}

          {/* Componente Global de Vídeo - Gerencia chamadas em qualquer página */}
          <VideoCall 
            isOpen={isGlobalVideoCallOpen}
            onClose={() => {
              setIsGlobalVideoCallOpen(false)
              setGlobalCallConfig({})
            }}
            signalingRoomId={globalCallConfig.signalingRoomId}
            isInitiator={globalCallConfig.isInitiator}
            isAudioOnly={globalCallConfig.callType === 'audio'}
            patientId={globalCallConfig.patientId}
            appointmentId={globalCallConfig.appointmentId}
          />

          {/* Interface Conversacional Nôa Esperança - Sempre renderizada para permitir gatilhos externos */}
          <NoaConversationalInterface
            userName={user?.name || 'Usuário'}
            userCode={user?.id || 'USER-001'}
            hideButton={isGlobalChatHidden}
          />

          {/* Consent Guard — overlay modal LGPD */}
          <ConsentGuard><></></ConsentGuard>

          {/* Tutorial Guiado — após consentimento e pagamento */}
          <OnboardingTutorial />
        </div>
      </MobileResponsiveWrapper>
      </DashboardTriggersProvider>
    </ProtectedRoute>
  )
}

export default Layout