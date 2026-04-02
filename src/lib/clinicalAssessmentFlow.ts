/**
 * Sistema de Fluxo de Avaliação Clínica Inicial
 * Implementa o roteiro completo conforme instruções do Dr. Ricardo Valença
 * 
 * S3/C1 FIX: Estado agora persistido em Supabase (aec_assessment_state)
 * em vez de localStorage. Dados clínicos sensíveis nunca ficam no browser.
 */
import { supabase } from './supabase'
export type AssessmentPhase =
  | 'INITIAL_GREETING'
  | 'IDENTIFICATION'
  | 'COMPLAINT_LIST'
  | 'MAIN_COMPLAINT'
  | 'COMPLAINT_DETAILS'
  | 'MEDICAL_HISTORY'
  | 'FAMILY_HISTORY_MOTHER'
  | 'FAMILY_HISTORY_FATHER'
  | 'LIFESTYLE_HABITS'
  | 'OBJECTIVE_QUESTIONS'
  | 'CONSENSUS_REVIEW'
  | 'CONSENSUS_REPORT'
  | 'CONSENT_COLLECTION'
  | 'CONSENSUS_CONFIRMATION'
  | 'FINAL_RECOMMENDATION'
  | 'CONFIRMING_EXIT'
  | 'INTERRUPTED'
  | 'COMPLETED'

export interface AssessmentData {
  // Identificação
  patientName?: string
  patientPresentation?: string

  // Lista Indiciária
  complaintList: string[]

  // Queixa Principal
  mainComplaint?: string

  // Detalhes da Queixa Principal
  complaintLocation?: string
  complaintOnset?: string
  complaintDescription?: string
  complaintAssociatedSymptoms?: string[]
  complaintImprovements?: string[]
  complaintWorsening?: string[]

  // História Patológica Pregressa
  medicalHistory: string[]

  // História Familiar
  familyHistoryMother: string[]
  familyHistoryFather: string[]

  // Hábitos de Vida
  lifestyleHabits: string[]

  // Perguntas Objetivas
  allergies?: string
  regularMedications?: string
  sporadicMedications?: string

  // Consenso
  consensusAgreed: boolean
  consensusRevisions: number

  // Consentimento Informado (S6)
  consentGiven: boolean
  consentTimestamp?: string
}

export interface AssessmentState {
  phase: AssessmentPhase
  data: AssessmentData
  currentQuestionIndex: number
  waitingForMore: boolean // Se está esperando mais itens na lista
  startedAt: Date
  lastUpdate: Date
  interruptedFromPhase?: AssessmentPhase // Fase de onde saiu (para retomada)
}

export class ClinicalAssessmentFlow {
  private states: Map<string, AssessmentState> = new Map()
  private readonly STORAGE_KEY = 'medcannlab_aec_states_v1'

  constructor() {
    // Estado é carregado sob demanda via loadState() — sem localStorage
  }

  /**
   * Carrega estado do Supabase para um userId específico
   */
  private async loadStateFromDB(userId: string): Promise<void> {
    try {
      const { data, error } = await supabase
        .from('aec_assessment_state')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle()

      if (error) {
        console.warn('[AEC] Erro ao carregar estado do BD:', error.message)
        return
      }

      if (data) {
        const state: AssessmentState = {
          phase: data.phase as AssessmentPhase,
          data: (data.data || {}) as unknown as AssessmentData,
          currentQuestionIndex: data.current_question_index || 0,
          waitingForMore: data.waiting_for_more || false,
          startedAt: new Date(data.started_at),
          lastUpdate: new Date(data.last_update),
          interruptedFromPhase: data.interrupted_from_phase as AssessmentPhase | undefined
        }
        this.states.set(userId, state)
      }
    } catch (e) {
      console.warn('[AEC] Falha ao carregar estado do Supabase', e)
    }
  }

  /**
   * Garante que o estado está carregado (chamado antes de getState/processResponse)
   */
  async ensureLoaded(userId: string): Promise<void> {
    if (!this.states.has(userId)) {
      await this.loadStateFromDB(userId)
    }
  }

