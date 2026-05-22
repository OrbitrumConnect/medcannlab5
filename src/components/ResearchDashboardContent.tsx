import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import {
    CheckCircle,
    BookOpen,
    GraduationCap,
    Eye,
    Download,
    Share2,
    Plus,
    FlaskConical,
    Link as Link2,
    Bell,
    Users,
    MessageCircle
} from 'lucide-react'

// Tipo para estudos de pesquisa
interface ResearchStudy {
    id: string
    title: string
    description: string
    status: string
    progress: number
    participants: number
    startDate: string
    endDate: string
    color: string
}

const ResearchDashboardContent: React.FC = () => {
    const navigate = useNavigate()
    const [showAllStudies, setShowAllStudies] = useState(false)
    const [researchData, setResearchData] = useState<ResearchStudy[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [courseIds, setCourseIds] = useState<{ aec?: string, cannabis?: string }>({})

    // Carregar estudos do Supabase (tabela courses com categoria 'Pesquisa')
    useEffect(() => {
        const loadStudies = async () => {
            setIsLoading(true)
            try {
                // Buscar IDs dos cursos de AEC e Cannabis para os botões de atalho
                const { data: specialCourses } = await supabase
                    .from('courses')
                    .select('id, title')
                    .or('title.ilike.%Arte da Entrevista%,title.ilike.%Cannabis%')

                if (specialCourses) {
                    const ids: { aec?: string, cannabis?: string } = {}
                    specialCourses.forEach(c => {
                        if (c.title.toLowerCase().includes('entrevista') || c.title.toLowerCase().includes('aec')) {
                            ids.aec = c.id
                        } else if (c.title.toLowerCase().includes('cannabis')) {
                            ids.cannabis = c.id
                        }
                    })
                    setCourseIds(ids)
                }

                // Por enquanto, usar a tabela courses como base para estudos de pesquisa
                // Futuramente pode ser criada uma tabela específica 'research_studies'
                const { data, error } = await supabase
                    .from('courses')
                    .select('id, title, description, category, created_at, updated_at')
                    .eq('category', 'Pesquisa')
                    .order('created_at', { ascending: false })

                if (error) {
                    console.warn('Erro ao carregar estudos:', error)
                    setResearchData([])
                } else if (data && data.length > 0) {
                    // Mapear cursos de pesquisa para formato de estudos
                    const studies: ResearchStudy[] = data.map((course: any, index: number) => ({
                        id: course.id,
                        title: course.title,
                        description: course.description || 'Estudo em andamento',
                        status: index === 0 ? 'Em Andamento' : 'Planejado',
                        progress: Math.floor(Math.random() * 60) + 20, // Temporário até ter campo real
                        participants: Math.floor(Math.random() * 50) + 10, // Temporário
                        startDate: course.created_at?.split('T')[0] || new Date().toISOString().split('T')[0],
                        endDate: course.updated_at?.split('T')[0] || new Date().toISOString().split('T')[0],
                        color: 'from-[#00c16a] to-[#00a85a]'
                    }))
                    setResearchData(studies)
                } else {
                    setResearchData([])
                }
            } catch (err) {
                console.error('Erro ao carregar estudos:', err)
                setResearchData([])
            } finally {
                setIsLoading(false)
            }
        }
        loadStudies()
    }, [])

    // Mostrar apenas estudos ativos inicialmente, ou todos se showAllStudies for true
    const displayedStudies = showAllStudies ? researchData : researchData.filter(study => study.status !== 'Concluído')

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'Em Andamento': return 'text-blue-400'
            case 'Análise': return 'text-yellow-400'
            case 'Concluído': return 'text-green-400'
            case 'Pendente': return 'text-brand-text-muted'
            default: return 'text-brand-text-muted'
        }
    }

    const getProgressColor = (progress: number) => {
        if (progress >= 80) return 'bg-green-500'
        if (progress >= 50) return 'bg-blue-500'
        return 'bg-yellow-500'
    }

    return (
        <div className="max-w-7xl mx-auto w-full overflow-x-hidden p-4 md:p-6">
            {/* Destaque MedCannLab */}
            <div className="rounded-2xl border border-[#00C16A]/20 bg-gradient-to-br from-[#0A192F] via-[#102C45] to-[#1F4B38] p-6 md:p-8 shadow-xl mb-6 md:mb-8">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
                    <div className="flex items-start space-x-4">
                        <div className="w-14 h-14 md:w-16 md:h-16 rounded-xl flex items-center justify-center shadow-lg" style={{
                            background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f3a3a 100%)',
                            boxShadow: '0 6px 16px rgba(0, 0, 0, 0.4)',
                            border: '1px solid rgba(0, 193, 106, 0.2)'
                        }}>
                            <img
                                src="/brain.png"
                                alt="MedCannLab"
                                className="w-10 h-10 object-contain"
                                style={{ filter: 'brightness(1.1) contrast(1.1) drop-shadow(0 0 6px rgba(0, 193, 106, 0.6))' }}
                            />
                        </div>
                        <div>
                            <p className="text-[11px] uppercase tracking-[0.35em] text-[#00C16A] mb-2">MedCannLab</p>
                            <h2 className="text-2xl md:text-3xl font-bold text-brand-text">Integração Cannabis &amp; Nefrologia</h2>
                            <p className="text-sm md:text-base text-[#C8D6E5] mt-3 max-w-3xl">
                                Pesquisa pioneira conectando ensino, clínica e pesquisa para mapear benefícios terapêuticos da cannabis medicinal,
                                avaliando impactos na função renal com apoio da metodologia AEC.
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={() => navigate('/app/pesquisa/profissional/cidade-amiga-dos-rins')}
                        className="self-start lg:self-center bg-gradient-to-r from-[#00C16A] to-[#1a365d] text-brand-text px-6 py-3 rounded-lg font-semibold shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all"
                    >
                        Explorar Projeto
                    </button>
                </div>
                <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {[
                        {
                            title: 'Protocolos de prescrição AEC',
                            description: 'Fluxos clínicos padronizados pela metodologia de anamnese AEC',
                        },
                        {
                            title: 'Monitoramento de função renal',
                            description: 'KPIs nefrológicos integrados ao prontuário avaliados em tempo real',
                        },
                        {
                            title: 'Deep Learning em biomarcadores',
                            description: 'Modelos que correlacionam exames laboratoriais e evolução clínica',
                        },
                        {
                            title: 'Integração com dispositivos médicos',
                            description: 'Wearables e equipamentos enviando dados contínuos para o LabPec',
                        },
                    ].map((item) => (
                        <div key={item.title} className="bg-[#0F243C]/70 border border-[#00C16A]/10 rounded-lg p-4 flex items-start space-x-3">
                            <CheckCircle className="w-4 h-4 text-[#00C16A] mt-1" />
                            <div>
                                <h4 className="text-sm font-semibold text-brand-text mb-1">{item.title}</h4>
                                <p className="text-xs text-[#9FB3C6] leading-relaxed">{item.description}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* V1.9.206 — Programa Territorial de Pesquisa */}
            {/* Substituiu bloco mock anterior (89 casos / 34 profs / 156 dados / 124 pacientes /
                856 alunos / 3 estudos) que era hardcoded e enganoso (validado via PAT 10/05:
                números reais 9-25/10/87/25/0/0). Mesma classe de risco regulatório resolvida em
                V1.9.203 (ACDSS hide). Cursos têm config em /app/ensino/aluno/cursos (sidebar). */}
            <div className="bg-brand-surface rounded-xl p-6 mb-8">
                <h3 className="text-xl font-semibold text-brand-text mb-6 flex items-center space-x-2">
                    <Link2 className="w-6 h-6 text-emerald-400" />
                    <span>Programa Territorial de Pesquisa</span>
                </h3>

                {/* Card destaque: Cidade Amiga dos Rins */}
                <button
                    onClick={() => navigate('/app/pesquisa/profissional/cidade-amiga-dos-rins')}
                    className="w-full text-left rounded-2xl p-6 transition-all hover:scale-[1.005] active:scale-[0.995] border block group"
                    style={{
                        background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.08) 0%, rgba(6, 182, 212, 0.05) 100%)',
                        borderColor: 'rgba(16, 185, 129, 0.30)'
                    }}
                >
                    <div className="flex items-start gap-4">
                        <div className="w-14 h-14 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center flex-shrink-0">
                            <FlaskConical className="w-7 h-7 text-emerald-300" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="text-[11px] font-semibold text-emerald-300 uppercase tracking-[0.2em] mb-2">
                                Programa Territorial · Pesquisa Aplicada
                            </div>
                            <h4 className="text-xl md:text-2xl font-bold text-brand-text mb-2">
                                Cidade Amiga dos Rins
                            </h4>
                            <p className="text-sm text-slate-200/85 leading-relaxed mb-3 max-w-3xl">
                                Observatório longitudinal de saúde renal conectando avaliação clínica
                                inicial (AEC), monitoramento de função renal, prescrições e biomarcadores.
                                Coordenação clínica: Dr. Ricardo Valença (Nefrologia).
                            </p>
                            <div className="flex items-center gap-2 text-sm font-semibold text-emerald-300 group-hover:translate-x-1 transition-transform">
                                <span>Explorar programa</span>
                                <span aria-hidden="true">→</span>
                            </div>
                        </div>
                    </div>
                </button>

                {/* Linha discreta: Catálogo de Cursos (atalho UX, sem mock numbers) */}
                <div className="mt-4 flex items-center justify-between gap-3 px-4 py-3 rounded-lg bg-slate-900/40 border border-slate-700/30">
                    <div className="flex items-center gap-3 min-w-0">
                        <BookOpen className="w-4 h-4 text-brand-text-muted flex-shrink-0" />
                        <span className="text-sm text-brand-text-secondary truncate">
                            Procura formação em AEC ou Cannabis Medicinal? Veja o catálogo de cursos.
                        </span>
                    </div>
                    <button
                        onClick={() => navigate('/app/ensino/aluno/cursos')}
                        className="flex-shrink-0 text-sm text-emerald-300 hover:text-emerald-200 font-semibold whitespace-nowrap transition-colors"
                    >
                        Ver catálogo →
                    </button>
                </div>
            </div>

            {/* Recursos Acadêmicos e Mentoria - Novo Gatilho para o Profissional */}
            <div className="bg-[#0F172A]/40 backdrop-blur-md rounded-xl p-6 mb-8 border border-slate-700/50">
                <h3 className="text-xl font-semibold text-brand-text mb-6 flex items-center space-x-2">
                    <GraduationCap className="w-6 h-6 text-emerald-400" />
                    <span>Recursos Acadêmicos e Mentoria</span>
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <button 
                        onClick={() => navigate('/app/ensino/profissional/dashboard?section=chat-profissionais')}
                        className="bg-[#1E293B]/60 p-4 rounded-xl border border-brand-border hover:border-emerald-500/50 hover:bg-slate-700/50 transition-all text-left group"
                    >
                        <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                            <Users className="w-5 h-5 text-emerald-400" />
                        </div>
                        <h4 className="text-brand-text font-semibold text-sm mb-1">Mentoria LabPEC</h4>
                        <p className="text-xs text-brand-text-muted">Agende supervisões clínicas e sessões de debriefing.</p>
                    </button>

                    <button 
                        onClick={() => navigate('/app/ensino/profissional/dashboard?section=newsletter')}
                        className="bg-[#1E293B]/60 p-4 rounded-xl border border-brand-border hover:border-amber-500/50 hover:bg-slate-700/50 transition-all text-left group"
                    >
                        <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                            <Bell className="w-5 h-5 text-amber-400" />
                        </div>
                        <h4 className="text-brand-text font-semibold text-sm mb-1">Notícias & Eventos</h4>
                        <p className="text-xs text-brand-text-muted">Fique por dentro de seminários e atualizações científicas.</p>
                    </button>

                    <button 
                        onClick={() => navigate('/app/ensino/profissional/dashboard?section=avaliacao')}
                        className="bg-[#1E293B]/60 p-4 rounded-xl border border-brand-border hover:border-blue-500/50 hover:bg-slate-700/50 transition-all text-left group"
                    >
                        <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                            <CheckCircle className="w-5 h-5 text-blue-400" />
                        </div>
                        <h4 className="text-brand-text font-semibold text-sm mb-1">Avaliações Científicas</h4>
                        <p className="text-xs text-brand-text-muted">Acompanhe métricas de desempenho e certificações acadêmicas.</p>
                    </button>
                </div>
            </div>

            {/* Research Studies */}
            <div className="bg-brand-surface rounded-xl p-6">
                <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-semibold text-brand-text">🔬 Meus Estudos</h3>
                    <button
                        onClick={() => setShowAllStudies(!showAllStudies)}
                        className="bg-gradient-to-r from-[#00c16a] to-[#00a85a] text-brand-text px-4 py-2 rounded-lg font-semibold hover:from-pink-600 hover:to-purple-600 transition-colors"
                    >
                        {showAllStudies ? 'Ver Ativos' : `Ver Todos (${researchData.length})`}
                    </button>
                </div>

                <div className="space-y-6">
                    {isLoading ? (
                        <div className="text-center py-12">
                            <div className="animate-spin w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full mx-auto mb-4"></div>
                            <p className="text-brand-text-muted">Carregando estudos...</p>
                        </div>
                    ) : displayedStudies.length === 0 ? (
                        <div className="text-center py-12 bg-slate-700/50 rounded-xl border border-slate-600">
                            <FlaskConical className="w-16 h-16 text-brand-text-muted mx-auto mb-4" />
                            <h4 className="text-lg text-brand-text-secondary mb-2">Nenhum estudo cadastrado</h4>
                            <p className="text-sm text-slate-500 mb-6 max-w-md mx-auto">
                                Comece a criar estudos de pesquisa para acompanhar o progresso dos seus projetos clínicos.
                            </p>
                            <button
                                onClick={() => navigate('/app/pesquisa/profissional/cidade-amiga-dos-rins')}
                                className="bg-gradient-to-r from-[#00c16a] to-[#00a85a] text-brand-text px-6 py-3 rounded-lg font-semibold hover:shadow-lg transition-all inline-flex items-center gap-2"
                            >
                                <Plus className="w-5 h-5" />
                                Explorar Projeto Cidade Amiga dos Rins
                            </button>
                        </div>
                    ) : (
                        displayedStudies.map((study) => (
                            <div key={study.id} className="bg-brand-surface-subtle rounded-lg p-4 md:p-6 hover:bg-slate-650 transition-colors overflow-hidden w-full max-w-full">
                                <div className="flex items-start justify-between mb-4 gap-2 flex-wrap">
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center space-x-3 mb-2 flex-wrap gap-2">
                                            <h4 className="text-lg font-semibold text-brand-text break-words flex-1 min-w-0">{study.title}</h4>
                                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(study.status)}`}>
                                                {study.status}
                                            </span>
                                        </div>
                                        <p className="text-sm text-brand-text-muted mb-3 break-words">{study.description}</p>

                                        <div className="flex items-center flex-wrap gap-x-4 gap-y-2 text-sm text-slate-500 mb-4">
                                            <span className="whitespace-nowrap">Participantes: {study.participants}</span>
                                            <span className="whitespace-nowrap">Início: {study.startDate}</span>
                                            <span className="whitespace-nowrap">Fim: {study.endDate}</span>
                                        </div>
                                    </div>

                                    <div className="flex items-center space-x-2">
                                        {/* V1.9.304 (16/05) — Bug "Pesquisa não abre nada" identificado por
                                            Ricardo no evento 13/05. Eram botões sem onClick handler. Fix:
                                            Ver → navega pro detalhe do projeto Cidade Amiga dos Rins.
                                            Download/Share → disabled com tooltip (features pós-PMF). */}
                                        <button
                                            onClick={() => navigate('/app/pesquisa/profissional/cidade-amiga-dos-rins')}
                                            className="p-2 bg-slate-600 rounded-lg hover:bg-slate-500 transition-colors"
                                            title="Ver detalhes do estudo"
                                        >
                                            <Eye className="w-4 h-4" />
                                        </button>
                                        <button
                                            disabled
                                            className="p-2 bg-brand-surface-subtle rounded-lg opacity-40 cursor-not-allowed"
                                            title="Em breve — Exportação de dados de pesquisa (pós-PMF)"
                                        >
                                            <Download className="w-4 h-4" />
                                        </button>
                                        <button
                                            disabled
                                            className="p-2 bg-brand-surface-subtle rounded-lg opacity-40 cursor-not-allowed"
                                            title="Em breve — Compartilhamento com colaboradores (pós-PMF)"
                                        >
                                            <Share2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>

                                {/* Progress Bar */}
                                <div className="mb-2">
                                    <div className="flex items-center justify-between text-sm mb-1">
                                        <span className="text-brand-text-muted">Progresso</span>
                                        <span className="text-brand-text font-medium">{study.progress}%</span>
                                    </div>
                                    <div className="w-full bg-slate-600 rounded-full h-2">
                                        <div
                                            className={`h-2 rounded-full ${getProgressColor(study.progress)}`}
                                            style={{ width: `${study.progress}%` }}
                                        />
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
                {!showAllStudies && researchData.filter(study => study.status === 'Concluído').length > 0 && (
                    <div className="mt-6 text-center">
                        <p className="text-sm text-brand-text-muted mb-2">
                            {researchData.filter(study => study.status === 'Concluído').length} estudos concluídos não exibidos
                        </p>
                        <button
                            onClick={() => setShowAllStudies(true)}
                            className="text-pink-400 hover:text-pink-300 text-sm font-medium"
                        >
                            Ver estudos concluídos
                        </button>
                    </div>
                )}
            </div>
        </div>
    )
}

export default ResearchDashboardContent
