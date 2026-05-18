import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Search,
  Filter,
  Calendar,
  Brain,
  AlertCircle,
  Loader2,
  TrendingUp,
  ChevronLeft,
  FileText,
  DollarSign,
  Sparkles
} from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { simpleCache } from '../lib/simpleCache'

// [V1.9.354] (18/05/2026) — Casos Similares Admin Spike (Fase 1)
// Memory: project_casos_similares_memoria_clinica_institucional_18_05
// Positioning: "memória clínica institucional" NÃO "IA diagnóstica" (cláusula master:
// sistema agrega + apresenta, médico decide).
//
// Fase 1 = admin only (Pedro valida conceito).
// Fase 2 (médico próprios casos) e Fase 3 (cross-doctor anonimizado) parqueadas.
//
// Anti-regressão:
// - Rota nova isolada (/app/admin/casos-similares)
// - Componente novo (não modifica nada)
// - Só SELECT no banco (zero INSERT/UPDATE/DELETE)
// - Admin bypass RLS natural (sem function nova)
// - Zero toque AEC FSM / Pipeline / PBAD / Lock V1.9.95/299
// - Cache 24h + limit duro 50 cases + janela 365d (proteção custo)

type RationalityType = 'all' | 'biomedical' | 'traditional_chinese' | 'ayurvedic' | 'homeopathic' | 'integrative'
type Period = 30 | 90 | 365

interface CaseResult {
  reportId: string
  patientId: string
  patientName: string
  createdAt: string
  queixaPrincipal: string
  rationalitiesApplied: string[]
}

interface SearchResult {
  cases: CaseResult[]
  synthesis: string
  totalFound: number
  costUsd: number
  cached: boolean
}

const RATIONALITY_LABELS: Record<RationalityType, string> = {
  all: 'Todas',
  biomedical: 'Biomédica',
  traditional_chinese: 'MTC',
  ayurvedic: 'Ayurveda',
  homeopathic: 'Homeopatia',
  integrative: 'Integrativa',
}

