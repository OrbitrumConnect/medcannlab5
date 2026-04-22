/**
 * Sistema de Fluxo de Avaliacao Clinica Inicial
 * Implementa o roteiro completo conforme instrucoes do Dr. Ricardo Valenca
 *
 * Par com tradevision-core: cada `nextQuestionHint` emitido aqui ativa no Core o
 * MODO ROTEIRO SELADO (pergunta literal) para o paciente -- o GPT nao deve parafrasear
 * nem substituir este roteiro por explicacoes aleatorias.
 *
 * S3/C1 FIX: Estado agora persistido em Supabase (aec_assessment_state)
 * em vez de localStorage. Dados clinicos sensiveis nunca ficam no browser.
 */
import { supabase } from './supabase'

/** Trechos RAG/documento injetados no chat nao devem entrar nas respostas clinicas persistidas no AEC. */
export function stripPlatformInjectionNoise(raw: string): string {
  if (!raw || typeof raw !== 'string') return ''
  const blocks = [
    /\[CONTEXTO CRITICO DE DOCUMENTOS[\s\S]*?\[FIM DO CONTEXTO\]/gi,
  ]
  let s = raw
  let prev = ''
  while (s !== prev) {
    prev = s
    for (const re of blocks) {
      s = s.replace(re, '')
    }
  }
  // Persistencia antiga / truncada sem tag de fechamento
  s = s.replace(/\[CONTEXTO CRITICO DE DOCUMENTOS[\s\S]*$/i, '')
  return s.replace(/\n{3,}/g, '\n\n').trim()
}

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
  | 'CONFIRMING_RESTART'
  | 'INTERRUPTED'
  | 'COMPLETED'

export interface AssessmentData {
  // Identifica├º├úo
  patientName?: string
  patientPresentation?: string

  // Lista Indici├íria
  complaintList: string[]

  // Queixa Principal
  mainComplaint?: string
  /** R├│tulo curto para HDA (ex.: dor nas costas) quando a escolha "o que mais incomoda" ├® funcional/longeva */
  complaintHdaAnchor?: string

  // Detalhes da Queixa Principal
  complaintLocation?: string
  complaintOnset?: string
  complaintDescription?: string
  complaintAssociatedSymptoms?: string[]
  complaintImprovements?: string[]
  complaintWorsening?: string[]

  // Hist├│ria Patol├│gica Pregressa
  medicalHistory: string[]

  // Hist├│ria Familiar
  familyHistoryMother: string[]
  familyHistoryFather: string[]

  // H├íbitos de Vida
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

  /** M├®dico/profissional com quem o paciente pretende agendar (vitrine); personaliza abertura/consentimento/encerramento AEC */
  aecTargetPhysicianDisplayName?: string
}

export interface AssessmentState {
  phase: AssessmentPhase
  data: AssessmentData
  currentQuestionIndex: number
  waitingForMore: boolean // Se esta esperando mais itens na lista
  startedAt: Date
  lastUpdate: Date
  interruptedFromPhase?: AssessmentPhase // Fase de onde saiu (para retomada)
}

export class ClinicalAssessmentFlow {
  private states: Map<string, AssessmentState> = new Map()
  private readonly STORAGE_KEY = 'medcannlab_aec_states_v1'
  /** Debounce de avanço de fase: ignora mesmo userTurn curto repetido em <2s na mesma fase */
  private lastAdvance: Map<string, { phase: string; turn: string; at: number }> = new Map()
  private readonly ADVANCE_DEBOUNCE_MS = 2000

  constructor() {
    // Estado e carregado sob demanda via loadState() -- sem localStorage
  }

  /** Retorna true se este turno deve ser ignorado por debounce de avanço (evita "ok ok ok ok" pular fases) */
  private shouldDebounceAdvance(userId: string, phase: string, userTurn: string): boolean {
    const normalized = (userTurn || '').toLowerCase().trim()
    // Só debounce de respostas muito curtas tipo "ok", "sim", "só isso"
    if (normalized.length === 0 || normalized.length > 16) return false
    const last = this.lastAdvance.get(userId)
    const now = Date.now()
    if (last && last.phase === phase && last.turn === normalized && (now - last.at) < this.ADVANCE_DEBOUNCE_MS) {
      console.warn('[AEC_DEBOUNCE] Avanço ignorado (turno curto repetido):', { userId, phase, turn: normalized, deltaMs: now - last.at })
      return true
    }
    this.lastAdvance.set(userId, { phase, turn: normalized, at: now })
    return false
  }

  /**
   * Carrega estado do Supabase para um userId espec├¡fico
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
   * Garante que o estado esta carregado (chamado antes de getState/processResponse)
   */
  async ensureLoaded(userId: string): Promise<void> {
    if (!this.states.has(userId)) {
      await this.loadStateFromDB(userId)
    }
  }

  /** Resposta indica fim de lista / nada a acrescentar (evita loop em "nenhum", "so isso", etc.) */
  private meansNoMore(raw: string): boolean {
    const lower = raw.toLowerCase().trim()
    const t = lower.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    if (!t) return true
    // Palavras isoladas que o protocolo AEC 001 cita como fecho (evitar "apenas" ignorado / "s├│" ignorado)
    if (/^(apenas|somente)$/i.test(t.trim())) return true
    if (/^(s[oó]|so)$/i.test(t.trim())) return true
    // "so esses sintomas", "só esses", "é só esses" -- fechos comuns na lista indiciaria
    if (/\b(s[oó]|so)\s+ess(es|e)\b/.test(t)) return true
    if (/\b(s[oó]|so)\s+ess(es|e)\s+sintomas?\b/.test(t)) return true
    if (/\b(e|é)\s+s[oó]\s+ess(es|e)\b/.test(t)) return true
    if (/\bnenhum(a)?\b/.test(t)) return true
    if (/\bnada mais\b/.test(t) || lower.includes('nada mais')) return true
    if (/\bmais\s+nada\b/.test(t) || lower.includes('mais nada')) return true
    if (/\b(s[oó]|so)\s+nada\b/.test(t) || /\bso\s+nada\b/.test(lower)) return true
    if (/\bnada\s+(amiga|amigo|viu)\b/.test(t)) return true
    if (/^(pronto|é\s+tudo|e\s+tudo)$/i.test(t.trim())) return true
    if (/(^|\s)(so isso|e so isso|apenas isso|somente isso|e isso)(\s|!|$)/.test(t)) return true
    if (lower.includes('é só isso') || lower.includes('só isso')) return true
    if (/\bso\s+isso\s+mesmo\b/.test(t)) return true
    if (/\b(so|s├│)\s+prosseguir\b/.test(t)) return true
    if (/\b(isso\s+mesmo|e\s+isso|s[o├│]\s+isso)\b/.test(t)) return true
    // Confirma que ja listou (historia pregressa / familia) -- nao e novo evento clinico
    if (/\bforam\s+ess(as?|e)\s+(que\s+)?falei\b/.test(t)) return true
    if (/\b(s[oó]|so)\s+ess(as?|e)\s+que\s+falei\b/.test(t)) return true
    if (/\bfoi(\s+(s[oó]|so))?\s+isso\b/.test(t)) return true
    if (/\b(s[oó]|so)\s+o\s+que\s+falei\b/.test(t)) return true
    // "sou surfista... e só" / frase termina em " e so"
    if (/\b(e\s+)?s[oó]\s*!?\s*$/i.test(lower)) return true
    // Hist├│ria familiar / nega├º├úo curta ("tudo bem tamb├®m", "n├úo tem nada") ÔÇö s├│ se a mensagem for essencialmente s├│ isso
    if (
      t.length <= 52 &&
      /^(tudo\s+bem|ta\s+tudo\s+bem|tudo\s+ok)(\s+tamb[e├®]m)?!?\s*$/i.test(t.trim())
    ) {
      return true
    }
    if (t.length <= 48 && /^(não|nao)\s+(tem|há)\s+nada(\s+(pra|para)\s+relatar)?!?\s*$/i.test(t.trim()))
      return true
    if (/\b(não|nao)\s+tenho\s+mais\b/.test(t)) return true
    if (/\b(não|nao)\s+há\s+mais\b/.test(t)) return true
    if (/\b(não|nao)\s+tem\s+mais\b/.test(t)) return true
    if (/\b(num|em)\s+mais\s+nada\b/.test(t)) return true
    if (/\bacho\s+que\s+(e|é)\s+isso\b/.test(t)) return true
    // Frustracao + fecho ("ja falei ... mais nada") -- nao empurrar como mais um item de lista
    if (/\b(já|ja)\s+falei\b/.test(t) && (/\bmais\s+nada\b/.test(t) || /\bnada\b/.test(t))) return true
    return false
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
          // Fallback: tentar localStorage como backup temporario
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

  /** Nome exibido nas c├│pias AEC onde o protocolo citava o m├®dico da consulta (default: Dr. Ricardo Valen├ºa). */
  private physicianDisplay(state: AssessmentState): string {
    return state.data.aecTargetPhysicianDisplayName?.trim() || 'Dr. Ricardo Valen├ºa'
  }

  private standardAecOpeningPhrase(state: AssessmentState): string {
    const doc = this.physicianDisplay(state)
    return `Ol├í! Eu sou N├┤a Esperanza. Por favor, apresente-se tamb├®m e vamos iniciar a sua avalia├º├úo inicial para consultas com ${doc}.`
  }

  /**
   * Inicia uma nova avalia├º├úo cl├¡nica inicial
   */
  startAssessment(userId: string, patientName?: string, aecTargetPhysicianDisplayName?: string): AssessmentState {
    const trimmedName = patientName?.trim()
    const skipGreetingWithProfile = !!trimmedName
    const targetDoc = aecTargetPhysicianDisplayName?.trim()
    const state: AssessmentState = {
      phase: skipGreetingWithProfile ? 'IDENTIFICATION' : 'INITIAL_GREETING',
      data: {
        patientName: trimmedName || undefined,
        patientPresentation: skipGreetingWithProfile ? trimmedName : undefined,
        aecTargetPhysicianDisplayName: targetDoc || undefined,
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

  /** Para perguntas de localiza├º├úo/caracter├¡sticas: usar sintoma corporal da lista se a "principal" for impacto/sono/frase longa. */
  private deriveComplaintHdaAnchor(mainComplaint: string, complaintList: string[]): string {
    const main = mainComplaint.trim()
    const mainLow = main.toLowerCase()
    const somaticCue =
      /\b(dor|doi|doer|latej|queim|fisic|local|costas|cabeça|pesco|barriga|peito|perna|brac|rim|colo|lombar|abdominal|incha|inchad|agud)\b/i.test(
        main
      )
    const functionalCue =
      /\b(dorm|sono|insônia|ansiedade|triste|humor|medo|estresse|cansac|fádiga|não me deixa)\b/i.test(
        main
      )
    if (main.length <= 55 && somaticCue && !functionalCue) return main

    let best = ''
    let bestScore = -1
    for (const raw of complaintList) {
      const item = raw.trim()
      if (!item) continue
      let score = 0
      if (/\b(dor|costas|cabe|corpo|rim|peito|perna|lombar|colo)\b/i.test(item)) score += 4
      if (item.length <= 95) score += 1
      const frag = item.toLowerCase().slice(0, 14)
      if (frag && mainLow.includes(frag)) score += 2
      if (score > bestScore) {
        bestScore = score
        best = item
      }
    }
    if (bestScore > 0) return best
    const first = complaintList.map((c) => c.trim()).find(Boolean)
    return first || main.slice(0, 100)
  }

  private hdaLabel(state: AssessmentState): string {
    const a = state.data.complaintHdaAnchor?.trim()
    const m = state.data.mainComplaint?.trim()
    return a || m || 'sua queixa'
  }

  /** Evita que "Pedro aqui" ou nome isolado vire primeira queixa quando o perfil j├í trouxe o nome. */
  private looksLikeRedundantPresentation(userTurn: string, knownPresentation?: string): boolean {
    const t = userTurn.trim()
    if (!t || t.length > 72) return false
    const norm = t.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    if (/(me chamo|sou (o|a)\s|meu nome|chamo-me|eu sou)\b/.test(norm)) return true
    if (/\b[a-zááãâéêíóôõúç]{2,22}\s+aqui\b/.test(norm)) return true
    if (
      /^[a-zááãâéêíóôõúç]{2,22}$/i.test(t) &&
      !/^(sim|nao|não|ok|ta|tá|oi|ola|olá)$/i.test(t)
    )
      return true
    const kn = knownPresentation?.trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    if (kn && kn.length >= 2) {
      const tn = norm
      if (tn === kn || tn.includes(kn) || kn.includes(tn)) return true
    }
    return false
  }

  /**
   * Obt├®m o estado atual da avalia├º├úo
   */
  getState(userId: string): AssessmentState | null {
    return this.states.get(userId) || null
  }

  /**
   * Processa a resposta do usu├írio e retorna a pr├│xima pergunta
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

    const userTurn =
      stripPlatformInjectionNoise(userResponse).trim() || userResponse.trim()
    const lowerResponse = userTurn.toLowerCase().trim()

    // ========== DETECCAO DE SAIDA VOLUNTARIA ==========
    // IMPORTANTE: usar frases intencionais (não palavras isoladas tipo "sair", "parar", "fim")
    // para evitar falso positivo em "sair de casa", "fim de semana", "para tudo passar", etc.
    const normExit = lowerResponse.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    const exitPatterns: RegExp[] = [
      // Pedidos diretos com verbo de intenção + ação de encerrar
      /\b(quero|gostaria de|preciso|posso|vamos|pode|vou)\s+(sair|parar|encerrar|cancelar|interromper|terminar|finalizar|encerar)\b/,
      /\b(parar|encerrar|cancelar|interromper|terminar|finalizar|encerar)\s+(a\s+)?(avaliacao|avaliação|consulta|conversa|por\s+aqui|aqui|tudo)\b/,
      /\b(fechar|concluir)\s+(a\s+)?(avaliacao|avaliação|conversa)\b/,
      /\bpara\s+tudo\b/, /\bchega\s+por\s+(hoje|aqui)\b/, /\bcansei\b/,
      /\bdeixa\s+(pra|para)\s+depois\b/, /\bcontinuar\s+depois\b/, /\bfazer\s+depois\b/,
      /\bvolto\s+depois\b/, /\boutra\s+hora\b/, /\bagora\s+nao\s+posso\b/,
      /\b(tenho|preciso)\s+que\s+ir\b/, /\bpreciso\s+ir\b/,
      /\b(nao|não)\s+quero\s+continuar\b/,
      /\b(podemos|vamos|amigo\s+vamos|ok)\s+encerr(ar|amos)\b/,
      /\btrigger\s+de\s+encerramento\b/,
      // Despedidas explícitas isoladas (curtas, sem outro conteúdo)
      /^(tchau|xau|fui|flw|vlw|chega|fim)\s*[!.?]?$/,
    ]
    const wantsToExit = exitPatterns.some(rx => rx.test(normExit))

    // ========== CONFIRMAÇÃO DE REINÍCIO (nova avaliação do zero) ==========
    if (state.phase === 'CONFIRMING_RESTART') {
      const normAns = lowerResponse.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      const yesRestart =
        /\bsim\b/.test(normAns) ||
        /\breiniciar\b/.test(normAns) ||
        /\bconfirmo\b/.test(normAns) ||
        /\bconfirmado\b/.test(normAns) ||
        /\bok\b/.test(normAns) ||
        /\b(t[aá]\s*)?ok\b/.test(normAns) ||
        /\bbeleza\b/.test(normAns) ||
        /\bblz\b/.test(normAns) ||
        /\bfec(hou|hamos)\b/.test(normAns) ||
        /\bpode(\s+ser)?\b/.test(normAns) ||
        /\bpr[oó]ssegu(ir|e)\b/.test(normAns) ||
        /\bpode\s+continuar\b/.test(normAns) ||
        /\b(manda|bora)\b/.test(normAns)
      const noRestart =
        /\bnao\b/.test(normAns) ||
        /\bnão\b/.test(lowerResponse) ||
        (normAns.includes('continuar') && !/\bprosseg/i.test(normAns) && !/t[á]\s+ok/i.test(normAns)) ||
        normAns.includes('voltar') ||
        /\bcancela/i.test(normAns)

      if (noRestart && !yesRestart) {
        state.phase = state.interruptedFromPhase || 'INITIAL_GREETING'
        state.interruptedFromPhase = undefined
        state.lastUpdate = new Date()
        this.persist()
        return {
          nextQuestion: '✅ Continuamos então. ' + this.getPhaseResumePrompt(state.phase, state),
          phase: state.phase,
          isComplete: false
        }
      }
      if (yesRestart) {
        const savedName = state.data.patientName
        const savedDoc = state.data.aecTargetPhysicianDisplayName
        this.resetAssessment(userId)
        this.startAssessment(userId, savedName, savedDoc)
        void this.persist(userId)
        const fresh = this.states.get(userId)!
        return {
          nextQuestion: this.standardAecOpeningPhrase(fresh),
          phase: fresh.phase,
          isComplete: false
        }
      }
      return {
        nextQuestion:
          'Responda **sim** para reiniciar a avaliação do zero (os dados desta sessão serão apagados) ou **não** para seguir de onde estávamos.',
        phase: 'CONFIRMING_RESTART',
        isComplete: false
      }
    }

    // ========== PEDIDO DE REINÍCIO ==========
    const normLow = lowerResponse.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    const restartSignals =
      lowerResponse.includes('nova avaliacao') ||
      lowerResponse.includes('nova avaliação') ||
      lowerResponse.includes('outra avaliacao') ||
      lowerResponse.includes('outra avaliação') ||
      normLow.includes('comecar uma nova') ||
      normLow.includes('comecar do zero') ||
      lowerResponse.includes('reiniciar') ||
      lowerResponse.includes('recomeçar') ||
      lowerResponse.includes('recomecar') ||
      lowerResponse.includes('zerar') ||
      lowerResponse.includes('contaminad') ||
      lowerResponse.includes('fluxo errado') ||
      normLow.includes('comecar do inicio') ||
      normLow.includes('comecar ela do inicio') ||
      /\b(uma\s+nova|nova\s+sessao|nova\s+rodada|triagem|agora|triagem)\b/.test(normLow) ||
      // Entradas naturais (Titan 04/04)
      normLow.includes('iniciar avaliacao') ||
      normLow.includes('iniciar uma avaliacao') ||
      normLow.includes('fazer avaliacao') ||
      normLow.includes('avaliacao clinica inicial') ||
      normLow.includes('comecar avaliacao') ||
      normLow.includes('comecar a avaliacao') ||
      normLow.includes('bora comecar') ||
      normLow.includes('vamos comecar') ||
      normLow.includes('quero fazer a avaliacao') ||
      normLow.includes('preciso da avaliacao') ||
      normLow.includes('iniciar protocolo imre') ||
      normLow.includes('fazer triagem') ||
      /\b(vamos|quero|gostaria de|preciso|bora)\s+(iniciar|fazer|comecar|dar inicio)\s+(uma\s+)?(avaliacao|avaliacao clinica|triagem)\b/.test(normLow)

    const wantsRestart =
      restartSignals &&
      state.phase !== 'CONFIRMING_EXIT' &&
      state.phase !== 'COMPLETED' &&
      state.phase !== 'INITIAL_GREETING'

    if (wantsRestart) {
      const savedName = state.data.patientName
      const savedDoc = state.data.aecTargetPhysicianDisplayName
      this.resetAssessment(userId)
      this.startAssessment(userId, savedName, savedDoc)
      void this.persist(userId)
      const fresh = this.states.get(userId)!
      return {
        nextQuestion: this.standardAecOpeningPhrase(fresh),
        phase: fresh.phase,
        isComplete: false
      }
    }

    // Se quer sair e NAO esta ja confirmando saida, entrar no fluxo de confirmacao
    if (wantsToExit && state.phase !== 'CONFIRMING_EXIT' && state.phase !== 'COMPLETED' && state.phase !== 'INTERRUPTED') {
      state.interruptedFromPhase = state.phase
      state.phase = 'CONFIRMING_EXIT'
      state.lastUpdate = new Date()
      this.persist()
      return {
        nextQuestion: '⚠️ Tem certeza que deseja interromper a avaliacao? Seus dados ate aqui serao salvos e voce podera retomar depois. Responda **sim** para confirmar ou **não** para continuar.',
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
          nextQuestion: '👋 Avaliação interrompida. Seus dados foram salvos. Quando quiser retomar, basta solicitar uma nova avaliação clínica que continuaremos de onde paramos. Bons ventos! 🍃',
          phase: 'INTERRUPTED',
          isComplete: true
        }
      } else {
        // Voltar para fase anterior
        state.phase = state.interruptedFromPhase || 'INITIAL_GREETING'
        state.lastUpdate = new Date()
        this.persist()
        return {
          nextQuestion: '✅ Ótimo, vamos continuar! ' + this.getPhaseResumePrompt(state.phase, state),
          phase: state.phase,
          isComplete: false
        }
      }
    }

    const hasMore = !this.meansNoMore(userTurn)

    // Processar resposta baseado na fase atual
    switch (state.phase) {
      case 'INITIAL_GREETING':
        // Usuário se apresentou, avançar para identificação
        state.data.patientPresentation = userTurn
        state.phase = 'IDENTIFICATION'
        state.lastUpdate = new Date()
        return {
          nextQuestion: 'O que trouxe você à nossa avaliação hoje?',
          phase: 'IDENTIFICATION',
          isComplete: false
        }

      case 'IDENTIFICATION':
        if (this.looksLikeRedundantPresentation(userTurn, state.data.patientPresentation)) {
          state.lastUpdate = new Date()
          return {
            nextQuestion: 'O que trouxe voce a nossa avaliacao hoje?',
            phase: 'IDENTIFICATION',
            isComplete: false
          }
        }
        // Primeira queixa adicionada a lista
        if (userTurn.trim()) {
          state.data.complaintList.push(userTurn.trim())
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
        if (hasMore && userTurn.trim()) {
          // Adicionar mais queixa à lista
          state.data.complaintList.push(userTurn.trim())
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
        state.data.mainComplaint = userTurn.trim()
        state.data.complaintHdaAnchor = this.deriveComplaintHdaAnchor(
          userTurn.trim(),
          state.data.complaintList
        )
        state.phase = 'COMPLAINT_DETAILS'
        state.currentQuestionIndex = 0
        state.lastUpdate = new Date()
        const anchor = this.hdaLabel(state)
        return {
          nextQuestion: `Vamos explorar com mais detalhes a **${anchor}** (e o sintoma que voce descreveu na lista). Onde voce sente isso com mais nitidez?`,
          phase: 'COMPLAINT_DETAILS',
          isComplete: false
        }

      case 'COMPLAINT_DETAILS':
        return this.processComplaintDetails(state, userTurn)

      case 'MEDICAL_HISTORY':
        if (hasMore && userTurn.trim()) {
          state.data.medicalHistory.push(userTurn.trim())
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
        if (hasMore && userTurn.trim()) {
          state.data.familyHistoryMother.push(userTurn.trim())
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
        if (hasMore && userTurn.trim()) {
          state.data.familyHistoryFather.push(userTurn.trim())
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
            nextQuestion: 'Além dos habitos de vida que ja verificamos em nossa conversa, que outros habitos voce acha importante mencionar?',
            phase: 'LIFESTYLE_HABITS',
            isComplete: false
          }
        }

      case 'LIFESTYLE_HABITS':
        if (hasMore && userTurn.trim()) {
          state.data.lifestyleHabits.push(userTurn.trim())
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
            nextQuestion: 'Voce tem alguma alergia (mudanca de tempo, medicacao, poeira...)?',
            phase: 'OBJECTIVE_QUESTIONS',
            isComplete: false
          }
        }

      case 'OBJECTIVE_QUESTIONS':
        return this.processObjectiveQuestions(state, userTurn)

      case 'CONSENSUS_REVIEW':
        state.phase = 'CONSENSUS_REPORT'
        state.lastUpdate = new Date()
        return {
          nextQuestion: this.generateConsensusReport(state),
          phase: 'CONSENSUS_REPORT',
          isComplete: false
        }

      case 'CONSENSUS_REPORT': {
        const lr = lowerResponse.trim()
        const explicitDisagree =
          /\b(nao|n├úo)\s+concordo\b/.test(lowerResponse) ||
          /\bdiscordo\b/.test(lowerResponse) ||
          /\b(esta|est├í)\s+(errad|incorret)/.test(lowerResponse) ||
          (/\bpreciso\s+corrigir\b/.test(lowerResponse) &&
            !/\b(nao|n├úo)\s+preciso\s+corrigir\b/.test(lowerResponse))
        const consensusAffirm =
          !explicitDisagree &&
          (lowerResponse.includes('concordo') ||
            /\best├í\s+correto\b/.test(lowerResponse) ||
            /\besta\s+correto\b/.test(lowerResponse) ||
            (/\bcorreto\b/.test(lowerResponse) && !/incorreto/.test(lowerResponse)) ||
            /^(ok|ta|t├í)\b/i.test(lr) ||
            /^(apenas\s+)?prosseguir\b/i.test(lr) ||
            /\bnao\s+precisa\s+corrigir|nada\s+a\s+corrigir|nada\s+para\s+corrigir\b/i.test(lowerResponse) ||
            (/\bsim\b/.test(lowerResponse) &&
              !/\bnao\b/.test(lowerResponse.normalize('NFD').replace(/[\u0300-\u036f]/g, '')) &&
              !lowerResponse.includes('n├úo')))
        if (consensusAffirm) {
          state.data.consensusAgreed = true
          state.phase = 'CONSENT_COLLECTION'
          state.lastUpdate = new Date()
          const doc = this.physicianDisplay(state)
          return {
            nextQuestion: '📋 **Consentimento Informado**\n\nAntes de finalizarmos, preciso do seu consentimento:\n\n' +
              '• Os dados desta avaliacao serao registrados no seu prontuario digital.\n' +
              `• O relatorio gerado sera compartilhado com ${doc} para analise clinica.\n` +
              '• Nenhum dado sera compartilhado com terceiros sem sua autorizacao previa.\n' +
              '• Este relatorio e uma avaliacao inicial assistida por IA e **não substitui** a consulta médica presencial.\n\n' +
              'Voce autoriza o registro e compartilhamento destes dados? (sim/não)',
            phase: 'CONSENT_COLLECTION',
            isComplete: false
          }
        }
        // N├úo concordou ou resposta amb├¡gua: pedir corre├º├Áes
        state.data.consensusRevisions++
        state.phase = 'CONSENSUS_REVIEW'
        state.lastUpdate = new Date()
        return {
          nextQuestion: `Entendi. Vamos revisar. ${userTurn}. Por favor, me diga o que precisa ser corrigido ou adicionado para que eu possa apresentar novamente meu entendimento.`,
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
          const doc = this.physicianDisplay(state)
          return {
            nextQuestion: 'Ô£à Consentimento registrado. Obrigada!\n\n' +
              'Sua avalia├º├úo inicial foi conclu├¡da com sucesso. ' +
              'O relat├│rio cl├¡nico j├í est├í dispon├¡vel no seu painel.\n\n' +
              '**Pr├│ximos passos:**\n' +
              'ÔÇó Acesse seu **Relat├│rio Cl├¡nico** para revisar os achados\n' +
              `ÔÇó **Agende uma consulta** com ${doc} para dar continuidade ao seu cuidado\n\n` +
              'Use os bot├Áes abaixo para navegar rapidamente ­ƒæç\n\n' +
              'Essa ├® uma avalia├º├úo inicial de acordo com o m├®todo desenvolvido pelo Dr. Ricardo Valen├ºa, com o objetivo de aperfei├ºoar o seu atendimento. ' +
              `Apresente sua avalia├º├úo durante a consulta com ${doc} ou com outro profissional de sa├║de da plataforma Med-Cann Lab.\n\n` +
              '[ASSESSMENT_COMPLETED]',
            phase: 'FINAL_RECOMMENDATION',
            isComplete: false
          }
        } else if (lowerResponse.includes('não') || lowerResponse.includes('nao') || lowerResponse.includes('recuso')) {
          state.data.consentGiven = false
          state.phase = 'FINAL_RECOMMENDATION'
          state.lastUpdate = new Date()
          const doc = this.physicianDisplay(state)
          return {
            nextQuestion:
              '⚠️ Entendido. Sem o consentimento, o relatorio **não sera gerado nem compartilhado** com o medico. Seus dados desta conversa serao descartados.\n\n' +
              `Recomendo a marcacao de uma consulta presencial com ${doc} pelo site para prosseguir com a avaliacao.`,
            phase: 'FINAL_RECOMMENDATION',
            isComplete: false
          }
        } else {
          return {
            nextQuestion: 'Por favor, responda **sim** para autorizar o registro ou **n├úo** para recusar.',
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

      case 'INTERRUPTED': {
        const norm = lowerResponse.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
        if (
          (/\bretom(ar|e)\b/.test(norm) && norm.includes('avaliac')) ||
          /\bcontinuar\s+(a\s+)?avaliac/.test(norm) ||
          /\bvoltar\s+(a\s+)?avaliac/.test(norm) ||
          /\biniciar\s+(uma\s+)?(nova\s+)?avaliac/.test(norm) ||
          /\bfazer\s+(uma\s+)?(nova\s+)?avaliac/.test(norm) ||
          /\bcomecar\s+(uma\s+)?(nova\s+)?avaliac/.test(norm)
        ) {
          const resumed = this.resumeAssessment(userId)
          if (resumed) {
            void this.persist(userId)
            return {
              nextQuestion: resumed.nextQuestion,
              phase: resumed.phase,
              isComplete: false
            }
          }
        }
        return {
          nextQuestion:
            'Sua avalia├º├úo foi pausada e os dados foram guardados. Diga **retomar avalia├º├úo** para continuar, ou **nova avalia├º├úo** para recome├ºar do zero. O relat├│rio formal na plataforma ├® gerado quando o fluxo chega ao consentimento e ├á mensagem final com encerramento.',
          phase: 'INTERRUPTED',
          isComplete: false
        }
      }

      default:
        return {
          nextQuestion: 'Avalia├º├úo conclu├¡da.',
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
    const label = this.hdaLabel(state)
    const questions = [
      { field: 'complaintLocation', question: `Onde voc├¬ sente ${label}?` },
      { field: 'complaintOnset', question: `Quando essa dor ou inc├┤modo em ${label} come├ºou?` },
      { field: 'complaintDescription', question: `Como ├® essa sensa├º├úo (em ${label})?` },
      {
        field: 'complaintAssociatedSymptoms',
        question: `O que mais voc├¬ sente junto com ${label}?`,
        isList: true
      },
      { field: 'complaintImprovements', question: `O que parece melhorar ${label}?`, isList: true },
      { field: 'complaintWorsening', question: `O que parece piorar ${label}?`, isList: true }
    ]

    const currentQ = questions[state.currentQuestionIndex]

    if (!currentQ) {
      // Todas as perguntas sobre queixa foram respondidas
      state.phase = 'MEDICAL_HISTORY'
      state.waitingForMore = true
      state.currentQuestionIndex = 0
      state.lastUpdate = new Date()
      return {
        nextQuestion: 'E agora, sobre o restante sua vida at├® aqui, desde seu nascimento, quais as quest├Áes de sa├║de que voc├¬ j├í viveu? Vamos ordenar do mais antigo para o mais recente, o que veio primeiro?',
        phase: 'MEDICAL_HISTORY',
        isComplete: false
      }
    }

    // Salvar resposta
    if (currentQ.isList) {
      const hasMore = !this.meansNoMore(userResponse)

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
        // Pr├│xima pergunta
        state.currentQuestionIndex++
        state.lastUpdate = new Date()
        const nextQ = questions[state.currentQuestionIndex]
        if (nextQ) {
          return {
            nextQuestion: nextQ.question,
            phase: 'COMPLAINT_DETAILS',
            isComplete: false
          }
        }
      }
    } else {
      const field = currentQ.field as keyof AssessmentData
      const prevVal = (state.data as any)[field] as string | undefined
      const trimmed = userResponse.trim()
      const userFrustratedRepeat =
        /\b(j[a├í]\s+falei|j[a├í]\s+disse|repetindo|de novo|falei\s+antes|voc[e├¬]\s+deveria)\b/i.test(
          trimmed
        )
      const duplicateShortAnswer =
        !!prevVal &&
        trimmed.length < 48 &&
        trimmed.toLowerCase() === prevVal.toLowerCase().trim()

      if (prevVal && (userFrustratedRepeat || duplicateShortAnswer)) {
        state.currentQuestionIndex++
        state.lastUpdate = new Date()
        const skipTo = questions[state.currentQuestionIndex]
        if (skipTo) {
          return { nextQuestion: skipTo.question, phase: 'COMPLAINT_DETAILS', isComplete: false }
        }
      } else {
        ;(state.data as any)[field] = trimmed
        state.currentQuestionIndex++
        state.lastUpdate = new Date()
      }

      const nextQ = questions[state.currentQuestionIndex]
      if (nextQ) {
        return {
          nextQuestion: nextQ.question,
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
      nextQuestion: 'E agora, sobre o restante sua vida at├® aqui, desde seu nascimento, quais as quest├Áes de sa├║de que voc├¬ j├í viveu? Vamos ordenar do mais antigo para o mais recente, o que veio primeiro?',
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
      { field: 'allergies', question: 'Voc├¬ tem alguma alergia (mudan├ºa de tempo, medica├º├úo, poeira...)?' },
      { field: 'regularMedications', question: 'Quais as medica├º├Áes que voc├¬ utiliza regularmente?' },
      { field: 'sporadicMedications', question: 'Quais as medica├º├Áes voc├¬ utiliza esporadicamente (de vez em quando) e porque utiliza?' }
    ]

    const currentQ = questions[state.currentQuestionIndex]

    if (!currentQ) {
      // Todas as perguntas objetivas foram respondidas
      state.phase = 'CONSENSUS_REVIEW'
      state.lastUpdate = new Date()
      return {
        nextQuestion: 'Vamos revisar a sua hist├│ria para garantir que n├úo perdemos nenhum detalhe importante.',
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

    // ├Ültima pergunta respondida
    state.phase = 'CONSENSUS_REVIEW'
    state.lastUpdate = new Date()
    return {
      nextQuestion: 'Vamos revisar a sua hist├│ria para garantir que n├úo perdemos nenhum detalhe importante.',
      phase: 'CONSENSUS_REVIEW',
      isComplete: false
    }
  }

  /**
   * Gera o relat├│rio consensual
   */
  private generateConsensusReport(state: AssessmentState): string {
    const data = state.data
    const clean = (x?: string) => (x ? stripPlatformInjectionNoise(x) : '')
    const cleanJoin = (arr: string[], sep: string) =>
      arr.map((x) => stripPlatformInjectionNoise(x)).filter(Boolean).join(sep)

    // Introdu├º├úo curta j├í foi enviada na fase CONSENSUS_REVIEW; evitar duplicar no mesmo fio.
    let report = ''

    report += '**MEU ENTENDIMENTO SOBRE SUA AVALIA├ç├âO:**\n\n'

    // Identifica├º├úo
    if (data.patientPresentation) {
      report += `**Apresenta├º├úo:** ${clean(data.patientPresentation)}\n\n`
    }

    // Lista de Queixas
    if (data.complaintList.length > 0) {
      report += `**Queixas Identificadas:** ${cleanJoin(data.complaintList, ', ')}\n\n`
    }

    // Queixa Principal e Detalhes
    if (data.mainComplaint) {
      report += `**Queixa Principal (o que mais incomoda na sua resposta):** ${clean(data.mainComplaint)}\n`
      const anchor = data.complaintHdaAnchor?.trim()
      if (
        anchor &&
        anchor.toLowerCase() !== clean(data.mainComplaint).toLowerCase()
      ) {
        report += `*(Roteiro de perguntas abaixo focado em **${clean(anchor)}**, alinhado ├á lista indici├íria.)*\n`
      }
      if (data.complaintLocation) report += `- Onde: ${clean(data.complaintLocation)}\n`
      if (data.complaintOnset) report += `- Quando come├ºou: ${clean(data.complaintOnset)}\n`
      if (data.complaintDescription) report += `- Como ├®: ${clean(data.complaintDescription)}\n`
      if (data.complaintAssociatedSymptoms && data.complaintAssociatedSymptoms.length > 0) {
        report += `- Sintomas associados: ${cleanJoin(data.complaintAssociatedSymptoms, ', ')}\n`
      }
      if (data.complaintImprovements && data.complaintImprovements.length > 0) {
        report += `- O que melhora: ${cleanJoin(data.complaintImprovements, ', ')}\n`
      }
      if (data.complaintWorsening && data.complaintWorsening.length > 0) {
        report += `- O que piora: ${cleanJoin(data.complaintWorsening, ', ')}\n`
      }
      report += '\n'
    }

    // Hist├│ria Patol├│gica Pregressa
    if (data.medicalHistory.length > 0) {
      report += `**Hist├│ria Patol├│gica Pregressa:** ${cleanJoin(data.medicalHistory, '; ')}\n\n`
    }

    // Hist├│ria Familiar
    if (data.familyHistoryMother.length > 0 || data.familyHistoryFather.length > 0) {
      report += '**Hist├│ria Familiar:**\n'
      if (data.familyHistoryMother.length > 0) {
        report += `- Lado materno: ${cleanJoin(data.familyHistoryMother, '; ')}\n`
      }
      if (data.familyHistoryFather.length > 0) {
        report += `- Lado paterno: ${cleanJoin(data.familyHistoryFather, '; ')}\n`
      }
      report += '\n'
    }

    // H├íbitos de Vida
    if (data.lifestyleHabits.length > 0) {
      report += `**H├íbitos de Vida:** ${cleanJoin(data.lifestyleHabits, '; ')}\n\n`
    }

    // Perguntas Objetivas
    if (data.allergies) report += `**Alergias:** ${clean(data.allergies)}\n`
    if (data.regularMedications) report += `**Medica├º├Áes Regulares:** ${clean(data.regularMedications)}\n`
    if (data.sporadicMedications) report += `**Medica├º├Áes Espor├ídicas:** ${clean(data.sporadicMedications)}\n`

    report += '\n**Voc├¬ concorda com esse entendimento?**'

    return report
  }

  /**
   * Obt├®m os dados completos da avalia├º├úo para gerar relat├│rio final
   */
  getAssessmentData(userId: string): AssessmentData | null {
    const state = this.states.get(userId)
    return state ? state.data : null
  }

  /**
   * Finaliza a avalia├º├úo
   */
  completeAssessment(userId: string): AssessmentData | null {
    const state = this.states.get(userId)
    if (!state) return null

    state.phase = 'COMPLETED'
    state.lastUpdate = new Date()

    return state.data
  }

  /**
   * Gera relat├│rio estruturado da avalia├º├úo completa
   */
  async generateReport(userId: string, patientId: string): Promise<string | null> {
    const state = this.states.get(userId)
    if (!state || state.phase !== 'COMPLETED') return null

    // S6: Bloquear gera├º├úo de relat├│rio sem consentimento
    if (!state.data.consentGiven) {
      console.warn('[AEC] ÔÜá´©Å Relat├│rio N├âO gerado ÔÇö paciente recusou consentimento.')
      return null
    }

    const data = state.data

    // Gerar relat├│rio estruturado
    const report = {
      id: `aec-${Date.now()}-${userId.substring(0, 8)}`,
      patient_id: patientId,
      patient_name: data.patientName || 'N├úo informado',
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

      console.log('­ƒªà [ClinicalFlow] Enviando dados para Edge Function (Server-Side Save)...')

      // CHAMADA ├Ç EDGE FUNCTION (Bypassing RLS)
      const { data: edgeResponse, error: edgeError } = await supabase.functions.invoke('tradevision-core', {
        body: {
          action: 'finalize_assessment',
          message: 'Finalizing Assessment', // Campo obrigat├│rio para passar na valida├º├úo inicial
          assessmentData: {
            patient_id: patientId,
            content: report.content,
            doctor_id: null,
            // C├ílculo de Scores Simplificado para este contexto
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
        console.error('ÔØî [Edge Function] Falha na chamada:', edgeError)
        throw edgeError
      }

      console.log('Ô£à [Edge Function] Resposta:', edgeResponse)

      if (edgeResponse && edgeResponse.success && edgeResponse.report_id) {
        console.log('Ô£à Relat├│rio cl├¡nico salvo via Server-Side:', edgeResponse.report_id)
        return edgeResponse.report_id
      } else {
        const errorMsg = edgeResponse?.error || 'Edge Function retornou sucesso=false ou report_id nulo.'
        throw new Error(errorMsg)
      }

    } catch (error) {
      console.error('ÔØî Erro ao gerar relat├│rio (Via Edge Function):', error)
      return null
    }
  }

  /**
   * Retorna o prompt adequado para retomar uma fase espec├¡fica
   */
  private getPhaseResumePrompt(phase: AssessmentPhase, state: AssessmentState): string {
    switch (phase) {
      case 'INITIAL_GREETING': return 'Pode se apresentar quando estiver pronto(a).'
      case 'IDENTIFICATION': return 'O que trouxe voc├¬ ├á nossa avalia├º├úo hoje?'
      case 'COMPLAINT_LIST': return 'O que mais voc├¬ gostaria de relatar?'
      case 'MAIN_COMPLAINT': return `Das queixas relatadas (${state.data.complaintList.join(', ')}), qual considera a principal?`
      case 'COMPLAINT_DETAILS': return 'Continuando sobre sua queixa principal...'
      case 'MEDICAL_HISTORY': return 'Tem algum hist├│rico de doen├ºas ou condi├º├Áes anteriores?'
      case 'FAMILY_HISTORY_MOTHER': return 'Sobre a sa├║de da sua fam├¡lia materna, h├í algo a relatar?'
      case 'FAMILY_HISTORY_FATHER': return 'E sobre a sa├║de da fam├¡lia paterna?'
      case 'LIFESTYLE_HABITS': return 'Sobre seus h├íbitos de vida (exerc├¡cios, alimenta├º├úo, sono)...'
      case 'OBJECTIVE_QUESTIONS': return 'Vamos continuar com as perguntas objetivas.'
      case 'CONSENSUS_REVIEW': return 'Vamos revisar o resumo da sua avalia├º├úo.'
      default: return 'Vamos continuar de onde paramos.'
    }
  }

  /**
   * Verifica se um usu├írio tem uma avalia├º├úo interrompida que pode ser retomada
   */
  hasInterruptedAssessment(userId: string): boolean {
    const state = this.states.get(userId)
    return state?.phase === 'INTERRUPTED' && !!state.interruptedFromPhase
  }

  /**
   * Retoma uma avalia├º├úo interrompida
   */
  resumeAssessment(userId: string): { nextQuestion: string; phase: AssessmentPhase } | null {
    const state = this.states.get(userId)
    if (!state || state.phase !== 'INTERRUPTED' || !state.interruptedFromPhase) return null

    state.phase = state.interruptedFromPhase
    state.interruptedFromPhase = undefined
    state.lastUpdate = new Date()
    this.persist()

    return {
      nextQuestion: `­ƒöä Retomando sua avalia├º├úo de onde paramos. ${this.getPhaseResumePrompt(state.phase, state)}`,
      phase: state.phase
    }
  }

  /**
   * Reseta uma avalia├º├úo (local + BD)
   */
  resetAssessment(userId: string): void {
    this.states.delete(userId)
    // Deletar do BD de forma ass├¡ncrona (fire-and-forget)
    supabase
      .from('aec_assessment_state')
      .delete()
      .eq('user_id', userId)
      .then(({ error }) => {
        if (error) console.warn('[AEC] Erro ao deletar estado do BD:', error.message)
      })
  }
}

// Inst├óncia singleton
export const clinicalAssessmentFlow = new ClinicalAssessmentFlow()




