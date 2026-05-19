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

function cacheKey(term: string, years: YearsBack, evidence: EvidenceFilter, pageSize: number): string {
  return `${term.trim().toLowerCase()}|y${years}|e${evidence}|n${pageSize}`
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

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [articles, setArticles] = useState<PubMedArticle[]>([])
  const [total, setTotal] = useState(0)
  const [fromCache, setFromCache] = useState(false)
  const [lastSearchedTerm, setLastSearchedTerm] = useState('')

  const abortRef = useRef<AbortController | null>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const cacheTTL = useMemo(() => cacheMinutes * 60 * 1000, [cacheMinutes])

  const executeSearch = useCallback(
    async (q: string, y: YearsBack, e: EvidenceFilter) => {
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
      const key = cacheKey(trimmed, y, e, pageSize)
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
          evidenceFilter: e,
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
      void executeSearch(term, yearsBack, evidenceFilter)
    }, debounceMs)
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [term, yearsBack, evidenceFilter, debounceMs, executeSearch])

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
  }, [])

  return {
    term,
    setTerm,
    yearsBack,
    setYearsBack,
    evidenceFilter,
    setEvidenceFilter,
    loading,
    error,
    articles,
    total,
    fromCache,
    lastSearchedTerm,
    clearSearch,
  }
}