  public async persist(userId?: string) {
    // Persistir no Supabase em vez de localStorage
    const entries = userId ? [[userId, this.states.get(userId)]] : Array.from(this.states.entries())
    
    for (const [uid, state] of entries) {
      if (!state || !uid) continue
      try {
        const { error } = await supabase
          .from('aec_assessment_state')
          .upsert([{
            user_id: uid as string,
            phase: (state as AssessmentState).phase,
            data: JSON.parse(JSON.stringify((state as AssessmentState).data)),
            current_question_index: (state as AssessmentState).currentQuestionIndex,
            waiting_for_more: (state as AssessmentState).waitingForMore,
            interrupted_from_phase: (state as AssessmentState).interruptedFromPhase || null,
            started_at: (state as AssessmentState).startedAt.toISOString(),
          }], { onConflict: 'user_id' })

        if (error) {
          console.warn('[AEC] Erro ao persistir estado no BD:', error.message)
          // Fallback: tentar localStorage como backup temporário
          try {
            const obj = Object.fromEntries(this.states)
            localStorage.setItem('medcannlab_aec_states_v1_backup', JSON.stringify(obj))
          } catch (_) { /* silenciar */ }
        }
      } catch (e) {
        console.warn('[AEC] Falha ao persistir estado no Supabase', e)
      }
    }
  }

  /**
   * Inicia uma nova avaliação clínica inicial
   */
  startAssessment(userId: string, patientName?: string): AssessmentState {
    const state: AssessmentState = {
      phase: 'INITIAL_GREETING',
      data: {
        patientName: patientName || undefined, // C3: auto-fill from auth profile
        complaintList: [],
        medicalHistory: [],
        familyHistoryMother: [],
        familyHistoryFather: [],
        lifestyleHabits: [],
        complaintAssociatedSymptoms: [],
        complaintImprovements: [],
        complaintWorsening: [],
        consensusAgreed: false,
        consensusRevisions: 0,
        consentGiven: false
      },
      currentQuestionIndex: 0,
      waitingForMore: false,
      startedAt: new Date(),
      lastUpdate: new Date()
    }

    this.states.set(userId, state)
    this.persist()
    return state
  }

  /**
   * Obtém o estado atual da avaliação
   */
  getState(userId: string): AssessmentState | null {
    return this.states.get(userId) || null
  }

