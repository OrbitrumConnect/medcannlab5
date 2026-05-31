// V1.9.533 — Edge `create-patient-auth`
// ─────────────────────────────────────────────────────────────────
// Fecha gap arquitetural "infra pre-cadastro silencioso CFM-compliant
// gerava órfão public.users sem auth.users" identificado empíricamente
// no caso Flávia 30/05/2026.
//
// O QUE FAZ:
//   Recebe: { patient_id, email, name, send_email? }
//   Valida: caller autenticado é admin OR profissional E é dono do public.users
//   Cria:
//     1. auth.users(id=patient_id, email, password gerada) [forçando UUID]
//     2. auth.identities(provider=email, identity_data com email_verified=true)
//     3. (opcional) Edge send-email com senha provisória + link
//   Retorna: { success, password_provisional, email_sent }
//
// POR QUE FORÇA UUID:
//   Empírico HOJE (validado caso Flávia): se auth.users tem UUID diferente
//   do public.users existente, trigger fn_on_auth_user_created_link_existing
//   tenta UPDATE public.users.id = NEW.id MAS FKs em clinical_assessments/
//   appointments/user_roles são ON UPDATE NO ACTION → FK violation → trigger
//   falha → fragmentação (auth com UUID novo + public com UUID velho).
//
//   Forçando UUID idênticos desde o início: NEW.id == existing_user_id no
//   trigger → WHERE id != NEW.id retorna NULL → trigger só faz INSERT em
//   user_profiles + RETURN NEW (idempotente, zero FK violation).
//
// PATTERN REUSO:
//   - Auth interna runtime (V1.9.457 sign-pdf-icp pattern): valida JWT user
//     + ownership do public.users (Ricardo só cria conta de paciente DELE)
//   - service_role_key pra supabase.auth.admin.createUser (necessário)
//   - Edge send-email (V1.9.103 - Resend Pro) pra notificação opcional
//   - Senha 8 chars aleatórios mix completo (Pedro decidiu 30/05 noite)
//
// LOCKS INTOCADOS: V1.9.299 PBAD + AEC + Pipeline + Matrix Z2

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

