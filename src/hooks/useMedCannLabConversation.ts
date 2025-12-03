import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { normalizeUserType } from '../lib/userTypes'
import { NoaResidentAI, type AIResponse } from '../lib/noaResidentAI'
import { ConversationalIntent } from '../lib/medcannlab/types'

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

export interface ConversationMessage {
  id: string
  role: 'user' | 'noa'
  content: string
  timestamp: Date
  intent?: ConversationalIntent
  metadata?: Record<string, unknown>
}

interface SendMessageOptions {
  preferVoice?: boolean
}

const createConversationId = () => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  return `conv-${Date.now()}-${Math.random().toString(36).slice(2)}`
}

const mapResponseToIntent = (response: AIResponse): ConversationalIntent => {
  const metadataIntent = typeof response.metadata?.intent === 'string'
    ? response.metadata.intent
    : undefined

  if (metadataIntent && ['CHECK_STATUS','GET_TRAINING_CONTEXT','MANAGE_SIMULATION','ACCESS_LIBRARY','IMRE_ANALYSIS','SMALL_TALK','FOLLOW_UP','HELP','UNKNOWN'].includes(metadataIntent)) {
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
    /apresente-se/,
    /o que trouxe/,
    /por favor.*apresente/,
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
  type: 'navigate-section' | 'navigate-route' | 'show-prescription' | 'filter-patients'
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

export const useMedCannLabConversation = () => {
  const { user } = useAuth()
  const residentRef = useRef<NoaResidentAI | null>(null)
  const conversationIdRef = useRef<string>(createConversationId())
  const [messages, setMessages] = useState<ConversationMessage[]>([])
  const [hasShownWelcome, setHasShownWelcome] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [lastIntent, setLastIntent] = useState<ConversationalIntent | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [usedEndpoints, setUsedEndpoints] = useState<string[]>([])
  
  // Inicializar IA apenas quando houver um usuário logado (UMA VEZ APENAS)
  useEffect(() => {
    // Verificar se já foi inicializado para evitar múltiplas inicializações
    if (user && !residentRef.current) {
      try {
        residentRef.current = new NoaResidentAI()
        console.log('✅ IA Residente inicializada para:', user.email)
        
        // NÃO adicionar mensagem de boas-vindas automática
        // A IA deve apenas escutar e responder quando o usuário fizer uma pergunta
        // Removido: mensagem de boas-vindas automática
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
  }, [user]) // APENAS user como dependência - remover hasShownWelcome e messages.length que causam re-inicializações

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
      console.warn('⚠️ SpeechSynthesis não disponível neste navegador')
      return
    }

    const populateVoices = () => {
      try {
        const available = window.speechSynthesis.getVoices()
        console.log('🔊 Vozes disponíveis:', available.length)
        
        if (available && available.length > 0) {
          voicesRef.current = available
          setVoicesReady(true)
          console.log('✅ Vozes carregadas com sucesso. Vozes PT-BR:', 
            available.filter(v => v.lang && v.lang.toLowerCase().includes('pt')).length)
        } else {
          console.warn('⚠️ Nenhuma voz disponível ainda. Tentando novamente...')
          // Tentar novamente após um delay
          setTimeout(() => {
            const retry = window.speechSynthesis.getVoices()
            if (retry && retry.length > 0) {
              voicesRef.current = retry
              setVoicesReady(true)
              console.log('✅ Vozes carregadas após retry:', retry.length)
            }
          }, 500)
        }
      } catch (error) {
        console.error('❌ Erro ao carregar vozes:', error)
      }
    }

    // Carregar vozes imediatamente
    populateVoices()
    
    // Também tentar após um pequeno delay (alguns navegadores demoram para carregar)
    setTimeout(populateVoices, 100)
    
    // Listener para quando as vozes mudarem
    if (window.speechSynthesis.onvoiceschanged !== undefined) {
      window.speechSynthesis.onvoiceschanged = populateVoices
    }

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

  useEffect(() => {
    if (messages.length === 0) {
      return
    }

    const lastMessage = messages[messages.length - 1]
    if (!lastMessage || lastMessage.role !== 'noa') {
      return
    }

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

    if (!speechEnabledRef.current) {
      console.log('🔇 Síntese de voz desabilitada pelo usuário')
      speechQueueRef.current = null
      updateMessageContent(lastMessage.id, fullContent)
      setIsSpeaking(false)
      return
    }

    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      console.warn('⚠️ SpeechSynthesis não disponível')
      speechQueueRef.current = null
      updateMessageContent(lastMessage.id, fullContent)
      setIsSpeaking(false)
      return
    }

    if (!window.speechSynthesis) {
      console.warn('⚠️ window.speechSynthesis não disponível')
      updateMessageContent(lastMessage.id, fullContent)
      speechQueueRef.current = null
      setIsSpeaking(false)
      return
    }

    const sanitized = sanitizeForSpeech(fullContent)
    // Verificar primeiro o metadata, depois a detecção automática
    const messageMetadata = lastMessage.metadata as Record<string, any> | undefined
    const requiresImmediateReply = messageMetadata?.requestImmediateReply ?? 
                                   (messageMetadata?.type === 'assessment' || // Todas as mensagens de avaliação requerem resposta
                                    detectFollowUpQuestion(fullContent))
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

    const utterance = new SpeechSynthesisUtterance(sanitized.length > 0 ? sanitized : fullContent)
    utterance.lang = 'pt-BR'
    utterance.rate = 1.15 // Andante (mais rápido que o anterior 0.94)
    utterance.volume = 0.93

    const voices = voicesRef.current
    if (voices && voices.length > 0) {
      const preferred = voices.filter(voice => voice.lang && voice.lang.toLowerCase() === 'pt-br')
      
      // CRÍTICO: Filtrar APENAS vozes femininas - excluir explicitamente vozes masculinas
      const femaleVoices = preferred.filter(voice => {
        const name = voice.name.toLowerCase()
        // Excluir vozes masculinas
        if (/male|masculino|homem|man|diego|joão|paulo|ricardo|eduardo|luis|pedro|carlos|miguel|rafael|bruno|felipe|gustavo|leonardo|rodrigo|thiago|vinicius|wagner|yuri|zeca|antonio|jose|mario|roberto|sergio|washington/i.test(name)) {
          return false
        }
        // Incluir vozes femininas ou neutras
        return /female|feminina|mulher|woman|bia|camila|carol|helo[ií]sa|maria|ana|julia|beatriz|fernanda|patricia|sandra|claudia|adriana|luciana|renata|vanessa|tatiana|gabriela|leticia|raquel|isabela|natalia|bruna|daniela|monica|silvia|eliane|fabiana|gisele|juliana|karen|larissa|marcia|nadia|olivia|paula|regina|sonia|tania|vera|yara|zuleica|contralto|vit[oó]ria|brasil/i.test(name) || 
               !/male|masculino|homem|man|diego|joão|paulo|ricardo|eduardo/i.test(name)
      })
      
      // Priorizar voz contralto (mais grave) para Nôa Esperanza - evitar vozes soprano
      const contralto = femaleVoices.find(voice => /contralto|grave|baixa|low|alto/i.test(voice.name))
      const victoria = femaleVoices.find(voice => /vit[oó]ria/i.test(voice.name))
      
      // Evitar vozes soprano (agudas) - apenas entre vozes femininas
      const nonSoprano = femaleVoices.filter(voice => !/soprano|aguda|high|tenor/i.test(voice.name))
      const fallback = nonSoprano.find(voice => /bia|camila|carol|helo[ií]sa|brasil|female|feminina/i.test(voice.name))
      
      // Usar contralto primeiro, depois victoria, depois fallback não-soprano, depois qualquer voz feminina
      const selectedVoice = contralto || victoria || fallback || nonSoprano[0] || femaleVoices[0]
      
      if (selectedVoice) {
        utterance.voice = selectedVoice
        console.log('🔊 Voz selecionada (feminina):', selectedVoice.name)
        // Ajustar pitch para voz contralto de aproximadamente 35 anos (clara, macia, suave)
        // Pitch ideal para contralto: 0.85-0.95 (não muito grave, não muito aguda)
        if (contralto) {
          utterance.pitch = 0.88 // Contralto equilibrado (35 anos)
        } else if (victoria) {
          utterance.pitch = 0.90 // Ligeiramente mais clara
        } else {
          utterance.pitch = 0.92 // Padrão para voz feminina clara (evitar soprano agudo)
        }
      } else {
        // Se não encontrar voz feminina, FORÇAR pitch alto para simular voz feminina
        console.warn('⚠️ Nenhuma voz feminina encontrada, usando pitch alto para simular voz feminina')
        utterance.pitch = 1.2 // Pitch alto para forçar som feminino mesmo sem voz específica
      }
    } else {
      // Se não houver vozes, FORÇAR pitch alto para simular voz feminina
      utterance.pitch = 1.2 // Pitch alto para forçar som feminino
    }
    
    // CRÍTICO: Garantir que NUNCA use voz masculina - se não encontrar voz feminina, usar pitch alto
    if (!utterance.voice || utterance.voice.name) {
      const voiceName = utterance.voice?.name?.toLowerCase() || ''
      if (/male|masculino|homem|man|diego|joão|paulo|ricardo|eduardo/i.test(voiceName)) {
        console.warn('⚠️ Voz masculina detectada, forçando pitch alto para simular voz feminina')
        utterance.pitch = 1.2 // Forçar pitch alto para simular voz feminina
      }
    }

    utterance.onstart = () => {
      console.log('🔊 TTS iniciado com sucesso')
      setIsSpeaking(true)
    }
    
    // Garantir que o volume está alto
    utterance.volume = Math.max(0.9, utterance.volume || 0.93)
    utterance.onend = () => {
      // SEMPRE disparar evento para ligar microfone quando a IA terminar de falar
      // Isso garante que o microfone ligue automaticamente, independente de ser pergunta ou não
      const estimatedDelay = queue.requestImmediateReply 
        ? Math.min(Math.max(sanitized.length * 15, 1200), 5000)
        : 500 // Delay padrão de 500ms se não for pergunta imediata
      
      window.dispatchEvent(
        new CustomEvent<{ delay?: number }>('noaImmediateListeningRequest', {
          detail: { delay: estimatedDelay }
        })
      )
      
      if (queue.requestImmediateReply) {
        console.log('🔊 IA fez uma pergunta, solicitando escuta imediata')
      } else {
        console.log('🔊 IA terminou de falar, ligando microfone automaticamente')
      }
      
      const current = speechQueueRef.current
      if (current && current.messageId === lastMessage.id) {
        if (!current.timer) {
          speechQueueRef.current = null
          updateMessageContent(current.messageId, current.fullContent)
          setIsSpeaking(false)
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
            setIsSpeaking(false)
          }
          current.timer = window.setTimeout(finalize, 80)
        }
      } else {
        setIsSpeaking(false)
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
      setIsSpeaking(false)
    }

    // Cancelar qualquer fala anterior e falar
    const speakText = () => {
      try {
        // Verificar se há vozes disponíveis
        const availableVoices = window.speechSynthesis.getVoices()
        if (availableVoices.length === 0) {
          console.warn('⚠️ Nenhuma voz disponível, tentando carregar...')
          // Tentar novamente após delay
          setTimeout(() => {
              const retryVoices = window.speechSynthesis.getVoices()
              if (retryVoices.length > 0) {
                voicesRef.current = retryVoices
                // Selecionar voz novamente - MESMA LÓGICA ORIGINAL
                const preferred = retryVoices.filter(voice => voice.lang && voice.lang.toLowerCase() === 'pt-br')
                
                // CRÍTICO: Filtrar APENAS vozes femininas - excluir explicitamente vozes masculinas
                const femaleVoices = preferred.filter(voice => {
                  const name = voice.name.toLowerCase()
                  // Excluir vozes masculinas
                  if (/male|masculino|homem|man|diego|joão|paulo|ricardo|eduardo|luis|pedro|carlos|miguel|rafael|bruno|felipe|gustavo|leonardo|rodrigo|thiago|vinicius|wagner|yuri|zeca|antonio|jose|mario|roberto|sergio|washington/i.test(name)) {
                    return false
                  }
                  // Incluir vozes femininas ou neutras
                  return /female|feminina|mulher|woman|bia|camila|carol|helo[ií]sa|maria|ana|julia|beatriz|fernanda|patricia|sandra|claudia|adriana|luciana|renata|vanessa|tatiana|gabriela|leticia|raquel|isabela|natalia|bruna|daniela|monica|silvia|eliane|fabiana|gisele|juliana|karen|larissa|marcia|nadia|olivia|paula|regina|sonia|tania|vera|yara|zuleica|contralto|vit[oó]ria|brasil/i.test(name) || 
                         !/male|masculino|homem|man|diego|joão|paulo|ricardo|eduardo/i.test(name)
                })
                
                // Priorizar voz contralto (mais grave) para Nôa Esperanza - evitar vozes soprano
                const contralto = femaleVoices.find(voice => /contralto|grave|baixa|low|alto/i.test(voice.name))
                const victoria = femaleVoices.find(voice => /vit[oó]ria/i.test(voice.name))
                
                // Evitar vozes soprano (agudas) - apenas entre vozes femininas
                const nonSoprano = femaleVoices.filter(voice => !/soprano|aguda|high|tenor/i.test(voice.name))
                const fallback = nonSoprano.find(voice => /bia|camila|carol|helo[ií]sa|brasil|female|feminina/i.test(voice.name))
                
                // Usar contralto primeiro, depois victoria, depois fallback não-soprano, depois qualquer voz feminina
                const selectedVoice = contralto || victoria || fallback || nonSoprano[0] || femaleVoices[0]
                
                if (selectedVoice) {
                  utterance.voice = selectedVoice
                  // Ajustar pitch para voz contralto de aproximadamente 35 anos (clara, macia, suave)
                  if (contralto) {
                    utterance.pitch = 0.88 // Contralto equilibrado (35 anos)
                  } else if (victoria) {
                    utterance.pitch = 0.90 // Ligeiramente mais clara
                  } else {
                    utterance.pitch = 0.92 // Padrão para voz feminina clara (evitar soprano agudo)
                  }
                } else {
                  utterance.pitch = 0.90 // Pitch adequado para voz feminina clara
                }
              try {
                window.speechSynthesis.speak(utterance)
                console.log('✅ Síntese de voz iniciada após carregar vozes. Voz:', utterance.voice?.name || 'padrão')
              } catch (speakError) {
                console.error('❌ Erro ao iniciar síntese de voz após carregar vozes:', speakError)
                setIsSpeaking(false)
              }
            } else {
              console.error('❌ Nenhuma voz disponível após retry')
              setIsSpeaking(false)
            }
          }, 500)
          return
        }
        
        // Falar diretamente
        window.speechSynthesis.speak(utterance)
        console.log('✅ Síntese de voz iniciada. Voz:', utterance.voice?.name || 'padrão', 'Volume:', utterance.volume)
        
        // Verificar se realmente começou a falar após um pequeno delay
        setTimeout(() => {
          if (!window.speechSynthesis.speaking && !isSpeaking) {
            console.warn('⚠️ Síntese de voz não iniciou, tentando novamente...')
            try {
              window.speechSynthesis.speak(utterance)
            } catch (retryError) {
              console.error('❌ Erro ao tentar novamente:', retryError)
              setIsSpeaking(false)
            }
          }
        }, 200)
      } catch (speakError) {
        console.error('❌ Erro ao iniciar síntese de voz:', speakError)
        setIsSpeaking(false)
      }
    }
    
    try {
      console.log('🔊 Iniciando síntese de voz para mensagem:', lastMessage.id)
      console.log('🔊 Texto a ser falado:', sanitized.substring(0, 100) + '...')
      console.log('🔊 Voz selecionada:', utterance.voice?.name || 'padrão')
      console.log('🔊 Configurações:', {
        lang: utterance.lang,
        rate: utterance.rate,
        pitch: utterance.pitch,
        volume: utterance.volume,
        textLength: sanitized.length
      })
      
      // Cancelar fala anterior de forma mais agressiva
      if (window.speechSynthesis.speaking) {
        window.speechSynthesis.cancel()
        // Aguardar um pouco mais para garantir cancelamento completo antes de falar
        setTimeout(() => {
          speakText()
        }, 150)
      } else {
        // Se não está falando, falar imediatamente
        speakText()
      }
    } catch (cancelError) {
      console.warn('⚠️ Erro ao cancelar síntese de voz:', cancelError)
      // Tentar falar mesmo assim
      speakText()
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

    // Timeout de segurança: se processar por mais de 60 segundos, forçar reset
    const processingTimeout = setTimeout(() => {
      console.warn('⚠️ Processamento demorou mais de 60s, forçando reset de isProcessing')
      setIsProcessing(false)
      setError('O processamento está demorando muito. Tente novamente.')
    }, 60000)

    // Timeout de verificação rápida: verificar se está travado após 10 segundos
    const quickCheckTimeout = setTimeout(() => {
      // Se ainda estiver processando após 10s, adicionar aviso no console
      console.warn('⚠️ Processamento em andamento há mais de 10 segundos...')
    }, 10000)

    let navigationCommand: VoiceNavigationCommand | null = null
    try {
      navigationCommand = detectVoiceNavigationCommand(trimmed)
      if (navigationCommand) {
        dispatchVoiceNavigationCommand(navigationCommand, trimmed, options.preferVoice ? 'voice' : 'text')
      }
    } catch (commandError) {
      console.warn('⚠️ Erro ao processar comando de navegação local:', commandError)
    }

    const userMessage: ConversationMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: trimmed,
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])

    try {
      console.log('📨 Processando mensagem para IA:', trimmed.substring(0, 50) + '...')
      const contextualizedMessage =
        navigationCommand && navigationCommand.label
          ? `${trimmed}\n\n[contexto_da_plataforma]: A navegação para "${navigationCommand.label}" foi executada com sucesso na interface ativa.`
          : trimmed

      const normalizedUserType = normalizeUserType(user.type)
      
      // Timeout específico para processMessage (30 segundos)
      const processMessagePromise = (residentRef.current as any).processMessage(contextualizedMessage, user.id, user.email, normalizedUserType) as Promise<AIResponse>
      const timeoutPromise = new Promise<AIResponse>((_, reject) => {
        setTimeout(() => reject(new Error('Timeout: processamento demorou mais de 30 segundos')), 30000)
      })
      
      const response = await Promise.race([processMessagePromise, timeoutPromise])
      console.log('✅ Resposta da IA recebida:', response.content.substring(0, 100) + '...')

      const intent = mapResponseToIntent(response)
      const assistantMessage: ConversationMessage = {
        id: `noa-${Date.now()}`,
        role: 'noa',
        content: response.content, // Inicializar com o conteúdo da resposta
        timestamp: ensureDate(response.timestamp),
        intent,
        metadata: {
          confidence: response.confidence,
          reasoning: response.reasoning,
          metadata: response.metadata,
          fullContent: response.content, // Mantém o conteúdo completo para síntese de voz
          fromVoice: options.preferVoice ?? false,
          usedEndpoints: ['resident-ai']
        }
      }

      setMessages(prev => [...prev, assistantMessage])
      setLastIntent(intent)
      setUsedEndpoints(prev => [...prev, 'resident-ai'])
      console.log('💬 Mensagem da IA adicionada ao chat. Total de mensagens:', messages.length + 2)

      // Detectar se a IA mencionou ter criado um slide (mais robusto)
      const responseLower = response.content.toLowerCase()
      const slideKeywords = [
        'criei um slide', 'criei slide', 'slide criado', 'slide foi criado', 
        'slide disponível', 'slide está disponível', 'novo slide', 'slide pronto',
        'slide gerado', 'slide foi gerado', 'preparação de slides', 'área de preparação de slides',
        'criar slide', 'gerar slide', 'slide na área', 'na área de preparação'
      ]
      
      const hasSlideMention = slideKeywords.some(keyword => responseLower.includes(keyword))
      
      // Também verificar se há estrutura de slide na resposta (título, conteúdo estruturado)
      const hasSlideStructure = response.content.match(/#+\s+[^\n]+\n/s) || 
                                response.content.match(/\*\*[^\*]+\*\*/) ||
                                response.content.match(/slide[:\s]+[^\n]+/i)
      
      if (hasSlideMention || hasSlideStructure) {
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
              console.error('❌ Erro ao salvar slide no Supabase:', error)
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
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido'
      if (errorMessage.includes('Timeout')) {
        setError('O processamento está demorando muito. Tente novamente ou recarregue a página.')
      } else {
        setError('Enfrentei um obstáculo ao falar com a IA residente. Podemos tentar novamente em instantes.')
      }
    } finally {
      // SEMPRE garantir que isProcessing seja resetado, mesmo em caso de erro
      clearTimeout(processingTimeout)
      clearTimeout(quickCheckTimeout)
      // Usar setTimeout para garantir que o estado seja atualizado mesmo se houver erro síncrono
      setTimeout(() => {
        setIsProcessing(false)
        console.log('✅ isProcessing resetado após processamento')
      }, 100)
    }
  }, [isProcessing, user?.email, user?.id, stopSpeech])

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
    sendMessage,
    triggerQuickCommand,
    resetConversation
  }
}

