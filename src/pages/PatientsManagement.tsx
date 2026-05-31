
import React, { useState, useEffect, useCallback, useRef } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate, useSearchParams, useLocation } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { useUserView } from '../hooks/useUserView'
import { useToast } from '../contexts/ToastContext'
import IntegrativePrescriptions from '../components/IntegrativePrescriptions'
import { ExamRequestModule } from '../components/ExamRequestModule'
// V1.9.326 — médico anexa exames/laudos/resultados ao prontuário (Pedro+Ricardo 17/05)
import ProfessionalPatientFiles from '../components/ProfessionalPatientFiles'
// V1.9.327 — timeline narrativa mensal substitui placeholder "Nenhum gráfico disponível" (Pedro 17/05 opção B)
import PatientClinicalTimeline from '../components/PatientClinicalTimeline'
// [V1.9.362] Casos Similares removido do prontuário — usar Terminal de Pesquisa
// V1.9.498 (Pedro 29/05 — pedido Ricardo): clicar em card da aba Evolução
// abre modal com relatório completo (Rich AEC ou raw). Não-disruptivo, leitura
// rápida sem perder contexto do paciente.
import { EvolutionDetailModal } from '../components/EvolutionDetailModal'
import {
  ArrowLeft,
  Search,
  Plus,
  User,
  FileText,
  Download,
  Upload,
  Archive,
  TrendingUp,
  AlertCircle,
  Calendar,
  MapPin,
  Phone,
  Mail,
  UserPlus,
  Edit,
  Clock,
  Activity,
  Target,
  CheckCircle,
  XCircle,
  BarChart3,
  Sparkles,
  Link2,
  ChevronDown,
  Stethoscope,    // V1.9.487 Camada 1.5 — evoluções escritas pelo médico (FOLLOW_UP)
  MessageCircle   // V1.9.487 Camada 1.5 — chat IA paciente↔Nôa (chat_interaction)
} from 'lucide-react'
import { QuickReferralModal } from '../components/QuickReferralModal'
import { useClinicalGovernance } from '../hooks/useClinicalGovernance'
import { ContextAnalysisCard } from '../components/ClinicalGovernance/ContextAnalysisCard'
import IntegratedGovernanceView from '../components/ClinicalGovernance/IntegratedGovernanceView'
import { mapPatientToContext } from '../lib/clinicalGovernance/utils/patientMapper'
import type { Specialty } from '../lib/clinicalGovernance/utils/specialtyConfigs'
import { clinicalReportService } from '../lib/clinicalReportService'
import PatientAnalytics from '../components/PatientAnalytics'
import { getAllPatients, isAdmin } from '../lib/adminPermissions'

/** Componente: KPIs de agendamento com dados reais */
// [V1.9.342] (18/05): prop patientId opcional. Quando renderizado DENTRO do prontuário
// do paciente selecionado (activeTab='appointments' linha 2266), filtra pra mostrar só
// stats daquele paciente. Sem patientId (visão geral linha 1616), mantém TODOS os
// stats do médico logado (RLS já filtra por professional_id). Bug Pedro 18/05: aba
// Agenda dentro do prontuário do Carlos Eduardo mostrava agendamentos de Maria + João.
const RealAppointmentStats = ({ patientId }: { patientId?: string }) => {
  const [stats, setStats] = useState({ today: 0, thisWeek: 0, confirmed: 0, pending: 0 })
  useEffect(() => {
    const load = async () => {
      const now = new Date()
      const todayStr = now.toISOString().split('T')[0]
      const weekEnd = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      let query = supabase.from('appointments').select('id, appointment_date, status').gte('appointment_date', todayStr).lte('appointment_date', weekEnd + 'T23:59:59')
      if (patientId) query = query.eq('patient_id', patientId)
      const { data } = await query
      const all = data || []
      const todayAppts = all.filter(a => a.appointment_date?.startsWith(todayStr))
      setStats({
        today: todayAppts.length,
        thisWeek: all.length,
        confirmed: all.filter(a => ['confirmed', 'scheduled'].includes(a.status)).length,
        pending: all.filter(a => !['confirmed', 'scheduled', 'completed', 'cancelled', 'canceled'].includes(a.status)).length
      })
    }
    load()
  }, [patientId])
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
      <div className="bg-slate-700/50 rounded-lg p-4"><p className="text-sm text-slate-400 mb-1">Hoje</p><p className="text-2xl font-bold text-white">{stats.today}</p></div>
      <div className="bg-slate-700/50 rounded-lg p-4"><p className="text-sm text-slate-400 mb-1">Esta Semana</p><p className="text-2xl font-bold text-white">{stats.thisWeek}</p></div>
      <div className="bg-slate-700/50 rounded-lg p-4"><p className="text-sm text-slate-400 mb-1">Confirmados</p><p className="text-2xl font-bold text-green-400">{stats.confirmed}</p></div>
      <div className="bg-slate-700/50 rounded-lg p-4"><p className="text-sm text-slate-400 mb-1">Pendentes</p><p className="text-2xl font-bold text-yellow-400">{stats.pending}</p></div>
    </div>
  )
}

