// [V1.9.465] (27/05/2026) — Service ANVISA Bulário BR (catálogo local)
//
// MVP-Catálogo: consulta JSON estático src/data/anvisaBularioSeed.ts (~42 bulas top BR).
// ZERO conteúdo de bula armazenado — só METADADOS + link bulário ANVISA oficial.
//
// Princípio fronteira info farmacológica aplicado:
//   ✅ Sistema é INDEX/CATÁLOGO, não substitui bulário oficial
//   ✅ Médico clica → abre portal ANVISA externa → lê bula ORIGINAL
//   ✅ Sem fetch externo (instant query)
//   ✅ Sem síntese GPT
//
// Decisão arquitetural: JSON estático >> tabela Supabase pra MVP (50 bulas).
// Quando >200 bulas + atualizações frequentes, migrar pra tabela.
//
// Pipeline completo (Fase 2-Pleno parqueado em memory
// project_anvisa_bulario_indexacao_pdfs_parqueado_27_05) terá scraping/OCR cron.

import {
  ANVISA_BULARIO_SEED,
  type BularioEntry,
  type BularioCategoria,
} from '../data/anvisaBularioSeed'

export type AnvisaSearchCategoria = BularioCategoria | 'all'

/** V1.9.465-A — opções de ordenação */
export type AnvisaSortBy = 'az' | 'za' | 'categoria' | 'tarja' | 'relevance'

export interface AnvisaSearchOpts {
  /** Termo busca — match em nome comercial + princípio ativo + classe + laboratório */
  term?: string
  /** Filtro por categoria */
  categoria?: AnvisaSearchCategoria
  /** Limite resultados (default 40 — agora cabe mais com grid 4 colunas) */
  limit?: number
  /** Ordenação (default: 'relevance' se há term, 'az' caso contrário) */
  sortBy?: AnvisaSortBy
}

export interface AnvisaSearchResult {
  entries: BularioEntry[]
  total: number
  /** Total no seed (pra UI mostrar "X de Y") */
  seedTotal: number
}

/**
 * Normaliza string pra busca (lowercase + remove acentos + trim).
 */
function normalize(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .trim()
}

/**
 * Score de relevância: match exato no nome > início > qualquer campo.
 * Quanto MAIOR o score, MAIS relevante.
 */
function scoreEntry(entry: BularioEntry, normTerm: string): number {
  if (!normTerm) return 0

  const nome = normalize(entry.nomeComercial)
  const ativo = normalize(entry.principioAtivo)
  const classe = normalize(entry.classeTerapeutica)
  const lab = normalize(entry.laboratorio)
  const indicacao = normalize(entry.indicacaoResumida)

  let score = 0

  // Match exato no nome comercial = score máximo
  if (nome === normTerm) score += 100
  else if (nome.startsWith(normTerm)) score += 70
  else if (nome.includes(normTerm)) score += 50

  // Match em princípio ativo (pesquisa farmacológica relevante)
  if (ativo === normTerm) score += 80
  else if (ativo.startsWith(normTerm)) score += 50
  else if (ativo.includes(normTerm)) score += 30

  // Match em classe terapêutica
  if (classe.includes(normTerm)) score += 20

  // Match em indicação (peso menor)
  if (indicacao.includes(normTerm)) score += 10

  // Match em laboratório (peso baixo)
  if (lab.includes(normTerm)) score += 5

  return score
}

/** V1.9.465-A — ordem peso pra sort por categoria (cannabis primeiro = wedge clínico MedCannLab) */
const CATEGORIA_ORDER: Record<BularioCategoria, number> = {
  cannabis: 1,
  anticonvulsivante: 2,
  psicotropico: 3,
  analgesico: 4,
  nefro: 5,
  outros: 6,
}

/** V1.9.465-A — ordem peso pra sort por tarja (preta = controle mais restritivo primeiro) */
const TARJA_ORDER: Record<string, number> = {
  preta: 1,
  amarela: 2,
  vermelha: 3,
  branca: 4,
}

/**
 * Aplica ordenação ao array de entries (V1.9.465-A).
 */
