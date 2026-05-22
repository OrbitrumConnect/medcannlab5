import React from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Brain, Clock, Lightbulb } from 'lucide-react'
import { backgroundGradient } from '../constants/designSystem'

/**
 * V1.9.131-A — Placeholder honesto KPIs TEA.
 *
 * Página visível mas explícita: feature ainda em desenvolvimento.
 * Princípio P9 inverso pré-PMF: zero pacientes TEA reais hoje.
 * Quando Eduardo Faveret trouxer dado real, esta tela vira dashboard.
 */
const KpisTea: React.FC = () => {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen text-white" style={{ background: backgroundGradient }}>
      <div className="max-w-3xl mx-auto px-4 md:px-6 py-8">
        <button
          onClick={() => navigate('/app/clinica/profissional/dashboard')}
          className="flex items-center gap-2 text-slate-400 hover:text-white text-sm mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Voltar ao Meu Dashboard
        </button>

        <div className="rounded-2xl border border-emerald-500/20 bg-gradient-to-br from-emerald-500/[0.06] to-transparent p-6 md:p-10">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center">
              <Brain className="w-6 h-6 text-emerald-400" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-white">KPIs TEA</h1>
              <p className="text-sm text-slate-400">Monitoramento neurológico — Transtorno do Espectro Autista</p>
            </div>
          </div>

          <div className="rounded-xl border border-yellow-500/20 bg-yellow-500/[0.05] p-5 mb-6 flex items-start gap-3">
            <Clock className="w-5 h-5 text-yellow-400 shrink-0 mt-0.5" />
            <div>
              <h2 className="text-yellow-200 font-semibold mb-1">Em desenvolvimento</h2>
              <p className="text-sm text-slate-300 leading-relaxed">
                Esta funcionalidade está em construção. O dashboard de KPIs TEA será ativado quando
                houver coleta clínica real de pacientes neurológicos pela rede MedCannLab.
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-base font-semibold text-white flex items-center gap-2">
              <Lightbulb className="w-4 h-4 text-emerald-400" />
              O que vai aparecer aqui
            </h3>
            <ul className="space-y-2 text-sm text-slate-300">
              <li className="flex items-start gap-2">
                <span className="text-emerald-400 mt-0.5">•</span>
                <span>Indicadores de evolução clínica em pacientes do espectro autista (sono, alimentação, comunicação, comportamento)</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-emerald-400 mt-0.5">•</span>
                <span>Métricas de eficácia de intervenções por racionalidade integrativa</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-emerald-400 mt-0.5">•</span>
                <span>Comparativo entre AECs ao longo do tempo (consultas seriadas)</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-emerald-400 mt-0.5">•</span>
                <span>Coordenação científica: <strong className="text-white">Dr. Eduardo Faveret</strong> (Neurologia)</span>
              </li>
            </ul>
          </div>

          <div className="mt-8 pt-6 border-t border-white/5">
            <p className="text-xs text-slate-500 italic">
              Sem dado real, sem dashboard fictício. Princípio MedCannLab: indicadores aparecem quando
              há coleta clínica genuína para sustentá-los.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default KpisTea
