/**
 * V1.9.312 — System Activity Timeline (admin observability)
 *
 * Timeline cronológica unificada do sistema. "Radar empírico" do que tá
 * acontecendo: AECs ativas, prescrições emitidas, NFTs liberados, incidents,
 * cadastros, logins, riscos.
 *
 * Filosofia (Pedro 16/05): pré-PMF com 45 users / 2-5 ativos/dia, "sentir o
 * pulso do sistema" > "investigar caso individual". Drill-down (A) parqueado.
 *
 * Fontes (Promise.all, sem migration):
 * - get_recent_audit_logs RPC → ai_chat_interactions com risk_level
 * - noa_logs (eventos AEC, phases, interaction_type)
 * - cfm_prescriptions signed (atos clínicos médicos)
 *
 * Cores por ESTADO (Clinical Cockpit Mode, não por feature):
 * - error/risk HIGH → vermelho
 * - warning → âmbar
 * - success (ICP/prescrição/NFT) → emerald
 * - neutro → slate
 * - AEC normal → azul discreto
 */
import { useEffect, useMemo, useState } from 'react'
import {
    Activity, FileText, Brain, AlertTriangle, CheckCircle2,
    UserPlus, Sparkles, Stethoscope, Shield, Loader2, RefreshCw, Filter
} from 'lucide-react'
import { supabase } from '../lib/supabase'

type TimelineState = 'error' | 'warning' | 'success' | 'info' | 'neutral'
type TimelineModule = 'clinic' | 'system' | 'risk'

interface TimelineEvent {
    id: string
    ts: string // ISO
    actor_name: string
    action_label: string
    target?: string | null
    state: TimelineState
    module: TimelineModule
    icon: typeof Activity
}

type FilterId = 'all' | 'clinic' | 'system' | 'risk'

const REFRESH_INTERVAL_MS = 30_000
const TIMELINE_LIMIT = 30

