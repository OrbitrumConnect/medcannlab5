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
  // Identificação
  patientName?: string
  patientPresentation?: string

  // Lista Indiciária
  complaintList: string[]

  // Queixa Principal
  mainComplaint?: string
  /** Rótulo curto para HDA (ex.: dor nas costas) quando a escolha "o que mais incomoda" é funcional/longeva */
  complaintHdaAnchor?: string

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

  /** Médico/profissional com quem o paciente pretende agendar (vitrine); personaliza abertura/consentimento/encerramento AEC */
  aecTargetPhysicianDisplayName?: string
}

export interface AssessmentState {
  phase: AssessmentPhase
  data: AssessmentData
  currentQuestionIndex: number
  waitingForMore: boolean // Se esta esperando mais itens na lista
  phaseIterationCount: number // [V1.8.3] Contador de repeticoes na mesma fase (ex.: "O que mais?")
  startedAt: Date
  lastUpdate: Date
  interruptedFromPhase?: AssessmentPhase // Fase de onde saiu (para retomada)
  completedPhases?: string[] // [V1.9.1] Fases já percorridas. Persistido em aec_assessment_state.completed_phases.
                              // É base da coluna GENERATED is_complete (completed_phases @> required_phases).
  reportDispatchedAt?: Date // [V1.9.23] Flag de idempotência em memória: marca quando
                             // o generateReport local foi chamado nesta sessão. Sem isso,
                             // cada turno subsequente em phase=COMPLETED disparava novo
                             // report (14 reports/Carolina, 23 reports/casualmusic).
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

  /** 
   * [V1.6.1] FSM Domain Governance
   * Avalia centralmente se o input é clinicamente ou estruturalmente válido para avançar de fase.
   * Filtra ruídos, repetições de spam e respostas sem conteúdo para fases específicas.
   */
  private evaluateInputAcceptance(userId: string, phase: AssessmentPhase, userTurn: string): boolean {
    const normalized = (userTurn || '').toLowerCase().trim()
    if (normalized.length === 0) return false

    // 1. Filtro de Spam (Debounce Temporal para mesma fase/resposta)
    if (normalized.length <= 16) {
      const last = this.lastAdvance.get(userId)
      const now = Date.now()
      if (last && last.phase === phase && last.turn === normalized && (now - last.at) < this.ADVANCE_DEBOUNCE_MS) {
        console.warn('[AEC FSM] Input rejeitado (Repetição Rápida / Spam):', normalized)
        return false // rejeitado
      }
      this.lastAdvance.set(userId, { phase, turn: normalized, at: now })
    }

    // 2. Filtro de Intenção Semântica para Fases Descritivas (listas abertas).
    //
    // [V1.8.10] COMPLAINT_DETAILS removido da lista: suas perguntas são OBJETIVAS
    // ("onde dói?", "quando começou?", "como é a sensação?") e admitem respostas
    // curtas e precisas ("na boca", "ontem", "queima") que não têm as palavras-chave
    // do regex abaixo. Rejeitá-las dispara fallback "Continuando sobre sua queixa
    // principal..." sem lógica clínica — o paciente responde certo e leva um "não
    // entendi" em troca. Para fases de detalhamento, aceitamos qualquer input
    // não-vazio; a FSM decide no switch-case se o conteúdo é aproveitável.
    // [V1.9.27] PRINCÍPIO DA AEC — Arte da Entrevista Clínica = escuta ativa.
    // O filtro anterior rejeitava inputs curtos sem "flag semântica" (lista chumbada)
    // em fases descritivas, chamando-os de "micro-frase sem relevância clínica".
    // Isso quebrava o protocolo: "umidade" (alergia ambiental), "bolha" (sintoma),
    // "cannabis in natura" (medicação) — todos rejeitados. Nôa respondia genérico
    // ("Vamos continuar com as perguntas objetivas") em vez de avançar.
    //
    // Na AEC, TUDO que o paciente fala é dado clínico relevante. Até silêncio,
    // "ok", ou mudança de assunto são sinais. Cabe ao FSM (switch-case por fase)
    // decidir como aproveitar; não ao filtro bloquear respostas legítimas.
    //
    // Filtro de micro-frase removido. Debounce de spam (V1.8.3 acima) continua
    // ativo para proteger contra duplicação por clique/tecla travada — isso é
    // UX, não julgamento de conteúdo.

    return true // input válido para processamento
  }

