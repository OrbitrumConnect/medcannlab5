// =====================================================
// 🔐 EDGE FUNCTION: PDF ASSINADO ICP-BRASIL REAL (V1.9.299)
// =====================================================
// Gera PDF programaticamente + embeda PKCS#7 detached no /Sig dictionary
// conforme ISO 32000-1 §12.8. Validável em validar.iti.gov.br e Adobe Acrobat.
//
// IMPLEMENTAÇÃO PLAN B (15/05/2026 ~15h30): @signpdf libs não bootam em Deno
// (Node-first, import-time crash). Implementação manual com pdf-lib + node-forge
// (ambas comprovadamente funcionam em Deno).
//
// IMPORTANTE: roda PARALELO à edge digital-signature (V1.9.176).
// Edge digital-signature continua INTACTA — gera PKCS#7 sobre JSON (auditoria interna).
// Esta edge gera PDF jurídico oficial (PKCS#7 sobre bytes do PDF, /Sig embedded).
// ZERO regressão.
// =====================================================

import { createClient } from "https://esm.sh/@supabase/supabase-js@2"
import { PDFDocument, StandardFonts, rgb, PDFName, PDFString, PDFHexString, PDFArray } from "https://esm.sh/pdf-lib@1.17.1"
import forge from "https://esm.sh/node-forge@1.3.1"
import { ICP_BRASIL_CHAIN_PEMS } from "./icp_chain.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface SignPdfRequest {
  documentId: string
  documentType?: 'prescription' | 'exam_request'
}

const TABLE_BY_DOC_TYPE: Record<'prescription' | 'exam_request', string> = {
  prescription: 'cfm_prescriptions',
  exam_request: 'patient_exam_requests'
}

const STORAGE_PATH_BY_DOC_TYPE: Record<'prescription' | 'exam_request', string> = {
  prescription: 'prescriptions',
  exam_request: 'exam_requests'
}

// Tamanho fixo do placeholder /Contents em hex chars.
// V1.9.299 (15/05/2026): 65536 (32KB) — GPT review #4: esquece esse problema por anos.
// Custo: ~16KB extras por PDF (irrelevante operacionalmente, max 10MB no bucket).
// Capacidade: cobre leaf + 5 intermediários + RSA 4096 + signed attrs + TSA futuro.
const SIGNATURE_PLACEHOLDER_HEX_LENGTH = 65536

// ============================================================================
// CRYPTO — decrypt inline (espelho de _shared/crypto.ts) pra evitar bundle issue.
// AES-GCM com chave derivada de SHA-256(ENCRYPTION_KEY). Formato: "ivB64:encryptedB64"
// ============================================================================
async function decryptPassword(text: string): Promise<string> {
  const encoder = new TextEncoder()
  const decoder = new TextDecoder()
  const secret = Deno.env.get("ENCRYPTION_KEY")
  if (!secret) throw new Error("ENCRYPTION_KEY ausente")

  const hashBuffer = await crypto.subtle.digest("SHA-256", encoder.encode(secret))
  const key = await crypto.subtle.importKey("raw", hashBuffer, "AES-GCM", false, ["decrypt"])

  const parts = text.split(":")
  if (parts.length !== 2) throw new Error("Formato de token corrompido")
  const [ivB64, encryptedB64] = parts

  const fromBase64 = (b64: string): Uint8Array => {
    const binary = atob(b64)
    const bytes = new Uint8Array(binary.length)
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
    return bytes
  }

  const iv = fromBase64(ivB64)
  const encrypted = fromBase64(encryptedB64)
  const decrypted = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv: iv as BufferSource },
    key,
    encrypted as BufferSource
  )
  return decoder.decode(decrypted)
}

