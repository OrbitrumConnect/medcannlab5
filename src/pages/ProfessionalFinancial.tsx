import { useState } from 'react'
import { Wallet, BarChart3, Sparkles } from 'lucide-react'
import { WalletTab } from '../components/financial/WalletTab'
import { SimulatorTab } from '../components/financial/SimulatorTab'
import { VisionTab } from '../components/financial/VisionTab'

type TabId = 'wallet' | 'simulator' | 'vision'

const TABS: { id: TabId; label: string; icon: any; description: string }[] = [
  { id: 'wallet', label: 'Carteira', icon: Wallet, description: 'Saldo real, transações e saques' },
  { id: 'simulator', label: 'Simulador', icon: BarChart3, description: 'Projeções e análise SWOT' },
  { id: 'vision', label: 'Visão', icon: Sparkles, description: 'Modelo sustentável e impacto' },
]

export function ProfessionalFinancial() {
  const [activeTab, setActiveTab] = useState<TabId>('wallet')

  return (
    <div className="min-h-screen p-6" style={{ background: 'linear-gradient(135deg, rgba(10,25,47,0.98) 0%, rgba(15,35,55,0.95) 50%, rgba(10,40,35,0.92) 100%)' }}>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
            💎 Terminal Financeiro
          </h1>
          <p className="text-gray-300 text-sm">
            Carteira inteligente, simulação estratégica e visão de impacto • MedCannLab Prime
          </p>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 border-b border-slate-700/60 overflow-x-auto">
          {TABS.map(tab => {
            const Icon = tab.icon
            const active = activeTab === tab.id
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-5 py-3 font-semibold text-sm whitespace-nowrap transition-all border-b-2 ${
                  active
                    ? 'text-emerald-400 border-emerald-500'
                    : 'text-gray-400 border-transparent hover:text-white hover:border-slate-600'
                }`}
              >
                <Icon size={18} />
                <div className="text-left">
                  <div>{tab.label}</div>
                  <div className="text-[10px] font-normal opacity-70">{tab.description}</div>
                </div>
              </button>
            )
          })}
        </div>

        {/* Tab content */}
        <div>
          {activeTab === 'wallet' && <WalletTab />}
          {activeTab === 'simulator' && <SimulatorTab />}
          {activeTab === 'vision' && <VisionTab />}
        </div>
      </div>
    </div>
  )
}
