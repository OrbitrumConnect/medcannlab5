/**
 * V1.9.450 — Helper de pseudonimização clínica para corpus da Nôa Matrix
 *
 * Núcleo arquitetural:
 * Quando um caso clínico é marcado no Casos Similares e enviado pro corpus
 * da Matrix Z2, precisamos passar dados clínicos RICOS (queixa, lista
 * indiciária, HDA, história familiar, hábitos, perguntas objetivas) MAS
 * SEM identificadores diretos do paciente (nome real, email, documento).
 *
 * Pré-V1.9.450 (bug arquitetural empírico):
 * - OpenedCase só armazenava { caseId, patientName, queixa(120ch) }
 * - Body do caso pra Matrix = "Caso #X\nQueixa: ..." (~50ch)
 * - Matrix respondia honestamente "não há dados sobre histórico familiar"
 *   quando o report tinha família completa no banco — porque ela
 *   literalmente não recebia esses dados no corpus
 * - Médico via Matrix como "Nôa burra" sem ser bug Z2, era pobreza de input
 *
 * V1.9.450:
 * - Helper extrai whitelist explícita de seções clínicas do content jsonb
 * - NUNCA inclui identificacao (nome/apresentação), raw, metadata, scores,
 *   structured, rationalities, consenso
 * - Função pura: sem side effects, testável, reutilizável (futuramente
 *   por F4 dossiê, fórum, relatório compartilhado)
 *
 * LGPD:
 * - Pseudonimização preservada via "Caso #X" no caller (não responsabilidade
 *   deste helper)
 * - Risco residual NÃO tratado nesta versão: nome dentro de TEXTO LIVRE
 *   ("minha mãe Maria tem diabetes" no historia_familiar.lado_materno).
 *   Mitigação parqueada pra V1.9.452 (reuso detector heurístico V1.9.437
 *   useForumPublish). Aceitável pré-PMF, baixo volume, dados de teste.
 *
 * Princípios aplicados:
 * - feedback_polir_nao_inventar (helper isolado, reutilizável, não cria N
 *   formatters espalhados)
 * - feedback_queixa_nao_e_sintoma_aec_e_abertura_fenomenologica_24_05
 *   (preserva linguagem do paciente — não traduz queixa pra sintoma)
 * - feedback_matrix_z2_contida_e_feature_nao_bug_25_05 (Matrix Z2 honesta
 *   fica utilizável quando corpus é rico)
 */

export interface PseudonymizedClinicalContent {
  queixa_principal: string | null
  lista_indiciaria: string[]
  desenvolvimento_queixa: {
    inicio: string | null
    descricao: string | null
    localizacao: string | null
    fatores_piora: string[]
    fatores_melhora: string[]
    sintomas_associados: string[]
  } | null
  historia_patologica_pregressa: string[]
  historia_familiar: {
    lado_materno: string[]
    lado_paterno: string[]
  }
  habitos_vida: string[]
  perguntas_objetivas: {
    alergias: string | null
    medicacoes_regulares: string | null
    medicacoes_esporadicas: string | null
  }
}

/**
 * Extrai whitelist clínica pseudonimizada do content jsonb de clinical_reports.
 *
 * @param content - O campo content do clinical_report (jsonb)
 * @returns Objeto com seções clínicas estruturadas ou null se inválido
 *
 * NOTA: alguns reports legados têm o conteúdo aninhado em content.raw.content
 * (V1.9.33 e anteriores). Esse helper desce 1 nível se necessário.
 */
