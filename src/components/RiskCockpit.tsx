/**
 * V1.9.532 — Risk Cockpit ELITE escalável (anti-Babylon)
 * ─────────────────────────────────────────────
 * Expande RiskCockpit V1.9.307 (que lia só renal_exams + referral_bonus_cycles)
 * pra 4 categorias usando dados que JÁ EXISTEM (zero migration nova).
 *
 * Categorias:
 *   🩺 A — CLÍNICA GRAVE: DRC G4/G5 + AECs órfãs >30d + AECs ativas >5d
 *   📋 B — COMPLIANCE: system_health_alerts open + prescrições draft >30d
 *   ⚙️  C — OPERACIONAL: cancelamentos 30d + forum pending + órfãos públicos
 *   💰 D — FINANCEIRO (pós-CNPJ): referral bonuses pending
 *
 * Anti-Babylon aplicado:
 *   - Reusa Supabase JS frontend (sem nova Edge/RPC/migration)
 *   - Reusa renal_exams + referral_bonus_cycles existentes
 *   - Promise.all paralelo (latência baixa)
 *   - Loading state granular por categoria
 *   - Locks PBAD/AEC/Pipeline/Matrix Z2 INTOCADOS
 */
import React, { useState, useEffect } from 'react';
import {
    AlertTriangle,
    Stethoscope,
    ShieldAlert,
    Activity,
    DollarSign,
    Users,
    Search,
    ArrowRight,
    Brain,
    Zap,
    FileText,
    CalendarX,
    UserX,
    Inbox,
    Heart,
} from 'lucide-react';
import { supabase } from '../lib/supabase';

interface RiskStats {
    // 🩺 A — CLÍNICA GRAVE
    drcG4G5: number;
    aecOrfasInterrupted30d: number;
    aecAtivasPendentes5d: number;
    // 📋 B — COMPLIANCE
    healthAlertsOpen: number;
    prescriptionsDraftOld: number;
    // ⚙️ C — OPERACIONAL
    appointmentsCancelled30d: number;
    forumPendingOld: number;
    orphansPublicUsers: number;
    // 💰 D — FINANCEIRO
    pendingBonusesValue: number;
    pendingBonusesCount: number;
    // Existing
    activeProtections: number;
}

interface RiskPatient {
    id: string;
    name: string;
    risk_level: 'G1' | 'G2' | 'G3a' | 'G3b' | 'G4' | 'G5';
    last_exam_date: string;
    days_since_exam: number;
}

