import React, { useState } from 'react'
import { 
  Stethoscope, 
  BookOpen, 
  FlaskConical, 
  Users, 
  Heart, 
  MessageCircle, 
  FileText,
  BarChart3,
  TrendingUp,
  Clock,
  Star,
  CheckCircle,
  AlertCircle,
  Download,
  Share2,
  Eye,
  Target,
  Award,
  Activity,
  Brain,
  Calendar,
  Settings,
  User,
  ChevronRight,
  Plus,
  Search,
  Filter,
  ArrowRight,
  ChevronDown,
  ChevronUp,
  Zap,
  Bot,
  Zap as SparklesIcon
} from 'lucide-react'
import { useNoa } from '../contexts/NoaContext'
import NoaAnimatedAvatar from '../components/NoaAnimatedAvatar'

const MedCannLabStructure: React.FC = () => {
  const { isOpen, toggleChat, messages, isTyping, isListening, isSpeaking, sendMessage } = useNoa()
  const [inputMessage, setInputMessage] = useState('')
  const [activeArea, setActiveArea] = useState<'clinica' | 'ensino-pesquisa' | 'ia-residente'>('clinica')
  const [activeDashboard, setActiveDashboard] = useState<string>('')

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

  const structure = {
    'medcannlab': {
      name: 'MedCannLab',
      description: 'Sistema Integrado de Cannabis Medicinal',
      color: 'from-purple-600 to-pink-500',
      children: {
        'ia-residente': {
          name: 'IA Residente Longitudinal',
          description: 'Sistema de IA Multimodal Integrado',
          color: 'from-blue-600 to-cyan-500',
          icon: Bot,
          children: {
            'ia-multimodal': {
              name: 'IA Multimodal',
              description: 'Interface de Comunicação Avançada',
              color: 'from-cyan-500 to-teal-500',
              icon: SparklesIcon
            }
          }
        },
        'clinica': {
          name: 'Clínica',
          description: 'Área Clínica e Assistencial',
          color: 'from-green-600 to-emerald-500',
          icon: Stethoscope,
          children: {
            'dashboard-profissional': {
              name: 'Dashboard Profissional',
              description: 'Gestão Clínica e Pacientes',
              color: 'from-[#00c16a] to-[#00a85a]',
              icon: Users,
              connected: 'dashboard-paciente'
            },
            'dashboard-paciente': {
              name: 'Dashboard Paciente',
              description: 'Acompanhamento do Paciente',
              color: 'from-pink-500 to-purple-500',
              icon: Heart,
              connected: 'dashboard-profissional'
            },
            'dashboard-alunos': {
              name: 'Dashboard Alunos',
              description: 'Área Acadêmica Clínica',
              color: 'from-orange-500 to-red-500',
              icon: BookOpen
            }
          }
        },
        'ensino-pesquisa': {
          name: 'Ensino/Pesquisa',
          description: 'Área Acadêmica e Científica',
          color: 'from-indigo-600 to-purple-500',
                        icon: FlaskConical,
          children: {
            'dashboard-profissional-academico': {
              name: 'Dashboard Profissional',
              description: 'Gestão Acadêmica e Pesquisa',
              color: 'from-green-500 to-teal-500',
              icon: Users
            },
            'administrador': {
              name: 'Administrador',
              description: 'Gestão Geral do Sistema',
              color: 'from-gray-600 to-slate-500',
              icon: Settings
            }
          }
        }
      }
    }
  }

  const getDashboardContent = (dashboardId: string) => {
    switch (dashboardId) {
      case 'dashboard-profissional':
        return {
          title: 'Dashboard Profissional - Clínica',
          stats: [
            { label: 'Pacientes Ativos', value: '24', trend: '+5' },
            { label: 'Avaliações Hoje', value: '18', trend: '+3' },
            { label: 'Consultas Agendadas', value: '12', trend: '+2' },
            { label: 'Satisfação Média', value: '4.8', trend: '+0.2' }
          ],
          content: 'Gestão de pacientes e avaliações clínicas'
        }
      case 'dashboard-paciente':
        return {
          title: 'Dashboard Paciente',
          stats: [
            { label: 'Completude da Avaliação', value: '85/100', trend: '+5' },
            { label: 'Consistência da Informação', value: '92%', trend: '+3%' },
            { label: 'Equilíbrio dos Dados', value: '78%', trend: '+8%' },
            { label: 'Cobertura de Histórico', value: '88/100', trend: '+12' }
          ],
          content: 'Acompanhamento personalizado do paciente'
        }
      case 'dashboard-alunos':
        return {
          title: 'Dashboard Alunos - Clínica',
          stats: [
            { label: 'Cursos Ativos', value: '3', trend: '+1' },
            { label: 'Progresso Médio', value: '73%', trend: '+8%' },
            { label: 'Horas Estudadas', value: '120h', trend: '+15h' },
            { label: 'Certificados', value: '1', trend: '+1' }
          ],
          content: 'Área acadêmica para estudantes de medicina'
        }
      case 'dashboard-profissional-academico':
        return {
          title: 'Dashboard Profissional - Acadêmico',
          stats: [
            { label: 'Estudos Ativos', value: '3', trend: '+1' },
            { label: 'Progresso Médio', value: '83%', trend: '+12%' },
            { label: 'Participantes', value: '192', trend: '+24' },
            { label: 'Publicações', value: '1', trend: '+1' }
          ],
          content: 'Gestão de pesquisa e ensino acadêmico'
        }
      case 'administrador':
        return {
          title: 'Dashboard Administrador',
          stats: [
            { label: 'Usuários Ativos', value: '1,234', trend: '+45' },
            { label: 'Sistema Online', value: '99.9%', trend: '+0.1%' },
            { label: 'Avaliações Hoje', value: '156', trend: '+12' },
            { label: 'Uptime', value: '99.9%', trend: '+0.1%' }
          ],
          content: 'Gestão geral do sistema MedCannLab'
        }
      case 'ia-multimodal':
        return {
          title: 'IA Multimodal - Nôa Esperança',
          stats: [
            { label: 'Conversas Ativas', value: '24', trend: '+5' },
            { label: 'Precisão IA', value: '94%', trend: '+2%' },
            { label: 'Tempo Resposta', value: '1.2s', trend: '-0.3s' },
            { label: 'Satisfação', value: '4.9/5', trend: '+0.1' }
          ],
          content: 'Sistema de IA avançado para suporte clínico'
        }
      default:
        return {
          title: 'Selecione um Dashboard',
          stats: [],
          content: 'Escolha um dashboard para visualizar o conteúdo'
        }
    }
  }

  const currentDashboard = getDashboardContent(activeDashboard)

  return (
    <div className="min-h-screen bg-slate-900 text-white">
      {/* Header */}
      <div className="bg-slate-800 border-b border-slate-700 p-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">🏗️ Estrutura MedCannLab</h1>
            <p className="text-slate-400">Sistema Hierárquico Integrado</p>
          </div>
          
          {/* Admin Profile */}
          <div className="flex items-center space-x-3 bg-slate-700 p-3 rounded-lg">
            <div className="w-10 h-10 bg-gradient-to-r from-[#00c16a] to-[#00a85a] rounded-full flex items-center justify-center">
              <Bot className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="font-semibold text-white">🏗️ Estrutura</p>
              <p className="text-sm text-slate-400">Sistema Integrado</p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex h-screen">
        {/* Sidebar - Structure Navigation */}
        <div className="w-80 bg-slate-800 border-r border-slate-700 flex flex-col">
          {/* Structure Tree */}
          <div className="p-4 border-b border-slate-700">
            <h3 className="text-lg font-semibold text-white mb-4">Estrutura Hierárquica</h3>
            
            {/* MedCannLab Root */}
            <div className="mb-4">
              <div className="flex items-center space-x-2 p-2 bg-gradient-to-r from-purple-600 to-pink-500 rounded-lg">
                <Bot className="w-5 h-5 text-white" />
                <span className="font-semibold text-white">MedCannLab</span>
              </div>
              
              {/* IA Residente */}
              <div className="ml-4 mt-2">
                <button
                  onClick={() => setActiveArea('ia-residente')}
                  className={`w-full flex items-center space-x-2 p-2 rounded-lg transition-all ${
                    activeArea === 'ia-residente' ? 'bg-blue-600 text-white' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                  }`}
                >
                  <Bot className="w-4 h-4" />
                  <span>IA Residente Longitudinal</span>
                  <ArrowRight className="w-3 h-3 ml-auto" />
                </button>
                
                {activeArea === 'ia-residente' && (
                  <div className="ml-4 mt-1">
                    <button
                      onClick={() => setActiveDashboard('ia-multimodal')}
                      className={`w-full flex items-center space-x-2 p-2 rounded-lg transition-all ${
                        activeDashboard === 'ia-multimodal' ? 'bg-cyan-500 text-white' : 'bg-slate-600 text-slate-300 hover:bg-slate-500'
                      }`}
                    >
                      <SparklesIcon className="w-4 h-4" />
                      <span>IA Multimodal</span>
                    </button>
                  </div>
                )}
              </div>
              
              {/* Clínica */}
              <div className="ml-4 mt-2">
                <button
                  onClick={() => setActiveArea('clinica')}
                  className={`w-full flex items-center space-x-2 p-2 rounded-lg transition-all ${
                    activeArea === 'clinica' ? 'bg-green-600 text-white' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                  }`}
                >
                  <Stethoscope className="w-4 h-4" />
                  <span>Clínica</span>
                  <ArrowRight className="w-3 h-3 ml-auto" />
                </button>
                
                {activeArea === 'clinica' && (
                  <div className="ml-4 mt-1 space-y-1">
                    <button
                      onClick={() => setActiveDashboard('dashboard-profissional')}
                      className={`w-full flex items-center space-x-2 p-2 rounded-lg transition-all ${
                        activeDashboard === 'dashboard-profissional' ? 'bg-blue-500 text-white' : 'bg-slate-600 text-slate-300 hover:bg-slate-500'
                      }`}
                    >
                      <Users className="w-4 h-4" />
                      <span>Dashboard Profissional</span>
                      <ArrowRight className="w-3 h-3 ml-auto" />
                    </button>
                    <button
                      onClick={() => setActiveDashboard('dashboard-paciente')}
                      className={`w-full flex items-center space-x-2 p-2 rounded-lg transition-all ${
                        activeDashboard === 'dashboard-paciente' ? 'bg-pink-500 text-white' : 'bg-slate-600 text-slate-300 hover:bg-slate-500'
                      }`}
                    >
                      <Heart className="w-4 h-4" />
                      <span>Dashboard Paciente</span>
                      <ArrowRight className="w-3 h-3 ml-auto" />
                    </button>
                    <button
                      onClick={() => setActiveDashboard('dashboard-alunos')}
                      className={`w-full flex items-center space-x-2 p-2 rounded-lg transition-all ${
                        activeDashboard === 'dashboard-alunos' ? 'bg-orange-500 text-white' : 'bg-slate-600 text-slate-300 hover:bg-slate-500'
                      }`}
                    >
                      <BookOpen className="w-4 h-4" />
                      <span>Dashboard Alunos</span>
                    </button>
                  </div>
                )}
              </div>
              
              {/* Ensino/Pesquisa */}
              <div className="ml-4 mt-2">
                <button
                  onClick={() => setActiveArea('ensino-pesquisa')}
                  className={`w-full flex items-center space-x-2 p-2 rounded-lg transition-all ${
                    activeArea === 'ensino-pesquisa' ? 'bg-indigo-600 text-white' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                  }`}
                >
                  <FlaskConical className="w-4 h-4" />
                  <span>Ensino/Pesquisa</span>
                  <ArrowRight className="w-3 h-3 ml-auto" />
                </button>
                
                {activeArea === 'ensino-pesquisa' && (
                  <div className="ml-4 mt-1 space-y-1">
                    <button
                      onClick={() => setActiveDashboard('dashboard-profissional-academico')}
                      className={`w-full flex items-center space-x-2 p-2 rounded-lg transition-all ${
                        activeDashboard === 'dashboard-profissional-academico' ? 'bg-green-500 text-white' : 'bg-slate-600 text-slate-300 hover:bg-slate-500'
                      }`}
                    >
                      <Users className="w-4 h-4" />
                      <span>Dashboard Profissional</span>
                    </button>
                    <button
                      onClick={() => setActiveDashboard('administrador')}
                      className={`w-full flex items-center space-x-2 p-2 rounded-lg transition-all ${
                        activeDashboard === 'administrador' ? 'bg-gray-600 text-white' : 'bg-slate-600 text-slate-300 hover:bg-slate-500'
                      }`}
                    >
                      <Settings className="w-4 h-4" />
                      <span>Administrador</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Chat Nôa Esperança */}
          <div className="p-4 border-t border-slate-700">
            <div className="text-center mb-4">
              <h3 className="text-lg font-semibold text-white mb-2">Nôa Esperança</h3>
              <p className="text-sm text-slate-400">IA Residente • Sistema Integrado</p>
            </div>

            {/* Avatar */}
            <div className="flex justify-center mb-4">
              <NoaAnimatedAvatar
                isSpeaking={isSpeaking}
                isListening={isListening}
                size="sm"
                showStatus={true}
              />
            </div>

            {/* Quick Actions */}
            <div className="space-y-2 mb-4">
              <button 
                onClick={toggleChat}
                className="w-full bg-gradient-to-r from-[#00c16a] to-[#00a85a] text-white py-2 px-3 rounded-lg font-semibold hover:opacity-90 transition-opacity text-sm"
              >
                Sistema Integrado
              </button>
            </div>

            {/* Chat Input */}
            <div className="space-y-2">
              <input
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Digite sua mensagem..."
                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-purple-500 text-sm"
              />
              <p className="text-xs text-slate-500 text-center">
                Nôa utiliza AEC • LGPD Compliant
              </p>
            </div>
          </div>
        </div>

        {/* Main Content - Dashboard Area */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Dashboard Header */}
          <div className="bg-gradient-to-r from-purple-600 to-pink-500 p-6">
            <h2 className="text-2xl font-bold text-white mb-2">
              {currentDashboard.title}
            </h2>
            <p className="text-white/90 mb-4">
              {currentDashboard.content}
            </p>
            <button className="bg-white text-purple-600 px-6 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors">
              Explorar Dashboard
            </button>
          </div>

          {/* Dashboard Content */}
          <div className="p-6 flex-1 overflow-y-auto">
            {currentDashboard.stats.length > 0 ? (
              <>
                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                  {currentDashboard.stats.map((stat, index) => (
                    <div key={index} className="bg-slate-800 rounded-xl p-6">
                      <div className="flex items-center justify-between mb-4">
                        <div className="p-3 bg-purple-500/10 rounded-lg">
                          <BarChart3 className="w-6 h-6 text-purple-400" />
                        </div>
                        <TrendingUp className="w-5 h-5 text-green-400" />
                      </div>
                      <h3 className="text-2xl font-bold text-white mb-1">{stat.value}</h3>
                      <p className="text-sm text-slate-400">{stat.label}</p>
                      <p className="text-xs text-green-400 mt-1">{stat.trend}</p>
                    </div>
                  ))}
                </div>

                {/* Dashboard Content */}
                <div className="bg-slate-800 rounded-xl p-6">
                  <h3 className="text-xl font-semibold text-white mb-6">
                    Conteúdo do Dashboard
                  </h3>
                  
                  <div className="space-y-4">
                    <div className="bg-slate-700 rounded-lg p-4">
                      <h4 className="font-semibold text-white mb-2">Funcionalidades Principais</h4>
                      <p className="text-sm text-slate-400">
                        Este dashboard oferece funcionalidades específicas para o tipo de usuário selecionado.
                      </p>
                    </div>
                    
                    <div className="bg-slate-700 rounded-lg p-4">
                      <h4 className="font-semibold text-white mb-2">Integração com Sistema</h4>
                      <p className="text-sm text-slate-400">
                        Conectado ao sistema MedCannLab com IA Residente integrada.
                      </p>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <div className="text-center py-12">
                <Bot className="w-16 h-16 mx-auto text-purple-400 mb-4" />
                <h3 className="text-xl font-semibold text-white mb-2">Selecione um Dashboard</h3>
                <p className="text-slate-400">
                  Escolha um dashboard na sidebar para visualizar o conteúdo específico.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Chat Modal */}
      {isOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-slate-800 rounded-xl w-96 h-[600px] flex flex-col">
            {/* Chat Header */}
            <div className="p-4 border-b border-slate-700">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-gradient-to-r from-[#00c16a] to-[#00a85a] rounded-full flex items-center justify-center">
                    <Bot className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-white">Nôa Esperança</h3>
                    <p className="text-xs text-slate-400">Sistema Integrado</p>
                  </div>
                </div>
                <button
                  onClick={toggleChat}
                  className="text-slate-400 hover:text-white transition-colors"
                >
                  ×
                </button>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.length === 0 ? (
                <div className="text-center text-slate-400 py-8">
                  <Bot className="w-12 h-12 mx-auto mb-3 text-purple-400" />
                  <p className="text-sm">Olá! Sou a Nôa Esperança, sua IA Residente integrada.</p>
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
                          ? 'bg-gradient-to-r from-[#00c16a] to-[#00a85a] text-white'
                          : 'bg-slate-700 text-slate-100'
                      }`}
                    >
                      {message.content}
                    </div>
                  </div>
                ))
              )}
              
              {isTyping && (
                <div className="flex justify-start">
                  <div className="bg-slate-700 px-4 py-2 rounded-lg">
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
            <div className="p-4 border-t border-slate-700">
              <div className="flex items-center space-x-2">
                <input
                  type="text"
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Digite sua mensagem..."
                  className="flex-1 px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-purple-500"
                />
                <button
                  onClick={handleSendMessage}
                  disabled={!inputMessage.trim()}
                  className="p-2 bg-gradient-to-r from-[#00c16a] to-[#00a85a] text-white rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
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

export default MedCannLabStructure
