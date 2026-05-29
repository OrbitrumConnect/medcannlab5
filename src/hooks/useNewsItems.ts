/**
 * useNewsItems — hook que carrega Notícias & Eventos da tabela `public.news`.
 *
 * V1.9.495 (Sprint E Vertical 1 — Pedro 29/05) — plantio "Notícias & Eventos".
 * Substitui array hardcoded `newsletterUpdates` em EnsinoDashboard.tsx por query
 * real ao banco. Schema empírico `news` (18 cols) já existia desde antes (auditoria
 * V1.9.493 confirmou 0 rows). RLS pré-configurado:
 *  - Public read: published = true
 *  - Admins (admin/master/gestor) lêem drafts + gerenciam tudo
 *
 * Princípios aplicados:
 *  - polir-não-inventar (reusa schema + RLS pré-existentes)
 *  - separação semântica > expansão (categoria explícita)
 *  - graceful degradation (se 0 rows, UI mostra empty state, não quebra)
 */
import { useEffect, useState, useCallback } from 'react'
import { supabase } from '../lib/supabase'

export interface NewsItem {
  id: string
  title: string
  summary: string | null
  content: string | null
  category: string
  author_id: string | null
  author: string | null
  date: string  // YYYY-MM-DD
  read_time: string | null
  impact: string | null
  source: string | null
  url: string | null
  tags: string[]
  image_url: string | null
  published: boolean
  created_at: string
  updated_at: string
  created_by: string | null
}

export interface NewsItemInput {
  title: string
  summary?: string | null
  content?: string | null
  category: string
  author?: string | null
  date?: string  // YYYY-MM-DD; default CURRENT_DATE no DB
  read_time?: string | null
  impact?: string | null
  source?: string | null
  url?: string | null
  tags?: string[]
  image_url?: string | null
  published?: boolean
}

interface UseNewsItemsState {
  items: NewsItem[]
  loading: boolean
  error: string | null
  refresh: () => Promise<void>
  create: (input: NewsItemInput) => Promise<{ ok: boolean; error?: string; id?: string }>
  update: (id: string, patch: Partial<NewsItemInput>) => Promise<{ ok: boolean; error?: string }>
  togglePublished: (id: string, published: boolean) => Promise<{ ok: boolean; error?: string }>
  remove: (id: string) => Promise<{ ok: boolean; error?: string }>
}

/**
 * @param onlyPublished — quando true (default), retorna só items publicados (RLS público).
 *                       Quando false, retorna drafts também (apenas admin via RLS).
 * @param categoryFilter — opcional; filtra por categoria exata
 * @param limit — cap defensivo (default 20)
 */
export function useNewsItems(
  onlyPublished = true,
  categoryFilter?: string,
  limit = 20
): UseNewsItemsState {
  const [items, setItems] = useState<NewsItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchItems = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      let query = (supabase as any)
        .from('news')
        .select('*')
        .order('date', { ascending: false })
        .order('created_at', { ascending: false })
        .limit(limit)
      if (onlyPublished) query = query.eq('published', true)
      if (categoryFilter) query = query.eq('category', categoryFilter)
      const { data, error: err } = await query
      if (err) throw err
      setItems((data || []) as NewsItem[])
    } catch (e: any) {
      console.warn('[useNewsItems] erro:', e)
      setError(e?.message || 'Erro ao carregar notícias')
    } finally {
      setLoading(false)
    }
  }, [onlyPublished, categoryFilter, limit])

  useEffect(() => {
    fetchItems()
  }, [fetchItems])

  const create = useCallback(async (input: NewsItemInput) => {
    try {
      const { data: userResp } = await supabase.auth.getUser()
      const userId = userResp?.user?.id
      const { data, error: err } = await (supabase as any)
        .from('news')
        .insert({
          ...input,
          author_id: userId || null,
          created_by: userId || null,
          tags: input.tags || [],
          published: input.published ?? false,
        })
        .select('id')
        .single()
      if (err) throw err
      await fetchItems()
      return { ok: true as const, id: data?.id }
    } catch (e: any) {
      console.warn('[useNewsItems.create] erro:', e)
      return { ok: false as const, error: e?.message || 'Erro ao criar notícia' }
    }
  }, [fetchItems])

  const update = useCallback(async (id: string, patch: Partial<NewsItemInput>) => {
    try {
      const { error: err } = await (supabase as any)
        .from('news')
        .update({ ...patch, updated_at: new Date().toISOString() })
        .eq('id', id)
      if (err) throw err
      await fetchItems()
      return { ok: true as const }
    } catch (e: any) {
      console.warn('[useNewsItems.update] erro:', e)
      return { ok: false as const, error: e?.message || 'Erro ao atualizar notícia' }
    }
  }, [fetchItems])

  const togglePublished = useCallback(async (id: string, published: boolean) => {
    return update(id, { published })
  }, [update])

  const remove = useCallback(async (id: string) => {
    try {
      const { error: err } = await (supabase as any)
        .from('news')
        .delete()
        .eq('id', id)
      if (err) throw err
      await fetchItems()
      return { ok: true as const }
    } catch (e: any) {
      console.warn('[useNewsItems.remove] erro:', e)
      return { ok: false as const, error: e?.message || 'Erro ao deletar notícia' }
    }
  }, [fetchItems])

  return { items, loading, error, refresh: fetchItems, create, update, togglePublished, remove }
}

// Helpers UI — categorias canônicas com label + cor.
// V1.9.495 — alinhado com CHECK constraint `news_category_check` empírico:
// CHECK (category = ANY (ARRAY['cannabis-medicinal', 'pesquisa-clinica',
//   'metodologia-aec', 'regulamentacao', 'nefrologia', 'clinica', 'pesquisa',
//   'farmacologia']))
// Adicionar nova categoria requer ALTER constraint + atualizar este array.
export const NEWS_CATEGORIES = [
  { value: 'cannabis-medicinal', label: 'Cannabis Medicinal', color: 'text-green-300' },
  { value: 'metodologia-aec', label: 'Metodologia AEC', color: 'text-amber-300' },
  { value: 'pesquisa-clinica', label: 'Pesquisa Clínica', color: 'text-purple-300' },
  { value: 'pesquisa', label: 'Pesquisa', color: 'text-purple-200' },
  { value: 'clinica', label: 'Clínica', color: 'text-blue-300' },
  { value: 'nefrologia', label: 'Nefrologia', color: 'text-cyan-300' },
  { value: 'farmacologia', label: 'Farmacologia', color: 'text-orange-300' },
  { value: 'regulamentacao', label: 'Regulamentação', color: 'text-rose-300' },
] as const

export type NewsCategoryValue = typeof NEWS_CATEGORIES[number]['value']

// V1.9.495 — impact é enum schema CHECK (high/medium/low) OR null
export const NEWS_IMPACT_OPTIONS = [
  { value: '', label: 'Não informado' },
  { value: 'high', label: 'Alto' },
  { value: 'medium', label: 'Médio' },
  { value: 'low', label: 'Baixo' },
] as const

export function getCategoryLabel(value: string): string {
  return NEWS_CATEGORIES.find((c) => c.value === value)?.label || value
}

export function getCategoryColor(value: string): string {
  return NEWS_CATEGORIES.find((c) => c.value === value)?.color || 'text-amber-300'
}
