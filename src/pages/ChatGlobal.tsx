import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useNavigate, useLocation } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import type { UserType } from '../lib/userTypes'
import { useNoaPlatform } from '../contexts/NoaPlatformContext'

// Declaração do tipo para BroadcastChannel
declare global {
  interface Window {
    offlineChannel?: BroadcastChannel
  }
}
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

type CommunityPanelId = 'news' | 'partnerships' | 'sponsors' | 'supporters'

type CommunityPanelConfig = {
  title: string
  icon: React.ElementType
  iconColor: string
  content: React.ReactNode
}

const COMMUNITY_PANEL_TABS: { id: CommunityPanelId; label: string }[] = [
  { id: 'news', label: 'Notícias' },
  { id: 'partnerships', label: 'Parcerias' },
  { id: 'sponsors', label: 'Patrocinadores' },
  { id: 'supporters', label: 'Apoiadores' }
]

type ChannelPermissionConfig = {
  id: string
  name: string
  type: 'public' | 'private'
  description: string
  members: number
  unread: number
  allowedRoles: UserType[]
  postRoles: UserType[]
}

type ChannelWithAccess = ChannelPermissionConfig & {
  canView: boolean
  canPost: boolean
  isReadOnly: boolean
}

type DebateConfig = {
  id: number
  title: string
  author: string
  authorAvatar: string
  category: string
  participants: number
  views: number
  replies: number
  votes: { up: number; down: number }
  tags: string[]
  lastActivity: string
  isPinned: boolean
  isHot: boolean
  isActive: boolean
  isPasswordProtected: boolean
  description: string
  allowedRoles: UserType[]
  postRoles: UserType[]
}

const BASE_CHANNELS: ChannelPermissionConfig[] = [
  {
    id: 'general',
    name: 'Geral',
    type: 'public',
    members: 0,
    unread: 0,
    description: 'Discussões gerais sobre medicina',
    allowedRoles: ['admin', 'profissional', 'aluno', 'paciente'],
    postRoles: ['admin', 'profissional', 'aluno', 'paciente']
  },
  {
    id: 'cannabis',
    name: 'Cannabis Medicinal',
    type: 'public',
    members: 0,
    unread: 0,
    description: 'Especialistas em cannabis medicinal',
    allowedRoles: ['admin', 'profissional', 'aluno'],
    postRoles: ['admin', 'profissional', 'aluno']
  },
  {
    id: 'clinical',
    name: 'Casos Clínicos',
    type: 'public',
    members: 0,
    unread: 0,
    description: 'Discussão de casos complexos',
    allowedRoles: ['admin', 'profissional', 'aluno'],
    postRoles: ['admin', 'profissional']
  },
  {
    id: 'research',
    name: 'Pesquisa',
    type: 'public',
    members: 0,
    unread: 0,
    description: 'Pesquisas e estudos recentes',
    allowedRoles: ['admin', 'profissional', 'aluno'],
    postRoles: ['admin', 'profissional', 'aluno']
  },
  {
    id: 'support',
    name: 'Suporte',
    type: 'private',
    members: 0,
    unread: 0,
    description: 'Suporte técnico e ajuda',
    allowedRoles: ['admin', 'profissional', 'aluno', 'paciente'],
    postRoles: ['admin', 'profissional', 'paciente']
  }
]

const BASE_DEBATES: DebateConfig[] = [
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
    description:
      'Discussão sobre a eficácia comparativa entre CBD e THC no tratamento da dor crônica, baseada em evidências clínicas recentes.',
    allowedRoles: ['admin', 'profissional', 'aluno'],
    postRoles: ['admin', 'profissional']
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
    description: 'Compartilhamento de protocolos seguros para dosagem de cannabis em pacientes da terceira idade.',
    allowedRoles: ['admin', 'profissional'],
    postRoles: ['admin', 'profissional']
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
    description: 'Análise de casos reais de interações medicamentosas com cannabis e estratégias de prevenção.',
    allowedRoles: ['admin', 'profissional', 'aluno'],
    postRoles: ['admin', 'profissional']
  }
]

