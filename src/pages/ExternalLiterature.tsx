import React, { useEffect, useRef, useState } from 'react'
import {
  Search,
  Loader2,
  AlertCircle,
  ExternalLink,
  BookOpen,
  Filter,
  Calendar,
  X,
  Keyboard,
  Globe,
  Sparkles,
  Newspaper,
  MapPin,
  ScrollText,
  Compass,
  Pill,
} from 'lucide-react'
import {
  useExternalLiterature,
  type EditorialPreset,
} from '../hooks/useExternalLiterature'
import {
  EVIDENCE_LABELS,
  EVIDENCE_COLORS,
  type EvidenceLevel,
  type PubMedArticle,
} from '../services/pubmedService'
import OpenFDAPanel from '../components/OpenFDAPanel'
import AnvisaPanel from '../components/AnvisaPanel'

// [V1.9.464+465] (27/05/2026) — Source TOGGLE: PubMed | OpenFDA | Bulário BR (ANVISA).
//
// V1.9.464 — OpenFDAPanel: bulas U.S. FDA via API pública (Epidiolex, etc).
//   Pedro validou empiricamente que OpenFDA é tier marginal (US-centric, ruído OTC).
//
// V1.9.465 — AnvisaPanel: catálogo MVP top ~42 bulas BR (cannabis + anti-convulsivantes +
//   psicotrópicos + analgésicos + nefro) com link pro Bulário Eletrônico ANVISA oficial.
//   Decisão Pedro 27/05 madrugada: "somos app br" — ANVISA é o que destrava valor real.
//
// Pattern polir-não-inventar: 3 hooks standalone (zero refactor multi-source).
// Refactor multi-source justificado quando Fase 2-Pleno ANVISA crawler + OCR ativar.
//
// Princípio meta cristalizado em feedback_fronteira_organizar_info_farmacologica_vs_decisao_terapeutica_27_05:
//   "Organizar acesso à informação oficial" vs "Participar da decisão terapêutica" — só a primeira.

type LiteratureSource = 'pubmed' | 'openfda' | 'anvisa'

// [V1.9.369-A] (18/05/2026) — Aba Literatura (PubMed) no Terminal de Pesquisa
//
// Posicionamento: FONTE EXTERNA — não é evidência clínica do corpus interno.
// Princípios cristalizados aplicados:
//  - "Resultados encontrados" (não "IA recomenda") — memory feedback_lexical_nao_e_clinica
//  - Sem síntese GPT cedo — só metadados estruturados
//  - Filtro por nível de evidência (Meta-análise > RCT > Observacional > Review > Case Report)
//  - Selo persistente "Fonte externa" em todo resultado
//  - Eixos editoriais (futuro V1.9.369-B): Novidades / Mais citados / Trials BR / Guidelines
//
// Anti-regressão:
//  - Componente isolado, zero toque em Library / Casos Similares / Core
//  - Sem persistência Supabase, sem auth call extra, sem custo IA
//  - PubMed API NIH ($0 grátis ilimitado)
//
// Props embedded segue mesma semântica que AdminCasosSimilares (V1.9.366):
//  - embedded=true: esconde header próprio (parent ResearchWorkstation tem)
//  - embedded=false: standalone admin (futuro, se rota dedicada)

interface Props {
  embedded?: boolean
  // [V1.9.369-C] Cross-link: parent (ResearchWorkstation) injeta termo vindo
  // de outra aba (ex: Casos Similares → Buscar literatura dessa racionalidade).
  // initialTermKey muda toda vez que parent quer FORÇAR novo set (mesmo termo
  // duas vezes — useEffect re-dispara via key change).
  initialTerm?: string
  initialTermKey?: number
}

const EVIDENCE_OPTIONS: Array<EvidenceLevel | 'all'> = [
  'all',
  'meta-analysis',
  'rct',
  'observational',
  'guideline',
  'review',
  'case-report',
]

const YEAR_OPTIONS: Array<{ value: 0 | 5 | 10 | 20; label: string }> = [
  { value: 5, label: '5 anos' },
  { value: 10, label: '10 anos' },
  { value: 20, label: '20 anos' },
  { value: 0, label: 'Sem limite' },
]

