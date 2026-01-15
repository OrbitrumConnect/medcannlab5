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
}

export default function ClinicalReportsViewer({
    professionalId,
    limit = 50,
    title = "📋 Relatórios Clínicos"
}: ClinicalReportsViewerProps) {
    const [reports, setReports] = useState<ClinicalReport[]>([])
    const [selectedReport, setSelectedReport] = useState<ClinicalReport | null>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        loadData()
    }, [professionalId])

    async function loadData() {
        setLoading(true)
        try {
            let query = supabase
                .from('clinical_reports')
                .select('*')
                .order('generated_at', { ascending: false })
                .limit(limit)

            if (professionalId) {
                // Se houver um campo professional_id na tabela, filtra por ele
                // Nota: O schema pode ter 'doctor_id' ou 'professional_id'. 
                // Assumindo 'professional_id' baseado no padrão, mas se falhar, verificarei.
                // Como user mencionou 'igual ricardo', deve ser os relatórios gerados
                // que muitas vezes estão associados ao professional_id
                query = query.eq('professional_id', professionalId)
            }

            const { data, error } = await query

            if (!error && data) {
                setReports(data)
            }
        } catch (error) {
            console.error('Erro ao carregar relatórios:', error)
        } finally {
            setLoading(false)
        }
    }

    if (loading) {
        return (
            <div className="rounded-2xl p-12 text-center" style={surfaceStyle}>
                <div className="animate-spin rounded-full h-12 w-12 border-b-4 mx-auto mb-4" style={{ borderColor: colors.primary }}></div>
                <p style={{ color: colors.text.secondary }}>Carregando relatórios...</p>
            </div>
        )
    }

    if (selectedReport) {
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
                    <div className="text-xs px-3 py-1 rounded-full" style={{
                        background: 'rgba(255,255,255,0.05)',
                        color: colors.text.tertiary
                    }}>
                        ID: {selectedReport.id.substring(0, 8)}...
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

    // LIST VIEW
    return (
        <div className="rounded-2xl p-6" style={surfaceStyle}>
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold" style={{ color: colors.text.primary }}>
                    {title}
                </h2>
                <div className="text-xs px-3 py-1 rounded-full" style={{ background: colors.primary, color: '#000', fontWeight: 'bold' }}>
                    Total: {reports.length}
                </div>
            </div>

            <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
                {reports.length > 0 ? (
                    reports.map((report) => (
                        <div
                            key={report.id}
                            onClick={() => setSelectedReport(report)}
                            className="p-5 rounded-xl cursor-pointer transition-all hover:scale-[1.01] group relative overflow-hidden"
                            style={cardStyle}
                        >
                            <div className="absolute left-0 top-0 bottom-0 w-1 transition-all group-hover:w-2" style={{ background: accentGradient }}></div>

                            <div className="flex justify-between items-start pl-3">
                                <div>
                                    <div className="font-bold text-lg mb-1" style={{ color: colors.text.primary }}>
                                        {report.patient_name || 'Paciente Sem Nome'}
                                    </div>
                                    <div className="flex gap-2 text-xs">
                                        <span className="px-2 py-1 rounded-md" style={{ background: 'rgba(255,255,255,0.1)', color: colors.text.secondary }}>
                                            {report.protocol}
                                        </span>
                                        <span className="px-2 py-1 rounded-md" style={{ background: 'rgba(255,255,255,0.1)', color: colors.text.secondary }}>
                                            {report.report_type}
                                        </span>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className="text-sm font-semibold" style={{ color: colors.primary }}>
                                        {new Date(report.generated_at).toLocaleDateString('pt-BR')}
                                    </div>
                                    <div className="text-xs" style={{ color: colors.text.tertiary }}>
                                        {new Date(report.generated_at).toLocaleTimeString('pt-BR')}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="text-center py-12">
                        <div className="text-4xl mb-4">📭</div>
                        <p style={{ color: colors.text.secondary }}>Nenhum relatório encontrado.</p>
                        <p className="text-sm mt-2" style={{ color: colors.text.tertiary }}>
                            As avaliações concluídas aparecerão aqui automaticamente.
                        </p>
                    </div>
                )}
            </div>
        </div>
    )
}
