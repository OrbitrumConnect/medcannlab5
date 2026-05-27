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

export interface AnvisaSearchOpts {
  /** Termo busca — match em nome comercial + princípio ativo + classe + laboratório */
  term?: string
  /** Filtro por categoria */
  categoria?: AnvisaSearchCategoria
  /** Limite resultados (default 20) */
  limit?: number
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

/**
 * Busca síncrona no seed local. Sem fetch, sem cache (seed sempre disponível).
 * Honra AbortSignal por compatibilidade (apesar de operação ser instant).
 */
export function searchAnvisa(opts: AnvisaSearchOpts = {}): AnvisaSearchResult {
  const seedTotal = ANVISA_BULARIO_SEED.length
  const limit = opts.limit ?? 20
  const normTerm = opts.term ? normalize(opts.term) : ''
  const categoria = opts.categoria ?? 'all'

  // Filtro categoria primeiro (otimização)
  const filteredByCategoria =
    categoria === 'all'
      ? ANVISA_BULARIO_SEED
      : ANVISA_BULARIO_SEED.filter((e) => e.categoria === categoria)

  // Sem termo → retorna todos da categoria, sort alfabético
  if (!normTerm || normTerm.length < 2) {
    const sorted = [...filteredByCategoria].sort((a, b) =>
      a.nomeComercial.localeCompare(b.nomeComercial, 'pt-BR')
    )
    return {
      entries: sorted.slice(0, limit),
      total: sorted.length,
      seedTotal,
    }
  }

  // Com termo → score + filter + sort por relevância
  const scored = filteredByCategoria
    .map((entry) => ({ entry, score: scoreEntry(entry, normTerm) }))
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score)

  return {
    entries: scored.slice(0, limit).map((x) => x.entry),
    total: scored.length,
    seedTotal,
  }
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
