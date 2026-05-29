/**
 * useEvaluationInstruments — hook que carrega Instrumentos de Avaliação.
 *
 * V1.9.496 (Sprint E Vertical 2 — Pedro 29/05) — plantio Avaliações.
 *
 * Schema NOVO `public.evaluation_instruments` (criada V1.9.496 via PAT migration)
 * + `evaluation_submissions` (UNIQUE per instrument+user; trigger uso via insert).
 *
 * Reusa pattern useNewsItems V1.9.495 (consistência arquitetural).
 *
 * Princípios:
 *  - Triple-A: tipado, error handling, empty state honesto, RLS-aware
 *  - polir-não-inventar (mesma estrutura CRUD do useNewsItems)
 *  - separação semântica (rubrica / casos / portfolio / simulação / prova / outro)
 *  - FK opcional `trl_module_id` preparada pra integração futura quando Eduardo
 *    materializar hierarquia TRL completa (program → module → evidence)
 *
 * RLS:
 *  - Anyone reads published=true
 *  - Admins manage tudo
 *  - User vê próprias submissões; admin vê todas
 *  - User insere própria submissão (UNIQUE constraint impede duplicata)
 */
import { useEffect, useState, useCallback } from 'react'
import { supabase } from '../lib/supabase'

export type InstrumentCategory = 'rubrica' | 'casos' | 'portfolio' | 'simulacao' | 'prova' | 'outro'
export type InstrumentStatus = 'aberto' | 'em-andamento' | 'finalizado' | 'arquivado'
export type InstrumentAudience = 'aluno' | 'medico' | 'todos'

export interface EvaluationInstrument {
  id: string
  title: string
  description: string | null
  category: InstrumentCategory
  status: InstrumentStatus
  target_audience: InstrumentAudience
  published: boolean
  total_points: number | null
  trl_module_id: string | null
  created_by: string | null
  created_at: string
  updated_at: string
  // Derivado (não na tabela): contagem de submissões. Preenchido via JOIN client-side.
  submissionsCount?: number
}

export interface EvaluationInstrumentInput {
  title: string
  description?: string | null
  category: InstrumentCategory
  status?: InstrumentStatus
  target_audience?: InstrumentAudience
  published?: boolean
  total_points?: number | null
  trl_module_id?: string | null
}

interface UseEvaluationInstrumentsState {
  items: EvaluationInstrument[]
  loading: boolean
  error: string | null
  refresh: () => Promise<void>
  create: (input: EvaluationInstrumentInput) => Promise<{ ok: boolean; error?: string; id?: string }>
  update: (id: string, patch: Partial<EvaluationInstrumentInput>) => Promise<{ ok: boolean; error?: string }>
  togglePublished: (id: string, published: boolean) => Promise<{ ok: boolean; error?: string }>
  remove: (id: string) => Promise<{ ok: boolean; error?: string }>
}

