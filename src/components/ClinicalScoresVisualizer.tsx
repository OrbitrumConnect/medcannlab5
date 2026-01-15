import { colors, cardStyle, accentGradient } from '../constants/designSystem'

interface ClinicalScore {
    clinical_score: number
    quality_of_life: number
    symptom_improvement: number
    treatment_adherence: number
}

interface ClinicalScoresVisualizerProps {
    scores: ClinicalScore
    recommendations?: string[]
}

export default function ClinicalScoresVisualizer({ scores, recommendations }: ClinicalScoresVisualizerProps) {
    const scoreItems = [
        { label: 'Score Clínico', value: scores.clinical_score, color: '#00C16A', icon: '🏥' },
        { label: 'Qualidade de Vida', value: scores.quality_of_life, color: '#FFD33D', icon: '😊' },
        { label: 'Melhora de Sintomas', value: scores.symptom_improvement, color: '#4F9FFF', icon: '📈' },
        { label: 'Aderência ao Tratamento', value: scores.treatment_adherence, color: '#9B59B6', icon: '💊' }
    ]

    const getScoreColor = (value: number) => {
        if (value >= 80) return colors.primary
        if (value >= 60) return '#FFD33D'
        if (value >= 40) return '#FFA500'
        return '#FF6B6B'
    }

    const totalScore = (scores.clinical_score + scores.quality_of_life + scores.symptom_improvement + scores.treatment_adherence) / 4

    return (
        <div className="space-y-6">
            {/* Score Geral */}
            <div className="rounded-2xl p-8 text-center" style={{
                ...cardStyle,
                background: `linear-gradient(135deg, rgba(0, 193, 106, 0.1) 0%, rgba(15, 36, 60, 0.9) 100%)`
            }}>
                <div className="text-sm font-semibold mb-2" style={{ color: colors.text.secondary }}>
                    📊 Score Geral da Avaliação
                </div>
                <div className="text-6xl font-bold mb-2" style={{
                    color: getScoreColor(totalScore),
                    textShadow: `0 0 20px ${getScoreColor(totalScore)}40`
                }}>
                    {totalScore.toFixed(0)}
                </div>
                <div className="text-xs" style={{ color: colors.text.tertiary }}>
                    Média de todos os indicadores
                </div>

                {/* Barra de progresso */}
                <div className="mt-4 h-3 rounded-full overflow-hidden" style={{ background: 'rgba(0,0,0,0.3)' }}>
                    <div
                        className="h-full transition-all duration-1000"
                        style={{
                            width: `${totalScore}%`,
                            background: accentGradient
                        }}
                    />
                </div>
            </div>

            {/* Scores Individuais */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {scoreItems.map((item, index) => (
                    <div
                        key={index}
                        className="rounded-xl p-6 relative overflow-hidden"
                        style={cardStyle}
                    >
                        {/* Gradiente de fundo baseado no score */}
                        <div
                            className="absolute inset-0 opacity-10"
                            style={{
                                background: `linear-gradient(135deg, ${item.color} 0%, transparent 100%)`
                            }}
                        />

                        <div className="relative z-10">
                            <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center gap-2">
                                    <span className="text-2xl">{item.icon}</span>
                                    <span className="text-sm font-semibold" style={{ color: colors.text.secondary }}>
                                        {item.label}
                                    </span>
                                </div>
                                <div className="text-3xl font-bold" style={{ color: item.color }}>
                                    {item.value}
                                </div>
                            </div>

                            {/* Mini barra de progresso */}
                            <div className="h-2 rounded-full overflow-hidden" style={{ background: 'rgba(0,0,0,0.3)' }}>
                                <div
                                    className="h-full transition-all duration-700"
                                    style={{
                                        width: `${item.value}%`,
                                        background: item.color
                                    }}
                                />
                            </div>

                            {/* Status textual */}
                            <div className="mt-2 text-xs" style={{ color: colors.text.tertiary }}>
                                {item.value >= 80 && '✅ Excelente'}
                                {item.value >= 60 && item.value < 80 && '👍 Bom'}
                                {item.value >= 40 && item.value < 60 && '⚠️ Regular'}
                                {item.value < 40 && '❌ Necessita atenção'}
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Gráfico Radar (SVG simples) */}
            <div className="rounded-xl p-6" style={cardStyle}>
                <div className="text-sm font-semibold mb-4" style={{ color: colors.primary }}>
                    🎯 Visão Radar dos Scores
                </div>
                <div className="flex justify-center">
                    <svg width="300" height="300" viewBox="0 0 300 300">
                        {/* Grid circular */}
                        {[20, 40, 60, 80, 100].map((r) => (
                            <circle
                                key={r}
                                cx="150"
                                cy="150"
                                r={r * 1.2}
                                fill="none"
                                stroke="rgba(0, 193, 106, 0.1)"
                                strokeWidth="1"
                            />
                        ))}

                        {/* Linhas radiais */}
                        {scoreItems.map((_, i) => {
                            const angle = (i * 90 - 90) * (Math.PI / 180)
                            const x = 150 + Math.cos(angle) * 120
                            const y = 150 + Math.sin(angle) * 120
                            return (
                                <line
                                    key={i}
                                    x1="150"
                                    y1="150"
                                    x2={x}
                                    y2={y}
                                    stroke="rgba(0, 193, 106, 0.2)"
                                    strokeWidth="1"
                                />
                            )
                        })}

                        {/* Polígono de scores */}
                        <polygon
                            points={scoreItems.map((item, i) => {
                                const angle = (i * 90 - 90) * (Math.PI / 180)
                                const r = (item.value / 100) * 120
                                const x = 150 + Math.cos(angle) * r
                                const y = 150 + Math.sin(angle) * r
                                return `${x},${y}`
                            }).join(' ')}
                            fill={`${colors.primary}40`}
                            stroke={colors.primary}
                            strokeWidth="2"
                        />

                        {/* Pontos */}
                        {scoreItems.map((item, i) => {
                            const angle = (i * 90 - 90) * (Math.PI / 180)
                            const r = (item.value / 100) * 120
                            const x = 150 + Math.cos(angle) * r
                            const y = 150 + Math.sin(angle) * r
                            return (
                                <circle
                                    key={i}
                                    cx={x}
                                    cy={y}
                                    r="5"
                                    fill={item.color}
                                />
                            )
                        })}

                        {/* Labels */}
                        {scoreItems.map((item, i) => {
                            const angle = (i * 90 - 90) * (Math.PI / 180)
                            const x = 150 + Math.cos(angle) * 140
                            const y = 150 + Math.sin(angle) * 140
                            return (
                                <text
                                    key={i}
                                    x={x}
                                    y={y}
                                    textAnchor="middle"
                                    style={{
                                        fill: colors.text.secondary,
                                        fontSize: '11px',
                                        fontWeight: 'bold'
                                    }}
                                >
                                    {item.icon}
                                </text>
                            )
                        })}
                    </svg>
                </div>
            </div>

            {/* Recomendações */}
            {recommendations && recommendations.length > 0 && (
                <div className="rounded-xl p-6" style={cardStyle}>
                    <div className="text-sm font-semibold mb-4" style={{ color: colors.primary }}>
                        💡 Recomendações Clínicas
                    </div>
                    <div className="space-y-2">
                        {recommendations.map((rec, index) => (
                            <div key={index} className="flex items-start gap-3">
                                <span className="text-lg">✓</span>
                                <span className="text-sm" style={{ color: colors.text.secondary }}>
                                    {rec}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    )
}
