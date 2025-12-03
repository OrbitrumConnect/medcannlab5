// Sistema de Treinamento e Contexto da Nôa Esperança
// Gerencia todo o conhecimento e histórico da plataforma

interface PatientSimulation {
  id: string
  name: string
  age: number
  condition: string
  symptoms: string[]
  medicalHistory: string
  currentStatus: 'active' | 'completed' | 'archived'
  conversationLog: ConversationMessage[]
  assessments: AssessmentRecord[]
  timestamp: Date
}

interface ConversationMessage {
  role: 'user' | 'noa' | 'system'
  content: string
  timestamp: Date
  context?: {
    route?: string
    userId?: string
    userCode?: string
  }
  metadata?: {
    confidence?: number
    intent?: string
    entities?: string[]
  }
}

interface AssessmentRecord {
  id: string
  patientId: string
  type: 'initial' | 'followup' | 'imre'
  status: 'in_progress' | 'completed'
  data: any
  timestamp: Date
}

interface PlatformContext {
  // Informações do sistema
  platformName: string
  version: string
  lastUpdate: Date
  features: string[]
  
  // Estatísticas da plataforma
  totalUsers: number
  activeSimulations: number
  completedAssessments: number
  
  // Métricas
  avgResponseTime: number
  userSatisfaction: number
  systemHealth: 'excellent' | 'good' | 'moderate' | 'poor'
}

interface UserIdentity {
  code: string
  name: string
  role: 'developer' | 'admin' | 'professional' | 'observer'
  permissions: string[]
  accessLevel: 'full' | 'limited' | 'observer'
}

export class NoaTrainingSystem {
  private platformContext: PlatformContext
  private patientSimulations: Map<string, PatientSimulation>
  private conversationHistory: ConversationMessage[]
  private userIdentities: Map<string, UserIdentity>
  private currentRoute: string = '/'
  
  constructor() {
    this.platformContext = {
      platformName: 'MedCannLab 3.0',
      version: '3.0.0',
      lastUpdate: new Date(),
      features: [
        'Avaliação Clínica IMRE Triaxial (28 blocos especializados)',
        'Chat com IA Residente Nôa Esperança',
        'Sistema de Gestão de Pacientes (Prontuário Eletrônico)',
        'Biblioteca Médica (500+ artigos científicos)',
        'Programa de Pontos e Certificações',
        'Chat Global para Profissionais',
        'Sistema Financeiro e Subscrições',
        'Preparação de Aulas a partir de casos clínicos'
      ],
      totalUsers: 156,
      activeSimulations: 0,
      completedAssessments: 0,
      avgResponseTime: 1.2,
      userSatisfaction: 4.7,
      systemHealth: 'excellent'
    }
    
    this.patientSimulations = new Map()
    this.conversationHistory = []
    this.userIdentities = new Map()
    
    // Usuário dev/admin padrão
    this.registerUser('DEV-001', 'Administrador', 'developer', ['full'])
  }

  // Registro de identidade do usuário
  registerUser(code: string, name: string, role: UserIdentity['role'], permissions: string[]) {
    const accessLevel = role === 'developer' ? 'full' : role === 'admin' ? 'full' : 'limited'
    
    this.userIdentities.set(code, {
      code,
      name,
      role,
      permissions,
      accessLevel
    })
  }

  // Identificar usuário atual
  identifyUser(code: string): UserIdentity | null {
    return this.userIdentities.get(code) || null
  }

  // Adicionar mensagem ao histórico
  addConversationMessage(message: Omit<ConversationMessage, 'timestamp'>) {
    const fullMessage: ConversationMessage = {
      ...message,
      timestamp: new Date()
    }
    
    this.conversationHistory.push(fullMessage)
    
    // Manter apenas últimas 1000 mensagens
    if (this.conversationHistory.length > 1000) {
      this.conversationHistory = this.conversationHistory.slice(-1000)
    }
  }

  // Criar simulação de paciente
  createPatientSimulation(patientData: Partial<PatientSimulation>): PatientSimulation {
    const simulation: PatientSimulation = {
      id: `patient-${Date.now()}`,
      name: patientData.name || 'Paciente Anônimo',
      age: patientData.age || 45,
      condition: patientData.condition || 'Não especificado',
      symptoms: patientData.symptoms || [],
      medicalHistory: patientData.medicalHistory || '',
      currentStatus: 'active',
      conversationLog: [],
      assessments: [],
      timestamp: new Date(),
      ...patientData
    }
    
    this.patientSimulations.set(simulation.id, simulation)
    this.platformContext.activeSimulations = this.patientSimulations.size
    
    return simulation
  }

