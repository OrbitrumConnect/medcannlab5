import { supabase } from './supabase'

export interface ClinicalReport {
  id: string
  patient_id: string
  patient_name: string
  report_type: 'initial_assessment' | 'follow_up' | 'emergency'
  protocol: 'IMRE'
  content: {
    investigation: string
    methodology: string
    result: string
    evolution: string
    recommendations: string[]
    scores: {
      clinical_score: number
      treatment_adherence: number
      symptom_improvement: number
      quality_of_life: number
    }
  }
  generated_by: 'noa_ai' | 'professional' | 'system'
  generated_at: string
  status: 'draft' | 'completed' | 'reviewed'
  professional_id?: string
  professional_name?: string
}

export class ClinicalReportService {
  private static instance: ClinicalReportService
  private reports: ClinicalReport[] = []

  static getInstance(): ClinicalReportService {
    if (!ClinicalReportService.instance) {
      ClinicalReportService.instance = new ClinicalReportService()
    }
    return ClinicalReportService.instance
  }

  // Gerar relatório clínico pela IA residente
  async generateAIReport(
    patientId: string,
    patientName: string,
    assessmentData: any
  ): Promise<ClinicalReport> {
    // V1.9.213 — Dedupe defensivo no banco (5 min TTL).
    //
    // Bug observado 11/05/2026: 5 reports duplicados criados em 56s pra
    // mesmo paciente (Pedro admin 17345b36). Gate in-memory V1.9.25
    // (clinicalAssessmentFlow.isReportDispatched) NÃO PERSISTE entre
    // sessões — fechou app, reabriu, gerou múltiplos reports em loop.
    //
    // Fix: verifica banco antes de criar. Se já existe report do mesmo
    // paciente gerado pela IA nos últimos 5min, REUSAR em vez de INSERT.
    // Princípio: defesa em depth (Princípio 4) + sistema real > abstrato
    // (Princípio 51).
    try {
      const fiveMinAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString()
      const { data: recentReport } = await supabase
        .from('clinical_reports')
        .select('*')
        .eq('patient_id', patientId)
        .eq('generated_by', 'noa_ai')
        .gte('generated_at', fiveMinAgo)
        .order('generated_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      if (recentReport) {
        console.warn(
          '[clinicalReportService] V1.9.213 dedupe — report existente reutilizado:',
          (recentReport as any).id,
          `(criado há ${Math.round((Date.now() - new Date((recentReport as any).generated_at).getTime()) / 1000)}s)`
        )
        return recentReport as unknown as ClinicalReport
      }
    } catch (dedupErr) {
      // Falha silenciosa do dedupe: NÃO bloqueia geração (defesa em depth fail-open).
      // Se SELECT falhar, prossegue com INSERT normal (comportamento pré-V1.9.213).
      console.warn('[clinicalReportService] dedupe check falhou (prosseguindo):', dedupErr)
    }

    const reportId = `report_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

    const report: ClinicalReport = {
      id: reportId,
      patient_id: patientId,
      patient_name: patientName,
      report_type: 'initial_assessment',
      protocol: 'IMRE',
      content: {
        investigation: assessmentData.investigation || 'Dados coletados através da avaliação clínica inicial com IA residente.',
        methodology: assessmentData.methodology || 'Aplicação da Arte da Entrevista Clínica (AEC) com protocolo IMRE.',
        result: assessmentData.result || 'Avaliação clínica inicial concluída com sucesso.',
        evolution: assessmentData.evolution || 'Plano de cuidado personalizado estabelecido.',
        recommendations: assessmentData.recommendations || [
          'Continuar acompanhamento clínico regular',
          'Seguir protocolo de tratamento estabelecido',
          'Manter comunicação com equipe médica'
        ],
        scores: {
          clinical_score: assessmentData.scores?.clinical_score || 0,
          treatment_adherence: assessmentData.scores?.treatment_adherence || 0,
          symptom_improvement: assessmentData.scores?.symptom_improvement || 0,
          quality_of_life: assessmentData.scores?.quality_of_life || 0
        }
      },
      generated_by: 'noa_ai',
      generated_at: new Date().toISOString(),
      status: 'completed'
    }

    // Salvar no banco de dados
    await this.saveReport(report)

    // Adicionar à lista local
    this.reports.push(report)

    // Notificar profissionais e admin
    await this.notifyNewReport(report)

    return report
  }

  // Salvar relatório no banco de dados
  private async saveReport(report: ClinicalReport): Promise<void> {
    try {
      const { error } = await supabase
        .from('clinical_reports')
        .insert([{
          id: report.id,
          patient_id: report.patient_id,
          patient_name: report.patient_name,
          report_type: report.report_type,
          protocol: report.protocol,
          content: report.content,
          generated_by: report.generated_by,
          generated_at: report.generated_at,
          status: report.status,
          professional_id: report.professional_id,
          professional_name: report.professional_name
        }])

      if (error) {
        console.error('Erro ao salvar relatório:', error)
        throw error
      }

      console.log('✅ Relatório clínico salvo:', report.id)
    } catch (error) {
      console.error('Erro ao salvar relatório no banco:', error)
      // Continuar mesmo com erro para não quebrar o fluxo
    }
  }

  // Buscar relatórios do paciente
  async getPatientReports(patientId: string): Promise<ClinicalReport[]> {
    try {
      const { data, error } = await supabase
        .from('clinical_reports')
        .select('*')
        .eq('patient_id', patientId)
        .order('generated_at', { ascending: false })

      if (error) {
        console.error('Erro ao buscar relatórios:', error)
        console.error('Detalhes do erro:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        })
        return []
      }

      return (data || []).map((r: any) => r as ClinicalReport)
    } catch (error) {
      console.error('Erro ao buscar relatórios:', error)
      if (error instanceof Error) {
        console.error('Mensagem do erro:', error.message)
      }
      return []
    }
  }

  // Buscar todos os relatórios (para admin/profissional)
  async getAllReports(): Promise<ClinicalReport[]> {
    try {
      const { data, error } = await supabase
        .from('clinical_reports')
        .select('*')
        .order('generated_at', { ascending: false })

      if (error) {
        console.error('Erro ao buscar todos os relatórios:', error)
        return this.reports
      }

      return (data || []).map((r: any) => r as ClinicalReport)
    } catch (error) {
      console.error('Erro ao buscar todos os relatórios:', error)
      return this.reports
    }
  }

  // Contar relatórios gerados pela IA
  async getAIReportsCount(): Promise<number> {
    try {
      const { count, error } = await supabase
        .from('clinical_reports')
        .select('*', { count: 'exact', head: true })
        .eq('generated_by', 'noa_ai')

      if (error) {
        console.error('Erro ao contar relatórios da IA:', error)
        return this.reports.filter(r => r.generated_by === 'noa_ai').length
      }

      return count || 0
    } catch (error) {
      console.error('Erro ao contar relatórios da IA:', error)
      return this.reports.filter(r => r.generated_by === 'noa_ai').length
    }
  }

  // Notificar sobre novo relatório
  private async notifyNewReport(report: ClinicalReport): Promise<void> {
    try {
      // Criar notificação para profissionais e admin
      const notification = {
        id: `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        type: 'new_clinical_report',
        title: 'Novo Relatório Clínico Gerado',
        message: `A IA residente gerou um novo relatório clínico para ${report.patient_name}`,
        data: {
          report_id: report.id,
          patient_id: report.patient_id,
          patient_name: report.patient_name,
          report_type: report.report_type,
          generated_at: report.generated_at
        },
        created_at: new Date().toISOString(),
        is_read: false
      }

      // Salvar notificação no banco
      await supabase
        .from('notifications')
        .insert([notification])

      console.log('✅ Notificação de novo relatório criada:', notification.id)
    } catch (error) {
      console.error('Erro ao criar notificação:', error)
      // Continuar mesmo com erro
    }
  }

  // Buscar notificações
  async getNotifications(): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50)

      if (error) {
        console.error('Erro ao buscar notificações:', error)
        return []
      }

      return data || []
    } catch (error) {
      console.error('Erro ao buscar notificações:', error)
      return []
    }
  }
}

export const clinicalReportService = ClinicalReportService.getInstance()