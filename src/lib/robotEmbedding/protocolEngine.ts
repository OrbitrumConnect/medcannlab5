/**
 * Motor de Protocolos Clínicos
 * Gerencia protocolos IMRE e outros protocolos médicos
 */

import { RobotType, InteractionState } from './types'
import { processAssessmentStep, AssessmentRoteiroState } from '../assessmentRoteiroExato'

export class ProtocolEngine {
  private robotType: RobotType
  private isInitialized: boolean = false
  private activeProtocols: Map<string, any> = new Map()

  constructor(robotType: RobotType) {
    this.robotType = robotType
  }

  /**
   * Inicializa o motor de protocolos
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) return

    console.log(`📋 Inicializando motor de protocolos para robô ${this.robotType}...`)
    this.isInitialized = true
    console.log(`✅ Motor de protocolos inicializado`)
  }

  /**
   * Inicia protocolo IMRE
   */
  async startIMRE(interactionId: string, participantId?: string): Promise<void> {
    const protocolState: AssessmentRoteiroState = {
      currentStep: 0,
      totalSteps: 28,
      completedSteps: [],
      data: {},
      participantId: participantId || 'unknown'
    }

    this.activeProtocols.set(interactionId, {
      type: 'IMRE',
      state: protocolState,
      startedAt: new Date()
    })

    console.log(`📋 Protocolo IMRE iniciado para interação ${interactionId}`)
  }

  /**
   * Processa resposta aplicando protocolo ativo
   */
  async processResponse(
    response: any,
    interaction?: InteractionState
  ): Promise<any> {
    if (!interaction) {
      return response
    }

    const protocol = this.activeProtocols.get(interaction.interactionId)
    
    if (!protocol || protocol.type !== 'IMRE') {
      return response
    }

    // Processar passo do protocolo IMRE
    const protocolState = protocol.state as AssessmentRoteiroState
    const processed = processAssessmentStep(
      response.content,
      protocolState
    )

    // Atualizar estado do protocolo
    protocol.state = processed.state
    this.activeProtocols.set(interaction.interactionId, protocol)

    // Adicionar metadados de protocolo à resposta
    return {
      ...response,
      metadata: {
        ...response.metadata,
        protocolStep: `Step ${processed.state.currentStep}/${processed.state.totalSteps}`,
        protocolType: 'IMRE',
        assessmentData: processed.state.data
      }
    }
  }

  /**
   * Obtém estado atual do protocolo
   */
  getProtocolState(interactionId: string): any {
    return this.activeProtocols.get(interactionId)
  }

  /**
   * Finaliza protocolo
   */
  async endProtocol(interactionId: string): Promise<any> {
    const protocol = this.activeProtocols.get(interactionId)
    
    if (protocol) {
      const finalState = protocol.state
      this.activeProtocols.delete(interactionId)
      return finalState
    }

    return null
  }

  /**
   * Limpa recursos
   */
  async cleanup(): Promise<void> {
    this.activeProtocols.clear()
    this.isInitialized = false
  }
}

