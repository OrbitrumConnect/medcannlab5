import React, { useEffect, useState } from 'react'
import { Clock, Calendar, Heart, FileText, BookOpen } from 'lucide-react'
import { Appointment, PatientPrescriptionSummary, TherapeuticPlan } from '../../../hooks/dashboard/usePatientDashboard'
import { ClinicalReport } from '../../../lib/clinicalReportService'
import { useAuth } from '../../../contexts/AuthContext'
import { supabase } from '../../../lib/supabase'

interface PatientStatsProps {
    appointments: Appointment[]
    patientPrescriptions: PatientPrescriptionSummary[]
    reports: ClinicalReport[]
    therapeuticPlan: TherapeuticPlan | null
}

export const PatientStats: React.FC<PatientStatsProps> = ({
    appointments,
    patientPrescriptions,
    reports,
    therapeuticPlan
}) => {
    const activePrescriptions = patientPrescriptions.filter(p => p.status === 'active')
    const consultasAgendadas = appointments.filter(apt => apt.status === 'scheduled').length
    const consultasConcluidas = appointments.filter(apt => apt.status === 'completed').length

    // V1.9.581: "Dias na Plataforma" canônico via get_user_stats (= public.users.created_at,
    // MESMA fonte da Nôa). Antes contava dias desde o PRIMEIRO relatório (mostrava 104 em vez
    // de 125, divergindo da Nôa). Fallback pro cálculo antigo enquanto a RPC carrega (sem flash).
    const { user } = useAuth()
    const [diasCanonico, setDiasCanonico] = useState<number | null>(null)
    useEffect(() => {
        if (!user?.id) return
        let active = true
        ;(supabase as any)
            .rpc('get_user_stats', { p_user_id: user.id })
            .then(({ data }: { data: any }) => {
                if (active && typeof data?.dias_no_app === 'number') setDiasCanonico(data.dias_no_app)
            })
        return () => { active = false }
    }, [user?.id])

    const primeiroAcesso = reports.length > 0
        ? new Date(reports[reports.length - 1].generated_at || Date.now())
        : new Date()
    const diasFallback = Math.max(0, Math.floor((Date.now() - primeiroAcesso.getTime()) / (1000 * 3600 * 24)))
    const diasNoPlataforma = diasCanonico ?? diasFallback

    const statCards = [
        { label: 'Dias na Plataforma', value: diasNoPlataforma, icon: Clock, color: 'text-indigo-400', sub: 'Tempo de cuidado' },
        { label: 'Consultas', value: appointments.length, icon: Calendar, color: 'text-primary-400', sub: `${consultasAgendadas} agendadas` },
        { label: 'Prescrições', value: patientPrescriptions.length, icon: Heart, color: 'text-emerald-400', sub: `${activePrescriptions.length} ativas` },
        { label: 'Relatórios', value: reports.length, icon: FileText, color: 'text-purple-400', sub: 'Gerados pela Nôa' }
    ]

    return (
        // V1.9.237: gap-4 → gap-3 + p-6 → p-4 md:p-5 + mb-4 → mb-3 + w-8 h-8 → w-6 h-6 md:w-7 md:h-7 (cards mais enxutos em laptop)
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 animate-in fade-in duration-500">
            {statCards.map((stat, i) => (
                <div key={i} className="bg-slate-900/40 border border-white/5 rounded-2xl p-4 md:p-5 backdrop-blur-md hover:border-white/10 transition-colors">
                    <div className="flex items-center justify-between mb-3">
                        <stat.icon className={`w-6 h-6 md:w-7 md:h-7 ${stat.color}`} />
                        <span className="text-xl md:text-2xl font-bold text-white">{stat.value}</span>
                    </div>
                    <h3 className="text-xs md:text-sm font-semibold text-slate-400 uppercase tracking-wider">{stat.label}</h3>
                    <p className="text-[10px] md:text-xs text-slate-500 mt-1">{stat.sub}</p>
                </div>
            ))}
        </div>
    )
}
