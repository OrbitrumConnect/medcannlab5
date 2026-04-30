import React, { useState, useEffect } from 'react'
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
  X
} from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { useUserView } from '../contexts/UserViewContext'
import { useNoaPlatform } from '../contexts/NoaPlatformContext'
import { useDashboardTriggers } from '../contexts/DashboardTriggersContext'
import { usePatientDashboard, PatientTab } from '../hooks/dashboard/usePatientDashboard'

import ShareReportModal from '../components/ShareReportModal'
import NoaConversationalInterface from '../components/NoaConversationalInterface'
import PatientAnalytics from '../components/PatientAnalytics'

import { PatientStats } from '../components/dashboard/patient/PatientStats'
import { PatientAppointments } from '../components/dashboard/patient/PatientAppointments'
import { PatientQuickActions } from '../components/dashboard/patient/PatientQuickActions'
import { PatientSupport } from '../components/dashboard/patient/PatientSupport'
import ClinicalReports from '../components/ClinicalReports'

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
        const validTabs: PatientTab[] = ['analytics', 'meus-agendamentos', 'plano', 'reportar-problema']
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
      { id: 'chat-noa', label: 'Chat NOA', icon: Brain },
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

  const handleStartAssessment = () => {
    sendInitialMessage('iniciar avaliação clínica inicial')
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
    <div className="p-4 md:p-8 max-w-7xl mx-auto w-full space-y-8">
      {activeTab === 'analytics' && (
        <>
          <div className="space-y-2">
            <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">Olá, {user?.name?.split(' ')[0]}</h1>
            <p className="text-slate-400 text-lg">Aqui está o resumo da sua jornada de cuidado.</p>
          </div>

          <PatientStats
            appointments={appointments}
            patientPrescriptions={patientPrescriptions}
            reports={reports}
            therapeuticPlan={therapeuticPlan}
          />

          <div className="space-y-8">
            <PatientAnalytics
              reports={reports}
              user={user}
              appointments={appointments}
              patientPrescriptions={patientPrescriptions}
              onScheduleClick={() => navigate('/app/clinica/paciente/agendamentos')}
            />

            {/* Ações Rápidas movidas para o final conforme solicitado pelo usuário */}
            <PatientQuickActions
              therapeuticPlan={therapeuticPlan}
              patientPrescriptions={patientPrescriptions}
              onSchedule={() => setActiveTab('meus-agendamentos')}
              onChat={handleOpenChat}
              onViewPlan={() => setActiveTab('plano')}
              onViewEducational={() => navigate('/app/library')}
              onShareReport={() => setActiveTab('report-detail')}
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
            <ClinicalReports
              className="w-full"
              onShareReport={(reportId) => {
                setShareModalReportId(reportId)
                setShareModalOpen(true)
              }}
            />
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


      <ShareReportModal
        isOpen={shareModalOpen}
        onClose={() => setShareModalOpen(false)}
        patientId={user?.id || ''}
        reportId={shareModalReportId || reports[0]?.id || ''}
        reportName="Relatório Clínico MedCann"
      />
    </div>
  )
}


export default PatientDashboard
