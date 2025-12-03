/**
 * Exemplo de Uso - IA Embarcável para Robôs de Cuidado
 * Demonstra como usar o sistema de embarcação
 */

import { RobotEmbeddingInterface } from './robotEmbeddingInterface'
import { RobotConfig, SensorData, RobotType } from './types'

/**
 * Exemplo 1: Robô Clínico
 */
export async function exemploRoboClinico() {
  // Configurar robô clínico
  const config: RobotConfig = {
    robotId: 'robot_clinico_001',
    robotType: 'clinical',
    name: 'Nôa Clínica',
    location: 'Consultório Dr. Eduardo Faveret',
    capabilities: [
      { type: 'audio', enabled: true },
      { type: 'video', enabled: true },
      { type: 'vital_signs', enabled: true },
      { type: 'speak', enabled: true },
      { type: 'express', enabled: true }
    ],
    settings: {
      language: 'pt-BR',
      voice: 'female-warm',
      empathyLevel: 'high',
      responseSpeed: 'normal',
      protocolMode: 'full'
    }
  }

  // Criar interface de embarcação
  const robot = new RobotEmbeddingInterface(config)

  // Inicializar
  await robot.initialize()

  // Iniciar interação de avaliação
  const interactionId = await robot.startInteraction('assessment', 'patient_123')

  // Simular dados de áudio do paciente
  const audioData: SensorData = {
    robotId: config.robotId,
    sensorType: 'audio',
    data: new ArrayBuffer(0), // Em produção, seria áudio real
    timestamp: new Date(),
    metadata: {
      userId: 'patient_123'
    }
  }

  // Processar e obter resposta
  const response = await robot.processSensorData(audioData)
  console.log('Resposta da IA:', response.text)
  console.log('Comandos para o robô:', response.actions)

  // Finalizar interação e gerar relatório
  const report = await robot.endInteraction(interactionId)
  console.log('Relatório gerado:', report.reportId)

  // Desconectar
  await robot.disconnect()
}

/**
 * Exemplo 2: Robô Domiciliar
 */
export async function exemploRoboDomiciliar() {
  const config: RobotConfig = {
    robotId: 'robot_domiciliar_001',
    robotType: 'home',
    name: 'Nôa Casa',
    location: 'Residência - Rua das Flores, 123',
    capabilities: [
      { type: 'audio', enabled: true },
      { type: 'vital_signs', enabled: true },
      { type: 'speak', enabled: true },
      { type: 'express', enabled: true }
    ],
    settings: {
      language: 'pt-BR',
      voice: 'female-calm',
      empathyLevel: 'high',
      responseSpeed: 'slow',
      protocolMode: 'simplified'
    }
  }

  const robot = new RobotEmbeddingInterface(config)
  await robot.initialize()

  // Iniciar monitoramento
  const interactionId = await robot.startInteraction('monitoring', 'patient_456')

  // Simular sinais vitais
  const vitalSignsData: SensorData = {
    robotId: config.robotId,
    sensorType: 'vital_signs',
    data: {
      heartRate: 72,
      bloodPressure: { systolic: 120, diastolic: 80 },
      temperature: 36.5,
      oxygenSaturation: 98
    },
    timestamp: new Date()
  }

  // Processar sinais vitais
  const response = await robot.processSensorData(vitalSignsData)
  console.log('Análise dos sinais vitais:', response.text)

  // Finalizar monitoramento
  const report = await robot.endInteraction(interactionId)
  await robot.disconnect()
}

/**
 * Exemplo 3: Robô Educativo
 */
export async function exemploRoboEducativo() {
  const config: RobotConfig = {
    robotId: 'robot_educativo_001',
    robotType: 'educational',
    name: 'Nôa Ensino',
    location: 'Universidade - Faculdade de Medicina',
    capabilities: [
      { type: 'audio', enabled: true },
      { type: 'video', enabled: true },
      { type: 'speak', enabled: true },
      { type: 'display', enabled: true }
    ],
    settings: {
      language: 'pt-BR',
      voice: 'female-professional',
      empathyLevel: 'medium',
      responseSpeed: 'normal',
      protocolMode: 'custom'
    }
  }

  const robot = new RobotEmbeddingInterface(config)
  await robot.initialize()

  // Iniciar sessão educacional
  const interactionId = await robot.startInteraction('education', 'student_789')

  // Simular pergunta do estudante
  const questionData: SensorData = {
    robotId: config.robotId,
    sensorType: 'audio',
    data: new ArrayBuffer(0),
    timestamp: new Date(),
    metadata: {
      userId: 'student_789',
      question: 'Como funciona o protocolo IMRE?'
    }
  }

  // Processar pergunta
  const response = await robot.processSensorData(questionData)
  console.log('Resposta educacional:', response.text)

  // Finalizar sessão
  const report = await robot.endInteraction(interactionId)
  await robot.disconnect()
}

/**
 * Exemplo 4: Uso com Event Handlers
 */
export async function exemploComEventHandlers() {
  const config: RobotConfig = {
    robotId: 'robot_eventos_001',
    robotType: 'clinical',
    name: 'Nôa Eventos',
    location: 'Clínica',
    capabilities: [
      { type: 'audio', enabled: true },
      { type: 'speak', enabled: true }
    ],
    settings: {
      language: 'pt-BR',
      voice: 'female-warm',
      empathyLevel: 'high',
      responseSpeed: 'normal',
      protocolMode: 'full'
    }
  }

  const robot = new RobotEmbeddingInterface(config)

  // Registrar handlers de eventos
  robot.on('initialized', (data) => {
    console.log('✅ Robô inicializado:', data.robotId)
  })

  robot.on('response_generated', (response) => {
    console.log('💬 Resposta gerada:', response.text)
    console.log('🎭 Emoções detectadas:', response.emotions)
  })

  robot.on('interaction_started', (interaction) => {
    console.log('🚀 Interação iniciada:', interaction.interactionId)
  })

  robot.on('interaction_ended', (data) => {
    console.log('✅ Interação finalizada:', data.interactionId)
    console.log('📄 Relatório:', data.report.reportId)
  })

  // Inicializar e usar
  await robot.initialize()
  const interactionId = await robot.startInteraction('assessment', 'patient_001')
  
  // Processar dados...
  
  await robot.endInteraction(interactionId)
  await robot.disconnect()
}

