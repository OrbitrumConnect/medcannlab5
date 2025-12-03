/**
 * Sistema de Cuidado Simbólico
 * Adiciona empatia, humanização e acolhimento às respostas da IA
 */

import { EmotionAnalysis } from './types'

export interface EnhancedResponse {
  content: string
  emotions?: EmotionAnalysis
  empathyLevel: number
  humanization: boolean
  careIndicators: string[]
}

export class SymbolicCareSystem {
  private empathyLevel: 'low' | 'medium' | 'high'
  private isInitialized: boolean = false

  constructor(empathyLevel: 'low' | 'medium' | 'high' = 'medium') {
    this.empathyLevel = empathyLevel
  }

  /**
   * Inicializa o sistema de cuidado simbólico
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) return

    console.log(`💝 Inicializando sistema de cuidado simbólico (nível: ${this.empathyLevel})...`)
    this.isInitialized = true
    console.log(`✅ Sistema de cuidado simbólico inicializado`)
  }

  /**
   * Enriquece uma resposta com cuidado simbólico
   */
  async enhanceResponse(aiResponse: any): Promise<EnhancedResponse> {
    if (!this.isInitialized) {
      await this.initialize()
    }

    const originalContent = aiResponse.content || ''
    const emotions = aiResponse.emotions || { primary: 'neutral', confidence: 0.5, intensity: 0.5 }

    // Aplicar empatia baseada no nível configurado
    const enhancedContent = this.applyEmpathy(originalContent, emotions)
    
    // Adicionar humanização
    const humanizedContent = this.humanizeResponse(enhancedContent, emotions)

    // Identificar indicadores de cuidado
    const careIndicators = this.identifyCareIndicators(humanizedContent, emotions)

    return {
      content: humanizedContent,
      emotions,
      empathyLevel: this.getEmpathyLevelValue(),
      humanization: true,
      careIndicators
    }
  }

  /**
   * Aplica empatia à resposta baseado no nível configurado
   */
  private applyEmpathy(content: string, emotions: EmotionAnalysis): string {
    const empathyPhrases: Record<'low' | 'medium' | 'high', string[]> = {
      low: ['Entendo.', 'Compreendo.'],
      medium: ['Entendo como você se sente.', 'Compreendo sua situação.', 'Estou aqui para ajudar.'],
      high: ['Entendo profundamente como você se sente.', 'Sua experiência é importante para mim.', 'Estou aqui para acolhê-lo e apoiá-lo em cada momento.']
    }

    const phrases = empathyPhrases[this.empathyLevel]
    
    // Adicionar frase empática no início se detectar emoção negativa
    if (emotions.primary === 'sad' || emotions.primary === 'anxious' || emotions.primary === 'fear') {
      const randomPhrase = phrases[Math.floor(Math.random() * phrases.length)]
      return `${randomPhrase} ${content}`
    }

    return content
  }

  /**
   * Humaniza a resposta
   */
  private humanizeResponse(content: string, emotions: EmotionAnalysis): string {
    // Adicionar pausas naturais
    let humanized = content.replace(/\./g, '. ')
    
    // Adicionar expressões de validação
    if (emotions.intensity > 0.6) {
      humanized = `Vejo que isso é importante para você. ${humanized}`
    }

    // Adicionar perguntas de acompanhamento
    if (emotions.primary === 'sad' || emotions.primary === 'anxious') {
      humanized += ' Como você gostaria de prosseguir?'
    }

    return humanized
  }

  /**
   * Identifica indicadores de cuidado na resposta
   */
  private identifyCareIndicators(content: string, emotions: EmotionAnalysis): string[] {
    const indicators: string[] = []

    // Verificar presença de palavras-chave de cuidado
    const careKeywords = ['entendo', 'compreendo', 'acolho', 'apoio', 'ajuda', 'cuidado', 'importante']
    careKeywords.forEach(keyword => {
      if (content.toLowerCase().includes(keyword)) {
        indicators.push(keyword)
      }
    })

    // Adicionar indicador baseado em emoções
    if (emotions.intensity > 0.7) {
      indicators.push('high_attention')
    }

    return indicators
  }

  /**
   * Obtém valor numérico do nível de empatia
   */
  private getEmpathyLevelValue(): number {
    const values = { low: 0.3, medium: 0.6, high: 0.9 }
    return values[this.empathyLevel]
  }

  /**
   * Limpa recursos
   */
  async cleanup(): Promise<void> {
    this.isInitialized = false
  }
}

