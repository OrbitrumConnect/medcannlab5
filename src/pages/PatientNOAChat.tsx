import React, { useState, useEffect, useRef } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { ArrowLeft, Send, Loader2, Brain, Volume2, VolumeX, Mic, MicOff } from 'lucide-react'
import { useNoaPlatform } from '../contexts/NoaPlatformContext'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import { getNoaAssistantIntegration } from '../lib/noaAssistantIntegration'
import { getNoaTrainingSystem } from '../lib/noaTrainingSystem'

const PatientNOAChat: React.FC = () => {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { user } = useAuth()
  const { sendInitialMessage } = useNoaPlatform()
  
  // Verificar se veio do dashboard para iniciar avaliação
  const shouldStartAssessment = searchParams.get('startAssessment') === 'true'
  
  // Usar o MESMO sistema do balão flutuante
  const assistantIntegration = getNoaAssistantIntegration()
  const trainingSystem = getNoaTrainingSystem()
  
  const [messages, setMessages] = useState<Array<{
    role: 'user' | 'noa'
    content: string
    timestamp: Date
  }>>([])
  const [inputMessage, setInputMessage] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [isResponding, setIsResponding] = useState(false) // Novo estado para quando a resposta está chegando
  const [avatarUrl, setAvatarUrl] = useState<string>('https://via.placeholder.com/200x200/8B5CF6/FFFFFF?text=N')
  const [isInitialized, setIsInitialized] = useState(false)
  const [hasWelcomed, setHasWelcomed] = useState(false)
  const [sentInitialMessage, setSentInitialMessage] = useState(false)
  const [audioEnabled, setAudioEnabled] = useState(true) // Controle de áudio
  const [isRecording, setIsRecording] = useState(false) // Estado de gravação
  const sendingRef = useRef(false) // Ref para proteger contra duplicação
  const recognitionRef = useRef<any>(null) // Ref para Speech Recognition
  
  // Função para ler texto com voz feminina
  const speakWithVoice = (text: string) => {
    if ('speechSynthesis' in window) {
      // Cancelar qualquer fala anterior
      window.speechSynthesis.cancel()
      
      const utterance = new SpeechSynthesisUtterance(text)
      
      // Configurar para voz feminina
      utterance.lang = 'pt-BR'
      utterance.rate = 0.9 // Velocidade natural
      utterance.pitch = 1.2 // Tom mais agudo (voz feminina)
      utterance.volume = 0.8
      
      // Tentar encontrar voz feminina em português
      const voices = window.speechSynthesis.getVoices()
      const ptBRFemaleVoice = voices.find(voice => 
        voice.lang.includes('pt') && voice.name.toLowerCase().includes('female')
      ) || voices.find(voice => voice.lang.includes('pt'))
      
      if (ptBRFemaleVoice) {
        utterance.voice = ptBRFemaleVoice
      }
      
      // Eventos para controlar o vídeo
      utterance.onstart = () => {
        console.log('🔊 Iniciando leitura de voz...')
        setIsResponding(true)
      }
      
      utterance.onend = () => {
        console.log('✅ Leitura concluída')
        setIsResponding(false)
      }
      
      utterance.onerror = () => {
        console.error('❌ Erro na leitura de voz')
        setIsResponding(false)
      }
      
      window.speechSynthesis.speak(utterance)
    } else {
      console.warn('⚠️ Web Speech API não disponível')
    }
  }

  // Buscar avatar da Nôa no Supabase (mesmo do balão flutuante)
  useEffect(() => {
    const fetchAvatarUrl = async () => {
      try {
        console.log('🔍 Buscando avatar da Nôa no Supabase...')
        const { data, error } = await supabase.storage
          .from('avatar')
          .list('', {
            limit: 1,
            sortBy: { column: 'created_at', order: 'desc' }
          })

        if (error) {
          console.warn('❌ Erro ao buscar avatar:', error)
          return
        }

        if (data && data.length > 0) {
          const { data: { publicUrl } } = supabase.storage
            .from('avatar')
            .getPublicUrl(data[0].name)
          
          console.log('✅ Avatar da Nôa encontrado:', publicUrl)
          const urlWithCache = `${publicUrl}?t=${Date.now()}`
          setAvatarUrl(urlWithCache)
        }
      } catch (error) {
        console.warn('❌ Erro ao buscar avatar da Nôa:', error)
      }
    }

    fetchAvatarUrl()
  }, [])

  // Parar áudio quando componente desmontar (mudança de rota)
  useEffect(() => {
    return () => {
      // Limpar ao desmontar componente
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel()
      }
      // Parar gravação se estiver ativa
      if (recognitionRef.current) {
        recognitionRef.current.stop()
      }
      console.log('🔇 Áudio cancelado ao sair da página')
    }
  }, [])
  
  // Inicializar Speech Recognition
  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition
      recognitionRef.current = new SpeechRecognition()
      
      recognitionRef.current.continuous = false
      recognitionRef.current.interimResults = false
      recognitionRef.current.lang = 'pt-BR'
      
      recognitionRef.current.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript
        setInputMessage(transcript)
        setIsRecording(false)
        
        // Auto-enviar após 1 segundo
        setTimeout(() => {
          if (transcript.trim()) {
            handleSendMessage()
          }
        }, 1000)
      }
      
      recognitionRef.current.onerror = () => {
        setIsRecording(false)
      }
      
      recognitionRef.current.onend = () => {
        setIsRecording(false)
      }
    }
  }, [])

  // Registrar usuário no sistema de treinamento + Iniciar avaliação IMRE automaticamente
  useEffect(() => {
    console.log('🔍 useEffect - user:', user?.name, 'hasWelcomed:', hasWelcomed, 'sentInitialMessage:', sentInitialMessage, 'shouldStartAssessment:', shouldStartAssessment)
    
    if (user && !hasWelcomed && !sentInitialMessage && shouldStartAssessment) {
      console.log('✅ Condição satisfeita! Registrando usuário e enviando IMRE...')
      
      // Mapear tipo de usuário para o sistema de treinamento
      let role = 'professional' as 'developer' | 'admin' | 'professional' | 'observer'
      if (user.type === 'admin') role = 'admin'
      else if (user.type === 'professional') role = 'professional'
      else if (user.type === 'patient') role = 'professional' // Paciente como professional
      else role = 'observer'
      
      trainingSystem.registerUser(user.id, user.name || 'Usuário', role, ['full'])
      setHasWelcomed(true)
      setSentInitialMessage(true) // Marcar que já enviou
      
      console.log('📝 Iniciando avaliação IMRE automaticamente...')
      
      // Enviar mensagem IMRE automaticamente (SEMPRE quando abre o chat vindo do dashboard)
      const imrePrompt = `Olá Nôa! Sou ${user.name} e gostaria de realizar uma Avaliação Clínica Inicial seguindo o protocolo IMRE (Investigação, Metodologia, Resultado, Evolução) da Arte da Entrevista Clínica aplicada à Cannabis Medicinal. Por favor, inicie o protocolo IMRE para minha avaliação clínica inicial e, ao final, gere um relatório clínico que será salvo no meu dashboard.`
      
      console.log('💬 Mensagem IMRE:', imrePrompt)
      
      // Primeiro inicializar
      setIsInitialized(true)
      
      // Enviar automaticamente como se o usuário tivesse digitado
      // Usar requestAnimationFrame para garantir que o estado foi atualizado
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          console.log('⏰ Executando handleSendMessageAutomatically...')
          handleSendMessageAutomatically(imrePrompt)
        })
      })
    } else {
      console.log('⚠️ Condição NÃO satisfeita - user:', !!user, 'hasWelcomed:', hasWelcomed, 'sentInitialMessage:', sentInitialMessage)
    }
  }, [user, hasWelcomed, sentInitialMessage])
  
  // Função para enviar mensagem automaticamente
  const handleSendMessageAutomatically = async (message: string) => {
    // Proteger contra execução duplicada
    if (sendingRef.current) {
      console.log('⚠️ Mensagem já sendo enviada, ignorando duplicata...')
      return
    }
    
    sendingRef.current = true
    console.log('🚀 handleSendMessageAutomatically chamado! Enviando mensagem IMRE...')
    
    const userMessage = {
      role: 'user' as const,
      content: message,
      timestamp: new Date()
    }
    setMessages([userMessage])
    setIsTyping(true)
    
    try {
      // Registrar no sistema de treinamento
      trainingSystem.addConversationMessage({
        role: 'user',
        content: message,
        context: {
          route: '/app/patient-noa-chat',
          userCode: user?.id || '',
          userId: user?.id || ''
        }
      })
      
      // Processar com IA (híbrido)
      const response = await assistantIntegration.sendMessage(
        message,
        user?.id,
        '/app/patient-noa-chat'
      )
      
      const noaMessage = {
        role: 'noa' as const,
        content: response.content,
        timestamp: new Date()
      }
      
      setMessages(prev => [...prev, noaMessage])
      
      // Parar loading
      setIsTyping(false)
      
      // Registrar resposta da Nôa
      trainingSystem.addConversationMessage({
        role: 'noa',
        content: response.content,
        context: {
          route: '/app/patient-noa-chat',
          userCode: user?.id || '',
          userId: user?.id || ''
        }
      })
      
      // LER a mensagem com voz feminina (se habilitado)
      if (audioEnabled) {
        speakWithVoice(response.content)
      }
    } catch (error) {
      console.error('Erro ao processar mensagem:', error)
      setIsTyping(false)
      setIsResponding(false)
    } finally {
      sendingRef.current = false // Liberar para próxima mensagem
    }
  }

  const handleSendMessage = async () => {
    const message = inputMessage.trim()
    if (!message || isTyping || !isInitialized) return

    // Adicionar mensagem do usuário
    const userMessage = {
      role: 'user' as const,
      content: message,
      timestamp: new Date()
    }
    setMessages(prev => [...prev, userMessage])
    setInputMessage('') // Limpar campo imediatamente
    setIsTyping(true)

    try {
      // Registrar no sistema de treinamento
      trainingSystem.addConversationMessage({
        role: 'user',
        content: message,
        context: {
          route: '/app/patient-noa-chat',
          userCode: user?.id || '',
          userId: user?.id || ''
        }
      })

      // Processar com IA (híbrido - MESMO do balão)
      const response = await assistantIntegration.sendMessage(
        message,
        user?.id,
        '/app/patient-noa-chat'
      )

      const noaMessage = {
        role: 'noa' as const,
        content: response.content,
        timestamp: new Date()
      }

      setMessages(prev => [...prev, noaMessage])
      
      // Parar loading
      setIsTyping(false)
      
      // Registrar resposta da Nôa
      trainingSystem.addConversationMessage({
        role: 'noa',
        content: response.content,
        context: {
          route: '/app/patient-noa-chat',
          userCode: user?.id || '',
          userId: user?.id || ''
        }
      })
      
      // LER a mensagem com voz feminina (se habilitado)
      if (audioEnabled) {
        speakWithVoice(response.content)
      }
    } catch (error) {
      console.error('Erro ao processar mensagem:', error)
      setIsTyping(false)
      setIsResponding(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }
  
  // Iniciar/parar gravação de voz
  const toggleRecording = () => {
    if (!recognitionRef.current) {
      alert('⚠️ Reconhecimento de voz não disponível neste navegador')
      return
    }
    
    if (isRecording) {
      recognitionRef.current.stop()
      setIsRecording(false)
      console.log('⏹️ Gravação parada')
    } else {
      recognitionRef.current.start()
      setIsRecording(true)
      console.log('🎤 Gravando...')
    }
  }

  return (
    <div className="bg-slate-900 min-h-screen flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b border-slate-800">
        <button 
          onClick={() => navigate('/app/patient-dashboard')}
          className="flex items-center space-x-2 text-slate-300 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Voltar</span>
        </button>
        <div className="text-center flex items-center justify-center space-x-3">
          <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
            <Brain className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Nôa Esperança</h1>
            <p className="text-slate-300 text-sm">IA Residente - Especializada em Avaliações Clínicas</p>
          </div>
        </div>
        
        {/* Botão de controle de áudio */}
        <button
          onClick={() => {
            setAudioEnabled(!audioEnabled)
            if (audioEnabled) {
              window.speechSynthesis.cancel()
            }
          }}
          className="flex items-center space-x-2 text-slate-300 hover:text-white transition-colors"
          title={audioEnabled ? 'Desativar áudio' : 'Ativar áudio'}
        >
          {audioEnabled ? (
            <>
              <Volume2 className="w-5 h-5" />
              <span>Áudio ON</span>
            </>
          ) : (
            <>
              <VolumeX className="w-5 h-5" />
              <span>Áudio OFF</span>
            </>
          )}
        </button>
      </div>

      {/* Main Content - Layout Livre */}
      <div className="flex-1 flex items-center justify-center p-8">
        {/* Container Central */}
        <div className="w-full max-w-5xl mx-auto">
          {/* Avatar da Nôa no Centro com Video */}
          <div className="flex justify-center mb-8">
            <div className="w-64 h-64 rounded-full overflow-hidden shadow-2xl border-4 border-purple-500/30 relative">
              {/* Video da Nôa com transição suave */}
              <video
                key={isResponding ? 'responding' : 'idle'}
                src={isResponding ? '/AGENTEFALANDO.mp4' : '/estatica piscando.mp4'}
                autoPlay
                loop
                muted
                playsInline
                className="w-full h-full object-cover transition-opacity duration-500"
                onLoadedData={(e) => {
                  e.currentTarget.style.opacity = '1'
                }}
                onError={(e) => {
                  console.warn('❌ Erro ao carregar video, usando avatar')
                  e.currentTarget.style.display = 'none'
                }}
              />
              {/* Fallback - Avatar estático */}
              <img 
                src={avatarUrl} 
                alt="Nôa Esperança" 
                className="w-full h-full object-cover hidden"
                onError={(e) => {
                  console.warn('❌ Erro ao carregar avatar, usando gradiente')
                  e.currentTarget.style.display = 'none'
                  e.currentTarget.nextElementSibling?.classList.remove('hidden')
                }}
              />
              {/* Fallback final - Gradient */}
              <div className="w-full h-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center hidden">
                <Brain className="w-24 h-24 text-white" />
              </div>
            </div>
          </div>

          {/* Chat abaixo do avatar */}
          <div className="flex flex-col max-w-3xl mx-auto">

          {/* Messages Area - Sem Card */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4 min-h-[400px]">
              {messages.length === 0 ? (
                <div className="text-center py-12">
                  <h4 className="text-white font-semibold mb-4 text-xl">Olá, {user?.name || 'Paciente'}!</h4>
                  <p className="text-slate-300 mb-6">
                    Sou a Nôa Esperança, sua IA Residente.
                  </p>
                  <div className="bg-slate-700/50 rounded-lg p-4 text-left max-w-md mx-auto">
                    <p className="text-xs text-slate-300 mb-3 font-semibold">Posso ajudar com:</p>
                    <ul className="text-xs text-slate-400 space-y-2">
                      <li className="flex items-start">
                        <span className="mr-2">•</span>
                        <span>Perguntas sobre a plataforma</span>
                      </li>
                      <li className="flex items-start">
                        <span className="mr-2">•</span>
                        <span>Informações sobre tratamentos</span>
                      </li>
                      <li className="flex items-start">
                        <span className="mr-2">•</span>
                        <span>Dúvidas sobre funcionalidades</span>
                      </li>
                      <li className="flex items-start">
                        <span className="mr-2">•</span>
                        <span>Orientações gerais de saúde</span>
                      </li>
                      <li className="flex items-start">
                        <span className="mr-2">•</span>
                        <span>Avaliações clínicas com protocolo IMRE</span>
                      </li>
                    </ul>
                  </div>
                  <p className="text-sm text-slate-500 mt-6">
                    🌬️ Bons ventos soprem!
                  </p>
                </div>
              ) : (
                messages.map((message, index) => (
                  <div
                    key={index}
                    className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[75%] px-4 py-3 rounded-lg ${
                        message.role === 'user'
                          ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white'
                          : 'bg-slate-700 text-slate-100'
                      }`}
                    >
                      <div className="whitespace-pre-wrap">{message.content}</div>
                      <div className={`text-xs mt-1 ${
                        message.role === 'user' ? 'text-purple-100' : 'text-slate-400'
                      }`}>
                        {message.timestamp.toLocaleTimeString('pt-BR', { 
                          hour: '2-digit', 
                          minute: '2-digit' 
                        })}
                      </div>
                    </div>
                  </div>
                ))
              )}

              {isTyping && (
                <div className="flex justify-start">
                  <div className="bg-slate-700 px-4 py-3 rounded-lg">
                    <div className="flex space-x-2">
                      <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" />
                      <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                      <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                    </div>
                  </div>
                </div>
              )}
          </div>

          {/* Input Area */}
          <div className="p-4 mt-4">
            <div className="flex items-center space-x-3">
              <input
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Pergunte à Nôa..."
                className="flex-1 px-6 py-4 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
              {/* Botão de gravação de voz */}
              <button
                onClick={toggleRecording}
                disabled={isTyping || !isInitialized}
                className={`p-4 rounded-xl transition-colors ${
                  isRecording
                    ? 'bg-red-600 hover:bg-red-700 text-white'
                    : 'bg-slate-700 hover:bg-slate-600 text-slate-300'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
                title={isRecording ? 'Parar gravação' : 'Gravar mensagem de voz'}
              >
                {isRecording ? (
                  <MicOff className="w-6 h-6" />
                ) : (
                  <Mic className="w-6 h-6" />
                )}
              </button>
              {/* Botão de enviar */}
              <button
                onClick={handleSendMessage}
                disabled={!inputMessage.trim() || isTyping || !isInitialized}
                className="p-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl hover:from-purple-700 hover:to-pink-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isTyping ? (
                  <Loader2 className="w-6 h-6 animate-spin" />
                ) : (
                  <Send className="w-6 h-6" />
                )}
              </button>
            </div>
          </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default PatientNOAChat