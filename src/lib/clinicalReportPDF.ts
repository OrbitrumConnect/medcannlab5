// V1.9.245 — Geracao de PDF clinico formatado MedCannLab.
// Substitui o blob text/plain do handleDownloadReport (criticado por Ricardo 13/05:
// "abre um txt, poderia abrir um pdf pre formatado com estilo e marca d'agua").
//
// Modulo isolado pra reuso futuro (galeria NFT, certificate viewer, share modal).
// Zero dependencia em React/contexto — recebe report + conversation, retorna jsPDF.

import { jsPDF } from 'jspdf'
import { stripPlatformInjectionNoise } from './clinicalAssessmentFlow'

const BRAND = {
  primary: '#00C16A',
  primaryDark: '#13794f',
  text: '#1a2332',
  muted: '#64748b',
  // V1.9.249 — Tom mais claro pra marca d'agua nao competir com conteudo.
  // Anterior #e2e8f0 (cinza-claro 230) ficava denso quando repetido em mesh.
  // Agora #f1f5f9 (~240) — bem leve, perceptivel mas nao invasivo.
  watermark: '#f1f5f9',
  divider: '#d1d5db',
}

const PAGE = {
  width: 210,
  height: 297,
  marginX: 18,
  marginTop: 22,
  marginBottom: 18,
  contentWidth: 174, // 210 - 18*2
}

// V1.9.248 — Sanitiza emojis/caracteres unicode fora do range Latin-1
// (helvetica nativa do jspdf nao tem suporte completo a UTF-8 e renderizava
// "▸" como "%¸", "✓" como "'", emojis como "Ø=ÜË"/"Ø=ÜG", etc).
// Mantem acentos PT-BR (à-ÿ) intactos. Substitui marcadores conhecidos por
// equivalentes ASCII seguros e remove emojis.
const sanitizeForPDF = (s: string): string => {
  return s
    // Marcadores conhecidos que o body do AEC injeta
    .replace(/▸/g, '>')
    .replace(/✓/g, 'OK')
    .replace(/•/g, '-')
    .replace(/═/g, '=')
    .replace(/─/g, '-')
    .replace(/│/g, '|')
    .replace(/✅/g, '[OK]')
    // Remove qualquer emoji/simbolo fora do range Latin-1 extendido
    .replace(/[\u{1F000}-\u{1FFFF}]/gu, '')
    .replace(/[\u{2600}-\u{27BF}]/gu, '')
    .replace(/[\u{1F300}-\u{1F9FF}]/gu, '')
    // Catch-all: chars acima de U+00FF que sobraram viram espaço
    .replace(/[^\x00-\xFF]/g, '')
}

const stripClinical = (s: unknown): string => sanitizeForPDF(stripPlatformInjectionNoise(String(s ?? '')))
const stripClinicalList = (arr: unknown): string[] => {
  if (!Array.isArray(arr)) return []
  return arr.map((x) => stripClinical(x)).filter((t) => t.length > 0)
}
const stripListaIndiciariaItem = (item: unknown): string => {
  if (item && typeof item === 'object' && 'label' in item && (item as { label?: unknown }).label != null) {
    return stripClinical((item as { label: unknown }).label)
  }
  return stripClinical(typeof item === 'object' ? JSON.stringify(item) : item)
}

export interface ClinicalPDFReport {
  id: string
  patientName: string
  patientAge?: number
  patientCpf?: string
  date: string
  status: string
  reviewStatus?: 'pending' | 'reviewed' | 'approved'
  hasICPSignature?: boolean
  doctorNotes?: string
  nftToken?: string
  blockchainHash?: string
  content: {
    chiefComplaint?: string
    history?: string
    assessment?: string
    plan?: string
    rationalities?: Record<string, any>
  }
  rawContent?: Record<string, any>
}

export interface ClinicalPDFConversationMessage {
  user_message?: string
  ai_response?: string
}