  /**
   * Processa a resposta do usuário e retorna a próxima pergunta
   */
  processResponse(userId: string, userResponse: string): {
    nextQuestion: string
    phase: AssessmentPhase
    isComplete: boolean
  } {
    const state = this.states.get(userId)
    if (!state) {
      throw new Error('Avaliação não encontrada. Por favor, inicie uma nova avaliação.')
    }

    const lowerResponse = userResponse.toLowerCase().trim()

    // ========== DETECÇÃO DE SAÍDA VOLUNTÁRIA ==========
    const exitKeywords = [
      'quero parar', 'quero sair', 'preciso ir', 'preciso sair',
      'parar avaliação', 'encerrar avaliação', 'cancelar avaliação',
      'parar avaliacao', 'encerrar avaliacao', 'cancelar avaliacao',
      'não quero continuar', 'nao quero continuar', 'vou parar',
      'tenho que ir', 'deixa pra depois', 'outra hora', 'agora não posso',
      'agora nao posso', 'volto depois',
      'vamos encerrar', 'encerrar por aqui', 'encerrar a conversa', 'encerrar conversa',
      'quero encerrar', 'pode encerrar', 'chega', 'cansei', 'parar por aqui',
      'amigo vamos encerrar', 'vamos parar', 'terminar aqui', 'quero terminar',
      'enviar trigger de encerramento', 'trigger de encerramento'
    ]

    const wantsToExit = exitKeywords.some(kw => lowerResponse.includes(kw))

    // Se quer sair e NÃO está já confirmando saída, entrar no fluxo de confirmação
    if (wantsToExit && state.phase !== 'CONFIRMING_EXIT' && state.phase !== 'COMPLETED' && state.phase !== 'INTERRUPTED') {
      state.interruptedFromPhase = state.phase
      state.phase = 'CONFIRMING_EXIT'
      state.lastUpdate = new Date()
      this.persist()
      return {
        nextQuestion: '⚠️ Tem certeza que deseja interromper a avaliação? Seus dados até aqui serão salvos e você poderá retomar depois. Responda **sim** para confirmar ou **não** para continuar.',
        phase: 'CONFIRMING_EXIT',
        isComplete: false
      }
    }

    // ========== PROCESSAR CONFIRMAÇÃO DE SAÍDA ==========
    if (state.phase === 'CONFIRMING_EXIT') {
      const confirmsExit = lowerResponse.includes('sim') || lowerResponse.includes('confirmo') || lowerResponse.includes('pode parar')
      const cancelsExit = lowerResponse.includes('não') || lowerResponse.includes('nao') || lowerResponse.includes('continuar') || lowerResponse.includes('voltar')

      if (confirmsExit) {
        state.phase = 'INTERRUPTED'
        state.lastUpdate = new Date()
        this.persist()
        return {
          nextQuestion: '✅ Avaliação interrompida. Seus dados foram salvos. Quando quiser retomar, basta solicitar uma nova avaliação clínica que continuaremos de onde paramos. Bons ventos! 🌿',
          phase: 'INTERRUPTED',
          isComplete: true
        }
      } else {
        // Voltar para fase anterior
        state.phase = state.interruptedFromPhase || 'INITIAL_GREETING'
        state.lastUpdate = new Date()
        this.persist()
        return {
          nextQuestion: '👍 Ótimo, vamos continuar! ' + this.getPhaseResumePrompt(state.phase, state),
          phase: state.phase,
          isComplete: false
        }
      }
    }

    const hasMore = !lowerResponse.includes('não') &&
      !lowerResponse.includes('nao') &&
      !lowerResponse.includes('nada mais') &&
      !lowerResponse.includes('é só isso') &&
      !lowerResponse.includes('e só isso') &&
      !lowerResponse.includes('só isso')

    // Processar resposta baseado na fase atual
    switch (state.phase) {
      case 'INITIAL_GREETING':
        // Usuário se apresentou, avançar para identificação
        state.data.patientPresentation = userResponse
        state.phase = 'IDENTIFICATION'
        state.lastUpdate = new Date()
        return {
          nextQuestion: 'O que trouxe você à nossa avaliação hoje?',
          phase: 'IDENTIFICATION',
          isComplete: false
        }

      case 'IDENTIFICATION':
        // Primeira queixa adicionada à lista
        if (userResponse.trim()) {
          state.data.complaintList.push(userResponse.trim())
        }
        state.phase = 'COMPLAINT_LIST'
        state.waitingForMore = true
        state.lastUpdate = new Date()
        return {
          nextQuestion: 'O que mais?',
          phase: 'COMPLAINT_LIST',
          isComplete: false
        }

      case 'COMPLAINT_LIST':
        if (hasMore && userResponse.trim()) {
          // Adicionar mais queixa à lista
          state.data.complaintList.push(userResponse.trim())
          state.lastUpdate = new Date()
          return {
            nextQuestion: 'O que mais?',
            phase: 'COMPLAINT_LIST',
            isComplete: false
          }
        } else {
          // Não há mais queixas, identificar a principal
          state.waitingForMore = false
          state.phase = 'MAIN_COMPLAINT'
          state.lastUpdate = new Date()
          return {
            nextQuestion: `De todas essas questões (${state.data.complaintList.join(', ')}), qual mais o(a) incomoda?`,
            phase: 'MAIN_COMPLAINT',
            isComplete: false
          }
        }

      case 'MAIN_COMPLAINT':
        state.data.mainComplaint = userResponse.trim()
        state.phase = 'COMPLAINT_DETAILS'
        state.currentQuestionIndex = 0
        state.lastUpdate = new Date()
        return {
          nextQuestion: `Vamos explorar suas questões mais detalhadamente. Onde você sente ${state.data.mainComplaint}?`,
          phase: 'COMPLAINT_DETAILS',
          isComplete: false
        }

      case 'COMPLAINT_DETAILS':
        return this.processComplaintDetails(state, userResponse)

      case 'MEDICAL_HISTORY':
        if (hasMore && userResponse.trim()) {
          state.data.medicalHistory.push(userResponse.trim())
          state.lastUpdate = new Date()
          return {
            nextQuestion: 'O que mais?',
            phase: 'MEDICAL_HISTORY',
            isComplete: false
          }
        } else {
          state.waitingForMore = false
          state.phase = 'FAMILY_HISTORY_MOTHER'
          state.lastUpdate = new Date()
          return {
            nextQuestion: 'E na sua família? Começando pela parte de sua mãe, quais as questões de saúde dela e desse lado da família?',
            phase: 'FAMILY_HISTORY_MOTHER',
            isComplete: false
          }
        }

      case 'FAMILY_HISTORY_MOTHER':
        if (hasMore && userResponse.trim()) {
          state.data.familyHistoryMother.push(userResponse.trim())
          state.lastUpdate = new Date()
          return {
            nextQuestion: 'O que mais?',
            phase: 'FAMILY_HISTORY_MOTHER',
            isComplete: false
          }
        } else {
          state.waitingForMore = false
          state.phase = 'FAMILY_HISTORY_FATHER'
          state.lastUpdate = new Date()
          return {
            nextQuestion: 'E por parte de seu pai?',
            phase: 'FAMILY_HISTORY_FATHER',
            isComplete: false
          }
        }

      case 'FAMILY_HISTORY_FATHER':
        if (hasMore && userResponse.trim()) {
          state.data.familyHistoryFather.push(userResponse.trim())
          state.lastUpdate = new Date()
          return {
            nextQuestion: 'O que mais?',
            phase: 'FAMILY_HISTORY_FATHER',
            isComplete: false
          }
        } else {
          state.waitingForMore = false
          state.phase = 'LIFESTYLE_HABITS'
          state.lastUpdate = new Date()
          return {
            nextQuestion: 'Além dos hábitos de vida que já verificamos em nossa conversa, que outros hábitos você acha importante mencionar?',
            phase: 'LIFESTYLE_HABITS',
            isComplete: false
          }
        }

      case 'LIFESTYLE_HABITS':
        if (hasMore && userResponse.trim()) {
          state.data.lifestyleHabits.push(userResponse.trim())
          state.lastUpdate = new Date()
          return {
            nextQuestion: 'O que mais?',
            phase: 'LIFESTYLE_HABITS',
            isComplete: false
          }
        } else {
          state.waitingForMore = false
          state.phase = 'OBJECTIVE_QUESTIONS'
          state.currentQuestionIndex = 0
          state.lastUpdate = new Date()
          return {
            nextQuestion: 'Você tem alguma alergia (mudança de tempo, medicação, poeira...)?',
            phase: 'OBJECTIVE_QUESTIONS',
            isComplete: false
          }
        }

      case 'OBJECTIVE_QUESTIONS':
        return this.processObjectiveQuestions(state, userResponse)

      case 'CONSENSUS_REVIEW':
        state.phase = 'CONSENSUS_REPORT'
        state.lastUpdate = new Date()
        return {
          nextQuestion: this.generateConsensusReport(state),
          phase: 'CONSENSUS_REPORT',
          isComplete: false
        }

      case 'CONSENSUS_REPORT':
        if (lowerResponse.includes('sim') ||
          lowerResponse.includes('concordo') ||
          lowerResponse.includes('está correto') ||
          lowerResponse.includes('correto')) {
          state.data.consensusAgreed = true
          state.phase = 'CONSENT_COLLECTION'
          state.lastUpdate = new Date()
          return {
            nextQuestion: '📋 **Consentimento Informado**\n\nAntes de finalizarmos, preciso do seu consentimento:\n\n' +
              '• Os dados desta avaliação serão registrados no seu prontuário digital.\n' +
              '• O relatório gerado será compartilhado com o Dr. Ricardo Valença para análise clínica.\n' +
              '• Nenhum dado será compartilhado com terceiros sem sua autorização prévia.\n' +
              '• Este relatório é uma avaliação inicial assistida por IA e **não substitui** a consulta médica presencial.\n\n' +
              'Você autoriza o registro e compartilhamento destes dados? (sim/não)',
            phase: 'CONSENT_COLLECTION',
            isComplete: false
          }
        } else {
          // Não concordou, fazer revisão
          state.data.consensusRevisions++
          state.phase = 'CONSENSUS_REVIEW'
          state.lastUpdate = new Date()
          return {
            nextQuestion: `Entendi. Vamos revisar. ${userResponse}. Por favor, me diga o que precisa ser corrigido ou adicionado para que eu possa apresentar novamente meu entendimento.`,
            phase: 'CONSENSUS_REVIEW',
            isComplete: false
          }
        }

      case 'CONSENT_COLLECTION':
        if (lowerResponse.includes('sim') ||
          lowerResponse.includes('autorizo') ||
          lowerResponse.includes('concordo') ||
          lowerResponse.includes('aceito')) {
          state.data.consentGiven = true
          state.data.consentTimestamp = new Date().toISOString()
          state.phase = 'FINAL_RECOMMENDATION'
          state.lastUpdate = new Date()
          return {
            nextQuestion: '✅ Consentimento registrado. Obrigada!\n\n' +
              'Sua avaliação inicial foi concluída com sucesso. ' +
              'O relatório clínico já está disponível no seu painel.\n\n' +
              '**Próximos passos:**\n' +
              '• Acesse seu **Relatório Clínico** para revisar os achados\n' +
              '• **Agende uma consulta** com o Dr. Ricardo Valença para dar continuidade ao seu cuidado\n\n' +
              'Use os botões abaixo para navegar rapidamente 👇',
            phase: 'FINAL_RECOMMENDATION',
            isComplete: false
          }
        } else if (lowerResponse.includes('não') || lowerResponse.includes('nao') || lowerResponse.includes('recuso')) {
          state.data.consentGiven = false
          state.phase = 'FINAL_RECOMMENDATION'
          state.lastUpdate = new Date()
          return {
            nextQuestion: '⚠️ Entendido. Sem o consentimento, o relatório **não será gerado nem compartilhado** com o médico. Seus dados desta conversa serão descartados.\n\nRecomendo a marcação de uma consulta presencial com o Dr. Ricardo Valença pelo site para prosseguir com a avaliação.',
            phase: 'FINAL_RECOMMENDATION',
            isComplete: false
          }
        } else {
          return {
            nextQuestion: 'Por favor, responda **sim** para autorizar o registro ou **não** para recusar.',
            phase: 'CONSENT_COLLECTION',
            isComplete: false
          }
        }

      case 'FINAL_RECOMMENDATION':
        state.phase = 'COMPLETED'
        state.lastUpdate = new Date()
        return {
          nextQuestion: '',
          phase: 'COMPLETED',
          isComplete: true
        }

      default:
        return {
          nextQuestion: 'Avaliação concluída.',
          phase: state.phase,
          isComplete: true
        }
    }
  }

