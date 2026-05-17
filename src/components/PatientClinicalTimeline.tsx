/**
 * V1.9.327 — PatientClinicalTimeline
 *
 * Substitui placeholder "Nenhum gráfico disponível" da aba Gráficos do prontuário.
 * Pedro aprovou opção B (17/05): timeline narrativa mensal, sem chart lib nova,
 * derivada dos dados já existentes.
 *
 * Princípio: comunicar continuidade clínica + densidade temporal antes de sofisticar
 * com gráficos quantitativos. Pré-PMF a pergunta clínica relevante é "o que aconteceu
 * com esse paciente nos últimos meses?", não "qual a curva de eGFR ao longo do tempo".
 *
 * Quando trigger futuro ativar (eGFR longitudinal / scores AEC múltiplos), trocar B→A
 * vira só problema de rendering — semântica temporal já modelada aqui.
 *
 * Sem dependências novas. Tailwind puro + lucide icons.
 */
import { useEffect, useMemo, useState } from 'react'
import { supabase } from '../lib/supabase'
import {
    FileText, Pill, Calendar, FlaskConical, TrendingUp,
    Loader2, Activity, Sparkles
} from 'lucide-react'

interface Props {
    patientId: string
}

interface MonthBucket {
    month: string // YYYY-MM-01 ISO
    monthLabel: string // "Março 2026"
    reports: number
    reportsSigned: number
    prescriptions: number
    appointments: number
    examRequests: number
    examsSigned: number
    total: number
    lastEventAt: string | null
    lastEventType: string | null
}

const MONTH_PT = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
                  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro']

