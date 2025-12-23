/**
 * Context Analysis Card
 * 
 * Card visual para exibir análise de governança clínica
 */

import { Brain, TrendingUp, TrendingDown, MinusCircle, AlertTriangle } from 'lucide-react'
import type { ClinicalGovernanceOutput } from '../../lib/clinicalGovernance'
import { PatientState, UrgencyLevel, RecommendationType } from '../../lib/clinicalGovernance'

interface ContextAnalysisCardProps {
    analysis: ClinicalGovernanceOutput | null
    loading?: boolean
}

export function ContextAnalysisCard({ analysis, loading }: ContextAnalysisCardProps) {
    if (loading) {
        return (
            <div className="rounded-xl p-6 bg-gradient-to-r from-purple-900/20 to-indigo-900/20 border border-purple-700/30">
                <div className="animate-pulse">
                    <div className="h-4 bg-purple-700/20 rounded w-1/3 mb-4"></div>
                    <div className="h-3 bg-purple-700/20 rounded w-2/3"></div>
                </div>
            </div>
        )
    }

    if (!analysis) {
        return (
            <div className="rounded-xl p-6 bg-gradient-to-r from-gray-900/20 to-gray-800/20 border border-gray-700/30">
                <div className="flex items-center gap-3 text-gray-400">
                    <Brain className="w-5 h-5" />
                    <p className="text-sm">Análise contextual aguardando dados...</p>
                </div>
            </div>
        )
    }

    // Determinar cores baseado em urgência
    const getUrgencyColors = () => {
        switch (analysis.urgencyLevel) {
            case UrgencyLevel.CRITICAL:
                return {
                    bg: 'from-red-900/20 to-red-800/10',
                    border: 'border-red-700/30',
                    text: 'text-red-300'
                }
            case UrgencyLevel.HIGH:
                return {
                    bg: 'from-orange-900/20 to-orange-800/10',
                    border: 'border-orange-700/30',
                    text: 'text-orange-300'
                }
            case UrgencyLevel.MEDIUM:
                return {
                    bg: 'from-yellow-900/20 to-yellow-800/10',
                    border: 'border-yellow-700/30',
                    text: 'text-yellow-300'
                }
            default:
                return {
                    bg: 'from-green-900/20 to-green-800/10',
                    border: 'border-green-700/30',
                    text: 'text-green-300'
                }
        }
    }

    const colors = getUrgencyColors()

    // Ícone do estado
    const StateIcon = () => {
        switch (analysis.state) {
            case PatientState.IMPROVING:
                return <TrendingUp className="w-5 h-5 text-green-400" />
            case PatientState.DETERIORATING:
            case PatientState.CRITICAL:
                return <TrendingDown className="w-5 h-5 text-red-400" />
            default:
                return <MinusCircle className="w-5 h-5 text-gray-400" />
        }
    }

    return (
        <div className={`rounded-xl p-6 bg-gradient-to-r ${colors.bg} border ${colors.border}`}>
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                    <Brain className="w-6 h-6 text-purple-400" />
                    <h3 className="text-lg font-bold text-white">Análise Contextual (ACDSS)</h3>
                </div>
                {analysis.shouldAlert && (
                    <AlertTriangle className="w-5 h-5 text-orange-400 animate-pulse" />
                )}
            </div>

            {/* Estado e Confiança */}
            <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                    <p className="text-xs text-gray-400 mb-1">Estado</p>
                    <div className="flex items-center gap-2">
                        <StateIcon />
                        <span className={`text-sm font-semibold ${colors.text}`}>
                            {analysis.state === PatientState.STABLE && 'Estável'}
                            {analysis.state === PatientState.IMPROVING && 'Melhorando'}
                            {analysis.state === PatientState.DETERIORATING && 'Deteriorando'}
                            {analysis.state === PatientState.CRITICAL && 'Crítico'}
                            {analysis.state === PatientState.AT_LIMIT && 'No Limite'}
                        </span>
                    </div>
                </div>

                <div>
                    <p className="text-xs text-gray-400 mb-1">Confiança</p>
                    <div className="flex items-center gap-2">
                        <div className="flex-1 bg-gray-700/30 rounded-full h-2">
                            <div
                                className={`h-2 rounded-full ${colors.bg}`}
                                style={{ width: `${Math.min(analysis.confidence, 100)}%` }}
                            />
                        </div>
                        <span className="text-sm font-semibold text-white">
                            {Math.round(analysis.confidence)}%
                        </span>
                    </div>
                </div>
            </div>

            {/* Recomendação */}
            <div className="mb-4">
                <p className="text-xs text-gray-400 mb-1">Recomendação</p>
                <p className="text-sm font-semibold text-white">
                    {analysis.recommendation === RecommendationType.MAINTAIN && '✅ Manter protocolo atual'}
                    {analysis.recommendation === RecommendationType.MONITOR_CLOSELY && '👁️ Monitorar de perto'}
                    {analysis.recommendation === RecommendationType.CONSIDER_CHANGE && '⚠️ Considerar mudança'}
                    {analysis.recommendation === RecommendationType.URGENT_INTERVENTION && '🚨 Intervenção urgente'}
                </p>
            </div>

            {/* Confluências */}
            {analysis.confluences.length > 0 && (
                <div className="mb-4">
                    <p className="text-xs text-gray-400 mb-2">Confluências Detectadas ({analysis.confluences.length})</p>
                    <div className="space-y-1">
                        {analysis.confluences.slice(0, 3).map((conf, idx) => (
                            <div key={idx} className="text-xs text-gray-300 flex items-center gap-2">
                                <span className="text-purple-400">•</span>
                                <span>{conf.indicator}</span>
                                <span className="text-gray-500">+{conf.points}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Insight contextual */}
            <div className="pt-4 border-t border-gray-700/30">
                <p className="text-xs text-gray-400 italic">
                    {analysis.contextualInsight}
                </p>
            </div>

            {/* Footer - Próxima ação */}
            <div className="mt-4 pt-4 border-t border-gray-700/30">
                <p className="text-xs text-gray-500">
                    Próxima avaliação sugerida em: <span className="text-white font-semibold">{analysis.suggestedActionWindow} dias</span>
                </p>
            </div>
        </div>
    )
}
