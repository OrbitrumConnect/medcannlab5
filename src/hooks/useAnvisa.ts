import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  searchAnvisa,
  type AnvisaSearchCategoria,
  type AnvisaSearchResult,
  type AnvisaSortBy,
} from '../services/anvisaService'
import type { BularioEntry } from '../data/anvisaBularioSeed'

// [V1.9.465+465-A] (27/05/2026) — Hook ANVISA Bulário BR
//
// V1.9.465-A: sortBy state adicionado (A-Z / Z-A / categoria / tarja / relevance),
// pageSize aumentado pra 40 (grid 4 colunas comporta mais).

interface UseAnvisaOpts {
  debounceMs?: number
  pageSize?: number
  defaultCategoria?: AnvisaSearchCategoria
  defaultSortBy?: AnvisaSortBy
}

export function useAnvisa(opts: UseAnvisaOpts = {}) {
  const {
    debounceMs = 200,
    pageSize = 40,
    defaultCategoria = 'all',
    defaultSortBy = 'az',
  } = opts

  const [term, setTerm] = useState('')
  const [categoria, setCategoria] = useState<AnvisaSearchCategoria>(defaultCategoria)
  const [sortBy, setSortBy] = useState<AnvisaSortBy>(defaultSortBy)
  const [result, setResult] = useState<AnvisaSearchResult>(() =>
    searchAnvisa({ categoria: defaultCategoria, limit: pageSize, sortBy: defaultSortBy })
  )

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const runSearch = useCallback(
    (t: string, c: AnvisaSearchCategoria, s: AnvisaSortBy) => {
      const r = searchAnvisa({ term: t, categoria: c, sortBy: s, limit: pageSize })
      setResult(r)
    },
    [pageSize]
  )

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      runSearch(term, categoria, sortBy)
    }, debounceMs)
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [term, categoria, sortBy, debounceMs, runSearch])

  const clearSearch = useCallback(() => {
    setTerm('')
    setCategoria('all')
    setSortBy(defaultSortBy)
  }, [defaultSortBy])

  const entries: BularioEntry[] = useMemo(() => result.entries, [result])

  return {
    term,
    setTerm,
    categoria,
    setCategoria,
    sortBy,
    setSortBy,
    entries,
    total: result.total,
    seedTotal: result.seedTotal,
    clearSearch,
  }
}
