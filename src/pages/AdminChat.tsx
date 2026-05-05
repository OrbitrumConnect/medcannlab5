import React, { useEffect, useMemo, useRef, useState, useCallback } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { Loader2, MessageCircle, Menu, Send, Users, Video, Phone, X, Image, UserPlus, Plus, Paperclip } from 'lucide-react'

import { useAuth } from '../contexts/AuthContext'
import { useChatSystem } from '../hooks/useChatSystem'
import { supabase } from '../lib/supabase'
// VideoCall agora é global no Layout.tsx
import { useVideoCallRequests } from '../hooks/useVideoCallRequests'
import { videoCallRequestService } from '../services/videoCallRequestService'
import { createClickDebouncer } from '../lib/clickDebouncer'
import VideoCallRequestNotification from '../components/VideoCallRequestNotification'
import { useToast } from '../contexts/ToastContext'
import ConfirmModal from '../components/ConfirmModal'

interface ParticipantSummary {
  id: string
  name: string | null
  email: string | null
}

const AdminChat: React.FC = () => {
  const { user } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const roomIdParam = new URLSearchParams(location.search).get('roomId')
  const fileInputRef = useRef<HTMLInputElement>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const [isAuthorizedAdmin, setIsAuthorizedAdmin] = useState<boolean | null>(null)
  useEffect(() => {
    if (!user) { setIsAuthorizedAdmin(false); return }
    supabase.rpc('is_admin_user', { _user_id: user.id }).then(({ data }) => {
      setIsAuthorizedAdmin(data === true)
    })
  }, [user])

  const [activeRoomId, setActiveRoomId] = useState<string | undefined>(roomIdParam ?? undefined)
  const [participants, setParticipants] = useState<ParticipantSummary[]>([])
  const [participantsLoading, setParticipantsLoading] = useState(false)
  const [messageInput, setMessageInput] = useState('')
  const [allAdmins, setAllAdmins] = useState<Array<{ id: string; name: string | null; email: string | null }>>([])
  const [adminsLoading, setAdminsLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)
  const [uploadingImage, setUploadingImage] = useState(false)

  // Group chat states
  const [showCreateGroup, setShowCreateGroup] = useState(false)
  const [showAddMember, setShowAddMember] = useState(false)
  const [groupName, setGroupName] = useState('')
  const [selectedGroupMembers, setSelectedGroupMembers] = useState<string[]>([])

  // Video call states
  const [callType, setCallType] = useState<'video' | 'audio'>('video')
  const [pendingCallRequest, setPendingCallRequest] = useState<string | null>(null)
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null)

  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean; title: string; message: string; onConfirm: () => void; type?: 'danger' | 'warning' | 'info' | 'success'
  }>({ isOpen: false, title: '', message: '', onConfirm: () => {}, type: 'warning' })

  const toast = useToast()

  // O Layout.tsx já cuida de abrir a chamada via hook global.
  // Mantemos aqui apenas para sincronia de estado local se necessário.
  const { pendingRequests, createRequest, cancelRequest } = useVideoCallRequests({})

  // Polling removido: o Realtime no Layout cuida de abrir a chamada
  // quando o outro lado aceitar (onRequestAccepted do Layout).

  const {
    inbox, inboxLoading, messages, messagesLoading, isOnline, sendMessage, markRoomAsRead, reloadInbox
  } = useChatSystem(activeRoomId, { enabled: true })

  const adminRooms = useMemo(() => {
    return inbox.filter(room => room.type === 'admin' || room.name?.includes('Admin'))
  }, [inbox])

  // Load admin list
  useEffect(() => {
    const loadAdmins = async () => {
      if (!user) return
      setAdminsLoading(true)
      try {
        const { data: adminRoles, error: rolesError } = await supabase
          .from('user_roles').select('user_id').eq('role', 'admin')
        if (rolesError || !adminRoles?.length) { setAllAdmins([]); setAdminsLoading(false); return }
        const adminUserIds = adminRoles.map(r => r.user_id)
        const { data: allAdminsData, error } = await supabase
          .from('users').select('id, name, email').in('id', adminUserIds)
        setAllAdmins(error ? [] : allAdminsData || [])
      } catch { setAllAdmins([]) }
      finally { setAdminsLoading(false) }
    }
    loadAdmins()
  }, [user])

  // Load participants
  useEffect(() => {
    const fetchParticipants = async () => {
      if (!activeRoomId || !user) { setParticipants([]); return }
      setParticipantsLoading(true)
      try {
        const { data: directData } = await supabase
          .from('chat_participants').select('user_id').eq('room_id', activeRoomId)
        if (directData && directData.length > 0) {
          const userIds = directData.map(p => p.user_id).filter(Boolean)
          const { data: usersData } = await supabase.from('users').select('id, name, email').in('id', userIds)
          setParticipants((usersData || []).map(u => ({ id: u.id, name: u.name, email: u.email })))
        } else { setParticipants([]) }
      } catch { setParticipants([]) }
      finally { setParticipantsLoading(false) }
    }
    fetchParticipants()
  }, [activeRoomId, user])

  // Mark room as read
  useEffect(() => { if (activeRoomId) void markRoomAsRead(activeRoomId) }, [activeRoomId, markRoomAsRead])

  // Auto-scroll to bottom
  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages])

  // Timer for pending call
  useEffect(() => {
    if (!pendingCallRequest) { setTimeRemaining(null); return }
    const request = pendingRequests.find(r => r.request_id === pendingCallRequest)
    if (!request?.expires_at) { setTimeRemaining(null); return }
    const updateTimer = () => {
      const remaining = Math.max(0, Math.floor((new Date(request.expires_at).getTime() - Date.now()) / 1000))
      setTimeRemaining(remaining)
      if (remaining === 0) { setPendingCallRequest(null); setTimeRemaining(null) }
    }
    updateTimer()
    const interval = setInterval(updateTimer, 1000)
    return () => clearInterval(interval)
  }, [pendingCallRequest, pendingRequests])

  const otherParticipants = useMemo(() => participants.filter(p => p.id !== user?.id), [participants, user?.id])
  const isGroupChat = participants.length > 2

  const adminIdForCall = useMemo(() => {
    if (!activeRoomId || !user?.id) return null
    if (otherParticipants.length > 0) return otherParticipants[0]?.id ?? null
    const fromAll = allAdmins.find(a => a.id !== user.id)
    return fromAll?.id ?? null
  }, [otherParticipants, activeRoomId, user?.id, allAdmins])

  // Open or create 1:1 room
  const handleOpenOrCreateRoom = async (adminId: string, adminName: string) => {
    if (!user) return
    try {
      const { data: existingRooms } = await supabase.from('chat_rooms').select('id').eq('type', 'admin')
      let existingRoomId: string | null = null
      if (existingRooms) {
        for (const room of existingRooms) {
          const { data: roomP } = await supabase.from('chat_participants').select('user_id').eq('room_id', room.id)
          const pIds = roomP?.map(p => p.user_id) || []
          if (pIds.includes(user.id) && pIds.includes(adminId) && pIds.length === 2) { existingRoomId = room.id; break }
        }
      }
      if (existingRoomId) {
        setActiveRoomId(existingRoomId)
        navigate(`/app/admin-chat?roomId=${existingRoomId}`, { replace: true })
        return
      }
      const { data: newRoom, error: roomError } = await supabase
        .from('chat_rooms').insert({ name: `Admin Chat: ${user.name || 'Você'} & ${adminName}`, type: 'admin', created_by: user.id }).select().single()
      if (roomError || !newRoom) { toast.error('Erro', 'Não foi possível criar a sala.'); return }
      await supabase.from('chat_participants').insert([
        { room_id: newRoom.id, user_id: user.id, role: 'admin' },
        { room_id: newRoom.id, user_id: adminId, role: 'admin' }
      ])
      setActiveRoomId(newRoom.id)
      navigate(`/app/admin-chat?roomId=${newRoom.id}`, { replace: true })
      await reloadInbox()
    } catch { toast.error('Erro', 'Não foi possível criar a sala.') }
  }

  // Create group room
  const handleCreateGroup = async () => {
    if (!user || !groupName.trim() || selectedGroupMembers.length === 0) return
    try {
      const { data: newRoom, error } = await supabase
        .from('chat_rooms').insert({ name: `👥 ${groupName.trim()}`, type: 'admin', created_by: user.id }).select().single()
      if (error || !newRoom) { toast.error('Erro', 'Não foi possível criar o grupo.'); return }

      const membersInsert = [user.id, ...selectedGroupMembers].map(uid => ({
        room_id: newRoom.id, user_id: uid, role: 'admin'
      }))
      await supabase.from('chat_participants').insert(membersInsert)

      setActiveRoomId(newRoom.id)
      navigate(`/app/admin-chat?roomId=${newRoom.id}`, { replace: true })
      setShowCreateGroup(false)
      setGroupName('')
      setSelectedGroupMembers([])
      await reloadInbox()
      toast.success('Grupo criado!', `O grupo "${groupName}" foi criado com ${selectedGroupMembers.length + 1} membros.`)
    } catch { toast.error('Erro', 'Não foi possível criar o grupo.') }
  }

  // Add member to existing room
  const handleAddMemberToRoom = async (adminId: string) => {
    if (!activeRoomId || !user) return
    try {
      // Check if already a participant
      const { data: existing } = await supabase
        .from('chat_participants').select('user_id').eq('room_id', activeRoomId).eq('user_id', adminId)
      if (existing && existing.length > 0) { toast.warning('Já está no grupo', 'Este admin já faz parte da conversa.'); return }
      await supabase.from('chat_participants').insert({ room_id: activeRoomId, user_id: adminId, role: 'admin' })

      // Refresh participants
      const { data: directData } = await supabase.from('chat_participants').select('user_id').eq('room_id', activeRoomId)
      if (directData) {
        const userIds = directData.map(p => p.user_id).filter(Boolean)
        const { data: usersData } = await supabase.from('users').select('id, name, email').in('id', userIds)
        setParticipants((usersData || []).map(u => ({ id: u.id, name: u.name, email: u.email })))
      }

      setShowAddMember(false)
      const addedAdmin = allAdmins.find(a => a.id === adminId)
      toast.success('Membro adicionado!', `${addedAdmin?.name || 'Admin'} foi adicionado à conversa.`)
    } catch { toast.error('Erro', 'Não foi possível adicionar o membro.') }
  }

  // Upload image to Supabase Storage
  // V1.9.98 — bucket chat-images é privado, usa signed URL (TTL 1 ano) em vez de getPublicUrl
  const uploadImage = useCallback(async (file: File): Promise<string | null> => {
    if (!user) return null
    const ext = file.name.split('.').pop() || 'png'
    const path = `${user.id}/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`
    const { error } = await supabase.storage.from('chat-images').upload(path, file, { contentType: file.type })
    if (error) { console.error('Upload error:', error); return null }
    const { data: urlData, error: signedErr } = await supabase.storage
      .from('chat-images')
      .createSignedUrl(path, 60 * 60 * 24 * 365) // 1 ano
    if (signedErr) { console.error('Signed URL error:', signedErr); return null }
    return urlData?.signedUrl ?? null
  }, [user])

  // Handle image upload (from file input or paste)
  const handleImageUpload = useCallback(async (file: File) => {
    if (!activeRoomId || !user) return
    if (!file.type.startsWith('image/')) { toast.error('Erro', 'Apenas imagens são permitidas.'); return }
    if (file.size > 10 * 1024 * 1024) { toast.error('Erro', 'Imagem muito grande (máx 10MB).'); return }

    setUploadingImage(true)
    try {
      const url = await uploadImage(file)
      if (url) {
        await sendMessage(activeRoomId, user.id, '📷 Imagem', 'image', url)
        toast.success('Imagem enviada!', '')
      } else {
        toast.error('Erro', 'Não foi possível enviar a imagem.')
      }
    } catch { toast.error('Erro', 'Falha ao enviar imagem.') }
    finally { setUploadingImage(false) }
  }, [activeRoomId, user, uploadImage, sendMessage, toast])

  // Handle paste event for images
  const handlePaste = useCallback((e: React.ClipboardEvent) => {
    const items = e.clipboardData?.items
    if (!items) return
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.startsWith('image/')) {
        e.preventDefault()
        const file = items[i].getAsFile()
        if (file) handleImageUpload(file)
        return
      }
    }
  }, [handleImageUpload])

  // Send text message
  const handleSendMessage = async () => {
    if (!activeRoomId || !messageInput.trim() || !user) return
    try {
      await sendMessage(activeRoomId, user.id, messageInput.trim())
      setMessageInput('')
    } catch { toast.error('Erro', 'Não foi possível enviar a mensagem.') }
  }

  // Call handler
  // [V1.9.140-C] Debounce estritamente local — anti clique-duplo
  const callDebouncerRef = useRef(createClickDebouncer(2000))
  const handleCall = async (type: 'video' | 'audio') => {
    if (!callDebouncerRef.current()) {
      console.warn('[V1.9.140-C] Click ignored — too fast')
      return
    }
    let recipientId = adminIdForCall
    if (!recipientId && participants.length > 0) {
      recipientId = participants.find(p => p.id !== user?.id)?.id ?? null
    }
    if (!recipientId) { toast.error('Erro', 'Não foi possível identificar o destinatário.'); return }
    try {
      const request = await createRequest({
        recipientId, callType: type, timeoutSeconds: 1800,
        metadata: { roomId: activeRoomId, isAdminChat: true }
      })
      if (request) {
        setPendingCallRequest(request.request_id)
        setCallType(type)
        toast.success('Solicitação enviada', `Solicitação de ${type === 'video' ? 'vídeo' : 'áudio'} enviada!`)
        
        // Disparar abertura antecipada no Layout (opcional, mas bom para feedback visual)
        // No entanto, é melhor esperar o aceite ou abrir em modo "aguardando"
        // Como o VideoCall atual já lida com "isInitiator", podemos disparar agora:
        window.dispatchEvent(new CustomEvent('openVideoCall', {
          detail: {
            signalingRoomId: request.request_id,
            isInitiator: true,
            callType: type,
            patientId: recipientId
          }
        }))
      }
    } catch { toast.error('Erro', 'Não foi possível enviar a solicitação.'); setPendingCallRequest(null) }
  }

  if (!user) return <div className="min-h-[60vh] flex items-center justify-center bg-slate-900 text-slate-200"><p>Faça login para acessar o chat.</p></div>
  if (isAuthorizedAdmin === null) return <div className="min-h-[60vh] flex items-center justify-center bg-slate-900 text-slate-200"><Loader2 className="w-6 h-6 animate-spin text-slate-400" /></div>
  if (!isAuthorizedAdmin) return (
    <div className="min-h-[60vh] flex items-center justify-center bg-slate-900 text-slate-200">
      <div className="text-center"><p className="text-xl font-semibold mb-2">Acesso Restrito</p><p className="text-slate-400">Você não tem permissão para acessar este chat.</p></div>
    </div>
  )

  const chatHeader = isGroupChat
    ? (adminRooms.find(r => r.id === activeRoomId)?.name || 'Grupo Admin')
    : (otherParticipants[0]?.name || otherParticipants[0]?.email || 'Chat Admin')

  const chatSubtitle = isGroupChat
    ? `${participants.length} membros`
    : otherParticipants[0]?.email || ''

  return (
    <div className="min-h-[calc(100vh-6rem)] bg-slate-950 text-slate-100 flex">
      {/* Backdrop mobile */}
      <div role="button" tabIndex={0} aria-label="Fechar lista"
        className={`fixed inset-0 z-30 bg-black/50 md:hidden transition-opacity duration-200 ${activeRoomId && mobileSidebarOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={() => setMobileSidebarOpen(false)} onKeyDown={(e) => e.key === 'Escape' && setMobileSidebarOpen(false)} />

      {/* Sidebar */}
      <div className={`fixed md:relative inset-y-0 left-0 z-40 w-[280px] max-w-[85vw] md:w-80 md:max-w-none flex flex-col bg-slate-900 border-r border-slate-800 transition-transform duration-200 ease-out ${activeRoomId && !mobileSidebarOpen ? '-translate-x-full md:translate-x-0' : 'translate-x-0'}`}>
        <div className="p-3 md:p-4 border-b border-slate-800 flex items-center justify-between gap-2">
          <h2 className="text-base md:text-lg font-semibold text-white flex items-center gap-2 truncate">
            <Users className="w-5 h-5 text-primary-400 shrink-0" /> Equipe Admin
          </h2>
          <div className="flex items-center gap-1">
            <button type="button" onClick={() => setShowCreateGroup(true)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800" title="Criar grupo">
              <Plus className="w-4 h-4" />
            </button>
            {activeRoomId && (
              <button type="button" className="md:hidden p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
                onClick={() => setMobileSidebarOpen(false)} aria-label="Fechar lista">
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>

        <div className="p-2 md:p-3 border-b border-slate-800">
          <input type="text" placeholder="Buscar admin..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-primary-500" />
        </div>

        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {/* Existing group rooms */}
          {adminRooms.filter(r => r.name?.startsWith('👥')).map(room => (
            <button key={room.id} onClick={() => { setActiveRoomId(room.id); navigate(`/app/admin-chat?roomId=${room.id}`, { replace: true }); setMobileSidebarOpen(false) }}
              className={`w-full p-3 rounded-lg text-left transition-colors ${activeRoomId === room.id ? 'bg-primary-600 text-white' : 'bg-slate-800/50 hover:bg-slate-800 text-slate-200'}`}>
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{room.name}</p>
                  <p className="text-xs opacity-75">Grupo</p>
                </div>
                {room.unreadCount > 0 && <span className="bg-primary-500 text-white text-xs rounded-full px-2 py-0.5">{room.unreadCount}</span>}
              </div>
            </button>
          ))}

          {adminsLoading ? (
            <div className="flex items-center justify-center py-8"><Loader2 className="w-5 h-5 animate-spin text-slate-400" /></div>
          ) : (
            allAdmins
              .filter(a => { if (!searchQuery) return true; const q = searchQuery.toLowerCase(); return a.name?.toLowerCase().includes(q) || a.email?.toLowerCase().includes(q) })
              .filter(a => a.id !== user.id)
              .map(admin => {
                const room = adminRooms.find(r => {
                  const rp = r as typeof r & { participants?: { id: string }[] }
                  return rp.participants?.some(p => p.id === admin.id) && rp.participants?.some(p => p.id === user.id)
                })
                const isActive = activeRoomId === room?.id
                return (
                  <button key={admin.id}
                    onClick={() => { if (room) { setActiveRoomId(room.id); navigate(`/app/admin-chat?roomId=${room.id}`, { replace: true }) } else { handleOpenOrCreateRoom(admin.id, admin.name || admin.email || 'Admin') } setMobileSidebarOpen(false) }}
                    className={`w-full p-3 rounded-lg text-left transition-colors ${isActive ? 'bg-primary-600 text-white' : 'bg-slate-800/50 hover:bg-slate-800 text-slate-200'}`}>
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{admin.name || admin.email?.split('@')[0]}</p>
                        <p className="text-xs opacity-75 truncate">{admin.email}</p>
                      </div>
                      {room && <span className="text-xs opacity-50">
                        {room.lastMessageAt ? new Date(room.lastMessageAt).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }) : 'Novo'}
                      </span>}
                    </div>
                  </button>
                )
              })
          )}
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col bg-slate-900 min-w-0 w-full">
        {!activeRoomId ? (
          <div className="flex-1 flex items-center justify-center text-slate-400">
            <div className="text-center">
              <MessageCircle className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <p>Selecione um admin para iniciar uma conversa</p>
              <button onClick={() => setShowCreateGroup(true)} className="mt-4 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors flex items-center gap-2 mx-auto">
                <Users className="w-4 h-4" /> Criar grupo
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* Chat Header */}
            <div className="p-3 md:p-4 border-b border-slate-800 bg-slate-900/50 backdrop-blur-sm">
              <div className="flex items-center justify-between gap-2">
                <button type="button" className="md:hidden p-2 -ml-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 shrink-0"
                  onClick={() => setMobileSidebarOpen(true)} aria-label="Abrir lista">
                  <Menu className="w-5 h-5" />
                </button>
                <div className="flex-1 min-w-0">
                  <h3 className="text-base md:text-lg font-semibold text-white truncate">{chatHeader}</h3>
                  <p className="text-sm text-slate-400 truncate">{chatSubtitle}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button onClick={() => setShowAddMember(true)} className="p-2 bg-slate-700/50 text-slate-300 rounded-lg hover:bg-slate-700 transition-colors" title="Adicionar membro">
                    <UserPlus className="w-5 h-5" />
                  </button>
                  <button onClick={() => handleCall('video')} disabled={!!pendingCallRequest || participantsLoading}
                    className="p-2 bg-blue-500/20 text-blue-400 rounded-lg hover:bg-blue-500/30 transition-colors disabled:opacity-50" title="Videochamada">
                    <Video className="w-5 h-5" />
                  </button>
                  <button onClick={() => handleCall('audio')} disabled={!!pendingCallRequest || participantsLoading}
                    className="p-2 bg-green-500/20 text-green-400 rounded-lg hover:bg-green-500/30 transition-colors disabled:opacity-50" title="Chamada de áudio">
                    <Phone className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
              {messagesLoading ? (
                <div className="flex items-center justify-center text-sm text-slate-400 h-full">
                  <Loader2 className="w-4 h-4 animate-spin mr-2" /> Carregando mensagens...
                </div>
              ) : messages.length === 0 ? (
                <div className="text-sm text-slate-400 text-center mt-16">Nenhuma mensagem ainda. Envie a primeira!</div>
              ) : (
                messages.map(msg => {
                  const isOwn = msg.senderId === user.id
                  let timeDisplay = 'Agora'
                  if (msg.createdAt) { try { const d = new Date(msg.createdAt); if (!isNaN(d.getTime())) timeDisplay = d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) } catch {} }

                  const senderName = isGroupChat && !isOwn ? (msg.senderName || msg.senderEmail?.split('@')[0] || '') : ''

                  return (
                    <div key={msg.id} className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-lg rounded-2xl px-4 py-3 shadow transition-colors ${isOwn ? 'bg-primary-600 text-white' : 'bg-slate-800 text-slate-100'}`}>
                        {senderName && <p className="text-xs font-semibold text-primary-300 mb-1">{senderName}</p>}
                        {msg.messageType === 'image' && msg.fileUrl ? (
                          <div>
                            <img src={msg.fileUrl} alt="Imagem compartilhada" className="max-w-full max-h-80 rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
                              onClick={() => window.open(msg.fileUrl!, '_blank')} loading="lazy" />
                          </div>
                        ) : (
                          <p className="text-sm whitespace-pre-wrap break-words">{msg.message ?? ''}</p>
                        )}
                        <p className={`text-xs mt-1 ${isOwn ? 'text-primary-200' : 'text-slate-400'}`}>{timeDisplay}</p>
                      </div>
                    </div>
                  )
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Message Input */}
            <div className="p-4 border-t border-slate-800 bg-slate-900/50 backdrop-blur-sm">
              <div className="flex items-center gap-2">
                <input type="file" ref={fileInputRef} accept="image/*" className="hidden"
                  onChange={(e) => { const f = e.target.files?.[0]; if (f) handleImageUpload(f); e.target.value = '' }} />
                <button onClick={() => fileInputRef.current?.click()} disabled={uploadingImage}
                  className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors disabled:opacity-50" title="Enviar imagem">
                  {uploadingImage ? <Loader2 className="w-5 h-5 animate-spin" /> : <Paperclip className="w-5 h-5" />}
                </button>
                <input type="text" value={messageInput} onChange={(e) => setMessageInput(e.target.value)}
                  onKeyPress={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendMessage() } }}
                  onPaste={handlePaste}
                  placeholder="Digite sua mensagem... (cole imagens com Ctrl+V)"
                  className="flex-1 px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-primary-500" />
                <button onClick={handleSendMessage} disabled={!messageInput.trim()}
                  className="p-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                  <Send className="w-5 h-5" />
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Create Group Modal */}
      {showCreateGroup && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4" onClick={() => setShowCreateGroup(false)}>
          <div className="bg-slate-800 rounded-2xl p-6 w-full max-w-md max-h-[80vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white flex items-center gap-2"><Users className="w-5 h-5 text-primary-400" /> Criar Grupo</h3>
              <button onClick={() => setShowCreateGroup(false)} className="text-slate-400 hover:text-white"><X className="w-5 h-5" /></button>
            </div>
            <input type="text" placeholder="Nome do grupo..." value={groupName} onChange={e => setGroupName(e.target.value)}
              className="w-full px-3 py-2 mb-4 bg-slate-700 border border-slate-600 rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-primary-500" />
            <p className="text-sm text-slate-400 mb-2">Selecione os membros:</p>
            <div className="space-y-1 mb-4">
              {allAdmins.filter(a => a.id !== user.id).map(admin => (
                <label key={admin.id} className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-colors ${selectedGroupMembers.includes(admin.id) ? 'bg-primary-600/20 border border-primary-500/30' : 'hover:bg-slate-700'}`}>
                  <input type="checkbox" checked={selectedGroupMembers.includes(admin.id)}
                    onChange={e => setSelectedGroupMembers(prev => e.target.checked ? [...prev, admin.id] : prev.filter(id => id !== admin.id))}
                    className="accent-primary-500" />
                  <div><p className="text-sm font-medium text-slate-200">{admin.name || admin.email?.split('@')[0]}</p><p className="text-xs text-slate-400">{admin.email}</p></div>
                </label>
              ))}
            </div>
            <button onClick={handleCreateGroup} disabled={!groupName.trim() || selectedGroupMembers.length === 0}
              className="w-full py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium">
              Criar Grupo ({selectedGroupMembers.length} selecionados)
            </button>
          </div>
        </div>
      )}

      {/* Add Member Modal */}
      {showAddMember && activeRoomId && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4" onClick={() => setShowAddMember(false)}>
          <div className="bg-slate-800 rounded-2xl p-6 w-full max-w-md max-h-[80vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white flex items-center gap-2"><UserPlus className="w-5 h-5 text-primary-400" /> Adicionar Membro</h3>
              <button onClick={() => setShowAddMember(false)} className="text-slate-400 hover:text-white"><X className="w-5 h-5" /></button>
            </div>
            <p className="text-sm text-slate-400 mb-3">Membros atuais: {participants.map(p => p.name || p.email?.split('@')[0]).join(', ')}</p>
            <div className="space-y-1">
              {allAdmins.filter(a => a.id !== user.id && !participants.some(p => p.id === a.id)).map(admin => (
                <button key={admin.id} onClick={() => handleAddMemberToRoom(admin.id)}
                  className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-slate-700 transition-colors text-left">
                  <UserPlus className="w-4 h-4 text-primary-400 shrink-0" />
                  <div><p className="text-sm font-medium text-slate-200">{admin.name || admin.email?.split('@')[0]}</p><p className="text-xs text-slate-400">{admin.email}</p></div>
                </button>
              ))}
              {allAdmins.filter(a => a.id !== user.id && !participants.some(p => p.id === a.id)).length === 0 && (
                <p className="text-sm text-slate-500 text-center py-4">Todos os admins já estão na conversa.</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Video call notifications - O Layout.tsx já exibe notificações globais */}

      {/* Pending call indicator */}
      {pendingCallRequest && (
        <div className="fixed bottom-4 right-4 bg-blue-600/90 backdrop-blur-sm border border-blue-500/50 rounded-xl p-4 shadow-2xl max-w-sm z-50">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center shrink-0"><Loader2 className="w-5 h-5 text-white animate-spin" /></div>
            <div className="flex-1">
              <h4 className="text-sm font-semibold text-white mb-1">⏳ Aguardando resposta</h4>
              <p className="text-xs text-blue-100 leading-relaxed mb-2">Solicitação enviada. Aguardando aceitação.</p>
              {timeRemaining !== null && (
                <span className="text-xs font-mono font-semibold text-white">
                  ⏰ {timeRemaining > 0 ? `${Math.floor(timeRemaining / 60)}:${String(timeRemaining % 60).padStart(2, '0')}` : 'Expirado'}
                </span>
              )}
            </div>
            <button onClick={() => setConfirmModal({ isOpen: true, title: 'Cancelar', message: 'Cancelar a solicitação?', type: 'warning',
              onConfirm: async () => { await cancelRequest(pendingCallRequest); setPendingCallRequest(null); setTimeRemaining(null); toast.success('Cancelada', 'Solicitação cancelada.') } })}
              className="text-white/60 hover:text-white p-1 hover:bg-white/10 rounded"><X className="w-4 h-4" /></button>
          </div>
        </div>
      )}

      {/* VideoCall local removido - usando do Layout */}

      <ConfirmModal isOpen={confirmModal.isOpen} onClose={() => setConfirmModal({ ...confirmModal, isOpen: false })}
        onConfirm={confirmModal.onConfirm} title={confirmModal.title} message={confirmModal.message} type={confirmModal.type} />
    </div>
  )
}

export default AdminChat
