// =====================================================
// COMPONENTE: CENTRO DE NOTIFICAÇÕES
// =====================================================
// Componente para exibir e gerenciar notificações

import React, { useState, useEffect, useCallback, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Bell, X, Check, CheckCheck, AlertCircle, Info, CheckCircle, AlertTriangle, FileText, Calendar, MessageSquare, Stethoscope, Video, FlaskConical } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { notificationService, Notification, NotificationType } from '../services/notificationService'

interface NotificationCenterProps {
  className?: string
}

// V1.9.232 — Fallback rotas por tipo de notificação.
// Aplica quando action_url não foi populado em metadata.action_url (94% dos casos
// historicos: 109 video_call_request + 43 report_shared + 6 new_clinical_report
// criados sem action_url). Mantem card clicavel sem depender de migration retroativa.
// Recebe userType pra escolher rota correta (paciente vs profissional vs admin).
function resolveFallbackRoute(notif: Notification, userType: string | undefined): string | null {
  const t = (notif.type || '').toLowerCase()
  const isPro = userType === 'profissional' || userType === 'professional' || userType === 'admin'

  // Tipos clinicos
  if (t === 'video_call_request' || t === 'video_call_scheduled' || t === 'video_call_reminder' || t === 'appointment') {
    return isPro ? '/app/clinica/profissional/agendamentos' : '/app/clinica/paciente/agendamentos'
  }
  if (t === 'report' || t === 'new_clinical_report' || t === 'report_shared') {
    return isPro ? '/app/clinica/profissional/relatorios' : '/app/clinica/paciente/dashboard?section=analytics'
  }
  if (t === 'prescription') {
    return isPro ? '/app/clinica/profissional/dashboard?section=prescriptions' : '/app/clinica/paciente/dashboard?section=meus-agendamentos'
  }
  if (t === 'exam_request') {
    return isPro ? '/app/clinica/profissional/dashboard?section=terminal-clinico&tab=prescriptions' : '/app/clinica/paciente/dashboard?section=analytics'
  }
  if (t === 'message') {
    return isPro ? '/app/clinica/profissional/chat-profissionais' : '/app/clinica/paciente/chat-profissional'
  }
  if (t === 'clinical' || t === 'clinical_devolution') {
    return isPro ? '/app/clinica/profissional/dashboard' : '/app/clinica/paciente/dashboard?section=analytics'
  }
  // appointment_completed (trigger SQL) + variantes "Avalie sua consulta" — paciente vai pro dashboard
  if (t === 'appointment_completed' || /avalie|avaliar|conclu/i.test(notif.title || '') || /avalie|avaliar|conclu/i.test(notif.message || '')) {
    return isPro ? '/app/clinica/profissional/dashboard' : '/app/clinica/paciente/dashboard?section=analytics'
  }
  // info / warning / success / error genericos — sem rota especifica
  return null
}

// V1.9.165 — beep curto via Web Audio API (zero dependência externa).
// 2 tons agradáveis (880Hz → 660Hz, ~0.18s total). Try/catch graceful;
// browsers podem bloquear sem user gesture inicial — falha silenciosamente.
function playNotificationSound() {
  try {
    const Ctx = (window as any).AudioContext || (window as any).webkitAudioContext
    if (!Ctx) return
    const ctx = new Ctx()
    const now = ctx.currentTime
    const tones: Array<{ freq: number; start: number; dur: number }> = [
      { freq: 880, start: 0,    dur: 0.09 },
      { freq: 660, start: 0.09, dur: 0.09 },
    ]
    for (const t of tones) {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = 'sine'
      osc.frequency.value = t.freq
      gain.gain.setValueAtTime(0.0001, now + t.start)
      gain.gain.exponentialRampToValueAtTime(0.18, now + t.start + 0.01)
      gain.gain.exponentialRampToValueAtTime(0.0001, now + t.start + t.dur)
      osc.connect(gain).connect(ctx.destination)
      osc.start(now + t.start)
      osc.stop(now + t.start + t.dur + 0.02)
    }
    setTimeout(() => { try { ctx.close() } catch {} }, 600)
  } catch {
    // Audio bloqueado pelo browser ou contexto não disponível — sem som, sem erro.
  }
}

const getNotificationIcon = (type: NotificationType) => {
  switch (type) {
    case 'success':
      return <CheckCircle className="w-5 h-5 text-green-500" />
    case 'warning':
      return <AlertTriangle className="w-5 h-5 text-yellow-500" />
    case 'error':
      return <AlertCircle className="w-5 h-5 text-red-500" />
    case 'clinical':
      return <Stethoscope className="w-5 h-5 text-blue-500" />
    case 'prescription':
      return <FileText className="w-5 h-5 text-purple-500" />
    case 'report':
      return <FileText className="w-5 h-5 text-indigo-500" />
    case 'appointment':
      return <Calendar className="w-5 h-5 text-cyan-500" />
    case 'message':
      return <MessageSquare className="w-5 h-5 text-pink-500" />
    case 'video_call_scheduled':
      return <Video className="w-5 h-5 text-blue-500" />
    case 'exam_request':
      return <FlaskConical className="w-5 h-5 text-cyan-500" />
    default:
      return <Info className="w-5 h-5 text-blue-500" />
  }
}