export interface GeneratePDFOptions {
  report: ClinicalPDFReport
  conversationHistory?: ClinicalPDFConversationMessage[]
  /** Hash truncado pra footer (ICP-Brasil). Se vazio, omite linha. */
  signatureHashShort?: string
}

/**
 * Gera PDF clinico formatado MedCannLab.
 * @returns instancia jsPDF (chamar .save() pra baixar ou .output() pra blob)
 */
export function generateClinicalReportPDF(opts: GeneratePDFOptions): jsPDF {
  const { report, conversationHistory = [], signatureHashShort } = opts
  const doc = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait' })

  // Estado de paginacao
  let pageNum = 1
  let y = PAGE.marginTop

  // ──────────────────────────────────────────────────────────────────────────
  // HEADER + WATERMARK + FOOTER aplicados em cada pagina
  // ──────────────────────────────────────────────────────────────────────────
  const drawPageChrome = (currentPage: number) => {
    // V1.9.249 — Watermark muito mais discreta: 1 instancia central em vez
    // de mesh 6x4 que cobria todo conteudo. Tom #f1f5f9 (quase imperceptivel).
    // Posicao central, 60pt, angulo -30, alpha implicito via cor clara.
    doc.saveGraphicsState()
    doc.setTextColor(BRAND.watermark)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(72)
    doc.text('MedCannLab', PAGE.width / 2, PAGE.height / 2, {
      angle: -30,
      align: 'center',
    })
    doc.restoreGraphicsState()

    // Header — faixa verde
    doc.setFillColor(BRAND.primary)
    doc.rect(0, 0, PAGE.width, 12, 'F')
    doc.setFillColor(BRAND.primaryDark)
    doc.rect(0, 12, PAGE.width, 1.5, 'F')

    // Texto header
    doc.setTextColor('#ffffff')
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(13)
    doc.text('MedCannLab', PAGE.marginX, 8)

    doc.setFont('helvetica', 'normal')
    doc.setFontSize(9)
    doc.text('Plataforma Clinica · Noa Esperanza', PAGE.width - PAGE.marginX, 8, { align: 'right' })

    // Footer — linha + textos
    doc.setDrawColor(BRAND.divider)
    doc.setLineWidth(0.2)
    doc.line(PAGE.marginX, PAGE.height - 14, PAGE.width - PAGE.marginX, PAGE.height - 14)

    doc.setTextColor(BRAND.muted)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(7.5)
    // V1.9.333 (18/05) — Footer honesto. Este PDF eh template visual jsPDF, nao
    // eh assinado via sign-pdf-icp. Hash mostrado eh referencia ao report-fonte
    // (que SIM passou por digital-signature em outro fluxo), nao deste PDF
    // gerado em runtime. Ver feedback_linguagem_estado_real_nao_identidade_16_05.
    doc.text(
      'Relatorio clinico · Documento informativo · Referencia ao ato medico individual assinado',
      PAGE.marginX,
      PAGE.height - 9
    )
    if (signatureHashShort) {
      doc.text(
        `Ref. relatorio-fonte: ${signatureHashShort}`,
        PAGE.marginX,
        PAGE.height - 5
      )
    }
    doc.text(`Pagina ${currentPage}`, PAGE.width - PAGE.marginX, PAGE.height - 9, { align: 'right' })
  }

  const ensureSpace = (needed: number) => {
    if (y + needed > PAGE.height - PAGE.marginBottom) {
      doc.addPage()
      pageNum++
      drawPageChrome(pageNum)
      y = PAGE.marginTop
    }
  }

  const writeSection = (title: string) => {
    ensureSpace(12)
    y += 3
    doc.setTextColor(BRAND.primaryDark)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(10)
    doc.text(title.toUpperCase(), PAGE.marginX, y)
    y += 1.5
    doc.setDrawColor(BRAND.primary)
    doc.setLineWidth(0.4)
    doc.line(PAGE.marginX, y, PAGE.marginX + 30, y)
    y += 4.5
  }

  const writeParagraph = (text: string, opts: { bold?: boolean; size?: number; color?: string } = {}) => {
    if (!text || !text.trim()) return
    const size = opts.size ?? 9
    const color = opts.color ?? BRAND.text
    doc.setTextColor(color)
    doc.setFont('helvetica', opts.bold ? 'bold' : 'normal')
    doc.setFontSize(size)
    const lines = doc.splitTextToSize(text, PAGE.contentWidth)
    for (const line of lines) {
      ensureSpace(size * 0.45 + 1)
      doc.text(line, PAGE.marginX, y)
      y += size * 0.45 + 1
    }
  }

  const writeKeyValue = (key: string, value: string) => {
    if (!value || !value.trim()) return
    ensureSpace(5)
    doc.setTextColor(BRAND.muted)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(9)
    doc.text(`${key}:`, PAGE.marginX, y)
    const keyWidth = doc.getTextWidth(`${key}: `)
    doc.setTextColor(BRAND.text)
    doc.setFont('helvetica', 'normal')
    const lines = doc.splitTextToSize(value, PAGE.contentWidth - keyWidth)
    doc.text(lines[0] || '', PAGE.marginX + keyWidth, y)
    y += 4.2
    for (let i = 1; i < lines.length; i++) {
      ensureSpace(4.5)
      doc.text(lines[i], PAGE.marginX + keyWidth, y)
      y += 4.2
    }
  }

  const writeBulletList = (items: string[]) => {
    for (const item of items) {
      if (!item || !item.trim()) continue
      ensureSpace(5)
      doc.setTextColor(BRAND.primary)
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(9)
      doc.text('>', PAGE.marginX, y)
      doc.setTextColor(BRAND.text)
      doc.setFont('helvetica', 'normal')
      const lines = doc.splitTextToSize(item, PAGE.contentWidth - 5)
      doc.text(lines[0] || '', PAGE.marginX + 4, y)
      y += 4.2
      for (let i = 1; i < lines.length; i++) {
        ensureSpace(4.5)
        doc.text(lines[i], PAGE.marginX + 4, y)
        y += 4.2
      }
    }
  }

  // ──────────────────────────────────────────────────────────────────────────
  // INICIO RENDER
  // ──────────────────────────────────────────────────────────────────────────
  drawPageChrome(pageNum)

  // Bloco identificacao paciente
  doc.setTextColor(BRAND.text)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(16)
  doc.text('Relatorio Clinico', PAGE.marginX, y)
  y += 7

  doc.setTextColor(BRAND.muted)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.text('Avaliacao Clinica Inicial (AEC 001) · Protocolo IMRE', PAGE.marginX, y)
  y += 6

  // Caixa de metadados
  doc.setDrawColor(BRAND.divider)
  doc.setLineWidth(0.3)
  doc.roundedRect(PAGE.marginX, y, PAGE.contentWidth, 22, 1.5, 1.5)

  doc.setTextColor(BRAND.muted)
  doc.setFontSize(8)
  doc.text('PACIENTE', PAGE.marginX + 4, y + 5)
  doc.text('DATA', PAGE.marginX + 70, y + 5)
  doc.text('STATUS CLINICO', PAGE.marginX + 110, y + 5)
  doc.text('INTEGRIDADE', PAGE.marginX + 145, y + 5)

  doc.setTextColor(BRAND.text)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(10)
  doc.text(sanitizeForPDF(report.patientName), PAGE.marginX + 4, y + 11)

  const dateStr = (() => {
    try {
      return new Date(report.date).toLocaleDateString('pt-BR')
    } catch {
      return String(report.date)
    }
  })()
  doc.text(dateStr, PAGE.marginX + 70, y + 11)

  const reviewLabel =
    report.reviewStatus === 'approved' ? 'Aprovado e devolvido' :
    report.reviewStatus === 'reviewed' ? 'Revisado' :
    'Aguardando revisao'
  doc.text(reviewLabel, PAGE.marginX + 110, y + 11)

  doc.text(report.hasICPSignature ? 'ICP automatico' : '—', PAGE.marginX + 145, y + 11)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8)
  doc.setTextColor(BRAND.muted)
  const subInfo: string[] = []
  if (report.patientCpf) subInfo.push(`CPF ${report.patientCpf}`)
  if (report.patientAge && report.patientAge > 0) subInfo.push(`${report.patientAge} anos`)
  if (subInfo.length) doc.text(subInfo.join(' · '), PAGE.marginX + 4, y + 16)
  doc.text(`Relatorio #${report.id.slice(0, 8)}`, PAGE.marginX + 4, y + 19.5)

  y += 28

  // Devolucao clinica (se aprovado)
  if (report.reviewStatus === 'approved' && report.doctorNotes) {
    ensureSpace(20)
    doc.setFillColor('#ecfdf5')
    doc.setDrawColor(BRAND.primary)
    doc.setLineWidth(0.3)
    const notesLines = doc.splitTextToSize(stripClinical(report.doctorNotes), PAGE.contentWidth - 8)
    const boxHeight = 9 + notesLines.length * 4
    doc.roundedRect(PAGE.marginX, y, PAGE.contentWidth, boxHeight, 1.5, 1.5, 'FD')

    doc.setTextColor(BRAND.primaryDark)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(8.5)
    doc.text('DEVOLUCAO CLINICA DO MEDICO', PAGE.marginX + 4, y + 5)

    doc.setTextColor(BRAND.text)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(9)
    let ny = y + 10
    for (const line of notesLines) {
      doc.text(line, PAGE.marginX + 4, ny)
      ny += 4
    }
    y += boxHeight + 4
  }

  // QUEIXA PRINCIPAL
  if (report.content.chiefComplaint) {
    writeSection('Queixa Principal')
    writeParagraph(stripClinical(report.content.chiefComplaint))
  }

  // LISTA INDICIARIA
  const lista = report.rawContent?.lista_indiciaria
  if (Array.isArray(lista) && lista.length > 0) {
    writeSection(`Lista Indiciaria (${lista.length} queixas)`)
    const items: string[] = lista.map((item: any, i: number) => {
      const label = stripListaIndiciariaItem(item)
      const extra: string[] = []
      if (typeof item === 'object' && item) {
        if (item.intensity) extra.push(`intensidade ${stripClinical(item.intensity)}`)
        if (item.frequency) extra.push(`frequencia ${stripClinical(item.frequency)}`)
      }
      return `${i + 1}. ${label}${extra.length ? ` (${extra.join('; ')})` : ''}`
    })
    writeBulletList(items)
  }

  // DESENVOLVIMENTO DA QUEIXA
  const dq = report.rawContent?.desenvolvimento_queixa
  if (dq && typeof dq === 'object') {
    writeSection('Desenvolvimento da Queixa')
    if (dq.descricao) writeKeyValue('Descricao', stripClinical(dq.descricao))
    if (dq.localizacao) writeKeyValue('Localizacao', stripClinical(dq.localizacao))
    if (dq.inicio) writeKeyValue('Inicio', stripClinical(dq.inicio))
    if (Array.isArray(dq.sintomas_associados) && dq.sintomas_associados.length) {
      writeKeyValue('Sintomas associados', stripClinicalList(dq.sintomas_associados).join(', '))
    }
    if (Array.isArray(dq.fatores_melhora) && dq.fatores_melhora.length) {
      writeKeyValue('Fatores de melhora', stripClinicalList(dq.fatores_melhora).join(', '))
    }
    if (Array.isArray(dq.fatores_piora) && dq.fatores_piora.length) {
      writeKeyValue('Fatores de piora', stripClinicalList(dq.fatores_piora).join(', '))
    }
  }

  // HISTORIA / ANAMNESE
  if (report.content.history) {
    writeSection('Historia / Anamnese')
    writeParagraph(stripClinical(report.content.history))
  }

  // HPP
  const hpp = report.rawContent?.historia_patologica_pregressa
  if (Array.isArray(hpp) && hpp.length) {
    writeSection('Historia Patologica Pregressa')
    writeParagraph(stripClinicalList(hpp).join(', '))
  }

  // HISTORIA FAMILIAR
  const hf = report.rawContent?.historia_familiar
  if (hf && typeof hf === 'object') {
    const mat = Array.isArray(hf.lado_materno) ? hf.lado_materno : []
    const pat = Array.isArray(hf.lado_paterno) ? hf.lado_paterno : []
    if (mat.length || pat.length) {
      writeSection('Historia Familiar')
      if (mat.length) writeKeyValue('Lado materno', stripClinicalList(mat).join(', '))
      if (pat.length) writeKeyValue('Lado paterno', stripClinicalList(pat).join(', '))
    }
  }

  // HABITOS DE VIDA
  const habitos = report.rawContent?.habitos_vida
  if (Array.isArray(habitos) && habitos.length) {
    writeSection('Habitos de Vida')
    writeParagraph(stripClinicalList(habitos).join(', '))
  }

  // PERGUNTAS OBJETIVAS
  const po = report.rawContent?.perguntas_objetivas
  if (po && typeof po === 'object' && Object.keys(po).length) {
    writeSection('Perguntas Objetivas')
    Object.entries(po).forEach(([k, v]) => {
      if (v) writeKeyValue(k.replace(/_/g, ' '), stripClinical(v))
    })
  }

  // AVALIACAO
  if (report.content.assessment) {
    writeSection('Avaliacao')
    writeParagraph(stripClinical(report.content.assessment))
  }

  // PLANO TERAPEUTICO
  if (report.content.plan) {
    writeSection('Plano Terapeutico')
    writeParagraph(stripClinical(report.content.plan))
  }

  // SCORES
  const scores = report.rawContent?.scores
  if (scores && typeof scores === 'object') {
    const scoreItems = Object.entries(scores)
      .filter(([, v]) => typeof v === 'number' || typeof v === 'string' || typeof v === 'boolean')
      .map(([k, v]) => `${k.replace(/_/g, ' ')}: ${typeof v === 'number' ? `${v}%` : String(v)}`)
    if (scoreItems.length) {
      writeSection('Scores')
      writeBulletList(scoreItems)
    }
  }

  // RACIONALIDADES MEDICAS
  const rationalities = report.content.rationalities || {}
  const rationalitiesWithContent = Object.entries(rationalities).filter(
    ([, v]: [string, any]) => v?.assessment || v?.recommendations
  )
  if (rationalitiesWithContent.length) {
    writeSection('Racionalidades Medicas Aplicadas')
    rationalitiesWithContent.forEach(([key, value]: [string, any]) => {
      writeParagraph(key.replace(/([A-Z])/g, ' $1'), { bold: true, size: 9.5, color: BRAND.primaryDark })
      if (value.assessment) writeKeyValue('Avaliacao', stripClinical(value.assessment))
      if (value.recommendations) writeKeyValue('Recomendacoes', stripClinical(value.recommendations))
      if (value.considerations) writeKeyValue('Consideracoes', stripClinical(value.considerations))
      y += 1
    })
  }

  // CONSENSO
  const consenso = report.rawContent?.consenso
  if (consenso && typeof consenso === 'object') {
    writeSection('Consenso')
    const aceito = consenso.aceito ? 'Aceito pelo paciente' : 'Pendente'
    const rev = consenso.revisoes_realizadas > 0 ? ` (${consenso.revisoes_realizadas} revisoes)` : ''
    writeParagraph(`${aceito}${rev}`)
  }

  // NFT (se houver)
  if (report.nftToken) {
    writeSection('Assinatura Visual (NFT)')
    writeKeyValue('Token', report.nftToken)
    if (report.blockchainHash) writeKeyValue('Hash', report.blockchainHash)
  }

  // CONVERSA AEC COMPLETA
  if (conversationHistory.length > 0) {
    writeSection('Conversa AEC Completa')
    for (const msg of conversationHistory) {
      const userMsg = stripClinical(msg.user_message || '')
      const aiMsg = stripClinical((msg.ai_response || '').split('[ASSESSMENT_COMPLETED]')[0])
      if (userMsg) {
        writeParagraph('Paciente', { bold: true, size: 8, color: BRAND.muted })
        writeParagraph(userMsg, { size: 9 })
      }
      if (aiMsg) {
        writeParagraph('Noa', { bold: true, size: 8, color: BRAND.primaryDark })
        writeParagraph(aiMsg, { size: 9 })
      }
      y += 1.5
    }
  }

  return doc
}

