import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  Stethoscope,
  Users,
  Heart,
  MessageCircle,
  FileText,
  Calendar,
  TrendingUp,
  Clock,
  User,
  Phone,
  Video,
  Share2,
  Download,
  Eye,
  CheckCircle,
  AlertCircle,
  Star,
  BarChart3,
  Activity,
  Brain,
  BookOpen,
  FlaskConical
} from 'lucide-react'
import { useNoa } from '../contexts/NoaContext'
import { useNoaPlatform } from '../contexts/NoaPlatformContext'
import { useDashboardTriggers } from '../contexts/DashboardTriggersContext'
import NoaAnimatedAvatar from '../components/NoaAnimatedAvatar'

const ClinicaDashboard: React.FC = () => {
  const navigate = useNavigate()
  const { isOpen, toggleChat, messages, isTyping, isListening, isSpeaking, sendMessage } = useNoa()
  const { openChat: openNoaChat, closeChat, isOpen: isNoaOpen } = useNoaPlatform()
  const { setDashboardTriggers } = useDashboardTriggers()
  const [inputMessage, setInputMessage] = useState('')

  const handleSendMessage = () => {
    if (inputMessage.trim()) {
      sendMessage(inputMessage.trim())
      setInputMessage('')
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  // Array vazio para receber dados reais do banco de dados
  const patients: any[] = []

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'text-red-400 bg-red-500/10'
      case 'medium': return 'text-yellow-400 bg-yellow-500/10'
      case 'low': return 'text-green-400 bg-green-500/10'
      default: return 'text-brand-text-muted bg-slate-500/10'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Em Tratamento': return 'text-blue-400'
      case 'Melhorando': return 'text-green-400'
      case 'Estável': return 'text-brand-text-muted'
      default: return 'text-brand-text-muted'
    }
  }

  // Header triggers (cards por usabilidade do perfil clínica) + cérebro Nôa
  const clinicaTriggerOptions = [
    { id: 'dashboard', label: 'Dashboard Clínica', icon: BarChart3 },
    { id: 'pacientes', label: 'Meus Pacientes', icon: Users },
    { id: 'avaliacoes', label: 'Avaliações', icon: Heart },
    { id: 'relatorios', label: 'Relatórios', icon: FileText }
  ]
  useEffect(() => {
    setDashboardTriggers({
      options: clinicaTriggerOptions.map(o => ({ id: o.id, label: o.label, icon: o.icon })),
      activeId: 'dashboard',
      onChange: (id) => {
        if (id === 'pacientes') navigate('/app/clinica/profissional/pacientes')
        else if (id === 'relatorios') navigate('/app/clinica/profissional/relatorios')
        else if (id === 'avaliacoes') navigate('/app/clinica/profissional/dashboard')
      },
      onBrainClick: () => { if (isNoaOpen) closeChat(); else openNoaChat() }
    })
    return () => setDashboardTriggers(null)
  }, [navigate, openNoaChat, closeChat, isNoaOpen, setDashboardTriggers])

  return (
    <div className="min-h-screen bg-brand-bg text-brand-text">
      {/* Header */}
      <div className="bg-brand-surface border-b border-brand-border p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button className="flex items-center space-x-2 text-brand-text-secondary hover:text-brand-text transition-colors">
              <ArrowLeft className="w-5 h-5" />
              <span>Voltar</span>
            </button>
            <div>
              <h1 className="text-2xl font-bold text-brand-text">🏥 Dashboard Clínica</h1>
              <p className="text-brand-text-muted">Área Clínica - Gestão de Pacientes e Avaliações</p>
            </div>
          </div>
          
          {/* Professional Profile */}
          <div className="flex items-center space-x-3 bg-brand-surface-subtle p-3 rounded-lg">
            <div className="w-10 h-10 bg-gradient-to-r from-[#00c16a] to-[#00a85a] rounded-full flex items-center justify-center">
              <Stethoscope className="w-5 h-5 text-brand-text" />
            </div>
            <div>
              <p className="font-semibold text-brand-text">👨‍⚕️ Profissional</p>
              <p className="text-sm text-brand-text-muted">Médico</p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex">
        {/* Sidebar */}
        <div className="w-64 bg-brand-surface border-r border-brand-border min-h-screen">
          <div className="p-6">
            <nav className="space-y-2">
              <a href="#" className="flex items-center space-x-3 p-3 rounded-lg bg-brand-surface-subtle text-brand-text">
                <BarChart3 className="w-5 h-5" />
                <span>🏥 Dashboard Clínica</span>
              </a>
              <a href="#" className="flex items-center space-x-3 p-3 rounded-lg text-brand-text-secondary hover:bg-brand-surface-subtle hover:text-brand-text transition-colors">
                <Users className="w-5 h-5" />
                <span>👥 Meus Pacientes</span>
              </a>
              <a href="#" className="flex items-center space-x-3 p-3 rounded-lg text-brand-text-secondary hover:bg-brand-surface-subtle hover:text-brand-text transition-colors">
                <Heart className="w-5 h-5" />
                <span>📊 Avaliações</span>
              </a>
              <a href="#" className="flex items-center space-x-3 p-3 rounded-lg text-brand-text-secondary hover:bg-brand-surface-subtle hover:text-brand-text transition-colors">
                <MessageCircle className="w-5 h-5" />
                <span>💬 Fórum Cann Matrix</span>
              </a>
              <a href="#" className="flex items-center space-x-3 p-3 rounded-lg text-brand-text-secondary hover:bg-brand-surface-subtle hover:text-brand-text transition-colors">
                <FileText className="w-5 h-5" />
                <span>📈 Relatórios</span>
              </a>
            </nav>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 p-6">
          <div className="max-w-6xl mx-auto">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <div className="bg-brand-surface rounded-xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-blue-500/10 rounded-lg">
                    <Users className="w-6 h-6 text-blue-400" />
                  </div>
                  <TrendingUp className="w-5 h-5 text-green-400" />
                </div>
                <h3 className="text-2xl font-bold text-brand-text mb-1">24</h3>
                <p className="text-sm text-brand-text-muted">Pacientes Ativos</p>
              </div>

              <div className="bg-brand-surface rounded-xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-green-500/10 rounded-lg">
                    <CheckCircle className="w-6 h-6 text-green-400" />
                  </div>
                  <TrendingUp className="w-5 h-5 text-green-400" />
                </div>
                <h3 className="text-2xl font-bold text-brand-text mb-1">18</h3>
                <p className="text-sm text-brand-text-muted">Avaliações Hoje</p>
              </div>

              <div className="bg-brand-surface rounded-xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-yellow-500/10 rounded-lg">
                    <Clock className="w-6 h-6 text-yellow-400" />
                  </div>
                  <TrendingUp className="w-5 h-5 text-green-400" />
                </div>
                <h3 className="text-2xl font-bold text-brand-text mb-1">12</h3>
                <p className="text-sm text-brand-text-muted">Consultas Agendadas</p>
              </div>

              <div className="bg-brand-surface rounded-xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-purple-500/10 rounded-lg">
                    <Star className="w-6 h-6 text-purple-400" />
                  </div>
                  <TrendingUp className="w-5 h-5 text-green-400" />
                </div>
                <h3 className="text-2xl font-bold text-brand-text mb-1">4.8</h3>
                <p className="text-sm text-brand-text-muted">Satisfação Média</p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Patients List */}
              <div className="lg:col-span-2">
                <div className="bg-brand-surface rounded-xl p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-semibold text-brand-text">👥 Meus Pacientes</h3>
                    <button className="bg-gradient-to-r from-[#00c16a] to-[#00a85a] text-brand-text px-4 py-2 rounded-lg font-semibold hover:from-blue-600 hover:to-cyan-600 transition-colors">
                      Ver Todos
                    </button>
                  </div>

                  <div className="space-y-4">
                    {patients.map((patient) => (
                      <div key={patient.id} className="flex items-center justify-between p-4 bg-brand-surface-subtle rounded-lg hover:bg-slate-650 transition-colors">
                        <div className="flex items-center space-x-4">
                          <div className="w-12 h-12 bg-gradient-to-r from-[#00c16a] to-[#00a85a] rounded-full flex items-center justify-center">
                            <span className="text-brand-text font-bold text-sm">{patient.avatar}</span>
                          </div>
                          
                          <div className="flex-1">
                            <div className="flex items-center space-x-3 mb-1">
                              <h4 className="font-semibold text-brand-text">{patient.name}</h4>
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(patient.priority)}`}>
                                {patient.priority === 'high' ? 'Alta' : patient.priority === 'medium' ? 'Média' : 'Baixa'}
                              </span>
                            </div>
                            <p className="text-sm text-brand-text-muted mb-1">{patient.condition}</p>
                            <div className="flex items-center space-x-4 text-xs text-slate-500">
                              <span>Última visita: {patient.lastVisit}</span>
                              <span>Próxima: {patient.nextAppointment}</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center space-x-3">
                          <div className="text-right">
                            <div className={`text-sm font-medium ${getStatusColor(patient.status)}`}>
                              {patient.status}
                            </div>
                            <div className="text-xs text-brand-text-muted">Score: {patient.score}/100</div>
                          </div>
                          
                          <div className="flex items-center space-x-1">
                            <button className="p-2 bg-slate-600 rounded-lg hover:bg-slate-500 transition-colors">
                              <MessageCircle className="w-4 h-4" />
                            </button>
                            <button className="p-2 bg-slate-600 rounded-lg hover:bg-slate-500 transition-colors">
                              <Eye className="w-4 h-4" />
                            </button>
                            <button className="p-2 bg-slate-600 rounded-lg hover:bg-slate-500 transition-colors">
                              <Share2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Recent Assessments */}
                <div className="bg-brand-surface rounded-xl p-6 mt-6">
                  <h3 className="text-xl font-semibold text-brand-text mb-6">📊 Avaliações Recentes</h3>
                  
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-brand-surface-subtle rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center">
                          <CheckCircle className="w-5 h-5 text-brand-text" />
                        </div>
                        <div>
                          <p className="font-semibold text-brand-text">Avaliação Clínica - Dr. Ricardo Valença</p>
                          <p className="text-sm text-brand-text-muted">Concluída • Score: 85/100</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <button className="p-2 bg-slate-600 rounded-lg hover:bg-slate-500 transition-colors">
                          <Eye className="w-4 h-4" />
                        </button>
                        <button className="p-2 bg-slate-600 rounded-lg hover:bg-slate-500 transition-colors">
                          <Download className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Chat Section */}
              <div className="lg:col-span-1">
                <div className="bg-brand-surface rounded-xl p-6 h-full">
                  <div className="text-center mb-6">
                    <h3 className="text-xl font-semibold text-brand-text mb-2">Nôa Esperança</h3>
                    <p className="text-sm text-brand-text-muted">IA Residente • Suporte Clínico</p>
                  </div>

                  {/* Avatar */}
                  <div className="flex justify-center mb-6">
                    <NoaAnimatedAvatar
                      isSpeaking={isSpeaking}
                      isListening={isListening}
                      size="md"
                      showStatus={true}
                    />
                  </div>

                  {/* Welcome Message */}
                  <div className="bg-brand-surface-subtle rounded-lg p-4 mb-4">
                    <p className="text-sm text-brand-text-secondary mb-2">
                      🩺 Olá, Dr(a)! Sou a Nôa Esperança, sua assistente clínica especializada.
                    </p>
                    <p className="text-xs text-brand-text-muted mb-2">Posso ajudar com:</p>
                    <ul className="text-xs text-brand-text-muted space-y-1">
                      <li>• Análise de casos clínicos</li>
                      <li>• Suporte na Arte da Entrevista</li>
                      <li>• Orientações sobre Cannabis Medicinal</li>
                    </ul>
                  </div>

                  {/* Quick Actions */}
                  <div className="space-y-3 mb-6">
                    <button className="w-full bg-gradient-to-r from-[#00c16a] to-[#00a85a] text-brand-text py-3 px-4 rounded-lg font-semibold hover:from-blue-600 hover:to-cyan-600 transition-colors">
                      Analisar Caso Clínico
                    </button>
                    <button className="w-full bg-gradient-to-r from-[#00c16a] to-[#00a85a] text-brand-text py-3 px-4 rounded-lg font-semibold hover:from-purple-600 hover:to-pink-600 transition-colors">
                      Arte da Entrevista Clínica
                    </button>
                  </div>

                  {/* Chat Input */}
                  <div className="space-y-3">
                    <div className="relative">
                      <input
                        type="text"
                        value={inputMessage}
                        onChange={(e) => setInputMessage(e.target.value)}
                        onKeyPress={handleKeyPress}
                        placeholder="Digite sua mensagem..."
                        className="w-full px-4 py-3 bg-brand-surface-subtle border border-slate-600 rounded-lg text-brand-text placeholder-slate-400 focus:outline-none focus:border-blue-500"
                      />
                    </div>
                    
                    <p className="text-xs text-slate-500 text-center">
                      Nôa utiliza AEC para suporte clínico • LGPD Compliant
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Chat Modal */}
      {isOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-brand-surface rounded-xl w-96 h-[600px] flex flex-col">
            {/* Chat Header */}
            <div className="p-4 border-b border-brand-border">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-gradient-to-r from-[#00c16a] to-[#00a85a] rounded-full flex items-center justify-center">
                    <Stethoscope className="w-4 h-4 text-brand-text" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-brand-text">Nôa Esperança</h3>
                    <p className="text-xs text-brand-text-muted">Suporte Clínico</p>
                  </div>
                </div>
                <button
                  onClick={toggleChat}
                  className="text-brand-text-muted hover:text-brand-text transition-colors"
                >
                  ×
                </button>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.length === 0 ? (
                <div className="text-center text-brand-text-muted py-8">
                  <Stethoscope className="w-12 h-12 mx-auto mb-3 text-blue-400" />
                  <p className="text-sm">Olá! Sou a Nôa Esperança, sua assistente clínica.</p>
                </div>
              ) : (
                messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[70%] px-4 py-2 rounded-lg text-sm ${
                        message.type === 'user'
                          ? 'bg-gradient-to-r from-[#00c16a] to-[#00a85a] text-brand-text'
                          : 'bg-brand-surface-subtle text-slate-100'
                      }`}
                    >
                      {message.content}
                    </div>
                  </div>
                ))
              )}
              
              {isTyping && (
                <div className="flex justify-start">
                  <div className="bg-brand-surface-subtle px-4 py-2 rounded-lg">
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" />
                      <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                      <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Input */}
            <div className="p-4 border-t border-brand-border">
              <div className="flex items-center space-x-2">
                <input
                  type="text"
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Digite sua mensagem..."
                  className="flex-1 px-3 py-2 bg-brand-surface-subtle border border-slate-600 rounded-lg text-brand-text placeholder-slate-400 focus:outline-none focus:border-blue-500"
                />
                <button
                  onClick={handleSendMessage}
                  disabled={!inputMessage.trim()}
                  className="p-2 bg-gradient-to-r from-[#00c16a] to-[#00a85a] text-brand-text rounded-lg hover:from-blue-600 hover:to-cyan-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <MessageCircle className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default ClinicaDashboard