const getNotificationColor = (type: NotificationType) => {
  switch (type) {
    case 'success':
      return 'bg-green-500/10 border-green-500/20'
    case 'warning':
      return 'bg-yellow-500/10 border-yellow-500/20'
    case 'error':
      return 'bg-red-500/10 border-red-500/20'
    case 'clinical':
      return 'bg-blue-500/10 border-blue-500/20'
    case 'prescription':
      return 'bg-purple-500/10 border-purple-500/20'
    case 'report':
      return 'bg-indigo-500/10 border-indigo-500/20'
    case 'appointment':
      return 'bg-cyan-500/10 border-cyan-500/20'
    case 'message':
      return 'bg-pink-500/10 border-pink-500/20'
    case 'video_call_scheduled':
      return 'bg-blue-500/10 border-blue-500/20'
    case 'exam_request':
      return 'bg-cyan-500/10 border-cyan-500/20'
    default:
      return 'bg-slate-500/10 border-slate-500/20'
  }
}

const NotificationCenter: React.FC<NotificationCenterProps> = ({ className = '' }) => {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [isOpen, setIsOpen] = useState(false)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(false)
  // V1.9.165 — só toca som a partir da 2ª notificação recebida nesta sessão
  // (evita beep ao montar componente carregando histórico). Realtime INSERT
  // sempre toca após primeira interação.
  const hasMountedRef = useRef(false)

  // Carregar notificações
  const loadNotifications = useCallback(async () => {
    if (!user?.id) return

    setLoading(true)
    try {
      const [notifs, count] = await Promise.all([
        notificationService.getUserNotifications(user.id, { limit: 20 }),
        notificationService.getUnreadCount(user.id)
      ])
      setNotifications(notifs)
      setUnreadCount(count)
    } catch (error) {
      console.error('Erro ao carregar notificações:', error)
    } finally {
      setLoading(false)
    }
  }, [user?.id])

  // Carregar ao montar e quando usuário mudar
  useEffect(() => {
    loadNotifications()

    // Inscrever em notificações em tempo real
    if (user?.id) {
      const unsubscribe = notificationService.subscribeToNotifications(user.id, (newNotification) => {
        setNotifications(prev => [newNotification, ...prev])
        if (!newNotification.is_read) {
          setUnreadCount(prev => prev + 1)
        }
        // V1.9.165 — toca beep só pra notificações novas em runtime
        // (não ao montar componente carregando histórico via REST)
        if (hasMountedRef.current) {
          playNotificationSound()
        }
      })
      // Marca montado após próximo tick (evita beep no histórico inicial)
      const t = setTimeout(() => { hasMountedRef.current = true }, 1500)

      return () => {
        clearTimeout(t)
        unsubscribe()
      }
    }
  }, [user?.id, loadNotifications])

  // Marcar como lida
  const handleMarkAsRead = async (notificationId: string) => {
    await notificationService.markAsRead(notificationId)
    setNotifications(prev =>
      prev.map(n => n.id === notificationId ? { ...n, is_read: true } : n)
    )
    setUnreadCount(prev => Math.max(0, prev - 1))
  }

  // Marcar todas como lidas
  const handleMarkAllAsRead = async () => {
    if (!user?.id) return
    const count = await notificationService.markAllAsRead(user.id)
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })))
    setUnreadCount(0)
  }

  // V1.9.171 — auto-mark ao abrir o painel (700ms delay pra usuário ver
  // o destaque visual antes de zerar). Reduz acúmulo de unread (115 em 06/05).
  useEffect(() => {
    if (!isOpen || unreadCount === 0 || !user?.id) return
    const t = setTimeout(() => { handleMarkAllAsRead() }, 700)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen])

  // Deletar notificação
  const handleDelete = async (notificationId: string) => {
    await notificationService.deleteNotification(notificationId)
    setNotifications(prev => prev.filter(n => n.id !== notificationId))
  }

  // V1.9.232 — Click no card inteiro: marca lida + navega.
  // Prioridade: notification.action_url (vindo de metadata.action_url) → fallback per type.
  // Se rota resolvida == rota atual, só fecha o painel (sem navigate inutil).
  const handleCardClick = async (notification: Notification) => {
    const target = notification.action_url || resolveFallbackRoute(notification, user?.type)
    // Marca lida (otimista) e fecha painel SEM aguardar API
    if (!notification.is_read) {
      handleMarkAsRead(notification.id) // fire-and-forget
    }
    setIsOpen(false)
    if (!target) {
      // Tipo generico sem rota — só fecha o painel (UX previsivel)
      return
    }
    try {
      navigate(target)
    } catch (e) {
      // Defensivo: se rota invalida, nao quebrar UX
      console.warn('[NotificationCenter] Falha ao navegar:', target, e)
    }
  }

  // Formatar data relativa
  const formatRelativeTime = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(minutes / 60)
    const days = Math.floor(hours / 24)

    if (minutes < 1) return 'Agora'
    if (minutes < 60) return `${minutes}m atrás`
    if (hours < 24) return `${hours}h atrás`
    if (days < 7) return `${days}d atrás`
    return date.toLocaleDateString('pt-BR')
  }

  if (!user) return null

  return (
    <div className={`relative ${className}`}>
      {/* Botão do sino */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-1.5 sm:p-2 rounded-lg hover:bg-slate-800 transition-colors"
        aria-label="Notificações"
      >
        <Bell className="w-5 h-5 sm:w-6 sm:h-6 text-slate-300" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 sm:top-0 sm:right-0 w-4 h-4 sm:w-5 sm:h-5 bg-red-500 text-white text-[9px] sm:text-xs font-bold rounded-full flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Painel de notificações */}
      {isOpen && (
        <>
          {/* Overlay */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />

          {/* Painel */}
          <div className="fixed md:absolute right-2 md:right-0 top-14 md:top-12 w-[calc(100vw-1rem)] md:w-96 max-h-[70vh] md:max-h-[600px] bg-slate-900 border border-slate-700 rounded-xl shadow-2xl z-50 flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-slate-700">
              <div className="flex items-center gap-2">
                <Bell className="w-5 h-5 text-slate-300" />
                <h3 className="text-lg font-semibold text-white">Notificações</h3>
                {unreadCount > 0 && (
                  <span className="px-2 py-0.5 bg-red-500 text-white text-xs font-bold rounded-full">
                    {unreadCount}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                {unreadCount > 0 && (
                  <button
                    onClick={handleMarkAllAsRead}
                    className="p-1.5 rounded hover:bg-slate-800 transition-colors"
                    title="Marcar todas como lidas"
                  >
                    <CheckCheck className="w-4 h-4 text-slate-400" />
                  </button>
                )}
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1.5 rounded hover:bg-slate-800 transition-colors"
                >
                  <X className="w-4 h-4 text-slate-400" />
                </button>
              </div>
            </div>

            {/* Lista de notificações */}
            <div className="flex-1 overflow-y-auto">
              {loading ? (
                <div className="p-8 text-center text-slate-400">
                  Carregando notificações...
                </div>
              ) : notifications.length === 0 ? (
                <div className="p-8 text-center text-slate-400">
                  <Bell className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>Nenhuma notificação</p>
                </div>
              ) : (
                <div className="divide-y divide-slate-800">
                  {notifications.map((notification) => {
                    // V1.9.232 — pré-calcula destino pra dar feedback visual (cursor + hover)
                    // só quando há rota real. Tipos genéricos (info/success) ficam não-clicáveis.
                    const targetRoute = notification.action_url || resolveFallbackRoute(notification, user?.type)
                    const isClickable = !!targetRoute
                    return (
                      <div
                        key={notification.id}
                        onClick={isClickable ? () => handleCardClick(notification) : undefined}
                        className={`p-4 transition-colors ${!notification.is_read ? 'bg-slate-800/30' : ''} ${isClickable ? 'hover:bg-slate-800/50 cursor-pointer' : ''}`}
                        role={isClickable ? 'button' : undefined}
                        tabIndex={isClickable ? 0 : undefined}
                        onKeyDown={isClickable ? (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleCardClick(notification) } } : undefined}
                      >
                        <div className="flex items-start gap-3">
                          <div className="flex-shrink-0 mt-0.5">
                            {getNotificationIcon(notification.type)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex-1">
                                <h4 className={`text-sm font-semibold ${!notification.is_read ? 'text-white' : 'text-slate-300'}`}>
                                  {notification.title}
                                </h4>
                                <p className="text-xs text-slate-400 mt-1 line-clamp-2">
                                  {notification.message}
                                </p>
                                <p className="text-xs text-slate-500 mt-2">
                                  {formatRelativeTime(notification.created_at)}
                                </p>
                              </div>
                              {!notification.is_read && (
                                <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 mt-1" />
                              )}
                            </div>
                            {/* V1.9.232 — "Ver detalhes →" agora redundante (card todo clicável),
                                mantido pra users que esperam link explícito (a11y). */}
                            {isClickable && (
                              <span className="text-xs text-blue-400 mt-2 inline-block">
                                Ver detalhes →
                              </span>
                            )}
                          </div>
                          <div className="flex flex-col gap-1">
                            <button
                              onClick={(e) => { e.stopPropagation(); handleMarkAsRead(notification.id) }}
                              className="p-1 rounded hover:bg-slate-700 transition-colors"
                              title="Marcar como lida"
                            >
                              <Check className="w-4 h-4 text-slate-400" />
                            </button>
                            <button
                              onClick={(e) => { e.stopPropagation(); handleDelete(notification.id) }}
                              className="p-1 rounded hover:bg-slate-700 transition-colors"
                              title="Deletar"
                            >
                              <X className="w-4 h-4 text-slate-400" />
                            </button>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}

export default NotificationCenter

