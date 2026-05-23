import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import {
    BookOpen,
    Eye,
    FlaskConical,
    Link as Link2,
    Microscope,
    MessageCircle,
    Sparkles,
    BarChart3,
    DollarSign,
    Clock,
    ArrowRight,
    AlertCircle,
} from 'lucide-react'
import { useResearchMetrics } from '../hooks/useResearchMetrics'

// V1.9.438 — Dashboard de Pesquisa elite triple-A escalável.
// V1.9.438-A (pass de compactação) — densidade visual reduzida ~30%
// mantendo paleta Brandbook V3 cool integral. Sem regressão de conteúdo.

interface ResearchStudy {
    id: string
    title: string
    description: string
    status: 'Em curadoria' | 'Em Andamento' | 'Planejado' | 'Concluído'
    startDate: string
    endDate: string
}

const ResearchDashboardContent: React.FC = () => {
    const navigate = useNavigate()
    const [studies, setStudies] = useState<ResearchStudy[]>([])
    const [studiesLoading, setStudiesLoading] = useState(true)
    const { metrics, loading: metricsLoading } = useResearchMetrics()

    useEffect(() => {
        const loadStudies = async () => {
            setStudiesLoading(true)
            try {
                const { data, error } = await supabase
                    .from('courses')
                    .select('id, title, description, category, created_at, updated_at')
                    .eq('category', 'Pesquisa')
                    .order('created_at', { ascending: false })
                if (error) {
                    console.warn('[ResearchDashboard] estudos:', error)
                    setStudies([])
                    return
                }
                setStudies((data || []).map((c: any) => ({
                    id: c.id,
                    title: c.title,
                    description: c.description || 'Programa de pesquisa em curadoria.',
                    status: 'Em curadoria',
                    startDate: c.created_at?.split('T')[0] || '—',
                    endDate: c.updated_at?.split('T')[0] || '—',
                })))
            } catch (err) {
                console.warn('[ResearchDashboard] estudos exception:', err)
                setStudies([])
            } finally {
                setStudiesLoading(false)
            }
        }
        void loadStudies()
    }, [])

    const formatRelative = (iso: string | null): string => {
        if (!iso) return '—'
        try {
            const d = new Date(iso)
            const diffMs = Date.now() - d.getTime()
            const days = Math.floor(diffMs / (1000 * 60 * 60 * 24))
            if (days === 0) return 'hoje'
            if (days === 1) return 'ontem'
            if (days < 7) return `${days} dias atrás`
            if (days < 30) return `${Math.floor(days / 7)} sem atrás`
            return `${Math.floor(days / 30)} mês(es) atrás`
        } catch { return '—' }
    }

    return (
        <div className="max-w-7xl mx-auto w-full overflow-x-hidden p-3 md:p-4 space-y-3 md:space-y-4">
            {/* BLOCO 1 — Minhas Métricas de Pesquisa */}
            <section
                className="rounded-xl border p-3 md:p-4"
                style={{
                    background: 'linear-gradient(135deg, rgba(0,229,178,0.04) 0%, rgba(0,200,83,0.03) 100%)',
                    borderColor: 'rgba(0,229,178,0.20)',
                }}
            >
                <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
                    <div className="flex items-center gap-2">
                        <BarChart3 className="w-4 h-4 text-[#00E5B2]" />
                        <h2 className="text-sm md:text-base font-bold text-white tracking-tight">
                            Minhas Métricas de Pesquisa
                        </h2>
                    </div>
                    <span className="text-[9px] uppercase tracking-[0.25em] text-slate-500 font-mono">
                        DADOS EMPÍRICOS · TEMPO REAL
                    </span>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5">
                    <MetricCard
                        loading={metricsLoading}
                        icon={<Sparkles className="w-3.5 h-3.5" />}
                        label="Dossiês salvos"
                        value={metrics.dossies}
                        accent="#00E5B2"
                        hint={`Última atividade: ${formatRelative(metrics.lastMatrixAt)}`}
                    />
                    <MetricCard
                        loading={metricsLoading}
                        icon={<MessageCircle className="w-3.5 h-3.5" />}
                        label="Posts no Fórum"
                        value={metrics.forum.total}
                        accent="#4FE0C1"
                        hint={
                            metrics.forum.total > 0
                                ? `${metrics.forum.pending} em análise · ${metrics.forum.active} ativos`
                                : 'Nenhum publicado ainda'
                        }
                    />
                    <MetricCard
                        loading={metricsLoading}
                        icon={<FlaskConical className="w-3.5 h-3.5" />}
                        label="Racionalidades"
                        value={metrics.rationalities}
                        accent="#00C853"
                        hint="Aplicadas aos seus relatórios"
                    />
                    <MetricCard
                        loading={metricsLoading}
                        icon={<DollarSign className="w-3.5 h-3.5" />}
                        label="Custo IA (amostra)"
                        value={metrics.costRecentUsd > 0 ? `$${metrics.costRecentUsd.toFixed(2)}` : '$0.00'}
                        accent="#94A3B8"
                        hint="Últimas interações instrumentadas"
                    />
                </div>
            </section>

            {/* BLOCO 2 — Header Integração Cannabis & Nefrologia */}
            <section className="rounded-xl border border-[#00C16A]/20 bg-gradient-to-br from-[#0A192F] via-[#102C45] to-[#1F4B38] p-4 md:p-5 shadow-lg">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                    <div className="flex items-start gap-3">
                        <div
                            className="w-10 h-10 md:w-12 md:h-12 rounded-lg flex items-center justify-center shadow-lg flex-shrink-0"
                            style={{
                                background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f3a3a 100%)',
                                boxShadow: '0 4px 12px rgba(0,0,0,0.4)',
                                border: '1px solid rgba(0,193,106,0.2)',
                            }}
                        >
                            <img
                                src="/brain.png"
                                alt="MedCannLab"
                                className="w-7 h-7 md:w-8 md:h-8 object-contain"
                                style={{ filter: 'brightness(1.1) contrast(1.1) drop-shadow(0 0 6px rgba(0,193,106,0.6))' }}
                            />
                        </div>
                        <div>
                            <p className="text-[10px] uppercase tracking-[0.3em] text-[#00C16A] mb-1 font-mono">MedCannLab</p>
                            <h2 className="text-lg md:text-xl font-bold text-white tracking-tight">
                                Integração Cannabis &amp; Nefrologia
                            </h2>
                            <p className="text-xs md:text-sm text-[#C8D6E5] mt-1.5 max-w-3xl leading-relaxed">
                                Pesquisa pioneira conectando ensino, clínica e pesquisa para mapear benefícios
                                terapêuticos da cannabis medicinal, avaliando impactos na função renal com apoio
                                da metodologia AEC.
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={() => navigate('/app/pesquisa/profissional/cidade-amiga-dos-rins')}
                        className="self-start lg:self-center bg-gradient-to-r from-[#00C16A] to-[#1a365d] text-white px-4 py-2 rounded-md text-sm font-semibold shadow hover:shadow-lg hover:scale-[1.02] transition-all whitespace-nowrap"
                    >
                        Explorar Projeto
                    </button>
                </div>
            </section>

            {/* BLOCO 3 — Peças do Eixo Pesquisa */}
            <section className="bg-[#0F172A]/40 backdrop-blur-md rounded-xl p-4 border border-slate-700/50">
                <div className="flex items-center gap-2 mb-3">
                    <Microscope className="w-4 h-4 text-[#4FE0C1]" />
                    <h3 className="text-sm md:text-base font-bold text-white tracking-tight">
                        Peças do Eixo Pesquisa
                    </h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <ToolCard
                        accent="#00E5B2"
                        icon={<Sparkles className="w-4 h-4" />}
                        title="Nôa Matrix"
                        subtitle="Chat Z2 não-diretivo"
                        description="Estruture reflexão clínica longitudinal sobre seus pacientes. Anexe PubMed + Base de Conhecimento."
                        badge={
                            metrics.dossies > 0
                                ? `${metrics.dossies} dossiê(s) salvo(s)`
                                : 'Comece sua 1ª sessão'
                        }
                        onClick={() => navigate('/app/pesquisa/profissional/dashboard?section=noa-matrix')}
                    />
                    <ToolCard
                        accent="#4FE0C1"
                        icon={<FlaskConical className="w-4 h-4" />}
                        title="Casos Similares"
                        subtitle="Padrões narrativos (ALPHA)"
                        description="Exploração de similaridade textual entre casos clínicos. Operação cognitiva inferencial — não diagnóstica."
                        badge="Exploratório · sob curadoria"
                        onClick={() => navigate('/app/pesquisa/profissional/dashboard?section=casos-similares')}
                    />
                    <ToolCard
                        accent="#00C853"
                        icon={<MessageCircle className="w-4 h-4" />}
                        title="Fórum de Casos Clínicos"
                        subtitle="Debate institucional curado"
                        description="Publique dossiês para análise do conselho editorial. Casos aprovados viram debate em sala própria."
                        badge={
                            metrics.forum.pending > 0
                                ? `${metrics.forum.pending} em análise · ${metrics.forum.active} ativos`
                                : metrics.forum.total > 0
                                    ? `${metrics.forum.total} publicações totais`
                                    : 'Publique seu 1º caso'
                        }
                        onClick={() => navigate('/app/pesquisa/profissional/dashboard?section=forum')}
                    />
                </div>
            </section>

            {/* BLOCO 4 — Programa Territorial */}
            <section className="bg-slate-800/60 rounded-xl p-4">
                <h3 className="text-sm md:text-base font-bold text-white mb-3 flex items-center gap-2 tracking-tight">
                    <Link2 className="w-4 h-4 text-[#00E5B2]" />
                    Programa Territorial de Pesquisa
                </h3>

                <button
                    onClick={() => navigate('/app/pesquisa/profissional/cidade-amiga-dos-rins')}
                    className="w-full text-left rounded-xl p-4 transition-all hover:scale-[1.005] active:scale-[0.995] border block group"
                    style={{
                        background: 'linear-gradient(135deg, rgba(0,229,178,0.08) 0%, rgba(79,224,193,0.05) 100%)',
                        borderColor: 'rgba(0,229,178,0.30)',
                    }}
                >
                    <div className="flex items-start gap-3">
                        <div className="w-11 h-11 rounded-lg bg-[#00E5B2]/15 border border-[#00E5B2]/30 flex items-center justify-center flex-shrink-0">
                            <FlaskConical className="w-5 h-5 text-[#00E5B2]" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="text-[9px] font-semibold text-[#00E5B2] uppercase tracking-[0.25em] mb-1 font-mono">
                                Programa Territorial · Pesquisa Aplicada
                            </div>
                            <h4 className="text-base md:text-lg font-bold text-white mb-1 tracking-tight">
                                Cidade Amiga dos Rins
                            </h4>
                            <p className="text-xs md:text-sm text-slate-300/85 leading-relaxed mb-2 max-w-3xl">
                                Observatório longitudinal de saúde renal conectando avaliação clínica inicial (AEC),
                                monitoramento de função renal, prescrições e biomarcadores. Coordenação clínica:
                                Dr. Ricardo Valença (Nefrologia).
                            </p>
                            <div className="flex items-center gap-1.5 text-xs font-semibold text-[#00E5B2] group-hover:translate-x-1 transition-transform">
                                <span>Explorar programa</span>
                                <ArrowRight className="w-3.5 h-3.5" />
                            </div>
                        </div>
                    </div>
                </button>

                <div className="mt-3 flex items-center justify-between gap-3 px-3 py-2 rounded-lg bg-slate-900/40 border border-slate-700/30">
                    <div className="flex items-center gap-2 min-w-0">
                        <BookOpen className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                        <span className="text-xs text-slate-300 truncate">
                            Procura formação em AEC ou Cannabis Medicinal? Veja o catálogo de cursos.
                        </span>
                    </div>
                    <button
                        onClick={() => navigate('/app/ensino/aluno/cursos')}
                        className="flex-shrink-0 text-xs text-[#00E5B2] hover:text-[#4FE0C1] font-semibold whitespace-nowrap transition-colors"
                    >
                        Ver catálogo →
                    </button>
                </div>
            </section>

            {/* BLOCO 5 — Meus Estudos */}
            <section className="bg-slate-800/60 rounded-xl p-4">
                <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
                    <h3 className="text-sm md:text-base font-bold text-white tracking-tight flex items-center gap-2">
                        <FlaskConical className="w-4 h-4 text-[#00C853]" />
                        Meus Estudos
                    </h3>
                    {studies.length > 0 && (
                        <span className="text-[11px] text-slate-400 font-mono">{studies.length} programa(s)</span>
                    )}
                </div>

                {studiesLoading ? (
                    <div className="space-y-2">
                        {[1, 2].map((i) => (
                            <div key={i} className="bg-slate-700/40 rounded-lg p-3 animate-pulse h-16" />
                        ))}
                    </div>
                ) : studies.length === 0 ? (
                    <div className="text-center py-7 bg-slate-700/30 rounded-lg border border-slate-700/40">
                        <FlaskConical className="w-10 h-10 text-slate-500 mx-auto mb-2" />
                        <h4 className="text-sm text-slate-300 mb-1">Nenhum programa de pesquisa cadastrado</h4>
                        <p className="text-xs text-slate-500 mb-4 max-w-md mx-auto">
                            Explore o programa Cidade Amiga dos Rins ou inicie uma reflexão estruturada na Nôa Matrix.
                        </p>
                        <button
                            onClick={() => navigate('/app/pesquisa/profissional/cidade-amiga-dos-rins')}
                            className="bg-gradient-to-r from-[#00C853] to-[#00A845] text-white px-4 py-2 rounded-md font-semibold text-xs hover:shadow-lg hover:shadow-emerald-500/20 transition-all inline-flex items-center gap-1.5"
                        >
                            <Eye className="w-3.5 h-3.5" />
                            Explorar Cidade Amiga dos Rins
                        </button>
                    </div>
                ) : (
                    <div className="space-y-2">
                        {studies.map((study) => (
                            <div
                                key={study.id}
                                className="bg-slate-700/40 rounded-lg p-3 hover:bg-slate-700/60 transition-colors border border-slate-700/50"
                            >
                                <div className="flex items-start justify-between gap-3 flex-wrap mb-1.5">
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 flex-wrap mb-0.5">
                                            <h4 className="text-sm font-bold text-white">{study.title}</h4>
                                            <span className="px-1.5 py-0.5 rounded text-[9px] font-mono uppercase tracking-wider text-[#4FE0C1] bg-[#4FE0C1]/10 border border-[#4FE0C1]/30">
                                                {study.status}
                                            </span>
                                        </div>
                                        <p className="text-xs text-slate-400 leading-relaxed">{study.description}</p>
                                    </div>
                                    <button
                                        onClick={() => navigate('/app/pesquisa/profissional/cidade-amiga-dos-rins')}
                                        className="p-1.5 bg-slate-600/50 rounded-md hover:bg-slate-600 transition-colors flex-shrink-0"
                                        title="Ver detalhes do estudo"
                                    >
                                        <Eye className="w-3.5 h-3.5 text-slate-300" />
                                    </button>
                                </div>

                                <div className="mt-2 pt-2 border-t border-slate-700/50 flex items-center gap-1.5 text-[10px] text-slate-500 font-mono">
                                    <AlertCircle className="w-3 h-3 text-slate-500" />
                                    <span>
                                        Métricas operacionais sob curadoria — disponíveis após validação clínica do programa.
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </section>

            {/* BLOCO 6 — Atalhos Rápidos */}
            <section className="rounded-xl p-3 border border-slate-700/40 bg-slate-900/30">
                <div className="flex items-center gap-1.5 mb-2.5">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    <span className="text-[9px] uppercase tracking-[0.25em] text-slate-500 font-mono">
                        Atalhos rápidos
                    </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <QuickLink
                        accent="#00E5B2"
                        label="Abrir Nôa Matrix"
                        onClick={() => navigate('/app/pesquisa/profissional/dashboard?section=noa-matrix')}
                    />
                    <QuickLink
                        accent="#4FE0C1"
                        label="Ver Casos Similares"
                        onClick={() => navigate('/app/pesquisa/profissional/dashboard?section=casos-similares')}
                    />
                    <QuickLink
                        accent="#00C853"
                        label="Ir pro Fórum"
                        onClick={() => navigate('/app/pesquisa/profissional/dashboard?section=forum')}
                    />
                </div>
            </section>
        </div>
    )
}

// Subcomponentes
interface MetricCardProps {
    loading: boolean
    icon: React.ReactNode
    label: string
    value: number | string
    accent: string
    hint: string
}
const MetricCard: React.FC<MetricCardProps> = ({ loading, icon, label, value, accent, hint }) => (
    <div
        className="rounded-lg p-2.5 border bg-slate-900/40 backdrop-blur-sm transition-all hover:scale-[1.015]"
        style={{ borderColor: `${accent}30` }}
    >
        <div className="flex items-center justify-between mb-1.5">
            <span className="text-[9px] uppercase tracking-[0.2em] text-slate-400 font-mono leading-tight">{label}</span>
            <span style={{ color: accent }}>{icon}</span>
        </div>
        {loading ? (
            <div className="h-6 bg-slate-700/40 rounded animate-pulse w-10" />
        ) : (
            <div
                className="text-xl md:text-2xl font-black font-mono tracking-tight leading-none"
                style={{ color: accent, textShadow: `0 0 18px ${accent}40` }}
            >
                {value}
            </div>
        )}
        <p className="text-[9px] text-slate-500 mt-1 leading-tight truncate" title={hint}>
            {hint}
        </p>
    </div>
)

interface ToolCardProps {
    accent: string
    icon: React.ReactNode
    title: string
    subtitle: string
    description: string
    badge: string
    onClick: () => void
}
const ToolCard: React.FC<ToolCardProps> = ({ accent, icon, title, subtitle, description, badge, onClick }) => (
    <button
        onClick={onClick}
        className="text-left rounded-lg p-3.5 border bg-slate-900/40 hover:bg-slate-900/70 transition-all group relative overflow-hidden"
        style={{ borderColor: `${accent}30` }}
        onMouseEnter={(e) => { e.currentTarget.style.borderColor = `${accent}60` }}
        onMouseLeave={(e) => { e.currentTarget.style.borderColor = `${accent}30` }}
    >
        <div className="flex items-start justify-between mb-2">
            <div
                className="w-8 h-8 rounded-md flex items-center justify-center"
                style={{ background: `${accent}15`, color: accent, border: `1px solid ${accent}40` }}
            >
                {icon}
            </div>
            <ArrowRight
                className="w-3.5 h-3.5 group-hover:translate-x-1 transition-all"
                style={{ color: accent }}
            />
        </div>
        <h4 className="text-sm font-bold text-white mb-0.5 tracking-tight">{title}</h4>
        <p className="text-[10px] font-mono uppercase tracking-wider mb-2" style={{ color: accent }}>
            {subtitle}
        </p>
        <p className="text-[11px] text-slate-400 leading-relaxed mb-2.5">{description}</p>
        <div
            className="text-[9px] font-mono uppercase tracking-wider px-2 py-0.5 rounded inline-block"
            style={{ background: `${accent}10`, color: accent, border: `1px solid ${accent}25` }}
        >
            {badge}
        </div>
    </button>
)

interface QuickLinkProps {
    accent: string
    label: string
    onClick: () => void
}
const QuickLink: React.FC<QuickLinkProps> = ({ accent, label, onClick }) => (
    <button
        onClick={onClick}
        className="flex items-center justify-between gap-2 px-3 py-2 rounded-md bg-slate-800/50 border border-slate-700/40 hover:bg-slate-800 transition-all group"
        onMouseEnter={(e) => { e.currentTarget.style.borderColor = `${accent}60` }}
        onMouseLeave={(e) => { e.currentTarget.style.borderColor = '' }}
    >
        <span className="text-xs font-semibold text-slate-200">{label}</span>
        <ArrowRight
            className="w-3.5 h-3.5 group-hover:translate-x-1 transition-all"
            style={{ color: accent }}
        />
    </button>
)

export default ResearchDashboardContent
