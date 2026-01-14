import React, { useState, useEffect, useMemo } from 'react'
import {
    Users,
    MessageSquare,
    Activity,
    FileText,
    Calendar,
    Search,
    Loader2,
    User,
    ShieldCheck
} from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import ClinicalChat from './ClinicalChat'
import RenalFunctionModule from './RenalFunctionModule'
import QuickPrescriptions from './QuickPrescriptions'
import EduardoScheduling from './EduardoScheduling'
import ClinicalGovernanceAdmin from '../pages/ClinicalGovernanceAdmin'
import { getAllPatients } from '../lib/adminPermissions'

// Definição das Abas do Terminal Integrado
type TabId = 'chat' | 'renal' | 'prescriptions' | 'scheduling' | 'governance'

interface IntegratedWorkstationProps {
    initialTab?: TabId | 'patients'
    defaultPatientId?: string
}

const IntegratedWorkstation: React.FC<IntegratedWorkstationProps> = ({
    initialTab = 'chat',
    defaultPatientId
}) => {
    const { user } = useAuth()

    // Estado Global do Terminal
    const [activeTab, setActiveTab] = useState<TabId>(initialTab === 'patients' ? 'chat' : initialTab as TabId)
    const [selectedPatientId, setSelectedPatientId] = useState<string | null>(defaultPatientId || null)

    // Patient List Logic
    const [patients, setPatients] = useState<any[]>([])
    const [loadingPatients, setLoadingPatients] = useState(true)
    const [patientSearch, setPatientSearch] = useState('')

    useEffect(() => {
        if (user) {
            loadPatients()
        }
    }, [user])

    const loadPatients = async () => {
        try {
            setLoadingPatients(true)
            // Usando a lógica centralizada de permissões para garantir que admin veja tudo e profs vejam seus pacientes
            const data = await getAllPatients(user!.id, user!.type || 'profissional')
            setPatients(data || [])
        } catch (err) {
            console.error('Erro ao carregar pacientes no Terminal:', err)
        } finally {
            setLoadingPatients(false)
        }
    }

    const filteredPatients = useMemo(() => {
        if (!patientSearch.trim()) return patients
        const query = patientSearch.toLowerCase()
        return patients.filter(p =>
            p.name?.toLowerCase().includes(query) ||
            p.email?.toLowerCase().includes(query)
        )
    }, [patients, patientSearch])

    const handlePatientSelect = (id: string) => {
        setSelectedPatientId(id)
    }

    // Configuração das Abas
    const tabs = [
        { id: 'chat' as TabId, label: 'Chat Clínico', icon: MessageSquare, color: 'text-green-400' },
        { id: 'renal' as TabId, label: 'Saúde Renal', icon: Activity, color: 'text-purple-400' },
        { id: 'prescriptions' as TabId, label: 'Prescrições', icon: FileText, color: 'text-orange-400' },
        { id: 'scheduling' as TabId, label: 'Agendamentos', icon: Calendar, color: 'text-pink-400' },
        ...(user?.type === 'admin' ? [{ id: 'governance' as TabId, label: 'Governança', icon: ShieldCheck, color: 'text-emerald-400' }] : [])
    ]

    // Renderização do Conteúdo da Aba
    const renderActiveTabContent = () => {
        switch (activeTab) {
            case 'chat':
                return <ClinicalChat className="h-full" patientId={selectedPatientId} />
            case 'renal':
                return <RenalFunctionModule patientId={selectedPatientId || undefined} />
            case 'prescriptions':
                return <QuickPrescriptions patientId={selectedPatientId} className="h-full" />
            case 'scheduling':
                return <EduardoScheduling patientId={selectedPatientId} className="h-full" />
            case 'governance':
                return (
                    <ClinicalGovernanceAdmin
                        onAssumirChat={(patientId) => {
                            setSelectedPatientId(patientId);
                            setActiveTab('chat');
                        }}
                    />
                )
            default:
                return <div className="p-8 text-center text-slate-500">Selecione uma ferramenta</div>
        }
    }

    return (
        <div className="flex h-full min-h-[600px] bg-slate-900 overflow-hidden text-slate-100 rounded-2xl border border-slate-800 shadow-2xl">

            {/* COLUNA ESQUERDA: LISTA DE PACIENTES (CONTEXTO PERSISTENTE) */}
            <aside className="w-80 border-r border-slate-800 flex flex-col bg-slate-950/20">
                <div className="p-4 border-b border-slate-800">
                    <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] mb-4">Contexto: Pacientes</h3>
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600" />
                        <input
                            type="text"
                            placeholder="Buscar paciente..."
                            value={patientSearch}
                            onChange={(e) => setPatientSearch(e.target.value)}
                            className="w-full pl-9 pr-3 py-2 bg-slate-900/50 border border-slate-700/50 rounded-lg text-sm text-white placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-emerald-500/30"
                        />
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-2 space-y-1 custom-scrollbar">
                    {loadingPatients ? (
                        <div className="flex items-center justify-center py-12">
                            <Loader2 className="w-6 h-6 animate-spin text-emerald-500/50" />
                        </div>
                    ) : filteredPatients.length === 0 ? (
                        <div className="py-12 text-center">
                            <Users className="w-8 h-8 text-slate-800 mx-auto mb-2" />
                            <p className="text-[10px] text-slate-600 uppercase tracking-widest">Nenhum paciente</p>
                        </div>
                    ) : filteredPatients.map(patient => (
                        <button
                            key={patient.id}
                            onClick={() => handlePatientSelect(patient.id)}
                            className={`w-full p-3 text-left rounded-xl transition-all flex items-center gap-3 group ${selectedPatientId === patient.id
                                    ? 'bg-emerald-500/10 text-white border border-emerald-500/20'
                                    : 'text-slate-500 hover:bg-slate-800/40 hover:text-slate-300'
                                }`}
                        >
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-transform ${selectedPatientId === patient.id
                                    ? 'bg-emerald-500 text-white shadow-[0_0_15px_rgba(16,185,129,0.3)]'
                                    : 'bg-slate-800/80 group-hover:scale-105'
                                }`}>
                                {patient.name?.charAt(0).toUpperCase() || '?'}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className={`text-sm font-semibold truncate ${selectedPatientId === patient.id ? 'text-white' : 'text-slate-300'}`}>
                                    {patient.name}
                                </p>
                                <p className="text-[10px] opacity-40 truncate">{patient.email || 'Sem email'}</p>
                            </div>
                            {selectedPatientId === patient.id && (
                                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            )}
                        </button>
                    ))}
                </div>
            </aside>

            {/* COLUNA DIREITA: FERRAMENTAS INTEGRADAS */}
            <main className="flex-1 flex flex-col min-w-0 relative bg-slate-900/20">

                {/* REBARBA DE NAVEGAÇÃO DE FERRAMENTAS */}
                <header className="h-16 border-b border-slate-800/50 flex items-center justify-between px-6 bg-slate-900/40">
                    <nav className="flex items-center space-x-1">
                        {tabs.map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-widest transition-all flex items-center gap-2 ${activeTab === tab.id
                                        ? 'bg-slate-800 text-emerald-400 border border-emerald-500/20'
                                        : 'text-slate-500 hover:text-slate-300'
                                    }`}
                            >
                                <tab.icon className="w-3.5 h-3.5" />
                                <span>{tab.label}</span>
                            </button>
                        ))}
                    </nav>

                    {selectedPatientId && (
                        <div className="flex items-center px-4 py-1.5 rounded-full bg-emerald-500/5 border border-emerald-500/10 text-emerald-400 text-[10px] uppercase font-black tracking-widest">
                            <span className="opacity-50 mr-2">Paciente:</span>
                            <span className="truncate max-w-[150px]">
                                {patients.find(p => p.id === selectedPatientId)?.name}
                            </span>
                        </div>
                    )}
                </header>

                <div className="flex-1 overflow-hidden">
                    <div className="h-full overflow-y-auto p-4 md:p-6 custom-scrollbar">
                        {activeTab === 'governance' ? renderActiveTabContent() : (
                            selectedPatientId ? renderActiveTabContent() : (
                                <div className="h-full flex flex-col items-center justify-center text-center opacity-40">
                                    <div className="p-4 bg-slate-800/50 rounded-full mb-6">
                                        <Users className="w-10 h-10 text-slate-600" />
                                    </div>
                                    <h2 className="text-lg font-bold text-white mb-2 uppercase tracking-[0.2em]">Seleção Necessária</h2>
                                    <p className="text-xs text-slate-500 max-w-[250px] leading-relaxed">
                                        Para acessar o {tabs.find(t => t.id === activeTab)?.label}, por favor selecione um paciente na lista ao lado.
                                    </p>
                                </div>
                            )
                        )}
                    </div>
                </div>
            </main>
        </div>
    )
}

export default IntegratedWorkstation
