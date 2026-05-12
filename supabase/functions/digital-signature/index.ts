// =====================================================
// 🔐 EDGE FUNCTION: ASSINATURA DIGITAL MÉDICA ICP-BRASIL
// =====================================================
// Sistema de assinatura digital conforme CFM/ITI
// Arquitetura: COS v5.0 + TradeVision Core
// Data: 05/02/2026
// V1.9.176 (06/05/2026): dual-mode REAL (PKCS#12 + PKCS#7 via node-forge) ↔ simulação fallback

import { createClient } from "https://esm.sh/@supabase/supabase-js@2"
import forge from "https://esm.sh/node-forge@1.3.1"
import { decrypt as decryptPassword } from "../_shared/crypto.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface SignatureRequest {
  documentId: string
  documentLevel: 'level_1' | 'level_2' | 'level_3'
  professionalId: string
  userConfirmed?: boolean // Confirmação explícita do usuário
  // V1.9.231 — Tipo de doc pra rotear table (default 'prescription' = backward-compat).
  // 'exam_request' adiciona patient_exam_requests no fluxo PKCS#7 ICP-Brasil.
  documentType?: 'prescription' | 'exam_request'
}

// V1.9.231 — Map doc_type → table. Centraliza acoplamento ao banco em 1 lugar.
const TABLE_BY_DOC_TYPE: Record<'prescription' | 'exam_request', string> = {
  prescription: 'cfm_prescriptions',
  exam_request: 'patient_exam_requests'
}

interface SignatureResponse {
  success: boolean
  signature?: string
  validationUrl?: string
  itiValidationCode?: string
  error?: string
  requiresRenewal?: boolean
}

/**
 * Busca certificado ativo do profissional
 */
async function resolveCertificate(
  supabase: any,
  professionalId: string
): Promise<any> {
  const { data, error } = await supabase
    .from('medical_certificates')
    .select('*')
    .eq('professional_id', professionalId)
    .eq('is_active', true)
    .gt('expires_at', new Date().toISOString())
    .order('expires_at', { ascending: false })
    .limit(1)
    .single()

  if (error || !data) {
    return null
  }

  return data
}

/**
 * Prepara hash SHA-256 do documento
 * V1.9.231 — Aceita documentType pra serializar fields corretos por tipo.
 * Prescription mantem fields anteriores (backward-compat). Exam_request usa
 * patient_id + content (schema simples).
 */
async function prepareDocumentHash(
  document: any,
  documentType: 'prescription' | 'exam_request' = 'prescription'
): Promise<string> {
  // Serializar documento (em produção, usar PDF real)
  let documentContent: string

  if (documentType === 'exam_request') {
    documentContent = JSON.stringify({
      id: document.id,
      patient_id: document.patient_id,
      professional_id: document.professional_id,
      content: document.content,
      created_at: document.created_at
    })
  } else {
    // prescription (default — backward-compat)
    documentContent = JSON.stringify({
      id: document.id,
      prescription_type: document.prescription_type,
      patient_name: document.patient_name,
      patient_cpf: document.patient_cpf,
      professional_name: document.professional_name,
      professional_crm: document.professional_crm,
      medications: document.medications,
      notes: document.notes,
      created_at: document.created_at
    })
  }

  // Calcular hash SHA-256
  const encoder = new TextEncoder()
  const data = encoder.encode(documentContent)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('')

  return hashHex
}

/**
 * Cria snapshot imutável do documento
 */
async function createSnapshot(
  supabase: any,
  documentId: string,
  versionHash: string
): Promise<void> {
  await supabase.from('document_snapshots').insert({
    document_id: documentId,
    version_hash: versionHash,
    is_final: true,
    snapshot_data: {
      timestamp: new Date().toISOString(),
      note: 'Snapshot criado antes da assinatura digital'
    }
  })
}

/**
 * V1.9.176 — Assinatura REAL via cert .pfx (PKCS#12) + PKCS#7 SignedData.
 *
 * Pré-condições:
 *  - certificate.certificate_file_path: path do .pfx no bucket 'certificates'
 *  - certificate.encrypted_password: senha cifrada via _shared/crypto.ts (AES-GCM)
 *  - ENCRYPTION_KEY env var setada
 *
 * Fluxo:
 *  1. Download .pfx do Storage privado
 *  2. Decrypt senha do banco
 *  3. Parse PKCS#12 via node-forge → extrai privateKey + cert + chain
 *  4. Constrói PKCS#7 SignedData (CMS, RFC 3852) com hash do documento
 *  5. Retorna assinatura base64 + chain + validationCode estável (hash do PKCS#7)
 *
 * Em qualquer erro: lança exception (caller decide fallback).
 */