function applySort(entries: BularioEntry[], sortBy: AnvisaSortBy): BularioEntry[] {
  const sorted = [...entries]
  switch (sortBy) {
    case 'az':
      return sorted.sort((a, b) => a.nomeComercial.localeCompare(b.nomeComercial, 'pt-BR'))
    case 'za':
      return sorted.sort((a, b) => b.nomeComercial.localeCompare(a.nomeComercial, 'pt-BR'))
    case 'categoria':
      return sorted.sort((a, b) => {
        const ca = CATEGORIA_ORDER[a.categoria] ?? 99
        const cb = CATEGORIA_ORDER[b.categoria] ?? 99
        if (ca !== cb) return ca - cb
        return a.nomeComercial.localeCompare(b.nomeComercial, 'pt-BR')
      })
    case 'tarja':
      return sorted.sort((a, b) => {
        const ta = TARJA_ORDER[a.tarja || 'branca'] ?? 99
        const tb = TARJA_ORDER[b.tarja || 'branca'] ?? 99
        if (ta !== tb) return ta - tb
        return a.nomeComercial.localeCompare(b.nomeComercial, 'pt-BR')
      })
    case 'relevance':
    default:
      return sorted // já vem ordenado por score na busca com term
  }
}

/**
 * Busca síncrona no seed local. Sem fetch, sem cache (seed sempre disponível).
 * V1.9.465-A: suporta sortBy + limit aumentado pra grid 4 colunas.
 */
export function searchAnvisa(opts: AnvisaSearchOpts = {}): AnvisaSearchResult {
  const seedTotal = ANVISA_BULARIO_SEED.length
  const limit = opts.limit ?? 40
  const normTerm = opts.term ? normalize(opts.term) : ''
  const categoria = opts.categoria ?? 'all'
  const sortBy: AnvisaSortBy = opts.sortBy ?? (normTerm ? 'relevance' : 'az')

  // Filtro categoria primeiro (otimização)
  const filteredByCategoria =
    categoria === 'all'
      ? ANVISA_BULARIO_SEED
      : ANVISA_BULARIO_SEED.filter((e) => e.categoria === categoria)

  // Sem termo → retorna todos da categoria, aplica sort escolhido
  if (!normTerm || normTerm.length < 2) {
    const sorted = applySort(filteredByCategoria, sortBy === 'relevance' ? 'az' : sortBy)
    return {
      entries: sorted.slice(0, limit),
      total: sorted.length,
      seedTotal,
    }
  }

  // Com termo → score + filter
  const scored = filteredByCategoria
    .map((entry) => ({ entry, score: scoreEntry(entry, normTerm) }))
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score) // sempre por score primeiro

  // Aplica sortBy se NÃO for 'relevance' (relevance já é o default com term)
  const ordered =
    sortBy === 'relevance'
      ? scored.map((x) => x.entry)
      : applySort(
          scored.map((x) => x.entry),
          sortBy
        )

  return {
    entries: ordered.slice(0, limit),
    total: scored.length,
    seedTotal,
  }
}

/**
 * V1.9.466 — Helper pra lookup de bula por nome de medicação.
 * Usado pelo popover bula no QuickPrescriptions.tsx (integração fluxo prescrição).
 * Match fuzzy: nome comercial OR princípio ativo. Retorna 1ª match ou null.
 */
export function getBularioByMedication(medicationName: string): BularioEntry | null {
  if (!medicationName || medicationName.trim().length < 3) return null
  const result = searchAnvisa({ term: medicationName, limit: 1, sortBy: 'relevance' })
  return result.entries[0] || null
}

/**
 * Helper UI: retorna count por categoria pro filtro dropdown.
 */
export function getCategoriaCounts(): Record<AnvisaSearchCategoria, number> {
  const counts: Record<string, number> = { all: ANVISA_BULARIO_SEED.length }
  for (const entry of ANVISA_BULARIO_SEED) {
    counts[entry.categoria] = (counts[entry.categoria] || 0) + 1
  }
  return counts as Record<AnvisaSearchCategoria, number>
}