export const RiskCockpit: React.FC = () => {
    const [stats, setStats] = useState<RiskStats>({
        drcG4G5: 0,
        aecOrfasInterrupted30d: 0,
        aecAtivasPendentes5d: 0,
        healthAlertsOpen: 0,
        prescriptionsDraftOld: 0,
        appointmentsCancelled30d: 0,
        forumPendingOld: 0,
        orphansPublicUsers: 0,
        pendingBonusesValue: 0,
        pendingBonusesCount: 0,
        activeProtections: 0,
    });

    const [highRiskPatients, setHighRiskPatients] = useState<RiskPatient[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchRiskData();
    }, []);

    const fetchRiskData = async () => {
        setLoading(true);

        // V1.9.532: queries paralelas pra latência baixa (cada categoria independente).
        // Falha em uma NÃO bloqueia as outras — degradação graciosa.
        const [
            renalRes,
            bonusesRes,
            aecOrfasRes,
            aecPendentesRes,
            healthAlertsRes,
            prescriptionsDraftRes,
            appointmentsCancelledRes,
            forumPendingRes,
            orphansRes,
        ] = await Promise.all([
            // 🩺 A — DRC G3b+ (V1.9.307 existing)
            supabase
                .from('renal_exams')
                .select('id, patient_id, drc_stage, exam_date, creatinine, egfr, users:patient_id(name)')
                .order('exam_date', { ascending: false }),
            // 💰 D — Referral bonuses pending (V1.9.269 existing)
            supabase
                .from('referral_bonus_cycles')
                .select('bonus_value', { count: 'exact' })
                .eq('status', 'pending'),
            // 🩺 A — AECs INTERRUPTED >30d (V1.9.500 visíveis no dashboard prof)
            supabase
                .from('aec_assessment_state')
                .select('id', { count: 'exact', head: true })
                .eq('phase', 'INTERRUPTED')
                .eq('is_complete', false)
                .is('invalidated_at', null)
                .lt('last_update', new Date(Date.now() - 30 * 86400000).toISOString()),
            // 🩺 A — AECs ATIVAS pendentes >5d (V1.9.516 Check 6)
            supabase
                .from('aec_assessment_state')
                .select('id', { count: 'exact', head: true })
                .not('phase', 'in', '(INTERRUPTED,COMPLETED,FINAL_RECOMMENDATION,REPORT,CONSENSUS)')
                .eq('is_complete', false)
                .is('invalidated_at', null)
                .lt('last_update', new Date(Date.now() - 5 * 86400000).toISOString()),
            // 📋 B — system_health_alerts open (V1.9.503/505/516)
            // V1.9.532: cast as any porque types.ts (auto-gerado) não inclui
            // tabela criada via migration manual V1.9.503 sem regen
            (supabase as any)
                .from('system_health_alerts')
                .select('id', { count: 'exact', head: true })
                .eq('status', 'open'),
            // 📋 B — Prescrições draft >30d
            supabase
                .from('cfm_prescriptions')
                .select('id', { count: 'exact', head: true })
                .eq('status', 'draft')
                .lt('created_at', new Date(Date.now() - 30 * 86400000).toISOString()),
            // ⚙️ C — Appointments cancelled últimos 30d
            supabase
                .from('appointments')
                .select('id', { count: 'exact', head: true })
                .eq('status', 'cancelled')
                .gt('created_at', new Date(Date.now() - 30 * 86400000).toISOString()),
            // ⚙️ C — Forum pending_review >7d
            supabase
                .from('forum_posts')
                .select('id', { count: 'exact', head: true })
                .eq('status', 'pending_review')
                .lt('created_at', new Date(Date.now() - 7 * 86400000).toISOString()),
            // ⚙️ C — Órfãos public.users (V1.9.531 fix tornou visíveis)
            supabase.rpc('admin_get_users_status'),
        ]);

        try {
            // 🩺 A — DRC G4/G5
            const renalData = renalRes.data || [];
            const drcHigh = renalData.filter(e => e.drc_stage === 'G4' || e.drc_stage === 'G5').length;

            // 💰 D — Bonuses pending
            const totalPending = (bonusesRes.data || []).reduce((acc: number, curr: any) => acc + Number(curr.bonus_value), 0);

            // ⚙️ C — Órfãos public.users (sem last_sign_in_at)
            const usersData = orphansRes.data || [];
            const orphans = (usersData as any[]).filter(u => !u.last_sign_in_at).length;

            setStats({
                drcG4G5: drcHigh,
                aecOrfasInterrupted30d: aecOrfasRes.count || 0,
                aecAtivasPendentes5d: aecPendentesRes.count || 0,
                healthAlertsOpen: healthAlertsRes.count || 0,
                prescriptionsDraftOld: prescriptionsDraftRes.count || 0,
                appointmentsCancelled30d: appointmentsCancelledRes.count || 0,
                forumPendingOld: forumPendingRes.count || 0,
                orphansPublicUsers: orphans,
                pendingBonusesValue: totalPending,
                pendingBonusesCount: (bonusesRes.data || []).length,
                activeProtections: renalData.length,
            });

            // High risk patients list (G3b+, deduplicado por patient_id) — V1.9.307 mantido
            const realHighRisk: RiskPatient[] = [];
            const seen = new Set<string>();
            for (const exam of renalData) {
                if (!exam.patient_id || seen.has(exam.patient_id)) continue;
                if (!['G3b', 'G4', 'G5'].includes(exam.drc_stage || '')) continue;
                seen.add(exam.patient_id);
                const examDate = exam.exam_date ? new Date(exam.exam_date) : null;
                const daysSince = examDate
                    ? Math.floor((Date.now() - examDate.getTime()) / 86400000)
                    : 0;
                const patientName = (exam.users as any)?.name || 'Paciente';
                realHighRisk.push({
                    id: exam.id,
                    name: patientName,
                    risk_level: exam.drc_stage as 'G3b' | 'G4' | 'G5',
                    last_exam_date: exam.exam_date || '',
                    days_since_exam: daysSince,
                });
            }
            setHighRiskPatients(realHighRisk);
        } catch (error) {
            console.error('Error processing risk data:', error);
        } finally {
            setLoading(false);
        }
    };

    // Helpers de UI
    const totalAlertsA = stats.drcG4G5 + stats.aecOrfasInterrupted30d + stats.aecAtivasPendentes5d;
    const totalAlertsB = stats.healthAlertsOpen + stats.prescriptionsDraftOld;
    const totalAlertsC = stats.appointmentsCancelled30d + stats.forumPendingOld + stats.orphansPublicUsers;
    const totalAlertsD = stats.pendingBonusesCount;

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Header */}
            <div className="bg-slate-800/80 backdrop-blur-md rounded-2xl p-6 border border-slate-700 shadow-xl">
                <div className="flex items-center gap-4 mb-2">
                    <div className="p-3 bg-red-500/20 rounded-xl">
                        <ShieldAlert className="w-8 h-8 text-red-500" />
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold text-white">Risk Cockpit</h2>
                        <p className="text-slate-400 text-sm italic">Blindagem 360° · Clínica + Compliance + Operacional + Financeiro</p>
                    </div>
                </div>
            </div>

            {/* 🩺 CATEGORIA A — CLÍNICA GRAVE */}
            <CategorySection
                icon={<Stethoscope className="w-5 h-5 text-red-400" />}
                title="🩺 Clínica grave"
                subtitle="Riscos clínicos que precisam atenção médica"
                alertCount={totalAlertsA}
                accent="red"
                loading={loading}
                items={[
                    { label: 'DRC G4/G5 (renal grave)', value: stats.drcG4G5, severity: stats.drcG4G5 > 0 ? 'critical' : 'ok' },
                    { label: 'AECs interrompidas >30d', value: stats.aecOrfasInterrupted30d, severity: stats.aecOrfasInterrupted30d > 0 ? 'critical' : 'ok' },
                    { label: 'AECs ativas pendentes >5d', value: stats.aecAtivasPendentes5d, severity: stats.aecAtivasPendentes5d > 0 ? 'warning' : 'ok' },
                ]}
            />

            {/* 📋 CATEGORIA B — COMPLIANCE / AUDIT */}
            <CategorySection
                icon={<FileText className="w-5 h-5 text-amber-400" />}
                title="📋 Compliance / Audit"
                subtitle="Health checks SGQ + documentação clínica em pendência"
                alertCount={totalAlertsB}
                accent="amber"
                loading={loading}
                items={[
                    { label: 'System health alerts abertos', value: stats.healthAlertsOpen, severity: stats.healthAlertsOpen > 0 ? 'warning' : 'ok' },
                    { label: 'Prescrições em draft >30d', value: stats.prescriptionsDraftOld, severity: stats.prescriptionsDraftOld > 5 ? 'warning' : 'ok' },
                ]}
            />

            {/* ⚙️ CATEGORIA C — OPERACIONAL */}
            <CategorySection
                icon={<Activity className="w-5 h-5 text-blue-400" />}
                title="⚙️ Operacional"
                subtitle="UX gaps + governança de fluxo paciente"
                alertCount={totalAlertsC}
                accent="blue"
                loading={loading}
                items={[
                    { label: 'Cancelamentos últimos 30d', value: stats.appointmentsCancelled30d, severity: stats.appointmentsCancelled30d > 10 ? 'warning' : 'ok' },
                    { label: 'Forum pending review >7d', value: stats.forumPendingOld, severity: stats.forumPendingOld > 0 ? 'warning' : 'ok' },
                    { label: 'Órfãos públicos (pré-cadastro silencioso)', value: stats.orphansPublicUsers, severity: 'info', tooltip: 'Pattern CFM 2.314 — pacientes cadastrados pelo médico sem login app' },
                ]}
            />

            {/* 💰 CATEGORIA D — FINANCEIRO */}
            <CategorySection
                icon={<DollarSign className="w-5 h-5 text-emerald-400" />}
                title="💰 Financeiro"
                subtitle={stats.pendingBonusesCount === 0 ? 'Aguardando Marco 1 (CNPJ + gateway pagamento)' : 'Bonuses + repasses'}
                alertCount={totalAlertsD}
                accent="emerald"
                loading={loading}
                items={[
                    { label: 'Referral bonuses pendentes (valor)', value: stats.pendingBonusesValue, severity: stats.pendingBonusesValue > 1000 ? 'warning' : 'ok', format: 'currency' },
                    { label: 'Pacientes monitorados (sidecar Renal)', value: stats.activeProtections, severity: 'info' },
                ]}
            />

            {/* Tabela DRC G3b+ (V1.9.307 mantido) */}
            {highRiskPatients.length > 0 && (
                <div className="bg-slate-800/80 rounded-2xl border border-slate-700 overflow-hidden shadow-2xl">
                    <div className="p-6 border-b border-slate-700 flex flex-col md:flex-row justify-between items-center gap-4 bg-slate-800/50">
                        <div className="flex items-center gap-2">
                            <div className="w-1.5 h-6 bg-red-500 rounded-full"></div>
                            <h3 className="text-xl font-bold text-white tracking-tight">Pacientes DRC G3b+ (Cidade Amiga dos Rins)</h3>
                        </div>
                        <div className="relative w-full md:w-64">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                            <input
                                type="text"
                                placeholder="Filtrar pacientes..."
                                className="w-full bg-slate-900/50 border border-slate-700 rounded-xl py-2 pl-10 pr-4 text-sm text-white focus:outline-none focus:border-red-500 transition-all"
                            />
                        </div>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="bg-slate-900/50 text-[10px] uppercase tracking-widest font-black text-slate-500">
                                    <th className="px-6 py-4">Status</th>
                                    <th className="px-6 py-4">Paciente</th>
                                    <th className="px-6 py-4">Risco</th>
                                    <th className="px-6 py-4">Último Exame</th>
                                    <th className="px-6 py-4 text-right">Ação</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-700/30">
                                {highRiskPatients.map((patient) => (
                                    <tr key={patient.id} className="hover:bg-slate-700/20 transition-colors group cursor-pointer">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                <div className="relative flex h-2.5 w-2.5">
                                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                                                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]"></span>
                                                </div>
                                                <span className="text-[10px] font-bold text-red-500 uppercase tracking-tighter">Alerta</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <p className="font-bold text-white text-sm group-hover:text-red-400 transition-colors">{patient.name}</p>
                                            <p className="text-[10px] text-slate-500 font-mono">ID: {patient.id.slice(0, 8)}</p>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`px-3 py-1 rounded-full text-[10px] font-black tracking-widest ${
                                                patient.risk_level === 'G5'
                                                    ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                                                    : patient.risk_level === 'G4'
                                                        ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30'
                                                        : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                                            }`}>
                                                {patient.risk_level}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col">
                                                <span className="text-sm text-slate-300">{patient.last_exam_date ? new Date(patient.last_exam_date).toLocaleDateString('pt-BR') : '—'}</span>
                                                <span className="text-[10px] text-red-500/70 font-bold uppercase">{patient.days_since_exam} dias</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <button className="p-2 bg-slate-700/50 hover:bg-red-500/20 rounded-lg group-hover:scale-110 transition-all text-slate-400 hover:text-red-400">
                                                <ArrowRight className="w-4 h-4" />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Footer */}
            <div className="p-4 bg-slate-900/30 border border-slate-700/30 rounded-2xl text-center">
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-[.25em]">
                    V1.9.532 · Reusa dados existentes · 4 categorias · Zero migration nova
                </p>
            </div>
        </div>
    );
};

