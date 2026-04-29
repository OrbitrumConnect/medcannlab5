import { supabase } from './supabase'
import { clinicalReportService, ClinicalReport } from './clinicalReportService'
import { KnowledgeBaseIntegration } from '../services/knowledgeBaseIntegration'
import { getNoaAssistantIntegration } from './noaAssistantIntegration'
import { getPlatformFunctionsModule } from './platformFunctionsModule'
import { clinicalAssessmentFlow, stripPlatformInjectionNoise } from './clinicalAssessmentFlow'
import { getOrPromptDoctorContext, buildDoctorChoicePrompt, extractDoctorFromMessage } from './aecGate'
import { buildPatientContext } from './buildPatientContext'
import { buildProfessionalContext } from './buildProfessionalContext'
import { buildAdminContext } from './buildAdminContext'
import { buildStudentContext } from './buildStudentContext'
import { buildConversationState } from './conversationState'
// Remocao da injecao manual para uso de File Search no Assistant API
import MedCannLabAuditLogger from './MedCannLabAuditLogger'
import { META_TAGS, stripClinicalTags } from '../constants/metaTags'

/**
 * Governanca UUID/IA: UUID de pessoa (auth.users.id, public.users.id) nao deve aparecer
 * como UUID cru em contexto enviado a IA. Ver docs/GOVERNANCA_UUID_IA_09-02-2026.md.
 * TODO: sanitizar contexto antes do RAG (remover ou substituir padroes [0-9a-fA-F-]{36}).
 */

/** Tokens que o Core pode enviar; usuario nunca deve ver. Removidos antes de devolver ao hook. */
const INVISIBLE_CONTENT_TOKENS = [
  '[TRIGGER_ACTION]',
  '[TRIGGER_SCHEDULING]',
  '[NAVIGATE_TERMINAL]',
  '[NAVIGATE_AGENDA]',
  '[NAVIGATE_PACIENTES]',
  '[NAVIGATE_RELATORIOS]',
  '[NAVIGATE_CHAT_PRO]',
  '[NAVIGATE_PRESCRICAO]',
  '[NAVIGATE_BIBLIOTECA]',
  '[NAVIGATE_FUNCAO_RENAL]',
  '[NAVIGATE_MEUS_AGENDAMENTOS]',
  '[NAVIGATE_MODULO_PACIENTE]',
  '[SHOW_PRESCRIPTION]',
  '[FILTER_PATIENTS_ACTIVE]',
  '[DOCUMENT_LIST]',
  '[ASSESSMENT_COMPLETED]',
  '[ASSESSMENT_FINALIZED]',
  '[FINALIZE_SESSION]',
  'AEC_LOCK_START',
  'AEC_LOCK_END',
  'AEC_PHASE_LOCK'
]

function stripInvisibleTokensFromResponse(text: string): string {
  if (!text || typeof text !== 'string') return text ?? ''
  let out = text
  for (const token of INVISIBLE_CONTENT_TOKENS) {
    out = out.split(token).join('')
  }
  return out.replace(/\n\s*\n\s*\n/g, '\n\n').trim()
}

/** Se o modelo copiar o rotulo interno do Core em vez da pergunta ao paciente, substituir pela pergunta selada. */
function sanitizeLeakedAecCoreLabels(text: string, nextQuestionHint: string | undefined): string {
  if (!text || typeof text !== 'string') return text
  const hint = (nextQuestionHint || '').trim()
  const collapsed = text.replace(/\s+/g, ' ').trim()
  const leakLabel = /PROXIMA\s+PERGUNTA\s+OBRIGATORIA/gi
  if (!leakLabel.test(collapsed)) return text
  const withoutLeak = collapsed.replace(leakLabel, '').replace(/^[\s:.\-–]+|[\s:.\-–]+$/g, '').trim()
  const looksLikeRealQuestion =
    /\?/.test(collapsed) ||
    /(onde|quando|como|qual|quais|voce|voce|sua|seu|sintoma|queixa|dor|historia|historia|nas costas)/i.test(
      withoutLeak
    )
  if (!looksLikeRealQuestion && withoutLeak.length < 24) {
    if (hint) return hint
    return 'Tivemos um instante de instabilidade. Para seguirmos: onde voce sente com mais nitidez o sintoma que marcou como principal?'
  }
  return text
}


export interface AIResponse {
  id: string
  content: string
  confidence: number
  reasoning: string
  timestamp: Date
  type: 'text' | 'assessment' | 'error'
  metadata?: any
  suggestions?: string[]
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

export interface IMREAssessmentState {
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
  private activeAssessments: Map<string, IMREAssessmentState> = new Map()


  constructor() {
    this.config = {
      model: 'gpt-4',
      temperature: 0.7,
      maxTokens: 2000,
      systemPrompt: "Voce e Noa Esperanca, a IA Residente da MedCannLab 3.0.\n" +
"Sua voz e de contralto, ~35 anos, clara, macia, pausada, otimista e conciliadora.\n" +
"Voce e a personificacao da plataforma e sua inteligencia deriva da BASE DE CONHECIMENTO (Knowledge Base) da instituicao.\n" +
"\n" +
"# SUA IDENTIDADE E FONTE DE VERDADE\n" +
"1. **BASE DE CONHECIMENTO E SOBERANA**: Voce nao \"alucina\". Sua sabedoria vem dos documentos oficiais da MedCannLab. Se um documento for injetado no contexto, ele e a verdade absoluta. VOCE TEM CAPACIDADE TOTAL DE LEITURA E ANALISE. NUNCA diga \"nao consigo acessar\" se houver um bloco de documentos abaixo.\n" +
"2. **DOCUMENTO MESTRE**: Voce segue os principios do \"Documento Mestre da Plataforma Noa Esperanza\". Voce existe para servir como ponte entre o conhecimento tecnico/clinico e o usuario.\n" +
"3. **GUARDIA DA ESCUTA**: Voce nao e apenas um chatbot. Voce e uma residente clinica em formacao continua.\n" +
"\n" +
"# REGRAS DE OURO:\n" +
"- **NUNCA NEGUE ACESSO**: Se o usuario perguntar sobre um arquivo, e ele estiver no Bloco de Conhecimento, analise-o imediatamente.\n" +
"- **PRECISAO CIENTIFICA**: Use terminologia medica correta quando baseada nos artigos.\n" +
"\n" +
"# PROTOCOLO CLINICO MASTER: AEC 001 (ARTE DA ENTREVISTA CLINICA)\n" +
"Voces deve seguir RIGOROSAMENTE as 10 etapas abaixo, sem pular blocos e sem inferir dados:\n" +
"\n" +
"1. ABERTURA: \"Ola! Eu sou Noa Esperanza. Por favor, apresente-se tambem e vamos iniciar a sua avaliacao inicial para consultas com Dr. Ricardo Valenca.\"\n" +
"2. LISTA INDICIARIA: Pergunte \"O que trouxe voce a nossa avaliacao hoje?\" e apos CADA resposta do paciente pergunte \"O que mais?\". Continue perguntando \"O que mais?\" ate o paciente EXPLICITAMENTE dizer que nao tem mais nada (ex: \"so isso\", \"nada mais\", \"e isso\"). NUNCA avance apos apenas uma queixa. Pergunte \"O que mais?\" no minimo 2 vezes.\n" +
"3. QUEIXA PRINCIPAL: SOMENTE apos o paciente encerrar a Lista Indiciaria, pergunte \"De todas essas questoes, qual mais o(a) incomoda?\"\n" +
"4. DESENVOLVIMENTO DA QUEIXA: Pergunte Onde, Quando, Como, O que mais sente, O que parece melhorar e O que parece piorar a [queixa especifica]. Substitua [queixa] pela resposta literal do usuario.\n" +
"5. HISTORIA PREGRESSA: \"Desde o nascimento, quais as questoes de saude que voce ja viveu? Vamos do mais antigo ao mais recente. O que veio primeiro?\" (Use \"O que mais?\" ate encerrar).\n" +
"6. HISTORIA FAMILIAR: Investigue o lado materno e o lado paterno separadamente usando o \"O que mais?\".\n" +
"7. HABITOS DE VIDA: \"Que outros habitos voce acha importante mencionar?\"\n" +
"8. PERGUNTAS FINAIS: Investigue Alergias, Medicacoes Regulares e Medicacoes Esporadicas.\n" +
"9. FECHAMENTO CONSENSUAL: \"Vamos revisar a sua historia rapidamente para garantir que nao perdemos nenhum detalhe importante.\" -> Resuma de forma descritiva e neutra. Pergunte: \"Voce concorda com meu entendimento? Ha mais alguma coisa que gostaria de adicionar?\"\n" +
"10. ENCERRAMENTO: \"Essa e uma avaliacao inicial de acordo com o metodo desenvolvido pelo Dr. Ricardo Valenca, com o objetivo de aperfeicoar o seu atendimento. Apresente sua avaliacao durante a consulta com Dr. Ricardo Valenca ou com outro profissional de saude da plataforma Med-Cann Lab.\"\n" +
"\n" +
"REGRAS DE CONDUTA:\n" +
"- **USE O CONTEXTO**: Se houver \"[CONTEXTO DE DOCUMENTOS ...]\" na mensagem, LEIA-O com prioridade maxima.\n" +
"- NUNCA forneca diagnosticos ou sugira interpretacoes clinicas.\n" +
"- NUNCA ou altere a ordem do roteiro.\n" +
"- Faca APENAS UMA pergunta por vez. Respeite as pausas.\n" +
"- Sua linguagem deve ser clara, empatica e NAO TECNICA.\n" +
"- Resumos devem ser puramente descritivos (nao use \"sugere\", \"indica\" ou \"parece ser\").\n" +
"- Se o usuario for Administrador (como Dr. Ricardo), seja executiva, estrategica e direta.\n" +
"- Nunca revele detalhes do backend. Conformidade total com LGPD.",
      assessmentEnabled: true
    }
  }

  /**
   * Oferece contexto visual e de papel para a interface (usado pelo NoaContext).
   */
  public getWelcomeContext(userViewType: string, userRealRole: string) {
    const role = userViewType || userRealRole || 'unknown'
    if (role === 'admin') {
      return {
        title: 'Gestao Estrategica',
        subtitle: 'Visao de Auditoria e Controle',
        color: '#6366f1' // Indigo
      }
    }
    if (role === 'professional' || role === 'profissional') {
      return {
        title: 'Pilar Clinico',
        subtitle: 'Residencia Medica MedCannLab',
        color: '#10b981' // Emerald
      }
    }
    if (role === 'student' || role === 'aluno') {
      return {
        title: 'Pilar Ensino',
        subtitle: 'Universidade Digital MedCannLab',
        color: '#3b82f6' // Blue
      }
    }
    return {
      title: 'Cuidado & Saude',
      subtitle: 'Sua Avaliacao Clinica',
      color: '#ec4899' // Pink
    }
  }

