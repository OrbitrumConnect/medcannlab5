// [V1.9.423] (22/05/2026) — Feed de Notícias do aluno: artigos PubMed reais.
//
// Substitui o array hardcoded de 3 "notícias" fabricadas (datas 01/2025,
// imagens via.placeholder, alegações científicas inventadas). Agora puxa
// literatura peer-reviewed real via `pubmedService` (V1.9.369 — API oficial
// NIH/NCBI, grátis, sem key). Conteúdo autoritativo, impossível de fabricar.
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
} from '../services/pubmedService'

type FeedFilter = { id: string; label: string; term: string }

// Verticais reais da plataforma — termos que o PubMed indexa de fato.
// "Metodologia AEC" e "Regulamentação" saíram: a primeira é método próprio
// (sem presença no PubMed); a segunda seria ANVISA, fonte separada.
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

interface Props {
  surfaceStyle: React.CSSProperties
  secondarySurfaceStyle: React.CSSProperties
  accentGradient: string
}

const StudentNewsFeed: React.FC<Props> = ({ surfaceStyle, secondarySurfaceStyle, accentGradient }) => {
  const [filterId, setFilterId] = useState<string>(FEED_FILTERS[0].id)
  const [articles, setArticles] = useState<PubMedArticle[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    const ctrl = new AbortController()
    const active = FEED_FILTERS.find(f => f.id === filterId) ?? FEED_FILTERS[0]
    setLoading(true)
    setError(false)
    searchPubMed({ term: active.term, sortBy: 'pub_date', yearsBack: 3, retmax: 12, signal: ctrl.signal })
      .then(res => setArticles(res.articles))
      .catch(err => {
        if ((err as { name?: string })?.name !== 'AbortError') {
          console.warn('[StudentNewsFeed] busca PubMed falhou:', err)
          setError(true)
        }
      })
      .finally(() => {
        if (!ctrl.signal.aborted) setLoading(false)
      })
    return () => ctrl.abort()
  }, [filterId])

  return (
    <div className="space-y-6">
      {/* Filtros + declaração de fonte */}
      <div className="rounded-xl p-4" style={secondarySurfaceStyle}>
        <div className="flex flex-wrap gap-2 mb-3">
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
        <p className="text-xs text-slate-300/70 flex items-center gap-1.5">
          <Newspaper className="w-3.5 h-3.5 flex-shrink-0" />
          Artigos científicos recentes — fonte PubMed (NIH/NCBI), literatura peer-reviewed dos últimos 3 anos.
        </p>
      </div>

      {/* Estados */}
      {loading ? (
        <div className="rounded-xl p-8 flex items-center justify-center gap-2 text-slate-300" style={surfaceStyle}>
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
              <h3 className="text-lg font-semibold text-white mb-2 leading-snug">{a.title}</h3>
              {a.authors.length > 0 && (
                <p className="text-xs text-slate-300/70 mb-3">
                  {a.authors.slice(0, 3).join(', ')}
                  {a.authors.length > 3 ? ' et al.' : ''}
                </p>
              )}
              <span className="text-[#4FE0C1] hover:text-white text-sm font-medium inline-flex items-center gap-1">
                Ver no PubMed
                <ExternalLink className="w-3 h-3" />
              </span>
            </a>
          ))}
        </div>
      )}
    </div>
  )
}

export default StudentNewsFeed