// ─────────────────────────────────────────────
// Helper: CategorySection
// ─────────────────────────────────────────────
interface CategoryItem {
    label: string;
    value: number;
    severity: 'critical' | 'warning' | 'info' | 'ok';
    format?: 'currency' | 'number';
    tooltip?: string;
}

interface CategorySectionProps {
    icon: React.ReactNode;
    title: string;
    subtitle: string;
    alertCount: number;
    accent: 'red' | 'amber' | 'blue' | 'emerald';
    loading: boolean;
    items: CategoryItem[];
}

const accentColors = {
    red: { border: 'border-red-500/30', bg: 'bg-red-500/5', text: 'text-red-400', badge: 'bg-red-500/20 text-red-300' },
    amber: { border: 'border-amber-500/30', bg: 'bg-amber-500/5', text: 'text-amber-400', badge: 'bg-amber-500/20 text-amber-300' },
    blue: { border: 'border-blue-500/30', bg: 'bg-blue-500/5', text: 'text-blue-400', badge: 'bg-blue-500/20 text-blue-300' },
    emerald: { border: 'border-emerald-500/30', bg: 'bg-emerald-500/5', text: 'text-emerald-400', badge: 'bg-emerald-500/20 text-emerald-300' },
};

const severityColors = {
    critical: 'text-red-400',
    warning: 'text-amber-400',
    info: 'text-blue-400',
    ok: 'text-slate-400',
};