async function signWithRealCertificate(
  supabase: any,
  certificate: any,
  documentHash: string
): Promise<{ signature: string; certInfo: any; validationCode: string; validationUrl: string }> {
  // 1. Validações de pré-condição
  if (!certificate.certificate_file_path || !certificate.encrypted_password) {
    throw new Error('Cert sem file_path ou encrypted_password — modo real não disponível')
  }

  // 2. Download do .pfx
  const { data: fileBlob, error: dlError } = await supabase
    .storage
    .from('certificates')
    .download(certificate.certificate_file_path)

  if (dlError || !fileBlob) {
    throw new Error(`Falha ao baixar .pfx do Storage: ${dlError?.message || 'sem dados'}`)
  }

  const pfxBuffer = await fileBlob.arrayBuffer()
  const pfxBytes = new Uint8Array(pfxBuffer)

  // 3. Decrypt senha
  const password = await decryptPassword(certificate.encrypted_password)
  if (!password) throw new Error('Senha decifrada vazia')

  // 4. Parse PKCS#12 via node-forge
  // node-forge espera binary string (1 byte por char), converter de Uint8Array
  let binaryStr = ''
  for (let i = 0; i < pfxBytes.length; i++) binaryStr += String.fromCharCode(pfxBytes[i])

  const p12Asn1 = forge.asn1.fromDer(binaryStr)
  const p12 = forge.pkcs12.pkcs12FromAsn1(p12Asn1, password)

  // 5. Extrair private key + cert
  // PKCS#12 tem múltiplos safeBags; queremos pkcs8ShroudedKeyBag (private) + certBag
  const keyBags = p12.getBags({ bagType: forge.pki.oids.pkcs8ShroudedKeyBag })
  const certBags = p12.getBags({ bagType: forge.pki.oids.certBag })

  const privateKeyBag = keyBags[forge.pki.oids.pkcs8ShroudedKeyBag]?.[0]
  const certBag = certBags[forge.pki.oids.certBag]?.[0]

  if (!privateKeyBag?.key) throw new Error('Private key não encontrada no .pfx')
  if (!certBag?.cert) throw new Error('Certificado não encontrado no .pfx')

  const privateKey = privateKeyBag.key
  const cert = certBag.cert

  // 6. Construir PKCS#7 SignedData (CMS, RFC 3852)
  // documentHash já é SHA-256 hex; precisamos do conteúdo a assinar (binary)
  // Para CMS attached: documento inteiro vai dentro. Para detached: só hash.
  // Usamos detached (padrão ICP-Brasil pra prescrições) — só envelopa o hash.
  const p7 = forge.pkcs7.createSignedData()
  p7.content = forge.util.createBuffer(documentHash, 'utf8') // hash hex como string
  p7.addCertificate(cert)
  p7.addSigner({
    key: privateKey,
    certificate: cert,
    digestAlgorithm: forge.pki.oids.sha256,
    authenticatedAttributes: [
      { type: forge.pki.oids.contentType, value: forge.pki.oids.data },
      { type: forge.pki.oids.messageDigest /* auto */ },
      { type: forge.pki.oids.signingTime, value: new Date() }
    ]
  })

  p7.sign({ detached: true })

  // 7. Serializar PKCS#7 → DER → base64
  const p7Asn1 = p7.toAsn1()
  const p7Der = forge.asn1.toDer(p7Asn1).getBytes()
  let p7Base64 = ''
  // btoa é seguro pra binary string em Deno
  p7Base64 = btoa(p7Der)

  // 8. validationCode: derivar do hash do PKCS#7 (estável e auditável)
  const p7Hash = forge.md.sha256.create()
  p7Hash.update(p7Der)
  const p7HashHex = p7Hash.digest().toHex()
  const validationCode = `ITI-${p7HashHex.substring(0, 16).toUpperCase()}`
  const validationUrl = `https://www.gov.br/iti/pt-br/validacao?codigo=${validationCode}`

  // 9. Cert info pra auditoria
  const certInfo = {
    subject: cert.subject.attributes.map((a: any) => `${a.shortName}=${a.value}`).join(','),
    issuer: cert.issuer.attributes.map((a: any) => `${a.shortName}=${a.value}`).join(','),
    serialNumber: cert.serialNumber,
    validFrom: cert.validity.notBefore.toISOString(),
    validTo: cert.validity.notAfter.toISOString(),
    signatureAlgorithm: 'SHA256withRSA'
  }

  console.log('🔐 [REAL] Assinatura PKCS#7 gerada — subject:', certInfo.subject.substring(0, 80))

  return { signature: p7Base64, certInfo, validationCode, validationUrl }
}

/**
 * Chama AC: prioridade REAL (PKCS#12 .pfx) → API stub (Soluti/Certisign) → simulação.
 */
