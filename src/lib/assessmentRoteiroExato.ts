// Roteiro exato da avaliação clínica inicial conforme especificado
// Este arquivo contém as perguntas exatas e a lógica de processamento

export interface AssessmentRoteiroState {
  step: 
    | 'ABERTURA_EXPONENCIAL'
    | 'LISTA_INDICIARIA'
    | 'IDENTIFICACAO_QUEIXA_PRINCIPAL'
    | 'DESENVOLVIMENTO_INDICIARIO'
    | 'HISTORIA_PATOLOGICA_PREGRESSA'
    | 'HISTORIA_FAMILIAR'
    | 'HABITOS_VIDA'
    | 'PERGUNTAS_OBJETIVAS_FINAIS'
    | 'FECHAMENTO_CONSENSUAL'
    | 'HIPOTESES_SINDROMICAS'
    | 'RECOMENDACAO_FINAL'
    | 'COMPLETED'
  
  // Dados coletados
  apresentacao?: string
  complaints: string[] // Lista indiciária
  mainComplaint?: string // Queixa principal identificada
  complaintDetails?: {
    location?: string // Onde
    when?: string // Quando
    how?: string // Como
    associated?: string // O que mais sente
    improves?: string // O que melhora
    worsens?: string // O que piora
  }
  medicalHistory: string[] // História patológica pregressa
  familyHistoryMother: string[] // História familiar - mãe
  familyHistoryFather: string[] // História familiar - pai
  familyHistoryCurrentSide?: 'mother' | 'father' // Qual lado da família está sendo investigado
  lifestyle: string[] // Hábitos de vida
  allergies?: string
  medicationsRegular?: string
  medicationsSporadic?: string
  cannabisUse?: string
  waitingForMore?: boolean // Se está esperando mais respostas na lista indiciária
}

export const ROTEIRO_PERGUNTAS = {
  ABERTURA_EXPONENCIAL: 'Olá! Eu sou Nôa Esperanza. Por favor, apresente-se também e vamos iniciar a sua avaliação clínica inicial para consultas com profissionais do Med Cann Lab.',
  
  LISTA_INDICIARIA_INICIAL: 'O que trouxe você à nossa avaliação hoje?',
  LISTA_INDICIARIA_CONTINUAR: 'O que mais?',
  
  IDENTIFICACAO_QUEIXA_PRINCIPAL: (complaints: string[]) => {
    // Apresentar a lista indiciária primeiro
    const listaTexto = complaints.length === 1 
      ? complaints[0]
      : complaints.map((c, i) => `${i + 1}. ${c}`).join('\n')
    return `Você mencionou as seguintes questões:\n${listaTexto}\n\nDe todas essas questões, qual mais o(a) incomoda?`
  },
  
  DESENVOLVIMENTO_INDICIARIO: {
    ONDE: (queixa: string) => `Vamos explorar suas queixas mais detalhadamente. Onde você sente ${queixa}?`,
    QUANDO: (queixa: string) => `Quando essa ${queixa} começou?`,
    COMO: (queixa: string) => `Como é a ${queixa}?`,
    ASSOCIADO: (queixa: string) => `O que mais você sente quando está com a ${queixa}?`,
    MELHORA: (queixa: string) => `O que parece melhorar a ${queixa}?`,
    PIORA: (queixa: string) => `O que parece piorar a ${queixa}?`,
  },
  
  HISTORIA_PATOLOGICA_PREGRESSA_INICIAL: 'Agora, sobre o restante da sua vida até aqui, desde seu nascimento, quais questões de saúde você já vivenciou? Vamos ordenar do mais antigo para o mais recente. O que veio primeiro?',
  HISTORIA_PATOLOGICA_PREGRESSA_CONTINUAR: 'O que mais?',
  
  HISTORIA_FAMILIAR_MAE_INICIAL: 'E na sua família? Começando pela parte de sua mãe, quais as questões de saúde dela e desse lado da família?',
  HISTORIA_FAMILIAR_MAE_CONTINUAR: 'O que mais?',
  HISTORIA_FAMILIAR_PAI_INICIAL: 'E por parte de seu pai?',
  HISTORIA_FAMILIAR_PAI_CONTINUAR: 'O que mais?',
  
  HABITOS_VIDA_INICIAL: 'Além dos hábitos de vida que já verificamos em nossa conversa, que outros hábitos você acha importante mencionar?',
  HABITOS_VIDA_CONTINUAR: 'O que mais?',
  
  PERGUNTAS_OBJETIVAS_FINAIS: {
    ALERGIAS: 'Você tem alguma alergia (mudança de tempo, medicação, poeira...)?',
    MEDICACOES_REGULARES: 'Quais as medicações que você utiliza regularmente?',
    MEDICACOES_ESPORADICAS: 'Quais as medicações você utiliza esporadicamente (de vez em quando) e porque utiliza?',
    CANNABIS: 'você já utilizou canabis medicinal?',
  },
  
  FECHAMENTO_CONSENSUAL_INICIO: 'Vamos revisar a sua história rapidamente para garantir que não perdemos nenhum detalhe importante.',
  FECHAMENTO_CONSENSUAL_PERGUNTA: 'Você concorda com o meu entendimento? Há mais alguma coisa que gostaria de adicionar sobre a história que construímos?',
  FECHAMENTO_CONSENSUAL_MELHORAR: 'O que posso melhorar no meu entendimento',
  
  RECOMENDACAO_FINAL: 'Essa é uma avaliação inicial de acordo com o método desenvolvido pelo Dr. Ricardo Valença com o objetivo de aperfeiçoar o seu atendimento. Ao final, recomendo a marcação de uma consulta com o Dr. Ricardo Valença pelo site.',
  RELATORIO_PRONTO: 'Seu relatório resumido está pronto para download.',
}

