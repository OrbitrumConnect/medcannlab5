/**
 * Clinical Governance Admin Page
 * 
 * Dashboard admin para overview do sistema ACDSS
 */

import { Brain, TrendingUp, AlertTriangle, CheckCircle } from 'lucide-react'

export default function ClinicalGovernanceAdmin() {
    return (
        <div className="p-8">
            {/* Header */}
            <div className="mb-8">
                <div className="flex items-center gap-3 mb-2">
                    <Brain className="w-8 h-8 text-purple-400" />
                    <h1 className="text-3xl font-bold text-white">Clinical Governance (ACDSS)</h1>
                </div>
                <p className="text-gray-400">
                    Sistema de Governança Cognitiva - Visão Administrativa
                </p>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-4 gap-6 mb-8">
                {/* Card: Total Análises */}
                <div className="bg-gradient-to-r from-purple-900/30 to-purple-800/20 rounded-xl p-6 border border-purple-700/30">
                    <div className="flex items-center justify-between mb-2">
                        <Brain className="w-6 h-6 text-purple-400" />
                        <span className="text-2xl font-bold text-white">0</span>
                    </div>
                    <p className="text-sm text-gray-400">Análises Realizadas</p>
                    <p className="text-xs text-gray-500 mt-1">Últimas 24h</p>
                </div>

                {/* Card: Alertas Ativos */}
                <div className="bg-gradient-to-r from-red-900/30 to-red-800/20 rounded-xl p-6 border border-red-700/30">
                    <div className="flex items-center justify-between mb-2">
                        <AlertTriangle className="w-6 h-6 text-red-400" />
                        <span className="text-2xl font-bold text-white">0</span>
                    </div>
                    <p className="text-sm text-gray-400">Alertas Pendentes</p>
                    <p className="text-xs text-gray-500 mt-1">Requer atenção</p>
                </div>

                {/* Card: Pacientes Estáveis */}
                <div className="bg-gradient-to-r from-green-900/30 to-green-800/20 rounded-xl p-6 border border-green-700/30">
                    <div className="flex items-center justify-between mb-2">
                        <CheckCircle className="w-6 h-6 text-green-400" />
                        <span className="text-2xl font-bold text-white">0</span>
                    </div>
                    <p className="text-sm text-gray-400">Pacientes Estáveis</p>
                    <p className="text-xs text-gray-500 mt-1">Sem alertas</p>
                </div>

                {/* Card: Taxa de Sucesso */}
                <div className="bg-gradient-to-r from-blue-900/30 to-blue-800/20 rounded-xl p-6 border border-blue-700/30">
                    <div className="flex items-center justify-between mb-2">
                        <TrendingUp className="w-6 h-6 text-blue-400" />
                        <span className="text-2xl font-bold text-white">N/A</span>
                    </div>
                    <p className="text-sm text-gray-400">Taxa de Sucesso</p>
                    <p className="text-xs text-gray-500 mt-1">Aguardando dados</p>
                </div>
            </div>

            {/* Info Box */}
            <div className="bg-blue-900/20 rounded-xl p-6 border border-blue-700/30">
                <div className="flex items-start gap-4">
                    <Brain className="w-6 h-6 text-blue-400 mt-1" />
                    <div>
                        <h3 className="text-lg font-semibold text-white mb-2">
                            Sistema ACDSS (Adaptive Clinical Decision Support System)
                        </h3>
                        <p className="text-gray-300 mb-3">
                            O Clinical Governance Engine analisa automaticamente o contexto clínico de cada paciente,
                            detectando padrões de risco, saturação terapêutica e oportunidades de intervenção.
                        </p>
                        <ul className="space-y-2 text-sm text-gray-400">
                            <li>✅ <strong>Análise em tempo real</strong> de todos os pacientes ativos</li>
                            <li>✅ <strong>Detecção de exaustão terapêutica</strong> (protocolo sem eficácia)</li>
                            <li>✅ <strong>Threshold conservador 70%+</strong> para garantir segurança</li>
                            <li>✅ <strong>Não-prescritivo</strong> - apenas alerta, médico decide</li>
                            <li>✅ <strong>Aprendizado bloqueado em estados estáveis</strong> (previne overfitting)</li>
                        </ul>
                    </div>
                </div>
            </div>

            {/* Demo Link */}
            <div className="mt-6">
                <a
                    href="/app/clinical-governance-demo"
                    className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
                >
                    <Brain className="w-4 h-4" />
                    Ver Página de Demonstração
                </a>
            </div>

            {/* Placeholder: Lista de Pacientes */}
            <div className="mt-8 bg-gray-900/30 rounded-xl p-6 border border-gray-700/30">
                <h3 className="text-lg font-semibold text-white mb-4">Pacientes Monitorados</h3>
                <div className="text-center py-12 text-gray-500">
                    <Brain className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>Sistema aguardando dados de pacientes</p>
                    <p className="text-sm mt-1">Análises serão exibidas aqui automaticamente</p>
                </div>
            </div>
        </div>
    )
}
