// [V1.9.464] (27/05/2026) — Wrapper OpenFDA Drug Label API
//
// OpenFDA é a API oficial U.S. FDA pra rótulos de medicamentos (drug labels = bulas FDA).
// Grátis ilimitado SEM autenticação. CORS-friendly. JSON estruturado.
// Docs: https://open.fda.gov/apis/drug/label/
//
// Pattern espelha pubmedService.ts V1.9.369-A — princípios Constituição idênticos:
//
//   ✅ SEM síntese GPT — bula é dado factual, mostra original
//   ✅ Linguagem "Resultados encontrados na OpenFDA", não "IA recomenda"
//   ✅ Profissional-only (aba Literatura Terminal Pesquisa)
//   ✅ ZERO PII trafegado
//   ✅ Disclaimer CFM 2.314 obrigatório (UI consumidora aplica)
//
// Princípio meta aplicado: feedback_fronteira_organizar_info_farmacologica_vs_decisao_terapeutica_27_05
//   "Organizar acesso à informação oficial" vs "Participar da decisão terapêutica" — só a primeira.
//
// Escopo: medicamentos FDA-approved US. Útil pra cannabinoides aprovados (Epidiolex, Sativex),
// não substitui ANVISA Bulário (parqueado em project_anvisa_bulario_indexacao_pdfs_parqueado_27_05).

const BASE_URL = 'https://api.fda.gov/drug/label.json'

export interface OpenFDADrugLabel {
  /** ID único (set_id da FDA OR fallback hash) */
  id: string
  /** Nome comercial principal (primeiro do array openfda.brand_name) */
  brandName: string
  /** Princípio ativo / nome genérico (primeiro do array openfda.generic_name) */
  genericName: string
  /** Laboratório fabricante */
  manufacturer: string
  /** Indicações terapêuticas (texto completo, pode ter formatação) */
  indications: string
  /** Posologia (texto completo) */
  dosage: string
  /** Advertências críticas (warnings + boxed_warning) */
  warnings: string
  /** Reações adversas */
  adverseReactions: string
  /** Contraindicações */
  contraindications: string
  /** Composição estruturada (spl_product_data_elements) */
  composition: string
  /** Data efetiva FDA (YYYYMMDD) */
  effectiveTime?: string
  /** Link pro label original FDA (DailyMed) */
  url: string
}

export interface OpenFDASearchOpts {
  /** Termo de busca — pode ser nome comercial, genérico, ou condição */
  term: string
  /** Limit de resultados (default 10, max 100 sem API key) */
  limit?: number
  /** Offset paginação ("Carregar mais") */
  skip?: number
  /** Filtro por campo específico: brand | generic | indication | composition */
  field?: 'brand' | 'generic' | 'indication' | 'composition' | 'all'
  /** Sinal pra abortar fetch (mesmo padrão pubmedService) */
  signal?: AbortSignal
}

export interface OpenFDASearchResult {
  drugs: OpenFDADrugLabel[]
  total: number
}

/**
 * Constrói query string FDA. Sintaxe: `field:term AND outro_field:outro_term`.
 * Se field=all, busca em multiple campos via OR.
 */