// ============================================================================
// PDF GENERATION — MVP MINIMAL (1 página, layout simples).
// V1.9.300+ vai expandir pra layout completo espelhando HTML atual.
// ============================================================================
async function generateBasePdf(
  document: any,
  professional: any,
  patient: any,
  docType: 'prescription' | 'exam_request'
): Promise<PDFDocument> {
  const pdfDoc = await PDFDocument.create()
  const page = pdfDoc.addPage([595.28, 841.89]) // A4
  const { width, height } = page.getSize()

  const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold)
  const helvetica = await pdfDoc.embedFont(StandardFonts.Helvetica)
  const helveticaOblique = await pdfDoc.embedFont(StandardFonts.HelveticaOblique)

  // Paleta institucional MedCannLab
  const C_GREEN = rgb(0, 0.756, 0.416)      // #00C16A header/border
  const C_GREEN_BG = rgb(0.94, 0.99, 0.96)  // #f0fdf4 box assinatura
  const C_GRAY_BG = rgb(0.976, 0.976, 0.976) // #f9f9f9 box paciente
  const C_GRAY_BORDER = rgb(0.93, 0.93, 0.93) // #eee
  const C_TEXT = rgb(0.2, 0.2, 0.2)
  const C_TEXT_SOFT = rgb(0.4, 0.4, 0.4)
  const C_TEXT_DIM = rgb(0.6, 0.6, 0.6)
  const C_TEXT_MUTED = rgb(0.5, 0.5, 0.5)

  const MARGIN_X = 50
  const usableWidth = width - 2 * MARGIN_X

  // Helper: centralizar texto baseado na largura medida da fonte
  const drawCentered = (txt: string, y: number, font: any, size: number, color: any) => {
    const safe = sanitizePdfText(txt)
    if (!safe) return
    const w = font.widthOfTextAtSize(safe, size)
    page.drawText(safe, { x: (width - w) / 2, y, size, font, color })
  }

  // =====================================================
  // HEADER (top 130pt)
  // =====================================================
  let y = height - 60

  // "MEDCANNLAB" verde 28pt bold centralizado
  drawCentered('MEDCANNLAB', y, helveticaBold, 28, C_GREEN)
  y -= 28

  // Nome profissional — strip "Dr."/"Dra." duplicado, fallback "Profissional"
  const rawName = String(professional?.name || '').trim()
  const cleanedName = rawName.replace(/^(dra?\.?\s+)/i, '').trim()
  const looksLikeUsername = /^[a-z0-9_.-]+$/i.test(cleanedName) && !cleanedName.includes(' ')
  const displayName = (cleanedName && !looksLikeUsername)
    ? `Dr(a). ${cleanedName}`
    : 'Profissional'

  drawCentered(displayName, y, helveticaBold, 13, C_TEXT)
  y -= 18

  // CRM + especialidade
  const crmDisplay = professional?.council_state
    || professional?.council_number
    || professional?.crm
    || null
  const specialty = professional?.specialty || null
  if (crmDisplay || specialty) {
    const parts: string[] = []
    if (crmDisplay) parts.push(`CRM: ${crmDisplay}`)
    if (specialty) parts.push(String(specialty))
    drawCentered(parts.join(' • '), y, helvetica, 11, C_TEXT_SOFT)
    y -= 16
  }

  // Linha divisória verde 2px
  y -= 4
  page.drawLine({
    start: { x: MARGIN_X, y },
    end: { x: width - MARGIN_X, y },
    thickness: 2,
    color: C_GREEN
  })

  // =====================================================
  // TÍTULO
  // =====================================================
  y -= 38
  const isPrescription = docType === 'prescription'
  const prescriptionType = String(document.prescription_type || 'simple').toLowerCase()
  let title = 'RECEITUARIO MEDICO'
  if (!isPrescription) title = 'SOLICITACAO DE EXAMES'
  else if (prescriptionType === 'special') title = 'RECEITUARIO ESPECIAL'
  else if (prescriptionType === 'blue') title = 'RECEITUARIO AZUL'
  else if (prescriptionType === 'attestation') title = 'ATESTADO MEDICO'

  drawCentered(title, y, helveticaBold, 20, rgb(0, 0, 0))
  y -= 32

  // =====================================================
  // BOX PACIENTE (background cinza claro + borda)
  // =====================================================
  const patientBoxTop = y
  const patientBoxH = 70

  page.drawRectangle({
    x: MARGIN_X,
    y: patientBoxTop - patientBoxH,
    width: usableWidth,
    height: patientBoxH,
    color: C_GRAY_BG,
    borderColor: C_GRAY_BORDER,
    borderWidth: 1
  })

  // "PACIENTE" label
  page.drawText('PACIENTE', {
    x: MARGIN_X + 14,
    y: patientBoxTop - 18,
    size: 9,
    font: helveticaBold,
    color: C_TEXT_SOFT
  })

  // Nome paciente
  const patientName = patient?.name || document.patient_name || 'Paciente'
  page.drawText(sanitizePdfText(patientName), {
    x: MARGIN_X + 14,
    y: patientBoxTop - 38,
    size: 14,
    font: helveticaBold,
    color: rgb(0, 0, 0)
  })

  // CPF/email linha extra
  const extraInfo: string[] = []
  const patientCpf = patient?.cpf || document.patient_cpf
  const patientEmail = document.patient_email
  if (patientCpf) extraInfo.push(`CPF: ${patientCpf}`)
  if (patientEmail) extraInfo.push(`Email: ${patientEmail}`)
  if (extraInfo.length > 0) {
    page.drawText(sanitizePdfText(extraInfo.join(' • ')), {
      x: MARGIN_X + 14,
      y: patientBoxTop - 56,
      size: 10,
      font: helvetica,
      color: C_TEXT_SOFT
    })
  }

  y = patientBoxTop - patientBoxH - 28

  // =====================================================
  // CONTEÚDO (medicações OU pedido de exame)
  // =====================================================
  if (isPrescription && Array.isArray(document.medications)) {
    const meds = document.medications.slice(0, 8)
    let idx = 0
    for (const med of meds) {
      idx++
      if (y < 280) break // reserva 220pt pra assinatura + 60pt footer

      // Número à direita
      const numStr = `${idx}`
      const numW = helveticaBold.widthOfTextAtSize(numStr, 14)
      page.drawText(numStr, {
        x: width - MARGIN_X - numW - 5,
        y: y,
        size: 14,
        font: helveticaBold,
        color: rgb(0, 0, 0)
      })

      // Nome do medicamento
      const medName = String(med?.name || 'Medicamento').substring(0, 90)
      page.drawText(sanitizePdfText(medName), {
        x: MARGIN_X,
        y: y,
        size: 13,
        font: helveticaBold,
        color: rgb(0, 0, 0)
      })
      y -= 16

      // Dosagem + quantidade
      const dosageParts: string[] = []
      if (med?.dosage) dosageParts.push(String(med.dosage))
      if (med?.quantity) dosageParts.push(`${med.quantity} unidade(s)`)
      if (dosageParts.length > 0) {
        page.drawText(sanitizePdfText(dosageParts.join(' • ')), {
          x: MARGIN_X,
          y: y,
          size: 11,
          font: helvetica,
          color: C_TEXT
        })
        y -= 14
      }

      // Uso (frequência por duração)
      if (med?.frequency || med?.duration) {
        const usoStr = `Uso: ${med?.frequency || ''} por ${med?.duration || ''}`.trim()
        page.drawText(sanitizePdfText(usoStr), {
          x: MARGIN_X,
          y: y,
          size: 11,
          font: helvetica,
          color: C_TEXT
        })
        y -= 14
      }

      // Notas (se houver)
      if (med?.notes) {
        page.drawText(sanitizePdfText(`Obs: ${String(med.notes).substring(0, 120)}`), {
          x: MARGIN_X,
          y: y,
          size: 10,
          font: helveticaOblique,
          color: C_TEXT_DIM
        })
        y -= 14
      }

      // Linha divisória tracejada (simulada com pontos)
      y -= 6
      const dashCount = Math.floor(usableWidth / 6)
      for (let i = 0; i < dashCount; i++) {
        page.drawLine({
          start: { x: MARGIN_X + i * 6, y },
          end: { x: MARGIN_X + i * 6 + 3, y },
          thickness: 0.5,
          color: C_GRAY_BORDER
        })
      }
      y -= 14
    }
  } else if (!isPrescription && document.content) {
    const lines = String(document.content).split('\n').slice(0, 25)
    for (const line of lines) {
      if (y < 280) break
      page.drawText(sanitizePdfText(line.substring(0, 100)), {
        x: MARGIN_X,
        y: y,
        size: 11,
        font: helvetica,
        color: C_TEXT
      })
      y -= 16
    }
  }

  // =====================================================
  // BOX ASSINATURA DIGITAL (verde, fixo no rodapé inferior)
  // =====================================================
  const sigBoxTop = 240
  const sigBoxH = 150

  page.drawRectangle({
    x: MARGIN_X,
    y: sigBoxTop - sigBoxH,
    width: usableWidth,
    height: sigBoxH,
    color: C_GREEN_BG,
    borderColor: C_GREEN,
    borderWidth: 2
  })

  // Título "DOCUMENTO ASSINADO DIGITALMENTE"
  drawCentered('DOCUMENTO ASSINADO DIGITALMENTE', sigBoxTop - 22, helveticaBold, 13, C_GREEN)

  // Nome do profissional
  drawCentered(displayName, sigBoxTop - 42, helveticaBold, 12, C_TEXT)

  // Data da assinatura (M visível pro usuário)
  const sigTs = document.signature_timestamp
    ? new Date(document.signature_timestamp).toLocaleString('pt-BR')
    : new Date().toLocaleString('pt-BR')
  drawCentered(`Assinado em: ${sigTs}`, sigBoxTop - 60, helvetica, 10, C_TEXT_SOFT)

  // Linha tracejada divisória
  const sigDashY = sigBoxTop - 75
  const sigDashCount = Math.floor((usableWidth - 30) / 8)
  for (let i = 0; i < sigDashCount; i++) {
    page.drawLine({
      start: { x: MARGIN_X + 15 + i * 8, y: sigDashY },
      end: { x: MARGIN_X + 15 + i * 8 + 4, y: sigDashY },
      thickness: 0.5,
      color: C_GREEN
    })
  }

  // Bloco "Verificação Criptográfica ICP-Brasil"
  drawCentered('VERIFICACAO CRIPTOGRAFICA ICP-BRASIL', sigBoxTop - 92, helveticaBold, 10, C_GREEN)
  drawCentered('Hash PKCS#7 SHA-256 + AC DigitalSign + Lei 14.063/2020 + CFM 2.314/2022',
    sigBoxTop - 106, helvetica, 8, C_TEXT_SOFT)

  // Hash truncado
  const sigHashShort = document.digital_signature
    ? `${String(document.digital_signature).substring(0, 56)}...`
    : 'AGUARDANDO PROCESSAMENTO PKCS#7'
  drawCentered(sigHashShort, sigBoxTop - 124, helvetica, 7, C_TEXT_DIM)

  // Linha "Valide em validar.iti.gov.br"
  drawCentered('Valide em validar.iti.gov.br — assinatura embedded no PDF', sigBoxTop - 138, helvetica, 8, C_TEXT_MUTED)

  // =====================================================
  // FOOTER
  // =====================================================
  const today = new Date().toLocaleDateString('pt-BR')
  const time = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })

  drawCentered(
    `Emissao: ${today} as ${time} • MedCannLab Platform • ID: ${document.id}`,
    50, helvetica, 8, C_TEXT_MUTED
  )
  drawCentered(
    'Documento gerado eletronicamente — validade juridica garantida pela MP 2.200-2/2001',
    36, helveticaOblique, 7, C_TEXT_MUTED
  )

  return pdfDoc
}

