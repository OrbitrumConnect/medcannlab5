import React, { useState, useEffect, useMemo } from 'react'
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
  Zap,
  FileText,
  Plus,
  Upload,
  Edit,
  Trash2,
  Link as ExternalLink,
  Menu as LayoutDashboard,
  Database,
  Lightbulb,
  Save,
  X
} from 'lucide-react'
import { useNoaPlatform } from '../contexts/NoaPlatformContext'
import NoaConversationalInterface from '../components/NoaConversationalInterface'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
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

const backgroundGradient = 'linear-gradient(135deg, #0A192F 0%, #1a365d 55%, #2d5a3d 100%)'
const surfaceStyle: React.CSSProperties = {
  background: 'rgba(7, 22, 41, 0.88)',
  border: '1px solid rgba(0, 193, 106, 0.12)',
  boxShadow: '0 18px 42px rgba(2, 12, 27, 0.45)'
}
const secondarySurfaceStyle: React.CSSProperties = {
  background: 'rgba(12, 34, 54, 0.8)',
  border: '1px solid rgba(0, 193, 106, 0.1)',
  boxShadow: '0 14px 32px rgba(2, 12, 27, 0.38)'
}
const cardStyle: React.CSSProperties = {
  background: 'rgba(15, 36, 60, 0.7)',
  border: '1px solid rgba(0, 193, 106, 0.12)',
  boxShadow: '0 12px 28px rgba(2, 12, 27, 0.35)'
}
const accentGradient = 'linear-gradient(135deg, #00C16A 0%, #13794f 100%)'
const secondaryGradient = 'linear-gradient(135deg, #1a365d 0%, #274a78 100%)'
const goldenGradient = 'linear-gradient(135deg, #FFD33D 0%, #FFAA00 100%)'
const dangerGradient = 'linear-gradient(135deg, #FF5F6D 0%, #FFC371 100%)'

const tabBaseButton =
  'inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap'

const getTabButtonStyles = (active: boolean) => {
  return {
    className: `${tabBaseButton} ${active ? 'text-white shadow-lg' : 'text-[#C8D6E5]'}`,
    style: active
      ? { background: accentGradient, border: '1px solid rgba(0,193,106,0.35)' }
      : { background: 'rgba(12, 34, 54, 0.6)', border: '1px solid rgba(0,193,106,0.08)' }
  }
}

const inputStyle: React.CSSProperties = {
  background: 'rgba(12,34,54,0.78)',
  border: '1px solid rgba(0,193,106,0.18)',
  color: '#E6F4FF',
  boxShadow: '0 10px 24px rgba(2,12,27,0.35)'
}

type StudentTab = 'dashboard' | 'redes-sociais' | 'noticias' | 'simulacoes' | 'teste' | 'biblioteca' | 'forum'

