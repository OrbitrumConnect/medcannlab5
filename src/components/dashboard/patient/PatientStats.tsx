import React from 'react'
import { Clock, Calendar, Heart, FileText, BookOpen } from 'lucide-react'
import { Appointment, PatientPrescriptionSummary, TherapeuticPlan } from '../../../hooks/dashboard/usePatientDashboard'
import { ClinicalReport } from '../../../lib/clinicalReportService'

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

    const primeiroAcesso = reports.length > 0
        ? new Date(reports[reports.length - 1].generated_at || Date.now())
        : new Date()
    const diasNoPlataforma = Math.max(0, Math.floor((Date.now() - primeiroAcesso.getTime()) / (1000 * 3600 * 24)))

    const statCards = [
        { label: 'Dias na Plataforma', value: diasNoPlataforma, icon: Clock, color: 'text-indigo-400', sub: 'Tempo de cuidado' },
        { label: 'Consultas', value: appointments.length, icon: Calendar, color: 'text-primary-400', sub: `${consultasAgendadas} agendadas` },
        { label: 'Prescrições', value: patientPrescriptions.length, icon: Heart, color: 'text-emerald-400', sub: `${activePrescriptions.length} ativas` },
        { label: 'Relatórios', value: reports.length, icon: FileText, color: 'text-purple-400', sub: 'Gerados pela Nôa' }
    ]

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 animate-in fade-in duration-500">
            {statCards.map((stat, i) => (
                <div key={i} className="bg-slate-900/40 border border-white/5 rounded-2xl p-6 backdrop-blur-md hover:border-white/10 transition-colors">
                    <div className="flex items-center justify-between mb-4">
                        <stat.icon className={`w-8 h-8 ${stat.color}`} />
                        <span className="text-2xl font-bold text-white">{stat.value}</span>
                    </div>
                    <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">{stat.label}</h3>
                    <p className="text-xs text-slate-500 mt-1">{stat.sub}</p>
                </div>
            ))}
        </div>
    )
}
