import { supabase } from './supabase'

export interface SemanticAnalysis {
  topics: string[]
  emotions: string
  biomedical_terms: string[]
  interpretations: string
  confidence: number
  dev_mode?: boolean
}

export interface ChatMessage {
  id: string
  text: string
  timestamp: Date
  isUser: boolean
  analysis?: SemanticAnalysis
}

class TradeVisionClient {
  private isInitialized = false
  private sessionContext: ChatMessage[] = []

  async initialize() {
    this.isInitialized = true
    console.log('🦅 TradeVision Client Conectado')
  }

  addToContext(message: ChatMessage) {
    this.sessionContext.push(message)
    // Manter apenas as últimas 10 mensagens para contexto imediato
    if (this.sessionContext.length > 10) {
      this.sessionContext = this.sessionContext.slice(-10)
    }
  }

  getContext(): ChatMessage[] {
    return this.sessionContext
  }

  clearContext() {
    this.sessionContext = []
  }

  /**
   * Processa a mensagem do usuário enviando para a API Segura (Server-Side)
   */
  async processUserMessage(text: string, patientData?: any): Promise<{ response: string, analysis: SemanticAnalysis }> {
    try {
      // Obter sessão atual do Supabase para o token
      const { data: { session } } = await supabase.auth.getSession()

      if (!session) {
        throw new Error('Sessão expirada. Faça login novamente.')
      }

      console.log('📤 Enviando para TradeVision Brain...')

      const response = await fetch('/api/tradevision', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          message: text,
          context: patientData || {}, // Contexto clínico (exames, etc)
          history: this.sessionContext.map(m => ({
            role: m.isUser ? 'user' : 'assistant',
            content: m.text
          })),
          userId: session.user.id
        })
      })

      if (!response.ok) {
        throw new Error(`Erro API: ${response.statusText}`)
      }

      const data = await response.json()

      // Construir objeto de análise baseado na resposta da IA
      const analysis: SemanticAnalysis = {
        topics: ['clinico'], // Placeholder, idealmente a IA retornaria tags
        emotions: 'neutro',
        biomedical_terms: [],
        interpretations: 'Análise processada pelo TradeVision Core (v2.0)',
        confidence: 0.99,
        dev_mode: data.metadata?.dev_mode
      }

      return {
        response: data.text,
        analysis
      }

    } catch (error) {
      console.error('❌ Erro de Conexão TradeVision:', error)
      return {
        response: 'Desculpe, perdi a conexão com o servidor seguro. Tente novamente em instantes.',
        analysis: {
          topics: ['erro'],
          emotions: 'erro',
          biomedical_terms: [],
          interpretations: 'Falha de conexão',
          confidence: 0
        }
      }
    }
  }

  // Mantido para compatibilidade, mas agora chama o processamento real
  async analyzePatientInput(text: string): Promise<SemanticAnalysis> {
    // Em uma implementação real, a análise semântica também viria do backend.
    // Aqui retornamos um placeholder para não quebrar a UI antes da resposta.
    return {
      topics: ['processando'],
      emotions: '...',
      biomedical_terms: [],
      interpretations: 'Aguardando TradeVision...',
      confidence: 0.5
    }
  }

  // Adaptação para interfaces antigas
  generateNOAResponse(userMessage: string, analysis: SemanticAnalysis): string {
    return "..." // Agora é assíncrono, processado por processUserMessage
  }
}

export const noaEngine = new TradeVisionClient()