export function processAssessmentStep(
  state: AssessmentRoteiroState,
  userMessage: string
): { nextStep: AssessmentRoteiroState['step'], response: string, updatedState: AssessmentRoteiroState } {
  const lowerMessage = userMessage.toLowerCase()
  const updatedState = { ...state }
  
  // Verificar se usuário disse que não há mais nada - DETECÇÃO MAIS ROBUSTA
  const naoHaMais = 
    lowerMessage.trim() === 'só isso' ||
    lowerMessage.trim() === 'somente isso' ||
    lowerMessage.trim() === 'apenas isso' ||
    lowerMessage.trim() === 'é só isso' ||
    lowerMessage.trim() === 'só isso mesmo' ||
    lowerMessage.includes('não há mais') ||
    lowerMessage.includes('não tem mais') ||
    lowerMessage.includes('nada mais') ||
    (lowerMessage.includes('só') && lowerMessage.includes('isso') && lowerMessage.length < 15) || // Frases curtas com "só isso"
    (lowerMessage.includes('somente') && lowerMessage.includes('isso') && lowerMessage.length < 20) ||
    (lowerMessage.includes('apenas') && lowerMessage.includes('isso') && lowerMessage.length < 20)
  
  // VALIDAÇÃO: Se o estado não está na abertura exponencial mas não tem apresentação,
  // significa que algo deu errado - resetar para abertura exponencial
  if (state.step !== 'ABERTURA_EXPONENCIAL' && !state.apresentacao && state.complaints.length === 0) {
    console.warn('⚠️ Estado inconsistente detectado, resetando para ABERTURA_EXPONENCIAL')
    updatedState.step = 'ABERTURA_EXPONENCIAL'
  }
  
  switch (updatedState.step) {
    case 'ABERTURA_EXPONENCIAL':
      updatedState.apresentacao = userMessage
      updatedState.step = 'LISTA_INDICIARIA'
      return {
        nextStep: 'LISTA_INDICIARIA',
        response: ROTEIRO_PERGUNTAS.LISTA_INDICIARIA_INICIAL,
        updatedState
      }
    
    case 'LISTA_INDICIARIA':
      // Se o usuário disse que não há mais
      if (naoHaMais) {
        // Se já temos pelo menos uma queixa, avançar
        if (updatedState.complaints.length > 0) {
          // Terminou a lista indiciária, ir para identificação da queixa principal
          updatedState.step = 'IDENTIFICACAO_QUEIXA_PRINCIPAL'
          updatedState.waitingForMore = false
          return {
            nextStep: 'IDENTIFICACAO_QUEIXA_PRINCIPAL',
            response: ROTEIRO_PERGUNTAS.IDENTIFICACAO_QUEIXA_PRINCIPAL(updatedState.complaints),
            updatedState
          }
        } else {
          // Se não há queixas ainda, tratar a mensagem como primeira queixa
          updatedState.complaints.push(userMessage)
          updatedState.waitingForMore = true
          return {
            nextStep: 'LISTA_INDICIARIA',
            response: ROTEIRO_PERGUNTAS.LISTA_INDICIARIA_CONTINUAR,
            updatedState
          }
        }
      } else {
        // Adicionar à lista (primeira resposta ou continuação)
        updatedState.complaints.push(userMessage)
        updatedState.waitingForMore = true
        // Sempre perguntar "O que mais?" após adicionar uma queixa
        return {
          nextStep: 'LISTA_INDICIARIA',
          response: ROTEIRO_PERGUNTAS.LISTA_INDICIARIA_CONTINUAR,
          updatedState
        }
      }
    
    case 'IDENTIFICACAO_QUEIXA_PRINCIPAL':
      updatedState.mainComplaint = userMessage
      updatedState.step = 'DESENVOLVIMENTO_INDICIARIO'
      updatedState.complaintDetails = {}
      return {
        nextStep: 'DESENVOLVIMENTO_INDICIARIO',
        response: ROTEIRO_PERGUNTAS.DESENVOLVIMENTO_INDICIARIO.ONDE(userMessage),
        updatedState
      }
    
    case 'DESENVOLVIMENTO_INDICIARIO':
      const details = updatedState.complaintDetails || {}
      if (!details.location) {
        details.location = userMessage
        return {
          nextStep: 'DESENVOLVIMENTO_INDICIARIO',
          response: ROTEIRO_PERGUNTAS.DESENVOLVIMENTO_INDICIARIO.QUANDO(updatedState.mainComplaint || 'essa queixa'),
          updatedState: { ...updatedState, complaintDetails: details }
        }
      } else if (!details.when) {
        details.when = userMessage
        return {
          nextStep: 'DESENVOLVIMENTO_INDICIARIO',
          response: ROTEIRO_PERGUNTAS.DESENVOLVIMENTO_INDICIARIO.COMO(updatedState.mainComplaint || 'essa queixa'),
          updatedState: { ...updatedState, complaintDetails: details }
        }
      } else if (!details.how) {
        details.how = userMessage
        return {
          nextStep: 'DESENVOLVIMENTO_INDICIARIO',
          response: ROTEIRO_PERGUNTAS.DESENVOLVIMENTO_INDICIARIO.ASSOCIADO(updatedState.mainComplaint || 'essa queixa'),
          updatedState: { ...updatedState, complaintDetails: details }
        }
      } else if (!details.associated) {
        details.associated = userMessage
        return {
          nextStep: 'DESENVOLVIMENTO_INDICIARIO',
          response: ROTEIRO_PERGUNTAS.DESENVOLVIMENTO_INDICIARIO.MELHORA(updatedState.mainComplaint || 'essa queixa'),
          updatedState: { ...updatedState, complaintDetails: details }
        }
      } else if (!details.improves) {
        details.improves = userMessage
        return {
          nextStep: 'DESENVOLVIMENTO_INDICIARIO',
          response: ROTEIRO_PERGUNTAS.DESENVOLVIMENTO_INDICIARIO.PIORA(updatedState.mainComplaint || 'essa queixa'),
          updatedState: { ...updatedState, complaintDetails: details }
        }
      } else {
        // Terminou desenvolvimento indiciário
        details.worsens = userMessage
        updatedState.step = 'HISTORIA_PATOLOGICA_PREGRESSA'
        updatedState.waitingForMore = false
        return {
          nextStep: 'HISTORIA_PATOLOGICA_PREGRESSA',
          response: ROTEIRO_PERGUNTAS.HISTORIA_PATOLOGICA_PREGRESSA_INICIAL,
          updatedState: { ...updatedState, complaintDetails: details }
        }
      }
    
    case 'HISTORIA_PATOLOGICA_PREGRESSA':
      if (naoHaMais) {
        // Se já tem pelo menos uma resposta, avançar
        if (updatedState.medicalHistory.length > 0) {
          updatedState.step = 'HISTORIA_FAMILIAR'
          updatedState.familyHistoryCurrentSide = 'mother' // Iniciar pela mãe
          updatedState.waitingForMore = false
          return {
            nextStep: 'HISTORIA_FAMILIAR',
            response: ROTEIRO_PERGUNTAS.HISTORIA_FAMILIAR_MAE_INICIAL,
            updatedState: {
              ...updatedState,
              step: 'HISTORIA_FAMILIAR',
              familyHistoryCurrentSide: 'mother',
              waitingForMore: false
            }
          }
        } else {
          // Se não tem nenhuma resposta ainda, tratar como primeira resposta
          updatedState.medicalHistory.push(userMessage)
          updatedState.waitingForMore = true
          return {
            nextStep: 'HISTORIA_PATOLOGICA_PREGRESSA',
            response: ROTEIRO_PERGUNTAS.HISTORIA_PATOLOGICA_PREGRESSA_CONTINUAR,
            updatedState
          }
        }
      } else {
        // Adicionar resposta
        updatedState.medicalHistory.push(userMessage)
        updatedState.waitingForMore = true
        return {
          nextStep: 'HISTORIA_PATOLOGICA_PREGRESSA',
          response: ROTEIRO_PERGUNTAS.HISTORIA_PATOLOGICA_PREGRESSA_CONTINUAR,
          updatedState
        }
      }
    
    case 'HISTORIA_FAMILIAR':
      // LÓGICA ULTRA-SIMPLIFICADA: 
      // Se já perguntou sobre o pai (tem respostas do pai OU flag = 'father'), está na parte do pai
      // Caso contrário, está na parte da mãe
      const jaPerguntouSobrePai = updatedState.familyHistoryCurrentSide === 'father' || 
                                  updatedState.familyHistoryFather.length > 0
      
      if (!jaPerguntouSobrePai) {
        // PARTE DA MÃE - ainda não perguntou sobre o pai
        if (naoHaMais) {
          // Usuário disse "não há mais" - avançar para o pai
          return {
            nextStep: 'HISTORIA_FAMILIAR',
            response: ROTEIRO_PERGUNTAS.HISTORIA_FAMILIAR_PAI_INICIAL,
            updatedState: {
              ...updatedState,
              familyHistoryCurrentSide: 'father',
              waitingForMore: false
            }
          }
        } else {
          // Adicionar resposta da mãe
          updatedState.familyHistoryMother.push(userMessage)
          return {
            nextStep: 'HISTORIA_FAMILIAR',
            response: ROTEIRO_PERGUNTAS.HISTORIA_FAMILIAR_MAE_CONTINUAR,
            updatedState: {
              ...updatedState,
              familyHistoryCurrentSide: 'mother',
              waitingForMore: true
            }
          }
        }
      } else {
        // PARTE DO PAI - já perguntou sobre o pai
        if (naoHaMais) {
          // Usuário disse "não há mais" - avançar para hábitos de vida
          return {
            nextStep: 'HABITOS_VIDA',
            response: ROTEIRO_PERGUNTAS.HABITOS_VIDA_INICIAL,
            updatedState: {
              ...updatedState,
              step: 'HABITOS_VIDA',
              familyHistoryCurrentSide: 'father',
              waitingForMore: false
            }
          }
        } else {
          // Adicionar resposta do pai
          updatedState.familyHistoryFather.push(userMessage)
          return {
            nextStep: 'HISTORIA_FAMILIAR',
            response: ROTEIRO_PERGUNTAS.HISTORIA_FAMILIAR_PAI_CONTINUAR,
            updatedState: {
              ...updatedState,
              familyHistoryCurrentSide: 'father',
              waitingForMore: true
            }
          }
        }
      }
    
    case 'HABITOS_VIDA':
      // Verificar se a resposta contém indicação de que não há mais
      // Isso evita perguntar "o que mais" no meio de uma resposta longa
      const respostaContemFim = 
        lowerMessage.includes('somente isso') ||
        lowerMessage.includes('só isso') ||
        lowerMessage.includes('apenas isso') ||
        lowerMessage.includes('é só isso') ||
        lowerMessage.includes('não há mais') ||
        lowerMessage.includes('não tem mais') ||
        lowerMessage.includes('nada mais') ||
        (lowerMessage.includes('só') && lowerMessage.includes('isso') && lowerMessage.length < 20)
      
      if (naoHaMais || respostaContemFim) {
        // Se já tem pelo menos uma resposta, avançar
        if (updatedState.lifestyle.length > 0) {
          updatedState.step = 'PERGUNTAS_OBJETIVAS_FINAIS'
          updatedState.waitingForMore = false
          return {
            nextStep: 'PERGUNTAS_OBJETIVAS_FINAIS',
            response: ROTEIRO_PERGUNTAS.PERGUNTAS_OBJETIVAS_FINAIS.ALERGIAS,
            updatedState
          }
        } else {
          // Se não tem nenhuma resposta ainda, tratar como primeira resposta
          updatedState.lifestyle.push(userMessage)
          updatedState.waitingForMore = true
          return {
            nextStep: 'HABITOS_VIDA',
            response: ROTEIRO_PERGUNTAS.HABITOS_VIDA_CONTINUAR,
            updatedState
          }
        }
      } else {
        // Adicionar resposta
        updatedState.lifestyle.push(userMessage)
        // Só perguntar "o que mais" se a resposta for curta (provavelmente não terminou)
        // Se a resposta for longa, aguardar para ver se o usuário vai dizer "somente isso"
        const respostaLonga = userMessage.length > 50
        updatedState.waitingForMore = !respostaLonga
        return {
          nextStep: 'HABITOS_VIDA',
          response: respostaLonga ? 'Obrigada por compartilhar. Há mais algum hábito de vida que você gostaria de mencionar?' : ROTEIRO_PERGUNTAS.HABITOS_VIDA_CONTINUAR,
          updatedState
        }
      }
    
    case 'PERGUNTAS_OBJETIVAS_FINAIS':
      if (!updatedState.allergies) {
        updatedState.allergies = userMessage
        return {
          nextStep: 'PERGUNTAS_OBJETIVAS_FINAIS',
          response: ROTEIRO_PERGUNTAS.PERGUNTAS_OBJETIVAS_FINAIS.MEDICACOES_REGULARES,
          updatedState
        }
      } else if (!updatedState.medicationsRegular) {
        updatedState.medicationsRegular = userMessage
        return {
          nextStep: 'PERGUNTAS_OBJETIVAS_FINAIS',
          response: ROTEIRO_PERGUNTAS.PERGUNTAS_OBJETIVAS_FINAIS.MEDICACOES_ESPORADICAS,
          updatedState
        }
      } else if (!updatedState.medicationsSporadic) {
        updatedState.medicationsSporadic = userMessage
        return {
          nextStep: 'PERGUNTAS_OBJETIVAS_FINAIS',
          response: ROTEIRO_PERGUNTAS.PERGUNTAS_OBJETIVAS_FINAIS.CANNABIS,
          updatedState
        }
      } else {
        updatedState.cannabisUse = userMessage
        updatedState.step = 'FECHAMENTO_CONSENSUAL'
        return {
          nextStep: 'FECHAMENTO_CONSENSUAL',
          response: ROTEIRO_PERGUNTAS.FECHAMENTO_CONSENSUAL_INICIO,
          updatedState
        }
      }
    
    case 'FECHAMENTO_CONSENSUAL':
      // Verificar se o paciente concordou
      const concordo = 
        lowerMessage.includes('concordo') || 
        lowerMessage.includes('sim') || 
        lowerMessage.includes('está correto') || 
        lowerMessage.includes('está certo') ||
        lowerMessage.includes('correto') ||
        lowerMessage.includes('perfeito') ||
        (lowerMessage.includes('ok') && lowerMessage.length < 10) ||
        (lowerMessage.includes('tudo certo') && lowerMessage.length < 15)
      
      if (concordo) {
        // Paciente concordou, avançar para RECOMENDACAO_FINAL
        updatedState.step = 'RECOMENDACAO_FINAL'
        return {
          nextStep: 'RECOMENDACAO_FINAL',
          response: '', // A resposta será gerada no noaResidentAI.ts
          updatedState
        }
      } else {
        // Paciente não concordou ou quer adicionar algo, manter no fechamento consensual
        return {
          nextStep: 'FECHAMENTO_CONSENSUAL',
          response: ROTEIRO_PERGUNTAS.FECHAMENTO_CONSENSUAL_PERGUNTA,
          updatedState
        }
      }
    
    default:
      return {
        nextStep: state.step,
        response: 'Por favor, continue...',
        updatedState
      }
  }
}

