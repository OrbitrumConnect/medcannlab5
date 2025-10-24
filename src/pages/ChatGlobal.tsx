import React, { useState, useRef, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { 
  Send, 
  Mic, 
  MicOff, 
  Video, 
  VideoOff, 
  Phone, 
  MoreVertical,
  Smile,
  Paperclip,
  Lock,
  Globe,
  Star,
  Heart,
  Reply,
  Edit,
  Pin,
  Bell,
  Users,
  MessageSquare,
  UserPlus,
  Check,
  X,
  Search,
  Filter,
  Plus,
  TrendingUp,
  Award,
  BookOpen,
  Calendar,
  Clock,
  Eye,
  ThumbsUp,
  ThumbsDown,
  Share2,
  Flag
} from 'lucide-react'

const ChatGlobal: React.FC = () => {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState<'chat' | 'forum' | 'friends'>('chat')
  const [activeChannel, setActiveChannel] = useState('general')
  const [message, setMessage] = useState('')
  const [isRecording, setIsRecording] = useState(false)
  const [isVideoCall, setIsVideoCall] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [showFriendRequests, setShowFriendRequests] = useState(false)
  const [messages, setMessages] = useState<any[]>([])
  const [onlineUsers, setOnlineUsers] = useState<any[]>([])
  const [isAdmin, setIsAdmin] = useState(false)
  const [showModeration, setShowModeration] = useState(false)
  const [moderatorRequests, setModeratorRequests] = useState<any[]>([])
  const [showModeratorRequest, setShowModeratorRequest] = useState(false)
  const [requestReason, setRequestReason] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const channels = [
    { id: 'general', name: 'Geral', type: 'public', members: 1247, unread: 0, description: 'Discussões gerais sobre medicina' },
    { id: 'cannabis', name: 'Cannabis Medicinal', type: 'public', members: 892, unread: 3, description: 'Especialistas em cannabis medicinal' },
    { id: 'clinical', name: 'Casos Clínicos', type: 'public', members: 456, unread: 1, description: 'Discussão de casos complexos' },
    { id: 'research', name: 'Pesquisa', type: 'public', members: 234, unread: 0, description: 'Pesquisas e estudos recentes' },
    { id: 'support', name: 'Suporte', type: 'private', members: 12, unread: 2, description: 'Suporte técnico e ajuda' }
  ]

  const debates = [
    {
      id: 1,
      title: 'CBD vs THC: Qual é mais eficaz para dor crônica?',
      author: 'Dr. João Silva',
      authorAvatar: 'JS',
      category: 'Cannabis Medicinal',
      participants: 24,
      views: 156,
      replies: 18,
      votes: { up: 15, down: 3 },
      tags: ['CBD', 'THC', 'Dor Crônica', 'Cannabis'],
      lastActivity: '2 horas atrás',
      isPinned: true,
      isHot: true,
      isActive: true,
      isPasswordProtected: false,
      description: 'Discussão sobre a eficácia comparativa entre CBD e THC no tratamento da dor crônica, baseada em evidências clínicas recentes.'
    },
    {
      id: 2,
      title: 'Protocolo de dosagem para pacientes idosos com cannabis',
      author: 'Dra. Maria Santos',
      authorAvatar: 'MS',
      category: 'Protocolos',
      participants: 18,
      views: 89,
      replies: 12,
      votes: { up: 22, down: 1 },
      tags: ['Dosagem', 'Idosos', 'Protocolo', 'Segurança'],
      lastActivity: '4 horas atrás',
      isPinned: false,
      isHot: false,
      isActive: false,
      isPasswordProtected: true,
      description: 'Compartilhamento de protocolos seguros para dosagem de cannabis em pacientes da terceira idade.'
    },
    {
      id: 3,
      title: 'Interações medicamentosas com cannabis: Casos reais',
      author: 'Dr. Pedro Costa',
      authorAvatar: 'PC',
      category: 'Farmacologia',
      participants: 31,
      views: 203,
      replies: 25,
      votes: { up: 28, down: 2 },
      tags: ['Interações', 'Farmacologia', 'Casos Reais', 'Segurança'],
      lastActivity: '1 hora atrás',
      isPinned: false,
      isHot: true,
      isActive: true,
      isPasswordProtected: false,
      description: 'Análise de casos reais de interações medicamentosas com cannabis e estratégias de prevenção.'
    }
  ]

  // Verificar se é admin
  useEffect(() => {
    if (user?.type === 'admin') {
      setIsAdmin(true)
    }
  }, [user])

  // Carregar mensagens do canal ativo
  useEffect(() => {
    loadMessages()
  }, [activeChannel])

  // Carregar usuários online
  useEffect(() => {
    loadOnlineUsers()
  }, [])

  // Carregar solicitações de moderador (apenas para admins)
  useEffect(() => {
    if (isAdmin) {
      loadModeratorRequests()
    }
  }, [isAdmin])

  const loadMessages = async () => {
    try {
      const { data, error } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('channel', activeChannel)
        .order('created_at', { ascending: true })
        .limit(50)

      if (error) {
        console.error('Erro ao carregar mensagens:', error)
        return
      }

      setMessages(data || [])
    } catch (error) {
      console.error('Erro ao carregar mensagens:', error)
    }
  }

  const loadOnlineUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('is_online', true)
        .order('last_seen', { ascending: false })

      if (error) {
        console.error('Erro ao carregar usuários online:', error)
        return
      }

      setOnlineUsers(data || [])
    } catch (error) {
      console.error('Erro ao carregar usuários online:', error)
    }
  }

  const loadModeratorRequests = async () => {
    try {
      const { data, error } = await supabase
        .from('moderator_requests')
        .select('*')
        .eq('status', 'pending')
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Erro ao carregar solicitações:', error)
        return
      }

      setModeratorRequests(data || [])
    } catch (error) {
      console.error('Erro ao carregar solicitações:', error)
    }
  }

  const friendRequests = [
    { id: 1, name: 'Dr. Lucas Ferreira', avatar: 'LF', specialty: 'Dermatologia', crm: '66666-RS', message: 'Gostaria de conectar para discutir casos de dermatite atópica' },
    { id: 2, name: 'Dra. Camila Alves', avatar: 'CA', specialty: 'Ginecologia', crm: '77777-BA', message: 'Interessada em trocar experiências sobre cannabis na ginecologia' }
  ]

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSendMessage = async () => {
    if (message.trim() && user) {
      try {
        const { error } = await supabase
          .from('chat_messages')
          .insert({
            user_id: user.id,
            user_name: user.name || 'Usuário',
            user_avatar: 'U',
            message: message.trim(),
            channel: activeChannel,
            crm: user.crm || '',
            specialty: '',
            type: 'text',
            reactions: { heart: 0, thumbs: 0, reply: 0 },
            is_pinned: false,
            is_online: true
          })

        if (error) {
          console.error('Erro ao enviar mensagem:', error)
          return
        }

        setMessage('')
        loadMessages() // Recarregar mensagens
      } catch (error) {
        console.error('Erro ao enviar mensagem:', error)
      }
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const handleAddFriend = (userId: number) => {
    console.log('Adicionando amigo:', userId)
  }

  const handleAcceptFriend = (requestId: number) => {
    console.log('Aceitando solicitação:', requestId)
  }

  const handleRejectFriend = (requestId: number) => {
    console.log('Rejeitando solicitação:', requestId)
  }

  // Funções de moderação para admins
  const handleDeleteMessage = async (messageId: number) => {
    if (!isAdmin) return
    
    try {
      const { error } = await supabase
        .from('chat_messages')
        .delete()
        .eq('id', messageId)

      if (error) {
        console.error('Erro ao deletar mensagem:', error)
        return
      }

      loadMessages()
    } catch (error) {
      console.error('Erro ao deletar mensagem:', error)
    }
  }

  const handlePinMessage = async (messageId: number) => {
    if (!isAdmin) return
    
    try {
      const { error } = await supabase
        .from('chat_messages')
        .update({ is_pinned: true })
        .eq('id', messageId)

      if (error) {
        console.error('Erro ao fixar mensagem:', error)
        return
      }

      loadMessages()
    } catch (error) {
      console.error('Erro ao fixar mensagem:', error)
    }
  }

  const handleMuteUser = async (userId: string) => {
    if (!isAdmin) return
    
    try {
      const { error } = await supabase
        .from('user_mutes')
        .insert({
          user_id: userId,
          muted_by: user?.id,
          reason: 'Comportamento inadequado',
          expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 horas
        })

      if (error) {
        console.error('Erro ao silenciar usuário:', error)
        return
      }

      console.log('Usuário silenciado por 24 horas')
    } catch (error) {
      console.error('Erro ao silenciar usuário:', error)
    }
  }

  // Função para solicitar moderador
  const handleRequestModerator = async () => {
    if (!user || !requestReason.trim()) return

    try {
      const { error } = await supabase
        .from('moderator_requests')
        .insert({
          requester_id: user.id,
          requester_name: user.name || 'Usuário',
          channel: activeChannel,
          reason: requestReason.trim(),
          status: 'pending',
          priority: 'normal'
        })

      if (error) {
        console.error('Erro ao solicitar moderador:', error)
        return
      }

      setRequestReason('')
      setShowModeratorRequest(false)
      alert('Solicitação enviada! Um moderador será notificado.')
    } catch (error) {
      console.error('Erro ao solicitar moderador:', error)
    }
  }

  // Função para responder à solicitação (apenas admins)
  const handleRespondToRequest = async (requestId: number, action: 'accept' | 'decline') => {
    if (!isAdmin) return

    try {
      const { error } = await supabase
        .from('moderator_requests')
        .update({
          status: action === 'accept' ? 'accepted' : 'declined',
          responded_by: user?.id,
          responded_at: new Date().toISOString()
        })
        .eq('id', requestId)

      if (error) {
        console.error('Erro ao responder solicitação:', error)
        return
      }

      loadModeratorRequests()
    } catch (error) {
      console.error('Erro ao responder solicitação:', error)
    }
  }

  const handleOpenDebate = (debateId: number) => {
    navigate(`/debate/${debateId}`)
  }

  const startRecording = () => {
    setIsRecording(true)
    setTimeout(() => {
      setIsRecording(false)
    }, 3000)
  }

  const startVideoCall = () => {
    setIsVideoCall(true)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online': return 'bg-green-500'
      case 'away': return 'bg-yellow-500'
      case 'busy': return 'bg-red-500'
      default: return 'bg-gray-500'
    }
  }

  const getVoteColor = (votes: { up: number, down: number }) => {
    const total = votes.up + votes.down
    if (total === 0) return 'text-slate-400'
    const ratio = votes.up / total
    if (ratio > 0.7) return 'text-green-400'
    if (ratio > 0.4) return 'text-yellow-400'
    return 'text-red-400'
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold text-white mb-2">
          💬 Chat Global + Fórum Profissional
        </h1>
        <p className="text-slate-300 text-lg">
          Conecte-se com colegas, participe de debates e compartilhe conhecimento
        </p>
        {isAdmin && (
          <div className="mt-4 flex justify-center space-x-4">
            <button
              onClick={() => setShowModeration(!showModeration)}
              className={`px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors ${
                showModeration 
                  ? 'bg-red-700 text-white' 
                  : 'bg-red-600 hover:bg-red-700 text-white'
              }`}
            >
              <Flag className="w-4 h-4" />
              <span>{showModeration ? 'Ocultar Moderação' : 'Painel de Moderação'}</span>
            </button>
            <div className="bg-green-500/20 text-green-400 px-3 py-2 rounded-lg flex items-center space-x-2">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              <span className="text-sm font-medium">Admin Online</span>
            </div>
            {moderatorRequests.length > 0 && (
              <div className="bg-orange-500/20 text-orange-400 px-3 py-2 rounded-lg flex items-center space-x-2">
                <Flag className="w-4 h-4" />
                <span className="text-sm font-medium">{moderatorRequests.length} Solicitações</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Navigation Tabs */}
      <div className="bg-slate-800/80 rounded-lg p-2 border border-slate-700">
        <div className="flex space-x-1">
          <button
            onClick={() => setActiveTab('chat')}
            className={`flex-1 flex items-center justify-center space-x-2 py-3 px-4 rounded-lg transition-colors ${
              activeTab === 'chat'
                ? 'bg-primary-600 text-white'
                : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
            }`}
          >
            <MessageSquare className="w-5 h-5" />
            <span>Chat</span>
          </button>
          <button
            onClick={() => setActiveTab('forum')}
            className={`flex-1 flex items-center justify-center space-x-2 py-3 px-4 rounded-lg transition-colors ${
              activeTab === 'forum'
                ? 'bg-primary-600 text-white'
                : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
            }`}
          >
            <BookOpen className="w-5 h-5" />
            <span>Fórum</span>
          </button>
          <button
            onClick={() => setActiveTab('friends')}
            className={`flex-1 flex items-center justify-center space-x-2 py-3 px-4 rounded-lg transition-colors ${
              activeTab === 'friends'
                ? 'bg-primary-600 text-white'
                : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
            }`}
          >
            <Users className="w-5 h-5" />
            <span>Amigos</span>
            {friendRequests.length > 0 && (
              <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                {friendRequests.length}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Chat Tab */}
      {activeTab === 'chat' && (
        <div className={`grid gap-10 ${showModeration && isAdmin ? 'grid-cols-1 lg:grid-cols-3' : 'grid-cols-1 lg:grid-cols-4'}`}>
          {/* Sidebar - Channels */}
          <div className="lg:col-span-1">
            <div className="bg-slate-800/80 rounded-lg p-6 border border-slate-700">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-white">
                  📋 Canais
                </h3>
                <button className="p-2 text-slate-400 hover:text-primary-400 transition-colors">
                  <Plus className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-2">
                {channels.map((channel) => (
                  <button
                    key={channel.id}
                    onClick={() => setActiveChannel(channel.id)}
                    className={`w-full flex items-center justify-between p-3 rounded-lg transition-colors ${
                      activeChannel === channel.id
                        ? 'bg-primary-600 text-white'
                        : 'hover:bg-slate-700/50 text-slate-300'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                      <div className="text-left">
                        <p className="font-medium">{channel.name}</p>
                        <p className="text-xs opacity-75">{channel.description}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-xs bg-slate-600 px-2 py-1 rounded">
                        {channel.members}
                      </span>
                      {channel.unread > 0 && (
                        <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                          {channel.unread}
                        </span>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Online Users */}
            <div className="bg-slate-800/80 rounded-lg p-6 border border-slate-700 mt-6">
              <h3 className="text-lg font-semibold text-white mb-4">
                👥 Online ({onlineUsers.filter(u => u.status === 'online').length})
              </h3>
              <div className="space-y-3">
                {onlineUsers.map((user) => (
                  <div key={user.id} className="flex items-center justify-between p-3 hover:bg-slate-700/50 rounded-lg transition-colors">
                    <div className="flex items-center space-x-3">
                      <div className="relative">
                        <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-purple-600 rounded-full flex items-center justify-center">
                          <span className="text-white font-bold text-sm">{user.avatar}</span>
                        </div>
                        <div className={`absolute -bottom-1 -right-1 w-3 h-3 ${getStatusColor(user.status)} rounded-full border-2 border-slate-800`}></div>
                      </div>
                      <div>
                        <p className="text-white font-medium text-sm">{user.name}</p>
                        <p className="text-slate-400 text-xs">{user.specialty} • {user.crm}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {!user.isFriend && (
                        <button
                          onClick={() => handleAddFriend(user.id)}
                          className="p-1 text-primary-400 hover:text-primary-300 hover:bg-primary-500/20 rounded transition-colors"
                          title="Adicionar amigo"
                        >
                          <UserPlus className="w-4 h-4" />
                        </button>
                      )}
                      <button className="p-1 text-green-400 hover:text-green-300 hover:bg-green-500/20 rounded transition-colors" title="Iniciar conversa">
                        <MessageSquare className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Chat Area */}
          <div className={`${showModeration && isAdmin ? 'lg:col-span-2' : 'lg:col-span-3'}`}>
            <div className="bg-slate-800/80 rounded-lg border border-slate-700 h-[600px] flex flex-col">
              {/* Chat Header */}
              <div className="p-4 border-b border-slate-700 bg-slate-700/50">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-white">
                      {channels.find(c => c.id === activeChannel)?.name}
                    </h3>
                    <p className="text-slate-400 text-sm">
                      {channels.find(c => c.id === activeChannel)?.members} membros
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    {!isAdmin && (
                      <button
                        onClick={() => setShowModeratorRequest(true)}
                        className="p-2 text-red-400 hover:text-red-300 hover:bg-red-500/20 rounded transition-colors"
                        title="Solicitar Moderador"
                      >
                        <Flag className="w-5 h-5" />
                      </button>
                    )}
                    <button className="p-2 text-slate-400 hover:text-primary-400 transition-colors">
                      <Video className="w-5 h-5" />
                    </button>
                    <button className="p-2 text-slate-400 hover:text-green-400 transition-colors">
                      <Phone className="w-5 h-5" />
                    </button>
                    <button className="p-2 text-slate-400 hover:text-purple-400 transition-colors">
                      <MoreVertical className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.map((msg) => (
                  <div key={msg.id} className="flex space-x-3">
                    <div className="relative">
                      <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-purple-600 rounded-full flex items-center justify-center">
                        <span className="text-white font-bold text-sm">{msg.userAvatar}</span>
                      </div>
                      {msg.isOnline && (
                        <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-slate-800"></div>
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <span className="text-white font-medium">{msg.user}</span>
                        <span className="text-slate-400 text-sm">{msg.crm}</span>
                        <span className="text-slate-500 text-sm">•</span>
                        <span className="text-slate-400 text-sm">{msg.specialty}</span>
                        <span className="text-slate-500 text-sm">•</span>
                        <span className="text-slate-400 text-sm">{msg.timestamp}</span>
                        {msg.isPinned && (
                          <Pin className="w-4 h-4 text-yellow-400" />
                        )}
                      </div>
                      <p className="text-slate-200 mb-2">{msg.message}</p>
                      <div className="flex items-center space-x-4">
                        <button className="flex items-center space-x-1 text-slate-400 hover:text-red-400 transition-colors">
                          <Heart className="w-4 h-4" />
                          <span className="text-sm">{msg.reactions.heart}</span>
                        </button>
                        <button className="flex items-center space-x-1 text-slate-400 hover:text-primary-400 transition-colors">
                          <ThumbsUp className="w-4 h-4" />
                          <span className="text-sm">{msg.reactions.thumbs}</span>
                        </button>
                        <button className="flex items-center space-x-1 text-slate-400 hover:text-green-400 transition-colors">
                          <Reply className="w-4 h-4" />
                          <span className="text-sm">{msg.reactions.reply}</span>
                        </button>
                        <button className="text-slate-400 hover:text-primary-400 transition-colors">
                          <UserPlus className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>

              {/* Message Input */}
              <div className="p-4 border-t border-slate-700">
                <div className="flex items-center space-x-3">
                  <button className="p-2 text-slate-400 hover:text-primary-400 transition-colors">
                    <Paperclip className="w-5 h-5" />
                  </button>
                  <div className="flex-1 relative">
                    <input
                      type="text"
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      onKeyPress={handleKeyPress}
                      placeholder="Digite sua mensagem..."
                      className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                  <button className="p-2 text-slate-400 hover:text-yellow-400 transition-colors">
                    <Smile className="w-5 h-5" />
                  </button>
                  <button
                    onClick={isRecording ? () => setIsRecording(false) : startRecording}
                    className={`p-2 transition-colors ${
                      isRecording 
                        ? 'text-red-400 hover:text-red-300' 
                        : 'text-slate-400 hover:text-red-400'
                    }`}
                  >
                    {isRecording ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                  </button>
                  <button
                    onClick={handleSendMessage}
                    className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-3 rounded-lg transition-colors"
                  >
                    <Send className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Painel de Moderação Integrado (apenas para admins) */}
          {showModeration && isAdmin && (
            <div className="lg:col-span-1">
              <div className="bg-slate-800/80 rounded-lg p-6 border border-slate-700 h-[600px] overflow-y-auto">
                <h3 className="text-lg font-semibold text-white mb-4">🛡️ Moderação</h3>
                
                {/* Solicitações Pendentes */}
                <div className="mb-6">
                  <h4 className="text-sm font-semibold text-slate-300 mb-3">
                    📨 Solicitações ({moderatorRequests.length})
                  </h4>
                  <div className="space-y-3 max-h-40 overflow-y-auto">
                    {moderatorRequests.map((request) => (
                      <div key={request.id} className="bg-slate-700/50 rounded-lg p-3">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="text-white text-sm font-medium">{request.requester_name}</div>
                            <div className="text-slate-400 text-xs mb-2">{request.reason}</div>
                            <div className="text-slate-500 text-xs">{request.channel}</div>
                          </div>
                          <div className="flex space-x-1">
                            <button
                              onClick={() => handleRespondToRequest(request.id, 'accept')}
                              className="bg-green-600 hover:bg-green-700 text-white px-2 py-1 rounded text-xs"
                            >
                              ✓
                            </button>
                            <button
                              onClick={() => handleRespondToRequest(request.id, 'decline')}
                              className="bg-red-600 hover:bg-red-700 text-white px-2 py-1 rounded text-xs"
                            >
                              ✗
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                    {moderatorRequests.length === 0 && (
                      <p className="text-slate-400 text-xs text-center py-2">Nenhuma solicitação</p>
                    )}
                  </div>
                </div>

                {/* Estatísticas Rápidas */}
                <div className="mb-6">
                  <h4 className="text-sm font-semibold text-slate-300 mb-3">📊 Estatísticas</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-400">Usuários Online</span>
                      <span className="text-green-400 font-bold">{onlineUsers.length}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-400">Mensagens Hoje</span>
                      <span className="text-primary-400 font-bold">{messages.length}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-400">Canal Ativo</span>
                      <span className="text-purple-400 font-bold">{activeChannel}</span>
                    </div>
                  </div>
                </div>

                {/* Ações Rápidas */}
                <div>
                  <h4 className="text-sm font-semibold text-slate-300 mb-3">⚡ Ações Rápidas</h4>
                  <div className="space-y-2">
                    <button className="w-full bg-primary-600 hover:bg-primary-700 text-white py-2 px-3 rounded text-xs">
                      📊 Ver Analytics
                    </button>
                    <button className="w-full bg-yellow-600 hover:bg-yellow-700 text-white py-2 px-3 rounded text-xs">
                      🚨 Reportes
                    </button>
                    <button className="w-full bg-purple-600 hover:bg-purple-700 text-white py-2 px-3 rounded text-xs">
                      👥 Usuários
                    </button>
                    <button className="w-full bg-green-600 hover:bg-green-700 text-white py-2 px-3 rounded text-xs">
                      📈 Estatísticas
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Forum Tab */}
      {activeTab === 'forum' && (
        <div className="space-y-8">
          {/* Forum Header */}
          <div className="bg-slate-800/80 rounded-lg p-6 border border-slate-700">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-2xl font-bold text-white mb-2">🏛️ Fórum Profissional</h2>
                <p className="text-slate-300">Debates, discussões e troca de conhecimento entre profissionais</p>
              </div>
              <button className="bg-primary-600 hover:bg-primary-700 text-white px-6 py-3 rounded-lg flex items-center space-x-2 transition-colors">
                <Plus className="w-5 h-5" />
                <span>Novo Debate</span>
              </button>
            </div>

            {/* Search and Filters */}
            <div className="flex space-x-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Buscar debates..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
              <button className="px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-slate-300 hover:text-white hover:bg-slate-600 transition-colors flex items-center space-x-2">
                <Filter className="w-5 h-5" />
                <span>Filtros</span>
              </button>
            </div>
          </div>

          {/* Debates List */}
          <div className="space-y-4">
            {debates.map((debate) => (
              <div key={debate.id} className="bg-slate-800/80 rounded-lg p-6 border border-slate-700 hover:bg-slate-800/90 transition-colors">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h3 className="text-lg font-semibold text-white">{debate.title}</h3>
                      {debate.isPinned && <Pin className="w-5 h-5 text-yellow-400" />}
                      {debate.isHot && <TrendingUp className="w-5 h-5 text-red-400" />}
                      {debate.isActive && (
                        <div className="flex items-center space-x-1">
                          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                          <span className="text-green-400 text-sm font-medium">ONLINE</span>
                        </div>
                      )}
                      {debate.isPasswordProtected && (
                        <div className="flex items-center space-x-1">
                          <Lock className="w-4 h-4 text-primary-400" />
                          <span className="text-primary-400 text-sm">Protegido</span>
                        </div>
                      )}
                    </div>
                    <p className="text-slate-300 text-sm mb-3">{debate.description}</p>
                    <div className="flex flex-wrap gap-2 mb-3">
                      {debate.tags.map((tag, index) => (
                        <span key={index} className="px-2 py-1 bg-primary-500/20 text-primary-400 text-xs rounded-full">
                          {tag}
                        </span>
                      ))}
                    </div>
                    <div className="flex items-center space-x-4 text-sm text-slate-400">
                      <div className="flex items-center space-x-1">
                        <div className="w-6 h-6 bg-gradient-to-br from-primary-500 to-purple-600 rounded-full flex items-center justify-center">
                          <span className="text-white font-bold text-xs">{debate.authorAvatar}</span>
                        </div>
                        <span>{debate.author}</span>
                      </div>
                      <span>•</span>
                      <span>{debate.category}</span>
                      <span>•</span>
                      <span>{debate.participants} participantes</span>
                      <span>•</span>
                      <span>{debate.views} visualizações</span>
                      <span>•</span>
                      <span>{debate.lastActivity}</span>
                    </div>
                  </div>
                  <div className="flex flex-col items-end space-y-2">
                    <div className={`flex items-center space-x-1 ${getVoteColor(debate.votes)}`}>
                      <ThumbsUp className="w-4 h-4" />
                      <span className="text-sm font-medium">{debate.votes.up}</span>
                      <ThumbsDown className="w-4 h-4" />
                      <span className="text-sm font-medium">{debate.votes.down}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button 
                        onClick={() => handleOpenDebate(debate.id)}
                        className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg flex items-center space-x-2 transition-colors"
                      >
                        <MessageSquare className="w-4 h-4" />
                        <span>Participar</span>
                      </button>
                      <button className="p-2 text-slate-400 hover:text-primary-400 transition-colors">
                        <Eye className="w-4 h-4" />
                      </button>
                      <button className="p-2 text-slate-400 hover:text-green-400 transition-colors">
                        <Reply className="w-4 h-4" />
                      </button>
                      <button className="p-2 text-slate-400 hover:text-purple-400 transition-colors">
                        <Share2 className="w-4 h-4" />
                      </button>
                      <button className="p-2 text-slate-400 hover:text-red-400 transition-colors">
                        <Flag className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Friends Tab */}
      {activeTab === 'friends' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
          {/* Friend Requests */}
          <div className="bg-slate-800/80 rounded-lg p-6 border border-slate-700">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-white">
                📨 Solicitações de Amizade ({friendRequests.length})
              </h3>
              <button
                onClick={() => setShowFriendRequests(!showFriendRequests)}
                className="text-primary-400 hover:text-primary-300 text-sm"
              >
                {showFriendRequests ? 'Ocultar' : 'Ver Todas'}
              </button>
            </div>

            <div className="space-y-4">
              {friendRequests.map((request) => (
                <div key={request.id} className="p-4 bg-slate-700/50 rounded-lg">
                  <div className="flex items-start space-x-3 mb-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-purple-600 rounded-full flex items-center justify-center">
                      <span className="text-white font-bold">{request.avatar}</span>
                    </div>
                    <div className="flex-1">
                      <h4 className="text-white font-medium">{request.name}</h4>
                      <p className="text-slate-400 text-sm">{request.specialty} • {request.crm}</p>
                      <p className="text-slate-300 text-sm mt-1">{request.message}</p>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleAcceptFriend(request.id)}
                      className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-lg flex items-center justify-center space-x-2 transition-colors"
                    >
                      <Check className="w-4 h-4" />
                      <span>Aceitar</span>
                    </button>
                    <button
                      onClick={() => handleRejectFriend(request.id)}
                      className="flex-1 bg-red-600 hover:bg-red-700 text-white py-2 px-4 rounded-lg flex items-center justify-center space-x-2 transition-colors"
                    >
                      <X className="w-4 h-4" />
                      <span>Recusar</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* My Friends */}
          <div className="bg-slate-800/80 rounded-lg p-6 border border-slate-700">
            <h3 className="text-lg font-semibold text-white mb-6">
              👥 Meus Amigos ({onlineUsers.filter(u => u.isFriend).length})
            </h3>

            <div className="space-y-3">
              {onlineUsers.filter(u => u.isFriend).map((friend) => (
                <div key={friend.id} className="flex items-center justify-between p-3 hover:bg-slate-700/50 rounded-lg transition-colors">
                  <div className="flex items-center space-x-3">
                    <div className="relative">
                      <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-purple-600 rounded-full flex items-center justify-center">
                        <span className="text-white font-bold text-sm">{friend.avatar}</span>
                      </div>
                      <div className={`absolute -bottom-1 -right-1 w-3 h-3 ${getStatusColor(friend.status)} rounded-full border-2 border-slate-800`}></div>
                    </div>
                    <div>
                      <p className="text-white font-medium text-sm">{friend.name}</p>
                      <p className="text-slate-400 text-xs">{friend.specialty} • {friend.crm}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button className="p-1 text-green-400 hover:text-green-300 hover:bg-green-500/20 rounded transition-colors" title="Conversar">
                      <MessageSquare className="w-4 h-4" />
                    </button>
                    <button className="p-1 text-primary-400 hover:text-primary-300 hover:bg-primary-500/20 rounded transition-colors" title="Videochamada">
                      <Video className="w-4 h-4" />
                    </button>
                    <button className="p-1 text-purple-400 hover:text-purple-300 hover:bg-purple-500/20 rounded transition-colors" title="Mais opções">
                      <MoreVertical className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Modal para Solicitar Moderador */}
      {showModeratorRequest && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-slate-800 rounded-lg p-6 w-full max-w-md mx-4">
            <h3 className="text-xl font-bold text-white mb-4">🚨 Solicitar Moderador</h3>
            <p className="text-slate-300 mb-4">
              Descreva brevemente o motivo da solicitação. Um moderador será notificado e entrará no chat.
            </p>
            <textarea
              value={requestReason}
              onChange={(e) => setRequestReason(e.target.value)}
              placeholder="Ex: Discussão acalorada, usuário inadequado, dúvida técnica complexa..."
              rows={4}
              className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-red-500 mb-4"
            />
            <div className="flex space-x-3">
              <button
                onClick={handleRequestModerator}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white py-2 px-4 rounded-lg transition-colors"
              >
                Enviar Solicitação
              </button>
              <button
                onClick={() => {
                  setShowModeratorRequest(false)
                  setRequestReason('')
                }}
                className="flex-1 bg-slate-600 hover:bg-slate-700 text-white py-2 px-4 rounded-lg transition-colors"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Painel de Moderação (apenas para admins) */}
      {showModeration && isAdmin && (
        <div className="bg-slate-800/80 rounded-lg p-6 border border-slate-700">
          <h3 className="text-xl font-bold text-white mb-6">🛡️ Painel de Moderação</h3>
          
          {/* Solicitações Pendentes */}
          <div className="mb-6">
            <h4 className="text-lg font-semibold text-white mb-4">
              📨 Solicitações de Moderador ({moderatorRequests.length})
            </h4>
            <div className="space-y-4">
              {moderatorRequests.map((request) => (
                <div key={request.id} className="bg-slate-700/50 rounded-lg p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <span className="text-white font-medium">{request.requester_name}</span>
                        <span className="text-slate-400 text-sm">•</span>
                        <span className="text-slate-400 text-sm">Canal: {request.channel}</span>
                        <span className="bg-red-500/20 text-red-400 px-2 py-1 rounded-full text-xs">
                          {request.priority}
                        </span>
                      </div>
                      <p className="text-slate-300 text-sm mb-2">{request.reason}</p>
                      <p className="text-slate-400 text-xs">
                        {new Date(request.created_at).toLocaleString()}
                      </p>
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleRespondToRequest(request.id, 'accept')}
                        className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-sm transition-colors"
                      >
                        Aceitar
                      </button>
                      <button
                        onClick={() => handleRespondToRequest(request.id, 'decline')}
                        className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-sm transition-colors"
                      >
                        Recusar
                      </button>
                    </div>
                  </div>
                </div>
              ))}
              {moderatorRequests.length === 0 && (
                <p className="text-slate-400 text-center py-4">Nenhuma solicitação pendente</p>
              )}
            </div>
          </div>

          {/* Estatísticas de Moderação */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-slate-700/50 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-red-400 mb-1">
                {moderatorRequests.length}
              </div>
              <div className="text-slate-300 text-sm">Solicitações Pendentes</div>
            </div>
            <div className="bg-slate-700/50 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-green-400 mb-1">
                {onlineUsers.filter(u => u.is_admin).length}
              </div>
              <div className="text-slate-300 text-sm">Moderadores Online</div>
            </div>
            <div className="bg-slate-700/50 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-primary-400 mb-1">
                {onlineUsers.length}
              </div>
              <div className="text-slate-300 text-sm">Usuários Online</div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default ChatGlobal