import React, { useState, useEffect, useRef } from 'react'
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
  Sparkles,
  X,
  ExternalLink,
  User,
  Zap,
  Clock,
  Bookmark,
  BookmarkPlus,
  Keyboard,
  BarChart3,
  Eye
} from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { simpleCache } from '../lib/simpleCache'
import { NoaResidentAI } from '../lib/noaResidentAI'
import { useSearchHistory, type RecordedSearch } from '../hooks/useSearchHistory'

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

// [V1.9.358] Prop embedded — quando true (dentro de Workstation), esconde header próprio
// pra não duplicar. Padrão de uso:
//  - standalone admin: <AdminCasosSimilares />
//  - dentro Research: <AdminCasosSimilares embedded />
//  - dentro Workstation atendimento: <AdminCasosSimilares embedded defaultQuery="dor" />
interface Props {
  embedded?: boolean
  defaultQuery?: string
}

const AdminCasosSimilares: React.FC<Props> = ({ embedded = false, defaultQuery = '' }) => {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [searchTerm, setSearchTerm] = useState(defaultQuery)
  const [rationalityFilter, setRationalityFilter] = useState<RationalityType>('all')
  const [periodFilter, setPeriodFilter] = useState<Period>(90)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<SearchResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [monthlyCost, setMonthlyCost] = useState<number>(0)
  // [V1.9.356] (18/05): modal preview do caso
  const [selectedCase, setSelectedCase] = useState<CaseResult | null>(null)
  const [caseDetails, setCaseDetails] = useState<any>(null)
  const [loadingCaseDetails, setLoadingCaseDetails] = useState(false)
  // [V1.9.357] (18/05): toggle síntese IA (GPT real) vs determinística (default)
  const [useGPTSynthesis, setUseGPTSynthesis] = useState(false)
  const [sessionCost, setSessionCost] = useState(0)
  // [V1.9.364] (18/05): histórico/favoritos/KPIs (localStorage scoped por user.id)
  const history = useSearchHistory(user?.id)
  const searchInputRef = useRef<HTMLInputElement>(null)
  // autoRunRef: chip click dispara handleSearch APÓS state batch flushar (1 commit React 18)
  const autoRunRef = useRef(false)

  // Carregar detalhes completos quando seleciona caso (content jsonb + racionalidades full)
  useEffect(() => {
    if (!selectedCase) {
      setCaseDetails(null)
      return
    }
    let cancelled = false
    const loadDetails = async () => {
      setLoadingCaseDetails(true)
      try {
        const [reportRes, ratRes] = await Promise.all([
          supabase.from('clinical_reports').select('content, signed_at, status').eq('id', selectedCase.reportId).single(),
          supabase.from('clinical_rationalities').select('rationality_type, assessment, created_at').eq('patient_id', selectedCase.patientId).order('created_at', { ascending: false }).limit(10),
        ])
        if (cancelled) return
        setCaseDetails({
          content: reportRes.data?.content,
          signed_at: reportRes.data?.signed_at,
          status: reportRes.data?.status,
          rationalities: ratRes.data || [],
        })
      } finally {
        if (!cancelled) setLoadingCaseDetails(false)
      }
    }
    void loadDetails()
    return () => { cancelled = true }
  }, [selectedCase])

  // ESC fecha modal
  useEffect(() => {
    if (!selectedCase) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setSelectedCase(null)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [selectedCase])

  // [V1.9.364] Aplicar busca de chip (recent/pinned): set filters → effect dispara handleSearch
  const applyRecorded = (r: RecordedSearch) => {
    autoRunRef.current = true
    setSearchTerm(r.term)
    setRationalityFilter(r.rationality as RationalityType)
    setPeriodFilter(r.period as Period)
    setUseGPTSynthesis(r.useGPT)
  }
  useEffect(() => {
    if (!autoRunRef.current) return
    autoRunRef.current = false
    void handleSearch()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchTerm, rationalityFilter, periodFilter, useGPTSynthesis])

  // [V1.9.364] Atalhos globais: Cmd/Ctrl+K ou "/" focam search input
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (selectedCase) return // modal aberto: deixa o ESC dele agir
      const isMod = e.metaKey || e.ctrlKey
      const target = e.target as HTMLElement | null
      const inField = !!target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)
      if (isMod && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        searchInputRef.current?.focus()
        searchInputRef.current?.select()
        return
      }
      if (e.key === '/' && !inField) {
        e.preventDefault()
        searchInputRef.current?.focus()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [selectedCase])

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

    // Cache key inclui toggle pra separar (síntese GPT vs determinística têm output diferente)
    const cacheKey = `casos-similares:${searchTerm.trim().toLowerCase()}:${rationalityFilter}:${periodFilter}:gpt-${useGPTSynthesis}`
    const cached = simpleCache.get<SearchResult>(cacheKey)
    if (cached) {
      setResult({ ...cached, cached: true })
      setLoading(false)
      // [V1.9.364] cache hit também conta como busca do médico (intenção registrada)
      history.recordSearch(searchTerm, rationalityFilter, periodFilter, useGPTSynthesis)
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

      // Síntese — V1.9.357: toggle entre determinística (default) ou GPT real
      let synthesis: string
      let synthesisCost = 0

      if (useGPTSynthesis && cases.length > 0) {
        // Síntese IA — chama GPT-4o-mini via noaResidentAI com prompt agregador curado
        // Tag [CASOS_SIMILARES_AGGREGATION_MODE] sinaliza ao Core que é agregação,
        // não consulta clínica individual. Anti-alucinação: prompt restringe a fatos.
        try {
          const rationalityExtracts = (rationalities || []).slice(0, 8).map((r: any) => ({
            type: RATIONALITY_LABELS[r.rationality_type as RationalityType] || r.rationality_type,
            extract: r.assessment ? r.assessment.substring(0, 300) : '',
          }))
          const queixas = cases.map(c => `- ${c.queixaPrincipal}`).join('\n')
          const extracts = rationalityExtracts.map(r => `[${r.type}]: ${r.extract}`).join('\n\n')

          const aggregatorPrompt = `[CASOS_SIMILARES_AGGREGATION_MODE]

Você é a Nôa em modo agregação. NÃO sugira conduta clínica. NÃO infira diagnóstico individual. Responda APENAS com base nos dados fornecidos. Use linguagem técnica + agregada.

CONTEXTO:
- Termo de busca: "${searchTerm}"
- Período: últimos ${periodFilter} dias
- Filtro racionalidade: ${RATIONALITY_LABELS[rationalityFilter]}
- ${reportsList.length} relatórios encontrados
- ${patientIds.length} paciente${patientIds.length === 1 ? '' : 's'} único${patientIds.length === 1 ? '' : 's'}
- ${totalRationalitiesApplied} racionalidades aplicadas (${counts})

QUEIXAS PRINCIPAIS:
${queixas}

EXTRATOS DE RACIONALIDADES APLICADAS:
${extracts}

TAREFA:
Em 3-5 parágrafos curtos, agregue os padrões observáveis:
1. O que esses casos têm em comum (sintomas, contexto)?
2. Como as racionalidades aplicadas convergem ou divergem?
3. Sinalize evidências de padrões recorrentes vs casos isolados.

REGRAS RÍGIDAS:
- NÃO sugira tratamento.
- NÃO use "recomendo", "deveria", "indica-se".
- NÃO infira chance de melhora.
- Use "casos sugerem...", "observa-se...", "X de Y casos apresentam...".
- Termine com: "Sistema agrega e apresenta. Decisão clínica é responsabilidade do médico (CFM 2.314)."`

          const noa = new NoaResidentAI()
          const response = await noa.processMessage(aggregatorPrompt, user?.id, user?.email)
          synthesis = response.content
          synthesisCost = 0.03 // estimativa GPT-4o-mini agregação ~3k tokens input + ~500 output
          setSessionCost(prev => prev + synthesisCost)
        } catch (gptErr: any) {
          console.warn('[CasosSimilares] GPT síntese falhou, fallback determinística:', gptErr)
          synthesis = `Encontrados ${reportsList.length} relatórios com "${searchTerm}" nos últimos ${periodFilter} dias. Em ${patientIds.length} ${patientIds.length === 1 ? 'paciente único' : 'pacientes únicos'}. Total de ${totalRationalitiesApplied} racionalidades aplicadas (${counts}). ⚠️ Síntese IA indisponível — fallback determinístico.`
        }
      } else {
        // Síntese determinística (default — custo zero)
        synthesis = `Encontrados ${reportsList.length} relatórios com "${searchTerm}" nos últimos ${periodFilter} dias. ` +
          `Em ${patientIds.length} ${patientIds.length === 1 ? 'paciente único' : 'pacientes únicos'}. ` +
          (totalRationalitiesApplied > 0
            ? `Total de ${totalRationalitiesApplied} racionalidades aplicadas (${counts}). `
            : 'Nenhuma racionalidade aplicada ainda nestes casos. ') +
          `Sistema agrega e apresenta. Interpretação clínica é responsabilidade do médico.`
      }

      const finalResult: SearchResult = {
        cases,
        synthesis,
        totalFound: reportsList.length,
        costUsd: synthesisCost,
        cached: false,
      }

      // Cache 24h
      simpleCache.set(cacheKey, finalResult, 24 * 60 * 60 * 1000)
      setResult(finalResult)
      // [V1.9.364] registra busca bem-sucedida (após cache write)
      history.recordSearch(searchTerm, rationalityFilter, periodFilter, useGPTSynthesis)
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
    // [V1.9.361] Padding lateral em embedded (Pedro: muito próximo do sidebar)
    <div className={embedded ? 'text-white px-4 md:px-6 py-2' : 'min-h-screen bg-[#0f172a] text-white p-6'}>
      <div className={embedded ? 'max-w-5xl' : 'max-w-5xl mx-auto'}>
        {/* Header — só mostra quando standalone (admin). Embedded usa header do parent (Workstation). */}
        {!embedded && (
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
        )}

        {/* [V1.9.363] Banner ALPHA fortíssimo — crítica formal Dr. Ricardo 18/05 noite */}
        {/* Memory: feedback_ricardo_similaridade_por_qual_criterio_18_05 */}
        <div className="bg-amber-500/10 border-2 border-amber-500/40 rounded-xl p-4 mb-6">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
            <div className="space-y-2">
              <h3 className="text-sm font-bold text-amber-300 uppercase tracking-wider">
                ⚠️ Experimental — Não use pra decisão clínica
              </h3>
              <p className="text-xs text-amber-100/90 leading-relaxed">
                Critérios de similaridade ainda <strong>imaturos</strong> (busca textual simples em campos jsonb).
                Pode produzir <strong>falsa sensação de evidência ou recorrência</strong>.
              </p>
              <p className="text-xs text-amber-100/70 leading-relaxed">
                <strong>Crítica formal Dr. Ricardo Valença (18/05/2026):</strong> "similaridade por qual critério?" —
                CID é pobre, impressão diagnóstica varia entre médicos, narrativa carrega viés, longitudinal exige
                maturidade de dados. Sistema ainda não estabilizou taxonomia + governança + pseudonimização robusta.
              </p>
              <p className="text-xs text-amber-200 leading-relaxed font-semibold pt-1 border-t border-amber-500/20">
                Use APENAS pra explorar o corpus internamente. NÃO orientar conduta clínica.
                Sequência prevista: 1º histórico longitudinal do próprio paciente, 2º memória clínica do próprio médico,
                3º (só MUITO depois) casos similares institucionais.
              </p>
            </div>
          </div>
        </div>

        {/* [V1.9.364] Bloco 1 — KPIs pessoais do médico (telemetria do próprio uso) */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mb-6">
          <div className="bg-slate-800/40 border border-slate-700/50 rounded-lg px-3 py-2.5">
            <div className="flex items-center gap-1.5 mb-1">
              <Search className="w-3 h-3 text-purple-400" />
              <span className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold">Buscas hoje</span>
            </div>
            <div className="text-lg font-bold text-white tabular-nums">{history.stats.searchesToday}</div>
          </div>
          <div className="bg-slate-800/40 border border-slate-700/50 rounded-lg px-3 py-2.5">
            <div className="flex items-center gap-1.5 mb-1">
              <BarChart3 className="w-3 h-3 text-purple-400" />
              <span className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold">No mês</span>
            </div>
            <div className="text-lg font-bold text-white tabular-nums">{history.stats.searchesMonth}</div>
          </div>
          <div className="bg-slate-800/40 border border-slate-700/50 rounded-lg px-3 py-2.5">
            <div className="flex items-center gap-1.5 mb-1">
              <Zap className="w-3 h-3 text-yellow-400" />
              <span className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold">Sínteses IA</span>
            </div>
            <div className="text-lg font-bold text-white tabular-nums">
              {history.stats.gptSynthesesMonth}
              <span className="text-[10px] text-slate-500 font-normal ml-1">no mês</span>
            </div>
          </div>
          <div className="bg-slate-800/40 border border-slate-700/50 rounded-lg px-3 py-2.5">
            <div className="flex items-center gap-1.5 mb-1">
              <Eye className="w-3 h-3 text-emerald-400" />
              <span className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold">Casos abertos</span>
            </div>
            <div className="text-lg font-bold text-white tabular-nums">
              {history.casesViewedSession}
              <span className="text-[10px] text-slate-500 font-normal ml-1">sessão</span>
            </div>
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
                  ref={searchInputRef}
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  placeholder='ex: "dor lombar", "fadiga + cannabis", "ansiedade"  (⌘K ou / pra focar)'
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

            {/* [V1.9.364] Bloco 2 — Chips: pinned + últimas buscas (clicar = re-executa) */}
            {(history.pinned.length > 0 || history.recent.length > 0) && (
              <div className="space-y-2">
                {history.pinned.length > 0 && (
                  <div className="flex items-start gap-2 flex-wrap">
                    <span className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider flex items-center gap-1 mt-1">
                      <Bookmark className="w-3 h-3" /> Fixadas
                    </span>
                    {history.pinned.map(p => (
                      <div key={p.id} className="group inline-flex items-center gap-1 bg-amber-500/10 border border-amber-500/30 hover:border-amber-500/60 rounded-full pl-2.5 pr-1 py-0.5 transition-colors">
                        <button
                          onClick={() => applyRecorded(p)}
                          className="text-[11px] text-amber-200 hover:text-amber-100"
                          title={`Re-executar: ${RATIONALITY_LABELS[p.rationality as RationalityType] || p.rationality} · ${p.period}d${p.useGPT ? ' · IA' : ''}`}
                        >
                          {p.label}
                        </button>
                        <button
                          onClick={() => history.unpinSearch(p.id)}
                          className="opacity-50 hover:opacity-100 p-0.5 rounded-full hover:bg-amber-500/20"
                          title="Desfixar"
                        >
                          <X className="w-2.5 h-2.5 text-amber-300" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                {history.recent.length > 0 && (
                  <div className="flex items-start gap-2 flex-wrap">
                    <span className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider flex items-center gap-1 mt-1">
                      <Clock className="w-3 h-3" /> Últimas
                    </span>
                    {history.recent.map((r, i) => (
                      <button
                        key={`${r.term}-${r.rationality}-${r.period}-${i}`}
                        onClick={() => applyRecorded(r)}
                        className="inline-flex items-center gap-1 px-2.5 py-0.5 text-[11px] bg-slate-700/40 hover:bg-purple-500/15 border border-slate-600/50 hover:border-purple-500/40 text-slate-300 hover:text-purple-200 rounded-full transition-colors"
                        title={`${RATIONALITY_LABELS[r.rationality as RationalityType] || r.rationality} · ${r.period}d${r.useGPT ? ' · IA' : ''}`}
                      >
                        {r.term}
                        {r.useGPT && <Zap className="w-2.5 h-2.5 text-yellow-400/70" />}
                      </button>
                    ))}
                    {history.recent.length > 2 && (
                      <button
                        onClick={() => history.clearRecent()}
                        className="text-[10px] text-slate-500 hover:text-slate-300 px-2 py-0.5"
                        title="Limpar histórico de buscas"
                      >
                        limpar
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* [V1.9.357] Toggle síntese IA — opt-in com aviso de custo */}
            <div className="flex items-center justify-between gap-3 p-3 rounded-lg bg-slate-900/50 border border-slate-700/50">
              <div className="flex items-center gap-2.5">
                <Zap className={`w-4 h-4 ${useGPTSynthesis ? 'text-yellow-400' : 'text-slate-500'}`} />
                <div>
                  <div className="text-xs font-semibold text-white">
                    Síntese IA (Nôa agregadora)
                  </div>
                  <div className="text-[10px] text-slate-500">
                    {useGPTSynthesis
                      ? `Custo estimado: ~$0.03/busca · Sessão atual: $${sessionCost.toFixed(2)}`
                      : 'Default: síntese determinística ($0, instantânea)'}
                  </div>
                </div>
              </div>
              <button
                onClick={() => setUseGPTSynthesis(prev => !prev)}
                className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${useGPTSynthesis ? 'bg-yellow-500' : 'bg-slate-600'}`}
                title={useGPTSynthesis ? 'Desativar IA' : 'Ativar IA (custo ~$0.03/busca)'}
              >
                <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${useGPTSynthesis ? 'translate-x-5' : 'translate-x-0.5'}`} />
              </button>
            </div>

            <button
              onClick={handleSearch}
              disabled={loading || !searchTerm.trim()}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-purple-600 hover:bg-purple-700 disabled:bg-slate-700 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-colors"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  {useGPTSynthesis ? 'Buscando + IA sintetizando...' : 'Buscando...'}
                </>
              ) : (
                <>
                  <Search className="w-4 h-4" />
                  Buscar {useGPTSynthesis && <span className="text-yellow-300 text-xs ml-1">⚡ IA</span>}
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
              <h2 className="text-sm font-bold text-purple-300 uppercase tracking-wider mb-3 flex items-center gap-2 flex-wrap">
                <Brain className="w-4 h-4" />
                {result.costUsd > 0 ? 'Síntese (IA agregadora)' : 'Síntese (agregação determinística)'}
                {result.costUsd > 0 && (
                  <span className="text-[10px] font-normal bg-yellow-500/15 text-yellow-300 border border-yellow-500/30 px-2 py-0.5 rounded inline-flex items-center gap-1">
                    <Zap className="w-2.5 h-2.5" /> IA · ${result.costUsd.toFixed(2)}
                  </span>
                )}
                {result.cached && (
                  <span className="text-[10px] font-normal text-slate-500 bg-slate-800 px-2 py-0.5 rounded">cache</span>
                )}
                {/* [V1.9.364] Fixar busca atual (toggle) */}
                {history.isPinned(searchTerm, rationalityFilter, periodFilter) ? (
                  <button
                    onClick={() => history.unpinSearch(`${searchTerm}|${rationalityFilter}|${periodFilter}`)}
                    className="ml-auto inline-flex items-center gap-1 px-2 py-0.5 text-[10px] bg-amber-500/15 border border-amber-500/40 text-amber-200 rounded-full hover:bg-amber-500/25"
                    title="Desfixar"
                  >
                    <Bookmark className="w-2.5 h-2.5 fill-current" /> Fixada
                  </button>
                ) : (
                  <button
                    onClick={() => history.pinSearch({ term: searchTerm, rationality: rationalityFilter, period: periodFilter, useGPT: useGPTSynthesis, ts: Date.now() })}
                    className="ml-auto inline-flex items-center gap-1 px-2 py-0.5 text-[10px] bg-slate-700/40 hover:bg-amber-500/15 border border-slate-600/50 hover:border-amber-500/30 text-slate-400 hover:text-amber-200 rounded-full transition-colors"
                    title="Fixar essa busca (volta nela quando quiser)"
                  >
                    <BookmarkPlus className="w-2.5 h-2.5" /> Fixar
                  </button>
                )}
              </h2>
              <p className="text-sm text-slate-200 leading-relaxed whitespace-pre-line">{result.synthesis}</p>
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
                    onClick={() => { history.recordCaseView(); setSelectedCase(c) }}
                    className="bg-slate-800/40 border border-slate-700/50 rounded-lg p-4 hover:border-purple-500/40 hover:bg-slate-800/60 transition-colors cursor-pointer group"
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

        {/* [V1.9.364] Empty state inteligente — sugestões clicáveis (1ª vez ou volta) */}
        {!result && !loading && !error && (
          <div className="text-center py-12">
            <Sparkles className="w-12 h-12 text-purple-400/50 mx-auto mb-4" />
            {history.recent.length === 0 ? (
              <>
                <p className="text-sm text-slate-300 max-w-md mx-auto leading-relaxed mb-1">
                  Bem-vindo ao Terminal de Pesquisa.
                </p>
                <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed mb-5">
                  Sistema agrega padrões observados no corpus próprio. Pra começar, tente um dos termos abaixo:
                </p>
              </>
            ) : (
              <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed mb-5">
                Digite um padrão clínico acima ou repita uma busca recente. Sugestões pra explorar:
              </p>
            )}
            <div className="flex items-center justify-center gap-2 flex-wrap max-w-lg mx-auto">
              {['dor', 'fadiga', 'cannabis', 'ansiedade', 'rim', 'sono'].map(term => (
                <button
                  key={term}
                  onClick={() => applyRecorded({ term, rationality: 'all', period: 90, useGPT: false, ts: Date.now() })}
                  className="px-3 py-1.5 text-xs bg-slate-800/60 hover:bg-purple-500/15 border border-slate-700 hover:border-purple-500/40 text-slate-300 hover:text-purple-200 rounded-full transition-colors"
                >
                  {term}
                </button>
              ))}
            </div>
            <p className="text-[10px] text-slate-600 mt-6">
              Fase 1 (admin spike) · memória clínica institucional · ⚠️ ainda experimental
            </p>
          </div>
        )}

        {/* [V1.9.364] Bloco 7 — footer atalhos teclado (sinal de ferramenta profissional) */}
        <div className="mt-8 pt-4 border-t border-slate-800/60 flex items-center justify-center gap-4 flex-wrap text-[10px] text-slate-600">
          <span className="flex items-center gap-1.5">
            <Keyboard className="w-3 h-3" />
            <span className="font-semibold uppercase tracking-wider">Atalhos:</span>
          </span>
          <span><kbd className="px-1.5 py-0.5 bg-slate-800 border border-slate-700 rounded text-slate-400 font-mono text-[9px]">⌘K</kbd> ou <kbd className="px-1.5 py-0.5 bg-slate-800 border border-slate-700 rounded text-slate-400 font-mono text-[9px]">/</kbd> focar busca</span>
          <span><kbd className="px-1.5 py-0.5 bg-slate-800 border border-slate-700 rounded text-slate-400 font-mono text-[9px]">↵</kbd> buscar</span>
          <span><kbd className="px-1.5 py-0.5 bg-slate-800 border border-slate-700 rounded text-slate-400 font-mono text-[9px]">Esc</kbd> fechar modal</span>
        </div>
      </div>

      {/* [V1.9.356] Modal preview do caso — abre quando clica em qualquer card */}
      {selectedCase && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150"
          onClick={() => setSelectedCase(null)}
        >
          <div
            className="bg-slate-900 border border-slate-700 rounded-xl max-w-3xl w-full max-h-[85vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header modal */}
            <div className="sticky top-0 bg-slate-900 border-b border-slate-700/50 px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-purple-500/10 border border-purple-500/20">
                  <User className="w-4 h-4 text-purple-400" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">{selectedCase.patientName}</h3>
                  <p className="text-xs text-slate-400">{formatDate(selectedCase.createdAt)}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedCase(null)}
                className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
                title="Fechar (ESC)"
              >
                <X className="w-4 h-4 text-slate-400" />
              </button>
            </div>

            <div className="p-6 space-y-5">
              {loadingCaseDetails ? (
                <div className="text-center py-8">
                  <Loader2 className="w-6 h-6 text-purple-400 animate-spin mx-auto mb-2" />
                  <p className="text-xs text-slate-500">Carregando detalhes...</p>
                </div>
              ) : (
                <>
                  {/* Status */}
                  {caseDetails?.signed_at && (
                    <div className="flex items-center gap-2 text-xs">
                      <span className="px-2 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 font-semibold">
                        Assinado em {formatDate(caseDetails.signed_at)}
                      </span>
                    </div>
                  )}

                  {/* Queixa principal */}
                  <div>
                    <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Queixa Principal</h4>
                    <p className="text-sm text-slate-200 leading-relaxed">
                      {caseDetails?.content?.queixa_principal || caseDetails?.content?.chiefComplaint || selectedCase.queixaPrincipal || '—'}
                    </p>
                  </div>

                  {/* Lista indiciária */}
                  {Array.isArray(caseDetails?.content?.lista_indiciaria) && caseDetails.content.lista_indiciaria.length > 0 && (
                    <div>
                      <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Lista Indiciária</h4>
                      <ul className="space-y-1">
                        {caseDetails.content.lista_indiciaria.map((item: any, i: number) => (
                          <li key={i} className="text-xs text-slate-300 flex gap-2">
                            <span className="text-purple-400">▸</span>
                            <span>{typeof item === 'string' ? item : (item?.label || JSON.stringify(item))}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Racionalidades aplicadas — full */}
                  {caseDetails?.rationalities && caseDetails.rationalities.length > 0 && (
                    <div>
                      <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">
                        Racionalidades Aplicadas ({caseDetails.rationalities.length})
                      </h4>
                      <div className="space-y-2">
                        {caseDetails.rationalities.map((r: any, i: number) => (
                          <div key={i} className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-3">
                            <div className="flex items-center justify-between mb-1.5">
                              <span className="px-2 py-0.5 text-[10px] bg-purple-500/15 text-purple-300 border border-purple-500/30 rounded-full font-semibold">
                                {RATIONALITY_LABELS[r.rationality_type as RationalityType] || r.rationality_type}
                              </span>
                              <span className="text-[10px] text-slate-500">{formatDate(r.created_at)}</span>
                            </div>
                            <p className="text-xs text-slate-300 leading-relaxed">
                              {r.assessment ? r.assessment.substring(0, 350) + (r.assessment.length > 350 ? '...' : '') : '—'}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Ação navegar pro report completo */}
                  <div className="pt-3 border-t border-slate-700/50 flex items-center justify-between flex-wrap gap-2">
                    <p className="text-[10px] text-slate-500">
                      💡 Sistema agrega + apresenta. Decisão clínica é do médico (CFM 2.314).
                    </p>
                    <button
                      onClick={() => navigate(`/app/clinica/profissional/dashboard?section=terminal-clinico&tab=patient-focus`)}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-purple-300 hover:text-purple-200 hover:bg-purple-500/10 rounded-lg transition-colors"
                    >
                      <ExternalLink className="w-3 h-3" />
                      Abrir no prontuário
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default AdminCasosSimilares