// ============================================================================
// PLACEHOLDER INJECTION — adiciona AcroForm + /Sig dict no PDF
// Padrão ISO 32000-1 §12.8.1
// ============================================================================
function addSignaturePlaceholder(
  pdfDoc: PDFDocument,
  signerName: string,
  docType: 'prescription' | 'exam_request'
): void {
  const ctx = pdfDoc.context

  // /Reason factual sobre o ato clínico — NUNCA misturar marca da plataforma.
  // Adobe Acrobat exibe esse campo como "Motivo" nos detalhes da assinatura.
  // Validação institucional: signatário criptográfico = cert do profissional
  // (ex: e-CNPJ "Ricardo Valença Serviços de Saúde Ltda"), plataforma MedCannLab
  // é apenas infra (não co-signatária).
  const reasonText = docType === 'prescription'
    ? 'Prescricao medica'
    : 'Solicitacao de exames'

  // Criar /Sig dictionary com placeholders
  // ByteRange usa números grandes (10 dígitos cada) pra reservar espaço suficiente
  // pro real value (PDF pode ter centenas de MB → 9 dígitos cobre 1GB)
  const sigDict = ctx.obj({
    Type: 'Sig',
    Filter: 'Adobe.PPKLite',
    SubFilter: 'adbe.pkcs7.detached',
    ByteRange: [0, 9999999999, 9999999999, 9999999999],
    // Contents: hex placeholder (zeros) — vai ser sobrescrito com PKCS#7 hex
    Contents: PDFHexString.of('0'.repeat(SIGNATURE_PLACEHOLDER_HEX_LENGTH)),
    Reason: pdfTextString(reasonText),
    Name: pdfTextString(signerName),
    Location: pdfTextString('Brasil'),
    M: PDFString.of(formatPdfDate(new Date()))
  })

  const sigRef = ctx.register(sigDict)

  // Criar signature widget annotation (invisível, página 1)
  const page = pdfDoc.getPage(0)
  const widgetDict = ctx.obj({
    Type: 'Annot',
    Subtype: 'Widget',
    FT: 'Sig',
    Rect: [0, 0, 0, 0], // invisível
    V: sigRef,
    T: PDFString.of('Signature1'),
    F: 4, // print flag
    P: page.ref
  })

  const widgetRef = ctx.register(widgetDict)

  // Adicionar widget aos Annots da página
  const annotsKey = PDFName.of('Annots')
  let annots = page.node.get(annotsKey)
  if (!annots) {
    annots = ctx.obj([])
    page.node.set(annotsKey, annots)
  }
  if (annots instanceof PDFArray) {
    annots.push(widgetRef)
  }

  // AcroForm no catalog
  const catalog = pdfDoc.catalog
  const acroFormDict = ctx.obj({
    SigFlags: 3, // bit 1 = SignaturesExist, bit 2 = AppendOnly
    Fields: [widgetRef]
  })
  catalog.set(PDFName.of('AcroForm'), acroFormDict)
}

