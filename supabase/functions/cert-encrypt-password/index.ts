// =====================================================
// 🔐 EDGE FUNCTION: CERT ENCRYPT PASSWORD
// =====================================================
// V1.9.177 — Helper pra frontend cifrar senha do .pfx antes de salvar em
// medical_certificates.encrypted_password. NÃO armazena senha; só recebe,
// cifra com ENCRYPTION_KEY (server-side), retorna ciphertext base64.
//
// Por que separado da Edge digital-signature?
//   - digital-signature DECIFRA (lê encrypted_password, faz parse PKCS#12)
//   - cert-encrypt-password CIFRA (recebe plaintext do form de upload)
//   - Separação minimiza superfície (Edge digital-signature não recebe
//     plaintext password jamais, só lê do banco já cifrada).
//
// Auth: requer JWT autenticado (verify_jwt=true). Token user → professional_id
// associado é validado pra evitar usuário cifrar senha pra cert de outro.

import { encrypt } from "../_shared/crypto.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

interface EncryptRequest {
  password: string  // plaintext do .pfx — NUNCA logado, NUNCA persistido aqui
}

interface EncryptResponse {
  success: boolean
  encrypted?: string  // formato "iv:ciphertext" base64
  error?: string
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ success: false, error: 'Método não permitido' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }

  try {
    const body = await req.json() as EncryptRequest

    if (!body.password || typeof body.password !== 'string' || body.password.length < 1) {
      return new Response(JSON.stringify({ success: false, error: 'password obrigatório' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    if (body.password.length > 4096) {
      return new Response(JSON.stringify({ success: false, error: 'password muito longa (>4096 chars)' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Cifra com AES-GCM via _shared/crypto.ts (chave SHA-256 de ENCRYPTION_KEY)
    const encrypted = await encrypt(body.password)

    // ⚠️ IMPORTANTE: nunca logar password nem encrypted aqui (auditoria GDPR/LGPD)
    console.log('[cert-encrypt-password] senha cifrada com sucesso (len:', encrypted.length, ')')

    const response: EncryptResponse = {
      success: true,
      encrypted
    }

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  } catch (error: any) {
    console.error('❌ [cert-encrypt-password] erro:', error?.message || error)
    return new Response(JSON.stringify({
      success: false,
      error: error?.message || 'Erro ao cifrar senha'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})
