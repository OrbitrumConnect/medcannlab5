import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import { 
  User, 
  Users, 
  FileText, 
  Calendar, 
  BarChart3, 
  TrendingUp,
  Activity,
  Stethoscope,
  Heart,
  Clock,
  CheckCircle,
  AlertCircle,
  Brain,
  BookOpen,
  MessageCircle
} from 'lucide-react'
import { backgroundGradient, accentGradient, secondaryGradient } from '../constants/designSystem'

const ProfessionalMyDashboard: React.FC = () => {
  const { user } = useAuth()
  const [stats, setStats] = useState({
    totalPatients: 0,
    activePatients: 0,
    totalAppointments: 0,
    todayAppointments: 0,
    totalReports: 0,
    pendingReports: 0
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user?.id) {
      loadDashboardData()
    }
  }, [user?.id])

  const loadDashboardData = async () => {
    try {
      setLoading(true)
      
      // Buscar pacientes do profissional
      const { data: patientsData, error: patientsError } = await supabase
        .from('users')
        .select('id, name, status')
        .eq('type', 'paciente')
        .or('professional_id.eq.' + user?.id + ',assigned_professional_id.eq.' + user?.id)

      if (patientsError) console.error('Erro ao buscar pacientes:', patientsError)

      // Buscar agendamentos
      const { data: appointmentsData, error: appointmentsError } = await supabase
        .from('appointments')
        .select('id, appointment_date, status')
        .eq('professional_id', user?.id)

      if (appointmentsError) console.error('Erro ao buscar agendamentos:', appointmentsError)

      // Buscar relatórios clínicos
      const { data: reportsData, error: reportsError } = await supabase
        .from('clinical_reports')
        .select('id, status, created_at')
        .eq('professional_id', user?.id)

      if (reportsError) console.error('Erro ao buscar relatórios:', reportsError)

      const today = new Date()
      today.setHours(0, 0, 0, 0)

      const todayAppointments = appointmentsData?.filter(apt => {
        const aptDate = new Date(apt.appointment_date)
        aptDate.setHours(0, 0, 0, 0)
        return aptDate.getTime() === today.getTime()
      }) || []

      setStats({
        totalPatients: patientsData?.length || 0,
        activePatients: patientsData?.filter(p => p.status === 'ativo' || p.status === 'active').length || 0,
        totalAppointments: appointmentsData?.length || 0,
        todayAppointments: todayAppointments.length,
        totalReports: reportsData?.length || 0,
        pendingReports: reportsData?.filter(r => r.status === 'pending' || r.status === 'pendente').length || 0
      })
    } catch (error) {
      console.error('Erro ao carregar dados do dashboard:', error)
    } finally {
      setLoading(false)
    }
  }

  const statCards = [
    {
      id: 'patients',
      label: 'Total de Pacientes',
      value: stats.totalPatients,
      icon: Users,
      gradient: 'from-blue-600 to-blue-500',
      description: `${stats.activePatients} ativos`
    },
    {
      id: 'appointments',
      label: 'Agendamentos',
      value: stats.totalAppointments,
      icon: Calendar,
      gradient: 'from-emerald-600 to-emerald-500',
      description: `${stats.todayAppointments} hoje`
    },
    {
      id: 'reports',
      label: 'Relatórios Clínicos',
      value: stats.totalReports,
      icon: FileText,
      gradient: 'from-purple-600 to-purple-500',
      description: `${stats.pendingReports} pendentes`
    },
    {
      id: 'activity',
      label: 'Atividade',
      value: 'Alta',
      icon: Activity,
      gradient: 'from-orange-600 to-orange-500',
      description: 'Últimos 30 dias'
    }
  ]

  const quickActions = [
    {
      id: 'patients',
      label: 'Meus Pacientes',
      description: 'Gerenciar prontuários e acompanhamentos',
      icon: Users,
      href: '/app/clinica/profissional/pacientes',
      color: 'from-blue-600 to-blue-500'
    },
    {
      id: 'appointments',
      label: 'Agendamentos',
      description: 'Visualizar e gerenciar consultas',
      icon: Calendar,
      href: '/app/clinica/profissional/agendamentos',
      color: 'from-emerald-600 to-emerald-500'
    },
    {
      id: 'reports',
      label: 'Relatórios',
      description: 'Acessar relatórios clínicos',
      icon: BarChart3,
      href: '/app/clinica/profissional/dashboard?section=relatorios-clinicos',
      color: 'from-purple-600 to-purple-500'
    },
    {
      id: 'chat',
      label: 'Chat com Equipe',
      description: 'Comunicação com outros profissionais',
      icon: MessageCircle,
      href: '/app/clinica/profissional/dashboard?section=chat-profissionais',
      color: 'from-indigo-600 to-indigo-500'
    }
  ]

  const platformFeatures = [
    {
      id: 'noa',
      label: 'IA Nôa Esperança',
      description: 'Assistente de IA para apoio clínico',
      icon: Brain,
      available: true,
      href: '/app/clinica/profissional/dashboard?section=chat-profissionais'
    },
    {
      id: 'prescriptions',
      label: 'Prescrições Integrativas',
      description: 'Sistema de prescrições com 5 racionalidades',
      icon: Heart,
      available: true,
      href: '/app/clinica/profissional/dashboard?section=prescricoes'
    },
    {
      id: 'library',
      label: 'Biblioteca Clínica',
      description: 'Acesso a materiais e protocolos',
      icon: BookOpen,
      available: true,
      href: '/app/library'
    },
    {
      id: 'analytics',
      label: 'Analytics Avançado',
      description: 'Análise de dados e métricas',
      icon: TrendingUp,
      available: true,
      href: '/app/clinica/profissional/dashboard?section=relatorios-clinicos'
    }
  ]

  return (
    <div className="min-h-screen text-white" style={{ background: backgroundGradient }}>
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-4 mb-4">
            <div 
              className="w-16 h-16 rounded-full flex items-center justify-center"
              style={{ background: accentGradient }}
            >
              <User className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">
                Meu Dashboard
              </h1>
              <p className="text-[#C8D6E5] mt-1">
                {user?.name || 'Profissional'} • {user?.email}
              </p>
            </div>
          </div>
        </div>

        {/* Estatísticas */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {statCards.map((card) => {
            const Icon = card.icon
            return (
              <div
                key={card.id}
                className="rounded-xl p-6 border transition-all duration-300 hover:scale-[1.02]"
                style={{
                  background: 'rgba(7, 22, 41, 0.88)',
                  borderColor: 'rgba(0, 193, 106, 0.12)',
                  boxShadow: '0 18px 42px rgba(2, 12, 27, 0.55)'
                }}
              >
                <div className="flex items-center justify-between mb-4">
                  <div className={`w-12 h-12 rounded-lg bg-gradient-to-r ${card.gradient} flex items-center justify-center`}>
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                </div>
                <h3 className="text-2xl font-bold text-white mb-1">{card.value}</h3>
                <p className="text-sm text-[#C8D6E5] mb-1">{card.label}</p>
                <p className="text-xs text-[#94A3B8]">{card.description}</p>
              </div>
            )
          })}
        </div>

        {/* Ações Rápidas */}
        <div className="mb-8">
          <h2 className="text-xl font-bold text-white mb-4">Ações Rápidas</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {quickActions.map((action) => {
              const Icon = action.icon
              return (
                <Link
                  key={action.id}
                  to={action.href}
                  className="rounded-xl p-5 border transition-all duration-300 hover:scale-[1.02] cursor-pointer"
                  style={{
                    background: 'rgba(7, 22, 41, 0.88)',
                    borderColor: 'rgba(0, 193, 106, 0.12)',
                    boxShadow: '0 18px 42px rgba(2, 12, 27, 0.55)'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = 'rgba(0, 193, 106, 0.3)'
                    e.currentTarget.style.transform = 'translateY(-2px)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = 'rgba(0, 193, 106, 0.12)'
                    e.currentTarget.style.transform = 'translateY(0)'
                  }}
                >
                  <div className={`w-10 h-10 rounded-lg bg-gradient-to-r ${action.color} flex items-center justify-center mb-3`}>
                    <Icon className="w-5 h-5 text-white" />
                  </div>
                  <h3 className="text-lg font-semibold text-white mb-1">{action.label}</h3>
                  <p className="text-sm text-[#94A3B8]">{action.description}</p>
                </Link>
              )
            })}
          </div>
        </div>

        {/* Recursos da Plataforma */}
        <div>
          <h2 className="text-xl font-bold text-white mb-4">Recursos Disponíveis</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {platformFeatures.map((feature) => {
              const Icon = feature.icon
              return (
                <Link
                  key={feature.id}
                  to={feature.href}
                  className="rounded-xl p-5 border transition-all duration-300 cursor-pointer"
                  style={{
                    background: 'rgba(7, 22, 41, 0.88)',
                    borderColor: 'rgba(0, 193, 106, 0.12)',
                    boxShadow: '0 18px 42px rgba(2, 12, 27, 0.55)'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = 'rgba(0, 193, 106, 0.3)'
                    e.currentTarget.style.transform = 'translateY(-2px)'
                    e.currentTarget.style.boxShadow = '0 20px 50px rgba(2, 12, 27, 0.65)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = 'rgba(0, 193, 106, 0.12)'
                    e.currentTarget.style.transform = 'translateY(0)'
                    e.currentTarget.style.boxShadow = '0 18px 42px rgba(2, 12, 27, 0.55)'
                  }}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-r from-[#00C16A] to-[#13794f] flex items-center justify-center">
                      <Icon className="w-5 h-5 text-white" />
                    </div>
                    {feature.available && (
                      <CheckCircle className="w-5 h-5 text-[#00C16A]" />
                    )}
                  </div>
                  <h3 className="text-base font-semibold text-white mb-1">{feature.label}</h3>
                  <p className="text-sm text-[#94A3B8]">{feature.description}</p>
                </Link>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}

export default ProfessionalMyDashboard

