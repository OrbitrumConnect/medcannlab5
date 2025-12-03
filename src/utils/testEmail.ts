// =====================================================
// UTILITÁRIO: TESTE DE ENVIO DE E-MAIL
// =====================================================
// Use este arquivo para testar o sistema de e-mail

import { emailService } from '../services/emailService'

/**
 * Testar envio de e-mail
 * 
 * Uso no console do navegador:
 * import('./utils/testEmail').then(m => m.testEmailSend('seu-email@teste.com'))
 */
export async function testEmailSend(testEmail: string) {
  console.log('🧪 Testando envio de e-mail...')
  console.log('📧 Destinatário:', testEmail)

  try {
    // Verificar se API Key está configurada
    const apiKey = import.meta.env.VITE_EMAIL_API_KEY
    if (!apiKey) {
      console.warn('⚠️ API Key não configurada!')
      console.log('📝 Configure VITE_EMAIL_API_KEY no arquivo .env.local')
      console.log('📖 Veja GUIA_CONFIGURACAO_EMAIL.md para instruções')
      return false
    }

    console.log('✅ API Key configurada')

    // Testar template de boas-vindas
    console.log('📨 Enviando e-mail de teste (template: welcome)...')
    const result = await emailService.sendTemplateEmail('welcome', testEmail, {
      userName: 'Usuário de Teste'
    })

    if (result) {
      console.log('✅ E-mail enviado com sucesso!')
      console.log('📬 Verifique sua caixa de entrada (e spam)')
      return true
    } else {
      console.error('❌ Falha ao enviar e-mail')
      return false
    }
  } catch (error) {
    console.error('❌ Erro ao testar e-mail:', error)
    return false
  }
}

/**
 * Testar todos os templates
 */
export async function testAllTemplates(testEmail: string) {
  console.log('🧪 Testando todos os templates...')

  const templates = [
    'welcome',
    'password_reset',
    'report_ready',
    'appointment_reminder',
    'prescription_created',
    'assessment_completed',
    'notification'
  ]

  const results: Record<string, boolean> = {}

  for (const template of templates) {
    console.log(`\n📨 Testando template: ${template}...`)
    try {
      const result = await emailService.sendTemplateEmail(template, testEmail, {
        userName: 'Usuário de Teste',
        reportId: 'test-report-123',
        reportTitle: 'Relatório de Teste',
        appointmentDate: '15/01/2025',
        appointmentTime: '14:00',
        prescriptionTitle: 'Prescrição de Teste',
        assessmentId: 'test-assessment-123',
        resetLink: 'https://medcanlab.com.br/reset-password?token=test',
        message: 'Esta é uma mensagem de teste'
      })
      results[template] = result
      console.log(result ? '✅ Sucesso' : '❌ Falha')
    } catch (error) {
      console.error(`❌ Erro no template ${template}:`, error)
      results[template] = false
    }
  }

  console.log('\n📊 Resultados:')
  console.table(results)

  return results
}

