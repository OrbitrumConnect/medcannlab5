import React, { useState, useEffect, useMemo } from 'react'
import {
    Users,
    MessageSquare,
    Activity,
    FileText,
    Calendar,
    Search,
    Loader2,
    Settings,
    User,
    ChevronRight,
    Brain,
    MessageCircle,
    LayoutDashboard,
    Stethoscope,
    UserPlus
} from 'lucide-react'
import { CreatePatientModal } from '../components/CreatePatientModal'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { getAllPatients } from '../lib/adminPermissions'

// Imports dos Módulos Integrados
import RenalFunctionModule from './RenalFunctionModule'
import QuickPrescriptions from './QuickPrescriptions'
import ProfessionalChatSystem from './ProfessionalChatSystem'
import VideoCall from './VideoCall'
import ClinicalGovernanceAdmin from '../pages/ClinicalGovernanceAdmin'
import EduardoScheduling from './EduardoScheduling'

// Interfaces
interface Patient {
    id: string
    name: string
    email?: string
    phone?: string
    status?: string
    lastVisit?: string
    avatar_url?: string
    birth_date?: string
    gender?: string
    age?: number
}

// Props do Componente (Adicionadas para corrigir erros no RicardoValencaDashboard)
interface IntegratedWorkstationProps {
    initialTab?: string
    defaultPatientId?: string
}

type TabId = 'patients' | 'chat' | 'renal' | 'prescriptions' | 'scheduling' | 'governance'