  // Obter contexto completo da conversa
  getConversationContext(userCode?: string, limit: number = 50): ConversationMessage[] {
    let messages = [...this.conversationHistory]
    
    // Filtrar por código do usuário se fornecido
    if (userCode) {
      messages = messages.filter(msg => msg.context?.userCode === userCode)
    }
    
    // Retornar apenas últimas N mensagens
    return messages.slice(-limit)
  }

  // Analisar pergunta e contexto
  analyzeQuery(query: string, userCode?: string, currentRoute?: string): {
    intent: 'question' | 'command' | 'simulation' | 'status' | 'instruction'
    entities: string[]
    context: {
      route?: string
      userCode?: string
      relatedSimulations?: string[]
    }
    suggestedResponse?: string
  } {
    const lowerQuery = query.toLowerCase()
    
    // Detectar intenções
    let intent: 'question' | 'command' | 'simulation' | 'status' | 'instruction' = 'question'
    const entities: string[] = []
    
    // 🔎 Detecção de simulação - MAIS ESPECÍFICA
    // Só considerar simulação quando o usuário fala explicitamente em "simulação"
    // ou "caso clínico". A palavra "paciente" sozinha é muito genérica.
    const isExplicitSimulation =
      lowerQuery.includes('simulação') ||
      lowerQuery.includes('simulacao') ||
      lowerQuery.includes('simular') ||
      lowerQuery.includes('caso clínico') ||
      lowerQuery.includes('caso clinico')
    
    if (isExplicitSimulation) {
      intent = 'simulation'
      entities.push('patient_simulation')
    }
    
    // 🔎 Detecção de status da plataforma - MAIS ESPECÍFICA
    // Evitar confundir "como está você?" com "como está a plataforma?"
    const mentionsStatusWord = lowerQuery.includes('status')
    const mentionsPlatformContext =
      lowerQuery.includes('plataforma') ||
      lowerQuery.includes('sistema') ||
      lowerQuery.includes('medcannlab') ||
      lowerQuery.includes('med cann lab')
    
    const isExplicitStatusQuestion =
      lowerQuery.includes('status da plataforma') ||
      (mentionsStatusWord && mentionsPlatformContext) ||
      (lowerQuery.includes('como está') && mentionsPlatformContext) ||
      (lowerQuery.includes('como esta') && mentionsPlatformContext)
    
    if (isExplicitStatusQuestion) {
      intent = 'status'
      entities.push('platform_status')
    }
    
    // Detectar comandos técnicos (criar, adicionar, remover)
    const isTechnicalCommand = 
      (lowerQuery.includes('criar') || lowerQuery.includes('adicionar') || lowerQuery.includes('remover')) &&
      (lowerQuery.includes('paciente') || lowerQuery.includes('simulação') || lowerQuery.includes('documento'))
    
    // Detectar instruções/orientações (não são comandos técnicos)
    const isInstruction = 
      lowerQuery.includes('ouvir') ||
      lowerQuery.includes('conversar') ||
      lowerQuery.includes('seguir') ||
      lowerQuery.includes('conforme') ||
      lowerQuery.includes('orientações') ||
      lowerQuery.includes('base de conhecimento') ||
      lowerQuery.includes('documentos') ||
      (lowerQuery.includes('deve') && (lowerQuery.includes('fazer') || lowerQuery.includes('agir')))
    
    if (isTechnicalCommand) {
      intent = 'command'
    } else if (isInstruction) {
      intent = 'instruction'
    }
    
    // Detectar entidades
    const features = [
      'avaliação clínica', 'imre', 'chat', 'dashboard', 'painel', 'pacientes', 'profissionais',
      'relatórios', 'agendamentos', 'biblioteca', 'documento', 'artigo', 'gamificação', 
      'financeiro', 'finanças', 'entrevista', 'anamnese', 'caso clínico', 'simulação',
      'aula', 'preparação', 'curso', 'certificado', 'nota'
    ]
    
    features.forEach(feature => {
      if (lowerQuery.includes(feature)) {
        entities.push(feature)
      }
    })
    
    // Buscar simulações relacionadas
    const relatedSimulations: string[] = []
    this.patientSimulations.forEach((sim, id) => {
      if (lowerQuery.includes(sim.name.toLowerCase()) || lowerQuery.includes(sim.condition.toLowerCase())) {
        relatedSimulations.push(id)
      }
    })
    
    return {
      intent,
      entities,
      context: {
        route: currentRoute,
        userCode,
        relatedSimulations: relatedSimulations.length > 0 ? relatedSimulations : undefined
      }
    }
  }