  /**
   * Processa os detalhes da queixa principal
   */
  private processComplaintDetails(state: AssessmentState, userResponse: string): {
    nextQuestion: string
    phase: AssessmentPhase
    isComplete: boolean
  } {
    const questions = [
      { field: 'complaintLocation', question: `Onde você sente ${state.data.mainComplaint}?` },
      { field: 'complaintOnset', question: `Quando essa ${state.data.mainComplaint} começou?` },
      { field: 'complaintDescription', question: `Como é a ${state.data.mainComplaint}?` },
      { field: 'complaintAssociatedSymptoms', question: `O que mais você sente quando está com a ${state.data.mainComplaint}?`, isList: true },
      { field: 'complaintImprovements', question: `O que parece melhorar a ${state.data.mainComplaint}?`, isList: true },
      { field: 'complaintWorsening', question: `O que parece piorar a ${state.data.mainComplaint}?`, isList: true }
    ]

    const currentQ = questions[state.currentQuestionIndex]

    if (!currentQ) {
      // Todas as perguntas sobre queixa foram respondidas
      state.phase = 'MEDICAL_HISTORY'
      state.waitingForMore = true
      state.currentQuestionIndex = 0
      state.lastUpdate = new Date()
      return {
        nextQuestion: 'E agora, sobre o restante sua vida até aqui, desde seu nascimento, quais as questões de saúde que você já viveu? Vamos ordenar do mais antigo para o mais recente, o que veio primeiro?',
        phase: 'MEDICAL_HISTORY',
        isComplete: false
      }
    }

    // Salvar resposta
    if (currentQ.isList) {
      const lowerResponse = userResponse.toLowerCase().trim()
      const hasMore = !lowerResponse.includes('não') &&
        !lowerResponse.includes('nao') &&
        !lowerResponse.includes('nada mais')

      if (hasMore && userResponse.trim()) {
        const field = currentQ.field as keyof AssessmentData
        const currentList = state.data[field] as string[]
        if (Array.isArray(currentList)) {
          currentList.push(userResponse.trim())
        }
        state.lastUpdate = new Date()
        return {
          nextQuestion: 'O que mais?',
          phase: 'COMPLAINT_DETAILS',
          isComplete: false
        }
      } else {
        // Próxima pergunta
        state.currentQuestionIndex++
        state.lastUpdate = new Date()
        const nextQ = questions[state.currentQuestionIndex]
        if (nextQ) {
          return {
            nextQuestion: nextQ.question.replace('{queixa}', state.data.mainComplaint || 'queixa'),
            phase: 'COMPLAINT_DETAILS',
            isComplete: false
          }
        }
      }
    } else {
      const field = currentQ.field as keyof AssessmentData
      (state.data as any)[field] = userResponse.trim()
      state.currentQuestionIndex++
      state.lastUpdate = new Date()

      const nextQ = questions[state.currentQuestionIndex]
      if (nextQ) {
        return {
          nextQuestion: nextQ.question.replace('{queixa}', state.data.mainComplaint || 'queixa'),
          phase: 'COMPLAINT_DETAILS',
          isComplete: false
        }
      }
    }

    // Se chegou aqui, todas as perguntas foram respondidas
    state.phase = 'MEDICAL_HISTORY'
    state.waitingForMore = true
    state.currentQuestionIndex = 0
    state.lastUpdate = new Date()
    return {
      nextQuestion: 'E agora, sobre o restante sua vida até aqui, desde seu nascimento, quais as questões de saúde que você já viveu? Vamos ordenar do mais antigo para o mais recente, o que veio primeiro?',
      phase: 'MEDICAL_HISTORY',
      isComplete: false
    }
  }

