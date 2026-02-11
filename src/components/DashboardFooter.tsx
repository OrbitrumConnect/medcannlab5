import React from 'react'
import { Brain } from 'lucide-react'

// Interface para as opções de navegação
export interface FooterOption {
    id: string
    label: string
    icon: React.ElementType
}

interface DashboardFooterProps {
    leftOptions: FooterOption[]
    rightOptions: FooterOption[]
    activeTab: string
    onTabChange: (id: string) => void
    onBrainClick: () => void
}

const DashboardFooter: React.FC<DashboardFooterProps> = ({
    leftOptions,
    rightOptions,
    activeTab,
    onTabChange,
    onBrainClick
}) => {
    return (
        <div className="mt-8 mb-4 relative z-40 w-full animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="max-w-7xl mx-auto px-4 flex items-center justify-center gap-4 lg:gap-8">

                {/* Lado Esquerdo - Grow from center */}
                <div className="flex-1 flex justify-end overflow-hidden">
                    <div
                        className="flex items-center gap-3 overflow-x-auto no-scrollbar px-4 py-2 mask-linear-fade-left"
                        style={{ direction: 'rtl', scrollbarWidth: 'none' }}
                    >
                        <div className="flex items-center gap-3" style={{ direction: 'ltr' }}>
                            {leftOptions.map((option) => (
                                <button
                                    key={option.id}
                                    onClick={() => onTabChange(option.id)}
                                    className={[
                                        'group flex-shrink-0 flex items-center justify-center gap-2 px-3 py-1.5 rounded-xl transition-all duration-300 border whitespace-nowrap',
                                        activeTab === option.id
                                            ? 'bg-emerald-600/20 border-emerald-500/40 text-emerald-100 shadow-lg shadow-emerald-500/10 scale-105'
                                            : 'bg-slate-800/40 border-slate-700/30 text-slate-400 hover:bg-slate-700/60 hover:text-white hover:border-emerald-500/30 hover:scale-105'
                                    ].join(' ')}
                                >
                                    <option.icon className={`w-4 h-4 transition-colors ${activeTab === option.id ? 'text-emerald-400' : 'text-slate-400 group-hover:text-emerald-400'}`} />
                                    <span className="text-xs font-medium hidden sm:inline">{option.label}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Cérebro Central - Fixo e Grande */}
                <div className="relative group flex-shrink-0 z-50">
                    <div className="absolute inset-0 bg-emerald-500/20 rounded-full blur-2xl group-hover:bg-emerald-500/30 transition-all duration-500"></div>
                    <button
                        type="button"
                        onClick={onBrainClick}
                        className="relative w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-gradient-to-b from-emerald-400 to-emerald-600 flex items-center justify-center shadow-xl shadow-emerald-500/20 border-4 border-[#0f172a] hover:scale-110 hover:-translate-y-1 transition-all duration-300 transform active:scale-95"
                    >
                        <Brain className={`w-7 h-7 sm:w-8 sm:h-8 text-white drop-shadow-md`} />
                    </button>
                    {/* Indicador de Status Nôa */}
                    <div className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full border-2 border-[#0f172a] animate-pulse"></div>
                </div>

                {/* Lado Direito - Original behavior */}
                <div className="flex-1 flex justify-start overflow-hidden">
                    <div
                        className="flex items-center gap-3 overflow-x-auto no-scrollbar px-4 py-2 mask-linear-fade-right"
                        style={{ scrollbarWidth: 'none' }}
                    >
                        {rightOptions.map((option) => (
                            <button
                                key={option.id}
                                onClick={() => onTabChange(option.id)}
                                className={[
                                    'group flex-shrink-0 flex items-center justify-center gap-2 px-3 py-1.5 rounded-xl transition-all duration-300 border whitespace-nowrap',
                                    activeTab === option.id
                                        ? 'bg-emerald-600/20 border-emerald-500/40 text-emerald-100 shadow-lg shadow-emerald-500/10 scale-105'
                                        : 'bg-slate-800/40 border-slate-700/30 text-slate-400 hover:bg-slate-700/60 hover:text-white hover:border-emerald-500/30 hover:scale-105'
                                ].join(' ')}
                            >
                                <option.icon className={`w-4 h-4 transition-colors ${activeTab === option.id ? 'text-emerald-400' : 'text-slate-400 group-hover:text-emerald-400'}`} />
                                <span className="text-xs font-medium hidden sm:inline">{option.label}</span>
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    )
}

export default DashboardFooter
