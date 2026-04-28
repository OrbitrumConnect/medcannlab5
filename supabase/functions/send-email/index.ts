// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

// Setup type definitions for built-in Supabase Runtime APIs
import "jsr:@supabase/functions-js/edge-runtime.d.ts"

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')
const FROM_EMAIL = Deno.env.get('RESEND_FROM_EMAIL') || 'MedCannLab <onboarding@resend.dev>'

const corsHeaders = {
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

function getCorsHeaders(origin: string | null) {
  const allowedOrigins = [
    'http://localhost:3000',
    'https://medcannlab.vercel.app',
    'https://www.medcannlab.com.br'
  ];

  const isAllowed = origin && (
    allowedOrigins.includes(origin) || 
    origin.endsWith('.lovable.app') ||
    origin.endsWith('.lovableproject.com')
  );

  if (isAllowed) {
    return { ...corsHeaders, 'Access-Control-Allow-Origin': origin };
  }
  
  return { ...corsHeaders, 'Access-Control-Allow-Origin': allowedOrigins[0] };
}

export const config = {
  verify_jwt: false
}

// ========================================
// Email Templates
// ========================================

const baseTemplate = (content: string, title: string) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>
    body { margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #0f172a; color: #e2e8f0; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { text-align: center; padding: 30px 0; }
    .logo { font-size: 28px; font-weight: bold; background: linear-gradient(135deg, #8b5cf6, #ec4899); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
    .content { background: #1e293b; border-radius: 16px; padding: 32px; border: 1px solid #334155; }
    .btn { display: inline-block; padding: 14px 32px; background: linear-gradient(135deg, #8b5cf6, #ec4899); color: white !important; text-decoration: none; border-radius: 12px; font-weight: 600; font-size: 16px; margin: 16px 0; }
    .footer { text-align: center; padding: 20px 0; color: #64748b; font-size: 12px; }
    h2 { color: #f1f5f9; margin-top: 0; }
    p { color: #cbd5e1; line-height: 1.6; }
    .highlight { color: #a78bfa; font-weight: 600; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="logo">🏥 MedCannLab</div>
      <p style="color: #94a3b8; font-size: 14px;">Plataforma de Cannabis Medicinal</p>
    </div>
    <div class="content">
      ${content}
    </div>
    <div class="footer">
      <p>© ${new Date().getFullYear()} MedCannLab. Todos os direitos reservados.</p>
      <p>Este é um e-mail automático. Por favor, não responda diretamente.</p>
    </div>
  </div>
</body>
</html>
`

const templates: Record<string, (data: Record<string, string>) => { subject: string; html: string }> = {
    welcome: (data) => ({
        subject: '🏥 Bem-vindo ao MedCannLab!',
        html: baseTemplate(`
      <h2>Olá, ${data.name || 'Paciente'}! 👋</h2>
      <p>Seja muito bem-vindo(a) ao <span class="highlight">MedCannLab</span> — sua plataforma de acompanhamento em Cannabis Medicinal.</p>
      <p>Aqui você pode:</p>
      <ul style="color: #cbd5e1;">
        <li>💬 Conversar com seu médico em tempo real</li>
        <li>📋 Receber relatórios clínicos personalizados</li>
        <li>🤖 Consultar a Nôa, nossa IA assistente</li>
        <li>📅 Agendar e gerenciar suas consultas</li>
      </ul>
      <center><a href="${data.appUrl || 'https://medcannlab.com.br'}" class="btn">Acessar Plataforma</a></center>
    `, 'Bem-vindo ao MedCannLab')
    }),

    appointment_confirmation: (data) => ({
        subject: `📅 Consulta Confirmada — ${data.date || ''}`,
        html: baseTemplate(`
      <h2>Consulta Confirmada! ✅</h2>
      <p>Olá, <span class="highlight">${data.patientName || 'Paciente'}</span>!</p>
      <p>Sua consulta foi agendada com sucesso:</p>
      <div style="background: #0f172a; padding: 16px; border-radius: 12px; margin: 16px 0;">
        <p>📅 <strong>Data:</strong> ${data.date || 'A confirmar'}</p>
        <p>⏰ <strong>Horário:</strong> ${data.time || 'A confirmar'}</p>
        <p>👨‍⚕️ <strong>Profissional:</strong> Dr(a). ${data.doctorName || ''}</p>
        <p>📍 <strong>Tipo:</strong> ${data.type || 'Teleconsulta'}</p>
      </div>
      <center><a href="${data.appUrl || 'https://medcannlab.com.br'}" class="btn">Ver Detalhes</a></center>
    `, 'Consulta Confirmada')
    }),

    report_shared: (data) => ({
        subject: `📋 Novo Relatório Compartilhado`,
        html: baseTemplate(`
      <h2>Relatório Compartilhado 📋</h2>
      <p>Olá, <span class="highlight">Dr(a). ${data.doctorName || ''}</span>!</p>
      <p>O paciente <strong>${data.patientName || ''}</strong> compartilhou um relatório clínico com você:</p>
      <div style="background: #0f172a; padding: 16px; border-radius: 12px; margin: 16px 0;">
        <p>📄 <strong>Relatório:</strong> ${data.reportName || 'Relatório Clínico'}</p>
        <p>📅 <strong>Data:</strong> ${data.date || new Date().toLocaleDateString('pt-BR')}</p>
      </div>
      <center><a href="${data.appUrl || 'https://medcannlab.com.br'}" class="btn">Ver Relatório</a></center>
    `, 'Relatório Compartilhado')
    }),

    prescription_ready: (data) => ({
        subject: `💊 Sua Prescrição está Pronta`,
        html: baseTemplate(`
      <h2>Prescrição Disponível 💊</h2>
      <p>Olá, <span class="highlight">${data.patientName || 'Paciente'}</span>!</p>
      <p>Sua prescrição foi emitida por <strong>Dr(a). ${data.doctorName || ''}</strong> e está pronta para acesso.</p>
      <div style="background: #0f172a; padding: 16px; border-radius: 12px; margin: 16px 0;">
        <p>📋 <strong>Tipo:</strong> ${data.prescriptionType || 'Cannabis Medicinal'}</p>
        <p>📅 <strong>Data:</strong> ${data.date || new Date().toLocaleDateString('pt-BR')}</p>
      </div>
      <center><a href="${data.appUrl || 'https://medcannlab.com.br'}" class="btn">Ver Prescrição</a></center>
    `, 'Prescrição Pronta')
    }),

    invite_patient: (data) => ({
        subject: `🏥 Convite para MedCannLab — Dr(a). ${data.doctorName || ''}`,
        html: baseTemplate(`
      <h2>Você foi convidado! 🎉</h2>
      <p>Olá!</p>
      <p>O(a) <span class="highlight">Dr(a). ${data.doctorName || ''}</span> convidou você para se conectar no MedCannLab.</p>
      <p>Com o MedCannLab, você terá acesso a acompanhamento clínico personalizado, chat direto com seu médico, e relatórios de evolução.</p>
      <center><a href="${data.inviteUrl || 'https://medcannlab.com.br'}" class="btn">Aceitar Convite</a></center>
    `, 'Convite MedCannLab')
    }),

    payment_confirmation: (data) => ({
        subject: `✅ Pagamento Confirmado — MedCannLab`,
        html: baseTemplate(`
      <h2>Pagamento Confirmado! ✅</h2>
      <p>Olá, <span class="highlight">${data.patientName || 'Paciente'}</span>!</p>
      <p>Seu pagamento foi processado com sucesso:</p>
      <div style="background: #0f172a; padding: 16px; border-radius: 12px; margin: 16px 0;">
        <p>💳 <strong>Plano:</strong> ${data.planName || 'Premium'}</p>
        <p>💰 <strong>Valor:</strong> R$ ${data.amount || '0,00'}</p>
        <p>📅 <strong>Data:</strong> ${data.date || new Date().toLocaleDateString('pt-BR')}</p>
      </div>
      <center><a href="${data.appUrl || 'https://medcannlab.com.br'}" class="btn">Acessar Plataforma</a></center>
    `, 'Pagamento Confirmado')
    }),
}

// ========================================
// Main Handler
// ========================================

Deno.serve(async (req: Request) => {
    const origin = req.headers.get('origin')
    const headers = getCorsHeaders(origin)

    // Log de diagnóstico de ambiente (Visível no console do Supabase)
    console.log("📧 [Email Service] Diagnostic:", {
      origin,
      hasKey: !!RESEND_API_KEY,
      from: FROM_EMAIL,
      method: req.method
    })

    // Handle CORS preflight
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers })
    }

    try {
        if (!RESEND_API_KEY) {
            console.error('❌ CRITICAL: RESEND_API_KEY is missing in Edge Function secrets')
            throw new Error('RESEND_API_KEY not configured')
        }

        const body = await req.json()
        const { to, subject, html, template, data } = body
        
        // Pega a chave de idempotência se enviada pelo cliente (ex: ID do agendamento)
        const idempotencyKey = req.headers.get('x-idempotency-key') || req.headers.get('idempotency-key')

        if (!to) {
            throw new Error('Missing required field: to')
        }

        let emailSubject = subject
        let emailHtml = html

        // If a template is specified, use it
        if (template && templates[template]) {
            const result = templates[template](data || {})
            emailSubject = emailSubject || result.subject
            emailHtml = emailHtml || result.html
        }

        if (!emailSubject || !emailHtml) {
            throw new Error('Missing subject or html')
        }

        // --- SISTEMA DE RETRY (Nível Elite) ---
        let lastError = null;
        let attempts = 0;
        const maxAttempts = 3;

        while (attempts < maxAttempts) {
          try {
            attempts++;
            const res = await fetch('https://api.resend.com/emails', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${RESEND_API_KEY}`,
                    ...(idempotencyKey ? { 'X-Idempotency-Key': idempotencyKey } : {})
                },
                body: JSON.stringify({
                    from: FROM_EMAIL,
                    to: Array.isArray(to) ? to : [to],
                    subject: emailSubject,
                    html: emailHtml,
                }),
            })

            const resData = await res.json()

            if (!res.ok) {
                lastError = resData;
                console.warn(`⚠️ Tentativa ${attempts} falhou:`, { 
                  status: res.status, 
                  error: resData,
                  to: Array.isArray(to) ? to[0] : to 
                });
                
                // Se for 403 (Sandbox/Domínio), não adianta tentar de novo
                if (res.status === 403 || res.status === 401) break; 
                
                // Espera um pouco antes da próxima tentativa (Backoff simples)
                await new Promise(r => setTimeout(r, 1000 * attempts));
                continue;
            }

            console.log(`✅ Email enviado com sucesso na tentativa ${attempts} (ID: ${resData.id})`)
            return new Response(
                JSON.stringify({ success: true, id: resData.id }),
                { status: 200, headers: { ...headers, 'Content-Type': 'application/json' } }
            )
          } catch (e: any) {
            lastError = e;
            console.error(`❌ Erro de rede na tentativa ${attempts}:`, e?.message || e);
            await new Promise(r => setTimeout(r, 1000 * attempts));
          }
        }

        // Se chegou aqui, todas as tentativas falharam
        return new Response(
            JSON.stringify({ 
              success: false, 
              error: lastError, 
              attempts,
              context: { from: FROM_EMAIL, to: Array.isArray(to) ? to[0] : to }
            }),
            { status: 500, headers: { ...headers, 'Content-Type': 'application/json' } }
        )

    } catch (error: any) {
        console.error('❌ Edge Function Runtime Error:', error?.message || error)
        return new Response(
            JSON.stringify({ success: false, error: error?.message || String(error) }),
            { status: 400, headers: { ...headers, 'Content-Type': 'application/json' } }
        )
    }
})
