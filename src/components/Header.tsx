import React, { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useUserView } from '../contexts/UserViewContext'
import { Menu, X, User, LogOut, Settings, Stethoscope, GraduationCap, Shield, ChevronDown } from 'lucide-react'
import { normalizeUserType, getDefaultRouteByType, UserType } from '../lib/userTypes'
import { useTranslation } from 'react-i18next'

interface HeaderProps {
  onOpenSidebar?: () => void
}

const Header: React.FC<HeaderProps> = ({ onOpenSidebar }) => {
  const { user, logout } = useAuth()
  const { viewAsType, setViewAsType } = useUserView()
  const location = useLocation()
  const navigate = useNavigate()
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isProfileOpen, setIsProfileOpen] = useState(false)
  const [isViewSwitcherOpen, setIsViewSwitcherOpen] = useState(false)
  const { t, i18n } = useTranslation()

  const toggleLanguage = () => {
    const newLang = i18n.language === 'en' ? 'pt' : 'en'
    i18n.changeLanguage(newLang)
  }

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
      className="shadow-lg border-b header-mobile w-full relative z-[60]"
      style={{ background: headerGradient, borderColor: 'rgba(0,193,106,0.15)' }}
    >
      {/* Animação Matrix no background - apenas quando usuário está logado */}
      {user && (
        <>
          <div
            className="absolute inset-0 pointer-events-none overflow-hidden"
            style={{
              opacity: 0.25,
              zIndex: 0
            }}
          >
            {Array.from({ length: 20 }).map((_, i) => (
              <div
                key={`matrix-header-${i}`}
                style={{
                  position: 'absolute',
                  left: `${(i * 5) % 100}%`,
                  top: '-20px',
                  animation: `matrixFallHeader ${8 + (i % 6)}s linear infinite`,
                  animationDelay: `${i * 0.2}s`,
                  color: '#00F5A0',
                  fontFamily: 'monospace',
                  fontSize: '11px',
                  fontWeight: 'bold',
                  textShadow: '0 0 10px rgba(0, 245, 160, 0.8), 0 0 15px rgba(0, 245, 160, 0.6)',
                  whiteSpace: 'nowrap',
                  letterSpacing: '2px',
                  zIndex: 0
                }}
              >
                MedCannLab
              </div>
            ))}
          </div>
          <style>{`
            @keyframes matrixFallHeader {
              0% {
                transform: translateY(-60px);
                opacity: 0;
              }
              10% {
                opacity: 0.5;
              }
              50% {
                opacity: 0.5;
              }
              90% {
                opacity: 0.5;
              }
              100% {
                transform: translateY(80px);
                opacity: 0;
              }
            }
          `}</style>
        </>
      )}

      <div className="w-full max-w-full px-2 sm:px-3 md:px-4 lg:px-6 xl:px-8 relative" style={{ zIndex: 10 }}>
        <div className="flex justify-between items-center h-14 sm:h-16 md:h-18 relative">

          {/* ESQUERDA: Menu Sanduíche + Bandeira */}
          <div className="flex items-center gap-2 z-20">
            {/* Menu Mobile */}
            <button
              onClick={() => onOpenSidebar?.()}
              className="md:hidden p-2 -ml-2 rounded-md text-[#C8D6E5] hover:text-[#00C16A] active:text-[#00C16A] hover:bg-[#1b314e] active:bg-[#1b314e] touch-manipulation min-w-[44px] min-h-[44px] flex items-center justify-center"
              aria-label="Abrir menu"
            >
              <Menu className="w-5 h-5 sm:w-6 sm:h-6" />
            </button>

            {/* Language Toggle (Mobile: ao lado do menu) */}
            <button
              onClick={toggleLanguage}
              className="md:hidden p-2 rounded-lg hover:bg-[#1b314e] transition-colors -ml-1"
              title={i18n.language === 'en' ? 'Mudar para Português' : 'Switch to English'}
            >
              <span className="text-xl leading-none">
                {i18n.language === 'en' ? '🇺🇸' : '🇧🇷'}
              </span>
            </button>
          </div>

          {/* Logo removido - já existe na sidebar */}
          <div className="hidden"></div>

          {/* Desktop Navigation */}
          {navigation.length > 0 && (
            <div className="hidden md:flex items-center space-x-4 lg:space-x-6">
              <nav className="flex space-x-2 lg:space-x-4">
                {navigation.map((item) => (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={`px-2 py-1.5 lg:px-3 lg:py-2 rounded-md text-xs lg:text-sm font-medium transition-colors duration-200 active:scale-95 ${isActive(item.href)
                      ? 'text-[#FFD33D] bg-[#213553]'
                      : 'text-[#C8D6E5] hover:text-[#FFD33D] hover:bg-[#1b314e] active:bg-[#1b314e]'
                      }`}
                  >
                    {item.name}
                  </Link>
                ))}
              </nav>
            </div>
          )}

          {/* User Menu */}
          <div className="flex items-center space-x-1 sm:space-x-2 md:space-x-3 lg:space-x-4">

            {/* Language Toggle */}
            <button
              onClick={toggleLanguage}
              className="hidden md:block p-2 rounded-lg hover:bg-[#1b314e] transition-colors"
              title={i18n.language === 'en' ? 'Mudar para Português' : 'Switch to English'}
            >
              <span className="text-xl leading-none">
                {i18n.language === 'en' ? '🇺🇸' : '🇧🇷'}
              </span>
            </button>

            {user ? (
              <>
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

                  // Encontrar o tipo ativo para mostrar no mobile
                  const activeTypeObj = allTypes.find(type => {
                    const Icon = type.icon
                    const isConsultorioType = type.id.includes('profissional-ricardo') || type.id.includes('profissional-eduardo')
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

                    return isViewingAsThisType || isCurrentType || isAdminOnDefaultRoute || isViewingAsGenericType
                  }) || allTypes[0]

                  return (
                    <div className="flex justify-center md:ml-6">
                      {/* DESKTOP VIEW: Lista Horizontal */}
                      <div className="hidden md:flex items-center space-x-3 sm:space-x-4 md:space-x-5">
                        {allTypes.map((type) => {
                          const Icon = type.icon
                          const isConsultorioType = type.id.includes('profissional-ricardo') || type.id.includes('profissional-eduardo')

                          // Verificar se está ativo
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
                                  let targetRoute = ''
                                  if (viewType === 'paciente') targetRoute = '/app/clinica/paciente/dashboard'
                                  else if (viewType === 'profissional') targetRoute = `/app/${targetEixo}/profissional/dashboard`
                                  else if (viewType === 'aluno') {
                                    const alunoEixo = targetEixo === 'pesquisa' ? 'pesquisa' : 'ensino'
                                    targetRoute = `/app/${alunoEixo}/aluno/dashboard`
                                  } else if (viewType === 'admin') {
                                    setViewAsType(null)
                                    targetRoute = '/app/ricardo-valenca-dashboard'
                                  } else targetRoute = type.route
                                  navigate(targetRoute)
                                } else if (isAdmin && isConsultorioType) {
                                  setViewAsType(null)
                                  navigate(type.route)
                                } else {
                                  navigate(type.route)
                                }
                                localStorage.setItem('selectedUserType', type.id)
                              }}
                              className={`flex items-center space-x-1.5 px-4 py-2 rounded-lg transition-all duration-200 active:scale-95 ${isActive
                                ? 'text-white shadow-lg scale-105'
                                : 'bg-[#102642] text-[#C8D6E5]'
                                }`}
                              style={{
                                ...(isActive
                                  ? { background: 'linear-gradient(135deg, #00c16a 0%, #00a85a 100%)' }
                                  : {})
                              }}
                              title={type.description}
                            >
                              <Icon className="w-4 h-4 flex-shrink-0" />
                              <span className="text-xs font-medium whitespace-nowrap">
                                {type.label}
                              </span>
                              {isActive && isAdmin && viewAsType && !isConsultorioType && (
                                <span className="text-[10px] ml-0.5">👁️</span>
                              )}
                            </button>
                          )
                        })}
                      </div>

                      {/* MOBILE VIEW: Dropdown Switcher */}
                      <div className="md:hidden absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-30">
                        <button
                          onClick={() => setIsViewSwitcherOpen(!isViewSwitcherOpen)}
                          className="flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-[#102642] text-white border border-[#213553] active:bg-[#1b314e]"
                        >
                          {activeTypeObj.icon && <activeTypeObj.icon className="w-4 h-4 text-[#00C16A]" />}
                          <span className="text-xs font-medium max-w-[100px] truncate">{activeTypeObj.label}</span>
                          <ChevronDown className={`w-3 h-3 text-slate-400 transition-transform ${isViewSwitcherOpen ? 'rotate-180' : ''}`} />
                        </button>

                        {isViewSwitcherOpen && (
                          <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-48 bg-[#0f243c] border border-[#213553] rounded-lg shadow-xl py-1 z-50 animate-in fade-in zoom-in-95 duration-100">
                            {allTypes.map((type) => {
                              const Icon = type.icon
                              const isConsultorioType = type.id.includes('profissional-ricardo') || type.id.includes('profissional-eduardo')
                              const isSelected = type.id === activeTypeObj.id

                              return (
                                <button
                                  key={type.id}
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    setIsViewSwitcherOpen(false)
                                    // (Same logic as desktop - duplicate for now or allow generic handler if extracted)
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

                                    if (isAdmin && !isConsultorioType) {
                                      const viewType = type.id as UserType
                                      setViewAsType(viewType)
                                      let targetRoute = ''
                                      if (viewType === 'paciente') targetRoute = '/app/clinica/paciente/dashboard'
                                      else if (viewType === 'profissional') targetRoute = `/app/${targetEixo}/profissional/dashboard`
                                      else if (viewType === 'aluno') {
                                        const alunoEixo = targetEixo === 'pesquisa' ? 'pesquisa' : 'ensino'
                                        targetRoute = `/app/${alunoEixo}/aluno/dashboard`
                                      } else if (viewType === 'admin') {
                                        setViewAsType(null)
                                        targetRoute = '/app/ricardo-valenca-dashboard'
                                      } else targetRoute = type.route
                                      navigate(targetRoute)
                                    } else if (isAdmin && isConsultorioType) {
                                      setViewAsType(null)
                                      navigate(type.route)
                                    } else {
                                      navigate(type.route)
                                    }
                                    localStorage.setItem('selectedUserType', type.id)
                                  }}
                                  className={`w-full text-left px-4 py-2.5 flex items-center gap-3 hover:bg-[#1b314e] transition-colors ${isSelected ? 'bg-[#1b314e]/50 text-[#00C16A]' : 'text-slate-300'}`}
                                >
                                  <Icon className="w-4 h-4" />
                                  <span className="text-sm">{type.label}</span>
                                  {isSelected && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-[#00C16A]"></div>}
                                </button>
                              )
                            })}
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })()}



                {/* Profile Avatar & Menu */}
                <div className="relative ml-2 sm:ml-4">
                  <button
                    onClick={() => setIsProfileOpen(!isProfileOpen)}
                    className="flex items-center space-x-2 text-[#C8D6E5] hover:text-[#00C16A] transition-colors duration-200 p-1 rounded-full hover:bg-slate-800/50"
                  >
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 border border-[#00C16A]/30"
                      style={{
                        background: 'linear-gradient(135deg, #00C16A 0%, #1a365d 100%)',
                        boxShadow: '0 2px 8px rgba(0,193,106,0.2)'
                      }}
                    >
                      <User className="w-4 h-4 text-white" />
                    </div>
                    {/* Hide name on very small screens, show on larger */}
                    <span className="hidden sm:block text-xs md:text-sm font-medium truncate max-w-[100px]">{user.name}</span>
                  </button>

                  {isProfileOpen && (
                    <div
                      className="absolute right-0 mt-2 w-36 sm:w-40 md:w-48 rounded-md shadow-lg py-1 z-50"
                      style={{
                        background: neutralSurface,
                        border: '1px solid rgba(0,193,106,0.18)'
                      }}
                    >
                      <div className="px-2 sm:px-3 md:px-4 py-2 border-b border-[#17324d]">
                        <p className="text-[10px] sm:text-xs md:text-sm font-medium text-white truncate">{user.name}</p>
                        <p className="text-[9px] sm:text-xs text-[#8FA7BF] truncate">{user.email}</p>
                      </div>
                      <Link
                        to={normalizeUserType(user?.type || 'paciente') === 'admin' ? '/app/admin-settings' : '/app/profile'}
                        onClick={() => setIsProfileOpen(false)}
                        className="flex items-center px-2 sm:px-3 md:px-4 py-2 text-[10px] sm:text-xs md:text-sm text-[#C8D6E5] hover:bg-[#1b314e] active:bg-[#1b314e] touch-manipulation"
                      >
                        <Settings className="w-3 h-3 sm:w-3.5 sm:h-3.5 md:w-4 md:h-4 mr-1.5 sm:mr-2 flex-shrink-0" />
                        {t('header.settings')}
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
                        className="flex items-center w-full px-2 sm:px-3 md:px-4 py-2 text-[10px] sm:text-xs md:text-sm text-[#C8D6E5] hover:bg-[#1b314e] active:bg-[#1b314e] touch-manipulation"
                      >
                        <LogOut className="w-3 h-3 sm:w-3.5 sm:h-3.5 md:w-4 md:h-4 mr-1.5 sm:mr-2 flex-shrink-0" />
                        {t('header.logout')}
                      </button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <Link
                to="/login"
                className="bg-primary-600 hover:bg-primary-700 active:bg-primary-800 text-white px-2 sm:px-3 md:px-4 py-1.5 sm:py-2 rounded-lg font-medium transition-colors duration-200 text-[10px] sm:text-xs md:text-sm active:scale-95 touch-manipulation"
              >
                {t('header.login')}
              </Link>
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
                  className={`block px-3 py-3 rounded-md text-sm font-medium transition-colors duration-200 touch-manipulation min-h-[44px] flex items-center ${isActive(item.href)
                    ? 'text-[#FFD33D] bg-[#213553]'
                    : 'text-[#C8D6E5] active:text-[#FFD33D] active:bg-[#1b314e]'
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
    </header >
  )
}

export default Header