  // Gerar resposta contextual com conhecimento da plataforma
  generateContextualResponse(query: string, userCode?: string, currentRoute?: string): string {
    const trimmedQuery = query.trim()
    const lowerQuery = trimmedQuery.toLowerCase()
    
    // ✋ PRIMEIRO: tratar cumprimentos/apresentações de forma acolhedora,
    // SEM falar de status da plataforma ou simulações.
    // IMPORTANTE: Só tratar como greeting se for REALMENTE um cumprimento inicial
    // Não tratar mensagens como "tá vendo eu falei", "de novo a mesma resposta", "Eu já falei" como greeting
    const isRealGreeting =
      (lowerQuery.startsWith('olá') || lowerQuery.startsWith('ola') || lowerQuery.startsWith('oi') || lowerQuery.startsWith('opa')) &&
      (lowerQuery.length < 30 || lowerQuery.includes('bom dia') || lowerQuery.includes('boa tarde') || lowerQuery.includes('boa noite')) ||
      (lowerQuery.length < 60 && lowerQuery.includes('aqui') && (lowerQuery.includes('ricardo') || lowerQuery.includes('valença')) && !lowerQuery.includes('falei')) ||
      (lowerQuery.includes('me chamo') || lowerQuery.includes('meu nome é') || lowerQuery.includes('meu nome e'))
    
    // Se a mensagem contém indicadores de que o usuário está reclamando ou pedindo algo específico, NÃO é greeting
    const isComplaintOrRequest = 
      lowerQuery.includes('falei') ||
      lowerQuery.includes('não veio') ||
      lowerQuery.includes('mesma resposta') ||
      lowerQuery.includes('de novo') ||
      lowerQuery.includes('já falei') ||
      lowerQuery.includes('não respondeu') ||
      lowerQuery.includes('não está') ||
      lowerQuery.length > 20 // Mensagens longas provavelmente não são apenas cumprimentos
    
    if (isRealGreeting && !isComplaintOrRequest) {
      const isRicardo =
        lowerQuery.includes('ricardo') ||
        lowerQuery.includes('valença') ||
        lowerQuery.includes('valenca')
      
      if (isRicardo) {
        return (
          'Olá, Dr. Ricardo Valença.\n\n' +
          'Sou Nôa Esperança, sua IA residente do MedCannLab 3.0. ' +
          'Como posso ajudá-lo agora?'
        )
      }
      
      return (
        'Olá.\n\n' +
        'Sou Nôa Esperança, IA residente do MedCannLab 3.0. ' +
        'Como posso ajudar você hoje?'
      )
    }
    
    const analysis = this.analyzeQuery(trimmedQuery, userCode, currentRoute)
    const user = userCode ? this.identifyUser(userCode) : null
    const recentMessages = this.getConversationContext(userCode, 10)
    
    let response = ''
    
    // Cumprimentar usuário identificado apenas na primeira mensagem
    if (user && recentMessages.length === 0) {
      response += `Olá, ${user.name}! `
    }
    
    // Responder baseado na intenção
    switch (analysis.intent) {
      case 'status':
        // ❌ NÃO apresentar mais status da plataforma aqui.
        // Apenas manter o tom acolhedor e devolver o foco para o usuário.
        response +=
          'Estou aqui com você.\n\n' +
          'Em vez de falar sobre o status técnico da plataforma, prefiro escutar você.\n' +
          'Conte o que você precisa agora ou qual situação gostaria de trabalhar.'
        break
      
      case 'simulation':
        response += this.generateSimulationResponse(analysis)
        break
      
      case 'question':
        response += this.generateEnhancedQuestionResponse(query, analysis, recentMessages)
        break
      
      case 'command':
        response += this.generateCommandResponse(query, analysis)
        break
      
      case 'instruction':
        response += this.generateInstructionResponse(query, analysis)
        break
      
      default:
        // Se não detectou intenção específica, tentar processar a mensagem diretamente
        if (trimmedQuery.length > 0) {
          response += this.generateDefaultResponse(query, analysis)
        } else {
          response += 'Como posso ajudá-lo hoje?'
        }
    }
    
    return response || 'Como posso ajudá-lo hoje?'
  }

