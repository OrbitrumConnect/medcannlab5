import React, { useState } from 'react'
import {
    BarChart3,
    Activity,
    MessageCircle,
    BookOpen,
    FlaskConical,
    ClipboardList,
    Users,
    Bell,
    CheckCircle
} from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import EnsinoDashboard from '../pages/EnsinoDashboard'

import ResearchDashboardContent from './ResearchDashboardContent'
import ForumCasosClinicos from '../pages/ForumCasosClinicos'
import Library from '../pages/Library' // Usado para Protocolos
import CidadeAmigaDosRins from '../pages/CidadeAmigaDosRins'

// Props do Componente
interface ResearchWorkstationProps {
    initialTab?: string
}

type TabGroup = 'pesquisa' | 'colaboracao'
type TabId = 'dashboard' | 'forum' | 'library' | 'protocols' | 'mentoria' | 'newsletter' | 'evaluation'

const ResearchWorkstation: React.FC<ResearchWorkstationProps> = ({ initialTab }) => {
    const { user } = useAuth()

    const [activeTab, setActiveTab] = useState<TabId>(() => {
        const t = (initialTab as TabId)
        const valid: TabId[] = ['dashboard', 'forum', 'library', 'protocols', 'mentoria', 'newsletter', 'evaluation']
        return t && valid.includes(t) ? t : 'dashboard'
    })

    // Abas
    const tabs: { id: TabId; label: string; icon: any; color: string; group: TabGroup }[] = [
        { id: 'dashboard', label: 'Dashboard de Pesquisa', icon: BarChart3, color: 'text-emerald-400', group: 'pesquisa' },
        { id: 'forum', label: 'Fórum de Casos Clínicos', icon: MessageCircle, color: 'text-cyan-400', group: 'colaboracao' },
        { id: 'library', label: 'Base de Conhecimento', icon: BookOpen, color: 'text-indigo-400', group: 'pesquisa' },
        { id: 'protocols', label: 'Protocolos', icon: ClipboardList, color: 'text-orange-400', group: 'pesquisa' },
        { id: 'mentoria', label: 'Mentoria', icon: Users, color: 'text-green-400', group: 'colaboracao' },
        { id: 'newsletter', label: 'Notícias & Eventos', icon: Bell, color: 'text-amber-400', group: 'colaboracao' },
        { id: 'evaluation', label: 'Avaliações', icon: CheckCircle, color: 'text-teal-400', group: 'colaboracao' }
    ]

    const renderContent = () => {
        switch (activeTab) {
            case 'dashboard':
                return (
                    <div className="h-full w-full overflow-hidden bg-[#0f172a] relative integrated-terminal-content">
                        <div className="absolute inset-0 overflow-y-auto overflow-x-hidden scrollbar-hide">
                            <ResearchDashboardContent />
                        </div>
                    </div>
                )
            case 'forum':
                return (
                    <div className="h-full overflow-y-auto scrollbar-hide bg-[#0f172a]">
                        <ForumCasosClinicos />
                    </div>
                )
            case 'library':
                return (
                    <div className="h-full overflow-y-auto scrollbar-hide bg-[#0f172a]">
                        <Library />
                    </div>
                )
            case 'protocols':
                return (
                    <div className="h-full overflow-y-auto scrollbar-hide bg-[#0f172a] p-4">
                        <CidadeAmigaDosRins />
                    </div>
                )
            case 'mentoria':
                return (
                    <div className="h-full overflow-y-auto scrollbar-hide bg-[#0f172a]">
                        <EnsinoDashboard forcedSection="mentoria" />
                    </div>
                )
            case 'newsletter':
                return (
                    <div className="h-full overflow-y-auto scrollbar-hide bg-[#0f172a]">
                        <EnsinoDashboard forcedSection="newsletter" />
                    </div>
                )
            case 'evaluation':
                return (
                    <div className="h-full overflow-y-auto scrollbar-hide bg-[#0f172a]">
                        <EnsinoDashboard forcedSection="avaliacao" />
                    </div>
                )
            default:
                return null
        }
    }

    return (
        <div className="flex flex-col h-[calc(100vh-64px)] bg-[#0f172a] w-full max-w-full overflow-hidden" data-integrated-terminal-research>
            <header className="bg-gradient-to-r from-slate-900 via-slate-800 to-emerald-900 border-b border-[#334155] shrink-0 z-10 shadow-sm relative w-full h-12 flex items-center">
                <div className="flex items-center justify-between px-3 w-full h-full">
                    <div className="flex items-center gap-3 shrink-0">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-600 to-teal-600 flex items-center justify-center shadow-md">
                            <FlaskConical className="w-4 h-4 text-white" />
                        </div>
                        <div className="hidden sm:block leading-tight">
                            <h1 className="text-sm font-bold text-white leading-none">Terminal de Pesquisa</h1>
                            <p className="text-[9px] uppercase tracking-wider text-slate-400 font-semibold mt-0.5">MedCannLab Research</p>
                        </div>
                    </div>

                    <nav className="flex-1 flex items-center justify-start sm:justify-center overflow-x-auto no-scrollbar mx-2 h-full">
                        <div className="flex items-center gap-1 h-full">
                            {tabs.map((tab) => {
                                const Icon = tab.icon
                                const isActive = activeTab === tab.id
                                return (
                                    <button
                                        key={tab.id}
                                        onClick={() => setActiveTab(tab.id)}
                                        className={`
                                            relative group flex items-center gap-1.5 px-2.5 h-8 rounded-md text-xs font-medium transition-all whitespace-nowrap
                                            ${isActive
                                                ? 'bg-[#334155] text-white shadow-inner'
                                                : 'text-slate-400 hover:text-slate-200 hover:bg-[#334155]/50'}
                                        `}
                                    >
                                        <Icon className={`w-3.5 h-3.5 transition-colors ${isActive ? tab.color : 'text-slate-500 group-hover:text-slate-400'}`} />
                                        <span className="hidden sm:inline">{tab.label}</span>
                                        {isActive && (
                                            <span className={`absolute bottom-0 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full mb-0.5 ${tab.color.replace('text-', 'bg-')}`}></span>
                                        )}
                                    </button>
                                )
                            })}
                        </div>
                    </nav>

                    {/* Espaço para ações futuras ou botão sair (que já fi ca no menu lateral) */}
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

export default ResearchWorkstation
