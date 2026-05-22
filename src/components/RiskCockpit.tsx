import React, { useState, useEffect } from 'react';
import {
    AlertTriangle,
    TrendingUp,
    ShieldAlert,
    Activity,
    DollarSign,
    Users,
    Search,
    Filter,
    ArrowRight,
    Brain,
    Zap
} from 'lucide-react';
import { supabase } from '../lib/supabase';

interface RiskStats {
    clinicalRiskHigh: number;
    financialRiskHigh: number;
    pendingBonusesValue: number;
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
        clinicalRiskHigh: 0,
        financialRiskHigh: 0,
        pendingBonusesValue: 0,
        activeProtections: 0
    });

    const [highRiskPatients, setHighRiskPatients] = useState<RiskPatient[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchRiskData();
    }, []);

    const fetchRiskData = async () => {
        setLoading(true);
        try {
            // V1.9.307 — Risk Cockpit agora lê renal_exams REAL (não mais MOCK).
            // Pacientes só aparecem aqui após médico aprovar sugestão DRC pendente
            // via RenalSuggestionsCard → cria renal_exams oficial.
            // GPT review #8: nunca misturar sugestão pendente com dado oficial.
            const { data: renalData } = await supabase
                .from('renal_exams')
                .select('id, patient_id, drc_stage, exam_date, creatinine, egfr, users:patient_id(name)')
                .order('exam_date', { ascending: false });

            const highRisk = renalData?.filter(e => e.drc_stage === 'G4' || e.drc_stage === 'G5').length || 0;

            // Financial risk (bonuses pendentes) — INTOCADO
            const { data: bonusData } = await supabase
                .from('referral_bonus_cycles')
                .select('bonus_value')
                .eq('status', 'pending');

            const totalPending = bonusData?.reduce((acc, curr) => acc + Number(curr.bonus_value), 0) || 0;

            setStats({
                clinicalRiskHigh: highRisk,
                financialRiskHigh: totalPending > 1000 ? 1 : 0,
                pendingBonusesValue: totalPending,
                activeProtections: renalData?.length || 0
            });

            // V1.9.307 — High risk SÓ DE DADOS REAIS (sem mock). Lista vazia
            // se não há renal_exams aprovados — UI mostra estado correto.
            // Filtra pacientes G3b+ (preocupantes clinicamente) deduplica por patient_id
            // mantendo exame mais recente.
            const realHighRisk: RiskPatient[] = []
            const seen = new Set<string>()
            for (const exam of renalData || []) {
                if (!exam.patient_id || seen.has(exam.patient_id)) continue
                if (!['G3b','G4','G5'].includes(exam.drc_stage || '')) continue
                seen.add(exam.patient_id)
                const examDate = exam.exam_date ? new Date(exam.exam_date) : null
                const daysSince = examDate
                    ? Math.floor((Date.now() - examDate.getTime()) / 86400000)
                    : 0
                const patientName = (exam.users as any)?.name || 'Paciente'
                realHighRisk.push({
                    id: exam.id,
                    name: patientName,
                    risk_level: exam.drc_stage as 'G3b'|'G4'|'G5',
                    last_exam_date: exam.exam_date || '',
                    days_since_exam: daysSince
                })
            }
            setHighRiskPatients(realHighRisk);

        } catch (error) {
            console.error('Error fetching risk data:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Header Section */}
            <div className="bg-slate-800/80 backdrop-blur-md rounded-2xl p-6 border border-brand-border shadow-xl">
                <div className="flex items-center gap-4 mb-2">
                    <div className="p-3 bg-red-500/20 rounded-xl">
                        <ShieldAlert className="w-8 h-8 text-red-500" />
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold text-brand-text">Risk Cockpit</h2>
                        <p className="text-brand-text-muted text-sm italic">"Blindagem 360°: Clinical & Financial Oversight"</p>
                    </div>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-slate-800/50 rounded-2xl p-5 border border-slate-700/50 hover:border-red-500/50 transition-all group">
                    <div className="flex justify-between items-start mb-3">
                        <div className="p-2 bg-red-500/10 rounded-lg text-red-400">
                            <Activity className="w-5 h-5" />
                        </div>
                        <span className="text-[10px] font-bold text-red-500 bg-red-500/10 px-2 py-0.5 rounded-full uppercase tracking-tighter">Critical</span>
                    </div>
                    <p className="text-3xl font-black text-brand-text">{stats.clinicalRiskHigh}</p>
                    <p className="text-xs text-slate-500 uppercase font-bold tracking-widest">DRC G4/G5 Alert</p>
                </div>

                <div className="bg-slate-800/50 rounded-2xl p-5 border border-slate-700/50 hover:border-amber-500/50 transition-all">
                    <div className="flex justify-between items-start mb-3">
                        <div className="p-2 bg-amber-500/10 rounded-lg text-amber-400">
                            <DollarSign className="w-5 h-5" />
                        </div>
                        <span className="text-[10px] font-bold text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded-full uppercase tracking-tighter">Exposure</span>
                    </div>
                    <p className="text-3xl font-black text-brand-text">R$ {stats.pendingBonusesValue.toLocaleString()}</p>
                    <p className="text-xs text-slate-500 uppercase font-bold tracking-widest">Pending Bonuses</p>
                </div>

                <div className="bg-slate-800/50 rounded-2xl p-5 border border-slate-700/50 hover:border-emerald-500/50 transition-all">
                    <div className="flex justify-between items-start mb-3">
                        <div className="p-2 bg-emerald-500/10 rounded-lg text-emerald-400">
                            <Brain className="w-5 h-5" />
                        </div>
                        <span className="text-[10px] font-bold text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-full uppercase tracking-tighter">Nôa Active</span>
                    </div>
                    <p className="text-3xl font-black text-brand-text">{stats.activeProtections}</p>
                    <p className="text-xs text-slate-500 uppercase font-bold tracking-widest">Monitored Patients</p>
                </div>

                <div className="bg-slate-800/50 rounded-2xl p-5 border border-slate-700/50 hover:border-indigo-500/50 transition-all">
                    <div className="flex justify-between items-start mb-3">
                        <div className="p-2 bg-indigo-500/10 rounded-lg text-indigo-400">
                            <Zap className="w-5 h-5" />
                        </div>
                        <span className="text-[10px] font-bold text-indigo-500 bg-indigo-500/10 px-2 py-0.5 rounded-full uppercase tracking-tighter">Stable</span>
                    </div>
                    <p className="text-3xl font-black text-brand-text">100%</p>
                    <p className="text-xs text-slate-500 uppercase font-bold tracking-widest">System Integrity</p>
                </div>
            </div>

            {/* Risk Table */}
            <div className="bg-slate-800/80 rounded-2xl border border-brand-border overflow-hidden shadow-2xl">
                <div className="p-6 border-b border-brand-border flex flex-col md:flex-row justify-between items-center gap-4 bg-slate-800/50">
                    <div className="flex items-center gap-2">
                        <div className="w-1.5 h-6 bg-red-500 rounded-full"></div>
                        <h3 className="text-xl font-bold text-brand-text tracking-tight">Clinical Risk Map</h3>
                    </div>
                    <div className="relative w-full md:w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                        <input
                            type="text"
                            placeholder="Filter patients..."
                            className="w-full bg-slate-900/50 border border-brand-border rounded-xl py-2 pl-10 pr-4 text-sm text-brand-text focus:outline-none focus:border-red-500 transition-all"
                        />
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-slate-900/50 text-[10px] uppercase tracking-widest font-black text-slate-500">
                                <th className="px-6 py-4">Status</th>
                                <th className="px-6 py-4">Patient</th>
                                <th className="px-6 py-4">Risk Level</th>
                                <th className="px-6 py-4">Last Exam</th>
                                <th className="px-6 py-4 text-right">Action</th>
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
                                            <span className="text-[10px] font-bold text-red-500 uppercase tracking-tighter">Alarm</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <p className="font-bold text-brand-text text-sm group-hover:text-red-400 transition-colors">{patient.name}</p>
                                        <p className="text-[10px] text-slate-500 font-mono">ID: {patient.id.slice(0, 8)}</p>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`px-3 py-1 rounded-full text-[10px] font-black tracking-widest ${patient.risk_level === 'G5'
                                                ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                                                : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                                            }`}>
                                            {patient.risk_level}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex flex-col">
                                            <span className="text-sm text-brand-text-secondary">{new Date(patient.last_exam_date).toLocaleDateString()}</span>
                                            <span className="text-[10px] text-red-500/70 font-bold uppercase">{patient.days_since_exam} days late</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <button className="p-2 bg-slate-700/50 hover:bg-red-500/20 rounded-lg group-hover:scale-110 transition-all text-brand-text-muted hover:text-red-400">
                                            <ArrowRight className="w-4 h-4" />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                <div className="p-4 bg-slate-900/30 border-t border-slate-700/50 text-center">
                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-[.25em]">End of Live Radar</p>
                </div>
            </div>
        </div>
    );
};