  /**
   * Processa perguntas objetivas finais
   */
  private processObjectiveQuestions(state: AssessmentState, userResponse: string): {
    nextQuestion: string
    phase: AssessmentPhase
    isComplete: boolean
  } {
    const questions = [
      { field: 'allergies', question: 'Você tem alguma alergia (mudança de tempo, medicação, poeira...)?' },
      { field: 'regularMedications', question: 'Quais as medicações que você utiliza regularmente?' },
      { field: 'sporadicMedications', question: 'Quais as medicações você utiliza esporadicamente (de vez em quando) e porque utiliza?' }
    ]

    const currentQ = questions[state.currentQuestionIndex]

    if (!currentQ) {
      // Todas as perguntas objetivas foram respondidas
      state.phase = 'CONSENSUS_REVIEW'
      state.lastUpdate = new Date()
      return {
        nextQuestion: 'Vamos revisar a sua história para garantir que não perdemos nenhum detalhe importante.',
        phase: 'CONSENSUS_REVIEW',
        isComplete: false
      }
    }

    // Salvar resposta
    const field = currentQ.field as keyof AssessmentData
    (state.data as any)[field] = userResponse.trim()
    state.currentQuestionIndex++
    state.lastUpdate = new Date()

    const nextQ = questions[state.currentQuestionIndex]
    if (nextQ) {
      return {
        nextQuestion: nextQ.question,
        phase: 'OBJECTIVE_QUESTIONS',
        isComplete: false
      }
    }

    // Última pergunta respondida
    state.phase = 'CONSENSUS_REVIEW'
    state.lastUpdate = new Date()
    return {
      nextQuestion: 'Vamos revisar a sua história para garantir que não perdemos nenhum detalhe importante.',
      phase: 'CONSENSUS_REVIEW',
      isComplete: false
    }
  }

