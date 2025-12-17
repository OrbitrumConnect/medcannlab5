import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, BookOpen, Clock, CheckCircle, Video, FileText, Award, Play } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'

const LessonDetail: React.FC = () => {
  const { moduleId, lessonId } = useParams<{ moduleId: string; lessonId: string }>()
  const navigate = useNavigate()
  const { user } = useAuth()
  
  const [lesson, setLesson] = useState<any>(null)
  const [module, setModule] = useState<any>(null)
  const [lessonContent, setLessonContent] = useState<string>('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (moduleId && lessonId) {
      loadLessonData()
    }
  }, [moduleId, lessonId])

  const loadLessonData = async () => {
    try {
      setLoading(true)
      
      // Tentar carregar do localStorage primeiro
      const storageKey = `lesson_${moduleId}_${lessonId}`
      const localContent = localStorage.getItem(storageKey)
      
      if (localContent) {
        setLessonContent(localContent)
      }

      // Buscar conteúdo do Supabase
      if (user) {
        try {
          const { data: lessonData, error } = await supabase
            .from('lesson_content')
            .select('*')
            .eq('module_id', moduleId)
            .eq('lesson_id', lessonId)
            .maybeSingle()

          if (!error && lessonData && lessonData.content) {
            setLessonContent(lessonData.content)
          }
        } catch (error) {
          console.warn('Erro ao buscar conteúdo da aula do Supabase:', error)
        }
      }

      // Carregar módulos mockados (mesmos do CursoEduardoFaveret)
      // Em produção, isso viria do Supabase
      const mockModules: any[] = [
        {
          id: '1',
          title: 'Introdução à Cannabis Medicinal',
          description: 'Fundamentos históricos, legais e científicos da cannabis medicinal',
          duration: '8h',
          lessonCount: 4,
          lessons: [
            {
              id: '1-1',
              title: 'História da Cannabis Medicinal',
              type: 'video',
              duration: '45min',
              isCompleted: false,
              isLocked: false,
              points: 50
            },
            {
              id: '1-2',
              title: 'Aspectos Legais e Regulamentação',
              type: 'video',
              duration: '60min',
              isCompleted: false,
              isLocked: false,
              points: 50
            },
            {
              id: '1-3',
              title: 'Farmacologia Básica dos Canabinoides',
              type: 'reading',
              duration: '30min',
              isCompleted: false,
              isLocked: false,
              points: 30
            },
            {
              id: '1-4',
              title: 'Quiz: Fundamentos',
              type: 'quiz',
              duration: '15min',
              isCompleted: false,
              isLocked: false,
              points: 40
            }
          ]
        },
        {
          id: '2',
          title: 'Farmacologia e Biologia da Cannabis',
          description: 'Mecanismos de ação, receptores e sistemas endocanabinoides',
          duration: '12h',
          lessonCount: 6,
          lessons: [
            {
              id: '2-1',
              title: 'Sistema Endocanabinoide',
              type: 'video',
              duration: '60min',
              isCompleted: false,
              isLocked: false,
              points: 60
            },
            {
              id: '2-2',
              title: 'Receptores CB1 e CB2',
              type: 'video',
              duration: '55min',
              isCompleted: false,
              isLocked: false,
              points: 55
            },
            {
              id: '2-3',
              title: 'Metabolismo dos Canabinoides',
              type: 'video',
              duration: '50min',
              isCompleted: false,
              isLocked: false,
              points: 50
            },
            {
              id: '2-4',
              title: 'Interações Farmacológicas',
              type: 'reading',
              duration: '45min',
              isCompleted: false,
              isLocked: false,
              points: 45
            },
            {
              id: '2-5',
              title: 'Casos Clínicos: Farmacologia',
              type: 'assignment',
              duration: '90min',
              isCompleted: false,
              isLocked: false,
              points: 80
            },
            {
              id: '2-6',
              title: 'Quiz: Farmacologia',
              type: 'quiz',
              duration: '30min',
              isCompleted: false,
              isLocked: false,
              points: 60
            }
          ]
        },
        {
          id: '3',
          title: 'Aspectos Legais e Éticos',
          description: 'Regulamentação, prescrição e aspectos éticos do uso medicinal',
          duration: '6h',
          lessonCount: 3,
          lessons: [
            {
              id: '3-1',
              title: 'Regulamentação no Brasil',
              type: 'reading',
              duration: '60min',
              isCompleted: false,
              isLocked: false,
              points: 60
            },
            {
              id: '3-2',
              title: 'Prescrição e Documentação',
              type: 'video',
              duration: '45min',
              isCompleted: false,
              isLocked: false,
              points: 45
            },
            {
              id: '3-3',
              title: 'Aspectos Éticos',
              type: 'reading',
              duration: '30min',
              isCompleted: false,
              isLocked: false,
              points: 30
            }
          ]
        },
        {
          id: '4',
          title: 'Aplicações Clínicas e Protocolos',
          description: 'Indicações clínicas, protocolos de tratamento e monitoramento',
          duration: '15h',
          lessonCount: 8,
          lessons: [
            {
              id: '4-1',
              title: 'Indicações Clínicas',
              type: 'video',
              duration: '60min',
              isCompleted: false,
              isLocked: false,
              points: 60
            },
            {
              id: '4-2',
              title: 'Protocolos de Tratamento',
              type: 'video',
              duration: '75min',
              isCompleted: false,
              isLocked: false,
              points: 75
            },
            {
              id: '4-3',
              title: 'Dosagem e Titulação',
              type: 'video',
              duration: '50min',
              isCompleted: false,
              isLocked: false,
              points: 50
            },
            {
              id: '4-4',
              title: 'Monitoramento de Efeitos',
              type: 'video',
              duration: '45min',
              isCompleted: false,
              isLocked: false,
              points: 45
            },
            {
              id: '4-5',
              title: 'Contraindicações',
              type: 'reading',
              duration: '40min',
              isCompleted: false,
              isLocked: false,
              points: 40
            },
            {
              id: '4-6',
              title: 'Interações Medicamentosas',
              type: 'reading',
              duration: '50min',
              isCompleted: false,
              isLocked: false,
              points: 50
            },
            {
              id: '4-7',
              title: 'Casos Clínicos Práticos',
              type: 'assignment',
              duration: '120min',
              isCompleted: false,
              isLocked: false,
              points: 100
            },
            {
              id: '4-8',
              title: 'Quiz: Aplicações Clínicas',
              type: 'quiz',
              duration: '30min',
              isCompleted: false,
              isLocked: true,
              points: 60
            }
          ]
        },
        {
          id: '5',
          title: 'Avaliação e Monitoramento de Pacientes',
          description: 'Ferramentas de avaliação, acompanhamento e ajuste de protocolos',
          duration: '8h',
          lessonCount: 4,
          lessons: [
            {
              id: '5-1',
              title: 'Escalas de Avaliação',
              type: 'video',
              duration: '60min',
              isCompleted: false,
              isLocked: true,
              points: 60
            },
            {
              id: '5-2',
              title: 'Monitoramento de Efeitos Adversos',
              type: 'video',
              duration: '45min',
              isCompleted: false,
              isLocked: true,
              points: 45
            },
            {
              id: '5-3',
              title: 'Ajuste de Protocolos',
              type: 'video',
              duration: '50min',
              isCompleted: false,
              isLocked: true,
              points: 50
            },
            {
              id: '5-4',
              title: 'Relatórios e Documentação',
              type: 'reading',
              duration: '30min',
              isCompleted: false,
              isLocked: true,
              points: 30
            }
          ]
        }
      ]

      // Buscar o módulo e a aula nos módulos mockados
      const foundModule = mockModules.find(m => m.id === moduleId)
      if (foundModule) {
        setModule(foundModule)
        const foundLesson = foundModule.lessons.find((l: any) => l.id === lessonId)
        if (foundLesson) {
          setLesson(foundLesson)
          // Se não encontrou conteúdo ainda, usar título da aula como conteúdo padrão
          if (!lessonContent) {
            setLessonContent(`# ${foundLesson.title}\n\nConteúdo da aula será exibido aqui.\n\n**Duração:** ${foundLesson.duration}\n**Tipo:** ${foundLesson.type}\n**Pontos:** ${foundLesson.points}`)
          }
        } else {
          console.warn(`Aula ${lessonId} não encontrada no módulo ${moduleId}`)
          // Criar aula genérica se não encontrada
          setLesson({
            id: lessonId,
            title: `Aula ${lessonId}`,
            type: 'video',
            duration: '45min',
            isCompleted: false,
            isLocked: false,
            points: 50
          })
          if (!lessonContent) {
            setLessonContent(`# Aula ${lessonId}\n\nConteúdo da aula será exibido aqui.`)
          }
        }
      } else {
        console.warn(`Módulo ${moduleId} não encontrado`)
        // Criar módulo e aula genéricos se não encontrados
        setModule({
          id: moduleId,
          title: `Módulo ${moduleId}`,
          description: 'Módulo do curso',
          duration: '8h'
        })
        setLesson({
          id: lessonId,
          title: `Aula ${lessonId}`,
          type: 'video',
          duration: '45min',
          isCompleted: false,
          isLocked: false,
          points: 50
        })
        if (!lessonContent) {
          setLessonContent(`# Aula ${lessonId}\n\nConteúdo da aula será exibido aqui.`)
        }
      }
    } catch (error) {
      console.error('Erro ao carregar dados da aula:', error)
    } finally {
      setLoading(false)
    }
  }

  const getLessonIcon = (type: string) => {
    switch (type) {
      case 'video':
        return <Video className="w-5 h-5" />
      case 'reading':
        return <FileText className="w-5 h-5" />
      case 'quiz':
        return <Award className="w-5 h-5" />
      default:
        return <BookOpen className="w-5 h-5" />
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto mb-4"></div>
          <p className="text-slate-400">Carregando aula...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-900 text-white">
      {/* Header */}
      <div className="bg-slate-800 border-b border-slate-700 sticky top-0 z-10">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate(-1)}
                className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div>
                <h1 className="text-xl font-bold">{lesson?.title || 'Aula'}</h1>
                {module && (
                  <p className="text-sm text-slate-400">{module.title}</p>
                )}
              </div>
            </div>
            <div className="flex items-center space-x-4">
              {lesson && (
                <>
                  <div className="flex items-center space-x-2 text-sm text-slate-400">
                    {getLessonIcon(lesson.type)}
                    <span>{lesson.duration}</span>
                  </div>
                  {lesson.isCompleted && (
                    <CheckCircle className="w-5 h-5 text-green-500" />
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Lesson Content */}
          <div className="bg-slate-800 rounded-xl p-6 md:p-8 mb-6">
            <div className="prose prose-invert max-w-none">
              {lessonContent ? (
                <div 
                  className="text-slate-200 whitespace-pre-wrap"
                  dangerouslySetInnerHTML={{ __html: lessonContent.replace(/\n/g, '<br />') }}
                />
              ) : (
                <div className="text-center py-12">
                  <BookOpen className="w-16 h-16 text-slate-600 mx-auto mb-4" />
                  <p className="text-slate-400">Conteúdo da aula em desenvolvimento.</p>
                </div>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between">
            <button
              onClick={() => navigate(-1)}
              className="px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors"
            >
              Voltar
            </button>
            {lesson && !lesson.isCompleted && (
              <button
                onClick={() => {
                  // Marcar como concluída
                  // TODO: Implementar lógica de conclusão
                  alert('Aula marcada como concluída!')
                }}
                className="px-6 py-2 bg-green-600 hover:bg-green-700 rounded-lg transition-colors flex items-center space-x-2"
              >
                <CheckCircle className="w-5 h-5" />
                <span>Marcar como Concluída</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default LessonDetail

