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
  BookOpen,
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
  const { openChat: openNoaChat, closeChat, isOpen: isNoaOpen, hideGlobalChat, showGlobalChat } = useNoaPlatform()
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
        setActiveTab('analytics')
        setShareModalOpen(true)
      } else {
        const validTabs: PatientTab[] = ['analytics', 'meus-agendamentos', 'plano', 'conteudo', 'chat-noa', 'perfil', 'reportar-problema']
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
      { id: 'analytics', label: 'Início', icon: BarChart3 },
      { id: 'meus-agendamentos', label: 'Agenda', icon: Calendar },
      { id: 'chat-noa', label: 'Chat NOA', icon: Brain },
      { id: 'perfil', label: 'Meu Perfil', icon: Zap }
    ]

    setDashboardTriggers({
      options: tabs,
      activeId: activeTab,
      onChange: (id) => setActiveTab(id as PatientTab),
      onBrainClick: () => isNoaOpen ? closeChat() : openNoaChat()
    })
    return () => setDashboardTriggers(null)
  }, [activeTab, isNoaOpen, setActiveTab, setDashboardTriggers, openNoaChat, closeChat])

  const handleStartAssessment = () => {
    setShouldStartAssessment(true)
    setActiveTab('chat-noa')
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
            />

            {/* Ações Rápidas movidas para o final conforme solicitado pelo usuário */}
            <PatientQuickActions
              therapeuticPlan={therapeuticPlan}
              patientPrescriptions={patientPrescriptions}
              onSchedule={() => setActiveTab('meus-agendamentos')}
              onChat={handleOpenChat}
              onViewPlan={() => setActiveTab('plano')}
              onViewEducational={() => setActiveTab('conteudo')}
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
            <ClinicalReports className="w-full" />
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

      {activeTab === 'chat-noa' && (
        <div className="h-[calc(100vh-12rem)] bg-slate-950/40 rounded-3xl border border-white/5 overflow-hidden">
          <NoaConversationalInterface
            userName={user?.name || 'Paciente'}
            userCode={user?.id || 'P-001'}
            position="inline"
          />
        </div>
      )}

      {/* Seção de Biblioteca/Conteúdo Real */}
      {activeTab === 'conteudo' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-white flex items-center gap-2">
              <BookOpen className="w-6 h-6 text-amber-400" />
              Biblioteca Educativa
            </h2>
            <button onClick={() => setActiveTab('analytics')} className="px-4 py-2 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-all text-sm">Voltar</button>
          </div>
          <div className="bg-slate-950/40 rounded-3xl border border-white/5 p-4 overflow-hidden">
            {/* Redirecionar para Library.tsx ou injetar componente de Library */}
            <div className="text-center py-12">
              <p className="text-slate-400 mb-6">Acesse nossa biblioteca completa com guias técnicos e vídeos exclusivos.</p>
              <button onClick={() => navigate('/app/library')} className="px-8 py-3 bg-gradient-to-r from-amber-500 to-orange-600 text-white rounded-2xl font-bold shadow-lg shadow-amber-500/20 hover:scale-105 transition-all">
                Entrar na Biblioteca
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Outras abas (simplificadas ou placeholders conforme necessário) */}
      {(['plano', 'perfil'].includes(activeTab)) && (
        <div className="py-20 text-center space-y-4">
          <div className="w-20 h-20 bg-primary-500/10 rounded-full flex items-center justify-center mx-auto border border-primary-500/20">
            <Zap className="w-10 h-10 text-primary-400" />
          </div>
          <h2 className="text-2xl font-bold">Funcionalidade em Expansão</h2>
          <p className="text-slate-400 max-w-md mx-auto">Estamos otimizando esta seção para oferecer a melhor experiência clínica. Em breve disponível.</p>
          <button onClick={() => setActiveTab('analytics')} className="px-6 py-2 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-all">Voltar ao Início</button>
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