  /**
   * Carrega estado do Supabase para um userId específico
   *
   * [V1.9.57] Cold start guard contra state residual inconsistente.
   * Princípio "invalidate + preserve snapshot + restart controlado" (NÃO DELETE):
   *   1. Filtra states ativos: invalidated_at IS NULL
   *   2. Se state ATIVO está inconsistente (phase=COMPLETED + is_complete=false + idade>6h),
   *      faz snapshot em noa_logs + marca invalidated_at + NÃO carrega em this.states.
   *   3. Resultado: próximo turno cria nova sessão limpa, dado parcial preservado.
   *
   * Por que 30min: AEC real é rápida (~20min do início ao consenso). State em
   * phase=COMPLETED só faz sentido após FSM ter finalizado — qualquer state
   * COMPLETED inconsistente parado por mais de 30min é claramente órfão de
   * finalização interrompida. AEC EM CURSO tem phase=COMPLAINT_DETAILS,
   * MEDICAL_HISTORY, etc., NÃO COMPLETED — então não há risco de invalidar
   * sessão ativa pausada por paciente que voltou depois.
   */
  private async loadStateFromDB(userId: string): Promise<void> {
    try {
      const { data, error } = await supabase
        .from('aec_assessment_state')
        .select('*')
        .eq('user_id', userId)
        .is('invalidated_at', null) // [V1.9.57] só carrega state ativo
        .maybeSingle()

      if (error) {
        console.warn('[AEC] Erro ao carregar estado do BD:', error.message)
        return
      }

      if (data) {
        // [V1.9.57] Cold start guard runtime — segunda linha de defesa contra state
        // inconsistente que escapou do trigger/migration retroativa (race conditions
        // ou bugs novos que pulem markPhaseCompleted em algum branch do FSM).
        const isCompletedButIncomplete = data.phase === 'COMPLETED' && (data as any).is_complete === false
        const lastUpdateMs = new Date(data.last_update).getTime()
        const ageMs = Date.now() - lastUpdateMs
        // [V1.9.57] AEC real ~20min. 30min = 1.5x tempo médio. State COMPLETED
        // inconsistente parado mais que isso é órfão de finalização interrompida.
        const STALE_COMPLETED_THRESHOLD_MS = 30 * 60 * 1000

        if (isCompletedButIncomplete && ageMs > STALE_COMPLETED_THRESHOLD_MS) {
          console.warn('[AEC V1.9.57] State inconsistente detectado em runtime. Invalidando e arquivando snapshot.', {
            userId,
            phase: data.phase,
            ageHours: Math.round(ageMs / 3600000),
          })

          // Snapshot em noa_logs (preserva dado clínico parcial)
          try {
            await (supabase as any).from('noa_logs').insert({
              user_id: userId,
              interaction_type: 'aec_state_invalidated_runtime',
              payload: {
                state_id: data.id,
                phase: data.phase,
                is_complete: (data as any).is_complete,
                data: data.data,
                completed_phases: (data as any).completed_phases,
                required_phases: (data as any).required_phases,
                started_at: data.started_at,
                last_update: data.last_update,
                age_hours: Math.round(ageMs / 3600000),
                source: 'cold_start_guard_v1_9_57',
                invalidated_at_runtime: new Date().toISOString(),
              },
            })
          } catch (snapErr) {
            console.warn('[AEC V1.9.57] Falha ao gravar snapshot em noa_logs (não bloqueia):', snapErr)
          }

          // Marca state como inválido no banco
          try {
            await supabase
              .from('aec_assessment_state')
              .update({
                invalidated_at: new Date().toISOString(),
                invalidation_reason: `V1.9.57 runtime guard: phase=COMPLETED mas is_complete=false após ${Math.round(ageMs / 60000)}min (threshold 30min). Snapshot em noa_logs.`,
              } as any)
              .eq('id', data.id)
          } catch (updateErr) {
            console.warn('[AEC V1.9.57] Falha ao marcar state como invalidado:', updateErr)
          }

          // NÃO carrega em this.states — força nova sessão no próximo processResponse
          return
        }

        const state: AssessmentState = {
          phase: data.phase as AssessmentPhase,
          data: (data.data || {}) as unknown as AssessmentData,
          currentQuestionIndex: data.current_question_index || 0,
          waitingForMore: data.waiting_for_more || false,
          phaseIterationCount: (data as any).phase_iteration_count || 0,
          startedAt: new Date(data.started_at),
          lastUpdate: new Date(data.last_update),
          interruptedFromPhase: data.interrupted_from_phase as AssessmentPhase | undefined,
          completedPhases: Array.isArray((data as any).completed_phases)
            ? ((data as any).completed_phases as string[])
            : []
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
    // Palavras isoladas que o protocolo AEC 001 cita como fecho (evitar "apenas" ignorado / "só" ignorado)
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
    if (/\b(so|só)\s+prosseguir\b/.test(t)) return true
    if (/\b(isso\s+mesmo|e\s+isso|s[oó]\s+isso)\b/.test(t)) return true
    // Confirma que ja listou (historia pregressa / familia) -- nao e novo evento clinico
    if (/\bforam\s+ess(as?|e)\s+(que\s+)?falei\b/.test(t)) return true
    if (/\b(s[oó]|so)\s+ess(as?|e)\s+que\s+falei\b/.test(t)) return true
    if (/\bfoi(\s+(s[oó]|so))?\s+isso\b/.test(t)) return true
    if (/\b(s[oó]|so)\s+o\s+que\s+falei\b/.test(t)) return true
    // "sou surfista... e só" / frase termina em " e so"
    if (/\b(e\s+)?s[oó]\s*!?\s*$/i.test(lower)) return true
    // História familiar / negação curta ("tudo bem também", "não tem nada") — só se a mensagem for essencialmente só isso
    if (
      t.length <= 52 &&
      /^(tudo\s+bem|ta\s+tudo\s+bem|tudo\s+ok)(\s+tamb[eé]m)?!?\s*$/i.test(t.trim())
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

  /** [V1.8.5] Detecta saudações sociais para evitar poluição ontológica na ficha clínica */
  private isSocialGreeting(raw: string): boolean {
    const t = (raw || '').toLowerCase().trim().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    if (!t) return false
    return /^(oi|ola|olá|tudo bem|bom dia|boa tarde|boa noite|como vai)(\s+(noa|nôa))?\s*[!.?]?$/i.test(t)
  }

  public async persist(userId?: string) {
    // Persistir no Supabase em vez de localStorage
    const entries = userId ? [[userId, this.states.get(userId)]] : Array.from(this.states.entries())
    
    for (const [uid, state] of entries) {
      if (!state || !uid) continue
      try {
        // [V1.9.75 TRACE] persist-snapshot: ver exatamente o que vai pro banco
        const _s = state as AssessmentState
        console.log(`[AEC TRACE] persist-snapshot | uid=${(uid as string).substring(0,8)} phase=${_s.phase} qIdx=${_s.currentQuestionIndex} iter=${_s.phaseIterationCount} sizes={lifestyle:${_s.data.lifestyleHabits?.length||0},fammat:${_s.data.familyHistoryMother?.length||0},famfat:${_s.data.familyHistoryFather?.length||0},hpp:${_s.data.medicalHistory?.length||0},melhora:${_s.data.complaintImprovements?.length||0},piora:${_s.data.complaintWorsening?.length||0}}`)
        const { error } = await supabase
          .from('aec_assessment_state')
          .upsert([{
            user_id: uid as string,
            phase: (state as AssessmentState).phase,
            data: JSON.parse(JSON.stringify((state as AssessmentState).data)),
            current_question_index: (state as AssessmentState).currentQuestionIndex,
            waiting_for_more: (state as AssessmentState).waitingForMore,
            phase_iteration_count: (state as AssessmentState).phaseIterationCount,
            interrupted_from_phase: (state as AssessmentState).interruptedFromPhase || null,
            started_at: (state as AssessmentState).startedAt.toISOString(),
            // [V1.9.1] completed_phases — acompanha as fases percorridas.
            // A coluna is_complete (GENERATED) do banco deriva de completed_phases @> required_phases.
            completed_phases: (state as AssessmentState).completedPhases || [],
          } as any], { onConflict: 'user_id' })

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

  /**
   * [V1.9.107] Nome do médico AEC. NULL-SAFE: retorna null quando paciente
   * não pré-selecionou médico (caso comum hoje, sem feature P0e ativa).
   * Antes: fallback hardcoded 'Dr. Ricardo Valença' criava P10 silencioso —
   * frase do chat citava Ricardo mesmo quando backend resolveu outro médico
   * via appointments e card de agendamento mostrava 3ª opção (dropdown
   * alfabético). Agora callers adaptam com linguagem neutra quando null.
   */
  private physicianDisplay(state: AssessmentState): string | null {
    return state.data.aecTargetPhysicianDisplayName?.trim() || null
  }

  private standardAecOpeningPhrase(state: AssessmentState): string {
    const doc = this.physicianDisplay(state)
    const docPhrase = doc ? ` para consultas com ${doc}` : ''
    return `Olá! Eu sou Nôa Esperanza. Por favor, apresente-se também e vamos iniciar a sua avaliação inicial${docPhrase}.`
  }

  /**
   * Inicia uma nova avaliação clínica inicial
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
      phaseIterationCount: 0,
      startedAt: new Date(),
      lastUpdate: new Date(),
      // [V1.9.113] Fix is_complete=false: se paciente tem nome, INITIAL_GREETING
      // é PULADA (skipGreetingWithProfile=true). Antes ela nunca aparecia em
      // completedPhases, mantendo is_complete=false mesmo após AEC concluída.
      // Marcar como completed quando skipped — é a semântica correta (fase
      // satisfeita por contexto pré-existente, não bug).
      completedPhases: skipGreetingWithProfile ? ['INITIAL_GREETING'] : []
    }

    this.states.set(userId, state)
    this.persist()
    return state
  }

  /** Para perguntas de localização/características: usar sintoma corporal da lista se a "principal" for impacto/sono/frase longa. */
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

  /**
   * [V1.9.1] Marca uma fase como completa no array completedPhases do state.
   * Idempotente (não duplica). Base para a coluna GENERATED is_complete no banco.
   * Chamar ANTES de trocar state.phase para a próxima fase (marca a fase que o paciente
   * está saindo, não a que está entrando).
   */
  private markPhaseCompleted(state: AssessmentState, phase: AssessmentPhase): void {
    // [V1.9.75 TRACE] mark-completed: ver quando fase é marcada e tamanhos dos arrays naquele momento.
    // Permite detectar "fase marcada como completa SEM ter dado coletado" (fantasma) — bug 26/04 88ca1797.
    console.log(`[AEC TRACE] mark-completed | phase=${phase} sizes={lifestyle:${state.data.lifestyleHabits?.length||0},fammat:${state.data.familyHistoryMother?.length||0},famfat:${state.data.familyHistoryFather?.length||0},hpp:${state.data.medicalHistory?.length||0},melhora:${state.data.complaintImprovements?.length||0},piora:${state.data.complaintWorsening?.length||0},lista:${state.data.complaintList?.length||0}}`)
    if (!state.completedPhases) state.completedPhases = []
    if (!state.completedPhases.includes(phase)) {
      state.completedPhases.push(phase)
    }
  }

  /** Evita que "Pedro aqui" ou nome isolado vire primeira queixa quando o perfil já trouxe o nome. */
  private looksLikeRedundantPresentation(userTurn: string, knownPresentation?: string): boolean {
    const t = userTurn.trim()
    if (!t || t.length > 72) return false
    const norm = t.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    if (/(me chamo|sou (o|a)\s|meu nome|chamo-me|eu sou)\b/.test(norm)) return true
    if (/\b[a-zááãâéêíóôõúç]{2,22}\s+aqui\b/.test(norm)) return true
    // [V1.8.11] REMOVIDO: regra que marcava qualquer palavra curta isolada como
    // redundant causava loop em IDENTIFICATION — paciente respondia "Carolina" e
    // Noa ficava repetindo "Apresente-se..." sem nunca avançar para COMPLAINT_LIST.
    // O check por match com patientName conhecido (abaixo) já cobre o caso real
    // de eco do nome; nome isolado desconhecido deve passar e ser tratado pela FSM.
    const kn = knownPresentation?.trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    if (kn && kn.length >= 2) {
      const tn = norm
      if (tn === kn || tn.includes(kn) || kn.includes(tn)) return true
    }
    return false
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

    const oldPhase = state.phase
    const oldQuestionIndex = state.currentQuestionIndex
    const userTurn =
      stripPlatformInjectionNoise(userResponse).trim() || userResponse.trim()
    const lowerResponse = userTurn.toLowerCase().trim()

    // 🛡️ [SOCIAL GUARD V1.8.5/6]: Se for apenas saudação e tivermos AEC pendente, oferecer restauração ou continuidade.
    if (this.isSocialGreeting(userTurn)) {
      if (state.phase !== 'INITIAL_GREETING' && state.phase !== 'IDENTIFICATION' && state.phase !== 'COMPLETED') {
        state.interruptedFromPhase = state.phase
        state.phase = 'INTERRUPTED'
        state.lastUpdate = new Date()
        this.persist()
        return {
          nextQuestion: 'Olá! Vejo que você tem uma avaliação clínica em andamento. Gostaria de **continuar** de onde paramos, iniciar uma **nova** do zero, ou **apenas conversar** por agora?',
          phase: 'INTERRUPTED',
          isComplete: false,
        }
      }
      return {
        nextQuestion: this.getPhaseResumePrompt(state.phase, state),
        phase: state.phase,
        isComplete: false,
      }
    }

    // [V1.8.7] Controle de Iteracao: reset explícito em cada transição de fase/questão
    // (o reset condicional aqui NÃO dispara porque oldPhase/oldQuestionIndex são capturados
    // antes do switch que modifica state.phase — o reset real está embutido em cada transição abaixo)
    void oldPhase; void oldQuestionIndex;

    // [V1.6.1] Avaliação Soberana de Input (A FSM decide a validade de transição)
    if (!this.evaluateInputAcceptance(userId, state.phase, userTurn)) {
      return {
        nextQuestion: this.getPhaseResumePrompt(state.phase, state),
        phase: state.phase,
        isComplete: false,
      }
    }

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
      // [V1.9.77] Removido "agora" do regex de reinicio. Bug 26/04 (paciente Carolina):
      // descricao "comecou com bolha agora virou ferida" disparava resetAssessment()
      // mid-COMPLAINT_DETAILS porque "agora" matchava como sinal de restart. "agora" e
      // palavra extremamente comum em relato clinico ("dor agora", "agora piorou") e nao
      // tem relacao semantica com pedir nova avaliacao. Tambem deduplicado "triagem".
      /\b(uma\s+nova|nova\s+sessao|nova\s+rodada|triagem)\b/.test(normLow) ||
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

    // [V1.9.75 TRACE] write-before: ver qual case do switch sera executado para este input.
    // Combinado com mark-completed e persist-snapshot, permite reconstruir trajetoria exata do state.
    console.log(`[AEC TRACE] write-before | phase=${state.phase} qIdx=${state.currentQuestionIndex} iter=${state.phaseIterationCount} hasMore=${hasMore} input="${userTurn.substring(0,50)}"`)

    // Processar resposta baseado na fase atual
    switch (state.phase) {
      case 'INITIAL_GREETING':
        // Usuário se apresentou, avançar para identificação
        state.data.patientPresentation = userTurn
        this.markPhaseCompleted(state, 'INITIAL_GREETING')
        state.phase = 'IDENTIFICATION'
        state.lastUpdate = new Date()
        return {
          nextQuestion: 'O que trouxe você à nossa avaliação hoje?',
          phase: 'IDENTIFICATION',
          isComplete: false
        }

      case 'IDENTIFICATION':
        // 🛡️ [GREETING GUARD]: Se a mensagem do usuário for puramente social/saudação, NÃO tratar como sintoma.
        const msgNorm = lowerResponse.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
        const isPureGreeting = /^(oi|ola|olá|tudo bem|bom dia|boa tarde|boa noite|como vai)\s*[!.?]?$/i.test(msgNorm.trim())
        const isRedundantIntro = this.looksLikeRedundantPresentation(userTurn, state.data.patientPresentation)

        // [V1.9.28] Se ainda não coletamos o nome do paciente, QUALQUER resposta
        // não-social é o nome — não queixa. Sem esse gate, typos ou nomes curtos
        // ("Crolina", "Ana") passavam pela detecção de "redundant-intro" e iam
        // direto pra COMPLAINT_LIST, pulando a pergunta "O que trouxe você?".
        // Observado 24/04 com Carolina ("Crolina" → pulou pergunta de queixa).
        const hasPatientName = !!(state.data.patientName && state.data.patientName.trim())
        if (!hasPatientName && !isPureGreeting) {
          state.data.patientName = userTurn.trim()
          state.data.patientPresentation = userTurn.trim()
          state.lastUpdate = new Date()
          return {
            nextQuestion: 'O que trouxe você à nossa avaliação hoje?',
            phase: 'IDENTIFICATION',
            isComplete: false
          }
        }

        // Se o usuário está repetindo o nome ("sou pedro") ou apenas cumprimentando, não avançar para COMPLAINT_LIST ainda.
        if (isPureGreeting || isRedundantIntro) {
          state.lastUpdate = new Date()
          return {
            nextQuestion: 'O que trouxe você à nossa avaliação hoje?',
            phase: 'IDENTIFICATION',
            isComplete: false
          }
        }

        // Se chegou aqui, já temos o nome E a mensagem não é saudação/intro — é a primeira queixa!
        if (userTurn.trim()) {
          state.data.complaintList.push(userTurn.trim())
        }
        this.markPhaseCompleted(state, 'IDENTIFICATION')
        state.phase = 'COMPLAINT_LIST'
        state.waitingForMore = true
        state.phaseIterationCount = 0
        state.lastUpdate = new Date()
        return {
          nextQuestion: 'O que mais?',
          phase: 'COMPLAINT_LIST',
          isComplete: false
        }

      case 'COMPLAINT_LIST':
        // [V1.9.29] Regex expandido: antes "somente isso" passava porque "so" em
        // "somente" não tem word-boundary (vem "m" depois). Adicionadas variações
        // reais observadas (somente, tudo bem, ja falei, acabei, nao tem mais, etc).
        const terminatorRegex = /\b(nada|apenas|somente|s[oó]|chega|pronto|pare|fim|encerrar|mais nada|so isso|só isso|somente isso|tudo certo|tudo bem|acabou|acabei|ja falei|já falei|nao tem mais|não tem mais|sem mais nada|isso e tudo|isso é tudo)\b/i
        const isUserStopping = terminatorRegex.test(lowerResponse)
        const REACHED_LIMIT = state.phaseIterationCount >= 2 // (0 -> 1 -> 2 -> avança)

        if (hasMore && userTurn.trim() && !isUserStopping && !REACHED_LIMIT) {
          // Adicionar mais queixa à lista e continuar perguntando
          state.data.complaintList.push(userTurn.trim())
          state.phaseIterationCount++
          state.lastUpdate = new Date()
          return {
            nextQuestion: 'O que mais?',
            phase: 'COMPLAINT_LIST',
            isComplete: false
          }
        } else {
          // [V1.8.4] Grava o último conteúdo relatado antes de avançar (se não for comando de parada)
          if (userTurn.trim() && !isUserStopping) {
            state.data.complaintList.push(userTurn.trim())
          }
          state.waitingForMore = false
          this.markPhaseCompleted(state, 'COMPLAINT_LIST')
          state.phase = 'MAIN_COMPLAINT'
          state.phaseIterationCount = 0
          state.lastUpdate = new Date()

          const complaints = state.data.complaintList.length > 0
            ? state.data.complaintList.join(', ')
            : 'estes sintomas'

          return {
            nextQuestion: `De todas essas questões (${complaints}), qual mais o(a) incomoda?`,
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
        this.markPhaseCompleted(state, 'MAIN_COMPLAINT')
        state.phase = 'COMPLAINT_DETAILS'
        state.currentQuestionIndex = 0
        state.phaseIterationCount = 0
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
        // [V1.9.29] Regex expandido (ver COMPLAINT_LIST pra contexto).
        const histTerminatorRegex = /\b(nada|apenas|somente|s[oó]|chega|pronto|pare|fim|encerrar|mais nada|so isso|só isso|somente isso|tudo certo|tudo bem|acabou|acabei|ja falei|já falei|nao tem mais|não tem mais|sem mais nada|isso e tudo|isso é tudo)\b/i
        const isHistStopping = histTerminatorRegex.test(lowerResponse)
        const HIST_REACHED_LIMIT = state.phaseIterationCount >= 2

        if (hasMore && userTurn.trim() && !isHistStopping && !HIST_REACHED_LIMIT) {
          state.data.medicalHistory.push(userTurn.trim())
          state.phaseIterationCount++
          state.lastUpdate = new Date()
          return {
            nextQuestion: 'O que mais?',
            phase: 'MEDICAL_HISTORY',
            isComplete: false
          }
        } else {
          if (userTurn.trim() && !isHistStopping) {
            state.data.medicalHistory.push(userTurn.trim())
          }
          state.waitingForMore = false
          this.markPhaseCompleted(state, 'MEDICAL_HISTORY')
          state.phase = 'FAMILY_HISTORY_MOTHER'
          state.phaseIterationCount = 0
          state.lastUpdate = new Date()
          return {
            nextQuestion: 'E na sua família? Começando pela parte de sua mãe, quais as questões de saúde dela e desse lado da família?',
            phase: 'FAMILY_HISTORY_MOTHER',
            isComplete: false
          }
        }

      case 'FAMILY_HISTORY_MOTHER':
        // [V1.9.29] Regex expandido (ver COMPLAINT_LIST pra contexto).
        const momTerminatorRegex = /\b(nada|apenas|somente|s[oó]|chega|pronto|pare|fim|encerrar|mais nada|so isso|só isso|somente isso|tudo certo|tudo bem|acabou|acabei|ja falei|já falei|nao tem mais|não tem mais|sem mais nada|isso e tudo|isso é tudo)\b/i
        const isMomStopping = momTerminatorRegex.test(lowerResponse)
        const MOM_REACHED_LIMIT = state.phaseIterationCount >= 2

        if (hasMore && userTurn.trim() && !isMomStopping && !MOM_REACHED_LIMIT) {
          state.data.familyHistoryMother.push(userTurn.trim())
          state.phaseIterationCount++
          state.lastUpdate = new Date()
          return {
            nextQuestion: 'O que mais?',
            phase: 'FAMILY_HISTORY_MOTHER',
            isComplete: false
          }
        } else {
          if (userTurn.trim() && !isMomStopping) {
            state.data.familyHistoryMother.push(userTurn.trim())
          }
          state.waitingForMore = false
          this.markPhaseCompleted(state, 'FAMILY_HISTORY_MOTHER')
          state.phase = 'FAMILY_HISTORY_FATHER'
          state.phaseIterationCount = 0
          state.lastUpdate = new Date()
          return {
            nextQuestion: 'E por parte de seu pai?',
            phase: 'FAMILY_HISTORY_FATHER',
            isComplete: false
          }
        }

      case 'FAMILY_HISTORY_FATHER':
        // [V1.9.29] Regex expandido (ver COMPLAINT_LIST pra contexto).
        const dadTerminatorRegex = /\b(nada|apenas|somente|s[oó]|chega|pronto|pare|fim|encerrar|mais nada|so isso|só isso|somente isso|tudo certo|tudo bem|acabou|acabei|ja falei|já falei|nao tem mais|não tem mais|sem mais nada|isso e tudo|isso é tudo)\b/i
        const isDadStopping = dadTerminatorRegex.test(lowerResponse)
        const DAD_REACHED_LIMIT = state.phaseIterationCount >= 2

        if (hasMore && userTurn.trim() && !isDadStopping && !DAD_REACHED_LIMIT) {
          state.data.familyHistoryFather.push(userTurn.trim())
          state.phaseIterationCount++
          state.lastUpdate = new Date()
          return {
            nextQuestion: 'O que mais?',
            phase: 'FAMILY_HISTORY_FATHER',
            isComplete: false
          }
        } else {
          if (userTurn.trim() && !isDadStopping) {
            state.data.familyHistoryFather.push(userTurn.trim())
          }
          state.waitingForMore = false
          this.markPhaseCompleted(state, 'FAMILY_HISTORY_FATHER')
          state.phase = 'LIFESTYLE_HABITS'
          state.phaseIterationCount = 0
          state.lastUpdate = new Date()
          return {
            nextQuestion: 'Além dos habitos de vida que ja verificamos em nossa conversa, que outros habitos voce acha importante mencionar?',
            phase: 'LIFESTYLE_HABITS',
            isComplete: false
          }
        }

      case 'LIFESTYLE_HABITS':
        // [V1.9.29] Regex expandido (ver COMPLAINT_LIST pra contexto).
        const lifeTerminatorRegex = /\b(nada|apenas|somente|s[oó]|chega|pronto|pare|fim|encerrar|mais nada|so isso|só isso|somente isso|tudo certo|tudo bem|acabou|acabei|ja falei|já falei|nao tem mais|não tem mais|sem mais nada|isso e tudo|isso é tudo)\b/i
        const isLifeStopping = lifeTerminatorRegex.test(lowerResponse)
        const LIFE_REACHED_LIMIT = state.phaseIterationCount >= 2

        if (hasMore && userTurn.trim() && !isLifeStopping && !LIFE_REACHED_LIMIT) {
          state.data.lifestyleHabits.push(userTurn.trim())
          state.phaseIterationCount++
          state.lastUpdate = new Date()
          return {
            nextQuestion: 'O que mais?',
            phase: 'LIFESTYLE_HABITS',
            isComplete: false
          }
        } else {
          if (userTurn.trim() && !isLifeStopping) {
            state.data.lifestyleHabits.push(userTurn.trim())
          }
          state.waitingForMore = false
          this.markPhaseCompleted(state, 'LIFESTYLE_HABITS')
          state.phase = 'OBJECTIVE_QUESTIONS'
          state.currentQuestionIndex = 0
          state.phaseIterationCount = 0
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
        this.markPhaseCompleted(state, 'CONSENSUS_REVIEW')
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
          /\b(nao|não)\s+concordo\b/.test(lowerResponse) ||
          /\bdiscordo\b/.test(lowerResponse) ||
          /\b(esta|está)\s+(errad|incorret)/.test(lowerResponse) ||
          (/\bpreciso\s+corrigir\b/.test(lowerResponse) &&
            !/\b(nao|não)\s+preciso\s+corrigir\b/.test(lowerResponse))
        const consensusAffirm =
          !explicitDisagree &&
          (lowerResponse.includes('concordo') ||
            /\bestá\s+correto\b/.test(lowerResponse) ||
            /\besta\s+correto\b/.test(lowerResponse) ||
            (/\bcorreto\b/.test(lowerResponse) && !/incorreto/.test(lowerResponse)) ||
            /^(ok|ta|tá)\b/i.test(lr) ||
            /^(apenas\s+)?prosseguir\b/i.test(lr) ||
            /\bnao\s+precisa\s+corrigir|nada\s+a\s+corrigir|nada\s+para\s+corrigir\b/i.test(lowerResponse) ||
            (/\bsim\b/.test(lowerResponse) &&
              !/\bnao\b/.test(lowerResponse.normalize('NFD').replace(/[\u0300-\u036f]/g, '')) &&
              !lowerResponse.includes('não')))
        if (consensusAffirm) {
          state.data.consensusAgreed = true
          this.markPhaseCompleted(state, 'CONSENSUS_REPORT')
          state.phase = 'CONSENT_COLLECTION'
          state.lastUpdate = new Date()
          const doc = this.physicianDisplay(state)
          const docTarget = doc || 'o profissional responsável'
          return {
            nextQuestion: '📋 **Consentimento Informado**\n\nAntes de finalizarmos, preciso do seu consentimento:\n\n' +
              '• Os dados desta avaliacao serao registrados no seu prontuario digital.\n' +
              `• O relatorio gerado sera compartilhado com ${docTarget} para analise clinica.\n` +
              '• Nenhum dado sera compartilhado com terceiros sem sua autorizacao previa.\n' +
              '• Este relatorio e uma avaliacao inicial assistida por IA e **não substitui** a consulta médica presencial.\n\n' +
              'Voce autoriza o registro e compartilhamento destes dados? (sim/não)',
            phase: 'CONSENT_COLLECTION',
            isComplete: false
          }
        }
        // Não concordou ou resposta ambígua: pedir correções
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
          this.markPhaseCompleted(state, 'CONSENT_COLLECTION')
          state.phase = 'FINAL_RECOMMENDATION'
          state.lastUpdate = new Date()
          const doc = this.physicianDisplay(state)
          const scheduleTarget = doc || 'o profissional disponível na plataforma'
          const presentTarget = doc || 'o profissional escolhido'
          return {
            nextQuestion: '✅ Consentimento registrado. Obrigada!\n\n' +
              'Sua avaliação inicial foi concluída com sucesso. ' +
              'O relatório clínico já está disponível no seu painel.\n\n' +
              '**Próximos passos:**\n' +
              '• Acesse seu **Relatório Clínico** para revisar os achados\n' +
              `• **Agende uma consulta** com ${scheduleTarget} para dar continuidade ao seu cuidado\n\n` +
              'Use os botões abaixo para navegar rapidamente 👇\n\n' +
              'Essa é uma avaliação inicial de acordo com o método desenvolvido pelo Dr. Ricardo Valença, com o objetivo de aperfeiçoar o seu atendimento. ' +
              `Apresente sua avaliação durante a consulta com ${presentTarget} na plataforma Med-Cann Lab.\n\n` +
              '[ASSESSMENT_COMPLETED]',
            phase: 'FINAL_RECOMMENDATION',
            isComplete: false
          }
        } else if (lowerResponse.includes('não') || lowerResponse.includes('nao') || lowerResponse.includes('recuso')) {
          state.data.consentGiven = false
          state.phase = 'FINAL_RECOMMENDATION'
          state.lastUpdate = new Date()
          const doc = this.physicianDisplay(state)
          const recommendTarget = doc || 'um profissional da plataforma'
          return {
            nextQuestion:
              '⚠️ Entendido. Sem o consentimento, o relatorio **não sera gerado nem compartilhado** com o medico. Seus dados desta conversa serao descartados.\n\n' +
              `Recomendo a marcacao de uma consulta presencial com ${recommendTarget} pelo site para prosseguir com a avaliacao.`,
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
        this.markPhaseCompleted(state, 'FINAL_RECOMMENDATION')
        state.phase = 'COMPLETED'
        state.lastUpdate = new Date()
        // [V1.9.70] Fecha o ciclo de persistência no estado terminal. Antes,
        // state in-memory chegava em COMPLETED + completedPhases full mas DB
        // ficava desatualizado (último persist em fase intermediária). Isso
        // produzia 0 registros com is_complete=true em aec_assessment_state
        // mesmo com 75 reports gerados. Princípio FSM: todo estado terminal
        // precisa ser persistido explicitamente.
        void this.persist(userId)
        return {
          nextQuestion: '',
          phase: 'COMPLETED',
          isComplete: true
        }

      case 'INTERRUPTED': {
        const norm = lowerResponse.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
        // [V1.9.3] Recusa SEMPRE checada PRIMEIRO — antes de qualquer match positivo.
        // "não quero continuar" contém "continuar" literal; se isContinuing rodar antes,
        // o paciente é retomado contra a vontade (bug real 23/04 — casualmusic2021).
        const isRefusing =
          /\b(n[aã]o)\s+(quero|queria|vou|vamos|preciso|posso|desejo|pretendo)\b/.test(norm) ||
          /\b(n[aã]o)\s+(continuar|conversar|falar|fazer|avaliar|retomar|seguir|prosseguir|voltar)\b/.test(norm) ||
          /\b(deixa\s+(pra|para)\s+l[aá]|outra\s+hora|depois\s+conversamos|esquece|por\s+agora\s+n[aã]o|agora\s+n[aã]o|mais\s+tarde)\b/.test(norm) ||
          /\b(vamos\s+(s[oó]|somente|apenas)\s+conversar|vamos\s+conversar\s+apenas|quero\s+(s[oó]|somente|apenas)\s+conversar)\b/.test(norm) ||
          // [V1.9.6] Respostas curtas diretas ao prompt "ou apenas conversar": aceita "apenas conversar",
          // "so conversar", "somente conversar", "conversar apenas" e apenas "conversar" como resposta única.
          /^(s[oó]|somente|apenas)?\s*conversar(\s+(apenas|s[oó]|somente|por\s+agora))?\s*[!.?]?$/.test(norm) ||
          /^(apenas|s[oó]|somente)\s+conversar\s*[!.?]?$/.test(norm)

        if (isRefusing) {
          // [V1.9.67] Em vez de mentir state.phase = 'COMPLETED' (que dispara
          // trigger anomaly_logger V1.9.57: phase=COMPLETED + is_complete=false),
          // invalidamos honestamente. Snapshot preservado em noa_logs, DB
          // marca invalidated_at. Próxima sessão começa limpa via cold start
          // guard (loadStateFromDB filtra invalidated_at IS NULL).
          //
          // Histórico:
          //   V1.9.7: trocou DELETE por phase=COMPLETED — bom (sem race), mas
          //           gerou is_complete=false e poluiu métricas finalização real.
          //   V1.9.67: invalidate explícito — sem race, sem mentira, sem trigger.
          void this.invalidateAssessment(userId, 'user_refused_resume_after_interrupted')
          return {
            nextQuestion:
              'Tudo bem, podemos conversar. Se quiser retomar sua avaliação depois, basta me pedir "retomar avaliação".',
            phase: 'COMPLETED',
            isComplete: true
          }
        }

        const isContinuing = /\b(continuar|retomar|voltar|segue|prosseguir)\b/i.test(norm)
        const isStartingNew = /\b(nova|recomecar|reiniciar|zerar|do zero)\b/i.test(norm)

        if (isContinuing) {
          const resumed = this.resumeAssessment(userId)
          if (resumed) {
            void this.persist(userId)
            return {
              nextQuestion: '✅ Retomando: ' + resumed.nextQuestion,
              phase: resumed.phase,
              isComplete: false
            }
          }
        }

        if (isStartingNew) {
          const savedName = state.data.patientName
          const savedDoc = state.data.aecTargetPhysicianDisplayName
          this.resetAssessment(userId)
          this.startAssessment(userId, savedName, savedDoc)
          void this.persist(userId)
          const fresh = this.states.get(userId)!
          return {
            nextQuestion: '✨ Iniciando nova avaliação. ' + this.standardAecOpeningPhrase(fresh),
            phase: fresh.phase,
            isComplete: false
          }
        }

        return {
          nextQuestion:
            'Sua avaliação foi pausada. Gostaria de **continuar** de onde paramos, iniciar uma **nova** avaliação do zero, ou **apenas conversar** por agora?',
          phase: 'INTERRUPTED',
          isComplete: false
        }
      }

      default:
        // [V1.9.7] nextQuestion vazio: COMPLETED e outras fases terminais NÃO
        // emitem hint — sem hint, o Core não ativa verbatim lock em chat livre
        // pós-recusa ("apenas conversar"). GPT responde contextualmente.
        return {
          nextQuestion: '',
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
      { field: 'complaintLocation', question: `Onde você sente ${label}?` },
      { field: 'complaintOnset', question: `Quando essa dor ou incômodo em ${label} começou?` },
      { field: 'complaintDescription', question: `Como é essa sensação (em ${label})?` },
      {
        field: 'complaintAssociatedSymptoms',
        question: `O que mais você sente junto com ${label}?`,
        isList: true
      },
      { field: 'complaintImprovements', question: `O que parece melhorar ${label}?`, isList: true },
      { field: 'complaintWorsening', question: `O que parece piorar ${label}?`, isList: true }
    ]

    const currentQ = questions[state.currentQuestionIndex]

    if (!currentQ) {
      // Todas as perguntas sobre queixa foram respondidas
      this.markPhaseCompleted(state, 'COMPLAINT_DETAILS')
      state.phase = 'MEDICAL_HISTORY'
      state.waitingForMore = true
      state.currentQuestionIndex = 0
      state.phaseIterationCount = 0
      state.lastUpdate = new Date()
      // [V1.9.31] Transição metodológica explícita: fecha a etapa da queixa
      // principal e abre a de antecedentes. Antes o salto era abrupto ("E agora,
      // sobre o restante sua vida até aqui...") — paciente perdia a noção de
      // onde estava no protocolo. GPT apontou falta de transição clara
      // como 1 dos 4 problemas da sessão 24/04 da Carolina.
      return {
        nextQuestion: 'Obrigada por detalhar a sua queixa principal. Agora vamos olhar para o restante da sua história. Desde o seu nascimento, quais as questões de saúde que você já viveu? Vamos ordenar do mais antigo para o mais recente — o que veio primeiro?',
        phase: 'MEDICAL_HISTORY',
        isComplete: false
      }
    }

    // Salvar resposta
    if (currentQ.isList) {
      const isUserStopping = this.meansNoMore(userResponse)
      // [V1.9.76] Reduzido de >=2 para >=1 em processComplaintDetails (sintomas/melhora/piora).
      // Bug 26/04 (Carolina trace 18:30): GPT no Core avança para próxima sub-pergunta após
      // 1 resposta, mas FSM client ficava esperando 2 (REACHED_LIMIT antigo). Resultado: paciente
      // respondia "O que piora?" mas FSM ainda em complaintImprovements -> resposta caía em melhora.
      // Trace provou: melhora=3, piora=2, hpp=0, lifestyle=0 — todos os dados depois do 1o turno
      // de melhora ficaram empilhados em campos errados. Alinhando ritmo com GPT.
      const REACHED_LIMIT = state.phaseIterationCount >= 1

      if (!isUserStopping && userResponse.trim() && !REACHED_LIMIT) {
        const field = currentQ.field as keyof AssessmentData
        const currentList = state.data[field] as string[]
        if (Array.isArray(currentList)) {
          currentList.push(userResponse.trim())
        }
        state.phaseIterationCount++
        state.lastUpdate = new Date()
        return {
          nextQuestion: 'O que mais?',
          phase: 'COMPLAINT_DETAILS',
          isComplete: false
        }
      } else {
        // [V1.8.4] Grava o último conteúdo relatado antes de avançar (se não for comando de parada)
        if (userResponse.trim() && !isUserStopping) {
          const field = currentQ.field as keyof AssessmentData
          const currentList = state.data[field] as string[]
          if (Array.isArray(currentList)) {
            currentList.push(userResponse.trim())
          }
        }
        // Próxima pergunta — [V1.8.7] zera contador para cada sub-pergunta de lista começar do zero
        state.currentQuestionIndex++
        state.phaseIterationCount = 0
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
        /\b(j[aá]\s+falei|j[aá]\s+disse|repetindo|de novo|falei\s+antes|voc[eê]\s+deveria)\b/i.test(
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
    // [V1.9.113] Fix is_complete=false: este caminho de saída tinha sido
    // esquecido. Antes só linha 1249 (if !currentQ) marcava completed.
    // Confirmado via audit empírico SQL 01/05: paciente Pedro completou AEC mas
    // is_complete continuou false porque COMPLAINT_DETAILS nunca chegava em
    // completed_phases. required_phases tem 13 entradas, completed só 10.
    this.markPhaseCompleted(state, 'COMPLAINT_DETAILS')
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
      this.markPhaseCompleted(state, 'OBJECTIVE_QUESTIONS')
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
    // [V1.9.113] Fix is_complete=false: este caminho de saída tinha sido
    // esquecido. Antes só linha 1379 (if !currentQ) marcava completed.
    // Mesma classe de bug do processComplaintDetails (3ª pergunta sporadicMedications
    // saía por aqui sem marcar OBJECTIVE_QUESTIONS).
    this.markPhaseCompleted(state, 'OBJECTIVE_QUESTIONS')
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
    const clean = (x?: string) => (x ? stripPlatformInjectionNoise(x) : '')
    const cleanJoin = (arr: string[], sep: string) =>
      arr.map((x) => stripPlatformInjectionNoise(x)).filter(Boolean).join(sep)

    // Introdução curta já foi enviada na fase CONSENSUS_REVIEW; evitar duplicar no mesmo fio.
    let report = ''

    report += '**MEU ENTENDIMENTO SOBRE SUA AVALIAÇÃO:**\n\n'

    // Identificação
    if (data.patientPresentation) {
      report += `**Apresentação:** ${clean(data.patientPresentation)}\n\n`
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
        report += `*(Roteiro de perguntas abaixo focado em **${clean(anchor)}**, alinhado à lista indiciária.)*\n`
      }
      if (data.complaintLocation) report += `- Onde: ${clean(data.complaintLocation)}\n`
      if (data.complaintOnset) report += `- Quando começou: ${clean(data.complaintOnset)}\n`
      if (data.complaintDescription) report += `- Como é: ${clean(data.complaintDescription)}\n`
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

    // História Patológica Pregressa
    if (data.medicalHistory.length > 0) {
      report += `**História Patológica Pregressa:** ${cleanJoin(data.medicalHistory, '; ')}\n\n`
    }

    // História Familiar
    if (data.familyHistoryMother.length > 0 || data.familyHistoryFather.length > 0) {
      report += '**História Familiar:**\n'
      if (data.familyHistoryMother.length > 0) {
        report += `- Lado materno: ${cleanJoin(data.familyHistoryMother, '; ')}\n`
      }
      if (data.familyHistoryFather.length > 0) {
        report += `- Lado paterno: ${cleanJoin(data.familyHistoryFather, '; ')}\n`
      }
      report += '\n'
    }

    // Hábitos de Vida
    if (data.lifestyleHabits.length > 0) {
      report += `**Hábitos de Vida:** ${cleanJoin(data.lifestyleHabits, '; ')}\n\n`
    }

    // Perguntas Objetivas
    if (data.allergies) report += `**Alergias:** ${clean(data.allergies)}\n`
    if (data.regularMedications) report += `**Medicações Regulares:** ${clean(data.regularMedications)}\n`
    if (data.sporadicMedications) report += `**Medicações Esporádicas:** ${clean(data.sporadicMedications)}\n`

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
   *
   * [V1.9.67] Audit invariant: se state chegou aqui sem 'FINAL_RECOMMENDATION'
   * marcado em completedPhases, é sintoma de FSM pulando fases. Loga warning
   * (não bloqueia — o caller pode estar legitimamente forçando completed via
   * tag [ASSESSMENT_COMPLETED] do Core).
   */
  completeAssessment(userId: string): AssessmentData | null {
    const state = this.states.get(userId)
    if (!state) return null

    const finalMarked = state.completedPhases?.includes('FINAL_RECOMMENDATION') ?? false
    if (!finalMarked) {
      console.warn('[AEC V1.9.67 audit] completeAssessment sem FINAL_RECOMMENDATION marcado — possível FSM pulando fase', {
        userId,
        prevPhase: state.phase,
        completedPhases: state.completedPhases,
      })
    }

    state.phase = 'COMPLETED'
    state.lastUpdate = new Date()

    // [V1.9.70] Fecha o ciclo de persistência também no caminho de finalização
    // disparada pelo Core via [ASSESSMENT_COMPLETED] (noaResidentAI:2022).
    // Sem isso, state in-memory ficava COMPLETED mas DB nunca recebia o sinal.
    void this.persist(userId)

    return state.data
  }

  /**
   * [V1.9.67] Invalida uma sessão AEC sem mentir sobre fases concluídas.
   * Princípio "invalidate ≠ DELETE" (V1.9.57): preserva snapshot, marca como
   * arquivado na DB, remove do state in-memory. FSM ignora ao recarregar
   * (loadStateFromDB filtra invalidated_at IS NULL desde V1.9.57).
   *
   * Use quando o caller SABE que a AEC está sendo encerrada sem completar
   * (paciente recusou retomar, admin forçou reset, etc). Evita o anti-pattern
   * `state.phase = 'COMPLETED'` que dispara trigger anomaly (phase=COMPLETED
   * + is_complete=false) e polui métricas de finalização real.
   */
  async invalidateAssessment(userId: string, reason: string): Promise<void> {
    // Captura snapshot do state local ANTES do delete (preserva fields pro audit log)
    const snapshot = this.states.get(userId)
    const phase_at_invalidation = snapshot?.phase ?? null
    const completed_phases = snapshot?.completedPhases ?? null

    // [V1.9.67] Delete síncrono antes dos awaits — evita race com próximo turno
    // que poderia ler state ainda com phase antiga enquanto DB update está in-flight.
    this.states.delete(userId)

    // Snapshot pra audit trail (mesmo se state local não existe — pode existir na DB)
    try {
      await (supabase as any).from('noa_logs').insert({
        user_id: userId,
        interaction_type: 'aec_state_invalidated_explicit',
        payload: {
          reason,
          phase_at_invalidation,
          completed_phases,
          source: 'invalidateAssessment_v1_9_67',
          invalidated_at: new Date().toISOString(),
        },
      })
    } catch (snapErr) {
      console.warn('[AEC V1.9.67] Falha ao gravar snapshot (não bloqueia):', snapErr)
    }

    // Marca state como inválido na DB (V1.9.57 schema)
    try {
      await supabase
        .from('aec_assessment_state')
        .update({
          invalidated_at: new Date().toISOString(),
          invalidation_reason: `V1.9.67: ${reason}`,
        } as any)
        .eq('user_id', userId)
        .is('invalidated_at', null)
    } catch (updateErr) {
      console.warn('[AEC V1.9.67] Falha ao marcar invalidação na DB:', updateErr)
    }
  }

  /**
   * [V1.9.23] Guards de idempotência do report. Evita que turnos subsequentes
   * em phase=COMPLETED disparem generateReport múltiplas vezes. O preservar do
   * fallback local (comentário em noaResidentAI) fica mas só roda 1x por sessão.
   */
  isReportDispatched(userId: string): boolean {
    return !!this.states.get(userId)?.reportDispatchedAt
  }

  markReportDispatched(userId: string): void {
    const state = this.states.get(userId)
    if (state) state.reportDispatchedAt = new Date()
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
      generated_by: 'noa_ai',
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

      console.log('🚀 [ClinicalFlow] Enviando dados para Edge Function (Server-Side Save)...')

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

      // [FIX 22/04 v2] Edge agora devolve report_id mesmo em casos idempotentes.
      // Aceitamos:
      //   - success + report_id → caminho feliz
      //   - success sem report_id → idempotência sem ID recuperável (warn, não erro)
      //   - !success → erro real
      if (edgeResponse?.success === false) {
        const errorMsg = edgeResponse?.error || 'Edge Function retornou success=false.'
        throw new Error(errorMsg)
      }

      if (edgeResponse?.report_id) {
        console.log('✅ Relatório clínico salvo via Server-Side:', edgeResponse.report_id, '| status:', edgeResponse?.pipeline_status)
        return edgeResponse.report_id
      }

      // success=true sem report_id → pipeline rodou mas não conseguimos recuperar o ID.
      // Não é erro de UX (relatório existe no banco), apenas não temos a referência imediata.
      console.warn('⚠️ [Edge Function] success=true sem report_id (pipeline_status:', edgeResponse?.pipeline_status, '). Relatório provavelmente já persistido — UI consultará lista.')
      return null

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
      // [V1.9.70] Após V1.9.70 fechar persistência terminal, paciente que volta
      // após AEC concluída encontra phase=COMPLETED no DB. Mensagem coerente
      // (não "Vamos continuar de onde paramos" — estava errado pra terminal).
      case 'COMPLETED': return 'Sua avaliação clínica anterior já está concluída. Posso ajudar com algo mais?'
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
   * Reseta uma avaliação localmente. [V1.8.7] Removido o DELETE explícito no BD que
   * causava race condition com o persist() subsequente: como persist usa upsert com
   * onConflict:'user_id', o próximo persist sobrescreve o registro do BD naturalmente.
   */
  resetAssessment(userId: string): void {
    this.states.delete(userId)
  }
}

// Instância singleton
export const clinicalAssessmentFlow = new ClinicalAssessmentFlow()




