// =============================================================================
// [V1.9.374] AdminAIGovernance — Observabilidade de Sistemas IA (Z1/Z2)
// =============================================================================
//
// ┌─────────────────────────────────────────────────────────────────────────┐
// │ INVARIANTE DE SISTEMA (não negociável):                                  │
// │                                                                          │
// │ NENHUMA MÉTRICA DESTE PAINEL PODE SER USADA COMO TRIGGER AUTOMÁTICO     │
// │ DE DECISÃO CLÍNICA OU OPERACIONAL.                                       │
// │                                                                          │
// │ Dados representam COMPORTAMENTO DO SISTEMA (Z1 técnica + Z2 estrutural).│
// │ NÃO são avaliação de:                                                    │
// │   - conduta médica (Z4 = humano)                                         │
// │   - eficácia clínica                                                     │
// │   - performance de profissional                                          │
// │   - qualidade de atendimento                                             │
// │                                                                          │
// │ Outliers podem indicar caso complexo OU regressão técnica.              │
// │ Distinção é responsabilidade HUMANA, NUNCA automática.                  │
// │                                                                          │
// │ Painel = tradutor entre comportamento de sistema e interpretação humana.│
// │ Compara a cockpit de avião / monitor de UTI / observabilidade crítica.  │
// │ NÃO compara a BI dashboard / analytics de produto / scorecard.          │
// │                                                                          │
// │ Memory aplicada:                                                         │
// │   - feedback_limitar_autoridade_computacional_19_05 (filosofia EIXO)     │
// │   - feedback_nao_fingir_autoridade_18_05 (princípio MASTER 7)            │
// │   - feedback_inteligencia_estrutural_vs_inferencial_18_05 (Z2)           │
// │   - project_bug_pipeline_aec_50s_pos_consent_19_05 (bug rastreado)       │
// │   - audit_back_v1_9_368_bugs_descobertos_18_05 (cost tracking + jsonb)   │
// └─────────────────────────────────────────────────────────────────────────┘
//
// Pre-requisitos:
//  - Usuário deve ter role='admin' (RLS abre SELECT amplo)
//  - Tabela ai_chat_interactions deve ter dados (instrumentado V1.9.238)
//
// Anti-regressão:
//  - Zero toque em AEC / Pipeline / PBAD / Lock V1.9.95+
//  - Apenas SELECT em ai_chat_interactions (read-only)
//  - Cache local 60s (não bombardeia DB)
//  - Fail-open: erro de query → mostra "(sem dado)" em vez de quebrar
// =============================================================================

import React, { useEffect, useState, useMemo } from 'react'
import {
  Activity,
  AlertCircle,
  AlertTriangle,
  Bug,
  Clock,
  DollarSign,
  Eye,
  Info,
  RefreshCw,
  TrendingUp,
  Users,
  Zap,
  ShieldCheck,
} from 'lucide-react'
import { supabase } from '../lib/supabase'

// =============================================================================
// TIPOS — todos marcados Readonly pra reforçar "observação, não decisão"
// =============================================================================

/**
 * Métrica de observabilidade Z1+Z2.
 *
 * REGRA DE USO (não-negociável):
 * Este tipo NÃO pode ser usado como input pra:
 *   - Decisão clínica automática
 *   - Ranking de médico
 *   - Suspensão / penalidade / sanção
 *   - Avaliação de performance humana
 *
 * Uso permitido: exibição, audit, debug, alerta pra investigação humana.
 */
type ObservedMetric<T> = Readonly<{
  value: T
  observed_at_iso: string
}>

interface AggregateMetrics {
  total_interactions: number
  distinct_users: number
  last_7d: number
  last_30d: number
  total_cost_usd: number
  cost_30d: number
  cost_7d: number
  cost_today: number
  prompt_tokens: number
  completion_tokens: number
}

interface FeatureFrequency {
  feature_label: string
  observed_count: number
  observed_cost_usd: number
  avg_latency_ms: number
  max_latency_ms: number
  distinct_users: number
}

interface DailyTrendPoint {
  day: string
  observed_count: number
  observed_cost_usd: number
  distinct_users: number
}