export function generateConsensualReview(state: AssessmentRoteiroState): string {
  // Gerar revisão consensual baseada em todos os dados coletados
  let review = ''
  
  if (state.apresentacao) {
    review += `Você se apresentou como ${state.apresentacao}.\n\n`
  }
  
  if (state.complaints.length > 0) {
    review += `Você mencionou as seguintes questões: ${state.complaints.join(', ')}.\n\n`
  }
  
  if (state.mainComplaint) {
    review += `A questão que mais te incomoda é: ${state.mainComplaint}.\n\n`
    
    if (state.complaintDetails) {
      const d = state.complaintDetails
      if (d.location) review += `Você sente isso em: ${d.location}.\n`
      if (d.when) review += `Isso começou: ${d.when}.\n`
      if (d.how) review += `A característica é: ${d.how}.\n`
      if (d.associated) review += `Quando está com isso, você também sente: ${d.associated}.\n`
      if (d.improves) review += `O que melhora: ${d.improves}.\n`
      if (d.worsens) review += `O que piora: ${d.worsens}.\n\n`
    }
  }
  
  if (state.medicalHistory.length > 0) {
    review += `Sobre sua história de saúde: ${state.medicalHistory.join(', ')}.\n\n`
  }
  
  if (state.familyHistoryMother.length > 0 || state.familyHistoryFather.length > 0) {
    review += `Na sua família, por parte da mãe: ${state.familyHistoryMother.join(', ')}. `
    review += `Por parte do pai: ${state.familyHistoryFather.join(', ')}.\n\n`
  }
  
  if (state.lifestyle.length > 0) {
    review += `Sobre seus hábitos de vida: ${state.lifestyle.join(', ')}.\n\n`
  }
  
  if (state.allergies) {
    review += `Você tem alergias: ${state.allergies}.\n`
  }
  
  if (state.medicationsRegular) {
    review += `Medicações regulares: ${state.medicationsRegular}.\n`
  }
  
  if (state.medicationsSporadic) {
    review += `Medicações esporádicas: ${state.medicationsSporadic}.\n`
  }
  
  if (state.cannabisUse) {
    review += `Uso de cannabis medicinal: ${state.cannabisUse}.\n\n`
  }
  
  return review.trim()
}

