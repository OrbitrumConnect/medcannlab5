import React, { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { Menu, X, User, LogOut, Settings } from 'lucide-react'

const Header: React.FC = () => {
  const { user, logout } = useAuth()
  const location = useLocation()
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isProfileOpen, setIsProfileOpen] = useState(false)

  const getNavigationByUserType = () => {
    if (!user) return []
    
    switch (user.type) {
      case 'patient':
        return [
          { name: '🏠 Dashboard', href: '/dashboard' },
          { name: '🤖 Avaliação com Nôa', href: '/pre-anamnese' },
          { name: '📋 Avaliação Clínica', href: '/clinical-assessment' },
          { name: '📊 Meus Relatórios', href: '/reports' },
          { name: '💬 Chat com Médico', href: '/patient-chat' },
          { name: '👤 Meu Perfil', href: '/profile' },
        ]
      case 'professional':
        return [
          { name: '🏥 Dashboard Profissional', href: '/dashboard' },
          { name: '👥 Meus Pacientes', href: '/patients' },
          { name: '📊 Avaliações', href: '/evaluations' },
          { name: '📚 Biblioteca Médica', href: '/library' },
          { name: '💬 Chat Global + Fórum', href: '/chat' },
          { name: '📈 Relatórios', href: '/reports' },
        ]
      case 'student':
        return [
          { name: '🎓 Dashboard Estudante', href: '/dashboard' },
          { name: '📚 Meus Cursos', href: '/courses' },
          { name: '📖 Biblioteca', href: '/library' },
          { name: '🏆 Gamificação', href: '/gamificacao' },
          { name: '📊 Meu Progresso', href: '/progress' },
          { name: '👤 Meu Perfil', href: '/profile' },
        ]
      case 'admin':
        return [
          { name: '👑 Dashboard Admin', href: '/admin' },
          { name: '📚 Biblioteca', href: '/library' },
          { name: '🤖 Chat IA Documentos', href: '/ai-documents' },
        ]
      default:
        return []
    }
  }

  const navigation = getNavigationByUserType()

  const isActive = (path: string) => location.pathname === path

  return (
    <header className="bg-slate-800 shadow-lg border-b border-slate-700">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center">
            <Link to="/" className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-r from-primary-600 to-accent-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">M</span>
              </div>
              <span className="text-xl font-bold text-white">
                MedCannLab
                <span className="text-sm text-blue-400 ml-1">3.0</span>
              </span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-6">
            {/* Indicador de Perfil */}
            <div className="flex items-center space-x-2 bg-slate-700/50 px-3 py-1 rounded-full">
              <div className="w-2 h-2 bg-green-400 rounded-full"></div>
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
                      ? 'text-blue-400 bg-blue-900/30'
                      : 'text-slate-200 hover:text-blue-400 hover:bg-slate-700/50'
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
                  className="flex items-center space-x-2 text-slate-200 hover:text-blue-400 transition-colors duration-200"
                >
                  <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
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
                      onClick={logout}
                      className="flex items-center w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
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
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors duration-200"
              >
                Entrar
              </Link>
            )}

            {/* Mobile menu button */}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="md:hidden p-2 rounded-md text-slate-200 hover:text-blue-400 hover:bg-slate-700"
            >
              {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden">
            <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 border-t border-slate-700">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`block px-3 py-2 rounded-md text-base font-medium transition-colors duration-200 ${
                    isActive(item.href)
                      ? 'text-blue-400 bg-blue-900/30'
                      : 'text-slate-200 hover:text-blue-400 hover:bg-slate-700/50'
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
