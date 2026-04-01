import React, { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import { motion, AnimatePresence } from 'framer-motion'
import {
  X, ChevronRight, ChevronLeft,
  Stethoscope, BookOpen, GraduationCap,
  MessageCircle, Calendar, FileText,
  BarChart3, Users, Brain, Activity, Shield
} from 'lucide-react'
import { normalizeUserType } from '../lib/userTypes'

interface TutorialStep {
  icon: React.ReactNode
  title: string
  description: string
}

const patientSteps: TutorialStep[] = [
  {
    icon: <Activity className="w-8 h-8 text-emerald-400" />,
    title: 'Seu Dashboard de Saúde',
    description: 'Aqui você acompanha sua evolução clínica, exames e indicadores de saúde em tempo real.'
  },
  {
    icon: <Calendar className="w-8 h-8 text-blue-400" />,
    title: 'Agendamentos',
    description: 'Agende consultas com seus profissionais, receba lembretes e acesse teleconsultas diretamente.'
  },
  {
    icon: <MessageCircle className="w-8 h-8 text-purple-400" />,
    title: 'Chat com Profissional',
    description: 'Converse diretamente com seu médico e tire dúvidas de forma segura e privada.'
  },
  {
    icon: <Brain className="w-8 h-8 text-cyan-400" />,
    title: 'Nôa — Sua Assistente IA',
    description: 'Use a Nôa (canto inferior direito) para navegar, tirar dúvidas e acessar funcionalidades por voz ou texto.'
  },
  {
    icon: <FileText className="w-8 h-8 text-amber-400" />,
    title: 'Relatórios e Documentos',
    description: 'Acesse seus relatórios clínicos, receitas e documentos compartilhados pelo profissional.'
  }
]

const professionalSteps: TutorialStep[] = [
  {
    icon: <Stethoscope className="w-8 h-8 text-emerald-400" />,
    title: 'Terminal Clínico',
    description: 'Seu painel principal para gerenciar pacientes, criar relatórios e prescrições com IA integrada.'
  },
  {
    icon: <Users className="w-8 h-8 text-blue-400" />,
    title: 'Gestão de Pacientes',
    description: 'Adicione pacientes, envie convites via QR Code e acompanhe a evolução de cada um.'
  },
  {
    icon: <BarChart3 className="w-8 h-8 text-purple-400" />,
    title: 'KPIs e Relatórios',
    description: 'Acompanhe métricas clínicas, gere relatórios AEC e monitore a evolução dos tratamentos.'
  },
  {
    icon: <Brain className="w-8 h-8 text-cyan-400" />,
    title: 'Nôa — Assistente Clínica IA',
    description: 'A Nôa auxilia na geração de relatórios, análise de dados e navegação por voz ou texto.'
  },
  {
    icon: <BookOpen className="w-8 h-8 text-amber-400" />,
    title: 'Ensino e Pesquisa',
    description: 'Acesse os eixos de Ensino e Pesquisa na sidebar para cursos, fórum de casos e publicações.'
  }
]

const studentSteps: TutorialStep[] = [
  {
    icon: <GraduationCap className="w-8 h-8 text-emerald-400" />,
    title: 'Dashboard do Estudante',
    description: 'Acompanhe seu progresso acadêmico, cursos matriculados e conquistas.'
  },
  {
    icon: <BookOpen className="w-8 h-8 text-blue-400" />,
    title: 'Cursos e Aulas',
    description: 'Acesse videoaulas, materiais didáticos e complete módulos para progredir.'
  },
  {
    icon: <MessageCircle className="w-8 h-8 text-purple-400" />,
    title: 'Fórum de Casos Clínicos',
    description: 'Participe de discussões clínicas, analise casos reais e ganhe pontos de gamificação.'
  },
  {
    icon: <Brain className="w-8 h-8 text-cyan-400" />,
    title: 'Nôa — Assistente de Estudo',
    description: 'A Nôa ajuda a encontrar conteúdos, tirar dúvidas e navegar pela plataforma.'
  },
  {
    icon: <Shield className="w-8 h-8 text-amber-400" />,
    title: 'Biblioteca e Certificados',
    description: 'Acesse a biblioteca de documentos científicos e gerencie seus certificados.'
  }
]

const OnboardingTutorial: React.FC = () => {
  const { user } = useAuth()
  const [currentStep, setCurrentStep] = useState(0)
  const [isVisible, setIsVisible] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    // Show tutorial if user hasn't completed onboarding yet
    if (user && !user.onboarding_completed_at && user.consent_accepted_at) {
      setIsVisible(true)
    }
  }, [user])

  // Listen for replay trigger from header
  useEffect(() => {
    const handleReplay = () => {
      setCurrentStep(0)
      setIsVisible(true)
    }
    window.addEventListener('replayOnboardingTutorial', handleReplay)
    return () => window.removeEventListener('replayOnboardingTutorial', handleReplay)
  }, [])

  if (!isVisible || !user) return null

  const userType = normalizeUserType(user.type)
  const steps = userType === 'paciente' ? patientSteps
    : userType === 'aluno' ? studentSteps
    : professionalSteps // profissional + admin

  const step = steps[currentStep]
  const isLast = currentStep === steps.length - 1

  const handleComplete = async () => {
    setIsSaving(true)
    try {
      // Only save to DB if it's the first time (not replay)
      if (!user.onboarding_completed_at) {
        await supabase
          .from('users')
          .update({ onboarding_completed_at: new Date().toISOString() } as any)
          .eq('id', user.id)
      }
      setIsVisible(false)
      // Reload only on first onboarding
      if (!user.onboarding_completed_at) {
        window.location.reload()
      }
    } catch (err) {
      console.error('Erro ao salvar onboarding:', err)
      setIsVisible(false)
    } finally {
      setIsSaving(false)
    }
  }

  const handleSkip = async () => {
    await handleComplete()
  }

  return (
    <div className="fixed inset-0 z-[9998] bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4">
      <motion.div
        key={currentStep}
        initial={{ opacity: 0, x: 30 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -30 }}
        transition={{ duration: 0.3 }}
        className="bg-slate-800 border border-slate-700 rounded-2xl max-w-md w-full p-8 shadow-2xl relative"
      >
        {/* Skip button */}
        <button
          onClick={handleSkip}
          className="absolute top-4 right-4 text-slate-500 hover:text-slate-300 transition-colors"
          title="Pular tutorial"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Progress bar */}
        <div className="flex gap-1.5 mb-8">
          {steps.map((_, i) => (
            <div
              key={i}
              className={`h-1 flex-1 rounded-full transition-colors ${
                i <= currentStep ? 'bg-emerald-500' : 'bg-slate-600'
              }`}
            />
          ))}
        </div>

        {/* Content */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-slate-700/50 rounded-2xl flex items-center justify-center mx-auto mb-6">
            {step.icon}
          </div>
          <h2 className="text-xl font-bold text-white mb-3">{step.title}</h2>
          <p className="text-slate-400 text-sm leading-relaxed">{step.description}</p>
        </div>

        {/* Step counter */}
        <p className="text-xs text-slate-500 text-center mb-6">
          {currentStep + 1} de {steps.length}
        </p>

        {/* Navigation */}
        <div className="flex gap-3">
          {currentStep > 0 && (
            <button
              onClick={() => setCurrentStep(prev => prev - 1)}
              className="flex-1 bg-slate-700 hover:bg-slate-600 text-white px-4 py-3 rounded-xl font-semibold transition-colors flex items-center justify-center gap-2"
            >
              <ChevronLeft className="w-4 h-4" />
              Anterior
            </button>
          )}

          {isLast ? (
            <button
              onClick={handleComplete}
              disabled={isSaving}
              className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-3 rounded-xl font-semibold transition-colors flex items-center justify-center gap-2"
            >
              {isSaving ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
              ) : (
                '🚀 Começar!'
              )}
            </button>
          ) : (
            <button
              onClick={() => setCurrentStep(prev => prev + 1)}
              className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-3 rounded-xl font-semibold transition-colors flex items-center justify-center gap-2"
            >
              Próximo
              <ChevronRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </motion.div>
    </div>
  )
}

export default OnboardingTutorial
