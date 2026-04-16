import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { Check } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

interface Plan {
  id: string
  name: string
  description: string
  monthly_price: number
  consultation_discount: number
  features: string[]
}

export function SubscriptionPlans() {
  const [plans, setPlans] = useState<Plan[]>([])
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    loadPlans()
  }, [])

  const loadPlans = async () => {
    try {
      const { data } = await supabase
        .from('subscription_plans')
        .select('*')
        .eq('is_active', true)

      if (data) {
        setPlans(data.map(plan => ({
          ...plan,
          features: Array.isArray(plan.features) ? plan.features.map(f => String(f)) : []
        })) as Plan[])
      }
    } catch (error) {
      console.error('Erro ao carregar planos:', error)

      setPlans([
        {
          id: 'plano-acesso',
          name: 'Plano Acesso',
          description: 'Acesso completo ao ecossistema cognitivo MedCannLab com IA residente e ferramentas clínicas.',
          monthly_price: 60.00,
          consultation_discount: 0,
          features: [
            'Avaliação Clínica IMRE com Nôa Esperanza (IA)',
            'Taxa de Adesão única de R$ 79,90',
            'Relatórios estruturados e linha do tempo de saúde',
            'Acesso ao corpo clínico homologado',
            'Videochamadas seguras e prescrições digitais'
          ]
        }
      ])
    } finally {
      setLoading(false)
    }
  }

  const handleSelectPlan = (planId: string) => {
    navigate(`/app/checkout?plan=${planId}`)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500 mx-auto"></div>
          <p className="mt-4 text-gray-400">Carregando planos...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen py-12 px-4" style={{ background: 'linear-gradient(135deg, rgba(10,25,47,0.98) 0%, rgba(15,35,55,0.95) 50%, rgba(10,40,35,0.92) 100%)' }}>
      <div className="container mx-auto max-w-7xl">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-white mb-4">
            Acesso à Plataforma
          </h1>
          <p className="text-gray-300 text-lg">
            Um único plano, acesso completo ao ecossistema cognitivo.
          </p>
        </div>

        {/* Plans Grid */}
        <div className="flex justify-center max-w-xl mx-auto">
          {plans.map((plan) => (
            <div
              key={plan.id}
              className={`w-full bg-slate-800 rounded-xl p-8 border-2 transition-all hover:scale-105 border-emerald-500 shadow-xl shadow-emerald-500/20`}
            >
              <div className="text-center mb-4">
                <span className="bg-emerald-500 text-white text-sm font-bold px-4 py-1 rounded-full">
                  PLANO ÚNICO
                </span>
              </div>

              {/* Nome do Plano */}
              <h3 className="text-2xl font-bold text-white mb-2">{plan.name}</h3>
              <p className="text-gray-400 mb-6 text-sm">{plan.description}</p>

              {/* Preço */}
              <div className="mb-6">
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-bold text-white">
                    R$ {plan.monthly_price.toFixed(2)}
                  </span>
                  <span className="text-gray-400">/mês</span>
                </div>
                <p className="text-sm text-yellow-500 mt-1">* + R$ 79,90 de taxa de adesão (paga apenas uma vez)</p>
              </div>

              {/* Benefícios */}
              <ul className="mb-8 space-y-3">
                {plan.features.map((feature, idx) => (
                  <li key={idx} className="flex items-start gap-3">
                    <Check className="text-green-400 mt-0.5 flex-shrink-0" size={20} />
                    <span className="text-gray-300 text-sm">{feature}</span>
                  </li>
                ))}
              </ul>

              {/* Botão */}
              <button
                onClick={() => handleSelectPlan(plan.id)}
                className={`w-full py-3 rounded-lg font-semibold transition-all bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-500/30`}
              >
                Assinar Agora
              </button>
            </div>
          ))}
        </div>

        {/* Informação adicional */}
        <div className="mt-12 text-center">
          <p className="text-gray-400 text-sm">
            O acesso à plataforma não inclui o valor das consultas médicas, que são pagas diretamente aos profissionais.
          </p>
          <p className="text-gray-500 text-xs mt-2">
            Cancelamento a qualquer momento. Sem taxas de cancelamento.
          </p>
        </div>
      </div>
    </div>
  )
}
