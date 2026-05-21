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
  Eye,
  ChevronDown
} from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { simpleCache } from '../lib/simpleCache'
import { NoaResidentAI } from '../lib/noaResidentAI'
import { useSearchHistory, type RecordedSearch, type PinnedSearch, type OpenedCase } from '../hooks/useSearchHistory'
import {
  extractClinicalTermsFromDictionary,
  buildPubMedQueryFromTerms,
  type ExtractedTerm,
  type QueryMode,
} from '../lib/clinicalTermsTranslator'
import { buildQueryViaGPT } from '../lib/gptQueryBuilder'
import {
  searchPubMed,
  EVIDENCE_LABELS,
  EVIDENCE_COLORS,
  type EvidenceLevel,
  type PubMedArticle,
} from '../services/pubmedService'

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

// [V1.9.358] Prop embedded — quando true (dentro de Workstation), esconde header próprio.
// [V1.9.366] showSidebar — controle EXPLÍCITO da sidebar (Trilha + Notas), independente
// de embedded. Default = !embedded (mantém compat V1.9.365). Padrão de uso:
//  - standalone admin: <AdminCasosSimilares />                       → sidebar ON
//  - Terminal de Pesquisa: <AdminCasosSimilares embedded showSidebar />  → sidebar ON
//  - Workstation atendimento: <AdminCasosSimilares embedded />       → sidebar OFF (apertado)
interface Props {
  embedded?: boolean
  defaultQuery?: string
  showSidebar?: boolean
  // [V1.9.369-C] Cross-link: parent (ResearchWorkstation) recebe termo extraído
  // de uma racionalidade e navega pra aba Literatura com query pré-preenchida.
  onNavigateToLiterature?: (term: string) => void
}

// ─────────────────────────────────────────────────────────────────────────────
// [V1.9.365] Sidebar panels — Trilha de Pesquisa + Notas Rápidas
// ─────────────────────────────────────────────────────────────────────────────

type TrailFilter = 'today' | 'week' | 'month'

interface TrailPanelProps {
  recent: RecordedSearch[]
  caseOpens: OpenedCase[]
  pinned: PinnedSearch[]
  rationalityLabels: Record<string, string>
  onReplaySearch: (r: RecordedSearch) => void
  onOpenCase: (c: OpenedCase) => void
  onClearCases: () => void
}

const startOfDay = (ts: number) => {
  const d = new Date(ts)
  d.setHours(0, 0, 0, 0)
  return d.getTime()
}

const dayLabel = (dayKey: string) => {
  const today = new Date()
  const yesterday = new Date(Date.now() - 86400000)
  const todayKey = today.toISOString().slice(0, 10)
  const ydayKey = yesterday.toISOString().slice(0, 10)
  if (dayKey === todayKey) return 'Hoje'
  if (dayKey === ydayKey) return 'Ontem'
  const d = new Date(dayKey + 'T00:00:00')
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })
}

const timeLabel = (ts: number) =>
  new Date(ts).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })

const TrailPanel: React.FC<TrailPanelProps> = ({
  recent,
  caseOpens,
  rationalityLabels,
  onReplaySearch,
  onOpenCase,
  onClearCases,
}) => {
  const [filter, setFilter] = useState<TrailFilter>('today')

  type TrailItem =
    | { kind: 'search'; ts: number; data: RecordedSearch }
    | { kind: 'caseopen'; ts: number; data: OpenedCase }

  const all: TrailItem[] = [
    ...recent.map(r => ({ kind: 'search' as const, ts: r.ts, data: r })),
    ...caseOpens.map(c => ({ kind: 'caseopen' as const, ts: c.ts, data: c })),
  ].sort((a, b) => b.ts - a.ts)

  const now = Date.now()
  const cutoff =
    filter === 'today' ? startOfDay(now)
    : filter === 'week' ? now - 7 * 86400000
    : now - 30 * 86400000

  const filtered = all.filter(i => i.ts >= cutoff)

  const groups = filtered.reduce<Record<string, TrailItem[]>>((acc, item) => {
    const day = new Date(item.ts).toISOString().slice(0, 10)
    ;(acc[day] = acc[day] || []).push(item)
    return acc
  }, {})

  return (
    <div className="bg-slate-800/30 border border-slate-700/50 rounded-xl p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
          <Clock className="w-3.5 h-3.5 text-purple-400" />
          Trilha de Pesquisa
        </h3>
        {caseOpens.length > 0 && (
          <button
            onClick={onClearCases}
            className="text-[10px] text-slate-500 hover:text-slate-300"
            title="Limpar histórico de casos abertos"
          >
            limpar
          </button>
        )}
      </div>
      <div className="flex items-center gap-1 mb-3">
        {(['today', 'week', 'month'] as TrailFilter[]).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-2.5 py-1 text-[10px] uppercase tracking-wider font-semibold rounded-full transition-colors ${
              filter === f
                ? 'bg-purple-500/20 text-purple-200 border border-purple-500/40'
                : 'bg-slate-800/50 text-slate-500 border border-slate-700 hover:text-slate-300'
            }`}
          >
            {f === 'today' ? 'Hoje' : f === 'week' ? '7 dias' : '30 dias'}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-6 text-[11px] text-slate-500 leading-relaxed">
          Nenhuma atividade no período.<br />
          Faça uma busca ou abra um caso pra começar a trilha.
        </div>
      ) : (
        <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1">
          {Object.entries(groups).map(([day, items]) => (
            <div key={day}>
              <div className="text-[10px] uppercase tracking-wider text-slate-600 font-semibold mb-1.5 sticky top-0 bg-slate-800/30 backdrop-blur-sm py-0.5">
                {dayLabel(day)}
              </div>
              <div className="space-y-1">
                {items.map((item, i) => (
                  item.kind === 'search' ? (
                    <button
                      key={`s-${item.ts}-${i}`}
                      onClick={() => onReplaySearch(item.data)}
                      className="w-full text-left flex items-start gap-2 px-2 py-1.5 rounded-md hover:bg-purple-500/10 transition-colors group"
                      title={`Re-executar: ${rationalityLabels[item.data.rationality] || item.data.rationality} · ${item.data.period}d`}
                    >
                      <Search className="w-3 h-3 text-purple-400 flex-shrink-0 mt-0.5" />
                      <div className="flex-1 min-w-0">
                        <div className="text-[11px] text-slate-300 group-hover:text-purple-200 truncate">
                          buscou <span className="font-semibold">"{item.data.term}"</span>
                        </div>
                        <div className="text-[9px] text-slate-600">
                          {timeLabel(item.ts)} · {rationalityLabels[item.data.rationality] || item.data.rationality} · {item.data.period}d
                          {item.data.useGPT && <span className="ml-1 text-yellow-500">⚡</span>}
                        </div>
                      </div>
                    </button>
                  ) : (
                    <button
                      key={`c-${item.ts}-${i}`}
                      onClick={() => onOpenCase(item.data)}
                      className="w-full text-left flex items-start gap-2 px-2 py-1.5 rounded-md hover:bg-emerald-500/10 transition-colors group"
                      title="Reabrir caso"
                    >
                      <Eye className="w-3 h-3 text-emerald-400 flex-shrink-0 mt-0.5" />
                      <div className="flex-1 min-w-0">
                        <div className="text-[11px] text-slate-300 group-hover:text-emerald-200 truncate">
                          abriu <span className="font-semibold">{item.data.patientName}</span>
                        </div>
                        <div className="text-[9px] text-slate-600 truncate">
                          {timeLabel(item.ts)}
                          {item.data.queixa && ` · ${item.data.queixa}`}
                        </div>
                      </div>
                    </button>
                  )
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

interface NotesPanelProps {
  notes: string
  onChange: (s: string) => void
}

const NotesPanel: React.FC<NotesPanelProps> = ({ notes, onChange }) => {
  const MAX = 8000
  return (
    <div className="bg-slate-800/30 border border-slate-700/50 rounded-xl p-4">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
          <FileText className="w-3.5 h-3.5 text-amber-400" />
          Notas Rápidas
        </h3>
        <span className={`text-[10px] tabular-nums ${notes.length > MAX * 0.9 ? 'text-amber-400' : 'text-slate-600'}`}>
          {notes.length} / {MAX}
        </span>
      </div>
      <textarea
        value={notes}
        onChange={(e) => onChange(e.target.value.slice(0, MAX))}
        placeholder="Anotações da sua sessão de pesquisa. Persistido localmente neste navegador, só você vê."
        rows={8}
        className="w-full px-3 py-2 bg-slate-900/60 border border-slate-700/50 rounded-lg text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-amber-500/40 resize-y leading-relaxed"
      />
      <p className="text-[9px] text-slate-600 mt-1.5 leading-relaxed">
        💾 Salvo automaticamente · localStorage · não sai do navegador
      </p>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// [V1.9.371] LiteratureReport — mini-relatório AGREGADO (inteligência estrutural)
// Memory: feedback_inteligencia_estrutural_vs_inferencial_18_05
// Princípio: AGREGAR + CONTAR + AGRUPAR + ORDENAR ≠ SINTETIZAR significado clínico
// ─────────────────────────────────────────────────────────────────────────────

const EVIDENCE_ICON: Record<EvidenceLevel, string> = {
  'meta-analysis': '🏆',
  'rct': '🔬',
  'guideline': '📋',
  'observational': '📈',
  'review': '📚',
  'case-report': '📝',
  'other': '📄',
}

const EVIDENCE_ORDER: EvidenceLevel[] = [
  'meta-analysis', 'rct', 'guideline', 'observational', 'review', 'case-report', 'other',
]

function parsePubYear(pubdate: string): number | null {
  const match = pubdate.match(/\b(19|20)\d{2}\b/)
  return match ? parseInt(match[0], 10) : null
}

// [V1.9.372] Sub-categorias heurísticas pra grupo "Outros" (5ª análise GPT externa).
// Sem IA — só keyword match em title+journal. Reduz ruído cognitivo do grupo genérico.
type OtherSubgroup = 'safety' | 'preclinical' | 'epidemiologic' | 'misc'

const OTHER_SUBGROUP_LABEL: Record<OtherSubgroup, string> = {
  safety: '🚨 Segurança / Efeitos adversos',
  preclinical: '🧪 Pré-clínico',
  epidemiologic: '📊 Epidemiológicos',
  misc: '📄 Outros',
}

function classifyOtherSubgroup(art: PubMedArticle): OtherSubgroup {
  const text = `${art.title} ${art.journal}`.toLowerCase()
  if (/\b(use disorder|abuse|hyperemesis|adverse|toxic|safety|overdose|withdrawal|adverse reaction|adverse event)\b/.test(text)) {
    return 'safety'
  }
  if (/\b(in mice|in vitro|pharmacokin|preclinic|animal|murine|mouse|rat|cell line|receptor binding)\b/.test(text)) {
    return 'preclinical'
  }
  if (/\b(prevalence|cross-sectional|cohort|epidemiolog|incidence|survey|population-based)\b/.test(text)) {
    return 'epidemiologic'
  }
  return 'misc'
}

// [V1.9.372] Linha "potencialmente periférico" — % overlap title × query.
// Sinaliza honestamente paper que pode ter foco diferente. Honesto sobre lexical noise.
// memory: feedback_lexical_nao_e_clinica_18_05
function tokenizeQuery(query: string): string[] {
  // Extrai palavras (sem aspas, sem operadores PubMed)
  return query
    .toLowerCase()
    .replace(/[\[\]"()]/g, ' ')
    .replace(/\b(and|or|not|title|abstract|mesh|terms|publication|type)\b/g, ' ')
    .split(/\s+/)
    .filter(w => w.length > 3)
}

function isPotentiallyPeripheral(art: PubMedArticle, queryTokens: string[]): boolean {
  if (queryTokens.length === 0) return false
  const titleLower = art.title.toLowerCase()
  const hits = queryTokens.filter(t => titleLower.includes(t)).length
  return hits / queryTokens.length < 0.3 // menos de 30% dos termos no título
}

interface LiteratureReportProps {
  articles: PubMedArticle[]
  total: number
  query: string
}

const LiteratureReport: React.FC<LiteratureReportProps> = ({ articles, total, query }) => {
  if (articles.length === 0) {
    return (
      <div className="bg-slate-800/40 border border-slate-700/50 rounded-lg p-4 text-center">
        <p className="text-xs text-slate-400">
          Nenhum resultado pra "{query}"
        </p>
        <p className="text-[10px] text-slate-600 mt-1">
          Tente termos em inglês ou refine na aba Literatura.
        </p>
      </div>
    )
  }

  // Agrupamento ESTRUTURAL por evidence level
  const grouped: Partial<Record<EvidenceLevel, PubMedArticle[]>> = {}
  for (const art of articles) {
    if (!grouped[art.evidenceLevel]) grouped[art.evidenceLevel] = []
    grouped[art.evidenceLevel]!.push(art)
  }

  // Métricas estruturais (contagens, ordenação — NÃO interpretação)
  const currentYear = new Date().getFullYear()
  const last5 = articles.filter(a => {
    const y = parsePubYear(a.pubdate)
    return y !== null && y >= currentYear - 5
  }).length
  const last1 = articles.filter(a => {
    const y = parsePubYear(a.pubdate)
    return y !== null && y >= currentYear - 1
  }).length

  // Top 3 journals
  const journalCounts: Record<string, number> = {}
  for (const a of articles) {
    if (a.journal) journalCounts[a.journal] = (journalCounts[a.journal] || 0) + 1
  }
  const topJournals = Object.entries(journalCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)

  return (
    <div className="bg-slate-800/40 border border-indigo-500/30 rounded-lg overflow-hidden">
      {/* Header relatório */}
      <div className="px-4 py-3 bg-indigo-500/10 border-b border-indigo-500/20 flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <BarChart3 className="w-4 h-4 text-indigo-400" />
          <h4 className="text-xs font-bold text-indigo-200 uppercase tracking-wider">Relatório estrutural</h4>
        </div>
        <span className="text-[10px] text-slate-400 tabular-nums">
          {articles.length} mostrados · {total.toLocaleString('pt-BR')} no PubMed
        </span>
      </div>

      <div className="p-4 space-y-4 max-h-[440px] overflow-y-auto">
        {/* Métricas estruturais (contagens — NÃO interpretação) */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          <div className="bg-slate-900/60 border border-slate-700/40 rounded-md px-2 py-1.5">
            <div className="text-[9px] uppercase tracking-wider text-slate-500 font-semibold">Total PubMed</div>
            <div className="text-sm font-bold text-white tabular-nums">{total.toLocaleString('pt-BR')}</div>
          </div>
          <div className="bg-slate-900/60 border border-slate-700/40 rounded-md px-2 py-1.5">
            <div className="text-[9px] uppercase tracking-wider text-slate-500 font-semibold">Últimos 5 anos</div>
            <div className="text-sm font-bold text-white tabular-nums">{last5}/{articles.length}</div>
          </div>
          <div className="bg-slate-900/60 border border-slate-700/40 rounded-md px-2 py-1.5">
            <div className="text-[9px] uppercase tracking-wider text-slate-500 font-semibold">Último ano</div>
            <div className="text-sm font-bold text-white tabular-nums">{last1}/{articles.length}</div>
          </div>
          <div className="bg-slate-900/60 border border-slate-700/40 rounded-md px-2 py-1.5">
            <div className="text-[9px] uppercase tracking-wider text-slate-500 font-semibold">Top journal</div>
            <div className="text-[10px] font-semibold text-white truncate" title={topJournals[0]?.[0] || '—'}>
              {topJournals[0]?.[0] || '—'}
              {topJournals[0] && <span className="text-slate-500 ml-1">({topJournals[0][1]})</span>}
            </div>
          </div>
        </div>

        {/* [V1.9.372] Tokens da query pra detecção de papers periféricos */}
        {(() => null)()}

        {/* Grupos por nível de evidência (forte → fraco) — Outros vira sub-agrupado */}
        {EVIDENCE_ORDER.map(level => {
          const list = grouped[level]
          if (!list || list.length === 0) return null
          const isOtherGroup = level === 'other'

          // Sub-agrupa "other" em 4 categorias heurísticas
          const subgrouped: Partial<Record<OtherSubgroup, PubMedArticle[]>> = {}
          if (isOtherGroup) {
            for (const a of list) {
              const sg = classifyOtherSubgroup(a)
              if (!subgrouped[sg]) subgrouped[sg] = []
              subgrouped[sg]!.push(a)
            }
          }

          const queryTokens = tokenizeQuery(query)

          const renderItem = (art: PubMedArticle) => {
            const year = parsePubYear(art.pubdate)
            const peripheral = isPotentiallyPeripheral(art, queryTokens)
            return (
              <li key={art.pmid} className="text-[11px] leading-relaxed">
                <a
                  href={art.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-slate-300 hover:text-indigo-200 hover:underline inline-flex items-start gap-1 group"
                >
                  <span className="text-slate-600 mt-0.5 group-hover:text-indigo-400">▸</span>
                  <span className="flex-1">
                    <span className="font-medium">{art.title}</span>
                    {peripheral && (
                      <span
                        className="ml-1.5 px-1 py-0 text-[8px] bg-amber-500/15 text-amber-300 border border-amber-500/30 rounded uppercase tracking-wider align-middle"
                        title="Menos de 30% dos termos da query no título — foco possivelmente periférico"
                      >
                        ⚠ periférico
                      </span>
                    )}
                    {(art.journal || year) && (
                      <span className="text-slate-500 ml-1">
                        · {art.journal}{year ? ` · ${year}` : ''}
                      </span>
                    )}
                  </span>
                  <ExternalLink className="w-2.5 h-2.5 text-slate-600 group-hover:text-indigo-400 flex-shrink-0 mt-1" />
                </a>
              </li>
            )
          }

          if (isOtherGroup) {
            // Renderiza Outros com sub-grupos
            return (
              <div key={level}>
                <h5 className="text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                  <span>{EVIDENCE_ICON[level]}</span>
                  {EVIDENCE_LABELS[level]}
                  <span className="text-slate-500 font-normal tabular-nums">({list.length})</span>
                </h5>
                <div className="space-y-2 pl-1">
                  {(['safety', 'preclinical', 'epidemiologic', 'misc'] as OtherSubgroup[]).map(sg => {
                    const sgList = subgrouped[sg]
                    if (!sgList || sgList.length === 0) return null
                    return (
                      <div key={sg}>
                        <div className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold mb-1 ml-2">
                          {OTHER_SUBGROUP_LABEL[sg]}{' '}
                          <span className="text-slate-600 normal-case tracking-normal">({sgList.length})</span>
                        </div>
                        <ul className="space-y-1 pl-3">
                          {sgList.map(renderItem)}
                        </ul>
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          }

          return (
            <div key={level}>
              <h5 className="text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <span>{EVIDENCE_ICON[level]}</span>
                {EVIDENCE_LABELS[level]}
                <span className="text-slate-500 font-normal tabular-nums">({list.length})</span>
              </h5>
              <ul className="space-y-1 pl-1">
                {list.map(renderItem)}
              </ul>
            </div>
          )
        })}

        {/* Top journals (estrutural — mostra concentração, não avalia "alto impacto") */}
        {topJournals.length > 1 && (
          <div className="pt-3 border-t border-slate-700/50">
            <div className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold mb-1.5">
              Journals mais frequentes neste recorte
            </div>
            <div className="flex flex-wrap gap-1.5">
              {topJournals.map(([journal, count]) => (
                <span
                  key={journal}
                  className="text-[10px] bg-slate-900/60 border border-slate-700/40 rounded-full px-2 py-0.5 text-slate-400"
                >
                  {journal} <span className="text-slate-600 tabular-nums">({count})</span>
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="px-4 py-2.5 bg-slate-900/40 border-t border-slate-700/40">
        <p className="text-[10px] text-slate-500 leading-relaxed">
          📊 Sistema organiza por estrutura (tipo · recência · frequência) — não interpreta validade clínica.
          Click em qualquer paper abre o original no PubMed.
        </p>
      </div>
    </div>
  )
}

const AdminCasosSimilares: React.FC<Props> = ({ embedded = false, defaultQuery = '', showSidebar, onNavigateToLiterature }) => {
  const navigate = useNavigate()
  const { user } = useAuth()
  // [V1.9.366] showSidebar default = !embedded (compat V1.9.365), mas caller pode forçar
  const sidebarVisible = showSidebar !== undefined ? showSidebar : !embedded
  const [searchTerm, setSearchTerm] = useState(defaultQuery)
  const [rationalityFilter, setRationalityFilter] = useState<RationalityType>('all')
  const [periodFilter, setPeriodFilter] = useState<Period>(90)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<SearchResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [monthlyCost, setMonthlyCost] = useState<number>(0)
  // [V1.9.394] (21/05) — aviso experimental recolhível (resumo curto por padrão).
  // Conteúdo integral preservado; só a apresentação mudou (parede de texto ocupava
  // tela toda no mobile / meia tela no desktop).
  const [warningExpanded, setWarningExpanded] = useState(false)
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

  // [V1.9.369-C] Estados pra mini-modal de extração de termos (cross-link Literatura)
  const [literatureModalOpen, setLiteratureModalOpen] = useState(false)
  const [literatureSourceLabel, setLiteratureSourceLabel] = useState<string>('')
  const [literatureSourceText, setLiteratureSourceText] = useState<string>('')
  const [literatureTerms, setLiteratureTerms] = useState<ExtractedTerm[]>([])
  const [literatureUseGPT, setLiteratureUseGPT] = useState(false)
  const [literatureGPTLoading, setLiteratureGPTLoading] = useState(false)
  const [literatureExtraTerm, setLiteratureExtraTerm] = useState('')
  // [V1.9.371] Estados pro mini-relatório agregado (memory feedback_inteligencia_estrutural_vs_inferencial)
  const [literatureReportLoading, setLiteratureReportLoading] = useState(false)
  const [literatureReportArticles, setLiteratureReportArticles] = useState<PubMedArticle[] | null>(null)
  const [literatureReportTotal, setLiteratureReportTotal] = useState(0)
  const [literatureReportError, setLiteratureReportError] = useState<string | null>(null)
  const [literatureReportQuery, setLiteratureReportQuery] = useState('')
  // [V1.9.372] Estratégia de query usada + reasoning GPT (quando aplicável) + fallback flag
  const [literatureReportMode, setLiteratureReportMode] = useState<QueryMode | 'gpt'>('principal_or')
  const [literatureReportFallback, setLiteratureReportFallback] = useState<string | null>(null)
  const [literatureGPTReasoning, setLiteratureGPTReasoning] = useState<string | null>(null)

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

  // [V1.9.369-C] Abre modal de extração com termos do dicionário (default)
  const openLiteratureExtractionModal = (rationalityLabel: string, text: string) => {
    const initial = extractClinicalTermsFromDictionary(text)
    setLiteratureSourceLabel(rationalityLabel)
    setLiteratureSourceText(text)
    setLiteratureTerms(initial)
    setLiteratureUseGPT(false)
    setLiteratureGPTLoading(false)
    setLiteratureExtraTerm('')
    // [V1.9.371] Reset do relatório a cada novo modal aberto
    setLiteratureReportArticles(null)
    setLiteratureReportTotal(0)
    setLiteratureReportError(null)
    setLiteratureReportLoading(false)
    setLiteratureReportQuery('')
    // [V1.9.372] Reset da estratégia de query + fallback
    setLiteratureReportMode('principal_or')
    setLiteratureReportFallback(null)
    setLiteratureGPTReasoning(null)
    setLiteratureModalOpen(true)
  }

  // [V1.9.371/V1.9.372] Gera mini-relatório AGREGADO com fallback inteligente.
  // Memory: feedback_inteligencia_estrutural_vs_inferencial_18_05
  // Bug V1.9.371 corrigido: AND implícito gerava 0 hits → agora principal_or → all_or → principal_only
  // Se toggle GPT ON → GPT constrói query MeSH-aware no lugar do dict simples.
  const runLiteratureReport = async () => {
    if (literatureTerms.length === 0) return
    setLiteratureReportLoading(true)
    setLiteratureReportError(null)
    setLiteratureReportFallback(null)
    setLiteratureGPTReasoning(null)

    // Estratégia 1: GPT query builder (se opt-in) — query MeSH-aware estruturada
    if (literatureUseGPT && literatureSourceText) {
      try {
        const gptResult = await buildQueryViaGPT(literatureSourceText, literatureTerms, user?.id, user?.email)
        if (gptResult && gptResult.query.trim()) {
          setLiteratureReportMode('gpt')
          setLiteratureReportQuery(gptResult.query)
          setLiteratureGPTReasoning(gptResult.reasoning)
          try {
            const result = await searchPubMed({ term: gptResult.query, retmax: 12, yearsBack: 10 })
            if (result.articles.length > 0) {
              setLiteratureReportArticles(result.articles)
              setLiteratureReportTotal(result.total)
              setLiteratureReportLoading(false)
              return
            }
            // GPT query veio mas 0 hits → cai pro fallback dict
            setLiteratureReportFallback('GPT construiu query mas retornou 0 — caindo pra dicionário')
          } catch {
            setLiteratureReportFallback('GPT query falhou — caindo pra dicionário')
          }
        }
      } catch {
        // silencioso — cai pra dict
      }
    }

    // Estratégia 2-4: dict com 3 modos progressivos (principal_or → all_or → principal_only)
    const tryModes: Array<{ mode: QueryMode; label: string }> = [
      { mode: 'principal_or', label: 'principal + opcionais' },
      { mode: 'all_or', label: 'todos os termos (OR)' },
      { mode: 'principal_only', label: 'só o termo principal' },
    ]

    let lastError: string | null = null
    for (let i = 0; i < tryModes.length; i++) {
      const { mode, label } = tryModes[i]
      const query = buildPubMedQueryFromTerms(literatureTerms, mode)
      if (!query) continue
      try {
        const result = await searchPubMed({ term: query, retmax: 12, yearsBack: 10 })
        setLiteratureReportQuery(query)
        setLiteratureReportMode(mode)
        if (result.articles.length > 0) {
          setLiteratureReportArticles(result.articles)
          setLiteratureReportTotal(result.total)
          // Marca fallback se não foi a 1ª estratégia
          if (i > 0 || (literatureUseGPT && literatureReportFallback)) {
            setLiteratureReportFallback(`Busca afrouxada pra ${label} (estratégia anterior 0 hits)`)
          }
          setLiteratureReportLoading(false)
          return
        }
        // 0 hits — tenta próximo modo
      } catch (err: any) {
        lastError = err?.message || 'Erro ao buscar literatura no PubMed'
      }
    }

    // Todos os modos retornaram 0 (ou erro)
    setLiteratureReportError(lastError || 'Nenhum resultado em nenhuma estratégia. Refine termos manualmente.')
    setLiteratureReportArticles([])
    setLiteratureReportTotal(0)
    setLiteratureReportLoading(false)
  }

  // [V1.9.372] Toggle GPT muda PAPEL: era extração de termos (V1.9.369-C),
  // agora ativa CONSTRUÇÃO DE QUERY MeSH-aware via GPT no momento de "Gerar relatório".
  // Memory: gptQueryBuilder reorientou GPT pra valor real (construir query inteligente).
  // Não dispara chamada imediata — GPT só roda quando médico clica botão.
  const handleToggleGPTExtraction = () => {
    setLiteratureUseGPT(prev => !prev)
  }

  // [V1.9.369-C] Remover chip individual
  const handleRemoveLiteratureTerm = (idx: number) => {
    setLiteratureTerms(prev => prev.filter((_, i) => i !== idx))
  }

  // [V1.9.369-C] Adicionar termo manual (PT — EN = mesmo se não traduzir)
  const handleAddLiteratureTerm = () => {
    const t = literatureExtraTerm.trim()
    if (!t) return
    setLiteratureTerms(prev => [...prev, { pt: t, en: t }].slice(0, 10))
    setLiteratureExtraTerm('')
  }

  // [V1.9.369-C/V1.9.371] Navegar pra aba Literatura completa (ponte opcional secundária)
  const handleNavigateToLiteratureFromModal = () => {
    if (!onNavigateToLiterature || literatureTerms.length === 0) return
    const query = buildPubMedQueryFromTerms(literatureTerms)
    onNavigateToLiterature(query)
    setLiteratureModalOpen(false)
    setSelectedCase(null) // fecha modal do caso também — usuário foi pra outra aba
  }

  return (
    // [V1.9.361] Padding lateral em embedded (Pedro: muito próximo do sidebar)
    <div className={embedded ? 'text-white px-4 md:px-6 py-2' : 'min-h-screen bg-[#0f172a] text-white p-6'}>
      {/* [V1.9.367] Largura maior em wide-screen quando sidebar visível (até 1800px) */}
      <div className={sidebarVisible ? (embedded ? 'max-w-[1800px]' : 'max-w-[1800px] mx-auto') : (embedded ? 'max-w-5xl' : 'max-w-5xl mx-auto')}>
      {/* [V1.9.365/V1.9.366] Grid 2 colunas em lg quando sidebar visível: main + sidebar */}
      <div className={sidebarVisible ? 'lg:grid lg:grid-cols-[1fr_360px] lg:gap-6 lg:items-start' : ''}>
      <div className={sidebarVisible ? 'min-w-0' : ''}>
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
                {/* [V1.9.368] Subtítulo refinado pós-2 análises GPT externas:
                    "Exploração experimental" é o NOME técnico-honesto do que a feature É;
                    "Casos Similares" mantido como label familiar pra médico. */}
                <p className="text-xs text-slate-400">Exploração experimental de padrões narrativos · Admin Spike</p>
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
        {/* [V1.9.394] (21/05) Recolhível — resumo curto por padrão, detalhe completo on-demand.
            Conteúdo integral preservado: continua válido (a Nôa Matrix NÃO estende o Casos
            Similares — são operações cognitivas distintas, memory
            feedback_matrix_prolonga_vs_casos_similares_infere_20_05). Só a APRESENTAÇÃO mudou.
            A linha crítica de segurança ("não use pra decisão clínica") fica SEMPRE visível
            no cabeçalho — o expand revela apenas o raciocínio detalhado. */}
        {/* Memory: feedback_ricardo_similaridade_por_qual_criterio_18_05 */}
        <div className="bg-amber-500/10 border-2 border-amber-500/40 rounded-xl mb-6">
          <button
            type="button"
            onClick={() => setWarningExpanded((v) => !v)}
            className="w-full flex items-center gap-2.5 p-3 text-left"
            aria-expanded={warningExpanded}
          >
            <AlertCircle className="w-4 h-4 text-amber-400 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <span className="text-xs font-bold text-amber-300 uppercase tracking-wider">
                ⚠️ Experimental — não use pra decisão clínica
              </span>
              {!warningExpanded && (
                <span className="block text-[11px] text-amber-100/70 leading-snug mt-0.5">
                  Agrupamento textual não é evidência clínica. Toque para entender os limites.
                </span>
              )}
            </div>
            <ChevronDown
              className={`w-4 h-4 text-amber-400 flex-shrink-0 transition-transform ${warningExpanded ? 'rotate-180' : ''}`}
            />
          </button>

          {warningExpanded && (
            <div className="px-3 pb-4 space-y-2">
              <p className="text-xs text-amber-100/90 leading-relaxed">
                Critérios de similaridade ainda <strong>imaturos</strong> (busca textual simples em campos jsonb).
                Pode produzir <strong>falsa sensação de evidência ou recorrência</strong>.
              </p>
              {/* [V1.9.368] Distinção lexical ≠ clínica com exemplo concreto auditado 18/05 */}
              <p className="text-xs text-amber-100/85 leading-relaxed">
                <strong>Similaridade lexical ≠ similaridade clínica.</strong> O matching textual não enxerga semântica:
                no corpus atual, "dor de cabeça" e "a dor de cabeça" são contadas como grupos diferentes
                (mesma realidade clínica, escrita diferente). Agrupamento textual não é evidência clínica.
              </p>
              <p className="text-xs text-amber-100/70 leading-relaxed">
                <strong>Crítica formal Dr. Ricardo Valença (18/05/2026):</strong> "similaridade por qual critério?" —
                CID é pobre, impressão diagnóstica varia entre médicos, narrativa carrega viés, longitudinal exige
                maturidade de dados. Sistema ainda não estabilizou taxonomia + governança + pseudonimização robusta.
              </p>
              {/* [V1.9.375-A] Termo "cosmologia" do Ricardo (áudio Uber 19/05) — cada racionalidade é cosmologia diferente */}
              <p className="text-xs text-amber-100/85 leading-relaxed">
                <strong>Cosmologias clínicas diferentes (Dr. Ricardo, 19/05):</strong> cada racionalidade é uma
                <em> cosmologia</em> — DRC vista pela biomédica (creatinina, eGFR, proteinúria) ≠ DRC vista pela MTC
                (estagnação de Qi do Rim) ≠ vista pela ayurveda (dosha). Filtro "Todas" agrega cosmologias
                incompatíveis. Use racionalidade ESPECÍFICA pra leitura coerente.
              </p>
              <p className="text-xs text-amber-200 leading-relaxed font-semibold pt-1 border-t border-amber-500/20">
                Use APENAS pra explorar o corpus internamente. NÃO orientar conduta clínica.
                Sequência prevista: 1º histórico longitudinal do próprio paciente, 2º memória clínica do próprio médico,
                3º (só MUITO depois) casos similares institucionais.
              </p>
            </div>
          )}
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
                  title={rationalityFilter === 'all'
                    ? '⚠️ Filtro "Todas" agrega 5 cosmologias clínicas diferentes (Dr. Ricardo) — DRC visto pela biomédica ≠ DRC visto pela MTC'
                    : `Filtro ativo: ${RATIONALITY_LABELS[rationalityFilter]}`}
                >
                  {Object.entries(RATIONALITY_LABELS).map(([key, label]) => (
                    // [V1.9.375-A] "Todas" recebe rótulo de alerta — Ricardo: cada racionalidade é uma cosmologia
                    <option key={key} value={key}>
                      {key === 'all' ? '⚠️ Todas (mistura cosmologias)' : label}
                    </option>
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

            {/* [V1.9.376-E] Toggle Síntese IA REMOVIDO da UI — bug confirmado empíricamente:
                 mesmo com GPT ON, devolvia template institucional "Registrado. Posso te ajudar
                 com agenda, pacientes..." (Failsafe Core Nôa). Síntese determinística entrega
                 100% do valor estrutural (contagens + composição racionalidades). Estado
                 useGPTSynthesis preservado em false default. Reativar futuramente exige fix
                 arquitetural (rationalityAnalysisService quality gate + adapter específico). */}

            <button
              onClick={handleSearch}
              disabled={loading || !searchTerm.trim()}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-700 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-colors"
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
                    onClick={() => {
                      // V1.9.384 — Pedro 19/05 noite: click em caso similar agora vai DIRETO
                      // pra Nôa Matrix com paciente em foco (em vez de abrir modal prontuário-like).
                      // Modal antigo (setSelectedCase) preservado pro caso de querer reativar
                      // botão "ver detalhes" no futuro — só o onClick principal mudou.
                      // Casos Similares passa a ser "via pesquisa" pura: lista → Matrix direto.
                      history.recordCaseOpen({
                        caseId: c.reportId,
                        patientId: c.patientId,
                        patientName: c.patientName,
                        queixa: c.queixaPrincipal,
                      })
                      navigate(`/app/pesquisa/profissional/dashboard?section=noa-matrix&patientId=${c.patientId}`)
                    }}
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
      {/* fim main column */}

      {/* [V1.9.365/V1.9.366/V1.9.367] Sidebar — Trilha + Notas (fluxo natural, sem sticky
          pra compat com ResearchWorkstation que tem overflow-y-auto no parent) */}
      {sidebarVisible && (
        <aside className="mt-6 lg:mt-0 space-y-4">
          {/* Trilha de Pesquisa */}
          <TrailPanel
            recent={history.recent}
            caseOpens={history.caseOpens}
            pinned={history.pinned}
            rationalityLabels={RATIONALITY_LABELS}
            onReplaySearch={applyRecorded}
            onOpenCase={(c) => {
              history.recordCaseOpen({ caseId: c.caseId, patientId: c.patientId, patientName: c.patientName, queixa: c.queixa })
              setSelectedCase({
                reportId: c.caseId,
                patientId: c.patientId,
                patientName: c.patientName,
                createdAt: new Date(c.ts).toISOString(),
                queixaPrincipal: c.queixa || '—',
                rationalitiesApplied: [],
              })
            }}
            onClearCases={history.clearCaseOpens}
          />

          {/* Notas Rápidas */}
          <NotesPanel
            notes={history.notes}
            onChange={history.setNotes}
          />
        </aside>
      )}

      </div>
      {/* fim grid wrapper */}
      </div>

      {/* [V1.9.356] Modal preview do caso — abre quando clica em qualquer card */}
      {selectedCase && (
        <div
          /* V1.9.378 — z-[80] acima do Header.tsx:157 (z-[60]). Antes z-50 ficava
              EMBAIXO do header em viewports widescreen, modal aparecia cortado. */
          className="fixed inset-0 z-[80] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150"
          onClick={() => setSelectedCase(null)}
        >
          <div
            /* V1.9.378 — max-w-6xl (1152px) em vez de 5xl (1024px). Em widescreen
                4096px ainda fica centralizado; em laptops normais cresce ~13%. */
            className="bg-slate-900 border border-slate-700 rounded-xl max-w-6xl w-full max-h-[92vh] overflow-y-auto"
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

                  {/* [V1.9.375-A] Queixa principal como CITAÇÃO — Ricardo no áudio Uber:
                       "no que vai pro livro entra entre aspas referência às queixas principais" */}
                  <div>
                    <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Queixa Principal</h4>
                    {(() => {
                      const queixa = caseDetails?.content?.queixa_principal || caseDetails?.content?.chiefComplaint || selectedCase.queixaPrincipal || ''
                      const hasQueixa = queixa && queixa !== '—'
                      return hasQueixa ? (
                        <>
                          <blockquote className="border-l-2 border-purple-500/40 pl-3 italic text-sm text-slate-200 leading-relaxed">
                            "{queixa}"
                          </blockquote>
                          <p className="text-[10px] text-slate-500 mt-1.5 italic">
                            Fala literal do paciente (referência) — não é interpretação clínica
                          </p>
                        </>
                      ) : (
                        <p className="text-sm text-slate-500">—</p>
                      )
                    })()}
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
                        {caseDetails.rationalities.map((r: any, i: number) => {
                          const ratLabel = RATIONALITY_LABELS[r.rationality_type as RationalityType] || r.rationality_type
                          return (
                            <div key={i} className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-3">
                              <div className="flex items-center justify-between mb-1.5">
                                <span className="px-2 py-0.5 text-[10px] bg-purple-500/15 text-purple-300 border border-purple-500/30 rounded-full font-semibold">
                                  {ratLabel}
                                </span>
                                <span className="text-[10px] text-slate-500">{formatDate(r.created_at)}</span>
                              </div>
                              <p className="text-xs text-slate-300 leading-relaxed">
                                {r.assessment ? r.assessment.substring(0, 350) + (r.assessment.length > 350 ? '...' : '') : '—'}
                              </p>
                              {/* [V1.9.369-C] Cross-link: extrair termos desta racionalidade → buscar Literatura */}
                              {onNavigateToLiterature && r.assessment && r.assessment.length > 30 && (
                                <button
                                  onClick={() => openLiteratureExtractionModal(ratLabel, r.assessment)}
                                  className="mt-2 inline-flex items-center gap-1.5 px-2 py-1 text-[10px] bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/30 hover:border-indigo-500/50 text-indigo-300 hover:text-indigo-200 rounded-md transition-colors"
                                  title="Extrair termos clínicos e buscar no PubMed"
                                >
                                  <Search className="w-3 h-3" />
                                  Buscar literatura sobre esta racionalidade
                                </button>
                              )}
                            </div>
                          )
                        })}
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

      {/* [V1.9.369-C] Mini-modal extração de termos pra busca em Literatura externa
          GPT é "ferramenta linguística", não autoridade epistemológica:
            expande termos, traduz PT→EN, detecta sinônimos — médico revisa antes de buscar */}
      {literatureModalOpen && (
        <div
          /* V1.9.378 — z-[90] acima do modal caso (z-[80]) e do Header (z-[60]).
              Antes z-[60] empatava com Header, ordem DOM decidia visibilidade. */
          className="fixed inset-0 z-[90] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150"
          onClick={() => setLiteratureModalOpen(false)}
        >
          <div
            /* V1.9.378 — max-w-4xl (896px) em vez de 2xl (672px). Modal tinha chips
                + query preview + relatório estrutural amontoados em 672px. */
            className="bg-slate-900 border border-slate-700 rounded-xl max-w-4xl w-full max-h-[88vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 bg-slate-900 border-b border-slate-700/50 px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Search className="w-4 h-4 text-indigo-400" />
                <h3 className="text-base font-bold text-white">Buscar literatura externa</h3>
              </div>
              <button
                onClick={() => setLiteratureModalOpen(false)}
                className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
                title="Cancelar (ESC)"
              >
                <X className="w-4 h-4 text-slate-400" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              {/* Origem */}
              <p className="text-xs text-slate-400 leading-relaxed">
                A partir da racionalidade <span className="text-purple-300 font-semibold">{literatureSourceLabel}</span>{' '}
                · termos extraídos automaticamente (revise antes de buscar):
              </p>

              {/* Chips termos extraídos */}
              <div className="bg-slate-800/30 border border-slate-700/50 rounded-lg p-3 min-h-[80px]">
                <div className="flex items-start gap-2 flex-wrap">
                  {literatureTerms.length === 0 ? (
                    <span className="text-xs text-slate-500 italic">
                      Nenhum termo identificado pelo dicionário curado. Ative IA opcional ou adicione termos manualmente.
                    </span>
                  ) : (
                    literatureTerms.map((t, idx) => {
                      const isPrincipal = idx === 0
                      return (
                        <div
                          key={`${t.pt}-${idx}`}
                          className={`inline-flex items-center gap-1.5 rounded-full pl-3 pr-1 py-1 ${
                            isPrincipal
                              ? 'bg-emerald-500/15 border border-emerald-500/50'
                              : 'bg-indigo-500/15 border border-indigo-500/40'
                          }`}
                          title={isPrincipal
                            ? 'Termo PRINCIPAL (obrigatório na query — AND)'
                            : 'Termo opcional (OR com outros opcionais)'}
                        >
                          {isPrincipal && (
                            <span className="text-[9px] uppercase tracking-wider font-bold text-emerald-300 mr-0.5">
                              principal
                            </span>
                          )}
                          <span className={`text-xs ${isPrincipal ? 'text-emerald-100' : 'text-indigo-100'}`}>{t.pt}</span>
                          <span className="text-[10px] text-slate-500">↔</span>
                          <span className={`text-xs font-mono ${isPrincipal ? 'text-emerald-300' : 'text-indigo-300'}`}>{t.en}</span>
                          <button
                            onClick={() => handleRemoveLiteratureTerm(idx)}
                            className={`p-0.5 rounded-full ${isPrincipal ? 'hover:bg-emerald-500/30' : 'hover:bg-indigo-500/30'}`}
                            title="Remover"
                          >
                            <X className={`w-2.5 h-2.5 ${isPrincipal ? 'text-emerald-300' : 'text-indigo-300'}`} />
                          </button>
                        </div>
                      )
                    })
                  )}
                </div>
              </div>

              {/* Adicionar termo manual */}
              {literatureTerms.length < 10 && (
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={literatureExtraTerm}
                    onChange={(e) => setLiteratureExtraTerm(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAddLiteratureTerm()}
                    placeholder="+ adicionar termo (PT ou EN)"
                    className="flex-1 px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500/50"
                  />
                  <button
                    onClick={handleAddLiteratureTerm}
                    disabled={!literatureExtraTerm.trim()}
                    className="px-3 py-1.5 text-xs bg-slate-700 hover:bg-slate-600 disabled:bg-slate-800 disabled:text-slate-600 text-white rounded-lg transition-colors"
                  >
                    +
                  </button>
                </div>
              )}

              {/* [V1.9.376-E] Toggle "IA constrói query" OCULTO da UI — dicionário curado
                   (~85 termos PT↔EN) já entrega query PubMed MeSH-aware satisfatória. GPT
                   construtor era decoração com custo marginal sem ganho clínico mensurável.
                   Estado literatureUseGPT preservado em false default. Reativar futuramente
                   exige trigger empírico (termo PT fora do dicionário curado). */}

              {/* [V1.9.372] Preview query — mostra dict atual (GPT constrói só ao gerar relatório) */}
              <div className="bg-slate-800/40 border border-slate-700/50 rounded-lg p-3">
                <div className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold mb-1.5 flex items-center justify-between">
                  <span>Query PubMed prevista (dicionário)</span>
                  {literatureUseGPT && (
                    <span className="text-yellow-400 normal-case tracking-normal font-normal">
                      ⚡ GPT vai reescrever ao gerar relatório
                    </span>
                  )}
                </div>
                <code className="text-xs text-indigo-300 font-mono break-all leading-relaxed block">
                  {literatureTerms.length === 0
                    ? <span className="text-slate-600 italic">(adicione termos pra buscar)</span>
                    : buildPubMedQueryFromTerms(literatureTerms)}
                </code>
              </div>

              {/* [V1.9.372] Princípio epistemológico — wording mais elegante (5ª análise GPT externa) */}
              <p className="text-[10px] text-slate-500 leading-relaxed">
                💡 O sistema organiza resultados bibliográficos por estrutura (tipo, recência e frequência),
                sem interpretar validade clínica. A decisão permanece com o médico.
              </p>

              {/* [V1.9.371] Mini-relatório agregado — inteligência estrutural */}
              {literatureReportLoading && (
                <div className="bg-slate-800/40 border border-slate-700/50 rounded-lg p-6 text-center">
                  <Loader2 className="w-5 h-5 text-indigo-400 animate-spin mx-auto mb-2" />
                  <p className="text-xs text-slate-400">Buscando no PubMed e agregando estrutura...</p>
                </div>
              )}
              {literatureReportError && !literatureReportLoading && (
                <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-red-300">{literatureReportError}</p>
                </div>
              )}
              {literatureReportArticles && !literatureReportLoading && (
                <>
                  {/* [V1.9.372] Notice de fallback / reasoning GPT */}
                  {(literatureReportFallback || literatureGPTReasoning || literatureReportMode === 'gpt') && (
                    <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg px-3 py-2 space-y-1">
                      {literatureReportMode === 'gpt' && literatureGPTReasoning && (
                        <p className="text-[11px] text-yellow-200 leading-relaxed">
                          <strong>⚡ Query GPT:</strong> {literatureGPTReasoning}
                        </p>
                      )}
                      {literatureReportFallback && (
                        <p className="text-[11px] text-yellow-200 leading-relaxed">
                          <strong>↪ Fallback:</strong> {literatureReportFallback}
                        </p>
                      )}
                    </div>
                  )}
                  <LiteratureReport
                    articles={literatureReportArticles}
                    total={literatureReportTotal}
                    query={literatureReportQuery}
                  />
                </>
              )}

              {/* Ações */}
              <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-700/50 flex-wrap">
                <button
                  onClick={() => setLiteratureModalOpen(false)}
                  className="px-4 py-2 text-xs text-slate-400 hover:text-white transition-colors"
                >
                  Fechar
                </button>
                <div className="flex items-center gap-2 flex-wrap">
                  {onNavigateToLiterature && literatureTerms.length > 0 && (
                    <button
                      onClick={handleNavigateToLiteratureFromModal}
                      className="flex items-center gap-1.5 px-3 py-2 text-xs text-indigo-300 hover:text-indigo-200 hover:bg-indigo-500/10 rounded-lg transition-colors"
                      title="Refinar busca + ver mais resultados na aba Literatura"
                    >
                      Ver tudo na Literatura
                      <ExternalLink className="w-3 h-3" />
                    </button>
                  )}
                  <button
                    onClick={runLiteratureReport}
                    disabled={literatureTerms.length === 0 || literatureReportLoading}
                    className="flex items-center gap-2 px-4 py-2 text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-700 disabled:text-slate-500 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
                  >
                    <BarChart3 className="w-3.5 h-3.5" />
                    {literatureReportArticles ? 'Atualizar relatório' : 'Gerar relatório'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default AdminCasosSimilares