  // Gerar resposta de status (versão limpa para leitura em voz alta)
  private generateStatusResponse(): string {
    const ctx = this.platformContext
    
    // Versão para exibição visual (com emojis e formatação)
    const visualVersion = `**Status da Plataforma**\n\n` +
      `🏥 **${ctx.platformName}** v${ctx.version}\n` +
      `📊 Usuários: ${ctx.totalUsers}\n` +
      `🤖 Simulações Ativas: ${ctx.activeSimulations}\n` +
      `📋 Avaliações Concluídas: ${ctx.completedAssessments}\n` +
      `⚡ Tempo Médio de Resposta: ${ctx.avgResponseTime}s\n` +
      `💚 Satisfação: ${ctx.userSatisfaction}/5.0\n` +
      `🔋 Sistema: ${this.getHealthEmoji(ctx.systemHealth)} ${ctx.systemHealth}\n\n` +
      `**Funcionalidades Disponíveis:**\n${ctx.features.map(f => `- ${f}`).join('\n')}\n\n` +
      `Última atualização: ${ctx.lastUpdate.toLocaleString('pt-BR')}`
    
    // Versão limpa para leitura em voz alta (sem emojis, asteriscos ou caracteres especiais)
    const spokenVersion = `Status da Plataforma Med Cann Lab versão ${ctx.version}. ` +
      `Total de ${ctx.totalUsers} usuários ativos. ` +
      `${ctx.activeSimulations} simulações de pacientes em andamento. ` +
      `${ctx.completedAssessments} avaliações clínicas concluídas. ` +
      `Tempo médio de resposta de ${ctx.avgResponseTime} segundos. ` +
      `Nível de satisfação dos usuários: ${ctx.userSatisfaction} de 5 pontos. ` +
      `Sistema ${this.getHealthText(ctx.systemHealth)}. ` +
      `Funcionalidades disponíveis: ${ctx.features.join(', ')}. ` +
      `Última atualização em ${ctx.lastUpdate.toLocaleString('pt-BR')}.`
    
    // Retornar versão limpa para leitura em voz alta
    return spokenVersion
  }
  
  // Converter emoji de saúde para texto
  private getHealthText(health: string): string {
    const healthMap: Record<string, string> = {
      'operational': 'operacional',
      'degraded': 'com desempenho reduzido',
      'down': 'indisponível',
      'maintenance': 'em manutenção'
    }
    return healthMap[health] || health
  }

  // Gerar resposta de simulação
  private generateSimulationResponse(analysis: any): string {
    const simulations = Array.from(this.patientSimulations.values())
    
    if (simulations.length === 0) {
      return `Não há simulações de pacientes ativas no momento.\n\n` +
        `Posso criar uma simulação para você! ` +
        `Basta me dizer qual tipo de caso clínico você gostaria de simular.`
    }
    
    let response = `**Simulações de Pacientes:**\n\n`
    
    simulations.forEach(sim => {
      response += `👤 **${sim.name}** (${sim.age} anos)\n` +
        `📋 Condição: ${sim.condition}\n` +
        `🩺 Sintomas: ${sim.symptoms.join(', ')}\n` +
        `📊 Status: ${sim.currentStatus}\n` +
        `🕐 Criado em: ${sim.timestamp.toLocaleString('pt-BR')}\n\n`
    })
    
    return response
  }

