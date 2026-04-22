import { supabase } from '../lib/supabase'
import { NoaResidentAI } from '../lib/noaResidentAI'

export type Rationality = 'biomedical' | 'traditional_chinese' | 'ayurvedic' | 'homeopathic' | 'integrative'

interface RationalityAnalysis {
  assessment: string
  recommendations: string[]
  considerations: string
  approach: string
}

const RATIONALITY_PROMPTS: Record<Rationality, string> = {
  biomedical: `Analise este relatório clínico do ponto de vista biomédico ocidental. 
Foque em:
- Diagnósticos diferenciais baseados em evidências
- Exames complementares recomendados
- Protocolos farmacológicos baseados em evidências científicas
- Monitoramento de parâmetros laboratoriais e clínicos
- Interações medicamentosas e contraindicações

Forneça uma análise estruturada com recomendações práticas.`,

  traditional_chinese: `Analise este relatório clínico do ponto de vista da Medicina Tradicional Chinesa (MTC).
Foque em:
- Padrões de desarmonia (Zang-Fu)
- Síndromes identificadas (ex: deficiência de Qi, estagnação de Xue)
- Princípios de tratamento (tonificar, dispersar, harmonizar)
- Pontos de acupuntura relevantes
- Fitoterapia chinesa e formulações clássicas
- Relação com os cinco elementos e meridianos

Forneça uma análise estruturada com recomendações práticas.`,

  ayurvedic: `Analise este relatório clínico do ponto de vista da Medicina Ayurvédica.
Foque em:
- Identificação do dosha predominante (Vata, Pitta, Kapha) e desequilíbrios
- Constituição (Prakriti) e estado atual (Vikriti)
- Agni (fogo digestivo) e Ama (toxinas)
- Recomendações dietéticas (Ahara) baseadas no dosha
- Fitoterapia ayurvédica e formulações
- Práticas de estilo de vida (Dinacharya, Ritucharya)
- Tratamentos de purificação (Panchakarma) se aplicável

Forneça uma análise estruturada com recomendações práticas.`,

  homeopathic: `Analise este relatório clínico do ponto de vista da Homeopatia.
Foque em:
- Sintomas mentais, emocionais e físicos característicos
- Modalidades (o que melhora/piora)
- Miasmas identificados (Psora, Sycosis, Syphilis)
- Remédio constitucional sugerido
- Remédios agudos ou sintomáticos se aplicável
- Potência e posologia recomendadas
- Considerações sobre agravação inicial e direção da cura (Lei de Hering)

Forneça uma análise estruturada com recomendações práticas.`,

  integrative: `Analise este relatório clínico do ponto de vista da Medicina Integrativa.
Foque em:
- Síntese das perspectivas biomédica, MTC, ayurvédica e homeopática
- Abordagem multidisciplinar e complementar
- Integração de terapias convencionais e complementares
- Priorização de intervenções baseada em segurança e evidências
- Plano de tratamento coordenado
- Monitoramento integrado de resultados

Forneça uma análise estruturada com recomendações práticas que integrem múltiplas racionalidades.`
}

export class RationalityAnalysisService {
  private noaAI: NoaResidentAI

  constructor() {
    this.noaAI = new NoaResidentAI()
  }

