// [V1.9.369-A] (18/05/2026) — Wrapper PubMed E-utilities API
//
// PubMed E-utilities é a API oficial NIH/NCBI (NLM) — gold standard biomédico.
// Grátis ilimitado (sem API key obrigatória pra uso baixo volume).
// Docs: https://www.ncbi.nlm.nih.gov/books/NBK25500/
//
// Pipeline: esearch (term → IDs) → esummary (IDs → metadata).
// Abstract NÃO é buscado nesta versão (evita custo + payload — fica em V1.9.369-B se necessário).
//
// Sem síntese GPT (memory feedback_viabilidade_tecnica_vs_legitimidade_epistemologica_18_05).
// Linguagem "Resultados encontrados", não "IA recomenda".
// Filtro por nível de evidência via Publication Type (mapeamento curado).
//
// SEM impacto no Supabase, SEM credencial, ZERO PII trafegado.

const BASE_URL = 'https://eutils.ncbi.nlm.nih.gov/entrez/eutils'
const TOOL_NAME = 'medcannlab'
const CONTACT_EMAIL = 'noreply@medcannlab.com.br'

export type EvidenceLevel =
  | 'meta-analysis'
  | 'rct'
  | 'observational'
  | 'review'
  | 'case-report'
  | 'guideline'
  | 'other'

export const EVIDENCE_LABELS: Record<EvidenceLevel, string> = {
  'meta-analysis': 'Meta-análise',
  'rct': 'RCT',
  'observational': 'Observacional',
  'review': 'Review',
  'case-report': 'Case Report',
  'guideline': 'Guideline',
  'other': 'Outros',
}

export const EVIDENCE_COLORS: Record<EvidenceLevel, string> = {
  'meta-analysis': 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
  'rct': 'bg-blue-500/15 text-blue-300 border-blue-500/30',
  'observational': 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30',
  'review': 'bg-violet-500/15 text-violet-300 border-violet-500/30',
  'guideline': 'bg-amber-500/15 text-amber-300 border-amber-500/30',
  'case-report': 'bg-slate-500/15 text-slate-300 border-slate-500/30',
  'other': 'bg-slate-700/30 text-slate-400 border-slate-600/40',
}

export interface PubMedArticle {
  pmid: string
  title: string
  authors: string[]
  journal: string
  pubdate: string
  publicationTypes: string[]
  evidenceLevel: EvidenceLevel
  doi?: string
  url: string
}

export interface SearchOpts {
  term: string
  retmax?: number
  yearsBack?: number
  evidenceFilter?: EvidenceLevel | 'all'
  // [V1.9.369-B] presets editoriais
  daysBack?: number // override yearsBack pra granularidade fina (Novidades 7 dias, etc)
  affiliationBR?: boolean // restringe Affiliation=Brazil/Brasil
  sortBy?: 'relevance' | 'pub_date' // PubMed default = relevance; pub_date pra Novidades
  retstart?: number // [V1.9.424] offset de paginação ("Carregar mais")
  signal?: AbortSignal
}

export interface SearchResult {
  articles: PubMedArticle[]
  total: number
}

const PUB_TYPE_TO_EVIDENCE: Array<[string, EvidenceLevel]> = [
  // Ordem importa — primeiro match vence (do mais forte ao mais fraco)
  ['Meta-Analysis', 'meta-analysis'],
  ['Systematic Review', 'meta-analysis'],
  ['Randomized Controlled Trial', 'rct'],
  ['Clinical Trial, Phase III', 'rct'],
  ['Clinical Trial, Phase II', 'rct'],
  ['Clinical Trial, Phase IV', 'rct'],
  ['Clinical Trial', 'rct'],
  ['Practice Guideline', 'guideline'],
  ['Guideline', 'guideline'],
  ['Cohort Studies', 'observational'],
  ['Case-Control Studies', 'observational'],
  ['Observational Study', 'observational'],
  ['Cross-Sectional Studies', 'observational'],
  ['Review', 'review'],
  ['Case Reports', 'case-report'],
]

function mapEvidenceLevel(pubTypes: string[]): EvidenceLevel {
  for (const [keyword, level] of PUB_TYPE_TO_EVIDENCE) {
    if (pubTypes.some(t => t.toLowerCase().includes(keyword.toLowerCase()))) {
      return level
    }
  }
  return 'other'
}