export function extractPseudonymizedClinicalContent(
  content: unknown
): PseudonymizedClinicalContent | null {
  if (!content || typeof content !== 'object') return null

  // Desce 1 nível se conteúdo está em raw.content (formato V1.9.33 legado)
  const c = (content as any)
  const root = c?.raw?.content && typeof c.raw.content === 'object'
    ? c.raw.content
    : c

  if (!root || typeof root !== 'object') return null

  const dq = root.desenvolvimento_queixa
  const hf = root.historia_familiar
  const po = root.perguntas_objetivas

  return {
    queixa_principal: typeof root.queixa_principal === 'string'
      ? root.queixa_principal
      : (typeof root.chiefComplaint === 'string' ? root.chiefComplaint : null),
    lista_indiciaria: Array.isArray(root.lista_indiciaria)
      ? root.lista_indiciaria.filter((x: any) => typeof x === 'string')
      : [],
    desenvolvimento_queixa: dq && typeof dq === 'object' ? {
      inicio: typeof dq.inicio === 'string' ? dq.inicio : null,
      descricao: typeof dq.descricao === 'string' ? dq.descricao : null,
      localizacao: typeof dq.localizacao === 'string' ? dq.localizacao : null,
      fatores_piora: Array.isArray(dq.fatores_piora)
        ? dq.fatores_piora.filter((x: any) => typeof x === 'string')
        : [],
      fatores_melhora: Array.isArray(dq.fatores_melhora)
        ? dq.fatores_melhora.filter((x: any) => typeof x === 'string')
        : [],
      sintomas_associados: Array.isArray(dq.sintomas_associados)
        ? dq.sintomas_associados.filter((x: any) => typeof x === 'string')
        : [],
    } : null,
    historia_patologica_pregressa: Array.isArray(root.historia_patologica_pregressa)
      ? root.historia_patologica_pregressa.filter((x: any) => typeof x === 'string')
      : [],
    historia_familiar: {
      lado_materno: Array.isArray(hf?.lado_materno)
        ? hf.lado_materno.filter((x: any) => typeof x === 'string')
        : [],
      lado_paterno: Array.isArray(hf?.lado_paterno)
        ? hf.lado_paterno.filter((x: any) => typeof x === 'string')
        : [],
    },
    habitos_vida: Array.isArray(root.habitos_vida)
      ? root.habitos_vida.filter((x: any) => typeof x === 'string')
      : [],
    perguntas_objetivas: {
      alergias: typeof po?.alergias === 'string' ? po.alergias : null,
      medicacoes_regulares: typeof po?.medicacoes_regulares === 'string'
        ? po.medicacoes_regulares : null,
      medicacoes_esporadicas: typeof po?.medicacoes_esporadicas === 'string'
        ? po.medicacoes_esporadicas : null,
    },
  }
}

/**
 * Formata conteúdo clínico pseudonimizado em texto narrativo pra body do
 * caso na Nôa Matrix (corpus marcado).
 *
 * @param caseIdShort - últimos 6 chars do report.id (ex: "ff127a")
 * @param dateStr - data formatada (ex: "25/04/2026")
 * @param clinical - resultado de extractPseudonymizedClinicalContent
 * @returns texto formatado pronto pra ir no body do caso
 *
 * Decisões de formatação:
 * - Omite seções vazias (não polui contexto)
 * - Usa "—" pra placeholders quando campo existe mas valor é null
 * - Listas com hífen pra parser-friendly
 * - Mantém linguagem do paciente em primeira pessoa (princípio Ricardo:
 *   queixa preserva abertura fenomenológica)
 */
