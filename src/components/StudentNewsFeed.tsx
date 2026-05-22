// [V1.9.423] (22/05/2026) — Feed de Notícias do aluno: artigos PubMed reais.
// [V1.9.424] (22/05/2026) — paginação ("Carregar mais") + ordenação
//   (recentes/relevantes) + filtro por força de evidência.
//
// Substitui o array hardcoded de 3 "notícias" fabricadas (datas 01/2025,
// imagens via.placeholder, alegações científicas inventadas). Puxa literatura
// peer-reviewed real via `pubmedService` (V1.9.369 — API oficial NIH/NCBI,
// grátis, sem key). Conteúdo autoritativo, impossível de fabricar.
//
// "Mais vistos" real (ranking por cliques) NÃO entra aqui: exigiria backend de
// view-tracking e, pré-PMF sem alunos, não há dado pra ranquear — seria mock de
// novo. O equivalente honesto é ordenar por relevância (ranking do PubMed) e
// filtrar por força de evidência (RCT/meta-análise = o tier mais forte).
//
// Monta/desmonta junto com a aba (a aba só renderiza quando ativa), então
// `useEffect` no mount é o gatilho de busca correto.

import React, { useEffect, useState } from 'react'
import { ExternalLink, Loader2, AlertTriangle, Newspaper } from 'lucide-react'
import {
  searchPubMed,
  EVIDENCE_LABELS,
  EVIDENCE_COLORS,
  type PubMedArticle,
  type EvidenceLevel,
} from '../services/pubmedService'

const PAGE_SIZE = 12

type FeedFilter = { id: string; label: string; term: string }

// Termos validados empiricamente contra o esearch do PubMed (22/05/2026 — count
// nos últimos 3 anos): medical cannabis 791 · cannabidiol 2994 · cannabis AND
// kidney 70 · cannabis AND epilepsy 178. Multi-palavra usa AND explícito —
// sem o AND, o [Title/Abstract] vira busca de frase literal e zera o resultado.
const FEED_FILTERS: FeedFilter[] = [
  { id: 'cannabis', label: 'Cannabis Medicinal', term: 'medical cannabis' },
  { id: 'cbd', label: 'Canabidiol (CBD)', term: 'cannabidiol' },
  { id: 'nefro', label: 'Cannabis & Nefrologia', term: 'cannabis AND kidney' },
  { id: 'neuro', label: 'Cannabis & Neurologia', term: 'cannabis AND epilepsy' },
]

type SortMode = 'recent' | 'relevant'
const SORT_MODES: { id: SortMode; label: string }[] = [
  { id: 'recent', label: 'Mais recentes' },
  { id: 'relevant', label: 'Mais relevantes' },
]

// Filtro por força de evidência — reusa o `evidenceFilter` do pubmedService.
// 'meta-analysis' já cobre Meta-Analysis OR Systematic Review (as sínteses fortes).
const EVIDENCE_CHOICES: { id: 'all' | EvidenceLevel; label: string }[] = [
  { id: 'all', label: 'Todas' },
  { id: 'meta-analysis', label: 'Meta-análises & Revisões' },
  { id: 'rct', label: 'Ensaios (RCT)' },
]

interface Props {
  surfaceStyle: React.CSSProperties
  secondarySurfaceStyle: React.CSSProperties
  accentGradient: string
}