// PubMed query syntax: filtro por publication type — só aplica se filtro != 'all'
function buildSearchTerm(opts: SearchOpts): string {
  const base = opts.term.trim()
  const parts: string[] = [`(${base}[Title/Abstract])`]

  // daysBack tem precedência sobre yearsBack (granularidade fina pra Novidades)
  if (opts.daysBack && opts.daysBack > 0) {
    parts.push(`("last ${opts.daysBack} days"[PDat])`)
  } else if (opts.yearsBack && opts.yearsBack > 0) {
    parts.push(`("last ${opts.yearsBack} years"[PDat])`)
  }

  if (opts.evidenceFilter && opts.evidenceFilter !== 'all') {
    const ptFilter = evidenceFilterToPubType(opts.evidenceFilter)
    if (ptFilter) parts.push(ptFilter)
  }

  // [V1.9.369-B] filtro afiliação Brasil — autor com instituição BR
  if (opts.affiliationBR) {
    parts.push('(Brazil[Affiliation] OR Brasil[Affiliation])')
  }

  return parts.join(' AND ')
}

function evidenceFilterToPubType(level: EvidenceLevel): string | null {
  switch (level) {
    case 'meta-analysis':
      return '("Meta-Analysis"[Publication Type] OR "Systematic Review"[Publication Type])'
    case 'rct':
      return '"Randomized Controlled Trial"[Publication Type]'
    case 'observational':
      return '("Observational Study"[Publication Type] OR "Cohort Studies"[Publication Type] OR "Case-Control Studies"[Publication Type])'
    case 'guideline':
      return '("Practice Guideline"[Publication Type] OR "Guideline"[Publication Type])'
    case 'review':
      return '"Review"[Publication Type]'
    case 'case-report':
      return '"Case Reports"[Publication Type]'
    default:
      return null
  }
}

async function fetchJson(url: string, signal?: AbortSignal): Promise<any> {
  const res = await fetch(url, { signal })
  if (!res.ok) {
    throw new Error(`PubMed HTTP ${res.status}`)
  }
  return res.json()
}

async function esearch(opts: SearchOpts): Promise<{ ids: string[]; total: number }> {
  const term = buildSearchTerm(opts)
  const retmax = opts.retmax ?? 10
  const sort = opts.sortBy === 'pub_date' ? '&sort=pub+date' : ''
  // [V1.9.424] retstart só entra na URL quando > 0 — preserva 100% o
  // comportamento dos callers antigos (Matrix), que nunca passam retstart.
  const retstart = opts.retstart && opts.retstart > 0 ? `&retstart=${opts.retstart}` : ''
  const url = `${BASE_URL}/esearch.fcgi?db=pubmed&term=${encodeURIComponent(term)}&retmax=${retmax}&retmode=json&tool=${TOOL_NAME}&email=${encodeURIComponent(CONTACT_EMAIL)}${sort}${retstart}`
  const data = await fetchJson(url, opts.signal)
  const ids = (data?.esearchresult?.idlist as string[]) || []
  const total = parseInt(data?.esearchresult?.count || '0', 10)
  return { ids, total }
}

async function esummary(ids: string[], signal?: AbortSignal): Promise<PubMedArticle[]> {
  if (ids.length === 0) return []
  const url = `${BASE_URL}/esummary.fcgi?db=pubmed&id=${ids.join(',')}&retmode=json&tool=${TOOL_NAME}&email=${encodeURIComponent(CONTACT_EMAIL)}`
  const data = await fetchJson(url, signal)
  const result = data?.result || {}
  const uids: string[] = result.uids || []
  return uids.map(pmid => {
    const raw = result[pmid] || {}
    const authors: string[] = (raw.authors || []).map((a: any) => a.name).filter(Boolean)
    const publicationTypes: string[] = (raw.pubtype as string[]) || []
    const articleIds: Array<{ idtype: string; value: string }> = raw.articleids || []
    const doi = articleIds.find(x => x.idtype === 'doi')?.value
    return {
      pmid,
      title: raw.title || '(sem título)',
      authors,
      journal: raw.fulljournalname || raw.source || '',
      pubdate: raw.pubdate || '',
      publicationTypes,
      evidenceLevel: mapEvidenceLevel(publicationTypes),
      doi,
      url: `https://pubmed.ncbi.nlm.nih.gov/${pmid}/`,
    }
  })
}

export async function searchPubMed(opts: SearchOpts): Promise<SearchResult> {
  const { ids, total } = await esearch(opts)
  if (ids.length === 0) return { articles: [], total }
  const articles = await esummary(ids, opts.signal)
  return { articles, total }
}
