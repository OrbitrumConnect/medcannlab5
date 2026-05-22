import React, { useState } from 'react'
import { Search, ChevronRight, Filter } from 'lucide-react'
import { Patient } from '../../../hooks/dashboard/useProfessionalDashboard'

interface ProfessionalPatientSearchProps {
    patients: Patient[]
    onSelect: (id: string) => void
    loading?: boolean
}

export const ProfessionalPatientSearch: React.FC<ProfessionalPatientSearchProps> = ({
    patients,
    onSelect,
    loading
}) => {
    const [query, setQuery] = useState('')

    const filtered = patients.filter(p =>
        p.name.toLowerCase().includes(query.toLowerCase()) ||
        p.cpf.includes(query)
    )

    return (
        <div className="bg-slate-900/40 border border-white/5 rounded-2xl p-6 backdrop-blur-xl space-y-4">
            <div className="flex items-center justify-between mb-2">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    <Search className="w-5 h-5 text-primary-400" /> Atendimento Rápido
                </h3>
                <button className="text-slate-400 hover:text-white transition-colors">
                    <Filter className="w-4 h-4" />
                </button>
            </div>

            <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                    type="text"
                    placeholder="Buscar por nome ou CPF..."
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    className="w-full bg-slate-950/50 border border-white/10 rounded-xl py-3 pl-11 pr-4 text-white placeholder-slate-500 focus:outline-none focus:border-primary-500/50 transition-all"
                />
            </div>

            <div className="space-y-2 max-h-[400px] overflow-y-auto custom-scrollbar pr-2">
                {loading ? (
                    <div className="py-8 text-center text-slate-500">Carregando pacientes...</div>
                ) : filtered.length > 0 ? (
                    filtered.map(patient => (
                        <button
                            key={patient.id}
                            onClick={() => onSelect(patient.id)}
                            className="w-full group bg-white/5 hover:bg-white/10 border border-white/5 rounded-xl p-4 flex items-center justify-between transition-all"
                        >
                            <div className="flex items-center gap-4">
                                <div className={`w-2.5 h-2.5 rounded-full ${patient.priority === 'high' ? 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]' :
                                        patient.priority === 'medium' ? 'bg-amber-500' : 'bg-emerald-500'
                                    }`} />
                                <div className="text-left">
                                    <p className="text-white font-semibold group-hover:text-primary-400 transition-colors">{patient.name}</p>
                                    <p className="text-slate-500 text-xs mt-0.5">{patient.condition} • {patient.lastVisit}</p>
                                </div>
                            </div>
                            <ChevronRight className="w-4 h-4 text-slate-600 group-hover:translate-x-1 transition-transform" />
                        </button>
                    ))
                ) : (
                    <div className="py-8 text-center text-slate-500">Nenhum paciente encontrado.</div>
                )}
            </div>
        </div>
    )
}
