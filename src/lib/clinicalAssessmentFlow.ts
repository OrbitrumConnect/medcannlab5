/**
 * Sistema de Fluxo de Avaliação Clínica Inicial
 * Implementa o roteiro completo conforme instruções do Dr. Ricardo Valença
 */

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
  | 'CONSENSUS_CONFIRMATION'
  | 'FINAL_RECOMMENDATION'
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
}

export interface AssessmentState {
  phase: AssessmentPhase
  data: AssessmentData
  currentQuestionIndex: number
  waitingForMore: boolean // Se está esperando mais itens na lista
  startedAt: Date
  lastUpdate: Date
}

export class ClinicalAssessmentFlow {
  private states: Map<string, AssessmentState> = new Map()
  
  /**
   * Inicia uma nova avaliação clínica inicial
   */
  startAssessment(userId: string): AssessmentState {
    const state: AssessmentState = {
      phase: 'INITIAL_GREETING',
      data: {
        complaintList: [],
        medicalHistory: [],
        familyHistoryMother: [],
        familyHistoryFather: [],
        lifestyleHabits: [],
        complaintAssociatedSymptoms: [],
        complaintImprovements: [],
        complaintWorsening: [],
        consensusAgreed: false,
        consensusRevisions: 0
      },
      currentQuestionIndex: 0,
      waitingForMore: false,
      startedAt: new Date(),
      lastUpdate: new Date()
    }
    
    this.states.set(userId, state)
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
          state.phase = 'FINAL_RECOMMENDATION'
          state.lastUpdate = new Date()
          return {
            nextQuestion: 'Essa é uma avaliação inicial de acordo com o método desenvolvido pelo Dr. Ricardo Valença com o objetivo de aperfeiçoar o seu atendimento. Ao final, recomendo a marcação de uma consulta com o Dr. Ricardo Valença pelo site.',
            phase: 'FINAL_RECOMMENDATION',
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
      state.data[field] = userResponse.trim() as any
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
    state.data[field] = userResponse.trim() as any
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
   * Reseta uma avaliação
   */
  resetAssessment(userId: string): void {
    this.states.delete(userId)
  }
}

// Instância singleton
export const clinicalAssessmentFlow = new ClinicalAssessmentFlow()




