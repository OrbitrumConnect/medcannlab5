import React, { useState, useRef, useCallback } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useUserView } from '../contexts/UserViewContext'
import { useDashboardTriggersOptional } from '../contexts/DashboardTriggersContext'
import { Menu, X, User, LogOut, Settings, Stethoscope, GraduationCap, Shield, ChevronDown, Brain, HelpCircle } from 'lucide-react'
import NotificationCenter from './NotificationCenter'
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
  const triggersContext = useDashboardTriggersOptional()
  const hasTriggers = triggersContext?.options != null && triggersContext.options.length > 0

  const isActive = (path: string) => location.pathname === path

  const handleTriggerActionRef = useRef<(id: string) => void>(() => {})
  handleTriggerActionRef.current = (id: string) => {
    if (!triggersContext) return
    if (id === 'novo-paciente') triggersContext.onNovoPaciente?.()
    else if (id === 'prescricao-rapida') triggersContext.onPrescricaoRapida?.()
    else triggersContext.onChange(id)
  }

  const triggerOptions = triggersContext?.options ?? []
  const leftTriggers = triggerOptions.slice(0, Math.ceil(triggerOptions.length / 2))
  const rightTriggers = triggerOptions.slice(Math.ceil(triggerOptions.length / 2))

  const leftScrollRef = useRef<HTMLDivElement>(null)
  const rightScrollRef = useRef<HTMLDivElement>(null)
  const dragRef = useRef<{ el: HTMLDivElement; startX: number; startScrollLeft: number } | null>(null)
  const dragMovedRef = useRef(false)
  const blockNextClickRef = useRef(false)

  const handleScrollPointerDown = useCallback((e: React.MouseEvent | React.TouchEvent, el: HTMLDivElement) => {
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX
    dragRef.current = { el, startX: clientX, startScrollLeft: el.scrollLeft }
    dragMovedRef.current = false
  }, [])

  const handleScrollPointerMove = useCallback((e: MouseEvent | TouchEvent) => {
    const d = dragRef.current
    if (!d) return
    if ('touches' in e) e.preventDefault()
    const clientX = 'touches' in e ? e.touches[0].clientX : (e as MouseEvent).clientX
    const deltaX = d.startX - clientX
    if (Math.abs(deltaX) > 12) dragMovedRef.current = true
    d.el.scrollLeft = d.startScrollLeft + deltaX
  }, [])

  const handleScrollPointerUp = useCallback(() => {
    const didDrag = dragMovedRef.current
    blockNextClickRef.current = didDrag
    dragRef.current = null
    dragMovedRef.current = false
  }, [])

  React.useEffect(() => {
    const onMove = (e: MouseEvent | TouchEvent) => handleScrollPointerMove(e)
    const onUp = () => {
      handleScrollPointerUp()
      document.removeEventListener('mousemove', onMove)
      document.removeEventListener('mouseup', onUp)
      document.removeEventListener('touchmove', onMove)
      document.removeEventListener('touchend', onUp)
    }
    const onDown = (e: MouseEvent) => {
      const t = (e.target as HTMLElement).closest?.('[data-trigger-scroll]') as HTMLDivElement | null
      if (t) {
        handleScrollPointerDown(e as unknown as React.MouseEvent, t)
        document.addEventListener('mousemove', onMove)
        document.addEventListener('mouseup', onUp)
      }
    }
    const onTouchStart = (e: TouchEvent) => {
      const t = (e.target as HTMLElement).closest?.('[data-trigger-scroll]') as HTMLDivElement | null
      if (t) {
        handleScrollPointerDown(e as unknown as React.TouchEvent, t)
        document.addEventListener('touchmove', onMove, { passive: false })
        document.addEventListener('touchend', onUp)
      }
    }
    document.addEventListener('mousedown', onDown)
    document.addEventListener('touchstart', onTouchStart, { passive: true })
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('touchstart', onTouchStart)
      document.removeEventListener('mousemove', onMove)
      document.removeEventListener('mouseup', onUp)
      document.removeEventListener('touchmove', onMove)
      document.removeEventListener('touchend', onUp)
    }
  }, [handleScrollPointerDown, handleScrollPointerMove, handleScrollPointerUp])

  const onTriggerClick = useCallback((id: string, e: React.MouseEvent) => {
    if (blockNextClickRef.current) {
      blockNextClickRef.current = false
      e.preventDefault()
      e.stopPropagation()
      return
    }
    handleTriggerActionRef.current(id)
  }, [])

  return (
    <header
      className="shadow-lg border-b header-mobile w-full relative z-[60] min-h-[3.93rem] sm:min-h-[4.487rem] md:min-h-[5.049rem]"
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
        <div className="flex justify-between items-center w-full h-full min-h-[3.93rem] sm:min-h-[4.487rem] md:min-h-[5.049rem] relative">

          {/* ESQUERDA: Menu (mobile) + Bandeira */}
          <div className="flex items-center gap-1 z-20 min-w-0 shrink-0">
            <button
              onClick={() => onOpenSidebar?.()}
              className="md:hidden p-2 -ml-1 rounded-md text-[#C8D6E5] hover:text-[#00C16A] active:text-[#00C16A] hover:bg-[#1b314e] active:bg-[#1b314e] touch-manipulation min-w-[40px] min-h-[40px] flex items-center justify-center"
              aria-label="Abrir menu"
            >
              <Menu className="w-5 h-5 sm:w-6 sm:h-6" />
            </button>
            <button
              onClick={toggleLanguage}
              className="md:hidden p-1.5 rounded-lg hover:bg-[#1b314e] transition-colors"
              title={i18n.language === 'en' ? 'Mudar para Português' : 'Switch to English'}
            >
              <span className="text-lg leading-none">{i18n.language === 'en' ? '🇺🇸' : '🇧🇷'}</span>
            </button>
          </div>

          {/* CENTRO: Desktop com triggers/nav; Mobile: vazio (triggers vão na segunda linha) */}
          <div className="hidden md:flex flex-1 items-center justify-center min-w-0 mx-2">
            {/* Desktop: triggers + cérebro na mesma linha */}
            {hasTriggers && (
              <div className="hidden md:flex items-center gap-0 w-full max-w-4xl">
                {/* Triggers à esquerda: rolam sem entrar na zona do cérebro */}
                <div className="flex-1 flex justify-end overflow-hidden min-w-0">
                  <div
                    ref={leftScrollRef}
                    data-trigger-scroll
                    className="flex items-center gap-2 overflow-x-auto no-scrollbar px-1 py-1 mask-linear-fade-left cursor-grab active:cursor-grabbing select-none"
                    style={{ scrollbarWidth: 'none', WebkitOverflowScrolling: 'touch' }}
                  >
                    {leftTriggers.map((opt) => {
                      const Icon = opt.icon
                      const isActive = triggersContext?.activeId === opt.id
                      return (
                        <button
                          key={opt.id}
                          type="button"
                          onClick={(e) => onTriggerClick(opt.id, e)}
                          className={`flex-shrink-0 flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-medium whitespace-nowrap transition-all duration-200 hover:scale-[1.02] active:scale-95 relative z-10 ${isActive ? 'bg-emerald-600/20 border-emerald-500/40 text-emerald-100' : 'bg-slate-800/60 border-slate-700/50 text-slate-300 hover:bg-slate-700 hover:text-white hover:border-emerald-500/30'}`}
                          title={opt.description || opt.label}
                        >
                          <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-emerald-400' : 'text-slate-400'}`} />
                          {opt.label}
                        </button>
                      )
                    })}
                  </div>
                </div>
                {/* Zona central: cérebro + borda neon ciano + partículas subindo (hover ascende e mais partículas) */}
                <div className="group flex-shrink-0 flex items-center justify-center w-16 min-w-[4rem] py-1 relative">
                  {/* Partículas leves subindo ao redor do cérebro */}
                  {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map((i) => {
                    const angle = (i / 12) * Math.PI * 2
                    const r = 20
                    const x = 50 + (r * Math.cos(angle))
                    const y = 50 + (r * Math.sin(angle))
                    return (
                      <div
                        key={i}
                        className="brain-particle"
                        style={{
                          width: 3 + (i % 2),
                          height: 3 + (i % 2),
                          left: `${x}%`,
                          top: `${y}%`,
                          marginLeft: -2,
                          marginTop: -2,
                          animationDelay: `${i * 0.18}s`,
                        }}
                      />
                    )
                  })}
                  <button
                    type="button"
                    onClick={() => triggersContext?.onBrainClick?.()}
                    className="brain-neon-ring relative w-11 h-11 rounded-full flex items-center justify-center shadow-lg shadow-emerald-900/40 border border-[#00C16A]/30 hover:scale-110 transition-all flex-shrink-0 overflow-hidden"
                    style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f3a3a 100%)' }}
                    aria-label="Abrir chat Nôa"
                  >
                    <img
                      src="/AvatarsEstatico.png"
                      alt="Nôa"
                      className="w-full h-full object-cover object-top opacity-90 hover:opacity-100 transition-opacity"
                    />
                  </button>
                </div>
                {/* Triggers à direita: rolam sem entrar na zona do cérebro */}
                <div className="flex-1 flex justify-start overflow-hidden min-w-0">
                  <div
                    ref={rightScrollRef}
                    data-trigger-scroll
                    className="flex items-center gap-2 overflow-x-auto no-scrollbar px-1 py-1 mask-linear-fade-right cursor-grab active:cursor-grabbing select-none"
                    style={{ scrollbarWidth: 'none', WebkitOverflowScrolling: 'touch' }}
                  >
                    {rightTriggers.map((opt) => {
                      const Icon = opt.icon
                      const isActive = triggersContext?.activeId === opt.id
                      return (
                        <button
                          key={opt.id}
                          type="button"
                          onClick={(e) => onTriggerClick(opt.id, e)}
                          className={`flex-shrink-0 flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-medium whitespace-nowrap transition-all duration-200 hover:scale-[1.02] active:scale-95 relative z-10 ${isActive ? 'bg-emerald-600/20 border-emerald-500/40 text-emerald-100' : 'bg-slate-800/60 border-slate-700/50 text-slate-300 hover:bg-slate-700 hover:text-white hover:border-emerald-500/30'}`}
                          title={opt.description || opt.label}
                        >
                          <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-emerald-400' : 'text-slate-400'}`} />
                          {opt.label}
                        </button>
                      )
                    })}
                  </div>
                </div>
              </div>
            )}
            {/* Mobile: triggers ficam numa segunda linha abaixo, não no centro do header */}
            {/* Desktop sem triggers: nav do aluno ou vazio */}
            {!hasTriggers && navigation.length > 0 && (
              <div className="hidden md:flex items-center space-x-4 lg:space-x-6">
                <nav className="flex space-x-2 lg:space-x-4">
                  {navigation.map((item) => (
                    <Link
                      key={item.name}
                      to={item.href}
                      className={`px-2 py-1.5 lg:px-3 lg:py-2 rounded-md text-xs lg:text-sm font-medium transition-colors duration-200 active:scale-95 ${isActive(item.href) ? 'text-[#FFD33D] bg-[#213553]' : 'text-[#C8D6E5] hover:text-[#FFD33D] hover:bg-[#1b314e] active:bg-[#1b314e]'}`}
                    >
                      {item.name}
                    </Link>
                  ))}
                </nav>
              </div>
            )}
            {/* Cérebro sempre visível no desktop quando não há triggers (ex.: Biblioteca, Perfil) */}
            {!hasTriggers && triggerOptions.length === 0 && (
              <div className="hidden md:flex flex-1 items-center justify-center min-w-0">
                <div className="group flex-shrink-0 flex items-center justify-center w-16 min-w-[4rem] py-1 relative">
                  {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map((i) => {
                    const angle = (i / 12) * Math.PI * 2
                    const r = 20
                    const x = 50 + (r * Math.cos(angle))
                    const y = 50 + (r * Math.sin(angle))
                    return (
                      <div
                        key={i}
                        className="brain-particle"
                        style={{
                          width: 3 + (i % 2),
                          height: 3 + (i % 2),
                          left: `${x}%`,
                          top: `${y}%`,
                          marginLeft: -2,
                          marginTop: -2,
                          animationDelay: `${i * 0.18}s`,
                        }}
                      />
                    )
                  })}
                  <button
                    type="button"
                    onClick={() => triggersContext?.onBrainClick?.()}
                    className="brain-neon-ring relative w-11 h-11 rounded-full flex items-center justify-center shadow-lg shadow-emerald-900/40 border border-[#00C16A]/30 hover:scale-110 transition-all flex-shrink-0 overflow-hidden"
                    style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f3a3a 100%)' }}
                    aria-label="Abrir chat Nôa"
                  >
                    <img
                      src="/AvatarsEstatico.png"
                      alt="Nôa"
                      className="w-full h-full object-cover object-top opacity-90 hover:opacity-100 transition-opacity"
                    />
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Language (mobile: já está à esquerda; desktop fica à direita) — mantido no bloco User Menu abaixo */}

          {/* Nôa mini-avatar (mobile only - posicionada mais ao centro) */}
          {user && (
            <button
              type="button"
              onClick={() => triggersContext?.onBrainClick?.()}
              className="md:hidden absolute left-[32%] -translate-x-1/2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full flex items-center justify-center shadow-md border border-[#00C16A]/40 active:scale-95 transition-all touch-manipulation overflow-hidden z-20"
              style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f3a3a 100%)' }}
              aria-label="Abrir chat Nôa"
            >
              <img
                src="/AvatarsEstatico.png"
                alt="Nôa"
                className="w-full h-full object-cover object-top opacity-90"
              />
            </button>
          )}

          {/* User Menu - Direita */}
          <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-2.5 shrink-0 z-20 md:relative md:right-auto md:top-auto md:translate-y-0 md:gap-3 lg:gap-4">

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

            {/* Botão de Ajuda — reabre o tutorial guiado */}
            {user && (
              <button
                onClick={() => window.dispatchEvent(new CustomEvent('replayOnboardingTutorial'))}
                className="hidden md:flex items-center justify-center p-2 rounded-lg hover:bg-[#1b314e] transition-colors text-slate-300 hover:text-emerald-400"
                title="Tutorial guiado — clique para rever como usar a plataforma"
                aria-label="Ajuda — abrir tutorial"
              >
                <HelpCircle className="w-5 h-5" />
              </button>
            )}

            {/* Sino de notificações (ao lado do idioma) */}
            {user && <NotificationCenter className="flex items-center" />}

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
                        route: '/app/admin',
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
                          label: `Clínica Dr.(a) ${user?.name?.split(' ').slice(0, 2).join(' ') || 'Profissional'}`,
                          icon: Stethoscope,
                          route: `/app/${currentEixo}/profissional/dashboard`,
                          description: 'Meu Consultório',
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

                  // Admin não precisa mais de consultórios separados — dashboard unificado
                  const allTypes = [...availableTypes]

                  // Encontrar o tipo ativo para mostrar no mobile
                  const activeTypeObj = allTypes.find(type => {
                    const isViewingAsThisType = isAdmin && viewAsType === type.id
                    const isAdminOnDefaultRoute = isAdmin && type.id === 'admin' && location.pathname.startsWith('/app/admin') && !viewAsType
                    const isCurrentType = !isAdmin && normalizeUserType(user.type) === type.id
                    const isViewingAsGenericType = isAdmin && viewAsType === type.id

                    return isViewingAsThisType || isCurrentType || isAdminOnDefaultRoute || isViewingAsGenericType
                  }) || allTypes[0]

                  const isChatPage = location.pathname === '/app/chat' || location.pathname.startsWith('/app/chat?')
                  const useCompactSwitcher = isChatPage || allTypes.length > 4

                  return (
                    <div className="flex justify-center md:ml-6">
                      {/* DESKTOP: modo compacto (chat ou muitos tipos) — um botão + dropdown */}
                      {useCompactSwitcher && (
                        <div className="hidden md:block relative">
                          <button
                            onClick={() => setIsViewSwitcherOpen(!isViewSwitcherOpen)}
                            className="flex items-center space-x-2 px-3 py-2 rounded-lg border border-[#213553] transition-colors hover:bg-[#1b314e]"
                            style={{ background: 'rgba(16,38,66,0.9)', color: '#C8D6E5' }}
                          >
                            {(() => {
                              const Icon = activeTypeObj?.icon || User
                              return <Icon className="w-4 h-4 text-[#00C16A] shrink-0" />
                            })()}
                            <span className="text-xs font-medium max-w-[120px] truncate">{activeTypeObj?.label || 'Perfil'}</span>
                            <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${isViewSwitcherOpen ? 'rotate-180' : ''}`} />
                          </button>
                          {isViewSwitcherOpen && (
                            <div
                              className="absolute right-0 top-full mt-1 w-52 bg-[#0f243c] border border-[#213553] rounded-lg shadow-xl py-1 z-[70] animate-in fade-in zoom-in-95 duration-100"
                              role="listbox"
                            >
                              {allTypes.map((type) => {
                                const Icon = type.icon
                                const isActiveType = type.id === activeTypeObj?.id
                                return (
                                  <button
                                    key={type.id}
                                    role="option"
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      setIsViewSwitcherOpen(false)
                                      const currentPath = location.pathname
                                      let targetEixo: 'clinica' | 'ensino' | 'pesquisa' = 'clinica'
                                      if (currentPath.includes('/ensino/')) targetEixo = 'ensino'
                                      else if (currentPath.includes('/pesquisa/')) targetEixo = 'pesquisa'
                                      else if (currentPath.includes('/clinica/')) targetEixo = 'clinica'
                                      else {
                                        if (type.id === 'paciente') targetEixo = 'clinica'
                                        else if (type.id === 'aluno') targetEixo = 'ensino'
                                      }
                                      if (isAdmin && !type.id.includes('profissional-ricardo') && !type.id.includes('profissional-eduardo')) {
                                        const viewType = type.id as UserType
                                        setViewAsType(viewType === 'admin' ? null : viewType)
                                        let targetRoute = type.route
                                        if (viewType === 'admin') targetRoute = '/app/admin'
                                        else if (viewType === 'paciente') targetRoute = '/app/clinica/paciente/dashboard'
                                        else if (viewType === 'profissional') targetRoute = `/app/${targetEixo}/profissional/dashboard`
                                        else if (viewType === 'aluno') targetRoute = targetEixo === 'pesquisa' ? '/app/pesquisa/aluno/dashboard' : '/app/ensino/aluno/dashboard'
                                        navigate(targetRoute)
                                      } else if (isAdmin && (type.id.includes('profissional-ricardo') || type.id.includes('profissional-eduardo'))) {
                                        setViewAsType(null)
                                        navigate(type.route)
                                      } else {
                                        navigate(type.route)
                                      }
                                      localStorage.setItem('selectedUserType', type.id)
                                    }}
                                    className={`flex items-center gap-2 w-full px-3 py-2 text-left text-sm rounded-none first:rounded-t-lg last:rounded-b-lg ${isActiveType ? 'bg-[#00C16A]/20 text-[#00C16A]' : 'text-[#C8D6E5] hover:bg-[#1b314e]'}`}
                                  >
                                    <Icon className="w-4 h-4 shrink-0" />
                                    <span className="truncate">{type.label}</span>
                                  </button>
                                )
                              })}
                            </div>
                          )}
                        </div>
                      )}
                      {/* DESKTOP VIEW: Lista Horizontal (quando poucos tipos e não é chat) */}
                      {!useCompactSwitcher && (
                        <div className="hidden md:flex items-center space-x-2 md:space-x-3">
                          {allTypes.map((type) => {
                            const Icon = type.icon

                            const isViewingAsThisType = isAdmin && viewAsType === type.id
                            const isAdminOnDefaultRoute = isAdmin && type.id === 'admin' && location.pathname.startsWith('/app/admin') && !viewAsType
                            const isCurrentType = !isAdmin && normalizeUserType(user.type) === type.id
                            const isViewingAsGenericType = isAdmin && viewAsType === type.id

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

                                  if (isAdmin) {
                                    const viewType = type.id as UserType
                                    if (viewType === 'admin') {
                                      setViewAsType(null)
                                      navigate('/app/admin')
                                    } else {
                                      setViewAsType(viewType)
                                      let targetRoute = ''
                                      if (viewType === 'paciente') targetRoute = '/app/clinica/paciente/dashboard'
                                      else if (viewType === 'profissional') targetRoute = `/app/${targetEixo}/profissional/dashboard`
                                      else if (viewType === 'aluno') {
                                        const alunoEixo = targetEixo === 'pesquisa' ? 'pesquisa' : 'ensino'
                                        targetRoute = `/app/${alunoEixo}/aluno/dashboard`
                                      } else targetRoute = type.route
                                      navigate(targetRoute)
                                    }
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
                                {isActive && isAdmin && viewAsType && (
                                  <span className="text-[10px] ml-0.5">👁️</span>
                                )}
                              </button>
                            )
                          })}
                        </div>
                      )}

                      {/* MOBILE VIEW: Dropdown Switcher - no fluxo do header direito */}
                      <div className="md:hidden relative z-30">
                        <button
                          onClick={() => setIsViewSwitcherOpen(!isViewSwitcherOpen)}
                          className="flex items-center gap-1 px-2 py-1 rounded-lg bg-[#102642] text-white border border-[#213553] active:bg-[#1b314e]"
                        >
                          {activeTypeObj.icon && <activeTypeObj.icon className="w-3.5 h-3.5 text-[#00C16A]" />}
                          <span className="text-[10px] font-medium max-w-[60px] truncate">{activeTypeObj.label}</span>
                          <ChevronDown className={`w-3 h-3 text-slate-400 transition-transform ${isViewSwitcherOpen ? 'rotate-180' : ''}`} />
                        </button>

                        {isViewSwitcherOpen && (
                          <div className="absolute top-full right-0 mt-2 w-48 bg-[#0f243c] border border-[#213553] rounded-lg shadow-xl py-1 z-50 animate-in fade-in zoom-in-95 duration-100">
                            {allTypes.map((type) => {
                              const Icon = type.icon
                              const isSelected = type.id === activeTypeObj.id

                              return (
                                <button
                                  key={type.id}
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    setIsViewSwitcherOpen(false)
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

                                    if (isAdmin) {
                                      const viewType = type.id as UserType
                                      if (viewType === 'admin') {
                                        setViewAsType(null)
                                        navigate('/app/admin')
                                      } else {
                                        setViewAsType(viewType)
                                        let targetRoute = ''
                                        if (viewType === 'paciente') targetRoute = '/app/clinica/paciente/dashboard'
                                        else if (viewType === 'profissional') targetRoute = `/app/${targetEixo}/profissional/dashboard`
                                        else if (viewType === 'aluno') {
                                          const alunoEixo = targetEixo === 'pesquisa' ? 'pesquisa' : 'ensino'
                                          targetRoute = `/app/${alunoEixo}/aluno/dashboard`
                                        } else targetRoute = type.route
                                        navigate(targetRoute)
                                      }
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
                <div className="relative ml-0.5 sm:ml-2 md:ml-4">
                  <button
                    onClick={() => setIsProfileOpen(!isProfileOpen)}
                    className="flex items-center space-x-1 sm:space-x-2 text-[#C8D6E5] hover:text-[#00C16A] transition-colors duration-200 p-0.5 sm:p-1 rounded-full hover:bg-slate-800/50"
                  >
                    <div
                      className="w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center flex-shrink-0 border border-[#00C16A]/30"
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
                        onClick={() => {
                          setIsProfileOpen(false)
                          window.dispatchEvent(new Event('replayOnboardingTutorial'))
                        }}
                        className="flex items-center w-full px-2 sm:px-3 md:px-4 py-2 text-[10px] sm:text-xs md:text-sm text-[#C8D6E5] hover:bg-[#1b314e] active:bg-[#1b314e] touch-manipulation"
                      >
                        <GraduationCap className="w-3 h-3 sm:w-3.5 sm:h-3.5 md:w-4 md:h-4 mr-1.5 sm:mr-2 flex-shrink-0" />
                        Tutorial Guiado
                      </button>
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

        {/* Mobile triggers removidos do header — acessíveis pelo terminal/workstation abaixo */}

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
