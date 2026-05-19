import React, { useEffect, useRef } from 'react'
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
} from 'lucide-react'
import {
  useExternalLiterature,
} from '../hooks/useExternalLiterature'
import {
  EVIDENCE_LABELS,
  EVIDENCE_COLORS,
  type EvidenceLevel,
  type PubMedArticle,
} from '../services/pubmedService'

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

const ExternalLiterature: React.FC<Props> = ({ embedded = false }) => {
  const {
    term,
    setTerm,
    yearsBack,
    setYearsBack,
    evidenceFilter,
    setEvidenceFilter,
    loading,
    error,
    articles,
    total,
    fromCache,
    lastSearchedTerm,
    clearSearch,
  } = useExternalLiterature()

  const searchInputRef = useRef<HTMLInputElement>(null)

  // Atalhos globais Cmd/Ctrl+K ou "/" focam search (consistente com Casos Similares V1.9.364)
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
              <p className="text-xs text-slate-400">PubMed · busca em literatura científica externa</p>
            </div>
          </div>
        )}

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

            {articles.map((art, idx) => (
              <ArticleCard key={art.pmid} article={art} idx={idx} />
            ))}

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