function buildSearchQuery(opts: OpenFDASearchOpts): string {
  const term = opts.term.trim()
  // Escape simples: vírgulas separam termos AND no FDA, espaços viram +
  const escaped = term.replace(/"/g, '').replace(/\s+/g, '+')

  switch (opts.field) {
    case 'brand':
      return `openfda.brand_name:"${escaped}"`
    case 'generic':
      return `openfda.generic_name:"${escaped}"`
    case 'indication':
      return `indications_and_usage:"${escaped}"`
    case 'composition':
      return `spl_product_data_elements:"${escaped}"`
    case 'all':
    default:
      // Busca multi-campo via OR — pega match em qualquer campo relevante
      return `(openfda.brand_name:"${escaped}"+OR+openfda.generic_name:"${escaped}"+OR+indications_and_usage:"${escaped}")`
  }
}

/**
 * Extrai primeiro item de array string (ou string vazia).
 * FDA retorna muitos campos como array mesmo quando tem 1 item.
 */
function firstOrEmpty(arr: unknown): string {
  if (Array.isArray(arr) && arr.length > 0 && typeof arr[0] === 'string') return arr[0]
  if (typeof arr === 'string') return arr
  return ''
}

/**
 * Junta array em string única (com separador) ou retorna string.
 */
function joinOrText(arr: unknown, sep = '\n\n'): string {
  if (Array.isArray(arr)) return arr.filter(x => typeof x === 'string').join(sep)
  if (typeof arr === 'string') return arr
  return ''
}

/**
 * Parse de 1 result FDA em OpenFDADrugLabel normalizado.
 */
function parseLabel(raw: any): OpenFDADrugLabel {
  const openfda = raw?.openfda || {}
  const setId = raw?.set_id || raw?.id || ''
  const brandName = firstOrEmpty(openfda.brand_name)
  const genericName = firstOrEmpty(openfda.generic_name)
  const manufacturer = firstOrEmpty(openfda.manufacturer_name)
  const effectiveTime = raw?.effective_time

  // Warnings: prioriza boxed_warning (FDA black box) + warnings_and_cautions OR warnings
  const boxedWarning = joinOrText(raw?.boxed_warning)
  const standardWarnings = joinOrText(raw?.warnings_and_cautions || raw?.warnings)
  const warnings = boxedWarning
    ? `⚠️ BOXED WARNING (FDA Black Box):\n${boxedWarning}\n\n${standardWarnings}`
    : standardWarnings

  // URL pro DailyMed (label original FDA)
  const url = setId
    ? `https://dailymed.nlm.nih.gov/dailymed/drugInfo.cfm?setid=${setId}`
    : 'https://open.fda.gov/apis/drug/label/'

  return {
    id: setId || `fda-${brandName}-${effectiveTime || Date.now()}`,
    brandName: brandName || '(sem nome comercial)',
    genericName: genericName || '(sem nome genérico)',
    manufacturer: manufacturer || '(sem fabricante)',
    indications: joinOrText(raw?.indications_and_usage),
    dosage: joinOrText(raw?.dosage_and_administration),
    warnings,
    adverseReactions: joinOrText(raw?.adverse_reactions),
    contraindications: joinOrText(raw?.contraindications),
    composition: joinOrText(raw?.spl_product_data_elements, ' · '),
    effectiveTime,
    url,
  }
}

/**
 * Busca rótulos de medicamentos no OpenFDA.
 * Lança Error em caso de falha HTTP. Honra AbortSignal.
 */
export async function searchOpenFDA(opts: OpenFDASearchOpts): Promise<OpenFDASearchResult> {
  const limit = Math.min(opts.limit ?? 10, 100)
  const skip = opts.skip ?? 0
  const query = buildSearchQuery(opts)
  // sort por effective_time desc (mais recente primeiro) — empíricamente útil
  const url = `${BASE_URL}?search=${query}&limit=${limit}&skip=${skip}&sort=effective_time:desc`

  let res: Response
  try {
    res = await fetch(url, { signal: opts.signal })
  } catch (err: any) {
    if (err?.name === 'AbortError') throw err
    throw new Error(`OpenFDA fetch error: ${err?.message || 'network'}`)
  }

  // FDA retorna 404 quando 0 matches (não é erro real — é "vazio")
  if (res.status === 404) return { drugs: [], total: 0 }
  if (!res.ok) throw new Error(`OpenFDA HTTP ${res.status}`)

  const data = await res.json()
  const total = data?.meta?.results?.total || 0
  const results = (data?.results || []) as any[]
  const drugs = results.map(parseLabel)

  return { drugs, total }
}
