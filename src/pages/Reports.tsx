import React, { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Stethoscope,
  AlertCircle,
  ArrowLeft
} from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'

const Reports: React.FC = () => {
  const { user } = useAuth()
  const navigate = useNavigate()

  // Redirecionar pacientes automaticamente para o dashboard
  useEffect(() => {
    if (user?.type === 'paciente') {
      navigate('/app/clinica/paciente/dashboard')
    }
  }, [user, navigate])

  // Para profissionais: mostrar mensagem informativa
  if (user?.type === 'paciente') {
    return null // Componente será redirecionado
  }

  return (
    <div className="space-y-6 px-2 md:px-0">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-white mb-2">📈 Relatórios</h1>
          <p className="text-slate-300 text-sm md:text-base">
            Os relatórios dos pacientes estão disponíveis no histórico de saúde de cada paciente
          </p>
        </div>
        <button
          onClick={() => navigate(-1)}
          className="mt-4 md:mt-0 flex items-center space-x-2 text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Voltar</span>
        </button>
      </div>

      {/* Mensagem Informativa */}
      <div style={{ background: 'rgba(0,193,106,0.1)', border: '1px solid rgba(0,193,106,0.25)' }} className="rounded-lg p-6">
        <div className="flex items-start space-x-4">
          <AlertCircle className="w-6 h-6 flex-shrink-0 mt-1" style={{ color: '#00F5A0' }} />
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-white mb-2">
              Relatórios Clínicos dos Pacientes
            </h3>
            <p className="text-slate-300 mb-4">
              Todos os relatórios clínicos dos seus pacientes estão disponíveis diretamente no histórico de saúde de cada paciente,
              através do dashboard individual. Isso permite um acesso mais integrado e contextualizado aos dados clínicos.
            </p>
            <div className="space-y-2 text-slate-300 text-sm">
              <p className="font-medium text-white">Para acessar os relatórios:</p>
              <ul className="list-disc list-inside space-y-1 ml-2">
                <li>Acesse a área de atendimento no seu dashboard</li>
                <li>Selecione o paciente desejado</li>
                <li>Visualize o histórico de saúde completo, incluindo todos os relatórios</li>
              </ul>
            </div>
            <div className="mt-4">
              <button
                onClick={() => navigate('/app/clinica/profissional/dashboard')}
                className="text-white px-4 py-2 rounded-lg transition-colors flex items-center space-x-2"
                style={{ background: 'linear-gradient(135deg, #00c16a 0%, #00a85a 100%)' }}
              >
                <Stethoscope className="w-4 h-4" />
                <span>Ir para Dashboard Profissional</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Reports
