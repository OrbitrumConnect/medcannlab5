/**
 * useResearchMetrics — V1.9.438 (23/05/2026)
 *
 * Carrega métricas REAIS do Eixo Pesquisa do médico logado via PAT.
 * Substitui o mock Math.random() que o Dashboard de Pesquisa tinha em
 * progress/participants — princípio cristalizado hoje:
 * `feedback_doc_institucional_sem_pat_nao_e_valido_23_05` aplicado a UI.
 *
 * Métricas (todas escopadas ao médico logado via doctor_id/author_id/physician_id):
 *  - dossies         — dossiês de pesquisa salvos (physician_research_dossiers)
 *  - forum           — breakdown por status (pending_review / active / rejected / total)
 *  - rationalities   — racionalidades adicionadas aos relatórios do médico
 *  - costRecentUsd   — custo IA acumulado (sample dos últimos chats instrumentados)
 *  - lastMatrixAt    — timestamp da última atividade Matrix (max updated_at do dossiê)
 *
 * NOTA: cost usa amostra de até 1000 linhas (limite max-rows PostgREST,
 * memory `feedback_postgrest_max_rows_1000_silencioso_22_05`). Para teto
 * mensal preciso, futuro RPC `get_user_ai_cost_30d` resolveria.
 */
import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'

export interface ResearchMetrics {
  dossies: number
  forum: {
    total: number
    pending: number
    active: number
    rejected: number
  }
  rationalities: number
  costRecentUsd: number
  lastMatrixAt: string | null
}

export interface UseResearchMetricsReturn {
  metrics: ResearchMetrics
  loading: boolean
  error: string | null
  refresh: () => Promise<void>
}

const EMPTY_METRICS: ResearchMetrics = {
  dossies: 0,
  forum: { total: 0, pending: 0, active: 0, rejected: 0 },
  rationalities: 0,
  costRecentUsd: 0,
  lastMatrixAt: null,
}

export function useResearchMetrics(): UseResearchMetricsReturn {
  const [metrics, setMetrics] = useState<ResearchMetrics>(EMPTY_METRICS)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const { data: authData } = await supabase.auth.getUser()
      const userId = authData?.user?.id
      if (!userId) {
        setMetrics(EMPTY_METRICS)
        setError('Sessão não detectada.')
        return
      }

      // 1) Dossiês salvos (count exato, sem trazer linhas)
      const dossiesResp = await (supabase as any)
        .from('physician_research_dossiers')
        .select('*', { count: 'exact', head: true })
        .eq('physician_id', userId)
      const dossies = dossiesResp.count || 0

      // 2) Última atualização de dossiê (1 linha apenas)
      const lastDossierResp = await (supabase as any)
        .from('physician_research_dossiers')
        .select('updated_at')
        .eq('physician_id', userId)
        .order('updated_at', { ascending: false })
        .limit(1)
        .maybeSingle()
      const lastMatrixAt = lastDossierResp.data?.updated_at || null

      // 3) Posts no fórum (lista enxuta — só status, máx 1000)
      const forumResp = await (supabase as any)
        .from('forum_posts')
        .select('status')
        .eq('author_id', userId)
        .limit(1000)
      const forumRows = (forumResp.data || []) as Array<{ status: string }>
      const forum = {
        total: forumRows.length,
        pending: forumRows.filter((p) => p.status === 'pending_review').length,
        active: forumRows.filter((p) => p.status === 'active').length,
        rejected: forumRows.filter((p) => p.status === 'rejected').length,
      }

      // 4) Racionalidades em reports do médico
      // PostgREST não tem JOIN inner via .select() pra contar — fazemos em 2 passos:
      // (a) IDs dos reports do médico (head:false porque preciso dos IDs)
      const reportsResp = await (supabase as any)
        .from('clinical_reports')
        .select('id')
        .eq('doctor_id', userId)
        .limit(1000)
      const reportIds = ((reportsResp.data || []) as Array<{ id: string }>).map((r) => r.id)
      let rationalities = 0
      if (reportIds.length > 0) {
        const ratResp = await (supabase as any)
          .from('clinical_rationalities')
          .select('*', { count: 'exact', head: true })
          .in('report_id', reportIds)
        rationalities = ratResp.count || 0
      }

      // 5) Custo IA acumulado (amostra) — sample até 1000 interações do médico
      const costResp = await (supabase as any)
        .from('ai_chat_interactions')
        .select('metadata')
        .eq('user_id', userId)
        .not('metadata->cost_usd_estimate', 'is', null)
        .order('created_at', { ascending: false })
        .limit(1000)
      const costRecentUsd = ((costResp.data || []) as Array<{ metadata: any }>).reduce((sum, row) => {
        const v = parseFloat(row?.metadata?.cost_usd_estimate ?? '0')
        return sum + (Number.isFinite(v) ? v : 0)
      }, 0)

      setMetrics({ dossies, forum, rationalities, costRecentUsd, lastMatrixAt })
    } catch (e: any) {
      console.warn('[useResearchMetrics] load:', e)
      setError(e?.message || 'Erro inesperado ao carregar métricas.')
      setMetrics(EMPTY_METRICS)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  return { metrics, loading, error, refresh: load }
}