/**
 * Helper: gera + baixa PDF clinico com nome padronizado.
 */
export function downloadClinicalReportPDF(opts: GeneratePDFOptions): void {
  const doc = generateClinicalReportPDF(opts)
  const safeName = opts.report.patientName.replace(/[^a-zA-Z0-9_-]/g, '_')
  const dateStr = (() => {
    try {
      return new Date(opts.report.date).toISOString().slice(0, 10)
    } catch {
      return 'sem-data'
    }
  })()
  doc.save(`relatorio_${safeName}_${dateStr}.pdf`)
}

// ──────────────────────────────────────────────────────────────────────────
// V1.9.247 — Helpers reutilizaveis pra outros PDFs branded (racionalidades)
// ──────────────────────────────────────────────────────────────────────────

/**
 * Aplica header/footer/watermark MedCannLab numa pagina ja existente do doc.
 * Chamar uma vez por pagina (apos addPage ou no inicio).
 */
export function drawBrandedPageChrome(doc: jsPDF, opts: { pageNumber: number; signatureHashShort?: string }): void {
  // V1.9.249 — Watermark central unica (em vez de mesh 6x4 invasivo).
  doc.saveGraphicsState()
  doc.setTextColor(BRAND.watermark)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(72)
  doc.text('MedCannLab', PAGE.width / 2, PAGE.height / 2, {
    angle: -30,
    align: 'center',
  })
  doc.restoreGraphicsState()

  doc.setFillColor(BRAND.primary)
  doc.rect(0, 0, PAGE.width, 12, 'F')
  doc.setFillColor(BRAND.primaryDark)
  doc.rect(0, 12, PAGE.width, 1.5, 'F')

  doc.setTextColor('#ffffff')
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(13)
  doc.text('MedCannLab', PAGE.marginX, 8)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.text('Plataforma Clinica · Noa Esperanza', PAGE.width - PAGE.marginX, 8, { align: 'right' })

  doc.setDrawColor(BRAND.divider)
  doc.setLineWidth(0.2)
  doc.line(PAGE.marginX, PAGE.height - 14, PAGE.width - PAGE.marginX, PAGE.height - 14)

  doc.setTextColor(BRAND.muted)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(7.5)
  // V1.9.333 (18/05) — Footer honesto pos-audit. Este PDF eh template visual jsPDF,
  // NAO eh assinado digitalmente via sign-pdf-icp (PBAD AD-RB CONFORME esta apenas
  // em prescricoes/atestados/exames via Edge digital-signature). Hash mostrado eh
  // referencia ao report-fonte (assinado separadamente), nao deste PDF gerado em
  // runtime. Memory: feedback_linguagem_estado_real_nao_identidade_16_05.
  doc.text('Comparativo informativo · Analises auxiliares por IA · Nao substitui laudo/prescricao individuais assinados', PAGE.marginX, PAGE.height - 9)
  if (opts.signatureHashShort) {
    doc.text(`Ref. relatorio-fonte: ${opts.signatureHashShort}`, PAGE.marginX, PAGE.height - 5)
  }
  doc.text(`Pagina ${opts.pageNumber}`, PAGE.width - PAGE.marginX, PAGE.height - 9, { align: 'right' })
}