  /**
   * Gera análise de um relatório clínico segundo uma racionalidade médica específica
   */
  async generateAnalysis(
    reportContent: any,
    rationality: Rationality,
    userId?: string,
    userEmail?: string,
    patientId?: string
  ): Promise<RationalityAnalysis> {
    try {
      // Construir contexto do relatório
      const reportContext = `
RELATÓRIO CLÍNICO PARA ANÁLISE:

Queixa Principal: ${reportContent.chiefComplaint || 'Não informado'}
História: ${reportContent.history || 'Não informado'}
Exame Físico: ${reportContent.physicalExam || 'Não informado'}
Avaliação: ${reportContent.assessment || 'Não informado'}
Plano: ${reportContent.plan || 'Não informado'}
      `.trim()

      // 🧠 RAG: buscar histórico clínico do paciente (outras avaliações + racionalidades anteriores)
      let patientHistoryContext = ''
      if (patientId) {
        try {
          const { data: pastReports } = await (supabase as any)
            .from('clinical_reports')
            .select('id, created_at, content')
            .eq('patient_id', patientId)
            .order('created_at', { ascending: false })
            .limit(5)

          if (pastReports && pastReports.length > 1) {
            const summaries = pastReports
              .filter((r: any) => r.content)
              .slice(0, 3)
              .map((r: any) => {
                const c = r.content || {}
                const date = new Date(r.created_at).toLocaleDateString('pt-BR')
                const queixa = c.chiefComplaint || c.queixa_principal || '—'
                const aval = c.assessment || c.avaliacao || '—'
                return `• [${date}] Queixa: ${String(queixa).substring(0, 200)} | Avaliação: ${String(aval).substring(0, 200)}`
              }).join('\n')
            if (summaries) {
              patientHistoryContext = `\n\nHISTÓRICO CLÍNICO PRÉVIO DO PACIENTE (últimas avaliações):\n${summaries}`
            }
          }

          // Racionalidades já aplicadas anteriormente (visão integrativa)
          const { data: pastRationalities } = await (supabase as any)
            .from('clinical_rationalities')
            .select('rationality_type, assessment, created_at')
            .eq('patient_id', patientId)
            .neq('rationality_type', rationality)
            .order('created_at', { ascending: false })
            .limit(4)

          if (pastRationalities && pastRationalities.length > 0) {
            const ratSummary = pastRationalities
              .map((r: any) => `• ${r.rationality_type}: ${String(r.assessment || '').substring(0, 250)}`)
              .join('\n')
            patientHistoryContext += `\n\nOUTRAS RACIONALIDADES JÁ APLICADAS A ESTE PACIENTE:\n${ratSummary}`
          }
        } catch (ragError) {
          console.warn('⚠️ RAG do paciente falhou (seguindo sem enriquecimento):', ragError)
        }
      }

      // 📚 RAG: buscar documentos da Universidade Digital relacionados à racionalidade
      let knowledgeBaseContext = ''
      try {
        const rationalityKeywords: Record<Rationality, string[]> = {
          biomedical: ['biomedicina', 'farmacologia', 'evidência', 'clínica'],
          traditional_chinese: ['mtc', 'medicina chinesa', 'acupuntura', 'meridiano', 'qi'],
          ayurvedic: ['ayurveda', 'dosha', 'vata', 'pitta', 'kapha'],
          homeopathic: ['homeopatia', 'similitude', 'miasma', 'hahnemann'],
          integrative: ['integrativa', 'holística', 'complementar']
        }
        const keywords = rationalityKeywords[rationality] || []

        if (keywords.length > 0) {
          const orFilter = keywords.map(k => `title.ilike.%${k}%,content.ilike.%${k}%`).join(',')
          const { data: docs } = await (supabase as any)
            .from('documents')
            .select('title, content')
            .or(orFilter)
            .limit(3)

          if (docs && docs.length > 0) {
            const docSummary = docs
              .map((d: any) => `• ${d.title}: ${String(d.content || '').substring(0, 400)}`)
              .join('\n')
            knowledgeBaseContext = `\n\nBASE DE CONHECIMENTO (Universidade Digital):\n${docSummary}`
          }
        }
      } catch (kbError) {
        console.warn('⚠️ RAG da base de conhecimento falhou:', kbError)
      }

      // Prompt específico da racionalidade
      const rationalityPrompt = RATIONALITY_PROMPTS[rationality]

      // Mensagem completa para a IA (com RAG)
      const fullMessage = `${rationalityPrompt}\n\n${reportContext}${patientHistoryContext}${knowledgeBaseContext}\n\nCom base no relatório, no histórico do paciente e nas referências acima, forneça uma análise detalhada e personalizada segundo esta racionalidade médica.`

      // Processar com Nôa
      const response = await this.noaAI.processMessage(
        fullMessage,
        userId,
        userEmail
      )

      // Estruturar resposta
      const analysis: RationalityAnalysis = {
        assessment: response.content,
        recommendations: this.extractRecommendations(response.content),
        considerations: this.extractConsiderations(response.content),
        approach: this.extractApproach(response.content)
      }

      return analysis
    } catch (error) {
      console.error('Erro ao gerar análise de racionalidade:', error)
      throw error
    }
  }

