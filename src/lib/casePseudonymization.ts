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
