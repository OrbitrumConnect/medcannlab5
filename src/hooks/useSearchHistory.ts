import { useCallback, useEffect, useState } from 'react'

// [V1.9.364] (18/05/2026) — Hook de histórico de pesquisa
// Persistência client-side (localStorage), escopado por user.id.
// Usado por AdminCasosSimilares pra alimentar:
//  - últimas buscas (chips clicáveis)
//  - buscas favoritadas (pin/unpin)
//  - KPIs (buscas hoje/mês, sínteses IA usadas, casos abertos sessão)
//
// [V1.9.365] (18/05/2026) — Estendido com Trilha + Notas Rápidas:
//  - caseOpens[]: snapshot dos últimos casos abertos (max 50, persistido)
//  - notes: scratchpad markdown livre do médico
//
// Zero impacto em server-side, zero risco de regressão.

export interface RecordedSearch {
  term: string
  rationality: string
  period: number
  useGPT: boolean
  ts: number
}

export interface PinnedSearch extends RecordedSearch {
  id: string
  label: string
}

export interface OpenedCase {
  caseId: string
  patientId: string
  patientName: string
  queixa?: string
  ts: number
  // [V1.9.450] Corpus clínico expandido pseudonimizado.
  // Campos opcionais — caller pode passar via extractPseudonymizedClinicalContent
  // (src/lib/casePseudonymization.ts). Quando presente, NoaMatrixView formata
  // body com seções completas (queixa + lista indiciária + HDA + história
  // familiar + hábitos + perguntas objetivas), permitindo Matrix Z2 responder
  // perguntas substantivas sobre o caso. Quando ausente (compat retroativa),
  // body cai pro formato pré-V1.9.450 (só Caso #X + queixa).
  // LGPD: NUNCA armazenar campo "identificacao" ou nome em texto livre nesta
  // estrutura — pseudonimização preservada via "Caso #X" no body.
  clinicalContent?: import('../lib/casePseudonymization').PseudonymizedClinicalContent
}

interface SearchStats {
  searchesToday: number
  searchesMonth: number
  gptSynthesesMonth: number
  lastSearchDate: string
  lastResetMonth: string
}

interface SearchHistoryState {
  recent: RecordedSearch[]
  pinned: PinnedSearch[]
  caseOpens: OpenedCase[]
  notes: string
  stats: SearchStats
}

const MAX_RECENT = 8
const MAX_PINNED = 12
const MAX_CASE_OPENS = 50
const MAX_NOTES_CHARS = 8000

const todayStr = () => new Date().toISOString().slice(0, 10)
const monthStr = () => new Date().toISOString().slice(0, 7)

const emptyState = (): SearchHistoryState => ({
  recent: [],
  pinned: [],
  caseOpens: [],
  notes: '',
  stats: {
    searchesToday: 0,
    searchesMonth: 0,
    gptSynthesesMonth: 0,
    lastSearchDate: todayStr(),
    lastResetMonth: monthStr(),
  },
})

const storageKey = (userId: string | undefined) =>
  `medcannlab:search-history:${userId || 'anon'}`

const loadFromStorage = (userId: string | undefined): SearchHistoryState => {
  if (typeof window === 'undefined') return emptyState()
  try {
    const raw = window.localStorage.getItem(storageKey(userId))
    if (!raw) return emptyState()
    const parsed = JSON.parse(raw) as SearchHistoryState
    return {
      recent: Array.isArray(parsed.recent) ? parsed.recent.slice(0, MAX_RECENT) : [],
      pinned: Array.isArray(parsed.pinned) ? parsed.pinned.slice(0, MAX_PINNED) : [],
      caseOpens: Array.isArray(parsed.caseOpens) ? parsed.caseOpens.slice(0, MAX_CASE_OPENS) : [],
      notes: typeof parsed.notes === 'string' ? parsed.notes.slice(0, MAX_NOTES_CHARS) : '',
      stats: { ...emptyState().stats, ...(parsed.stats || {}) },
    }
  } catch {
    return emptyState()
  }
}

const saveToStorage = (userId: string | undefined, state: SearchHistoryState) => {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(storageKey(userId), JSON.stringify(state))
  } catch {
    // localStorage cheio ou desabilitado — silencioso, histórico é nice-to-have
  }
}

const rollStatsIfNeeded = (stats: SearchStats): SearchStats => {
  const today = todayStr()
  const month = monthStr()
  let next = stats
  if (stats.lastSearchDate !== today) {
    next = { ...next, searchesToday: 0, lastSearchDate: today }
  }
  if (stats.lastResetMonth !== month) {
    next = { ...next, searchesMonth: 0, gptSynthesesMonth: 0, lastResetMonth: month }
  }
  return next
}

