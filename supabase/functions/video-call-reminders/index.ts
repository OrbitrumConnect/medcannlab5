// Edge Function: Lembretes Automáticos de Videochamadas (V1.9.99 — sweep mode)
//
// V1.9.123-A (04/05/2026) — adicionadas janelas 24h e 1h antes da consulta.
// Antes: só 30/10/1 min — "pé na porta", paciente já cancelou. 0/69 enviados.
// Agora: 24h (lembrete dia anterior) + 1h (preparação) + 30/10/1 min (fail-safe).
//
// Reescrita 28/04/2026 — antes era v52 modo "individual" (recebia schedule_id de
// tabela video_call_schedules que NÃO existia). Reescrita pra modo SWEEP que:
//   1) Lê appointments diretamente (P8: usa o que já existe)
//   2) Filtra remotos pendentes nos próximos 25h (era 35min — V1.9.123-A ampliou)
//   3) Envia notificação in-app + email Resend pra paciente + profissional
//   4) Idempotente via 5 colunas reminder_sent_24h/1h/30min/10min/1min
//   5) Disparada por GitHub Actions cron a cada 5 minutos
//
// Polir não inventar: zero tabela nova, zero feature inventada, só liga
// appointments existente + notifications existente + send-email existente.
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

interface Appointment {
  id: string
  patient_id: string | null
  professional_id: string | null
  doctor_id: string | null
  appointment_date: string
  title: string
  meeting_url: string | null
  reminder_sent_24h: boolean
  reminder_sent_1h: boolean
  reminder_sent_30min: boolean
  reminder_sent_10min: boolean
  reminder_sent_1min: boolean
}

interface UserRef {
  id: string
  name: string | null
  email: string | null
}

const REMINDER_WINDOWS = [
  // V1.9.123-A: lembretes preventivos (paciente ainda pode reagendar/cancelar com aviso)
  { minutes: 1440, sentField: 'reminder_sent_24h' as const,   lowerBound: 1380, upperBound: 1500 }, // ~23-25h
  { minutes: 60,   sentField: 'reminder_sent_1h' as const,    lowerBound: 55,   upperBound: 65   }, // ~55-65min
  // Fail-safe (pé na porta — não evita cancelamento, mas confirma presença)
  { minutes: 30,   sentField: 'reminder_sent_30min' as const, lowerBound: 25,   upperBound: 35   },
  { minutes: 10,   sentField: 'reminder_sent_10min' as const, lowerBound: 5,    upperBound: 15   },
  { minutes: 1,    sentField: 'reminder_sent_1min'  as const, lowerBound: 0,    upperBound: 3    },
]