// Helper: encode string como PDFHexString UTF-16BE com BOM (FE FF).
// PDFString.of() usa Latin-1 nativo → quebra acentos (ç, ã, é...).
// PDF spec §7.9.2.2 permite UTF-16BE quando prefixado por BOM.
function pdfTextString(s: string): PDFHexString {
  const utf16Bytes: number[] = [0xFE, 0xFF] // BOM
  for (const ch of s) {
    const code = ch.codePointAt(0) || 0
    if (code <= 0xFFFF) {
      utf16Bytes.push((code >> 8) & 0xFF, code & 0xFF)
    } else {
      // Surrogate pair pra code points > BMP
      const adj = code - 0x10000
      const high = 0xD800 + (adj >> 10)
      const low = 0xDC00 + (adj & 0x3FF)
      utf16Bytes.push((high >> 8) & 0xFF, high & 0xFF, (low >> 8) & 0xFF, low & 0xFF)
    }
  }
  let hex = ''
  for (const b of utf16Bytes) hex += b.toString(16).padStart(2, '0').toUpperCase()
  return PDFHexString.of(hex)
}

// PDF date format: D:YYYYMMDDHHmmSS+HH'mm'
function formatPdfDate(date: Date): string {
  const pad = (n: number, w = 2) => String(n).padStart(w, '0')
  const Y = date.getUTCFullYear()
  const M = pad(date.getUTCMonth() + 1)
  const D = pad(date.getUTCDate())
  const h = pad(date.getUTCHours())
  const m = pad(date.getUTCMinutes())
  const s = pad(date.getUTCSeconds())
  return `D:${Y}${M}${D}${h}${m}${s}Z`
}