const ChatGlobal: React.FC = () => {
  const { user } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const { sendInitialMessage } = useNoaPlatform()
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
  const [realtimeSubscription, setRealtimeSubscription] = useState<any>(null)
  const [showModeratorRequest, setShowModeratorRequest] = useState(false)
  const [requestReason, setRequestReason] = useState('')
  const [friendRequests, setFriendRequests] = useState<any[]>([])
  const [isSending, setIsSending] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const messagesContainerRef = useRef<HTMLDivElement>(null)
  const [preselectedForumTopic, setPreselectedForumTopic] = useState<string | null>(
    'Protocolos Clínicos Integrados - Integração Cannabis & Nefrologia'
  )
  const promptHandledRef = useRef(false)
  const [showGuidelines, setShowGuidelines] = useState(false)
  const [showCommunityColumn, setShowCommunityColumn] = useState(true)
  const [activeCommunityPanel, setActiveCommunityPanel] = useState<CommunityPanelId>('news')

  const headerGradient = 'linear-gradient(135deg, #0A192F 0%, #1a365d 55%, #2d5a3d 100%)'
  const accentGradient = 'linear-gradient(135deg, #00C16A 0%, #13794f 100%)'
  const secondaryGradient = 'linear-gradient(135deg, #1a365d 0%, #274a78 100%)'
  const bannerGradient = 'linear-gradient(135deg, rgba(0,193,106,0.18) 0%, rgba(16,49,91,0.35) 50%, rgba(7,22,41,0.82) 100%)'
  const bannerSurface: React.CSSProperties = {
    background: 'rgba(7,22,41,0.88)',
    border: '1px solid rgba(0,193,106,0.12)',
    boxShadow: '0 18px 42px rgba(2,12,27,0.45)'
  }

  const [channels, setChannels] = useState<ChannelPermissionConfig[]>(() =>
    BASE_CHANNELS.map(channel => ({ ...channel }))
  )
  const userType: UserType = user?.type ?? 'paciente'

  const gridColumnsClass = useMemo(() => {
    if (showModeration && isAdmin) {
      return 'grid-cols-1 lg:grid-cols-3'
    }
    return showCommunityColumn ? 'grid-cols-1 lg:grid-cols-4' : 'grid-cols-1 lg:grid-cols-3'
  }, [showModeration, isAdmin, showCommunityColumn])

  const communityPanelConfig = useMemo<CommunityPanelConfig>(() => {
    switch (activeCommunityPanel) {
      case 'partnerships':
        return {
          title: '🤝 Parcerias',
          icon: Users,
          iconColor: 'text-green-400',
          content: (
                  <div className="space-y-3">
                    <div className="rounded-lg p-4 border" style={{ background: 'rgba(15, 36, 60, 0.7)', borderColor: 'rgba(0, 193, 106, 0.12)' }}>
                      <h4 className="text-white font-medium text-sm mb-1">Associação Brasileira de Cannabis Medicinal</h4>
                      <p className="text-slate-400 text-xs">Parceria estratégica para desenvolvimento de protocolos clínicos</p>
                    </div>
                    <div className="rounded-lg p-4 border" style={{ background: 'rgba(15, 36, 60, 0.7)', borderColor: 'rgba(0, 193, 106, 0.12)' }}>
                      <h4 className="text-white font-medium text-sm mb-1">Sociedade Brasileira de Neurologia</h4>
                      <p className="text-slate-400 text-xs">Colaboração em pesquisas sobre epilepsia e TEA</p>
                    </div>
                    <div className="rounded-lg p-4 border" style={{ background: 'rgba(15, 36, 60, 0.7)', borderColor: 'rgba(0, 193, 106, 0.12)' }}>
                      <h4 className="text-white font-medium text-sm mb-1">Instituto de Pesquisa em Cannabis</h4>
                      <p className="text-slate-400 text-xs">Programa conjunto de estudos clínicos</p>
                    </div>
                  </div>
          )
        }
      case 'sponsors':
        return {
          title: '⭐ Patrocinadores',
          icon: Award,
          iconColor: 'text-yellow-400',
          content: (
                  <div className="space-y-3">
                    <div className="rounded-lg p-4 border" style={{ background: 'rgba(15, 36, 60, 0.7)', borderColor: 'rgba(0, 193, 106, 0.12)' }}>
                      <div className="flex items-center space-x-3 mb-1">
                        <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: 'rgba(0, 193, 106, 0.2)', border: '1px solid rgba(0, 193, 106, 0.3)' }}>
                          <span className="text-white font-bold text-sm">P1</span>
                        </div>
                        <div>
                          <h4 className="text-white font-medium text-sm">Patrocinador Platinum</h4>
                          <p className="text-slate-400 text-xs">Apoio ao desenvolvimento da plataforma</p>
                        </div>
                      </div>
                    </div>
                    <div className="rounded-lg p-4 border" style={{ background: 'rgba(15, 36, 60, 0.7)', borderColor: 'rgba(0, 193, 106, 0.12)' }}>
                      <div className="flex items-center space-x-3 mb-1">
                        <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: 'rgba(0, 193, 106, 0.2)', border: '1px solid rgba(0, 193, 106, 0.3)' }}>
                          <span className="text-white font-bold text-sm">P2</span>
                        </div>
                        <div>
                          <h4 className="text-white font-medium text-sm">Patrocinador Gold</h4>
                          <p className="text-slate-400 text-xs">Suporte à pesquisa e desenvolvimento</p>
                        </div>
                      </div>
                    </div>
                  </div>
          )
        }
      case 'supporters':
        return {
          title: '❤️ Apoiadores',
          icon: Heart,
          iconColor: 'text-red-400',
          content: (
            <div className="space-y-3">
                    <div className="rounded-lg p-4 border" style={{ background: 'rgba(15, 36, 60, 0.7)', borderColor: 'rgba(0, 193, 106, 0.12)' }}>
                      <h4 className="text-white font-medium text-sm mb-1">Fundação de Apoio à Pesquisa</h4>
                      <p className="text-slate-400 text-xs">Apoio institucional</p>
                    </div>
                    <div className="rounded-lg p-4 border" style={{ background: 'rgba(15, 36, 60, 0.7)', borderColor: 'rgba(0, 193, 106, 0.12)' }}>
                      <h4 className="text-white font-medium text-sm mb-1">Associação de Pacientes</h4>
                      <p className="text-slate-400 text-xs">Comunidade de apoio</p>
                    </div>
                    <div className="rounded-lg p-4 border" style={{ background: 'rgba(15, 36, 60, 0.7)', borderColor: 'rgba(0, 193, 106, 0.12)' }}>
                      <h4 className="text-white font-medium text-sm mb-1">Instituto de Tecnologia em Saúde</h4>
                      <p className="text-slate-400 text-xs">Suporte tecnológico</p>
                    </div>
            </div>
          )
        }
      case 'news':
      default:
        return {
          title: '📰 Notícias',
          icon: BookOpen,
          iconColor: 'text-primary-400',
          content: (
            <div className="space-y-3">
              <article className="bg-slate-700/50 rounded-lg p-4 hover:bg-slate-700/70 transition-colors">
                <h4 className="text-white font-medium text-sm mb-1">Novo protocolo de Cannabis Medicinal aprovado pela ANVISA</h4>
                <p className="text-slate-400 text-xs mb-1">A ANVISA aprovou um novo protocolo para uso de cannabis medicinal em pacientes com epilepsia refratária...</p>
                <span className="text-slate-500 text-xs">15/01/2025</span>
              </article>
              <article className="bg-slate-700/50 rounded-lg p-4 hover:bg-slate-700/70 transition-colors">
                <h4 className="text-white font-medium text-sm mb-1">Pesquisa mostra eficácia do CBD em casos de TEA</h4>
                <p className="text-slate-400 text-xs mb-1">Estudo publicado na Nature Medicine mostra resultados promissores...</p>
                <span className="text-slate-500 text-xs">12/01/2025</span>
              </article>
              <article className="bg-slate-700/50 rounded-lg p-4 hover:bg-slate-700/70 transition-colors">
                <h4 className="text-white font-medium text-sm mb-1">Curso de Pós-graduação em Cannabis Medicinal - Novas Turmas</h4>
                <p className="text-slate-400 text-xs mb-1">Inscrições abertas para a próxima turma do curso de especialização...</p>
                <span className="text-slate-500 text-xs">10/01/2025</span>
              </article>
            </div>
          )
        }
    }
  }, [activeCommunityPanel])
  const PanelIcon = communityPanelConfig.icon

  const channelsWithAccess: ChannelWithAccess[] = useMemo(() => {
    return channels.map(channel => {
      const canView = channel.allowedRoles.includes(userType)
      const canPost = canView && channel.postRoles.includes(userType)
      return {
        ...channel,
        canView,
        canPost,
        isReadOnly: canView && !canPost
      }
    })
  }, [channels, userType])

  const accessibleChannels = useMemo(
    () => channelsWithAccess.filter(channel => channel.canView),
    [channelsWithAccess]
  )

  const activeChannelData = useMemo(
    () => channelsWithAccess.find(channel => channel.id === activeChannel),
    [channelsWithAccess, activeChannel]
  )

  useEffect(() => {
    if (!accessibleChannels.length) {
      return
    }
    const isActiveAccessible = accessibleChannels.some(channel => channel.id === activeChannel)
    if (!isActiveAccessible) {
      setActiveChannel(accessibleChannels[0].id)
    }
  }, [accessibleChannels, activeChannel])

  const debatesForUser = useMemo(() => {
    return BASE_DEBATES.filter(debate => debate.allowedRoles.includes(userType))
  }, [userType])

  const filteredDebates = useMemo(() => {
    const term = searchTerm.toLowerCase().trim()
    if (!term) return debatesForUser
    return debatesForUser.filter(debate =>
      debate.title.toLowerCase().includes(term) ||
      debate.tags.some(tag => tag.toLowerCase().includes(term)) ||
      debate.category.toLowerCase().includes(term)
    )
  }, [debatesForUser, searchTerm])

  // Verificar se é admin
  useEffect(() => {
    if (user?.type === 'admin') {
      setIsAdmin(true)
    }
  }, [user])

  // Carregar dados dos canais
  const loadChannelsData = async () => {
    try {
      const { data, error } = await supabase
        .from('chat_messages')
        .select('channel, user_id, created_at')
        .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())

      if (error) {
        console.error('Erro ao carregar dados dos canais:', error)
        return
      }

      // Contar membros únicos por canal
      const channelData = channels.map(channel => {
        const channelMessages = data?.filter(msg => msg.channel === channel.id) || []
        const uniqueUsers = new Set(channelMessages.map(msg => msg.user_id))
        const recentMessages = channelMessages.filter(msg => 
          new Date(msg.created_at) > new Date(Date.now() - 60 * 60 * 1000) // Última hora
        )

        return {
          ...channel,
          members: uniqueUsers.size,
          unread: recentMessages.length
        }
      })

      setChannels(channelData)
    } catch (error) {
      console.error('Erro ao carregar dados dos canais:', error)
    }
  }

  // Carregar usuários online
  const loadOnlineUsers = async () => {
    try {
      // Tentar buscar com estrutura antiga (user_id) primeiro
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString()
      let data: any[] = []
      let error: any = null

      // Tentar com user_id (estrutura antiga)
      const result1 = await supabase
        .from('chat_messages')
        .select('user_id, user_name, user_avatar, crm, specialty, is_online, created_at')
        .gte('created_at', fiveMinutesAgo)
        .order('created_at', { ascending: false })

      if (result1.error) {
        // Se falhar, tentar com sender_id (estrutura nova)
        const result2 = await supabase
          .from('chat_messages')
          .select('sender_id, created_at')
          .gte('created_at', fiveMinutesAgo)
          .order('created_at', { ascending: false })
          .limit(50)

        if (result2.error) {
          console.warn('Erro ao carregar usuários online (fallback para modo offline):', result2.error)
          loadOnlineUsersOffline()
          return
        }

        // Se usar sender_id, buscar dados dos usuários na tabela users
        const senderIds = [...new Set((result2.data || []).map((msg: any) => msg.sender_id).filter(Boolean))]
        if (senderIds.length > 0) {
          const { data: usersData } = await supabase
            .from('users')
            .select('id, name, crm, specialty')
            .in('id', senderIds)

          data = (usersData || []).map((u: any) => ({
            user_id: u.id,
            user_name: u.name || 'Usuário',
            user_avatar: 'U',
            crm: u.crm || '',
            specialty: u.specialty || '',
            is_online: true
          }))
        }
      } else {
        data = result1.data || []
      }

      const uniqueUsers = data
        .filter(msg => msg.is_online !== false)
        .reduce((acc, msg) => {
          if (!acc.find((user: any) => user.id === msg.user_id)) {
            acc.push({
              id: msg.user_id,
              name: msg.user_name,
              avatar: msg.user_avatar || 'U',
              crm: msg.crm || '',
              specialty: msg.specialty || '',
              status: 'online'
            })
          }
          return acc
        }, [] as any[])

      if (user && !uniqueUsers.find((u: any) => u.id === user.id)) {
        uniqueUsers.unshift({
          id: user.id,
          name: user.name || 'Usuário',
          avatar: 'U',
          crm: user.crm || '',
          specialty: '',
          status: 'online'
        })
      }

      setOnlineUsers(uniqueUsers)
    } catch (error) {
      console.error('Erro ao carregar usuários online (fallback para offline):', error)
      loadOnlineUsersOffline()
    }
  }

  // Carregar mensagens do canal ativo
  useEffect(() => {
    console.log('🔄 useEffect executando - carregando dados do chat (OFFLINE) - activeChannel:', activeChannel)
    
    // Chat offline - sem Supabase
    loadMessagesOffline()
    setupOfflineRealtime()
    loadChannelsDataOffline()
    loadOnlineUsersOffline()
  }, [activeChannel]) // Mantém apenas activeChannel como dependência

  useEffect(() => {
    const params = new URLSearchParams(location.search)
    const tabParam = params.get('tab')
    if (tabParam === 'forum' || tabParam === 'friends' || tabParam === 'chat') {
      setActiveTab(tabParam)
    }

    const topicParam = params.get('topic')
    if (topicParam) {
      setPreselectedForumTopic(topicParam)
    } else {
      setPreselectedForumTopic('Protocolos Clínicos Integrados - Integração Cannabis & Nefrologia')
    }

    const promptParam = params.get('prompt')
    if (promptParam && !promptHandledRef.current) {
      sendInitialMessage?.(promptParam)
      promptHandledRef.current = true
      params.delete('prompt')
      const newSearch = params.toString()
      navigate(
        {
          pathname: location.pathname,
          search: newSearch ? `?${newSearch}` : ''
        },
        { replace: true }
      )
    } else if (!promptParam) {
      promptHandledRef.current = false
    }
  }, [location.pathname, location.search, navigate, sendInitialMessage])

  // Configurar tempo real para mensagens
  const setupRealtimeSubscription = () => {
    // Limpar subscription anterior
    if (realtimeSubscription) {
      supabase.removeChannel(realtimeSubscription)
    }

    // Configurar nova subscription
    const subscription = supabase
      .channel(`chat_messages_${activeChannel}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'chat_messages',
        filter: `channel=eq.${activeChannel}`
      }, (payload) => {
        console.log('📨 Nova mensagem recebida:', payload.new)
        // Adicionar nova mensagem à lista
        setMessages(prev => [...prev, payload.new])
        // Scroll para baixo
        scrollToBottom()
      })
      .on('postgres_changes', {
        event: 'DELETE',
        schema: 'public',
        table: 'chat_messages',
        filter: `channel=eq.${activeChannel}`
      }, (payload) => {
        console.log('🗑️ Mensagem removida:', payload.old)
        // Remover mensagem da lista
        setMessages(prev => prev.filter(msg => msg.id !== payload.old.id))
      })
      .subscribe()

    setRealtimeSubscription(subscription)
  }

  // Carregar usuários online
  useEffect(() => {
    console.log('🔄 Carregando usuários online - executando uma vez')
    loadOnlineUsers()
  }, []) // Array vazio garante que executa apenas uma vez

  // Carregar solicitações de moderador (apenas para admins)
  useEffect(() => {
    if (isAdmin) {
      loadModeratorRequests()
    }
  }, [isAdmin])

  // Limpeza da subscription ao desmontar
  useEffect(() => {
    return () => {
      if (realtimeSubscription) {
        supabase.removeChannel(realtimeSubscription)
      }
    }
  }, [realtimeSubscription])

  // Limpeza automática de mensagens antigas (24 horas)
  useEffect(() => {
    const cleanupOldMessages = async () => {
      try {
        const twentyFourHoursAgo = new Date()
        twentyFourHoursAgo.setHours(twentyFourHoursAgo.getHours() - 24)
        
        // Deletar mensagens antigas
        const { error } = await supabase
          .from('chat_messages')
          .delete()
          .lt('created_at', twentyFourHoursAgo.toISOString())

        if (error) {
          console.error('Erro ao limpar mensagens antigas:', error)
        } else {
          console.log('🧹 Mensagens antigas removidas automaticamente')
        }
      } catch (error) {
        console.error('Erro na limpeza automática:', error)
      }
    }

    // Executar limpeza a cada hora
    const cleanupInterval = setInterval(cleanupOldMessages, 60 * 60 * 1000)
    
    // Executar limpeza imediatamente
    cleanupOldMessages()

    return () => clearInterval(cleanupInterval)
  }, [])

  const loadMessages = async () => {
    try {
      // Carregar apenas mensagens das últimas 24 horas
      const twentyFourHoursAgo = new Date()
      twentyFourHoursAgo.setHours(twentyFourHoursAgo.getHours() - 24)
      
      const { data, error } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('channel', activeChannel)
        .gte('created_at', twentyFourHoursAgo.toISOString())
        .order('created_at', { ascending: true })
        .limit(100)

      if (error) {
        console.error('Erro ao carregar mensagens:', error)
        return
      }

      setMessages(data || [])
      scrollToBottom()
    } catch (error) {
      console.error('Erro ao carregar mensagens:', error)
    }
  }

  // Chat offline - carregar mensagens do localStorage
  const loadMessagesOffline = () => {
    console.log('🔄 Carregando mensagens offline do canal:', activeChannel)
    try {
      const storedMessages = localStorage.getItem(`chat_messages_${activeChannel}`)
      const messages = storedMessages ? JSON.parse(storedMessages) : []
      
      console.log('📨 Mensagens offline encontradas:', messages.length)
      console.log('📨 Dados das mensagens:', messages)
      
      setMessages(messages)
      scrollToBottom()
    } catch (error) {
      console.error('Erro ao carregar mensagens offline:', error)
      setMessages([])
    }
  }

  // Chat offline - salvar mensagem no localStorage
  const saveMessageOffline = (message: any) => {
    try {
      const storedMessages = localStorage.getItem(`chat_messages_${activeChannel}`)
      const messages = storedMessages ? JSON.parse(storedMessages) : []
      
      const newMessage = {
        ...message,
        id: Date.now().toString(),
        created_at: new Date().toISOString()
      }
      
      messages.push(newMessage)
      localStorage.setItem(`chat_messages_${activeChannel}`, JSON.stringify(messages))
      
      console.log('💾 Mensagem salva offline:', newMessage)
      return newMessage
    } catch (error) {
      console.error('Erro ao salvar mensagem offline:', error)
      return null
    }
  }

  // Chat offline - tempo real com BroadcastChannel
  const setupOfflineRealtime = () => {
    console.log('🔄 Configurando tempo real offline')
    
    // Evitar re-criação se já existe
    if (window.offlineChannel) {
      return
    }
    
    // Criar novo canal
    window.offlineChannel = new BroadcastChannel('medcannlab-chat')
    
    window.offlineChannel.onmessage = (event) => {
      if (event.data.type === 'new_message' && event.data.channel === activeChannel) {
        console.log('📨 Nova mensagem recebida via BroadcastChannel:', event.data.message)
        setMessages(prev => [...prev, event.data.message])
        scrollToBottom()
      }
    }
  }

  // Chat offline - carregar dados dos canais
  const loadChannelsDataOffline = () => {
    console.log('🔄 Carregando dados dos canais offline')
    try {
      const channelsData = channels.map(channel => {
        const storedMessages = localStorage.getItem(`chat_messages_${channel.id}`)
        const messages = storedMessages ? JSON.parse(storedMessages) : []
        
        return {
          ...channel,
          members: messages.length > 0 ? new Set(messages.map((m: any) => m.user_id)).size : 0,
          unread: 0 // Simplificado para offline
        }
      })
      
      setChannels(channelsData)
    } catch (error) {
      console.error('Erro ao carregar dados dos canais offline:', error)
    }
  }

  // Chat offline - carregar usuários online
  const loadOnlineUsersOffline = () => {
    console.log('🔄 Carregando usuários online offline')
    try {
      const onlineUsers = [
        {
          id: user?.id || 'current-user',
          name: user?.name || 'Usuário Atual',
          avatar: 'U',
          crm: user?.crm || '',
          specialty: '',
          status: 'online'
        }
      ]
      
      setOnlineUsers(onlineUsers)
    } catch (error) {
      console.error('Erro ao carregar usuários online offline:', error)
    }
  }

  const scrollToBottom = useCallback(() => {
    requestAnimationFrame(() => {
      if (messagesContainerRef.current) {
        messagesContainerRef.current.scrollTo({
          top: messagesContainerRef.current.scrollHeight,
          behavior: 'smooth'
        })
      }
    })
  }, [])


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

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSendMessage = async () => {
    if (!message.trim() || !user || isSending) return

    if (!activeChannelData?.canPost) {
      alert('Seu perfil possui acesso somente leitura neste canal. Solicite mediação de um profissional para participar.')
      return
    }

    setIsSending(true)
    console.log('💬 Enviando (OFFLINE):', message)
    
    try {
      // Chat offline - salvar mensagem localmente
      const messageData = {
        user_id: user.id,
        user_name: user.name || 'Usuário',
        user_avatar: 'U',
        content: message.trim(),
        channel: activeChannel,
        crm: user.crm || '',
        specialty: '',
        type: 'text',
        reactions: { heart: 0, thumbs: 0, reply: 0 },
        is_pinned: false,
        is_online: true
      }

      const savedMessage = saveMessageOffline(messageData)
      
      if (savedMessage) {
        console.log('✅ Mensagem salva offline!')
        setMessage('')
        
        // Adicionar mensagem à lista atual
        setMessages(prev => [...prev, savedMessage])
        
        // Enviar via BroadcastChannel para outras abas
        if (window.offlineChannel) {
          window.offlineChannel.postMessage({
            type: 'new_message',
            channel: activeChannel,
            message: savedMessage
          })
        }
        
        // Atualizar dados dos canais
        loadChannelsDataOffline()
        loadOnlineUsersOffline()
        
        scrollToBottom()
      } else {
        console.error('❌ Erro ao salvar mensagem offline')
      }
    } catch (error) {
      console.error('Erro ao enviar mensagem offline:', error)
    } finally {
      setIsSending(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey && !isSending) {
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
      case 'online': return 'bg-[#00F5A0]'
      case 'away': return 'bg-slate-400'
      case 'busy': return 'bg-slate-500'
      default: return 'bg-slate-500'
    }
  }

  const getVoteColor = (votes: { up: number, down: number }) => {
    const total = votes.up + votes.down
    if (total === 0) return 'text-slate-400'
    const ratio = votes.up / total
    if (ratio > 0.7) return 'text-[#00F5A0]'
    if (ratio > 0.4) return 'text-slate-300'
    return 'text-slate-400'
  }

  return (
    <div className="space-y-4 md:space-y-6 lg:space-y-8 px-2 md:px-4">
      {/* Header */}
      <div className="rounded-xl p-3 md:p-4 lg:p-5 mb-3 md:mb-4 overflow-hidden shadow-xl relative min-h-[160px]" style={{ background: headerGradient, border: '1px solid rgba(0,193,106,0.18)' }}>
        {/* Animação Matrix no background */}
        <div 
          className="absolute inset-0 pointer-events-none"
          style={{
            opacity: 0.4,
            zIndex: 1,
            overflow: 'hidden'
          }}
        >
          {Array.from({ length: 30 }).map((_, i) => (
            <div
              key={`matrix-${i}`}
              style={{
                position: 'absolute',
                left: `${(i * 3.5) % 100}%`,
                top: '-150px',
                animation: `matrixFall ${6 + (i % 8)}s linear infinite`,
                animationDelay: `${i * 0.15}s`,
                color: '#00F5A0',
                fontFamily: 'monospace',
                fontSize: '12px',
                fontWeight: 'bold',
                textShadow: '0 0 15px rgba(0, 245, 160, 1), 0 0 25px rgba(0, 245, 160, 0.8), 0 0 35px rgba(0, 245, 160, 0.5)',
                whiteSpace: 'nowrap',
                letterSpacing: '3px',
                zIndex: 1
              }}
            >
              MedCannLab
            </div>
          ))}
        </div>

        {/* CSS para animação Matrix */}
        <style>{`
          @keyframes matrixFall {
            0% {
              transform: translateY(-250px);
              opacity: 0;
            }
            8% {
              opacity: 1;
            }
            50% {
              opacity: 1;
            }
            92% {
              opacity: 1;
            }
            100% {
              transform: translateY(700px);
              opacity: 0;
            }
          }
        `}</style>

        <div className="text-center px-3 relative" style={{ zIndex: 10 }}>
          <div className="flex flex-col items-center justify-center mb-3">
            {/* Logo no centro */}
            <div className="w-16 h-16 md:w-20 md:h-20 rounded-xl flex items-center justify-center overflow-hidden mb-3" style={{
              background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f3a3a 100%)',
              boxShadow: '0 6px 16px rgba(0, 0, 0, 0.4)',
              border: '1px solid rgba(0, 193, 106, 0.3)',
              zIndex: 10
            }}>
              <img 
                src="/brain.png" 
                alt="MedCannLab Logo" 
                className="w-full h-full object-contain p-2"
                style={{
                  filter: 'brightness(1.2) contrast(1.2) drop-shadow(0 0 8px rgba(0, 193, 106, 0.8))'
                }}
                onError={(e) => {
                  console.error('Erro ao carregar logo:', e)
                  // Fallback para ícone se a imagem não carregar
                  const target = e.target as HTMLImageElement
                  if (target) {
                    target.style.display = 'none'
                    const parent = target.parentElement
                    if (parent) {
                      parent.innerHTML = '<div style="color: #00F5A0; font-size: 2rem;">🧠</div>'
                    }
                  }
                }}
              />
            </div>
            <h1 className="text-xl md:text-2xl lg:text-3xl font-bold text-white mb-2 break-words">
              💬 Fórum Cann Matrix
            </h1>
          </div>
          {isAdmin && (
            <div className="mt-3 flex justify-center space-x-3">
              <button
                onClick={() => setShowModeration(!showModeration)}
                className={`px-3 py-1.5 rounded-lg flex items-center space-x-2 transition-colors text-sm ${
                  showModeration 
                    ? 'text-white' 
                    : 'text-white'
                }`}
                style={showModeration 
                  ? { background: accentGradient }
                  : { background: accentGradient }}
              >
                <Flag className="w-3.5 h-3.5" />
                <span>{showModeration ? 'Ocultar Moderação' : 'Painel de Moderação'}</span>
              </button>
              <div className="px-2.5 py-1.5 rounded-lg flex items-center space-x-2" style={{ background: 'rgba(0, 193, 106, 0.2)', border: '1px solid rgba(0, 193, 106, 0.3)' }}>
                <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: '#00F5A0' }}></div>
                <span className="text-xs font-medium" style={{ color: '#00F5A0' }}>Admin Online</span>
              </div>
              {moderatorRequests.length > 0 && (
                <div className="px-3 py-2 rounded-lg flex items-center space-x-2" style={{ background: 'rgba(0, 193, 106, 0.2)', border: '1px solid rgba(0, 193, 106, 0.3)' }}>
                  <Flag className="w-4 h-4" style={{ color: '#00F5A0' }} />
                  <span className="text-sm font-medium" style={{ color: '#00F5A0' }}>{moderatorRequests.length} Solicitações</span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="rounded-lg p-1 md:p-2" style={{ background: 'rgba(7,22,41,0.78)', border: '1px solid rgba(0,193,106,0.12)' }}>
        <div className="flex space-x-1">
          <button
            onClick={() => setActiveTab('chat')}
            className="flex-1 flex items-center justify-center space-x-1 md:space-x-2 py-2 md:py-3 px-2 md:px-4 rounded-lg text-sm md:text-base font-medium transition-transform"
            style={activeTab === 'chat'
              ? { background: accentGradient, color: '#fff', boxShadow: '0 12px 24px rgba(0,193,106,0.32)' }
              : { background: 'rgba(12,34,54,0.6)', color: '#C8D6E5' }}
          >
            <MessageSquare className="w-4 h-4 md:w-5 md:h-5" />
            <span className="hidden sm:inline">Chat</span>
          </button>
          <button
            onClick={() => setActiveTab('forum')}
            className="flex-1 flex items-center justify-center space-x-1 md:space-x-2 py-2 md:py-3 px-2 md:px-4 rounded-lg text-sm md:text-base font-medium transition-transform"
            style={activeTab === 'forum'
              ? { background: accentGradient, color: '#fff', boxShadow: '0 12px 24px rgba(0,193,106,0.32)' }
              : { background: 'rgba(12,34,54,0.6)', color: '#C8D6E5' }}
          >
            <BookOpen className="w-4 h-4 md:w-5 md:h-5" />
            <span className="hidden sm:inline">Fórum</span>
          </button>
          <button
            onClick={() => setActiveTab('friends')}
            className="flex-1 flex items-center justify-center space-x-1 md:space-x-2 py-2 md:py-3 px-2 md:px-4 rounded-lg text-sm md:text-base font-medium transition-transform"
            style={activeTab === 'friends'
              ? { background: accentGradient, color: '#fff', boxShadow: '0 12px 24px rgba(0,193,106,0.32)' }
              : { background: 'rgba(12,34,54,0.6)', color: '#C8D6E5' }}
          >
            <Users className="w-4 h-4 md:w-5 md:h-5" />
            <span className="hidden sm:inline">Amigos</span>
            {friendRequests.length > 0 && (
              <span className="text-xs px-1.5 md:px-2 py-0.5 md:py-1 rounded-full" style={{ background: 'rgba(0, 193, 106, 0.3)', color: '#00F5A0', border: '1px solid rgba(0, 193, 106, 0.4)' }}>
                {friendRequests.length}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Banner de Orientações */}
      {/* Botão Ver orientações - Fora do card */}
      <div className="mb-4 md:mb-6">
        <button
          type="button"
          onClick={() => setShowGuidelines(prev => !prev)}
          className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors border border-slate-700/60 ${
            showGuidelines ? 'bg-slate-800/80 text-white' : 'bg-slate-900/40 text-slate-200 hover:text-white'
          }`}
          aria-expanded={showGuidelines}
        >
          {showGuidelines ? 'Ocultar orientações' : 'Ver orientações'}
        </button>
      </div>

      {/* Card com orientações */}
      {showGuidelines && (
        <div
          className="rounded-xl p-3 md:p-4 mb-4 md:mb-6 overflow-hidden"
          style={{ background: bannerGradient, border: '1px solid rgba(0,193,106,0.16)' }}
        >
          <div className="rounded-xl p-4 md:p-6 space-y-4" style={bannerSurface}>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-lg border border-slate-700/60 bg-slate-900/40 p-4 space-y-2">
                <h4 className="text-sm font-semibold text-white flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-[#00F5A0]" />
                  Como participar
                </h4>
                <ul className="space-y-2 text-sm text-slate-200/85">
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 mt-0.5 text-[#00F5A0]" />
                    <span>Escolha o canal que melhor corresponde ao tema antes de iniciar um debate.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 mt-0.5 text-[#00F5A0]" />
                    <span>Compartilhe referências, casos documentados e experiências clínicas verificáveis.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 mt-0.5 text-[#00F5A0]" />
                    <span>Use linguagem colaborativa e reporte desvios do código de conduta aos moderadores.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 mt-0.5 text-[#00F5A0]" />
                    <span>Mencione especialistas quando precisar de revisão ou validação clínica.</span>
                  </li>
                </ul>
              </div>

              <div className="rounded-lg border border-slate-700/60 bg-slate-900/40 p-4 space-y-3">
                <h4 className="text-sm font-semibold text-white flex items-center gap-2">
                  <Award className="w-4 h-4 text-[#FFD33D]" />
                  Limitações por perfil
                </h4>
                <div className="space-y-2 text-sm text-slate-200/85">
                  <div className="flex items-start gap-2">
                    <Users className="w-4 h-4 mt-0.5 text-[#4FE0C1]" />
                    <p><strong className="text-white">Profissional:</strong> acesso completo; pode iniciar debates clínicos e mentorias.</p>
                  </div>
                  <div className="flex items-start gap-2">
                    <Award className="w-4 h-4 mt-0.5 text-[#FFD33D]" />
                    <p><strong className="text-white">Admin:</strong> curadoria da comunidade, permissões avançadas e métricas.</p>
                  </div>
                  <div className="flex items-start gap-2">
                    <BookOpen className="w-4 h-4 mt-0.5 text-[#86E3CE]" />
                    <p><strong className="text-white">Aluno:</strong> interações mediadas por docentes em debates clínicos avançados.</p>
                  </div>
                  <div className="flex items-start gap-2">
                    <Heart className="w-4 h-4 mt-0.5 text-[#FF8E72]" />
                    <p><strong className="text-white">Paciente:</strong> participação orientada em canais de suporte com mediação profissional.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Chat Tab */}
      {activeTab === 'chat' && (
        <div className={`grid gap-4 md:gap-6 lg:gap-10 ${gridColumnsClass}`}>
          {/* Sidebar - Channels */}
          <div className="lg:col-span-1 order-2 lg:order-1">
            <div className="bg-slate-800/80 rounded-lg p-3 md:p-4 lg:p-6 border border-slate-700">
              <div className="flex items-center justify-between mb-4 md:mb-6">
                <h3 className="text-base md:text-lg font-semibold text-white">
                  📋 Canais
                </h3>
                <button className="p-2 text-slate-400 hover:text-primary-400 transition-colors">
                  <Plus className="w-4 h-4 md:w-5 md:h-5" />
                </button>
              </div>

              <div className="space-y-2">
                {channelsWithAccess.map((channel) => {
                  const isActive = activeChannel === channel.id
                  const baseClasses = isActive && channel.canView
                    ? 'text-white'
                    : channel.canView
                      ? 'hover:bg-slate-700/50 text-slate-300'
                      : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700/60'

                  return (
                    <button
                      key={channel.id}
                      onClick={() => {
                        if (!channel.canView) {
                          alert('Seu perfil não possui acesso direto a este canal. Procure o canal recomendado para o seu tipo de usuário.')
                          return
                        }
                        setActiveChannel(channel.id)
                      }}
                      className={`w-full flex items-center justify-between p-3 rounded-lg transition-colors ${baseClasses}`}
                      style={isActive && channel.canView ? { background: accentGradient } : {}}
                      disabled={!channel.canView}
                    >
                      <div className="flex items-center space-x-3">
                        <div className={`w-2 h-2 rounded-full`} style={{ background: channel.canView ? '#00F5A0' : '#64748B' }}></div>
                        <div className="text-left">
                          <p className="font-medium">{channel.name}</p>
                          <p className="text-xs opacity-75">{channel.description}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        {channel.isReadOnly && channel.canView && (
                          <span className="text-[10px] uppercase tracking-wide bg-slate-600/70 text-slate-200 px-2 py-0.5 rounded-full">
                            Somente leitura
                          </span>
                        )}
                        {!channel.canView && <Lock className="w-3.5 h-3.5 text-slate-400" />}
                        <span className="text-xs bg-slate-600 px-2 py-1 rounded">
                          {channel.members}
                        </span>
                        {channel.unread > 0 && channel.canView && (
                          <span className="text-xs px-2 py-1 rounded-full" style={{ background: 'rgba(0, 193, 106, 0.3)', color: '#00F5A0', border: '1px solid rgba(0, 193, 106, 0.4)' }}>
                            {channel.unread}
                          </span>
                        )}
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Online Users */}
            <div className="bg-slate-800/80 rounded-lg p-3 md:p-4 lg:p-6 border border-slate-700 mt-4 md:mt-6">
              <h3 className="text-base md:text-lg font-semibold text-white mb-3 md:mb-4">
                👥 Online ({onlineUsers.filter(u => u.status === 'online').length})
              </h3>
              <div className="space-y-3">
                {onlineUsers.map((user) => (
                  <div key={user.id} className="flex items-center justify-between p-3 hover:bg-slate-700/50 rounded-lg transition-colors">
                    <div className="flex items-center space-x-3">
                      <div className="relative">
                        <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: 'rgba(0, 193, 106, 0.2)', border: '1px solid rgba(0, 193, 106, 0.3)' }}>
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
          <div className={`${showModeration && isAdmin ? 'lg:col-span-2' : 'lg:col-span-2'} order-1 lg:order-2`}>
            <div className="bg-slate-800/80 rounded-lg border border-slate-700 h-[400px] md:h-[500px] lg:h-[600px] flex flex-col">
              {/* Chat Header */}
              <div className="p-3 md:p-4 border-b border-slate-700 bg-slate-700/50">
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-base md:text-lg font-semibold text-white truncate">
                      {activeChannelData?.name || 'Canal indisponível'}
                    </h3>
                    <p className="text-slate-400 text-xs md:text-sm">
                      {activeChannelData?.members || 0} membros
                    </p>
                  </div>
                  <div className="flex items-center space-x-1 md:space-x-2 flex-shrink-0">
                    {!isAdmin && (
                      <button
                        onClick={() => setShowModeratorRequest(true)}
                        className="p-1.5 md:p-2 text-red-400 hover:text-red-300 hover:bg-red-500/20 rounded transition-colors"
                        title="Solicitar Moderador"
                      >
                        <Flag className="w-4 h-4 md:w-5 md:h-5" />
                      </button>
                    )}
                    <button className="p-1.5 md:p-2 text-slate-400 hover:transition-colors hidden md:block" style={{ '--hover-color': '#00F5A0' } as React.CSSProperties}>
                      <Video className="w-4 h-4 md:w-5 md:h-5" />
                    </button>
                    <button className="p-1.5 md:p-2 text-slate-400 hover:transition-colors hidden md:block" style={{ '--hover-color': '#00F5A0' } as React.CSSProperties}>
                      <Phone className="w-4 h-4 md:w-5 md:h-5" />
                    </button>
                    <button className="p-1.5 md:p-2 text-slate-400 hover:transition-colors" style={{ '--hover-color': '#00F5A0' } as React.CSSProperties}>
                      <MoreVertical className="w-4 h-4 md:w-5 md:h-5" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Messages */}
              <div
                ref={messagesContainerRef}
                className="flex-1 overflow-y-auto p-2 md:p-4 space-y-3 md:space-y-4"
              >
                {/* Indicador de tempo real */}
                <div className="text-center mb-4">
                  <div className="inline-flex items-center space-x-2 rounded-full px-4 py-2" style={{ background: 'rgba(0, 193, 106, 0.2)', border: '1px solid rgba(0, 193, 106, 0.3)' }}>
                    <div className="w-2 h-2 rounded-full animate-pulse" style={{ background: '#00F5A0' }}></div>
                    <span className="text-sm font-medium" style={{ color: '#00F5A0' }}>Chat em tempo real ativo</span>
                  </div>
                  <p className="text-slate-400 text-xs mt-2">
                    💬 Conversas expiram em 24 horas para manter o chat limpo e focado
                  </p>
                </div>
                
                {messages.map((msg) => (
                  <div key={msg.id} className="flex space-x-3">
                    <div className="relative">
                      <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: 'rgba(0, 193, 106, 0.2)', border: '1px solid rgba(0, 193, 106, 0.3)' }}>
                        <span className="text-white font-bold text-sm">{msg.user_avatar}</span>
                      </div>
                      {msg.isOnline && (
                        <div className="absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-slate-800" style={{ background: '#00F5A0' }}></div>
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <span className="text-white font-medium">{msg.user_name}</span>
                        <span className="text-slate-400 text-sm">{msg.crm}</span>
                        <span className="text-slate-500 text-sm">•</span>
                        <span className="text-slate-400 text-sm">{msg.specialty}</span>
                        <span className="text-slate-500 text-sm">•</span>
                        <span className="text-slate-400 text-sm">{new Date(msg.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span>
                        {msg.isPinned && (
                          <Pin className="w-4 h-4 text-yellow-400" />
                        )}
                      </div>
                      <p className="text-slate-200 mb-2">{msg.content}</p>
                      <div className="flex items-center space-x-4">
                        <button className="flex items-center space-x-1 text-slate-400 transition-colors" style={{ '--hover-color': '#00F5A0' } as React.CSSProperties}>
                          <Heart className="w-4 h-4" />
                          <span className="text-sm">{msg.reactions?.heart || 0}</span>
                        </button>
                        <button className="flex items-center space-x-1 text-slate-400 transition-colors" style={{ '--hover-color': '#00F5A0' } as React.CSSProperties}>
                          <ThumbsUp className="w-4 h-4" />
                          <span className="text-sm">{msg.reactions?.thumbs || 0}</span>
                        </button>
                        <button className="flex items-center space-x-1 text-slate-400 transition-colors" style={{ '--hover-color': '#00F5A0' } as React.CSSProperties}>
                          <Reply className="w-4 h-4" />
                          <span className="text-sm">{msg.reactions?.reply || 0}</span>
                        </button>
                        <button className="text-slate-400 transition-colors" style={{ '--hover-color': '#00F5A0' } as React.CSSProperties}>
                          <UserPlus className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>

              {/* Message Input */}
              <div className="p-2 md:p-4 border-t border-slate-700">
                <div className="flex items-center space-x-1 md:space-x-2">
                    <button className="p-1.5 md:p-2 text-slate-400 transition-colors hidden sm:block" style={{ '--hover-color': '#00F5A0' } as React.CSSProperties}>
                      <Paperclip className="w-4 h-4 md:w-5 md:h-5" />
                    </button>
                  <div className="flex-1 relative">
                    <input
                      type="text"
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      onKeyPress={handleKeyPress}
                      placeholder="Digite sua mensagem..."
                      className="w-full px-2 md:px-4 py-2 md:py-3 text-sm md:text-base bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:opacity-60 disabled:cursor-not-allowed"
                      disabled={!activeChannelData?.canPost}
                    />
                  </div>
                  <button className="p-1.5 md:p-2 text-slate-400 transition-colors hidden sm:block" style={{ '--hover-color': '#00F5A0' } as React.CSSProperties}>
                    <Smile className="w-4 h-4 md:w-5 md:h-5" />
                  </button>
                  <button
                    onClick={isRecording ? () => setIsRecording(false) : startRecording}
                    className={`p-1.5 md:p-2 transition-colors ${
                      isRecording 
                        ? 'text-slate-300' 
                        : 'text-slate-400'
                    }`}
                    style={isRecording ? { color: '#00F5A0' } : {}}
                  >
                    {isRecording ? <MicOff className="w-4 h-4 md:w-5 md:h-5" /> : <Mic className="w-4 h-4 md:w-5 md:h-5" />}
                  </button>
                  <button
                    onClick={handleSendMessage}
                    disabled={isSending || !activeChannelData?.canPost}
                    className="text-white px-2 md:px-4 py-2 md:py-3 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                    style={{ background: accentGradient }}
                  >
                    <Send className="w-4 h-4 md:w-5 md:h-5" />
                  </button>
                </div>
                {activeChannelData?.isReadOnly && (
                  <p className="mt-2 text-[11px] md:text-xs text-slate-400">
                    Este canal é moderado. Perfis <strong>{userType}</strong> participam em modo leitura; envolva um profissional para abrir novas interações.
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Painel lateral modular */}
          {!showModeration && showCommunityColumn && (
            <div className="lg:col-span-1 order-3 hidden lg:block">
              <div className="bg-slate-800/80 rounded-lg p-6 border border-slate-700 h-full">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <PanelIcon className={`w-5 h-5 ${communityPanelConfig.iconColor}`} />
                    <h3 className="text-lg font-semibold text-white">{communityPanelConfig.title}</h3>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowCommunityColumn(false)}
                    className="text-xs text-slate-400 hover:text-white transition-colors"
                  >
                    Ocultar
                  </button>
                </div>
                <div className="flex flex-wrap gap-2 mb-4">
                  {COMMUNITY_PANEL_TABS.map(tab => (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setActiveCommunityPanel(tab.id)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors border border-slate-700/60 ${
                        activeCommunityPanel === tab.id
                          ? 'bg-primary-600 text-white'
                          : 'bg-slate-900/40 text-slate-300 hover:text-white'
                      }`}
                      aria-pressed={activeCommunityPanel === tab.id}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>
                <div className="space-y-3">
                  {communityPanelConfig.content}
                </div>
              </div>
            </div>
          )}

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
                    <button className="w-full text-white py-2 px-3 rounded text-xs transition-colors" style={{ background: accentGradient }}>
                      📊 Ver Analytics
                    </button>
                    <button className="w-full py-2 px-3 rounded text-xs transition-colors" style={{ background: 'rgba(15, 36, 60, 0.8)', color: '#C8D6E5', border: '1px solid rgba(0, 193, 106, 0.2)' }}>
                      🚨 Reportes
                    </button>
                    <button className="w-full py-2 px-3 rounded text-xs transition-colors" style={{ background: 'rgba(15, 36, 60, 0.8)', color: '#C8D6E5', border: '1px solid rgba(0, 193, 106, 0.2)' }}>
                      👥 Usuários
                    </button>
                    <button className="w-full py-2 px-3 rounded text-xs transition-colors" style={{ background: 'rgba(15, 36, 60, 0.8)', color: '#C8D6E5', border: '1px solid rgba(0, 193, 106, 0.2)' }}>
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
          <div className="bg-slate-800/80 rounded-lg p-6 border border-slate-700 space-y-4">
            <div>
              <h2 className="text-2xl font-bold text-white mb-2">🏛️ Fórum Profissional</h2>
              <p className="text-slate-300">
                Espaço colaborativo para acompanhar o desenvolvimento do protocolo integrado Med Cann Lab.
              </p>
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

          {preselectedForumTopic && (
            <div className="rounded-lg p-5 space-y-3 border" style={{ background: 'rgba(15, 36, 60, 0.7)', borderColor: 'rgba(0, 193, 106, 0.18)' }}>
              <div>
                <p className="text-xs uppercase tracking-[0.32em]" style={{ color: '#00F5A0' }}>Tema central</p>
                <h3 className="text-lg font-semibold text-white">{preselectedForumTopic}</h3>
                <p className="text-sm text-slate-300 mt-2">
                  Estamos estruturando o protocolo clínico integrado do Med Cann Lab para unir cannabis medicinal e nefrologia.
                  Compartilhe dados clínicos, experiências assistidas por IA e sugestões metodológicas para fortalecer o documento.
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setSearchTerm(preselectedForumTopic)}
                  className="inline-flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold text-white transition-colors"
                  style={{ background: accentGradient }}
                >
                  Buscar discussões relacionadas
                </button>
                <button
                  onClick={() => navigate('/app/chat?tab=forum')}
                  className="inline-flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold transition-colors"
                  style={{ background: 'rgba(15, 36, 60, 0.8)', color: '#C8D6E5', border: '1px solid rgba(0, 193, 106, 0.2)' }}
                >
                  Atualizar quadro do fórum
                </button>
              </div>
            </div>
          )}

          {/* Grid Layout: Debates + Coluna de Notícias */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
            {/* Debates List */}
            <div className="lg:col-span-2 space-y-4">
            {filteredDebates.length > 0 ? (
              filteredDebates.map((debate) => {
                const canPostInDebate = debate.postRoles.includes(userType)
                return (
                  <div key={debate.id} className="bg-slate-800/80 rounded-lg p-6 border border-slate-700 hover:bg-slate-800/90 transition-colors">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h3 className="text-lg font-semibold text-white">{debate.title}</h3>
                          {debate.isPinned && <Pin className="w-5 h-5 text-yellow-400" />}
                          {debate.isHot && <TrendingUp className="w-5 h-5" style={{ color: '#00F5A0' }} />}
                          {debate.isActive && (
                            <div className="flex items-center space-x-1">
                              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                              <span className="text-sm font-medium" style={{ color: '#00F5A0' }}>ONLINE</span>
                            </div>
                          )}
                          {debate.isPasswordProtected && (
                            <div className="flex items-center space-x-1">
                              <Lock className="w-4 h-4 text-primary-400" />
                              <span className="text-sm" style={{ color: '#00F5A0' }}>Protegido</span>
                            </div>
                          )}
                        </div>
                        <p className="text-slate-300 text-sm mb-3">{debate.description}</p>
                        <div className="flex flex-wrap gap-2 mb-3">
                          {debate.tags.map((tag, index) => (
                            <span key={index} className="px-2 py-1 text-xs rounded-full" style={{ background: 'rgba(0, 193, 106, 0.2)', color: '#00F5A0', border: '1px solid rgba(0, 193, 106, 0.3)' }}>
                              {tag}
                            </span>
                          ))}
                        </div>
                        <div className="flex items-center space-x-4 text-sm text-slate-400">
                          <div className="flex items-center space-x-1">
                            <div className="w-6 h-6 rounded-full flex items-center justify-center" style={{ background: 'rgba(0, 193, 106, 0.2)', border: '1px solid rgba(0, 193, 106, 0.3)' }}>
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
                          {!canPostInDebate && (
                            <>
                              <span>•</span>
                              <span className="text-slate-500 italic">Somente leitura para o seu perfil</span>
                            </>
                          )}
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
                      disabled={!canPostInDebate}
                      className={`px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors ${
                        canPostInDebate
                          ? 'text-white'
                          : 'text-slate-300 cursor-not-allowed'
                      }`}
                      style={canPostInDebate
                        ? { background: accentGradient }
                        : { background: 'rgba(15, 36, 60, 0.8)', border: '1px solid rgba(0, 193, 106, 0.2)' }}
                    >
                            <MessageSquare className="w-4 h-4" />
                            <span>{canPostInDebate ? 'Participar' : 'Somente leitura'}</span>
                          </button>
                          <button className="p-2 text-slate-400 transition-colors" style={{ '--hover-color': '#00F5A0' } as React.CSSProperties}>
                            <Eye className="w-4 h-4" />
                          </button>
                          <button className="p-2 text-slate-400 transition-colors" style={{ '--hover-color': '#00F5A0' } as React.CSSProperties}>
                            <Reply className="w-4 h-4" />
                          </button>
                          <button className="p-2 text-slate-400 transition-colors" style={{ '--hover-color': '#00F5A0' } as React.CSSProperties}>
                            <Share2 className="w-4 h-4" />
                          </button>
                          <button className="p-2 text-slate-400 transition-colors" style={{ '--hover-color': '#00F5A0' } as React.CSSProperties}>
                            <Flag className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })
            ) : (
              <div className="bg-slate-800/80 rounded-lg p-6 border border-slate-700 text-slate-300 text-sm">
                {debatesForUser.length === 0
                  ? 'O seu perfil participa do fórum por meio de canais mediados. Converse com a coordenação para ser convidado a debates especializados.'
                  : 'Nenhum debate encontrado para a sua busca. Ajuste os filtros ou tente outra palavra-chave.'}
              </div>
            )}
            </div>

            {/* Coluna de Notícias, Parcerias, Patrocinadores e Apoiadores */}
            <div className="lg:col-span-1">
              <div className="space-y-6">
                {/* Notícias */}
                <div className="bg-slate-800/80 rounded-lg p-6 border border-slate-700">
                  <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                    <BookOpen className="w-5 h-5 mr-2 text-primary-400" />
                    📰 Notícias
                  </h3>
                  <div className="space-y-4">
                    <div className="bg-slate-700/50 rounded-lg p-4 hover:bg-slate-700/70 transition-colors cursor-pointer">
                      <h4 className="text-white font-medium text-sm mb-2">Novo protocolo de Cannabis Medicinal aprovado pela ANVISA</h4>
                      <p className="text-slate-400 text-xs mb-2">A ANVISA aprovou um novo protocolo para uso de cannabis medicinal em pacientes com epilepsia refratária...</p>
                      <span className="text-slate-500 text-xs">15/01/2025</span>
                    </div>
                    <div className="bg-slate-700/50 rounded-lg p-4 hover:bg-slate-700/70 transition-colors cursor-pointer">
                      <h4 className="text-white font-medium text-sm mb-2">Pesquisa mostra eficácia do CBD em casos de TEA</h4>
                      <p className="text-slate-400 text-xs mb-2">Estudo publicado na Nature Medicine mostra resultados promissores...</p>
                      <span className="text-slate-500 text-xs">12/01/2025</span>
                    </div>
                    <div className="bg-slate-700/50 rounded-lg p-4 hover:bg-slate-700/70 transition-colors cursor-pointer">
                      <h4 className="text-white font-medium text-sm mb-2">Curso de Pós-graduação em Cannabis Medicinal - Novas Turmas</h4>
                      <p className="text-slate-400 text-xs mb-2">Inscrições abertas para a próxima turma do curso de especialização...</p>
                      <span className="text-slate-500 text-xs">10/01/2025</span>
                    </div>
                  </div>
                </div>

                {/* Parcerias */}
                <div className="bg-slate-800/80 rounded-lg p-6 border border-slate-700">
                  <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                    <Users className="w-5 h-5 mr-2" style={{ color: '#00F5A0' }} />
                    🤝 Parcerias
                  </h3>
                  <div className="space-y-3">
                    <div className="rounded-lg p-4 border" style={{ background: 'rgba(15, 36, 60, 0.7)', borderColor: 'rgba(0, 193, 106, 0.12)' }}>
                      <h4 className="text-white font-medium text-sm mb-2">Associação Brasileira de Cannabis Medicinal</h4>
                      <p className="text-slate-400 text-xs">Parceria estratégica para desenvolvimento de protocolos clínicos</p>
                    </div>
                    <div className="rounded-lg p-4 border" style={{ background: 'rgba(15, 36, 60, 0.7)', borderColor: 'rgba(0, 193, 106, 0.12)' }}>
                      <h4 className="text-white font-medium text-sm mb-2">Sociedade Brasileira de Neurologia</h4>
                      <p className="text-slate-400 text-xs">Colaboração em pesquisas sobre epilepsia e TEA</p>
                    </div>
                    <div className="rounded-lg p-4 border" style={{ background: 'rgba(15, 36, 60, 0.7)', borderColor: 'rgba(0, 193, 106, 0.12)' }}>
                      <h4 className="text-white font-medium text-sm mb-2">Instituto de Pesquisa em Cannabis</h4>
                      <p className="text-slate-400 text-xs">Programa conjunto de estudos clínicos</p>
                    </div>
                  </div>
                </div>

                {/* Patrocinadores */}
                <div className="bg-slate-800/80 rounded-lg p-6 border border-slate-700">
                  <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                    <Award className="w-5 h-5 mr-2" style={{ color: '#00F5A0' }} />
                    ⭐ Patrocinadores
                  </h3>
                  <div className="space-y-3">
                    <div className="rounded-lg p-4 border" style={{ background: 'rgba(15, 36, 60, 0.7)', borderColor: 'rgba(0, 193, 106, 0.12)' }}>
                      <div className="flex items-center space-x-3 mb-2">
                        <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: 'rgba(0, 193, 106, 0.2)', border: '1px solid rgba(0, 193, 106, 0.3)' }}>
                          <span className="text-white font-bold text-sm">P1</span>
                        </div>
                        <div>
                          <h4 className="text-white font-medium text-sm">Patrocinador Platinum</h4>
                          <p className="text-slate-400 text-xs">Apoio ao desenvolvimento da plataforma</p>
                        </div>
                      </div>
                    </div>
                    <div className="rounded-lg p-4 border" style={{ background: 'rgba(15, 36, 60, 0.7)', borderColor: 'rgba(0, 193, 106, 0.12)' }}>
                      <div className="flex items-center space-x-3 mb-2">
                        <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: 'rgba(0, 193, 106, 0.2)', border: '1px solid rgba(0, 193, 106, 0.3)' }}>
                          <span className="text-white font-bold text-sm">P2</span>
                        </div>
                        <div>
                          <h4 className="text-white font-medium text-sm">Patrocinador Gold</h4>
                          <p className="text-slate-400 text-xs">Suporte à pesquisa e desenvolvimento</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Apoiadores */}
                <div className="bg-slate-800/80 rounded-lg p-6 border border-slate-700">
                  <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                    <Heart className="w-5 h-5 mr-2" style={{ color: '#00F5A0' }} />
                    ❤️ Apoiadores
                  </h3>
                  <div className="space-y-3">
                    <div className="rounded-lg p-4 border" style={{ background: 'rgba(15, 36, 60, 0.7)', borderColor: 'rgba(0, 193, 106, 0.12)' }}>
                      <h4 className="text-white font-medium text-sm mb-1">Fundação de Apoio à Pesquisa</h4>
                      <p className="text-slate-400 text-xs">Apoio institucional</p>
                    </div>
                    <div className="rounded-lg p-4 border" style={{ background: 'rgba(15, 36, 60, 0.7)', borderColor: 'rgba(0, 193, 106, 0.12)' }}>
                      <h4 className="text-white font-medium text-sm mb-1">Associação de Pacientes</h4>
                      <p className="text-slate-400 text-xs">Comunidade de apoio</p>
                    </div>
                    <div className="rounded-lg p-4 border" style={{ background: 'rgba(15, 36, 60, 0.7)', borderColor: 'rgba(0, 193, 106, 0.12)' }}>
                      <h4 className="text-white font-medium text-sm mb-1">Instituto de Tecnologia em Saúde</h4>
                      <p className="text-slate-400 text-xs">Suporte tecnológico</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
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
                    <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ background: 'rgba(0, 193, 106, 0.2)', border: '1px solid rgba(0, 193, 106, 0.3)' }}>
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
                      className="flex-1 text-white py-2 px-4 rounded-lg flex items-center justify-center space-x-2 transition-colors"
                      style={{ background: accentGradient }}
                    >
                      <Check className="w-4 h-4" />
                      <span>Aceitar</span>
                    </button>
                    <button
                      onClick={() => handleRejectFriend(request.id)}
                      className="flex-1 py-2 px-4 rounded-lg flex items-center justify-center space-x-2 transition-colors"
                      style={{ background: 'rgba(15, 36, 60, 0.8)', color: '#C8D6E5', border: '1px solid rgba(0, 193, 106, 0.2)' }}
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
                      <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: 'rgba(0, 193, 106, 0.2)', border: '1px solid rgba(0, 193, 106, 0.3)' }}>
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
                    <button className="p-1 rounded transition-colors" style={{ color: '#00F5A0' }} title="Conversar">
                      <MessageSquare className="w-4 h-4" />
                    </button>
                    <button className="p-1 rounded transition-colors" style={{ color: '#00F5A0' }} title="Videochamada">
                      <Video className="w-4 h-4" />
                    </button>
                    <button className="p-1 rounded transition-colors" style={{ color: '#00F5A0' }} title="Mais opções">
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
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 rounded-lg p-4 md:p-6 w-full max-w-md mx-4">
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
                    className="flex-1 text-white py-2 px-4 rounded-lg transition-colors"
                    style={{ background: accentGradient }}
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
                        <span className="px-2 py-1 rounded-full text-xs" style={{ background: 'rgba(0, 193, 106, 0.2)', color: '#00F5A0', border: '1px solid rgba(0, 193, 106, 0.3)' }}>
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
                        className="text-white px-3 py-1 rounded text-sm transition-colors"
                        style={{ background: accentGradient }}
                      >
                        Aceitar
                      </button>
                      <button
                        onClick={() => handleRespondToRequest(request.id, 'decline')}
                        className="px-3 py-1 rounded text-sm transition-colors"
                        style={{ background: 'rgba(15, 36, 60, 0.8)', color: '#C8D6E5', border: '1px solid rgba(0, 193, 106, 0.2)' }}
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
            <div className="rounded-lg p-4 text-center border" style={{ background: 'rgba(15, 36, 60, 0.7)', borderColor: 'rgba(0, 193, 106, 0.12)' }}>
              <div className="text-2xl font-bold mb-1" style={{ color: '#00F5A0' }}>
                {moderatorRequests.length}
              </div>
              <div className="text-slate-300 text-sm">Solicitações Pendentes</div>
            </div>
            <div className="rounded-lg p-4 text-center border" style={{ background: 'rgba(15, 36, 60, 0.7)', borderColor: 'rgba(0, 193, 106, 0.12)' }}>
              <div className="text-2xl font-bold mb-1" style={{ color: '#00F5A0' }}>
                {onlineUsers.filter(u => u.is_admin).length}
              </div>
              <div className="text-slate-300 text-sm">Moderadores Online</div>
            </div>
            <div className="rounded-lg p-4 text-center border" style={{ background: 'rgba(15, 36, 60, 0.7)', borderColor: 'rgba(0, 193, 106, 0.12)' }}>
              <div className="text-2xl font-bold mb-1" style={{ color: '#00F5A0' }}>
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