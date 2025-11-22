import React, { useEffect, useMemo, useState } from 'react'
import { MessageCircle, Search, Send, Video, Phone, FileText, Wifi, WifiOff } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { ChatRoomSummary, useChatSystem } from '../hooks/useChatSystem'
import {
  surfaceStyle,
  secondarySurfaceStyle,
  cardStyle,
  accentGradient,
  colors
} from '../constants/designSystem'

interface ProfessionalChatSystemProps {
  className?: string
}

type RoomFilter = 'all' | 'professional' | 'student' | 'patient'

const formatDateTime = (isoDate?: string | null) => {
  if (!isoDate) return '—'
  const date = new Date(isoDate)
  return date.toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}

const formatTime = (isoDate: string) => {
  const date = new Date(isoDate)
  return date.toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit'
  })
}

const ProfessionalChatSystem: React.FC<ProfessionalChatSystemProps> = ({ className = '' }) => {
  const { user } = useAuth()
  const [activeRoomId, setActiveRoomId] = useState<string | null>(null)
  const [filter, setFilter] = useState<RoomFilter>('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [inputMessage, setInputMessage] = useState('')

  const {
    inbox,
    inboxLoading,
    messages,
    messagesLoading,
    isOnline,
    sendMessage,
    markRoomAsRead
  } = useChatSystem(activeRoomId ?? undefined)

  useEffect(() => {
    if (!activeRoomId && inbox.length > 0) {
      setActiveRoomId(inbox[0].id)
    }
  }, [activeRoomId, inbox])

  const filteredRooms = useMemo(() => {
    const byFilter = inbox.filter(room => filter === 'all' || room.type === filter)

    if (!searchTerm.trim()) {
      return byFilter
    }

    const term = searchTerm.toLowerCase()
    return byFilter.filter(room => (room.name ?? '').toLowerCase().includes(term))
  }, [filter, inbox, searchTerm])

  const activeRoom = activeRoomId
    ? inbox.find(room => room.id === activeRoomId) ?? null
    : null

  const handleSelectRoom = (room: ChatRoomSummary) => {
    setActiveRoomId(room.id)
    void markRoomAsRead(room.id)
  }

  const handleSendMessage = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!activeRoomId || !user?.id || !inputMessage.trim()) return

    await sendMessage(activeRoomId, user.id, inputMessage)
    setInputMessage('')
    await markRoomAsRead(activeRoomId)
  }

  return (
    <div className={`rounded-xl ${className}`} style={surfaceStyle}>
      <header className="p-4 md:p-6 border-b" style={{ borderColor: colors.border.primary }}>
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-3">
            <h2 className="text-xl md:text-2xl font-semibold text-white flex items-center gap-2">
              <MessageCircle className="w-6 h-6" style={{ color: colors.primary }} />
              Chat Profissionais
            </h2>
            <span
              className={`flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${
                isOnline 
                  ? 'bg-green-500/20 text-green-400 border border-green-500/30' 
                  : 'bg-orange-500/20 text-orange-400 border border-orange-500/30'
              }`}
            >
              {isOnline ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
              {isOnline ? 'Online' : 'Offline'}
            </span>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 ${
                filter === 'all'
                  ? 'text-white'
                  : 'text-slate-300 hover:text-white hover:bg-white/5'
              }`}
              style={filter === 'all' ? { background: accentGradient } : {}}
            >
              Todos
            </button>
            <button
              onClick={() => setFilter('professional')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 ${
                filter === 'professional'
                  ? 'text-white'
                  : 'text-slate-300 hover:text-white hover:bg-white/5'
              }`}
              style={filter === 'professional' ? { background: accentGradient } : {}}
            >
              Profissionais
            </button>
            <button
              onClick={() => setFilter('student')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 ${
                filter === 'student'
                  ? 'text-white'
                  : 'text-slate-300 hover:text-white hover:bg-white/5'
              }`}
              style={filter === 'student' ? { background: accentGradient } : {}}
            >
              Estudantes
            </button>
            <button
              onClick={() => setFilter('patient')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 ${
                filter === 'patient'
                  ? 'text-white'
                  : 'text-slate-300 hover:text-white hover:bg-white/5'
              }`}
              style={filter === 'patient' ? { background: accentGradient } : {}}
            >
              Pacientes
            </button>
          </div>
        </div>
      </header>

      <div className="flex flex-col md:flex-row h-[500px] md:h-[600px]">
        <aside className="w-full md:w-1/3 border-r flex flex-col" style={{ borderColor: colors.border.primary }}>
          <div className="p-4 border-b" style={{ borderColor: colors.border.primary }}>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: colors.text.tertiary }} />
              <input
                type="text"
                placeholder="Buscar salas..."
                value={searchTerm}
                onChange={event => setSearchTerm(event.target.value)}
                className="w-full pl-10 pr-4 py-2 rounded-lg text-white placeholder-slate-400 focus:outline-none transition-all duration-300"
                style={{
                  background: 'rgba(12, 31, 54, 0.78)',
                  border: `1px solid ${colors.border.secondary}`,
                  color: colors.text.primary
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = colors.primary
                  e.target.style.boxShadow = `0 0 0 3px ${colors.primary}20`
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = colors.border.secondary
                  e.target.style.boxShadow = 'none'
                }}
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            {inboxLoading && (
              <div className="p-4 text-sm text-slate-400">Carregando salas...</div>
            )}

            {!inboxLoading && filteredRooms.length === 0 && (
              <div className="p-4 text-sm text-slate-400">
                Nenhuma sala encontrada para o filtro atual.
              </div>
            )}

            {filteredRooms.map(room => {
              const isActive = room.id === activeRoomId

              return (
                <button
                  key={room.id}
                  onClick={() => handleSelectRoom(room)}
                  className="w-full text-left p-4 border-b transition-all duration-300"
                  style={{
                    borderColor: colors.border.primary,
                    background: isActive 
                      ? 'rgba(0, 193, 106, 0.15)' 
                      : 'transparent',
                    borderLeft: isActive ? `3px solid ${colors.primary}` : 'none'
                  }}
                  onMouseEnter={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.background = 'rgba(255, 255, 255, 0.03)'
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.background = 'transparent'
                    }
                  }}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold truncate text-white">{room.name ?? 'Sala sem nome'}</span>
                    {room.unreadCount > 0 && (
                      <span 
                        className="ml-2 inline-flex items-center justify-center rounded-full px-2 py-0.5 text-xs font-semibold text-white"
                        style={{ background: '#ef4444' }}
                      >
                        {room.unreadCount}
                      </span>
                    )}
                  </div>
                  <p className="text-xs mt-1" style={{ color: colors.text.tertiary }}>
                    Última atividade: {formatDateTime(room.lastMessageAt)}
                  </p>
                  <p className="text-[11px] uppercase tracking-wide mt-2" style={{ color: colors.text.muted }}>
                    {room.type ?? 'sem classificação'}
                  </p>
                </button>
              )
            })}
          </div>
        </aside>

        <section className="flex-1 flex flex-col">
          {activeRoom ? (
            <>
              <div className="p-4 md:p-6 border-b flex items-center justify-between" style={{ borderColor: colors.border.primary }}>
                <div>
                  <h3 className="text-lg md:text-xl font-semibold text-white">{activeRoom.name}</h3>
                  <p className="text-sm capitalize mt-1" style={{ color: colors.text.tertiary }}>
                    {activeRoom.type ?? 'sem classificação'}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button 
                    className="px-3 py-2 rounded-lg text-sm transition-all duration-300 text-white hover:scale-105"
                    style={{ background: accentGradient }}
                  >
                    <Video className="w-4 h-4" />
                  </button>
                  <button 
                    className="px-3 py-2 rounded-lg text-sm transition-all duration-300 text-white hover:scale-105"
                    style={{ background: accentGradient }}
                  >
                    <Phone className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messagesLoading && (
                  <div className="text-sm text-slate-400">Carregando mensagens...</div>
                )}

                {!messagesLoading && messages.length === 0 && (
                  <div className="text-sm text-slate-400">
                    Nenhuma mensagem registrada nesta sala. Inicie uma conversa.
                  </div>
                )}

                {messages.map(message => {
                  const isOwn = message.senderId === user?.id
                  return (
                    <div
                      key={message.id}
                      className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className="max-w-xs md:max-w-md rounded-xl px-4 py-3 text-sm"
                        style={{
                          background: isOwn 
                            ? accentGradient 
                            : 'rgba(12, 31, 54, 0.78)',
                          border: isOwn 
                            ? 'none' 
                            : `1px solid ${colors.border.secondary}`,
                          color: colors.text.primary,
                          boxShadow: isOwn 
                            ? '0 4px 12px rgba(0, 193, 106, 0.3)' 
                            : '0 2px 8px rgba(0, 0, 0, 0.2)'
                        }}
                      >
                        <div className="mb-1 flex items-center justify-between gap-3">
                          <span className="font-semibold text-xs">{message.senderName}</span>
                          <span className="text-[10px]" style={{ color: colors.text.muted }}>
                            {formatTime(message.createdAt)}
                          </span>
                        </div>
                        <p className="text-white">{message.message}</p>
                        {message.fileUrl && (
                          <a
                            href={message.fileUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="mt-2 inline-flex items-center gap-2 text-xs underline"
                            style={{ color: colors.primary }}
                          >
                            <FileText className="w-3 h-3" />
                            Abrir arquivo
                          </a>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>

              <footer className="p-4 md:p-6 border-t" style={{ borderColor: colors.border.primary }}>
                <form className="flex items-center gap-3" onSubmit={handleSendMessage}>
                  <input
                    type="text"
                    value={inputMessage}
                    onChange={event => setInputMessage(event.target.value)}
                    placeholder={
                      isOnline
                        ? 'Digite sua mensagem...'
                        : 'Modo offline – mensagens serão enviadas quando reconectar'
                    }
                    className="flex-1 px-4 py-3 rounded-lg text-white placeholder-slate-400 focus:outline-none transition-all duration-300"
                    style={{
                      background: 'rgba(12, 31, 54, 0.78)',
                      border: `1px solid ${colors.border.secondary}`,
                      color: colors.text.primary
                    }}
                    onFocus={(e) => {
                      e.target.style.borderColor = colors.primary
                      e.target.style.boxShadow = `0 0 0 3px ${colors.primary}20`
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = colors.border.secondary
                      e.target.style.boxShadow = 'none'
                    }}
                  />
                  <button
                    type="submit"
                    disabled={!inputMessage.trim() || !isOnline}
                    className="px-4 py-3 rounded-lg transition-all duration-300 flex items-center gap-2 text-white font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:scale-105"
                    style={!inputMessage.trim() || !isOnline ? {} : { background: accentGradient }}
                  >
                    <Send className="w-4 h-4" />
                    Enviar
                  </button>
                </form>
                <p className="mt-3 text-xs flex items-center gap-2" style={{ color: colors.text.tertiary }}>
                  {isOnline ? (
                    <>
                      <Wifi className="w-3 h-3" />
                      Conectado ao Supabase Realtime
                    </>
                  ) : (
                    <>
                      <WifiOff className="w-3 h-3" />
                      Offline – mensagens serão sincronizadas quando a conexão voltar
                    </>
                  )}
                </p>
              </footer>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center p-8">
              <div className="text-center space-y-3">
                <MessageCircle className="w-16 h-16 mx-auto" style={{ color: colors.text.muted }} />
                <h3 className="text-xl font-semibold text-white">Selecione uma sala</h3>
                <p className="text-sm" style={{ color: colors.text.tertiary }}>
                  Escolha uma sala de chat na coluna à esquerda para visualizar as mensagens.
                </p>
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  )
}

export default ProfessionalChatSystem