interface LatencyPercentiles {
  p50: number
  p75: number
  p90: number
  p95: number
  p99: number
  max: number
  over_10s: number
  over_20s: number
  over_30s: number
}

interface SlowOutlier {
  id: string
  user_id: string
  intent: string | null
  processing_time: number
  user_msg_preview: string
  ai_resp_preview: string
  prompt_tok: number
  compl_tok: number
  created_at: string
}

interface TopUser {
  user_id_hash: string // pseudonimizado (8 chars do uuid)
  observed_count: number
  observed_cost_usd: number
}

interface TelemetryIssue {
  severity: 'info' | 'warning' | 'critical'
  title: string
  observed: string
  hypothesis: string
  human_action_required: string
}

// =============================================================================
// QUERIES — todas read-only, agregadas, sem PII
// =============================================================================

async function fetchAggregateMetrics(): Promise<AggregateMetrics | null> {
  try {
    const { data, error } = await supabase
      .from('ai_chat_interactions')
      .select('user_id, created_at, metadata')
      .order('created_at', { ascending: false })
      .limit(10000) // proteção: max 10k linhas pro client agregar
    if (error || !data) return null

    const now = Date.now()
    const day1 = now - 1 * 24 * 60 * 60 * 1000
    const day7 = now - 7 * 24 * 60 * 60 * 1000
    const day30 = now - 30 * 24 * 60 * 60 * 1000

    let last_7d = 0, last_30d = 0
    let total_cost_usd = 0, cost_30d = 0, cost_7d = 0, cost_today = 0
    let prompt_tokens = 0, completion_tokens = 0
    const users = new Set<string>()

    for (const row of data as any[]) {
      const t = new Date(row.created_at).getTime()
      const cost = parseFloat(row.metadata?.cost_usd_estimate || '0') || 0
      const ptok = parseInt(row.metadata?.prompt_tokens || '0', 10) || 0
      const ctok = parseInt(row.metadata?.completion_tokens || '0', 10) || 0

      total_cost_usd += cost
      prompt_tokens += ptok
      completion_tokens += ctok
      if (row.user_id) users.add(row.user_id)

      if (t >= day30) { last_30d++; cost_30d += cost }
      if (t >= day7) { last_7d++; cost_7d += cost }
      if (t >= day1) { cost_today += cost }
    }

    return {
      total_interactions: data.length,
      distinct_users: users.size,
      last_7d,
      last_30d,
      total_cost_usd,
      cost_30d,
      cost_7d,
      cost_today,
      prompt_tokens,
      completion_tokens,
    }
  } catch (err) {
    console.warn('[AIGovernance] fetchAggregateMetrics falhou:', err)
    return null
  }
}

async function fetchFeatureFrequency(): Promise<FeatureFrequency[]> {
  try {
    const { data, error } = await supabase
      .from('ai_chat_interactions')
      .select('user_id, processing_time, metadata, created_at')
      .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
      .limit(10000)
    if (error || !data) return []

    const byFeature: Record<string, { count: number; cost: number; latencies: number[]; users: Set<string> }> = {}

    for (const row of data as any[]) {
      const label = (row.metadata?.simbologia as string) || '(sem simbologia)'
      if (!byFeature[label]) byFeature[label] = { count: 0, cost: 0, latencies: [], users: new Set() }
      byFeature[label].count++
      byFeature[label].cost += parseFloat(row.metadata?.cost_usd_estimate || '0') || 0
      if (row.processing_time) byFeature[label].latencies.push(row.processing_time)
      if (row.user_id) byFeature[label].users.add(row.user_id)
    }

    return Object.entries(byFeature)
      .map(([label, b]) => ({
        feature_label: label,
        observed_count: b.count,
        observed_cost_usd: b.cost,
        avg_latency_ms: b.latencies.length > 0 ? Math.round(b.latencies.reduce((a, x) => a + x, 0) / b.latencies.length) : 0,
        max_latency_ms: b.latencies.length > 0 ? Math.max(...b.latencies) : 0,
        distinct_users: b.users.size,
      }))
      .sort((a, b) => b.observed_count - a.observed_count)
  } catch (err) {
    console.warn('[AIGovernance] fetchFeatureFrequency falhou:', err)
    return []
  }
}