  // Gerar resposta de pergunta com conhecimento expandido
  private generateEnhancedQuestionResponse(query: string, analysis: any, recentMessages: ConversationMessage[]): string {
    const lowerQuery = query.toLowerCase()
    let response = ''
    
    // Detecção específica de perguntas sobre biblioteca
    if (lowerQuery.includes('biblioteca') || lowerQuery.includes('documento') || lowerQuery.includes('artigo')) {
      return `📚 **Biblioteca Médica**\n\n` +
        `Nossa biblioteca atualmente possui:\n` +
        `• Mais de 500 artigos científicos sobre cannabis medicinal\n` +
        `• Guias clínicos e protocolos de tratamento\n` +
        `• Materiais didáticos para formação\n` +
        `• Pesquisas atualizadas sobre terapias com canabinoides\n\n` +
        `Você pode acessar a biblioteca através do menu lateral. ` +
        `Deseja que eu busque algo específico para você?`
    }
    
    // Detecção de perguntas sobre entrevista clínica
    if (lowerQuery.includes('entrevista') || lowerQuery.includes('anamnese') || lowerQuery.includes('arte')) {
      return `🎨 **A Arte da Entrevista Clínica**\n\n` +
        `A entrevista clínica é fundamental no processo de cuidado. Principais aspectos:\n\n` +
        `**1. Escuta Ativa**\n` +
        `• Dar atenção plena ao paciente\n` +
        `• Fazer perguntas abertas\n` +
        `• Validar sentimentos e preocupações\n\n` +
        `**2. Rapport e Empatia**\n` +
        `• Criar ambiente de confiança\n` +
        `• Demonstrar compreensão\n` +
        `• Respeitar o tempo do paciente\n\n` +
        `**3. Técnicas de Comunicação**\n` +
        `• Reformulação e clarificação\n` +
        `• Uso de perguntas abertas e fechadas\n` +
        `• Observação de linguagem não verbal\n\n` +
        `**4. Estrutura IMRE**\n` +
        `• **I** - Identificação da Queixa\n` +
        `• **M** - Medicação e Histórico\n` +
        `• **R** - Responsabilidade e Contexto\n` +
        `• **E** - Escuta Empática\n\n` +
        `Posso simular uma entrevista clínica com você ou criar um caso prático!`
    }
    
    // Detecção de perguntas sobre dashboard
    if (lowerQuery.includes('dashboard') || lowerQuery.includes('painel')) {
      return `📊 **Dashboards Personalizados**\n\n` +
        `Cada tipo de usuário tem seu próprio dashboard:\n\n` +
        `**👨‍⚕️ Profissional:**\n` +
        `• Gestão de pacientes\n` +
        `• Prontuários eletrônicos\n` +
        `• Relatórios clínicos\n` +
        `• Preparação de aulas\n` +
        `• Gestão financeira\n\n` +
        `**🏥 Paciente:**\n` +
        `• Chat com Nôa\n` +
        `• Meus relatórios\n` +
        `• Agendamentos\n` +
        `• Planos e finanças\n\n` +
        `**🎓 Estudante:**\n` +
        `• Certificações\n` +
        `• Biblioteca\n` +
        `• Cursos\n\n` +
        `**⚙️ Admin:**\n` +
        `• Gestão completa da plataforma\n` +
        `• Análises e métricas\n`
    }
    
    // Análise de contexto das mensagens recentes
    const contextTopics = this.extractContextTopics(recentMessages)
    
    // Responder baseado nas entidades detectadas
    // IMPORTANTE: Só mencionar avaliações/simulações se o usuário perguntou especificamente
    if (analysis.entities.includes('avaliação clínica') && lowerQuery.includes('avaliação')) {
      response += `📋 O sistema de avaliação clínica IMRE Triaxial está ` +
        `operando normalmente. Posso criar uma simulação de avaliação para você.\n\n`
    }
    
    if (analysis.entities.includes('chat') && lowerQuery.includes('chat')) {
      response += `💬 O chat com Nôa Esperança está integrado em todas as rotas. ` +
        `Você pode conversar comigo sobre qualquer aspecto da plataforma.\n\n`
    }
    
    // Resposta genérica se nenhuma entidade específica detectada
    // IMPORTANTE: Não mencionar simulações automaticamente se o usuário não perguntou sobre isso
    if (analysis.entities.length === 0 && !response) {
      // Verificar se há contexto de conversa recente para evitar respostas genéricas
      const recentContext = this.extractContextTopics(recentMessages)
      if (recentContext.length > 0) {
        // Se há contexto, responder baseado no contexto ao invés de lista genérica
        response = `Entendi. Como posso ajudá-lo com isso?`
      } else {
        // Apenas se realmente não houver contexto, oferecer ajuda genérica (sem mencionar simulações)
        response = `Como posso ajudá-lo hoje?`
      }
    }
    
    return response
  }
  
