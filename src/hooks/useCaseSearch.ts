/**
 * useCaseSearch — busca dupla de casos clínicos (conteúdo + nome paciente).
 *
 * V1.9.446 (Pedro 24/05 noite/25/05): extrai a busca dupla criada em
 * AdminCasosSimilares V1.9.445 pra um hook reusável. Permite a Nôa Matrix
 * embutir o mesmo achado direto na sua UI (anti-clique-pra-Casos-Similares).
 *
 * Acopla:
 *  - Match em campos jsonb (queixa/chiefComplaint/structured/assessment)
 *  - Match em users.name (filtrado por type IN patient/paciente — não vaza HCP)
 *  - Merge dedup por reportId + ordena created_at desc
 *  - Resolve patient_name pra exibição
 *
 * Princípios:
 *  - polir-não-inventar (Princípio 8): mesma query lógica de V1.9.445.
 *  - LGPD: filtro de type evita listar admin/profissional por nome.
 *  - Cap 20 resultados (dropdown-friendly; AdminCasosSimilares mantém top 50).
 */
import { useState, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { extractPseudonymizedClinicalContent, type PseudonymizedClinicalContent } from '../lib/casePseudonymization'

export interface CaseSearchHit {
  reportId: string
  patientId: string
  patientName: string
  queixaPrincipal: string
  createdAt: string
  // [V1.9.450] Conteúdo clínico pseudonimizado completo (whitelist).
  // Populado via extractPseudonymizedClinicalContent. Usado por
  // NoaMatrixView recordCaseOpen pra alimentar corpus rico da Matrix.
  // null se report sem content estruturado (legado).
  clinicalContent: PseudonymizedClinicalContent | null
}

export interface UseCaseSearchReturn {
  results: CaseSearchHit[]
  loading: boolean
  error: string | null
  search: (term: string, periodDays?: number) => Promise<void>
  clear: () => void
}

export function useCaseSearch(): UseCaseSearchReturn {
  const [results, setResults] = useState<CaseSearchHit[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const clear = useCallback(() => {
    setResults([])
    setError(null)
  }, [])

  const search = useCallback(async (term: string, periodDays = 90) => {
    const trimmed = term.trim()
    if (trimmed.length < 3) {
      setError('Digite pelo menos 3 caracteres')
      setResults([])
      return
    }
    setError(null)
    setLoading(true)
    try {
      const periodCutoff = new Date(Date.now() - periodDays * 24 * 60 * 60 * 1000).toISOString()
      const ilike = `%${trimmed}%`
      const orFilter = [
        `content->>queixa_principal.ilike.${ilike}`,
        `content->>chiefComplaint.ilike.${ilike}`,
        `content->>structured.ilike.${ilike}`,
        `content->>assessment.ilike.${ilike}`,
      ].join(',')

      const contentSearch = supabase
        .from('clinical_reports')
        .select('id, patient_id, created_at, content')
        .gte('created_at', periodCutoff)
        .or(orFilter)
        .limit(50)

      const nameSearch = supabase
        .from('users')
        .select('id')
        .ilike('name', ilike)
        .in('type', ['patient', 'paciente'])
        .limit(50)

      const [contentResp, nameResp] = await Promise.all([contentSearch, nameSearch])
      if (contentResp.error) throw new Error(contentResp.error.message)

      let reportsByName: any[] = []
      const matchedPatientIds = (nameResp.data || [])
        .map((u: any) => u.id)
        .filter(Boolean)
      if (matchedPatientIds.length > 0) {
        const { data: rByName, error: nameReportsError } = await supabase
          .from('clinical_reports')
          .select('id, patient_id, created_at, content')
          .gte('created_at', periodCutoff)
          .in('patient_id', matchedPatientIds)
          .limit(50)
        if (nameReportsError) {
          console.warn('[useCaseSearch] JOIN reports por nome falhou:', nameReportsError.message)
        } else {
          reportsByName = rByName || []
        }
      }

      const merged = new Map<string, any>()
      ;[...(contentResp.data || []), ...reportsByName].forEach((r: any) => {
        if (r?.id && !merged.has(r.id)) merged.set(r.id, r)
      })
      const reportsList = [...merged.values()]
        .sort((a, b) =>
          new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime()
        )
        .slice(0, 20)  // Cap menor pra UX dropdown-style.

      if (reportsList.length === 0) {
        setResults([])
        return
      }

      const patientIds = [...new Set(reportsList.map((r: any) => r.patient_id).filter(Boolean))]
      const { data: patients } = await supabase
        .from('users')
        .select('id, name')
        .in('id', patientIds)
      const nameMap: Record<string, string> = {}
      patients?.forEach((p: any) => { nameMap[p.id] = p.name || 'Paciente' })

      setResults(reportsList.map((r: any) => {
        const content = typeof r.content === 'object' ? r.content : {}
        const queixa = content.queixa_principal || content.chiefComplaint || '—'
        // [V1.9.450] extrai whitelist clínica pseudonimizada — alimenta
        // corpus rico da Matrix quando médico marca o caso (NoaMatrixView).
        // Helper desce 1 nível em content.raw.content (formato legado V1.9.33).
        const clinicalContent = extractPseudonymizedClinicalContent(content)
        return {
          reportId: r.id,
          patientId: r.patient_id,
          patientName: nameMap[r.patient_id] || 'Paciente',
          queixaPrincipal: typeof queixa === 'string' ? queixa.substring(0, 120) : '—',
          createdAt: r.created_at,
          clinicalContent,
        }
      }))
    } catch (e: any) {
      console.error('[useCaseSearch] erro:', e)
      setError(e?.message || 'Erro na busca')
      setResults([])
    } finally {
      setLoading(false)
    }
  }, [])

  return { results, loading, error, search, clear }
}