export function useEvaluationInstruments(
  onlyPublished = true,
  limit = 30
): UseEvaluationInstrumentsState {
  const [items, setItems] = useState<EvaluationInstrument[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchItems = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      let query = (supabase as any)
        .from('evaluation_instruments')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit)
      if (onlyPublished) query = query.eq('published', true)
      const { data, error: err } = await query
      if (err) throw err
      const instruments = (data || []) as EvaluationInstrument[]
      // Enrich com submissionsCount via query separada (RLS-respeitando: count from
      // evaluation_submissions retorna o que o user tem permissão de ver).
      // Pra admin: COUNT(*) por instrument_id. Pra user normal: count das próprias.
      if (instruments.length > 0) {
        const ids = instruments.map((i) => i.id)
        const { data: submissionsData } = await (supabase as any)
          .from('evaluation_submissions')
          .select('instrument_id')
          .in('instrument_id', ids)
        const counts = new Map<string, number>()
        for (const row of submissionsData || []) {
          counts.set(row.instrument_id, (counts.get(row.instrument_id) || 0) + 1)
        }
        for (const inst of instruments) {
          inst.submissionsCount = counts.get(inst.id) || 0
        }
      }
      setItems(instruments)
    } catch (e: any) {
      console.warn('[useEvaluationInstruments] erro:', e)
      setError(e?.message || 'Erro ao carregar instrumentos')
    } finally {
      setLoading(false)
    }
  }, [onlyPublished, limit])

  useEffect(() => {
    fetchItems()
  }, [fetchItems])

  const create = useCallback(async (input: EvaluationInstrumentInput) => {
    try {
      const { data: userResp } = await supabase.auth.getUser()
      const userId = userResp?.user?.id
      const { data, error: err } = await (supabase as any)
        .from('evaluation_instruments')
        .insert({
          ...input,
          created_by: userId || null,
          published: input.published ?? false,
        })
        .select('id')
        .single()
      if (err) throw err
      await fetchItems()
      return { ok: true as const, id: data?.id }
    } catch (e: any) {
      console.warn('[useEvaluationInstruments.create] erro:', e)
      return { ok: false as const, error: e?.message || 'Erro ao criar instrumento' }
    }
  }, [fetchItems])

  const update = useCallback(async (id: string, patch: Partial<EvaluationInstrumentInput>) => {
    try {
      const { error: err } = await (supabase as any)
        .from('evaluation_instruments')
        .update({ ...patch, updated_at: new Date().toISOString() })
        .eq('id', id)
      if (err) throw err
      await fetchItems()
      return { ok: true as const }
    } catch (e: any) {
      console.warn('[useEvaluationInstruments.update] erro:', e)
      return { ok: false as const, error: e?.message || 'Erro ao atualizar instrumento' }
    }
  }, [fetchItems])

  const togglePublished = useCallback(async (id: string, published: boolean) => {
    return update(id, { published })
  }, [update])

  const remove = useCallback(async (id: string) => {
    try {
      const { error: err } = await (supabase as any)
        .from('evaluation_instruments')
        .delete()
        .eq('id', id)
      if (err) throw err
      await fetchItems()
      return { ok: true as const }
    } catch (e: any) {
      console.warn('[useEvaluationInstruments.remove] erro:', e)
      return { ok: false as const, error: e?.message || 'Erro ao deletar instrumento' }
    }
  }, [fetchItems])

  return { items, loading, error, refresh: fetchItems, create, update, togglePublished, remove }
}

// Helpers UI
export const INSTRUMENT_CATEGORIES = [
  { value: 'rubrica', label: 'Rubrica', color: 'text-amber-300' },
  { value: 'casos', label: 'Casos Clínicos', color: 'text-blue-300' },
  { value: 'portfolio', label: 'Portfolio', color: 'text-purple-300' },
  { value: 'simulacao', label: 'Simulação', color: 'text-emerald-300' },
  { value: 'prova', label: 'Prova', color: 'text-rose-300' },
  { value: 'outro', label: 'Outro', color: 'text-slate-300' },
] as const

export const INSTRUMENT_STATUSES = [
  { value: 'aberto', label: 'Aberto', color: 'bg-emerald-500/15 text-emerald-200' },
  { value: 'em-andamento', label: 'Em andamento', color: 'bg-blue-500/15 text-blue-200' },
  { value: 'finalizado', label: 'Finalizado', color: 'bg-slate-500/15 text-slate-200' },
  { value: 'arquivado', label: 'Arquivado', color: 'bg-slate-700/40 text-slate-400' },
] as const

export const INSTRUMENT_AUDIENCES = [
  { value: 'aluno', label: 'Alunos' },
  { value: 'medico', label: 'Médicos' },
  { value: 'todos', label: 'Todos' },
] as const

export function getInstrumentCategoryLabel(value: string): string {
  return INSTRUMENT_CATEGORIES.find((c) => c.value === value)?.label || value
}

export function getInstrumentCategoryColor(value: string): string {
  return INSTRUMENT_CATEGORIES.find((c) => c.value === value)?.color || 'text-amber-300'
}

export function getInstrumentStatusLabel(value: string): string {
  return INSTRUMENT_STATUSES.find((s) => s.value === value)?.label || value
}

export function getInstrumentStatusBadge(value: string): string {
  return INSTRUMENT_STATUSES.find((s) => s.value === value)?.color || 'bg-slate-500/15 text-slate-200'
}
