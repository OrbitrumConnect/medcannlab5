import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  searchOpenFDA,
  type OpenFDADrugLabel,
  type OpenFDASearchResult,
} from '../services/openfdaService'

// [V1.9.464] (27/05/2026) — Hook gerenciador busca em OpenFDA Drug Labels
//
// Espelha pattern useExternalLiterature.ts V1.9.369-A (PubMed):
//   - Estado da query + filtros (debounced)
//   - Cache local 1h (Map em memória)
//   - Cancelamento via AbortController
//   - Loading + Error + Empty states
//
// SEM persistência Supabase. SEM telemetria.
// Cache local ao tab — refresh perde.
//
// Hook STANDALONE (não refatora useExternalLiterature) — princípio polir-não-inventar:
// aba Literatura terá 2 hooks independentes (PubMed + OpenFDA) selecionáveis via tab.
// Refactor multi-source justificado quando ANVISA Bulário ativar (Fase 2 parqueada).

export type OpenFDAField = 'brand' | 'generic' | 'indication' | 'composition' | 'all'

interface CachedEntry {
  ts: number
  data: OpenFDASearchResult
}

const cache = new Map<string, CachedEntry>()

function cacheKey(term: string, field: OpenFDAField, limit: number): string {
  return `${term.trim().toLowerCase()}|f${field}|n${limit}`
}

interface UseOpenFDAOpts {
  cacheMinutes?: number
  debounceMs?: number
  pageSize?: number
  minTermLength?: number
  defaultField?: OpenFDAField
}

export function useOpenFDA(opts: UseOpenFDAOpts = {}) {
  const {
    cacheMinutes = 60,
    debounceMs = 400,
    pageSize = 10,
    minTermLength = 3,
    defaultField = 'all',
  } = opts

  const [term, setTerm] = useState('')
  const [field, setField] = useState<OpenFDAField>(defaultField)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [drugs, setDrugs] = useState<OpenFDADrugLabel[]>([])
  const [total, setTotal] = useState(0)
  const [fromCache, setFromCache] = useState(false)
  const [lastSearchedTerm, setLastSearchedTerm] = useState('')

  const abortRef = useRef<AbortController | null>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const cacheTTL = useMemo(() => cacheMinutes * 60 * 1000, [cacheMinutes])

  const executeSearch = useCallback(
    async (q: string, f: OpenFDAField) => {
      const trimmed = q.trim()
      if (trimmed.length < minTermLength) {
        setDrugs([])
        setTotal(0)
        setError(null)
        setLoading(false)
        setFromCache(false)
        return
      }

      const key = cacheKey(trimmed, f, pageSize)
      const cached = cache.get(key)
      if (cached && Date.now() - cached.ts < cacheTTL) {
        setDrugs(cached.data.drugs)
        setTotal(cached.data.total)
        setFromCache(true)
        setError(null)
        setLoading(false)
        setLastSearchedTerm(trimmed)
        return
      }

      abortRef.current?.abort()
      const ctrl = new AbortController()
      abortRef.current = ctrl

      setLoading(true)
      setError(null)
      setFromCache(false)
      try {
        const result = await searchOpenFDA({
          term: trimmed,
          field: f,
          limit: pageSize,
          signal: ctrl.signal,
        })
        if (ctrl.signal.aborted) return
        cache.set(key, { ts: Date.now(), data: result })
        setDrugs(result.drugs)
        setTotal(result.total)
        setLastSearchedTerm(trimmed)
      } catch (err: any) {
        if (err?.name === 'AbortError') return
        setError(err?.message || 'Erro ao buscar OpenFDA')
        setDrugs([])
        setTotal(0)
      } finally {
        if (!ctrl.signal.aborted) setLoading(false)
      }
    },
    [cacheTTL, minTermLength, pageSize]
  )

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      void executeSearch(term, field)
    }, debounceMs)
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [term, field, debounceMs, executeSearch])

  useEffect(() => {
    return () => abortRef.current?.abort()
  }, [])

  const clearSearch = useCallback(() => {
    setTerm('')
    setDrugs([])
    setTotal(0)
    setError(null)
    setFromCache(false)
    setLastSearchedTerm('')
  }, [])

  return {
    term,
    setTerm,
    field,
    setField,
    loading,
    error,
    drugs,
    total,
    fromCache,
    lastSearchedTerm,
    clearSearch,
  }
}
