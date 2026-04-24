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
      // [V1.9.40] Build do contexto com schema PT (como o backend grava desde
      // V1.9.20) + fallback EN para retrocompat. Antes o código lia só chaves
      // EN (chiefComplaint, history, physicalExam, assessment, plan) que nunca
      // existiam no jsonb do banco — a IA recebia "Não informado" em tudo e
      // gerava boilerplate médico genérico. Bug detectado em 24/04/2026 noite
      // ao testar "Aplicar Racionalidade Integrativa" num report com queixa
      // "na boca!" e a IA responder com diagnósticos de pele (celulite,
      // tromboflebite) ignorando a localização.
      //
      // Também aceita `reportContent` como SharedReport wrapper (com .content
      // ou .rawContent aninhados) — alguns callers passam assim.
      const rc: any = reportContent?.rawContent
        ?? reportContent?.content
        ?? reportContent
        ?? {}

      const list = (v?: any): string => {
        if (!Array.isArray(v) || v.length === 0) return 'Não informado'
        return v
          .map((item: any) => {
            if (typeof item === 'string') return item
            if (item && typeof item === 'object') return item.label ?? JSON.stringify(item)
            return String(item)
          })
          .filter(Boolean)
          .join(', ')
      }

      const dev = rc.desenvolvimento_queixa ?? rc.complaintDevelopment ?? {}
      const hist = rc.historia_familiar ?? rc.familyHistory ?? {}
      const perg = rc.perguntas_objetivas ?? rc.objectiveQuestions ?? {}
      const identif = rc.identificacao ?? {}

      const reportContext = `
RELATÓRIO CLÍNICO PARA ANÁLISE:

Paciente: ${identif.nome ?? reportContent?.patient_name ?? 'Não informado'}

Queixa Principal: ${rc.queixa_principal ?? rc.chiefComplaint ?? 'Não informado'}

Lista Indiciária: ${list(rc.lista_indiciaria ?? rc.lista_indiciaria_flat ?? rc.indicativeList)}

Desenvolvimento da Queixa:
- Localização: ${dev.localizacao ?? 'Não informado'}
- Início: ${dev.inicio ?? 'Não informado'}
- Descrição: ${dev.descricao ?? 'Não informado'}
- Fatores de piora: ${list(dev.fatores_piora ?? dev.worseningFactors)}
- Fatores de melhora: ${list(dev.fatores_melhora ?? dev.improvingFactors)}
- Sintomas associados: ${list(dev.sintomas_associados ?? dev.associatedSymptoms)}

História Patológica Pregressa: ${list(rc.historia_patologica_pregressa ?? rc.pastMedicalHistory)}
História Familiar: materno=${list(hist.lado_materno ?? hist.maternal)} | paterno=${list(hist.lado_paterno ?? hist.paternal)}
Hábitos de Vida: ${list(rc.habitos_vida ?? rc.lifestyle)}

Perguntas Objetivas:
- Alergias: ${perg.alergias ?? 'Não informado'}
- Medicações regulares: ${perg.medicacoes_regulares ?? 'Não informado'}
- Medicações esporádicas: ${perg.medicacoes_esporadicas ?? 'Não informado'}

Consenso do Paciente: ${rc.consenso?.aceito ? 'Aceito' : 'Não informado'}
      `.trim()

      // [V1.9.40] Gate de densidade mínima — evita gerar "análise" com base
      // em "Não informado" em todo lugar. Se AEC não tem queixa + lista +
      // localização, retorna struct com mensagem clara em vez de chamar GPT.
      const hasMinimumData = Boolean(
        (rc.queixa_principal || rc.chiefComplaint) &&
        (
          (Array.isArray(rc.lista_indiciaria) && rc.lista_indiciaria.length > 0) ||
          (Array.isArray(rc.lista_indiciaria_flat) && rc.lista_indiciaria_flat.length > 0)
        )
      )

      if (!hasMinimumData) {
        console.warn('[rationality] Densidade insuficiente — AEC sem queixa+lista. Retornando fallback estruturado.', {
          tem_queixa: Boolean(rc.queixa_principal || rc.chiefComplaint),
          n_lista: (rc.lista_indiciaria?.length ?? rc.lista_indiciaria_flat?.length) ?? 0
        })
        return {
          assessment: '⚠️ Relatório sem densidade clínica suficiente para análise por racionalidade. Avaliação AEC incompleta — falta queixa principal ou lista indiciária.',
          recommendations: ['Completar a AEC (Arte da Entrevista Clínica) do paciente antes de aplicar racionalidades médicas.'],
          considerations: 'Racionalidades médicas precisam de dado estruturado para gerar hipóteses específicas. Sem queixa e lista indiciária, qualquer análise seria genérica.',
          approach: ''
        }
      }

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
                // [V1.9.40] Schema PT first (queixa_principal), EN fallback.
                // `c.avaliacao` nunca existiu no banco — substituído por structured
                // (markdown narrativo do backend) truncado.
                const queixa = c.queixa_principal || c.chiefComplaint || '—'
                const narr = c.structured || c.assessment || '—'
                return `• [${date}] Queixa: ${String(queixa).substring(0, 200)} | Narrativa: ${String(narr).substring(0, 300)}`
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

      // [V1.9.40] Diretrizes obrigatórias — matam o "boilerplate elegante"
      // forçando uso dos dados do caso em vez de listas genéricas.
      // [V1.9.41] Refinado: nome explícito, raciocínio diferencial (justifica
      // exclusão das hipóteses menos prováveis), parcimônia em exames.
      const analysisRequirements = `
DIRETRIZES OBRIGATÓRIAS DE RESPOSTA:
- Cite explicitamente o NOME do paciente na primeira frase e faça uma síntese clínica de 1 frase usando queixa + localização desse caso específico.
- Considere EXPLICITAMENTE a localização anatômica informada ao propor diagnósticos e exames (evite hipóteses anatomicamente incompatíveis).
- Liste no máximo 3 diagnósticos diferenciais, ordenados por probabilidade clínica para este caso.
- Justifique a hipótese principal referenciando dados específicos do relatório acima.
- Explique por que as hipóteses menos prováveis são menos compatíveis com os dados — raciocínio diferencial, não apenas ranking.
- Só proponha exames complementares se eles puderem MUDAR a conduta clínica. Evite "pedir tudo por pedir".
- Defina conduta concreta em 3 tempos: o que fazer agora, o que observar, quando investigar mais / escalar.
- Considere medicações/exposições relatadas (ex: cannabis, AINEs, alérgenos) ao propor tratamento.
- Evite listas genéricas — cada item deve referenciar um dado do caso.
- Se um campo estiver "Não informado", mencione-o como lacuna a preencher, não invente.`

      // Mensagem completa para a IA (com RAG + diretrizes)
      const fullMessage = `${rationalityPrompt}\n\n${reportContext}${patientHistoryContext}${knowledgeBaseContext}\n${analysisRequirements}\n\nCom base no relatório, no histórico do paciente e nas referências acima, forneça uma análise detalhada e personalizada segundo esta racionalidade médica, seguindo ESTRITAMENTE as diretrizes obrigatórias.`

      // [V1.9.40] Log do payload — salva horas de debug se saída vier estranha.
      // Só os primeiros 1200 chars, evita poluir console com muito RAG.
      // [V1.9.41] Flags determinísticas pra diagnosticar "não recebeu vs ignorou":
      // se has_location=true mas output não menciona local, é prompt ignorando; se false, é dado faltando.
      console.log('[rationality][payload]', rationality, {
        reportContext_head: reportContext.slice(0, 1200),
        has_patient_history: Boolean(patientHistoryContext),
        has_kb: Boolean(knowledgeBaseContext),
        has_location: Boolean(dev.localizacao),
        has_queixa: Boolean(rc.queixa_principal || rc.chiefComplaint),
        has_meds_esp: Boolean(perg.medicacoes_esporadicas),
        n_lista_indiciaria: Array.isArray(rc.lista_indiciaria) ? rc.lista_indiciaria.length : 0
      })

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

