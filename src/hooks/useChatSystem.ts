import { useCallback, useEffect, useMemo, useState, useRef } from 'react'
import { supabase } from '../lib/supabase'
import { ChatEvolutionService, ChatMessage } from '../services/chatEvolutionService'

export interface ChatRoomSummary {
  id: string
  name: string | null
  type: string | null
  lastMessageAt: string | null
  unreadCount: number
}

export interface RoomMessage {
  id: string
  roomId: string
  senderId: string
  senderName: string
  senderEmail: string
  message: string
  createdAt: string
  messageType: string
  fileUrl?: string | null
  readAt?: string | null
}

export interface ChatSystemState {
  inbox: ChatRoomSummary[]
  inboxLoading: boolean
  messages: RoomMessage[]
  messagesLoading: boolean
  isOnline: boolean
  sendMessage: (roomId: string, senderId: string, content: string) => Promise<void>
  markRoomAsRead: (roomId: string) => Promise<void>
  reloadInbox: () => Promise<void>
}

interface UseChatSystemOptions {
  enabled?: boolean
}

interface ChatMessageRow {
  id: string | number
  room_id: string
  sender_id: string
  message: string | null
  message_type: string | null
  file_url?: string | null
  created_at: string
  read_at?: string | null
}

interface ChatProfile {
  user_id: string
  name?: string | null
  email?: string | null
}

const mapRoomSummary = (entry: any): ChatRoomSummary => ({
  id: entry.id,
  name: entry.name,
  type: entry.type,
  lastMessageAt: entry.last_message_at ?? null,
  unreadCount: entry.unread_count ?? 0
})

