import React, { useState } from 'react'
import { 
  Stethoscope, 
  FileText, 
  Clock, 
  CheckCircle, 
  AlertCircle,
  User,
  Heart,
  Brain,
  Activity
} from 'lucide-react'
import ShareAssessment from '../components/ShareAssessment'

const ClinicalAssessment: React.FC = () => {
  const [currentStep, setCurrentStep] = useState(0)
  const [showShareModal, setShowShareModal] = useState(false)

  const imreBlocks = [
    {
      id: 'indiciaria',
      title: 'Lista Indiciária',
      description: 'Identificação inicial dos sintomas e queixas',
      icon: <FileText className="w-6 h-6" />,
      color: 'blue',
      steps: 4,
      completed: false
    },
    {
      id: 'queixa',
      title: 'Desenvolvimento da Queixa',
      description: 'Anamnese detalhada e história da doença atual',
      icon: <User className="w-6 h-6" />,
      color: 'green',
      steps: 6,
      completed: false
    },
    {
      id: 'patologica',
      title: 'História Patológica',
      description: 'Antecedentes médicos e cirúrgicos',
      icon: <Heart className="w-6 h-6" />,
      color: 'red',
      steps: 2,
      completed: false
    },
    {
      id: 'familiar',
      title: 'História Familiar',
      description: 'Antecedentes familiares e hereditários',
      icon: <Brain className="w-6 h-6" />,
      color: 'purple',
      steps: 4,
      completed: false
    },
    {
      id: 'habitos',
      title: 'Hábitos de Vida',
      description: 'Alimentação, exercícios e estilo de vida',
      icon: <Activity className="w-6 h-6" />,
      color: 'orange',
      steps: 2,
      completed: false
    },
    {
      id: 'medicacoes',
      title: 'Medicações',
      description: 'Uso atual e histórico de medicamentos',
      icon: <Stethoscope className="w-6 h-6" />,
      color: 'indigo',
      steps: 4,
      completed: false
    },
    {
      id: 'alergias',
      title: 'Alergias',
      description: 'Reações alérgicas e intolerâncias',
      icon: <AlertCircle className="w-6 h-6" />,
      color: 'yellow',
      steps: 2,
      completed: false
    },
    {
      id: 'fechamento',
      title: 'Fechamento Consensual',
      description: 'Síntese e validação das informações',
      icon: <CheckCircle className="w-6 h-6" />,
      color: 'emerald',
      steps: 1,
      completed: false
    }
  ]

  const getColorClasses = (color: string) => {
    const colors = {
      blue: 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-200',
      green: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-200',
      red: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-200',
      purple: 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-200',
      orange: 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-200',
      indigo: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/20 dark:text-indigo-200',
      yellow: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-200',
      emerald: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/20 dark:text-emerald-200'
    }
    return colors[color as keyof typeof colors] || colors.blue
  }

  const getIconColor = (color: string) => {
    const colors = {
      blue: 'text-blue-600',
      green: 'text-green-600',
      red: 'text-red-600',
      purple: 'text-purple-600',
      orange: 'text-orange-600',
      indigo: 'text-indigo-600',
      yellow: 'text-yellow-600',
      emerald: 'text-emerald-600'
    }
    return colors[color as keyof typeof colors] || colors.blue
  }

  return (
    <div className="min-h-screen">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white dark:text-white mb-2">
            Avaliação Clínica IMRE Triaxial
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            Sistema completo de avaliação clínica com 28 blocos especializados
          </p>
        </div>

        {/* Progress Overview */}
        <div className="card p-6 mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-white dark:text-white">
              Progresso da Avaliação
            </h2>
            <span className="text-sm text-gray-500 dark:text-gray-400">
              0 de 28 blocos concluídos
            </span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-3">
            <div className="bg-primary-600 h-3 rounded-full transition-all duration-300" style={{ width: '0%' }} />
          </div>
        </div>

        {/* IMRE Blocks Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {imreBlocks.map((block, index) => (
            <div
              key={block.id}
              className="card card-hover p-6 cursor-pointer"
              onClick={() => setCurrentStep(index)}
            >
              <div className="flex items-start space-x-4">
                <div className={`p-3 rounded-lg ${getColorClasses(block.color)}`}>
                  <div className={getIconColor(block.color)}>
                    {block.icon}
                  </div>
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-lg font-semibold text-white dark:text-white">
                      {block.title}
                    </h3>
                    {block.completed ? (
                      <CheckCircle className="w-5 h-5 text-green-500" />
                    ) : (
                      <Clock className="w-5 h-5 text-gray-400" />
                    )}
                  </div>
                  <p className="text-gray-600 dark:text-gray-300 text-sm mb-3">
                    {block.description}
                  </p>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {block.steps} etapas
                    </span>
                    <button className="text-primary-600 hover:text-primary-500 text-sm font-medium">
                      {block.completed ? 'Revisar' : 'Iniciar'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Assessment Form */}
        {currentStep !== null && (
          <div className="mt-8">
            <div className="card p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-white dark:text-white">
                  {imreBlocks[currentStep]?.title}
                </h2>
                <button
                  onClick={() => setCurrentStep(0)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  ✕
                </button>
              </div>
              
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Queixa Principal
                  </label>
                  <textarea
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-slate-100/50 dark:bg-slate-800/80 text-white dark:text-white"
                    rows={3}
                    placeholder="Descreva a queixa principal do paciente..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    História da Doença Atual
                  </label>
                  <textarea
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-slate-100/50 dark:bg-slate-800/80 text-white dark:text-white"
                    rows={4}
                    placeholder="Descreva detalhadamente a evolução dos sintomas..."
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Início dos Sintomas
                    </label>
                    <input
                      type="date"
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-slate-100/50 dark:bg-slate-800/80 text-white dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Intensidade (1-10)
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="10"
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-slate-100/50 dark:bg-slate-800/80 text-white dark:text-white"
                    />
                  </div>
                </div>

                <div className="flex justify-end space-x-4">
                  <button className="btn-secondary">
                    Salvar Rascunho
                  </button>
                  <button className="btn-primary">
                    Próxima Etapa
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Quick Actions */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="card p-6 text-center">
            <Stethoscope className="w-12 h-12 text-primary-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-white dark:text-white mb-2">
              Nova Avaliação
            </h3>
            <p className="text-gray-600 dark:text-gray-300 text-sm mb-4">
              Inicie uma nova avaliação clínica completa
            </p>
            <button className="btn-primary w-full">
              Começar
            </button>
          </div>

          <div className="card p-6 text-center">
            <FileText className="w-12 h-12 text-green-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-white dark:text-white mb-2">
              Relatórios
            </h3>
            <p className="text-gray-600 dark:text-gray-300 text-sm mb-4">
              Visualize e exporte relatórios gerados
            </p>
            <button className="btn-secondary w-full">
              Ver Relatórios
            </button>
          </div>

          <div className="card p-6 text-center">
            <Brain className="w-12 h-12 text-purple-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-white dark:text-white mb-2">
              IA Assistente
            </h3>
            <p className="text-gray-600 dark:text-gray-300 text-sm mb-4">
              Conte com a Nôa para auxiliar na avaliação
            </p>
            <button className="btn-secondary w-full">
              Ativar IA
            </button>
          </div>
        </div>

        {/* Seção de Conclusão e Compartilhamento */}
        <div className="mt-8 bg-gradient-to-r from-green-600 to-blue-600 rounded-lg p-6 text-white">
          <div className="text-center mb-6">
            <CheckCircle className="w-16 h-16 mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2">Avaliação Concluída!</h2>
            <p className="text-green-100">
              Sua avaliação clínica foi finalizada com sucesso. 
              Agora você pode compartilhar com seu médico ou baixar o relatório.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button
              onClick={() => setShowShareModal(true)}
              className="bg-white/20 hover:bg-white/30 text-white py-3 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center space-x-2"
            >
              <Activity className="w-5 h-5" />
              <span>Compartilhar com Médico</span>
            </button>
            
            <button className="bg-white/20 hover:bg-white/30 text-white py-3 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center space-x-2">
              <Activity className="w-5 h-5" />
              <span>Baixar Relatório</span>
            </button>
            
            <button className="bg-white/20 hover:bg-white/30 text-white py-3 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center space-x-2">
              <Activity className="w-5 h-5" />
              <span>Ver Detalhes</span>
            </button>
          </div>
        </div>
      </div>

      {/* Modal de Compartilhamento */}
      {showShareModal && (
        <ShareAssessment
          assessmentId="assessment-123"
          patientName="Paciente"
          onClose={() => setShowShareModal(false)}
        />
      )}
    </div>
  )
}

export default ClinicalAssessment