export function formatPseudonymizedCaseBody(
  caseIdShort: string,
  dateStr: string,
  clinical: PseudonymizedClinicalContent | null,
  queixaFallback?: string,
): string {
  const lines: string[] = [`Caso #${caseIdShort} · ${dateStr}`]

  if (!clinical) {
    // Fallback: report sem content estruturado (legado)
    if (queixaFallback) {
      lines.push('', `Queixa: "${queixaFallback}"`)
    }
    return lines.join('\n')
  }

  if (clinical.queixa_principal) {
    lines.push('', `Queixa Principal: ${clinical.queixa_principal}`)
  } else if (queixaFallback) {
    lines.push('', `Queixa: "${queixaFallback}"`)
  }

  if (clinical.lista_indiciaria.length > 0) {
    lines.push('', 'Lista Indiciária:')
    clinical.lista_indiciaria.forEach((item) => lines.push(`- ${item}`))
  }

  if (clinical.desenvolvimento_queixa) {
    const dq = clinical.desenvolvimento_queixa
    const parts: string[] = []
    if (dq.inicio) parts.push(`início: ${dq.inicio}`)
    if (dq.descricao) parts.push(`descrição: ${dq.descricao}`)
    if (dq.localizacao) parts.push(`localização: ${dq.localizacao}`)
    if (parts.length > 0) {
      lines.push('', `História da Doença Atual: ${parts.join('; ')}`)
    }
    if (dq.fatores_piora.length > 0) {
      lines.push(`Fatores de piora: ${dq.fatores_piora.join(', ')}`)
    }
    if (dq.fatores_melhora.length > 0) {
      lines.push(`Fatores de melhora: ${dq.fatores_melhora.join(', ')}`)
    }
    if (dq.sintomas_associados.length > 0) {
      lines.push(`Sintomas associados: ${dq.sintomas_associados.join(', ')}`)
    }
  }

  if (clinical.historia_patologica_pregressa.length > 0) {
    lines.push('', 'História Patológica Pregressa:')
    clinical.historia_patologica_pregressa.forEach((item) => lines.push(`- ${item}`))
  }

  const hfM = clinical.historia_familiar.lado_materno
  const hfP = clinical.historia_familiar.lado_paterno
  if (hfM.length > 0 || hfP.length > 0) {
    lines.push('', 'História Familiar:')
    if (hfM.length > 0) lines.push(`- Lado materno: ${hfM.join('; ')}`)
    if (hfP.length > 0) lines.push(`- Lado paterno: ${hfP.join('; ')}`)
  }

  if (clinical.habitos_vida.length > 0) {
    lines.push('', 'Hábitos de Vida:')
    clinical.habitos_vida.forEach((item) => lines.push(`- ${item}`))
  }

  const po = clinical.perguntas_objetivas
  const poParts: string[] = []
  if (po.alergias) poParts.push(`alergias: ${po.alergias}`)
  if (po.medicacoes_regulares) poParts.push(`medicações regulares: ${po.medicacoes_regulares}`)
  if (po.medicacoes_esporadicas) poParts.push(`medicações esporádicas: ${po.medicacoes_esporadicas}`)
  if (poParts.length > 0) {
    lines.push('', `Perguntas Objetivas: ${poParts.join('; ')}`)
  }

  return lines.join('\n')
}

// ════════════════════════════════════════════════════════════════════════════
// [V1.9.452] (27/05/2026) — Sanitização PII em campo `assessment` de
// clinical_rationalities + clinical_reports.content.rationalities.
//
// Contexto empírico: audit PAT 27/05 confirmou 115/130 rows (88.5%) com
// nome próprio do paciente vazado no campo `assessment`. Manifestou em 2
// dossiês PDF reais hoje:
//   - Dossiê Ricardo manhã: "CAROLINA CAMPELLO DO RÊGO VALENÇA"
//   - Dossiê Pedro 10:48: "O paciente, Pedro, relata dor..."
//
// Gap LGPD bloqueador absoluto pré-Marco 2 (CLAUDE.md P0 backlog desde 25/05).
//
// Estratégia: substitui tokens do nome real (Nome + Sobrenome + variantes
// CAIXA ALTA) por pseudo-ID "Paciente #XXXXXX" (primeiros 6 chars do
// patient_id em uppercase). Preserva resto do texto clínico intacto.
//
// Risco MÉDIO de mutilação clínica se token coincidir com palavra clínica
// real — mitigado por:
//   1. Token deve ter length >= 3 (evita matches falsos curtos)
//   2. Regex \b boundary (evita partial matches dentro de palavras)
//   3. Patterns conhecidos "O paciente, X," são tratados explicitamente
//
// Aplicado em rationalityAnalysisService.saveAnalysisToReport ANTES dos 2
// INSERTs (jsonb em clinical_reports.content + tabela clinical_rationalities).
// ════════════════════════════════════════════════════════════════════════════

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

// V1.9.565: variantes de acento de uma mesma letra-base (José ↔ Jose, Conceição ↔ Conceicao).
const ACCENT_VARIANTS: Record<string, string> = {
  a: 'aàáâãäå', e: 'eèéêë', i: 'iìíîï', o: 'oòóôõö', u: 'uùúûü', c: 'cç', n: 'nñ',
}
// Padrão insensível a acento a partir da LETRA-BASE do token. Ex.: "jose" -> "j[oòóôõö]s[eèéêë]".
// Só expande variantes da mesma letra (não amplia o que casa) — outros chars viram literal escapado.
function accentInsensitivePattern(token: string): string {
  const base = token.normalize('NFD').replace(/[̀-ͯ]/g, '') // remove acentos do token
  let pat = ''
  for (const ch of base) {
    const lower = ch.toLowerCase()
    pat += ACCENT_VARIANTS[lower] ? `[${ACCENT_VARIANTS[lower]}]` : escapeRegex(ch)
  }
  return pat
}

