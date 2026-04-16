import React, { useState, useEffect, useMemo, useRef } from 'react'
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom'
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
  Video,
  Stethoscope,
  Trophy,
  Zap,
  FileText,
  Plus,
  Upload,
  Edit,
  Trash2,
  Link as ExternalLink,
  Menu as Layout,
  Database,
  Lightbulb,
  ArrowRight,
  Flag,
  ChevronDown,
  Monitor,
  LayoutDashboard,
  Lock
} from 'lucide-react'
import { useNoaPlatform } from '../contexts/NoaPlatformContext'
import { useDashboardTriggers } from '../contexts/DashboardTriggersContext'
import type { DashboardTriggerOption } from '../contexts/DashboardTriggersContext'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import NoaConversationalInterface from '../components/NoaConversationalInterface'
import SlidePlayer from '../components/SlidePlayer'

const FALLBACK_COURSE = {
  id: 'fallback-course-medcannlab',
  title: 'Pós-Graduação em Cannabis Medicinal',
  subtitle: 'Ambiente de Ensino, Clínica e Pesquisa - MedCannLab 3.0',
  description:
    'Programa completo com integração entre ensino, prática clínica supervisionada e pesquisa aplicada à cannabis medicinal.',
  progress: 45,
  status: 'Em Andamento',
  instructor: 'Equipe MedCannLab',
  duration: '60 horas',
  nextClass: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString('pt-BR'),
  color: 'from-green-400 to-green-500',
  logo: '🌿',
  studentsCount: 32,
  modules: [
    {
      id: 'fallback-module-1',
      title: 'Fundamentos da Cannabis Medicinal',
      description: 'História, legislação, componentes químicos e mecanismos de ação.',
      progress: 60,
      status: 'Em Andamento',
      duration: '180 minutos',
      lessons: []
    },
    {
      id: 'fallback-module-2',
      title: 'Protocolos Clínicos Integrativos',
      description: 'Integração com metodologias AEC, IMRE e planos terapêuticos personalizados.',
      progress: 20,
      status: 'Disponível',
      duration: '240 minutos',
      lessons: []
    }
  ]
}

import {
  backgroundGradient,
  headerGradient,
  surfaceStyle,
  secondarySurfaceStyle,
  cardStyle,
  accentGradient,
  secondaryGradient,
  goldenGradient
} from '../constants/designSystem'
const dangerGradient = 'linear-gradient(135deg, #FF5F6D 0%, #FFC371 100%)'

const tabBaseButton =
  'inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap'

const getTabButtonStyles = (active: boolean, gradient?: string) => {
  if (gradient) {
    return {
      className: `${tabBaseButton} text-white shadow-md`,
      style: { background: gradient, border: '1px solid rgba(0,0,0,0.05)' }
    }
  }

  return {
    className: `${tabBaseButton} ${active ? 'text-white shadow-lg' : 'text-[#C8D6E5]'}`,
    style: active
      ? { background: accentGradient, border: '1px solid rgba(0,193,106,0.35)' }
      : { background: 'rgba(12, 34, 54, 0.6)', border: '1px solid rgba(0,193,106,0.08)' }
  }
}

// Handler para efeito hover suave verde
const handleButtonHover = (e: React.MouseEvent<HTMLButtonElement>, isActive: boolean) => {
  if (!isActive) {
    e.currentTarget.style.background = 'rgba(0, 193, 106, 0.08)'
    e.currentTarget.style.borderColor = 'rgba(0,193,106,0.15)'
  }
}

const handleButtonLeave = (e: React.MouseEvent<HTMLButtonElement>, isActive: boolean) => {
  if (!isActive) {
    e.currentTarget.style.background = 'rgba(12, 34, 54, 0.6)'
    e.currentTarget.style.borderColor = 'rgba(0,193,106,0.08)'
  }
}

const handleButtonTouch = (e: React.TouchEvent<HTMLButtonElement>, isActive: boolean) => {
  if (!isActive) {
    e.currentTarget.style.background = 'rgba(0, 193, 106, 0.08)'
    e.currentTarget.style.borderColor = 'rgba(0,193,106,0.15)'
    setTimeout(() => {
      e.currentTarget.style.background = 'rgba(12, 34, 54, 0.6)'
      e.currentTarget.style.borderColor = 'rgba(0,193,106,0.08)'
    }, 150)
  }
}

const inputStyle: React.CSSProperties = {
  background: 'rgba(12,34,54,0.78)',
  border: '1px solid rgba(0,193,106,0.18)',
  color: '#E6F4FF',
  boxShadow: '0 10px 24px rgba(2,12,27,0.35)'
}

type StudentTab = 'dashboard' | 'redes-sociais' | 'noticias' | 'simulacoes' | 'teste' | 'biblioteca' | 'forum' | 'perfil'

