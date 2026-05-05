import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Calendar, FileText, Brain, UserPlus, X, Send, Check } from 'lucide-react'
import { ClinicalReport } from '../lib/clinicalReportService'
import { supabase } from '../lib/supabase'

interface PatientHeaderActionsProps {
    reports?: ClinicalReport[]
    onScheduleClick?: () => void
    onStartAssessment?: () => void
    isProfessionalView?: boolean
}

interface DoctorOption {
    id: string
    name: string
    email: string
}

/**
 * V1.9.126 — Header actions extraídos do PatientAnalytics para o topo do dashboard.
 * Acessibilidade 50+: botões maiores (px-5 py-3 text-base, ícone w-5 h-5).
 * Mantém: animate-pulse no Agendar, conditional !isProfessionalView, callbacks originais.
 */
const PatientHeaderActions: React.FC<PatientHeaderActionsProps> = ({
    reports = [],
    onScheduleClick,
    onStartAssessment,
    isProfessionalView = false,
}) => {
    const navigate = useNavigate()
    const [showDoctorSelect, setShowDoctorSelect] = useState(false)
    const [doctors, setDoctors] = useState<DoctorOption[]>([])
    const [loadingDoctors, setLoadingDoctors] = useState(false)
    const [sending, setSending] = useState(false)
    const [sentSuccess, setSentSuccess] = useState(false)

    const sortedReports = [...reports].sort((a, b) => {
        const ad = (a as any).generated_at ? new Date((a as any).generated_at).getTime() : 0
        const bd = (b as any).generated_at ? new Date((b as any).generated_at).getTime() : 0
        return bd - ad
    })
    const latestReport = sortedReports[0]

    if (isProfessionalView) return null

    const handleOpenDoctorSelect = async () => {
        setShowDoctorSelect(true)
        setLoadingDoctors(true)
        try {
            const { data, error } = await supabase
                .from('users')
                .select('id, name, email')
                .eq('type', 'profissional')
                .order('name', { ascending: true })
            if (error) throw error
            setDoctors((data ?? []) as DoctorOption[])
        } catch (err) {
            console.error('[PatientHeaderActions] erro carregando médicos:', err)
            setDoctors([])
        } finally {
            setLoadingDoctors(false)
        }
    }

    const handleSendToDoctor = async (doctorId: string) => {
        if (!latestReport) {
            alert('Nenhum relatório disponível para enviar.')
            return
        }
        setSending(true)
        try {
            const { data: authUser } = await supabase.auth.getUser()
            const { error } = await supabase.rpc('share_report_with_doctors', {
                p_report_id: latestReport.id,
                p_patient_id: authUser?.user?.id,
                p_doctor_ids: [doctorId],
            })
            if (error) throw error
            setSentSuccess(true)
            setTimeout(() => {
                setSentSuccess(false)
                setShowDoctorSelect(false)
            }, 1600)
        } catch (err: any) {
            console.error('[PatientHeaderActions] erro enviando relatório:', err)
            alert(err?.message || 'Não foi possível enviar agora. Tente novamente.')
            setShowDoctorSelect(false)
        } finally {
            setSending(false)
        }
    }

    const handleWhatsApp = () => {
        const score = latestReport?.content?.scores?.clinical_score ?? 0
        const dataAvaliacao = (latestReport as any)?.generated_at
            ? new Date((latestReport as any).generated_at).toLocaleDateString('pt-BR')
            : 'data indisponível'
        const text = `Olá! Sou paciente do MedCannLab.\n\nCompletude da Avaliação: ${score}/100.\nAvaliação: ${dataAvaliacao}.\n\nGostaria de agendar uma consulta.`
        const encoded = encodeURIComponent(text)
        window.open(`https://wa.me/?text=${encoded}`, '_blank')
    }

    return (
        <>
            <div className="bg-slate-900/40 border border-white/5 rounded-2xl p-5 md:p-6 space-y-3">
                <div className="space-y-0.5">
                    <h2 className="text-lg md:text-xl font-semibold text-white">O que você quer fazer agora?</h2>
                    <p className="text-slate-400 text-sm">Ações rápidas para sua jornada clínica.</p>
                </div>
                <div className="flex flex-wrap gap-3">
                    {/* [V1.9.126] Botões maiores p/ acessibilidade 50+ — ordem alfabética PT */}
                    <button
                        onClick={onScheduleClick}
                        className="flex items-center gap-2 px-5 py-3 bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 border border-blue-500/20 rounded-xl text-base font-medium transition-all shadow-[0_0_15px_rgba(59,130,246,0.3)] hover:shadow-[0_0_20px_rgba(59,130,246,0.5)] animate-pulse"
                    >
                        <Calendar className="w-5 h-5" />
                        Agendar Consulta
                    </button>
                    <button
                        onClick={handleOpenDoctorSelect}
                        className="flex items-center gap-2 px-5 py-3 bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 border border-blue-500/20 rounded-xl text-base font-medium transition-colors"
                    >
                        <FileText className="w-5 h-5" />
                        Enviar para Médico
                    </button>
                    {onStartAssessment && (
                        <button
                            onClick={onStartAssessment}
                            className="flex items-center gap-2 px-5 py-3 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 border border-emerald-500/30 rounded-xl text-base font-medium transition-colors"
                        >
                            <Brain className="w-5 h-5" />
                            Iniciar Avaliação
                        </button>
                    )}
                    <button
                        onClick={() => navigate('/app/clinica/paciente/agendamentos')}
                        className="flex items-center gap-2 px-5 py-3 bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500/20 border border-indigo-500/20 rounded-xl text-base font-medium transition-colors"
                    >
                        <UserPlus className="w-5 h-5" />
                        Vincular Médico
                    </button>
                    <button
                        onClick={handleWhatsApp}
                        className="flex items-center gap-2 px-5 py-3 bg-[#25D366]/10 text-[#25D366] hover:bg-[#25D366]/20 border border-[#25D366]/20 rounded-xl text-base font-medium transition-colors"
                    >
                        <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path>
                        </svg>
                        WhatsApp
                    </button>
                </div>
            </div>

            {showDoctorSelect && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => !sending && setShowDoctorSelect(false)}>
                    <div className="bg-slate-900 border border-white/10 rounded-2xl max-w-md w-full p-6" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-start justify-between mb-4">
                            <div>
                                <h3 className="text-xl font-bold text-white">Enviar relatório</h3>
                                <p className="text-slate-400 text-sm mt-1">
                                    {latestReport ? 'Escolha um médico para receber sua última avaliação.' : 'Você ainda não tem avaliação concluída.'}
                                </p>
                            </div>
                            <button onClick={() => !sending && setShowDoctorSelect(false)} className="text-slate-500 hover:text-white p-1">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {sentSuccess ? (
                            <div className="flex items-center gap-2 text-emerald-400 py-6 justify-center">
                                <Check className="w-6 h-6" />
                                <span className="font-medium">Relatório enviado!</span>
                            </div>
                        ) : loadingDoctors ? (
                            <div className="text-slate-400 text-sm py-6 text-center">Carregando médicos...</div>
                        ) : doctors.length === 0 ? (
                            <div className="text-slate-400 text-sm py-6 text-center">Nenhum médico disponível agora.</div>
                        ) : (
                            <div className="space-y-2 max-h-72 overflow-y-auto">
                                {doctors.map((d) => (
                                    <button
                                        key={d.id}
                                        onClick={() => handleSendToDoctor(d.id)}
                                        disabled={sending || !latestReport}
                                        className="w-full text-left flex items-center justify-between gap-3 px-4 py-3 bg-slate-800/60 hover:bg-slate-800 border border-white/5 rounded-xl transition-colors disabled:opacity-50"
                                    >
                                        <div>
                                            <div className="text-white font-medium text-sm">{d.name || d.email}</div>
                                            {d.name && <div className="text-slate-500 text-xs">{d.email}</div>}
                                        </div>
                                        <Send className="w-4 h-4 text-blue-400" />
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </>
    )
}

export default PatientHeaderActions