export const useChatSystem = (activeRoomId?: string, options?: UseChatSystemOptions): ChatSystemState => {
  const enabled = options?.enabled ?? true

  const [inbox, setInbox] = useState<ChatRoomSummary[]>([])
  const [inboxLoading, setInboxLoading] = useState(true)
  const [messages, setMessages] = useState<RoomMessage[]>([])
  const [messagesLoading, setMessagesLoading] = useState(false)
  const [isOnline, setIsOnline] = useState<boolean>(
    typeof window !== 'undefined' ? navigator.onLine : true
  )

  // Referências para controle de salvamento automático de evoluções
  const lastSaveTimeRef = useRef<Map<string, number>>(new Map())
  const inactivityTimerRef = useRef<Map<string, NodeJS.Timeout>>(new Map())

  const loadInbox = useCallback(async () => {
    if (!enabled) return

    setInboxLoading(true)
    const { data, error } = await supabase.from('v_chat_inbox').select('*')
    if (!error && data) {
      setInbox(data.map(mapRoomSummary))
    } else if (error) {
      console.warn('Falha ao carregar inbox:', error)
      setInbox([])
    }
    setInboxLoading(false)
  }, [enabled])

  const loadMessages = useCallback(async (roomId: string) => {
    if (!enabled) return

    setMessagesLoading(true)
    const { data, error } = await supabase
      .from('chat_messages')
      .select('id, room_id, sender_id, message, message_type, file_url, created_at, read_at')
      .eq('room_id', roomId)
      .order('created_at', { ascending: true })
      .limit(500)

    if (error || !data) {
      if (error) {
        console.warn('Falha ao carregar mensagens:', error)
      }
      setMessages([])
      setMessagesLoading(false)
      return
    }

    const rows = (data ?? []) as ChatMessageRow[]
    const senderIds = Array.from(new Set(rows.map(row => row.sender_id).filter(Boolean)))
    let profileMap = new Map<string, { name: string; email: string | null }>()

    if (senderIds.length > 0) {
      const { data: profileRows, error: profileError } = await supabase.rpc(
        'get_chat_user_profiles',
        { p_user_ids: senderIds }
      )

      if (profileError || !profileRows) {
        if (profileError) {
          console.warn('Falha ao carregar perfis de remetentes:', profileError)
        }
      } else {
        const profiles = profileRows as ChatProfile[]
        profileMap = new Map(
          profiles.map(profile => [
            profile.user_id,
            { name: profile.name ?? 'Usuário', email: profile.email ?? null }
          ])
        )
      }
    }

    const normalized: RoomMessage[] = rows.map(row => {
      const meta = profileMap.get(row.sender_id) ?? { name: 'Usuário', email: null }
      return {
        id: String(row.id),
        roomId: row.room_id,
        senderId: row.sender_id,
        senderName: meta.name,
        senderEmail: meta.email ?? '',
        message: row.message ?? '',
        createdAt: row.created_at,
        messageType: row.message_type ?? 'text',
        fileUrl: row.file_url ?? null,
        readAt: row.read_at ?? null
      }
    })

    setMessages(normalized)
    setMessagesLoading(false)
  }, [enabled])

  const markRoomAsRead = useCallback(
    async (roomId: string) => {
      if (!enabled) return

      try {
        await supabase.rpc('mark_room_read', { p_room_id: roomId })
      } catch (error) {
        console.warn('Não foi possível marcar mensagens como lidas:', error)
      } finally {
        await loadInbox()
      }
    },
    [enabled, loadInbox]
  )

  const sendMessage = useCallback(
    async (roomId: string, senderId: string, content: string): Promise<void> => {
      if (!enabled) {
        throw new Error('Sistema de chat desabilitado');
      }

      const trimmed = content.trim();
      if (!trimmed) {
        throw new Error('Mensagem vazia');
      }

      try {
        console.log('📤 Enviando mensagem:', { roomId, senderId, message: trimmed.substring(0, 50) + '...' });
        
        const { data, error } = await supabase.from('chat_messages').insert({
          room_id: roomId,
          sender_id: senderId,
          message: trimmed,
          message_type: 'text'
        }).select('id, created_at');

        if (error) {
          console.error('❌ Erro ao enviar mensagem:', error);
          throw new Error(`Falha ao enviar mensagem: ${error.message}`);
        }

        if (data && data.length > 0) {
          console.log('✅ Mensagem salva no banco:', { messageId: data[0].id, createdAt: data[0].created_at });
        }

        // Recarregar mensagens imediatamente após envio
        await loadMessages(roomId);
        console.log('✅ Mensagens recarregadas após envio');

        // Verificar se deve salvar como evolução (apenas para mensagens clínicas relevantes)
        if (ChatEvolutionService.shouldSaveAsEvolution(trimmed)) {
          // Reiniciar timer de inatividade para salvar sessão após 30 minutos sem atividade
          const existingTimer = inactivityTimerRef.current.get(roomId);
          if (existingTimer) {
            clearTimeout(existingTimer);
          }

          const timer = setTimeout(async () => {
            // Buscar informações da sala para identificar paciente e profissional
            const { data: roomData } = await supabase
              .from('chat_rooms')
              .select('id, type')
              .eq('id', roomId)
              .single();

            if (roomData && roomData.type === 'patient') {
              // Buscar participantes da sala
              const { data: participants } = await supabase
                .from('chat_participants')
                .select('user_id, role')
                .eq('room_id', roomId);

              if (participants) {
                const patient = participants.find(p => p.role === 'patient');
                const professional = participants.find(p => p.role === 'professional');

                if (patient && professional) {
                  await ChatEvolutionService.saveSessionOnInactivity(
                    roomId,
                    patient.user_id,
                    professional.user_id,
                    30 // 30 minutos de inatividade
                  );
                }
              }
            }
          }, 30 * 60 * 1000); // 30 minutos

          inactivityTimerRef.current.set(roomId, timer);
        }
      } catch (error) {
        console.error('Erro ao enviar mensagem:', error);
        throw error;
      }
    },
    [enabled, loadMessages]
  )

  useEffect(() => {
    if (!enabled) return
    loadInbox()
  }, [loadInbox, enabled])

  useEffect(() => {
    if (!enabled) return

    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [enabled])

  useEffect(() => {
    if (!enabled) return

    const channel = supabase
      .channel('chat-inbox-watch')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'chat_messages' },
        () => {
          loadInbox()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [loadInbox, enabled])

  useEffect(() => {
    if (!enabled) {
      setMessages([]);
      return;
    }

    if (!activeRoomId) {
      setMessages([]);
      return;
    }

    // Carregar mensagens iniciais
    loadMessages(activeRoomId);
    void markRoomAsRead(activeRoomId);

    // Configurar subscription em tempo real para novas mensagens
    const channel = supabase
      .channel(`chat-room-${activeRoomId}`, {
        config: {
          broadcast: { self: true }
        }
      })
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages',
          filter: `room_id=eq.${activeRoomId}`
        },
        (payload) => {
          console.log('📨 Nova mensagem recebida em tempo real:', {
            event: payload.eventType,
            table: payload.table,
            new: payload.new,
            roomId: activeRoomId
          });
          // Recarregar mensagens imediatamente
          loadMessages(activeRoomId);
          // Atualizar inbox para mostrar última mensagem
          loadInbox();
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'chat_messages',
          filter: `room_id=eq.${activeRoomId}`
        },
        () => {
          // Recarregar se houver atualização (ex: mensagem marcada como lida)
          loadMessages(activeRoomId);
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log('✅ Inscrito no canal de chat:', activeRoomId);
        } else if (status === 'CHANNEL_ERROR') {
          console.error('❌ Erro na subscription do canal:', activeRoomId);
        }
      });

    return () => {
      console.log('🔌 Desinscrevendo do canal:', activeRoomId);
      supabase.removeChannel(channel);
    };
  }, [activeRoomId, loadInbox, loadMessages, markRoomAsRead, enabled])

  return useMemo(
    () => ({
      inbox,
      inboxLoading,
      messages,
      messagesLoading,
      isOnline,
      sendMessage,
      markRoomAsRead,
      reloadInbox: loadInbox
    }),
    [inbox, inboxLoading, isOnline, loadInbox, markRoomAsRead, messages, messagesLoading, sendMessage]
  )
}