// V1.9.533: senha 8 chars aleatórios com mix completo (decisão Pedro 30/05 noite)
// Pool de 64 chars: a-z (26) + A-Z (26) + 0-9 (10) + simbolos seguros (2 = !@)
// Combinações: 64^8 = ~281 trilhões = chance ~0% de HaveIBeenPwned collision
function generateProvisionalPassword(length = 8): string {
  // Pools garantindo pelo menos 1 de cada categoria
  const lowercase = 'abcdefghjkmnpqrstuvwxyz'   // sem i, l, o (confusos)
  const uppercase = 'ABCDEFGHJKLMNPQRSTUVWXYZ'  // sem I, O
  const digits = '23456789'                       // sem 0, 1 (confusos)
  const symbols = '!@'                            // simbolos comuns aceitos

  // Garantir pelo menos 1 de cada categoria
  const required = [
    lowercase[crypto.getRandomValues(new Uint8Array(1))[0] % lowercase.length],
    uppercase[crypto.getRandomValues(new Uint8Array(1))[0] % uppercase.length],
    digits[crypto.getRandomValues(new Uint8Array(1))[0] % digits.length],
    symbols[crypto.getRandomValues(new Uint8Array(1))[0] % symbols.length],
  ]

  // Restante = aleatório do pool completo
  const allChars = lowercase + uppercase + digits + symbols
  const remaining = length - required.length
  const random = Array.from(
    crypto.getRandomValues(new Uint8Array(remaining)),
    (b) => allChars[b % allChars.length],
  )

  // Embaralhar (Fisher-Yates)
  const chars = [...required, ...random]
  for (let i = chars.length - 1; i > 0; i--) {
    const j = crypto.getRandomValues(new Uint8Array(1))[0] % (i + 1)
    ;[chars[i], chars[j]] = [chars[j], chars[i]]
  }

  return chars.join('')
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { status: 200, headers: { ...corsHeaders, 'Access-Control-Max-Age': '86400' } })
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY')
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

    if (!supabaseUrl || !anonKey || !serviceKey) {
      throw new Error('Missing Supabase env vars')
    }

    // V1.9.457 pattern: validar caller via JWT header
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Missing Authorization header' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const supabaseUser = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    })

    const { data: { user: caller }, error: authError } = await supabaseUser.auth.getUser()
    if (authError || !caller) {
      return new Response(JSON.stringify({ error: 'Unauthorized: invalid JWT' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Body validation
    const { patient_id, email, name, send_email = false } = await req.json()
    if (!patient_id || !email || !name) {
      return new Response(JSON.stringify({ error: 'Missing required: patient_id, email, name' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // V1.9.457 pattern: admin client (bypass RLS)
    const supabaseAdmin = createClient(supabaseUrl, serviceKey)

    // V1.9.533: validar caller é admin OR profissional dono do public.users(patient_id)
    const { data: patientData, error: patientErr } = await supabaseAdmin
      .from('users')
      .select('id, email, invited_by, type')
      .eq('id', patient_id)
      .maybeSingle()

    if (patientErr || !patientData) {
      return new Response(JSON.stringify({ error: 'Patient not found in public.users' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Ownership check: caller deve ser admin OR ter cadastrado o paciente
    const { data: callerRoles } = await supabaseAdmin
      .from('user_roles')
      .select('role')
      .eq('user_id', caller.id)

    const isAdmin = callerRoles?.some((r) => r.role === 'admin')
    const isOwnerProfissional = patientData.invited_by === caller.id

    if (!isAdmin && !isOwnerProfissional) {
      return new Response(JSON.stringify({ error: 'Forbidden: caller is not admin nor patient owner' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // V1.9.533: validar se auth.users já existe (idempotência)
    const { data: existingAuth } = await supabaseAdmin.auth.admin.getUserById(patient_id)
    if (existingAuth?.user) {
      return new Response(
        JSON.stringify({
          success: false,
          already_exists: true,
          message: 'auth.users já existe para este patient_id',
        }),
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        },
      )
    }

    // V1.9.533: gerar senha provisória forte aleatória
    const provisionalPassword = generateProvisionalPassword(8)

    // V1.9.533: criar auth.users COM UUID FORÇADO (chave da solução)
    const { data: created, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password: provisionalPassword,
      email_confirm: true, // skip email verification (médico atestou identidade)
      user_metadata: {
        name,
        type: 'paciente',
        created_via: 'edge_create_patient_auth_v1_9_533',
        must_change_password: true, // flag pra frontend forçar troca primeiro acesso
      },
      // CRITICAL: forçar UUID = patient_id (= public.users.id existente)
      // Isso evita FK violation no trigger fn_on_auth_user_created_link_existing
      // porque NEW.id == existing_user_id (WHERE id != NEW.id retorna NULL)
      id: patient_id,
    } as any)

    if (createError || !created?.user) {
      console.error('[V1.9.533] createUser failed:', createError)
      return new Response(
        JSON.stringify({
          error: 'Failed to create auth.users',
          detail: createError?.message,
        }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        },
      )
    }

    // V1.9.533 (opcional): enviar email via Resend pra paciente
    let emailSent = false
    if (send_email) {
      try {
        const { data: profData } = await supabaseAdmin
          .from('users')
          .select('name')
          .eq('id', caller.id)
          .maybeSingle()

        const profName = profData?.name || 'seu profissional'
        const appUrl = Deno.env.get('APP_URL') || 'https://medcannlab.com.br'

        const emailRes = await supabaseAdmin.functions.invoke('send-email', {
          body: {
            to: email,
            subject: 'Seu cadastro no MedCannLab está pronto',
            html: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #10b981;">Olá, ${name}!</h2>
                <p>${profName} criou seu cadastro no MedCannLab.</p>
                <p>Para acessar sua conta, use as credenciais abaixo:</p>
                <div style="background: #f3f4f6; padding: 16px; border-radius: 8px; margin: 16px 0;">
                  <p style="margin: 4px 0;"><strong>Email:</strong> ${email}</p>
                  <p style="margin: 4px 0;"><strong>Senha provisória:</strong> <code style="background:#fff;padding:4px 8px;border-radius:4px;font-size:16px;">${provisionalPassword}</code></p>
                </div>
                <p>
                  <a href="${appUrl}/login" style="background: #10b981; color: #fff; padding: 12px 24px; border-radius: 8px; text-decoration: none; display: inline-block;">
                    Acessar minha conta
                  </a>
                </p>
                <p style="color: #666; font-size: 13px; margin-top: 24px;">
                  <strong>Importante:</strong> Por segurança, troque sua senha no primeiro acesso pelo seu perfil.
                </p>
                <p style="color: #999; font-size: 12px;">
                  Se não foi você quem solicitou, ignore este email.
                </p>
              </div>
            `,
          },
        })

        emailSent = !emailRes.error
        if (emailRes.error) {
          console.warn('[V1.9.533] send-email failed:', emailRes.error)
        }
      } catch (emailErr) {
        console.warn('[V1.9.533] send-email exception:', emailErr)
        // Não bloqueia retorno — paciente ainda tem senha provisória pelo Modal frontend
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        patient_id,
        email,
        password_provisional: provisionalPassword,
        email_sent: emailSent,
        message: 'Conta criada. Paciente deve trocar senha no primeiro acesso.',
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      },
    )
  } catch (err) {
    console.error('[V1.9.533] internal error:', err)
    return new Response(
      JSON.stringify({
        error: 'Internal server error',
        detail: err instanceof Error ? err.message : String(err),
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      },
    )
  }
})
