import React, { useState, useEffect } from 'react';
import { TrendingUp, Users, Calendar, AlertCircle, CheckCircle, Clock, ChevronRight } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

interface BonusCycle {
  id: string;
  patient_name: string;
  cycle_number: number;
  bonus_value: number;
  status: 'pending' | 'approved' | 'paid' | 'cancelled';
  created_at: string;
  reference_month: string;
}

// V1.9.269 — Escala de bônus referral por alcance (Pedro+Claude 13/05 22h30 BRT).
// Médico indica paciente pra PLATAFORMA (não pra outro médico) — CFM 2.314 OK.
// Cada faixa desbloqueia +N% adicional sobre a take rate dos primeiros 6 meses
// do paciente indicado (vai pra referral_bonus_cycles.bonus_value).
// MVP: UI apenas, lógica server-side fica pra V1.9.27X (pós-CNPJ + Ricardo aprovar).
const REFERRAL_TIERS = [
  { threshold: 5,   bonusPct: 1, label: 'Sementeira',  description: '1ª vitória — bônus desbloqueado' },
  { threshold: 20,  bonusPct: 2, label: 'Crescimento', description: 'Médico engajado' },
  { threshold: 50,  bonusPct: 4, label: 'Consolidado', description: 'Carteira ativa' },
  { threshold: 100, bonusPct: 6, label: 'Referência',  description: 'Top de plataforma' },
  { threshold: 250, bonusPct: 8, label: 'Mestre',      description: 'Aspiracional' },
];

