/**
 * Interface de Embarcação para Robôs de Cuidado
 * MedCannLab 3.0 - IA Embarcável para Robôs de Cuidado
 */

import { 
  RobotConfig, 
  RobotState, 
  SensorData, 
  RobotCommand, 
  AIResponse,
  RobotType,
  RobotStatus,
  RobotConnectionStatus,
  InteractionState,
  RobotReport
} from './types'
import { NoaResidentAI } from '../noaResidentAI'
import { ActiveListeningEngine } from './activeListeningEngine'
import { SymbolicCareSystem } from './symbolicCareSystem'
import { ProtocolEngine } from './protocolEngine'
import { ReportGenerator } from './reportGenerator'

/**
 * Interface principal para embarcação da IA em robôs
 */
export class RobotEmbeddingInterface {
  private robotId: string
  private robotType: RobotType
  private config: RobotConfig
  private state: RobotState
  private noaAI: NoaResidentAI
  private listeningEngine: ActiveListeningEngine
  private careSystem: SymbolicCareSystem
  private protocolEngine: ProtocolEngine
  private reportGenerator: ReportGenerator
  private eventHandlers: Map<string, Function[]> = new Map()
  private isInitialized: boolean = false

  constructor(config: RobotConfig) {
    this.robotId = config.robotId
    this.robotType = config.robotType
    this.config = config
    this.state = {
      robotId: config.robotId,
      status: 'idle',
      connectionStatus: 'disconnected',
      lastUpdate: new Date()
    }
    
    // Inicializar componentes
    this.noaAI = new NoaResidentAI({
      model: 'gpt-4',
      temperature: 0.7,
      maxTokens: 2000,
      systemPrompt: this.getSystemPrompt(),
      assessmentEnabled: true
    })
    
    this.listeningEngine = new ActiveListeningEngine(this.robotId)
    this.careSystem = new SymbolicCareSystem(config.settings.empathyLevel)
    this.protocolEngine = new ProtocolEngine(this.robotType)
    this.reportGenerator = new ReportGenerator(this.robotId, this.robotType)
  }

  /**
   * Inicializa a conexão e prepara o robô para operação
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) {
      console.warn(`Robô ${this.robotId} já está inicializado`)
      return
    }

    try {
      console.log(`🤖 Inicializando robô ${this.robotId} (${this.robotType})...`)
      
      // Inicializar componentes
      await this.noaAI.initialize()
      await this.listeningEngine.initialize()
      await this.careSystem.initialize()
      await this.protocolEngine.initialize()
      
      // Conectar (simulado - em produção seria WebSocket/HTTP)
      this.state.connectionStatus = 'connecting'
      await this.connect()
      
      this.state.connectionStatus = 'connected'
      this.state.status = 'idle'
      this.isInitialized = true
      
      console.log(`✅ Robô ${this.robotId} inicializado com sucesso`)
      this.emit('initialized', { robotId: this.robotId })
    } catch (error) {
      console.error(`❌ Erro ao inicializar robô ${this.robotId}:`, error)
      this.state.connectionStatus = 'error'
      this.state.status = 'error'
      throw error
    }
  }

  /**
   * Processa dados de sensor recebidos do robô
   */
  async processSensorData(sensorData: SensorData): Promise<AIResponse> {
    if (!this.isInitialized) {
      throw new Error('Robô não inicializado. Chame initialize() primeiro.')
    }

    if (this.state.status === 'error') {
      throw new Error('Robô em estado de erro')
    }

    this.state.status = 'processing'
    this.state.lastUpdate = new Date()

    try {
      // Processar dados de áudio (escuta ativa)
      if (sensorData.sensorType === 'audio') {
        const processedAudio = await this.listeningEngine.processAudio(sensorData)
        
        // Analisar com IA
        const aiAnalysis = await this.noaAI.processMessage(
          processedAudio.text || '',
          {
            userId: sensorData.metadata?.userId,
            context: this.getCurrentContext(),
            robotType: this.robotType
          }
        )

        // Aplicar cuidado simbólico
        const careResponse = await this.careSystem.enhanceResponse(aiAnalysis)

        // Aplicar protocolo se necessário
        const protocolResponse = await this.protocolEngine.processResponse(
          careResponse,
          this.state.currentInteraction
        )

        // Gerar comandos para o robô
        const commands = this.generateCommands(protocolResponse)

        const response: AIResponse = {
          interactionId: this.state.currentInteraction?.interactionId || 'unknown',
          text: protocolResponse.content,
          emotions: careResponse.emotions,
          actions: commands,
          protocolStep: protocolResponse.metadata?.protocolStep,
          careLevel: this.determineCareLevel(careResponse),
          timestamp: new Date()
        }

        this.state.status = 'active'
        this.emit('response_generated', response)
        
        return response
      }

      // Processar outros tipos de sensores
      return this.processOtherSensors(sensorData)
    } catch (error) {
      console.error(`❌ Erro ao processar dados do sensor:`, error)
      this.state.status = 'error'
      throw error
    }
  }

