/**
 * COMPONENTE DE MONITORAMENTO EM TEMPO REAL
 * Acompanha testes do paciente Paulo Gonçalvez e treinamento da IA
 */

import React, { useState, useEffect } from 'react'
import { 
  Activity, 
  Users, 
  Brain, 
  CheckCircle, 
  AlertCircle, 
  Clock,
  TrendingUp,
  BarChart3,
  Loader2
} from 'lucide-react'
import { testMonitoringSystem } from '../lib/testMonitoringSystem'

const TestMonitoringDashboard: React.FC = () => {
  const [isMonitoring, setIsMonitoring] = useState(false)
  const [currentSession, setCurrentSession] = useState<any>(null)
  const [trainingProgress, setTrainingProgress] = useState(0)
  const [patientCount, setPatientCount] = useState(0)
  const [successRate, setSuccessRate] = useState(0)
  const [isTrainingComplete, setIsTrainingComplete] = useState(false)

  useEffect(() => {
    if (isMonitoring) {
      const interval = setInterval(async () => {
        try {
          // Atualizar contagem de pacientes
          const count = await testMonitoringSystem.getPatientCount()
          setPatientCount(count)

          // Atualizar progresso do treinamento
          if (currentSession?.iterations) {
            setTrainingProgress(currentSession.iterations)
            setSuccessRate(currentSession.successRate * 100)
          }

          // Verificar se treinamento está completo
          if (trainingProgress >= 1000) {
            setIsTrainingComplete(true)
            setIsMonitoring(false)
          }
        } catch (error) {
          console.error('Erro ao atualizar monitoramento:', error)
        }
      }, 1000)

      return () => clearInterval(interval)
    }
  }, [isMonitoring, currentSession, trainingProgress])

  const startMonitoring = async () => {
    try {
      setIsMonitoring(true)
      const session = await testMonitoringSystem.startPauloGoncalvezMonitoring()
      setCurrentSession(session)
      
      // Iniciar treinamento da IA em background
      testMonitoringSystem.monitorAITraining()
      
    } catch (error) {
      console.error('Erro ao iniciar monitoramento:', error)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'running': return 'text-blue-500'
      case 'completed': return 'text-green-500'
      case 'error': return 'text-red-500'
      default: return 'text-gray-500'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'running': return <Activity className="w-5 h-5 animate-pulse" />
      case 'completed': return <CheckCircle className="w-5 h-5" />
      case 'error': return <AlertCircle className="w-5 h-5" />
      default: return <Clock className="w-5 h-5" />
    }
  }

  return (
    <div className="min-h-screen bg-brand-bg text-brand-text p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">🔍 Monitoramento de Testes</h1>
          <p className="text-brand-text-secondary">Acompanhamento do paciente Paulo Gonçalvez e treinamento da IA</p>
        </div>

        {/* Controles */}
        <div className="bg-brand-surface rounded-xl p-6 mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold mb-2">Controle de Monitoramento</h2>
              <p className="text-brand-text-muted">Inicie o monitoramento dos testes e treinamento da IA</p>
            </div>
            <button
              onClick={startMonitoring}
              disabled={isMonitoring}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-slate-600 disabled:cursor-not-allowed text-brand-text px-6 py-3 rounded-lg font-semibold transition-colors flex items-center space-x-2"
            >
              {isMonitoring ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Monitorando...</span>
                </>
              ) : (
                <>
                  <Activity className="w-5 h-5" />
                  <span>Iniciar Monitoramento</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Status Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Status da Sessão */}
          <div className="bg-brand-surface rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Sessão Atual</h3>
              {currentSession && getStatusIcon(currentSession.status)}
            </div>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-brand-text-muted">Paciente:</span>
                <span className="font-medium">Paulo Gonçalvez</span>
              </div>
              <div className="flex justify-between">
                <span className="text-brand-text-muted">Status:</span>
                <span className={`font-medium ${getStatusColor(currentSession?.status || 'idle')}`}>
                  {currentSession?.status || 'Não iniciado'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-brand-text-muted">ID:</span>
                <span className="font-mono text-sm">{currentSession?.id || 'N/A'}</span>
              </div>
            </div>
          </div>

          {/* Progresso do Treinamento */}
          <div className="bg-brand-surface rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Treinamento IA</h3>
              <Brain className="w-6 h-6 text-purple-500" />
            </div>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-brand-text-muted">Iterações:</span>
                <span className="font-medium">{trainingProgress}/1000</span>
              </div>
              <div className="flex justify-between">
                <span className="text-brand-text-muted">Taxa de Sucesso:</span>
                <span className="font-medium">{successRate.toFixed(1)}%</span>
              </div>
              <div className="w-full bg-brand-surface-subtle rounded-full h-2 mt-3">
                <div 
                  className="bg-purple-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${(trainingProgress / 1000) * 100}%` }}
                />
              </div>
            </div>
          </div>

          {/* Contagem de Pacientes */}
          <div className="bg-brand-surface rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Pacientes</h3>
              <Users className="w-6 h-6 text-green-500" />
            </div>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-brand-text-muted">Total:</span>
                <span className="font-medium">{patientCount}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-brand-text-muted">Meta:</span>
                <span className="font-medium">1000</span>
              </div>
              <div className="flex justify-between">
                <span className="text-brand-text-muted">Progresso:</span>
                <span className="font-medium">{((patientCount / 1000) * 100).toFixed(1)}%</span>
              </div>
            </div>
          </div>

          {/* Status Geral */}
          <div className="bg-brand-surface rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Status Geral</h3>
              <BarChart3 className="w-6 h-6 text-blue-500" />
            </div>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-brand-text-muted">Monitoramento:</span>
                <span className={`font-medium ${isMonitoring ? 'text-green-500' : 'text-red-500'}`}>
                  {isMonitoring ? 'Ativo' : 'Inativo'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-brand-text-muted">Treinamento:</span>
                <span className={`font-medium ${isTrainingComplete ? 'text-green-500' : 'text-yellow-500'}`}>
                  {isTrainingComplete ? 'Completo' : 'Em andamento'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-brand-text-muted">Meta Pacientes:</span>
                <span className={`font-medium ${patientCount >= 1000 ? 'text-green-500' : 'text-yellow-500'}`}>
                  {patientCount >= 1000 ? 'Atingida' : 'Pendente'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Logs em Tempo Real */}
        <div className="bg-brand-surface rounded-xl p-6">
          <h3 className="text-xl font-semibold mb-4">📊 Logs em Tempo Real</h3>
          <div className="bg-brand-bg rounded-lg p-4 h-64 overflow-y-auto">
            <div className="space-y-2 font-mono text-sm">
              {isMonitoring && (
                <>
                  <div className="text-green-400">✅ Monitoramento iniciado para Paulo Gonçalvez</div>
                  <div className="text-blue-400">🔄 Treinamento da IA em andamento...</div>
                  <div className="text-purple-400">📊 Iteração {trainingProgress}/1000 - Taxa de sucesso: {successRate.toFixed(1)}%</div>
                  <div className="text-green-400">👥 Pacientes cadastrados: {patientCount}</div>
                  {isTrainingComplete && (
                    <div className="text-green-400">🎉 Treinamento da IA concluído com sucesso!</div>
                  )}
                  {patientCount >= 1000 && (
                    <div className="text-green-400">🎯 Meta de 1000 pacientes atingida!</div>
                  )}
                </>
              )}
              {!isMonitoring && (
                <div className="text-slate-500">Aguardando início do monitoramento...</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default TestMonitoringDashboard
