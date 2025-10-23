import React, { useState } from 'react'
import { 
  Mic, 
  MicOff, 
  Video, 
  VideoOff, 
  Send, 
  User, 
  FileText, 
  Clock,
  Heart,
  Brain,
  Activity
} from 'lucide-react'

const PreAnamnese: React.FC = () => {
  const [isRecording, setIsRecording] = useState(false)
  const [isVideoOn, setIsVideoOn] = useState(false)
  const [currentStep, setCurrentStep] = useState(0)
  const [messages, setMessages] = useState([
    {
      id: 1,
      type: 'noa',
      content: 'Olá! Sou a Nôa, sua assistente médica. Vou te ajudar a fazer sua pré-anamnese usando a metodologia AEC (Arte da Entrevista Clínica). Vamos começar?',
      timestamp: new Date()
    }
  ])
  const [userInput, setUserInput] = useState('')

  const aecSteps = [
    {
      id: 0,
      title: 'Apresentação e Acolhimento',
      description: 'Criar vínculo e ambiente de confiança',
      questions: [
        'Como você está se sentindo hoje?',
        'O que te trouxe até aqui?',
        'Como posso te ajudar?'
      ]
    },
    {
      id: 1,
      title: 'Escuta Ativa',
      description: 'Compreender a queixa principal',
      questions: [
        'Conte-me mais sobre seus sintomas',
        'Quando começaram?',
        'Como você descreveria a intensidade?'
      ]
    },
    {
      id: 2,
      title: 'Exploração Detalhada',
      description: 'Aprofundar o histórico',
      questions: [
        'Você já teve algo similar antes?',
        'Há algo que melhora ou piora?',
        'Como isso afeta seu dia a dia?'
      ]
    },
    {
      id: 3,
      title: 'Contextualização',
      description: 'Entender o contexto de vida',
      questions: [
        'Como está sua vida pessoal?',
        'Há algum estresse recente?',
        'Como você se cuida normalmente?'
      ]
    }
  ]

  const handleSendMessage = () => {
    if (userInput.trim()) {
      const newMessage = {
        id: messages.length + 1,
        type: 'user',
        content: userInput,
        timestamp: new Date()
      }
      setMessages(prev => [...prev, newMessage])
      setUserInput('')
      
      // Simular resposta da Nôa
      setTimeout(() => {
        const noaResponse = {
          id: messages.length + 2,
          type: 'noa',
          content: 'Entendo. Pode me contar mais detalhes sobre isso?',
          timestamp: new Date()
        }
        setMessages(prev => [...prev, noaResponse])
      }, 1000)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const startRecording = () => {
    setIsRecording(true)
    // Simular gravação
    setTimeout(() => {
      setIsRecording(false)
    }, 3000)
  }

  const generateReport = () => {
    // Simular geração de relatório
    console.log('Gerando relatório da pré-anamnese...')
  }

  return (
    <div className="min-h-screen">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white dark:text-slate-900 dark:text-white mb-2">
            Pré-Anamnese com Nôa
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            Metodologia AEC - Arte da Entrevista Clínica para uma consulta humanizada
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Chat com Nôa */}
          <div className="lg:col-span-2">
            <div className="card h-[600px] flex flex-col">
              {/* Chat Header */}
              <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-slate-900 dark:text-white p-6 rounded-t-lg">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-slate-800/20 rounded-full flex items-center justify-center">
                    <span className="text-2xl">🤖</span>
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold">Nôa - Assistente Médica</h2>
                    <p className="text-blue-100">IA Residente especializada em AEC</p>
                  </div>
                  <div className="ml-auto flex items-center space-x-2">
                    <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
                    <span className="text-sm">Online</span>
                  </div>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-xs lg:max-w-md px-4 py-3 rounded-lg ${
                        message.type === 'user'
                          ? 'bg-blue-600 text-slate-900 dark:text-white'
                          : 'bg-gray-100 dark:bg-gray-700 text-slate-900 dark:text-white dark:text-slate-900 dark:text-white'
                      }`}
                    >
                      <p className="text-sm">{message.content}</p>
                      <p className="text-xs opacity-70 mt-1">
                        {message.timestamp.toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Input Area */}
              <div className="border-t border-gray-200 dark:border-gray-700 p-4">
                <div className="flex items-center space-x-2">
                  <button
                    onClick={startRecording}
                    className={`p-2 rounded-lg transition-colors duration-200 ${
                      isRecording
                        ? 'bg-red-100 text-red-600'
                        : 'text-gray-600 hover:text-red-600 hover:bg-red-50'
                    }`}
                  >
                    {isRecording ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                  </button>
                  
                  <button
                    onClick={() => setIsVideoOn(!isVideoOn)}
                    className={`p-2 rounded-lg transition-colors duration-200 ${
                      isVideoOn
                        ? 'bg-blue-100 text-blue-600'
                        : 'text-gray-600 hover:text-blue-600 hover:bg-blue-50'
                    }`}
                  >
                    {isVideoOn ? <VideoOff className="w-5 h-5" /> : <Video className="w-5 h-5" />}
                  </button>

                  <div className="flex-1">
                    <input
                      type="text"
                      value={userInput}
                      onChange={(e) => setUserInput(e.target.value)}
                      onKeyPress={handleKeyPress}
                      placeholder="Digite sua resposta ou use o microfone..."
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-slate-100/50 dark:bg-slate-800/80 text-slate-900 dark:text-white dark:text-slate-900 dark:text-white"
                    />
                  </div>

                  <button
                    onClick={handleSendMessage}
                    className="p-2 bg-blue-600 text-slate-900 dark:text-white rounded-lg hover:bg-blue-700 transition-colors duration-200"
                  >
                    <Send className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar - AEC Steps */}
          <div className="space-y-6">
            {/* Current Step */}
            <div className="card p-6">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white dark:text-slate-900 dark:text-white mb-4">
                Etapa Atual - AEC
              </h3>
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                    <span className="text-blue-600 dark:text-blue-400 font-semibold">
                      {currentStep + 1}
                    </span>
                  </div>
                  <div>
                    <h4 className="font-medium text-slate-900 dark:text-white dark:text-slate-900 dark:text-white">
                      {aecSteps[currentStep]?.title}
                    </h4>
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                      {aecSteps[currentStep]?.description}
                    </p>
                  </div>
                </div>

                <div className="space-y-2">
                  <h5 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Perguntas sugeridas:
                  </h5>
                  {aecSteps[currentStep]?.questions.map((question, index) => (
                    <div key={index} className="text-sm text-gray-600 dark:text-gray-400 bg-slate-900 dark:bg-slate-900 dark:bg-gray-700 p-2 rounded">
                      {question}
                    </div>
                  ))}
                </div>

                <div className="flex space-x-2">
                  <button
                    onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
                    className="flex-1 btn-secondary text-sm"
                    disabled={currentStep === 0}
                  >
                    Anterior
                  </button>
                  <button
                    onClick={() => setCurrentStep(Math.min(aecSteps.length - 1, currentStep + 1))}
                    className="flex-1 btn-primary text-sm"
                    disabled={currentStep === aecSteps.length - 1}
                  >
                    Próxima
                  </button>
                </div>
              </div>
            </div>

            {/* Progress */}
            <div className="card p-6">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white dark:text-slate-900 dark:text-white mb-4">
                Progresso da Anamnese
              </h3>
              <div className="space-y-4">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-300">Completude</span>
                  <span className="text-slate-900 dark:text-white dark:text-slate-900 dark:text-white font-medium">
                    {Math.round((currentStep / aecSteps.length) * 100)}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${(currentStep / aecSteps.length) * 100}%` }}
                  />
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-300">
                  {aecSteps.length - currentStep} etapas restantes
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="card p-6">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white dark:text-slate-900 dark:text-white mb-4">
                Ações
              </h3>
              <div className="space-y-3">
                <button className="w-full btn-primary flex items-center justify-center">
                  <span className="mr-2">▶️</span>
                  Iniciar Gravação
                </button>
                <button className="w-full btn-secondary flex items-center justify-center">
                  <span className="mr-2">⏸️</span>
                  Pausar
                </button>
                <button className="w-full btn-secondary flex items-center justify-center">
                  <span className="mr-2">🔄</span>
                  Reiniciar
                </button>
                <button
                  onClick={generateReport}
                  className="w-full bg-green-600 hover:bg-green-700 text-slate-900 dark:text-white py-2 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center"
                >
                  <FileText className="w-4 h-4 mr-2" />
                  Gerar Relatório
                </button>
                <button className="w-full btn-secondary flex items-center justify-center">
                  <span className="mr-2">⬇️</span>
                  Exportar
                </button>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="card p-6">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white dark:text-slate-900 dark:text-white mb-4">
                Estatísticas
              </h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Clock className="w-4 h-4 text-blue-600" />
                    <span className="text-sm text-gray-600 dark:text-gray-300">Duração</span>
                  </div>
                  <span className="text-sm font-medium text-slate-900 dark:text-white dark:text-slate-900 dark:text-white">15 min</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Heart className="w-4 h-4 text-red-600" />
                    <span className="text-sm text-gray-600 dark:text-gray-300">Sintomas</span>
                  </div>
                  <span className="text-sm font-medium text-slate-900 dark:text-white dark:text-slate-900 dark:text-white">3</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Brain className="w-4 h-4 text-purple-600" />
                    <span className="text-sm text-gray-600 dark:text-gray-300">IA Insights</span>
                  </div>
                  <span className="text-sm font-medium text-slate-900 dark:text-white dark:text-slate-900 dark:text-white">5</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Activity className="w-4 h-4 text-green-600" />
                    <span className="text-sm text-gray-600 dark:text-gray-300">Progresso</span>
                  </div>
                  <span className="text-sm font-medium text-slate-900 dark:text-white dark:text-slate-900 dark:text-white">75%</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default PreAnamnese