// ============================================================================
// BYTE-LEVEL SIGNATURE INJECTION
// 1. Salva PDF com placeholders
// 2. Localiza /ByteRange e /Contents nos bytes
// 3. Calcula ByteRange real
// 4. Substitui /ByteRange placeholder
// 5. Extrai bytes excl /Contents
// 6. Assina via PKCS#7 detached com node-forge
// 7. Substitui /Contents placeholder pelo PKCS#7 hex
// ============================================================================
async function signPdfBytes(
  pdfDoc: PDFDocument,
  pfxBytes: Uint8Array,
  password: string
): Promise<Uint8Array> {
  // 1. Salvar PDF (sem object streams, pra ByteRange ficar legível em bytes)
  const pdfBytes = await pdfDoc.save({ useObjectStreams: false })

  // 2. Localizar placeholders nos bytes
  const pdfStr = bytesToLatin1(pdfBytes)

  // Encontrar /ByteRange [...] (placeholder = "0 9999999999 9999999999 9999999999")
  const byteRangeRegex = /\/ByteRange\s*\[\s*0\s+9999999999\s+9999999999\s+9999999999\s*\]/
  const byteRangeMatch = byteRangeRegex.exec(pdfStr)
  if (!byteRangeMatch) {
    throw new Error('Placeholder /ByteRange não encontrado no PDF gerado')
  }

  // Encontrar /Contents <...> (placeholder = string de zeros)
  const contentsRegex = /\/Contents\s*<([0]+)>/
  const contentsMatch = contentsRegex.exec(pdfStr)
  if (!contentsMatch) {
    throw new Error('Placeholder /Contents não encontrado no PDF gerado')
  }

  const contentsStart = contentsMatch.index + contentsMatch[0].indexOf('<')
  const contentsEnd = contentsMatch.index + contentsMatch[0].lastIndexOf('>') + 1
  const placeholderHexLength = contentsMatch[1].length

  // 3. Calcular ByteRange real
  // ByteRange = [0, contentsStart+1, contentsEnd-1, fileSize - (contentsEnd-1)]
  // Inclui tudo EXCETO os bytes hex internos ao <...>
  const byteRangeStart1 = 0
  const byteRangeLength1 = contentsStart + 1 // até e incluindo '<'
  const byteRangeStart2 = contentsEnd - 1   // a partir de '>'
  const byteRangeLength2 = pdfBytes.length - byteRangeStart2

  // 4. Substituir placeholder /ByteRange pelo real (mesma largura via padding)
  const newByteRangeStr = `/ByteRange [${byteRangeStart1} ${byteRangeLength1} ${byteRangeStart2} ${byteRangeLength2}]`
  const originalLength = byteRangeMatch[0].length
  let paddedByteRange = newByteRangeStr
  if (paddedByteRange.length < originalLength) {
    paddedByteRange = paddedByteRange + ' '.repeat(originalLength - paddedByteRange.length)
  }
  if (paddedByteRange.length !== originalLength) {
    throw new Error(`ByteRange real (${paddedByteRange.length}) > placeholder (${originalLength}) — aumentar padding`)
  }

  // Reconstruir PDF bytes com novo ByteRange
  const pdfBytesMut = new Uint8Array(pdfBytes)
  const encoder = new TextEncoder()
  const paddedByteRangeBytes = encoder.encode(paddedByteRange)
  for (let i = 0; i < paddedByteRangeBytes.length; i++) {
    pdfBytesMut[byteRangeMatch.index + i] = paddedByteRangeBytes[i]
  }

  // 5. Extrair bytes pra assinar (excl região do /Contents hex)
  const part1 = pdfBytesMut.slice(byteRangeStart1, byteRangeStart1 + byteRangeLength1)
  const part2 = pdfBytesMut.slice(byteRangeStart2, byteRangeStart2 + byteRangeLength2)

  const bytesToSign = new Uint8Array(part1.length + part2.length)
  bytesToSign.set(part1, 0)
  bytesToSign.set(part2, part1.length)

  // 6. PKCS#7 detached signature com node-forge usando cert .pfx
  // 6a. Parse PKCS#12
  let pfxBinaryStr = ''
  for (let i = 0; i < pfxBytes.length; i++) pfxBinaryStr += String.fromCharCode(pfxBytes[i])
  const p12Asn1 = forge.asn1.fromDer(pfxBinaryStr)
  const p12 = forge.pkcs12.pkcs12FromAsn1(p12Asn1, password)

  const keyBags = p12.getBags({ bagType: forge.pki.oids.pkcs8ShroudedKeyBag })
  const certBags = p12.getBags({ bagType: forge.pki.oids.certBag })
  const privateKey = keyBags[forge.pki.oids.pkcs8ShroudedKeyBag]?.[0]?.key
  const allCerts = (certBags[forge.pki.oids.certBag] || [])
    .map((b: any) => b.cert)
    .filter(Boolean)

  if (!privateKey) throw new Error('PKCS#12 sem private key')
  if (allCerts.length === 0) throw new Error('PKCS#12 sem cert')

  // V1.9.299 fix #2 (GPT review): detectar leaf via match publicKey ↔ privateKey.
  // PKCS#12 NÃO garante ordem dos certBags — leaf pode estar em qualquer índice.
  // Confundir cert intermediário com leaf → PKCS#7 assinado com cert errado → inválido.
  // RSA modulus (n) é o identificador único da chave; bate entre privateKey e leaf cert.
  const leafCert = allCerts.find((c: any) => {
    try {
      return c.publicKey?.n && privateKey?.n && c.publicKey.n.equals(privateKey.n)
    } catch {
      return false
    }
  })
  if (!leafCert) throw new Error('Leaf cert (que casa com a private key) não encontrado no .pfx')
  const cert = leafCert

  // 6b. Construir PKCS#7 SignedData ATTACHED em bytes (NÃO em hex hash)
  // ICP-Brasil PDF signature: SubFilter adbe.pkcs7.detached
  // = PKCS#7 contém os signed attributes (digest dos bytes), NÃO o conteúdo inteiro
  const p7 = forge.pkcs7.createSignedData()
  // Content = bytes do PDF a assinar (forge calcula digest internamente)
  let bytesToSignBinary = ''
  for (let i = 0; i < bytesToSign.length; i++) bytesToSignBinary += String.fromCharCode(bytesToSign[i])
  p7.content = forge.util.createBuffer(bytesToSignBinary, 'binary')

  // V1.9.299 fix chain: adicionar TODOS os certs do .pfx (leaf + intermediários)
  // pra validador externo (ITI/Adobe) conseguir construir cadeia até a raiz ICP-Brasil.
  // Sem isso: validador acha o cert do médico mas não consegue subir cadeia → rejeita.
  console.log(`🔗 Certs no .pfx do médico: ${allCerts.length}`)
  for (const c of allCerts) {
    p7.addCertificate(c)
  }

  // V1.9.299 — FAIL-SAFE: embeddar intermediários ICP-Brasil (AC DigitalSign RFB G3
  // + AC SRF v4) hardcoded. Resolve caso .pfx do médico não ter chain embedded.
  // GPT review #3: Raiz Brasileira REMOVIDA do array (trust anchor já no validador,
  // embeddar = warning Adobe + bytes desperdiçados no PKCS#7).
  // GPT review #1: dedup via serialNumber + DN attribute string (subject.hash do
  // node-forge não é canonicalizado, varia ordem RDN). Comparar attributes serializados.
  const dnString = (cert: any): string =>
    (cert.subject?.attributes || [])
      .map((a: any) => `${a.shortName || a.name}=${a.value}`)
      .sort()
      .join(',')

  let chainAdded = 0
  for (const pemStr of ICP_BRASIL_CHAIN_PEMS) {
    try {
      const chainCert = forge.pki.certificateFromPem(pemStr)
      const chainDn = dnString(chainCert)
      const alreadyPresent = allCerts.some((c: any) =>
        c.serialNumber === chainCert.serialNumber && dnString(c) === chainDn
      )
      if (!alreadyPresent) {
        p7.addCertificate(chainCert)
        chainAdded++
      }
    } catch (e: any) {
      console.warn(`⚠️ Falha ao adicionar cert da chain ICP-Brasil: ${e?.message}`)
    }
  }
  console.log(`🔗 Cadeia ICP-Brasil embedded: +${chainAdded} cert(s) intermediários (total PKCS#7: ${allCerts.length + chainAdded})`)
  // V1.9.299 — PBAD/PAdES compliance: signing-certificate-v2 (RFC 5035)
  // OID 1.2.840.113549.1.9.16.2.47 — obrigatório pra ITI reconhecer como PBAD AD-RB.
  //
  // BUG forge.pkcs7 v1.3.1: addSigner só serializa attribute values pra tipos
  // hardcoded (contentType, messageDigest, signingTime). Custom OIDs viram SET
  // <EMPTY> silenciosamente. Solução: post-processing ASN.1 manual após p7.toAsn1()
  // + re-assinar (porque modificar signedAttributes muda hash que RSA assina).
  //
  // Estrutura ASN.1 (RFC 5035 §3):
  //   SigningCertificateV2 ::= SEQUENCE {
  //     certs    SEQUENCE OF ESSCertIDv2,
  //     policies SEQUENCE OF PolicyInformation OPTIONAL
  //   }
  //   ESSCertIDv2 ::= SEQUENCE {
  //     hashAlgorithm AlgorithmIdentifier DEFAULT {algorithm id-sha256},
  //     certHash      OCTET STRING,
  //     issuerSerial  IssuerSerial OPTIONAL
  //   }
  const leafCertDer = forge.asn1.toDer(forge.pki.certificateToAsn1(cert)).getBytes()
  const leafCertHashMd = forge.md.sha256.create()
  leafCertHashMd.update(leafCertDer)
  const leafCertHashBytes = leafCertHashMd.digest().getBytes()

  console.log(`🇧🇷 PBAD AD-RB: cert hash SHA-256 do leaf: ${leafCertHashMd.digest().toHex().substring(0, 16)}...`)

  p7.addSigner({
    key: privateKey,
    certificate: cert,
    digestAlgorithm: forge.pki.oids.sha256,
    authenticatedAttributes: [
      { type: forge.pki.oids.contentType, value: forge.pki.oids.data },
      { type: forge.pki.oids.messageDigest },
      { type: forge.pki.oids.signingTime, value: new Date() }
      // signing-certificate-v2 injetado MANUALMENTE pós-build (forge não suporta)
    ]
  })

  // Sign primeiro (forge calcula messageDigest + RSA sign de contentType+messageDigest+signingTime)
  p7.sign({ detached: true })

  // POST-PROCESSING: injetar signing-certificate-v2 NO ASN.1 + re-assinar
  // 1. Construir ASN.1 do attribute
  const essCertIDv2 = forge.asn1.create(
    forge.asn1.Class.UNIVERSAL,
    forge.asn1.Type.SEQUENCE,
    true,
    [
      forge.asn1.create(
        forge.asn1.Class.UNIVERSAL,
        forge.asn1.Type.OCTETSTRING,
        false,
        leafCertHashBytes
      )
    ]
  )
  const certsSeqOf = forge.asn1.create(
    forge.asn1.Class.UNIVERSAL,
    forge.asn1.Type.SEQUENCE,
    true,
    [essCertIDv2]
  )
  const signingCertV2Value = forge.asn1.create(
    forge.asn1.Class.UNIVERSAL,
    forge.asn1.Type.SEQUENCE,
    true,
    [certsSeqOf]
  )
  // Attribute completo: SEQUENCE [OID, SET [value]]
  const signingCertV2Attr = forge.asn1.create(
    forge.asn1.Class.UNIVERSAL,
    forge.asn1.Type.SEQUENCE,
    true,
    [
      forge.asn1.create(
        forge.asn1.Class.UNIVERSAL,
        forge.asn1.Type.OID,
        false,
        forge.asn1.oidToDer('1.2.840.113549.1.9.16.2.47').getBytes()
      ),
      forge.asn1.create(
        forge.asn1.Class.UNIVERSAL,
        forge.asn1.Type.SET,
        true,
        [signingCertV2Value]
      )
    ]
  )

  // 2. Injetar no SignerInfo.authenticatedAttributes
  // PKCS#7 structure: SignedData → signerInfos SET → SignerInfo SEQUENCE
  // SignerInfo: [version, sid, digestAlg, [0] authAttrs, sigAlg, signature, ...]
  const p7Asn1Tree = p7.toAsn1()
  // p7Asn1Tree = SEQUENCE [OID, [0] SignedData]
  const signedData = p7Asn1Tree.value[1].value[0] // SignedData SEQUENCE
  // SignedData: [version, digestAlgs, encapContentInfo, certificates, signerInfos]
  const signerInfos = signedData.value[signedData.value.length - 1] // SET
  const signerInfo = signerInfos.value[0] // SEQUENCE
  // SignerInfo: [version, sid, digestAlg, [0] authenticatedAttributes, ...]
  // authenticatedAttributes é [0] IMPLICIT SET → index 3
  const authAttrs = signerInfo.value[3]
  if (!authAttrs || authAttrs.type !== 0) {
    throw new Error('authenticatedAttributes [0] não encontrado no SignerInfo')
  }
  // Adicionar o novo attribute
  authAttrs.value.push(signingCertV2Attr)

  // 3. RE-ASSINAR: hash dos authenticatedAttributes mudou, RSA precisa recalcular
  // Construir SET (não [0] IMPLICIT) pra calcular hash (RFC 5652 §5.4)
  const authAttrsForHash = forge.asn1.create(
    forge.asn1.Class.UNIVERSAL,
    forge.asn1.Type.SET,
    true,
    authAttrs.value
  )
  const attrsDer = forge.asn1.toDer(authAttrsForHash).getBytes()
  const md = forge.md.sha256.create()
  md.update(attrsDer)
  // RSA sign do hash
  const newSignature = (privateKey as any).sign(md)

  // Substituir signature no SignerInfo
  // SignerInfo: [version, sid, digestAlg, [0] authAttrs, sigAlg, signature, ...]
  // signature está em index 5 (OCTET STRING)
  signerInfo.value[5] = forge.asn1.create(
    forge.asn1.Class.UNIVERSAL,
    forge.asn1.Type.OCTETSTRING,
    false,
    newSignature
  )

  // 4. Re-atualizar messageDigest no novo attribute set NÃO É necessário —
  // o messageDigest do conteúdo (bytes do PDF) NÃO mudou, só estamos adicionando
  // novo attribute paralelo. messageDigest continua válido.

  console.log(`🇧🇷 PBAD AD-RB: signing-certificate-v2 injetado + RSA re-signed`)

  // CRÍTICO: usar p7Asn1Tree MODIFICADO (não chamar p7.toAsn1() de novo, que
  // reconstroi a partir do state interno do forge e perde nossa injeção).
  const p7Der = forge.asn1.toDer(p7Asn1Tree).getBytes()

  // 7. Converter PKCS#7 DER pra hex maiúsculo
  let p7Hex = ''
  for (let i = 0; i < p7Der.length; i++) {
    p7Hex += p7Der.charCodeAt(i).toString(16).padStart(2, '0').toUpperCase()
  }

  // Padding com zeros pra fechar placeholder exatamente
  if (p7Hex.length > placeholderHexLength) {
    throw new Error(`PKCS#7 hex (${p7Hex.length}) maior que placeholder (${placeholderHexLength}) — aumentar SIGNATURE_PLACEHOLDER_HEX_LENGTH`)
  }
  p7Hex = p7Hex + '0'.repeat(placeholderHexLength - p7Hex.length)

  // 8. Substituir bytes do placeholder /Contents <0...0> pelo PKCS#7 hex
  // Posição: contentsStart+1 (depois do '<')
  const p7HexBytes = encoder.encode(p7Hex)
  for (let i = 0; i < p7HexBytes.length; i++) {
    pdfBytesMut[contentsStart + 1 + i] = p7HexBytes[i]
  }

  return pdfBytesMut
}

