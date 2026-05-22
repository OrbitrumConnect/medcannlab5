import React, { useState } from 'react'
import { Brain, FileText, Shield, Database, Zap, CheckCircle } from 'lucide-react'
import { getNoaAssistantIntegration } from '../lib/noaAssistantIntegration'

interface NoaCapabilitiesProps {
  className?: string
}

const NoaCapabilities: React.FC<NoaCapabilitiesProps> = ({ className = '' }) => {
  const [isProcessing, setIsProcessing] = useState(false)
  const [result, setResult] = useState<any>(null)
  const assistantIntegration = getNoaAssistantIntegration()

  const handleCommand = async (command: string) => {
    setIsProcessing(true)
    setResult(null)

    try {
      const response = await assistantIntegration.processSpecialCommand(command, {
        patientId: 'PAT001',
        patientName: 'Paulo Gonçalves',
        reportId: 'RPT001'
      })

      setResult(response)
    } catch (error) {
      setResult({
        success: false,
        message: 'Erro ao processar comando',
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      })
    } finally {
      setIsProcessing(false)
    }
  }

  const capabilities = [
    {
      icon: <Brain className="w-6 h-6" />,
      title: 'Avaliação Clínica IMRE',
      description: 'Conduz avaliações clínicas seguindo metodologia IMRE Triaxial',
      command: 'finalizar avaliação',
      color: 'bg-blue-500'
    },
    {
      icon: <FileText className="w-6 h-6" />,
      title: 'Relatórios Clínicos',
      description: 'Gera relatórios estruturados e os registra no dashboard',
      command: 'dashboard paciente',
      color: 'bg-green-500'
    },
    {
      icon: <Shield className="w-6 h-6" />,
      title: 'Hash NFT',
      description: 'Emite hash NFT para autenticidade dos documentos',
      command: 'emitir nft',
      color: 'bg-purple-500'
    },
    {
      icon: <Database className="w-6 h-6" />,
      title: 'Histórico do Paciente',
      description: 'Acessa e consulta histórico clínico completo',
      command: 'buscar paciente',
      color: 'bg-orange-500'
    },
    {
      icon: <Zap className="w-6 h-6" />,
      title: 'Status da Plataforma',
      description: 'Monitora saúde e disponibilidade do sistema',
      command: 'status plataforma',
      color: 'bg-red-500'
    }
  ]

  return (
    <div className={`bg-brand-surface rounded-xl p-6 ${className}`}>
      <div className="mb-6">
        <h3 className="text-xl font-bold text-brand-text mb-2">🤖 Capacidades da IA Residente</h3>
        <p className="text-brand-text-muted text-sm">
          A Nôa Esperança pode gerenciar toda a plataforma através de comandos especializados
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        {capabilities.map((capability, index) => (
          <div
            key={index}
            className="bg-brand-surface-subtle rounded-lg p-4 hover:bg-slate-600 transition-colors cursor-pointer"
            onClick={() => handleCommand(capability.command)}
          >
            <div className="flex items-center space-x-3 mb-3">
              <div className={`p-2 rounded-lg ${capability.color} text-brand-text`}>
                {capability.icon}
              </div>
              <h4 className="font-semibold text-brand-text text-sm">{capability.title}</h4>
            </div>
            <p className="text-brand-text-secondary text-xs mb-2">{capability.description}</p>
            <div className="text-xs text-brand-text-muted font-mono bg-slate-600 px-2 py-1 rounded">
              {capability.command}
            </div>
          </div>
        ))}
      </div>

      {isProcessing && (
        <div className="bg-brand-surface-subtle rounded-lg p-4 mb-4">
          <div className="flex items-center space-x-3">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-400"></div>
            <span className="text-brand-text-secondary text-sm">Processando comando...</span>
          </div>
        </div>
      )}

      {result && (
        <div className={`rounded-lg p-4 ${
          result.success ? 'bg-green-900/20 border border-green-500' : 'bg-red-900/20 border border-red-500'
        }`}>
          <div className="flex items-center space-x-2 mb-2">
            {result.success ? (
              <CheckCircle className="w-5 h-5 text-green-400" />
            ) : (
              <div className="w-5 h-5 bg-red-400 rounded-full"></div>
            )}
            <span className={`font-semibold ${
              result.success ? 'text-green-400' : 'text-red-400'
            }`}>
              {result.success ? 'Sucesso' : 'Erro'}
            </span>
          </div>
          <p className="text-brand-text-secondary text-sm mb-2">{result.message}</p>
          {result.data && (
            <div className="bg-brand-surface rounded p-3 text-xs text-brand-text-muted font-mono">
              <pre>{JSON.stringify(result.data, null, 2)}</pre>
            </div>
          )}
          {result.error && (
            <div className="text-red-400 text-xs mt-2">
              Erro: {result.error}
            </div>
          )}
        </div>
      )}

      <div className="mt-4 p-3 bg-slate-700/50 rounded-lg">
        <h4 className="text-sm font-semibold text-brand-text mb-2">Comandos Disponíveis:</h4>
        <div className="text-xs text-brand-text-muted space-y-1">
          {assistantIntegration.getAvailableCommands().map((cmd, index) => (
            <div key={index} className="font-mono">• {cmd}</div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default NoaCapabilities
