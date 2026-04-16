import React, { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import {
  BookOpen,
  Clock,
  Users,
  Award,
  CheckCircle,
  Star,
  Upload,
  Plus,
  FileText,
  Video,
  Link as LinkIcon,
  Loader2,
  Calendar,
  Settings,
  Edit,
  FileVideo,
  Trash2,
  AlertCircle,
  Instagram,
  Music,
  Mic,
  Headphones,
  Zap,
  Play
} from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { normalizeUserType, getUserPermissions } from '../lib/userTypes'

import { useToast } from '../contexts/ToastContext'

interface Course {
  id: string
  title: string
  description: string
  category: string
  duration: string
  students: number
  rating: number
  price: string
  originalPrice: string | null
  level: string
  image?: string
  instructor: string
  lessons: number
  completed: boolean
  progress: number
  isLive: boolean
  nextClass: string | null
  badges: string[]
  href?: string
}

const Courses: React.FC = () => {
  const { user } = useAuth()
  const toast = useToast()
  const userRole = normalizeUserType((user as any)?.type || user?.user_metadata?.role || 'paciente')
  const isAdmin = userRole === 'admin' || userRole === 'master'
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [showUploadModal, setShowUploadModal] = useState(false)
  const [uploadType, setUploadType] = useState<'ebook' | 'youtube' | 'mp4' | 'instagram' | 'audio'>('youtube')
  const [editingCourse, setEditingCourse] = useState<Course | null>(null)
  const [courseModules, setCourseModules] = useState<any[]>([])
  const [selectedModuleId, setSelectedModuleId] = useState<string>('')
  const [courses, setCourses] = useState<Course[]>([])
  const [loading, setLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isCreatingModule, setIsCreatingModule] = useState(false)
  const [newModuleTitle, setNewModuleTitle] = useState('')
  const [moduleLessons, setModuleLessons] = useState<any[]>([])
  const [deletingLessonId, setDeletingLessonId] = useState<string | null>(null)

  // Estados para o formulário de novo curso
  const [formData, setFormData] = useState({
    title: '',
    url: '',
    duration: '',
    level: 'Iniciante',
    description: ''
  })

  const resetForm = () => {
    setFormData({
      title: '',
      url: '',
      duration: '',
      level: 'Iniciante',
      description: ''
    })
  }

  const handleSaveCourse = async () => {
    if (!formData.title || !formData.url) {
      toast.error("Título e link são obrigatórios para a aula")
      return
    }

    if (!editingCourse || !selectedModuleId) {
      toast.error("Selecione o curso e o módulo de destino")
      return
    }

    try {
      setIsSaving(true)

      // 1. Descobrir a próxima ordem (opcional, mas bom pra manter organizado)
      const { count: lessonCount } = await supabase
        .from('lessons')
        .select('*', { count: 'exact', head: true })
        .eq('module_id', selectedModuleId)

      // 2. Inserir a NOVA AULA vinculada ao módulo escolhido
      const durationMatch = formData.duration.match(/\d+/)
      const durationNumber = durationMatch ? parseInt(durationMatch[0]) : 10

      // Mapeamento para satisfazer a constraint do banco: (video, reading, quiz, assignment, interactive)
      const typeMapping: Record<string, string> = {
        youtube: 'video',
        instagram: 'video',
        mp4: 'video',
        ebook: 'reading',
        audio: 'interactive'
      }

      const { data, error } = await supabase
        .from('lessons')
        .insert({
          title: formData.title,
          description: formData.description || `Conteúdo via ${uploadType}`,
          video_url: formData.url,
          module_id: selectedModuleId,
          duration: durationNumber,
          order_index: (lessonCount || 0) + 1,
          lesson_type: typeMapping[uploadType as string] || 'video',
          is_locked: false
        })
        .select()

      if (error) {
        console.error('❌ Erro ao salvar aula:', error)
        throw error
      }

      toast.success(`Aula "${formData.title}" vinculada ao módulo com sucesso!`)

      setShowUploadModal(false)
      resetForm()
      loadCourses() // Atualiza a vitrine
    } catch (error: any) {
      console.error('Erro ao salvar aula:', error)
      toast.error(`Erro ao salvar aula: ${error.message}`)
    } finally {
      setIsSaving(false)
    }
  }

  const categories = [
    { id: 'all', name: 'Todos os Cursos' },
    { id: 'clinical', name: 'Clínica' },
    { id: 'cannabis', name: 'Cannabis Medicinal' },
    { id: 'interview', name: 'Entrevista Clínica' },
    { id: 'certification', name: 'Certificações' },
    { id: 'community-health', name: 'Saúde Comunitária' }
  ]

  const fetchModules = async (courseId: string) => {
    if (!courseId) return
    
    try {
      const course = courses.find(c => c.id === courseId)
      console.log(`🔍 [DEBUG] Buscando módulos para: "${course?.title}" (ID: ${courseId})`)
      
      let { data, error } = await supabase
        .from('course_modules')
        .select('*')
        .eq('course_id', courseId)
        .order('order_index', { ascending: true })

      if (!error && (!data || data.length === 0) && course?.title) {
        console.log('⚠️ Nenhum módulo por ID. Tentando buscar por título do curso...')
        const { data: fallbackData, error: fallbackError } = await supabase
          .from('course_modules')
          .select('*, courses!inner(title)')
          .ilike('courses.title', `%${course.title}%`)
          .order('order_index', { ascending: true })
        
        if (!fallbackError && fallbackData) {
          data = fallbackData
        }
      }

      const foundModules = data || []
      setCourseModules(foundModules)
      
      if (foundModules.length > 0) {
        setSelectedModuleId(foundModules[0].id)
        fetchLessons(foundModules[0].id)
      } else {
        setSelectedModuleId('')
        setModuleLessons([])
        // Se for o curso do Eduardo ou Ricardo, avisa que pode sincronizar
        if (course?.title?.toLowerCase().includes('cannabis') || course?.title?.toLowerCase().includes('eduardo')) {
          toast.info("Este curso possui estrutura na página. Use o botão de sincronização abaixo.")
        } else {
          toast.error("Nenhum módulo encontrado para este curso.")
        }
      }
    } catch (error: any) {
      console.error('Erro ao buscar módulos:', error)
      toast.error("Erro ao carregar estrutura do curso")
    }
  }

  const fetchLessons = async (moduleId: string) => {
    try {
      const { data, error } = await supabase
        .from('lessons')
        .select('*')
        .eq('module_id', moduleId)
        .order('order_index', { ascending: true })

      if (!error) {
        setModuleLessons(data || [])
      }
    } catch (err) {
      console.error('Erro ao buscar aulas:', err)
    }
  }

  const handleDeleteLesson = async (lessonId: string) => {
    if (!window.confirm('Tem certeza que deseja excluir esta aula?')) return

    try {
      setDeletingLessonId(lessonId)
      const { error } = await supabase
        .from('lessons')
        .delete()
        .eq('id', lessonId)

      if (error) throw error

      toast.success("Aula excluída com sucesso!")
      setModuleLessons(prev => prev.filter(l => l.id !== lessonId))
    } catch (error: any) {
      console.error('Erro ao excluir aula:', error)
      toast.error("Erro ao excluir aula")
    } finally {
      setDeletingLessonId(null)
    }
  }

  const syncStaticModules = async () => {
    if (!editingCourse) return
    setIsSaving(true)
    
    const titleLower = editingCourse.title.toLowerCase()
    let staticModules: string[] = []

    if (titleLower.includes('cannabis') || titleLower.includes('eduardo')) {
      staticModules = [
        'Introdução à Cannabis Medicinal',
        'Farmacologia e Biologia da Cannabis',
        'Aspectos Legais e Éticos',
        'Aplicações Clínicas e Protocolos'
      ]
    } else if (titleLower.includes('aec') || titleLower.includes('entrevista') || titleLower.includes('rins')) {
      staticModules = [
        'Fundamentos da Entrevista Clínica',
        'Abordagem AEC e Escuta Ativa',
        'Diagnóstico em Nefrologia',
        'Prática Clínica e Casos Reais'
      ]
    }

    if (staticModules.length === 0) {
      toast.error("Nenhum módulo padrão definido para este curso")
      setIsSaving(false)
      return
    }

    try {
      for (let i = 0; i < staticModules.length; i++) {
        await supabase.from('course_modules').insert({
          course_id: editingCourse.id,
          title: staticModules[i],
          order_index: i + 1
        })
      }
      toast.success("Módulos sincronizados com o banco!")
      fetchModules(editingCourse.id)
    } catch (err) {
      toast.error("Erro na sincronização")
    } finally {
      setIsSaving(false)
    }
  }

  // Carregar cursos do Supabase
  useEffect(() => {
    loadCourses()
  }, [user])

  // Buscar módulos quando entrar em modo edição
  useEffect(() => {
    if (editingCourse) {
      fetchModules(editingCourse.id)
    } else {
      setCourseModules([])
      setSelectedModuleId('')
    }
  }, [editingCourse])

  const loadCourses = async () => {
    try {
      setLoading(true)

      // Buscar cursos publicados
      const { data: coursesData, error: coursesError } = await supabase
        .from('courses')
        .select('*')
        .eq('is_published', true)
        .order('created_at', { ascending: false })

      if (coursesError) {
        console.error('Erro ao buscar cursos:', coursesError)
        setCourses([])
        setLoading(false)
        return
      }

      if (!coursesData || coursesData.length === 0) {
        setCourses([])
        setLoading(false)
        return
      }

      // Para cada curso, buscar dados adicionais
      const coursesWithStats = await Promise.all(
        coursesData.map(async (course) => {
          // Contar alunos inscritos
          const { count: studentsCount } = await supabase
            .from('course_enrollments')
            .select('*', { count: 'exact', head: true })
            .eq('course_id', course.id)

          // Contar módulos/aulas
          const { count: lessonsCount } = await supabase
            .from('course_modules')
            .select('*', { count: 'exact', head: true })
            .eq('course_id', course.id)

          // Buscar avaliações (ratings) - se a tabela existir
          let avgRating = 0
          try {
            const { data: ratingsData } = await supabase
              .from('course_ratings')
              .select('rating')
              .eq('course_id', course.id)

            if (ratingsData && ratingsData.length > 0) {
              avgRating = ratingsData.reduce((sum, r) => sum + (r.rating || 0), 0) / ratingsData.length
            }
          } catch (error) {
            // Tabela course_ratings pode não existir ainda
            console.log('Tabela course_ratings não encontrada, usando rating padrão')
          }

          // Buscar progresso do usuário atual (se logado)
          let userProgress = 0
          let userCompleted = false
          if (user) {
            const { data: enrollmentData } = await supabase
              .from('course_enrollments')
              .select('*')
              .eq('course_id', course.id)
              .eq('user_id', user.id)
              .maybeSingle()

            if (enrollmentData) {
              userProgress = (enrollmentData as any).progress || 0
              userCompleted = (enrollmentData as any).completed || false
            }
          }

          // Determinar categoria baseado no título/descrição
          const titleLower = course.title?.toLowerCase() || ''
          const descLower = course.description?.toLowerCase() || ''
          let category = 'all'
          if (titleLower.includes('aec') || titleLower.includes('entrevista') || descLower.includes('entrevista')) {
            category = 'interview'
          } else if (titleLower.includes('cannabis') || descLower.includes('cannabis')) {
            category = 'cannabis'
          } else if (titleLower.includes('imre') || descLower.includes('imre') || descLower.includes('nefrologia')) {
            category = 'clinical'
          } else if (titleLower.includes('acs') || titleLower.includes('jardins') || descLower.includes('comunitária')) {
            category = 'community-health'
          } else if (titleLower.includes('certificação') || titleLower.includes('pós-graduação')) {
            category = 'certification'
          }

          // Determinar badges baseado no título/descrição
          const badges: string[] = []
          if (titleLower.includes('aec')) badges.push('AEC')
          if (titleLower.includes('entrevista')) badges.push('Entrevista')
          if (titleLower.includes('cannabis')) badges.push('Cannabis')
          if (titleLower.includes('pós-graduação')) badges.push('Pós-Graduação')
          if (titleLower.includes('imre')) badges.push('IMRE')
          if (titleLower.includes('nefrologia')) badges.push('Nefrologia')
          if (titleLower.includes('acs')) badges.push('ACS')
          if (titleLower.includes('comunitária')) badges.push('Saúde Comunitária')
          if (titleLower.includes('dengue')) badges.push('Dengue')
          if (titleLower.includes('humanização')) badges.push('Humanização')
          if (titleLower.includes('comunicação')) badges.push('Comunicação')
          if (titleLower.includes('terapêutica')) badges.push('Terapêutica')
          if (titleLower.includes('certificação')) badges.push('Certificação')
          if (titleLower.includes('avaliação')) badges.push('Avaliação')

          // Formatar preço
          const price = course.price ? `R$ ${parseFloat(String(course.price)).toFixed(2).replace('.', ',')}` : 'Gratuito'
          const originalPrice = course.original_price ? `R$ ${parseFloat(String(course.original_price)).toFixed(2).replace('.', ',')}` : null

          // Verificar se há próxima aula (is_live)
          const isLive = course.is_live || false
          const nextClass = course.next_class_date || null

          // Determinar nível
          const level = course.level || 'Intermediário'

          return {
            id: course.id,
            title: course.title || 'Curso sem título',
            description: course.description || '',
            category,
            duration: course.duration || '0h',
            students: studentsCount || 0,
            rating: Math.round(avgRating * 10) / 10, // Arredondar para 1 casa decimal
            price,
            originalPrice,
            level,
            instructor: course.instructor || 'Instrutor',
            lessons: lessonsCount || 0,
            completed: userCompleted,
            progress: userProgress,
            isLive,
            nextClass,
            badges: badges.length > 0 ? badges : ['Curso'],
            href: (titleLower.includes('rins') || titleLower.includes('entrevista') || titleLower.includes('aec'))
              ? '/app/ensino/profissional/arte-entrevista-clinica'
              : (titleLower.includes('cannabis') && titleLower.includes('pós-graduação'))
                ? '/app/ensino/profissional/pos-graduacao-cannabis'
                : `/app/ensino/aluno/dashboard?courseId=${course.id}`
          } as Course
        })
      )

      setCourses(coursesWithStats)
    } catch (error) {
      console.error('Erro ao carregar cursos:', error)
      setCourses([])
    } finally {
      setLoading(false)
    }
  }

  const filteredCourses = selectedCategory === 'all'
    ? courses
    : courses.filter(course => course.category === selectedCategory)

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (loading) {
    return (
      <div className="min-h-screen overflow-x-hidden w-full flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-primary-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-300">Carregando cursos...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen overflow-x-hidden w-full bg-[#050914]">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full overflow-x-hidden">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-6">
          <div className="space-y-2">
            <h1 className="text-3xl lg:text-4xl font-bold text-white mb-3">
              Catálogo de Cursos
            </h1>
            <p className="text-base text-slate-400 max-w-2xl">
              Aprofunde seus conhecimentos clínicos, explore os protocolos atualizados e conecte-se com os maiores especialistas da MedCannLab.
            </p>
          </div>

          {isAdmin && (
            <button
              onClick={() => {
                setEditingCourse(null)
                setShowUploadModal(true)
              }}
              className="flex items-center space-x-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-8 py-4 rounded-2xl shadow-[0_0_20px_rgba(16,185,129,0.3)] transition-all duration-300 hover:scale-105 active:scale-95 shrink-0"
            >
              <Plus className="w-6 h-6" />
              <span>Novo Curso</span>
            </button>
          )}
        </div>

        {/* Categories */}
        <div className="mb-8 overflow-x-auto pb-2">
          <div className="flex flex-wrap gap-2">
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-300 ${selectedCategory === category.id
                  ? 'bg-emerald-600 text-white shadow-[0_0_15px_rgba(16,185,129,0.3)] border border-emerald-500/50'
                  : 'bg-slate-800/60 text-slate-400 hover:text-white hover:bg-slate-700/80 border border-slate-700/50'
                  }`}
              >
                {category.name}
              </button>
            ))}
          </div>
        </div>

        {/* Courses Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 w-full">
          {filteredCourses.map((course) => (
            <div key={course.id} className="bg-slate-900/40 backdrop-blur-sm rounded-2xl border border-slate-800 hover:border-emerald-500/50 hover:shadow-[0_0_30px_rgba(16,185,129,0.15)] transition-all duration-300 flex flex-col group overflow-hidden">
              {/* Course Image */}
              <div className="relative h-48 bg-slate-800/50 flex items-center justify-center border-b border-slate-800/50 group-hover:bg-slate-800 transition-colors duration-300">
                <BookOpen className="w-16 h-16 text-slate-600 group-hover:text-emerald-400 group-hover:scale-110 transition-all duration-300" />
                {course.isLive && (
                  <div className="absolute top-4 left-4">
                    <span className="bg-rose-500/90 text-white px-3 py-1 rounded-full text-xs font-bold tracking-wide shadow-[0_0_10px_rgba(244,63,94,0.5)]">
                      AO VIVO
                    </span>
                  </div>
                )}
                {course.completed && (
                  <div className="absolute top-4 right-4 bg-emerald-500/20 rounded-full p-1 backdrop-blur-md">
                    <CheckCircle className="w-6 h-6 text-emerald-400" />
                  </div>
                )}
              </div>

              {/* Course Content */}
              <div className="p-6 flex flex-col flex-1">
                {/* Badges */}
                <div className="flex flex-wrap gap-2 mb-4">
                  {course.badges.map((badge, index) => (
                    <span
                      key={index}
                      className="px-2.5 py-1 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[11px] font-bold uppercase tracking-wider rounded-full"
                    >
                      {badge}
                    </span>
                  ))}
                </div>

                {/* Title and Description */}
                <h3 className="text-xl font-bold text-white mb-2 leading-snug group-hover:text-emerald-300 transition-colors">
                  {course.title.toLowerCase().includes('rins') ? 'Curso da AEC - Avaliação Clínica Inicial' : course.title}
                </h3>
                <p className="text-slate-400 text-sm mb-6 line-clamp-2">
                  {course.title.toLowerCase().includes('rins')
                    ? 'Metodologia exclusiva de Avaliação Clínica Inicial (AEC) aplicada à prática médica e nefrologia.'
                    : course.description}
                </p>

                {/* Course Info */}
                <div className="grid grid-cols-2 gap-3 mb-6">
                  <div className="flex items-center text-sm text-slate-400 bg-slate-800/30 p-2 rounded-lg">
                    <Clock className="w-4 h-4 mr-2 text-emerald-500/70" />
                    <span className="truncate">{course.duration}</span>
                  </div>
                  <div className="flex items-center text-sm text-slate-400 bg-slate-800/30 p-2 rounded-lg">
                    <Users className="w-4 h-4 mr-2 text-indigo-500/70" />
                    <span className="truncate">{course.students.toLocaleString()} alunos</span>
                  </div>
                  {course.rating > 0 && (
                    <div className="flex items-center text-sm text-slate-400 bg-slate-800/30 p-2 rounded-lg">
                      <Star className="w-4 h-4 mr-2 text-amber-500/70" />
                      <span>{course.rating.toFixed(1)}</span>
                    </div>
                  )}
                  <div className="flex items-center text-sm text-slate-400 bg-slate-800/30 p-2 rounded-lg">
                    <Award className="w-4 h-4 mr-2 text-pink-500/70" />
                    <span className="truncate">{course.level}</span>
                  </div>
                </div>

                {/* Progress Bar */}
                {course.progress > 0 && (
                  <div className="mb-6">
                    <div className="flex justify-between text-sm text-slate-300 mb-2 font-medium">
                      <span>Progresso</span>
                      <span className="text-emerald-400">{course.progress}%</span>
                    </div>
                    <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden shadow-inner">
                      <div
                        className="bg-gradient-to-r from-emerald-500 to-emerald-400 h-2 rounded-full shadow-[0_0_10px_rgba(16,185,129,0.5)] transition-all duration-700 ease-out"
                        style={{ width: `${course.progress}%` }}
                      />
                    </div>
                  </div>
                )}

                {/* Next Class */}
                {course.nextClass && (
                  <div className="mb-6 p-3 bg-indigo-500/10 border border-indigo-500/20 rounded-xl">
                    <div className="flex items-center text-sm text-indigo-300 font-medium tracking-wide">
                      <Calendar className="w-4 h-4 mr-2 text-indigo-400" />
                      Próxima aula: {formatDate(course.nextClass)}
                    </div>
                  </div>
                )}

                <div className="mt-auto pt-4 border-t border-slate-800/50">
                  {/* Price */}
                  <div className="flex items-center justify-between xl:justify-start xl:gap-3 mb-5">
                    <span className="text-2xl font-bold text-white tracking-tight">
                      {course.price}
                    </span>
                    {course.originalPrice && (
                      <span className="text-sm font-medium text-slate-500 line-through decoration-slate-600">
                        {course.originalPrice}
                      </span>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-col gap-2">
                    {course.completed ? (
                      <button className="w-full bg-emerald-600/10 hover:bg-emerald-600/20 border border-emerald-500/30 text-emerald-400 font-semibold py-3 px-4 rounded-xl transition-all duration-200">
                        Baixar Certificado
                      </button>
                    ) : course.progress > 0 ? (
                      <Link
                        to={(course as any).href || `/course/${course.id}`}
                        className="w-full inline-flex items-center justify-center bg-emerald-600 hover:bg-emerald-500 text-white font-semibold py-3 px-4 rounded-xl shadow-[0_4px_14px_0_rgba(16,185,129,0.3)] transition-all duration-200"
                      >
                        Continuar Estudo
                      </Link>
                    ) : (
                      <Link
                        to={(course as any).href || `/course/${course.id}`}
                        className="w-full inline-flex items-center justify-center bg-emerald-600 hover:bg-emerald-500 text-white font-semibold py-3 px-4 rounded-xl shadow-[0_4px_14px_0_rgba(16,185,129,0.3)] transition-all duration-200"
                      >
                        Iniciar Curso
                      </Link>
                    )}

                    <button className="w-full bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium py-3 px-4 rounded-xl border border-slate-700 transition-all duration-200">
                      Ver Ementa Completa
                    </button>

                    {isAdmin && (
                      <button
                        onClick={() => {
                          setEditingCourse(course)
                          setShowUploadModal(true)
                        }}
                        className="w-full mt-2 bg-indigo-600/10 hover:bg-indigo-600/20 text-indigo-400 font-medium py-2 px-4 rounded-xl border border-indigo-500/30 transition-all flex items-center justify-center gap-2"
                      >
                        <Edit className="w-4 h-4" />
                        Editar Curso
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Empty State */}
        {filteredCourses.length === 0 && (
          <div className="text-center py-12">
            <BookOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-slate-900 dark:text-white dark:text-slate-900 dark:text-white mb-2">
              Nenhum curso encontrado
            </h3>
            <p className="text-gray-500 dark:text-gray-400">
              Tente selecionar uma categoria diferente
            </p>
          </div>
        )}

        {/* Upload/Edit Modal */}
        {showUploadModal && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50 p-2 md:p-4 animate-in fade-in duration-300">
            <div className="bg-[#0f172a] border border-slate-800 rounded-3xl max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
              <div className="p-6 md:p-8">
                <div className="flex justify-between items-center mb-8">
                  <div>
                    <h2 className="text-2xl font-extrabold text-white">
                      {editingCourse 
                        ? `Gerenciar: ${editingCourse.title.toLowerCase().includes('rins') ? 'Curso da AEC - Avaliação Clínica Inicial' : editingCourse.title}` 
                        : 'Novo Conteúdo'}
                    </h2>
                    <p className="text-slate-400 text-sm mt-1">
                      {editingCourse ? 'Edite a estrutura, módulos e aulas do curso' : 'Selecione o tipo de mídia para o seu novo curso'}
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setShowUploadModal(false)
                      setEditingCourse(null)
                    }}
                    className="w-10 h-10 flex items-center justify-center rounded-full bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition-all font-bold"
                  >
                    ✕
                  </button>
                </div>

                {/* Upload Type Selection - VOLTOU OS ÍCONES */}
                <div className="mb-8 overflow-x-auto pb-2">
                  <div className="flex gap-3 min-w-max pb-2">
                    {[
                      { id: 'youtube', label: 'YouTube', icon: Video, color: 'emerald' },
                      { id: 'instagram', label: 'Instagram', icon: Instagram, color: 'pink' },
                      { id: 'mp4', label: 'MP4 Local', icon: FileVideo, color: 'indigo' },
                      { id: 'ebook', label: 'E-book/PDF', icon: FileText, color: 'emerald' },
                      { id: 'audio', label: 'Áudio', icon: Mic, color: 'amber' }
                    ].map((type) => (
                      <button
                        key={type.id}
                        onClick={() => setUploadType(type.id as any)}
                        className={`flex flex-col items-center justify-center p-4 rounded-2xl min-w-[107px] border-2 transition-all ${uploadType === type.id
                          ? `bg-${type.color}-600/10 border-${type.color}-500 text-${type.color}-400 shadow-[0_0_15px_rgba(0,0,0,0.2)]`
                          : 'bg-slate-900/50 border-slate-800 text-slate-400 hover:border-slate-700'
                          }`}
                      >
                        <type.icon className="w-6 h-6 mb-2" />
                        <span className="text-[11px] font-bold uppercase tracking-wider">{type.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* PASSO 1: SELEÇÃO DO CURSO (DESTAQUE NO TOPO) */}
                {!editingCourse && (
                  <div className="mb-10 bg-emerald-500/5 border border-emerald-500/20 p-6 rounded-[32px] animate-in slide-in-from-top-4 duration-500">
                    <div className="flex flex-col md:flex-row items-center gap-6">
                      <div className="bg-emerald-500/20 p-4 rounded-2xl">
                        <BookOpen className="w-8 h-8 text-emerald-400" />
                      </div>
                      <div className="flex-1">
                        <label className="block text-xs font-black text-emerald-500 mb-2 uppercase tracking-[0.2em]">1º Passo Obrigatório</label>
                        <h3 className="text-xl font-bold text-white mb-3">Em qual curso vamos publicar?</h3>
                        <select
                          className="w-full px-5 py-4 bg-slate-950 border-2 border-emerald-500/30 rounded-2xl text-white outline-none focus:border-emerald-500 transition-all font-bold text-lg"
                          onChange={(e) => {
                            const selected = courses.find(c => c.id === e.target.value)
                            if (selected) {
                              setEditingCourse(selected)
                              fetchModules(selected.id)
                            }
                          }}
                        >
                          <option value="">-- Clique aqui para escolher o curso --</option>
                          {courses.map(c => (
                            <option key={c.id} value={c.id}>{c.title}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* Lado Esquerdo: Info Básica */}
                  <div className={`space-y-6 transition-all duration-500 ${!editingCourse ? 'opacity-40 grayscale' : 'opacity-100'}`}>
                    <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                      <Settings className="w-5 h-5 text-emerald-500" />
                      Informações Gerais
                    </h3>

                    <div>
                      <label className="block text-sm font-bold text-slate-300 mb-2 uppercase tracking-wide">Título da Aula/Conteúdo</label>
                      <input
                        type="text"
                        disabled={!editingCourse}
                        value={formData.title}
                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                        placeholder="Ex: Introdução à Prática Clínica"
                        className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-xl text-white placeholder-slate-500 outline-none focus:border-emerald-500/50"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-bold text-slate-300 mb-2 uppercase tracking-wide">Duração</label>
                        <input
                          type="text"
                          value={formData.duration}
                          onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                          placeholder="Ex: 45 min"
                          className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-xl text-white placeholder-slate-500 outline-none focus:border-emerald-500/50"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-slate-300 mb-2 uppercase tracking-wide">Nível</label>
                        <select
                          value={formData.level}
                          onChange={(e) => setFormData({ ...formData, level: e.target.value })}
                          className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-xl text-white outline-none focus:border-emerald-500/50"
                        >
                          <option>Iniciante</option>
                          <option>Intermediário</option>
                          <option>Avançado</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-bold text-slate-300 mb-2 uppercase tracking-wide">Resumo/Descrição</label>
                      <textarea
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        placeholder="Breve descrição do conteúdo..."
                        rows={3}
                        className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-xl text-white placeholder-slate-500 outline-none focus:border-emerald-500/50 resize-none"
                      />
                    </div>
                  </div>

                  {/* Lado Direito: Módulos e Vídeos */}
                  <div className="space-y-6">
                    <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                      <Video className="w-5 h-5 text-indigo-500" />
                      Estrutura do Curso
                    </h3>

                    <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-4 space-y-4 max-h-[350px] overflow-y-auto scrollbar-hide">
                      {!editingCourse ? (
                        <div className="text-center py-12 border-2 border-dashed border-slate-800 rounded-xl">
                          <AlertCircle className="w-10 h-10 text-slate-700 mx-auto mb-3" />
                          <p className="text-slate-500 text-xs px-6">Selecione um curso no dropdown ao lado para configurar os módulos e aulas.</p>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {!isCreatingModule ? (
                            <div>
                              <div className="flex justify-between items-center mb-2 px-1">
                                <label className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest">Módulo de Destino</label>
                                <button 
                                  onClick={() => setIsCreatingModule(true)}
                                  className="text-[10px] text-indigo-400 hover:text-indigo-300 font-bold uppercase transition-colors"
                                >
                                  + Criar Novo
                                </button>
                              </div>
                              
                              {(editingCourse?.title?.toLowerCase().includes('cannabis') || 
                                editingCourse?.title?.toLowerCase().includes('rins') || 
                                editingCourse?.title?.toLowerCase().includes('aec') ||
                                editingCourse?.title?.toLowerCase().includes('entrevista')) && courseModules.length === 0 && (
                                <button
                                  onClick={syncStaticModules}
                                  className="w-full mb-3 py-3 bg-amber-500/10 hover:bg-amber-500/20 text-amber-500 border border-amber-500/30 rounded-xl text-xs font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all animate-pulse"
                                >
                                  <Zap className="w-4 h-4" /> Sincronizar Módulos do Curso
                                </button>
                              )}

                              <select
                                value={selectedModuleId}
                                onChange={(e) => {
                                  setSelectedModuleId(e.target.value)
                                  fetchLessons(e.target.value)
                                }}
                                className="w-full px-4 py-3 bg-slate-900 border border-emerald-500/30 rounded-xl text-white outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/30 transition-all font-medium text-sm"
                              >
                                <option value="">-- Escolha o Módulo --</option>
                                {courseModules.map(m => (
                                  <option key={m.id} value={m.id}>{m.title}</option>
                                ))}
                              </select>

                              {courseModules.length === 0 && (
                                <p className="text-[10px] text-amber-500/80 mt-2 italic px-1 animate-pulse">
                                  ⚠️ Atenção: Este curso não possui módulos reais no banco. Clique em "+ Criar Novo" para começar.
                                </p>
                              )}
                            </div>
                          ) : (
                            <div className="animate-in zoom-in-95 duration-200">
                              <div className="flex justify-between items-center mb-2 px-1">
                                <label className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest">Novo Módulo</label>
                                <button 
                                  onClick={() => {
                                    setIsCreatingModule(false)
                                    setNewModuleTitle('')
                                  }}
                                  className="text-[10px] text-slate-500 hover:text-white font-bold uppercase transition-colors"
                                >
                                  Voltar
                                </button>
                              </div>
                              <input
                                type="text"
                                autoFocus
                                value={newModuleTitle}
                                onChange={(e) => setNewModuleTitle(e.target.value)}
                                placeholder="Nome do módulo (Ex: Módulo 1)"
                                className="w-full px-4 py-3 bg-slate-900 border border-indigo-500/30 rounded-xl text-white outline-none focus:border-indigo-500 transition-all font-medium text-sm placeholder:text-slate-600"
                              />
                            </div>
                          )}

                          {/* Preview do Módulo Selecionado & Lista de Aulas */}
                          {selectedModuleId && !isCreatingModule && (
                            <div className="space-y-4">
                              <div className="border border-emerald-500/20 rounded-xl p-4 bg-emerald-500/5 animate-in slide-in-from-top-2 duration-300">
                                <div className="flex justify-between items-center mb-3">
                                  <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest bg-emerald-500/10 px-2 py-0.5 rounded">Módulo Ativo</span>
                                  <CheckCircle className="w-4 h-4 text-emerald-400 font-bold" />
                                </div>
                                <h4 className="text-white text-xs font-bold mb-1 truncate">
                                  {courseModules.find(m => m.id === selectedModuleId)?.title}
                                </h4>
                                <p className="text-[10px] text-slate-500 italic">O novo vídeo será adicionado após as aulas abaixo.</p>
                              </div>

                              {moduleLessons.length > 0 && (
                                <div className="bg-slate-900/40 rounded-xl border border-slate-800 p-3">
                                  <h5 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3 px-1">Aulas Existentes ({moduleLessons.length})</h5>
                                  <div className="space-y-2">
                                    {moduleLessons.map((lesson) => (
                                      <div key={lesson.id} className="flex items-center justify-between p-2.5 rounded-lg bg-slate-800/50 border border-slate-700/50 group/item">
                                        <div className="flex items-center gap-3 min-w-0">
                                          <div className="w-6 h-6 rounded bg-slate-700 flex items-center justify-center shrink-0">
                                            <Play className="w-3 h-3 text-emerald-400" />
                                          </div>
                                          <span className="text-xs text-slate-300 truncate font-medium">{lesson.title}</span>
                                        </div>
                                        <button 
                                          onClick={() => handleDeleteLesson(lesson.id)}
                                          disabled={deletingLessonId === lesson.id}
                                          className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-md transition-all opacity-0 group-hover/item:opacity-100"
                                        >
                                          {deletingLessonId === lesson.id ? (
                                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                          ) : (
                                            <Trash2 className="w-3.5 h-3.5" />
                                          )}
                                        </button>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Seção de Vídeo Link / Arquivo */}
                    <div className="pt-4 border-t border-slate-800">
                      <label className="block text-sm font-bold text-emerald-500 mb-3 uppercase tracking-wide flex items-center gap-2">
                        <LinkIcon className="w-4 h-4" />
                        URL / Link de Origem ({uploadType.toUpperCase()})
                      </label>

                      {(uploadType === 'youtube' || uploadType === 'instagram') ? (
                        <div className="relative group">
                          <input
                            type="url"
                            value={formData.url}
                            onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                            placeholder={`Cole o link do ${uploadType} aqui...`}
                            className="w-full pl-4 pr-4 py-3.5 bg-slate-900 border border-slate-700 rounded-xl text-white placeholder-slate-600 text-sm outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/20 transition-all"
                          />
                        </div>
                      ) : (
                        <div className="p-6 border-2 border-dashed border-slate-800 rounded-xl bg-slate-900/30 text-center hover:border-emerald-500/30 transition-all cursor-pointer">
                          <Upload className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                          <span className="text-xs text-slate-500 block">Clique para enviar arquivo {uploadType.toUpperCase()}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Footer Actions */}
                <div className="flex justify-end gap-3 mt-10 pt-6 border-t border-slate-800">
                  <button
                    onClick={() => {
                      setShowUploadModal(false)
                      setEditingCourse(null)
                      resetForm()
                    }}
                    className="px-6 py-3 bg-slate-800 hover:bg-slate-700 text-slate-400 font-bold rounded-xl transition-all text-sm"
                  >
                    Descartar
                  </button>
                  <button
                    onClick={handleSaveCourse}
                    disabled={isSaving}
                    className="flex-1 md:flex-none px-12 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-black uppercase tracking-widest rounded-xl transition-all shadow-[0_0_25px_rgba(16,185,129,0.3)] disabled:opacity-50 text-sm"
                  >
                    {isSaving ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : (editingCourse ? 'Salvar no Curso' : 'Publicar Conteúdo')}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default Courses