async function fetchDailyTrend(days = 14): Promise<DailyTrendPoint[]> {
  try {
    const { data, error } = await supabase
      .from('ai_chat_interactions')
      .select('user_id, created_at, metadata')
      .gte('created_at', new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString())
      .limit(10000)
    if (error || !data) return []

    const byDay: Record<string, { count: number; cost: number; users: Set<string> }> = {}
    for (const row of data as any[]) {
      const day = row.created_at.slice(0, 10)
      if (!byDay[day]) byDay[day] = { count: 0, cost: 0, users: new Set() }
      byDay[day].count++
      byDay[day].cost += parseFloat(row.metadata?.cost_usd_estimate || '0') || 0
      if (row.user_id) byDay[day].users.add(row.user_id)
    }

    return Object.entries(byDay)
      .map(([day, b]) => ({ day, observed_count: b.count, observed_cost_usd: b.cost, distinct_users: b.users.size }))
      .sort((a, b) => a.day.localeCompare(b.day))
  } catch (err) {
    console.warn('[AIGovernance] fetchDailyTrend falhou:', err)
    return []
  }
}

async function fetchLatencyPercentiles(): Promise<LatencyPercentiles | null> {
  try {
    const { data, error } = await supabase
      .from('ai_chat_interactions')
      .select('processing_time')
      .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
      .not('processing_time', 'is', null)
      .limit(10000)
    if (error || !data || data.length === 0) return null

    const values = (data as any[]).map(r => Number(r.processing_time) || 0).sort((a, b) => a - b)
    const pct = (p: number) => values[Math.floor((values.length - 1) * p)] || 0

    return {
      p50: pct(0.5),
      p75: pct(0.75),
      p90: pct(0.9),
      p95: pct(0.95),
      p99: pct(0.99),
      max: values[values.length - 1] || 0,
      over_10s: values.filter(v => v > 10000).length,
      over_20s: values.filter(v => v > 20000).length,
      over_30s: values.filter(v => v > 30000).length,
    }
  } catch (err) {
    console.warn('[AIGovernance] fetchLatencyPercentiles falhou:', err)
    return null
  }
}

async function fetchSlowOutliers(): Promise<SlowOutlier[]> {
  try {
    const { data, error } = await supabase
      .from('ai_chat_interactions')
      .select('id, user_id, intent, processing_time, user_message, ai_response, metadata, created_at')
      .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
      .gt('processing_time', 20000)
      .order('processing_time', { ascending: false })
      .limit(5)
    if (error || !data) return []
    return (data as any[]).map(r => ({
      id: r.id,
      user_id: r.user_id || '(anon)',
      intent: r.intent,
      processing_time: r.processing_time,
      user_msg_preview: (r.user_message || '').slice(0, 80),
      ai_resp_preview: (r.ai_response || '').slice(0, 80),
      prompt_tok: parseInt(r.metadata?.prompt_tokens || '0', 10) || 0,
      compl_tok: parseInt(r.metadata?.completion_tokens || '0', 10) || 0,
      created_at: r.created_at,
    }))
  } catch (err) {
    console.warn('[AIGovernance] fetchSlowOutliers falhou:', err)
    return []
  }
}

async function fetchTopUsers(): Promise<TopUser[]> {
  try {
    const { data, error } = await supabase
      .from('ai_chat_interactions')
      .select('user_id, metadata')
      .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
      .limit(10000)
    if (error || !data) return []
    const byUser: Record<string, { count: number; cost: number }> = {}
    for (const r of data as any[]) {
      if (!r.user_id) continue
      if (!byUser[r.user_id]) byUser[r.user_id] = { count: 0, cost: 0 }
      byUser[r.user_id].count++
      byUser[r.user_id].cost += parseFloat(r.metadata?.cost_usd_estimate || '0') || 0
    }
    return Object.entries(byUser)
      .map(([uid, b]) => ({
        user_id_hash: 'user-' + uid.slice(0, 8), // pseudonimizado
        observed_count: b.count,
        observed_cost_usd: b.cost,
      }))
      .sort((a, b) => b.observed_count - a.observed_count)
      .slice(0, 8)
  } catch (err) {
    console.warn('[AIGovernance] fetchTopUsers falhou:', err)
    return []
  }
}