export const IncentivosPanel: React.FC = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [bonusCycles, setBonusCycles] = useState<BonusCycle[]>([]);
  const [invitedCount, setInvitedCount] = useState(0);
  const [stats, setStats] = useState({
    totalPending: 0,
    totalApproved: 0,
    totalPaid: 0,
    activePatientCycles: 0
  });

  useEffect(() => {
    if (user) {
      loadIncentivosData();
    }
  }, [user]);

  const loadIncentivosData = async () => {
    try {
      setLoading(true);
      
      // Buscar ciclos de bônus
      const { data, error } = await supabase
        .from('referral_bonus_cycles')
        .select(`
          *,
          patient:patient_id(name)
        `)
        .eq('doctor_id', user?.id ?? '')
        .order('created_at', { ascending: false });

      if (error) throw error;

      const formattedData: BonusCycle[] = (data || []).map((item: any) => ({
        id: item.id,
        patient_name: item.patient?.name || 'Paciente',
        cycle_number: item.cycle_number ?? 0,
        bonus_value: item.bonus_value,
        status: item.status ?? 'pending',
        created_at: item.created_at ?? new Date().toISOString(),
        reference_month: item.reference_month ?? ''
      }));

      setBonusCycles(formattedData);

      // Calcular estatísticas
      const totals = formattedData.reduce((acc, curr) => {
        if (curr.status === 'pending') acc.totalPending += curr.bonus_value;
        if (curr.status === 'approved') acc.totalApproved += curr.bonus_value;
        if (curr.status === 'paid') acc.totalPaid += curr.bonus_value;
        return acc;
      }, { totalPending: 0, totalApproved: 0, totalPaid: 0 });

      // Contar pacientes ativos (ciclos pendentes ou aprovados)
      const activePatients = new Set(formattedData
        .filter(c => c.status === 'pending' || c.status === 'approved')
        .map(c => c.patient_name)
      ).size;

      setStats({
        ...totals,
        activePatientCycles: activePatients
      });

      // V1.9.269 — Conta pacientes que se cadastraram via link de indicação deste médico.
      // users.invited_by é UUID FK que existe (audit empírico 13/05). Best-effort: se RLS
      // bloquear, count fica 0 e UI mostra "0/5" sem quebrar nada.
      try {
        const { count: invCount } = await supabase
          .from('users')
          .select('id', { count: 'exact', head: true })
          .eq('invited_by', user?.id ?? '');
        setInvitedCount(invCount ?? 0);
      } catch (invErr) {
        console.warn('Erro ao contar indicações (RLS?):', invErr);
        setInvitedCount(0);
      }
    } catch (error) {
      console.error('❌ Erro ao carregar incentivos:', error);
    } finally {
      setLoading(false);
    }
  };

  // V1.9.269 — Helpers escala referral (pure functions, sem dependência externa)
  const currentTier = REFERRAL_TIERS.slice().reverse().find(t => invitedCount >= t.threshold) || null;
  const nextTier = REFERRAL_TIERS.find(t => invitedCount < t.threshold) || null;
  const progressPct = nextTier
    ? Math.min(100, Math.round((invitedCount / nextTier.threshold) * 100))
    : 100;

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header & Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-gradient-to-br from-emerald-500/10 to-teal-500/10 border border-emerald-500/20 rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <TrendingUp className="w-5 h-5 text-emerald-600" />
            <span className="text-xs font-bold text-emerald-600 uppercase tracking-wider">Pendente</span>
          </div>
          <p className="text-2xl font-bold text-slate-800">
            R$ {stats.totalPending.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </p>
          <p className="text-xs text-slate-500 mt-1">Aguardando aprovação</p>
        </div>

        <div className="bg-gradient-to-br from-blue-500/10 to-indigo-500/10 border border-blue-500/20 rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <CheckCircle className="w-5 h-5 text-blue-600" />
            <span className="text-xs font-bold text-blue-600 uppercase tracking-wider">Aprovado</span>
          </div>
          <p className="text-2xl font-bold text-slate-800">
            R$ {stats.totalApproved.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </p>
          <p className="text-xs text-slate-500 mt-1">Pronto para resgate</p>
        </div>

        <div className="bg-gradient-to-br from-slate-500/10 to-slate-700/10 border border-slate-500/20 rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <Clock className="w-5 h-5 text-slate-600" />
            <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">Pago</span>
          </div>
          <p className="text-2xl font-bold text-slate-800">
            R$ {stats.totalPaid.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </p>
          <p className="text-xs text-slate-500 mt-1">Total resgatado</p>
        </div>

        <div className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 border border-purple-500/20 rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <Users className="w-5 h-5 text-purple-600" />
            <span className="text-xs font-bold text-purple-600 uppercase tracking-wider">Pacientes Ativos</span>
          </div>
          <p className="text-2xl font-bold text-slate-800">{stats.activePatientCycles}</p>
          <p className="text-xs text-slate-500 mt-1">Geração de bônus ativa</p>
        </div>
      </div>

      {/* Informativo Blindagem */}
      <div className="bg-primary-900 border border-primary-700 rounded-xl p-6 text-white overflow-hidden relative">
        <div className="relative z-10">
          <h3 className="text-lg font-bold mb-2 flex items-center gap-2">
            <span className="bg-emerald-500 text-white text-[10px] px-2 py-0.5 rounded-full">ATIVO</span>
            Protocolo de Blindagem Financeira (Modelo B)
          </h3>
          <p className="text-sm text-primary-100 max-w-2xl">
            Seu sistema de bônus de 30% está ativo. O bônus é calculado sobre a take rate dos primeiros 6 meses
            de cada paciente indicado, garantindo sustentabilidade e rastreabilidade total.
          </p>
        </div>
        <div className="absolute top-0 right-0 p-4 opacity-10">
          <TrendingUp className="w-32 h-32" />
        </div>
      </div>

      {/* V1.9.269 — Escala de bônus por alcance de indicações (Pedro+Claude 13/05 22h30) */}
      <div className="bg-gradient-to-br from-emerald-900/40 to-cyan-900/30 border border-emerald-500/30 rounded-xl p-6 text-white">
        <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
          <div>
            <h3 className="text-lg font-bold flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-emerald-400" />
              Bônus Escalonado por Indicações
            </h3>
            <p className="text-xs text-slate-300 mt-1">
              Adicional sobre a take rate por paciente indicado à plataforma.
            </p>
          </div>
          <div className="text-right">
            <p className="text-3xl font-bold text-emerald-300">{invitedCount}</p>
            <p className="text-xs text-slate-400">pacientes indicados</p>
          </div>
        </div>

        {/* Barra de progresso pra próxima faixa */}
        {nextTier ? (
          <div className="mb-4">
            <div className="flex items-center justify-between text-xs mb-1.5">
              <span className="text-slate-300">
                Próxima faixa: <strong className="text-cyan-300">{nextTier.label}</strong> ({nextTier.threshold} indicados → <strong>+{nextTier.bonusPct}%</strong>)
              </span>
              <span className="text-slate-400">{invitedCount}/{nextTier.threshold}</span>
            </div>
            <div className="w-full h-2 bg-slate-800/60 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-emerald-500 to-cyan-400 transition-all"
                style={{ width: `${progressPct}%` }}
              />
            </div>
            <p className="text-[11px] text-slate-400 mt-1.5">
              Faltam <strong className="text-white">{Math.max(0, nextTier.threshold - invitedCount)}</strong> indicações pra desbloquear <strong className="text-cyan-300">+{nextTier.bonusPct}%</strong>.
            </p>
          </div>
        ) : (
          <div className="mb-4 px-3 py-2 bg-emerald-500/15 border border-emerald-500/30 rounded-lg text-xs text-emerald-200">
            🎉 Você atingiu o nível máximo (<strong>{currentTier?.label}</strong>). Bônus máximo +8% ativo.
          </div>
        )}

        {/* Tabela compacta de faixas (visual claro do caminho completo) */}
        <div className="grid grid-cols-5 gap-2">
          {REFERRAL_TIERS.map(tier => {
            const reached = invitedCount >= tier.threshold;
            const isCurrent = currentTier?.threshold === tier.threshold;
            return (
              <div
                key={tier.threshold}
                className={`rounded-lg p-2.5 text-center transition-all ${
                  reached
                    ? isCurrent
                      ? 'bg-emerald-500/25 border-2 border-emerald-400'
                      : 'bg-emerald-500/10 border border-emerald-500/30'
                    : 'bg-slate-800/40 border border-slate-700'
                }`}
                title={tier.description}
              >
                <p className={`text-[10px] uppercase font-bold tracking-wider ${reached ? 'text-emerald-300' : 'text-slate-500'}`}>
                  {tier.label}
                </p>
                <p className={`text-base font-bold ${reached ? 'text-white' : 'text-slate-400'}`}>
                  +{tier.bonusPct}%
                </p>
                <p className={`text-[10px] ${reached ? 'text-emerald-200/80' : 'text-slate-500'}`}>
                  {tier.threshold} indicados
                </p>
              </div>
            );
          })}
        </div>

        <p className="text-[11px] text-slate-400 mt-4 leading-relaxed">
          <strong className="text-slate-300">Como funciona:</strong> a cada paciente que se cadastra pela plataforma usando seu link de indicação, você acumula uma faixa. Quanto mais indicados, maior o adicional sobre os bônus mensais gerados por eles. Cashback do paciente (8,7% gamificação) é independente e não afeta este cálculo.
        </p>
      </div>

      {/* Tabela de Ciclos */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <h3 className="font-semibold text-slate-800 flex items-center gap-2">
            <Calendar className="w-4 h-4 text-emerald-600" />
            Detalhamento de Ciclos
          </h3>
          <button 
            onClick={loadIncentivosData}
            className="text-xs text-primary-600 hover:underline font-medium"
          >
            Atualizar dados
          </button>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-500 font-medium">
              <tr>
                <th className="px-6 py-3">Paciente</th>
                <th className="px-6 py-3">Ciclo</th>
                <th className="px-6 py-3">Mês Ref.</th>
                <th className="px-6 py-3">Valor Bônus</th>
                <th className="px-6 py-3">Status</th>
                <th className="px-6 py-3">Data</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {bonusCycles.length > 0 ? (
                bonusCycles.map((cycle) => (
                  <tr key={cycle.id} className="hover:bg-slate-50 transition-colors group">
                    <td className="px-6 py-4 font-medium text-slate-900">{cycle.patient_name}</td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-0.5 bg-slate-100 rounded-full text-xs">
                        {cycle.cycle_number}/6
                      </span>
                    </td>
                    <td className="px-6 py-4 uppercase">{cycle.reference_month}</td>
                    <td className="px-6 py-4 font-bold text-emerald-600">
                      R$ {cycle.bonus_value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-6 py-4">
                      {cycle.status === 'pending' && (
                        <span className="flex items-center gap-1.5 text-orange-600">
                          <Clock className="w-3 h-3" /> Pendente
                        </span>
                      )}
                      {cycle.status === 'approved' && (
                        <span className="flex items-center gap-1.5 text-blue-600">
                          <CheckCircle className="w-3 h-3" /> Aprovado
                        </span>
                      )}
                      {cycle.status === 'paid' && (
                        <span className="flex items-center gap-1.5 text-emerald-600">
                          <CheckCircle className="w-3 h-3" /> Pago
                        </span>
                      )}
                      {cycle.status === 'cancelled' && (
                        <span className="flex items-center gap-1.5 text-red-600">
                          <AlertCircle className="w-3 h-3" /> Cancelado
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-slate-400">
                      {new Date(cycle.created_at).toLocaleDateString('pt-BR')}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-400">
                    Nenhum bônus registrado até o momento.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
