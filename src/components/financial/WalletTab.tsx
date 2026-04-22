import { useState, useEffect } from 'react'
import { Wallet, TrendingUp, Clock, Download, ArrowUpRight, ArrowDownLeft, AlertCircle, CheckCircle2, Hourglass } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'

interface WalletData {
  balance_available: number
  balance_pending: number
  total_earned: number
  total_withdrawn: number
  revenue_this_month: number
  revenue_last_month: number
  transactions_this_month: number
}

interface Transaction {
  id: string
  amount: number
  professional_amount: number
  platform_fee: number
  type: string
  status: string
  description: string | null
  created_at: string
  confirmed_at: string | null
}

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: any }> = {
  pending: { label: 'Pendente', color: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/30', icon: Hourglass },
  confirmed: { label: 'Confirmado', color: 'text-green-400 bg-green-500/10 border-green-500/30', icon: CheckCircle2 },
  cancelled: { label: 'Cancelado', color: 'text-gray-400 bg-gray-500/10 border-gray-500/30', icon: AlertCircle },
  refunded: { label: 'Estornado', color: 'text-red-400 bg-red-500/10 border-red-500/30', icon: ArrowDownLeft },
}

export function WalletTab() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [wallet, setWallet] = useState<WalletData | null>(null)
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [requesting, setRequesting] = useState(false)
  const [showPayoutModal, setShowPayoutModal] = useState(false)
  const [payoutAmount, setPayoutAmount] = useState('')

  useEffect(() => {
    if (user) loadWallet()
  }, [user])

  const loadWallet = async () => {
    try {
      setLoading(true)

      // Garantir que a wallet existe
      await supabase.rpc('ensure_wallet', { p_user_id: user?.id })

      // Carregar resumo financeiro
      const { data: summary, error: summaryErr } = await supabase
        .from('v_professional_financial_summary')
        .select('*')
        .eq('user_id', user?.id)
        .maybeSingle()

      if (summaryErr) {
        console.warn('⚠️ Resumo financeiro:', summaryErr.message)
      }

      setWallet(summary || {
        balance_available: 0,
        balance_pending: 0,
        total_earned: 0,
        total_withdrawn: 0,
        revenue_this_month: 0,
        revenue_last_month: 0,
        transactions_this_month: 0,
      })

      // Carregar últimas 20 transações
      const { data: txs } = await supabase
        .from('wallet_transactions')
        .select('*')
        .eq('professional_id', user?.id)
        .order('created_at', { ascending: false })
        .limit(20)

      setTransactions(txs || [])
    } catch (err) {
      console.error('Erro ao carregar wallet:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleRequestPayout = async () => {
    const amount = parseFloat(payoutAmount)
    if (!amount || amount <= 0) {
      alert('Informe um valor válido')
      return
    }

    try {
      setRequesting(true)
      const { error } = await supabase.rpc('request_payout', { p_amount: amount })
      if (error) throw error
      alert(`✅ Saque de R$ ${amount.toFixed(2)} solicitado com sucesso!`)
      setShowPayoutModal(false)
      setPayoutAmount('')
      await loadWallet()
    } catch (err: any) {
      alert(`❌ ${err.message || 'Erro ao solicitar saque'}`)
    } finally {
      setRequesting(false)
    }
  }

  if (loading) {
    return <div className="text-white text-center py-12">Carregando carteira...</div>
  }

  const w = wallet!
  const growth = w.revenue_last_month > 0
    ? (((w.revenue_this_month - w.revenue_last_month) / w.revenue_last_month) * 100).toFixed(1)
    : '0.0'
  const growthPositive = parseFloat(growth) >= 0

  return (
    <div className="space-y-6">
      {/* Cards principais — Wallet Core */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Saldo disponível */}
        <div className="bg-gradient-to-br from-emerald-900/40 to-teal-900/40 border border-emerald-500/30 rounded-xl p-5">
          <div className="flex items-center justify-between mb-3">
            <Wallet className="text-emerald-400" size={24} />
            <button
              onClick={() => setShowPayoutModal(true)}
              disabled={w.balance_available <= 0}
              className="text-xs bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-700 disabled:text-gray-500 text-white px-3 py-1 rounded-lg font-semibold transition"
            >
              Sacar
            </button>
          </div>
          <p className="text-gray-300 text-xs mb-1">Saldo Disponível</p>
          <p className="text-3xl font-bold text-white">R$ {w.balance_available.toFixed(2)}</p>
          <p className="text-xs text-emerald-300 mt-2">Pronto para saque</p>
        </div>

        {/* Saldo pendente */}
        <div className="bg-slate-800/60 border border-yellow-500/20 rounded-xl p-5">
          <Clock className="text-yellow-400 mb-3" size={24} />
          <p className="text-gray-300 text-xs mb-1">A Liberar</p>
          <p className="text-3xl font-bold text-white">R$ {w.balance_pending.toFixed(2)}</p>
          <p className="text-xs text-gray-400 mt-2">Aguardando confirmação</p>
        </div>

        {/* Receita do mês */}
        <div className="bg-slate-800/60 border border-blue-500/20 rounded-xl p-5">
          <div className="flex items-center justify-between mb-3">
            <TrendingUp className="text-blue-400" size={24} />
            <span className={`text-xs font-semibold ${growthPositive ? 'text-green-400' : 'text-red-400'}`}>
              {growthPositive ? '+' : ''}{growth}%
            </span>
          </div>
          <p className="text-gray-300 text-xs mb-1">Receita do Mês</p>
          <p className="text-3xl font-bold text-white">R$ {w.revenue_this_month.toFixed(2)}</p>
          <p className="text-xs text-gray-400 mt-2">{w.transactions_this_month} transações</p>
        </div>

        {/* Total ganho */}
        <div className="bg-slate-800/60 border border-purple-500/20 rounded-xl p-5">
          <ArrowUpRight className="text-purple-400 mb-3" size={24} />
          <p className="text-gray-300 text-xs mb-1">Total Acumulado</p>
          <p className="text-3xl font-bold text-white">R$ {w.total_earned.toFixed(2)}</p>
          <p className="text-xs text-gray-400 mt-2">Sacado: R$ {w.total_withdrawn.toFixed(2)}</p>
        </div>
      </div>

      {/* Aviso quando wallet vazia */}
      {w.total_earned === 0 && transactions.length === 0 && (
        <div className="bg-blue-900/20 border border-blue-500/30 rounded-xl p-5 flex items-start gap-3">
          <AlertCircle className="text-blue-400 flex-shrink-0 mt-0.5" size={20} />
          <div className="text-sm text-gray-300">
            <p className="font-semibold text-white mb-1">Sua carteira ainda está vazia</p>
            <p>Quando você concluir consultas na agenda, elas aparecerão aqui automaticamente como pendentes. Após confirmação de pagamento, o valor (70% líquido para você) cai no saldo disponível.</p>
          </div>
        </div>
      )}

      {/* Histórico de transações */}
      <div className="bg-slate-800/60 border border-slate-700 rounded-xl overflow-hidden">
        <div className="p-5 border-b border-slate-700 flex items-center justify-between">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <Download size={20} /> Histórico Financeiro
          </h3>
          <span className="text-xs text-gray-400">{transactions.length} registros</span>
        </div>

        {transactions.length === 0 ? (
          <div className="p-8 text-center text-gray-400 text-sm">
            Nenhuma transação ainda. Conclua consultas na agenda para ver o histórico.
          </div>
        ) : (
          <div className="divide-y divide-slate-700">
            {transactions.map((tx) => {
              const cfg = STATUS_CONFIG[tx.status] || STATUS_CONFIG.pending
              const Icon = cfg.icon
              return (
                <div key={tx.id} className="p-4 flex items-center justify-between hover:bg-slate-800/40 transition">
                  <div className="flex items-center gap-3 flex-1">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${cfg.color}`}>
                      <Icon size={18} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-white text-sm font-medium truncate">
                        {tx.description || `${tx.type === 'consultation' ? 'Consulta' : tx.type}`}
                      </p>
                      <p className="text-xs text-gray-400">
                        {new Date(tx.created_at).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })}
                      </p>
                    </div>
                  </div>
                  <div className="text-right ml-3">
                    <p className="text-white font-bold">R$ {tx.professional_amount.toFixed(2)}</p>
                    <p className="text-xs text-gray-500">
                      Bruto R$ {tx.amount.toFixed(2)} • Taxa R$ {tx.platform_fee.toFixed(2)}
                    </p>
                    <span className={`inline-block mt-1 text-[10px] px-2 py-0.5 rounded-full border ${cfg.color}`}>
                      {cfg.label}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Modal de saque */}
      {showPayoutModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-xl p-6 max-w-md w-full">
            <h3 className="text-xl font-bold text-white mb-2">Solicitar Saque</h3>
            <p className="text-sm text-gray-400 mb-4">Disponível: R$ {w.balance_available.toFixed(2)}</p>

            <input
              type="number"
              value={payoutAmount}
              onChange={(e) => setPayoutAmount(e.target.value)}
              placeholder="Valor (R$)"
              max={w.balance_available}
              step="0.01"
              className="w-full bg-slate-800 border border-slate-600 rounded-lg px-4 py-3 text-white focus:border-emerald-500 focus:outline-none mb-4"
            />

            <div className="flex gap-3">
              <button
                onClick={() => { setShowPayoutModal(false); setPayoutAmount('') }}
                className="flex-1 bg-slate-700 hover:bg-slate-600 text-white px-4 py-2 rounded-lg font-semibold"
              >
                Cancelar
              </button>
              <button
                onClick={handleRequestPayout}
                disabled={requesting}
                className="flex-1 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white px-4 py-2 rounded-lg font-semibold"
              >
                {requesting ? 'Processando...' : 'Confirmar'}
              </button>
            </div>

            <p className="text-xs text-gray-500 mt-4">
              ℹ️ Saques serão processados via Stripe Connect quando a integração estiver ativa. Por enquanto, ficam registrados como pendentes.
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
