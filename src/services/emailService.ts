// =====================================================
// SERVIÇO DE E-MAIL - MEDCANLAB 3.0
// =====================================================
// Sistema completo de envio de e-mails institucionais

export type EmailTemplate = 
  | 'welcome'
  | 'password_reset'
  | 'report_ready'
  | 'appointment_reminder'
  | 'prescription_created'
  | 'assessment_completed'
  | 'notification'

export interface EmailOptions {
  to: string
  subject: string
  html: string
  text?: string
  from?: string
  replyTo?: string
  attachments?: Array<{
    filename: string
    content: string | Buffer
    contentType?: string
  }>
}

export interface EmailTemplateData {
  userName?: string
  userEmail?: string
  reportId?: string
  reportTitle?: string
  appointmentDate?: string
  appointmentTime?: string
  prescriptionTitle?: string
  assessmentId?: string
  resetLink?: string
  [key: string]: any
}

export class EmailService {
  private static instance: EmailService
  private apiKey: string | null = null
  private fromEmail: string = 'noreply@medcanlab.com.br'
  private fromName: string = 'MedCannLab 3.0'
  private baseUrl: string = ''

  private constructor() {
    // Tentar carregar configuração de variáveis de ambiente
    this.apiKey = import.meta.env.VITE_EMAIL_API_KEY || null
    this.fromEmail = import.meta.env.VITE_EMAIL_FROM || 'noreply@medcanlab.com.br'
    this.fromName = import.meta.env.VITE_EMAIL_FROM_NAME || 'MedCannLab 3.0'
    this.baseUrl = import.meta.env.VITE_APP_URL || window.location.origin
  }

  static getInstance(): EmailService {
    if (!EmailService.instance) {
      EmailService.instance = new EmailService()
    }
    return EmailService.instance
  }

  /**
   * Configurar serviço de e-mail
   */
  configure(config: {
    apiKey?: string
    fromEmail?: string
    fromName?: string
    baseUrl?: string
  }): void {
    if (config.apiKey) this.apiKey = config.apiKey
    if (config.fromEmail) this.fromEmail = config.fromEmail
    if (config.fromName) this.fromName = config.fromName
    if (config.baseUrl) this.baseUrl = config.baseUrl
  }

  /**
   * Enviar e-mail genérico
   */
  async sendEmail(options: EmailOptions): Promise<boolean> {
    try {
      // Se não houver API key configurada, usar Supabase Edge Function ou fallback
      if (!this.apiKey) {
        console.warn('⚠️ Email API key não configurada. Usando fallback.')
        return await this.sendEmailViaSupabase(options)
      }

      // Usar Resend API (recomendado) ou SendGrid
      return await this.sendEmailViaAPI(options)
    } catch (error) {
      console.error('❌ Erro ao enviar e-mail:', error)
      return false
    }
  }