async function callACProvider(
  supabase: any,
  certificate: any,
  documentHash: string
): Promise<{ signature: string; validationUrl: string; validationCode: string; mode: 'real' | 'api_stub' | 'simulation' }> {
  // V1.9.176 — Modo REAL via .pfx upload (preferencial pra ICP-Brasil)
  if (certificate.certificate_file_path && certificate.encrypted_password) {
    try {
      const real = await signWithRealCertificate(supabase, certificate, documentHash)
      return {
        signature: real.signature,
        validationUrl: real.validationUrl,
        validationCode: real.validationCode,
        mode: 'real'
      }
    } catch (err: any) {
      console.error('❌ [REAL] Falha ao assinar com .pfx, NÃO caindo em simulação:', err?.message)
      // Em produção real, NÃO cair em simulação — lançar erro pra usuário
      throw new Error(`Erro ao assinar com certificado real: ${err?.message || err}`)
    }
  }

  // Tentar usar integração real se variáveis de ambiente estiverem configuradas
  const acProviderName = Deno.env.get('AC_PROVIDER')
  const acApiKey = Deno.env.get('AC_API_KEY')
  const acApiUrl = Deno.env.get('AC_API_URL')
  const acEnvironment = (Deno.env.get('AC_ENVIRONMENT') || 'sandbox') as 'production' | 'sandbox'

  // Se AC estiver configurada, usar integração real
  if (acProviderName && acApiKey && acApiUrl) {
    try {
      // Importar módulo de integração (seria necessário adaptar para Deno)
      // Por enquanto, vamos usar a lógica inline baseada no provider
      
      if (acProviderName === 'Soluti') {
        // TODO: Implementar chamada real à API Soluti
        // const response = await fetch(`${acApiUrl}/signatures/sign`, {
        //   method: 'POST',
        //   headers: {
        //     'Authorization': `Bearer ${acApiKey}`,
        //     'Content-Type': 'application/json'
        //   },
        //   body: JSON.stringify({
        //     documentHash,
        //     certificateThumbprint: certificate.certificate_thumbprint
        //   })
        // })
        // const data = await response.json()
        // return {
        //   signature: data.signature,
        //   validationUrl: data.validationUrl,
        //   validationCode: data.validationCode
        // }
        
        console.log('🔐 [Soluti] Assinando documento (modo produção):', documentHash.substring(0, 16))
      } else if (acProviderName === 'Certisign') {
        // TODO: Implementar chamada real à API Certisign
        // const response = await fetch(`${acApiUrl}/signatures/create`, {
        //   method: 'POST',
        //   headers: {
        //     'X-API-Key': acApiKey,
        //     'Content-Type': 'application/json'
        //   },
        //   body: JSON.stringify({
        //     hash: documentHash,
        //     certificate: certificate.certificate_thumbprint
        //   })
        // })
        // const data = await response.json()
        // return {
        //   signature: data.signedHash,
        //   validationUrl: data.itiUrl,
        //   validationCode: data.itiCode
        // }
        
        console.log('🔐 [Certisign] Assinando documento (modo produção):', documentHash.substring(0, 16))
      }
    } catch (error) {
      console.error('❌ Erro ao chamar AC real, usando simulação:', error)
      // Fallback para simulação
    }
  }

  // SIMULAÇÃO (fallback ou quando AC não configurada)
  // V1.9.176: prefixo SIM- explicitamente identifica simulação (auditoria)
  const signature = `SIM-ICP-BR-SHA256-${documentHash.substring(0, 32)}-${certificate.ac_provider.toUpperCase()}`
  const validationCode = `SIM-ITI-${Date.now()}-${documentHash.substring(0, 8).toUpperCase()}`
  const validationUrl = `https://www.gov.br/iti/pt-br/validacao?codigo=${validationCode}`

  console.log('⚠️ [Simulação] Assinatura gerada (modo desenvolvimento — sem força legal)')

  return {
    signature,
    validationUrl,
    validationCode,
    mode: 'simulation'
  }
}

/**
 * Persiste auditoria da assinatura. V1.9.176 — registra modo (real/api_stub/simulation).
 */
async function persistAudit(
  supabase: any,
  documentId: string,
  certificate: any,
  signature: string,
  validationCode: string,
  mode: 'real' | 'api_stub' | 'simulation' = 'simulation'
): Promise<void> {
  // Buscar CPF do profissional (se disponível)
  const { data: professional } = await supabase
    .from('users')
    .select('cpf')
    .eq('id', certificate.professional_id)
    .single()

  await supabase.from('pki_transactions').insert({
    document_id: documentId,
    signer_cpf: professional?.cpf || '000.000.000-00',
    signature_value: signature,
    certificate_thumbprint: certificate.certificate_thumbprint,
    ac_provider: certificate.ac_provider,
    metadata: { signing_mode: mode, validation_code: validationCode }
  })
}