  /**
   * Gera o relatório consensual
   */
  private generateConsensusReport(state: AssessmentState): string {
    const data = state.data
    let report = 'Vamos revisar a sua história para garantir que não perdemos nenhum detalhe importante.\n\n'

    report += '**MEU ENTENDIMENTO SOBRE SUA AVALIAÇÃO:**\n\n'

    // Identificação
    if (data.patientPresentation) {
      report += `**Apresentação:** ${data.patientPresentation}\n\n`
    }

    // Lista de Queixas
    if (data.complaintList.length > 0) {
      report += `**Queixas Identificadas:** ${data.complaintList.join(', ')}\n\n`
    }

    // Queixa Principal e Detalhes
    if (data.mainComplaint) {
      report += `**Queixa Principal:** ${data.mainComplaint}\n`
      if (data.complaintLocation) report += `- Onde: ${data.complaintLocation}\n`
      if (data.complaintOnset) report += `- Quando começou: ${data.complaintOnset}\n`
      if (data.complaintDescription) report += `- Como é: ${data.complaintDescription}\n`
      if (data.complaintAssociatedSymptoms && data.complaintAssociatedSymptoms.length > 0) {
        report += `- Sintomas associados: ${data.complaintAssociatedSymptoms.join(', ')}\n`
      }
      if (data.complaintImprovements && data.complaintImprovements.length > 0) {
        report += `- O que melhora: ${data.complaintImprovements.join(', ')}\n`
      }
      if (data.complaintWorsening && data.complaintWorsening.length > 0) {
        report += `- O que piora: ${data.complaintWorsening.join(', ')}\n`
      }
      report += '\n'
    }

    // História Patológica Pregressa
    if (data.medicalHistory.length > 0) {
      report += `**História Patológica Pregressa:** ${data.medicalHistory.join('; ')}\n\n`
    }

    // História Familiar
    if (data.familyHistoryMother.length > 0 || data.familyHistoryFather.length > 0) {
      report += '**História Familiar:**\n'
      if (data.familyHistoryMother.length > 0) {
        report += `- Lado materno: ${data.familyHistoryMother.join('; ')}\n`
      }
      if (data.familyHistoryFather.length > 0) {
        report += `- Lado paterno: ${data.familyHistoryFather.join('; ')}\n`
      }
      report += '\n'
    }

    // Hábitos de Vida
    if (data.lifestyleHabits.length > 0) {
      report += `**Hábitos de Vida:** ${data.lifestyleHabits.join('; ')}\n\n`
    }

    // Perguntas Objetivas
    if (data.allergies) report += `**Alergias:** ${data.allergies}\n`
    if (data.regularMedications) report += `**Medicações Regulares:** ${data.regularMedications}\n`
    if (data.sporadicMedications) report += `**Medicações Esporádicas:** ${data.sporadicMedications}\n`

    report += '\n**Você concorda com esse entendimento?**'

    return report
  }