// [V1.9.369-B] Tabs editoriais — query cannabis pré-configurada pra reduzir fricção de adoção
interface EditorialTab {
  id: EditorialPreset
  label: string
  icon: React.ComponentType<{ className?: string }>
  hint: string
}

const EDITORIAL_TABS: EditorialTab[] = [
  { id: 'free', label: 'Busca livre', icon: Compass, hint: 'pesquise qualquer termo' },
  { id: 'novidades', label: 'Novidades 30 dias', icon: Newspaper, hint: 'cannabis · ordenado por data' },
  { id: 'cannabis-br', label: 'Cannabis no Brasil', icon: MapPin, hint: 'autores com afiliação BR · 10 anos' },
  { id: 'guidelines', label: 'Guidelines', icon: ScrollText, hint: 'cannabis · Publication Type = Guideline' },
]

const ExternalLiterature: React.FC<Props> = ({ embedded = false, initialTerm, initialTermKey }) => {
  // V1.9.464 — source toggle (PubMed default, OpenFDA opcional)
  const [source, setSource] = useState<LiteratureSource>('pubmed')

  const {
    term,
    setTerm,
    yearsBack,
    setYearsBack,
    evidenceFilter,
    setEvidenceFilter,
    preset,
    setPreset,
    loading,
    error,
    articles,
    total,
    fromCache,
    lastSearchedTerm,
    clearSearch,
  } = useExternalLiterature()

  const searchInputRef = useRef<HTMLInputElement>(null)

  // [V1.9.369-C] Quando vem term via cross-link (Casos Similares → Literatura),
  // popula automaticamente e força tab de busca livre.
  // V1.9.464-A — useEffect MOVIDO pra antes do early return source='openfda' (Rules of Hooks).
  useEffect(() => {
    if (initialTerm && initialTerm.trim().length >= 3) {
      setTerm(initialTerm)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialTerm, initialTermKey])

  // Atalhos globais Cmd/Ctrl+K ou "/" focam search (consistente com Casos Similares V1.9.364)
  // V1.9.464-A — useEffect MOVIDO pra antes do early return (Rules of Hooks).
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null
      const inField = !!target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)
      const isMod = e.metaKey || e.ctrlKey
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
  }, [])

  // V1.9.464+465 — Source tabs (renderizado em todos os modos pra toggle sempre acessível).
  // JSX (não hook) — pode ficar depois dos useEffects sem violar Rules of Hooks.
  const sourceTabsEl = (
    <div className="flex flex-wrap items-center gap-1 bg-slate-900/40 border border-slate-700/50 rounded-lg p-1 w-fit mb-4">
      <button
        type="button"
        onClick={() => setSource('pubmed')}
        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
          source === 'pubmed'
            ? 'bg-[rgba(0,229,178,0.15)] border border-[rgba(0,229,178,0.45)] text-[#00E5B2]'
            : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
        }`}
        aria-pressed={source === 'pubmed'}
      >
        <BookOpen className="w-3.5 h-3.5" />
        PubMed
      </button>
      <button
        type="button"
        onClick={() => setSource('anvisa')}
        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
          source === 'anvisa'
            ? 'bg-[rgba(0,229,178,0.15)] border border-[rgba(0,229,178,0.45)] text-[#00E5B2]'
            : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
        }`}
        aria-pressed={source === 'anvisa'}
      >
        <Pill className="w-3.5 h-3.5" />
        Bulário BR
        <span className="text-[9px] bg-[rgba(0,229,178,0.20)] text-[#00E5B2] px-1.5 py-0.5 rounded-full ml-1 font-bold">PT-BR</span>
      </button>
      <button
        type="button"
        onClick={() => setSource('openfda')}
        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
          source === 'openfda'
            ? 'bg-[rgba(0,229,178,0.15)] border border-[rgba(0,229,178,0.45)] text-[#00E5B2]'
            : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
        }`}
        aria-pressed={source === 'openfda'}
      >
        <Pill className="w-3.5 h-3.5" />
        OpenFDA
        <span className="text-[9px] bg-slate-700 text-slate-400 px-1.5 py-0.5 rounded-full ml-1 font-bold">US</span>
      </button>
    </div>
  )

  // V1.9.464-A + V1.9.465 — Early returns APÓS todos os hooks (Rules of Hooks).
  if (source === 'anvisa') {
    return (
      <div className="w-full max-w-[1800px] mx-auto px-4 md:px-6">
        {sourceTabsEl}
        <AnvisaPanel />
      </div>
    )
  }

  if (source === 'openfda') {
    return (
      <div className="w-full max-w-[1800px] mx-auto px-4 md:px-6">
        {sourceTabsEl}
        <OpenFDAPanel />
      </div>
    )
  }

  const SUGGESTIONS = ['cannabidiol chronic kidney disease', 'cannabis epilepsy', 'CBD anxiety RCT', 'THC pain', 'cannabis sleep']

  return (
    <div className={embedded ? 'text-white px-4 md:px-6 py-2' : 'min-h-screen bg-[#0f172a] text-white p-6'}>
      <div className={embedded ? 'max-w-[1800px]' : 'max-w-[1800px] mx-auto'}>
        {/* Header standalone */}
        {!embedded && (
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 rounded-lg bg-indigo-500/10 border border-indigo-500/20">
              <BookOpen className="w-5 h-5 text-indigo-400" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">Literatura</h1>
              <p className="text-xs text-slate-400">PubMed (artigos científicos) + Bulário BR (ANVISA) + OpenFDA (bulas FDA)</p>
            </div>
          </div>
        )}

        {/* V1.9.464 — Source toggle */}
        {sourceTabsEl}

        {/* Selo FONTE EXTERNA — sempre visível (memory cristalizada) */}
        <div className="bg-indigo-500/5 border-2 border-indigo-500/30 rounded-xl p-4 mb-6">
          <div className="flex items-start gap-3">
            <Globe className="w-5 h-5 text-indigo-400 flex-shrink-0 mt-0.5" />
            <div className="space-y-2">
              <h3 className="text-sm font-bold text-indigo-300 uppercase tracking-wider">
                Fonte externa — não é evidência clínica do seu corpus interno
              </h3>
              <p className="text-xs text-indigo-100/80 leading-relaxed">
                Resultados vêm do <strong>PubMed/NIH</strong> (35M+ artigos biomédicos).
                O sistema agrega metadados e referencia — <strong>não interpreta clínicamente</strong>.
                Sempre verifique o paper original no link antes de citar.
              </p>
            </div>
          </div>
        </div>

        {/* [V1.9.369-B] Tabs editoriais — clica e já carrega query curada (sem digitar) */}
        <div className="bg-slate-800/20 border border-slate-700/40 rounded-xl p-2 mb-4">
          <div className="flex items-center gap-1 flex-wrap">
            {EDITORIAL_TABS.map(tab => {
              const Icon = tab.icon
              const isActive = preset === tab.id
              return (
                <button
                  key={tab.id}
                  onClick={() => setPreset(tab.id)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs transition-colors whitespace-nowrap ${
                    isActive
                      ? 'bg-indigo-500/20 text-indigo-200 border border-indigo-500/40'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 border border-transparent'
                  }`}
                  title={tab.hint}
                >
                  <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-indigo-300' : 'text-slate-500'}`} />
                  <span className="font-semibold">{tab.label}</span>
                  <span className="hidden md:inline text-[10px] text-slate-500 font-normal">· {tab.hint}</span>
                </button>
              )
            })}
          </div>
        </div>

        {/* Search bar + filtros */}
        <div className="bg-slate-800/30 border border-slate-700/50 rounded-xl p-5 mb-6">
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-2 uppercase tracking-wider">
                Buscar literatura científica
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  ref={searchInputRef}
                  type="text"
                  value={term}
                  onChange={(e) => setTerm(e.target.value)}
                  placeholder='ex: "cannabidiol epilepsy", "CBD chronic kidney disease", "THC anxiety"  (⌘K ou / pra focar)'
                  className="w-full pl-10 pr-10 py-2.5 bg-slate-900 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500/50"
                />
                {term && (
                  <button
                    onClick={clearSearch}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1 hover:bg-slate-800 rounded transition-colors"
                    title="Limpar"
                  >
                    <X className="w-4 h-4 text-slate-500" />
                  </button>
                )}
              </div>
              <p className="text-[10px] text-slate-600 mt-1.5">
                Termos em inglês trazem mais resultados (PubMed é majoritariamente anglo). Mín. 3 caracteres.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-2 uppercase tracking-wider flex items-center gap-1.5">
                  <Filter className="w-3 h-3" /> Nível de evidência
                </label>
                <select
                  value={evidenceFilter}
                  onChange={(e) => setEvidenceFilter(e.target.value as any)}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:border-indigo-500/50"
                >
                  {EVIDENCE_OPTIONS.map(opt => (
                    <option key={opt} value={opt}>
                      {opt === 'all' ? 'Todos' : EVIDENCE_LABELS[opt as EvidenceLevel]}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-2 uppercase tracking-wider flex items-center gap-1.5">
                  <Calendar className="w-3 h-3" /> Período
                </label>
                <select
                  value={yearsBack}
                  onChange={(e) => setYearsBack(parseInt(e.target.value, 10) as any)}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:border-indigo-500/50"
                >
                  {YEAR_OPTIONS.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Loading */}
        {loading && (
          <div className="bg-slate-800/30 border border-slate-700/50 rounded-xl p-8 mb-6 text-center">
            <Loader2 className="w-6 h-6 text-indigo-400 animate-spin mx-auto mb-3" />
            <p className="text-sm text-slate-400">Buscando no PubMed...</p>
          </div>
        )}

        {/* Error */}
        {error && !loading && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 mb-6 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm text-red-300 font-semibold">Erro na busca</p>
              <p className="text-xs text-red-400/80 mt-1">{error}</p>
              <p className="text-[10px] text-red-400/60 mt-2">
                PubMed pode estar lento ou termo não retorna resultados. Tente termos em inglês ou aumente o período.
              </p>
            </div>
          </div>
        )}

        {/* Resultados */}
        {!loading && !error && articles.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <h2 className="text-sm font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                <BookOpen className="w-4 h-4" />
                Resultados encontrados para "{lastSearchedTerm}"
                <span className="text-[10px] font-normal text-slate-500 bg-slate-800/60 px-2 py-0.5 rounded">
                  {articles.length} de ~{total.toLocaleString('pt-BR')}
                </span>
                {fromCache && (
                  <span className="text-[10px] font-normal text-slate-500 bg-slate-800 px-2 py-0.5 rounded">cache</span>
                )}
              </h2>
              <span className="text-[10px] text-slate-600 uppercase tracking-wider">PubMed/NIH</span>
            </div>

            {/* [V1.9.370] Side-by-side em lg+ (Pedro 18/05 ~21h38) */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
              {articles.map((art, idx) => (
                <ArticleCard key={art.pmid} article={art} idx={idx} />
              ))}
            </div>

            {total > articles.length && (
              <p className="text-[11px] text-slate-500 text-center mt-4">
                Mostrando {articles.length} de {total.toLocaleString('pt-BR')} resultados.
                Refine a busca pra reduzir o conjunto OU{' '}
                <a
                  href={`https://pubmed.ncbi.nlm.nih.gov/?term=${encodeURIComponent(lastSearchedTerm)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-indigo-400 hover:text-indigo-300 underline"
                >
                  ver todos no PubMed
                </a>.
              </p>
            )}
          </div>
        )}

        {/* Empty inicial / sem termo */}
        {!loading && !error && articles.length === 0 && term.trim().length < 3 && (
          <div className="text-center py-12">
            <Sparkles className="w-12 h-12 text-indigo-400/40 mx-auto mb-4" />
            <p className="text-sm text-slate-300 max-w-md mx-auto leading-relaxed mb-1">
              Busca em literatura biomédica externa
            </p>
            <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed mb-5">
              Resultados vêm direto do PubMed/NIH. Sistema agrega metadados, decisão clínica é do médico.
              Sugestões pra explorar:
            </p>
            <div className="flex items-center justify-center gap-2 flex-wrap max-w-2xl mx-auto">
              {SUGGESTIONS.map(s => (
                <button
                  key={s}
                  onClick={() => setTerm(s)}
                  className="px-3 py-1.5 text-xs bg-slate-800/60 hover:bg-indigo-500/15 border border-slate-700 hover:border-indigo-500/40 text-slate-300 hover:text-indigo-200 rounded-full transition-colors"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Empty pós-busca (com termo mas sem resultados) */}
        {!loading && !error && articles.length === 0 && term.trim().length >= 3 && lastSearchedTerm && (
          <div className="text-center py-12">
            <Search className="w-12 h-12 text-slate-600 mx-auto mb-4" />
            <p className="text-sm text-slate-400 max-w-md mx-auto leading-relaxed mb-1">
              Nenhum resultado pra <strong>"{lastSearchedTerm}"</strong>
            </p>
            <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
              Tente termos em inglês, aumente o período, ou afrouxe o filtro de evidência.
            </p>
          </div>
        )}

        {/* Footer atalhos */}
        <div className="mt-8 pt-4 border-t border-slate-800/60 flex items-center justify-center gap-4 flex-wrap text-[10px] text-slate-600">
          <span className="flex items-center gap-1.5">
            <Keyboard className="w-3 h-3" />
            <span className="font-semibold uppercase tracking-wider">Atalhos:</span>
          </span>
          <span><kbd className="px-1.5 py-0.5 bg-slate-800 border border-slate-700 rounded text-slate-400 font-mono text-[9px]">⌘K</kbd> ou <kbd className="px-1.5 py-0.5 bg-slate-800 border border-slate-700 rounded text-slate-400 font-mono text-[9px]">/</kbd> focar busca</span>
          <span className="text-slate-700">·</span>
          <span>Powered by PubMed/NIH · sem custo · sem síntese IA</span>
        </div>
      </div>
    </div>
  )
}

const ArticleCard: React.FC<{ article: PubMedArticle; idx: number }> = ({ article, idx }) => {
  const evidenceColor = EVIDENCE_COLORS[article.evidenceLevel]
  const evidenceLabel = EVIDENCE_LABELS[article.evidenceLevel]
  const authorsLabel = article.authors.length === 0
    ? '(autores não disponíveis)'
    : article.authors.length <= 3
      ? article.authors.join(', ')
      : `${article.authors.slice(0, 3).join(', ')} et al`

  return (
    <div className="bg-slate-800/40 border border-slate-700/50 rounded-lg p-4 hover:border-indigo-500/40 hover:bg-slate-800/60 transition-colors">
      <div className="flex items-start gap-3 mb-2">
        <span className="text-xs font-bold text-indigo-400 tabular-nums mt-0.5">#{idx + 1}</span>
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-semibold text-white leading-snug mb-1">
            {article.title}
          </h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            {authorsLabel}
          </p>
        </div>
      </div>
      <div className="ml-7 mt-2 flex items-center gap-2 flex-wrap">
        <span className={`px-2 py-0.5 text-[10px] font-semibold rounded-full border ${evidenceColor}`}>
          {evidenceLabel}
        </span>
        {article.journal && (
          <span className="text-[10px] text-slate-400 italic">{article.journal}</span>
        )}
        {article.pubdate && (
          <>
            <span className="text-[10px] text-slate-600">·</span>
            <span className="text-[10px] text-slate-400">{article.pubdate}</span>
          </>
        )}
        <span className="text-[10px] text-slate-600">·</span>
        <span className="text-[10px] text-slate-500 font-mono">PMID {article.pmid}</span>
        {article.doi && (
          <>
            <span className="text-[10px] text-slate-600">·</span>
            <span className="text-[10px] text-slate-500 font-mono truncate max-w-[280px]" title={article.doi}>
              DOI {article.doi}
            </span>
          </>
        )}
      </div>
      <div className="ml-7 mt-3">
        <a
          href={article.url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-[11px] text-indigo-300 hover:text-indigo-200 hover:underline"
        >
          <ExternalLink className="w-3 h-3" />
          ver no PubMed
        </a>
      </div>
    </div>
  )
}

export default ExternalLiterature