const AdminCasosSimilares: React.FC = () => {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [searchTerm, setSearchTerm] = useState('')
  const [rationalityFilter, setRationalityFilter] = useState<RationalityType>('all')
  const [periodFilter, setPeriodFilter] = useState<Period>(90)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<SearchResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [monthlyCost, setMonthlyCost] = useState<number>(0)

  // Carregar custo mensal acumulado (admin spike — só Casos Similares = simbologia própria)
  useEffect(() => {
    const loadMonthlyCost = async () => {
      const monthAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
      const { data } = await supabase
        .from('ai_chat_interactions')
        .select('metadata')
        .gte('created_at', monthAgo)
        .eq('metadata->>simbologia', '🔬 Casos Similares')
      if (data) {
        const total = data.reduce((sum, row: any) => {
          const cost = parseFloat(row.metadata?.cost_usd_estimate || '0')
          return sum + (isNaN(cost) ? 0 : cost)
        }, 0)
        setMonthlyCost(total)
      }
    }
    void loadMonthlyCost()
  }, [result])

  const handleSearch = async () => {
    if (!searchTerm.trim() || searchTerm.trim().length < 3) {
      setError('Digite pelo menos 3 caracteres pra buscar')
      return
    }

    // Cap mensal duro (proteção): $50/mês
    if (monthlyCost > 50) {
      setError(`Cap mensal atingido ($${monthlyCost.toFixed(2)} de $50). Aguarde próximo mês ou aumente cap.`)
      return
    }

    setError(null)
    setLoading(true)

    // Cache key
    const cacheKey = `casos-similares:${searchTerm.trim().toLowerCase()}:${rationalityFilter}:${periodFilter}`
    const cached = simpleCache.get<SearchResult>(cacheKey)
    if (cached) {
      setResult({ ...cached, cached: true })
      setLoading(false)
      return
    }

    try {
      // 1. Buscar reports com match em campos jsonb específicos
      // [V1.9.355] (18/05): fix bug "operator does not exist: jsonb ~~* unknown"
      // V1.9.354 tentou .ilike('content::text', term) mas Postgres não converte
      // jsonb→text direto em ILIKE. Solução: or() com paths jsonb explícitos
      // (content->>field). Cobre os campos mais comuns onde paciente menciona queixa.
      const periodCutoff = new Date(Date.now() - periodFilter * 24 * 60 * 60 * 1000).toISOString()
      const term = `%${searchTerm.trim()}%`
      const orFilter = [
        `content->>queixa_principal.ilike.${term}`,
        `content->>chiefComplaint.ilike.${term}`,
        `content->>structured.ilike.${term}`,
        `content->>assessment.ilike.${term}`,
      ].join(',')

      const { data: reports, error: reportsError } = await supabase
        .from('clinical_reports')
        .select('id, patient_id, created_at, content')
        .gte('created_at', periodCutoff)
        .or(orFilter)
        .limit(50)

      if (reportsError) throw new Error(`Erro busca reports: ${reportsError.message}`)

      const reportsList = reports || []
      if (reportsList.length === 0) {
        setResult({
          cases: [],
          synthesis: `Nenhum caso encontrado com "${searchTerm}" nos últimos ${periodFilter} dias. Tente termos mais amplos (ex: "dor", "fadiga", "cannabis") ou aumente o período.`,
          totalFound: 0,
          costUsd: 0,
          cached: false,
        })
        setLoading(false)
        return
      }

      // 2. Buscar racionalidades vinculadas (filtrar por tipo se necessário)
      const patientIds = [...new Set(reportsList.map((r: any) => r.patient_id).filter(Boolean))]
      let rationalitiesQuery = supabase
        .from('clinical_rationalities')
        .select('patient_id, rationality_type, assessment, created_at')
        .in('patient_id', patientIds)

      if (rationalityFilter !== 'all') {
        rationalitiesQuery = rationalitiesQuery.eq('rationality_type', rationalityFilter)
      }

      const { data: rationalities } = await rationalitiesQuery

      // 3. Buscar nomes pacientes
      const { data: patients } = await supabase
        .from('users')
        .select('id, name')
        .in('id', patientIds)
      const patientNameMap: Record<string, string> = {}
      patients?.forEach((p: any) => { patientNameMap[p.id] = p.name || 'Paciente' })

      // 4. Montar resultados (top 5)
      const ratByPatient: Record<string, string[]> = {}
      rationalities?.forEach((r: any) => {
        if (!ratByPatient[r.patient_id]) ratByPatient[r.patient_id] = []
        if (!ratByPatient[r.patient_id].includes(r.rationality_type)) {
          ratByPatient[r.patient_id].push(r.rationality_type)
        }
      })

      const cases: CaseResult[] = reportsList.slice(0, 5).map((r: any) => {
        const content = typeof r.content === 'object' ? r.content : {}
        const queixa = content.queixa_principal || content.chiefComplaint || '—'
        return {
          reportId: r.id,
          patientId: r.patient_id,
          patientName: patientNameMap[r.patient_id] || 'Paciente',
          createdAt: r.created_at,
          queixaPrincipal: typeof queixa === 'string' ? queixa.substring(0, 100) : '—',
          rationalitiesApplied: ratByPatient[r.patient_id] || [],
        }
      })

      // 5. Síntese GPT — chamada simples via OpenAI direto via Edge tradevision-core
      // ESCOPO LIMITADO: agregação textual + comparação de racionalidades (sem sugestão clínica)
      const totalRationalitiesApplied = rationalities?.length || 0
      const rationalityCounts: Record<string, number> = {}
      rationalities?.forEach((r: any) => {
        rationalityCounts[r.rationality_type] = (rationalityCounts[r.rationality_type] || 0) + 1
      })
      const counts = Object.entries(rationalityCounts)
        .sort((a, b) => b[1] - a[1])
        .map(([type, count]) => `${RATIONALITY_LABELS[type as RationalityType] || type}: ${count}`)
        .join(', ')

      // Síntese local (sem GPT) — Fase 1 admin spike economiza custo, mostra agregação determinística
      const synthesis = `Encontrados ${reportsList.length} relatórios com "${searchTerm}" nos últimos ${periodFilter} dias. ` +
        `Em ${patientIds.length} ${patientIds.length === 1 ? 'paciente único' : 'pacientes únicos'}. ` +
        (totalRationalitiesApplied > 0
          ? `Total de ${totalRationalitiesApplied} racionalidades aplicadas (${counts}). `
          : 'Nenhuma racionalidade aplicada ainda nestes casos. ') +
        `Sistema agrega e apresenta. Interpretação clínica é responsabilidade do médico.`

      const finalResult: SearchResult = {
        cases,
        synthesis,
        totalFound: reportsList.length,
        costUsd: 0, // Síntese local em V1.9.354 (sem GPT). Versões futuras: chamar GPT
        cached: false,
      }

      // Cache 24h
      simpleCache.set(cacheKey, finalResult, 24 * 60 * 60 * 1000)
      setResult(finalResult)
    } catch (err: any) {
      setError(err.message || 'Erro inesperado na busca')
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (iso: string) => {
    try {
      return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })
    } catch {
      return iso
    }
  }

  return (
    <div className="min-h-screen bg-[#0f172a] text-white p-6">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/app/admin')}
              className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
              title="Voltar"
            >
              <ChevronLeft className="w-5 h-5 text-slate-400" />
            </button>
            <div className="p-2 rounded-lg bg-purple-500/10 border border-purple-500/20">
              <Sparkles className="w-5 h-5 text-purple-400" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">Casos Similares</h1>
              <p className="text-xs text-slate-400">Admin Spike · Memória clínica institucional</p>
            </div>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800/50 border border-slate-700">
            <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
            <span className="text-xs text-slate-400">Cap mensal:</span>
            <span className="text-xs font-bold text-white">${monthlyCost.toFixed(2)} / $50</span>
          </div>
        </div>

        {/* Search bar */}
        <div className="bg-slate-800/30 border border-slate-700/50 rounded-xl p-5 mb-6">
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-2 uppercase tracking-wider">
                Buscar padrão clínico
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  placeholder='ex: "dor lombar", "fadiga + cannabis", "ansiedade"'
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-900 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-purple-500/50"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-2 uppercase tracking-wider flex items-center gap-1.5">
                  <Filter className="w-3 h-3" /> Racionalidade
                </label>
                <select
                  value={rationalityFilter}
                  onChange={(e) => setRationalityFilter(e.target.value as RationalityType)}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:border-purple-500/50"
                >
                  {Object.entries(RATIONALITY_LABELS).map(([key, label]) => (
                    <option key={key} value={key}>{label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-2 uppercase tracking-wider flex items-center gap-1.5">
                  <Calendar className="w-3 h-3" /> Período
                </label>
                <select
                  value={periodFilter}
                  onChange={(e) => setPeriodFilter(parseInt(e.target.value) as Period)}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:border-purple-500/50"
                >
                  <option value={30}>Últimos 30 dias</option>
                  <option value={90}>Últimos 90 dias</option>
                  <option value={365}>Últimos 365 dias</option>
                </select>
              </div>
            </div>

            <button
              onClick={handleSearch}
              disabled={loading || !searchTerm.trim()}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-purple-600 hover:bg-purple-700 disabled:bg-slate-700 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-colors"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Buscando...
                </>
              ) : (
                <>
                  <Search className="w-4 h-4" />
                  Buscar
                </>
              )}
            </button>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 mb-6 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-300">{error}</p>
          </div>
        )}

        {/* Results */}
        {result && (
          <div className="space-y-6">
            {/* Síntese */}
            <div className="bg-purple-500/5 border border-purple-500/30 rounded-xl p-5">
              <h2 className="text-sm font-bold text-purple-300 uppercase tracking-wider mb-3 flex items-center gap-2">
                <Brain className="w-4 h-4" />
                Síntese (agregação determinística)
                {result.cached && (
                  <span className="text-[10px] font-normal text-slate-500 bg-slate-800 px-2 py-0.5 rounded">cache</span>
                )}
              </h2>
              <p className="text-sm text-slate-200 leading-relaxed">{result.synthesis}</p>
              <p className="text-[10px] text-slate-500 mt-3 leading-relaxed">
                💡 Sistema agrega + apresenta. Decisão clínica é responsabilidade do médico (CFM 2.314).
              </p>
            </div>

            {/* Cases */}
            {result.cases.length > 0 && (
              <div className="space-y-3">
                <h2 className="text-sm font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  Top {result.cases.length} casos (de {result.totalFound} encontrados)
                </h2>
                {result.cases.map((c, idx) => (
                  <div
                    key={c.reportId}
                    className="bg-slate-800/40 border border-slate-700/50 rounded-lg p-4 hover:border-purple-500/30 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-bold text-purple-400">Caso #{idx + 1}</span>
                          <span className="text-xs text-slate-500">·</span>
                          <span className="text-xs text-slate-400">{formatDate(c.createdAt)}</span>
                        </div>
                        <p className="text-sm font-medium text-white">{c.patientName}</p>
                      </div>
                    </div>
                    <div className="mt-2 space-y-1.5">
                      <p className="text-xs text-slate-300">
                        <span className="text-slate-500 font-semibold">Queixa:</span> {c.queixaPrincipal}
                      </p>
                      {c.rationalitiesApplied.length > 0 && (
                        <div className="flex flex-wrap items-center gap-1.5 mt-2">
                          <span className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">Racionalidades:</span>
                          {c.rationalitiesApplied.map(rt => (
                            <span
                              key={rt}
                              className="px-2 py-0.5 text-[10px] bg-purple-500/15 text-purple-300 border border-purple-500/30 rounded-full"
                            >
                              {RATIONALITY_LABELS[rt as RationalityType] || rt}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Empty state inicial */}
        {!result && !loading && !error && (
          <div className="text-center py-16">
            <Sparkles className="w-12 h-12 text-purple-400/50 mx-auto mb-4" />
            <p className="text-sm text-slate-400 max-w-md mx-auto leading-relaxed">
              Digite um padrão clínico acima pra buscar casos similares no corpus próprio
              ({/* TODO replace com valores dinâmicos quando atingir 200+ */}128 relatórios + 119 racionalidades).
              Esta é a Fase 1 (admin spike) — validação de conceito.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

export default AdminCasosSimilares
