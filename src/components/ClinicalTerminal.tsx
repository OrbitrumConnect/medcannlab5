import React, { useState } from 'react'
import {
    Activity,
    FileText,
    BookOpen,
    BarChart3,
    Shield,
    Terminal as TerminalIcon,
    Settings,
    Users
} from 'lucide-react'
import ClinicalGovernanceAdmin from '../pages/ClinicalGovernanceAdmin'
import Reports from '../pages/Reports'
import Library from '../pages/Library'

type TabId = 'mission' | 'records' | 'reports' | 'knowledge'

const ClinicalTerminal: React.FC = () => {
    const [activeTab, setActiveTab] = useState<TabId>('mission')

    const tabs = [
        { id: 'mission' as TabId, label: 'Mission Control', icon: Activity, color: 'text-indigo-400' },
        { id: 'reports' as TabId, label: 'Relatórios IA', icon: BarChart3, color: 'text-orange-400' },
        { id: 'knowledge' as TabId, label: 'Base de Conhecimento', icon: BookOpen, color: 'text-emerald-400' }
    ]

    const renderContent = () => {
        switch (activeTab) {
            case 'mission':
                return <div className="h-full overflow-y-auto"><ClinicalGovernanceAdmin /></div>
            case 'reports':
                return <div className="h-full overflow-y-auto"><Reports /></div>
            case 'knowledge':
                return <div className="h-full overflow-y-auto"><Library /></div>
            default:
                return null
        }
    }

    return (
        <div className="flex flex-col h-[calc(100vh-64px)] bg-[#050914] w-full overflow-hidden">
            {/* Header do Terminal */}
            <header className="bg-[#0B1120] border-b border-slate-800 shrink-0 z-20 shadow-2xl">
                <div className="flex items-center justify-between px-6 h-16 w-full">
                    <div className="flex items-center gap-4 shrink-0">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-600 to-cyan-600 flex items-center justify-center shadow-[0_0_20px_rgba(79,70,229,0.3)]">
                            <TerminalIcon className="w-6 h-6 text-white" />
                        </div>
                        <div className="hidden sm:block">
                            <h1 className="text-xl font-black text-white leading-none tracking-tight">TERMINAL <span className="text-indigo-400">CLÍNICO</span></h1>
                            <p className="text-[10px] uppercase tracking-widest text-slate-500 font-bold mt-1">Command & Governance Center</p>
                        </div>
                    </div>

                    <nav className="flex-1 flex items-center justify-center mx-4 h-full">
                        <div className="flex items-center gap-2 p-1 bg-slate-900/50 rounded-2xl border border-slate-800/50">
                            {tabs.map((tab) => {
                                const Icon = tab.icon
                                const isActive = activeTab === tab.id
                                return (
                                    <button
                                        key={tab.id}
                                        onClick={() => setActiveTab(tab.id)}
                                        className={`
                                            relative group flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-bold transition-all whitespace-nowrap
                                            ${isActive
                                                ? 'bg-slate-800 text-white shadow-lg border border-slate-700/50'
                                                : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800/30'}
                                        `}
                                    >
                                        <Icon className={`w-4 h-4 transition-colors ${isActive ? tab.color : 'text-slate-600 group-hover:text-slate-500'}`} />
                                        <span className="hidden md:inline">{tab.label}</span>
                                        {isActive && (
                                            <div className={`absolute -bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full blur-[2px] ${tab.color.replace('text-', 'bg-')}`}></div>
                                        )}
                                    </button>
                                )
                            })}
                        </div>
                    </nav>

                    <div className="flex items-center gap-3 shrink-0">
                        <div className="h-8 w-[1px] bg-slate-800 mx-2 hidden sm:block"></div>
                        <div className="p-2 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
                            <Shield className="w-5 h-5" />
                        </div>
                    </div>
                </div>
            </header>

            {/* Main Viewport */}
            <main className="flex-1 overflow-hidden relative bg-[#050914]">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(17,24,39,1)_0%,rgba(5,9,20,1)_100%)]"></div>
                <div className="relative h-full z-10 animate-in fade-in zoom-in-95 duration-500">
                    {renderContent()}
                </div>
            </main>
        </div>
    )
}

export default ClinicalTerminal