const AlunoDashboard: React.FC = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const [searchParams, setSearchParams] = useSearchParams()
  const { user } = useAuth()
  const { openChat, closeChat, isOpen: isNoaOpen, sendInitialMessage, hideGlobalChat, showGlobalChat } = useNoaPlatform()
  const { setDashboardTriggers } = useDashboardTriggers()

  // Gerenciar visibilidade do chat global
  useEffect(() => {
    hideGlobalChat()
    return () => showGlobalChat()
  }, [hideGlobalChat, showGlobalChat])
  const [activeTab, setActiveTab] = useState<StudentTab>('dashboard')
  const [isSlidePlayerOpen, setIsSlidePlayerOpen] = useState(false)
  const [selectedSlideId, setSelectedSlideId] = useState<string | undefined>(undefined)
  const [mainCourse, setMainCourse] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [allEnrollments, setAllEnrollments] = useState<any[]>([])
  const [selectedEnrollmentId, setSelectedEnrollmentId] = useState<string | null>(null)
  const [availableCourses, setAvailableCourses] = useState<any[]>([])
  const [studentStats, setStudentStats] = useState({
    totalModules: 0,
    completedModules: 0,
    totalLessons: 0,
    completedLessons: 0,
    totalTests: 0,
    completedTests: 0,
    forumPosts: 0,
    libraryAccess: 0,
    daysOnPlatform: 0,
    overallProgress: 0
  })

  const navItems = useMemo<DashboardTriggerOption[]>(
    () => [
      { id: 'dashboard', label: 'Dashboard', icon: Layout as DashboardTriggerOption['icon'] },
      { id: 'redes-sociais', label: 'Redes Sociais', icon: Share2 as DashboardTriggerOption['icon'] },
      { id: 'noticias', label: 'Notícias', icon: FileText as DashboardTriggerOption['icon'] },
      { id: 'simulacoes', label: 'Simulações', icon: Stethoscope as DashboardTriggerOption['icon'] },
      { id: 'teste', label: 'Teste de Nivelamento', icon: Activity as DashboardTriggerOption['icon'] },
      { id: 'biblioteca', label: 'Biblioteca', icon: BookOpen as DashboardTriggerOption['icon'] },
      { id: 'forum', label: 'Fórum Cann Matrix', icon: MessageCircle as DashboardTriggerOption['icon'] },
      { id: 'perfil', label: 'Meu Perfil', icon: User as DashboardTriggerOption['icon'] }
    ],
    []
  )

  const validTabs = useMemo<StudentTab[]>(
    () => ['dashboard', 'redes-sociais', 'noticias', 'simulacoes', 'teste', 'biblioteca', 'forum', 'perfil'],
    []
  )

  const handleTabChange = (tab: StudentTab) => {
    setActiveTab(tab)
    const nextParams = new URLSearchParams(searchParams)
    if (tab === 'dashboard') {
      nextParams.delete('section')
      setSearchParams(nextParams, { replace: true })
    } else {
      nextParams.set('section', tab)
      setSearchParams(nextParams, { replace: true })
    }
  }

  const handleTabChangeRef = useRef(handleTabChange)
  handleTabChangeRef.current = handleTabChange

  // Header triggers (cards por usabilidade do perfil aluno) + cérebro Nôa (ref evita loop de setState)


  // Header triggers (cards por usabilidade do perfil aluno) + cérebro Nôa (ref evita loop de setState)
  useEffect(() => {
    const options = navItems.map(o => ({ id: o.id, label: o.label, icon: o.icon }))
    setDashboardTriggers({
      options,
      activeId: activeTab,
      onChange: (id) => handleTabChangeRef.current(id as StudentTab),
      onBrainClick: () => { if (isNoaOpen) closeChat(); else openChat() }
    })
    return () => setDashboardTriggers(null)
  }, [activeTab, navItems, openChat, closeChat, isNoaOpen, setDashboardTriggers])

  useEffect(() => {
    const section = searchParams.get('section') as StudentTab | null
    if (section && validTabs.includes(section)) {
      if (section !== activeTab) {
        setActiveTab(section)
      }
    } else if (!section && location.pathname.includes('/app/ensino/aluno/dashboard')) {
      // Se não há section na URL, manter o activeTab atual (que já está como 'perfil' por padrão)
      // Não forçar mudança se já está em uma aba válida
    }
  }, [searchParams, location.pathname])

  // Carregar cursos do Supabase
  useEffect(() => {
    if (user) {
      loadCourses()
    }
  }, [user])

  // Carregar estatísticas quando o curso principal for carregado
  useEffect(() => {
    if (user && mainCourse) {
      loadStudentStats()
    }
  }, [user, mainCourse])

  const loadStudentStats = async () => {
    if (!user) return

    try {
      // Buscar inscrições do aluno
      const { data: enrollments } = await supabase
        .from('course_enrollments')
        .select('*, courses(*, course_modules(*))')
        .eq('user_id', user.id)

      // Calcular estatísticas
      let totalModules = 0
      let completedModules = 0
      let totalLessons = 0
      let completedLessons = 0

      if (enrollments && enrollments.length > 0) {
        enrollments.forEach((enrollment: any) => {
          if (enrollment.courses?.course_modules) {
            totalModules += enrollment.courses.course_modules.length
            // Assumir módulos concluídos baseado no progresso
            if (enrollment.progress >= 100) {
              completedModules += enrollment.courses.course_modules.length
            }
          }
        })
      }

        // Buscar posts no fórum (silenciar erro no console se a tabela ou permissão falhar)
        let forumPostsCount = 0
        try {
          const { count, error: forumError } = await (supabase as any)
            .from('forum_posts')
            .select('*', { count: 'exact', head: true })
            .eq('author_id', user.id)

          if (!forumError && count !== null) {
            forumPostsCount = count
          }
        } catch (e) {
          // Silencioso
        }

      // Calcular dias na plataforma baseado na primeira inscrição
      const primeiroAcesso = enrollments && enrollments.length > 0
        ? new Date(enrollments.sort((a: any, b: any) =>
          new Date(a.enrolled_at || 0).getTime() - new Date(b.enrolled_at || 0).getTime()
        )[0].enrolled_at || Date.now())
        : new Date()
      const daysOnPlatform = Math.max(0, Math.floor((Date.now() - primeiroAcesso.getTime()) / (1000 * 60 * 60 * 24)))

      // Calcular média de progresso global
      let overallProgress = 0
      if (enrollments && enrollments.length > 0) {
        const sum = enrollments.reduce((acc: number, en: any) => acc + (en.progress || 0), 0)
        overallProgress = Math.round(sum / enrollments.length)
      }

      setStudentStats({
        totalModules: totalModules || mainCourse?.modules?.length || 0,
        completedModules,
        totalLessons,
        completedLessons,
        totalTests: 0,
        completedTests: 0,
        forumPosts: forumPostsCount || 0,
        libraryAccess: 0,
        daysOnPlatform,
        overallProgress
      })
    } catch (error) {
      console.error('Erro ao carregar estatísticas do aluno:', error)
      // Usar dados do curso principal como fallback
      setStudentStats({
        totalModules: mainCourse?.modules?.length || 0,
        completedModules: 0,
        totalLessons: 0,
        completedLessons: 0,
        totalTests: 0,
        completedTests: 0,
        forumPosts: 0,
        libraryAccess: 0,
        daysOnPlatform: 0,
        overallProgress: mainCourse?.progress || 0
      })
    }
  }

  const loadCourses = async () => {
    if (!user) return
    setLoading(true)

    try {
      // 1. Buscar TODAS as matrículas do usuário
      const { data: enrollments, error: enrollError } = await supabase
        .from('course_enrollments')
        .select('*, courses(*, course_modules(*))')
        .eq('user_id', user.id)

      if (enrollError) throw enrollError
      setAllEnrollments(enrollments || [])

      if (!enrollments || enrollments.length === 0) {
        setMainCourse(FALLBACK_COURSE)
        setLoading(false)
        return
      }

      // 2. Determinar qual curso exibir (URL ou o primeiro da lista)
      const urlCourseId = searchParams.get('courseId')
      let activeEnrollment = enrollments[0]
      let course = null

      if (urlCourseId) {
        const found = enrollments.find(e => e.course_id === urlCourseId)
        if (found) {
          activeEnrollment = found
          course = found.courses
          setSelectedEnrollmentId(found.id)
        } else {
          // Se sou ADMIN e o curso não está nas minhas matrículas, buscar o curso direto
          const { data: directCourse } = await supabase
            .from('courses')
            .select('*, course_modules(*)')
            .eq('id', urlCourseId)
            .single()
          
          if (directCourse) {
            course = directCourse
            activeEnrollment = { progress: 0, status: 'preview' } as any
          }
        }
      } else {
        course = activeEnrollment?.courses
      }

      if (!course) {
        setMainCourse(FALLBACK_COURSE)
        setLoading(false)
        return
      }

      // 3. Buscar lições para os módulos deste curso
      const modulesWithLessons = await Promise.all((course.course_modules || []).map(async (m: any) => {
        const { data: lessons } = await supabase
          .from('lessons')
          .select('*')
          .eq('module_id', m.id)
          .order('order_index', { ascending: true })

        return {
          id: m.id,
          title: m.title,
          description: m.description || '',
          progress: 0,
          status: 'Disponível',
          duration: `${m.duration || 0} minutos`,
          lessons: (lessons || []).map(l => l.title || 'Aula sem título'),
          lessonData: lessons || []
        }
      }))

      // 4. Buscar número total de alunos deste curso específico
      const { count: studentsCount } = await supabase
        .from('course_enrollments')
        .select('*', { count: 'exact', head: true })
        .eq('course_id', course.id)

      setMainCourse({
        id: course.id,
        enrollmentId: activeEnrollment.id,
        title: (course.title?.toLowerCase().includes('rins') || course.title?.toLowerCase().includes('aec') || course.title?.toLowerCase().includes('entrevista'))
          ? 'AEC - Avaliação Clínica Inicial'
          : course.title || 'Curso MedCannLab',
        subtitle: course.category || 'Ensino e Especialização',
        description: course.description || '',
        progress: activeEnrollment.progress || 0,
        status: activeEnrollment.status === 'completed' ? 'Concluído' : 'Em Andamento',
        instructor: (course.title?.toLowerCase().includes('rins') || course.title?.toLowerCase().includes('aec') || course.title?.toLowerCase().includes('entrevista') || course.instructor?.toLowerCase().includes('ricardo'))
          ? 'Dr. Ricardo Valença'
          : (course.title?.toLowerCase().includes('cannabis') || course.instructor?.toLowerCase().includes('eduardo'))
            ? 'Dr. Eduardo Faveret'
            : course.instructor || 'Especialista MedCannLab',
        duration: course.duration_text || `${course.duration || 60} horas`,
        nextClass: course.next_class_date ? new Date(course.next_class_date).toLocaleDateString('pt-BR') : null,
        color: 'from-blue-400 to-blue-500',
        logo: (course as any).logo_url || '📚',
        studentsCount: studentsCount || 0,
        modules: modulesWithLessons
      })

      // 5. VITRINE: Buscar cursos disponíveis que o aluno NÃO está matriculado
      const enrolledCourseIds = enrollments.map(en => en.course_id)
      const { data: others } = await supabase
        .from('courses')
        .select('*')
        .eq('is_active', true)
        .not('id', 'in', `(${enrolledCourseIds.join(',')})`)
        .limit(6)

      setAvailableCourses(others || [])
    } catch (error) {
      console.error('Erro ao carregar workstation do aluno:', error)
      setMainCourse(FALLBACK_COURSE)
    } finally {
      setLoading(false)
    }
  }

  const handleSwitchCourse = async (enrollment: any) => {
    // Atualizar URL sem recarregar
    const nextParams = new URLSearchParams(searchParams)
    nextParams.set('courseId', enrollment.course_id)
    setSearchParams(nextParams, { replace: true })

    setSelectedEnrollmentId(enrollment.id)
    
    // Resposta Imediata: Se já temos os dados das lições/módulos, injetamos direto
    if (enrollment.courses) {
      const course = enrollment.courses
      
      // Formatar módulos de forma reativa para não depender do reload
      const formattedModules = (course.course_modules || []).map((m: any) => ({
        id: m.id,
        title: m.title,
        description: m.description || '',
        progress: 0,
        status: 'Disponível',
        duration: `${m.duration || 0} minutos`,
        lessons: [], // Virão do reload de fundo se necessário
        lessonData: []
      }))

      setMainCourse((prev: any) => ({
        ...prev,
        id: course.id,
        title: (course.title?.toLowerCase().includes('rins') || course.title?.toLowerCase().includes('aec')) ? 'AEC - Avaliação Clínica Inicial' : course.title,
        modules: formattedModules
      }))
    }

    // Carregar os dados completos em background
    loadCourses()
  }

  const handleJoinCourse = async (courseId: string) => {
    if (!user) return

    try {
      setLoading(true)
      // 1. Criar a matrícula
      const { data, error } = await supabase
        .from('course_enrollments')
        .insert([{
          user_id: user.id,
          course_id: courseId,
          status: 'active',
          progress: 0,
          enrolled_at: new Date().toISOString()
        }])
        .select()
        .single()

      if (error) throw error

      // 2. Recarregar workstation para o novo curso aparecer
      setSearchParams({ courseId: courseId })
      await loadCourses()

      // Feedback visual? Opcional
    } catch (error) {
      console.error('Erro ao aderir ao curso:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleOpenModule = (moduleIndex: number, courseToOpen?: any) => {
    const course = courseToOpen || mainCourse;
    if (!course) return;

    // Mapeamento de rotas Inteligente
    const title = course.title?.toLowerCase() || "";
    const courseId = course.id;

    let targetPath = '/app/ensino/profissional/pos-graduacao-cannabis';

    if (title.includes('rins') || title.includes('ricardo') || title.includes('aec') || title.includes('entrevista') || title.includes('clínica')) {
      targetPath = '/app/ensino/profissional/arte-entrevista-clinica';
    } else if (title.includes('cannabis') || title.includes('eduardo')) {
      targetPath = '/app/ensino/profissional/pos-graduacao-cannabis';
    }

    navigate(targetPath, {
      state: {
        moduleId: mainCourse.modules[moduleIndex]?.id,
        courseId: courseId
      }
    });
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Em Andamento': return 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
      case 'Concluído': return 'bg-green-500/20 text-green-400 border border-green-500/30'
      case 'Disponível': return 'bg-green-500/20 text-green-400 border border-green-500/30'
      case 'Pendente': return 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
      default: return 'bg-slate-500/20 text-slate-400 border border-slate-500/30'
    }
  }

  const getProgressColor = (progress: number) => {
    if (progress >= 80) return 'bg-green-500'
    if (progress >= 50) return 'bg-blue-500'
    return 'bg-yellow-500'
  }

  // Renderizar Perfil do Aluno
  const renderPerfil = () => {
    const progressoGeral = mainCourse?.progress || 0
    const totalModulos = studentStats.totalModules || mainCourse?.modules?.length || 0
    const modulosConcluidos = studentStats.completedModules || 0

    return (
      <div className="space-y-6">
        {/* Seletor de Terminal (Workstation Switcher) */}
        {allEnrollments.length > 1 && (
          <div className="flex items-center justify-between bg-[#102C45]/80 p-4 rounded-2xl border border-emerald-500/20 shadow-xl backdrop-blur-sm animate-in fade-in slide-in-from-top-4 duration-500">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
                <Monitor className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-white leading-none mb-1">🕹️ Estação de Trabalho Ativa</h4>
                <p className="text-xs text-slate-400">Troque entre seus terminais de curso instalados</p>
              </div>
            </div>

            <div className="relative group">
              <select
                value={mainCourse?.enrollmentId || ''}
                onChange={(e) => {
                  const enrollment = allEnrollments.find(en => en.id === e.target.value)
                  if (enrollment) handleSwitchCourse(enrollment)
                }}
                className="appearance-none bg-slate-900/60 text-white text-sm font-bold py-2.5 pl-4 pr-10 rounded-xl border border-emerald-500/30 focus:outline-none focus:border-emerald-500 transition-all cursor-pointer hover:bg-slate-800"
              >
                {allEnrollments.map(en => (
                  <option key={en.id} value={en.id}>
                    {en.courses?.title || 'Curso Especialista'}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-400 pointer-events-none group-hover:text-emerald-300 transition-colors" />
            </div>
          </div>
        )}

        {/* Cards de Estatísticas */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-5">
          {/* Dias na Plataforma */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <Clock className="w-9 h-9 text-indigo-300" />
              <span className="text-3xl font-bold text-white">{studentStats.daysOnPlatform}</span>
            </div>
            <h3 className="text-lg font-semibold text-slate-300 mb-2">Dias na Plataforma</h3>
            <p className="text-base text-slate-400">Tempo de uso do sistema</p>
          </div>

          {/* Módulos */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <BookOpen className="w-9 h-9 text-primary-300" />
              <span className="text-3xl font-bold text-white">{totalModulos}</span>
            </div>
            <h3 className="text-lg font-semibold text-slate-300 mb-2">Módulos</h3>
            <div className="space-y-1.5 text-base text-slate-400">
              <div className="flex justify-between">
                <span>Concluídos:</span>
                <span className="text-emerald-400">{modulosConcluidos}</span>
              </div>
              <div className="flex justify-between">
                <span>Total:</span>
                <span className="text-slate-300">{totalModulos}</span>
              </div>
            </div>
          </div>

          {/* Progresso do Curso */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <Target className="w-9 h-9 text-emerald-300" />
              <span className="text-3xl font-bold text-white">{progressoGeral}%</span>
            </div>
            <h3 className="text-lg font-semibold text-slate-300 mb-2">Progresso Geral</h3>
            <div className="space-y-1.5 text-base text-slate-400">
              <div className="flex justify-between">
                <span>Curso:</span>
                <span className="text-emerald-400">{mainCourse?.title || 'Pós-Graduação'}</span>
              </div>
            </div>
          </div>

          {/* Fórum */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <MessageCircle className="w-9 h-9 text-purple-300" />
              <span className="text-3xl font-bold text-white">{studentStats.forumPosts}</span>
            </div>
            <h3 className="text-lg font-semibold text-slate-300 mb-2">Posts no Fórum</h3>
            <div className="space-y-1.5 text-base text-slate-400">
              <div className="flex justify-between">
                <span>Participações:</span>
                <span className="text-purple-400">{studentStats.forumPosts}</span>
              </div>
            </div>
          </div>

          {/* Biblioteca */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <Database className="w-9 h-9 text-sky-300" />
              <span className="text-3xl font-bold text-white">{studentStats.libraryAccess}</span>
            </div>
            <h3 className="text-lg font-semibold text-slate-300 mb-2">Biblioteca</h3>
            <div className="space-y-1.5 text-base text-slate-400">
              <div className="flex justify-between">
                <span>Acessos:</span>
                <span className="text-sky-400">{studentStats.libraryAccess}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Progresso do Curso */}
        {mainCourse && (
          <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold text-white flex items-center gap-2">
                <Target className="w-6 h-6 text-primary-300" />
                Progresso do Curso
              </h3>
              <span className="text-2xl font-bold text-primary-300">{progressoGeral}%</span>
            </div>
            <div className="w-full h-3 rounded-full bg-slate-800">
              <div
                className="h-3 rounded-full transition-all bg-gradient-to-r from-primary-500 to-emerald-500"
                style={{ width: `${progressoGeral}%` }}
              />
            </div>
            <p className="text-base text-slate-400 mt-2">{mainCourse.title}</p>
          </div>
        )}

        {/* Analytics de Uso */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-6">
          <h3 className="text-xl font-semibold text-white flex items-center gap-2 mb-4">
            <BarChart3 className="w-6 h-6 text-primary-300" />
            Analytics de Uso
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Engajamento */}
            <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
              <div className="flex items-center gap-2 mb-3">
                <Activity className="w-6 h-6 text-emerald-400" />
                <h4 className="text-base font-semibold text-white">Engajamento</h4>
              </div>
              <div className="space-y-2 text-base">
                <div className="flex justify-between text-slate-300">
                  <span>Módulos concluídos:</span>
                  <span className="font-semibold text-white">{modulosConcluidos}</span>
                </div>
                <div className="flex justify-between text-slate-300">
                  <span>Progresso geral:</span>
                  <span className="font-semibold text-white">{progressoGeral}%</span>
                </div>
                <div className="flex justify-between text-slate-300">
                  <span>Posts no fórum:</span>
                  <span className="font-semibold text-white">{studentStats.forumPosts}</span>
                </div>
              </div>
            </div>

            {/* Atividade Recente */}
            <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
              <div className="flex items-center gap-2 mb-3">
                <TrendingUp className="w-6 h-6 text-blue-400" />
                <h4 className="text-base font-semibold text-white">Atividade Recente</h4>
              </div>
              <div className="space-y-2 text-base">
                <div className="flex justify-between text-slate-300">
                  <span>Curso atual:</span>
                  <span className="font-semibold text-white">{mainCourse?.title || 'N/A'}</span>
                </div>
                {mainCourse?.nextClass && (
                  <div className="flex justify-between text-slate-300">
                    <span>Próxima aula:</span>
                    <span className="font-semibold text-white">{mainCourse.nextClass}</span>
                  </div>
                )}
                <div className="flex justify-between text-slate-300">
                  <span>Status:</span>
                  <span className="font-semibold text-white">{mainCourse?.status || 'Em Andamento'}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Cards de Ações Rápidas */}
        <div className="space-y-6">
          <h3 className="text-xl font-semibold text-white flex items-center gap-2">
            <Zap className="w-6 h-6 text-amber-400" />
            Ações Rápidas
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
            {/* Acessar Curso */}
            <button
              onClick={() => {
                navigate('/app/ensino/profissional/pos-graduacao-cannabis')
              }}
              className="rounded-xl p-4 text-left transition-all"
              style={{ background: 'linear-gradient(135deg, #1a365d 0%, #274a78 100%)', boxShadow: '0 10px 24px rgba(26,54,93,0.35)', border: '1px solid rgba(0,193,106,0.08)' }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(0, 193, 106, 0.08)'
                e.currentTarget.style.borderColor = 'rgba(0,193,106,0.15)'
                e.currentTarget.style.boxShadow = '0 10px 24px rgba(0,193,106,0.2)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'linear-gradient(135deg, #1a365d 0%, #274a78 100%)'
                e.currentTarget.style.borderColor = 'rgba(0,193,106,0.08)'
                e.currentTarget.style.boxShadow = '0 10px 24px rgba(26,54,93,0.35)'
              }}
              onTouchStart={(e) => {
                e.currentTarget.style.background = 'rgba(0, 193, 106, 0.08)'
                e.currentTarget.style.borderColor = 'rgba(0,193,106,0.15)'
              }}
              onTouchEnd={(e) => {
                setTimeout(() => {
                  e.currentTarget.style.background = 'linear-gradient(135deg, #1a365d 0%, #274a78 100%)'
                  e.currentTarget.style.borderColor = 'rgba(0,193,106,0.08)'
                }, 150)
              }}
            >
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                  <Play className="w-5 h-5 text-white" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-lg font-semibold text-white leading-tight">📚 Acessar Curso</h3>
                  <p className="text-sm text-white/80">Continue seus estudos e módulos</p>
                </div>
              </div>
            </button>

            {/* Chat com Nôa */}
            <button
              onClick={() => openChat()}
              className="rounded-xl p-4 text-left transition-all"
              style={{ background: accentGradient, boxShadow: '0 10px 24px rgba(0,193,106,0.35)', border: '1px solid rgba(0,193,106,0.35)' }}
              onMouseEnter={(e) => {
                e.currentTarget.style.opacity = '0.95'
                e.currentTarget.style.boxShadow = '0 12px 28px rgba(0,193,106,0.4)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.opacity = '1'
                e.currentTarget.style.boxShadow = '0 10px 24px rgba(0,193,106,0.35)'
              }}
              onTouchStart={(e) => {
                e.currentTarget.style.opacity = '0.95'
              }}
              onTouchEnd={(e) => {
                setTimeout(() => {
                  e.currentTarget.style.opacity = '1'
                }, 150)
              }}
            >
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                  <Brain className="w-5 h-5 text-white" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-lg font-semibold text-white leading-tight">🤖 Chat com Nôa</h3>
                  <p className="text-sm text-white/80">Tire dúvidas e receba suporte</p>
                </div>
              </div>
            </button>

            {/* Fórum */}
            <button
              onClick={() => {
                setActiveTab('forum')
              }}
              className="rounded-xl p-4 text-left transition-all"
              style={{ background: 'linear-gradient(135deg, #7c3aed 0%, #a855f7 100%)', boxShadow: '0 10px 24px rgba(124,58,237,0.35)', border: '1px solid rgba(0,193,106,0.08)' }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(0, 193, 106, 0.08)'
                e.currentTarget.style.borderColor = 'rgba(0,193,106,0.15)'
                e.currentTarget.style.boxShadow = '0 10px 24px rgba(0,193,106,0.2)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'linear-gradient(135deg, #7c3aed 0%, #a855f7 100%)'
                e.currentTarget.style.borderColor = 'rgba(0,193,106,0.08)'
                e.currentTarget.style.boxShadow = '0 10px 24px rgba(124,58,237,0.35)'
              }}
              onTouchStart={(e) => {
                e.currentTarget.style.background = 'rgba(0, 193, 106, 0.08)'
                e.currentTarget.style.borderColor = 'rgba(0,193,106,0.15)'
              }}
              onTouchEnd={(e) => {
                setTimeout(() => {
                  e.currentTarget.style.background = 'linear-gradient(135deg, #7c3aed 0%, #a855f7 100%)'
                  e.currentTarget.style.borderColor = 'rgba(0,193,106,0.08)'
                }, 150)
              }}
            >
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                  <MessageCircle className="w-5 h-5 text-white" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-lg font-semibold text-white leading-tight">💬 Fórum Cann Matrix</h3>
                  <p className="text-sm text-white/80">Participe de discussões e debates</p>
                </div>
              </div>
            </button>

            {/* Biblioteca */}
            <button
              onClick={() => {
                setActiveTab('biblioteca')
              }}
              className="rounded-xl p-4 text-left transition-all"
              style={{ background: 'linear-gradient(135deg, #0ea5e9 0%, #38bdf8 100%)', boxShadow: '0 10px 24px rgba(14,165,233,0.35)', border: '1px solid rgba(0,193,106,0.08)' }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(0, 193, 106, 0.08)'
                e.currentTarget.style.borderColor = 'rgba(0,193,106,0.15)'
                e.currentTarget.style.boxShadow = '0 10px 24px rgba(0,193,106,0.2)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'linear-gradient(135deg, #0ea5e9 0%, #38bdf8 100%)'
                e.currentTarget.style.borderColor = 'rgba(0,193,106,0.08)'
                e.currentTarget.style.boxShadow = '0 10px 24px rgba(14,165,233,0.35)'
              }}
              onTouchStart={(e) => {
                e.currentTarget.style.background = 'rgba(0, 193, 106, 0.08)'
                e.currentTarget.style.borderColor = 'rgba(0,193,106,0.15)'
              }}
              onTouchEnd={(e) => {
                setTimeout(() => {
                  e.currentTarget.style.background = 'linear-gradient(135deg, #0ea5e9 0%, #38bdf8 100%)'
                  e.currentTarget.style.borderColor = 'rgba(0,193,106,0.08)'
                }, 150)
              }}
            >
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                  <BookOpen className="w-5 h-5 text-white" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-lg font-semibold text-white leading-tight">📖 Biblioteca</h3>
                  <p className="text-sm text-white/80">Acesse materiais e recursos</p>
                </div>
              </div>
            </button>
          </div>
        </div>

        {/* Funcionalidades Utilizadas */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-6">
          <h3 className="text-xl font-semibold text-white flex items-center gap-2 mb-4">
            <Zap className="w-6 h-6 text-amber-400" />
            Funcionalidades Utilizadas
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className={`p-4 rounded-lg border ${modulosConcluidos > 0 ? 'bg-emerald-500/10 border-emerald-500/40' : 'bg-slate-800/50 border-slate-700'}`}>
              <div className="flex items-center gap-2 mb-2">
                <BookOpen className={`w-5 h-5 ${modulosConcluidos > 0 ? 'text-emerald-400' : 'text-slate-500'}`} />
                <span className={`font-semibold ${modulosConcluidos > 0 ? 'text-emerald-300' : 'text-slate-400'}`}>
                  Módulos
                </span>
              </div>
              <p className="text-sm text-slate-400">
                {modulosConcluidos > 0 ? `${modulosConcluidos} módulo(s) concluído(s)` : 'Ainda não utilizado'}
              </p>
            </div>

            <div className={`p-4 rounded-lg border ${studentStats.forumPosts > 0 ? 'bg-purple-500/10 border-purple-500/40' : 'bg-slate-800/50 border-slate-700'}`}>
              <div className="flex items-center gap-2 mb-2">
                <MessageCircle className={`w-5 h-5 ${studentStats.forumPosts > 0 ? 'text-purple-400' : 'text-slate-500'}`} />
                <span className={`font-semibold ${studentStats.forumPosts > 0 ? 'text-purple-300' : 'text-slate-400'}`}>
                  Fórum
                </span>
              </div>
              <p className="text-sm text-slate-400">
                {studentStats.forumPosts > 0 ? `${studentStats.forumPosts} post(s) publicado(s)` : 'Ainda não utilizado'}
              </p>
            </div>

            <div className={`p-4 rounded-lg border ${studentStats.libraryAccess > 0 ? 'bg-sky-500/10 border-sky-500/40' : 'bg-slate-800/50 border-slate-700'}`}>
              <div className="flex items-center gap-2 mb-2">
                <Database className={`w-5 h-5 ${studentStats.libraryAccess > 0 ? 'text-sky-400' : 'text-slate-500'}`} />
                <span className={`font-semibold ${studentStats.libraryAccess > 0 ? 'text-sky-300' : 'text-slate-400'}`}>
                  Biblioteca
                </span>
              </div>
              <p className="text-sm text-slate-400">
                {studentStats.libraryAccess > 0 ? `${studentStats.libraryAccess} acesso(s) realizado(s)` : 'Ainda não utilizado'}
              </p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center">
        <div className="text-center">
          <Clock className="w-12 h-12 mx-auto mb-4 animate-spin text-green-500" />
          <p className="text-slate-400">Carregando cursos...</p>
        </div>
      </div>
    )
  }

  if (!mainCourse) {
    return (
      <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center">
        <div className="text-center">
          <BookOpen className="w-12 h-12 mx-auto mb-4 text-slate-600" />
          <p className="text-slate-400">Nenhum curso encontrado</p>
        </div>
      </div>
    )
  }

  return (
    <div
      className="min-h-screen text-white"
      style={{ background: backgroundGradient }}
      data-page="aluno-dashboard"
    >
      <div className="px-4 py-3 md:px-6 md:py-4">
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="w-full max-w-full mx-auto overflow-x-hidden space-y-6">
            {/* Dashboard Principal (Workstation) */}
            {activeTab === 'dashboard' && (
              <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="flex items-center justify-between mb-0">
                  <div className="flex items-center gap-4">
                    <button 
                      onClick={() => navigate('/app')}
                      className="flex items-center gap-2 text-slate-400 hover:text-white transition-all text-xs font-bold uppercase tracking-wider group"
                    >
                      <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                      Voltar
                    </button>
                    <div className="h-8 w-px bg-slate-800" />
                    <div>
                      <h2 className="text-xl font-black text-white flex items-center gap-2 tracking-tight">
                        <span className="text-lg">🕹️</span> Terminal de Ensino
                      </h2>
                      <p className="text-[10px] text-slate-500 font-bold uppercase tracking-tighter">Workstation profissional de estudos e especializações</p>
                    </div>
                  </div>

                  {/* Seletor de Terminal (Alternância Rápida) */}
                  {allEnrollments.length > 1 && (
                    <div className="relative group">
                      <select
                        value={mainCourse?.id || ''}
                        onChange={(e) => {
                          const enrollment = allEnrollments.find(en => en.course_id === e.target.value)
                          if (enrollment) handleSwitchCourse(enrollment)
                        }}
                        className="appearance-none bg-[#102C45]/80 text-white text-sm font-bold py-2.5 px-4 pr-10 rounded-xl border border-emerald-500/30 focus:outline-none focus:border-emerald-500 transition-all cursor-pointer hover:bg-slate-800"
                      >
                        {allEnrollments.map(en => (
                          <option key={en.id} value={en.course_id}>
                            {en.courses?.title || 'Terminal Ativo'}
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-400 pointer-events-none" />
                    </div>
                  )}
                </div>

                {loading ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div>
                  </div>
                ) : (
                  <>
                    {/* BARRA DE PERFORMANCE SUPERIOR (KPIs GLOBAIS) - SLIM DESIGN */}
                    <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-3 mb-6 mt-0 animate-in fade-in slide-in-from-top-2 duration-500">
                      <div className="bg-[#102C45]/80 p-4 rounded-xl border border-slate-800 shadow-lg backdrop-blur-sm flex items-center justify-between gap-4">
                        <div className="flex flex-col">
                          <span className="text-[9px] text-slate-500 uppercase font-bold tracking-widest mb-1">Desempenho da Jornada</span>
                          <div className="flex items-baseline gap-1">
                            <span className="text-2xl font-bold text-white">{studentStats.overallProgress || 0}%</span>
                            <span className="text-[10px] text-emerald-500 font-bold uppercase tracking-tighter">Geral</span>
                          </div>
                        </div>
                        <div className="flex-1 max-w-[100px] h-1.5 bg-slate-800 rounded-full overflow-hidden">
                          <div className="h-full bg-emerald-500" style={{ width: `${studentStats.overallProgress || 0}%` }}></div>
                        </div>
                        <BarChart3 className="w-5 h-5 text-emerald-400 opacity-50" />
                      </div>

                      <div className="bg-[#102C45]/80 p-4 rounded-xl border border-slate-800 shadow-lg backdrop-blur-sm flex items-center justify-between gap-4">
                        <div className="flex flex-col">
                          <span className="text-[9px] text-slate-500 uppercase font-bold tracking-widest mb-1">Status Ativo</span>
                          <span className="text-lg font-bold text-white uppercase tracking-tight">Em Andamento</span>
                        </div>
                        <Zap className="w-5 h-5 text-emerald-400 animate-pulse opacity-50" />
                      </div>

                      <div className="bg-[#102C45]/80 p-4 rounded-xl border border-slate-800 shadow-lg backdrop-blur-sm flex items-center justify-between gap-4">
                        <div className="flex flex-col">
                          <span className="text-[9px] text-slate-500 uppercase font-bold tracking-widest mb-1">Seu Ranking</span>
                          <span className="text-lg font-bold text-white uppercase tracking-tight">#42</span>
                        </div>
                        <Award className="w-5 h-5 text-emerald-400 opacity-50" />
                      </div>

                      <div className="bg-[#102C45]/80 p-4 rounded-xl border border-emerald-500/10 shadow-lg backdrop-blur-sm flex items-center justify-between gap-4">
                        <div className="flex flex-col">
                          <span className="text-[9px] text-slate-500 uppercase font-bold tracking-widest mb-1">Carteira de Pontos</span>
                          <div className="flex items-baseline gap-1">
                            <span className="text-xl font-bold text-emerald-400">1.250</span>
                            <span className="text-[8px] text-slate-500 font-bold uppercase tracking-widest">PTS</span>
                          </div>
                        </div>
                        <div className="w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
                           <Star className="w-5 h-5 text-emerald-400 fill-emerald-400/20" />
                        </div>
                      </div>

                      <div className="bg-[#102C45]/80 p-4 rounded-xl border border-slate-800 shadow-lg backdrop-blur-sm flex items-center justify-between gap-4">
                        <div className="flex flex-col">
                          <span className="text-[9px] text-slate-500 uppercase font-bold tracking-widest mb-1">Estrelas (Média)</span>
                          <div className="flex items-center gap-1">
                            <span className="text-lg font-bold text-white">4.5</span>
                            <div className="flex text-yellow-500">
                              <Star className="w-2.5 h-2.5 fill-current" />
                              <Star className="w-2.5 h-2.5 fill-current" />
                              <Star className="w-2.5 h-2.5 fill-current" />
                              <Star className="w-2.5 h-2.5 fill-current" />
                              <Star className="w-2.5 h-2.5/2 fill-current opacity-50" />
                            </div>
                          </div>
                        </div>
                        <Trophy className="w-5 h-5 text-yellow-500/50" />
                      </div>
                    </div>

                    {allEnrollments.length > 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {allEnrollments.map((enrollment) => {
                          const course = enrollment.courses
                          if (!course) return null;
                          const isActive = mainCourse?.id === course.id

                          return (
                            <div
                              key={enrollment.id}
                              onClick={() => {
                                handleSwitchCourse(enrollment);
                              }}
                              className={`group relative rounded-2xl border ${isActive ? 'border-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.2)]' : 'border-[#00C16A]/20'} bg-gradient-to-br from-[#0A192F] via-[#102C45] to-[#0A192F] p-6 shadow-xl cursor-pointer hover:shadow-2xl hover:border-emerald-500/50 transition-all overflow-hidden`}
                            >
                              {isActive && (
                                <div className="absolute top-0 right-0 p-2">
                                  <div className="bg-emerald-500 text-[8px] font-bold text-white px-2 py-0.5 rounded-bl-lg tracking-widest uppercase">ESTUDANDO AGORA</div>
                                </div>
                              )}

                              <div className="flex items-center space-x-4 mb-6">
                                <div className={`w-14 h-14 rounded-xl ${isActive ? 'bg-emerald-500/20' : 'bg-emerald-500/10'} flex items-center justify-center border border-emerald-500/20 group-hover:scale-110 transition-transform duration-300`}>
                                  {course.title?.toLowerCase().includes('cannabis') ? <GraduationCap className="w-8 h-8 text-emerald-400" /> : <BookOpen className="w-8 h-8 text-emerald-400" />}
                                </div>
                                <div className="min-w-0 flex-1">
                                  <h3 className="text-lg font-bold text-white group-hover:text-emerald-300 transition-colors leading-tight truncate">
                                    {course.title?.toLowerCase().includes('rins') || course.title?.toLowerCase().includes('aec')
                                      ? 'AEC - Avaliação Clínica Inicial'
                                      : course.title
                                    }
                                  </h3>
                                  <p className="text-sm text-slate-400 mt-1 truncate">
                                    {course.title?.toLowerCase().includes('rins') || course.title?.toLowerCase().includes('aec') || course.title?.toLowerCase().includes('clínica')
                                      ? 'Dr. Ricardo Valença'
                                      : course.title?.toLowerCase().includes('eduardo') || course.title?.toLowerCase().includes('cannabis')
                                        ? 'Dr. Eduardo Faveret'
                                        : course.instructor || 'Prof. Especialista'
                                    }
                                  </p>
                                </div>
                              </div>

                              <div className="space-y-4">
                                <div>
                                  <div className="flex justify-between text-xs text-slate-400 mb-2">
                                    <span>Seu Progresso</span>
                                    <span className="text-emerald-400 font-bold">{enrollment.progress}%</span>
                                  </div>
                                  <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                                    <div
                                      className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.3)]"
                                      style={{ width: `${enrollment.progress}%` }}
                                    />
                                  </div>
                                </div>

                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleOpenModule(0, enrollment.courses);
                                  }}
                                  className="w-full py-3 rounded-xl font-bold text-sm transition-all bg-emerald-600 text-white flex items-center justify-center gap-2 hover:bg-emerald-500 shadow-lg shadow-emerald-900/20"
                                >
                                  Continuar Agora
                                  <ArrowRight className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    ) : (
                      <div className="text-center py-16 bg-slate-900/40 rounded-3xl border border-dashed border-slate-800">
                        <div className="w-20 h-20 bg-slate-800/50 rounded-full flex items-center justify-center mx-auto mb-6">
                          <LayoutDashboard className="w-10 h-10 text-slate-600" />
                        </div>
                        <h3 className="text-xl font-bold text-white mb-2">Sua Workstation está vazia</h3>
                        <p className="text-slate-400 mb-8 max-w-sm mx-auto">Explore o catálogo de cursos e escolha sua próxima jornada de especialização.</p>
                        <button
                          onClick={() => navigate('/app/ensino/aluno/cursos')}
                          className="px-8 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl transition-all shadow-[0_0_20px_rgba(16,185,129,0.3)]"
                        >
                          Ver Catálogo de Cursos
                        </button>
                      </div>
                    )}
                  </>
                )}

                {/* Home do Curso Selecionado na Workstation */}
                {mainCourse && (
                  <div className="mt-8 animate-in fade-in slide-in-from-bottom-6 duration-700 space-y-8">
                    {/* BARRA DE PERFORMANCE REMOVIDA - MOVIDA PARA O TOPO EM MODO SLIM */}

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                      {/* Lado Esquerdo: Módulos e Conteúdo */}
                      <div className="lg:col-span-2 space-y-6">
                        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-4">
                          <h3 className="text-2xl font-bold text-white flex items-center gap-3">
                            <BookOpen className="w-7 h-7 text-emerald-400" />
                            Módulos do {mainCourse.title}
                          </h3>

                          {(mainCourse.title?.toLowerCase().includes('rins') || mainCourse.title?.toLowerCase().includes('ricardo') || mainCourse.title?.toLowerCase().includes('aec')) && (
                            <div className="flex items-center gap-3 bg-emerald-500/10 border border-emerald-500/30 p-3 rounded-xl shadow-[0_0_15px_rgba(16,185,129,0.1)] animate-pulse">
                              <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center">
                                <Video className="w-4 h-4 text-emerald-400" />
                              </div>
                              <div>
                                <span className="block text-[10px] font-black text-emerald-400 uppercase tracking-tighter">Mentoria ao Vivo</span>
                                <span className="text-sm font-bold text-white flex items-center gap-1.5">
                                  Toda Quarta <span className="w-1 h-1 rounded-full bg-slate-500"></span> 20h00
                                </span>
                              </div>
                            </div>
                          )}
                        </div>

                        <div className="grid grid-cols-1 gap-4">
                          {mainCourse.modules?.map((module: any, idx: number) => (
                            <div key={module.id} className="bg-[#102C45]/60 p-4 rounded-xl border border-slate-800 hover:border-emerald-500/30 transition-all group flex items-center justify-between gap-4 shadow-sm backdrop-blur-sm">
                              <div className="flex items-center gap-3 min-w-0">
                                <div className="w-9 h-9 rounded-lg bg-emerald-500/10 flex items-center justify-center text-sm font-bold text-emerald-400 border border-emerald-500/20 shrink-0">
                                  {idx + 1}
                                </div>
                                <div className="min-w-0">
                                  <h4 className="text-base font-bold text-white group-hover:text-emerald-300 transition-colors truncate">{module.title}</h4>
                                  <div className="flex items-center gap-2 mt-0.5">
                                    <span className="text-[10px] text-slate-500 font-medium truncate max-w-[200px]">{module.description}</span>
                                    <span className="text-[9px] text-emerald-500 font-bold bg-emerald-500/5 px-1.5 py-0.5 rounded border border-emerald-500/10">
                                       +150 PTS
                                    </span>
                                  </div>
                                </div>
                              </div>

                              <div className="flex items-center gap-4 shrink-0">
                                <div className="hidden sm:block text-right">
                                  <p className="text-[9px] font-bold text-slate-500 uppercase tracking-tight">{module.duration || '0 min'}</p>
                                  <p className="text-[9px] font-bold text-emerald-400 uppercase tracking-tight">{module.lessons?.length || 0} Aulas</p>
                                </div>
                                <button
                                  onClick={() => handleOpenModule(idx)}
                                  className="w-8 h-8 bg-emerald-600/90 text-white rounded-lg flex items-center justify-center hover:scale-105 transition-all shadow-lg active:scale-95 group-hover:bg-emerald-500"
                                >
                                  <Play className="w-3.5 h-3.5 fill-current" />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>

                        {/* Portal de Mentorias ao Vivo e Agenda */}
                        <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-6">
                          <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                            <Calendar className="w-5 h-5 text-indigo-400" />
                            Portal de Mentorias ao Vivo
                          </h3>
                          
                          <div className="space-y-3">
                            {(() => {
                              const now = new Date();
                              const isWednesday = now.getDay() === 3;
                              const isTime = now.getHours() >= 20 && now.getHours() < 22;
                              const isLiveNow = isWednesday && isTime;
                              const isAEC = mainCourse.title?.toLowerCase().includes('ricardo') || mainCourse.title?.toLowerCase().includes('aec');
                              
                              const handleJoinMentorship = () => {
                                const event = new CustomEvent('openVideoCall', {
                                  detail: {
                                    signalingRoomId: `mentoria-${isAEC ? 'ricardo' : 'eduardo'}-${now.toISOString().split('T')[0]}`,
                                    isInitiator: true, 
                                    callType: 'video'
                                  }
                                });
                                window.dispatchEvent(event);
                              };

                              if (isLiveNow && isAEC) {
                                return (
                                  <button 
                                    onClick={handleJoinMentorship}
                                    className="w-full bg-gradient-to-r from-emerald-600 to-emerald-500 p-1 rounded-xl animate-bounce shadow-[0_0_30px_rgba(16,185,129,0.3)] transition-all hover:scale-[1.02] active:scale-95 group"
                                  >
                                    <div className="bg-[#0A192F] rounded-lg p-4 flex items-center justify-between border border-emerald-400/30">
                                      <div className="flex items-center gap-4">
                                        <div className="relative">
                                          <div className="w-12 h-12 rounded-xl bg-emerald-500/20 flex items-center justify-center border border-emerald-500/40">
                                            <Video className="w-6 h-6 text-emerald-400" />
                                          </div>
                                          <span className="absolute -top-1 -right-1 flex h-3 w-3">
                                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                                            <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                                          </span>
                                        </div>
                                        <div className="text-left">
                                          <h4 className="text-sm font-black text-white uppercase tracking-tight group-hover:text-emerald-400 transition-colors">Entrar na Mentoria Agora</h4>
                                          <p className="text-[10px] text-emerald-500 font-bold">Sala Aberta • 12/30 Alunos online</p>
                                        </div>
                                      </div>
                                      <div className="px-3 py-1 bg-emerald-500 text-[#0A192F] text-[10px] font-black rounded-md uppercase tracking-widest">
                                        Acessar
                                      </div>
                                    </div>
                                  </button>
                                );
                              }

                              return (
                                <div className="bg-[#102C45]/80 p-4 rounded-xl border border-emerald-500/10 flex items-center justify-between">
                                  <div className="flex items-center gap-4">
                                    <div className="bg-slate-800 px-3 py-1 rounded-lg text-center min-w-[60px]">
                                      <span className="block text-[8px] font-bold text-emerald-400 uppercase">PROX</span>
                                      <span className="block text-md font-bold text-white">QUA</span>
                                    </div>
                                    <div>
                                      <h4 className="text-sm font-bold text-white">Mentoria com Dr. Ricardo</h4>
                                      <p className="text-[10px] text-slate-400">Cidade Amiga dos Rins • 20h00</p>
                                    </div>
                                  </div>
                                  <Video className="w-4 h-4 text-emerald-500" />
                                </div>
                              );
                            })()}
                          </div>

                          {/* Cronograma de Mentorias - Lista Completa */}
                          <div className="mt-6 border-t border-slate-800 pt-6">
                            <h4 className="text-xs font-black text-slate-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                              <Clock className="w-3.5 h-3.5" />
                              Próximos Encontros
                            </h4>
                            <div className="space-y-2">
                              {(() => {
                                const isAEC = mainCourse.title?.toLowerCase().includes('ricardo') || mainCourse.title?.toLowerCase().includes('aec');
                                const schedule = isAEC ? [
                                  { date: '16/04', day: 'QUA', time: '20:00', theme: 'Teorias da Comunicação em Saúde' },
                                  { date: '23/04', day: 'QUA', time: '20:00', theme: 'O Roteiro Tradicional e suas Limitações' },
                                  { date: '30/04', day: 'QUA', time: '20:00', theme: 'Prática de Entrevista Clínica Assistida' }
                                ] : [
                                  { date: '16/04', day: 'QUA', time: '19:00', theme: 'Biosíntese de Canabinoides' },
                                  { date: '23/04', day: 'QUA', time: '19:00', theme: 'Prescrição e Documentação Legal' },
                                  { date: '30/04', day: 'QUA', time: '19:00', theme: 'Manejo de Efeitos Adversos' }
                                ];

                                return schedule.map((item, i) => (
                                  <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-slate-800/30 border border-slate-800/50 hover:bg-slate-800/50 transition-colors group">
                                    <div className="flex items-center gap-4">
                                      <div className="text-center min-w-[45px]">
                                        <span className="block text-[10px] font-bold text-white leading-none">{item.date}</span>
                                        <span className="block text-[8px] font-medium text-slate-500">{item.day}</span>
                                      </div>
                                      <div className="w-px h-6 bg-slate-700" />
                                      <div>
                                        <p className="text-xs font-bold text-slate-200 group-hover:text-emerald-400 transition-colors">{item.theme}</p>
                                        <p className="text-[9px] text-slate-500">{item.time} • Sala de Mentoria</p>
                                      </div>
                                    </div>
                                    <span className="text-[9px] font-bold text-emerald-500/60">+150 PTS</span>
                                  </div>
                                ));
                              })()}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Lado Direito: Estatísticas e Recursos (Estilo o print do Ricardo) */}
                      <div className="space-y-6">

                        <div className="bg-[#102C45]/80 p-6 rounded-3xl border border-slate-800">
                          <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4">Recursos Extras</h3>
                          <div className="space-y-3">
                            <button className="w-full p-3 rounded-xl bg-slate-900/50 border border-slate-800 flex items-center justify-between group hover:border-emerald-500/30 transition-all">
                              <div className="flex items-center gap-3">
                                <FileText className="w-4 h-4 text-emerald-400" />
                                <span className="text-xs text-white">Material Didático</span>
                              </div>
                              <Download className="w-3 h-3 text-slate-600 group-hover:text-emerald-400" />
                            </button>
                            <button className="w-full p-3 rounded-xl bg-slate-900/50 border border-slate-800 flex items-center justify-between group hover:border-emerald-500/30 transition-all">
                              <div className="flex items-center gap-3">
                                <MessageCircle className="w-4 h-4 text-blue-400" />
                                <span className="text-xs text-white">Fórum do Curso</span>
                              </div>
                              <ArrowRight className="w-3 h-3 text-slate-600 group-hover:text-blue-400" />
                            </button>
                            <button className="w-full p-3 rounded-xl bg-slate-900/50 border border-slate-800 flex items-center justify-between group hover:border-emerald-500/30 transition-all">
                              <div className="flex items-center gap-3">
                                <Star className="w-4 h-4 text-amber-400" />
                                <span className="text-xs text-white">Avaliar Curso</span>
                              </div>
                            </button>
                          </div>
                        </div>

                        {/* Próxima Aula do Dia */}
                        <div className="bg-[#102C45]/80 p-6 rounded-3xl border border-slate-800 relative overflow-hidden group">
                          {/* Efeito Glow no fundo */}
                          <div className="absolute -top-24 -right-24 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl group-hover:bg-emerald-500/20 transition-all"></div>
                          
                          <div className="flex items-center justify-between mb-6">
                            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest">Próxima Aula do Dia</h3>
                            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
                              <span className="text-[10px] font-black text-emerald-400">AO VIVO HOJE</span>
                            </div>
                          </div>

                          <div className="space-y-6">
                            <div className="flex items-start gap-4">
                              <div className="w-12 h-12 rounded-2xl bg-slate-900/50 border border-slate-800 flex items-center justify-center shrink-0">
                                <Video className="w-6 h-6 text-indigo-400" />
                              </div>
                              <div className="min-w-0">
                                <h4 className="text-base font-bold text-white leading-tight truncate">
                                  {mainCourse.title?.toLowerCase().includes('ricardo') || mainCourse.title?.toLowerCase().includes('aec')
                                    ? 'Teorias da Comunicação em Saúde'
                                    : 'Manejo Clínico Avançado'
                                  }
                                </h4>
                                <p className="text-xs text-slate-400 mt-1">Dr. Ricardo Valença • 20h00</p>
                              </div>
                            </div>

                            <div className="bg-slate-950/50 rounded-2xl p-4 border border-slate-800/50">
                              <div className="flex items-center justify-between mb-3">
                                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Ocupação da Sala</span>
                                <span className="text-[10px] font-bold text-emerald-400">12 / 30 Máx</span>
                              </div>
                              <div className="w-full bg-slate-900 h-1.5 rounded-full overflow-hidden mb-2">
                                <div className="w-[40%] h-full bg-gradient-to-r from-emerald-600 to-emerald-400 rounded-full"></div>
                              </div>
                              <p className="text-[9px] text-slate-500 text-center leading-tight">
                                Seleção por <span className="text-white font-bold">Ranking Global</span> ou ordem de chegada (First-In).
                              </p>
                            </div>

                            {(() => {
                              const now = new Date();
                              const isWednesday = now.getDay() === 3;
                              const targetHour = 20;
                              const targetMinute = 0;
                              
                              const classTime = new Date();
                              classTime.setHours(targetHour, targetMinute, 0);
                              
                              const diffMinutes = (classTime.getTime() - now.getTime()) / (1000 * 60);
                              const isAvailable = isWednesday && (diffMinutes <= 5 && diffMinutes >= -120); // Abre 5min antes e fica aberto por 2h
                              const isOpeningSoon = isWednesday && (diffMinutes > 5 && diffMinutes <= 30);

                              return (
                                <button
                                  disabled={!isAvailable}
                                  onClick={() => {
                                    const event = new CustomEvent('openVideoCall', {
                                      detail: {
                                        signalingRoomId: `aula-ricardo-${now.toISOString().split('T')[0]}`,
                                        isInitiator: true, 
                                        callType: 'video'
                                      }
                                    });
                                    window.dispatchEvent(event);
                                  }}
                                  className={`w-full py-4 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-3 shadow-lg 
                                    ${isAvailable 
                                      ? 'bg-emerald-600 text-white hover:bg-emerald-500 shadow-emerald-900/20 animate-in fade-in zoom-in duration-300' 
                                      : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700/50'
                                    }`}
                                >
                                  {isAvailable ? <Play className="w-4 h-4 fill-current" /> : <Lock className="w-4 h-4" />}
                                  {isAvailable ? 'Acessar Terminal Agora' : isOpeningSoon ? `Liberado em ${Math.floor(diffMinutes)} min` : 'Terminal Bloqueado'}
                                </button>
                              );
                            })()}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* VITRINE UNIFICADA: Explore Novos Cursos */}
                {availableCourses.length > 0 && (
                  <div className="mt-20 animate-in fade-in slide-in-from-bottom-8 duration-1000">
                    <div className="flex items-center justify-between mb-8">
                      <div>
                        <h3 className="text-2xl font-bold text-white flex items-center gap-3">
                          <Zap className="w-7 h-7 text-amber-400" />
                          Explore Novas Especializações
                        </h3>
                        <p className="text-slate-400 mt-1">Expanda sua carreira na MedCannLab com novos terminais de ensino.</p>
                      </div>
                      <button
                        onClick={() => navigate('/app/ensino/aluno/cursos')}
                        className="text-emerald-400 text-sm font-bold hover:text-emerald-300 transition-colors flex items-center gap-2"
                      >
                        Ver Catálogo Completo
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {availableCourses.map((course) => (
                        <div key={course.id} className="bg-slate-900/40 border border-slate-800 rounded-2xl p-4 hover:border-emerald-500/30 transition-all group">
                          <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center text-xl mb-4 group-hover:scale-110 transition-transform">
                            {(course as any).logo_url || '🎓'}
                          </div>
                          <h4 className="text-base font-bold text-white mb-1.5 leading-tight">{course.title}</h4>
                          <p className="text-[11px] text-slate-400 mb-4 line-clamp-2 h-8 leading-relaxed">{course.description}</p>

                          <div className="flex items-center gap-3 text-[9px] text-slate-500 font-bold uppercase mb-4">
                            <span className="flex items-center gap-1.5"><Clock className="w-3 h-3 text-emerald-500/70" /> {course.duration_text || '60 horas'}</span>
                            <span className="flex items-center gap-1.5"><Star className="w-3 h-3 text-amber-500/70" /> {course.difficulty || 'Beginner'}</span>
                          </div>

                          <button
                            onClick={() => handleJoinCourse(course.id)}
                            className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl transition-all shadow-lg shadow-emerald-900/20 flex items-center justify-center gap-2 group-hover:translate-y-[-2px]"
                          >
                            <Plus className="w-3.5 h-3.5" /> Instalar no Terminal
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Redes Sociais */}
            {activeTab === 'redes-sociais' && (
              <div className="space-y-6">
                {/* Cards de Redes Sociais */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {/* Instagram */}
                  <div className="rounded-xl p-6 transition-transform transform hover:scale-[1.02] cursor-pointer" style={{ ...cardStyle, border: '1px solid rgba(0,193,106,0.18)' }}>
                    <div className="flex items-center space-x-3 mb-4">
                      <div className="w-12 h-12 rounded-lg flex items-center justify-center text-2xl" style={{ background: 'linear-gradient(135deg, #833AB4 0%, #FD1D1D 50%, #FCB045 100%)' }}>
                        📷
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-white">Instagram</h3>
                        <p className="text-xs text-slate-300/80">@medcannlab</p>
                      </div>
                    </div>
                    <p className="text-sm text-slate-200/85 mb-4">
                      Acompanhe casos clínicos, dicas de estudo e novidades da pós-graduação em tempo real.
                    </p>
                    <a
                      href="https://instagram.com/medcannlab"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-semibold text-white transition-transform transform hover:scale-[1.02] w-full"
                      style={{ background: 'linear-gradient(135deg, #833AB4 0%, #FD1D1D 50%, #FCB045 100%)' }}
                    >
                      <span>Seguir no Instagram</span>
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  </div>

                  {/* LinkedIn */}
                  <div className="rounded-xl p-6 transition-transform transform hover:scale-[1.02] cursor-pointer" style={{ ...cardStyle, border: '1px solid rgba(0,193,106,0.18)' }}>
                    <div className="flex items-center space-x-3 mb-4">
                      <div className="w-12 h-12 rounded-lg flex items-center justify-center text-2xl" style={{ background: 'linear-gradient(135deg, #0077B5 0%, #00A0DC 100%)' }}>
                        💼
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-white">LinkedIn</h3>
                        <p className="text-xs text-slate-300/80">MedCannLab</p>
                      </div>
                    </div>
                    <p className="text-sm text-slate-200/85 mb-4">
                      Conecte-se profissionalmente, participe de discussões e acompanhe artigos científicos.
                    </p>
                    <a
                      href="https://linkedin.com/company/medcannlab"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-semibold text-white transition-transform transform hover:scale-[1.02] w-full"
                      style={{ background: 'linear-gradient(135deg, #0077B5 0%, #00A0DC 100%)' }}
                    >
                      <span>Conectar no LinkedIn</span>
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  </div>

                  {/* YouTube */}
                  <div className="rounded-xl p-6 transition-transform transform hover:scale-[1.02] cursor-pointer" style={{ ...cardStyle, border: '1px solid rgba(0,193,106,0.18)' }}>
                    <div className="flex items-center space-x-3 mb-4">
                      <div className="w-12 h-12 rounded-lg flex items-center justify-center text-2xl" style={{ background: 'linear-gradient(135deg, #FF0000 0%, #CC0000 100%)' }}>
                        ▶️
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-white">YouTube</h3>
                        <p className="text-xs text-slate-300/80">Canal MedCannLab</p>
                      </div>
                    </div>
                    <p className="text-sm text-slate-200/85 mb-4">
                      Assista aulas gravadas, webinars e conteúdo educativo sobre cannabis medicinal.
                    </p>
                    <a
                      href="https://youtube.com/@medcannlab"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-semibold text-white transition-transform transform hover:scale-[1.02] w-full"
                      style={{ background: 'linear-gradient(135deg, #FF0000 0%, #CC0000 100%)' }}
                    >
                      <span>Inscrever-se no Canal</span>
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  </div>

                  {/* WhatsApp */}
                  <div className="rounded-xl p-6 transition-transform transform hover:scale-[1.02] cursor-pointer" style={{ ...cardStyle, border: '1px solid rgba(0,193,106,0.18)' }}>
                    <div className="flex items-center space-x-3 mb-4">
                      <div className="w-12 h-12 rounded-lg flex items-center justify-center text-2xl" style={{ background: 'linear-gradient(135deg, #25D366 0%, #128C7E 100%)' }}>
                        💬
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-white">WhatsApp</h3>
                        <p className="text-xs text-slate-300/80">Grupo de Alunos</p>
                      </div>
                    </div>
                    <p className="text-sm text-slate-200/85 mb-4">
                      Participe do grupo exclusivo de alunos para tirar dúvidas e compartilhar experiências.
                    </p>
                    <a
                      href="https://wa.me/5521999999999"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-semibold text-white transition-transform transform hover:scale-[1.02] w-full"
                      style={{ background: 'linear-gradient(135deg, #25D366 0%, #128C7E 100%)' }}
                    >
                      <span>Entrar no Grupo</span>
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  </div>

                  {/* Telegram */}
                  <div className="rounded-xl p-6 transition-transform transform hover:scale-[1.02] cursor-pointer" style={{ ...cardStyle, border: '1px solid rgba(0,193,106,0.18)' }}>
                    <div className="flex items-center space-x-3 mb-4">
                      <div className="w-12 h-12 rounded-lg flex items-center justify-center text-2xl" style={{ background: 'linear-gradient(135deg, #0088CC 0%, #229ED9 100%)' }}>
                        ✈️
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-white">Telegram</h3>
                        <p className="text-xs text-slate-300/80">Canal de Notícias</p>
                      </div>
                    </div>
                    <p className="text-sm text-slate-200/85 mb-4">
                      Receba atualizações sobre novos conteúdos, eventos e comunicados importantes.
                    </p>
                    <a
                      href="https://t.me/medcannlab"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-semibold text-white transition-transform transform hover:scale-[1.02] w-full"
                      style={{ background: 'linear-gradient(135deg, #0088CC 0%, #229ED9 100%)' }}
                    >
                      <span>Entrar no Canal</span>
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  </div>

                  {/* Twitter/X */}
                  <div className="rounded-xl p-6 transition-transform transform hover:scale-[1.02] cursor-pointer" style={{ ...cardStyle, border: '1px solid rgba(0,193,106,0.18)' }}>
                    <div className="flex items-center space-x-3 mb-4">
                      <div className="w-12 h-12 rounded-lg flex items-center justify-center text-2xl" style={{ background: 'linear-gradient(135deg, #000000 0%, #1DA1F2 100%)' }}>
                        🐦
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-white">Twitter/X</h3>
                        <p className="text-xs text-slate-300/80">@medcannlab</p>
                      </div>
                    </div>
                    <p className="text-sm text-slate-200/85 mb-4">
                      Acompanhe discussões sobre pesquisa, regulamentação e novidades do setor.
                    </p>
                    <a
                      href="https://twitter.com/medcannlab"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-semibold text-white transition-transform transform hover:scale-[1.02] w-full"
                      style={{ background: 'linear-gradient(135deg, #000000 0%, #1DA1F2 100%)' }}
                    >
                      <span>Seguir no Twitter/X</span>
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  </div>
                </div>

                {/* Informações Adicionais */}
                <div className="rounded-xl p-6" style={{ ...cardStyle, border: '1px solid rgba(0,193,106,0.18)' }}>
                  <h3 className="text-xl font-semibold text-white mb-4">Comunidade MedCannLab</h3>
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-semibold text-white mb-2">📌 Por que seguir nossas redes sociais?</h4>
                      <ul className="space-y-2 text-sm text-slate-200/85 list-disc list-inside ml-4">
                        <li>Acesso exclusivo a conteúdos educativos e casos clínicos</li>
                        <li>Participação em discussões com profissionais e colegas</li>
                        <li>Notificações sobre novos módulos e atualizações do curso</li>
                        <li>Oportunidades de networking e mentoria</li>
                        <li>Atualizações sobre eventos, webinars e workshops</li>
                      </ul>
                    </div>
                    <div className="pt-4 border-t border-slate-700/50">
                      <h4 className="font-semibold text-white mb-2">💡 Dica</h4>
                      <p className="text-sm text-slate-200/85">
                        Ative as notificações nas redes sociais para não perder nenhuma atualização importante sobre o curso e a comunidade MedCannLab.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Notícias */}
            {activeTab === 'noticias' && (
              <div className="space-y-6">

                {/* Filtros de Notícias */}
                <div className="rounded-xl p-4" style={secondarySurfaceStyle}>
                  <div className="flex flex-wrap gap-2">
                    <button className="px-4 py-2 text-white rounded-lg text-sm font-medium" style={{ background: accentGradient }}>
                      Todas
                    </button>
                    <button className="px-4 py-2 rounded-lg text-sm font-medium transition-transform transform hover:scale-[1.02]" style={{ background: 'rgba(12,34,54,0.7)', border: '1px solid rgba(0,193,106,0.1)', color: '#C8D6E5' }}>
                      Cannabis Medicinal
                    </button>
                    <button className="px-4 py-2 rounded-lg text-sm font-medium transition-transform transform hover:scale-[1.02]" style={{ background: 'rgba(12,34,54,0.7)', border: '1px solid rgba(0,193,106,0.1)', color: '#C8D6E5' }}>
                      Pesquisa Clínica
                    </button>
                    <button className="px-4 py-2 rounded-lg text-sm font-medium transition-transform transform hover:scale-[1.02]" style={{ background: 'rgba(12,34,54,0.7)', border: '1px solid rgba(0,193,106,0.1)', color: '#C8D6E5' }}>
                      Metodologia AEC
                    </button>
                    <button className="px-4 py-2 rounded-lg text-sm font-medium transition-transform transform hover:scale-[1.02]" style={{ background: 'rgba(12,34,54,0.7)', border: '1px solid rgba(0,193,106,0.1)', color: '#C8D6E5' }}>
                      Regulamentação
                    </button>
                  </div>
                </div>

                {/* Lista de Notícias */}
                <div className="space-y-4">
                  {[
                    {
                      id: 1,
                      title: 'Novos estudos sobre eficácia da Cannabis Medicinal em pacientes renais',
                      summary: 'Pesquisa recente demonstra resultados promissores no tratamento de pacientes com doença renal crônica.',
                      category: 'Pesquisa Clínica',
                      date: '2025-01-10',
                      image: 'https://via.placeholder.com/400x200'
                    },
                    {
                      id: 2,
                      title: 'Metodologia AEC ganha reconhecimento internacional',
                      summary: 'Arte da Entrevista Clínica é destaque em congresso internacional de medicina integrativa.',
                      category: 'Metodologia AEC',
                      date: '2025-01-08',
                      image: 'https://via.placeholder.com/400x200'
                    },
                    {
                      id: 3,
                      title: 'Atualizações na regulamentação de Cannabis Medicinal no Brasil',
                      summary: 'Anvisa publica novas diretrizes para prescrição e monitoramento de pacientes.',
                      category: 'Regulamentação',
                      date: '2025-01-05',
                      image: 'https://via.placeholder.com/400x200'
                    }
                  ].map((news) => (
                    <div
                      key={news.id}
                      className="rounded-xl p-6 transition-transform transform hover:scale-[1.01] cursor-pointer"
                      style={surfaceStyle}
                    >
                      <div className="flex items-start space-x-4">
                        <div className="w-32 h-24 rounded-lg flex-shrink-0" style={{ background: 'rgba(12,34,54,0.7)', border: '1px solid rgba(0,193,106,0.1)' }}></div>
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            <span className="px-2 py-1 rounded text-xs font-medium" style={{ background: 'rgba(79,224,193,0.18)', color: '#4FE0C1' }}>
                              {news.category}
                            </span>
                            <span className="text-xs text-slate-300/80">{news.date}</span>
                          </div>
                          <h3 className="text-lg font-semibold text-white mb-2">{news.title}</h3>
                          <p className="text-sm text-slate-200/80 mb-3">{news.summary}</p>
                          <button className="text-[#4FE0C1] hover:text-white text-sm font-medium flex items-center space-x-1">
                            <span>Ler mais</span>
                            <ExternalLink className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Simulações de Pacientes */}
            {activeTab === 'simulacoes' && (
              <div className="space-y-6">

                {/* Seleção de Sistema */}
                <div className="rounded-xl p-6 mb-6" style={surfaceStyle}>
                  <div className="flex items-center space-x-4 mb-6">
                    <div className="w-16 h-16 rounded-full flex items-center justify-center" style={{ background: accentGradient }}>
                      <Brain className="w-8 h-8 text-white" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-white">Simulação de Paciente com IA Residente</h3>
                      <p className="text-slate-200/80">Selecione um sistema para iniciar a simulação</p>
                    </div>
                  </div>

                  <p className="text-slate-200/80 mb-6">
                    A Nôa Esperança irá simular um paciente com alguma questão no sistema selecionado.
                    Você fará a entrevista clínica e, ao final, receberá uma avaliação da sua performance
                    de acordo com os critérios da Arte da Entrevista Clínica.
                  </p>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-semibold text-slate-200/90 mb-2">
                        Selecione o Sistema para Simulação:
                      </label>
                      <select
                        id="sistema-simulacao"
                        className="w-full px-4 py-3 rounded-lg text-white font-medium focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all"
                        style={inputStyle}
                        defaultValue=""
                      >
                        <option value="" disabled>Selecione um sistema...</option>
                        <option value="respiratorio">🫁 Sistema Respiratório</option>
                        <option value="urinario">💧 Sistema Urinário</option>
                        <option value="cardiovascular">❤️ Sistema Cardiovascular</option>
                        <option value="digestivo">🍽️ Sistema Digestivo</option>
                        <option value="nervoso">🧠 Sistema Nervoso</option>
                        <option value="endocrino">⚖️ Sistema Endócrino</option>
                        <option value="musculoesqueletico">💪 Sistema Músculo-Esquelético</option>
                        <option value="tegumentar">🦠 Sistema Tegumentar (Pele)</option>
                        <option value="reprodutor">👤 Sistema Reprodutor</option>
                        <option value="imunologico">🛡️ Sistema Imunológico</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-slate-200/90 mb-2">
                        Selecione o Tipo de Simulação:
                      </label>
                      <select
                        id="tipo-simulacao"
                        className="w-full px-4 py-3 rounded-lg text-white font-medium focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all"
                        style={inputStyle}
                        defaultValue=""
                      >
                        <option value="" disabled>Selecione um tipo de simulação...</option>
                        <option value="entrevista-geral">🩺 Entrevista Clínica Geral</option>
                        <option value="fatores-renais">🫘 Identificação de Fatores (Tradicionais e Não Tradicionais) - Doença Renal Crônica</option>
                        <option value="diagnostico-tea">🧩 Diagnóstico do Transtorno do Espectro Autista (TEA)</option>
                      </select>
                    </div>

                    <button
                      onClick={() => {
                        const selectSistema = document.getElementById('sistema-simulacao') as HTMLSelectElement
                        const selectTipo = document.getElementById('tipo-simulacao') as HTMLSelectElement
                        const sistemaSelecionado = selectSistema?.value
                        const tipoSelecionado = selectTipo?.value

                        if (!sistemaSelecionado) {
                          alert('Por favor, selecione um sistema para iniciar a simulação.')
                          return
                        }

                        if (!tipoSelecionado) {
                          alert('Por favor, selecione um tipo de simulação.')
                          return
                        }

                        const sistemas: Record<string, string> = {
                          'respiratorio': 'Sistema Respiratório',
                          'urinario': 'Sistema Urinário',
                          'cardiovascular': 'Sistema Cardiovascular',
                          'digestivo': 'Sistema Digestivo',
                          'nervoso': 'Sistema Nervoso',
                          'endocrino': 'Sistema Endócrino',
                          'musculoesqueletico': 'Sistema Músculo-Esquelético',
                          'tegumentar': 'Sistema Tegumentar (Pele)',
                          'reprodutor': 'Sistema Reprodutor',
                          'imunologico': 'Sistema Imunológico'
                        }

                        const tipos: Record<string, string> = {
                          'entrevista-geral': 'Entrevista Clínica Geral',
                          'fatores-renais': 'Identificação de Fatores Tradicionais e Não Tradicionais para Doença Renal Crônica',
                          'diagnostico-tea': 'Diagnóstico do Transtorno do Espectro Autista (TEA)'
                        }

                        const nomeSistema = sistemas[sistemaSelecionado] || sistemaSelecionado
                        const nomeTipo = tipos[tipoSelecionado] || tipoSelecionado

                        let mensagemInicial = ''

                        if (tipoSelecionado === 'fatores-renais') {
                          mensagemInicial =
                            `Vou iniciar uma simulação focada em ${nomeTipo}. ` +
                            `Você será o PACIENTE e eu serei o profissional de saúde. ` +
                            `Durante a entrevista clínica, você deve identificar fatores tradicionais (como pressão arterial, diabetes, função renal, exames laboratoriais) ` +
                            `e fatores não tradicionais (como estresse, sono, nutrição, atividade física, bem-estar mental) relacionados à doença renal crônica. ` +
                            `Use a metodologia Arte da Entrevista Clínica para conduzir a entrevista. ` +
                            `Ao final, vou avaliar sua performance de acordo com os critérios da AEC, especialmente sua capacidade de identificar e explorar ambos os tipos de fatores. ` +
                            `Vamos começar?`
                        } else if (tipoSelecionado === 'diagnostico-tea') {
                          mensagemInicial =
                            `Vou iniciar uma simulação focada em ${nomeTipo}. ` +
                            `Você será o PACIENTE e eu serei o profissional de saúde. ` +
                            `Durante a entrevista clínica, você deve aplicar técnicas da metodologia Arte da Entrevista Clínica para identificar sinais e sintomas relacionados ao TEA. ` +
                            `Use abordagem empática e observação cuidadosa dos comportamentos, comunicação e interação social. ` +
                            `Ao final, vou avaliar sua performance de acordo com os critérios da AEC, especialmente sua capacidade de conduzir uma entrevista sensível e completa para diagnóstico de TEA. ` +
                            `Vamos começar?`
                        } else {
                          mensagemInicial =
                            `Vou iniciar uma simulação de paciente com questão no ${nomeSistema}. ` +
                            `Você será o PACIENTE e eu serei o profissional de saúde. ` +
                            `Faça a entrevista clínica usando a metodologia Arte da Entrevista Clínica. ` +
                            `Ao final da entrevista, vou avaliar sua performance de acordo com os critérios da AEC. ` +
                            `Vamos começar?`
                        }

                        openChat()
                        sendInitialMessage(mensagemInicial)
                      }}
                      className="w-full text-white px-6 py-4 rounded-lg font-bold text-lg flex items-center justify-center space-x-2 shadow-lg hover:shadow-xl transition-transform transform hover:scale-105"
                      style={{ background: accentGradient }}
                    >
                      <Stethoscope className="w-6 h-6" />
                      <span>Iniciar Simulação de Paciente</span>
                    </button>
                  </div>

                  <div className="mt-6 p-4 rounded-lg" style={{ ...cardStyle, border: '1px solid rgba(0,193,106,0.18)' }}>
                    <h4 className="font-semibold text-white mb-2 flex items-center space-x-2">
                      <Award className="w-5 h-5 text-yellow-400" />
                      <span>Como Funciona:</span>
                    </h4>
                    <ul className="space-y-2 text-sm text-slate-200/80 list-disc list-inside">
                      <li>Selecione o sistema e o tipo de simulação que deseja praticar</li>
                      <li>A IA residente Nôa Esperança simulará um paciente conforme sua seleção</li>
                      <li>Você fará a entrevista clínica como profissional de saúde</li>
                      <li>A IA responderá como o paciente, seguindo o perfil clínico definido</li>
                      <li>Use as técnicas da metodologia Arte da Entrevista Clínica durante a entrevista</li>
                      <li>Ao final, você receberá uma avaliação detalhada da sua performance</li>
                      <li>A avaliação seguirá os critérios da metodologia Arte da Entrevista Clínica</li>
                      <li>Tipos disponíveis: Entrevista Geral, Fatores Renais (Tradicionais e Não Tradicionais), Diagnóstico de TEA</li>
                    </ul>
                  </div>
                </div>
              </div>
            )}

            {/* Biblioteca */}
            {activeTab === 'biblioteca' && (
              <div className="space-y-6">

                <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <article className="rounded-xl p-6 space-y-3" style={{ ...cardStyle, border: '1px solid rgba(0,193,106,0.18)' }}>
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg" style={{ background: secondaryGradient }}>
                        <Database className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-white">Conhecimento da IA Residente</h3>
                        <p className="text-xs text-slate-300/80 uppercase tracking-[0.28em]">Documentos vinculados à IA</p>
                      </div>
                    </div>
                    <p className="text-sm text-slate-200/85 leading-relaxed">
                      Explore relatórios clínicos, white papers e normas técnicas que alimentam a inteligência residente. Ideal para fundamentar estudos de caso e
                      preparar aulas alinhadas à pós-graduação.
                    </p>
                    <button
                      onClick={() => navigate('/app/library?filter=knowledge-base')}
                      className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-semibold text-white transition-transform transform hover:scale-[1.02]"
                      style={{ background: 'linear-gradient(135deg, #1a365d 0%, #274a78 100%)' }}
                    >
                      Ver Documentos Vinculados
                      <ExternalLink className="w-4 h-4" />
                    </button>
                  </article>

                  <article className="rounded-xl p-6 space-y-3" style={{ ...cardStyle, border: '1px solid rgba(0,193,106,0.18)' }}>
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg" style={{ background: accentGradient }}>
                        <Lightbulb className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-white">Leituras Sugeridas</h3>
                        <p className="text-xs text-slate-300/80 uppercase tracking-[0.28em]">Curadoria por módulo</p>
                      </div>
                    </div>
                    <p className="text-sm text-slate-200/85 leading-relaxed">
                      Receba recomendações alinhadas ao seu progresso no curso. A IA identifica lacunas e aponta artigos, vídeos e podcasts relevantes para cada módulo.
                    </p>
                    <button
                      onClick={() => {
                        openChat()
                        sendInitialMessage?.('Nôa, pode me indicar leituras sugeridas para o módulo atual da pós-graduação?')
                      }}
                      className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-semibold text-white transition-transform transform hover:scale-[1.02]"
                      style={{ background: 'linear-gradient(135deg, #00C16A 0%, #13794f 100%)' }}
                    >
                      Pedir Sugestões à IA
                      <MessageCircle className="w-4 h-4" />
                    </button>
                  </article>

                  <article className="rounded-xl p-6 space-y-3" style={{ ...cardStyle, border: '1px solid rgba(0,193,106,0.18)' }}>
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg" style={{ background: dangerGradient }}>
                        <Download className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-white">Materiais Complementares</h3>
                        <p className="text-xs text-slate-300/80 uppercase tracking-[0.28em]">Planilhas, roteiros e slides</p>
                      </div>
                    </div>
                    <p className="text-sm text-slate-200/85 leading-relaxed">
                      Faça download de checklists clínicos, roteiros de entrevista, simulados e slides base que auxiliam nas práticas supervisionadas e atividades de sala invertida.
                    </p>
                    <button
                      onClick={() => navigate('/app/library?filter=downloads')}
                      className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-semibold text-white transition-transform transform hover:scale-[1.02]"
                      style={{ background: 'linear-gradient(135deg, #FF5F6D 0%, #FFC371 100%)', color: '#10243D' }}
                    >
                      Acessar Downloads
                      <ExternalLink className="w-4 h-4" />
                    </button>
                  </article>
                </section>

                <section className="rounded-xl p-6" style={{ ...cardStyle, border: '1px solid rgba(0,193,106,0.18)' }}>
                  <h3 className="text-xl font-semibold text-white mb-4">Coleções em Destaque</h3>
                  <div className="space-y-4 text-sm text-slate-300/85">
                    <div>
                      <p className="font-semibold text-white">Arte da Entrevista Clínica</p>
                      <p className="mt-1 leading-relaxed">
                        Casos, transcrições comentadas, fichas IMRE e mapas de aprendizagem para cada eixo da metodologia desenvolvida pelo Dr. Ricardo Valença.
                      </p>
                      <button
                        onClick={() => navigate('/app/library?collection=aec')}
                        className="mt-3 inline-flex items-center gap-2 text-xs font-semibold text-rose-200 hover:text-rose-100 transition-colors"
                      >
                        Ver Coleção AEC
                        <ExternalLink className="w-3 h-3" />
                      </button>
                    </div>
                    <div>
                      <p className="font-semibold text-white">Cannabis & Função Renal</p>
                      <p className="mt-1 leading-relaxed">
                        Estudos clínicos, revisões sistemáticas e protocolos correlacionados à pesquisa MedCannLab sobre nefrologia e terapia canabinoide.
                      </p>
                      <button
                        onClick={() => navigate('/app/library?collection=medcannlab')}
                        className="mt-3 inline-flex items-center gap-2 text-xs font-semibold text-emerald-200 hover:text-emerald-100 transition-colors"
                      >
                        Explorar Material
                        <ExternalLink className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </section>
              </div>
            )}

            {/* Teste de Nivelamento */}
            {activeTab === 'teste' && (
              <div className="space-y-6">

                {/* Informações do Teste */}
                <div className="bg-slate-800 rounded-xl p-6 border border-slate-700 mb-6">
                  <h3 className="text-xl font-semibold text-white mb-4">Sobre o Teste de Nivelamento</h3>
                  <div className="space-y-3 text-slate-300">
                    <p>
                      O teste de nivelamento do curso <strong className="text-white">Arte da Entrevista Clínica</strong> ajuda a identificar:
                    </p>
                    <ul className="list-disc list-inside space-y-2 ml-4">
                      <li>Seu nível atual de conhecimento sobre entrevista clínica</li>
                      <li>Áreas que precisam de mais atenção</li>
                      <li>O melhor módulo para começar seus estudos</li>
                      <li>Conceitos que você já domina</li>
                    </ul>
                  </div>
                </div>

                {/* Estrutura do Teste */}
                <div className="bg-slate-800 rounded-xl p-6 border border-slate-700 mb-6">
                  <h3 className="text-xl font-semibold text-white mb-4">Estrutura do Teste</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-slate-700 rounded-lg p-4">
                      <div className="flex items-center space-x-2 mb-2">
                        <Target className="w-5 h-5 text-blue-400" />
                        <h4 className="font-semibold text-white">20 Questões</h4>
                      </div>
                      <p className="text-sm text-slate-400">Questões de múltipla escolha</p>
                    </div>
                    <div className="bg-slate-700 rounded-lg p-4">
                      <div className="flex items-center space-x-2 mb-2">
                        <Clock className="w-5 h-5 text-green-400" />
                        <h4 className="font-semibold text-white">30 Minutos</h4>
                      </div>
                      <p className="text-sm text-slate-400">Tempo estimado para conclusão</p>
                    </div>
                    <div className="bg-slate-700 rounded-lg p-4">
                      <div className="flex items-center space-x-2 mb-2">
                        <Award className="w-5 h-5 text-yellow-400" />
                        <h4 className="font-semibold text-white">Certificado</h4>
                      </div>
                      <p className="text-sm text-slate-400">Certificado de nivelamento</p>
                    </div>
                  </div>
                </div>

                {/* Botão de Iniciar Teste */}
                <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
                  <div className="text-center">
                    <Activity className="w-16 h-16 mx-auto mb-4 text-yellow-400" />
                    <h3 className="text-2xl font-bold text-white mb-2">Pronto para começar?</h3>
                    <p className="text-slate-300 mb-6">
                      O teste é adaptativo e se ajusta ao seu nível de conhecimento.
                      Não há penalidades por respostas incorretas.
                    </p>
                    <button
                      onClick={() => {
                        openChat()
                        sendInitialMessage('Vou iniciar o teste de nivelamento do curso Arte da Entrevista Clínica. Você está pronto para começar?')
                      }}
                      className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white px-8 py-4 rounded-lg font-bold text-lg hover:from-yellow-600 hover:to-orange-600 transition-colors flex items-center justify-center space-x-2 mx-auto"
                    >
                      <Zap className="w-5 h-5" />
                      <span>Iniciar Teste de Nivelamento</span>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Fórum Cann Matrix */}
            {activeTab === 'forum' && (
              <div className="space-y-6">
                <div className="rounded-xl p-6 relative min-h-[250px]" style={{ ...surfaceStyle, overflow: 'hidden' }}>
                  {/* Animação Matrix no background */}
                  <div
                    className="absolute inset-0 pointer-events-none"
                    style={{
                      opacity: 0.4,
                      zIndex: 1,
                      overflow: 'hidden'
                    }}
                  >
                    {Array.from({ length: 30 }).map((_, i) => (
                      <div
                        key={`matrix-${i}`}
                        style={{
                          position: 'absolute',
                          left: `${(i * 3.5) % 100}%`,
                          top: '-150px',
                          animation: `matrixFall ${3 + (i % 5)}s linear infinite`,
                          animationDelay: `${i * 0.12}s`,
                          color: '#00F5A0',
                          fontFamily: 'monospace',
                          fontSize: '15px',
                          fontWeight: 'bold',
                          textShadow: '0 0 15px rgba(0, 245, 160, 1), 0 0 25px rgba(0, 245, 160, 0.8), 0 0 35px rgba(0, 245, 160, 0.5)',
                          whiteSpace: 'nowrap',
                          letterSpacing: '3px',
                          zIndex: 1
                        }}
                      >
                        MedCannLab
                      </div>
                    ))}
                  </div>

                  {/* Conteúdo — compacto, sem ícone grande */}
                  <div className="relative" style={{ zIndex: 10 }}>
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                      <div>
                        <h2 className="text-lg font-bold text-white mb-1">Fórum Cann Matrix</h2>
                        <p className="text-slate-200/85 text-xs md:text-sm mb-3">
                          Comunidade viva para debates profissionais sobre cannabis medicinal, protocolos clínicos e pesquisa aplicada
                        </p>
                        <div className="flex flex-wrap items-center gap-2">
                          <button
                            onClick={() => navigate('/app/chat?context=aluno&moderation=true')}
                            className="px-3 py-1.5 rounded-lg flex items-center space-x-1.5 text-sm transition-colors"
                            style={{ background: accentGradient }}
                          >
                            <Flag className="w-3.5 h-3.5" />
                            <span>Painel de Moderação</span>
                          </button>
                          <div className="px-2.5 py-1.5 rounded-lg flex items-center space-x-1.5" style={{ background: 'rgba(0, 193, 106, 0.2)', border: '1px solid rgba(0, 193, 106, 0.3)' }}>
                            <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: '#00F5A0' }}></div>
                            <span className="text-xs font-medium" style={{ color: '#00F5A0' }}>Admin Online</span>
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={() => navigate('/app/chat?context=aluno')}
                        className="px-4 py-2 rounded-lg font-semibold text-white text-sm transition-transform transform hover:scale-[1.02] shrink-0"
                        style={{ background: dangerGradient, color: '#10243D' }}
                      >
                        Acessar Fórum
                      </button>
                    </div>
                  </div>

                  {/* CSS para animação Matrix */}
                  <style>{`
                    @keyframes matrixFall {
                      0% {
                        transform: translateY(-250px);
                        opacity: 0;
                      }
                      8% {
                        opacity: 1;
                      }
                      50% {
                        opacity: 1;
                      }
                      92% {
                        opacity: 1;
                      }
                      100% {
                        transform: translateY(700px);
                        opacity: 0;
                      }
                    }
                  `}</style>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="rounded-xl p-6" style={{ ...cardStyle, border: '1px solid rgba(0,193,106,0.18)' }}>
                    <h3 className="text-lg font-semibold text-white mb-2">Canais em Destaque</h3>
                    <ul className="space-y-2 text-sm text-slate-200/85 list-disc list-inside">
                      <li>#casos-clinicos – discussão orientada pelos docentes</li>
                      <li>#metodologia-aec – dúvidas sobre protocolos IMRE</li>
                      <li>#pesquisa-medcannlab – avanços e resultados parciais</li>
                      <li>#mentorias – agenda de plantões e aulas ao vivo</li>
                    </ul>
                  </div>
                  <div className="rounded-xl p-6" style={{ ...cardStyle, border: '1px solid rgba(0,193,106,0.18)' }}>
                    <h3 className="text-lg font-semibold text-white mb-2">Boas Práticas</h3>
                    <ul className="space-y-2 text-sm text-slate-200/85 list-disc list-inside">
                      <li>Traga evidências ou referências sempre que possível.</li>
                      <li>Mantenha confidencialidade dos pacientes.</li>
                      <li>Use marcadores de eixo (ensino/clinica/pesquisa) para organizar conteúdos.</li>
                      <li>Acione a equipe de moderação se notar condutas inadequadas.</li>
                    </ul>
                  </div>
                </div>
              </div>
            )}

            {/* Perfil do Aluno */}
            {activeTab === 'perfil' && (
              <div className="space-y-6">
                <div className="rounded-2xl p-8 mb-6" style={{ background: 'rgba(7,22,41,0.82)', border: '1px solid rgba(0,193,106,0.12)' }}>
                  <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
                    {/* Área do avatar — mais espaço e destaque */}
                    <div className="flex flex-col items-center shrink-0">
                      <div className="w-24 h-24 sm:w-28 sm:h-28 bg-gradient-to-br from-emerald-500 to-green-600 rounded-2xl flex items-center justify-center shadow-lg ring-2 ring-emerald-400/20">
                        <span className="text-white font-bold text-3xl sm:text-4xl">
                          {user?.name ? user.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() : 'A'}
                        </span>
                      </div>
                      <p className="font-semibold text-white mt-3 text-lg">{user?.name || 'Aluno'}</p>
                      <p className="text-sm text-emerald-400/90">Estudante</p>
                    </div>
                    <div className="flex-1 text-center sm:text-left min-w-0">
                      <h2 className="text-xl sm:text-2xl font-semibold text-white">Bem-vindo, {user?.name || 'Aluno'}!</h2>
                      <p className="text-slate-400 mt-1">Seu centro de acompanhamento completo como estudante</p>
                    </div>
                  </div>
                </div>
                {renderPerfil()}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* STANDARD FOOTER NAVIGATION */}


      <NoaConversationalInterface
        userName={user?.name || 'Aluno'}
        userCode={user?.id || 'STUDENT-001'}
        position="bottom-right"
        hideButton={true}
      />

      {/* Slide Player */}
      <SlidePlayer
        isOpen={isSlidePlayerOpen}
        onClose={() => setIsSlidePlayerOpen(false)}
        initialSlideId={selectedSlideId}
      />
    </div>
  )
}

export default AlunoDashboard
