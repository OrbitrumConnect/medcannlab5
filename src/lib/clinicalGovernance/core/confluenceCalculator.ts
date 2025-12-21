/**
 * Clinical Governance Engine - Confluence Calculator
 * 
 * Calcula confluências (múltiplos indicadores alinhados)
 * Conceito do TradeVision adaptado para clínica
 * 
 * NOVO: Suporta especialidades médicas diferentes
 */

import type { Confluence, PatientContext } from '../types'
import { INDICATOR_WEIGHTS } from '../utils/thresholds'
import { getSpecialtyConfig, isIndicatorRelevant, getIndicatorWeight, type Specialty } from '../utils/specialtyConfigs'
import { logger } from '../utils/logger'

/**
 * Calcular confluências clínicas
 * 
 * @param context - Contexto do paciente
 * @param specialty - Especialidade do profissional (opcional)
 */
export function calculateConfluences(
    context: PatientContext,
    specialty?: Specialty
): {
    confluences: Confluence[]
    totalScore: number
} {
    const confluences: Confluence[] = []
    let totalScore = 35 // Base neutra (igual TradeVision)

    const { currentAssessment, kpiHistory, timeContext } = context
    const specialtyConfig = getSpecialtyConfig(specialty)

    logger.info('ConfluenceCalculator', `Calculando para especialidade: ${specialtyConfig.name}`, {
        indicators: specialtyConfig.indicators.length
    })

    // ============================================================================
    // INDICADORES RENAIS (Nefrologia)
    // ============================================================================

    if (isIndicatorRelevant('creatinina', specialty)) {
        const recentCreatinina = kpiHistory
            .filter(k => k.type === 'creatinina')
            .slice(-2)

        if (recentCreatinina.length >= 2) {
            const [prev, current] = recentCreatinina
            if (current.value > prev.value) {
                const points = getIndicatorWeight('creatinina_rising', specialty, INDICATOR_WEIGHTS.creatinina_rising)
                totalScore += points
                confluences.push({
                    indicator: 'Creatinina em Alta',
                    points,
                    reasoning: `Creatinina subiu de ${prev.value} para ${current.value}`,
                    weight: 1.0
                })
            }
        }
    }

    if (isIndicatorRelevant('tfg', specialty)) {
        const recentTFG = kpiHistory
            .filter(k => k.type === 'tfg')
            .slice(-2)

        if (recentTFG.length >= 2) {
            const [prev, current] = recentTFG
            if (current.value < prev.value) {
                const points = getIndicatorWeight('tfg_falling', specialty, INDICATOR_WEIGHTS.tfg_falling)
                totalScore += points
                confluences.push({
                    indicator: 'TFG em Queda',
                    points,
                    reasoning: `TFG caiu de ${prev.value} para ${current.value}`,
                    weight: 1.0
                })
            }
        }
    }

    if (isIndicatorRelevant('proteinuria', specialty)) {
        if (currentAssessment.imreData?.renal?.proteinuria !== 'negativa') {
            const points = getIndicatorWeight('proteinuria_positive', specialty, INDICATOR_WEIGHTS.proteinuria_positive)
            totalScore += points
            confluences.push({
                indicator: 'Proteinúria Detectada',
                points,
                reasoning: `Proteinúria: ${currentAssessment.imreData.renal.proteinuria}`,
                weight: 1.0
            })
        }
    }

    // ============================================================================
    // INDICADORES GERAIS (Todas especialidades)
    // ============================================================================

    // Múltiplos ajustes de protocolo
    if (context.prescriptionHistory.length >= 3) {
        const points = getIndicatorWeight('multiple_adjustments', specialty, INDICATOR_WEIGHTS.multiple_adjustments)
        totalScore += points
        confluences.push({
            indicator: 'Múltiplos Ajustes',
            points,
            reasoning: `${context.prescriptionHistory.length} ajustes de protocolo`,
            weight: 1.0
        })
    }

    // Tempo sem melhora
    if (timeContext.daysSinceLastChange > 60) {
        const points = getIndicatorWeight('days_without_improvement', specialty, INDICATOR_WEIGHTS.days_without_improvement)
        totalScore += points
        confluences.push({
            indicator: 'Estagnação Prolongada',
            points,
            reasoning: `${timeContext.daysSinceLastChange} dias sem mudanças`,
            weight: 1.0
        })
    }

    logger.info('ConfluenceCalculator', 'Confluências calculadas', {
        specialty: specialtyConfig.name,
        count: confluences.length,
        totalScore
    })

    return {
        confluences,
        totalScore
    }
}
