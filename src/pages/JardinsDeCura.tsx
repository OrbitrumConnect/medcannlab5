import React from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Globe, Users, Stethoscope, Target, BarChart3, Award, Brain, Heart, CheckCircle, Sparkles, BookOpen, GraduationCap, Clock } from 'lucide-react'
import { useNoaPlatform } from '../contexts/NoaPlatformContext'
import { useAuth } from '../contexts/AuthContext'
import NoaConversationalInterface from '../components/NoaConversationalInterface'

const JardinsDeCura: React.FC = () => {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { sendInitialMessage, openChat } = useNoaPlatform()

  const handleSaibaMaisNoa = () => {
    openChat()
    setTimeout(() => {
      sendInitialMessage('Olá Nôa! Gostaria de saber mais sobre o projeto Jardins de Cura e como posso participar ou levar essa metodologia para minha comunidade.')
    }, 500)
  }

  const handleConhecerCursos = () => {
    navigate('/curso-jardins-de-cura')
  }

  const handleIniciarCurso = () => {
    navigate('/curso-jardins-de-cura')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900/20 to-pink-900/20 text-brand-text">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-900/80 to-pink-900/80 border-b border-purple-500/30 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center space-x-4">
            <button 
              onClick={() => navigate('/app/pesquisa/profissional/dashboard')}
              className="flex items-center space-x-2 text-purple-200 hover:text-brand-text transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              <span>Voltar</span>
            </button>
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-brand-text">🌍 Saúde Global & Equidade</h1>
              <p className="text-purple-200 text-sm">Jardins de Cura</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Hero Section */}
        <div className="bg-gradient-to-br from-purple-900/40 via-pink-900/40 to-blue-900/40 rounded-2xl p-8 mb-8 border border-purple-500/30">
          <div className="flex items-start justify-between mb-6">
            <div className="flex-1">
              <div className="flex items-center space-x-4 mb-4">
                <div className="w-20 h-20 bg-gradient-to-br from-[#00c16a] to-[#00a85a] rounded-xl flex items-center justify-center shadow-lg">
                  <Globe className="w-10 h-10 text-brand-text" />
                </div>
                <div>
                  <h2 className="text-4xl font-bold text-brand-text mb-2">Jardins de Cura</h2>
                  <p className="text-purple-200 text-lg">Saúde Global & Equidade</p>
                </div>
              </div>
              
              <p className="text-purple-100 text-lg leading-relaxed mb-4">
                Projeto de saúde global focado na aplicação da metodologia AEC em comunidades vulneráveis, 
                promovendo equidade em saúde e desenvolvimento de capacidades locais.
              </p>

              <div className="bg-slate-800/50 rounded-lg p-6 border border-purple-500/30 mb-6">
                <div className="flex items-center space-x-3 mb-3">
                  <Brain className="w-6 h-6 text-purple-400" />
                  <h3 className="text-xl font-semibold text-brand-text">Nôa Esperança - Formação em Habilidades de Comunicação</h3>
                </div>
                <p className="text-purple-100 leading-relaxed">
                  Nôa Esperança tem o papel fundamental de formação em habilidades de comunicação em saúde, 
                  aplicando a metodologia "Arte da Entrevista Clínica" para capacitar profissionais e estudantes 
                  na escuta ativa e cuidado humanizado.
                </p>
              </div>

              {/* Mandala Placeholder */}
              <div className="bg-slate-800/50 rounded-lg p-6 border border-purple-500/30 text-center">
                <div className="w-32 h-32 mx-auto mb-4 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-full flex items-center justify-center">
                  <Sparkles className="w-16 h-16 text-purple-400" />
                </div>
                <p className="text-purple-200 text-sm italic">Jardins de Cura - Mandala representando crescimento, cura e renovação</p>
              </div>
            </div>
          </div>
        </div>

        {/* Características Principais */}
        <div className="bg-slate-800/50 rounded-xl p-8 mb-8 border border-purple-500/30">
          <h3 className="text-2xl font-bold text-brand-text mb-6 flex items-center space-x-3">
            <Target className="w-7 h-7 text-purple-400" />
            <span>Características Principais</span>
          </h3>
          <p className="text-purple-100 text-lg mb-6">
            Abordagem integrada para transformar o cuidado em saúde em comunidades vulneráveis
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-gradient-to-br from-purple-900/30 to-pink-900/30 rounded-lg p-6 border border-purple-500/20">
              <div className="flex items-center space-x-3 mb-3">
                <Users className="w-6 h-6 text-purple-400" />
                <h4 className="text-lg font-semibold text-brand-text">Formação de Agentes Comunitários</h4>
              </div>
              <p className="text-purple-100 text-sm">
                Capacitação de lideranças locais para aplicação da metodologia AEC em suas comunidades.
              </p>
            </div>

            <div className="bg-gradient-to-br from-purple-900/30 to-pink-900/30 rounded-lg p-6 border border-purple-500/20">
              <div className="flex items-center space-x-3 mb-3">
                <Stethoscope className="w-6 h-6 text-purple-400" />
                <h4 className="text-lg font-semibold text-brand-text">Triagem Preventiva baseada em AEC</h4>
              </div>
              <p className="text-purple-100 text-sm">
                Sistemas de identificação precoce de riscos à saúde usando a Arte da Entrevista Clínica.
              </p>
            </div>

            <div className="bg-gradient-to-br from-purple-900/30 to-pink-900/30 rounded-lg p-6 border border-purple-500/20">
              <div className="flex items-center space-x-3 mb-3">
                <BarChart3 className="w-6 h-6 text-purple-400" />
                <h4 className="text-lg font-semibold text-brand-text">Indicadores de Saúde Populacional</h4>
              </div>
              <p className="text-purple-100 text-sm">
                Desenvolvimento de métricas específicas para monitoramento da saúde comunitária.
              </p>
            </div>

            <div className="bg-gradient-to-br from-purple-900/30 to-pink-900/30 rounded-lg p-6 border border-purple-500/20">
              <div className="flex items-center space-x-3 mb-3">
                <Globe className="w-6 h-6 text-purple-400" />
                <h4 className="text-lg font-semibold text-brand-text">Parcerias com Organizações Internacionais</h4>
              </div>
              <p className="text-purple-100 text-sm">
                Colaboração com entidades globais para amplificar o impacto das intervenções.
              </p>
            </div>
          </div>
        </div>

        {/* Equipe de Coordenação */}
        <div className="bg-slate-800/50 rounded-xl p-8 mb-8 border border-purple-500/30">
          <h3 className="text-2xl font-bold text-brand-text mb-6 flex items-center space-x-3">
            <Users className="w-7 h-7 text-purple-400" />
            <span>Equipe de Coordenação</span>
          </h3>
          <p className="text-purple-100 mb-6">Profissionais especializados em saúde global e metodologia AEC</p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Dr. Fernando Bozza */}
            <div className="bg-gradient-to-br from-blue-900/30 to-cyan-900/30 rounded-lg p-6 border border-blue-500/20">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-12 h-12 bg-blue-500/20 rounded-full flex items-center justify-center">
                  <Stethoscope className="w-6 h-6 text-blue-400" />
                </div>
                <div>
                  <h4 className="text-lg font-semibold text-brand-text">Dr. Fernando Bozza</h4>
                  <p className="text-sm text-blue-300">Coordenador Geral</p>
                </div>
              </div>
              
              <div className="space-y-3">
                <div>
                  <p className="text-xs font-semibold text-blue-300 mb-2">Competências:</p>
                  <ul className="space-y-1 text-xs text-blue-100">
                    <li className="flex items-start space-x-2">
                      <CheckCircle className="w-3 h-3 text-blue-400 mt-0.5 flex-shrink-0" />
                      <span>Medicina Intensiva</span>
                    </li>
                    <li className="flex items-start space-x-2">
                      <CheckCircle className="w-3 h-3 text-blue-400 mt-0.5 flex-shrink-0" />
                      <span>Saúde Global</span>
                    </li>
                    <li className="flex items-start space-x-2">
                      <CheckCircle className="w-3 h-3 text-blue-400 mt-0.5 flex-shrink-0" />
                      <span>Projetos Internacionais</span>
                    </li>
                  </ul>
                </div>
                
                <div>
                  <p className="text-xs font-semibold text-blue-300 mb-2">Responsabilidades:</p>
                  <ul className="space-y-1 text-xs text-blue-100">
                    <li className="flex items-start space-x-2">
                      <CheckCircle className="w-3 h-3 text-blue-400 mt-0.5 flex-shrink-0" />
                      <span>Coordenação geral do projeto</span>
                    </li>
                    <li className="flex items-start space-x-2">
                      <CheckCircle className="w-3 h-3 text-blue-400 mt-0.5 flex-shrink-0" />
                      <span>Parcerias estratégicas</span>
                    </li>
                    <li className="flex items-start space-x-2">
                      <CheckCircle className="w-3 h-3 text-blue-400 mt-0.5 flex-shrink-0" />
                      <span>Supervisão científica</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Dr. Ricardo Valença */}
            <div className="bg-gradient-to-br from-purple-900/30 to-pink-900/30 rounded-lg p-6 border border-purple-500/20">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-12 h-12 bg-purple-500/20 rounded-full flex items-center justify-center">
                  <Award className="w-6 h-6 text-purple-400" />
                </div>
                <div>
                  <h4 className="text-lg font-semibold text-brand-text">Dr. Ricardo Valença</h4>
                  <p className="text-sm text-purple-300">Coordenador de Metodologia</p>
                </div>
              </div>
              
              <div className="space-y-3">
                <div>
                  <p className="text-xs font-semibold text-purple-300 mb-2">Competências:</p>
                  <ul className="space-y-1 text-xs text-purple-100">
                    <li className="flex items-start space-x-2">
                      <CheckCircle className="w-3 h-3 text-purple-400 mt-0.5 flex-shrink-0" />
                      <span>Metodologia AEC</span>
                    </li>
                    <li className="flex items-start space-x-2">
                      <CheckCircle className="w-3 h-3 text-purple-400 mt-0.5 flex-shrink-0" />
                      <span>Nefrologia</span>
                    </li>
                    <li className="flex items-start space-x-2">
                      <CheckCircle className="w-3 h-3 text-purple-400 mt-0.5 flex-shrink-0" />
                      <span>Pesquisa Clínica</span>
                    </li>
                  </ul>
                </div>
                
                <div>
                  <p className="text-xs font-semibold text-purple-300 mb-2">Responsabilidades:</p>
                  <ul className="space-y-1 text-xs text-purple-100">
                    <li className="flex items-start space-x-2">
                      <CheckCircle className="w-3 h-3 text-purple-400 mt-0.5 flex-shrink-0" />
                      <span>Supervisão metodológica</span>
                    </li>
                    <li className="flex items-start space-x-2">
                      <CheckCircle className="w-3 h-3 text-purple-400 mt-0.5 flex-shrink-0" />
                      <span>Validação científica</span>
                    </li>
                    <li className="flex items-start space-x-2">
                      <CheckCircle className="w-3 h-3 text-purple-400 mt-0.5 flex-shrink-0" />
                      <span>Capacitação técnica</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Nôa Esperança */}
            <div className="bg-gradient-to-br from-emerald-900/30 to-teal-900/30 rounded-lg p-6 border border-emerald-500/20">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-12 h-12 bg-emerald-500/20 rounded-full flex items-center justify-center">
                  <Brain className="w-6 h-6 text-emerald-400" />
                </div>
                <div>
                  <h4 className="text-lg font-semibold text-brand-text">Nôa Esperança</h4>
                  <p className="text-sm text-emerald-300">Agente Inteligente</p>
                </div>
              </div>
              
              <div className="space-y-3">
                <div>
                  <p className="text-xs font-semibold text-emerald-300 mb-2">Competências:</p>
                  <ul className="space-y-1 text-xs text-emerald-100">
                    <li className="flex items-start space-x-2">
                      <CheckCircle className="w-3 h-3 text-emerald-400 mt-0.5 flex-shrink-0" />
                      <span>Avaliação Clínica</span>
                    </li>
                    <li className="flex items-start space-x-2">
                      <CheckCircle className="w-3 h-3 text-emerald-400 mt-0.5 flex-shrink-0" />
                      <span>Análise de Dados</span>
                    </li>
                    <li className="flex items-start space-x-2">
                      <CheckCircle className="w-3 h-3 text-emerald-400 mt-0.5 flex-shrink-0" />
                      <span>Educação em Saúde</span>
                    </li>
                  </ul>
                </div>
                
                <div>
                  <p className="text-xs font-semibold text-emerald-300 mb-2">Responsabilidades:</p>
                  <ul className="space-y-1 text-xs text-emerald-100">
                    <li className="flex items-start space-x-2">
                      <CheckCircle className="w-3 h-3 text-emerald-400 mt-0.5 flex-shrink-0" />
                      <span>Suporte às avaliações</span>
                    </li>
                    <li className="flex items-start space-x-2">
                      <CheckCircle className="w-3 h-3 text-emerald-400 mt-0.5 flex-shrink-0" />
                      <span>Análise populacional</span>
                    </li>
                    <li className="flex items-start space-x-2">
                      <CheckCircle className="w-3 h-3 text-emerald-400 mt-0.5 flex-shrink-0" />
                      <span>Capacitação digital</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Pronto para Implementação */}
        <div className="bg-slate-800/50 rounded-xl p-8 mb-8 border border-purple-500/30">
          <h3 className="text-2xl font-bold text-brand-text mb-6 flex items-center space-x-3">
            <CheckCircle className="w-7 h-7 text-green-400" />
            <span>Pronto para Implementação</span>
          </h3>
          <p className="text-purple-100 text-lg mb-6">
            Recursos técnicos e conceituais disponíveis para expansão global
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Recursos Técnicos */}
            <div className="bg-gradient-to-br from-purple-900/30 to-pink-900/30 rounded-lg p-6 border border-purple-500/20">
              <h4 className="text-lg font-semibold text-brand-text mb-4 flex items-center space-x-2">
                <Sparkles className="w-5 h-5 text-purple-400" />
                <span>Recursos Técnicos</span>
              </h4>
              <ul className="space-y-3 text-purple-100">
                <li className="flex items-start space-x-2">
                  <CheckCircle className="w-5 h-5 text-purple-400 mt-0.5 flex-shrink-0" />
                  <span>Plataforma digital escalável</span>
                </li>
                <li className="flex items-start space-x-2">
                  <CheckCircle className="w-5 h-5 text-purple-400 mt-0.5 flex-shrink-0" />
                  <span>Protocolos AEC validados</span>
                </li>
                <li className="flex items-start space-x-2">
                  <CheckCircle className="w-5 h-5 text-purple-400 mt-0.5 flex-shrink-0" />
                  <span>Sistema de monitoramento</span>
                </li>
                <li className="flex items-start space-x-2">
                  <CheckCircle className="w-5 h-5 text-purple-400 mt-0.5 flex-shrink-0" />
                  <span>Ferramentas de capacitação</span>
                </li>
              </ul>
            </div>

            {/* Recursos Conceituais */}
            <div className="bg-gradient-to-br from-purple-900/30 to-pink-900/30 rounded-lg p-6 border border-purple-500/20">
              <h4 className="text-lg font-semibold text-brand-text mb-4 flex items-center space-x-2">
                <BookOpen className="w-5 h-5 text-purple-400" />
                <span>Recursos Conceituais</span>
              </h4>
              <ul className="space-y-3 text-purple-100">
                <li className="flex items-start space-x-2">
                  <CheckCircle className="w-5 h-5 text-purple-400 mt-0.5 flex-shrink-0" />
                  <span>Metodologia AEC documentada</span>
                </li>
                <li className="flex items-start space-x-2">
                  <CheckCircle className="w-5 h-5 text-purple-400 mt-0.5 flex-shrink-0" />
                  <span>Frameworks de avaliação</span>
                </li>
                <li className="flex items-start space-x-2">
                  <CheckCircle className="w-5 h-5 text-purple-400 mt-0.5 flex-shrink-0" />
                  <span>Indicadores de impacto</span>
                </li>
                <li className="flex items-start space-x-2">
                  <CheckCircle className="w-5 h-5 text-purple-400 mt-0.5 flex-shrink-0" />
                  <span>Modelo de sustentabilidade</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Parcerias */}
          <div className="mt-6 bg-gradient-to-br from-purple-900/30 to-pink-900/30 rounded-lg p-6 border border-purple-500/20">
            <h4 className="text-lg font-semibold text-brand-text mb-4 flex items-center space-x-2">
              <Globe className="w-5 h-5 text-purple-400" />
              <span>Parcerias</span>
            </h4>
            <ul className="grid grid-cols-2 md:grid-cols-4 gap-3 text-purple-100">
              <li className="flex items-start space-x-2">
                <CheckCircle className="w-4 h-4 text-purple-400 mt-0.5 flex-shrink-0" />
                <span>Organizações internacionais</span>
              </li>
              <li className="flex items-start space-x-2">
                <CheckCircle className="w-4 h-4 text-purple-400 mt-0.5 flex-shrink-0" />
                <span>Universidades parceiras</span>
              </li>
              <li className="flex items-start space-x-2">
                <CheckCircle className="w-4 h-4 text-purple-400 mt-0.5 flex-shrink-0" />
                <span>Governos locais</span>
              </li>
              <li className="flex items-start space-x-2">
                <CheckCircle className="w-4 h-4 text-purple-400 mt-0.5 flex-shrink-0" />
                <span>Sociedade civil organizada</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Curso de Formação */}
        <div className="bg-gradient-to-br from-green-900/40 via-emerald-900/40 to-teal-900/40 rounded-2xl p-8 mb-8 border border-green-500/30">
          <div className="flex items-start justify-between mb-6">
            <div className="flex-1">
              <div className="flex items-center space-x-4 mb-4">
                <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl flex items-center justify-center shadow-lg">
                  <GraduationCap className="w-8 h-8 text-brand-text" />
                </div>
                <div>
                  <h3 className="text-3xl font-bold text-brand-text mb-2">Programa de Formação para ACS</h3>
                  <p className="text-green-200 text-lg">Prevenção e Cuidado de Dengue com Arte da Entrevista Clínica</p>
                </div>
              </div>
              
              <p className="text-green-100 text-lg leading-relaxed mb-6">
                Programa de treinamento otimizado para Agentes Comunitários de Saúde (ACS) em prevenção e cuidado de dengue. 
                Alinhado com as Diretrizes Nacionais para Prevenção e Controle de Dengue e integrado com a metodologia 
                Arte da Entrevista Clínica e Nôa Esperança.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="bg-green-900/30 rounded-lg p-4 border border-green-500/30">
                  <div className="flex items-center space-x-2 mb-2">
                    <Clock className="w-5 h-5 text-green-300" />
                    <span className="text-green-200 text-sm font-medium">Duração</span>
                  </div>
                  <p className="text-brand-text font-bold">40 horas / 5 semanas</p>
                </div>
                <div className="bg-green-900/30 rounded-lg p-4 border border-green-500/30">
                  <div className="flex items-center space-x-2 mb-2">
                    <BookOpen className="w-5 h-5 text-green-300" />
                    <span className="text-green-200 text-sm font-medium">Módulos</span>
                  </div>
                  <p className="text-brand-text font-bold">9 módulos</p>
                </div>
                <div className="bg-green-900/30 rounded-lg p-4 border border-green-500/30">
                  <div className="flex items-center space-x-2 mb-2">
                    <Award className="w-5 h-5 text-green-300" />
                    <span className="text-green-200 text-sm font-medium">Certificado</span>
                  </div>
                  <p className="text-brand-text font-bold">Sim</p>
                </div>
              </div>

              <div className="bg-green-900/30 rounded-lg p-6 border border-green-500/30 mb-6">
                <h4 className="text-xl font-semibold text-brand-text mb-4 flex items-center">
                  <Brain className="w-6 h-6 mr-2 text-green-400" />
                  Conteúdo do Curso
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-green-300 font-semibold mb-2">📚 Módulos Técnicos:</p>
                    <ul className="space-y-1 text-green-100 text-sm">
                      <li>• Compreensão da Dengue</li>
                      <li>• Classificação de Risco e Sinais Precoces</li>
                      <li>• Vigilância e Visita Domiciliar</li>
                      <li>• Controle Vetorial e Mobilização</li>
                      <li>• Preparação para Cenários de Crise</li>
                    </ul>
                  </div>
                  <div>
                    <p className="text-green-300 font-semibold mb-2">💬 Habilidades Relacionais (AEC):</p>
                    <ul className="space-y-1 text-green-100 text-sm">
                      <li>• Presença e Escuta</li>
                      <li>• Profundidade Narrativa</li>
                      <li>• Contenção Emocional</li>
                      <li>• Empoderamento</li>
                      <li>• Diálogo Profissional</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-4">
                <button
                  onClick={handleIniciarCurso}
                  className="bg-gradient-to-r from-green-500 to-emerald-500 text-brand-text px-8 py-4 rounded-lg font-bold text-lg hover:from-green-600 hover:to-emerald-600 transition-all shadow-lg flex items-center justify-center space-x-2"
                >
                  <GraduationCap className="w-5 h-5" />
                  <span>Iniciar Curso</span>
                </button>
                
                <button
                  onClick={handleSaibaMaisNoa}
                  className="bg-green-700/50 text-brand-text px-8 py-4 rounded-lg font-bold text-lg hover:bg-green-700/70 transition-colors border-2 border-green-400/30 flex items-center justify-center space-x-2"
                >
                  <Brain className="w-5 h-5" />
                  <span>Saiba mais com Nôa Esperança</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl p-8 border border-purple-400/50">
          <div className="text-center mb-6">
            <h3 className="text-3xl font-bold text-brand-text mb-3">Transforme Sua Comunidade</h3>
            <p className="text-purple-100 text-lg">
              Junte-se ao Jardins de Cura e leve a metodologia AEC para sua região, 
              promovendo equidade e inovação em saúde.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={handleSaibaMaisNoa}
              className="bg-white text-purple-600 px-8 py-4 rounded-lg font-bold text-lg hover:bg-purple-50 transition-colors flex items-center justify-center space-x-2"
            >
              <Brain className="w-5 h-5" />
              <span>Saiba mais com Nôa Esperança</span>
            </button>
            
            <button
              onClick={handleConhecerCursos}
              className="bg-purple-700/50 text-brand-text px-8 py-4 rounded-lg font-bold text-lg hover:bg-purple-700/70 transition-colors border-2 border-white/30 flex items-center justify-center space-x-2"
            >
              <GraduationCap className="w-5 h-5" />
              <span>Conhecer Cursos</span>
            </button>
          </div>
        </div>
      </div>

      {/* Interface Conversacional Nôa Esperança - Conectada ao Projeto Jardins de Cura */}
      <NoaConversationalInterface 
        userName={user?.name || 'Usuário'}
        userCode={user?.id || 'USER-001'}
        position="bottom-right"
      />
    </div>
  )
}

export default JardinsDeCura