// Helpers
// V1.9.299 fix #5 (GPT review): TextDecoder('latin1') é nativo, sem risco de
// stack overflow em PDFs grandes (String.fromCharCode.apply chunked podia explodir
// em arquivos > 2MB). Mantém o mesmo semântico: 1 byte = 1 char (0-255).
function bytesToLatin1(bytes: Uint8Array): string {
  return new TextDecoder('latin1').decode(bytes)
}

// V1.9.299 fix #6 (GPT review, refinado): pdf-lib StandardFonts (Helvetica) usa
// WinAnsiEncoding por padrão — que SUPORTA acentos PT-BR completos (ç, ã, é, ê,
// ó etc., todos os bytes 0x80-0xFF do Latin-1).
//
// NÃO faz strip de acentos. Preserva ortografia correta do português (essencial
// pro contexto médico-legal: "Rêgo Valença", "prescrição", "RECEITUÁRIO").
//
// Strip APENAS o que pdf-lib + WinAnsi não conseguem renderizar:
//  - Surrogate pairs (emoji 😀, símbolos > U+FFFF)
//  - Caracteres > 0xFF que não existem em WinAnsi
//  - Caracteres de controle
//  - Smart quotes (substituídos por ASCII)
function sanitizePdfText(s: string): string {
  if (!s) return ''
  return String(s)
    .replace(/[‘’‚‛]/g, "'") // smart single quotes → '
    .replace(/[“”„‟]/g, '"') // smart double quotes → "
    .replace(/[–—]/g, '-')             // en/em dash → -
    .replace(/[…]/g, '...')                 // ellipsis → ...
    .replace(/[\uD800-\uDBFF][\uDC00-\uDFFF]/g, '') // surrogate pairs (emoji)
    .replace(/[\x00-\x1F\x7F]/g, '')              // control chars
    .split('')
    .filter(c => c.charCodeAt(0) <= 0xFF) // só Latin-1 (WinAnsi)
    .join('')
    .substring(0, 200)
    .trim()
}