function monthKey(iso: string): string {
    const d = new Date(iso)
    return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-01`
}

function monthLabel(monthIso: string): string {
    const d = new Date(monthIso)
    return `${MONTH_PT[d.getUTCMonth()]} ${d.getUTCFullYear()}`
}

export default function PatientClinicalTimeline({ patientId }: Props) {
    const [buckets, setBuckets] = useState<MonthBucket[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        if (!patientId) return
        let cancelled = false

        const load = async () => {
            setLoading(true)
            setError(null)
            const sb = supabase as any

            try {
                const [reportsR, presR, appR, examR] = await Promise.all([
                    sb.from('clinical_reports')
                        .select('created_at, signed_at')
                        .eq('patient_id', patientId),
                    sb.from('cfm_prescriptions')
                        .select('created_at')
                        .eq('patient_id', patientId),
                    sb.from('appointments')
                        .select('appointment_date, created_at, status')
                        .eq('patient_id', patientId),
                    sb.from('patient_exam_requests')
                        .select('created_at, status')
                        .eq('patient_id', patientId),
                ])

                if (cancelled) return

                const map = new Map<string, MonthBucket>()
                const touch = (iso: string): MonthBucket => {
                    const k = monthKey(iso)
                    let b = map.get(k)
                    if (!b) {
                        b = {
                            month: k,
                            monthLabel: monthLabel(k),
                            reports: 0, reportsSigned: 0,
                            prescriptions: 0, appointments: 0,
                            examRequests: 0, examsSigned: 0,
                            total: 0, lastEventAt: null, lastEventType: null,
                        }
                        map.set(k, b)
                    }
                    return b
                }
                const bumpLast = (b: MonthBucket, iso: string, type: string) => {
                    if (!b.lastEventAt || new Date(iso) > new Date(b.lastEventAt)) {
                        b.lastEventAt = iso
                        b.lastEventType = type
                    }
                }

                ;(reportsR.data || []).forEach((r: any) => {
                    if (!r.created_at) return
                    const b = touch(r.created_at)
                    b.reports += 1
                    b.total += 1
                    if (r.signed_at) b.reportsSigned += 1
                    bumpLast(b, r.created_at, 'Relatório clínico')
                })

                ;(presR.data || []).forEach((p: any) => {
                    if (!p.created_at) return
                    const b = touch(p.created_at)
                    b.prescriptions += 1
                    b.total += 1
                    bumpLast(b, p.created_at, 'Prescrição')
                })

                ;(appR.data || []).forEach((a: any) => {
                    const iso = a.appointment_date || a.created_at
                    if (!iso) return
                    const b = touch(iso)
                    b.appointments += 1
                    b.total += 1
                    bumpLast(b, iso, a.status === 'completed' ? 'Consulta realizada' : 'Consulta agendada')
                })

                ;(examR.data || []).forEach((e: any) => {
                    if (!e.created_at) return
                    const b = touch(e.created_at)
                    b.examRequests += 1
                    b.total += 1
                    if (e.status === 'signed') b.examsSigned += 1
                    bumpLast(b, e.created_at, 'Solicitação de exame')
                })

                const sorted = Array.from(map.values()).sort((a, b) =>
                    a.month < b.month ? 1 : -1 // desc, mais recente primeiro
                )
                setBuckets(sorted)
            } catch (e: any) {
                console.error('[PatientClinicalTimeline]', e)
                setError(e?.message || 'Erro ao carregar timeline')
            } finally {
                if (!cancelled) setLoading(false)
            }
        }

        void load()
        return () => { cancelled = true }
    }, [patientId])

    const stats = useMemo(() => {
        const max = buckets.reduce((m, b) => Math.max(m, b.total), 0)
        const totalEvents = buckets.reduce((s, b) => s + b.total, 0)
        const peakBucket = buckets.find(b => b.total === max && max > 0)
        return { max, totalEvents, peakBucket }
    }, [buckets])

    if (loading) {
        return (
            <div className="flex items-center justify-center py-16">
                <Loader2 className="w-6 h-6 text-cyan-400 animate-spin" />
            </div>
        )
    }

    if (error) {
        return (
            <div className="text-center py-12 text-slate-400">
                <p className="text-sm">Erro ao carregar timeline: {error}</p>
            </div>
        )
    }

    if (buckets.length === 0) {
        return (
            <div className="text-center py-12 px-6 bg-gradient-to-br from-slate-900/40 to-slate-800/20 rounded-2xl border border-slate-800">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center">
                    <Activity className="w-7 h-7 text-cyan-300/70" />
                </div>
                <h3 className="text-base font-bold text-white mb-2">Sem histórico clínico ainda</h3>
                <p className="text-sm text-slate-400 max-w-md mx-auto leading-relaxed">
                    A linha do tempo aparecerá conforme atendimentos, prescrições e exames forem registrados.
                </p>
            </div>
        )
    }

    return (
        <div className="space-y-4">
            {/* Header com stats agregadas */}
            <div className="flex flex-wrap items-center justify-between gap-3 mb-2">
                <div>
                    <h3 className="text-base font-semibold text-white flex items-center gap-2">
                        <Activity className="w-4 h-4 text-cyan-400" />
                        Linha do tempo clínica
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                        {stats.totalEvents} {stats.totalEvents === 1 ? 'evento' : 'eventos'} em {buckets.length} {buckets.length === 1 ? 'mês' : 'meses'} de acompanhamento
                    </p>
                </div>
                {stats.peakBucket && (
                    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-xs text-amber-300">
                        <TrendingUp className="w-3.5 h-3.5" />
                        Pico em {stats.peakBucket.monthLabel}
                    </div>
                )}
            </div>

            {/* Cards mensais */}
            <div className="space-y-3">
                {buckets.map((b, idx) => {
                    const isPeak = stats.peakBucket?.month === b.month && b.total > 0
                    const densityPct = stats.max > 0 ? (b.total / stats.max) * 100 : 0
                    return (
                        <div
                            key={b.month}
                            className={`rounded-xl border p-4 transition-colors ${
                                isPeak
                                    ? 'bg-gradient-to-br from-amber-500/5 to-slate-900/40 border-amber-500/30'
                                    : 'bg-slate-900/40 border-slate-700/50 hover:border-slate-600'
                            }`}
                        >
                            {/* Header do mês */}
                            <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center gap-2">
                                    <h4 className={`text-sm font-bold ${isPeak ? 'text-amber-200' : 'text-white'}`}>
                                        {b.monthLabel}
                                    </h4>
                                    {isPeak && (
                                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/20 border border-amber-500/40 text-[10px] font-semibold text-amber-200">
                                            <Sparkles className="w-2.5 h-2.5" /> Pico de atividade
                                        </span>
                                    )}
                                    {idx === 0 && !isPeak && (
                                        <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-[10px] font-semibold text-cyan-300">
                                            Mais recente
                                        </span>
                                    )}
                                </div>
                                <span className="text-xs font-mono text-slate-500">
                                    {b.total} {b.total === 1 ? 'evento' : 'eventos'}
                                </span>
                            </div>

                            {/* Barra densidade (proporcional ao pico) */}
                            <div className="h-1.5 rounded-full bg-slate-800/60 overflow-hidden mb-3">
                                <div
                                    className={`h-full rounded-full transition-all ${
                                        isPeak ? 'bg-amber-400/60' : 'bg-cyan-500/40'
                                    }`}
                                    style={{ width: `${densityPct}%` }}
                                />
                            </div>

                            {/* Contadores granulares */}
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-3">
                                {b.reports > 0 && (
                                    <Counter
                                        icon={FileText}
                                        label="Relatórios"
                                        value={b.reports}
                                        subtitle={b.reportsSigned > 0 ? `${b.reportsSigned} assinados` : undefined}
                                        color="text-emerald-300"
                                    />
                                )}
                                {b.prescriptions > 0 && (
                                    <Counter
                                        icon={Pill}
                                        label="Prescrições"
                                        value={b.prescriptions}
                                        color="text-pink-300"
                                    />
                                )}
                                {b.appointments > 0 && (
                                    <Counter
                                        icon={Calendar}
                                        label="Consultas"
                                        value={b.appointments}
                                        color="text-blue-300"
                                    />
                                )}
                                {b.examRequests > 0 && (
                                    <Counter
                                        icon={FlaskConical}
                                        label="Exames"
                                        value={b.examRequests}
                                        subtitle={b.examsSigned > 0 ? `${b.examsSigned} assinados` : undefined}
                                        color="text-cyan-300"
                                    />
                                )}
                            </div>

                            {/* Último evento do mês */}
                            {b.lastEventAt && b.lastEventType && (
                                <p className="text-[11px] text-slate-400">
                                    Último evento: <span className="text-slate-200 font-medium">{b.lastEventType}</span>
                                    <span className="text-slate-500"> · {new Date(b.lastEventAt).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}</span>
                                </p>
                            )}
                        </div>
                    )
                })}
            </div>

            {/* Nota arquitetural visível ao médico — fim do escopo atual */}
            <div className="mt-4 p-3 rounded-lg bg-slate-800/30 border border-slate-700/40">
                <p className="text-[11px] text-slate-400 leading-relaxed">
                    Visualização baseada em eventos clínicos registrados. Gráficos quantitativos (evolução de scores, função renal, etc.)
                    serão habilitados conforme acumular série longitudinal suficiente.
                </p>
            </div>
        </div>
    )
}

function Counter({ icon: Icon, label, value, subtitle, color }: {
    icon: typeof FileText
    label: string
    value: number
    subtitle?: string
    color: string
}) {
    return (
        <div className="flex items-start gap-2 p-2 rounded-lg bg-slate-800/40 border border-slate-700/40">
            <Icon className={`w-3.5 h-3.5 mt-0.5 flex-shrink-0 ${color}`} />
            <div className="min-w-0">
                <p className="text-xs font-bold text-white leading-tight">{value} <span className="text-[10px] font-normal text-slate-400">{label.toLowerCase()}</span></p>
                {subtitle && <p className="text-[10px] text-slate-500 mt-0.5">{subtitle}</p>}
            </div>
        </div>
    )
}
