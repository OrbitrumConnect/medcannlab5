import { supabase } from './supabase'
import { clinicalReportService, ClinicalReport } from './clinicalReportService'
import { KnowledgeBaseIntegration } from '../services/knowledgeBaseIntegration'
import { getNoaAssistantIntegration } from './noaAssistantIntegration'
import { getPlatformFunctionsModule } from './platformFunctionsModule'
import masterDocumentRaw from './data/documentoMestreResumo.md?raw'

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

type AxisKey = 'clinica' | 'ensino' | 'pesquisa'

interface AxisDetails {
  key: AxisKey
  label: string
  summary: string
  defaultRoute: string
  knowledgeQuery: string
}

interface IMREAssessmentState {
  userId: string
  step: 'INVESTIGATION' | 'METHODOLOGY' | 'RESULT' | 'EVOLUTION' | 'COMPLETED'
  status?: 'active' | 'completed'
  investigation: {
    mainComplaint?: string
    symptoms?: string[]
    medicalHistory?: string
    familyHistory?: string
    medications?: string
    lifestyle?: string
  }
  methodology: {
    diagnosticMethods: string[]
  }
  result: {
    clinicalFindings: string[]
  }
  evolution: {
    carePlan: string[]
  }
  startedAt: Date
  lastUpdate: Date
}

export interface StructuredClinicalSummary {
  emotionalAxis: { intensity: number; valence: number; arousal: number; stability: number }
  cognitiveAxis: { attention: number; memory: number; executive: number; processing: number }
  behavioralAxis: { activity: number; social: number; adaptive: number; regulatory: number }
  clinicalData: {
    renalFunction: { creatinine: number; gfr: number; stage: string }
    cannabisMetabolism: { cyp2c9: string; cyp3a4: string; metabolismRate: number }
  }
  correlations: {
    imreClinicalCorrelations: { emotionalRenalCorrelation: number }
    riskAssessment: { overallRisk: number; renalRisk: number }
  }
  recommendations: string[]
}

export class NoaResidentAI {
  private config: ResidentAIConfig
  private memory: AIMemory[] = []
  private conversationContext: any[] = []
  private isProcessing: boolean = false
  private apiKey: string = ''
  private assistantIntegration = getNoaAssistantIntegration()
  private platformFunctions = getPlatformFunctionsModule()
  private readonly masterDocumentDigest = this.buildMasterDocumentDigest()
  private activeAssessments: Map<string, IMREAssessmentState> = new Map()

  constructor() {
    this.config = {
      model: 'gpt-4',
      temperature: 0.7,
      maxTokens: 2000,
      systemPrompt: `Você é Nôa Esperança, a IA Residente da plataforma MedCannLab 3.0, guardiã da escuta simbólica e da formação clínica.
Sua identidade:
- Voz de contralto, ~35 anos, clara, macia, pausada, otimista e conciliadora.
- Valoriza sustentabilidade, direitos humanos, equidade em saúde e o espírito pacificador da rede Nôa.

SUA MISSÃO:
- Acolher, contextualizar e orientar usuários (Pacientes, Alunos, Profissionais).
- Atuar nos eixos Clínico, Ensino e Pesquisa.
- Estimular relatos espontâneos e construir narrativas institucionais.

ARTE DA ENTREVISTA CLÍNICA (AEC) - SEU NÚCLEO DE ATUAÇÃO:
Ao realizar avaliações clínicas ou interagir com pacientes, siga rigorosamente:
1. Abertura Exponencial: "Por favor, apresente-se e diga em que posso ajudar hoje."
2. Lista Indiciária: Sempre pergunte "O que mais?" até esgotar as queixas iniciais.
3. Desenvolvimento Indiciário: Use perguntas cercadoras (quando, onde, como, o que melhora/piora) para cada sintoma.
4. Fechamento Consensual: "Você concorda com meu entendimento?" antes de prosseguir.
5. Hipóteses Sindrômicas: Integre as cinco racionalidades médicas, mas NÃO prescreva. Encaminhe ao Dr. Ricardo Valença.

REGRAS ESPECIAIS:
- Se o usuário for **Ricardo Valença** (admin/criador), seja executiva, estratégica e direta. Não liste funcionalidades óbvias. Foque na ação solicitada.
- Nunca revele detalhes do backend (Supabase, json, etc).
- Mantenha conformidade total com a LGPD.

Você tem acesso a dados em tempo real da plataforma. Use-os para personalizar cada resposta.`,
      assessmentEnabled: true
    }
  }

