import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { NoaResidentAI, type AIResponse } from '../lib/noaResidentAI'
import { ConversationalIntent } from '../lib/medcannlab/types'
import { clinicalAssessmentFlow } from '../lib/clinicalAssessmentFlow'
import { detectAecPromotion, AEC_PROMOTION_TRIGGER_TEXT } from '../lib/aecPromotionDetector'
import { supabase } from '../lib/supabase'

const AEC_RECENT_24H_CACHE_KEY = 'aec_recent_24h_check'
const AEC_RECENT_24H_CACHE_TTL_MS = 60 * 60 * 1000

async function checkRecentAec24h(userId: string): Promise<boolean> {
  try {
    const cacheKey = `${AEC_RECENT_24H_CACHE_KEY}_${userId}`
    const cached = typeof window !== 'undefined' ? window.sessionStorage.getItem(cacheKey) : null
    if (cached) {
      const parsed = JSON.parse(cached) as { value: boolean; exp: number }
      if (parsed.exp > Date.now()) return parsed.value
    }
  } catch {}

  try {
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
    const { data } = await supabase
      .from('aec_assessment_state')
      .select('id')
      .eq('user_id', userId)
      .eq('is_complete', true)
      .gte('last_update', since)
      .is('invalidated_at', null)
      .limit(1)
      .maybeSingle()

    const result = !!data
    try {
      if (typeof window !== 'undefined') {
        window.sessionStorage.setItem(
          `${AEC_RECENT_24H_CACHE_KEY}_${userId}`,
          JSON.stringify({ value: result, exp: Date.now() + AEC_RECENT_24H_CACHE_TTL_MS })
        )
      }
    } catch {}
    return result
  } catch {
    return false
  }
}

const sanitizeForSpeech = (text: string): string => {
  return text
    .replace(/\r?\n+/g, ' ')
    .replace(/[•●▪︎▪]/g, ' item ')
    .replace(/Nôa/gi, 'Noa')
    .replace(/Med\s*Cann\s*Lab/gi, 'Med Can Lab')
    .replace(/LGPD/gi, 'L G P D')
    .replace(/%/g, ' por cento ')
    .replace(/\s+/g, ' ')
    .trim()
}

/** Tokens que o Core pode enviar; usuário nunca deve ver — removidos ao salvar e ao exibir. */
const INVISIBLE_CONTENT_TOKENS = [
  '[TRIGGER_ACTION]',
  '[TRIGGER_SCHEDULING]',
  '[NAVIGATE_TERMINAL]',
  '[NAVIGATE_AGENDA]',
  '[NAVIGATE_PACIENTES]',
  '[NAVIGATE_RELATORIOS]',
  '[NAVIGATE_CHAT_PRO]',
  '[NAVIGATE_PRESCRICAO]',
  '[NAVIGATE_BIBLIOTECA]',
  '[NAVIGATE_FUNCAO_RENAL]',
  '[NAVIGATE_MEUS_AGENDAMENTOS]',
  '[NAVIGATE_MODULO_PACIENTE]',
  '[SHOW_PRESCRIPTION]',
  '[FILTER_PATIENTS_ACTIVE]',
  '[DOCUMENT_LIST]',
  '[ASSESSMENT_COMPLETED]',
  '[ASSESSMENT_FINALIZED]',
  '[FINALIZE_SESSION]'
]

function stripInvisibleTokensForStorage(text: string): string {
  if (!text || typeof text !== 'string') return text ?? ''
  let out = text
  for (const token of INVISIBLE_CONTENT_TOKENS) {
    out = out.split(token).join('')
  }
  return out.replace(/\n\s*\n\s*\n/g, '\n\n').trim()
}

export interface ConversationMessage {
  id: string
  role: 'user' | 'noa' | 'system'
  content: string
  timestamp: Date
  intent?: ConversationalIntent
  metadata?: Record<string, unknown>
}

/** Documento a injetar nesta mensagem para a Nôa analisar no chat (ex.: quando o usuário acabou de abrir o doc). */
export interface DocumentForAnalysis {
  id: string
  title: string
  summary?: string
  content?: string
}

interface SendMessageOptions {
  preferVoice?: boolean
  /** Quando o usuário acabou de abrir um documento no chat: envia o texto para a Nôa analisar em tempo real. */
  documentForAnalysis?: DocumentForAnalysis
  /** Permite definir o papel da mensagem (ex: 'system' para cards de ação). Default: 'user' */
  role?: 'user' | 'system'
  /** Tipo de mensagem (texto ou card de ação) */
  type?: 'text' | 'action_card'
  /** Ação estruturada para cards */
  action?: {
    label: string
    actionId: string
    payload?: any
  }
}

const createConversationId = () => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  // Fallback para ambientes sem crypto.randomUUID (ex: React Native antigo ou testes JSDOM incompletos)
  return `conv-${Date.now()}-${Math.random().toString(36).slice(2)}`
}


const mapResponseToIntent = (response: AIResponse): ConversationalIntent => {
  const metadataIntent = typeof response.metadata?.intent === 'string'
    ? response.metadata.intent
    : undefined

  if (metadataIntent && ['CHECK_STATUS', 'GET_TRAINING_CONTEXT', 'MANAGE_SIMULATION', 'ACCESS_LIBRARY', 'IMRE_ANALYSIS', 'SMALL_TALK', 'FOLLOW_UP', 'HELP', 'UNKNOWN'].includes(metadataIntent)) {
    return metadataIntent as ConversationalIntent
  }

  if (response.type === 'assessment') return 'IMRE_ANALYSIS'
  if (response.type === 'error') return 'UNKNOWN'

  return 'FOLLOW_UP'
}

const ensureDate = (value: Date | string | undefined) => {
  if (!value) return new Date()
  return value instanceof Date ? value : new Date(value)
}

const detectFollowUpQuestion = (text: string) => {
  if (!text) return false
  const normalized = text.toLowerCase()
  if (normalized.includes('?')) return true
  const questionHints = [
    /pode me dizer/,
    /pode informar/,
    /pode detalhar/,
    /me fale/,
    /me conte/,
    /qual (é|seria)/,
    /como est[aá]/,
    /quer continuar/,
    /pode atualizar/,
    /pode listar/,
    /me descreva/,
    /me informe/,
    /preciso que/,
    /pode confirmar/,
    /me responda/
  ]
  return questionHints.some(pattern => pattern.test(normalized))
}

interface SpeechQueueState {
  messageId: string
  fullContent: string
  sanitized: string
  displayIndex: number
  cancelled: boolean
  timer?: number
  requestImmediateReply?: boolean
}

interface NoaCommandDetail {
  type: 'navigate-section' | 'navigate-route' | 'show-prescription' | 'filter-patients' | 'open-document' | 'show-document-inline'
  target: string
  label?: string
  fallbackRoute?: string
  payload?: Record<string, any>
  rawMessage: string
  source: 'voice' | 'text'
  timestamp: string
}

