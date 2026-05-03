import React, { useMemo, useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useToast } from '../contexts/ToastContext'
import { supabase } from '../lib/supabase'
import LoginDebugPanel from '../components/LoginDebugPanel'
import { PerfilSwitcher } from '../components/landing/PerfilSwitcher'
import { normalizeUserType, getDefaultRouteByType } from '../lib/userTypes'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Shield,
  ArrowRight,
  Star,
  Brain,
  Zap,
  Activity,
  Lock,
  Globe,
  Heart,
  CheckCircle2,
  Users,
  Menu,
  X,
  Stethoscope,
  Microscope,
  Database,
  MessageSquare,
  FileText,
  UserPlus,
  Download,
  Smartphone,
  Monitor
} from 'lucide-react'

// --- Components ---

const FeatureCard = ({ icon: Icon, title, description, delay }: { icon: any, title: string, description: string, delay: number }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    whileInView={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.5, delay }}
    viewport={{ once: true }}
    className="bg-slate-800/40 backdrop-blur-md border border-slate-700/50 hover:border-green-500/30 p-6 rounded-2xl hover:bg-slate-800/60 transition-all duration-300 group"
  >
    <div className="w-12 h-12 bg-gradient-to-br from-emerald-600/20 to-teal-600/20 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
      <Icon className="w-6 h-6 text-emerald-400 group-hover:text-emerald-300 transition-colors" />
    </div>
    <h3 className="text-xl font-bold text-white mb-2">{title}</h3>
    <p className="text-slate-400 leading-relaxed text-sm">{description}</p>
  </motion.div>
)

const StepCard = ({ number, title, description }: { number: string, title: string, description: string }) => (
  <div className="flex items-start space-x-4">
    <div className="flex-shrink-0 w-10 h-10 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-green-500">
      {number}
    </div>
    <div>
      <h3 className="text-lg font-semibold text-white mb-1">{title}</h3>
      <p className="text-slate-400 text-sm">{description}</p>
    </div>
  </div>
)

const AuthModal = ({ isOpen, onClose, title, children }: { isOpen: boolean, onClose: () => void, title: string, children: React.ReactNode }) => (
  <AnimatePresence>
    {isOpen && (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 20 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-slate-900 border border-slate-700 rounded-2xl p-8 max-w-md w-full shadow-2xl relative overflow-hidden"
        >
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500 via-teal-500 to-green-500" />
          <button onClick={onClose} className="absolute top-4 right-4 text-slate-500 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
          <h2 className="text-2xl font-bold text-white mb-6 text-center">{title}</h2>
          {children}
        </motion.div>
      </motion.div>
    )}
  </AnimatePresence>
)