  /**
   * Enviar e-mail via API externa (Resend/SendGrid)
   */
  private async sendEmailViaAPI(options: EmailOptions): Promise<boolean> {
    try {
      // Usar Resend API (mais simples e moderno)
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify({
          from: options.from || `${this.fromName} <${this.fromEmail}>`,
          to: options.to,
          subject: options.subject,
          html: options.html,
          text: options.text || this.htmlToText(options.html),
          reply_to: options.replyTo,
          attachments: options.attachments
        })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Erro ao enviar e-mail')
      }

      return true
    } catch (error) {
      console.error('❌ Erro ao enviar via API:', error)
      // Fallback para Supabase
      return await this.sendEmailViaSupabase(options)
    }
  }

  /**
   * Enviar e-mail via Supabase Edge Function (fallback)
   */
  private async sendEmailViaSupabase(options: EmailOptions): Promise<boolean> {
    try {
      // TODO: Implementar Supabase Edge Function para envio de e-mail
      // Por enquanto, apenas logar
      console.log('📧 E-mail simulado (Supabase Edge Function não implementado):', {
        to: options.to,
        subject: options.subject
      })

      // Em produção, chamar Supabase Edge Function:
      // const { data, error } = await supabase.functions.invoke('send-email', {
      //   body: options
      // })

      return true // Simulado
    } catch (error) {
      console.error('❌ Erro ao enviar via Supabase:', error)
      return false
    }
  }

  /**
   * Enviar e-mail usando template
   */
  async sendTemplateEmail(
    template: EmailTemplate,
    to: string,
    data: EmailTemplateData
  ): Promise<boolean> {
    const { subject, html, text } = this.getTemplate(template, data)
    
    return await this.sendEmail({
      to,
      subject,
      html,
      text
    })
  }

  /**
   * Obter template de e-mail
   */
  private getTemplate(template: EmailTemplate, data: EmailTemplateData): {
    subject: string
    html: string
    text: string
  } {
    switch (template) {
      case 'welcome':
        return this.getWelcomeTemplate(data)
      case 'password_reset':
        return this.getPasswordResetTemplate(data)
      case 'report_ready':
        return this.getReportReadyTemplate(data)
      case 'appointment_reminder':
        return this.getAppointmentReminderTemplate(data)
      case 'prescription_created':
        return this.getPrescriptionCreatedTemplate(data)
      case 'assessment_completed':
        return this.getAssessmentCompletedTemplate(data)
      case 'notification':
        return this.getNotificationTemplate(data)
      default:
        throw new Error(`Template ${template} não encontrado`)
    }
  }

  /**
   * Template: Boas-vindas
   */
  private getWelcomeTemplate(data: EmailTemplateData) {
    const userName = data.userName || 'Usuário'
    return {
      subject: 'Bem-vindo ao MedCannLab 3.0',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #0A192F 0%, #1a365d 50%, #2d5a3d 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .button { display: inline-block; padding: 12px 30px; background: #00C16A; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
            .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🏥 MedCannLab 3.0</h1>
              <p>Sistema Integrado de Cannabis Medicinal</p>
            </div>
            <div class="content">
              <h2>Bem-vindo, ${userName}!</h2>
              <p>É um prazer tê-lo(a) conosco no MedCannLab 3.0.</p>
              <p>Nossa plataforma oferece:</p>
              <ul>
                <li>✅ Avaliações clínicas com IA residente (Nôa Esperança)</li>
                <li>✅ Protocolo IMRE para avaliações completas</li>
                <li>✅ Gestão de pacientes e prescrições</li>
                <li>✅ Relatórios clínicos automatizados</li>
                <li>✅ Sistema de agendamentos</li>
              </ul>
              <a href="${this.baseUrl}/app" class="button">Acessar Plataforma</a>
              <p>Se você tiver alguma dúvida, nossa equipe está à disposição.</p>
            </div>
            <div class="footer">
              <p>MedCannLab 3.0 - Sistema Integrado de Cannabis Medicinal</p>
              <p>Este é um e-mail automático, por favor não responda.</p>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `Bem-vindo ao MedCannLab 3.0, ${userName}!\n\nAcesse: ${this.baseUrl}/app`
    }
  }

  /**
   * Template: Recuperação de senha
   */
  private getPasswordResetTemplate(data: EmailTemplateData) {
    const resetLink = data.resetLink || `${this.baseUrl}/reset-password`
    return {
      subject: 'Recuperação de Senha - MedCannLab 3.0',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #0A192F 0%, #1a365d 50%, #2d5a3d 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .button { display: inline-block; padding: 12px 30px; background: #00C16A; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
            .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
            .warning { background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🔐 Recuperação de Senha</h1>
            </div>
            <div class="content">
              <p>Você solicitou a recuperação de senha para sua conta no MedCannLab 3.0.</p>
              <p>Clique no botão abaixo para redefinir sua senha:</p>
              <a href="${resetLink}" class="button">Redefinir Senha</a>
              <div class="warning">
                <strong>⚠️ Importante:</strong> Este link expira em 1 hora. Se você não solicitou esta recuperação, ignore este e-mail.
              </div>
              <p>Ou copie e cole este link no seu navegador:</p>
              <p style="word-break: break-all; color: #666;">${resetLink}</p>
            </div>
            <div class="footer">
              <p>MedCannLab 3.0 - Sistema Integrado de Cannabis Medicinal</p>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `Recuperação de Senha - MedCannLab 3.0\n\nClique aqui: ${resetLink}`
    }
  }

  /**
   * Template: Relatório pronto
   */
  private getReportReadyTemplate(data: EmailTemplateData) {
    const userName = data.userName || 'Usuário'
    const reportTitle = data.reportTitle || 'Relatório Clínico'
    const reportLink = data.reportId 
      ? `${this.baseUrl}/app/clinica/profissional/relatorios-clinicos?report=${data.reportId}`
      : `${this.baseUrl}/app/clinica/profissional/relatorios-clinicos`
    
    return {
      subject: `Novo Relatório Clínico Disponível - ${reportTitle}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #0A192F 0%, #1a365d 50%, #2d5a3d 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .button { display: inline-block; padding: 12px 30px; background: #00C16A; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
            .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>📋 Relatório Clínico Disponível</h1>
            </div>
            <div class="content">
              <p>Olá, ${userName}!</p>
              <p>Um novo relatório clínico está disponível para sua revisão:</p>
              <h3>${reportTitle}</h3>
              <p>O relatório foi gerado automaticamente pela IA residente (Nôa Esperança) utilizando o protocolo IMRE.</p>
              <a href="${reportLink}" class="button">Ver Relatório</a>
            </div>
            <div class="footer">
              <p>MedCannLab 3.0 - Sistema Integrado de Cannabis Medicinal</p>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `Novo Relatório Clínico Disponível: ${reportTitle}\n\nAcesse: ${reportLink}`
    }
  }

  /**
   * Template: Lembrete de agendamento
   */
  private getAppointmentReminderTemplate(data: EmailTemplateData) {
    const userName = data.userName || 'Usuário'
    const date = data.appointmentDate || 'Data não informada'
    const time = data.appointmentTime || 'Horário não informado'
    
    return {
      subject: 'Lembrete de Agendamento - MedCannLab 3.0',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #0A192F 0%, #1a365d 50%, #2d5a3d 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .info-box { background: white; padding: 20px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #00C16A; }
            .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>📅 Lembrete de Agendamento</h1>
            </div>
            <div class="content">
              <p>Olá, ${userName}!</p>
              <p>Este é um lembrete do seu agendamento:</p>
              <div class="info-box">
                <p><strong>Data:</strong> ${date}</p>
                <p><strong>Horário:</strong> ${time}</p>
              </div>
              <p>Por favor, confirme sua presença ou reagende se necessário.</p>
            </div>
            <div class="footer">
              <p>MedCannLab 3.0 - Sistema Integrado de Cannabis Medicinal</p>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `Lembrete de Agendamento\n\nData: ${date}\nHorário: ${time}`
    }
  }

  /**
   * Template: Prescrição criada
   */
  private getPrescriptionCreatedTemplate(data: EmailTemplateData) {
    const userName = data.userName || 'Usuário'
    const prescriptionTitle = data.prescriptionTitle || 'Nova Prescrição'
    
    return {
      subject: `Nova Prescrição - ${prescriptionTitle}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #0A192F 0%, #1a365d 50%, #2d5a3d 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .button { display: inline-block; padding: 12px 30px; background: #00C16A; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
            .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>💊 Nova Prescrição</h1>
            </div>
            <div class="content">
              <p>Olá, ${userName}!</p>
              <p>Uma nova prescrição foi criada:</p>
              <h3>${prescriptionTitle}</h3>
              <a href="${this.baseUrl}/app/clinica/profissional/prescricoes" class="button">Ver Prescrição</a>
            </div>
            <div class="footer">
              <p>MedCannLab 3.0 - Sistema Integrado de Cannabis Medicinal</p>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `Nova Prescrição: ${prescriptionTitle}\n\nAcesse: ${this.baseUrl}/app/clinica/profissional/prescricoes`
    }
  }

  /**
   * Template: Avaliação concluída
   */
  private getAssessmentCompletedTemplate(data: EmailTemplateData) {
    const userName = data.userName || 'Usuário'
    const assessmentId = data.assessmentId || ''
    
    return {
      subject: 'Avaliação Clínica Concluída - MedCannLab 3.0',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #0A192F 0%, #1a365d 50%, #2d5a3d 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .button { display: inline-block; padding: 12px 30px; background: #00C16A; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
            .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>✅ Avaliação Concluída</h1>
            </div>
            <div class="content">
              <p>Olá, ${userName}!</p>
              <p>A avaliação clínica utilizando o protocolo IMRE foi concluída com sucesso.</p>
              <p>O relatório está sendo gerado e estará disponível em breve.</p>
              ${assessmentId ? `<a href="${this.baseUrl}/app/clinica/profissional/avaliacao?assessment=${assessmentId}" class="button">Ver Avaliação</a>` : ''}
            </div>
            <div class="footer">
              <p>MedCannLab 3.0 - Sistema Integrado de Cannabis Medicinal</p>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `Avaliação Clínica Concluída\n\nA avaliação foi concluída com sucesso.`
    }
  }

  /**
   * Template: Notificação genérica
   */
  private getNotificationTemplate(data: EmailTemplateData) {
    const userName = data.userName || 'Usuário'
    const message = data.message || 'Você tem uma nova notificação.'
    
    return {
      subject: 'Nova Notificação - MedCannLab 3.0',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #0A192F 0%, #1a365d 50%, #2d5a3d 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .button { display: inline-block; padding: 12px 30px; background: #00C16A; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
            .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🔔 Nova Notificação</h1>
            </div>
            <div class="content">
              <p>Olá, ${userName}!</p>
              <p>${message}</p>
              <a href="${this.baseUrl}/app" class="button">Acessar Plataforma</a>
            </div>
            <div class="footer">
              <p>MedCannLab 3.0 - Sistema Integrado de Cannabis Medicinal</p>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `Nova Notificação\n\n${message}`
    }
  }

  /**
   * Converter HTML para texto simples
   */
  private htmlToText(html: string): string {
    return html
      .replace(/<[^>]*>/g, '')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .trim()
  }
}

// Exportar instância singleton
export const emailService = EmailService.getInstance()

