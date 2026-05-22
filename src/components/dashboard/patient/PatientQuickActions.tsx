import React from 'react'
import { Pill, Heart, BookOpen, ChevronRight, Zap } from 'lucide-react'
import { TherapeuticPlan, PatientPrescriptionSummary } from '../../../hooks/dashboard/usePatientDashboard'

interface PatientQuickActionsProps {
    therapeuticPlan: TherapeuticPlan | null
    patientPrescriptions: PatientPrescriptionSummary[]
    onSchedule: () => void
    onChat: () => void
    onViewPlan: () => void
    onViewEducational: () => void
    onShareReport: () => void
    onRequestPrescription?: () => void  // V1.9.x: pedir nova receita (substitui Chat redundante)
    loading?: boolean
}

export const PatientQuickActions = React.forwardRef<HTMLDivElement, PatientQuickActionsProps>(({
    therapeuticPlan,
    patientPrescriptions,
    onSchedule,
    onChat,
    onViewPlan,
    onViewEducational,
    onShareReport,
    onRequestPrescription,
    loading
}, ref) => {
    const activeCount = patientPrescriptions.filter(p => p.status === 'active').length

    // V1.9.x: redesign — antes tinha "Chat com Médico" e "Nova Consulta" como
    // primary cards aqui, MAS já existem no header (PatientHeaderActions).
    // Pedro 08/05: redundantes, confundem. Substituídos por:
    //   1. Solicitar Receita (novo, função única — abre chat com mensagem pré-formada)
    //   2. Compartilhar Relatório (usa onShareReport que existia mas não era usado)
    // Plano Terapêutico + Biblioteca preservados (não-redundantes).
    /*
      V1.9.314 (16/05/2026 noite): aplicação Clinical Cockpit Mode + anti-redundância
      (Pedro): cards grandes coloridos (violeta + teal gradient) viravam ruído visual
      e "Compartilhar Relatório" era duplicata exata de "Enviar Médico" no
      PatientHeaderActions (ambos chamavam setActiveTab('report-detail')).
      Mudanças:
      - REMOVIDO card "Compartilhar Relatório" (redundante com header)
      - "Solicitar Receita" calibrado pra slate + ícone emerald (ação única,
        não disponível no header — mantém)
      - "Plano Terapêutico" pink → slate + ícone emerald (memória clinical cockpit)
      - "Biblioteca" amber → slate + ícone emerald
      - Zap header amber → emerald
      - Grid agora 1col mobile / 2col desktop (1 primary + 2 secondary linha)
    */
    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-700">
            <h3 className="text-xl font-bold text-white flex items-center gap-2">
                <Zap className="w-5 h-5 text-emerald-400" /> Ações Complementares
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {/* Solicitar Receita — ação única não disponível no header */}
                {onRequestPrescription && (
                    <button
                        onClick={onRequestPrescription}
                        className="group flex items-center gap-3 bg-slate-900/40 border border-slate-700/50 hover:border-emerald-500/40 hover:bg-slate-800/60 p-4 rounded-xl transition-all text-left"
                    >
                        <div className="w-10 h-10 rounded-lg bg-slate-800/60 flex items-center justify-center border border-slate-700">
                            <Pill className="w-5 h-5 text-emerald-400" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <h4 className="text-white font-semibold text-sm">Solicitar Receita</h4>
                            <p className="text-slate-500 text-xs truncate">Peça nova prescrição ao médico</p>
                        </div>
                        <ChevronRight className="w-4 h-4 text-slate-600 group-hover:translate-x-1 transition-transform flex-shrink-0" />
                    </button>
                )}

                <button onClick={onViewPlan} className="group flex items-center gap-3 bg-slate-900/40 border border-slate-700/50 hover:border-emerald-500/40 hover:bg-slate-800/60 p-4 rounded-xl transition-all text-left">
                    <div className="w-10 h-10 rounded-lg bg-slate-800/60 flex items-center justify-center border border-slate-700">
                        <Heart className="w-5 h-5 text-emerald-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <h4 className="text-white font-semibold text-sm">Plano Terapêutico</h4>
                        <p className="text-slate-500 text-xs truncate">{activeCount} prescrições ativas</p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-600 group-hover:translate-x-1 transition-transform flex-shrink-0" />
                </button>

                <button onClick={onViewEducational} className="group flex items-center gap-3 bg-slate-900/40 border border-slate-700/50 hover:border-emerald-500/40 hover:bg-slate-800/60 p-4 rounded-xl transition-all text-left">
                    <div className="w-10 h-10 rounded-lg bg-slate-800/60 flex items-center justify-center border border-slate-700">
                        <BookOpen className="w-5 h-5 text-emerald-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <h4 className="text-white font-semibold text-sm">Biblioteca</h4>
                        <p className="text-slate-500 text-xs truncate">Guias e vídeos educativos</p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-600 group-hover:translate-x-1 transition-transform flex-shrink-0" />
                </button>
            </div>
        </div>
    )
})

PatientQuickActions.displayName = 'PatientQuickActions'
