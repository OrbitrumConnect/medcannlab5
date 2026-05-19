import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  searchPubMed,
  type EvidenceLevel,
  type PubMedArticle,
  type SearchResult,
} from '../services/pubmedService'

// [V1.9.369-A] (18/05/2026) — Hook gerenciador da busca em literatura externa
//
// Responsabilidades:
//  - Estado da query + filtros (debounced)
//  - Cache local 1h (Map em memória — evita re-fetch da mesma busca)
//  - Cancelamento de fetch via AbortController (busca anterior é cancelada quando user digita)
//  - Loading + Error + Empty states
//
// SEM persistência em Supabase. SEM gravação de telemetria.
// Cache é local ao tab — recarregar página perde.

type YearsBack = 0 | 5 | 10 | 20
type EvidenceFilter = EvidenceLevel | 'all'

// [V1.9.369-B] Presets editoriais — médico abre tab e já vê content sem digitar
export type EditorialPreset = 'free' | 'novidades' | 'cannabis-br' | 'guidelines'

interface PresetConfig {
  term: string
  yearsBack: YearsBack
  daysBack?: number
  evidenceFilter: EvidenceFilter
  affiliationBR?: boolean
  sortBy?: 'relevance' | 'pub_date'
}

export const PRESET_CONFIGS: Record<EditorialPreset, PresetConfig | null> = {
  free: null, // user-controlled
  novidades: {
    term: 'cannabis OR cannabidiol OR CBD',
    yearsBack: 0,
    daysBack: 30,
    evidenceFilter: 'all',
    sortBy: 'pub_date',
  },
  'cannabis-br': {
    term: 'cannabis OR cannabidiol OR CBD',
    yearsBack: 10,
    evidenceFilter: 'all',
    affiliationBR: true,
    sortBy: 'pub_date',
  },
  guidelines: {
    term: 'cannabis OR cannabidiol OR CBD',
    yearsBack: 10,
    evidenceFilter: 'guideline',
    sortBy: 'pub_date',
  },
}

interface UseExternalLiteratureOpts {
  defaultYearsBack?: YearsBack
  cacheMinutes?: number
  debounceMs?: number
  pageSize?: number
  minTermLength?: number
}

interface CachedEntry {
  ts: number
  data: SearchResult
}

const cache = new Map<string, CachedEntry>()

function cacheKey(term: string, years: YearsBack, days: number | undefined, evidence: EvidenceFilter, affBR: boolean, sort: string, pageSize: number): string {
  return `${term.trim().toLowerCase()}|y${years}|d${days || 0}|e${evidence}|br${affBR ? 1 : 0}|s${sort}|n${pageSize}`
}

