/**
 * Tipos TypeScript para Sistema de Embarcação em Robôs
 * MedCannLab 3.0 - IA Embarcável para Robôs de Cuidado
 */

/**
 * Tipos de robôs suportados
 */
export type RobotType = 'clinical' | 'home' | 'educational'

/**
 * Tipos de sensores disponíveis
 */
export type SensorType = 'audio' | 'video' | 'vital_signs' | 'motion' | 'environment'

/**
 * Tipos de atuadores (ações que o robô pode executar)
 */
export type ActuatorType = 'speak' | 'move' | 'express' | 'display' | 'action'

/**
 * Status de conexão do robô
 */
export type RobotConnectionStatus = 'connected' | 'disconnected' | 'connecting' | 'error'

/**
 * Status operacional do robô
 */
export type RobotStatus = 'active' | 'idle' | 'processing' | 'error' | 'maintenance'

/**
 * Configuração de um robô
 */
export interface RobotConfig {
  robotId: string
  robotType: RobotType
  name: string
  location: string
  capabilities: RobotCapability[]
  settings: RobotSettings
}

/**
 * Capacidades do robô
 */
export interface RobotCapability {
  type: SensorType | ActuatorType
  enabled: boolean
  config?: Record<string, any>
}

/**
 * Configurações do robô
 */
export interface RobotSettings {
  language: string
  voice: string
  empathyLevel: 'low' | 'medium' | 'high'
  responseSpeed: 'slow' | 'normal' | 'fast'
  protocolMode: 'full' | 'simplified' | 'custom'
}

/**
 * Dados de sensor recebidos do robô
 */
export interface SensorData {
  robotId: string
  sensorType: SensorType
  data: any
  timestamp: Date
  metadata?: Record<string, any>
}

/**
 * Comando para o robô executar
 */
export interface RobotCommand {
  id: string
  type: ActuatorType
  payload: any
  priority: 'low' | 'medium' | 'high' | 'urgent'
  timestamp: Date
  expiresAt?: Date
}

/**
 * Estado atual do robô
 */
export interface RobotState {
  robotId: string
  status: RobotStatus
  connectionStatus: RobotConnectionStatus
  currentTask?: string
  batteryLevel?: number
  lastUpdate: Date
  activeProtocol?: string
  currentInteraction?: InteractionState
}

/**
 * Estado de uma interação em andamento
 */
export interface InteractionState {
  interactionId: string
  type: 'assessment' | 'monitoring' | 'education' | 'support'
  participantId?: string
  startTime: Date
  protocol?: 'IMRE' | 'custom'
  phase?: string
  data: Record<string, any>
}

/**
 * Dados de áudio processados
 */
export interface AudioData extends SensorData {
  sensorType: 'audio'
  data: {
    raw: ArrayBuffer
    text?: string
    confidence?: number
    emotions?: EmotionAnalysis
    intent?: string
  }
}

/**
 * Análise de emoções
 */
export interface EmotionAnalysis {
  primary: string
  confidence: number
  secondary?: string[]
  intensity: number
}

/**
 * Dados de sinais vitais
 */
export interface VitalSignsData extends SensorData {
  sensorType: 'vital_signs'
  data: {
    heartRate?: number
    bloodPressure?: { systolic: number; diastolic: number }
    temperature?: number
    oxygenSaturation?: number
    timestamp: Date
  }
}

/**
 * Resposta da IA para o robô
 */
export interface AIResponse {
  interactionId: string
  text: string
  emotions?: EmotionAnalysis
  actions: RobotCommand[]
  protocolStep?: string
  careLevel: 'low' | 'medium' | 'high'
  timestamp: Date
}

/**
 * Relatório gerado pelo robô
 */
export interface RobotReport {
  reportId: string
  robotId: string
  robotType: RobotType
  interactionId: string
  type: 'assessment' | 'monitoring' | 'incident' | 'summary'
  data: ReportData
  generatedAt: Date
  protocol?: 'IMRE' | 'custom'
}

/**
 * Dados do relatório
 */
export interface ReportData {
  participant?: {
    id: string
    name?: string
    type: 'patient' | 'student' | 'professional'
  }
  assessment?: {
    investigation: any
    methodology: any
    result: any
    evolution: any
  }
  monitoring?: {
    period: { start: Date; end: Date }
    vitalSigns: VitalSignsData[]
    observations: string[]
  }
  incidents?: Array<{
    type: string
    severity: 'low' | 'medium' | 'high' | 'critical'
    description: string
    timestamp: Date
  }>
  summary?: {
    interactions: number
    duration: number
    keyFindings: string[]
    recommendations: string[]
  }
}

/**
 * Configuração de cuidado simbólico
 */
export interface SymbolicCareConfig {
  empathyEnabled: boolean
  empathyLevel: 'low' | 'medium' | 'high'
  humanizationEnabled: boolean
  emotionalRecognition: boolean
  adaptiveResponse: boolean
  presenceMode: 'active' | 'passive' | 'adaptive'
}

/**
 * Evento do robô
 */
export interface RobotEvent {
  eventId: string
  robotId: string
  type: 'sensor_data' | 'command_executed' | 'error' | 'status_change' | 'interaction_start' | 'interaction_end'
  data: any
  timestamp: Date
}

/**
 * Erro do robô
 */
export interface RobotError {
  errorId: string
  robotId: string
  type: 'connection' | 'sensor' | 'actuator' | 'processing' | 'protocol'
  message: string
  severity: 'low' | 'medium' | 'high' | 'critical'
  timestamp: Date
  resolved?: boolean
}

