import React from 'react'
import { Calendar, MessageCircle, Heart, BookOpen, Share2, FileText, ChevronRight, Zap } from 'lucide-react'
import { TherapeuticPlan, PatientPrescriptionSummary } from '../../../hooks/dashboard/usePatientDashboard'

interface PatientQuickActionsProps {
    therapeuticPlan: TherapeuticPlan | null
    patientPrescriptions: PatientPrescriptionSummary[]
    onSchedule: () => void
    onChat: () => void
    onViewPlan: () => void
    onViewEducational: () => void
    onShareReport: () => void
    loading?: boolean
}

export const PatientQuickActions: React.FC<PatientQuickActionsProps> = ({
    therapeuticPlan,
    patientPrescriptions,
    onSchedule,
    onChat,
    onViewPlan,
    onViewEducational,
    onShareReport,
    loading
}) => {
    const activeCount = patientPrescriptions.filter(p => p.status === 'active').length

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-700">
            <h3 className="text-xl font-bold text-white flex items-center gap-2">
                <Zap className="w-5 h-5 text-amber-400 fill-amber-400/20" /> Ações Rápidas
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* Primary Action: Chat */}
                <button
                    onClick={onChat}
                    className="group relative overflow-hidden rounded-2xl p-6 text-left transition-all hover:scale-[1.02] active:scale-[0.98]"
                    style={{ background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)' }}
                >
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-125 transition-transform">
                        <MessageCircle className="w-24 h-24 text-white" />
                    </div>
                    <div className="relative z-10 flex flex-col h-full justify-between">
                        <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center mb-4">
                            <MessageCircle className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h3 className="text-xl font-bold text-white">Chat com Médico</h3>
                            <p className="text-emerald-100/80 text-sm mt-1">Fale diretamente com seu profissional</p>
                        </div>
                    </div>
                </button>

                {/* Primary Action: Schedule */}
                <button
                    onClick={onSchedule}
                    className="group relative overflow-hidden rounded-2xl p-6 text-left transition-all hover:scale-[1.02] active:scale-[0.98]"
                    style={{ background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)' }}
                >
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-125 transition-transform">
                        <Calendar className="w-24 h-24 text-white" />
                    </div>
                    <div className="relative z-10 flex flex-col h-full justify-between">
                        <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center mb-4">
                            <Calendar className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h3 className="text-xl font-bold text-white">Nova Consulta</h3>
                            <p className="text-blue-100/80 text-sm mt-1">Agende seu acompanhamento</p>
                        </div>
                    </div>
                </button>

                {/* Secondary Actions Grid */}
                <div className="flex flex-col gap-4">
                    <button onClick={onViewPlan} className="group flex items-center gap-4 bg-slate-900/40 border border-white/5 p-4 rounded-xl hover:bg-slate-800/60 transition-all text-left">
                        <div className="w-10 h-10 rounded-lg bg-pink-500/10 flex items-center justify-center border border-pink-500/20">
                            <Heart className="w-5 h-5 text-pink-400" />
                        </div>
                        <div className="flex-1">
                            <h4 className="text-white font-semibold text-sm">Plano Terapêutico</h4>
                            <p className="text-slate-500 text-xs">{activeCount} prescrições ativas</p>
                        </div>
                        <ChevronRight className="w-4 h-4 text-slate-600 group-hover:translate-x-1 transition-transform" />
                    </button>

                    <button onClick={onViewEducational} className="group flex items-center gap-4 bg-slate-900/40 border border-white/5 p-4 rounded-xl hover:bg-slate-800/60 transition-all text-left">
                        <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center border border-amber-500/20">
                            <BookOpen className="w-5 h-5 text-amber-400" />
                        </div>
                        <div className="flex-1">
                            <h4 className="text-white font-semibold text-sm">Biblioteca</h4>
                            <p className="text-slate-500 text-xs">Guias e vídeos educativos</p>
                        </div>
                        <ChevronRight className="w-4 h-4 text-slate-600 group-hover:translate-x-1 transition-transform" />
                    </button>
                </div>
            </div>
        </div>
    )
}
