import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { MessageCircle, Search, Send, Video, Phone, FileText, Activity, X, Plus, Loader2, Paperclip } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { ChatRoomSummary, useChatSystem } from '../hooks/useChatSystem'
import { useVideoCallRequests } from '../hooks/useVideoCallRequests'
import { videoCallRequestService } from '../services/videoCallRequestService'
import { useToast } from '../contexts/ToastContext'
import { supabase } from '../lib/supabase'
// VideoCall agora é global no Layout.tsx

interface ProfessionalChatSystemProps {
  className?: string
  interlocutor?: string
  selectedPatientId?: string | null
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

const ProfessionalChatSystem: React.FC<ProfessionalChatSystemProps> = ({ className = '', interlocutor, selectedPatientId }) => {
  const { user } = useAuth()
  const [activeRoomId, setActiveRoomId] = useState<string | null>(null)
  const [filter, setFilter] = useState<RoomFilter>('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [inputMessage, setInputMessage] = useState('')

  const [callType, setCallType] = useState<'video' | 'audio'>('video')
  const [pendingCallRequest, setPendingCallRequest] = useState<string | null>(null)
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null)

  // V1.9.99 — Upload de anexos (imagens + PDFs) prof↔paciente.
  // Polir não inventar: reusa bucket `chat-images` (aceita qualquer mime),
  // signed URL TTL 1 ano (igual padrão AdminChat após V1.9.98), RLS Opção B
  // já cobre (owner OR participante mesma chat_room).
  const [uploadingFile, setUploadingFile] = useState(false)
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const ALLOWED_MIMES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf']
  const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10 MB (limite do bucket chat-images)

  const toast = useToast()

  // O Layout.tsx já cuida de abrir a chamada via hook global.
  const {
    pendingRequests,
    createRequest,
    cancelRequest
  } = useVideoCallRequests({})

  // Polling removido: o Realtime no Layout cuida de abrir a chamada

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
    if (activeRoomId) return

    // Prioridade 1: ID do Paciente (vinda do Workstation)
    if (selectedPatientId && inbox.length > 0) {
      // Tenta encontrar sala onde o ID do paciente está nos participantes (metadata ou nome)
      // Como não temos participants exposto, vamos pelo NOME (que geralmente é o nome do paciente)
      // ou se o room.id for igual ao patientId (caso raro, mas possível em sistemas 1:1)

      // TODO: Melhorar useChatSystem para expor metadados de participantes
      // Por enquanto, tentamos matching flexível
      const targetRoom = inbox.find(room =>
        // Verifica se o ID do paciente é parte do ID da sala (convenção)
        room.id === selectedPatientId ||
        // Verifica se o nome da sala contem o ID (im improvável) ou Nome
        (room.name && selectedPatientId && room.name.includes(selectedPatientId)) // Isso é frágil se selectedPatientId for UUID
      )

      // Estratégia de Fallback: Se selectedPatientId for um NOME (prop passada errada), tenta pelo nome
      // Se selectedPatientId for UUID, precisamos de uma query mais robusta no futuro.

      if (targetRoom) {
        setActiveRoomId(targetRoom.id)
        return
      }
    }

    // Prioridade 2: Interlocutor (Nome)
    if (interlocutor && inbox.length > 0) {
      // Tentar encontrar sala com o interlocutor
      const targetRoom = inbox.find(room =>
        room.name?.toLowerCase().includes(interlocutor.toLowerCase())
      )
      if (targetRoom) {
        setActiveRoomId(targetRoom.id)
      } else if (inbox.length > 0) {
        // Fallback: primeira sala
        setActiveRoomId(inbox[0].id)
      }
    } else if (!activeRoomId && inbox.length > 0) {
      setActiveRoomId(inbox[0].id)
    }
  }, [activeRoomId, inbox, interlocutor, selectedPatientId])

  const filteredRooms = useMemo(() => {
    const byFilter = inbox.filter(room => {
      if (filter === 'all') return true
      if (filter === 'professional') return room.type === 'professional' || room.type === 'direct' || room.type === 'admin'
      return room.type === filter
    })

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

  // V1.9.99 — Upload arquivo (imagem ou PDF) e enviar como mensagem
  const uploadAttachment = useCallback(async (file: File): Promise<{ url: string; type: 'image' | 'file' } | null> => {
    if (!user?.id) return null
    const ext = file.name.split('.').pop() || 'bin'
    const path = `${user.id}/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`
    const { error: uploadError } = await supabase.storage
      .from('chat-images')
      .upload(path, file, { contentType: file.type })
    if (uploadError) {
      console.error('Upload error:', uploadError)
      return null
    }
    const { data: urlData, error: signedErr } = await supabase.storage
      .from('chat-images')
      .createSignedUrl(path, 60 * 60 * 24 * 365) // 1 ano
    if (signedErr || !urlData?.signedUrl) {
      console.error('Signed URL error:', signedErr)
      return null
    }
    return {
      url: urlData.signedUrl,
      type: file.type.startsWith('image/') ? 'image' : 'file'
    }
  }, [user])

  const handleFileUpload = useCallback(async (file: File) => {
    if (!activeRoomId || !user?.id) return
    if (!ALLOWED_MIMES.includes(file.type)) {
      toast.error('Erro', 'Tipo de arquivo não suportado. Use imagens (jpg/png/gif/webp) ou PDF.')
      return
    }
    if (file.size > MAX_FILE_SIZE) {
      toast.error('Erro', 'Arquivo muito grande (máx 10 MB).')
      return
    }
    setUploadingFile(true)
    try {
      const result = await uploadAttachment(file)
      if (result) {
        const label = result.type === 'image' ? '📷 Imagem' : `📎 ${file.name}`
        await sendMessage(activeRoomId, user.id, label, result.type, result.url)
        await markRoomAsRead(activeRoomId)
        toast.success('Anexo enviado!', '')
      } else {
        toast.error('Erro', 'Não foi possível enviar o anexo.')
      }
    } catch (err) {
      console.error('handleFileUpload error:', err)
      toast.error('Erro', 'Falha ao enviar anexo.')
    } finally {
      setUploadingFile(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }, [activeRoomId, user, uploadAttachment, sendMessage, markRoomAsRead, toast])

  const handleFileInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) void handleFileUpload(file)
  }

  const handlePasteAttachment = (event: React.ClipboardEvent) => {
    const items = event.clipboardData?.items
    if (!items) return
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.startsWith('image/') || items[i].type === 'application/pdf') {
        const file = items[i].getAsFile()
        if (file) {
          event.preventDefault()
          void handleFileUpload(file)
          return
        }
      }
    }
  }

  // Iniciar solicitação de videochamada
  const handleStartCall = async (type: 'video' | 'audio') => {
    if (!activeRoomId || !user?.id) return

    // Buscar participantes da sala para encontrar o destinatário
    const { data: participants } = await supabase
      .from('chat_participants')
      .select('user_id')
      .eq('room_id', activeRoomId)
      .neq('user_id', user.id)

    const recipientId = participants?.[0]?.user_id
    if (!recipientId) {
      toast.error('Erro', 'Não foi possível identificar o destinatário da chamada.')
      return
    }

    const timeoutSeconds = 1800 // 30 minutos

    try {
      const request = await createRequest({
        recipientId,
        callType: type,
        timeoutSeconds,
        metadata: {
          roomId: activeRoomId,
          isProfessionalChat: true
        }
      })

      if (request) {
        setPendingCallRequest(request.request_id)
        setCallType(type)
        toast.success('Solicitação enviada', `Solicitação de ${type === 'video' ? 'videochamada' : 'ligação'} enviada!`)
        
        // Disparar abertura no Layout
        window.dispatchEvent(new CustomEvent('openVideoCall', {
          detail: {
            signalingRoomId: request.request_id,
            isInitiator: true,
            callType: type,
            appointmentId: activeRoomId // Usando roomId como appointmentId para o WiseCare
          }
        }))
      } else {
        toast.error('Erro', 'Não foi possível criar a solicitação.')
      }
    } catch (error) {
      console.error('Erro ao criar solicitação:', error)
      toast.error('Erro', 'Não foi possível enviar a solicitação.')
      setPendingCallRequest(null)
    }
  }


  return (
    <div className={`bg-slate-800/80 rounded-lg border border-slate-700 flex flex-col h-full ${className}`}>
      {/* Optimized Centered Header - Compact Version */}
      <div className="flex flex-col items-center text-center space-y-4 py-3 border-b border-slate-700/50">
        <div className="flex items-center justify-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-500/5 rounded-xl border border-emerald-500/20 shadow-sm shadow-emerald-500/5">
            <MessageCircle className="w-4 h-4 text-emerald-400" />
            <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">
              {isOnline ? 'Online' : 'Offline'}
            </span>
          </div>
        </div>

        <div className="flex flex-col md:flex-row items-center justify-center gap-3 w-full">
          {/* Filters Container - More Compact */}
          <div className="flex items-center p-0.5 bg-slate-900/50 rounded-full border border-slate-700 backdrop-blur-md overflow-x-auto no-scrollbar max-w-full">
            {(['all', 'professional', 'student', 'patient'] as RoomFilter[]).map((tabKey) => (
              <button
                key={tabKey}
                onClick={() => setFilter(tabKey)}
                className={`px-4 py-1.5 text-xs font-medium rounded-full transition-all whitespace-nowrap ${filter === tabKey
                  ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-900/10'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                  }`}
              >
                {tabKey === 'all' ? 'Todos' : tabKey === 'professional' ? 'Profissionais' : tabKey === 'student' ? 'Estudantes' : 'Pacientes'}
              </button>
            ))}
          </div>

          <button
            onClick={() => {
              // TODO: Implementar modal de seleção de profissional para novo chat
              alert('Funcionalidade de pesquisar profissionais para iniciar novo chat em desenvolvimento.')
            }}
            className="flex items-center gap-2 px-4 py-1.5 bg-blue-600 text-white text-xs font-bold rounded-full hover:bg-blue-700 transition-all shadow-lg shadow-blue-900/20"
          >
            <Plus className="w-3 h-3" />
            Novo Chat
          </button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        <aside className="w-1/4 border-r border-slate-700 flex flex-col min-w-[200px]">
          <div className="p-3 border-b border-slate-700">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Buscar salas..."
                value={searchTerm}
                onChange={event => setSearchTerm(event.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            {inboxLoading && (
              <div className="p-4 text-sm text-slate-400">Carregando salas...</div>
            )}

            {!inboxLoading && filteredRooms.length === 0 && (
              <div className="p-8 text-center">
                <div className="w-12 h-12 bg-slate-700/50 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Search className="w-6 h-6 text-slate-500" />
                </div>
                <p className="text-sm text-slate-400 font-medium">Nenhuma sala encontrada</p>
                <p className="text-xs text-slate-500 mt-1">Tente mudar o filtro ou iniciar um novo chat.</p>
              </div>
            )}

            {filteredRooms.map(room => {
              const isActive = room.id === activeRoomId

              return (
                <button
                  key={room.id}
                  onClick={() => handleSelectRoom(room)}
                  className={`w-full text-left p-3 border-b border-slate-700 transition-all ${isActive
                    ? 'bg-emerald-600 text-white shadow-md'
                    : room.unreadCount > 0
                      ? 'bg-emerald-500/10 text-emerald-400 border-l-4 border-l-emerald-500 pl-2'
                      : 'hover:bg-slate-700 text-slate-300'
                    }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-bold text-base truncate">{room.name ?? 'Sala sem nome'}</span>
                    {room.unreadCount > 0 && (
                      <span className="ml-2 inline-flex items-center justify-center rounded-full bg-emerald-500 px-2 py-0.5 text-[10px] font-black text-slate-950">
                        {room.unreadCount}
                      </span>
                    )}
                  </div>
                  <p className="text-xs opacity-70 mt-1">
                    Última atividade: {formatDateTime(room.lastMessageAt)}
                  </p>
                  <p className="text-xs uppercase font-black tracking-widest opacity-40 mt-1">
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
              <div className="p-4 border-b border-slate-700 flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-white">{activeRoom.name}</h3>
                  <p className="text-sm text-slate-400 capitalize">
                    {activeRoom.type ?? 'sem classificação'}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleStartCall('video')}
                    disabled={!!pendingCallRequest}
                    className="bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-3 py-2 rounded-lg text-sm transition-colors"
                    title={pendingCallRequest ? 'Aguardando resposta...' : 'Solicitar videochamada'}
                  >
                    <Video className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleStartCall('audio')}
                    disabled={!!pendingCallRequest}
                    className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-3 py-2 rounded-lg text-sm transition-colors"
                    title={pendingCallRequest ? 'Aguardando resposta...' : 'Solicitar ligação'}
                  >
                    <Phone className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-4 relative">
                {/* Background Doodle Pattern */}
                {/* Background Brand Watermark */}
                <div
                  className="absolute inset-0 opacity-[0.05] pointer-events-none"
                  style={{
                    backgroundImage: `url("/brain.png")`,
                    backgroundSize: '300px',
                    backgroundPosition: 'center',
                    backgroundRepeat: 'no-repeat',
                    filter: 'grayscale(100%)'
                  }}
                />

                {messagesLoading && (
                  <div className="text-sm text-slate-400 relative z-10 text-center py-4">Carregando mensagens...</div>
                )}

                {!messagesLoading && messages.length === 0 && (
                  <div className="text-sm text-slate-400 relative z-10 text-center py-10 opacity-60">
                    <p className="mb-2">Nenhuma mensagem registrada nesta sala.</p>
                    <p className="text-xs">Inicie uma conversa profissional e segura.</p>
                  </div>
                )}

                {messages.map(message => {
                  const isOwn = message.senderId === user?.id
                  return (
                    <div
                      key={message.id}
                      className={`flex ${isOwn ? 'justify-end' : 'justify-start'} relative z-10`}
                    >
                      <div
                        className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm shadow-sm ${isOwn
                          ? 'bg-emerald-600 text-white rounded-tr-none'
                          : 'bg-slate-800 text-slate-200 border border-slate-700/50 rounded-tl-none'
                          }`}
                      >
                        <div className="mb-1 flex items-center justify-between gap-3">
                          <span className="font-semibold text-xs">{message.senderName}</span>
                          <span className="text-[10px] opacity-75">
                            {formatTime(message.createdAt)}
                          </span>
                        </div>
                        <p>{message.message}</p>
                        {message.fileUrl && (
                          <a
                            href={message.fileUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="mt-2 inline-flex items-center gap-2 text-xs underline"
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

              <footer className="p-4 border-t border-slate-700">
                <form className="flex items-center gap-2" onSubmit={handleSendMessage}>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/gif,image/webp,application/pdf"
                    className="hidden"
                    onChange={handleFileInputChange}
                  />
                  <button
                    type="button"
                    title="Anexar imagem ou PDF (máx 10 MB)"
                    disabled={!isOnline || uploadingFile || !activeRoomId}
                    onClick={() => fileInputRef.current?.click()}
                    className="bg-slate-700 hover:bg-slate-600 disabled:bg-slate-800 disabled:cursor-not-allowed text-slate-200 p-2 rounded-lg transition-colors flex items-center justify-center"
                  >
                    {uploadingFile ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Paperclip className="w-4 h-4" />
                    )}
                  </button>
                  <input
                    type="text"
                    value={inputMessage}
                    onChange={event => setInputMessage(event.target.value)}
                    onPaste={handlePasteAttachment}
                    placeholder={
                      isOnline
                        ? 'Digite sua mensagem ou cole imagem/PDF...'
                        : 'Modo offline – mensagens serão enviadas quando reconectar'
                    }
                    className="flex-1 px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    type="submit"
                    disabled={!inputMessage.trim() || !isOnline}
                    className="bg-blue-600 hover:bg-blue-700 disabled:bg-slate-600 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
                  >
                    <Send className="w-4 h-4" />
                    Enviar
                  </button>
                </form>
                <p className="mt-2 text-xs text-slate-400 flex items-center gap-2">
                  {isOnline ? (
                    <>
                      <Activity className="w-3 h-3" />
                      Conectado ao Supabase Realtime
                    </>
                  ) : (
                    <>
                      <X className="w-3 h-3" />
                      Offline – mensagens serão sincronizadas quando a conexão voltar
                    </>
                  )}
                </p>
              </footer>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center p-8">
              <div className="text-center text-slate-300 space-y-3">
                <MessageCircle className="w-16 h-16 text-slate-500 mx-auto" />
                <h3 className="text-xl font-semibold text-white">Selecione uma sala</h3>
                <p className="text-sm text-slate-400">
                  Escolha uma sala de chat na coluna à esquerda para visualizar as mensagens.
                </p>
              </div>
            </div>
          )}
        </section>
      </div>

      {/* Video call notifications - O Layout.tsx já exibe notificações globais */}

      {/* Indicador de espera */}
      {pendingCallRequest && (
        <div className="fixed bottom-4 right-4 bg-blue-600/90 backdrop-blur-sm border border-blue-500/50 rounded-xl p-4 shadow-2xl max-w-sm z-50">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0">
              <Loader2 className="w-5 h-5 text-white animate-spin" />
            </div>
            <div className="flex-1">
              <h4 className="text-sm font-semibold text-white mb-1">⏳ Aguardando resposta</h4>
              <p className="text-xs text-blue-100 leading-relaxed">
                Sua solicitação de {callType === 'video' ? 'videochamada' : 'ligação'} foi enviada ao profissional/paciente.
              </p>
            </div>
            <button
              onClick={() => {
                if (pendingCallRequest) {
                  cancelRequest(pendingCallRequest)
                  setPendingCallRequest(null)
                  toast.success('Cancelado', 'Solicitação cancelada.')
                }
              }}
              className="text-white/60 hover:text-white transition-colors p-1 hover:bg-white/10 rounded"
              title="Cancelar solicitação"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* VideoCall local removido - usando do Layout */}
    </div>
  )
}

export default ProfessionalChatSystem