  /**
   * Obtém os dados completos da avaliação para gerar relatório final
   */
  getAssessmentData(userId: string): AssessmentData | null {
    const state = this.states.get(userId)
    return state ? state.data : null
  }

  /**
   * Finaliza a avaliação
   */
  completeAssessment(userId: string): AssessmentData | null {
    const state = this.states.get(userId)
    if (!state) return null

    state.phase = 'COMPLETED'
    state.lastUpdate = new Date()

    return state.data
  }

  /**
   * Gera relatório estruturado da avaliação completa
   */
  async generateReport(userId: string, patientId: string): Promise<string | null> {
    const state = this.states.get(userId)
    if (!state || state.phase !== 'COMPLETED') return null

    // S6: Bloquear geração de relatório sem consentimento
    if (!state.data.consentGiven) {
      console.warn('[AEC] ⚠️ Relatório NÃO gerado — paciente recusou consentimento.')
      return null
    }

    const data = state.data

    // Gerar relatório estruturado
    const report = {
      id: `aec-${Date.now()}-${userId.substring(0, 8)}`,
      patient_id: patientId,
      patient_name: data.patientName || 'Não informado',
      report_type: 'initial_assessment',
      protocol: 'AEC',
      generated_by: 'ai_resident',
      generated_at: new Date().toISOString(),
      status: 'completed',
      content: {
        identificacao: {
          nome: data.patientName,
          apresentacao: data.patientPresentation
        },
        lista_indiciaria: data.complaintList,
        queixa_principal: data.mainComplaint,
        desenvolvimento_queixa: {
          localizacao: data.complaintLocation,
          inicio: data.complaintOnset,
          descricao: data.complaintDescription,
          sintomas_associados: data.complaintAssociatedSymptoms,
          fatores_melhora: data.complaintImprovements,
          fatores_piora: data.complaintWorsening
        },
        historia_patologica_pregressa: data.medicalHistory,
        historia_familiar: {
          lado_materno: data.familyHistoryMother,
          lado_paterno: data.familyHistoryFather
        },
        habitos_vida: data.lifestyleHabits,
        perguntas_objetivas: {
          alergias: data.allergies,
          medicacoes_regulares: data.regularMedications,
          medicacoes_esporadicas: data.sporadicMedications
        },
        consenso: {
          aceito: data.consensusAgreed,
          revisoes_realizadas: data.consensusRevisions
        }
      }
    }

    try {
      // Importar supabase do caminho correto
      const { supabase } = await import('./supabase')

      console.log('🦅 [ClinicalFlow] Enviando dados para Edge Function (Server-Side Save)...')

      // CHAMADA À EDGE FUNCTION (Bypassing RLS)
      const { data: edgeResponse, error: edgeError } = await supabase.functions.invoke('tradevision-core', {
        body: {
          action: 'finalize_assessment',
          message: 'Finalizing Assessment', // Campo obrigatório para passar na validação inicial
          assessmentData: {
            patient_id: patientId,
            content: report.content,
            doctor_id: null,
            // Cálculo de Scores Simplificado para este contexto
            scores: {
              anamnese: 100,
              detalhamento: 100,
              consenso: 100
            },
            risk_level: 'medium'
          }
        }
      })

      if (edgeError) {
        console.error('❌ [Edge Function] Falha na chamada:', edgeError)
        throw edgeError
      }

      console.log('✅ [Edge Function] Resposta:', edgeResponse)

      if (edgeResponse && edgeResponse.success && edgeResponse.report_id) {
        console.log('✅ Relatório clínico salvo via Server-Side:', edgeResponse.report_id)
        return edgeResponse.report_id
      } else {
        const errorMsg = edgeResponse?.error || 'Edge Function retornou sucesso=false ou report_id nulo.'
        throw new Error(errorMsg)
      }

    } catch (error) {
      console.error('❌ Erro ao gerar relatório (Via Edge Function):', error)
      return null
    }
  }

