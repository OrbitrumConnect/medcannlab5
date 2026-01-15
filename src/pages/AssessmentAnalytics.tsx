import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import {
    backgroundGradient,
    surfaceStyle,
    cardStyle,
    accentGradient,
    colors
} from '../constants/designSystem'

interface ClinicalReport {
    id: string
    patient_id: string
    patient_name: string
    report_type: string
    protocol: string
    generated_by: string
    generated_at: string
    status: string
    content: any
}

interface SavedDocument {
    id: string
    user_id: string
    patient_id: string
    document_type: string
    title: string
    summary: string | null
    content: string
    metadata: any
    is_shared_with_patient: boolean
    created_at: string
}

interface ScoreMetric {
    date: string
    total_assessments: number
    completed_assessments: number
    stuck_assessments: number
    avg_score: number
    total_score: number
    completion_rate: number
}

export default function AssessmentAnalytics() {
    const { user } = useAuth()
    const [reports, setReports] = useState<ClinicalReport[]>([])
    const [documents, setDocuments] = useState<SavedDocument[]>([])
    const [scores, setScores] = useState<ScoreMetric[]>([])
    const [selectedReport, setSelectedReport] = useState<ClinicalReport | null>(null)
    const [selectedDocument, setSelectedDocument] = useState<SavedDocument | null>(null)
    const [loading, setLoading] = useState(true)
    const [tab, setTab] = useState<'overview' | 'professional' | 'patient'>('overview')

    useEffect(() => {
        if (user?.type === 'admin') {
            loadData()
        }
    }, [user])

    async function loadData() {
        setLoading(true)
        try {
            const { data: reportsData, error: reportsError } = await supabase
                .from('clinical_reports')
                .select('*')
                .order('generated_at', { ascending: false })
                .limit(50)

            if (!reportsError && reportsData) {
                setReports(reportsData)
            }

            const { data: docsData, error: docsError } = await supabase
                .from('ai_saved_documents')
                .select('*')
                .eq('document_type', 'assessment_report')
                .order('created_at', { ascending: false })
                .limit(50)

            if (!docsError && docsData) {
                setDocuments(docsData)
            }

            // Carregar métricas de qualidade/scores
            const { data: scoresData, error: scoresError } = await supabase
                .from('v_ai_quality_metrics')
                .select('*')
                .order('date', { ascending: false })
                .limit(30) // Últimos 30 dias

            if (!scoresError && scoresData) {
                setScores(scoresData.reverse()) // Inverter para ordem crescente no gráfico
            }
        } catch (error) {
            console.error('Erro ao carregar dados:', error)
        } finally {
            setLoading(false)
        }
    }

    if (user?.type !== 'admin') {
        return (
            <div className="min-h-screen p-8" style={{ background: backgroundGradient }}>
                <div className="max-w-4xl mx-auto rounded-2xl p-8 text-center" style={surfaceStyle}>
                    <h1 className="text-2xl font-bold text-red-400">⚠️ Acesso Negado</h1>
                    <p className="mt-4" style={{ color: colors.text.secondary }}>
                        Esta página é exclusiva para administradores.
                    </p>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen p-8" style={{ background: backgroundGradient }}>
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="rounded-2xl p-8 mb-8" style={surfaceStyle}>
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <h1 className="text-3xl font-bold" style={{
                                background: accentGradient,
                                backgroundClip: 'text',
                                WebkitBackgroundClip: 'text',
                                WebkitTextFillColor: 'transparent'
                            }}>
                                📊 Análise de Avaliações AEC
                            </h1>
                            <p className="mt-2" style={{ color: colors.text.secondary }}>
                                Visualização de relatórios salvos (Profissional vs Paciente)
                            </p>
                        </div>
                        <button
                            onClick={loadData}
                            className="px-6 py-3 rounded-xl font-semibold transition-all hover:scale-105"
                            style={{ background: accentGradient, color: '#FFF' }}
                        >
                            🔄 Atualizar
                        </button>
                    </div>

                    {/* Métricas */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="rounded-xl p-6" style={cardStyle}>
                            <div className="text-sm font-semibold mb-2" style={{ color: colors.primary }}>
                                📋 Relatórios Profissionais
                            </div>
                            <div className="text-3xl font-bold" style={{ color: colors.text.primary }}>
                                {reports.length}
                            </div>
                            <div className="text-xs mt-2" style={{ color: colors.text.tertiary }}>
                                Tabela: clinical_reports
                            </div>
                        </div>

                        <div className="rounded-xl p-6" style={cardStyle}>
                            <div className="text-sm font-semibold mb-2" style={{ color: colors.primary }}>
                                📄 Documentos Pacientes
                            </div>
                            <div className="text-3xl font-bold" style={{ color: colors.text.primary }}>
                                {documents.length}
                            </div>
                            <div className="text-xs mt-2" style={{ color: colors.text.tertiary }}>
                                Tabela: ai_saved_documents
                            </div>
                        </div>

                        <div className="rounded-xl p-6" style={cardStyle}>
                            <div className="text-sm font-semibold mb-2" style={{ color: colors.primary }}>
                                ✅ Taxa de Compartilhamento
                            </div>
                            <div className="text-3xl font-bold" style={{ color: colors.text.primary }}>
                                {documents.length > 0
                                    ? Math.round((documents.filter(d => d.is_shared_with_patient).length / documents.length) * 100)
                                    : 0}%
                            </div>
                            <div className="text-xs mt-2" style={{ color: colors.text.tertiary }}>
                                is_shared_with_patient: true
                            </div>
                        </div>
                    </div>

                    {/* Score System & Growth Chart */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
                        {/* Card de Score Total */}
                        <div className="rounded-xl p-6" style={cardStyle}>
                            <div className="text-sm font-semibold mb-2" style={{ color: colors.primary }}>
                                🎯 Score Total da IA
                            </div>
                            <div className="text-4xl font-bold" style={{
                                color: scores.reduce((sum, s) => sum + (s.total_score || 0), 0) >= 0 ? colors.primary : '#ff6b6b'
                            }}>
                                {scores.reduce((sum, s) => sum + (s.total_score || 0), 0).toFixed(1)}
                            </div>
                            <div className="text-xs mt-2" style={{ color: colors.text.tertiary }}>
                                +1.5 completo | -1.0 travou
                            </div>
                            <div className="mt-4 space-y-1">
                                <div className="flex justify-between text-xs" style={{ color: colors.text.secondary }}>
                                    <span>✅ Completas:</span>
                                    <span className="font-semibold">{scores.reduce((sum, s) => sum + (s.completed_assessments || 0), 0)}</span>
                                </div>
                                <div className="flex justify-between text-xs" style={{ color: colors.text.secondary }}>
                                    <span>❌ Travadas:</span>
                                    <span className="font-semibold">{scores.reduce((sum, s) => sum + (s.stuck_assessments || 0), 0)}</span>
                                </div>
                                <div className="flex justify-between text-xs" style={{ color: colors.text.secondary }}>
                                    <span>📊 Taxa de Sucesso:</span>
                                    <span className="font-semibold">
                                        {scores.length > 0
                                            ? (scores.reduce((sum, s) => sum + (s.completion_rate || 0), 0) / scores.length).toFixed(1)
                                            : 0}%
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Gráfico de Crescimento */}
                        <div className="lg:col-span-2 rounded-xl p-6" style={cardStyle}>
                            <div className="text-sm font-semibold mb-4" style={{ color: colors.primary }}>
                                📈 Curva de Crescimento (Últimos 30 dias)
                            </div>
                            {scores.length > 0 ? (
                                <div className="relative h-48">
                                    <svg width="100%" height="100%" className="overflow-visible">
                                        {/* Grid lines */}
                                        {[0, 25, 50, 75, 100].map((y) => (
                                            <line
                                                key={y}
                                                x1="0"
                                                y1={`${y}%`}
                                                x2="100%"
                                                y2={`${y}%`}
                                                stroke="rgba(0, 193, 106, 0.1)"
                                                strokeWidth="1"
                                            />
                                        ))}

                                        {/* Linha de Avaliações Completas */}
                                        <polyline
                                            fill="none"
                                            stroke={colors.primary}
                                            strokeWidth="3"
                                            points={scores.map((s, i) => {
                                                const x = (i / (scores.length - 1)) * 100
                                                const maxValue = Math.max(...scores.map(s => s.completed_assessments || 0))
                                                const y = 100 - ((s.completed_assessments || 0) / (maxValue || 1)) * 100
                                                return `${x},${y}`
                                            }).join(' ')}
                                        />

                                        {/* Pontos */}
                                        {scores.map((s, i) => {
                                            const x = (i / (scores.length - 1)) * 100
                                            const maxValue = Math.max(...scores.map(s => s.completed_assessments || 0))
                                            const y = 100 - ((s.completed_assessments || 0) / (maxValue || 1)) * 100
                                            return (
                                                <circle
                                                    key={i}
                                                    cx={`${x}%`}
                                                    cy={`${y}%`}
                                                    r="4"
                                                    fill={colors.primary}
                                                />
                                            )
                                        })}
                                    </svg>
                                    <div className="flex justify-between mt-2 text-xs" style={{ color: colors.text.tertiary }}>
                                        <span>{scores[0]?.date ? new Date(scores[0].date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }) : ''}</span>
                                        <span>Hoje</span>
                                    </div>
                                </div>
                            ) : (
                                <div className="h-48 flex items-center justify-center" style={{ color: colors.text.tertiary }}>
                                    Nenhum dado disponível ainda.
                                    <br />
                                    <span className="text-xs mt-2">Execute o script CREATE_AI_SCORE_SYSTEM.sql</span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Tabs */}
                <div className="rounded-2xl p-2 mb-8" style={surfaceStyle}>
                    <div className="flex gap-2">
                        {[
                            { id: 'overview', label: '📊 Visão Geral' },
                            { id: 'professional', label: '👨‍⚕️ Visão Profissional' },
                            { id: 'patient', label: '🧑‍🦰 Visão Paciente' }
                        ].map(({ id, label }) => (
                            <button
                                key={id}
                                onClick={() => setTab(id as any)}
                                className="flex-1 py-3 px-6 rounded-xl font-semibold transition-all"
                                style={tab === id ? {
                                    background: accentGradient,
                                    color: '#FFF'
                                } : {
                                    color: colors.text.secondary,
                                    background: 'rgba(255,255,255,0.05)'
                                }}
                            >
                                {label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Content */}
                {loading ? (
                    <div className="rounded-2xl p-12 text-center" style={surfaceStyle}>
                        <div className="animate-spin rounded-full h-16 w-16 border-b-4 mx-auto" style={{ borderColor: colors.primary }}></div>
                        <p className="mt-4" style={{ color: colors.text.secondary }}>Carregando dados...</p>
                    </div>
                ) : (
                    <>
                        {/* Overview Tab */}
                        {tab === 'overview' && (
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                {/* Relatórios */}
                                <div className="rounded-2xl p-6" style={surfaceStyle}>
                                    <h2 className="text-xl font-bold mb-4" style={{ color: colors.text.primary }}>
                                        📋 Últimos Relatórios Profissionais
                                    </h2>
                                    <div className="space-y-3 max-h-96 overflow-y-auto">
                                        {reports.slice(0, 10).map((report) => (
                                            <div
                                                key={report.id}
                                                onClick={() => setSelectedReport(report)}
                                                className="p-4 rounded-xl cursor-pointer transition-all hover:scale-[1.02]"
                                                style={cardStyle}
                                            >
                                                <div className="flex justify-between items-start mb-2">
                                                    <div className="font-semibold" style={{ color: colors.text.primary }}>
                                                        {report.patient_name || 'Sem nome'}
                                                    </div>
                                                    <div className="text-xs px-3 py-1 rounded-full" style={{
                                                        color: colors.primary,
                                                        background: 'rgba(0, 193, 106, 0.2)'
                                                    }}>
                                                        {report.protocol}
                                                    </div>
                                                </div>
                                                <div className="text-sm" style={{ color: colors.text.secondary }}>
                                                    {new Date(report.generated_at).toLocaleString('pt-BR')}
                                                </div>
                                                <div className="text-xs mt-1" style={{ color: colors.text.tertiary }}>
                                                    ID: {report.id.substring(0, 20)}...
                                                </div>
                                            </div>
                                        ))}
                                        {reports.length === 0 && (
                                            <div className="text-center py-8" style={{ color: colors.text.tertiary }}>
                                                Nenhum relatório encontrado
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Documentos */}
                                <div className="rounded-2xl p-6" style={surfaceStyle}>
                                    <h2 className="text-xl font-bold mb-4" style={{ color: colors.text.primary }}>
                                        📄 Últimos Documentos Pacientes
                                    </h2>
                                    <div className="space-y-3 max-h-96 overflow-y-auto">
                                        {documents.slice(0, 10).map((doc) => (
                                            <div
                                                key={doc.id}
                                                onClick={() => setSelectedDocument(doc)}
                                                className="p-4 rounded-xl cursor-pointer transition-all hover:scale-[1.02]"
                                                style={cardStyle}
                                            >
                                                <div className="flex justify-between items-start mb-2">
                                                    <div className="font-semibold text-sm" style={{ color: colors.text.primary }}>
                                                        {doc.title}
                                                    </div>
                                                    {doc.is_shared_with_patient && (
                                                        <div className="text-xs px-3 py-1 rounded-full" style={{
                                                            color: colors.primary,
                                                            background: 'rgba(0, 193, 106, 0.2)'
                                                        }}>
                                                            ✅ Compartilhado
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="text-xs line-clamp-2" style={{ color: colors.text.secondary }}>
                                                    {doc.summary}
                                                </div>
                                                <div className="text-xs mt-2" style={{ color: colors.text.tertiary }}>
                                                    {new Date(doc.created_at).toLocaleString('pt-BR')}
                                                </div>
                                            </div>
                                        ))}
                                        {documents.length === 0 && (
                                            <div className="text-center py-8" style={{ color: colors.text.tertiary }}>
                                                Nenhum documento encontrado
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Professional Tab */}
                        {tab === 'professional' && (
                            <div className="rounded-2xl p-6" style={surfaceStyle}>
                                <h2 className="text-2xl font-bold mb-6" style={{ color: colors.text.primary }}>
                                    👨‍⚕️ Como o Profissional Vê (clinical_reports)
                                </h2>
                                {selectedReport ? (
                                    <div className="space-y-6">
                                        <div className="flex justify-between items-center">
                                            <button
                                                onClick={() => setSelectedReport(null)}
                                                style={{ color: colors.primary }}
                                                className="hover:underline"
                                            >
                                                ← Voltar
                                            </button>
                                            <div className="text-sm" style={{ color: colors.text.tertiary }}>
                                                ID: {selectedReport.id}
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                            {[
                                                { label: 'Paciente', value: selectedReport.patient_name },
                                                { label: 'Protocolo', value: selectedReport.protocol },
                                                { label: 'Tipo', value: selectedReport.report_type },
                                                { label: 'Status', value: selectedReport.status }
                                            ].map(({ label, value }) => (
                                                <div key={label} className="p-4 rounded-xl" style={cardStyle}>
                                                    <div className="text-xs mb-1" style={{ color: colors.text.tertiary }}>{label}</div>
                                                    <div className="font-semibold" style={{ color: colors.text.primary }}>
                                                        {value}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>

                                        <div className="p-6 rounded-xl" style={cardStyle}>
                                            <h3 className="font-bold mb-4" style={{ color: colors.text.primary }}>
                                                📋 Conteúdo Estruturado:
                                            </h3>
                                            <pre className="text-xs p-4 rounded-lg overflow-x-auto" style={{
                                                background: 'rgba(0,0,0,0.3)',
                                                color: colors.text.secondary,
                                                border: `1px solid ${colors.border.primary}`
                                            }}>
                                                {JSON.stringify(selectedReport.content, null, 2)}
                                            </pre>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="text-center py-12" style={{ color: colors.text.tertiary }}>
                                        Selecione um relatório na aba "Visão Geral"
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Patient Tab */}
                        {tab === 'patient' && (
                            <div className="rounded-2xl p-6" style={surfaceStyle}>
                                <h2 className="text-2xl font-bold mb-6" style={{ color: colors.text.primary }}>
                                    🧑‍🦰 Como o Paciente Vê (ai_saved_documents)
                                </h2>
                                {selectedDocument ? (
                                    <div className="space-y-6">
                                        <div className="flex justify-between items-center">
                                            <button
                                                onClick={() => setSelectedDocument(null)}
                                                style={{ color: colors.primary }}
                                                className="hover:underline"
                                            >
                                                ← Voltar
                                            </button>
                                            <div className="text-sm" style={{ color: colors.text.tertiary }}>
                                                ID: {selectedDocument.id}
                                            </div>
                                        </div>

                                        <div className="p-8 rounded-2xl" style={cardStyle}>
                                            <div className="flex items-center justify-between mb-4">
                                                <h3 className="text-2xl font-bold" style={{ color: colors.text.primary }}>
                                                    {selectedDocument.title}
                                                </h3>
                                                {selectedDocument.is_shared_with_patient && (
                                                    <div className="px-4 py-2 rounded-full text-sm font-semibold" style={{
                                                        background: 'rgba(0, 193, 106, 0.2)',
                                                        color: colors.primary
                                                    }}>
                                                        ✅ Compartilhado com você
                                                    </div>
                                                )}
                                            </div>

                                            <div className="p-6 rounded-xl mb-4" style={{
                                                background: 'rgba(255,255,255,0.05)',
                                                border: `1px solid ${colors.border.primary}`
                                            }}>
                                                <h4 className="font-semibold mb-2" style={{ color: colors.text.primary }}>
                                                    📝 Resumo:
                                                </h4>
                                                <p style={{ color: colors.text.secondary }}>{selectedDocument.summary}</p>
                                            </div>

                                            <div className="p-6 rounded-xl" style={{
                                                background: 'rgba(255,255,255,0.05)',
                                                border: `1px solid ${colors.border.primary}`
                                            }}>
                                                <h4 className="font-semibold mb-2" style={{ color: colors.text.primary }}>
                                                    📊 Detalhes:
                                                </h4>
                                                <div className="text-sm space-y-1" style={{ color: colors.text.secondary }}>
                                                    <div>
                                                        <strong>Data:</strong>{' '}
                                                        {new Date(selectedDocument.created_at).toLocaleString('pt-BR')}
                                                    </div>
                                                    <div>
                                                        <strong>Tipo:</strong> {selectedDocument.document_type}
                                                    </div>
                                                    {selectedDocument.metadata && (
                                                        <div>
                                                            <strong>Protocolo:</strong> {selectedDocument.metadata.protocol || 'N/A'}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            <details className="mt-4">
                                                <summary className="cursor-pointer font-semibold hover:underline" style={{ color: colors.primary }}>
                                                    Ver conteúdo completo
                                                </summary>
                                                <div className="p-4 rounded-xl mt-2" style={{
                                                    background: 'rgba(0,0,0,0.3)',
                                                    border: `1px solid ${colors.border.primary}`
                                                }}>
                                                    <pre className="text-xs overflow-x-auto" style={{ color: colors.text.secondary }}>
                                                        {selectedDocument.content}
                                                    </pre>
                                                </div>
                                            </details>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="text-center py-12" style={{ color: colors.text.tertiary }}>
                                        Selecione um documento na aba "Visão Geral"
                                    </div>
                                )}
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    )
}
