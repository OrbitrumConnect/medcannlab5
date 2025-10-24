import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useToast } from '../contexts/ToastContext'
import { 
  Stethoscope, 
  User, 
  GraduationCap, 
  Shield, 
  CheckCircle, 
  ArrowRight,
  Star,
  Brain,
  Eye,
  EyeOff,
  Globe,
  Phone,
  Mail,
  MapPin
} from 'lucide-react'

const Landing: React.FC = () => {
  const navigate = useNavigate()
  const { register, login, isLoading: authLoading } = useAuth()
  const { success, error } = useToast()
  const [activeProfile, setActiveProfile] = useState<'professional' | 'patient' | 'student' | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [isLoginMode, setIsLoginMode] = useState(false)
  const [registerData, setRegisterData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    userType: 'professional' as 'patient' | 'professional' | 'admin' | 'student'
  })
  const [loginData, setLoginData] = useState({
    email: '',
    password: ''
  })

  const handleRegister = async () => {
    if (registerData.password !== registerData.confirmPassword) {
      error('As senhas não coincidem')
      return
    }

    if (registerData.password.length < 6) {
      error('A senha deve ter pelo menos 6 caracteres')
      return
    }

    setIsLoading(true)
    try {
      await register(registerData.email, registerData.password, registerData.name, registerData.userType)
      success('Conta criada com sucesso!')
      setRegisterData({
        name: '',
        email: '',
        password: '',
        confirmPassword: '',
        userType: 'professional'
      })
      // Redirecionar baseado no tipo de usuário
      if (registerData.userType === 'admin') {
        navigate('/admin')
      } else {
        navigate('/home')
      }
    } catch (err) {
      error('Erro ao criar conta. Tente novamente.')
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
      // Redirecionar para home após login
      navigate('/home')
    } catch (err) {
      error('Erro ao fazer login. Verifique suas credenciais.')
    } finally {
      setIsLoading(false)
    }
  }

  const profiles = [
    {
      id: 'professional',
      title: 'Profissional da Saúde',
      subtitle: 'CRM, CRO, Enfermeiros',
      icon: <Stethoscope className="w-8 h-8" />,
      color: 'from-primary-500 to-primary-600',
      features: [
        'Avaliação Clínica IMRE',
        'Gestão de Pacientes',
        'Relatórios Avançados',
        'Integração com IA Nôa'
      ]
    },
    {
      id: 'patient',
      title: 'Paciente',
      subtitle: 'Cuidado Personalizado',
      icon: <User className="w-8 h-8" />,
      color: 'from-green-500 to-green-600',
      features: [
        'Pré-Anamnese Digital',
        'Histórico Clínico',
        'Relatórios Pessoais',
        'Acompanhamento Médico'
      ]
    },
    {
      id: 'student',
      title: 'Estudante',
      subtitle: 'Formação Médica',
      icon: <GraduationCap className="w-8 h-8" />,
      color: 'from-purple-500 to-purple-600',
      features: [
        'Cursos Especializados',
        'Certificações',
        'Casos Clínicos',
        'Metodologia AEC'
      ]
    }
  ]

  const partners = [
    { name: 'Hospital São Paulo', logo: '/api/placeholder/120/60', type: 'Hospital' },
    { name: 'Clínica MedCann', logo: '/api/placeholder/120/60', type: 'Clínica' },
    { name: 'Universidade Federal', logo: '/api/placeholder/120/60', type: 'Universidade' },
    { name: 'Instituto de Pesquisa', logo: '/api/placeholder/120/60', type: 'Pesquisa' }
  ]

  const stats = [
    { number: '2.5K+', label: 'Profissionais Ativos' },
    { number: '15K+', label: 'Pacientes Atendidos' },
    { number: '240+', label: 'Artigos Científicos' },
    { number: '99.9%', label: 'Satisfação' }
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
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-primary-900 to-slate-800 relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-20" style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%2322c55e' fill-opacity='0.1'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
      }}></div>
      {/* Header Profissional */}
      <header className="bg-slate-800/90 backdrop-blur-sm shadow-lg border-b border-slate-700/50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            {/* Logo */}
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-gradient-to-r from-primary-600 to-accent-500 rounded-xl flex items-center justify-center">
                <span className="text-white font-bold text-xl">M</span>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">
                  MedCannLab
                </h1>
                <p className="text-sm text-slate-200">Plataforma Médica Avançada</p>
              </div>
            </div>

            {/* Navigation */}
            <nav className="hidden md:flex space-x-8">
              <a href="#features" className="text-slate-200 hover:text-primary-300 font-medium transition-colors">Recursos</a>
              <a href="#partners" className="text-slate-200 hover:text-primary-300 font-medium transition-colors">Parceiros</a>
              <a href="#about" className="text-slate-200 hover:text-primary-300 font-medium transition-colors">Sobre</a>
              <a href="#contact" className="text-slate-200 hover:text-primary-300 font-medium transition-colors">Contato</a>
            </nav>

            {/* CTA */}
            <div className="flex items-center space-x-4">
              <button
                onClick={() => {
                  // Scroll para a seção de perfis
                  document.getElementById('profiles')?.scrollIntoView({ behavior: 'smooth' })
                }}
                className="bg-gradient-to-r from-primary-600 to-accent-500 hover:from-primary-700 hover:to-accent-600 text-white px-6 py-3 rounded-lg font-medium transition-all duration-300 shadow-lg hover:shadow-xl"
              >
                Começar Agora
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 bg-gradient-to-br from-slate-800 via-primary-800 to-slate-700 relative overflow-hidden">
        {/* Background Effects */}
        <div className="absolute inset-0 bg-gradient-to-r from-primary-900/30 via-slate-800/30 to-slate-900/30"></div>
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center max-w-4xl mx-auto">
            <h1 className="text-5xl md:text-6xl font-bold text-white mb-6">
              Medicina do <span className="text-yellow-300">Futuro</span>
              <br />Hoje
            </h1>
            <p className="text-xl text-white/90 mb-8 max-w-2xl mx-auto">
              Plataforma médica completa com IA, avaliação clínica avançada e 
              metodologia AEC para profissionais e pacientes.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
              <button
                onClick={() => {
                  // Scroll para a seção de perfis
                  document.getElementById('profiles')?.scrollIntoView({ behavior: 'smooth' })
                }}
                className="bg-gradient-to-r from-primary-600 to-accent-500 hover:from-primary-700 hover:to-accent-600 text-white px-8 py-4 rounded-xl font-semibold text-lg transition-all duration-300 inline-flex items-center justify-center shadow-xl hover:shadow-2xl"
              >
                Começar Gratuitamente
                <ArrowRight className="w-5 h-5 ml-2" />
              </button>
              <button className="border-2 border-slate-200 text-slate-200 hover:bg-slate-700/50 hover:text-white backdrop-blur-sm px-8 py-4 rounded-xl font-semibold text-lg transition-all duration-300">
                Ver Demonstração
              </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              {stats.map((stat, index) => (
                <div key={index} className="text-center bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-slate-700/50">
                  <div className="text-3xl font-bold text-primary-400 mb-2">{stat.number}</div>
                  <div className="text-slate-200">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Profile Selection */}
      <section id="profiles" className="py-20 bg-slate-900">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-white mb-4">
              Escolha seu Perfil
            </h2>
            <p className="text-xl text-slate-200 max-w-3xl mx-auto mb-4">
              Acesse funcionalidades personalizadas para seu tipo de usuário
            </p>
            <p className="text-sm text-slate-300">
              Clique em um perfil abaixo para começar seu cadastro
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
            {profiles.map((profile) => (
              <div
                key={profile.id}
                onClick={() => {
                  setActiveProfile(profile.id as any)
                  setRegisterData(prev => ({ ...prev, userType: profile.id as any }))
                }}
                className={`p-8 rounded-2xl border-2 cursor-pointer transition-all duration-300 group ${
                  activeProfile === profile.id
                    ? 'border-primary-500 bg-slate-800 shadow-2xl scale-105'
                    : 'border-slate-700 bg-slate-800/50 backdrop-blur-sm hover:border-primary-400 hover:shadow-xl hover:scale-102'
                }`}
              >
                <div className="text-center">
                  <div className={`w-16 h-16 bg-gradient-to-r ${profile.color} rounded-xl flex items-center justify-center text-white mx-auto mb-4 relative`}>
                    {profile.icon}
                    {activeProfile === profile.id && (
                      <div className="absolute -top-2 -right-2 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                        <CheckCircle className="w-4 h-4 text-white" />
                      </div>
                    )}
                  </div>
                  <h3 className="text-xl font-semibold text-white mb-2">
                    {profile.title}
                  </h3>
                  <p className="text-slate-300 mb-6">{profile.subtitle}</p>
                  <ul className="space-y-2 text-left">
                    {profile.features.map((feature, index) => (
                      <li key={index} className="flex items-center text-slate-200">
                        <CheckCircle className="w-4 h-4 text-green-400 mr-2" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>

          {/* Card de Cadastro */}
          {activeProfile && (
            <div className="max-w-md mx-auto mt-12">
              <div className="bg-slate-800 rounded-2xl shadow-xl border border-slate-700 p-8">
                <div className="text-center mb-6">
                  <h3 className="text-2xl font-bold text-white mb-2">
                    {isLoginMode ? 'Entrar' : profiles.find(p => p.id === activeProfile)?.title}
                  </h3>
                  <p className="text-slate-300">
                    {isLoginMode ? 'Faça login em sua conta' : 'Preencha os dados para criar sua conta'}
                  </p>
                </div>

                <form className="space-y-4 pointer-events-auto relative z-10" onClick={(e) => e.stopPropagation()}>
                  {!isLoginMode && (
                    <div className="pointer-events-auto">
                      <label className="block text-sm font-medium text-slate-200 mb-2">
                        Nome Completo
                      </label>
                      <input
                        type="text"
                        value={registerData.name}
                        onChange={(e) => setRegisterData(prev => ({ ...prev, name: e.target.value }))}
                        onClick={(e) => e.stopPropagation()}
                        className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:border-primary-500 focus:outline-none relative z-20"
                        placeholder="Seu nome completo"
                      />
                    </div>
                  )}

                  <div className="pointer-events-auto">
                    <label className="block text-sm font-medium text-slate-200 mb-2">
                      Email
                    </label>
                    <input
                      type="email"
                      value={isLoginMode ? loginData.email : registerData.email}
                      onChange={(e) => {
                        if (isLoginMode) {
                          setLoginData(prev => ({ ...prev, email: e.target.value }))
                        } else {
                          setRegisterData(prev => ({ ...prev, email: e.target.value }))
                        }
                      }}
                      onClick={(e) => e.stopPropagation()}
                      className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:border-primary-500 focus:outline-none relative z-20"
                      placeholder="seu@email.com"
                    />
                  </div>

                  <div className="pointer-events-auto">
                    <label className="block text-sm font-medium text-slate-200 mb-2">
                      Senha
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={isLoginMode ? loginData.password : registerData.password}
                        onChange={(e) => {
                          if (isLoginMode) {
                            setLoginData(prev => ({ ...prev, password: e.target.value }))
                          } else {
                            setRegisterData(prev => ({ ...prev, password: e.target.value }))
                          }
                        }}
                        onClick={(e) => e.stopPropagation()}
                        className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:border-primary-500 focus:outline-none pr-10"
                        placeholder="Sua senha"
                      />
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          setShowPassword(!showPassword)
                        }}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-white"
                      >
                        {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                  </div>

                  {!isLoginMode && (
                    <div className="pointer-events-auto">
                      <label className="block text-sm font-medium text-slate-200 mb-2">
                        Confirmar Senha
                      </label>
                      <input
                        type="password"
                        value={registerData.confirmPassword}
                        onChange={(e) => setRegisterData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                        onClick={(e) => e.stopPropagation()}
                        className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:border-primary-500 focus:outline-none relative z-20"
                        placeholder="Confirme sua senha"
                      />
                    </div>
                  )}

                  <div className="pt-4 pointer-events-auto">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        if (isLoginMode) {
                          handleLogin()
                        } else {
                          handleRegister()
                        }
                      }}
                      disabled={isLoading}
                      className="w-full bg-gradient-to-r from-primary-600 to-accent-500 hover:from-primary-700 hover:to-accent-600 text-white py-3 rounded-lg font-medium transition-all duration-300 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isLoading ? (isLoginMode ? 'Entrando...' : 'Criando conta...') : (isLoginMode ? 'Entrar' : 'Criar Conta')}
                    </button>
                  </div>

                  <div className="text-center pointer-events-auto">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        setIsLoginMode(!isLoginMode)
                      }}
                      className="text-primary-400 hover:text-primary-300 font-medium"
                    >
                      {isLoginMode ? 'Não tem uma conta? Criar conta' : 'Já tem uma conta? Entrar'}
                    </button>
                  </div>

                </form>
              </div>
            </div>
          )}

        </div>
      </section>

      {/* Partners Section */}
      <section id="partners" className="py-20 bg-slate-800">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-white mb-4">
              Nossos Parceiros
            </h2>
            <p className="text-xl text-slate-200 max-w-3xl mx-auto">
              Instituições de saúde que confiam na nossa plataforma
            </p>
          </div>

          {/* Carrossel de Parceiros */}
          <div className="relative overflow-hidden">
            <div className="flex animate-scroll space-x-8">
              {[...partners, ...partners].map((partner, index) => (
                <div key={index} className="flex-shrink-0 w-64 bg-slate-700 rounded-xl shadow-lg p-6 hover:shadow-xl transition-all duration-300 border border-slate-600">
                  <div className="text-center">
                    <div className="w-16 h-16 bg-gradient-to-r from-primary-600 to-accent-500 rounded-full flex items-center justify-center mx-auto mb-4">
                      <span className="text-white font-bold text-lg">{partner.name.charAt(0)}</span>
                    </div>
                    <h3 className="font-semibold text-white mb-2">{partner.name}</h3>
                    <p className="text-sm text-slate-200 mb-3">{partner.type}</p>
                    <div className="flex justify-center">
                      <Star className="w-4 h-4 text-primary-400 fill-current" />
                      <Star className="w-4 h-4 text-primary-400 fill-current" />
                      <Star className="w-4 h-4 text-primary-400 fill-current" />
                      <Star className="w-4 h-4 text-primary-400 fill-current" />
                      <Star className="w-4 h-4 text-primary-400 fill-current" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-slate-900">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-white mb-4">
              Recursos Avançados
            </h2>
            <p className="text-xl text-slate-200 max-w-3xl mx-auto">
              Tecnologia de ponta para medicina moderna
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="text-center p-6 bg-slate-800/50 backdrop-blur-sm rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 border border-slate-700/50">
              <div className="w-16 h-16 bg-gradient-to-r from-primary-600 to-accent-500 rounded-xl flex items-center justify-center mx-auto mb-4">
                <Brain className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">IA Residente Nôa</h3>
              <p className="text-slate-200">Assistente médica multimodal com chat, voz e vídeo</p>
            </div>

            <div className="text-center p-6 bg-slate-800/50 backdrop-blur-sm rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 border border-slate-700/50">
              <div className="w-16 h-16 bg-gradient-to-r from-green-600 to-emerald-600 rounded-xl flex items-center justify-center mx-auto mb-4">
                <Stethoscope className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">Sistema IMRE</h3>
              <p className="text-slate-200">Avaliação clínica com 28 blocos especializados</p>
            </div>

            <div className="text-center p-6 bg-slate-800/50 backdrop-blur-sm rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 border border-slate-700/50">
              <div className="w-16 h-16 bg-gradient-to-r from-accent-500 to-primary-600 rounded-xl flex items-center justify-center mx-auto mb-4">
                <Shield className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">LGPD Compliant</h3>
              <p className="text-slate-200">Privacidade e segurança de dados garantidas</p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer Profissional */}
      <footer className="bg-gray-900 text-white py-16">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="col-span-1 md:col-span-2">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-10 h-10 bg-gradient-to-r from-primary-600 to-purple-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-lg">M</span>
                </div>
                <span className="text-xl font-bold">MedCannLab</span>
              </div>
              <p className="text-gray-300 mb-6 max-w-md">
                Plataforma médica avançada com IA, avaliação clínica e metodologia AEC 
                para transformar a medicina moderna.
              </p>
              <div className="flex space-x-4">
                <a href="#" className="text-gray-400 hover:text-white transition-colors duration-200">
                  <Globe className="w-6 h-6" />
                </a>
                <a href="#" className="text-gray-400 hover:text-white transition-colors duration-200">
                  <Phone className="w-6 h-6" />
                </a>
                <a href="#" className="text-gray-400 hover:text-white transition-colors duration-200">
                  <Mail className="w-6 h-6" />
                </a>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-4">Recursos</h3>
              <ul className="space-y-2">
                <li><a href="#" className="text-gray-300 hover:text-white transition-colors duration-200">IA Residente Nôa</a></li>
                <li><a href="#" className="text-gray-300 hover:text-white transition-colors duration-200">Sistema IMRE</a></li>
                <li><a href="#" className="text-gray-300 hover:text-white transition-colors duration-200">Metodologia AEC</a></li>
                <li><a href="#" className="text-gray-300 hover:text-white transition-colors duration-200">Cursos Médicos</a></li>
              </ul>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-4">Contato</h3>
              <ul className="space-y-2">
                <li className="flex items-center text-slate-300">
                  <MapPin className="w-4 h-4 mr-2" />
                  São Paulo, SP
                </li>
                <li className="flex items-center text-slate-300">
                  <Phone className="w-4 h-4 mr-2 mr-2" />
                  +55 (11) 99999-9999
                </li>
                <li className="flex items-center text-slate-300">
                  <Mail className="w-4 h-4 mr-2" />
                  contato@medcannlab.com
                </li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-800 mt-8 pt-8 text-center">
            <p className="text-slate-400">
              © 2025 MedCannLab. Todos os direitos reservados.
            </p>
          </div>
        </div>
      </footer>

    </div>
  )
}

export default Landing
