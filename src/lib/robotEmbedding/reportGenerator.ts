/**
 * Gerador de Relatórios para Robôs
 * Gera relatórios automatizados baseados em interações
 */

import { RobotType, InteractionState, RobotReport, ReportData } from './types'
import { clinicalReportService } from '../clinicalReportService'

export class ReportGenerator {
  private robotId: string
  private robotType: RobotType

  constructor(robotId: string, robotType: RobotType) {
    this.robotId = robotId
    this.robotType = robotType
  }

  /**
   * Gera relatório baseado em uma interação
   */
  async generateReport(interaction: InteractionState): Promise<RobotReport> {
    const reportId = `report_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    
    // Preparar dados do relatório baseado no tipo de interação
    const reportData: ReportData = await this.prepareReportData(interaction)

    const report: RobotReport = {
      reportId,
      robotId: this.robotId,
      robotType: this.robotType,
      interactionId: interaction.interactionId,
      type: this.determineReportType(interaction.type),
      data: reportData,
      generatedAt: new Date(),
      protocol: interaction.protocol
    }

    // Salvar relatório no sistema
    await this.saveReport(report)

    return report
  }

  /**
   * Prepara dados do relatório baseado no tipo de interação
   */
  private async prepareReportData(interaction: InteractionState): Promise<ReportData> {
    switch (interaction.type) {
      case 'assessment':
        return {
          participant: {
            id: interaction.participantId || 'unknown',
            type: 'patient'
          },
          assessment: {
            investigation: interaction.data.investigation || {},
            methodology: interaction.data.methodology || {},
            result: interaction.data.result || {},
            evolution: interaction.data.evolution || {}
          }
        }

      case 'monitoring':
        return {
          participant: {
            id: interaction.participantId || 'unknown',
            type: 'patient'
          },
          monitoring: {
            period: {
              start: interaction.startTime,
              end: new Date()
            },
            vitalSigns: interaction.data.vitalSigns || [],
            observations: interaction.data.observations || []
          }
        }

      case 'education':
        return {
          participant: {
            id: interaction.participantId || 'unknown',
            type: 'student'
          },
          summary: {
            interactions: 1,
            duration: Date.now() - interaction.startTime.getTime(),
            keyFindings: interaction.data.keyFindings || [],
            recommendations: interaction.data.recommendations || []
          }
        }

      default:
        return {
          summary: {
            interactions: 1,
            duration: Date.now() - interaction.startTime.getTime(),
            keyFindings: [],
            recommendations: []
          }
        }
    }
  }

  /**
   * Determina o tipo de relatório baseado no tipo de interação
   */
  private determineReportType(interactionType: string): 'assessment' | 'monitoring' | 'incident' | 'summary' {
    switch (interactionType) {
      case 'assessment':
        return 'assessment'
      case 'monitoring':
        return 'monitoring'
      case 'support':
        return 'incident'
      default:
        return 'summary'
    }
  }

  /**
   * Salva relatório no sistema
   */
  private async saveReport(report: RobotReport): Promise<void> {
    try {
      // Se for relatório de avaliação clínica, usar o serviço de relatórios clínicos
      if (report.type === 'assessment' && report.data.assessment) {
        await clinicalReportService.createReport({
          patientId: report.data.participant?.id || 'unknown',
          assessmentId: report.interactionId,
          investigation: JSON.stringify(report.data.assessment.investigation),
          methodology: report.data.assessment.methodology || '',
          result: report.data.assessment.result || '',
          evolution: report.data.assessment.evolution || '',
          generatedBy: this.robotId,
          generatedByType: 'robot'
        })
      }

      console.log(`📄 Relatório ${report.reportId} gerado e salvo com sucesso`)
    } catch (error) {
      console.error('❌ Erro ao salvar relatório:', error)
      throw error
    }
  }
}