const RATIONALITY_LABELS: Record<string, string> = {
  biomedical: 'Biomedica',
  traditionalChinese: 'Medicina Tradicional Chinesa',
  ayurvedic: 'Ayurvedica',
  homeopathic: 'Homeopatica',
  integrative: 'Integrativa',
}

export interface RationalityPDFOptions {
  patientName: string
  reportDate: string
  reportId: string
  rationalityKey: string
  value: any
  signatureHashShort?: string
}

/**
 * PDF de UMA racionalidade individual (botao "Baixar" dentro do modal).
 */
export function downloadRationalityPDF(opts: RationalityPDFOptions): void {
  const { patientName, reportDate, rationalityKey, value, signatureHashShort } = opts
  const label = RATIONALITY_LABELS[rationalityKey] || rationalityKey
  const doc = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait' })

  let pageNum = 1
  let y = PAGE.marginTop
  drawBrandedPageChrome(doc, { pageNumber: pageNum, signatureHashShort })

  const ensureSpace = (needed: number) => {
    if (y + needed > PAGE.height - PAGE.marginBottom) {
      doc.addPage()
      pageNum++
      drawBrandedPageChrome(doc, { pageNumber: pageNum, signatureHashShort })
      y = PAGE.marginTop
    }
  }

  const writeParagraph = (text: string, paraOpts: { bold?: boolean; size?: number; color?: string } = {}) => {
    if (!text || !text.trim()) return
    const size = paraOpts.size ?? 9
    doc.setTextColor(paraOpts.color ?? BRAND.text)
    doc.setFont('helvetica', paraOpts.bold ? 'bold' : 'normal')
    doc.setFontSize(size)
    for (const line of doc.splitTextToSize(text, PAGE.contentWidth)) {
      ensureSpace(size * 0.45 + 1)
      doc.text(line, PAGE.marginX, y)
      y += size * 0.45 + 1
    }
  }

  const writeSection = (title: string) => {
    ensureSpace(12)
    y += 3
    doc.setTextColor(BRAND.primaryDark)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(10)
    doc.text(title.toUpperCase(), PAGE.marginX, y)
    y += 1.5
    doc.setDrawColor(BRAND.primary)
    doc.setLineWidth(0.4)
    doc.line(PAGE.marginX, y, PAGE.marginX + 30, y)
    y += 4.5
  }

  // Cabecalho
  doc.setTextColor(BRAND.text)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(16)
  doc.text('Analise Clinica', PAGE.marginX, y)
  y += 7

  doc.setTextColor(BRAND.muted)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.text(`Racionalidade ${label}`, PAGE.marginX, y)
  y += 6

  doc.setDrawColor(BRAND.divider)
  doc.setLineWidth(0.3)
  doc.roundedRect(PAGE.marginX, y, PAGE.contentWidth, 16, 1.5, 1.5)
  doc.setTextColor(BRAND.muted)
  doc.setFontSize(8)
  doc.text('PACIENTE', PAGE.marginX + 4, y + 5)
  doc.text('DATA DO RELATORIO', PAGE.marginX + 90, y + 5)
  doc.setTextColor(BRAND.text)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(10)
  doc.text(patientName, PAGE.marginX + 4, y + 11)
  const dateStr = (() => {
    try { return new Date(reportDate).toLocaleDateString('pt-BR') } catch { return reportDate }
  })()
  doc.text(dateStr, PAGE.marginX + 90, y + 11)
  y += 22

  // Conteudo
  if (value.assessment) {
    writeSection('Avaliacao')
    writeParagraph(stripClinical(value.assessment))
  }

  if (Array.isArray(value.recommendations) && value.recommendations.length) {
    writeSection('Recomendacoes')
    value.recommendations.forEach((r: string, i: number) => {
      const text = stripClinical(r)
      writeParagraph(`${i + 1}. ${text}`)
    })
  }

  if (value.considerations) {
    writeSection('Consideracoes')
    writeParagraph(stripClinical(value.considerations))
  }

  if (value.approach) {
    writeSection('Abordagem')
    writeParagraph(stripClinical(value.approach))
  }

  const safeName = patientName.replace(/[^a-zA-Z0-9_-]/g, '_')
  doc.save(`analise_${rationalityKey}_${safeName}.pdf`)
}

