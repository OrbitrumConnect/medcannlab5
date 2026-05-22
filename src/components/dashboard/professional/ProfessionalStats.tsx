import React from 'react'
import { Users, Calendar, FileText, Activity } from 'lucide-react'
import { Patient } from '../../../hooks/dashboard/useProfessionalDashboard'

interface ProfessionalStatsProps {
    patients: Patient[]
    appointmentsTodayCount: number
    newReportsCount: number
}

export const ProfessionalStats: React.FC<ProfessionalStatsProps> = ({
    patients,
    appointmentsTodayCount,
    newReportsCount
}) => {
    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-in fade-in duration-500">
            <div className="bg-gradient-to-br from-blue-500/10 to-blue-600/5 border border-blue-500/20 rounded-2xl p-6 shadow-xl backdrop-blur-md">
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-sm font-medium text-blue-400 uppercase tracking-wider">Pacientes Totais</p>
                        <p className="text-3xl font-bold text-white mt-1">{patients.length}</p>
                    </div>
                    <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center border border-blue-500/30">
                        <Users className="h-6 w-6 text-blue-400" />
                    </div>
                </div>
            </div>

            <div className="bg-gradient-to-br from-emerald-500/10 to-emerald-600/5 border border-emerald-500/20 rounded-2xl p-6 shadow-xl backdrop-blur-md">
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-sm font-medium text-emerald-400 uppercase tracking-wider">Agenda de Hoje</p>
                        <p className="text-3xl font-bold text-white mt-1">{appointmentsTodayCount}</p>
                    </div>
                    <div className="w-12 h-12 bg-emerald-500/20 rounded-xl flex items-center justify-center border border-emerald-500/30">
                        <Calendar className="h-6 w-6 text-emerald-400" />
                    </div>
                </div>
            </div>

            <div className="bg-gradient-to-br from-amber-500/10 to-amber-600/5 border border-amber-500/20 rounded-2xl p-6 shadow-xl backdrop-blur-md">
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-sm font-medium text-amber-400 uppercase tracking-wider">Relatórios Pendentes</p>
                        <p className="text-3xl font-bold text-white mt-1">{newReportsCount}</p>
                    </div>
                    <div className="w-12 h-12 bg-amber-500/20 rounded-xl flex items-center justify-center border border-amber-500/30">
                        <FileText className="h-6 w-6 text-amber-400" />
                    </div>
                </div>
            </div>
        </div>
    )
}
