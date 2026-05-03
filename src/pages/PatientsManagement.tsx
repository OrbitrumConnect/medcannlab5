
import React, { useState, useEffect, useCallback } from 'react'
import { useNavigate, useSearchParams, useLocation } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { useUserView } from '../hooks/useUserView'
import { useToast } from '../contexts/ToastContext'
import IntegrativePrescriptions from '../components/IntegrativePrescriptions'
import { ExamRequestModule } from '../components/ExamRequestModule'
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
  BarChart3
} from 'lucide-react'
import { useClinicalGovernance } from '../hooks/useClinicalGovernance'
import { ContextAnalysisCard } from '../components/ClinicalGovernance/ContextAnalysisCard'
import IntegratedGovernanceView from '../components/ClinicalGovernance/IntegratedGovernanceView'
import { mapPatientToContext } from '../lib/clinicalGovernance/utils/patientMapper'
import type { Specialty } from '../lib/clinicalGovernance/utils/specialtyConfigs'
import { clinicalReportService } from '../lib/clinicalReportService'
import PatientAnalytics from '../components/PatientAnalytics'
import { getAllPatients, isAdmin } from '../lib/adminPermissions'

/** Componente: KPIs de agendamento com dados reais */
const RealAppointmentStats = () => {
  const [stats, setStats] = useState({ today: 0, thisWeek: 0, confirmed: 0, pending: 0 })
  useEffect(() => {
    const load = async () => {
      const now = new Date()
      const todayStr = now.toISOString().split('T')[0]
      const weekEnd = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      const { data } = await supabase.from('appointments').select('id, appointment_date, status').gte('appointment_date', todayStr).lte('appointment_date', weekEnd + 'T23:59:59')
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
  }, [])
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
const RealAgendaHoje = () => {
  const [appointments, setAppointments] = useState<any[]>([])
  useEffect(() => {
    const load = async () => {
      const todayStr = new Date().toISOString().split('T')[0]
      const { data } = await supabase
        .from('appointments')
        .select('id, title, appointment_date, appointment_time, status, patient_id, description')
        .gte('appointment_date', todayStr)
        .lte('appointment_date', todayStr + 'T23:59:59')
        .not('status', 'in', '("cancelled","canceled")')
        .order('appointment_date', { ascending: true })
      if (!data?.length) { setAppointments([]); return }
      const patientIds = [...new Set(data.map(a => a.patient_id).filter(Boolean))]
      const { data: users } = await supabase.from('users').select('id, name').in('id', patientIds)
      const nameMap = Object.fromEntries((users || []).map(u => [u.id, u.name]))
      setAppointments(data.map(a => ({ ...a, patient_name: nameMap[a.patient_id] || 'Paciente' })))
    }
    load()
  }, [])

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

interface Evolution {
  id: string
  date: string
  time: string
  type: 'current' | 'historical'
  content: string
  professional: string
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
  const [selectedSpecialty, setSelectedSpecialty] = useState<string>('all')
  const [selectedClinic, setSelectedClinic] = useState<string>('all')
  const [selectedRoom, setSelectedRoom] = useState<string>('indifferent')
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null)
  const [activeTab, setActiveTab] = useState<'overview' | 'evolution' | 'prescription' | 'exams' | 'files' | 'receipts' | 'charts' | 'appointments' | 'analytics'>('overview')
  const [showNewEvolution, setShowNewEvolution] = useState(false)
  const [evolutionContent, setEvolutionContent] = useState('')
  const [patients, setPatients] = useState<Patient[]>([])
  const [loading, setLoading] = useState(true)
  const [evolutions, setEvolutions] = useState<Evolution[]>([])
  const [loadingEvolutions, setLoadingEvolutions] = useState(false)
  const [showNewPatientMenu, setShowNewPatientMenu] = useState(false)
  const [openingChat, setOpeningChat] = useState(false)
  const [analyticsReports, setAnalyticsReports] = useState<any[]>([])
  const [analyticsReportsLoading, setAnalyticsReportsLoading] = useState(false)
  const [analyticsAppointments, setAnalyticsAppointments] = useState<Array<{ id: string; date: string; time: string; professional: string; type: string; status: string }>>([])
  const [analyticsPrescriptions, setAnalyticsPrescriptions] = useState<Array<{ id: string; title: string; status: string; issuedAt?: string; startsAt?: string | null; endsAt?: string | null; professionalName?: string | null }>>([])
  const [analyticsPrescriptionsLoading, setAnalyticsPrescriptionsLoading] = useState(false)

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

    if (tabParam === 'appointments') {
      setActiveTab('appointments')
    } else if (tabParam === 'evolution') {
      setActiveTab('evolution')
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

  const specialties = [
    { id: 'none', name: 'Sem especialidade' },
    { id: 'cannabis', name: 'Cannabis Medicinal' },
    { id: 'nephrology', name: 'Nefrologia' },
    { id: 'pain', name: 'Dor' },
    { id: 'psychiatry', name: 'Psiquiatria' }
  ]

  const [clinics, setClinics] = useState([
    { id: 'all', name: 'Todas as Unidades' },
    { id: 'consultorio-ricardo', name: 'Consultório Dr. Ricardo Valença' },
    { id: 'consultorio-eduardo', name: 'Consultório Dr. Eduardo Faveret' }
  ])

  // Buscar profissionais dinamicamente se for Admin
  useEffect(() => {
    if (isAdmin(user)) {
      const fetchProfessionals = async () => {
        try {
          // Buscar todos os profissionais e admins para povoar a lista de consultórios
          const { data, error } = await supabase
            .from('users')
            .select('id, name')
            .in('type', ['profissional', 'professional', 'admin'])
            .order('name')

          if (!error && data) {
            const dynamicClinics = [
              { id: 'all', name: 'Todas as Unidades' },
              ...data.map(u => ({
                id: u.id,
                name: u.name.startsWith('Dr.') ? `Consultório ${u.name}` : (u.name.startsWith('Consultório') ? u.name : `Consultório ${u.name}`)
              }))
            ]
            
            // Remover duplicatas de nomes (caso existam) e atualizar
            const uniqueClinics = dynamicClinics.filter((clinic, index, self) =>
              index === self.findIndex((c) => c.name === clinic.name)
            )
            
            setClinics(uniqueClinics)
            console.log('✅ Lista de consultórios dinâmica carregada (Admin):', uniqueClinics.length)
          }
        } catch (err) {
          console.error('Erro ao buscar profissionais para o terminal:', err)
        }
      }
      fetchProfessionals()
    } else if (user?.name) {
      // Se não for admin, mostrar apenas o próprio consultório
      setClinics([
        { id: 'all', name: 'Todas as Unidades' },
        { id: user.id || 'me', name: user.name.startsWith('Dr.') ? `Consultório ${user.name}` : `Consultório ${user.name}` }
      ])
    }
  }, [user])

  const rooms = [
    { id: 'indifferent', name: 'Indiferente' },
    { id: 'room-1', name: 'Sala 1' },
    { id: 'room-2', name: 'Sala 2' },
    { id: 'room-3', name: 'Sala 3' }
  ]

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
          evolutionsList.push({
            id: assessment.id,
            date: new Date(assessment.created_at).toLocaleDateString('pt-BR'),
            time: new Date(assessment.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
            type: assessment.status === 'completed' ? 'current' : 'historical',
            content: evolutionContentString((assessment.clinical_report ?? (assessment.data as any)?.clinicalNotes ?? (assessment.data as any)?.investigation) as string, 'Avaliação clínica realizada'),
            professional: 'IA Residente'
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
              professional: (report as any).professional_name || (report.generated_by === 'noa_ai' ? 'IA Residente' : 'Profissional')
            })
          }
        })
      }

      // 3. Buscar registros médicos do paciente (prontuário)
      try {
        const { data: medicalRecords, error: recordsError } = await supabase
          .from('patient_medical_records')
          .select('*')
          .eq('patient_id', patientId)
          .order('created_at', { ascending: false })
          .limit(20)

        if (!recordsError && medicalRecords) {
          medicalRecords.forEach(record => {
            const alreadyAdded = evolutionsList.some(e => e.id === record.id)
            if (!alreadyAdded) {
              evolutionsList.push({
                id: record.id,
                date: new Date(record.created_at).toLocaleDateString('pt-BR'),
                time: new Date(record.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
                type: 'historical',
                content: evolutionContentString(
                  typeof record.record_data === 'string' ? record.record_data : ((record.record_data as any)?.content ?? (record.record_data as any)?.summary ?? (record as any).title),
                  'Registro médico'
                ),
                professional: typeof (record.record_data as any)?.professional_name === 'string' ? (record.record_data as any).professional_name : 'Sistema'
              })
            }
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

    // 2. Filtro de Clínica / Unidade
    if (selectedClinic !== 'all') {
      const targetClinic = clinics.find(c => c.id === selectedClinic)
      if (targetClinic && !patient.clinic.toLowerCase().includes(targetClinic.name.replace('Consultório ', '').toLowerCase())) {
        return false
      }
    }

    // 3. Filtro de Especialidade
    if (selectedSpecialty !== 'all') {
      const targetSpec = specialties.find(s => s.id === selectedSpecialty)
      if (targetSpec && !patient.specialty.toLowerCase().includes(targetSpec.name.toLowerCase())) {
        return false
      }
    }

    // 4. Filtro de Sala
    if (selectedRoom !== 'indifferent') {
      const roomNum = selectedRoom.split('-')[1] // '1' de 'room-1'
      if (!patient.room.toLowerCase().includes(roomNum)) {
        return false
      }
    }

    return true
  })

  const handleSelectPatient = (patient: Patient) => {
    setSelectedPatient(patient)
    setActiveTab('overview')
    // Carregar evoluções do paciente selecionado
    loadEvolutions(patient.id)
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

  const handleUploadFiles = async () => {
    if (!selectedPatient) {
      toast.info('Selecione um paciente primeiro')
      return
    }

    const input = document.createElement('input')
    input.type = 'file'
    input.multiple = true
    input.accept = '.pdf,.jpg,.jpeg,.png,.doc,.docx,.txt'

    input.onchange = async (e) => {
      const files = (e.target as HTMLInputElement).files
      if (!files || files.length === 0) return

      try {
        let uploadedCount = 0
        let errorCount = 0

        for (const file of Array.from(files)) {
          const filePath = `patient - files / ${selectedPatient.id}/${Date.now()}-${file.name}`

          const { error } = await supabase.storage
            .from('medical-files')
            .upload(filePath, file)

          if (error) {
            console.error('Erro upload:', error)
            errorCount++
          } else {
            uploadedCount++
          }
        }

        if (uploadedCount > 0) {
          toast.success('Upload concluído', `${uploadedCount} arquivo(s) enviado(s)${errorCount > 0 ? `. ${errorCount} falharam.` : ''}`)
        } else {
          toast.error('Erro no upload', 'Verifique se o bucket "medical-files" existe no Supabase Storage.')
        }
      } catch (error) {
        console.error('Erro ao fazer upload:', error)
        toast.error('Erro ao enviar arquivos')
      }
    }

    input.click()
  }

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
              <div className="relative new-patient-menu-container">
                <button
                  onClick={() => setShowNewPatientMenu(!showNewPatientMenu)}
                  className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-lg hover:from-blue-600 hover:to-cyan-600 transition-colors"
                >
                  <UserPlus className="w-5 h-5" />
                  <span>Novo Paciente</span>
                </button>

                {showNewPatientMenu && (
                  <div
                    className="fixed top-24 right-6 w-64 bg-slate-800 border border-slate-700 rounded-lg shadow-2xl z-[9999] new-patient-menu-container"
                    style={{ marginTop: '0px' }}
                  >
                    <div className="p-2">
                      <button
                        onClick={() => {
                          setShowNewPatientMenu(false)
                          navigate('/app/new-patient?mode=manual')
                        }}
                        className="w-full text-left px-4 py-2 rounded-lg hover:bg-slate-700 transition-colors text-white flex items-center space-x-2"
                      >
                        <UserPlus className="w-4 h-4" />
                        <span>Cadastro Manual</span>
                      </button>
                      <button
                        onClick={() => {
                          setShowNewPatientMenu(false)
                          navigate('/app/new-patient?mode=csv')
                        }}
                        className="w-full text-left px-4 py-2 rounded-lg hover:bg-slate-700 transition-colors text-white flex items-center space-x-2"
                      >
                        <FileText className="w-4 h-4" />
                        <span>Importar CSV</span>
                      </button>
                      <button
                        onClick={() => {
                          setShowNewPatientMenu(false)
                          navigate('/app/new-patient?mode=database')
                        }}
                        className="w-full text-left px-4 py-2 rounded-lg hover:bg-slate-700 transition-colors text-white flex items-center space-x-2"
                      >
                        <Archive className="w-4 h-4" />
                        <span>Importar do Banco</span>
                      </button>
                      <button
                        onClick={() => {
                          setShowNewPatientMenu(false)
                          navigate('/app/new-patient?mode=drag-drop')
                        }}
                        className="w-full text-left px-4 py-2 rounded-lg hover:bg-slate-700 transition-colors text-white flex items-center space-x-2"
                      >
                        <Upload className="w-4 h-4" />
                        <span>Arrastar Arquivos</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
      <div className="w-full max-w-full mx-auto px-1 md:px-2 py-2">
        {/* V1.9.119-G: Filters Bar compactado (era p-6 mb-4 → p-3 mb-3) */}
        {!detailOnly && (
          <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-3 mb-3 border border-slate-700/50">
            <div className="flex flex-col md:flex-row md:items-center justify-between mb-3 gap-3">
              <div className="flex items-center gap-3">
                <button
                  onClick={handleBack}
                  className="p-1.5 hover:bg-slate-700 rounded-lg transition-all hover:scale-105"
                  title="Voltar"
                >
                  <ArrowLeft className="w-4 h-4 text-white" />
                </button>
                <h2 className="text-base font-semibold text-white">Filtros de Busca</h2>
              </div>

              <div className="relative new-patient-menu-container">
                <button
                  onClick={() => setShowNewPatientMenu(!showNewPatientMenu)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-lg hover:from-blue-600 hover:to-cyan-600 transition-all hover:scale-[1.02] text-sm font-medium shadow-md shadow-blue-900/20"
                  title="Cadastrar novo paciente"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>Novo Paciente</span>
                </button>

                {showNewPatientMenu && (
                  <div
                    className="absolute right-0 mt-2 w-60 bg-slate-800 border border-slate-700 rounded-lg shadow-2xl z-[9999] new-patient-menu-container"
                    style={{ top: '100%' }}
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
                      <button
                        onClick={() => {
                          setShowNewPatientMenu(false)
                          navigate('/app/new-patient?mode=database')
                        }}
                        className="w-full text-left px-3 py-2 rounded-md hover:bg-slate-700 transition-colors text-white flex items-center gap-2 text-sm"
                      >
                        <Archive className="w-4 h-4 text-amber-400" />
                        <span>Importar do Banco</span>
                      </button>
                      <button
                        onClick={() => {
                          setShowNewPatientMenu(false)
                          navigate('/app/new-patient?mode=drag-drop')
                        }}
                        className="w-full text-left px-3 py-2 rounded-md hover:bg-slate-700 transition-colors text-white flex items-center gap-2 text-sm"
                      >
                        <Upload className="w-4 h-4 text-purple-400" />
                        <span>Arrastar Arquivos</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
            {/* V1.9.119-G: filtros mais compactos (gap-4 py-2 → gap-2 py-1.5) */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Buscar por nome, CPF ou código..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 bg-slate-700 border border-slate-600 rounded-lg text-white text-sm placeholder-slate-400 focus:outline-none focus:border-blue-500 transition-colors"
                />
              </div>

              {/* Specialty Filter */}
              <select
                value={selectedSpecialty}
                onChange={(e) => setSelectedSpecialty(e.target.value)}
                className="px-3 py-1.5 bg-slate-700 border border-slate-600 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500 transition-colors"
              >
                <option value="all">Todas as Especialidades</option>
                {specialties.map(spec => (
                  <option key={spec.id} value={spec.id}>{spec.name}</option>
                ))}
              </select>

              {/* Clinic Filter */}
              <select
                value={selectedClinic}
                onChange={(e) => setSelectedClinic(e.target.value)}
                className="px-3 py-1.5 bg-slate-700 border border-slate-600 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500 transition-colors"
              >
                {clinics.map(clinic => (
                  <option key={clinic.id} value={clinic.id}>{clinic.name}</option>
                ))}
              </select>

              {/* Room Filter */}
              <select
                value={selectedRoom}
                onChange={(e) => setSelectedRoom(e.target.value)}
                className="px-3 py-1.5 bg-slate-700 border border-slate-600 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500 transition-colors"
              >
                {rooms.map(room => (
                  <option key={room.id} value={room.id}>{room.name}</option>
                ))}
              </select>
            </div>
          </div>
        )}

        <div className={`grid grid-cols-1 gap-4 ${detailOnly ? 'lg:grid-cols-1' : 'lg:grid-cols-5'}`}>
          {/* Patients List - oculto no modo detailOnly */}
          {!detailOnly && (
            <div className="lg:col-span-1">
              <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700/50">
                {/* V1.9.119-G: header compacto + contador inline (era 2 linhas) */}
                <div className="p-3 border-b border-slate-700 flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-white">Pacientes Ativos</h3>
                  <span className="text-xs text-slate-400 bg-slate-900/60 px-2 py-0.5 rounded-md font-mono">
                    {filteredPatients.length}/{patients.length}
                  </span>
                </div>
                <div className="max-h-[calc(100vh-300px)] overflow-y-auto">
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
                      onClick={() => navigate('/app/scheduling')}
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
                      onClick={() => navigate('/app/scheduling')}
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
                      <button
                        onClick={() => {
                          setActiveTab('evolution')
                          setShowNewEvolution(true)
                        }}
                        className="px-3 py-1.5 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-lg hover:from-green-600 hover:to-emerald-600 transition-colors text-xs font-medium"
                      >
                        + Nova Evolução
                      </button>
                      <button
                        onClick={handleOpenPatientChat}
                        disabled={openingChat}
                        className={`px-3 py-1.5 rounded-lg transition-colors text-xs font-medium ${openingChat
                          ? 'bg-primary-500/60 text-white cursor-wait'
                          : 'bg-primary-500 text-white hover:bg-primary-400'
                          }`}
                      >
                        {openingChat ? 'Abrindo...' : '💬 Chat'}
                      </button>
                    </div>
                  </div>

                  {/* V1.9.119-F: Bloco ATENCOES — alergias + medicacoes (so renderiza se tem dado) */}
                  {(selectedPatient.allergies || selectedPatient.medications || selectedPatient.bloodType) && (
                    <div className="mt-3 pt-3 border-t border-slate-700/50 space-y-1.5 text-xs">
                      {selectedPatient.allergies && (
                        <div className="flex items-start gap-2">
                          <span className="text-amber-400 font-semibold shrink-0">⚠️ Alergias:</span>
                          <span className="text-slate-300">{selectedPatient.allergies}</span>
                        </div>
                      )}
                      {selectedPatient.medications && (
                        <div className="flex items-start gap-2">
                          <span className="text-blue-400 font-semibold shrink-0">💊 Medicações em curso:</span>
                          <span className="text-slate-300">{selectedPatient.medications}</span>
                        </div>
                      )}
                      {selectedPatient.bloodType && (
                        <div className="flex items-start gap-2">
                          <span className="text-rose-400 font-semibold shrink-0">🩸 Tipo sanguíneo:</span>
                          <span className="text-slate-300">{selectedPatient.bloodType}</span>
                        </div>
                      )}
                    </div>
                  )}
                  {!selectedPatient.allergies && !selectedPatient.medications && !selectedPatient.bloodType && (
                    <div className="mt-3 pt-3 border-t border-slate-700/50 text-xs text-slate-500 italic">
                      Nenhum dado clínico cadastrado (alergias, medicações, tipo sanguíneo).
                      Você pode adicionar via aba Evolução.
                    </div>
                  )}

                  {/* V1.9.119-F: Métricas compactas em LINHA (era 3 cards grandes — agora inline) */}
                  <div className="mt-3 pt-3 border-t border-slate-700/50 flex items-center gap-4 text-xs flex-wrap">
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
                          {/* V1.9.119-F: Grid compacto Especialidade/Unidade/Sala/Encaminhador (era cards grandes) */}
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                            <div className="bg-slate-700/30 rounded-lg p-3 border border-slate-700/50">
                              <p className="text-[10px] font-bold text-slate-500 mb-0.5 uppercase tracking-wider">Especialidade</p>
                              <p className="text-sm font-semibold text-white truncate">{selectedPatient.specialty}</p>
                            </div>
                            <div className="bg-slate-700/30 rounded-lg p-3 border border-slate-700/50">
                              <p className="text-[10px] font-bold text-slate-500 mb-0.5 uppercase tracking-wider">Unidade</p>
                              <p className="text-sm font-semibold text-white truncate">{selectedPatient.clinic}</p>
                            </div>
                            <div className="bg-slate-700/30 rounded-lg p-3 border border-slate-700/50">
                              <p className="text-[10px] font-bold text-slate-500 mb-0.5 uppercase tracking-wider">Sala</p>
                              <p className="text-sm font-semibold text-white truncate">{selectedPatient.room}</p>
                            </div>
                            <div className="bg-slate-700/30 rounded-lg p-3 border border-slate-700/50">
                              <p className="text-[10px] font-bold text-slate-500 mb-0.5 uppercase tracking-wider">Encaminhador</p>
                              <p className="text-sm font-semibold text-white truncate">{selectedPatient.referringDoctor || 'Não informado'}</p>
                            </div>
                          </div>

                          {/* V1.9.119-F: ACDSS COLAPSADO (era card gigante dominando topo) */}
                          {/* Honra heranca TradeVision Core mas nao polui Visao Geral default */}
                          <details className="bg-slate-800/40 border border-slate-700/50 rounded-xl group">
                            <summary className="cursor-pointer px-4 py-2.5 text-xs font-semibold text-slate-300 hover:text-white flex items-center justify-between transition-colors list-none">
                              <span className="flex items-center gap-2">
                                <span className="text-purple-400">🧠</span>
                                Análise Cognitiva (ACDSS) — clique para expandir
                              </span>
                              <span className="text-slate-500 group-open:rotate-180 transition-transform">▾</span>
                            </summary>
                            <div className="px-4 pb-4 pt-2 border-t border-slate-700/50">
                              <IntegratedGovernanceView patientId={selectedPatient.id} />
                            </div>
                          </details>
                          <div className="bg-slate-700/50 rounded-lg p-4">
                            <p className="text-sm text-slate-400 mb-2">Histórico</p>
                            {loadingEvolutions ? (
                              <div className="text-center text-slate-400 py-4">
                                <Clock className="w-6 h-6 mx-auto mb-2 animate-spin" />
                                <p className="text-sm">Carregando histórico...</p>
                              </div>
                            ) : evolutions.length === 0 ? (
                              <p className="text-slate-300">Não há informações para serem exibidas.</p>
                            ) : (
                              <div className="space-y-2 max-h-60 overflow-y-auto">
                                {evolutions.slice(0, 5).map(evolution => (
                                  <div key={evolution.id} className="bg-slate-700/30 rounded-xl p-3 border border-slate-600/50">
                                    <div className="flex items-start justify-between mb-2">
                                      <p className="text-[13px] text-slate-200 font-bold">{evolution.date} • {evolution.time}</p>
                                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${evolution.type === 'current'
                                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                                        : 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                                        }`}>
                                        {evolution.type === 'current' ? 'Atual' : 'Histórico'}
                                      </span>
                                    </div>
                                    <p className="text-sm text-slate-300 line-clamp-2 leading-relaxed mb-1.5">{evolutionContentString(evolution.content, '—')}</p>
                                    <p className="text-[11px] text-slate-500 font-bold uppercase tracking-tight">{evolution.professional}</p>
                                  </div>
                                ))}
                                {evolutions.length > 5 && (
                                  <p className="text-xs text-slate-400 text-center pt-2">
                                    ... e mais {evolutions.length - 5} registro(s). Veja mais na aba "Evolução"
                                  </p>
                                )}
                              </div>
                            )}
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
                            <div className="space-y-4">
                              {evolutions.map(evolution => (
                                <div key={evolution.id} className="bg-slate-700/50 rounded-lg p-4 border border-slate-600">
                                  <div className="flex items-start justify-between mb-2">
                                    <div>
                                      <p className="font-semibold text-white">{evolution.date} • {evolution.time}</p>
                                      <p className="text-xs text-slate-400">{evolution.professional}</p>
                                    </div>
                                    <span className={`px-2 py-1 rounded-full text-xs ${evolution.type === 'current'
                                      ? 'bg-green-500/20 text-green-400'
                                      : 'bg-blue-500/20 text-blue-400'
                                      }`}>
                                      {evolution.type === 'current' ? 'Atual' : 'Histórico'}
                                    </span>
                                  </div>
                                  <p className="text-slate-300 text-sm whitespace-pre-wrap">{evolutionContentString(evolution.content, '—')}</p>
                                </div>
                              ))}
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
                                onClick={() => navigate('/app/scheduling')}
                                className="flex items-center space-x-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
                              >
                                <Plus className="w-4 h-4" />
                                <span>Novo Agendamento</span>
                              </button>
                            </div>

                            {/* KPIs e Agenda de Hoje — dados reais */}
                            <RealAppointmentStats />
                            <RealAgendaHoje />

                            {/* Ações Rápidas */}
                            <div className="flex flex-wrap gap-3">
                              <button
                                onClick={() => navigate('/app/scheduling')}
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

                      {activeTab === 'files' && (
                        <div className="space-y-4">
                          <div className="text-center text-slate-400 py-8">
                            <Archive className="w-12 h-12 mx-auto mb-3 text-slate-600" />
                            <p>Nenhum arquivo anexado</p>
                            <button
                              onClick={handleUploadFiles}
                              className="mt-4 px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:from-purple-600 hover:to-pink-600 transition-colors"
                            >
                              <Upload className="w-5 h-5 inline mr-2" />
                              Upload de Arquivos
                            </button>
                          </div>
                        </div>
                      )}

                      {activeTab === 'receipts' && (
                        <div className="text-center text-slate-400 py-8">
                          <Download className="w-12 h-12 mx-auto mb-3 text-slate-600" />
                          <p>Nenhum recebimento registrado</p>
                        </div>
                      )}

                      {activeTab === 'charts' && (
                        <div className="text-center text-slate-400 py-8">
                          <TrendingUp className="w-12 h-12 mx-auto mb-3 text-slate-600" />
                          <p>Nenhum gráfico disponível</p>
                        </div>
                      )}
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
    </div>
  )
}

export default PatientsManagement
