import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  searchAnvisa,
  type AnvisaSearchCategoria,
  type AnvisaSearchResult,
} from '../services/anvisaService'
import type { BularioEntry } from '../data/anvisaBularioSeed'

// [V1.9.465] (27/05/2026) — Hook ANVISA Bulário BR
//
// Simpler que useExternalLiterature/useOpenFDA: consulta é SÍNCRONA local (seed JSON),
// sem fetch, sem cache externo, sem AbortController. Debounce mantém UX consistente.

interface UseAnvisaOpts {
  debounceMs?: number
  pageSize?: number
  defaultCategoria?: AnvisaSearchCategoria
}

export function useAnvisa(opts: UseAnvisaOpts = {}) {
  const {
    debounceMs = 200,
    pageSize = 20,
    defaultCategoria = 'all',
  } = opts

  const [term, setTerm] = useState('')
  const [categoria, setCategoria] = useState<AnvisaSearchCategoria>(defaultCategoria)
  const [result, setResult] = useState<AnvisaSearchResult>(() =>
    searchAnvisa({ categoria: defaultCategoria, limit: pageSize })
  )

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const runSearch = useCallback(
    (t: string, c: AnvisaSearchCategoria) => {
      const r = searchAnvisa({ term: t, categoria: c, limit: pageSize })
      setResult(r)
    },
    [pageSize]
  )

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      runSearch(term, categoria)
    }, debounceMs)
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [term, categoria, debounceMs, runSearch])

  const clearSearch = useCallback(() => {
    setTerm('')
    setCategoria('all')
  }, [])

  const entries: BularioEntry[] = useMemo(() => result.entries, [result])

  return {
    term,
    setTerm,
    categoria,
    setCategoria,
    entries,
    total: result.total,
    seedTotal: result.seedTotal,
    clearSearch,
  }
}
