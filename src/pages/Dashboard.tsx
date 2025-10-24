import React from 'react'
import { useAuth } from '../contexts/AuthContext'
import { Link } from 'react-router-dom'
import { 
  BookOpen, 
  Stethoscope, 
  BarChart3, 
  Users, 
  Award,
  Clock,
  CheckCircle,
  AlertCircle,
  MessageCircle,
  Phone
} from 'lucide-react'

const Dashboard: React.FC = () => {
  const { user } = useAuth()

  const getDashboardContent = () => {
    switch (user?.type) {
      case 'patient':
        return <PatientDashboard />
      case 'professional':
        return <ProfessionalDashboard />
      case 'student':
        return <StudentDashboard />
      case 'admin':
        return <AdminDashboard />
      default:
        return <DefaultDashboard />
    }
  }

  return (
    <div>
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {getDashboardContent()}
      </div>
    </div>
  )
}

const PatientDashboard: React.FC = () => {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-4xl font-bold text-white mb-4">
          Bem-vindo ao MedCannLab
        </h1>
        <p className="text-slate-300 text-lg">
          Sua jornada de saúde começa aqui
        </p>
      </div>

    {/* Médicos Parceiros e Ranking */}
    <div className="bg-slate-800/80 rounded-lg p-6 border border-slate-700">
      <h3 className="text-xl font-bold text-white mb-6">👨‍⚕️ Médicos Parceiros</h3>
      
      {/* Meu Médico Atual */}
      <div className="mb-8">
        <h4 className="text-lg font-semibold text-white mb-4">🏥 Meu Médico Atual</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-4">
            <div className="flex items-center space-x-4 p-4 bg-slate-700/50 rounded-lg">
              <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-purple-600 rounded-full flex items-center justify-center">
                <span className="text-white font-bold text-sm">PM</span>
              </div>
              <div>
                <p className="text-white font-semibold">Dr. Passos Mir</p>
                <p className="text-slate-400 text-sm">CRM: 12345-SP • Clínico Geral</p>
                <div className="flex items-center space-x-2 mt-1">
                  <div className="flex items-center">
                    <span className="text-yellow-400">⭐⭐⭐⭐⭐</span>
                    <span className="text-slate-300 text-sm ml-2">4.9 (127 avaliações)</span>
                  </div>
                </div>
                <div className="flex items-center space-x-2 mt-1">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-green-400 text-xs">Online</span>
                </div>
              </div>
            </div>
            <div className="flex space-x-2">
              <button className="flex-1 bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg flex items-center justify-center space-x-2 transition-colors">
                <MessageCircle className="w-4 h-4" />
                <span>Chat Exclusivo</span>
              </button>
              <button className="flex-1 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center justify-center space-x-2 transition-colors">
                <Phone className="w-4 h-4" />
                <span>Ligar</span>
              </button>
            </div>
          </div>
          <div className="space-y-3">
            <div className="text-center">
              <h4 className="text-lg font-semibold text-white mb-2">📅 Próxima Consulta</h4>
              <p className="text-slate-300">22/01/2024 às 14:30</p>
              <p className="text-slate-400 text-sm">Consulta de retorno</p>
            </div>
            <div className="text-center">
              <h4 className="text-lg font-semibold text-white mb-2">📊 Status do Tratamento</h4>
              <div className="flex items-center justify-center space-x-2">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span className="text-green-400 text-sm">Estável</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Top Médicos do App */}
      <div>
        <h4 className="text-lg font-semibold text-white mb-4">⭐ Top Médicos do App</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Dr. Ana Costa - Cardiologista */}
          <div className="bg-slate-700/50 rounded-lg p-4 hover:bg-slate-700/70 transition-colors cursor-pointer">
            <div className="flex items-center space-x-3 mb-3">
              <div className="w-10 h-10 bg-gradient-to-br from-pink-500 to-red-600 rounded-full flex items-center justify-center">
                <span className="text-white font-bold text-sm">AC</span>
              </div>
              <div>
                <p className="text-white font-semibold">Dra. Ana Costa</p>
                <p className="text-slate-400 text-sm">Cardiologista</p>
              </div>
            </div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center">
                <span className="text-yellow-400">⭐⭐⭐⭐⭐</span>
                <span className="text-slate-300 text-sm ml-2">4.9</span>
              </div>
              <span className="text-slate-400 text-xs">89 avaliações</span>
            </div>
            <p className="text-slate-300 text-sm mb-3">
              Especialista em cardiologia preventiva e tratamento de arritmias. 
              Experiência de 15 anos em hospitais de referência.
            </p>
            <div className="flex items-center justify-between">
              <span className="text-green-400 text-sm">🟢 Online</span>
              <button className="bg-primary-600 hover:bg-primary-700 text-white px-3 py-1 rounded text-sm transition-colors">
                Ver Perfil
              </button>
            </div>
          </div>

          {/* Dr. Carlos Silva - Neurologista */}
          <div className="bg-slate-700/50 rounded-lg p-4 hover:bg-slate-700/70 transition-colors cursor-pointer">
            <div className="flex items-center space-x-3 mb-3">
              <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-full flex items-center justify-center">
                <span className="text-white font-bold text-sm">CS</span>
              </div>
              <div>
                <p className="text-white font-semibold">Dr. Carlos Silva</p>
                <p className="text-slate-400 text-sm">Neurologista</p>
              </div>
            </div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center">
                <span className="text-yellow-400">⭐⭐⭐⭐⭐</span>
                <span className="text-slate-300 text-sm ml-2">4.8</span>
              </div>
              <span className="text-slate-400 text-xs">156 avaliações</span>
            </div>
            <p className="text-slate-300 text-sm mb-3">
              Especialista em neurologia clínica e tratamento de epilepsia. 
              Pesquisador em neurociências com publicações internacionais.
            </p>
            <div className="flex items-center justify-between">
              <span className="text-orange-400 text-sm">🟡 Ausente</span>
              <button className="bg-primary-600 hover:bg-primary-700 text-white px-3 py-1 rounded text-sm transition-colors">
                Ver Perfil
              </button>
            </div>
          </div>

          {/* Dr. Maria Santos - Endocrinologista */}
          <div className="bg-slate-700/50 rounded-lg p-4 hover:bg-slate-700/70 transition-colors cursor-pointer">
            <div className="flex items-center space-x-3 mb-3">
              <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-teal-600 rounded-full flex items-center justify-center">
                <span className="text-white font-bold text-sm">MS</span>
              </div>
              <div>
                <p className="text-white font-semibold">Dra. Maria Santos</p>
                <p className="text-slate-400 text-sm">Endocrinologista</p>
              </div>
            </div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center">
                <span className="text-yellow-400">⭐⭐⭐⭐⭐</span>
                <span className="text-slate-300 text-sm ml-2">4.9</span>
              </div>
              <span className="text-slate-400 text-xs">203 avaliações</span>
            </div>
            <p className="text-slate-300 text-sm mb-3">
              Especialista em diabetes e distúrbios hormonais. 
              Coordenadora do programa de diabetes do hospital.
            </p>
            <div className="flex items-center justify-between">
              <span className="text-green-400 text-sm">🟢 Online</span>
              <button className="bg-primary-600 hover:bg-primary-700 text-white px-3 py-1 rounded text-sm transition-colors">
                Ver Perfil
              </button>
            </div>
          </div>

          {/* Dr. João Oliveira - Psiquiatra */}
          <div className="bg-slate-700/50 rounded-lg p-4 hover:bg-slate-700/70 transition-colors cursor-pointer">
            <div className="flex items-center space-x-3 mb-3">
              <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-yellow-600 rounded-full flex items-center justify-center">
                <span className="text-white font-bold text-sm">JO</span>
              </div>
              <div>
                <p className="text-white font-semibold">Dr. João Oliveira</p>
                <p className="text-slate-400 text-sm">Psiquiatra</p>
              </div>
            </div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center">
                <span className="text-yellow-400">⭐⭐⭐⭐</span>
                <span className="text-slate-300 text-sm ml-2">4.7</span>
              </div>
              <span className="text-slate-400 text-xs">134 avaliações</span>
            </div>
            <p className="text-slate-300 text-sm mb-3">
              Especialista em psiquiatria clínica e terapia cognitivo-comportamental. 
              Experiência em transtornos de ansiedade e depressão.
            </p>
            <div className="flex items-center justify-between">
              <span className="text-green-400 text-sm">🟢 Online</span>
              <button className="bg-primary-600 hover:bg-primary-700 text-white px-3 py-1 rounded text-sm transition-colors">
                Ver Perfil
              </button>
            </div>
          </div>

          {/* Dr. Pedro Lima - Ortopedista */}
          <div className="bg-slate-700/50 rounded-lg p-4 hover:bg-slate-700/70 transition-colors cursor-pointer">
            <div className="flex items-center space-x-3 mb-3">
              <div className="w-10 h-10 bg-gradient-to-br from-cyan-500 to-primary-600 rounded-full flex items-center justify-center">
                <span className="text-white font-bold text-sm">PL</span>
              </div>
              <div>
                <p className="text-white font-semibold">Dr. Pedro Lima</p>
                <p className="text-slate-400 text-sm">Ortopedista</p>
              </div>
            </div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center">
                <span className="text-yellow-400">⭐⭐⭐⭐⭐</span>
                <span className="text-slate-300 text-sm ml-2">4.8</span>
              </div>
              <span className="text-slate-400 text-xs">98 avaliações</span>
            </div>
            <p className="text-slate-300 text-sm mb-3">
              Especialista em ortopedia e traumatologia. 
              Cirurgião de coluna com técnicas minimamente invasivas.
            </p>
            <div className="flex items-center justify-between">
              <span className="text-orange-400 text-sm">🟡 Ausente</span>
              <button className="bg-primary-600 hover:bg-primary-700 text-white px-3 py-1 rounded text-sm transition-colors">
                Ver Perfil
              </button>
            </div>
          </div>

          {/* Dr. Sofia Ferreira - Dermatologista */}
          <div className="bg-slate-700/50 rounded-lg p-4 hover:bg-slate-700/70 transition-colors cursor-pointer">
            <div className="flex items-center space-x-3 mb-3">
              <div className="w-10 h-10 bg-gradient-to-br from-rose-500 to-pink-600 rounded-full flex items-center justify-center">
                <span className="text-white font-bold text-sm">SF</span>
              </div>
              <div>
                <p className="text-white font-semibold">Dra. Sofia Ferreira</p>
                <p className="text-slate-400 text-sm">Dermatologista</p>
              </div>
            </div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center">
                <span className="text-yellow-400">⭐⭐⭐⭐⭐</span>
                <span className="text-slate-300 text-sm ml-2">4.9</span>
              </div>
              <span className="text-slate-400 text-xs">167 avaliações</span>
            </div>
            <p className="text-slate-300 text-sm mb-3">
              Especialista em dermatologia clínica e estética. 
              Experiência em tratamento de câncer de pele e dermatoscopia.
            </p>
            <div className="flex items-center justify-between">
              <span className="text-green-400 text-sm">🟢 Online</span>
              <button className="bg-primary-600 hover:bg-primary-700 text-white px-3 py-1 rounded text-sm transition-colors">
                Ver Perfil
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    {/* Calendário do Paciente */}
    <div className="bg-slate-800/80 rounded-lg p-6 border border-slate-700">
      <h3 className="text-xl font-bold text-white mb-4">📅 Meu Calendário de Consultas</h3>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Próximas Consultas */}
        <div>
          <h4 className="text-lg font-semibold text-white mb-4">Próximas Consultas</h4>
          <div className="space-y-3">
            <div className="bg-slate-700/50 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-primary-600 rounded-full flex items-center justify-center">
                    <Clock className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="text-white font-semibold">Consulta de Retorno</p>
                    <p className="text-slate-400 text-sm">Dr. Passos Mir</p>
                  </div>
                </div>
                <span className="text-primary-400 text-sm font-medium">22/01/2024</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-300 text-sm">14:30 - 15:30</span>
                <span className="bg-green-500/20 text-green-400 px-2 py-1 rounded text-xs">Confirmada</span>
              </div>
            </div>
            
            <div className="bg-slate-700/50 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-purple-600 rounded-full flex items-center justify-center">
                    <Stethoscope className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="text-white font-semibold">Avaliação Cardiológica</p>
                    <p className="text-slate-400 text-sm">Dra. Ana Costa</p>
                  </div>
                </div>
                <span className="text-primary-400 text-sm font-medium">25/01/2024</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-300 text-sm">10:00 - 11:00</span>
                <span className="bg-yellow-500/20 text-yellow-400 px-2 py-1 rounded text-xs">Pendente</span>
              </div>
            </div>
            
            <div className="bg-slate-700/50 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-green-600 rounded-full flex items-center justify-center">
                    <BarChart3 className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="text-white font-semibold">Exame de Rotina</p>
                    <p className="text-slate-400 text-sm">Dr. Passos Mir</p>
                  </div>
                </div>
                <span className="text-primary-400 text-sm font-medium">28/01/2024</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-300 text-sm">09:00 - 10:00</span>
                <span className="bg-primary-500/20 text-primary-400 px-2 py-1 rounded text-xs">Agendada</span>
              </div>
            </div>
          </div>
        </div>
        
        {/* Calendário Visual */}
        <div>
          <h4 className="text-lg font-semibold text-white mb-4">Calendário</h4>
          <div className="bg-slate-700/50 rounded-lg p-4">
            <div className="grid grid-cols-7 gap-1 mb-2">
              {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map(day => (
                <div key={day} className="text-center text-sm font-medium text-slate-400 p-2">
                  {day}
                </div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-1">
              {Array.from({ length: 35 }, (_, i) => {
                const day = i - 6 + 1
                const isCurrentMonth = day > 0 && day <= 31
                const isToday = day === 22
                const hasAppointment = day === 22 || day === 25 || day === 28
                
                return (
                  <div
                    key={i}
                    className={`p-2 text-center text-sm rounded ${
                      isCurrentMonth
                        ? 'text-white hover:bg-slate-600 cursor-pointer'
                        : 'text-slate-500'
                    } ${
                      isToday
                        ? 'bg-primary-600 text-white'
                        : ''
                    } ${
                      hasAppointment && isCurrentMonth
                        ? 'bg-green-500/20 border border-green-500'
                        : ''
                    }`}
                  >
                    {isCurrentMonth ? day : ''}
                    {hasAppointment && isCurrentMonth && (
                      <div className="w-1 h-1 bg-green-400 rounded-full mx-auto mt-1"></div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>
    </div>


      {/* Ações Rápidas */}
      <div className="bg-slate-800/80 rounded-xl p-6 border border-slate-700">
        <h3 className="text-xl font-bold text-white mb-4 text-center">Ações Rápidas</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Link
            to="/clinical-assessment"
            className="bg-gradient-to-r from-green-600 to-teal-600 hover:from-green-700 hover:to-teal-700 text-white py-4 px-6 rounded-lg transition-all duration-200 text-center font-medium text-lg flex items-center justify-center space-x-2"
          >
            <span>📋</span>
            <span>Avaliação Clínica Completa</span>
          </Link>
          <Link
            to="/reports"
            className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white py-4 px-6 rounded-lg transition-all duration-200 text-center font-medium text-lg flex items-center justify-center space-x-2"
          >
            <span>📊</span>
            <span>Meus Relatórios</span>
          </Link>
        </div>
      </div>

      {/* Status Rápido */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="bg-slate-800/80 rounded-lg p-6 text-center">
          <div className="text-3xl font-bold text-primary-400 mb-2">2</div>
          <div className="text-slate-300">Consultas Agendadas</div>
        </div>
        <div className="bg-slate-800/80 rounded-lg p-6 text-center">
          <div className="text-3xl font-bold text-orange-400 mb-2">1</div>
          <div className="text-slate-300">Avaliações Pendentes</div>
        </div>
        <div className="bg-slate-800/80 rounded-lg p-6 text-center">
          <div className="text-3xl font-bold text-green-400 mb-2">3</div>
          <div className="text-slate-300">Relatórios Disponíveis</div>
        </div>
      </div>

      {/* Ações Rápidas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Link
          to="/library"
          className="bg-slate-800/80 hover:bg-slate-700/80 rounded-lg p-6 text-center transition-colors duration-200"
        >
          <div className="text-3xl mb-3">📚</div>
          <div className="text-white font-medium">Biblioteca Médica</div>
        </Link>
        <Link
          to="/chat"
          className="bg-slate-800/80 hover:bg-slate-700/80 rounded-lg p-6 text-center transition-colors duration-200"
        >
          <div className="text-3xl mb-3">💬</div>
          <div className="text-white font-medium">Chat com Profissionais</div>
        </Link>
        <Link
          to="/courses"
          className="bg-slate-800/80 hover:bg-slate-700/80 rounded-lg p-6 text-center transition-colors duration-200"
        >
          <div className="text-3xl mb-3">🎓</div>
          <div className="text-white font-medium">Cursos de Saúde</div>
        </Link>
        <Link
          to="/profile"
          className="bg-slate-800/80 hover:bg-slate-700/80 rounded-lg p-6 text-center transition-colors duration-200"
        >
          <div className="text-3xl mb-3">👤</div>
          <div className="text-white font-medium">Meu Perfil</div>
        </Link>
      </div>
    </div>
  )
}

const ProfessionalDashboard: React.FC = () => {
  const kpis = [
    { 
      label: 'Pacientes Ativos', 
      value: '24', 
      change: '+12%', 
      icon: <Users className="w-6 h-6" />, 
      color: 'text-primary-400',
      bgColor: 'bg-primary-500/20'
    },
    { 
      label: 'Avaliações Hoje', 
      value: '8', 
      change: '+3', 
      icon: <Stethoscope className="w-6 h-6" />, 
      color: 'text-green-400',
      bgColor: 'bg-green-500/20'
    },
    { 
      label: 'Relatórios Pendentes', 
      value: '3', 
      change: '-2', 
      icon: <AlertCircle className="w-6 h-6" />, 
      color: 'text-orange-400',
      bgColor: 'bg-orange-500/20'
    },
    { 
      label: 'Receita Mensal', 
      value: 'R$ 12.450', 
      change: '+8.5%', 
      icon: <BarChart3 className="w-6 h-6" />, 
      color: 'text-purple-400',
      bgColor: 'bg-purple-500/20'
    }
  ]

  const recentPatients = [
    { id: 1, name: 'Maria Silva', lastVisit: '2 dias', status: 'Avaliação Pendente', priority: 'high' },
    { id: 2, name: 'João Santos', lastVisit: '5 dias', status: 'Relatório Pronto', priority: 'medium' },
    { id: 3, name: 'Ana Costa', lastVisit: '1 semana', status: 'Consulta Agendada', priority: 'low' },
    { id: 4, name: 'Carlos Lima', lastVisit: '3 dias', status: 'Aguardando Resultados', priority: 'high' },
  ]

  const upcomingAppointments = [
    { time: '09:00', patient: 'Maria Silva', type: 'Avaliação IMRE' },
    { time: '10:30', patient: 'João Santos', type: 'Consulta de Retorno' },
    { time: '14:00', patient: 'Ana Costa', type: 'Avaliação Inicial' },
    { time: '15:30', patient: 'Carlos Lima', type: 'Discussão de Resultados' },
  ]

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-4xl font-bold text-white mb-4">
          🏥 Dashboard Profissional
        </h1>
        <p className="text-slate-300 text-lg">
          Gerencie seus pacientes e acesse ferramentas clínicas avançadas
        </p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {kpis.map((kpi, index) => (
          <div key={index} className="bg-slate-800/80 rounded-lg p-6 border border-slate-700">
            <div className="flex items-center justify-between mb-4">
              <div className={`p-3 rounded-lg ${kpi.bgColor}`}>
                <div className={`${kpi.color}`}>
                  {kpi.icon}
                </div>
              </div>
              <span className="text-sm text-green-400 font-medium">{kpi.change}</span>
            </div>
            <div>
              <p className="text-2xl font-bold text-white mb-1">{kpi.value}</p>
              <p className="text-slate-400 text-sm">{kpi.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Pacientes Recentes */}
        <div className="lg:col-span-2 bg-slate-800/80 rounded-lg p-6 border border-slate-700">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-white">👥 Meus Pacientes</h3>
            <Link 
              to="/patients" 
              className="text-primary-400 hover:text-blue-300 text-sm font-medium"
            >
              Ver Todos →
            </Link>
          </div>
          <div className="space-y-4">
            {recentPatients.map((patient) => (
              <div key={patient.id} className="flex items-center justify-between p-4 bg-slate-700/50 rounded-lg hover:bg-slate-700/70 transition-colors">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-purple-600 rounded-full flex items-center justify-center">
                    <span className="text-white font-bold text-sm">
                      {patient.name.split(' ').map(n => n[0]).join('')}
                    </span>
                  </div>
                  <div>
                    <p className="font-semibold text-white">{patient.name}</p>
                    <p className="text-slate-400 text-sm">{patient.lastVisit} atrás</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    patient.priority === 'high' ? 'bg-red-500/20 text-red-400' :
                    patient.priority === 'medium' ? 'bg-yellow-500/20 text-yellow-400' :
                    'bg-green-500/20 text-green-400'
                  }`}>
                    {patient.status}
                  </span>
                  <Link
                    to={`/patient/${patient.id}`}
                    className="text-primary-400 hover:text-blue-300 text-sm font-medium"
                  >
                    Ver →
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Agenda e Ferramentas */}
        <div className="space-y-6">
          {/* Próximas Consultas */}
          <div className="bg-slate-800/80 rounded-lg p-6 border border-slate-700">
            <h3 className="text-lg font-bold text-white mb-4">📅 Agenda de Hoje</h3>
            <div className="space-y-3">
              {upcomingAppointments.map((appointment, index) => (
                <div key={index} className="flex items-center space-x-3 p-3 bg-slate-700/50 rounded-lg">
                  <div className="text-primary-400 font-mono text-sm">{appointment.time}</div>
                  <div className="flex-1">
                    <p className="text-white text-sm font-medium">{appointment.patient}</p>
                    <p className="text-slate-400 text-xs">{appointment.type}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Ferramentas Clínicas */}
          <div className="bg-slate-800/80 rounded-lg p-6 border border-slate-700">
            <h3 className="text-lg font-bold text-white mb-4">🛠️ Ferramentas Clínicas</h3>
            <div className="space-y-3">
              <Link
                to="/clinical-assessment"
                className="flex items-center space-x-3 p-3 bg-primary-500/20 hover:bg-blue-500/30 rounded-lg transition-colors"
              >
                <Stethoscope className="w-5 h-5 text-primary-400" />
                <span className="text-white font-medium">Avaliação IMRE</span>
              </Link>
              <Link
                to="/chat"
                className="flex items-center space-x-3 p-3 bg-purple-500/20 hover:bg-purple-500/30 rounded-lg transition-colors"
              >
                <Users className="w-5 h-5 text-purple-400" />
                <span className="text-white font-medium">Chat Global + Fórum</span>
              </Link>
              <Link
                to="/reports"
                className="flex items-center space-x-3 p-3 bg-orange-500/20 hover:bg-orange-500/30 rounded-lg transition-colors"
              >
                <BarChart3 className="w-5 h-5 text-orange-400" />
                <span className="text-white font-medium">Relatórios</span>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Avaliações e Pacientes */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Avaliações Recentes */}
        <div className="bg-slate-800/80 rounded-lg p-6 border border-slate-700">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-white">📋 Avaliações Recentes</h3>
            <Link 
              to="/evaluations" 
              className="text-primary-400 hover:text-blue-300 text-sm font-medium"
            >
              Ver Todas →
            </Link>
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-slate-700/50 rounded-lg">
              <div className="flex items-center space-x-4">
                <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-teal-600 rounded-full flex items-center justify-center">
                  <Stethoscope className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-white font-medium">Maria Silva - IMRE</p>
                  <p className="text-slate-400 text-sm">15/01/2024 - 14:30</p>
                  <span className="inline-block px-2 py-1 bg-green-500/20 text-green-400 text-xs rounded-full mt-1">
                    Concluída
                  </span>
                </div>
              </div>
              <div className="flex space-x-2">
                <button className="text-primary-400 hover:text-blue-300 text-sm px-3 py-1 bg-primary-500/20 rounded-lg">
                  👁️ Ver
                </button>
                <button className="text-green-400 hover:text-green-300 text-sm px-3 py-1 bg-green-500/20 rounded-lg">
                  📥 PDF
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between p-4 bg-slate-700/50 rounded-lg">
              <div className="flex items-center space-x-4">
                <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-red-600 rounded-full flex items-center justify-center">
                  <AlertCircle className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-white font-medium">João Santos - AEC</p>
                  <p className="text-slate-400 text-sm">14/01/2024 - 10:15</p>
                  <span className="inline-block px-2 py-1 bg-orange-500/20 text-orange-400 text-xs rounded-full mt-1">
                    Em Andamento
                  </span>
                </div>
              </div>
              <div className="flex space-x-2">
                <button className="text-primary-400 hover:text-blue-300 text-sm px-3 py-1 bg-primary-500/20 rounded-lg">
                  👁️ Ver
                </button>
                <button className="text-yellow-400 hover:text-yellow-300 text-sm px-3 py-1 bg-yellow-500/20 rounded-lg">
                  ✏️ Editar
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between p-4 bg-slate-700/50 rounded-lg">
              <div className="flex items-center space-x-4">
                <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-600 rounded-full flex items-center justify-center">
                  <CheckCircle className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-white font-medium">Ana Costa - Retorno</p>
                  <p className="text-slate-400 text-sm">13/01/2024 - 16:45</p>
                  <span className="inline-block px-2 py-1 bg-green-500/20 text-green-400 text-xs rounded-full mt-1">
                    Concluída
                  </span>
                </div>
              </div>
              <div className="flex space-x-2">
                <button className="text-primary-400 hover:text-blue-300 text-sm px-3 py-1 bg-primary-500/20 rounded-lg">
                  👁️ Ver
                </button>
                <button className="text-green-400 hover:text-green-300 text-sm px-3 py-1 bg-green-500/20 rounded-lg">
                  📥 PDF
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Pacientes Detalhados */}
        <div className="bg-slate-800/80 rounded-lg p-6 border border-slate-700">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-white">👥 Meus Pacientes</h3>
            <Link 
              to="/patients" 
              className="text-primary-400 hover:text-blue-300 text-sm font-medium"
            >
              Ver Todos →
            </Link>
          </div>
          <div className="space-y-4">
            <div className="p-4 bg-slate-700/50 rounded-lg">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-purple-600 rounded-full flex items-center justify-center">
                    <span className="text-white font-bold text-sm">MS</span>
                  </div>
                  <div>
                    <p className="text-white font-semibold">Maria Silva</p>
                    <p className="text-slate-400 text-sm">45 anos • Feminino</p>
                  </div>
                </div>
                <span className="px-2 py-1 bg-green-500/20 text-green-400 text-xs rounded-full">
                  Ativo
                </span>
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-slate-400">Última consulta:</span>
                  <p className="text-white">15/01/2024</p>
                </div>
                <div>
                  <span className="text-slate-400">Próxima consulta:</span>
                  <p className="text-white">22/01/2024</p>
                </div>
                <div>
                  <span className="text-slate-400">Diagnóstico:</span>
                  <p className="text-white">Hipertensão</p>
                </div>
                <div>
                  <span className="text-slate-400">Status:</span>
                  <p className="text-green-400">Estável</p>
                </div>
              </div>
            </div>

            <div className="p-4 bg-slate-700/50 rounded-lg">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-red-600 rounded-full flex items-center justify-center">
                    <span className="text-white font-bold text-sm">JS</span>
                  </div>
                  <div>
                    <p className="text-white font-semibold">João Santos</p>
                    <p className="text-slate-400 text-sm">52 anos • Masculino</p>
                  </div>
                </div>
                <span className="px-2 py-1 bg-yellow-500/20 text-yellow-400 text-xs rounded-full">
                  Pendente
                </span>
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-slate-400">Última consulta:</span>
                  <p className="text-white">10/01/2024</p>
                </div>
                <div>
                  <span className="text-slate-400">Próxima consulta:</span>
                  <p className="text-white">20/01/2024</p>
                </div>
                <div>
                  <span className="text-slate-400">Diagnóstico:</span>
                  <p className="text-white">Diabetes Tipo 2</p>
                </div>
                <div>
                  <span className="text-slate-400">Status:</span>
                  <p className="text-yellow-400">Aguardando</p>
                </div>
              </div>
            </div>

            <div className="p-4 bg-slate-700/50 rounded-lg">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-teal-600 rounded-full flex items-center justify-center">
                    <span className="text-white font-bold text-sm">AC</span>
                  </div>
                  <div>
                    <p className="text-white font-semibold">Ana Costa</p>
                    <p className="text-slate-400 text-sm">38 anos • Feminino</p>
                  </div>
                </div>
                <span className="px-2 py-1 bg-primary-500/20 text-primary-400 text-xs rounded-full">
                  Nova
                </span>
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-slate-400">Última consulta:</span>
                  <p className="text-white">Hoje</p>
                </div>
                <div>
                  <span className="text-slate-400">Próxima consulta:</span>
                  <p className="text-white">28/01/2024</p>
                </div>
                <div>
                  <span className="text-slate-400">Diagnóstico:</span>
                  <p className="text-white">Avaliação Inicial</p>
                </div>
                <div>
                  <span className="text-slate-400">Status:</span>
                  <p className="text-primary-400">Em Análise</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

const StudentDashboard: React.FC = () => {
  const stats = [
    { label: 'Cursos Inscritos', value: '3', icon: <BookOpen className="w-5 h-5" />, color: 'text-blue-600' },
    { label: 'Aulas Concluídas', value: '45', icon: <CheckCircle className="w-5 h-5" />, color: 'text-green-600' },
    { label: 'Certificados', value: '2', icon: <Award className="w-5 h-5" />, color: 'text-purple-600' },
    { label: 'Horas de Estudo', value: '120h', icon: <Clock className="w-5 h-5" />, color: 'text-orange-600' }
  ]

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white dark:text-slate-900 dark:text-white mb-2">
          Dashboard do Estudante
        </h1>
        <p className="text-gray-600 dark:text-gray-300">
          Acompanhe seu progresso nos cursos e certificações
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((stat, index) => (
          <div key={index} className="bg-slate-100/50 dark:bg-slate-800/80 rounded-lg shadow-sm border border-slate-300/50 dark:border-slate-600/50 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-700 dark:text-slate-300">{stat.label}</p>
                <p className="text-2xl font-bold text-slate-900 dark:text-white dark:text-slate-900 dark:text-white">{stat.value}</p>
              </div>
              <div className={`${stat.color}`}>
                {stat.icon}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-slate-100/50 dark:bg-slate-800/80 rounded-lg shadow-sm border border-slate-300/50 dark:border-slate-600/50 p-6">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white dark:text-slate-900 dark:text-white mb-4">
            Cursos em Andamento
          </h3>
          <div className="space-y-4">
            {[
              { name: 'Arte da Entrevista Clínica', progress: 75, total: 8 },
              { name: 'Pós-Graduação Cannabis', progress: 30, total: 520 }
            ].map((course, index) => (
              <div key={index} className="p-4 bg-slate-100/30 dark:bg-slate-700/50 rounded-lg">
                <div className="flex justify-between items-center mb-2">
                  <h4 className="font-medium text-slate-900 dark:text-white dark:text-slate-900 dark:text-white">{course.name}</h4>
                  <span className="text-sm text-slate-500 dark:text-slate-400">
                    {course.progress}%
                  </span>
                </div>
                <div className="w-full bg-slate-200 dark:bg-slate-600 rounded-full h-2">
                  <div
                    className="bg-primary-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${course.progress}%` }}
                  />
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  {course.total}h total
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-slate-100/50 dark:bg-slate-800/80 rounded-lg shadow-sm border border-slate-300/50 dark:border-slate-600/50 p-6">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white dark:text-slate-900 dark:text-white mb-4">
            Próximas Aulas
          </h3>
          <div className="space-y-3">
            {[
              { title: 'Metodologia AEC', time: 'Hoje, 14:00', type: 'live' },
              { title: 'Sistema IMRE', time: 'Amanhã, 10:00', type: 'video' },
              { title: 'Cannabis Medicinal', time: 'Quarta, 16:00', type: 'live' }
            ].map((class_, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-slate-100/30 dark:bg-slate-700/50 rounded-lg">
                <div>
                  <p className="text-sm font-medium text-slate-900 dark:text-white dark:text-slate-900 dark:text-white">
                    {class_.title}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {class_.time}
                  </p>
                </div>
                <span className={`px-2 py-1 text-xs rounded-full ${
                  class_.type === 'live' 
                    ? 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
                    : 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-primary-400'
                }`}>
                  {class_.type === 'live' ? 'Ao Vivo' : 'Gravada'}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

const AdminDashboard: React.FC = () => {
  const stats = [
    { label: 'Usuários Ativos', value: '1,234', icon: <Users className="w-5 h-5" />, color: 'text-blue-600' },
    { label: 'Cursos Disponíveis', value: '12', icon: <BookOpen className="w-5 h-5" />, color: 'text-green-600' },
    { label: 'Avaliações Hoje', value: '156', icon: <Stethoscope className="w-5 h-5" />, color: 'text-purple-600' },
    { label: 'Sistema Status', value: 'Online', icon: <CheckCircle className="w-5 h-5" />, color: 'text-green-600' }
  ]

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white dark:text-slate-900 dark:text-white mb-2">
          Dashboard Administrativo
        </h1>
        <p className="text-gray-600 dark:text-gray-300">
          Gerencie a plataforma e monitore métricas em tempo real
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((stat, index) => (
          <div key={index} className="bg-slate-100/50 dark:bg-slate-800/80 rounded-lg shadow-sm border border-slate-300/50 dark:border-slate-600/50 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-700 dark:text-slate-300">{stat.label}</p>
                <p className="text-2xl font-bold text-slate-900 dark:text-white dark:text-slate-900 dark:text-white">{stat.value}</p>
              </div>
              <div className={`${stat.color}`}>
                {stat.icon}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 card p-6">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white dark:text-slate-900 dark:text-white mb-4">
            Métricas do Sistema
          </h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600 dark:text-gray-300">Uptime do Servidor</span>
              <span className="text-sm font-medium text-green-600">99.9%</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600 dark:text-gray-300">Tempo de Resposta</span>
              <span className="text-sm font-medium text-blue-600">120ms</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600 dark:text-gray-300">Armazenamento</span>
              <span className="text-sm font-medium text-orange-600">75%</span>
            </div>
          </div>
        </div>

        <div className="bg-slate-100/50 dark:bg-slate-800/80 rounded-lg shadow-sm border border-slate-300/50 dark:border-slate-600/50 p-6">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white dark:text-slate-900 dark:text-white mb-4">
            Ações Rápidas
          </h3>
          <div className="space-y-3">
            <Link
              to="/admin/users"
              className="flex items-center space-x-3 p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors duration-200"
            >
              <Users className="w-5 h-5 text-blue-600" />
              <span className="text-sm font-medium text-blue-900 dark:text-blue-100">
                Gerenciar Usuários
              </span>
            </Link>
            <Link
              to="/admin/courses"
              className="flex items-center space-x-3 p-3 rounded-lg bg-green-50 dark:bg-green-900/20 hover:bg-green-100 dark:hover:bg-green-900/30 transition-colors duration-200"
            >
              <BookOpen className="w-5 h-5 text-green-600" />
              <span className="text-sm font-medium text-green-900 dark:text-green-100">
                Gerenciar Cursos
              </span>
            </Link>
            <Link
              to="/admin/analytics"
              className="flex items-center space-x-3 p-3 rounded-lg bg-purple-50 dark:bg-purple-900/20 hover:bg-purple-100 dark:hover:bg-purple-900/30 transition-colors duration-200"
            >
              <BarChart3 className="w-5 h-5 text-purple-600" />
              <span className="text-sm font-medium text-purple-900 dark:text-purple-100">
                Ver Analytics
              </span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

const DefaultDashboard: React.FC = () => {
  return (
    <div className="text-center py-12">
      <h1 className="text-3xl font-bold text-slate-900 dark:text-white dark:text-slate-900 dark:text-white mb-4">
        Bem-vindo ao MedCannLab 3.0
      </h1>
      <p className="text-gray-600 dark:text-gray-300 mb-8">
        Faça login para acessar seu dashboard personalizado
      </p>
      <Link
        to="/login"
        className="btn-primary"
      >
        Fazer Login
      </Link>
    </div>
  )
}

export default Dashboard
