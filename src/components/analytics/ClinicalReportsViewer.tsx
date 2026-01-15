import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import {
    backgroundGradient,
    surfaceStyle,
    cardStyle,
    accentGradient,
    colors
} from '../../constants/designSystem'
import ClinicalScoresVisualizer from '../ClinicalScoresVisualizer'

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

interface ClinicalReportsViewerProps {
    professionalId?: string
    limit?: number
    title?: string
    onContactPatient?: (patientId: string) => void
}

export default function ClinicalReportsViewer({
    professionalId,
    limit = 50,
    title = "📋 Relatórios Clínicos",
    onContactPatient
}: ClinicalReportsViewerProps) {
    const [reports, setReports] = useState<ClinicalReport[]>([])
    const [selectedReport, setSelectedReport] = useState<ClinicalReport | null>(null)
    const [loading, setLoading] = useState(true)

    // Paginação
    const [page, setPage] = useState(0)
    const pageSize = 12 // Múltiplo de 2 e 3 e 4 para ficar bonito no grid
    const [totalReportsCount, setTotalReportsCount] = useState(0) // To store total count for pagination

    // Helper para detectar score crítico
    const isCritical = (content: any) => {
        if (!content?.scores) return false
        // Se qualquer score for menor que 50, considera crítico
        return Object.values(content.scores).some((val: any) => typeof val === 'number' && val < 50)
    }


    useEffect(() => {
        loadData()
    }, [professionalId, page]) // Added 'page' to dependencies

    async function loadData() {
        setLoading(true)
        try {
            let query = supabase
                .from('clinical_reports')
                .select('*', { count: 'exact' }) // Request exact count
                .order('generated_at', { ascending: false })
                .range(page * pageSize, (page + 1) * pageSize - 1) // Apply pagination range

            if (professionalId) {
                // Se houver um campo professional_id na tabela, filtra por ele
                // Nota: O schema pode ter 'doctor_id' ou 'professional_id'. 
                // Assumindo 'professional_id' baseado no padrão, mas se falhar, verificarei.
                // Como user mencionou 'igual ricardo', deve ser os relatórios gerados
                // que muitas vezes estão associados ao professional_id
                query = query.eq('professional_id', professionalId)
            }

            const { data, error, count } = await query // Destructure count

            if (!error && data) {
                setReports(data)
                setTotalReportsCount(count || 0) // Update total count
            }
        } catch (error) {
            console.error('Erro ao carregar relatórios:', error)
        } finally {
            setLoading(false)
        }
    }

    if (loading && page === 0) { // Only show full spinner on initial load
        return (
            <div className="rounded-2xl p-12 text-center" style={surfaceStyle}>
                <div className="animate-spin rounded-full h-12 w-12 border-b-4 mx-auto mb-4" style={{ borderColor: colors.primary }}></div>
                <p style={{ color: colors.text.secondary }}>Carregando relatórios...</p>
            </div>
        )
    }

    if (selectedReport) {
        const critical = isCritical(selectedReport.content)

        return (
            <div className="rounded-2xl p-6 animate-in fade-in slide-in-from-bottom-4 duration-300" style={surfaceStyle}>
                <div className="flex justify-between items-center mb-6">
                    <button
                        onClick={() => setSelectedReport(null)}
                        style={{ color: colors.primary }}
                        className="hover:underline flex items-center gap-2 font-semibold"
                    >
                        ← Voltar para lista
                    </button>

                    <div className="flex items-center gap-3">
                        {onContactPatient && (
                            <button
                                onClick={() => onContactPatient(selectedReport.patient_id)}
                                className={`px-4 py-2 rounded-lg font-bold text-sm flex items-center gap-2 transition-all ${critical
                                    ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30 border border-red-500/50 animate-pulse'
                                    : 'bg-blue-500/20 text-blue-400 hover:bg-blue-500/30'
                                    }`}
                            >
                                {critical ? '🚨 ALERTA: CHAMAR PACIENTE' : '💬 Iniciar Chat'}
                            </button>
                        )}
                        <div className="text-xs px-3 py-1 rounded-full" style={{
                            background: 'rgba(255,255,255,0.05)',
                            color: colors.text.tertiary
                        }}>
                            ID: {selectedReport.id.substring(0, 8)}...
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                    {[
                        { label: 'Paciente', value: selectedReport.patient_name || 'N/A' },
                        { label: 'Protocolo', value: selectedReport.protocol },
                        { label: 'Tipo', value: selectedReport.report_type },
                        { label: 'Data', value: new Date(selectedReport.generated_at).toLocaleDateString('pt-BR') }
                    ].map(({ label, value }) => (
                        <div key={label} className="p-4 rounded-xl" style={cardStyle}>
                            <div className="text-xs mb-1" style={{ color: colors.text.tertiary }}>{label}</div>
                            <div className="font-semibold" style={{ color: colors.text.primary }}>
                                {value}
                            </div>
                        </div>
                    ))}
                </div>

                {/* VISUALIZAÇÃO DE SCORES */}
                {selectedReport.content?.scores ? (
                    <div className="mb-8">
                        <ClinicalScoresVisualizer
                            scores={selectedReport.content.scores}
                            recommendations={selectedReport.content.recommendations}
                        />
                    </div>
                ) : (
                    <div className="p-6 rounded-xl mb-6 text-center" style={cardStyle}>
                        <p style={{ color: colors.text.secondary }}>
                            ⚠️ Este relatório não possui dados de score estruturados.
                        </p>
                    </div>
                )}

                {/* DEBUG / JSON VISUALIZER - Opcional para profissional, mas útil */}
                <details className="group">
                    <summary className="cursor-pointer p-4 rounded-xl flex items-center gap-2" style={cardStyle}>
                        <span style={{ color: colors.primary }}>🛠️ Ver dados brutos (JSON)</span>
                        <span className="text-xs ml-auto transition-transform group-open:rotate-180" style={{ color: colors.text.tertiary }}>▼</span>
                    </summary>
                    <div className="mt-4 p-4 rounded-xl overflow-hidden" style={{ background: 'rgba(0,0,0,0.3)' }}>
                        <pre className="text-xs overflow-x-auto" style={{ color: colors.text.secondary }}>
                            {JSON.stringify(selectedReport.content, null, 2)}
                        </pre>
                    </div>
                </details>
            </div>
        )
    }

    // LIST VIEW (GRID)
    const totalPages = Math.ceil(totalReportsCount / pageSize)

    return (
        <div className="rounded-2xl p-6 h-full flex flex-col" style={surfaceStyle}>
            <div className="flex justify-between items-center mb-6 shrink-0">
                <h2 className="text-xl font-bold" style={{ color: colors.text.primary }}>
                    {title}
                </h2>
                <div className="flex gap-2">
                    <button
                        disabled={page === 0 || loading}
                        onClick={() => setPage(p => Math.max(0, p - 1))}
                        className="text-xs px-3 py-1 rounded-lg disabled:opacity-30 transition-all hover:bg-white/10"
                        style={{ border: `1px solid ${colors.border.primary}`, color: colors.text.secondary }}
                    >
                        ◀ Anterior
                    </button>
                    <div className="text-xs px-3 py-1 rounded-full flex items-center" style={{ background: 'rgba(255,255,255,0.05)', color: colors.text.secondary }}>
                        Página {page + 1} de {totalPages || 1}
                    </div>
                    <button
                        disabled={reports.length < pageSize || loading || page >= totalPages - 1}
                        onClick={() => setPage(p => p + 1)}
                        className="text-xs px-3 py-1 rounded-lg disabled:opacity-30 transition-all hover:bg-white/10"
                        style={{ border: `1px solid ${colors.border.primary}`, color: colors.text.secondary }}
                    >
                        Próximo ▶
                    </button>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
                {loading && page > 0 ? ( // Show a smaller spinner when loading subsequent pages
                    <div className="text-center py-12">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 mx-auto mb-4" style={{ borderColor: colors.primary }}></div>
                        <p style={{ color: colors.text.secondary }}>Carregando mais relatórios...</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                        {reports.length > 0 ? (
                            reports.map((report) => (
                                <div
                                    key={report.id}
                                    onClick={() => setSelectedReport(report)}
                                    className="p-4 rounded-xl cursor-pointer transition-all hover:scale-[1.02] group relative overflow-hidden flex flex-col justify-between h-full"
                                    style={cardStyle}
                                >
                                    <div className="absolute left-0 top-0 bottom-0 w-1 transition-all group-hover:w-2" style={{ background: accentGradient }}></div>

                                    <div className="pl-3 mb-3">
                                        <div className="flex justify-between items-start">
                                            <div className="font-bold text-base truncate pr-2" style={{ color: colors.text.primary }}>
                                                {report.patient_name || 'Paciente Sem Nome'}
                                            </div>
                                        </div>
                                        <div className="text-xs mt-1 opacity-70" style={{ color: colors.text.secondary }}>
                                            {new Date(report.generated_at).toLocaleDateString('pt-BR')}
                                        </div>
                                    </div>

                                    <div className="pl-3 flex flex-wrap gap-2 mt-auto">
                                        <span className="px-2 py-1 rounded-md text-[10px] uppercase tracking-wider font-semibold" style={{ background: 'rgba(255,255,255,0.05)', color: colors.text.secondary }}>
                                            {report.protocol}
                                        </span>
                                        <span className="px-2 py-1 rounded-md text-[10px] uppercase tracking-wider font-semibold" style={{ background: 'rgba(0, 193, 106, 0.1)', color: colors.primary }}>
                                            SCORE: {report.content?.scores?.clinical_score || '-'}
                                        </span>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="col-span-full text-center py-12">
                                <div className="text-4xl mb-4">📭</div>
                                <p style={{ color: colors.text.secondary }}>Nenhum relatório encontrado nesta página.</p>
                                {page > 0 && (
                                    <p className="text-sm mt-2" style={{ color: colors.text.tertiary }}>
                                        Tente voltar para a página anterior.
                                    </p>
                                )}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    )
}
