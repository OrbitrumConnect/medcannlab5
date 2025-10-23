import React, { useState, useRef, useEffect } from 'react'
import { 
  Send, 
  Phone, 
  Video, 
  Paperclip, 
  Smile, 
  Mic, 
  MicOff,
  Clock,
  CheckCircle,
  AlertCircle
} from 'lucide-react'

const PatientChat: React.FC = () => {
  const [message, setMessage] = useState('')
  const [isRecording, setIsRecording] = useState(false)
  const [isVideoCall, setIsVideoCall] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const messages = [
    {
      id: 1,
      user: 'Dr. João Silva',
      avatar: 'JS',
      message: 'Olá! Como você está se sentindo hoje?',
      timestamp: '10:30',
      isDoctor: true,
      reactions: { heart: 0, thumbs: 0 }
    },
    {
      id: 2,
      user: 'Você',
      avatar: 'V',
      message: 'Olá doutor! Estou me sentindo melhor, mas ainda tenho algumas dores.',
      timestamp: '10:32',
      isDoctor: false,
      reactions: { heart: 0, thumbs: 0 }
    },
    {
      id: 3,
      user: 'Dr. João Silva',
      avatar: 'JS',
      message: 'Entendo. Vamos agendar uma consulta para avaliar melhor. Que tal amanhã às 14h?',
      timestamp: '10:35',
      isDoctor: true,
      reactions: { heart: 0, thumbs: 0 }
    }
  ]

  const handleSendMessage = () => {
    if (message.trim()) {
      // Lógica para enviar mensagem
      setMessage('')
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const startRecording = () => {
    setIsRecording(!isRecording)
  }

  const startVideoCall = () => {
    setIsVideoCall(!isVideoCall)
  }

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  return (
    <div className="min-h-screen bg-slate-900 p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-4">
            Chat com Meu Médico
          </h1>
          <p className="text-slate-300 text-lg">
            Converse diretamente com seu médico responsável
          </p>
        </div>

        {/* Status de Espera */}
        <div className="bg-orange-500/20 border border-orange-500/50 rounded-lg p-4 mb-6">
          <div className="flex items-center space-x-3">
            <Clock className="w-5 h-5 text-orange-400" />
            <div>
              <p className="text-orange-200 font-medium">Tempo de Resposta: 1 hora</p>
              <p className="text-orange-300 text-sm">
                Se não obtiver resposta em 1 hora, aguarde o próximo horário disponível.
              </p>
            </div>
          </div>
        </div>

        {/* Chat Container */}
        <div className="bg-slate-800/80 rounded-lg shadow-2xl overflow-hidden">
          {/* Chat Header */}
          <div className="bg-slate-700/50 px-6 py-4 border-b border-slate-600">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-primary-600 rounded-full flex items-center justify-center">
                  <span className="text-sm font-medium text-white">JS</span>
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-white">Dr. João Silva</h2>
                  <p className="text-slate-300 text-sm">Médico Responsável</p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={startVideoCall}
                  className="p-2 text-slate-400 hover:text-blue-500 transition-colors duration-200"
                >
                  {isVideoCall ? <Video className="w-5 h-5" /> : <Video className="w-5 h-5" />}
                </button>
                <button className="p-2 text-slate-400 hover:text-green-500 transition-colors duration-200">
                  <Phone className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>

          {/* Messages */}
          <div className="h-96 overflow-y-auto p-6 space-y-4">
            {messages.map((msg) => (
              <div key={msg.id} className={`flex items-start space-x-3 ${msg.isDoctor ? 'justify-start' : 'justify-end'}`}>
                {msg.isDoctor && (
                  <div className="w-8 h-8 bg-primary-600 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-xs font-medium text-white">{msg.avatar}</span>
                  </div>
                )}
                <div className={`max-w-xs lg:max-w-md px-4 py-3 rounded-lg ${
                  msg.isDoctor 
                    ? 'bg-slate-700 text-white' 
                    : 'bg-primary-600 text-white'
                }`}>
                  <div className="flex items-center space-x-2 mb-1">
                    <span className="text-sm font-medium">{msg.user}</span>
                    <span className="text-xs opacity-70">{msg.timestamp}</span>
                  </div>
                  <p className="text-sm">{msg.message}</p>
                </div>
                {!msg.isDoctor && (
                  <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-xs font-medium text-white">{msg.avatar}</span>
                  </div>
                )}
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* Message Input */}
          <div className="bg-slate-700/50 px-6 py-4 border-t border-slate-600">
            <div className="flex items-center space-x-3">
              <button className="p-2 text-slate-400 hover:text-blue-500 transition-colors duration-200">
                <Paperclip className="w-5 h-5" />
              </button>
              <div className="flex-1">
                <input
                  type="text"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Digite sua mensagem..."
                  className="w-full px-4 py-2 border border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-slate-700 text-white placeholder-slate-400"
                />
              </div>
              <button className="p-2 text-slate-400 hover:text-yellow-500 transition-colors duration-200">
                <Smile className="w-5 h-5" />
              </button>
              <button
                onClick={startRecording}
                className={`p-2 transition-colors duration-200 ${
                  isRecording 
                    ? 'text-red-600 bg-red-100 dark:bg-red-900/20' 
                    : 'text-slate-400 hover:text-red-500'
                }`}
              >
                {isRecording ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
              </button>
              <button
                onClick={handleSendMessage}
                className="p-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors duration-200"
              >
                <Send className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Informações Importantes */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-slate-800/80 rounded-lg p-6 text-center">
            <Clock className="w-8 h-8 text-blue-400 mx-auto mb-3" />
            <h3 className="text-white font-medium mb-2">Horário de Atendimento</h3>
            <p className="text-slate-300 text-sm">Seg-Sex: 8h às 18h</p>
          </div>
          <div className="bg-slate-800/80 rounded-lg p-6 text-center">
            <AlertCircle className="w-8 h-8 text-orange-400 mx-auto mb-3" />
            <h3 className="text-white font-medium mb-2">Emergência</h3>
            <p className="text-slate-300 text-sm">Use o chat de emergência</p>
          </div>
          <div className="bg-slate-800/80 rounded-lg p-6 text-center">
            <CheckCircle className="w-8 h-8 text-green-400 mx-auto mb-3" />
            <h3 className="text-white font-medium mb-2">Próxima Consulta</h3>
            <p className="text-slate-300 text-sm">15/01/2024 - 14:00</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default PatientChat
