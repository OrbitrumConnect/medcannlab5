import React, { useCallback, useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import {
    BarChart3,
    Activity,
    MessageCircle,
    BookOpen,
    FlaskConical,
    ClipboardList,
    Users,
    Bell,
    CheckCircle,
    Sparkles,
    Microscope
} from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import EnsinoDashboard from '../pages/EnsinoDashboard'

import ResearchDashboardContent from './ResearchDashboardContent'
import ForumCasosClinicos from '../pages/ForumCasosClinicos'
import Library from '../pages/Library' // Usado para Protocolos
import CidadeAmigaDosRins from '../pages/CidadeAmigaDosRins'
// [V1.9.358] Casos Similares embedado no Terminal de Pesquisa
import AdminCasosSimilares from '../pages/AdminCasosSimilares'
// [V1.9.369-A] Literatura externa (PubMed) — aba paralela à Base de Conhecimento interna
import ExternalLiterature from '../pages/ExternalLiterature'
// [V1.9.379-D] Nôa Matrix — chat pesquisa Z2 não-diretivo com cards anexáveis
import { NoaMatrixView } from './NoaMatrixView'
import { backgroundGradient } from '../constants/designSystem'

// Props do Componente
interface ResearchWorkstationProps {
    initialTab?: string
}

type TabGroup = 'pesquisa' | 'colaboracao'
type TabId = 'dashboard' | 'forum' | 'noa-matrix' | 'library' | 'literature' | 'protocols' | 'casos-similares' | 'mentoria' | 'newsletter' | 'evaluation'

const ResearchWorkstation: React.FC<ResearchWorkstationProps> = ({ initialTab }) => {
    const { user } = useAuth()

    const [activeTab, setActiveTab] = useState<TabId>(() => {
        // V1.9.382 — Trigger Terminal de Atendimento → Nôa Matrix usa query param `section`.
        // initialTab vem do parent (dashboard router). Se vier 'noa-matrix', ativa direto.
        const t = (initialTab as TabId)
        const valid: TabId[] = ['dashboard', 'forum', 'noa-matrix', 'library', 'literature', 'protocols', 'casos-similares', 'mentoria', 'newsletter', 'evaluation']
        return t && valid.includes(t) ? t : 'dashboard'
    })

    // V1.9.438-B — escuta mudanças de `?section=` em runtime (componente já montado).
    // Antes: initialTab só lia no mount, então atalhos de dentro do próprio Dashboard de
    // Pesquisa (ToolCards/QuickLinks que navegavam pra ?section=X) NÃO trocavam de aba.
    // Agora: useSearchParams escuta a URL viva e atualiza activeTab quando muda.
    const [searchParams] = useSearchParams()
    useEffect(() => {
        const t = searchParams.get('section') as TabId | null
        const valid: TabId[] = ['dashboard', 'forum', 'noa-matrix', 'library', 'literature', 'protocols', 'casos-similares', 'mentoria', 'newsletter', 'evaluation']
        if (t && valid.includes(t) && t !== activeTab) {
            setActiveTab(t)
        }
    }, [searchParams, activeTab])

    // [V1.9.369-C] Cross-link Casos Similares → Literatura: parent guarda termo
    // injetado por filho. initialTermKey força re-trigger mesmo se mesmo termo.
    const [pendingLiteratureTerm, setPendingLiteratureTerm] = useState<string | undefined>(undefined)
    const [pendingLiteratureKey, setPendingLiteratureKey] = useState<number>(0)
    const navigateToLiteratureWithTerm = useCallback((term: string) => {
        setPendingLiteratureTerm(term)
        setPendingLiteratureKey(k => k + 1)
        setActiveTab('literature')
    }, [])

    // Abas
    // [V1.9.358] (18/05) Casos Similares adicionada como aba pesquisa (memória clínica institucional)
    // [V1.9.369-A] (18/05) Literatura adicionada como aba pesquisa (PubMed externo, separado dos docs internos da Base de Conhecimento)
    // [V1.9.379-AA] (19/05) Reordenação Pedro+Ricardo:
    //   fluxo cognitivo: ver → comparar → debater → estruturar → estudar → protocolar
    //   Casos Similares → Fórum → Noa Matrix (futuro) → Literatura → Protocolos → ... → Base Conhecimento (final)
    //   Noa Matrix será adicionada em V1.9.379-D (chat pesquisa Z2 não-diretivo)
    const tabs: { id: TabId; label: string; icon: any; color: string; group: TabGroup }[] = [
        { id: 'dashboard', label: 'Dashboard de Pesquisa', icon: BarChart3, color: 'text-emerald-400', group: 'pesquisa' },
        // V1.9.492 (Pedro 29/05) — aba "Casos Similares" (V1.9.354 spike admin Fase 1)
        // ESCONDIDA. Matrix busca embutida (NoaMatrixView "Buscar paciente ou caso")
        // herdou os MESMOS hooks (useCaseSearch + useSearchHistory.recordCaseOpen) e
        // cobre 100% do fluxo. Rota + componente AdminCasosSimilares.tsx + hooks
        // PRESERVADOS (reversão = descomentar 1 linha). Smoke 7-14d sem aba visível
        // → Fase 2 deleta tudo. Princípio "escolher 1 caminho e matar resto" (CLAUDE.md
        // classificação 🟡 SUPORTE) aplicado empíricamente: Pedro confirmou 29/05
        // que ninguém usava a aba; Matrix é o caminho moldado pra Ricardo.
        // { id: 'casos-similares', label: 'Casos Similares', icon: Sparkles, color: 'text-purple-400', group: 'pesquisa' },
        // [V1.9.383] Reorder Pedro 19/05 noite: Nôa Matrix vem ANTES do Fórum.
        // Fluxo cognitivo: ver casos → ESTRUTURAR (Matrix) → DEBATER (Fórum) → estudar (Literatura)
        { id: 'noa-matrix', label: 'Nôa Matrix', icon: Sparkles, color: 'text-purple-400', group: 'pesquisa' },
        { id: 'forum', label: 'Fórum de Casos Clínicos', icon: MessageCircle, color: 'text-cyan-400', group: 'colaboracao' },
        { id: 'literature', label: 'Literatura', icon: Microscope, color: 'text-indigo-400', group: 'pesquisa' },
        { id: 'protocols', label: 'Protocolos', icon: ClipboardList, color: 'text-orange-400', group: 'pesquisa' },
        { id: 'mentoria', label: 'Mentoria', icon: Users, color: 'text-green-400', group: 'colaboracao' },
        { id: 'newsletter', label: 'Notícias & Eventos', icon: Bell, color: 'text-amber-400', group: 'colaboracao' },
        { id: 'evaluation', label: 'Avaliações', icon: CheckCircle, color: 'text-teal-400', group: 'colaboracao' },
        { id: 'library', label: 'Base de Conhecimento', icon: BookOpen, color: 'text-indigo-400', group: 'pesquisa' }
    ]

    const renderContent = () => {
        switch (activeTab) {
            case 'dashboard':
                // V1.9.413 — degradê igual aos demais tabs (era bg-[#0f172a] flat)
                return (
                    <div className="h-full w-full overflow-hidden relative integrated-terminal-content" style={{ background: backgroundGradient }}>
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
            case 'noa-matrix':
                // [V1.9.379-D] Nôa Matrix — chat pesquisa Z2 com cards anexáveis
                // (casos abertos + notas + favoritos via useSearchHistory localStorage)
                // V1.9.413 — degradê igual aos demais tabs (era bg-[#0f172a] flat)
                return (
                    <div className="h-full overflow-y-auto scrollbar-hide p-4" style={{ background: backgroundGradient }}>
                        <NoaMatrixView />
                    </div>
                )
            case 'library':
                return (
                    <div className="h-full overflow-y-auto scrollbar-hide bg-[#0f172a]">
                        <Library />
                    </div>
                )
            case 'literature':
                return (
                    <div className="h-full overflow-y-auto scrollbar-hide bg-[#0f172a] p-4">
                        {/* [V1.9.369-A/C] Literatura externa (PubMed) — aceita termo via cross-link */}
                        <ExternalLiterature
                            embedded
                            initialTerm={pendingLiteratureTerm}
                            initialTermKey={pendingLiteratureKey}
                        />
                    </div>
                )
            case 'protocols':
                return (
                    <div className="h-full overflow-y-auto scrollbar-hide bg-[#0f172a] p-4">
                        <CidadeAmigaDosRins />
                    </div>
                )
            case 'casos-similares':
                // V1.9.413 — degradê igual aos demais tabs (era bg-[#0f172a] flat)
                return (
                    <div className="h-full overflow-y-auto scrollbar-hide p-4" style={{ background: backgroundGradient }}>
                        {/* [V1.9.366] showSidebar=true → Trilha + Notas Rápidas side-by-side */}
                        {/* [V1.9.369-C] onNavigateToLiterature → cross-link racionalidade → Literatura */}
                        <AdminCasosSimilares
                            embedded
                            showSidebar
                            onNavigateToLiterature={navigateToLiteratureWithTerm}
                        />
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
        // V1.9.388-A.6 — Altura responsiva mobile-aware.
        // Antes: h-[calc(100vh-64px)] assumia header desktop fixed 64px, mas em mobile
        // o navegador tem barras dinâmicas (URL + nav) que mudam 100vh → conteúdo era
        // empurrado pra fora da viewport ou cortado em iOS Safari / Chrome Android.
        // Agora: usa 100dvh (dynamic viewport height) em mobile, calc(100vh-64px) em sm+.
        // dvh respeita barras dinâmicas do browser mobile, fix Pedro 19/05 noite.
        <div className="flex flex-col h-[calc(100dvh-56px)] sm:h-[calc(100vh-64px)] bg-[#0f172a] w-full max-w-full overflow-hidden" data-integrated-terminal-research>
            {/* V1.9.388-A.7 — Header mobile-aware espelhando padrão IntegratedWorkstation.
                Bug Pedro 19/05 noite (screenshots WhatsApp): Terminal Atendimento abria
                grid de cards 5×N em mobile (legível), Terminal Pesquisa só mostrava ícone
                FlaskConical e abas invisíveis. Solução: 2 linhas — desktop com nav
                horizontal scroll, mobile com grid grid-cols-5 (10 abas = 2 linhas). */}
            <header className="bg-gradient-to-r from-slate-900 via-slate-800 to-emerald-900 border-b border-[#334155] shrink-0 z-10 shadow-sm relative w-full min-h-[48px] flex flex-col">
                {/* Linha 1: Desktop — título + tabs horizontais (hidden em mobile) */}
                <div className="hidden sm:flex items-center px-3 w-full h-12">
                    <div className="flex items-center gap-3 shrink-0">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-600 to-teal-600 flex items-center justify-center shadow-md">
                            <FlaskConical className="w-4 h-4 text-white" />
                        </div>
                        <div className="leading-tight">
                            <h1 className="text-sm font-bold text-white leading-none">Terminal de Pesquisa</h1>
                            <p className="text-[9px] uppercase tracking-wider text-slate-400 font-semibold mt-0.5">MedCannLab Research</p>
                        </div>
                    </div>

                    <nav className="flex-1 flex items-center justify-center overflow-x-auto no-scrollbar mx-2 h-full">
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
                                        <span className="hidden md:inline">{tab.label}</span>
                                        {isActive && (
                                            <span className={`absolute bottom-0 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full mb-0.5 ${tab.color.replace('text-', 'bg-')}`}></span>
                                        )}
                                    </button>
                                )
                            })}
                        </div>
                    </nav>
                </div>

                {/* Linha 2: Mobile — grid de cards 5 colunas × 2 linhas (sm:hidden) */}
                <div className="sm:hidden w-full px-2 py-2">
                    <div className="grid grid-cols-5 gap-1">
                        {tabs.map((tab) => {
                            const Icon = tab.icon
                            const isActive = activeTab === tab.id
                            return (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`
                                        flex flex-col items-center justify-center gap-0.5 py-1.5 px-1 rounded-lg text-[10px] font-medium transition-all min-h-[44px] touch-manipulation
                                        ${isActive
                                            ? 'bg-[#334155] text-white shadow-inner'
                                            : 'text-slate-400 active:bg-[#334155]/50'}
                                    `}
                                >
                                    <Icon className={`w-4 h-4 ${isActive ? tab.color : 'text-slate-500'}`} />
                                    <span className="leading-tight truncate w-full text-center">{tab.label}</span>
                                </button>
                            )
                        })}
                    </div>
                </div>
            </header>

            <main className="flex-1 overflow-hidden relative bg-[#0f172a] w-full">
                {renderContent()}
            </main>

        </div >
    )
}

export default ResearchWorkstation