// ============================================================================
// MAIN HANDLER
// ============================================================================
Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Variáveis de ambiente ausentes')
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    const body: SignPdfRequest = await req.json()
    const { documentId } = body
    const documentType: 'prescription' | 'exam_request' = body.documentType || 'prescription'

    if (!documentId) {
      return new Response(JSON.stringify({ success: false, error: 'documentId obrigatório' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    if (!['prescription', 'exam_request'].includes(documentType)) {
      return new Response(JSON.stringify({ success: false, error: 'documentType inválido' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // 1. Buscar documento
    const tableName = TABLE_BY_DOC_TYPE[documentType]
    const { data: document, error: docError } = await supabase
      .from(tableName)
      .select('*')
      .eq('id', documentId)
      .single()

    if (docError || !document) {
      return new Response(JSON.stringify({ success: false, error: 'Documento não encontrado' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    if (document.status !== 'signed' && document.status !== 'sent') {
      return new Response(JSON.stringify({
        success: false,
        error: 'Documento precisa estar com status signed/sent (assinado via digital-signature primeiro)'
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    if (document.signed_pdf_url) {
      return new Response(JSON.stringify({
        success: true,
        signed_pdf_url: document.signed_pdf_url,
        mode: 'already_signed'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // 2. Buscar profissional + cert + paciente
    const professionalId = document.professional_id
    const { data: professional } = await supabase
      .from('users')
      .select('id, name, crm, council_number, council_state, council_type')
      .eq('id', professionalId)
      .single()

    const { data: certificate } = await supabase
      .from('medical_certificates')
      .select('*')
      .eq('professional_id', professionalId)
      .eq('is_active', true)
      .gt('expires_at', new Date().toISOString())
      .order('expires_at', { ascending: false })
      .limit(1)
      .single()

    if (!certificate?.certificate_file_path || !certificate?.encrypted_password) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Certificado ICP-Brasil ausente (precisa .pfx + senha)'
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    let patient: any = null
    if (document.patient_id) {
      const { data: pat } = await supabase
        .from('users')
        .select('id, name, cpf')
        .eq('id', document.patient_id)
        .single()
      patient = pat
    }

    // 3. Download .pfx
    const { data: pfxBlob, error: pfxError } = await supabase
      .storage
      .from('certificates')
      .download(certificate.certificate_file_path)

    if (pfxError || !pfxBlob) {
      throw new Error(`Falha ao baixar .pfx: ${pfxError?.message || 'sem dados'}`)
    }

    const pfxBuffer = await pfxBlob.arrayBuffer()
    const pfxBytes = new Uint8Array(pfxBuffer)

    // 4. Decrypt senha
    const password = await decryptPassword(certificate.encrypted_password)
    if (!password) throw new Error('Senha decifrada vazia')

    // 5. Gerar PDF base
    const pdfDoc = await generateBasePdf(document, professional, patient, documentType)

    // 6. Adicionar placeholder /Sig
    addSignaturePlaceholder(pdfDoc, professional?.name || 'Profissional MedCannLab', documentType)

    // 7. Assinar (byte-level injection)
    const signedPdfBytes = await signPdfBytes(pdfDoc, pfxBytes, password)
    console.log(`🔐 PDF assinado: ${signedPdfBytes.length} bytes`)

    // 8. Upload pra Storage
    const storagePath = `${STORAGE_PATH_BY_DOC_TYPE[documentType]}/${documentId}.pdf`
    const { error: uploadError } = await supabase
      .storage
      .from('signed_documents')
      .upload(storagePath, signedPdfBytes, {
        contentType: 'application/pdf',
        upsert: true
      })

    if (uploadError) {
      throw new Error(`Falha no upload: ${uploadError.message}`)
    }

    // 9. Update tabela
    const { error: updateError } = await supabase
      .from(tableName)
      .update({ signed_pdf_url: storagePath })
      .eq('id', documentId)

    if (updateError) {
      throw new Error(`Falha ao atualizar signed_pdf_url: ${updateError.message}`)
    }

    return new Response(JSON.stringify({
      success: true,
      signed_pdf_url: storagePath,
      mode: 'icp_real_embedded_manual',
      pdfSizeBytes: signedPdfBytes.length
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (error: any) {
    console.error('❌ [sign-pdf-icp] Erro:', error?.message, error?.stack)
    return new Response(JSON.stringify({
      success: false,
      error: error?.message || 'Erro desconhecido',
      stack: error?.stack?.split('\n').slice(0, 8).join('\n')
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})
