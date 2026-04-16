import React, { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
    TrendingUp,
    Activity,
    Heart,
    Droplets,
    Award,
    Calendar,
    ArrowUp,
    ArrowDown,
    Minus,
    Brain,
    Zap,
    ChevronRight,
    AlertCircle,
    FileText,
    Clock,
    X,
    Copy,
    Check,
    FlaskConical,
    Printer,
    Send,
    ChevronDown,
    Info
} from 'lucide-react'
import { ClinicalReport } from '../lib/clinicalReportService'
import { cardStyle, surfaceStyle, accentGradient, secondarySurfaceStyle } from '../constants/designSystem'
import { supabase } from '../lib/supabase'
import { enrichReportWithScores } from '../lib/clinicalScoreCalculator'
import { stripPlatformInjectionNoise } from '../lib/clinicalAssessmentFlow'

function stripReportText(s: unknown): string {
    return stripPlatformInjectionNoise(String(s ?? ''))
}

/** Campos legados (mainComplaint, history) + estrutura AEC em PT (queixa_principal, lista_indiciaria, …). */
function getAecReportModalPayload(content: Record<string, any> | null | undefined): {
    mainComplaint: string
    historyText: string
    investigationItems: string[]
} {
    if (!content || typeof content !== 'object') {
        return { mainComplaint: '', historyText: '', investigationItems: [] }
    }

    const qp = stripReportText(
        content.queixa_principal ||
            content.chief_complaint ||
            content.mainComplaint ||
            content.chiefComplaint ||
            ''
    )
    const listaRaw = content.lista_indiciaria || []
    const listaLabels: string[] = Array.isArray(listaRaw)
        ? listaRaw
              .map((item: any) => {
                  const raw =
                      item && typeof item === 'object' && item.label != null ? item.label : item
                  return stripReportText(raw)
              })
              .filter(Boolean)
        : []

    const dev = content.desenvolvimento_queixa || {}
    const hpp = Array.isArray(content.historia_patologica_pregressa)
        ? content.historia_patologica_pregressa
        : []
    const fam = content.historia_familiar || {}
    const mat = Array.isArray(fam.lado_materno) ? fam.lado_materno : []
    const pat = Array.isArray(fam.lado_paterno) ? fam.lado_paterno : []
    const habitos = Array.isArray(content.habitos_vida) ? content.habitos_vida : []

    const historyParts: string[] = []
    const legacyHist = stripReportText(content.history)
    if (legacyHist) historyParts.push(legacyHist)
    if (dev.descricao) historyParts.push(`Descrição da queixa: ${stripReportText(dev.descricao)}`)
    if (dev.localizacao) historyParts.push(`Localização: ${stripReportText(dev.localizacao)}`)
    if (dev.inicio) historyParts.push(`Início: ${stripReportText(dev.inicio)}`)
    const sint = Array.isArray(dev.sintomas_associados)
        ? dev.sintomas_associados.map((x: any) => stripReportText(x)).filter(Boolean)
        : []
    if (sint.length) historyParts.push(`Sintomas associados: ${sint.join(', ')}`)
    const melhora = Array.isArray(dev.fatores_melhora)
        ? dev.fatores_melhora.map((x: any) => stripReportText(x)).filter(Boolean)
        : []
    const piora = Array.isArray(dev.fatores_piora)
        ? dev.fatores_piora.map((x: any) => stripReportText(x)).filter(Boolean)
        : []
    if (melhora.length) historyParts.push(`Fatores de melhora: ${melhora.join(', ')}`)
    if (piora.length) historyParts.push(`Fatores de piora: ${piora.join(', ')}`)
    const hppS = hpp.map((x: any) => stripReportText(x)).filter(Boolean)
    if (hppS.length) historyParts.push(`História patológica pregressa: ${hppS.join('; ')}`)
    const matS = mat.map((x: any) => stripReportText(x)).filter(Boolean)
    const patS = pat.map((x: any) => stripReportText(x)).filter(Boolean)
    if (matS.length) historyParts.push(`História familiar (materno): ${matS.join('; ')}`)
    if (patS.length) historyParts.push(`História familiar (paterno): ${patS.join('; ')}`)
    const habS = habitos.map((x: any) => stripReportText(x)).filter(Boolean)
    if (habS.length) historyParts.push(`Hábitos de vida: ${habS.join('; ')}`)

    const investigationItems: string[] = []
    if (listaLabels.length) {
        investigationItems.push(
            `Lista indiciária (${listaLabels.length}): ${listaLabels.join(' • ')}`
        )
    }
    const po = content.perguntas_objetivas
    if (po && typeof po === 'object') {
        Object.entries(po).forEach(([k, v]) => {
            if (v != null && String(v).trim()) {
                investigationItems.push(
                    `${k.replace(/_/g, ' ')}: ${stripReportText(v)}`
                )
            }
        })
    }
    const consenso = content.consenso
    if (consenso && typeof consenso === 'object') {
        investigationItems.push(
            `Consenso: ${consenso.aceito ? 'aceito pelo paciente' : 'pendente'}${
                typeof consenso.revisoes_realizadas === 'number'
                    ? ` • ${consenso.revisoes_realizadas} revisão(ões)`
                    : ''
            }`
        )
    }
    const legacyRec = Array.isArray(content.recommendations) ? content.recommendations : []
    legacyRec.forEach((r: any) => {
        const t = stripReportText(r)
        if (t) investigationItems.push(t)
    })
    ;['investigation', 'methodology', 'result'].forEach((key) => {
        const t = stripReportText(content[key])
        if (t) investigationItems.push(`${key}: ${t}`)
    })

    const mainComplaint =
        qp ||
        (listaLabels.length ? listaLabels.slice(0, 3).join(', ') : '') ||
        stripReportText(content.identificacao?.apresentacao || '').slice(0, 200)

    return {
        mainComplaint,
        historyText: historyParts.join('\n\n'),
        investigationItems
    }
}

interface Doctor {
    id: string
    name: string
    email: string
    specialty?: string
    crm?: string
    avatar_url?: string
}

interface PatientAnalyticsProps {
    reports: ClinicalReport[]
    loading?: boolean
    user?: any
    appointments?: Array<{
        id: string
        date: string
        time: string
        professional: string
        type: string
        status: string
    }>
    patientPrescriptions?: Array<{
        id: string
        title: string
        status: string
        issuedAt?: string
        startsAt?: string | null
        endsAt?: string | null
        professionalName?: string | null
    }>
    patientPrescriptionsLoading?: boolean
    /** Quando true, oculta WhatsApp, Enviar para Médico e CTAs de consulta/prescrição (visão do profissional no terminal) */
    isProfessionalView?: boolean
    /** Quando true, reduz tamanho e espaçamento (~20%) para caber no Terminal Clínico */
    compact?: boolean
    /** Callback para botão de agendamento (Glow Effect) */
    onScheduleClick?: () => void
    /** Callback para ver agenda completa */
    onViewSchedule?: () => void
}