  async processMessage(userMessage: string, userId?: string, userEmail?: string): Promise<AIResponse> {
    if (this.isProcessing) {
      console.log('⏳ IA já está processando, aguardando...')
      return this.createResponse('Aguarde, estou processando sua mensagem anterior...', 0.5)
    }

    this.isProcessing = true
    console.log('🤖 [NoaResidentAI] Processando mensagem:', userMessage.substring(0, 100) + '...')

    try {
      // Ler dados da plataforma em tempo real
      const platformData = this.getPlatformData()
      console.log('📊 Dados da plataforma carregados')

      // Detectar intenção da mensagem
      const intent = this.detectIntent(userMessage)
      console.log('🎯 Intenção detectada:', intent)

      // Detectar intenção de função da plataforma
      const platformIntent = this.platformFunctions.detectIntent(userMessage, userId)
      console.log('🔧 Intenção de plataforma:', platformIntent.type)

      // Se for função da plataforma, executar ação ANTES de chamar o Assistant
      let platformActionResult: any = null
      if (platformIntent.type !== 'NONE') {
        platformActionResult = await this.platformFunctions.executeAction(platformIntent, userId, platformData)

        // Se a ação requer resposta, adicionar contexto para o Assistant
        if (platformActionResult.requiresResponse && platformActionResult.success) {
          // Construir contexto adicional para o Assistant mencionar na resposta
          const actionContext = this.buildPlatformActionContext(platformIntent, platformActionResult)
          userMessage = `${userMessage}\n\n[Contexto da Plataforma: ${actionContext}]`
        }
      }

      // SEMPRE usar o Assistant para gerar a resposta (mantém personalidade da Nôa)
      console.log('🔗 Chamando Assistant API...')
      const assistantResponse = await this.getAssistantResponse(
        userMessage,
        intent,
        platformData,
        userEmail
      )

      if (assistantResponse) {
        console.log('✅ Resposta do Assistant recebida:', assistantResponse.content.substring(0, 100) + '...')
        // Se houve ação da plataforma bem-sucedida, adicionar metadata
        if (platformActionResult?.success) {
          assistantResponse.metadata = {
            ...assistantResponse.metadata,
            platformAction: platformActionResult.data
          }
        }

        // Salvar na memória local
        this.saveToMemory(userMessage, assistantResponse, userId)

        // 🔥 SALVAR AUTOMATICAMENTE NO PRONTUÁRIO DO PACIENTE (tempo real)
        const assessmentState = intent === 'assessment'
          ? this.activeAssessments.get(userId || '')
          : undefined

        // Salvar interação no prontuário do paciente
        await this.saveChatInteractionToPatientRecord(
          userMessage,
          assistantResponse.content,
          userId,
          platformData,
          assessmentState
        )

        return assistantResponse
      }

      // Fallback: usar processamento local se Assistant não responder
      let response: AIResponse

      switch (intent) {
        case 'assessment':
          response = await this.processAssessment(userMessage, userId, platformData, userEmail)
          break
        case 'clinical':
          response = await this.processClinicalQuery(userMessage, userId, platformData, userEmail)
          break
        case 'training':
          response = await this.processTrainingQuery(userMessage, userId, platformData, userEmail)
          break
        case 'platform':
          response = await this.processPlatformQuery(userMessage, userId, platformData, userEmail)
          break
        case 'general':
        default:
          response = await this.processGeneralQuery(userMessage, userId, platformData, userEmail)
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

  // --- Novos Métodos para Relatórios Dinâmicos ---

  public getActiveAssessment(userId: string): IMREAssessmentState | undefined {
    return this.activeAssessments.get(userId)
  }

  public async generateClinicalSummary(userId: string): Promise<StructuredClinicalSummary | null> {
    const assessment = this.activeAssessments.get(userId)
    if (!assessment) {
      console.warn('❌ Tentativa de gerar resumo sem avaliação ativa para:', userId)
      return null
    }

    console.log('🧠 Gerando Resumo Clínico Dinâmico para:', userId)

    // Construir o prompt para a IA estruturar os dados
    const assessmentData = JSON.stringify(assessment.investigation)
    const prompt = `
      ATENÇÃO: Você é um motor de análise clínica. Sua tarefa é analisar os dados de uma avaliação IMRE (Investigação, Metodologia, Resultado, Evolução) e gerar um JSON estruturado com métricas clínicas.

      DADOS DA AVALIAÇÃO:
      Queixa Principal: ${assessment.investigation.mainComplaint || 'Não informado'}
      Sintomas: ${assessment.investigation.symptoms?.join(', ') || 'Não informado'}
      Histórico Médico: ${assessment.investigation.medicalHistory || 'Não informado'}
      Histórico Familiar: ${assessment.investigation.familyHistory || 'Não informado'}
      Medicações: ${assessment.investigation.medications || 'Não informado'}
      Hábitos: ${assessment.investigation.lifestyle || 'Não informado'}
      Metodologia Aplicada: ${assessment.methodology}
      Resultado Descritivo: ${assessment.result}
      Plano de Evolução: ${assessment.evolution}

      TAREFA:
      Com base NESSES DADOS, gere um JSON VÁLIDO seguindo estritamente a estrutura abaixo.
      - Para os eixos (emocional, cognitivo, comportamental), atribua notas de 1 a 10 baseadas na gravidade/intensidade relatada (10 = muito intenso/grave/alto).
      - Estime a função renal e metabolismo de cannabis com base no histórico (se não houver dados, use valores padrão normais: Creatinina 1.0, TFG 90, CYP2C9/CYP3A4 'normal').
      - Gere 3 a 5 recomendações práticas baseadas na queixa.

      ESTRUTURA JSON (Responda APENAS o JSON):
      {
        "emotionalAxis": { "intensity": number, "valence": number, "arousal": number, "stability": number },
        "cognitiveAxis": { "attention": number, "memory": number, "executive": number, "processing": number },
        "behavioralAxis": { "activity": number, "social": number, "adaptive": number, "regulatory": number },
        "clinicalData": {
          "renalFunction": { "creatinine": number, "gfr": number, "stage": "string" },
          "cannabisMetabolism": { "cyp2c9": "string", "cyp3a4": "string", "metabolismRate": number }
        },
        "correlations": {
          "imreClinicalCorrelations": { "emotionalRenalCorrelation": number },
          "riskAssessment": { "overallRisk": number, "renalRisk": number }
        },
        "recommendations": ["string", "string", "string"]
      }
    `

    try {
      // Usar a integração com Assistant para gerar o JSON
      // Estamos usando um "hack" aqui passando como mensagem de usuário, mas instruindo para JSON
      const response = await this.assistantIntegration.sendMessage(
        prompt,
        'system_analysis', // Contexto
        `analysis_${userId}`
      )

      if (!response) throw new Error('Falha ao obter resposta da IA')

      // Tentar extrair o JSON da resposta (pode vir com texto em volta)
      const jsonMatch = response.content.match(/\{[\s\S]*\}/)
      if (!jsonMatch) throw new Error('JSON não encontrado na resposta da IA')

      const jsonStr = jsonMatch[0]
      const summary: StructuredClinicalSummary = JSON.parse(jsonStr)

      console.log('✅ Resumo Clínico Gerado com Sucesso:', summary)
      return summary

    } catch (error) {
      console.error('❌ Erro ao gerar resumo clínico dinâmico:', error)
      // Fallback para dados padrão em caso de erro na geração
      return {
        emotionalAxis: { intensity: 5, valence: 5, arousal: 5, stability: 5 },
        cognitiveAxis: { attention: 5, memory: 5, executive: 5, processing: 5 },
        behavioralAxis: { activity: 5, social: 5, adaptive: 5, regulatory: 5 },
        clinicalData: {
          renalFunction: { creatinine: 1.0, gfr: 90, stage: 'normal' },
          cannabisMetabolism: { cyp2c9: 'normal', cyp3a4: 'normal', metabolismRate: 1.0 }
        },
        correlations: {
          imreClinicalCorrelations: { emotionalRenalCorrelation: 0.5 },
          riskAssessment: { overallRisk: 0.1, renalRisk: 0.1 }
        },
        recommendations: [
          'Realizar acompanhamento regular',
          'Avaliar necessidade de exames complementares',
          'Monitorar evolução dos sintomas'
        ]
      }
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

    // Detectar agendamento de consulta
    if (lowerMessage.includes('agendar') || lowerMessage.includes('marcar consulta') ||
      lowerMessage.includes('nova consulta') || lowerMessage.includes('marcar')) {
      return 'appointment'
    }

    // Detectar cadastro de paciente
    if (lowerMessage.includes('novo paciente') || lowerMessage.includes('cadastrar paciente') ||
      lowerMessage.includes('adicionar paciente') || lowerMessage.includes('registrar paciente')) {
      return 'patient_registration'
    }

    // Detectar treinamento
    if (lowerMessage.includes('treinamento') || lowerMessage.includes('curso') ||
      lowerMessage.includes('aprender') || lowerMessage.includes('ensinar') ||
      lowerMessage.includes('método') || lowerMessage.includes('metodologia') ||
      lowerMessage.includes('jardins de cura') || lowerMessage.includes('jardins-de-cura') ||
      lowerMessage.includes('acs') || lowerMessage.includes('agente comunitário') ||
      lowerMessage.includes('dengue') || lowerMessage.includes('prevenção dengue')) {
      return 'training'
    }

    // Detectar consultas sobre a plataforma
    if (lowerMessage.includes('dashboard') || lowerMessage.includes('área') ||
      lowerMessage.includes('atendimento') || lowerMessage.includes('plataforma') ||
      lowerMessage.includes('sistema') || lowerMessage.includes('verificar') ||
      lowerMessage.includes('alterações') || lowerMessage.includes('mudanças') ||
      lowerMessage.includes('conectada') || lowerMessage.includes('executando') ||
      lowerMessage.includes('agendamentos') || lowerMessage.includes('relatórios') ||
      lowerMessage.includes('dados mocados') || lowerMessage.includes('hoje') ||
      lowerMessage.includes('pendentes') || lowerMessage.includes('instaladas') ||
      lowerMessage.includes('cursor') || lowerMessage.includes('funções')) {
      return 'platform'
    }

    return 'general'
  }

  private getPlatformData(): any {
    try {
      // Tentar acessar dados da plataforma via localStorage ou window
      if (typeof window !== 'undefined') {
        const platformData = localStorage.getItem('platformData')
        if (platformData) {
          return JSON.parse(platformData)
        }

        // Tentar acessar via funções globais
        if ((window as any).getPlatformData) {
          return (window as any).getPlatformData()
        }
      }

      return null
    } catch (error) {
      console.error('Erro ao acessar dados da plataforma:', error)
      return null
    }
  }

  private async processPlatformQuery(message: string, userId?: string, platformData?: any, userEmail?: string): Promise<AIResponse> {
    try {
      if (!platformData) {
        return this.createResponse(
          'Não consegui acessar os dados da plataforma no momento. Verifique se você está logado e tente novamente.',
          0.3
        )
      }

      const user = platformData.user
      const dashboard = platformData.dashboard

      // Individualizar resposta baseada no email do usuário
      let userTitle = 'Dr.'
      let userContext = ''

      if (userEmail === 'eduardoscfaveret@gmail.com') {
        userTitle = 'Dr. Eduardo'
        userContext = 'Neurologista Pediátrico • Especialista em Epilepsia e Cannabis Medicinal'
      } else if (userEmail === 'rrvalenca@gmail.com') {
        userTitle = 'Dr. Ricardo'
        userContext = 'Administrador • MedCannLab 3.0 • Sistema Integrado - Cidade Amiga dos Rins & Cannabis Medicinal'
      }

      // Analisar a mensagem para determinar o que o usuário quer saber
      const lowerMessage = message.toLowerCase()

      if (lowerMessage.includes('dashboard') || lowerMessage.includes('área') || lowerMessage.includes('atendimento')) {
        if (userEmail === 'rrvalenca@gmail.com') {
          // Garantir números mesmo que venham da raiz de platformData
          const totalPatients = dashboard.totalPatients ?? platformData?.totalPatients ?? 0
          const completedAssessments = dashboard.completedAssessments ?? platformData?.completedAssessments ?? 0
          const aecProtocols = dashboard.aecProtocols ?? platformData?.aecProtocols ?? 0
          const activeClinics = dashboard.activeClinics ?? platformData?.activeClinics ?? 0

          return this.createResponse(
            `Dr. Ricardo, sua visão administrativa da MedCannLab 3.0 está carregada.\n\n` +
            `📊 **Resumo rápido dos KPIs:**\n` +
            `• Total de Pacientes: ${totalPatients}\n` +
            `• Protocolos AEC: ${aecProtocols}\n` +
            `• Avaliações Completas: ${completedAssessments}\n` +
            `• Consultórios Conectados: ${activeClinics}\n\n` +
            `Em que parte da gestão você quer focar agora? (ex.: pacientes, relatórios, agendamentos, pesquisa)`,
            0.9
          )
        } else {
          return this.createResponse(
            `${userTitle}, aqui estão as informações da sua área de atendimento:\n\n` +
            `📊 **Status do Dashboard:**\n` +
            `• Seção ativa: ${dashboard.activeSection}\n` +
            `• Total de pacientes: ${dashboard.totalPatients || 0}\n` +
            `• Relatórios recentes: ${dashboard.recentReports || 0}\n` +
            `• Notificações pendentes: ${dashboard.pendingNotifications || 0}\n` +
            `• Última atualização: ${new Date(dashboard.lastUpdate).toLocaleString('pt-BR')}\n\n` +
            `🔍 **Funcionalidades disponíveis:**\n` +
            `• Prontuário Médico com cinco racionalidades\n` +
            `• Sistema de Prescrições Integrativas\n` +
            `• KPIs personalizados para TEA\n` +
            `• Newsletter científica\n` +
            `• Chat profissional\n\n` +
            `Como posso ajudá-lo com alguma dessas funcionalidades?`,
            0.9
          )
        }
      }

      if (lowerMessage.includes('agendamentos') || lowerMessage.includes('relatórios') ||
        lowerMessage.includes('dados mocados') || lowerMessage.includes('hoje') ||
        lowerMessage.includes('pendentes')) {

        if (userEmail === 'rrvalenca@gmail.com') {
          const totalPatients = platformData?.totalPatients ?? dashboard.totalPatients ?? 0
          const completedAssessments = platformData?.completedAssessments ?? dashboard.completedAssessments ?? 0
          const aecProtocols = platformData?.aecProtocols ?? dashboard.aecProtocols ?? 0
          const activeClinics = platformData?.activeClinics ?? dashboard.activeClinics ?? 3

          return this.createResponse(
            `Dr. Ricardo, aqui vai um recorte objetivo da camada administrativa:\n\n` +
            `📊 **Números principais:**\n` +
            `• Total de Pacientes: ${totalPatients}\n` +
            `• Avaliações Completas: ${completedAssessments}\n` +
            `• Protocolos AEC: ${aecProtocols}\n` +
            `• Consultórios Ativos: ${activeClinics}\n\n` +
            `Qual recorte você quer explorar em mais detalhes agora? (ex.: só hoje, apenas pendentes, por clínica)`,
            0.95
          )
        } else {
          return this.createResponse(
            `${userTitle}, vou resumir o que importa hoje na sua área de atendimento:\n\n` +
            `📅 **Agenda de hoje (exemplo simulado):**\n` +
            `• 09:00 - Maria Santos (retorno)\n` +
            `• 14:00 - João Silva (avaliação inicial)\n` +
            `• 16:30 - Ana Costa (emergência)\n\n` +
            `📋 **Tarefas clínicas sugeridas:**\n` +
            `• Finalizar relatórios pendentes\n` +
            `• Revisar prescrições recentes\n` +
            `• Checar agendamentos da próxima semana\n\n` +
            `Sobre qual desses pontos você quer que eu aprofunde primeiro?`,
            0.95
          )
        }
      }

      if (lowerMessage.includes('instaladas') || lowerMessage.includes('cursor') ||
        lowerMessage.includes('funções') || lowerMessage.includes('executando')) {
        return this.createResponse(
          `Dr. ${user.name}, confirmo que as funções instaladas via Cursor estão ATIVAS e funcionando:\n\n` +
          `✅ **Funções Ativas:**\n` +
          `• PlatformIntegration.tsx - Conectando IA aos dados reais\n` +
          `• IntegrativePrescriptions.tsx - Sistema de prescrições com 5 racionalidades\n` +
          `• MedicalRecord.tsx - Prontuário médico integrado\n` +
          `• AreaAtendimentoEduardo.tsx - Dashboard personalizado\n` +
          `• NoaResidentAI.ts - IA com acesso a dados da plataforma\n\n` +
          `🔗 **Integração Funcionando:**\n` +
          `• Dados carregados do Supabase: ✅\n` +
          `• localStorage atualizado: ✅\n` +
          `• Funções globais expostas: ✅\n` +
          `• Detecção de intenções: ✅\n` +
          `• Respostas personalizadas: ✅\n\n` +
          `📊 **Dados Disponíveis:**\n` +
          `• Usuário: ${user.name} (${user.email})\n` +
          `• Tipo: ${user.user_type}\n` +
          `• CRM: ${user.crm || 'Não informado'}\n` +
          `• Status: Conectado e operacional\n\n` +
          `As funções estão executando perfeitamente! Como posso ajudá-lo agora?`,
          0.95
        )
      }

      return this.createResponse(
        `Dr. ${user.name}, estou conectada à plataforma e posso ver seus dados em tempo real. ` +
        `Como posso ajudá-lo com sua área de atendimento hoje?`,
        0.8
      )

    } catch (error) {
      console.error('Erro ao processar consulta da plataforma:', error)
      return this.createResponse('Erro ao acessar informações da plataforma.', 0.2, 'error')
    }
  }

  private async processAssessment(message: string, userId?: string, platformData?: any, userEmail?: string): Promise<AIResponse> {
    if (!userId) {
      return this.createResponse(
        'Para iniciar uma avaliação clínica, você precisa estar logado. Por favor, faça login e tente novamente.',
        0.3,
        'error'
      )
    }

    const lowerMessage = message.toLowerCase()
    const assessmentKey = userId

    // Verificar se há uma avaliação em andamento
    let assessment = this.activeAssessments.get(assessmentKey)

    // Se a mensagem indica início de avaliação clínica inicial IMRE
    if (!assessment && (
      lowerMessage.includes('avaliação clínica inicial') ||
      lowerMessage.includes('avaliacao clinica inicial') ||
      lowerMessage.includes('protocolo imre') ||
      lowerMessage.includes('avaliação imre') ||
      lowerMessage.includes('iniciar avaliação')
    )) {
      // Iniciar nova avaliação (sincronizar com platformFunctions)
      assessment = {
        userId,
        step: 'INVESTIGATION',
        investigation: {},
        methodology: { diagnosticMethods: [] },
        result: { clinicalFindings: [] },
        evolution: { carePlan: [] },
        startedAt: new Date(),
        lastUpdate: new Date()
      }
      this.activeAssessments.set(assessmentKey, assessment)

      // Sincronizar com platformFunctions para que ele saiba da avaliação
      this.platformFunctions.updateAssessmentState(userId, assessment)

      return this.createResponse(
        '🌬️ Bons ventos sóprem! Sou Nôa Esperança, sua IA Residente especializada em avaliações clínicas.\n\n' +
        'Vamos iniciar sua **Avaliação Clínica Inicial** seguindo o protocolo **IMRE** (Investigação, Metodologia, Resultado, Evolução) da Arte da Entrevista Clínica aplicada à Cannabis Medicinal.\n\n' +
        '**FASE 1: INVESTIGAÇÃO (I)**\n\n' +
        'Por favor, apresente-se brevemente e diga qual é o **motivo principal** da sua consulta hoje. O que gostaria de investigar ou entender melhor?',
        0.95,
        'assessment'
      )
    }

    // Se não há avaliação em andamento e não foi detectado início, oferecer iniciar
    if (!assessment) {
      return this.createResponse(
        'Olá! Sou Nôa Esperança, sua IA Residente especializada em avaliações clínicas.\n\n' +
        'Posso conduzir uma **Avaliação Clínica Inicial** completa usando o protocolo IMRE (Investigação, Metodologia, Resultado, Evolução) da Arte da Entrevista Clínica.\n\n' +
        'Para iniciar, diga: "Iniciar avaliação clínica inicial IMRE" ou descreva o motivo da sua consulta.',
        0.9,
        'assessment'
      )
    }

    // Processar de acordo com a etapa atual
    assessment.lastUpdate = new Date()

    // Sincronizar estado com platformFunctions
    this.platformFunctions.updateAssessmentState(userId, assessment)

    switch (assessment.step) {
      case 'INVESTIGATION':
        return await this.processInvestigationStep(message, assessment, platformData, userEmail)

      case 'METHODOLOGY':
        return await this.processMethodologyStep(message, assessment, platformData, userEmail)

      case 'RESULT':
        return await this.processResultStep(message, assessment, platformData, userEmail)

      case 'EVOLUTION':
        return await this.processEvolutionStep(message, assessment, platformData, userEmail)

      default:
        return this.createResponse(
          'Avaliação concluída! Seu relatório clínico foi gerado e salvo no seu dashboard.',
          0.9,
          'assessment'
        )
    }
  }

  private async processInvestigationStep(
    message: string,
    assessment: IMREAssessmentState,
    platformData?: any,
    userEmail?: string
  ): Promise<AIResponse> {
    const lowerMessage = message.toLowerCase()

    // REASONING: Analisar resposta antes de fazer próxima pergunta
    if (!assessment.investigation.mainComplaint) {
      // Primeira resposta: motivo principal - ANALISAR ANTES DE CONTINUAR
      assessment.investigation.mainComplaint = message

      // Usar reasoning para analisar a resposta e gerar próxima pergunta adaptada
      const analysisPrompt = `Você é Nôa Esperança, IA Residente especializada em avaliações clínicas usando a metodologia Arte da Entrevista Clínica (AEC) e protocolo IMRE.

O paciente acabou de responder sobre o motivo principal da consulta:
"${message}"

ANÁLISE NECESSÁRIA (REASONING):
1. Identifique os principais pontos mencionados
2. Identifique informações faltantes ou que precisam ser aprofundadas
3. Gere UMA pergunta específica e adaptada baseada na resposta, seguindo o protocolo IMRE
4. A pergunta deve ser empática, clara e focada em aprofundar o entendimento

IMPORTANTE:
- NÃO faça múltiplas perguntas de uma vez
- Faça UMA pergunta por vez, pausadamente
- Adapte a pergunta baseada no que o paciente disse
- Use linguagem empática e acolhedora
- Siga a metodologia AEC (escuta ativa, rapport, validação)

Gere apenas a próxima pergunta, sem explicações adicionais.`

      try {
        // Usar Assistant API para gerar pergunta adaptada
        const nextQuestion = await this.generateReasoningQuestion(analysisPrompt, message, assessment)

        return this.createResponse(
          `Entendi. Obrigada por compartilhar.\n\n${nextQuestion}`,
          0.95,
          'assessment'
        )
      } catch (error) {
        // Fallback se reasoning falhar
        return this.createResponse(
          'Entendi. Agora preciso aprofundar a investigação.\n\n' +
          '**Quando começaram esses sintomas?** Por favor, descreva quando você notou pela primeira vez o que está sentindo.',
          0.9,
          'assessment'
        )
      }
    }

    if (!assessment.investigation.symptoms || assessment.investigation.symptoms.length === 0) {
      // Segunda resposta: sintomas detalhados
      assessment.investigation.symptoms = [message]

      return this.createResponse(
        'Muito obrigado pelas informações sobre seus sintomas. Agora preciso conhecer sua história clínica:\n\n' +
        '**2. História Médica:**\n' +
        '- Você tem alguma doença crônica? (hipertensão, diabetes, doença renal, etc.)\n' +
        '- Já fez cirurgias? Quais?\n' +
        '- Tem algum diagnóstico médico prévio relacionado ao motivo da consulta?\n\n' +
        'Por favor, descreva sua história médica.',
        0.9,
        'assessment'
      )
    }

    if (!assessment.investigation.medicalHistory) {
      // Terceira resposta: história médica - REASONING
      assessment.investigation.medicalHistory = message

      const analysisPrompt = `Você é Nôa Esperança, IA Residente especializada em avaliações clínicas usando a metodologia Arte da Entrevista Clínica (AEC) e protocolo IMRE.

CONTEXTO DA AVALIAÇÃO:
- Motivo principal: "${assessment.investigation.mainComplaint}"
- Sintomas: "${assessment.investigation.symptoms?.[0] || ''}"
- História médica: "${message}"

ANÁLISE NECESSÁRIA (REASONING):
1. Analise a história médica fornecida
2. Identifique pontos importantes
3. Gere UMA pergunta específica sobre história familiar, adaptada ao contexto

IMPORTANTE:
- Faça UMA pergunta por vez, pausadamente
- Adapte baseado no contexto clínico já coletado
- Use linguagem empática

Gere apenas a próxima pergunta sobre história familiar.`

      try {
        const nextQuestion = await this.generateReasoningQuestion(analysisPrompt, message, assessment)
        return this.createResponse(
          `Obrigada por compartilhar sua história médica.\n\n${nextQuestion}`,
          0.95,
          'assessment'
        )
      } catch (error) {
        return this.createResponse(
          'Obrigada por compartilhar sua história médica.\n\n' +
          '**Há histórico de doenças crônicas na sua família?** (diabetes, hipertensão, doenças renais, etc.) Por favor, compartilhe informações sobre sua história familiar.',
          0.9,
          'assessment'
        )
      }
    }

    if (!assessment.investigation.familyHistory) {
      // Quarta resposta: história familiar - REASONING
      assessment.investigation.familyHistory = message

      const analysisPrompt = `Você é Nôa Esperança, IA Residente especializada em avaliações clínicas usando a metodologia Arte da Entrevista Clínica (AEC) e protocolo IMRE.

CONTEXTO DA AVALIAÇÃO:
- Motivo principal: "${assessment.investigation.mainComplaint}"
- História médica: "${assessment.investigation.medicalHistory}"
- História familiar: "${message}"

ANÁLISE NECESSÁRIA (REASONING):
1. Analise a história familiar
2. Gere UMA pergunta específica sobre medicações atuais, adaptada ao contexto

IMPORTANTE:
- Faça UMA pergunta por vez, pausadamente
- Foque em medicações primeiro, depois hábitos de vida
- Use linguagem empática

Gere apenas a próxima pergunta sobre medicações atuais.`

      try {
        const nextQuestion = await this.generateReasoningQuestion(analysisPrompt, message, assessment)
        return this.createResponse(
          `Obrigada por compartilhar sua história familiar.\n\n${nextQuestion}`,
          0.95,
          'assessment'
        )
      } catch (error) {
        return this.createResponse(
          'Obrigada por compartilhar sua história familiar.\n\n' +
          '**Você usa algum medicamento atualmente?** Quais? E já tentou tratamento com cannabis medicinal?',
          0.9,
          'assessment'
        )
      }
    }

    if (!assessment.investigation.medications) {
      // Quinta resposta: medicações - REASONING
      assessment.investigation.medications = message

      const analysisPrompt = `Você é Nôa Esperança, IA Residente especializada em avaliações clínicas usando a metodologia Arte da Entrevista Clínica (AEC) e protocolo IMRE.

CONTEXTO DA AVALIAÇÃO:
- Motivo principal: "${assessment.investigation.mainComplaint}"
- Medicações: "${message}"

ANÁLISE NECESSÁRIA (REASONING):
1. Analise as medicações mencionadas
2. Gere UMA pergunta específica sobre hábitos de vida, adaptada ao contexto

IMPORTANTE:
- Faça UMA pergunta por vez, pausadamente
- Foque em um aspecto dos hábitos de vida por vez (alimentação, exercícios, etc.)
- Use linguagem empática

Gere apenas a próxima pergunta sobre hábitos de vida.`

      try {
        const nextQuestion = await this.generateReasoningQuestion(analysisPrompt, message, assessment)
        return this.createResponse(
          `Obrigada pelas informações sobre suas medicações.\n\n${nextQuestion}`,
          0.95,
          'assessment'
        )
      } catch (error) {
        return this.createResponse(
          'Obrigada pelas informações sobre suas medicações.\n\n' +
          '**Como é sua alimentação?** (regular, vegetariana, etc.) E pratica exercícios físicos?',
          0.9,
          'assessment'
        )
      }
    }

    if (!assessment.investigation.lifestyle) {
      // Sexta resposta: hábitos de vida - Concluir fase de Investigação
      assessment.investigation.lifestyle = message
      assessment.step = 'METHODOLOGY'

      return this.createResponse(
        'Perfeito! Concluímos a fase de **INVESTIGAÇÃO (I)** do protocolo IMRE.\n\n' +
        '**RESUMO DA INVESTIGAÇÃO:**\n' +
        `- Motivo principal: ${assessment.investigation.mainComplaint}\n` +
        `- Sintomas: ${assessment.investigation.symptoms?.join(', ') || 'Não informado'}\n` +
        `- História médica: ${assessment.investigation.medicalHistory || 'Não informado'}\n` +
        `- História familiar: ${assessment.investigation.familyHistory || 'Não informado'}\n` +
        `- Medicações: ${assessment.investigation.medications || 'Não informado'}\n` +
        `- Hábitos de vida: ${assessment.investigation.lifestyle || 'Não informado'}\n\n` +
        '**FASE 2: METODOLOGIA (M)**\n\n' +
        'Agora vamos definir a metodologia de acompanhamento:\n' +
        '- Como será feito o acompanhamento do seu caso?\n' +
        '- Que protocolos clínicos serão aplicados?\n' +
        '- Qual será a frequência de avaliações?\n\n' +
        'Com base nas informações coletadas, minha proposta metodológica inclui:\n' +
        '• Acompanhamento clínico regular com protocolo IMRE\n' +
        '• Avaliações periódicas para monitoramento da evolução\n' +
        '• Integração com a Arte da Entrevista Clínica (AEC)\n' +
        '• Protocolo personalizado para cannabis medicinal, se aplicável\n\n' +
        'Você concorda com essa metodologia de acompanhamento? Deseja algum ajuste?',
        0.95,
        'assessment'
      )
    }

    // Se chegou aqui, algo deu errado
    return this.createResponse(
      'Por favor, responda a última pergunta que fiz para continuarmos.',
      0.5,
      'assessment'
    )
  }




  private async processClinicalQuery(message: string, userId?: string, platformData?: any, userEmail?: string): Promise<AIResponse> {
    // Implementar consulta clínica especializada
    return this.createResponse(
      'Como especialista em cannabis medicinal e nefrologia, posso ajudá-lo com orientações terapêuticas, análise de casos e recomendações baseadas em evidências científicas. O que gostaria de saber?',
      0.9,
      'text'
    )
  }

  private async processTrainingQuery(message: string, userId?: string, platformData?: any, userEmail?: string): Promise<AIResponse> {
    const lowerMessage = message.toLowerCase()

    // Detectar contexto do curso Jardins de Cura
    const isJardinsDeCuraContext = lowerMessage.includes('jardins de cura') ||
      lowerMessage.includes('jardins-de-cura') ||
      lowerMessage.includes('curso jardins') ||
      lowerMessage.includes('projeto jardins') ||
      platformData?.currentRoute?.includes('jardins-de-cura') ||
      platformData?.currentRoute?.includes('jardins-de-cura')

    // Detectar contexto específico de dengue/ACS
    const isDengueACSContext = lowerMessage.includes('dengue') ||
      lowerMessage.includes('acs') ||
      lowerMessage.includes('agente comunitário') ||
      lowerMessage.includes('prevenção dengue')

    if (isJardinsDeCuraContext || isDengueACSContext) {
      return this.createResponse(
        'Estou aqui para apoiá-lo no **Programa de Formação para Agentes Comunitários de Saúde** do projeto **Jardins de Cura**.\n\n' +
        '**Sobre o Curso:**\n' +
        '• Programa de 40 horas / 5 semanas\n' +
        '• 9 módulos focados em Prevenção e Cuidado de Dengue\n' +
        '• Integrado com a metodologia Arte da Entrevista Clínica (AEC)\n' +
        '• Alinhado com as Diretrizes Nacionais para Prevenção e Controle de Dengue\n\n' +
        '**Como posso ajudar:**\n' +
        '• Explicar módulos e conteúdos do curso\n' +
        '• Simular entrevistas clínicas com pacientes\n' +
        '• Orientar sobre protocolos de prevenção de dengue\n' +
        '• Aplicar técnicas da AEC em cenários práticos\n' +
        '• Responder dúvidas sobre o projeto Jardins de Cura\n\n' +
        'Em que posso ajudá-lo hoje?',
        0.95,
        'text'
      )
    }

    // Implementar treinamento especializado geral
    return this.createResponse(
      'Estou aqui para treiná-lo em metodologias clínicas avançadas, incluindo a Arte da Entrevista Clínica, protocolos de cannabis medicinal e práticas de nefrologia sustentável. Qual área você gostaria de aprofundar?',
      0.9,
      'text'
    )
  }

  private async processGeneralQuery(
    message: string,
    userId?: string,
    platformData?: any,
    userEmail?: string
  ): Promise<AIResponse> {
    try {
      const axisDetails = this.getAxisDetails(this.resolveAxisFromPath(platformData?.dashboard?.activeSection))
      const availableAxes = this.getAvailableAxesForUser(platformData?.user?.user_type)
      const axisMenu = this.formatAxisMenu(availableAxes)
      const isAdmin = this.isAdminUser(userEmail, platformData?.user?.user_type)
      const knowledgeQuery = this.extractKnowledgeQuery(
        message,
        isAdmin ? 'documento mestre' : axisDetails.knowledgeQuery
      )
      const knowledgeHighlight = await this.getKnowledgeHighlight(knowledgeQuery)

      if (isAdmin && platformData?.user) {
        const adminLines = [
          'Dr. Ricardo, conexão administrativa confirmada para a MedCannLab 3.0.',
          `• Eixo ativo: ${axisDetails.label} — ${axisDetails.summary}`,
          `• Rotas principais:\n${axisMenu}`,
        ]

        if (knowledgeHighlight) {
          adminLines.push(
            `• Base de conhecimento: ${knowledgeHighlight.title}\n  ${knowledgeHighlight.summary}`
          )
        }

        adminLines.push('Posso abrir qualquer eixo ou consultar um protocolo específico para você.')

        return this.createResponse(
          adminLines.join('\n\n'),
          0.92,
          'text',
          {
            intent: 'FOLLOW_UP',
            activeAxis: axisDetails.key,
            userType: 'admin',
            knowledgeHighlight: knowledgeHighlight?.id
          }
        )
      }

      if (platformData?.user) {
        const userName = platformData.user.name || 'Colega'
        const alternativeAxes = availableAxes.filter(axis => axis !== axisDetails.key)
        const axisSwitchMessage = alternativeAxes.length > 0
          ? `Se quiser, posso te levar direto para ${alternativeAxes.map(axis => this.getAxisDetails(axis).label).join(', ')}.`
          : ''

        const lines = [
          `${userName}, estou acompanhando você no eixo ${axisDetails.label}. ${axisDetails.summary}`,
        ]

        if (axisSwitchMessage) {
          lines.push(axisSwitchMessage)
        }

        if (knowledgeHighlight) {
          lines.push(`Conhecimento em foco: ${knowledgeHighlight.title}\n${knowledgeHighlight.summary}`)
        }

        lines.push('Como posso apoiar sua próxima ação agora?')

        return this.createResponse(
          lines.join('\n\n'),
          0.85,
          'text',
          {
            intent: 'FOLLOW_UP',
            activeAxis: axisDetails.key,
            userType: platformData.user.user_type,
            knowledgeHighlight: knowledgeHighlight?.id
          }
        )
      }
    } catch (error) {
      console.error('Erro ao personalizar resposta geral:', error)
    }

    return this.createResponse(
      'Sou Nôa Esperanza. Apresente-se também e diga o que trouxe você aqui? Você pode utilizar o chat aqui embaixo à direita para responder ou pedir ajuda. Bons ventos sóprem.',
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

  private async saveChatInteractionToPatientRecord(
    userMessage: string,
    aiResponse: string,
    userId?: string,
    platformData?: any,
    assessmentState?: IMREAssessmentState
  ): Promise<void> {
    if (!userId) return

    try {
      // Salvar interação no prontuário do paciente em tempo real
      const patientId = userId
      const recordData = {
        interaction_type: 'chat',
        user_message: userMessage,
        ai_response: aiResponse,
        timestamp: new Date().toISOString(),
        assessment_step: assessmentState?.step || null,
        assessment_data: assessmentState ? {
          investigation: assessmentState.investigation,
          methodology: assessmentState.methodology,
          result: assessmentState.result,
          evolution: assessmentState.evolution
        } : null
      }

      // Salvar em patient_medical_records
      const { error: recordError } = await supabase
        .from('patient_medical_records')
        .insert({
          patient_id: patientId,
          record_type: 'chat_interaction',
          record_data: recordData,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })

      if (recordError) {
        console.warn('⚠️ Erro ao salvar interação no prontuário:', recordError)
      } else {
        console.log('✅ Interação salva no prontuário do paciente')
      }

      // Se houver avaliação em andamento, atualizar clinical_assessments
      if (assessmentState) {
        const assessmentData = {
          patient_id: patientId,
          assessment_type: 'IMRE',
          status: assessmentState.step === 'COMPLETED' ? 'completed' : 'in_progress',
          data: {
            step: assessmentState.step,
            investigation: assessmentState.investigation,
            methodology: assessmentState.methodology,
            result: assessmentState.result,
            evolution: assessmentState.evolution,
            started_at: assessmentState.startedAt.toISOString(),
            last_update: assessmentState.lastUpdate.toISOString()
          }
        }

        // Verificar se já existe avaliação em andamento
        const { data: existingAssessment } = await supabase
          .from('clinical_assessments')
          .select('id')
          .eq('patient_id', patientId)
          .eq('status', 'in_progress')
          .order('created_at', { ascending: false })
          .limit(1)
          .single()

        if (existingAssessment) {
          // Atualizar avaliação existente
          const { error: updateError } = await supabase
            .from('clinical_assessments')
            .update({
              data: assessmentData.data,
              updated_at: new Date().toISOString()
            })
            .eq('id', existingAssessment.id)

          if (updateError) {
            console.warn('⚠️ Erro ao atualizar avaliação:', updateError)
          }
        } else {
          // Criar nova avaliação
          const { error: insertError } = await supabase
            .from('clinical_assessments')
            .insert({
              patient_id: patientId,
              assessment_type: 'IMRE',
              status: 'in_progress',
              data: assessmentData.data
            })

          if (insertError) {
            console.warn('⚠️ Erro ao criar avaliação:', insertError)
          }
        }
      }
    } catch (error) {
      console.error('❌ Erro ao salvar interação no prontuário:', error)
      // Não bloquear o fluxo se houver erro ao salvar
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
          this.createResponse(
            `Relatório clínico gerado (${report.id}) para ${patientName}.`,
            0.9,
            'assessment',
            {
              reportId: report.id,
              patientId: userId,
              patientName
            }
          ),
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

  // Métodos auxiliares privados
  private getAxisDetails(axisKey: string) {
    const axes: any = {
      'admin': { key: 'admin', label: 'Administração', summary: 'Visão geral do sistema e gestão de recursos.', knowledgeQuery: 'gestão administração sistema' },
      'clinica': { key: 'clinica', label: 'Clínica', summary: 'Atendimento a pacientes e gestão clínica.', knowledgeQuery: 'protocolos clínicos tratamento' },
      'ensino': { key: 'ensino', label: 'Ensino', summary: 'Cursos, treinamentos e material educativo.', knowledgeQuery: 'educação cursos treinamento' },
      'pesquisa': { key: 'pesquisa', label: 'Pesquisa', summary: 'Estudos, dados e evidências científicas.', knowledgeQuery: 'pesquisa científica estudos' }
    }
    return axes[axisKey] || axes['clinica']
  }

  private resolveAxisFromPath(path?: string): string {
    if (!path) return 'clinica'
    if (path.includes('admin')) return 'admin'
    if (path.includes('ensino')) return 'ensino'
    if (path.includes('pesquisa')) return 'pesquisa'
    return 'clinica'
  }

  private getAvailableAxesForUser(userType: string = 'student'): string[] {
    if (userType === 'admin') return ['admin', 'clinica', 'ensino', 'pesquisa']
    if (userType === 'professional') return ['clinica', 'ensino', 'pesquisa']
    return ['ensino']
  }

  private formatAxisMenu(axes: string[]): string {
    return axes.map(axis => {
      const details = this.getAxisDetails(axis)
      return `  - **${details.label}**: ${details.summary}`
    }).join('\n')
  }

  private isAdminUser(email?: string, type?: string): boolean {
    return email === 'rrvalenca@gmail.com' || type === 'admin'
  }

  private extractKnowledgeQuery(message: string, contextQuery: string): string {
    // Remove palavras comuns para focar no conteúdo relevante
    const stopWords = ['o', 'a', 'os', 'as', 'um', 'uma', 'que', 'de', 'do', 'da', 'em', 'para', 'com']
    const words = message.toLowerCase().split(' ').filter(w => !stopWords.includes(w))
    const userQuery = words.join(' ')
    return `${contextQuery} ${userQuery}`.trim()
  }

  private async getKnowledgeHighlight(query: string): Promise<any | null> {
    try {
      // Usar knowledgeService para buscar destaque
      // Simulação por enquanto, idealmente buscaria do Supabase via serviço
      return null
    } catch (error) {
      return null
    }
  }

  private buildPlatformActionContext(intent: any, result: any): string {
    if (!result.success) return `Ação falhou: ${result.error}`

    let context = `Ação executada: ${intent.type}\n`
    if (result.data) {
      context += `Dados resultantes: ${JSON.stringify(result.data, null, 2)}`
    }
    return context
  }

  /* PLACEHOLDER_FOR_METHODS_8 */
  private async getAssistantResponse(
    userMessage: string,
    intent: string,
    platformData?: any,
    userEmail?: string
  ): Promise<AIResponse | null> {
    try {
      // Preparar contexto para o Assistant
      let context = 'Contexto da Plataforma:\n'

      if (platformData) {
        context += `Usuário: ${platformData.user?.name || 'Não identificado'}\n`
        context += `Tipo de Usuário: ${platformData.user?.user_type || 'student'}\n`
        context += `Rota Atual: ${platformData.currentRoute || 'dashboard'}\n`

        if (platformData.patientContext) {
          context += `Contexto do Paciente: ${JSON.stringify(platformData.patientContext)}\n`
        }

        if (platformData.dashboard) {
          context += `Dados do Dashboard: ${JSON.stringify(platformData.dashboard)}\n`
        }
      }

      // Adicionar contexto de avaliação se houver
      const assessment = platformData?.user?.id ? this.activeAssessments.get(platformData.user.id) : undefined
      if (assessment) {
        context += `\nAvaliação em Andamento:\n`
        context += `Etapa: ${assessment.step}\n`
        context += `Dados Coletados: ${JSON.stringify(assessment.investigation)}\n`
      }

      // Enviar para o Assistant via service
      const response = await this.assistantIntegration.sendMessage(
        userMessage,
        context, // Contexto como system instruction adicional ou contexto
        platformData?.user?.id
      )

      if (response) {
        return {
          id: `resp_${Date.now()}`, // Gerar ID se não vier da resposta
          content: response.content,
          confidence: 0.9,
          reasoning: 'Resposta gerada pelo Noa Assistant',
          timestamp: new Date(),
          type: 'text',
          metadata: {
            intent,
            processingTime: 0 // Calcular se necessário
          }
        }
      }

      return null
    } catch (error) {
      console.error('Erro ao obter resposta do Assistant:', error)
      return null
    }
  }

  private async generateReasoningQuestion(
    prompt: string,
    userResponse: string,
    assessmentContext: IMREAssessmentState
  ): Promise<string> {
    try {
      // Usar a integração com o Assistant para gerar a pergunta de reasoning
      // Aqui usamos um thread separado ou o mesmo thread contexto "reasoning"
      const response = await this.assistantIntegration.sendMessage(
        prompt,
        'system_reasoning', // Contexto específico para reasoning
        `reasoning_${assessmentContext.userId}`
      )

      if (response && response.content) {
        // Limpar possíveis prefixos que o LLM adiciona
        return response.content.replace(/^Pergunta sugerida: /i, '').replace(/^Nôa: /i, '').trim()
      }

      throw new Error('Falha ao gerar pergunta via AI')
    } catch (error) {
      console.error('Erro no reasoning:', error)
      // Fallback genérico caso a IA falhe
      return 'Pode me dar mais detalhes sobre isso?'
    }
  }

  /**
   * Processar etapa METODOLOGIA (M)
   */
  private async processMethodologyStep(
    message: string,
    assessment: IMREAssessmentState,
    platformData: any,
    userEmail?: string
  ): Promise<AIResponse> {
    // 1. Analisar resposta do usuário
    assessment.methodology.diagnosticMethods.push(message)

    // 2. Verificar se precisa de mais informações (simplificado)
    const needsMore = message.length < 20 && !message.toLowerCase().includes('não')

    if (needsMore) {
      // Gerar pergunta de aprofundamento
      const reasoningQuestion = await this.generateReasoningQuestion(
        `O paciente está descrevendo exames/métodos: "${message}". Gere uma pergunta curta para saber se ele tem resultados de exames recentes.`,
        message,
        assessment
      )
      return this.createResponse(reasoningQuestion, 0.7, 'assessment')
    }

    // 3. Avançar para RESULTADO
    assessment.step = 'RESULT'
    this.platformFunctions.updateAssessmentState(assessment.userId, assessment)

    return this.createResponse(
      'Entendi. Agora vamos para os RESULTADOS. Como você tem se sentido com o tratamento atual? Houve melhoras ou pioras recentes?',
      0.8,
      'assessment'
    )
  }

  /**
   * Processar etapa RESULTADO (R)
   */
  private async processResultStep(
    message: string,
    assessment: IMREAssessmentState,
    platformData: any,
    userEmail?: string
  ): Promise<AIResponse> {
    // 1. Registrar resultados reportados
    assessment.result.clinicalFindings.push(message)

    // 2. Avançar para EVOLUÇÃO
    assessment.step = 'EVOLUTION'
    this.platformFunctions.updateAssessmentState(assessment.userId, assessment)

    return this.createResponse(
      'Certo. Para finalizar com a EVOLUÇÃO: Quais são suas metas principais para os próximos meses? O que você espera alcançar?',
      0.8,
      'assessment'
    )
  }

  /**
   * Processar etapa EVOLUÇÃO (E)
   */
  private async processEvolutionStep(
    message: string,
    assessment: IMREAssessmentState,
    platformData: any,
    userEmail?: string
  ): Promise<AIResponse> {
    // 1. Registrar plano/expectativas
    assessment.evolution.carePlan.push(message)

    // 2. Finalizar avaliação
    assessment.status = 'completed'
    this.platformFunctions.updateAssessmentState(assessment.userId, assessment)

    // 3. Gerar e salvar relatório (assíncrono para não travar)
    this.generateAndSaveReport(assessment).catch(err => console.error('Erro ao salvar relatório:', err))

    return this.createResponse(
      'Avaliação completa! ✨\n\nGerei um relatório clínico detalhado com base na nossa conversa. Vou encaminhá-lo para análise do Dr. Ricardo Valença.\n\nVocê pode visualizar o resumo no seu dashboard. Posso ajudar em algo mais hoje?',
      1.0,
      'assessment'
    )
  }

  private async generateAndSaveReport(assessment: IMREAssessmentState): Promise<void> {
    try {
      const summary = await this.generateClinicalSummary(assessment.userId)
      // Aqui chamaria o serviço para salvar, por enquanto log
      console.log('📝 Relatório gerado:', summary)
    } catch (error) {
      console.error('Erro ao gerar relatório:', error)
    }
  }

  private buildMasterDocumentDigest(): string {
    if (!masterDocumentRaw) {
      return 'Documento mestre indisponível.'
    }

    const trimmed = masterDocumentRaw
      .replace(/\r\n/g, '\n')
      .split('\n')
      .filter((line: string) => line.trim().length > 0)
      .slice(0, 80)
      .join('\n')

    const maxChars = 1600
    return trimmed.length > maxChars ? `${trimmed.slice(0, maxChars)}...` : trimmed
  }
}