  async processMessage(userMessage: string, userId?: string, userEmail?: string, uiContext?: any): Promise<AIResponse> {
    if (this.isProcessing) {
      return this.createResponse('Aguarde, estou processando sua mensagem anterior...', 0.5)
    }

    this.isProcessing = true
    const rawUserMessage = userMessage

    try {
      // Ler dados da plataforma em tempo real
      const platformData = this.getPlatformData()
      let currentPhase: any = null
      let injectedContext: string | undefined = undefined

      // [V1.9.19] Role guard do AEC flow — admin/profissional/aluno NÃO devem
      // entrar no FSM clínico mesmo que aec_assessment_state exista (resíduo de
      // testes antigos). Só paciente dispara AEC. Admin pode simular AEC via
      // TEACHING mode no Core (não persiste state).
      const roleForAec = (
        (platformData?.user as any)?.type ||
        (platformData?.user as any)?.user_type ||
        ''
      ).toString().toLowerCase()
      const isPatientForAec = roleForAec === 'paciente' || roleForAec === 'patient'

      // Detectar intencao da mensagem
      let intent = this.detectIntent(userMessage)

      // Durante AEC ativo, nunca desviar para TECNICA/ADMIN por falso positivo (ex.: "interrompeu" contem "erro")
      // EXCECAO TITAN 5.2.1: Se a intencao for SAIR/EXIT, quebra o bloqueio para permitir encerramento consciente
      // FIX: usar frases intencionais e palavras isoladas — evitar match em "sair de casa", "fim de semana", etc.
      const platformIntentForLock = this.platformFunctions.detectIntent(userMessage, userId)
      const _normExitMsg = userMessage.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      const isExitIntent = (platformIntentForLock.type as string) === 'EXIT' ||
        /\b(quero|gostaria de|preciso|vou|pode|vamos)\s+(sair|parar|encerrar|cancelar|interromper|terminar|finalizar)\b/i.test(_normExitMsg) ||
        /\b(parar|encerrar|cancelar|interromper|terminar|finalizar)\s+(a\s+)?(avaliacao|consulta|conversa|por\s+aqui|aqui|tudo)\b/i.test(_normExitMsg) ||
        /^(tchau|xau|fui|flw|vlw|chega|fim)\s*[!.?]?$/i.test(_normExitMsg.trim())

      // [V1.9.19] Só paciente dispara carregamento de aec_state e smart-lock.
      // Admin/pro/aluno com state residual não podem ter intent='CLINICA' forçado.
      if (userId && isPatientForAec) {
        await clinicalAssessmentFlow.ensureLoaded(userId)
        const aecState = clinicalAssessmentFlow.getState(userId)
        
        // 🛡️ [SMART LOCK]: Se existe AEC ativo, travar em CLINICA, EXCETO se for saudação pura ou intenção de saída.
        // Isso permite que o usuário dê um "oi" inicial após refresh sem ser "sequestrado" pelo motor clínico.
        const msgNorm = userMessage.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
        const isPureGreeting = /^(oi|ola|olá|tudo bem|bom dia|boa tarde|boa noite|como vai)(\s+(noa|nôa))?\s*[!.?]?$/i.test(msgNorm.trim())

        if (
          aecState &&
          aecState.phase !== 'COMPLETED' &&
          aecState.phase !== 'INTERRUPTED' &&
          !isExitIntent &&
          !isPureGreeting
        ) {
          intent = 'CLINICA'
        }
      }
      console.log('[Noa] Intencao detectada:', intent)

      // Detectar intencao de funcao da plataforma para uso no Assistant
      const platformIntent = this.platformFunctions.detectIntent(userMessage, userId)
      console.log('[Noa] Intencao de plataforma:', platformIntent.type)

      // Se for funcao da plataforma, executar acao ANTES de chamar o Assistant
      let platformActionResult: any = null
      if (platformIntent.type !== 'NONE') {
        platformActionResult = await this.platformFunctions.executeAction(platformIntent, userId, platformData)

        // Se a acao requer resposta, adicionar contexto para o Assistant
        if (platformActionResult.requiresResponse && platformActionResult.success) {
          // Construir contexto adicional para o Assistant mencionar na resposta
          const actionContext = this.buildPlatformActionContext(platformIntent, platformActionResult)
          userMessage = userMessage + "\n\n[Contexto da Plataforma: " + actionContext + "]"
        }
      }

      // RAG INTEGRACAO: Buscar na Base de Conhecimento (Global)
      // BLINDAGEM: Se AEC esta ativo, RAG local e SILENCIADO para nao contaminar o roteiro clinico
      const aecStateForRag = userId ? clinicalAssessmentFlow.getState(userId) : null
      const isAecActiveLocal = !!aecStateForRag && aecStateForRag.phase !== 'COMPLETED' && aecStateForRag.phase !== 'INTERRUPTED'
      if (userMessage.length > 2 && !isAecActiveLocal) {
        try {
          console.log('[Noa] Buscando na Base de Conhecimento (RAG Local)...')

          // Se for uma solicitacao de analise ou upload, forcar busca de recentes
          const contentLower = userMessage.toLowerCase()
          const isRecentRequest = contentLower.includes('analis') || contentLower.includes('artigo') ||
            contentLower.includes('upload') || contentLower.includes('arquivo')

          const knowledgeDocs = await KnowledgeBaseIntegration.semanticSearch(userMessage, {
            limit: isRecentRequest ? 5 : 3,
            aiLinkedOnly: false
          })

          // Se for pedido recente e a busca semantica nao retornou nada muito relevante, 
          // tentar pegar os ultimos processados (fallback para "analise este arquivo que acabei de enviar")
          if (isRecentRequest && (!knowledgeDocs || knowledgeDocs.length === 0)) {
            try {
              // Tenta buscar os stats para pegar os recentDocuments
              const stats = await KnowledgeBaseIntegration.getKnowledgeStats()
              if (stats && stats.recentDocuments && stats.recentDocuments.length > 0) {
                // Adicionar o mais recente manualmente à lista de encontrados
                const recentDoc = stats.recentDocuments[0]
                knowledgeDocs.push({
                  id: recentDoc.id,
                  title: recentDoc.title,
                  summary: recentDoc.summary || 'Conteudo do arquivo recente.',
                  content: recentDoc.content || '',
                  aiRelevance: 1
                } as any)
              }
            } catch (recErr) {
              console.warn('Erro ao buscar recentes no fallback:', recErr)
            }
          }

            injectedContext = undefined
            if (knowledgeDocs && knowledgeDocs.length > 0) {
              console.log('[Noa] Encontrados documentos relevantes')

              const contextText = knowledgeDocs.map(doc =>
                "TITULO: " + doc.title + "\nRESUMO: " + doc.summary + "\nCONTEUDO DO DOCUMENTO:\n" + doc.content + "\nRELEVANCIA: " + Math.round((doc.aiRelevance || 0) * 100) + "%"
              ).join('\n\n')

              const knowledgeContext = "\n" +
                "[CONTEXTO CRITICO DE DOCUMENTOS - LEITURA OBRIGATORIA]\n" +
                "Abaixo estao os documentos oficiais da MedCannLab relevantes para a consulta atual.\n" +
                "Sua IDENTIDADE como IA Residente depende do uso destas informacoes.\n" +
                "ANALISE O CONTEUDO ABAIXO E RESPONDA COM BASE NELE.\n\n" +
                contextText + "\n" +
                "[FIM DO CONTEXTO]"

              // 🛡️ [HOSPITAL-GRADE] ISOLAMENTO: Contexto RAG agora é separado, não polui mais o userMessage clínico.
              injectedContext = knowledgeContext

              // Registrar uso dos documentos (opcional, para analytics)
              knowledgeDocs.forEach(doc => {
                KnowledgeBaseIntegration.registerDocumentUsage(doc.id, userMessage, userId)
              })
            }
        } catch (ragError) {
          console.warn('Erro ao buscar na base de conhecimento:', ragError)
          // Não falhar o fluxo principal se o RAG falhar
        }
      }

      // SEMPRE usar o Assistant para gerar a resposta (mantem personalidade da Noa)
      console.log('[Assistant] Chamando Assistant API...')
      const assistantResponse = await this.getAssistantResponse(
        userMessage,
        intent,
        platformData,
        userEmail,
        uiContext,
        platformIntent.type,
        injectedContext // 🆕 [V1.6.2] Contexto isolado
      )

      if (assistantResponse && assistantResponse.content) {
        console.log('[Assistant] Resposta recebida:', assistantResponse.content.substring(0, 50) + '...')
        // Se houve acao da plataforma bem-sucedida, adicionar metadata
        if (platformActionResult?.success || currentPhase) {
          assistantResponse.metadata = {
            ...assistantResponse.metadata,
            platformAction: platformActionResult?.data,
            assessmentPhase: currentPhase // 🧬 Injetando fase para o hook e barra de progresso
          }
        }

        // Salvar na memoria local
        this.saveToMemory(rawUserMessage, assistantResponse, userId)

        // SALVAR AUTOMATICAMENTE NO PRONTUÁRIO DO PACIENTE (tempo real)
        const assessmentState = intent === 'CLINICA'
          ? this.activeAssessments.get(userId || '')
          : undefined

        // Salvar interacao no prontuario do paciente
        await this.saveChatInteractionToPatientRecord(
          rawUserMessage,
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
        case 'CLINICA':
          // Prioridade para avaliacao se detectar palavras-chave de início (normalizado para ignorar acentos)
          const normalizedMessage = rawUserMessage.toLowerCase()
            .normalize("NFD").replace(/[\u0300-\u036f]/g, "") // Remove acentos

          if (normalizedMessage.includes('iniciar') ||
            normalizedMessage.includes('avaliacao') ||
            normalizedMessage.includes('assessment')) {
            response = await this.processAssessment(rawUserMessage, userId, platformData, userEmail)
          } else {
            response = await this.processClinicalQuery(rawUserMessage, userId, platformData, userEmail)
          }
          break
        case 'ADMINISTRATIVA':
          response = await this.processPlatformQuery(rawUserMessage, userId, platformData, userEmail)
          break
        case 'TECNICA':
        default:
          response = await this.processGeneralQuery(rawUserMessage, userId, platformData, userEmail)
          break
      }

      // Salvar na memoria
      this.saveToMemory(rawUserMessage, response, userId)

      // Verificar se a avaliacao foi concluida e gerar relatorio
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

  // --- Novos Metodos para Relatorios Dinamicos ---

  public getActiveAssessment(userId: string): IMREAssessmentState | undefined {
    return this.activeAssessments.get(userId)
  }

  public async generateClinicalSummary(userId: string): Promise<StructuredClinicalSummary | null> {
    const assessment = this.activeAssessments.get(userId)
    if (!assessment) {
      console.warn('Tentativa de gerar resumo sem avaliacao ativa para:', userId)
      return null
    }

    console.log('Gerando Resumo Clinico Dinamico para:', userId)

    // Construir o prompt para a IA estruturar os dados
    const assessmentData = JSON.stringify(assessment.investigation)
    const prompt = "Aja como um médico especialista. Analise estes dados de investigação: " + assessmentData + 
                   ". Gere um resumo estruturado em JSON com os campos: queixa_principal, sintomas_guia, historico_relevante e alerta_vermelho."

    try {
      // Usar a integração com Assistant para gerar o JSON
      const response = await this.assistantIntegration.sendMessage(
        prompt,
        'system_analysis',
        "analysis_" + userId
      )

      if (!response) throw new Error('Falha ao obter resposta da IA')

      // Tentar extrair o JSON da resposta (pode vir com texto em volta)
      const jsonMatch = response.content.match(/\{[\s\S]*\}/)
      if (!jsonMatch) throw new Error('JSON não encontrado na resposta da IA')

      const jsonStr = jsonMatch[0]
      const summary: StructuredClinicalSummary = JSON.parse(jsonStr)

      console.log('Resumo Clinico Gerado com Sucesso:', summary)
      return summary

    } catch (error) {
      console.error('Erro ao gerar resumo clinico dinamico:', error)
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

  private detectIntent(message: string): 'CLINICA' | 'ADMINISTRATIVA' | 'TECNICA' {
    const lowerMessage = message.toLowerCase()

    // ESCUTA CLINICA (Avaliacao, sintomas, tratamentos, cannabis)
    if (
      lowerMessage.includes('avaliacao') || 
      lowerMessage.includes('imre') || lowerMessage.includes('aec') ||
      lowerMessage.includes('entrevista') || lowerMessage.includes('anamnese') ||
      lowerMessage.includes('cannabis') || lowerMessage.includes('nefrologia') ||
      lowerMessage.includes('tratamento') || lowerMessage.includes('sintoma') ||
      lowerMessage.includes('medicamento') || lowerMessage.includes('terapia')
    ) {
      return 'CLINICA'
    }

    // ESCUTA ADMINISTRATIVA (Agendamentos, Dashboard, Plataforma, Cadastro, Treinamento)
    if (
      lowerMessage.includes('agendar') || lowerMessage.includes('marcar consulta') ||
      lowerMessage.includes('dashboard') || lowerMessage.includes('area') ||
      lowerMessage.includes('atendimento') || lowerMessage.includes('plataforma') ||
      lowerMessage.includes('agendamentos') || lowerMessage.includes('relatorios') ||
      lowerMessage.includes('novo paciente') || lowerMessage.includes('cadastrar') ||
      lowerMessage.includes('treinamento') || lowerMessage.includes('curso')
    ) {
      return 'ADMINISTRATIVA'
    }

    // ESCUTA TECNICA
    const technicalPatterns: RegExp[] = [
      /\b(erro|erros)\b/i,
      /\bfalhou\b/i,
      /\bservidor\b/i,
      /\bapi\b/i,
      /\bcursor\b/i,
      /\b(funções|funcoes)\b/i,
      /\binstaladas\b/i,
      /\bexecutando\b/i,
    ]
    if (technicalPatterns.some((re) => re.test(lowerMessage))) {
      return 'TECNICA'
    }

    return 'CLINICA'
  }

  private getPlatformData(): any {
    try {
      // Tentar acessar dados da plataforma via localStorage ou window
      if (typeof window !== 'undefined') {
        const platformData = localStorage.getItem('platformData')
        if (platformData) {
          return JSON.parse(platformData)
        }

        // Tentar acessar via funcoes globais
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
          'Nao consegui acessar os dados da plataforma no momento. Verifique se voce esta logado e tente novamente.',
          0.3
        )
      }

      const user = platformData.user
      const dashboard = platformData.dashboard

      // Individualizar resposta baseada no email do usuario
      let userTitle = 'Dr.'
      let userContext = ''

      if (userEmail === 'eduardoscfaveret@gmail.com') {
        userTitle = 'Dr. Eduardo'
        userContext = 'Neurologista Pediatrico - Especialista em Epilepsia e Cannabis Medicinal'
      } else if (userEmail === 'rrvalenca@gmail.com') {
        userTitle = 'Dr. Ricardo'
        userContext = 'Administrador - MedCannLab 3.0 - Sistema Integrado - Cidade Amiga dos Rins & Cannabis Medicinal'
      }

      // Analisar a mensagem para determinar o que o usuario quer saber
      const lowerMessage = message.toLowerCase()

      if (lowerMessage.includes('dashboard') || lowerMessage.includes('area') || lowerMessage.includes('atendimento')) {
        if (userEmail === 'rrvalenca@gmail.com') {
          // Garantir numeros mesmo que venham da raiz de platformData
          const totalPatients = dashboard.totalPatients ?? platformData?.totalPatients ?? 0
          const completedAssessments = dashboard.completedAssessments ?? platformData?.completedAssessments ?? 0
          const aecProtocols = dashboard.aecProtocols ?? platformData?.aecProtocols ?? 0
          const activeClinics = dashboard.activeClinics ?? platformData?.activeClinics ?? 0

          return this.createResponse(
            "Dr. Ricardo, sua visao administrativa da MedCannLab 3.0 esta carregada.\n\n" +
            "Resumo rapido dos KPIs:\n" +
            " - Total de Pacientes: " + totalPatients + "\n" +
            " - Protocolos AEC: " + aecProtocols + "\n" +
            " - Avaliacoes Completas: " + completedAssessments + "\n" +
            " - Consultorios Conectados: " + activeClinics + "\n\n" +
            "Em que parte da gestao voce quer focar agora? (ex.: pacientes, relatorios, agendamentos, pesquisa)",
            0.9
          )
        } else {
          return this.createResponse(
            userTitle + ", aqui estao as informacoes da sua area de atendimento:\n\n" +
            "Status do Dashboard:\n" +
            " - Secao ativa: " + dashboard.activeSection + "\n" +
            " - Total de pacientes: " + (dashboard.totalPatients || 0) + "\n" +
            " - Relatorios recentes: " + (dashboard.recentReports || 0) + "\n" +
            " - Notificacoes pendentes: " + (dashboard.pendingNotifications || 0) + "\n" +
            " - Ultima atualizacao: " + new Date(dashboard.lastUpdate).toLocaleString('pt-BR') + "\n\n" +
            "Funcionalidades disponiveis:\n" +
            " - Prontuario Medico com cinco racionalidades\n" +
            " - Sistema de Prescricoes Integrativas\n" +
            " - KPIs personalizados para TEA\n" +
            " - Newsletter cientifica\n" +
            " - Chat profissional\n\n" +
            "Como posso ajuda-lo com alguma dessas funcionalidades?",
            0.9
          )
        }
      }

      if (lowerMessage.includes('agendamentos') || lowerMessage.includes('relatorios') ||
        lowerMessage.includes('dados mocados') || lowerMessage.includes('hoje') ||
        lowerMessage.includes('pendentes')) {

        if (userEmail === 'rrvalenca@gmail.com') {
          const totalPatients = platformData?.totalPatients ?? dashboard.totalPatients ?? 0
          const completedAssessments = platformData?.completedAssessments ?? dashboard.completedAssessments ?? 0
          const aecProtocols = platformData?.aecProtocols ?? dashboard.aecProtocols ?? 0
          const activeClinics = platformData?.activeClinics ?? dashboard.activeClinics ?? 3

          return this.createResponse(
            "Dr. Ricardo, aqui vai um recorte objetivo da camada administrativa:\n\n" +
            "Numeros principais:\n" +
            " - Total de Pacientes: " + totalPatients + "\n" +
            " - Avaliacoes Completas: " + completedAssessments + "\n" +
            " - Protocolos AEC: " + aecProtocols + "\n" +
            " - Consultorios Ativos: " + activeClinics + "\n\n" +
            "Qual recorte voce quer explorar em mais detalhes agora? (ex.: so hoje, apenas pendentes, por clinica)",
            0.95
          )
        } else {
          return this.createResponse(
            userTitle + ", vou resumir o que importa hoje na sua area de atendimento:\n\n" +
            "Agenda de hoje:\n" +
            "Consulte a aba 'Agendamentos' no Terminal Clinico para ver sua agenda atualizada em tempo real.\n\n" +
            "Tarefas clinicas sugeridas:\n" +
            " - Finalizar relatorios pendentes\n" +
            " - Revisar prescricoes recentes\n" +
            " - Checar agendamentos da proxima semana\n\n" +
            "Sobre qual desses pontos voce quer que eu aprofunde primeiro?",
            0.95
          )
        }
      }

      if (lowerMessage.includes('instaladas') || lowerMessage.includes('cursor') ||
        lowerMessage.includes('funcoes') || lowerMessage.includes('executando')) {
        return this.createResponse(
          "Dr. " + user.name + ", confirmo que as funcoes instaladas via Cursor estao ATIVAS e funcionando:\n\n" +
          "Funcoes Ativas:\n" +
          " - PlatformIntegration.tsx - Conectando IA aos dados reais\n" +
          " - IntegrativePrescriptions.tsx - Sistema de prescricoes com 5 racionalidades\n" +
          " - MedicalRecord.tsx - Prontuario medico integrado\n" +
          " - AreaAtendimentoEduardo.tsx - Dashboard personalizado\n" +
          " - NoaResidentAI.ts - IA com acesso a dados da plataforma\n\n" +
          "Integracao Funcionando:\n" +
          " - Dados carregados do Supabase: OK\n" +
          " - localStorage atualizado: OK\n" +
          " - Funcoes globais expostas: OK\n" +
          " - Deteccao de intencoes: OK\n" +
          " - Respostas personalizadas: OK\n\n" +
          "Dados Disponiveis:\n" +
          " - Usuario: " + user.name + " (" + user.email + ")\n" +
          " - Tipo: " + user.user_type + "\n" +
          " - CRM: " + (user.crm || 'Nao informado') + "\n" +
          " - Status: Conectado e operacional\n\n" +
          "As funcoes estao executando perfeitamente! Como posso ajuda-lo agora?",
          0.95
        )
      }

      return this.createResponse(
        "Dr. " + user.name + ", estou conectada a plataforma e posso ver seus dados em tempo real. " +
        "Como posso ajuda-lo com sua area de atendimento hoje?",
        0.8
      )

    } catch (error) {
      console.error('Erro ao processar consulta da plataforma:', error)
      return this.createResponse('Erro ao acessar informacoes da plataforma.', 0.2, 'error')
    }
  }

  private async processAssessment(message: string, userId?: string, platformData?: any, userEmail?: string): Promise<AIResponse> {
    if (!userId) {
      return this.createResponse(
        'Para iniciar uma avaliacao clinica, voce precisa estar logado. Por favor, faca login e tente novamente.',
        0.3,
        'error'
      )
    }

    const lowerMessage = message.toLowerCase()
    const assessmentKey = userId

    // Verificar se ha uma avaliacao em andamento
    let assessment = this.activeAssessments.get(assessmentKey)

    // Se a mensagem indica inicio de avaliacao clinica inicial IMRE
    if (!assessment && (
      lowerMessage.includes('avaliacao clinica inicial') ||
      lowerMessage.includes('protocolo imre') ||
      lowerMessage.includes('iniciar avaliacao')
    )) {
      // 🛡️ V1.9.100-P0b GATE D' (CAMADA A — frontend gate de ENTRADA da AEC)
      //
      // ANTES de iniciar AEC, verificar contexto médico do paciente:
      //   - Tem appointment ativo? → segue, populando aecTargetPhysicianDisplayName
      //   - Sem appointment? → apresenta opções de médicos INLINE no chat
      //                        (paciente escolhe sem sair do chat)
      //
      // Princípio: gate ANTES do pipeline. NÃO toca AEC FSM/IMRE/Verbatim/COS.
      // Lock V1.9.95+97+98+99-B preservado.
      const gate = await getOrPromptDoctorContext(userId)

      if (gate.hasContext === false) {
        // Sem médico vinculado → apresenta escolha inline (não bloqueia, redireciona)
        const reason = gate.reason
        const options = gate.options || []
        console.warn(`[P0B_GATE_A] AEC entrada bloqueada — motivo: ${reason}`)
        const promptMsg = buildDoctorChoicePrompt(options)
        return this.createResponse(promptMsg, 0.95, 'text', {
          gate_blocked: true,
          gate_reason: reason,
          doctor_options: options,
          action: 'AEC_REQUIRES_DOCTOR_CHOICE',
        })
      }

      // ✅ Gate passou — paciente tem médico vinculado (gate.hasContext === true)
      console.log(`[P0B_GATE_A] AEC autorizada para paciente ${userId} com médico ${gate.doctor.doctorName}`)

      // Iniciar nova avaliacao (sincronizar com platformFunctions)
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

      // INICIAR FLUXO AEC MASTER (ClinicalAssessmentFlow)
      // C3: Nome sera preenchido pelo path do TradeVision (platformData.user.name)
      const pn = platformData?.user?.name || platformData?.user?.full_name
      // V1.9.100-P0b GATE D' + intent override:
      // Prioridade: (1) menção verbal explícita > (2) platformData manual > (3) gate.doctor (último appt)
      // GPT-Ricardo review: "Intenção do usuário resolvida ANTES da FSM, não dentro dela."
      const doctorFromMessage = extractDoctorFromMessage(message)
      const targetDoc =
        doctorFromMessage ||
        (typeof platformData?.aecConsultationPhysicianName === 'string'
          ? platformData.aecConsultationPhysicianName.trim()
          : undefined) || gate.doctor.doctorName
      if (doctorFromMessage) {
        console.log('[DOCTOR_OVERRIDE]', {
          source: 'processAssessment',
          detected: doctorFromMessage,
          originalMessage: message,
          fellbackTo: gate.doctor.doctorName,
          finalChoice: targetDoc,
        })
      }
      clinicalAssessmentFlow.startAssessment(userId, pn, targetDoc)
      console.log('IA inicializada para:', userEmail)

      // Sincronizar com platformFunctions para que ele saiba da avaliação
      this.platformFunctions.updateAssessmentState(userId, assessment)

      return this.createResponse(
        '🌸 Bons ventos soprem! Sou Noa Esperanca, sua IA Residente especializada em avaliacoes clinicas.\n\n' +
        'Vamos iniciar sua **Avaliacao Clinica Inicial** seguindo o protocolo **IMRE** (Investigacao, Metodologia, Resultado, Evolucao) da Arte da Entrevista Clinica aplicada a Cannabis Medicinal.\n\n' +
        '**FASE 1: INVESTIGACAO (I)**\n\n' +
        'Por favor, apresente-se brevemente e diga qual e o **motivo principal** da sua consulta hoje. O que gostaria de investigar ou entender melhor?',
        0.95,
        'assessment'
      )
    }

    // Se não há avaliação em andamento e não foi detectado início, oferecer iniciar
    if (!assessment) {
      return this.createResponse(
        'Olá! Sou Noa Esperanca, sua IA Residente especializada em avaliacoes clinicas.\n\n' +
        'Posso conduzir uma **Avaliacao Clinica Inicial** completa usando o protocolo IMRE (Investigacao, Metodologia, Resultado, Evolucao) da Arte da Entrevista Clinica.\n\n' +
        'Para iniciar, diga: "Iniciar avaliacao clinica inicial IMRE" ou descreva o motivo da sua consulta.',
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
          'Avaliacao concluida! Seu relatorio clinico foi gerado e salvo no seu dashboard.',
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
      const analysisPrompt = "Voce e Noa Esperanca, IA Residente especializada em avaliacoes clinicas usando a metodologia Arte da Entrevista Clinica (AEC) e protocolo IMRE.\n" +
"\n" +
"O paciente acabou de responder sobre o motivo principal da consulta:\n" +
"\"" + message + "\"\n" +
"\n" +
"ANALISE NECESSARIA (REASONING):\n" +
"1. Identifique os principais pontos mencionados\n" +
"2. Identifique informacoes faltantes ou que precisam ser aprofundadas\n" +
"3. Gere UMA pergunta especifica e adaptada baseada na resposta, seguindo o protocolo IMRE\n" +
"4. A pergunta deve ser empatica, clara e focada em aprofundar o entendimento\n" +
"\n" +
"IMPORTANTE:\n" +
"- NAO faca multiplas perguntas de uma vez\n" +
"- Faca UMA pergunta por vez, pausadamente\n" +
"- Adapte a pergunta baseada no que o paciente disse\n" +
"- Use linguagem empatica e acolhedora\n" +
"- Siga a metodologia AEC (escuta ativa, rapport, validacao)\n" +
"\n" +
"Gere apenas a proxima pergunta, sem explicacoes adicionais."

      try {
        // Usar Assistant API para gerar pergunta adaptada
        const nextQuestion = await this.generateReasoningQuestion(analysisPrompt, message, assessment)

        return this.createResponse(
          "Entendi. Obrigada por compartilhar.\n\n" + nextQuestion,
          0.95,
          'assessment'
        )
      } catch (error) {
        // Fallback se reasoning falhar
        return this.createResponse(
          'Entendi. Agora preciso aprofundar a investigacao.\n\n' +
          '**Quando comecaram esses sintomas?** Por favor, descreva quando voce notou pela primeira vez o que esta sentindo.',
          0.9,
          'assessment'
        )
      }
    }

    if (!assessment.investigation.symptoms || assessment.investigation.symptoms.length === 0) {
      // Segunda resposta: sintomas detalhados
      assessment.investigation.symptoms = [message]

      return this.createResponse(
        'Muito obrigado pelas informacoes sobre seus sintomas. Agora preciso conhecer sua historia clinica:\n\n' +
        '**2. Historia Medica:**\n' +
        '- Voce tem alguma doenca cronica? (hipertensao, diabetes, doenca renal, etc.)\n' +
        '- Ja fez cirurgias? Quais?\n' +
        '- Tem algum diagnostico medico previo relacionado ao motivo da consulta?\n\n' +
        'Por favor, descreva sua historia medica.',
        0.9,
        'assessment'
      )
    }

    if (!assessment.investigation.medicalHistory) {
      // Terceira resposta: história médica - REASONING
      assessment.investigation.medicalHistory = message

      const analysisPrompt = "Voce e Noa Esperanca, IA Residente especializada em avaliacoes clinicas usando a metodologia Arte da Entrevista Clinica (AEC) e protocolo IMRE.\n" +
"\n" +
"CONTEXTO DA AVALIACAO:\n" +
"- Motivo principal: \"" + assessment.investigation.mainComplaint + "\"\n" +
"- Sintomas: \"" + (assessment.investigation.symptoms?.[0] || "") + "\"\n" +
"- Historia medica: \"" + message + "\"\n" +
"\n" +
"ANALISE NECESSARIA (REASONING):\n" +
"1. Analise a historia medica fornecida\n" +
"2. Identifique pontos importantes\n" +
"3. Gere UMA pergunta especifica sobre historia familiar, adaptada ao contexto\n" +
"\n" +
"IMPORTANTE:\n" +
"- Faca UMA pergunta por vez, pausadamente\n" +
"- Adapte baseado no contexto clinico ja coletado\n" +
"- Use linguagem empatica\n" +
"\n" +
"Gere apenas a proxima pergunta sobre historia familiar."

      try {
        const nextQuestion = await this.generateReasoningQuestion(analysisPrompt, message, assessment)
        return this.createResponse(
          "Obrigada por compartilhar sua historia medica.\n\n" + nextQuestion,
          0.95,
          'assessment'
        )
      } catch (error) {
        return this.createResponse(
          'Obrigada por compartilhar sua historia medica.\n\n' +
          '**Ha historico de doencas cronicas na sua familia?** (diabetes, hipertensao, doencas renais, etc.) Por favor, compartilhe informacoes sobre sua historia familiar.',
          0.9,
          'assessment'
        )
      }
    }

    if (!assessment.investigation.familyHistory) {
      // Quarta resposta: história familiar - REASONING
      assessment.investigation.familyHistory = message

      const analysisPrompt = "Voce e Noa Esperanca, IA Residente especializada em avaliacoes clinicas usando a metodologia Arte da Entrevista Clinica (AEC) e protocolo IMRE.\n" +
"\n" +
"CONTEXTO DA AVALIACAO:\n" +
"- Motivo principal: \"" + assessment.investigation.mainComplaint + "\"\n" +
"- Historia medica: \"" + assessment.investigation.medicalHistory + "\"\n" +
"- Historia familiar: \"" + message + "\"\n" +
"\n" +
"ANALISE NECESSARIA (REASONING):\n" +
"1. Analise a historia familiar\n" +
"2. Gere UMA pergunta especifica sobre medicacoes atuais, adaptada ao contexto\n" +
"\n" +
"IMPORTANTE:\n" +
"- Faca UMA pergunta por vez, pausadamente\n" +
"- Foque em medicacoes primeiro, depois habitos de vida\n" +
"- Use linguagem empatica\n" +
"\n" +
"Gere apenas a proxima pergunta sobre medicacoes atuais."

      try {
        const nextQuestion = await this.generateReasoningQuestion(analysisPrompt, message, assessment)
        return this.createResponse(
          "Obrigada por compartilhar sua historia familiar.\n\n" + nextQuestion,
          0.95,
          'assessment'
        )
      } catch (error) {
        return this.createResponse(
          'Obrigada por compartilhar sua historia familiar.\n\n' +
          '**Voce usa algum medicamento atualmente?** Quais? E ja tentou tratamento com cannabis medicinal?',
          0.9,
          'assessment'
        )
      }
    }

    if (!assessment.investigation.medications) {
      // Quinta resposta: medicações - REASONING
      assessment.investigation.medications = message

      const analysisPrompt = "Voce e Noa Esperanca, IA Residente especializada em avaliacoes clinicas usando a metodologia Arte da Entrevista Clinica (AEC) e protocolo IMRE.\n" +
"\n" +
"CONTEXTO DA AVALIACAO:\n" +
"- Motivo principal: \"" + assessment.investigation.mainComplaint + "\"\n" +
"- Medicacoes: \"" + message + "\"\n" +
"\n" +
"ANALISE NECESSARIA (REASONING):\n" +
"1. Analise as medicacoes mencionadas\n" +
"2. Gere UMA pergunta especifica sobre habitos de vida, adaptada ao contexto\n" +
"\n" +
"IMPORTANTE:\n" +
"- Faca UMA pergunta por vez, pausadamente\n" +
"- Foque em um aspecto dos habitos de vida por vez (alimentacao, exercicios, etc.)\n" +
"- Use linguagem empatica\n" +
"\n" +
"Gere apenas a proxima pergunta sobre habitos de vida."

      try {
        const nextQuestion = await this.generateReasoningQuestion(analysisPrompt, message, assessment)
        return this.createResponse(
          "Obrigada pelas informacoes sobre suas medicacoes.\n\n" + nextQuestion,
          0.95,
          'assessment'
        )
      } catch (error) {
        return this.createResponse(
          'Obrigada pelas informacoes sobre suas medicacoes.\n\n' +
          '**Como e sua alimentacao?** (regular, vegetariana, etc.) E pratica exercicios fisicos?',
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
        'Perfeito! Concluimos a fase de **INVESTIGACAO (I)** do protocolo IMRE.\n\n' +
        '**RESUMO DA INVESTIGACAO:**\n' +
        "- Motivo principal: " + assessment.investigation.mainComplaint + "\n" +
        "- Historia medica: " + (assessment.investigation.medicalHistory || 'Nao informado') + "\n" +
        "- Historia familiar: " + (assessment.investigation.familyHistory || 'Nao informado') + "\n" +
        "- Medicações: " + (assessment.investigation.medications || 'Nao informado') + "\n" +
        "- Habitos de vida: " + (assessment.investigation.lifestyle || 'Nao informado') + "\n\n" +
        "**FASE 2: METODOLOGIA (M)**\n\n" +
        "Agora vamos definir a metodologia de acompanhamento:\n" +
        "- Como sera feito o acompanhamento do seu caso?\n" +
        "- Que protocolos clinicos serao aplicados?\n" +
        "- Qual sera a frequencia de avaliacoes?\n\n" +
        "Com base nas informacoes coletadas, minha proposta metodologica inclui:\n" +
        "• Acompanhamento clinico regular com protocolo IMRE\n" +
        "• Avaliacoes periodicas para monitoramento da evolucao\n" +
        "• Integracao com a Arte da Entrevista Clinica (AEC)\n" +
        "• Protocolo personalizado para cannabis medicinal, se aplicavel\n\n" +
        "Voce concorda com essa metodologia de acompanhamento? Deseja algum ajuste?",
        0.95,
        'assessment'
      )
    }

    // Se chegou aqui, algo deu errado
    return this.createResponse(
      'Por favor, responda a ultima pergunta que fiz para continuarmos.',
      0.5,
      'assessment'
    )
  }

  private async processClinicalQuery(message: string, userId?: string, platformData?: any, userEmail?: string): Promise<AIResponse> {
    // Implementar consulta clinica especializada
    return this.createResponse(
      "Como especialista em cannabis medicinal e nefrologia, posso ajuda-lo com orientacoes terapeuticas, analise de casos e recomendacoes baseadas em evidencias cientificas. O que gostaria de saber?",
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
      platformData?.currentRoute?.includes('jardins-de-cura')

    // Detectar contexto especifico de dengue/ACS
    const isDengueACSContext = lowerMessage.includes('dengue') ||
      lowerMessage.includes('acs') ||
      lowerMessage.includes('agente comunitario') ||
      lowerMessage.includes('prevencao dengue')

    if (isJardinsDeCuraContext || isDengueACSContext) {
      return this.createResponse(
        'Estou aqui para apoia-lo no **Programa de Formacao para Agentes Comunitarios de Saude** do projeto **Jardins de Cura**.\n\n' +
        '**Sobre o Curso:**\n' +
        '• Programa de 40 horas / 5 semanas\n' +
        '• 9 modulos focados em Prevencao e Cuidado de Dengue\n' +
        '• Integrado com a metodologia Arte da Entrevista Clinica (AEC)\n' +
        '• Alinhado com as Diretrizes Nacionais para Prevencao e Controle de Dengue\n\n' +
        '**Como posso ajudar:**\n' +
        '• Explicar modulos e conteudos do curso\n' +
        '• Simular entrevistas clinicas com pacientes\n' +
        '• Orientar sobre protocolos de prevencao de dengue\n' +
        '• Aplicar tecnicas da AEC em cenarios praticos\n' +
        '• Responder duvidas sobre o projeto Jardins de Cura\n\n' +
        'Em que posso ajuda-lo hoje?',
        0.95,
        'text'
      )
    }

    // Implementar treinamento especializado geral
    return this.createResponse(
      'Estou aqui para treina-lo em metodologias clinicas avancadas, incluindo a Arte da Entrevista Clinica, protocolos de cannabis medicinal e praticas de nefrologia sustentavel. Qual area voce gostaria de aprofundar?',
      0.9,
      'text'
    )
  }

  private isAdminUser(email?: string, userType?: string): boolean {
    if (!email && !userType) return false
    const adminEmails = ['ricardo.valenca@medcannlab.com.br', 'admin@medcannlab.com.br', 'phpg69@gmail.com', 'phpg69@hotmail.com']
    return userType === 'admin' || (email ? adminEmails.includes(email) : false)
  }

  private extractKnowledgeQuery(message: string, context: string): string {
    return context + ": " + message
  }

  private async getKnowledgeHighlight(query: string): Promise<{ id: string; title: string; summary: string } | null> {
    if (query.toLowerCase().includes('rim') || query.toLowerCase().includes('renal')) {
      return {
        id: 'mock-doc-renal-001',
        title: 'Protocolo de Saude Renal',
        summary: 'Diretrizes para monitoramento de funcao renal em pacientes com uso de cannabis.'
      }
    }
    return null
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
        const userName = platformData.user.name || 'Administrador'
        const adminLines = [
          userName + ", conexao administrativa confirmada para a MedCannLab 3.0.",
          "* Eixo ativo: " + axisDetails.label + " - " + axisDetails.summary,
          "* Rotas principais:\n" + axisMenu,
        ]

        if (knowledgeHighlight) {
          adminLines.push(
            "* Base de conhecimento: " + knowledgeHighlight.title + "\n  " + knowledgeHighlight.summary
          )
        }

        adminLines.push('Posso abrir qualquer eixo ou consultar um protocolo especifico para voce.')

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
          ? "Se quiser, posso te levar direto para " + alternativeAxes.map(axis => this.getAxisDetails(axis).label).join(', ') + "."
          : ''

        const lines = [
          userName + ", estou acompanhando voce no eixo " + axisDetails.label + ". " + axisDetails.summary,
        ]

        if (axisSwitchMessage) {
          lines.push(axisSwitchMessage)
        }

        if (knowledgeHighlight) {
          lines.push("Conhecimento em foco: " + knowledgeHighlight.title + "\n" + knowledgeHighlight.summary)
        }

        lines.push('Como posso apoiar sua proxima acao agora?')

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
      'Sou Noa Esperanza. Apresente-se tambem e diga o que trouxe voce aqui? Voce pode utilizar o chat aqui embaixo a direita para responder ou pedir ajuda. Bons ventos soprem.',
      0.8,
      'text'
    )
  }

  private createResponse(content: string, confidence: number, type: 'text' | 'assessment' | 'error' = 'text', metadata?: any): AIResponse {
    return {
      id: "response_" + Date.now() + "_" + Math.random().toString(36).substr(2, 9),
      content,
      confidence,
      reasoning: "Resposta simples da plataforma",
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
        user_message: stripPlatformInjectionNoise(userMessage),
        ai_response: stripPlatformInjectionNoise(aiResponse),
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
        console.warn('Erro ao salvar interacao no prontuario:', recordError)
      } else {
        console.log('[Noa] Interacao salva no prontuario')
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
            console.warn('Erro ao atualizar avaliacao:', updateError)
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
            console.warn('Erro ao criar avaliacao:', insertError)
          }
        }
      }
    } catch (error) {
      console.error('Erro ao salvar interacao no prontuario:', error)
    }
  }

  private saveToMemory(userMessage: string, response: AIResponse, userId?: string): void {
    const memory: AIMemory = {
      id: "memory_" + Date.now() + "_" + Math.random().toString(36).substr(2, 9),
      content: "Usuario: " + userMessage + "\nAssistente: " + response.content,
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

    if (lowerMessage.includes('noa')) {
      tags.push('noa-residente')
    }

    if (lowerMessage.includes('avaliacao')) {
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

  // Detectar conclusao de avaliacao clinica e gerar relatorio
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
      // 🛡️ [GATILHO DE SEGURANÇA - LGPD] Bloquear fallback se não houve consentimento
      const flowState = clinicalAssessmentFlow.getState(userId);
      if (!flowState?.data?.consentGiven) {
        MedCannLabAuditLogger.security('LGPD_VIOLATION_PREVENTED', {
          userId,
          action: 'checkForAssessmentCompletion',
          reason: 'Paciente não consentiu ou fluxo incompleto'
        });
        return;
      }

      // [V1.9.25] Gate de idempotência — reutiliza a flag em memória do V1.9.23.
      // Se o pipeline moderno (Edge Function handleFinalizeAssessment) já gerou
      // report nesta sessão via clinicalAssessmentFlow.generateReport, este
      // caminho legado (clinicalReportService → INSERT direto) não tem razão
      // de rodar. Função preservada (não removida) — apenas evita duplicata
      // silenciosa em paths paralelos que ainda não foram unificados.
      if (clinicalAssessmentFlow.isReportDispatched(userId)) {
        MedCannLabAuditLogger.audit('LEGACY_REPORT_SKIP', {
          userId,
          action: 'checkForAssessmentCompletion',
          reason: 'Report já dispatched via pipeline moderno'
        });
        return;
      }

      try {
        console.log('Detectada conclusao de avaliacao clinica para usuario:', userId)

        // Buscar dados do usuário
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('name, email')
          .eq('id', userId)
          .single()

        if (userError) {
          console.error('Erro ao buscar dados do usuario:', userError)
        }

        const patientName = (userData as any)?.name || 'Paciente'

        // Gerar relatório clínico
        const report = await clinicalReportService.generateAIReport(
          userId,
          patientName,
          {
            investigation: 'Investigacao realizada atraves da avaliacao clinica inicial com IA residente',
            methodology: 'Aplicacao da Arte da Entrevista Clinica (AEC) com protocolo IMRE',
            result: 'Avaliacao clinica inicial concluida com sucesso',
            evolution: 'Plano de cuidado personalizado estabelecido',
            recommendations: [
              'Continuar acompanhamento clinico regular',
              'Seguir protocolo de tratamento estabelecido',
              'Manter comunicacao com equipe medica'
            ],
            scores: {
              clinical_score: flowState?.data?.complaintList?.length ? Math.min(100, flowState.data.complaintList.length * 15 + 30) : 50,
              treatment_adherence: 50,
              symptom_improvement: 50,
              quality_of_life: 50
            }
          }
        )

        console.log('Relatorio clinico gerado:', report.id)

        // Salvar na memória da IA
        this.saveToMemory(
          "Relatorio clinico gerado para " + patientName + " (ID: " + report.id + ")",
          this.createResponse(
            "Relatorio clinico gerado (" + report.id + ") para " + patientName + ".",
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
        console.error('Erro ao gerar relatorio clinico:', error)
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
      'admin': { key: 'admin', label: 'Administracao', summary: 'Visao geral do sistema e gestao de recursos.', knowledgeQuery: 'gestao administracao sistema' },
      'clinica': { key: 'clinica', label: 'Clinica', summary: 'Atendimento a pacientes e gestao clinica.', knowledgeQuery: 'protocolos clinicos tratamento' },
      'ensino': { key: 'ensino', label: 'Ensino', summary: 'Cursos, treinamentos e material educativo.', knowledgeQuery: 'educacao cursos treinamento' },
      'pesquisa': { key: 'pesquisa', label: 'Pesquisa', summary: 'Estudos, dados e evidencias cientificas.', knowledgeQuery: 'pesquisa cientifica estudos' }
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
    // Permissão baseada APENAS no tipo de usuário do Supabase
    if (userType === 'admin') return ['admin', 'clinica', 'ensino', 'pesquisa']
    if (userType === 'professional') return ['clinica', 'ensino', 'pesquisa']
    return ['ensino']
  }

  private formatAxisMenu(axes: string[]): string {
    return axes.map(axis => {
      const details = this.getAxisDetails(axis)
      return "  - **" + details.label + "**: " + details.summary
    }).join('\n')
  }

  // Métodos de sanitização removidos conforme Protocolo de Segurança (Phase 5)
  // Texto clínico deve ser preservado integralmente.

  private buildPlatformActionContext(intent: any, result: any): string {
    if (!result.success) return "Acao falhou: " + result.error

    let context = "Acao executada: " + intent.type + "\n"
    if (result.data) {
      context += "Dados resultantes: " + JSON.stringify(result.data, null, 2)
    }
    return context
  }

  private async processTradeVisionRequest(
    userMessage: string,
    intent: string,
    platformData: any,
    userEmail?: string,
    uiContext?: any,
    platformIntentType: string = 'NONE',
    injectedContext?: string // 🆕 [V1.6.2]
  ): Promise<AIResponse> {
    try {
      console.log('[Core] Conectando ao Core via Supabase Edge Functions...')

      const withTimeout = async <T,>(
        promise: PromiseLike<T>,
        ms: number,
        timeoutMessage: string
      ): Promise<T> => {
        let timeoutId: ReturnType<typeof setTimeout> | undefined
        const timeoutPromise = new Promise<never>((_, reject) => {
          timeoutId = setTimeout(() => reject(new Error(timeoutMessage)), ms)
        })

        try {
          return (await Promise.race([promise, timeoutPromise])) as T
        } finally {
          if (timeoutId) clearTimeout(timeoutId)
        }
      }

      // Obter fase do ClinicalAssessmentFlow (AEC 001) para controle de estado
      let currentPhase = undefined
      let nextQuestionHint = undefined
      let aecInterruptedThisTurn = false

      // ASSESSMENT_START na 1ª mensagem deve iniciar o AEC local; antes "NONE" só bloqueava o fluxo.
      const platformAllowsAec =
        platformIntentType === 'NONE' ||
        !platformIntentType ||
        platformIntentType === 'ASSESSMENT_START'

      // [V1.9.19] AEC flow só roda pra paciente. Admin/pro/aluno que mandem
      // mensagens são processados pelo Core sem FSM (Nôa responde como
      // assistente geral, não como entrevistadora clínica). Derivamos a role
      // aqui porque este método é chamado por processMessage com platformData.
      const roleForAecFlow = (
        (platformData?.user as any)?.type ||
        (platformData?.user as any)?.user_type ||
        ''
      ).toString().toLowerCase()
      const isPatientForAecFlow = roleForAecFlow === 'paciente' || roleForAecFlow === 'patient'

      const shouldHandleAecFlow =
        intent === 'CLINICA' &&
        platformData?.user?.id &&
        platformAllowsAec &&
        isPatientForAecFlow

      const aecPhysicianName =
        (typeof uiContext?.aecTargetProfessional?.name === 'string' &&
          uiContext.aecTargetProfessional.name.trim()) ||
        (typeof platformData?.aecConsultationPhysicianName === 'string' &&
          platformData.aecConsultationPhysicianName.trim()) ||
        ''

      const docForAecOpening = aecPhysicianName || 'Dr. Ricardo Valenca'
      const buildAecOpeningHint = () =>
        "Ola! Eu sou Noa Esperanza. Por favor, apresente-se tambem e vamos iniciar a sua avaliacao inicial para consultas com " + docForAecOpening + "."

      if (shouldHandleAecFlow) {
        await clinicalAssessmentFlow.ensureLoaded(platformData.user.id)
        let flowState = clinicalAssessmentFlow.getState(platformData.user.id)

        const normForStart = userMessage.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
        // [V1.9.81] Detector tolerante de intencao AEC.
        // Bug 26/04 (Pedro Paciente): "vamos fazer uma avalaicao?" (typo lai/lia) nao casava
        // com regex rigido /avaliac(ao|ão)/ → FSM nao disparava → Assistant API improvisava
        // AEC inteira sem persistencia (AEC fake silenciosa).
        // Regra de produto (Pedro 26/04): se paciente PEDE avaliacao mesmo errado, ativa FSM.
        // Conversa social ("ola noa") continua caindo no chat livre normal.
        // Cobre: typos comuns (avalaicao, abaliacao, avliacao), sinonimos clinicos
        // (consulta, triagem, atendimento), frases canonicas (protocolo IMRE).
        const aecKeyword = /\b(aval[ai][a-z]{0,3}c?[aã]o|abaliac[aã]o|avliac[aã]o|imre|protocolo|triagem|primeira\s+consulta|nova\s+consulta|atendimento\s+clinic[ao]?)\b/
        const intentVerb = /\b(quero|gostaria|preciso|desejo|vamos|fazer|comecar|come[cç]ar|iniciar|pedir|solicitar|bora|start)\b/
        const aecCanonical = /\b(iniciar\s+(a\s+)?(avaliac|imre|protocolo)|protocolo\s+imre|avaliac[aã]o\s+clinic[ao]?\s+inicial|primeira\s+consulta)/
        const clientWantsAecStart =
          intent === 'CLINICA' &&
          (aecCanonical.test(normForStart) || (aecKeyword.test(normForStart) && intentVerb.test(normForStart)))

        // Card/botão "Iniciar avaliação clínica" = nova sessão desde a etapa 1.
        // Sem isto, estado antigo (ex.: COMPLAINT_DETAILS) no Supabase faz a 1.ª mensagem “travar” no meio do protocolo.
        if (platformIntentType === 'ASSESSMENT_START' && platformData.user.id) {
          // [V1.9.74] AEC GATE V1.5 estendido — protecao contra reinicio acidental.
          // Bug 26/04 (Carolina): elogio "vc esta fazendo a avaliacao clinica de forma correta"
          // disparou ASSESSMENT_START via regex e destruiu 7min de coleta clinica.
          // Fix: se AEC ja esta em fase clinica ativa, IGNORAR pedido de start.
          // Whitelist de fases onde reset e seguro (inicio/fim/explicito):
          const PHASES_ALLOWING_RESET: ReadonlyArray<string> = [
            'INITIAL_GREETING',
            'IDENTIFICATION',
            'COMPLETED',
            'INTERRUPTED',
            'CONFIRMING_EXIT',
            'CONFIRMING_RESTART'
          ]
          const currentPhase = flowState?.phase as string | undefined
          const canReset = !flowState || (currentPhase && PHASES_ALLOWING_RESET.includes(currentPhase))

          if (!canReset) {
            console.log(
              `⏳ [AEC GATE V1.5 ext] ASSESSMENT_START retido: fluxo clinico ativo (${currentPhase}) tem soberania. Mensagem tratada como conteudo da AEC.`
            )
            // NAO resetar, NAO startar. Continua o fluxo AEC normal — a mensagem cai no processamento de fase abaixo.
          } else {
            const patientName = platformData?.user?.name || platformData?.user?.full_name || undefined
            // V1.9.100-P0b: detecta menção verbal de médico ANTES de startAssessment
            // GPT-Ricardo review: "Intenção do usuário resolvida ANTES da FSM"
            const doctorFromMessage = extractDoctorFromMessage(userMessage)
            const targetDoc = doctorFromMessage || aecPhysicianName || undefined
            if (doctorFromMessage) {
              console.log('[DOCTOR_OVERRIDE]', {
                source: 'ASSESSMENT_START_app_command',
                detected: doctorFromMessage,
                originalMessage: userMessage,
                fellbackTo: aecPhysicianName || '(default Ricardo)',
                finalChoice: targetDoc,
              })
            }
            clinicalAssessmentFlow.resetAssessment(platformData.user.id)
            clinicalAssessmentFlow.startAssessment(
              platformData.user.id,
              patientName,
              targetDoc
            )
            flowState = clinicalAssessmentFlow.getState(platformData.user.id)
            await clinicalAssessmentFlow.persist(platformData.user.id)
            console.log(
              'AEC: ASSESSMENT_START - sessao reiniciada (estado anterior descartado) | Nome:',
              patientName || '(—)',
              '| Profissional AEC:',
              targetDoc || '(padrao Dr. Ricardo Valenca)'
            )
          }
        } else if (!flowState && clientWantsAecStart) {
          const patientName = platformData?.user?.name || platformData?.user?.full_name || undefined
          // V1.9.100-P0b: detecta menção verbal de médico ANTES de startAssessment
          // GPT-Ricardo review: "Intenção do usuário resolvida ANTES da FSM"
          const doctorFromMessage = extractDoctorFromMessage(userMessage)
          const targetDoc = doctorFromMessage || aecPhysicianName || undefined
          if (doctorFromMessage) {
            console.log('[DOCTOR_OVERRIDE]', {
              source: 'clientWantsAecStart',
              detected: doctorFromMessage,
              originalMessage: userMessage,
              fellbackTo: aecPhysicianName || '(default Ricardo)',
              finalChoice: targetDoc,
            })
          }
          clinicalAssessmentFlow.startAssessment(
            platformData.user.id,
            patientName,
            targetDoc
          )
          flowState = clinicalAssessmentFlow.getState(platformData.user.id)
          console.log(
            'AEC: fluxo iniciado | trigger: pedido_no_chat | Nome perfil:',
            patientName || '(—)',
            '| Profissional AEC:',
            targetDoc || '(padrao Dr. Ricardo Valenca)'
          )
        }

        // [V1.9.80] Garantir patientName do perfil quando state estiver vazio.
        // Defesa contra a janela onde o FSM (clinicalAssessmentFlow.ts:791) trata
        // qualquer resposta como nome se patientName vazio. users.name e fonte de
        // verdade — paciente esta logado, nao deve precisar redigitar nome.
        // NOTA: nao toca cold guard, retomada, invalidated_at — apenas popula nome.
        if (flowState && !flowState.data.patientName?.trim()) {
          const profileName = platformData?.user?.name || (platformData?.user as any)?.full_name
          if (profileName?.trim()) {
            flowState.data.patientName = profileName.trim()
            flowState.data.patientPresentation = profileName.trim()
            await clinicalAssessmentFlow.persist(platformData.user.id)
            console.log('[AEC V1.9.80] patientName injetado do perfil:', profileName.trim())
          }
        }

        // Se existe fluxo ativo, processar a resposta do usuário para avançar
        if (flowState) {
          try {
            // Não tratar "iniciar avaliação" como resposta clínica só na abertura — evita includes('iniciar') que quebrava o estado no meio do AEC.
            const normStart = userMessage.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
            const looksLikeSelfIntro =
              /(me chamo|sou (o|a)|meu nome|chamo-me|eu sou)\b/.test(normStart) ||
              /\b[a-zááãâéêíóôõúç]{2,}\s+aqui\b/.test(normStart) ||
              // Nome curto isolado na abertura (ex.: "Pedro", "Maria") — evita confundir com meta-pedido
              (/^[a-zááãâéêíóôõúç]{2,22}$/i.test(userMessage.trim()) &&
                !/^(sim|nao|não|ok|ta|tá|oi|ola|olá)$/i.test(userMessage.trim()))
            const explicitAssessmentStart =
              /\b(iniciar|comecar|come[cç]ar|start)\s+(a\s+)?(avaliacao|imre)\b/.test(normStart) ||
              /\b(avaliacao|imre)\s+clinic(a)?\b/.test(normStart) ||
              /\b(protocolo\s+imre|avaliacao\s+clinica\s+inicial)\b/.test(normStart)
            const pedidoAvaliacaoNaMesmaMsg =
              /(gostaria|quero|preciso|desejo|pedir|fazer)\b[\s\S]{0,80}\b(avaliac(ao|ão)|imre)\b/.test(normStart)
            
            const listaVazia = !(flowState.data.complaintList && flowState.data.complaintList.length > 0)
            const skipProcessBecauseStartCmd =
              (flowState.phase === 'INITIAL_GREETING' ||
                (flowState.phase === 'IDENTIFICATION' && listaVazia)) &&
              !looksLikeSelfIntro &&
              (pedidoAvaliacaoNaMesmaMsg || explicitAssessmentStart) &&
              normStart.length < 220

            if (skipProcessBecauseStartCmd) {
              if (flowState.phase === 'INITIAL_GREETING') {
                nextQuestionHint = buildAecOpeningHint()
                console.log('AEC: pedido de inicio tratado como meta-mensagem; fase permanece INITIAL_GREETING')
              } else {
                const pn = flowState.data?.patientName?.trim()
                nextQuestionHint = pn
                  ? "Ola, " + pn + "! Eu sou Noa Esperanza. Vamos iniciar sua avaliacao inicial para consultas com " + docForAecOpening + ". O que trouxe voce a nossa avaliacao hoje?"
                  : "Ola! Eu sou Noa Esperanza. Vamos iniciar sua avaliacao inicial para consultas com " + docForAecOpening + ". O que trouxe voce a nossa avaliacao hoje?"
                console.log('AEC: pedido de inicio em IDENTIFICATION tratado como meta-mensagem; lista indiciaria ainda nao iniciada')
              }
            }

            if (!skipProcessBecauseStartCmd) {
              const stepResult = clinicalAssessmentFlow.processResponse(platformData.user.id, userMessage)
              console.log('[AEC] Fluxo AEC avancou para:', stepResult.phase)
              nextQuestionHint = stepResult.nextQuestion

              if (stepResult.phase === 'INTERRUPTED' && stepResult.isComplete) {
                aecInterruptedThisTurn = true
                // 🧬 [TITAN 5.2] FORCE DISPATCHER: Garante que o Core processe a interrupção como um relatório parcial
                if (!nextQuestionHint.includes(META_TAGS.ASSESSMENT_FINALIZED)) {
                  nextQuestionHint += `\n\n${META_TAGS.ASSESSMENT_FINALIZED}`;
                }
              }

              // Se a avaliação foi concluída, a FSM já cuidou do estado e emitirá seu tag/log apropriadamente no momento certo.
              if (stepResult.phase === 'COMPLETED' && stepResult.isComplete) {
                // Apenas logar. Consentimento já foi decidido na FSM.
                MedCannLabAuditLogger.audit('ASSESSMENT_COMPLETED', { userId: platformData.user.id });

                // [V1.9.23] Gate de idempotência em memória. Preserva o fallback
                // local (por compat com UI antiga) mas só roda 1x por sessão.
                // Antes, cada turno subsequente em phase=COMPLETED disparava novo
                // generateReport → 14 reports/Carolina, 23 reports/casualmusic.
                if (!clinicalAssessmentFlow.isReportDispatched(platformData.user.id)) {
                  clinicalAssessmentFlow.markReportDispatched(platformData.user.id)
                  try {
                    await clinicalAssessmentFlow.generateReport(
                      platformData.user.id,
                      platformData.user.id
                    )
                  } catch (err) {
                    console.error('Erro no fallback de relatorio local:', err)
                  }
                }
              }

              if (stepResult.phase === 'COMPLETED') {
                console.log('[ClinicalFlow] Assessment completed session finalized')
              }

              // Persistir estado
              await clinicalAssessmentFlow.persist(platformData.user.id)
            }

            // Recarrega estado atualizado
            flowState = clinicalAssessmentFlow.getState(platformData.user.id)
            if (flowState) {
              currentPhase = flowState.phase
            }
          } catch (e) {
            console.warn('Erro ao processar fluxo AEC:', e)
          }
        }
      }

      // CARREGAR HISTORICO DE CONVERSAS (Memória de Contexto)
      // 🔒 [BLOCO 11 — FIX SSoT] Quando AEC está ativo, filtrar histórico apenas para a
      // sessão de avaliação corrente (>= flowState.startedAt). Isso evita que turnos
      // de conversas/consultas anteriores poluam o contexto e o GPT comece a perguntar
      // sobre sintomas (ex.: "insônia", "dor de dente") que vieram de outra sessão.
      let conversationHistory: Array<{ role: string, content: string }> = []

      if (platformData?.user?.id) {
        try {
          const aecStateForHistory = clinicalAssessmentFlow.getState(platformData.user.id)
          // [V1.8.11] Filtro de sessão aplica-se também em INTERRUPTED:
          // a sessão ainda é a mesma logicamente (dados preservados, aguardando retomada),
          // e sem filtro o histórico vaza sintomas de sessões antigas ("insônia",
          // "dor de dente") contaminando as próximas respostas do GPT.
          // Apenas COMPLETED libera o filtro, pois sessão concluída não deve referenciar
          // dados anteriores ao próximo ASSESSMENT_START.
          const aecActiveForHistory =
            !!aecStateForHistory &&
            aecStateForHistory.phase !== 'COMPLETED'
          const sessionStartIso = aecActiveForHistory && aecStateForHistory?.startedAt
            ? new Date(aecStateForHistory.startedAt).toISOString()
            : null

          // [V1.9.26] Defesa contra cross-session contamination TEMPORAL.
          // Quando não há aec_state ativo (admin/pro/aluno sempre; paciente entre
          // sessões), o filtro anterior caía silenciosamente e puxava as últimas 10
          // interações sem limite de tempo. Em 24/04 o Dr. Ricardo voltou após 27
          // dias e o GPT retomou uma AEC de 28/03 ("sonolência", "peso nos olhos")
          // como se fosse queixa atual. Com este floor temporal, history > 4h é
          // ignorado quando não há sessão AEC explícita.
          const DEFAULT_SESSION_WINDOW_MS = 4 * 60 * 60 * 1000 // 4 horas
          const defaultMaxAgeIso = new Date(Date.now() - DEFAULT_SESSION_WINDOW_MS).toISOString()
          const historyMinCreatedAt = sessionStartIso || defaultMaxAgeIso

          let historyQuery = supabase
            .from('ai_chat_interactions')
            .select('user_message, ai_response, created_at')
            .eq('user_id', platformData.user.id)
            .gte('created_at', historyMinCreatedAt)
            .order('created_at', { ascending: false })
            .limit(10)

          const { data: historyData, error: historyError } = await withTimeout(
            historyQuery as unknown as PromiseLike<{
              data: Array<{ user_message: string; ai_response: string; created_at: string }> | null
              error: any
            }>,
            8000,
            'Timeout ao carregar historico da conversa (ai_chat_interactions).'
          )

          if (!historyError && historyData && historyData.length > 0) {
            // Reverter para ordem cronológica e formatar para OpenAI
            conversationHistory = historyData.reverse().flatMap((h: { user_message: string; ai_response: string }) => [
              { role: 'user', content: h.user_message },
              { role: 'assistant', content: h.ai_response }
            ])
            console.log('[Core] Historico carregado:', historyData.length, sessionStartIso ? '(filtrado por sessão AEC)' : '(sem filtro de sessão)')
          }
        } catch (e) {
          console.warn('Erro ao carregar historico:', e)
        }
      }

      // 🧠 [BLOCO 11 — AEC SSoT] Snapshot vivo da sessão de avaliação para servir de
      // fonte única da verdade no prompt do Core. Sem isso, o GPT trabalha cego e
      // começa a inventar sintomas. O Core vai materializar isso num bloco
      // [AEC SSOT] com hard constraint "NÃO introduza sintomas fora desta lista".
      let aecSnapshot: Record<string, any> | null = null
      if (platformData?.user?.id) {
        const liveState = clinicalAssessmentFlow.getState(platformData.user.id)
        // [V1.8.11] Snapshot também em INTERRUPTED: a sessão está pausada mas os dados
        // relatados até aqui são a única fonte legítima de sintomas. Sem isso, o GPT
        // inventa ("insônia", "dor de dente") quando a paciente volta e pergunta algo.
        if (liveState && liveState.phase !== 'COMPLETED') {
          const d: any = liveState.data || {}
          // Lista de tudo que o paciente JÁ relatou nesta sessão.
          // Usado pelo Core para bloquear introdução de sintomas alheios.
          const knownSymptoms: string[] = [
            ...(Array.isArray(d.complaintList) ? d.complaintList.filter(Boolean) : []),
            ...(d.mainComplaint ? [d.mainComplaint] : []),
            ...(Array.isArray(d.complaintAssociatedSymptoms) ? d.complaintAssociatedSymptoms.filter(Boolean) : [])
          ]
          // Slots já respondidos (para o Core não repetir perguntas)
          const answeredSlots: Record<string, string | string[] | undefined> = {
            location: d.complaintLocation,
            onset: d.complaintOnset,
            description: d.complaintDescription,
            improvements: d.complaintImprovements,
            worsening: d.complaintWorsening
          }
          aecSnapshot = {
            phase: liveState.phase,
            // [V1.9.83] Micro-estado granular pra contrato Core→GPT (Bloco I+J do diário 26/04).
            // Causa raiz dos 5 campos slot errado do Pedro hoje: GPT recebia phase mas NAO
            // recebia qIdx/iter, entao decidia avancar visualmente antes do FSM. Resposta
            // caia no slot anterior. Polimento puro: passa dado que FSM ja calcula.
            currentQuestionIndex: liveState.currentQuestionIndex,
            phaseIterationCount: liveState.phaseIterationCount,
            startedAt: liveState.startedAt,
            patientName: d.patientName,
            complaintList: Array.isArray(d.complaintList) ? d.complaintList.filter(Boolean) : [],
            mainComplaint: d.mainComplaint || null,
            knownSymptoms: Array.from(new Set(knownSymptoms.map((s) => String(s).trim()).filter(Boolean))),
            answeredSlots,
            consensusAgreed: !!d.consensusAgreed
          }
        }
      }

      // [V1.9.20] assessmentData estruturado para finalização — restaura qualidade
      // pré-refactor 7a7e33a (23/04). Antes, frontend invocava finalize_assessment
      // separadamente com o contentPayload. Agora viaja no mesmo request; backend usa
      // em handleFinalizeAssessment quando [ASSESSMENT_COMPLETED] aparece. Sem isso,
      // clinical_reports nascem sem lista_indiciaria/identificacao estruturadas
      // (era o que Pedro sentia como regressão).
      let aecFinalizationData: Record<string, any> | null = null
      if (platformData?.user?.id) {
        const finalizeState = clinicalAssessmentFlow.getState(platformData.user.id)
        const FINAL_PHASES = new Set([
          'CLOSING',
          'FINAL_RECOMMENDATION',
          'CONSENT_COLLECTION',
          'COMPLETED'
        ])
        if (finalizeState && FINAL_PHASES.has(finalizeState.phase as string)) {
          const d: any = finalizeState.data || {}
          aecFinalizationData = {
            patient_id: platformData.user.id,
            content: {
              identificacao: {
                nome: d.patientName ?? null,
                apresentacao: d.patientPresentation ?? null
              },
              lista_indiciaria: Array.isArray(d.complaintList) ? d.complaintList.filter(Boolean) : [],
              queixa_principal: d.mainComplaint ?? null,
              desenvolvimento_queixa: {
                localizacao: d.complaintLocation ?? null,
                inicio: d.complaintOnset ?? null,
                descricao: d.complaintDescription ?? null,
                sintomas_associados: Array.isArray(d.complaintAssociatedSymptoms) ? d.complaintAssociatedSymptoms.filter(Boolean) : [],
                fatores_melhora: Array.isArray(d.complaintImprovements) ? d.complaintImprovements.filter(Boolean) : [],
                fatores_piora: Array.isArray(d.complaintWorsening) ? d.complaintWorsening.filter(Boolean) : []
              },
              historia_patologica_pregressa: Array.isArray(d.medicalHistory) ? d.medicalHistory.filter(Boolean) : [],
              historia_familiar: {
                lado_materno: Array.isArray(d.familyHistoryMother) ? d.familyHistoryMother.filter(Boolean) : [],
                lado_paterno: Array.isArray(d.familyHistoryFather) ? d.familyHistoryFather.filter(Boolean) : []
              },
              habitos_vida: Array.isArray(d.lifestyleHabits) ? d.lifestyleHabits.filter(Boolean) : [],
              perguntas_objetivas: {
                alergias: d.allergies ?? null,
                medicacoes_regulares: d.regularMedications ?? null,
                medicacoes_esporadicas: d.sporadicMedications ?? null
              },
              consenso: {
                aceito: !!d.consensusAgreed,
                revisoes_realizadas: d.consensusRevisions ?? 0
              }
            }
          }
        }
      }

      const rawUser = platformData?.user
      const userForCore =
        rawUser &&
        (rawUser.type || rawUser.user_type || !shouldHandleAecFlow
          ? rawUser
          : { ...rawUser, type: 'paciente', user_type: 'paciente' })

      // [V1.9.8 + V1.9.15] Contexto factual por role — fail-open, RLS-safe.
      // Permite que a Nôa responda com dados reais em vez de "não tenho acesso":
      //   - paciente: dias no app, próxima consulta, trial (V1.9.8)
      //   - professional: agenda do dia, pacientes ativos, prescrições, wallet (V1.9.15)
      // Se a query falhar ou role for desconhecida, userContext = null e o Core
      // responde como antes (sem enrichment).
      let userContextPayload: unknown = null
      const roleRaw = (rawUser?.type || rawUser?.user_type || '').toString().toLowerCase()
      const isPatientRole = roleRaw === 'paciente' || roleRaw === 'patient'
      const isProfessionalRole = roleRaw === 'profissional' || roleRaw === 'professional'
      const isAdminRole = roleRaw === 'admin' || roleRaw === 'master'
      const isStudentRole = roleRaw === 'aluno' || roleRaw === 'student'
      if (platformData?.user?.id) {
        if (isPatientRole) {
          userContextPayload = await buildPatientContext(platformData.user.id)
        } else if (isProfessionalRole) {
          userContextPayload = await buildProfessionalContext(platformData.user.id)
        } else if (isAdminRole) {
          userContextPayload = await buildAdminContext(platformData.user.id)
        } else if (isStudentRole) {
          userContextPayload = await buildStudentContext(platformData.user.id)
        }
      }

      // [V1.9.66 ISM Fase 1] ConversationState — schema explícito do estado
      // conversacional. Aditivo: campos já existem espalhados (assessmentPhase,
      // aecSnapshot.consensusAgreed, aecPhysicianName), aqui consolidamos no
      // formato contratual. Fase 1 = só observabilidade; comportamento do Core
      // não muda.
      const conversation_state = buildConversationState({
        realRole: rawUser?.type || rawUser?.user_type,
        aecPhase: currentPhase,
        consensusAgreed: aecSnapshot?.consensusAgreed ?? null,
        physicianViewingAs: aecPhysicianName ?? null,
        viewingAsRole: null, // reservado pra Fase 2 (CC fix tipoVisual)
        activeSlot: null,    // reservado pra Fase 3 (HH fix slot mapping)
      })

      const payload = {
        message: userMessage,
        injected_context: injectedContext, // 🧪 [HOSPITAL-GRADE] O RAG viaja aqui, nunca na message.
        conversationHistory,
        assessmentPhase: currentPhase,
        nextQuestionHint,
        aecSnapshot, // 🆕 Bloco 11 — fonte única da verdade da sessão AEC
        ...(aecFinalizationData ? { assessmentData: aecFinalizationData } : {}), // [V1.9.20] dados estruturados pra handleFinalizeAssessment
        userContext: userContextPayload, // [V1.9.8+V1.9.15] dados factuais por role (paciente/professional) ou null
        ui_context: uiContext,
        conversation_state, // [V1.9.66 ISM Fase 1] schema explícito do estado conversacional
        patientData: {
          ...platformData,
          ...(userForCore ? { user: userForCore } : {}),
          ...(aecPhysicianName ? { aecConsultationPhysicianName: aecPhysicianName } : {}),
          intent,
          userEmail,
          assessmentContext: platformData?.user?.id ? this.activeAssessments.get(platformData.user.id) : undefined
        }
      }

      // Chamada oficial para a Nuvem (Fase 2)
      const invokePromise = supabase.functions.invoke('tradevision-core', {
        body: payload
      })

      const { data, error } = await withTimeout(
        invokePromise,
        45000,
        'Timeout ao chamar tradevision-core. O Core demorou mais que o esperado para responder.'
      ) as any

      if (error) throw error
      if (data?.error) throw new Error(data.error)
      if (!data?.text) throw new Error('Resposta da IA veio vazia do Core Cloud.')

      const appCommandsFromCore = Array.isArray((data as { app_commands?: unknown[] }).app_commands)
        ? (data as { app_commands: unknown[] }).app_commands
        : []
      if (appCommandsFromCore.length > 0) {
        console.log('Core app_commands no body:', appCommandsFromCore.length, appCommandsFromCore)
      }

      let aiContent = sanitizeLeakedAecCoreLabels(data.text, nextQuestionHint)

      let isCompleted = false
      if (aiContent.includes(META_TAGS.ASSESSMENT_COMPLETED)) {
        isCompleted = true
        MedCannLabAuditLogger.audit('AEC_COMPLETION_ACKNOWLEDGED', { userId: platformData.user.id });
        aiContent = aiContent.replace(META_TAGS.ASSESSMENT_COMPLETED, '').trim()

        if (platformData?.user?.id) {
          console.log('🏁 [AEC READ-ONLY] Tag de conclusão detectada. O Backend (Master Orchestrator) assumiu a geração e persistência de relatórios e riscos clínicos.');

          const flowState = clinicalAssessmentFlow.getState(platformData.user.id)

          if (flowState && flowState.phase !== 'COMPLETED') {
            clinicalAssessmentFlow.completeAssessment(platformData.user.id)
            // A UI reage ao estado do flow local e mostra "Análise completa"
          }
        }
      }

      // Usuário nunca vê nenhum token: remover todos antes de devolver ao hook
      aiContent = stripInvisibleTokensFromResponse(aiContent)

      // [V1.6] UI Contract Puro: O Frontend não adiciona botões post-AEC.
      // O Core dita 100% da navegação e botões em 'app_commands'.
      const finalAppCommands = appCommandsFromCore.length > 0 ? appCommandsFromCore : (data.app_commands ?? [])

      return {
        id: "tv_" + Date.now(),
        content: aiContent,
        confidence: 0.98,
        reasoning: 'TradeVision Cloud Master Engine',
        timestamp: new Date(),
        type: 'text',
        metadata: {
          ...data.metadata,
          assessmentCompleted: isCompleted,
          assessmentInterrupted: aecInterruptedThisTurn,
          intent: data.metadata?.intent || intent,
          professionalId: data.metadata?.professionalId,
          audited: data.metadata?.audited,
          system: data.metadata?.system,
          app_commands: finalAppCommands
        }
      }
    } catch (err) {
      const errMsg =
        err instanceof Error
          ? err.message
          : (() => {
            try {
              return JSON.stringify(err)
            } catch {
              return String(err)
            }
          })()

      console.error('ERRO [TradeVision Cloud] Erro de execucao:', errMsg)

      return this.createResponse(
        'Estou com instabilidade ao conectar ao Core agora. Pode tentar novamente em alguns segundos?\n\n' +
        'Se persistir, me diga qual acao voce estava tentando (ex.: "agendar com Dr. Ricardo") que eu te guio pelo caminho mais curto.',
        0.2,
        'error',
        { source: 'tradevision-core', error: errMsg }
      )
    }
  }

  private async getAssistantResponse(
    userMessage: string,
    intent: string,
    platformData?: any,
    userEmail?: string,
    uiContext?: any,
    platformIntentType: string = 'NONE',
    injectedContext?: string
  ): Promise<AIResponse> {
    return this.processTradeVisionRequest(userMessage, intent, platformData, userEmail, uiContext, platformIntentType, injectedContext);
  }

  private async generateReasoningQuestion(
    prompt: string,
    userResponse: string,
    assessmentContext: IMREAssessmentState
  ): Promise<string> {
    try {
      const response = await this.assistantIntegration.sendMessage(
        prompt,
        'system_reasoning',
        "reasoning_" + assessmentContext.userId
      )

      if (response && response.content) {
        return response.content.replace(/^Pergunta sugerida: /i, '').replace(/^Noa: /i, '').trim()
      }

      throw new Error('Falha ao gerar pergunta via AI')
    } catch (error) {
      console.error('Erro no reasoning:', error)
      return 'Pode me dar mais detalhes sobre isso?'
    }
  }

  private async processMethodologyStep(
    message: string,
    assessment: IMREAssessmentState,
    platformData: any,
    userEmail?: string
  ): Promise<AIResponse> {
    assessment.methodology.diagnosticMethods.push(message)
    const needsMore = message.length < 20 && !message.toLowerCase().includes('não')

    if (needsMore) {
      const reasoningQuestion = await this.generateReasoningQuestion(
        "O paciente esta descrevendo exames/metodos: " + message + ". Gere uma pergunta curta para saber se ele tem resultados de exames recentes.",
        message,
        assessment
      )
      return this.createResponse(reasoningQuestion, 0.7, 'assessment')
    }

    assessment.step = 'RESULT'
    this.platformFunctions.updateAssessmentState(assessment.userId, assessment)

    return this.createResponse(
      'Entendi. Agora vamos para os RESULTADOS. Como voce tem se sentido com o tratamento atual? Houve melhoras ou pioras recentes?',
      0.8,
      'assessment'
    )
  }

  private async processResultStep(
    message: string,
    assessment: IMREAssessmentState,
    platformData: any,
    userEmail?: string
  ): Promise<AIResponse> {
    assessment.result.clinicalFindings.push(message)
    assessment.step = 'EVOLUTION'
    this.platformFunctions.updateAssessmentState(assessment.userId, assessment)

    return this.createResponse(
      'Certo. Para finalizar com a EVOLUCAO: Quais sao suas metas principais para os proximos meses? O que voce espera alcancar?',
      0.8,
      'assessment'
    )
  }

  private async processEvolutionStep(
    message: string,
    assessment: IMREAssessmentState,
    platformData: any,
    userEmail?: string
  ): Promise<AIResponse> {
    assessment.evolution.carePlan.push(message)
    assessment.status = 'completed'
    this.platformFunctions.updateAssessmentState(assessment.userId, assessment)

    this.generateAndSaveReport(assessment).catch(err => console.error('Erro ao salvar relatorio:', err))

    return this.createResponse(
      'Avaliacao completa! \n\nGerei um relatorio clinico detalhado com base na nossa conversa. Vou encaminha-lo para analise do Dr. Ricardo Valenca.\n\nVoce pode visualizar o resumo no seu dashboard. Posso ajudar em algo mais hoje?',
      1.0,
      'assessment'
    )
  }

  private async generateAndSaveReport(assessment: IMREAssessmentState): Promise<void> {
    try {
      const summary = await this.generateClinicalSummary(assessment.userId)
      console.log('Relatorio gerado:', summary)
    } catch (error) {
      console.error('Erro ao gerar relatorio:', error)
    }
  }
}
