import { useState, useEffect } from 'react'
import { Zap, AlertCircle, Lightbulb, Target, TrendingUp, TrendingDown, BarChart3 } from 'lucide-react'

const SUBSCRIPTION_PLANS = [
  { id: 'basic', name: 'MedCann Basic', price: 150, color: 'blue', slots: 20 },
  { id: 'professional', name: 'MedCann Professional', price: 250, color: 'purple', slots: 40 },
  { id: 'premium', name: 'MedCann Premium', price: 350, color: 'gold', slots: 60 },
]

const CLINICS = [
  { id: 'ricardo', name: 'Consultório Dr. Ricardo Valença', slots: 30, color: 'blue' },
  { id: 'eduardo', name: 'Consultório Dr. Eduardo Faveret', slots: 40, color: 'green' },
]

const SWOT_CATEGORIES = [
  { id: 'strengths', name: 'Forças', icon: Zap, color: 'green' },
  { id: 'weaknesses', name: 'Fraquezas', icon: AlertCircle, color: 'red' },
  { id: 'opportunities', name: 'Oportunidades', icon: Lightbulb, color: 'blue' },
  { id: 'threats', name: 'Ameaças', icon: Target, color: 'orange' },
]

export function SimulatorTab() {
  const [selectedSubscription, setSelectedSubscription] = useState('professional')
  const [selectedClinic, setSelectedClinic] = useState('all')
  const [targetConsultations, setTargetConsultations] = useState(100)
  const [swotFilter, setSwotFilter] = useState('all')
  const [simulation, setSimulation] = useState<any>(null)

  useEffect(() => {
    calculateSimulation()
  }, [selectedSubscription, selectedClinic, targetConsultations])

  const calculateSimulation = () => {
    const plan = SUBSCRIPTION_PLANS.find(p => p.id === selectedSubscription)!
    const clinic = selectedClinic !== 'all' ? CLINICS.find(c => c.id === selectedClinic) : null
    const maxSlots = clinic ? clinic.slots : CLINICS.reduce((s, c) => s + c.slots, 0)
    const consultations = Math.min(targetConsultations, maxSlots)
    const consultPrice = 200
    const totalRevenue = consultations * consultPrice + plan.price
    const platformFee = totalRevenue * 0.30
    const professionalAmount = totalRevenue * 0.70
    const utilizationRate = ((consultations / maxSlots) * 100).toFixed(1)
    const breakEvenPoint = Math.ceil(plan.price / consultPrice)
    const roi = (((professionalAmount - plan.price) / plan.price) * 100).toFixed(1)

    setSimulation({
      totalRevenue, platformFee, netIncome: professionalAmount,
      maxSlots, utilizationRate, breakEvenPoint, roi, consultations,
    })
  }

  const getSwotInsights = () => {
    if (!simulation) return []
    const insights: any[] = []
    if (parseFloat(simulation.utilizationRate) > 80) {
      insights.push({ category: 'strengths', icon: TrendingUp, title: 'Alta Utilização', description: `${simulation.utilizationRate}% da capacidade em uso.`, color: 'green' })
    }
    if (parseFloat(simulation.roi) > 100) {
      insights.push({ category: 'strengths', icon: Zap, title: 'ROI Excelente', description: `Retorno de ${simulation.roi}% sobre investimento.`, color: 'green' })
    }
    if (parseFloat(simulation.utilizationRate) < 50) {
      insights.push({ category: 'weaknesses', icon: AlertCircle, title: 'Baixa Utilização', description: `Apenas ${simulation.utilizationRate}% da capacidade.`, color: 'red' })
    }
    if (simulation.consultations < simulation.maxSlots * 0.7) {
      insights.push({ category: 'opportunities', icon: Lightbulb, title: 'Capacidade Ociosa', description: `Você pode realizar mais ${simulation.maxSlots - simulation.consultations} consultas.`, color: 'blue' })
    }
    if (simulation.breakEvenPoint > simulation.maxSlots * 0.8) {
      insights.push({ category: 'threats', icon: TrendingDown, title: 'Break-Even Arriscado', description: `Precisa de ${simulation.breakEvenPoint} consultas para cobrir custos.`, color: 'orange' })
    }
    return swotFilter === 'all' ? insights : insights.filter(i => i.category === swotFilter)
  }

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-purple-900/40 to-blue-900/40 rounded-xl p-6 border border-purple-500/20">
        <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
          <BarChart3 size={22} /> Simulador de Investimento
        </h3>

        <div className="grid md:grid-cols-3 gap-4 mb-6">
          <div>
            <label className="block text-gray-300 text-xs font-semibold mb-2">Plano</label>
            <select value={selectedSubscription} onChange={(e) => setSelectedSubscription(e.target.value)}
              className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm focus:border-purple-500 focus:outline-none">
              {SUBSCRIPTION_PLANS.map(p => <option key={p.id} value={p.id}>{p.name} - R$ {p.price}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-gray-300 text-xs font-semibold mb-2">Consultório</label>
            <select value={selectedClinic} onChange={(e) => setSelectedClinic(e.target.value)}
              className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm focus:border-purple-500 focus:outline-none">
              <option value="all">Todos</option>
              {CLINICS.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-gray-300 text-xs font-semibold mb-2">Meta Consultas/Mês</label>
            <input type="number" value={targetConsultations} onChange={(e) => setTargetConsultations(parseInt(e.target.value) || 0)}
              className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm focus:border-purple-500 focus:outline-none" />
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <button onClick={() => setSwotFilter('all')}
            className={`px-3 py-1.5 rounded-lg text-sm font-semibold ${swotFilter === 'all' ? 'bg-emerald-600 text-white' : 'bg-slate-700 text-gray-300'}`}>
            Todas
          </button>
          {SWOT_CATEGORIES.map(cat => {
            const Icon = cat.icon
            return (
              <button key={cat.id} onClick={() => setSwotFilter(cat.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-semibold ${swotFilter === cat.id ? 'bg-emerald-600 text-white' : 'bg-slate-700 text-gray-300'}`}>
                <Icon size={14} /> {cat.name}
              </button>
            )
          })}
        </div>
      </div>

      {simulation && (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-slate-800 rounded-xl p-5 border border-green-500/30">
              <p className="text-gray-400 text-xs mb-1">Receita Projetada</p>
              <p className="text-2xl font-bold text-white">R$ {simulation.totalRevenue.toFixed(2)}</p>
            </div>
            <div className="bg-slate-800 rounded-xl p-5 border border-purple-500/30">
              <p className="text-gray-400 text-xs mb-1">ROI</p>
              <p className="text-2xl font-bold text-purple-400">{simulation.roi}%</p>
            </div>
            <div className="bg-slate-800 rounded-xl p-5 border border-blue-500/30">
              <p className="text-gray-400 text-xs mb-1">Lucro Líquido (70%)</p>
              <p className="text-2xl font-bold text-green-400">R$ {simulation.netIncome.toFixed(2)}</p>
            </div>
            <div className="bg-slate-800 rounded-xl p-5 border border-orange-500/30">
              <p className="text-gray-400 text-xs mb-1">Break-Even</p>
              <p className="text-2xl font-bold text-white">{simulation.breakEvenPoint} consultas</p>
            </div>
          </div>

          {getSwotInsights().length > 0 && (
            <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700">
              <h3 className="text-lg font-bold text-white mb-4">🔍 Análise SWOT</h3>
              <div className="grid md:grid-cols-2 gap-3">
                {getSwotInsights().map((insight, i) => {
                  const Icon = insight.icon
                  return (
                    <div key={i} className={`bg-${insight.color}-900/20 border border-${insight.color}-500/30 rounded-lg p-3 flex items-start gap-3`}>
                      <Icon className={`text-${insight.color}-400 mt-0.5`} size={20} />
                      <div>
                        <h4 className="text-white font-semibold text-sm">{insight.title}</h4>
                        <p className="text-gray-300 text-xs">{insight.description}</p>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
