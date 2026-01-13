import React, { useState, useEffect, useMemo } from 'react'
import {
    Users,
    MessageSquare,
    Activity,
    FileText,
    Calendar,
    Search,
    Settings,
    Menu,
    Loader2,
    ChevronRight,
    User
} from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import ClinicalChat from './ClinicalChat'
import RenalFunctionModule from './RenalFunctionModule'
import QuickPrescriptions from './QuickPrescriptions'
import EduardoScheduling from './EduardoScheduling'
import ClinicalGovernanceAdmin from '../pages/ClinicalGovernanceAdmin'
import { supabase } from '../lib/supabase'

// Definição das Abas do Terminal Integrado
type TabId = 'patients' | 'chat' | 'renal' | 'prescriptions' | 'scheduling' | 'governance'

interface IntegratedWorkstationProps {
    initialTab?: TabId
    defaultPatientId?: string
}

interface Patient {
    id: string
    name: string
    email: string
    phone?: string
    birth_date?: string
    gender?: string
    created_at?: string
}

const IntegratedWorkstation: React.FC<IntegratedWorkstationProps> = ({
    initialTab = 'patients',
    defaultPatientId
}) => {
    const { user } = useAuth()

    // Estado Global do Terminal
    const [activeTab, setActiveTab] = useState<TabId>(initialTab)
    const [selectedPatientId, setSelectedPatientId] = useState<string | null>(defaultPatientId || null)
    const [isSidebarCollapsed, setSidebarCollapsed] = useState(false)

    // Patient List Logic
    const [patients, setPatients] = useState<Patient[]>([])
    const [loadingPatients, setLoadingPatients] = useState(true)
    const [patientSearch, setPatientSearch] = useState('')

    useEffect(() => {
        loadPatients()
    }, [])

    const loadPatients = async () => {
        try {
            setLoadingPatients(true)
            const { data, error } = await supabase
                .from('users')
                .select('id, name, email, phone, birth_date, gender, created_at')
                .eq('type', 'paciente')
                .order('name')
                .limit(100)

            if (error) throw error
            setPatients(data || [])
        } catch (err) {
            console.error('Erro ao carregar pacientes:', err)
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
        // Opcional: Mudar para aba de Chat ou Prontuário automaticamente
        // setActiveTab('chat') 
    }

    // Contexto da Sessão
    const activeContext = "Atendimento Clínico"

    // Configuração das Abas
    const tabs = [
        { id: 'patients' as TabId, label: 'Pacientes', icon: Users, color: 'text-blue-400' },
        { id: 'chat' as TabId, label: 'Chat Clínico', icon: MessageSquare, color: 'text-green-400' },
        // Aba de Governança (Visível apenas para Admins ou Profissionais Sênior)
        ...(user?.type === 'admin' ? [{ id: 'governance' as any, label: 'Governança (ACDSS)', icon: Activity, color: 'text-purple-400' }] : []),
        { id: 'renal' as TabId, label: 'Saúde Renal', icon: Activity, color: 'text-purple-400' },
        { id: 'prescriptions' as TabId, label: 'Prescrições', icon: FileText, color: 'text-orange-400' },
        { id: 'scheduling' as TabId, label: 'Agendamentos', icon: Calendar, color: 'text-pink-400' }
    ]

    // Renderização do Conteúdo da Aba
    const renderContent = () => {
        switch (activeTab) {
            case 'patients':
                return (
                    <div className="h-full flex flex-col">
                        <div className="p-6 border-b border-slate-700 bg-slate-900/50">
                            <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                                <Users className="w-6 h-6 text-blue-400" />
                                Gestão de Pacientes
                            </h2>
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                <input
                                    type="text"
                                    placeholder="Buscar paciente por nome ou email..."
                                    value={patientSearch}
                                    onChange={(e) => setPatientSearch(e.target.value)}
                                    className="w-full pl-10 pr-4 py-3 bg-slate-800 border border-slate-600 rounded-xl text-white placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
                                />
                            </div>
                        </div>
                        <div className="flex-1 overflow-y-auto p-4 bg-slate-900/30">
                            {loadingPatients ? (
                                <div className="flex flex-col items-center justify-center py-12 space-y-3">
                                    <Loader2 className="w-8 h-8 text-emerald-400 animate-spin" />
                                    <p className="text-slate-400 text-sm">Carregando pacientes...</p>
                                </div>
                            ) : filteredPatients.length === 0 ? (
                                <div className="text-center py-12 text-slate-400">
                                    <User className="w-12 h-12 mx-auto mb-3 opacity-20" />
                                    <p className="text-sm">Nenhum paciente encontrado.</p>
                                </div>
                            ) : (
                                <div className="grid gap-3">
                                    {filteredPatients.map((patient) => (
                                        <button
                                            key={patient.id}
                                            onClick={() => handlePatientSelect(patient.id)}
                                            className={`w-full p-4 text-left transition-all flex items-center gap-4 rounded-xl border group relative overflow-hidden ${selectedPatientId === patient.id
                                                ? 'bg-gradient-to-r from-emerald-900/40 to-blue-900/40 border-emerald-500/50 shadow-lg shadow-emerald-900/20'
                                                : 'bg-slate-800/40 border-slate-700/50 hover:bg-slate-800 hover:border-slate-600'
                                                }`}
                                        >
                                            {selectedPatientId === patient.id && (
                                                <div className="absolute left-0 top-0 bottom-0 w-1 bg-emerald-500" />
                                            )}
                                            <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-inner ${selectedPatientId === patient.id
                                                ? 'bg-gradient-to-br from-emerald-500 to-cyan-500'
                                                : 'bg-slate-700 group-hover:bg-slate-600'
                                                }`}>
                                                {patient.name?.charAt(0)?.toUpperCase() || '?'}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center justify-between mb-1">
                                                    <p className={`font-semibold truncate ${selectedPatientId === patient.id ? 'text-white' : 'text-slate-200'}`}>
                                                        {patient.name || 'Sem nome'}
                                                    </p>
                                                    {selectedPatientId === patient.id && (
                                                        <span className="text-[10px] uppercase tracking-wider font-bold text-emerald-400 bg-emerald-400/10 px-2 py-0.5 rounded-full border border-emerald-400/20">
                                                            Ativo
                                                        </span>
                                                    )}
                                                </div>
                                                <p className="text-slate-400 text-sm truncate">{patient.email}</p>
                                            </div>
                                            <ChevronRight className={`w-5 h-5 transition-transform duration-300 ${selectedPatientId === patient.id ? 'rotate-90 text-emerald-400' : 'text-slate-600 group-hover:text-slate-400 group-hover:translate-x-1'}`} />
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                )
            case 'chat':
                return (
                    <div className="p-4 h-full">
                        <ClinicalChat
                            className="h-full shadow-xl"
                            patientId={selectedPatientId}
                        />
                    </div>
                )
            case 'renal':
                return (
                    <div className="p-4 h-full overflow-hidden">
                        <div className="h-full overflow-y-auto">
                            <RenalFunctionModule patientId={selectedPatientId || undefined} />
                        </div>
                    </div>
                )
            case 'prescriptions':
                return (
                    <div className="p-4 h-full">
                        <QuickPrescriptions
                            patientId={selectedPatientId}
                            className="h-full"
                        />
                    </div>
                )
            case 'scheduling':
                return (
                    <div className="p-4 h-full overflow-hidden">
                        <div className="h-full overflow-y-auto">
                            <EduardoScheduling
                                patientId={selectedPatientId}
                                className="h-full"
                            />
                        </div>
                    </div>
                )
            case 'governance':
                return (
                    <div className="p-4 h-full overflow-hidden">
                        <div className="h-full overflow-y-auto">
                            <ClinicalGovernanceAdmin
                                onAssumirChat={(patientId) => {
                                    setSelectedPatientId(patientId);
                                    setActiveTab('chat');
                                }}
                            />
                        </div>
                    </div>
                )
            default:
                return <div className="p-8 text-center text-slate-500">Selecione uma aba para começar</div>
        }
    }

    return (
        <div className="flex h-screen bg-slate-900 overflow-hidden text-slate-100">

            {/* 1. Sidebar de Contexto (Mini) */}
            <aside className={`bg-slate-950 border-r border-slate-800 flex flex-col transition-all duration-300 ${isSidebarCollapsed ? 'w-16' : 'w-64'}`}>
                <div className="h-16 flex items-center px-4 border-b border-slate-800">
                    <button onClick={() => setSidebarCollapsed(!isSidebarCollapsed)} className="p-2 hover:bg-slate-800 rounded-lg">
                        <Menu className="w-5 h-5 text-slate-400" />
                    </button>
                    {!isSidebarCollapsed && <span className="ml-3 font-semibold text-emerald-400">MedCannLab OS</span>}
                </div>

                <div className="flex-1 py-6 space-y-2 px-2 overflow-y-auto custom-scrollbar">
                    {/* Contexto Ativo */}
                    <div className={`p-3 rounded-xl bg-slate-800/50 border border-slate-700 mb-6 ${isSidebarCollapsed ? 'mx-1 flex justify-center' : 'mx-2'}`}>
                        <div className="flex items-center space-x-3">
                            <Activity className="w-6 h-6 text-emerald-400" />
                            {!isSidebarCollapsed && (
                                <div>
                                    <p className="text-xs text-slate-400 uppercase tracking-wider">Contexto</p>
                                    <p className="font-bold text-white max-w-[140px] truncate">{activeContext}</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Menu de Navegação do Contexto */}
                    <nav className="space-y-1">
                        {tabs.map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`w-full flex items-center space-x-3 px-3 py-3 rounded-lg transition-all
                   ${activeTab === tab.id
                                        ? 'bg-gradient-to-r from-blue-600/20 to-emerald-600/20 text-white border-l-2 border-emerald-400'
                                        : 'text-slate-400 hover:bg-slate-900 hover:text-white'
                                    }
                   ${isSidebarCollapsed ? 'justify-center' : ''}
                 `}
                                title={isSidebarCollapsed ? tab.label : ''}
                            >
                                <tab.icon className={`w-5 h-5 ${activeTab === tab.id ? tab.color : 'text-slate-500'}`} />
                                {!isSidebarCollapsed && <span>{tab.label}</span>}
                            </button>
                        ))}
                    </nav>
                </div>

                {/* User Profile (Mini) */}
                <div className="p-4 border-t border-slate-800">
                    <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 rounded-full bg-emerald-900/50 flex items-center justify-center border border-emerald-500/30">
                            <span className="font-bold text-emerald-400">{user?.email?.charAt(0).toUpperCase()}</span>
                        </div>
                        {!isSidebarCollapsed && (
                            <div className="flex-1 overflow-hidden">
                                <p className="text-sm font-medium text-white truncate">{user?.name || 'Usuário'}</p>
                                <p className="text-xs text-slate-500 truncate">{user?.type}</p>
                            </div>
                        )}
                    </div>
                </div>
            </aside>

            {/* 2. Área Principal (Terminal) */}
            <main className="flex-1 flex flex-col min-w-0 bg-slate-900 relative">

                {/* Topbar: Informações do Contexto + Ações Rápidas */}
                <header className="h-16 bg-slate-900/80 backdrop-blur-md border-b border-slate-800 flex items-center justify-between px-6 sticky top-0 z-20">
                    <div className="flex items-center space-x-4">
                        <h2 className="text-lg font-semibold text-white flex items-center">
                            {tabs.find(t => t.id === activeTab)?.icon &&
                                React.createElement(tabs.find(t => t.id === activeTab)!.icon, { className: "w-5 h-5 mr-2 " + tabs.find(t => t.id === activeTab)?.color })
                            }
                            {tabs.find(t => t.id === activeTab)?.label}
                        </h2>
                        {/* Status do Paciente */}
                        {selectedPatientId && (
                            <>
                                <span className="text-slate-600">/</span>
                                <div className="flex items-center px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-sm">
                                    <User className="w-3 h-3 mr-2" />
                                    <span className="font-semibold mr-1">Paciente ID:</span>
                                    <span className="opacity-80 font-mono text-xs">{selectedPatientId.slice(0, 8)}...</span>
                                    <button
                                        onClick={() => setSelectedPatientId(null)}
                                        className="ml-2 hover:text-white hover:bg-white/10 rounded-full p-0.5"
                                        title="Deselecionar"
                                    >
                                        <div className="w-3 h-3 flex items-center justify-center">×</div>
                                    </button>
                                </div>
                            </>
                        )}
                    </div>

                    <div className="flex items-center space-x-3">
                        <button className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg">
                            <Search className="w-5 h-5" />
                        </button>
                        <button className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg">
                            <Settings className="w-5 h-5" />
                        </button>
                    </div>
                </header>

                {/* Área de Conteúdo Scrollável */}
                <div className="flex-1 overflow-hidden relative">
                    {renderContent()}
                </div>

            </main>

        </div>
    )
}

export default IntegratedWorkstation
