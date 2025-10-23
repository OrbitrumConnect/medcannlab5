import React, { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { 
  Home, 
  BookOpen, 
  Stethoscope, 
  Users, 
  BarChart3,
  User,
  FileText,
  Shield,
  Brain,
  Database
} from 'lucide-react'

interface SidebarProps {
  userType?: 'patient' | 'professional' | 'student' | 'admin'
}

const Sidebar: React.FC<SidebarProps> = ({ userType = 'patient' }) => {
  const [isCollapsed, setIsCollapsed] = useState(false)
  const location = useLocation()

  const getNavigationItems = () => {
    const baseItems = [
      { name: 'Início', href: '/dashboard', icon: Home },
      { name: 'Dashboard', href: '/dashboard', icon: BarChart3 },
    ]

    const patientItems = [
      { name: '🤖 Avaliação com Nôa', href: '/pre-anamnese', icon: Brain },
      { name: '📋 Avaliação Clínica', href: '/clinical-assessment', icon: Stethoscope },
      { name: '📊 Meus Relatórios', href: '/reports', icon: FileText },
      { name: '📅 Agendamentos', href: '/appointments', icon: FileText },
      { name: '💬 Chat com Meu Médico', href: '/patient-chat', icon: Users },
      { name: '👤 Meu Perfil', href: '/profile', icon: User },
    ]

    const professionalItems = [
      { name: '👥 Meus Pacientes', href: '/patients', icon: Users },
      { name: '📊 Avaliações', href: '/evaluations', icon: Stethoscope },
      { name: '💬 Chat Global + Fórum', href: '/chat', icon: Users },
      { name: '📈 Relatórios', href: '/reports', icon: BarChart3 },
      { name: '👤 Meu Perfil', href: '/profile', icon: User },
    ]

    const studentItems = [
      { name: '🎓 Meus Cursos', href: '/courses', icon: BookOpen },
      { name: '🏆 Gamificação', href: '/gamificacao', icon: Users },
      { name: '📊 Meu Progresso', href: '/progress', icon: BarChart3 },
      { name: '👤 Meu Perfil', href: '/profile', icon: User },
    ]

    const adminItems = [
      { name: '📊 Dashboard Admin', href: '/admin', icon: BarChart3 },
      { name: '📚 Biblioteca', href: '/library', icon: BookOpen },
      { name: '🤖 Chat IA Documentos', href: '/ai-documents', icon: Brain },
    ]

    let specificItems = []
    switch (userType) {
      case 'patient':
        specificItems = patientItems
        break
      case 'professional':
        specificItems = professionalItems
        break
      case 'student':
        specificItems = studentItems
        break
      case 'admin':
        specificItems = adminItems
        break
      default:
        specificItems = patientItems
    }

    return [...baseItems, ...specificItems]
  }

  const quickActions = [
    { name: 'Nova Avaliação', href: '/clinical-assessment', icon: Stethoscope, color: 'bg-blue-500' },
    { name: 'Chat IA', href: '/chat', icon: Brain, color: 'bg-purple-500' },
    { name: 'Biblioteca', href: '/library', icon: BookOpen, color: 'bg-green-500' },
    { name: 'Relatórios', href: '/reports', icon: FileText, color: 'bg-orange-500' },
  ]

  const systemStats = [
    { label: 'Sistema Online', value: '99.9%', color: 'text-green-500' },
    { label: 'Usuários Ativos', value: '1,234', color: 'text-blue-500' },
    { label: 'Avaliações Hoje', value: '156', color: 'text-purple-500' },
  ]

  const navigationItems = getNavigationItems()

  const isActive = (path: string) => location.pathname === path

  return (
    <div className={`bg-slate-800 text-white transition-all duration-300 ${
      isCollapsed ? 'w-20' : 'w-80'
    } flex flex-col h-screen sticky top-0`}>
      {/* Header */}
      <div className="p-6 border-b border-slate-700">
        <div className="flex items-center justify-between">
          {!isCollapsed && (
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-r from-primary-600 to-accent-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-xl">M</span>
              </div>
              <div>
                <span className="text-xl font-bold">MedCannLab</span>
                <div className="text-sm text-slate-400">3.0</div>
              </div>
            </div>
          )}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-2 rounded-md hover:bg-slate-700 transition-colors duration-200"
          >
            {isCollapsed ? <span className="text-white">→</span> : <span className="text-white">←</span>}
          </button>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-6 space-y-3">
        {navigationItems.map((item) => {
          const Icon = item.icon
          return (
            <Link
              key={item.name}
              to={item.href}
              className={`flex items-center space-x-4 px-4 py-3 rounded-lg transition-colors duration-200 ${
                isActive(item.href)
                  ? 'bg-primary-600 text-white'
                  : 'text-slate-300 hover:bg-slate-700 hover:text-white'
              }`}
            >
              <Icon className="w-6 h-6 flex-shrink-0" />
              {!isCollapsed && <span className="text-base font-medium">{item.name}</span>}
            </Link>
          )
        })}
      </nav>

      {/* Quick Actions */}
      {!isCollapsed && (
        <div className="p-6 border-t border-slate-700">
          <h3 className="text-base font-semibold text-slate-400 mb-4">Ações Rápidas</h3>
          <div className="grid grid-cols-2 gap-3">
            {quickActions.map((action) => {
              const Icon = action.icon
              return (
                <Link
                  key={action.name}
                  to={action.href}
                  className={`${action.color} p-3 rounded-lg text-white text-center hover:opacity-80 transition-opacity duration-200`}
                >
                  <Icon className="w-5 h-5 mx-auto mb-2" />
                  <span className="text-sm font-medium">{action.name}</span>
                </Link>
              )
            })}
          </div>
        </div>
      )}

      {/* System Stats */}
      {!isCollapsed && userType === 'admin' && (
        <div className="p-6 border-t border-slate-700">
          <h3 className="text-base font-semibold text-slate-400 mb-4">Status do Sistema</h3>
          <div className="space-y-3">
            {systemStats.map((stat, index) => (
              <div key={index} className="flex justify-between items-center text-sm">
                <span className="text-slate-400">{stat.label}</span>
                <span className={`font-medium ${stat.color}`}>{stat.value}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* User Profile */}
      <div className="p-6 border-t border-slate-700">
        <Link
          to="/profile"
          className="flex items-center space-x-4 px-4 py-3 rounded-lg hover:bg-slate-700 transition-colors duration-200"
        >
          <div className="w-10 h-10 bg-primary-600 rounded-full flex items-center justify-center">
            <User className="w-5 h-5 text-white" />
          </div>
          {!isCollapsed && (
            <div>
              <p className="text-base font-medium text-white">Perfil</p>
              <p className="text-sm text-slate-400">Configurações</p>
            </div>
          )}
        </Link>
      </div>
    </div>
  )
}

export default Sidebar