const AlunoDashboard: React.FC = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const [searchParams, setSearchParams] = useSearchParams()
  const { user } = useAuth()
  const { openChat, sendInitialMessage } = useNoaPlatform()
  const [activeTab, setActiveTab] = useState<StudentTab>('dashboard')
  const [isSlidePlayerOpen, setIsSlidePlayerOpen] = useState(false)
  const [selectedSlideId, setSelectedSlideId] = useState<string | undefined>(undefined)
  const [mainCourse, setMainCourse] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [selectedModule, setSelectedModule] = useState<{ id: string; title: string } | null>(null)
  const [moduleContent, setModuleContent] = useState<string>('')
  const [isEditingModule, setIsEditingModule] = useState(false)
  const [isSavingModule, setIsSavingModule] = useState(false)

  const navItems: Array<{
    id: StudentTab
    label: string
    icon: React.ComponentType<{ className?: string }>
  }> = useMemo(
    () => [
      { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
      { id: 'redes-sociais', label: 'Redes Sociais', icon: Share2 },
      { id: 'noticias', label: 'Notícias', icon: FileText },
      { id: 'simulacoes', label: 'Simulações', icon: Stethoscope },
      { id: 'teste', label: 'Teste de Nivelamento', icon: Activity },
      { id: 'biblioteca', label: 'Biblioteca', icon: BookOpen },
      { id: 'forum', label: 'Fórum Cann Matrix', icon: MessageCircle },
      { id: 'perfil', label: 'Meu Perfil', icon: User }
    ],
    []
  )

  const validTabs = useMemo<StudentTab[]>(
    () => ['dashboard', 'redes-sociais', 'noticias', 'simulacoes', 'teste', 'biblioteca', 'forum'],
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

  useEffect(() => {
    const section = searchParams.get('section') as StudentTab | null
    if (section && validTabs.includes(section) && section !== activeTab) {
      setActiveTab(section)
    }
    if (!section && location.pathname.includes('/app/ensino/aluno/dashboard') && activeTab !== 'dashboard') {
      setActiveTab('dashboard')
    }
  }, [searchParams, location.pathname, activeTab, validTabs])

  // Carregar cursos do Supabase
  useEffect(() => {
    if (user) {
      loadCourses()
    }
  }, [user])

  // Carregar conteúdo do módulo quando selecionado
  useEffect(() => {
    if (selectedModule) {
      loadModuleContent(selectedModule.id)
    }
  }, [selectedModule])

  const loadModuleContent = async (moduleId: string) => {
    try {
      // Verificar localStorage como fallback
      const storageKey = `module_${moduleId}`
      const localContent = localStorage.getItem(storageKey)
      
      // Tentar buscar do banco de dados
      const { data: moduleData, error } = await supabase
        .from('course_modules')
        .select('content, description, lesson_content')
        .eq('id', moduleId)
        .single()

      if (!error && moduleData) {
        const content = moduleData.content || moduleData.description || ''
        if (content) {
          setModuleContent(content)
        } else if (localContent) {
          setModuleContent(localContent)
        } else {
          setModuleContent(`# ${selectedModule?.title || 'Módulo'}\n\nConteúdo do módulo será exibido aqui.\n\nVocê pode editar este conteúdo clicando no botão "Editar" abaixo.`)
        }
      } else {
        if (localContent) {
          setModuleContent(localContent)
        } else {
          setModuleContent(`# ${selectedModule?.title || 'Módulo'}\n\nConteúdo do módulo será exibido aqui.\n\nVocê pode editar este conteúdo clicando no botão "Editar" abaixo.`)
        }
      }
    } catch (error) {
      console.error('Erro ao carregar conteúdo do módulo:', error)
      const storageKey = `module_${moduleId}`
      const localContent = localStorage.getItem(storageKey)
      if (localContent) {
        setModuleContent(localContent)
      } else {
        setModuleContent(`# ${selectedModule?.title || 'Módulo'}\n\nConteúdo do módulo será exibido aqui.\n\nVocê pode editar este conteúdo clicando no botão "Editar" abaixo.`)
      }
    }
  }

  const saveModuleContent = async () => {
    if (!selectedModule || !user) return

    setIsSavingModule(true)
    try {
      // Tentar salvar no banco de dados
      const { error: updateError } = await supabase
        .from('course_modules')
        .update({
          content: moduleContent,
          updated_at: new Date().toISOString()
        })
        .eq('id', selectedModule.id)

      if (updateError) {
        console.warn('Aviso ao atualizar course_modules:', updateError)
      }

      // Salvar no localStorage como fallback
      const storageKey = `module_${selectedModule.id}`
      localStorage.setItem(storageKey, moduleContent)

      setIsEditingModule(false)
      alert('Conteúdo do módulo salvo com sucesso!')
    } catch (error) {
      console.error('Erro ao salvar conteúdo do módulo:', error)
      // Salvar no localStorage como fallback
      const storageKey = `module_${selectedModule.id}`
      localStorage.setItem(storageKey, moduleContent)
      alert('Conteúdo salvo localmente. Alguns dados podem não ter sido sincronizados com o servidor.')
    } finally {
      setIsSavingModule(false)
    }
  }

  const loadCourses = async () => {
    if (!user) return

    try {
      // Buscar especificamente o curso "Pós-graduação em Cannabis Medicinal" do Dr. Eduardo Faveret
      // Usar query mais simples para evitar erro 500
      const { data: courses, error: coursesError } = await supabase
        .from('courses')
        .select('*')
        .eq('is_published', true)
        .or('title.ilike.%cannabis%,title.ilike.%eduardo%,instructor.ilike.%eduardo%')
        .limit(1)

      if (coursesError) {
        console.error('Erro ao buscar curso:', coursesError)
        setMainCourse(FALLBACK_COURSE)
        setLoading(false)
        return
      }

      const course = courses && courses.length > 0 ? courses[0] : null

      if (!course) {
        console.log('Curso do Dr. Eduardo Faveret não encontrado, aplicando conteúdo padrão')
        setMainCourse(FALLBACK_COURSE)
        setLoading(false)
        return
      }

      // Verificar se o aluno está inscrito, se não estiver, criar a inscrição
      const { data: enrollment, error: enrollmentError } = await supabase
        .from('course_enrollments')
        .select('*')
        .eq('user_id', user.id)
        .eq('course_id', course.id)
        .maybeSingle()

      let userEnrollment = enrollment

      // Se não estiver inscrito, criar a inscrição
      if (!enrollment && enrollmentError?.code === 'PGRST116') {
        const { data: newEnrollment, error: createError } = await supabase
          .from('course_enrollments')
          .insert({
            user_id: user.id,
            course_id: course.id,
            progress: 0,
            status: 'in_progress',
            enrolled_at: new Date().toISOString()
          })
          .select()
          .single()

        if (createError) {
          console.error('Erro ao criar inscrição:', createError)
        } else {
          userEnrollment = newEnrollment
        }
      } else if (!enrollment) {
        // Tentar criar mesmo se não for erro PGRST116
        const { data: newEnrollment, error: createError } = await supabase
          .from('course_enrollments')
          .insert({
            user_id: user.id,
            course_id: course.id,
            progress: 0,
            status: 'in_progress',
            enrolled_at: new Date().toISOString()
          })
          .select()
          .single()

        if (!createError && newEnrollment) {
          userEnrollment = newEnrollment
        }
      }

      // Buscar módulos do curso
      const { data: modules } = await supabase
        .from('course_modules')
        .select('*')
        .eq('course_id', course.id)
        .order('order_index', { ascending: true })

      // Buscar número de alunos inscritos
      const { count: studentsCount } = await supabase
        .from('course_enrollments')
        .select('*', { count: 'exact', head: true })
        .eq('course_id', course.id)

      // Determinar instrutor
      const instructor = course.instructor || 'Dr. Eduardo Faveret'

      setMainCourse({
        id: course.id,
        title: course.title || 'Pós-Graduação em Cannabis Medicinal',
        subtitle: 'Ambiente de Ensino, Clínica e Pesquisa - MedCannLab 3.0',
        description: course.description || 'Curso completo de Pós-Graduação em Cannabis Medicinal, integrando os eixos de Ensino, Clínica e Pesquisa da plataforma MedCannLab 3.0.',
        progress: userEnrollment?.progress || 0,
        status: userEnrollment?.status === 'completed' ? 'Concluído' : 'Em Andamento',
        instructor: instructor,
        duration: course.duration_text || `${course.duration || 60} horas`,
        nextClass: course.next_class_date ? new Date(course.next_class_date).toLocaleDateString('pt-BR') : null,
        color: 'from-green-400 to-green-500',
        logo: '🌿',
        studentsCount: studentsCount || 0,
        modules: (modules || []).map((m: any) => ({
          id: m.id,
          title: m.title,
          description: m.description || '',
          progress: 0, // TODO: Calcular progresso por módulo
          status: 'Disponível',
          duration: `${m.duration || 0} minutos`,
          lessons: [] // TODO: Adicionar lições
        }))
      })
    } catch (error) {
      console.error('Erro ao carregar cursos:', error)
      setMainCourse(FALLBACK_COURSE)
    } finally {
      setLoading(false)
    }
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
      {/* Header */}
      <div
        className="px-6 py-8"
        style={{
          background:
            'linear-gradient(135deg, rgba(10,25,47,0.95) 0%, rgba(26,54,93,0.9) 55%, rgba(45,90,61,0.85) 100%)',
          borderBottom: '1px solid rgba(0,193,106,0.18)'
        }}
      >
        <div className="max-w-7xl mx-auto space-y-3">
          <h1 className="text-2xl md:text-3xl font-bold text-white">Dashboard do Aluno</h1>
          <p className="text-slate-200/80 text-sm md:text-base">
            Área de Ensino • {mainCourse?.title ?? 'Pós-Graduação em Cannabis Medicinal'}
          </p>
        </div>
      </div>

      <div className="px-4 py-6 md:px-6 md:py-8">
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-wrap gap-2">
              {navItems.map(item => {
                const styles = getTabButtonStyles(activeTab === item.id)
                const Icon = item.icon
                const isActive = activeTab === item.id
                return (
                  <button
                    key={item.id}
                    onClick={() => handleTabChange(item.id)}
                    className={styles.className}
                    style={styles.style}
                    onMouseEnter={(e) => {
                      if (!isActive) {
                        e.currentTarget.style.background = 'rgba(0, 193, 106, 0.08)'
                        e.currentTarget.style.borderColor = 'rgba(0,193,106,0.15)'
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isActive) {
                        e.currentTarget.style.background = 'rgba(12, 34, 54, 0.6)'
                        e.currentTarget.style.borderColor = 'rgba(0,193,106,0.08)'
                      }
                    }}
                    onTouchStart={(e) => {
                      if (!isActive) {
                        e.currentTarget.style.background = 'rgba(0, 193, 106, 0.08)'
                        e.currentTarget.style.borderColor = 'rgba(0,193,106,0.15)'
                      }
                    }}
                    onTouchEnd={(e) => {
                      if (!isActive) {
                        setTimeout(() => {
                          e.currentTarget.style.background = 'rgba(12, 34, 54, 0.6)'
                          e.currentTarget.style.borderColor = 'rgba(0,193,106,0.08)'
                        }, 150)
                      }
                    }}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{item.label}</span>
                  </button>
                )
              })}
            </div>
            <button
              onClick={() => openChat()}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg font-semibold text-white shadow-lg transition-transform transform hover:scale-[1.02]"
              style={{ background: accentGradient }}
            >
              <Brain className="w-4 h-4" />
              <span>Conversar com Nôa</span>
            </button>
          </div>

          <div className="max-w-6xl mx-auto w-full overflow-x-hidden space-y-8">
            {/* Dashboard Principal */}
            {activeTab === 'dashboard' && (
              <>
            {/* Welcome Section */}
            <div className="rounded-xl p-6 mb-8" style={surfaceStyle}>
              <div className="flex items-center space-x-4 mb-4 stack-mobile">
                <div className="w-16 h-16 rounded-xl flex items-center justify-center text-4xl" style={{ background: 'rgba(12, 34, 54, 0.6)', border: '1px solid rgba(0,193,106,0.08)' }}>
                  {mainCourse.logo || '🌿'}
                </div>
                <div>
                  <h2 className="text-3xl font-bold text-white mb-1">{mainCourse.title}</h2>
                  <p className="text-slate-200/80 text-sm">{mainCourse.subtitle}</p>
                </div>
              </div>
              <p className="text-slate-200/80 mb-4 text-lg">
                {mainCourse.description}
              </p>
              <div className="flex items-center space-x-4 inline-actions-responsive">
                <button 
                  onClick={() => {
                    navigate('/app/ensino/profissional/pos-graduacao-cannabis')
                  }}
                  className="px-6 py-3 rounded-lg font-semibold transition-transform transform hover:scale-[1.02] flex items-center space-x-2"
                  style={{ background: accentGradient }}
                >
                  <Play className="w-5 h-5" />
                  <span className="text-white">Acessar Curso</span>
                </button>
                <div className="flex items-center space-x-4 text-slate-200/80 text-sm inline-actions-responsive">
                  <span>⏱️ {mainCourse.duration}</span>
                  <span>👨‍🏫 {mainCourse.instructor}</span>
                  <span>📚 {mainCourse.modules.length} Módulos</span>
                  {mainCourse.studentsCount && (
                    <span>👥 {mainCourse.studentsCount} Alunos</span>
                  )}
                </div>
              </div>
            </div>


            <div className="grid grid-cols-1 gap-8 w-full overflow-x-hidden">
              {/* Courses Section */}
              <div className="w-full overflow-x-hidden">
                <div className="rounded-xl p-4 md:p-6 overflow-hidden w-full max-w-full" style={surfaceStyle}>
                  <div className="flex items-center justify-between mb-6 stack-mobile">
                    <h3 className="text-xl font-semibold text-white">Meu Curso Principal</h3>
                    <button 
                      onClick={() => navigate('/app/ensino/profissional/pos-graduacao-cannabis')}
                      className="text-white px-4 py-2 rounded-lg font-semibold transition-transform transform hover:scale-[1.02]"
                      style={{ background: accentGradient }}
                    >
                      Ver Detalhes
                    </button>
                  </div>

                  {/* Curso Principal */}
                  <div
                    className="rounded-lg p-4 md:p-6 mb-6 transition-transform transform hover:scale-[1.01] overflow-hidden w-full max-w-full"
                    style={cardStyle}
                  >
                    <div className="flex items-start justify-between mb-4 gap-2 flex-wrap">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-3 mb-2 flex-wrap gap-2">
                          <h4 className="text-lg font-semibold text-white break-words flex-1 min-w-0">{mainCourse.title}</h4>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium flex-shrink-0 ${getStatusColor(mainCourse.status)}`}>
                            {mainCourse.status}
                          </span>
                        </div>
                        <p className="text-sm text-slate-200/80 mb-3 break-words">{mainCourse.description}</p>
                        
                        <div className="flex items-center flex-wrap gap-x-4 gap-y-2 text-sm text-slate-300/80 mb-4">
                          <span className="whitespace-nowrap">Instrutor: {mainCourse.instructor}</span>
                          <span className="whitespace-nowrap">Duração: {mainCourse.duration}</span>
                          <span className="whitespace-nowrap">Próxima aula: {mainCourse.nextClass || 'N/A'}</span>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <button className="p-2 rounded-lg transition-colors" style={{ background: 'rgba(12,34,54,0.82)', border: '1px solid rgba(0,193,106,0.18)' }}>
                          <Play className="w-4 h-4" />
                        </button>
                        <button className="p-2 rounded-lg transition-colors" style={{ background: 'rgba(12,34,54,0.82)', border: '1px solid rgba(0,193,106,0.18)' }}>
                          <Download className="w-4 h-4" />
                        </button>
                        <button className="p-2 rounded-lg transition-colors" style={{ background: 'rgba(12,34,54,0.82)', border: '1px solid rgba(0,193,106,0.18)' }}>
                          <Share2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    
                    {/* Progress Bar */}
                    <div className="mb-4">
                      <div className="flex items-center justify-between text-sm mb-1">
                        <span className="text-slate-200/80">Progresso Geral</span>
                        <span className="text-white font-medium">{mainCourse.progress}%</span>
                      </div>
                      <div className="w-full rounded-full h-2" style={{ background: 'rgba(12,34,54,0.6)' }}>
                        <div 
                          className={`h-2 rounded-full ${getProgressColor(mainCourse.progress)}`}
                          style={{ width: `${mainCourse.progress}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Módulos do Curso */}
                  <div className="space-y-4 w-full overflow-x-hidden">
                    <h4 className="text-lg font-semibold text-white mb-4 break-words">Módulos do Curso</h4>
                    {mainCourse.modules.map((module: any, moduleIndex: number) => (
                      <div
                        key={module.id}
                        onClick={() => setSelectedModule({ id: module.id, title: module.title })}
                        className="rounded-lg p-4 md:p-5 transition-transform transform hover:scale-[1.01] overflow-hidden w-full max-w-full cursor-pointer"
                        style={{ ...cardStyle, border: '1px solid rgba(0,193,106,0.18)' }}
                      >
                        <div className="flex items-start justify-between mb-4 gap-2 flex-wrap">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center space-x-3 mb-2 flex-wrap gap-2">
                              <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-sm flex-shrink-0" style={{ background: accentGradient }}>
                                {moduleIndex + 1}
                              </div>
                              <div className="flex-1 min-w-0">
                                <h5 className="text-md font-semibold text-white break-words">{module.title}</h5>
                                <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium mt-1 ${getStatusColor(module.status)}`}>
                                  {module.status}
                                </span>
                              </div>
                            </div>
                            <p className="text-sm text-slate-200/80 mb-3 ml-0 md:ml-11 break-words">{module.description}</p>
                            
                            {/* Aulas do Módulo */}
                            {module.lessons && module.lessons.length > 0 && (
                              <div className="ml-0 md:ml-11 space-y-2 w-full overflow-x-hidden">
                                <p className="text-xs text-slate-500 font-medium mb-2 break-words">Aulas deste módulo:</p>
                                <div className="grid grid-cols-1 gap-2 w-full overflow-x-hidden">
                                  {module.lessons && module.lessons.map((lesson: any, lessonIndex: number) => (
                                    <div
                                      key={lessonIndex}
                                      className="flex items-center space-x-2 text-sm text-slate-200/80 rounded-lg p-2 overflow-hidden w-full max-w-full"
                                      style={{ background: 'rgba(12,34,54,0.72)', border: '1px solid rgba(0,193,106,0.12)' }}
                                    >
                                      <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: '#00F5A0' }}></div>
                                      <span className="flex-1 break-words min-w-0">{lesson}</span>
                                      <button
                                        className="p-1 rounded transition-colors flex-shrink-0"
                                        style={{ background: 'rgba(12,34,54,0.82)', border: '1px solid rgba(0,193,106,0.18)' }}
                                      >
                                        <Play className="w-3 h-3" style={{ color: '#00F5A0' }} />
                                      </button>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                            
                            <div className="flex items-center flex-wrap gap-x-4 gap-y-2 text-sm text-slate-300/80 mt-3 ml-0 md:ml-11">
                              <span className="whitespace-nowrap">⏱️ Duração: {module.duration}</span>
                              {module.lessons && <span className="whitespace-nowrap">📚 {module.lessons.length} aulas</span>}
                            </div>
                          </div>
                          
                          <div className="flex items-center space-x-2 flex-shrink-0">
                            <button 
                              onClick={(e) => {
                                e.stopPropagation()
                                navigate('/app/ensino/profissional/pos-graduacao-cannabis', { state: { moduleId: module.id } })
                              }}
                              className="p-2 rounded-lg transition-transform transform hover:scale-105 text-white"
                              style={{ background: accentGradient }}
                              title="Iniciar Módulo"
                            >
                              <Play className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                        
                        {/* Progress Bar */}
                        <div className="mb-2 ml-11">
                          <div className="flex items-center justify-between text-sm mb-1">
                            <span className="text-slate-200/80">Progresso do Módulo</span>
                            <span className="text-white font-medium">{module.progress}%</span>
                          </div>
                          <div className="w-full rounded-full h-2" style={{ background: 'rgba(12,34,54,0.6)' }}>
                            <div 
                              className={`h-2 rounded-full ${getProgressColor(module.progress)}`}
                              style={{ width: `${module.progress}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Upcoming Classes */}
                <div className="rounded-xl p-6 mt-6" style={surfaceStyle}>
                  <h3 className="text-xl font-semibold text-white mb-6">Próximas Aulas</h3>

                  <div className="text-center py-8">
                    <Calendar className="w-12 h-12 mx-auto mb-3" style={{ color: '#4FE0C1' }} />
                    <p className="text-slate-200/80">Nenhuma aula agendada no momento</p>
                    <p className="text-sm text-slate-300/80 mt-2">As próximas aulas serão anunciadas em breve</p>
                  </div>
                </div>
              </div>

            </div>
              </>
            )}

            {/* Redes Sociais */}
            {activeTab === 'redes-sociais' && (
              <div className="space-y-6">
                <div className="rounded-xl p-6 mb-8" style={surfaceStyle}>
                  <h2 className="text-2xl font-bold text-white mb-2">📱 Ferramentas de Redes Sociais</h2>
                  <p className="text-slate-200/80">
                    Conteúdo educativo formatado para TikTok e Instagram. Aprenda e compartilhe conhecimento de forma moderna.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* TikTok */}
                  <div className="rounded-xl p-6 transition-transform transform hover:scale-[1.01]" style={surfaceStyle}>
                    <div className="flex items-center space-x-3 mb-4">
                      <div className="w-12 h-12 rounded-lg flex items-center justify-center" style={{ background: secondaryGradient }}>
                        <Video className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-white">TikTok</h3>
                        <p className="text-sm text-slate-300/80">Conteúdo em formato vertical</p>
                      </div>
                    </div>
                    <p className="text-slate-200/80 mb-4">
                      Vídeos curtos e envolventes sobre Cannabis Medicinal, Arte da Entrevista Clínica e casos clínicos.
                    </p>
                    <div className="space-y-2 mb-4">
                      <div className="flex items-center space-x-2 text-sm text-slate-300/80">
                        <CheckCircle className="w-4 h-4" style={{ color: '#00F5A0' }} />
                        <span>Vídeos educativos de 15-60 segundos</span>
                      </div>
                      <div className="flex items-center space-x-2 text-sm text-slate-300/80">
                        <CheckCircle className="w-4 h-4" style={{ color: '#00F5A0' }} />
                        <span>Casos clínicos resumidos</span>
                      </div>
                      <div className="flex items-center space-x-2 text-sm text-slate-300/80">
                        <CheckCircle className="w-4 h-4" style={{ color: '#00F5A0' }} />
                        <span>Dicas rápidas de entrevista clínica</span>
                      </div>
                    </div>
                    <button
                      className="w-full text-white px-4 py-3 rounded-lg font-semibold transition-transform transform hover:scale-[1.02] flex items-center justify-center space-x-2"
                      style={{ background: secondaryGradient }}
                    >
                      <ExternalLink className="w-4 h-4" />
                      <span>Acessar Conteúdo TikTok</span>
                    </button>
                  </div>

                  {/* Instagram */}
                  <div className="rounded-xl p-6 transition-transform transform hover:scale-[1.01]" style={surfaceStyle}>
                    <div className="flex items-center space-x-3 mb-4">
                      <div className="w-12 h-12 rounded-lg flex items-center justify-center" style={{ background: accentGradient }}>
                        <Share2 className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-white">Instagram</h3>
                        <p className="text-sm text-slate-300/80">Posts e stories educativos</p>
                      </div>
                    </div>
                    <p className="text-slate-200/80 mb-4">
                      Carrosséis, reels e posts informativos sobre Cannabis Medicinal e metodologia AEC.
                    </p>
                    <div className="space-y-2 mb-4">
                      <div className="flex items-center space-x-2 text-sm text-slate-300/80">
                        <CheckCircle className="w-4 h-4" style={{ color: '#00F5A0' }} />
                        <span>Carrosséis educativos</span>
                      </div>
                      <div className="flex items-center space-x-2 text-sm text-slate-300/80">
                        <CheckCircle className="w-4 h-4" style={{ color: '#00F5A0' }} />
                        <span>Reels informativos</span>
                      </div>
                      <div className="flex items-center space-x-2 text-sm text-slate-300/80">
                        <CheckCircle className="w-4 h-4" style={{ color: '#00F5A0' }} />
                        <span>Stories com quizzes</span>
                      </div>
                    </div>
                    <button
                      className="w-full text-white px-4 py-3 rounded-lg font-semibold transition-transform transform hover:scale-[1.02] flex items-center justify-center space-x-2"
                      style={{ background: accentGradient }}
                    >
                      <ExternalLink className="w-4 h-4" />
                      <span>Acessar Conteúdo Instagram</span>
                    </button>
                  </div>
                </div>

                {/* Dicas de Uso */}
                <div className="rounded-xl p-6" style={surfaceStyle}>
                  <h3 className="text-xl font-semibold text-white mb-4">💡 Dicas de Uso</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="rounded-lg p-4" style={cardStyle}>
                      <h4 className="font-semibold text-white mb-2">📊 Compartilhe seu Progresso</h4>
                      <p className="text-sm text-slate-200/80">
                        Compartilhe suas conquistas e aprendizados nas redes sociais usando as hashtags oficiais.
                      </p>
                    </div>
                    <div className="rounded-lg p-4" style={cardStyle}>
                      <h4 className="font-semibold text-white mb-2">🎯 Engajamento</h4>
                      <p className="text-sm text-slate-200/80">
                        Interaja com outros alunos e profissionais através das redes sociais da plataforma.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Notícias */}
            {activeTab === 'noticias' && (
              <div className="space-y-6">
                <div className="rounded-xl p-6 mb-8" style={surfaceStyle}>
                  <h2 className="text-2xl font-bold text-white mb-2">📰 Notícias e Atualizações</h2>
                  <p className="text-slate-200/80">
                    Fique por dentro das últimas notícias sobre Cannabis Medicinal, pesquisa clínica e metodologia AEC.
                  </p>
                </div>

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
                <div className="rounded-xl p-6 mb-8" style={surfaceStyle}>
                  <h2 className="text-2xl font-bold text-white mb-2">🩺 Simulações de Pacientes</h2>
                  <p className="text-slate-200/80">
                    Pratique entrevistas clínicas com pacientes simulados pela IA residente Nôa Esperança. 
                    Desenvolva suas habilidades de comunicação e avaliação clínica usando a metodologia Arte da Entrevista Clínica.
                  </p>
                </div>

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
                            `Você será o profissional de saúde e eu serei o paciente. ` +
                            `Durante a entrevista clínica, você deve identificar fatores tradicionais (como pressão arterial, diabetes, função renal, exames laboratoriais) ` +
                            `e fatores não tradicionais (como estresse, sono, nutrição, atividade física, bem-estar mental) relacionados à doença renal crônica. ` +
                            `Use a metodologia Arte da Entrevista Clínica para conduzir a entrevista. ` +
                            `Ao final, vou avaliar sua performance de acordo com os critérios da AEC, especialmente sua capacidade de identificar e explorar ambos os tipos de fatores. ` +
                            `Vamos começar?`
                        } else if (tipoSelecionado === 'diagnostico-tea') {
                          mensagemInicial = 
                            `Vou iniciar uma simulação focada em ${nomeTipo}. ` +
                            `Você será o profissional de saúde e eu serei o paciente (ou responsável, dependendo do caso). ` +
                            `Durante a entrevista clínica, você deve aplicar técnicas da metodologia Arte da Entrevista Clínica para identificar sinais e sintomas relacionados ao TEA. ` +
                            `Use abordagem empática e observação cuidadosa dos comportamentos, comunicação e interação social. ` +
                            `Ao final, vou avaliar sua performance de acordo com os critérios da AEC, especialmente sua capacidade de conduzir uma entrevista sensível e completa para diagnóstico de TEA. ` +
                            `Vamos começar?`
                        } else {
                          mensagemInicial = 
                            `Vou iniciar uma simulação de paciente com questão no ${nomeSistema}. ` +
                            `Você será o profissional de saúde e eu serei o paciente. ` +
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
                <section className="rounded-xl p-6" style={{ ...surfaceStyle, border: '1px solid rgba(0,193,106,0.18)' }}>
                  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                    <div>
                      <h2 className="text-2xl font-bold text-white mb-2 flex items-center space-x-2">
                        <BookOpen className="w-6 h-6 text-[#00F5A0]" />
                        <span>Biblioteca Acadêmica</span>
                      </h2>
                      <p className="text-slate-200/85 text-sm md:text-base leading-relaxed">
                        Consulte artigos, protocolos clínicos, roteiros de aula e materiais complementares que sustentam a pós-graduação. Todo o acervo está
                        integrado à base de conhecimento utilizada pela IA residente.
                      </p>
                    </div>
                    <button
                      onClick={() => navigate('/app/library')}
                      className="inline-flex items-center gap-2 px-5 py-3 rounded-lg font-semibold text-white transition-transform transform hover:scale-[1.03]"
                      style={{ background: accentGradient }}
                    >
                      <BookOpen className="w-4 h-4" />
                      Abrir Biblioteca
                    </button>
                  </div>
                </section>

                <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <article className="rounded-xl p-6 space-y-3" style={{ ...cardStyle, border: '1px solid rgba(0,193,106,0.18)' }}>
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg" style={{ background: secondaryGradient }}>
                        <Database className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-white">Base de Conhecimento</h3>
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
                <div className="rounded-xl p-6 mb-8" style={surfaceStyle}>
                  <h2 className="text-2xl font-bold text-white mb-2">📝 Teste de Nivelamento</h2>
                  <p className="text-slate-200/80">
                    Avalie seus conhecimentos sobre Arte da Entrevista Clínica e descubra o melhor ponto de partida no curso.
                  </p>
                </div>

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
                <div className="rounded-xl p-6" style={surfaceStyle}>
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div>
                      <h2 className="text-2xl font-bold text-white mb-2 flex items-center space-x-2">
                        <MessageCircle className="w-6 h-6 text-[#FF8E72]" />
                        <span>Fórum Cann Matrix</span>
                      </h2>
                      <p className="text-slate-200/85 text-sm md:text-base">
                        Participe de debates entre estudantes, preceptores e equipe clínica. Compartilhe experiências de campo, discuta casos sob supervisão e acompanhe comunicados importantes.
                      </p>
                    </div>
                    <button
                      onClick={() => navigate('/app/chat?context=aluno')}
                      className="px-5 py-3 rounded-lg font-semibold text-white transition-transform transform hover:scale-[1.03]"
                      style={{ background: dangerGradient, color: '#10243D' }}
                    >
                      Acessar Fórum
                    </button>
                  </div>
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
          </div>
        </div>
      </div>

      {/* Interface Conversacional da Nôa Esperança - Fixa no canto */}
      <NoaConversationalInterface 
        userName={user?.name || 'Aluno'}
        userCode={user?.id || 'STUDENT-001'}
        position="bottom-right"
        hideButton={false}
      />

      {/* Slide Player */}
      <SlidePlayer
        isOpen={isSlidePlayerOpen}
        onClose={() => setIsSlidePlayerOpen(false)}
        initialSlideId={selectedSlideId}
      />

      {/* Modal de Visualização/Edição de Módulo */}
      {selectedModule && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 rounded-xl p-8 max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col border border-slate-700">
            {/* Header */}
            <div className="flex items-start justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-white mb-2">
                  {selectedModule.title}
                </h2>
                <p className="text-sm text-gray-400">
                  {isEditingModule ? 'Modo de Edição' : 'Visualização'}
                </p>
              </div>
              <div className="flex items-center space-x-2">
                {isEditingModule ? (
                  <>
                    <button
                      onClick={saveModuleContent}
                      disabled={isSavingModule}
                      className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                    >
                      <Save className="w-4 h-4" />
                      <span>{isSavingModule ? 'Salvando...' : 'Salvar'}</span>
                    </button>
                    <button
                      onClick={() => {
                        setIsEditingModule(false)
                        loadModuleContent(selectedModule.id)
                      }}
                      className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-semibold transition-colors flex items-center space-x-2"
                    >
                      <X className="w-4 h-4" />
                      <span>Cancelar</span>
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={() => setIsEditingModule(true)}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-colors flex items-center space-x-2"
                    >
                      <Edit className="w-4 h-4" />
                      <span>Editar</span>
                    </button>
                    <button
                      onClick={() => {
                        setSelectedModule(null)
                        setIsEditingModule(false)
                        setModuleContent('')
                      }}
                      className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-semibold transition-colors"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto">
              {isEditingModule ? (
                <textarea
                  value={moduleContent}
                  onChange={(e) => setModuleContent(e.target.value)}
                  className="w-full h-full min-h-[400px] p-4 bg-slate-900 text-white rounded-lg border border-slate-700 focus:outline-none focus:border-blue-500 font-mono text-sm resize-none"
                  placeholder="Digite o conteúdo do módulo aqui..."
                />
              ) : (
                <div className="p-4 bg-slate-900 rounded-lg border border-slate-700">
                  <div className="whitespace-pre-wrap text-white text-sm leading-relaxed">
                    {moduleContent || 'Nenhum conteúdo disponível. Clique em "Editar" para adicionar conteúdo.'}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default AlunoDashboard
