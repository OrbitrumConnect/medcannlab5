import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { 
  CheckCircle, 
  Shield, 
  Heart, 
  Brain, 
  ArrowRight,
  FileText,
  User,
  Award,
  Zap
} from 'lucide-react'
import { useNoa } from '../contexts/NoaContext'
import NoaAnimatedAvatar from '../components/NoaAnimatedAvatar'

const PatientOnboarding: React.FC = () => {
  const navigate = useNavigate()
  const { toggleChat, sendMessage } = useNoa()
  const [currentStep, setCurrentStep] = useState(1)
  const [acceptedTerms, setAcceptedTerms] = useState(false)
  const [acceptedConsent, setAcceptedConsent] = useState(false)

  const steps = [
    {
      id: 1,
      title: 'NFT Escute-se',
      description: 'Bem-vindo ao MedCannLab. Você está prestes a iniciar sua jornada de cuidado personalizado.',
      icon: Shield
    },
    {
      id: 2,
      title: 'Consentimento Informado',
      description: 'Precisamos do seu consentimento para processar suas informações de saúde de forma segura e ética.',
      icon: FileText
    },
    {
      id: 3,
      title: 'Valores da Plataforma',
      description: 'Conheça os princípios que guiam nosso trabalho: Ética, Transparência, Respeito e Cuidado.',
      icon: Heart
    },
    {
      id: 4,
      title: 'Iniciar Avaliação Clínica',
      description: 'A IA residente Nôa Esperança irá conduzir sua avaliação clínica inicial.',
      icon: Brain
    }
  ]

  const handleNext = async () => {
    if (currentStep < 4) {
      setCurrentStep(currentStep + 1)
    } else {
      // Último passo: Navegar para página de chat unificada com IA residente
      // Enviar mensagem de inicialização da avaliação
      await sendMessage('Iniciar Avaliação Clínica Inicial IMRE Triaxial')
      // Navegar para página de chat unificada
      navigate('/app/chat-noa-esperanca')
    }
  }

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <div className="w-24 h-24 bg-gradient-to-r from-[#00c16a] to-[#00a85a] rounded-full flex items-center justify-center mx-auto mb-4">
                <Shield className="w-12 h-12 text-brand-text" />
              </div>
              <h3 className="text-2xl font-bold text-brand-text mb-2">NFT Escute-se</h3>
              <p className="text-brand-text-secondary">
                Seus dados são protegidos por blockchain e você tem total controle sobre suas informações.
              </p>
            </div>
            <div className="bg-brand-surface rounded-lg p-6 space-y-4">
              <div className="flex items-start space-x-3">
                <CheckCircle className="w-5 h-5 text-green-400 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-brand-text">Privacidade Total</h4>
                  <p className="text-sm text-brand-text-muted">Seus dados são criptografados e armazenados de forma segura</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <CheckCircle className="w-5 h-5 text-green-400 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-brand-text">Controle Completo</h4>
                  <p className="text-sm text-brand-text-muted">Você decide quem pode acessar suas informações</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <CheckCircle className="w-5 h-5 text-green-400 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-brand-text">Transparência</h4>
                  <p className="text-sm text-brand-text-muted">Todas as ações são registradas e auditáveis</p>
                </div>
              </div>
            </div>
          </div>
        )
      case 2:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <div className="w-24 h-24 bg-gradient-to-r from-[#00c16a] to-[#00a85a] rounded-full flex items-center justify-center mx-auto mb-4">
                <FileText className="w-12 h-12 text-brand-text" />
              </div>
              <h3 className="text-2xl font-bold text-brand-text mb-2">Consentimento Informado</h3>
              <p className="text-brand-text-secondary">
                Leia cuidadosamente e aceite os termos para continuar.
              </p>
            </div>
            <div className="bg-brand-surface rounded-lg p-6 space-y-4 max-h-96 overflow-y-auto">
              <div className="space-y-3">
                <p className="text-brand-text-secondary text-sm">
                  <strong className="text-brand-text">1. Coleta de Dados:</strong> Autorizo a coleta e processamento de meus dados de saúde.
                </p>
                <p className="text-brand-text-secondary text-sm">
                  <strong className="text-brand-text">2. IA Residente:</strong> Concordo que a IA Nôa Esperança conduza minha avaliação clínica.
                </p>
                <p className="text-brand-text-secondary text-sm">
                  <strong className="text-brand-text">3. Compartilhamento:</strong> Autorizo o compartilhamento de relatórios com meus profissionais.
                </p>
                <p className="text-brand-text-secondary text-sm">
                  <strong className="text-brand-text">4. Método AEC:</strong> Concordo com o uso da Arte da Entrevista Clínica.
                </p>
                <p className="text-brand-text-secondary text-sm">
                  <strong className="text-brand-text">5. LGPD:</strong> Compreendo que meus dados estão protegidos pela LGPD.
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <input
                type="checkbox"
                id="consent"
                checked={acceptedConsent}
                onChange={(e) => setAcceptedConsent(e.target.checked)}
                className="w-5 h-5 rounded border-slate-600 bg-brand-surface-subtle text-purple-500 focus:ring-purple-500"
              />
              <label htmlFor="consent" className="text-sm text-brand-text-secondary">
                Li e aceito o termo de consentimento informado
              </label>
            </div>
          </div>
        )
      case 3:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <div className="w-24 h-24 bg-gradient-to-r from-[#00c16a] to-[#00a85a] rounded-full flex items-center justify-center mx-auto mb-4">
                <Heart className="w-12 h-12 text-brand-text" />
              </div>
              <h3 className="text-2xl font-bold text-brand-text mb-2">Valores da Nôa Esperanza</h3>
              <p className="text-brand-text-secondary">
                Conheça os princípios que guiam nosso trabalho.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-brand-surface rounded-lg p-6">
                <div className="flex items-center space-x-3 mb-3">
                  <div className="w-10 h-10 bg-blue-500/20 rounded-full flex items-center justify-center">
                    <CheckCircle className="w-6 h-6 text-blue-400" />
                  </div>
                  <h4 className="font-semibold text-brand-text">Ética</h4>
                </div>
                <p className="text-sm text-brand-text-muted">
                  Transparência e honestidade em todas as interações clínicas
                </p>
              </div>
              <div className="bg-brand-surface rounded-lg p-6">
                <div className="flex items-center space-x-3 mb-3">
                  <div className="w-10 h-10 bg-green-500/20 rounded-full flex items-center justify-center">
                    <Shield className="w-6 h-6 text-green-400" />
                  </div>
                  <h4 className="font-semibold text-brand-text">Respeito</h4>
                </div>
                <p className="text-sm text-brand-text-muted">
                  Valorização da autonomia e dignidade do paciente
                </p>
              </div>
              <div className="bg-brand-surface rounded-lg p-6">
                <div className="flex items-center space-x-3 mb-3">
                  <div className="w-10 h-10 bg-purple-500/20 rounded-full flex items-center justify-center">
                    <Heart className="w-6 h-6 text-purple-400" />
                  </div>
                  <h4 className="font-semibold text-brand-text">Cuidado</h4>
                </div>
                <p className="text-sm text-brand-text-muted">
                  Atenção personalizada e acompanhamento contínuo
                </p>
              </div>
              <div className="bg-brand-surface rounded-lg p-6">
                <div className="flex items-center space-x-3 mb-3">
                  <div className="w-10 h-10 bg-yellow-500/20 rounded-full flex items-center justify-center">
                    <Brain className="w-6 h-6 text-yellow-400" />
                  </div>
                  <h4 className="font-semibold text-brand-text">Excelência</h4>
                </div>
                <p className="text-sm text-brand-text-muted">
                  Busca constante por inovação e melhores práticas
                </p>
              </div>
            </div>
          </div>
        )
      case 4:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <div className="mb-6">
                <NoaAnimatedAvatar
                  isSpeaking={false}
                  isListening={false}
                  size="lg"
                  showStatus={true}
                />
              </div>
              <h3 className="text-2xl font-bold text-brand-text mb-2">Nôa Esperança - IA Residente</h3>
              <p className="text-brand-text-secondary">
                Está pronta para conduzir sua avaliação clínica inicial.
              </p>
            </div>
            <div className="bg-brand-surface rounded-lg p-6 space-y-4">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-gradient-to-r from-[#00c16a] to-[#00a85a] rounded-full flex items-center justify-center">
                  <Brain className="w-6 h-6 text-brand-text" />
                </div>
                <div>
                  <h4 className="font-semibold text-brand-text">Avaliação IMRE Triaxial</h4>
                  <p className="text-sm text-brand-text-muted">Metodologia Arte da Entrevista Clínica (AEC)</p>
                </div>
              </div>
              <div className="space-y-2 text-sm text-brand-text-secondary">
                <p>• 28 blocos semânticos estruturados</p>
                <p>• Monitoramento renal integrado</p>
                <p>• Análise profunda e ética</p>
                <p>• Duração aproximada: 10-15 minutos</p>
              </div>
              <div className="bg-purple-500/10 border border-purple-500/30 rounded-lg p-4">
                <p className="text-sm text-purple-200">
                  💡 <strong>Dica:</strong> Responda com sinceridade para obter um diagnóstico mais preciso
                </p>
              </div>
            </div>
          </div>
        )
      default:
        return null
    }
  }

  const canProceed = () => {
    if (currentStep === 2) {
      return acceptedConsent
    }
    return true
  }

  return (
    <div className="min-h-screen bg-brand-bg text-brand-text">
      {/* Header */}
      <div className="bg-brand-surface border-b border-brand-border p-6">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-2xl font-bold text-brand-text">Bem-vindo ao MedCannLab</h1>
          <p className="text-brand-text-muted">Sua jornada de cuidado personalizado começa aqui</p>
        </div>
      </div>

      {/* Progress Steps */}
      <div className="bg-brand-surface border-b border-brand-border py-6">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between">
            {steps.map((step, index) => (
              <React.Fragment key={step.id}>
                <div className="flex flex-col items-center">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                    currentStep >= step.id ? 'bg-purple-500' : 'bg-brand-surface-subtle'
                  }`}>
                    <step.icon className={`w-6 h-6 ${
                      currentStep >= step.id ? 'text-brand-text' : 'text-brand-text-muted'
                    }`} />
                  </div>
                  <p className={`text-xs mt-2 ${currentStep >= step.id ? 'text-brand-text' : 'text-brand-text-muted'}`}>
                    {step.title}
                  </p>
                </div>
                {index < steps.length - 1 && (
                  <div className={`flex-1 h-1 mx-4 ${
                    currentStep > step.id ? 'bg-purple-500' : 'bg-brand-surface-subtle'
                  }`} />
                )}
              </React.Fragment>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-brand-surface rounded-xl p-8">
          {renderStepContent()}

          {/* Navigation Buttons */}
          <div className="flex items-center justify-between mt-8">
            <button
              onClick={handlePrevious}
              disabled={currentStep === 1}
              className={`px-6 py-3 rounded-lg font-semibold transition-colors ${
                currentStep === 1
                  ? 'bg-brand-surface-subtle text-brand-text-muted cursor-not-allowed'
                  : 'bg-slate-600 text-brand-text hover:bg-slate-500'
              }`}
            >
              Voltar
            </button>
            <button
              onClick={handleNext}
              disabled={!canProceed()}
              className={`px-6 py-3 rounded-lg font-semibold flex items-center space-x-2 transition-colors ${
                canProceed()
                  ? 'bg-gradient-to-r from-[#00c16a] to-[#00a85a] text-brand-text hover:from-purple-600 hover:to-pink-600'
                  : 'bg-brand-surface-subtle text-brand-text-muted cursor-not-allowed'
              }`}
            >
              <span>{currentStep === 4 ? 'Iniciar Avaliação' : 'Continuar'}</span>
              {currentStep < 4 && <ArrowRight className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default PatientOnboarding