  /**
   * Inicia uma nova interação
   */
  async startInteraction(
    type: 'assessment' | 'monitoring' | 'education' | 'support',
    participantId?: string
  ): Promise<string> {
    const interactionId = `interaction_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    
    const interaction: InteractionState = {
      interactionId,
      type,
      participantId,
      startTime: new Date(),
      protocol: type === 'assessment' ? 'IMRE' : undefined,
      phase: type === 'assessment' ? 'INVESTIGATION' : undefined,
      data: {}
    }

    this.state.currentInteraction = interaction
    this.state.status = 'active'
    
    // Inicializar protocolo se necessário
    if (type === 'assessment') {
      await this.protocolEngine.startIMRE(interactionId, participantId)
    }

    this.emit('interaction_started', interaction)
    return interactionId
  }

  /**
   * Finaliza uma interação e gera relatório
   */
  async endInteraction(interactionId: string): Promise<RobotReport> {
    const interaction = this.state.currentInteraction
    
    if (!interaction || interaction.interactionId !== interactionId) {
      throw new Error(`Interação ${interactionId} não encontrada`)
    }

    // Gerar relatório
    const report = await this.reportGenerator.generateReport(interaction)
    
    // Limpar estado
    this.state.currentInteraction = undefined
    this.state.status = 'idle'
    
    this.emit('interaction_ended', { interactionId, report })
    return report
  }

  /**
   * Obtém o estado atual do robô
   */
  getState(): RobotState {
    return { ...this.state }
  }

  /**
   * Obtém a configuração do robô
   */
  getConfig(): RobotConfig {
    return { ...this.config }
  }

  /**
   * Atualiza configurações do robô
   */
  updateConfig(updates: Partial<RobotConfig>): void {
    this.config = { ...this.config, ...updates }
    this.emit('config_updated', this.config)
  }

  /**
   * Registra um handler de eventos
   */
  on(event: string, handler: Function): void {
    if (!this.eventHandlers.has(event)) {
      this.eventHandlers.set(event, [])
    }
    this.eventHandlers.get(event)!.push(handler)
  }

  /**
   * Remove um handler de eventos
   */
  off(event: string, handler: Function): void {
    const handlers = this.eventHandlers.get(event)
    if (handlers) {
      const index = handlers.indexOf(handler)
      if (index > -1) {
        handlers.splice(index, 1)
      }
    }
  }

  /**
   * Emite um evento
   */
  private emit(event: string, data: any): void {
    const handlers = this.eventHandlers.get(event)
    if (handlers) {
      handlers.forEach(handler => {
        try {
          handler(data)
        } catch (error) {
          console.error(`Erro ao executar handler do evento ${event}:`, error)
        }
      })
    }
  }

  /**
   * Conecta com o robô físico (simulado)
   */
  private async connect(): Promise<void> {
    // Em produção, aqui seria a conexão real (WebSocket, HTTP, etc.)
    return new Promise((resolve) => {
      setTimeout(() => {
        console.log(`🔌 Conectado ao robô ${this.robotId}`)
        resolve()
      }, 1000)
    })
  }

  /**
   * Gera comandos para o robô baseado na resposta da IA
   */
  private generateCommands(response: any): RobotCommand[] {
    const commands: RobotCommand[] = []

    // Comando de fala
    commands.push({
      id: `cmd_${Date.now()}_speak`,
      type: 'speak',
      payload: {
        text: response.content,
        voice: this.config.settings.voice,
        speed: this.config.settings.responseSpeed,
        emotions: response.emotions
      },
      priority: 'medium',
      timestamp: new Date()
    })

    // Comandos de expressão baseados em emoções
    if (response.emotions) {
      commands.push({
        id: `cmd_${Date.now()}_express`,
        type: 'express',
        payload: {
          emotion: response.emotions.primary,
          intensity: response.emotions.intensity
        },
        priority: 'low',
        timestamp: new Date()
      })
    }

    return commands
  }

  /**
   * Determina o nível de cuidado necessário
   */
  private determineCareLevel(response: any): 'low' | 'medium' | 'high' {
    // Lógica para determinar nível de cuidado baseado na resposta
    if (response.emotions?.intensity > 0.7 || response.metadata?.urgency) {
      return 'high'
    }
    if (response.emotions?.intensity > 0.4) {
      return 'medium'
    }
    return 'low'
  }

  /**
   * Obtém o contexto atual da interação
   */
  private getCurrentContext(): any {
    return {
      robotId: this.robotId,
      robotType: this.robotType,
      interaction: this.state.currentInteraction,
      location: this.config.location,
      timestamp: new Date()
    }
  }

  /**
   * Processa outros tipos de sensores (não-áudio)
   */
  private async processOtherSensors(sensorData: SensorData): Promise<AIResponse> {
    // Implementar processamento para outros tipos de sensores
    return {
      interactionId: this.state.currentInteraction?.interactionId || 'unknown',
      text: 'Dados recebidos e processados',
      actions: [],
      careLevel: 'low',
      timestamp: new Date()
    }
  }

  /**
   * Gera o prompt do sistema baseado no tipo de robô
   */
  private getSystemPrompt(): string {
    const basePrompt = `Você é Nôa Esperança, uma IA Residente especializada em Cannabis Medicinal e cuidados de saúde.`
    
    const typePrompts: Record<RobotType, string> = {
      clinical: `Você está operando em um ambiente clínico. Seu papel é auxiliar profissionais de saúde com avaliações clínicas, coleta de dados e suporte durante consultas.`,
      home: `Você está operando em um ambiente domiciliar. Seu papel é acompanhar pacientes, monitorar sintomas, fornecer lembretes e oferecer suporte emocional.`,
      educational: `Você está operando em um ambiente educacional. Seu papel é ensinar protocolos clínicos, simular casos e treinar estudantes de saúde.`
    }

    return `${basePrompt} ${typePrompts[this.robotType]}`
  }

  /**
   * Desconecta e limpa recursos
   */
  async disconnect(): Promise<void> {
    if (this.state.currentInteraction) {
      await this.endInteraction(this.state.currentInteraction.interactionId)
    }

    this.state.connectionStatus = 'disconnected'
    this.state.status = 'idle'
    this.isInitialized = false
    
    // Limpar recursos
    await this.listeningEngine.cleanup()
    await this.careSystem.cleanup()
    
    this.emit('disconnected', { robotId: this.robotId })
  }
}

