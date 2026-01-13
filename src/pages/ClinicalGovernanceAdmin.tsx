/**
 * Clinical Governance (ACDSS) - Premium Dashboard
 * Versão Master: Multi-eixo e Auditoria em Tempo Real
 */

import { useState, useEffect } from 'react'
import {
    Brain,
    TrendingUp,
    AlertTriangle,
    CheckCircle,
    RefreshCw,
    ShieldCheck,
    Activity,
    Database,
    Zap,
    LayoutGrid,
    Droplet,
    Leaf,
    User,
    Eye,
    MessageSquare,
    X,
    Bell
} from 'lucide-react'
import { supabase } from '../lib/supabase'
import { notificationService } from '../services/notificationService'

type Domain = 'todos' | 'cannabis' | 'nefrologia'

interface AuditLog {
    created_at: string
    patient_id: string
    patient_masked: string
    domain: string
    risk_level: string
    incident_flag: boolean
    ai_response?: string
    user_message?: string
}

interface ClinicalGovernanceAdminProps {
    onAssumirChat?: (patientId: string) => void
}

export default function ClinicalGovernanceAdmin({ onAssumirChat }: ClinicalGovernanceAdminProps) {
    const [stats, setStats] = useState({
        total: 0,
        alerts: 0,
        stable: 0,
        successRate: 0
    })
    const [logs, setLogs] = useState<AuditLog[]>([])
    const [loading, setLoading] = useState(true)
    const [activeDomain, setActiveDomain] = useState<Domain>('todos')
    const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null)
    const [isIntervening, setIsIntervening] = useState(false)

    const fetchData = async (domain: Domain = activeDomain) => {
        setLoading(true)
        try {
            // Stats
            const { data: statsData, error: statsError } = await supabase.rpc('get_ac_dss_stats', { p_domain: domain })
            if (statsError) throw statsError

            if (statsData && statsData.length > 0) {
                setStats({
                    total: statsData[0].total_analyses,
                    alerts: statsData[0].active_alerts,
                    stable: statsData[0].stable_patients,
                    successRate: statsData[0].success_rate
                })
            }

            // Audit Logs
            const { data: logsData, error: logsError } = await supabase.rpc('get_recent_audit_logs', { p_limit: 10 })
            if (!logsError && logsData) {
                setLogs(logsData)
            }
        } catch (error) {
            console.error('Erro ao buscar dados ACDSS:', error)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchData(activeDomain)
    }, [activeDomain])

    const handleIntervene = async (log: AuditLog) => {
        if (!log.patient_id) return
        setIsIntervening(true)
        try {
            await notificationService.createNotification({
                user_id: log.patient_id,
                title: '📌 Intervenção Clínica Necessária',
                message: 'Um profissional de saúde solicitou contato direto após análise da sua interação com a IA Nôa.',
                type: 'clinical',
                is_read: false,
                action_url: `/app/patient/chat`
            })
            alert('Notificação de intervenção enviada ao paciente.')
        } catch (error) {
            console.error('Erro ao intervir:', error)
        } finally {
            setIsIntervening(false)
        }
    }

    const domains = [
        { id: 'todos', label: 'Visão Global', icon: LayoutGrid, color: 'text-slate-400', bg: 'bg-slate-800/40' },
        { id: 'cannabis', label: 'Cannabis Medicinal', icon: Leaf, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
        { id: 'nefrologia', label: 'Eixo Nefrologia', icon: Droplet, color: 'text-blue-400', bg: 'bg-blue-500/10' },
    ]

    return (
        <div className="p-8 max-w-7xl mx-auto min-h-screen">
            {/* Header */}
            <div className="mb-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-purple-500/20 rounded-lg">
                            <Brain className="w-8 h-8 text-purple-400" />
                        </div>
                        <h1 className="text-3xl font-extrabold text-white tracking-tight">Governance <span className="text-purple-400">Core</span></h1>
                    </div>
                    <div className="flex items-center gap-4 mt-2">
                        <span className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-emerald-400 px-2.5 py-1 bg-emerald-500/10 rounded-full border border-emerald-500/20">
                            <ShieldCheck className="w-3.5 h-3.5" />
                            ACDSS ATIVO
                        </span>
                        <p className="text-slate-400 text-sm">Monitoramento cognitivo e auditoria de segurança clínica.</p>
                    </div>
                </div>

                <div className="flex items-center gap-3 bg-slate-900/40 p-1.5 rounded-2xl border border-slate-700/50 backdrop-blur-sm">
                    {domains.map((d) => (
                        <button
                            key={d.id}
                            onClick={() => setActiveDomain(d.id as Domain)}
                            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-300 ${activeDomain === d.id
                                ? 'bg-slate-700 text-white shadow-lg shadow-black/20 translate-y-[-1px]'
                                : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800/50'
                                }`}
                        >
                            <d.icon className={`w-4 h-4 ${activeDomain === d.id ? d.color : 'text-slate-600'}`} />
                            {d.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
                <StatCard
                    icon={Activity}
                    val={stats.total}
                    label="Interações IA"
                    sub="Volume total de telemetria."
                    color="purple"
                    loading={loading}
                    badge="LIVE"
                />
                <StatCard
                    icon={AlertTriangle}
                    val={stats.alerts}
                    label="Alertas de Risco"
                    sub="Instabilidade detectada."
                    color="red"
                    loading={loading}
                    badge="CRITICAL"
                />
                <StatCard
                    icon={CheckCircle}
                    val={stats.stable}
                    label="Pacientes Estáveis"
                    sub="Em conformidade clínica."
                    color="emerald"
                    loading={loading}
                    badge="SAFE"
                />
                <StatCard
                    icon={TrendingUp}
                    val={`${stats.successRate}%`}
                    label="Confiança Core"
                    sub="Assertividade do modelo."
                    color="blue"
                    loading={loading}
                    badge="MODEL"
                />
            </div>

            {/* Pulse Bar */}
            <div className="bg-slate-900/50 border border-slate-700/30 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-6 mb-10 text-xs text-slate-400">
                <div className="flex items-center gap-6">
                    <div className="flex items-center gap-2">
                        <Database className="w-4 h-4" />
                        <span>Recinto: <span className="text-white">patient_medical_records</span></span>
                    </div>
                    <div className="flex items-center gap-2">
                        <Zap className="w-4 h-4" />
                        <span>Latência: <span className="text-emerald-400">~140ms</span></span>
                    </div>
                </div>
                <button onClick={() => fetchData()} className="flex items-center gap-2 hover:text-white transition-colors">
                    <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                    SINCRONIZAR AGORA
                </button>
            </div>

            {/* Audit Feed */}
            <div className="bg-slate-900/30 border border-slate-700/30 rounded-3xl overflow-hidden mb-10">
                <div className="p-6 border-b border-slate-700/30 flex justify-between items-center">
                    <h3 className="font-bold text-white flex items-center gap-2">
                        <Eye className="w-5 h-5 text-slate-400" />
                        Feed de Auditoria Pseudonimizado
                    </h3>
                    <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">LGPD COMPLIANT</span>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="text-[10px] text-slate-500 uppercase tracking-widest bg-slate-800/20">
                                <th className="px-6 py-4">TimeStamp</th>
                                <th className="px-6 py-4">Paciente</th>
                                <th className="px-6 py-4">Eixo</th>
                                <th className="px-6 py-4">Risco</th>
                                <th className="px-6 py-4 text-right">Auditar</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800">
                            {logs.map((log, i) => (
                                <tr key={i} className="hover:bg-slate-800/40 transition-colors group">
                                    <td className="px-6 py-4 text-xs font-mono text-slate-400">
                                        {new Date(log.created_at).toLocaleTimeString()}
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2">
                                            <div className="w-6 h-6 rounded-full bg-slate-700 flex items-center justify-center text-[10px] font-bold text-white uppercase">
                                                {log.patient_masked.charAt(0)}
                                            </div>
                                            <span className="text-sm font-medium text-slate-200">{log.patient_masked}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${log.domain === 'cannabis' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                                            'bg-blue-500/10 text-blue-400 border-blue-500/20'
                                            }`}>
                                            {log.domain.toUpperCase()}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className={`flex items-center gap-1.5 text-[10px] font-bold ${log.incident_flag ? 'text-red-400' : 'text-emerald-400'}`}>
                                            {log.incident_flag ? <AlertTriangle className="w-3 h-3" /> : <ShieldCheck className="w-3 h-3" />}
                                            {log.risk_level}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <button
                                            onClick={() => setSelectedLog(log)}
                                            className="p-2 hover:bg-slate-700 rounded-lg text-slate-400 hover:text-white transition-all"
                                        >
                                            <Eye className="w-4 h-4" />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Audit Modal */}
            {selectedLog && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
                    <div className="bg-slate-900 border border-slate-700 w-full max-w-2xl rounded-3xl overflow-hidden shadow-2xl">
                        <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-950/50">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-purple-500/20 rounded-lg">
                                    <ShieldCheck className="w-5 h-5 text-purple-400" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-white">Terminal de Auditoria</h3>
                                    <p className="text-xs text-slate-500 font-mono">HASH: {selectedLog.patient_id.slice(0, 8)}</p>
                                </div>
                            </div>
                            <button onClick={() => setSelectedLog(null)} className="p-2 hover:bg-slate-800 rounded-lg text-slate-400">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="p-8 space-y-6">
                            <div className="bg-black/40 rounded-2xl border border-slate-800 p-6 font-mono text-sm leading-relaxed overflow-hidden relative">
                                <div className="flex items-center gap-2 mb-4 text-[10px] text-slate-600 uppercase tracking-widest">
                                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                                    Secure Audit Stream
                                </div>
                                <div className="space-y-4">
                                    <div className="text-slate-400">
                                        <span className="text-emerald-500">USER:</span> {selectedLog.user_message || "Mensagem cifrada..."}
                                    </div>
                                    <div className="text-slate-400">
                                        <span className="text-purple-500">CORE:</span> {selectedLog.ai_response || "Processando descriptografia..."}
                                    </div>
                                </div>
                            </div>

                            <div className="flex flex-col sm:flex-row gap-4">
                                <button
                                    onClick={() => handleIntervene(selectedLog)}
                                    disabled={isIntervening}
                                    className="flex-1 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white font-bold py-4 rounded-2xl flex items-center justify-center gap-3 transition-all"
                                >
                                    {isIntervening ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Bell className="w-5 h-5" />}
                                    NOTIFICAR PACIENTE
                                </button>
                                <button
                                    onClick={() => onAssumirChat?.(selectedLog.patient_id)}
                                    className="flex-1 bg-slate-800 hover:bg-slate-700 text-white font-bold py-4 rounded-2xl flex items-center justify-center gap-3 transition-all transform hover:scale-[1.02]"
                                >
                                    <MessageSquare className="w-5 h-5" />
                                    ASSUMIR CHAT
                                </button>
                            </div>
                            <p className="text-center text-[10px] text-slate-600 uppercase tracking-widest">Ação registrada no sistema de governança</p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

function StatCard({ icon: Icon, val, label, sub, color, loading, badge }: any) {
    const colors: any = {
        purple: 'bg-purple-500/10 text-purple-400',
        red: 'bg-red-500/10 text-red-400',
        emerald: 'bg-emerald-500/10 text-emerald-400',
        blue: 'bg-blue-500/10 text-blue-400',
    }
    return (
        <div className="group bg-slate-800/30 hover:bg-slate-800/40 border border-slate-700/50 rounded-3xl p-6 transition-all duration-300">
            <div className="flex justify-between items-start mb-4">
                <div className={`p-3 rounded-2xl ${colors[color]} group-hover:scale-110 transition-transform`}>
                    <Icon className="w-6 h-6" />
                </div>
                <div className="text-right">
                    <span className="text-3xl font-black text-white">{loading ? '...' : val}</span>
                    <div className={`${colors[color]} text-[10px] font-bold mt-1 uppercase tracking-widest`}>{badge}</div>
                </div>
            </div>
            <h3 className="text-slate-200 font-bold text-sm tracking-tight">{label}</h3>
            <p className="text-slate-500 text-[10px] mt-1 uppercase tracking-widest">{sub}</p>
        </div>
    )
}