const StudentNewsFeed: React.FC<Props> = ({ surfaceStyle, secondarySurfaceStyle, accentGradient }) => {
  const [filterId, setFilterId] = useState<string>(FEED_FILTERS[0].id)
  const [sortMode, setSortMode] = useState<SortMode>('recent')
  const [evidence, setEvidence] = useState<'all' | EvidenceLevel>('all')
  const [articles, setArticles] = useState<PubMedArticle[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true) // carga inicial / troca de filtro
  const [loadingMore, setLoadingMore] = useState(false)
  const [error, setError] = useState(false)

  const activeFilter = FEED_FILTERS.find(f => f.id === filterId) ?? FEED_FILTERS[0]

  // Carga / recarga: dispara em troca de tópico, ordenação ou evidência.
  useEffect(() => {
    const ctrl = new AbortController()
    setLoading(true)
    setError(false)
    searchPubMed({
      term: activeFilter.term,
      sortBy: sortMode === 'recent' ? 'pub_date' : 'relevance',
      yearsBack: 3,
      retmax: PAGE_SIZE,
      evidenceFilter: evidence,
      signal: ctrl.signal,
    })
      .then(res => {
        setArticles(res.articles)
        setTotal(res.total)
      })
      .catch(err => {
        if ((err as { name?: string })?.name !== 'AbortError') {
          console.warn('[StudentNewsFeed] busca PubMed falhou:', err)
          setError(true)
          setArticles([])
          setTotal(0)
        }
      })
      .finally(() => {
        if (!ctrl.signal.aborted) setLoading(false)
      })
    return () => ctrl.abort()
  }, [filterId, sortMode, evidence]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleLoadMore = async () => {
    setLoadingMore(true)
    try {
      const res = await searchPubMed({
        term: activeFilter.term,
        sortBy: sortMode === 'recent' ? 'pub_date' : 'relevance',
        yearsBack: 3,
        retmax: PAGE_SIZE,
        retstart: articles.length,
        evidenceFilter: evidence,
      })
      setArticles(prev => {
        const seen = new Set(prev.map(a => a.pmid))
        return [...prev, ...res.articles.filter(a => !seen.has(a.pmid))]
      })
      setTotal(res.total)
    } catch (err) {
      console.warn('[StudentNewsFeed] carregar mais falhou:', err)
    } finally {
      setLoadingMore(false)
    }
  }

  const hasMore = !loading && !error && articles.length > 0 && articles.length < total

  return (
    <div className="space-y-6">
      {/* Filtros + controles + declaração de fonte */}
      <div className="rounded-xl p-4 space-y-3" style={secondarySurfaceStyle}>
        {/* Tópico */}
        <div className="flex flex-wrap gap-2">
          {FEED_FILTERS.map(f => (
            <button
              key={f.id}
              onClick={() => setFilterId(f.id)}
              className="px-4 py-2 rounded-lg text-sm font-medium transition-transform transform hover:scale-[1.02]"
              style={
                f.id === filterId
                  ? { background: accentGradient, color: '#fff' }
                  : { background: 'rgba(12,34,54,0.7)', border: '1px solid rgba(0,193,106,0.1)', color: '#C8D6E5' }
              }
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Ordenação + força de evidência */}
        <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-xs">
          <div className="flex items-center gap-1.5">
            <span className="text-brand-text-muted font-medium">Ordenar:</span>
            {SORT_MODES.map(s => (
              <button
                key={s.id}
                onClick={() => setSortMode(s.id)}
                className="px-2.5 py-1 rounded-md font-medium transition-colors"
                style={
                  s.id === sortMode
                    ? { background: accentGradient, color: '#fff' }
                    : { background: 'rgba(12,34,54,0.7)', border: '1px solid rgba(0,193,106,0.1)', color: '#C8D6E5' }
                }
              >
                {s.label}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-brand-text-muted font-medium">Evidência:</span>
            {EVIDENCE_CHOICES.map(e => (
              <button
                key={e.id}
                onClick={() => setEvidence(e.id)}
                className="px-2.5 py-1 rounded-md font-medium transition-colors"
                style={
                  e.id === evidence
                    ? { background: accentGradient, color: '#fff' }
                    : { background: 'rgba(12,34,54,0.7)', border: '1px solid rgba(0,193,106,0.1)', color: '#C8D6E5' }
                }
              >
                {e.label}
              </button>
            ))}
          </div>
        </div>

        <p className="text-xs text-slate-300/70 flex items-center gap-1.5">
          <Newspaper className="w-3.5 h-3.5 flex-shrink-0" />
          Artigos científicos recentes — fonte PubMed (NIH/NCBI), literatura peer-reviewed dos últimos 3 anos.
        </p>
      </div>

      {/* Estados */}
      {loading ? (
        <div className="rounded-xl p-8 flex items-center justify-center gap-2 text-brand-text-secondary" style={surfaceStyle}>
          <Loader2 className="w-5 h-5 animate-spin" />
          <span className="text-sm">Buscando artigos no PubMed…</span>
        </div>
      ) : error ? (
        <div className="rounded-xl p-6 flex items-start gap-3" style={surfaceStyle}>
          <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-slate-200/80">
            Não foi possível carregar os artigos agora. O serviço PubMed pode estar
            temporariamente indisponível — tente novamente em instantes.
          </p>
        </div>
      ) : articles.length === 0 ? (
        <div className="rounded-xl p-6 text-sm text-slate-300/80" style={surfaceStyle}>
          Nenhum artigo recente encontrado para este filtro.
        </div>
      ) : (
        <>
          <div className="space-y-4">
            {articles.map(a => (
              <a
                key={a.pmid}
                href={a.url}
                target="_blank"
                rel="noopener noreferrer"
                className="block rounded-xl p-6 transition-transform transform hover:scale-[1.01]"
                style={surfaceStyle}
              >
                <div className="flex items-center flex-wrap gap-2 mb-2">
                  <span className={`px-2 py-0.5 rounded text-xs font-medium border ${EVIDENCE_COLORS[a.evidenceLevel]}`}>
                    {EVIDENCE_LABELS[a.evidenceLevel]}
                  </span>
                  {a.journal && <span className="text-xs italic text-slate-300/80">{a.journal}</span>}
                  {a.pubdate && <span className="text-xs text-slate-400/70">· {a.pubdate}</span>}
                </div>
                <h3 className="text-lg font-semibold text-brand-text mb-2 leading-snug">{a.title}</h3>
                {a.authors.length > 0 && (
                  <p className="text-xs text-slate-300/70 mb-3">
                    {a.authors.slice(0, 3).join(', ')}
                    {a.authors.length > 3 ? ' et al.' : ''}
                  </p>
                )}
                <span className="text-[#4FE0C1] hover:text-brand-text text-sm font-medium inline-flex items-center gap-1">
                  Ver no PubMed
                  <ExternalLink className="w-3 h-3" />
                </span>
              </a>
            ))}
          </div>

          {/* Paginação */}
          <div className="flex flex-col items-center gap-2 pt-2">
            {hasMore && (
              <button
                onClick={handleLoadMore}
                disabled={loadingMore}
                className="px-5 py-2.5 rounded-lg text-sm font-semibold text-brand-text inline-flex items-center gap-2 transition-transform transform hover:scale-[1.02] disabled:opacity-60"
                style={{ background: accentGradient }}
              >
                {loadingMore && <Loader2 className="w-4 h-4 animate-spin" />}
                {loadingMore ? 'Carregando…' : 'Carregar mais'}
              </button>
            )}
            <span className="text-xs text-slate-400/80">
              {articles.length} de {total.toLocaleString('pt-BR')} artigos
            </span>
          </div>
        </>
      )}
    </div>
  )
}

export default StudentNewsFeed