/**
 * Atualiza documento com assinatura
 * V1.9.231 — Recebe documentType pra rotear table (cfm_prescriptions OR patient_exam_requests).
 * Mesmos campos ICP em ambas (espelho de schema V1.9.231 migration).
 */
async function updateDocument(
  supabase: any,
  documentId: string,
  signature: string,
  validationCode: string,
  validationUrl: string,
  documentLevel: 'level_1' | 'level_2' | 'level_3' = 'level_3',
  documentType: 'prescription' | 'exam_request' = 'prescription'
): Promise<void> {
  const tableName = TABLE_BY_DOC_TYPE[documentType]
  // V1.9.185 — documentLevel passado dinâmico (level_2 atestado, level_3 prescrição)
  // V1.9.231 — table dinamica via TABLE_BY_DOC_TYPE; campos ICP identicos.
  await supabase
    .from(tableName)
    .update({
      digital_signature: signature,
      signature_timestamp: new Date().toISOString(),
      status: 'signed',
      iti_validation_code: validationCode,
      iti_validation_url: validationUrl,
      document_level: documentLevel
    })
    .eq('id', documentId)
}

/**
 * Cria confirmação de assinatura
 */
async function createConfirmation(
  supabase: any,
  documentId: string,
  professionalId: string,
  documentHash: string
): Promise<void> {
  await supabase.from('signature_confirmations').insert({
    document_id: documentId,
    professional_id: professionalId,
    user_confirmed_signature: true,
    confirmation_timestamp: new Date().toISOString(),
    document_version_hash: documentHash
  })
}

Deno.serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // 1. Validar variáveis de ambiente
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Variáveis de ambiente não configuradas')
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // 2. Parse do body
    const body: SignatureRequest = await req.json()
    const { documentId, documentLevel, professionalId, userConfirmed } = body
    // V1.9.231 — documentType default 'prescription' = backward-compat.
    const documentType: 'prescription' | 'exam_request' = body.documentType || 'prescription'

    if (!documentId || !documentLevel || !professionalId) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Parâmetros obrigatórios: documentId, documentLevel, professionalId'
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // V1.9.231 — Validar documentType
    if (!['prescription', 'exam_request'].includes(documentType)) {
      return new Response(JSON.stringify({
        success: false,
        error: 'documentType deve ser prescription ou exam_request'
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // 3. Validar nível do documento
    // V1.9.185 — aceitar level_1 (atestado simples), level_2 (atestado padrão),
    // level_3 (prescrição). Antes era hardcoded só level_3 (prescription-only).
    if (!['level_1', 'level_2', 'level_3'].includes(documentLevel)) {
      return new Response(JSON.stringify({
        success: false,
        error: 'documentLevel deve ser level_1, level_2 ou level_3'
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // 4. Buscar certificado ativo
    const certificate = await resolveCertificate(supabase, professionalId)

    if (!certificate) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Certificado ICP-Brasil não encontrado ou expirado',
        requiresRenewal: true
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // 5. Buscar documento
    // V1.9.231 — table dinamica via TABLE_BY_DOC_TYPE.
    const docTable = TABLE_BY_DOC_TYPE[documentType]
    const { data: document, error: docError } = await supabase
      .from(docTable)
      .select('*')
      .eq('id', documentId)
      .single()

    if (docError || !document) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Documento não encontrado'
      }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // 6. Verificar se já está assinado
    if (document.status === 'signed' && document.digital_signature) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Documento já está assinado'
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // 7. Preparar hash do documento (V1.9.231 — fields condicionais por type)
    const documentHash = await prepareDocumentHash(document, documentType)

    // 8. Criar snapshot imutável
    await createSnapshot(supabase, documentId, documentHash)

    // 9. Criar confirmação (se usuário confirmou)
    if (userConfirmed) {
      await createConfirmation(supabase, documentId, professionalId, documentHash)
    }

    // 10. Chamar AC (REAL .pfx → API stub → simulação fallback)
    const { signature, validationUrl, validationCode, mode } = await callACProvider(supabase, certificate, documentHash)

    // 11. Persistir auditoria (com modo)
    await persistAudit(supabase, documentId, certificate, signature, validationCode, mode)

    // 12. Atualizar documento (V1.9.231 — table dinamica via documentType)
    await updateDocument(supabase, documentId, signature, validationCode, validationUrl, documentLevel, documentType)

    // 13. Retornar resultado (V1.9.176 — inclui modo pra frontend exibir aviso se simulação)
    const response: SignatureResponse & { mode?: string } = {
      success: true,
      signature,
      validationUrl,
      itiValidationCode: validationCode,
      mode
    }

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (error: any) {
    console.error('❌ [Digital Signature] Erro:', error)
    
    return new Response(JSON.stringify({
      success: false,
      error: error.message || 'Erro desconhecido ao assinar documento'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})
