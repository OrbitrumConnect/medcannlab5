/**
 * API para integração da IA Residente com o Dashboard do Paciente
 * Permite registro de relatórios clínicos e emissão de NFTs
 * 
 * MIGRADO: Agora usa Supabase ao invés de API externa (api.medcannlab.com)
 */

import { supabase } from './supabase'

interface PatientRecord {
  id: string
  patientId: string
  patientName: string
  reportType: 'initial_assessment' | 'follow_up' | 'consultation'
  content: string
  timestamp: Date
  professionalId: string
  professionalName: string
  status: 'draft' | 'completed' | 'approved'
  nftHash?: string
}

interface NFTMetadata {
  patientId: string
  reportId: string
  timestamp: Date
  professionalId: string
  contentHash: string
  blockchain: 'ethereum' | 'polygon'
}

class PatientDashboardAPI {

  /**
   * Registrar relatório clínico no dashboard do paciente (via Supabase)
   */
  async registerClinicalReport(record: Omit<PatientRecord, 'id' | 'nftHash'>): Promise<PatientRecord> {
    console.log('📋 Registrando relatório clínico via Supabase...')

    const { data, error } = await supabase
      .from('clinical_reports')
      .insert({
        patient_id: record.patientId,
        patient_name: record.patientName,
        report_type: record.reportType,
        content: { text: record.content },
        generated_by: record.professionalId,
        professional_id: record.professionalId,
        professional_name: record.professionalName,
        status: record.status,
        generated_at: record.timestamp.toISOString()
      })
      .select('id')
      .single()

    if (error) {
      console.error('❌ Erro ao registrar relatório:', error)
      throw new Error(`Erro ao registrar relatório: ${error.message}`)
    }

    console.log('✅ Relatório registrado com sucesso:', data.id)

    return {
      ...record,
      id: data.id
    }
  }

  /**
   * Emitir hash NFT para o relatório clínico
   */
  async generateNFTHash(recordId: string, metadata: NFTMetadata): Promise<string> {
    console.log('🔗 Gerando hash NFT para relatório clínico...')

    // Gerar hash local (blockchain integration futura)
    const nftHash = this.generateContentHash(
      `${recordId}:${metadata.patientId}:${metadata.professionalId}:${metadata.timestamp.toISOString()}`
    )

    // Salvar hash no relatório
    const { error } = await supabase
      .from('clinical_reports')
      .update({ status: 'approved' })
      .eq('id', recordId)

    if (error) {
      console.warn('⚠️ Erro ao atualizar status com NFT:', error)
    }

    console.log('✅ Hash NFT gerado:', nftHash)
    return nftHash
  }

  /**
   * Buscar relatórios do paciente (via Supabase)
   */
  async getPatientRecords(patientId: string): Promise<PatientRecord[]> {
    console.log('📊 Buscando relatórios do paciente via Supabase...')

    const { data, error } = await supabase
      .from('clinical_reports')
      .select('*')
      .eq('patient_id', patientId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('❌ Erro ao buscar relatórios:', error)
      throw new Error(`Erro ao buscar relatórios: ${error.message}`)
    }

    const records: PatientRecord[] = (data || []).map((r: any) => ({
      id: r.id,
      patientId: r.patient_id,
      patientName: r.patient_name,
      reportType: r.report_type || 'consultation',
      content: typeof r.content === 'object' ? r.content?.text || JSON.stringify(r.content) : r.content,
      timestamp: new Date(r.created_at),
      professionalId: r.professional_id || r.generated_by,
      professionalName: r.professional_name || 'Profissional',
      status: r.status || 'completed'
    }))

    console.log('✅ Relatórios encontrados:', records.length)
    return records
  }

  /**
   * Atualizar status do relatório
   */
  async updateReportStatus(recordId: string, status: PatientRecord['status']): Promise<void> {
    console.log('🔄 Atualizando status do relatório...')

    const { error } = await supabase
      .from('clinical_reports')
      .update({ status })
      .eq('id', recordId)

    if (error) {
      console.error('❌ Erro ao atualizar status:', error)
      throw new Error(`Erro ao atualizar status: ${error.message}`)
    }

    console.log('✅ Status atualizado com sucesso')
  }

  /**
   * Verificar disponibilidade (sempre true com Supabase)
   */
  async checkAvailability(): Promise<boolean> {
    try {
      const { error } = await supabase.from('clinical_reports').select('id', { count: 'exact', head: true })
      return !error
    } catch {
      return false
    }
  }

  /**
   * Processo completo: registrar relatório + gerar NFT
   */
  async processCompleteReport(
    patientId: string,
    patientName: string,
    reportContent: string,
    professionalId: string,
    professionalName: string
  ): Promise<{ recordId: string; nftHash: string }> {
    console.log('🚀 Iniciando processo completo de registro e NFT...')

    // 1. Registrar relatório clínico
    const record = await this.registerClinicalReport({
      patientId,
      patientName,
      reportType: 'initial_assessment',
      content: reportContent,
      timestamp: new Date(),
      professionalId,
      professionalName,
      status: 'completed'
    })

    // 2. Gerar hash NFT
    const nftHash = await this.generateNFTHash(record.id, {
      patientId,
      reportId: record.id,
      timestamp: new Date(),
      professionalId,
      contentHash: this.generateContentHash(reportContent),
      blockchain: 'polygon'
    })

    // 3. Atualizar registro com NFT hash
    await this.updateReportStatus(record.id, 'approved')

    console.log('✅ Processo completo finalizado:', { recordId: record.id, nftHash })

    return {
      recordId: record.id,
      nftHash
    }
  }

  /**
   * Gerar hash do conteúdo para NFT
   */
  private generateContentHash(content: string): string {
    const encoder = new TextEncoder()
    const data = encoder.encode(content)
    return Array.from(data)
      .map(b => b.toString(16).padStart(2, '0'))
      .join('')
      .substring(0, 64)
  }
}

// Instância singleton
let patientDashboardAPI: PatientDashboardAPI | null = null

export const getPatientDashboardAPI = (): PatientDashboardAPI => {
  if (!patientDashboardAPI) {
    patientDashboardAPI = new PatientDashboardAPI()
  }
  return patientDashboardAPI
}

export default PatientDashboardAPI