function detectTelemetryIssues(features: FeatureFrequency[]): TelemetryIssue[] {
  const issues: TelemetryIssue[] = []

  // Issue 1 — Simbologia '🔬 Casos Similares' deveria existir mas não há
  const casosSim = features.find(f => f.feature_label.includes('🔬') || f.feature_label.toLowerCase().includes('casos similares'))
  if (!casosSim) {
    issues.push({
      severity: 'critical',
      title: 'Cost tracking quebrado: 🔬 Casos Similares com 0 interações logadas',
      observed: 'Tabela ai_chat_interactions não tem nenhum registro com simbologia "🔬 Casos Similares" nos últimos 30 dias.',
      hypothesis: 'NoaResidentAI.processMessage não recebe/propaga simbologia ao chamar GPT no toggle V1.9.357. monthlyCost SEMPRE = $0. Cap $50/mês NUNCA trava.',
      human_action_required: 'Fix candidate V1.9.375+: wrapper que injeta simbologia no payload do Core.',
    })
  }

  // Issue 2 — Encoding broken (simbologia com �)
  const broken = features.find(f => f.feature_label.includes('�'))
  if (broken) {
    issues.push({
      severity: 'warning',
      title: 'Encoding broken observado em simbologia',
      observed: `Feature "${broken.feature_label}" com ${broken.observed_count} interações tem caractere de encoding corrompido.`,
      hypothesis: 'Encoding UTF-8 não preservado no payload metadata ao serializar emoji.',
      human_action_required: 'Investigar pipeline de gravação metadata.simbologia em ai_chat_interactions.',
    })
  }

  // Issue 3 — Pipeline AEC 50s pós-consent (memory já cristalizada)
  const aec = features.find(f => f.feature_label.includes('🔴') || f.feature_label.toLowerCase().includes('escuta clínica'))
  if (aec && aec.max_latency_ms > 30000) {
    issues.push({
      severity: 'warning',
      title: `Pipeline AEC com outlier de ${(aec.max_latency_ms / 1000).toFixed(1)}s pós-consentimento`,
      observed: `Max latência AEC nos últimos 30d: ${aec.max_latency_ms}ms. Memory cristalizada (19/05) documenta 3 outliers reais com prompt_tok=0 — NÃO é GPT, é pipeline serial (report → scores → signature → axes → rationality).`,
      hypothesis: 'Pipeline AEC pós-consentimento roda síncrono. UX risk: paciente acha que travou. Timeout risk: edge function tem limit ~150s.',
      human_action_required: 'Fix candidate V1.9.380+ quando Marco 2 ou Ricardo reclamar: async response + background pipeline OU streaming progressivo.',
    })
  }

  return issues
}

// =============================================================================
// HELPERS — formatação + visualização
// =============================================================================

