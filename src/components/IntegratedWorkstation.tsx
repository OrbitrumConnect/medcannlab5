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
    Stethoscope
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
import IntegratedGovernanceView from './ClinicalGovernance/IntegratedGovernanceView'
import EduardoScheduling from './EduardoScheduling'
import PatientsManagement from '../pages/PatientsManagement'

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
        { id: 'patients' as TabId, label: 'Prontuário', icon: Users, color: 'text-blue-400' },
        { id: 'chat' as TabId, label: 'Chat Clínico', icon: MessageSquare, color: 'text-green-400' },
        // ...(user?.type === 'admin' ? [{ id: 'governance' as any, label: 'Governança (ACDSS)', icon: Activity, color: 'text-purple-400' }] : []),
        { id: 'renal' as TabId, label: 'Saúde Renal', icon: Activity, color: 'text-orange-400' },
        { id: 'prescriptions' as TabId, label: 'Prescrições', icon: FileText, color: 'text-pink-400' },
        { id: 'scheduling' as TabId, label: 'Agendamentos', icon: Calendar, color: 'text-cyan-400' }
    ]

    // Inicialização do Estado com Props (se fornecidas)
    const [activeTab, setActiveTab] = useState<TabId>((initialTab as TabId) || 'patients')
    const [selectedPatientId, setSelectedPatientId] = useState<string | null>(defaultPatientId || null)

    const getGender = (g?: string): 'male' | 'female' => {
        if (g?.toLowerCase() === 'female' || g?.toLowerCase() === 'feminino') return 'female'
        return 'male'
    }

    // Renderização do Conteúdo
    const renderContent = () => {
        switch (activeTab) {
            case 'patients':
                return (
                    <div className="h-full w-full overflow-hidden bg-[#0f172a] relative">
                        <div className="absolute inset-0 overflow-y-auto overflow-x-hidden custom-scrollbar">
                            <div className="min-h-full origin-top-left" style={{ transform: 'scale(0.85)', width: '117.65%', height: '117.65%' }}>
                                <PatientsManagement embedded={true} />
                            </div>
                        </div>
                    </div>
                )
            case 'chat':
                return <div className="h-full bg-[#0f172a]"><ProfessionalChatSystem selectedPatientId={selectedPatientId} /></div>
            case 'renal':
                return (
                    <div className="h-full overflow-y-auto bg-[#0f172a]">
                        <RenalFunctionModule patientId={selectedPatientId || undefined} />
                    </div>
                )
            case 'prescriptions':
                return (
                    <div className="h-full overflow-y-auto bg-[#0f172a]">
                        <QuickPrescriptions patientId={selectedPatientId || ''} />
                    </div>
                )
            case 'scheduling':
                return <div className="h-full overflow-y-auto bg-[#0f172a]"><EduardoScheduling /></div>
            case 'governance':
                return <div className="h-full overflow-y-auto bg-[#0f172a]"><IntegratedGovernanceView patientId={selectedPatientId} /></div>
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

                    {/* Botão Sair */}
                    <div className="flex items-center shrink-0 ml-2">
                    </div>
                </div>
            </header >

            <main className="flex-1 overflow-hidden relative bg-[#0f172a] w-full">
                {renderContent()}
            </main>

        </div >
    )
}

export default IntegratedWorkstation