export interface RationalitiesComparativePDFOptions {
  patientName: string
  reportId: string
  rationalities: Record<string, any>
  signatureHashShort?: string
}

/**
 * PDF comparativo de TODAS racionalidades aplicadas (botao "Baixar TODAS").
 */
export function downloadRationalitiesComparativePDF(opts: RationalitiesComparativePDFOptions): void {
  const { patientName, rationalities, signatureHashShort } = opts
  const doc = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait' })

  let pageNum = 1
  let y = PAGE.marginTop
  drawBrandedPageChrome(doc, { pageNumber: pageNum, signatureHashShort })

  const ensureSpace = (needed: number) => {
    if (y + needed > PAGE.height - PAGE.marginBottom) {
      doc.addPage()
      pageNum++
      drawBrandedPageChrome(doc, { pageNumber: pageNum, signatureHashShort })
      y = PAGE.marginTop
    }
  }

  const writeParagraph = (text: string, paraOpts: { bold?: boolean; size?: number; color?: string } = {}) => {
    if (!text || !text.trim()) return
    const size = paraOpts.size ?? 9
    doc.setTextColor(paraOpts.color ?? BRAND.text)
    doc.setFont('helvetica', paraOpts.bold ? 'bold' : 'normal')
    doc.setFontSize(size)
    for (const line of doc.splitTextToSize(text, PAGE.contentWidth)) {
      ensureSpace(size * 0.45 + 1)
      doc.text(line, PAGE.marginX, y)
      y += size * 0.45 + 1
    }
  }

  const writeRationalityHeader = (label: string) => {
    ensureSpace(14)
    y += 4
    doc.setFillColor('#ecfdf5')
    doc.setDrawColor(BRAND.primary)
    doc.setLineWidth(0.3)
    doc.roundedRect(PAGE.marginX, y - 4, PAGE.contentWidth, 9, 1.2, 1.2, 'FD')
    doc.setTextColor(BRAND.primaryDark)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(11)
    doc.text(label, PAGE.marginX + 3, y + 1.5)
    y += 9
  }

  const writeSubsection = (title: string) => {
    ensureSpace(6)
    y += 2
    doc.setTextColor(BRAND.muted)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(8.5)
    doc.text(title.toUpperCase(), PAGE.marginX, y)
    y += 3.5
  }

  // Cabecalho
  doc.setTextColor(BRAND.text)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(16)
  doc.text('Visao Comparativa', PAGE.marginX, y)
  y += 7
  doc.setTextColor(BRAND.muted)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.text('Analises Multi-Racionalidade · Paciente: ' + patientName, PAGE.marginX, y)
  y += 4
  doc.text(`Gerado em ${new Date().toLocaleString('pt-BR')}`, PAGE.marginX, y)
  y += 6

  let hasContent = false
  Object.entries(rationalities).forEach(([key, value]: [string, any]) => {
    if (!value) return
    const text = value.assessment || value.summary || value.content || value.analysis || ''
    const recs = Array.isArray(value.recommendations) ? value.recommendations : []
    const cons = value.considerations || ''
    if (!text && !recs.length && !cons) return

    hasContent = true
    writeRationalityHeader(RATIONALITY_LABELS[key] || key)

    if (text) {
      writeSubsection('Avaliacao')
      writeParagraph(stripClinical(text))
    }
    if (recs.length) {
      writeSubsection('Recomendacoes')
      recs.forEach((r: string) => writeParagraph(`▸ ${stripClinical(r)}`))
    }
    if (cons) {
      writeSubsection('Consideracoes')
      writeParagraph(stripClinical(cons))
    }
  })

  if (!hasContent) {
    writeParagraph('Nenhuma racionalidade aplicada ate o momento.', { color: BRAND.muted })
  }

  const safeName = patientName.replace(/[^a-zA-Z0-9_-]/g, '_')
  doc.save(`racionalidades_comparativo_${safeName}_${Date.now()}.pdf`)
}