/** Componente: Agenda de hoje com dados reais */
// [V1.9.342] (18/05): prop patientId opcional pra filtrar quando dentro do prontuário
// individual. Veja comentário em RealAppointmentStats. RLS appointments já filtra
// por professional_id (Pedro/Ricardo só vê seus appts), mas dentro do prontuário X
// queremos só os do paciente X.
const RealAgendaHoje = ({ patientId }: { patientId?: string }) => {
  const [appointments, setAppointments] = useState<any[]>([])
  useEffect(() => {
    const load = async () => {
      const todayStr = new Date().toISOString().split('T')[0]
      let query = supabase
        .from('appointments')
        .select('id, title, appointment_date, appointment_time, status, patient_id, description')
        .gte('appointment_date', todayStr)
        .lte('appointment_date', todayStr + 'T23:59:59')
        .not('status', 'in', '("cancelled","canceled")')
      if (patientId) query = query.eq('patient_id', patientId)
      const { data } = await query.order('appointment_date', { ascending: true })
      if (!data?.length) { setAppointments([]); return }
      const patientIds = [...new Set(data.map(a => a.patient_id).filter(Boolean))]
      const { data: users } = await supabase.from('users').select('id, name').in('id', patientIds)
      const nameMap = Object.fromEntries((users || []).map(u => [u.id, u.name]))
      setAppointments(data.map(a => ({ ...a, patient_name: nameMap[a.patient_id] || 'Paciente' })))
    }
    load()
  }, [patientId])

  const statusStyle = (s: string) => {
    if (['confirmed', 'scheduled'].includes(s)) return 'bg-green-500/20 text-green-400'
    if (s === 'completed') return 'bg-blue-500/20 text-blue-400'
    return 'bg-yellow-500/20 text-yellow-400'
  }
  const statusLabel = (s: string) => {
    if (s === 'confirmed') return 'Confirmado'
    if (s === 'scheduled') return 'Agendado'
    if (s === 'completed') return 'Concluído'
    return 'Pendente'
  }

  return (
    <div className="mb-6">
      <h4 className="text-lg font-bold text-white mb-4">Agenda de Hoje</h4>
      <div className="space-y-3">
        {appointments.length === 0 ? (
          <p className="text-slate-500 italic text-sm">Nenhum agendamento para hoje.</p>
        ) : appointments.map(a => {
          const time = a.appointment_time || (a.appointment_date ? new Date(a.appointment_date).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : '--:--')
          const hour = time.split(':')[0] || '--'
          return (
            <div key={a.id} className="bg-slate-700/50 rounded-lg p-4 border border-slate-600">
              <div className="flex items-start space-x-3">
                <div className="bg-blue-500 rounded-lg p-2 text-white font-bold text-sm">{hour}</div>
                <div>
                  <h5 className="font-semibold text-white mb-1">{a.patient_name}</h5>
                  <p className="text-sm text-slate-400 mb-2">{a.title || a.description || 'Consulta'}</p>
                  <div className="flex items-center space-x-4 text-xs text-slate-300">
                    <div className="flex items-center space-x-1"><Clock className="w-3 h-3" /><span>{time}</span></div>
                    <span className={`px-2 py-1 rounded ${statusStyle(a.status)}`}>{statusLabel(a.status)}</span>
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

interface Patient {
  id: string
  name: string
  age: number
  months: number
  days: number
  phone: string
  cpf: string
  code: string
  photo: string
  specialty: string
  clinic: string
  room: string
  referringDoctor: string
  status: 'active' | 'inactive'
  appointmentsCount: number
  absences: number
  servicesCount: number
  // V1.9.119-F: dados clinicos relevantes pra Visao Geral
  birthDate?: string | null
  allergies?: string | null
  medications?: string | null
  bloodType?: string | null
  email?: string
}

// V1.9.487 (Camada 1.5 Matrix-Longitudinal — Sprint D, 29/05/2026):
// Separar visualmente as 3 fontes que loadEvolutions agrega.
// Aplicacao direta do principio meta cristalizado 28/05:
// "O problema nao e falta de dados — e falta de separacao epistemologica
// entre as fontes" (memory feedback_sistema_tem_contexto_demais_falta_
// semantica_clinica_28_05).
// Ricardo via aba Evolucao misturada (FOLLOW_UP medico + AEC IA + chat IA
// paciente) como equivalentes. Camada 1.5 separa por evolutionKind com
// header semantico (mesmo pattern V1.9.482 CATEGORY_OF_TYPE).
type EvolutionKind =
  | 'doctor-evolution'    // clinical_assessments WHERE assessment_type='FOLLOW_UP' (medico escreveu)
  | 'aec-report'          // clinical_reports (AEC IA Residente)
  | 'assessment-other'    // clinical_assessments outros tipos (TRIAGE/CONSULTA/IMRE)
  | 'chat-ia'             // patient_medical_records WHERE record_type='chat_interaction'

interface Evolution {
  id: string
  date: string
  time: string
  type: 'current' | 'historical'
  content: string
  professional: string
  // V1.9.281: tipagem da fonte pra timeline tipada na Visão Geral
  source?: 'assessment' | 'report' | 'record' | 'appointment' | 'prescription'
  // V1.9.487 — kind granular pra agrupamento semantico visual da aba Evolucao
  kind?: EvolutionKind
  signed?: boolean
  score?: number | null
  rawCreatedAt?: string
  // V1.9.535 — agrupamento chat_interaction por dia. Quando preenchido, este card
  // representa N turnos do mesmo dia (1 card visual = 1 sessão diária). Modal expande
  // pra timeline detalhada lendo todos os IDs em batch.
  chatGroupIds?: string[]
  chatGroupCount?: number
  chatGroupFirstTime?: string
  chatGroupLastTime?: string
}

// V1.9.487 — metadados visuais por EvolutionKind (label + icone + cor).
// Pattern V1.9.482 CATEGORY_OF_TYPE replicado.
const EVOLUTION_KIND_META: Record<EvolutionKind, {
  label: string
  shortLabel: string
  icon: React.ComponentType<{ className?: string }>
  colorClass: string
  borderClass: string
  bgClass: string
}> = {
  'doctor-evolution': {
    label: 'Evoluções escritas pelo médico',
    shortLabel: 'Evolução do médico',
    icon: Stethoscope,
    colorClass: 'text-blue-300',
    borderClass: 'border-blue-500/30',
    bgClass: 'bg-blue-500/5',
  },
  'aec-report': {
    label: 'Relatórios AEC (IA Residente)',
    shortLabel: 'Relatório AEC',
    icon: FileText,
    colorClass: 'text-emerald-300',
    borderClass: 'border-emerald-500/30',
    bgClass: 'bg-emerald-500/5',
  },
  'assessment-other': {
    label: 'Outras avaliações (Triagem/Consulta/IMRE)',
    shortLabel: 'Avaliação',
    icon: Sparkles,
    colorClass: 'text-amber-300',
    borderClass: 'border-amber-500/30',
    bgClass: 'bg-amber-500/5',
  },
  'chat-ia': {
    label: 'Conversas do paciente com a Nôa',
    shortLabel: 'Chat IA',
    icon: MessageCircle,
    colorClass: 'text-slate-400',
    borderClass: 'border-slate-600/40',
    bgClass: 'bg-slate-800/30',
  },
}

const EVOLUTION_KIND_ORDER: EvolutionKind[] = [
  'doctor-evolution',   // mais importante (médico escreveu — alvo Camada 1.2 Matrix)
  'aec-report',         // segundo (AEC IA — núcleo clínico)
  'assessment-other',   // terceiro (outras avaliações)
  'chat-ia',            // último (ruidoso, 6070+ rows tipicamente)
]

// V1.9.281: dados agregados da Visão Geral elite escalável
interface OverviewData {
  lastReport: {
    id: string
    generatedAt: string
    chiefComplaint: string
    score: number | null
    prevScore: number | null
    signed: boolean
    riskFlags: string[]
    scoreHistory: number[]
  } | null
  pendingReviewCount: number
  lastPrescription: {
    id: string
    summary: string
    status: string
    createdAt: string
  } | null
  nextAppointment: {
    id: string
    dateISO: string
    professionalId: string | null
    isRemote: boolean
  } | null
  chatCount30d: number
  clinicalTeam: Array<{ id: string; name: string; specialty?: string | null; role: 'responsible' | 'partner'; appointmentCount: number }>
  tabCounts: {
    aecs: number
    prescriptions: number
    exams: number
    appointments: number
  }
  drcStage: string | null
}

/** Garante que o conteúdo de evolução seja sempre string (evita React error #31 ao renderizar objeto). */
function evolutionContentString(value: unknown, fallback: string): string {
  if (value === null || value === undefined) return fallback
  if (typeof value === 'string') return value
  if (typeof value === 'object') return JSON.stringify(value).slice(0, 500) || fallback
  return String(value)
}

interface PatientsManagementProps {
  embedded?: boolean
  /** Exibe só o detalhe do paciente (prontuário), sem lista. Requer preselectedPatientId. */
  detailOnly?: boolean
  /** ID do paciente a carregar quando detailOnly; abre o prontuário direto. */
  preselectedPatientId?: string | null
  /** Callback ao clicar Voltar no modo detailOnly (ex.: voltar à seleção no Terminal Clínico). */
  onBack?: () => void
  /** Oculta o botão Voltar quando o pai já fornece navegação (ex.: vista unificada no Terminal Clínico). */
  hideBackButton?: boolean
  /** Quando true, reduz espaçamento/tamanho para vista no Terminal Clínico (estilo aplicado via CSS no pai). */
  compact?: boolean
}

const PatientsManagement: React.FC<PatientsManagementProps> = ({ embedded = false, detailOnly = false, preselectedPatientId = null, onBack, hideBackButton = false, compact = false }) => {
  const navigate = useNavigate()
  const location = useLocation()
  const [searchParams] = useSearchParams()
  const { user } = useAuth()
  const { getEffectiveUserType } = useUserView()
  const effectiveType = getEffectiveUserType(user?.type)
  const toast = useToast()
  const [searchTerm, setSearchTerm] = useState('')
  // V1.9.508 — Filtros Specialty + Clinic + Sala removidos (overhead visual sem
  // utilidade real: admin ve todos via RLS, profissional ve so seus via RLS,
  // search por nome no sidebar cobre 100% casos de uso).
  // V1.9.507 -> V1.9.508 evolucao: enxugamento total apos validacao empirica Pedro.
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null)
  // V1.9.462 — toggle lista pacientes no mobile (Pedro 27/05: "lista pacientes
  // no mobile precisa ser dropdown pois ocupa mto espaço tbm")
  const [showPatientListMobile, setShowPatientListMobile] = useState(false)
  const [activeTab, setActiveTab] = useState<'overview' | 'evolution' | 'prescription' | 'exams' | 'files' | 'receipts' | 'charts' | 'appointments' | 'analytics'>('overview')
  const [showNewEvolution, setShowNewEvolution] = useState(false)
  const [evolutionContent, setEvolutionContent] = useState('')
  const [patients, setPatients] = useState<Patient[]>([])
  const [loading, setLoading] = useState(true)
  const [evolutions, setEvolutions] = useState<Evolution[]>([])
  const [loadingEvolutions, setLoadingEvolutions] = useState(false)
  const [showNewPatientMenu, setShowNewPatientMenu] = useState(false)
  // V1.9.440 — Atalho "Enviar Link de Indicação" no menu Novo Paciente
  const [showReferralModal, setShowReferralModal] = useState(false)
  // V1.9.440-A — anchor do botão Novo Paciente pra dropdown via Portal
  // (escapa stacking context dos parents — antes sobrepunha cards abaixo)
  const newPatientBtnRef = useRef<HTMLButtonElement | null>(null)
  const [newPatientMenuPos, setNewPatientMenuPos] = useState<{ top: number; right: number } | null>(null)
  useEffect(() => {
    if (!showNewPatientMenu) return
    const updatePos = () => {
      const btn = newPatientBtnRef.current
      if (!btn) return
      const r = btn.getBoundingClientRect()
      setNewPatientMenuPos({
        top: r.bottom + 8,
        right: window.innerWidth - r.right,
      })
    }
    updatePos()
    window.addEventListener('resize', updatePos)
    window.addEventListener('scroll', updatePos, true)
    return () => {
      window.removeEventListener('resize', updatePos)
      window.removeEventListener('scroll', updatePos, true)
    }
  }, [showNewPatientMenu])
  const [openingChat, setOpeningChat] = useState(false)
  // [V1.9.360] Removido showCasosSimilaresModal — agora é aba dedicada
  const [analyticsReports, setAnalyticsReports] = useState<any[]>([])
  const [analyticsReportsLoading, setAnalyticsReportsLoading] = useState(false)
  const [analyticsAppointments, setAnalyticsAppointments] = useState<Array<{ id: string; date: string; time: string; professional: string; type: string; status: string }>>([])
  const [analyticsPrescriptions, setAnalyticsPrescriptions] = useState<Array<{ id: string; title: string; status: string; issuedAt?: string; startsAt?: string | null; endsAt?: string | null; professionalName?: string | null }>>([])
  const [analyticsPrescriptionsLoading, setAnalyticsPrescriptionsLoading] = useState(false)

  // V1.9.281: Overview elite escalável
  const [overviewData, setOverviewData] = useState<OverviewData | null>(null)
  const [overviewLoading, setOverviewLoading] = useState(false)

  // V1.9.292: clicar em item do histórico Visão Geral → aba Evolução com highlight + auto-scroll
  const [highlightEvolutionId, setHighlightEvolutionId] = useState<string | null>(null)
  const highlightedEvolutionRef = useRef<HTMLDivElement | null>(null)
  // V1.9.498 — modal detalhe evolução (pedido Ricardo). Click no card abre
  // RichClinicalReportView (AEC) ou raw view (FOLLOW_UP / chat / outros).
  const [detailEvolution, setDetailEvolution] = useState<Evolution | null>(null)

  useEffect(() => {
    if (activeTab === 'evolution' && highlightEvolutionId && highlightedEvolutionRef.current) {
      highlightedEvolutionRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' })
      // Limpa destaque após 3s pra não ficar permanente
      const timer = setTimeout(() => setHighlightEvolutionId(null), 3500)
      return () => clearTimeout(timer)
    }
  }, [activeTab, highlightEvolutionId])

  // ACDSS Integration
  const patientContext = React.useMemo(() => {
    if (!selectedPatient) return null
    // Here we map the selected patient (which might have limited data) to the context
    // Ideally we would fetch full patient data here if needed
    return mapPatientToContext(selectedPatient)
  }, [selectedPatient])

  // Determine specialty from patient or default
  const rawSpecialty = selectedPatient?.specialty?.toLowerCase().replace(' ', '_')
  // Map display strings to internal keys if needed
  const patientSpecialty: Specialty = (
    rawSpecialty === 'cannabis_medicinal' ? 'cannabis' :
      (rawSpecialty as Specialty) || 'geral'
  )

  const { analysis, loading: loadingAnalysis } = useClinicalGovernance(patientContext, {
    specialty: patientSpecialty
  })

  // Ler parâmetros da URL para abrir aba e formulário
  useEffect(() => {
    const tabParam = searchParams.get('tab')
    const patientIdParam = searchParams.get('patientId')
    const newEvolutionParam = searchParams.get('newEvolution')

    // V1.9.329-B — aceitar mais tabs via URL pra deep-link de cards externos
    // (ex: RenalSuggestionsCard "Ver em Saúde Renal" → ?tab=charts mostra timeline V1.9.327)
    const validTabs = ['overview', 'evolution', 'prescription', 'exams', 'files', 'receipts', 'charts', 'appointments', 'analytics'] as const
    if (tabParam && (validTabs as readonly string[]).includes(tabParam)) {
      setActiveTab(tabParam as typeof activeTab)
    }

    // Se houver patientId na URL, buscar e selecionar o paciente
    // Se os pacientes ainda não foram carregados, tentar carregar o paciente individualmente
    if (patientIdParam) {
      if (patients.length > 0) {
        // Se a lista já foi carregada, buscar na lista
        const patient = patients.find(p => p.id === patientIdParam)
        if (patient) {
          setSelectedPatient(patient)
        } else {
          // Paciente não encontrado na lista, tentar carregar individualmente
          const loadSinglePatient = async () => {
            try {
              const { data, error } = await supabase
                .from('users')
                .select('*')
                .eq('id', patientIdParam)
                .single()

              if (error) {
                console.error('Erro ao carregar paciente individual:', error)
              } else if (data) {
                // Criar objeto Patient a partir dos dados do usuário
                const patient: Patient = {
                  id: data.id,
                  name: data.name || 'Paciente Desconhecido',
                  age: 0,
                  months: 0,
                  days: 0,
                  phone: data.phone || '',
                  cpf: data.cpf || '',
                  code: '',
                  photo: '',
                  specialty: '',
                  clinic: '',
                  room: '',
                  referringDoctor: '',
                  status: 'active',
                  appointmentsCount: 0,
                  absences: 0,
                  servicesCount: 0
                }
                setSelectedPatient(patient)
              }
            } catch (err) {
              console.error('Erro ao carregar paciente individual:', err)
            }
          }
          void loadSinglePatient()
        }
      } else {
        // Se a lista ainda não foi carregada, carregar o paciente individualmente
        const loadSinglePatient = async () => {
          try {
            const { data, error } = await supabase
              .from('users')
              .select('*')
              .eq('id', patientIdParam)
              .single()

            if (error) {
              console.error('Erro ao carregar paciente individual:', error)
            } else if (data) {
              // Criar objeto Patient a partir dos dados do usuário
              const patient: Patient = {
                id: data.id,
                name: data.name || 'Paciente Desconhecido',
                age: 0,
                months: 0,
                days: 0,
                phone: data.phone || '',
                cpf: data.cpf || '',
                code: '',
                photo: '',
                specialty: '',
                clinic: '',
                room: '',
                referringDoctor: '',
                status: 'active',
                appointmentsCount: 0,
                absences: 0,
                servicesCount: 0
              }
              setSelectedPatient(patient)
            }
          } catch (err) {
            console.error('Erro ao carregar paciente individual:', err)
          }
        }
        void loadSinglePatient()
      }
    }

    // Se newEvolution=true, mostrar formulário de nova evolução
    if (newEvolutionParam === 'true' && tabParam === 'evolution') {
      setShowNewEvolution(true)
    }
  }, [searchParams])

  // Modo detailOnly (ex.: Paciente em foco no Terminal Clínico): carregar paciente pelo ID e exibir só o prontuário
  useEffect(() => {
    if (!detailOnly || !preselectedPatientId) return
    const pid = preselectedPatientId
    const fromList = patients.find(p => p.id === pid)
    if (fromList) {
      setSelectedPatient(fromList)
      return
    }
    let cancelled = false
    const load = async () => {
      try {
        const { data, error } = await supabase.from('users').select('*').eq('id', pid).single()
        if (cancelled) return
        if (error || !data) return
        const patient: Patient = {
          id: data.id,
          name: data.name || 'Paciente',
          age: 0,
          months: 0,
          days: 0,
          phone: data.phone || '',
          cpf: (data as any).cpf || '',
          code: (data as any).code || `#${data.id.slice(0, 8).toUpperCase()}`,
          photo: (data as any).avatar_url || (data as any).photo || '',
          specialty: (data as any).specialty || 'Cannabis Medicinal',
          clinic: (data as any).clinic || 'Consultório',
          room: (data as any).room || 'Sala 1',
          referringDoctor: (data as any).referring_doctor || (data as any).referringDoctor || '',
          status: 'active',
          appointmentsCount: 0,
          absences: 0,
          servicesCount: 0
        }
        setSelectedPatient(patient)
      } catch {
        if (!cancelled) setSelectedPatient(null)
      }
    }
    void load()
    return () => { cancelled = true }
  }, [detailOnly, preselectedPatientId, patients])

  const navigationState = location.state as { from?: string } | null
  const originPath = navigationState?.from

  const handleBack = useCallback(() => {
    if (originPath) {
      navigate(originPath)
      return
    }

    if (window.history.length > 1) {
      navigate(-1)
      return
    }

    navigate('/app/clinica/profissional/dashboard')
  }, [navigate, originPath])

  // Fechar menu ao clicar fora
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement
      if (showNewPatientMenu && !target.closest('.new-patient-menu-container')) {
        setShowNewPatientMenu(false)
      }
    }

    if (showNewPatientMenu) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showNewPatientMenu])

  // V1.9.508 — specialties + clinics arrays + useEffect dinamico removidos
  // (eram dados pros filtros que sumiram do header).
  // V1.9.507 — rooms removido (era mock Sala 1/2/3 hardcoded sem uso real)

  // Carregar pacientes reais do Supabase
  useEffect(() => {
    loadPatients()
  }, [user])

  // Recarregar pacientes quando houver parâmetro refresh na URL (após cadastro de novo paciente)
  useEffect(() => {
    const refreshParam = searchParams.get('refresh')
    if (refreshParam === 'true') {
      console.log('🔄 Recarregando lista de pacientes após cadastro...')
      loadPatients()
      // Remover parâmetro da URL sem recarregar a página
      const newSearchParams = new URLSearchParams(searchParams)
      newSearchParams.delete('refresh')
      navigate({ search: newSearchParams.toString() }, { replace: true })
    }
  }, [searchParams, navigate])

  // Carregar evoluções quando um paciente é selecionado
  useEffect(() => {
    if (selectedPatient) {
      loadEvolutions(selectedPatient.id)
      // Garantir que a aba overview está ativa quando o paciente é selecionado via URL
      const tabParam = searchParams.get('tab')
      if (!tabParam || tabParam === 'overview') {
        setActiveTab('overview')
      }
    }
  }, [selectedPatient, searchParams])

  // Carregar dados para Evolução e Analytics quando a aba é aberta
  useEffect(() => {
    if (activeTab !== 'analytics' || !selectedPatient?.id) return
    const pid = selectedPatient.id
    let cancelled = false
    const load = async () => {
      setAnalyticsReportsLoading(true)
      setAnalyticsPrescriptionsLoading(true)
      try {
        const [reports, apptsRes, prescRes] = await Promise.all([
          clinicalReportService.getPatientReports(pid),
          supabase.from('appointments').select('*').eq('patient_id', pid).order('appointment_date', { ascending: true }).limit(20),
          supabase.from('v_patient_prescriptions').select('*').eq('patient_id', pid).order('issued_at', { ascending: false })
        ])
        if (cancelled) return
        setAnalyticsReports(reports || [])
        if (apptsRes.data?.length) {
          setAnalyticsAppointments(apptsRes.data.map((apt: any) => ({
            id: apt.id,
            date: apt.appointment_date,
            time: apt.appointment_time || '09:00',
            professional: apt.professional_name || 'Equipe Clínica',
            type: apt.appointment_type || 'Consulta',
            status: apt.status || 'scheduled'
          })))
        } else {
          const viewRes = await (supabase as any).from('v_patient_appointments').select('*').eq('patient_id', pid).order('appointment_date', { ascending: true }).limit(20)
          if (!cancelled && viewRes.data?.length) {
            setAnalyticsAppointments(viewRes.data.map((apt: any) => ({
              id: apt.id,
              date: apt.appointment_date,
              time: apt.appointment_time || apt.start_time || '09:00',
              professional: apt.professional_name || apt.professional_full_name || 'Equipe Clínica',
              type: apt.appointment_type || apt.type || 'Consulta',
              status: apt.status || 'scheduled'
            })))
          } else if (!cancelled) {
            setAnalyticsAppointments([])
          }
        }
        if (prescRes.data?.length) {
          setAnalyticsPrescriptions(prescRes.data.map((row: any) => ({
            id: row.id,
            title: row.title ?? row.template_title ?? 'Prescrição integrativa',
            status: row.status ?? 'draft',
            issuedAt: row.issued_at,
            startsAt: row.starts_at ?? row.plan_starts_at ?? null,
            endsAt: row.ends_at ?? row.plan_ends_at ?? null,
            professionalName: row.professional_name ?? null
          })))
        } else {
          setAnalyticsPrescriptions([])
        }
      } catch {
        if (!cancelled) {
          setAnalyticsReports([])
          setAnalyticsAppointments([])
          setAnalyticsPrescriptions([])
        }
      } finally {
        if (!cancelled) {
          setAnalyticsReportsLoading(false)
          setAnalyticsPrescriptionsLoading(false)
        }
      }
    }
    load()
    return () => { cancelled = true }
  }, [activeTab, selectedPatient?.id])

  const loadPatients = async () => {
    try {
      setLoading(true)

      // Para admin e profissional: usar getAllPatients (já respeita RLS e retorna nomes da tabela users)
      // Assim o profissional (ex.: Dr. Ricardo) vê seus pacientes vinculados COM NOME
      let usersData: any[] = []
      try {
        // Passa effectiveType: admin "vendo como profissional" recebe só vinculados
        const fromGetAll = await getAllPatients(user, effectiveType ?? undefined)
        if (fromGetAll && fromGetAll.length > 0) {
          usersData = fromGetAll.map(p => {
            let created_at: string | null = null
            if (p.lastVisit && typeof p.lastVisit === 'string') {
              const d = new Date(p.lastVisit)
              if (!Number.isNaN(d.getTime())) created_at = d.toISOString()
            }
            return {
              id: p.id,
              name: p.name,
              email: p.email ?? '',
              phone: p.phone ?? '',
              type: 'patient',
              created_at
            }
          })
          const adminViewingAs = isAdmin(user) && effectiveType && effectiveType !== 'admin'
          console.log(
            '✅ Pacientes carregados (getAllPatients):',
            usersData.length,
            adminViewingAs ? `(admin vendo como ${effectiveType})` : isAdmin(user) ? '(admin)' : '(profissional)'
          )
        }
      } catch (e) {
        console.warn('getAllPatients falhou, usando fallback direto:', e)
      }

      // Se não veio de getAllPatients, tentar direto na tabela users (fallback para admin quando RLS permite)
      if (usersData.length === 0) {
        const { data: usersDataFromUsers, error: usersError } = await supabase
          .from('users')
          .select('id, name, email, type, created_at, birth_date, allergies, medications, blood_type, phone, cpf')
          .in('type', ['paciente', 'patient'])
          .order('created_at', { ascending: false })

        if (!usersError && usersDataFromUsers) {
          usersData = usersDataFromUsers.filter(u => u.id !== user?.id)
          console.log('✅ Pacientes encontrados na tabela users:', usersData.length)
        } else if (usersError) {
          const { data: usersDataFromCompatible, error: compatibleError } = await supabase
            .from('users_compatible')
            .select('id, name, email, phone, type, created_at, birth_date, allergies, medications, blood_type, cpf')
            .in('type', ['paciente', 'patient'])
            .order('created_at', { ascending: false })
          if (!compatibleError && usersDataFromCompatible) {
            usersData = usersDataFromCompatible.filter(u => u.id !== user?.id)
            console.log('✅ Pacientes encontrados na tabela users_compatible:', usersData.length)
          }
        }
      }

      // V1.9.119-F: enriquecer com dados clinicos do banco (alergias, medicacoes, birth_date)
      // mesmo quando getAllPatients retornou primeiro (que so traz id, name, email, phone)
      if (usersData.length > 0) {
        const ids = usersData.map(u => u.id).filter(Boolean)
        if (ids.length > 0) {
          const { data: clinicalData } = await supabase
            .from('users')
            .select('id, birth_date, allergies, medications, blood_type, cpf')
            .in('id', ids)
          if (clinicalData) {
            const clinicalMap = new Map(clinicalData.map(c => [c.id, c]))
            usersData = usersData.map(u => {
              const extra = clinicalMap.get(u.id)
              return extra ? { ...u, ...extra } : u
            })
          }
        }
      }

      // Buscar avaliações clínicas para contagens e dados adicionais (CPF, telefone, etc.)
      const { data: assessments, error: assessmentsError } = await supabase
        .from('clinical_assessments')
        .select('patient_id, created_at, status, assessment_type, data, clinical_report, doctor_id')
        .order('created_at', { ascending: false })

      if (assessmentsError) {
        console.error('Erro ao buscar avaliações:', assessmentsError)
      }

      // Fallback: se ainda não tem ninguém, montar lista a partir das avaliações (nomes podem ficar "Paciente")
      if (usersData.length === 0 && assessments && assessments.length > 0) {
        const assessmentsMap = new Map()
        assessments.forEach(a => {
          if (a.patient_id && a.patient_id !== user?.id && !assessmentsMap.has(a.patient_id)) {
            const patientData: any = a.data || {}
            assessmentsMap.set(a.patient_id, {
              id: a.patient_id,
              name: patientData.name || 'Paciente',
              email: '',
              phone: patientData.phone || '',
              type: 'patient',
              address: null,
              created_at: a.created_at
            })
          }
        })
        usersData = Array.from(assessmentsMap.values())
      }

      const patientsMap = new Map<string, Patient>()

      usersData?.filter(u => {
        if (user?.id && u.id === user.id) return false
        return u.type === 'patient' || !u.type || u.type === null
      }).forEach(u => {
        const patientAssessments = assessments?.filter(a => a.patient_id === u.id) || []
        const appointmentsCount = patientAssessments.length
        const latestAssessment = patientAssessments[0]
        const patientData: any = latestAssessment?.data || {}

        let patientName = u.name || 'Paciente'
        let patientCpf = ''
        let patientPhone = (u.phone || u.telefone || '') as string
        let patientAge = 0

        for (const assessment of patientAssessments) {
          const data: any = assessment.data || {}
          if (data.name && data.name !== 'Paciente') patientName = data.name
          if (data.cpf && !patientCpf) patientCpf = data.cpf
          if (data.phone && !patientPhone) patientPhone = data.phone
          if (data.age && !patientAge) patientAge = typeof data.age === 'number' ? data.age : parseInt(data.age) || 0
          if (patientName !== 'Paciente' && patientCpf && patientPhone) break
        }

        if (patientName === 'Paciente' || !patientName) {
          if (latestAssessment?.clinical_report) {
            const reportMatch = latestAssessment.clinical_report.match(/Paciente[:\s]+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/i)
            if (reportMatch?.[1]) patientName = reportMatch[1]
          }
          if ((patientName === 'Paciente' || !patientName) && latestAssessment?.data) {
            const dataObj = typeof latestAssessment.data === 'string' ? JSON.parse(latestAssessment.data) : latestAssessment.data
            if (dataObj?.patientName || dataObj?.name) patientName = dataObj.patientName || dataObj.name
          }
        }

        const patientIdStr = u.id?.toString().replace(/-/g, '') || ''
        const patientCode = `#PAT${patientIdStr.substring(0, 8).toUpperCase() || '0001'}`

        // V1.9.119-F: calcular idade REAL a partir de birth_date (preferencial sobre patientAge da AEC)
        let computedAge = patientAge
        let computedMonths = 0
        let computedDays = 0
        if (u.birth_date) {
          try {
            const birth = new Date(u.birth_date)
            const now = new Date()
            if (!Number.isNaN(birth.getTime())) {
              let years = now.getFullYear() - birth.getFullYear()
              let months = now.getMonth() - birth.getMonth()
              let days = now.getDate() - birth.getDate()
              if (days < 0) { months--; days += 30 }
              if (months < 0) { years--; months += 12 }
              computedAge = years
              computedMonths = months
              computedDays = days
            }
          } catch (_) {
            // mantem patientAge se birth_date invalido
          }
        }

        // V1.9.119-F: usar CPF/phone do banco se AEC nao trouxe
        const finalCpf = patientCpf || u.cpf || ''
        const finalPhone = patientPhone || u.phone || ''

        patientsMap.set(u.id, {
          id: u.id,
          name: patientName,
          age: computedAge,
          months: computedMonths,
          days: computedDays,
          phone: finalPhone || 'Não informado',
          cpf: finalCpf,
          code: patientCode,
          photo: '',
          specialty: patientData.specialty || 'Cannabis Medicinal',
          clinic: patientData.clinic || 'Consultório Dr. Ricardo Valença',
          room: patientData.room || 'Sala 1',
          referringDoctor: patientData.referringDoctor || 'Dr. Ricardo Valença',
          status: 'active',
          appointmentsCount,
          absences: 0,
          servicesCount: patientAssessments.filter(a => a.status === 'completed').length,
          // V1.9.119-F: dados clinicos enriquecidos
          birthDate: u.birth_date || null,
          allergies: u.allergies || null,
          medications: u.medications || null,
          bloodType: u.blood_type || null,
          email: u.email || ''
        })
      })

      setPatients(Array.from(patientsMap.values()))
    } catch (error) {
      console.error('Erro ao carregar pacientes:', error)
    } finally {
      setLoading(false)
    }
  }

  // V1.9.281: Overview elite escalável — Promise.all paralelo (pattern V1.9.209).
  // Reusa dados que já existem (clinical_reports + cfm_prescriptions + appointments + exam_requests + chat_messages_legacy).
  // Zero schema novo. Equipe clínica derivada de distinct(professional_id) em appointments.
  const loadOverviewData = async (patientId: string) => {
    setOverviewLoading(true)
    setOverviewData(null)
    try {
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
      const todayISO = new Date().toISOString().split('T')[0]

      const [reportsRes, prescRes, apptRes, examsRes, chatRes] = await Promise.all([
        supabase.from('clinical_reports').select('id, generated_at, content, status, review_status, signature_hash, signed_at')
          .eq('patient_id', patientId).order('generated_at', { ascending: false }).limit(10),
        supabase.from('cfm_prescriptions').select('id, created_at, medications, status, prescription_type')
          .eq('patient_id', patientId).order('created_at', { ascending: false }).limit(5),
        supabase.from('appointments').select('id, appointment_date, appointment_time, status, professional_id, is_remote, appointment_type')
          .eq('patient_id', patientId).order('appointment_date', { ascending: false }).limit(30),
        supabase.from('patient_exam_requests').select('id, status', { count: 'exact', head: false })
          .eq('patient_id', patientId),
        supabase.from('chat_messages_legacy').select('id', { count: 'exact', head: true })
          .eq('user_id', patientId).gte('created_at', thirtyDaysAgo),
      ])

      // Última AEC + sparkline scores
      const reports = (reportsRes.data || []) as any[]
      const scoreHistory: number[] = []
      let lastReportData: OverviewData['lastReport'] = null
      reports.forEach(r => {
        const sc = (r.content as any)?.scores?.clinical_score
        if (typeof sc === 'number') scoreHistory.push(sc)
      })
      if (reports[0]) {
        const r = reports[0]
        const content = (r.content || {}) as any
        const chiefComplaint = String(
          content.queixa_principal || content.chief_complaint || content.investigation || content.result || 'Sem queixa registrada'
        ).slice(0, 180)
        const score = typeof content?.scores?.clinical_score === 'number' ? content.scores.clinical_score : null
        const prevScore = scoreHistory.length > 1 ? scoreHistory[1] : null
        const flagsRaw = content.risk_flags || content.alertas || content.alerts || []
        const riskFlags = Array.isArray(flagsRaw) ? flagsRaw.slice(0, 3).map(String) : []
        lastReportData = {
          id: r.id,
          generatedAt: r.generated_at,
          chiefComplaint,
          score,
          prevScore,
          signed: !!r.signature_hash || !!r.signed_at,
          riskFlags,
          scoreHistory: scoreHistory.slice(0, 5).reverse(),
        }
      }

      // Pendência de revisão (Sprint 1 V1.9.200)
      const pendingReviewCount = reports.filter(r => r.review_status === 'pending').length

      // Última prescrição
      const prescriptions = (prescRes.data || []) as any[]
      let lastPrescriptionData: OverviewData['lastPrescription'] = null
      if (prescriptions[0]) {
        const p = prescriptions[0]
        const meds = Array.isArray(p.medications) ? p.medications : []
        const firstMed = meds[0] || {}
        const summary = firstMed.name || firstMed.medication || firstMed.descricao || p.prescription_type || 'Prescrição emitida'
        lastPrescriptionData = {
          id: p.id,
          summary: String(summary).slice(0, 80),
          status: p.status || 'DRAFT',
          createdAt: p.created_at,
        }
      }

      // Próxima consulta
      const appts = (apptRes.data || []) as any[]
      const nextAppt = appts
        .filter(a => a.appointment_date >= todayISO && !['cancelled', 'canceled', 'completed'].includes(a.status))
        .sort((a, b) => `${a.appointment_date} ${a.appointment_time || ''}`.localeCompare(`${b.appointment_date} ${b.appointment_time || ''}`))[0]
      const nextAppointmentData: OverviewData['nextAppointment'] = nextAppt ? {
        id: nextAppt.id,
        dateISO: `${nextAppt.appointment_date}${nextAppt.appointment_time ? `T${nextAppt.appointment_time}` : ''}`,
        professionalId: nextAppt.professional_id || null,
        isRemote: !!nextAppt.is_remote || nextAppt.appointment_type === 'video',
      } : null

      // Equipe clínica — distintos profissionais que atenderam o paciente
      const profIds = new Set<string>()
      const apptCountByProf = new Map<string, number>()
      appts.forEach(a => {
        if (a.professional_id) {
          profIds.add(a.professional_id)
          apptCountByProf.set(a.professional_id, (apptCountByProf.get(a.professional_id) || 0) + 1)
        }
      })
      let clinicalTeam: OverviewData['clinicalTeam'] = []
      if (profIds.size > 0) {
        const { data: profs } = await supabase
          .from('users').select('id, name, specialty')
          .in('id', Array.from(profIds))
        if (profs) {
          const sorted = [...profs].map(p => ({
            id: p.id,
            name: p.name || 'Profissional',
            specialty: (p as any).specialty || null,
            appointmentCount: apptCountByProf.get(p.id) || 0,
          })).sort((a, b) => b.appointmentCount - a.appointmentCount)
          clinicalTeam = sorted.map((p, i) => ({
            ...p,
            role: i === 0 ? 'responsible' as const : 'partner' as const,
          }))
        }
      }

      // Contadores por aba
      const tabCounts = {
        aecs: reports.length,
        prescriptions: prescriptions.length,
        exams: examsRes.count || 0,
        appointments: appts.length,
      }

      // DRC stage (extraído do último report, se Nefrologia)
      const drcStage = lastReportData ? String(
        (reports[0]?.content as any)?.drc_stage || (reports[0]?.content as any)?.ckd_stage || ''
      ) || null : null

      setOverviewData({
        lastReport: lastReportData,
        pendingReviewCount,
        lastPrescription: lastPrescriptionData,
        nextAppointment: nextAppointmentData,
        chatCount30d: chatRes.count || 0,
        clinicalTeam,
        tabCounts,
        drcStage,
      })
    } catch (e) {
      console.error('V1.9.281 loadOverviewData erro:', e)
      setOverviewData(null)
    } finally {
      setOverviewLoading(false)
    }
  }

  const loadEvolutions = async (patientId: string) => {
    try {
      setLoadingEvolutions(true)

      const evolutionsList: Evolution[] = []

      // 1. Buscar avaliações clínicas do paciente
      const { data: assessments, error: assessmentsError } = await supabase
        .from('clinical_assessments')
        .select('*')
        .eq('patient_id', patientId)
        .order('created_at', { ascending: false })

      if (!assessmentsError && assessments) {
        assessments.forEach(assessment => {
          // V1.9.487 — distinguir FOLLOW_UP (medico escreveu via Terminal "Nova
          // Evolucao") de outros tipos (TRIAGE/CONSULTA/IMRE). FOLLOW_UP vai
          // pra grupo "doctor-evolution" com Stethoscope azul; outros pra
          // "assessment-other" com Sparkles amber.
          const assessmentType = (assessment as any).assessment_type as string | null
          const isFollowUp = assessmentType === 'FOLLOW_UP'
          const kind: EvolutionKind = isFollowUp ? 'doctor-evolution' : 'assessment-other'
          // Profissional: FOLLOW_UP é o medico que escreveu (doctor_id),
          // outros tipos sao IA Residente (TRIAGE inicial) ou desconhecido
          const doctorIdRef = (assessment as any).doctor_id || (assessment as any).data?.created_by
          evolutionsList.push({
            id: assessment.id,
            date: new Date(assessment.created_at).toLocaleDateString('pt-BR'),
            time: new Date(assessment.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
            type: assessment.status === 'completed' ? 'current' : 'historical',
            content: evolutionContentString((assessment.clinical_report ?? (assessment.data as any)?.clinicalNotes ?? (assessment.data as any)?.investigation) as string, isFollowUp ? 'Evolução clínica' : 'Avaliação clínica realizada'),
            professional: isFollowUp ? (doctorIdRef ? 'Médico' : 'Médico (id n/d)') : 'IA Residente',
            source: 'assessment',
            kind,
            signed: false,
            score: typeof (assessment.data as any)?.scores?.clinical_score === 'number' ? (assessment.data as any).scores.clinical_score : null,
            rawCreatedAt: assessment.created_at,
          })
        })
      }

      // 2. Buscar relatórios clínicos do paciente
      const { data: reports, error: reportsError } = await supabase
        .from('clinical_reports')
        .select('*')
        .eq('patient_id', patientId)
        .order('generated_at', { ascending: false })

      if (!reportsError && reports) {
        reports.forEach(report => {
          // Verificar se já não foi adicionado como avaliação
          const alreadyAdded = evolutionsList.some(e => e.id === report.id)
          if (!alreadyAdded) {
            evolutionsList.push({
              id: report.id,
              date: new Date(report.generated_at).toLocaleDateString('pt-BR'),
              time: new Date(report.generated_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
              type: report.status === 'completed' ? 'current' : 'historical',
              content: typeof report.content === 'string'
                ? report.content
                : (report.content as any)?.investigation || (report.content as any)?.result || 'Relatório clínico gerado',
              professional: (report as any).professional_name || (report.generated_by === 'noa_ai' ? 'IA Residente' : 'Profissional'),
              source: 'report',
              kind: 'aec-report',  // V1.9.487 — sempre AEC (clinical_reports)
              signed: !!(report as any).signature_hash || !!(report as any).signed_at,
              score: typeof (report.content as any)?.scores?.clinical_score === 'number' ? (report.content as any).scores.clinical_score : null,
              rawCreatedAt: report.generated_at,
            })
          }
        })
      }

      // 3. Buscar registros médicos do paciente (prontuário)
      // V1.9.535 — limit aumentado de 20 → 500 pra cobrir Carolina 236 msgs/dia +
      // outros casos extremos. chat_interaction agora agrupado por dia (1 card
      // visual = 1 sessão diária), o ruído visual de 200+ cards individuais sumiu.
      try {
        const { data: medicalRecords, error: recordsError } = await supabase
          .from('patient_medical_records')
          .select('*')
          .eq('patient_id', patientId)
          .order('created_at', { ascending: false })
          .limit(500)

        if (!recordsError && medicalRecords) {
          // V1.9.535 — separa chat_interaction (será agrupado por dia) de outros tipos
          const chatByDay = new Map<string, any[]>()
          const nonChatRecords: any[] = []

          medicalRecords.forEach(record => {
            const recordType = (record as any).record_type as string | null
            if (recordType === 'chat_interaction') {
              const dayKey = new Date(record.created_at).toLocaleDateString('pt-BR')
              if (!chatByDay.has(dayKey)) chatByDay.set(dayKey, [])
              chatByDay.get(dayKey)!.push(record)
            } else {
              nonChatRecords.push(record)
            }
          })

          // Non-chat records mantém pattern 1 card = 1 record
          nonChatRecords.forEach(record => {
            const alreadyAdded = evolutionsList.some(e => e.id === record.id)
            if (!alreadyAdded) {
              evolutionsList.push({
                id: record.id,
                date: new Date(record.created_at).toLocaleDateString('pt-BR'),
                time: new Date(record.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
                type: 'historical',
                content: evolutionContentString(
                  typeof record.record_data === 'string' ? record.record_data : ((record.record_data as any)?.content ?? (record.record_data as any)?.summary),
                  'Registro médico'
                ),
                professional: typeof (record.record_data as any)?.professional_name === 'string' ? (record.record_data as any).professional_name : 'Sistema',
                source: 'record',
                kind: 'assessment-other',
                signed: false,
                score: null,
                rawCreatedAt: record.created_at,
              })
            }
          })

          // Chat_interaction: 1 card sintético por DIA (não por turno)
          chatByDay.forEach((records, dayKey) => {
            const sorted = records.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
            const first = sorted[0]
            const last = sorted[sorted.length - 1]
            const firstTime = new Date(first.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
            const lastTime = new Date(last.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
            const count = sorted.length
            const groupId = `chat-day-${patientId}-${dayKey.replace(/\//g, '-')}`
            const summaryContent = count === 1
              ? 'Conversa com a Nôa'
              : `Conversa com a Nôa · ${count} mensagens (${firstTime} - ${lastTime})`

            evolutionsList.push({
              id: groupId,
              date: dayKey,
              time: lastTime,
              type: 'historical',
              content: summaryContent,
              professional: 'Paciente↔Nôa',
              source: 'record',
              kind: 'chat-ia',
              signed: false,
              score: null,
              rawCreatedAt: last.created_at,
              chatGroupIds: sorted.map(r => r.id),
              chatGroupCount: count,
              chatGroupFirstTime: firstTime,
              chatGroupLastTime: lastTime,
            })
          })
        } else if (recordsError?.code === 'PGRST301' || (recordsError as { status?: number })?.status === 403) {
          // RLS: profissional pode não ter vínculo com o paciente; evoluções de clinical_reports/assessments já foram carregadas
          console.warn('patient_medical_records: acesso negado (403) para este paciente. Verifique RLS / is_professional_patient_link.', recordsError)
        }
      } catch (recordsErr) {
        // Tabela pode não existir ou outro erro, não é crítico
        console.warn('Tabela patient_medical_records não disponível:', recordsErr)
      }

      // Ordenar por data (mais recente primeiro)
      evolutionsList.sort((a, b) => {
        const dateA = new Date(`${a.date} ${a.time} `)
        const dateB = new Date(`${b.date} ${b.time} `)
        return dateB.getTime() - dateA.getTime()
      })

      setEvolutions(evolutionsList)
      console.log('✅ Evoluções carregadas:', evolutionsList.length)
    } catch (error) {
      console.error('Erro ao carregar evoluções:', error)
    } finally {
      setLoadingEvolutions(false)
    }
  }

  const filteredPatients = patients.filter(patient => {
    // 1. Filtro de Busca (Nome, CPF, Código)
    const matchesSearch = 
      patient.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      patient.cpf?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      patient.code.toLowerCase().includes(searchTerm.toUpperCase())
    
    if (!matchesSearch) return false

    // V1.9.508 — Filtros Specialty + Clinic + Sala removidos (overhead visual sem
    // utilidade real). RLS ja filtra: admin ve todos, profissional ve so dele.
    // Search por nome cobre 100% casos de uso.

    return true
  })

  const handleSelectPatient = (patient: Patient) => {
    setSelectedPatient(patient)
    setActiveTab('overview')
    // V1.9.462: colapsa lista mobile ao selecionar paciente (UX: dá espaço pro detalhe)
    setShowPatientListMobile(false)
    // V1.9.281: paralelizar fetch da timeline + overview elite. Pattern V1.9.209.
    void Promise.all([
      loadEvolutions(patient.id),
      loadOverviewData(patient.id),
    ])
  }

  const handleOpenPatientChat = async () => {
    if (!user?.id || !selectedPatient?.id) return

    setOpeningChat(true)
    try {
      let targetRoomId: string | undefined

      const { data: patientRooms, error: roomsError } = await supabase
        .from('chat_participants')
        .select('room_id, chat_rooms!inner(id, type)')
        .eq('user_id', selectedPatient.id)
        .eq('chat_rooms.type', 'patient')
        .limit(1)

      if (!roomsError && patientRooms?.length) {
        targetRoomId = patientRooms[0].room_id
      } else {
        // Usar função RPC que valida user_id e contorna problemas de foreign key
        const { data: roomId, error: roomError } = await supabase.rpc(
          'create_chat_room_for_patient_uuid',
          {
            p_patient_id: selectedPatient.id,
            p_patient_name: selectedPatient.name || null,
            p_professional_id: user.id
          }
        )

        if (roomError) {
          // Fallback direto se RPC falhar
          console.warn('Erro ao usar função RPC, tentando método direto:', roomError)

          const { data: newRoom, error: directRoomError } = await supabase
            .from('chat_rooms')
            .insert({
              name: `Canal de cuidado • ${selectedPatient.name}`,
              type: 'patient',
              created_by: user.id
            })
            .select('id')
            .single()

          if (directRoomError || !newRoom) {
            throw directRoomError ?? new Error('Não foi possível criar a sala clínica do paciente')
          }

          targetRoomId = newRoom.id

          await supabase
            .from('chat_participants')
            .upsert(
              [
                { room_id: newRoom.id, user_id: selectedPatient.id, role: 'patient' },
                { room_id: newRoom.id, user_id: user.id, role: 'professional' }
              ],
              { onConflict: 'room_id,user_id' }
            )
        } else {
          targetRoomId = roomId
        }
      }

      if (!targetRoomId) {
        throw new Error('Canal do paciente não encontrado')
      }

      // Garantir que o profissional está como participante da sala
      await supabase
        .from('chat_participants')
        .upsert(
          [{ room_id: targetRoomId, user_id: user.id, role: 'professional' }],
          { onConflict: 'room_id,user_id' }
        )

      await new Promise(resolve => setTimeout(resolve, 300))

      navigate(`/app/clinica/paciente/chat-profissional?origin=professional-dashboard&roomId=${targetRoomId}`)
    } catch (error) {
      console.error('Erro ao abrir chat clínico do paciente:', error)
      navigate('/app/clinica/paciente/chat-profissional?origin=professional-dashboard')
    } finally {
      setOpeningChat(false)
    }
  }

  const handleSaveEvolution = async () => {
    if (!selectedPatient || !evolutionContent.trim()) {
      toast.warning('Campo obrigatório', 'Preencha o campo de evolução antes de salvar.')
      return
    }

    if (!user?.id) {
      toast.error('Sessão expirada', 'Faça login novamente.')
      return
    }

    try {
      // Salvar evolução como avaliação clínica
      const { error, data } = await supabase
        .from('clinical_assessments')
        .insert({
          patient_id: selectedPatient.id,
          doctor_id: user.id, // Incluir doctor_id para profissionais
          assessment_type: 'FOLLOW_UP',
          data: {
            clinicalNotes: evolutionContent,
            type: 'evolution',
            created_by: user.id,
            name: selectedPatient.name,
            cpf: selectedPatient.cpf || null,
            phone: selectedPatient.phone || null
          },
          clinical_report: evolutionContent,
          status: 'completed'
        })
        .select()

      if (error) {
        console.error('Erro ao salvar evolução:', error)
        console.error('Detalhes do erro:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        })
        toast.error('Erro ao salvar evolução', error.message || 'Tente novamente.')
        return
      }

      console.log('✅ Evolução salva com sucesso:', data)

      // Recarregar evoluções
      await loadEvolutions(selectedPatient.id)
      setShowNewEvolution(false)
      setEvolutionContent('')
      toast.success('Evolução salva com sucesso!')
    } catch (error: any) {
      console.error('Erro ao salvar evolução:', error)
      toast.error('Erro ao salvar evolução', error.message || 'Tente novamente.')
    }
  }

  // V1.9.326 — handleUploadFiles legado removido (bucket "medical-files" inexistente + path malformado).
  // Substituído por ProfessionalPatientFiles renderizado na aba "files" com fluxo completo via patient_documents.

  return (
    <div className={`${embedded ? 'h-full w-full' : 'min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900'}`}>
      {/* Header - Only show if not embedded */}
      {!embedded && (
        <div className="bg-slate-800/50 border-b border-slate-700/50 backdrop-blur-sm sticky top-0 z-50">
          <div className="w-full max-w-[98%] mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <button
                  onClick={handleBack}
                  className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
                >
                  <ArrowLeft className="w-5 h-5 text-white" />
                </button>
                <div>
                </div>
              </div>
              <div className="new-patient-menu-container">
                <button
                  ref={newPatientBtnRef}
                  onClick={() => setShowNewPatientMenu(!showNewPatientMenu)}
                  className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-lg hover:from-blue-600 hover:to-cyan-600 transition-colors"
                >
                  <UserPlus className="w-5 h-5" />
                  <span>Novo Paciente</span>
                </button>
                {/* V1.9.440-A — dropdown movido pra Portal global (fim do return) */}
              </div>
            </div>
          </div>
        </div>
      )}
      <div className="w-full max-w-full mx-auto px-1 md:px-2 py-2">
        {/* V1.9.509 — Header superior eliminado (feedback Pedro 30/05 03h54):
            Botoes Voltar + Novo Paciente migraram pro header do sidebar de pacientes.
            Sem mais barra superior ocupando espaco vertical com botao solto. */}

        <div className={`grid grid-cols-1 gap-4 ${detailOnly ? 'lg:grid-cols-1' : 'lg:grid-cols-5'}`}>
          {/* Patients List - oculto no modo detailOnly */}
          {!detailOnly && (
            <div className="lg:col-span-1">
              <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700/50">
                {/* V1.9.509 — Header sidebar absorveu Voltar + Novo Paciente (feedback Pedro 30/05).
                    Substituiu o <button toggle> por <div> com 3 elementos clicaveis (HTML valido).
                    Mobile mantem toggle expand/collapse via tap no titulo.
                    V1.9.119-G: header compacto + contador inline preservado. */}
                <div className="w-full p-2 border-b border-slate-700 flex items-center gap-2">
                  <button
                    onClick={handleBack}
                    className="p-1.5 hover:bg-slate-700 rounded-lg transition-all hover:scale-105 shrink-0"
                    title="Voltar"
                    type="button"
                  >
                    <ArrowLeft className="w-4 h-4 text-white" />
                  </button>

                  <button
                    type="button"
                    onClick={() => setShowPatientListMobile(prev => !prev)}
                    className="flex-1 min-w-0 flex items-center gap-2 px-1.5 py-1 hover:bg-slate-800/40 lg:hover:bg-transparent rounded transition-colors lg:cursor-default"
                    aria-expanded={showPatientListMobile}
                    aria-controls="patient-list-collapsible"
                  >
                    <h3 className="text-sm font-semibold text-white truncate">
                      {selectedPatient ? selectedPatient.name : 'Pacientes Ativos'}
                    </h3>
                    <span className="text-xs text-slate-400 bg-slate-900/60 px-2 py-0.5 rounded-md font-mono flex-shrink-0">
                      {filteredPatients.length}/{patients.length}
                    </span>
                    <ChevronDown
                      className={`w-4 h-4 text-slate-400 transition-transform lg:hidden flex-shrink-0 ml-auto ${showPatientListMobile ? 'rotate-180' : ''}`}
                    />
                  </button>

                  <div className="new-patient-menu-container shrink-0">
                    <button
                      ref={newPatientBtnRef}
                      onClick={() => setShowNewPatientMenu(!showNewPatientMenu)}
                      className="flex items-center justify-center gap-1 px-2.5 py-1.5 bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-500/30 rounded-lg transition-colors text-xs font-semibold"
                      title="Cadastrar novo paciente"
                      type="button"
                    >
                      <UserPlus className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">Novo</span>
                    </button>
                    {/* V1.9.440-A — dropdown movido pra Portal global (fim do return).
                        V1.9.512: cor alinhada com paleta dark/glass V1.9.510 (era gradient azul-cyan fora do padrao). */}
                  </div>
                </div>
                {/* V1.9.507 — Search migrou do header pro topo do sidebar (UX Notion/Linear style).
                    Fica colado na lista filtravel, sempre visivel em desktop, dentro do collapse em mobile. */}
                <div className={`p-2 border-b border-slate-700/50 ${showPatientListMobile ? '' : 'hidden lg:block'}`}>
                  <div className="relative">
                    <Search className="absolute left-2.5 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                    <input
                      type="text"
                      placeholder="Buscar paciente..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-9 pr-3 py-1.5 bg-slate-900/60 border border-slate-700 rounded-lg text-white text-sm placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
                    />
                  </div>
                </div>
                <div
                  id="patient-list-collapsible"
                  className={`max-h-[calc(100vh-360px)] overflow-y-auto ${showPatientListMobile ? '' : 'hidden lg:block'}`}
                >
                  {loading ? (
                    <div className="p-4 text-center text-slate-400">
                      <Clock className="w-7 h-7 mx-auto mb-2 animate-spin" />
                      <p className="text-xs">Carregando pacientes...</p>
                    </div>
                  ) : filteredPatients.length === 0 ? (
                    <div className="p-4 text-center text-slate-400">
                      <User className="w-7 h-7 mx-auto mb-2 text-slate-600" />
                      <p className="text-xs">Nenhum paciente encontrado</p>
                      <p className="text-[10px] text-slate-500 mt-1">Use o filtro acima pra refinar</p>
                    </div>
                  ) : (
                    filteredPatients.map(patient => (
                      <button
                        key={patient.id}
                        onClick={() => handleSelectPatient(patient)}
                        className={`w-full p-2.5 text-left border-b border-slate-700/60 transition-all duration-150 ${selectedPatient?.id === patient.id
                          ? 'bg-emerald-500/10 border-l-2 border-l-emerald-500'
                          : 'hover:bg-slate-700/40 hover:border-l-2 hover:border-l-slate-600'
                          }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 transition-all ${selectedPatient?.id === patient.id ? 'bg-emerald-500 ring-2 ring-emerald-500/30' : 'bg-slate-700'}`}>
                            {patient.photo ? (
                              <img src={patient.photo} alt={patient.name} className="w-9 h-9 rounded-full" />
                            ) : (
                              <User className={`w-4 h-4 ${selectedPatient?.id === patient.id ? 'text-slate-950' : 'text-slate-400'}`} />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className={`font-semibold text-sm truncate ${selectedPatient?.id === patient.id ? 'text-emerald-300' : 'text-white'}`}>{patient.name}</p>
                            <p className="text-[10px] text-slate-500 truncate font-mono">#{patient.code}</p>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <span className="text-[10px] text-slate-400 bg-slate-900 px-1.5 py-0.5 rounded uppercase font-semibold tracking-wide">
                                {patient.appointmentsCount} atend.
                              </span>
                              {patient.absences > 0 && (
                                <span className="text-[10px] text-red-400 bg-red-500/10 px-1.5 py-0.5 rounded uppercase font-semibold tracking-wide">
                                  {patient.absences} faltas
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </button>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Patient Details - Main Content (ou única coluna no detailOnly) */}
          <div className={detailOnly ? 'w-full' : 'lg:col-span-4'}>
            {/* detailOnly: loading até o paciente ser carregado; senão mesma lógica de abas */}
            {detailOnly && preselectedPatientId && !selectedPatient ? (
              <div className="flex items-center justify-center py-20">
                <div className="text-center">
                  <Clock className="w-12 h-12 mx-auto mb-3 text-slate-500 animate-spin" />
                  <p className="text-slate-400">Carregando prontuário...</p>
                </div>
              </div>
            ) : !detailOnly && activeTab === 'appointments' && !selectedPatient ? (
              <div className="space-y-6">
                {/* Agendamentos */}
                <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700/50 p-6">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h3 className="text-xl font-bold text-white mb-2 flex items-center space-x-2">
                        <Calendar className="w-5 h-5 text-green-400" />
                        <span>Agendamentos</span>
                      </h3>
                      <p className="text-slate-400">Gerencie agendamentos e visualize sua agenda completa</p>
                    </div>
                    <button
                      onClick={() => navigate('/app/clinica/profissional/dashboard?section=terminal-clinico&tab=scheduling')}
                      className="flex items-center space-x-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Novo Agendamento</span>
                    </button>
                  </div>

                  {/* KPIs de Agendamentos — dados reais */}
                  <RealAppointmentStats />

                  {/* Agenda de Hoje — dados reais */}
                  <RealAgendaHoje />

                  {/* Ações Rápidas */}
                  <div className="flex flex-wrap gap-3">
                    <button
                      onClick={() => navigate('/app/clinica/profissional/dashboard?section=terminal-clinico&tab=scheduling')}
                      className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Novo Agendamento</span>
                    </button>
                    <button
                      onClick={() => navigate('/app/clinica/profissional/dashboard?section=atendimento')}
                      className="flex items-center space-x-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
                    >
                      <Calendar className="w-4 h-4" />
                      <span>Ver Agenda Completa</span>
                    </button>
                  </div>
                </div>
              </div>
            ) : selectedPatient ? (
              <div className="space-y-6">
                {detailOnly && onBack && !hideBackButton && (
                  <div className="flex items-center gap-2 mb-2">
                    <button
                      type="button"
                      onClick={onBack}
                      className="flex items-center gap-1.5 text-slate-400 hover:text-white text-sm font-medium"
                    >
                      <ArrowLeft className="w-4 h-4" />
                      Voltar à seleção
                    </button>
                  </div>
                )}
                {/* V1.9.119-F: Patient Header redesign — compacto + dados clinicos relevantes + metricas inline */}
                <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-4 border border-slate-700/50">
                  <div className="flex items-start justify-between gap-4 flex-wrap">
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div className="w-14 h-14 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full flex items-center justify-center shrink-0">
                        {selectedPatient.photo ? (
                          <img src={selectedPatient.photo} alt={selectedPatient.name} className="w-14 h-14 rounded-full" />
                        ) : (
                          <User className="w-7 h-7 text-white" />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <h2 className="text-xl font-bold text-white tracking-tight truncate">{selectedPatient.name}</h2>
                        <div className="flex items-center gap-2 mt-0.5 text-sm font-medium text-slate-400 flex-wrap">
                          {selectedPatient.birthDate ? (
                            <span className="text-slate-300">{selectedPatient.age} anos</span>
                          ) : (
                            <span className="text-slate-500 italic">Idade não informada</span>
                          )}
                          <span className="opacity-30">•</span>
                          <span className="text-emerald-400 font-mono text-xs">#{selectedPatient.code}</span>
                          {selectedPatient.cpf && (
                            <>
                              <span className="opacity-30">•</span>
                              <span className="text-slate-400 text-xs">CPF: {selectedPatient.cpf}</span>
                            </>
                          )}
                          {selectedPatient.phone && selectedPatient.phone !== 'Não informado' && (
                            <>
                              <span className="opacity-30">•</span>
                              <span className="text-slate-400 text-xs flex items-center gap-1">
                                <Phone className="w-3 h-3 text-emerald-500" />
                                {selectedPatient.phone}
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 shrink-0">
                      <button
                        onClick={() => setActiveTab('analytics')}
                        className="px-3 py-1.5 bg-amber-500/20 text-amber-300 border border-amber-500/40 rounded-lg hover:bg-amber-500/30 transition-colors flex items-center gap-1.5 text-xs font-medium"
                      >
                        <BarChart3 className="w-3.5 h-3.5" />
                        Analytics
                      </button>
                      {/* V1.9.510 — Cores dark/glass alinhadas com padrao Analytics (linha 1650).
                          Antes: verde puro (Nova Evolucao) + primary verde (Chat) fora do padrao app.
                          Agora: emerald-500/20 + blue-500/20 com border sutil (sofisticado dark). */}
                      <button
                        onClick={() => {
                          setActiveTab('evolution')
                          setShowNewEvolution(true)
                        }}
                        className="px-3 py-1.5 bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 rounded-lg hover:bg-emerald-500/30 transition-colors text-xs font-medium"
                      >
                        + Nova Evolução
                      </button>
                      {/* [V1.9.360] Removido botão "Similares" do header (poluía com 3 botões) */}
                      {/* Casos Similares agora é aba dedicada (label: "Similares", ícone Sparkles roxo) */}
                      <button
                        onClick={handleOpenPatientChat}
                        disabled={openingChat}
                        className={`px-3 py-1.5 rounded-lg transition-colors text-xs font-medium border ${openingChat
                          ? 'bg-blue-500/10 text-blue-400/60 border-blue-500/20 cursor-wait'
                          : 'bg-blue-500/20 text-blue-300 border-blue-500/40 hover:bg-blue-500/30'
                          }`}
                      >
                        {openingChat ? 'Abrindo...' : '💬 Chat'}
                      </button>
                    </div>
                  </div>

                  {/* V1.9.282 (Pedro 14/05): Alergias/Medicações/Sangue movidos do header pra DENTRO da Visão Geral
                      (info salva-vidas merece destaque na primeira tela da aba, não escondida no header). */}

                  {/* V1.9.511 — Metricas Atendimentos/Faltas/Servicos movidas pra DEPOIS das tabs
                      (feedback Pedro 30/05 04h). Aparece logo abaixo das tabs em qualquer aba ativa. */}
                </div>

                {/* Tabs - Apenas quando há paciente selecionado */}
                {selectedPatient && (
                  <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700/50">
                    {/* V1.9.119-I: tabs compactas + scroll visivel + gradiente fade direito indicando mais conteudo */}
                    <div className="border-b border-slate-700 relative">
                      <div className="flex overflow-x-auto gap-1 p-2 md:p-2.5 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-slate-700" style={{ WebkitOverflowScrolling: 'touch' }}>
                        {[
                          { id: 'overview', label: 'Visão Geral', icon: Activity },
                          { id: 'analytics', label: 'Analytics', icon: BarChart3 },
                          { id: 'evolution', label: 'Evolução', icon: FileText },
                          { id: 'prescription', label: 'Prescrição', icon: Edit },
                          { id: 'exams', label: 'Exames', icon: FileText },
                          { id: 'appointments', label: 'Agenda', icon: Calendar },
                          { id: 'files', label: 'Arquivos', icon: Archive },
                          { id: 'receipts', label: 'Recebimentos', icon: Download },
                          { id: 'charts', label: 'Gráficos', icon: TrendingUp }
                          // [V1.9.362] Removida aba "Similares" (decisão Pedro 18/05 ~18h05 —
                          // Casos Similares fica APENAS no Terminal de Pesquisa, foco 1 lugar)
                        ].map(tab => {
                          const Icon = tab.icon
                          return (
                            <button
                              key={tab.id}
                              onClick={() => setActiveTab(tab.id as any)}
                              className={`flex items-center gap-1.5 px-2.5 md:px-3.5 py-1.5 md:py-2 rounded-lg transition-all font-medium text-xs md:text-sm whitespace-nowrap shrink-0 ${activeTab === tab.id
                                ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                                : 'text-slate-400 hover:text-white hover:bg-slate-700/50 border border-transparent'
                                }`}
                            >
                              <Icon className="w-3.5 h-3.5" />
                              <span>{tab.label}</span>
                            </button>
                          )
                        })}
                      </div>
                      {/* Gradiente fade direito indicando que tem mais tabs (scroll horizontal) */}
                      <div className="absolute right-0 top-0 bottom-0 w-12 bg-gradient-to-l from-slate-800/70 to-transparent pointer-events-none rounded-tr-xl" />
                    </div>

                    {/* V1.9.511 — Metricas Atendimentos/Faltas/Servicos abaixo das tabs (feedback Pedro 30/05). */}
                    <div className="px-4 sm:px-6 pt-3 pb-2 border-b border-slate-700/50 flex items-center gap-4 text-xs flex-wrap">
                      <div className="flex items-center gap-1.5">
                        <span className="text-slate-500 uppercase tracking-wider font-semibold">Atendimentos</span>
                        <span className="text-white font-bold text-base">{selectedPatient.appointmentsCount}</span>
                      </div>
                      <span className="text-slate-700">|</span>
                      <div className="flex items-center gap-1.5">
                        <span className="text-slate-500 uppercase tracking-wider font-semibold">Faltas</span>
                        <span className="text-white font-bold text-base">{selectedPatient.absences}</span>
                      </div>
                      <span className="text-slate-700">|</span>
                      <div className="flex items-center gap-1.5">
                        <span className="text-slate-500 uppercase tracking-wider font-semibold">Serviços</span>
                        <span className="text-white font-bold text-base">{selectedPatient.servicesCount}</span>
                      </div>
                    </div>

                    {/* Tab Content */}
                    <div className="p-4 sm:p-6 w-full max-w-full overflow-x-hidden">
                      {activeTab === 'analytics' && (
                        <div className="min-w-0">
                          <PatientAnalytics
                            reports={analyticsReports}
                            loading={analyticsReportsLoading}
                            user={{ id: selectedPatient.id, name: selectedPatient.name } as any}
                            appointments={analyticsAppointments}
                            patientPrescriptions={analyticsPrescriptions}
                            patientPrescriptionsLoading={analyticsPrescriptionsLoading}
                            isProfessionalView
                          />
                        </div>
                      )}
                      {activeTab === 'overview' && (
                        <div className="space-y-3">
                          {/* V1.9.281 — Visão Geral elite escalável. ACDSS removido daqui (mock-data risk, mesma razão V1.9.203).
                              Princípio: entregar todo valor clínico que a plataforma tem na primeira aba. */}

                          {/* BLOCO 1: Banner pendência Sprint 1 — só renderiza se há AEC aguardando revisão */}
                          {overviewData && overviewData.pendingReviewCount > 0 && (
                            <button
                              onClick={() => setActiveTab('evolution')}
                              className="w-full bg-amber-500/10 border border-amber-500/30 rounded-lg p-3 flex items-center justify-between hover:bg-amber-500/15 transition-colors group"
                            >
                              <div className="flex items-center gap-2.5">
                                <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
                                <span className="text-sm text-amber-200 font-medium">
                                  {overviewData.pendingReviewCount} avaliação(ões) aguardando sua revisão
                                </span>
                              </div>
                              <span className="text-xs text-amber-300 group-hover:translate-x-0.5 transition-transform">Revisar →</span>
                            </button>
                          )}

                          {/* V1.9.510 — BLOCOS 1.5 + 2 lado a lado quando ambos visiveis (feedback Pedro 30/05).
                              Wrapper condicional: grid 2 colunas quando Dados Clinicos Criticos aparece,
                              senao Ultima Avaliacao Clinica ocupa full-width sozinha. */}
                          <div className={(selectedPatient.allergies || selectedPatient.medications || selectedPatient.bloodType) ? "grid grid-cols-1 md:grid-cols-2 gap-3" : ""}>
                            {/* BLOCO 1.5: Dados Clínicos Críticos (V1.9.282) */}
                            {(selectedPatient.allergies || selectedPatient.medications || selectedPatient.bloodType) && (
                              <div className="bg-gradient-to-r from-amber-500/8 via-slate-800/30 to-rose-500/8 border border-amber-500/25 rounded-xl p-3 space-y-1.5">
                                <div className="flex items-center gap-1.5 mb-1">
                                  <AlertCircle className="w-3.5 h-3.5 text-amber-400" />
                                  <p className="text-[10px] font-bold text-amber-200 uppercase tracking-wider">Dados Clínicos Críticos</p>
                                </div>
                                {selectedPatient.allergies && (
                                  <div className="flex items-start gap-2 text-xs">
                                    <span className="text-amber-400 font-bold shrink-0">⚠️ Alergias:</span>
                                    <span className="text-slate-200">{selectedPatient.allergies}</span>
                                  </div>
                                )}
                                {selectedPatient.medications && (
                                  <div className="flex items-start gap-2 text-xs">
                                    <span className="text-blue-400 font-bold shrink-0">💊 Medicações em curso:</span>
                                    <span className="text-slate-200">{selectedPatient.medications}</span>
                                  </div>
                                )}
                                {selectedPatient.bloodType && (
                                  <div className="flex items-start gap-2 text-xs">
                                    <span className="text-rose-400 font-bold shrink-0">🩸 Tipo sanguíneo:</span>
                                    <span className="text-slate-200">{selectedPatient.bloodType}</span>
                                  </div>
                                )}
                              </div>
                            )}

                          {/* BLOCO 2: Última Avaliação Clínica — card destaque com queixa, score, sparkline, alertas */}
                          {overviewLoading ? (
                            <div className="bg-slate-700/30 rounded-xl p-4 border border-slate-700/50 animate-pulse">
                              <div className="h-3 bg-slate-700 rounded w-1/3 mb-3"></div>
                              <div className="h-4 bg-slate-700 rounded w-2/3 mb-2"></div>
                              <div className="h-3 bg-slate-700 rounded w-1/2"></div>
                            </div>
                          ) : overviewData?.lastReport ? (
                            <div className="bg-gradient-to-br from-emerald-500/8 via-slate-800/40 to-blue-500/8 border border-emerald-500/25 rounded-xl p-4">
                              <div className="flex items-start justify-between gap-3 mb-2.5">
                                <div className="flex items-center gap-2 min-w-0">
                                  <Target className="w-4 h-4 text-emerald-400 shrink-0" />
                                  <h3 className="text-sm font-bold text-white">Última Avaliação Clínica</h3>
                                  {overviewData.lastReport.signed && (
                                    <span className="px-1.5 py-0.5 rounded text-[9px] font-black uppercase bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-0.5">
                                      <CheckCircle className="w-2.5 h-2.5" />
                                      ICP
                                    </span>
                                  )}
                                </div>
                                <span className="text-[11px] text-slate-400 shrink-0">
                                  {new Date(overviewData.lastReport.generatedAt).toLocaleDateString('pt-BR')} • {new Date(overviewData.lastReport.generatedAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                                </span>
                              </div>

                              <p className="text-sm text-slate-200 leading-relaxed mb-3 line-clamp-2">
                                <span className="text-slate-500 text-xs uppercase tracking-wider font-bold mr-1.5">Queixa:</span>
                                {overviewData.lastReport.chiefComplaint}
                              </p>

                              <div className="flex items-center gap-3 flex-wrap mb-2">
                                {overviewData.lastReport.score !== null && (
                                  <div className="flex items-center gap-1.5">
                                    <span className="text-[10px] uppercase font-bold text-slate-500">Score</span>
                                    <span className="text-base font-bold text-white">{overviewData.lastReport.score}</span>
                                    {overviewData.lastReport.prevScore !== null && (() => {
                                      const delta = (overviewData.lastReport.score ?? 0) - overviewData.lastReport.prevScore
                                      const sign = delta > 0 ? '+' : ''
                                      const cls = delta > 0 ? 'text-emerald-400' : delta < 0 ? 'text-rose-400' : 'text-slate-400'
                                      return <span className={`text-[11px] font-bold ${cls}`}>({sign}{delta})</span>
                                    })()}
                                  </div>
                                )}
                                {/* Sparkline scores — SVG inline, sem dep externa */}
                                {overviewData.lastReport.scoreHistory.length >= 2 && (() => {
                                  const pts = overviewData.lastReport.scoreHistory
                                  const max = Math.max(...pts, 100)
                                  const min = Math.min(...pts, 0)
                                  const range = max - min || 1
                                  const W = 80, H = 20
                                  const step = pts.length > 1 ? W / (pts.length - 1) : W
                                  const path = pts.map((v, i) => `${i === 0 ? 'M' : 'L'} ${(i * step).toFixed(1)} ${(H - ((v - min) / range) * H).toFixed(1)}`).join(' ')
                                  return (
                                    <svg width={W} height={H} className="shrink-0">
                                      <path d={path} fill="none" stroke="rgb(52,211,153)" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
                                    </svg>
                                  )
                                })()}
                                {overviewData.drcStage && (
                                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-cyan-500/15 text-cyan-300 border border-cyan-500/25">
                                    DRC {overviewData.drcStage}
                                  </span>
                                )}
                              </div>

                              {overviewData.lastReport.riskFlags.length > 0 && (
                                <div className="mt-2 pt-2 border-t border-amber-500/20 flex items-start gap-1.5">
                                  <AlertCircle className="w-3.5 h-3.5 text-amber-400 mt-0.5 shrink-0" />
                                  <div className="text-xs text-amber-200">
                                    <span className="font-bold uppercase tracking-wider text-[10px] mr-1">Alertas:</span>
                                    {overviewData.lastReport.riskFlags.join(' • ')}
                                  </div>
                                </div>
                              )}
                            </div>
                          ) : (
                            <div className="bg-slate-700/20 rounded-xl p-4 border border-slate-700/40 text-center">
                              <Target className="w-6 h-6 mx-auto mb-1.5 text-slate-600" />
                              <p className="text-sm text-slate-400">Nenhuma avaliação clínica registrada ainda</p>
                              <p className="text-[11px] text-slate-500 mt-0.5">A próxima AEC vai aparecer aqui em destaque</p>
                            </div>
                          )}
                          </div>
                          {/* /V1.9.510 wrapper grid */}

                          {/* BLOCO 3: 4 mini-cards inline — AECs / Prescrição / Próxima Consulta / Chat 30d */}
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                            <div className="bg-slate-700/30 rounded-lg p-3 border border-slate-700/50">
                              <div className="flex items-center gap-1.5 mb-1">
                                <BarChart3 className="w-3.5 h-3.5 text-blue-400" />
                                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">AECs</p>
                              </div>
                              <p className="text-lg font-bold text-white">{overviewData?.tabCounts.aecs ?? '—'}</p>
                              <p className="text-[10px] text-slate-500">total registradas</p>
                            </div>

                            <div className="bg-slate-700/30 rounded-lg p-3 border border-slate-700/50">
                              <div className="flex items-center gap-1.5 mb-1">
                                <Edit className="w-3.5 h-3.5 text-purple-400" />
                                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Prescrição</p>
                              </div>
                              {overviewData?.lastPrescription ? (
                                <>
                                  <p className="text-xs font-semibold text-white truncate">{overviewData.lastPrescription.summary}</p>
                                  <p className={`text-[10px] font-bold uppercase ${overviewData.lastPrescription.status === 'signed' ? 'text-emerald-400' : 'text-amber-400'}`}>
                                    {overviewData.lastPrescription.status === 'signed' ? '✓ assinada' : '⚠ ' + overviewData.lastPrescription.status}
                                  </p>
                                </>
                              ) : (
                                <p className="text-xs text-slate-500 italic">sem prescrição</p>
                              )}
                            </div>

                            <div className="bg-slate-700/30 rounded-lg p-3 border border-slate-700/50">
                              <div className="flex items-center gap-1.5 mb-1">
                                <Calendar className="w-3.5 h-3.5 text-cyan-400" />
                                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Próx Consulta</p>
                              </div>
                              {overviewData?.nextAppointment ? (() => {
                                const date = new Date(overviewData.nextAppointment.dateISO)
                                const daysAhead = Math.ceil((date.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
                                return (
                                  <>
                                    <p className="text-xs font-semibold text-white">{date.toLocaleDateString('pt-BR')}</p>
                                    <p className="text-[10px] text-slate-400">
                                      {overviewData.nextAppointment.isRemote ? '🎥 vídeo' : '🏥 presencial'}
                                      {daysAhead >= 0 && daysAhead <= 90 ? ` • em ${daysAhead}d` : ''}
                                    </p>
                                  </>
                                )
                              })() : (
                                <p className="text-xs text-slate-500 italic">sem agendamento</p>
                              )}
                            </div>

                            <div className="bg-slate-700/30 rounded-lg p-3 border border-slate-700/50">
                              <div className="flex items-center gap-1.5 mb-1">
                                <Activity className="w-3.5 h-3.5 text-emerald-400" />
                                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Chat 30d</p>
                              </div>
                              <p className="text-lg font-bold text-white">{overviewData?.chatCount30d ?? '—'}</p>
                              <p className="text-[10px] text-slate-500">mensagens</p>
                            </div>
                          </div>

                          {/* BLOCO 4: Equipe Clínica + Resumo das Abas (2 colunas) */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                            {/* Equipe Clínica do paciente */}
                            <div className="bg-slate-700/30 rounded-lg p-3 border border-slate-700/50">
                              <div className="flex items-center gap-1.5 mb-2">
                                <User className="w-3.5 h-3.5 text-indigo-400" />
                                <p className="text-[11px] font-bold text-slate-300 uppercase tracking-wider">Equipe Clínica</p>
                              </div>
                              {overviewData?.clinicalTeam.length ? (
                                <div className="space-y-1.5">
                                  {overviewData.clinicalTeam.slice(0, 3).map(prof => (
                                    <div key={prof.id} className="flex items-center justify-between gap-2">
                                      <div className="min-w-0 flex-1">
                                        <p className="text-xs font-semibold text-white truncate">{prof.name}</p>
                                        <p className="text-[10px] text-slate-400 truncate">
                                          {prof.specialty || 'Profissional'}
                                          {prof.role === 'responsible' && <span className="ml-1 text-emerald-400">• responsável</span>}
                                        </p>
                                      </div>
                                      <span className="text-[10px] text-slate-500 shrink-0">{prof.appointmentCount}x</span>
                                    </div>
                                  ))}
                                  {overviewData.clinicalTeam.length > 3 && (
                                    <p className="text-[10px] text-slate-500 italic pt-0.5">+{overviewData.clinicalTeam.length - 3} outros</p>
                                  )}
                                </div>
                              ) : (
                                <p className="text-xs text-slate-500 italic">Sem equipe vinculada ainda</p>
                              )}
                            </div>

                            {/* Resumo das abas — contadores rápidos clicáveis */}
                            <div className="bg-slate-700/30 rounded-lg p-3 border border-slate-700/50">
                              <div className="flex items-center gap-1.5 mb-2">
                                <FileText className="w-3.5 h-3.5 text-orange-400" />
                                <p className="text-[11px] font-bold text-slate-300 uppercase tracking-wider">Resumo</p>
                              </div>
                              {/* V1.9.511 — Cards Resumo com margem leve (feedback Pedro 30/05).
                                  gap-1 -> gap-2 + bg-slate-800/40 individual + padding maior pra cardificar. */}
                              <div className="grid grid-cols-2 gap-2 text-xs">
                                <button onClick={() => setActiveTab('evolution')} className="text-left flex items-center justify-between px-2.5 py-1.5 rounded-md bg-slate-800/40 border border-slate-700/40 hover:bg-slate-600/30 hover:border-slate-600 transition-colors">
                                  <span className="text-slate-300">🩺 AECs</span>
                                  <span className="text-white font-bold">{overviewData?.tabCounts.aecs ?? '—'}</span>
                                </button>
                                <button onClick={() => setActiveTab('prescription')} className="text-left flex items-center justify-between px-2.5 py-1.5 rounded-md bg-slate-800/40 border border-slate-700/40 hover:bg-slate-600/30 hover:border-slate-600 transition-colors">
                                  <span className="text-slate-300">💊 Prescr</span>
                                  <span className="text-white font-bold">{overviewData?.tabCounts.prescriptions ?? '—'}</span>
                                </button>
                                <button onClick={() => setActiveTab('exams')} className="text-left flex items-center justify-between px-2.5 py-1.5 rounded-md bg-slate-800/40 border border-slate-700/40 hover:bg-slate-600/30 hover:border-slate-600 transition-colors">
                                  <span className="text-slate-300">🧪 Exames</span>
                                  <span className="text-white font-bold">{overviewData?.tabCounts.exams ?? '—'}</span>
                                </button>
                                <button onClick={() => setActiveTab('appointments')} className="text-left flex items-center justify-between px-2.5 py-1.5 rounded-md bg-slate-800/40 border border-slate-700/40 hover:bg-slate-600/30 hover:border-slate-600 transition-colors">
                                  <span className="text-slate-300">📅 Consultas</span>
                                  <span className="text-white font-bold">{overviewData?.tabCounts.appointments ?? '—'}</span>
                                </button>
                              </div>
                            </div>
                          </div>

                          {/* BLOCO 5: Histórico — Timeline tipada (mantém na Visão Geral, evolui com badge por fonte) */}
                          <div className="bg-slate-700/50 rounded-lg p-4">
                            <div className="flex items-center justify-between mb-2">
                              <p className="text-sm text-slate-400 font-semibold">Histórico</p>
                              {evolutions.length > 5 && (
                                <button onClick={() => setActiveTab('evolution')} className="text-[11px] text-emerald-400 hover:text-emerald-300 transition-colors">
                                  ver tudo →
                                </button>
                              )}
                            </div>
                            {loadingEvolutions ? (
                              <div className="text-center text-slate-400 py-4">
                                <Clock className="w-6 h-6 mx-auto mb-2 animate-spin" />
                                <p className="text-sm">Carregando histórico...</p>
                              </div>
                            ) : evolutions.length === 0 ? (
                              <p className="text-slate-300 text-sm">Não há informações para serem exibidas.</p>
                            ) : (
                              <div className="space-y-2 max-h-60 overflow-y-auto">
                                {evolutions.slice(0, 5).map(evolution => {
                                  const sourceLabel = evolution.source === 'report' ? { icon: '📄', label: 'Relatório', cls: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30' }
                                    : evolution.source === 'assessment' ? { icon: '🩺', label: 'AEC', cls: 'bg-blue-500/15 text-blue-300 border-blue-500/30' }
                                    : { icon: '📝', label: 'Registro', cls: 'bg-slate-500/15 text-slate-300 border-slate-500/30' }
                                  // V1.9.389-B (Sprint 2 — F1 revisado, Opção B Pedro 20/05):
                                  // Botão "Estruturar Matrix" inline no card pra QUALQUER relatório assinado (não só <24h).
                                  // Memory: project_visao_final_eixo_pesquisa_19_05 — gap F1 da jornada Pesquisa.
                                  // Reusa rota Matrix existente V1.9.382. NÃO toca AEC/Pipeline/Locks.
                                  // Substitui banner top-level V1.9.389 (revertido) por trigger granular contextual.
                                  const showMatrixCTA = evolution.source === 'report' && evolution.signed && !!selectedPatient?.id
                                  return (
                                    <div
                                      key={evolution.id}
                                      className="bg-slate-700/30 rounded-xl p-3 border border-slate-600/50 hover:border-emerald-500/40 hover:bg-slate-700/50 transition-all"
                                    >
                                      <button
                                        type="button"
                                        onClick={() => {
                                          // V1.9.292: clicar item do histórico → aba Evolução com highlight + auto-scroll
                                          setHighlightEvolutionId(evolution.id)
                                          setActiveTab('evolution')
                                        }}
                                        title="Ver detalhes na aba Evolução"
                                        className="w-full text-left cursor-pointer"
                                      >
                                        <div className="flex items-start justify-between mb-2 gap-2">
                                          <p className="text-[13px] text-slate-200 font-bold">{evolution.date} • {evolution.time}</p>
                                          <div className="flex items-center gap-1.5 shrink-0">
                                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border ${sourceLabel.cls}`}>
                                              <span className="mr-0.5">{sourceLabel.icon}</span>{sourceLabel.label}
                                            </span>
                                            {evolution.signed && (
                                              <span className="px-1.5 py-0.5 rounded text-[9px] font-black uppercase bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                                                ICP
                                              </span>
                                            )}
                                            {typeof evolution.score === 'number' && (
                                              <span className="text-[10px] font-bold text-slate-300">score {evolution.score}</span>
                                            )}
                                          </div>
                                        </div>
                                        <p className="text-sm text-slate-300 line-clamp-2 leading-relaxed mb-1.5">{evolutionContentString(evolution.content, '—')}</p>
                                        <p className="text-[11px] text-slate-500 font-bold uppercase tracking-tight">{evolution.professional}</p>
                                      </button>
                                      {showMatrixCTA && (
                                        <div className="mt-2 pt-2 border-t border-slate-600/30 flex justify-end">
                                          <button
                                            type="button"
                                            onClick={(e) => {
                                              e.stopPropagation()
                                              navigate(`/app/pesquisa/profissional/dashboard?section=noa-matrix&patientId=${selectedPatient!.id}`)
                                            }}
                                            title="Estruturar reflexão deste relatório na Nôa Matrix (chat Z2)"
                                            className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-medium bg-emerald-500/10 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/20 hover:border-emerald-500/50 transition-colors"
                                          >
                                            <Sparkles className="w-3 h-3" />
                                            Estruturar na Matrix
                                          </button>
                                        </div>
                                      )}
                                    </div>
                                  )
                                })}
                                {evolutions.length > 5 && (
                                  <p className="text-xs text-slate-400 text-center pt-2">
                                    ... e mais {evolutions.length - 5} registro(s) na aba "Evolução"
                                  </p>
                                )}
                              </div>
                            )}
                          </div>

                          {/* BLOCO 6: Ações Rápidas — 4 CTAs principais */}
                          <div className="bg-slate-800/40 rounded-lg p-3 border border-slate-700/50">
                            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">Ações Rápidas</p>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-1.5">
                              <button
                                onClick={() => { setActiveTab('evolution'); setShowNewEvolution(true) }}
                                className="flex items-center justify-center gap-1.5 px-2.5 py-2 rounded-lg bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/30 text-blue-300 text-xs font-medium transition-colors"
                              >
                                <Plus className="w-3.5 h-3.5" /> Nova Evolução
                              </button>
                              <button
                                onClick={() => setActiveTab('prescription')}
                                className="flex items-center justify-center gap-1.5 px-2.5 py-2 rounded-lg bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/30 text-purple-300 text-xs font-medium transition-colors"
                              >
                                <Edit className="w-3.5 h-3.5" /> Prescrever
                              </button>
                              <button
                                onClick={() => setActiveTab('appointments')}
                                className="flex items-center justify-center gap-1.5 px-2.5 py-2 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 text-cyan-300 text-xs font-medium transition-colors"
                              >
                                <Calendar className="w-3.5 h-3.5" /> Agendar
                              </button>
                              <button
                                onClick={handleOpenPatientChat}
                                disabled={openingChat}
                                className="flex items-center justify-center gap-1.5 px-2.5 py-2 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-xs font-medium transition-colors disabled:opacity-50"
                              >
                                <Activity className="w-3.5 h-3.5" /> {openingChat ? 'Abrindo...' : 'Chat'}
                              </button>
                            </div>
                          </div>

                          {/* BLOCO 7: Rodapé admin compacto — info administrativa rebaixada (era 4 cards grandes no topo) */}
                          <div className="pt-2 border-t border-slate-700/40 flex items-center gap-2 text-[11px] text-slate-500 flex-wrap">
                            <span><span className="text-slate-600">Esp.</span> {selectedPatient.specialty || '—'}</span>
                            <span className="text-slate-700">•</span>
                            <span><span className="text-slate-600">Sala</span> {selectedPatient.room || '—'}</span>
                            <span className="text-slate-700">•</span>
                            <span><span className="text-slate-600">Unidade</span> {selectedPatient.clinic || '—'}</span>
                            <span className="text-slate-700">•</span>
                            <span><span className="text-slate-600">Encaminhador</span> {selectedPatient.referringDoctor || '—'}</span>
                          </div>
                        </div>
                      )}

                      {activeTab === 'evolution' && (
                        <div className="space-y-4">
                          {showNewEvolution && (
                            <div className="bg-gradient-to-r from-blue-500/10 to-cyan-500/10 border border-blue-500/30 rounded-xl p-6">
                              <h3 className="text-lg font-bold text-white mb-4">Nova Evolução</h3>
                              <div className="space-y-4">
                                <div>
                                  <label className="block text-sm font-medium text-slate-300 mb-2">
                                    Tipo de Evolução
                                  </label>
                                  <select className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-blue-500">
                                    <option value="current">Atual</option>
                                    <option value="historical">Histórico</option>
                                  </select>
                                </div>
                                <div>
                                  <label className="block text-sm font-medium text-slate-300 mb-2">
                                    Evolução
                                  </label>
                                  <textarea
                                    value={evolutionContent}
                                    onChange={(e) => setEvolutionContent(e.target.value)}
                                    rows={6}
                                    placeholder="Digite a evolução... Use @ para modelos e # para tags"
                                    className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-blue-500"
                                  />
                                </div>
                                <div className="flex space-x-3">
                                  <button
                                    onClick={handleSaveEvolution}
                                    className="flex-1 px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-lg hover:from-green-600 hover:to-emerald-600 transition-colors"
                                  >
                                    Salvar Evolução
                                  </button>
                                  <button
                                    onClick={() => setShowNewEvolution(false)}
                                    className="px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-600 transition-colors"
                                  >
                                    Cancelar
                                  </button>
                                </div>
                              </div>
                            </div>
                          )}

                          {loadingEvolutions ? (
                            <div className="text-center text-slate-400 py-8">
                              <Clock className="w-12 h-12 mx-auto mb-3 text-slate-600 animate-spin" />
                              <p>Carregando evoluções...</p>
                            </div>
                          ) : evolutions.length === 0 ? (
                            <div className="text-center text-slate-400 py-8">
                              <FileText className="w-12 h-12 mx-auto mb-3 text-slate-600" />
                              <p>Nenhuma evolução registrada</p>
                            </div>
                          ) : (
                            <div className="space-y-5">
                              {/* V1.9.487 (Camada 1.5) — Agrupamento semantico por kind.
                                  Aplica principio meta "separacao semantica entre fontes"
                                  cristalizado 28/05. Grupos vazios sao omitidos.
                                  Pattern V1.9.482 NoaMatrixView CATEGORY_OF_TYPE replicado. */}
                              {(() => {
                                const grouped = new Map<EvolutionKind, Evolution[]>()
                                for (const k of EVOLUTION_KIND_ORDER) grouped.set(k, [])
                                for (const ev of evolutions) {
                                  const k = (ev.kind ?? 'assessment-other') as EvolutionKind
                                  if (grouped.has(k)) grouped.get(k)!.push(ev)
                                  else grouped.get('assessment-other')!.push(ev)
                                }
                                return EVOLUTION_KIND_ORDER.map((k) => {
                                  const items = grouped.get(k) || []
                                  if (items.length === 0) return null
                                  const meta = EVOLUTION_KIND_META[k]
                                  const Icon = meta.icon
                                  return (
                                    <div key={k} className={`rounded-xl border ${meta.borderClass} ${meta.bgClass} p-3 space-y-3`}>
                                      {/* Header semantico do grupo */}
                                      <div className="flex items-center gap-2 px-1">
                                        <Icon className={`w-4 h-4 ${meta.colorClass} flex-shrink-0`} />
                                        <h4 className={`text-sm font-semibold ${meta.colorClass}`}>{meta.label}</h4>
                                        <span className="text-[10px] text-slate-500 font-normal">
                                          · {items.length}
                                        </span>
                                      </div>
                                      {/* Cards individuais (preserva V1.9.x comportamento) */}
                                      {items.map((evolution) => {
                                        const isHighlighted = highlightEvolutionId === evolution.id
                                        return (
                                          // V1.9.498 (Ricardo 29/05): card vira button — click abre
                                          // EvolutionDetailModal com relatório completo. Preserva
                                          // highlight + ref de scroll-into-view + visual identico.
                                          // role="button" + cursor-pointer + keyboard nav.
                                          <div
                                            key={evolution.id}
                                            ref={isHighlighted ? highlightedEvolutionRef : null}
                                            role="button"
                                            tabIndex={0}
                                            onClick={() => setDetailEvolution(evolution)}
                                            onKeyDown={(e) => {
                                              if (e.key === 'Enter' || e.key === ' ') {
                                                e.preventDefault()
                                                setDetailEvolution(evolution)
                                              }
                                            }}
                                            className={`bg-slate-700/50 rounded-lg p-4 border transition-all cursor-pointer hover:bg-slate-700/70 hover:border-emerald-500/40 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-emerald-500/50 ${isHighlighted
                                              ? 'border-emerald-500 ring-2 ring-emerald-500/40 bg-emerald-500/5 shadow-lg shadow-emerald-900/20'
                                              : 'border-slate-600'
                                              }`}
                                            title="Clique para ver o relatório completo"
                                          >
                                            <div className="flex items-start justify-between mb-2 gap-2">
                                              <div className="min-w-0">
                                                <p className="font-semibold text-white">{evolution.date} • {evolution.time}</p>
                                                <p className="text-xs text-slate-400 truncate">
                                                  <span className={`inline-flex items-center gap-1 ${meta.colorClass}`}>
                                                    <Icon className="w-3 h-3" />
                                                    {meta.shortLabel}
                                                  </span>
                                                  <span className="mx-1 text-slate-600">·</span>
                                                  {evolution.professional}
                                                </p>
                                              </div>
                                              <span className={`px-2 py-1 rounded-full text-xs flex-shrink-0 ${evolution.type === 'current'
                                                ? 'bg-green-500/20 text-green-400'
                                                : 'bg-blue-500/20 text-blue-400'
                                                }`}>
                                                {evolution.type === 'current' ? 'Atual' : 'Histórico'}
                                              </span>
                                            </div>
                                            <p className="text-slate-300 text-sm whitespace-pre-wrap line-clamp-3">{evolutionContentString(evolution.content, '—')}</p>
                                            <div className="flex items-center justify-end mt-2">
                                              <span className="text-[10px] text-slate-500 italic">Clique para abrir relatório completo →</span>
                                            </div>
                                          </div>
                                        )
                                      })}
                                    </div>
                                  )
                                })
                              })()}
                              {/* Lista flat legada removida — substituida por agrupamento V1.9.487 */}
                            </div>
                          )}
                        </div>
                      )}

                      {activeTab === 'prescription' && (
                        <div className="space-y-4 w-full max-w-full overflow-x-hidden">
                          <IntegrativePrescriptions
                            patientId={selectedPatient?.id}
                            patientName={selectedPatient?.name}
                          />
                        </div>
                      )}

                      {activeTab === 'exams' && (
                        <div className="space-y-4 w-full max-w-full overflow-x-hidden">
                          <ExamRequestModule
                            patientId={selectedPatient?.id}
                            patientName={selectedPatient?.name}
                          />
                        </div>
                      )}

                      {activeTab === 'appointments' && (
                        <div className="space-y-4 w-full max-w-full overflow-x-hidden">
                          <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700/50 p-6">
                            <div className="flex items-center justify-between mb-6">
                              <div>
                                <h3 className="text-xl font-bold text-white mb-2 flex items-center space-x-2">
                                  <Calendar className="w-5 h-5 text-green-400" />
                                  <span>Agendamentos</span>
                                </h3>
                                <p className="text-slate-400">Gerencie agendamentos e visualize sua agenda completa</p>
                              </div>
                              <button
                                onClick={() => navigate('/app/clinica/profissional/dashboard?section=terminal-clinico&tab=scheduling')}
                                className="flex items-center space-x-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
                              >
                                <Plus className="w-4 h-4" />
                                <span>Novo Agendamento</span>
                              </button>
                            </div>

                            {/* KPIs e Agenda de Hoje — dados reais */}
                            {/* [V1.9.342] passa selectedPatient.id pra filtrar dentro do prontuário individual */}
                            <RealAppointmentStats patientId={selectedPatient?.id} />
                            <RealAgendaHoje patientId={selectedPatient?.id} />

                            {/* Ações Rápidas */}
                            <div className="flex flex-wrap gap-3">
                              <button
                                onClick={() => navigate('/app/clinica/profissional/dashboard?section=terminal-clinico&tab=scheduling')}
                                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                              >
                                <Plus className="w-4 h-4" />
                                <span>Novo Agendamento</span>
                              </button>
                              <button
                                onClick={() => navigate('/app/clinica/profissional/dashboard?section=atendimento')}
                                className="flex items-center space-x-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
                              >
                                <Calendar className="w-4 h-4" />
                                <span>Ver Agenda Completa</span>
                              </button>
                            </div>
                          </div>
                        </div>
                      )}

                      {activeTab === 'files' && selectedPatient && (
                        // V1.9.326 — substitui placeholder + handleUploadFiles quebrado (bucket medical-files inexistente).
                        // Reusa patient_documents (V1.9.313). RLS: doc do médico é imutável pro paciente (opção A Pedro 17/05).
                        <ProfessionalPatientFiles
                          patientId={selectedPatient.id}
                          patientName={selectedPatient.name}
                        />
                      )}

                      {activeTab === 'receipts' && (
                        <div className="text-center text-slate-400 py-8">
                          <Download className="w-12 h-12 mx-auto mb-3 text-slate-600" />
                          <p>Nenhum recebimento registrado</p>
                        </div>
                      )}

                      {activeTab === 'charts' && selectedPatient && (
                        // V1.9.327 — timeline narrativa mensal derivada de reports+prescrições+appointments+exames.
                        // Substitui placeholder estático. Sem chart lib nova (Pedro opção B 17/05).
                        <PatientClinicalTimeline patientId={selectedPatient.id} />
                      )}

                      {/* [V1.9.362] Aba "Similares" removida do prontuário — fica APENAS no Terminal de Pesquisa */}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-12 border border-slate-700/50 text-center">
                <User className="w-16 h-16 text-slate-600 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-white mb-2">Selecione um Paciente</h3>
                <p className="text-slate-400">Escolha um paciente da lista para visualizar o prontuário</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* [V1.9.360] Modal removido — Casos Similares agora é aba dedicada */}

      {/* V1.9.440 — Modal "Enviar Link de Indicação" (atalho rápido pro menu Novo Paciente) */}
      <QuickReferralModal
        open={showReferralModal}
        onClose={() => setShowReferralModal(false)}
      />

      {/* V1.9.498 (Pedro 29/05 pedido Ricardo) — Modal detalhe de evolução.
          Click em qualquer card da aba Evolução abre relatório completo em-place,
          sem perder contexto do paciente. AEC reports usam RichClinicalReportView
          SOBERANO. FOLLOW_UP/chat-ia usam raw render. */}
      <EvolutionDetailModal
        isOpen={!!detailEvolution}
        evolution={detailEvolution}
        patientName={selectedPatient?.name || null}
        onClose={() => setDetailEvolution(null)}
      />

      {/* V1.9.440-A — Dropdown Novo Paciente via Portal global (escapa stacking
          context dos parents — antes sobrepunha cards abaixo, inviável de usar). */}
      {showNewPatientMenu && newPatientMenuPos && createPortal(
        <div
          className="fixed w-60 bg-slate-800 border border-slate-700 rounded-lg shadow-2xl new-patient-menu-container"
          style={{
            top: `${newPatientMenuPos.top}px`,
            right: `${newPatientMenuPos.right}px`,
            zIndex: 99999,
          }}
        >
          <div className="p-1.5">
            <button
              onClick={() => {
                setShowNewPatientMenu(false)
                navigate('/app/new-patient?mode=manual')
              }}
              className="w-full text-left px-3 py-2 rounded-md hover:bg-slate-700 transition-colors text-white flex items-center gap-2 text-sm"
            >
              <UserPlus className="w-4 h-4 text-emerald-400" />
              <span>Cadastro Manual</span>
            </button>
            <button
              onClick={() => {
                setShowNewPatientMenu(false)
                navigate('/app/new-patient?mode=csv')
              }}
              className="w-full text-left px-3 py-2 rounded-md hover:bg-slate-700 transition-colors text-white flex items-center gap-2 text-sm"
            >
              <FileText className="w-4 h-4 text-blue-400" />
              <span>Importar CSV</span>
            </button>
            {/* V1.9.440-B — "Importar do Banco" + "Arrastar Arquivos" REMOVIDOS
                (anti-overclaim): smoke audit revelou que handleDatabaseImport
                so mostrava alert "requer configuracao backend" + handleDragDrop
                so processava CSV (outros formatos faziam console.log marcando
                sucesso fake). Voltam quando forem implementadas de verdade. */}
            <div className="my-1 border-t border-slate-700/50" />
            <button
              onClick={() => {
                setShowNewPatientMenu(false)
                setShowReferralModal(true)
              }}
              className="w-full text-left px-3 py-2 rounded-md hover:bg-slate-700 transition-colors text-white flex items-center gap-2 text-sm"
            >
              <Link2 className="w-4 h-4 text-[#00E5B2]" />
              <span>Enviar Link de Indicação</span>
            </button>
          </div>
        </div>,
        document.body
      )}
    </div>
  )
}

export default PatientsManagement
