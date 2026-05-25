// ✅ REFATORADO: Usa Edge Function 'send-email' (API key segura no server)
import { supabase } from './supabase'

export interface EmailData {
  to: string | string[]
  subject: string
  html: string
}

export const notificationService = {
  async sendEmail({ to, subject, html }: EmailData) {
    try {
      const { data, error } = await supabase.functions.invoke('send-email', {
        body: {
          to: Array.isArray(to) ? to[0] : to,
          subject,
          html,
        }
      })

      if (error) {
        console.error('❌ Edge Function send-email error:', error)
        return { success: false, error }
      }

      if (data?.success) {
        console.log('✅ Email sent via Edge Function:', data.id)
        return { success: true, data }
      }

      console.warn('⚠️ Edge Function returned:', data)
      return { success: false, error: data?.error }
    } catch (error) {
      console.error('❌ Error sending email:', error)
      return { success: false, error }
    }
  },

  async notifyAppointmentConfirmation(patientEmail: string, professionalEmail: string, appointmentDetails: any): Promise<void> {
    const { date, time, professionalName, patientName } = appointmentDetails

    // V1.9.447 — bug empírico João 25/05 madrugada:
    //
    // Antes: 2 sendEmail() em fire-and-forget puro (sem await). Funcionava em
    // contextos onde o componente permanecia vivo (ex: SchedulingWidget no chat
    // pós-AEC — Carolina recebeu email 24/05 21:32 BRT confirmado no Resend).
    // QUEBRAVA em contextos com navigate() imediato pós-bookAppointment (ex:
    // PatientAppointments.tsx:943 navega pra /app/chat-noa-esperanca → componente
    // desmonta → fetch do Edge `send-email` é abortado pelo browser → email some
    // sem rastro (catch silencioso só logava no console que já não existe mais).
    //
    // Agora: Promise.all dos 2 envios é AGUARDADO (await). O caller (bookAppointment)
    // pode envolver isso num Promise.race com timeout (200ms-5s) pra garantir que
    // a navegação UX não trava demais. Trade-off aceito pré-PMF: +200-500ms no
    // tempo de "agendar" pra confiabilidade total do email.
    //
    // Não-bloqueante por design: erros são logados mas NÃO lançam (mantém o
    // contrato "se email falhar, booking ainda é considerado sucesso"). Quem
    // quiser bloquear UI no email pode checar logs do console.
    const patientEmailPromise = this.sendEmail({
      to: patientEmail,
      subject: '✅ Consulta Confirmada - MedCannLab',
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
          <h2 style="color: #0ea5e9;">Consulta Confirmada!</h2>
          <p>Olá, <strong>${patientName}</strong>,</p>
          <p>Sua consulta com <strong>Dr(a). ${professionalName}</strong> foi agendada com sucesso.</p>
          <div style="background-color: #f8fafc; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <p><strong>Data:</strong> ${date}</p>
            <p><strong>Horário:</strong> ${time}</p>
          </div>
          <p>Você pode acessar seu dashboard para visualizar o link da videochamada no horário marcado.</p>
          <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;" />
          <p style="font-size: 12px; color: #64748b;">MedCannLab - Tecnologia para Medicina Canabinoide</p>
        </div>
      `
    }).catch((err: any) => {
      console.error('⚠️ [notifyAppointmentConfirmation] patient email falhou:', err)
      return { success: false, error: err }
    })

    const professionalEmailPromise = this.sendEmail({
      to: professionalEmail,
      subject: '📅 Novo Agendamento - MedCannLab',
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
          <h2 style="color: #0ea5e9;">Novo Paciente Agendado</h2>
          <p>Olá, <strong>Dr(a). ${professionalName}</strong>,</p>
          <p>Você tem um novo agendamento com <strong>${patientName}</strong>.</p>
          <div style="background-color: #f8fafc; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <p><strong>Data:</strong> ${date}</p>
            <p><strong>Horário:</strong> ${time}</p>
          </div>
          <p>O prontuário do paciente já está disponível no seu painel clínico.</p>
          <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;" />
          <p style="font-size: 12px; color: #64748b;">MedCannLab - Gestão Clínica Inteligente</p>
        </div>
      `
    }).catch((err: any) => {
      console.error('⚠️ [notifyAppointmentConfirmation] professional email falhou:', err)
      return { success: false, error: err }
    })

    // Aguarda OS DOIS. Erro individual já capturado em .catch acima — promise
    // sempre resolve. Promise.all aqui só pra garantir que ambos foram ao
    // menos despachados (request enviado) antes de devolver controle.
    await Promise.all([patientEmailPromise, professionalEmailPromise])
  }
}