export function useExternalLiterature(opts: UseExternalLiteratureOpts = {}) {
  const {
    defaultYearsBack = 5,
    cacheMinutes = 60,
    debounceMs = 400,
    pageSize = 10,
    minTermLength = 3,
  } = opts

  const [term, setTerm] = useState('')
  const [yearsBack, setYearsBack] = useState<YearsBack>(defaultYearsBack)
  const [evidenceFilter, setEvidenceFilter] = useState<EvidenceFilter>('all')
  // [V1.9.369-B] Estado do preset editorial atual
  const [preset, setPresetState] = useState<EditorialPreset>('free')
  const [daysBack, setDaysBack] = useState<number | undefined>(undefined)
  const [affiliationBR, setAffiliationBR] = useState<boolean>(false)
  const [sortBy, setSortBy] = useState<'relevance' | 'pub_date'>('relevance')

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [articles, setArticles] = useState<PubMedArticle[]>([])
  const [total, setTotal] = useState(0)
  const [fromCache, setFromCache] = useState(false)
  const [lastSearchedTerm, setLastSearchedTerm] = useState('')

  const abortRef = useRef<AbortController | null>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const cacheTTL = useMemo(() => cacheMinutes * 60 * 1000, [cacheMinutes])

  // [V1.9.369-B] Aplicar preset → set síncrono de todos os filtros
  const setPreset = useCallback((p: EditorialPreset) => {
    setPresetState(p)
    if (p === 'free') {
      // Preserva estado atual do usuário, só muda o "modo"
      return
    }
    const cfg = PRESET_CONFIGS[p]
    if (cfg) {
      setTerm(cfg.term)
      setYearsBack(cfg.yearsBack)
      setDaysBack(cfg.daysBack)
      setEvidenceFilter(cfg.evidenceFilter)
      setAffiliationBR(!!cfg.affiliationBR)
      setSortBy(cfg.sortBy ?? 'relevance')
    }
  }, [])

  // Quando user edita manualmente term/filters, volta pra 'free' (consistência mental)
  const setTermAndExitPreset = useCallback((v: string) => {
    setTerm(v)
    if (preset !== 'free') setPresetState('free')
  }, [preset])

  const setEvidenceAndExitPreset = useCallback((v: EvidenceFilter) => {
    setEvidenceFilter(v)
    if (preset !== 'free') setPresetState('free')
  }, [preset])

  const setYearsAndExitPreset = useCallback((v: YearsBack) => {
    setYearsBack(v)
    setDaysBack(undefined) // user mudou pra anos → não conflita
    if (preset !== 'free') setPresetState('free')
  }, [preset])

  const executeSearch = useCallback(
    async (q: string, y: YearsBack, e: EvidenceFilter, d: number | undefined, br: boolean, sort: 'relevance' | 'pub_date') => {
      const trimmed = q.trim()
      if (trimmed.length < minTermLength) {
        setArticles([])
        setTotal(0)
        setError(null)
        setLoading(false)
        setFromCache(false)
        return
      }

      // Cache hit
      const key = cacheKey(trimmed, y, d, e, br, sort, pageSize)
      const cached = cache.get(key)
      if (cached && Date.now() - cached.ts < cacheTTL) {
        setArticles(cached.data.articles)
        setTotal(cached.data.total)
        setFromCache(true)
        setError(null)
        setLoading(false)
        setLastSearchedTerm(trimmed)
        return
      }

      // Cancela busca anterior
      abortRef.current?.abort()
      const ctrl = new AbortController()
      abortRef.current = ctrl

      setLoading(true)
      setError(null)
      setFromCache(false)
      try {
        const result = await searchPubMed({
          term: trimmed,
          yearsBack: y,
          daysBack: d,
          evidenceFilter: e,
          affiliationBR: br,
          sortBy: sort,
          retmax: pageSize,
          signal: ctrl.signal,
        })
        if (ctrl.signal.aborted) return
        cache.set(key, { ts: Date.now(), data: result })
        setArticles(result.articles)
        setTotal(result.total)
        setLastSearchedTerm(trimmed)
      } catch (err: any) {
        if (err?.name === 'AbortError') return
        setError(err?.message || 'Erro ao buscar literatura externa')
        setArticles([])
        setTotal(0)
      } finally {
        if (!ctrl.signal.aborted) setLoading(false)
      }
    },
    [cacheTTL, minTermLength, pageSize]
  )

  // Debounce: cada mudança em term/filters dispara busca após debounceMs
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      void executeSearch(term, yearsBack, evidenceFilter, daysBack, affiliationBR, sortBy)
    }, debounceMs)
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [term, yearsBack, evidenceFilter, daysBack, affiliationBR, sortBy, debounceMs, executeSearch])

  // Cleanup ao desmontar
  useEffect(() => {
    return () => abortRef.current?.abort()
  }, [])

  const clearSearch = useCallback(() => {
    setTerm('')
    setArticles([])
    setTotal(0)
    setError(null)
    setFromCache(false)
    setLastSearchedTerm('')
    setPresetState('free')
    setDaysBack(undefined)
    setAffiliationBR(false)
    setSortBy('relevance')
  }, [])

  return {
    term,
    setTerm: setTermAndExitPreset,
    yearsBack,
    setYearsBack: setYearsAndExitPreset,
    evidenceFilter,
    setEvidenceFilter: setEvidenceAndExitPreset,
    preset,
    setPreset,
    loading,
    error,
    articles,
    total,
    fromCache,
    lastSearchedTerm,
    clearSearch,
  }
}