export function useSearchHistory(userId: string | undefined) {
  const [state, setState] = useState<SearchHistoryState>(() => loadFromStorage(userId))
  const [casesViewedSession, setCasesViewedSession] = useState(0)

  // Reload quando userId muda (login/logout no mesmo tab)
  useEffect(() => {
    setState(loadFromStorage(userId))
    setCasesViewedSession(0)
  }, [userId])

  // Roll de stats no mount (caso usuário volte no dia seguinte sem recarregar)
  useEffect(() => {
    setState(prev => {
      const rolled = rollStatsIfNeeded(prev.stats)
      if (rolled === prev.stats) return prev
      const next = { ...prev, stats: rolled }
      saveToStorage(userId, next)
      return next
    })
  }, [userId])

  const recordSearch = useCallback(
    (term: string, rationality: string, period: number, useGPT: boolean) => {
      setState(prev => {
        const stats = rollStatsIfNeeded(prev.stats)
        const entry: RecordedSearch = { term: term.trim(), rationality, period, useGPT, ts: Date.now() }
        const dedup = prev.recent.filter(
          r => !(r.term === entry.term && r.rationality === entry.rationality && r.period === entry.period)
        )
        const recent = [entry, ...dedup].slice(0, MAX_RECENT)
        const next: SearchHistoryState = {
          ...prev,
          recent,
          stats: {
            ...stats,
            searchesToday: stats.searchesToday + 1,
            searchesMonth: stats.searchesMonth + 1,
            gptSynthesesMonth: stats.gptSynthesesMonth + (useGPT ? 1 : 0),
          },
        }
        saveToStorage(userId, next)
        return next
      })
    },
    [userId]
  )

  const pinSearch = useCallback(
    (s: RecordedSearch, label?: string) => {
      setState(prev => {
        const id = `${s.term}|${s.rationality}|${s.period}`
        if (prev.pinned.some(p => p.id === id)) return prev
        const pinned: PinnedSearch[] = [
          { ...s, id, label: label || s.term },
          ...prev.pinned,
        ].slice(0, MAX_PINNED)
        const next = { ...prev, pinned }
        saveToStorage(userId, next)
        return next
      })
    },
    [userId]
  )

  const unpinSearch = useCallback(
    (id: string) => {
      setState(prev => {
        const pinned = prev.pinned.filter(p => p.id !== id)
        const next = { ...prev, pinned }
        saveToStorage(userId, next)
        return next
      })
    },
    [userId]
  )

  const isPinned = useCallback(
    (term: string, rationality: string, period: number) => {
      const id = `${term}|${rationality}|${period}`
      return state.pinned.some(p => p.id === id)
    },
    [state.pinned]
  )

  const clearRecent = useCallback(() => {
    setState(prev => {
      const next = { ...prev, recent: [] }
      saveToStorage(userId, next)
      return next
    })
  }, [userId])

  // [V1.9.365] recordCaseOpen: agora persiste snapshot do caso aberto (não só conta)
  const recordCaseOpen = useCallback(
    (c: Omit<OpenedCase, 'ts'>) => {
      setCasesViewedSession(n => n + 1)
      setState(prev => {
        const dedup = prev.caseOpens.filter(o => o.caseId !== c.caseId)
        const caseOpens = [{ ...c, ts: Date.now() }, ...dedup].slice(0, MAX_CASE_OPENS)
        const next = { ...prev, caseOpens }
        saveToStorage(userId, next)
        return next
      })
    },
    [userId]
  )

  const clearCaseOpens = useCallback(() => {
    setState(prev => {
      const next = { ...prev, caseOpens: [] }
      saveToStorage(userId, next)
      return next
    })
  }, [userId])

  // [V1.9.444] removeCaseOpen: remove 1 caso específico do histórico persistido.
  // Granularidade que faltava ao clearCaseOpens (que apaga todos).
  // Usado pelo botão ✕ do card no NoaMatrixView pra remoção definitiva
  // (antes era só ocultação volátil — reload restaurava).
  const removeCaseOpen = useCallback(
    (caseId: string) => {
      setState(prev => {
        const next = { ...prev, caseOpens: prev.caseOpens.filter(o => o.caseId !== caseId) }
        saveToStorage(userId, next)
        return next
      })
    },
    [userId]
  )

  // [V1.9.365] Notas rápidas — scratchpad markdown livre do médico
  const setNotes = useCallback(
    (notes: string) => {
      setState(prev => {
        const next = { ...prev, notes: notes.slice(0, MAX_NOTES_CHARS) }
        saveToStorage(userId, next)
        return next
      })
    },
    [userId]
  )

  return {
    recent: state.recent,
    pinned: state.pinned,
    caseOpens: state.caseOpens,
    notes: state.notes,
    stats: state.stats,
    casesViewedSession,
    recordSearch,
    pinSearch,
    unpinSearch,
    isPinned,
    clearRecent,
    recordCaseOpen,
    clearCaseOpens,
    removeCaseOpen,
    setNotes,
  }
}
