import React, { useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import {
  FileText,
  User,
  Calendar,
  BarChart3,
  TrendingUp,
  Pill,
  ChevronLeft,
  Phone,
  AlertCircle,
  Activity
} from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { useNoaPlatform } from '../contexts/NoaPlatformContext'
import { useDashboardTriggers } from '../contexts/DashboardTriggersContext'
import { useProfessionalDashboard, ProSection } from '../hooks/dashboard/useProfessionalDashboard'

import QuickPrescriptions from '../components/QuickPrescriptions'
import MedicalRecord from '../components/MedicalRecord'
import IntegrativePrescriptions from '../components/IntegrativePrescriptions'
import ClinicalReports from '../components/ClinicalReports'
import ProfessionalScheduling from './ProfessionalScheduling'
import { IncentivosPanel } from '../components/IncentivosPanel'

import { ProfessionalStats } from '../components/dashboard/professional/ProfessionalStats'
import { ProfessionalPatientSearch } from '../components/dashboard/professional/ProfessionalPatientSearch'
// V1.9.500 (Pedro 29/05) — card AECs Interrompidas no dashboard profissional.
// 4 órfãs reais empíricamente em 29/05 (joao eduardo 4d / Pedro 7d / Thiago 24d /
// Solange 32d). Médico decide: invalidar com motivo OR marcar concluída.
import { InterruptedAECsCard } from '../components/InterruptedAECsCard'

const ProfessionalDashboard: React.FC = () => {
  const { user } = useAuth()
  const { openChat: openNoaChat, closeChat, isOpen: isNoaOpen, hideGlobalChat, showGlobalChat } = useNoaPlatform()
  const { setDashboardTriggers } = useDashboardTriggers()
  const [searchParams, setSearchParams] = useSearchParams()

  const {
    patients,
    loading,
    activeSection,
    setActiveSection,
    selectedPatientId,
    selectedPatientData,
    selectPatient,
    stats
  } = useProfessionalDashboard()

  const sectionParam = searchParams.get('section') as ProSection | null

  useEffect(() => {
    if (sectionParam && sectionParam !== activeSection) {
      setActiveSection(sectionParam)
    }
  }, [sectionParam, activeSection, setActiveSection])

  useEffect(() => {
    hideGlobalChat()
    return () => showGlobalChat()
  }, [hideGlobalChat, showGlobalChat])

  // Setup Triggers
  useEffect(() => {
    const options = [
      { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
      { id: 'prescriptions', label: 'Prescrições', icon: Pill },
      { id: 'clinical-reports', label: 'Relatórios', icon: FileText },
      { id: 'agendamentos', label: 'Agenda', icon: Calendar },
      { id: 'incentivos', label: 'Incentivos', icon: TrendingUp }
    ]

    setDashboardTriggers({
      options,
      activeId: activeSection,
      onChange: (id) => {
        setActiveSection(id as ProSection)
        setSearchParams({ section: id })
      },
      onBrainClick: () => isNoaOpen ? closeChat() : openNoaChat()
    })
    return () => setDashboardTriggers(null)
  }, [activeSection, isNoaOpen, setActiveSection, setSearchParams, setDashboardTriggers, openNoaChat, closeChat])

  if (loading && !patients.length) {
    return (
      <div className="min-h-screen bg-[#0f172a] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto mb-4" />
          <p className="text-slate-400">Carregando painel profissional...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0f172a] text-white">
      <div className="container mx-auto px-4 py-8 max-w-7xl space-y-8">
        {/* V1.9.502: header sem bloco "Performance +12% este mês" — era mock hardcoded
            (realidade empírica 29/05: 54 reports 30d vs 78 anterior = -31%, mostrar seria
            desonesto/depressivo). Reativar quando Marco 2 trouxer baseline empírico real. */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">Olá, Dr(a). {user?.user_metadata?.name?.split(' ')[0] || 'Profissional'}</h1>
            <p className="text-slate-400">Gestão Clínica Inteligente • MedCannLab</p>
          </div>
        </div>

        {/* Content Navigation (Top Tabs for Professional) */}
        {!selectedPatientId && (
          <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
            {(['dashboard', 'agendamentos', 'prescriptions', 'clinical-reports', 'incentivos'] as ProSection[]).map(section => (
              <button
                key={section}
                onClick={() => {
                  setActiveSection(section)
                  setSearchParams({ section })
                }}
                className={`px-6 py-2.5 rounded-xl text-sm font-bold whitespace-nowrap transition-all border ${activeSection === section
                  ? 'bg-primary-500 border-primary-400 text-white shadow-lg shadow-primary-500/20'
                  : 'bg-white/5 border-white/5 text-slate-400 hover:text-white hover:bg-white/10'
                  }`}
              >
                {section === 'dashboard' ? 'Início' :
                  section === 'agendamentos' ? 'Agenda' :
                    section === 'prescriptions' ? 'Prescrições' :
                      section === 'clinical-reports' ? 'Relatórios' : 'Incentivos'}
              </button>
            ))}
          </div>
        )}

        {/* Dynamic Section Rendering */}
        <div className="animate-in fade-in duration-500">
          {activeSection === 'dashboard' && (
            !selectedPatientId ? (
              <div className="space-y-8">
                <ProfessionalStats
                  patients={patients}
                  appointmentsTodayCount={stats.appointmentsToday}
                  newReportsCount={stats.reportsLast7d}
                />

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  <div className="lg:col-span-2">
                    <ProfessionalPatientSearch
                      patients={patients}
                      onSelect={selectPatient}
                      loading={loading}
                    />
                  </div>
                  <div className="space-y-6">
                    {/* V1.9.500 — AECs Interrompidas órfãs (médico decide) */}
                    <InterruptedAECsCard />

                    {/* V1.9.502: Atividade Recente derivada de clinical_reports.created_at
                        últimos 7d (top 5). Era hardcoded "Novo relatório (Nôa)" + "Agendamento
                        amanhã" — mock que aparecia idêntico todo dia pra Ricardo. */}
                    <div className="bg-slate-900/40 border border-white/5 rounded-2xl p-6 backdrop-blur-xl">
                      <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                        <Activity className="w-5 h-5 text-emerald-400" /> Atividade Recente
                      </h3>
                      {stats.recentActivity.length === 0 ? (
                        <p className="text-xs text-slate-500 italic">Sem registros nos últimos 7 dias.</p>
                      ) : (
                        <div className="space-y-3">
                          {stats.recentActivity.map(item => (
                            <div key={item.id} className="flex items-center gap-3 text-sm">
                              <div className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                              <p className="text-slate-300 truncate flex-1">{item.label}</p>
                              <p className="text-[10px] text-slate-500 shrink-0">
                                {new Date(item.createdAt).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
                              </p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                    {/* V1.9.502: bloco "Destaque Científico" REMOVIDO — era hardcoded
                        "Estudo Fase 3: Eficácia do CBD em Epilepsia Refratária" + botão
                        "LER ARTIGO" que não navegava pra lugar nenhum. Reativar quando
                        useNewsItems tiver pelo menos 1 row published=true. */}
                  </div>
                </div>
              </div>
            ) : (
              /* Detailed Patient View */
              <div className="space-y-6 animate-in slide-in-from-left-4 duration-500">
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => selectPatient(null)}
                    className="p-3 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-all"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <div>
                    <h2 className="text-2xl font-bold flex items-center gap-3">
                      {selectedPatientData?.name}
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">Em acompanhamento</span>
                    </h2>
                    <p className="text-slate-400 text-sm flex items-center gap-2">
                      <User className="w-3 h-3" /> CPF: {selectedPatientData?.cpf} • <Phone className="w-4 h-4" /> {selectedPatientData?.phone || 'N/A'}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  <div className="lg:col-span-2 space-y-8">
                    <MedicalRecord
                      patientId={selectedPatientId}
                      patientData={selectedPatientData || undefined}
                    />
                    <div className="bg-slate-900/40 border border-white/5 rounded-2xl overflow-hidden backdrop-blur-xl">
                      <div className="p-6 border-b border-white/5 bg-white/5">
                        <h3 className="font-bold flex items-center gap-2"><Pill className="w-5 h-5 text-emerald-400" /> Histórico de Prescrições</h3>
                      </div>
                      <IntegrativePrescriptions />
                    </div>
                  </div>
                  <div className="space-y-8">
                    <QuickPrescriptions className="sticky top-8" />
                    <div className="bg-blue-500/10 border border-blue-500/20 rounded-2xl p-6">
                      <h4 className="font-bold text-blue-400 mb-3 flex items-center gap-2"><AlertCircle className="w-4 h-4" /> Lembretes Clínicos</h4>
                      <ul className="space-y-3 text-sm text-slate-300">
                        <li className="flex items-start gap-2">• Revisar função renal em 30 dias.</li>
                        <li className="flex items-start gap-2">• Renovar receita de controle especial.</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            )
          )}

          {activeSection === 'agendamentos' && !selectedPatientId && (
            <div className="bg-white rounded-2xl shadow-2xl overflow-hidden border-none animate-in fade-in duration-700">
              <ProfessionalScheduling />
            </div>
          )}

          {activeSection === 'prescriptions' && !selectedPatientId && (
            <div className="bg-white rounded-2xl shadow-2xl overflow-hidden animate-in fade-in duration-700">
              <div className="p-8 bg-slate-50 border-b border-slate-100">
                <h2 className="text-2xl font-bold text-slate-900">Central de Prescrições</h2>
                <p className="text-slate-500">Gestão global de protocolos e templates.</p>
              </div>
              <div className="p-8 pt-0">
                <IntegrativePrescriptions />
              </div>
            </div>
          )}

          {activeSection === 'clinical-reports' && !selectedPatientId && <ClinicalReports />}
          {activeSection === 'incentivos' && !selectedPatientId && <IncentivosPanel />}
        </div>
      </div>
    </div>
  )
}

export default ProfessionalDashboard