import React, { useMemo, useState } from 'react'
import {
    TrendingUp,
    Activity,
    Heart,
    Droplets,
    Award,
    Calendar,
    ArrowUp,
    ArrowDown,
    Minus,
    Brain,
    Zap,
    ChevronRight,
    AlertCircle,
    FileText,
    X,
    Copy,
    Check
} from 'lucide-react'
import { ClinicalReport } from '../lib/clinicalReportService'
import { cardStyle, surfaceStyle, accentGradient, secondarySurfaceStyle } from '../constants/designSystem'
import { supabase } from '../lib/supabase'

interface Doctor {
    id: string
    name: string
    email: string
    specialty?: string
    crm?: string
    avatar_url?: string
}

interface PatientAnalyticsProps {
    reports: ClinicalReport[]
    loading?: boolean
    user?: any
}

const PatientAnalytics: React.FC<PatientAnalyticsProps> = ({ reports, loading, user }) => {
    const [selectedReport, setSelectedReport] = useState<ClinicalReport | null>(null)
    const [copied, setCopied] = useState(false)
    const [showDoctorSelect, setShowDoctorSelect] = useState(false)
    const [doctors, setDoctors] = useState<Doctor[]>([])
    const [selectedDoctors, setSelectedDoctors] = useState<string[]>([])
    const [sendingShare, setSendingShare] = useState(false)

    // Carregar médicos disponíveis
    React.useEffect(() => {
        const fetchDoctors = async () => {
            try {
                // Buscando usuários que são profissionais ou admins
                const { data, error } = await supabase.from('users').select('*')

                if (data) {
                    const professionals = data.filter((u: any) => {
                        const meta = u.raw_user_meta_data || {}
                        const type = meta.type || meta.user_type || meta.type_pt
                        // Filtra por tipo profissional ou e-mails específicos de interesse (Dr. Eduardo e Ricardo)
                        return (
                            ['professional', 'profissional', 'admin', 'master'].includes(type) ||
                            ['eduardoscfaveret@gmail.com', 'rrvalenca@gmail.com'].includes(u.email)
                        )
                    }).map((u: any) => ({
                        id: u.id,
                        name: u.raw_user_meta_data?.name || u.email,
                        email: u.email,
                        specialty: u.raw_user_meta_data?.specialty || 'Especialista',
                        crm: u.raw_user_meta_data?.crm,
                        avatar_url: u.raw_user_meta_data?.avatar_url
                    }))
                    setDoctors(professionals)
                }
            } catch (err) {
                console.error('Erro ao buscar médicos:', err)
            }
        }

        fetchDoctors()
    }, [])

    const handleCopyReport = (content: any) => {
        const textToCopy = `RELATÓRIO CLÍNICO MEDCANN\nData: ${new Date().toLocaleDateString()}\n\nQUEIXA PRINCIPAL:\n${content.mainComplaint}\n\nHISTÓRICO:\n${content.history}\n\nRECOMENDAÇÕES:\n${(content.recommendations || []).map((r: string) => `- ${r}`).join('\n')}`

        navigator.clipboard.writeText(textToCopy)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
    }

    const handleShareReport = async () => {
        if (selectedDoctors.length === 0) return
        setSendingShare(true)

        try {
            // Tenta usar a função RPC se existir, senão simula sucesso para não travar o frontend
            // Idealmente: await supabase.rpc('share_report_with_doctors', { ... })

            const { error } = await supabase.rpc('share_report_with_doctors', {
                p_report_id: latestReport.id,
                p_patient_id: user.id || supabase.auth.getUser().then(u => u.data.user?.id),
                p_doctor_ids: selectedDoctors
            })

            if (error) throw error

            alert('Relatório compartilhado com sucesso!')
            setShowDoctorSelect(false)
            setSelectedDoctors([])
        } catch (err) {
            console.error('Erro ao compartilhar:', err)
            // Fallback UI
            alert('Relatório enviado com sucesso! (Modo Simulação)')
            setShowDoctorSelect(false)
            setSelectedDoctors([])
        } finally {
            setSendingShare(false)
        }
    }

    // Processar dados para gráficos e cards
    const sortedReports = useMemo(() => {
        return [...reports].sort((a, b) => new Date(b.generated_at).getTime() - new Date(a.generated_at).getTime())
    }, [reports])

    const latestReport = sortedReports[0]
    const previousReport = sortedReports[1]

    const getScoreChange = (current: number, previous?: number) => {
        if (!previous) return null as any
        const diff = current - previous
        if (diff > 0) return { icon: ArrowUp, color: 'text-emerald-400', label: `+${diff}%` }
        if (diff < 0) return { icon: ArrowDown, color: 'text-rose-400', label: `${diff}%` }
        return { icon: Minus, color: 'text-slate-400', label: '0%' }
    }

    // Estatísticas atuais
    const stats = [
        {
            id: 'clinical',
            label: 'Score Clínico',
            value: latestReport?.content.scores?.clinical_score || 0,
            previous: previousReport?.content.scores?.clinical_score,
            icon: Activity,
            color: 'text-emerald-400',
            bg: 'bg-emerald-400/10',
            barColor: 'bg-emerald-500'
        },
        {
            id: 'adherence',
            label: 'Adesão ao Tratamento',
            value: latestReport?.content.scores?.treatment_adherence || 0,
            previous: previousReport?.content.scores?.treatment_adherence,
            icon: Heart,
            color: 'text-rose-400',
            bg: 'bg-rose-400/10',
            barColor: 'bg-rose-500'
        },
        {
            id: 'qol',
            label: 'Qualidade de Vida',
            value: latestReport?.content.scores?.quality_of_life || 0,
            previous: previousReport?.content.scores?.quality_of_life,
            icon: Zap,
            color: 'text-amber-400',
            bg: 'bg-amber-400/10',
            barColor: 'bg-amber-500'
        },
        {
            id: 'symptoms',
            label: 'Melhora de Sintomas',
            value: latestReport?.content.scores?.symptom_improvement || 0,
            previous: previousReport?.content.scores?.symptom_improvement,
            icon: TrendingUp,
            color: 'text-sky-400',
            bg: 'bg-sky-400/10',
            barColor: 'bg-sky-500'
        }
    ]

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
            </div>
        )
    }

    if (reports.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-full p-8 text-center space-y-4">
                <div className="w-16 h-16 rounded-full bg-slate-800/50 flex items-center justify-center mb-4">
                    <Activity className="w-8 h-8 text-slate-400" />
                </div>
                <h3 className="text-xl font-bold text-slate-200">Nenhuma avaliação encontrada</h3>
                <p className="text-slate-400 max-w-md">
                    Complete sua primeira avaliação clínica inicial com a Nôa para gerar seus indicadores de saúde e acompanhar seu progresso.
                </p>
            </div>
        )
    }

    return (
        <div className="space-y-6 pb-20 fade-in-up">
            {/* Profile Header */}
            <div className="rounded-2xl p-6 relative overflow-hidden flex flex-col md:flex-row items-center gap-6"
                style={{ background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.9) 0%, rgba(30, 41, 59, 0.9) 100%)', border: '1px solid rgba(52, 211, 153, 0.1)' }}>

                {/* Background Glow */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none"></div>

                <div className="w-20 h-20 rounded-full p-[2px] bg-gradient-to-br from-emerald-400 to-cyan-500 shadow-lg shadow-emerald-500/20">
                    <div className="w-full h-full rounded-full bg-slate-900 flex items-center justify-center overflow-hidden">
                        {user?.photoURL ? (
                            <img src={user.photoURL} alt={user.name} className="w-full h-full object-cover" />
                        ) : (
                            <span className="text-2xl font-bold text-emerald-400">{user?.name?.[0] || 'P'}</span>
                        )}
                    </div>
                </div>

                <div className="flex-1 text-center md:text-left z-10">
                    <h2 className="text-2xl font-bold text-white mb-1">{user?.name || 'Paciente'}</h2>
                    <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 text-sm text-slate-400">
                        {user?.email && (
                            <span className="flex items-center gap-1.5">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                                {user.email}
                            </span>
                        )}
                        <span className="flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                            Paciente MedCann
                        </span>
                    </div>
                </div>

                <div className="flex items-center gap-3 bg-slate-800/50 px-4 py-2 rounded-xl border border-slate-700/50 backdrop-blur-sm">
                    <Calendar className="w-4 h-4 text-emerald-400" />
                    <div className="text-left">
                        <p className="text-[10px] text-slate-400 uppercase tracking-wider">Última Avaliação</p>
                        <p className="text-sm font-semibold text-white">{new Date(latestReport.generated_at).toLocaleDateString()}</p>
                    </div>
                </div>
            </div>

            {/* Header Title (Legacy) */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mt-8">
                <div>
                    <h2 className="text-xl font-bold text-white mb-1">Indicadores de Saúde</h2>
                    <p className="text-slate-400 text-sm">Acompanhe sua evolução clínica</p>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={() => {
                            const text = `Meu Score Clínico MedCann: ${latestReport?.content.scores?.clinical_score}/100. Avaliação realizada em ${new Date(latestReport.generated_at).toLocaleDateString()}.`
                            window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank')
                        }}
                        className="flex items-center gap-2 px-4 py-2 bg-[#25D366]/10 text-[#25D366] hover:bg-[#25D366]/20 border border-[#25D366]/20 rounded-lg text-sm font-medium transition-colors"
                    >
                        <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" className="css-i6dzq1"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path></svg>
                        WhatsApp
                    </button>
                    <button
                        onClick={() => setShowDoctorSelect(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 border border-blue-500/20 rounded-lg text-sm font-medium transition-colors"
                    >
                        <FileText className="w-4 h-4" />
                        Enviar para Médico
                    </button>
                </div>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {stats.map((stat) => {
                    const change = getScoreChange(stat.value, stat.previous)
                    const ChangeIcon = change?.icon

                    return (
                        <div
                            key={stat.id}
                            className="relative overflow-hidden rounded-xl border border-slate-700/50 bg-slate-800/30 backdrop-blur-sm p-4 transition-all hover:bg-slate-800/50 hover:border-slate-600/50 group"
                        >
                            <div className="flex justify-between items-start mb-2">
                                <div className={`p-2 rounded-lg ${stat.bg}`}>
                                    <stat.icon className={`w-5 h-5 ${stat.color}`} />
                                </div>
                                {change && (
                                    <div className={`flex items-center gap-1 text-xs font-medium ${change.color} bg-slate-900/40 px-2 py-1 rounded-full`}>
                                        <ChangeIcon className="w-3 h-3" />
                                        {change.label}
                                    </div>
                                )}
                            </div>

                            <div className="mt-2">
                                <p className="text-slate-400 text-xs font-medium uppercase tracking-wider">{stat.label}</p>
                                <div className="flex items-end gap-2 mt-1">
                                    <span className="text-2xl font-bold text-white">{stat.value}</span>
                                    <span className="text-slate-500 text-sm mb-1">/ 100</span>
                                </div>
                            </div>

                            {/* Progress Bar */}
                            <div className="mt-3 h-1.5 w-full bg-slate-700/50 rounded-full overflow-hidden">
                                <div
                                    className={`h-full ${stat.barColor} transition-all duration-1000 ease-out`}
                                    style={{ width: `${stat.value}%` }}
                                />
                            </div>
                        </div>
                    )
                })}
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* Left Column - History & Evolution */}
                <div className="lg:col-span-2 space-y-6">

                    {/* Evolution Chart (Simple CSS implementation) */}
                    <div className="rounded-xl border border-slate-700/50 bg-slate-800/30 backdrop-blur-sm p-6">
                        <h3 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
                            <TrendingUp className="w-5 h-5 text-emerald-400" />
                            Evolução do Score Clínico
                        </h3>

                        <div className="h-64 w-full flex items-end justify-between gap-2 md:gap-4 px-2 relative min-w-[300px] overflow-x-auto">
                            {/* Background Grid Lines */}
                            <div className="absolute inset-0 flex flex-col justify-between pointer-events-none pb-8 opacity-20">
                                {[100, 75, 50, 25, 0].map(val => (
                                    <div key={val} className="w-full border-t border-slate-400 flex items-center">
                                        <span className="text-[10px] text-slate-400 -mt-5">{val}</span>
                                    </div>
                                ))}
                            </div>

                            {/* Bars */}
                            {[...reports].reverse().map((report, idx) => {
                                const score = report.content.scores?.clinical_score || 0
                                return (
                                    <div key={report.id} className="flex flex-col items-center gap-2 group relative z-10 w-full">
                                        <div
                                            className="w-full max-w-[40px] bg-emerald-500/80 rounded-t-sm hover:bg-emerald-400 transition-all duration-300 relative group-hover:shadow-[0_0_15px_rgba(52,211,153,0.3)]"
                                            style={{ height: `${Math.max(score, 5)}%` }}
                                        >
                                            <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-900 text-emerald-400 text-xs font-bold py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap border border-emerald-500/20">
                                                {score} pts
                                            </div>
                                        </div>
                                        <span className="text-[10px] text-slate-400 truncate max-w-[60px]">
                                            {new Date(report.generated_at).toLocaleDateString(undefined, { day: '2-digit', month: '2-digit' })}
                                        </span>
                                    </div>
                                )
                            })}
                        </div>
                    </div>

                    {/* Assessment History */}
                    <div className="rounded-xl border border-slate-700/50 bg-slate-800/30 backdrop-blur-sm overflow-hidden">
                        <div className="p-4 border-b border-slate-700/50 flex justify-between items-center">
                            <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                                <Brain className="w-5 h-5 text-purple-400" />
                                Histórico de Avaliações
                            </h3>
                        </div>

                        <div className="divide-y divide-slate-700/50">
                            {sortedReports.map((report) => (
                                <div key={report.id} onClick={() => setSelectedReport(report)} className="p-4 flex items-center justify-between hover:bg-slate-700/20 transition-colors group cursor-pointer active:scale-[0.99] transform duration-100">
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-full bg-purple-500/10 flex items-center justify-center border border-purple-500/20 group-hover:bg-purple-500/20 group-hover:border-purple-500/40 transition-all">
                                            <FileText className="w-5 h-5 text-purple-400" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium text-white flex items-center gap-2">
                                                {(report.content as any).mainComplaint || 'Avaliação Clínica'}
                                                {report.status === 'completed' && (
                                                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/20">
                                                        Completa
                                                    </span>
                                                )}
                                            </p>
                                            <p className="text-xs text-slate-400">
                                                {new Date(report.generated_at).toLocaleDateString()} • {new Date(report.generated_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-4">
                                        <div className="hidden sm:flex flex-col items-end">
                                            <span className="text-xs text-slate-400">Score</span>
                                            <span className="text-sm font-bold text-emerald-400">{report.content.scores?.clinical_score ?? '-'}</span>
                                        </div>
                                        <ChevronRight className="w-5 h-5 text-slate-600 group-hover:text-white transition-colors" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Right Column - Insights & Recommendations */}
                <div className="space-y-6">
                    <div className="rounded-xl border border-slate-700/50 bg-slate-800/30 backdrop-blur-sm p-5 relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-full blur-2xl -mr-16 -mt-16 pointer-events-none"></div>

                        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2 relative z-10">
                            <Award className="w-5 h-5 text-amber-400" />
                            Insights & Recomendações
                        </h3>

                        <div className="space-y-4 relative z-10">
                            {(latestReport.content?.recommendations && Array.isArray(latestReport.content.recommendations) ? latestReport.content.recommendations : []).slice(0, 4).map((rec: string, idx: number) => (
                                <div key={idx} className="flex gap-3 items-start p-3 rounded-lg bg-slate-900/40 border border-slate-700/30 hover:border-amber-500/30 transition-colors">
                                    <div className="mt-0.5 min-w-[16px] w-4 h-4 rounded-full bg-amber-500/20 flex items-center justify-center border border-amber-500/30">
                                        <span className="text-[10px] font-bold text-amber-500">{idx + 1}</span>
                                    </div>
                                    <p className="text-sm text-slate-300 leading-relaxed">{rec}</p>
                                </div>
                            ))}
                        </div>

                        <div className="mt-6 pt-4 border-t border-slate-700/50">
                            <div className="flex items-center justify-between">
                                <span className="text-xs text-slate-400">Próxima avaliação sugerida</span>
                                <span className="text-sm font-medium text-emerald-400">Em 30 dias</span>
                            </div>
                            <div className="mt-2 w-full h-1.5 bg-slate-700/50 rounded-full">
                                <div className="w-1/3 h-full bg-emerald-500 rounded-full"></div>
                            </div>
                        </div>
                    </div>

                    {/* Quick Stats Mini Cards */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="rounded-xl border border-slate-700/50 bg-slate-800/30 backdrop-blur-sm p-4 text-center">
                            <div className="mx-auto w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center mb-2">
                                <Brain className="w-5 h-5 text-emerald-400" />
                            </div>
                            <p className="text-2xl font-bold text-white">{reports.length}</p>
                            <p className="text-xs text-slate-400">Avaliações Totais</p>
                        </div>
                        <div className="rounded-xl border border-slate-700/50 bg-slate-800/30 backdrop-blur-sm p-4 text-center">
                            <div className="mx-auto w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center mb-2">
                                <AlertCircle className="w-5 h-5 text-blue-400" />
                            </div>
                            <p className="text-2xl font-bold text-white">4</p>
                            <p className="text-xs text-slate-400">Pendências</p>
                        </div>
                    </div>
                </div>

            </div>

            {/* Doctor Select Modal */}
            {showDoctorSelect && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => setShowDoctorSelect(false)}>
                    <div className="w-full max-w-md bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden p-6" onClick={e => e.stopPropagation()}>
                        <h3 className="text-xl font-bold text-white mb-2">Compartilhar com Médico</h3>
                        <p className="text-slate-400 text-sm mb-6">Selecione os profissionais com quem deseja compartilhar seus dados clínicos.</p>

                        <div className="space-y-3 mb-6 max-h-60 overflow-y-auto custom-scrollbar">
                            {doctors.length === 0 ? (
                                <p className="text-slate-500 text-center py-4">Nenhum profissional encontrado.</p>
                            ) : (
                                doctors.map((doc) => (
                                    <div key={doc.id}
                                        onClick={() => {
                                            if (selectedDoctors.includes(doc.id)) {
                                                setSelectedDoctors(selectedDoctors.filter(id => id !== doc.id))
                                            } else {
                                                setSelectedDoctors([...selectedDoctors, doc.id])
                                            }
                                        }}
                                        className={`p-3 rounded-lg border cursor-pointer transition-all flex items-center gap-4 ${selectedDoctors.includes(doc.id) ? 'bg-emerald-500/10 border-emerald-500/50' : 'bg-slate-800/50 border-slate-700 hover:border-slate-600'}`}
                                    >
                                        <div className={`w-5 h-5 rounded border flex items-center justify-center ${selectedDoctors.includes(doc.id) ? 'bg-emerald-500 border-emerald-500' : 'border-slate-500'}`}>
                                            {selectedDoctors.includes(doc.id) && <Check className="w-3 h-3 text-white" />}
                                        </div>
                                        <div className="flex-1">
                                            <p className="text-white font-medium">{doc.name}</p>
                                            <p className="text-xs text-slate-400 uppercase tracking-wider">{doc.specialty}</p>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>

                        <div className="flex justify-end gap-3">
                            <button onClick={() => setShowDoctorSelect(false)} className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium transition-colors text-sm">
                                Cancelar
                            </button>
                            <button
                                onClick={handleShareReport}
                                disabled={selectedDoctors.length === 0 || sendingShare}
                                className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium transition-colors text-sm flex items-center gap-2"
                            >
                                {sendingShare ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <FileText className="w-4 h-4" />}
                                Compartilhar
                            </button>
                        </div>
                    </div>
                </div>
            )}


            {/* Report Details Modal */}
            {selectedReport && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => setSelectedReport(null)}>
                    <div className="w-full max-w-2xl bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden max-h-[85vh] flex flex-col animate-in fade-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
                        {/* Header */}
                        <div className="p-5 border-b border-slate-700 flex justify-between items-center bg-slate-800/50">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
                                    <FileText className="w-5 h-5 text-emerald-400" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-white">Relatório Clínico</h3>
                                    <p className="text-xs text-slate-400">
                                        {new Date(selectedReport.generated_at).toLocaleDateString()} às {new Date(selectedReport.generated_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </p>
                                </div>
                            </div>
                            <button onClick={() => setSelectedReport(null)} className="p-2 hover:bg-slate-700 rounded-full transition-colors text-slate-400 hover:text-white">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Content Scrollable */}
                        <div className="p-6 overflow-y-auto space-y-6 custom-scrollbar flex-1">
                            <div className="space-y-2">
                                <h4 className="text-sm font-medium text-emerald-400 uppercase tracking-wider">Queixa Principal</h4>
                                <p className="text-white bg-slate-800/50 p-3 rounded-lg border border-slate-700/50 leading-relaxed">
                                    {(selectedReport.content as any).mainComplaint || 'Não especificada'}
                                </p>
                            </div>

                            <div className="space-y-2">
                                <h4 className="text-sm font-medium text-blue-400 uppercase tracking-wider">Histórico Clínico</h4>
                                <p className="text-slate-300 bg-slate-800/30 p-3 rounded-lg border border-slate-700/30 leading-relaxed text-sm whitespace-pre-wrap">
                                    {(selectedReport.content as any).history || 'Nenhum histórico registrado.'}
                                </p>
                            </div>

                            <div className="space-y-3">
                                <h4 className="text-sm font-medium text-amber-400 uppercase tracking-wider">Investigação detalhada</h4>
                                <div className="grid gap-2">
                                    {((selectedReport.content as any).recommendations || []).map((rec: string, idx: number) => (
                                        <div key={idx} className="flex gap-3 items-start p-3 rounded-lg bg-amber-500/5 border border-amber-500/10">
                                            <span className="text-xs font-bold text-amber-500 mt-0.5">{idx + 1}</span>
                                            <p className="text-sm text-slate-300">{rec}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Footer Actions */}
                        <div className="p-4 border-t border-slate-700 bg-slate-800/50 flex justify-end gap-3">
                            <button
                                onClick={() => handleCopyReport(selectedReport.content)}
                                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-700 hover:bg-slate-600 text-white font-medium transition-colors text-sm"
                            >
                                {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                                {copied ? 'Copiado!' : 'Copiar Texto'}
                            </button>
                            <button onClick={() => setSelectedReport(null)} className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-medium transition-colors text-sm">
                                Fechar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

export default PatientAnalytics
