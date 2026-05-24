import React, { useState, useEffect, Suspense, lazy } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import {
  Calendar,
  MessageCircle,
  FileText,
  Shield,
  Clock,
  Activity,
  Target,
  BarChart3,
  Brain,
  Zap,
  Loader2,
  Menu,
  X,
  Pill,
  Stethoscope,
  ChevronRight
} from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { useUserView } from '../contexts/UserViewContext'
import { useNoaPlatform } from '../contexts/NoaPlatformContext'
import { useDashboardTriggers } from '../contexts/DashboardTriggersContext'
import { usePatientDashboard, PatientTab } from '../hooks/dashboard/usePatientDashboard'

import ShareReportModal from '../components/ShareReportModal'
import NoaConversationalInterface from '../components/NoaConversationalInterface'
import PendingRatingsBanner from '../components/PendingRatingsBanner'
// V1.9.442 — Seletor de modo (AEC estruturada vs chat livre) antes de iniciar avaliação
import { ChatModeSelector, hasUserDismissedChatModeSelector } from '../components/ChatModeSelector'
// V1.9.275 — Consent paciente pra direcionamento entre médicos (LGPD art. 11 §1)
import PatientReferralConsentBanner from '../components/patient/PatientReferralConsentBanner'
// Lazy load — Tier A perf optimization (V1.9.x). Componentes pesados só carregam quando aba ativa.
const PatientAnalytics = lazy(() => import('../components/PatientAnalytics'))
const PatientNFTGallery = lazy(() => import('../components/PatientNFTGallery'))
const ClinicalReports = lazy(() => import('../components/ClinicalReports'))
// V1.9.313 — Meus Exames (paciente sobe laudos/ressonância/EEG antigos)
const PatientMyExams = lazy(() => import('../components/PatientMyExams'))

import PatientHeaderActions from '../components/PatientHeaderActions'
import PatientPrescriptions from '../components/PatientPrescriptions'

import { PatientStats } from '../components/dashboard/patient/PatientStats'
import { PatientAppointments } from '../components/dashboard/patient/PatientAppointments'
import { PatientQuickActions } from '../components/dashboard/patient/PatientQuickActions'
import { PatientSupport } from '../components/dashboard/patient/PatientSupport'
import { DashboardSectionSkeleton } from '../components/ui/DashboardSectionSkeleton'
import { FeatureErrorFallback } from '../components/ui/FeatureErrorFallback'
import ErrorBoundary from '../components/ErrorBoundary'

