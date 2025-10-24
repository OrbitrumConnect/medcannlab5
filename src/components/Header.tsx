import React, { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { Menu, X, User, LogOut, Settings, ChevronLeft, ChevronRight } from 'lucide-react'

const Header: React.FC = () => {
  const { user, logout } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isProfileOpen, setIsProfileOpen] = useState(false)
  const [isAdminMode, setIsAdminMode] = useState(false)

  // Debug: verificar se o usuário é admin (removido para evitar spam)
  // console.log('🔍 Header - User type:', user?.type, 'isAdmin:', user?.type === 'admin')

  const getNavigationByUserType = () => {
    if (!user) return []
    
    // Se for admin e estiver no modo admin, mostrar menu admin
    if (user.type === 'admin' && isAdminMode) {
      return [
        { name: '👑 Dashboard Admin', href: '/app/admin' },
        { name: '📚 Biblioteca', href: '/app/library' },
        { name: '🤖 Chat IA Documentos', href: '/app/ai-documents' },
      ]
    }
    
    // Se for admin mas estiver no modo profissional, mostrar menu profissional
    if (user.type === 'admin' && !isAdminMode) {
      return [
        { name: '🏥 Dashboard Profissional', href: '/app/dashboard' },
        { name: '👥 Meus Pacientes', href: '/app/patients' },
        { name: '📊 Avaliações', href: '/app/evaluations' },
        { name: '📚 Biblioteca Médica', href: '/app/library' },
        { name: '💬 Chat Global + Fórum', href: '/app/chat' },
        { name: '📈 Relatórios', href: '/app/reports' },
      ]
    }
    
    switch (user.type) {
      case 'patient':
        return [
          { name: '🏠 Dashboard', href: '/app/dashboard' },
          { name: '🤖 Avaliação com Nôa', href: '/pre-anamnese' },
          { name: '📋 Avaliação Clínica', href: '/app/clinical-assessment' },
          { name: '📊 Meus Relatórios', href: '/app/reports' },
          { name: '💬 Chat com Médico', href: '/app/patient-chat' },
          { name: '👤 Meu Perfil', href: '/app/profile' },
        ]
      case 'professional':
        return [
          { name: '🏥 Dashboard Profissional', href: '/app/dashboard' },
          { name: '👥 Meus Pacientes', href: '/app/patients' },
          { name: '📊 Avaliações', href: '/app/evaluations' },
          { name: '📚 Biblioteca Médica', href: '/app/library' },
          { name: '💬 Chat Global + Fórum', href: '/app/chat' },
          { name: '📈 Relatórios', href: '/app/reports' },
        ]
      case 'student':
        return [
          { name: '🎓 Dashboard Estudante', href: '/app/dashboard' },
          { name: '📚 Meus Cursos', href: '/app/courses' },
          { name: '📖 Biblioteca', href: '/app/library' },
          { name: '🏆 Gamificação', href: '/app/gamificacao' },
          { name: '📊 Meu Progresso', href: '/app/progress' },
          { name: '👤 Meu Perfil', href: '/app/profile' },
        ]
      default:
        return []
    }
  }

  const navigation = getNavigationByUserType()

  const isActive = (path: string) => location.pathname === path

  return (
    <header className="bg-slate-800 shadow-lg border-b border-slate-700">
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center">
            <Link to="/" className="flex items-center">
              <div className="w-10 h-10 bg-gradient-to-r from-primary-600 to-accent-500 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-xl">M</span>
              </div>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-6">
            {/* Toggle Admin/Professional para admins */}
            {user?.type === 'admin' && (
              <div className="flex items-center space-x-2 bg-gradient-to-r from-blue-600/20 to-yellow-600/20 border border-blue-500/30 px-3 py-2 rounded-lg">
                <button
                  onClick={() => {
                    console.log('🔄 Toggle clicked, current mode:', isAdminMode)
                    setIsAdminMode(!isAdminMode)
                    // Redirecionar para a página apropriada
                    if (!isAdminMode) {
                      navigate('/app/admin')
                    } else {
                      navigate('/app/dashboard')
                    }
                  }}
                  className="flex items-center space-x-2 text-white hover:text-yellow-300 transition-colors"
                >
                  {isAdminMode ? (
                    <ChevronRight className="w-4 h-4 text-yellow-400" />
                  ) : (
                    <ChevronLeft className="w-4 h-4 text-blue-400" />
                  )}
                  <span className="text-sm font-medium">
                    {isAdminMode ? '👑 Admin' : '👨‍⚕️ Profissional'}
                  </span>
                </button>
              </div>
            )}
            
            {/* Indicador de Perfil */}
            <div className="flex items-center space-x-2 bg-slate-700/50 px-3 py-1 rounded-full">
              <div className={`w-2 h-2 rounded-full ${user?.type === 'admin' ? 'bg-yellow-400' : 'bg-green-400'}`}></div>
              <span className="text-sm text-slate-300">
                {user?.type === 'patient' && '👤 Paciente'}
                {user?.type === 'professional' && '👨‍⚕️ Profissional'}
                {user?.type === 'student' && '👨‍🎓 Estudante'}
                {user?.type === 'admin' && '👑 Administrador'}
              </span>
            </div>
            
            <nav className="flex space-x-4">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200 ${
                    isActive(item.href)
                      ? 'text-primary-400 bg-primary-900/30'
                      : 'text-slate-200 hover:text-primary-400 hover:bg-slate-700/50'
                  }`}
                >
                  {item.name}
                </Link>
              ))}
            </nav>
          </div>

          {/* User Menu */}
          <div className="flex items-center space-x-4">
            {user ? (
              <div className="relative">
                <button
                  onClick={() => setIsProfileOpen(!isProfileOpen)}
                  className="flex items-center space-x-2 text-slate-200 hover:text-primary-400 transition-colors duration-200"
                >
                  <div className="w-8 h-8 bg-primary-600 rounded-full flex items-center justify-center">
                    <User className="w-4 h-4 text-white" />
                  </div>
                  <span className="hidden sm:block text-sm font-medium">{user.name}</span>
                </button>

                {isProfileOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-slate-800 rounded-md shadow-lg py-1 z-50 border border-slate-700">
                    <div className="px-4 py-2 border-b border-slate-700">
                      <p className="text-sm font-medium text-white">{user.name}</p>
                      <p className="text-xs text-slate-400">{user.email}</p>
                    </div>
                    <Link
                      to="/profile"
                      className="flex items-center px-4 py-2 text-sm text-slate-200 hover:bg-slate-700"
                    >
                      <Settings className="w-4 h-4 mr-2" />
                      Configurações
                    </Link>
                    <button
                      onClick={() => {
                        logout()
                        setIsProfileOpen(false)
                      }}
                      className="flex items-center w-full px-4 py-2 text-sm text-slate-200 hover:bg-slate-700"
                    >
                      <LogOut className="w-4 h-4 mr-2" />
                      Sair
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <Link
                to="/login"
                className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg font-medium transition-colors duration-200"
              >
                Entrar
              </Link>
            )}

            {/* Mobile menu button */}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="md:hidden p-2 rounded-md text-slate-200 hover:text-primary-400 hover:bg-slate-700"
            >
              {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden">
            <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 border-t border-slate-700">
              {/* Toggle Admin/Professional para admins - Mobile */}
              {user?.type === 'admin' && (
                <div className="px-3 py-2 border-b border-slate-600">
                  <button
                    onClick={() => {
                      setIsAdminMode(!isAdminMode)
                      setIsMenuOpen(false)
                      // Redirecionar para a página apropriada
                      if (!isAdminMode) {
                        navigate('/app/admin')
                      } else {
                        navigate('/app/dashboard')
                      }
                    }}
                    className="flex items-center space-x-2 text-slate-300 hover:text-white transition-colors w-full"
                  >
                    {isAdminMode ? (
                      <ChevronRight className="w-4 h-4 text-yellow-400" />
                    ) : (
                      <ChevronLeft className="w-4 h-4 text-blue-400" />
                    )}
                    <span className="text-sm">
                      {isAdminMode ? '👑 Modo Admin' : '👨‍⚕️ Modo Profissional'}
                    </span>
                  </button>
                </div>
              )}
              
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`block px-3 py-2 rounded-md text-base font-medium transition-colors duration-200 ${
                    isActive(item.href)
                      ? 'text-primary-400 bg-primary-900/30'
                      : 'text-slate-200 hover:text-primary-400 hover:bg-slate-700/50'
                  }`}
                  onClick={() => setIsMenuOpen(false)}
                >
                  {item.name}
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </header>
  )
}

export default Header