/**
 * Sanitiza nome real do paciente em texto livre `assessment`.
 *
 * @param assessment Texto bruto da racionalidade (pode conter nome real)
 * @param patientName Nome real do paciente (de users.name)
 * @param patientId UUID do paciente (pra gerar pseudo-ID dos primeiros 6 chars)
 * @returns Texto sanitizado com nome substituído por "Paciente #XXXXXX"
 */
export function sanitizeAssessmentPII(
  assessment: string | null | undefined,
  patientName: string | null | undefined,
  patientId: string | null | undefined,
): string {
  if (!assessment || typeof assessment !== 'string') return assessment || ''
  if (!patientName || patientName.trim().length === 0) return assessment

  const pseudoId = patientId
    ? `Paciente #${patientId.replace(/-/g, '').slice(0, 6).toUpperCase()}`
    : 'o(a) paciente'

  // Split nome em tokens >= 3 chars (evita "de", "da", "do")
  const tokens = patientName
    .split(/\s+/)
    .filter((t) => t.length >= 3)
    // Remove conectivos comuns que NÃO devem ser substituídos
    .filter((t) => !/^(dos?|das?|de|del|von|van)$/i.test(t))

  if (tokens.length === 0) return assessment

  let sanitized = assessment

  // Substitui cada token (case-insensitive, word boundary)
  // Cobre CAROLINA, Carolina, carolina simultaneamente via flag /gi
  for (const token of tokens) {
    // 1) match EXATO (comportamento atual — sempre roda, nunca regride)
    sanitized = sanitized.replace(new RegExp(`\\b${escapeRegex(token)}\\b`, 'gi'), pseudoId)
    // 2) match insensível a ACENTO (aditivo — pega José↔Jose, Conceição↔Conceicao). DEFENSIVO:
    //    se o runtime não suportar a regex (lookbehind/range Latin-1), o match exato acima já cobre.
    //    Fronteira ciente de acento (À-ÿ = Latin-1, cobre acentos PT) evita casar DENTRO de palavra.
    try {
      const aiPat = accentInsensitivePattern(token)
      if (aiPat && aiPat !== escapeRegex(token)) {
        sanitized = sanitized.replace(new RegExp(`(?<![A-Za-zÀ-ÿ])${aiPat}(?![A-Za-zÀ-ÿ])`, 'gi'), pseudoId)
      }
    } catch {
      /* runtime sem lookbehind — match exato já aplicado acima (zero regressão) */
    }
  }

  // Patterns clássicos GPT que vazam: "O paciente, Pedro," / "A paciente, Maria,"
  // Mesmo se nome individual já foi substituído, virgulas podem ficar pendentes
  sanitized = sanitized
    .replace(new RegExp(`\\bO paciente,\\s*${escapeRegex(pseudoId)},`, 'gi'), 'O(a) paciente,')
    .replace(new RegExp(`\\bA paciente,\\s*${escapeRegex(pseudoId)},`, 'gi'), 'A(o) paciente,')

  // Dedup: collapse N pseudos consecutivos (com qualquer separador entre eles)
  // em 1 só. Trata casos "CAROLINA CAMPELLO DO RÊGO VALENÇA" (4 tokens) que
  // viraram "Paciente #X Paciente #X DO Paciente #X Paciente #X" → "Paciente #X".
  // Conectivos preservados ("dos?", "das?", "de", "del", "von", "van") ficam
  // intermediados — collapse só faz sentido se forem todos pseudos.
  const escPseudo = escapeRegex(pseudoId)
  // 1ª passada: collapse separadores conectivos entre pseudos: "Paciente #X de Paciente #X" → "Paciente #X"
  sanitized = sanitized.replace(
    new RegExp(`(${escPseudo})\\s+(?:dos?|das?|de|del|von|van|do)\\s+(${escPseudo})`, 'gi'),
    pseudoId,
  )
  // 2ª passada (loop): collapse pseudos consecutivos separados só por whitespace ou vírgula
  let prev: string
  do {
    prev = sanitized
    sanitized = sanitized.replace(
      new RegExp(`(${escPseudo})[\\s,]+(${escPseudo})`, 'gi'),
      pseudoId,
    )
  } while (sanitized !== prev)

  return sanitized
}

