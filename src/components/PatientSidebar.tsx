import React from 'react'
import {
  Calendar,
  MessageCircle,
  Heart,
  BookOpen,
  Shield,
  ArrowRight,
  Loader2,
  Stethoscope,
  Brain,
  Zap,
  Target,
  GraduationCap,
  FileText,
  User,
  AlertCircle
} from 'lucide-react'

interface PatientSidebarProps {
  user?: { name?: string | null; id?: string | null }
  activeCard: string | null
  onCardClick: (cardId: string) => void
  chatLoading?: boolean
  therapeuticPlan?: { progress: number } | null
  patientPrescriptionsLoading?: boolean
  totalPrescriptions?: number
  activePrescriptions?: Array<{ id: string; title: string; rationality?: string | null }>
  latestClinicalReport?: { status: string; generated_at?: string } | null
  onScheduleAppointment: () => void
  onOpenChat: () => void
  onOpenPlan: () => void
  onViewEducational: () => void
  onViewAppointments?: () => void
  onShareReport?: () => void
  onStartAssessment?: () => void
  onViewProfile?: () => void
  onReportProblem?: () => void
}

const PatientSidebar: React.FC<PatientSidebarProps> = ({
  user,
  activeCard,
  onCardClick,
  chatLoading = false,
  therapeuticPlan,
  patientPrescriptionsLoading = false,
  totalPrescriptions = 0,
  activePrescriptions = [],
  latestClinicalReport,
  onScheduleAppointment,
  onOpenChat,
  onOpenPlan,
  onViewEducational,
  onViewAppointments,
  onShareReport,
  onStartAssessment,
  onViewProfile,
  onReportProblem
}) => {
  const getReportStatusLabel = (status: string) => {
    switch (status) {
      case 'draft':
        return 'Rascunho'
      case 'completed':
        return 'Concluído'
      case 'reviewed':
        return 'Revisado'
      default:
        return 'Em andamento'
    }
  }

  const cards = [
    {
      id: 'meu-perfil',
      title: 'Meu Perfil',
      subtitle: '👤 Visualize seus detalhes',
      description: 'Visualize seus detalhes, estatísticas e analytics de uso da plataforma',
      icon: User,
      onClick: () => {
        onCardClick('meu-perfil')
        if (onViewProfile) {
          onViewProfile()
        }
      },
      accent: 'primary'
    },
    {
      id: 'agendar-consulta',
      title: 'Agendamento',
      subtitle: '📅 Agendar Consulta',
      description: 'Agende sua consulta com profissionais especializados',
      icon: Calendar,
      onClick: () => {
        onCardClick('agendar-consulta')
        onScheduleAppointment()
      },
      accent: 'primary'
    },
    {
      id: 'meus-agendamentos',
      title: 'Agendamentos',
      subtitle: '📋 Meus Agendamentos',
      description: 'Gerencie suas consultas e visualize seu calendário integrado ao seu plano de cuidado',
      icon: Calendar,
      onClick: () => {
        onCardClick('meus-agendamentos')
        if (onViewAppointments) {
          onViewAppointments()
        }
      },
      accent: 'primary'
    },
    {
      id: 'chat-medico',
      title: 'Chat',
      subtitle: chatLoading ? '🔄 Abrindo chat...' : '💬 Chat com Médico',
      description: 'Comunicação direta com seu profissional',
      icon: MessageCircle,
      onClick: () => {
        onCardClick('chat-medico')
        onOpenChat()
      },
      disabled: chatLoading,
      accent: 'primary'
    },
    {
      id: 'plano-terapeutico',
      title: 'Plano terapêutico',
      subtitle: 'Acompanhamento do plano',
      description: patientPrescriptionsLoading
        ? 'Carregando suas prescrições integrativas...'
        : totalPrescriptions > 0
        ? `Você possui ${activePrescriptions.length} prescrição(ões) ativa(s) entre ${totalPrescriptions} registrada(s).`
        : 'Nenhuma prescrição ativa no momento. Complete a avaliação clínica para receber um plano terapêutico personalizado.',
      icon: Heart,
      onClick: () => {
        onCardClick('plano-terapeutico')
        onOpenPlan()
      },
      progress: therapeuticPlan?.progress,
      accent: 'primary'
    },
    {
      id: 'conteudo-educacional',
      title: 'Conteúdo educativo',
      subtitle: 'Biblioteca personalizada',
      description: 'Acesse vídeos, guias e artigos selecionados pela equipe clínica para apoiar seu tratamento integrado.',
      icon: BookOpen,
      onClick: () => {
        onCardClick('conteudo-educacional')
        onViewEducational()
      },
      accent: 'sky',
      badges: [
        { icon: GraduationCap, label: 'Trilhas guiadas' },
        { icon: FileText, label: 'Protocolos clínicos' }
      ]
    },
    {
      id: 'relatorio-clinico',
      title: 'Relatório clínico',
      subtitle: latestClinicalReport ? 'Compartilhe com sua equipe' : 'Gerar relatório inicial',
      description: latestClinicalReport
        ? 'A IA residente gera seu relatório clínico com base na avaliação inicial. Compartilhe com o profissional quando estiver pronto.'
        : 'Comece sua jornada com a avaliação clínica inicial aplicada pela IA residente e gere o relatório base do eixo clínica.',
      icon: Shield,
      onClick: () => {
        onCardClick('relatorio-clinico')
        if (latestClinicalReport && onShareReport) {
          onShareReport()
        } else if (onStartAssessment) {
          onStartAssessment()
        }
      },
      accent: 'purple',
      status: latestClinicalReport ? getReportStatusLabel(latestClinicalReport.status) : null,
      date: latestClinicalReport?.generated_at
    },
    {
      id: 'reportar-problema',
      title: 'Suporte',
      subtitle: '🚨 Reportar Problema',
      description: 'Envie mensagens curtas para a equipe de suporte e administradores',
      icon: AlertCircle,
      onClick: () => {
        onCardClick('reportar-problema')
        if (onReportProblem) {
          onReportProblem()
        }
      },
      accent: 'purple'
    }
  ]

  return (
    <div className="w-full bg-slate-900/95 flex flex-col h-full overflow-y-auto">
      {/* Header */}
      <div className="p-4 border-b border-slate-800">
        <div className="flex items-center space-x-3 mb-2">
          <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
            <span className="text-white font-bold text-sm">
              {user?.name ? user.name.split(' ').map(n => n[0]).join('').slice(0, 2) : 'P'}
            </span>
          </div>
          <div>
            <p className="font-semibold text-white text-sm">{user?.name || 'Paciente'}</p>
            <p className="text-xs text-slate-400">Paciente</p>
          </div>
        </div>
        <p className="text-xs text-slate-400 mt-2">
          Seu centro de acompanhamento personalizado
        </p>
      </div>

      {/* Cards */}
      <div className="flex-1 p-4 space-y-3">
        {cards.map((card) => {
          const Icon = card.icon
          const isActive = activeCard === card.id

          // Cards com estilo padrão
          const accentColors = {
            primary: {
              bg: 'bg-primary-500/15',
              border: 'border-primary-500/30',
              text: 'text-primary-300',
              textSub: 'text-primary-200'
            },
            sky: {
              bg: 'bg-sky-500/15',
              border: 'border-sky-500/30',
              text: 'text-sky-300',
              textSub: 'text-sky-200'
            },
            purple: {
              bg: 'bg-purple-500/15',
              border: 'border-purple-500/30',
              text: 'text-purple-300',
              textSub: 'text-purple-200'
            }
          }

          const accent = accentColors[card.accent as keyof typeof accentColors] || accentColors.primary

          return (
            <button
              key={card.id}
              onClick={card.onClick}
              disabled={card.disabled}
              className={`w-full rounded-2xl border bg-slate-950/60 p-4 text-left transition-all ${
                isActive
                  ? `${accent.border} ring-2 ring-offset-2 ring-offset-slate-900`
                  : 'border-slate-800 hover:border-slate-700'
              } hover:-translate-y-0.5 ${card.disabled ? 'opacity-80 cursor-not-allowed' : ''}`}
            >
              <div className="flex items-start gap-3">
                <div className={`w-11 h-11 rounded-xl ${accent.bg} border ${accent.border} flex items-center justify-center flex-shrink-0`}>
                  <Icon className={`w-5 h-5 ${accent.text}`} />
                </div>
                <div className="flex-1 min-w-0 space-y-2">
                  {card.subtitle && (
                    <div>
                      <p className={`text-[10px] uppercase tracking-[0.35em] ${accent.text} mb-1`}>
                        {card.title}
                      </p>
                      <div className="flex items-center justify-between gap-2">
                        <h3 className="text-base font-semibold text-white leading-tight">
                          {card.subtitle}
                        </h3>
                        {card.progress !== undefined && (
                          <span className={`inline-flex items-center justify-center min-w-[3rem] px-2 py-1 rounded-lg ${accent.bg} border ${accent.border} text-xs font-semibold ${accent.textSub} flex-shrink-0`}>
                            {card.progress}%
                          </span>
                        )}
                        {card.status && (
                          <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg ${accent.bg} border ${accent.border} text-[11px] font-semibold ${accent.textSub} flex-shrink-0`}>
                            {card.status}
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                  {!card.subtitle && (
                    <h3 className={`text-base font-semibold ${accent.text}`}>
                      {card.title}
                    </h3>
                  )}
                  <p className="text-xs text-slate-300 leading-relaxed">
                    {card.description}
                  </p>
                  {card.badges && (
                    <div className="flex flex-wrap gap-2 pt-1">
                      {card.badges.map((badge, idx) => {
                        const BadgeIcon = badge.icon
                        return (
                          <span
                            key={idx}
                            className="inline-flex items-center gap-1 px-2 py-1 rounded-full border border-slate-700 bg-slate-900/70 text-[10px] text-slate-300"
                          >
                            <BadgeIcon className="w-3 h-3" />
                            {badge.label}
                          </span>
                        )
                      })}
                    </div>
                  )}
                  {patientPrescriptionsLoading && card.id === 'plano-terapeutico' && (
                    <div className="flex items-center gap-2 pt-1 text-xs text-slate-400">
                      <Loader2 className="w-3 h-3 animate-spin" />
                      Atualizando prescrições...
                    </div>
                  )}
                  {card.date && (
                    <p className="text-[10px] text-slate-500 mt-1">
                      Gerado em {new Date(card.date).toLocaleDateString('pt-BR')}
                    </p>
                  )}
                </div>
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}

export default PatientSidebar