// V1.9.123-A: humaniza o título do lembrete por janela.
function formatReminderTitle(minutes: number, scheduledTime: Date): string {
  if (minutes >= 1440) {
    const horario = scheduledTime.toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo', hour: '2-digit', minute: '2-digit' })
    return `Lembrete: sua consulta é amanhã às ${horario}`
  }
  if (minutes === 60) return `Lembrete: sua consulta começa em 1 hora`
  if (minutes === 1)  return `Sua consulta começa em 1 minuto`
  return `Sua consulta começa em ${minutes} minutos`
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { status: 200, headers: corsHeaders })
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  const supabase = createClient(supabaseUrl, serviceRoleKey)

  const startedAt = Date.now()
  const stats = { scanned: 0, reminders_sent: 0, emails_sent: 0, errors: 0 }

  try {
    const now = new Date()
    // V1.9.123-A: janela de scan ampliada de 35min pra 25h (pra pegar lembrete 24h antes)
    const sweepUpper = new Date(now.getTime() + 1500 * 60 * 1000)

    const { data: appointments, error: queryError } = await supabase
      .from('appointments')
      .select('id, patient_id, professional_id, doctor_id, appointment_date, title, meeting_url, reminder_sent_24h, reminder_sent_1h, reminder_sent_30min, reminder_sent_10min, reminder_sent_1min')
      .eq('is_remote', true)
      .eq('status', 'scheduled')
      .gte('appointment_date', now.toISOString())
      .lte('appointment_date', sweepUpper.toISOString())
      .or('reminder_sent_24h.eq.false,reminder_sent_1h.eq.false,reminder_sent_30min.eq.false,reminder_sent_10min.eq.false,reminder_sent_1min.eq.false')

    if (queryError) {
      console.error('[reminders] Query error:', queryError)
      return jsonResponse({ ok: false, error: queryError.message, stats }, 500)
    }

    stats.scanned = appointments?.length ?? 0

    // JOIN manual: appointments NÃO tem FKs formais com users — fetch separado
    const userIds = new Set<string>()
    for (const apt of (appointments ?? []) as Appointment[]) {
      if (apt.patient_id) userIds.add(apt.patient_id)
      if (apt.professional_id) userIds.add(apt.professional_id)
    }

    const usersMap = new Map<string, UserRef>()
    if (userIds.size > 0) {
      const { data: users } = await supabase
        .from('users')
        .select('id, name, email')
        .in('id', Array.from(userIds))
      for (const u of (users ?? []) as UserRef[]) usersMap.set(u.id, u)
    }

    for (const apt of (appointments ?? []) as Appointment[]) {
      const scheduledTime = new Date(apt.appointment_date)
      const minutesUntil = (scheduledTime.getTime() - now.getTime()) / (60 * 1000)

      for (const window of REMINDER_WINDOWS) {
        if (apt[window.sentField]) continue
        if (minutesUntil < window.lowerBound || minutesUntil > window.upperBound) continue

        const formattedTime = scheduledTime.toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })
        const titleMessage = formatReminderTitle(window.minutes, scheduledTime)
        const fullMessage = `${titleMessage} (${formattedTime}). ${apt.meeting_url ? `Link: ${apt.meeting_url}` : 'Link da chamada será disponibilizado.'}`

        const recipients = [
          { id: apt.patient_id, contact: apt.patient_id ? usersMap.get(apt.patient_id) : null, role: 'paciente' },
          { id: apt.professional_id, contact: apt.professional_id ? usersMap.get(apt.professional_id) : null, role: 'profissional' },
        ].filter((r) => r.id && r.contact)

        for (const r of recipients) {
          try {
            await supabase.from('notifications').insert({
              user_id: r.id,
              type: 'video_call_reminder',
              title: titleMessage,
              message: fullMessage,
              is_read: false,
              metadata: {
                appointment_id: apt.id,
                reminder_minutes: window.minutes,
                meeting_url: apt.meeting_url ?? null,
              },
            })
            stats.reminders_sent++

            if (r.contact?.email) {
              const emailRes = await supabase.functions.invoke('send-email', {
                body: {
                  to: r.contact.email,
                  subject: titleMessage,
                  html: `<p>Olá <strong>${r.contact.name ?? ''}</strong>,</p><p>${fullMessage}</p><p><em>MedCannLab — Plataforma Nôa Esperança</em></p>`,
                },
              })
              if (!emailRes.error) stats.emails_sent++
              else console.warn('[reminders] Email failed:', r.contact.email, emailRes.error)
            }
          } catch (err) {
            stats.errors++
            console.error(`[reminders] Erro notify ${r.role} apt ${apt.id}:`, err)
          }
        }

        await supabase
          .from('appointments')
          .update({ [window.sentField]: true, updated_at: now.toISOString() })
          .eq('id', apt.id)
      }
    }

    const durationMs = Date.now() - startedAt
    await supabase.from('noa_logs').insert({
      interaction_type: 'video_call_reminders_sweep',
      payload: { ...stats, duration_ms: durationMs, sweep_at: now.toISOString() },
    }).then(() => null, (e) => console.warn('[reminders] log failed:', e))

    return jsonResponse({ ok: true, stats, duration_ms: durationMs })
  } catch (err) {
    console.error('[reminders] Fatal:', err)
    return jsonResponse({ ok: false, error: String(err), stats }, 500)
  }
})

function jsonResponse(body: Record<string, unknown>, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}
