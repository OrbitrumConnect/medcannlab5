import React, { useEffect, useMemo, useRef, useState } from 'react'
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import {
  ArrowLeft,
  GraduationCap,
  BookOpen,
  Heart,
  Brain,
  MessageCircle,
  Calendar,
  TrendingUp,
  Clock,
  User,
  Star,
  CheckCircle,
  AlertCircle,
  Play,
  Download,
  Share2,
  Target,
  Award,
  BarChart3,
  Activity,
  Users,
  FileText,
  X,
  Send,
  LayoutDashboard,
  ArrowRight,
  PlusCircle,    // V1.9.495 Sprint E V1 — admin CRUD News
  Pencil,        // V1.9.495 Sprint E V1
  Trash2,        // V1.9.495 Sprint E V1
  Eye,           // V1.9.495 Sprint E V1
  EyeOff,        // V1.9.495 Sprint E V1
  Loader2,       // V1.9.495 Sprint E V1
  Inbox,         // V1.9.495 Sprint E V1 — empty state
  ExternalLink   // V1.9.495 Sprint E V1
} from 'lucide-react'
// V1.9.495 Sprint E Vertical 1 (Pedro 29/05) — Notícias & Eventos plantadas.
// Mock newsletterUpdates substituído por query real à tabela `public.news`.
// Schema 18 cols + RLS pré-existente (admins gerenciam, público lê published).
import { useNewsItems, NEWS_CATEGORIES, getCategoryLabel, getCategoryColor, type NewsItem } from '../hooks/useNewsItems'
import { NewsItemAdminModal } from '../components/NewsItemAdminModal'
// V1.9.496 Sprint E Vertical 2 (Pedro 29/05) — Instrumentos de Avaliação plantados.
// Mock evaluationInstruments substituído por query real à tabela
// `public.evaluation_instruments` (criada V1.9.496 + RLS + seed 3 instrumentos).
import {
  useEvaluationInstruments,
  getInstrumentCategoryLabel,
  getInstrumentCategoryColor,
  getInstrumentStatusLabel,
  getInstrumentStatusBadge,
  type EvaluationInstrument,
} from '../hooks/useEvaluationInstruments'
import { EvaluationInstrumentAdminModal } from '../components/EvaluationInstrumentAdminModal'
// V1.9.497 Sprint E Vertical 3 (Pedro 29/05) — Mentoria plantada.
// Mock mentorshipPrograms substituído por query real à tabela
// `public.mentor_profiles`. Solicitações vão pra `mentorship_requests` (não
// mais `appointments` com doctor_id string — anti-padrão UUID resolvido).
import { useMentorship, MENTORSHIP_STATUS_LABELS, type MentorProfile } from '../hooks/useMentorship'
import { MentorshipRequestModal } from '../components/MentorshipRequestModal'
import { useNoa } from '../contexts/NoaContext'
import { useNoaPlatform } from '../contexts/NoaPlatformContext'
import { useDashboardTriggers } from '../contexts/DashboardTriggersContext'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import NoaAnimatedAvatar from '../components/NoaAnimatedAvatar'
import AlunoDashboard from './AlunoDashboard'
import {
  backgroundGradient,
  surfaceStyle,
  secondarySurfaceStyle,
  cardStyle,
  accentGradient,
  secondaryGradient,
  goldenGradient
} from '../constants/designSystem'

type EnsinoSection = 'dashboard' | 'aulas' | 'biblioteca' | 'avaliacao' | 'newsletter' | 'mentoria'

// Função para validar se a data é válida para o mentor
// V1.9.497 Sprint E V3 — Helpers `isValidDateForMentor` + `getAvailableTimes`
// MOVIDOS pra MentorshipRequestModal.tsx (componente standalone). Agora recebem
// `slug` ao invés de `id` UUID (estável entre seeds). Default permissivo pra
// mentores futuros sem regra explícita (9h-20h slots, qualquer dia).

interface EnsinoDashboardProps {
  forcedSection?: EnsinoSection
}

