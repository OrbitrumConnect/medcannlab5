import React, { useEffect, useRef } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import NoaAnimatedAvatar from '../components/NoaAnimatedAvatar'
import NoaConversationalInterface from '../components/NoaConversationalInterface'
import { useNoaPlatform } from '../contexts/NoaPlatformContext'
import { useAuth } from '../contexts/AuthContext'

const PatientNOAChat: React.FC = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { sendInitialMessage, openChat } = useNoaPlatform()
  const { user } = useAuth()
  const hasInitiatedRef = useRef(false)

  // Verificar se está em modo embed
  const searchParams = new URLSearchParams(location.search)
  const isEmbed = searchParams.get('embed') === 'true'

  // Verificar se veio do agendamento e iniciar avaliação automaticamente
  useEffect(() => {
    // REMOVIDO: Não abrir chat flutuante automaticamente
    // O chat será renderizado inline

    const state = location.state as {
      startAssessment?: boolean;
      appointmentData?: any;
      targetProfessional?: { name: string; specialty: string }
    }

    if (state?.startAssessment && !hasInitiatedRef.current && user) {
      hasInitiatedRef.current = true

      // Aguardar para garantir que o chat esteja pronto antes de enviar mensagem
      setTimeout(() => {
        let assessmentPrompt = `Iniciar Avaliação Clínica Inicial IMRE Triaxial.`

        if (state.targetProfessional) {
          assessmentPrompt += ` Gostaria de realizar minha avaliação para posterior agendamento com ${state.targetProfessional.name} (${state.targetProfessional.specialty}).`
        } else {
          assessmentPrompt += ` Acabei de solicitar uma avaliação clínica.`
        }

        if (state.appointmentData) {
          assessmentPrompt += `\n\nDetalhes do agendamento prévio:\n- Data: ${state.appointmentData?.date || 'Não informado'}\n- Horário: ${state.appointmentData?.time || 'Não informado'}`
        }

        assessmentPrompt += `\n\nPor favor, inicie o protocolo IMRE para minha avaliação clínica inicial.`

        sendInitialMessage(assessmentPrompt)
      }, 1500)
    }
  }, [location.state, sendInitialMessage, user])

  // Se estiver em modo embed, renderizar apenas o conteúdo sem header
  if (isEmbed) {
    return (
      <div className="bg-slate-900 min-h-screen h-full w-full">
        <div className="h-full flex flex-col">
          {/* Interface Conversacional - Expandida no modo embed */}
          <div className="flex-1 min-h-0 relative">
            <NoaConversationalInterface
              userName={user?.name || 'Paciente'}
              userCode={user?.id || 'PATIENT-001'}
              position="inline"
              hideButton={true}
            />
          </div>
        </div>
      </div>
    )
  }

  // Modo normal (não embed) - renderizar com header
  return (
    <div className="bg-slate-900 min-h-screen flex flex-col">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 flex-shrink-0">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <button
            onClick={() => navigate('/app/clinica/paciente/dashboard')}
            className="flex items-center space-x-2 text-slate-300 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Voltar ao Dashboard</span>
          </button>
          <div className="text-center">
            <h1 className="text-2xl font-bold text-white flex items-center gap-2">
              <span className="text-3xl">🤖</span> Nôa Esperança
            </h1>
            <p className="text-slate-400 text-sm">IA Residente • Avaliação Clínica</p>
          </div>
          <div className="w-32"></div>
        </div>
      </div>

      <div className="flex-1 container mx-auto px-4 sm:px-6 lg:px-8 pb-8 min-h-0">
        <div className="max-w-6xl mx-auto h-[calc(100vh-140px)] bg-slate-800/50 rounded-2xl border border-slate-700 overflow-hidden relative shadow-2xl">
          <NoaConversationalInterface
            userName={user?.name || 'Paciente'}
            userCode={user?.id || 'PATIENT-001'}
            position="inline"
            hideButton={true}
          />
        </div>
      </div>
    </div>
  )
}

export default PatientNOAChat