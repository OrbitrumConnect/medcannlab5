import React, { createContext, useContext, useState, ReactNode, useEffect, useRef } from 'react'
import { NoaEsperancaCore, noaEsperancaConfig, NoaInteraction } from '../lib/noaEsperancaCore'
import { NoaResidentAI, AIResponse } from '../lib/noaResidentAI'
import { useAuth } from './AuthContext'
import { supabase } from '../integrations/supabase/client'

export interface NoaMessage {
  id: string
  type: 'user' | 'noa'
  content: string
  timestamp: Date
  isTyping?: boolean
  audioUrl?: string
  videoUrl?: string
  aiResponse?: AIResponse
  confidence?: number
  suggestions?: string[]
}

export interface NoaContextType {
  messages: NoaMessage[]
  isOpen: boolean
  isTyping: boolean
  isListening: boolean
  isSpeaking: boolean
  sendMessage: (content: string) => void
  toggleChat: () => void
  startListening: () => void
  stopListening: () => void
  clearMessages: () => void
  setTyping: (typing: boolean) => void
}

const NoaContext = createContext<NoaContextType | undefined>(undefined)

export const useNoa = () => {
  const context = useContext(NoaContext)
  if (context === undefined) {
    throw new Error('useNoa must be used within a NoaProvider')
  }
  return context
}

interface NoaProviderProps {
  children: ReactNode
}

export const NoaProvider: React.FC<NoaProviderProps> = ({ children }) => {
  const [messages, setMessages] = useState<NoaMessage[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [pendingCount, setPendingCount] = useState(0)
  const [isListening, setIsListening] = useState(false)
  const [isSpeaking, setIsSpeaking] = useState(false)

  const isTyping = pendingCount > 0

  // Acessar dados do usuário para individualização
  const { user } = useAuth()

  // Inicializar Nôa Esperança Core (Kernel Local - Preservado para integridade do sistema)
  const [noaCore] = useState(() => new NoaEsperancaCore(noaEsperancaConfig))

  // Referências para controle de fluxo e robustez (Padrão sugerido para produção)
  const residentAIRef = useRef<NoaResidentAI | null>(null)
  const sentinelRanRef = useRef(false)
  const queueRef = useRef<Promise<void>>(Promise.resolve())
  const currentTaskIdRef = useRef(0)
  const abortControllerRef = useRef<AbortController | null>(null)

  useEffect(() => {
    if (user && !residentAIRef.current) {
      residentAIRef.current = new NoaResidentAI()
      
      // AUTO-SENTINELA: Verificar pendências ao inicializar (Proteção contra repetição)
      if (!sentinelRanRef.current) {
        sentinelRanRef.current = true
        
        const checkPending = async () => {
          if (!residentAIRef.current) return
          
          try {
            const { data: pendingState } = await supabase
              .from('aec_assessment_state')
              .select('phase, last_update')
              .eq('user_id', user.id)
              .neq('phase', 'completed')
              .maybeSingle()
            
            if (pendingState) {
              const dateStr = pendingState.last_update 
                ? new Date(pendingState.last_update).toLocaleDateString('pt-BR') 
                : 'recentemente'
              const welcomeMsg: NoaMessage = {
                id: crypto.randomUUID(),
                type: 'noa',
                content: `Bons ventos, ${user.name.split(' ')[0]}! Notei que temos uma avaliação clínica iniciada em ${dateStr} que ainda não foi concluída. \n\nGostaria de **continuar** de onde paramos ou prefere **reiniciar** com uma nova avaliação do zero?`,
                timestamp: new Date(),
                suggestions: ['Continuar avaliação', 'Reiniciar do zero']
              }
              setMessages(prev => [...prev, welcomeMsg])
            }
          } catch (err) {
            console.error('⚠️ Falha ao verificar estado pendente:', err)
          }
        }
        checkPending()
      }
    } else if (!user && residentAIRef.current) {
      residentAIRef.current = null
      sentinelRanRef.current = false
      setMessages([])
    }
  }, [user])

  // Função interna para processar a resposta da IA de forma segura com Cancelamento Lógico (taskId)
  const processAIReply = async (content: string, userId: string, userEmail: string, taskId: number) => {
    setPendingCount(prev => prev + 1)
    
    try {
      if (!residentAIRef.current) return

      // 🧠 CANCELAMENTO LÓGICO (ANTES): Evita processamento se houver tarefa mais nova
      if (taskId !== currentTaskIdRef.current) {
        console.log('🗑️ [Noa] Task descartada na fila (nova mensagem chegou)');
        return;
      }

      const aiResponse = await residentAIRef.current.processMessage(
        content,
        userId,
        userEmail
      )

      // 🧠 CANCELAMENTO LÓGICO (DEPOIS): Evita renderizar se ficou obsoleto durante o fetch
      if (taskId !== currentTaskIdRef.current) {
        console.log('🗑️ [Noa] Resposta da IA ignorada (usuário mudou de assunto)');
        return;
      }

      if (aiResponse) {
        const noaMessage: NoaMessage = {
          id: crypto.randomUUID(),
          type: 'noa',
          content: aiResponse.content || 'Pode me dar mais detalhes sobre isso?',
          timestamp: new Date(),
          aiResponse: aiResponse,
          confidence: aiResponse.confidence,
          suggestions: aiResponse.suggestions
        }
        setMessages(prev => [...prev, noaMessage])
      }
    } catch (error) {
      console.error('❌ Erro no processamento sequencial:', error)
      const errorMessage: NoaMessage = {
        id: crypto.randomUUID(),
        type: 'noa',
        content: 'Desculpe, tive um pequeno problema ao processar isso. Poderia repetir?',
        timestamp: new Date()
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setPendingCount(prev => Math.max(0, prev - 1))
    }
  }

  const sendMessage = async (content: string) => {
    if (!user || !residentAIRef.current) return

    // 🏆 Incrementa o ID de tarefa global
    const taskId = ++currentTaskIdRef.current

    const userMessage: NoaMessage = {
      id: crypto.randomUUID(),
      type: 'user',
      content,
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])

    // SISTEMA DE FILA ROBUSCO: Enfileira a execução, mas permite cancelamento via taskId
    queueRef.current = queueRef.current.then(() => 
      processAIReply(content, user.id, user.email, taskId)
    )
  }

  const toggleChat = () => {
    setIsOpen(prev => !prev)
  }

  const startListening = () => {
    setIsListening(true)
  }

  const stopListening = () => {
    setIsListening(false)
  }

  const clearMessages = () => {
    setMessages([])
  }

  const setTyping = (typing: boolean) => {
    setPendingCount(prev => typing ? prev + 1 : Math.max(0, prev - 1))
  }

  const value: NoaContextType = {
    messages,
    isOpen,
    isTyping,
    isListening,
    isSpeaking,
    sendMessage,
    toggleChat,
    startListening,
    stopListening,
    clearMessages,
    setTyping
  }

  return (
    <NoaContext.Provider value={value}>
      {children}
    </NoaContext.Provider>
  )
}