const EnsinoDashboard: React.FC<EnsinoDashboardProps> = ({ forcedSection }) => {
  const navigate = useNavigate()
  const location = useLocation()
  const [searchParams, setSearchParams] = useSearchParams()
  const { isOpen, toggleChat, messages, isTyping, isListening, isSpeaking, sendMessage } = useNoa()
  const { openChat: openNoaChat, closeChat, isOpen: isNoaOpen } = useNoaPlatform()
  const { setDashboardTriggers } = useDashboardTriggers()
  const [inputMessage, setInputMessage] = useState('')
  const { user } = useAuth()

  // Estados para solicitação de mentoria
  // V1.9.497 Sprint E V3 — selectedMentor agora é MentorProfile (do banco real),
  // não typeof mentorshipPrograms[0] (mock). Mentorship request modal stand-alone
  // gerencia seu próprio state (data/horário/tópico/mensagem).
  const [selectedMentor, setSelectedMentor] = useState<MentorProfile | null>(null)
  const [enrolledCourses, setEnrolledCourses] = useState<any[]>([])
  const [isLoadingCourses, setIsLoadingCourses] = useState(false)

  const handleSendMessage = () => {
    if (inputMessage.trim()) {
      sendMessage(inputMessage.trim())
      setInputMessage('')
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  // Navigation handlers
  const handleNavigate = (path: string) => {
    navigate(path)
  }

  const handleContinueLearning = () => {
    // Navigate to the main course
    navigate('/app/ensino/profissional/pos-graduacao-cannabis')
  }

  const handleOpenModule = (moduleId: number) => {
    setSelectedModule(moduleId)
  }

  const handleOpenLesson = (lessonId: number) => {
    setSelectedLesson(lessonId)
  }

  const handleJoinClass = (courseTitle: string, courseId?: string) => {
    const title = courseTitle.toLowerCase()
    
    // 1. Verificar se é um curso Pro do Dr. Eduardo ou Dr. Ricardo
    if (title.includes('cannabis') || title.includes('pós-graduação')) {
      navigate(`/app/ensino/profissional/pos-graduacao-cannabis${courseId ? `?courseId=${courseId}` : ''}`)
    } else if (title.includes('arte da entrevista') || title.includes('entrevista clínica') || title.includes('aec') || title.includes('rins') || title.includes('imre')) {
      navigate(`/app/ensino/profissional/arte-entrevista-clinica${courseId ? `?courseId=${courseId}` : ''}`)
    } else {
      // 2. Se for qualquer outro curso (novo ou aderido), vai para o Terminal Universal
      navigate(`/app/ensino/aluno/dashboard?section=dashboard${courseId ? `&courseId=${courseId}` : ''}`)
    }
  }

  const courseModules = [
    {
      id: 1,
      title: 'Introdução à Cannabis Medicinal',
      duration: '8h',
      description: 'Fundamentos históricos, legais e científicos da cannabis medicinal',
      lessons: 4,
      completed: 4,
      color: 'from-green-500 to-emerald-600',
      status: 'Concluído'
    },
    {
      id: 2,
      title: 'Farmacologia e Biologia da Cannabis',
      duration: '12h',
      description: 'Mecanismos de ação, receptores e sistemas endocanabinoides',
      lessons: 6,
      completed: 2,
      color: 'from-emerald-500 to-green-600',
      status: 'Em Andamento'
    },
    {
      id: 3,
      title: 'Aspectos Legais e Éticos',
      duration: '6h',
      description: 'Regulamentação, prescrição e aspectos éticos do uso medicinal',
      lessons: 3,
      completed: 0,
      color: 'from-green-600 to-emerald-700',
      status: 'Pendente'
    },
    {
      id: 4,
      title: 'Aplicações Clínicas e Protocolos',
      duration: '15h',
      description: 'Indicações clínicas, protocolos de tratamento e monitoramento',
      lessons: 8,
      completed: 0,
      color: 'from-teal-600 to-green-700',
      status: 'Pendente'
    },
    {
      id: 5,
      title: 'Avaliação e Monitoramento de Pacientes',
      duration: '8h',
      description: 'Ferramentas de avaliação, acompanhamento e ajuste de protocolos',
      lessons: 4,
      completed: 0,
      color: 'from-teal-500 to-green-500',
      status: 'Pendente'
    },
    {
      id: 6,
      title: 'Estudos de Caso e Práticas Clínicas',
      duration: '10h',
      description: 'Análise de casos reais e simulações práticas',
      lessons: 5,
      completed: 0,
      color: 'from-emerald-600 to-teal-700',
      status: 'Pendente'
    },
    {
      id: 7,
      title: 'Pesquisa Científica e Produção de Artigos',
      duration: '6h',
      description: 'Metodologia de pesquisa e publicação científica',
      lessons: 3,
      completed: 0,
      color: 'from-green-700 to-emerald-800',
      status: 'Pendente'
    },
    {
      id: 8,
      title: 'Avaliação Final e Certificação',
      duration: '5h',
      description: 'Prova final e obtenção do certificado',
      lessons: 2,
      completed: 0,
      color: 'from-teal-500 to-green-600',
      status: 'Pendente'
    }
  ]

  const [selectedModule, setSelectedModule] = useState<number | null>(null)
  const [selectedLesson, setSelectedLesson] = useState<number | null>(null)
  const [activeSection, setActiveSection] = useState<EnsinoSection>('dashboard')
  const userRole = (user as any)?.role || (user as any)?.user_metadata?.role || (user as any)?.type || 'paciente'
  const isAdmin = userRole === 'admin' || userRole === 'master'

  // V1.9.495 Sprint E V1 — News & Eventos (real DB, substitui mock newsletterUpdates).
  // onlyPublished: admin vê drafts também (RLS bypassa); paciente/aluno vê só published.
  const news = useNewsItems(!isAdmin, undefined, 30)
  const [newsModalOpen, setNewsModalOpen] = useState(false)
  const [editingNewsItem, setEditingNewsItem] = useState<NewsItem | undefined>(undefined)
  const [newsDeleting, setNewsDeleting] = useState<string | null>(null)

  const handleNewsSubmit = async (input: any) => {
    if (editingNewsItem) {
      return news.update(editingNewsItem.id, input)
    }
    return news.create(input)
  }
  const handleEditNewsItem = (item: NewsItem) => {
    setEditingNewsItem(item)
    setNewsModalOpen(true)
  }
  const handleCreateNewsItem = () => {
    setEditingNewsItem(undefined)
    setNewsModalOpen(true)
  }
  const handleDeleteNewsItem = async (id: string) => {
    if (!confirm('Excluir esta notícia/evento? Ação não reversível.')) return
    setNewsDeleting(id)
    await news.remove(id)
    setNewsDeleting(null)
  }
  const handleToggleNewsPublished = async (item: NewsItem) => {
    await news.togglePublished(item.id, !item.published)
  }

  // V1.9.496 Sprint E V2 — Evaluation Instruments (real DB, substitui mock).
  const evaluations = useEvaluationInstruments(!isAdmin, 30)
  const [evalModalOpen, setEvalModalOpen] = useState(false)
  const [editingEvalItem, setEditingEvalItem] = useState<EvaluationInstrument | undefined>(undefined)
  const [evalDeleting, setEvalDeleting] = useState<string | null>(null)

  const handleEvalSubmit = async (input: any) => {
    if (editingEvalItem) {
      return evaluations.update(editingEvalItem.id, input)
    }
    return evaluations.create(input)
  }
  const handleEditEvalItem = (item: EvaluationInstrument) => {
    setEditingEvalItem(item)
    setEvalModalOpen(true)
  }
  const handleCreateEvalItem = () => {
    setEditingEvalItem(undefined)
    setEvalModalOpen(true)
  }
  const handleDeleteEvalItem = async (id: string) => {
    if (!confirm('Excluir este instrumento de avaliação? Submissões vinculadas serão removidas em cascata. Ação não reversível.')) return
    setEvalDeleting(id)
    await evaluations.remove(id)
    setEvalDeleting(null)
  }
  const handleToggleEvalPublished = async (item: EvaluationInstrument) => {
    await evaluations.togglePublished(item.id, !item.published)
  }

  // V1.9.497 Sprint E V3 — Mentoria (real DB). Substitui array mock
  // mentorshipPrograms + handler antigo (que escrevia em appointments com
  // doctor_id string — anti-padrão).
  const mentorship = useMentorship()
  const handleRequestMentorshipReal = (m: MentorProfile) => {
    if (m.slug === 'noa-esperanca') {
      // IA Nôa — abre chat direto, não cria request
      toggleChat()
      return
    }
    setSelectedMentor(m)
  }
  const handleSubmitMentorshipReal = mentorship.submitRequest
  const handleCancelMentorshipRequest = async (id: string) => {
    if (!confirm('Cancelar esta solicitação?')) return
    await mentorship.cancelRequest(id)
  }

  // Carregar matrículas do usuário
  useEffect(() => {
    if (user) {
      loadUserEnrollments()
    }
  }, [user])

  const loadUserEnrollments = async () => {
    if (!user) return
    setIsLoadingCourses(true)
    try {
      const { data, error } = await supabase
        .from('course_enrollments')
        .select('*, courses(*)')
        .eq('user_id', user.id)

      if (error) throw error
      setEnrolledCourses(data || [])
    } catch (err) {
      console.error('Erro ao carregar matrículas:', err)
    } finally {
      setIsLoadingCourses(false)
    }
  }

  const sectionParamMap = useMemo<Record<string, EnsinoSection>>(() => ({
    aulas: 'aulas',
    biblioteca: 'biblioteca',
    avaliacao: 'avaliacao',
    newsletter: 'newsletter',
    'chat-profissionais': 'mentoria'
  }), [])

  useEffect(() => {
    if (forcedSection) {
      if (forcedSection !== activeSection) {
        setActiveSection(forcedSection)
      }
      return
    }

    const sectionParam = searchParams.get('section')
    if (sectionParam && sectionParamMap[sectionParam]) {
      const normalized = sectionParamMap[sectionParam]
      if (normalized !== activeSection) {
        setActiveSection(normalized)
      }
      return
    }

    if (!sectionParam && activeSection !== 'dashboard' && location.pathname.includes('/app/ensino')) {
      setActiveSection('dashboard')
    }
  }, [searchParams, sectionParamMap, activeSection, location.pathname, forcedSection])

  const updateSectionParam = (section: EnsinoSection) => {
    const newParams = new URLSearchParams(searchParams)
    if (section === 'dashboard') {
      newParams.delete('section')
    } else {
      const paramValue = section === 'mentoria' ? 'chat-profissionais' : section
      newParams.set('section', paramValue)
    }
    setSearchParams(newParams, { replace: true })
  }

  const handleSectionChange = (section: EnsinoSection) => {
    setActiveSection(section)
    updateSectionParam(section)
  }

  const handleSectionChangeRef = useRef(handleSectionChange)
  handleSectionChangeRef.current = handleSectionChange

  // Header triggers (cards por usabilidade do perfil ensino) + cérebro Nôa (ref evita loop de setState)
  const ensinoTriggerOptions: { id: EnsinoSection; label: string; icon: typeof GraduationCap }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: GraduationCap },
    { id: 'aulas', label: 'Aulas', icon: BookOpen },
    { id: 'biblioteca', label: 'Biblioteca', icon: BookOpen },
    { id: 'avaliacao', label: 'Avaliação', icon: Award },
    { id: 'newsletter', label: 'Newsletter', icon: MessageCircle },
    { id: 'mentoria', label: 'Mentoria', icon: Users }
  ]
  useEffect(() => {
    setDashboardTriggers({
      options: ensinoTriggerOptions.map(o => ({ id: o.id, label: o.label, icon: o.icon })),
      activeId: activeSection,
      onChange: (id) => handleSectionChangeRef.current(id as EnsinoSection),
      onBrainClick: () => { if (isNoaOpen) closeChat(); else openNoaChat() }
    })
    return () => setDashboardTriggers(null)
  }, [activeSection, openNoaChat, closeChat, isNoaOpen, setDashboardTriggers])

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Em Andamento': return 'text-emerald-400'
      case 'Concluído': return 'text-green-400'
      case 'Pendente': return 'text-teal-400'
      case 'Aguardando Inscrição': return 'text-green-300'
      default: return 'text-slate-400'
    }
  }

  const getProgressColor = (progress: number) => {
    if (progress >= 80) return 'bg-green-500'
    if (progress >= 50) return 'bg-emerald-500'
    return 'bg-teal-500'
  }

  const libraryCollections = [
    {
      id: 'manual-cannabis',
      title: 'Manual Clínico de Cannabis Medicinal',
      description: 'Protocolos clínicos, interações medicamentosas e diretrizes de prescrição.',
      format: 'PDF • 86 páginas',
      highlight: 'Atualizado em outubro/2025',
      color: 'from-green-500 to-teal-500'
    },
    {
      id: 'biblioteca-aec',
      title: 'Coleção Arte da Entrevista Clínica',
      description: 'Casos clínicos, roteiros de simulação e guias de supervisão formativa.',
      format: 'Toolkit • 12 roteiros',
      highlight: 'Inclui vídeos comentados',
      color: 'from-emerald-500 to-teal-600'
    },
    {
      id: 'referencias-nefro',
      title: 'Referências em Nefrologia Integrativa',
      description: 'Estudos, biomarcadores e guidelines combinando nefrologia e cannabis.',
      format: 'Base científica • 48 artigos',
      highlight: 'Curadoria Dr. Ricardo Valença',
      color: 'from-green-600 to-emerald-700'
    }
  ]

  // V1.9.496 Sprint E V2 — Mock evaluationInstruments REMOVIDO. Substituído por
  // useEvaluationInstruments hook (tabela `public.evaluation_instruments` + RLS +
  // 3 instrumentos seedados via PAT). Participants = COUNT real de
  // evaluation_submissions (honesto: empty = 0).

  // V1.9.497 Sprint E V3 — Mock mentorshipPrograms REMOVIDO. Substituído por
  // useMentorship hook (tabela `public.mentor_profiles` + RLS + 3 mentores
  // seedados via PAT). 3 mentores originais preservados: Ricardo / Eduardo / Nôa.


  // V1.9.495 Sprint E V1 — Mock newsletterUpdates REMOVIDO. Substituído por
  // useNewsItems hook que carrega da tabela `public.news` (schema 18 cols + RLS).
  // Admin cadastra via NewsItemAdminModal; público vê só published=true.

  // highlightGradient específico desta página (não existe no designSystem)
  const highlightGradient = 'linear-gradient(135deg, rgba(0,193,106,0.22) 0%, rgba(16,49,91,0.38) 55%, rgba(7,22,41,0.82) 100%)'

  const navButtonBase = 'flex items-center space-x-1 md:space-x-2 px-2 md:px-3 lg:px-4 py-1.5 md:py-2 transition-all text-xs md:text-sm rounded-lg font-medium'

  const getNavButtonStyle = (section?: EnsinoSection) => {
    const isActive = section ? activeSection === section : false
    return {
      className: `${navButtonBase} ${isActive ? 'text-white shadow-lg' : 'text-[#C8D6E5] hover:text-white'}`,
      style: isActive
        ? { background: accentGradient, border: '1px solid rgba(0,193,106,0.35)' }
        : { background: 'rgba(12,34,54,0.55)', border: '1px solid rgba(0,193,106,0.08)' }
    }
  }

  const navStyles = {
    dashboard: getNavButtonStyle('dashboard'),
    aulas: getNavButtonStyle('aulas'),
    default: getNavButtonStyle()
  }

  // V1.9.497 Sprint E V3 — Handlers antigos REMOVIDOS. Substituídos por
  // handleRequestMentorshipReal + handleSubmitMentorshipReal acima (que usam
  // useMentorship hook + tabela mentorship_requests + RLS).
  // Handler antigo escrevia em `appointments` com `doctor_id` string
  // ('ricardo-valenca'/'eduardo-faveret') — anti-padrão UUID (appointments.doctor_id
  // é uuid). Notification dual-write também removido (preferir trigger SQL futuro
  // se quiser notification automática quando mentorship_requests inserir).

  return (
    <div
      className="min-h-screen text-white"
      style={{ background: backgroundGradient }}
      data-page="ensino-dashboard"
    >
      {/* Header */}
      <div
        className="p-3 md:p-4 lg:p-6"
        style={{ background: 'linear-gradient(135deg, rgba(10,25,47,0.96) 0%, rgba(26,54,93,0.92) 55%, rgba(45,90,61,0.9) 100%)', borderBottom: '1px solid rgba(0,193,106,0.18)' }}
      >
        <div className="flex items-center justify-between stack-tablet">
          <div className="flex items-center space-x-2 md:space-x-4 min-w-0 flex-1 stack-mobile">
            <button
              onClick={() => handleNavigate('/app/dashboard')}
              className="flex items-center space-x-1 md:space-x-2 text-slate-300 hover:text-white transition-colors flex-shrink-0"
            >
              <ArrowLeft className="w-4 h-4 md:w-5 md:h-5" />
              <span className="hidden sm:inline text-sm md:text-base">Voltar</span>
            </button>
            <div className="min-w-0 flex-1">
              <h1 className="text-lg md:text-xl lg:text-2xl font-bold text-white truncate">🕹️ Terminal de Ensino</h1>
              <p className="text-xs md:text-sm text-slate-400 hidden sm:block">Workstation profissional de estudos e especializações</p>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Buttons - Horizontal */}
      <div
        className="p-2 md:p-3 lg:p-4"
        style={{ background: 'rgba(12, 31, 54, 0.85)', borderBottom: '1px solid rgba(19, 68, 86, 0.6)' }}
      >
        <nav className="flex flex-wrap gap-1 md:gap-2 justify-center">
          <button
            onClick={() => {
              handleSectionChange('dashboard')
              handleNavigate('/app/ensino/aluno/dashboard')
            }}
            className={navStyles.dashboard.className}
            style={navStyles.dashboard.style}
          >
            <LayoutDashboard className="w-4 h-4 md:w-5 md:h-5 flex-shrink-0" />
            <span className="hidden sm:inline">📊 Visão Geral</span>
          </button>
          <button
            onClick={() => handleSectionChange('aulas')}
            className={navStyles.aulas.className}
            style={navStyles.aulas.style}
          >
            <LayoutDashboard className="w-4 h-4 md:w-5 md:h-5 flex-shrink-0" />
            <span className="hidden sm:inline">🕹️ Terminal de Cursos</span>
          </button>
          {isAdmin && (
            <>
              <button
                onClick={() => handleNavigate('/app/ensino/profissional/gestao-alunos')}
                className={navStyles.default.className}
                style={navStyles.default.style}
              >
                <Users className="w-4 h-4 md:w-5 md:h-5 flex-shrink-0" />
                <span className="hidden sm:inline">👥 Gestão de Alunos</span>
              </button>
              <button
                onClick={() => handleNavigate('/app/ensino/profissional/preparacao-aulas')}
                className={navStyles.default.className}
                style={navStyles.default.style}
              >
                <FileText className="w-4 h-4 md:w-5 md:h-5 flex-shrink-0" />
                <span className="hidden sm:inline">📝 Ferramentas</span>
              </button>
            </>
          )}
          <button
            onClick={() => handleNavigate('/app/library')}
            className={navStyles.default.className}
            style={navStyles.default.style}
          >
            <BookOpen className="w-4 h-4 md:w-5 md:h-5 flex-shrink-0" />
            <span className="hidden sm:inline">📚 Biblioteca</span>
          </button>
          {isAdmin && (
            <button
              onClick={() => handleNavigate('/app/ensino/profissional/dashboard')}
              className={navStyles.default.className}
              style={navStyles.default.style}
            >
              <Calendar className="w-4 h-4 md:w-5 md:h-5 flex-shrink-0" />
              <span className="hidden sm:inline">📅 Calendário</span>
            </button>
          )}
        </nav>
      </div>

      {/* Main Content */}
      <div className="p-2 md:p-4 lg:p-6 overflow-x-hidden w-full">
        <div className="max-w-7xl mx-auto w-full overflow-x-hidden">
          {/* Dashboard do Aluno */}
          {activeSection === 'dashboard' && (
            <div className="mb-4 md:mb-6 lg:mb-8 w-full overflow-x-hidden">
              <AlunoDashboard />
            </div>
          )}

          {/* Cursos Disponíveis (Visão Geral para Aluno ou ADM) */}
          {activeSection === 'aulas' && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
               <div className="flex items-center justify-between mb-2">
                <div>
                  <h2 className="text-2xl font-bold text-white mb-1">📚 Catálogo e Turmas Ativas</h2>
                  <p className="text-slate-400">Explore novos cursos ou gerencie as turmas em andamento.</p>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Aqui voltamos a mostrar o catálogo ou links de gestão para o ADM */}
                <div className="bg-slate-900/40 p-6 rounded-2xl border border-slate-800">
                  <h3 className="text-xl font-bold text-white mb-4">🌿 Pós-graduação em Cannabis</h3>
                  <p className="text-slate-400 mb-6 font-light">Gestão de módulos, aulas e materiais didáticos desta especialização.</p>
                  <button onClick={() => navigate('/app/ensino/profissional/pos-graduacao-cannabis')} className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl transition-all">
                    Gerenciar Curso
                  </button>
                </div>
                <div className="bg-slate-900/40 p-6 rounded-2xl border border-slate-800">
                  <h3 className="text-xl font-bold text-white mb-4">🎭 Arte da Entrevista Clínica</h3>
                  <p className="text-slate-400 mb-6 font-light">Acompanhamento de mentorias, simulações e rubricas AEC.</p>
                  <button onClick={() => navigate('/app/arte-entrevista-clinica')} className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl transition-all">
                    Acessar Terminal AEC
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Biblioteca */}
          {activeSection === 'biblioteca' && (
            <div className="space-y-6">
              <div className="rounded-xl p-4 md:p-6" style={surfaceStyle}>
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div>
                    <h3 className="text-xl md:text-2xl font-semibold text-white">Biblioteca Acadêmica</h3>
                    <p className="text-sm md:text-base text-slate-300 max-w-3xl">
                      Curadoria de conteúdos clínicos, guias metodológicos e bases científicas integradas aos eixos de ensino, clínica e pesquisa.
                    </p>
                  </div>
                  <button
                    onClick={() => navigate('/app/library')}
                    className="px-4 py-2 rounded-lg font-semibold text-white"
                    style={{ background: 'linear-gradient(135deg, #00C16A 0%, #13794f 100%)' }}
                  >
                    Acessar Biblioteca Completa
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {libraryCollections.map(collection => (
                  <div key={collection.id} className="rounded-xl p-4 md:p-5 text-white shadow-lg" style={{ background: `linear-gradient(145deg, rgba(7,22,41,0.92) 10%, rgba(7,22,41,0.65) 50%, rgba(7,22,41,0.92) 100%)`, border: '1px solid rgba(0,193,106,0.12)' }}>
                    <div className={`w-12 h-12 rounded-lg mb-4 bg-gradient-to-r ${collection.color} flex items-center justify-center text-white text-xl font-bold`}>📘</div>
                    <h4 className="text-lg font-semibold mb-2">{collection.title}</h4>
                    <p className="text-slate-300 text-sm mb-3">{collection.description}</p>
                    <div className="text-xs text-slate-300 mb-2">{collection.format}</div>
                    <div className="text-xs text-[#FFD33D]">{collection.highlight}</div>
                  </div>
                ))}
              </div>

              <div className="rounded-xl p-4 md:p-6" style={surfaceStyle}>
                <h4 className="text-lg font-semibold text-white mb-4">Ferramentas em Destaque</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="rounded-lg p-4" style={cardStyle}>
                    <h5 className="font-semibold text-white mb-2">LabPEC Playlists</h5>
                    <p className="text-sm text-slate-300">Sequências de vídeos comentados das simulações clínicas com indicadores da IA.</p>
                  </div>
                  <div className="rounded-lg p-4" style={cardStyle}>
                    <h5 className="font-semibold text-white mb-2">Repositório de Protocolos</h5>
                    <p className="text-sm text-slate-300">Protocolos clínicos, formulários e listas de verificação prontos para uso em aulas e clínicas.</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* V1.9.496 Sprint E Vertical 2 — Instrumentos de Avaliação plantados (real DB).
              Tabelas evaluation_instruments + evaluation_submissions criadas via PAT
              migration + RLS + seed 3 instrumentos originais (Rubrica AEC 360º, Casos,
              Portfolio). Contagem participantes = COUNT real de evaluation_submissions
              (honesto: empty = 0, não inventa "128 participantes" como mock antigo). */}
          {activeSection === 'avaliacao' && (
            <div className="space-y-6">
              <div className="rounded-xl p-4 md:p-6" style={surfaceStyle}>
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                  <div>
                    <h3 className="text-xl md:text-2xl font-semibold text-white mb-2">Instrumentos de Avaliação</h3>
                    <p className="text-sm md:text-base text-slate-300">Ferramentas para acompanhamento do progresso acadêmico, avaliações formativas e certificações.</p>
                  </div>
                  {isAdmin && (
                    <button
                      type="button"
                      onClick={handleCreateEvalItem}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-amber-500/15 text-amber-200 border border-amber-500/40 rounded hover:bg-amber-500/25 transition-colors flex-shrink-0"
                    >
                      <PlusCircle className="w-4 h-4" />
                      Novo instrumento
                    </button>
                  )}
                </div>
              </div>

              {evaluations.loading ? (
                <div className="rounded-xl p-8 flex items-center justify-center" style={surfaceStyle}>
                  <Loader2 className="w-5 h-5 text-amber-300 animate-spin" />
                  <span className="ml-2 text-sm text-slate-400">Carregando…</span>
                </div>
              ) : evaluations.error ? (
                <div className="rounded-xl p-4 border border-red-500/30 bg-red-500/10">
                  <p className="text-sm text-red-300">Erro: {evaluations.error}</p>
                </div>
              ) : evaluations.items.length === 0 ? (
                <div className="rounded-xl p-8 text-center" style={surfaceStyle}>
                  <Inbox className="w-10 h-10 text-slate-600 mx-auto mb-2" />
                  <p className="text-sm text-slate-400 mb-1">Nenhum instrumento publicado.</p>
                  <p className="text-xs text-slate-500">
                    {isAdmin
                      ? 'Clique em "Novo instrumento" pra cadastrar o primeiro.'
                      : 'Aguarde — os administradores estão preparando os instrumentos.'}
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {evaluations.items.map((tool) => (
                    <div
                      key={tool.id}
                      className={`rounded-xl p-4 relative ${!tool.published ? 'border border-slate-600/50' : ''}`}
                      style={cardStyle}
                    >
                      {!tool.published && isAdmin && (
                        <span className="absolute top-2 right-2 text-[9px] uppercase px-1.5 py-0.5 rounded bg-slate-700/60 text-slate-300 flex items-center gap-1">
                          <EyeOff className="w-2.5 h-2.5" /> Rascunho
                        </span>
                      )}
                      <div className="flex items-center gap-2 mb-2 text-[10px] uppercase tracking-wide">
                        <span className={getInstrumentCategoryColor(tool.category)}>
                          {getInstrumentCategoryLabel(tool.category)}
                        </span>
                        <span className={`px-1.5 py-0.5 rounded ${getInstrumentStatusBadge(tool.status)}`}>
                          {getInstrumentStatusLabel(tool.status)}
                        </span>
                      </div>
                      <h4 className="text-lg font-semibold text-white mb-2">{tool.title}</h4>
                      <p className="text-sm text-slate-300 mb-4 line-clamp-3">{tool.description}</p>
                      <div className="flex items-center justify-between text-xs text-slate-300 stack-mobile">
                        <span className="flex items-center gap-1">
                          <Users className="w-3 h-3" />
                          {tool.submissionsCount ?? 0} {tool.submissionsCount === 1 ? 'participante' : 'participantes'}
                        </span>
                        {tool.total_points && (
                          <span className="text-slate-500">{tool.total_points} pts</span>
                        )}
                      </div>
                      {isAdmin && (
                        <div className="flex items-center gap-1 mt-3 pt-3 border-t border-slate-700/50">
                          <button
                            type="button"
                            onClick={() => handleEditEvalItem(tool)}
                            className="flex items-center gap-1 px-2 py-1 text-[11px] text-slate-300 hover:text-amber-200 hover:bg-amber-500/10 rounded transition-colors"
                            title="Editar"
                          >
                            <Pencil className="w-3 h-3" />
                            Editar
                          </button>
                          <button
                            type="button"
                            onClick={() => handleToggleEvalPublished(tool)}
                            className="flex items-center gap-1 px-2 py-1 text-[11px] text-slate-300 hover:text-emerald-200 hover:bg-emerald-500/10 rounded transition-colors"
                            title={tool.published ? 'Despublicar' : 'Publicar'}
                          >
                            {tool.published ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                            {tool.published ? 'Despublicar' : 'Publicar'}
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteEvalItem(tool.id)}
                            disabled={evalDeleting === tool.id}
                            className="flex items-center gap-1 px-2 py-1 text-[11px] text-slate-300 hover:text-red-300 hover:bg-red-500/10 rounded transition-colors ml-auto disabled:opacity-50"
                            title="Excluir"
                          >
                            {evalDeleting === tool.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Trash2 className="w-3 h-3" />}
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              <div className="rounded-xl p-4 md:p-6" style={surfaceStyle}>
                <h4 className="text-lg font-semibold text-white mb-3">Fluxo Acadêmico AEC</h4>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  {['Diagnóstico Formativo', 'Simulação Supervisionada', 'Feedback Longitudinal', 'Certificação Final'].map((step, index) => (
                    <div key={step} className="rounded-lg p-4 flex flex-col space-y-2" style={cardStyle}>
                      <div className="text-[#FFD33D] font-semibold">Etapa {index + 1}</div>
                      <div className="text-white font-semibold">{step}</div>
                      <p className="text-xs text-slate-300">
                        {index === 0 && 'Autoavaliação e planos de desenvolvimento individual com apoio da IA.'}
                        {index === 1 && 'Role-playing no LabPEC com roteiros temáticos e observadores especializados.'}
                        {index === 2 && 'Métricas da IA combinadas ao feedback qualitativo dos mentores.'}
                        {index === 3 && 'Prova prática e apresentação de caso integrador para banca docente.'}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* V1.9.495 Sprint E Vertical 1 — Notícias & Eventos plantadas (real DB).
              Mock newsletterUpdates substituído por query useNewsItems. Admin pode
              criar/editar/publicar/deletar via modal NewsItemAdminModal. Empty state
              honesto (não inventa rows). RLS protege: público vê published; admin vê
              drafts também. */}
          {activeSection === 'newsletter' && (
            <div className="space-y-6">
              <div className="rounded-xl p-4 md:p-6" style={surfaceStyle}>
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                  <div>
                    <h3 className="text-xl md:text-2xl font-semibold text-white mb-2">Notícias & Eventos</h3>
                    <p className="text-sm md:text-base text-slate-300">Acompanhe os eventos da pós-graduação, novidades dos eixos integrados e pesquisas em destaque.</p>
                  </div>
                  {isAdmin && (
                    <button
                      type="button"
                      onClick={handleCreateNewsItem}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-amber-500/15 text-amber-200 border border-amber-500/40 rounded hover:bg-amber-500/25 transition-colors flex-shrink-0"
                    >
                      <PlusCircle className="w-4 h-4" />
                      Nova notícia
                    </button>
                  )}
                </div>
              </div>

              {news.loading ? (
                <div className="rounded-xl p-8 flex items-center justify-center" style={surfaceStyle}>
                  <Loader2 className="w-5 h-5 text-amber-300 animate-spin" />
                  <span className="ml-2 text-sm text-slate-400">Carregando…</span>
                </div>
              ) : news.error ? (
                <div className="rounded-xl p-4 border border-red-500/30 bg-red-500/10">
                  <p className="text-sm text-red-300">Erro: {news.error}</p>
                </div>
              ) : news.items.length === 0 ? (
                <div className="rounded-xl p-8 text-center" style={surfaceStyle}>
                  <Inbox className="w-10 h-10 text-slate-600 mx-auto mb-2" />
                  <p className="text-sm text-slate-400 mb-1">Nenhuma notícia ou evento ainda.</p>
                  <p className="text-xs text-slate-500">
                    {isAdmin
                      ? 'Clique em "Nova notícia" pra cadastrar o primeiro item.'
                      : 'Aguarde — os administradores estão preparando o conteúdo.'}
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {news.items.map((item) => (
                    <div
                      key={item.id}
                      className={`rounded-xl p-4 relative ${!item.published ? 'border border-slate-600/50' : ''}`}
                      style={cardStyle}
                    >
                      {/* Badge "Rascunho" quando admin vê draft */}
                      {!item.published && isAdmin && (
                        <span className="absolute top-2 right-2 text-[9px] uppercase px-1.5 py-0.5 rounded bg-slate-700/60 text-slate-300 flex items-center gap-1">
                          <EyeOff className="w-2.5 h-2.5" /> Rascunho
                        </span>
                      )}
                      <div className="flex items-center justify-between mb-2 text-xs text-slate-300 stack-mobile">
                        <span className={`uppercase tracking-wide ${getCategoryColor(item.category)}`}>
                          {getCategoryLabel(item.category)}
                        </span>
                        <span>{new Date(item.date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                      </div>
                      <h4 className="text-lg font-semibold text-white mb-2">{item.title}</h4>
                      <p className="text-sm text-slate-300">{item.summary}</p>
                      {item.author && (
                        <p className="text-[11px] text-slate-500 mt-2">— {item.author}{item.read_time ? ` · ${item.read_time}` : ''}</p>
                      )}
                      {item.url && (
                        <a
                          href={item.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-[11px] text-amber-300 hover:text-amber-200 mt-2"
                        >
                          <ExternalLink className="w-3 h-3" />
                          Saiba mais
                        </a>
                      )}
                      {isAdmin && (
                        <div className="flex items-center gap-1 mt-3 pt-3 border-t border-slate-700/50">
                          <button
                            type="button"
                            onClick={() => handleEditNewsItem(item)}
                            className="flex items-center gap-1 px-2 py-1 text-[11px] text-slate-300 hover:text-amber-200 hover:bg-amber-500/10 rounded transition-colors"
                            title="Editar"
                          >
                            <Pencil className="w-3 h-3" />
                            Editar
                          </button>
                          <button
                            type="button"
                            onClick={() => handleToggleNewsPublished(item)}
                            className="flex items-center gap-1 px-2 py-1 text-[11px] text-slate-300 hover:text-emerald-200 hover:bg-emerald-500/10 rounded transition-colors"
                            title={item.published ? 'Despublicar' : 'Publicar'}
                          >
                            {item.published ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                            {item.published ? 'Despublicar' : 'Publicar'}
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteNewsItem(item.id)}
                            disabled={newsDeleting === item.id}
                            className="flex items-center gap-1 px-2 py-1 text-[11px] text-slate-300 hover:text-red-300 hover:bg-red-500/10 rounded transition-colors ml-auto disabled:opacity-50"
                            title="Excluir"
                          >
                            {newsDeleting === item.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Trash2 className="w-3 h-3" />}
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* V1.9.495 Sprint E V1 — Modal admin News (renderizado fora da section
              pra evitar unmount em troca de section). */}
          <NewsItemAdminModal
            isOpen={newsModalOpen}
            onClose={() => { setNewsModalOpen(false); setEditingNewsItem(undefined) }}
            initialItem={editingNewsItem}
            onSubmit={handleNewsSubmit}
          />

          {/* V1.9.496 Sprint E V2 — Modal admin Evaluation Instruments */}
          <EvaluationInstrumentAdminModal
            isOpen={evalModalOpen}
            onClose={() => { setEvalModalOpen(false); setEditingEvalItem(undefined) }}
            initialItem={editingEvalItem}
            onSubmit={handleEvalSubmit}
          />

          {/* V1.9.497 Sprint E Vertical 3 — Mentoria plantada (real DB).
              Mock mentorshipPrograms substituído por useMentorship.mentors. Solicitação
              via MentorshipRequestModal (escreve em mentorship_requests com RLS).
              IA Nôa (slug 'noa-esperanca') abre chat direto. */}
          {activeSection === 'mentoria' && (
            <div className="space-y-6">
              <div className="rounded-xl p-4 md:p-6" style={surfaceStyle}>
                <h3 className="text-xl md:text-2xl font-semibold text-white mb-2">Mentoria e Tutoria</h3>
                <p className="text-sm md:text-base text-slate-300">Conecte-se com o corpo docente, agende supervisões e acompanhe as agendas do LabPEC.</p>
              </div>

              {mentorship.loading ? (
                <div className="rounded-xl p-8 flex items-center justify-center" style={surfaceStyle}>
                  <Loader2 className="w-5 h-5 text-emerald-300 animate-spin" />
                  <span className="ml-2 text-sm text-slate-400">Carregando mentores…</span>
                </div>
              ) : mentorship.error ? (
                <div className="rounded-xl p-4 border border-red-500/30 bg-red-500/10">
                  <p className="text-sm text-red-300">Erro: {mentorship.error}</p>
                </div>
              ) : mentorship.mentors.length === 0 ? (
                <div className="rounded-xl p-8 text-center" style={surfaceStyle}>
                  <Inbox className="w-10 h-10 text-slate-600 mx-auto mb-2" />
                  <p className="text-sm text-slate-400 mb-1">Nenhum mentor disponível no momento.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {mentorship.mentors.map((m) => (
                    <div key={m.id} className="rounded-2xl border border-[#00C16A]/20 bg-gradient-to-br from-[#0A192F] via-[#102C45] to-[#1F4B38] p-5 shadow-xl">
                      <div className="mb-4">
                        <h4 className="text-xl font-bold text-white mb-1">{m.display_name}</h4>
                        <p className="text-sm text-emerald-400">{m.role}</p>
                      </div>
                      <div className="space-y-2 text-sm text-slate-300 mb-4">
                        {m.availability && <p><strong className="text-white">Disponibilidade:</strong> {m.availability}</p>}
                        {m.channel && <p><strong className="text-white">Canal:</strong> {m.channel}</p>}
                        {m.focus && <p><strong className="text-white">Foco:</strong> {m.focus}</p>}
                      </div>
                      <button
                        onClick={() => handleRequestMentorshipReal(m)}
                        className="mt-4 w-full px-4 py-3 rounded-lg font-semibold text-white transition-all hover:scale-105 hover:shadow-xl"
                        style={{ background: accentGradient }}
                      >
                        {m.slug === 'noa-esperanca' ? 'Abrir chat com a Nôa' : 'Solicitar Mentoria'}
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* V1.9.497 — Minhas solicitações (visível pra todos com requests) */}
              {mentorship.myRequests.length > 0 && (
                <div className="rounded-xl p-4 md:p-6" style={surfaceStyle}>
                  <h4 className="text-lg font-semibold text-white mb-3">Minhas Solicitações</h4>
                  <div className="space-y-2">
                    {mentorship.myRequests.slice(0, 5).map((req) => {
                      const mentor = mentorship.mentors.find((m) => m.id === req.mentor_profile_id)
                      const statusMeta = MENTORSHIP_STATUS_LABELS[req.status]
                      return (
                        <div key={req.id} className="flex flex-col md:flex-row md:items-center gap-2 p-3 rounded-lg bg-slate-800/40 border border-slate-700/50">
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-semibold text-white truncate">{req.topic}</div>
                            <div className="text-[11px] text-slate-400 mt-0.5">
                              {mentor?.display_name || 'Mentor'} · {req.preferred_date} {req.preferred_time}
                            </div>
                          </div>
                          <span className={`text-[10px] uppercase px-2 py-0.5 rounded-full border ${statusMeta.color}`}>
                            {statusMeta.label}
                          </span>
                          {req.status === 'pending' && (
                            <button
                              type="button"
                              onClick={() => handleCancelMentorshipRequest(req.id)}
                              className="text-[11px] text-slate-400 hover:text-red-300 transition-colors flex-shrink-0"
                            >
                              Cancelar
                            </button>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              <div className="rounded-xl p-4 md:p-6" style={surfaceStyle}>
                <h4 className="text-lg font-semibold text-white mb-3">LabPEC – Agenda Semanal</h4>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                  {[
                    { day: 'Terça', focus: 'Entrevistas AEC – Nefrologia', time: '14h às 20h' },
                    { day: 'Quarta', focus: 'Casos Integrados Cannabis & AEC', time: '14h às 20h' },
                    { day: 'Quinta', focus: 'Supervisão de Projetos Integradores', time: '14h às 20h' },
                    { day: 'Sábado', focus: 'Workshop presencial (quinzenal)', time: '09h às 13h' }
                  ].map(slot => (
                    <div key={slot.day} className="rounded-lg p-3" style={cardStyle}>
                      <div className="text-[#FFD33D] text-sm font-semibold">{slot.day}</div>
                      <div className="text-white font-semibold">{slot.focus}</div>
                      <div className="text-xs text-slate-300">{slot.time}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Chat Modal */}
      {
        isOpen && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-2 md:p-4">
            <div
              className="rounded-xl w-full max-w-md h-[90vh] max-h-[600px] flex flex-col overflow-hidden"
              style={{ background: 'rgba(7,22,41,0.95)', border: '1px solid rgba(0,193,106,0.12)', boxShadow: '0 20px 48px rgba(2,12,27,0.55)' }}
            >
              {/* Chat Header */}
              <div className="p-4" style={{ borderBottom: '1px solid rgba(0,193,106,0.12)' }}>
                <div className="flex items-center justify-between stack-mobile">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: accentGradient }}>
                      <GraduationCap className="w-4 h-4 text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-white">Nôa Esperança</h3>
                      <p className="text-xs text-slate-400">Tutora Acadêmica</p>
                    </div>
                  </div>
                  <button
                    onClick={toggleChat}
                    className="text-slate-400 hover:text-white transition-colors"
                  >
                    ×
                  </button>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.length === 0 ? (
                  <div className="text-center text-slate-300 py-8">
                    <GraduationCap className="w-12 h-12 mx-auto mb-3" style={{ color: '#00F5A0' }} />
                    <p className="text-sm">Olá! Sou a Nôa Esperança, sua tutora acadêmica.</p>
                  </div>
                ) : (
                  messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[70%] px-4 py-2 rounded-lg text-sm ${message.type === 'user'
                          ? 'text-white'
                          : 'text-slate-100'
                          }`}
                        style={
                          message.type === 'user'
                            ? { background: accentGradient }
                            : { background: 'rgba(12,34,54,0.72)', border: '1px solid rgba(0,193,106,0.08)' }
                        }
                      >
                        {message.content}
                      </div>
                    </div>
                  ))
                )}

                {isTyping && (
                  <div className="flex justify-start">
                    <div className="px-4 py-2 rounded-lg" style={{ background: 'rgba(12,34,54,0.72)', border: '1px solid rgba(0,193,106,0.08)' }}>
                      <div className="flex space-x-1">
                        <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" />
                        <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                        <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Input */}
              <div className="p-4" style={{ borderTop: '1px solid rgba(0,193,106,0.12)' }}>
                <div className="flex items-center space-x-2">
                  <input
                    type="text"
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Digite sua mensagem..."
                    className="flex-1 px-3 py-2 rounded-lg text-white placeholder-slate-400 focus:outline-none"
                    style={{ background: 'rgba(12,34,54,0.78)', border: '1px solid rgba(0,193,106,0.18)' }}
                  />
                  <button
                    onClick={handleSendMessage}
                    disabled={!inputMessage.trim()}
                    className="p-2 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{ background: accentGradient }}
                  >
                    <MessageCircle className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        )
      }

      {/* V1.9.497 Sprint E V3 — Modal antigo SUBSTITUÍDO por MentorshipRequestModal
          (componente standalone). Anti-padrão UUID resolvido: agora escreve em
          mentorship_requests.mentor_profile_id (UUID) ao invés de
          appointments.doctor_id (string). RLS protege requester_id = auth.uid(). */}
      <MentorshipRequestModal
        isOpen={!!selectedMentor && selectedMentor.slug !== 'noa-esperanca'}
        mentor={selectedMentor}
        onClose={() => setSelectedMentor(null)}
        onSubmit={handleSubmitMentorshipReal}
      />
    </div>
  )
}

export default EnsinoDashboard
