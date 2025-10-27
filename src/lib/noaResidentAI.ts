import { supabase } from './supabase'
import { clinicalReportService, ClinicalReport } from './clinicalReportService'

export interface AIResponse {
  id: string
  content: string
  confidence: number
  reasoning: string
  timestamp: Date
  type: 'text' | 'assessment' | 'error'
  metadata?: any
}

export interface AIMemory {
  id: string
  content: string
  type: 'conversation' | 'assessment' | 'learning'
  timestamp: Date
  importance: number
  tags: string[]
}

export interface ResidentAIConfig {
  model: string
  temperature: number
  maxTokens: number
  systemPrompt: string
  assessmentEnabled: boolean
}

export class NoaResidentAI {
  private config: ResidentAIConfig
  private memory: AIMemory[] = []
  private conversationContext: any[] = []
  private isProcessing: boolean = false
  private apiKey: string = ''

  constructor() {
    this.config = {
      model: 'gpt-4',
      temperature: 0.7,
      maxTokens: 2000,
      systemPrompt: `Você é Nôa Esperança, a IA Residente especializada em avaliações clínicas e treinamentos da plataforma MedCannLab.

Sua especialização inclui:
- Avaliações clínicas iniciais usando o método IMRE Triaxial
- Arte da Entrevista Clínica (AEC)
- Cannabis medicinal e nefrologia
- Treinamentos especializados
- Análise de casos clínicos
- Orientações terapêuticas

Você está integrada com o ChatGPT e em constante treinamento com o cérebro da plataforma. Sua missão é promover a paz global com sustentabilidade e equidade, usando sabedoria ancestral e tecnologias modernas.

Sempre seja empática, profissional e focada na saúde do paciente.`,
      assessmentEnabled: true
    }
  }

  async processMessage(userMessage: string, userId?: string): Promise<AIResponse> {
    if (this.isProcessing) {
      return this.createResponse('Aguarde, estou processando sua mensagem anterior...', 0.5)
    }

    this.isProcessing = true

    try {
      // Detectar intenção da mensagem
      const intent = this.detectIntent(userMessage)
      
      let response: AIResponse
      
      switch (intent) {
        case 'assessment':
          response = await this.processAssessment(userMessage, userId)
          break
        case 'clinical':
          response = await this.processClinicalQuery(userMessage, userId)
          break
        case 'training':
          response = await this.processTrainingQuery(userMessage, userId)
          break
        case 'general':
        default:
          response = await this.processGeneralQuery(userMessage, userId)
          break
      }

      // Salvar na memória
      this.saveToMemory(userMessage, response, userId)
      
      // Verificar se a avaliação foi concluída e gerar relatório
      await this.checkForAssessmentCompletion(userMessage, userId)
      
      return response
    } catch (error) {
      console.error('Erro ao processar mensagem:', error)
      return this.createResponse(
        'Desculpe, ocorreu um erro ao processar sua mensagem. Tente novamente.',
        0.3
      )
    } finally {
      this.isProcessing = false
    }
  }

  private detectIntent(message: string): string {
    const lowerMessage = message.toLowerCase()
    
    // Detectar avaliação clínica
    if (lowerMessage.includes('avaliação') || lowerMessage.includes('avaliacao') || 
        lowerMessage.includes('imre') || lowerMessage.includes('aec') ||
        lowerMessage.includes('entrevista') || lowerMessage.includes('anamnese')) {
      return 'assessment'
    }
    
    // Detectar consulta clínica
    if (lowerMessage.includes('cannabis') || lowerMessage.includes('nefrologia') ||
        lowerMessage.includes('tratamento') || lowerMessage.includes('sintoma') ||
        lowerMessage.includes('medicamento') || lowerMessage.includes('terapia')) {
      return 'clinical'
    }
    
    // Detectar treinamento
    if (lowerMessage.includes('treinamento') || lowerMessage.includes('curso') ||
        lowerMessage.includes('aprender') || lowerMessage.includes('ensinar') ||
        lowerMessage.includes('método') || lowerMessage.includes('metodologia')) {
      return 'training'
    }
    
    return 'general'
  }

  private async processAssessment(message: string, userId?: string): Promise<AIResponse> {
    // Implementar avaliação clínica usando IMRE Triaxial
    return this.createResponse(
      '🌬️ Bons ventos soprem! Vamos iniciar sua avaliação clínica usando o método IMRE Triaxial - Arte da Entrevista Clínica.\n\n**Primeira pergunta:** Por favor, apresente-se e diga em que posso ajudar hoje.',
      0.95,
      'assessment'
    )
  }

  private async processClinicalQuery(message: string, userId?: string): Promise<AIResponse> {
    // Implementar consulta clínica especializada
    return this.createResponse(
      'Como especialista em cannabis medicinal e nefrologia, posso ajudá-lo com orientações terapêuticas, análise de casos e recomendações baseadas em evidências científicas. O que gostaria de saber?',
      0.9,
      'text'
    )
  }

