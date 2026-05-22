import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  FileText as FlaskConical,
  Heart,
  Brain,
  TrendingUp,
  CheckCircle,
  Calendar,
  Clock,
  Users,
  Award,
  Target,
  BarChart3,
  FileText,
  BookOpen,
  Globe,
  MessageCircle,
  Stethoscope,
  FileText as Sparkles,
  Zap,
  Download,
  Share2,
  Eye,
  Star,
  Activity,
  Activity as MonitorIcon,
  FileText as Cpu,
  Activity as DeviceIcon,
  FileText as DollarSign,
  FileText as Gift,
  FileText as Clipboard,
  MessageCircle as MessageSquarePlus,
  FileText as GraduationCap
} from 'lucide-react'

const INTEGRATED_PROTOCOL_TOPIC = 'Protocolos Clínicos Integrados - Integração Cannabis & Nefrologia'

const MedCannLab: React.FC = () => {
  const navigate = useNavigate()
  const [activeSection, setActiveSection] = useState<string>('sobre')

  const handleOpenIA = (prompt: string) => {
    if (!prompt) return
    const params = new URLSearchParams({ prompt })
    navigate(`/app/chat?${params.toString()}`)
  }

  const handleOpenForum = (topic: string) => {
    const params = new URLSearchParams({ tab: 'forum' })
    if (topic) params.set('topic', topic)
    navigate(`/app/chat?${params.toString()}`)
  }

  const sections = [
    { id: 'sobre', label: 'Sobre o Projeto', icon: FlaskConical },
    { id: 'protocolos', label: 'Protocolos AEC', icon: FileText },
    { id: 'monitoramento', label: 'Monitoramento Renal', icon: MonitorIcon },
    { id: 'deeplearning', label: 'Deep Learning', icon: Brain },
    { id: 'dispositivos', label: 'Dispositivos Médicos', icon: DeviceIcon },
    { id: 'impacto', label: 'Impacto Clínico', icon: Heart }
  ]

  const researchStudies = [
    {
      id: 'estudo-cbd-irc',
      title: 'Eficácia do CBD na Insuficiência Renal',
      status: 'Em Andamento',
      description: 'Estudo longitudinal sobre os efeitos do CBD em pacientes com IRC',
      participants: 24,
      start: '2024-01-15',
      end: '2024-12-31',
      progress: 65
    },
    {
      id: 'qualidade-vida',
      title: 'Qualidade de Vida e Cannabis Medicinal',
      status: 'Análise',
      description: 'Avaliação do impacto na qualidade de vida de pacientes em tratamento',
      participants: 48,
      start: '2024-03-01',
      end: '2024-11-30',
      progress: 85
    },
    {
      id: 'dosagem-personalizada',
      title: 'Protocolos de Dosagem Personalizados',
      status: 'Em Andamento',
      description: 'Desenvolvimento de protocolos individualizados baseados em dados clínicos',
      participants: 32,
      start: '2024-06-01',
      end: '2025-05-31',
      progress: 45
    },
    {
      id: 'metodologia-imre-resultados',
      title: 'Impacto da Metodologia IMRE em Resultados',
      status: 'Análise',
      description: 'Análise dos resultados clínicos utilizando avaliação triaxial',
      participants: 67,
      start: '2024-02-15',
      end: '2024-11-30',
      progress: 75
    }
  ]

  return (
    <div className="min-h-screen bg-brand-bg text-brand-text">
      {/* Main Content */}
      <div className="max-w-7xl mx-auto p-6">
        {/* Botão Voltar */}
        <div className="mb-6">
          <button
            onClick={() => navigate('/app/pesquisa/profissional/dashboard')}
            className="flex items-center space-x-2 text-green-400 hover:text-green-300 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Voltar</span>
          </button>
        </div>
        {/* Hero Section */}
        <div className="bg-gradient-to-br from-green-900/40 to-teal-900/40 rounded-xl p-8 mb-8 border border-green-500/20">
          <div className="flex items-start space-x-6 mb-6">
            <div className="w-24 h-24 rounded-xl flex items-center justify-center shadow-lg overflow-hidden" style={{
              background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f3a3a 100%)',
              boxShadow: '0 6px 16px rgba(0, 0, 0, 0.4)',
              border: '1px solid rgba(0, 193, 106, 0.2)'
            }}>
              <img
                src="/brain.png"
                alt="MedCannLab Logo"
                className="w-full h-full object-contain p-2"
                style={{
                  filter: 'brightness(1.1) contrast(1.1) drop-shadow(0 0 6px rgba(0, 193, 106, 0.6))'
                }}
              />
            </div>
          </div>
        </div>
        {/* Hero Section */}
        <div className="bg-gradient-to-br from-green-900/40 to-teal-900/40 rounded-xl p-8 mb-8 border border-green-500/20">
          <div className="flex items-start space-x-6 mb-6">
            <div className="w-24 h-24 rounded-xl flex items-center justify-center shadow-lg overflow-hidden" style={{
              background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f3a3a 100%)',
              boxShadow: '0 6px 16px rgba(0, 0, 0, 0.4)',
              border: '1px solid rgba(0, 193, 106, 0.2)'
            }}>
              <img
                src="/brain.png"
                alt="MedCannLab Logo"
                className="w-full h-full object-contain p-2"
                style={{
                  filter: 'brightness(1.1) contrast(1.1) drop-shadow(0 0 6px rgba(0, 193, 106, 0.6))'
                }}
              />
            </div>
            <div className="flex-1">
              <h2 className="text-4xl font-bold text-brand-text mb-4">MedCannLab</h2>
              <p className="text-green-100 text-lg leading-relaxed mb-6">
                Pesquisa pioneira da cannabis medicinal aplicada à nefrologia e neurologia, utilizando a metodologia AEC
                para identificar benefícios terapêuticos e avaliar impactos na função renal.
              </p>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
            <div className="bg-slate-800/50 rounded-lg p-6 border border-green-500/20 text-center">
              <div className="text-4xl font-bold text-green-400 mb-2">50+</div>
              <div className="text-sm text-green-200">Pacientes em Protocolos</div>
            </div>
            <div className="bg-slate-800/50 rounded-lg p-6 border border-teal-500/20 text-center">
              <div className="text-4xl font-bold text-teal-400 mb-2">12</div>
              <div className="text-sm text-green-200">Meses de Pesquisa</div>
            </div>
            <div className="bg-slate-800/50 rounded-lg p-6 border border-cyan-500/20 text-center">
              <div className="text-4xl font-bold text-cyan-400 mb-2">85%</div>
              <div className="text-sm text-green-200">Melhoria na Função Renal</div>
            </div>
            <div className="bg-slate-800/50 rounded-lg p-6 border border-emerald-500/20 text-center">
              <div className="text-4xl font-bold text-emerald-400 mb-2">200+</div>
              <div className="text-sm text-green-200">Biomarcadores Analisados</div>
            </div>
          </div>
        </div>

        {/* Seções do Projeto */}
        <div className="bg-brand-surface rounded-xl p-6 mb-8 border border-brand-border">
          <h3 className="text-2xl font-bold text-brand-text mb-6">Áreas de Pesquisa</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {sections.map((section) => {
              const Icon = section.icon
              return (
                <button
                  key={section.id}
                  onClick={() => setActiveSection(section.id)}
                  className={`p-4 rounded-lg border-2 transition-all ${activeSection === section.id
                    ? 'bg-green-600 border-green-400 text-brand-text'
                    : 'bg-brand-surface-subtle border-slate-600 text-brand-text-secondary hover:border-green-500'
                    }`}
                >
                  <Icon className="w-6 h-6 mx-auto mb-2" />
                  <div className="text-xs font-semibold text-center">{section.label}</div>
                </button>
              )
            })}
          </div>
        </div>

        {/* Protocolos Integrados */}
        <div className="bg-brand-surface rounded-xl p-6 mb-8 border border-brand-border">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
            <div>
              <h3 className="text-2xl font-bold text-brand-text mb-2 flex items-center gap-2">
                <Clipboard className="w-6 h-6 text-green-300" />
                Protocolos Clínicos Integrados
              </h3>
              <p className="text-brand-text-secondary text-sm md:text-base max-w-3xl">
                Cada protocolo conecta os eixos clínica, ensino e pesquisa para gerar avaliações IMRE completas, relatórios da IA residente e planos
                terapêuticos individualizados. Explore a integração com o programa Cidade Amiga dos Rins e acompanhe os novos protocolos em co-criação.
              </p>
            </div>
            <button
              onClick={() => navigate('/app/pesquisa/profissional/cidade-amiga-dos-rins')}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg font-semibold text-brand-text transition-transform transform hover:scale-[1.03]"
              style={{ background: 'linear-gradient(135deg, #2563eb 0%, #00c1a0 100%)' }}
            >
              🌍 Ver Cidade Amiga dos Rins
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <article className="rounded-xl border border-green-500/30 bg-slate-900/60 p-5 flex flex-col gap-4 shadow-lg">
              <div className="space-y-2">
                <h4 className="text-xl font-semibold text-brand-text">Integração Cannabis & Nefrologia</h4>
                <p className="text-sm text-brand-text-secondary leading-relaxed">
                  Núcleo principal do MedCannLab. Protocolos de prescrição AEC combinam a avaliação clínica IMRE renal, bibliografia validada e o
                  monitoramento contínuo da função renal para gerar planos terapêuticos individualizados.
                </p>
              </div>
              <ul className="space-y-2 text-sm text-slate-300/90">
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-300 mt-0.5" />
                  <span>ACP completa pela IA residente + validação clínica supervisionada.</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-300 mt-0.5" />
                  <span>Estratificação KDIGO + espectro TEZ para correlacionar DRC e neurociências.</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-300 mt-0.5" />
                  <span>Planos terapêuticos alimentam a pós-graduação e o prontuário clínico.</span>
                </li>
              </ul>
              <div className="flex flex-wrap gap-2 mt-auto">
                <button
                  onClick={() => navigate('/app/library?collection=protocolos&protocol=medcannlab-nefro')}
                  className="inline-flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold text-brand-text bg-green-600 hover:bg-green-500 transition-colors"
                >
                  <BookOpen className="w-4 h-4" />
                  Abrir documentação
                </button>
                <button
                  onClick={() =>
                    handleOpenIA(
                      'Nôa, aplicar o protocolo MedCannLab de integração cannabis e nefrologia e gerar o plano terapêutico individualizado correspondente.'
                    )
                  }
                  className="inline-flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold text-green-100 border border-green-500/40 bg-green-500/10 hover:bg-green-500/20 transition-colors"
                >
                  <Brain className="w-4 h-4" />
                  Aplicar com IA residente
                </button>
                <button
                  onClick={() => handleOpenForum(INTEGRATED_PROTOCOL_TOPIC)}
                  className="inline-flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold text-green-100 border border-green-500/40 bg-green-500/10 hover:bg-green-500/20 transition-colors"
                >
                  <MessageSquarePlus className="w-4 h-4" />
                  Participar da construção no fórum
                </button>
              </div>
            </article>

            <article className="rounded-xl border border-blue-500/30 bg-slate-900/60 p-5 flex flex-col gap-4 shadow-lg">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-1 text-[11px] font-semibold rounded-md bg-purple-500/20 border border-purple-400/40 text-purple-200">
                    Consulta pública
                  </span>
                  <span className="px-2 py-1 text-[11px] font-semibold rounded-md bg-brand-surface border border-brand-border text-brand-text-secondary">
                    MedCannLab Research Hub
                  </span>
                </div>
                <h4 className="text-xl font-semibold text-brand-text">Protocolo de Saúde Renal com Cannabis Medicinal</h4>
                <p className="text-sm text-brand-text-secondary leading-relaxed">
                  Evolução do Cidade Amiga dos Rins. Consolida bibliografia renal, avaliação clínica inicial dedicada, fluxos de diagnóstico DRC/TEZ e
                  diretrizes para planos terapêuticos personalizados utilizando cannabis medicinal.
                </p>
              </div>
              <ul className="space-y-2 text-sm text-slate-300/90">
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-blue-300 mt-0.5" />
                  <span>Bibliografia curada na base de conhecimento + pads didáticos da pós-graduação.</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-blue-300 mt-0.5" />
                  <span>Fluxo unificado para gerar relatórios IMRE e sugerir planos individualizados.</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-blue-300 mt-0.5" />
                  <span>Discussão colaborativa com consultores, preceptores e alunos.</span>
                </li>
              </ul>
              <div className="flex flex-wrap gap-2 mt-auto">
                <button
                  onClick={() => navigate('/app/library?draft=protocolo-renal-medcannlab')}
                  className="inline-flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold text-brand-text bg-blue-600 hover:bg-blue-500 transition-colors"
                >
                  <Clipboard className="w-4 h-4" />
                  Abrir documento base
                </button>
                <button
                  onClick={() => handleOpenForum(INTEGRATED_PROTOCOL_TOPIC)}
                  className="inline-flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold text-blue-100 border border-blue-500/40 bg-blue-500/10 hover:bg-blue-500/20 transition-colors"
                >
                  <MessageSquarePlus className="w-4 h-4" />
                  Debater no fórum
                </button>
                <button
                  onClick={() =>
                    handleOpenIA(
                      'Nôa, registrar minha contribuição para o protocolo MedCannLab de saúde renal com cannabis medicinal.'
                    )
                  }
                  className="inline-flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold text-purple-100 border border-purple-500/40 bg-purple-500/10 hover:bg-purple-500/20 transition-colors"
                >
                  <Brain className="w-4 h-4" />
                  Registrar com IA residente
                </button>
              </div>
            </article>
          </div>
        </div>

        {/* Sobre o Projeto */}
        <div className="bg-brand-surface rounded-xl p-8 mb-8 border border-brand-border">
          <div className="flex items-center space-x-3 mb-6">
            <div className="w-10 h-10 flex items-center justify-center">
              <img
                src="/brain.png"
                alt="MedCannLab Logo"
                className="w-full h-full object-contain"
                style={{
                  filter: 'brightness(1.1) contrast(1.1) drop-shadow(0 0 6px rgba(0, 193, 106, 0.6))'
                }}
              />
            </div>
            <h3 className="text-2xl font-bold text-brand-text">Sobre o Projeto</h3>
          </div>

          <div className="bg-green-900/20 rounded-lg p-6 mb-6 border border-green-500/20">
            <h4 className="text-lg font-semibold text-brand-text mb-3">Objetivo Principal</h4>
            <p className="text-green-100 leading-relaxed">
              O MedCannLab é uma pesquisa inovadora que combina a metodologia Arte da Entrevista Clínica (AEC)
              com tecnologia de ponta para investigar os benefícios terapêuticos da cannabis medicinal na nefrologia
              e neurologia. Utilizando Deep Learning e análise de biomarcadores, o projeto busca avaliar o impacto
              na função renal e desenvolver protocolos personalizados baseados em evidências científicas.
            </p>
          </div>

          {/* Características Principais */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div className="bg-slate-700/50 rounded-lg p-6 border border-green-500/20">
              <h4 className="text-lg font-semibold text-brand-text mb-4 flex items-center space-x-2">
                <FileText className="w-6 h-6 text-green-400" />
                <span>Protocolos de Prescrição Baseados em AEC</span>
              </h4>
              <ul className="space-y-3 text-sm text-green-100">
                <li className="flex items-start space-x-2">
                  <CheckCircle className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" />
                  <span>Anamnese estruturada com metodologia AEC</span>
                </li>
                <li className="flex items-start space-x-2">
                  <CheckCircle className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" />
                  <span>Avaliação IMRE Triaxial integrada</span>
                </li>
                <li className="flex items-start space-x-2">
                  <CheckCircle className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" />
                  <span>Protocolos personalizados por perfil do paciente</span>
                </li>
                <li className="flex items-start space-x-2">
                  <CheckCircle className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" />
                  <span>Acompanhamento longitudinal com ajustes baseados em resultados</span>
                </li>
              </ul>
            </div>

            <div className="bg-slate-700/50 rounded-lg p-6 border border-teal-500/20">
              <h4 className="text-lg font-semibold text-brand-text mb-4 flex items-center space-x-2">
                <MonitorIcon className="w-6 h-6 text-teal-400" />
                <span>Monitoramento de Função Renal</span>
              </h4>
              <ul className="space-y-3 text-sm text-teal-100">
                <li className="flex items-start space-x-2">
                  <CheckCircle className="w-5 h-5 text-teal-400 mt-0.5 flex-shrink-0" />
                  <span>Avaliação contínua de creatinina e TFG</span>
                </li>
                <li className="flex items-start space-x-2">
                  <CheckCircle className="w-5 h-5 text-teal-400 mt-0.5 flex-shrink-0" />
                  <span>Análise de biomarcadores nefrológicos</span>
                </li>
                <li className="flex items-start space-x-2">
                  <CheckCircle className="w-5 h-5 text-teal-400 mt-0.5 flex-shrink-0" />
                  <span>Monitoramento de efeitos adversos renais</span>
                </li>
                <li className="flex items-start space-x-2">
                  <CheckCircle className="w-5 h-5 text-teal-400 mt-0.5 flex-shrink-0" />
                  <span>Alertas automáticos para mudanças significativas</span>
                </li>
              </ul>
            </div>

            <div className="bg-slate-700/50 rounded-lg p-6 border border-cyan-500/20">
              <h4 className="text-lg font-semibold text-brand-text mb-4 flex items-center space-x-2">
                <Brain className="w-6 h-6 text-cyan-400" />
                <span>Deep Learning para Análise de Biomarcadores</span>
              </h4>
              <ul className="space-y-3 text-sm text-cyan-100">
                <li className="flex items-start space-x-2">
                  <CheckCircle className="w-5 h-5 text-cyan-400 mt-0.5 flex-shrink-0" />
                  <span>Modelos preditivos para resposta ao tratamento</span>
                </li>
                <li className="flex items-start space-x-2">
                  <CheckCircle className="w-5 h-5 text-cyan-400 mt-0.5 flex-shrink-0" />
                  <span>Análise de padrões em grandes volumes de dados</span>
                </li>
                <li className="flex items-start space-x-2">
                  <CheckCircle className="w-5 h-5 text-cyan-400 mt-0.5 flex-shrink-0" />
                  <span>Identificação de subgrupos de pacientes responsivos</span>
                </li>
                <li className="flex items-start space-x-2">
                  <CheckCircle className="w-5 h-5 text-cyan-400 mt-0.5 flex-shrink-0" />
                  <span>Otimização de dosagens baseada em machine learning</span>
                </li>
              </ul>
            </div>

            <div className="bg-slate-700/50 rounded-lg p-6 border border-emerald-500/20">
              <h4 className="text-lg font-semibold text-brand-text mb-4 flex items-center space-x-2">
                <DeviceIcon className="w-6 h-6 text-emerald-400" />
                <span>Integração com Dispositivos Médicos</span>
              </h4>
              <ul className="space-y-3 text-sm text-emerald-100">
                <li className="flex items-start space-x-2">
                  <CheckCircle className="w-5 h-5 text-emerald-400 mt-0.5 flex-shrink-0" />
                  <span>Sincronização com monitores de função renal</span>
                </li>
                <li className="flex items-start space-x-2">
                  <CheckCircle className="w-5 h-5 text-emerald-400 mt-0.5 flex-shrink-0" />
                  <span>Integração com dispositivos de monitoramento contínuo</span>
                </li>
                <li className="flex items-start space-x-2">
                  <CheckCircle className="w-5 h-5 text-emerald-400 mt-0.5 flex-shrink-0" />
                  <span>Coleta automatizada de dados vitais</span>
                </li>
                <li className="flex items-start space-x-2">
                  <CheckCircle className="w-5 h-5 text-emerald-400 mt-0.5 flex-shrink-0" />
                  <span>Dashboard unificado para visualização de dados</span>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Metodologia de Pesquisa */}
        <div className="bg-brand-surface rounded-xl p-8 mb-8 border border-brand-border">
          <div className="flex items-center space-x-3 mb-6">
            <Target className="w-8 h-8 text-green-400" />
            <h3 className="text-2xl font-bold text-brand-text">Metodologia de Pesquisa</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Fase 1 */}
            <div className="bg-slate-700/50 rounded-lg p-6 border border-green-500/20">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-lg font-semibold text-brand-text">Fase 1: Seleção</h4>
                <span className="px-3 py-1 bg-green-600 text-brand-text rounded-full text-xs font-semibold">Concluída</span>
              </div>
              <p className="text-green-100 text-sm mb-4">
                Seleção de pacientes com condições nefrológicas e neurológicas elegíveis para tratamento com cannabis medicinal.
              </p>
              <div className="space-y-2 text-xs text-green-200">
                <div className="flex items-center space-x-2">
                  <CheckCircle className="w-4 h-4 text-green-400" />
                  <span>50 pacientes selecionados</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle className="w-4 h-4 text-green-400" />
                  <span>Avaliação AEC inicial completa</span>
                </div>
              </div>
            </div>

            {/* Fase 2 */}
            <div className="bg-slate-700/50 rounded-lg p-6 border border-teal-500/20">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-lg font-semibold text-brand-text">Fase 2: Protocolos</h4>
                <span className="px-3 py-1 bg-teal-600 text-brand-text rounded-full text-xs font-semibold">Em Andamento</span>
              </div>
              <p className="text-teal-100 text-sm mb-4">
                Implementação de protocolos personalizados baseados em AEC com acompanhamento contínuo.
              </p>
              <div className="space-y-2 text-xs text-teal-200">
                <div className="flex items-center space-x-2">
                  <CheckCircle className="w-4 h-4 text-teal-400" />
                  <span>Protocolos individualizados</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle className="w-4 h-4 text-teal-400" />
                  <span>Monitoramento mensal ativo</span>
                </div>
              </div>
            </div>

            {/* Fase 3 */}
            <div className="bg-slate-700/50 rounded-lg p-6 border border-cyan-500/20">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-lg font-semibold text-brand-text">Fase 3: Análise</h4>
                <span className="px-3 py-1 bg-cyan-600 text-brand-text rounded-full text-xs font-semibold">Planejada</span>
              </div>
              <p className="text-cyan-100 text-sm mb-4">
                Análise de dados com Deep Learning para identificar padrões e otimizar tratamentos.
              </p>
              <div className="space-y-2 text-xs text-cyan-200">
                <div className="flex items-center space-x-2">
                  <CheckCircle className="w-4 h-4 text-cyan-400" />
                  <span>Modelos preditivos</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle className="w-4 h-4 text-cyan-400" />
                  <span>Publicações científicas</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Resultados Preliminares */}
        <div className="bg-brand-surface rounded-xl p-8 mb-8 border border-brand-border">
          <div className="flex items-center space-x-3 mb-6">
            <BarChart3 className="w-8 h-8 text-green-400" />
            <h3 className="text-2xl font-bold text-brand-text">Resultados Preliminares</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-green-900/20 rounded-lg p-6 border border-green-500/20">
              <h4 className="text-lg font-semibold text-brand-text mb-4">Eficácia do Tratamento</h4>
              <ul className="space-y-3 text-sm text-green-100">
                <li className="flex items-center justify-between">
                  <span>Melhoria na função renal:</span>
                  <span className="font-bold text-green-400">85% dos pacientes</span>
                </li>
                <li className="flex items-center justify-between">
                  <span>Redução de sintomas:</span>
                  <span className="font-bold text-green-400">92% dos pacientes</span>
                </li>
                <li className="flex items-center justify-between">
                  <span>Melhoria na qualidade de vida:</span>
                  <span className="font-bold text-green-400">78% dos pacientes</span>
                </li>
                <li className="flex items-center justify-between">
                  <span>Adesão ao tratamento:</span>
                  <span className="font-bold text-green-400">88% dos pacientes</span>
                </li>
              </ul>
            </div>

            <div className="bg-teal-900/20 rounded-lg p-6 border border-teal-500/20">
              <h4 className="text-lg font-semibold text-brand-text mb-4">Análise de Biomarcadores</h4>
              <ul className="space-y-3 text-sm text-teal-100">
                <li className="flex items-center justify-between">
                  <span>Biomarcadores analisados:</span>
                  <span className="font-bold text-teal-400">200+</span>
                </li>
                <li className="flex items-center justify-between">
                  <span>Padrões identificados:</span>
                  <span className="font-bold text-teal-400">15 padrões significativos</span>
                </li>
                <li className="flex items-center justify-between">
                  <span>Predições precisas:</span>
                  <span className="font-bold text-teal-400">82% de acurácia</span>
                </li>
                <li className="flex items-center justify-between">
                  <span>Subgrupos responsivos:</span>
                  <span className="font-bold text-teal-400">3 identificados</span>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Integrações e Conexões */}
        <div className="bg-brand-surface rounded-xl p-6 mb-8 border border-brand-border">
          <h3 className="text-2xl font-bold text-brand-text mb-6">Integrações e Conexões</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <article className="rounded-xl border border-teal-500/30 bg-teal-500/5 p-5 flex flex-col gap-4">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h4 className="text-xl font-semibold text-brand-text">Pós-Graduação Cannabis Medicinal</h4>
                  <p className="text-sm text-teal-100 mt-2">
                    Conteúdo do Dr. Eduardo Faveret alimenta os protocolos clínicos e a construção colaborativa dos planos terapêuticos individualizados.
                  </p>
                </div>
                <div className="w-12 h-12 rounded-lg bg-teal-500/20 border border-teal-400/30 flex items-center justify-center">
                  <GraduationCap className="w-6 h-6 text-teal-300" />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3 text-center text-xs text-teal-100">
                <div className="bg-slate-900/40 rounded-lg p-3 border border-teal-400/20">
                  <p className="text-2xl font-bold text-brand-text">124</p>
                  <p className="mt-1 uppercase tracking-[0.2em]">Pacientes</p>
                </div>
                <div className="bg-slate-900/40 rounded-lg p-3 border border-teal-400/20">
                  <p className="text-2xl font-bold text-brand-text">856</p>
                  <p className="mt-1 uppercase tracking-[0.2em]">Alunos</p>
                </div>
                <div className="bg-slate-900/40 rounded-lg p-3 border border-teal-400/20">
                  <p className="text-2xl font-bold text-brand-text">3</p>
                  <p className="mt-1 uppercase tracking-[0.2em]">Estudos</p>
                </div>
              </div>
              <button
                onClick={() => navigate('/app/ensino/profissional/pos-graduacao-cannabis')}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg font-semibold text-brand-text bg-teal-600 hover:bg-teal-500 transition-colors self-start"
              >
                Acessar curso
              </button>
            </article>
          </div>
        </div>

        {/* Meus Estudos */}
        <div className="bg-brand-surface rounded-xl p-6 mb-8 border border-brand-border">
          <div className="flex items-start justify-between gap-3 mb-6">
            <div>
              <h3 className="text-2xl font-bold text-brand-text">🔬 Meus Estudos</h3>
              <p className="text-brand-text-secondary text-sm md:text-base">
                Acompanhe os estudos em andamento no MedCannLab. Os achados retroalimentam os planos terapêuticos e a base de conhecimento da IA residente.
              </p>
            </div>
            <button
              onClick={() => navigate('/app/pesquisa/profissional/dashboard')}
              className="px-4 py-2 rounded-lg font-semibold text-brand-text bg-primary-600 hover:bg-primary-500 transition-colors"
            >
              Ver todos (6)
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {researchStudies.map(study => (
              <article key={study.id} className="rounded-xl border border-brand-border bg-slate-900/60 p-5 shadow-md">
                <div className="flex items-center justify-between gap-2 mb-3">
                  <div>
                    <h4 className="text-lg font-semibold text-brand-text">{study.title}</h4>
                    <span className="text-xs px-2 py-1 rounded-md bg-blue-500/20 border border-blue-400/30 text-blue-200">
                      {study.status}
                    </span>
                  </div>
                </div>
                <p className="text-sm text-brand-text-secondary leading-relaxed mb-4">{study.description}</p>
                <div className="grid grid-cols-2 gap-3 text-xs text-brand-text-muted mb-4">
                  <div>
                    <span className="block text-slate-500 uppercase tracking-[0.2em] mb-1">Participantes</span>
                    <span className="text-brand-text font-semibold">{study.participants}</span>
                  </div>
                  <div>
                    <span className="block text-slate-500 uppercase tracking-[0.2em] mb-1">Período</span>
                    <span className="text-brand-text font-semibold">
                      {new Date(study.start).toLocaleDateString('pt-BR')} – {new Date(study.end).toLocaleDateString('pt-BR')}
                    </span>
                  </div>
                </div>
                <div>
                  <div className="flex items-center justify-between text-xs text-brand-text-muted mb-1">
                    <span>Progresso</span>
                    <span className="text-brand-text font-semibold">{study.progress}%</span>
                  </div>
                  <div className="h-2 bg-brand-surface rounded-full overflow-hidden border border-brand-border">
                    <div
                      className="h-full bg-gradient-to-r from-primary-500 to-green-500"
                      style={{ width: `${study.progress}%` }}
                    />
                  </div>
                </div>
              </article>
            ))}
          </div>
          <div className="mt-4 text-right">
            <button
              onClick={() => navigate('/app/pesquisa/profissional/dashboard?filter=concluidos')}
              className="text-xs font-semibold text-brand-text-muted hover:text-slate-200 transition-colors underline"
            >
              Ver estudos concluídos
            </button>
          </div>
        </div>

        {/* CTA final */}
        <div className="bg-gradient-to-r from-blue-600/20 via-cyan-600/20 to-emerald-500/20 border border-blue-500/30 rounded-xl p-6 mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <h3 className="text-2xl font-bold text-brand-text mb-2">Cidade Amiga dos Rins & MedCannLab</h3>
              <p className="text-slate-200 text-sm md:text-base max-w-3xl">
                A integração entre a pesquisa MedCannLab e o programa Cidade Amiga dos Rins conecta clínica, ensino e pesquisa em um ciclo contínuo de
                aprendizado. Acesse o programa para acompanhar cronogramas, indicadores e debates sobre novos protocolos.
              </p>
            </div>
            <button
              onClick={() => navigate('/app/pesquisa/profissional/cidade-amiga-dos-rins')}
              className="inline-flex items-center gap-2 px-5 py-3 rounded-lg font-semibold text-brand-text bg-blue-600 hover:bg-blue-500 transition-colors"
            >
              🌍 Explorar Cidade Amiga dos Rins
            </button>
          </div>
        </div>

        {/* Sistema de Captação de Recursos */}
        <div className="bg-brand-surface rounded-xl p-8 mb-8 border border-brand-border">
          <div className="flex items-center space-x-3 mb-6">
            <DollarSign className="w-8 h-8 text-green-400" />
            <h3 className="text-2xl font-bold text-brand-text">Sistema de Captação de Recursos</h3>
          </div>

          <div className="bg-green-900/20 rounded-lg p-6 mb-6 border border-green-500/20">
            <h4 className="text-lg font-semibold text-brand-text mb-3">Modelos de Negócio Sustentável</h4>
            <p className="text-green-100 text-sm leading-relaxed mb-4">
              Estratégias de desenvolvimento sustentável alinhadas com os princípios de equidade, inovação e mobilização
              de organizações públicas e privadas, baseadas em evidências científicas do artigo "After COP26 — Putting
              Health and Equity at the Center of the Climate Movement".
            </p>
          </div>

          {/* Modelos de Monetização */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div className="bg-slate-700/50 rounded-lg p-6 border border-green-500/20">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-lg font-semibold text-brand-text">Plataforma de Assinaturas Educacional</h4>
                <span className="px-3 py-1 bg-green-600 text-brand-text rounded-full text-xs font-semibold">Ativo</span>
              </div>
              <div className="space-y-3 mb-4">
                <p className="text-sm text-brand-text-secondary">Investimento: R$ 50.000 - R$ 200.000</p>
                <div className="w-full bg-slate-600 rounded-full h-2 mb-2">
                  <div className="bg-green-500 h-2 rounded-full" style={{ width: '85%' }}></div>
                </div>
                <p className="text-xs text-brand-text-muted">Progresso de Implementação: 85%</p>
                <p className="text-sm text-green-200">Conteúdo exclusivo sobre saúde sustentável e práticas ecológicas</p>
                <div className="bg-brand-surface rounded p-3">
                  <p className="text-xs font-semibold text-brand-text mb-2">Benefícios Principais:</p>
                  <ul className="space-y-1 text-xs text-brand-text-secondary">
                    <li>• Receita contínua</li>
                    <li>• Disseminação de conhecimento</li>
                    <li>• Educação continuada</li>
                  </ul>
                </div>
              </div>
              <button
                onClick={() => navigate('/app/professional-financial')}
                className="w-full bg-green-600 hover:bg-green-700 text-brand-text px-4 py-2 rounded-lg font-semibold transition-colors"
              >
                Acessar Gestão Financeira
              </button>
            </div>

            <div className="space-y-4">
              <div className="bg-slate-700/50 rounded-lg p-4 border border-slate-600">
                <div className="flex items-center justify-between mb-2">
                  <h5 className="text-sm font-semibold text-brand-text">Consultoria em Sustentabilidade para Saúde</h5>
                  <span className="px-2 py-1 bg-yellow-600 text-brand-text rounded-full text-xs">Em desenvolvimento</span>
                </div>
              </div>
              <div className="bg-slate-700/50 rounded-lg p-4 border border-slate-600">
                <div className="flex items-center justify-between mb-2">
                  <h5 className="text-sm font-semibold text-brand-text">Marketplace Produtos Sustentáveis</h5>
                  <span className="px-2 py-1 bg-purple-600 text-brand-text rounded-full text-xs">Planejado</span>
                </div>
              </div>
              <div className="bg-slate-700/50 rounded-lg p-4 border border-slate-600">
                <div className="flex items-center justify-between mb-2">
                  <h5 className="text-sm font-semibold text-brand-text">Licenciamento de IA para Saúde Sustentável</h5>
                  <span className="px-2 py-1 bg-yellow-600 text-brand-text rounded-full text-xs">Em desenvolvimento</span>
                </div>
              </div>
              <div className="bg-slate-700/50 rounded-lg p-4 border border-green-500/20">
                <div className="flex items-center justify-between mb-2">
                  <h5 className="text-sm font-semibold text-brand-text">Parcerias Público-Privadas</h5>
                  <span className="px-2 py-1 bg-green-600 text-brand-text rounded-full text-xs">Ativo</span>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}

export default MedCannLab