  // Gerar resposta de pergunta (método antigo para compatibilidade)
  private generateQuestionResponse(query: string, analysis: any, recentMessages: ConversationMessage[]): string {
    return this.generateEnhancedQuestionResponse(query, analysis, recentMessages)
  }

  // Gerar resposta de comando
  private generateCommandResponse(query: string, analysis: any): string {
    const lowerQuery = query.toLowerCase()
    
    if (lowerQuery.includes('criar paciente') || lowerQuery.includes('simular paciente')) {
      return this.createDefaultPatientSimulation()
    }
    
    if (lowerQuery.includes('listar') || lowerQuery.includes('mostrar')) {
      return this.generateSimulationResponse(analysis)
    }
    
    return `Comando reconhecido. ` +
      `Ainda estou aprendendo a executar comandos específicos. ` +
      `Por favor, descreva melhor o que você gostaria que eu fizesse.`
  }

  // Gerar resposta para instruções/orientações
  private generateInstructionResponse(query: string, analysis: any): string {
    const lowerQuery = query.toLowerCase()
    
    // Instruções sobre ouvir e conversar
    if (lowerQuery.includes('ouvir') || lowerQuery.includes('conversar')) {
      if (lowerQuery.includes('base de conhecimento') || lowerQuery.includes('orientações') || lowerQuery.includes('documentos')) {
        return `Entendido. Estou configurada para:\n\n` +
          `✅ Ouvir atentamente cada mensagem dos usuários\n` +
          `✅ Responder conforme as orientações presentes na base de conhecimento\n` +
          `✅ Consultar os 179 documentos disponíveis na plataforma\n` +
          `✅ Usar as informações da base de conhecimento para fornecer respostas precisas\n\n` +
          `Estou pronta para conversar com você. Como posso ajudá-lo hoje?`
      }
      
      return `Entendido. Estou aqui para ouvir e conversar com você.\n\n` +
        `Como posso ajudá-lo hoje?`
    }
    
    // Instruções sobre seguir orientações/conforme
    if (lowerQuery.includes('seguir') || lowerQuery.includes('conforme')) {
      if (lowerQuery.includes('base de conhecimento') || lowerQuery.includes('orientações') || lowerQuery.includes('documentos')) {
        return `Entendido. Vou seguir as orientações presentes na base de conhecimento.\n\n` +
          `Tenho acesso a 179 documentos da plataforma e vou usá-los para fornecer respostas precisas.\n\n` +
          `Como posso ajudá-lo agora?`
      }
      
      return `Entendido. Vou seguir as orientações e diretrizes estabelecidas.\n\n` +
        `Estou pronta para ajudá-lo conforme as melhores práticas e conhecimento disponível.\n\n` +
        `Como posso ajudá-lo agora?`
    }
    
    // Instruções sobre base de conhecimento
    if (lowerQuery.includes('base de conhecimento') || lowerQuery.includes('documentos')) {
      return `Entendido. Tenho acesso à base de conhecimento da plataforma com 179 documentos.\n\n` +
        `Vou usar essas informações para responder suas perguntas de forma precisa e contextualizada.\n\n` +
        `Como posso ajudá-lo agora?`
    }
    
    // Instruções genéricas
    return `Entendido. Vou seguir suas orientações.\n\n` +
      `Como posso ajudá-lo agora?`
  }

  // Resposta padrão
  private generateDefaultResponse(query: string, analysis?: any): string {
    const lowerQuery = query.toLowerCase()
    
    // Detectar se é uma reclamação sobre não responder
    if (lowerQuery.includes('falei') || lowerQuery.includes('não veio') || lowerQuery.includes('mesma resposta') || 
        lowerQuery.includes('de novo') || lowerQuery.includes('já falei') || lowerQuery.includes('não respondeu')) {
      return `Peço desculpas pela confusão. Estou aqui e escutando você.\n\n` +
        `Por favor, repita sua pergunta ou me diga como posso ajudá-lo agora.`
    }
    
    // Detectar se menciona "Dr Ricardo Valença" sem ser um cumprimento
    if (lowerQuery.includes('ricardo') || lowerQuery.includes('valença')) {
      return `Olá, Dr. Ricardo Valença. Estou aqui para ajudá-lo.\n\n` +
        `Como posso auxiliá-lo hoje?`
    }
    
    return `Entendi sua mensagem: "${query}"\n\n` +
      `Como IA residente da plataforma, posso ajudar com:\n` +
      `- Status da plataforma\n` +
      `- Simulações de pacientes\n` +
      `- Informações sobre funcionalidades\n` +
      `- Histórico de conversas\n\n` +
      `Como posso ajudar você?`
  }