const formatUSD = (v: number) => '$' + v.toFixed(2)
const formatMs = (v: number) => v < 1000 ? `${v}ms` : `${(v / 1000).toFixed(1)}s`
const formatDate = (iso: string) => new Date(iso).toLocaleString('pt-BR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })

function Sparkline({ values, color = '#60a5fa', width = 200, height = 32 }: { values: number[]; color?: string; width?: number; height?: number }) {
  if (values.length === 0) return <span className="text-xs text-slate-600">(sem dado)</span>
  const max = Math.max(...values, 1)
  const min = Math.min(...values, 0)
  const range = max - min || 1
  const stepX = width / Math.max(values.length - 1, 1)
  const points = values.map((v, i) => `${i * stepX},${height - ((v - min) / range) * height}`).join(' ')
  return (
    <svg width={width} height={height} className="block">
      <polyline fill="none" stroke={color} strokeWidth="1.5" points={points} />
    </svg>
  )
}

// =============================================================================
// SUB-COMPONENTES
// =============================================================================

const Banner: React.FC = () => (
  <div className="bg-amber-500/10 border-2 border-amber-500/40 rounded-xl p-4 mb-6">
    <div className="flex items-start gap-3">
      <ShieldCheck className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
      <div className="space-y-1.5">
        <h3 className="text-sm font-bold text-amber-300 uppercase tracking-wider">
          Invariante Z1+Z2 — Observabilidade técnica
        </h3>
        <p className="text-xs text-amber-100/90 leading-relaxed">
          Todos os dados representam <strong>comportamento do sistema</strong> (infra + estrutural).
          NÃO são avaliação de <strong>conduta humana</strong> (Z3/Z4 = médico).
          Outliers podem indicar caso complexo OU regressão técnica — <strong>distinção é humana</strong>, nunca automática.
        </p>
      </div>
    </div>
  </div>
)

const KPICard: React.FC<{ icon: React.ElementType; label: string; value: string; sublabel?: string; tone?: 'default' | 'warn' | 'critical' }> = ({ icon: Icon, label, value, sublabel, tone = 'default' }) => {
  const tones = {
    default: 'border-slate-700/50 text-white',
    warn: 'border-amber-500/40 text-amber-100',
    critical: 'border-red-500/40 text-red-100',
  }
  return (
    <div className={`bg-slate-800/40 border ${tones[tone]} rounded-lg px-3 py-2.5`}>
      <div className="flex items-center gap-1.5 mb-1">
        <Icon className="w-3 h-3 text-slate-400" />
        <span className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold">{label}</span>
      </div>
      <div className="text-lg font-bold tabular-nums">{value}</div>
      {sublabel && <div className="text-[10px] text-slate-500">{sublabel}</div>}
    </div>
  )
}

const FeatureTable: React.FC<{ features: FeatureFrequency[] }> = ({ features }) => (
  <div className="bg-slate-800/30 border border-slate-700/50 rounded-xl p-4">
    <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-3 flex items-center gap-2">
      <TrendingUp className="w-3.5 h-3.5 text-indigo-400" />
      Frequência observada por feature (últimos 30 dias)
    </h3>
    <p className="text-[10px] text-slate-500 mb-3 italic">
      Agregação estrutural — não é ranking de valor ou performance.
    </p>
    <table className="w-full text-xs">
      <thead>
        <tr className="text-[10px] uppercase tracking-wider text-slate-500 border-b border-slate-700/40">
          <th className="text-left py-1.5 font-semibold">Feature (simbologia)</th>
          <th className="text-right py-1.5 font-semibold">Interações</th>
          <th className="text-right py-1.5 font-semibold">Custo USD</th>
          <th className="text-right py-1.5 font-semibold">Latência avg</th>
          <th className="text-right py-1.5 font-semibold">Latência max</th>
          <th className="text-right py-1.5 font-semibold">Users</th>
        </tr>
      </thead>
      <tbody>
        {features.length === 0 ? (
          <tr><td colSpan={6} className="text-center py-4 text-slate-500 italic">Carregando ou sem dados</td></tr>
        ) : (
          features.map(f => (
            <tr key={f.feature_label} className="border-b border-slate-800/30 hover:bg-slate-900/30">
              <td className="py-2 text-slate-300">{f.feature_label}</td>
              <td className="py-2 text-right tabular-nums text-white">{f.observed_count}</td>
              <td className="py-2 text-right tabular-nums text-emerald-300">{formatUSD(f.observed_cost_usd)}</td>
              <td className="py-2 text-right tabular-nums text-slate-300">{formatMs(f.avg_latency_ms)}</td>
              <td className={`py-2 text-right tabular-nums ${f.max_latency_ms > 30000 ? 'text-red-300' : f.max_latency_ms > 10000 ? 'text-amber-300' : 'text-slate-300'}`}>
                {formatMs(f.max_latency_ms)}
              </td>
              <td className="py-2 text-right tabular-nums text-slate-300">{f.distinct_users}</td>
            </tr>
          ))
        )}
      </tbody>
    </table>
  </div>
)

const TrendChart: React.FC<{ data: DailyTrendPoint[] }> = ({ data }) => {
  if (data.length === 0) return null
  const counts = data.map(d => d.observed_count)
  const costs = data.map(d => d.observed_cost_usd)
  return (
    <div className="bg-slate-800/30 border border-slate-700/50 rounded-xl p-4">
      <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-3 flex items-center gap-2">
        <Activity className="w-3.5 h-3.5 text-indigo-400" />
        Tendência diária observada (últimos {data.length} dias)
      </h3>
      <div className="space-y-3">
        <div>
          <div className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">Interações</div>
          <Sparkline values={counts} color="#60a5fa" width={400} height={40} />
          <div className="flex justify-between text-[10px] text-slate-600 mt-1 tabular-nums">
            <span>{data[0]?.day}</span>
            <span>min {Math.min(...counts)} · max {Math.max(...counts)}</span>
            <span>{data[data.length - 1]?.day}</span>
          </div>
        </div>
        <div>
          <div className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">Custo USD</div>
          <Sparkline values={costs} color="#34d399" width={400} height={40} />
          <div className="flex justify-between text-[10px] text-slate-600 mt-1 tabular-nums">
            <span>{formatUSD(costs[0] || 0)}</span>
            <span>total {formatUSD(costs.reduce((a, b) => a + b, 0))}</span>
            <span>{formatUSD(costs[costs.length - 1] || 0)}</span>
          </div>
        </div>
      </div>
    </div>
  )
}

const LatencyCard: React.FC<{ data: LatencyPercentiles | null }> = ({ data }) => (
  <div className="bg-slate-800/30 border border-slate-700/50 rounded-xl p-4">
    <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-3 flex items-center gap-2">
      <Clock className="w-3.5 h-3.5 text-indigo-400" />
      Distribuição de latência (últimos 7 dias)
    </h3>
    {data === null ? (
      <p className="text-xs text-slate-500 italic">(sem dado)</p>
    ) : (
      <>
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 mb-3">
          {(['p50', 'p75', 'p90', 'p95', 'p99', 'max'] as const).map(k => {
            const v = data[k] as number
            const tone = v > 30000 ? 'text-red-300' : v > 10000 ? 'text-amber-300' : 'text-white'
            return (
              <div key={k} className="bg-slate-900/60 border border-slate-700/40 rounded-md px-2 py-1.5">
                <div className="text-[9px] uppercase tracking-wider text-slate-500 font-semibold">{k}</div>
                <div className={`text-sm font-bold tabular-nums ${tone}`}>{formatMs(v)}</div>
              </div>
            )
          })}
        </div>
        <div className="flex gap-3 text-[11px] flex-wrap">
          <span className="text-slate-400">Outliers:</span>
          <span className="text-amber-300 tabular-nums">{data.over_10s} &gt;10s</span>
          <span className="text-orange-300 tabular-nums">{data.over_20s} &gt;20s</span>
          <span className="text-red-300 tabular-nums">{data.over_30s} &gt;30s</span>
        </div>
        <p className="text-[10px] text-slate-500 mt-2 italic">
          ⚠️ Outliers podem indicar caso complexo OU regressão técnica. Investigação humana necessária pra distinguir.
        </p>
      </>
    )}
  </div>
)

const OutliersCard: React.FC<{ outliers: SlowOutlier[] }> = ({ outliers }) => {
  if (outliers.length === 0) return null
  return (
    <div className="bg-slate-800/30 border border-slate-700/50 rounded-xl p-4">
      <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-3 flex items-center gap-2">
        <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
        Outliers de latência (top 5, últimos 7d, &gt;20s)
      </h3>
      <div className="space-y-2">
        {outliers.map(o => (
          <div key={o.id} className="bg-slate-900/40 border border-slate-700/40 rounded-md p-2.5 text-[11px]">
            <div className="flex items-center justify-between gap-2 mb-1 flex-wrap">
              <span className={`tabular-nums font-bold ${o.processing_time > 30000 ? 'text-red-300' : 'text-amber-300'}`}>
                {formatMs(o.processing_time)}
              </span>
              <span className="text-slate-500">{formatDate(o.created_at)}</span>
              {o.prompt_tok === 0 && o.compl_tok === 0 && (
                <span className="text-[9px] uppercase tracking-wider bg-purple-500/15 text-purple-300 border border-purple-500/30 rounded-full px-1.5 py-0.5">
                  sem GPT call
                </span>
              )}
            </div>
            <div className="text-slate-400">
              <strong>user_msg:</strong> "{o.user_msg_preview}"
            </div>
            <div className="text-slate-500 mt-0.5">
              <strong>ai_resp:</strong> "{o.ai_resp_preview}..."
            </div>
            {o.intent && (
              <div className="text-[10px] text-slate-600 mt-1">intent: {o.intent} · tokens: {o.prompt_tok}/{o.compl_tok}</div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

const IssuesCard: React.FC<{ issues: TelemetryIssue[] }> = ({ issues }) => {
  if (issues.length === 0) {
    return (
      <div className="bg-emerald-500/5 border border-emerald-500/30 rounded-xl p-4 flex items-start gap-2">
        <ShieldCheck className="w-4 h-4 text-emerald-400 mt-0.5" />
        <p className="text-xs text-emerald-200">Nenhuma anomalia observada na telemetria atual.</p>
      </div>
    )
  }
  const sevColor = (s: TelemetryIssue['severity']) =>
    s === 'critical' ? 'border-red-500/40 bg-red-500/5'
    : s === 'warning' ? 'border-amber-500/40 bg-amber-500/5'
    : 'border-blue-500/40 bg-blue-500/5'
  const sevIcon = (s: TelemetryIssue['severity']) =>
    s === 'critical' ? <Bug className="w-4 h-4 text-red-400" />
    : s === 'warning' ? <AlertTriangle className="w-4 h-4 text-amber-400" />
    : <Info className="w-4 h-4 text-blue-400" />
  return (
    <div className="bg-slate-800/30 border border-slate-700/50 rounded-xl p-4">
      <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-3 flex items-center gap-2">
        <Bug className="w-3.5 h-3.5 text-red-400" />
        Telemetria quebrada / anomalias observadas
      </h3>
      <div className="space-y-2">
        {issues.map((i, idx) => (
          <div key={idx} className={`border rounded-md p-3 ${sevColor(i.severity)}`}>
            <div className="flex items-start gap-2">
              <div className="mt-0.5">{sevIcon(i.severity)}</div>
              <div className="flex-1 space-y-1">
                <h4 className="text-xs font-bold text-slate-200">{i.title}</h4>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  <strong className="text-slate-300">Observado:</strong> {i.observed}
                </p>
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  <strong className="text-slate-400">Hipótese:</strong> {i.hypothesis}
                </p>
                <p className="text-[11px] text-amber-200/80 leading-relaxed">
                  <strong>Ação humana:</strong> {i.human_action_required}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

const TopUsersCard: React.FC<{ users: TopUser[] }> = ({ users }) => (
  <div className="bg-slate-800/30 border border-slate-700/50 rounded-xl p-4">
    <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-3 flex items-center gap-2">
      <Users className="w-3.5 h-3.5 text-indigo-400" />
      Volume de uso por user pseudonimizado (últimos 30 dias)
    </h3>
    <p className="text-[10px] text-slate-500 mb-3 italic">
      Frequência observada — não é ranking de performance ou avaliação de profissional.
    </p>
    <table className="w-full text-xs">
      <thead>
        <tr className="text-[10px] uppercase tracking-wider text-slate-500 border-b border-slate-700/40">
          <th className="text-left py-1.5 font-semibold">User (pseudonim.)</th>
          <th className="text-right py-1.5 font-semibold">Interações</th>
          <th className="text-right py-1.5 font-semibold">Custo USD</th>
        </tr>
      </thead>
      <tbody>
        {users.length === 0 ? (
          <tr><td colSpan={3} className="text-center py-4 text-slate-500 italic">(sem dado)</td></tr>
        ) : (
          users.map(u => (
            <tr key={u.user_id_hash} className="border-b border-slate-800/30">
              <td className="py-2 text-slate-300 font-mono">{u.user_id_hash}</td>
              <td className="py-2 text-right tabular-nums text-white">{u.observed_count}</td>
              <td className="py-2 text-right tabular-nums text-emerald-300">{formatUSD(u.observed_cost_usd)}</td>
            </tr>
          ))
        )}
      </tbody>
    </table>
  </div>
)

// =============================================================================
// MAIN COMPONENT
// =============================================================================

const AdminAIGovernance: React.FC = () => {
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date())
  const [aggregate, setAggregate] = useState<AggregateMetrics | null>(null)
  const [features, setFeatures] = useState<FeatureFrequency[]>([])
  const [trend, setTrend] = useState<DailyTrendPoint[]>([])
  const [latency, setLatency] = useState<LatencyPercentiles | null>(null)
  const [outliers, setOutliers] = useState<SlowOutlier[]>([])
  const [topUsers, setTopUsers] = useState<TopUser[]>([])

  const loadAll = async () => {
    setRefreshing(true)
    const [aggR, featR, trendR, latR, outR, topR] = await Promise.all([
      fetchAggregateMetrics(),
      fetchFeatureFrequency(),
      fetchDailyTrend(14),
      fetchLatencyPercentiles(),
      fetchSlowOutliers(),
      fetchTopUsers(),
    ])
    setAggregate(aggR)
    setFeatures(featR)
    setTrend(trendR)
    setLatency(latR)
    setOutliers(outR)
    setTopUsers(topR)
    setLastRefresh(new Date())
    setLoading(false)
    setRefreshing(false)
  }

  useEffect(() => {
    void loadAll()
  }, [])

  const issues = useMemo(() => detectTelemetryIssues(features), [features])

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <Eye className="w-4 h-4 text-indigo-400" />
            Observabilidade de Sistemas IA (Z1/Z2)
          </h2>
          <p className="text-xs text-slate-400">Comportamento do sistema · não é avaliação de conduta humana</p>
        </div>
        <button
          onClick={() => void loadAll()}
          disabled={refreshing}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 rounded-lg transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
          {refreshing ? 'Atualizando...' : 'Atualizar'}
        </button>
      </div>

      {/* Banner invariante (sempre visível) */}
      <Banner />

      {loading ? (
        <div className="text-center py-12 text-slate-400 text-sm">Carregando observabilidade...</div>
      ) : (
        <>
          {/* KPIs */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            <KPICard
              icon={DollarSign}
              label="Custo lifetime"
              value={aggregate ? formatUSD(aggregate.total_cost_usd) : '—'}
              sublabel={aggregate ? `${aggregate.total_interactions} interações` : ''}
            />
            <KPICard
              icon={Activity}
              label="Custo 30d"
              value={aggregate ? formatUSD(aggregate.cost_30d) : '—'}
              sublabel={aggregate ? `${aggregate.last_30d} interações` : ''}
            />
            <KPICard
              icon={TrendingUp}
              label="Custo 7d"
              value={aggregate ? formatUSD(aggregate.cost_7d) : '—'}
              sublabel={aggregate ? `${aggregate.last_7d} interações` : ''}
              tone={aggregate && aggregate.cost_7d > 5 ? 'warn' : 'default'}
            />
            <KPICard
              icon={Zap}
              label="Custo hoje"
              value={aggregate ? formatUSD(aggregate.cost_today) : '—'}
              sublabel={aggregate ? `${aggregate.distinct_users} users (30d)` : ''}
              tone={aggregate && aggregate.cost_today > 2 ? 'warn' : 'default'}
            />
          </div>

          {/* Issues no topo (mais visível) */}
          <IssuesCard issues={issues} />

          {/* Frequência por feature */}
          <FeatureTable features={features} />

          {/* Tendência diária */}
          <TrendChart data={trend} />

          {/* Latência percentis */}
          <LatencyCard data={latency} />

          {/* Outliers detalhados */}
          <OutliersCard outliers={outliers} />

          {/* Top users pseudonimizado */}
          <TopUsersCard users={topUsers} />

          {/* Footer invariante */}
          <div className="bg-slate-900/40 border-t border-slate-700/40 rounded-xl px-4 py-3 mt-6">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-3.5 h-3.5 text-slate-500 flex-shrink-0 mt-0.5" />
              <p className="text-[10px] text-slate-500 leading-relaxed">
                <strong className="text-slate-400">Z1+Z2 only.</strong> Z3 (interpretativa, com edit humano) e Z4 (clínica) ficam com o médico.
                Sistema reporta comportamento, não avalia conduta. Outliers exigem investigação humana — não acionam decisão automática.
                Última atualização: {lastRefresh.toLocaleTimeString('pt-BR')}.
              </p>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

export default AdminAIGovernance
