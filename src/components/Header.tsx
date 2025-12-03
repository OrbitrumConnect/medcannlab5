import React, { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useUserView } from '../contexts/UserViewContext'
import { Menu, X, User, LogOut, Settings, Stethoscope, GraduationCap, Shield, ChevronDown, Brain } from 'lucide-react'
import { normalizeUserType, getDefaultRouteByType, UserType } from '../lib/userTypes'
import NotificationCenter from './NotificationCenter'
import { useNoaPlatform } from '../contexts/NoaPlatformContext'

const Header: React.FC = () => {
  const { user, logout } = useAuth()
  const { viewAsType, setViewAsType } = useUserView()
  const location = useLocation()
  const navigate = useNavigate()
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isProfileOpen, setIsProfileOpen] = useState(false)
  const { openChat } = useNoaPlatform()

  const headerGradient = 'linear-gradient(135deg, rgba(10,25,47,0.96) 0%, rgba(26,54,93,0.92) 55%, rgba(45,90,61,0.9) 100%)'
  const neutralSurface = 'rgba(7, 22, 41, 0.85)'

  const getNavigationByUserType = () => {
    if (!user) return []
    
    // Normalizar tipo de usuário (sempre em português)
    const userType = normalizeUserType(user.type)
    
    switch (userType) {
      case 'paciente':
        // Botões removidos - já estão no "Meu Dashboard de Saúde"
        return []
      case 'profissional':
        // Botão do fórum movido para a sidebar
        return []
      case 'aluno':
        return [
          { name: '🎓 Dashboard Estudante', href: '/app/ensino/aluno/dashboard' },
          { name: '📚 Meus Cursos', href: '/app/ensino/aluno/cursos' },
          { name: '📖 Biblioteca', href: '/app/ensino/aluno/biblioteca' },
        { name: '🏆 Programa de Pontos', href: '/app/ensino/aluno/gamificacao' },
          { name: '👤 Meu Perfil', href: '/app/profile' },
        ]
      case 'admin':
        return []
      default:
        return []
    }
  }

  const navigation = getNavigationByUserType()

  const isActive = (path: string) => location.pathname === path

  return (
    <header
      className="shadow-lg border-b header-mobile"
      style={{ background: headerGradient, borderColor: 'rgba(0,193,106,0.15)' }}
    >
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Desktop Navigation */}
          {navigation.length > 0 && (
            <div className="hidden md:flex items-center space-x-6">
              <nav className="flex space-x-4">
                {navigation.map((item) => (
                  <Link
                    key={item.name}
                    to={item.href}
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200 ${
                    isActive(item.href)
                      ? 'text-[#FFD33D] bg-[#213553]'
                      : 'text-[#C8D6E5] hover:text-[#FFD33D] hover:bg-[#1b314e]'
                  }`}
                  >
                    {item.name}
                  </Link>
                ))}
              </nav>
            </div>
          )}

          {/* User Menu */}
          <div className="flex items-center space-x-2">
            {user ? (
              <>
                <button
                  onClick={openChat}
                  className="hidden sm:inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-gradient-to-r from-emerald-600 to-sky-500 text-white text-sm font-medium shadow-lg hover:from-emerald-500 hover:to-sky-400 transition"
                  aria-label="Abrir diálogo com a IA residente"
                >
                  <Brain className="w-4 h-4" />
                  <span className="whitespace-nowrap">Falar com a Nôa</span>
                </button>
                <button
                  onClick={openChat}
                  className="sm:hidden inline-flex items-center justify-center w-10 h-10 rounded-full bg-gradient-to-r from-emerald-600 to-sky-500 text-white shadow-lg hover:from-emerald-500 hover:to-sky-400 transition"
                  aria-label="Abrir chat da Nôa"
                >
                  <Brain className="w-5 h-5" />
                </button>
                {/* Menu de Tipos de Usuário - Botões Visíveis no Header */}
                {(() => {
                  const userType = normalizeUserType(user.type)
                  const isAdmin = userType === 'admin'
                  const isProfessional = userType === 'profissional'
                  const isAluno = userType === 'aluno'
                  
                  if (!isAdmin && !isProfessional && !isAluno) return null
                  
                  // Detectar eixo atual da URL
                  const currentPath = location.pathname
                  let currentEixo: 'clinica' | 'ensino' | 'pesquisa' = 'clinica'
                  if (currentPath.includes('/ensino/')) currentEixo = 'ensino'
                  else if (currentPath.includes('/pesquisa/')) currentEixo = 'pesquisa'
                  else if (currentPath.includes('/clinica/')) currentEixo = 'clinica'
                  
                  // Definir tipos disponíveis baseado no tipo de usuário
                  // Admin pode ver todos os tipos (incluindo ele mesmo) e consultórios específicos
                  // Profissional e Aluno veem apenas o próprio tipo
                  const availableTypes = isAdmin 
                    ? [
                        { 
                          id: 'admin', 
                          label: 'Admin', 
                          icon: Shield, 
                          route: '/app/ricardo-valenca-dashboard',
                          description: 'Dashboard Administrativo',
                          color: 'from-[#FFD33D] to-[#F4B740]'
                        },
                        { 
                          id: 'profissional', 
                          label: 'Profissional', 
                          icon: Stethoscope, 
                          route: `/app/${currentEixo}/profissional/dashboard`,
                          description: 'Dashboard Profissional',
                          color: 'from-[#00C16A] to-[#00945B]'
                        },
                        { 
                          id: 'paciente', 
                          label: 'Paciente', 
                          icon: User, 
                          route: '/app/clinica/paciente/dashboard',
                          description: 'Dashboard do Paciente',
                          color: 'from-[#1a365d] to-[#0d223b]'
                        },
                        { 
                          id: 'aluno', 
                          label: 'Aluno', 
                          icon: GraduationCap, 
                          route: currentEixo === 'pesquisa' ? '/app/pesquisa/aluno/dashboard' : '/app/ensino/aluno/dashboard',
                          description: 'Dashboard do Aluno',
                          color: 'from-[#FFD33D] to-[#F4B740]'
                        },
                      ]
                    : isProfessional
                    ? [
                        { 
                          id: 'profissional', 
                          label: 'Profissional', 
                          icon: Stethoscope, 
                          route: `/app/${currentEixo}/profissional/dashboard`,
                          description: 'Dashboard Profissional',
                          color: 'from-[#00C16A] to-[#00945B]'
                        },
                      ]
                    : isAluno
                    ? [
                        { 
                          id: 'aluno', 
                          label: 'Aluno', 
                          icon: GraduationCap, 
                          route: currentEixo === 'pesquisa' ? '/app/pesquisa/aluno/dashboard' : '/app/ensino/aluno/dashboard',
                          description: 'Dashboard do Aluno',
                          color: 'from-[#FFD33D] to-[#F4B740]'
                        },
                      ]
                    : []
                  
                  // Para admin, adicionar consultórios específicos
                  const consultorios = isAdmin ? [
                    {
                      id: 'profissional-ricardo',
                      label: 'Dr. Ricardo',
                      icon: Stethoscope,
                      route: '/app/ricardo-valenca-dashboard',
                      description: 'Consultório Dr. Ricardo Valença',
                      color: 'from-[#00C16A] to-[#1a365d]'
                    },
                    {
                      id: 'profissional-eduardo',
                      label: 'Dr. Eduardo',
                      icon: Stethoscope,
                      route: '/app/clinica/profissional/dashboard-eduardo',
                      description: 'Consultório Dr. Eduardo Faveret',
                      color: 'from-[#1a365d] to-[#2d5a3d]',
                      alternativeRoutes: ['/app/eduardo-faveret-dashboard']
                    }
                  ] : []
                  
                  const allTypes = [...availableTypes, ...consultorios]
                  
                  return (
                    <div className="flex items-center space-x-1">
                      {allTypes.map((type) => {
                        const Icon = type.icon
                        const isConsultorioType = type.id.includes('profissional-ricardo') || type.id.includes('profissional-eduardo')
                        
                        // Verificar se está ativo
                        // Para consultórios específicos, verificar se está na rota correta
                        const isRicardoRoute = location.pathname.includes('ricardo-valenca-dashboard') && !location.pathname.includes('dashboard-eduardo') && !location.pathname.includes('eduardo-faveret-dashboard')
                        const isEduardoRoute = location.pathname.includes('dashboard-eduardo') || location.pathname.includes('eduardo-faveret-dashboard')
                        
                        const isViewingAsThisType = isAdmin && (
                          (type.id === 'profissional-ricardo' && isRicardoRoute && !viewAsType) ||
                          (type.id === 'profissional-eduardo' && isEduardoRoute && !viewAsType) ||
                          (viewAsType === type.id && !isConsultorioType)
                        )
                        const isAdminOnDefaultRoute = isAdmin && type.id === 'admin' && isRicardoRoute && !viewAsType
                        const isCurrentType = !isConsultorioType && normalizeUserType(user.type) === type.id
                        const isViewingAsGenericType = isAdmin && !isConsultorioType && viewAsType === type.id
                        
                        const isActive = isViewingAsThisType || isCurrentType || isAdminOnDefaultRoute || isViewingAsGenericType
                        
                        return (
                          <button
                            key={type.id}
                            onClick={(e) => {
                              e.stopPropagation()
                              console.log('🔍 Tipo selecionado:', type.id)
                              
                              // Detectar eixo atual da URL
                              const currentPath = location.pathname
                              let targetEixo: 'clinica' | 'ensino' | 'pesquisa' = 'clinica'
                              if (currentPath.includes('/ensino/')) targetEixo = 'ensino'
                              else if (currentPath.includes('/pesquisa/')) targetEixo = 'pesquisa'
                              else if (currentPath.includes('/clinica/')) targetEixo = 'clinica'
                              else {
                                if (type.id === 'paciente') targetEixo = 'clinica'
                                else if (type.id === 'aluno') targetEixo = 'ensino'
                                else targetEixo = 'clinica'
                              }
                              
                              // Se for admin e não for consultório, definir o tipo visual
                              if (isAdmin && !isConsultorioType) {
                                const viewType = type.id as UserType
                                setViewAsType(viewType)
                                console.log('✅ Admin visualizando como:', viewType, 'no eixo:', targetEixo)
                                
                                // Navegar para a rota correta baseada no tipo e eixo
                                let targetRoute = ''
                                if (viewType === 'paciente') {
                                  targetRoute = '/app/clinica/paciente/dashboard'
                                } else if (viewType === 'profissional') {
                                  targetRoute = `/app/${targetEixo}/profissional/dashboard`
                                } else if (viewType === 'aluno') {
                                  const alunoEixo = targetEixo === 'pesquisa' ? 'pesquisa' : 'ensino'
                                  targetRoute = `/app/${alunoEixo}/aluno/dashboard`
                                } else if (viewType === 'admin') {
                                  setViewAsType(null)
                                  targetRoute = '/app/ricardo-valenca-dashboard'
                                } else {
                                  targetRoute = type.route
                                }
                                
                                console.log('🎯 Navegando para:', targetRoute)
                                navigate(targetRoute)
                              } else if (isAdmin && isConsultorioType) {
                                setViewAsType(null)
                                console.log('✅ Admin navegando para consultório:', type.id)
                                navigate(type.route)
                              } else {
                                navigate(type.route)
                              }
                              
                              localStorage.setItem('selectedUserType', type.id)
                            }}
                            className={`flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg transition-all duration-200 ${
                              isActive
                                ? `bg-gradient-to-r ${type.color} text-white shadow-lg scale-105`
                                : 'bg-[#102642] hover:bg-[#1b3552] text-[#C8D6E5] hover:text-white'
                            }`}
                            title={type.description}
                          >
                            <Icon className="w-4 h-4 flex-shrink-0" />
                            <span className="hidden sm:block text-sm font-medium whitespace-nowrap">
                              {type.label}
                            </span>
                            {isActive && isAdmin && viewAsType && !isConsultorioType && (
                              <span className="text-xs ml-1">👁️</span>
                            )}
                          </button>
                        )
                      })}
                    </div>
                  )
                })()}
                
                {/* Notification Center */}
                <NotificationCenter className="mr-2" />
                
                <div className="relative ml-2">
                  <button
                    onClick={() => setIsProfileOpen(!isProfileOpen)}
                    className="flex items-center space-x-2 text-[#C8D6E5] hover:text-[#00C16A] transition-colors duration-200"
                  >
                    <div
                      className="w-7 h-7 md:w-8 md:h-8 rounded-full flex items-center justify-center"
                      style={{
                        background: 'linear-gradient(135deg, #00C16A 0%, #1a365d 100%)',
                        boxShadow: '0 4px 12px rgba(0,193,106,0.25)'
                      }}
                    >
                      <User className="w-4 h-4 text-white" />
                    </div>
                    <span className="hidden sm:block text-sm font-medium">{user.name}</span>
                  </button>

                {isProfileOpen && (
                  <div
                    className="absolute right-0 mt-2 w-40 md:w-48 rounded-md shadow-lg py-1 z-50"
                    style={{
                      background: neutralSurface,
                      border: '1px solid rgba(0,193,106,0.18)'
                    }}
                  >
                    <div className="px-3 md:px-4 py-2 border-b border-[#17324d]">
                      <p className="text-xs md:text-sm font-medium text-white">{user.name}</p>
                      <p className="text-xs text-[#8FA7BF] truncate">{user.email}</p>
                    </div>
                    <Link
                      to={normalizeUserType(user?.type || 'paciente') === 'admin' ? '/app/admin-settings' : '/app/profile'}
                      onClick={() => setIsProfileOpen(false)}
                      className="flex items-center px-3 md:px-4 py-2 text-xs md:text-sm text-[#C8D6E5] hover:bg-[#1b314e]"
                    >
                      <Settings className="w-3 h-3 md:w-4 md:h-4 mr-2" />
                      Configurações
                    </Link>
                    <button
                      onClick={async () => {
                        console.log('🚪 Botão Sair clicado')
                        setIsProfileOpen(false)
                        try {
                          await logout()
                          console.log('✅ Logout concluído, redirecionando...')
                          // Limpar storage
                          localStorage.clear()
                          sessionStorage.clear()
                          // Redirecionar
                          window.location.href = '/'
                        } catch (error) {
                          console.error('❌ Erro no logout:', error)
                          // Forçar redirecionamento mesmo com erro
                          window.location.href = '/'
                        }
                      }}
                      className="flex items-center w-full px-3 md:px-4 py-2 text-xs md:text-sm text-[#C8D6E5] hover:bg-[#1b314e]"
                    >
                      <LogOut className="w-3 h-3 md:w-4 md:h-4 mr-2" />
                      Sair
                    </button>
                  </div>
                )}
                </div>
              </>
            ) : (
              <Link
                to="/login"
                className="bg-primary-600 hover:bg-primary-700 text-white px-3 md:px-4 py-2 rounded-lg font-medium transition-colors duration-200 text-xs md:text-sm"
              >
                Entrar
              </Link>
            )}

            {/* Mobile menu button - apenas se houver itens de navegação */}
            {navigation.length > 0 && (
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="md:hidden p-2 rounded-md text-[#C8D6E5] hover:text-[#00C16A] hover:bg-[#1b314e]"
              >
                {isMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            )}
          </div>
          
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden">
            <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 border-t border-[#17324d]" style={{ background: neutralSurface }}>
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`block px-3 py-3 rounded-md text-sm font-medium transition-colors duration-200 ${
                    isActive(item.href)
                      ? 'text-[#FFD33D] bg-[#213553]'
                      : 'text-[#C8D6E5] hover:text-[#FFD33D] hover:bg-[#1b314e]'
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