const PatientAnalytics: React.FC<PatientAnalyticsProps> = ({ reports, loading, user, appointments = [], patientPrescriptions = [], patientPrescriptionsLoading = false, isProfessionalView = false, compact = false, onScheduleClick, onViewSchedule }) => {
    const navigate = useNavigate()
    const [selectedReport, setSelectedReport] = useState<ClinicalReport | null>(null)
    const [copied, setCopied] = useState(false)
    const [showDoctorSelect, setShowDoctorSelect] = useState(false)
    const [doctors, setDoctors] = useState<Doctor[]>([])
    const [selectedDoctors, setSelectedDoctors] = useState<string[]>([])
    const [sendingShare, setSendingShare] = useState(false)
    const [historyPage, setHistoryPage] = useState(1)
    const [examRequests, setExamRequests] = useState<Array<{ id: string; content: string; status: string; created_at: string }>>([])
    const [examRequestsLoading, setExamRequestsLoading] = useState(false)
    const [examPage, setExamPage] = useState(1)
    const [expandedExamId, setExpandedExamId] = useState<string | null>(null)

    // Carregar médicos disponíveis
    React.useEffect(() => {
        const fetchDoctors = async () => {
            try {
                const { data, error } = await supabase
                    .from('users_compatible')
                    .select('id, name, email, type')
                    .filter('type', 'in', '("profissional","professional","admin")')
                    .order('name')

                if (error) {
                    console.error('Erro ao buscar médicos:', error)
                    return
                }

                if (data) {
                    const mappedDoctors = data.map((d: any) => ({
                        id: d.id,
                        name: d.name,
                        email: d.email,
                        specialty: 'Especialista',
                        type: d.type
                    }))
                    setDoctors(mappedDoctors)
                }
            } catch (err) {
                console.error('Erro ao buscar médicos:', err)
            }
        }

        fetchDoctors()
    }, [])

    // Carregar solicitações de exames do paciente
    React.useEffect(() => {
        if (!user?.id) return
        const fetchExamRequests = async () => {
            setExamRequestsLoading(true)
            try {
                const { data, error } = await supabase
                    .from('patient_exam_requests')
                    .select('id, content, status, created_at')
                    .eq('patient_id', user.id)
                    .order('created_at', { ascending: false })
                    .limit(20)
                if (error) throw error
                setExamRequests((data || []).map(d => ({ ...d, status: d.status ?? 'draft', created_at: d.created_at ?? new Date().toISOString() })))
            } catch (err) {
                console.error('Erro ao buscar solicitações de exames:', err)
            } finally {
                setExamRequestsLoading(false)
            }
        }
        fetchExamRequests()
    }, [user?.id])

    const handleCopyReport = (content: any) => {
        const { mainComplaint, historyText, investigationItems } = getAecReportModalPayload(content)
        const invBlock =
            investigationItems.length > 0
                ? investigationItems.map((line, i) => `${i + 1}. ${line}`).join('\n')
                : '—'
        const textToCopy = `RELATÓRIO CLÍNICO MEDCANN\nData: ${new Date().toLocaleDateString()}\n\nQUEIXA PRINCIPAL:\n${mainComplaint || 'Não especificada'}\n\nHISTÓRICO:\n${historyText || 'Nenhum histórico registrado.'}\n\nINVESTIGAÇÃO / DADOS:\n${invBlock}`

        navigator.clipboard.writeText(textToCopy)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
    }

    const handleShareReport = async () => {
        if (selectedDoctors.length === 0) return
        setSendingShare(true)

        try {
            // Tenta usar a função RPC se existir, senão simula sucesso para não travar o frontend
            // Idealmente: await supabase.rpc('share_report_with_doctors', { ... })

            const { error } = await supabase.rpc('share_report_with_doctors', {
                p_report_id: latestReport.id,
                p_patient_id: user?.id || (await supabase.auth.getUser()).data.user?.id,
                p_doctor_ids: selectedDoctors
            })

            if (error) throw error

            alert('Relatório compartilhado com sucesso!')
            setShowDoctorSelect(false)
            setSelectedDoctors([])
        } catch (err: any) {
            console.error('Erro ao compartilhar:', err)
            alert(err.message || 'Erro ao compartilhar relatório. Por favor, tente novamente.')
            setShowDoctorSelect(false)
            setSelectedDoctors([])
        } finally {
            setSendingShare(false)
        }
    }

    // Processar dados para gráficos e cards — ENRIQUECENDO COM SCORES CALCULADOS
    const sortedReports = useMemo(() => {
        return [...reports]
            .map(r => enrichReportWithScores(r))
            .sort((a, b) => new Date(b.generated_at).getTime() - new Date(a.generated_at).getTime())
    }, [reports])

    const brainSrc = `${import.meta.env.BASE_URL}brain.png`

    const ambientParticles = useMemo(() => {
        const count = 26
        return Array.from({ length: count }).map((_, idx) => {
            const size = Math.random() * 2.2 + 1.2
            const left = Math.random() * 100
            const top = Math.random() * 100
            const duration = Math.random() * 6 + 7 // 7-13s
            const delay = Math.random() * 4
            const opacity = Math.random() * 0.25 + 0.25
            return { key: `p-${idx}`, size, left, top, duration, delay, opacity }
        })
    }, [])

    const latestReport = sortedReports[0]
    const previousReport = sortedReports[1]
    
    // Determine if scores are real (calculated) or empty
    const hasCalculatedScores = latestReport?.content?.scores?.calculated === true

    const HISTORY_PAGE_SIZE = 7
    const historyTotalPages = useMemo(() => {
        return Math.max(1, Math.ceil(sortedReports.length / HISTORY_PAGE_SIZE))
    }, [sortedReports.length])

    const safeHistoryPage = Math.min(Math.max(1, historyPage), historyTotalPages)

    // Se a lista mudou e a página atual ficou inválida, “puxa” para a última válida
    React.useEffect(() => {
        if (safeHistoryPage !== historyPage) setHistoryPage(safeHistoryPage)
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [safeHistoryPage])

    const pagedHistoryReports = useMemo(() => {
        const start = (safeHistoryPage - 1) * HISTORY_PAGE_SIZE
        const end = start + HISTORY_PAGE_SIZE
        return sortedReports.slice(start, end)
    }, [sortedReports, safeHistoryPage])

    const getTrend = (current?: number, previous?: number) => {
        if (typeof current !== 'number') return 'unknown' as const
        if (typeof previous !== 'number') return 'unknown' as const
        const diff = current - previous
        if (diff > 0) return 'up' as const
        if (diff < 0) return 'down' as const
        return 'flat' as const
    }

    const trendToStyle = (trend: 'up' | 'down' | 'flat' | 'unknown') => {
        if (trend === 'up') return { dot: 'bg-emerald-400', glow: 'rgba(52, 211, 153, 0.45)', text: 'text-emerald-300' }
        if (trend === 'down') return { dot: 'bg-rose-400', glow: 'rgba(251, 113, 133, 0.45)', text: 'text-rose-300' }
        if (trend === 'flat') return { dot: 'bg-sky-400', glow: 'rgba(56, 189, 248, 0.38)', text: 'text-sky-300' }
        return { dot: 'bg-slate-500', glow: 'rgba(100, 116, 139, 0.25)', text: 'text-slate-300' }
    }

    const monitorSignals = useMemo(() => {
        const current = latestReport?.content?.scores
        const prev = previousReport?.content?.scores

        const clinicalTrend = getTrend(current?.clinical_score, prev?.clinical_score)
        const qolTrend = getTrend(current?.quality_of_life, prev?.quality_of_life)
        const adherenceTrend = getTrend(current?.treatment_adherence, prev?.treatment_adherence)
        const symptomsTrend = getTrend(current?.symptom_improvement, prev?.symptom_improvement)

        return [
            { id: 'qol', label: 'Cobertura de Histórico', trend: qolTrend, value: current?.quality_of_life ?? 0, region: 'head' as const },
            { id: 'clinical', label: 'Completude da Avaliação', trend: clinicalTrend, value: current?.clinical_score ?? 0, region: 'chest' as const },
            { id: 'adherence', label: 'Consistência da Informação', trend: adherenceTrend, value: current?.treatment_adherence ?? 0, region: 'abdomen' as const },
            { id: 'symptoms', label: 'Equilíbrio dos Dados', trend: symptomsTrend, value: current?.symptom_improvement ?? 0, region: 'legs' as const }
        ]
    }, [latestReport, previousReport])

    const msDay = 1000 * 60 * 60 * 24
    const lastAssessmentDate = useMemo(() => {
        const raw = (latestReport as any)?.generated_at
        if (!raw) return new Date()
        const dt = new Date(raw)
        return Number.isNaN(dt.getTime()) ? new Date() : dt
    }, [(latestReport as any)?.generated_at])
    const nextSuggestedDate = useMemo(() => new Date(lastAssessmentDate.getTime() + 30 * msDay), [lastAssessmentDate])
    const daysSinceLast = useMemo(() => {
        const diff = Date.now() - lastAssessmentDate.getTime()
        return Math.max(0, Math.floor(diff / msDay))
    }, [lastAssessmentDate])
    const daysUntilNext = useMemo(() => {
        const diff = nextSuggestedDate.getTime() - Date.now()
        return Math.max(0, Math.ceil(diff / msDay))
    }, [nextSuggestedDate])
    const nextProgressPct = useMemo(() => {
        // 0% no dia 0, 100% em 30 dias (cap)
        return Math.max(0, Math.min(100, Math.round((daysSinceLast / 30) * 100)))
    }, [daysSinceLast])

    const overallStatus = useMemo(() => {
        const ups = monitorSignals.filter(s => s.trend === 'up').length
        const downs = monitorSignals.filter(s => s.trend === 'down').length
        const flats = monitorSignals.filter(s => s.trend === 'flat').length
        if (downs >= 2) return { label: 'Atenção', color: 'text-rose-300', dot: 'bg-rose-400' }
        if (ups >= 2) return { label: 'Melhorando', color: 'text-emerald-300', dot: 'bg-emerald-400' }
        if (flats >= 2) return { label: 'Estável', color: 'text-sky-300', dot: 'bg-sky-400' }
        return { label: 'Em observação', color: 'text-slate-300', dot: 'bg-slate-500' }
    }, [monitorSignals])

    const upcomingAppointments = useMemo(() => {
        const now = new Date()
        return (appointments || [])
            .map(apt => {
                // Se apt.date já é ISO completo (ex: 2026-05-17T13:00:00+00:00), usar direto
                const isIso = apt.date?.includes('T')
                const dt = isIso ? new Date(apt.date) : new Date(`${apt.date}T${apt.time || '09:00'}`)
                return { ...apt, _dt: dt }
            })
            .filter(apt => (apt.status === 'scheduled' || apt.status === 'confirmed') && apt._dt >= now)
            .sort((a, b) => a._dt.getTime() - b._dt.getTime())
            .slice(0, 3)
    }, [appointments])

    const lastCompletedAppointment = useMemo(() => {
        return (appointments || [])
            .map(apt => ({ ...apt, _dt: new Date(`${apt.date}T${apt.time}`) }))
            .filter(apt => apt.status === 'completed')
            .sort((a, b) => b._dt.getTime() - a._dt.getTime())[0]
    }, [appointments])

    const latestPrescription = useMemo(() => {
        return (patientPrescriptions || [])[0]
    }, [patientPrescriptions])

    const prescriptionStatus = useMemo(() => {
        if (!latestPrescription) return { label: 'Nenhuma', color: 'text-slate-300', dot: 'bg-slate-500' }
        const status = (latestPrescription.status || '').toLowerCase()
        const endsAt = latestPrescription.endsAt ? new Date(latestPrescription.endsAt) : null
        const isExpired = endsAt ? endsAt.getTime() < Date.now() : false
        if (status === 'active' && !isExpired) return { label: 'Ativa', color: 'text-emerald-300', dot: 'bg-emerald-400' }
        if (isExpired || ['completed', 'cancelled', 'suspended'].includes(status)) return { label: 'Encerrada', color: 'text-rose-300', dot: 'bg-rose-400' }
        return { label: 'Em revisão', color: 'text-amber-300', dot: 'bg-amber-400' }
    }, [latestPrescription])

    /** Diferença em pontos (0–100) vs relatório anterior — não é variação percentual. */
    const getScoreChange = (current: number, previous?: number) => {
        if (typeof previous !== 'number' || typeof current !== 'number') return null as any
        const diff = current - previous
        if (diff > 0) return { icon: ArrowUp, color: 'text-emerald-400', label: `+${diff} pts` }
        if (diff < 0) return { icon: ArrowDown, color: 'text-rose-400', label: `${diff} pts` }
        return { icon: Minus, color: 'text-slate-400', label: '0 pts' }
    }

    // Estatísticas atuais
    const stats = [
        {
            id: 'clinical',
            label: 'Completude da Avaliação',
            value: latestReport?.content.scores?.clinical_score || 0,
            previous: previousReport?.content.scores?.clinical_score,
            icon: Activity,
            color: 'text-emerald-400',
            bg: 'bg-emerald-400/10',
            barColor: 'bg-emerald-500'
        },
        {
            id: 'adherence',
            label: 'Consistência da Informação',
            value: latestReport?.content.scores?.treatment_adherence || 0,
            previous: previousReport?.content.scores?.treatment_adherence,
            icon: Heart,
            color: 'text-rose-400',
            bg: 'bg-rose-400/10',
            barColor: 'bg-rose-500'
        },
        {
            id: 'qol',
            label: 'Cobertura de Histórico',
            value: latestReport?.content.scores?.quality_of_life || 0,
            previous: previousReport?.content.scores?.quality_of_life,
            icon: Zap,
            color: 'text-amber-400',
            bg: 'bg-amber-400/10',
            barColor: 'bg-amber-500'
        },
        {
            id: 'symptoms',
            label: 'Equilíbrio dos Dados',
            value: latestReport?.content.scores?.symptom_improvement || 0,
            previous: previousReport?.content.scores?.symptom_improvement,
            icon: TrendingUp,
            color: 'text-sky-400',
            bg: 'bg-sky-400/10',
            barColor: 'bg-sky-500'
        }
    ]

    if (loading) {
        return (
            <div className="relative overflow-hidden rounded-2xl border border-slate-700/40 bg-slate-900/30 backdrop-blur-sm h-64 flex items-center justify-center">
                <img
                    src={brainSrc}
                    alt=""
                    aria-hidden="true"
                    className="patient-brain-watermark absolute right-[-40px] top-1/2 -translate-y-1/2 w-[420px] max-w-none opacity-[0.10] pointer-events-none select-none"
                    draggable={false}
                    loading="eager"
                />
                <div className="absolute inset-0 pointer-events-none">
                    {ambientParticles.map(p => (
                        <span
                            key={p.key}
                            className="patient-particle"
                            style={{
                                left: `${p.left}%`,
                                top: `${p.top}%`,
                                width: `${p.size}px`,
                                height: `${p.size}px`,
                                opacity: p.opacity,
                                animationDuration: `${p.duration}s`,
                                animationDelay: `${p.delay}s`
                            }}
                        />
                    ))}
                </div>

                <div className="relative z-10 flex items-center gap-3 text-slate-200">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
                    <span className="text-sm text-slate-300">Carregando seus indicadores…</span>
                </div>
            </div>
        )
    }

    if (reports.length === 0) {
        return (
            <div className="relative overflow-hidden rounded-2xl border border-slate-700/40 bg-slate-900/30 backdrop-blur-sm p-8 text-center space-y-4">
                <img
                    src={brainSrc}
                    alt=""
                    aria-hidden="true"
                    className="patient-brain-watermark absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[520px] max-w-none opacity-[0.12] pointer-events-none select-none"
                    draggable={false}
                    loading="eager"
                />
                <div className="absolute inset-0 pointer-events-none">
                    {ambientParticles.map(p => (
                        <span
                            key={`empty-${p.key}`}
                            className="patient-particle"
                            style={{
                                left: `${p.left}%`,
                                top: `${p.top}%`,
                                width: `${p.size}px`,
                                height: `${p.size}px`,
                                opacity: p.opacity,
                                animationDuration: `${p.duration}s`,
                                animationDelay: `${p.delay}s`
                            }}
                        />
                    ))}
                </div>

                <div className="relative z-10 flex flex-col items-center justify-center space-y-4">
                    <div className="w-16 h-16 rounded-full bg-slate-800/50 flex items-center justify-center mb-2 border border-slate-700/40">
                        <Activity className="w-8 h-8 text-slate-400" />
                    </div>
                    <h3 className="text-xl font-bold text-slate-200">Nenhuma avaliação encontrada</h3>
                    <p className="text-slate-400 max-w-md">
                        Complete sua primeira avaliação clínica inicial com a Nôa para gerar seus indicadores de saúde e acompanhar seu progresso.
                    </p>
                </div>
            </div>
        )
    }

    const spacing = compact ? 'space-y-4' : 'space-y-6'
    const cardPadding = compact ? 'p-4' : 'p-6'
    const cardGap = compact ? 'gap-4' : 'gap-6'
    const cardRounded = compact ? 'rounded-xl' : 'rounded-2xl'
    const headerGap = compact ? 'gap-4' : 'gap-6'
    const sectionGap = compact ? 'gap-3' : 'gap-4'
    const titleSize = compact ? 'text-lg' : 'text-xl'
    const titleSizeLg = compact ? 'text-xl' : 'text-2xl'
    const bottomPad = compact ? 'pb-8' : 'pb-20'
    const avatarSize = compact ? 'w-14 h-14' : 'w-20 h-20'
    const mtSection = compact ? 'mt-4' : 'mt-8'

    return (
        <div className={`${spacing} ${bottomPad} fade-in-up`}>
            {/* Profile Header */}
            <div className={`${cardRounded} ${cardPadding} relative overflow-hidden flex flex-col md:flex-row items-center ${headerGap}`}
                style={{ background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.9) 0%, rgba(30, 41, 59, 0.9) 100%)', border: '1px solid rgba(52, 211, 153, 0.1)' }}>

                {/* Background Glow */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none"></div>
                <img
                    src={brainSrc}
                    alt=""
                    aria-hidden="true"
                    className="patient-brain-watermark absolute right-[-60px] top-1/2 -translate-y-1/2 w-[520px] max-w-none opacity-[0.08] pointer-events-none select-none"
                    draggable={false}
                    loading="lazy"
                />

                <div className={`${avatarSize} rounded-full p-[2px] bg-gradient-to-br from-emerald-400 to-cyan-500 shadow-lg shadow-emerald-500/20`}>
                    <div className="w-full h-full rounded-full bg-slate-900 flex items-center justify-center overflow-hidden">
                        {user?.photoURL ? (
                            <img src={user.photoURL} alt={user.name} className="w-full h-full object-cover" />
                        ) : (
                            <span className="text-2xl font-bold text-emerald-400">{user?.name?.[0] || 'P'}</span>
                        )}
                    </div>
                </div>

                <div className="flex-1 text-center md:text-left z-10">
                    <h2 className="text-2xl font-bold text-white mb-1">{user?.name || 'Paciente'}</h2>
                    <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 text-sm text-slate-400">
                        {user?.email && (
                            <span className="flex items-center gap-1.5">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                                {user.email}
                            </span>
                        )}
                        <span className="flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                            Paciente MedCann
                        </span>
                    </div>
                </div>

                <div className="flex items-center gap-3 bg-slate-800/50 px-4 py-2 rounded-xl border border-slate-700/50 backdrop-blur-sm">
                    <Calendar className="w-4 h-4 text-emerald-400" />
                    <div className="text-left">
                        <p className="text-[10px] text-slate-400 uppercase tracking-wider">Última Avaliação</p>
                        <p className="text-sm font-semibold text-white">
                            {latestReport?.generated_at ? new Date(latestReport.generated_at).toLocaleDateString() : '—'}
                        </p>
                    </div>
                </div>
            </div>

            {/* Header Title (Legacy) */}
            <div className={`flex flex-col md:flex-row md:items-center justify-between ${sectionGap} ${mtSection}`}>
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <h2 className={`${titleSize} font-bold text-white`}>Índices da Avaliação AEC</h2>
                        <button
                            type="button"
                            className="shrink-0 rounded-full p-0.5 text-slate-500 hover:text-sky-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-500/50 cursor-help transition-colors"
                            title="Cada card mostra uma pontuação de 0 a 100 baseada na completude e riqueza da sua avaliação AEC — quanto mais informações preenchidas, maior o índice. Esses números medem a qualidade dos dados registrados, não o seu estado de saúde diretamente."
                            aria-label="Como interpretar os índices da avaliação"
                        >
                            <Info className="w-4 h-4" strokeWidth={2} aria-hidden />
                        </button>
                    </div>
                    <p className="text-slate-400 text-sm">Acompanhe a completude e riqueza das suas avaliações</p>
                </div>
                {!isProfessionalView && (
                    <div className="flex gap-2">
                        <button
                            onClick={() => {
                                const text = `Olá! Sou paciente do MedCannLab.\n\nCompletude da Avaliação: ${latestReport?.content.scores?.clinical_score ?? 0}/100.\nAvaliação: ${latestReport?.generated_at ? new Date(latestReport.generated_at).toLocaleDateString('pt-BR') : 'data indisponível'}.\n\nGostaria de agendar uma consulta.`
                                const encoded = encodeURIComponent(text)
                                // wa.me sem número abre o seletor de contatos no celular
                                // No desktop, abre WhatsApp Web pedindo para escolher contato
                                window.open(`https://wa.me/?text=${encoded}`, '_blank')
                            }}
                            className="flex items-center gap-2 px-4 py-2 bg-[#25D366]/10 text-[#25D366] hover:bg-[#25D366]/20 border border-[#25D366]/20 rounded-lg text-sm font-medium transition-colors"
                        >
                            <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path></svg>
                            WhatsApp
                        </button>
                        <button
                            onClick={onScheduleClick}
                            className="flex items-center gap-2 px-4 py-2 bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 border border-blue-500/20 rounded-lg text-sm font-medium transition-all shadow-[0_0_15px_rgba(59,130,246,0.3)] hover:shadow-[0_0_20px_rgba(59,130,246,0.5)] animate-pulse"
                        >
                            <Calendar className="w-4 h-4" />
                            Agendar Consulta
                        </button>
                        <button
                            onClick={() => setShowDoctorSelect(true)}
                            className="flex items-center gap-2 px-4 py-2 bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 border border-blue-500/20 rounded-lg text-sm font-medium transition-colors"
                        >
                            <FileText className="w-4 h-4" />
                            Enviar para Médico
                        </button>
                    </div>
                )}
            </div>

            {/* KPI Cards */}
            <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 ${compact ? 'gap-3' : 'gap-4'}`}>
                {stats.map((stat) => {
                    const change = getScoreChange(stat.value, stat.previous)
                    const ChangeIcon = change?.icon

                    return (
                        <div
                            key={stat.id}
                            className={`relative overflow-hidden rounded-xl border border-slate-700/50 bg-slate-800/30 backdrop-blur-sm ${compact ? 'p-3' : 'p-4'} transition-all hover:bg-slate-800/50 hover:border-slate-600/50 group`}
                        >
                            <div className="flex justify-between items-start mb-2">
                                <div className={`p-2 rounded-lg ${stat.bg}`}>
                                    <stat.icon className={`w-5 h-5 ${stat.color}`} />
                                </div>
                                {change && (
                                    <div
                                        className={`flex items-center gap-1 text-xs font-medium ${change.color} bg-slate-900/40 px-2 py-1 rounded-full`}
                                        title="Diferença em pontos (0–100) vs relatório anterior — veja o ícone ℹ ao título Indicadores de Saúde."
                                    >
                                        <ChangeIcon className="w-3 h-3" />
                                        {change.label}
                                    </div>
                                )}
                            </div>

                            <div className="mt-2">
                                <p className="text-slate-400 text-xs font-medium uppercase tracking-wider">{stat.label}</p>
                                {hasCalculatedScores ? (
                                    <div className="flex items-end gap-2 mt-1">
                                        <span className="text-2xl font-bold text-white">{stat.value}</span>
                                        <span className="text-slate-500 text-sm mb-1">/ 100</span>
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-2 mt-1">
                                        <span className="text-sm font-medium text-amber-400/80">Aguardando dados</span>
                                    </div>
                                )}
                            </div>

                            {/* Progress Bar */}
                            <div className="mt-3 h-1.5 w-full bg-slate-700/50 rounded-full overflow-hidden">
                                <div
                                    className={`h-full ${stat.barColor} transition-all duration-1000 ease-out`}
                                    style={{ width: `${stat.value}%` }}
                                />
                            </div>
                        </div>
                    )
                })}
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 min-w-0">

                {/* Left Column - History & Evolution */}
                <div className="lg:col-span-2 space-y-6 min-w-0">

                    {/* Evolution Chart (Simple CSS implementation) */}
                    <div className="rounded-xl border border-slate-700/50 bg-slate-800/30 backdrop-blur-sm p-6">
                        <h3 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
                            <TrendingUp className="w-5 h-5 text-emerald-400" />
                            Evolução da Completude
                        </h3>

                        <div className={`${compact ? 'h-48' : 'h-64'} w-full min-w-0 flex items-end justify-between gap-2 md:gap-4 px-2 pr-3 relative overflow-x-auto overflow-y-hidden`}>
                            {/* Background Grid Lines */}
                            <div className="absolute inset-0 flex flex-col justify-between pointer-events-none pb-8 opacity-20">
                                {[100, 75, 50, 25, 0].map(val => (
                                    <div key={val} className="w-full border-t border-slate-400 flex items-center">
                                        <span className="text-[10px] text-slate-400 -mt-5">{val}</span>
                                    </div>
                                ))}
                            </div>

                            {/* Bars */}
                            {[...reports].reverse().map((report, idx) => {
                                const score = report.content.scores?.clinical_score || 0
                                return (
                                    <div key={report.id} className="flex flex-col items-center gap-2 group relative z-10 w-full">
                                        <div
                                            className="w-full max-w-[40px] bg-emerald-500/80 rounded-t-sm hover:bg-emerald-400 transition-all duration-300 relative group-hover:shadow-[0_0_15px_rgba(52,211,153,0.3)]"
                                            style={{ height: `${Math.max(score, 5)}%` }}
                                        >
                                            <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-900 text-emerald-400 text-xs font-bold py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap border border-emerald-500/20">
                                                {score} pts
                                            </div>
                                        </div>
                                        <span className="text-[10px] text-slate-400 whitespace-nowrap text-center" style={{ minWidth: '3rem' }}>
                                            {new Date(report.generated_at).toLocaleDateString(undefined, { day: '2-digit', month: '2-digit' })}
                                        </span>
                                    </div>
                                )
                            })}
                        </div>
                    </div>

                    {/* Assessment History + Monitor (side-by-side, with spacing) */}
                    <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-4">
                        {/* History card */}
                        <div className="rounded-xl border border-slate-700/50 bg-slate-800/30 backdrop-blur-sm overflow-hidden">
                            <div className="p-4 border-b border-slate-700/50 flex justify-between items-center">
                                <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                                    <Brain className="w-5 h-5 text-purple-400" />
                                    Histórico de Avaliações
                                </h3>
                                <div className="text-xs text-slate-400">
                                    {sortedReports.length} total
                                </div>
                            </div>

                            <div className="divide-y divide-slate-700/50">
                                {pagedHistoryReports.map((report) => (
                                    <div key={report.id} onClick={() => setSelectedReport(report)} className="p-4 flex items-center justify-between hover:bg-slate-700/20 transition-colors group cursor-pointer active:scale-[0.99] transform duration-100">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-full bg-purple-500/10 flex items-center justify-center border border-purple-500/20 group-hover:bg-purple-500/20 group-hover:border-purple-500/40 transition-all">
                                                <FileText className="w-5 h-5 text-purple-400" />
                                            </div>
                                            <div>
                                                <p className="text-sm font-medium text-white flex items-center gap-2">
                                                    {getAecReportModalPayload(report.content as any).mainComplaint ||
                                                        'Avaliação Clínica'}
                                                    {report.status === 'completed' && (
                                                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/20">
                                                            Completa
                                                        </span>
                                                    )}
                                                </p>
                                                <p className="text-xs text-slate-400">
                                                    {new Date(report.generated_at).toLocaleDateString()} • {new Date(report.generated_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-4">
                                            <div className="hidden sm:flex flex-col items-end">
                                                <span className="text-xs text-slate-400">Score</span>
                                                <span className="text-sm font-bold text-emerald-400">{report.content.scores?.calculated ? (report.content.scores?.clinical_score ?? '—') : 'Em cálculo'}</span>
                                            </div>
                                            <ChevronRight className="w-5 h-5 text-slate-600 group-hover:text-white transition-colors" />
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {historyTotalPages > 1 && (
                                <div className="p-4 border-t border-slate-700/50 flex items-center justify-between gap-3">
                                    <button
                                        type="button"
                                        className="px-3 py-1.5 rounded-lg border border-slate-700/60 bg-slate-900/40 text-slate-200 text-sm hover:bg-slate-800/50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                        onClick={() => setHistoryPage(p => Math.max(1, p - 1))}
                                        disabled={safeHistoryPage <= 1}
                                    >
                                        Anterior
                                    </button>

                                    <div className="text-xs text-slate-400">
                                        Página <span className="text-slate-200 font-medium">{safeHistoryPage}</span> de{' '}
                                        <span className="text-slate-200 font-medium">{historyTotalPages}</span> (máx. {HISTORY_PAGE_SIZE} por página)
                                    </div>

                                    <button
                                        type="button"
                                        className="px-3 py-1.5 rounded-lg border border-slate-700/60 bg-slate-900/40 text-slate-200 text-sm hover:bg-slate-800/50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                        onClick={() => setHistoryPage(p => Math.min(historyTotalPages, p + 1))}
                                        disabled={safeHistoryPage >= historyTotalPages}
                                    >
                                        Próxima
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* Monitor card */}
                        <div className="hidden lg:block rounded-xl border border-slate-700/50 bg-slate-800/30 backdrop-blur-sm p-4 relative overflow-hidden">
                            <div className="absolute -right-12 -top-12 w-40 h-40 rounded-full bg-purple-500/10 blur-2xl pointer-events-none"></div>
                            <div className="absolute -left-10 -bottom-16 w-56 h-56 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none"></div>

                            <div className="flex items-start justify-between gap-3 relative z-10">
                                <div>
                                    <p className="text-xs text-slate-400 uppercase tracking-wider">Monitor de Saúde</p>
                                    <p className="text-sm font-semibold text-slate-200">Sinais (última vs anterior)</p>
                                </div>
                                <span className="text-[10px] px-2 py-1 rounded-full border border-slate-700/50 bg-slate-900/40 text-slate-300">
                                    Auto
                                </span>
                            </div>

                            <div className="mt-4 relative z-10">
                                <div className="relative mx-auto w-full max-w-[240px] h-[280px]">
                                    {/* Humanoid silhouette (inline SVG) */}
                                    <svg
                                        viewBox="0 0 200 320"
                                        className="w-full h-full opacity-90"
                                        aria-hidden="true"
                                    >
                                        <defs>
                                            <linearGradient id="humanoidFill" x1="0" x2="0" y1="0" y2="1">
                                                <stop offset="0%" stopColor="rgba(148,163,184,0.35)" />
                                                <stop offset="100%" stopColor="rgba(148,163,184,0.12)" />
                                            </linearGradient>
                                        </defs>
                                        <circle cx="100" cy="48" r="28" fill="url(#humanoidFill)" stroke="rgba(148,163,184,0.22)" />
                                        <path
                                            d="M60 100 C60 82 78 70 100 70 C122 70 140 82 140 100 L140 166 C140 184 126 198 110 202 L110 280 C110 294 100 306 100 306 C100 306 90 294 90 280 L90 202 C74 198 60 184 60 166 Z"
                                            fill="url(#humanoidFill)"
                                            stroke="rgba(148,163,184,0.18)"
                                        />
                                        <path
                                            d="M60 114 C42 126 34 146 34 166 C34 184 44 198 58 202 L72 176 L60 114 Z"
                                            fill="url(#humanoidFill)"
                                            stroke="rgba(148,163,184,0.14)"
                                        />
                                        <path
                                            d="M140 114 C158 126 166 146 166 166 C166 184 156 198 142 202 L128 176 L140 114 Z"
                                            fill="url(#humanoidFill)"
                                            stroke="rgba(148,163,184,0.14)"
                                        />
                                        <path
                                            d="M78 206 L78 300 C78 308 84 314 92 314 L92 314"
                                            fill="none"
                                            stroke="rgba(148,163,184,0.20)"
                                            strokeWidth="10"
                                            strokeLinecap="round"
                                        />
                                        <path
                                            d="M122 206 L122 300 C122 308 116 314 108 314 L108 314"
                                            fill="none"
                                            stroke="rgba(148,163,184,0.20)"
                                            strokeWidth="10"
                                            strokeLinecap="round"
                                        />
                                    </svg>

                                    {/* Signal dots */}
                                    {monitorSignals.map(sig => {
                                        const style = trendToStyle(sig.trend)
                                        const pos =
                                            sig.region === 'head'
                                                ? { left: '55%', top: '15%' }
                                                : sig.region === 'chest'
                                                    ? { left: '62%', top: '38%' }
                                                    : sig.region === 'abdomen'
                                                        ? { left: '42%', top: '52%' }
                                                        : { left: '58%', top: '74%' }

                                        return (
                                            <span
                                                key={sig.id}
                                                className={`health-signal-dot absolute ${style.dot}`}
                                                style={{
                                                    left: pos.left,
                                                    top: pos.top,
                                                    boxShadow: `0 0 14px ${style.glow}`,
                                                    transform: 'translate(-50%, -50%)'
                                                }}
                                                title={`${sig.label}: ${sig.trend === 'up' ? 'melhorando' : sig.trend === 'down' ? 'atenção' : sig.trend === 'flat' ? 'estável' : 'sem comparação'}`}
                                            />
                                        )
                                    })}
                                </div>
                            </div>

                            <div className="mt-4 space-y-2 relative z-10">
                                {monitorSignals.map(sig => {
                                    const style = trendToStyle(sig.trend)
                                    const TrendIcon =
                                        sig.trend === 'up' ? ArrowUp : sig.trend === 'down' ? ArrowDown : sig.trend === 'flat' ? Minus : Minus
                                    const trendLabel =
                                        sig.trend === 'up' ? 'melhorando' : sig.trend === 'down' ? 'atenção' : sig.trend === 'flat' ? 'estável' : (hasCalculatedScores ? 'primeira avaliação' : 'em cálculo')
                                    return (
                                        <div key={`legend-${sig.id}`} className="flex items-center justify-between gap-3 rounded-lg border border-slate-700/40 bg-slate-950/20 px-3 py-2">
                                            <div className="flex items-center gap-2 min-w-0">
                                                <span
                                                    className={`w-2.5 h-2.5 rounded-full ${style.dot}`}
                                                    style={{ boxShadow: `0 0 10px ${style.glow}` }}
                                                />
                                                <span className="text-xs text-slate-300 truncate">{sig.label}</span>
                                            </div>
                                            <div className={`flex items-center gap-1 ${style.text}`}>
                                                <TrendIcon className="w-3.5 h-3.5" />
                                                <span className="text-[11px] font-medium">{trendLabel}</span>
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Column - Insights & Recommendations */}
                <div className="space-y-6">
                    <div className="rounded-xl border border-slate-700/50 bg-slate-800/30 backdrop-blur-sm p-5 relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-full blur-2xl -mr-16 -mt-16 pointer-events-none"></div>

                        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2 relative z-10">
                            <Award className="w-5 h-5 text-amber-400" />
                            Insights & Recomendações
                        </h3>

                        <div className="space-y-4 relative z-10">
                            {(latestReport.content?.recommendations && Array.isArray(latestReport.content.recommendations) ? latestReport.content.recommendations : []).slice(0, 4).map((rec: string, idx: number) => (
                                <div key={idx} className="flex gap-3 items-start p-3 rounded-lg bg-slate-900/40 border border-slate-700/30 hover:border-amber-500/30 transition-colors">
                                    <div className="mt-0.5 min-w-[16px] w-4 h-4 rounded-full bg-amber-500/20 flex items-center justify-center border border-amber-500/30">
                                        <span className="text-[10px] font-bold text-amber-500">{idx + 1}</span>
                                    </div>
                                    <p className="text-sm text-slate-300 leading-relaxed">{rec}</p>
                                </div>
                            ))}
                        </div>

                        <div className="mt-6 pt-4 border-t border-slate-700/50">
                            <div className="flex items-center justify-between">
                                <span className="text-xs text-slate-400">Próxima avaliação sugerida</span>
                                <span className="text-sm font-medium text-emerald-400">
                                    {daysUntilNext === 0 ? 'Hoje' : `Em ${daysUntilNext} dias`}
                                </span>
                            </div>
                            <div className="mt-2 w-full h-1.5 bg-slate-700/50 rounded-full">
                                <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${nextProgressPct}%` }}></div>
                            </div>
                            <div className="mt-2 flex items-center justify-between text-[11px] text-slate-500">
                                <span>Última: {lastAssessmentDate.toLocaleDateString()}</span>
                                <span>Próxima: {nextSuggestedDate.toLocaleDateString()}</span>
                            </div>
                        </div>
                    </div>

                    {/* ─── Resumo Clínico — Enhanced Card ─── */}
                    <div className="rounded-xl border border-slate-700/50 bg-slate-800/30 backdrop-blur-sm overflow-hidden relative">
                        <div className="absolute top-0 left-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-3xl -ml-16 -mt-16 pointer-events-none" />

                        {/* Header */}
                        <div className="px-5 py-4 border-b border-slate-700/50 flex items-center justify-between relative z-10">
                            <div className="flex items-center gap-3">
                                <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                                    <Clock className="w-5 h-5 text-emerald-400" />
                                </div>
                                <div>
                                    <h4 className="text-base font-semibold text-white">Resumo Clínico</h4>
                                    <p className="text-[11px] text-slate-400">Visão geral do seu acompanhamento</p>
                                </div>
                            </div>
                            <div className={`flex items-center gap-2 text-xs px-2.5 py-1 rounded-full border ${overallStatus.color} border-current/20`}>
                                <span className={`w-2 h-2 rounded-full ${overallStatus.dot}`}></span>
                                <span className="font-medium">{overallStatus.label}</span>
                            </div>
                        </div>

                        <div className="p-5 space-y-5 relative z-10">
                            {/* Stats row */}
                            <div className="grid grid-cols-3 gap-3">
                                <div className="rounded-lg border border-slate-700/40 bg-slate-900/30 p-3 text-center">
                                    <div className="mx-auto w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center mb-1.5">
                                        <Brain className="w-4 h-4 text-emerald-400" />
                                    </div>
                                    <p className="text-xl font-bold text-white">{reports.length}</p>
                                    <p className="text-[10px] text-slate-400 mt-0.5">Avaliações</p>
                                </div>
                                <div className="rounded-lg border border-slate-700/40 bg-slate-900/30 p-3 text-center">
                                    <div className="mx-auto w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center mb-1.5">
                                        <AlertCircle className="w-4 h-4 text-blue-400" />
                                    </div>
                                    <p className="text-xl font-bold text-white">{examRequests.length}</p>
                                    <p className="text-[10px] text-slate-400 mt-0.5">Exames</p>
                                </div>
                                <div className="rounded-lg border border-slate-700/40 bg-slate-900/30 p-3 text-center">
                                    <div className="mx-auto w-8 h-8 rounded-lg bg-purple-500/10 flex items-center justify-center mb-1.5">
                                        <Calendar className="w-4 h-4 text-purple-400" />
                                    </div>
                                    <p className="text-xl font-bold text-white">{upcomingAppointments.length}</p>
                                    <p className="text-[10px] text-slate-400 mt-0.5">Consultas</p>
                                </div>
                            </div>

                            {/* Data rows */}
                            <div className="space-y-2.5">
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-slate-400 flex items-center gap-2">
                                        <span className="w-1.5 h-1.5 rounded-full bg-cyan-400"></span>
                                        Dias desde última avaliação
                                    </span>
                                    <span className="font-semibold text-slate-200">{daysSinceLast} dias</span>
                                </div>
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-slate-400 flex items-center gap-2">
                                        <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
                                        Próxima reavaliação
                                    </span>
                                    <span className="font-semibold text-slate-200">{nextSuggestedDate.toLocaleDateString('pt-BR')}</span>
                                </div>
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-slate-400 flex items-center gap-2">
                                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                                        Variação score clínico
                                    </span>
                                    <span className="font-semibold text-slate-200">
                                        {hasCalculatedScores && typeof previousReport?.content?.scores?.clinical_score === 'number'
                                            ? (() => {
                                                const diff = (latestReport.content?.scores?.clinical_score ?? 0) - (previousReport.content?.scores?.clinical_score ?? 0)
                                                return <span className={diff > 0 ? 'text-emerald-400' : diff < 0 ? 'text-red-400' : ''}>{diff > 0 ? '+' : ''}{diff} pts</span>
                                            })()
                                            : (hasCalculatedScores ? 'Primeira avaliação' : 'Em cálculo')}
                                    </span>
                                </div>
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-slate-400 flex items-center gap-2">
                                        <span className="w-1.5 h-1.5 rounded-full bg-blue-400"></span>
                                        Score atual
                                    </span>
                                    <span className="font-semibold text-slate-200">
                                        {hasCalculatedScores ? (latestReport?.content?.scores?.clinical_score ?? '—') : 'Em cálculo'}
                                    </span>
                                </div>
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-slate-400 flex items-center gap-2">
                                        <span className="w-1.5 h-1.5 rounded-full bg-purple-400"></span>
                                        Última avaliação
                                    </span>
                                    <span className="font-semibold text-slate-200">
                                        {lastAssessmentDate.toLocaleDateString('pt-BR')}
                                    </span>
                                </div>
                            </div>

                            {/* Assessment cycle progress */}
                            <div className="rounded-lg border border-slate-700/40 bg-slate-900/30 p-3">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-xs text-slate-400 font-medium">Ciclo de reavaliação</span>
                                    <span className="text-xs font-semibold text-emerald-400">{Math.min(100, Math.round(nextProgressPct))}%</span>
                                </div>
                                <div className="w-full h-2 bg-slate-700/50 rounded-full overflow-hidden">
                                    <div
                                        className="h-full rounded-full transition-all duration-700"
                                        style={{
                                            width: `${Math.min(100, nextProgressPct)}%`,
                                            background: nextProgressPct > 80 ? 'linear-gradient(90deg, #f59e0b, #ef4444)' : 'linear-gradient(90deg, #10b981, #06b6d4)'
                                        }}
                                    />
                                </div>
                                <div className="mt-1.5 flex items-center justify-between text-[10px] text-slate-500">
                                    <span>{lastAssessmentDate.toLocaleDateString('pt-BR')}</span>
                                    <span>{daysUntilNext <= 0 ? '⚠️ Atrasada' : `${daysUntilNext}d restantes`}</span>
                                    <span>{nextSuggestedDate.toLocaleDateString('pt-BR')}</span>
                                </div>
                            </div>

                            {/* Monitor signals */}
                            <div>
                                <p className="text-xs text-slate-400 font-medium mb-2">Indicadores clínicos</p>
                                <div className="grid grid-cols-2 gap-2">
                                    {monitorSignals.map(sig => {
                                        const style = trendToStyle(sig.trend)
                                        const tag =
                                            sig.trend === 'up' ? '↑' : sig.trend === 'down' ? '↓' : sig.trend === 'flat' ? '•' : '—'
                                        return (
                                            <div key={`mini-${sig.id}`} className="rounded-lg border border-slate-700/40 bg-slate-900/30 px-3 py-2.5">
                                                <div className="flex items-center justify-between gap-2">
                                                    <span className="text-[11px] text-slate-400 truncate">{sig.label}</span>
                                                    <span className={`text-xs font-bold ${style.text}`}>{tag}</span>
                                                </div>
                                                <div className="mt-1 flex items-center justify-between">
                                                    <span className="text-sm text-slate-200 font-bold">{hasCalculatedScores ? sig.value : '—'}</span>
                                                    <span className={`w-2.5 h-2.5 rounded-full ${style.dot}`} style={{ boxShadow: `0 0 12px ${style.glow}` }} />
                                                </div>
                                            </div>
                                        )
                                    })}
                                </div>
                            </div>
                        </div>
                    </div>

                </div>

            </div>

            {/* ─── Consultas + Prescrição — 2-column row ─── */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Consultas */}
                <div className="rounded-xl border border-slate-700/50 bg-slate-800/30 backdrop-blur-sm p-5">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                            <div className="p-2 rounded-lg bg-blue-500/10 border border-blue-500/20">
                                <Calendar className="w-4 h-4 text-blue-400" />
                            </div>
                            <h4 className="text-base font-semibold text-white">Consultas</h4>
                        </div>
                        <button
                            type="button"
                            className="text-xs text-blue-300 hover:text-blue-200 underline underline-offset-2"
                            onClick={() => navigate('/app/clinica/paciente/agendamentos')}
                        >
                            Ver calendário
                        </button>
                    </div>

                    {upcomingAppointments.length > 0 ? (
                        <div className="space-y-2">
                            {upcomingAppointments.slice(0, 2).map((apt: any) => (
                                <div key={apt.id} className="rounded-lg border border-slate-700/40 bg-slate-900/30 px-3 py-2.5">
                                    <div className="flex items-center justify-between gap-3">
                                        <div className="min-w-0">
                                            <p className="text-xs text-slate-400">Próxima</p>
                                            <p className="text-sm text-slate-200 font-semibold truncate">{apt.professional}</p>
                                            <p className="text-xs text-slate-400">
                                                {new Date(apt.date).toLocaleDateString('pt-BR')} • {apt.time} • {apt.type}
                                            </p>
                                        </div>
                                        <span className="text-[10px] px-2 py-1 rounded-full border border-blue-500/20 bg-blue-500/10 text-blue-200">
                                            agendada
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="rounded-lg border border-slate-700/40 bg-slate-900/30 px-3 py-3 text-sm text-slate-300">
                            <p>Nenhuma consulta futura encontrada.</p>
                            {lastCompletedAppointment && (
                                <p className="text-xs text-slate-500 mt-1">
                                    Última concluída: {new Date(lastCompletedAppointment.date).toLocaleDateString('pt-BR')} • {lastCompletedAppointment.professional}
                                </p>
                            )}
                        </div>
                    )}

                    {!isProfessionalView && (
                        <div className="mt-4 flex gap-2">
                            <button
                                type="button"
                                className="flex-1 px-3 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold transition-colors"
                                onClick={() => navigate('/app/clinica/paciente/agendamentos', { state: { openNew: true } })}
                            >
                                Nova consulta rápida
                            </button>
                            <button
                                type="button"
                                className="px-3 py-2 rounded-lg border border-slate-700/60 bg-slate-900/40 text-slate-200 text-sm hover:bg-slate-800/50 transition-colors"
                                onClick={() => navigate('/app/clinica/paciente/chat-profissional')}
                            >
                                Falar com médico
                            </button>
                        </div>
                    )}
                </div>

                {/* Prescrição */}
                <div className="rounded-xl border border-slate-700/50 bg-slate-800/30 backdrop-blur-sm p-5">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                            <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                                <Heart className="w-4 h-4 text-emerald-400" />
                            </div>
                            <h4 className="text-base font-semibold text-white">Prescrição</h4>
                        </div>
                        <div className={`flex items-center gap-2 text-xs ${prescriptionStatus.color}`}>
                            <span className={`w-2 h-2 rounded-full ${prescriptionStatus.dot}`}></span>
                            <span className="font-medium">{prescriptionStatus.label}</span>
                        </div>
                    </div>

                    {patientPrescriptionsLoading ? (
                        <div className="text-sm text-slate-300">Carregando prescrições…</div>
                    ) : latestPrescription ? (
                        <div className="rounded-lg border border-slate-700/40 bg-slate-900/30 px-3 py-3">
                            <p className="text-sm text-slate-200 font-semibold">{latestPrescription.title}</p>
                            <p className="text-xs text-slate-400 mt-1">
                                {latestPrescription.professionalName ? `Profissional: ${latestPrescription.professionalName}` : 'Profissional: equipe clínica'}
                            </p>
                            <p className="text-xs text-slate-400">
                                {latestPrescription.endsAt
                                    ? `Validade: até ${new Date(latestPrescription.endsAt).toLocaleDateString('pt-BR')}`
                                    : 'Validade: a definir na consulta'}
                            </p>
                        </div>
                    ) : (
                        <div className="rounded-lg border border-slate-700/40 bg-slate-900/30 px-3 py-3 text-sm text-slate-300">
                            Nenhuma prescrição registrada ainda.
                        </div>
                    )}

                    {!isProfessionalView && (
                        <div className="mt-4 flex gap-2">
                            <button
                                type="button"
                                className="flex-1 px-3 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                disabled={!latestPrescription}
                                onClick={() => navigate('/app/clinica/paciente/chat-profissional', { state: { topic: 'prescricao', action: 'renew', prescriptionId: latestPrescription?.id } })}
                            >
                                Renovar / ajustar
                            </button>
                            <button
                                type="button"
                                className="px-3 py-2 rounded-lg border border-slate-700/60 bg-slate-900/40 text-slate-200 text-sm hover:bg-slate-800/50 transition-colors"
                                onClick={() => navigate('/app/clinica/paciente/agendamentos', { state: { openNew: true, reason: 'prescription' } })}
                            >
                                Marcar consulta
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* ─── Exames Solicitados — Compact Full-Width ─── */}
            {(() => {
                const EXAM_PAGE_SIZE = 5
                const examTotalPages = Math.max(1, Math.ceil(examRequests.length / EXAM_PAGE_SIZE))
                const safeExamPage = Math.min(Math.max(1, examPage), examTotalPages)
                const pagedExams = examRequests.slice((safeExamPage - 1) * EXAM_PAGE_SIZE, safeExamPage * EXAM_PAGE_SIZE)

                const statusConfig: Record<string, { label: string; color: string; dot: string; bg: string }> = {
                    draft: { label: 'Rascunho', color: 'text-slate-400', dot: 'bg-slate-400', bg: 'bg-slate-400/10' },
                    pending: { label: 'Pendente', color: 'text-amber-400', dot: 'bg-amber-400', bg: 'bg-amber-400/10' },
                    sent: { label: 'Enviado', color: 'text-blue-400', dot: 'bg-blue-400', bg: 'bg-blue-400/10' },
                    completed: { label: 'Concluído', color: 'text-emerald-400', dot: 'bg-emerald-400', bg: 'bg-emerald-400/10' },
                }

                const handlePrintExam = (content: string) => {
                    const w = window.open('', '', 'width=800,height=600')
                    if (w) {
                        w.document.write(`<html><head><title>Solicitação de Exame</title><style>body{font-family:'Segoe UI',sans-serif;padding:40px;color:#333;white-space:pre-wrap;line-height:1.6}.header{text-align:center;margin-bottom:30px;border-bottom:2px solid #000;padding-bottom:15px}.logo{font-size:22px;font-weight:bold}</style></head><body><div class="header"><div class="logo">MedCannLab</div><p>Solicitação de Exames</p><p>${new Date().toLocaleDateString('pt-BR')}</p></div><div>${content}</div></body></html>`)
                        w.document.close()
                        w.focus()
                        setTimeout(() => w.print(), 500)
                    }
                }

                const handleShareWhatsApp = (content: string) => {
                    const text = `*Solicitação de Exame - MedCannLab*\n\n${content}\n\n_Data: ${new Date().toLocaleDateString('pt-BR')}_`
                    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank')
                }

                return (
                    <div className="rounded-xl border border-slate-700/50 bg-slate-800/30 backdrop-blur-sm overflow-hidden relative">
                        <div className="absolute top-0 right-0 w-48 h-48 bg-cyan-500/5 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />

                        {/* Header */}
                        <div className="px-5 py-4 border-b border-slate-700/50 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="p-2 rounded-lg bg-cyan-500/10 border border-cyan-500/20">
                                    <FlaskConical className="w-5 h-5 text-cyan-400" />
                                </div>
                                <div>
                                    <h3 className="text-base font-semibold text-white">Exames Solicitados</h3>
                                    <p className="text-[11px] text-slate-400">Clique para expandir • Imprima ou compartilhe</p>
                                </div>
                            </div>
                            {examRequests.length > 0 && (
                                <span className="text-xs text-slate-500 bg-slate-800/60 px-3 py-1 rounded-full border border-slate-700/50">
                                    {examRequests.length} total
                                </span>
                            )}
                        </div>

                        {/* Rows */}
                        {examRequestsLoading ? (
                            <div className="flex items-center gap-3 py-6 justify-center text-slate-400">
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-cyan-400" />
                                <span className="text-sm">Carregando…</span>
                            </div>
                        ) : examRequests.length > 0 ? (
                            <div className="divide-y divide-slate-700/40">
                                {pagedExams.map((req, idx) => {
                                    const st = statusConfig[req.status] || statusConfig.draft
                                    const isExpanded = expandedExamId === req.id
                                    const preview = req.content.split('\n')[0].substring(0, 80)
                                    return (
                                        <div key={req.id}>
                                            {/* Collapsed row — clickable */}
                                            <div
                                                className="px-5 py-3 flex items-center gap-3 cursor-pointer hover:bg-slate-800/40 transition-colors"
                                                onClick={() => setExpandedExamId(isExpanded ? null : req.id)}
                                            >
                                                <span className="w-6 h-6 rounded bg-cyan-500/10 flex items-center justify-center text-cyan-400 text-xs font-bold border border-cyan-500/20 flex-shrink-0">
                                                    {(safeExamPage - 1) * EXAM_PAGE_SIZE + idx + 1}
                                                </span>
                                                <p className="text-sm text-slate-200 font-medium truncate flex-1">{preview}{req.content.length > 80 ? '…' : ''}</p>
                                                <span className="text-[11px] text-slate-500 whitespace-nowrap hidden sm:inline">{new Date(req.created_at).toLocaleDateString('pt-BR')}</span>
                                                <div className={`flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full border ${st.color} ${st.bg} border-current/20 whitespace-nowrap`}>
                                                    <span className={`w-1.5 h-1.5 rounded-full ${st.dot}`} />
                                                    <span className="font-medium">{st.label}</span>
                                                </div>
                                                <ChevronDown className={`w-4 h-4 text-slate-500 transition-transform flex-shrink-0 ${isExpanded ? 'rotate-180' : ''}`} />
                                            </div>

                                            {/* Expanded content */}
                                            {isExpanded && (
                                                <div className="px-5 pb-4 pt-1 bg-slate-900/40 border-t border-slate-700/30">
                                                    <pre className="text-sm text-slate-300 whitespace-pre-wrap leading-relaxed font-sans max-h-64 overflow-y-auto custom-scrollbar">{req.content}</pre>
                                                    <div className="mt-3 flex items-center gap-2">
                                                        <button
                                                            onClick={(e) => { e.stopPropagation(); handlePrintExam(req.content) }}
                                                            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-200 bg-slate-800 hover:bg-slate-700 border border-slate-600/50 rounded-lg transition-colors"
                                                        >
                                                            <Printer className="w-3.5 h-3.5" /> Imprimir
                                                        </button>
                                                        <button
                                                            onClick={(e) => { e.stopPropagation(); handleShareWhatsApp(req.content) }}
                                                            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[#25D366] bg-[#25D366]/10 hover:bg-[#25D366]/20 border border-[#25D366]/20 rounded-lg transition-colors"
                                                        >
                                                            <Send className="w-3.5 h-3.5" /> WhatsApp
                                                        </button>
                                                        <span className="text-[11px] text-slate-500 ml-auto">
                                                            {new Date(req.created_at).toLocaleDateString('pt-BR')} às {new Date(req.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                                                        </span>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    )
                                })}
                            </div>
                        ) : (
                            <div className="text-center py-8">
                                <FlaskConical className="w-8 h-8 text-cyan-400 opacity-30 mx-auto mb-3" />
                                <p className="text-sm text-slate-400">Nenhuma solicitação de exame encontrada</p>
                            </div>
                        )}

                        {/* Pagination */}
                        {examTotalPages > 1 && (
                            <div className="px-5 py-3 border-t border-slate-700/50 flex items-center justify-between bg-slate-900/20">
                                <button
                                    type="button"
                                    className="px-3 py-1.5 rounded-lg border border-slate-700/60 bg-slate-900/40 text-slate-200 text-sm hover:bg-slate-800/50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                                    onClick={() => setExamPage(p => Math.max(1, p - 1))}
                                    disabled={safeExamPage <= 1}
                                >
                                    ← Anterior
                                </button>
                                <span className="text-xs text-slate-400">
                                    <span className="text-slate-200 font-medium">{safeExamPage}</span> / <span className="text-slate-200 font-medium">{examTotalPages}</span>
                                </span>
                                <button
                                    type="button"
                                    className="px-3 py-1.5 rounded-lg border border-slate-700/60 bg-slate-900/40 text-slate-200 text-sm hover:bg-slate-800/50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                                    onClick={() => setExamPage(p => Math.min(examTotalPages, p + 1))}
                                    disabled={safeExamPage >= examTotalPages}
                                >
                                    Próxima →
                                </button>
                            </div>
                        )}
                    </div>
                )
            })()}

            {/* Doctor Select Modal */}
            {showDoctorSelect && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => setShowDoctorSelect(false)}>
                    <div className="w-full max-w-md bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden p-6" onClick={e => e.stopPropagation()}>
                        <h3 className="text-xl font-bold text-white mb-2">Compartilhar com Médico</h3>
                        <p className="text-slate-400 text-sm mb-6">Selecione os profissionais com quem deseja compartilhar seus dados clínicos.</p>

                        <div className="space-y-3 mb-6 max-h-60 overflow-y-auto custom-scrollbar">
                            {doctors.length === 0 ? (
                                <p className="text-slate-500 text-center py-4">Nenhum profissional encontrado.</p>
                            ) : (
                                doctors.map((doc) => (
                                    <div key={doc.id}
                                        onClick={() => {
                                            if (selectedDoctors.includes(doc.id)) {
                                                setSelectedDoctors(selectedDoctors.filter(id => id !== doc.id))
                                            } else {
                                                setSelectedDoctors([...selectedDoctors, doc.id])
                                            }
                                        }}
                                        className={`p-3 rounded-lg border cursor-pointer transition-all flex items-center gap-4 ${selectedDoctors.includes(doc.id) ? 'bg-emerald-500/10 border-emerald-500/50' : 'bg-slate-800/50 border-slate-700 hover:border-slate-600'}`}
                                    >
                                        <div className={`w-5 h-5 rounded border flex items-center justify-center ${selectedDoctors.includes(doc.id) ? 'bg-emerald-500 border-emerald-500' : 'border-slate-500'}`}>
                                            {selectedDoctors.includes(doc.id) && <Check className="w-3 h-3 text-white" />}
                                        </div>
                                        <div className="flex-1">
                                            <p className="text-white font-medium">{doc.name}</p>
                                            <p className="text-xs text-slate-400 uppercase tracking-wider">{doc.specialty}</p>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>

                        <div className="flex justify-end gap-3">
                            <button onClick={() => setShowDoctorSelect(false)} className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium transition-colors text-sm">
                                Cancelar
                            </button>
                            <button
                                onClick={handleShareReport}
                                disabled={selectedDoctors.length === 0 || sendingShare}
                                className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium transition-colors text-sm flex items-center gap-2"
                            >
                                {sendingShare ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <FileText className="w-4 h-4" />}
                                Compartilhar
                            </button>
                        </div>
                    </div>
                </div>
            )}


            {/* Report Details Modal */}
            {selectedReport && (() => {
                const modalPayload = getAecReportModalPayload(selectedReport.content as any)
                return (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => setSelectedReport(null)}>
                    <div className="w-full max-w-2xl bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden max-h-[85vh] flex flex-col animate-in fade-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
                        {/* Header */}
                        <div className="p-5 border-b border-slate-700 flex justify-between items-center bg-slate-800/50">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
                                    <FileText className="w-5 h-5 text-emerald-400" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-white">Relatório Clínico</h3>
                                    <p className="text-xs text-slate-400">
                                        {new Date(selectedReport.generated_at).toLocaleDateString()} às {new Date(selectedReport.generated_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </p>
                                </div>
                            </div>
                            <button onClick={() => setSelectedReport(null)} className="p-2 hover:bg-slate-700 rounded-full transition-colors text-slate-400 hover:text-white">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Content Scrollable */}
                        <div className="p-6 overflow-y-auto space-y-6 custom-scrollbar flex-1">
                            <div className="space-y-2">
                                <h4 className="text-sm font-medium text-emerald-400 uppercase tracking-wider">Queixa Principal</h4>
                                <p className="text-white bg-slate-800/50 p-3 rounded-lg border border-slate-700/50 leading-relaxed">
                                    {modalPayload.mainComplaint || 'Não especificada'}
                                </p>
                            </div>

                            <div className="space-y-2">
                                <h4 className="text-sm font-medium text-blue-400 uppercase tracking-wider">Histórico Clínico</h4>
                                <p className="text-slate-300 bg-slate-800/30 p-3 rounded-lg border border-slate-700/30 leading-relaxed text-sm whitespace-pre-wrap">
                                    {modalPayload.historyText || 'Nenhum histórico registrado.'}
                                </p>
                            </div>

                            <div className="space-y-3">
                                <h4 className="text-sm font-medium text-amber-400 uppercase tracking-wider">Investigação detalhada</h4>
                                <div className="grid gap-2">
                                    {modalPayload.investigationItems.length === 0 ? (
                                        <p className="text-sm text-slate-500 bg-slate-800/20 p-3 rounded-lg border border-slate-700/20">
                                            Nenhum bloco adicional (lista indiciária, perguntas objetivas ou recomendações) neste relatório.
                                        </p>
                                    ) : (
                                        modalPayload.investigationItems.map((rec, idx) => (
                                        <div key={idx} className="flex gap-3 items-start p-3 rounded-lg bg-amber-500/5 border border-amber-500/10">
                                            <span className="text-xs font-bold text-amber-500 mt-0.5">{idx + 1}</span>
                                            <p className="text-sm text-slate-300 whitespace-pre-wrap break-words">{rec}</p>
                                        </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Footer Actions */}
                        <div className="p-4 border-t border-slate-700 bg-slate-800/50 flex justify-end gap-3">
                            <button
                                onClick={() => handleCopyReport(selectedReport.content)}
                                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-700 hover:bg-slate-600 text-white font-medium transition-colors text-sm"
                            >
                                {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                                {copied ? 'Copiado!' : 'Copiar Texto'}
                            </button>
                            <button onClick={() => setSelectedReport(null)} className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-medium transition-colors text-sm">
                                Fechar
                            </button>
                        </div>
                    </div>
                </div>
                )
            })()}
        </div>
    )
}

export default PatientAnalytics