const PatientDashboard: React.FC = () => {
  const { user } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const { getEffectiveUserType, isAdminViewingAs } = useUserView()
  const { openChat: openNoaChat, closeChat, isOpen: isNoaOpen, hideGlobalChat, showGlobalChat, sendInitialMessage } = useNoaPlatform()
  const { setDashboardTriggers } = useDashboardTriggers()

  const {
    reports,
    loading,
    appointments,
    therapeuticPlan,
    activeTab,
    setActiveTab,
    patientPrescriptions,
    clinicalDevolutions,
    refresh
  } = usePatientDashboard()

  // Sincronizar activeTab com o parâmetro 'section' da URL (para o sidebar unificado funcionar)
  useEffect(() => {
    const params = new URLSearchParams(location.search)
    const section = params.get('section')

    if (section) {
      if (section === 'relatorio') {
        setActiveTab('report-detail')
      } else {
        if (section === 'conteudo') {
          navigate('/app/library')
          return
        }
        if (section === 'perfil') {
          navigate('/app/profile')
          return
        }
        if (section === 'chat-noa') {
          openNoaChat()
          return
        }
        const validTabs: PatientTab[] = ['analytics', 'meus-agendamentos', 'plano', 'reportar-problema', 'minhas-prescricoes', 'galeria', 'meus-exames']
        if (validTabs.includes(section as PatientTab)) {
          setActiveTab(section as PatientTab)
        }
      }
    }
  }, [location.search, setActiveTab])

  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)
  const [shareModalOpen, setShareModalOpen] = useState(false)
  const [shareModalReportId, setShareModalReportId] = useState<string | null>(null)
  const [shouldStartAssessment, setShouldStartAssessment] = useState(false)
  // V1.9.442 — Card de seleção de modo (AEC vs chat livre) antes de iniciar avaliação
  const [showChatModeSelector, setShowChatModeSelector] = useState(false)

  // Sync Global Chat Visibility
  useEffect(() => {
    hideGlobalChat()
    return () => showGlobalChat()
  }, [hideGlobalChat, showGlobalChat])

  // Setup Triggers for the dynamic UI
  useEffect(() => {
    const tabs: Array<{ id: PatientTab; label: string; icon: any }> = [
      { id: 'analytics', label: 'Dashboard', icon: BarChart3 },
      { id: 'meus-agendamentos', label: 'Agenda', icon: Calendar },
      { id: 'minhas-prescricoes', label: 'Prescrições', icon: Pill },
      { id: 'chat-noa', label: 'Chat Nôa Esperanza', icon: Brain },
      { id: 'perfil', label: 'Meu Perfil', icon: Zap }
    ]

    setDashboardTriggers({
      options: tabs,
      activeId: activeTab,
      onChange: (id) => {
        if (id === 'perfil') {
          navigate('/app/profile')
        } else if (id === 'chat-noa') {
          openNoaChat()
        } else {
          setActiveTab(id as PatientTab)
        }
      },
      onBrainClick: () => isNoaOpen ? closeChat() : openNoaChat()
    })
    return () => setDashboardTriggers(null)
  }, [activeTab, isNoaOpen, setActiveTab, setDashboardTriggers, openNoaChat, closeChat])

  // V1.9.442 — Intercepta "Iniciar Avaliação" pra mostrar seletor de modo
  // (AEC estruturada vs Chat Livre). Calibra expectativa do paciente antes
  // de cair na coleta determinística. Se usuário já viu antes (localStorage)
  // pula direto pra AEC — respeitando autonomia do usuário experiente.
  // Memórias: feedback_aec_como_repelente_natural / feedback_chat_livre
  // _dominante_vs_aec_minoria_24_05 (ambas cristalizadas 24/05).
  const handleStartAssessment = () => {
    if (hasUserDismissedChatModeSelector()) {
      // Usuário já entendeu a diferença antes → vai direto pra AEC
      sendInitialMessage('iniciar avaliação clínica inicial')
    } else {
      setShowChatModeSelector(true)
    }
  }

  // V1.9.442 — Callbacks do seletor
  const handleChooseAEC = () => {
    setShowChatModeSelector(false)
    sendInitialMessage('iniciar avaliação clínica inicial')
  }

  const handleChooseFreeChat = () => {
    setShowChatModeSelector(false)
    openNoaChat() // Abre chat livre SEM enviar mensagem "iniciar avaliação"
  }

  const handleOpenChat = () => {
    navigate('/app/clinica/paciente/chat-profissional?origin=patient-dashboard')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0f172a] flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-primary-500 animate-spin mx-auto mb-4" />
          <p className="text-slate-400 font-medium">Carregando seu portal clínico...</p>
        </div>
      </div>
    )
  }

  return (
    // V1.9.237: densificacao laptop (md:p-8 -> md:p-6 + space-y-8 -> space-y-6) — mobile (<768) intacto
    <div className="p-4 md:p-6 max-w-7xl mx-auto w-full space-y-6">
      {activeTab === 'analytics' && (
        <>
          {/* V1.9.275: banner consent direcionamento (LGPD art. 11 §1) — aparece só
              se há patient_referrals.status='pending_patient_consent'. Princípio: paciente
              decide compartilhamento de vínculo clínico — não é automatizado. */}
          <PatientReferralConsentBanner />
          {/* V1.9.145: banner pending ratings (aparece só se há consulta concluída sem avaliação) */}
          <PendingRatingsBanner />

          <div className="space-y-1">
            {/* V1.9.237: hero -1 tamanho de fonte em cada breakpoint (laptop cabe mais conteudo na fold) */}
            <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">Olá, {user?.name?.split(' ')[0]}</h1>
            <p className="text-slate-400 text-base">Aqui está o resumo da sua jornada de cuidado.</p>
          </div>

          {/* [V1.9.126] Ações principais movidas para o topo (acessibilidade 50+) */}
          {/* V1.9.253 — onOpenReports redireciona "Enviar Medico" pra aba Relatorios
              (reusa ShareReportModal completo em vez de modal proprio reduzido). */}
          <PatientHeaderActions
            reports={reports}
            onScheduleClick={() => navigate('/app/clinica/paciente/agendamentos')}
            onStartAssessment={handleStartAssessment}
            onOpenReports={() => setActiveTab('report-detail')}
          />

          {/* V1.9.x — Linha de continuidade FUNDIDA no header do PatientAnalytics
              (movida de standalone pra dentro do card "Pedro Paciente · email · Paciente MedCannLab"
               conforme pedido do Pedro 08/05). Card standalone removido daqui. */}

          <PatientStats
            appointments={appointments}
            patientPrescriptions={patientPrescriptions}
            reports={reports}
            therapeuticPlan={therapeuticPlan}
          />

          <div className="space-y-8">
            <ErrorBoundary fallback={<FeatureErrorFallback name="Análises" />}>
              <Suspense fallback={<DashboardSectionSkeleton variant="analytics" />}>
                <PatientAnalytics
                  reports={reports}
                  user={user}
                  appointments={appointments}
                  patientPrescriptions={patientPrescriptions}
                  onScheduleClick={() => navigate('/app/clinica/paciente/agendamentos')}
                  onStartAssessment={handleStartAssessment}
                />
              </Suspense>
            </ErrorBoundary>

            {/* V1.9.x: PatientQuickActions redesenhado — antes "Chat com Médico" e
                "Nova Consulta" eram redundantes com PatientHeaderActions (Pedro 08/05).
                Agora: Solicitar Receita + Compartilhar Relatório (não-redundantes) +
                Plano Terapêutico + Biblioteca preservados. */}
            <PatientQuickActions
              therapeuticPlan={therapeuticPlan}
              patientPrescriptions={patientPrescriptions}
              onSchedule={() => setActiveTab('meus-agendamentos')}
              onChat={handleOpenChat}
              onViewPlan={() => setActiveTab('plano')}
              onViewEducational={() => navigate('/app/library')}
              onShareReport={() => setActiveTab('report-detail')}
              onRequestPrescription={() => {
                sendInitialMessage('Gostaria de solicitar uma nova receita ao meu médico. Pode me ajudar?')
                openNoaChat()
              }}
            />
          </div>
        </>
      )}

      {activeTab === 'report-detail' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-white flex items-center gap-2">
              <Shield className="w-6 h-6 text-emerald-400" />
              Relatórios Clínicos
            </h2>
            <button onClick={() => setActiveTab('analytics')} className="px-4 py-2 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-all text-sm">Voltar</button>
          </div>
          <div className="bg-slate-900/40 rounded-3xl border border-white/5 p-6 md:p-8">
            <ErrorBoundary fallback={<FeatureErrorFallback name="Relatórios Clínicos" />}>
              <Suspense fallback={<DashboardSectionSkeleton variant="reports" />}>
                <ClinicalReports
                  className="w-full"
                  onShareReport={(reportId) => {
                    setShareModalReportId(reportId)
                    setShareModalOpen(true)
                  }}
                />
              </Suspense>
            </ErrorBoundary>
          </div>
        </div>
      )}

      {activeTab === 'meus-agendamentos' && (
        <PatientAppointments
          appointments={appointments}
          onRefresh={refresh}
          onStartAssessment={handleStartAssessment}
          onScheduleNew={() => navigate('/app/clinica/paciente/agendamento')}
        />
      )}

      {activeTab === 'reportar-problema' && <PatientSupport />}

      {activeTab === 'minhas-prescricoes' && (
        <PatientPrescriptions
          onBack={() => setActiveTab('analytics')}
          onRequestNew={() => {
            sendInitialMessage('Gostaria de solicitar uma nova receita ao meu médico. Pode me ajudar?')
            openNoaChat()
          }}
        />
      )}

      {/* V1.9.313 — Meus Exames (paciente sobe laudos/ressonância/EEG antigos). */}
      {activeTab === 'meus-exames' && (
        <ErrorBoundary fallback={<FeatureErrorFallback name="Meus Exames" />}>
          <Suspense fallback={<DashboardSectionSkeleton variant="gallery" />}>
            <PatientMyExams onBack={() => setActiveTab('analytics')} />
          </Suspense>
        </ErrorBoundary>
      )}

      {/* V1.9.193 — Galeria de Assinaturas Visuais (NFT lógico clínico) */}
      {activeTab === 'galeria' && (
        <ErrorBoundary fallback={<FeatureErrorFallback name="Galeria" />}>
          <Suspense fallback={<DashboardSectionSkeleton variant="gallery" />}>
            <PatientNFTGallery
              onCreateAssessment={handleStartAssessment}
            />
          </Suspense>
        </ErrorBoundary>
      )}



      {/* Acompanhamento do Plano Terapêutico */}
      {activeTab === 'plano' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-white flex items-center gap-2">
              <Target className="w-6 h-6 text-emerald-400" />
              Acompanhamento do Plano
            </h2>
            <button onClick={() => setActiveTab('analytics')} className="px-4 py-2 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-all text-sm">Voltar</button>
          </div>

          {/* Sprint 1 — Devoluções do médico (médico → paciente) */}
          {clinicalDevolutions && clinicalDevolutions.length > 0 && (
            <div className="space-y-3 animate-in fade-in slide-in-from-top-2 duration-500">
              <h3 className="text-sm font-semibold text-emerald-300 flex items-center gap-2 uppercase tracking-wide">
                <Stethoscope className="w-4 h-4" />
                Devolução do seu médico
                <span className="ml-2 text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 normal-case tracking-normal">
                  {clinicalDevolutions.length} {clinicalDevolutions.length === 1 ? 'nova' : 'novas'}
                </span>
              </h3>
              {clinicalDevolutions.slice(0, 3).map((dev) => {
                const reviewedDate = dev.reviewedAt ? new Date(dev.reviewedAt) : null
                const dateLabel = reviewedDate
                  ? reviewedDate.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })
                  : '—'
                const reviewerLabel = dev.reviewerName ? `Dr. ${dev.reviewerName}` : 'Seu médico'
                return (
                  <button
                    key={dev.reportId}
                    onClick={() => navigate(`/app/clinica/paciente/dashboard?section=relatorio&report=${encodeURIComponent(dev.reportId)}`)}
                    className="w-full text-left rounded-2xl p-5 transition-all hover:scale-[1.005] active:scale-[0.995] border"
                    style={{
                      background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.08) 0%, rgba(6, 182, 212, 0.05) 100%)',
                      borderColor: 'rgba(16, 185, 129, 0.25)'
                    }}
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-full bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center flex-shrink-0">
                        <Stethoscope className="w-5 h-5 text-emerald-300" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2 mb-1">
                          <span className="text-sm font-semibold text-white">{reviewerLabel}</span>
                          <span className="text-[11px] text-slate-400 flex-shrink-0">{dateLabel}</span>
                        </div>
                        <p className="text-sm text-slate-200/90 leading-relaxed line-clamp-3">
                          {dev.doctorNotes}
                        </p>
                        <div className="mt-2 flex items-center gap-1.5 text-xs text-emerald-300/80">
                          <span>Ver relatório completo</span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </div>
                      </div>
                    </div>
                  </button>
                )
              })}
            </div>
          )}

          {therapeuticPlan ? (
            <div className="space-y-6">
              {/* Plan Overview */}
              <div className="bg-slate-900/40 rounded-2xl border border-white/5 p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                    <Activity className="w-5 h-5 text-emerald-400" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-white">{therapeuticPlan.title}</h3>
                    <p className="text-xs text-slate-400">Próxima revisão: {therapeuticPlan.nextReview}</p>
                  </div>
                </div>

                {/* Progress */}
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-slate-400 font-medium">Progresso do plano</span>
                    <span className="text-sm font-bold text-emerald-400">{therapeuticPlan.progress}%</span>
                  </div>
                  <div className="w-full h-3 bg-slate-700/50 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{
                        width: `${therapeuticPlan.progress}%`,
                        background: 'linear-gradient(90deg, #10b981, #06b6d4)'
                      }}
                    />
                  </div>
                </div>

                {/* Medications */}
                <div>
                  <h4 className="text-sm font-semibold text-slate-300 mb-3 flex items-center gap-2">
                    <Shield className="w-4 h-4 text-emerald-400" />
                    Medicações / Protocolo
                  </h4>
                  <div className="space-y-2">
                    {therapeuticPlan.medications.map((med, idx) => (
                      <div key={idx} className="flex items-center gap-3 p-3 rounded-lg bg-slate-800/40 border border-slate-700/30">
                        <span className="w-6 h-6 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-400 text-xs font-bold flex-shrink-0 border border-emerald-500/20">{idx + 1}</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-slate-200 font-semibold">{med.name}</p>
                          <p className="text-xs text-slate-400">{med.dosage} • {med.frequency}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Quick actions */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <button onClick={openNoaChat} className="p-4 rounded-xl bg-slate-800/30 border border-slate-700/50 hover:border-emerald-500/30 transition-all text-left group">
                  <Brain className="w-6 h-6 text-emerald-400 mb-2" />
                  <p className="text-sm font-semibold text-white">Falar com Nôa</p>
                  <p className="text-xs text-slate-400">Tirar dúvidas sobre seu plano</p>
                </button>
                <button onClick={() => navigate('/app/clinica/paciente/agendamentos')} className="p-4 rounded-xl bg-slate-800/30 border border-slate-700/50 hover:border-blue-500/30 transition-all text-left group">
                  <Calendar className="w-6 h-6 text-blue-400 mb-2" />
                  <p className="text-sm font-semibold text-white">Agendar Consulta</p>
                  <p className="text-xs text-slate-400">Marcar reavaliação</p>
                </button>
                <button onClick={() => navigate('/app/clinica/paciente/chat-profissional')} className="p-4 rounded-xl bg-slate-800/30 border border-slate-700/50 hover:border-purple-500/30 transition-all text-left group">
                  <MessageCircle className="w-6 h-6 text-purple-400 mb-2" />
                  <p className="text-sm font-semibold text-white">Falar com Médico</p>
                  <p className="text-xs text-slate-400">Discutir ajustes no plano</p>
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-slate-900/40 rounded-2xl border border-white/5 p-8 text-center">
              <div className="w-16 h-16 bg-emerald-500/10 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-emerald-500/15">
                <Target className="w-8 h-8 text-emerald-400 opacity-50" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">Plano em construção</h3>
              <p className="text-sm text-slate-400 max-w-md mx-auto mb-6">Seu plano terapêutico será gerado automaticamente após sua primeira avaliação com a Nôa.</p>
              <button onClick={handleStartAssessment} className="px-6 py-2.5 bg-gradient-to-r from-emerald-500 to-cyan-600 text-white rounded-xl font-semibold shadow-lg shadow-emerald-500/20 hover:scale-105 transition-all">
                Iniciar Avaliação
              </button>
            </div>
          )}
        </div>
      )}


      {/* V1.9.442 — Seletor de modo (AEC vs chat livre) — Portal escapa stacking context */}
      <ChatModeSelector
        open={showChatModeSelector}
        onClose={() => setShowChatModeSelector(false)}
        onChooseAEC={handleChooseAEC}
        onChooseFreeChat={handleChooseFreeChat}
      />

      <ShareReportModal
        isOpen={shareModalOpen}
        onClose={() => setShareModalOpen(false)}
        patientId={user?.id || ''}
        reportId={shareModalReportId || reports[0]?.id || ''}
        reportName="Relatório Clínico MedCannLab"
      />
    </div>
  )
}


export default PatientDashboard