// Mapa cor por ESTADO (Clinical Cockpit Mode aplicado à timeline)
const STATE_STYLES: Record<TimelineState, { icon: string; bg: string; border: string; text: string }> = {
    error: { icon: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/30', text: 'text-red-300' },
    warning: { icon: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/30', text: 'text-amber-300' },
    success: { icon: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/30', text: 'text-emerald-300' },
    info: { icon: 'text-blue-400', bg: 'bg-blue-500/5', border: 'border-blue-500/20', text: 'text-blue-300' },
    neutral: { icon: 'text-slate-400', bg: 'bg-slate-800/40', border: 'border-slate-700/50', text: 'text-slate-300' },
}

const FILTERS: { id: FilterId; label: string }[] = [
    { id: 'all', label: 'Todos' },
    { id: 'clinic', label: 'Clínico' },
    { id: 'system', label: 'Sistema' },
    { id: 'risk', label: 'Risco' },
]

function formatTime(iso: string): string {
    try {
        return new Date(iso).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
    } catch { return '—' }
}

function formatRelative(iso: string): string {
    const diffMs = Date.now() - new Date(iso).getTime()
    const min = Math.floor(diffMs / 60_000)
    if (min < 1) return 'agora'
    if (min < 60) return `${min}min atrás`
    const h = Math.floor(min / 60)
    if (h < 24) return `${h}h atrás`
    const d = Math.floor(h / 24)
    return `${d}d atrás`
}

/**
 * Mapeia ai_chat_interactions com risk_level pra TimelineEvent.
 * Risk HIGH/CRITICAL → error (vermelho). Outros → info (azul).
 */
function mapAuditLogToEvent(row: any): TimelineEvent {
    const isHighRisk = row.incident_flag === true || ['high', 'critical'].includes(row.risk_level)
    const state: TimelineState = isHighRisk ? 'error' : 'info'
    const module: TimelineModule = isHighRisk ? 'risk' : 'clinic'
    return {
        id: `audit-${row.created_at}-${(row.patient_masked || 'x').slice(0, 8)}`,
        ts: row.created_at,
        actor_name: row.patient_masked || 'Usuário',
        action_label: isHighRisk
            ? `Interação flagada (risco ${row.risk_level})`
            : `Interação clínica · ${row.domain || 'geral'}`,
        target: row.user_message ? `"${String(row.user_message).slice(0, 60)}${row.user_message.length > 60 ? '…' : ''}"` : null,
        state,
        module,
        icon: isHighRisk ? AlertTriangle : Brain,
    }
}

/**
 * Mapeia noa_logs pra TimelineEvent. Foco em eventos significativos
 * (phase transitions, interaction_type semântico).
 */
function mapNoaLogToEvent(row: any): TimelineEvent {
    const phase = row.payload?.phase
    const evtType = row.interaction_type
    const userName = row.users?.name || 'Usuário'

    // AEC fases conhecidas → info azul
    if (phase || evtType?.startsWith('aec_') || evtType?.startsWith('phase_')) {
        return {
            id: `noa-${row.id}`,
            ts: row.created_at,
            actor_name: userName,
            action_label: phase ? `AEC fase ${phase}` : `Evento ${evtType}`,
            target: null,
            state: 'info',
            module: 'clinic',
            icon: Activity,
        }
    }

    return {
        id: `noa-${row.id}`,
        ts: row.created_at,
        actor_name: userName,
        action_label: evtType || 'Interação',
        target: null,
        state: 'neutral',
        module: 'clinic',
        icon: Brain,
    }
}

/**
 * Mapeia cfm_prescriptions signed pra TimelineEvent. Ato clínico médico
 * (assinatura ICP-Brasil) = success emerald.
 */
function mapPrescriptionToEvent(row: any): TimelineEvent {
    return {
        id: `presc-${row.id}`,
        ts: row.signature_timestamp || row.created_at,
        actor_name: row.professional_name || 'Médico',
        action_label: 'Emitiu prescrição assinada (ICP-Brasil)',
        target: row.patient_name ? `para ${row.patient_name}` : null,
        state: 'success',
        module: 'clinic',
        icon: Stethoscope,
    }
}

export default function SystemActivityTimeline() {
    const [events, setEvents] = useState<TimelineEvent[]>([])
    const [loading, setLoading] = useState(true)
    const [filter, setFilter] = useState<FilterId>('all')
    const [lastRefresh, setLastRefresh] = useState<Date>(new Date())

    const fetchTimeline = async () => {
        setLoading(true)
        try {
            const sb = supabase as any
            const [auditRes, noaRes, prescRes] = await Promise.all([
                sb.rpc('get_recent_audit_logs', { p_limit: 15 }),
                // V1.9.312: filtrar user_id IS NOT NULL — exclui cron sweeps
                // (video_call_reminders_sweep, pg_cron jobs) que não têm actor humano.
                // Smoke empírico mostrou 5/5 últimos eventos eram sweep sem user.
                sb.from('noa_logs')
                    .select('id, created_at, user_id, interaction_type, payload, users:user_id(name)')
                    .not('user_id', 'is', null)
                    .order('created_at', { ascending: false })
                    .limit(15),
                sb.from('cfm_prescriptions')
                    .select('id, professional_name, patient_name, signature_timestamp, created_at, status')
                    .eq('status', 'signed')
                    .order('signature_timestamp', { ascending: false, nullsFirst: false })
                    .limit(10),
            ])

            const all: TimelineEvent[] = []
            if (!auditRes.error && Array.isArray(auditRes.data)) {
                all.push(...auditRes.data.map(mapAuditLogToEvent))
            }
            if (!noaRes.error && Array.isArray(noaRes.data)) {
                all.push(...noaRes.data.map(mapNoaLogToEvent))
            }
            if (!prescRes.error && Array.isArray(prescRes.data)) {
                all.push(...prescRes.data.map(mapPrescriptionToEvent))
            }

            // Sort cronológico DESC + cap em TIMELINE_LIMIT
            all.sort((a, b) => new Date(b.ts).getTime() - new Date(a.ts).getTime())
            setEvents(all.slice(0, TIMELINE_LIMIT))
            setLastRefresh(new Date())
        } catch (err) {
            console.error('[SystemActivityTimeline] erro:', err)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        void fetchTimeline()
        const interval = setInterval(() => void fetchTimeline(), REFRESH_INTERVAL_MS)
        return () => clearInterval(interval)
    }, [])

    const filteredEvents = useMemo(() => {
        if (filter === 'all') return events
        return events.filter(e => e.module === filter)
    }, [events, filter])

    return (
        <div className="bg-slate-900/60 border border-slate-700/50 rounded-2xl overflow-hidden">
            {/* Header */}
            <div className="p-4 md:p-6 border-b border-slate-700/50 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                <div className="flex items-center gap-3">
                    <div className="h-8 w-1 bg-emerald-500 rounded-full"></div>
                    <h3 className="text-base md:text-xl font-bold text-white">Atividade Recente do Sistema</h3>
                    <span className="px-2 py-0.5 bg-slate-800 rounded text-[10px] text-slate-500 font-mono">
                        SYNC: {lastRefresh.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    </span>
                </div>
                <div className="flex items-center gap-2">
                    {/* Filtros — 4 estados (Pedro 16/05 GPT review) */}
                    <div className="flex items-center gap-1 p-1 rounded-lg bg-slate-800/60 border border-slate-700">
                        <Filter className="w-3.5 h-3.5 text-slate-500 ml-1 mr-0.5" />
                        {FILTERS.map(f => (
                            <button
                                key={f.id}
                                onClick={() => setFilter(f.id)}
                                className={`px-2.5 py-1 rounded text-[11px] font-semibold transition-colors ${
                                    filter === f.id
                                        ? 'bg-emerald-500/20 text-emerald-300'
                                        : 'text-slate-400 hover:text-slate-200'
                                }`}
                            >
                                {f.label}
                            </button>
                        ))}
                    </div>
                    <button
                        onClick={() => void fetchTimeline()}
                        disabled={loading}
                        className="p-1.5 rounded-lg bg-slate-800/60 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors disabled:opacity-50"
                        title="Atualizar agora"
                    >
                        <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                    </button>
                </div>
            </div>

            {/* Body */}
            <div className="p-4 md:p-6 max-h-[600px] overflow-y-auto">
                {loading && events.length === 0 ? (
                    <div className="flex items-center justify-center py-12">
                        <Loader2 className="w-5 h-5 text-emerald-400 animate-spin" />
                    </div>
                ) : filteredEvents.length === 0 ? (
                    <div className="text-center py-12 text-slate-500 text-sm">
                        Nenhum evento {filter !== 'all' ? `no filtro "${FILTERS.find(f => f.id === filter)?.label}"` : 'recente'}.
                    </div>
                ) : (
                    <ol className="relative border-l border-slate-700/50 ml-2 space-y-3">
                        {filteredEvents.map(ev => {
                            const s = STATE_STYLES[ev.state]
                            const Icon = ev.icon
                            return (
                                <li key={ev.id} className="ml-4">
                                    <span className={`absolute -left-[7px] flex h-3.5 w-3.5 items-center justify-center rounded-full ring-4 ring-slate-900 ${s.bg} border ${s.border}`}>
                                        <span className={`w-1.5 h-1.5 rounded-full ${s.icon.replace('text-', 'bg-')}`}></span>
                                    </span>
                                    <div className={`p-2.5 rounded-lg ${s.bg} border ${s.border}`}>
                                        <div className="flex items-start gap-2">
                                            <Icon className={`w-3.5 h-3.5 flex-shrink-0 mt-0.5 ${s.icon}`} />
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-baseline justify-between gap-2 flex-wrap">
                                                    <span className="text-xs text-white font-semibold truncate">
                                                        <span className="font-mono text-slate-500 mr-2">{formatTime(ev.ts)}</span>
                                                        {ev.actor_name}
                                                    </span>
                                                    <span className="text-[10px] text-slate-500" title={new Date(ev.ts).toLocaleString('pt-BR')}>
                                                        {formatRelative(ev.ts)}
                                                    </span>
                                                </div>
                                                <div className={`text-[11px] mt-0.5 ${s.text}`}>
                                                    {ev.action_label}
                                                    {ev.target && <span className="text-slate-400 ml-1">{ev.target}</span>}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </li>
                            )
                        })}
                    </ol>
                )}
            </div>

            {/* Footer info */}
            <div className="px-4 md:px-6 py-2 border-t border-slate-700/50 bg-slate-900/40">
                <p className="text-[10px] text-slate-500">
                    Últimos {events.length} eventos · Auto-refresh 30s · Fontes: noa_logs · ai_chat_interactions · cfm_prescriptions
                </p>
            </div>
        </div>
    )
}