type VoiceNavigationCommand = {
  id: string
  type: 'navigate-section' | 'navigate-route' | 'show-prescription' | 'filter-patients'
  target: string
  label: string
  patterns: RegExp[]
  fallbackRoute?: string
  payload?: Record<string, any>
}

export interface DocumentContextForChat {
  id: string
  title: string
  summary?: string | null
  content?: string | null
}

export const useMedCannLabConversation = (options?: {
  documentContext?: DocumentContextForChat | null
  /** Profissional escolhido na vitrine antes da AEC — personaliza abertura/consentimento no fluxo */
  aecTargetProfessional?: { name: string; specialty?: string } | null
}) => {
  const { user } = useAuth()
  const documentContext = options?.documentContext ?? null
  const aecTargetProfessional = options?.aecTargetProfessional ?? null
  const residentRef = useRef<NoaResidentAI | null>(null)
  const conversationIdRef = useRef<string>(createConversationId())
  const [messages, setMessages] = useState<ConversationMessage[]>([])
  const [hasShownWelcome, setHasShownWelcome] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [lastIntent, setLastIntent] = useState<ConversationalIntent | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [usedEndpoints, setUsedEndpoints] = useState<string[]>([])
  const [isOffline, setIsOffline] = useState(false)
  const [lastAecHintShownAt, setLastAecHintShownAt] = useState<number | undefined>(undefined)

  // Inicializar IA apenas quando houver um usuário logado
  useEffect(() => {
    if (user && !residentRef.current) {
      try {
        residentRef.current = new NoaResidentAI()
        console.log('✅ IA Residente inicializada para:', user.email)

        // [V1.8.10] Pré-carregamento silencioso do estado AEC, SEM injetar mensagem inicial.
        // A Nôa só deve falar depois do primeiro turno do paciente.
        //
        // [V1.9.4] Auto-pause: toda vez que o hook monta (F5, novo login, fechar/reabrir aba),
        // se o estado persistido está numa fase ativa (COMPLAINT_DETAILS, MEDICAL_HISTORY, etc.),
        // migramos automaticamente para INTERRUPTED e guardamos a fase original em
        // interruptedFromPhase. Assim o paciente NÃO é jogado de volta no meio da avaliação
        // sem consentir — o primeiro turno dele aciona o social guard e a Nôa pergunta
        // explicitamente "continuar ou nova?". Respeito ao tempo do paciente + LGPD de consent
        // contínuo. Ele pode:
        //   • Pedir "continuar" → resumeAssessment volta pra fase exata (COMPLAINT_DETAILS etc)
        //   • Pedir "nova" → restart
        //   • Dizer "não quero continuar" / perguntar algo casual → V1.9.3 libera chat livre
        if (!hasShownWelcome) {
          // [V1.9.10] Auto-pause SOMENTE para role=paciente.
          // Admin/profissional/aluno não têm AEC próprio — se rodar pra eles, o hook
          // cria estado AEC fantasma que quebra simulação/teaching mode (admin acaba
          // recebendo "sua avaliação foi pausada" em vez do TEACHING_PROMPT).
          const userType = (user as any).type || (user as any).user_type
          const isPatient = userType === 'paciente' || userType === 'patient'

          if (isPatient) {
            void clinicalAssessmentFlow
              .ensureLoaded(user.id)
              .then(() => {
                const state = clinicalAssessmentFlow.getState(user.id)
                if (state && state.phase !== 'INTERRUPTED' && state.phase !== 'COMPLETED') {
                  state.interruptedFromPhase = state.phase
                  state.phase = 'INTERRUPTED'
                  state.lastUpdate = new Date()
                  void clinicalAssessmentFlow.persist(user.id)
                  console.log('[AEC] Auto-pause: sessão migrada para INTERRUPTED no mount (fase original preservada em interruptedFromPhase)')
                }
              })
              .finally(() => {
                setHasShownWelcome(true)
              })
          } else {
            setHasShownWelcome(true)
          }
        }
      } catch (error) {
        console.error('❌ Erro ao inicializar IA Residente:', error)
        setError('Erro ao inicializar IA residente. Tente recarregar a página.')
      }
    } else if (!user && residentRef.current) {
      // Limpar IA quando usuário fizer logout
      residentRef.current = null
      setHasShownWelcome(false)
      setMessages([])
    }
  }, [user, hasShownWelcome, messages.length])

  const conversationId = useMemo(() => conversationIdRef.current, [])
  const lastSpokenMessageRef = useRef<string | null>(null)
  const voicesRef = useRef<SpeechSynthesisVoice[]>([])
  const speechEnabledRef = useRef(true)
  const speechQueueRef = useRef<SpeechQueueState | null>(null)
  const [voicesReady, setVoicesReady] = useState(false)
  const voiceNavigationCommandsRef = useRef<VoiceNavigationCommand[]>([
    {
      id: 'library-section',
      type: 'navigate-section',
      target: 'admin-upload',
      label: 'Biblioteca Compartilhada',
      fallbackRoute: '/app/library',
      patterns: [
        /biblioteca compartilhada/,
        /abrir biblioteca/,
        /abrir a biblioteca/,
        /base de conhecimento/,
        /acessar biblioteca/,
        /acessar a biblioteca/
      ]
    },
    {
      id: 'renal-section',
      type: 'navigate-section',
      target: 'admin-renal',
      label: 'Função Renal',
      patterns: [
        /funcao renal/,
        /função renal/,
        /abrir funcao renal/,
        /abrir função renal/
      ]
    },
    {
      id: 'attendance-section',
      type: 'navigate-section',
      target: 'atendimento',
      label: 'Atendimento',
      patterns: [
        /abrir atendimento/,
        /area de atendimento/,
        /área de atendimento/,
        /ir para atendimento/,
        /fluxo de atendimento/
      ]
    },
    {
      id: 'agenda-section',
      type: 'navigate-section',
      target: 'agendamentos',
      label: 'Agenda',
      patterns: [
        /abrir agenda/,
        /minha agenda/,
        /agenda clinica/,
        /agenda da clinica/,
        /ver agenda/
      ]
    },
    {
      id: 'show-prescription',
      type: 'show-prescription',
      target: 'latest',
      label: 'Mostrar última prescrição',
      patterns: [
        /mostrar prescri[cç][aã]o/,
        /mostrar a prescri[cç][aã]o/,
        /abrir prescri[cç][aã]o/,
        /ver prescri[cç][aã]o/,
        /mostrar protocolo terap[eê]utico/,
        /mostrar protocolo/,
        /onde est[aá] a prescri[cç][aã]o/,
        /quero ver a prescri[cç][aã]o/
      ]
    },
    {
      id: 'filter-patients-active',
      type: 'filter-patients',
      target: 'active',
      label: 'Filtrar pacientes ativos',
      payload: { filter: 'active' },
      patterns: [
        /pacientes ativos/,
        /mostrar pacientes ativos/,
        /listar pacientes ativos/,
        /filtrar pacientes ativos/,
        /pacientes em atendimento/
      ]
    },
    {
      id: 'filter-patients-rio-bonito',
      type: 'filter-patients',
      target: 'clinic:rio-bonito',
      label: 'Pacientes Rio Bonito',
      payload: { clinic: 'rio bonito' },
      patterns: [
        /pacientes de rio bonito/,
        /pacientes da cl[ií]nica de rio bonito/,
        /filtrar rio bonito/,
        /mostrar (a )?cl[ií]nica de rio bonito/,
        /pacientes rio bonito/
      ]
    },
    {
      id: 'patients-section',
      type: 'navigate-section',
      target: 'pacientes',
      label: 'Pacientes',
      patterns: [
        /abrir pacientes/,
        /meus pacientes/,
        /lista de pacientes/,
        /area de pacientes/,
        /área de pacientes/,
        /gestao de pacientes/
      ]
    },
    {
      id: 'reports-section',
      type: 'navigate-section',
      target: 'relatorios-clinicos',
      label: 'Relatórios',
      patterns: [
        /abrir relatorios/,
        /relatorios clinicos/,
        /relatórios clínicos/,
        /meus relatorios/,
        /area de relatorios/,
        /área de relatórios/
      ]
    },
    {
      id: 'team-section',
      type: 'navigate-section',
      target: 'chat-profissionais',
      label: 'Equipe Clínica',
      patterns: [
        /abrir equipe/,
        /equipe clinica/,
        /equipe clínica/,
        /chat clinico/,
        /chat clínico/,
        /colaboracao clinica/,
        /colaboração clínica/
      ]
    },
    {
      id: 'knowledge-route',
      type: 'navigate-route',
      target: '/app/library',
      label: 'Base de Conhecimento',
      patterns: [
        /base cientifica/,
        /base científica/,
        /base de conhecimento/,
        /biblioteca cientifica/,
        /biblioteca científica/
      ]
    },
    {
      id: 'patient-module-route',
      type: 'navigate-route',
      target: '/app/clinica/paciente/dashboard?section=analytics',
      label: 'Módulo Paciente',
      patterns: [
        /modulo paciente/i,
        /módulo paciente/i,
        /modo paciente/i,
        /ver como paciente/i,
        /dashboard paciente/i
      ]
    },
    {
      id: 'patient-appointments-route',
      type: 'navigate-route',
      target: '/app/clinica/paciente/agendamentos',
      label: 'Meus Agendamentos',
      patterns: [
        /meus agendamentos/i,
        /minhas consultas/i,
        /consultas agendadas/i,
        /ver agendamentos/i,
        /abrir agendamentos/i,
        /agenda do paciente/i,
        /agenda paciente/i,
        /agendamentos do paciente/i
      ]
    }
  ])

  const updateMessageContent = useCallback((messageId: string, content: string) => {
    setMessages(prev => {
      let changed = false
      const next = prev.map(message => {
        if (message.id === messageId) {
          if (message.content === content) {
            return message
          }
          changed = true
          return { ...message, content }
        }
        return message
      })
      return changed ? next : prev
    })
  }, [setMessages])

  const dismissMessage = useCallback((messageId: string) => {
    setMessages(prev =>
      prev.map(message =>
        message.id === messageId
          ? { ...message, metadata: { ...(message.metadata || {}), dismissed: true } }
          : message
      )
    )
  }, [setMessages])

  const stopSpeech = useCallback(() => {
    const queue = speechQueueRef.current
    if (queue) {
      queue.cancelled = true
      if (queue.timer) {
        window.clearTimeout(queue.timer)
        queue.timer = undefined
      }
      updateMessageContent(queue.messageId, queue.fullContent)
      speechQueueRef.current = null
    }

    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel()
    }
    setIsSpeaking(false)
  }, [updateMessageContent])

  useEffect(() => {
    const handleSoundToggle = (event: Event) => {
      const custom = event as CustomEvent<{ enabled?: boolean }>
      if (typeof custom.detail?.enabled === 'boolean') {
        speechEnabledRef.current = custom.detail.enabled
        if (!custom.detail.enabled) {
          stopSpeech()
        }
      }
    }

    window.addEventListener('noaSoundToggled', handleSoundToggle as EventListener)
    return () => window.removeEventListener('noaSoundToggled', handleSoundToggle as EventListener)
  }, [stopSpeech])

  useEffect(() => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      return
    }

    const populateVoices = () => {
      const available = window.speechSynthesis.getVoices()
      if (available && available.length > 0) {
        voicesRef.current = available
        setVoicesReady(true)
      }
    }

    populateVoices()
    window.speechSynthesis.onvoiceschanged = populateVoices

    return () => {
      if (window.speechSynthesis.onvoiceschanged === populateVoices) {
        window.speechSynthesis.onvoiceschanged = null
      }
    }
  }, [])

  useEffect(() => {
    const handleChatClosed = () => stopSpeech()
    window.addEventListener('noaChatClosed', handleChatClosed)
    const handleExternalStop = () => stopSpeech()
    window.addEventListener('noaStopSpeech', handleExternalStop)
    return () => {
      window.removeEventListener('noaChatClosed', handleChatClosed)
      window.removeEventListener('noaStopSpeech', handleExternalStop)
    }
  }, [stopSpeech])

  const normalizeCommandText = useCallback((text: string) => {
    return text
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
  }, [])

  const detectVoiceNavigationCommand = useCallback(
    (text: string): VoiceNavigationCommand | null => {
      const normalized = normalizeCommandText(text)
      const commands = voiceNavigationCommandsRef.current

      for (const command of commands) {
        if (command.patterns.some(pattern => pattern.test(normalized))) {
          return command
        }
      }

      return null
    },
    [normalizeCommandText]
  )

  const dispatchVoiceNavigationCommand = useCallback(
    (command: VoiceNavigationCommand, rawMessage: string, source: 'voice' | 'text') => {
      const detail: NoaCommandDetail = {
        type: command.type,
        target: command.target,
        label: command.label,
        fallbackRoute: command.fallbackRoute,
        payload: command.payload,
        rawMessage,
        source,
        timestamp: new Date().toISOString()
      }

      try {
        window.dispatchEvent(new CustomEvent<NoaCommandDetail>('noaCommand', { detail }))
        console.log('📡 Comando de navegação enviado para interface:', detail)
      } catch (error) {
        console.warn('⚠️ Falha ao despachar comando de navegação da Nôa:', error)
      }
    },
    []
  )

  const dispatchAppCommand = useCallback(
    (command: Omit<NoaCommandDetail, 'rawMessage' | 'source' | 'timestamp'>, rawMessage: string, source: 'voice' | 'text') => {
      const detail: NoaCommandDetail = {
        ...command,
        rawMessage,
        source,
        timestamp: new Date().toISOString()
      }

      try {
        window.dispatchEvent(new CustomEvent<NoaCommandDetail>('noaCommand', { detail }))
        console.log('📡 AppCommand executado na interface:', detail)
      } catch (error) {
        console.warn('⚠️ Falha ao despachar AppCommand da Nôa:', error)
      }
    },
    []
  )

  const executeAppCommands = useCallback(
    (appCommands: any[], rawMessage: string, source: 'voice' | 'text') => {
      const allowedTypes: NoaCommandDetail['type'][] = [
        'navigate-section',
        'navigate-route',
        'show-prescription',
        'filter-patients',
        'open-document',
        'show-document-inline'
      ]
      for (const entry of appCommands) {
        const kind = entry?.kind
        const cmd = entry?.command
        if (kind !== 'noa_command' || !cmd) continue
        if (!allowedTypes.includes(cmd.type)) continue
        // show-document-inline pode vir sem target preenchido; permitir mesmo assim
        const needsTarget = cmd.type !== 'show-document-inline'
        if (needsTarget && (typeof cmd.target !== 'string' || cmd.target.length < 1)) continue

        console.log('📡 [useMedCannLabConversation] Despachando comando via Evento:', cmd.type, cmd)
        const doDispatch = () => dispatchAppCommand(
          {
            type: cmd.type,
            target: typeof cmd.target === 'string' && cmd.target.length > 0 ? cmd.target : 'document',
            label: typeof cmd.label === 'string' ? cmd.label : undefined,
            fallbackRoute: typeof cmd.fallbackRoute === 'string' ? cmd.fallbackRoute : undefined,
            payload: cmd.payload && typeof cmd.payload === 'object' ? cmd.payload : undefined
          },
          rawMessage,
          source
        )

        // Documento inline: disparar após um microtask para a UI do chat estar estável e o listener montado
        if (cmd.type === 'show-document-inline') {
          setTimeout(doDispatch, 100)
        } else {
          doDispatch()
        }
      }
    },
    [dispatchAppCommand]
  )

  useEffect(() => {
    if (messages.length === 0) {
      return
    }

    const lastMessage = messages[messages.length - 1]
    if (!lastMessage || lastMessage.role !== 'noa') {
      return
    }

    console.log('🔍 Verificando síntese de voz para mensagem:', {
      messageId: lastMessage.id,
      role: lastMessage.role,
      speechEnabled: speechEnabledRef.current,
      voicesReady,
      voicesCount: voicesRef.current.length,
      hasSpeechSynthesis: typeof window !== 'undefined' && 'speechSynthesis' in window
    })

    // Evitar falar mensagem de boas-vindas duplicada
    // Se já foi falada uma vez, não falar novamente
    if (lastMessage.id === 'welcome' && lastSpokenMessageRef.current === 'welcome') {
      return
    }

    const fullContent = (lastMessage.metadata as Record<string, any> | undefined)?.fullContent ?? lastMessage.content

    if (!fullContent) {
      return
    }

    if (!voicesReady && voicesRef.current.length === 0) {
      speechQueueRef.current = null
      lastSpokenMessageRef.current = null
      updateMessageContent(lastMessage.id, fullContent)
      setIsSpeaking(false)
      return
    }

    if (lastSpokenMessageRef.current === lastMessage.id) {
      const activeQueue = speechQueueRef.current
      if (!activeQueue || activeQueue.messageId !== lastMessage.id || activeQueue.cancelled) {
        updateMessageContent(lastMessage.id, fullContent)
        speechQueueRef.current = null
      }
      return
    }

    lastSpokenMessageRef.current = lastMessage.id

    if (!speechEnabledRef.current || typeof window === 'undefined' || !('speechSynthesis' in window)) {
      speechQueueRef.current = null
      updateMessageContent(lastMessage.id, fullContent)
      setIsSpeaking(false)
      return
    }

    if (!window.speechSynthesis) {
      updateMessageContent(lastMessage.id, fullContent)
      speechQueueRef.current = null
      setIsSpeaking(false)
      return
    }

    const sanitized = sanitizeForSpeech(fullContent)
    const requiresImmediateReply = detectFollowUpQuestion(fullContent)
    const queue: SpeechQueueState = {
      messageId: lastMessage.id,
      fullContent,
      sanitized,
      displayIndex: 0,
      cancelled: false,
      requestImmediateReply: requiresImmediateReply
    }

    speechQueueRef.current = queue

    const normalizedResponse = fullContent.toLowerCase()
    const autoCommandIds = new Set<string>()
    if (normalizedResponse.includes('prescri') && normalizedResponse.includes('mostrar')) {
      autoCommandIds.add('show-prescription')
    }
    if (normalizedResponse.includes('pacientes ativos')) {
      autoCommandIds.add('filter-patients-active')
    }
    if (normalizedResponse.includes('rio bonito') && normalizedResponse.includes('paciente')) {
      autoCommandIds.add('filter-patients-rio-bonito')
    }

    if (autoCommandIds.size > 0) {
      autoCommandIds.forEach(commandId => {
        const command = voiceNavigationCommandsRef.current.find(cmd => cmd.id === commandId)
        if (command) {
          dispatchVoiceNavigationCommand(command, fullContent, 'text')
        }
      })
    }

    const revealStep = () => {
      const current = speechQueueRef.current
      if (!current || current.cancelled || current.messageId !== lastMessage.id) {
        return
      }

      const chunkSize = Math.max(12, Math.round(current.fullContent.length / 60))
      current.displayIndex = Math.min(current.fullContent.length, current.displayIndex + chunkSize)
      updateMessageContent(current.messageId, current.fullContent.slice(0, current.displayIndex))

      if (current.displayIndex < current.fullContent.length) {
        current.timer = window.setTimeout(() => {
          revealStep()
        }, 55)
      } else {
        current.timer = undefined
      }
    }

    revealStep()

    // Adicionar delay antes de iniciar a síntese de voz
    // Delay reduzido para evitar que o chat feche antes do áudio tocar
    const startSpeakingDelay = 100 // 0.1 segundos de delay antes de falar

    const utterance = new SpeechSynthesisUtterance(sanitized.length > 0 ? sanitized : fullContent)
    utterance.lang = 'pt-BR'
    utterance.rate = 1.15 // Andante (mais rápido que o anterior 0.94)
    utterance.volume = 0.93

    const voices = voicesRef.current
    if (voices && voices.length > 0) {
      const preferred = voices.filter(voice => voice.lang && voice.lang.toLowerCase() === 'pt-br')
      // Priorizar voz contralto (mais grave) para Nôa Esperanza - evitar vozes soprano
      const contralto = preferred.find(voice => /contralto|grave|baixa|low|alto/i.test(voice.name))
      const victoria = preferred.find(voice => /vit[oó]ria/i.test(voice.name))
      // Evitar vozes soprano (agudas)
      const nonSoprano = preferred.filter(voice => !/soprano|aguda|high|tenor/i.test(voice.name))
      const fallback = nonSoprano.find(voice => /bia|camila|carol|helo[ií]sa|brasil|female|feminina/i.test(voice.name))
      // Usar contralto primeiro, depois victoria, depois fallback não-soprano
      const selectedVoice = contralto || victoria || fallback || nonSoprano[0] || preferred[0] || voices[0]
      if (selectedVoice) {
        utterance.voice = selectedVoice
        // Ajustar pitch para voz mais grave (contralto) - evitar soprano
        if (contralto) {
          utterance.pitch = 0.65 // Mais grave (contralto)
        } else if (victoria) {
          utterance.pitch = 0.75 // Ligeiramente mais grave
        } else {
          utterance.pitch = 0.78 // Padrão (evitar soprano)
        }
      } else {
        utterance.pitch = 0.78 // Padrão se não encontrar voz
      }
    } else {
      utterance.pitch = 0.78 // Padrão se não houver vozes
    }

    utterance.onstart = () => {
      setIsSpeaking(true)
      if (queue.requestImmediateReply) {
        const estimatedDelay = Math.min(Math.max(sanitized.length * 15, 600), 4000)
        window.dispatchEvent(
          new CustomEvent<{ delay?: number }>('noaImmediateListeningRequest', {
            detail: { delay: estimatedDelay }
          })
        )
      }
    }
    utterance.onend = () => {
      console.log('🔇 Síntese de voz finalizada')
      const current = speechQueueRef.current
      if (current && current.messageId === lastMessage.id) {
        if (!current.timer) {
          speechQueueRef.current = null
          updateMessageContent(current.messageId, current.fullContent)
          // Aguardar antes de marcar como não falando para evitar conflito com reconhecimento
          setTimeout(() => {
            setIsSpeaking(false)
            console.log('✅ Estado isSpeaking atualizado para false (onend sem timer)')
          }, 300)
        } else {
          current.cancelled = false
          const finalize = () => {
            const state = speechQueueRef.current
            if (state && state.messageId === lastMessage.id) {
              if (state.timer) {
                window.clearTimeout(state.timer)
                state.timer = undefined
              }
              updateMessageContent(state.messageId, state.fullContent)
              speechQueueRef.current = null
            }
            // Aguardar antes de marcar como não falando
            setTimeout(() => {
              setIsSpeaking(false)
              console.log('✅ Estado isSpeaking atualizado para false (onend com timer)')
            }, 300)
          }
          current.timer = window.setTimeout(finalize, 80)
        }
      } else {
        // Aguardar antes de marcar como não falando
        setTimeout(() => {
          setIsSpeaking(false)
          console.log('✅ Estado isSpeaking atualizado para false (onend sem current)')
        }, 300)
      }
    }

    utterance.onerror = (error) => {
      // Silenciar erros de síntese de voz não críticos (comuns em alguns navegadores)
      if (error?.error !== 'not-allowed' && error?.error !== 'interrupted') {
        console.debug('[useMedCannLabConversation] Erro ao sintetizar fala:', error?.error || 'erro desconhecido')
      }
      const current = speechQueueRef.current
      if (current && current.messageId === lastMessage.id) {
        if (current.timer) {
          window.clearTimeout(current.timer)
          current.timer = undefined
        }
        updateMessageContent(current.messageId, current.fullContent)
        speechQueueRef.current = null
      }
      // Aguardar antes de marcar como não falando
      setTimeout(() => {
        setIsSpeaking(false)
        console.log('✅ Estado isSpeaking atualizado para false (após erro)')
      }, 300)
    }

    // Cancelar qualquer fala anterior e iniciar após delay
    try {
      // Cancelar apenas se estiver falando algo
      if (window.speechSynthesis.speaking) {
        window.speechSynthesis.cancel()
      }

      // Aguardar delay antes de iniciar a síntese de voz
      // Isso dá tempo para o usuário pensar e processar antes da IA responder
      setTimeout(() => {
        try {
          // Verificar se a mensagem ainda é a última e se não foi cancelada
          const currentQueue = speechQueueRef.current
          if (!currentQueue) {
            // Normal quando o usuário enviou outra mensagem ou fechou o chat antes do delay
            return
          }
          if (currentQueue.messageId !== lastMessage.id) {
            console.warn('⚠️ Mensagem mudou durante delay, cancelando síntese:', {
              queueId: currentQueue.messageId,
              lastMessageId: lastMessage.id
            })
            return
          }
          if (currentQueue.cancelled) {
            console.warn('⚠️ Queue foi cancelada, não iniciando síntese')
            return
          }

          // Verificar se síntese de voz ainda está habilitada
          if (!speechEnabledRef.current) {
            console.warn('⚠️ Síntese de voz desabilitada')
            return
          }

          // Verificar se speechSynthesis ainda está disponível
          if (!window.speechSynthesis) {
            console.warn('⚠️ speechSynthesis não disponível')
            return
          }

          // Verificar se ainda está falando antes de iniciar nova síntese
          if (window.speechSynthesis.speaking) {
            console.log('⚠️ Ainda há síntese em andamento, aguardando...')
            // Aguardar um pouco mais antes de tentar novamente
            setTimeout(() => {
              if (!window.speechSynthesis.speaking) {
                window.speechSynthesis.speak(utterance)
                setIsSpeaking(true)
                console.log('✅ Síntese de voz iniciada após aguardar. Voz:', utterance.voice?.name || 'padrão')
              } else {
                // Se ainda estiver falando, cancelar e iniciar nova
                window.speechSynthesis.cancel()
                setTimeout(() => {
                  window.speechSynthesis.speak(utterance)
                  setIsSpeaking(true)
                  console.log('✅ Síntese de voz iniciada após cancelamento. Voz:', utterance.voice?.name || 'padrão')
                }, 200)
              }
            }, 500)
          } else {
            console.log('🔊 Iniciando síntese de voz após delay:', {
              messageId: lastMessage.id,
              voice: utterance.voice?.name || 'padrão',
              textLength: sanitized.length
            })
            setIsSpeaking(true)
            window.speechSynthesis.speak(utterance)
            console.log('✅ Síntese de voz iniciada. Voz:', utterance.voice?.name || 'padrão')
          }
        } catch (speakError) {
          console.error('❌ Erro ao iniciar síntese de voz:', speakError)
          setIsSpeaking(false)
        }
      }, startSpeakingDelay)
    } catch (cancelError) {
      console.warn('⚠️ Erro ao cancelar síntese de voz:', cancelError)
      // Tentar falar mesmo assim após delay
      setTimeout(() => {
        try {
          // Verificar se a mensagem ainda é a última e se não foi cancelada
          const currentQueue = speechQueueRef.current
          if (currentQueue && currentQueue.messageId === lastMessage.id && !currentQueue.cancelled) {
            window.speechSynthesis.speak(utterance)
            console.log('✅ Síntese de voz iniciada (após erro de cancelamento)')
          }
        } catch (speakError) {
          console.warn('⚠️ Erro ao iniciar síntese de voz:', speakError)
          setIsSpeaking(false)
        }
      }, startSpeakingDelay)
    }

    return () => {
      const current = speechQueueRef.current
      if (current && current.messageId === lastMessage.id) {
        current.cancelled = true
        if (current.timer) {
          window.clearTimeout(current.timer)
          current.timer = undefined
        }
      }
    }
  }, [messages, voicesReady, updateMessageContent])

  // Removido: Auto-falar mensagem de boas-vindas duplicada
  // A mensagem de boas-vindas já é falada pelo useEffect principal que processa todas as mensagens da Nôa

  const sendMessage = useCallback(async (text: string, options: SendMessageOptions = {}) => {
    const trimmed = text.trim()
    if (!trimmed || isProcessing) return

    // Verificar se há usuário logado
    if (!user) {
      setError('Por favor, faça login para usar a IA residente.')
      return
    }

    // Garantir que a IA esteja inicializada (tentar novamente se necessário)
    if (!residentRef.current) {
      try {
        residentRef.current = new NoaResidentAI()
        console.log('✅ IA Residente inicializada durante envio de mensagem')
      } catch (error) {
        console.error('❌ Erro ao inicializar IA Residente:', error)
        setError('IA residente não inicializada. Aguarde um momento e tente novamente.')
        return
      }
    }

    setIsProcessing(true)
    setError(null)
    stopSpeech()

    let navigationCommand: VoiceNavigationCommand | null = null
    try {
      navigationCommand = detectVoiceNavigationCommand(trimmed)
      if (navigationCommand) {
        dispatchVoiceNavigationCommand(navigationCommand, trimmed, options.preferVoice ? 'voice' : 'text')
      }
    } catch (commandError) {
      console.warn('⚠️ Erro ao processar comando de navegação local:', commandError)
    }

    // [V1.9.105] Captura última msg da Nôa ANTES do setMessages — usada pelo
    // detector contextual de ASSESSMENT_START (noaInvited && userAffirmed).
    const lastNoaMsg = [...messages].reverse().find(m => m.role === 'noa')
    const lastAssistantMessage = typeof lastNoaMsg?.content === 'string' ? lastNoaMsg.content : undefined

    const userMessage: ConversationMessage = {
      id: `user-${Date.now()}`,
      role: options.role || 'user',
      content: trimmed,
      timestamp: new Date(),
      metadata: options.role === 'system' ? {
        type: 'action_card',
        action: (options as any).action
      } : undefined
    }

    setMessages(prev => [...prev, userMessage])

    // V1.9.95-B: mensagens de SISTEMA (action_cards locais como "✅ Agendamento confirmado!")
    // sao apenas displays no chat — NAO devem ser enviadas ao Core como input do usuario.
    // Sem este early return, o GPT-4o respondia ao "Agendamento confirmado!" oferecendo
    // mais agendamento (TRIGGER_SCHEDULING no texto), abrindo widget duplicado pos-AEC.
    if (options.role === 'system') {
      console.log('🛈 [SYSTEM_MSG] Card de sistema adicionado ao chat (sem chamada ao Core).')
      return
    }

    try {
      console.log('📨 Processando mensagem para IA:', trimmed.substring(0, 50) + '...')
      const contextualizedMessage =
        navigationCommand && navigationCommand.label
          ? `${trimmed}\n\n[contexto_da_plataforma]: A navegação para "${navigationCommand.label}" foi executada com sucesso na interface ativa.`
          : trimmed

      const uiContext = {
        route:
          typeof window !== 'undefined'
            ? `${window.location.pathname}${window.location.search}${window.location.hash}`
            : undefined,
        source: 'noa-chat',
        timestamp: new Date().toISOString(),
        // [V1.9.105] última msg da Nôa pra detector contextual ASSESSMENT_START
        ...(lastAssistantMessage ? { lastAssistantMessage } : {}),
        ...(aecTargetProfessional?.name
          ? { aecTargetProfessional: { name: aecTargetProfessional.name, specialty: aecTargetProfessional.specialty } }
          : {}),
        last_local_navigation: navigationCommand
          ? {
            type: navigationCommand.type,
            target: navigationCommand.target,
            label: navigationCommand.label
          }
          : null,
        document_in_chat: (() => {
          const doc = options.documentForAnalysis ?? (documentContext && documentContext.id ? documentContext : null)
          if (!doc?.id) return undefined
          const content = 'content' in doc && typeof doc.content === 'string' ? doc.content : (documentContext?.content)
          return {
            id: doc.id,
            title: doc.title,
            summary: doc.summary ?? (documentContext?.summary) ?? undefined,
            content_excerpt: typeof content === 'string' ? content.slice(0, 3500) : undefined
          }
        })()
      }

      console.log('📡 [useMedCannLabConversation] Preparando envio para Noa. User:', user.id, 'Email:', user.email);
      const response = await residentRef.current.processMessage(contextualizedMessage, user.id, user.email, uiContext)
      console.log('✅ Resposta da IA recebida:', response.content.substring(0, 100) + '...')

      // 🔧 app_command v1 — executar ações de UI (MVP) de forma retrocompatível
      try {
        // Core pode enviar app_commands em metadata (noaResidentAI coloca no metadata a partir do body do Core)
        const appCommands =
          Array.isArray(response.metadata?.app_commands) ? response.metadata.app_commands : []

        console.log('🔍 [useMedCannLabConversation] Comandos recebidos da Noa:', appCommands.length, appCommands);

        // Filtrar comandos que devem ser apenas botões (autoExecute: false) — não navegar automaticamente
        const autoExecCommands = appCommands.filter((c: any) => c?.autoExecute !== false)
        
        if (autoExecCommands.length > 0) {
          console.log('🚀 [useMedCannLabConversation] Disparando auto-execucao de comandos:', autoExecCommands.length);
          const trimmed = stripInvisibleTokensForStorage(response.content)
          executeAppCommands(autoExecCommands, trimmed, options.preferVoice ? 'voice' : 'text')
        }
        // Guardar comandos de botão para renderizar na UI
        const buttonCommands = appCommands.filter((c: any) => c?.autoExecute === false)
        if (buttonCommands.length > 0) {
          console.log('🔘 app_commands como botões (sem auto-navigate):', buttonCommands.length)
          // Será injetado no metadata da mensagem abaixo
          ;(response as any)._buttonCommands = buttonCommands
        }
        // [VIP TRIGGER] Padrão Agendamento para o Terminal
        if (response.metadata?.trigger_terminal === true) {
          console.log('⚡ [VIP TRIGGER] Terminal de Atendimento detectado no metadata. Navegando...');
          dispatchAppCommand(
            { 
              type: 'navigate-section', 
              target: 'atendimento',
              label: 'Abrir Atendimento',
              fallbackRoute: '/app/clinica/profissional/dashboard'
            },
            response.content,
            options.preferVoice ? 'voice' : 'text'
          );
        }
        // [VIP TRIGGER] Padrão Agendamento para a Biblioteca
        if (response.metadata?.trigger_library === true) {
          console.log('⚡ [VIP TRIGGER] Biblioteca detectada no metadata. Navegando...');
          dispatchAppCommand(
            { 
              type: 'navigate-section', 
              target: 'admin-upload',
              label: 'Abrir Biblioteca',
              fallbackRoute: '/app/library'
            },
            response.content,
            options.preferVoice ? 'voice' : 'text'
          );
        }

        // [VIP TRIGGER] Padrão Agendamento para Lista de Pacientes
        if (response.metadata?.trigger_patients === true) {
          console.log('⚡ [VIP TRIGGER] Lista de Pacientes detectada no metadata. Navegando...');
          dispatchAppCommand(
            { 
              type: 'navigate-section', 
              target: 'terminal-clinico',
              label: 'Ver Pacientes',
              fallbackRoute: '/app/clinica/profissional/dashboard'
            },
            response.content,
            options.preferVoice ? 'voice' : 'text'
          );
        }
        // [VIP TRIGGER] Válvula de Escape da Avaliação Clínica (AEC)
        if (response.metadata?.trigger_stop_assessment === true) {
          console.log('⚡ [VIP TRIGGER] Interrupção de Avaliação detectada. Navegando para Dashboard...');
          dispatchAppCommand(
            { 
              type: 'navigate-route', 
              target: '/app/dashboard',
              label: 'Sair da Avaliação'
            },
            response.content,
            options.preferVoice ? 'voice' : 'text'
          );
        }
      } catch (commandError) {
        console.warn('⚠️ Falha ao executar app_commands:', commandError)
      }

      const intent = mapResponseToIntent(response)
      // Conteúdo sem tokens invisíveis: usuário nunca vê [TRIGGER_ACTION], [TRIGGER_SCHEDULING], etc.
      const cleanContent = stripInvisibleTokensForStorage(response.content)
      const assistantMessage: ConversationMessage = {
        id: `noa-${Date.now()}`,
        role: 'noa',
        content: cleanContent,
        timestamp: ensureDate(response.timestamp),
        intent,
        metadata: {
          confidence: response.confidence,
          reasoning: response.reasoning,
          metadata: response.metadata,
          fullContent: cleanContent, // síntese de voz também sem tokens
          fromVoice: options.preferVoice ?? false,
          usedEndpoints: ['resident-ai'],
          // Core: expor no topo para a UI (widget de agendamento e botões)
          trigger_scheduling: response.metadata?.trigger_scheduling === true,
          professionalId: response.metadata?.professionalId,
          // Modo Determinístico Offline
          offline: response.metadata?.offline === true ||
            (typeof response.metadata?.model === 'string' && response.metadata.model.includes('Deterministic')),
          // Botões de navegação pós-AEC (autoExecute: false)
          buttonCommands: (response as any)._buttonCommands ?? null
        }
      }

      setMessages(prev => [...prev, assistantMessage])
      setLastIntent(intent)
      setUsedEndpoints(prev => [...prev, 'resident-ai'])

      // Detectar modo offline e atualizar estado
      const responseIsOffline = response.metadata?.offline === true ||
        (typeof response.metadata?.model === 'string' && String(response.metadata.model).includes('Deterministic'))
      setIsOffline(responseIsOffline)
      if (responseIsOffline) {
        console.log('🟡 [OFFLINE] Nôa operando em Modo Determinístico (Consciência Reduzida)')
      } else if (isOffline) {
        // Saiu do offline → reconectou
        console.log('✅ [RECONNECTED] Nôa reconectada ao centro cognitivo')
        setIsOffline(false)
      }

      console.log('💬 Mensagem da IA adicionada ao chat. Total de mensagens:', messages.length + 2)
      console.log('🔍 Metadata recebida:', response.metadata) // Debug log

      // V1.9.121-C — AEC Promotion Detector com hasRecentAec24h funcional
      // Resolve caso João (04/05). Detecta padrão clínico em chat livre,
      // oferece botão consciente pra ASSESSMENT_START (P8 reuso).
      // V1.9.121-C: cross-session cooldown via Supabase + cache sessionStorage 1h.
      try {
        if (user?.id) {
          const activeAecState = clinicalAssessmentFlow.getState(user.id)
          const hasActiveAec = !!(activeAecState && activeAecState.phase !== 'COMPLETED')
          const hasRecentAec24h = await checkRecentAec24h(user.id)
          const detectorMessages = [...messages, assistantMessage].map(m => ({
            role: m.role,
            content: typeof m.content === 'string' ? m.content : '',
            intent: typeof m.intent === 'string' ? m.intent : undefined
          }))
          const result = detectAecPromotion(detectorMessages, {
            userType: (user as any).type,
            hasActiveAec,
            hasRecentAec24h,
            lastHintShownAt: lastAecHintShownAt
          })
          if (result.shouldShowHint) {
            console.log('💡 [V1.9.121] AEC Promotion Hint disparado', result.signals)
            setLastAecHintShownAt(Date.now())
            setTimeout(() => {
              const hintMsg: ConversationMessage = {
                id: `aec-hint-${Date.now()}`,
                role: 'system',
                content: 'Estamos em chat livre. Posso reiniciar como Avaliação Clínica Inicial estruturada?',
                timestamp: new Date(),
                metadata: {
                  type: 'aec_promotion_hint',
                  triggerText: AEC_PROMOTION_TRIGGER_TEXT
                }
              }
              setMessages(prev => [...prev, hintMsg])
            }, 600)
          }
        }
      } catch (detectorError) {
        console.warn('⚠️ [V1.9.121] Detector falhou (não bloqueia fluxo):', detectorError)
      }

      // 🎯 TRIGGER VISUAL: Se avaliação concluída, mostrar card de sucesso
      // V1.9.91: revertido Fix C (overreach). O fluxo nativo do projeto ja gera
      // os 2 botoes pos-AEC via app_commands navigate-section no Core (linha 5257-5268).
      // SchedulingWidget inline aparece via [TRIGGER_SCHEDULING] injetado pos-AEC (V1.9.91).
      if (response.metadata?.assessmentCompleted) {
        setTimeout(() => {
          const systemMsg: ConversationMessage = {
            id: `sys-${Date.now()}`,
            role: 'system',
            content: `✅ **Avaliação Concluída com Sucesso!**\n\nSeu relatório clínico preliminar foi gerado.\nVocê pode visualizá-lo agora na aba **"Analytics e Evolução"** ou clicando no botão abaixo.`,
            timestamp: new Date(),
            metadata: {
              type: 'action_card',
              action: {
                label: 'Ver Relatório Clínico',
                command: 'reports-section' // Mapeia para navegação
              }
            }
          }
          setMessages(prev => [...prev, systemMsg])

          // Tocar som de sucesso (se houver)
          // playSuccessSound()
        }, 1000)
      }

      // Detectar se a IA mencionou ter criado um slide (evitar falso positivo: **negrito** comum em respostas clínicas)
      const responseLower = response.content.toLowerCase()
      const userRole = String(user?.type || '').toLowerCase()
      const isPatientChat =
        userRole === 'paciente' ||
        userRole === 'patient'

      const slideKeywords = [
        'criei um slide', 'criei slide', 'slide criado', 'slide foi criado',
        'slide disponível', 'slide está disponível', 'novo slide', 'slide pronto',
        'slide gerado', 'slide foi gerado', 'preparação de slides', 'área de preparação de slides',
        'criar slide', 'gerar slide', 'slide na área', 'na área de preparação'
      ]

      const hasSlideMention = slideKeywords.some(keyword => responseLower.includes(keyword))

      const hasSlideStructure =
        /#\s{0,3}[^\s#][^\n]*/m.test(response.content) ||
        /\bslide\s*[:—\-\s]\s*\S/i.test(response.content)

      const treatAsSlide =
        hasSlideMention ||
        (hasSlideStructure && /\bslide\b/i.test(response.content))

      // Pacientes não têm INSERT em `documents` (RLS) — heurística antiga gerava POST 403 em toda resposta com markdown
      if (treatAsSlide && !isPatientChat) {
        // Extrair título do slide de várias formas
        let slideTitle = `Slide ${new Date().toLocaleDateString('pt-BR')}`

        // Tentar extrair título de diferentes formatos
        const titlePatterns = [
          /slide[:\s]+"?([^"\n]+)"?/i,
          /título[:\s]+"?([^"\n]+)"?/i,
          /#+\s+([^\n]+)/,
          /\*\*([^\*]+)\*\*/,
          /slide\s+(\d+)[:\s]+([^\n]+)/i
        ]

        for (const pattern of titlePatterns) {
          const match = response.content.match(pattern)
          if (match) {
            slideTitle = match[1]?.trim() || match[2]?.trim() || slideTitle
            if (slideTitle && slideTitle.length > 3) break
          }
        }

        // Extrair conteúdo do slide
        let slideContent = response.content

        // Se a resposta contém estrutura de slide, tentar extrair melhor
        const contentPatterns = [
          /conteúdo[:\s]+([^\n]+)/i,
          /slide[:\s]+[^\n]+\n([\s\S]+)/i,
          /#+\s+[^\n]+\n([\s\S]+)/,
        ]

        for (const pattern of contentPatterns) {
          const match = response.content.match(pattern)
          if (match && match[1]) {
            slideContent = match[1].trim()
            // Limitar conteúdo a tamanho razoável (primeiras 2000 caracteres)
            if (slideContent.length > 2000) {
              slideContent = slideContent.substring(0, 2000) + '...'
            }
            break
          }
        }

        // Se não encontrou conteúdo específico, usar a resposta inteira (limitada)
        if (slideContent === response.content && slideContent.length > 500) {
          slideContent = slideContent.substring(0, 2000) + '...'
        }

        // Criar evento para notificar a criação do slide
        const slideEvent = new CustomEvent('slideCreated', {
          detail: {
            id: `slide_${Date.now()}`,
            title: slideTitle,
            content: slideContent,
            createdBy: 'ai'
          }
        })
        window.dispatchEvent(slideEvent)

        // Salvar slide no Supabase
        if (user?.id) {
          try {
            const { supabase } = await import('../lib/supabase')
            const { data, error } = await supabase
              .from('documents')
              .insert({
                title: slideTitle,
                content: slideContent,
                category: 'slides',
                file_type: 'slide',
                author: user.name || user.email,
                summary: slideContent.substring(0, 200) || '',
                tags: ['slide', 'aula', 'pedagogico', 'ai-generated'],
                keywords: ['slide', 'presentation', 'ai'],
                target_audience: ['student', 'professional'],
                isLinkedToAI: true
              })
              .select()
              .single()

            if (!error && data) {
              console.log('✅ Slide criado pela IA e salvo no Supabase:', data.id)
              // Atualizar evento com ID real do banco e recarregar slides na interface
              const updatedEvent = new CustomEvent('slideCreated', {
                detail: {
                  id: data.id,
                  title: slideTitle,
                  content: slideContent,
                  createdBy: 'ai'
                }
              })
              window.dispatchEvent(updatedEvent)
            } else if (error) {
              const code = (error as { code?: string })?.code
              if (code === '42501') {
                if (import.meta.env.DEV) {
                  console.debug('[Noa] Slide: INSERT em documents bloqueado pela RLS (esperado para este perfil).')
                }
              } else {
                console.error('❌ Erro ao salvar slide no Supabase:', error)
              }
            }
          } catch (error) {
            console.error('❌ Erro ao salvar slide criado pela IA:', error)
          }
        }
      }

      if (response.type === 'error') {
        setError(response.content)
      }
    } catch (err) {
      console.error('[useMedCannLabConversation] Erro ao processar mensagem:', err)
      setError('Enfrentei um obstáculo ao falar com a IA residente. Podemos tentar novamente em instantes.')
    } finally {
      setIsProcessing(false)
    }
  }, [isProcessing, user?.email, user?.id, user?.type, stopSpeech, documentContext, aecTargetProfessional])

  const triggerQuickCommand = useCallback((command: string) => {
    sendMessage(command)
  }, [sendMessage])

  const resetConversation = useCallback(() => {
    // Só reiniciar se houver usuário logado
    if (user) {
      residentRef.current = new NoaResidentAI()
    }
    conversationIdRef.current = createConversationId()
    setMessages([{
      id: 'welcome',
      role: 'noa',
      content: 'Conversa reiniciada. Vamos retomar? Posso monitorar o status do sistema ou abrir um novo protocolo clínico.',
      timestamp: new Date(),
      intent: 'HELP'
    }])
    setLastIntent(null)
    setUsedEndpoints([])
    setError(null)
  }, [user])

  return {
    conversationId,
    messages,
    isProcessing,
    lastIntent,
    error,
    usedEndpoints,
    isSpeaking,
    isOffline,
    sendMessage,
    triggerQuickCommand,
    resetConversation,
    dismissMessage
  }
}