  /**
   * Salva análise de racionalidade no relatório E na tabela clinical_rationalities
   */
  async saveAnalysisToReport(
    reportId: string,
    rationality: Rationality,
    analysis: RationalityAnalysis,
    patientId?: string
  ): Promise<string | null> {
    try {
      // 1. Buscar relatório atual (e patient_id se não fornecido)
      const { data: report, error: fetchError } = await supabase
        .from('clinical_reports')
        .select('content, patient_id')
        .eq('id', reportId)
        .single()

      if (fetchError) throw fetchError

      const resolvedPatientId = patientId || report.patient_id

      // 2. Atualizar campo rationalities no content (retrocompatibilidade)
      const currentContent = (report.content as any) || {}
      const currentRationalities = (currentContent as any).rationalities || {}

      const rationalityKey = rationality === 'traditional_chinese'
        ? 'traditionalChinese'
        : rationality

      currentRationalities[rationalityKey] = {
        assessment: analysis.assessment,
        recommendations: analysis.recommendations,
        considerations: analysis.considerations,
        approach: analysis.approach,
        generatedAt: new Date().toISOString()
      }

      const { error: updateError } = await supabase
        .from('clinical_reports')
        .update({
          content: {
            ...currentContent,
            rationalities: currentRationalities
          }
        })
        .eq('id', reportId)

      if (updateError) throw updateError

      // 3. NOVO: Persistir na tabela clinical_rationalities (queryável)
      let rationalityId: string | null = null
      if (resolvedPatientId) {
        const { data: rationalityRow, error: rationalityError } = await (supabase as any)
          .from('clinical_rationalities')
          .upsert({
            report_id: reportId,
            patient_id: resolvedPatientId,
            rationality_type: rationality,
            assessment: analysis.assessment,
            recommendations: analysis.recommendations,
            considerations: analysis.considerations || '',
            approach: analysis.approach || ''
          }, { onConflict: 'report_id,rationality_type' })
          .select('id')
          .single()

        if (rationalityError) {
          console.error('Erro ao salvar racionalidade estruturada:', rationalityError)
        } else {
          rationalityId = rationalityRow?.id || null
          console.log('✅ Racionalidade persistida em clinical_rationalities:', rationalityId)
        }

        // 4. NOVO: Extrair e salvar eixos clínicos
        try {
          const { extractAxesFromContent, saveAxesForReport } = await import('./clinicalAxesService')
          const axes = extractAxesFromContent(currentContent)
          if (axes.length > 0) {
            await saveAxesForReport(reportId, resolvedPatientId, axes, rationalityId || undefined)
          }
        } catch (axesError) {
          console.error('Erro ao extrair eixos clínicos:', axesError)
        }
      }

      return rationalityId
    } catch (error) {
      console.error('Erro ao salvar análise no relatório:', error)
      throw error
    }
  }

  /**
   * Extrai recomendações da resposta da IA
   */
  private extractRecommendations(content: string): string[] {
    const recommendations: string[] = []
    const lines = content.split('\n')

    let inRecommendations = false
    for (const line of lines) {
      if (line.toLowerCase().includes('recomenda') || line.toLowerCase().includes('sugest')) {
        inRecommendations = true
      }
      if (inRecommendations && (line.startsWith('-') || line.startsWith('•') || line.match(/^\d+\./))) {
        recommendations.push(line.replace(/^[-•\d.\s]+/, '').trim())
      }
    }

    return recommendations.length > 0 ? recommendations : [content.substring(0, 200) + '...']
  }

  /**
   * Extrai considerações da resposta da IA
   */
  private extractConsiderations(content: string): string {
    const considerationsMatch = content.match(/considera[çc][õo]es?[:\s]+(.*?)(?=\n\n|\n[A-Z]|$)/is)
    return considerationsMatch ? considerationsMatch[1].trim() : ''
  }

  /**
   * Extrai abordagem da resposta da IA
   */
  private extractApproach(content: string): string {
    const approachMatch = content.match(/abordagem[:\s]+(.*?)(?=\n\n|\n[A-Z]|$)/is)
    return approachMatch ? approachMatch[1].trim() : content.substring(0, 300)
  }
}

export const rationalityAnalysisService = new RationalityAnalysisService()

