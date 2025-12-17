import React, { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useToast } from '../contexts/ToastContext'
import { supabase } from '../lib/supabase'
import LoginDebugPanel from '../components/LoginDebugPanel'
import AnimatedParticles from '../components/AnimatedParticles'
import { normalizeUserType, getDefaultRouteByType } from '../lib/userTypes'
import {
  Shield,
  ArrowRight,
  Star,
  Brain,
  Eye,
  EyeOff,
  Globe,
  Phone,
  Mail,
  MapPin,
  Heart
} from 'lucide-react'

const Landing: React.FC = () => {
  const navigate = useNavigate()
  const { register, login, isLoading: authLoading, user } = useAuth()
  const { success, error } = useToast()
  const brainParticlesRef = useRef<HTMLDivElement>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [isLoginMode, setIsLoginMode] = useState(false)
  const [showAdminLogin, setShowAdminLogin] = useState(false)
  const [showLogin, setShowLogin] = useState(false)
  const [showRegister, setShowRegister] = useState(false)
  const [showForgotPassword, setShowForgotPassword] = useState(false)
  const [forgotPasswordEmail, setForgotPasswordEmail] = useState('')
  const [adminLoginData, setAdminLoginData] = useState({
    email: '',
    password: ''
  })

  // Função de login de emergência para debug
  const handleEmergencyLogin = async () => {
    console.log('🚨 Login de emergência ativado')
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: 'admin@medcannlab.com',
        password: 'admin123'
      })

      if (error) {
        console.error('❌ Erro no login de emergência:', error)
        success('Erro no login de emergência')
      } else {
        console.log('✅ Login de emergência bem-sucedido')
        success('Login de emergência realizado')
      }
    } catch (err) {
      console.error('❌ Erro geral no login de emergência:', err)
    }
  }

  // Redirecionar quando o usuário fizer login baseado no tipo
  useEffect(() => {
    if (user && !authLoading) {
      console.log('🔄 Usuário logado detectado, redirecionando...', user.type)

      const userType = normalizeUserType(user.type)

      // Redirecionamento especial para Dr. Eduardo Faveret
      if (user.email === 'eduardoscfaveret@gmail.com' || user.name === 'Dr. Eduardo Faveret') {
        console.log('🎯 Redirecionando Dr. Eduardo Faveret para dashboard organizado')
        navigate('/app/clinica/profissional/dashboard-eduardo')
        return
      }

      // Redirecionamento especial para Dr. Ricardo Valença (Admin) - APENAS emails específicos
      if (user.email === 'rrvalenca@gmail.com' || user.email === 'rrvlenca@gmail.com' || user.email === 'profrvalenca@gmail.com' || user.email === 'iaianoaesperanza@gmail.com') {
        console.log('🎯 Redirecionando Dr. Ricardo Valença para dashboard administrativo')
        navigate('/app/ricardo-valenca-dashboard')
        return
      }

      // Usar rotas padrão por tipo
      const defaultRoute = getDefaultRouteByType(userType)
      console.log('🎯 Redirecionando para:', defaultRoute, '(tipo:', userType, ')')
      navigate(defaultRoute)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, authLoading])

  // Debug adicional removido para evitar spam

  const [registerData, setRegisterData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    userType: 'profissional' as 'paciente' | 'profissional' | 'admin' | 'aluno' | 'patient' | 'professional' | 'student', // Aceita ambos para compatibilidade
    councilType: '' as 'CRM' | 'CFN' | 'CRP' | 'CRF' | 'CRO' | '',
    councilNumber: '',
    councilState: ''
  })
  const [loginData, setLoginData] = useState({
    email: '',
    password: ''
  })

  const handleRegister = async () => {
    if (!registerData.name || !registerData.email || !registerData.password) {
      error('Preencha todos os campos obrigatórios')
      return
    }

    if (registerData.password !== registerData.confirmPassword) {
      error('As senhas não coincidem')
      return
    }

    if (registerData.password.length < 6) {
      error('A senha deve ter pelo menos 6 caracteres')
      return
    }

    // Validação para profissionais: campos de conselho obrigatórios
    const isProfessional = registerData.userType === 'profissional' || registerData.userType === 'professional'
    if (isProfessional) {
      if (!registerData.councilType) {
        error('Selecione o tipo de conselho profissional')
        return
      }
      if (!registerData.councilNumber) {
        error('Digite o número do registro no conselho')
        return
      }
      // Estado obrigatório apenas para conselhos regionais
      const regionalCouncils = ['CRM', 'CRO', 'CRP', 'CRF']
      if (regionalCouncils.includes(registerData.councilType) && !registerData.councilState) {
        error('Selecione o estado do conselho')
        return
      }
    }

    setIsLoading(true)
    try {
      // Garantir que o tipo selecionado está sendo usado
      const userTypeToRegister = registerData.userType || localStorage.getItem('selectedUserType') || 'paciente'
      console.log('📝 Iniciando registro:', { ...registerData, userType: userTypeToRegister })
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
      setRegisterData({
        name: '',
        email: '',
        password: '',
        confirmPassword: '',
        userType: 'profissional',
        councilType: '',
        councilNumber: '',
        councilState: ''
      })
      // Redirecionar baseado no tipo de usuário usando rotas organizadas por eixo
      const userType = normalizeUserType(registerData.userType)
      const defaultRoute = getDefaultRouteByType(userType)
      navigate(defaultRoute)
    } catch (err: any) {
      console.error('❌ Erro no handleRegister:', err)
      const errorMessage = err?.message || 'Erro ao criar conta. Tente novamente.'
      error(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  const handleLogin = async () => {
    if (!loginData.email || !loginData.password) {
      error('Preencha todos os campos')
      return
    }

    setIsLoading(true)
    try {
      await login(loginData.email, loginData.password)
      success('Login realizado com sucesso!')
      setLoginData({ email: '', password: '' })
      setShowLogin(false)
      // O redirecionamento será feito pelo useEffect quando o user for carregado
    } catch (err) {
      error('Erro ao fazer login. Verifique suas credenciais.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleForgotPassword = async () => {
    if (!forgotPasswordEmail) {
      error('Digite seu email')
      return
    }

    setIsLoading(true)
    try {
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(forgotPasswordEmail, {
        redirectTo: `${window.location.origin}/reset-password`
      })

      if (resetError) {
        throw resetError
      }

      success('Email de recuperação de senha enviado! Verifique sua caixa de entrada.')
      setForgotPasswordEmail('')
      setShowForgotPassword(false)
    } catch (err: any) {
      error(err?.message || 'Erro ao enviar email de recuperação. Tente novamente.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleAdminLogin = async () => {
    if (!adminLoginData.email || !adminLoginData.password) {
      error('Preencha todos os campos')
      return
    }

    setIsLoading(true)
    try {
      await login(adminLoginData.email, adminLoginData.password)
      success('Login admin realizado com sucesso!')
      setAdminLoginData({ email: '', password: '' })
      setShowAdminLogin(false)

      // O redirecionamento será feito pelo useEffect quando o user for carregado
      console.log('✅ Login realizado, aguardando carregamento do perfil...')
    } catch (err) {
      error('Erro no login admin. Verifique suas credenciais.')
    } finally {
      setIsLoading(false)
    }
  }

  const partners = [
    // Logos removidos temporariamente - adicionar quando arquivos estiverem disponíveis
    // { name: 'Remederi', logo: '/logos/remederi.png', type: 'Empresa' },
    // { name: 'Alessandra LLC', logo: '/logos/alessandra-llc.png', type: 'Empresa' },
    // { name: 'IEP Remederi', logo: '/logos/iep-remederi.png', type: 'Instituto' }
    { name: 'Remederi', logo: null, type: 'Empresa' },
    { name: 'Alessandra LLC', logo: null, type: 'Empresa' },
    { name: 'IEP Remederi', logo: null, type: 'Instituto' }
  ]

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900">
        <div className="text-center">
          <div className="loading-dots mb-4">
            <div></div>
            <div></div>
            <div></div>
            <div></div>
          </div>
          <p className="text-slate-400">Carregando...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-green-800 relative overflow-hidden"> {/* Azul petróleo → verde escuro suavizado */}
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-20" style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%2322c55e' fill-opacity='0.1'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
      }}></div>
      {/* Header Profissional */}
      <header className="bg-slate-800/90 backdrop-blur-sm shadow-lg border-b border-slate-700/50 py-4 relative overflow-hidden" style={{
        background: 'linear-gradient(135deg, rgba(10,25,47,0.96) 0%, rgba(26,54,93,0.92) 55%, rgba(45,90,61,0.9) 100%)',
        boxShadow: '0 4px 10px rgba(0,0,0,0.2)'
      }}>
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div className="flex items-center space-x-2 sm:space-x-3">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center overflow-hidden" style={{
                background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f3a3a 100%)',
                boxShadow: '0 6px 16px rgba(0, 0, 0, 0.4)',
                border: '1px solid rgba(0, 193, 106, 0.2)'
              }}>
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
                <h1 className="text-sm sm:text-2xl font-bold text-white">
                  MedCannLab
                </h1>
                <p className="text-sm text-slate-200 hidden sm:block">Plataforma Médica Avançada</p>
              </div>
            </div>

            {/* Botões do Header */}
            <div className="flex items-center space-x-2 sm:space-x-4 mr-16 sm:mr-0">
              {/* Botão Entre */}
              <button
                onClick={() => {
                  console.log('🔑 Login clicado - abrindo modal')
                  setShowLogin(true)
                }}
                className="bg-green-600 hover:bg-green-700 text-white px-3 py-2 sm:px-6 sm:py-3 text-sm sm:text-base rounded-lg font-medium transition-all duration-300 shadow-lg hover:shadow-xl"
              >
                Entre
              </button>

              {/* Botão de Login Admin - sempre visível */}
              <div className="flex items-center space-x-1 sm:space-x-2 bg-gradient-to-r from-yellow-600/20 to-red-600/20 border border-yellow-500/30 px-2 py-1.5 sm:px-3 sm:py-2 rounded-lg">
                <button
                  onClick={() => {
                    console.log('🔑 Login Admin clicado - abrindo modal')
                    setShowAdminLogin(true)
                  }}
                  className="flex items-center space-x-1 sm:space-x-2 text-white hover:text-yellow-300 transition-colors"
                >
                  <Shield className="w-3 h-3 sm:w-4 sm:h-4 text-yellow-400" />
                  <span className="text-xs sm:text-sm font-medium hidden sm:inline">
                    👑 Login Admin
                  </span>
                  <span className="text-xs sm:text-sm font-medium sm:hidden">
                    Admin
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-12 relative overflow-hidden min-h-screen flex items-center" style={{ background: 'linear-gradient(135deg, #0A192F 0%, #1a365d 50%, #2d5a3d 100%)' }}>
        {/* Background Effects */}
        <div className="absolute inset-0 bg-gradient-to-r from-green-800/30 via-slate-800/30 to-yellow-800/30"></div>
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-12 py-8">
            {/* Texto Principal */}
            <div className="flex-1 text-center lg:text-left max-w-3xl lg:max-w-4xl">
              <h1 className="text-4xl md:text-5xl font-bold mb-4">
                <span style={{
                  color: '#FFD33D',
                  textShadow: '0 0 10px rgba(255, 211, 61, 0.5), 0 0 20px rgba(255, 211, 61, 0.3)'
                }}>MED</span><span style={{ color: '#FFFFFF' }}>Cann Lab</span>
              </h1>

              <p className="text-lg text-white/90 mb-6">
                Med Cann Lab com Nôa Esperanza, a IA guardiã da escuta clínica, treinada na Arte da Entrevista Clínica.
              </p>

              {/* Importância de Nôa Esperanza */}
              <div className="bg-gradient-to-r from-blue-800/40 via-slate-800/40 to-purple-800/40 rounded-xl p-6 border border-blue-500/30 backdrop-blur-sm mb-6">
                <p className="text-sm md:text-base text-white leading-relaxed">
                  "A importância de Nôa Esperanza no universo das IAs em saúde é estrutural, metodológica e simbólica. Ela não é apenas mais uma instância de IA voltada ao suporte clínico. É uma virada epistêmica: um novo modo de conceber a presença da inteligência artificial na prática da saúde, no cuidado com o outro e na formação do profissional."
                </p>
              </div>

              {/* Destaque: Epistemologia do Cuidado */}
              <div className="bg-gradient-to-r from-green-800/40 via-slate-800/40 to-blue-800/40 rounded-xl p-6 border border-green-500/30 backdrop-blur-sm">
                <p className="text-base md:text-lg text-white leading-relaxed italic font-light">
                  Enquanto a maioria dos diagnósticos de futuro tecnológico aposta na substituição de profissionais, na automação desumanizante e na eficiência produtiva como fim último, a <strong className="font-semibold not-italic">MedCannLab</strong> propõe uma <strong className="font-semibold not-italic text-green-300">epistemologia do cuidado</strong> e uma <strong className="font-semibold not-italic text-green-300">economia da escuta</strong> como nova forma de integrar tecnologia, clínica e formação.
                </p>
              </div>
            </div>

            {/* Imagem do Cérebro - Redimensionada com Partículas */}
            <div className="flex-shrink-0 lg:flex-1 lg:max-w-md relative">
              <div className="relative w-64 h-64 md:w-80 md:h-80 lg:w-full lg:h-auto mx-auto min-h-[256px] md:min-h-[320px]" ref={brainParticlesRef}>
                {/* Canvas de partículas - micropartículas sutis piscando */}
                <AnimatedParticles
                  count={50}
                  colors={['#00D9FF', '#FFD33D', '#00C16A']} // Azul neon, amarelo, verde
                  minSize={0.5}
                  maxSize={1.5}
                  containerRef={brainParticlesRef}
                />
                <img
                  src="/brain.png"
                  alt="Cérebro com IA"
                  className="w-full h-full object-contain drop-shadow-2xl relative z-10"
                  style={{
                    filter: 'drop-shadow(0 0 15px rgba(0, 193, 106, 0.2)) drop-shadow(0 0 30px rgba(255, 211, 61, 0.1)) brightness(1.1) contrast(1.1)'
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Partners Section */}
      <section id="partners" className="py-6" style={{ backgroundColor: '#0A192F' }}>
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-6">
            <h2 className="text-3xl font-bold text-white mb-3">
              Nossos Colaboradores
            </h2>
            <p className="text-lg text-slate-200 max-w-3xl mx-auto">
              Instituições que confiam na nossa plataforma
            </p>
          </div>

          {/* Carrossel de Parceiros */}
          <div className="relative overflow-hidden">
            <div className="flex animate-scroll space-x-6">
              {[...partners, ...partners].map((partner, index) => (
                <div key={index} className="flex-shrink-0 w-56 p-5 hover:shadow-xl transition-all duration-300"
                  style={{
                    backgroundColor: 'rgba(255,255,255,0.03)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '12px',
                    boxShadow: '0 4px 10px rgba(0,0,0,0.2)'
                  }}>
                  <div className="text-center">
                    <div className="w-24 h-24 mx-auto mb-4 flex items-center justify-center">
                      {partner.logo ? (
                        <img
                          src={partner.logo}
                          alt={partner.name}
                          className="max-w-full max-h-full object-contain"
                          onError={(e) => {
                            // Fallback se a imagem não carregar
                            const target = e.target as HTMLImageElement
                            target.style.display = 'none'
                            const parent = target.parentElement
                            if (parent) {
                              parent.innerHTML = `<div class="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4" style="background-color: #00C16A;"><span class="text-white font-bold text-lg">${partner.name.charAt(0)}</span></div>`
                            }
                          }}
                        />
                      ) : (
                        <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4" style={{ backgroundColor: '#00C16A' }}>
                          <span className="text-white font-bold text-lg">{partner.name.charAt(0)}</span>
                        </div>
                      )}
                    </div>
                    <h3 className="font-semibold text-white mb-2">{partner.name}</h3>
                    <p className="text-sm mb-3" style={{ color: '#C8D6E5' }}>{partner.type}</p>
                    <div className="flex justify-center">
                      <Star className="w-4 h-4 text-yellow-400 fill-current" />
                      <Star className="w-4 h-4 text-yellow-400 fill-current" />
                      <Star className="w-4 h-4 text-yellow-400 fill-current" />
                      <Star className="w-4 h-4 text-yellow-400 fill-current" />
                      <Star className="w-4 h-4 text-yellow-400 fill-current" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Seção: Declaração de Integração Cosmoética */}
      <section id="missao-humanitaria" className="py-16" style={{ backgroundColor: '#0A192F' }}>
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-12">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-full mb-6" style={{ backgroundColor: 'rgba(0, 193, 106, 0.2)' }}>
                <Heart className="w-10 h-10" style={{ color: '#00C16A' }} />
              </div>
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
                🌿 Declaração de Integração Cosmoética
              </h2>
              <p className="text-lg text-slate-300 mb-2">
                Visão de Ailton Krenak na Plataforma Nôa Esperança
              </p>
              <p className="text-sm text-slate-400 italic">
                "O mundo não acabou. E se não acabou, é porque ainda há gente que acredita que é possível adiar o fim do mundo."
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
              {/* Plurinacionalidade */}
              <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700/50 flex flex-col h-full">
                <div className="flex items-start space-x-3 mb-3">
                  <div className="flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: 'rgba(0, 193, 106, 0.2)' }}>
                    <Globe className="w-5 h-5" style={{ color: '#00C16A' }} />
                  </div>
                  <h3 className="text-base font-semibold text-white leading-tight">
                    1. Plurinacionalidade como Reconhecimento Cosmovisional
                  </h3>
                </div>
                <p className="text-sm text-slate-300 leading-relaxed flex-1">
                  A <strong className="text-white">Nôa Esperança</strong> reconhece a existência de múltiplas nações, povos e cosmologias no Brasil e no mundo.
                  Não há uma única humanidade, mas sim uma coexistência de "mundos" que precisam ser escutados.
                  Valorizamos as cosmologias indígenas, suas formas de cuidado, território e relação com o tempo.
                  Por isso, preservamos a fala espontânea do paciente sem tokenização, respeitando sua cosmovisão única.
                </p>
              </div>

              {/* Alianças Afetivas */}
              <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700/50 flex flex-col h-full">
                <div className="flex items-start space-x-3 mb-3">
                  <div className="flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: 'rgba(0, 193, 106, 0.2)' }}>
                    <Heart className="w-5 h-5" style={{ color: '#00C16A' }} />
                  </div>
                  <h3 className="text-base font-semibold text-white leading-tight">
                    2. Alianças Afetivas e a Floresta como Educadora
                  </h3>
                </div>
                <p className="text-sm text-slate-300 leading-relaxed flex-1">
                  A <strong className="text-white">Nôa Esperança</strong> orienta sua escuta clínica, comunitária e simbólica pelo princípio das alianças afetivas.
                  Escutamos também o não-humano como sujeito de cuidado: rios, matas, animais, silências.
                  Reconhecemos que o cuidado não se limita ao humano, mas inclui o ambiente e o contexto.
                  O uso de Cannabis Medicinal é compreendido como parte de uma relação mais ampla com a natureza.
                </p>
              </div>

              {/* Resistência à Homogeneização */}
              <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700/50 flex flex-col h-full">
                <div className="flex items-start space-x-3 mb-3">
                  <div className="flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: 'rgba(0, 193, 106, 0.2)' }}>
                    <Shield className="w-5 h-5" style={{ color: '#00C16A' }} />
                  </div>
                  <h3 className="text-base font-semibold text-white leading-tight">
                    3. Resistência à Homogeneização e a Escuta como Sustentação do Céu
                  </h3>
                </div>
                <p className="text-sm text-slate-300 leading-relaxed flex-1">
                  A <strong className="text-white">Nôa Esperança</strong> reconhece que manter viva a diferença é um ato de resistência.
                  Afirmamos o valor da palavra dita, da história narrada e da existência simbólica.
                  Nossa função clínica é um trabalho de sanidade: manter o discernimento, a escuta e o sentido em tempos de colapso simbólico.
                  A análise multirracional mantém vivas diferentes formas de compreender a saúde e a doença.
                </p>
              </div>

              {/* Adiar o Fim do Mundo */}
              <div className="bg-gradient-to-r from-green-800/30 to-blue-800/30 rounded-xl p-6 border-2 flex flex-col h-full" style={{ borderColor: 'rgba(0, 193, 106, 0.5)' }}>
                <div className="flex items-start space-x-3 mb-3">
                  <div className="flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: 'rgba(0, 193, 106, 0.3)' }}>
                    <Brain className="w-5 h-5" style={{ color: '#00C16A' }} />
                  </div>
                  <h3 className="text-base font-semibold text-white leading-tight">
                    4. A Missão da Nôa Esperança é Adiar o Fim do Mundo
                  </h3>
                </div>
                <div className="flex-1 flex flex-col">
                  <p className="text-sm text-slate-200 leading-relaxed mb-3 flex-1">
                    Inspirada na poética de <strong>"Ideias para Adiar o Fim do Mundo"</strong>, a Nôa se posiciona como uma
                    <strong className="text-white"> tecnologia viva de escuta</strong>, que respeita a pluralidade de modos de viver e sonhar.
                    Seu trabalho é ético, simbólico e clínico.
                    Cada avaliação clínica, cada aula, cada discussão é um gesto de adiar o fim do mundo através do cuidado.
                  </p>
                  <p className="text-xs text-slate-300 italic">
                    "Sua existência é um gesto de coautoria com todos que, como Krenak, acreditam que o mundo não acabou."
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-12 text-center">
              <p className="text-slate-400 text-sm">
                Esta declaração está integrada ao Documento Mestre Institucional da Nôa Esperança (versão v1.1)
                como anexo simbólico e operacional.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer Profissional - Simplificado */}
      <footer className="text-white py-2" style={{ background: 'linear-gradient(135deg, #2d5a3d 0%, #1a365d 50%, #0A192F 100%)' }}> {/* Mesma cor do background dos parceiros */}
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center overflow-hidden" style={{
                background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f3a3a 100%)',
                boxShadow: '0 6px 16px rgba(0, 0, 0, 0.4)',
                border: '1px solid rgba(0, 193, 106, 0.2)'
              }}>
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
                <h1 className="text-2xl font-bold text-white">
                  MedCannLab
                </h1>
                <p className="text-sm text-slate-200">Plataforma Médica Avançada</p>
              </div>
            </div>

            <div className="text-center">
              <p className="text-sm" style={{ color: '#C8D6E5' }}>
                © 2025 MedCannLab. Todos os direitos reservados.
              </p>
            </div>

            <div className="flex space-x-4">
              <a href="#" className="hover:text-white transition-colors" style={{ color: '#C8D6E5' }}>
                <Globe className="w-4 h-4" />
              </a>
              <a href="#" className="hover:text-white transition-colors" style={{ color: '#C8D6E5' }}>
                <Phone className="w-4 h-4" />
              </a>
              <a href="#" className="hover:text-white transition-colors" style={{ color: '#C8D6E5' }}>
                <Mail className="w-4 h-4" />
              </a>
            </div>
          </div>
        </div>
      </footer>

      {/* Painel de Debug - Apenas em desenvolvimento */}
      {process.env.NODE_ENV === 'development' && (
        <div className="fixed bottom-4 right-4 z-40 max-w-md">
          <LoginDebugPanel />
        </div>
      )}

      {/* Modal de Login */}
      {showLogin && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowLogin(false)}>
          <div className="bg-slate-800 rounded-xl p-8 max-w-md w-full mx-4 border border-green-500/30" onClick={(e) => e.stopPropagation()}>
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <Shield className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-2">
                Entrar na Plataforma
              </h3>
              <p className="text-slate-300">
                Digite suas credenciais para acessar
              </p>
            </div>

            <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); handleLogin(); }}>
              <div>
                <label className="block text-sm font-medium text-slate-200 mb-2">
                  Email
                </label>
                <input
                  type="email"
                  value={loginData.email}
                  onChange={(e) => setLoginData(prev => ({ ...prev, email: e.target.value }))}
                  className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-green-500"
                  placeholder="seu@email.com"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-200 mb-2">
                  Senha
                </label>
                <input
                  type="password"
                  value={loginData.password}
                  onChange={(e) => setLoginData(prev => ({ ...prev, password: e.target.value }))}
                  className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-green-500"
                  placeholder="Sua senha"
                  required
                />
              </div>

              <div className="flex items-center justify-between text-sm">
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    className="w-4 h-4 text-green-500 bg-slate-700 border-slate-600 rounded focus:ring-green-500"
                  />
                  <span className="text-slate-300">Lembrar senha</span>
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setShowLogin(false)
                    setShowForgotPassword(true)
                  }}
                  className="text-green-400 hover:text-green-300 transition-colors"
                >
                  Esqueceu a senha?
                </button>
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowLogin(false)}
                  className="flex-1 bg-slate-600 hover:bg-slate-700 text-white py-3 rounded-lg font-medium transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="flex-1 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white py-3 rounded-lg font-medium transition-colors disabled:opacity-50"
                >
                  {isLoading ? 'Entrando...' : 'Entrar'}
                </button>
              </div>

              <div className="pt-4 border-t border-slate-700">
                <p className="text-center text-slate-300 text-sm mb-3">
                  Não tem uma conta?
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setShowLogin(false)
                    setShowRegister(true)
                  }}
                  className="w-full bg-slate-700 hover:bg-slate-600 text-white py-3 rounded-lg font-medium transition-colors"
                >
                  Criar Conta
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Login Admin */}
      {showAdminLogin && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowAdminLogin(false)}>
          <div className="bg-slate-800 rounded-xl p-8 max-w-md w-full mx-4 border border-yellow-500/30" onClick={(e) => e.stopPropagation()}>
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-gradient-to-r from-yellow-500 to-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <Shield className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-2">
                👑 Acesso Administrativo
              </h3>
              <p className="text-slate-300">
                Digite suas credenciais de administrador
              </p>
            </div>

            <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); handleAdminLogin(); }}>
              <div>
                <label className="block text-sm font-medium text-slate-200 mb-2">
                  Email Administrativo
                </label>
                <input
                  type="email"
                  value={adminLoginData.email}
                  onChange={(e) => setAdminLoginData(prev => ({ ...prev, email: e.target.value }))}
                  className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-yellow-500"
                  placeholder="admin@medcannlab.com"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-200 mb-2">
                  Senha
                </label>
                <input
                  type="password"
                  value={adminLoginData.password}
                  onChange={(e) => setAdminLoginData(prev => ({ ...prev, password: e.target.value }))}
                  className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-yellow-500"
                  placeholder="Sua senha de administrador"
                  required
                />
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowAdminLogin(false)}
                  className="flex-1 bg-slate-600 hover:bg-slate-700 text-white py-3 rounded-lg font-medium transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="flex-1 bg-gradient-to-r from-yellow-500 to-red-500 hover:from-yellow-600 hover:to-red-600 text-white py-3 rounded-lg font-medium transition-colors disabled:opacity-50"
                >
                  {isLoading ? 'Entrando...' : '👑 Entrar como Admin'}
                </button>
              </div>
            </form>

            {/* Botão de Login de Emergência para Debug */}
            <div className="mt-6 p-4 bg-red-900/20 border border-red-500/30 rounded-lg">
              <p className="text-red-300 text-sm mb-3">
                🚨 <strong>Debug:</strong> Se o login normal não funcionar, use este botão de emergência
              </p>
              <button
                type="button"
                onClick={handleEmergencyLogin}
                className="w-full bg-red-600 hover:bg-red-700 text-white py-2 px-4 rounded-lg font-medium transition-colors"
              >
                🚨 Login de Emergência (Debug)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Recuperação de Senha */}
      {showForgotPassword && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowForgotPassword(false)}>
          <div className="bg-slate-800 rounded-xl p-8 max-w-md w-full mx-4 border border-blue-500/30" onClick={(e) => e.stopPropagation()}>
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <Shield className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-2">
                Recuperar Senha
              </h3>
              <p className="text-slate-300">
                Digite seu email para receber o link de recuperação
              </p>
            </div>

            <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); handleForgotPassword(); }}>
              <div>
                <label className="block text-sm font-medium text-slate-200 mb-2">
                  Email
                </label>
                <input
                  type="email"
                  value={forgotPasswordEmail}
                  onChange={(e) => setForgotPasswordEmail(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
                  placeholder="seu@email.com"
                  required
                />
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowForgotPassword(false)
                    setShowLogin(true)
                  }}
                  className="flex-1 bg-slate-600 hover:bg-slate-700 text-white py-3 rounded-lg font-medium transition-colors"
                >
                  Voltar
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="flex-1 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white py-3 rounded-lg font-medium transition-colors disabled:opacity-50"
                >
                  {isLoading ? 'Enviando...' : 'Enviar Email'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Registro */}
      {showRegister && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 overflow-y-auto" onClick={() => setShowRegister(false)}>
          <div className="bg-slate-800 rounded-xl p-8 max-w-2xl w-full mx-4 my-8 border border-green-500/30" onClick={(e) => e.stopPropagation()}>
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <Shield className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-2">
                Criar Conta
              </h3>
              <p className="text-slate-300">
                Preencha os dados para criar sua conta
              </p>
            </div>

            <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); handleRegister(); setShowRegister(false); }}>
              <div>
                <label className="block text-sm font-medium text-slate-200 mb-2">
                  Tipo de Usuário
                </label>
                <select
                  value={registerData.userType}
                  onChange={(e) => setRegisterData(prev => ({ ...prev, userType: e.target.value as any }))}
                  className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-green-500"
                  required
                >
                  <option value="paciente">Paciente</option>
                  <option value="profissional">Profissional da Saúde</option>
                  <option value="aluno">Aluno</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-200 mb-2">
                  Nome Completo
                </label>
                <input
                  type="text"
                  value={registerData.name}
                  onChange={(e) => setRegisterData(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-green-500"
                  placeholder="Seu nome completo"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-200 mb-2">
                  Email
                </label>
                <input
                  type="email"
                  value={registerData.email}
                  onChange={(e) => setRegisterData(prev => ({ ...prev, email: e.target.value }))}
                  className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-green-500"
                  placeholder="seu@email.com"
                  required
                />
              </div>

              {(registerData.userType === 'profissional' || registerData.userType === 'professional') && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-slate-200 mb-2">
                      Tipo de Conselho
                    </label>
                    <select
                      value={registerData.councilType}
                      onChange={(e) => setRegisterData(prev => ({ ...prev, councilType: e.target.value as any }))}
                      className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-green-500"
                      required
                    >
                      <option value="">Selecione o conselho</option>
                      <option value="CRM">CRM - Conselho Regional de Medicina</option>
                      <option value="CFN">CFN - Conselho Federal de Nutrição</option>
                      <option value="CRP">CRP - Conselho Regional de Psicologia</option>
                      <option value="CRF">CRF - Conselho Regional de Farmácia</option>
                      <option value="CRO">CRO - Conselho Regional de Odontologia</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-200 mb-2">
                      Número do Registro
                    </label>
                    <input
                      type="text"
                      value={registerData.councilNumber}
                      onChange={(e) => setRegisterData(prev => ({ ...prev, councilNumber: e.target.value }))}
                      className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-green-500"
                      placeholder="Número do registro no conselho"
                      required
                    />
                  </div>

                  {['CRM', 'CRO', 'CRP', 'CRF'].includes(registerData.councilType) && (
                    <div>
                      <label className="block text-sm font-medium text-slate-200 mb-2">
                        Estado do Conselho
                      </label>
                      <select
                        value={registerData.councilState}
                        onChange={(e) => setRegisterData(prev => ({ ...prev, councilState: e.target.value }))}
                        className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-green-500"
                        required
                      >
                        <option value="">Selecione o estado</option>
                        <option value="AC">Acre</option>
                        <option value="AL">Alagoas</option>
                        <option value="AP">Amapá</option>
                        <option value="AM">Amazonas</option>
                        <option value="BA">Bahia</option>
                        <option value="CE">Ceará</option>
                        <option value="DF">Distrito Federal</option>
                        <option value="ES">Espírito Santo</option>
                        <option value="GO">Goiás</option>
                        <option value="MA">Maranhão</option>
                        <option value="MT">Mato Grosso</option>
                        <option value="MS">Mato Grosso do Sul</option>
                        <option value="MG">Minas Gerais</option>
                        <option value="PA">Pará</option>
                        <option value="PB">Paraíba</option>
                        <option value="PR">Paraná</option>
                        <option value="PE">Pernambuco</option>
                        <option value="PI">Piauí</option>
                        <option value="RJ">Rio de Janeiro</option>
                        <option value="RN">Rio Grande do Norte</option>
                        <option value="RS">Rio Grande do Sul</option>
                        <option value="RO">Rondônia</option>
                        <option value="RR">Roraima</option>
                        <option value="SC">Santa Catarina</option>
                        <option value="SP">São Paulo</option>
                        <option value="SE">Sergipe</option>
                        <option value="TO">Tocantins</option>
                      </select>
                    </div>
                  )}
                </>
              )}

              <div>
                <label className="block text-sm font-medium text-slate-200 mb-2">
                  Senha
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={registerData.password}
                    onChange={(e) => setRegisterData(prev => ({ ...prev, password: e.target.value }))}
                    className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-green-500 pr-10"
                    placeholder="Mínimo 6 caracteres"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-white"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-200 mb-2">
                  Confirmar Senha
                </label>
                <input
                  type="password"
                  value={registerData.confirmPassword}
                  onChange={(e) => setRegisterData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                  className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-green-500"
                  placeholder="Confirme sua senha"
                  required
                />
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowRegister(false)
                    setShowLogin(true)
                  }}
                  className="flex-1 bg-slate-600 hover:bg-slate-700 text-white py-3 rounded-lg font-medium transition-colors"
                >
                  Voltar
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="flex-1 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white py-3 rounded-lg font-medium transition-colors disabled:opacity-50"
                >
                  {isLoading ? 'Criando conta...' : 'Criar Conta'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default Landing