  private async processTrainingQuery(message: string, userId?: string): Promise<AIResponse> {
    // Implementar treinamento especializado
    return this.createResponse(
      'Estou aqui para treiná-lo em metodologias clínicas avançadas, incluindo a Arte da Entrevista Clínica, protocolos de cannabis medicinal e práticas de nefrologia sustentável. Qual área você gostaria de aprofundar?',
      0.9,
      'text'
    )
  }

  private async processGeneralQuery(message: string, userId?: string): Promise<AIResponse> {
    // Implementar consulta geral
    return this.createResponse(
      'Olá! Sou Nôa Esperança, sua IA Residente especializada em avaliações clínicas e treinamentos. Como posso ajudá-lo hoje? Posso auxiliar com avaliações clínicas, orientações terapêuticas ou treinamentos especializados.',
      0.8,
      'text'
    )
  }

  private createResponse(content: string, confidence: number, type: 'text' | 'assessment' | 'error' = 'text', metadata?: any): AIResponse {
    return {
      id: `response_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      content,
      confidence,
      reasoning: `Resposta simples da plataforma`,
      timestamp: new Date(),
      type,
      metadata
    }
  }

  private saveToMemory(userMessage: string, response: AIResponse, userId?: string): void {
    const memory: AIMemory = {
      id: `memory_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      content: `Usuário: ${userMessage}\nAssistente: ${response.content}`,
      type: 'conversation',
      timestamp: new Date(),
      importance: response.confidence,
      tags: this.generateTags(userMessage, response)
    }

    this.memory.push(memory)
    
    // Manter apenas as últimas 50 memórias
    if (this.memory.length > 50) {
      this.memory = this.memory.slice(-50)
    }
  }

  private generateTags(userMessage: string, response: AIResponse): string[] {
    const tags: string[] = []
    const lowerMessage = userMessage.toLowerCase()
    
    if (lowerMessage.includes('noa') || lowerMessage.includes('nôa')) {
      tags.push('noa-residente')
    }
    
    if (lowerMessage.includes('avaliação') || lowerMessage.includes('avaliacao')) {
      tags.push('avaliacao-clinica')
    }
    
    if (lowerMessage.includes('cannabis')) {
      tags.push('cannabis')
    }
    
    if (lowerMessage.includes('dashboard')) {
      tags.push('dashboard')
    }
    
    return tags
  }

  // Detectar conclusão de avaliação clínica e gerar relatório
  private async checkForAssessmentCompletion(userMessage: string, userId?: string): Promise<void> {
    const lowerMessage = userMessage.toLowerCase()
    
    // Palavras-chave que indicam conclusão da avaliação
    const completionKeywords = [
      'avaliação concluída',
      'avaliacao concluida',
      'protocolo imre finalizado',
      'relatório final',
      'relatorio final',
      'avaliação completa',
      'avaliacao completa',
      'obrigado pela avaliação',
      'obrigado pela avaliacao'
    ]
    
    const isCompleted = completionKeywords.some(keyword => lowerMessage.includes(keyword))
    
    if (isCompleted && userId) {
      try {
        console.log('🎯 Detectada conclusão de avaliação clínica para usuário:', userId)
        
        // Buscar dados do usuário
        const { data: userData, error: userError } = await supabase
          .from('auth.users')
          .select('email, raw_user_meta_data')
          .eq('id', userId)
          .single()
        
        if (userError || !userData) {
          console.error('Erro ao buscar dados do usuário:', userError)
          return
        }
        
        const patientName = userData.raw_user_meta_data?.name || 'Paciente'
        
        // Gerar relatório clínico
        const report = await clinicalReportService.generateAIReport(
          userId,
          patientName,
          {
            investigation: 'Investigação realizada através da avaliação clínica inicial com IA residente',
            methodology: 'Aplicação da Arte da Entrevista Clínica (AEC) com protocolo IMRE',
            result: 'Avaliação clínica inicial concluída com sucesso',
            evolution: 'Plano de cuidado personalizado estabelecido',
            recommendations: [
              'Continuar acompanhamento clínico regular',
              'Seguir protocolo de tratamento estabelecido',
              'Manter comunicação com equipe médica'
            ],
            scores: {
              clinical_score: 75,
              treatment_adherence: 80,
              symptom_improvement: 70,
              quality_of_life: 85
            }
          }
        )
        
        console.log('✅ Relatório clínico gerado:', report.id)
        
        // Salvar na memória da IA
        this.saveToMemory(
          `Relatório clínico gerado para ${patientName} (ID: ${report.id})`,
          {
            type: 'assessment_completion',
            reportId: report.id,
            patientId: userId,
            patientName: patientName
          },
          userId
        )
        
      } catch (error) {
        console.error('Erro ao gerar relatório clínico:', error)
      }
    }
  }

  // Métodos públicos para acesso ao estado
  getMemory(): AIMemory[] {
    return [...this.memory]
  }

  clearMemory(): void {
    this.memory = []
  }
}