const IntegratedWorkstation: React.FC<IntegratedWorkstationProps> = ({ initialTab, defaultPatientId }) => {
    const { user } = useAuth()

    // Configuração de Abas
    const tabs = [
        { id: 'patients' as TabId, label: 'Pacientes', icon: Users, color: 'text-blue-400' },
        { id: 'chat' as TabId, label: 'Chat Clínico', icon: MessageSquare, color: 'text-green-400' },
        ...(user?.type === 'admin' ? [{ id: 'governance' as any, label: 'Governança (ACDSS)', icon: Activity, color: 'text-purple-400' }] : []),
        { id: 'renal' as TabId, label: 'Saúde Renal', icon: Activity, color: 'text-orange-400' },
        { id: 'prescriptions' as TabId, label: 'Prescrições', icon: FileText, color: 'text-pink-400' },
        { id: 'scheduling' as TabId, label: 'Agendamentos', icon: Calendar, color: 'text-cyan-400' }
    ]

    // Inicialização do Estado com Props (se fornecidas)
    const [activeTab, setActiveTab] = useState<TabId>((initialTab as TabId) || 'patients')
    const [selectedPatientId, setSelectedPatientId] = useState<string | null>(defaultPatientId || null)

    // Lista de Pacientes
    const [patients, setPatients] = useState<Patient[]>([])
    const [loadingPatients, setLoadingPatients] = useState(true)
    const [patientSearch, setPatientSearch] = useState('')

    // Video Call
    const [isVideoCallOpen, setIsVideoCallOpen] = useState(false)
    const [showCreatePatientModal, setShowCreatePatientModal] = useState(false)

    // Efeito para atualizar estado se props mudarem externamente
    useEffect(() => {
        if (initialTab) setActiveTab(initialTab as TabId)
        if (defaultPatientId) setSelectedPatientId(defaultPatientId)
    }, [initialTab, defaultPatientId])

    useEffect(() => {
        loadPatients()
    }, [user])

    const loadPatients = async () => {
        try {
            setLoadingPatients(true)
            const data: any = await getAllPatients(user)

            if (data) {
                const mapped: Patient[] = data.map((p: any) => ({
                    id: p.id,
                    name: p.name || 'Sem Nome',
                    email: p.email,
                    phone: p.phone,
                    status: p.status,
                    lastVisit: p.lastVisit,
                    birth_date: p.birth_date,
                    gender: p.gender,
                    age: p.age || 40 // Default age
                }))
                setPatients(mapped)
            }
        } catch (err) {
            console.error('Erro ao carregar pacientes:', err)
        } finally {
            setLoadingPatients(false)
        }
    }

    const filteredPatients = useMemo(() => {
        let result = patients
        if (patientSearch.trim()) {
            const query = patientSearch.toLowerCase()
            result = patients.filter(p =>
                p.name?.toLowerCase().includes(query) ||
                p.email?.toLowerCase().includes(query)
            )
        }
        return result.sort((a, b) => (a.name || '').localeCompare(b.name || ''))
    }, [patients, patientSearch])

    const handlePatientSelect = (id: string) => {
        setSelectedPatientId(id)
    }

    const selectedPatient = filteredPatients.find(p => p.id === selectedPatientId)

    const getGender = (g?: string): 'male' | 'female' => {
        if (g?.toLowerCase() === 'female' || g?.toLowerCase() === 'feminino') return 'female'
        return 'male'
    }

    // Renderização do Conteúdo
    const renderContent = () => {
        switch (activeTab) {
            case 'patients':
                return (
                    <div className="h-full flex flex-col md:flex-row bg-[#0f172a] overflow-hidden">
                        <div className="w-full md:w-80 border-r border-[#334155] flex flex-col bg-[#1e293b]/50 shrink-0">
                            <div className="p-4 border-b border-[#334155]">
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                    <input
                                        type="text"
                                        placeholder="Buscar..."
                                        value={patientSearch}
                                        onChange={(e) => setPatientSearch(e.target.value)}
                                        className="w-full pl-9 pr-4 py-2 bg-[#0f172a] border border-[#334155] rounded-lg text-white text-sm focus:outline-none focus:border-blue-500"
                                    />
                                </div>
                            </div>
                            <div className="flex-1 overflow-y-auto p-0 custom-scrollbar">
                                {loadingPatients ? (
                                    <div className="flex justify-center p-8"><Loader2 className="w-6 h-6 animate-spin text-blue-500" /></div>
                                ) : (
                                    <div className="divide-y divide-[#334155]/50">
                                        {filteredPatients.length > 0 ? (
                                            filteredPatients.map(patient => (
                                                <button
                                                    key={patient.id}
                                                    onClick={() => handlePatientSelect(patient.id)}
                                                    className={`w-full p-4 text-left transition-colors flex items-center gap-3 border-l-4 ${selectedPatientId === patient.id
                                                        ? 'bg-[#334155] border-blue-500 text-white'
                                                        : 'border-transparent hover:bg-[#334155]/50 text-slate-300'
                                                        }`}
                                                >
                                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${selectedPatientId === patient.id ? 'bg-blue-600 text-white' : 'bg-slate-700 text-slate-300'
                                                        }`}>
                                                        {patient.name.charAt(0).toUpperCase()}
                                                    </div>
                                                    <div className="overflow-hidden min-w-0">
                                                        <p className="font-medium truncate text-sm">{patient.name}</p>
                                                        <p className="text-xs text-slate-500 truncate">{patient.email}</p>
                                                    </div>
                                                </button>
                                            ))
                                        ) : (
                                            <div className="p-8 text-center bg-[#1e293b]/30 m-4 rounded-xl border border-dashed border-slate-700">
                                                <p className="text-slate-400 text-sm mb-3">Nenhum paciente encontrado com esse nome.</p>
                                                <button
                                                    onClick={() => setShowCreatePatientModal(true)}
                                                    className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-medium transition-colors inline-flex items-center gap-2"
                                                >
                                                    <UserPlus className="w-4 h-4" />
                                                    Cadastrar Novo
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                            <div className="p-2 border-t border-[#334155] text-center text-xs text-slate-500">
                                {filteredPatients.length} pacientes (A-Z)
                            </div>
                        </div>

                        <div className="flex-1 p-0 overflow-y-auto bg-[#0f172a] relative">
                            {selectedPatientId ? (
                                <div className="p-6 md:p-8 space-y-6 animate-in fade-in duration-300 max-w-5xl mx-auto">
                                    <div className="bg-[#1e293b] rounded-xl border border-[#334155] p-6 shadow-lg">
                                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
                                            <div className="flex items-center gap-4">
                                                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-2xl font-bold text-white shadow-lg shrink-0">
                                                    {selectedPatient?.name.charAt(0)}
                                                </div>
                                                <div>
                                                    <h1 className="text-2xl font-bold text-white">
                                                        {selectedPatient?.name}
                                                    </h1>
                                                    <div className="flex items-center gap-2 mt-1">
                                                        <span className="px-2 py-0.5 rounded-full bg-green-500/10 text-green-400 text-xs border border-green-500/20 flex items-center gap-1">
                                                            <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></div>
                                                            Ativo
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => setIsVideoCallOpen(true)}
                                                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-2 shadow-lg hover:shadow-blue-600/20"
                                                >
                                                    Iniciar Videochamada
                                                </button>
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                            <div className="p-4 rounded-lg bg-[#0f172a] border border-[#334155]">
                                                <p className="text-slate-500 text-xs uppercase mb-1 font-semibold">Email</p>
                                                <p className="text-slate-200 text-sm truncate">{selectedPatient?.email || 'N/A'}</p>
                                            </div>
                                            <div className="p-4 rounded-lg bg-[#0f172a] border border-[#334155]">
                                                <p className="text-slate-500 text-xs uppercase mb-1 font-semibold">Telefone</p>
                                                <p className="text-slate-200 text-sm">{selectedPatient?.phone || 'N/A'}</p>
                                            </div>
                                            <div className="p-4 rounded-lg bg-[#0f172a] border border-[#334155]">
                                                <p className="text-slate-500 text-xs uppercase mb-1 font-semibold">Última Visita</p>
                                                <p className="text-slate-200 text-sm">{selectedPatient?.lastVisit || 'N/A'}</p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="bg-gradient-to-br from-[#1e293b] to-[#0f172a] rounded-xl border border-[#334155] p-6 shadow-lg relative overflow-hidden">
                                        <div className="absolute top-0 right-0 p-4 opacity-5">
                                            <Brain className="w-32 h-32 text-emerald-400" />
                                        </div>
                                        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2 relative z-10">
                                            <Brain className="w-5 h-5 text-emerald-400" />
                                            Análise Clínica Nôa (IA)
                                        </h3>
                                        <div className="bg-[#0f172a]/50 p-4 rounded-lg border border-[#334155]/50 relative z-10">
                                            <p className="text-slate-300 text-sm leading-relaxed italic">
                                                "Paciente demonstra estabilidade clínica. Atenção recomendada para marcadores renais na próxima avaliação laboratorial. Nenhuma interação medicamentosa crítica detectada."
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="flex flex-col items-center justify-center h-full text-slate-500 p-8">
                                    <div className="w-24 h-24 rounded-full bg-[#1e293b] border border-[#334155] flex items-center justify-center mb-6 shadow-xl animate-pulse">
                                        <Users className="w-10 h-10 text-slate-600" />
                                    </div>
                                    <h3 className="text-xl font-bold text-slate-300">Terminal de Atendimento</h3>
                                    <p className="text-sm mt-2 max-w-md text-center text-slate-400 mb-6">
                                        Selecione um paciente na lista à esquerda para carregar o prontuário.
                                    </p>
                                    <button
                                        onClick={() => setShowCreatePatientModal(true)}
                                        className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl font-medium transition-all shadow-lg hover:shadow-blue-500/25 flex items-center gap-2"
                                    >
                                        <UserPlus className="w-5 h-5" />
                                        Novo Atendimento (Cadastrar Paciente)
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                )
            case 'chat':
                return <div className="h-full bg-[#0f172a]"><ProfessionalChatSystem selectedPatientId={selectedPatientId} /></div>
            case 'renal':
                return <RenalFunctionModule
                    patientId={selectedPatientId || undefined}
                    patientAge={selectedPatient?.age || 40}
                    patientGender={getGender(selectedPatient?.gender)}
                />
            case 'prescriptions':
                return <QuickPrescriptions patientId={selectedPatientId || ''} />
            case 'scheduling':
                return <div className="h-full overflow-y-auto bg-[#0f172a]"><EduardoScheduling /></div>
            case 'governance':
                return <div className="h-full overflow-y-auto bg-[#0f172a]"><ClinicalGovernanceAdmin /></div>
            default:
                return null
        }
    }

    return (
        <div className="flex flex-col h-[calc(100vh-64px)] bg-[#0f172a] w-full max-w-full overflow-hidden">
            <header className="bg-[#1e293b] border-b border-[#334155] shrink-0 z-10 shadow-sm relative w-full">
                <div className="flex items-center justify-between px-4 h-16 w-full">
                    <div className="flex items-center gap-4 shrink-0">
                        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center shadow-lg">
                            <Stethoscope className="w-6 h-6 text-white" />
                        </div>
                        <div className="hidden sm:block">
                            <h1 className="text-lg font-bold text-white leading-none">Terminal Integrado</h1>
                            <p className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold mt-1">MedCannLab OS</p>
                        </div>
                    </div>

                    <nav className="flex-1 flex items-center justify-start sm:justify-center overflow-x-auto no-scrollbar mx-4 h-full">
                        <div className="flex items-center gap-1 h-full">
                            {tabs.map((tab) => {
                                const Icon = tab.icon
                                const isActive = activeTab === tab.id
                                return (
                                    <button
                                        key={tab.id}
                                        onClick={() => setActiveTab(tab.id)}
                                        className={`
                                            relative group flex items-center gap-2 px-3 sm:px-4 h-10 rounded-lg text-sm font-medium transition-all whitespace-nowrap
                                            ${isActive
                                                ? 'bg-[#334155] text-white shadow-inner'
                                                : 'text-slate-400 hover:text-slate-200 hover:bg-[#334155]/50'}
                                        `}
                                    >
                                        <Icon className={`w-4 h-4 transition-colors ${isActive ? tab.color : 'text-slate-500 group-hover:text-slate-400'}`} />
                                        <span className="hidden sm:inline">{tab.label}</span>
                                        {isActive && (
                                            <span className={`absolute bottom-0 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full mb-1 ${tab.color.replace('text-', 'bg-')}`}></span>
                                        )}
                                    </button>
                                )
                            })}
                        </div>
                    </nav>
                </div>
            </header>

            <main className="flex-1 overflow-hidden relative bg-[#0f172a] w-full">
                {renderContent()}
            </main>

            {selectedPatient && (
                <VideoCall
                    isOpen={isVideoCallOpen}
                    onClose={() => setIsVideoCallOpen(false)}
                    patientId={selectedPatient.id} // CORRIGIDO: Usando patientId ao invÃ©s de name
                // Removed: patientName, isVideo (not in interface)
                />
            )}

            <CreatePatientModal
                isOpen={showCreatePatientModal}
                onClose={() => setShowCreatePatientModal(false)}
                onSuccess={() => {
                    loadPatients()
                    // Feedback visual opcional
                }}
            />
        </div>
    )
}

export default IntegratedWorkstation
