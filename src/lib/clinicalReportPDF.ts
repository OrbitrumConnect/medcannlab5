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
  watermark: '#e2e8f0',
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

const stripClinical = (s: unknown): string => stripPlatformInjectionNoise(String(s ?? ''))
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
    // Watermark diagonal repetida (cinza claro, opacity baixa via cor pastel)
    doc.saveGraphicsState()
    doc.setTextColor(BRAND.watermark)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(48)
    for (let row = 0; row < 6; row++) {
      for (let col = 0; col < 4; col++) {
        const wx = 20 + col * 55
        const wy = 50 + row * 50
        doc.text('MedCannLab', wx, wy, { angle: -30 })
      }
    }
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
    doc.text(
      'Documento assinado digitalmente · Lei 14.063/2020 + CFM 2.314/2022',
      PAGE.marginX,
      PAGE.height - 9
    )
    if (signatureHashShort) {
      doc.text(
        `ICP-Brasil: ${signatureHashShort}`,
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
      doc.text('▸', PAGE.marginX, y)
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
  doc.text(report.patientName, PAGE.marginX + 4, y + 11)

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
