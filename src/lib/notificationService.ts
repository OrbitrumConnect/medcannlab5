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

  async notifyAppointmentConfirmation(patientEmail: string, professionalEmail: string, appointmentDetails: any) {
    const { date, time, professionalName, patientName } = appointmentDetails

    // Notify Patient
    await this.sendEmail({
      to: patientEmail,
      subject: '✅ Consulta Confirmada - MedCann Hub',
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
          <p style="font-size: 12px; color: #64748b;">MedCann Hub - Tecnologia para Medicina Canabinoide</p>
        </div>
      `
    })

    // Notify Professional
    await this.sendEmail({
      to: professionalEmail,
      subject: '📅 Novo Agendamento - MedCann Hub',
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
          <p style="font-size: 12px; color: #64748b;">MedCann Hub - Gestão Clínica Inteligente</p>
        </div>
      `
    })
  }
}