const CategorySection: React.FC<CategorySectionProps> = ({ icon, title, subtitle, alertCount, accent, loading, items }) => {
    const c = accentColors[accent];

    return (
        <div className={`rounded-2xl border ${c.border} ${c.bg} p-5 backdrop-blur-md`}>
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${c.bg} border ${c.border}`}>
                        {icon}
                    </div>
                    <div>
                        <h3 className="text-base font-bold text-white">{title}</h3>
                        <p className="text-xs text-slate-400">{subtitle}</p>
                    </div>
                </div>
                <div className={`px-3 py-1.5 rounded-full text-xs font-bold ${c.badge}`}>
                    {loading ? '...' : alertCount === 0 ? '✓ sem alerta' : `${alertCount} alerta${alertCount === 1 ? '' : 's'}`}
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {items.map((item, idx) => (
                    <div key={idx} className="rounded-xl bg-slate-900/40 border border-slate-700/30 p-4 hover:border-slate-600 transition-all">
                        <p className="text-[10px] uppercase tracking-wider text-slate-500 mb-2" title={item.tooltip}>
                            {item.label}
                        </p>
                        <p className={`text-2xl font-bold ${severityColors[item.severity]}`}>
                            {loading ? (
                                <span className="inline-block w-12 h-7 bg-slate-700/30 rounded animate-pulse"></span>
                            ) : item.format === 'currency' ? (
                                `R$ ${item.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
                            ) : (
                                item.value
                            )}
                        </p>
                    </div>
                ))}
            </div>
        </div>
    );
};