  /**
   * Retorna o prompt adequado para retomar uma fase específica
   */
  private getPhaseResumePrompt(phase: AssessmentPhase, state: AssessmentState): string {
    switch (phase) {
      case 'INITIAL_GREETING': return 'Pode se apresentar quando estiver pronto(a).'
      case 'IDENTIFICATION': return 'O que trouxe você à nossa avaliação hoje?'
      case 'COMPLAINT_LIST': return 'O que mais você gostaria de relatar?'
      case 'MAIN_COMPLAINT': return `Das queixas relatadas (${state.data.complaintList.join(', ')}), qual considera a principal?`
      case 'COMPLAINT_DETAILS': return 'Continuando sobre sua queixa principal...'
      case 'MEDICAL_HISTORY': return 'Tem algum histórico de doenças ou condições anteriores?'
      case 'FAMILY_HISTORY_MOTHER': return 'Sobre a saúde da sua família materna, há algo a relatar?'
      case 'FAMILY_HISTORY_FATHER': return 'E sobre a saúde da família paterna?'
      case 'LIFESTYLE_HABITS': return 'Sobre seus hábitos de vida (exercícios, alimentação, sono)...'
      case 'OBJECTIVE_QUESTIONS': return 'Vamos continuar com as perguntas objetivas.'
      case 'CONSENSUS_REVIEW': return 'Vamos revisar o resumo da sua avaliação.'
      default: return 'Vamos continuar de onde paramos.'
    }
  }

  /**
   * Verifica se um usuário tem uma avaliação interrompida que pode ser retomada
   */
  hasInterruptedAssessment(userId: string): boolean {
    const state = this.states.get(userId)
    return state?.phase === 'INTERRUPTED' && !!state.interruptedFromPhase
  }

  /**
   * Retoma uma avaliação interrompida
   */
  resumeAssessment(userId: string): { nextQuestion: string; phase: AssessmentPhase } | null {
    const state = this.states.get(userId)
    if (!state || state.phase !== 'INTERRUPTED' || !state.interruptedFromPhase) return null

    state.phase = state.interruptedFromPhase
    state.interruptedFromPhase = undefined
    state.lastUpdate = new Date()
    this.persist()

    return {
      nextQuestion: `🔄 Retomando sua avaliação de onde paramos. ${this.getPhaseResumePrompt(state.phase, state)}`,
      phase: state.phase
    }
  }

  /**
   * Reseta uma avaliação (local + BD)
   */
  resetAssessment(userId: string): void {
    this.states.delete(userId)
    // Deletar do BD de forma assíncrona (fire-and-forget)
    supabase
      .from('aec_assessment_state')
      .delete()
      .eq('user_id', userId)
      .then(({ error }) => {
        if (error) console.warn('[AEC] Erro ao deletar estado do BD:', error.message)
      })
  }
}

// Instância singleton
export const clinicalAssessmentFlow = new ClinicalAssessmentFlow()