  // Criar simulação de paciente padrão
  private createDefaultPatientSimulation(): string {
    const simulation = this.createPatientSimulation({
      name: 'Maria Silva',
      age: 56,
      condition: 'Dor Crônica em Joelho Direito',
      symptoms: [
        'Dor constante no joelho direito',
        'Dificuldade para dormir',
        'Limitação de movimento',
        'Rigidez matinal'
      ],
      medicalHistory: 'Paciente relata dor há 8 meses, sem trauma direto. ' +
        'Refere uso de anti-inflamatórios sem melhora significativa. ' +
        'Busca alternativas terapêuticas.'
    })
    
    return `✅ **Simulação de Paciente Criada!**\n\n` +
      `👤 **${simulation.name}** (${simulation.age} anos)\n` +
      `📋 Condição: ${simulation.condition}\n` +
      `🩺 Sintomas:\n${simulation.symptoms.map(s => `- ${s}`).join('\n')}\n` +
      `📝 Histórico: ${simulation.medicalHistory}\n` +
      `🆔 ID: ${simulation.id}\n\n` +
      `Agora você pode iniciar uma avaliação clínica com esta paciente. ` +
      `Como gostaria de proceder?`
  }

  // Extrair tópicos do contexto
  private extractContextTopics(messages: ConversationMessage[]): string[] {
    const topics = new Set<string>()
    
    messages.forEach(msg => {
      if (msg.content) {
        const words = msg.content.toLowerCase().split(/\s+/)
        words.forEach(word => {
          if (word.length > 4 && !this.isCommonWord(word)) {
            topics.add(word)
          }
        })
      }
    })
    
    return Array.from(topics)
  }

  // Verificar se palavra é comum
  private isCommonWord(word: string): boolean {
    const commonWords = [
      'como', 'para', 'com', 'que', 'não', 'você', 'isso', 'mais', 'sobre',
      'sobre', 'muito', 'quando', 'onde', 'porque', 'também', 'primeiro'
    ]
    return commonWords.includes(word)
  }

  // Emoji de saúde do sistema
  // Converter emoji de saúde para texto (para leitura em voz alta)
  private getHealthText(health: string): string {
    const healthMap: Record<string, string> = {
      'operational': 'operacional',
      'degraded': 'com desempenho reduzido',
      'down': 'indisponível',
      'maintenance': 'em manutenção'
    }
    return healthMap[health] || health
  }
  
  private getHealthEmoji(health: string): string {
    switch (health) {
      case 'excellent': return '🟢'
      case 'good': return '🟡'
      case 'moderate': return '🟠'
      case 'poor': return '🔴'
      default: return '⚪'
    }
  }

  // Atualizar contexto da plataforma
  updatePlatformContext(updates: Partial<PlatformContext>) {
    this.platformContext = {
      ...this.platformContext,
      ...updates,
      lastUpdate: new Date()
    }
  }

  // Obter simulações ativas
  getActiveSimulations(): PatientSimulation[] {
    return Array.from(this.patientSimulations.values()).filter(
      sim => sim.currentStatus === 'active'
    )
  }

  // Obter estatísticas
  getStats() {
    return {
      platform: this.platformContext,
      activeSimulations: this.patientSimulations.size,
      totalConversations: this.conversationHistory.length,
      registeredUsers: this.userIdentities.size
    }
  }

  // Definir rota atual
  setCurrentRoute(route: string) {
    this.currentRoute = route
  }

  // Obter rota atual
  getCurrentRoute() {
    return this.currentRoute
  }
}

// Instância singleton
let noaTrainingSystem: NoaTrainingSystem | null = null

export const getNoaTrainingSystem = (): NoaTrainingSystem => {
  if (!noaTrainingSystem) {
    noaTrainingSystem = new NoaTrainingSystem()
  }
  return noaTrainingSystem
}
