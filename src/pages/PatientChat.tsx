import React, { useState, useRef, useEffect } from 'react'
import {
  Send,
  Phone,
  Video,
  Paperclip,
  Smile,
  Mic,
  MicOff,
  Clock,
  CheckCircle,
  ChevronDown,
  BookOpen
} from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import JourneyManualModal from '../components/JourneyManualModal'

interface Message {
  id: string
  user: string
  avatar: string
  message: string
  timestamp: string
  isDoctor: boolean
}

const PatientChat: React.FC = () => {
  const { user } = useAuth()
  const [message, setMessage] = useState('')
  const [isRecording, setIsRecording] = useState(false)
  const [isVideoCall, setIsVideoCall] = useState(false)
  const [selectedProfessional, setSelectedProfessional] = useState<string | null>(null)
  const [professionals, setProfessionals] = useState<any[]>([])
  const [messages, setMessages] = useState<Message[]>([])
  const [showProfessionalSelect, setShowProfessionalSelect] = useState(false)
  const [showJourneyManual, setShowJourneyManual] = useState(false)
  const [linkedProfessionalIds, setLinkedProfessionalIds] = useState<Set<string>>(new Set())
  const [showTeamModal, setShowTeamModal] = useState(false)
  const [showAddProfModal, setShowAddProfModal] = useState(false)
  const [selectedTeamMembers, setSelectedTeamMembers] = useState<Set<string>>(new Set())
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Carregar profissionais do banco
  useEffect(() => {
    const loadProfessionals = async () => {
      try {
        const { data, error } = await supabase
          .from('users')
          .select('id, name, email, type')
          .in('type', ['profissional', 'professional', 'admin'])

        if (!error && data) {
          setProfessionals(data)
          if (data.length > 0 && !selectedProfessional) {
            setSelectedProfessional(data[0].id)
          }
        }

        // Carregar profissionais vinculados (que têm sala com o usuário)
        if (user?.id) {
          const { data: rooms } = await supabase
            .from('chat_participants')
            .select('room_id')
            .eq('user_id', user.id)

          if (rooms && rooms.length > 0) {
            const roomIds = rooms.map(r => r.room_id)
            const { data: otherParticipants } = await supabase
              .from('chat_participants')
              .select('user_id, role')
              .in('room_id', roomIds)
              .in('role', ['professional', 'admin'])

            const linkedIds = new Set<string>()
            otherParticipants?.forEach(p => {
              if (p.user_id && p.user_id !== user.id) {
                linkedIds.add(p.user_id)
              }
            })
            setLinkedProfessionalIds(linkedIds)
            console.log('🔗 Profissionais vinculados:', linkedIds.size)
          }
        }
      } catch (error) {
        console.error('Erro ao carregar profissionais:', error)
      }
    }

    loadProfessionals()
  }, [user?.id])

  // Carregar mensagens quando profissional é selecionado
  useEffect(() => {
    if (selectedProfessional && user?.id) {
      loadMessages()

      // Configurar Realtime
      let channel: any = null
      getOrCreateChatRoom(user.id, selectedProfessional).then(chatId => {
        channel = supabase
          .channel(`chat_${chatId}`) // Usar roomId real para o canal
          .on('postgres_changes', {
            event: 'INSERT',
            schema: 'public',
            table: 'chat_messages',
            filter: `room_id=eq.${chatId}`
          }, (payload) => {
            loadMessages() // Recarregar mensagens quando nova mensagem chegar
          })
          .subscribe()
      })

      return () => {
        if (channel) {
          supabase.removeChannel(channel)
        }
      }
    }
  }, [selectedProfessional, user?.id])

  // Função para obter ou criar sala de chat
  const getOrCreateChatRoom = async (patientId: string, professionalId: string): Promise<string> => {
    try {
      // 1. Tentar encontrar sala existente via RPC ou query padrão
      // Vamos tentar usar a RPC que já lida com a busca/criação
      const { data: roomId, error } = await supabase.rpc('create_chat_room_for_patient', {
        p_patient_id: patientId,
        p_patient_name: user?.name || 'Paciente',
        p_professional_id: professionalId
      });

      if (error) {
        console.warn('Erro na RPC create_chat_room_for_patient, tentando fallback manual...', error);
        throw error;
      }

      if (roomId) return roomId;

      throw new Error('Não foi possível obter o ID da sala');
    } catch (err) {
      console.error('Erro ao obter/criar sala:', err);
      // Fallback: Gerar ID local APENAS se não conseguirmos usar o banco (mas isso provavelmente falhará no insert)
      // Melhor retornar erro para tratamento
      throw err;
    }
  }

  const loadMessages = async () => {
    if (!selectedProfessional || !user?.id) return

    try {
      const chatId = await getOrCreateChatRoom(user.id, selectedProfessional)

      const { data: messagesData, error } = await supabase
        .from('chat_messages')
        .select('*') // Simplificado: sem join que estava quebrando
        .eq('room_id', chatId)
        .order('created_at', { ascending: true })

      if (!error && messagesData) {
        console.log('📨 Mensagens carregadas do banco:', messagesData.length);

        // Encontrar info do profissional
        const professional = professionals.find(p => p.id === selectedProfessional)

        const formattedMessages = messagesData.map((msg: any) => {
          const isDoctor = msg.sender_id === selectedProfessional
          // Resolver nome localmente sem join
          const senderName = isDoctor ? (professional?.name || 'Profissional') : 'Você'
          const senderAvatar = isDoctor ? (professional?.name?.[0] || 'P') : 'V'

          return {
            id: msg.id,
            user: senderName,
            avatar: senderAvatar,
            message: msg.message,
            timestamp: new Date(msg.created_at).toLocaleTimeString('pt-BR', {
              hour: '2-digit',
              minute: '2-digit'
            }),
            isDoctor
          }
        })

        console.log('✅ Mensagens formatadas:', formattedMessages);
        setMessages(formattedMessages)
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
      } else {
        console.log('⚠️ Nenhuma mensagem encontrada ou erro:', error);
      }
    } catch (error) {
      console.error('Erro ao carregar mensagens:', error)
    }
  }

  const currentProfessional = professionals.find(p => p.id === selectedProfessional)

  const handleSendMessage = async () => {
    if (!message.trim() || !selectedProfessional || !user?.id) return

    try {
      // Garantir que a sala existe antes de enviar
      const chatId = await getOrCreateChatRoom(user.id, selectedProfessional)
      console.log('📝 Tentando enviar mensagem para chat:', chatId, 'De:', user.id);

      const messagePayload = {
        room_id: chatId,
        sender_id: user.id,
        message: message.trim(),
        message_type: 'text',
        created_at: new Date().toISOString()
      };

      console.log('📦 Payload da mensagem:', messagePayload);

      const { error } = await supabase
        .from('chat_messages')
        .insert(messagePayload)

      if (error) {
        console.error('❌ Erro Supabase no insert:', error);
        throw error
      }

      setMessage('')
      loadMessages() // Recarregar mensagens
    } catch (error) {
      console.error('Erro ao enviar mensagem:', error)
      alert('Erro ao enviar mensagem. Tente novamente.')
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const startRecording = () => {
    setIsRecording(!isRecording)
  }

  const startVideoCall = () => {
    setIsVideoCall(!isVideoCall)
  }

  // Scroll para o topo quando carrega a página
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [])

  // Scroll para o topo quando muda o profissional
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [selectedProfessional])

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showProfessionalSelect && dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowProfessionalSelect(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showProfessionalSelect])

  return (
    <div className="min-h-screen bg-slate-900 p-8">
      <div className="max-w-5xl mx-auto">
        {/* Header removido conforme solicitação do usuário */}





        {/* Chat Container */}
        <div className="bg-slate-800/80 rounded-lg shadow-2xl overflow-hidden mt-6 relative" style={{ zIndex: 1 }}>
          {/* Chat Header */}
          <div className="bg-slate-700/50 px-6 py-4 border-b border-slate-600">
            <div className="flex items-center justify-between">
              <div className="relative" style={{ zIndex: 100 }}>
                <button
                  onClick={() => setShowProfessionalSelect(!showProfessionalSelect)}
                  className="flex items-center space-x-3 hover:bg-slate-700/50 p-2 rounded-lg transition-colors border border-transparent hover:border-slate-600"
                >
                  <div className="w-10 h-10 bg-primary-600 rounded-full flex items-center justify-center">
                    <span className="text-sm font-medium text-white">{currentProfessional?.name?.[0] || 'P'}</span>
                  </div>
                  <div className="text-left">
                    <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                      {currentProfessional?.name || 'Profissional'}
                      <ChevronDown className="w-4 h-4 text-slate-400" />
                    </h2>
                    <p className="text-slate-300 text-sm">{currentProfessional?.specialty || 'Cannabis Medicinal'}</p>
                  </div>
                </button>

                {/* Dropdown */}
                {showProfessionalSelect && (
                  <div
                    ref={dropdownRef}
                    className="absolute top-full left-0 mt-2 w-80 max-h-[400px] overflow-y-auto bg-slate-800 border border-slate-700 rounded-lg shadow-xl custom-scrollbar"
                    style={{ zIndex: 100 }}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="p-2">
                      {/* Minha Equipe - Profissionais Vinculados */}
                      {(() => {
                        const isAdmin = user?.type === 'admin';
                        const linkedProfessionals = professionals.filter(p =>
                          isAdmin || linkedProfessionalIds.has(p.id)
                        );
                        const unlinkedProfessionals = professionals.filter(p =>
                          !isAdmin && !linkedProfessionalIds.has(p.id)
                        );

                        return (
                          <>
                            {linkedProfessionals.length > 0 && (
                              <>
                                <p className="text-xs text-primary-400 font-semibold mb-2 px-2">💚 Minha Equipe</p>
                                {linkedProfessionals.map((professional) => (
                                  <button
                                    key={professional.id}
                                    onClick={(e) => {
                                      e.preventDefault()
                                      e.stopPropagation()
                                      setSelectedProfessional(professional.id)
                                      setShowProfessionalSelect(false)
                                    }}
                                    className="w-full p-3 rounded-lg hover:bg-slate-700 transition-colors flex items-center space-x-3"
                                  >
                                    <div className="w-8 h-8 flex-shrink-0 bg-gradient-to-r from-[#00c16a] to-[#00a85a] rounded-full flex items-center justify-center">
                                      <span className="text-white text-xs font-bold">{professional.name?.[0] || 'P'}</span>
                                    </div>
                                    <div className="flex-1 text-left">
                                      <p className="font-semibold text-white text-sm">{professional.name}</p>
                                      <p className="text-xs text-slate-400">Cannabis Medicinal</p>
                                    </div>
                                    {selectedProfessional === professional.id && (
                                      <CheckCircle className="w-4 h-4 text-green-400" />
                                    )}
                                  </button>
                                ))}
                              </>
                            )}

                            {/* Adicionar Profissional - Não Vinculados */}
                            {unlinkedProfessionals.length > 0 && (
                              <>
                                <div className="border-t border-slate-700 my-2"></div>
                                <p className="text-xs text-slate-400 font-semibold mb-2 px-2">➕ Adicionar Profissional</p>
                                {unlinkedProfessionals.map((professional) => (
                                  <button
                                    key={professional.id}
                                    onClick={(e) => {
                                      e.preventDefault()
                                      e.stopPropagation()
                                      setSelectedProfessional(professional.id)
                                      setShowProfessionalSelect(false)
                                    }}
                                    className="w-full p-2 rounded-lg hover:bg-slate-700/50 transition-colors flex items-center space-x-3 opacity-70 hover:opacity-100"
                                  >
                                    <div className="w-8 h-8 flex-shrink-0 bg-slate-700 rounded-full flex items-center justify-center">
                                      <span className="text-slate-300 text-xs font-bold">{professional.name?.[0] || 'P'}</span>
                                    </div>
                                    <div className="flex-1 text-left">
                                      <p className="font-medium text-slate-300 text-sm">{professional.name}</p>
                                      <p className="text-xs text-slate-500">Clique para adicionar</p>
                                    </div>
                                    <span className="text-xs bg-primary-500/20 text-primary-400 px-2 py-0.5 rounded-full">Add</span>
                                  </button>
                                ))}
                              </>
                            )}

                            {linkedProfessionals.length === 0 && unlinkedProfessionals.length === 0 && (
                              <p className="text-slate-400 text-sm text-center py-4">Nenhum profissional disponível</p>
                            )}
                          </>
                        );
                      })()}
                    </div>
                  </div>
                )}
              </div>
              <div className="flex items-center space-x-2">
                {/* Botões de Ação - Minha Equipe e Add Profissional */}
                <button
                  onClick={() => setShowTeamModal(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-primary-500/20 text-primary-400 hover:bg-primary-500/30 rounded-lg transition-colors"
                >
                  💚 Minha Equipe
                </button>
                <button
                  onClick={() => setShowAddProfModal(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-slate-700 text-slate-300 hover:bg-slate-600 hover:text-white rounded-lg transition-colors"
                >
                  ➕ Add Prof.
                </button>

                <div className="w-px h-6 bg-slate-700 mx-1"></div>

                <button
                  onClick={startVideoCall}
                  className="p-2 text-slate-400 hover:text-blue-500 transition-colors duration-200"
                >
                  {isVideoCall ? <Video className="w-5 h-5" /> : <Video className="w-5 h-5" />}
                </button>
                <button className="p-2 text-slate-400 hover:text-green-500 transition-colors duration-200">
                  <Phone className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>

          {/* Messages */}
          {/* Messages */}
          <div className="h-96 flex flex-col relative overflow-hidden bg-slate-900/50">
            {/* Context Header - Quem está na conversa */}
            {selectedProfessional && (
              <div className="absolute top-0 left-0 right-0 bg-slate-800/80 backdrop-blur-md border-b border-slate-700 px-4 py-2 flex items-center justify-between z-10 shadow-sm">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">Conversando com:</span>
                  <div className="flex items-center gap-2 bg-slate-700/50 px-2 py-0.5 rounded-full border border-slate-600/50">
                    <div className="w-4 h-4 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-[10px] font-bold border border-emerald-500/30">
                      {currentProfessional?.name?.[0] || 'P'}
                    </div>
                    <span className="text-xs font-semibold text-slate-200">{currentProfessional?.name || 'Profissional'}</span>
                  </div>
                </div>
              </div>
            )}

            <div className="flex-1 overflow-y-auto p-6 space-y-4 pt-12 custom-scrollbar">
              {messages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-slate-500 space-y-4 opacity-60">
                  <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center">
                    <div className="w-8 h-8 text-2xl">💬</div>
                  </div>
                  <div className="text-center">
                    <p className="font-medium">Nenhuma mensagem ainda</p>
                    <p className="text-sm">Envie um "Olá" para iniciar a conversa!</p>
                  </div>
                </div>
              ) : (
                messages.map((msg) => (
                  <div key={msg.id} className={`flex items-start space-x-3 ${msg.isDoctor ? 'justify-start' : 'justify-end'}`}>
                    {msg.isDoctor && (
                      <div className="w-8 h-8 bg-slate-700 rounded-full flex items-center justify-center flex-shrink-0 shadow-lg border border-slate-600">
                        <span className="text-xs font-bold text-slate-300">{msg.avatar}</span>
                      </div>
                    )}
                    <div className={`max-w-xs lg:max-w-md px-4 py-3 shadow-md ${msg.isDoctor
                      ? 'bg-slate-800 text-slate-200 rounded-2xl rounded-tl-sm border border-slate-700'
                      : 'bg-emerald-600 text-white rounded-2xl rounded-tr-sm'
                      }`}>
                      <div className="flex items-center justify-between gap-3 mb-1">
                        <span className="text-[11px] font-bold opacity-90">{msg.user}</span>
                        <span className="text-[9px] opacity-60">{msg.timestamp}</span>
                      </div>
                      <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.message}</p>
                    </div>
                  </div>
                ))
              )}
              <div ref={messagesEndRef} />
            </div>
          </div>


          {/* Message Input */}
          <div className="bg-slate-700/50 px-6 py-4 border-t border-slate-600">
            <div className="flex items-center space-x-3">
              <button className="p-2 text-slate-400 hover:text-blue-500 transition-colors duration-200">
                <Paperclip className="w-5 h-5" />
              </button>
              <div className="flex-1">
                <input
                  type="text"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Digite sua mensagem..."
                  className="w-full px-4 py-2 border border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-slate-700 text-white placeholder-slate-400"
                />
              </div>
              <button className="p-2 text-slate-400 hover:text-yellow-500 transition-colors duration-200">
                <Smile className="w-5 h-5" />
              </button>
              <button
                onClick={startRecording}
                className={`p-2 transition-colors duration-200 ${isRecording
                  ? 'text-red-600 bg-red-100 dark:bg-red-900/20'
                  : 'text-slate-400 hover:text-red-500'
                  }`}
              >
                {isRecording ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
              </button>
              <button
                onClick={handleSendMessage}
                className="p-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors duration-200"
              >
                <Send className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Trigger para Manual da Jornada */}
        <div className="mt-6 flex justify-center">
          <button
            onClick={() => setShowJourneyManual(true)}
            className="flex items-center space-x-2 px-4 py-2 bg-slate-800/80 hover:bg-slate-700 border border-slate-700 rounded-lg text-sm text-slate-300 hover:text-white transition-colors"
          >
            <BookOpen className="w-4 h-4 text-emerald-400" />
            <span>Manual da Jornada de Cuidado</span>
          </button>
        </div>

        {/* Modal */}
        <JourneyManualModal isOpen={showJourneyManual} onClose={() => setShowJourneyManual(false)} />

        {/* Modal Minha Equipe - Configuração Multi-select */}
        {
          showTeamModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
              <div className="bg-slate-800 border border-slate-700 rounded-2xl w-full max-w-md mx-4 shadow-2xl">
                <div className="p-6 border-b border-slate-700">
                  <div className="flex items-center justify-between">
                    <h2 className="text-lg font-semibold text-white">💚 Minha Equipe</h2>
                    <button
                      onClick={() => setShowTeamModal(false)}
                      className="p-1 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg"
                    >
                      ✕
                    </button>
                  </div>
                  <p className="text-sm text-slate-400 mt-1">Selecione os profissionais para conversar em grupo</p>
                </div>

                <div className="p-4 max-h-[300px] overflow-y-auto custom-scrollbar space-y-2">
                  {professionals.filter(p => linkedProfessionalIds.has(p.id) || user?.type === 'admin').map(prof => (
                    <button
                      key={prof.id}
                      onClick={() => {
                        const newSet = new Set(selectedTeamMembers);
                        if (newSet.has(prof.id)) {
                          newSet.delete(prof.id);
                        } else {
                          newSet.add(prof.id);
                        }
                        setSelectedTeamMembers(newSet);
                      }}
                      className={`w-full p-3 rounded-xl flex items-center gap-3 transition-colors ${selectedTeamMembers.has(prof.id)
                        ? 'bg-primary-500/20 border-2 border-primary-500 text-white'
                        : 'bg-slate-700/50 border-2 border-transparent hover:bg-slate-700 text-slate-300'
                        }`}
                    >
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${selectedTeamMembers.has(prof.id) ? 'bg-primary-500' : 'bg-slate-600'
                        }`}>
                        <span className="text-white font-bold">{prof.name?.[0] || 'P'}</span>
                      </div>
                      <div className="flex-1 text-left">
                        <p className="font-medium">{prof.name}</p>
                        <p className="text-xs text-slate-400">Cannabis Medicinal</p>
                      </div>
                      {selectedTeamMembers.has(prof.id) && (
                        <CheckCircle className="w-5 h-5 text-primary-400" />
                      )}
                    </button>
                  ))}
                </div>

                <div className="p-4 border-t border-slate-700 flex gap-3">
                  <button
                    onClick={() => setShowTeamModal(false)}
                    className="flex-1 px-4 py-2 bg-slate-700 text-slate-300 rounded-lg hover:bg-slate-600"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={() => {
                      console.log('👥 Equipe selecionada:', Array.from(selectedTeamMembers));
                      // TODO: Criar sala de grupo com os membros selecionados
                      setShowTeamModal(false);
                    }}
                    className="flex-1 px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 font-medium"
                    disabled={selectedTeamMembers.size === 0}
                  >
                    Iniciar Conversa ({selectedTeamMembers.size})
                  </button>
                </div>
              </div>
            </div>
          )
        }

        {/* Modal Add Profissional */}
        {
          showAddProfModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
              <div className="bg-slate-800 border border-slate-700 rounded-2xl w-full max-w-md mx-4 shadow-2xl">
                <div className="p-6 border-b border-slate-700">
                  <div className="flex items-center justify-between">
                    <h2 className="text-lg font-semibold text-white">➕ Adicionar Profissional</h2>
                    <button
                      onClick={() => setShowAddProfModal(false)}
                      className="p-1 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg"
                    >
                      ✕
                    </button>
                  </div>
                  <p className="text-sm text-slate-400 mt-1">Escolha um profissional para adicionar à sua equipe</p>
                </div>

                <div className="p-4 max-h-[300px] overflow-y-auto custom-scrollbar space-y-2">
                  {professionals.filter(p => !linkedProfessionalIds.has(p.id) && user?.type !== 'admin').length === 0 ? (
                    <div className="text-center py-8 text-slate-400">
                      <p>🎉 Todos os profissionais já estão na sua equipe!</p>
                    </div>
                  ) : (
                    professionals.filter(p => !linkedProfessionalIds.has(p.id) || user?.type === 'admin').map(prof => (
                      <button
                        key={prof.id}
                        onClick={() => {
                          setSelectedProfessional(prof.id);
                          setLinkedProfessionalIds(new Set([...linkedProfessionalIds, prof.id]));
                          setShowAddProfModal(false);
                          console.log('➕ Profissional adicionado:', prof.name);
                        }}
                        className="w-full p-3 rounded-xl flex items-center gap-3 bg-slate-700/50 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
                      >
                        <div className="w-10 h-10 rounded-full bg-slate-600 flex items-center justify-center">
                          <span className="text-white font-bold">{prof.name?.[0] || 'P'}</span>
                        </div>
                        <div className="flex-1 text-left">
                          <p className="font-medium">{prof.name}</p>
                          <p className="text-xs text-slate-400">Cannabis Medicinal</p>
                        </div>
                        <span className="text-xs bg-primary-500/20 text-primary-400 px-2 py-1 rounded-full">Add</span>
                      </button>
                    ))
                  )}
                </div>

                <div className="p-4 border-t border-slate-700">
                  <button
                    onClick={() => setShowAddProfModal(false)}
                    className="w-full px-4 py-2 bg-slate-700 text-slate-300 rounded-lg hover:bg-slate-600"
                  >
                    Fechar
                  </button>
                </div>
              </div>
            </div>
          )
        }
      </div >
    </div >
  )
}

export default PatientChat
