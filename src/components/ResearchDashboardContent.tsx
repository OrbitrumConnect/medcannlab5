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
// Removido Math.random() dos cards de estudo (vetor overclaim ativo desde
// origem). Adicionado bloco "Minhas Métricas" via PAT real (hook
// useResearchMetrics). Substituído bloco "Recursos Acadêmicos & Mentoria"
// (que apontava pro Eixo Ensino) pelas peças reais do Eixo Pesquisa
// (Matrix, Casos Similares, Fórum) com counts empíricos. Adicionado
// footer "Atalhos rápidos". Paleta Brandbook V3 cool (ciano #00E5B2 /
// ciano-cognitivo #4FE0C1 / verde-vital #00C853 / slate #334155).
// Princípios aplicados: feedback_doc_institucional_sem_pat_nao_e_valido_23_05
// + feedback_polir_nao_inventar (reusa Matrix/Casos/Fórum existentes).

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

    // Carrega estudos de courses WHERE category='Pesquisa' — sem inventar
    // progress/participants (V1.9.438 removeu random mock).
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
        <div className="max-w-7xl mx-auto w-full overflow-x-hidden p-4 md:p-6 space-y-6 md:space-y-8">
            {/* ============================================ */}
            {/* BLOCO 1 — Minhas Métricas de Pesquisa (NOVO) */}
            {/* Tudo via PAT real — zero mock                */}
            {/* ============================================ */}
            <section
                className="rounded-2xl border p-5 md:p-6"
                style={{
                    background: 'linear-gradient(135deg, rgba(0,229,178,0.04) 0%, rgba(0,200,83,0.03) 100%)',
                    borderColor: 'rgba(0,229,178,0.20)',
                }}
            >
                <div className="flex items-center justify-between mb-5 flex-wrap gap-2">
                    <div className="flex items-center gap-2.5">
                        <BarChart3 className="w-5 h-5 text-[#00E5B2]" />
                        <h2 className="text-base md:text-lg font-bold text-white tracking-tight">
                            Minhas Métricas de Pesquisa
                        </h2>
                    </div>
                    <span className="text-[10px] uppercase tracking-[0.25em] text-slate-500 font-mono">
                        DADOS EMPÍRICOS · TEMPO REAL
                    </span>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
                    <MetricCard
                        loading={metricsLoading}
                        icon={<Sparkles className="w-4 h-4" />}
                        label="Dossiês salvos"
                        value={metrics.dossies}
                        accent="#00E5B2"
                        hint={`Última atividade: ${formatRelative(metrics.lastMatrixAt)}`}
                    />
                    <MetricCard
                        loading={metricsLoading}
                        icon={<MessageCircle className="w-4 h-4" />}
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
                        icon={<FlaskConical className="w-4 h-4" />}
                        label="Racionalidades"
                        value={metrics.rationalities}
                        accent="#00C853"
                        hint="Aplicadas aos seus relatórios"
                    />
                    <MetricCard
                        loading={metricsLoading}
                        icon={<DollarSign className="w-4 h-4" />}
                        label="Custo IA (amostra)"
                        value={metrics.costRecentUsd > 0 ? `$${metrics.costRecentUsd.toFixed(2)}` : '$0.00'}
                        accent="#94A3B8"
                        hint="Últimas interações instrumentadas"
                    />
                </div>
            </section>

            {/* ============================================ */}
            {/* BLOCO 2 — Header: Integração Cannabis & Nefrologia (mantido) */}
            {/* ============================================ */}
            <section className="rounded-2xl border border-[#00C16A]/20 bg-gradient-to-br from-[#0A192F] via-[#102C45] to-[#1F4B38] p-6 md:p-8 shadow-xl">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
                    <div className="flex items-start gap-4">
                        <div
                            className="w-14 h-14 md:w-16 md:h-16 rounded-xl flex items-center justify-center shadow-lg flex-shrink-0"
                            style={{
                                background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f3a3a 100%)',
                                boxShadow: '0 6px 16px rgba(0,0,0,0.4)',
                                border: '1px solid rgba(0,193,106,0.2)',
                            }}
                        >
                            <img
                                src="/brain.png"
                                alt="MedCannLab"
                                className="w-10 h-10 object-contain"
                                style={{ filter: 'brightness(1.1) contrast(1.1) drop-shadow(0 0 6px rgba(0,193,106,0.6))' }}
                            />
                        </div>
                        <div>
                            <p className="text-[11px] uppercase tracking-[0.35em] text-[#00C16A] mb-2 font-mono">MedCannLab</p>
                            <h2 className="text-2xl md:text-3xl font-bold text-white tracking-tight">
                                Integração Cannabis &amp; Nefrologia
                            </h2>
                            <p className="text-sm md:text-base text-[#C8D6E5] mt-3 max-w-3xl leading-relaxed">
                                Pesquisa pioneira conectando ensino, clínica e pesquisa para mapear benefícios
                                terapêuticos da cannabis medicinal, avaliando impactos na função renal com apoio
                                da metodologia AEC.
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={() => navigate('/app/pesquisa/profissional/cidade-amiga-dos-rins')}
                        className="self-start lg:self-center bg-gradient-to-r from-[#00C16A] to-[#1a365d] text-white px-6 py-3 rounded-lg font-semibold shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all whitespace-nowrap"
                    >
                        Explorar Projeto
                    </button>
                </div>
            </section>

            {/* ============================================ */}
            {/* BLOCO 3 — Peças do Eixo Pesquisa (NOVO)     */}
            {/* Substitui "Recursos Acadêmicos & Mentoria"  */}
            {/* (que apontava pro Ensino, fora de escopo)   */}
            {/* ============================================ */}
            <section className="bg-[#0F172A]/40 backdrop-blur-md rounded-xl p-6 border border-slate-700/50">
                <div className="flex items-center gap-2.5 mb-5">
                    <Microscope className="w-5 h-5 text-[#4FE0C1]" />
                    <h3 className="text-base md:text-lg font-bold text-white tracking-tight">
                        Peças do Eixo Pesquisa
                    </h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <ToolCard
                        accent="#00E5B2"
                        icon={<Sparkles className="w-5 h-5" />}
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
                        icon={<FlaskConical className="w-5 h-5" />}
                        title="Casos Similares"
                        subtitle="Padrões narrativos (ALPHA)"
                        description="Exploração de similaridade textual entre casos clínicos. Operação cognitiva inferencial — não diagnóstica."
                        badge="Exploratório · sob curadoria"
                        onClick={() => navigate('/app/pesquisa/profissional/dashboard?section=casos-similares')}
                    />
                    <ToolCard
                        accent="#00C853"
                        icon={<MessageCircle className="w-5 h-5" />}
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

            {/* ============================================ */}
            {/* BLOCO 4 — Programa Territorial (mantido)    */}
            {/* V1.9.206 já calibrado (sem mock)           */}
            {/* ============================================ */}
            <section className="bg-slate-800/60 rounded-xl p-6">
                <h3 className="text-base md:text-lg font-bold text-white mb-5 flex items-center gap-2.5 tracking-tight">
                    <Link2 className="w-5 h-5 text-[#00E5B2]" />
                    Programa Territorial de Pesquisa
                </h3>

                <button
                    onClick={() => navigate('/app/pesquisa/profissional/cidade-amiga-dos-rins')}
                    className="w-full text-left rounded-2xl p-6 transition-all hover:scale-[1.005] active:scale-[0.995] border block group"
                    style={{
                        background: 'linear-gradient(135deg, rgba(0,229,178,0.08) 0%, rgba(79,224,193,0.05) 100%)',
                        borderColor: 'rgba(0,229,178,0.30)',
                    }}
                >
                    <div className="flex items-start gap-4">
                        <div className="w-14 h-14 rounded-xl bg-[#00E5B2]/15 border border-[#00E5B2]/30 flex items-center justify-center flex-shrink-0">
                            <FlaskConical className="w-7 h-7 text-[#00E5B2]" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="text-[10px] font-semibold text-[#00E5B2] uppercase tracking-[0.25em] mb-2 font-mono">
                                Programa Territorial · Pesquisa Aplicada
                            </div>
                            <h4 className="text-lg md:text-xl font-bold text-white mb-2 tracking-tight">
                                Cidade Amiga dos Rins
                            </h4>
                            <p className="text-sm text-slate-300/85 leading-relaxed mb-3 max-w-3xl">
                                Observatório longitudinal de saúde renal conectando avaliação clínica inicial (AEC),
                                monitoramento de função renal, prescrições e biomarcadores. Coordenação clínica:
                                Dr. Ricardo Valença (Nefrologia).
                            </p>
                            <div className="flex items-center gap-2 text-sm font-semibold text-[#00E5B2] group-hover:translate-x-1 transition-transform">
                                <span>Explorar programa</span>
                                <ArrowRight className="w-4 h-4" />
                            </div>
                        </div>
                    </div>
                </button>

                {/* Atalho catálogo cursos (UX, sem números) */}
                <div className="mt-4 flex items-center justify-between gap-3 px-4 py-3 rounded-lg bg-slate-900/40 border border-slate-700/30">
                    <div className="flex items-center gap-3 min-w-0">
                        <BookOpen className="w-4 h-4 text-slate-400 flex-shrink-0" />
                        <span className="text-sm text-slate-300 truncate">
                            Procura formação em AEC ou Cannabis Medicinal? Veja o catálogo de cursos.
                        </span>
                    </div>
                    <button
                        onClick={() => navigate('/app/ensino/aluno/cursos')}
                        className="flex-shrink-0 text-sm text-[#00E5B2] hover:text-[#4FE0C1] font-semibold whitespace-nowrap transition-colors"
                    >
                        Ver catálogo →
                    </button>
                </div>
            </section>

            {/* ============================================ */}
            {/* BLOCO 5 — Meus Estudos (calibrado SEM mock) */}
            {/* ============================================ */}
            <section className="bg-slate-800/60 rounded-xl p-6">
                <div className="flex items-center justify-between mb-5 flex-wrap gap-2">
                    <h3 className="text-base md:text-lg font-bold text-white tracking-tight flex items-center gap-2.5">
                        <FlaskConical className="w-5 h-5 text-[#00C853]" />
                        Meus Estudos
                    </h3>
                    {studies.length > 0 && (
                        <span className="text-xs text-slate-400 font-mono">{studies.length} programa(s)</span>
                    )}
                </div>

                {studiesLoading ? (
                    <div className="space-y-3">
                        {[1, 2].map((i) => (
                            <div key={i} className="bg-slate-700/40 rounded-lg p-4 animate-pulse h-24" />
                        ))}
                    </div>
                ) : studies.length === 0 ? (
                    <div className="text-center py-10 bg-slate-700/30 rounded-xl border border-slate-700/40">
                        <FlaskConical className="w-12 h-12 text-slate-500 mx-auto mb-3" />
                        <h4 className="text-base text-slate-300 mb-2">Nenhum programa de pesquisa cadastrado</h4>
                        <p className="text-sm text-slate-500 mb-5 max-w-md mx-auto">
                            Explore o programa Cidade Amiga dos Rins ou inicie uma reflexão estruturada na Nôa Matrix.
                        </p>
                        <button
                            onClick={() => navigate('/app/pesquisa/profissional/cidade-amiga-dos-rins')}
                            className="bg-gradient-to-r from-[#00C853] to-[#00A845] text-white px-5 py-2.5 rounded-lg font-semibold text-sm hover:shadow-lg hover:shadow-emerald-500/20 transition-all inline-flex items-center gap-2"
                        >
                            <Eye className="w-4 h-4" />
                            Explorar Cidade Amiga dos Rins
                        </button>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {studies.map((study) => (
                            <div
                                key={study.id}
                                className="bg-slate-700/40 rounded-lg p-4 md:p-5 hover:bg-slate-700/60 transition-colors border border-slate-700/50"
                            >
                                <div className="flex items-start justify-between gap-3 flex-wrap mb-2">
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 flex-wrap mb-1">
                                            <h4 className="text-base font-bold text-white">{study.title}</h4>
                                            <span className="px-2 py-0.5 rounded-full text-[10px] font-mono uppercase tracking-wider text-[#4FE0C1] bg-[#4FE0C1]/10 border border-[#4FE0C1]/30">
                                                {study.status}
                                            </span>
                                        </div>
                                        <p className="text-sm text-slate-400 leading-relaxed">{study.description}</p>
                                    </div>
                                    <button
                                        onClick={() => navigate('/app/pesquisa/profissional/cidade-amiga-dos-rins')}
                                        className="p-2 bg-slate-600/50 rounded-lg hover:bg-slate-600 transition-colors flex-shrink-0"
                                        title="Ver detalhes do estudo"
                                    >
                                        <Eye className="w-4 h-4 text-slate-300" />
                                    </button>
                                </div>

                                {/* Honestidade institucional — sem progresso/participantes inventados */}
                                <div className="mt-3 pt-3 border-t border-slate-700/50 flex items-center gap-2 text-[11px] text-slate-500 font-mono">
                                    <AlertCircle className="w-3 h-3 text-slate-500" />
                                    <span>
                                        Métricas operacionais (participantes, progresso) sob curadoria — disponíveis
                                        após validação clínica do programa.
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </section>

            {/* ============================================ */}
            {/* BLOCO 6 — Atalhos Rápidos (NOVO footer)     */}
            {/* ============================================ */}
            <section className="rounded-xl p-5 border border-slate-700/40 bg-slate-900/30">
                <div className="flex items-center gap-2 mb-4">
                    <Clock className="w-4 h-4 text-slate-400" />
                    <span className="text-[10px] uppercase tracking-[0.25em] text-slate-500 font-mono">
                        Atalhos rápidos
                    </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
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

// ============================================
// Subcomponentes (mesmo arquivo, escopo local)
// ============================================

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
        className="rounded-xl p-4 border bg-slate-900/40 backdrop-blur-sm transition-all hover:scale-[1.015]"
        style={{ borderColor: `${accent}30` }}
    >
        <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] uppercase tracking-[0.2em] text-slate-400 font-mono">{label}</span>
            <span style={{ color: accent }}>{icon}</span>
        </div>
        {loading ? (
            <div className="h-7 bg-slate-700/40 rounded animate-pulse w-12" />
        ) : (
            <div
                className="text-2xl md:text-3xl font-black font-mono tracking-tight"
                style={{ color: accent, textShadow: `0 0 20px ${accent}40` }}
            >
                {value}
            </div>
        )}
        <p className="text-[10px] text-slate-500 mt-1.5 leading-tight truncate" title={hint}>
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
        className="text-left rounded-xl p-5 border-2 bg-slate-900/40 hover:bg-slate-900/70 transition-all group relative overflow-hidden"
        style={{ borderColor: `${accent}30` }}
        onMouseEnter={(e) => { e.currentTarget.style.borderColor = `${accent}60` }}
        onMouseLeave={(e) => { e.currentTarget.style.borderColor = `${accent}30` }}
    >
        <div className="flex items-start justify-between mb-3">
            <div
                className="w-10 h-10 rounded-lg flex items-center justify-center"
                style={{ background: `${accent}15`, color: accent, border: `1px solid ${accent}40` }}
            >
                {icon}
            </div>
            <ArrowRight
                className="w-4 h-4 text-slate-500 group-hover:translate-x-1 transition-all"
                style={{ color: accent }}
            />
        </div>
        <h4 className="text-base font-bold text-white mb-0.5 tracking-tight">{title}</h4>
        <p className="text-[11px] font-mono uppercase tracking-wider mb-3" style={{ color: accent }}>
            {subtitle}
        </p>
        <p className="text-xs text-slate-400 leading-relaxed mb-4">{description}</p>
        <div
            className="text-[10px] font-mono uppercase tracking-wider px-2.5 py-1 rounded inline-block"
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
        className="flex items-center justify-between gap-3 px-4 py-3 rounded-lg bg-slate-800/50 border border-slate-700/40 hover:bg-slate-800 transition-all group"
        onMouseEnter={(e) => { e.currentTarget.style.borderColor = `${accent}60` }}
        onMouseLeave={(e) => { e.currentTarget.style.borderColor = '' }}
    >
        <span className="text-sm font-semibold text-slate-200">{label}</span>
        <ArrowRight
            className="w-4 h-4 group-hover:translate-x-1 transition-all"
            style={{ color: accent }}
        />
    </button>
)

export default ResearchDashboardContent