const Landing: React.FC = () => {
  const navigate = useNavigate()
  const { register, login, isLoading: authLoading, user } = useAuth()
  const { success, error } = useToast()

  const noaAvatarSrc = `${import.meta.env.BASE_URL}noa-avatar.png`
  const noaPhotoSrc = `${import.meta.env.BASE_URL}AvatarsEstatico.png`
  const logoBrainSrc = `${import.meta.env.BASE_URL}brain.png`

  // Subtle neural pulse rings (professional, medical aesthetic)
  const pulseRings = useMemo(() => {
    return Array.from({ length: 3 }).map((_, i) => ({
      delay: i * 2.5,
      duration: 7 + i * 1.5,
      maxScale: 1.8 + i * 0.4,
    }))
  }, [])

  // Landing UX: manter scroll funcional, mas esconder a barra (especialmente visível sobre o Hero)
  useEffect(() => {
    if (typeof document === 'undefined') return
    // Evita scrollbar do browser (que aparece como "linha verde" no Windows/Chrome)
    // e move o scroll para o container desta página (com scrollbar invisível).
    const prevHtmlOverflow = document.documentElement.style.overflow
    const prevBodyOverflow = document.body.style.overflow
    document.documentElement.style.overflow = 'hidden'
    document.body.style.overflow = 'hidden'

    document.documentElement.classList.add('no-scrollbar')
    document.body.classList.add('no-scrollbar')
    document.documentElement.classList.add('landing-scroll-fix')
    document.body.classList.add('landing-scroll-fix')
    return () => {
      document.documentElement.style.overflow = prevHtmlOverflow
      document.body.style.overflow = prevBodyOverflow
      document.documentElement.classList.remove('no-scrollbar')
      document.body.classList.remove('no-scrollbar')
      document.documentElement.classList.remove('landing-scroll-fix')
      document.body.classList.remove('landing-scroll-fix')
    }
  }, [])

  // States
  const [isLoading, setIsLoading] = useState(false)
  const [showLogin, setShowLogin] = useState(false)
  const [showRegister, setShowRegister] = useState(false)
  const [showAdminLogin, setShowAdminLogin] = useState(false)
  const [showForgotPassword, setShowForgotPassword] = useState(false)
  const [forgotPasswordEmail, setForgotPasswordEmail] = useState('')
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [showFullInstitutional, setShowFullInstitutional] = useState(false)

  // Form States
  const [loginData, setLoginData] = useState({ email: '', password: '' })
  const [adminLoginData, setAdminLoginData] = useState({ email: '', password: '' })
  const [registerData, setRegisterData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    userType: 'profissional' as any,
    councilType: '',
    councilNumber: '',
    councilState: ''
  })

  // Effects & Handlers
  useEffect(() => {
    if (user && !authLoading) {
      // Verificar se há redirecionamento de convite pendente
      const inviteRedirect = localStorage.getItem('invite_redirect')
      if (inviteRedirect) {
        localStorage.removeItem('invite_redirect')
        navigate(inviteRedirect)
        return
      }
      const userType = normalizeUserType(user.type)
      navigate(getDefaultRouteByType(userType))
    }
  }, [user, authLoading, navigate])

  const handleLogin = async () => {
    if (!loginData.email || !loginData.password) return error('Preencha todos os campos')
    setIsLoading(true)
    try {
      await login(loginData.email, loginData.password)
      success('Bem-vindo de volta!')
      setShowLogin(false)
    } catch (err) {
      error('Credenciais inválidas.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleAdminLogin = async () => {
    if (!adminLoginData.email || !adminLoginData.password) return error('Preencha os campos')
    setIsLoading(true)
    try {
      await login(adminLoginData.email, adminLoginData.password)
      success('Acesso administrativo concedido.')
      setShowAdminLogin(false)
    } catch (err) {
      error('Acesso negado.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleRegister = async () => {
    if (!registerData.name || !registerData.email || !registerData.password) return error('Campos obrigatórios faltando')
    if (registerData.password !== registerData.confirmPassword) return error('Senhas não conferem')

    setIsLoading(true)
    try {
      // Logic from original file
      const userTypeToRegister = registerData.userType || localStorage.getItem('selectedUserType') || 'paciente'
      await register(
        registerData.email,
        registerData.password,
        userTypeToRegister,
        registerData.name,
        registerData.councilType,
        registerData.councilNumber,
        registerData.councilState
      )
      success('Conta criada com sucesso!')
      navigate(getDefaultRouteByType(normalizeUserType(userTypeToRegister)))
    } catch (err: any) {
      error(err?.message || 'Erro ao registrar.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleForgotPassword = async () => {
    if (!forgotPasswordEmail) return error('Digite seu email')
    setIsLoading(true)
    try {
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(forgotPasswordEmail, {
        redirectTo: `${window.location.origin}/reset-password`
      })
      if (resetError) throw resetError
      success('Email enviado! Verifique sua caixa de entrada.')
      setShowForgotPassword(false)
      setForgotPasswordEmail('')
    } catch (err: any) {
      error(err?.message || 'Erro ao enviar email de recuperação.')
    } finally {
      setIsLoading(false)
    }
  }

  // Emergency login removed for security

  // Partners removed — only add real verified partners

  if (authLoading) return <div className="min-h-screen bg-slate-950 flex items-center justify-center"><div className="w-8 h-8 border-4 border-green-500 border-t-transparent rounded-full animate-spin"></div></div>

  return (
    <div className="h-screen overflow-y-auto no-scrollbar text-white font-sans selection:bg-green-500/30 overflow-x-hidden" style={{ background: 'linear-gradient(135deg, #0A192F 0%, #1a365d 50%, #2d5a3d 100%)' }}>

      {/* --- Navegação High-End --- */}
      <nav className="fixed w-full top-0 z-40 bg-slate-950/80 backdrop-blur-lg border-b border-white/5">
        <div className="container mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div
              className="w-10 h-10 rounded-lg flex items-center justify-center overflow-hidden flex-shrink-0"
              style={{
                background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f3a3a 100%)',
                boxShadow: '0 6px 16px rgba(0, 0, 0, 0.4)',
                border: '1px solid rgba(0, 193, 106, 0.2)'
              }}
            >
              <img
                src="/brain.png"
                alt="MedCannLab Logo"
                className="w-full h-full object-contain p-1"
                style={{
                  filter: 'brightness(1.1) contrast(1.1) drop-shadow(0 0 6px rgba(0, 193, 106, 0.6))'
                }}
              />
            </div>
            <div>
              <span className="text-xl font-bold block text-white tracking-tight leading-none">MedCannLab</span>
              <div className="text-[10px] text-slate-400 font-semibold tracking-widest uppercase ml-0.5 mt-0.5">Plataforma 3.0</div>
            </div>
          </div>

          <div className="hidden md:flex items-center space-x-6">
            <a href="#solucao" className="text-sm text-slate-400 hover:text-white transition-colors">Solução</a>
            <a href="#sobre" className="text-sm text-slate-400 hover:text-white transition-colors">Sobre</a>
            <a href="#consultorio-escola" className="text-sm text-slate-400 hover:text-white transition-colors">Consultório-Escola</a>
            <a href="#eixos" className="text-sm text-slate-400 hover:text-white transition-colors">3 Pilares</a>
            <a href="#planos" className="text-sm text-slate-400 hover:text-white transition-colors">Planos</a>
          </div>

          <div className="hidden md:flex items-center space-x-4">
            <button onClick={() => setShowLogin(true)} className="text-sm font-medium text-slate-300 hover:text-white transition-colors">Entrar</button>
            <button onClick={() => setShowRegister(true)} className="text-sm font-medium px-5 py-2.5 bg-white text-slate-950 rounded-lg hover:bg-slate-200 transition-colors shadow-lg hover:shadow-white/10">
              Começar Agora
            </button>
          </div>

          <button className="md:hidden text-white" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
            {mobileMenuOpen ? <X /> : <Menu />}
          </button>
        </div>
      </nav>

      {/* --- Perfil Switcher (V1.9.120 SEO 3 perfis) --- */}
      <div className="pt-16">
        <PerfilSwitcher />
      </div>

      {/* --- Hero Section 2026 --- */}
      <section className="relative pt-12 pb-20 overflow-hidden">
        {/* Background Gradients */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[600px] bg-gradient-to-b from-blue-900/20 via-green-900/10 to-transparent blur-3xl -z-10" />

        <div className="container mx-auto px-6 flex flex-col lg:flex-row items-center gap-12">
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            className="flex-1 text-center lg:text-left"
          >
            <div className="inline-flex items-center space-x-2 bg-slate-800/50 border border-slate-700 rounded-full px-4 py-1.5 mb-6">
              <div
                className="w-8 h-8 rounded-full overflow-hidden border border-green-500/40 flex-shrink-0 bg-slate-950/60"
                style={{ boxShadow: '0 0 14px rgba(0, 193, 106, 0.28)' }}
                title="Nôa Esperanza"
              >
                <img
                  src={noaPhotoSrc}
                  alt="Nôa Esperanza"
                  className="w-full h-full object-cover object-top"
                  draggable={false}
                  loading="eager"
                  onError={(e) => {
                    e.currentTarget.src = noaAvatarSrc
                  }}
                />
              </div>
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
              </span>
              <span className="text-xs font-semibold tracking-wide text-green-400 uppercase">NOA Esperanza 3.0 Live</span>
            </div>

            <h1 className="text-4xl lg:text-6xl font-bold leading-tight mb-3 tracking-tight">
              Clínica, Ensino e Pesquisa pelo<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-300">Método AEC.</span>
            </h1>

            <p className="text-base text-slate-300 mb-3 max-w-xl mx-auto lg:mx-0 leading-relaxed">
              MedCannLab é um <strong className="text-emerald-300">modelo clínico orientado pela escuta</strong>, fundado na <strong className="text-emerald-300">Arte da Entrevista Clínica (AEC)</strong>, operacionalizado por uma <strong className="text-emerald-300">infraestrutura digital</strong> e acessado através de uma <strong className="text-emerald-300">aplicação tecnológica</strong>.
            </p>
            <p className="text-sm text-slate-400 mb-4 max-w-xl mx-auto lg:mx-0 leading-relaxed">
              Método autoral do <strong className="text-emerald-200">Dr. Ricardo Valença</strong> — nefrologista há mais de <strong className="text-emerald-200">40 anos</strong>, com <strong className="text-emerald-200">2.000+ avaliações</strong> conduzidas. Direção médica e científica do <strong className="text-teal-200">Dr. Eduardo Faveret</strong> (Neurologia). Desenvolvido em <span className="text-emerald-300/90">neurologia e cannabis medicinal</span>, aplicável a qualquer especialidade médica.
            </p>

            <p className="text-base text-emerald-200/90 mb-6 max-w-xl mx-auto lg:mx-0 italic">
              Sem improviso. Com método. Com responsabilidade clínica.
            </p>

            {/* Counter visual — 3 dimensões: autoridade histórica + sistema + time */}
            <div className="grid grid-cols-3 gap-3 mb-8 max-w-xl mx-auto lg:mx-0">
              <div className="bg-slate-900/60 border border-emerald-500/20 rounded-xl px-3 py-3 text-center">
                <div className="text-2xl lg:text-3xl font-extrabold text-emerald-400">40+</div>
                <div className="text-[10px] uppercase tracking-wider text-slate-400 mt-1">Anos do método<br />em prática</div>
              </div>
              <div className="bg-slate-900/60 border border-teal-500/20 rounded-xl px-3 py-3 text-center">
                <div className="text-2xl lg:text-3xl font-extrabold text-teal-400">+90</div>
                <div className="text-[10px] uppercase tracking-wider text-slate-400 mt-1">Avaliações<br />no sistema</div>
              </div>
              <div className="bg-slate-900/60 border border-green-500/20 rounded-xl px-3 py-3 text-center">
                <div className="text-2xl lg:text-3xl font-extrabold text-green-400">9</div>
                <div className="text-[10px] uppercase tracking-wider text-slate-400 mt-1">Profissionais<br />especialistas</div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4">
              <button onClick={() => setShowRegister(true)} className="w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-green-600 to-emerald-600 rounded-2xl text-white font-semibold hover:shadow-lg hover:shadow-green-500/25 transition-all text-lg flex items-center justify-center space-x-2 group">
                <span>Iniciar Avaliação com Método AEC</span>
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>
              <button onClick={() => setShowLogin(true)} className="w-full sm:w-auto px-8 py-4 bg-slate-800/50 border border-emerald-500/40 rounded-2xl text-white font-semibold hover:bg-slate-800 hover:border-emerald-500/60 transition-all text-lg backdrop-blur-sm">
                Já tenho conta — Entrar
              </button>
            </div>
            <p className="text-center lg:text-left text-sm text-slate-500 mt-3">
              Novos usuários: 3 dias de acesso livre. <span className="text-emerald-400 font-medium">+90 avaliações clínicas já realizadas</span> com método AEC.
            </p>

            <div className="mt-10 flex items-center justify-center lg:justify-start space-x-6 text-sm text-slate-500">
              <div className="flex items-center space-x-2">
                <Shield className="w-4 h-4 text-green-500" />
                <span>Dados Criptografados</span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Validação Clínica</span>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="flex-1 relative"
          >
            {/* Outer Container (Wider but centered) */}
            <div className="relative w-full max-w-xl mx-auto aspect-square flex items-center justify-center">

              {/* Neural Pulse Rings — Professional Medical Aesthetic */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                {pulseRings.map((ring, i) => (
                  <motion.div
                    key={i}
                    className="absolute rounded-full border border-emerald-500/20"
                    style={{ width: '60%', height: '60%' }}
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{
                      scale: [0.8, ring.maxScale],
                      opacity: [0.4, 0],
                    }}
                    transition={{
                      duration: ring.duration,
                      repeat: Infinity,
                      ease: "easeOut",
                      delay: ring.delay,
                    }}
                  />
                ))}
              </div>

              <img
                src="/brain.png"
                alt="AI Core"
                className="relative z-10 w-full h-full max-w-lg object-contain hover:scale-105 transition-transform duration-700 drop-shadow-2xl"
                style={{ filter: 'drop-shadow(0 0 30px rgba(16, 185, 129, 0.2))' }}
              />
            </div>
          </motion.div>
        </div>
      </section>

      {/* Partners section removed — add real partners when available */}

      {/* --- Problem Section --- */}
      <section className="py-20 bg-slate-950 relative">
        <div className="container mx-auto px-6">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">A Medicina Moderna enfrenta um colapso de atenção.</h2>
            <p className="text-slate-400 mb-3">O excesso de dados e a burocracia estão drenando a capacidade humana de escutar.</p>
            <p className="text-emerald-300 text-base font-medium">A MedCannLab nasce para resolver exatamente esse colapso — estruturando a escuta clínica com método e tecnologia.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <FeatureCard
              delay={0}
              icon={Database}
              title="Perda de Dados"
              description="80% das informações clínicas relevantes se perdem em anotações desestruturadas ou memória falha."
            />
            <FeatureCard
              delay={0.1}
              icon={Brain}
              title="Sobrecarga Cognitiva"
              description="Médicos tomam centenas de decisões por dia, levando à fadiga decisória e burnout silencioso."
            />
            <FeatureCard
              delay={0.2}
              icon={Users}
              title="Desumanização"
              description="A tecnologia atual transformou o paciente em uma linha de planilha, afastando o olhar clínico."
            />
          </div>
        </div>
      </section>

      {/* --- Unified Core Section --- */}
      <section id="solucao" className="py-24 relative overflow-hidden bg-slate-900/50 backdrop-blur-sm">
        <div className="absolute inset-0 bg-blue-900/5 -z-10" />
        <div className="container mx-auto px-6">
          {/* Top: Feature Split */}
          <div className="flex flex-col lg:flex-row items-center gap-16 mb-20">
            <div className="flex-1">
              <div className="flex items-start gap-4 mb-6">
                <div
                  className="w-12 h-12 rounded-full overflow-hidden border border-green-500/30 bg-slate-950/60 flex-shrink-0"
                  style={{ boxShadow: '0 0 18px rgba(0, 193, 106, 0.22)' }}
                  title="Nôa Esperanza"
                >
                  <img
                    src={noaPhotoSrc}
                    alt="Nôa Esperanza"
                    className="w-full h-full object-cover object-top"
                    draggable={false}
                    loading="eager"
                    onError={(e) => {
                      e.currentTarget.src = noaAvatarSrc
                    }}
                  />
                </div>
                <h2 className="text-4xl font-bold leading-tight">
                  Nôa Esperanza: <br />
                  <span className="text-emerald-400">Inteligência que cuida.</span>
                </h2>
              </div>
              <p className="text-slate-400 mb-8 text-lg">
                Não substituímos médicos. Amplificamos sua capacidade clínica com uma arquitetura cognitiva desenhada para a saúde.
              </p>

              <div className="space-y-6">
                <StepCard
                  number="01"
                  title="Memória Clínica Inteligente"
                  description="Organiza histórico e padrões do paciente automaticamente, criando uma timeline viva de saúde."
                />
                <StepCard
                  number="02"
                  title="Escuta Estruturada (Protocolo IMRE)"
                  description="A Nôa conduz entrevistas preliminares seguindo o protocolo clínico AEC (motor IMRE), estruturando a escuta médica com rigor."
                />
                <StepCard
                  number="03"
                  title="Apoio à Decisão Canabinoide"
                  description="Cruza dados clínicos com evidências científicas para sugerir caminhos terapêuticos seguros."
                />
              </div>
            </div>

            <div className="flex-1 relative">
              <div className="relative rounded-2xl overflow-hidden border border-slate-700 shadow-2xl bg-slate-900">
                {/* Header da janela com avatar Nôa em destaque */}
                <div className="p-4 border-b border-slate-800 relative flex items-center justify-center">
                  {/* Bolinhas window controls — absolute left */}
                  <div className="absolute left-4 flex items-center space-x-2">
                    <div className="w-3 h-3 rounded-full bg-red-500/50"></div>
                    <div className="w-3 h-3 rounded-full bg-yellow-500/50"></div>
                    <div className="w-3 h-3 rounded-full bg-green-500/50"></div>
                  </div>
                  {/* Avatar Nôa + nome — centralizado, ~20% maior cada iteração */}
                  <div className="flex items-center gap-3">
                    <div
                      className="relative w-14 h-14 rounded-full overflow-hidden border-2 border-emerald-500/60 bg-slate-950/60 flex-shrink-0"
                      style={{ boxShadow: '0 0 22px rgba(0, 193, 106, 0.55)' }}
                      title="Nôa Esperanza"
                    >
                      <img
                        src={noaPhotoSrc}
                        alt="Nôa Esperanza — IA Residente da MedCannLab"
                        className="w-full h-full object-cover object-top"
                        draggable={false}
                        loading="lazy"
                        onError={(e) => {
                          e.currentTarget.src = noaAvatarSrc
                        }}
                      />
                      {/* Pulse leve indicando atividade */}
                      <span className="absolute -bottom-0.5 -right-0.5 flex h-3 w-3">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500 border-2 border-slate-900"></span>
                      </span>
                    </div>
                    <span className="text-sm font-semibold text-emerald-200">Nôa Esperanza</span>
                  </div>
                </div>
                {/* Chat body — avatar à esquerda (padrão de chat) */}
                <div className="p-8 space-y-4 min-h-[140px]">
                  <div className="flex items-start space-x-3">
                    <div
                      className="w-9 h-9 rounded-full overflow-hidden border border-emerald-500/30 bg-slate-950/60 flex-shrink-0"
                      style={{ boxShadow: '0 0 10px rgba(0, 193, 106, 0.25)' }}
                    >
                      <img
                        src={noaPhotoSrc}
                        alt=""
                        className="w-full h-full object-cover object-top"
                        draggable={false}
                        loading="lazy"
                        onError={(e) => {
                          e.currentTarget.src = noaAvatarSrc
                        }}
                      />
                    </div>
                    <div className="bg-emerald-600/10 border border-emerald-500/20 p-3 rounded-r-xl rounded-bl-xl flex-1">
                      <p className="text-xs text-emerald-200 mb-2">Analisando padrão de sono e ansiedade...</p>
                      <div className="h-2 w-full bg-emerald-500/30 rounded animate-pulse"></div>
                    </div>
                  </div>
                </div>
                <div className="absolute bottom-4 right-4 bg-black/80 backdrop-blur px-3 py-1 rounded-full border border-green-500/30 text-xs text-green-400 font-mono">
                  ● System Active
                </div>
              </div>
            </div>
          </div>

      {/* --- Middle: Philosophy Quote (Integrated) --- */}
          <div className="max-w-4xl mx-auto text-center border-t border-slate-800 pt-16 pb-12">
            <Heart className="w-8 h-8 text-green-500 mx-auto mb-6" />
            <h2 className="text-2xl md:text-3xl font-bold mb-4">"Uma epistemologia do cuidado."</h2>
            <p className="text-lg md:text-xl text-slate-300 italic font-light leading-relaxed mb-6">
              "Enquanto a maioria aposta na automação desumanizante, a MedCannLab propõe uma <span className="text-green-400 font-normal">economia da escuta</span>. Nôa Esperanza não é um chatbot; é um artefato cognitivo desenhado para preservar a humanidade na medicina."
            </p>
            <div className="flex items-center justify-center space-x-2 opacity-70">
              <img src="/brain.png" alt="Logo" className="w-6 h-6 grayscale" />
              <span className="text-slate-500 text-xs tracking-widest uppercase">Manifesto V1.1</span>
            </div>
          </div>

        </div>
      </section>

      {/* --- AEC 001 Explanation Section --- */}
      <section className="py-24 bg-slate-900 border-t border-slate-800 relative overflow-hidden">
        {/* Decorative Background Elements */}
        <div className="absolute top-0 right-0 w-1/3 h-full bg-gradient-to-l from-blue-900/10 to-transparent pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-1/3 h-64 bg-gradient-to-t from-green-900/10 to-transparent pointer-events-none" />

        <div className="container mx-auto px-6 relative z-10">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <div className="inline-flex items-center space-x-2 bg-slate-800/80 border border-slate-700/50 rounded-full px-4 py-1.5 mb-6">
              <Brain className="w-4 h-4 text-emerald-400" />
              <span className="text-xs font-bold tracking-widest text-emerald-300 uppercase">AEC 001 Protocol</span>
            </div>
            <h2 className="text-3xl md:text-5xl font-bold mb-6 text-white leading-tight">
              A Arte da Entrevista Clínica
            </h2>
            <p className="text-lg text-slate-300 leading-relaxed">
              O paciente não é um formulário. O AEC 001 é o nosso protocolo exclusivo de escuta estruturada, garantindo que o tempo presencial com o médico seja focado no cuidado, não em preencher dados.
            </p>
          </div>

          <div className="grid lg:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {/* Step 1 */}
            <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-8 hover:bg-slate-800 transition-colors group">
              <div className="w-14 h-14 bg-emerald-500/10 rounded-2xl flex items-center justify-center mb-6 border border-emerald-500/20 group-hover:scale-110 transition-transform">
                <span className="text-2xl font-black text-emerald-400">1</span>
              </div>
              <h3 className="text-xl font-bold text-white mb-3 flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-emerald-400" />
                A Escuta Ativa
              </h3>
              <p className="text-slate-400 text-sm leading-relaxed">
                Antes da sua consulta, Nôa conduz uma conversa imersiva guiada por 28 blocos semânticos. Ela investiga seu histórico, sono, dor e bem-estar, adaptando as perguntas ao seu ritmo.
              </p>
            </div>

            {/* Step 2 */}
            <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-8 hover:bg-slate-800 transition-colors group relative md:-translate-y-4">
              <div className="w-14 h-14 bg-teal-500/10 rounded-2xl flex items-center justify-center mb-6 border border-teal-500/20 group-hover:scale-110 transition-transform">
                <span className="text-2xl font-black text-teal-400">2</span>
              </div>
              <h3 className="text-xl font-bold text-white mb-3 flex items-center gap-2">
                <FileText className="w-5 h-5 text-teal-400" />
                Síntese Cognitiva
              </h3>
              <p className="text-slate-400 text-sm leading-relaxed">
                A IA estrutura o seu relato cru em um relatório clínico padrão ouro (IMRE). Sintomas, cronologia e bandeiras vermelhas são mapeados automaticamente em tempo real.
              </p>
              
              {/* Connector line for large screens */}
              <div className="hidden lg:block absolute top-1/2 -left-4 w-8 border-t border-dashed border-slate-600"></div>
              <div className="hidden lg:block absolute top-1/2 -right-4 w-8 border-t border-dashed border-slate-600"></div>
            </div>

            {/* Step 3 */}
            <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-8 hover:bg-slate-800 transition-colors group">
              <div className="w-14 h-14 bg-green-500/10 rounded-2xl flex items-center justify-center mb-6 border border-green-500/20 group-hover:scale-110 transition-transform">
                <span className="text-2xl font-black text-green-400">3</span>
              </div>
              <h3 className="text-xl font-bold text-white mb-3 flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-green-400" />
                O Encontro Médico
              </h3>
              <p className="text-slate-400 text-sm leading-relaxed">
                Quando você e o médico se conectam na videochamada, ele já leu seu mapa clínico completo. Os 20 minutos que seriam gastos fazendo perguntas repetitivas viram tempo real de olho no olho e prescrição cuidadosa.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* --- Seção Institucional (v15 selado 29/04) — Tese & Arquitetura --- */}
      <section id="sobre" className="py-24 bg-slate-950 relative border-t border-slate-900 overflow-hidden">
        {/* Gradient sutil de fundo */}
        <div className="absolute top-0 left-0 w-1/3 h-full bg-gradient-to-r from-emerald-900/10 to-transparent pointer-events-none -z-10" />
        <div className="absolute bottom-0 right-0 w-1/3 h-full bg-gradient-to-l from-teal-900/10 to-transparent pointer-events-none -z-10" />

        <div className="container mx-auto px-6 relative z-10 max-w-5xl">
          <div className="text-center mb-12">
            <div className="inline-flex items-center space-x-2 bg-slate-800/80 border border-slate-700/50 rounded-full px-4 py-1.5 mb-6">
              <Microscope className="w-4 h-4 text-emerald-400" />
              <span className="text-xs font-bold tracking-widest text-emerald-300 uppercase">Sobre a MedCannLab</span>
            </div>
            <h2 className="text-3xl md:text-5xl font-bold mb-6 text-white leading-tight">
              Tese & Arquitetura
            </h2>
            <p className="text-lg text-emerald-200/90 italic max-w-2xl mx-auto">
              "Transformamos a escuta clínica em cuidado estruturado e auditável."
            </p>
          </div>

          {/* Resumo curto (sempre visível) */}
          <div className="prose prose-invert max-w-3xl mx-auto text-slate-300 leading-relaxed mb-8">
            <p className="text-base md:text-lg">
              <strong className="text-white">MedCannLab</strong> é uma <strong className="text-emerald-300">Infraestrutura Cognitiva Clínica orientada pela Escuta</strong>, fundada na <strong className="text-emerald-300">Arte da Entrevista Clínica (AEC)</strong> — método autoral do <strong className="text-white">Dr. Ricardo Valença</strong> e operacionalizado por arquitetura cognitiva auditável.
            </p>
          </div>

          {/* Botão expandir/recolher */}
          <div className="text-center mb-2">
            <button
              onClick={() => setShowFullInstitutional(!showFullInstitutional)}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-slate-800/60 hover:bg-slate-800 border border-emerald-500/30 hover:border-emerald-500/50 rounded-full text-sm font-medium text-emerald-300 transition-all"
            >
              {showFullInstitutional ? 'Recolher tese completa' : 'Ler tese completa'}
              <ArrowRight className={`w-4 h-4 transition-transform ${showFullInstitutional ? 'rotate-90' : 'rotate-0'}`} />
            </button>
          </div>

          {/* Conteúdo expansível */}
          <AnimatePresence initial={false}>
            {showFullInstitutional && (
              <motion.div
                key="institutional-full"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.4, ease: 'easeInOut' }}
                className="overflow-hidden"
              >
                {/* Parágrafo institucional v15 — em blocos legíveis */}
                <div className="prose prose-invert max-w-3xl mx-auto space-y-6 text-slate-300 leading-relaxed mt-8">
                  <p className="text-base md:text-lg">
                    O método se materializa em <strong className="text-emerald-300">4 fases macro</strong> (Abertura Exponencial, Desenvolvimento Indiciário, Anamnese Triaxial, Fechamento Consensual), operando sob o <strong className="text-emerald-300">motor IMRE</strong> (Incentivator Minimal of Exponential — lógica de perguntas exponenciais), em fluxo determinístico estruturado e <strong className="text-emerald-300">28 blocos modulares</strong> (preservando 37 blocos legacy), formando um sistema completo de escuta estruturada e raciocínio diagnóstico.
                  </p>

                  <p className="text-base md:text-lg">
                    A tradução desse método em sistema executável é a contribuição arquitetural original de <strong className="text-white">Pedro Henrique Passos Galluf</strong> (CTO): o <strong className="text-emerald-300">TradeVision Core</strong> — núcleo originado em sua plataforma anterior e amplamente desenvolvido no MedCannLab — codifica a metodologia clínica autoral em <strong className="text-emerald-300">infraestrutura cognitiva auditável</strong>, com FSM determinístico, Verbatim First, AEC Gate, Pipeline Orchestrator e COS Kernel construídos diretamente sobre a AEC para executar o método sob condições auditáveis. A integração entre método e arquitetura foi orquestrada por Pedro em colaboração técnica com Ricardo.
                  </p>
                </div>

                {/* Pirâmide de 8 camadas — visual */}
                <div className="mt-12 max-w-4xl mx-auto">
                  <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-8">
                    <div className="flex items-center gap-3 mb-6">
                      <Lock className="w-5 h-5 text-emerald-400" />
                      <h3 className="text-lg font-bold text-white tracking-tight">Pirâmide de Governança — 8 camadas</h3>
                    </div>
                    <p className="text-sm text-slate-400 mb-6 leading-relaxed">
                      A plataforma opera sob uma pirâmide formal de governança, onde <strong className="text-emerald-300">GPT é o último a falar e o primeiro a ser checado</strong> — com 46% das interações em hard-lock bypassando o LLM.
                    </p>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                      <div className="bg-slate-950/60 border border-emerald-500/20 rounded-lg px-3 py-2.5 text-center">
                        <div className="text-emerald-400 font-bold mb-1">0</div>
                        <div className="text-slate-300">Constituição §1</div>
                      </div>
                      <div className="bg-slate-950/60 border border-emerald-500/20 rounded-lg px-3 py-2.5 text-center">
                        <div className="text-emerald-400 font-bold mb-1">1</div>
                        <div className="text-slate-300">COS Kernel v5.0</div>
                      </div>
                      <div className="bg-slate-950/60 border border-teal-500/20 rounded-lg px-3 py-2.5 text-center">
                        <div className="text-teal-400 font-bold mb-1">2</div>
                        <div className="text-slate-300">AEC FSM</div>
                      </div>
                      <div className="bg-slate-950/60 border border-teal-500/20 rounded-lg px-3 py-2.5 text-center">
                        <div className="text-teal-400 font-bold mb-1">3</div>
                        <div className="text-slate-300">Verbatim First</div>
                      </div>
                      <div className="bg-slate-950/60 border border-green-500/20 rounded-lg px-3 py-2.5 text-center">
                        <div className="text-green-400 font-bold mb-1">4</div>
                        <div className="text-slate-300">AEC Gate</div>
                      </div>
                      <div className="bg-slate-950/60 border border-slate-700/50 rounded-lg px-3 py-2.5 text-center">
                        <div className="text-slate-400 font-bold mb-1">5</div>
                        <div className="text-slate-300">GPT</div>
                      </div>
                      <div className="bg-slate-950/60 border border-green-500/20 rounded-lg px-3 py-2.5 text-center">
                        <div className="text-green-400 font-bold mb-1">6</div>
                        <div className="text-slate-300">Pós-processamento</div>
                      </div>
                      <div className="bg-slate-950/60 border border-emerald-500/20 rounded-lg px-3 py-2.5 text-center">
                        <div className="text-emerald-400 font-bold mb-1">7</div>
                        <div className="text-slate-300">Pipeline Orchestrator</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Formação + Constituição */}
                <div className="prose prose-invert max-w-3xl mx-auto space-y-6 text-slate-300 leading-relaxed mt-12">
                  <p className="text-base md:text-lg">
                    <strong className="text-emerald-300">Formação clínica é pilar:</strong> cursos AEC (R$ 299,90), IMRE Triaxial (R$ 199,90) e Cannabis Medicinal (R$ 2.999,90), Simulador com 20 personas-pacientes, parceria <em>Cidade Amiga dos Rins</em>.
                  </p>

                  <p className="text-base md:text-lg">
                    <strong className="text-emerald-300">Time fundador:</strong> Dr. Ricardo Valença (Nefrologia — criador da AEC), Dr. Eduardo Faveret (Neurologia — direção médica e científica), Pedro Henrique Passos Galluf (CTO — arquitetura cognitiva e TradeVision Core), João Eduardo Vidal (institucional e parcerias).
                  </p>
                </div>

                {/* Frase âncora final */}
                <div className="mt-12 max-w-3xl mx-auto text-center border-t border-slate-800 pt-10">
                  <p className="text-lg md:text-xl text-white font-semibold leading-relaxed mb-4">
                    MedCannLab não substitui o método clínico — <span className="text-emerald-300">operacionaliza, preserva e escala o método</span> em condições auditáveis.
                  </p>
                  <p className="text-sm text-slate-500 italic tracking-wide">
                    Method-first, architecture-grounded, AI-last.
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </section>

      {/* --- Consultório-Escola Exponencial (Ricardo + Eduardo Faveret) --- */}
      <section id="consultorio-escola" className="py-20 bg-gradient-to-br from-slate-900 via-emerald-950/30 to-slate-900 relative border-t border-slate-900 overflow-hidden">
        {/* Glow sutil */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="container mx-auto px-6 relative z-10">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <div className="inline-flex items-center space-x-2 bg-slate-800/80 border border-emerald-500/30 rounded-full px-4 py-1.5 mb-6">
              <Stethoscope className="w-4 h-4 text-emerald-400" />
              <span className="text-xs font-bold tracking-widest text-emerald-300 uppercase">Consultório-Escola Exponencial</span>
            </div>
            <h2 className="text-3xl md:text-5xl font-bold mb-4 text-white leading-tight">
              Dois consultórios, um método.<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-300">Escala que ensina.</span>
            </h2>
            <p className="text-base text-emerald-200/90 mb-6 max-w-2xl mx-auto leading-relaxed">
              Cada atendimento gera <strong className="text-white">cuidado real</strong>, <strong className="text-white">aprendizado contínuo</strong> e <strong className="text-white">base científica</strong>.
            </p>
            <p className="text-lg text-slate-300 leading-relaxed">
              A junção da prática clínica do <strong className="text-emerald-300">Dr. Ricardo Valença</strong> (Nefrologia) e do <strong className="text-teal-300">Dr. Eduardo Faveret</strong> (Neurologia) — operacionalizada pelo método AEC e amplificada pela infraestrutura digital MedCannLab.
            </p>
          </div>

          {/* 2 médicos como cards */}
          <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto mb-10">
            <div className="bg-slate-900/70 border border-emerald-500/20 rounded-2xl p-7 hover:border-emerald-500/40 transition-colors">
              <div className="flex items-start gap-4 mb-4">
                <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center flex-shrink-0">
                  <Heart className="w-7 h-7 text-emerald-400" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">Dr. Ricardo Valença</h3>
                  <p className="text-sm text-emerald-300 font-medium">Nefrologia · Coordenador Científico</p>
                </div>
              </div>
              <p className="text-sm text-slate-400 leading-relaxed">
                Criador do método AEC. <strong className="text-emerald-200">40+ anos</strong> de prática clínica, <strong className="text-emerald-200">2.000+ avaliações</strong> conduzidas. Mestrado defendido sobre o método. Cidade Amiga dos Rins (CKD).
              </p>
            </div>

            <div className="bg-slate-900/70 border border-teal-500/20 rounded-2xl p-7 hover:border-teal-500/40 transition-colors">
              <div className="flex items-start gap-4 mb-4">
                <div className="w-14 h-14 rounded-2xl bg-teal-500/10 border border-teal-500/30 flex items-center justify-center flex-shrink-0">
                  <Brain className="w-7 h-7 text-teal-400" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">Dr. Eduardo Faveret</h3>
                  <p className="text-sm text-teal-300 font-medium">Neurologia · Diretor Médico</p>
                </div>
              </div>
              <p className="text-sm text-slate-400 leading-relaxed">
                <strong className="text-teal-200">Direção médica e científica</strong> do MedCannLab. Atuação clínica em <strong className="text-teal-200">neurologia com foco em cannabis medicinal</strong> e escuta estruturada. Integra o método AEC à prática neurológica e à formação clínica continuada dentro do modelo MedCannLab.
              </p>
            </div>
          </div>

          {/* 3 dimensões do consultório-escola */}
          <div className="grid md:grid-cols-3 gap-5 max-w-5xl mx-auto">
            <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-5 text-center">
              <Stethoscope className="w-6 h-6 text-emerald-400 mx-auto mb-3" />
              <h4 className="text-white font-semibold mb-2">Atendimento real</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Cada consulta é prática clínica de verdade — pacientes reais, escuta real, decisão real.
              </p>
            </div>
            <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-5 text-center">
              <Users className="w-6 h-6 text-teal-400 mx-auto mb-3" />
              <h4 className="text-white font-semibold mb-2">Aprendizado contínuo</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Cada caso clínico estruturado vira material formativo para residentes, alunos e médicos parceiros.
              </p>
            </div>
            <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-5 text-center">
              <Zap className="w-6 h-6 text-green-400 mx-auto mb-3" />
              <h4 className="text-white font-semibold mb-2">Escala metódica</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                A infraestrutura digital permite reproduzir o método sem diluir a qualidade clínica.
              </p>
            </div>
          </div>

          <p className="text-center text-sm text-slate-500 italic mt-10 max-w-2xl mx-auto">
            Um modelo onde clínica, ensino e pesquisa <span className="text-emerald-300/80">acontecem juntos — no mesmo atendimento, no mesmo método</span>.
          </p>
        </div>
      </section>

      {/* --- 3 Eixos Section (V1.9.100 SEO) — Clínica + Ensino + Pesquisa --- */}
      <section id="eixos" className="py-20 bg-slate-950 relative border-t border-slate-900 overflow-hidden">
        <div className="absolute inset-0 bg-emerald-900/5 -z-10" />
        <div className="container mx-auto px-6 relative z-10">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <div className="inline-flex items-center space-x-2 bg-slate-800/80 border border-slate-700/50 rounded-full px-4 py-1.5 mb-6">
              <Brain className="w-4 h-4 text-emerald-400" />
              <span className="text-xs font-bold tracking-widest text-emerald-300 uppercase">Os 3 Pilares</span>
            </div>
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-white leading-tight">
              Clínica, Ensino e Pesquisa em Cannabis Medicinal
            </h2>
            <p className="text-slate-400 text-lg">
              Três eixos integrados sobre o mesmo método autoral: a <strong className="text-emerald-300">Arte da Entrevista Clínica (AEC)</strong> do Dr. Ricardo Valença.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {/* Eixo 1 — Clínica */}
            <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-7 hover:border-emerald-500/40 transition-colors">
              <div className="w-12 h-12 bg-emerald-500/10 rounded-xl flex items-center justify-center mb-5 border border-emerald-500/20">
                <Heart className="w-6 h-6 text-emerald-400" />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">Clínica — Avaliação com Método AEC</h3>
              <p className="text-slate-400 text-sm leading-relaxed">
                Avaliação clínica estruturada conduzida por médicos especialistas. Escuta ativa, IMRE determinístico, relatórios assinados (ICP-Brasil). Cannabis medicinal, neurologia, nefrologia.
              </p>
            </div>

            {/* Eixo 2 — Ensino */}
            <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-7 hover:border-teal-500/40 transition-colors">
              <div className="w-12 h-12 bg-teal-500/10 rounded-xl flex items-center justify-center mb-5 border border-teal-500/20">
                <Users className="w-6 h-6 text-teal-400" />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">Ensino — Formação Médica Estruturada</h3>
              <p className="text-slate-400 text-sm leading-relaxed">
                Cursos baseados no método AEC (R$ 299,90), Sistema IMRE Triaxial (R$ 199,90) e Pós-Graduação em Cannabis Medicinal. Simulador clínico com 20 personas-pacientes para prática.
              </p>
            </div>

            {/* Eixo 3 — Pesquisa */}
            <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-7 hover:border-green-500/40 transition-colors">
              <div className="w-12 h-12 bg-green-500/10 rounded-xl flex items-center justify-center mb-5 border border-green-500/20">
                <Database className="w-6 h-6 text-green-400" />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">Pesquisa — Produção Científica</h3>
              <p className="text-slate-400 text-sm leading-relaxed">
                As avaliações estruturadas pelo método AEC geram dados clínicos organizados e rastreáveis, base para evidência real em cannabis medicinal. <strong className="text-green-300">Mais de 90 casos já estruturados</strong> formam a base inicial. Parceria com Cidade Amiga dos Rins (CKD).
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* --- Pricing Section --- */}
      <section id="planos" className="py-24 bg-slate-950 relative border-t border-slate-900">
        <div className="absolute inset-0 bg-green-900/5 -z-10" />
        <div className="container mx-auto px-6">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Acesso Transparente e Direto.</h2>
            <p className="text-slate-400">Tudo o que você precisa, feito sob medida para o seu perfil.</p>
          </div>

          <div className="grid lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
            
            {/* Paciente Plan */}
            <div className="w-full bg-slate-900 rounded-2xl p-8 border border-slate-800 relative flex flex-col h-full hover:border-green-500/50 transition-colors group">
              <div className="relative z-10 flex-grow">
                <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center mb-6">
                  <UserPlus className="w-6 h-6 text-emerald-400" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">Plano Paciente (SaaS)</h3>
                <p className="text-slate-400 mb-6 text-sm">Assinatura tecnológica para acesso ao Motor Nôa Esperanza e relatórios estruturados AEC.</p>

                <div className="mb-6 border-b border-slate-800 pb-6">
                  <div className="flex items-end gap-2 text-white">
                    <span className="text-4xl font-extrabold tracking-tight">R$ 60</span>
                    <span className="text-slate-400 pb-1">/mês</span>
                  </div>
                  <div className="flex flex-col space-y-1 mt-3">
                    <p className="text-xs text-green-400 font-bold tracking-wide">+ Taxa de Inscrição Única: R$ 19,90 (Só no 1º mês)</p>
                    <p className="text-xs text-slate-400 font-medium mt-1">Lembrete: O valor da Consulta Médica é cobrado separadamente pelo profissional.</p>
                  </div>
                </div>

                <ul className="space-y-4 text-sm text-slate-300">
                  <li className="flex gap-3"><CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0" /><span>Avaliação Clínica Inteligente (Nôa AI)</span></li>
                  <li className="flex gap-3"><CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0" /><span>Armazenamento Criptografado de Histórico</span></li>
                  <li className="flex gap-3"><CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0" /><span>Acesso ao Agendador de Especialistas</span></li>
                </ul>
              </div>
              <button onClick={() => setShowRegister(true)} className="w-full mt-8 py-3 bg-slate-800 text-white rounded-xl font-semibold hover:bg-slate-700 transition">Assinar Plataforma</button>
            </div>

            {/* Estuda / Aluno Plan */}
            <div className="w-full bg-slate-900 rounded-2xl p-8 border border-yellow-500/40 shadow-2xl relative flex flex-col h-full hover:border-yellow-400/60 hover:shadow-yellow-500/10 hover:shadow-2xl transition-all duration-300">
              <div className="absolute top-0 left-1/2 -translate-x-1/2 bg-yellow-500 text-slate-950 text-xs font-bold px-4 py-1 rounded-b-xl z-20">
                ACESSO EDUCACIONAL
              </div>
              <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/5 to-transparent pointer-events-none rounded-2xl" />
              
              <div className="relative z-10 flex-grow">
                <div className="w-12 h-12 rounded-xl bg-yellow-500/10 flex items-center justify-center mb-6">
                  <FileText className="w-6 h-6 text-yellow-400" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">Plano Acadêmico</h3>
                <p className="text-slate-400 mb-6 text-sm">Biblioteca para pacientes, familiares, e simulador de ensino para prospecção médica.</p>

                <div className="mb-6 border-b border-slate-800 pb-6">
                  <div className="flex items-end gap-2 text-white">
                    <span className="text-4xl font-extrabold tracking-tight">R$ 149</span>
                    <span className="text-slate-400 pb-1">,90/mês</span>
                  </div>
                  <p className="text-xs text-yellow-400 mt-2 font-medium">Acesso vitalício à base Biblioteca MedCannLab</p>
                </div>

                <ul className="space-y-4 text-sm text-slate-300">
                  <li className="flex gap-3"><CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0" /><span>Acesso a todos os Cursos EAD Familiares e Clínicos</span></li>
                  <li className="flex gap-3"><CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0" /><span>Simulador Clínico da Nôa AI Interativo</span></li>
                  <li className="flex gap-3"><CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0" /><span>Módulo Avançado de Biblioteca Literária</span></li>
                  <li className="flex gap-3"><CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0" /><span>Fórum Comunitário Educacional</span></li>
                </ul>
              </div>
              <button onClick={() => setShowRegister(true)} className="w-full mt-8 py-3 bg-gradient-to-r from-yellow-600 to-amber-600 text-white rounded-xl font-bold hover:shadow-lg transition">Acessar Formação</button>
            </div>

            {/* Profissional Plan */}
            <div className="w-full bg-slate-900 rounded-2xl p-8 border border-slate-800 relative flex flex-col h-full hover:border-emerald-500/50 transition-colors group">
              <div className="relative z-10 flex-grow">
                <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center mb-6">
                  <Stethoscope className="w-6 h-6 text-emerald-400" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">Pro MedCannLab</h3>
                <p className="text-slate-400 mb-6 text-sm">Ferramenta Médica SaaS para estruturação de clínicas independentes.</p>

                <div className="mb-6 border-b border-slate-800 pb-6">
                  <div className="flex items-end gap-2 text-white">
                    <span className="text-4xl font-extrabold tracking-tight">R$ 99</span>
                    <span className="text-slate-400 pb-1">,90/mês</span>
                  </div>
                  <p className="text-xs text-emerald-400 mt-2 font-medium">Taxa de Operação: 30% (Com impostos e infraestrutura já inclusos)</p>
                </div>

                <ul className="space-y-4 text-sm text-slate-300">
                  <li className="flex gap-3"><CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0" /><span>Acesso ao Prontuário NLP Mastigado</span></li>
                  <li className="flex gap-3"><CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0" /><span>Assinatura Digital Cloud (ICP-Brasil) e Agenda</span></li>
                  <li className="flex gap-3"><CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0" /><span>Liquidação Connect (Split 70/30) Automático</span></li>
                  <li className="flex gap-3"><CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0" /><span>Sem limites de convites a pacientes</span></li>
                </ul>
              </div>
              <button onClick={() => setShowRegister(true)} className="w-full mt-8 py-3 bg-slate-800 text-white rounded-xl font-semibold hover:bg-slate-700 transition">Assinar Licença Pro</button>
            </div>

          </div>

          <div className="mt-12 max-w-4xl mx-auto bg-slate-900/50 border border-slate-800 rounded-xl p-6 text-center">
             <p className="text-xs text-slate-500 leading-relaxed font-mono">
               <strong>Aviso de Governança Médica (CFM):</strong> A MedCannLab atua exclusivamente como software (SaaS) de inteligência artificial clínica e intermediação de agendamentos. Nós não prestamos o ato médico, não diagnosticamos doenças e não operamos como Clínica Médica ou Plano de Saúde Suplementar. Todo o ato terapêutico decorrente do uso da plataforma é de responsabilidade civil e autônoma do profissional parceiro.
             </p>
          </div>
        </div>
      </section>

      {/* --- Download / Install App Section --- */}
      <section className="relative py-20 bg-gradient-to-b from-slate-950 to-slate-900 border-t border-slate-800/50">
        <div className="container mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="max-w-4xl mx-auto text-center"
          >
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-green-600/20 to-emerald-600/20 border border-green-500/30 mb-6">
              <Download className="w-8 h-8 text-green-400" />
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Acesse de Qualquer Dispositivo
            </h2>
            <p className="text-lg text-slate-400 mb-10 max-w-2xl mx-auto">
              Instale o MedCannLab como app no seu celular ou computador para acesso rápido e experiência nativa.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl mx-auto">
              {/* Mobile */}
              <button
                onClick={() => {
                  if ((window as any).deferredPrompt) {
                    (window as any).deferredPrompt.prompt()
                  } else {
                    alert('📱 No seu celular:\n\n• iPhone/Safari: Toque em "Compartilhar" → "Adicionar à Tela Início"\n\n• Android/Chrome: Toque no menu ⋮ → "Instalar aplicativo"')
                  }
                }}
                className="group flex items-center gap-4 p-6 rounded-2xl bg-slate-800/50 border border-slate-700/50 hover:border-green-500/40 hover:bg-slate-800/80 transition-all duration-300"
              >
                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-emerald-600/20 to-teal-600/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Smartphone className="w-7 h-7 text-emerald-400" />
                </div>
                <div className="text-left">
                  <p className="text-sm text-slate-400 font-medium">Instalar no</p>
                  <p className="text-xl font-bold text-white">Celular</p>
                  <p className="text-xs text-slate-500 mt-1">iOS & Android</p>
                </div>
              </button>

              {/* Desktop */}
              <button
                onClick={() => {
                  if ((window as any).deferredPrompt) {
                    (window as any).deferredPrompt.prompt()
                  } else {
                    alert('🖥️ No seu computador:\n\n• Chrome: Clique no ícone de instalação na barra de endereço (⊕)\n\n• Edge: Menu ⋯ → "Aplicativos" → "Instalar este site como aplicativo"')
                  }
                }}
                className="group flex items-center gap-4 p-6 rounded-2xl bg-slate-800/50 border border-slate-700/50 hover:border-green-500/40 hover:bg-slate-800/80 transition-all duration-300"
              >
                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-emerald-600/20 to-green-600/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Monitor className="w-7 h-7 text-emerald-400" />
                </div>
                <div className="text-left">
                  <p className="text-sm text-slate-400 font-medium">Instalar no</p>
                  <p className="text-xl font-bold text-white">Computador</p>
                  <p className="text-xs text-slate-500 mt-1">Windows, Mac & Linux</p>
                </div>
              </button>
            </div>

            <p className="text-sm text-slate-500 mt-8 flex items-center justify-center gap-2">
              <Globe className="w-4 h-4" />
              Também acessível via navegador em <span className="text-green-400 font-medium">medcannlab.com.br</span>
            </p>
          </motion.div>
        </div>
      </section>

      {/* --- Footer --- */}
      <footer className="bg-slate-950 border-t border-slate-900 py-12">
        <div className="container mx-auto px-6 flex flex-col md:flex-row justify-between items-center opacity-50 hover:opacity-100 transition-opacity">
          <div className="flex items-center space-x-2 mb-4 md:mb-0">
            <Brain className="w-5 h-5 text-slate-500" />
            <span className="font-semibold text-slate-400">MedCannLab</span>
          </div>
          <div className="flex space-x-6 text-sm text-slate-500">
            <Link to="/termos" className="cursor-pointer hover:text-white transition-colors">Termos de Uso</Link>
            <Link to="/privacidade" className="cursor-pointer hover:text-white transition-colors">Privacidade</Link>
            <span className="cursor-pointer hover:text-white" onClick={() => setShowAdminLogin(true)}>Admin</span>
          </div>
          <div className="mt-4 md:mt-0 text-xs text-slate-600">
            © 2026 MedCannLab. All rights reserved.
          </div>
        </div>
      </footer>

      {/* --- MODALS (Functional Preservation) --- */}

      {/* Login Modal */}
      <AuthModal isOpen={showLogin} onClose={() => setShowLogin(false)} title="Bem-vindo de volta">
        <div className="space-y-4">
          <div>
            <label className="block text-sm text-slate-400 mb-1">Email</label>
            <input
              type="email"
              value={loginData.email}
              onChange={(e) => setLoginData({ ...loginData, email: e.target.value })}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 text-white focus:ring-2 focus:ring-green-500 outline-none transition-all"
              placeholder="seu@email.com"
            />
          </div>
          <div>
            <label className="block text-sm text-slate-400 mb-1">Senha</label>
            <input
              type="password"
              value={loginData.password}
              onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 text-white focus:ring-2 focus:ring-green-500 outline-none transition-all"
              placeholder="••••••••"
            />
          </div>
          <button
            onClick={handleLogin}
            disabled={isLoading}
            className="w-full bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg p-3 font-semibold hover:shadow-lg hover:shadow-green-500/20 transition-all disabled:opacity-50"
          >
            {isLoading ? 'Acessando...' : 'Entrar na Plataforma'}
          </button>
          <div className="flex items-center justify-between mt-4">
            <p className="text-sm text-slate-500 cursor-pointer hover:text-white" onClick={() => { setShowLogin(false); setShowRegister(true); }}>
              Não tem conta? <span className="text-green-400">Criar agora</span>
            </p>
            <p className="text-sm text-slate-500 cursor-pointer hover:text-green-400 transition-colors" onClick={() => { setShowLogin(false); setShowForgotPassword(true); }}>
              Esqueci a senha
            </p>
          </div>
        </div>
      </AuthModal>

      {/* Forgot Password Modal */}
      <AuthModal isOpen={showForgotPassword} onClose={() => { setShowForgotPassword(false); setForgotPasswordEmail('') }} title="Recuperar Senha">
        <div className="space-y-4">
          <p className="text-slate-400 text-sm">Digite seu email e enviaremos um link para redefinir sua senha.</p>
          <div>
            <label className="block text-sm text-slate-400 mb-1">Email</label>
            <input
              type="email"
              value={forgotPasswordEmail}
              onChange={(e) => setForgotPasswordEmail(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleForgotPassword()}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 text-white focus:ring-2 focus:ring-green-500 outline-none transition-all"
              placeholder="seu@email.com"
              autoFocus
            />
          </div>
          <button
            onClick={handleForgotPassword}
            disabled={isLoading}
            className="w-full bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg p-3 font-semibold hover:shadow-lg hover:shadow-green-500/20 transition-all disabled:opacity-50"
          >
            {isLoading ? 'Enviando...' : 'Enviar link de recuperação'}
          </button>
          <p className="text-center text-sm text-slate-500 cursor-pointer hover:text-white" onClick={() => { setShowForgotPassword(false); setShowLogin(true) }}>
            Lembrou a senha? <span className="text-green-400">Entrar</span>
          </p>
        </div>
      </AuthModal>

      {/* Register Modal */}
      <AuthModal isOpen={showRegister} onClose={() => setShowRegister(false)} title="Criar Nova Conta">
        <div className="space-y-4">
          {/* User Type Selector */}
          <div className="flex bg-slate-800 p-1 rounded-lg mb-4">
            {['paciente', 'profissional', 'aluno'].map((type) => (
              <button
                key={type}
                onClick={() => setRegisterData({ ...registerData, userType: type as any })}
                className={`flex-1 py-2 text-sm font-medium rounded-md capitalize transition-all ${registerData.userType === type ? 'bg-slate-600 text-white shadow-md' : 'text-slate-400 hover:text-white'}`}
              >
                {type}
              </button>
            ))}
          </div>

          <input
            type="text"
            placeholder="Nome Completo"
            value={registerData.name}
            onChange={(e) => setRegisterData({ ...registerData, name: e.target.value })}
            className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 text-white outline-none focus:border-green-500"
          />
          <input
            type="email"
            placeholder="Email"
            value={registerData.email}
            onChange={(e) => setRegisterData({ ...registerData, email: e.target.value })}
            className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 text-white outline-none focus:border-green-500"
          />
          <div className="grid grid-cols-2 gap-2">
            <input
              type="password"
              placeholder="Senha"
              value={registerData.password}
              onChange={(e) => setRegisterData({ ...registerData, password: e.target.value })}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 text-white outline-none focus:border-green-500"
            />
            <input
              type="password"
              placeholder="Confirmar"
              value={registerData.confirmPassword}
              onChange={(e) => setRegisterData({ ...registerData, confirmPassword: e.target.value })}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 text-white outline-none focus:border-green-500"
            />
          </div>

          {/* Referral / Indication Field (Available for all types) */}
          <div className="pt-2 border-t border-slate-700/50">
            <label className="text-xs text-slate-400 mb-1 block ml-1">Indicação (Opcional)</label>
            <input
              type="text"
              placeholder="Código ou Nome de quem indicou"
              value={(registerData as any).referralCode || ''}
              onChange={(e) => setRegisterData({ ...registerData, referralCode: e.target.value } as any)}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 text-white outline-none focus:border-green-500 placeholder:text-slate-500"
            />
            <p className="text-[10px] text-slate-500 mt-1 ml-1">
              * Informe o nome do médico, instituição ou código de parceiro se houver.
            </p>
          </div>

          {/* Conditional Fields based on User Type */}
          {registerData.userType === 'profissional' && (
            <div className="grid grid-cols-3 gap-2 animate-in fade-in slide-in-from-top-2 mt-2">
              <select
                value={registerData.councilType}
                onChange={(e) => setRegisterData({ ...registerData, councilType: e.target.value })}
                className="bg-slate-800 border border-slate-700 rounded-lg p-3 text-white outline-none"
              >
                <option value="">Conselho</option>
                <option value="CRM">CRM</option>
                <option value="CRO">CRO</option>
                <option value="CRP">CRP</option>
                <option value="CRF">CRF</option>
              </select>
              <input
                type="text"
                placeholder="Número (UF)"
                value={registerData.councilNumber}
                onChange={(e) => setRegisterData({ ...registerData, councilNumber: e.target.value })}
                className="col-span-2 bg-slate-800 border border-slate-700 rounded-lg p-3 text-white outline-none"
              />
            </div>
          )}

          {registerData.userType === 'aluno' && (
            <div className="pt-2">
              <input
                type="text"
                placeholder="Matrícula / Instituição de Ensino"
                value={(registerData as any).studentId || ''}
                onChange={(e) => setRegisterData({ ...registerData, studentId: e.target.value } as any)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 text-white outline-none focus:border-green-500"
              />
              <div className="p-2 mt-2 bg-blue-900/20 border border-blue-500/20 rounded-lg text-xs text-blue-200 animate-in fade-in">
                🎓 Acesso exclusivo para estudantes. A matrícula será validada.
              </div>
            </div>
          )}

          <button
            onClick={handleRegister}
            disabled={isLoading}
            className="w-full bg-white text-slate-900 rounded-lg p-3 font-bold hover:bg-slate-200 transition-all mt-4 disabled:opacity-50"
          >
            {isLoading ? 'Criando Conta...' : `Registrar como ${registerData.userType.charAt(0).toUpperCase() + registerData.userType.slice(1)}`}
          </button>
          <p className="text-center text-sm text-slate-500 mt-4 cursor-pointer hover:text-white" onClick={() => { setShowRegister(false); setShowLogin(true); }}>
            Já tem conta? <span className="text-green-400">Entrar</span>
          </p>
        </div>
      </AuthModal>

      {/* Admin Login Modal */}
      <AuthModal isOpen={showAdminLogin} onClose={() => setShowAdminLogin(false)} title="Acesso Administrativo">
        <div className="space-y-4 border-l-4 border-yellow-500 pl-4 py-2 bg-yellow-500/5 rounded-r-lg mb-4">
          <p className="text-yellow-200 text-sm">Área restrita à governança do sistema.</p>
        </div>
        <div className="space-y-4">
          <input
            type="email"
            placeholder="Admin Email"
            value={adminLoginData.email}
            onChange={(e) => setAdminLoginData({ ...adminLoginData, email: e.target.value })}
            className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 text-white outline-none focus:border-yellow-500"
          />
          <input
            type="password"
            placeholder="Admin Key"
            value={adminLoginData.password}
            onChange={(e) => setAdminLoginData({ ...adminLoginData, password: e.target.value })}
            className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 text-white outline-none focus:border-yellow-500"
          />
          <button
            onClick={handleAdminLogin}
            disabled={isLoading}
            className="w-full bg-gradient-to-r from-yellow-600 to-orange-600 text-white rounded-lg p-3 font-semibold hover:shadow-lg transition-all disabled:opacity-50"
          >
            {isLoading ? 'Verificando...' : 'Acessar Core'}
          </button>
          {/* Emergency login removed for security */}
        </div>
      </AuthModal>

      {process.env.NODE_ENV === 'development' && <div className="fixed bottom-4 right-4 z-50"><LoginDebugPanel /></div>}

    </div>
  )
}

export default Landing
