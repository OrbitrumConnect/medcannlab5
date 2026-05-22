import React, { useState } from 'react'
import { 
  BookOpen, 
  Clock, 
  CheckCircle, 
  Star,
  Users,
  Award,
  FileText,
  Video,
  MessageCircle,
  User,
  Brain,
  Heart,
  Stethoscope,
  GraduationCap,
  Shield,
  Activity
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import NoaConversationalInterface from '../components/NoaConversationalInterface'

interface Module {
  id: string
  title: string
  description: string
  duration: string
  lessonCount: number
  isCompleted: boolean
  progress: number
  lessons: Lesson[]
}

interface Lesson {
  id: string
  title: string
  type: 'video' | 'reading' | 'quiz' | 'assignment' | 'simulation'
  duration: string
  isCompleted: boolean
  isLocked: boolean
  points: number
}

const CursoJardinsDeCura: React.FC = () => {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [activeModule, setActiveModule] = useState<string | null>(null)
  const [showAssignments, setShowAssignments] = useState(false)

  const courseInfo = {
    title: 'Jardins de Cura - Programa de Formação para Agentes Comunitários de Saúde',
    subtitle: 'Prevenção e Cuidado de Dengue com Arte da Entrevista Clínica e Nôa Esperança',
    instructor: 'Projeto Jardins de Cura',
    duration: '40 horas / 5 semanas',
    students: 0,
    rating: 0,
    level: 'Básico a Intermediário',
    language: 'Português',
    certificate: true,
    alignment: 'Alinhado com as Diretrizes Nacionais para Prevenção e Controle de Dengue'
  }

  const modules: Module[] = [
    {
      id: '1',
      title: 'Módulo 1: Compreensão da Dengue',
      description: 'Reconhecer transmissão e ciclo de vida da dengue',
      duration: '8h',
      lessonCount: 4,
      isCompleted: false,
      progress: 0,
      lessons: [
        {
          id: '1-1',
          title: 'Transmissão da Dengue e Ciclo de Vida',
          type: 'video',
          duration: '60min',
          isCompleted: false,
          isLocked: false,
          points: 50
        },
        {
          id: '1-2',
          title: 'Vetor Aedes Aegypti: Características e Comportamento',
          type: 'video',
          duration: '45min',
          isCompleted: false,
          isLocked: false,
          points: 45
        },
        {
          id: '1-3',
          title: 'Diretrizes Nacionais para Prevenção e Controle',
          type: 'reading',
          duration: '90min',
          isCompleted: false,
          isLocked: false,
          points: 60
        },
        {
          id: '1-4',
          title: 'Quiz: Fundamentos da Dengue',
          type: 'quiz',
          duration: '30min',
          isCompleted: false,
          isLocked: false,
          points: 40
        }
      ]
    },
    {
      id: '2',
      title: 'Módulo 2: Classificação de Risco e Sinais Precoces',
      description: 'Identificar sintomas, sinais de alarme e limiares de ação',
      duration: '10h',
      lessonCount: 5,
      isCompleted: false,
      progress: 0,
      lessons: [
        {
          id: '2-1',
          title: 'Sintomas e Classificação Clínica',
          type: 'video',
          duration: '90min',
          isCompleted: false,
          isLocked: true,
          points: 70
        },
        {
          id: '2-2',
          title: 'Sinais de Alarme na Dengue',
          type: 'video',
          duration: '60min',
          isCompleted: false,
          isLocked: true,
          points: 60
        },
        {
          id: '2-3',
          title: 'Presença e Escuta: Abertura com Empatia e Curiosidade',
          type: 'simulation',
          duration: '120min',
          isCompleted: false,
          isLocked: true,
          points: 80
        },
        {
          id: '2-4',
          title: 'Simulação: Entrevista com Paciente com Dengue',
          type: 'simulation',
          duration: '90min',
          isCompleted: false,
          isLocked: true,
          points: 75
        },
        {
          id: '2-5',
          title: 'Avaliação: Classificação de Risco',
          type: 'quiz',
          duration: '45min',
          isCompleted: false,
          isLocked: true,
          points: 50
        }
      ]
    },
    {
      id: '3',
      title: 'Módulo 3: Vigilância e Estratégia de Visita Domiciliar',
      description: 'Aplicar protocolos de campo e mapeamento de risco',
      duration: '8h',
      lessonCount: 4,
      isCompleted: false,
      progress: 0,
      lessons: [
        {
          id: '3-1',
          title: 'Protocolos de Visita Domiciliar',
          type: 'video',
          duration: '90min',
          isCompleted: false,
          isLocked: true,
          points: 70
        },
        {
          id: '3-2',
          title: 'Mapeamento de Risco Territorial',
          type: 'reading',
          duration: '60min',
          isCompleted: false,
          isLocked: true,
          points: 50
        },
        {
          id: '3-3',
          title: 'Profundidade Narrativa: Técnica "O que mais?"',
          type: 'simulation',
          duration: '120min',
          isCompleted: false,
          isLocked: true,
          points: 80
        },
        {
          id: '3-4',
          title: 'Simulação: Visita Domiciliar Completa',
          type: 'simulation',
          duration: '150min',
          isCompleted: false,
          isLocked: true,
          points: 90
        }
      ]
    },
    {
      id: '4',
      title: 'Módulo 4: Controle Vetorial e Mobilização Territorial',
      description: 'Executar controle ambiental e conscientização comunitária',
      duration: '8h',
      lessonCount: 4,
      isCompleted: false,
      progress: 0,
      lessons: [
        {
          id: '4-1',
          title: 'Controle Ambiental e Eliminação de Criadouros',
          type: 'video',
          duration: '90min',
          isCompleted: false,
          isLocked: true,
          points: 70
        },
        {
          id: '4-2',
          title: 'Estratégias de Mobilização Comunitária',
          type: 'video',
          duration: '75min',
          isCompleted: false,
          isLocked: true,
          points: 65
        },
        {
          id: '4-3',
          title: 'Empoderamento: Resumo e Fechamento Compartilhado',
          type: 'simulation',
          duration: '90min',
          isCompleted: false,
          isLocked: true,
          points: 75
        },
        {
          id: '4-4',
          title: 'Atividade: Plano de Mobilização Comunitária',
          type: 'assignment',
          duration: '120min',
          isCompleted: false,
          isLocked: true,
          points: 85
        }
      ]
    },
    {
      id: '5',
      title: 'Módulo 5: Preparação para Cenários de Crise',
      description: 'Responder adequadamente em situações de surto',
      duration: '6h',
      lessonCount: 3,
      isCompleted: false,
      progress: 0,
      lessons: [
        {
          id: '5-1',
          title: 'Protocolos de Resposta a Surto',
          type: 'video',
          duration: '90min',
          isCompleted: false,
          isLocked: true,
          points: 70
        },
        {
          id: '5-2',
          title: 'Diálogo Profissional: Relatório Estruturado sem Superinterpretação',
          type: 'simulation',
          duration: '120min',
          isCompleted: false,
          isLocked: true,
          points: 80
        },
        {
          id: '5-3',
          title: 'Simulação: Cenário de Crise Completo',
          type: 'simulation',
          duration: '150min',
          isCompleted: false,
          isLocked: true,
          points: 90
        }
      ]
    },
    {
      id: '6',
      title: 'Módulo 6: Literacia em IA e Deep Learning',
      description: 'Aplicação de IA Generativa e Deep Learning na análise de entrevistas médicas',
      duration: '10h',
      lessonCount: 5,
      isCompleted: false,
      progress: 0,
      lessons: [
        {
          id: '6-1',
          title: 'Introdução ao Deep Learning e NLP',
          type: 'video',
          duration: '90min',
          isCompleted: false,
          isLocked: true,
          points: 70
        },
        {
          id: '6-2',
          title: 'Transformers e Modelos de Atenção',
          type: 'video',
          duration: '120min',
          isCompleted: false,
          isLocked: true,
          points: 80
        },
        {
          id: '6-3',
          title: 'Aplicação em Entrevistas Médicas',
          type: 'video',
          duration: '90min',
          isCompleted: false,
          isLocked: true,
          points: 70
        },
        {
          id: '6-4',
          title: 'Análise de Sentimentos e Extração de Informações',
          type: 'reading',
          duration: '60min',
          isCompleted: false,
          isLocked: true,
          points: 50
        },
        {
          id: '6-5',
          title: 'Ética e Governança em IA Generativa',
          type: 'reading',
          duration: '60min',
          isCompleted: false,
          isLocked: true,
          points: 50
        }
      ]
    },
    {
      id: '7',
      title: 'Módulo 7: Fase de Diagnóstico (Nôa Esperança)',
      description: 'Avaliação personalizada com IA para personalizar o caminho de aprendizado',
      duration: '4h',
      lessonCount: 2,
      isCompleted: false,
      progress: 0,
      lessons: [
        {
          id: '7-1',
          title: 'Parte 1: Avaliação de Conhecimento Base em Dengue',
          type: 'quiz',
          duration: '60min',
          isCompleted: false,
          isLocked: true,
          points: 50
        },
        {
          id: '7-2',
          title: 'Parte 2: Avaliação de Estilo de Comunicação e Presença',
          type: 'simulation',
          duration: '120min',
          isCompleted: false,
          isLocked: true,
          points: 80
        }
      ]
    },
    {
      id: '8',
      title: 'Módulo 8: Processo de Aprendizado Interativo',
      description: 'Módulos entregues via chat com simulações baseadas em Nôa Esperança',
      duration: '6h',
      lessonCount: 3,
      isCompleted: false,
      progress: 0,
      lessons: [
        {
          id: '8-1',
          title: 'Role-play: Entrevistas com Pacientes/Cuidadores',
          type: 'simulation',
          duration: '120min',
          isCompleted: false,
          isLocked: true,
          points: 80
        },
        {
          id: '8-2',
          title: 'Simulações de Casos Clínicos',
          type: 'simulation',
          duration: '150min',
          isCompleted: false,
          isLocked: true,
          points: 90
        },
        {
          id: '8-3',
          title: 'Diário Reflexivo com Nôa Esperança',
          type: 'assignment',
          duration: '90min',
          isCompleted: false,
          isLocked: true,
          points: 70
        }
      ]
    },
    {
      id: '9',
      title: 'Módulo 9: Critérios de Certificação',
      description: 'Avaliação final e obtenção do certificado',
      duration: '4h',
      lessonCount: 2,
      isCompleted: false,
      progress: 0,
      lessons: [
        {
          id: '9-1',
          title: 'Avaliação Final: Caso Aplicado e Desafio de Comunicação',
          type: 'quiz',
          duration: '120min',
          isCompleted: false,
          isLocked: true,
          points: 100
        },
        {
          id: '9-2',
          title: 'Resumo Reflexivo Final via Nôa Esperança',
          type: 'assignment',
          duration: '120min',
          isCompleted: false,
          isLocked: true,
          points: 80
        }
      ]
    }
  ]

  const getLessonIcon = (type: string) => {
    switch (type) {
      case 'video':
        return <Video className="w-4 h-4" />
      case 'reading':
        return <BookOpen className="w-4 h-4" />
      case 'quiz':
        return <FileText className="w-4 h-4" />
      case 'assignment':
        return <FileText className="w-4 h-4" />
      case 'simulation':
        return <Brain className="w-4 h-4" />
      default:
        return <BookOpen className="w-4 h-4" />
    }
  }

  const getLessonTypeLabel = (type: string) => {
    switch (type) {
      case 'video':
        return 'Vídeo'
      case 'reading':
        return 'Leitura'
      case 'quiz':
        return 'Quiz'
      case 'assignment':
        return 'Atividade'
      case 'simulation':
        return 'Simulação'
      default:
        return 'Conteúdo'
    }
  }

  const handleLessonClick = (moduleId: string, lessonId: string) => {
    // Navegar para a página de preparação de aula com os parâmetros do curso
    navigate(`/app/lesson-preparation?course=jardins-de-cura&module=${moduleId}&lesson=${lessonId}`)
  }

  const totalLessons = modules.reduce((sum, module) => sum + module.lessonCount, 0)
  const completedLessons = modules.reduce((sum, module) => 
    sum + module.lessons.filter(lesson => lesson.isCompleted).length, 0)
  const totalPoints = modules.reduce((sum, module) => 
    sum + module.lessons.reduce((lessonSum, lesson) => lessonSum + lesson.points, 0), 0)
  const earnedPoints = modules.reduce((sum, module) => 
    sum + module.lessons
      .filter(lesson => lesson.isCompleted)
      .reduce((lessonSum, lesson) => lessonSum + lesson.points, 0), 0)

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Course Header */}
        <div className="bg-gradient-to-r from-green-800 to-emerald-700 rounded-xl p-8 mb-8 border border-green-600/50">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center">
                  <Heart className="w-8 h-8 text-brand-text" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-brand-text mb-2">
                    {courseInfo.title}
                  </h1>
                  <p className="text-green-200 text-lg mb-2">
                    {courseInfo.subtitle}
                  </p>
                  <p className="text-green-300 text-sm">
                    {courseInfo.alignment}
                  </p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
                <div className="bg-green-900/30 rounded-lg p-4 border border-green-500/30">
                  <div className="flex items-center space-x-2 mb-2">
                    <Clock className="w-5 h-5 text-green-300" />
                    <span className="text-green-200 text-sm font-medium">Duração</span>
                  </div>
                  <p className="text-brand-text font-bold">{courseInfo.duration}</p>
                </div>
                <div className="bg-green-900/30 rounded-lg p-4 border border-green-500/30">
                  <div className="flex items-center space-x-2 mb-2">
                    <BookOpen className="w-5 h-5 text-green-300" />
                    <span className="text-green-200 text-sm font-medium">Módulos</span>
                  </div>
                  <p className="text-brand-text font-bold">{modules.length}</p>
                </div>
                <div className="bg-green-900/30 rounded-lg p-4 border border-green-500/30">
                  <div className="flex items-center space-x-2 mb-2">
                    <FileText className="w-5 h-5 text-green-300" />
                    <span className="text-green-200 text-sm font-medium">Aulas</span>
                  </div>
                  <p className="text-brand-text font-bold">{totalLessons}</p>
                </div>
                <div className="bg-green-900/30 rounded-lg p-4 border border-green-500/30">
                  <div className="flex items-center space-x-2 mb-2">
                    <Award className="w-5 h-5 text-green-300" />
                    <span className="text-green-200 text-sm font-medium">Certificado</span>
                  </div>
                  <p className="text-brand-text font-bold">{courseInfo.certificate ? 'Sim' : 'Não'}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Progress Overview */}
        <div className="bg-slate-800/80 rounded-lg p-6 mb-8 border border-brand-border">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-brand-text">Progresso do Curso</h2>
            <span className="text-green-400 font-semibold">
              {Math.round((completedLessons / totalLessons) * 100)}% Concluído
            </span>
          </div>
          <div className="w-full bg-brand-surface-subtle rounded-full h-4 mb-4">
            <div 
              className="bg-gradient-to-r from-green-500 to-emerald-500 h-4 rounded-full transition-all duration-300"
              style={{ width: `${(completedLessons / totalLessons) * 100}%` }}
            />
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-brand-text-muted text-sm">Aulas Concluídas</p>
              <p className="text-brand-text font-bold text-lg">{completedLessons} / {totalLessons}</p>
            </div>
            <div>
              <p className="text-brand-text-muted text-sm">Pontos Ganhos</p>
              <p className="text-brand-text font-bold text-lg">{earnedPoints} / {totalPoints}</p>
            </div>
            <div>
              <p className="text-brand-text-muted text-sm">Nível</p>
              <p className="text-brand-text font-bold text-lg">{courseInfo.level}</p>
            </div>
            <div>
              <p className="text-brand-text-muted text-sm">Idioma</p>
              <p className="text-brand-text font-bold text-lg">{courseInfo.language}</p>
            </div>
          </div>
        </div>

        {/* Modules List */}
        <div className="space-y-6">
          <h2 className="text-2xl font-bold text-brand-text mb-6">Módulos do Curso</h2>
          
          {modules.map((module) => (
            <div 
              key={module.id}
              className="bg-slate-800/80 rounded-lg border border-brand-border overflow-hidden hover:border-green-500/50 transition-colors"
            >
              <div 
                className="p-6 cursor-pointer"
                onClick={() => setActiveModule(activeModule === module.id ? null : module.id)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                        module.isCompleted 
                          ? 'bg-green-500' 
                          : module.progress > 0 
                            ? 'bg-yellow-500' 
                            : 'bg-brand-surface-subtle'
                      }`}>
                        {module.isCompleted ? (
                          <CheckCircle className="w-6 h-6 text-brand-text" />
                        ) : (
                          <span className="text-brand-text font-bold">{module.id}</span>
                        )}
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-brand-text mb-1">{module.title}</h3>
                        <p className="text-brand-text-muted text-sm">{module.description}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-4 mt-4 text-sm text-brand-text-muted">
                      <div className="flex items-center space-x-1">
                        <Clock className="w-4 h-4" />
                        <span>{module.duration}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <BookOpen className="w-4 h-4" />
                        <span>{module.lessonCount} aulas</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Activity className="w-4 h-4" />
                        <span>{module.progress}% concluído</span>
                      </div>
                    </div>

                    {module.progress > 0 && (
                      <div className="w-full bg-brand-surface-subtle rounded-full h-2 mt-3">
                        <div 
                          className="bg-gradient-to-r from-green-500 to-emerald-500 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${module.progress}%` }}
                        />
                      </div>
                    )}
                  </div>
                  
                  <div className="ml-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      module.isCompleted 
                        ? 'bg-green-500/20 text-green-400' 
                        : module.progress > 0 
                          ? 'bg-yellow-500/20 text-yellow-400' 
                          : 'bg-brand-surface-subtle text-brand-text-muted'
                    }`}>
                      {module.isCompleted ? 'Concluído' : module.progress > 0 ? 'Em Andamento' : 'Pendente'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Lessons List */}
              {activeModule === module.id && (
                <div className="border-t border-brand-border bg-slate-900/50 p-6">
                  <h4 className="text-lg font-semibold text-brand-text mb-4">Aulas do Módulo</h4>
                  <div className="space-y-3">
                    {module.lessons.map((lesson) => (
                      <div
                        key={lesson.id}
                        className={`p-4 rounded-lg border transition-colors ${
                          lesson.isLocked
                            ? 'bg-slate-800/50 border-brand-border opacity-60 cursor-not-allowed'
                            : lesson.isCompleted
                              ? 'bg-green-500/10 border-green-500/30 hover:bg-green-500/20 cursor-pointer'
                              : 'bg-slate-700/50 border-slate-600 hover:bg-brand-surface-subtle cursor-pointer'
                        }`}
                        onClick={() => !lesson.isLocked && handleLessonClick(module.id, lesson.id)}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex items-start space-x-3 flex-1">
                            <div className={`mt-1 ${
                              lesson.isCompleted 
                                ? 'text-green-400' 
                                : lesson.isLocked 
                                  ? 'text-slate-500' 
                                  : 'text-primary-400'
                            }`}>
                              {getLessonIcon(lesson.type)}
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center space-x-2 mb-1">
                                <h5 className={`font-semibold ${
                                  lesson.isLocked ? 'text-slate-500' : 'text-brand-text'
                                }`}>
                                  {lesson.title}
                                </h5>
                                {lesson.isCompleted && (
                                  <CheckCircle className="w-4 h-4 text-green-400" />
                                )}
                                {lesson.isLocked && (
                                  <Shield className="w-4 h-4 text-slate-500" />
                                )}
                              </div>
                              <div className="flex items-center space-x-4 text-xs text-brand-text-muted">
                                <span className="flex items-center space-x-1">
                                  {getLessonTypeLabel(lesson.type)}
                                </span>
                                <span className="flex items-center space-x-1">
                                  <Clock className="w-3 h-3" />
                                  <span>{lesson.duration}</span>
                                </span>
                                <span className="flex items-center space-x-1">
                                  <Star className="w-3 h-3" />
                                  <span>{lesson.points} pontos</span>
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Certification Requirements */}
        <div className="bg-gradient-to-r from-emerald-800 to-green-700 rounded-xl p-6 mt-8 border border-emerald-600/50">
          <h2 className="text-2xl font-bold text-brand-text mb-4 flex items-center">
            <Award className="w-6 h-6 mr-2" />
            Critérios de Certificação
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-emerald-900/30 rounded-lg p-4 border border-emerald-500/30">
              <h4 className="text-brand-text font-semibold mb-2">✅ Participação Mínima</h4>
              <p className="text-emerald-200 text-sm">Mínimo de 80% de participação em todas as atividades</p>
            </div>
            <div className="bg-emerald-900/30 rounded-lg p-4 border border-emerald-500/30">
              <h4 className="text-brand-text font-semibold mb-2">✅ Simulações Completas</h4>
              <p className="text-emerald-200 text-sm">Conclusão de pelo menos 3 simulações completas</p>
            </div>
            <div className="bg-emerald-900/30 rounded-lg p-4 border border-emerald-500/30">
              <h4 className="text-brand-text font-semibold mb-2">✅ Resumo Reflexivo</h4>
              <p className="text-emerald-200 text-sm">Um resumo reflexivo submetido via Nôa Esperança</p>
            </div>
            <div className="bg-emerald-900/30 rounded-lg p-4 border border-emerald-500/30">
              <h4 className="text-brand-text font-semibold mb-2">✅ Avaliação Final</h4>
              <p className="text-emerald-200 text-sm">Avaliação final com caso aplicado e desafio de comunicação</p>
            </div>
          </div>
        </div>

        {/* Anexos Recomendados */}
        <div className="bg-slate-800/80 rounded-lg p-6 mt-8 border border-brand-border">
          <h2 className="text-xl font-bold text-brand-text mb-4">📎 Anexos Recomendados</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-slate-700/50 rounded-lg p-4">
              <h4 className="text-brand-text font-semibold mb-2">📖 Glossário de Termos</h4>
              <p className="text-brand-text-muted text-sm">Termos-chave, sinais, classificações clínicas</p>
            </div>
            <div className="bg-slate-700/50 rounded-lg p-4">
              <h4 className="text-brand-text font-semibold mb-2">💬 Estrutura de Perguntas da Arte da Entrevista</h4>
              <p className="text-brand-text-muted text-sm">Modelo de perguntas e técnicas de escuta</p>
            </div>
            <div className="bg-slate-700/50 rounded-lg p-4">
              <h4 className="text-brand-text font-semibold mb-2">🤖 Exemplo de Interação com Nôa</h4>
              <p className="text-brand-text-muted text-sm">Casos práticos de uso da IA na formação</p>
            </div>
            <div className="bg-slate-700/50 rounded-lg p-4">
              <h4 className="text-brand-text font-semibold mb-2">📋 Ficha de Revisão do Supervisor</h4>
              <p className="text-brand-text-muted text-sm">Para programas híbridos com supervisão</p>
            </div>
          </div>
        </div>
      </div>

      {/* Interface Conversacional Nôa Esperança - Conectada ao Curso Jardins de Cura */}
      <NoaConversationalInterface 
        userName={user?.name || 'Estudante'}
        userCode={user?.id || 'STUDENT-001'}
        position="bottom-right"
      />
    </div>
  )
}

export default CursoJardinsDeCura

